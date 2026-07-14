import { TEXTURES } from "../assets/manifest.js";

export const CHARACTER_SHEETS = Object.freeze({
  player: Object.freeze({
    sheetKey: TEXTURES.playerOpeningSheet,
    fallbackKey: TEXTURES.player
  })
});

const DIRECTIONS = Object.freeze(["down", "left", "right", "up"]);
const MOTIONS = Object.freeze({
  idle: Object.freeze({ start: 0, end: 3, frameRate: 4 }),
  move: Object.freeze({ start: 4, end: 9, frameRate: 8 }),
  hit: Object.freeze({ start: 10, end: 11, frameRate: 10 })
});
const REQUIRED_FRAME_COUNT = 48;
const PRESENTATION_HIT_DURATION_MS = 120;
const warnedSheetKeys = new Set();

function hasCompleteSheet(scene, sheetKey) {
  return Boolean(
    scene?.textures?.exists(sheetKey)
    // Phaser includes the spritesheet's __BASE frame in frameTotal.
    && scene.textures.get(sheetKey)?.frameTotal > REQUIRED_FRAME_COUNT
  );
}

function warnForSheetOnce(scene, sheetKey) {
  if (warnedSheetKeys.has(sheetKey)) {
    return;
  }
  warnedSheetKeys.add(sheetKey);
  const message = `[character-presentation] Missing or incomplete spritesheet: ${sheetKey}; using static fallback.`;
  if (scene?.console?.warn) {
    scene.console.warn(message);
  } else {
    console.warn(message);
  }
}

export function resolveCharacterTexture(scene, kind, fallbackKey) {
  const config = CHARACTER_SHEETS[kind];
  if (!config || !hasCompleteSheet(scene, config.sheetKey)) {
    return fallbackKey;
  }
  return config.sheetKey;
}

export function registerOpeningCharacterAnimations(scene) {
  for (const [kind, config] of Object.entries(CHARACTER_SHEETS)) {
    if (!hasCompleteSheet(scene, config.sheetKey)) {
      warnForSheetOnce(scene, config.sheetKey);
      continue;
    }

    DIRECTIONS.forEach((facing, row) => {
      const sourceRow = facing === "right" ? 1 : row;
      for (const [motion, range] of Object.entries(MOTIONS)) {
        const key = `${kind}-${motion}-${facing}`;
        if (scene.anims.exists(key)) {
          continue;
        }
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(config.sheetKey, {
            start: sourceRow * 12 + range.start,
            end: sourceRow * 12 + range.end
          }),
          frameRate: range.frameRate,
          repeat: motion === "hit" ? 0 : -1
        });
      }
    });
  }
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

export function getCharacterAnimationKey({ kind, motion, facing, hit }) {
  return `${kind}-${hit ? "hit" : motion}-${facing}`;
}

function syncSprite(scene, sprite, kind) {
  const config = CHARACTER_SHEETS[kind];
  if (
    !sprite?.active
    || sprite.isDying
    || !sprite.body?.velocity
    || !config
    || sprite.texture?.key !== config.sheetKey
  ) {
    return;
  }

  const elapsedSurvivalMs = scene.elapsedSurvivalMs ?? 0;
  if (
    sprite.isTinted
    && (sprite.presentationHitUntilMs ?? 0) <= elapsedSurvivalMs
  ) {
    sprite.presentationHitUntilMs = elapsedSurvivalMs + PRESENTATION_HIT_DURATION_MS;
  }

  sprite.presentationFacing = getFacingFromVector(
    sprite.body.velocity.x,
    sprite.body.velocity.y,
    sprite.presentationFacing
  );
  sprite.setFlipX?.(sprite.presentationFacing === "right");
  const moving = sprite.body.velocity.lengthSq() > 1;
  const key = getCharacterAnimationKey({
    kind,
    motion: moving ? "move" : "idle",
    facing: sprite.presentationFacing,
    hit: (sprite.presentationHitUntilMs ?? 0) > elapsedSurvivalMs
  });
  if (scene.anims?.exists && !scene.anims.exists(key)) {
    warnForSheetOnce(scene, config.sheetKey);
    return;
  }
  if (sprite.anims.currentAnim?.key !== key) {
    sprite.play(key, true);
  }
}

export function syncCharacterPresentation(scene) {
  syncSprite(scene, scene.player, "player");
}
