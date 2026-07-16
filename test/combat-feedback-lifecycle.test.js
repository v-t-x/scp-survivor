import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function createActor() {
  return {
    x: 40,
    y: 60,
    active: true,
    scaleX: 1.2,
    scaleY: 1.2,
    originX: 0.5,
    originY: 0.5,
    depth: 8,
    body: {
      width: 24,
      height: 18,
      radius: 9,
      collisionCategory: 4,
      offset: { x: 3, y: 5 },
      velocity: { x: 12, y: -7 }
    }
  };
}

function createScene() {
  const created = [];
  return {
    created,
    add: {
      image(x, y, key) {
        const visual = {
          x, y, key, active: true,
          setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
          setDisplaySize() { return this; },
          setAlpha() { return this; },
          setVisible() { return this; },
          setTint() { return this; },
          setRotation() { return this; },
          setDepth() { return this; },
          destroy() { this.active = false; this.destroyed = true; }
        };
        created.push(visual);
        return visual;
      }
    }
  };
}

test("tracked actor shadows are display-only and untracking clears every actor kind", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const scene = createScene();
  const controller = createCombatFeedbackController(scene);
  const actors = [
    [createActor(), { kind: "player", radius: 12, offsetY: 1 }],
    [createActor(), { kind: "enemy", radius: 10, offsetY: 2 }],
    [createActor(), { kind: "elite", radius: 16, offsetY: 3 }],
    [createActor(), { kind: "boss", radius: 18, offsetY: 4 }],
    [createActor(), { kind: "biomassChild", radius: 8, offsetY: 2 }]
  ];
  const before = structuredClone(actors.map(([actor]) => actor));

  for (const [actor, options] of actors) {
    assert.equal(controller.trackActor(actor, options), true);
  }
  controller.update(10);
  assert.equal(scene.created.length, actors.length);
  assert.deepEqual(actors.map(([actor]) => actor), before);

  for (const [actor] of actors) controller.untrackActor(actor);
  assert.ok(scene.created.every((shadow) => shadow.destroyed));
});

test("scene lifecycle owns a safe controller outside transient effects and destroys it idempotently", async () => {
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const create = main.slice(main.indexOf("  create()"), main.indexOf("  update(_, delta)"));
  const update = main.slice(main.indexOf("  update(_, delta)"), main.indexOf("  // Dispose manager-owned"));
  const teardown = main.slice(main.indexOf("  teardownManagers()"), main.indexOf("}\n\nObject.assign"));

  assert.match(main, /createCombatFeedbackController/);
  assert.match(create, /createCombatFeedbackController\(this\)/);
  assert.doesNotMatch(create, /transientEffects\.add\(this\.combatFeedback\)/);
  assert.match(update, /syncCharacterPresentation\(this\)[\s\S]*combatFeedback\.update\(this\.elapsedSurvivalMs\)/);
  assert.match(teardown, /this\.combatFeedback\.destroy\(\)/);
  assert.match(teardown, /this\.combatFeedback\s*=\s*null/);
});
