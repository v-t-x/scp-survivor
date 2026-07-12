import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TEXTURES } from "../src/assets/manifest.js";
import { getFacilityRoomLayout } from "../src/art/facilityRoom.js";

test("facility layout keeps the initial combat center unobstructed", () => {
  const layout = getFacilityRoomLayout(1920, 1920);
  assert.ok(layout.length >= 12);
  assert.ok(layout.every(({ x, y }) => Math.hypot(x - 960, y - 960) >= 260));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityDoor));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityConsole));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityVent));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityDecal));
});

test("every new production environment key has an existence-guarded fallback", async () => {
  const source = await readFile(new URL("../src/assets/fallbackTextureFactory.js", import.meta.url), "utf8");
  for (const key of ["facilityFloor", "facilityWall", "facilityDoor", "facilityConsole", "facilityVent", "facilityDecal"]) {
    assert.match(source, new RegExp(`ensureTexture\\(scene, TEXTURES\\.${key}`));
  }
});
