import test from "node:test";
import assert from "node:assert/strict";

function createSceneStub({ failOn = null } = {}) {
  const created = [];
  const calls = { image: 0, physics: 0, pauseAll: 0, resumeAll: 0, timerRemove: 0, tweenRemove: 0 };

  function image(x, y, key) {
    calls.image += 1;
    const visual = {
      x, y, key, active: true, visible: true, alpha: 1, displayWidth: 0, displayHeight: 0,
      destroyed: false, destroyCalls: 0,
      setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
      setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
      setAlpha(value) { if (failOn === "setAlpha") throw new Error("display configuration failed"); this.alpha = value; return this; },
      setVisible(value) { this.visible = value; return this; },
      setTint(value) { this.tint = value; return this; },
      setRotation(value) { this.rotation = value; return this; },
      setDepth(value) { this.depth = value; return this; },
      destroy() { this.destroyCalls += 1; this.destroyed = true; }
    };
    if (failOn === "image") throw new Error("image allocation failed");
    created.push(visual);
    return visual;
  }

  return {
    created,
    calls,
    time: { now: 0 },
    add: { image },
    physics: { add: { group() { calls.physics += 1; } } },
    tweens: { pauseAll() { calls.pauseAll += 1; }, resumeAll() { calls.resumeAll += 1; } },
    events: { remove() { calls.timerRemove += 1; } }
  };
}

function createActor() {
  return {
    x: 100,
    y: 200,
    active: true,
    body: { velocity: { x: 4, y: 5 } },
    scaleX: 1.5,
    scaleY: 0.75,
    originX: 0.2,
    originY: 0.8,
    depth: 42
  };
}

async function loadCombatFeedback() {
  const module = await import("../src/art/combatFeedback.js");
  assert.equal(typeof module.createCombatFeedbackController, "function");
  assert.equal(typeof module.createNoopCombatFeedbackController, "function");
  return module;
}

function assertControllerShape(controller) {
  assert.deepEqual(Object.keys(controller).sort(), [
    "destroy", "notifyAttack", "notifyDeath", "notifyHit", "setPaused", "trackActor", "untrackActor", "update"
  ]);
}

test("tracked actors receive one display-only contact shadow without actor mutations", async () => {
  const { createCombatFeedbackController } = await loadCombatFeedback();
  const scene = createSceneStub();
  const actor = createActor();
  const before = structuredClone(actor);
  const controller = createCombatFeedbackController(scene);

  assertControllerShape(controller);
  controller.trackActor(actor, { kind: "enemy", radius: 18, offsetY: 3 });
  controller.trackActor(actor, { kind: "enemy", radius: 18, offsetY: 3 });
  controller.update(10);

  assert.equal(scene.created.length, 1, "trackActor must be idempotent");
  assert.equal(scene.calls.physics, 0, "shadows must not enter a physics group");
  assert.deepEqual(actor, before, "combat feedback must not mutate actor physics or presentation fields");
  assert.equal(scene.created[0].key, "contact-shadow");
  assert.equal(scene.created[0].x, 100);
  assert.equal(scene.created[0].y, 221, "shadow belongs below actor feet");
  assert.deepEqual([scene.created[0].displayWidth, scene.created[0].displayHeight], [36, 18]);
});

test("attack hit and death pools stay bounded and reuse inactive visuals", async () => {
  const { createCombatFeedbackController } = await loadCombatFeedback();
  const scene = createSceneStub();
  const controller = createCombatFeedbackController(scene, {
    poolLimits: { attack: 1, hit: 1, death: 1 },
    effectDurationMs: 5
  });

  assert.equal(controller.notifyAttack({ weaponId: "pistol", originX: 20, originY: 30, angle: 0, shotCount: 1, heavy: false }), true);
  controller.notifyHit({ x: 30, y: 40, impactX: 32, impactY: 41, enemyType: "infected", eliteType: null, isBoss: false, damage: 5, lethal: false });
  controller.notifyDeath({ x: 40, y: 50, enemyType: "infected", eliteType: null, isBoss: false, color: 0xff0000 });
  assert.equal(scene.created.length, 3);

  controller.update(10);
  controller.notifyAttack({ weaponId: "pistol", originX: 20, originY: 30, angle: 0, shotCount: 1, heavy: false });
  controller.notifyHit({ x: 30, y: 40, impactX: 32, impactY: 41, enemyType: "infected", eliteType: null, isBoss: false, damage: 5, lethal: false });
  controller.notifyDeath({ x: 40, y: 50, enemyType: "infected", eliteType: null, isBoss: false, color: 0xff0000 });
  assert.equal(scene.created.length, 3, "each pool must reuse its oldest inactive visual rather than create indefinitely");
});

test("a full pool selects the oldest inactive visual instead of its insertion order", async () => {
  const { createCombatFeedbackController } = await loadCombatFeedback();
  const scene = createSceneStub();
  const controller = createCombatFeedbackController(scene, {
    poolLimits: { attack: 2, hit: 1, death: 1 },
    effectDurationMs: 5
  });

  controller.notifyAttack({ originX: 1, originY: 0, angle: 0, shotCount: 1, heavy: false });
  controller.update(3);
  controller.notifyAttack({ originX: 2, originY: 0, angle: 0, shotCount: 1, heavy: false });
  controller.update(6); // first visual becomes inactive
  controller.notifyAttack({ originX: 3, originY: 0, angle: 0, shotCount: 1, heavy: false }); // reuse first at t=6
  controller.update(12); // both are inactive; second was last active at t=3 and is older
  controller.notifyAttack({ originX: 4, originY: 0, angle: 0, shotCount: 1, heavy: false });

  assert.equal(scene.created.length, 2);
  assert.equal(scene.created[1].x, 4, "the oldest inactive effect visual must be reused first");
  assert.equal(scene.created[0].x, 3, "the newer inactive effect visual must remain untouched");
});

test("pause stops only combat-feedback updates and destroy releases every owned visual idempotently", async () => {
  const { createCombatFeedbackController } = await loadCombatFeedback();
  const scene = createSceneStub();
  const controller = createCombatFeedbackController(scene, { effectDurationMs: 5 });
  const actor = createActor();
  controller.trackActor(actor, { kind: "player", radius: 12, offsetY: 0 });
  controller.notifyHit({ x: 1, y: 2, impactX: 3, impactY: 4, enemyType: "enemy", eliteType: null, isBoss: false, damage: 1, lethal: false });
  controller.setPaused(true);
  controller.update(100);

  assert.equal(scene.calls.pauseAll, 0, "controller must not pause unrelated scene tweens");
  assert.equal(scene.calls.resumeAll, 0, "controller must not resume unrelated scene tweens");
  assert.ok(scene.created.some((visual) => visual.visible), "paused controller keeps its owned effects frozen");

  controller.destroy();
  controller.destroy();
  assert.ok(scene.created.every((visual) => visual.destroyed && visual.destroyCalls === 1));
  assert.doesNotThrow(() => controller.update(200));
  assert.equal(controller.notifyAttack({ weaponId: "pistol", originX: 0, originY: 0, angle: 0, shotCount: 1, heavy: false }), false);
});

test("allocation failure rolls back partial visuals and safe factory returns the no-op contract", async () => {
  const { createCombatFeedbackController } = await loadCombatFeedback();
  const scene = createSceneStub({ failOn: "setAlpha" });
  const controller = createCombatFeedbackController(scene);
  const actor = createActor();

  assertControllerShape(controller);
  assert.equal(controller.trackActor(actor, { kind: "enemy", radius: 10, offsetY: 0 }), false);
  assert.equal(scene.created.length, 1);
  assert.equal(scene.created[0].destroyed, true, "failed first allocation must destroy its partial visual");

  const noSceneController = createCombatFeedbackController(null);
  assertControllerShape(noSceneController);
  assert.equal(noSceneController.notifyAttack({}), false);
  assert.doesNotThrow(() => {
    noSceneController.trackActor(actor, {});
    noSceneController.untrackActor(actor);
    noSceneController.notifyHit({});
    noSceneController.notifyDeath({});
    noSceneController.update(0);
    noSceneController.setPaused(true);
    noSceneController.destroy();
  });
});
