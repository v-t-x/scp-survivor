// U1-only presentation; shared terminal controls and UI Foundation remain unchanged.
export const U1_TYPE = Object.freeze({
  steel: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif',
  paper: '"SimSun", "Songti SC", "Noto Serif CJK SC", serif',
  code: 'Consolas, "Microsoft YaHei", "PingFang SC", monospace',
  ink: '#161b17',
  label: '#b8ad93',
  muted: '#978f7d',
  amber: '#c6a265',
  cyan: '#84bbb9'
});

// Small code-native Foundation seal, shared only by the two U1 metal nameplates.
export function drawU1FoundationSeal(g, x, y, radius = 19, color = 0xb8ad93, alpha = 0.75) {
  g.lineStyle(1, color, alpha);
  g.strokeCircle(x, y, radius * 0.77);
  g.strokeCircle(x, y, radius * 0.42);
  for (let index = 0; index < 3; index++) {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 3;
    const point = (along, across = 0) => [x + Math.cos(angle) * along - Math.sin(angle) * across,
      y + Math.sin(angle) * along + Math.cos(angle) * across];
    g.beginPath(); g.moveTo(...point(radius, -3)); g.lineTo(...point(radius, 3));
    g.lineTo(...point(radius * 0.6, 3)); g.lineTo(...point(radius * 0.6, 6));
    g.lineTo(...point(radius * 0.32)); g.lineTo(...point(radius * 0.6, -6));
    g.lineTo(...point(radius * 0.6, -3)); g.closePath(); g.strokePath();
  }
}

function release(objects) {
  for (const item of [...objects].reverse()) {
    for (const method of ['disableInteractive', 'removeInteractive', 'removeAllListeners', 'destroy']) {
      try { item?.[method]?.(); } catch { /* Finish this local construction transaction. */ }
    }
  }
}

function outline(g, x, y, width, height, cut = 3) {
  g.beginPath();
  g.moveTo(x + cut, y); g.lineTo(x + width - cut, y);
  g.lineTo(x + width, y + cut); g.lineTo(x + width, y + height - cut);
  g.lineTo(x + width - cut, y + height); g.lineTo(x + cut, y + height);
  g.lineTo(x, y + height - cut); g.lineTo(x, y + cut); g.closePath();
}

// Draws only illumination over the real inset face: no opaque software-button tile.
export function createU1InsetButton(scene, options = {}) {
  const { x = 0, y = 0, width = 140, height = 40, text = '', state = 'idle',
    kind = 'authorization', depth = 0, scrollFactor = 0, onActivate = () => {} } = options;
  const objects = [];
  let destroyed = false;
  let restingState = state;
  let hovered = false;
  let pressed = false;
  const own = (item, layer = 0) => {
    objects.push(item); item.setDepth?.(depth + layer); item.setScrollFactor?.(scrollFactor); return item;
  };
  try {
    const frame = own(scene.add.graphics());
    const signal = own(scene.add.graphics(), 1);
    const isDeploy = kind === 'deploy';
    const isReturn = kind === 'return';
    const isAuthorization = kind === 'authorization';
    const label = own(scene.add.text(x + width / 2 + (isDeploy ? -12 : isReturn ? 14 : -5), y + height / 2,
      text, { fontFamily: U1_TYPE.steel, fontSize: isDeploy ? '26px' : isReturn ? '18px' : '15px',
        fontStyle: isDeploy ? 'bold' : 'normal', color: U1_TYPE.label }), 2);
    label.setOrigin?.(0.5, 0.5);
    label.setResolution?.(2);
    const hitArea = own(scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0, 0), 3);
    function paint() {
      const enabled = restingState !== 'disabled';
      const cyan = isDeploy && enabled;
      const color = cyan ? 0x43d6df : enabled ? 0xb69658 : 0x6f756b;
      frame.clear(); signal.clear();
      if (isAuthorization) {
        // Quiet the baked brass rim while retaining its physical material.
        frame.fillStyle(0x080b0b, hovered ? 0.12 : 0.44);
        frame.fillRect(x - 2, y - 2, width + 4, height + 4);
      }
      frame.lineStyle(4, 0x000000, 0.65);
      outline(frame, x + 1, y + 1, width - 2, height - 2); frame.strokePath();
      if (enabled && (!isAuthorization || hovered)) {
        frame.lineStyle(cyan ? 6 : 3, color, hovered ? 0.28 : cyan ? 0.18 : 0.09);
        outline(frame, x + 3, y + 3, width - 6, height - 6); frame.strokePath();
      }
      frame.lineStyle(1, color, enabled ? isAuthorization && !hovered ? 0.4 : 0.85 : 0.45);
      outline(frame, x + 3, y + 3, width - 6, height - 6); frame.strokePath();
      frame.lineStyle(1, color, 0.24);
      frame.lineBetween(x + 9, y + 6, x + width - 9, y + 6);
      if (hovered || pressed || cyan) {
        frame.fillStyle(color, pressed ? 0.22 : hovered ? 0.19 : cyan ? 0.14 : 0.04);
        outline(frame, x + 5, y + 5, width - 10, height - 10); frame.fillPath();
      }
      label.setColor?.(cyan ? '#78ebed' : enabled ? U1_TYPE.amber : '#9b9b8c');
      label.y = y + height / 2 + (pressed ? 1 : 0);
      label.setShadow?.(0, 1, '#000000', 0, false, true);
      const gx = isReturn ? x + 28 : x + width - (isDeploy ? 37 : 14);
      const gy = y + height / 2;
      signal.lineStyle(isDeploy ? 4 : 2, color, enabled ? 1 : 0.7);
      if (isDeploy && !enabled) {
        outline(signal, gx - 7, gy - 1, 14, 11, 1); signal.strokePath();
        signal.beginPath(); signal.moveTo(gx - 4, gy - 1); signal.lineTo(gx - 4, gy - 7);
        signal.lineTo(gx + 4, gy - 7); signal.lineTo(gx + 4, gy - 1); signal.strokePath();
      } else {
        const direction = isReturn ? -1 : 1;
        const size = isDeploy ? 10 : 6;
        signal.beginPath(); signal.moveTo(gx - direction * size / 2, gy - size);
        signal.lineTo(gx + direction * size / 2, gy);
        signal.lineTo(gx - direction * size / 2, gy + size); signal.strokePath();
        if (isReturn) signal.lineBetween(gx - 4, gy, gx + 11, gy);
      }
      if (enabled) hitArea.setInteractive?.({ useHandCursor: true });
      else hitArea.disableInteractive?.();
    }
    function setState(next) {
      if (destroyed) return;
      if (!['idle', 'armed', 'disabled'].includes(next)) return;
      restingState = next; hovered = false; pressed = false; paint();
    }
    hitArea.on?.('pointerover', () => { if (!destroyed && restingState !== 'disabled') { hovered = true; paint(); } });
    hitArea.on?.('pointerout', () => { if (!destroyed) { hovered = false; pressed = false; paint(); } });
    hitArea.on?.('pointerdown', () => { if (!destroyed && restingState !== 'disabled') { pressed = true; paint(); } });
    hitArea.on?.('pointerup', () => { if (!destroyed && restingState !== 'disabled') { pressed = false; paint(); onActivate(); } });
    paint();
    return { objects: Object.freeze([...objects]), kind, frame, signal, label, hitArea, setState,
      destroy() { if (destroyed) return; destroyed = true; release(objects); } };
  } catch (error) { destroyed = true; release(objects); throw error; }
}
