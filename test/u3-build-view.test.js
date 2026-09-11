import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";

let createU3BuildView = () => null;
try {
  ({ createU3BuildView } = await import("../src/ui/u3BuildView.js"));
} catch {
  // RED state: the DOM view export and illustration dependency are implemented next.
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.className = "";
    this.dataset = {};
    this.style = { setProperty(name, value) { this[name] = value; } };
    this._textContent = "";
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  appendChild(child) {
    child.remove?.();
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  replaceChildren(...children) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...children);
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }
  remove() { this.parentNode?.removeChild(this); }
  focus() { this.ownerDocument.activeElement = this; }
  get isConnected() {
    for (let node = this; node; node = node.parentNode) {
      if (node === this.ownerDocument.body) return true;
    }
    return false;
  }
  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent).join("");
  }
  set textContent(value) {
    this.replaceChildren();
    this._textContent = String(value ?? "");
  }
}

class FakeDocument {
  constructor() { this.body = new FakeElement("body", this); this.activeElement = null; }
  createElement(tagName) { return new FakeElement(tagName, this); }
  createElementNS(_namespace, tagName) { return new FakeElement(tagName, this); }
}

function descendants(node) {
  return [node, ...node.children.flatMap(descendants)];
}

function hasClass(node, className) {
  return String(node.className).split(/\s+/).includes(className);
}

function createScene() {
  const document = new FakeDocument();
  const renderEvents = new EventEmitter();
  const scene = {
    game: {
      canvas: {
        ownerDocument: document,
        getBoundingClientRect: () => ({ left: 12, top: 18, width: 960, height: 540 })
      },
      events: renderEvents
    },
    events: new EventEmitter(),
    selectedWeaponId: "pistol",
    health: 87,
    maxHealth: 140,
    playerMoveSpeed: 242,
    pickupRadius: 70,
    projectileCount: 3,
    bulletPenetration: 2,
    weapons: {
      pistol: {
        id: "pistol", name: "基金会收容突击步枪", unlocked: true,
        currentLevel: 9, damage: 34.56, cooldownMs: 166.4, range: 640
      },
      shotgun: {
        id: "shotgun", name: "基金会收容突破器", unlocked: true,
        currentLevel: 99, damage: 999, cooldownMs: 1
      },
      tesla: {
        id: "tesla", name: "特斯拉收容发射器", unlocked: false,
        currentLevel: 0, damage: 6, cooldownMs: 300, range: 320, chainTargets: 3
      }
    },
    upgradeLevels: Object.fromEntries(UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])),
    weaponMutations: { pistolBoomerang: true, breacherExplosive: true, teslaField: false }
  };
  scene.upgradeLevels.damage = 7;
  scene.upgradeLevels.moveSpeed = 12;
  return { scene, document, renderEvents };
}

function gameplaySnapshot(scene) {
  return structuredClone({
    selectedWeaponId: scene.selectedWeaponId,
    health: scene.health,
    maxHealth: scene.maxHealth,
    playerMoveSpeed: scene.playerMoveSpeed,
    pickupRadius: scene.pickupRadius,
    projectileCount: scene.projectileCount,
    bulletPenetration: scene.bulletPenetration,
    weapons: scene.weapons,
    upgradeLevels: scene.upgradeLevels,
    weaponMutations: scene.weaponMutations
  });
}

test("U3 build view renders a complete scrollable terminal without mutating gameplay", () => {
  const { scene, document } = createScene();
  const before = gameplaySnapshot(scene);

  const controller = createU3BuildView(scene);

  assert.equal(controller.mode, "u3");
  assert.equal(controller.container.visible, false);
  assert.equal(document.body.children.length, 1);
  const nodes = descendants(controller.root);
  const text = controller.root.textContent;
  for (const required of [
    "当前构筑", "主武器", "基金会收容突击步枪", "特斯拉收容发射器",
    "武器总等级 9", "未解锁", "已有强化", "强化 7 次", "行动员状态",
    "当前生命", "87 / 140", "异常突变", "回旋弹", "已激活", "常驻电场", "未激活"
  ]) assert.equal(text.includes(required), true, `missing ${required}`);
  assert.equal(text.includes("突破器"), false);
  assert.equal(nodes.some((node) => hasClass(node, "u3-build-scroll")), true);
  assert.equal(nodes.some((node) => hasClass(node, "u3-build-scroll-cue")), true);
  assert.equal(nodes.some((node) => hasClass(node, "is-inactive")), true);
  const primaryWeapons = nodes.filter((node) => hasClass(node, "is-primary"));
  assert.equal(primaryWeapons.length, 1);
  assert.equal(primaryWeapons[0].textContent.includes("基金会收容突击步枪"), true);
  assert.equal(primaryWeapons[0].textContent.includes("34.6"), true);

  const scroll = nodes.find((node) => hasClass(node, "u3-build-scroll"));
  scroll.scrollTop = 137;
  scroll.focus();
  controller.update();
  const afterNoChange = descendants(controller.root).find((node) => hasClass(node, "u3-build-scroll"));
  assert.equal(afterNoChange === scroll, true, "frame updates must not rebuild unchanged content");
  assert.equal(afterNoChange.scrollTop, 137);
  assert.equal(document.activeElement === afterNoChange, true);
  const operator = nodes.find((node) => hasClass(node, "u3-build-operator"));
  assert.equal(descendants(scroll).includes(operator), false, "operator status stays fixed below upgrade scroll");
  assert.equal(nodes.filter((node) => hasClass(node, "is-secondary")).length, 1);
  const weaponList = nodes.find((node) => hasClass(node, "u3-build-weapons"));
  assert.equal(hasClass(weaponList, "u3-scroll"), true, "weapon list must scroll instead of clipping");
  const secondary = nodes.find((node) => hasClass(node, "is-secondary"));
  assert.equal(
    secondary.textContent.includes("每跳 6.0 · 间隔 300 ms · 链击 3 · 范围 320 px"),
    true,
    "secondary weapon keeps every real value in its compact summary"
  );
  assert.equal(text.includes("触发射程 640 px"), true);
  assert.equal(text.includes("半径 130 px"), true);
  assert.equal(text.includes("周期 600 ms"), true);
  assert.equal(text.includes("当前脉冲伤害 8"), true);
  assert.deepEqual(gameplaySnapshot(scene), before);
});

test("U3 build view keeps every late-run row available and updates in place", () => {
  const { scene, document } = createScene();
  for (const upgrade of UPGRADE_DEFINITIONS) scene.upgradeLevels[upgrade.key] = 27;
  const controller = createU3BuildView(scene);
  const originalRoot = controller.root;
  const originalScroll = descendants(controller.root).find((node) => hasClass(node, "u3-build-scroll"));
  originalScroll.scrollTop = 151;
  originalScroll.focus();

  scene.weapons.tesla.unlocked = true;
  scene.selectedWeaponId = "tesla";
  scene.weapons.tesla.currentLevel = 14;
  scene.weaponMutations.teslaField = true;
  controller.update();

  assert.equal(controller.root, originalRoot);
  assert.equal(document.body.children.length, 1);
  const text = controller.root.textContent;
  for (const upgrade of UPGRADE_DEFINITIONS.filter(
    ({ weaponId }) => weaponId !== "shotgun"
  )) assert.equal(text.includes(upgrade.name), true, `lost late-run row ${upgrade.key}`);
  assert.equal(text.includes("武器总等级 14"), true);
  assert.equal(text.includes("强化 27 次"), true);
  assert.equal(text.includes("常驻电场已激活"), true);
  const primaryWeapons = descendants(controller.root).filter((node) => hasClass(node, "is-primary"));
  assert.equal(primaryWeapons.length, 1);
  assert.equal(primaryWeapons[0].textContent.includes("特斯拉收容发射器"), true);
  const updatedScroll = descendants(controller.root).find((node) => hasClass(node, "u3-build-scroll"));
  assert.notEqual(updatedScroll, originalScroll);
  assert.equal(updatedScroll.scrollTop, 151);
  assert.equal(document.activeElement === updatedScroll, true);

  // The Scene's Tab toggle path calls buildPanel/container directly.
  controller.container.setVisible(true);
  assert.equal(controller.container.visible, true);
  controller.destroy();
  controller.destroy();
  assert.equal(controller.container.visible, false);
  assert.equal(document.body.children.length, 0);
});

test("U3 build view promotes applied upgrades and groups operator health into three glyph cells", () => {
  const { scene } = createScene();
  for (const upgrade of UPGRADE_DEFINITIONS) scene.upgradeLevels[upgrade.key] = 0;
  scene.upgradeLevels.pickupRadius = 2;
  scene.upgradeLevels.teslaCooldown = 3;

  const controller = createU3BuildView(scene);
  const nodes = descendants(controller.root);
  const rows = nodes.filter((node) => hasClass(node, "u3-build-upgrade"));
  const genericRows = rows.filter((node) => [
    "moveSpeed", "maxHealth", "pickupRadius", "emergencyHeal"
  ].includes(node.dataset.upgradeKey));
  const protocolRows = rows.filter((node) => !genericRows.includes(node));

  assert.equal(genericRows[0].dataset.upgradeKey, "pickupRadius");
  assert.equal(protocolRows[0].dataset.upgradeKey, "teslaCooldown");
  assert.equal(
    rows.every((row) => descendants(row).some((node) => hasClass(node, "u3-build-upgrade-icon"))),
    true
  );
  assert.equal(
    rows.every((row) => descendants(row).some((node) => node.getAttribute?.("class")?.includes("u3-glyph"))),
    true,
    "compact upgrade modules use the dedicated square glyph artwork"
  );
  assert.equal(
    rows.every((row) => descendants(row).some((node) => hasClass(node, "u3-build-upgrade-heading"))),
    true,
    "each upgrade card has a dedicated name and count line"
  );
  assert.equal(
    rows.every((row) => descendants(row).some((node) => hasClass(node, "u3-build-upgrade-reading"))),
    true,
    "each upgrade card has a separate real-value line"
  );
  const pickupRow = rows.find((row) => row.dataset.upgradeKey === "pickupRadius");
  const pickupReading = descendants(pickupRow).find((node) => hasClass(node, "u3-build-upgrade-reading"));
  assert.equal(pickupReading.textContent.includes("行动员 / 通用强化"), true);
  assert.equal(pickupReading.textContent.includes("70 px"), true);
  const operatorCells = nodes.filter((node) => hasClass(node, "u3-build-operator-cell"));
  assert.equal(operatorCells.length, 3);
  assert.equal(operatorCells[0].textContent.includes("当前生命"), true);
  assert.equal(operatorCells[0].textContent.includes("87 / 140"), true);
  assert.equal(
    operatorCells.some((cell) => cell.textContent.includes("生命上限")),
    false,
    "health and maximum health belong in one complete readout"
  );
  assert.equal(
    operatorCells.every((cell) => descendants(cell).some((node) => hasClass(node, "u3-build-operator-icon"))),
    true
  );
  assert.equal(
    operatorCells.every((cell) => descendants(cell).some((node) => node.getAttribute?.("class")?.includes("u3-glyph"))),
    true,
    "operator cells use square glyphs rather than compressed technical diagrams"
  );
});

test("U3 build view returns null when native DOM overlay is unavailable", () => {
  assert.equal(createU3BuildView({ game: {}, events: new EventEmitter() }), null);
});

test("U3 build view reports requested visibility when its live DOM detaches", () => {
  const { scene, renderEvents } = createScene();
  let failureDetail = null;
  const controller = createU3BuildView(scene, {
    onFailure(_error, detail) { failureDetail = detail; }
  });
  controller.container.setVisible(true);
  controller.root.remove();

  renderEvents.emit("prerender");

  assert.deepEqual(failureDetail, { visible: true });
  assert.equal(controller.container.visible, false);
});
