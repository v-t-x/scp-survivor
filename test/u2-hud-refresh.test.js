import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { getHudPresentation } from "../src/ui/hudPresentation.js";
import { menusMixin } from "../src/scene/menus.js";

async function loadHudMixin(audioEnabled = true) {
  // Phaser needs a browser; load the real mixin body with only its data dependencies.
  const source = await readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8");
  const declaration = "export const hudMixin =";
  const body = source.slice(source.indexOf(declaration)).replace(declaration, "const hudMixin =");
  return Function("BALANCE", "getHudPresentation", `${body}\nreturn hudMixin;`)(
    { ...BALANCE, audio: { ...BALANCE.audio, enabled: audioEnabled } },
    getHudPresentation
  );
}

function display() {
  return {
    visible: false,
    alpha: 1,
    text: "",
    setText(value) { this.text = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setAlpha(value) { this.alpha = value; return this; }
  };
}

async function createScene({ audioEnabled = true, legacy = false } = {}) {
  const scene = {
    ...menusMixin,
    ...await loadHudMixin(audioEnabled),
    isMissionActive: true,
    isGameOver: false,
    isLevelUpActive: false,
    isPaused: false,
    soundMuted: false,
    health: 76,
    maxHealth: 100,
    level: 4,
    currentXp: 9,
    xpToNextLevel: 23,
    killCount: 37,
    elapsedSurvivalMs: 128_000,
    selectedWeaponId: "pistol",
    weapons: { pistol: { name: "测试步枪", currentLevel: 1, damage: 20, cooldownMs: 300 } },
    dashReadyAtMs: 0,
    bossPhaseActive: false,
    bossEnemy: null,
    activeFacilityEvent: null,
    pickupRadius: 72,
    buildPanel: { visible: false },
    topBannerState: null,
    muteText: display(),
    eventBannerContainer: display(),
    eventBannerBg: display(),
    eventBannerTitle: display(),
    eventBannerDetail: display(),
    getPhaseHudState() { return { phaseLabel: "职员感染", nextNodeSeconds: 52 }; },
    pauseGameplaySystems() { this.physicsPaused = true; },
    resumeGameplaySystems() { this.physicsPaused = false; },
    showPauseOverlay() { this.overlayVisible = true; },
    hidePauseOverlay() { this.overlayVisible = false; }
  };
  scene.tacticalHudView = {
    ...(legacy ? { mode: "legacy" } : {}),
    update(presentation) {
      scene.eventBannerTitle.setText(presentation.facility.title);
      scene.eventBannerDetail.setText(presentation.facility.detail);
      scene.eventBannerContainer.setVisible(presentation.facility.expanded);
      scene.eventBannerDetail.setVisible(presentation.facility.expanded);
    },
    setFacilityCollapsed() {},
    ...(legacy ? {} : { setTopBannerActive(value) { scene.topBannerVisualActive = value; } })
  };
  scene.updateUI();
  return scene;
}

test("pause and resume immediately reproject HUD state without advancing survival time", async () => {
  const scene = await createScene();

  scene.togglePause();

  assert.equal(scene.isPaused, true);
  assert.equal(scene.physicsPaused, true);
  assert.equal(scene.overlayVisible, true);
  assert.equal(scene._hudPresentation.system.paused, true);
  assert.equal(scene._hudPresentation.system.pauseLabel, "继续 (ESC)");
  assert.equal(scene._hudPresentation.pickup.nowMs, 128_000);

  scene.togglePause();

  assert.equal(scene.isPaused, false);
  assert.equal(scene.physicsPaused, false);
  assert.equal(scene.overlayVisible, false);
  assert.equal(scene._hudPresentation.system.paused, false);
  assert.equal(scene._hudPresentation.system.pauseLabel, "暂停 (ESC)");
  assert.equal(scene.elapsedSurvivalMs, 128_000);
});

test("a failed pause overlay refreshes the recovered running state", async () => {
  const scene = await createScene();
  scene.showPauseOverlay = menusMixin.showPauseOverlay;
  // Missing scene.add exercises the existing controller-construction recovery.
  scene.pauseGame();

  assert.equal(scene.isPaused, false);
  assert.equal(scene.physicsPaused, false);
  assert.equal(scene.pauseOverlay, null);
  assert.equal(scene._hudPresentation.system.paused, false);
  assert.equal(scene._hudPresentation.pickup.nowMs, 128_000);
});

test("mute changes reproject the existing paused state while the update loop is stopped", async () => {
  const scene = await createScene();
  scene.isPaused = true;
  scene.updateUI();

  scene.soundMuted = true;
  scene.updateMuteText();

  assert.equal(scene._hudPresentation.system.muted, true);
  assert.equal(scene._hudPresentation.system.paused, true);
  assert.equal(scene._hudPresentation.pickup.nowMs, 128_000);

  scene.soundMuted = false;
  scene.updateMuteText();
  assert.equal(scene._hudPresentation.system.muted, false);
  assert.equal(scene.isPaused, true);
  assert.equal(scene.elapsedSurvivalMs, 128_000);
});

test("audio-disabled refresh still updates the complete HUD without changing mute semantics", async () => {
  const scene = await createScene({ audioEnabled: false });
  scene.isPaused = true;

  scene.updateMuteText();

  assert.equal(scene.muteText.text, "音频：关闭");
  assert.equal(scene._hudPresentation.system.paused, true);
  assert.equal(scene._hudPresentation.system.muted, false);
  assert.equal(scene.soundMuted, false);
});

test("legacy mute text keeps its direct update path", async () => {
  const scene = await createScene({ legacy: true });
  const previousProjection = scene._hudPresentation;
  scene.soundMuted = true;

  scene.updateMuteText();

  assert.equal(scene.muteText.text, "音频：静音 (M)");
  assert.strictEqual(scene._hudPresentation, previousProjection);
});

test("temporary notification expands the shared facility slot until the original expiry", async () => {
  const scene = await createScene();
  scene.showTopBanner("电力恢复", "备用电源已接入。", 1400);

  assert.equal(scene.topBannerState.expiresAtMs, 129_400);
  assert.equal(scene.topBannerVisualActive, true);
  assert.equal(scene.eventBannerTitle.text, "电力恢复");
  assert.equal(scene.eventBannerDetail.visible, true);

  scene.elapsedSurvivalMs = 129_120;
  scene.updateTopBanner();
  assert.equal(scene.eventBannerContainer.alpha, 1);
  scene.elapsedSurvivalMs = 129_260;
  scene.updateTopBanner();
  assert.equal(scene.eventBannerContainer.alpha, 0.5);

  scene.elapsedSurvivalMs = 129_400;
  scene.updateTopBanner();
  assert.equal(scene.topBannerState, null);
  assert.equal(scene.topBannerVisualActive, false);
  assert.equal(scene.eventBannerContainer.alpha, 1);
  assert.equal(scene.eventBannerTitle.text, "设施稳定");
  assert.equal(scene.eventBannerDetail.visible, false);
});

test("notification expiry restores the current Boss-priority projection over an outage", async () => {
  const scene = await createScene();
  scene.showTopBanner("医疗补给", "应急医疗箱已投送。", 2400);
  scene.activeFacilityEvent = { type: "powerOutage" };
  scene.bossPhaseActive = true;
  scene.bossEnemy = { active: true, health: 62, maxHealth: 100 };
  scene.elapsedSurvivalMs = 130_400;

  scene.updateTopBanner();

  assert.equal(scene.topBannerState, null);
  assert.equal(scene.eventBannerTitle.text, "终局收容");
  assert.equal(scene.eventBannerDetail.text, "SCP-049 已突破收容");
  assert.equal(scene.eventBannerContainer.visible, true);
  assert.equal(scene._hudPresentation.mission.bossHealthRatio, 0.62);
  assert.equal(scene._hudPresentation.mission.bossActive, true);
});

test("notification expiry remains safe for the legacy view without the new hook", async () => {
  const scene = await createScene({ legacy: true });
  scene.showTopBanner("任务广播", "广播测试", 1500);
  scene.elapsedSurvivalMs = 129_500;

  scene.updateTopBanner();

  assert.equal(scene.topBannerState, null);
  assert.equal(scene.eventBannerContainer.visible, false);
  assert.equal(scene.eventBannerContainer.alpha, 1);
});
