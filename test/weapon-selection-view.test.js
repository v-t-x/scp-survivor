import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";
import {
  createArmorySlot,
  getWeaponSlotVisualState
} from "../src/art/weaponSelectionView.js";
import * as armoryView from "../src/art/weaponSelectionView.js";
import * as menus from "../src/scene/menus.js";

const menusPath = fileURLToPath(new URL("../src/scene/menus.js", import.meta.url));

function makeDisplayObject(type = "object", activity = []) {
  return {
    type,
    active: true,
    visible: true,
    input: { enabled: false },
    handlers: new Map(),
    setDepth(depth) { this.depth = depth; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setDisplaySize(width, height) { this.displaySize = [width, height]; return this; },
    setOrigin(...origin) { this.origin = origin; return this; },
    setInteractive(options) { this.interactive = options; this.input ??= {}; this.input.enabled = true; return this; },
    disableInteractive() { if (this.input) this.input.enabled = false; activity.push(`${this.type}:disable`); return this; },
    removeInteractive() { this.input = null; activity.push(`${this.type}:remove-interactive`); return this; },
    removeAllListeners() { this.handlers.clear(); activity.push(`${this.type}:remove-listeners`); return this; },
    destroy() { this.destroyCalls = (this.destroyCalls ?? 0) + 1; this.active = false; activity.push(`${this.type}:destroy`); return this; },
    setVisible(visible) { this.visible = visible; return this; },
    setTexture(textureKey) { this.textureKey = textureKey; return this; },
    setFillStyle(color, alpha) { this.fill = [color, alpha]; return this; },
    setStrokeStyle(color, alpha) { this.stroke = [color, alpha]; return this; },
    setStyle(style) { this.style = { ...this.style, ...style }; return this; },
    setShadow(...shadow) { this.shadow = shadow; return this; },
    setText(text) { this.text = text; return this; },
    setColor(color) { this.color = color; return this; },
    on(event, handler) { this.handlers.set(event, handler); return this; },
    clear() { this.commands = []; return this; },
    fillStyle(...args) { this.fill = args; this.commands.push(["fillStyle", ...args]); return this; },
    fillRect(...args) { this.commands.push(["fillRect", ...args]); return this; },
    lineStyle(...args) { this.stroke = args.slice(1); this.commands.push(["lineStyle", ...args]); return this; },
    beginPath() { this.commands.push(["beginPath"]); return this; },
    moveTo(...args) { this.commands.push(["moveTo", ...args]); return this; },
    lineTo(...args) { this.commands.push(["lineTo", ...args]); return this; },
    closePath() { this.commands.push(["closePath"]); return this; },
    fillPath() { this.commands.push(["fillPath"]); return this; },
    strokePath() { this.commands.push(["strokePath"]); return this; },
    fillCircle(...args) { this.commands.push(["fillCircle", ...args]); return this; },
    strokeCircle(...args) { this.commands.push(["strokeCircle", ...args]); return this; },
    lineBetween(...args) { this.commands.push(["lineBetween", ...args]); return this; }
  };
}

function parseHexColor(color) {
  const value = Number.parseInt(String(color).replace(/^#/, ""), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function contrastRatio(foreground, background) {
  const luminance = (color) => {
    const [red, green, blue] = parseHexColor(color).map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function hexColor(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function anchorIsInside(textObject, backing) {
  return textObject.x >= backing.x
    && textObject.x <= backing.x + backing.width
    && textObject.y >= backing.y
    && textObject.y <= backing.y + backing.height;
}

function hasReadableTreatment(textObject, backing) {
  return anchorIsInside(textObject, backing)
    && contrastRatio(
      textObject.color,
      hexColor(backing.contrastFloorColor ?? backing.color)
    ) >= 4.5;
}

test("armory manifest exposes the production rack backdrop", () => {
  assert.equal(TEXTURES.armoryRackBackdrop, "armory-rack-backdrop");
  assert.deepEqual(
    IMAGE_ASSETS.find(({ key }) => key === TEXTURES.armoryRackBackdrop),
    { key: "armory-rack-backdrop", path: "assets/art/menus/armory-rack-backdrop.png" }
  );
});

test("weapon slot visual states are deterministic and selected wins hover", () => {
  assert.deepEqual(armoryView.ARMORY_WORKBENCH_LAYOUT, {
    header: { x: 24, y: 16, width: 912, height: 64 },
    selector: { x: 80, y: 154, width: 170, height: 106, gap: 17 },
    showcase: { x: 354, y: 118, width: 244, height: 270 },
    dossier: { x: 708, y: 120, width: 184, height: 286 },
    deploy: { x: 332, y: 458, width: 296, height: 58 }
  });
  assert.deepEqual(getWeaponSlotVisualState({ selected: false, hovered: false }), {
    frame: "idle",
    lamp: "standby",
    statusLabel: "待选择",
    symbol: "none"
  });
  assert.deepEqual(getWeaponSlotVisualState({ selected: false, hovered: true }), {
    frame: "inspect",
    lamp: "standby",
    statusLabel: "正在检查",
    symbol: "none"
  });
  assert.deepEqual(getWeaponSlotVisualState({ selected: true, hovered: true }), {
    frame: "confirmed",
    lamp: "contained",
    statusLabel: "装备确认",
    symbol: "check"
  });
  assert.ok(Object.isFrozen(getWeaponSlotVisualState({ selected: false, hovered: false })));
});

test("armory slot owns a compact selector through named controller fields", () => {
  const calls = [];
  const activity = [];
  const scene = {
    add: {
      graphics() { const object = makeDisplayObject("graphics", activity); object.commands = []; calls.push(["graphics", object]); return object; },
      image(...args) { const object = makeDisplayObject("image", activity); calls.push(["image", args, object]); return object; },
      text(...args) { const object = makeDisplayObject("text", activity); calls.push(["text", args, object]); return object; },
      circle(...args) { const object = makeDisplayObject("circle", activity); calls.push(["circle", args, object]); return object; },
      rectangle(...args) { const object = makeDisplayObject("rectangle", activity); calls.push(["rectangle", args, object]); return object; }
    }
  };
  let activations = 0;
  const slot = createArmorySlot(scene, {
    x: 208,
    y: 174,
    width: 272,
    height: 132,
    textureKey: TEXTURES.weaponPistolIcon,
    name: "制式手枪",
    role: "单体压制",
    stats: [{ label: "伤害", value: "10" }],
    depth: 20,
    scrollFactor: 0,
    nameStyle: {},
    roleStyle: {},
    statsStyle: {},
    lockedStyle: {},
    onActivate: () => { activations += 1; }
  });

  assert.equal(slot.icon, calls.find(([type]) => type === "image")[2]);
  assert.equal(slot.statusText.type, "text");
  assert.equal(slot.symbolGraphics.type, "graphics");
  assert.equal(slot.hitArea.type, "rectangle");
  assert.deepEqual(slot.icon.displaySize, [88, 88]);
  assert.equal(
    slot.frame.commands.some(([method, color, alpha]) => (
      method === "fillStyle" && color === 0x05080d && alpha === 1
    )),
    true,
    "selector should begin with an opaque steel backplate"
  );
  assert.equal(
    slot.frame.commands.filter(([method]) => method === "fillCircle").length >= 4,
    true,
    "selector should use physical fasteners instead of a floating HUD outline"
  );
  assert.deepEqual(calls.find(([type]) => type === "rectangle")[1].slice(0, 4), [208, 174, 272, 132]);
  slot.hitArea.handlers.get("pointerdown")();
  assert.equal(activations, 1);
  assert.equal(slot.statusText.visible, true);
  assert.equal(slot.statusText.text, "待选择");
  assert.equal(slot.symbolGraphics.visible, false);
  slot.setState({ selected: false, hovered: true });
  assert.equal(slot.statusText.visible, true);
  assert.equal(slot.statusText.text, "正在检查");
  assert.equal(slot.statusText.color, "#e2e8ff");
  slot.setState({ selected: true, hovered: false });
  assert.equal(slot.statusText.visible, true);
  assert.equal(slot.statusText.text, "装备确认");
  assert.equal(slot.statusText.color, "#a7f3d0");
  assert.equal(slot.symbolGraphics.visible, true);
  slot.destroy();
  slot.destroy();
  for (const object of slot.objects) {
    assert.equal(object.destroyCalls, 1);
    assert.equal(object.handlers.size, 0);
  }
  assert.equal(slot.hitArea.input, null);
  assert.equal(activity.filter((event) => event.endsWith(":destroy")).length, slot.objects.length);
});

test("armory detail reuses one hero and dossier while refreshing empty and selected states", () => {
  assert.equal(typeof armoryView.createArmoryDetailView, "function");
  const activity = [];
  const scene = {
    add: {
      graphics() { const object = makeDisplayObject("graphics", activity); object.commands = []; return object; },
      image(x, y, textureKey) { return Object.assign(makeDisplayObject("image", activity), { x, y, textureKey }); },
      text(x, y, text, style = {}) {
        return Object.assign(makeDisplayObject("text", activity), { x, y, text, color: style.color });
      }
    }
  };
  const detail = armoryView.createArmoryDetailView(scene, {
    depth: 20,
    scrollFactor: 0,
    emptyStyle: {},
    nameStyle: {},
    statusStyle: {},
    statsStyle: {}
  });
  const heroImage = detail.heroImage;
  const dossierTexts = [detail.nameText, detail.statusText, detail.statsText];

  assert.equal(
    detail.fixtureGraphics.commands.some(([method, color, alpha]) => (
      method === "fillStyle" && color === 0xa89d84 && alpha === 1
    )),
    true,
    "dossier should render as a solid warm paper insert"
  );
  assert.equal(detail.dossierLabelText.text, "武器档案");
  assert.equal(detail.dossierLabelText.color, "#f1dfc5", "legacy dossier keeps its established badge ink");
  assert.equal(detail.dossierClassText.color, "#5b5245", "legacy dossier keeps its established class ink");
  assert.equal(
    detail.dossierClassText.y < detail.nameText.y,
    true,
    "classification label must stay in the paper header instead of colliding with long weapon names"
  );

  detail.refresh(
    { state: "empty", textureKey: null },
    { name: "", statusLabel: "未选择", stats: [] }
  );
  assert.equal(detail.heroImage.visible, false);
  assert.equal(detail.emptyText.visible, true);
  assert.equal(detail.statsText.text, "伤害  —\n冷却  —\n特性  —");

  detail.refresh(
    { state: "selected", textureKey: TEXTURES.weaponTeslaIcon },
    {
      name: "特斯拉电击器",
      statusLabel: "已选定",
      stats: [
        { label: "伤害", value: "6" },
        { label: "冷却", value: "300ms" },
        { label: "特性", value: "3" }
      ]
    }
  );
  assert.equal(detail.heroImage, heroImage);
  assert.deepEqual([detail.nameText, detail.statusText, detail.statsText], dossierTexts);
  assert.equal(detail.heroImage.visible, true);
  assert.equal(detail.emptyText.visible, false);
  assert.equal(detail.heroImage.textureKey, TEXTURES.weaponTeslaIcon);
  assert.deepEqual(detail.heroImage.displaySize, [192, 192]);
  assert.equal(detail.statsText.text, "伤害  6\n冷却  300ms\n特性  3");
  assert.equal(detail.nameText.color, "#24211c");
  assert.equal(detail.statusText.color, "#24594f");
  assert.equal(detail.statsText.color, "#2b2924");
  assert.equal(detail.statusText.text, "已选定");

  detail.destroy();
  detail.destroy();
  for (const object of detail.objects) {
    assert.equal(object.destroyCalls, 1);
    assert.equal(object.handlers.size, 0);
  }
});

// Native runtime capture remains the visual authority; these checks guard layout/ink regressions.
test("formal dossier keeps live fields within the paper and independent values clear", () => {
  const scene = { add: {
    graphics() { const o = makeDisplayObject("graphics"); o.commands = []; return o; },
    image(x, y, textureKey) { return Object.assign(makeDisplayObject("image"), { x, y, textureKey }); },
    text(x, y, text, style = {}) { return Object.assign(makeDisplayObject("text"), { x, y, text, color: style.color }); }
  } };
  const detail = armoryView.createArmoryDetailView(scene, {
    depth: 20, formalChassis: true, emptyStyle: {}, nameStyle: {}, statusStyle: {}, statsStyle: {}
  });
  assert.equal(detail.fixtureGraphics.commands.some(([op]) => op === "fillPath"), false);
  const paper = { x: 712, y: 159, width: 175, height: 220, color: 0x94846c };
  detail.refresh({ state: "empty" }, { name: "", statusLabel: "未选择", stats: [] });
  assert.match(detail.statusText.text, /^状态\s+未选择$/);
  assert.deepEqual(detail.statRows.map(r => r.valueText.text), ["—", "—", "—"]);
  detail.refresh({ state: "selected", textureKey: TEXTURES.u1TeslaHero }, {
    name: "特斯拉收容发射器", statusLabel: "已选定",
    stats: [{ label: "每跳伤害", value: "6" }, { label: "伤害间隔", value: "300 ms" }, { label: "链击", value: "3" }]
  });
  assert.equal(detail.nameText.text, "特斯拉收容发射器");
  assert.equal(detail.statsText.visible, false, "legacy multiline text cannot overlap the new rows");
  assert.deepEqual(detail.statRows.map(r => r.valueText.text), ["6", "300 ms", "3"]);
  for (const text of [detail.nameText, ...detail.statRows.flatMap(r => [r.labelText, r.valueText])]) {
    assert.equal(hasReadableTreatment(text, paper), true);
  }
  assert.equal(new Set(detail.statRows.map(r => r.valueText.x)).size, 1);
  detail.destroy();
});

// Break caught: the selector remains correct but the full-screen armory detail ignores an admitted U1 hero or cannot fall back when it is unavailable.
test("armory detail resolves a U1 hero only when its texture exists and otherwise uses the supplied selector icon", () => {
  const createScene = (available) => ({
    textures: { exists: (key) => available.has(key) },
    add: {
      graphics() { const object = makeDisplayObject("graphics"); object.commands = []; return object; },
      image(x, y, textureKey) { return Object.assign(makeDisplayObject("image"), { x, y, textureKey }); },
      text(x, y, text) { return Object.assign(makeDisplayObject("text"), { x, y, text }); }
    }
  });
  const selected = { state: "selected", textureKey: TEXTURES.u1TeslaHero, fallbackTextureKey: TEXTURES.weaponTeslaIcon };
  const dossier = { name: "特斯拉电击器", statusLabel: "已选定", stats: [] };
  const admitted = armoryView.createArmoryDetailView(createScene(new Set([TEXTURES.u1TeslaHero])), { depth: 1, emptyStyle: {}, nameStyle: {}, statusStyle: {}, statsStyle: {} });
  admitted.refresh(selected, dossier);
  assert.equal(admitted.heroImage.textureKey, TEXTURES.u1TeslaHero);
  const absent = armoryView.createArmoryDetailView(createScene(new Set()), { depth: 1, emptyStyle: {}, nameStyle: {}, statusStyle: {}, statsStyle: {} });
  absent.refresh(selected, dossier);
  assert.equal(absent.heroImage.textureKey, TEXTURES.weaponTeslaIcon);
});

// Break caught: Phaser retains the 24x24 legacy-image scale through setTexture, so a 256x192 U1 hero must be explicitly resized back to the formal chassis aperture.
test("formal armory hero keeps its 256x192 chassis aperture after switching from a legacy icon to U1 art", () => {
  const scene = {
    textures: { exists: (key) => key === TEXTURES.u1TeslaHero },
    add: {
      graphics() { const object = makeDisplayObject("graphics"); object.commands = []; return object; },
      image(x, y, textureKey) { return Object.assign(makeDisplayObject("image"), { x, y, textureKey }); },
      text(x, y, text) { return Object.assign(makeDisplayObject("text"), { x, y, text }); }
    }
  };
  const detail = armoryView.createArmoryDetailView(scene, {
    depth: 1, formalChassis: true, emptyStyle: {}, nameStyle: {}, statusStyle: {}, statsStyle: {}
  });
  const hero = detail.heroImage;
  const pixelSizes = new Map([
    [TEXTURES.weaponPistolIcon, [24, 24]],
    [TEXTURES.u1TeslaHero, [256, 192]]
  ]);
  const applyTexture = hero.setTexture.bind(hero);
  hero.setTexture = (nextKey) => {
    const [oldWidth, oldHeight] = pixelSizes.get(hero.textureKey);
    const [nextWidth, nextHeight] = pixelSizes.get(nextKey);
    const [displayWidth, displayHeight] = hero.displaySize;
    applyTexture(nextKey);
    hero.displaySize = [
      displayWidth / oldWidth * nextWidth,
      displayHeight / oldHeight * nextHeight
    ];
    return hero;
  };

  assert.deepEqual(hero.displaySize, [256, 192]);
  detail.refresh(
    { state: "selected", textureKey: TEXTURES.u1TeslaHero, fallbackTextureKey: TEXTURES.weaponTeslaIcon },
    { name: "特斯拉电击器", statusLabel: "已选定", stats: [] }
  );

  assert.equal(hero.textureKey, TEXTURES.u1TeslaHero);
  assert.deepEqual(hero.displaySize, [256, 192]);
});

// Break caught: a texture manager false-positive lets the preferred hero throw and aborts dossier/deploy refresh instead of retaining the hero and applying its legacy selector fallback.
test("armory detail retains its hero and completes dossier refresh when preferred hero application throws", () => {
  const scene = {
    textures: { exists: (key) => key === TEXTURES.u1TeslaHero || key === TEXTURES.weaponTeslaIcon },
    add: {
      graphics() { const object = makeDisplayObject("graphics"); object.commands = []; return object; },
      image(x, y, textureKey) { return Object.assign(makeDisplayObject("image"), { x, y, textureKey }); },
      text(x, y, text) { return Object.assign(makeDisplayObject("text"), { x, y, text }); }
    }
  };
  const detail = armoryView.createArmoryDetailView(scene, {
    depth: 1, emptyStyle: {}, nameStyle: {}, statusStyle: {}, statsStyle: {}
  });
  const hero = detail.heroImage;
  const applied = [];
  const applyTexture = hero.setTexture.bind(hero);
  hero.setTexture = (key) => {
    applied.push(key);
    if (key === TEXTURES.u1TeslaHero) throw new Error("preferred hero texture failed");
    return applyTexture(key);
  };
  assert.doesNotThrow(() => detail.refresh(
    { state: "selected", textureKey: TEXTURES.u1TeslaHero, fallbackTextureKey: TEXTURES.weaponTeslaIcon },
    { name: "特斯拉电击器", statusLabel: "已选定", stats: [{ label: "伤害", value: "6" }] }
  ));
  assert.equal(detail.heroImage, hero);
  assert.deepEqual(applied, [TEXTURES.u1TeslaHero, TEXTURES.weaponTeslaIcon]);
  assert.equal(detail.heroImage.textureKey, TEXTURES.weaponTeslaIcon);
  assert.equal(detail.nameText.text, "特斯拉电击器");
  assert.equal(detail.statusText.text, "已选定");
  assert.equal(detail.statsText.text, "伤害  6");
});

test("armory slot and detail construction roll back owned partial objects", () => {
  const slotActivity = [];
  const slotGraphics = makeDisplayObject("graphics", slotActivity);
  slotGraphics.commands = [];
  const slotScene = {
    add: {
      graphics() { return slotGraphics; },
      image() { throw new Error("injected second object failure"); }
    }
  };
  assert.throws(() => createArmorySlot(slotScene, {
    x: 208,
    y: 174,
    width: 272,
    height: 132,
    textureKey: TEXTURES.weaponPistolIcon,
    name: "制式手枪",
    depth: 20,
    onActivate() {}
  }), /second object failure/);
  assert.equal(slotGraphics.destroyCalls, 1);

  assert.equal(typeof armoryView.createArmoryDetailView, "function");
  const detailActivity = [];
  const failingHero = makeDisplayObject("image", detailActivity);
  failingHero.setDisplaySize = () => { throw new Error("injected hero setter failure"); };
  const fixture = makeDisplayObject("graphics", detailActivity);
  fixture.commands = [];
  const detailScene = {
    add: {
      graphics() { return fixture; },
      image() { return failingHero; }
    }
  };
  assert.throws(() => armoryView.createArmoryDetailView(detailScene, {
    depth: 20,
    emptyStyle: {},
    nameStyle: {},
    statusStyle: {},
    statsStyle: {}
  }), /hero setter failure/);
  assert.equal(fixture.destroyCalls, 1);
  assert.equal(failingHero.destroyCalls, 1);
});

test("deploy symbol refreshes in place and atomically releases construction failures", () => {
  assert.equal(typeof armoryView.createArmoryDeploySymbol, "function");
  const activity = [];
  const graphics = makeDisplayObject("graphics", activity);
  graphics.commands = [];
  const controller = armoryView.createArmoryDeploySymbol({
    add: { graphics() { return graphics; } }
  }, {
    x: 332,
    y: 464,
    width: 296,
    height: 52,
    depth: 32,
    scrollFactor: 0,
    symbol: "lock",
    state: "disabled"
  });
  const identity = controller.graphics;
  const lockCommands = structuredClone(graphics.commands);
  controller.refresh("forward", "armed");
  assert.equal(controller.graphics, identity);
  assert.notDeepEqual(graphics.commands, lockCommands);
  assert.equal(
    graphics.commands.some(([method]) => method === "lineBetween"),
    true,
    "armed symbol should include an arrow shaft, not only a floating triangle"
  );
  assert.equal(graphics.input?.enabled === true, false);
  controller.destroy();
  controller.destroy();
  assert.equal(graphics.destroyCalls, 1);

  const failingActivity = [];
  const failingGraphics = makeDisplayObject("graphics", failingActivity);
  failingGraphics.commands = [];
  failingGraphics.setDepth = () => { throw new Error("injected symbol setter failure"); };
  assert.throws(() => armoryView.createArmoryDeploySymbol({
    add: { graphics() { return failingGraphics; } }
  }, { depth: 1 }), /symbol setter failure/);
  assert.equal(failingGraphics.destroyCalls, 1);
});

test("weapon selection no longer renders rounded cards", async () => {
  const source = await readFile(menusPath, "utf8");
  assert.doesNotMatch(source, /fillRoundedRect|strokeRoundedRect/);
  assert.match(source, /createArmorySlot/);
  assert.match(source, /ARMORY_WORKBENCH_LAYOUT/);
  assert.match(source, /createArmoryDetailView/);
  assert.match(source, /createTerminalButton/);
  assert.match(source, /getArmoryPresentation/);
  assert.doesNotMatch(source, /const slotWidth = 228/);
  assert.doesNotMatch(source, /const slotHeight = 316/);
  assert.doesNotMatch(source, /选择装备槽位，锁定后确认部署/);
  assert.doesNotMatch(source, /const optionMetadata\s*=/);
});

test("weapon selection consumes the armory presentation and does not expose shotgun", async () => {
  const source = await readFile(menusPath, "utf8");
  assert.doesNotMatch(source, /id:\s*["']shotgun["']/);
});

function makeAuthorizationScene({ failFirstText = false } = {}) {
  const activity = [];
  const objects = [];
  let textCalls = 0;
  const add = (type) => (...args) => {
    if (type === "text" && failFirstText && textCalls++ === 0) {
      throw new Error("injected text failure");
    }
    const object = makeDisplayObject(type, activity);
    if (type === "text") object.text = args[2];
    if (type === "rectangle") {
      [object.x, object.y, object.width, object.height] = args;
    }
    objects.push(object);
    return object;
  };
  return {
    activity,
    objects,
    add: {
      graphics: add("graphics"),
      rectangle: add("rectangle"),
      text: add("text")
    }
  };
}

test("armory authorization is a zero-credit amber action and fallback cleanup stays atomic", () => {
  assert.equal(typeof menus.createArmoryAuthorizationEntryWithFallback, "function");
  assert.equal(typeof menus.createArmoryAuthorizationEntry, "function");
  assert.equal(typeof menus.createLegacyArmoryAuthorizationEntry, "function");

  const amberScene = makeAuthorizationScene();
  let activations = 0;
  const amberEntry = menus.createArmoryAuthorizationEntry(amberScene, {
    x: 756,
    y: 28,
    width: 156,
    height: 40,
    text: "永久授权 0/4  >",
    depth: 31,
    scrollFactor: 0,
    onActivate() { activations += 1; }
  });
  assert.equal(amberEntry.kind, "production");
  assert.equal(amberEntry.label.text, "永久授权 0/4  >");
  assert.equal(amberEntry.hitArea.width, 156);
  assert.equal(amberEntry.hitArea.height, 40);
  assert.equal(amberEntry.hitArea.input.enabled, true);
  amberEntry.hitArea.handlers.get("pointerup")();
  assert.equal(activations, 1);
  assert.ok(amberEntry.objects.some(({ type, fill, stroke }) => (
    type === "graphics" && (fill?.[0] === 0xd2a34b || stroke?.[0] === 0xd2a34b)
  )));
  amberEntry.destroy();

  const scene = makeAuthorizationScene({ failFirstText: true });
  let legacySawCleanProduction = false;
  const entry = menus.createArmoryAuthorizationEntryWithFallback(scene, {
    x: 720,
    y: 88,
    width: 140,
    height: 40,
    depth: 31,
    scrollFactor: 0,
    onActivate() {}
  }, {
    createProduction(target, options) {
      return menus.createArmoryAuthorizationEntry(target, options, {
        createAmberAction: menus.createArmoryAmberAction
      });
    },
    createLegacy(target, options) {
      legacySawCleanProduction = scene.objects.slice(0, 2).every((object) => (
        object.active === false && object.handlers.size === 0 && object.destroyCalls === 1
      ));
      return menus.createLegacyArmoryAuthorizationEntry(target, options);
    }
  });

  assert.equal(entry.kind, "legacy");
  assert.equal(legacySawCleanProduction, true);
  assert.equal(entry.label.text, "永久授权");
  assert.ok(entry.hitArea.interactive);

  const failedLegacyScene = makeAuthorizationScene();
  const noEntry = menus.createArmoryAuthorizationEntryWithFallback(failedLegacyScene, {
    x: 720,
    y: 88,
    width: 140,
    height: 40,
    depth: 31,
    scrollFactor: 0,
    onActivate() {}
  }, {
    createProduction(target, options) {
      return menus.createArmoryAuthorizationEntry(target, options, {
        createAmberAction() { throw new Error("production factory failure"); }
      });
    },
    createLegacy(target, options) {
      return menus.createLegacyArmoryAuthorizationEntry(target, options, {
        addRectangle: target.add.rectangle.bind(target.add),
        addText() { throw new Error("legacy text failure"); }
      });
    }
  });

  assert.equal(noEntry, null);
  assert.equal(failedLegacyScene.objects.length, 1);
  assert.equal(failedLegacyScene.objects[0].active, false);
  assert.equal(failedLegacyScene.objects[0].handlers.size, 0);
  assert.equal(failedLegacyScene.objects[0].destroyCalls, 1);
});
