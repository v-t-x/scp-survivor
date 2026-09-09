import test from "node:test";
import assert from "node:assert/strict";
import {
  getArmoryPresentation,
  getPerkStorePresentation
} from "../src/ui/stage1MenuPresentation.js";
import { TEXTURES } from "../src/assets/manifest.js";

function assertFrozenPrimitiveGraph(value) {
  if (value === null) {
    return;
  }

  if (Array.isArray(value)) {
    assert.equal(Object.isFrozen(value), true);
    for (const item of value) {
      assertFrozenPrimitiveGraph(item);
    }
    return;
  }

  if (value !== null && typeof value === "object") {
    assert.equal(Object.isFrozen(value), true);
    for (const item of Object.values(value)) {
      assertFrozenPrimitiveGraph(item);
    }
    return;
  }

  assert.equal(["string", "number", "boolean", "undefined"].includes(typeof value), true);
}

test("perk store projection distinguishes owned available and insufficient without mutating meta", () => {
  const meta = {
    credits: 150,
    perks: { startMaxHealth: true }
  };
  const before = structuredClone(meta);
  const view = getPerkStorePresentation(meta);

  assert.equal(view.creditsValue, 150);
  assert.equal(view.creditsLabel, "可用学分 // 150");
  assert.equal(view.ownedCount, 1);
  assert.equal(view.totalCount, 4);
  assert.equal(view.completionState, "incomplete");
  assert.deepEqual(
    view.items.map(({ key, state, statusLabel }) => [key, state, statusLabel]),
    [
      ["startMaxHealth", "owned", "已授权"],
      ["startMoveSpeed", "available", "可授权"],
      ["startDamage", "insufficient", "学分不足"],
      ["startPickupRadius", "available", "可授权"]
    ]
  );
  assert.deepEqual(meta, before);
  assertFrozenPrimitiveGraph(view);
});

test("perk store normalizes invalid credits without NaN Infinity or a negative shortage", () => {
  for (const credits of [Number.NaN, Number.NEGATIVE_INFINITY, -50]) {
    const view = getPerkStorePresentation({ credits, perks: {} });
    const copy = JSON.stringify(view);
    assert.doesNotMatch(copy, /NaN|Infinity|还需 -/);
    assert.equal(view.creditsValue, 0);
    assert.equal(view.creditsLabel, "可用学分 // 0");
  }
});

test("perk store treats non-finite and non-number credits as a zero balance", () => {
  for (const credits of [Number.POSITIVE_INFINITY, "150"]) {
    const view = getPerkStorePresentation({ credits, perks: {} });

    assert.equal(view.creditsValue, 0);
    assert.equal(view.creditsLabel, "可用学分 // 0");
    assert.equal(view.items.every(({ state }) => state === "insufficient"), true);
    assert.equal(view.items.some(({ actionLabel }) => /^授权 \d+$/.test(actionLabel)), false);
  }
});

test("perk store keeps zero balance and complete ownership as explicit states", () => {
  const zero = getPerkStorePresentation({ credits: 0, perks: {} });
  assert.equal(zero.items.every(({ state }) => state === "insufficient"), true);
  assert.equal(zero.items.every(({ missingCredits }) => missingCredits > 0), true);

  const complete = getPerkStorePresentation({
    credits: 0,
    perks: {
      startMaxHealth: true,
      startMoveSpeed: true,
      startDamage: true,
      startPickupRadius: true
    }
  });
  assert.equal(complete.completionState, "complete");
  assert.equal(complete.ownedCount, 4);
  assert.equal(complete.items.every(({ actionLabel }) => actionLabel === "已授权"), true);
});

test("armory projection exposes only allowlisted weapons and gates deploy by pending selection", () => {
  const idle = getArmoryPresentation({
    meta: { credits: 896, perks: {} },
    pendingSelectedWeaponId: null,
    hoveredWeaponId: null
  });
  assert.deepEqual(idle.slots.map(({ id }) => id), ["pistol", "tesla"]);
  assert.equal(idle.canDeploy, false);
  assert.equal(idle.deployLabel, "请选择武器");
  assert.equal(idle.siteCode, "SITE-CN-03");

  const selected = getArmoryPresentation({
    meta: { credits: 896, perks: {} },
    pendingSelectedWeaponId: "tesla",
    hoveredWeaponId: "pistol"
  });
  assert.equal(selected.selectedWeaponId, "tesla");
  assert.equal(selected.canDeploy, true);
  assert.match(selected.deployLabel, /^开始任务 \/\//);
  assert.deepEqual(
    selected.slots.map(({ id, state }) => [id, state]),
    [["pistol", "hover"], ["tesla", "selected"]]
  );
  assert.equal(selected.slots.some(({ id }) => id === "shotgun"), false);
  assert.deepEqual(selected.slots.map(({ id, textureKey }) => [id, textureKey]), [
    ["pistol", TEXTURES.weaponPistolIcon],
    ["tesla", TEXTURES.weaponTeslaIcon]
  ]);
  assert.deepEqual(
    selected.slots.find(({ id }) => id === "tesla").stats,
    [
      { label: "每跳伤害", value: "6" },
      { label: "伤害间隔", value: "300 ms" },
      { label: "链击", value: "3" }
    ]
  );
  assertFrozenPrimitiveGraph(selected);
});

test("quartermaster projection maps existing icons and exposes physical action semantics", () => {
  const view = getPerkStorePresentation({
    credits: 150,
    perks: { startMaxHealth: true }
  });

  assert.equal(view.creditsDisplayLabel, "可用学分 150");
  assert.equal(view.progressDisplayLabel, "授权进度 1/4");
  assert.equal(view.creditsLabel, "可用学分 // 150");

  assert.deepEqual(
    view.items.map((item) => ({
      key: item.key,
      textureKey: item.textureKey,
      fallbackTextureKey: item.fallbackTextureKey,
      detailLabel: item.detailLabel,
      actionKind: item.actionKind,
      interactive: item.interactive,
      tone: item.tone,
      statusSymbol: item.statusSymbol
    })),
    [
      {
        key: "startMaxHealth",
        textureKey: TEXTURES.u1PerkArmor,
        fallbackTextureKey: TEXTURES.upgradeMaxHealth,
        detailLabel: "总价 150",
        actionKind: "stamp",
        interactive: false,
        tone: "contained",
        statusSymbol: "check"
      },
      {
        key: "startMoveSpeed",
        textureKey: TEXTURES.u1PerkMobility,
        fallbackTextureKey: TEXTURES.upgradeMoveSpeed,
        detailLabel: "总价 150",
        actionKind: "button",
        interactive: true,
        tone: "warning",
        statusSymbol: "unlock"
      },
      {
        key: "startDamage",
        textureKey: TEXTURES.u1PerkArmoryAuth,
        fallbackTextureKey: TEXTURES.upgradeDamage,
        detailLabel: "总价 250 · 还需 100",
        actionKind: "copy",
        interactive: false,
        tone: "disabled",
        statusSymbol: "lock"
      },
      {
        key: "startPickupRadius",
        textureKey: TEXTURES.u1PerkRecoveryBeacon,
        fallbackTextureKey: TEXTURES.upgradePickupRadius,
        detailLabel: "总价 120",
        actionKind: "button",
        interactive: true,
        tone: "warning",
        statusSymbol: "unlock"
      }
    ]
  );
  assert.equal(Object.isFrozen(view.items[0]), true);
  assert.equal(view.chassisTextureKey, TEXTURES.u1QuartermasterChassis);
  assert.equal(view.chassisFallbackTextureKey, null);
  assert.deepEqual(view.stateAtlas, {
    textureKey: TEXTURES.u1StateParts,
    frames: {
      check: "status-check",
      unlock: "status-unlock",
      lock: "status-lock",
      forward: "action-forward",
      purchase: "action-purchase",
      authorized: "stamp-authorized",
      warningLamp: "lamp-warning",
      containedLamp: "lamp-contained"
    }
  });
  assert.deepEqual(view.items.map(({ stateFrame }) => stateFrame), [
    "status-check",
    "status-unlock",
    "status-lock",
    "status-unlock"
  ]);
  assertFrozenPrimitiveGraph(view);
});

test("armory projection drives selector showcase dossier and deploy from one pending selection", () => {
  const idle = getArmoryPresentation({
    meta: { credits: 0, perks: {} },
    pendingSelectedWeaponId: null
  });
  assert.equal(idle.creditsDisplayLabel, "可用学分 0");
  assert.equal(idle.authorizationEntryLabel, "永久授权 0/4  >");
  assert.equal(idle.chassisTextureKey, TEXTURES.u1ArmoryChassis);
  assert.equal(idle.chassisFallbackTextureKey, TEXTURES.armoryRackBackdrop);
  assert.deepEqual(idle.showcase, { state: "empty", textureKey: null, fallbackTextureKey: null });
  assert.deepEqual(idle.dossier, {
    state: "empty",
    name: "",
    statusLabel: "未选择",
    stats: []
  });
  assert.deepEqual(idle.deploy, {
    state: "disabled",
    label: "部署",
    symbol: "lock"
  });
  assert.equal(idle.perkProgressLabel, "永久授权 // 0/4");
  assert.equal(idle.deployLabel, "请选择武器");

  const selected = getArmoryPresentation({
    meta: { credits: 0, perks: {} },
    pendingSelectedWeaponId: "tesla"
  });
  assert.deepEqual(selected.showcase, {
    state: "selected",
    textureKey: TEXTURES.u1TeslaHero,
    fallbackTextureKey: TEXTURES.weaponTeslaIcon
  });
  assert.equal(selected.dossier.name, "特斯拉收容发射器");
  assert.equal(selected.dossier.statusLabel, "已选定");
  assert.deepEqual(
    selected.dossier.stats.map(({ label, value }) => [label, value]),
    [["每跳伤害", "6"], ["伤害间隔", "300 ms"], ["链击", "3"]]
  );
  assert.deepEqual(selected.deploy, {
    state: "armed",
    label: "开始任务",
    symbol: "forward"
  });
  assert.equal(selected.deployLabel, "开始任务 // 特斯拉收容发射器");
  assert.equal(Object.isFrozen(selected.dossier), true);
  assert.equal(Object.isFrozen(selected.dossier.stats), true);

  const pistol = getArmoryPresentation({
    meta: { credits: 0, perks: {} },
    pendingSelectedWeaponId: "pistol"
  });
  assert.deepEqual(pistol.showcase, {
    state: "selected",
    textureKey: TEXTURES.u1RifleHero,
    fallbackTextureKey: TEXTURES.weaponPistolIcon
  });
});
