import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getHudPresentation } from "../src/ui/hudPresentation.js";

const BASE_STATE = Object.freeze({
  isMissionActive: true,
  health: 34,
  maxHealth: 100,
  level: 2,
  currentXp: 3,
  xpToNextLevel: 12,
  killCount: 7,
  elapsedSurvivalMs: 22000,
  selectedWeaponId: "pistol",
  weapon: Object.freeze({
    id: "pistol",
    name: "基金会勤务手枪",
    currentLevel: 1,
    damage: 20,
    cooldownMs: 280,
    nextAttackAtMs: 0
  }),
  dashReadyAtMs: 0,
  dashCooldownMs: 2200,
  phaseLabel: "职员感染",
  nextNodeSeconds: 38,
  bossPhaseActive: false,
  bossHealthRatio: 0,
  activeFacilityEvent: null
});

function state(overrides = {}) {
  return {
    ...BASE_STATE,
    ...overrides,
    weapon: overrides.weapon === undefined
      ? { ...BASE_STATE.weapon }
      : overrides.weapon
  };
}

test("pistol mission presentation separates mission, vitals, weapon and stable facility", () => {
  const view = getHudPresentation(state());

  assert.deepEqual(view.mission, {
    active: true,
    title: "职员感染",
    detail: "下一节点 38秒",
    kills: 7,
    killsText: "击杀 7",
    bossHealthRatio: 0
  });
  assert.equal(view.vitals.healthText, "34 / 100");
  assert.equal(view.vitals.healthRatio, 0.34);
  assert.equal(view.vitals.critical, true);
  assert.equal(view.vitals.levelText, "等级 2");
  assert.equal(view.vitals.xpText, "3 / 12");
  assert.equal(view.vitals.xpRatio, 0.25);
  assert.equal(view.weapon.iconKey, "weapon-pistol-icon");
  assert.equal(view.weapon.name, "基金会勤务手枪");
  assert.equal(view.weapon.statusText, "射速 3.57/秒");
  assert.equal(view.weapon.statusRatio, 1);
  assert.equal(view.weapon.dashReady, true);
  assert.equal(view.weapon.dashText, "闪避 就绪");
  assert.equal(view.weapon.dashRatio, 1);
  assert.deepEqual(view.facility, {
    expanded: false,
    title: "设施稳定",
    detail: "SITE-CN // 收容系统在线",
    tone: "contained"
  });
});

test("shotgun presentation reads reload and dash deadlines without changing them", () => {
  const input = state({
    elapsedSurvivalMs: 1000,
    selectedWeaponId: "shotgun",
    weapon: Object.freeze({
      id: "shotgun",
      name: "收容突破器",
      currentLevel: 2,
      damage: 14,
      pelletCount: 6,
      currentShells: 0,
      magazineSize: 4,
      isReloading: true,
      reloadEndAtMs: 2500,
      reloadDurationMs: 2000
    }),
    dashReadyAtMs: 2100,
    dashCooldownMs: 2200
  });
  const before = structuredClone(input);

  const view = getHudPresentation(input);

  assert.equal(view.weapon.iconKey, "weapon-breacher-icon");
  assert.equal(view.weapon.statusText, "装填 1.5秒");
  assert.equal(view.weapon.statusRatio, 0.25);
  assert.equal(view.weapon.statusTone, "warning");
  assert.equal(view.weapon.detail, "等级 2 · 弹丸 6");
  assert.equal(view.weapon.dashReady, false);
  assert.equal(view.weapon.dashText, "闪避 冷却 1.1秒");
  assert.equal(view.weapon.dashRatio, 0.5);
  assert.deepEqual(input, before);
});

test("shotgun ammo ratio is clamped while not reloading", () => {
  const view = getHudPresentation(state({
    selectedWeaponId: "shotgun",
    weapon: {
      id: "shotgun",
      name: "收容突破器",
      currentLevel: 1,
      damage: 14,
      pelletCount: 6,
      currentShells: 9,
      magazineSize: 4,
      isReloading: false,
      reloadEndAtMs: 0,
      reloadDurationMs: 2000
    }
  }));

  assert.equal(view.weapon.statusText, "弹药 9 / 4");
  assert.equal(view.weapon.statusRatio, 1);
  assert.equal(view.weapon.statusTone, "contained");
});

test("Tesla presentation reads its existing attack cooldown", () => {
  const view = getHudPresentation(state({
    elapsedSurvivalMs: 1000,
    selectedWeaponId: "tesla",
    weapon: {
      id: "tesla",
      name: "便携式特斯拉投射器",
      currentLevel: 3,
      damage: 18,
      chainTargets: 4,
      cooldownMs: 1000,
      nextAttackAtMs: 1750
    }
  }));

  assert.equal(view.weapon.iconKey, "weapon-tesla-icon");
  assert.equal(view.weapon.statusText, "放电冷却 0.8秒");
  assert.equal(view.weapon.statusRatio, 0.25);
  assert.equal(view.weapon.statusTone, "warning");
  assert.equal(view.weapon.detail, "等级 3 · 链击 4");
});

test("power outage expands the facility warning", () => {
  const view = getHudPresentation(state({
    activeFacilityEvent: {
      type: "powerOutage",
      name: "电力故障",
      warning: "电力系统不稳定，应急照明即将失效。"
    }
  }));

  assert.deepEqual(view.facility, {
    expanded: true,
    title: "设施断电",
    detail: "电力系统不稳定，应急照明即将失效。",
    tone: "warning"
  });
});

test("Boss phase overrides the mission and facility warnings", () => {
  const view = getHudPresentation(state({
    phaseLabel: "终局：SCP-049",
    nextNodeSeconds: 0,
    bossPhaseActive: true,
    bossHealthRatio: 0.42,
    activeFacilityEvent: {
      type: "powerOutage",
      warning: "电力系统不稳定。"
    }
  }));

  assert.equal(view.mission.detail, "终局：收容 SCP-049 · Boss 生命 42%");
  assert.equal(view.mission.bossHealthRatio, 0.42);
  assert.deepEqual(view.facility, {
    expanded: true,
    title: "终局收容",
    detail: "SCP-049 已突破收容",
    tone: "danger"
  });
});

test("no active mission and unknown weapon produce neutral presentation", () => {
  const view = getHudPresentation(state({
    isMissionActive: false,
    phaseLabel: "",
    selectedWeaponId: "unknown",
    weapon: null,
    health: -20,
    currentXp: -5,
    xpToNextLevel: 0
  }));

  assert.deepEqual(view.mission, {
    active: false,
    title: "等待任务",
    detail: "尚未开始",
    kills: 7,
    killsText: "击杀 7",
    bossHealthRatio: 0
  });
  assert.equal(view.vitals.healthRatio, 0);
  assert.equal(view.vitals.xpRatio, 0);
  assert.equal(view.weapon.iconKey, null);
  assert.equal(view.weapon.name, "未识别武器");
  assert.equal(view.weapon.detail, "状态不可用");
  assert.equal(view.weapon.statusRatio, 0);
});

test("every ratio is clamped and the frozen result never mutates frozen input", () => {
  const input = Object.freeze({
    ...state({
      health: 150,
      currentXp: 99,
      xpToNextLevel: 10,
      elapsedSurvivalMs: 0,
      bossPhaseActive: true,
      bossHealthRatio: 4,
      dashReadyAtMs: 5000,
      dashCooldownMs: 0,
      selectedWeaponId: "tesla",
      weapon: Object.freeze({
        id: "tesla",
        name: "Tesla",
        currentLevel: 1,
        damage: 1,
        chainTargets: 1,
        cooldownMs: 0,
        nextAttackAtMs: 5000
      })
    })
  });

  const view = getHudPresentation(input);
  const ratios = [
    view.mission.bossHealthRatio,
    view.vitals.healthRatio,
    view.vitals.xpRatio,
    view.weapon.statusRatio,
    view.weapon.dashRatio
  ];
  assert.deepEqual(ratios, [1, 1, 1, 0, 0]);
  assert.equal(ratios.every((ratio) => ratio >= 0 && ratio <= 1), true);
  assert.equal(Object.isFrozen(view), true);
  assert.equal(Object.isFrozen(view.weapon), true);
  assert.equal(Object.isFrozen(view.facility), true);
});

test("HUD integration keeps compatibility aliases inside four tactical containers", async () => {
  const [hud, timeline, systems] = await Promise.all([
    readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8")
  ]);
  for (const name of ["mission", "vitals", "weapon", "facility"]) {
    assert.match(hud, new RegExp(`this\\.${name}HudContainer\\s*=\\s*this\\.add\\.container\\(HUD_REGIONS\\.${name}\\.x, HUD_REGIONS\\.${name}\\.y\\)`));
  }
  assert.match(hud, /createTacticalPanel/);
  assert.match(hud, /this\.gameplayHudContainers\s*=\s*\[/);
  assert.match(hud, /this\.weaponIcon\s*=\s*this\.add\.image\(/);
  assert.match(hud, /this\.statsText\s*=\s*this\.healthValueText/);
  assert.match(hud, /this\.phaseText\s*=\s*this\.missionDetailText/);
  assert.doesNotMatch(timeline, /this\.phaseText\.setText/);
  assert.match(systems, /this\.collapseFacilityHud\(\)/);

  const updateStart = hud.indexOf("updateUI() {");
  const updateEnd = hud.indexOf("updateWeaponHud() {", updateStart);
  const updateMethod = hud.slice(updateStart, updateEnd);
  assert.match(updateMethod, /getHudPresentation/);
  assert.match(updateMethod, /applyHudPresentation/);
  assert.match(updateMethod, /isMissionActive:\s*this\.isMissionActive\s*&&\s*!this\.isGameOver/);
  assert.doesNotMatch(updateMethod, /\.setText\(|\.setFillStyle\(|\.setVisible\(/);

  const applyStart = hud.indexOf("applyHudPresentation(presentation) {");
  const applyEnd = hud.indexOf("applyFacilityHudPresentation", applyStart);
  const applyMethod = hud.slice(applyStart, applyEnd);
  assert.match(applyMethod, /container\.setVisible\(mission\.active\)/);

  const teardownStart = hud.indexOf("teardownHud() {");
  const teardownEnd = hud.indexOf("updateMuteText() {", teardownStart);
  const teardownMethod = hud.slice(teardownStart, teardownEnd);
  assert.doesNotMatch(teardownMethod, /disableInteractive\(/);
});
