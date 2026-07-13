import { THEME } from "../ui/theme.js";

const ACTION_PALETTES = Object.freeze({
  idle: Object.freeze({ fill: THEME.title.actionFill, border: THEME.title.line, borderWidth: 2, borderAlpha: 0.72, highlightAlpha: 0.24, text: THEME.text.primary, signal: THEME.terminal.frame, status: "AUTH", statusColor: THEME.text.muted, accent: THEME.title.alarm, accentAlpha: 0.58, label: "01 / 进入设施", offsetX: 0 }),
  hover: Object.freeze({ fill: THEME.title.actionHover, border: THEME.terminal.frameFocus, borderWidth: 3, borderAlpha: 1, highlightAlpha: 0.72, text: THEME.text.onButton, signal: THEME.terminal.contained, status: "READY", statusColor: THEME.text.contained, accent: THEME.title.alarm, accentAlpha: 1, label: "01 / 进入设施", offsetX: 3 }),
  pressed: Object.freeze({ fill: THEME.title.actionPressed, border: THEME.terminal.warning, borderWidth: 2, borderAlpha: 1, highlightAlpha: 0.4, text: THEME.text.onButton, signal: THEME.terminal.warning, status: "LOCK", statusColor: THEME.text.warning, accent: THEME.terminal.warning, accentAlpha: 0.9, label: "01 / 进入设施", offsetX: 3 }),
  activated: Object.freeze({ fill: THEME.title.actionFill, border: THEME.terminal.contained, borderWidth: 2, borderAlpha: 1, highlightAlpha: 0.5, text: THEME.text.contained, signal: THEME.terminal.contained, status: "OPEN", statusColor: THEME.text.contained, accent: THEME.terminal.contained, accentAlpha: 1, label: "授权中", offsetX: 3 })
});

export function getTitleActionPalette(state) {
  return ACTION_PALETTES[state] ?? ACTION_PALETTES.idle;
}

export function formatTitleCredits(value) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  if (safe > 999_999_999) return "999,999,999+";
  return safe.toLocaleString("zh-CN");
}

function register(targetArray, objects, depth) {
  for (const object of objects) {
    object.setDepth(depth);
    object.setScrollFactor(0);
    targetArray.push(object);
  }
  return objects;
}

export function createTitleAction(scene, targetArray, options) {
  const { x, y, width, height, depth, onActivate } = options;
  const frame = scene.add.graphics();
  const main = scene.add.text(x + 18, y + 20, "", {
    fontFamily: THEME.font.display,
    fontSize: "18px",
    fontStyle: "bold",
    color: THEME.text.primary
  }).setOrigin(0, 0.5);
  const detail = scene.add.text(x + 18, y + 43, "前往军械库并授权装备", {
    fontFamily: THEME.font.label,
    fontSize: "11px",
    color: THEME.text.muted
  }).setOrigin(0, 0.5);
  const index = scene.add.text(x + width - 46, y + 15, "AUTH", {
    fontFamily: THEME.font.mono,
    fontSize: "9px",
    color: THEME.text.muted
  }).setOrigin(0, 0.5);
  const signal = scene.add.graphics();
  const hitArea = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0);
  hitArea.alpha = 1;
  const accent = scene.add.rectangle(x + 4, y + 8, 3, height - 16, THEME.title.alarm, 0.9).setOrigin(0, 0);
  const objects = [frame, main, detail, index, signal, hitArea];
  objects.push(accent);
  for (const object of objects) {
    object.setDepth(depth);
    object.setScrollFactor(0);
    targetArray.push(object);
  }

  let stopped = false;
  let current = "idle";
  function setState(state) {
    if (stopped) return;
    current = state;
    const palette = getTitleActionPalette(state);
    drawActionFrame(frame, { x, y, width, height, ...palette });
    main.setText(palette.label);
    main.x = x + 18 + palette.offsetX;
    main.setColor(palette.text);
    index.setText(palette.status);
    index.setColor(palette.statusColor);
    accent.setFillStyle(palette.accent, 1);
    accent.alpha = palette.accentAlpha;
    signal.clear().fillStyle(palette.signal, 1).fillCircle(x + width - 22, y + height / 2, 5);
    signal.lineStyle(1, THEME.terminal.frameFocus, 0.8).strokeCircle(x + width - 22, y + height / 2, 5);
  }

  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on("pointerover", () => setState("hover"));
  hitArea.on("pointerout", () => setState(current === "activated" ? "activated" : "idle"));
  hitArea.on("pointerdown", () => setState("pressed"));
  hitArea.on("pointerup", () => {
    setState("activated");
    onActivate();
  });
  setState("idle");

  return {
    objects,
    hitArea,
    setState,
    stop() {
      if (stopped) return;
      stopped = true;
      hitArea.removeAllListeners();
      hitArea.disableInteractive();
      hitArea.removeInteractive();
    }
  };
}

export function createTitleScreenView(scene, targetArray, options) {
  const { credits, depth, onActivate } = options;
  const eyebrow = scene.add.text(52, 48, "SITE-CN-03 // CONTAINMENT INCIDENT", {
    fontFamily: THEME.font.mono, fontSize: "11px", color: THEME.text.muted
  });
  const alertRail = scene.add.rectangle(52, 72, 128, 24, THEME.title.alarm, 0.9).setOrigin(0, 0.5);
  const alert = scene.add.text(64, 72, "收容失效", {
    fontFamily: THEME.font.label, fontSize: "12px", fontStyle: "bold", color: THEME.text.onButton
  }).setOrigin(0, 0.5);
  const scp = scene.add.text(52, 112, "SCP", {
    fontFamily: THEME.font.display, fontSize: "34px", fontStyle: "bold", color: THEME.text.secondary
  }).setOrigin(0, 0.5);
  const title = scene.add.text(50, 164, "幸存者", {
    fontFamily: THEME.font.display, fontSize: "64px", fontStyle: "bold", color: THEME.text.primary
  }).setOrigin(0, 0.5);
  const missionLabel = scene.add.text(52, 222, "MISSION 01 // RECONTAINMENT", {
    fontFamily: THEME.font.mono, fontSize: "10px", color: THEME.text.critical
  }).setOrigin(0, 0.5);
  const mission = scene.add.text(52, 246, "进入失控设施，完成 SCP-049 再收容。", {
    fontFamily: THEME.font.body, fontSize: "15px", color: THEME.text.secondary
  }).setOrigin(0, 0.5);
  const titleObjects = register(targetArray, [eyebrow, alertRail, alert, scp, title], depth);
  const missionObjects = register(targetArray, [missionLabel, mission], depth);

  const action = createTitleAction(scene, targetArray, {
    x: 52, y: 356, width: 316, height: 62, depth, onActivate
  });
  const bottom = scene.add.rectangle(480, 517, 960, 46, THEME.title.bottomRail, 0.92).setOrigin(0.5, 0.5);
  const topLine = scene.add.rectangle(480, 494, 960, 1, THEME.title.line, 0.55).setOrigin(0.5, 0.5);
  const controls = scene.add.text(24, 517, "WASD 移动 / SPACE 闪避 / TAB 构建 / ESC 暂停 / M 静音", {
    fontFamily: THEME.font.mono, fontSize: "12px", color: THEME.text.secondary, fixedWidth: 500
  }).setOrigin(0, 0.5);
  const powerLamp = scene.add.circle(565, 517, 4, THEME.terminal.contained, 1);
  const powerStatus = scene.add.text(578, 517, "电力在线", {
    fontFamily: THEME.font.label, fontSize: "12px", fontStyle: "bold", color: THEME.text.contained
  }).setOrigin(0, 0.5);
  const dangerLamp = scene.add.circle(675, 517, 4, THEME.terminal.danger, 1);
  const dangerStatus = scene.add.text(688, 517, "收容失效", {
    fontFamily: THEME.font.label, fontSize: "12px", fontStyle: "bold", color: THEME.text.critical
  }).setOrigin(0, 0.5);
  const creditsText = scene.add.text(936, 517, `累计学分 ${formatTitleCredits(credits)}`, {
    fontFamily: THEME.font.mono, fontSize: "11px", color: THEME.text.secondary, align: "right", fixedWidth: 180
  }).setOrigin(1, 0.5);
  const bottomObjects = register(targetArray, [bottom, topLine, controls, powerLamp, powerStatus, dangerLamp, dangerStatus, creditsText], depth);

  const actionVisualObjects = action.objects.filter((object) => object !== action.hitArea);
  for (const object of [...titleObjects, ...missionObjects, ...actionVisualObjects]) object.alpha = 0;
  for (const object of titleObjects) object.x -= 16;
  for (const object of missionObjects) object.x -= 12;
  const tweens = [
    scene.tweens.add({ targets: titleObjects, x: "+=16", alpha: 1, duration: 360, ease: "Sine.Out" }),
    scene.tweens.add({ targets: missionObjects, x: "+=12", alpha: 1, delay: 120, duration: 320, ease: "Sine.Out" }),
    scene.tweens.add({ targets: actionVisualObjects, alpha: 1, delay: 240, duration: 300, ease: "Sine.Out" }),
    scene.tweens.add({ targets: dangerStatus, alpha: { from: 0.72, to: 1 }, yoyo: true, repeat: -1, delay: 700, duration: 900, ease: "Sine.InOut" })
  ];
  let stopped = false;
  const objects = [...titleObjects, ...missionObjects, ...action.objects, ...bottomObjects];
  return {
    objects,
    action,
    stop() {
      if (stopped) return;
      stopped = true;
      for (const tween of tweens) tween.stop();
      action.stop();
    }
  };
}

function drawActionFrame(graphics, { x, y, width, height, fill, border, borderWidth, borderAlpha, highlightAlpha }) {
  const cut = 8;
  graphics.clear();
  graphics.fillStyle(fill, 0.96);
  graphics.lineStyle(borderWidth, border, borderAlpha);
  graphics.beginPath();
  graphics.moveTo(x + cut, y);
  graphics.lineTo(x + width - cut, y);
  graphics.lineTo(x + width, y + cut);
  graphics.lineTo(x + width, y + height - cut);
  graphics.lineTo(x + width - cut, y + height);
  graphics.lineTo(x + cut, y + height);
  graphics.lineTo(x, y + height - cut);
  graphics.lineTo(x, y + cut);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
  graphics.lineStyle(1, THEME.terminal.frameFocus, highlightAlpha);
  graphics.beginPath();
  graphics.moveTo(x + 12, y + 4);
  graphics.lineTo(x + width - 12, y + 4);
  graphics.strokePath();
}
