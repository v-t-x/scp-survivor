const WEAPON_IDS = new Set(["pistol", "shotgun", "tesla"]);
export const TRAVEL_DIRECTION_INDEX = 3;
const STEP = Math.PI / 4;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(finite(value, min))));

export function quantizeWeaponRigDirection(angle, fallbackIndex = TRAVEL_DIRECTION_INDEX) {
  if (!Number.isFinite(angle)) return clampInt(fallbackIndex, 0, 7);
  const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
  return (Math.round(normalized / STEP) + 8) % 8;
}

export function createWeaponRigPresentation(input = {}, previousState = {}) {
  const weaponId = WEAPON_IDS.has(input.weaponId) ? input.weaponId : null;
  const directionIndex = quantizeWeaponRigDirection(input.aimAngle, previousState.directionIndex);
  const targetAgeMs = Math.max(0, finite(input.targetAgeMs, Number.POSITIVE_INFINITY));
  const hasTarget = Boolean(weaponId && (input.hasTarget || targetAgeMs < 250));
  const paused = Boolean(input.paused);
  const mode = !hasTarget || paused || !weaponId
    ? "travel"
    : input.isReloading ? "reloading"
      : weaponId === "tesla" && finite(input.cooldownRatio, 1) < 1 ? "charging"
        : "aiming";
  return Object.freeze({
    weaponId, mode, paused, directionIndex,
    aimAngle: finite(input.aimAngle, finite(previousState.aimAngle, 0)),
    channelCount: weaponId === "pistol" ? clampInt(input.projectileCount, 1, 5) : 1,
    shellCount: weaponId === "shotgun" ? clampInt(input.currentShells, 0, 99) : 0,
    magazineSize: weaponId === "shotgun" ? clampInt(input.magazineSize, 0, 99) : 0,
    coilNodes: weaponId === "tesla" ? clampInt(input.chainTargets, 1, 8) : 0,
    targetAgeMs,
    cooldownRatio: Math.min(1, Math.max(0, finite(input.cooldownRatio, 1))),
    outageStrength: Math.min(1, Math.max(0, finite(input.outageStrength, 0)))
  });
}

export function createWeaponRigFireSnapshot(input = {}, previousDirectionIndex = TRAVEL_DIRECTION_INDEX) {
  const state = createWeaponRigPresentation({ ...input, hasTarget: true }, { directionIndex: previousDirectionIndex });
  return Object.freeze({
    weaponId: state.weaponId, directionIndex: state.directionIndex, aimAngle: state.aimAngle,
    firedAtMs: finite(input.firedAtMs, 0), channelCount: state.channelCount,
    shellCount: state.shellCount, magazineSize: state.magazineSize, coilNodes: state.coilNodes,
    anchorX: finite(input.anchorX, 0), anchorY: finite(input.anchorY, 0)
  });
}
