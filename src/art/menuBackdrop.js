import { TEXTURES } from "../assets/manifest.js";

const MENU_WIDTH = 960;
const MENU_HEIGHT = 540;

export function createFacilityMenuBackdrop(scene, targetArray, depth) {
  const centerX = MENU_WIDTH / 2;
  const centerY = MENU_HEIGHT / 2;
  const layers = [
    scene.add
      .tileSprite(centerX, centerY, MENU_WIDTH, MENU_HEIGHT, TEXTURES.facilityFloor)
      .setDepth(depth),
    scene.add
      .image(centerX, 32, TEXTURES.facilityWall)
      .setDisplaySize(MENU_WIDTH, 64)
      .setDepth(depth + 1),
    scene.add
      .image(centerX, MENU_HEIGHT - 32, TEXTURES.facilityWall)
      .setDisplaySize(MENU_WIDTH, 64)
      .setDepth(depth + 1),
    scene.add.image(MENU_WIDTH - 64, centerY, TEXTURES.facilityDoor).setDepth(depth + 1),
    scene.add.image(112, MENU_HEIGHT - 92, TEXTURES.facilityConsole).setDepth(depth + 1),
    scene.add.rectangle(centerX, centerY, MENU_WIDTH, MENU_HEIGHT, 0x03060c, 0.44).setDepth(depth + 2)
  ];

  for (const layer of layers) {
    layer.setScrollFactor(0);
    targetArray.push(layer);
  }

  return layers;
}
