import test from "node:test";
import assert from "node:assert/strict";

import {
  DEVELOPMENT_SPRITESHEET_ASSETS,
  IMAGE_ASSETS,
  SPRITESHEET_ASSETS,
  TEXTURES
} from "../src/assets/manifest.js";

const RUNTIME_AIM_SHEETS = [
  [TEXTURES.playerFoundationRifleAimBack, "player-foundation-rifle-aim-back", "foundation-containment-rifle-aim-back.png"],
  [TEXTURES.playerFoundationRifleAimFront, "player-foundation-rifle-aim-front", "foundation-containment-rifle-aim-front.png"],
  [TEXTURES.playerFoundationRifleAimRecoilBack, "player-foundation-rifle-aim-recoil-back", "foundation-containment-rifle-aim-recoil-back.png"],
  [TEXTURES.playerFoundationRifleAimRecoilFront, "player-foundation-rifle-aim-recoil-front", "foundation-containment-rifle-aim-recoil-front.png"],
  [TEXTURES.playerTeslaEmitterAimBack, "player-tesla-emitter-aim-back", "tesla-containment-emitter-aim-back.png"],
  [TEXTURES.playerTeslaEmitterAimFront, "player-tesla-emitter-aim-front", "tesla-containment-emitter-aim-front.png"],
  [TEXTURES.playerTeslaEmitterAimRecoilBack, "player-tesla-emitter-aim-recoil-back", "tesla-containment-emitter-aim-recoil-back.png"],
  [TEXTURES.playerTeslaEmitterAimRecoilFront, "player-tesla-emitter-aim-recoil-front", "tesla-containment-emitter-aim-recoil-front.png"]
];

const HISTORICAL_EQUIPMENT_KEYS = [
  TEXTURES.playerFoundationRifleCore,
  TEXTURES.playerTeslaEmitterCore,
  TEXTURES.playerFoundationRifleConnectorBack,
  TEXTURES.playerFoundationRifleConnectorFront,
  TEXTURES.playerTeslaEmitterConnectorBack,
  TEXTURES.playerTeslaEmitterConnectorFront,
  TEXTURES.playerFoundationRifleSameBack,
  TEXTURES.playerFoundationRifleSameFront,
  TEXTURES.playerFoundationRifleCrossBack,
  TEXTURES.playerFoundationRifleCrossFront,
  TEXTURES.playerTeslaEmitterSameBack,
  TEXTURES.playerTeslaEmitterSameFront,
  TEXTURES.playerTeslaEmitterCrossBack,
  TEXTURES.playerTeslaEmitterCrossFront
];

test("production preload keeps only operative body and eight aim/recoil equipment sheets", () => {
  assert.deepEqual(
    SPRITESHEET_ASSETS.find(({ key }) => key === TEXTURES.playerResponseOperativeBodySheet),
    {
      key: "player-response-operative-body-sheet",
      path: "assets/art/characters/player-response-operative-body.png",
      frameConfig: { frameWidth: 64, frameHeight: 64 }
    }
  );

  for (const [textureKey, key, filename] of RUNTIME_AIM_SHEETS) {
    assert.equal(textureKey, key);
    assert.deepEqual(
      SPRITESHEET_ASSETS.find((asset) => asset.key === key),
      {
        key,
        path: `assets/art/weapons/${filename}`,
        frameConfig: { frameWidth: 64, frameHeight: 64 }
      }
    );
  }
});

test("historical core connector same and cross equipment are excluded from all production preload arrays", () => {
  const productionKeys = new Set([...IMAGE_ASSETS, ...SPRITESHEET_ASSETS].map(({ key }) => key));
  for (const key of HISTORICAL_EQUIPMENT_KEYS) {
    assert.equal(productionKeys.has(key), false, `${key} must remain outside the production preload`);
  }
  assert.deepEqual(
    IMAGE_ASSETS.find(({ key }) => key === TEXTURES.playerTeslaPowerModule),
    {
      key: "player-tesla-power-module",
      path: "assets/art/weapons/tesla-containment-power-module.png"
    }
  );
});

test("compatibility weapon icons use the new 96px equipment icon files", () => {
  assert.deepEqual(
    IMAGE_ASSETS.find(({ key }) => key === TEXTURES.weaponPistolIcon),
    { key: "weapon-pistol-icon", path: "assets/art/weapons/foundation-containment-rifle-icon.png" }
  );
  assert.deepEqual(
    IMAGE_ASSETS.find(({ key }) => key === TEXTURES.weaponTeslaIcon),
    { key: "weapon-tesla-icon", path: "assets/art/weapons/tesla-containment-emitter-icon.png" }
  );
});

test("comparison sheets remain development-only and production paths never use .superpowers", () => {
  const developmentKeys = new Set(DEVELOPMENT_SPRITESHEET_ASSETS.map(({ key }) => key));
  assert.equal(developmentKeys.has(TEXTURES.playerResponseOperativePrototypeSheet), true);
  assert.equal(developmentKeys.has(TEXTURES.playerResponseOperativeBodyPrototypeSheet), true);
  assert.equal(
    [...SPRITESHEET_ASSETS, ...IMAGE_ASSETS].some(({ path }) => path.includes(".superpowers")),
    false
  );
});
