import { THEME } from "../ui/theme.js";

const FRAME_PALETTES = {
  idle: {
    fill: 0x091018,
    fillAlpha: 0.72,
    border: THEME.terminal.frame,
    rail: THEME.terminal.disabled
  },
  inspect: {
    fill: 0x111c25,
    fillAlpha: 0.82,
    border: THEME.terminal.warning,
    rail: THEME.terminal.frameFocus
  },
  locked: {
    fill: 0x10251f,
    fillAlpha: 0.88,
    border: THEME.terminal.contained,
    rail: THEME.terminal.contained
  }
};

function drawArmoryFrame(graphics, { x, y, width, height, frame }) {
  const palette = FRAME_PALETTES[frame] ?? FRAME_PALETTES.idle;
  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  const cut = 10;

  graphics.clear();
  graphics.fillStyle(palette.fill, palette.fillAlpha);
  graphics.lineStyle(frame === "locked" ? 3 : 2, palette.border, 1);
  graphics.beginPath();
  graphics.moveTo(left + cut, top);
  graphics.lineTo(right - cut, top);
  graphics.lineTo(right, top + cut);
  graphics.lineTo(right, bottom - cut);
  graphics.lineTo(right - cut, bottom);
  graphics.lineTo(left + cut, bottom);
  graphics.lineTo(left, bottom - cut);
  graphics.lineTo(left, top + cut);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();

  graphics.lineStyle(3, palette.rail, 0.9);
  graphics.beginPath();
  graphics.moveTo(left + 12, top + 24);
  graphics.lineTo(left + 12, bottom - 24);
  graphics.moveTo(right - 12, top + 24);
  graphics.lineTo(right - 12, bottom - 24);
  graphics.strokePath();
}

function getLampColor(state) {
  return {
    standby: THEME.terminal.frame,
    warning: THEME.terminal.warning,
    contained: THEME.terminal.contained
  }[state] ?? THEME.terminal.frame;
}

export function getWeaponSlotVisualState({ selected, hovered }) {
  if (selected) {
    return Object.freeze({
      frame: "locked",
      lamp: "contained",
      selectedLabelVisible: true
    });
  }
  if (hovered) {
    return Object.freeze({
      frame: "inspect",
      lamp: "warning",
      selectedLabelVisible: false
    });
  }
  return Object.freeze({
    frame: "idle",
    lamp: "standby",
    selectedLabelVisible: false
  });
}

export function createArmorySlot(scene, options) {
  const {
    x,
    y,
    width,
    height,
    textureKey,
    name,
    role,
    stats,
    depth,
    scrollFactor = 0,
    onActivate
  } = options;
  const frame = scene.add.graphics().setDepth(depth);
  const icon = scene.add.image(x, y - 76, textureKey).setDisplaySize(96, 96).setDepth(depth + 1);
  const nameText = scene.add.text(x, y - 6, name, options.nameStyle).setOrigin(0.5).setDepth(depth + 1);
  const roleText = scene.add.text(x, y + 28, role, options.roleStyle).setOrigin(0.5).setDepth(depth + 1);
  const statsText = scene.add.text(
    x,
    y + 82,
    stats.slice(0, 3).map(({ label, value }) => `${label}  ${value}`).join("\n"),
    options.statsStyle
  ).setOrigin(0.5).setDepth(depth + 1);
  const lamp = scene.add.circle(
    x,
    y - height / 2 + 18,
    4,
    THEME.terminal.disabled,
    1
  ).setDepth(depth + 2);
  const lockedLabel = scene.add.text(
    x,
    y + height / 2 - 22,
    "装备锁定",
    options.lockedStyle
  ).setOrigin(0.5).setDepth(depth + 2);
  const hitArea = scene.add.rectangle(x, y, width, height, 0xffffff, 0.001)
    .setDepth(depth + 3)
    .setInteractive({ useHandCursor: true });
  hitArea.on("pointerdown", onActivate);

  const objects = [frame, icon, nameText, roleText, statsText, lamp, lockedLabel, hitArea];
  for (const object of objects) {
    object.setScrollFactor?.(scrollFactor);
  }

  function setState(next) {
    const state = getWeaponSlotVisualState(next);
    drawArmoryFrame(frame, { x, y, width, height, frame: state.frame });
    lamp.setFillStyle(getLampColor(state.lamp), 1);
    lockedLabel.setVisible(state.selectedLabelVisible);
  }

  setState({ selected: false, hovered: false });

  return { objects, hitArea, setState };
}
