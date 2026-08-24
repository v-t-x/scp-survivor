import test from "node:test";
import assert from "node:assert/strict";
import { BALANCE } from "../src/config/balance.js";
import { menusMixin } from "../src/scene/menus.js";
import { getHudPresentation } from "../src/ui/hudPresentation.js";

function makeDisplayObject(type, initial = {}) {
  return {
    type,
    active: true,
    visible: true,
    handlers: new Map(),
    ...initial,
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setDisplaySize(width, height) { this.displaySize = [width, height]; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setShadow(...value) { this.shadow = value; return this; },
    setInteractive(options) { this.interactive = options; return this; },
    disableInteractive() { this.interactive = false; return this; },
    setVisible(value) { this.visible = value; return this; },
    setFillStyle(...value) { this.fill = value; return this; },
    setStrokeStyle(...value) { this.stroke = value; return this; },
    setStyle(value) { this.style = { ...this.style, ...value }; return this; },
    setText(value) { this.text = value; return this; },
    on(event, handler) { this.handlers.set(event, handler); return this; },
    clear() { return this; },
    fillStyle() { return this; },
    lineStyle() { return this; },
    beginPath() { return this; },
    moveTo() { return this; },
    lineTo() { return this; },
    closePath() { return this; },
    fillPath() { return this; },
    strokePath() { return this; },
    fillCircle() { return this; },
    strokeCircle() { return this; }
  };
}

function createWeaponSelectionScene() {
  const objects = [];
  const add = (type, factory) => (...args) => {
    const object = makeDisplayObject(type, factory(...args));
    objects.push(object);
    return object;
  };
  const scene = {
    objects,
    meta: { credits: 0 },
    pendingSelectedWeaponId: null,
    cameras: { main: { setBackgroundColor() {} } },
    setGameplayHudVisible() {},
    add: {
      graphics: add("graphics", () => ({})),
      image: add("image", (x, y, textureKey) => ({ x, y, textureKey })),
      text: add("text", (x, y, text, style) => ({ x, y, text, style })),
      circle: add("circle", (x, y, radius, fill, alpha) => ({ x, y, radius, fill, alpha })),
      rectangle: add("rectangle", (x, y, width, height, fill, alpha) => ({
        x,
        y,
        width,
        height,
        fill,
        alpha
      }))
    }
  };
  scene.refreshWeaponSelectionVisuals = menusMixin.refreshWeaponSelectionVisuals;
  return scene;
}

function weaponHud(weapon) {
  return getHudPresentation({
    isMissionActive: true,
    selectedWeaponId: weapon.id,
    weapon,
    elapsedSurvivalMs: 1_000,
    health: 100,
    maxHealth: 100,
    currentXp: 0,
    xpToNextLevel: 8,
    dashReadyAtMs: 0,
    dashCooldownMs: 2_200
  }).weapon;
}

test("weapon selection describes Tesla as 6 damage per 300 ms channel tick while rifle stats stay unchanged", () => {
  const scene = createWeaponSelectionScene();

  menusMixin.createWeaponSelectionScreen.call(scene);

  const teslaStats = scene.weaponSelectCards.find(({ id }) => id === "tesla").slot.objects[4].text;
  const rifleStats = scene.weaponSelectCards.find(({ id }) => id === "pistol").slot.objects[4].text;
  assert.match(teslaStats, /每跳伤害\s+6(?:\.0)?/);
  assert.match(teslaStats, /伤害间隔\s+300 ms/);
  assert.doesNotMatch(teslaStats, /冷却/);
  assert.equal(rifleStats, [
    `伤害  ${BALANCE.weapons.pistol.baseDamage}`,
    `冷却  ${BALANCE.weapons.pistol.baseCooldownMs} ms`,
    `射程  ${BALANCE.weapons.pistol.range}`
  ].join("\n"));
});

test("Tesla field configuration preserves the historical 8-damage pulse after the 6-damage channel change", () => {
  const fieldPulseDamage = Math.max(
    1,
    Math.round(
      BALANCE.weapons.tesla.baseDamage * BALANCE.weaponUpgrades.teslaFieldDamageMultiplier
    )
  );

  assert.equal(BALANCE.weapons.tesla.baseDamage, 6);
  assert.equal(fieldPulseDamage, 8);
});

test("active Tesla HUD reports continuous shock and its 300 ms tick instead of ready or cooldown", () => {
  const view = weaponHud({
    id: "tesla",
    name: "特斯拉收容发射器",
    currentLevel: 1,
    damage: 6,
    chainTargets: 3,
    cooldownMs: 300,
    isChanneling: true,
    nextAttackAtMs: 1_300
  });

  assert.equal(view.statusText, "持续电击中 · 300ms/跳");
  assert.doesNotMatch(view.statusText, /冷却|就绪/);
});

test("idle Tesla HUD clearly waits for a target while retaining its 300 ms tick rate", () => {
  const view = weaponHud({
    id: "tesla",
    name: "特斯拉收容发射器",
    currentLevel: 1,
    damage: 6,
    chainTargets: 3,
    cooldownMs: 300,
    isChanneling: false,
    nextAttackAtMs: 0
  });

  assert.equal(view.statusText, "等待锁定 · 300ms/跳");
  assert.doesNotMatch(view.statusText, /冷却|就绪/);
});

test("Tesla HUD distinguishes missing channel state from explicit idle and active state", () => {
  const baseWeapon = {
    id: "tesla",
    name: "特斯拉收容发射器",
    currentLevel: 1,
    damage: 6,
    chainTargets: 3,
    cooldownMs: 300,
    nextAttackAtMs: 1_300
  };

  assert.equal(weaponHud(baseWeapon).statusText, "电击就绪 · 300ms/跳");
  assert.equal(weaponHud({ ...baseWeapon, isChanneling: false }).statusText, "等待锁定 · 300ms/跳");
  assert.equal(weaponHud({ ...baseWeapon, isChanneling: true }).statusText, "持续电击中 · 300ms/跳");
});

test("rifle HUD keeps its existing damage detail and rate presentation", () => {
  const view = weaponHud({
    id: "pistol",
    name: "基金会收容突击步枪",
    currentLevel: 2,
    damage: 24,
    cooldownMs: 280,
    nextAttackAtMs: 1_200
  });

  assert.equal(view.detail, "等级 2 · 伤害 24.0");
  assert.equal(view.statusText, "射速 3.57/秒");
  assert.equal(view.statusTone, "contained");
});
