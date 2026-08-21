import {
  CHARACTER_PROFILES,
  DEFAULT_CHARACTER_ID,
  getPlayerMotion,
  resolveCharacterPresentation,
  syncCharacterPresentation,
  syncCharacterVisual
} from "./characterPresentation.js";
import {
  getPlayerDynamicSampleDefinition
} from "./playerDynamicSampleDefinitions.js";
import {
  getPlayerEquipmentDefinition,
  validatePlayerEquipmentTextures
} from "./playerEquipmentDefinitions.js";
import { createPlayerEquipmentRig } from "./playerEquipmentRig.js";
import {
  BODY_SOCKET_FRAME_COUNT,
  BODY_SOCKET_SCHEMA_VERSION,
  PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS
} from "./playerResponseOperativeBodySockets.js";
import {
  PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS
} from "./playerTwoDirectionQualitySampleSockets.js";
import {
  PLAYER_TWO_DIRECTION_DEFAULT_FACING,
  createPlayerPresentationSnapshot,
  getPlayerMovementPresentation,
  getPlayerTwoDirectionFacing
} from "./playerPresentationModel.js";
import {
  GROUNDED_LOCOMOTION,
  advanceGroundedLocomotion,
  createGroundedLocomotionState
} from "./playerGroundedLocomotion.js";
import { TEXTURES } from "../assets/manifest.js";
import { isPlayerWeaponAllowed } from "../config/playerWeaponAvailability.js";

const LEGACY_REQUIRED_FRAME_COUNT = 48;
const LEGACY_ORIGIN_Y = 44 / 48;
const STATIC_ORIGIN_Y = 1;
const DEFAULT_HIT_DURATION_MS = 120;
const RECOIL_DURATION_MS = Object.freeze({ light: 75, heavy: 90 });
const RECOIL_ROTATION = Object.freeze({ light: 0.02, heavy: 0.03 });
const RECOIL_TRANSLATION_PX = Object.freeze({ light: 2, heavy: 3 });
const SAMPLE_ORIGIN_Y = 56 / 64;
const SAMPLE_BODY_DEPTH = 6;
const SAMPLE_RIG_DEPTH_OFFSET = 0.25;
const SAMPLE_FRAME_COUNT = 5;
const FORMAL_VISUAL_AIM_HORIZONTAL_THRESHOLD = 0.15;
const BODY_PROTOTYPE_FRAME_COUNT = 28;
const BODY_PROTOTYPE_ORIGIN_Y = 56 / 64;
const BODY_MOTION_RANGES = Object.freeze({
  idle: Object.freeze({ start: 0, end: 3, frameDurationMs: 250 }),
  forward: Object.freeze({ start: 4, end: 9, frameDurationMs: 125 }),
  backward: Object.freeze({ start: 10, end: 15, frameDurationMs: 125 }),
  strafeLeft: Object.freeze({ start: 16, end: 21, frameDurationMs: 125 }),
  strafeRight: Object.freeze({ start: 22, end: 27, frameDurationMs: 125 })
});
const SAMPLE_MODES = Object.freeze(new Set([
  "sample-a",
  "sample-b",
  "two-direction"
]));
const PREVIEW_MODES = Object.freeze(new Set([
  "body",
  "legacy",
  "static",
  ...SAMPLE_MODES
]));
const PREVIEW_OVERRIDE_KEYS = Object.freeze([
  "mode",
  "facingAngle",
  "velocityX",
  "velocityY",
  "hit"
]);

function getRecoilRotationOffset(angle, recoilKind) {
  const horizontal = Math.cos(angle);
  const vertical = Math.sin(angle);
  const dominantDirection = Math.abs(horizontal) >= Math.abs(vertical)
    ? horizontal
    : vertical;
  return (dominantDirection < 0 ? 1 : -1) * RECOIL_ROTATION[recoilKind];
}

function getFormalVisualAimFacing(angle, previousFacing) {
  if (!Number.isFinite(angle)) return previousFacing;
  const horizontal = Math.cos(angle);
  if (horizontal < -FORMAL_VISUAL_AIM_HORIZONTAL_THRESHOLD) return "left";
  if (horizontal > FORMAL_VISUAL_AIM_HORIZONTAL_THRESHOLD) return "right";
  return previousFacing;
}

function hasLegacySheet(scene, textureKey) {
  if (!scene?.textures?.exists?.(textureKey)) {
    return false;
  }
  const frameTotal = scene.textures.get?.(textureKey)?.frameTotal;
  return Number.isFinite(frameTotal) && frameTotal > LEGACY_REQUIRED_FRAME_COUNT;
}

function getNormalPresentation(scene, characterId) {
  const profile = CHARACTER_PROFILES[characterId];
  if (!profile) {
    throw new RangeError(`unknown character id: ${characterId}`);
  }
  if (hasLegacySheet(scene, profile.fallbackSheetKey)) {
    return {
      mode: "legacy",
      textureKey: profile.fallbackSheetKey,
      animationFamily: "legacy",
      displayScale: profile.fallbackDisplayScale,
      originY: LEGACY_ORIGIN_Y
    };
  }
  return {
    mode: "static",
    textureKey: profile.fallbackTextureKey,
    animationFamily: "static",
    displayScale: profile.fallbackDisplayScale,
    originY: STATIC_ORIGIN_Y
  };
}

function getBodyPreviewPresentation(scene, characterId) {
  const resolved = resolveCharacterPresentation(
    scene,
    characterId,
    { allowBodyPreview: true }
  );
  if (resolved.animationFamily !== "prototype") {
    return getNormalPresentation(scene, characterId);
  }
  return {
    mode: "body",
    textureKey: resolved.textureKey,
    animationFamily: resolved.animationFamily,
    displayScale: resolved.displayScale,
    originY: BODY_PROTOTYPE_ORIGIN_Y
  };
}

function bodyPreviewSupports(override) {
  if (!override || override.hit === true || !Number.isFinite(override.facingAngle)) {
    return false;
  }
  const horizontal = Math.cos(override.facingAngle);
  const vertical = Math.sin(override.facingAngle);
  return vertical > 0 && Math.abs(vertical) >= Math.abs(horizontal);
}

function getPreviewPresentation(scene, characterId, previewOverride) {
  if (SAMPLE_MODES.has(previewOverride?.mode)) {
    const resolved = resolveCharacterPresentation(
      scene,
      characterId,
      { sampleMode: previewOverride.mode }
    );
    if (resolved.animationFamily === "dynamic-sample") {
      return {
        mode: resolved.sampleMode,
        textureKey: resolved.textureKey,
        animationFamily: resolved.animationFamily,
        displayScale: resolved.displayScale,
        originY: SAMPLE_ORIGIN_Y
      };
    }
    return getNormalPresentation(scene, characterId);
  }
  if (previewOverride?.mode === "body") {
    return bodyPreviewSupports(previewOverride)
      ? getBodyPreviewPresentation(scene, characterId)
      : getNormalPresentation(scene, characterId);
  }
  if (previewOverride?.mode !== "static") {
    return getNormalPresentation(scene, characterId);
  }
  const profile = CHARACTER_PROFILES[characterId];
  if (!profile) {
    throw new RangeError(`unknown character id: ${characterId}`);
  }
  return {
    mode: "static",
    textureKey: profile.fallbackTextureKey,
    animationFamily: "static",
    displayScale: profile.fallbackDisplayScale,
    originY: STATIC_ORIGIN_Y
  };
}

function copyDynamicSampleDefinition(mode) {
  const source = getPlayerDynamicSampleDefinition(mode);
  if (
    !source
    || source.mode !== mode
    || typeof source.textureKey !== "string"
    || source.idleFrame !== 0
    || !Array.isArray(source.walkFrames)
    || !Array.isArray(source.frameDurationsMs)
    || !Array.isArray(source.sockets)
    || source.walkFrames.length !== SAMPLE_FRAME_COUNT - 1
    || source.frameDurationsMs.length !== SAMPLE_FRAME_COUNT - 1
    || source.sockets.length !== SAMPLE_FRAME_COUNT
    || source.walkFrames.some(
      (frame, index) => frame !== index + 1
    )
    || source.frameDurationsMs.some(
      (duration) => !Number.isFinite(duration) || duration <= 0
    )
    || !source.settle
    || !Number.isInteger(source.settle.frame)
    || !source.walkFrames.includes(source.settle.frame)
    || !Number.isFinite(source.settle.durationMs)
    || source.settle.durationMs < 0
    || !Number.isInteger(source.settle.overshootPx)
    || source.settle.overshootPx < 0
  ) {
    return null;
  }
  const sockets = [];
  for (let index = 0; index < source.sockets.length; index += 1) {
    const socket = source.sockets[index];
    if (
      !socket
      || socket.index !== index
      || !["front", "behind"].includes(socket.equipmentLayer)
      || ["gripX", "gripY", "supportX", "supportY"].some(
        (key) => (
          !Number.isInteger(socket[key])
          || socket[key] < 0
          || socket[key] >= 64
        )
      )
    ) {
      return null;
    }
    sockets.push(Object.freeze({
      index: socket.index,
      gripX: socket.gripX,
      gripY: socket.gripY,
      supportX: socket.supportX,
      supportY: socket.supportY,
      equipmentLayer: socket.equipmentLayer
    }));
  }
  return Object.freeze({
    mode: source.mode,
    textureKey: source.textureKey,
    idleFrame: source.idleFrame,
    walkFrames: Object.freeze([...source.walkFrames]),
    frameDurationsMs: Object.freeze([...source.frameDurationsMs]),
    settle: Object.freeze({
      frame: source.settle.frame,
      durationMs: source.settle.durationMs,
      overshootPx: source.settle.overshootPx
    }),
    sockets: Object.freeze(sockets)
  });
}

function copyBodySocketContract() {
  if (
    BODY_SOCKET_SCHEMA_VERSION !== 1
    || BODY_SOCKET_FRAME_COUNT !== BODY_PROTOTYPE_FRAME_COUNT
    || !Array.isArray(PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS)
    || PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS.length !== BODY_PROTOTYPE_FRAME_COUNT
  ) {
    return null;
  }
  const sockets = [];
  for (let index = 0; index < PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS.length; index += 1) {
    const socket = PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS[index];
    if (
      !socket
      || socket.index !== index
      || !["front", "behind"].includes(socket.equipmentLayer)
      || ["gripX", "gripY", "supportX", "supportY"].some((key) => (
        !Number.isInteger(socket[key])
        || socket[key] < 0
        || socket[key] >= 64
      ))
    ) {
      return null;
    }
    sockets.push(Object.freeze({
      index: socket.index,
      gripX: socket.gripX,
      gripY: socket.gripY,
      supportX: socket.supportX,
      supportY: socket.supportY,
      equipmentLayer: socket.equipmentLayer
    }));
  }
  return Object.freeze(sockets);
}

function copyFormalSocketContract() {
  const source = PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS;
  if (!Array.isArray(source) || source.length !== SAMPLE_FRAME_COUNT) {
    return null;
  }
  const sockets = [];
  for (let index = 0; index < source.length; index += 1) {
    const socket = source[index];
    if (
      !socket
      || socket.index !== index
      || !["front", "behind"].includes(socket.equipmentLayer)
      || ["gripX", "gripY", "supportX", "supportY"].some((key) => (
        !Number.isFinite(socket[key])
        || socket[key] < 0
        || socket[key] >= 64
      ))
    ) {
      return null;
    }
    sockets.push(Object.freeze({
      index: socket.index,
      gripX: socket.gripX,
      gripY: socket.gripY,
      supportX: socket.supportX,
      supportY: socket.supportY,
      equipmentLayer: socket.equipmentLayer
    }));
  }
  return Object.freeze(sockets);
}

function copyPreviewOverride(value) {
  if (value === null) {
    return null;
  }
  if (
    typeof value !== "object"
    || Array.isArray(value)
    || (
      Object.getPrototypeOf(value) !== Object.prototype
      && Object.getPrototypeOf(value) !== null
    )
  ) {
    return false;
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== PREVIEW_OVERRIDE_KEYS.length
    || keys.some((key) => typeof key !== "string")
    || PREVIEW_OVERRIDE_KEYS.some((key) => !Object.hasOwn(value, key))
  ) {
    return false;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (PREVIEW_OVERRIDE_KEYS.some((key) => !Object.hasOwn(descriptors[key], "value"))) {
    return false;
  }
  if (
    !PREVIEW_MODES.has(value.mode)
    || !Number.isFinite(value.facingAngle)
    || !Number.isFinite(value.velocityX)
    || !Number.isFinite(value.velocityY)
    || typeof value.hit !== "boolean"
  ) {
    return false;
  }
  return Object.freeze({
    mode: value.mode,
    facingAngle: value.facingAngle,
    velocityX: value.velocityX,
    velocityY: value.velocityY,
    hit: value.hit
  });
}

export function createPlayerPresentationController(
  scene,
  {
    anchor = scene?.player,
    characterId = anchor?.characterId ?? DEFAULT_CHARACTER_ID,
    allowBodyPreview = false
  } = {}
) {
  let visual = null;
  let mode = "anchor";
  let visualMode = "anchor";
  let fallback = false;
  let paused = false;
  let destroyed = false;
  let lastError = null;
  let latestSnapshot = null;
  let previewOverride = null;
  let hitUntilMs = 0;
  let hitTimer = null;
  const recoilState = { rotationOffset: 0 };
  const sampleEquipmentState = { recoilPx: 0 };
  let recoilTween = null;
  let dynamicSample = null;
  let dynamicSampleRig = null;
  let dynamicSampleFrame = 0;
  let dynamicSampleFrameElapsedMs = 0;
  let dynamicSampleWasMoving = false;
  let dynamicSampleSettleElapsedMs = 0;
  let dynamicSampleAimAngle = Math.PI;
  let dynamicSampleAimCommitted = false;
  let dynamicSampleFacing = PLAYER_TWO_DIRECTION_DEFAULT_FACING;
  let bodyPreviewRig = null;
  let bodyPreviewSockets = null;
  let bodyPreviewMotion = "idle";
  let bodyPreviewFrame = 0;
  let bodyPreviewFrameElapsedMs = 0;
  let bodyPreviewAimAngle = Math.PI;
  let formalRig = null;
  let formalDefinition = null;
  let formalWeaponId = null;
  let formalLocomotion = null;
  let formalFacing = PLAYER_TWO_DIRECTION_DEFAULT_FACING;
  let formalAimAngle = Math.PI;
  let formalVisualAimFacing = "left";
  let formalAttemptedWeaponId = null;
  let formalAlpha = 1;
  const formalEquipmentState = { recoilPx: 0 };

  function recordError(error) {
    if (lastError === null) {
      lastError = error?.message ? String(error.message) : String(error);
    }
  }

  function resetFormalState() {
    formalRig = null;
    formalDefinition = null;
    formalWeaponId = null;
    formalLocomotion = null;
    formalFacing = PLAYER_TWO_DIRECTION_DEFAULT_FACING;
    formalAimAngle = Math.PI;
    formalVisualAimFacing = "left";
    formalEquipmentState.recoilPx = 0;
  }

  function destroyFormalRig({ restoreLegacy = false } = {}) {
    const owned = formalRig;
    resetFormalState();
    if (owned) {
      try {
        owned.destroy?.();
      } catch (error) {
        recordError(error);
      }
    }
    if (restoreLegacy && visual) {
      visual.setVisible?.(latestSnapshot?.active !== false);
      if (paused) {
        visual.anims?.pause?.();
      } else {
        visual.anims?.resume?.();
      }
      mode = visualMode;
    }
  }

  function downgradeFormalToLegacy(error) {
    recordError(error);
    hitUntilMs = 0;
    removeHitTimerSafely();
    destroyOwnedTweens();
    destroyFormalRig({ restoreLegacy: true });
  }

  function createFormalRenderState(snapshot, overrides = {}) {
    const footX = Number.isFinite(snapshot?.x) ? Math.round(snapshot.x) : 0;
    const footY = Number.isFinite(snapshot?.y) ? Math.round(snapshot.y + 12) : 12;
    return Object.freeze({
      footX,
      footY,
      frame: formalLocomotion?.frame ?? GROUNDED_LOCOMOTION.idleFrame,
      bodyFacing: formalFacing,
      visualAimFacing: formalVisualAimFacing,
      aimAngle: formalAimAngle,
      recoilPx: formalEquipmentState.recoilPx,
      bodyRotation: 0,
      visible: snapshot?.active === true,
      alpha: formalAlpha,
      ...overrides
    });
  }

  function tryActivateFormal(snapshot) {
    const weaponId = snapshot?.selectedWeaponId;
    if (
      previewOverride
      || formalRig
      || !isPlayerWeaponAllowed(weaponId)
      || formalAttemptedWeaponId === weaponId
    ) {
      return formalRig !== null;
    }

    formalAttemptedWeaponId = weaponId;
    let nextRig = null;
    try {
      const definition = getPlayerEquipmentDefinition(weaponId);
      const sockets = copyFormalSocketContract();
      if (!definition || definition.weaponId !== weaponId) {
        throw new Error(`formal equipment definition is unavailable: ${weaponId}`);
      }
      if (!sockets) {
        throw new Error("formal equipment socket contract is incomplete");
      }
      if (!validatePlayerEquipmentTextures(scene, definition)) {
        throw new Error(`formal equipment texture contract is incomplete: ${weaponId}`);
      }

      nextRig = createPlayerEquipmentRig(scene, {
        anchor,
        bodyTextureKey: TEXTURES.playerResponseOperativeBodySheet,
        definition,
        sockets
      });
      const initialFacing = getPlayerTwoDirectionFacing({
        velocityX: snapshot?.velocityX,
        previousFacing: PLAYER_TWO_DIRECTION_DEFAULT_FACING
      });
      const initialState = createFormalRenderState(snapshot, {
        frame: GROUNDED_LOCOMOTION.idleFrame,
        bodyFacing: initialFacing,
        visualAimFacing: "left",
        aimAngle: Math.PI,
        recoilPx: 0
      });
      if (nextRig.render(initialState) !== true) {
        throw new Error(`formal equipment initial render failed: ${weaponId}`);
      }
      if (paused && nextRig.setPaused?.(true) !== true) {
        throw new Error(`formal equipment pause inheritance failed: ${weaponId}`);
      }
      visual?.setVisible?.(false);

      formalRig = nextRig;
      formalDefinition = definition;
      formalWeaponId = weaponId;
      formalLocomotion = createGroundedLocomotionState(snapshot);
      formalFacing = initialFacing;
      formalAimAngle = Math.PI;
      formalVisualAimFacing = "left";
      formalEquipmentState.recoilPx = 0;
      mode = "formal";
      nextRig = null;
      latestSnapshot = snapshot;
      return true;
    } catch (error) {
      try {
        nextRig?.destroy?.();
      } catch (cleanupError) {
        recordError(cleanupError);
      }
      recordError(error);
      visual?.setVisible?.(snapshot?.active === true);
      mode = visualMode;
      return false;
    }
  }

  function destroyDynamicSampleRig() {
    const owned = dynamicSampleRig;
    dynamicSampleRig = null;
    if (!owned) return;
    for (const graphic of [owned.front, owned.behind]) {
      try {
        graphic?.destroy?.();
      } catch (error) {
        recordError(error);
      }
    }
  }

  function resetDynamicSampleState() {
    dynamicSample = null;
    dynamicSampleFrame = 0;
    dynamicSampleFrameElapsedMs = 0;
    dynamicSampleWasMoving = false;
    dynamicSampleSettleElapsedMs = 0;
    dynamicSampleAimAngle = Math.PI;
    dynamicSampleAimCommitted = false;
    dynamicSampleFacing = PLAYER_TWO_DIRECTION_DEFAULT_FACING;
    sampleEquipmentState.recoilPx = 0;
  }

  function deactivateDynamicSample() {
    destroyDynamicSampleRig();
    resetDynamicSampleState();
  }

  function createEquipmentRig(label) {
    const requiredMethods = [
      "clear",
      "lineStyle",
      "lineBetween",
      "fillStyle",
      "fillRect",
      "setDepth",
      "setVisible",
      "setAlpha",
      "destroy"
    ];
    const created = [];
    try {
      const bodyDepth = Number.isFinite(anchor?.depth)
        ? anchor.depth
        : SAMPLE_BODY_DEPTH;
      const behind = scene?.add?.graphics?.();
      if (!behind) {
        throw new Error(`${label} behind rig allocation failed`);
      }
      created.push(behind);
      const front = scene?.add?.graphics?.();
      if (!front) {
        throw new Error(`${label} front rig allocation failed`);
      }
      created.push(front);
      for (const graphic of created) {
        for (const method of requiredMethods) {
          if (typeof graphic[method] !== "function") {
            throw new Error(`${label} rig is missing ${method}()`);
          }
        }
        if (graphic.body != null) {
          throw new Error(`${label} rig must stay non-physical`);
        }
      }
      behind.setDepth(bodyDepth - SAMPLE_RIG_DEPTH_OFFSET);
      front.setDepth(bodyDepth + SAMPLE_RIG_DEPTH_OFFSET);
      behind.setVisible(true);
      front.setVisible(true);
      behind.setAlpha(1);
      front.setAlpha(1);
      return { behind, front };
    } catch (error) {
      for (const graphic of created) {
        try {
          graphic?.destroy?.();
        } catch (cleanupError) {
          recordError(cleanupError);
        }
      }
      throw error;
    }
  }

  function activateDynamicSample(definition) {
    if (
      dynamicSample?.mode === definition.mode
      && dynamicSampleRig
    ) {
      return;
    }
    const nextRig = createEquipmentRig("dynamic sample");
    destroyDynamicSampleRig();
    dynamicSample = definition;
    dynamicSampleRig = nextRig;
    dynamicSampleFrame = definition.idleFrame;
    dynamicSampleFrameElapsedMs = 0;
    dynamicSampleWasMoving = false;
    dynamicSampleSettleElapsedMs = 0;
    dynamicSampleAimAngle = Math.PI;
    dynamicSampleAimCommitted = false;
    dynamicSampleFacing = PLAYER_TWO_DIRECTION_DEFAULT_FACING;
    sampleEquipmentState.recoilPx = 0;
    if (typeof visual?.setFrame !== "function") {
      throw new Error("dynamic sample visual cannot select native frames");
    }
    visual.setFrame(definition.idleFrame);
    visual.setDepth?.(
      Number.isFinite(anchor?.depth) ? anchor.depth : SAMPLE_BODY_DEPTH
    );
    visual.anims?.stop?.();
  }

  function resetBodyPreviewState() {
    bodyPreviewSockets = null;
    bodyPreviewMotion = "idle";
    bodyPreviewFrame = 0;
    bodyPreviewFrameElapsedMs = 0;
  }

  function releaseBodyPreviewRig({ strict = false } = {}) {
    const owned = bodyPreviewRig;
    bodyPreviewRig = null;
    resetBodyPreviewState();
    if (!owned) return;
    sampleEquipmentState.recoilPx = 0;
    let firstError = null;
    for (const graphic of [owned.front, owned.behind]) {
      for (const action of [
        () => graphic?.clear?.(),
        () => graphic?.setVisible?.(false),
        () => graphic?.destroy?.()
      ]) {
        try {
          action();
        } catch (error) {
          firstError ??= error;
          recordError(error);
        }
      }
    }
    if (strict && firstError) {
      throw firstError;
    }
  }

  function activateBodyPreview() {
    if (bodyPreviewRig && bodyPreviewSockets) {
      return;
    }
    const sockets = copyBodySocketContract();
    if (!sockets) {
      throw new Error("body preview socket contract is incomplete");
    }
    const nextRig = createEquipmentRig("body preview");
    bodyPreviewSockets = sockets;
    bodyPreviewRig = nextRig;
    bodyPreviewMotion = "idle";
    bodyPreviewFrame = BODY_MOTION_RANGES.idle.start;
    bodyPreviewFrameElapsedMs = 0;
    sampleEquipmentState.recoilPx = 0;
    visual?.setDepth?.(
      Number.isFinite(anchor?.depth) ? anchor.depth : SAMPLE_BODY_DEPTH
    );
    visual?.anims?.stop?.();
  }

  function destroyVisual() {
    releaseBodyPreviewRig();
    deactivateDynamicSample();
    const owned = visual;
    visual = null;
    if (!owned) return;
    try {
      owned.destroy?.();
    } catch (error) {
      recordError(error);
    }
  }

  function removeHitTimer() {
    const owned = hitTimer;
    hitTimer = null;
    if (!owned) return;
    owned.remove?.();
  }

  function removeHitTimerSafely() {
    try {
      removeHitTimer();
    } catch (error) {
      recordError(error);
    }
  }

  function readTweenLifecycleFlag(tween, methodName, propertyName) {
    try {
      if (typeof tween?.[methodName] === "function") {
        return tween[methodName]() === true;
      }
      if (typeof tween?.[propertyName] === "boolean") {
        return tween[propertyName];
      }
    } catch (error) {
      recordError(error);
    }
    return null;
  }

  function getTweenLifecycle(tween) {
    const active = readTweenLifecycleFlag(tween, "isActive", "active");
    const pendingRemove = readTweenLifecycleFlag(
      tween,
      "isPendingRemove",
      "pendingRemove"
    );
    const removed = readTweenLifecycleFlag(tween, "isRemoved", "removed");
    const tweenDestroyed = readTweenLifecycleFlag(
      tween,
      "isDestroyed",
      "destroyed"
    );
    return {
      active,
      observable: (
        active !== null
        || pendingRemove !== null
        || removed !== null
        || tweenDestroyed !== null
      ),
      released: (
        active !== true
        && (pendingRemove === true || removed === true || tweenDestroyed === true)
      )
    };
  }

  function forgetReleasedRecoil(owned) {
    const lifecycle = getTweenLifecycle(owned);
    if (!lifecycle.released) {
      return false;
    }
    if (recoilTween === owned) {
      recoilTween = null;
    }
    return true;
  }

  function removeOwnedRecoil() {
    const owned = recoilTween;
    recoilState.rotationOffset = 0;
    sampleEquipmentState.recoilPx = 0;
    formalEquipmentState.recoilPx = 0;
    if (!owned) return;
    if (forgetReleasedRecoil(owned)) {
      return;
    }
    let removalError = null;
    let cleanupSucceededWithoutState = false;
    try {
      if (typeof owned.remove === "function") {
        owned.remove();
        cleanupSucceededWithoutState = true;
      } else {
        throw new Error("owned recoil tween cannot be detached");
      }
    } catch (error) {
      removalError = error;
    }

    let lifecycle = getTweenLifecycle(owned);
    if (
      !lifecycle.released
      && (lifecycle.observable || !cleanupSucceededWithoutState)
    ) {
      try {
        if (typeof owned.stop !== "function") {
          throw new Error("owned recoil tween cannot be stopped");
        }
        owned.stop();
        cleanupSucceededWithoutState = true;
      } catch (error) {
        cleanupSucceededWithoutState = false;
        removalError ??= error;
      }
      lifecycle = getTweenLifecycle(owned);
    }

    const detached = (
      lifecycle.released
      || (!lifecycle.observable && cleanupSucceededWithoutState)
    );
    if (detached && recoilTween === owned) {
      recoilTween = null;
    }
    if (removalError) {
      throw removalError;
    }
    if (!detached) {
      throw new Error("owned recoil tween remained active after cleanup");
    }
  }

  function destroyOwnedTweens() {
    try {
      removeOwnedRecoil();
    } catch (error) {
      recordError(error);
    }
  }

  function restoreAnchor() {
    try {
      anchor?.setVisible?.(true);
    } catch (error) {
      recordError(error);
    }
  }

  function activateFallback(error) {
    recordError(error);
    if (!fallback) {
      fallback = true;
      mode = "anchor";
      hitUntilMs = 0;
      removeHitTimerSafely();
      destroyOwnedTweens();
      destroyFormalRig();
      destroyVisual();
      restoreAnchor();
    }
  }

  function captureSnapshot() {
    return createPlayerPresentationSnapshot({
      player: anchor,
      playerFacingAngle: scene?.playerFacingAngle,
      elapsedSurvivalMs: scene?.elapsedSurvivalMs,
      dashUntilMs: scene?.dashUntilMs,
      selectedWeaponId: scene?.selectedWeaponId
    });
  }

  function getEffectiveSnapshot(snapshot) {
    if (!previewOverride) {
      return snapshot;
    }
    return Object.freeze({
      active: snapshot.active,
      x: snapshot.x,
      y: snapshot.y,
      velocityX: previewOverride.velocityX,
      velocityY: previewOverride.velocityY,
      facingAngle: previewOverride.facingAngle,
      elapsedMs: snapshot.elapsedMs,
      dashActive: snapshot.dashActive,
      selectedWeaponId: snapshot.selectedWeaponId
    });
  }

  function applyVisualPresentation(presentation) {
    if (!visual) {
      throw new Error("player presentation visual is unavailable");
    }
    if (visual.texture?.key !== presentation.textureKey) {
      if (typeof visual.setTexture !== "function") {
        throw new Error("player presentation visual cannot change texture");
      }
      visual.setTexture(presentation.textureKey);
    }
    visual.setOrigin?.(0.5, presentation.originY);
    visual.setScale?.(presentation.displayScale);
    visual.characterId = characterId;
    visual.presentationAnimationFamily = presentation.animationFamily;
    visual.presentationFacing ??= anchor.presentationFacing ?? "down";
    if (presentation.animationFamily === "static") {
      visual.anims?.stop?.();
    }
    visualMode = presentation.mode;
    if (!formalRig) {
      mode = presentation.mode;
    }
  }

  function visualUsesPresentation(presentation) {
    return (
      mode === presentation.mode
      && visual?.texture?.key === presentation.textureKey
      && visual?.presentationAnimationFamily === presentation.animationFamily
      && visual?.scaleX === presentation.displayScale
      && visual?.scaleY === presentation.displayScale
      && visual?.originY === presentation.originY
    );
  }

  function syncAnchorFallback() {
    try {
      if (anchor === scene?.player) {
        syncCharacterPresentation(scene);
        return;
      }
      const snapshot = captureSnapshot();
      syncCharacterVisual(scene, anchor, {
        facingAngle: snapshot.facingAngle,
        velocityX: snapshot.velocityX,
        velocityY: snapshot.velocityY,
        isTinted: anchor?.isTinted === true,
        elapsedMs: snapshot.elapsedMs
      });
    } catch (error) {
      recordError(error);
    }
  }

  function advanceDynamicSampleFrame(moving, deltaMs) {
    const elapsedDelta = paused || !Number.isFinite(deltaMs)
      ? 0
      : Math.max(0, deltaMs);
    if (moving) {
      if (!dynamicSampleWasMoving) {
        dynamicSampleFrame = dynamicSample.walkFrames[0];
        dynamicSampleFrameElapsedMs = 0;
      } else {
        dynamicSampleFrameElapsedMs += elapsedDelta;
        let walkIndex = dynamicSample.walkFrames.indexOf(dynamicSampleFrame);
        if (walkIndex < 0) walkIndex = 0;
        let frameDuration = dynamicSample.frameDurationsMs[walkIndex];
        while (dynamicSampleFrameElapsedMs >= frameDuration) {
          dynamicSampleFrameElapsedMs -= frameDuration;
          walkIndex = (walkIndex + 1) % dynamicSample.walkFrames.length;
          dynamicSampleFrame = dynamicSample.walkFrames[walkIndex];
          frameDuration = dynamicSample.frameDurationsMs[walkIndex];
        }
      }
      dynamicSampleSettleElapsedMs = 0;
      dynamicSampleWasMoving = true;
      return;
    }

    if (dynamicSampleWasMoving) {
      dynamicSampleWasMoving = false;
      dynamicSampleSettleElapsedMs = 0;
      if (dynamicSample.mode === "two-direction") {
        dynamicSampleFrame = dynamicSample.settle.frame;
        return;
      }
    }
    if (dynamicSampleFrame === dynamicSample.idleFrame) {
      return;
    }
    dynamicSampleSettleElapsedMs += elapsedDelta;
    if (
      dynamicSampleSettleElapsedMs
      >= dynamicSample.settle.durationMs
    ) {
      dynamicSampleFrame = dynamicSample.idleFrame;
      dynamicSampleFrameElapsedMs = 0;
      dynamicSampleSettleElapsedMs = 0;
    }
  }

  function getDynamicSampleSettleOffsetX() {
    if (
      dynamicSampleWasMoving
      || dynamicSampleFrame === dynamicSample.idleFrame
      || dynamicSample.settle.overshootPx === 0
      || dynamicSample.settle.durationMs <= 0
    ) {
      return 0;
    }
    const progress = Math.min(
      1,
      dynamicSampleSettleElapsedMs / dynamicSample.settle.durationMs
    );
    if (progress < 1 / 3) {
      return -dynamicSample.settle.overshootPx;
    }
    if (progress < 2 / 3) {
      return dynamicSample.settle.overshootPx;
    }
    return 0;
  }

  function drawEquipmentRig(
    rig,
    socket,
    aimAngle,
    footX,
    footY,
    visible,
    bodyRotation = 0,
    qualityWeapon = false
  ) {
    const { front, behind } = rig;
    front.clear();
    behind.clear();
    front.setVisible(visible);
    behind.setVisible(visible);
    if (!visible) return;

    if (!socket) {
      throw new Error("equipment socket is missing for the visible frame");
    }
    const target = socket.equipmentLayer === "behind" ? behind : front;
    const aimX = Math.cos(aimAngle);
    const aimY = Math.sin(aimAngle);
    const sideX = -aimY;
    const sideY = aimX;
    const recoil = Number.isFinite(sampleEquipmentState.recoilPx)
      ? sampleEquipmentState.recoilPx
      : 0;
    const socketRotation = Number.isFinite(bodyRotation) ? bodyRotation : 0;
    const socketCos = Math.cos(socketRotation);
    const socketSin = Math.sin(socketRotation);
    const pivotX = Math.round(footX - 1 - aimX * recoil);
    const pivotY = Math.round(footY - 24 - aimY * recoil);
    const gripLocalX = socket.gripX - 32;
    const gripLocalY = socket.gripY - 56;
    const supportLocalX = socket.supportX - 32;
    const supportLocalY = socket.supportY - 56;
    const gripSocketX = Math.round(
      footX + gripLocalX * socketCos - gripLocalY * socketSin
    );
    const gripSocketY = Math.round(
      footY + gripLocalX * socketSin + gripLocalY * socketCos
    );
    const supportSocketX = Math.round(
      footX + supportLocalX * socketCos - supportLocalY * socketSin
    );
    const supportSocketY = Math.round(
      footY + supportLocalX * socketSin + supportLocalY * socketCos
    );
    const gripX = Math.round(pivotX - aimX + sideX * 3);
    const gripY = Math.round(pivotY - aimY + sideY * 3);
    const supportX = Math.round(pivotX + aimX * 7 - sideX * 3);
    const supportY = Math.round(pivotY + aimY * 7 - sideY * 3);
    const equipmentRearX = Math.round(pivotX - aimX * 6);
    const equipmentRearY = Math.round(pivotY - aimY * 6);
    const equipmentFrontX = Math.round(pivotX + aimX * 18);
    const equipmentFrontY = Math.round(pivotY + aimY * 18);

    // Same neutral temporary forearms and equipment for A and B. The dummy is
    // deliberately generic so profession identity must come from the body.
    target.lineStyle(5, 0x11161b, 1);
    target.lineBetween(
      gripSocketX,
      gripSocketY,
      gripX,
      gripY
    );
    target.lineBetween(
      supportSocketX,
      supportSocketY,
      supportX,
      supportY
    );
    target.lineStyle(3, 0x7c878d, 1);
    target.lineBetween(
      gripSocketX,
      gripSocketY,
      gripX,
      gripY
    );
    target.lineBetween(
      supportSocketX,
      supportSocketY,
      supportX,
      supportY
    );
    if (qualityWeapon) {
      const stockRearX = Math.round(pivotX - aimX * 9);
      const stockRearY = Math.round(pivotY - aimY * 9);
      const stockFrontX = Math.round(pivotX - aimX * 2);
      const stockFrontY = Math.round(pivotY - aimY * 2);
      const receiverFrontX = Math.round(pivotX + aimX * 10);
      const receiverFrontY = Math.round(pivotY + aimY * 10);
      const barrelFrontX = Math.round(pivotX + aimX * 22);
      const barrelFrontY = Math.round(pivotY + aimY * 22);
      const handleTopX = Math.round(pivotX + aimX * 3 + sideX * 2);
      const handleTopY = Math.round(pivotY + aimY * 3 + sideY * 2);
      const handleBottomX = Math.round(pivotX + aimX * 3 + sideX * 7);
      const handleBottomY = Math.round(pivotY + aimY * 3 + sideY * 7);
      target.lineStyle(7, 0x20272b, 1);
      target.lineBetween(stockRearX, stockRearY, stockFrontX, stockFrontY);
      target.lineStyle(6, 0x667278, 1);
      target.lineBetween(
        stockFrontX,
        stockFrontY,
        receiverFrontX,
        receiverFrontY
      );
      target.lineStyle(2, 0xa4adb0, 1);
      target.lineBetween(
        receiverFrontX,
        receiverFrontY,
        barrelFrontX,
        barrelFrontY
      );
      target.lineStyle(4, 0x343e43, 1);
      target.lineBetween(
        handleTopX,
        handleTopY,
        handleBottomX,
        handleBottomY
      );
    } else {
      target.lineStyle(7, 0x10151a, 1);
      target.lineBetween(
        equipmentRearX,
        equipmentRearY,
        equipmentFrontX,
        equipmentFrontY
      );
      target.lineStyle(4, 0x667278, 1);
      target.lineBetween(
        equipmentRearX,
        equipmentRearY,
        equipmentFrontX,
        equipmentFrontY
      );
      target.lineStyle(2, 0xa4adb0, 1);
      target.lineBetween(
        pivotX,
        pivotY,
        Math.round(pivotX + aimX * 13),
        Math.round(pivotY + aimY * 13)
      );
    }
    target.fillStyle(0x151b20, 1);
    target.fillRect(gripX - 2, gripY - 2, 4, 4);
    target.fillRect(supportX - 2, supportY - 2, 4, 4);
    target.fillStyle(0x879197, 1);
    target.fillRect(gripX - 1, gripY - 1, 2, 2);
    target.fillRect(supportX - 1, supportY - 1, 2, 2);
  }

  function getOrientedDynamicSampleSocket() {
    const socket = dynamicSample?.sockets?.[dynamicSampleFrame];
    if (
      !socket
      || dynamicSample?.mode !== "two-direction"
      || dynamicSampleFacing !== "right"
    ) {
      return socket;
    }
    return {
      ...socket,
      gripX: 63 - socket.gripX,
      supportX: 63 - socket.supportX
    };
  }

  function drawDynamicSampleRig(footX, footY, visible, bodyRotation) {
    drawEquipmentRig(
      dynamicSampleRig,
      getOrientedDynamicSampleSocket(),
      dynamicSampleAimAngle,
      footX,
      footY,
      visible,
      bodyRotation,
      dynamicSample?.mode === "two-direction"
    );
  }

  function updateDynamicSampleVisual(
    snapshot,
    effectiveSnapshot,
    deltaMs
  ) {
    const speedSq = (
      effectiveSnapshot.velocityX * effectiveSnapshot.velocityX
      + effectiveSnapshot.velocityY * effectiveSnapshot.velocityY
    );
    const moving = Number.isFinite(speedSq) && speedSq > 1;
    advanceDynamicSampleFrame(moving, deltaMs);
    const isTwoDirection = dynamicSample.mode === "two-direction";
    if (isTwoDirection) {
      dynamicSampleFacing = getPlayerTwoDirectionFacing({
        velocityX: effectiveSnapshot.velocityX,
        previousFacing: dynamicSampleFacing
      });
    }
    const movement = isTwoDirection
      ? null
      : getPlayerMovementPresentation(effectiveSnapshot);
    const footX = Math.round(
      (isTwoDirection ? effectiveSnapshot.x : movement.footX)
      + getDynamicSampleSettleOffsetX()
    );
    const footY = isTwoDirection
      ? Math.round(effectiveSnapshot.y + 12)
      : movement.footY + movement.bobY;
    const bodyRotation = isTwoDirection ? 0 : movement.rotation;
    visual.setVisible?.(effectiveSnapshot.active);
    visual.setPosition?.(footX, footY);
    visual.setRotation?.(bodyRotation);
    visual.setFlipX?.(isTwoDirection && dynamicSampleFacing === "right");
    visual.anims?.stop?.();
    visual.setFrame(dynamicSampleFrame);
    drawDynamicSampleRig(
      footX,
      footY,
      effectiveSnapshot.active,
      bodyRotation
    );
    latestSnapshot = snapshot;
  }

  function advanceBodyPreviewFrame(motion, deltaMs) {
    const range = BODY_MOTION_RANGES[motion] ?? BODY_MOTION_RANGES.idle;
    if (
      bodyPreviewMotion !== motion
      || bodyPreviewFrame < range.start
      || bodyPreviewFrame > range.end
    ) {
      bodyPreviewMotion = motion;
      bodyPreviewFrame = range.start;
      bodyPreviewFrameElapsedMs = 0;
      return;
    }
    const elapsedDelta = paused || !Number.isFinite(deltaMs)
      ? 0
      : Math.max(0, deltaMs);
    bodyPreviewFrameElapsedMs += elapsedDelta;
    const frameCount = range.end - range.start + 1;
    while (bodyPreviewFrameElapsedMs >= range.frameDurationMs) {
      bodyPreviewFrameElapsedMs -= range.frameDurationMs;
      bodyPreviewFrame = range.start
        + ((bodyPreviewFrame - range.start + 1) % frameCount);
    }
  }

  function updateBodyPreviewVisual(snapshot, effectiveSnapshot, deltaMs) {
    const motion = getPlayerMotion(effectiveSnapshot);
    advanceBodyPreviewFrame(motion, deltaMs);
    const movement = getPlayerMovementPresentation(effectiveSnapshot);
    const footX = movement.footX;
    const footY = movement.footY + movement.bobY;
    visual.setVisible?.(effectiveSnapshot.active);
    visual.setPosition?.(footX, footY);
    visual.setRotation?.(movement.rotation);
    visual.setFlipX?.(false);
    visual.anims?.stop?.();
    visual.setFrame?.(bodyPreviewFrame);
    drawEquipmentRig(
      bodyPreviewRig,
      bodyPreviewSockets?.[bodyPreviewFrame],
      bodyPreviewAimAngle,
      footX,
      footY,
      effectiveSnapshot.active,
      movement.rotation
    );
    latestSnapshot = snapshot;
  }

  function updateFormalVisual(snapshot, deltaMs) {
    const velocityX = Number.isFinite(snapshot?.velocityX) ? snapshot.velocityX : 0;
    formalLocomotion = advanceGroundedLocomotion(
      formalLocomotion,
      snapshot,
      deltaMs,
      paused
    );
    formalFacing = getPlayerTwoDirectionFacing({
      velocityX,
      previousFacing: formalFacing
    });
    if (formalRig?.render?.(createFormalRenderState(snapshot)) !== true) {
      throw new Error(`formal equipment render failed: ${formalWeaponId}`);
    }
    latestSnapshot = snapshot;
  }

  function updateVisual(snapshot, deltaMs = 0) {
    const effectiveSnapshot = getEffectiveSnapshot(snapshot);
    if (mode === "body" && bodyPreviewRig) {
      updateBodyPreviewVisual(snapshot, effectiveSnapshot, deltaMs);
      return;
    }
    if (dynamicSample && dynamicSampleRig) {
      updateDynamicSampleVisual(snapshot, effectiveSnapshot, deltaMs);
      return;
    }
    const movement = getPlayerMovementPresentation(effectiveSnapshot);
    visual.setVisible?.(effectiveSnapshot.active);
    visual.setPosition?.(movement.footX, movement.footY + movement.bobY);
    const recoilRotation = Number.isFinite(recoilState.rotationOffset)
      ? recoilState.rotationOffset
      : 0;
    visual.setRotation?.(movement.rotation + recoilRotation);
    if (visual.anims && Number.isFinite(movement.animationRate)) {
      visual.anims.timeScale = movement.animationRate;
    }
    syncCharacterVisual(scene, visual, {
      facingAngle: effectiveSnapshot.facingAngle,
      velocityX: effectiveSnapshot.velocityX,
      velocityY: effectiveSnapshot.velocityY,
      isTinted: visual?.isTinted === true,
      hit: previewOverride
        ? previewOverride.hit
        : hitUntilMs > effectiveSnapshot.elapsedMs,
      elapsedMs: effectiveSnapshot.elapsedMs
    });
    latestSnapshot = snapshot;
    if (paused) {
      visual.anims?.pause?.();
    }
  }

  function update(snapshot, deltaMs) {
    if (destroyed) return false;
    if (fallback) {
      syncAnchorFallback();
      return false;
    }
    try {
      let activatedFormal = false;
      const selectedWeaponId = snapshot?.selectedWeaponId;
      if (
        !previewOverride
        && formalRig
        && isPlayerWeaponAllowed(selectedWeaponId)
        && selectedWeaponId !== formalWeaponId
      ) {
        hitUntilMs = 0;
        removeHitTimerSafely();
        destroyOwnedTweens();
        destroyFormalRig({ restoreLegacy: true });
        formalAttemptedWeaponId = null;
      }
      if (!previewOverride && !formalRig) {
        activatedFormal = tryActivateFormal(snapshot);
      }
      if (formalRig) {
        if (activatedFormal) {
          return true;
        }
        try {
          updateFormalVisual(snapshot, deltaMs);
          return true;
        } catch (error) {
          recordError(error);
          hitUntilMs = 0;
          removeHitTimerSafely();
          destroyOwnedTweens();
          destroyFormalRig({ restoreLegacy: true });
        }
      }
      updateVisual(snapshot, deltaMs);
      return true;
    } catch (error) {
      activateFallback(error);
      syncAnchorFallback();
      return false;
    }
  }

  function setPaused(nextPaused) {
    if (destroyed) return;
    paused = nextPaused === true;
    if (fallback) return;
    const targetFormalRig = formalRig;
    try {
      if (targetFormalRig?.setPaused?.(paused) === false) {
        throw new Error("formal equipment pause transition failed");
      }
      if (!targetFormalRig) {
        if (paused) {
          visual?.anims?.pause?.();
        } else {
          visual?.anims?.resume?.();
        }
      }
      if (recoilTween) {
        const method = paused ? "pause" : "resume";
        if (typeof recoilTween[method] !== "function") {
          throw new Error(`owned recoil tween cannot ${method}`);
        }
        recoilTween[method]();
      }
      if (hitTimer) {
        hitTimer.paused = paused;
      }
    } catch (error) {
      if (!targetFormalRig) {
        activateFallback(error);
        return;
      }
      try {
        downgradeFormalToLegacy(error);
      } catch (legacyError) {
        activateFallback(legacyError);
      }
    }
  }

  function hasLiveVisual() {
    return !destroyed && !fallback && visual !== null && visual.active !== false;
  }

  function notifyHit({
    atMs,
    durationMs = DEFAULT_HIT_DURATION_MS,
    tint = 0xff6666
  } = {}) {
    if (
      !hasLiveVisual()
      || !latestSnapshot
      || typeof visual.setTint !== "function"
      || typeof visual.clearTint !== "function"
      || typeof scene?.time?.delayedCall !== "function"
    ) {
      return false;
    }

    const targetFormalRig = formalRig;
    try {
      removeHitTimer();
      const target = visual;
      const effectiveSnapshot = getEffectiveSnapshot(latestSnapshot);
      const startedAtMs = Number.isFinite(atMs) ? atMs : latestSnapshot.elapsedMs;
      const hitDurationMs = Number.isFinite(durationMs)
        ? Math.max(0, durationMs)
        : DEFAULT_HIT_DURATION_MS;
      hitUntilMs = startedAtMs + hitDurationMs;
      if (targetFormalRig) {
        if (targetFormalRig.setTint?.(tint) !== true) {
          throw new Error("formal equipment tint failed");
        }
      } else {
        target.setTint(tint);
      }
      if (!targetFormalRig && !dynamicSample && mode !== "body") {
        syncCharacterVisual(scene, target, {
          facingAngle: effectiveSnapshot.facingAngle,
          velocityX: effectiveSnapshot.velocityX,
          velocityY: effectiveSnapshot.velocityY,
          isTinted: true,
          hit: true,
          elapsedMs: startedAtMs
        });
      }
      if (paused) {
        target.anims?.pause?.();
      }

      let timer = null;
      timer = scene.time.delayedCall(hitDurationMs, () => {
        if (hitTimer !== timer) return;
        hitTimer = null;
        hitUntilMs = 0;
        if (destroyed || fallback) return;
        try {
          if (targetFormalRig) {
            if (formalRig !== targetFormalRig) return;
            if (targetFormalRig.clearTint?.() !== true) {
              throw new Error("formal equipment clear tint failed");
            }
          } else {
            if (visual !== target) return;
            target.clearTint();
          }
        } catch (error) {
          if (targetFormalRig) {
            recordError(error);
            destroyOwnedTweens();
            destroyFormalRig({ restoreLegacy: true });
          } else {
            activateFallback(error);
          }
        }
      });
      if (!timer) {
        throw new Error("scene.time.delayedCall() did not return a timer");
      }
      timer.paused = paused;
      hitTimer = timer;
      return true;
    } catch (error) {
      if (targetFormalRig) {
        try {
          downgradeFormalToLegacy(error);
        } catch (legacyRestoreError) {
          activateFallback(legacyRestoreError);
          return false;
        }
        return notifyHit({ atMs, durationMs, tint });
      }
      activateFallback(error);
      return false;
    }
  }

  function setAlpha(alpha) {
    if (
      !hasLiveVisual()
      || !Number.isFinite(alpha)
      || typeof visual.setAlpha !== "function"
    ) {
      return false;
    }
    const targetFormalRig = formalRig;
    try {
      if (targetFormalRig) {
        if (targetFormalRig.setAlpha?.(alpha) !== true) {
          throw new Error("formal equipment alpha failed");
        }
      }
      visual.setAlpha(alpha);
      formalAlpha = alpha;
      if (targetFormalRig) return true;
      dynamicSampleRig?.front?.setAlpha(alpha);
      dynamicSampleRig?.behind?.setAlpha(alpha);
      bodyPreviewRig?.front?.setAlpha(alpha);
      bodyPreviewRig?.behind?.setAlpha(alpha);
      return true;
    } catch (error) {
      if (targetFormalRig) {
        try {
          downgradeFormalToLegacy(error);
        } catch (legacyRestoreError) {
          activateFallback(legacyRestoreError);
          return false;
        }
        return setAlpha(alpha);
      }
      activateFallback(error);
      return false;
    }
  }

  function notifyAttack({ angle = 0, weaponId, heavy = false } = {}) {
    if (
      !hasLiveVisual()
      || paused
      || typeof visual?.setRotation !== "function"
      || typeof scene?.tweens?.add !== "function"
    ) {
      return false;
    }

    const useFormalRig = Boolean(formalRig && formalDefinition && formalWeaponId);
    if (useFormalRig && weaponId !== formalWeaponId) {
      return false;
    }

    try {
      removeOwnedRecoil();
      const attackAngle = Number.isFinite(angle) ? angle : 0;
      const recoilKind = heavy === true ? "heavy" : "light";
      const useDynamicSample = Boolean(dynamicSample && dynamicSampleRig);
      const useBodyPreview = Boolean(mode === "body" && bodyPreviewRig);
      const useEquipmentRig = useFormalRig || useDynamicSample || useBodyPreview;
      bodyPreviewAimAngle = attackAngle;
      if (useFormalRig) {
        formalAimAngle = attackAngle;
        formalVisualAimFacing = getFormalVisualAimFacing(
          attackAngle,
          formalVisualAimFacing
        );
      }
      if (useDynamicSample) {
        dynamicSampleAimAngle = attackAngle;
        dynamicSampleAimCommitted = true;
      }
      const targetState = useFormalRig
        ? formalEquipmentState
        : useEquipmentRig
          ? sampleEquipmentState
        : recoilState;
      const targetProperty = useEquipmentRig
        ? "recoilPx"
        : "rotationOffset";
      const peakValue = useFormalRig
        ? formalDefinition.recoilPx
        : useEquipmentRig
          ? RECOIL_TRANSLATION_PX[recoilKind]
        : getRecoilRotationOffset(attackAngle, recoilKind);
      if (!Number.isFinite(peakValue) || peakValue === 0) {
        return false;
      }
      let tween = null;
      const forgetTween = () => {
        if (recoilTween !== tween) return;
        targetState[targetProperty] = 0;
        forgetReleasedRecoil(tween);
      };
      if (useFormalRig) {
        formalEquipmentState.recoilPx = peakValue;
        if (formalRig.render(createFormalRenderState(latestSnapshot)) !== true) {
          throw new Error(`formal equipment attack render failed: ${formalWeaponId}`);
        }
      }
      const tweenProps = {
        [targetProperty]: useFormalRig
          ? { from: peakValue, to: 0 }
          : { from: 0, to: peakValue }
      };
      tween = scene.tweens.add({
        targets: targetState,
        props: tweenProps,
        duration: useFormalRig
          ? formalDefinition.recoilDurationMs
          : RECOIL_DURATION_MS[recoilKind],
        ease: useFormalRig ? "Cubic.Out" : undefined,
        yoyo: useFormalRig === false,
        onComplete: forgetTween,
        onStop: forgetTween
      });
      if (!tween) {
        targetState[targetProperty] = 0;
        return false;
      }
      recoilTween = tween;
      return true;
    } catch (error) {
      if (useFormalRig) {
        recordError(error);
        removeHitTimerSafely();
        destroyOwnedTweens();
        destroyFormalRig({ restoreLegacy: true });
      } else {
        activateFallback(error);
      }
      return false;
    }
  }

  function updateAim({ angle = 0, weaponId } = {}) {
    if (
      !hasLiveVisual()
      || paused
      || !formalRig
      || !formalDefinition
      || !formalWeaponId
      || weaponId !== formalWeaponId
    ) {
      return false;
    }

    try {
      const aimAngle = Number.isFinite(angle) ? angle : 0;
      formalAimAngle = aimAngle;
      formalVisualAimFacing = getFormalVisualAimFacing(
        aimAngle,
        formalVisualAimFacing
      );
      if (formalRig.render(createFormalRenderState(latestSnapshot)) !== true) {
        throw new Error(`formal equipment aim render failed: ${formalWeaponId}`);
      }
      return true;
    } catch (error) {
      recordError(error);
      removeHitTimerSafely();
      destroyOwnedTweens();
      destroyFormalRig({ restoreLegacy: true });
      return false;
    }
  }

  function getAttackEffectOrigin({ weaponId, angle } = {}) {
    if (
      destroyed
      || fallback
      || !formalRig
      || weaponId !== formalWeaponId
      || !Number.isFinite(angle)
    ) {
      return null;
    }
    try {
      const point = formalRig.getActionPoint?.({
        aimAngle: angle,
        recoilPx: formalEquipmentState.recoilPx
      });
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        return null;
      }
      return Object.freeze({
        x: Math.round(point.x),
        y: Math.round(point.y),
        vfxType: formalDefinition.vfxType
      });
    } catch (error) {
      recordError(error);
      return null;
    }
  }

  function setPreviewOverride(value) {
    if (destroyed || fallback) {
      return false;
    }
    let copied;
    try {
      copied = copyPreviewOverride(value);
    } catch {
      return false;
    }
    if (copied === false) {
      return false;
    }
    try {
      if (formalRig) {
        hitUntilMs = 0;
        removeHitTimerSafely();
        destroyOwnedTweens();
        destroyFormalRig({ restoreLegacy: true });
        formalAttemptedWeaponId = null;
      }
      let presentation = copied
        ? getPreviewPresentation(scene, characterId, copied)
        : allowBodyPreview
          ? getBodyPreviewPresentation(scene, characterId)
          : getNormalPresentation(scene, characterId);
      let nextDynamicSample = null;
      if (presentation.animationFamily === "dynamic-sample") {
        nextDynamicSample = copyDynamicSampleDefinition(copied?.mode);
        if (
          !nextDynamicSample
          || nextDynamicSample.textureKey !== presentation.textureKey
        ) {
          presentation = getNormalPresentation(scene, characterId);
          nextDynamicSample = null;
        }
      }
      const nextBodyPreview = presentation.mode === "body";
      if (nextBodyPreview) {
        deactivateDynamicSample();
        activateBodyPreview();
      } else {
        if (bodyPreviewRig) {
          removeOwnedRecoil();
        }
        releaseBodyPreviewRig({ strict: true });
        if (!nextDynamicSample) {
          deactivateDynamicSample();
        }
      }
      if (!visualUsesPresentation(presentation)) {
        applyVisualPresentation(presentation);
      }
      if (nextDynamicSample) {
        activateDynamicSample(nextDynamicSample);
      }
      previewOverride = copied;
      return true;
    } catch (error) {
      activateFallback(error);
      return false;
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    hitUntilMs = 0;
    removeHitTimerSafely();
    destroyOwnedTweens();
    destroyFormalRig();
    destroyVisual();
    restoreAnchor();
  }

  function snapshot() {
    return Object.freeze({
      mode,
      fallback,
      paused,
      destroyed,
      bodyPreviewRequested:
        allowBodyPreview === true || previewOverride?.mode === "body",
      previewMode: previewOverride?.mode ?? null,
      formalWeaponId,
      formalFrame: formalLocomotion?.frame ?? GROUNDED_LOCOMOTION.idleFrame,
      formalRig: formalRig !== null,
      formalFacing: formalRig ? formalFacing : null,
      formalAimAngle: formalRig ? formalAimAngle : null,
      formalVisualAimFacing: formalRig ? formalVisualAimFacing : null,
      formalRecoilPx: formalRig ? formalEquipmentState.recoilPx : 0,
      dynamicSampleMode: dynamicSample?.mode ?? null,
      dynamicSampleFrame,
      dynamicSampleRig: dynamicSampleRig !== null,
      dynamicSampleAimCommitted,
      dynamicSampleAimAngle:
        dynamicSampleAimCommitted ? dynamicSampleAimAngle : null,
      dynamicSampleFacing:
        dynamicSample?.mode === "two-direction" ? dynamicSampleFacing : null,
      dynamicSampleMirrored:
        dynamicSample?.mode === "two-direction" && dynamicSampleFacing === "right",
      hasVisual: visual !== null,
      lastError
    });
  }

  try {
    if (!anchor) {
      throw new TypeError("player presentation requires an anchor");
    }
    const presentation = allowBodyPreview
      ? getBodyPreviewPresentation(scene, characterId)
      : getNormalPresentation(scene, characterId);
    const created = scene?.add?.sprite?.(
      Number.isFinite(anchor.x) ? anchor.x : 0,
      Number.isFinite(anchor.y) ? anchor.y + 12 : 12,
      presentation.textureKey
    );
    if (!created) {
      throw new Error("scene.add.sprite() did not return a visible sprite");
    }
    visual = created;
    applyVisualPresentation(presentation);
    if (presentation.mode === "body") {
      activateBodyPreview();
      const snapshot = captureSnapshot();
      updateBodyPreviewVisual(snapshot, Object.freeze({
        ...snapshot,
        velocityX: 0,
        velocityY: 0,
        facingAngle: Math.PI / 2
      }), 0);
    } else {
      updateVisual(captureSnapshot());
    }
    anchor.setVisible?.(false);
  } catch (error) {
    activateFallback(error);
  }

  return Object.freeze({
    update,
    setPaused,
    setPreviewOverride,
    notifyHit,
    setAlpha,
    notifyAttack,
    updateAim,
    getAttackEffectOrigin,
    destroy,
    snapshot
  });
}
