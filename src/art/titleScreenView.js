import { THEME } from "../ui/theme.js";

const ACTION_PALETTES = Object.freeze({
  idle: Object.freeze({ fill: THEME.title.actionFill, border: THEME.title.line, text: THEME.text.primary, signal: THEME.terminal.frame, label: "01 / 进入设施", offsetX: 0 }),
  hover: Object.freeze({ fill: THEME.title.actionHover, border: THEME.terminal.frameFocus, text: THEME.text.onButton, signal: THEME.terminal.contained, label: "01 / 进入设施", offsetX: 3 }),
  pressed: Object.freeze({ fill: THEME.title.actionPressed, border: THEME.terminal.warning, text: THEME.text.onButton, signal: THEME.terminal.warning, label: "01 / 进入设施", offsetX: 3 }),
  activated: Object.freeze({ fill: THEME.title.actionFill, border: THEME.terminal.contained, text: THEME.text.contained, signal: THEME.terminal.contained, label: "授权中", offsetX: 3 })
});

export function getTitleActionPalette(state) {
  return ACTION_PALETTES[state] ?? ACTION_PALETTES.idle;
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
    drawActionFrame(frame, { x, y, width, height, fill: palette.fill, border: palette.border });
    main.setText(palette.label);
    main.x = x + 18 + palette.offsetX;
    main.setColor(palette.text);
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

function drawActionFrame(graphics, { x, y, width, height, fill, border }) {
  const cut = 8;
  graphics.clear();
  graphics.fillStyle(fill, 0.96);
  graphics.lineStyle(2, border, 1);
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
  graphics.lineStyle(1, THEME.terminal.frameFocus, 0.3);
  graphics.beginPath();
  graphics.moveTo(x + 12, y + 4);
  graphics.lineTo(x + width - 12, y + 4);
  graphics.strokePath();
}
