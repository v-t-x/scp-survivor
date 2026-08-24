import test from "node:test";
import assert from "node:assert/strict";

import { TEXTURES } from "../src/assets/manifest.js";
import {
  getPlayerEquipmentDefinition,
  validatePlayerEquipmentTextures
} from "../src/art/playerEquipmentDefinitions.js";

const EQUIPMENT_FIELDS = [
  "weaponId",
  "powerModuleTextureKey",
  "aimBackTextureKey",
  "aimFrontTextureKey",
  "aimRecoilBackTextureKey",
  "aimRecoilFrontTextureKey",
  "directionCount",
  "pivot",
  "actionPoint",
  "recoilPx",
  "recoilDurationMs",
  "vfxType"
];

const AIM_KEYS = new Set([
  TEXTURES.playerFoundationRifleAimBack,
  TEXTURES.playerFoundationRifleAimFront,
  TEXTURES.playerFoundationRifleAimRecoilBack,
  TEXTURES.playerFoundationRifleAimRecoilFront,
  TEXTURES.playerTeslaEmitterAimBack,
  TEXTURES.playerTeslaEmitterAimFront,
  TEXTURES.playerTeslaEmitterAimRecoilBack,
  TEXTURES.playerTeslaEmitterAimRecoilFront
]);

function createTextureScene({
  bodyFrames = 6,
  aimFrames = 81,
  missing = []
} = {}) {
  const missingKeys = new Set(missing);
  return {
    textures: {
      exists(key) {
        return !missingKeys.has(key);
      },
      get(key) {
        return {
          frameTotal: key === TEXTURES.playerResponseOperativeBodySheet
            ? bodyFrames
            : AIM_KEYS.has(key) ? aimFrames : 1
        };
      }
    }
  };
}

test("returns the immutable sixteen-direction rifle pose definition", () => {
  const definition = getPlayerEquipmentDefinition("pistol");

  assert.deepEqual(definition, {
    weaponId: "pistol",
    powerModuleTextureKey: null,
    aimBackTextureKey: TEXTURES.playerFoundationRifleAimBack,
    aimFrontTextureKey: TEXTURES.playerFoundationRifleAimFront,
    aimRecoilBackTextureKey: TEXTURES.playerFoundationRifleAimRecoilBack,
    aimRecoilFrontTextureKey: TEXTURES.playerFoundationRifleAimRecoilFront,
    directionCount: 16,
    pivot: { x: 27, y: 34 },
    actionPoint: { x: 60, y: 31 },
    recoilPx: 2,
    recoilDurationMs: 75,
    vfxType: "ballistic"
  });
  assert.deepEqual(Object.keys(definition), EQUIPMENT_FIELDS);
  assert.equal(Object.isFrozen(definition), true);
  for (const point of [definition.pivot, definition.actionPoint]) {
    assert.equal(Object.isFrozen(point), true);
  }
  assert.throws(() => { definition.actionPoint.x = 0; }, TypeError);
});

test("returns the immutable sixteen-direction Tesla pose definition with a body-local pack", () => {
  const definition = getPlayerEquipmentDefinition("tesla");

  assert.deepEqual(definition, {
    weaponId: "tesla",
    powerModuleTextureKey: TEXTURES.playerTeslaPowerModule,
    aimBackTextureKey: TEXTURES.playerTeslaEmitterAimBack,
    aimFrontTextureKey: TEXTURES.playerTeslaEmitterAimFront,
    aimRecoilBackTextureKey: TEXTURES.playerTeslaEmitterAimRecoilBack,
    aimRecoilFrontTextureKey: TEXTURES.playerTeslaEmitterAimRecoilFront,
    directionCount: 16,
    pivot: { x: 30, y: 34 },
    actionPoint: { x: 60, y: 32 },
    recoilPx: 3,
    recoilDurationMs: 90,
    vfxType: "tesla"
  });
  assert.equal(Object.isFrozen(definition), true);
  assert.equal(Object.isFrozen(definition.actionPoint), true);
  assert.equal(getPlayerEquipmentDefinition("shotgun"), null);
  assert.equal(getPlayerEquipmentDefinition(), null);
});

test("rejects prototype-chain names as unknown equipment", () => {
  const scene = createTextureScene();

  for (const weaponId of ["toString", "constructor", "__proto__"]) {
    const definition = getPlayerEquipmentDefinition(weaponId);

    assert.equal(definition, null, `${weaponId} is not an allowed player weapon`);
    assert.equal(
      validatePlayerEquipmentTextures(scene, definition),
      false,
      `${weaponId} cannot pass texture validation through a loose texture manager`
    );
  }
});

test("requires body, four eighty-frame aim atlases and the optional Tesla pack", () => {
  const pistol = getPlayerEquipmentDefinition("pistol");
  const tesla = getPlayerEquipmentDefinition("tesla");

  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ bodyFrames: 6 }), pistol), true);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ bodyFrames: 6 }), tesla), true);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene(), pistol), true);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ bodyFrames: 4 }), pistol), false);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ bodyFrames: 5 }), pistol), false);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ bodyFrames: 7 }), pistol), false);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ bodyFrames: NaN }), pistol), false);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ aimFrames: 80 }), pistol), false);
  assert.equal(validatePlayerEquipmentTextures(createTextureScene({ aimFrames: 82 }), tesla), false);
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerResponseOperativeBodySheet] }), pistol),
    false
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerFoundationRifleAimFront] }), pistol),
    false
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerFoundationRifleAimRecoilBack] }), pistol),
    false
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerTeslaEmitterAimBack] }), tesla),
    false
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerTeslaEmitterAimRecoilFront] }), tesla),
    false
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({
      missing: [
        TEXTURES.playerFoundationRifleCore,
        TEXTURES.playerFoundationRifleConnectorBack,
        TEXTURES.playerFoundationRifleSameFront
      ]
    }), pistol),
    true,
    "rejected continuous and two-direction rollback art is not a formal runtime dependency"
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerTeslaPowerModule] }), tesla),
    false
  );
  assert.equal(
    validatePlayerEquipmentTextures(createTextureScene({ missing: [TEXTURES.playerTeslaEmitterAimFront] }), tesla),
    false
  );
  assert.equal(validatePlayerEquipmentTextures(createTextureScene(), null), false);
});
