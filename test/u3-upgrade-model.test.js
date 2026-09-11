import test from "node:test";
import assert from "node:assert/strict";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import {
  createU3UpgradeDeck,
  createU3UpgradeModel,
  previewU3Upgrade
} from "../src/ui/u3UpgradeModel.js";

function createScene(selectedWeaponId = "pistol") {
  return {
    selectedWeaponId,
    health: 76,
    maxHealth: 100,
    playerMoveSpeed: 220,
    pickupRadius: 56,
    projectileCount: 1,
    bulletPenetration: 0,
    bulletDamage: selectedWeaponId === "tesla" ? 6 : 20,
    shootIntervalMs: selectedWeaponId === "tesla" ? 300 : 280,
    elapsedSurvivalMs: 120_000,
    teslaFieldNextTickAtMs: 0,
    rerollsRemaining: 3,
    pendingLevelUps: 1,
    weapons: {
      pistol: {
        id: "pistol", name: "基金会收容突击步枪", currentLevel: selectedWeaponId === "pistol" ? 3 : 0,
        unlocked: selectedWeaponId === "pistol", damage: 20, cooldownMs: 280
      },
      shotgun: {
        id: "shotgun", name: "基金会收容突破器", currentLevel: selectedWeaponId === "shotgun" ? 2 : 0,
        unlocked: selectedWeaponId === "shotgun", damage: 8, cooldownMs: 1300,
        knockbackStrength: 330, suppressionSlowMultiplier: 1, staggerDurationMs: 320,
        magazineSize: 4, currentShells: 4, reloadDurationMs: 2000
      },
      tesla: {
        id: "tesla", name: "特斯拉收容发射器", currentLevel: selectedWeaponId === "tesla" ? 4 : 0,
        unlocked: selectedWeaponId === "tesla", damage: 6, cooldownMs: 300, chainTargets: 3
      }
    },
    weaponMutations: {
      pistolBoomerang: false,
      breacherExplosive: false,
      teslaField: false
    },
    upgradeLevels: Object.fromEntries(UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])),
    syncCombatStatsFromWeapons() {
      const weapon = this.weapons[this.selectedWeaponId];
      this.bulletDamage = weapon.damage;
      this.shootIntervalMs = weapon.cooldownMs;
    }
  };
}

function upgrade(key) {
  return UPGRADE_DEFINITIONS.find((entry) => entry.key === key);
}

test("Tesla 伤害、攻击节奏与快速放电使用电击图示，不借用弹药或步枪", () => {
  const scene = createScene("tesla");
  const damage = createU3UpgradeModel(scene, upgrade("damage"));
  assert.equal(damage.illustrationKind, "teslaDamage");
  assert.equal(damage.comparison.before, "6");
  assert.equal(damage.comparison.after, "7.2");
  for (const key of ["attackSpeed", "teslaCooldown"]) {
    assert.equal(createU3UpgradeModel(scene, upgrade(key)).illustrationKind, "teslaCadence");
  }
  assert.equal(createU3UpgradeModel(createScene("pistol"), upgrade("damage")).illustrationKind, "damage");
  assert.equal(scene.weapons.tesla.damage, 6);
  assert.equal(scene.weapons.tesla.cooldownMs, 300);
});

test("步枪伤害预览调用真实 apply 得出 20→24，且隔离副本不改写真实局内数据", () => {
  const scene = createScene("pistol");
  const before = structuredClone({
    weapons: scene.weapons,
    bulletDamage: scene.bulletDamage,
    shootIntervalMs: scene.shootIntervalMs
  });

  const preview = previewU3Upgrade(scene, upgrade("damage"));
  const model = createU3UpgradeModel(scene, upgrade("damage"));

  assert.equal(preview.before.weapons.pistol.damage, 20);
  assert.equal(preview.after.weapons.pistol.damage, 24);
  assert.equal(preview.after.bulletDamage, 24, "真实 apply 的同步副作用也必须留在隔离副本");
  assert.deepEqual({
    weapons: scene.weapons,
    bulletDamage: scene.bulletDamage,
    shootIntervalMs: scene.shootIntervalMs
  }, before);
  assert.equal(model.benefitValue, "+20%");
  assert.deepEqual(model.comparison, { label: "每发伤害", before: "20", after: "24", unit: "" });
  assert.equal(model.levelLabel, "武器 Lv 3");
});

test("Tesla 伤害卡保持每跳 6/300ms 口径，只预览伤害 6→7.2", () => {
  const scene = createScene("tesla");
  const model = createU3UpgradeModel(scene, upgrade("damage"));

  assert.equal(model.benefitLabel, "每跳伤害");
  assert.equal(model.benefitValue, "+20%");
  assert.deepEqual(model.comparison, { label: "每跳伤害", before: "6", after: "7.2", unit: "" });
  assert.equal(scene.weapons.tesla.damage, 6);
  assert.equal(scene.weapons.tesla.cooldownMs, 300);
});

test("Tesla 快速放电显示实际封顶值，达到 180ms 后成为不可选封顶卡", () => {
  const scene = createScene("tesla");
  scene.weapons.tesla.cooldownMs = 190;
  let model = createU3UpgradeModel(scene, upgrade("teslaCooldown"));
  assert.equal(model.benefitValue, "-5.3%");
  assert.deepEqual(model.comparison, { label: "结算间隔", before: "190", after: "180", unit: "ms" });
  assert.equal(model.disabled, false);

  scene.weapons.tesla.cooldownMs = BALANCE.weapons.tesla.minCooldownMs;
  model = createU3UpgradeModel(scene, upgrade("teslaCooldown"));
  assert.equal(model.disabled, true);
  assert.equal(model.maxed, true);
  assert.equal(model.statusLabel, "已达上限");
  assert.deepEqual(model.comparison, { label: "结算间隔", before: "180", after: "180", unit: "ms" });
});

test("节奏卡用真实间隔生成图示与节省时间，封顶不承诺继续加速", () => {
  for (const [weaponId,key,before,after] of [
    ['pistol','attackSpeed',280,238], ['pistol','attackSpeed',90,80],
    ['tesla','attackSpeed',300,255], ['tesla','teslaCooldown',200,180]
  ]) {
    const scene=createScene(weaponId);
    scene.weapons[weaponId].cooldownMs=before;
    const model=createU3UpgradeModel(scene,upgrade(key));
    assert.deepEqual(model.cadence,{beforeMs:before,afterMs:after});
    assert.equal(model.benefitLabel,weaponId==='tesla'?'结算间隔缩短':'攻击间隔缩短');
    assert.match(model.description,new RegExp(`少等 ${before-after} ms`));
    if(weaponId==='tesla') assert.doesNotMatch(model.description,/开火/);
    assert.equal(scene.weapons[weaponId].cooldownMs,before);
  }
  for(const weaponId of ['pistol','tesla']) {
    const scene=createScene(weaponId);
    scene.weapons[weaponId].cooldownMs=weaponId==='tesla'?180:80;
    const model=createU3UpgradeModel(scene,upgrade('attackSpeed'));
    assert.equal(model.disabled,true);
    assert.match(model.description,/已达间隔下限/);
    assert.doesNotMatch(model.description,/更快|更密集/);
    assert.equal(model.cadence.beforeMs,model.cadence.afterMs);
  }
});

test("全部当前升级定义都能生成真实前后值与技术图示，包括隐藏的突破器协议", () => {
  for (const selectedWeaponId of ["pistol", "shotgun", "tesla"]) {
    const scene = createScene(selectedWeaponId);
    for (const definition of UPGRADE_DEFINITIONS) {
      if (definition.weaponId && definition.weaponId !== selectedWeaponId) continue;
      const model = createU3UpgradeModel(scene, definition);
      assert.equal(model.key, definition.key);
      assert.ok(model.illustrationKind, `${definition.key} 缺少技术图示约定`);
      assert.ok(model.comparison.label, `${definition.key} 缺少真实对照口径`);
      assert.notEqual(model.comparison.before, undefined);
      assert.notEqual(model.comparison.after, undefined);
    }
  }
});

test("质变预览标记本局一次且不可撤销，激活后不会再次成为可选项", () => {
  const scene = createScene("tesla");
  const definition = upgrade("teslaField");
  const preview = previewU3Upgrade(scene, definition);
  const model = createU3UpgradeModel(scene, definition);

  assert.equal(preview.after.weaponMutations.teslaField, true);
  assert.equal(preview.after.teslaFieldNextTickAtMs, 120_000 + BALANCE.weaponUpgrades.teslaFieldTickMs);
  assert.equal(scene.weaponMutations.teslaField, false);
  assert.equal(scene.teslaFieldNextTickAtMs, 0);
  assert.equal(model.benefitValue, "激活质变");
  assert.equal(model.riskLabel, "本局仅一次 · 不可撤销");
  assert.deepEqual(model.comparison, { label: "协议状态", before: "未激活", after: "已激活", unit: "" });

  scene.weaponMutations.teslaField = true;
  const active = createU3UpgradeModel(scene, definition);
  assert.equal(active.disabled, true);
  assert.equal(active.statusLabel, "已激活");
});

test("生命恢复与跳过都显示受当前上限约束后的真实收益，跳过文案保留最多 +8", () => {
  const scene = createScene("pistol");
  scene.health = 96;
  const heal = createU3UpgradeModel(scene, upgrade("emergencyHeal"));
  const deck = createU3UpgradeDeck(scene, [upgrade("emergencyHeal"), upgrade("maxHealth"), upgrade("damage")]);

  assert.equal(heal.benefitValue, "+4");
  assert.deepEqual(heal.comparison, { label: "当前生命", before: "96", after: "100", unit: "" });
  assert.equal(deck.skipLabel, "跳过（最多 +8 生命）");
  assert.deepEqual(deck.skipComparison, { before: "96", after: "100" });
  assert.equal(deck.rerollLabel, "重抽（剩 3）");
  assert.equal(deck.rerollDisabled, false);
  assert.equal(deck.pendingLabel, "待授权 1 次");
  assert.equal(deck.weaponLabel, "当前武器：基金会收容突击步枪");

  scene.rerollsRemaining = 0;
  assert.equal(createU3UpgradeDeck(scene, []).rerollDisabled, true);
});

test("Tesla 正在锁定带 scene 反向引用的敌人时，升级预览只复制所需标量且不递归运行时对象", () => {
  const scene = createScene("tesla");
  const target = { active: true, scene };
  scene.weapons.tesla.channelTarget = target;
  scene.weapons.tesla.channelTargets = [target];

  const model = createU3UpgradeModel(scene, upgrade("damage"));

  assert.deepEqual(model.comparison, { label: "每跳伤害", before: "6", after: "7.2", unit: "" });
  assert.equal(scene.weapons.tesla.channelTarget, target);
  assert.equal(scene.weapons.tesla.channelTargets[0], target);
});
