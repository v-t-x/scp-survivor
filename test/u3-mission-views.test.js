import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { menusMixin } from "../src/scene/menus.js";

class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.nodeName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.dataset = {};
    this.disabled = false;
    this.className = "";
    this._textContent = "";
    this.style = { setProperty(name, value) { this[name] = value; } };
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  appendChild(child) {
    child.remove();
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  remove() { this.parentNode?.removeChild(this); }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((candidate) => candidate !== listener));
  }
  click() {
    if (this.disabled) return;
    for (const listener of this.listeners.get("click") ?? []) {
      listener({ stopPropagation() {} });
    }
  }
  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }
  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; });
    this.children = [];
    this._textContent = String(value);
  }
  get isConnected() {
    return this === this.ownerDocument.body || this.parentNode?.isConnected === true;
  }
}

function descendants(element) {
  return element.children.flatMap((child) => [child, ...descendants(child)]);
}

function byClass(root, className) {
  return descendants(root).filter((element) => String(element.className).split(/\s+/).includes(className));
}

function fixture() {
  const document = {
    createElement(name) { return new Element(name, this); },
    createElementNS(namespace, name) { return new Element(name, this); }
  };
  document.body = document.createElement("body");
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () => ({ left: 40, top: 50, width: 1440, height: 810 });
  document.body.appendChild(canvas);
  return {
    document,
    scene: {
      game: { canvas, events: new EventEmitter() },
      events: new EventEmitter(),
      bossPhaseActive: true,
      bossEnemy: { active: true },
      survivalPhaseEnded: true,
      activeFacilityEvent: { name: "电力故障", warning: "备用电源切换" },
      killCount: 37,
      lastRunCreditsEarned: 42,
      meta: { credits: 314, perks: {} },
      getFinalSurvivalTimeSeconds() { return "87.6"; }
    }
  };
}

test("pause view renders a compact mission device and routes its two native buttons", async () => {
  const module = await import("../src/ui/u3MissionViews.js");
  assert.equal(typeof module.createU3PauseView, "function", "pause DOM view must be implemented");
  const { document, scene } = fixture();
  let resumes = 0;
  let quits = 0;

  const controller = module.createU3PauseView(scene, {
    onResume() { resumes += 1; },
    onQuit() { quits += 1; }
  });

  assert.equal(controller.mode, "u3");
  assert.equal(controller.kind, "pause");
  assert.equal(controller.root.getAttribute("data-scp-u3"), "pause");
  assert.match(controller.root.textContent, /行动暂停/);
  assert.match(controller.root.textContent, /重新收容 SCP-049/);
  assert.match(controller.root.textContent, /01:27/);
  assert.match(controller.root.textContent, /终局收容 \/\/ SCP-049 已突破收容/);
  assert.equal(byClass(controller.root, "u3-pause-device").length, 1);
  assert.equal(byClass(controller.root, "u3-pause-primary").length, 1);
  assert.equal(byClass(controller.root, "u3-pause-secondary").length, 1);
  assert.equal(byClass(controller.root, "u3-pause-key")[0].getAttribute("aria-hidden"), "true");
  assert.equal(controller.actions.resume.element.parentNode.getAttribute("aria-orientation"), "vertical");
  assert.equal(byClass(controller.root, "u3-eyebrow")[0].textContent, "SITE-CN-03 // MISSION CONTROL");

  controller.actions.resume.element.click();
  controller.actions.quit.element.click();
  assert.deepEqual({ resumes, quits }, { resumes: 1, quits: 1 });

  controller.destroy();
  controller.destroy();
  assert.equal(controller.root.isConnected, false);
  assert.equal(controller.actions.resume.element.disabled, true);
  assert.equal(controller.actions.quit.element.disabled, true);
  assert.equal(document.body.children.length, 1, "destroy keeps the game canvas and removes only the overlay");
});

test("victory uses a containment device beside a paper report with a recovery stamp", async () => {
  const { createU3ResultView } = await import("../src/ui/u3MissionViews.js");
  assert.equal(typeof createU3ResultView, "function", "result DOM view must be implemented");
  const { scene } = fixture();
  let restarts = 0;

  const controller = createU3ResultView(scene, {
    type: "victory",
    onRestart() { restarts += 1; }
  });

  assert.equal(controller.mode, "u3");
  assert.equal(controller.kind, "victory");
  assert.equal(byClass(controller.root, "u3-victory-device").length, 1);
  assert.equal(byClass(controller.root, "u3-paper").length, 1);
  assert.equal(byClass(controller.root, "u3-victory-stats").length, 1);
  assert.equal(byClass(controller.root, "u3-incident-rail").length, 0);
  assert.equal(byClass(controller.root, "u3-victory-subject").length, 1);
  assert.equal(byClass(controller.root, "u3-paper-clamp").length, 2);
  assert.match(byClass(controller.root, "u3-victory-device")[0].textContent, /行动记录完成/);
  assert.equal(byClass(controller.root, "u3-victory-layout")[0], controller.actions.restart.element.parentNode);
  assert.match(controller.root.textContent, /重新收容确认/);
  assert.match(controller.root.textContent, /SCP-049 已重新收容/);
  assert.match(controller.root.textContent, /收容恢复/);
  for (const expected of ["生存时间01:27", "击杀数37", "当局学分+42", "累计学分314"]) {
    assert.equal(controller.root.textContent.includes(expected), true, `missing live statistic: ${expected}`);
  }
  controller.actions.restart.element.click();
  assert.equal(restarts, 1);
});

test("failure uses a red incident rail, interrupted waveform, and horizontal statistics", async () => {
  const { createU3ResultView } = await import("../src/ui/u3MissionViews.js");
  const { scene } = fixture();

  const controller = createU3ResultView(scene, { type: "failure", onRestart() {} });

  assert.equal(controller.kind, "failure");
  assert.equal(byClass(controller.root, "u3-incident-rail").length, 1);
  assert.equal(byClass(controller.root, "u3-interruption-wave").length, 1);
  assert.equal(byClass(controller.root, "u3-failure-stats").length, 1);
  assert.equal(byClass(controller.root, "u3-paper").length, 0);
  assert.equal(byClass(controller.root, "u3-victory-device").length, 0);
  assert.equal(byClass(controller.root, "u3-interruption-wave")[0].children[0].getAttribute("preserveAspectRatio"), "none");
  assert.match(controller.root.textContent, /行动终止/);
  assert.match(controller.root.textContent, /事故记录已封存/);
  assert.match(controller.root.textContent, /等待重新部署/);
  assert.match(controller.root.textContent, /行动中断/);
  assert.match(byClass(controller.root, "u3-incident-seal")[0].textContent, /SCP FOUNDATION/);
  assert.match(byClass(controller.root, "u3-wave-status")[0].textContent, /AT 01:27/);
  assert.equal(byClass(controller.root, "u3-failure-terminal")[0], controller.actions.restart.element.parentNode);
  assert.equal(byClass(controller.root, "u3-stat").length, 4);
});

test("mission views return null without a native DOM so menus can retain terminal fallback", async () => {
  const { createU3PauseView, createU3ResultView } = await import("../src/ui/u3MissionViews.js");
  const scene = {
    game: { canvas: null, events: new EventEmitter() },
    events: new EventEmitter(),
    activeFacilityEvent: null,
    bossPhaseActive: false,
    survivalPhaseEnded: false,
    killCount: 0,
    meta: { credits: 0 },
    getFinalSurvivalTimeSeconds() { return "0.0"; }
  };

  assert.equal(createU3PauseView(scene, { onResume() {}, onQuit() {} }), null);
  assert.equal(createU3ResultView(scene, { type: "failure", onRestart() {} }), null);
});

function interactiveScene() {
  const { scene } = fixture();
  Object.assign(scene, menusMixin, {
    isPaused: true,
    isMissionActive: true,
    isGameOver: false,
    isLevelUpActive: false,
    resumeCount: 0,
    restartCount: 0,
    destroyLevelUpCount: 0,
    resumeGameplaySystems() { this.resumeCount += 1; },
    updateUI() {},
    destroyLevelUpOverlay() { this.destroyLevelUpCount += 1; }
  });
  scene.scene = { restart() { scene.restartCount += 1; } };
  return scene;
}

test("menus route pause actions through the U3 controller while preserving existing resume and quit flows", () => {
  const scene = interactiveScene();

  scene.showPauseOverlay();
  assert.equal(scene.pauseOverlayController.mode, "u3");
  assert.equal(scene.pauseOverlay, scene.pauseOverlayController.container);
  scene.pauseOverlayController.actions.resume.element.click();
  assert.equal(scene.isPaused, false);
  assert.equal(scene.resumeCount, 1);
  assert.equal(scene.pauseOverlayController, null);

  scene.isPaused = true;
  scene.showPauseOverlay();
  const quit = scene.pauseOverlayController.actions.quit.element;
  quit.click();
  quit.click();
  assert.equal(scene.isPaused, false);
  assert.equal(scene.destroyLevelUpCount, 1);
  assert.equal(scene.restartCount, 1);
  assert.equal(scene.pauseOverlayController, null);
});

for (const type of ["victory", "failure"]) {
  test(`menus install one guarded U3 ${type} result and keep restart ownership in the existing closure`, () => {
    const scene = interactiveScene();
    let finalTimeCalls = 0;
    scene.getFinalSurvivalTimeSeconds = () => {
      finalTimeCalls += 1;
      return "87.6";
    };

    const first = type === "victory" ? scene.showVictoryOverlay() : scene.showGameOverOverlay();
    const second = type === "victory" ? scene.showVictoryOverlay() : scene.showGameOverOverlay();
    assert.strictEqual(second, first);
    assert.equal(first.mode, "u3");
    assert.equal(first.kind, type);
    assert.equal(finalTimeCalls, 1);

    const restart = first.actions.restart.element;
    restart.click();
    restart.click();
    assert.equal(scene.restartCount, 1);
    assert.equal(scene.resultOverlayController, null);
    assert.equal(scene.resultOverlay, null);
    assert.equal(restart.disabled, true);
  });
}

test("a detached pause DOM restores live gameplay when neither presentation fallback can be built", () => {
  const scene = interactiveScene();
  scene.showPauseOverlay();
  scene.pauseOverlayController.root.remove();

  scene.game.events.emit("prerender");

  assert.equal(scene.pauseOverlayController, null);
  assert.equal(scene.pauseOverlay, null);
  assert.equal(scene.isPaused, false);
  assert.equal(scene.resumeCount, 1);
});

test("a detached result DOM reaches the existing guarded restart when all fallbacks are unavailable", () => {
  const scene = interactiveScene();
  scene.showGameOverOverlay();
  scene.resultOverlayController.root.remove();

  scene.game.events.emit("prerender");
  scene.game.events.emit("prerender");

  assert.equal(scene.resultOverlayController, null);
  assert.equal(scene.resultOverlay, null);
  assert.equal(scene.restartCount, 1);
});
