import { TEXTURES } from "../assets/manifest.js";
import { applyTextureAndScalePreservingBody } from "./presentationRules.js";

const entry = (config) => Object.freeze(config);

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

function hasProductionSheet(scene, config) {
  return Boolean(
    scene?.textures?.exists(config.productionTextureKey)
    && scene.textures.get(config.productionTextureKey)?.frameTotal === 5
  );
}

export function registerEnemyAnimations(scene) {
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

export function applyEnemyPresentation(scene, enemy, enemyType) {
  const config = ENEMY_PRESENTATION[enemyType];
  if (!config || !enemy) return enemy;
  if (!hasProductionSheet(scene, config)) return enemy;
  applyTextureAndScalePreservingBody(enemy, config.productionTextureKey, 1);
  enemy.setFlipX?.(false);
  if (scene.anims?.exists(config.animationKey)) enemy.play(config.animationKey, true);
  return enemy;
}
