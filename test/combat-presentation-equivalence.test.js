import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert.ok(bodyStart >= 2, `missing body for ${name}`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

async function loadDamageEnemy() {
  const source = await readFile(new URL("../src/scene/combat.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, "damageEnemy");
  return new Function(`"use strict"; return ({${method}}).damageEnemy;`)();
}

function makeVisual(created) {
  const visual = {
    destroyed: false,
    setOrigin() { return this; }, setPosition() { return this; }, setDisplaySize() { return this; },
    setAlpha() { return this; }, setVisible() { return this; }, setTint() { return this; },
    setRotation() { return this; }, setDepth() { return this; }, clear() { return this; },
    fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; },
    lineBetween() { return this; }, strokeRect() { return this; }, strokeCircle() { return this; },
    destroy() { this.destroyed = true; }
  };
  created.push(visual);
  return visual;
}

function makePresentationScene(mode) {
  const created = [];
  const add = {};
  add.image = () => makeVisual(created);
  if (mode === "production") add.graphics = () => makeVisual(created);
  return {
    created,
    time: { now: 0 },
    textures: {
      exists() { return mode !== "missingTexture"; }
    },
    add
  };
}

function makeActor(health) {
  return {
    x: 40,
    y: 60,
    active: true,
    isDying: false,
    isBoss: false,
    isElite: false,
    enemyType: "drone",
    eliteType: null,
    enemyColor: 0x9b4dff,
    health,
    depth: 0,
    body: {
      enable: true,
      width: 18,
      height: 18,
      radius: 0,
      offset: { x: 2, y: 3 },
      velocity: { x: 7, y: -4 }
    }
  };
}

async function runSimulation(mode, lethal) {
  const [{ createCombatFeedbackController }, damageEnemy] = await Promise.all([
    import("../src/art/combatFeedback.js"),
    loadDamageEnemy()
  ]);
  const presentation = makePresentationScene(mode);
  const controller = createCombatFeedbackController(presentation);
  const player = makeActor(100);
  player.depth = 6;
  const enemy = makeActor(lethal ? 2 : 10);
  const playerBodyBefore = structuredClone(player.body);
  let rewards = 0;
  let impacts = 0;
  let deathBursts = 0;
  const scene = {
    player,
    combatFeedback: controller,
    killCount: 0,
    getEnemyDamageTakenMultiplier: () => 1,
    flashEnemyOnHit() {},
    spawnFloatingDamage() {},
    spawnImpactEffect() { impacts += 1; },
    spawnDeathParticles() { deathBursts += 1; },
    playSound() {},
    handleEnemyDefeatRewards() { rewards += 1; },
    playEnemyDeathEffect(target, { spawnParticles } = {}) {
      target.isDying = true;
      target.body.enable = false;
      target.body.velocity.x = 0;
      target.body.velocity.y = 0;
      if (spawnParticles !== false) deathBursts += 1;
    }
  };

  controller.trackActor(player, { kind: "player", radius: 12 });
  controller.trackActor(enemy, { kind: "enemy", radius: 10 });
  controller.update(1);
  damageEnemy.call(scene, enemy, 3, enemy.x, enemy.y, player.x, player.y, {
    sourceWeaponId: "pistol"
  });
  const result = {
    playerBody: structuredClone(player.body),
    playerBodyBefore,
    enemyBody: structuredClone(enemy.body),
    health: enemy.health,
    dying: enemy.isDying,
    rewards,
    kills: scene.killCount
  };
  controller.destroy();
  assert.ok(presentation.created.every((visual) => visual.destroyed));
  return {
    result,
    presentationRoute: {
      impacts,
      deathBursts,
      allocatedVisuals: presentation.created.length
    }
  };
}

test("production image fallback and missing-texture paths preserve identical body and damage outcomes", async () => {
  for (const lethal of [false, true]) {
    const runs = [];
    for (const mode of ["production", "fallback", "missingTexture"]) {
      runs.push([mode, await runSimulation(mode, lethal)]);
    }
    const baseline = runs[0][1].result;
    assert.deepEqual(baseline.playerBody, baseline.playerBodyBefore, "presentation never changes player physics");
    for (const [mode, { result }] of runs.slice(1)) {
      assert.deepEqual(result, baseline, `${mode} must preserve the complete gameplay result`);
    }
    assert.deepEqual(runs[0][1].presentationRoute, { impacts: 0, deathBursts: 0, allocatedVisuals: lethal ? 4 : 3 });
    assert.deepEqual(runs[1][1].presentationRoute, { impacts: 0, deathBursts: 0, allocatedVisuals: lethal ? 4 : 3 });
    assert.deepEqual(
      runs[2][1].presentationRoute,
      { impacts: 1, deathBursts: lethal ? 1 : 0, allocatedVisuals: 0 },
      "a real TextureManager miss must select legacy feedback before allocating visuals"
    );
  }
});
