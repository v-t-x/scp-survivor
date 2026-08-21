import { TEXTURES } from "../assets/manifest.js";

const PHASER_BASE_FRAME_COUNT = 1;
const FORMAL_BODY_TEXTURE_FRAME_TOTAL = 5 + PHASER_BASE_FRAME_COUNT;
const AIM_DIRECTION_COUNT = 16;
const AIM_TEXTURE_FRAME_TOTAL = AIM_DIRECTION_COUNT * 5 + PHASER_BASE_FRAME_COUNT;

// Equipment-local points use the 64px core coordinates where rotation zero is
// local +X. Atomic same/cross sheets remain approved fallback/reference art.
function freezePoint(point) {
  return Object.freeze({ x: point.x, y: point.y });
}

function freezeDefinition({
  weaponId,
  powerModuleTextureKey,
  aimBackTextureKey,
  aimFrontTextureKey,
  aimRecoilBackTextureKey,
  aimRecoilFrontTextureKey,
  directionCount,
  pivot,
  actionPoint,
  recoilPx,
  recoilDurationMs,
  vfxType
}) {
  return Object.freeze({
    weaponId,
    powerModuleTextureKey,
    aimBackTextureKey,
    aimFrontTextureKey,
    aimRecoilBackTextureKey,
    aimRecoilFrontTextureKey,
    directionCount,
    pivot: freezePoint(pivot),
    actionPoint: freezePoint(actionPoint),
    recoilPx,
    recoilDurationMs,
    vfxType
  });
}

const DEFINITIONS = Object.freeze({
  pistol: freezeDefinition({
    weaponId: "pistol",
    powerModuleTextureKey: null,
    aimBackTextureKey: TEXTURES.playerFoundationRifleAimBack,
    aimFrontTextureKey: TEXTURES.playerFoundationRifleAimFront,
    aimRecoilBackTextureKey: TEXTURES.playerFoundationRifleAimRecoilBack,
    aimRecoilFrontTextureKey: TEXTURES.playerFoundationRifleAimRecoilFront,
    directionCount: AIM_DIRECTION_COUNT,
    pivot: { x: 27, y: 34 },
    actionPoint: { x: 60, y: 31 },
    recoilPx: 2,
    recoilDurationMs: 75,
    vfxType: "ballistic"
  }),
  tesla: freezeDefinition({
    weaponId: "tesla",
    powerModuleTextureKey: TEXTURES.playerTeslaPowerModule,
    aimBackTextureKey: TEXTURES.playerTeslaEmitterAimBack,
    aimFrontTextureKey: TEXTURES.playerTeslaEmitterAimFront,
    aimRecoilBackTextureKey: TEXTURES.playerTeslaEmitterAimRecoilBack,
    aimRecoilFrontTextureKey: TEXTURES.playerTeslaEmitterAimRecoilFront,
    directionCount: AIM_DIRECTION_COUNT,
    pivot: { x: 30, y: 34 },
    actionPoint: { x: 60, y: 32 },
    recoilPx: 3,
    recoilDurationMs: 90,
    vfxType: "tesla"
  })
});

export function getPlayerEquipmentDefinition(weaponId) {
  return typeof weaponId === "string" && Object.hasOwn(DEFINITIONS, weaponId)
    ? DEFINITIONS[weaponId]
    : null;
}

export function validatePlayerEquipmentTextures(scene, definition) {
  const textures = scene?.textures;
  if (typeof textures?.exists !== "function" || typeof textures?.get !== "function" || !definition) {
    return false;
  }

  try {
    const hasFrames = (key, frameTotal) => (
      typeof key === "string"
      && textures.exists(key)
      && textures.get(key)?.frameTotal === frameTotal
    );
    const hasImage = (key) => typeof key === "string" && textures.exists(key);
    const aimKeys = [
      definition.aimBackTextureKey,
      definition.aimFrontTextureKey,
      definition.aimRecoilBackTextureKey,
      definition.aimRecoilFrontTextureKey
    ];

    return definition.directionCount === AIM_DIRECTION_COUNT
      && hasFrames(TEXTURES.playerResponseOperativeBodySheet, FORMAL_BODY_TEXTURE_FRAME_TOTAL)
      && (definition.powerModuleTextureKey === null || hasImage(definition.powerModuleTextureKey))
      && aimKeys.every((key) => hasFrames(key, AIM_TEXTURE_FRAME_TOTAL));
  } catch {
    return false;
  }
}
