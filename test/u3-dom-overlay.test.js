import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createU3Overlay, createU3Button } from '../src/ui/u3DomOverlay.js';

function fixture() {
  class Element {
    constructor(document, tag) {
      this.ownerDocument = document; this.tagName = tag; this.children = [];
      this.style = { setProperty(key, value) { this[key] = value; } }; this.dataset = {};
      this.events = new Map(); this.attributes = new Map(); this.disabled = false;
    }
    appendChild(child) { child.remove(); this.children.push(child); child.parentNode = this; return child; }
    append(...children) { children.forEach(child => this.appendChild(child)); }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
    get isConnected() { return this === this.ownerDocument.body || this.parentNode?.isConnected === true; }
    setAttribute(key,value) { this.attributes.set(key,String(value)); }
    addEventListener(key,fn) { this.events.set(key,fn); }
    removeEventListener(key,fn) { if(this.events.get(key) === fn) this.events.delete(key); }
  }
  const document = { createElement(tag) { return new Element(this,tag); }, createElementNS(ns,tag) { return this.createElement(tag); } };
  document.events = new Set();
  document.addEventListener = (key, handler) => document.events.add(handler);
  document.removeEventListener = (key, handler) => document.events.delete(handler);
  document.body = document.createElement('body');
  const canvas = document.createElement('canvas');
  let bounds = { left:23, top:41, width:960, height:540 };
  canvas.getBoundingClientRect = () => bounds;
  document.body.appendChild(canvas);
  const scene = { game: { canvas, events: new EventEmitter() }, events: new EventEmitter() };
  return { scene, document, setBounds(value) { bounds = value; } };
}

test('U3 follows the canvas display rectangle without depending on world camera position', () => {
  const f = fixture();
  const overlay = createU3Overlay(f.scene, { kind:'pause' });
  f.scene.cameras = { main: { scrollX:972, scrollY:1080 } };
  f.setBounds({ left:4, top:6, width:1440, height:810 });
  f.scene.game.events.emit('prerender');
  assert.equal(overlay.root.style.left, '4px');
  assert.equal(overlay.root.style.top, '6px');
  assert.equal(overlay.panel.parentNode.style.transform, 'scale(1.5,1.5)');
  overlay.container.setPosition(700,900);
  assert.equal(overlay.root.style.left, '4px');
  overlay.container.setVisible(false);
  assert.equal(overlay.container.visible, false);
  assert.equal(overlay.root.style.display, 'none');
  overlay.setVisible(true);
  assert.equal(overlay.root.style.display, 'block');
  overlay.destroy();
});

test('U3 repeated shutdown and restart cycles leave no DOM or event listeners', () => {
  const f = fixture();
  for(let index=0;index<15;index++) {
    const overlay = createU3Overlay(f.scene, { kind:'upgrade' });
    assert.equal(f.scene.game.events.listenerCount('prerender'),1);
    assert.equal(f.document.events.size,1);
    f.scene.events.emit('shutdown');
    overlay.destroy();
    assert.equal(f.scene.game.events.listenerCount('prerender'),0);
    assert.equal(f.scene.events.listenerCount('destroy'),0);
    assert.equal(f.scene.events.listenerCount('shutdown'),0);
    assert.equal(f.document.body.children.length,1);
    assert.equal(overlay.container.active,false);
    assert.equal(f.document.events.size,0);
  }
});

test('U3 runtime DOM failure calls the recovery exit once and releases its controller', () => {
  const f = fixture(); let failed = 0;
  const overlay = createU3Overlay(f.scene, { kind:'upgrade', onFailure() { failed++; } });
  overlay.root.remove();
  f.scene.game.events.emit('prerender');
  f.scene.game.events.emit('prerender');
  assert.equal(failed,1);
  assert.equal(overlay.container.active,false);
  assert.equal(f.scene.game.events.listenerCount('prerender'),0);
  assert.equal(f.scene.events.listenerCount('shutdown'),0);
  assert.equal(f.document.events.size,0);
});

test('U3 cannot strand a modal on hosts without DOM support', () => {
  assert.equal(createU3Overlay({}),null);
});

test('U3 button stale callbacks are inert after disable or destruction', () => {
  const f = fixture(); let activations=0;
  const button = createU3Button(f.document, { text:'继续行动', onActivate() { activations++; } });
  const click=button.element.events.get('click');
  const event={ stopPropagation() {} };
  click(event); assert.equal(activations,1);
  button.disableInteractive(); click(event); assert.equal(activations,1);
  button.setState('idle'); click(event); assert.equal(activations,2);
  button.setState('selected'); button.hitArea.disableInteractive();
  assert.equal(button.element.dataset.state,'selected');
  assert.equal(button.element.disabled,true);
  button.destroy(); click(event); assert.equal(activations,2);
  assert.equal(button.element.events.size,0);
});
