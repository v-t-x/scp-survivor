const BODY_ORIGIN = Object.freeze({ x: 0.5, y: 56 / 64 });
const BODY_PIVOT = Object.freeze({ x: 32, y: 56 });
const POSE_BODY_LOCAL_PIVOT = Object.freeze({ x: 32, y: 32 });
const DEPTH = Object.freeze({ behind: -1, pack: -0.75, body: 0, front: 1 });
const FORMAL_FRAME_COUNT = 5;
const AIM_DIRECTION_COUNT = 16;
const DIRECTION_STEP = Math.PI / 8;
const DIRECTION_HYSTERESIS_RADIANS = 0.06;
const REQUIRED_SPRITE_METHODS = Object.freeze([
  "setOrigin", "setPosition", "setFrame", "setFlipX", "setRotation",
  "setDepth", "setVisible", "setAlpha", "setTint", "clearTint", "destroy"
]);

function requireMethods(object, methods, label) {
  if (!object || methods.some((method) => typeof object[method] !== "function")) {
    throw new Error(`player equipment rig ${label} is incomplete`);
  }
  return object;
}

function finitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function ensureDefinition(definition) {
  const textureKeys = [
    definition?.aimBackTextureKey,
    definition?.aimFrontTextureKey,
    definition?.aimRecoilBackTextureKey,
    definition?.aimRecoilFrontTextureKey
  ];
  const requiredPoints = ["pivot", "actionPoint"];
  return definition
    && textureKeys.every((key) => typeof key === "string" && key.length > 0)
    && requiredPoints.every((key) => finitePoint(definition[key]))
    && (definition.powerModuleTextureKey === null || typeof definition.powerModuleTextureKey === "string")
    && definition.directionCount === AIM_DIRECTION_COUNT
    && Number.isFinite(definition.recoilPx)
    && Number.isFinite(definition.recoilDurationMs)
    && typeof definition.vfxType === "string";
}

function ensureSockets(sockets) {
  return Array.isArray(sockets)
    && sockets.length === FORMAL_FRAME_COUNT
    && sockets.every((socket, index) => (
      Object.hasOwn(sockets, index)
      && socket
      && socket.index === index
      && Number.isFinite(socket.gripX)
      && Number.isFinite(socket.gripY)
      && Number.isFinite(socket.supportX)
      && Number.isFinite(socket.supportY)
      && ["front", "behind"].includes(socket.equipmentLayer)
    ));
}

function rotateLocal(point, pivot, angle, worldPivot) {
  const localX = point.x - pivot.x;
  const localY = point.y - pivot.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return Object.freeze({
    x: worldPivot.x + localX * cos - localY * sin,
    y: worldPivot.y + localX * sin + localY * cos
  });
}

function localPosePivot(aimAngle, recoilPx) {
  return Object.freeze({
    x: POSE_BODY_LOCAL_PIVOT.x - Math.cos(aimAngle) * recoilPx,
    y: POSE_BODY_LOCAL_PIVOT.y - Math.sin(aimAngle) * recoilPx
  });
}

function normalizeAngle(angle) {
  const normalized = angle % (Math.PI * 2);
  return normalized < 0 ? normalized + Math.PI * 2 : normalized;
}

function bodyLocalAimAngle(aimAngle, bodyFacing) {
  return normalizeAngle(bodyFacing === "right" ? Math.PI - aimAngle : aimAngle);
}

function circularDistance(left, right) {
  const distance = Math.abs(normalizeAngle(left) - normalizeAngle(right));
  return Math.min(distance, Math.PI * 2 - distance);
}

function resolveDirectionIndex(aimAngle, bodyFacing, previousState = null) {
  const normalized = bodyLocalAimAngle(aimAngle, bodyFacing);
  const nominal = Math.round(normalized / DIRECTION_STEP) % AIM_DIRECTION_COUNT;
  if (
    previousState?.bodyFacing === bodyFacing
    && Number.isInteger(previousState.directionIndex)
    && circularDistance(
      normalized,
      previousState.directionIndex * DIRECTION_STEP
    ) <= DIRECTION_STEP / 2 + DIRECTION_HYSTERESIS_RADIANS
  ) {
    return previousState.directionIndex;
  }
  return nominal;
}

function isFormalPoseMirrored(bodyFacing) {
  return bodyFacing === "right";
}

function mirrorPosePoint(point) {
  return Object.freeze({
    x: POSE_BODY_LOCAL_PIVOT.x * 2 - point.x,
    y: point.y
  });
}

function rotateAroundFoot(point, footX, footY, angle) {
  if (angle === 0) return point;
  const localX = point.x - footX;
  const localY = point.y - footY;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return Object.freeze({
    x: footX + localX * cos - localY * sin,
    y: footY + localX * sin + localY * cos
  });
}

function callEach(objects, method, value) {
  for (const object of objects) object[method](value);
}

function destroyAll(scene, objects) {
  for (const object of objects) {
    let destroyed = false;
    try {
      if (typeof object?.destroy === "function") {
        object.destroy();
        destroyed = true;
      }
    } catch {
      // Fall through to the display-list cleanup path.
    }
    if (destroyed) continue;
    try {
      object?.removeFromUpdateList?.();
    } catch {
      // Continue with the remaining cleanup paths.
    }
    try {
      object?.removeFromDisplayList?.();
    } catch {
      // Continue with the scene-owned fallback.
    }
    try {
      scene?.children?.remove?.(object);
    } catch {
      // Continue releasing the remaining presentation-owned sprites.
    }
  }
}

// Presentation-only layered character rig. Weapon, hands and forearms use one
// baked sixteen-direction pose so they switch and recoil as a connected unit.
// Body facing remains movement-owned and none of these sprites acquire physics.
export function createPlayerEquipmentRig(scene, {
  anchor,
  bodyTextureKey,
  definition,
  sockets
} = {}) {
  if (
    !anchor
    || typeof bodyTextureKey !== "string"
    || !ensureDefinition(definition)
    || !ensureSockets(sockets)
    || typeof scene?.add?.sprite !== "function"
  ) {
    throw new Error("player equipment rig requires presentation inputs");
  }

  const owned = [];
  let body;
  let aimBack;
  let pack = null;
  let aimFront;
  let aimRecoilBack;
  let aimRecoilFront;
  try {
    const allocate = (textureKey, label) => {
      const sprite = scene.add.sprite(0, 0, textureKey);
      owned.push(sprite);
      return requireMethods(sprite, REQUIRED_SPRITE_METHODS, label);
    };
    body = allocate(bodyTextureKey, "body");
    aimBack = allocate(definition.aimBackTextureKey, "aim back");
    if (definition.powerModuleTextureKey !== null) {
      pack = allocate(definition.powerModuleTextureKey, "power module");
    }
    aimFront = allocate(definition.aimFrontTextureKey, "aim front");
    aimRecoilBack = allocate(definition.aimRecoilBackTextureKey, "aim recoil back");
    aimRecoilFront = allocate(definition.aimRecoilFrontTextureKey, "aim recoil front");

    body.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
    aimBack.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
    pack?.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
    aimFront.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
    aimRecoilBack.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
    aimRecoilFront.setOrigin(BODY_ORIGIN.x, BODY_ORIGIN.y);
  } catch (error) {
    destroyAll(scene, owned);
    throw new Error("player equipment rig allocation failed", { cause: error });
  }

  const displayObjects = Object.freeze([...owned]);
  const bodyLocalObjects = Object.freeze([
    body,
    aimBack,
    ...(pack ? [pack] : []),
    aimFront,
    aimRecoilBack,
    aimRecoilFront
  ]);
  let destroyed = false;
  let paused = false;
  let lastState = null;

  function render(state) {
    if (destroyed) return false;
    if (
      !state
      || !Number.isFinite(state.footX)
      || !Number.isFinite(state.footY)
      || !Number.isInteger(state.frame)
      || state.frame < 0
      || state.frame >= FORMAL_FRAME_COUNT
      || !["left", "right"].includes(state.bodyFacing)
      || !["left", "right"].includes(state.visualAimFacing)
      || !Number.isFinite(state.aimAngle)
      || !Number.isFinite(state.recoilPx)
      || !Number.isFinite(state.bodyRotation)
      || typeof state.visible !== "boolean"
      || !Number.isFinite(state.alpha)
      || !sockets[state.frame]
    ) {
      return false;
    }

    try {
      const flipBody = isFormalPoseMirrored(state.bodyFacing);
      const directionIndex = resolveDirectionIndex(state.aimAngle, state.bodyFacing, lastState);
      const poseFrame = directionIndex * FORMAL_FRAME_COUNT + state.frame;
      const recoilActive = state.recoilPx > 0;
      const baseDepth = Number.isFinite(anchor.depth) ? anchor.depth : 0;

      for (const object of bodyLocalObjects) {
        object.setPosition(state.footX, state.footY);
        object.setFlipX(flipBody);
        object.setRotation(state.bodyRotation);
      }
      body.setFrame(state.frame);
      aimBack.setFrame(poseFrame);
      aimFront.setFrame(poseFrame);
      aimRecoilBack.setFrame(poseFrame);
      aimRecoilFront.setFrame(poseFrame);

      aimBack.setDepth(baseDepth + DEPTH.behind);
      aimRecoilBack.setDepth(baseDepth + DEPTH.behind);
      pack?.setDepth(baseDepth + DEPTH.pack);
      body.setDepth(baseDepth + DEPTH.body);
      aimFront.setDepth(baseDepth + DEPTH.front);
      aimRecoilFront.setDepth(baseDepth + DEPTH.front);
      body.setVisible(state.visible);
      pack?.setVisible(state.visible);
      aimBack.setVisible(state.visible && !recoilActive);
      aimFront.setVisible(state.visible && !recoilActive);
      aimRecoilBack.setVisible(state.visible && recoilActive);
      aimRecoilFront.setVisible(state.visible && recoilActive);
      callEach(displayObjects, "setAlpha", state.alpha);

      lastState = Object.freeze({
        ...state,
        directionIndex,
        poseFrame,
        connectorFrame: poseFrame,
        recoilActive
      });
      return true;
    } catch {
      return false;
    }
  }

  function getActionPoint(options = undefined) {
    if (destroyed || !lastState) return null;
    const aimAngle = typeof options === "number"
      ? options
      : options?.aimAngle ?? lastState.aimAngle;
    const recoilPx = typeof options === "object" && options !== null
      ? options.recoilPx ?? lastState.recoilPx
      : lastState.recoilPx;
    if (!Number.isFinite(aimAngle) || !Number.isFinite(recoilPx)) return null;

    const directionIndex = resolveDirectionIndex(aimAngle, lastState.bodyFacing, lastState);
    const localPoseAngle = directionIndex * DIRECTION_STEP;
    const poseRecoilPx = recoilPx > 0 ? definition.recoilPx : 0;
    const localActionPoint = rotateLocal(
      definition.actionPoint,
      definition.pivot,
      localPoseAngle,
      localPosePivot(localPoseAngle, poseRecoilPx)
    );
    const renderedActionPoint = isFormalPoseMirrored(lastState.bodyFacing)
      ? mirrorPosePoint(localActionPoint)
      : localActionPoint;
    const unrotated = Object.freeze({
      x: lastState.footX + renderedActionPoint.x - POSE_BODY_LOCAL_PIVOT.x,
      y: lastState.footY + renderedActionPoint.y - BODY_PIVOT.y
    });
    const point = rotateAroundFoot(
      unrotated,
      lastState.footX,
      lastState.footY,
      lastState.bodyRotation
    );
    return Number.isFinite(point.x) && Number.isFinite(point.y)
      ? Object.freeze({ x: Math.round(point.x), y: Math.round(point.y) })
      : null;
  }

  function setAlpha(alpha) {
    if (destroyed || !Number.isFinite(alpha)) return false;
    try {
      callEach(displayObjects, "setAlpha", alpha);
      if (lastState) lastState = Object.freeze({ ...lastState, alpha });
      return true;
    } catch {
      return false;
    }
  }

  function setTint(tint) {
    if (destroyed) return false;
    try {
      callEach(displayObjects, "setTint", tint);
      return true;
    } catch {
      return false;
    }
  }

  function clearTint() {
    if (destroyed) return false;
    try {
      callEach(displayObjects, "clearTint");
      return true;
    } catch {
      return false;
    }
  }

  function setPaused(value) {
    if (destroyed || typeof value !== "boolean") return false;
    paused = value;
    for (const object of displayObjects) {
      if (value) object.anims?.pause?.();
      else object.anims?.resume?.();
    }
    return true;
  }

  function destroy() {
    if (destroyed) return true;
    destroyed = true;
    destroyAll(scene, displayObjects);
    return true;
  }

  function snapshot() {
    return Object.freeze({
      destroyed,
      paused,
      hasPack: pack !== null,
      visible: lastState?.visible ?? false,
      alpha: lastState?.alpha ?? 1,
      aimAngle: lastState?.aimAngle ?? null,
      directionIndex: lastState?.directionIndex ?? null,
      poseFrame: lastState?.poseFrame ?? null,
      connectorFrame: lastState?.connectorFrame ?? null,
      recoilActive: lastState?.recoilActive ?? false,
      visualAimFacing: lastState?.visualAimFacing ?? null,
      actionPoint: getActionPoint()
    });
  }

  return Object.freeze({
    render,
    getActionPoint,
    setAlpha,
    setTint,
    clearTint,
    setPaused,
    destroy,
    snapshot
  });
}
