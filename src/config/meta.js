import { BALANCE } from "./balance.js";

// ---------------------------------------------------------------------------
// Meta progression (元进度): persistent, cross-run credits + unlocked perks.
// Stored in localStorage; all access is wrapped so a disabled/blocked storage
// (private mode, etc.) degrades to an in-memory object instead of crashing.
// ---------------------------------------------------------------------------
export const META_STORAGE_KEY = "scp-survivor-meta";

export function defaultMetaProgress() {
  return { credits: 0, perks: {} };
}

export function loadMetaProgress() {
  try {
    const raw = window.localStorage.getItem(META_STORAGE_KEY);
    if (!raw) {
      return defaultMetaProgress();
    }
    const parsed = JSON.parse(raw);
    return {
      credits: Number.isFinite(parsed?.credits) ? parsed.credits : 0,
      perks: parsed && typeof parsed.perks === "object" ? parsed.perks : {}
    };
  } catch (err) {
    return defaultMetaProgress();
  }
}

export function saveMetaProgress(meta) {
  try {
    window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch (err) {
    // Storage unavailable — keep the in-memory copy; progress just won't persist.
  }
}

// One-shot buyable starting bonuses. Applied at run start after weapons init.
export const META_PERKS = [
  {
    key: "startMaxHealth",
    name: "强化装甲",
    description: "起始最大生命值 +20。",
    cost: 150,
    apply: (scene) => {
      scene.maxHealth += 20;
      scene.health = scene.maxHealth;
    }
  },
  {
    key: "startMoveSpeed",
    name: "轻量护具",
    description: "起始移动速度 +5%。",
    cost: 150,
    apply: (scene) => {
      scene.playerMoveSpeed *= 1.05;
    }
  },
  {
    key: "startDamage",
    name: "军械授权",
    description: "起始武器伤害 +8%。",
    cost: 250,
    apply: (scene) => {
      const weapon = scene.weapons[scene.selectedWeaponId];
      if (weapon) {
        weapon.damage *= 1.08;
        scene.syncCombatStatsFromWeapons();
      }
    }
  },
  {
    key: "startPickupRadius",
    name: "回收信标",
    description: "起始拾取范围 +15%。",
    cost: 120,
    apply: (scene) => {
      scene.pickupRadius *= 1.15;
    }
  }
];
