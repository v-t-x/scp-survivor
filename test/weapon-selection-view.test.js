import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";
import {
  createArmorySlot,
  getWeaponSlotVisualState
} from "../src/art/weaponSelectionView.js";

const menusPath = fileURLToPath(new URL("../src/scene/menus.js", import.meta.url));

function makeDisplayObject() {
  return {
    visible: true,
    handlers: new Map(),
    setDepth(depth) { this.depth = depth; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setDisplaySize(width, height) { this.displaySize = [width, height]; return this; },
    setOrigin(...origin) { this.origin = origin; return this; },
    setInteractive(options) { this.interactive = options; return this; },
    setVisible(visible) { this.visible = visible; return this; },
    setFillStyle(color, alpha) { this.fill = [color, alpha]; return this; },
    on(event, handler) { this.handlers.set(event, handler); return this; },
    clear() { this.commands = []; return this; },
    fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; },
    lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; },
    beginPath() { this.commands.push(["beginPath"]); return this; },
    moveTo(...args) { this.commands.push(["moveTo", ...args]); return this; },
    lineTo(...args) { this.commands.push(["lineTo", ...args]); return this; },
    closePath() { this.commands.push(["closePath"]); return this; },
    fillPath() { this.commands.push(["fillPath"]); return this; },
    strokePath() { this.commands.push(["strokePath"]); return this; }
  };
}

test("armory manifest exposes the production rack backdrop", () => {
  assert.equal(TEXTURES.armoryRackBackdrop, "armory-rack-backdrop");
  assert.deepEqual(
    IMAGE_ASSETS.find(({ key }) => key === TEXTURES.armoryRackBackdrop),
    { key: "armory-rack-backdrop", path: "assets/art/menus/armory-rack-backdrop.png" }
  );
});

test("weapon slot visual states are deterministic and selected wins hover", () => {
  assert.deepEqual(getWeaponSlotVisualState({ selected: false, hovered: false }), {
    frame: "idle",
    lamp: "standby",
    selectedLabelVisible: false
  });
  assert.equal(getWeaponSlotVisualState({ selected: true, hovered: false }).frame, "locked");
  assert.equal(getWeaponSlotVisualState({ selected: false, hovered: true }).frame, "inspect");
  assert.equal(getWeaponSlotVisualState({ selected: true, hovered: true }).frame, "locked");
  assert.ok(Object.isFrozen(getWeaponSlotVisualState({ selected: false, hovered: false })));
});

test("armory slot owns presentation while activation remains external", () => {
  const calls = [];
  const scene = {
    add: {
      graphics() { const object = makeDisplayObject(); object.commands = []; calls.push(["graphics", object]); return object; },
      image(...args) { const object = makeDisplayObject(); calls.push(["image", args, object]); return object; },
      text(...args) { const object = makeDisplayObject(); calls.push(["text", args, object]); return object; },
      circle(...args) { const object = makeDisplayObject(); calls.push(["circle", args, object]); return object; },
      rectangle(...args) { const object = makeDisplayObject(); calls.push(["rectangle", args, object]); return object; }
    }
  };
  let activations = 0;
  const slot = createArmorySlot(scene, {
    x: 200,
    y: 280,
    width: 220,
    height: 300,
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

  assert.equal(slot.objects.length, 8);
  assert.deepEqual(calls.find(([type]) => type === "image")[2].displaySize, [96, 96]);
  assert.deepEqual(calls.find(([type]) => type === "rectangle")[1].slice(0, 4), [200, 280, 220, 300]);
  slot.hitArea.handlers.get("pointerdown")();
  assert.equal(activations, 1);
  slot.setState({ selected: true, hovered: false });
  assert.equal(slot.objects[6].visible, true);
});

test("weapon selection no longer renders rounded cards", async () => {
  const source = await readFile(menusPath, "utf8");
  assert.doesNotMatch(source, /fillRoundedRect|strokeRoundedRect/);
  assert.match(source, /createArmorySlot/);
  assert.match(source, /createTerminalButton/);
});
