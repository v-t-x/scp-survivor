import test from "node:test";
import assert from "node:assert/strict";

// Approved package (user, 2026-07-28): the body follows movement and never
// rotates for shots; shot direction is sold by muzzle VFX instead. The attack
// flash therefore renders at the muzzle point ahead of the player as a compact
// burst, while the launch proxy carries the tracer. Each shot asks the player to
// apply recoil (never changing anchor position, scale or physics body).

function createGraphicsMock(calls) {
  return {
    active: true,
    clear() { calls.push(["clear"]); return this; },
    lineStyle(width, color, alpha) { calls.push(["lineStyle", width, color, alpha]); return this; },
    lineBetween(x1, y1, x2, y2) { calls.push(["lineBetween", x1, y1, x2, y2]); return this; },
    fillStyle(color, alpha) { calls.push(["fillStyle", color, alpha]); return this; },
    fillRect(x, y, w, h) { calls.push(["fillRect", x, y, w, h]); return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setRotation(value) { this.rotation = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setDepth(value) { this.depth = value; return this; },
    setDisplaySize(w, h) { this.displayWidth = w; this.displayHeight = h; return this; },
    setTint(value) { this.tint = value; return this; },
    setOrigin() { return this; },
    destroy() { this.active = false; this.destroyed = true; }
  };
}

function createMuzzleScene() {
  const graphicsCalls = [];
  const graphics = [];
  const tweenCalls = [];
  const scene = {
    time: { now: 0 },
    textures: { exists: () => true },
    player: { x: 100, y: 100, active: true, skewX: 0, skewY: 0 },
    tweens: {
      add(config) { tweenCalls.push(config); return { remove() {} }; }
    },
    add: {
      image(x, y, key) {
        return {
          x, y, key, active: true,
          setPosition(nx, ny) { this.x = nx; this.y = ny; return this; },
          setOrigin() { return this; },
          setAlpha() { return this; },
          setVisible() { return this; },
          destroy() { this.active = false; this.destroyed = true; }
        };
      },
      graphics() {
        const visual = createGraphicsMock(graphicsCalls);
        graphics.push(visual);
        return visual;
      }
    }
  };
  return { scene, graphics, graphicsCalls, tweenCalls };
}

test("pistol and Tesla feedback use the formal action point while retaining weapon-specific VFX", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, graphics, graphicsCalls } = createMuzzleScene();
  const queries = [];
  scene.playerPresentation = {
    notifyAttack() { return true; },
    getAttackEffectOrigin(payload) {
      queries.push(structuredClone(payload));
      return {
        x: 133,
        y: 87,
        vfxType: payload.weaponId === "tesla" ? "tesla" : "ballistic"
      };
    }
  };
  const controller = createCombatFeedbackController(scene);

  assert.equal(controller.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false }), true);
  assert.equal(graphics.length, 1);
  assert.equal(graphics[0].x, 133, "the ballistic flash starts exactly at the formal equipment action point");
  assert.equal(graphics[0].y, 87);
  assert.equal(graphics[0].rotation, 0);
  const pistolColors = graphicsCalls
    .filter(([name]) => name === "fillStyle" || name === "lineStyle")
    .map(([name, first, second]) => name === "fillStyle" ? first : second);
  assert.ok(pistolColors.includes(0xffd27a), "ballistic feedback uses the amber Foundation core");

  graphicsCalls.length = 0;
  controller.update(200);
  assert.equal(controller.notifyAttack({ weaponId: "tesla", originX: 100, originY: 100, angle: Math.PI / 2, shotCount: 3, heavy: true }), true);
  assert.equal(graphics[0].x, 133, "Tesla uses the same equipment action point without adding a center offset");
  assert.equal(graphics[0].y, 87);
  assert.equal(graphics[0].rotation, Math.PI / 2);
  const teslaColors = graphicsCalls
    .filter(([name]) => name === "fillStyle" || name === "lineStyle")
    .map(([name, first, second]) => name === "fillStyle" ? first : second);
  assert.ok(teslaColors.includes(0x3692ff) && teslaColors.includes(0xe2f7ff));
  assert.ok(!teslaColors.some((color) => [0xffd27a, 0xffb054].includes(color)), "Tesla cannot inherit ballistic orange");
  assert.deepEqual(queries, [
    { weaponId: "pistol", angle: 0 },
    { weaponId: "tesla", angle: Math.PI / 2 }
  ]);
});

test("missing false throwing and invalid action-point queries retain the player-center muzzle offset", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const payload = { weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false };
  const modes = {
    missing: null,
    false: () => false,
    throw: () => { throw new Error("origin unavailable"); },
    invalid: () => ({ x: Number.NaN, y: 250, vfxType: "ballistic" })
  };

  for (const [mode, getAttackEffectOrigin] of Object.entries(modes)) {
    const { scene, graphics } = createMuzzleScene();
    if (mode !== "missing") {
      scene.playerPresentation = {
        notifyAttack() { return true; },
        getAttackEffectOrigin
      };
    }
    const controller = createCombatFeedbackController(scene);

    assert.doesNotThrow(() => controller.notifyAttack(payload));
    assert.deepEqual(
      [graphics[0].x, graphics[0].y],
      [114, 100],
      `${mode} retains the established 14px center-origin fallback`
    );
  }
});

test("ballistic feedback draws a compact white-hot burst while Tesla draws a blue-white three-segment discharge", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, graphicsCalls } = createMuzzleScene();
  const controller = createCombatFeedbackController(scene);

  controller.notifyAttack({ weaponId: "shotgun", originX: 100, originY: 100, angle: 0, shotCount: 3, heavy: true });
  const ballisticLines = graphicsCalls.filter(([name]) => name === "lineBetween");
  const ballisticFills = graphicsCalls.filter(([name]) => name === "fillRect");
  assert.ok(ballisticFills.some(([, , , width, height]) => width === 5 && height === 5), "ballistic core is a visible 5px flare");
  assert.ok(ballisticLines.some(([, x1, y1, x2, y2]) => x1 === 3 && y1 === 0 && x2 === 10 && y2 === 0));
  assert.ok(ballisticLines.every(([, , , x2]) => x2 <= 10), "the burst cannot overlap the launch proxy as a long beam");
  assert.ok(
    ballisticLines.some(([, , , , y2]) => y2 < 0)
      && ballisticLines.some(([, , , , y2]) => y2 > 0),
    "short upper and lower rays make the flash read as a muzzle burst"
  );

  graphicsCalls.length = 0;
  controller.update(200);
  controller.notifyAttack({ weaponId: "tesla", originX: 100, originY: 100, angle: 0, shotCount: 2, heavy: true });
  const teslaLines = graphicsCalls.filter(([name]) => name === "lineBetween");
  const teslaFills = graphicsCalls.filter(([name]) => name === "fillRect");
  const teslaColors = graphicsCalls
    .filter(([name]) => name === "fillStyle" || name === "lineStyle")
    .map(([name, first, second]) => name === "fillStyle" ? first : second);
  assert.ok(teslaFills.some(([, , , width, height]) => width === 3 && height === 3), "Tesla discharge core is exactly 3px");
  assert.ok(teslaLines.some(([, , , , y2]) => y2 < 0) && teslaLines.some(([, , , , y2]) => y2 > 0), "Tesla follows a three-segment zigzag");
  assert.ok(teslaColors.every((color) => [0x3692ff, 0xe2f7ff].includes(color)), "Tesla uses only its blue-white palette");
});

test("default muzzle timing separates the 45ms rifle flash from the 70ms launch proxy and keeps Tesla readable", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");

  const rifleFixture = createMuzzleScene();
  const rifle = createCombatFeedbackController(rifleFixture.scene);
  rifle.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, heavy: false });
  assert.equal(rifleFixture.graphics[0].alpha, 1);
  rifle.update(44);
  assert.equal(rifleFixture.graphics[0].visible, true);
  rifle.update(45);
  assert.equal(rifleFixture.graphics[0].visible, false, "rifle flash ends at 45ms before the proxy handoff");

  const teslaFixture = createMuzzleScene();
  const tesla = createCombatFeedbackController(teslaFixture.scene);
  tesla.notifyAttack({ weaponId: "tesla", originX: 100, originY: 100, angle: 0, heavy: true });
  assert.equal(teslaFixture.graphics[0].alpha, 0.95);
  tesla.update(89);
  assert.equal(teslaFixture.graphics[0].visible, true);
  tesla.update(90);
  assert.equal(teslaFixture.graphics[0].visible, false, "Tesla discharge ends at 90ms");

  const overrideFixture = createMuzzleScene();
  const override = createCombatFeedbackController(overrideFixture.scene, { effectDurationMs: 5 });
  override.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, heavy: false });
  override.update(4);
  assert.equal(overrideFixture.graphics[0].visible, true);
  override.update(5);
  assert.equal(overrideFixture.graphics[0].visible, false);
});

test("tesla-field feedback remains centered and never consumes an equipment action point", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, graphics, graphicsCalls } = createMuzzleScene();
  let originQueries = 0;
  scene.playerPresentation = {
    notifyAttack() { return true; },
    getAttackEffectOrigin() {
      originQueries += 1;
      return { x: 160, y: 70, vfxType: "tesla" };
    }
  };
  const controller = createCombatFeedbackController(scene);

  assert.equal(controller.notifyAttack({ weaponId: "tesla-field", originX: 100, originY: 100, angle: 0, shotCount: 2, heavy: true }), true);
  assert.deepEqual([graphics[0].x, graphics[0].y], [100, 100]);
  assert.equal(originQueries, 0, "the center-owned field cannot be redirected to equipment geometry");
  const colors = graphicsCalls
    .filter(([name]) => name === "fillStyle" || name === "lineStyle")
    .map(([name, first, second]) => name === "fillStyle" ? first : second);
  assert.ok(colors.every((color) => [0x3692ff, 0xe2f7ff].includes(color)));
});

test("each shot routes committed recoil metadata to the visible player presentation", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, tweenCalls } = createMuzzleScene();
  const notifications = [];
  scene.playerPresentation = {
    notifyAttack(payload) {
      notifications.push(structuredClone(payload));
      return true;
    }
  };
  const controller = createCombatFeedbackController(scene);

  controller.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false });
  assert.deepEqual(notifications, [{
    angle: 0,
    weaponId: "pistol",
    heavy: false
  }]);
  assert.equal(tweenCalls.length, 0, "handled visible recoil must not tween the hidden anchor");
});

test("each shot freezes its muzzle origin before recoil changes the visible pose", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, graphics } = createMuzzleScene();
  const events = [];
  let recoilActive = false;
  scene.playerPresentation = {
    getAttackEffectOrigin() {
      events.push("origin");
      return recoilActive
        ? { x: 129, y: 87, vfxType: "ballistic" }
        : { x: 133, y: 87, vfxType: "ballistic" };
    },
    notifyAttack() {
      events.push("recoil");
      recoilActive = true;
      return true;
    }
  };
  const controller = createCombatFeedbackController(scene);

  assert.equal(controller.notifyAttack({
    weaponId: "pistol",
    originX: 100,
    originY: 100,
    angle: 0,
    shotCount: 1,
    heavy: false
  }), true);
  assert.deepEqual(events, ["origin", "recoil"]);
  assert.deepEqual([graphics[0].x, graphics[0].y], [133, 87]);
});

test("missing false and throwing player presentation routes retain the old anchor recoil fallback", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const payload = { weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false };

  for (const mode of ["missing", "false", "throw"]) {
    const { scene, tweenCalls } = createMuzzleScene();
    if (mode === "false") {
      scene.playerPresentation = { notifyAttack: () => false };
    } else if (mode === "throw") {
      scene.playerPresentation = {
        notifyAttack() {
          throw new Error("player presentation failed");
        }
      };
    }
    const controller = createCombatFeedbackController(scene);

    assert.doesNotThrow(() => controller.notifyAttack(payload));
    assert.equal(tweenCalls.length, 1, `${mode} keeps one anchor recoil`);
    const recoil = tweenCalls[0];
    assert.equal(recoil.targets, scene.player, `${mode} fallback targets the legacy anchor`);
    assert.equal(recoil.yoyo, true);
    assert.ok(recoil.duration <= 100);
    assert.ok(recoil.props.skewX.to < 0);
    assert.equal(recoil.props.skewX.from, 0);
    assert.ok(Math.abs(recoil.props.skewX.to) <= 0.08);
  }
});

test("recoil is skipped safely when the player or tween system is unavailable", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");

  const noPlayer = createMuzzleScene();
  delete noPlayer.scene.player;
  const controllerA = createCombatFeedbackController(noPlayer.scene);
  assert.doesNotThrow(() => controllerA.notifyAttack({ weaponId: "pistol", originX: 1, originY: 2, angle: 0.3, shotCount: 1, heavy: false }));
  assert.equal(noPlayer.tweenCalls.length, 0);

  const noTweens = createMuzzleScene();
  noTweens.scene.tweens = { pauseAll() {}, resumeAll() {} };
  const controllerB = createCombatFeedbackController(noTweens.scene);
  assert.doesNotThrow(() => controllerB.notifyAttack({ weaponId: "pistol", originX: 1, originY: 2, angle: 0.3, shotCount: 1, heavy: false }));
});
