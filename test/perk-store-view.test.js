import test from "node:test";
import assert from "node:assert/strict";
import {
  createLegacyPerkStoreView,
  createPerkStoreView,
  createPerkStoreWithFallback,
  PERK_STORE_LAYOUT
} from "../src/art/perkStoreView.js";
import { getPerkStorePresentation } from "../src/ui/stage1MenuPresentation.js";
import { createTerminalButton } from "../src/ui/tacticalUi.js";
import { THEME } from "../src/ui/theme.js";
import { TEXTURES } from "../src/assets/manifest.js";

function createEventEmitter(target = {}) {
  const handlers = new Map();
  Object.assign(target, {
    on(event, handler, context) {
      handlers.set(event, [...(handlers.get(event) ?? []), { handler, context }]);
      return this;
    },
    emit(event, ...args) {
      for (const { handler, context } of [...(handlers.get(event) ?? [])]) {
        handler.apply(context ?? this, args);
      }
      return this;
    },
    removeAllListeners(event) {
      if (event === undefined) handlers.clear();
      else handlers.delete(event);
      return this;
    }
  });
  Object.defineProperty(target, "listenerCount", {
    get: () => [...handlers.values()].reduce((count, entries) => count + entries.length, 0)
  });
  return target;
}

function createDisplayObject(scene, type, properties = {}) {
  const object = createEventEmitter({
    type,
    active: true,
    destroyed: false,
    destroyCalls: 0,
    visible: true,
    input: null,
    calls: [],
    ...properties,
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setTint(value) { this.tint = value; return this; },
    setVisible(value) { this.visible = value === true; return this; },
    setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
    setTexture(textureKey) { this.textureKey = textureKey; return this; },
    setFrame(frame) { this.frame = frame; return this; },
    setFillStyle(...args) { this.calls.push(["setFillStyle", ...args]); return this; },
    setStrokeStyle(...args) { this.calls.push(["setStrokeStyle", ...args]); return this; },
    setStyle(style) { this.style = { ...this.style, ...style }; return this; },
    setColor(color) { this.style = { ...this.style, color }; return this; },
    setText(text) { this.text = String(text ?? ""); return this; },
    setInteractive(options) {
      if (!this.input) this.input = { enabled: true };
      this.input.enabled = true;
      this.interactiveOptions = options;
      return this;
    },
    disableInteractive() { if (this.input) this.input.enabled = false; return this; },
    removeInteractive() { this.input = null; return this; },
    add(children) {
      this.children ??= [];
      for (const child of Array.isArray(children) ? children : [children]) {
        child.parentContainer = this;
        this.children.push(child);
      }
      return this;
    },
    clear() { this.calls.push(["clear"]); return this; },
    fillStyle(...args) { this.calls.push(["fillStyle", ...args]); return this; },
    lineStyle(...args) { this.calls.push(["lineStyle", ...args]); return this; },
    beginPath() { this.calls.push(["beginPath"]); return this; },
    moveTo(...args) { this.calls.push(["moveTo", ...args]); return this; },
    lineTo(...args) { this.calls.push(["lineTo", ...args]); return this; },
    closePath() { this.calls.push(["closePath"]); return this; },
    fillPath() { this.calls.push(["fillPath"]); return this; },
    strokePath() { this.calls.push(["strokePath"]); return this; },
    fillCircle(...args) { this.calls.push(["fillCircle", ...args]); return this; },
    strokeCircle(...args) { this.calls.push(["strokeCircle", ...args]); return this; },
    fillRect(...args) { this.calls.push(["fillRect", ...args]); return this; },
    strokeRect(...args) { this.calls.push(["strokeRect", ...args]); return this; },
    lineBetween(...args) { this.calls.push(["lineBetween", ...args]); return this; },
    destroy() {
      this.destroyCalls += 1;
      this.destroyed = true;
      this.active = false;
      if (this.input) this.input.enabled = false;
      scene.destroyedOrder.push(this);
      return this;
    }
  });
  scene.created.all.push(object);
  if (type === "rectangle") scene.created.rectangles.push(object);
  return object;
}

function createUiScene({ width, height }) {
  const scene = {
    created: { all: [], rectangles: [], images: [] },
    destroyedOrder: [],
    faults: { completed: [] },
    scale: { width, height },
    cameras: { main: { width, height } },
    textures: { exists() { return true; } },
    throwOnceOnCreate(occurrence) {
      if (!Number.isInteger(occurrence) || occurrence < 1) {
        throw new RangeError("fault occurrence must be a positive integer");
      }
      this.scopedFault = { remaining: occurrence, startIndex: this.created.all.length };
    }
  };
  const make = (type, factory) => (...args) => {
    const fault = scene.scopedFault;
    if (fault) {
      fault.remaining -= 1;
      if (fault.remaining === 0) {
        scene.scopedFault = null;
        scene.faults.completed.push({ objects: scene.created.all.slice(fault.startIndex) });
        throw new Error(`scene add failed: ${type}`);
      }
    }
    return factory(...args);
  };
  scene.add = {
    container: make("container", (x, y) => createDisplayObject(scene, "container", { x, y })),
    graphics: make("graphics", () => createDisplayObject(scene, "graphics")),
    image: make("image", (x, y, textureKey, frame) => {
      const image = createDisplayObject(scene, "image", { x, y, textureKey, frame });
      scene.created.images.push(image);
      return image;
    }),
    rectangle: make("rectangle", (x, y, objectWidth, objectHeight, fill, alpha) => createDisplayObject(
      scene,
      "rectangle",
      { x, y, width: objectWidth, height: objectHeight, fill, alpha }
    )),
    text: make("text", (x, y, text, style) => createDisplayObject(scene, "text", {
      x, y, text: String(text ?? ""), style: { ...style }
    })),
    tileSprite: make("tileSprite", (x, y, objectWidth, objectHeight, textureKey) => createDisplayObject(
      scene,
      "tileSprite",
      { x, y, width: objectWidth, height: objectHeight, textureKey }
    ))
  };
  scene.tweens = {
    add(config) {
      return { config, removed: false, remove() { this.removed = true; } };
    }
  };
  return scene;
}

function textCopies(controller) {
  return controller.objects
    .filter(({ type }) => type === "text")
    .map(({ text }) => text);
}

test('formal store uses one column grid and embeds live actions at the bottom of each material card', () => {
  const scene = createUiScene({ width: 960, height: 540 });
  const view = createPerkStoreView(scene, { presentation: getPerkStorePresentation({ credits: 150, perks: { startMaxHealth: true } }) });
  const [owned, available, insufficient] = view.rows;
  assert.equal(available.nameText.x - owned.nameText.x, available.icon.x - owned.icon.x);
  assert.equal(available.statePart.x - owned.statePart.x, available.icon.x - owned.icon.x);
  assert.ok(available.nameText.y >= 136 && available.nameText.y <= 148);
  assert.equal(available.action.label.x, available.action.hitArea.x);
  assert.deepEqual(available.action.label.origin, [0.5, 0.5]);
  assert.equal(available.detailsText.visible, false, 'purchase price must not be repeated above its action');
  assert.equal(insufficient.detailsText.visible, true);
  assert.ok(insufficient.detailsText.y > insufficient.descriptionText.y + 36);
  assert.equal(owned.stampText.angle, -10, 'ink rotates with the authored stamp border');
  assert.equal(owned.stampText.y, owned.stampPart.y);
  assert.ok(owned.stampText.y <= owned.action.hitArea.y - 4, 'stamp must clear the bottom card lip');
  assert.ok(Number.parseInt(available.descriptionText.style.fontSize) >= 14);
  assert.ok(Number.parseInt(insufficient.detailsText.style.fontSize) >= 14);
  assert.equal(view.footer.label.origin[0], 0.5);
});

test('visible purchase face responds to hover and press without moving its hit area or activating early', () => {
  const ui = createUiScene({ width: 960, height: 540 });
  const purchases = [];
  const view = createPerkStoreView(ui, {
    presentation: getPerkStorePresentation({ credits: 150, perks: {} }),
    onPurchase: key => purchases.push(key)
  });
  const card = view.rows[0];
  const { hitArea, label } = card.action;
  const original = { x: hitArea.x, y: hitArea.y, faceY: card.actionPart.y, labelY: label.y };
  const restingTint = card.actionPart.tint;
  assert.ok(Number.isInteger(restingTint) && restingTint < 0xffffff, 'resting metal is subdued');
  hitArea.emit('pointerover');
  assert.notEqual(card.actionPart.tint, restingTint, 'the visible atlas face must change, not a hidden fallback');
  const hoverTint = card.actionPart.tint;
  hitArea.emit('pointerdown');
  assert.notEqual(card.actionPart.tint, hoverTint);
  assert.equal(card.actionPart.y, original.faceY + 1);
  assert.equal(label.y, original.labelY + 1);
  assert.deepEqual(purchases, []);
  assert.deepEqual({ x: hitArea.x, y: hitArea.y }, { x: original.x, y: original.y });
  hitArea.emit('pointerout');
  assert.equal(card.actionPart.tint, restingTint);
  assert.equal(card.actionPart.y, original.faceY);
  hitArea.emit('pointerover');
  hitArea.emit('pointerdown');
  hitArea.emit('pointerupoutside');
  assert.equal(card.actionPart.tint, restingTint);
  assert.equal(label.y, original.labelY);
  assert.deepEqual(purchases, []);
  hitArea.emit('pointerover');
  hitArea.emit('pointerdown');
  hitArea.emit('pointerup');
  assert.deepEqual(purchases, ['startMaxHealth']);
  assert.equal(label.y, original.labelY);
  hitArea.emit('pointerdown');
  view.refresh(getPerkStorePresentation({ credits: 0, perks: { startMaxHealth: true } }));
  assert.equal(label.y, original.labelY, 'refresh cancels a held press');
  assert.equal(card.actionPart.y, original.faceY);
  const disabledTint = card.actionPart.tint;
  for (const event of ['pointerover', 'pointerdown', 'pointerup']) hitArea.emit(event);
  assert.equal(card.actionPart.tint, disabledTint);
  assert.equal(card.actionPart.visible, false);
  assert.deepEqual(purchases, ['startMaxHealth']);
  view.destroy();
  for (const event of ['pointerover', 'pointerdown', 'pointerup']) hitArea.emit(event);
  assert.deepEqual(purchases, ['startMaxHealth']);
  assert.equal(hitArea.listenerCount, 0);
});

test('purchase feedback remains on the visible fallback without reviving retired atlas parts', () => {
  for (const mode of ['missing', 'retired']) {
    const ui = createUiScene({ width: 960, height: 540 });
    if (mode === 'missing') ui.textures.exists = key => key !== TEXTURES.u1StateParts;
    let purchases = 0;
    const view = createPerkStoreView(ui, {
      presentation: getPerkStorePresentation({ credits: 150, perks: {} }),
      onPurchase: () => purchases++
    });
    const card = view.rows[0];
    if (mode === 'retired') {
      card.statePart.setFrame = () => { throw new Error('lost atlas frame'); };
      view.refresh(getPerkStorePresentation({ credits: 150, perks: {} }));
    }
    assert.equal(card.action.frame.visible, true);
    const beforeHover = card.action.frame.calls.length;
    card.action.hitArea.emit('pointerover');
    assert.ok(card.action.frame.calls.slice(beforeHover).some(([op, width]) => op === 'lineStyle' && width === 2));
    const restingY = card.action.label.y;
    card.action.hitArea.emit('pointerdown');
    assert.equal(card.action.label.y, restingY + 1);
    assert.equal(purchases, 0);
    card.action.hitArea.emit('pointerup');
    assert.equal(card.action.label.y, restingY);
    assert.equal(purchases, 1);
    assert.ok([card.statePart, card.actionPart, card.stampPart, card.lampPart].every(part => !part || !part.visible));
    card.action.hitArea.emit('pointerdown');
    view.destroy();
    card.action.hitArea.emit('pointerup');
    assert.equal(purchases, 1);
    assert.equal(card.action.hitArea.listenerCount, 0);
  }
});

function createProductionFaultDependencies(scene, terminalButton) {
  let actionCount = 0;
  return {
    createAction(nextScene, options) {
      actionCount += 1;
      if (actionCount === 2) scene.throwOnceOnCreate(2);
      return terminalButton(nextScene, options);
    }
  };
}

function createLegacyFaultDependencies(scene) {
  let armed = false;
  const arm = () => {
    if (!armed) {
      armed = true;
      scene.throwOnceOnCreate(3);
    }
  };
  return {
    addRectangle(...args) {
      arm();
      return scene.add.rectangle(...args);
    },
    addText(...args) {
      arm();
      return scene.add.text(...args);
    }
  };
}

// Break caught: the store regressing to the old four-row terminal instead of
// the approved full-screen 2x2 quartermaster composition.
test("missing chassis uses complete procedural controls even when the state atlas is available", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = key => key !== TEXTURES.u1QuartermasterChassis;
  const bought = [];
  const view = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 150, perks: {} }),
    onPurchase: key => bought.push(key)
  });
  const row = view.rows[0];
  assert.equal(row.actionPart?.visible === true, false, 'small atlas face must not mask a wider fallback control');
  assert.equal(row.action.frame.visible, true);
  row.action.hitArea.emit('pointerup');
  assert.deepEqual(bought, ['startMaxHealth']);
  view.destroy();
});

test("permanent authorization terminal owns the full-screen 2x2 supply-card layout", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase() {},
    onClose() {}
  });

  assert.deepEqual(PERK_STORE_LAYOUT, {
    width: 920,
    height: 504,
    contentLeft: 40,
    contentTop: 104,
    cardWidth: 424,
    cardHeight: 160,
    columnGap: 16,
    rowGap: 12,
    iconSize: 96,
    statusRailWidth: 44,
    actionWidth: 148,
    actionHeight: 40,
    footerWidth: 280,
    footerHeight: 48
  });
  assert.equal(controller.rows.length, 4);
  assert.deepEqual(
    controller.rows.map(({ column, row }) => [column, row]),
    [[0, 0], [1, 0], [0, 1], [1, 1]]
  );
  assert.equal(controller.rows.every(({ icon }) =>
    icon?.displayWidth === 96 && icon?.displayHeight === 96
  ), true);
  const blockers = scene.created.rectangles.filter((object) =>
    object.width === 960 && object.height === 540 && object.input?.enabled === true
  );
  assert.equal(blockers.length, 1);
  assert.equal(
    controller.pageSteel?.calls.some((call) =>
      call[0] === "fillRect"
      && call[1] === 20
      && call[2] === 18
      && call[3] === 920
      && call[4] === 504
    ),
    true
  );
  assert.equal(textCopies(controller).includes("军需授权"), true);
  assert.equal(textCopies(controller).includes("永久授权终端"), false);
});

// Break caught: the quartermaster ignores present U1 production chassis, perk art, or state atlas and continues to paint the legacy route.
test("quartermaster uses admitted U1 chassis, perk art, and state atlas without changing purchase topology", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = (key) => new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts
  ]).has(key);
  const purchases = [];
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase(key) { purchases.push(key); },
    onClose() {}
  });
  assert.equal(scene.created.images.some(({ textureKey }) => textureKey === TEXTURES.u1QuartermasterChassis), true);
  assert.deepEqual(controller.rows.map(({ icon }) => icon.textureKey), [
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon
  ]);
  assert.equal(scene.created.images.some(({ textureKey }) => textureKey === TEXTURES.u1StateParts), true);
  assert.equal(
    controller.pageSteel?.calls.some((call) => call[0] === "fillRect" && call[3] === 920 && call[4] === 504),
    false,
    "opaque legacy page steel must not cover an admitted chassis"
  );
  const purchaseAreas = controller.rows.flatMap(({ action }) => action?.hitArea ? [action.hitArea] : []);
  assert.equal(purchaseAreas.length, 4);
  purchaseAreas.filter((area) => area.input?.enabled).forEach((area) => area.emit("pointerup"));
  assert.deepEqual(purchases, ["startMaxHealth", "startMoveSpeed", "startDamage", "startPickupRadius"]);
});

// Break caught: an opaque formal purchase/stamp atlas plate is appended after its live label and covers the data-driven text despite a correctly aligned hit area.
test("formal state atlas plates stay below their runtime labels in overlay content order", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = (key) => new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts
  ]).has(key);
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 150, perks: { startMaxHealth: true } }),
    onPurchase() {}, onClose() {}
  });
  const children = controller.overlay.content.children;
  const owned = controller.rows[0];
  const available = controller.rows[1];
  assert.ok(children.indexOf(owned.stampPart) < children.indexOf(owned.stampText));
  assert.ok(children.indexOf(available.actionPart) < children.indexOf(available.action.label));
  assert.equal(available.action.hitArea.x, available.actionPart.x);
  assert.equal(available.action.hitArea.y, available.actionPart.y);
  assert.equal(available.action.hitArea.input?.enabled, true);
});

// Break caught: one preferred U1 item creation failure collapses the production page rather than retrying only that item with its shared upgrade texture.
test("a preferred store item creation failure falls back only that icon and retains the formal page", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = (key) => new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts,
    TEXTURES.upgradeDamage
  ]).has(key);
  const addImage = scene.add.image;
  let failed = false;
  scene.add.image = (...args) => {
    if (!failed && args[2] === TEXTURES.u1PerkArmoryAuth) {
      failed = true;
      throw new Error("preferred item creation failed");
    }
    return addImage(...args);
  };
  let controller;
  assert.doesNotThrow(() => {
    controller = createPerkStoreView(scene, {
      presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
      onPurchase() {}, onClose() {}
    });
  });
  assert.equal(failed, true);
  assert.equal(scene.created.images.some(({ textureKey, visible }) => textureKey === TEXTURES.u1QuartermasterChassis && visible === true), true);
  assert.deepEqual(controller.rows.map(({ icon }) => icon.textureKey), [
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.upgradeDamage,
    TEXTURES.u1PerkRecoveryBeacon
  ]);
  const identity = controller.rows[2].icon;
  controller.refresh(getPerkStorePresentation({ credits: 250, perks: {} }));
  assert.equal(controller.rows[2].icon, identity);
  assert.equal(controller.rows[2].icon.textureKey, TEXTURES.upgradeDamage);
});

// Break caught: a preferred item refresh failure aborts the entire row refresh instead of preserving the same icon and applying its own legacy fallback.
test("a preferred store item refresh failure keeps icon identity and falls back only that item", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = (key) => new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts,
    TEXTURES.upgradeDamage
  ]).has(key);
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase() {}, onClose() {}
  });
  const icon = controller.rows[2].icon;
  const applyTexture = icon.setTexture.bind(icon);
  const calls = [];
  icon.setTexture = (key) => {
    calls.push(key);
    if (key === TEXTURES.u1PerkArmoryAuth) throw new Error("preferred item refresh failed");
    return applyTexture(key);
  };
  assert.doesNotThrow(() => controller.refresh(getPerkStorePresentation({ credits: 250, perks: {} })));
  assert.equal(controller.rows[2].icon, icon);
  assert.deepEqual(calls, [TEXTURES.u1PerkArmoryAuth, TEXTURES.upgradeDamage]);
  assert.equal(icon.textureKey, TEXTURES.upgradeDamage);
  assert.equal(controller.rows[0].icon.textureKey, TEXTURES.u1PerkArmor);
  assert.equal(controller.rows[1].icon.textureKey, TEXTURES.u1PerkMobility);
  assert.equal(controller.rows[3].icon.textureKey, TEXTURES.u1PerkRecoveryBeacon);
});

// Break caught: atlas creation or frame application failure leaks a partial formal group or collapses the page instead of restoring the existing Graphics/Text state route.
test("atlas creation and frame failures retire atlas parts and preserve the production purchase topology", () => {
  const creationFailures = [];
  for (const failureMode of ["create", "frame"]) {
    const scene = createUiScene({ width: 960, height: 540 });
    scene.textures.exists = (key) => new Set([
      TEXTURES.u1QuartermasterChassis,
      TEXTURES.u1PerkArmor,
      TEXTURES.u1PerkMobility,
      TEXTURES.u1PerkArmoryAuth,
      TEXTURES.u1PerkRecoveryBeacon,
      TEXTURES.u1StateParts
    ]).has(key);
    const addImage = scene.add.image;
    scene.add.image = (...args) => {
      if (failureMode === "create" && args[2] === TEXTURES.u1StateParts) {
        throw new Error("atlas image creation failed");
      }
      const image = addImage(...args);
      if (failureMode === "frame" && args[2] === TEXTURES.u1StateParts) {
        image.setFrame = () => { throw new Error("atlas frame application failed"); };
      }
      return image;
    };
    const purchases = [];
    let controller;
    try {
      controller = createPerkStoreView(scene, {
        presentation: getPerkStorePresentation({ credits: 150, perks: { startMaxHealth: true } }),
        onPurchase(key) { purchases.push(key); }, onClose() {}
      });
    } catch (error) {
      creationFailures.push(`${failureMode}: ${error.message}`);
      continue;
    }
    assert.equal(scene.created.images.some(({ textureKey, visible }) => textureKey === TEXTURES.u1QuartermasterChassis && visible === true), true, failureMode);
    assert.equal(controller.rows.every(({ statePart, actionPart, stampPart, lampPart }) => (
      [statePart, actionPart, stampPart, lampPart].every((part) => !part || part.visible !== true)
    )), true, failureMode);
    assert.equal(controller.rows.every(({ statusRail }) => statusRail?.visible === true), true, failureMode);
    assert.equal(controller.rows[0].stampFrame.visible, true, failureMode);
    const purchaseAreas = controller.rows.map(({ action }) => action.hitArea).filter(({ input }) => input?.enabled === true);
    assert.equal(purchaseAreas.length, 2, failureMode);
    purchaseAreas.forEach((area) => area.emit("pointerup"));
    assert.deepEqual(purchases, ["startMoveSpeed", "startPickupRadius"], failureMode);
  }
  assert.deepEqual(creationFailures, []);
});

// Break caught: missing optional U1 art removes usable legacy Graphics/Text affordances or changes item fallback keys.
test("quartermaster falls back to legacy upgrade art and page-local Graphics when U1 textures are absent", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase() {},
    onClose() {}
  });
  assert.ok(controller.pageSteel);
  assert.deepEqual(controller.rows.map(({ icon }) => icon.textureKey), [
    TEXTURES.upgradeMaxHealth,
    TEXTURES.upgradeMoveSpeed,
    TEXTURES.upgradeDamage,
    TEXTURES.upgradePickupRadius
  ]);
  assert.equal(controller.rows.every(({ stampFrame, stampText, action }) => stampFrame && stampText && action), true);
  const identity = controller.rows.map((row) => row.icon);
  controller.refresh(getPerkStorePresentation({ credits: 250, perks: {} }));
  assert.deepEqual(controller.rows.map((row) => row.icon), identity);
  controller.destroy();
  controller.destroy();
  assert.ok(scene.created.all.every((object) => object.destroyCalls === 1));
});

// Break caught: state atlas is loaded but only decorates the page, leaving owned/available/insufficient cards or available purchase CTAs on the legacy state route.
test("quartermaster maps each visible state and purchase CTA to its U1 atlas frame", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = (key) => new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts
  ]).has(key);
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 150, perks: { startMaxHealth: true } }),
    onPurchase() {},
    onClose() {}
  });
  const stateParts = scene.created.images.filter(({ textureKey, visible }) => textureKey === TEXTURES.u1StateParts && visible === true);
  for (const [rowIndex, expectedFrame] of ["status-check", "status-unlock", "status-lock", "status-unlock"].entries()) {
    const row = controller.rows[rowIndex];
    const left = PERK_STORE_LAYOUT.contentLeft + row.column * (PERK_STORE_LAYOUT.cardWidth + PERK_STORE_LAYOUT.columnGap);
    const top = PERK_STORE_LAYOUT.contentTop + row.row * (PERK_STORE_LAYOUT.cardHeight + PERK_STORE_LAYOUT.rowGap);
    assert.equal(
      stateParts.some((part) => part.x >= left && part.x <= left + PERK_STORE_LAYOUT.cardWidth && part.y >= top && part.y <= top + PERK_STORE_LAYOUT.cardHeight && part.frame === expectedFrame),
      true,
      `${row.key} ${expectedFrame}`
    );
  }
  assert.equal(stateParts.filter(({ frame, visible }) => visible === true && frame === "action-purchase").length, 2);
});

// Break caught: a single absent formal perk or state atlas disables the whole page instead of taking only its page-local fallback branch.
test("quartermaster independently falls back for a missing perk image and a missing state atlas", () => {
  const formalKeys = new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts
  ]);
  const itemMissingScene = createUiScene({ width: 960, height: 540 });
  itemMissingScene.textures.exists = (key) => formalKeys.has(key);
  const itemMissing = createPerkStoreView(itemMissingScene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase() {},
    onClose() {}
  });
  assert.equal(itemMissingScene.created.images.some(({ textureKey }) => textureKey === TEXTURES.u1QuartermasterChassis), true);
  assert.deepEqual(itemMissing.rows.map(({ icon }) => icon.textureKey), [
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.upgradeDamage,
    TEXTURES.u1PerkRecoveryBeacon
  ]);

  const atlasMissingScene = createUiScene({ width: 960, height: 540 });
  atlasMissingScene.textures.exists = (key) => new Set([
    TEXTURES.u1QuartermasterChassis,
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon
  ]).has(key);
  const atlasMissing = createPerkStoreView(atlasMissingScene, {
    presentation: getPerkStorePresentation({ credits: 150, perks: { startMaxHealth: true } }),
    onPurchase() {},
    onClose() {}
  });
  assert.equal(atlasMissingScene.created.images.some(({ textureKey }) => textureKey === TEXTURES.u1StateParts), false);
  assert.equal(atlasMissing.rows.every(({ statusRail, stampFrame, stampText, action }) => statusRail && stampFrame && stampText && action), true);
  assert.equal(atlasMissing.rows.filter(({ action }) => action.hitArea.input?.enabled).length, 2);
});

// Missing chassis retains item art but uses one complete procedural control route.
test("quartermaster keeps U1 items and working purchases when the chassis and formal controls fall back together", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = (key) => new Set([
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon,
    TEXTURES.u1StateParts
  ]).has(key);
  const purchases = [];
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase(key) { purchases.push(key); },
    onClose() {}
  });
  assert.ok(controller.pageSteel?.visible === true, "programmatic page fallback remains visible without a chassis");
  assert.deepEqual(controller.rows.map(({ icon }) => icon.textureKey), [
    TEXTURES.u1PerkArmor,
    TEXTURES.u1PerkMobility,
    TEXTURES.u1PerkArmoryAuth,
    TEXTURES.u1PerkRecoveryBeacon
  ]);
  assert.equal(scene.created.images.some(({ textureKey, visible }) => textureKey === TEXTURES.u1StateParts && visible === true), false);
  assert.ok(controller.rows.every(({ action }) => action.frame.visible === true));
  const purchaseAreas = controller.rows.map(({ action }) => action.hitArea).filter(({ input }) => input?.enabled === true);
  assert.equal(purchaseAreas.length, 4);
  purchaseAreas.forEach((area) => area.emit("pointerup"));
  assert.deepEqual(purchases, ["startMaxHealth", "startMoveSpeed", "startDamage", "startPickupRadius"]);
});

// Break caught: the quartermaster page reading as one flat rectangle with
// undersized metadata instead of a physical, nested steel control surface.
test("production store renders legible metadata on a three-layer neutral steel page", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 250, perks: {} }),
    onPurchase() {},
    onClose() {}
  });

  assert.equal(Number.parseInt(controller.header.progressText.style.fontSize, 10) >= 13, true);
  assert.equal(controller.rows.every(({ detailsText }) =>
    Number.parseInt(detailsText.style.fontSize, 10) >= 13
  ), true);
  assert.equal(controller.pageSteel.calls.some((call) =>
    call[0] === "fillRect"
      && call[1] === 20
      && call[2] === 18
      && call[3] === 920
      && call[4] === 504
  ), true);
  assert.equal(controller.pageSteel.calls.some((call) =>
    call[0] === "fillRect"
      && call[1] === 24
      && call[2] === 22
      && call[3] === 912
      && call[4] === 496
  ), true);
  assert.equal(
    controller.pageSteel.calls.filter(([method]) => method === "lineBetween").length >= 4,
    true
  );
});

// Break caught: supply cards remaining flat semantic-color outlines, with the
// 96px art floating loose instead of being mounted in a steel icon well.
test("every supply card has neutral layered hardware, a 104x112 icon well, and local state accent", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({
      credits: 150,
      perks: { startMaxHealth: true }
    }),
    onPurchase() {},
    onClose() {}
  });

  for (const card of controller.rows) {
    const x = PERK_STORE_LAYOUT.contentLeft
      + card.column * (PERK_STORE_LAYOUT.cardWidth + PERK_STORE_LAYOUT.columnGap);
    const y = PERK_STORE_LAYOUT.contentTop
      + card.row * (PERK_STORE_LAYOUT.cardHeight + PERK_STORE_LAYOUT.rowGap);
    assert.equal(card.iconWell?.calls.some((call) =>
      call[0] === "fillRect"
        && call[1] === x + 12
        && call[2] === y + 8
        && call[3] === 104
        && call[4] === 112
    ), true);
    assert.equal(
      card.iconWell?.calls.filter(([method]) => method === "fillCircle").length >= 4,
      true
    );
    assert.equal(card.frame.calls.some((call) =>
      call[0] === "lineStyle" && call[2] === THEME.terminal.frame
    ), true);
    assert.equal(card.frame.calls.some((call) =>
      call[0] === "lineBetween" && call[1] === x + 20 && call[3] === x + 84
    ), true);
  }
});

// Break caught: authorization states falling back to unframed green words,
// which read as debug labels instead of physical approval stamps.
test("owned cards and 4/4 completion use visible double-frame steel stamps", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({
      credits: 0,
      perks: { startMaxHealth: true }
    }),
    onPurchase() {},
    onClose() {}
  });

  assert.equal(controller.rows[0].stampFrame?.visible, true);
  assert.equal(
    controller.rows[0].stampFrame?.calls.filter(([method]) => method === "strokeRect").length >= 2,
    true
  );
  assert.equal(controller.rows.slice(1).every(({ stampFrame }) => stampFrame?.visible === false), true);
  assert.equal(
    controller.header.sealFrame.calls.filter(([method]) => method === "strokeRect").length >= 2,
    true
  );

  const stampFrames = controller.rows.map(({ stampFrame }) => stampFrame);
  controller.refresh(getPerkStorePresentation({
    credits: 0,
    perks: {
      startMaxHealth: true,
      startMoveSpeed: true,
      startDamage: true,
      startPickupRadius: true
    }
  }));
  assert.deepEqual(controller.rows.map(({ stampFrame }) => stampFrame), stampFrames);
  assert.equal(controller.rows.every(({ stampFrame }) => stampFrame.visible), true);
  assert.equal(controller.header.sealFrame.visible, true);
});

// Break caught: the footer retaining the old 136x40 filter or escaping the
// visible 920x504 control surface.
test("production footer exposes one visible 280x48 return control inside the panel", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  let closes = 0;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 0, perks: {} }),
    onPurchase() {},
    onClose() { closes += 1; }
  });
  const footerHitAreas = scene.created.rectangles.filter(({ width, height }) =>
    width === 280 && height === 48
  );
  assert.equal(footerHitAreas.length, 1);
  const [footerHitArea] = footerHitAreas;
  const panelTop = (scene.scale.height - controller.layout.height) / 2;
  const panelBottom = panelTop + controller.layout.height;

  assert.equal(footerHitArea.visible, true);
  assert.equal(footerHitArea.input?.enabled, true);
  assert.equal(controller.footer.objects.every(({ visible }) => visible), true);
  assert.equal(footerHitArea.y - footerHitArea.height / 2 >= panelTop, true);
  assert.equal(footerHitArea.y + footerHitArea.height / 2 <= panelBottom, true);
  footerHitArea.emit("pointerup");
  assert.equal(closes, 1);
});

// Break caught: owned/insufficient cards retaining fake affordances, or any
// non-action surface becoming a second purchase hit area.
test("mixed supply cards expose three honest states and only available action hit areas", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const purchases = [];
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({
      credits: 150,
      perks: { startMaxHealth: true }
    }),
    onPurchase(key) { purchases.push(key); },
    onClose() {}
  });

  assert.deepEqual(
    controller.rows.map((card) => ({
      state: card.state,
      stampVisible: card.stampText?.visible === true,
      detail: card.detailsText.text,
      actionVisible: card.action.hitArea.visible,
      actionEnabled: card.action.hitArea.input?.enabled === true,
      statusRailInteractive: card.statusRail?.input?.enabled === true
    })),
    [
      {
        state: "owned",
        stampVisible: true,
        detail: "总价 150",
        actionVisible: false,
        actionEnabled: false,
        statusRailInteractive: false
      },
      {
        state: "available",
        stampVisible: false,
        detail: "总价 150",
        actionVisible: true,
        actionEnabled: true,
        statusRailInteractive: false
      },
      {
        state: "insufficient",
        stampVisible: false,
        detail: "总价 250 · 还需 100",
        actionVisible: false,
        actionEnabled: false,
        statusRailInteractive: false
      },
      {
        state: "available",
        stampVisible: false,
        detail: "总价 120",
        actionVisible: true,
        actionEnabled: true,
        statusRailInteractive: false
      }
    ]
  );
  assert.deepEqual(controller.rows.map(({ statusSymbol }) => statusSymbol), [
    "check", "unlock", "lock", "unlock"
  ]);
  assert.equal(controller.rows[0].action.objects.every(({ visible }) => !visible), true);
  assert.equal(controller.rows[2].action.objects.every(({ visible }) => !visible), true);
  assert.equal(
    controller.rows[1].statusRail.calls.some(([method]) => method === "strokeRect"),
    false
  );
  assert.equal(
    controller.rows[2].statusRail.calls.some(([method]) => method === "strokeRect"),
    true
  );
  assert.equal(
    controller.rows[1].action.frame.calls.some((call) =>
      call[0] === "lineStyle" && call[2] === THEME.semantic.warning
    ),
    true
  );
  assert.equal(
    controller.rows[1].action.frame.calls.some((call) =>
      call[0] === "lineStyle" && call[2] === THEME.semantic.contained
    ),
    false
  );
  assert.equal(
    controller.rows[1].action.signal.calls.some((call) =>
      call[0] === "fillStyle" && call[1] === THEME.semantic.warning
    ),
    true
  );

  for (const card of controller.rows) {
    card.frame.emit("pointerup");
    card.icon?.emit("pointerup");
    card.statusRail?.emit("pointerup");
  }
  controller.rows[0].action.hitArea.emit("pointerup");
  controller.rows[2].action.hitArea.emit("pointerup");
  assert.deepEqual(purchases, []);
  controller.rows[1].action.hitArea.emit("pointerup");
  assert.deepEqual(purchases, ["startMoveSpeed"]);
});

// Break caught: refresh rebuilding cards/header seals or leaving any purchase
// action visible and enabled after all four authorizations complete.
test("refresh preserves card and seal identity while applying the completion seal", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const controller = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 0, perks: {} }),
    onPurchase() {},
    onClose() {}
  });
  const cardObjects = controller.rows.map(({ objects }) => [...objects]);
  const sealText = controller.header.sealText;
  const sealFrame = controller.header.sealFrame;
  const localObjects = controller.objects.filter((object) =>
    !controller.overlay.objects.includes(object)
  );
  assert.equal(sealText?.visible, false);
  assert.equal(sealFrame?.visible, false);

  controller.refresh(getPerkStorePresentation({
    credits: 0,
    perks: {
      startMaxHealth: true,
      startMoveSpeed: true,
      startDamage: true,
      startPickupRadius: true
    }
  }));

  assert.equal(controller.header.state, "contained");
  assert.equal(controller.header.progressText.text, "授权进度 4/4");
  assert.equal(controller.header.sealText, sealText);
  assert.equal(controller.header.sealFrame, sealFrame);
  assert.equal(controller.header.sealText?.visible, true);
  assert.equal(controller.header.sealText?.text, "授权完成");
  assert.equal(controller.header.sealFrame?.visible, true);
  assert.equal(controller.rows.every(({ state }) => state === "owned"), true);
  assert.equal(controller.rows.every(({ stampText }) => stampText?.visible), true);
  assert.equal(controller.rows.every(({ action }) => !action.hitArea.visible), true);
  assert.equal(controller.rows.every(({ action }) => action.hitArea.input?.enabled !== true), true);
  assert.deepEqual(controller.rows.map(({ objects }) => [...objects]), cardObjects);
  controller.destroy();
  controller.destroy();
  assert.equal(controller.objects.every(({ destroyed }) => destroyed), true);
  assert.equal(controller.objects.every(({ listenerCount }) => listenerCount === 0), true);
  assert.equal(controller.objects.every(({ destroyCalls }) => destroyCalls === 1), true);
  assert.deepEqual(
    scene.destroyedOrder.slice(0, localObjects.length),
    [...localObjects].reverse()
  );
});

// Break caught: a zero-credit warning hiding navigation or the store exposing
// legacy header copy beneath the U1 page-local header.
test("zero-credit header stays visible and uses the U1 warning state", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  const zero = createPerkStoreView(scene, {
    presentation: getPerkStorePresentation({ credits: 0, perks: {} }),
    onPurchase() {}, onClose() {}
  });
  assert.equal(textCopies(zero).includes("可用学分 0"), true);
  assert.equal(zero.header.state, "warning");
  assert.equal(zero.footer?.hitArea.visible, true);
  assert.equal(zero.footer?.hitArea.input?.enabled, true);
});

test("actual production and legacy factories atomically roll back partial objects", () => {
  const scene = createUiScene({ width: 960, height: 540 });
  scene.textures.exists = () => false;
  let productionRollbackObjects = [];
  const options = {
    presentation: getPerkStorePresentation({ credits: 150, perks: {} }),
    onPurchase() {}, onClose() {}
  };
  const recovered = createPerkStoreWithFallback(scene, options, {
    createProduction: (nextScene, nextOptions) => createPerkStoreView(
      nextScene,
      nextOptions,
      createProductionFaultDependencies(nextScene, createTerminalButton)
    ),
    createLegacy(nextScene, nextOptions) {
      productionRollbackObjects = [...nextScene.created.all];
      return createLegacyPerkStoreView(nextScene, nextOptions);
    }
  });
  assert.equal(recovered.kind, "legacy");
  assert.equal(productionRollbackObjects.every(({ active }) => active === false), true);
  assert.equal(productionRollbackObjects.every(({ destroyCalls }) => destroyCalls === 1), true);
  assert.equal(scene.faults.completed[0].objects.every(({ destroyed }) => destroyed), true);
  assert.equal(scene.faults.completed[0].objects.every(({ listenerCount }) => listenerCount === 0), true);
  recovered.destroy();

  const unavailableScene = createUiScene({ width: 960, height: 540 });
  unavailableScene.textures.exists = () => false;
  const unavailable = createPerkStoreWithFallback(unavailableScene, options, {
    createProduction: (nextScene, nextOptions) => createPerkStoreView(
      nextScene,
      nextOptions,
      createProductionFaultDependencies(nextScene, createTerminalButton)
    ),
    createLegacy: (nextScene, nextOptions) => createLegacyPerkStoreView(
      nextScene,
      nextOptions,
      createLegacyFaultDependencies(nextScene)
    )
  });
  assert.equal(unavailable, null);
  assert.equal(unavailableScene.created.all.every(({ active }) => active === false), true);
  assert.equal(unavailableScene.created.all.every(({ listenerCount }) => listenerCount === 0), true);
});
