import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createHudTextOverlay } from "../src/ui/hudTextOverlay.js";

class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.nodeName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.style = { setProperty(name, value) { this[name] = value; } };
    this._textContent = "";
  }
  setAttribute(name, value) {
    if (this.ownerDocument.failWrites) throw new Error("SVG update failed");
    this.attributes.set(name, String(value));
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  appendChild(child) {
    if (child.parentNode) child.remove();
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  removeChild(child) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentNode = null;
    return child;
  }
  remove() { this.parentNode?.removeChild(this); }
  get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; });
    this.children = [];
    this._textContent = String(value);
  }
  get isConnected() { return this === this.ownerDocument.body || this.parentNode?.isConnected === true; }
  get parentElement() { return this.parentNode; }
}

function descendants(element, tagName) {
  return element.children.flatMap((child) => [
    ...(child.tagName.toLowerCase() === tagName ? [child] : []),
    ...descendants(child, tagName)
  ]);
}

function visible(element) {
  for (let current = element; current; current = current.parentNode) {
    if (current.hidden || current.style.display === "none" || current.style.visibility === "hidden"
      || current.getAttribute("display") === "none" || current.getAttribute("visibility") === "hidden") return false;
    const alpha = current.getAttribute("opacity") ?? current.style.opacity;
    if (alpha != null && alpha !== "" && Number(alpha) === 0) return false;
  }
  return element.isConnected;
}

function opacity(element) {
  let result = 1;
  for (let current = element; current; current = current.parentNode) {
    const value = current.getAttribute("opacity") ?? current.style.opacity;
    if (value != null && value !== "") result *= Number(value);
  }
  return result;
}

function renderedPoint(element) {
  let x = Number(element.getAttribute("x") ?? 0);
  let y = Number(element.getAttribute("y") ?? 0);
  for (let current = element; current; current = current.parentNode) {
    const transform = current.getAttribute("transform") ?? "";
    const matrix = transform.match(/matrix\(([^)]+)\)/);
    if (matrix) {
      const [a, b, c, d, e, f] = matrix[1].trim().split(/[ ,]+/).map(Number);
      [x, y] = [a * x + c * y + e, b * x + d * y + f];
    }
  }
  return { x, y };
}

function fixture() {
  const doc = {
    failWrites: false,
    createElement(name) { return new Element(name, this); },
    createElementNS(namespace, name) { return new Element(name, this); }
  };
  doc.body = doc.createElement("body");
  const canvas = doc.createElement("canvas");
  canvas.width = 960;
  canvas.height = 540;
  let bounds = { left: 50, top: 60, width: 1440, height: 810 };
  canvas.getBoundingClientRect = () => ({ ...bounds });
  doc.body.appendChild(canvas);
  const root = { visible: true, active: true, alpha: 0.8, parentContainer: null };
  const banner = { visible: true, active: true, alpha: 0.5, parentContainer: root };
  const calls = [];
  const originalWebGL = function (...args) { calls.push({ mode: "webgl", receiver: this, args }); };
  const originalCanvas = function (...args) { calls.push({ mode: "canvas", receiver: this, args }); };
  const label = {
    name: "eventBannerDetail", text: "电网故障 · 备用供电", type: "Text",
    visible: true, active: true, alpha: 0.5, parentContainer: banner,
    x: 7, y: 8, width: 130, height: 16,
    displayOriginX: 4, displayOriginY: 3,
    padding: { left: 0, right: 0, top: 0, bottom: 0 },
    style: { fontFamily: "Microsoft YaHei", fontSize: "14px", fontStyle: "bold", color: "#e8eee8", metrics: { ascent: 11, descent: 3 }, strokeThickness: 0 },
    getWorldTransformMatrix() { return { a: 1, b: 0, c: 0, d: 1, e: 120, f: 40, tx: 120, ty: 40 }; },
    renderWebGL: originalWebGL,
    renderCanvas: originalCanvas
  };
  const scene = {
    isMissionActive: true, isGameOver: false, isPaused: false, isLevelUpActive: false,
    buildPanel: { visible: false },
    game: { canvas, events: new EventEmitter() },
    cameras: { main: { matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, tx: 0, ty: 0 } } },
    events: new EventEmitter()
  };
  return { doc, canvas, scene, label, root, banner, calls, originalWebGL, originalCanvas,
    setBounds(next) { bounds = next; },
    frame() { scene.game.events.emit("prerender"); },
    svg() { return descendants(doc.body, "svg")[0]; },
    text() { return descendants(doc.body, "text")[0]; }
  };
}

test("HUD 原生文字只在正常战斗接管，覆盖页面期间恢复原渲染且保留引用", () => {
  const f = fixture();
  const overlay = createHudTextOverlay(f.scene, [f.label]);
  assert.ok(overlay);
  f.frame();
  assert.equal(f.text().textContent, "电网故障 · 备用供电");
  assert.equal(visible(f.text()), true);
  f.label.renderWebGL("renderer", "source");
  f.label.renderCanvas("renderer", "source");
  assert.equal(f.calls.length, 0, "不能将 HUD 文字同时绘制在 Canvas 与 SVG");

  for (const flag of ["isPaused", "isLevelUpActive", "isGameOver", "buildPanel", "inactiveMission"]) {
    if (flag === "buildPanel") f.scene.buildPanel.visible = true;
    else if (flag === "inactiveMission") f.scene.isMissionActive = false;
    else f.scene[flag] = true;
    f.frame();
    assert.equal(visible(f.svg()), false, `${flag} 页面不能被 SVG HUD 盖住`);
    const before = f.calls.length;
    f.label.renderWebGL("renderer", "source");
    f.label.renderCanvas("renderer", "source");
    assert.equal(f.calls.length, before + 2);
    assert.equal(f.calls.at(-1).receiver, f.label);
    assert.deepEqual(f.calls.at(-1).args, ["renderer", "source"]);
    if (flag === "buildPanel") f.scene.buildPanel.visible = false;
    else if (flag === "inactiveMission") f.scene.isMissionActive = true;
    else f.scene[flag] = false;
    f.label.text = "备用电源已连接";
    f.frame();
    assert.equal(visible(f.text()), true);
    assert.equal(f.text().textContent, "备用电源已连接");
  }
  assert.equal(f.label.parentContainer, f.banner);
  assert.equal(f.label.visible, true);
  assert.equal(f.label.alpha, 0.5);
  overlay.destroy();
});

test("HUD 文字继承父容器淡出、显隐与停用，不冻结通知状态", () => {
  const f = fixture();
  const overlay = createHudTextOverlay(f.scene, [f.label]);
  f.frame();
  assert.equal(opacity(f.text()), 0.2);
  f.banner.alpha = 0.25;
  f.frame();
  assert.equal(opacity(f.text()), 0.1);
  for (const object of [f.label, f.banner, f.root]) {
    for (const property of ["visible", "active"]) {
      object[property] = false;
      f.frame();
      assert.equal(visible(f.text()), false);
      object[property] = true;
      f.frame();
      assert.equal(visible(f.text()), true);
    }
  }
  overlay.destroy();
});

test("HUD 文字跟随 Canvas CSS 位置和变换，保持 960×540 画布与输入不变", () => {
  const f = fixture();
  const overlay = createHudTextOverlay(f.scene, [f.label]);
  f.frame();
  const svg = f.svg();
  assert.equal(svg.getAttribute("viewBox"), "0 0 960 540");
  const host = [svg, svg.parentNode].find((node) => node.style.position === "fixed");
  assert.ok(host);
  assert.equal(host.style.left, "50px");
  assert.equal(host.style.top, "60px");
  assert.equal(host.style.width, "1440px");
  assert.equal(host.style.height, "810px");
  assert.equal(host.style.pointerEvents ?? host.style["pointer-events"], "none");
  assert.deepEqual(renderedPoint(f.text()), { x: 116, y: 48 });
  assert.equal(f.text().getAttribute("fill") ?? f.text().style.fill, "#e8eee8");
  assert.equal(parseFloat(f.text().getAttribute("font-size") ?? f.text().style.fontSize), 14);
  f.setBounds({ left: 12, top: 24, width: 960, height: 540 });
  f.label.getWorldTransformMatrix = () => ({ a: 2, b: 0, c: 0, d: 2, e: 125, f: 44, tx: 125, ty: 44 });
  f.frame();
  assert.equal(host.style.left, "12px");
  assert.equal(host.style.width, "960px");
  assert.deepEqual(renderedPoint(f.text()), { x: 117, y: 60 });
  assert.equal(f.canvas.width, 960);
  assert.equal(f.canvas.height, 540);
  assert.equal(f.canvas.style.width, undefined);
  assert.equal(f.canvas.style.pointerEvents, undefined);
  overlay.destroy();
});

test("本帧 camera 震动在 postrender 同步，不让原生文字比仪表底板落后一帧", () => {
  const f = fixture();
  const overlay = createHudTextOverlay(f.scene, [f.label]);
  f.frame();
  assert.deepEqual(renderedPoint(f.text()), { x: 116, y: 48 });
  f.scene.cameras.main.matrix.e = 8;
  f.scene.cameras.main.matrix.tx = 8;
  f.scene.cameras.main.matrix.f = -6;
  f.scene.cameras.main.matrix.ty = -6;
  f.scene.game.events.emit("postrender");
  assert.deepEqual(renderedPoint(f.text()), { x: 124, y: 42 });
  overlay.destroy();
});

test("HUD 覆盖层销毁与 scene 生命周期清理幂等，仅移除自己的元素和监听器", () => {
  for (const lifecycle of ["manual", "shutdown", "destroy"]) {
    const f = fixture();
    const unrelated = f.doc.createElement("aside");
    f.doc.body.appendChild(unrelated);
    const externalListener = () => {};
    f.scene.game.events.on("prerender", externalListener);
    f.scene.game.events.on("postrender", externalListener);
    const overlay = createHudTextOverlay(f.scene, [f.label]);
    f.frame();
    if (lifecycle === "manual") overlay.destroy();
    else f.scene.events.emit(lifecycle);
    overlay.destroy();
    assert.equal(f.label.renderWebGL, f.originalWebGL);
    assert.equal(f.label.renderCanvas, f.originalCanvas);
    assert.equal(descendants(f.doc.body, "svg").length, 0);
    assert.equal(unrelated.isConnected, true);
    assert.equal(f.canvas.isConnected, true);
    assert.deepEqual(f.scene.game.events.listeners("prerender"), [externalListener]);
    assert.deepEqual(f.scene.game.events.listeners("postrender"), [externalListener]);
    assert.equal(f.scene.events.listenerCount("shutdown"), 0);
    assert.equal(f.scene.events.listenerCount("destroy"), 0);
    f.label.renderCanvas("after cleanup");
    assert.equal(f.calls.length, 1);
  }
});

test("Phaser 原型上的渲染方法清理后仍通过原型继承，不遗留实例覆盖", () => {
  const f = fixture();
  const prototype = { renderWebGL: f.originalWebGL, renderCanvas: f.originalCanvas };
  delete f.label.renderWebGL;
  delete f.label.renderCanvas;
  Object.setPrototypeOf(f.label, prototype);
  const overlay = createHudTextOverlay(f.scene, [f.label]);
  f.frame();
  f.label.renderCanvas("combat");
  assert.equal(f.calls.length, 0);
  overlay.destroy();
  assert.equal(Object.hasOwn(f.label, "renderWebGL"), false);
  assert.equal(Object.hasOwn(f.label, "renderCanvas"), false);
  assert.equal(f.label.renderWebGL, f.originalWebGL);
  assert.equal(f.label.renderCanvas, f.originalCanvas);
  f.label.renderCanvas("after cleanup");
  assert.equal(f.calls.length, 1);
});

test("缺少 DOM、Canvas 或 game events 时跳过原生覆盖，不抑制 Canvas HUD", () => {
  for (const missing of ["document", "canvas", "events"]) {
    const f = fixture();
    if (missing === "document") f.canvas.ownerDocument = null;
    if (missing === "canvas") f.scene.game.canvas = null;
    if (missing === "events") f.scene.game.events = null;
    assert.equal(createHudTextOverlay(f.scene, [f.label]), null);
    assert.equal(f.label.renderWebGL, f.originalWebGL);
    assert.equal(f.label.renderCanvas, f.originalCanvas);
  }
});

test("SVG 创建或刷新失败时立即恢复 Canvas，避免 HUD 文字消失", () => {
  const creation = fixture();
  let elements = 0;
  creation.doc.createElementNS = (namespace, name) => {
    if (++elements === 3) throw new Error("SVG unavailable after the first label");
    return new Element(name, creation.doc);
  };
  assert.doesNotThrow(() => createHudTextOverlay(creation.scene, [creation.label, fixture().label]));
  assert.equal(creation.label.renderWebGL, creation.originalWebGL);
  assert.equal(creation.label.renderCanvas, creation.originalCanvas);
  assert.equal(descendants(creation.doc.body, "svg").length, 0);

  for (const phase of ["prerender", "postrender"]) {
    const f = fixture();
    const overlay = createHudTextOverlay(f.scene, [f.label]);
    f.frame();
    f.doc.failWrites = true;
    f.label.text = "新通知";
    f.label.style.color = "#ff4455";
    assert.doesNotThrow(() => f.scene.game.events.emit(phase));
    f.label.renderWebGL("renderer", "source");
    f.label.renderCanvas("renderer", "source");
    assert.equal(f.calls.length, 2);
    const svg = f.svg();
    assert.equal(svg, undefined, "故障回退必须移除自身 SVG 宿主");
    assert.equal(f.label.text, "新通知");
    overlay.destroy();
  }
});
