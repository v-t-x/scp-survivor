import { TEXTURES } from "../assets/manifest.js";
import { THEME } from "../ui/theme.js";
import { U1_TYPE, drawU1FoundationSeal } from "../ui/u1MaterialUi.js";

export const ARMORY_WORKBENCH_LAYOUT = Object.freeze({
  header: Object.freeze({ x: 24, y: 16, width: 912, height: 64 }),
  selector: Object.freeze({ x: 80, y: 154, width: 170, height: 106, gap: 17 }),
  showcase: Object.freeze({ x: 354, y: 118, width: 244, height: 270 }),
  dossier: Object.freeze({ x: 708, y: 120, width: 184, height: 286 }),
  deploy: Object.freeze({ x: 332, y: 458, width: 296, height: 58 })
});

export const LEGACY_ARMORY_WORKBENCH_LAYOUT = Object.freeze({
  header: ARMORY_WORKBENCH_LAYOUT.header,
  selector: Object.freeze({ x: 72, y: 108, width: 272, height: 132, gap: 12 }),
  showcase: Object.freeze({ x: 360, y: 112, width: 300, height: 324 }),
  dossier: Object.freeze({ x: 684, y: 112, width: 240, height: 324 }),
  deploy: Object.freeze({ x: 332, y: 464, width: 296, height: 52 })
});


const FRAME_PALETTES = {
  idle: {
    border: THEME.semantic.neutral,
    rail: THEME.semantic.neutral
  },
  inspect: {
    border: THEME.semantic.info,
    rail: THEME.semantic.info
  },
  confirmed: {
    border: THEME.semantic.contained,
    rail: THEME.semantic.contained
  }
};

const ARMORY_MATERIAL = Object.freeze({
  outerSteel: 0x05080d,
  plate: 0x111923,
  inset: 0x080d13,
  edgeLight: 0x6f7d89,
  edgeShadow: 0x010205,
  screw: 0x76808a,
  paper: 0xa89d84,
  paperEdge: 0x5a503f,
  paperInk: 0x2b2924,
  paperRule: 0x665e50
});

function drawCutPanel(graphics, { x, y, width, height, cut, fill, border, lineWidth = 1 }) {
  graphics.fillStyle(fill, 1);
  graphics.lineStyle(lineWidth, border, 1);
  drawRectPath(graphics, x, y, width, height, cut);
  graphics.fillPath();
  graphics.strokePath();
}

function drawPanelFasteners(graphics, { left, right, top, bottom, inset = 8 }) {
  graphics.fillStyle(ARMORY_MATERIAL.edgeShadow, 0.95);
  for (const [x, y] of [
    [left + inset, top + inset],
    [right - inset, top + inset],
    [left + inset, bottom - inset],
    [right - inset, bottom - inset]
  ]) {
    graphics.fillCircle(x, y, 3);
  }
  graphics.fillStyle(ARMORY_MATERIAL.screw, 0.78);
  for (const [x, y] of [
    [left + inset, top + inset],
    [right - inset, top + inset],
    [left + inset, bottom - inset],
    [right - inset, bottom - inset]
  ]) {
    graphics.fillCircle(x, y, 1.3);
  }
}

function drawAccentCorners(graphics, { left, right, top, bottom, color }) {
  const length = 18;
  graphics.lineStyle(2, color, 0.92);
  graphics.beginPath();
  graphics.moveTo(left + 5, top + 22);
  graphics.lineTo(left + 5, top + 5);
  graphics.lineTo(left + 5 + length, top + 5);
  graphics.moveTo(right - 5 - length, top + 5);
  graphics.lineTo(right - 5, top + 5);
  graphics.lineTo(right - 5, top + 22);
  graphics.moveTo(left + 5, bottom - 22);
  graphics.lineTo(left + 5, bottom - 5);
  graphics.lineTo(left + 5 + length, bottom - 5);
  graphics.moveTo(right - 5 - length, bottom - 5);
  graphics.lineTo(right - 5, bottom - 5);
  graphics.lineTo(right - 5, bottom - 22);
  graphics.strokePath();
}

function drawArmoryFrame(graphics, { x, y, width, height, frame }) {
  const palette = FRAME_PALETTES[frame] ?? FRAME_PALETTES.idle;
  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  const cut = 10;

  graphics.clear();
  drawCutPanel(graphics, {
    x: left,
    y: top,
    width,
    height,
    cut,
    fill: ARMORY_MATERIAL.outerSteel,
    border: ARMORY_MATERIAL.edgeShadow,
    lineWidth: 3
  });
  drawCutPanel(graphics, {
    x: left + 4,
    y: top + 4,
    width: width - 8,
    height: height - 8,
    cut: 7,
    fill: ARMORY_MATERIAL.plate,
    border: THEME.semantic.neutral
  });
  drawCutPanel(graphics, {
    x: left + 10,
    y: top + 14,
    width: 96,
    height: height - 28,
    cut: 5,
    fill: ARMORY_MATERIAL.inset,
    border: palette.border
  });
  graphics.lineStyle(1, ARMORY_MATERIAL.edgeLight, 0.38);
  graphics.lineBetween(left + 14, top + 8, right - 14, top + 8);
  graphics.lineStyle(2, ARMORY_MATERIAL.edgeShadow, 0.9);
  graphics.lineBetween(left + 14, bottom - 8, right - 14, bottom - 8);
  graphics.lineStyle(frame === "confirmed" ? 3 : 2, palette.rail, 0.92);
  graphics.beginPath();
  graphics.moveTo(left + 3, top + 28);
  graphics.lineTo(left + 3, bottom - 28);
  graphics.strokePath();
  drawAccentCorners(graphics, { left, right, top, bottom, color: palette.border });
  drawPanelFasteners(graphics, { left, right, top, bottom });
}

function drawFormalArmoryFrame(graphics, { x, y, width, height, frame }) {
  const left = x - width / 2;
  const right = x + width / 2;
  const top = y - height / 2;
  const bottom = y + height / 2;
  graphics.clear();
  if (frame === 'idle') return;
  const color = frame === 'confirmed' ? 0x52c8d1 : 0xc2a069;
  graphics.lineStyle(6, color, 0.09);
  drawRectPath(graphics, left + 1, top + 1, width - 2, height - 2, 5); graphics.strokePath();
  graphics.lineStyle(1, color, 0.85);
  drawRectPath(graphics, left + 1, top + 1, width - 2, height - 2, 5); graphics.strokePath();
  drawAccentCorners(graphics, { left, right, top, bottom, color });
}

function getLampColor(state) {
  return {
    standby: THEME.semantic.neutral,
    warning: THEME.semantic.info,
    contained: THEME.semantic.contained
  }[state] ?? THEME.semantic.neutral;
}

export function releaseArmoryViewObjects(objects) {
  for (const object of [...objects].reverse()) {
    try {
      object?.disableInteractive?.();
    } catch {
      // Continue releasing the remaining objects in this local transaction.
    }
    try {
      object?.removeInteractive?.();
    } catch {
      // Input may already be detached during Scene teardown.
    }
    try {
      object?.removeAllListeners?.();
    } catch {
      // Listener cleanup is best-effort for partially initialized objects.
    }
    try {
      object?.destroy?.();
    } catch {
      // One renderer failure must not leak the rest of the owned objects.
    }
  }
}

export function getWeaponSlotVisualState({ selected, hovered }) {
  if (selected) {
    return Object.freeze({
      frame: "confirmed",
      lamp: "contained",
      statusLabel: "装备确认",
      symbol: "check"
    });
  }
  if (hovered) {
    return Object.freeze({
      frame: "inspect",
      lamp: "standby",
      statusLabel: "正在检查",
      symbol: "none"
    });
  }
  return Object.freeze({
    frame: "idle",
    lamp: "standby",
    statusLabel: "待选择",
    symbol: "none"
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
    depth,
    scrollFactor = 0,
    formalChassis = false,
    onActivate = () => {}
  } = options;
  const objects = [];
  let destroyed = false;
  const own = (object) => {
    objects.push(object);
    object.setScrollFactor?.(scrollFactor);
    return object;
  };

  try {
    const left = x - width / 2;
    const frame = own(scene.add.graphics());
    frame.setDepth(depth);
    let resolvedIconKey = textureKey;
    let iconImage;
    try {
      iconImage = scene.add.image(formalChassis ? x : left + 58, formalChassis ? y - 18 : y, resolvedIconKey);
    } catch (error) {
      if (!options.fallbackTextureKey || options.fallbackTextureKey === resolvedIconKey) throw error;
      resolvedIconKey = options.fallbackTextureKey;
      iconImage = scene.add.image(formalChassis ? x : left + 58, formalChassis ? y - 18 : y, resolvedIconKey);
    }
    const icon = own(iconImage);
    const formalHero = resolvedIconKey === TEXTURES.u1RifleHero || resolvedIconKey === TEXTURES.u1TeslaHero;
    icon.setDisplaySize(formalChassis && formalHero ? 130 : formalChassis ? 100 : 88,
      formalChassis && formalHero ? 97.5 : formalChassis ? 100 : 88).setDepth(depth + 1);
    const nameStyle = formalChassis ? { ...options.nameStyle, fontFamily: U1_TYPE.steel, fontSize: '15px',
      fontStyle: 'normal', color: U1_TYPE.label, align: 'center', wordWrap: { width: width - 16, useAdvancedWrap: true } } : options.nameStyle;
    const nameText = own(scene.add.text(formalChassis ? x : left + 112, formalChassis ? y + 30 : y - 22, name, nameStyle));
    nameText.setOrigin(formalChassis ? 0.5 : 0, 0.5).setDepth(depth + 1);
    if (formalChassis) nameText.setResolution?.(2);
    const lamp = own(scene.add.circle(
      formalChassis ? x : left + 118,
      formalChassis ? y + 44 : y + 30,
      4,
      THEME.terminal.disabled,
      1
    ));
    lamp.setDepth(depth + 2);
    if (formalChassis) lamp.setVisible(false);
    const statusText = own(scene.add.text(
      formalChassis ? x : left + 132,
      formalChassis ? y + 12 : y + 30,
      "待选择",
      options.statusStyle ?? options.lockedStyle
    ));
    statusText.setOrigin(formalChassis ? 0.5 : 0, 0.5).setDepth(depth + 2);
    if (formalChassis) statusText.setStyle?.({ fontFamily: U1_TYPE.steel, fontSize: '11px', fontStyle: 'normal' });
    const symbolGraphics = own(scene.add.graphics());
    symbolGraphics.setDepth(depth + 2).setVisible(false);
    const hitArea = own(scene.add.rectangle(x, y, width, height, 0xffffff, 0.001));
    hitArea.setDepth(depth + 3).setInteractive({ useHandCursor: true });
    hitArea.on("pointerdown", onActivate);

    function setState(next) {
      if (destroyed) return;
      const state = getWeaponSlotVisualState(next);
      if (formalChassis) {
        drawFormalArmoryFrame(frame, { x, y, width, height, frame: state.frame });
      } else {
        drawArmoryFrame(frame, { x, y, width, height, frame: state.frame });
      }
      lamp.setFillStyle(getLampColor(state.lamp), 1);
      statusText.setText(state.statusLabel);
      if (formalChassis) {
        statusText.setVisible(state.frame !== 'idle');
        nameText.setColor(state.frame === 'confirmed' ? '#bdd0c3' : U1_TYPE.label);
      }
      statusText.setColor(
        state.frame === "confirmed"
          ? THEME.semanticText.contained
          : state.frame === "inspect"
            ? THEME.semanticText.info
            : THEME.semanticText.neutral
      );
      symbolGraphics.clear();
      const markY = formalChassis ? y - height / 2 + 18 : y;
      symbolGraphics.lineStyle(3, formalChassis ? 0x52c8d1 : THEME.semantic.contained, 1);
      symbolGraphics.beginPath();
      symbolGraphics.moveTo(x + width / 2 - 31, markY);
      symbolGraphics.lineTo(x + width / 2 - 26, markY + 5);
      symbolGraphics.lineTo(x + width / 2 - 16, markY - 7);
      symbolGraphics.strokePath();
      symbolGraphics.setVisible(state.symbol === "check");
    }

    setState({ selected: false, hovered: false });

    return {
      objects: Object.freeze([...objects]),
      frame,
      icon,
      nameText,
      lamp,
      statusText,
      symbolGraphics,
      hitArea,
      setState,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        releaseArmoryViewObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    releaseArmoryViewObjects(objects);
    throw error;
  }
}

function drawRectPath(graphics, x, y, width, height, cut = 0) {
  const right = x + width;
  const bottom = y + height;
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
}

function drawArmoryDetailFixture(graphics) {
  const { showcase, dossier } = LEGACY_ARMORY_WORKBENCH_LAYOUT;
  graphics.clear();
  drawCutPanel(graphics, {
    ...showcase,
    cut: 10,
    fill: ARMORY_MATERIAL.outerSteel,
    border: ARMORY_MATERIAL.edgeShadow,
    lineWidth: 3
  });
  drawCutPanel(graphics, {
    x: showcase.x + 5,
    y: showcase.y + 5,
    width: showcase.width - 10,
    height: showcase.height - 10,
    cut: 7,
    fill: ARMORY_MATERIAL.plate,
    border: THEME.semantic.neutral
  });
  drawCutPanel(graphics, {
    x: showcase.x + 14,
    y: showcase.y + 18,
    width: showcase.width - 28,
    height: showcase.height - 42,
    cut: 6,
    fill: ARMORY_MATERIAL.inset,
    border: 0x263746
  });
  graphics.lineStyle(1, ARMORY_MATERIAL.edgeLight, 0.36);
  graphics.lineBetween(showcase.x + 18, showcase.y + 11, showcase.x + showcase.width - 18, showcase.y + 11);
  graphics.lineStyle(2, ARMORY_MATERIAL.edgeShadow, 0.9);
  graphics.lineBetween(showcase.x + 18, showcase.y + showcase.height - 11, showcase.x + showcase.width - 18, showcase.y + showcase.height - 11);
  for (let offset = 0; offset < 6; offset += 1) {
    const x = showcase.x + 100 + offset * 18;
    graphics.fillStyle(offset % 2 === 0 ? THEME.semantic.warning : ARMORY_MATERIAL.edgeShadow, 0.72);
    drawRectPath(graphics, x, showcase.y + showcase.height - 23, 12, 5, 1);
    graphics.fillPath();
  }
  drawPanelFasteners(graphics, {
    left: showcase.x,
    right: showcase.x + showcase.width,
    top: showcase.y,
    bottom: showcase.y + showcase.height
  });

  drawCutPanel(graphics, {
    ...dossier,
    cut: 8,
    fill: ARMORY_MATERIAL.outerSteel,
    border: ARMORY_MATERIAL.edgeShadow,
    lineWidth: 3
  });
  drawCutPanel(graphics, {
    x: dossier.x + 5,
    y: dossier.y + 5,
    width: dossier.width - 10,
    height: dossier.height - 10,
    cut: 6,
    fill: ARMORY_MATERIAL.plate,
    border: THEME.semantic.neutral
  });
  drawCutPanel(graphics, {
    x: dossier.x + 12,
    y: dossier.y + 12,
    width: dossier.width - 24,
    height: dossier.height - 24,
    cut: 3,
    fill: ARMORY_MATERIAL.paper,
    border: ARMORY_MATERIAL.paperEdge,
    lineWidth: 2
  });
  graphics.fillStyle(0x71433d, 0.96);
  drawRectPath(graphics, dossier.x + 16, dossier.y + 16, 74, 20, 2);
  graphics.fillPath();
  graphics.lineStyle(1, ARMORY_MATERIAL.paperRule, 0.55);
  for (const y of [dossier.y + 92, dossier.y + 136, dossier.y + 180, dossier.y + 224, dossier.y + 268]) {
    graphics.lineBetween(dossier.x + 18, y, dossier.x + dossier.width - 18, y);
  }
  graphics.lineStyle(2, 0x665443, 0.48);
  graphics.strokeCircle(dossier.x + dossier.width - 42, dossier.y + 38, 17);
  graphics.lineStyle(1, 0x665443, 0.48);
  graphics.strokeCircle(dossier.x + dossier.width - 42, dossier.y + 38, 11);
  drawPanelFasteners(graphics, {
    left: dossier.x,
    right: dossier.x + dossier.width,
    top: dossier.y,
    bottom: dossier.y + dossier.height
  });
}


export function createArmoryDetailView(scene, options) {
  const { showcase, dossier } = options.formalChassis ? ARMORY_WORKBENCH_LAYOUT : LEGACY_ARMORY_WORKBENCH_LAYOUT;
  const depth = options.depth;
  const scrollFactor = options.scrollFactor ?? 0;
  const formalChassis = options.formalChassis === true;
  const heroDisplaySize = formalChassis ? [256, 192] : [192, 192];
  const objects = [];
  let destroyed = false;
  const own = (object) => {
    objects.push(object);
    object.setScrollFactor?.(scrollFactor);
    return object;
  };

  try {
    const fixtureGraphics = own(scene.add.graphics());
    fixtureGraphics.setDepth(depth);
    if (formalChassis) {
      fixtureGraphics.clear();
      // A feathered, translucent reading glaze quiets scratches, not the paper edges.
      for (const region of [{ x: 710, y: 164, width: 146, height: 28 }, { x: 710, y: 209, width: 179, height: 102 }]) {
        for (let inset = 0; inset < 6; inset++) {
          fixtureGraphics.fillStyle(0xb3a184, 0.047);
          fixtureGraphics.fillRect(region.x + inset, region.y + inset,
            region.width - inset * 2, region.height - inset * 2);
        }
      }
      drawU1FoundationSeal(fixtureGraphics, 870, 181, 18, 0x32332b, 0.5);
    } else {
      drawArmoryDetailFixture(fixtureGraphics);
    }
    const heroImage = own(scene.add.image(
      showcase.x + showcase.width / 2,
      showcase.y + showcase.height / 2,
      TEXTURES.weaponPistolIcon
    ));
    heroImage
      .setDisplaySize(...heroDisplaySize)
      .setVisible(false)
      .setDepth(depth + 1);
    const emptyText = own(scene.add.text(
      formalChassis ? 165 : showcase.x + showcase.width / 2,
      formalChassis ? 119 : showcase.y + showcase.height / 2,
      "请选择主武器",
      formalChassis ? { ...options.emptyStyle, color: U1_TYPE.amber, fontSize: '14px' } : options.emptyStyle
    ));
    emptyText.setOrigin(0.5).setDepth(depth + 1);
    const dossierLabelText = own(scene.add.text(
      dossier.x + 8,
      dossier.y + 17,
      "武器档案",
      {
        color: formalChassis ? "#c1aa85" : "#f1dfc5",
        fontFamily: formalChassis ? U1_TYPE.paper : THEME.font.label,
        fontSize: "12px",
        fontStyle: "normal"
      }
    ));
    dossierLabelText.setDepth(depth + 1);
    const dossierClassText = own(scene.add.text(
      dossier.x + 110,
      dossier.y + 16,
      "CLASS: WEAPON",
      {
        color: formalChassis ? U1_TYPE.ink : "#5b5245",
        fontFamily: U1_TYPE.code,
        fontSize: "8px"
      }
    ));
    dossierClassText.setOrigin(0, 0).setDepth(depth + 1);
    const nameText = own(scene.add.text(dossier.x + 8, dossier.y + 53, "", formalChassis ? {
      ...options.nameStyle, fontFamily: U1_TYPE.paper, fontSize: '14px', fontStyle: 'bold',
      wordWrap: { width: 140, useAdvancedWrap: true }
    } : options.nameStyle));
    nameText.setColor(formalChassis ? U1_TYPE.ink : "#24211c").setDepth(depth + 1);
    const statusText = own(scene.add.text(
      dossier.x + 8,
      dossier.y + 99,
      formalChassis ? "状态  未选择" : "未选择",
      formalChassis ? { ...options.statusStyle, fontFamily: U1_TYPE.paper, fontSize: '14px', fontStyle: 'bold' } : options.statusStyle
    ));
    statusText.setColor(formalChassis ? "#3f100f" : "#6c332f").setDepth(depth + 1);
    const statsText = own(scene.add.text(
      dossier.x + 8,
      dossier.y + 123,
      "伤害  —\n冷却  —\n特性  —",
      options.statsStyle
    ));
    statsText.setColor(formalChassis ? "#211d18" : "#2b2924").setDepth(depth + 1);
    const statRows = formalChassis ? Array.from({ length: 3 }, (_, index) => {
      const rowY = dossier.y + 123 + index * 24;
      const labelText = own(scene.add.text(dossier.x + 8, rowY, '', { fontFamily: U1_TYPE.paper, fontSize: '14px', fontStyle: 'bold', color: '#0d1310' }));
      const valueText = own(scene.add.text(dossier.x + 80, rowY, '', { fontFamily: U1_TYPE.code, fontSize: '13px', fontStyle: 'bold', color: U1_TYPE.ink }));
      labelText.setDepth(depth + 1); valueText.setDepth(depth + 1);
      return { labelText, valueText };
    }) : [];
    if (formalChassis) statsText.setVisible(false);
    if (formalChassis) for (const item of [emptyText, dossierLabelText, dossierClassText, nameText, statusText, ...statRows.flatMap(row => [row.labelText, row.valueText])]) item.setResolution?.(2);

    return {
      objects: Object.freeze([...objects]),
      fixtureGraphics,
      heroImage,
      emptyText,
      dossierLabelText,
      dossierClassText,
      nameText,
      statusText,
      statsText,
      statRows,
      refresh(nextShowcase, nextDossier) {
        if (destroyed) return;
        const selected = nextShowcase.state === "selected";
        heroImage.setVisible(selected);
        emptyText.setVisible(formalChassis || !selected);
        if (selected) {
          const preferredKey = nextShowcase.textureKey;
          const fallbackKey = nextShowcase.fallbackTextureKey ?? preferredKey;
          let preferredApplied = false;
          if (preferredKey && (scene.textures?.exists?.(preferredKey) ?? true)) {
            try {
              heroImage.setTexture(preferredKey);
              // Phaser preserves the prior texture scale. Re-apply the aperture
              // after swapping the 24px selector fallback for a 256px U1 hero.
              heroImage.setDisplaySize(...heroDisplaySize);
              preferredApplied = true;
            } catch {
              // Keep the existing hero identity and retry with its mapped legacy texture.
            }
          }
          if (!preferredApplied && fallbackKey && fallbackKey !== preferredKey) {
            try {
              heroImage.setTexture(fallbackKey);
              heroImage.setDisplaySize(...heroDisplaySize);
            } catch {
              // The dossier can still refresh even if both local texture routes fail.
            }
          }
        }
        nameText.setText(nextDossier.name);
        const statusLabel = String(nextDossier.statusLabel ?? "").replace(/^状态\s+/, "");
        statusText.setText(formalChassis ? `状态  ${statusLabel}` : statusLabel);
        statusText.setColor(
          formalChassis
            ? (selected ? "#00555b" : "#3f100f")
            : (selected ? "#24594f" : "#6c332f")
        );
        statsText.setText(
          nextDossier.stats.length === 0
            ? "伤害  —\n冷却  —\n特性  —"
            : nextDossier.stats.map(({ label, value }) => `${label}  ${value}`).join("\n")
        );
        for (const [index, row] of statRows.entries()) {
          const entry = nextDossier.stats[index] ?? { label: ['伤害', '冷却', '特性'][index], value: '—' };
          row.labelText.setText(entry.label); row.valueText.setText(entry.value);
        }
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        releaseArmoryViewObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    releaseArmoryViewObjects(objects);
    throw error;
  }
}

function drawDeploySymbol(graphics, { x, y, width, height, symbol, state }) {
  const centerX = x + width - 24;
  const centerY = y + height / 2;
  const color = state === "armed" ? THEME.semantic.contained : THEME.semantic.disabled;
  graphics.clear();
  graphics.fillStyle(THEME.terminal.panelFill, 1);
  drawRectPath(graphics, x + width - 50, y + 4, 46, height - 8, 4);
  graphics.fillPath();
  graphics.lineStyle(1, THEME.terminal.frame, 0.7);
  graphics.lineBetween(x + width - 50, y + 9, x + width - 50, y + height - 9);
  graphics.lineStyle(2, color, 1);
  if (symbol === "forward") {
    graphics.lineStyle(3, color, 1);
    graphics.lineBetween(centerX - 12, centerY, centerX + 5, centerY);
    graphics.beginPath();
    graphics.moveTo(centerX, centerY - 8);
    graphics.lineTo(centerX + 9, centerY);
    graphics.lineTo(centerX, centerY + 8);
    graphics.strokePath();
    return;
  }
  drawRectPath(graphics, centerX - 8, centerY - 1, 16, 13, 2);
  graphics.strokePath();
  graphics.beginPath();
  graphics.moveTo(centerX - 5, centerY - 1);
  graphics.lineTo(centerX - 5, centerY - 6);
  graphics.lineTo(centerX, centerY - 10);
  graphics.lineTo(centerX + 5, centerY - 6);
  graphics.lineTo(centerX + 5, centerY - 1);
  graphics.strokePath();
}

export function createArmoryDeploySymbol(scene, options = {}) {
const { deploy } = LEGACY_ARMORY_WORKBENCH_LAYOUT;
  const x = options.x ?? deploy.x;
  const y = options.y ?? deploy.y;
  const width = options.width ?? deploy.width;
  const height = options.height ?? deploy.height;
  const depth = options.depth ?? 0;
  const scrollFactor = options.scrollFactor ?? 0;
  const objects = [];
  let destroyed = false;
  const own = (object) => {
    objects.push(object);
    object.setScrollFactor?.(scrollFactor);
    return object;
  };

  try {
    const graphics = own(scene.add.graphics());
    graphics.setDepth(depth);

    function refresh(symbol = "lock", state = "disabled") {
      if (destroyed) return;
      drawDeploySymbol(graphics, { x, y, width, height, symbol, state });
    }

    refresh(options.symbol, options.state);
    return {
      objects: Object.freeze([...objects]),
      graphics,
      refresh,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        releaseArmoryViewObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    releaseArmoryViewObjects(objects);
    throw error;
  }
}
