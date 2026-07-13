import { TEXTURES } from "../assets/manifest.js";
import { THEME } from "../ui/theme.js";

export function createTitleBackdrop(scene, targetArray, depth) {
  const background = scene.add.image(480, 270, TEXTURES.titleFacilityBackdrop)
    .setDepth(depth)
    .setScale(1.02);
  const gradient = scene.add.graphics().setDepth(depth + 1);
  for (let index = 0; index < 18; index += 1) {
    const fade = (17 - index) / 17;
    gradient.fillStyle(THEME.title.scrim, 0.02 + 0.78 * fade ** 2);
    gradient.fillRect(index * 32, 0, 34, 540);
  }
  const vignette = scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.08).setDepth(depth + 1);
  const gateFocus = scene.add.graphics().setDepth(depth + 2);
  gateFocus.lineStyle(1, THEME.title.line, 0.55);
  gateFocus.beginPath();
  gateFocus.moveTo(592, 182);
  gateFocus.lineTo(592, 150);
  gateFocus.lineTo(624, 150);
  gateFocus.moveTo(758, 150);
  gateFocus.lineTo(790, 150);
  gateFocus.lineTo(790, 182);
  gateFocus.moveTo(592, 388);
  gateFocus.lineTo(592, 420);
  gateFocus.lineTo(624, 420);
  gateFocus.moveTo(758, 420);
  gateFocus.lineTo(790, 420);
  gateFocus.lineTo(790, 388);
  gateFocus.strokePath();
  gateFocus.lineStyle(2, THEME.title.alarm, 0.8);
  gateFocus.beginPath();
  gateFocus.moveTo(600, 142);
  gateFocus.lineTo(624, 142);
  gateFocus.moveTo(584, 218);
  gateFocus.lineTo(592, 218);
  gateFocus.moveTo(790, 352);
  gateFocus.lineTo(798, 352);
  gateFocus.moveTo(758, 428);
  gateFocus.lineTo(782, 428);
  gateFocus.strokePath();
  const gateLabel = scene.add.text(604, 112, "GATE 03 // BREACH", {
    fontFamily: THEME.font.mono,
    fontSize: "10px",
    color: THEME.text.critical
  }).setDepth(depth + 3);
  const lamp = scene.add.circle(760, 118, 34, THEME.title.alarm, 0.1).setDepth(depth + 2);
  const scanline = scene.add.rectangle(742, 168, 72, 2, THEME.title.alarm, 0.18)
    .setDepth(depth + 3)
    .setOrigin(0.5, 0.5);
  gateFocus.alpha = 0;
  gateLabel.alpha = 0;
  scanline.alpha = 0;
  const objects = [background, gradient, vignette, gateFocus, gateLabel, lamp, scanline];
  for (const object of objects) {
    object.setScrollFactor(0);
    targetArray.push(object);
  }

  const tweens = [
    scene.tweens.add({ targets: background, scaleX: 1, scaleY: 1, duration: 600, ease: "Sine.Out" }),
    scene.tweens.add({ targets: [gateFocus, gateLabel], alpha: 1, delay: 460, duration: 220, ease: "Sine.Out" }),
    scene.tweens.add({ targets: lamp, alpha: { from: 0.06, to: 0.17 }, yoyo: true, repeat: -1, duration: 850 }),
    scene.tweens.add({ targets: scanline, y: { from: 168, to: 210 }, alpha: { from: 0.04, to: 0.2 }, delay: 460, repeat: -1, repeatDelay: 2400, duration: 620 })
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
