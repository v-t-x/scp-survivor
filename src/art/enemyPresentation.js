import {
  PRODUCTION_SPRITESHEET_KEYS,
  TEXTURES
} from "../assets/manifest.js";
import {
  CHARACTER_DISPLAY_SCALE,
  applyTextureAndScalePreservingBody
} from "./presentationRules.js";

const entry = (config) => Object.freeze(config);
const clip = (start, end, frameRate, repeat, extra = {}) => entry({
  start,
  end,
  frameRate,
  repeat,
  ...extra
});
const clipMap = (clips) => Object.freeze(clips);

export const ENEMY_PRESENTATION = Object.freeze({
  infectedStaff: entry({
    productionTextureKey: TEXTURES.r17Drifter,
    animationKey: "r17-drifter-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 6
  }),
  crawler: entry({
    productionTextureKey: TEXTURES.r17RiftSkimmer,
    animationKey: "r17-rift-skimmer-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 10
  }),
  drone: entry({
    productionTextureKey: TEXTURES.r17PulseSac,
    animationKey: "r17-pulse-sac-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 6
  }),
  riotUnit: entry({
    productionTextureKey: TEXTURES.r17CarapaceGate,
    animationKey: "r17-carapace-gate-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 4
  }),
  blinkStalker: entry({
    productionTextureKey: TEXTURES.r17FrameGap,
    animationKey: "r17-frame-gap-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 8
  }),
  biomass: entry({
    productionTextureKey: TEXTURES.r17BroodMass,
    animationKey: "r17-brood-mass-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 4
  }),
  biomassChild: entry({
    productionTextureKey: TEXTURES.r17Bud,
    animationKey: "r17-bud-loop",
    frameWidth: 32,
    frameHeight: 32,
    frameRate: 10
  })
});

const FORMAL_ENEMY_PRESENTATION = Object.freeze({
  infectedStaff: entry({
    textureKey: TEXTURES.r17DrifterActionSheet,
    frameTotal: 19,
    keyPrefix: "r17-drifter-action",
    clips: clipMap({
      move: clip(0, 5, 6, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      contact: clip(14, 17, 12, 0)
    })
  }),
  crawler: entry({
    textureKey: TEXTURES.r17RiftSkimmerActionSheet,
    frameTotal: 19,
    keyPrefix: "r17-rift-skimmer-action",
    clips: clipMap({
      move: clip(0, 5, 12, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      pierce: clip(14, 17, 15, 0)
    })
  }),
  drone: entry({
    textureKey: TEXTURES.r17PulseSacActionSheet,
    frameTotal: 21,
    keyPrefix: "r17-pulse-sac-action",
    clips: clipMap({
      move: clip(0, 5, 6, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      shoot: clip(14, 19, 10, 0, { releaseFrame: 18 })
    })
  }),
  riotUnit: entry({
    textureKey: TEXTURES.r17CarapaceGateActionSheet,
    frameTotal: 23,
    keyPrefix: "r17-carapace-gate-action",
    clips: clipMap({
      move: clip(0, 5, 6, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      brace: clip(14, 17, 5, 0),
      charge: clip(18, 21, 9, -1)
    })
  }),
  blinkStalker: entry({
    textureKey: TEXTURES.r17FrameGapActionSheet,
    frameTotal: 23,
    keyPrefix: "r17-frame-gap-action",
    clips: clipMap({
      move: clip(0, 5, 8, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      "phase-out": clip(14, 17, 6, 0),
      "reappear-dash": clip(18, 21, 12.5, -1)
    })
  }),
  biomass: entry({
    textureKey: TEXTURES.r17BroodMassActionSheet,
    frameTotal: 23,
    keyPrefix: "r17-brood-mass-action",
    clips: clipMap({
      move: clip(0, 5, 5, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      split: clip(14, 21, 12, 0)
    })
  }),
  biomassChild: entry({
    textureKey: TEXTURES.r17BudActionSheet,
    frameTotal: 19,
    keyPrefix: "r17-bud-action",
    clips: clipMap({
      move: clip(0, 5, 12, -1),
      hit: clip(6, 7, 24, 0),
      death: clip(8, 13, 12, 0),
      snap: clip(14, 17, 16, 0)
    })
  })
});

const SCP049_DIRECTIONS = Object.freeze(["down", "left", "right", "up"]);
const SCP049_LOCOMOTION_CLIPS = clipMap({
  idle: clip(0, 3, 5, -1),
  walk: clip(4, 9, 8, -1)
});
const SCP049_ACTION_CLIPS = clipMap({
  "frenzy-enter": clip(0, 4, 10, 0),
  "frenzy-loop": clip(5, 8, 8, -1),
  "hit-overlay": clip(9, 10, 24, 0),
  recontain: clip(11, 18, 12, 0)
});

function getFrameTotal(scene, textureKey) {
  if (!scene?.textures?.exists?.(textureKey)) return null;
  const frameTotal = scene.textures.get?.(textureKey)?.frameTotal;
  return Number.isFinite(frameTotal) ? frameTotal : null;
}

function hasExactSheet(scene, textureKey, frameTotal) {
  return getFrameTotal(scene, textureKey) === frameTotal;
}

function hasProductionSheet(scene, config) {
  return hasExactSheet(scene, config.productionTextureKey, 5);
}

function getCandidateIds(options) {
  if (options?.candidateIds instanceof Set) return options.candidateIds;
  if (Array.isArray(options?.candidateIds)) return new Set(options.candidateIds);
  return new Set();
}

function isSheetPermitted(textureKey, options) {
  if (PRODUCTION_SPRITESHEET_KEYS.has(textureKey)) return true;
  return Boolean(
    options?.isDevelopment === true
    && options?.candidateMode === true
    && getCandidateIds(options).has(textureKey)
  );
}

function isDevelopmentForceLegacy(options) {
  return options?.isDevelopment === true && options?.forceLegacy === true;
}

export function getEnemyAnimationKey(enemyType, clipName) {
  const config = FORMAL_ENEMY_PRESENTATION[enemyType];
  if (!config || !Object.hasOwn(config.clips, clipName)) {
    throw new RangeError(`unknown enemy animation: ${enemyType}-${clipName}`);
  }
  return `${config.keyPrefix}-${clipName}`;
}

export function getScp049LocomotionAnimationKey(direction, clipName) {
  if (!SCP049_DIRECTIONS.includes(direction) || !Object.hasOwn(SCP049_LOCOMOTION_CLIPS, clipName)) {
    throw new RangeError(`unknown SCP-049 locomotion animation: ${direction}-${clipName}`);
  }
  return `enemy-scp049-${direction}-${clipName}`;
}

function getScp049ActionAnimationKey(clipName) {
  if (!Object.hasOwn(SCP049_ACTION_CLIPS, clipName)) {
    throw new RangeError(`unknown SCP-049 action animation: ${clipName}`);
  }
  return `enemy-scp049-${clipName}`;
}

function buildEnemyAnimationDefinitions(enemyType, config) {
  return Object.entries(config.clips).map(([clipName, range]) => ({
    key: getEnemyAnimationKey(enemyType, clipName),
    textureKey: config.textureKey,
    ...range
  }));
}

function buildScp049LocomotionDefinitions() {
  const definitions = [];
  SCP049_DIRECTIONS.forEach((direction, row) => {
    for (const [clipName, range] of Object.entries(SCP049_LOCOMOTION_CLIPS)) {
      definitions.push({
        key: getScp049LocomotionAnimationKey(direction, clipName),
        textureKey: TEXTURES.enemyScp049LocomotionSheet,
        start: row * 10 + range.start,
        end: row * 10 + range.end,
        frameRate: range.frameRate,
        repeat: range.repeat
      });
    }
  });
  return definitions;
}

function buildScp049ActionDefinitions() {
  return Object.entries(SCP049_ACTION_CLIPS).map(([clipName, range]) => ({
    key: getScp049ActionAnimationKey(clipName),
    textureKey: TEXTURES.enemyScp049ActionSheet,
    ...range
  }));
}

function allAnimationsExist(scene, definitions) {
  return definitions.every(({ key }) => scene?.anims?.exists?.(key));
}

function removeAnimations(scene, definitions) {
  if (typeof scene?.anims?.remove !== "function") return false;
  for (const { key } of definitions) scene.anims.remove(key);
  return true;
}

function registerAnimationBatch(scene, definitions) {
  const existingCount = definitions.filter(({ key }) => scene.anims.exists(key)).length;
  if (existingCount === definitions.length) return true;
  if (existingCount > 0 && !removeAnimations(scene, definitions)) return false;

  const created = [];
  try {
    for (const definition of definitions) {
      scene.anims.create({
        key: definition.key,
        frames: scene.anims.generateFrameNumbers(definition.textureKey, {
          start: definition.start,
          end: definition.end
        }),
        frameRate: definition.frameRate,
        repeat: definition.repeat
      });
      created.push(definition);
    }
    return true;
  } catch {
    removeAnimations(scene, created);
    return false;
  }
}

function registerLegacyEnemyAnimations(scene) {
  for (const config of Object.values(ENEMY_PRESENTATION)) {
    if (!hasProductionSheet(scene, config) || scene.anims.exists(config.animationKey)) continue;
    scene.anims.create({
      key: config.animationKey,
      frames: scene.anims.generateFrameNumbers(config.productionTextureKey, { start: 0, end: 3 }),
      frameRate: config.frameRate,
      repeat: -1
    });
  }
}

export function registerEnemyAnimations(scene, options = {}) {
  registerLegacyEnemyAnimations(scene);

  if (!isDevelopmentForceLegacy(options)) {
    for (const [enemyType, config] of Object.entries(FORMAL_ENEMY_PRESENTATION)) {
      if (
        !isSheetPermitted(config.textureKey, options)
        || !hasExactSheet(scene, config.textureKey, config.frameTotal)
      ) {
        continue;
      }
      registerAnimationBatch(scene, buildEnemyAnimationDefinitions(enemyType, config));
    }

    if (
      isSheetPermitted(TEXTURES.enemyScp049LocomotionSheet, options)
      && hasExactSheet(scene, TEXTURES.enemyScp049LocomotionSheet, 41)
    ) {
      registerAnimationBatch(scene, buildScp049LocomotionDefinitions());
    }
    if (
      isSheetPermitted(TEXTURES.enemyScp049ActionSheet, options)
      && hasExactSheet(scene, TEXTURES.enemyScp049ActionSheet, 20)
    ) {
      registerAnimationBatch(scene, buildScp049ActionDefinitions());
    }
  }
}

export function getEnemyPresentationMode(scene, enemyType, options = {}) {
  const formal = FORMAL_ENEMY_PRESENTATION[enemyType];
  const legacy = ENEMY_PRESENTATION[enemyType];
  if (!formal || !legacy) return { family: "unchanged" };

  const formalDefinitions = buildEnemyAnimationDefinitions(enemyType, formal);
  if (
    !isDevelopmentForceLegacy(options)
    && isSheetPermitted(formal.textureKey, options)
    && hasExactSheet(scene, formal.textureKey, formal.frameTotal)
    && allAnimationsExist(scene, formalDefinitions)
  ) {
    const mode = {
      family: "formal",
      textureKey: formal.textureKey,
      animationKey: getEnemyAnimationKey(enemyType, "move"),
      displayScale: 1
    };
    const releaseFrame = formal.clips.shoot?.releaseFrame;
    if (Number.isInteger(releaseFrame)) mode.releaseFrame = releaseFrame;
    return mode;
  }

  if (hasProductionSheet(scene, legacy)) {
    return {
      family: "legacy",
      textureKey: legacy.productionTextureKey,
      animationKey: legacy.animationKey,
      displayScale: 1
    };
  }
  return { family: "unchanged" };
}

export function getScp049PresentationMode(scene, options = {}) {
  if (!isDevelopmentForceLegacy(options)) {
    const locomotionDefinitions = buildScp049LocomotionDefinitions();
    const hasLocomotion = (
      isSheetPermitted(TEXTURES.enemyScp049LocomotionSheet, options)
      && hasExactSheet(scene, TEXTURES.enemyScp049LocomotionSheet, 41)
      && allAnimationsExist(scene, locomotionDefinitions)
    );
    if (hasLocomotion) {
      const actionDefinitions = buildScp049ActionDefinitions();
      const hasAction = (
        isSheetPermitted(TEXTURES.enemyScp049ActionSheet, options)
        && hasExactSheet(scene, TEXTURES.enemyScp049ActionSheet, 20)
        && allAnimationsExist(scene, actionDefinitions)
      );
      return hasAction
        ? {
            family: "formal",
            locomotionTextureKey: TEXTURES.enemyScp049LocomotionSheet,
            actionTextureKey: TEXTURES.enemyScp049ActionSheet,
            displayScale: 1
          }
        : {
            family: "formal-locomotion",
            locomotionTextureKey: TEXTURES.enemyScp049LocomotionSheet,
            actionTextureKey: TEXTURES.enemyScp049,
            displayScale: 1
          };
    }
  }

  if (scene?.textures?.exists?.(TEXTURES.enemyScp049)) {
    return {
      family: "static",
      textureKey: TEXTURES.enemyScp049,
      displayScale: CHARACTER_DISPLAY_SCALE.scp049
    };
  }
  return { family: "unchanged" };
}

export function applyEnemyPresentation(scene, enemy, enemyType, options = {}) {
  if (!enemy) return enemy;

  if (enemyType === "scp049") {
    const mode = getScp049PresentationMode(scene, options);
    if (mode.family === "formal" || mode.family === "formal-locomotion") {
      applyTextureAndScalePreservingBody(enemy, mode.locomotionTextureKey, mode.displayScale);
      enemy.setFlipX?.(false);
      const animationKey = getScp049LocomotionAnimationKey("down", "idle");
      if (scene.anims?.exists(animationKey)) enemy.play(animationKey, true);
    } else if (mode.family === "static") {
      applyTextureAndScalePreservingBody(enemy, mode.textureKey, mode.displayScale);
      enemy.setFlipX?.(false);
    }
    return enemy;
  }

  const mode = getEnemyPresentationMode(scene, enemyType, options);
  if (mode.family !== "formal" && mode.family !== "legacy") return enemy;
  applyTextureAndScalePreservingBody(enemy, mode.textureKey, mode.displayScale);
  enemy.setFlipX?.(false);
  if (scene.anims?.exists(mode.animationKey)) enemy.play(mode.animationKey, true);
  return enemy;
}

export function getRiotArmorArcPresentation(frontArcDegrees = 120) {
  const halfArc = (frontArcDegrees * Math.PI) / 360;
  return Object.freeze({
    radius: 28,
    startAngle: -halfArc,
    endAngle: halfArc
  });
}
