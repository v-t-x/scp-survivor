import test from "node:test";
import assert from "node:assert/strict";

import { createPlayerEquipmentRig } from "../src/art/playerEquipmentRig.js";
import { getPlayerEquipmentDefinition } from "../src/art/playerEquipmentDefinitions.js";

const SOCKETS = Object.freeze([
  Object.freeze({ index: 0, gripX: 21, gripY: 31, supportX: 36, supportY: 33, equipmentLayer: "front" }),
  Object.freeze({ index: 1, gripX: 20, gripY: 30, supportX: 35, supportY: 32, equipmentLayer: "front" }),
  Object.freeze({ index: 2, gripX: 22, gripY: 32, supportX: 37, supportY: 34, equipmentLayer: "front" }),
  Object.freeze({ index: 3, gripX: 20, gripY: 31, supportX: 34, supportY: 33, equipmentLayer: "front" }),
  Object.freeze({ index: 4, gripX: 22, gripY: 30, supportX: 36, supportY: 32, equipmentLayer: "front" })
]);

function createVisual(type, textureKey = null, { throwOn = null } = {}) {
  const calls = [];
  const visual = {
    type,
    texture: textureKey === null ? undefined : { key: textureKey },
    calls,
    body: undefined,
    active: true,
    visible: true,
    alpha: 1,
    x: 0,
    y: 0,
    depth: 0,
    rotation: 0,
    anims: type === "sprite" ? {
      pauseCalls: 0,
      resumeCalls: 0,
      pause() { this.pauseCalls += 1; },
      resume() { this.resumeCalls += 1; }
    } : undefined,
    setOrigin(x, y) { calls.push(["setOrigin", x, y]); this.originX = x; this.originY = y; return this; },
    setPosition(x, y) { calls.push(["setPosition", x, y]); this.x = x; this.y = y; return this; },
    setFrame(frame) { calls.push(["setFrame", frame]); this.frame = frame; return this; },
    setFlipX(value) { calls.push(["setFlipX", value]); this.flipX = value; return this; },
    setRotation(value) { calls.push(["setRotation", value]); this.rotation = value; return this; },
    setDepth(value) { calls.push(["setDepth", value]); this.depth = value; return this; },
    setVisible(value) { calls.push(["setVisible", value]); this.visible = value; return this; },
    setAlpha(value) { calls.push(["setAlpha", value]); this.alpha = value; return this; },
    setTint(value) { calls.push(["setTint", value]); this.tint = value; return this; },
    clearTint() { calls.push(["clearTint"]); this.tint = null; return this; },
    destroy() { calls.push(["destroy"]); this.active = false; }
  };
  if (throwOn) visual[throwOn] = () => { throw new Error(`${type} ${throwOn} failed`); };
  return visual;
}

function createScene({ failAt = null, missingMethod = null } = {}) {
  const created = [];
  const graphicsCreated = [];
  const removed = [];
  let allocation = 0;
  function make(type, textureKey = null) {
    allocation += 1;
    if (failAt === allocation) throw new Error(`allocation ${allocation} failed`);
    const visual = createVisual(type, textureKey);
    if (missingMethod && allocation === missingMethod.allocation) delete visual[missingMethod.name];
    created.push(visual);
    if (type === "graphics") graphicsCreated.push(visual);
    return visual;
  }
  return {
    created,
    graphicsCreated,
    removed,
    children: {
      remove(object) {
        removed.push(object);
        object.active = false;
        return object;
      }
    },
    add: {
      sprite(_x, _y, textureKey) { return make("sprite", textureKey); },
      graphics() { return make("graphics"); }
    }
  };
}

function createRig(scene, weaponId = "pistol", anchor = { depth: 7 }, sockets = SOCKETS) {
  return createPlayerEquipmentRig(scene, {
    anchor,
    bodyTextureKey: "body-sheet",
    definition: getPlayerEquipmentDefinition(weaponId),
    sockets
  });
}

function render(rig, overrides = {}) {
  return rig.render({
    footX: 100,
    footY: 200,
    frame: 0,
    bodyFacing: "left",
    visualAimFacing: "left",
    aimAngle: Math.PI,
    recoilPx: 0,
    bodyRotation: 0,
    visible: true,
    alpha: 1,
    ...overrides
  });
}

function byTexture(scene, textureKey) {
  return scene.created.find(({ texture }) => texture?.key === textureKey);
}

function assertNear(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
}

function assertDestroyedExactlyOnce(created) {
  for (const visual of created) {
    assert.equal(visual.calls.filter(([name]) => name === "destroy").length, 1, visual.texture?.key);
    assert.equal(visual.active, false, visual.texture?.key);
  }
}

test("allocates only body, complete pose pairs and optional body-local pack", () => {
  for (const weaponId of ["pistol", "tesla"]) {
    const scene = createScene();
    const definition = getPlayerEquipmentDefinition(weaponId);
    const rig = createRig(scene, weaponId);
    const expectedKeys = [
      "body-sheet",
      definition.aimBackTextureKey,
      ...(definition.powerModuleTextureKey ? [definition.powerModuleTextureKey] : []),
      definition.aimFrontTextureKey,
      definition.aimRecoilBackTextureKey,
      definition.aimRecoilFrontTextureKey
    ];

    assert.deepEqual(scene.created.map(({ texture }) => texture?.key), expectedKeys);
    assert.equal(scene.graphicsCreated.length, 0, "complete poses are baked, never runtime Graphics rods");
    assert.ok(scene.created.every(({ type, body }) => type === "sprite" && body == null));
    assert.equal(render(rig), true);
    assert.ok(scene.created.every(({ originX, originY }) => originX === 0.5 && originY === 56 / 64));
  }
});

test("selects a complete sixteen-direction pose and keeps every layer on the same anchor", () => {
  const scene = createScene();
  const definition = getPlayerEquipmentDefinition("pistol");
  const rig = createRig(scene);
  const angle = -Math.PI / 4;

  assert.equal(render(rig, { frame: 2, aimAngle: angle, recoilPx: 2, bodyRotation: 0.04 }), true);
  const poses = [
    byTexture(scene, definition.aimBackTextureKey),
    byTexture(scene, definition.aimFrontTextureKey),
    byTexture(scene, definition.aimRecoilBackTextureKey),
    byTexture(scene, definition.aimRecoilFrontTextureKey)
  ];
  assert.ok(poses.every(({ frame }) => frame === 72), "direction 14 * five walk frames + frame 2");
  assert.ok(poses.every(({ x, y, rotation }) => x === 100 && y === 200 && rotation === 0.04));
  assert.equal(rig.snapshot().directionIndex, 14);
  assert.equal(rig.snapshot().recoilActive, true);
  assert.equal(rig.snapshot().aimAngle, angle);
});

test("keeps body, Tesla pack and complete poses mirrored while aim stays independent", () => {
  const scene = createScene();
  const definition = getPlayerEquipmentDefinition("tesla");
  const rig = createRig(scene, "tesla");
  const angle = Math.PI / 2;

  assert.equal(render(rig, {
    frame: 1,
    bodyFacing: "right",
    visualAimFacing: "right",
    aimAngle: angle,
    recoilPx: 3,
    bodyRotation: 0.07
  }), true);
  const body = byTexture(scene, "body-sheet");
  const pack = byTexture(scene, definition.powerModuleTextureKey);
  const poses = [
    byTexture(scene, definition.aimBackTextureKey),
    byTexture(scene, definition.aimFrontTextureKey),
    byTexture(scene, definition.aimRecoilBackTextureKey),
    byTexture(scene, definition.aimRecoilFrontTextureKey)
  ];
  assert.ok([body, pack, ...poses].every(({ flipX }) => flipX === true));
  assert.ok([body, pack, ...poses].every(({ rotation }) => rotation === 0.07));
  assert.deepEqual([pack.x, pack.y], [100, 200], "pack remains body-local");
  assert.ok(poses.every(({ frame }) => frame === 21));
});

test("derives the action point from the same quantized pose and baked recoil", () => {
  const anchor = { depth: 3, x: 9, y: 11, body: { width: 24, height: 24, velocity: { x: 2, y: 3 } } };
  const before = structuredClone(anchor);
  const scene = createScene();
  const rig = createRig(scene, "pistol", anchor);

  render(rig, { aimAngle: 0, recoilPx: 2 });
  assert.deepEqual(rig.getActionPoint(), { x: 131, y: 173 });
  assert.deepEqual(rig.getActionPoint({ aimAngle: Math.PI / 2, recoilPx: 2 }), { x: 103, y: 207 });
  assert.deepEqual(rig.getActionPoint({ aimAngle: 0, recoilPx: 0 }), { x: 133, y: 173 });
  assert.deepEqual(anchor, before, "rig never writes the physics anchor or its 24x24 body");
});

test("keeps the complete front pose above the body at every aim angle", () => {
  const scene = createScene();
  const definition = getPlayerEquipmentDefinition("pistol");
  const rig = createRig(scene);
  const body = byTexture(scene, "body-sheet");
  const back = [
    byTexture(scene, definition.aimBackTextureKey),
    byTexture(scene, definition.aimRecoilBackTextureKey)
  ];
  const front = [
    byTexture(scene, definition.aimFrontTextureKey),
    byTexture(scene, definition.aimRecoilFrontTextureKey)
  ];

  for (let direction = 0; direction < 16; direction += 1) {
    render(rig, { aimAngle: direction * (Math.PI / 8) });
    assert.ok(
      back.every(({ depth }) => depth < body.depth) && front.every(({ depth }) => depth > body.depth),
      `direction ${direction} keeps the complete weapon visible`
    );
  }
});

test("propagates alpha tint pause and visibility to every owned sprite", () => {
  const scene = createScene();
  const rig = createRig(scene, "tesla");
  render(rig, { alpha: 0.4, visible: false });
  assert.equal(rig.setAlpha(0.25), true);
  assert.equal(rig.setTint(0xff0000), true);
  assert.equal(rig.clearTint(), true);
  assert.equal(rig.setPaused(true), true);
  assert.equal(rig.setPaused(false), true);
  assert.ok(scene.created.every(({ alpha, visible, tint }) => alpha === 0.25 && !visible && tint === null));
  assert.ok(scene.created.every(({ anims }) => anims.pauseCalls === 1 && anims.resumeCalls === 1));
});

test("rolls every partial sprite allocation back when creation or a required method fails", () => {
  for (const options of [
    { failAt: 4 },
    { missingMethod: { allocation: 3, name: "setOrigin" } }
  ]) {
    const scene = createScene(options);
    assert.throws(() => createRig(scene, "tesla"), /rig/i);
    assertDestroyedExactlyOnce(scene.created);
  }
});

test("removes an incomplete partial sprite through the display list when destroy is missing", () => {
  const scene = createScene({ missingMethod: { allocation: 3, name: "destroy" } });

  assert.throws(() => createRig(scene, "tesla"), /rig/i);
  assert.equal(scene.created[0].active, false);
  assert.equal(scene.created[1].active, false);
  assert.equal(scene.created[0].calls.filter(([name]) => name === "destroy").length, 1);
  assert.equal(scene.created[1].calls.filter(([name]) => name === "destroy").length, 1);
  assert.deepEqual(scene.removed, [scene.created[2]]);
  assert.equal(scene.created[2].active, false);
});

test("rejects invalid presentation inputs and render states without partial writes", () => {
  const scene = createScene();
  assert.throws(() => createPlayerEquipmentRig(scene, {
    anchor: { depth: 2 },
    bodyTextureKey: "body-sheet",
    definition: getPlayerEquipmentDefinition("pistol"),
    sockets: []
  }), /requires presentation inputs/);
  assert.equal(scene.created.length, 0);

  const validScene = createScene();
  const rig = createRig(validScene);
  assert.equal(render(rig, { visualAimFacing: "up" }), false);
  assert.equal(render(rig, { frame: -1 }), false);
});

test("destroy is idempotent and leaves render and action-point queries inert", () => {
  const scene = createScene();
  const rig = createRig(scene);
  render(rig);
  assert.equal(rig.destroy(), true);
  assert.equal(rig.destroy(), true);
  assertDestroyedExactlyOnce(scene.created);
  assert.equal(rig.getActionPoint(), null);
  assert.equal(rig.render({}), false);
  assert.equal(rig.snapshot().destroyed, true);
});
