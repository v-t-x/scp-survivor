import { U3_MATERIAL_CSS } from './u3Materials.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
// Optional decoration: an unavailable texture leaves the complete CSS device usable.
const steelUrl = new URL('./assets/u3-steel.png', import.meta.url).href;
const frameUrl = new URL('./assets/u3-chassis-v2.png', import.meta.url).href;
const paperUrl = new URL('./assets/u3-paper-v2.png', import.meta.url).href;

export function u3Element(document, tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== '') element.textContent = String(text);
  return element;
}

export function createU3Header(document, { title, subtitle = '', eyebrow = '', status = '', tone = '' }) {
  const header = u3Element(document, 'header', 'u3-header');
  const seal = u3Element(document, 'div', 'u3-seal');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(SVG_NS, 'circle');
  for (const [key, value] of Object.entries({ cx:32, cy:33, r:17, fill:'none', stroke:'currentColor', 'stroke-width':3 })) circle.setAttribute(key, value);
  svg.appendChild(circle);
  const rim = document.createElementNS(SVG_NS, 'path');
  rim.setAttribute('d', 'M27.43 11.48V4.48H36.57V11.48A22 22 0 0 1 52.92 39.8L58.98 43.3L54.41 51.22L48.35 47.72A22 22 0 0 1 15.65 47.72L9.59 51.22L5.02 43.3L11.08 39.8A22 22 0 0 1 27.43 11.48Z');
  rim.setAttribute('fill', 'none'); rim.setAttribute('stroke', 'currentColor'); rim.setAttribute('stroke-width', '2.5');
  svg.appendChild(rim);
  for (const rotate of [0, 120, 240]) {
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M30.5 9H33.5V22H37L32 29L27 22H30.5Z');
    arrow.setAttribute('fill', 'currentColor');
    arrow.setAttribute('transform', `rotate(${rotate} 32 32)`);
    svg.appendChild(arrow);
  }
  seal.appendChild(svg);
  const heading = u3Element(document, 'div', 'u3-heading');
  if (eyebrow) heading.appendChild(u3Element(document, 'div', 'u3-eyebrow', eyebrow));
  heading.appendChild(u3Element(document, 'h2', '', title));
  if (subtitle) heading.appendChild(u3Element(document, 'div', 'u3-subtitle', subtitle));
  const statusNode = u3Element(document, 'div', 'u3-header-status', status || 'SITE-CN-03');
  if (tone === 'danger') statusNode.style.color = 'var(--u3-red)';
  header.append(seal, heading, statusNode);
  return header;
}

export function createU3Button(document, { text, onActivate = () => {}, className = '', disabled = false }) {
  const element = u3Element(document, 'button', `u3-button ${className}`, text);
  element.type = 'button';
  let destroyed = false;
  function setState(state) {
    if (destroyed) return;
    element.dataset.state = state;
    element.disabled = state === 'disabled';
  }
  function activate(event) {
    event.stopPropagation();
    if (!destroyed && !element.disabled) onActivate();
  }
  element.addEventListener('click', activate);
  setState(disabled ? 'disabled' : 'idle');
  const disableInteractive = () => {
    if (destroyed) return;
    // Lock input after a selection without erasing its short success feedback.
    if (element.dataset.state === 'selected') element.disabled = true;
    else setState('disabled');
  };
  return { element, objects: [], hitArea: { disableInteractive },
    label: { setText(value) { if (!destroyed) element.textContent = String(value); } },
    setState, disableInteractive,
    destroy() { if (destroyed) return; destroyed = true; element.disabled = true; element.removeEventListener('click', activate); element.remove(); }
  };
}

export function createU3Overlay(scene, { kind, width = 760, height = 430, className = '', styles = '', visible = true, onFailure } = {}) {
  const canvas = scene.game?.canvas;
  const document = canvas?.ownerDocument;
  const events = scene.game?.events;
  if (!document?.createElement || !document?.createElementNS || !document.body || !canvas?.getBoundingClientRect || !events?.on || !events?.off) return null;
  let root, panel, stage, frameImage;
  let destroyed = false;
  let failed = false;
  const container = {
    visible: !!visible, active: true,
    setVisible(value) { setVisible(value); return this; },
    setPosition() { return this; },
    destroy
  };
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    container.visible = false;
    container.active = false;
    events.off('prerender', sync);
    scene.events?.off?.('shutdown', destroy);
    scene.events?.off?.('destroy', destroy);
    document.removeEventListener?.('keydown', handleModalKey, true);
    if (frameImage) { frameImage.onload = null; frameImage.onerror = null; }
    root?.remove();
  }
  function sync() {
    if (destroyed) return;
    try {
      if (!root.isConnected) throw new Error('U3 overlay detached');
      const bounds = canvas.getBoundingClientRect();
      root.style.display = container.visible && bounds.width > 0 && bounds.height > 0 ? 'block' : 'none';
      if (!container.visible) return;
      root.style.left = `${bounds.left}px`;
      root.style.top = `${bounds.top}px`;
      root.style.width = `${bounds.width}px`;
      root.style.height = `${bounds.height}px`;
      // Browsers rasterize live DOM/SVG text at the display DPR, independent of Phaser's 960x540 texture.
      stage.style.transform = `scale(${bounds.width / 960},${bounds.height / 540})`;
    } catch (error) {
      destroy();
      if (!failed) { failed = true; onFailure?.(error); }
    }
  }
  function setVisible(value) {
    if (destroyed) return;
    container.visible = !!value;
    sync();
  }
  function handleModalKey(event) {
    if (destroyed || !container.visible || kind === 'build') return;
    // Phaser captures Tab/Space on window. Keep these native controls inside the
    // active modal without changing the combat keyboard or read-only build panel.
    if (event.key === 'Tab') {
      const buttons = [...root.querySelectorAll('button:not(:disabled)')];
      event.preventDefault();
      event.stopPropagation();
      if (!buttons.length) return;
      const current = buttons.indexOf(document.activeElement);
      const next = current < 0 ? (event.shiftKey ? buttons.length - 1 : 0)
        : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next].focus();
    } else if (event.key === ' ' || event.key === 'Enter') {
      const button = document.activeElement;
      if (!root.contains(button) || button.tagName !== 'BUTTON' || button.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) button.click();
    }
  }
  try {
    root = u3Element(document, 'div', `scp-u3 ${className}`);
    root.setAttribute('data-scp-u3', kind ?? 'overlay');
    root.setAttribute('role', kind === 'build' ? 'region' : 'dialog');
    root.setAttribute('aria-label', { upgrade:'现场强化授权', build:'当前构筑', pause:'行动暂停', victory:'重新收容确认', failure:'行动终止' }[kind] ?? '行动终端');
    if (kind !== 'build') root.setAttribute('aria-modal', 'true');
    Object.assign(root.style, { position:'fixed', zIndex:kind === 'build' ? '3' : '4', overflow:'hidden', userSelect:'none' });
    root.style.setProperty('--u3-steel', `url("${steelUrl}")`);
    root.style.setProperty('--u3-frame', `url("${frameUrl}")`);
    root.style.setProperty('--u3-paper', `url("${paperUrl}")`);
    frameImage = document.createElement('img');
    frameImage.onload = () => { if (!destroyed) root.classList.add('u3-frame-ready'); };
    frameImage.onerror = () => { /* The fully drawn CSS enclosure remains operable. */ };
    frameImage.src = frameUrl;
    const sheet = u3Element(document, 'style', '', U3_MATERIAL_CSS + '\n' + styles);
    stage = u3Element(document, 'div', 'u3-stage');
    panel = u3Element(document, 'section', 'u3-panel');
    panel.style.width = `${width}px`;
    panel.style.height = `${height}px`;
    for (const [left, top] of [['5px','5px'],['calc(100% - 15px)','5px'],['5px','calc(100% - 15px)'],['calc(100% - 15px)','calc(100% - 15px)']]) {
      const screw = u3Element(document, 'i', 'u3-screw');
      screw.style.left = left; screw.style.top = top; panel.appendChild(screw);
    }
    stage.appendChild(panel);
    root.append(sheet, stage);
    document.body.appendChild(root);
    if (kind !== 'build') document.addEventListener?.('keydown', handleModalKey, true);
    events.on('prerender', sync);
    scene.events?.once?.('shutdown', destroy);
    scene.events?.once?.('destroy', destroy);
    sync();
    if (destroyed) return null;
    return { document, root, panel, container, setVisible, destroy, sync };
  } catch (error) { destroy(); throw error; }
}
