/**
 * Three-weapon balance sim (survival XP + boss TTK).
 */

const BOSS_HP = 2500;
const PICKS = 13;
const FALLoff = 0.8;

function levelFromXp(xp, first = 8, growth = 5) {
  let level = 1;
  let remaining = xp;
  while (level < 40) {
    const need = first + (level - 1) * growth;
    if (remaining < need) break;
    remaining -= need;
    level += 1;
  }
  return level - 1;
}

function applyWeaponUpgrades(base, { damageUp = 0, speedUp = 0 }) {
  let damage = base.damage;
  let cd = base.cooldownMs;
  for (let i = 0; i < damageUp; i++) damage *= 1.2;
  for (let i = 0; i < speedUp; i++) cd *= 0.85;
  return { damage, cd };
}

function pistolBossDps(damageUp, speedUp) {
  const { damage, cd } = applyWeaponUpgrades(
    { damage: 20, cooldownMs: 280 },
    { damageUp, speedUp }
  );
  return (1000 / cd) * damage;
}

function shotgunBossDps(damageUp, speedUp, magUp = 1) {
  const { damage, cd } = applyWeaponUpgrades(
    { damage: 8, cooldownMs: 1300 },
    { damageUp, speedUp }
  );
  let mag = 4 + magUp;
  let reload = 2000;
  for (let i = 0; i < magUp; i++) {
    reload = Math.max(900, Math.round(reload * 0.88));
  }
  const shotDamage = damage * 5;
  const cycleMs = mag * cd + reload;
  const base = (mag * shotDamage) / (cycleMs / 1000);
  return base * 1.5;
}

function teslaBossDps(damageUp, speedUp, chainUp = 1) {
  const { damage, cd } = applyWeaponUpgrades(
    { damage: 18, cooldownMs: 1600 },
    { damageUp, speedUp }
  );
  const chains = 3 + chainUp;
  let total = 0;
  let hit = damage;
  for (let i = 0; i < chains; i++) {
    total += hit;
    hit *= FALLoff;
  }
  return total / (cd / 1000);
}

function teslaBossDpsOldSingleHit(damageUp, speedUp) {
  const { damage, cd } = applyWeaponUpgrades(
    { damage: 18, cooldownMs: 1600 },
    { damageUp, speedUp }
  );
  return damage / (cd / 1000);
}

function weaponPicks(pool) {
  if (pool === "pistol") {
    return { damageUp: 3, speedUp: 2, magUp: 0, chainUp: 0 };
  }
  if (pool === "shotgun") {
    return { damageUp: 3, speedUp: 2, magUp: 1, chainUp: 0 };
  }
  return { damageUp: 3, speedUp: 2, magUp: 0, chainUp: 1 };
}

function report(weapon, dps, note = "") {
  console.log({
    weapon,
    bossDps: +dps.toFixed(1),
    bossTtkSec: +(BOSS_HP / dps).toFixed(1),
    note
  });
}

console.log("=== Boss TTK @ 2500 HP (~13 upgrades, mixed picks) ===\n");

const p = weaponPicks("pistol");
report("手枪", pistolBossDps(p.damageUp, p.speedUp));

const s = weaponPicks("shotgun");
report(
  "突破器 (Boss 战用 range 230)",
  shotgunBossDps(s.damageUp, s.speedUp, s.magUp),
  "含弹匣升级；需贴近 Boss"
);

const t = weaponPicks("tesla");
report(
  "特斯拉 (Boss 过载链击)",
  teslaBossDps(t.damageUp, t.speedUp, t.chainUp),
  "Boss 战全部链击打在 SCP-049"
);
report(
  "特斯拉 (旧逻辑·仅首段)",
  teslaBossDpsOldSingleHit(t.damageUp, t.speedUp),
  "修复前：链击被小怪吸走"
);

console.log("\n目标：三武器 Boss TTK 约 18–35 秒（含召唤干扰）");
