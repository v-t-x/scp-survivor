import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { selectTimelineHudContainers } from "../src/ui/hudPresentation.js";

async function loadMixin(relativePath, exportName, dependencies = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const declaration = `export const ${exportName} =`;
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, `${exportName} export must exist`);
  const body = source.slice(start).replace(declaration, `const ${exportName} =`);
  return Function(
    ...Object.keys(dependencies),
    `${body}\nreturn ${exportName};`
  )(...Object.values(dependencies));
}

const [hudMixin, combatMixin] = await Promise.all([
  loadMixin("../src/scene/hud.js", "hudMixin", { selectTimelineHudContainers }),
  loadMixin("../src/scene/combat.js", "combatMixin", { BALANCE })
]);

function runPickup(pickupType, notificationMode = "normal") {
  const events = [];
  const cues = [];
  const pickup = {
    active: true,
    pickupType,
    destroyCalls: 0,
    destroy() {
      events.push("destroy");
      this.destroyCalls += 1;
      this.active = false;
    }
  };
  const scene = {
    health: 40,
    maxHealth: 100,
    elapsedSurvivalMs: 1_250,
    moveSpeedBuffMultiplier: 1,
    activeStimUntilMs: 0,
    soundEvents: [],
    updateCalls: 0,
    updateUI() {
      events.push("update");
      this.updateCalls += 1;
    },
    playSound(key) {
      events.push(`sound:${key}`);
      this.soundEvents.push(key);
    }
  };

  if (notificationMode !== "missing-notification") {
    scene.notifyPickupRadiusCue = hudMixin.notifyPickupRadiusCue;
  }
  if (notificationMode === "normal") {
    scene.tacticalHudView = {
      notifyPickupCue(payload) {
        events.push("notify");
        assert.equal(pickup.active, false, "notification is post-destroy");
        cues.push(payload);
      }
    };
  } else if (notificationMode === "throwing-view") {
    scene.tacticalHudView = {
      notifyPickupCue() {
        events.push("notify-throws");
        throw new Error("presentation unavailable");
      }
    };
  }

  combatMixin.handleSupplyPickupOverlap.call(scene, null, pickup);

  return {
    events,
    cues,
    gameplay: {
      health: scene.health,
      moveSpeedBuffMultiplier: scene.moveSpeedBuffMultiplier,
      activeStimUntilMs: scene.activeStimUntilMs,
      soundEvents: scene.soundEvents,
      updateCalls: scene.updateCalls,
      pickupActive: pickup.active,
      destroyCalls: pickup.destroyCalls
    }
  };
}

test("combat stim commits effect, destroys pickup, then emits a 650ms cue", () => {
  const result = runPickup("combatStim");

  assert.deepEqual(result.events, ["update", "destroy", "notify"]);
  assert.deepEqual(result.cues, [{
    reason: "combatStim",
    nowMs: 1_250,
    durationMs: 650
  }]);
  assert.equal(
    result.gameplay.health,
    Math.min(100, 40 + BALANCE.pickups.combatStim.healAmount)
  );
  assert.equal(result.gameplay.moveSpeedBuffMultiplier, BALANCE.pickups.combatStim.speedMultiplier);
  assert.equal(result.gameplay.activeStimUntilMs, 1_250 + BALANCE.pickups.combatStim.durationMs);
});

test("SCP-500 commits heal, destroys pickup, then emits a 650ms cue", () => {
  const result = runPickup("scp500");

  assert.deepEqual(result.events, ["sound:pickupHeal", "update", "destroy", "notify"]);
  assert.deepEqual(result.cues, [{
    reason: "scp500",
    nowMs: 1_250,
    durationMs: 650
  }]);
  assert.equal(
    result.gameplay.health,
    Math.min(100, 40 + BALANCE.pickups.scp500.healAmount)
  );
});

test("missing notification, missing view, and throwing view preserve pickup gameplay", async (t) => {
  for (const pickupType of ["combatStim", "scp500"]) {
    await t.test(pickupType, () => {
      const baseline = runPickup(pickupType, "normal").gameplay;
      const missingNotification = runPickup(pickupType, "missing-notification").gameplay;
      const missingView = runPickup(pickupType, "missing-view").gameplay;
      const throwingView = runPickup(pickupType, "throwing-view").gameplay;

      assert.deepEqual(missingNotification, baseline);
      assert.deepEqual(missingView, baseline);
      assert.deepEqual(throwingView, baseline);
    });
  }
});

test("HUD pickup notification defaults to Scene time and isolates view failures", () => {
  const calls = [];
  const scene = {
    elapsedSurvivalMs: 4_200,
    tacticalHudView: {
      notifyPickupCue(payload) {
        calls.push(payload);
      }
    }
  };

  assert.equal(typeof hudMixin.notifyPickupRadiusCue, "function");
  hudMixin.notifyPickupRadiusCue.call(scene, "radius-change");
  assert.deepEqual(calls, [{ reason: "radius-change", nowMs: 4_200, durationMs: 650 }]);

  scene.tacticalHudView.notifyPickupCue = () => {
    throw new Error("view failed");
  };
  assert.doesNotThrow(() => hudMixin.notifyPickupRadiusCue.call(scene, "scp500", 5_000));
  delete scene.tacticalHudView;
  assert.doesNotThrow(() => hudMixin.notifyPickupRadiusCue.call(scene, "combatStim", 5_100));
});

test("legacy and noop fallbacks cannot leave a permanent pickup ring", () => {
  const pickupGraphic = {
    visible: true,
    clearCalls: 0,
    setVisible(value) { this.visible = value; return this; },
    clear() { this.clearCalls += 1; return this; }
  };
  const display = () => ({ visible: true, setVisible(value) { this.visible = value; return this; } });
  const scene = {
    collectHudObjectsSince() { return []; },
    createNoopHudView: hudMixin.createNoopHudView,
    missionHudContainer: display(),
    facilityHudContainer: display(),
    vitalsHudContainer: display(),
    weaponHudContainer: display(),
    statsText: display(),
    levelText: display(),
    xpBarBackground: display(),
    xpBarFill: display(),
    xpText: display(),
    weaponHudText: display(),
    phaseText: display(),
    muteText: display(),
    pauseButton: display(),
    pauseButtonLabel: display(),
    pickupRadiusIndicator: pickupGraphic,
    eventBannerContainer: display(),
    eventBannerBg: display(),
    eventBannerTitle: display(),
    eventBannerDetail: display(),
    outageDarknessRt: display(),
    outageLightSprite: display()
  };

  const legacy = hudMixin.createLegacyHudView.call(scene, new Set());
  legacy.setGameplayVisible(true);
  legacy.notifyPickupCue({ nowMs: 100, durationMs: 650 });
  assert.equal(pickupGraphic.visible, false);
  assert.equal(pickupGraphic.clearCalls > 0, true);

  const noop = hudMixin.createNoopHudView.call({});
  assert.doesNotThrow(() => noop.notifyPickupCue({ nowMs: 100, durationMs: 650 }));
  assert.equal(noop.refs.pickupRadiusIndicator.visible, false);
});
