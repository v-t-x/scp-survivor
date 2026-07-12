import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

const expected = new Map([
  [TEXTURES.facilityFloor, [32, 32]],
  [TEXTURES.facilityWall, [64, 64]],
  [TEXTURES.facilityDoor, [64, 64]],
  [TEXTURES.facilityConsole, [64, 64]],
  [TEXTURES.facilityVent, [32, 32]],
  [TEXTURES.facilityDecal, [32, 32]],
  [TEXTURES.player, [48, 48]],
  [TEXTURES.enemyInfected, [48, 48]],
  [TEXTURES.enemyScp049, [64, 80]]
]);

function readPngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

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

test("production PNGs exist at their exact approved dimensions", async () => {
  for (const { key, path } of IMAGE_ASSETS) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    assert.deepEqual(readPngSize(await readFile(absolute)), expected.get(key), key);
  }
});
