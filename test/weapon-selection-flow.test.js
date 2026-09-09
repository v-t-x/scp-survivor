import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { TEXTURES } from "../src/assets/manifest.js";
import { menusMixin } from "../src/scene/menus.js";
import * as menus from "../src/scene/menus.js";
import * as armoryView from "../src/art/weaponSelectionView.js";

const menusPath = fileURLToPath(new URL("../src/scene/menus.js", import.meta.url));

function createMissionEntryScene() {
  const order = [];
  const calls = {
    initWeapons: 0,
    setupSpawning: 0,
    updateUI: 0,
    destroyWeaponSelectionScreen: 0
  };
  const scene = {
    selectedWeaponId: "pistol",
    pendingSelectedWeaponId: "pistol",
    isMissionActive: false,
    elapsedSurvivalMs: 91_000,
    powerOutageTriggered: true,
    bossWarningShown: true,
    regularSpawningActive: false,
    survivalPhaseEnded: true,
    medkitSpawned: true,
    bossPhaseActive: true,
    bossEnemy: { active: true },
    bossIntroTimer: { active: true },
    activeFacilityEvent: { type: "powerOutage" },
    activeFacilityEventEndAtMs: 92_000,
    cameras: { main: { setBackgroundColor() {} } },
    initWeapons() { calls.initWeapons += 1; order.push("initWeapons"); },
    syncCombatStatsFromWeapons() { order.push("syncCombatStatsFromWeapons"); },
    applyUnlockedPerks() { order.push("applyUnlockedPerks"); },
    setupSpawning() { calls.setupSpawning += 1; order.push("setupSpawning"); },
    setGameplayHudVisible(visible) { order.push(`setGameplayHudVisible:${visible}`); },
    updateUI() { calls.updateUI += 1; order.push("updateUI"); },
    destroyWeaponSelectionScreen() {
      calls.destroyWeaponSelectionScreen += 1;
      order.push("destroyWeaponSelectionScreen");
    }
  };
  return { scene, calls, order };
}

function missionSnapshot(scene) {
  return structuredClone({
    selectedWeaponId: scene.selectedWeaponId,
    pendingSelectedWeaponId: scene.pendingSelectedWeaponId,
    isMissionActive: scene.isMissionActive,
    elapsedSurvivalMs: scene.elapsedSurvivalMs,
    powerOutageTriggered: scene.powerOutageTriggered,
    bossWarningShown: scene.bossWarningShown,
    regularSpawningActive: scene.regularSpawningActive,
    survivalPhaseEnded: scene.survivalPhaseEnded,
    medkitSpawned: scene.medkitSpawned,
    bossPhaseActive: scene.bossPhaseActive,
    bossEnemy: scene.bossEnemy,
    bossIntroTimer: scene.bossIntroTimer,
    activeFacilityEvent: scene.activeFacilityEvent,
    activeFacilityEventEndAtMs: scene.activeFacilityEventEndAtMs
  });
}

test("invalid direct mission weapon ids preserve every mission field and skip all startup work", () => {
  for (const weaponId of ["shotgun", "unknown"]) {
    const { scene, calls } = createMissionEntryScene();
    const before = missionSnapshot(scene);

    const started = menusMixin.startMissionWithWeapon.call(scene, weaponId);

    assert.equal(started, false, `${weaponId} must not start a mission`);
    assert.deepEqual(missionSnapshot(scene), before);
    assert.deepEqual(calls, {
      initWeapons: 0,
      setupSpawning: 0,
      updateUI: 0,
      destroyWeaponSelectionScreen: 0
    });
  }
});

// Break caught: an allowlisted entry changing the established initialization
// ordering or failing to synchronize the selected and pending weapon ids.
test("allowlisted mission entry keeps the established startup order", () => {
  for (const weaponId of ["pistol", "tesla"]) {
    const { scene, order } = createMissionEntryScene();

    const started = menusMixin.startMissionWithWeapon.call(scene, weaponId);

    assert.equal(started, true);
    assert.deepEqual(order, [
      "initWeapons",
      "syncCombatStatsFromWeapons",
      "applyUnlockedPerks",
      "setupSpawning",
      "setGameplayHudVisible:true",
      "updateUI",
      "destroyWeaponSelectionScreen"
    ]);
    assert.equal(scene.selectedWeaponId, weaponId);
    assert.equal(scene.pendingSelectedWeaponId, weaponId);
  }
});

test("deploy forwards the one allowlisted pending selection exactly once", () => {
  assert.equal(typeof menus.createDeployCallback, "function");
  const calls = [];
  const scene = {
    pendingSelectedWeaponId: "tesla",
    startMissionWithWeapon(id) { calls.push(id); }
  };
  const deploy = menus.createDeployCallback(scene);
  deploy();
  assert.deepEqual(calls, ["tesla"]);
});

function makeSelectionObject(type, initial = {}) {
  return {
    type,
    active: true,
    visible: true,
    input: { enabled: false },
    handlers: new Map(),
    ...initial,
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setDisplaySize(width, height) { this.displaySize = [width, height]; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setShadow(...value) { this.shadow = value; return this; },
    setInteractive(options) { this.interactive = options; this.input ??= {}; this.input.enabled = true; return this; },
    disableInteractive() { if (this.input) this.input.enabled = false; return this; },
    removeInteractive() { this.input = null; return this; },
    removeAllListeners() { this.handlers.clear(); return this; },
    destroy() { this.destroyCalls = (this.destroyCalls ?? 0) + 1; this.active = false; return this; },
    setVisible(value) { this.visible = value; return this; },
    setTexture(textureKey) { this.textureKey = textureKey; return this; },
    setFillStyle(...value) { this.fill = value; return this; },
    setStrokeStyle(...value) { this.stroke = value; return this; },
    setStyle(value) { this.style = { ...this.style, ...value }; return this; },
    setText(value) { this.text = value; return this; },
    setColor(value) { this.color = value; return this; },
    on(event, handler) { this.handlers.set(event, handler); return this; },
    clear() { return this; },
    fillStyle() { return this; },
    fillRect() { return this; },
    lineStyle() { return this; },
    beginPath() { return this; },
    moveTo() { return this; },
    lineTo() { return this; },
    closePath() { return this; },
    fillPath() { return this; },
    strokePath() { return this; },
    fillCircle() { return this; },
    strokeCircle() { return this; },
    lineBetween() { return this; }
  };
}

function createArmoryScene({ pendingSelectedWeaponId = null, availableTextures = null } = {}) {
  const objects = [];
  const calls = { deploy: [], openStore: 0 };
  const add = (type, factory = () => ({})) => (...args) => {
    const object = makeSelectionObject(type, factory(...args));
    objects.push(object);
    return object;
  };
  const scene = {
    objects,
    meta: { credits: 0, perks: {} },
    pendingSelectedWeaponId,
    textures: { exists(key) { return availableTextures?.has(key) ?? true; } },
    cameras: { main: { setBackgroundColor() {} } },
    setGameplayHudVisible() {},
    openPerkStore() { calls.openStore += 1; },
    closePerkStore() {},
    startMissionWithWeapon(weaponId) { calls.deploy.push(weaponId); },
    add: {
      graphics: add("graphics"),
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
  scene.destroyWeaponSelectionScreen = menusMixin.destroyWeaponSelectionScreen;
  return { scene, calls };
}

test("weapon selection source composes the workbench without the retired dual-card geometry", async () => {
  const source = await readFile(menusPath, "utf8");
  assert.match(source, /ARMORY_WORKBENCH_LAYOUT/);
  assert.match(source, /createArmoryDetailView/);
  assert.doesNotMatch(source, /const slotWidth = 228/);
  assert.doesNotMatch(source, /const slotHeight = 316/);
  assert.doesNotMatch(source, /选择装备槽位，锁定后确认部署/);
});

test("zero-credit armory retains legacy selector and hero fallback when all U1 textures are absent", () => {
  const { scene, calls } = createArmoryScene({ availableTextures: new Set() });
  menusMixin.createWeaponSelectionScreen.call(scene);

  assert.equal(scene.weaponSelectCards.length, 2);
  const title = scene.objects.find((object) => object.type === "text" && object.text === "军械库");
  const siteCode = scene.objects.find((object) => object.type === "text" && object.text === "SITE-CN-03");
  assert.equal(title.style.fontSize, "28px");
  assert.equal(siteCode.style.fontSize, "12px");
  assert.equal(scene.weaponSelectStoreEntryController.label.text, "永久授权 0/4  >");
  assert.equal(scene.weaponSelectStoreEntryController.hitArea.input?.enabled, true);
  scene.weaponSelectStoreEntryController.hitArea.handlers.get("pointerup")();
  assert.equal(calls.openStore, 1);
  assert.equal(scene.startMissionButtonController.hitArea.input?.enabled === true, false);
  assert.equal(scene.startMissionButtonController.signal.visible, false);
  assert.equal(scene.startMissionButtonLabel.text, "部署");
  assert.equal(scene.armoryDetailController.heroImage.visible, false);
  const rawObjects = new Set(scene.weaponSelectUiObjects);
  for (const controller of [
    ...scene.weaponSelectCards.map(({ slot }) => slot),
    scene.armoryDetailController,
    scene.armoryDeploySymbolController,
    scene.weaponSelectStoreEntryController,
    scene.startMissionButtonController
  ]) {
    assert.ok(controller.objects.every((object) => !rawObjects.has(object)));
  }

  const tesla = scene.weaponSelectCards.find(({ id }) => id === "tesla");
  tesla.slot.hitArea.handlers.get("pointerdown")();

  assert.equal(scene.pendingSelectedWeaponId, "tesla");
  assert.equal(scene.startMissionButtonController.hitArea.input?.enabled, true);
  assert.equal(scene.startMissionButtonLabel.text, "开始任务");
  assert.equal(scene.armoryDetailController.heroImage.textureKey, TEXTURES.weaponTeslaIcon);
  scene.startMissionButtonController.hitArea.handlers.get("pointerup")();
  assert.deepEqual(calls.deploy, ["tesla"]);
});

// Break caught: an admitted U1 chassis or hero is not routed into the armory, or absent U1 art interrupts the existing selector/deploy flow.
test("armory routes admitted U1 chassis and heroes while retaining the old rack and selector flow on absence", () => {
  const admittedTextures = new Set([TEXTURES.u1ArmoryChassis, TEXTURES.u1RifleHero, TEXTURES.u1TeslaHero]);
  const admitted = createArmoryScene({ availableTextures: admittedTextures });
  menusMixin.createWeaponSelectionScreen.call(admitted.scene);
  const admittedChassis = admitted.scene.objects.find(({ type, textureKey }) => type === "image" && textureKey === TEXTURES.u1ArmoryChassis);
  assert.ok(admittedChassis, "production armory must render its resolved full-screen chassis");
  assert.deepEqual(admittedChassis.displaySize, [960, 540]);
  assert.equal(admitted.scene.objects.some(({ type, textureKey }) => type === "image" && textureKey === TEXTURES.armoryRackBackdrop), false);
  const admittedTesla = admitted.scene.weaponSelectCards.find(({ id }) => id === "tesla");
  assert.equal(admittedTesla.slot.icon.textureKey, TEXTURES.u1TeslaHero);
  admittedTesla.slot.hitArea.handlers.get("pointerdown")();
  assert.equal(admitted.scene.armoryDetailController.heroImage.textureKey, TEXTURES.u1TeslaHero);

  const admittedPistol = admitted.scene.weaponSelectCards.find(({ id }) => id === "pistol");
  admittedPistol.slot.hitArea.handlers.get("pointerdown")();
  assert.equal(admitted.scene.armoryDetailController.heroImage.textureKey, TEXTURES.u1RifleHero);

  const rifleMissing = createArmoryScene({ availableTextures: new Set([TEXTURES.u1ArmoryChassis, TEXTURES.u1TeslaHero]) });
  menusMixin.createWeaponSelectionScreen.call(rifleMissing.scene);
  rifleMissing.scene.weaponSelectCards.find(({ id }) => id === "pistol").slot.hitArea.handlers.get("pointerdown")();
  assert.equal(rifleMissing.scene.armoryDetailController.heroImage.textureKey, TEXTURES.weaponPistolIcon);

  const absent = createArmoryScene({ availableTextures: new Set() });
  assert.doesNotThrow(() => menusMixin.createWeaponSelectionScreen.call(absent.scene));
  const absentChassis = absent.scene.objects.find(({ type, textureKey }) => type === "image" && textureKey === TEXTURES.armoryRackBackdrop);
  assert.ok(absentChassis, "legacy rack remains available when U1 textures are absent");
  assert.equal(absent.scene.objects.some(({ type, textureKey }) => type === "image" && textureKey === TEXTURES.u1ArmoryChassis), false);
  const absentTesla = absent.scene.weaponSelectCards.find(({ id }) => id === "tesla");
  assert.equal(absentTesla.slot.icon.textureKey, TEXTURES.weaponTeslaIcon);
  absentTesla.slot.hitArea.handlers.get("pointerdown")();
  assert.equal(absent.scene.armoryDetailController.heroImage.textureKey, TEXTURES.weaponTeslaIcon);
  absent.scene.startMissionButtonController.hitArea.handlers.get("pointerup")();
  assert.deepEqual(absent.calls.deploy, ["tesla"]);
  menusMixin.destroyWeaponSelectionScreen.call(absent.scene);
  assert.ok(absent.scene.objects.every((object) => object.destroyCalls === 1));
});

test("failed formal selector images retry legacy icons without dismantling the armory", () => {
  const { scene, calls } = createArmoryScene();
  const addImage = scene.add.image.bind(scene.add);
  scene.add.image = (x, y, key) => {
    if ([TEXTURES.u1RifleHero, TEXTURES.u1TeslaHero].includes(key)) throw new Error('formal image failed');
    return addImage(x, y, key);
  };
  assert.doesNotThrow(() => menusMixin.createWeaponSelectionScreen.call(scene));
  assert.equal(scene.weaponSelectCards.length, 2);
  assert.equal(scene.weaponSelectCards[0].slot.icon.textureKey, TEXTURES.weaponPistolIcon);
  const tesla = scene.weaponSelectCards.find(({ id }) => id === 'tesla');
  assert.equal(tesla.slot.icon.textureKey, TEXTURES.weaponTeslaIcon);
  tesla.slot.hitArea.handlers.get('pointerdown')();
  scene.startMissionButtonController.hitArea.handlers.get('pointerup')();
  assert.deepEqual(calls.deploy, ['tesla']);
  menusMixin.destroyWeaponSelectionScreen.call(scene);
  assert.ok(scene.objects.every(object => object.destroyCalls === 1));
});

test("optional detail and deploy-symbol failures preserve selectors, authorization, and deploy", () => {
  for (const failureMode of ["detail", "symbol", "both"]) {
    const { scene, calls } = createArmoryScene({ availableTextures: new Set() });
    const detailFactories = failureMode === "detail" || failureMode === "both"
      ? { createProduction() { throw new Error("detail failed"); } }
      : {};
    const deploySymbolFactories = failureMode === "symbol" || failureMode === "both"
      ? { createProduction() { throw new Error("symbol failed"); } }
      : {};

    menusMixin.createWeaponSelectionScreen.call(scene, {
      detailFactories,
      deploySymbolFactories
    });

    assert.equal(scene.weaponSelectCards.length, 2, failureMode);
    assert.equal(scene.weaponSelectStoreEntryController.hitArea.input?.enabled, true, failureMode);
    assert.ok(scene.startMissionButtonController, failureMode);
    if (failureMode === "detail" || failureMode === "both") {
      assert.equal(scene.armoryDetailController, null);
    } else {
      assert.ok(scene.armoryDetailController);
    }
    if (failureMode === "symbol" || failureMode === "both") {
      assert.equal(scene.armoryDeploySymbolController, null);
    } else {
      assert.ok(scene.armoryDeploySymbolController);
    }
    const tesla = scene.weaponSelectCards.find(({ id }) => id === "tesla");
    tesla.slot.hitArea.handlers.get("pointerdown")();
    assert.equal(scene.startMissionButtonController.hitArea.input?.enabled, true, failureMode);
    scene.startMissionButtonController.hitArea.handlers.get("pointerup")();
    assert.deepEqual(calls.deploy, ["tesla"], failureMode);
  }
});

test("double authorization fallback failure leaves slots and deploy active at zero credits, then two teardown rounds leak nothing", () => {
  assert.equal(typeof menus.createArmoryAuthorizationEntryWithFallback, "function");
  const { scene } = createArmoryScene();
  menusMixin.createWeaponSelectionScreen.call(scene, {
    authorizationFactories: {
      createProduction() { throw new Error("production failed"); },
      createLegacy() { throw new Error("legacy failed"); }
    }
  });

  assert.equal(scene.weaponSelectCards.length, 2);
  assert.equal(scene.weaponSelectStoreEntryController, null);
  for (const { slot } of scene.weaponSelectCards) {
    assert.ok(slot.objects.every((object) => object.active));
  }
  assert.ok(scene.startMissionButtonController.objects.every((object) => object.active));

  menusMixin.destroyWeaponSelectionScreen.call(scene);
  menusMixin.createWeaponSelectionScreen.call(scene);
  menusMixin.destroyWeaponSelectionScreen.call(scene);
  for (const object of scene.objects) {
    assert.equal(object.active, false);
    assert.equal(object.handlers.size, 0);
    assert.equal(object.destroyCalls, 1);
  }
});

test("slot listener, second slot, and deploy construction failures roll back every owned object once", () => {
  for (const failureMode of ["slot-listener", "second-slot", "deploy"]) {
    const { scene } = createArmoryScene();
    let slotCalls = 0;
    assert.throws(() => menusMixin.createWeaponSelectionScreen.call(scene, {
      createSlot(target, options) {
        slotCalls += 1;
        if (failureMode === "second-slot" && slotCalls === 2) {
          throw new Error("second slot failed");
        }
        const slot = armoryView.createArmorySlot(target, options);
        if (failureMode === "slot-listener" && slotCalls === 1) {
          slot.hitArea.on = () => { throw new Error("slot listener failed"); };
        }
        return slot;
      },
      createDeployButton(target, options) {
        if (failureMode === "deploy") throw new Error("deploy failed");
        return menus.createArmoryDeployButtonForTest?.(target, options);
      }
    }), new RegExp({
      "slot-listener": "slot listener failed",
      "second-slot": "second slot failed",
      deploy: "deploy failed"
    }[failureMode]));

    assert.ok(scene.objects.length > 0, failureMode);
    for (const object of scene.objects) {
      assert.equal(object.active, false, `${failureMode}:${object.type}:active`);
      assert.equal(object.handlers.size, 0, `${failureMode}:${object.type}:handlers`);
      assert.equal(object.input, null, `${failureMode}:${object.type}:input`);
      assert.equal(object.destroyCalls, 1, `${failureMode}:${object.type}:destroy`);
    }
  }
});
