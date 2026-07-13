import { TEXTURES } from "../assets/manifest.js";

const NEAREST_FILTER = 1;

export function getFacilityRoomLayout(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;

  return [
    { key: TEXTURES.facilityWall, x: centerX - 320, y: centerY - 224, depth: -10 },
    { key: TEXTURES.facilityDoor, x: centerX - 256, y: centerY - 224, depth: -8 },
    { key: TEXTURES.facilityWall, x: centerX - 224, y: centerY - 224, depth: -10 },
    { key: TEXTURES.facilityConsole, x: centerX + 320, y: centerY - 160, depth: -8 },
    { key: TEXTURES.facilityVent, x: centerX - 256, y: centerY + 160, depth: -9 },
    { key: TEXTURES.facilityDecal, x: centerX + 256, y: centerY + 160, depth: -7 },
    { key: TEXTURES.facilityDoor, x: width / 2, y: 96, depth: -8 },
    { key: TEXTURES.facilityDoor, x: width / 2, y: height - 96, depth: -8 },
    { key: TEXTURES.facilityConsole, x: 160, y: 192, depth: -8 },
    { key: TEXTURES.facilityConsole, x: width - 160, y: height - 192, depth: -8 },
    { key: TEXTURES.facilityVent, x: 128, y: 448, depth: -9 },
    { key: TEXTURES.facilityVent, x: width - 128, y: 448, depth: -9 },
    { key: TEXTURES.facilityVent, x: 128, y: height - 448, depth: -9 },
    { key: TEXTURES.facilityVent, x: width - 128, y: height - 448, depth: -9 },
    { key: TEXTURES.facilityDecal, x: 384, y: 192, depth: -7 },
    { key: TEXTURES.facilityDecal, x: width - 384, y: 192, depth: -7 },
    { key: TEXTURES.facilityDecal, x: 384, y: height - 192, depth: -7 },
    { key: TEXTURES.facilityDecal, x: width - 384, y: height - 192, depth: -7 }
  ];
}

export function applyProductionTextureFiltering(scene) {
  for (const key of Object.values(TEXTURES)) {
    if (scene.textures.exists(key)) {
      scene.textures.get(key).setFilter(NEAREST_FILTER);
    }
  }
}

export function createFacilityRoomVisuals(scene, width, height) {
  applyProductionTextureFiltering(scene);

  const objects = [
    scene.add.tileSprite(width / 2, height / 2, width, height, TEXTURES.facilityFloor).setDepth(-20)
  ];

  for (let x = 32; x < width; x += 64) {
    objects.push(scene.add.image(x, 32, TEXTURES.facilityWall).setDepth(-10));
    objects.push(scene.add.image(x, height - 32, TEXTURES.facilityWall).setDepth(-10));
  }
  for (let y = 96; y < height - 32; y += 64) {
    objects.push(scene.add.image(32, y, TEXTURES.facilityWall).setDepth(-10));
    objects.push(scene.add.image(width - 32, y, TEXTURES.facilityWall).setDepth(-10));
  }

  for (const { key, x, y, depth } of getFacilityRoomLayout(width, height)) {
    objects.push(scene.add.image(x, y, key).setDepth(depth));
  }

  return objects;
}
