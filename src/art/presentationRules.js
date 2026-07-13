export const CHARACTER_DISPLAY_SCALE = {
  player: 1.2,
  infectedStaff: 1.15,
  scp049: 1.2
};

export function applyDisplayScalePreservingBody(gameObject, scale) {
  const body = gameObject.body;
  if (!body) {
    gameObject.setScale(scale);
    return gameObject;
  }

  const previousScaleX = gameObject.scaleX;
  const previousScaleY = gameObject.scaleY;
  const intendedWidth = body.sourceWidth * Math.abs(previousScaleX);
  const intendedHeight = body.sourceHeight * Math.abs(previousScaleY);
  const intendedX =
    gameObject.x + previousScaleX * (body.offset.x - gameObject.displayOriginX);
  const intendedY =
    gameObject.y + previousScaleY * (body.offset.y - gameObject.displayOriginY);
  const wasCircle = body.isCircle;
  const intendedRadius = body.radius;

  gameObject.setScale(scale);

  body.sourceWidth = intendedWidth / Math.abs(gameObject.scaleX);
  body.sourceHeight = intendedHeight / Math.abs(gameObject.scaleY);
  body.offset.set(
    gameObject.displayOriginX + (intendedX - gameObject.x) / gameObject.scaleX,
    gameObject.displayOriginY + (intendedY - gameObject.y) / gameObject.scaleY
  );
  body.updateFromGameObject();
  body.isCircle = wasCircle;
  body.radius = intendedRadius;
  return gameObject;
}

export function resetFacilityPresentation(facilityVisuals = []) {
  for (const visual of facilityVisuals) {
    if (visual.active) {
      visual.setAlpha(1);
      visual.clearTint();
    }
  }
}

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
