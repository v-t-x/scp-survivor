import { TEXTURES } from "../assets/manifest.js";
import { THEME } from "../ui/theme.js";

export function createTitleBackdrop(scene, targetArray, depth) {
  const background = scene.add.image(480, 270, TEXTURES.titleFacilityBackdrop).setDepth(depth);
  const scrim = scene.add.rectangle(220, 270, 440, 540, 0x03070c, 0.72).setDepth(depth + 1);
  const lamp = scene.add.circle(804, 112, 42, THEME.terminal.danger, 0.14).setDepth(depth + 2);
  const scanline = scene.add.rectangle(220, 0, 440, 2, THEME.terminal.scanline, 0.08).setDepth(depth + 2);
  const objects = [background, scrim, lamp, scanline];

  for (const object of objects) {
    object.setScrollFactor(0);
    targetArray.push(object);
  }

  const tween = scene.tweens.add({
    targets: [lamp, scanline],
    alpha: { from: 0.06, to: 0.18 },
    yoyo: true,
    repeat: -1,
    duration: 1100
  });

  return { objects, stop: () => tween.stop() };
}
