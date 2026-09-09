import { TEXTURES } from "../assets/manifest.js";
import { createTerminalButton, createStatusLamp } from "../ui/tacticalUi.js";
import { createTerminalOverlay } from "../ui/terminalOverlay.js";
import { SITE_CODE } from "../ui/siteIdentity.js";
import { THEME } from "../ui/theme.js";
import { U1_TYPE, createU1InsetButton, drawU1FoundationSeal } from "../ui/u1MaterialUi.js";

export const PERK_STORE_LAYOUT = Object.freeze({
  width: 920,
  height: 504,
  contentLeft: 40,
  contentTop: 104,
  cardWidth: 424,
  cardHeight: 160,
  columnGap: 16,
  rowGap: 12,
  iconSize: 96,
  statusRailWidth: 44,
  actionWidth: 148,
  actionHeight: 40,
  footerWidth: 280,
  footerHeight: 48
});

const STORE_TYPE = Object.freeze({
  siteCode: "12px",
  title: "28px",
  itemName: "18px",
  itemDescription: "14px",
  itemMeta: "13px",
  numeric: "14px",
  action: "14px"
});

const LEGACY_LAYOUT = Object.freeze({
  width: 560,
  height: 420,
  rowHeight: 64,
  rowGap: 0,
  rowTop: 100,
  actionWidth: 96,
  actionHeight: 40,
  footerTop: 386
});

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
    }
  };
}

function releaseObjects(objects) {
  for (const object of objects) {
    try {
      object?.disableInteractive?.();
      object?.removeInteractive?.();
      object?.removeAllListeners?.();
    } catch {
      // Continue releasing the rest of this local transaction.
    }
  }
  for (const object of [...objects].reverse()) {
    try {
      object?.destroy?.();
    } catch {
      // A failed display-object release must not strand its siblings.
    }
  }
}

function setDisplayOptions(object, depth, scrollFactor) {
  object.setDepth?.(depth);
  object.setScrollFactor?.(scrollFactor);
  return object;
}

function viewportSize(scene) {
  const width = scene.scale?.width ?? scene.cameras?.main?.width ?? 960;
  const height = scene.scale?.height ?? scene.cameras?.main?.height ?? 540;
  return { width, height };
}

function drawClippedFrame(frame, {
  x,
  y,
  width,
  height,
  fill,
  border,
  lineWidth = 1,
  clear = true
}) {
  const cut = Math.min(THEME.layout.cornerCut, width / 2, height / 2);
  const right = x + width;
  const bottom = y + height;
  if (clear) frame.clear();
  frame.fillStyle(fill, 1);
  frame.beginPath();
  frame.moveTo(x + cut, y);
  frame.lineTo(right - cut, y);
  frame.lineTo(right, y + cut);
  frame.lineTo(right, bottom - cut);
  frame.lineTo(right - cut, bottom);
  frame.lineTo(x + cut, bottom);
  frame.lineTo(x, bottom - cut);
  frame.lineTo(x, y + cut);
  frame.closePath();
  frame.fillPath();
  frame.lineStyle(lineWidth, border, 1);
  frame.strokePath();
}

function drawPageSteel(frame, { x, y, width, height }) {
  const inset = 4;
  const right = x + width;
  const bottom = y + height;
  frame.clear();
  frame.fillStyle(THEME.surface.facility, 1);
  frame.fillRect(x, y, width, height);
  frame.lineStyle(2, THEME.terminal.disabled, 1);
  frame.strokeRect(x, y, width, height);
  frame.fillStyle(THEME.terminal.panelFill, 1);
  frame.fillRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
  frame.lineStyle(1, THEME.terminal.frame, 0.9);
  frame.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
  frame.lineStyle(1, THEME.terminal.frameFocus, 0.32);
  frame.lineBetween(x + inset + 1, y + inset + 1, right - inset - 1, y + inset + 1);
  frame.lineBetween(x + inset + 1, y + inset + 1, x + inset + 1, bottom - inset - 1);
  frame.lineStyle(2, THEME.surface.facility, 0.95);
  frame.lineBetween(x + inset + 1, bottom - inset - 1, right - inset - 1, bottom - inset - 1);
  frame.lineBetween(right - inset - 1, y + inset + 1, right - inset - 1, bottom - inset - 1);
}

function redrawCardFrame(frame, { x, y, tone }) {
  const accent = {
    contained: THEME.semantic.contained,
    warning: THEME.semantic.warning,
    disabled: THEME.semantic.disabled
  }[tone] ?? THEME.semantic.neutral;
  drawClippedFrame(frame, {
    x,
    y,
    width: PERK_STORE_LAYOUT.cardWidth,
    height: PERK_STORE_LAYOUT.cardHeight,
    fill: THEME.terminal.panelFill,
    border: THEME.terminal.disabled,
    lineWidth: 2
  });
  drawClippedFrame(frame, {
    x: x + 3,
    y: y + 3,
    width: PERK_STORE_LAYOUT.cardWidth - 6,
    height: PERK_STORE_LAYOUT.cardHeight - 6,
    fill: THEME.terminal.panelRaised,
    border: THEME.terminal.frame,
    lineWidth: 1,
    clear: false
  });
  frame.lineStyle(1, THEME.terminal.frameFocus, 0.26);
  frame.lineBetween(x + 10, y + 6, x + PERK_STORE_LAYOUT.cardWidth - 10, y + 6);
  frame.lineBetween(x + 6, y + 10, x + 6, y + PERK_STORE_LAYOUT.cardHeight - 10);
  frame.lineStyle(2, THEME.surface.facility, 0.9);
  frame.lineBetween(
    x + 10,
    y + PERK_STORE_LAYOUT.cardHeight - 6,
    x + PERK_STORE_LAYOUT.cardWidth - 10,
    y + PERK_STORE_LAYOUT.cardHeight - 6
  );
  frame.lineBetween(
    x + PERK_STORE_LAYOUT.cardWidth - 6,
    y + 10,
    x + PERK_STORE_LAYOUT.cardWidth - 6,
    y + PERK_STORE_LAYOUT.cardHeight - 10
  );
  frame.lineStyle(3, accent, tone === "disabled" ? 0.55 : 1);
  frame.lineBetween(x + 20, y + 3, x + 84, y + 3);
}

function drawIconWell(frame, { x, y }) {
  const wellX = x + 12;
  const wellY = y + 8;
  const width = 104;
  const height = 112;
  const right = wellX + width;
  const bottom = wellY + height;
  frame.clear();
  frame.fillStyle(THEME.surface.facility, 1);
  frame.fillRect(wellX, wellY, width, height);
  frame.lineStyle(2, THEME.terminal.disabled, 1);
  frame.strokeRect(wellX, wellY, width, height);
  frame.lineStyle(1, THEME.terminal.frame, 0.9);
  frame.strokeRect(wellX + 3, wellY + 3, width - 6, height - 6);
  frame.lineStyle(2, THEME.terminal.frameFocus, 0.45);
  frame.lineBetween(wellX + 8, wellY + 3, wellX + 20, wellY + 3);
  frame.lineBetween(wellX + 3, wellY + 8, wellX + 3, wellY + 20);
  frame.lineBetween(right - 20, wellY + 3, right - 8, wellY + 3);
  frame.lineBetween(right - 3, wellY + 8, right - 3, wellY + 20);
  frame.lineBetween(wellX + 8, bottom - 3, wellX + 20, bottom - 3);
  frame.lineBetween(wellX + 3, bottom - 20, wellX + 3, bottom - 8);
  frame.lineBetween(right - 20, bottom - 3, right - 8, bottom - 3);
  frame.lineBetween(right - 3, bottom - 20, right - 3, bottom - 8);
  frame.fillStyle(THEME.terminal.frame, 0.9);
  frame.fillCircle(wellX + 6, wellY + 6, 2);
  frame.fillCircle(right - 6, wellY + 6, 2);
  frame.fillCircle(wellX + 6, bottom - 6, 2);
  frame.fillCircle(right - 6, bottom - 6, 2);
}

function redrawStatusRail(statusRail, { x, y, tone, symbol, railLeft: explicitRailLeft }) {
  const railLeft = explicitRailLeft
    ?? x + PERK_STORE_LAYOUT.cardWidth - PERK_STORE_LAYOUT.statusRailWidth;
  const railCenter = railLeft + PERK_STORE_LAYOUT.statusRailWidth / 2;
  const symbolY = y + 84;
  const color = {
    contained: THEME.semantic.contained,
    warning: THEME.semantic.warning,
    disabled: THEME.semantic.disabled
  }[tone] ?? THEME.semantic.neutral;

  statusRail.clear();
  statusRail.fillStyle(THEME.terminal.panelFill, 1);
  statusRail.fillRect(
    railLeft,
    y + 2,
    PERK_STORE_LAYOUT.statusRailWidth - 2,
    PERK_STORE_LAYOUT.cardHeight - 4
  );
  statusRail.lineStyle(1, color, 1);
  statusRail.lineBetween(railLeft, y + 8, railLeft, y + PERK_STORE_LAYOUT.cardHeight - 8);

  if (symbol === "check") {
    statusRail.lineStyle(3, color, 1);
    statusRail.lineBetween(railCenter - 9, symbolY, railCenter - 2, symbolY + 7);
    statusRail.lineBetween(railCenter - 2, symbolY + 7, railCenter + 11, symbolY - 8);
  } else if (symbol === "unlock") {
    statusRail.lineStyle(2, color, 1);
    statusRail.lineBetween(railCenter - 8, symbolY + 2, railCenter + 9, symbolY + 2);
    statusRail.lineBetween(railCenter + 9, symbolY + 2, railCenter + 9, symbolY + 13);
    statusRail.lineBetween(railCenter + 9, symbolY + 13, railCenter - 9, symbolY + 13);
    statusRail.lineBetween(railCenter - 9, symbolY + 13, railCenter - 9, symbolY + 5);
    statusRail.lineBetween(railCenter - 4, symbolY - 1, railCenter - 4, symbolY - 7);
    statusRail.lineBetween(railCenter - 4, symbolY - 7, railCenter + 5, symbolY - 11);
  } else if (symbol === "lock") {
    statusRail.lineStyle(2, color, 1);
    statusRail.strokeRect(railCenter - 9, symbolY + 1, 18, 14);
    statusRail.lineBetween(railCenter - 6, symbolY + 1, railCenter - 6, symbolY - 7);
    statusRail.lineBetween(railCenter - 6, symbolY - 7, railCenter + 6, symbolY - 7);
    statusRail.lineBetween(railCenter + 6, symbolY - 7, railCenter + 6, symbolY + 1);
  }
}

function drawSealFrame(frame, { x, y, width, height }) {
  frame.clear();
  frame.fillStyle(THEME.terminal.panelFill, 1);
  frame.fillRect(x, y, width, height);
  frame.lineStyle(2, THEME.semantic.contained, 1);
  frame.strokeRect(x, y, width, height);
  frame.lineStyle(1, THEME.semantic.contained, 0.72);
  frame.strokeRect(x + 4, y + 4, width - 8, height - 8);
  frame.lineStyle(1, THEME.terminal.frameFocus, 0.35);
  frame.lineBetween(x + 6, y + 6, x + width - 6, y + 6);
  frame.lineStyle(2, THEME.surface.facility, 0.9);
  frame.lineBetween(x + 6, y + height - 5, x + width - 6, y + height - 5);
}

function drawAuthorizationStamp(frame, { x, y, width, height }) {
  frame.clear();
  frame.fillStyle(THEME.terminal.panelFill, 0.96);
  frame.fillRect(x, y, width, height);
  frame.lineStyle(2, THEME.semantic.contained, 1);
  frame.strokeRect(x, y, width, height);
  frame.lineStyle(1, THEME.semantic.contained, 0.78);
  frame.strokeRect(x + 4, y + 4, width - 8, height - 8);
  frame.lineStyle(1, THEME.terminal.frameFocus, 0.3);
  frame.lineBetween(x + 6, y + 6, x + width - 6, y + 6);
  frame.lineStyle(2, THEME.surface.facility, 0.85);
  frame.lineBetween(x + 6, y + height - 5, x + width - 6, y + height - 5);
}

function getHeaderState(presentation) {
  if (presentation.completionState === "complete") return "contained";
  return presentation.creditsValue === 0 ? "warning" : "standard";
}

function getRowStyle(state) {
  return {
    owned: {
      buttonState: "disabled",
      textColor: THEME.semanticText.contained,
      border: THEME.semantic.contained,
      lampState: "contained"
    },
    available: {
      buttonState: "armed",
      textColor: THEME.semanticText.warning,
      border: THEME.semantic.warning,
      lampState: "warning"
    },
    insufficient: {
      buttonState: "disabled",
      textColor: THEME.semanticText.disabled,
      border: THEME.semantic.disabled,
      lampState: "off"
    }
  }[state] ?? {
    buttonState: "disabled",
    textColor: THEME.semanticText.disabled,
    border: THEME.semantic.disabled,
    lampState: "off"
  };
}

function metaLabel(item) {
  if (item.state === "insufficient") return `缺口 // ${item.missingCredits} 学分`;
  return `授权成本 // ${item.cost} 学分`;
}

function appendContent(overlay, objects) {
  overlay.content.add(objects);
}

function createProductionText(scene, tracker, overlay, options) {
  const object = tracker.add(scene.add.text(options.x, options.y, options.text, options.style));
  setDisplayOptions(object, options.depth, options.scrollFactor);
  object.setOrigin?.(...(options.origin ?? [0, 0]));
  object.setResolution?.(2);
  appendContent(overlay, object);
  return object;
}

function createProductionGraphics(scene, tracker, overlay, depth, scrollFactor) {
  const object = tracker.add(scene.add.graphics());
  setDisplayOptions(object, depth, scrollFactor);
  appendContent(overlay, object);
  return object;
}

function tryCreateProductionImage(scene, tracker, overlay, options) {
  let object = null;
  try {
    object = scene.add.image(
      options.x,
      options.y,
      options.textureKey,
      options.frame
    );
    setDisplayOptions(object, options.depth, options.scrollFactor);
    object.setOrigin?.(...(options.origin ?? [0.5, 0.5]));
    object.setDisplaySize?.(options.width, options.height);
    if (options.frame !== undefined) object.setFrame?.(options.frame);
    appendContent(overlay, object);
    tracker.add(object);
    return object;
  } catch {
    releaseObjects(object ? [object] : []);
    return null;
  }
}

function textureIsAvailable(scene, textureKey) {
  return Boolean(textureKey && (scene.textures?.exists?.(textureKey) ?? true));
}

function tryCreateChassis(scene, tracker, overlay, options) {
  if (!textureIsAvailable(scene, options.textureKey)) return null;
  let object = null;
  try {
    object = scene.add.image(options.x, options.y, options.textureKey);
    setDisplayOptions(object, options.depth, options.scrollFactor);
    object.setOrigin?.(0.5, 0.5);
    object.setDisplaySize?.(options.width, options.height);
    appendContent(overlay, object);
    tracker.add(object);
    return object;
  } catch {
    releaseObjects(object ? [object] : []);
    return null;
  }
}

function setActionVisible(action, visible) {
  for (const object of action.objects) object.setVisible?.(visible);
  action.setState(visible ? "armed" : "disabled");
}

function createQuartermasterAction(scene, options = {}) {
  const {
    x = 0,
    y = 0,
    width = PERK_STORE_LAYOUT.actionWidth,
    height = PERK_STORE_LAYOUT.actionHeight,
    text = "",
    state = "disabled",
    depth = 60,
    scrollFactor = 0,
    face = null,
    onActivate = () => {}
  } = options;
  const tracker = createTracker();
  let currentState = state;
  let destroyed = false;
  let hovered = false;
  let pressed = false;
  const faceY = face?.y;

  try {
    const frame = tracker.add(scene.add.graphics());
    setDisplayOptions(frame, depth, scrollFactor);
    const hitArea = tracker.add(scene.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0x000000,
      0
    ));
    setDisplayOptions(hitArea, depth, scrollFactor);
    const label = tracker.add(scene.add.text(x + width / 2, y + height / 2, text, {
      color: U1_TYPE.amber,
      fontFamily: U1_TYPE.code,
      fontSize: '17px'
    }));
    setDisplayOptions(label, depth + 1, scrollFactor);
    label.setOrigin?.(0.5, 0.5);
    label.setResolution?.(2);
    const signal = tracker.add(scene.add.graphics());
    setDisplayOptions(signal, depth + 1, scrollFactor);

    function paint() {
      const armed = currentState === "armed";
      drawClippedFrame(frame, {
        x,
        y,
        width,
        height,
        fill: armed && !pressed ? THEME.terminal.panelRaised : THEME.terminal.panelFill,
        border: armed ? THEME.semantic.warning : THEME.semantic.disabled,
        lineWidth: hovered && !pressed ? 2 : 1
      });
      label.setStyle?.({
        color: armed ? face ? pressed ? '#c6b488' : hovered ? '#f0dbab' : '#d3bb88' : THEME.semanticText.warning : THEME.semanticText.disabled
      });
      label.y = y + height / 2 + (pressed ? 1 : 0);
      if (face) {
        // Tint only the admitted face; never revive an atlas retired by fallback.
        const top = pressed ? 0x8b999c : hovered ? 0xe9e0c4 : 0xa9bfc6;
        const bottom = pressed ? 0xa9b6b5 : hovered ? 0xb6bcb7 : 0xa9bfc6;
        face.setTint?.(top, top, bottom, bottom);
        face.y = faceY + (pressed ? 1 : 0);
      }
      signal.clear();
      signal.fillStyle(
        armed ? THEME.semantic.warning : THEME.semantic.disabled,
        armed ? 1 : 0.45
      );
      signal.fillCircle(x + width - 17, y + height / 2, 5);
      signal.lineStyle(1, THEME.terminal.frameFocus, 0.8);
      signal.strokeCircle(x + width - 17, y + height / 2, 5);
      if (armed) hitArea.setInteractive?.({ useHandCursor: true });
      else hitArea.disableInteractive?.();
    }

    function setState(nextState) {
      if (destroyed || (nextState !== "armed" && nextState !== "disabled")) return;
      currentState = nextState;
      hovered = false;
      pressed = false;
      paint();
    }

    hitArea.on?.("pointerover", () => {
      if (destroyed || currentState !== "armed") return;
      hovered = true;
      paint();
    });
    hitArea.on?.("pointerdown", () => {
      if (destroyed || currentState !== "armed") return;
      pressed = true;
      paint();
    });
    const resetPointer = () => {
      if (destroyed) return;
      hovered = false;
      pressed = false;
      paint();
    };
    hitArea.on?.("pointerout", resetPointer);
    hitArea.on?.("pointerupoutside", resetPointer);

    hitArea.on?.("pointerup", () => {
      if (destroyed || currentState !== "armed") return;
      pressed = false;
      paint();
      onActivate();
    });
    setState(state);

    return {
      objects: Object.freeze([...tracker.objects]),
      frame,
      hitArea,
      label,
      signal,
      setState,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        releaseObjects(tracker.objects);
      }
    };
  } catch (error) {
    destroyed = true;
    releaseObjects(tracker.objects);
    throw error;
  }
}

function createReadonlyController(kind, properties) {
  const controller = { ...properties };
  Object.defineProperty(controller, "kind", {
    value: kind,
    enumerable: true,
    writable: false,
    configurable: false
  });
  return controller;
}

export function createPerkStoreView(scene, options, dependencies = {}) {
  const {
    presentation,
    onPurchase = () => {},
    onClose = () => {}
  } = options;
  const {
    createOverlay = createTerminalOverlay,
    createButton = createTerminalButton,
    createLamp = createStatusLamp,
    createAction = createQuartermasterAction
  } = dependencies;
  const tracker = createTracker();
  let overlay = null;
  let destroyed = false;

  try {
    const viewport = viewportSize(scene);
    const panelX = (viewport.width - PERK_STORE_LAYOUT.width) / 2;
    const panelY = (viewport.height - PERK_STORE_LAYOUT.height) / 2;
    const depth = 60;
    const scrollFactor = 0;
    overlay = createOverlay(scene, {
      width: PERK_STORE_LAYOUT.width,
      height: PERK_STORE_LAYOUT.height,
      depth,
      scrollFactor,
      eyebrow: "",
      title: "",
      subtitle: "",
      tone: "standard",
      surfaceTextureKey: null
    });

    const chassis = tryCreateChassis(scene, tracker, overlay, {
      x: viewport.width / 2,
      y: viewport.height / 2,
      textureKey: presentation.chassisTextureKey,
      width: viewport.width,
      height: viewport.height,
      depth,
      scrollFactor
    });
    const formalChassis = chassis !== null;
    const stateAtlasTextureKey = presentation.stateAtlas?.textureKey ?? null;
    const stateAtlasRequested = textureIsAvailable(scene, stateAtlasTextureKey);
    // A missing chassis takes the complete procedural route; do not mix its
    // larger hit areas with smaller atlas faces from the formal layout.
    let formalStateAtlas = formalChassis && stateAtlasRequested;
    const stateAtlasObjects = [];
    function retireStateAtlas() {
      formalStateAtlas = false;
      for (const object of stateAtlasObjects) {
        object.setVisible?.(false);
        object.disableInteractive?.();
        object.removeInteractive?.();
        object.removeAllListeners?.();
      }
    }
    function tryCreateStateAtlasPart(options) {
      if (!formalStateAtlas) return null;
      const object = tryCreateProductionImage(scene, tracker, overlay, options);
      if (!object) {
        retireStateAtlas();
        return null;
      }
      stateAtlasObjects.push(object);
      return object;
    }
    if (formalChassis) {
      overlay.body.setVisible?.(false);
      overlay.header.setVisible?.(false);
    }

    const pageSteel = createProductionGraphics(
      scene,
      tracker,
      overlay,
      depth,
      scrollFactor
    );
    if (formalChassis) { pageSteel.clear(); drawU1FoundationSeal(pageSteel, 53, 41); }
    else {
      drawPageSteel(pageSteel, {
        x: panelX,
        y: panelY,
        width: PERK_STORE_LAYOUT.width,
        height: PERK_STORE_LAYOUT.height
      });
    }

    let pageGrid = null;
    if (!formalChassis && (scene.textures?.exists?.(TEXTURES.terminalSurfaceGrid) ?? true)) {
      pageGrid = tracker.add(scene.add.tileSprite(
        panelX + PERK_STORE_LAYOUT.width / 2,
        panelY + PERK_STORE_LAYOUT.height / 2,
        PERK_STORE_LAYOUT.width,
        PERK_STORE_LAYOUT.height,
        TEXTURES.terminalSurfaceGrid
      ));
      setDisplayOptions(pageGrid, depth, scrollFactor);
      pageGrid.setAlpha?.(0.06);
      appendContent(overlay, pageGrid);
    }

    const siteCodeText = createProductionText(scene, tracker, overlay, {
      x: formalChassis ? 96 : 40,
      y: formalChassis ? 40 : 32,
      text: SITE_CODE,
      style: {
        color: U1_TYPE.label,
        fontFamily: U1_TYPE.code,
        fontSize: formalChassis ? '18px' : STORE_TYPE.siteCode
      },
      origin: formalChassis ? [0, 0.5] : [0, 0],
      depth,
      scrollFactor
    });
    const titleText = createProductionText(scene, tracker, overlay, {
      x: formalChassis ? 250 : 40,
      y: formalChassis ? 40 : 50,
      text: "军需授权",
      style: {
        color: U1_TYPE.label,
        fontFamily: U1_TYPE.steel,
        fontSize: STORE_TYPE.title,
        fontStyle: "bold"
      },
      origin: formalChassis ? [0, 0.5] : [0, 0],
      depth,
      scrollFactor
    });
    const creditsText = createProductionText(scene, tracker, overlay, {
      x: formalChassis ? 574 : 900,
      y: formalChassis ? 42 : 32,
      text: "",
      style: {
        color: U1_TYPE.amber,
        fontFamily: U1_TYPE.code,
        fontSize: formalChassis ? '17px' : STORE_TYPE.numeric
      },
      origin: formalChassis ? [0, 0.5] : [1, 0],
      depth,
      scrollFactor
    });
    const progressText = createProductionText(scene, tracker, overlay, {
      x: formalChassis ? 752 : 900,
      y: formalChassis ? 42 : 58,
      text: "",
      style: {
        color: U1_TYPE.amber,
        fontFamily: U1_TYPE.code,
        fontSize: formalChassis ? '16px' : STORE_TYPE.itemMeta
      },
      origin: formalChassis ? [0, 0.5] : [1, 0],
      depth,
      scrollFactor
    });
    const headerLamp = createLamp(scene, {
      x: formalChassis ? 925 : 900,
      y: formalChassis ? 39 : 86,
      radius: 5,
      state: "standby",
      depth,
      scrollFactor
    });
    tracker.add(headerLamp.objects);
    appendContent(overlay, headerLamp.objects);
    const sealFrame = createProductionGraphics(scene, tracker, overlay, depth, scrollFactor);
    drawSealFrame(sealFrame, { x: 650, y: 42, width: 124, height: 40 });
    const sealText = createProductionText(scene, tracker, overlay, {
      x: 712,
      y: 62,
      text: "授权完成",
      style: {
        color: THEME.semanticText.contained,
        fontFamily: THEME.font.mono,
        fontSize: STORE_TYPE.numeric,
        fontStyle: "bold"
      },
      origin: [0.5, 0.5],
      depth,
      scrollFactor
    });
    function setSealVisible(visible) {
      const shown = visible && !formalChassis;
      sealFrame.setVisible?.(shown);
      sealText.setVisible?.(shown);
    }
    setSealVisible(false);
    const header = {
      siteCodeText,
      titleText,
      creditsText,
      progressText,
      statusLamp: headerLamp,
      sealText,
      sealFrame,
      state: "standard"
    };
    const rows = presentation.items.map((item, index) => {
      const column = index % 2;
      const rowIndex = Math.floor(index / 2);
      const x = PERK_STORE_LAYOUT.contentLeft
        + column * (PERK_STORE_LAYOUT.cardWidth + PERK_STORE_LAYOUT.columnGap);
      const y = PERK_STORE_LAYOUT.contentTop
        + rowIndex * (PERK_STORE_LAYOUT.cardHeight + PERK_STORE_LAYOUT.rowGap);
      const contentX = formalChassis ? 210 + column * 420 : x + 124;
      const actionX = formalChassis ? contentX : x + 224;
      const actionWidth = formalChassis ? 136 : PERK_STORE_LAYOUT.actionWidth;
      const actionHeight = formalChassis ? 40 : PERK_STORE_LAYOUT.actionHeight;
      const actionY = formalChassis ? y + 108 : y + 108;
      const iconCenterX = formalChassis ? 146 + column * 420 : x + 64;
      const iconCenterY = formalChassis ? y + 85 : y + 64;
      const railCenterX = formalChassis
        ? 414 + column * 420
        : x + PERK_STORE_LAYOUT.cardWidth - PERK_STORE_LAYOUT.statusRailWidth / 2;
      const frame = createProductionGraphics(scene, tracker, overlay, depth, scrollFactor);
      const iconWell = createProductionGraphics(scene, tracker, overlay, depth, scrollFactor);
      if (formalChassis) iconWell.clear();
      else drawIconWell(iconWell, { x, y });
      const iconOptions = {
        x: iconCenterX,
        y: iconCenterY,
        width: PERK_STORE_LAYOUT.iconSize,
        height: PERK_STORE_LAYOUT.iconSize,
        depth: depth + 1,
        scrollFactor
      };
      let preferredItemTextureEnabled = true;
      let icon = textureIsAvailable(scene, item.textureKey)
        ? tryCreateProductionImage(scene, tracker, overlay, {
          ...iconOptions,
          textureKey: item.textureKey
        })
        : null;
      if (!icon && textureIsAvailable(scene, item.textureKey)) {
        preferredItemTextureEnabled = false;
      }
      if (!icon) {
        icon = tryCreateProductionImage(scene, tracker, overlay, {
          ...iconOptions,
          textureKey: item.fallbackTextureKey
        });
      }
      if (!icon) throw new Error(`Unable to create store item image: ${item.key}`);
      const nameText = createProductionText(scene, tracker, overlay, {
        x: contentX,
        y: formalChassis ? y + 34 : y + 16,
        text: item.name,
        style: {
          color: U1_TYPE.label,
          fontFamily: U1_TYPE.steel,
          fontSize: formalChassis ? '20px' : STORE_TYPE.itemName,
          fontStyle: formalChassis ? "bold" : "normal"
        },
        depth,
        scrollFactor
      });
      const descriptionText = createProductionText(scene, tracker, overlay, {
        x: contentX,
        y: formalChassis ? y + 64 : y + 46,
        text: item.description,
        style: {
          color: U1_TYPE.label,
          fontFamily: U1_TYPE.steel,
          fontSize: STORE_TYPE.itemDescription,
          wordWrap: { width: formalChassis ? 176 : 236, useAdvancedWrap: true }
        },
        depth,
        scrollFactor
      });
      const detailsText = createProductionText(scene, tracker, overlay, {
        x: contentX,
        y: formalChassis ? y + 124 : y + 84,
        text: "",
        style: {
          color: formalChassis ? '#c58d73' : '#bd7960',
          fontFamily: U1_TYPE.code,
          fontSize: formalChassis ? '14px' : STORE_TYPE.itemMeta
        },
        depth,
        scrollFactor
      });
      const stampFrame = createProductionGraphics(scene, tracker, overlay, depth, scrollFactor);
      drawAuthorizationStamp(stampFrame, {
        x: actionX,
        y: formalChassis ? actionY - 5 : actionY,
        width: actionWidth,
        height: actionHeight
      });
      stampFrame.setVisible?.(false);
      const statusRail = createProductionGraphics(scene, tracker, overlay, depth, scrollFactor);
      const statusLamp = createLamp(scene, {
        x: railCenterX,
        y: formalChassis ? y + 56 : y + 24,
        state: "off",
        depth,
        scrollFactor
      });
      tracker.add(statusLamp.objects);
      appendContent(overlay, statusLamp.objects);
      const statePart = formalStateAtlas
        ? tryCreateStateAtlasPart({
          x: railCenterX,
          y: formalChassis ? y + 114 : y + 84,
          textureKey: stateAtlasTextureKey,
          frame: item.stateFrame,
          width: formalChassis ? 34 : 40,
          height: formalChassis ? 46 : 40,
          depth: depth + 1,
          scrollFactor
        })
        : null;
      const actionPart = formalStateAtlas
        ? tryCreateStateAtlasPart({
          x: actionX + actionWidth / 2,
          y: y + 128,
          textureKey: stateAtlasTextureKey,
          frame: presentation.stateAtlas.frames.purchase,
          width: formalChassis ? 168 : 128,
          height: formalChassis ? 104 : 128,
          depth,
          scrollFactor
        })
        : null;
      const stampPart = formalStateAtlas
        ? tryCreateStateAtlasPart({
          x: actionX + actionWidth / 2,
          y: formalChassis ? y + 123 : y + 128,
          textureKey: stateAtlasTextureKey,
          frame: presentation.stateAtlas.frames.authorized,
          width: formalChassis ? 168 : 128,
          height: formalChassis ? 104 : 128,
          depth,
          scrollFactor
        })
        : null;
      const lampPart = formalStateAtlas
        ? tryCreateStateAtlasPart({
          x: railCenterX,
          y: formalChassis ? y + 56 : y + 24,
          textureKey: stateAtlasTextureKey,
          frame: item.tone === "contained"
            ? presentation.stateAtlas.frames.containedLamp
            : presentation.stateAtlas.frames.warningLamp,
          width: 28,
          height: 28,
          depth: depth + 1,
          scrollFactor
        })
        : null;
      const stampText = createProductionText(scene, tracker, overlay, {
        x: actionX + actionWidth / 2,
        y: formalChassis ? y + 123 : y + 128,
        text: "已授权",
        style: {
          color: U1_TYPE.cyan,
          fontFamily: U1_TYPE.steel,
          fontSize: formalChassis ? '18px' : STORE_TYPE.action,
          fontStyle: "bold"
        },
        origin: [0.5, 0.5],
        depth: depth + 1,
        scrollFactor
      });
      stampText.setVisible?.(false);
      if (formalChassis) stampText.angle = -10;
      const card = {
        key: item.key,
        state: item.state,
        statusSymbol: item.statusSymbol,
        column,
        row: rowIndex,
        height: PERK_STORE_LAYOUT.cardHeight,
        objects: null,
        frame,
        frameBorder: THEME.semantic.disabled,
        iconWell,
        icon,
        preferredItemTextureEnabled,
        statusRail,
        statusLamp,
        lamp: statusLamp,
        lampState: "off",
        nameText,
        descriptionText,
        detailsText,
        stampFrame,
        stampText,
        action: null
      };
      const action = createAction(scene, {
        x: actionX,
        y: actionY,
        width: actionWidth,
        height: actionHeight,
        text: item.actionLabel,
        state: "disabled",
        depth,
        scrollFactor,
        face: actionPart,
        onActivate: () => {
          if (card.state === "available") onPurchase(card.key);
        }
      });
      tracker.add(action.objects);
      appendContent(overlay, action.objects);
      action.label.setStyle?.({ fontFamily: U1_TYPE.code, fontSize: formalChassis ? '17px' : STORE_TYPE.action, color: U1_TYPE.amber });
      card.action = action;
      Object.assign(card, { statePart, actionPart, stampPart, lampPart });
      card.objects = Object.freeze([
        frame,
        iconWell,
        icon,
        nameText,
        descriptionText,
        detailsText,
        stampFrame,
        stampText,
        statusRail,
        ...statusLamp.objects,
        ...action.objects,
        statePart,
        actionPart,
        stampPart,
        lampPart
      ].filter(Boolean));
      if (formalStateAtlas) {
        statusRail.setVisible?.(false);
        for (const object of statusLamp.objects) object.setVisible?.(false);
        stampFrame.setVisible?.(false);
        action.frame?.setVisible?.(false);
        action.signal?.setVisible?.(false);
      }
      return card;
    });
    const footer = (dependencies.createButton ?? (formalChassis ? createU1InsetButton : createButton))(scene, {
      x: formalChassis ? 596 : 640,
      y: formalChassis ? 477 : 468,
      width: formalChassis ? 254 : PERK_STORE_LAYOUT.footerWidth,
      height: formalChassis ? 42 : PERK_STORE_LAYOUT.footerHeight,
      kind: 'return',
      text: "返回军械库",
      state: "idle",
      variant: "standard",
      depth,
      scrollFactor,
      onActivate: onClose
    });
    tracker.add(footer.objects);
    appendContent(overlay, footer.objects);
    footer.label.setStyle?.({ fontFamily: U1_TYPE.steel, fontSize: formalChassis ? '18px' : STORE_TYPE.action });
    if (formalChassis) { footer.label.x = 750; footer.label.setResolution?.(2); }

    function prepareStateAtlas(nextPresentation) {
      if (!formalStateAtlas) return false;
      try {
        for (let index = 0; index < rows.length; index += 1) {
          const card = rows[index];
          const item = nextPresentation.items[index];
          if (!item) continue;
          card.statePart.setFrame(item.stateFrame);
          card.actionPart.setFrame(nextPresentation.stateAtlas.frames.purchase);
          card.stampPart.setFrame(nextPresentation.stateAtlas.frames.authorized);
          card.lampPart.setFrame(
            item.tone === "contained"
              ? nextPresentation.stateAtlas.frames.containedLamp
              : nextPresentation.stateAtlas.frames.warningLamp
          );
        }
        return true;
      } catch {
        retireStateAtlas();
        return false;
      }
    }

    function refresh(nextPresentation) {
      if (destroyed) return;
      creditsText.setText(nextPresentation.creditsDisplayLabel);
      progressText.setText(nextPresentation.progressDisplayLabel);
      header.state = getHeaderState(nextPresentation);
      overlay.setTone(header.state);
      headerLamp.setState(
        header.state === "contained"
          ? "contained"
          : header.state === "warning"
            ? "warning"
            : "standby"
      );
      setSealVisible(nextPresentation.completionState === "complete");
      const useStateAtlas = prepareStateAtlas(nextPresentation);
      for (let index = 0; index < rows.length; index += 1) {
        const card = rows[index];
        const item = nextPresentation.items[index];
        if (!item) continue;
        const x = PERK_STORE_LAYOUT.contentLeft
          + card.column * (PERK_STORE_LAYOUT.cardWidth + PERK_STORE_LAYOUT.columnGap);
        const y = PERK_STORE_LAYOUT.contentTop
          + card.row * (PERK_STORE_LAYOUT.cardHeight + PERK_STORE_LAYOUT.rowGap);
        card.key = item.key;
        card.state = item.state;
        card.statusSymbol = item.statusSymbol;
        card.detailsText.setText(item.detailLabel);
        if (formalChassis) {
          card.detailsText.setVisible?.(item.state === 'insufficient');
          card.nameText.setColor?.(item.state === 'owned' ? U1_TYPE.cyan : item.state === 'available' ? U1_TYPE.label : U1_TYPE.muted);
          card.descriptionText.setColor?.(item.state === 'owned' ? '#a4c1ba' : item.state === 'available' ? '#bcae93' : '#b0a591');
        }
        card.stampText.setText("已授权");
        card.stampFrame.setVisible(!useStateAtlas && item.actionKind === "stamp");
        card.stampText.setVisible(item.actionKind === "stamp");
        let preferredItemTextureApplied = false;
        if (card.preferredItemTextureEnabled && textureIsAvailable(scene, item.textureKey)) {
          try {
            card.icon.setTexture(item.textureKey);
            preferredItemTextureApplied = true;
          } catch {
            card.preferredItemTextureEnabled = false;
          }
        }
        if (!preferredItemTextureApplied && item.fallbackTextureKey) {
          try {
            card.icon.setTexture(item.fallbackTextureKey);
          } catch {
            // Keep this card's image identity and continue refreshing the page.
          }
        }
        card.action.label.setText(item.actionLabel);
        setActionVisible(card.action, item.actionKind === "button");
        card.lampState = item.tone === "contained"
          ? "contained"
          : item.tone === "warning"
            ? "warning"
            : "off";
        card.statusLamp.setState(card.lampState);
        card.frameBorder = {
          contained: THEME.semantic.contained,
          warning: THEME.semantic.warning,
          disabled: THEME.semantic.disabled
        }[item.tone] ?? THEME.semantic.neutral;
        if (formalChassis) {
          const centerX = 146 + card.column * 420;
          const centerY = y + 85;
          const railX = 414 + card.column * 420;
          const color = item.state === 'owned' ? 0x76bcb9 : item.state === 'available' ? 0xbb914a : 0x625f54;
          card.frame.clear();
          card.frame.lineStyle(1, 0x000000, 0.8);
          card.frame.strokeRect(centerX - 51, centerY - 55, 102, 110);
          card.frame.lineStyle(1, color, 0.6);
          for (const direction of [-1, 1]) {
            const edgeX = centerX + direction * 47;
            for (const vertical of [-1, 1]) {
              const edgeY = centerY + vertical * 52;
              card.frame.lineBetween(edgeX, edgeY, edgeX - direction * 12, edgeY);
              card.frame.lineBetween(edgeX, edgeY, edgeX, edgeY - vertical * 12);
            }
          }
          card.frame.fillStyle(color, item.state === 'insufficient' ? 0.35 : 0.92);
          card.frame.fillRect(railX - 8, y + 53, 16, 5);
          if (item.state !== 'insufficient') {
            card.frame.lineStyle(4, color, 0.13);
            card.frame.lineBetween(railX - 8, y + 55, railX + 8, y + 55);
          }
        }
        else redrawCardFrame(card.frame, { x, y, tone: item.tone });
        if (useStateAtlas) {
          card.statusRail.setVisible?.(false);
          for (const object of card.statusLamp.objects) object.setVisible?.(false);
          card.action.frame?.setVisible?.(false);
          card.action.signal?.setVisible?.(false);
          card.statePart.setVisible?.(true);
          card.actionPart.setVisible?.(item.actionKind === "button");
          card.stampPart.setVisible?.(item.actionKind === "stamp");
          card.lampPart.setVisible?.(!formalChassis && item.tone !== "disabled");
        } else {
          card.statusRail.setVisible?.(true);
          for (const object of card.statusLamp.objects) object.setVisible?.(true);
          redrawStatusRail(card.statusRail, {
            x,
            y,
            tone: item.tone,
            symbol: card.statusSymbol,
            railLeft: formalChassis
              ? (card.column === 0 ? 396 : 816)
              : undefined
          });
        }
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      releaseObjects(tracker.objects);
      overlay.destroy();
    }

    refresh(presentation);
    return createReadonlyController("production", {
      objects: Object.freeze([...new Set([...overlay.objects, ...tracker.objects])]),
      overlay,
      chassis,
      pageSteel,
      pageGrid,
      header,
      rows: Object.freeze(rows),
      footer,
      layout: PERK_STORE_LAYOUT,
      refresh,
      destroy
    });
  } catch (error) {
    destroyed = true;
    releaseObjects(tracker.objects);
    overlay?.destroy();
    throw error;
  }
}

function createLegacyText(tracker, addText, x, y, text, style, depth, scrollFactor) {
  const object = tracker.add(addText(x, y, text, style));
  setDisplayOptions(object, depth, scrollFactor);
  return object;
}

function createLegacyAction(tracker, addRectangle, addText, {
  x,
  y,
  width,
  height,
  depth,
  scrollFactor,
  onActivate
}) {
  const hitArea = tracker.add(addRectangle(x + width / 2, y + height / 2, width, height, THEME.terminal.panelRaised, 1));
  setDisplayOptions(hitArea, depth, scrollFactor);
  const label = createLegacyText(tracker, addText, x + width / 2, y + height / 2, "", {
    fontFamily: THEME.font.mono,
    fontSize: STORE_TYPE.action,
    color: THEME.text.primary
  }, depth + 1, scrollFactor);
  label.setOrigin?.(0.5);
  hitArea.on?.("pointerup", onActivate);
  let destroyed = false;

  function setState(nextState) {
    if (destroyed) return;
    const enabled = nextState === "armed";
    hitArea.setFillStyle?.(
      enabled ? THEME.terminal.panelRaised : THEME.terminal.disabled,
      1
    );
    if (enabled) hitArea.setInteractive?.({ useHandCursor: true });
    else hitArea.disableInteractive?.();
  }

  return {
    objects: Object.freeze([hitArea, label]),
    hitArea,
    label,
    setState,
    destroy() { destroyed = true; }
  };
}

export function createLegacyPerkStoreView(scene, options, dependencies = {}) {
  const {
    presentation,
    onPurchase = () => {},
    onClose = () => {}
  } = options;
  const {
    addRectangle = scene.add.rectangle.bind(scene.add),
    addText = scene.add.text.bind(scene.add)
  } = dependencies;
  const tracker = createTracker();
  let destroyed = false;

  try {
    const viewport = viewportSize(scene);
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const panelX = centerX - LEGACY_LAYOUT.width / 2;
    const panelY = centerY - LEGACY_LAYOUT.height / 2;
    const depth = 60;
    const scrollFactor = 0;
    const backdrop = tracker.add(addRectangle(centerX, centerY, viewport.width, viewport.height, 0x000000, 0.6));
    setDisplayOptions(backdrop, depth, scrollFactor);
    backdrop.setInteractive?.();
    const panel = tracker.add(addRectangle(centerX, centerY, LEGACY_LAYOUT.width, LEGACY_LAYOUT.height, THEME.terminal.panelRaised, 1));
    setDisplayOptions(panel, depth + 1, scrollFactor);
    panel.setStrokeStyle?.(2, THEME.terminal.frame);
    const title = createLegacyText(tracker, addText, centerX, panelY + 28, "解锁商店（永久起始加成）", {
      fontFamily: THEME.font.display,
      fontSize: "24px",
      fontStyle: "bold",
      color: THEME.text.primary
    }, depth + 2, scrollFactor);
    title.setOrigin?.(0.5);
    const creditsText = createLegacyText(tracker, addText, panelX + 24, panelY + 56, "", {
      fontFamily: THEME.font.mono,
      fontSize: STORE_TYPE.numeric,
      color: THEME.text.secondary
    }, depth + 2, scrollFactor);
    const progressText = createLegacyText(tracker, addText, panelX + LEGACY_LAYOUT.width - 24, panelY + 56, "", {
      fontFamily: THEME.font.mono,
      fontSize: STORE_TYPE.itemMeta,
      color: THEME.text.muted
    }, depth + 2, scrollFactor);
    progressText.setOrigin?.(1, 0);
    const header = { creditsText, progressText, state: "standard" };
    const rows = presentation.items.map((item, index) => {
      const y = panelY + LEGACY_LAYOUT.rowTop + index * (LEGACY_LAYOUT.rowHeight + LEGACY_LAYOUT.rowGap);
      const rowFrame = tracker.add(addRectangle(centerX, y + LEGACY_LAYOUT.rowHeight / 2, LEGACY_LAYOUT.width - 36, LEGACY_LAYOUT.rowHeight - 6, THEME.terminal.panelFill, 1));
      setDisplayOptions(rowFrame, depth + 1, scrollFactor);
      rowFrame.setStrokeStyle?.(1, THEME.terminal.frame);
      const statusText = createLegacyText(tracker, addText, panelX + 26, y + 8, "", {
        fontFamily: THEME.font.mono,
        fontSize: STORE_TYPE.itemMeta,
        color: THEME.semanticText.disabled
      }, depth + 2, scrollFactor);
      const nameText = createLegacyText(tracker, addText, panelX + 26, y + 24, item.name, {
        fontFamily: THEME.font.display,
        fontSize: STORE_TYPE.itemName,
        fontStyle: "bold",
        color: THEME.text.primary
      }, depth + 2, scrollFactor);
      const descriptionText = createLegacyText(tracker, addText, panelX + 26, y + 46, item.description, {
        fontFamily: THEME.font.body,
        fontSize: STORE_TYPE.itemDescription,
        color: THEME.text.secondary
      }, depth + 2, scrollFactor);
      const detailsText = createLegacyText(tracker, addText, panelX + LEGACY_LAYOUT.width - LEGACY_LAYOUT.actionWidth - 24, y + 24, "", {
        fontFamily: THEME.font.mono,
        fontSize: STORE_TYPE.itemMeta,
        color: THEME.text.muted
      }, depth + 2, scrollFactor);
      detailsText.setOrigin?.(1, 0.5);
      const row = {
        key: item.key,
        state: item.state,
        height: LEGACY_LAYOUT.rowHeight,
        objects: null,
        frame: rowFrame,
        frameBorder: THEME.semantic.disabled,
        lamp: null,
        lampState: "off",
        statusText,
        nameText,
        descriptionText,
        detailsText,
        action: null
      };
      const action = createLegacyAction(tracker, addRectangle, addText, {
        x: panelX + LEGACY_LAYOUT.width - LEGACY_LAYOUT.actionWidth - 18,
        y: y + 12,
        width: LEGACY_LAYOUT.actionWidth,
        height: LEGACY_LAYOUT.actionHeight,
        depth: depth + 2,
        scrollFactor,
        onActivate: () => onPurchase(row.key)
      });
      row.action = action;
      row.objects = Object.freeze([
        rowFrame,
        statusText,
        nameText,
        descriptionText,
        detailsText,
        ...action.objects
      ]);
      return row;
    });
    const footer = createLegacyAction(tracker, addRectangle, addText, {
      x: centerX - 80,
      y: panelY + LEGACY_LAYOUT.footerTop - 20,
      width: 160,
      height: 40,
      depth: depth + 2,
      scrollFactor,
      onActivate: onClose
    });
    footer.label.setText("返回");
    footer.setState("armed");

    function refresh(nextPresentation) {
      if (destroyed) return;
      creditsText.setText(nextPresentation.creditsLabel);
      progressText.setText(`授权进度 // ${nextPresentation.ownedCount}/${nextPresentation.totalCount}`);
      header.state = getHeaderState(nextPresentation);
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const item = nextPresentation.items[index];
        if (!item) continue;
        const style = getRowStyle(item.state);
        row.key = item.key;
        row.state = item.state;
        row.statusText.setText(item.statusLabel);
        row.statusText.setColor(style.textColor);
        row.detailsText.setText(metaLabel(item));
        row.action.label.setText(item.actionLabel);
        row.action.setState(style.buttonState);
        row.frameBorder = style.border;
        row.frame.setStrokeStyle?.(1, row.frameBorder);
        row.lampState = style.lampState;
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      releaseObjects(tracker.objects);
    }

    refresh(presentation);
    return createReadonlyController("legacy", {
      objects: Object.freeze([...new Set(tracker.objects)]),
      overlay: null,
      header,
      rows: Object.freeze(rows),
      layout: LEGACY_LAYOUT,
      refresh,
      destroy
    });
  } catch (error) {
    destroyed = true;
    releaseObjects(tracker.objects);
    throw error;
  }
}

export function createPerkStoreWithFallback(scene, options, factories = {}) {
  const createProduction = factories.createProduction ?? createPerkStoreView;
  const createLegacy = factories.createLegacy ?? createLegacyPerkStoreView;
  try {
    return createProduction(scene, options);
  } catch {
    try {
      return createLegacy(scene, options);
    } catch {
      return null;
    }
  }
}
