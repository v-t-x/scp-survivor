export const PLAYER_PRESENTATION_MOTION = Object.freeze({
  footOffsetY: 12,
  maxMoveBobPx: 1.25,
  maxMoveLeanRadians: Math.PI / 90,
  maxDashLeanRadians: Math.PI / 45,
  animationRateMin: 0.85,
  animationRateMax: 1.35
});

export const PLAYER_TWO_DIRECTION_DEFAULT_FACING = "left";

export function getPlayerTwoDirectionFacing({
  velocityX,
  previousFacing = PLAYER_TWO_DIRECTION_DEFAULT_FACING
} = {}) {
  const stableFacing = previousFacing === "right"
    ? "right"
    : PLAYER_TWO_DIRECTION_DEFAULT_FACING;
  if (!Number.isFinite(velocityX) || velocityX === 0) {
    return stableFacing;
  }
  return velocityX < 0 ? "left" : "right";
}

export function createPlayerPresentationSnapshot(scene) {
  const player = scene?.player;
  return Object.freeze({
    active: player?.active === true && player?.isDying !== true,
    x: Number.isFinite(player?.x) ? player.x : 0,
    y: Number.isFinite(player?.y) ? player.y : 0,
    velocityX: Number.isFinite(player?.body?.velocity?.x) ? player.body.velocity.x : 0,
    velocityY: Number.isFinite(player?.body?.velocity?.y) ? player.body.velocity.y : 0,
    facingAngle: Number.isFinite(scene?.playerFacingAngle) ? scene.playerFacingAngle : 0,
    elapsedMs: Number.isFinite(scene?.elapsedSurvivalMs) ? scene.elapsedSurvivalMs : 0,
    dashActive:
      Number.isFinite(scene?.dashUntilMs)
      && Number.isFinite(scene?.elapsedSurvivalMs)
      && scene.elapsedSurvivalMs < scene.dashUntilMs,
    selectedWeaponId: typeof scene?.selectedWeaponId === "string"
      ? scene.selectedWeaponId
      : null
  });
}

export function getPlayerMovementPresentation(snapshot) {
  const x = Number.isFinite(snapshot?.x) ? snapshot.x : 0;
  const y = Number.isFinite(snapshot?.y) ? snapshot.y : 0;
  const velocityX = Number.isFinite(snapshot?.velocityX) ? snapshot.velocityX : 0;
  const velocityY = Number.isFinite(snapshot?.velocityY) ? snapshot.velocityY : 0;
  const elapsedMs = Number.isFinite(snapshot?.elapsedMs) ? snapshot.elapsedMs : 0;
  const speedSq = velocityX * velocityX + velocityY * velocityY;
  const moving = Number.isFinite(speedSq) && speedSq > 1;
  const speed = moving ? Math.sqrt(speedSq) : 0;
  const speedRatio = Math.min(1, speed / 160);
  const strideRate = 0.75 + speedRatio * 0.75;
  const phase = elapsedMs * 0.012 * strideRate;
  const leanLimit = snapshot?.dashActive === true
    ? PLAYER_PRESENTATION_MOTION.maxDashLeanRadians
    : PLAYER_PRESENTATION_MOTION.maxMoveLeanRadians;
  return Object.freeze({
    footX: x,
    footY: y + PLAYER_PRESENTATION_MOTION.footOffsetY,
    bobY: moving
      ? -Math.abs(Math.sin(phase)) * PLAYER_PRESENTATION_MOTION.maxMoveBobPx
      : 0,
    rotation: moving
      ? Math.max(-1, Math.min(1, velocityX / Math.max(speed, 1))) * leanLimit
      : 0,
    animationRate: moving
      ? Math.max(
          PLAYER_PRESENTATION_MOTION.animationRateMin,
          Math.min(PLAYER_PRESENTATION_MOTION.animationRateMax, speed / 80)
        )
      : 1
  });
}
