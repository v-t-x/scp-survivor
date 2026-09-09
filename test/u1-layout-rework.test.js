import test from 'node:test';
import assert from 'node:assert/strict';
import { createArmorySlot, createArmoryDetailView } from '../src/art/weaponSelectionView.js';
import * as material from '../src/ui/u1MaterialUi.js';
import { TEXTURES } from '../src/assets/manifest.js';

function object(type, x = 0, y = 0, text = '', style = {}) {
  const result = { type, x, y, text, style, commands: [], handlers: new Map(), active: true };
  for (const method of ['setDepth', 'setScrollFactor', 'setDisplaySize', 'setOrigin', 'setFillStyle', 'setStrokeStyle', 'setShadow', 'setInteractive', 'setAngle']) {
    result[method] = (...args) => { result[method.slice(3)] = args; return result; };
  }
  for (const method of ['beginPath', 'closePath', 'fillPath', 'strokePath', 'fillStyle', 'lineStyle', 'moveTo', 'lineTo', 'lineBetween', 'fillCircle', 'strokeCircle', 'fillRect', 'strokeRect']) {
    result[method] = (...args) => { result.commands.push([method, ...args]); return result; };
  }
  result.clear = () => { result.commands = []; return result; };
  result.setVisible = value => { result.visible = value; return result; };
  result.setColor = value => { result.color = value; return result; };
  result.setText = value => { result.text = value; return result; };
  result.setStyle = value => { Object.assign(result.style, value); return result; };
  result.setTexture = value => { result.textureKey = value; return result; };
  result.setPosition = (x, y) => { Object.assign(result, { x, y }); return result; };
  result.on = (key, value) => { result.handlers.set(key, value); return result; };
  result.disableInteractive = result.removeInteractive = result.removeAllListeners = () => result;
  result.destroy = () => { result.active = false; };
  return result;
}

function scene() {
  return { textures: { exists: () => true }, add: {
    graphics: () => object('graphics'),
    image: (x, y) => object('image', x, y),
    text: (x, y, text, style) => object('text', x, y, text, style),
    circle: (x, y) => object('circle', x, y),
    rectangle: (x, y) => object('rectangle', x, y)
  } };
}

test('formal weapon slot keeps the weapon and its full Chinese name on one vertical axis inside its physical aperture', () => {
  const slot = createArmorySlot(scene(), {
    x: 164, y: 208, width: 172, height: 108, formalChassis: true,
    name: '基金会收容突击步枪', textureKey: TEXTURES.u1RifleHero, depth: 1, nameStyle: {}
  });
  assert.equal(slot.icon.x, slot.nameText.x);
  assert.ok(slot.nameText.y > slot.icon.y + 20);
  assert.deepEqual(slot.nameText.Origin, [0.5, 0.5]);
  assert.equal(slot.nameText.style.wordWrap.useAdvancedWrap, true);
  assert.ok(slot.nameText.style.wordWrap.width < 172);
  assert.ok(slot.icon.DisplaySize[0] <= 132, 'thumbnail must leave room for the selection status');
  assert.ok(slot.icon.y <= 190, 'thumbnail lifts away from the status and full name');
});

test('formal dossier leaves the parchment exposed and updates independent label and value columns', () => {
  const detail = createArmoryDetailView(scene(), { formalChassis: true, depth: 1, emptyStyle: {}, nameStyle: {}, statusStyle: {}, statsStyle: {} });
  const fills = detail.fixtureGraphics.commands.filter(([op]) => op === 'fillStyle');
  assert.ok(fills.length > 0, 'reading region gently quiets the paper grain');
  assert.ok(fills.every(([, , alpha]) => alpha > 0 && alpha <= 0.3), 'no opaque software panel over the paper');
  detail.refresh({ state: 'selected', textureKey: 'tesla' }, { name: '特斯拉收容发射器', statusLabel: '已选定', stats: [{ label: '每跳伤害', value: '6' }, { label: '伤害间隔', value: '300 ms' }, { label: '链击', value: '3' }] });
  assert.deepEqual(detail.statRows.map(row => row.valueText.text), ['6', '300 ms', '3']);
  assert.equal(new Set(detail.statRows.map(row => row.valueText.x)).size, 1);
  assert.ok(detail.statRows.every(row => row.labelText.x < row.valueText.x));
  assert.ok(detail.nameText.style.wordWrap.width <= 140, 'long weapon names must stop before the right-hand dossier seal');
  assert.ok(detail.emptyText.x < 270 && detail.emptyText.y < 140, 'selection prompt belongs in the left brass nameplate');
});

test('secondary authorization rim stays quieter at rest and lights only on hover', () => {
  const button = material.createU1InsetButton(scene(), { x: 772, y: 16, width: 148, height: 40, kind: 'authorization' });
  const glow = () => button.frame.commands.filter(([op, width, color]) => op === 'lineStyle' && color !== 0 && width >= 3);
  assert.equal(glow().length, 0, 'secondary action must not carry a constant accent halo');
  button.hitArea.handlers.get('pointerover')();
  assert.ok(glow().length > 0);
});

test('inset deploy button keeps centered lettering through hover and disables activation in its empty state', () => {
  let activations = 0;
  const button = material.createU1InsetButton(scene(), { x: 332, y: 461, width: 294, height: 53, text: '部署', state: 'disabled', kind: 'deploy', onActivate: () => activations++ });
  button.hitArea.handlers.get('pointerup')();
  assert.equal(activations, 0);
  button.setState('armed');
  button.hitArea.handlers.get('pointerover')();
  assert.ok(button.label.x > 440 && button.label.x < 500);
  assert.deepEqual(button.label.Origin, [0.5, 0.5]);
  assert.ok(Number.parseInt(button.label.style.fontSize) >= 24);
  button.hitArea.handlers.get('pointerup')();
  assert.equal(activations, 1);
  button.destroy();
  button.hitArea.handlers.get('pointerup')();
  assert.equal(activations, 1);
});
