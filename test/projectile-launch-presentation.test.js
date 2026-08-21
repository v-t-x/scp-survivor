import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";

import { TEXTURES } from "../src/assets/manifest.js";
import { createCombatFeedbackController } from "../src/art/combatFeedback.js";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const braceStart = source.indexOf(") {", start) + 2;
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

async function loadWeaponMethods(...names) {
  const source = await readFile(new URL("../src/scene/weapons.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  const helper = source.slice(source.indexOf("function getClosestPresentationAngle"));
  return new Function(
    "Phaser",
    "BALANCE",
    `"use strict"; ${helper} return ({${methods}});`
  )({
    Math: {
      Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
      DegToRad: (degrees) => (degrees * Math.PI) / 180
    }
  }, {
    upgrades: { projectileSpreadDeg: 8 },
    combat: { maxProjectiles: 8 }
  });
}

async function loadEffectsMethods(...names) {
  const source = await readFile(new URL("../src/scene/effects.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function(`"use strict"; return ({${methods}});`)();
}

function createVisual(x = 0, y = 0, key = null) {
  return {
    x,
    y,
    key,
    active: true,
    visible: true,
    alpha: 1,
    destroyed: false,
    setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
    setOrigin(originX, originY) { this.originX = originX; this.originY = originY; return this; },
    setRotation(rotation) { this.rotation = rotation; return this; },
    setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
    setDepth(depth) { this.depth = depth; return this; },
    setVisible(visible) { this.visible = visible; return this; },
    setAlpha(alpha) { this.alpha = alpha; return this; },
    setTint(tint) { this.tint = tint; return this; },
    clear() { return this; },
    fillStyle() { return this; },
    fillRect() { return this; },
    lineStyle() { return this; },
    lineBetween() { return this; },
    strokeRect() { return this; },
    strokeCircle() { return this; },
    destroy() {
      this.active = false;
      this.visible = false;
      this.destroyed = true;
    }
  };
}

function createScene({
  actionPoint = { x: 132, y: 92, vfxType: "ballistic" },
  imageFactory = null
} = {}) {
  const images = [];
  const graphics = [];
  const scene = {
    time: { now: 0 },
    textures: { exists: () => true },
    player: { x: 100, y: 100, active: true },
    playerPresentation: {
      notifyAttack() { return true; },
      getAttackEffectOrigin() { return actionPoint; }
    },
    add: {
      image(x, y, key) {
        const visual = imageFactory
          ? imageFactory({ x, y, key, index: images.length })
          : createVisual(x, y, key);
        images.push(visual);
        return visual;
      },
      graphics() {
        const visual = createVisual();
        graphics.push(visual);
        return visual;
      }
    }
  };
  return { scene, images, graphics };
}

function createProjectile(overrides = {}) {
  const events = new EventEmitter();
  return Object.assign(events, {
    x: 100,
    y: 100,
    originX: 100,
    originY: 100,
    maxRange: 420,
    penetration: 2,
    active: true,
    visible: true,
    body: {
      enable: true,
      velocity: { x: 420, y: 0 }
    },
    setVisible(visible) {
      this.visible = visible;
      return this;
    }
  }, overrides);
}

test("formal ballistic shots launch a nonphysical proxy at the action point without moving the authoritative projectile", () => {
  const { scene, images } = createScene();
  const controller = createCombatFeedbackController(scene);
  const projectile = createProjectile();
  const gameplayBefore = {
    x: projectile.x,
    y: projectile.y,
    originX: projectile.originX,
    originY: projectile.originY,
    maxRange: projectile.maxRange,
    penetration: projectile.penetration,
    velocityX: projectile.body.velocity.x,
    velocityY: projectile.body.velocity.y
  };

  assert.equal(controller.notifyAttack({
    weaponId: "pistol",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: false
  }, [projectile]), true);

  assert.equal(images.length, 1, "one visual-only launch proxy is created for the committed bullet");
  assert.equal(images[0].key, TEXTURES.bullet);
  assert.deepEqual([images[0].x, images[0].y], [132, 92], "the proxy begins at this shot's exact action point");
  assert.deepEqual(
    [images[0].displayWidth, images[0].displayHeight, images[0].rotation, images[0].tint],
    [12, 3, 0, 0xffd27a],
    "the muzzle bridge reads as a short directional rifle tracer"
  );
  assert.equal(projectile.visible, false, "only the physical projectile display is hidden during the launch bridge");
  assert.equal(projectile.active, true);
  assert.equal(projectile.body.enable, true);
  assert.deepEqual({
    x: projectile.x,
    y: projectile.y,
    originX: projectile.originX,
    originY: projectile.originY,
    maxRange: projectile.maxRange,
    penetration: projectile.penetration,
    velocityX: projectile.body.velocity.x,
    velocityY: projectile.body.velocity.y
  }, gameplayBefore, "launch presentation cannot mutate gameplay trajectory, range, or penetration state");
});

test("flash and launch proxy share the same pre-recoil muzzle snapshot", () => {
  const { scene, images, graphics } = createScene();
  const events = [];
  let recoilActive = false;
  scene.playerPresentation = {
    getAttackEffectOrigin() {
      events.push("origin");
      return recoilActive
        ? { x: 129, y: 92, vfxType: "ballistic" }
        : { x: 132, y: 92, vfxType: "ballistic" };
    },
    notifyAttack() {
      events.push("recoil");
      recoilActive = true;
      return true;
    }
  };
  const controller = createCombatFeedbackController(scene);
  const projectile = createProjectile();

  assert.equal(controller.notifyAttack({
    weaponId: "pistol",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: false
  }, [projectile]), true);
  assert.deepEqual(events, ["origin", "recoil"]);
  assert.deepEqual([graphics[0].x, graphics[0].y], [132, 92]);
  assert.deepEqual([images[0].x, images[0].y], [132, 92]);
});

test("the launch bridge tracks a moving physical projectile and hands visibility back after 70ms", () => {
  const { scene, images } = createScene();
  const controller = createCombatFeedbackController(scene);
  const projectile = createProjectile();

  controller.notifyAttack({
    weaponId: "shotgun",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: true
  }, [projectile]);
  const proxy = images[0];

  projectile.x = 114;
  projectile.y = 101;
  controller.update(35);
  assert.deepEqual([proxy.x, proxy.y], [130, 97], "midway, the muzzle offset is half blended into the moving bullet");
  assert.equal(projectile.visible, false);
  assert.equal(projectile.active, true);
  assert.equal(projectile.body.enable, true);

  controller.update(69);
  assert.equal(projectile.visible, false, "the physical display stays hidden throughout the bounded bridge");
  assert.equal(proxy.visible, true);

  controller.update(70);
  assert.equal(projectile.visible, true, "the authoritative bullet becomes visible at bridge completion");
  assert.equal(projectile.active, true);
  assert.equal(projectile.body.enable, true);
  assert.equal(proxy.visible, false, "the nonphysical proxy is released at handoff");
});

test("pistol and shotgun route their exact committed projectile objects through the presentation seam", async () => {
  const { attackWithPistol, attackWithShotgun } = await loadWeaponMethods(
    "attackWithPistol",
    "attackWithShotgun"
  );

  for (const [weaponId, attack, weapon] of [
    ["pistol", attackWithPistol, { range: 300, damage: 4, projectileSpeed: 220 }],
    ["shotgun", attackWithShotgun, {
      range: 300,
      triggerRange: 260,
      damage: 8,
      projectileSpeed: 180,
      pelletCount: 3,
      spreadDeg: 20,
      currentShells: 2,
      nextShotId: 7,
      isReloading: false,
      reloadDurationMs: 900,
      nextAttackAtMs: 0
    }]
  ]) {
    const committed = [];
    const presentationCalls = [];
    const scene = {
      player: { x: 100, y: 100 },
      projectileCount: 2,
      bulletPenetration: 1,
      elapsedSurvivalMs: 1_000,
      bossPhaseActive: false,
      findNearestEnemy: () => ({ x: 200, y: 100, active: true }),
      playSound() {},
      spawnPlayerProjectile(payload) {
        const projectile = { id: `${weaponId}-${committed.length}`, presentationAngle: payload.angle };
        committed.push(projectile);
        return projectile;
      },
      emitAttackPresentation(...args) {
        presentationCalls.push(args);
      }
    };

    assert.equal(attack.call(scene, weapon), true);
    assert.equal(presentationCalls.length, 1);
    assert.equal(presentationCalls[0].length, 3, `${weaponId} supplies the committed-projectile channel`);
    assert.equal(presentationCalls[0][2].length, committed.length);
    assert.ok(
      presentationCalls[0][2].every((projectile, index) => projectile === committed[index]),
      `${weaponId} forwards identities rather than gameplay copies`
    );
  }
});

test("the effects seam forwards committed projectiles only to combat feedback", async () => {
  const { emitAttackPresentation } = await loadEffectsMethods("emitAttackPresentation");
  const projectile = createProjectile();
  const notifications = [];
  const scene = {
    combatFeedback: {
      notifyAttack(...args) {
        notifications.push(args);
        return true;
      }
    },
    spawnMuzzleFlash() {
      throw new Error("legacy muzzle must stay suppressed");
    }
  };
  const snapshot = { weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false };

  emitAttackPresentation.call(scene, snapshot, 0, [projectile]);

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0][0], snapshot);
  assert.deepEqual(notifications[0][1], [projectile]);
  assert.equal(notifications[0][1][0], projectile);
});

test("a partial proxy allocation failure atomically keeps every physical projectile visible", () => {
  const { scene, images } = createScene({
    imageFactory({ x, y, key, index }) {
      return index === 0 ? createVisual(x, y, key) : null;
    }
  });
  const controller = createCombatFeedbackController(scene);
  const projectiles = [
    createProjectile({ presentationAngle: -0.1 }),
    createProjectile({ presentationAngle: 0.1 })
  ];

  assert.doesNotThrow(() => controller.notifyAttack({
    weaponId: "shotgun",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 2,
    heavy: true
  }, projectiles));

  assert.ok(projectiles.every((projectile) => projectile.visible === true));
  assert.ok(projectiles.every((projectile) => projectile.active === true));
  assert.ok(projectiles.every((projectile) => projectile.body.enable === true));
  assert.equal(images[0].visible, false, "the first staged proxy is released when the burst cannot commit atomically");
  assert.equal(images[1], null, "the fixture reproduces a null second allocation");
});

test("pause freezes launch handoff and an early projectile destroy releases its proxy", () => {
  const { scene, images } = createScene();
  const controller = createCombatFeedbackController(scene);
  const projectile = createProjectile();

  controller.notifyAttack({
    weaponId: "pistol",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: false
  }, [projectile]);
  const proxy = images[0];
  controller.setPaused(true);
  projectile.x = 120;
  controller.update(1_000);
  assert.deepEqual([proxy.x, proxy.y], [132, 92], "paused wall time cannot advance the visual bridge");
  assert.equal(projectile.visible, false);

  controller.setPaused(false);
  controller.update(35);
  assert.deepEqual([proxy.x, proxy.y], [136, 96]);
  projectile.active = false;
  projectile.body.enable = false;
  projectile.emit("destroy");
  assert.equal(proxy.visible, false, "a destroyed physical bullet cannot leave an orphan launch proxy");
});

test("controller destroy restores live physical bullets and destroys owned launch visuals", () => {
  const { scene, images } = createScene();
  const controller = createCombatFeedbackController(scene);
  const projectile = createProjectile();

  controller.notifyAttack({
    weaponId: "shotgun",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: true
  }, [projectile]);
  const proxy = images[0];
  assert.equal(projectile.visible, false);

  controller.destroy();

  assert.equal(projectile.visible, true);
  assert.equal(projectile.active, true);
  assert.equal(projectile.body.enable, true);
  assert.equal(proxy.destroyed, true);
});

test("Tesla attacks never create launch proxies or hide physical projectiles", () => {
  const { scene, images } = createScene({
    actionPoint: { x: 132, y: 92, vfxType: "tesla" }
  });
  const controller = createCombatFeedbackController(scene);
  const projectile = createProjectile();

  assert.equal(controller.notifyAttack({
    weaponId: "tesla",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: true
  }, [projectile]), true);

  assert.deepEqual(images, []);
  assert.equal(projectile.visible, true);
  assert.equal(projectile.active, true);
  assert.equal(projectile.body.enable, true);
});
