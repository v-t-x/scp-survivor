export const GROUNDED_LOCOMOTION = Object.freeze({
  idleFrame: 0,
  walkFrames: Object.freeze([1, 2, 3, 4]),
  settleFrame: 2,
  distancePerFramePx: 12,
  settleDurationMs: 100
});

function finiteCoordinate(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function isMoving(snapshot) {
  const velocityX = snapshot?.velocityX;
  const velocityY = snapshot?.velocityY;
  return Number.isFinite(velocityX)
    && Number.isFinite(velocityY)
    && velocityX * velocityX + velocityY * velocityY > 1;
}

function createState({
  frame,
  x,
  y,
  distanceRemainderPx = 0,
  wasMoving = false,
  settleElapsedMs = 0
}) {
  return Object.freeze({
    frame,
    x,
    y,
    distanceRemainderPx,
    wasMoving,
    settleElapsedMs
  });
}

export function createGroundedLocomotionState(snapshot = {}) {
  return createState({
    frame: GROUNDED_LOCOMOTION.idleFrame,
    x: finiteCoordinate(snapshot.x),
    y: finiteCoordinate(snapshot.y)
  });
}

export function advanceGroundedLocomotion(state, snapshot = {}, deltaMs = 0, paused = false) {
  const current = state ?? createGroundedLocomotionState(snapshot);
  if (paused === true) return current;

  const x = finiteCoordinate(snapshot.x, current.x);
  const y = finiteCoordinate(snapshot.y, current.y);
  const moving = isMoving(snapshot);
  const elapsedDelta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;

  if (moving) {
    if (!current.wasMoving) {
      return createState({
        frame: GROUNDED_LOCOMOTION.walkFrames[0],
        x,
        y,
        wasMoving: true
      });
    }

    const distance = Math.hypot(x - current.x, y - current.y);
    if (!Number.isFinite(distance)) return current;
    const traveledPx = current.distanceRemainderPx + distance;
    if (!Number.isFinite(traveledPx)) return current;
    const frameSteps = Math.floor(traveledPx / GROUNDED_LOCOMOTION.distancePerFramePx);
    const distanceRemainderPx = traveledPx
      - frameSteps * GROUNDED_LOCOMOTION.distancePerFramePx;
    let walkIndex = GROUNDED_LOCOMOTION.walkFrames.indexOf(current.frame);
    if (walkIndex < 0) walkIndex = 0;
    const frame = frameSteps === 0
      ? GROUNDED_LOCOMOTION.walkFrames[walkIndex]
      : GROUNDED_LOCOMOTION.walkFrames[
        (walkIndex + frameSteps) % GROUNDED_LOCOMOTION.walkFrames.length
      ];
    return createState({
      frame,
      x,
      y,
      distanceRemainderPx,
      wasMoving: true
    });
  }

  if (current.wasMoving) {
    return createState({
      frame: GROUNDED_LOCOMOTION.settleFrame,
      x,
      y
    });
  }
  if (current.frame === GROUNDED_LOCOMOTION.idleFrame) {
    return createState({
      ...current,
      x,
      y
    });
  }

  const settleElapsedMs = current.settleElapsedMs + elapsedDelta;
  return createState({
    frame: settleElapsedMs >= GROUNDED_LOCOMOTION.settleDurationMs
      ? GROUNDED_LOCOMOTION.idleFrame
      : current.frame,
    x,
    y,
    settleElapsedMs: settleElapsedMs >= GROUNDED_LOCOMOTION.settleDurationMs
      ? 0
      : settleElapsedMs
  });
}
