import test from "node:test";
import assert from "node:assert/strict";
import { TEXTURES } from "../src/assets/manifest.js";
import { createWeaponRigView, WEAPON_RIG_LAYOUT } from "../src/art/weaponRigView.js";

function displayObject(type, args = []) {
  return {
    type,
    args,
    visible: true,
    alpha: 1,
    x: 0,
    y: 0,
    scale: 1,
    frame: null,
    commands: [],
    calls: [],
    destroyCount: 0,
    setDepth(value) { this.depth = value; this.calls.push(["setDepth", value]); return this; },
    setPosition(x, y) { this.x = x; this.y = y; this.calls.push(["setPosition", x, y]); return this; },
    setFrame(value) { this.frame = value; this.calls.push(["setFrame", value]); return this; },
    setScale(value) { this.scale = value; this.calls.push(["setScale", value]); return this; },
    setVisible(value) { this.visible = value; this.calls.push(["setVisible", value]); return this; },
    setAlpha(value) { this.alpha = value; this.calls.push(["setAlpha", value]); return this; },
    setOrigin(x, y) { this.origin = [x, y]; this.calls.push(["setOrigin", x, y]); return this; },
    clear() { this.commands = []; this.calls.push(["clear"]); return this; },
    fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; },
    lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; },
    fillCircle(...args) { this.commands.push(["fillCircle", ...args]); return this; },
    strokeCircle(...args) { this.commands.push(["strokeCircle", ...args]); return this; },
    fillRect(...args) { this.commands.push(["fillRect", ...args]); return this; },
    strokeRect(...args) { this.commands.push(["strokeRect", ...args]); return this; },
    lineBetween(...args) { this.commands.push(["lineBetween", ...args]); return this; },
    beginPath() { this.commands.push(["beginPath"]); return this; },
    moveTo(...args) { this.commands.push(["moveTo", ...args]); return this; },
    lineTo(...args) { this.commands.push(["lineTo", ...args]); return this; },
    closePath() { this.commands.push(["closePath"]); return this; },
    fillPath() { this.commands.push(["fillPath"]); return this; },
    strokePath() { this.commands.push(["strokePath"]); return this; },
    destroy() { this.destroyCount += 1; this.destroyed = true; return this; }
  };
}

function makeScene() {
  const scene = { created: [], tweens: { created: [] } };
  scene.add = {
    graphics() {
      const object = displayObject("graphics");
      scene.created.push(object);
      return object;
    },
    image(...args) {
      const object = displayObject("image", args);
      scene.created.push(object);
      return object;
    }
  };
  scene.tweens.add = (config) => {
    const tween = {
      config,
      stopCount: 0,
      pauseCount: 0,
      resumeCount: 0,
      stop() { this.stopCount += 1; return this; },
      pause() { this.pauseCount += 1; return this; },
      resume() { this.resumeCount += 1; return this; }
    };
    scene.tweens.created.push(tween);
    return tween;
  };
  return scene;
}

function makeThrowingScene(throwOnAdd) {
  const scene = { created: [] };
  let addCount = 0;
  function createObject(type, args = []) {
    addCount += 1;
    if (addCount === throwOnAdd) {
      throw new Error(`construction failed at ${type}`);
    }
    const object = displayObject(type, args);
    scene.created.push(object);
    return object;
  }
  scene.add = {
    graphics() { return createObject("graphics"); },
    image(...args) { return createObject("image", args); }
  };
  return scene;
}

function moduleImages(scene) {
  return scene.created.filter((object) => object.type === "image");
}

function statusGraphics(scene) {
  return scene.created.filter((object) => object.type === "graphics")[1];
}

test("weapon rig exposes its isolated controller contract and starts hidden", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene, { depth: 16 });

  assert.equal(typeof rig.update, "function");
  assert.equal(typeof rig.fire, "function");
  assert.equal(typeof rig.setPaused, "function");
  assert.equal(typeof rig.destroy, "function");
  assert.equal(rig.objects.length, 7);
  assert.ok(rig.objects.every((object) => object.visible === false));
  assert.deepEqual(moduleImages(scene).map(({ args }) => args[2]), [
    TEXTURES.weaponRigPistol,
    TEXTURES.weaponRigBreacher,
    TEXTURES.weaponRigTesla
  ]);
});

test("weapon rig locks the final low-ready layout without touching player physics", () => {
  assert.deepEqual(WEAPON_RIG_LAYOUT, {
    shoulderX: 7,
    shoulderY: -13,
    moduleScale: 0.5,
    muzzleDistance: 18,
    tracerDistance: 7
  });
  assert.equal(Object.isFrozen(WEAPON_RIG_LAYOUT), true);

  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const modules = moduleImages(scene);
  assert.ok(modules.every((module) => module.scale === WEAPON_RIG_LAYOUT.moduleScale));

  const playerBody = Object.freeze({ width: 24, height: 24, x: 0, y: 0 });
  const player = Object.freeze({ body: playerBody });
  const before = structuredClone(player);
  for (const [index, weaponId] of ["pistol", "shotgun", "tesla"].entries()) {
    rig.update({
      anchorX: 100,
      anchorY: 200,
      player,
      weaponId,
      aimAngle: 0,
      hasTarget: true
    }, 16);
    assert.equal(modules[index].x, 100 + WEAPON_RIG_LAYOUT.shoulderX);
    assert.equal(modules[index].y, 200 + WEAPON_RIG_LAYOUT.shoulderY);
  }
  assert.deepEqual(player, before);
});

test("construction failures destroy every object created before add.graphics or add.image throws", () => {
  for (const throwOnAdd of [2, 4]) {
    const scene = makeThrowingScene(throwOnAdd);

    assert.throws(() => createWeaponRigView(scene), /construction failed/);
    assert.equal(scene.created.length, throwOnAdd - 1);
    assert.ok(scene.created.every((object) => object.destroyCount === 1));
  }
});

test("update selects one direction sheet without runtime pixel-art rotation", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const [pistol, breacher, tesla] = moduleImages(scene);

  rig.update({
    anchorX: 100,
    anchorY: 200,
    weaponId: "pistol",
    aimAngle: Math.PI / 2,
    hasTarget: true,
    projectileCount: 3
  }, 16);

  assert.equal(pistol.visible, true);
  assert.equal(breacher.visible, false);
  assert.equal(tesla.visible, false);
  assert.equal(pistol.frame, 2);
  assert.equal(pistol.x, 107);
  assert.equal(pistol.y, 187);
  assert.equal(pistol.calls.filter(([name]) => name === "setRotation").length, 0);
  assert.equal(pistol.alpha, 1);
});

test("unknown weapons stow the generic rig and never fire", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const [base, status, ...images] = rig.objects;

  rig.update({ anchorX: 12, anchorY: 18, weaponId: "unknown", aimAngle: 0 }, 16);
  assert.equal(base.visible, true);
  assert.equal(status.visible, true);
  assert.ok(images.every((image) => image.visible === false));

  rig.fire({ anchorX: 12, anchorY: 18, weaponId: "unknown", aimAngle: 0 });
  assert.equal(scene.tweens.created.length, 0);
});

test("target grace holds the aim at 249ms and uses the travel pose at 250ms", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const [pistol] = moduleImages(scene);

  rig.update({ anchorX: 0, anchorY: 0, weaponId: "pistol", aimAngle: Math.PI / 2, hasTarget: true }, 16);
  rig.update({ anchorX: 0, anchorY: 0, weaponId: "pistol", targetAgeMs: 249, hasTarget: false }, 16);
  assert.equal(pistol.frame, 2);
  rig.update({ anchorX: 0, anchorY: 0, weaponId: "pistol", targetAgeMs: 250, hasTarget: false }, 16);
  assert.equal(pistol.frame, 3);
});

test("status graphics represent pistol channels, shotgun shells and Tesla charge", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const status = statusGraphics(scene);

  rig.update({ weaponId: "pistol", projectileCount: 5 }, 16);
  const pistolIndicators = status.commands.filter(([name]) => name === "fillRect").length;
  assert.ok(pistolIndicators >= 5);

  rig.update({ weaponId: "shotgun", hasTarget: true, isReloading: true, currentShells: 2, magazineSize: 4 }, 16);
  assert.ok(status.commands.filter(([name]) => name === "fillCircle").length >= 2);
  assert.ok(status.commands.some(([name]) => name === "lineBetween"));

  rig.update({ weaponId: "tesla", hasTarget: true, chainTargets: 6, cooldownRatio: 0.25 }, 16);
  assert.ok(status.commands.filter(([name]) => name === "fillCircle").length >= 6);
  assert.ok(status.commands.some(([name]) => name === "strokeCircle"));
});

test("shotgun reload lowers the module into a distinct travel pose without allocating objects", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const [, breacher] = moduleImages(scene);
  const objectCount = scene.created.length;

  rig.update({
    anchorX: 100,
    anchorY: 200,
    weaponId: "shotgun",
    aimAngle: 0,
    hasTarget: true,
    isReloading: false,
    currentShells: 1,
    magazineSize: 4
  }, 16);
  assert.deepEqual([breacher.x, breacher.y, breacher.frame], [107, 187, 0]);

  rig.update({
    anchorX: 100,
    anchorY: 200,
    weaponId: "shotgun",
    aimAngle: 0,
    hasTarget: true,
    isReloading: true,
    currentShells: 0,
    magazineSize: 4
  }, 16);

  assert.deepEqual([breacher.x, breacher.y, breacher.frame], [107, 193, 3]);
  assert.equal(scene.created.length, objectCount);
});

test("shotgun fire drives a reusable module recoil that pauses, replaces and resets", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const [, breacher] = moduleImages(scene);
  const snapshot = {
    anchorX: 100,
    anchorY: 200,
    weaponId: "shotgun",
    aimAngle: 0,
    hasTarget: true,
    currentShells: 3,
    magazineSize: 4
  };
  const objectCount = scene.created.length;

  rig.update(snapshot, 16);
  rig.fire(snapshot);
  rig.update(snapshot, 16);

  assert.deepEqual([breacher.x, breacher.y], [102, 187]);
  assert.equal(scene.created.length, objectCount);
  assert.equal(scene.tweens.created.length, 2);
  const [firstEffect, firstRecoil] = scene.tweens.created;
  assert.equal(firstRecoil.config.duration, 140);

  rig.setPaused(true);
  assert.deepEqual([firstEffect.pauseCount, firstRecoil.pauseCount], [1, 1]);
  rig.setPaused(false);
  assert.deepEqual([firstEffect.resumeCount, firstRecoil.resumeCount], [1, 1]);

  rig.fire(snapshot);
  assert.deepEqual([firstEffect.stopCount, firstRecoil.stopCount], [1, 1]);
  assert.equal(scene.tweens.created.length, 4);
  const secondRecoil = scene.tweens.created[3];
  secondRecoil.config.onComplete(secondRecoil);
  rig.update(snapshot, 16);
  assert.deepEqual([breacher.x, breacher.y], [107, 187]);
});

test("outage dims status indicators without dimming the physical module", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const status = statusGraphics(scene);
  const [pistol] = moduleImages(scene);

  rig.update({ weaponId: "pistol", projectileCount: 1, outageStrength: 1 }, 16);
  const fillStyles = status.commands
    .filter(([name]) => name === "fillStyle")
    .map(([, , alpha]) => alpha);

  assert.deepEqual(fillStyles.slice(0, 2), [1, 1], "physical pivot fills remain full alpha");
  assert.ok(fillStyles.slice(2).every((alpha) => alpha < 1), "status-light fills dim during outage");
  assert.equal(pistol.alpha, 1);
});

test("fire tracer bridges from the shoulder muzzle back toward the center-origin path", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const snapshot = { weaponId: "pistol", anchorX: 100, anchorY: 200, aimAngle: 0, projectileCount: 1 };

  rig.fire(snapshot);

  const tracer = scene.created.at(-1);
  const line = tracer.commands.find(([name]) => name === "lineBetween");
  assert.deepEqual(line, ["lineBetween", 125, 187, 118, 187]);
  assert.ok(line[1] > line[3], "tracer endpoint must move back toward the player center");
});

test("fire reuses one muzzle and tracer and replaces the prior effect tween", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const createdBeforeFire = scene.created.length;
  const snapshot = { weaponId: "pistol", anchorX: 100, anchorY: 200, aimAngle: 0, projectileCount: 1 };

  rig.fire(snapshot);
  const [firstTween] = scene.tweens.created;
  const [muzzle, tracer] = scene.created.slice(-2);
  rig.fire(snapshot);
  const [, secondTween] = scene.tweens.created;

  assert.equal(scene.created.length, createdBeforeFire);
  assert.equal(scene.tweens.created.length, 2);
  assert.equal(firstTween.stopCount, 1);
  assert.deepEqual(secondTween.config.targets, [muzzle, tracer]);
  assert.equal(muzzle.visible, true);
  assert.equal(tracer.visible, true);
});

test("pause blocks new effects and only pauses owned tweens", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const snapshot = { weaponId: "tesla", anchorX: 50, anchorY: 60, aimAngle: 0 };

  rig.fire(snapshot);
  const [tween] = scene.tweens.created;
  rig.setPaused(true);
  rig.fire(snapshot);
  assert.equal(scene.tweens.created.length, 1);
  assert.equal(tween.pauseCount, 1);
  rig.setPaused(false);
  assert.equal(tween.resumeCount, 1);
});

test("destroy stops and destroys owned resources idempotently", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  rig.fire({ weaponId: "shotgun", anchorX: 0, anchorY: 0, aimAngle: 0 });
  const [tween] = scene.tweens.created;

  rig.destroy();
  rig.destroy();

  assert.equal(tween.stopCount, 1);
  assert.ok(rig.objects.every((object) => object.destroyCount === 1));
});

test("update and fire leave their snapshots unchanged", () => {
  const scene = makeScene();
  const rig = createWeaponRigView(scene);
  const updateSnapshot = {
    anchorX: 100, anchorY: 200, weaponId: "tesla", aimAngle: Math.PI / 4,
    hasTarget: true, chainTargets: 4, cooldownRatio: 0.5, outageStrength: 0.2
  };
  const fireSnapshot = {
    anchorX: 100, anchorY: 200, weaponId: "tesla", aimAngle: Math.PI / 4,
    chainTargets: 4, firedAtMs: 120
  };
  const updateCopy = structuredClone(updateSnapshot);
  const fireCopy = structuredClone(fireSnapshot);

  rig.update(updateSnapshot, 16);
  rig.fire(fireSnapshot);

  assert.deepEqual(updateSnapshot, updateCopy);
  assert.deepEqual(fireSnapshot, fireCopy);
});
