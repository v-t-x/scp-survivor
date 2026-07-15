import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { HUD_REGIONS } from "../src/art/openingVisualContract.js";
import { selectTimelineHudContainers } from "../src/ui/hudPresentation.js";

const EVENTS = Object.freeze({ SHUTDOWN: "shutdown", DESTROY: "destroy" });
const REF_NAMES = [
  "statsText", "levelText", "xpBarBackground", "xpBarFill", "xpText",
  "weaponHudText", "phaseText", "muteText", "pauseButton", "pauseButtonLabel",
  "pickupRadiusIndicator", "eventBannerContainer", "eventBannerBg", "eventBannerTitle",
  "eventBannerDetail", "outageDarknessRt", "outageLightSprite"
];

function emitter() {
  const entries = new Map();
  return {
    off(event, listener, context) {
      entries.set(event, (entries.get(event) ?? []).filter((entry) => entry.listener !== listener || entry.context !== context));
      return this;
    },
    once(event, listener, context) {
      entries.set(event, [...(entries.get(event) ?? []), { listener, context }]);
      return this;
    }
  };
}

function display(id, x = 0, y = 0) {
  return {
    id, x, y, active: true, visible: true,
    setText(value) { this.text = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setAlpha() { return this; }, clear() { return this; }, destroy() { this.active = false; }
  };
}

function createView() {
  const regions = Object.fromEntries(
    Object.entries(HUD_REGIONS).map(([name, region]) => [name, { container: display(name, region.x, region.y) }])
  );
  const refs = Object.fromEntries(REF_NAMES.map((name) => [name, display(name)]));
  const calls = { update: [], visible: [], collapsed: [], cue: [], destroy: 0 };
  return {
    objects: [...Object.values(regions).map(({ container }) => container), ...Object.values(refs)],
    regions,
    refs,
    timelineContainers: selectTimelineHudContainers(Object.fromEntries(
      Object.entries(regions).map(([name, value]) => [name, value.container])
    )),
    controls: { pauseHitArea: refs.pauseButton, muteHitArea: refs.muteText },
    calls,
    update(value) { calls.update.push(value); },
    setGameplayVisible(value) { calls.visible.push(value); },
    setFacilityCollapsed(value) { calls.collapsed.push(value); },
    notifyPickupCue(value) { calls.cue.push(value); },
    destroy() { calls.destroy += 1; }
  };
}

async function loadHudMixin({ factory, presentation }) {
  const source = await readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8");
  const declaration = "export const hudMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1);
  const body = source.slice(start).replace(declaration, "const hudMixin =");
  return Function(
    "Phaser", "GAME_WIDTH", "GAME_HEIGHT", "BALANCE", "UPGRADE_DEFINITIONS", "HUD_REGIONS",
    "TEXTURES", "getHudPresentation", "selectTimelineHudContainers", "createTacticalHudView",
    "createStatusLamp", "createTacticalPanel", "THEME", `${body}\nreturn hudMixin;`
  )(
    { Scenes: { Events: EVENTS } }, 960, 540, { audio: { enabled: true }, facility: { events: {} }, player: { dashCooldownMs: 2200 } },
    [], HUD_REGIONS, {}, presentation, selectTimelineHudContainers, factory, () => {}, () => {}, {}
  );
}

function createScene() {
  return {
    children: { list: [] },
    events: emitter(),
    soundMuted: true,
    isPaused: true,
    isMissionActive: true,
    isGameOver: false,
    health: 70,
    maxHealth: 100,
    level: 4,
    currentXp: 6,
    xpToNextLevel: 20,
    killCount: 9,
    elapsedSurvivalMs: 12_345,
    selectedWeaponId: "pistol",
    weapons: { pistol: { id: "pistol" } },
    dashReadyAtMs: 15_000,
    bossPhaseActive: false,
    bossEnemy: null,
    activeFacilityEvent: null,
    pickupRadius: 96,
    buildPanel: { visible: true },
    topBannerState: null,
    getPhaseHudState() {
      return { phaseLabel: "测试阶段", nextNodeSeconds: 12, missionDetail: "测试任务" };
    }
  };
}

test("createUI creates one controller and aliases its exact refs without entering system into corruption targets", async () => {
  const view = createView();
  let constructions = 0;
  const mixin = await loadHudMixin({
    factory() { constructions += 1; return view; },
    presentation() { return { facility: {}, pickup: { nowMs: 0 } }; }
  });
  const scene = createScene();
  Object.assign(scene, mixin);

  scene.createUI();

  assert.equal(constructions, 1);
  assert.strictEqual(scene.tacticalHudView, view);
  for (const name of REF_NAMES) assert.strictEqual(scene[name], view.refs[name]);
  for (const name of ["mission", "facility", "vitals", "weapon", "system"]) {
    assert.strictEqual(scene[`${name}HudContainer`], view.regions[name].container);
  }
  assert.deepEqual(scene.gameplayHudContainers, view.timelineContainers);
  assert.equal(scene.gameplayHudContainers.includes(view.regions.system.container), false);
  assert.deepEqual(scene.timelineHudBasePositions, view.timelineContainers.map((container) => [container, container.x, container.y]));
});

test("update facades build one complete Scene presentation and delegate the same controller", async () => {
  const view = createView();
  const states = [];
  const presentations = [];
  const mixin = await loadHudMixin({
    factory: () => view,
    presentation(state) {
      states.push(state);
      const value = Object.freeze({ facility: Object.freeze({ expanded: false }), pickup: Object.freeze({ nowMs: state.elapsedSurvivalMs }) });
      presentations.push(value);
      return value;
    }
  });
  const scene = createScene();
  Object.assign(scene, mixin);
  scene.createUI();
  states.length = 0;
  presentations.length = 0;
  view.calls.update.length = 0;

  scene.updateUI();

  assert.equal(states.length, 1);
  assert.equal(view.calls.update.length, 1);
  assert.strictEqual(view.calls.update[0], presentations[0]);
  assert.deepEqual(states[0], {
    isMissionActive: true,
    health: 70,
    maxHealth: 100,
    level: 4,
    currentXp: 6,
    xpToNextLevel: 20,
    killCount: 9,
    elapsedSurvivalMs: 12_345,
    selectedWeaponId: "pistol",
    weapon: scene.weapons.pistol,
    dashReadyAtMs: 15_000,
    dashCooldownMs: 2200,
    phaseLabel: "测试阶段",
    nextNodeSeconds: 12,
    missionDetail: "测试任务",
    bossPhaseActive: false,
    bossHealthRatio: 0,
    activeFacilityEvent: null,
    eventBannerActive: false,
    soundMuted: true,
    isPaused: true,
    pickupRadius: 96,
    buildPanelVisible: true
  });

  scene.updateWeaponHud();
  assert.equal(states.length, 2);
  assert.equal(view.calls.update.length, 2);
  assert.strictEqual(view.calls.update[1], presentations[1]);
});

test("legacy facade controls delegate to the controller and pickup cue uses presentation.pickup.nowMs", async () => {
  const view = createView();
  const mixin = await loadHudMixin({
    factory: () => view,
    presentation: (state) => ({ facility: { expanded: false }, pickup: { nowMs: state.elapsedSurvivalMs } })
  });
  const scene = createScene();
  Object.assign(scene, mixin);
  scene.createUI();
  scene.updateUI();

  scene.setGameplayHudVisible(false);
  scene.collapseFacilityHud();
  scene.updatePickupRadiusIndicator();
  scene.soundMuted = false;
  scene.updateMuteText();

  assert.deepEqual(view.calls.visible, [false]);
  assert.deepEqual(view.calls.collapsed, [true]);
  assert.deepEqual(view.calls.cue, [{ reason: "legacy-update", nowMs: 12_345, durationMs: 0 }]);
  assert.equal(view.refs.muteText.text, "音频：开启 (M)");
});

test("partial facility presentation preserves every cached tactical HUD section by identity", async () => {
  const view = createView();
  const mixin = await loadHudMixin({
    factory: () => view,
    presentation: () => ({ facility: {}, pickup: { nowMs: 0 } })
  });
  const scene = createScene();
  Object.assign(scene, mixin);
  scene.createUI();
  view.calls.update.length = 0;

  const cached = Object.freeze({
    mission: Object.freeze({ title: "测试任务" }),
    vitals: Object.freeze({ healthText: "70 / 100" }),
    weapon: Object.freeze({ name: "基金会勤务手枪" }),
    facility: Object.freeze({ title: "设施稳定" }),
    system: Object.freeze({ muteLabel: "音频：静音 (M)" }),
    pickup: Object.freeze({ nowMs: 12_345 })
  });
  const facility = Object.freeze({
    expanded: true,
    title: "收容警报",
    detail: "观察区出现异常读数。",
    tone: "warning"
  });
  scene._hudPresentation = cached;

  scene.applyFacilityHudPresentation(facility);

  assert.equal(view.calls.update.length, 1);
  const merged = view.calls.update[0];
  assert.strictEqual(merged.mission, cached.mission);
  assert.strictEqual(merged.vitals, cached.vitals);
  assert.strictEqual(merged.weapon, cached.weapon);
  assert.strictEqual(merged.facility, facility);
  assert.strictEqual(merged.system, cached.system);
  assert.strictEqual(merged.pickup, cached.pickup);
});

test("source guard keeps main and timeline untouched by the HUD facade migration", async () => {
  const [main, timeline] = await Promise.all([
    readFile(new URL("../src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8")
  ]);
  assert.match(main, /this\.createUI\(\)/);
  assert.match(main, /this\.updatePickupRadiusIndicator\(\)/);
  assert.match(timeline, /for \(const \[target, baseX, baseY\] of this\.timelineHudBasePositions\)/);
  assert.doesNotMatch(timeline, /systemHudContainer/);
});
