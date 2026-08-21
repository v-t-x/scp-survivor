import test from "node:test";
import assert from "node:assert/strict";

import { createPlayerEquipmentRig } from "../src/art/playerEquipmentRig.js";
import { getPlayerEquipmentDefinition } from "../src/art/playerEquipmentDefinitions.js";

const SOCKETS = Object.freeze(Array.from({ length: 5 }, (_, index) => Object.freeze({
  index,
  gripX: 21,
  gripY: 31,
  supportX: 36,
  supportY: 33,
  equipmentLayer: "front"
})));

function createSprite(textureKey) {
  return {
    texture: { key: textureKey },
    body: undefined,
    active: true,
    visible: true,
    alpha: 1,
    rotation: 0,
    anims: { pause() {}, resume() {} },
    setOrigin(x, y) { this.originX = x; this.originY = y; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setFrame(frame) { this.frame = frame; return this; },
    setFlipX(value) { this.flipX = value; return this; },
    setRotation(value) { this.rotation = value; return this; },
    setDepth(value) { this.depth = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setTint(value) { this.tint = value; return this; },
    clearTint() { this.tint = null; return this; },
    destroy() { this.active = false; }
  };
}

function createScene() {
  const created = [];
  return {
    created,
    children: { remove() {} },
    add: {
      sprite(_x, _y, textureKey) {
        const sprite = createSprite(textureKey);
        created.push(sprite);
        return sprite;
      }
    }
  };
}

function createRig(scene, weaponId = "pistol", anchor = { depth: 7 }) {
  return createPlayerEquipmentRig(scene, {
    anchor,
    bodyTextureKey: "body-sheet",
    definition: getPlayerEquipmentDefinition(weaponId),
    sockets: SOCKETS
  });
}

function render(rig, overrides = {}) {
  return rig.render({
    footX: 100,
    footY: 200,
    frame: 0,
    bodyFacing: "left",
    visualAimFacing: "left",
    aimAngle: 0,
    recoilPx: 0,
    bodyRotation: 0,
    visible: true,
    alpha: 1,
    ...overrides
  });
}

function byTexture(scene, textureKey) {
  return scene.created.find(({ texture }) => texture.key === textureKey);
}

test("allocates the four complete-pose atlases instead of a freely rotating core", () => {
  const scene = createScene();
  const definition = getPlayerEquipmentDefinition("pistol");
  const rig = createRig(scene);

  assert.deepEqual(scene.created.map(({ texture }) => texture.key), [
    "body-sheet",
    definition.aimBackTextureKey,
    definition.aimFrontTextureKey,
    definition.aimRecoilBackTextureKey,
    definition.aimRecoilFrontTextureKey
  ]);
  assert.equal(render(rig, { frame: 2, aimAngle: Math.PI / 8, bodyRotation: 0.04 }), true);
  for (const textureKey of [
    definition.aimBackTextureKey,
    definition.aimFrontTextureKey,
    definition.aimRecoilBackTextureKey,
    definition.aimRecoilFrontTextureKey
  ]) {
    const pose = byTexture(scene, textureKey);
    assert.equal(pose.frame, 7);
    assert.deepEqual([pose.x, pose.y, pose.rotation], [100, 200, 0.04]);
  }
  assert.equal(rig.snapshot().directionIndex, 1);
  assert.equal(rig.snapshot().poseFrame, 7);
});

test("uses sixteen-direction hysteresis so the complete hands do not flicker at a boundary", () => {
  const scene = createScene();
  const rig = createRig(scene);
  const boundary = Math.PI / 16;

  render(rig, { aimAngle: 0 });
  assert.equal(rig.snapshot().directionIndex, 0);
  render(rig, { aimAngle: boundary + 0.03 });
  assert.equal(rig.snapshot().directionIndex, 0);
  render(rig, { aimAngle: boundary + 0.09 });
  assert.equal(rig.snapshot().directionIndex, 1);
  render(rig, { aimAngle: boundary - 0.03 });
  assert.equal(rig.snapshot().directionIndex, 1);
  render(rig, { aimAngle: boundary - 0.09 });
  assert.equal(rig.snapshot().directionIndex, 0);
});

test("switches gun, hands and forearms to recoil together while the shoulders stay planted", () => {
  const scene = createScene();
  const definition = getPlayerEquipmentDefinition("pistol");
  const rig = createRig(scene);
  const normal = [
    byTexture(scene, definition.aimBackTextureKey),
    byTexture(scene, definition.aimFrontTextureKey)
  ];
  const recoil = [
    byTexture(scene, definition.aimRecoilBackTextureKey),
    byTexture(scene, definition.aimRecoilFrontTextureKey)
  ];

  render(rig, { frame: 3, aimAngle: Math.PI / 4, recoilPx: 0 });
  assert.ok(normal.every(({ visible }) => visible));
  assert.ok(recoil.every(({ visible }) => !visible));
  render(rig, { frame: 3, aimAngle: Math.PI / 4, recoilPx: 2 });
  assert.ok(normal.every(({ visible }) => !visible));
  assert.ok(recoil.every(({ visible, frame, x, y }) => visible && frame === 13 && x === 100 && y === 200));
  assert.equal(rig.snapshot().recoilActive, true);
});

test("mirrors the whole Tesla pose and keeps its action point on the same quantized muzzle", () => {
  const scene = createScene();
  const definition = getPlayerEquipmentDefinition("tesla");
  const anchor = { depth: 3, body: { width: 24, height: 24 } };
  const before = structuredClone(anchor);
  const rig = createRig(scene, "tesla", anchor);

  render(rig, { frame: 1, bodyFacing: "right", visualAimFacing: "right", aimAngle: 0 });
  const owned = scene.created.filter(({ texture }) => texture.key !== "body-sheet");
  assert.ok(owned.every(({ flipX }) => flipX === true));
  assert.ok(owned.filter(({ texture }) => texture.key !== definition.powerModuleTextureKey).every(({ frame }) => frame === 41));
  assert.equal(rig.snapshot().directionIndex, 8);

  render(rig, { bodyFacing: "left", aimAngle: 0, recoilPx: 3 });
  assert.deepEqual(rig.getActionPoint(), { x: 127, y: 174 });
  assert.deepEqual(anchor, before);
});
