import { TEXTURES } from "../assets/manifest.js";
import { THEME } from "../ui/theme.js";

export function createTitleBackdrop(scene, targetArray, depth) {
  const background = scene.add.image(480, 270, TEXTURES.titleFacilityBackdrop)
    .setDepth(depth)
    .setScale(1.02);
  const gradient = scene.add.graphics().setDepth(depth + 1);
  for (let index = 0; index < 12; index += 1) {
    gradient.fillStyle(THEME.title.scrim, Math.max(0.08, 0.82 - index * 0.065));
    gradient.fillRect(index * 48, 0, 52, 540);
  }
  const vignette = scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.08).setDepth(depth + 1);
  const gateFocus = scene.add.graphics().setDepth(depth + 2);
  gateFocus.lineStyle(1, THEME.title.line, 0.55);
  gateFocus.strokeRect(592, 124, 286, 366);
  gateFocus.lineStyle(3, THEME.title.alarm, 0.75);
  gateFocus.strokeRect(604, 136, 22, 3);
  gateFocus.strokeRect(844, 474, 22, 3);
  const gateLabel = scene.add.text(604, 112, "GATE 03 // BREACH", {
    fontFamily: THEME.font.mono,
    fontSize: "10px",
    color: THEME.text.critical
  }).setDepth(depth + 3);
  const lamp = scene.add.circle(804, 112, 42, THEME.title.alarm, 0.1).setDepth(depth + 2);
  const scanline = scene.add.rectangle(735, 166, 224, 2, THEME.title.alarm, 0.18)
    .setDepth(depth + 3)
    .setOrigin(0.5, 0.5);
  const objects = [background, gradient, vignette, gateFocus, gateLabel, lamp, scanline];
  for (const object of objects) {
    object.setScrollFactor(0);
    targetArray.push(object);
  }

  const tweens = [
    scene.tweens.add({ targets: background, scaleX: 1, scaleY: 1, duration: 600, ease: "Sine.Out" }),
    scene.tweens.add({ targets: lamp, alpha: { from: 0.06, to: 0.17 }, yoyo: true, repeat: -1, duration: 850 }),
    scene.tweens.add({ targets: scanline, y: { from: 166, to: 452 }, alpha: { from: 0.04, to: 0.2 }, repeat: -1, repeatDelay: 2400, duration: 900 })
  ];
  let stopped = false;
  return {
    objects,
    stop() {
      if (stopped) return;
      stopped = true;
      for (const tween of tweens) tween.stop();
    }
  };
}
