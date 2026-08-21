export const PLAYER_WEAPON_ALLOWLIST = Object.freeze(["pistol", "tesla"]);

export function isPlayerWeaponAllowed(weaponId) {
  return PLAYER_WEAPON_ALLOWLIST.includes(weaponId);
}

export function isPlayerUpgradeVisible(upgrade) {
  return !upgrade?.weaponId || isPlayerWeaponAllowed(upgrade.weaponId);
}
