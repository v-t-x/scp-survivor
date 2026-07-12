import test from "node:test";
import assert from "node:assert/strict";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

test("production manifest declares the approved static vertical slice", () => {
  assert.deepEqual(
    new Map(IMAGE_ASSETS.map(({ key, path }) => [key, path])),
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
});
