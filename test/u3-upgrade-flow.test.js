import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { createU3UpgradeView } from "../src/ui/u3UpgradeView.js";

function stripImports(source) {
  return source.replace(/import[\s\S]*?from\s+["'][^"']+["'];\s*/g, "");
}

async function loadProgressionMixin() {
  globalThis.__u3ProgressionDeps = { BALANCE, createU3UpgradeView };
  const source = await readFile(new URL("../src/scene/progression.js", import.meta.url), "utf8");
  const injected = "const { BALANCE, createU3UpgradeView } = globalThis.__u3ProgressionDeps;";
  return import(`data:text/javascript;base64,${Buffer.from(`${injected}\n${stripImports(source)}`).toString("base64")}`);
}

const { progressionMixin } = await loadProgressionMixin();

class Element {
  constructor(tag, document) {
    this.tagName = tag.toUpperCase(); this.ownerDocument = document; this.children = [];
    this.parentNode = null; this.className = ""; this.dataset = {}; this.attributes = new Map();
    this.listeners = new Map(); this.disabled = false; this._textContent = "";
    this.style = { setProperty(name, value) { this[name] = value; } };
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  appendChild(child) { child.remove(); this.children.push(child); child.parentNode = this; return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  removeChild(child) { this.children = this.children.filter((entry) => entry !== child); child.parentNode = null; }
  remove() { this.parentNode?.removeChild(this); }
  addEventListener(name, handler) { this.listeners.set(name, [...(this.listeners.get(name) ?? []), handler]); }
  removeEventListener(name, handler) { this.listeners.set(name, (this.listeners.get(name) ?? []).filter((entry) => entry !== handler)); }
  dispatch(name) { for (const handler of [...(this.listeners.get(name) ?? [])]) handler({ stopPropagation() {} }); }
  get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
  set textContent(value) { this.children.forEach((child) => { child.parentNode = null; }); this.children = []; this._textContent = String(value); }
  set innerHTML(value) { this._innerHTML = String(value); }
  get isConnected() { return this === this.ownerDocument.body || this.parentNode?.isConnected === true; }
}

function definition(key) { return UPGRADE_DEFINITIONS.find((entry) => entry.key === key); }

function createScene(choiceSets) {
  const document = {
    createElement(tag) { return new Element(tag, this); },
    createElementNS(namespace, tag) { return new Element(tag, this); }
  };
  document.body = document.createElement("body");
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540 });
  document.body.appendChild(canvas);
  const delayed = [];
  const scene = {
    game: { canvas, events: new EventEmitter() }, events: new EventEmitter(),
    isGameOver: false, isLevelUpActive: false, isResolvingLevelUp: false,
    _levelUpPresentationUnavailable: false, levelUpOverlay: null, levelUpOverlayController: null,
    levelUpCards: [], levelUpCardObjects: [], levelUpButtonControllers: [], levelUpButtonObjects: [],
    selectedWeaponId: "pistol", health: 76, maxHealth: 100, playerMoveSpeed: 220,
    pickupRadius: 56, projectileCount: 1, bulletPenetration: 0, bulletDamage: 20,
    shootIntervalMs: 280, elapsedSurvivalMs: 10_000, teslaFieldNextTickAtMs: 0,
    rerollsRemaining: 3, pendingLevelUps: 2,
    weapons: {
      pistol: { id: "pistol", name: "基金会收容突击步枪", currentLevel: 2, unlocked: true, damage: 20, cooldownMs: 280 },
      tesla: { id: "tesla", name: "特斯拉收容发射器", currentLevel: 0, unlocked: false, damage: 6, cooldownMs: 300, chainTargets: 3 },
      shotgun: { id: "shotgun", name: "基金会收容突破器", currentLevel: 0, unlocked: false, damage: 8, cooldownMs: 1300, knockbackStrength: 330, suppressionSlowMultiplier: 1, staggerDurationMs: 320, magazineSize: 4, currentShells: 4, reloadDurationMs: 2000 }
    },
    weaponMutations: { pistolBoomerang: false, breacherExplosive: false, teslaField: false },
    upgradeLevels: Object.fromEntries(UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])),
    choiceCallCount: 0, sounds: [], pauseCount: 0, resumeCount: 0,
    hideBuildPanel() {},
    pauseGameplaySystems() { this.pauseCount += 1; },
    resumeGameplaySystems() { this.resumeCount += 1; },
    updateUI() {}, playSound(name) { this.sounds.push(name); },
    syncCombatStatsFromWeapons() { const weapon = this.weapons[this.selectedWeaponId]; this.bulletDamage = weapon.damage; this.shootIntervalMs = weapon.cooldownMs; },
    time: { delayedCall(delay, callback) { const timer = { delay, callback, remove() {} }; delayed.push(timer); return timer; } }
  };
  Object.assign(scene, progressionMixin);
  scene.getLevelUpChoices = function getLevelUpChoices() {
    return choiceSets[this.choiceCallCount++] ?? choiceSets.at(-1);
  };
  scene.runDelay = () => delayed.shift().callback();
  return scene;
}

test("U3 交易沿用一次抽取、三次重抽和连续 pending，选择立即应用且单击不会重复", () => {
  const first = [definition("damage"), definition("maxHealth"), definition("attackSpeed")];
  const second = [definition("projectileCount"), definition("penetration"), definition("pickupRadius")];
  const scene = createScene([first, second, first]);

  scene.showLevelUpOverlay();
  assert.equal(scene.choiceCallCount, 1);
  assert.equal(scene.levelUpOverlayController.mode, "u3-upgrade");
  assert.equal(scene.levelUpOverlayController.choices, first);
  const originalRoot = scene.levelUpOverlayController.root;

  scene.levelUpRerollButtonController.element.dispatch("click");
  assert.equal(scene.rerollsRemaining, 2);
  assert.equal(scene.choiceCallCount, 2);
  assert.equal(scene.levelUpOverlayController.root, originalRoot);
  assert.equal(scene.levelUpOverlayController.choices, second);
  assert.equal(scene.levelUpCards.length, 3);

  const selected = scene.levelUpCards[0];
  selected.element.dispatch("click");
  selected.element.dispatch("click");
  assert.equal(scene.projectileCount, 2, "同步锁定必须阻止第二次应用");
  assert.equal(scene.pendingLevelUps, 1);
  assert.equal(scene.isResolvingLevelUp, true);
  assert.equal(selected.element.dataset.state, "selected");
  assert.equal(selected.element.disabled, true);
  scene.runDelay();
  assert.equal(scene.choiceCallCount, 3);
  assert.equal(scene.isLevelUpActive, true);
  assert.equal(scene.resumeCount, 0);
});

test("运行时 DOM 故障把当前同一选择数组交给 terminal，terminal 再失败才进入 legacy", () => {
  const choices = [definition("damage"), definition("maxHealth"), definition("attackSpeed")];
  const scene = createScene([choices]);
  const destroyed = [];
  const terminalAttempts = [];
  scene.levelUpOverlayController = { mode: "u3-upgrade", choices, destroy() { destroyed.push("u3"); } };
  scene.levelUpOverlay = { active: true };
  scene.createTerminalLevelUpOverlay = (received) => { terminalAttempts.push(received); throw new Error("terminal failed"); };
  scene.replaceFailedTerminalWithLegacyLevelUpOverlay = (received) => { terminalAttempts.push(received); return true; };

  scene.handleU3LevelUpPresentationFailure();

  assert.deepEqual(destroyed, ["u3"]);
  assert.equal(terminalAttempts.length, 2);
  assert.equal(terminalAttempts[0], choices);
  assert.equal(terminalAttempts[1], choices);
});

test("U3 重抽刷新失败时先把该次新选择交给 terminal，而不越过 terminal 直达 legacy", () => {
  const first = [definition("damage"), definition("maxHealth"), definition("attackSpeed")];
  const broken = [
    { ...definition("damage"), key: "broken-preview", apply() { throw new Error("preview failed"); } },
    definition("penetration"),
    definition("pickupRadius")
  ];
  const scene = createScene([first, broken]);
  const terminalAttempts = [];
  const legacyAttempts = [];
  scene.showLevelUpOverlay();
  scene.createTerminalLevelUpOverlay = (received) => { terminalAttempts.push(received); };
  scene.replaceFailedTerminalWithLegacyLevelUpOverlay = (received) => { legacyAttempts.push(received); return true; };

  scene.levelUpRerollButtonController.element.dispatch("click");

  assert.deepEqual(terminalAttempts, [broken]);
  assert.deepEqual(legacyAttempts, []);
  assert.equal(scene.rerollsRemaining, 2);
});
