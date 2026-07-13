import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TEXTURES } from "../src/assets/manifest.js";
import { getFacilityRoomLayout } from "../src/art/facilityRoom.js";

test("facility layout frames the unobstructed initial camera view", () => {
  const layout = getFacilityRoomLayout(1920, 1920);
  const camera = { centerX: 960, centerY: 960, width: 960, height: 540 };
  const viewportMargin = 32;
  const visibleLeft = camera.centerX - camera.width / 2 + viewportMargin;
  const visibleRight = camera.centerX + camera.width / 2 - viewportMargin;
  const visibleTop = camera.centerY - camera.height / 2 + viewportMargin;
  const visibleBottom = camera.centerY + camera.height / 2 - viewportMargin;
  const textureDimensions = new Map([
    [TEXTURES.facilityWall, { width: 64, height: 64 }],
    [TEXTURES.facilityDoor, { width: 64, height: 64 }],
    [TEXTURES.facilityConsole, { width: 64, height: 64 }],
    [TEXTURES.facilityVent, { width: 32, height: 32 }],
    [TEXTURES.facilityDecal, { width: 32, height: 32 }]
  ]);

  assert.ok(layout.length >= 12);
  assert.ok(layout.every(({ key, x, y }) => {
    const { width, height } = textureDimensions.get(key);
    const closestX = Math.max(Math.abs(x - camera.centerX) - width / 2, 0);
    const closestY = Math.max(Math.abs(y - camera.centerY) - height / 2, 0);
    return Math.hypot(closestX, closestY) >= 260;
  }));

  for (const key of [
    TEXTURES.facilityWall,
    TEXTURES.facilityDoor,
    TEXTURES.facilityConsole,
    TEXTURES.facilityVent,
    TEXTURES.facilityDecal
  ]) {
    assert.ok(layout.some((item) => (
      item.key === key
      && item.x >= visibleLeft
      && item.x <= visibleRight
      && item.y >= visibleTop
      && item.y <= visibleBottom
    )), `${key} should be visible inside the initial camera view`);
  }
});

test("every new production environment key has an existence-guarded fallback", async () => {
  const source = await readFile(new URL("../src/assets/fallbackTextureFactory.js", import.meta.url), "utf8");
  for (const key of ["facilityFloor", "facilityWall", "facilityDoor", "facilityConsole", "facilityVent", "facilityDecal"]) {
    assert.match(source, new RegExp(`ensureTexture\\(scene, TEXTURES\\.${key}`));
  }
});
