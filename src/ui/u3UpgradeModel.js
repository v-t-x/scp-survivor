import { BALANCE } from "../config/balance.js";

const ILLUSTRATIONS = Object.freeze({
  damage: "damage",
  attackSpeed: "cadence",
  moveSpeed: "movement",
  maxHealth: "health",
  projectileCount: "projectiles",
  penetration: "penetration",
  pickupRadius: "pickup",
  emergencyHeal: "heal",
  breacherKnockback: "interruption",
  breacherSuppression: "interruption",
  breacherMagazine: "projectiles",
  teslaChains: "chains",
  teslaCooldown: "cadence",
  pistolBoomerang: "boomerang",
  breacherExplosive: "field",
  teslaField: "field"
});

const CAPPED_UPGRADES = new Set([
  "attackSpeed",
  "projectileCount",
  "teslaChains",
  "teslaCooldown"
]);

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => typeof entry !== "function")
      .map(([key, entry]) => [key, cloneValue(entry)])
  );
}

const WEAPON_PREVIEW_FIELDS = Object.freeze([
  "id",
  "name",
  "currentLevel",
  "unlocked",
  "damage",
  "cooldownMs",
  "knockbackStrength",
  "suppressionSlowMultiplier",
  "staggerDurationMs",
  "magazineSize",
  "currentShells",
  "reloadDurationMs",
  "chainTargets"
]);

function captureWeapons(weapons) {
  return Object.fromEntries(Object.entries(weapons ?? {}).map(([weaponId, weapon]) => [
    weaponId,
    Object.fromEntries(
      WEAPON_PREVIEW_FIELDS
        .filter((field) => Object.hasOwn(weapon ?? {}, field))
        .map((field) => [field, weapon[field]])
    )
  ]));
}

function captureScene(scene) {
  const snapshot = {
    selectedWeaponId: scene.selectedWeaponId,
    health: scene.health,
    maxHealth: scene.maxHealth,
    playerMoveSpeed: scene.playerMoveSpeed,
    pickupRadius: scene.pickupRadius,
    projectileCount: scene.projectileCount,
    bulletPenetration: scene.bulletPenetration,
    bulletDamage: scene.bulletDamage,
    shootIntervalMs: scene.shootIntervalMs,
    elapsedSurvivalMs: scene.elapsedSurvivalMs,
    teslaFieldNextTickAtMs: scene.teslaFieldNextTickAtMs,
    // Runtime weapon objects may point to a channel target, which points back
    // to the Scene. Upgrade apply functions only need these scalar fields.
    weapons: captureWeapons(scene.weapons),
    weaponMutations: cloneValue(scene.weaponMutations ?? {}),
    upgradeLevels: cloneValue(scene.upgradeLevels ?? {})
  };
  snapshot.syncCombatStatsFromWeapons = function syncCombatStatsFromWeapons() {
    const weapon = this.weapons?.[this.selectedWeaponId];
    if (!weapon) return;
    this.bulletDamage = weapon.damage;
    this.shootIntervalMs = weapon.cooldownMs;
  };
  return snapshot;
}

function serializableSnapshot(snapshot) {
  return cloneValue(snapshot);
}

export function previewU3Upgrade(scene, upgrade) {
  if (!upgrade || typeof upgrade.apply !== "function") {
    throw new TypeError("U3 upgrade preview requires an upgrade with apply(scene).");
  }
  const isolated = captureScene(scene);
  const before = serializableSnapshot(isolated);
  upgrade.apply(isolated);
  return { before, after: serializableSnapshot(isolated) };
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function signedNumber(value) {
  const formatted = formatNumber(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return "0";
}

function percentDelta(before, after) {
  if (!Number.isFinite(before) || before === 0 || !Number.isFinite(after)) return "0%";
  const delta = Math.round(((after / before) - 1) * 1000) / 10;
  return `${signedNumber(delta)}%`;
}

function comparison(label, before, after, unit = "") {
  return {
    label,
    before: formatNumber(before),
    after: formatNumber(after),
    unit
  };
}

function mutationComparison(before, after) {
  return {
    label: "协议状态",
    before: before ? "已激活" : "未激活",
    after: after ? "已激活" : "未激活",
    unit: ""
  };
}

function metricFor(upgrade, before, after) {
  const selected = before.selectedWeaponId;
  const beforeWeapon = before.weapons?.[upgrade.weaponId ?? selected] ?? {};
  const afterWeapon = after.weapons?.[upgrade.weaponId ?? selected] ?? {};
  switch (upgrade.key) {
    case "damage": {
      const label = selected === "tesla" ? "每跳伤害" : "每发伤害";
      return {
        benefitLabel: label,
        benefitValue: percentDelta(beforeWeapon.damage, afterWeapon.damage),
        comparison: comparison(label, beforeWeapon.damage, afterWeapon.damage)
      };
    }
    case "attackSpeed": {
      const label = selected === "tesla" ? "结算间隔" : "攻击间隔";
      return {
        benefitLabel: `${label}缩短`,
        benefitValue: percentDelta(beforeWeapon.cooldownMs, afterWeapon.cooldownMs),
        comparison: comparison(label, beforeWeapon.cooldownMs, afterWeapon.cooldownMs, "ms"),
        cadence: { beforeMs: beforeWeapon.cooldownMs, afterMs: afterWeapon.cooldownMs }
      };
    }
    case "moveSpeed":
      return {
        benefitLabel: "移动速度",
        benefitValue: percentDelta(before.playerMoveSpeed, after.playerMoveSpeed),
        comparison: comparison("移动速度", before.playerMoveSpeed, after.playerMoveSpeed)
      };
    case "maxHealth":
      return {
        benefitLabel: "生命上限",
        benefitValue: signedNumber(after.maxHealth - before.maxHealth),
        comparison: comparison("生命上限", before.maxHealth, after.maxHealth),
        secondaryComparisons: [comparison("当前生命", before.health, after.health)]
      };
    case "projectileCount":
      return {
        benefitLabel: "每次弹丸",
        benefitValue: signedNumber(after.projectileCount - before.projectileCount),
        comparison: comparison("弹丸数量", before.projectileCount, after.projectileCount)
      };
    case "penetration":
      return {
        benefitLabel: "额外穿透",
        benefitValue: signedNumber(after.bulletPenetration - before.bulletPenetration),
        comparison: comparison("穿透目标", before.bulletPenetration, after.bulletPenetration)
      };
    case "pickupRadius":
      return {
        benefitLabel: "拾取半径",
        benefitValue: percentDelta(before.pickupRadius, after.pickupRadius),
        comparison: comparison("拾取半径", before.pickupRadius, after.pickupRadius)
      };
    case "emergencyHeal":
      return {
        benefitLabel: "立即恢复",
        benefitValue: signedNumber(after.health - before.health),
        comparison: comparison("当前生命", before.health, after.health)
      };
    case "breacherKnockback":
      return {
        benefitLabel: "击退强度",
        benefitValue: percentDelta(beforeWeapon.knockbackStrength, afterWeapon.knockbackStrength),
        comparison: comparison("击退强度", beforeWeapon.knockbackStrength, afterWeapon.knockbackStrength)
      };
    case "breacherSuppression":
      return {
        benefitLabel: "减速系数",
        benefitValue: percentDelta(beforeWeapon.suppressionSlowMultiplier, afterWeapon.suppressionSlowMultiplier),
        comparison: comparison("减速系数", beforeWeapon.suppressionSlowMultiplier, afterWeapon.suppressionSlowMultiplier),
        secondaryComparisons: [comparison("硬直时长", beforeWeapon.staggerDurationMs, afterWeapon.staggerDurationMs, "ms")]
      };
    case "breacherMagazine":
      return {
        benefitLabel: "弹匣容量",
        benefitValue: signedNumber(afterWeapon.magazineSize - beforeWeapon.magazineSize),
        comparison: comparison("弹匣容量", beforeWeapon.magazineSize, afterWeapon.magazineSize),
        secondaryComparisons: [
          comparison("当前弹药", beforeWeapon.currentShells, afterWeapon.currentShells),
          comparison("装填时间", beforeWeapon.reloadDurationMs, afterWeapon.reloadDurationMs, "ms")
        ]
      };
    case "teslaChains":
      return {
        benefitLabel: "链击目标",
        benefitValue: signedNumber(afterWeapon.chainTargets - beforeWeapon.chainTargets),
        comparison: comparison("命中目标", beforeWeapon.chainTargets, afterWeapon.chainTargets)
      };
    case "teslaCooldown":
      return {
        benefitLabel: "结算间隔缩短",
        benefitValue: percentDelta(beforeWeapon.cooldownMs, afterWeapon.cooldownMs),
        comparison: comparison("结算间隔", beforeWeapon.cooldownMs, afterWeapon.cooldownMs, "ms"),
        cadence: { beforeMs: beforeWeapon.cooldownMs, afterMs: afterWeapon.cooldownMs }
      };
    case "pistolBoomerang":
    case "breacherExplosive":
    case "teslaField":
      return {
        benefitLabel: "异常协议",
        benefitValue: "激活质变",
        comparison: mutationComparison(
          before.weaponMutations?.[upgrade.key],
          after.weaponMutations?.[upgrade.key]
        )
      };
    default:
      return {
        benefitLabel: "现场强化",
        benefitValue: "应用协议",
        comparison: {
          label: "升级等级",
          before: formatNumber(before.upgradeLevels?.[upgrade.key] ?? 0),
          after: formatNumber((before.upgradeLevels?.[upgrade.key] ?? 0) + 1),
          unit: ""
        }
      };
  }
}

function currentLevel(scene, upgrade) {
  if (upgrade.kind === "weapon") {
    const weaponId = upgrade.weaponId ?? scene.selectedWeaponId;
    if (weaponId && scene.weapons?.[weaponId]) return scene.weapons[weaponId].currentLevel ?? 0;
  }
  return scene.upgradeLevels?.[upgrade.key] ?? 0;
}

function availability(scene, upgrade) {
  try {
    return upgrade.isAvailable?.(scene) ?? true;
  } catch {
    return false;
  }
}

export function createU3UpgradeModel(scene, upgrade) {
  const preview = previewU3Upgrade(scene, upgrade);
  const available = availability(scene, upgrade);
  const mutationActive = !!upgrade.isMutation && scene.weaponMutations?.[upgrade.key] === true;
  const maxed = !available && (mutationActive || CAPPED_UPGRADES.has(upgrade.key));
  const metric = metricFor(upgrade, preview.before, preview.after);
  const title = upgrade.key === "attackSpeed" ? "攻击节奏" : upgrade.name;
  const description = metric.cadence
    ? maxed
      ? "已达间隔下限\n本项无法继续强化"
      : `${scene.selectedWeaponId === "tesla" ? "电击结算更密集" : "开火更快"}\n每次少等 ${formatNumber(metric.cadence.beforeMs - metric.cadence.afterMs)} ms`
    : String(upgrade.description ?? "").replace(/^【质变】/, "");
  return Object.freeze({
    key: upgrade.key,
    title,
    description,
    categoryLabel: upgrade.isMutation
      ? "异常质变"
      : upgrade.kind === "weapon"
        ? "武器协议"
        : "现场协议",
    levelLabel: upgrade.isMutation ? "单次授权" : `${upgrade.kind === "weapon" ? "武器" : "协议"} Lv ${currentLevel(scene, upgrade)}`,
    illustrationKind: scene.selectedWeaponId === "tesla" && upgrade.key === "damage"
      ? "teslaDamage"
      : scene.selectedWeaponId === "tesla" && ILLUSTRATIONS[upgrade.key] === "cadence"
        ? "teslaCadence"
        : ILLUSTRATIONS[upgrade.key] ?? "containment",
    isMutation: !!upgrade.isMutation,
    riskLabel: upgrade.isMutation ? "本局仅一次 · 不可撤销" : "",
    disabled: !available,
    maxed,
    statusLabel: mutationActive ? "已激活" : maxed ? "已达上限" : "可授权",
    benefitLabel: metric.benefitLabel,
    benefitValue: metric.benefitValue,
    cadence: metric.cadence ? Object.freeze(metric.cadence) : null,
    comparison: Object.freeze(metric.comparison),
    secondaryComparisons: Object.freeze(metric.secondaryComparisons ?? [])
  });
}

export function createU3UpgradeDeck(scene, choices) {
  const weaponName = scene.weapons?.[scene.selectedWeaponId]?.name ?? "未识别武器";
  const healthAfterSkip = Math.min(
    scene.maxHealth,
    scene.health + BALANCE.upgrades.skipHealAmount
  );
  return Object.freeze({
    weaponLabel: `当前武器：${weaponName}`,
    pendingLabel: `待授权 ${Math.max(0, scene.pendingLevelUps ?? 0)} 次`,
    cards: Object.freeze((choices ?? []).map((choice) => createU3UpgradeModel(scene, choice))),
    rerollLabel: `重抽（剩 ${Math.max(0, scene.rerollsRemaining ?? 0)}）`,
    rerollDisabled: !(scene.rerollsRemaining > 0),
    skipLabel: `跳过（最多 +${BALANCE.upgrades.skipHealAmount} 生命）`,
    skipComparison: Object.freeze({
      before: formatNumber(scene.health),
      after: formatNumber(healthAfterSkip)
    })
  });
}
