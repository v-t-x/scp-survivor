import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveEnemyCloneSpec,
  tryReplicateEnemy
} from "../src/scene/enemyReplication.js";

const balance = {
  enemy: {
    replication: {
      intervalMinMs: 6_000,
      intervalMaxMs: 9_000,
      maxTotalEnemies: 230
    },
    types: {
      infectedStaff: {
        type: "infectedStaff",
        textureKey: "enemy-infected"
      }
    },
    elite: {
      types: {
        biomass: { type: "biomass" },
        biomassChild: { type: "biomassChild" }
      }
    }
  }
};

test("resolves ordinary enemies through the standard enemy table", () => {
  assert.deepEqual(
    resolveEnemyCloneSpec({ enemyType: "infectedStaff" }, balance),
    {
      mode: "standard",
      config: balance.enemy.types.infectedStaff,
      textureKey: "enemy-infected",
      isBiomassChild: false
    }
  );
});

test("resolves elite enemies through the elite factory", () => {
  assert.deepEqual(
    resolveEnemyCloneSpec(
      { isElite: true, eliteType: "biomass" },
      balance
    ),
    {
      mode: "elite",
      eliteType: "biomass"
    }
  );
});

test("resolves biomass children as recursively cloneable non-elites", () => {
  assert.deepEqual(
    resolveEnemyCloneSpec(
      { enemyType: "biomassChild", isBiomassChild: true },
      balance
    ),
    {
      mode: "standard",
      config: balance.enemy.elite.types.biomassChild,
      textureKey: "biomass-child",
      isBiomassChild: true
    }
  );
});

test("rejects unknown clone sources", () => {
  assert.equal(
    resolveEnemyCloneSpec({ enemyType: "unknown" }, balance),
    null
  );
});

function createReplicationScene() {
  const children = [];
  const scene = {
    elapsedSurvivalMs: 10_000,
    enemies: {
      getLength: () => children.length,
      create(x, y, textureKey) {
        const enemy = { active: true, x, y, textureKey };
        children.push(enemy);
        return enemy;
      }
    },
    initializeEnemyFromConfig(enemy, config, _scaling, isElite) {
      enemy.enemyType = config.type;
      enemy.isElite = isElite;
      enemy.isDying = false;
      enemy.nextReplicateAtMs = this.elapsedSurvivalMs + 6_000;
    },
    spawnEliteAtEdge() {
      throw new Error("biomass children must remain non-elite");
    }
  };
  return { scene, children };
}

const deterministicMath = {
  Between(minimum) {
    return minimum;
  },
  Clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }
};

test("replicates biomass children recursively and propagates Boss ownership", () => {
  const { scene, children } = createReplicationScene();
  const source = {
    active: true,
    isDying: false,
    isBoss: false,
    isElite: false,
    isBiomassChild: true,
    isBossMinion: true,
    enemyType: "biomassChild",
    x: 100,
    y: 100,
    nextReplicateAtMs: scene.elapsedSurvivalMs
  };
  children.push(source);

  const firstClone = tryReplicateEnemy(scene, source, balance, deterministicMath, {
    width: 1_280,
    height: 720
  });

  assert.equal(firstClone.isBiomassChild, true);
  assert.equal(firstClone.isElite, false);
  assert.equal(firstClone.canSplit, false);
  assert.equal(firstClone.isBossMinion, true);
  assert.equal(firstClone.nextReplicateAtMs, 16_000);

  scene.elapsedSurvivalMs = firstClone.nextReplicateAtMs;
  const secondClone = tryReplicateEnemy(
    scene,
    firstClone,
    balance,
    deterministicMath,
    { width: 1_280, height: 720 }
  );

  assert.equal(secondClone.isBiomassChild, true);
  assert.equal(secondClone.isBossMinion, true);
  assert.equal(secondClone.nextReplicateAtMs, 22_000);
});

test("reschedules but does not clone at the active-enemy cap", () => {
  const { scene, children } = createReplicationScene();
  const source = {
    active: true,
    isDying: false,
    isBoss: false,
    enemyType: "infectedStaff",
    x: 100,
    y: 100,
    nextReplicateAtMs: scene.elapsedSurvivalMs
  };
  children.push(source);
  while (children.length < balance.enemy.replication.maxTotalEnemies) {
    children.push({ active: true });
  }

  assert.equal(
    tryReplicateEnemy(scene, source, balance, deterministicMath, {
      width: 1_280,
      height: 720
    }),
    null
  );
  assert.equal(children.length, balance.enemy.replication.maxTotalEnemies);
  assert.equal(source.nextReplicateAtMs, 16_000);
});
