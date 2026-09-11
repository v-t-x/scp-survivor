import test from "node:test";
import assert from "node:assert/strict";

async function loadMissionViews() {
  const loaded = await import("../src/ui/u3MissionViews.js").catch((loadError) => ({ loadError }));
  assert.equal(loaded.loadError, undefined, "U3 mission view module must exist");
  return loaded;
}

test("pause model projects the live objective, elapsed time, and facility event without mutating the scene", async () => {
  const { createU3PauseModel } = await loadMissionViews();
  const scene = {
    bossPhaseActive: true,
    bossEnemy: { active: true },
    survivalPhaseEnded: true,
    activeFacilityEvent: {
      type: "powerOutage",
      name: "电力故障",
      warning: "备用电源切换"
    },
    getFinalSurvivalTimeSeconds() { return "87.6"; }
  };
  const before = structuredClone({
    bossPhaseActive: scene.bossPhaseActive,
    bossEnemy: scene.bossEnemy,
    survivalPhaseEnded: scene.survivalPhaseEnded,
    activeFacilityEvent: scene.activeFacilityEvent
  });

  assert.deepEqual(createU3PauseModel(scene), {
    objective: "重新收容 SCP-049",
    missionContext: "等待 SCP-049 收容接触",
    elapsedTime: "01:27",
    facilityStatus: "终局收容 // SCP-049 已突破收容",
    facilityTone: "danger"
  });
  assert.deepEqual({
    bossPhaseActive: scene.bossPhaseActive,
    bossEnemy: scene.bossEnemy,
    survivalPhaseEnded: scene.survivalPhaseEnded,
    activeFacilityEvent: scene.activeFacilityEvent
  }, before);
});

test("pause model keeps the existing pre-contact and ordinary mission wording", async () => {
  const { createU3PauseModel } = await loadMissionViews();
  const base = {
    bossPhaseActive: false,
    bossEnemy: null,
    activeFacilityEvent: null,
    getFinalSurvivalTimeSeconds() { return "73.4"; }
  };

  assert.deepEqual(createU3PauseModel({ ...base, survivalPhaseEnded: true }), {
    objective: "重新收容 SCP-049",
    missionContext: "等待 SCP-049 收容接触",
    elapsedTime: "01:13",
    facilityStatus: "设施稳定",
    facilityTone: "contained"
  });
  assert.deepEqual(createU3PauseModel({ ...base, survivalPhaseEnded: false }), {
    objective: "重新收容 SCP-049",
    missionContext: "维持生存 // 等待收容窗口",
    elapsedTime: "01:13",
    facilityStatus: "设施稳定",
    facilityTone: "contained"
  });
});

test("pause model prefers the current phase and cached facility HUD projection", async () => {
  const { createU3PauseModel } = await loadMissionViews();
  const scene = {
    bossPhaseActive: false,
    bossEnemy: null,
    survivalPhaseEnded: false,
    activeFacilityEvent: null,
    _hudPresentation: {
      facility: { expanded: true, title: "设施断电", detail: "应急照明即将失效。" }
    },
    getPhaseHudState() {
      return { phaseLabel: "第三阶段：无人机部署", nextNodeSeconds: 52, missionDetail: null };
    },
    getFinalSurvivalTimeSeconds() { return "128.1"; }
  };

  assert.deepEqual(createU3PauseModel(scene), {
    objective: "重新收容 SCP-049",
    missionContext: "第三阶段：无人机部署 // 下一节点 52 秒",
    elapsedTime: "02:08",
    facilityStatus: "设施断电 // 应急照明即将失效。",
    facilityTone: "warning"
  });
});

test("result models expose exactly four live statistics and never award credits", async () => {
  const { createU3ResultModel } = await loadMissionViews();
  const scene = {
    killCount: 37,
    lastRunCreditsEarned: 42,
    meta: { credits: 314, perks: { vitality: 1 } },
    getFinalSurvivalTimeSeconds() { return "87.6"; },
    awardRunCredits() { throw new Error("the result view must not award credits"); }
  };
  const before = structuredClone({
    killCount: scene.killCount,
    lastRunCreditsEarned: scene.lastRunCreditsEarned,
    meta: scene.meta
  });

  assert.deepEqual(createU3ResultModel(scene, "victory"), {
    type: "victory",
    tone: "success",
    heading: "重新收容确认",
    subtitle: "SCP-049 已重新收容",
    stats: [
      ["生存时间", "01:27"],
      ["击杀", "37"],
      ["当局学分", "+42"],
      ["累计学分", "314"]
    ]
  });
  assert.deepEqual(createU3ResultModel(scene, "failure"), {
    type: "failure",
    tone: "danger",
    heading: "行动终止",
    subtitle: "事故记录已封存",
    stats: [
      ["生存时间", "01:27"],
      ["击杀", "37"],
      ["当局学分", "+42"],
      ["累计学分", "314"]
    ]
  });
  assert.deepEqual({
    killCount: scene.killCount,
    lastRunCreditsEarned: scene.lastRunCreditsEarned,
    meta: scene.meta
  }, before);
});
