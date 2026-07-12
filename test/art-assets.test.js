import test from "node:test";
import assert from "node:assert/strict";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

function assertApprovedStaticImageAssets(assets) {
  assert.equal(assets.length, 9);
  assert.equal(
    new Set(assets.map(({ key }) => key)).size,
    assets.length,
    "duplicate texture keys detected"
  );
  assert.deepEqual(
    new Map(assets.map(({ key, path }) => [key, path])),
    new Map([
      [TEXTURES.facilityFloor, "assets/art/facility/floor.png"],
      [TEXTURES.facilityWall, "assets/art/facility/wall.png"],
      [TEXTURES.facilityDoor, "assets/art/facility/door.png"],
      [TEXTURES.facilityConsole, "assets/art/facility/console.png"],
      [TEXTURES.facilityVent, "assets/art/facility/vent.png"],
      [TEXTURES.facilityDecal, "assets/art/facility/decal.png"],
      [TEXTURES.player, "assets/art/characters/player.png"],
      [TEXTURES.enemyInfected, "assets/art/characters/infected-staff.png"],
      [TEXTURES.enemyScp049, "assets/art/characters/scp-049.png"]
    ])
  );
}

test("production manifest declares the approved static vertical slice", () => {
  assertApprovedStaticImageAssets(IMAGE_ASSETS);
});

test("production manifest contract rejects duplicate texture keys", () => {
  const duplicateAssets = IMAGE_ASSETS.map((asset, index) =>
    index === 1 ? { ...asset, key: IMAGE_ASSETS[0].key } : asset
  );

  assert.throws(
    () => assertApprovedStaticImageAssets(duplicateAssets),
    /duplicate texture keys detected/
  );
});
