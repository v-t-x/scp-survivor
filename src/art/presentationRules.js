export const CHARACTER_DISPLAY_SCALE = {
  player: 1.2,
  infectedStaff: 1.15,
  scp049: 1.2
};

export function centerCircularBody(gameObject, radius) {
  return gameObject.setCircle(
    radius,
    (gameObject.width - radius * 2) / 2,
    (gameObject.height - radius * 2) / 2
  );
}

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

export function applyTextureAndScalePreservingBody(gameObject, textureKey, scale = 1) {
  const body = gameObject.body;
  if (!body) {
    gameObject.setTexture(textureKey, 0);
    gameObject.setScale(scale);
    return gameObject;
  }

  if (!Number.isFinite(scale) || scale === 0) {
    throw new RangeError(
      "applyTextureAndScalePreservingBody requires a finite, non-zero target scale when a physics body is present"
    );
  }

  // Match the effective body geometry Phaser would establish at the next
  // Arcade Body preUpdate after any immediately preceding setScale().
  body.updateFromGameObject();

  const snapshot = {
    x: body.position.x,
    y: body.position.y,
    width: body.width,
    height: body.height,
    isCircle: body.isCircle,
    radius: body.radius
  };

  gameObject.setTexture(textureKey, 0);
  gameObject.setScale(scale);

  const scaleX = Math.abs(gameObject.scaleX) || 1;
  const scaleY = Math.abs(gameObject.scaleY) || 1;
  body.sourceWidth = snapshot.width / scaleX;
  body.sourceHeight = snapshot.height / scaleY;
  body.offset.set(
    gameObject.displayOriginX + (snapshot.x - gameObject.x) / gameObject.scaleX,
    gameObject.displayOriginY + (snapshot.y - gameObject.y) / gameObject.scaleY
  );
  body.updateFromGameObject();
  body.isCircle = snapshot.isCircle;
  body.radius = snapshot.radius;
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
