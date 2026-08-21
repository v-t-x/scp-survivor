import { TEXTURES } from "../assets/manifest.js";
import { applyTextureAndScalePreservingBody } from "./presentationRules.js";
import { getPlayerDynamicSampleDefinition } from "./playerDynamicSampleDefinitions.js";
import {
  BODY_SOCKET_FRAME_COUNT,
  BODY_SOCKET_SCHEMA_VERSION,
  PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS
} from "./playerResponseOperativeBodySockets.js";

export const DEFAULT_CHARACTER_ID = "foundation-response-operative";

export const CHARACTER_PROFILES = Object.freeze({
  [DEFAULT_CHARACTER_ID]: Object.freeze({
    prototypeSheetKey: TEXTURES.playerResponseOperativePrototypeSheet,
    productionSheetKey: TEXTURES.playerResponseOperativeSheet,
    fallbackSheetKey: TEXTURES.playerOpeningSheet,
    fallbackTextureKey: TEXTURES.player,
    frameWidth: 64,
    frameHeight: 64,
    prototypeFrameCount: 28,
    productionFrameCount: 120,
    displayScale: 1,
    fallbackDisplayScale: 1.2
  })
});

const FACING_NAMES = Object.freeze(["down", "left", "right", "up"]);
const LEGACY_MOTION_NAMES = Object.freeze(["idle", "move", "hit"]);
const PROTOTYPE_MOTION_NAMES = Object.freeze([
  "idle",
  "forward",
  "backward",
  "strafeLeft",
  "strafeRight"
]);
const PRODUCTION_MOTION_NAMES = Object.freeze([...PROTOTYPE_MOTION_NAMES, "hit"]);

const LEGACY_MOTIONS = Object.freeze({
  idle: Object.freeze({ start: 0, end: 3, frameRate: 4, repeat: -1 }),
  move: Object.freeze({ start: 4, end: 9, frameRate: 8, repeat: -1 }),
  hit: Object.freeze({ start: 10, end: 11, frameRate: 10, repeat: 0 })
});
const LEGACY_FRAMES_PER_DIRECTION = 12;
const LEGACY_REQUIRED_FRAME_COUNT = 48;

const PRODUCTION_MOTIONS = Object.freeze({
  idle: Object.freeze({ start: 0, end: 3, frameRate: 4, repeat: -1 }),
  forward: Object.freeze({ start: 4, end: 9, frameRate: 8, repeat: -1 }),
  backward: Object.freeze({ start: 10, end: 15, frameRate: 8, repeat: -1 }),
  strafeLeft: Object.freeze({ start: 16, end: 21, frameRate: 8, repeat: -1 }),
  strafeRight: Object.freeze({ start: 22, end: 27, frameRate: 8, repeat: -1 }),
  hit: Object.freeze({ start: 28, end: 29, frameRate: 10, repeat: 0 })
});
const PRODUCTION_FRAMES_PER_DIRECTION = 30;

const PRESENTATION_HIT_DURATION_MS = 120;
const DYNAMIC_SAMPLE_FRAME_COUNT = 5;
const BODY_PROTOTYPE_FRAME_COUNT = 28;

// Per-AnimationManager bookkeeping: which sheet keys failed a preflight or a
// transactional create, and which sheet keys already emitted their single
// warning. Keyed by the game-global AnimationManager, so the state lives
// exactly as long as the loaded textures it describes; warn-once therefore
// means once per app boot, not once per run.
const managerStateByAnims = new WeakMap();

// Presentation-only hit window per sprite. Kept off the sprite and off the
// scene so syncing never writes gameplay fields; a destroyed sprite drops out
// of the WeakMap with its owner.
const hitWindowDeadlineBySprite = new WeakMap();

function getManagerState(scene) {
  const manager = scene?.anims ?? scene;
  let state = managerStateByAnims.get(manager);
  if (!state) {
    state = { failedSheetKeys: new Set(), warnedSheetKeys: new Set() };
    managerStateByAnims.set(manager, state);
  }
  return state;
}

function isSheetFailed(scene, sheetKey) {
  return getManagerState(scene).failedSheetKeys.has(sheetKey);
}

function markSheetFailedAndWarnOnce(scene, sheetKey, error = null) {
  const state = getManagerState(scene);
  state.failedSheetKeys.add(sheetKey);
  if (state.warnedSheetKeys.has(sheetKey)) {
    return;
  }
  state.warnedSheetKeys.add(sheetKey);
  const detail = error?.message ? ` (${error.message})` : "";
  const message = `[character-presentation] Missing, incomplete or failing spritesheet: ${sheetKey}; falling back to the previous character presentation.${detail}`;
  if (scene?.console?.warn) {
    scene.console.warn(message);
  } else {
    console.warn(message);
  }
}

function getSheetFrameTotal(scene, sheetKey) {
  if (!scene?.textures?.exists?.(sheetKey)) {
    return null;
  }
  const frameTotal = scene.textures.get?.(sheetKey)?.frameTotal;
  return Number.isFinite(frameTotal) ? frameTotal : null;
}

function hasLegacySheet(scene, sheetKey) {
  const frameTotal = getSheetFrameTotal(scene, sheetKey);
  // Phaser includes the spritesheet's __BASE frame in frameTotal.
  return frameTotal !== null && frameTotal > LEGACY_REQUIRED_FRAME_COUNT;
}

function hasExactSheet(scene, sheetKey, frameCount) {
  // Phaser includes the spritesheet's __BASE frame in frameTotal.
  return getSheetFrameTotal(scene, sheetKey) === frameCount + 1;
}

function hasCompleteBodySocketContract(profile) {
  if (
    BODY_SOCKET_SCHEMA_VERSION !== 1
    || BODY_SOCKET_FRAME_COUNT !== BODY_PROTOTYPE_FRAME_COUNT
    || !Array.isArray(PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS)
    || PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS.length !== BODY_PROTOTYPE_FRAME_COUNT
  ) {
    return false;
  }
  return PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS.every((socket, index) => (
    socket?.index === index
    && ["front", "behind"].includes(socket.equipmentLayer)
    && ["gripX", "gripY", "supportX", "supportY"].every((key) => (
      Number.isInteger(socket[key])
      && socket[key] >= 0
      && socket[key] < profile.frameWidth
    ))
  ));
}

export function getPlayerMotion({ velocityX, velocityY, facingAngle }) {
  const speedSq = velocityX * velocityX + velocityY * velocityY;
  if (!Number.isFinite(speedSq) || speedSq <= 1) return "idle";
  const angle = Number.isFinite(facingAngle) ? facingAngle : 0;
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const longitudinal = velocityX * forwardX + velocityY * forwardY;
  const lateral = forwardX * velocityY - forwardY * velocityX;
  if (Math.abs(longitudinal) >= Math.abs(lateral)) {
    return longitudinal >= 0 ? "forward" : "backward";
  }
  return lateral >= 0 ? "strafeRight" : "strafeLeft";
}

export function getCharacterAnimationKey({ characterId, animationFamily, motion, facing }) {
  if (animationFamily === "legacy") {
    if (!LEGACY_MOTION_NAMES.includes(motion) || !FACING_NAMES.includes(facing)) {
      throw new RangeError(`legacy animations only cover idle/move/hit per direction; got ${motion}-${facing}`);
    }
    return `${characterId}-legacy-${motion}-${facing}`;
  }
  if (animationFamily === "prototype") {
    // The Gate 2 prototype sheet contains only the down locomotion row: no hit
    // frames and no left/right/up rows may be requested from it.
    if (facing !== "down" || !PROTOTYPE_MOTION_NAMES.includes(motion)) {
      throw new RangeError(`prototype animations only cover down locomotion; got ${motion}-${facing}`);
    }
    return `${characterId}-prototype-${motion}-down`;
  }
  if (animationFamily === "production") {
    if (!PRODUCTION_MOTION_NAMES.includes(motion) || !FACING_NAMES.includes(facing)) {
      throw new RangeError(`unknown production animation ${motion}-${facing}`);
    }
    return `${characterId}-production-${motion}-${facing}`;
  }
  throw new RangeError(`unknown character animation family: ${animationFamily}`);
}

function buildLegacyAnimationDefinitions(characterId, profile) {
  const definitions = [];
  FACING_NAMES.forEach((facing, row) => {
    // Historical contract: the legacy sheet has no dedicated right row, so
    // right-facing animations reuse the left row and mirror it via flipX.
    const sourceRow = facing === "right" ? 1 : row;
    for (const motion of LEGACY_MOTION_NAMES) {
      const range = LEGACY_MOTIONS[motion];
      definitions.push({
        key: getCharacterAnimationKey({ characterId, animationFamily: "legacy", motion, facing }),
        sheetKey: profile.fallbackSheetKey,
        start: sourceRow * LEGACY_FRAMES_PER_DIRECTION + range.start,
        end: sourceRow * LEGACY_FRAMES_PER_DIRECTION + range.end,
        frameRate: range.frameRate,
        repeat: range.repeat
      });
    }
  });
  return definitions;
}

function buildPrototypeAnimationDefinitions(characterId, profile) {
  return PROTOTYPE_MOTION_NAMES.map((motion) => {
    const range = PRODUCTION_MOTIONS[motion];
    return {
      key: getCharacterAnimationKey({ characterId, animationFamily: "prototype", motion, facing: "down" }),
      sheetKey: profile.prototypeSheetKey,
      start: range.start,
      end: range.end,
      frameRate: range.frameRate,
      repeat: range.repeat
    };
  });
}

function buildProductionAnimationDefinitions(characterId, profile) {
  const definitions = [];
  FACING_NAMES.forEach((facing, row) => {
    for (const motion of PRODUCTION_MOTION_NAMES) {
      const range = PRODUCTION_MOTIONS[motion];
      definitions.push({
        key: getCharacterAnimationKey({ characterId, animationFamily: "production", motion, facing }),
        sheetKey: profile.productionSheetKey,
        start: row * PRODUCTION_FRAMES_PER_DIRECTION + range.start,
        end: row * PRODUCTION_FRAMES_PER_DIRECTION + range.end,
        frameRate: range.frameRate,
        repeat: range.repeat
      });
    }
  });
  return definitions;
}

function registerAnimationBatch(scene, definitions, sheetKey) {
  const keys = definitions.map(({ key }) => key);
  const existingCount = keys.filter((key) => scene.anims.exists(key)).length;
  if (existingCount === keys.length) return true;
  if (existingCount > 0) keys.forEach((key) => scene.anims.remove(key));
  const created = [];
  try {
    for (const definition of definitions) {
      scene.anims.create({
        key: definition.key,
        frames: scene.anims.generateFrameNumbers(definition.sheetKey, {
          start: definition.start,
          end: definition.end
        }),
        frameRate: definition.frameRate,
        repeat: definition.repeat
      });
      created.push(definition.key);
    }
    return true;
  } catch (error) {
    created.forEach((key) => scene.anims.remove(key));
    markSheetFailedAndWarnOnce(scene, sheetKey, error);
    return false;
  }
}

export function registerOpeningCharacterAnimations(scene) {
  for (const characterId of Object.keys(CHARACTER_PROFILES)) {
    const profile = CHARACTER_PROFILES[characterId];

    if (hasLegacySheet(scene, profile.fallbackSheetKey)) {
      registerAnimationBatch(scene, buildLegacyAnimationDefinitions(characterId, profile), profile.fallbackSheetKey);
    } else {
      markSheetFailedAndWarnOnce(scene, profile.fallbackSheetKey);
    }

    // The Gate 2 prototype sheet is a dev-only asset: a normal boot preloads
    // it through the manifest but never resolves it without the explicit
    // development bridge, so a fully absent sheet stays silent. A present
    // sheet must be exactly 28 frames (+ __BASE) or the batch is refused.
    if (getSheetFrameTotal(scene, profile.prototypeSheetKey) !== null) {
      if (
        hasExactSheet(scene, profile.prototypeSheetKey, profile.prototypeFrameCount)
        && !isSheetFailed(scene, profile.prototypeSheetKey)
      ) {
        registerAnimationBatch(scene, buildPrototypeAnimationDefinitions(characterId, profile), profile.prototypeSheetKey);
      } else {
        markSheetFailedAndWarnOnce(scene, profile.prototypeSheetKey);
      }
    }

    if (
      hasExactSheet(scene, profile.productionSheetKey, profile.productionFrameCount)
      && !isSheetFailed(scene, profile.productionSheetKey)
    ) {
      registerAnimationBatch(scene, buildProductionAnimationDefinitions(characterId, profile), profile.productionSheetKey);
    } else {
      markSheetFailedAndWarnOnce(scene, profile.productionSheetKey);
    }
  }
}

export function resolveCharacterPresentation(
  scene,
  characterId = DEFAULT_CHARACTER_ID,
  {
    allowPrototype = false,
    allowBodyPreview = false,
    sampleMode = null
  } = {}
) {
  const profile = CHARACTER_PROFILES[characterId];
  if (!profile) {
    throw new RangeError(`unknown character id: ${characterId}`);
  }

  const sampleDefinition = getPlayerDynamicSampleDefinition(sampleMode);
  if (
    sampleDefinition
    && hasExactSheet(
      scene,
      sampleDefinition.textureKey,
      DYNAMIC_SAMPLE_FRAME_COUNT
    )
    && !isSheetFailed(scene, sampleDefinition.textureKey)
  ) {
    return {
      characterId,
      textureKey: sampleDefinition.textureKey,
      animationFamily: "dynamic-sample",
      displayScale: profile.displayScale,
      sampleMode: sampleDefinition.mode
    };
  }

  if (
    allowBodyPreview
    && hasExactSheet(
      scene,
      TEXTURES.playerResponseOperativeBodyPrototypeSheet,
      BODY_PROTOTYPE_FRAME_COUNT
    )
    && !isSheetFailed(scene, TEXTURES.playerResponseOperativeBodyPrototypeSheet)
    && hasCompleteBodySocketContract(profile)
  ) {
    return {
      characterId,
      textureKey: TEXTURES.playerResponseOperativeBodyPrototypeSheet,
      animationFamily: "prototype",
      displayScale: profile.displayScale
    };
  }

  // Normal gameplay never resolves the Gate 2 prototype; only an explicit
  // development bridge may pass allowPrototype.
  if (
    allowPrototype
    && hasExactSheet(scene, profile.prototypeSheetKey, profile.prototypeFrameCount)
    && !isSheetFailed(scene, profile.prototypeSheetKey)
  ) {
    return {
      characterId,
      textureKey: profile.prototypeSheetKey,
      animationFamily: "prototype",
      displayScale: profile.displayScale
    };
  }
  if (
    hasExactSheet(scene, profile.productionSheetKey, profile.productionFrameCount)
    && !isSheetFailed(scene, profile.productionSheetKey)
  ) {
    return {
      characterId,
      textureKey: profile.productionSheetKey,
      animationFamily: "production",
      displayScale: profile.displayScale
    };
  }
  if (hasLegacySheet(scene, profile.fallbackSheetKey) && !isSheetFailed(scene, profile.fallbackSheetKey)) {
    return {
      characterId,
      textureKey: profile.fallbackSheetKey,
      animationFamily: "legacy",
      displayScale: profile.fallbackDisplayScale
    };
  }
  return {
    characterId,
    textureKey: profile.fallbackTextureKey,
    animationFamily: "static",
    displayScale: profile.fallbackDisplayScale
  };
}

export function getFacingFromVector(x, y, previousFacing = "down") {
  if (x === 0 && y === 0) {
    return previousFacing;
  }
  if (Math.abs(x) >= Math.abs(y)) {
    return x < 0 ? "left" : "right";
  }
  return y < 0 ? "up" : "down";
}

function getFacingFromAngle(angle, previousFacing) {
  if (!Number.isFinite(angle)) {
    return previousFacing;
  }
  return getFacingFromVector(Math.cos(angle), Math.sin(angle), previousFacing);
}

function toLegacyMotion(motion) {
  if (motion === "hit") {
    return "hit";
  }
  return motion === "idle" ? "idle" : "move";
}

function resolvePresentationHit(sprite, elapsedSurvivalMs, isTinted = sprite.isTinted) {
  if (isTinted && (hitWindowDeadlineBySprite.get(sprite) ?? 0) <= elapsedSurvivalMs) {
    hitWindowDeadlineBySprite.set(sprite, elapsedSurvivalMs + PRESENTATION_HIT_DURATION_MS);
  }
  return (hitWindowDeadlineBySprite.get(sprite) ?? 0) > elapsedSurvivalMs;
}

function playAnimationIfRegistered(scene, sprite, sheetKey, key) {
  if (scene.anims?.exists && !scene.anims.exists(key)) {
    markSheetFailedAndWarnOnce(scene, sheetKey);
    return;
  }
  if (sprite.anims?.currentAnim?.key !== key) {
    sprite.play(key, true);
  }
}

function inferAnimationFamily(sprite, profile) {
  const textureKey = sprite.texture?.key;
  if (textureKey === profile.prototypeSheetKey) {
    return "prototype";
  }
  if (textureKey === profile.productionSheetKey) {
    return "production";
  }
  if (textureKey === profile.fallbackSheetKey) {
    return "legacy";
  }
  return "static";
}

function syncPrototypePresentation(scene, sprite, characterId, profile, facing, motion) {
  const usePrototypeSheet = facing === "down" && motion !== "hit";
  const targetSheetKey = usePrototypeSheet ? profile.prototypeSheetKey : profile.fallbackSheetKey;
  const targetScale = usePrototypeSheet ? profile.displayScale : profile.fallbackDisplayScale;
  if (sprite.texture?.key !== targetSheetKey || sprite.scaleX !== targetScale) {
    applyTextureAndScalePreservingBody(sprite, targetSheetKey, targetScale);
  }
  if (usePrototypeSheet) {
    sprite.setFlipX?.(false);
    playAnimationIfRegistered(
      scene,
      sprite,
      profile.prototypeSheetKey,
      getCharacterAnimationKey({ characterId, animationFamily: "prototype", motion, facing: "down" })
    );
    return;
  }
  // Any hit, and every left/right/up state, drops back to the original legacy
  // sheet with its historical right mirror.
  sprite.setFlipX?.(facing === "right");
  playAnimationIfRegistered(
    scene,
    sprite,
    profile.fallbackSheetKey,
    getCharacterAnimationKey({ characterId, animationFamily: "legacy", motion: toLegacyMotion(motion), facing })
  );
}

export function syncCharacterVisual(scene, sprite, presentationInput = null) {
  if (!sprite?.active || sprite.isDying) {
    return;
  }
  const characterId = sprite.characterId ?? DEFAULT_CHARACTER_ID;
  const profile = CHARACTER_PROFILES[characterId] ?? CHARACTER_PROFILES[DEFAULT_CHARACTER_ID];
  // The Gate 2 dev driver installs a sticky override plus an enable flag on
  // the player sprite; the regular frame sync (called without arguments) must
  // keep honoring them until the driver restores. The prototype path stays
  // unreachable without both the flag and an exact 28-frame sheet.
  const stickyOverride = presentationInput ?? sprite.presentationSmokeOverride ?? null;
  const prototypeRequested = sprite.presentationPrototypeEnabled === true
    && stickyOverride !== null
    && hasExactSheet(scene, profile.prototypeSheetKey, profile.prototypeFrameCount)
    && !isSheetFailed(scene, profile.prototypeSheetKey);
  const family = prototypeRequested
    ? "prototype"
    : (sprite.presentationAnimationFamily ?? inferAnimationFamily(sprite, profile));
  if (family === "static") {
    return;
  }

  const currentElapsedMs = stickyOverride?.elapsedMs ?? scene.elapsedSurvivalMs ?? 0;
  // An override is consumed read-only for this frame; nothing below copies it
  // into the scene, the Arcade body, timers, RNG or persistence.
  const input = stickyOverride ?? {
    facingAngle: scene.playerFacingAngle,
    velocityX: sprite.body?.velocity?.x ?? 0,
    velocityY: sprite.body?.velocity?.y ?? 0,
    isTinted: sprite.isTinted
  };
  const hit = typeof input.hit === "boolean"
    ? input.hit
    : resolvePresentationHit(sprite, currentElapsedMs, input.isTinted === true);

  sprite.presentationFacing = getFacingFromAngle(input.facingAngle, sprite.presentationFacing);
  const facing = sprite.presentationFacing;
  const motion = hit
    ? "hit"
    : getPlayerMotion({
      velocityX: input.velocityX ?? 0,
      velocityY: input.velocityY ?? 0,
      facingAngle: input.facingAngle
    });

  if (family === "prototype") {
    syncPrototypePresentation(scene, sprite, characterId, profile, facing, motion);
    return;
  }

  if (family === "production") {
    sprite.setFlipX?.(false);
    playAnimationIfRegistered(
      scene,
      sprite,
      profile.productionSheetKey,
      getCharacterAnimationKey({ characterId, animationFamily: "production", motion, facing })
    );
    return;
  }

  sprite.setFlipX?.(facing === "right");
  playAnimationIfRegistered(
    scene,
    sprite,
    profile.fallbackSheetKey,
    getCharacterAnimationKey({ characterId, animationFamily: "legacy", motion: toLegacyMotion(motion), facing })
  );
}

export function syncCharacterPresentation(scene, presentationOverride = null) {
  const sprite = scene?.player;
  if (!sprite?.body?.velocity) {
    return;
  }
  syncCharacterVisual(scene, sprite, presentationOverride);
}
