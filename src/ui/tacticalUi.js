import { THEME } from "./theme.js";

function applyDisplayOptions(objects, depth, scrollFactor) {
  for (const object of objects) {
    object.setDepth(depth);
    object.setScrollFactor(scrollFactor);
  }
}

function drawClippedFrame(graphics, { x, y, width, height, fill, border, cornerCut = THEME.layout.cornerCut }) {
  const cut = Math.min(cornerCut, width / 2, height / 2);
  const right = x + width;
  const bottom = y + height;

  graphics.clear();
  graphics.fillStyle(fill, 1);
  graphics.beginPath();
  graphics.moveTo(x + cut, y);
  graphics.lineTo(right - cut, y);
  graphics.lineTo(right, y + cut);
  graphics.lineTo(right, bottom - cut);
  graphics.lineTo(right - cut, bottom);
  graphics.lineTo(x + cut, bottom);
  graphics.lineTo(x, bottom - cut);
  graphics.lineTo(x, y + cut);
  graphics.closePath();
  graphics.fillPath();
  graphics.lineStyle(1, border, 1);
  graphics.strokePath();
}

function getLampColor(state) {
  return {
    off: THEME.terminal.disabled,
    standby: THEME.terminal.frame,
    warning: THEME.terminal.warning,
    contained: THEME.terminal.contained,
    danger: THEME.terminal.danger
  }[state] ?? THEME.terminal.frame;
}

function destroyObjects(objects) {
  for (const object of objects) {
    object?.disableInteractive?.();
    object?.removeInteractive?.();
    object?.destroy?.();
    object?.removeAllListeners?.();
  }
}

function getTerminalButtonVariant(variant) {
  return {
    standard: {
      idleBorder: THEME.terminal.frame,
      focusBorder: THEME.terminal.frameFocus,
      text: THEME.text.primary,
      signal: "standby"
    },
    primary: {
      idleBorder: THEME.terminal.frameFocus,
      focusBorder: THEME.terminal.scanline,
      text: THEME.text.onButton,
      signal: "standby"
    },
    danger: {
      idleBorder: THEME.terminal.danger,
      focusBorder: THEME.terminal.danger,
      text: THEME.text.critical,
      signal: "danger"
    },
    success: {
      idleBorder: THEME.terminal.contained,
      focusBorder: THEME.terminal.contained,
      text: THEME.text.contained,
      signal: "contained"
    }
  }[variant] ?? null;
}

export function getTerminalButtonPalette(state, variant = "standard") {
  const selectedVariant = getTerminalButtonVariant(variant)
    ?? getTerminalButtonVariant("standard");
  const palettes = {
    disabled: { fill: THEME.terminal.panelFill, border: THEME.terminal.disabled, text: THEME.text.muted, signal: "off", interactive: false },
    idle: {
      fill: THEME.terminal.panelRaised,
      border: selectedVariant.idleBorder,
      text: selectedVariant.text,
      signal: selectedVariant.signal,
      interactive: true
    },
    hover: {
      fill: 0x1b2a38,
      border: selectedVariant.focusBorder,
      text: THEME.text.onButton,
      signal: selectedVariant.signal,
      interactive: true
    },
    pressed: {
      fill: 0x243747,
      border: variant === "danger" ? THEME.terminal.danger : THEME.terminal.warning,
      text: THEME.text.onButton,
      signal: variant === "danger" ? "danger" : "warning",
      interactive: true
    },
    armed: {
      fill: 0x163229,
      border: variant === "danger" ? THEME.terminal.danger : THEME.terminal.contained,
      text: THEME.text.onButton,
      signal: variant === "danger" ? "danger" : "contained",
      interactive: true
    }
  };
  return Object.freeze({ ...palettes[state] });
}

export function createStatusLamp(scene, options = {}) {
  const {
    x = 0,
    y = 0,
    radius = 5,
    state = "standby",
    depth = 0,
    scrollFactor = 0
  } = options;
  const objects = [];
  let destroyed = false;

  try {
    const lamp = scene.add.graphics();
    objects.push(lamp);
    applyDisplayOptions(objects, depth, scrollFactor);

    function setState(nextState) {
      if (destroyed) return;
      const color = getLampColor(nextState);
      lamp.clear();
      lamp.fillStyle(color, nextState === "off" ? 0.45 : 1);
      lamp.fillCircle(x, y, radius);
      lamp.lineStyle(1, THEME.terminal.frameFocus, 0.8);
      lamp.strokeCircle(x, y, radius);
    }

    setState(state);

    return {
      objects,
      lamp,
      setState,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        destroyObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    destroyObjects(objects);
    throw error;
  }
}

export function createTacticalPanel(scene, options = {}) {
  const {
    x = 0,
    y = 0,
    width = 1,
    height = 1,
    depth = 0,
    scrollFactor = 0,
    fill = THEME.terminal.panelFill,
    border = THEME.terminal.frame,
    cornerCut = THEME.layout.cornerCut
  } = options;
  const objects = [];
  let destroyed = false;

  try {
    const frame = scene.add.graphics();
    objects.push(frame);
    applyDisplayOptions(objects, depth, scrollFactor);
    drawClippedFrame(frame, { x, y, width, height, fill, border, cornerCut });

    return {
      objects,
      frame,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        destroyObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    destroyObjects(objects);
    throw error;
  }
}

export function createTerminalButton(scene, options = {}) {
  const {
    x = 0,
    y = 0,
    width = 1,
    height = THEME.layout.buttonHeight,
    text = "",
    state = "idle",
    variant = "standard",
    activateOn = "pointerup",
    depth = 0,
    scrollFactor = 0,
    onActivate = () => {}
  } = options;
  const objects = [];

  try {
    const frame = scene.add.graphics();
    objects.push(frame);
    const hitArea = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0);
    objects.push(hitArea);
    const label = scene.add.text(x + THEME.layout.panelPadding, y + height / 2, text, {
      color: THEME.text.primary,
      fontFamily: THEME.font.label,
      fontSize: THEME.fontSize.weaponHud
    });
    objects.push(label);
    label.setOrigin(0, 0.5);
    const signal = scene.add.graphics();
    objects.push(signal);
    let currentState = state;
    let restingState = state === "armed" ? "armed" : "idle";
    let destroyed = false;

    applyDisplayOptions(objects, depth, scrollFactor);

    function setState(nextState) {
      if (destroyed) return;
      const palette = getTerminalButtonPalette(nextState, variant);
      if (palette.interactive === undefined) return;

      currentState = nextState;
      if (nextState === "idle" || nextState === "armed" || nextState === "disabled") {
        restingState = nextState;
      }
      drawClippedFrame(frame, {
        x,
        y,
        width,
        height,
        fill: palette.fill,
        border: palette.border
      });
      label.setStyle({ color: palette.text });
      signal.clear();
      signal.fillStyle(getLampColor(palette.signal), palette.signal === "off" ? 0.45 : 1);
      signal.fillCircle(x + width - THEME.layout.panelPadding - 5, y + height / 2, 5);
      signal.lineStyle(1, THEME.terminal.frameFocus, 0.8);
      signal.strokeCircle(x + width - THEME.layout.panelPadding - 5, y + height / 2, 5);

      if (palette.interactive) {
        hitArea.setInteractive({ useHandCursor: true });
      } else {
        hitArea.disableInteractive();
      }
    }

    function isEnabled() {
      return !destroyed && getTerminalButtonPalette(currentState, variant).interactive;
    }

    hitArea.on("pointerover", () => {
      if (isEnabled()) setState("hover");
    });
    hitArea.on("pointerout", () => {
      if (isEnabled()) setState(restingState);
    });
    hitArea.on("pointerdown", () => {
      if (!isEnabled()) return;
      setState("pressed");
      if (activateOn === "pointerdown") {
        setState("armed");
        onActivate();
      }
    });
    hitArea.on("pointerup", () => {
      if (!isEnabled()) return;
      if (activateOn === "pointerdown") return;
      setState("armed");
      onActivate();
    });

    setState(state);

    return {
      objects,
      hitArea,
      label,
      signal,
      setState,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        destroyObjects(objects);
      }
    };
  } catch (error) {
    destroyObjects(objects);
    throw error;
  }
}
