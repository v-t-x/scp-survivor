import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as hudPresentation from "../src/ui/hudPresentation.js";

const { getHudPresentation } = hudPresentation;

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
  activeFacilityEvent: null,
  soundMuted: false,
  isPaused: false,
  pickupRadius: 72,
  buildPanelVisible: false
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

test("low-health pistol presentation separates frozen mission, vitals, weapon, facility, system and pickup", () => {
  const view = getHudPresentation(state());

  assert.deepEqual(view.mission, {
    active: true,
    title: "职员感染",
    detail: "下一节点 38秒",
    kills: 7,
    killsText: "击杀 7",
    bossHealthRatio: 0,
    bossActive: false
  });
  assert.equal(view.vitals.healthText, "34 / 100");
  assert.equal(view.vitals.healthRatio, 0.34);
  assert.equal(view.vitals.critical, true);
  assert.equal(view.vitals.levelText, "等级 2");
  assert.equal(view.vitals.xpText, "3 / 12");
  assert.equal(view.vitals.xpRatio, 0.25);
  assert.equal(Number.isFinite(view.vitals.pulseAlpha), true);
  assert.equal(view.vitals.pulseAlpha >= 0 && view.vitals.pulseAlpha <= 1, true);
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
  assert.deepEqual(view.system, {
    muteLabel: "音频：开启 (M)",
    muted: false,
    pauseLabel: "暂停 (ESC)",
    paused: false,
    tone: "danger"
  });
  assert.deepEqual(view.pickup, {
    radius: 72,
    buildPanelVisible: false,
    nowMs: 22000
  });
  assert.deepEqual(Object.keys(view), ["mission", "vitals", "weapon", "facility", "system", "pickup"]);
});

test("normal vitals retain a deterministic elapsed-time-only pulse and normal system tone", () => {
  const normal = getHudPresentation(state({ health: 100, elapsedSurvivalMs: 12_000 }));
  const sameElapsed = getHudPresentation(state({
    health: 1,
    maxHealth: 100,
    elapsedSurvivalMs: 12_000,
    activeFacilityEvent: { type: "powerOutage" },
    soundMuted: true,
    isPaused: true
  }));
  const later = getHudPresentation(state({ health: 100, elapsedSurvivalMs: 12_125 }));

  assert.equal(normal.vitals.critical, false);
  assert.equal(normal.system.tone, "normal");
  assert.equal(normal.vitals.pulseAlpha, sameElapsed.vitals.pulseAlpha);
  assert.notEqual(normal.vitals.pulseAlpha, later.vitals.pulseAlpha);
  assert.equal(Number.isFinite(normal.vitals.pulseAlpha), true);
  assert.equal(normal.vitals.pulseAlpha >= 0 && normal.vitals.pulseAlpha <= 1, true);
});

test("pulse alpha stays finite, deterministic and clamped for invalid elapsed time", async (t) => {
  const cases = [
    ["negative", -1],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["-Infinity", Number.NEGATIVE_INFINITY]
  ];

  for (const [label, elapsedSurvivalMs] of cases) {
    await t.test(label, () => {
      const first = getHudPresentation(state({ elapsedSurvivalMs })).vitals.pulseAlpha;
      const second = getHudPresentation(state({ elapsedSurvivalMs })).vitals.pulseAlpha;
      assert.equal(Number.isFinite(first), true, `${label} produces a finite alpha`);
      assert.equal(first >= 0 && first <= 1, true, `${label} stays within alpha bounds`);
      assert.equal(first, second, `${label} is deterministic`);
    });
  }
});

test("critical health outranks paused, muted and facility warning system tones", () => {
  const view = getHudPresentation(state({
    health: 34,
    isPaused: true,
    soundMuted: true,
    activeFacilityEvent: { type: "powerOutage" }
  }));

  assert.equal(view.vitals.critical, true);
  assert.equal(view.system.tone, "danger");
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
    health: 100,
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
  assert.equal(view.system.tone, "warning");
});

test("a non-outage facility event preserves its detail and warns through the system panel", () => {
  const view = getHudPresentation(state({
    health: 100,
    activeFacilityEvent: {
      type: "containmentAlert",
      name: "收容警报",
      warning: "观察区出现异常读数。"
    }
  }));

  assert.deepEqual(view.facility, {
    expanded: true,
    title: "收容警报",
    detail: "观察区出现异常读数。",
    tone: "warning"
  });
  assert.equal(view.system.tone, "warning");
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
  assert.equal(view.mission.bossActive, true);
  assert.deepEqual(view.facility, {
    expanded: true,
    title: "终局收容",
    detail: "SCP-049 已突破收容",
    tone: "danger"
  });
  assert.equal(view.system.tone, "danger");
});

test("paused and muted scene state produces frozen system controls", () => {
  const muted = getHudPresentation(state({ health: 100, soundMuted: true }));
  const paused = getHudPresentation(state({ health: 100, isPaused: true }));

  assert.deepEqual(muted.system, {
    muteLabel: "音频：静音 (M)",
    muted: true,
    pauseLabel: "暂停 (ESC)",
    paused: false,
    tone: "warning"
  });
  assert.deepEqual(paused.system, {
    muteLabel: "音频：开启 (M)",
    muted: false,
    pauseLabel: "继续 (ESC)",
    paused: true,
    tone: "warning"
  });
});

test("no active mission and no weapon produce neutral presentation", () => {
  const view = getHudPresentation(state({
    isMissionActive: false,
    phaseLabel: "",
    selectedWeaponId: null,
    weapon: null,
    health: 100,
    currentXp: -5,
    xpToNextLevel: 0
  }));

  assert.deepEqual(view.mission, {
    active: false,
    title: "等待任务",
    detail: "尚未开始",
    kills: 7,
    killsText: "击杀 7",
    bossHealthRatio: 0,
    bossActive: false
  });
  assert.equal(view.vitals.healthRatio, 1);
  assert.equal(view.vitals.xpRatio, 0);
  assert.equal(view.weapon.iconKey, null);
  assert.equal(view.weapon.name, "未装备");
  assert.equal(view.weapon.detail, "等待装备");
  assert.equal(view.weapon.statusRatio, 0);
  assert.equal(view.system.tone, "normal");
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
      pickupRadius: Number.POSITIVE_INFINITY,
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
    view.vitals.pulseAlpha,
    view.weapon.statusRatio,
    view.weapon.dashRatio
  ];
  assert.deepEqual([ratios[0], ratios[1], ratios[2], ratios[4], ratios[5]], [1, 1, 1, 0, 0]);
  assert.equal(ratios.every((ratio) => Number.isFinite(ratio) && ratio >= 0 && ratio <= 1), true);
  assert.equal(view.pickup.radius, 0);
  assert.equal(Object.isFrozen(view), true);
  assert.equal(Object.values(view).every((section) => Object.isFrozen(section)), true);
});

test("pickup presentation is a frozen read-only Scene snapshot without cue state or timers", async () => {
  const input = Object.freeze(state({
    elapsedSurvivalMs: 1_234,
    pickupRadius: 96,
    buildPanelVisible: true
  }));
  const before = structuredClone(input);
  const view = getHudPresentation(input);
  const source = await readFile(new URL("../src/ui/hudPresentation.js", import.meta.url), "utf8");

  assert.deepEqual(view.pickup, {
    radius: 96,
    buildPanelVisible: true,
    nowMs: 1234
  });
  assert.deepEqual(input, before);
  assert.doesNotMatch(source, /cueUntil/);
  assert.doesNotMatch(source, /(?:setInterval|setTimeout|addEvent|delayedCall)/);
  assert.doesNotMatch(source, /state\.pickupRadius\s*=/);
});

test("timeline HUD selector excludes system and preserves corruption target order", () => {
  const containers = {
    mission: { id: "mission" },
    vitals: { id: "vitals" },
    weapon: { id: "weapon" },
    facility: { id: "facility" },
    system: { id: "system" }
  };

  assert.equal(typeof hudPresentation.selectTimelineHudContainers, "function");
  const selected = hudPresentation.selectTimelineHudContainers(containers);
  assert.deepEqual(selected, [
    containers.mission,
    containers.vitals,
    containers.weapon,
    containers.facility
  ]);
  assert.equal(selected.includes(containers.system), false);
});

test("HUD integration imports the tactical view and keeps presentation delegation", async () => {
  const [hud, timeline, systems] = await Promise.all([
    readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8")
  ]);
  assert.match(hud, /import \{ createTacticalHudView \} from "\.\.\/ui\/tacticalHudView\.js"/);
  assert.match(hud, /this\.tacticalHudView\s*=\s*view/);
  assert.match(hud, /this\.gameplayHudContainers\s*=\s*\[\.\.\.view\.timelineContainers\]/);
  assert.doesNotMatch(timeline, /this\.phaseText\.setText/);
  assert.match(systems, /this\.collapseFacilityHud\(\)/);

  const updateStart = hud.indexOf("updateUI() {");
  const updateEnd = hud.indexOf("updateWeaponHud() {", updateStart);
  const updateMethod = hud.slice(updateStart, updateEnd);
  assert.match(updateMethod, /getHudPresentation/);
  assert.match(updateMethod, /this\.tacticalHudView\?\.update\?\.\(presentation\)/);
  assert.match(updateMethod, /isMissionActive:\s*this\.isMissionActive\s*&&\s*!this\.isGameOver/);
  assert.doesNotMatch(updateMethod, /\.setText\(|\.setFillStyle\(|\.setVisible\(/);

  const teardownStart = hud.indexOf("teardownHud() {");
  const teardownEnd = hud.indexOf("updateMuteText() {", teardownStart);
  const teardownMethod = hud.slice(teardownStart, teardownEnd);
  assert.doesNotMatch(teardownMethod, /disableInteractive\(/);
});
