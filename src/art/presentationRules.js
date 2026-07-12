export const CHARACTER_DISPLAY_SCALE = {
  player: 1.2,
  infectedStaff: 1.15,
  scp049: 1.2
};

export function getOutagePresentation(strength, elapsedMs) {
  const clampedStrength = Math.min(1, Math.max(0, strength));
  if (clampedStrength === 0) {
    return {
      darknessAlpha: 0,
      facilityAlpha: 1,
      facilityTint: null
    };
  }

  const facilityAlpha = Math.min(
    0.88,
    Math.max(0.62, 0.75 + Math.sin(elapsedMs * 0.012) * 0.12)
  );
  return {
    darknessAlpha: 0.82 * clampedStrength,
    facilityAlpha,
    facilityTint: 0x9b3942
  };
}
