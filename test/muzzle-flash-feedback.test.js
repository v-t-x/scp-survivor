import test from "node:test";
import assert from "node:assert/strict";

// Approved package (user, 2026-07-28): the body follows movement and never
// rotates for shots; shot direction is sold by muzzle VFX instead. The attack
// flash therefore renders at the muzzle point ahead of the player, carries a
// short forward tracer, and each shot applies a brief recoil skew pulse to
// the player sprite (never its position, scale or physics body).

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

test("attack flash renders at the muzzle point ahead of the player, not the body center", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, graphics } = createMuzzleScene();
  const controller = createCombatFeedbackController(scene);

  assert.equal(controller.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false }), true);
  assert.equal(graphics.length, 1);
  assert.equal(graphics[0].x, 114, "light shots flash 14px ahead of the origin");
  assert.equal(graphics[0].y, 100);
  assert.equal(graphics[0].rotation, 0);

  controller.update(200);
  assert.equal(controller.notifyAttack({ weaponId: "shotgun", originX: 100, originY: 100, angle: Math.PI / 2, shotCount: 3, heavy: true }), true);
  assert.equal(graphics[0].x, 100);
  assert.equal(graphics[0].y, 116, "heavy shots flash 16px ahead of the origin");
  assert.equal(graphics[0].rotation, Math.PI / 2);
});

test("the attack graphic carries a flash core and a forward tracer", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, graphicsCalls } = createMuzzleScene();
  const controller = createCombatFeedbackController(scene);

  controller.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false });
  const lines = graphicsCalls.filter(([name]) => name === "lineBetween");
  const fills = graphicsCalls.filter(([name]) => name === "fillRect");
  assert.ok(fills.length >= 1, "a filled muzzle flash core must be drawn");
  assert.ok(
    lines.some(([, x1, y1, x2]) => x2 >= 30 && y1 === 0),
    "a forward tracer of at least 30px must be drawn"
  );

  graphicsCalls.length = 0;
  controller.update(200);
  controller.notifyAttack({ weaponId: "shotgun", originX: 100, originY: 100, angle: 0, shotCount: 3, heavy: true });
  const heavyLines = graphicsCalls.filter(([name]) => name === "lineBetween");
  assert.ok(
    heavyLines.some(([, , y1, , y2]) => y1 === 0 && y2 < 0) && heavyLines.some(([, , y1, , y2]) => y1 === 0 && y2 > 0),
    "heavy shots draw a spread fan"
  );
});

test("each shot applies a brief recoil skew pulse to the player sprite opposite the shot", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { scene, tweenCalls } = createMuzzleScene();
  const controller = createCombatFeedbackController(scene);

  controller.notifyAttack({ weaponId: "pistol", originX: 100, originY: 100, angle: 0, shotCount: 1, heavy: false });
  assert.equal(tweenCalls.length, 1, "one recoil tween per shot");
  const recoil = tweenCalls[0];
  assert.equal(recoil.targets, scene.player, "recoil targets only the player sprite");
  assert.equal(recoil.yoyo, true, "recoil returns to neutral");
  assert.ok(recoil.duration <= 100, "recoil stays under 100ms per direction");
  assert.ok(recoil.props.skewX.to < 0, "a rightward shot kicks the sprite leftward");
  assert.equal(recoil.props.skewX.from, 0);
  assert.ok(Math.abs(recoil.props.skewX.to) <= 0.08, "recoil stays subtle");
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
