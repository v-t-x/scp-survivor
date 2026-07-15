import { THEME } from "./theme.js";
import { createStatusLamp, createTacticalPanel } from "./tacticalUi.js";

const DEFAULT_VIEWPORT_WIDTH = 960;
const DEFAULT_VIEWPORT_HEIGHT = 540;
const DEFAULT_FADE_DURATION_MS = 120;
const INITIAL_FADE_ALPHA = 0.001;
const CARD_TEXT_WIDTH = 180;
const CARD_ICON_SIZE = 32;

function cleanUpObject(object) {
  if (!object) return;
  try {
    object.disableInteractive?.();
    object.removeInteractive?.();
    object.destroy?.();
  } finally {
    object.removeAllListeners?.();
  }
}

function createTracker() {
  const objects = [];
  const seen = new Set();
  return {
    objects,
    add(...candidates) {
      for (const candidate of candidates.flat()) {
        if (candidate && !seen.has(candidate)) {
          seen.add(candidate);
          objects.push(candidate);
        }
      }
      return candidates.at(-1);
    },
    destroy() {
      for (const object of [...objects].reverse()) {
        try {
          cleanUpObject(object);
        } catch {
          // Continue releasing the rest of the transaction.
        }
      }
    }
  };
}

function ownDisplayObject(tracker, object, depth, scrollFactor) {
  tracker.add(object);
  object.setDepth(depth);
  object.setScrollFactor(scrollFactor);
  return object;
}

function viewportSize(scene) {
  const width = scene.scale?.width ?? scene.cameras?.main?.width ?? DEFAULT_VIEWPORT_WIDTH;
  const height = scene.scale?.height ?? scene.cameras?.main?.height ?? DEFAULT_VIEWPORT_HEIGHT;
  return {
    width: Number.isFinite(width) && width > 0 ? width : DEFAULT_VIEWPORT_WIDTH,
    height: Number.isFinite(height) && height > 0 ? height : DEFAULT_VIEWPORT_HEIGHT
  };
}

function tonePresentation(tone) {
  return {
    standard: { color: THEME.terminal.frameFocus, lamp: "standby" },
    primary: { color: THEME.terminal.scanline, lamp: "standby" },
    weapon: { color: THEME.terminal.warning, lamp: "warning" },
    mutation: { color: THEME.signal.anomaly, lamp: "warning" },
    warning: { color: THEME.terminal.warning, lamp: "warning" },
    danger: { color: THEME.terminal.danger, lamp: "danger" },
    success: { color: THEME.terminal.contained, lamp: "contained" },
    contained: { color: THEME.terminal.contained, lamp: "contained" }
  }[tone] ?? { color: THEME.terminal.frameFocus, lamp: "standby" };
}

function estimatedTextWidth(value, fontSize) {
  return [...String(value ?? "")].reduce(
    (width, character) => width + (character.codePointAt(0) > 255 ? fontSize : fontSize * 0.58),
    0
  );
}

function textBounds(textObject) {
  const bounds = textObject.getBounds?.();
  return {
    width: bounds?.width ?? textObject.width ?? 0,
    height: bounds?.height ?? textObject.height ?? 0
  };
}

function textFits(textObject, value, { width, maxHeight, fontSize, maxLines }) {
  const estimatedLines = Math.max(1, Math.ceil(estimatedTextWidth(value, fontSize) / width));
  const lineHeight = fontSize + 2;
  const heightLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  if (estimatedLines > Math.min(maxLines, heightLines)) return false;
  const bounds = textBounds(textObject);
  return bounds.width <= width + 0.5 && bounds.height <= maxHeight + 0.5;
}

function fitTextToBox(textObject, value, {
  width,
  maxHeight,
  startSize,
  minSize = 12,
  maxLines = Number.POSITIVE_INFINITY
}) {
  const source = String(value ?? "");
  for (let fontSize = startSize; fontSize >= minSize; fontSize -= 1) {
    textObject.setFontSize(fontSize);
    textObject.setText(source);
    if (textFits(textObject, source, { width, maxHeight, fontSize, maxLines })) {
      return source;
    }
  }

  textObject.setFontSize(minSize);
  let shortened = source;
  while (shortened.length > 0) {
    shortened = shortened.slice(0, -1);
    const candidate = `${shortened}…`;
    textObject.setText(candidate);
    if (textFits(textObject, candidate, {
      width,
      maxHeight,
      fontSize: minSize,
      maxLines
    })) {
      return candidate;
    }
  }
  textObject.setText(source ? "…" : "");
  return textObject.text;
}

function addText(scene, tracker, parent, {
  x,
  y,
  text,
  style,
  origin = [0, 0],
  depth,
  scrollFactor
}) {
  const object = ownDisplayObject(
    tracker,
    scene.add.text(x, y, text, style),
    depth,
    scrollFactor
  );
  object.setOrigin(...origin);
  parent?.add(object);
  return object;
}

function drawEdgeShade(graphics, width, height) {
  const edge = Math.max(20, Math.round(Math.min(width, height) * 0.055));
  graphics.clear();
  graphics.fillStyle(0x000000, 0.46);
  graphics.fillRect(0, 0, width, edge);
  graphics.fillRect(0, height - edge, width, edge);
  graphics.fillRect(0, edge, edge, height - edge * 2);
  graphics.fillRect(width - edge, edge, edge, height - edge * 2);
}

function drawScanlines(graphics, x, y, width, height) {
  graphics.clear();
  graphics.lineStyle(1, THEME.terminal.scanline, 0.07);
  for (let lineY = y + 10; lineY < y + height - 10; lineY += 5) {
    graphics.lineBetween(x + 10, lineY, x + width - 10, lineY);
  }
}

function drawAccent(graphics, x, y, width, color, thickness = 2) {
  graphics.clear();
  graphics.lineStyle(thickness, color, 1);
  graphics.lineBetween(x + THEME.layout.cornerCut, y, x + width - THEME.layout.cornerCut, y);
}

export function createTerminalOverlay(scene, options = {}) {
  const {
    x = 0,
    y = 0,
    width = 760,
    height = 420,
    depth = 60,
    scrollFactor = 1,
    eyebrow = "",
    title = "",
    subtitle = "",
    tone = "standard",
    surfaceTextureKey = null
  } = options;
  const tracker = createTracker();
  let destroyed = false;
  let fadeTween = null;

  try {
    const viewport = viewportSize(scene);
    const panelX = (viewport.width - width) / 2;
    const panelY = (viewport.height - height) / 2;
    const container = ownDisplayObject(
      tracker,
      scene.add.container(x, y),
      depth,
      scrollFactor
    );
    const body = ownDisplayObject(
      tracker,
      scene.add.container(0, 0),
      depth,
      scrollFactor
    );
    const header = ownDisplayObject(
      tracker,
      scene.add.container(0, 0),
      depth,
      scrollFactor
    );
    const content = ownDisplayObject(
      tracker,
      scene.add.container(0, 0),
      depth,
      scrollFactor
    );

    const dimmer = ownDisplayObject(
      tracker,
      scene.add.rectangle(
        viewport.width / 2,
        viewport.height / 2,
        viewport.width,
        viewport.height,
        0x000000,
        0.72
      ),
      depth,
      scrollFactor
    );
    dimmer.setInteractive();

    const edgeShade = ownDisplayObject(
      tracker,
      scene.add.graphics(),
      depth,
      scrollFactor
    );
    drawEdgeShade(edgeShade, viewport.width, viewport.height);

    container.add([dimmer, edgeShade, body, header, content]);

    const panel = createTacticalPanel(scene, {
      x: panelX,
      y: panelY,
      width,
      height,
      depth,
      scrollFactor
    });
    tracker.add(panel.objects);
    body.add(panel.objects);

    if (
      surfaceTextureKey
      && (scene.textures?.exists?.(surfaceTextureKey) ?? true)
    ) {
      const inset = THEME.layout.cornerCut + 2;
      const surface = ownDisplayObject(
        tracker,
        scene.add.tileSprite(
          panelX + width / 2,
          panelY + height / 2,
          Math.max(1, width - inset * 2),
          Math.max(1, height - inset * 2),
          surfaceTextureKey
        ),
        depth,
        scrollFactor
      );
      surface.setAlpha(0.12);
      body.add(surface);
    }

    const scanlines = ownDisplayObject(
      tracker,
      scene.add.graphics(),
      depth,
      scrollFactor
    );
    drawScanlines(scanlines, panelX, panelY, width, height);
    body.add(scanlines);

    const divider = ownDisplayObject(
      tracker,
      scene.add.graphics(),
      depth,
      scrollFactor
    );
    divider.lineStyle(1, THEME.terminal.frame, 0.8);
    divider.lineBetween(panelX + 18, panelY + 92, panelX + width - 18, panelY + 92);
    header.add(divider);

    const accent = ownDisplayObject(
      tracker,
      scene.add.graphics(),
      depth,
      scrollFactor
    );
    header.add(accent);

    const lampController = createStatusLamp(scene, {
      x: panelX + width - 28,
      y: panelY + 28,
      state: tonePresentation(tone).lamp,
      depth,
      scrollFactor
    });
    tracker.add(lampController.objects);
    header.add(lampController.objects);

    addText(scene, tracker, header, {
      x: panelX + 24,
      y: panelY + 16,
      text: eyebrow,
      style: {
        color: THEME.text.muted,
        fontFamily: THEME.font.mono,
        fontSize: "10px"
      },
      depth,
      scrollFactor
    });
    const titleText = addText(scene, tracker, header, {
      x: panelX + 24,
      y: panelY + 34,
      text: title,
      style: {
        color: THEME.text.primary,
        fontFamily: THEME.font.display,
        fontSize: "24px",
        fontStyle: "bold"
      },
      depth,
      scrollFactor
    });
    addText(scene, tracker, header, {
      x: panelX + 24,
      y: panelY + 66,
      text: subtitle,
      style: {
        color: THEME.text.secondary,
        fontFamily: THEME.font.body,
        fontSize: "13px"
      },
      depth,
      scrollFactor
    });

    function setTone(nextTone) {
      if (destroyed) return;
      const presentation = tonePresentation(nextTone);
      drawAccent(accent, panelX, panelY, width, presentation.color);
      lampController.setState(presentation.lamp);
      titleText.setColor(
        nextTone === "danger"
          ? THEME.text.critical
          : nextTone === "success" || nextTone === "contained"
            ? THEME.text.contained
            : THEME.text.primary
      );
    }

    setTone(tone);
    container.setAlpha(INITIAL_FADE_ALPHA);
    if (scene.tweens?.add) {
      fadeTween = scene.tweens.add({
        targets: container,
        alpha: 1,
        duration: DEFAULT_FADE_DURATION_MS,
        ease: "Linear"
      });
    } else {
      container.setAlpha(1);
    }

    return {
      container,
      body,
      header,
      content,
      objects: tracker.objects,
      setTone,
      setVisible(visible) {
        if (destroyed) return;
        container.setVisible(visible === true);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        fadeTween?.remove?.();
        fadeTween = null;
        tracker.destroy();
      }
    };
  } catch (error) {
    destroyed = true;
    fadeTween?.remove?.();
    fadeTween = null;
    tracker.destroy();
    throw error;
  }
}

export function createTerminalCard(scene, options = {}) {
  const {
    x = 0,
    y = 0,
    width = 220,
    height = 230,
    depth = 60,
    scrollFactor = 1,
    parent = null,
    iconKey = "",
    eyebrow = "",
    title = "",
    description = "",
    footer = "",
    riskLabel = null,
    tone = "standard",
    onActivate = () => {}
  } = options;
  const tracker = createTracker();
  let destroyed = false;
  let currentState = "idle";
  let restingState = "idle";

  try {
    const left = x - width / 2;
    const top = y - height / 2;
    const panelTone = tonePresentation(tone);
    const panel = createTacticalPanel(scene, {
      x: left,
      y: top,
      width,
      height,
      depth,
      scrollFactor,
      border: panelTone.color
    });
    tracker.add(panel.objects);

    const accent = ownDisplayObject(
      tracker,
      scene.add.graphics(),
      depth,
      scrollFactor
    );
    const hitArea = ownDisplayObject(
      tracker,
      scene.add.rectangle(x, y, width, height, 0x000000, 0),
      depth,
      scrollFactor
    );
    const icon = ownDisplayObject(
      tracker,
      scene.add.image(x, top + 42, iconKey),
      depth,
      scrollFactor
    );
    icon.setDisplaySize(CARD_ICON_SIZE, CARD_ICON_SIZE);

    const eyebrowText = addText(scene, tracker, null, {
      x,
      y: top + 12,
      text: eyebrow,
      style: {
        align: "center",
        color: THEME.text.muted,
        fontFamily: THEME.font.mono,
        fontSize: "12px",
        wordWrap: { width: CARD_TEXT_WIDTH, useAdvancedWrap: true }
      },
      origin: [0.5, 0],
      depth,
      scrollFactor
    });
    const titleText = addText(scene, tracker, null, {
      x,
      y: top + 62,
      text: title,
      style: {
        align: "center",
        color: THEME.text.primary,
        fontFamily: THEME.font.display,
        fontSize: "18px",
        fontStyle: "bold",
        maxLines: 2,
        wordWrap: { width: CARD_TEXT_WIDTH, useAdvancedWrap: true }
      },
      origin: [0.5, 0],
      depth,
      scrollFactor
    });
    fitTextToBox(titleText, title, {
      width: CARD_TEXT_WIDTH,
      maxHeight: 42,
      startSize: 18,
      minSize: 12,
      maxLines: 2
    });

    const descriptionText = addText(scene, tracker, null, {
      x,
      y: top + 102,
      text: description,
      style: {
        align: "center",
        color: THEME.text.secondary,
        fontFamily: THEME.font.body,
        fontSize: "14px",
        lineSpacing: 0,
        maxLines: 5,
        wordWrap: { width: CARD_TEXT_WIDTH, useAdvancedWrap: true }
      },
      origin: [0.5, 0],
      depth,
      scrollFactor
    });
    fitTextToBox(descriptionText, description, {
      width: CARD_TEXT_WIDTH,
      maxHeight: 78,
      startSize: 14,
      minSize: 12,
      maxLines: 5
    });

    const footerText = addText(scene, tracker, null, {
      x,
      y: top + 188,
      text: footer,
      style: {
        align: "center",
        color: THEME.text.contained,
        fontFamily: THEME.font.body,
        fontSize: "13px",
        maxLines: 1,
        wordWrap: { width: CARD_TEXT_WIDTH, useAdvancedWrap: true }
      },
      origin: [0.5, 0],
      depth,
      scrollFactor
    });
    fitTextToBox(footerText, footer, {
      width: CARD_TEXT_WIDTH,
      maxHeight: 17,
      startSize: 13,
      minSize: 12,
      maxLines: 1
    });

    const riskText = addText(scene, tracker, null, {
      x,
      y: top + 208,
      text: riskLabel ?? "",
      style: {
        align: "center",
        color: THEME.text.critical,
        fontFamily: THEME.font.body,
        fontSize: "12px",
        maxLines: 1,
        wordWrap: { width: CARD_TEXT_WIDTH, useAdvancedWrap: true }
      },
      origin: [0.5, 0],
      depth,
      scrollFactor
    });
    fitTextToBox(riskText, riskLabel ?? "", {
      width: CARD_TEXT_WIDTH,
      maxHeight: 16,
      startSize: 12,
      minSize: 12,
      maxLines: 1
    });

    function setState(nextState) {
      if (destroyed) return;
      const state = ["idle", "hover", "pressed", "selected", "disabled"].includes(nextState)
        ? nextState
        : "idle";
      currentState = state;
      if (state === "idle" || state === "selected" || state === "disabled") {
        restingState = state;
      }
      const stateColor = {
        idle: panelTone.color,
        hover: THEME.terminal.frameFocus,
        pressed: THEME.terminal.warning,
        selected: THEME.terminal.contained,
        disabled: THEME.terminal.disabled
      }[state];
      drawAccent(accent, left, top, width, stateColor, state === "selected" ? 4 : 2);
      if (state === "disabled") hitArea.disableInteractive();
      else hitArea.setInteractive({ useHandCursor: true });
    }

    hitArea.on("pointerover", () => {
      if (currentState !== "disabled" && currentState !== "selected") setState("hover");
    });
    hitArea.on("pointerout", () => {
      if (currentState !== "disabled") setState(restingState);
    });
    hitArea.on("pointerdown", () => {
      if (currentState === "disabled" || currentState === "selected") return;
      setState("pressed");
      onActivate();
    });

    setState("idle");

    if (parent) {
      if (typeof parent.add !== "function") {
        throw new TypeError("Terminal card parent must support add().");
      }
      parent.add(tracker.objects);
    }

    return {
      objects: tracker.objects,
      hitArea,
      icon,
      disableInteractive() {
        if (destroyed) return;
        setState("disabled");
      },
      setState,
      setFooter(text) {
        if (destroyed) return;
        fitTextToBox(footerText, text, {
          width: CARD_TEXT_WIDTH,
          maxHeight: 17,
          startSize: 13,
          minSize: 12,
          maxLines: 1
        });
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        tracker.destroy();
      }
    };
  } catch (error) {
    destroyed = true;
    tracker.destroy();
    throw error;
  }
}
