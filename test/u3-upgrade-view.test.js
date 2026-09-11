import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { createU3UpgradeView } from "../src/ui/u3UpgradeView.js";

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.className = "";
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = { setProperty(name, value) { this[name] = value; } };
    this._textContent = "";
    this.disabled = false;
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
  }
  remove() { this.parentNode?.removeChild(this); }
  addEventListener(name, handler) { this.listeners.set(name, [...(this.listeners.get(name) ?? []), handler]); }
  removeEventListener(name, handler) {
    this.listeners.set(name, (this.listeners.get(name) ?? []).filter((entry) => entry !== handler));
  }
  dispatch(name) {
    const event = { stopPropagation() {}, preventDefault() {} };
    for (const handler of [...(this.listeners.get(name) ?? [])]) handler(event);
  }
  get textContent() { return this._textContent + this.children.map((child) => child.textContent).join(""); }
  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; });
    this.children = [];
    this._textContent = String(value);
  }
  set innerHTML(value) { this._innerHTML = String(value); }
  get innerHTML() { return this._innerHTML ?? ""; }
  get isConnected() { return this === this.ownerDocument.body || this.parentNode?.isConnected === true; }
}

function descendants(node, predicate) {
  return node.children.flatMap((child) => [
    ...(predicate(child) ? [child] : []),
    ...descendants(child, predicate)
  ]);
}

function fixture() {
  const document = {
    createElement(tagName) { return new FakeElement(tagName, this); },
    createElementNS(namespace, tagName) { return new FakeElement(tagName, this); }
  };
  document.body = document.createElement("body");
  const canvas = document.createElement("canvas");
  canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 960, height: 540 });
  document.body.appendChild(canvas);
  const scene = {
    game: { canvas, events: new EventEmitter() },
    events: new EventEmitter(),
    selectedWeaponId: "pistol",
    health: 76,
    maxHealth: 100,
    playerMoveSpeed: 220,
    pickupRadius: 56,
    projectileCount: 1,
    bulletPenetration: 0,
    bulletDamage: 20,
    shootIntervalMs: 280,
    elapsedSurvivalMs: 10_000,
    teslaFieldNextTickAtMs: 0,
    rerollsRemaining: 3,
    pendingLevelUps: 2,
    weapons: {
      pistol: { id: "pistol", name: "基金会收容突击步枪", currentLevel: 2, unlocked: true, damage: 20, cooldownMs: 280 },
      tesla: { id: "tesla", name: "特斯拉收容发射器", currentLevel: 0, unlocked: false, damage: 6, cooldownMs: 300, chainTargets: 3 },
      shotgun: { id: "shotgun", name: "基金会收容突破器", currentLevel: 0, unlocked: false, damage: 8, cooldownMs: 1300, knockbackStrength: 330, suppressionSlowMultiplier: 1, staggerDurationMs: 320, magazineSize: 4, currentShells: 4, reloadDurationMs: 2000 }
    },
    weaponMutations: { pistolBoomerang: false, breacherExplosive: false, teslaField: false },
    upgradeLevels: Object.fromEntries(UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])),
    syncCombatStatsFromWeapons() {}
  };
  return { document, canvas, scene };
}

function upgrades(...keys) {
  return keys.map((key) => UPGRADE_DEFINITIONS.find((entry) => entry.key === key));
}

test("丰富三卡界面呈现图示、主要收益、真实前后值和动态武器/待选状态", () => {
  const f = fixture();
  const choices = upgrades("damage", "maxHealth", "attackSpeed");
  const selected = [];
  const view = createU3UpgradeView(f.scene, {
    choices,
    onSelect: (choice, card) => selected.push({ choice, card }),
    onReroll() {},
    onSkip() {}
  });

  assert.ok(view);
  assert.equal(view.mode, "u3-upgrade");
  assert.equal(view.cards.length, 3);
  assert.equal(view.root.getAttribute("data-scp-u3"), "upgrade");
  assert.match(view.root.textContent, /当前武器：基金会收容突击步枪/);
  assert.match(view.root.textContent, /待授权 2 次/);
  assert.match(view.cards[0].element.textContent, /伤害提升/);
  assert.match(view.cards[0].element.textContent, /\+20%/);
  assert.match(view.cards[0].element.textContent, /20/);
  assert.match(view.cards[0].element.textContent, /24/);
  assert.ok(descendants(view.cards[0].element, (node) => node.tagName === "SVG").length > 0);

  view.cards[0].element.dispatch("click");
  assert.equal(selected.length, 1);
  assert.equal(selected[0].choice, choices[0]);
  assert.equal(selected[0].card, view.cards[0]);
  view.cards[0].setState("selected");
  assert.equal(view.cards[0].element.dataset.state, "selected");
});

test("卡片控制器覆盖正常、hover、focus、pressed、selected、disabled 六种状态", () => {
  const f = fixture();
  const view = createU3UpgradeView(f.scene, {
    choices: upgrades("damage", "maxHealth", "attackSpeed"),
    onSelect() {}, onReroll() {}, onSkip() {}
  });
  const card = view.cards[0];
  for (const state of ["idle", "hover", "focus", "pressed", "selected", "disabled"]) {
    card.setState(state);
    assert.equal(card.element.dataset.state, state);
    assert.equal(card.element.disabled, state === "disabled");
  }
});

test("重抽刷新复用同一外壳、释放旧卡监听并更新剩余次数，封顶卡不可点击", () => {
  const f = fixture();
  const activations = [];
  const first = upgrades("damage", "maxHealth", "attackSpeed");
  const view = createU3UpgradeView(f.scene, {
    choices: first,
    onSelect: (choice) => activations.push(choice.key),
    onReroll() {}, onSkip() {}
  });
  const root = view.root;
  const oldCard = view.cards[0];
  f.scene.rerollsRemaining = 2;
  f.scene.weapons.pistol.cooldownMs = 80;
  const second = upgrades("projectileCount", "emergencyHeal", "attackSpeed");

  view.refresh(second);

  assert.equal(view.root, root);
  assert.equal(view.cards.length, 3);
  assert.match(view.reroll.element.textContent, /剩 2/);
  oldCard.element.dispatch("click");
  assert.deepEqual(activations, [], "已移除卡片不能保留交易监听");
  assert.equal(view.cards[2].element.disabled, true);
  assert.match(view.cards[2].element.textContent, /已达上限/);
  view.cards[2].element.dispatch("click");
  assert.deepEqual(activations, []);
});

test("销毁幂等并只清理自身 DOM 与监听，运行时同步失败通知 progression 回退", () => {
  const f = fixture();
  const unrelated = f.document.createElement("aside");
  f.document.body.appendChild(unrelated);
  const failures = [];
  const view = createU3UpgradeView(f.scene, {
    choices: upgrades("damage", "maxHealth", "attackSpeed"),
    onSelect() {}, onReroll() {}, onSkip() {},
    onFailure: (error) => failures.push(error.message)
  });
  view.root.remove();

  f.scene.game.events.emit("prerender");

  assert.deepEqual(failures, ["U3 overlay detached"]);
  assert.equal(unrelated.isConnected, true);
  assert.equal(f.scene.game.events.listenerCount("prerender"), 0);
  assert.doesNotThrow(() => { view.destroy(); view.destroy(); });
});
