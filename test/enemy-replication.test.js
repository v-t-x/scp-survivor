import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  cloneEnemyAt,
  resolveEnemyCloneSpec,
  tryReplicateEnemy
} from "../src/scene/enemyReplication.js";

const balance = {
  enemy: {
    maxActiveEnemies: 230,
    replication: {
      intervalMinMs: 6_000,
      intervalMaxMs: 9_000
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

test("ordinary elite and biomass child clones keep fallback keys and unified initialization", () => {
  const created = [];
  const initialized = [];
  const eliteSpawns = [];
  const eliteClone = { kind: "elite-clone" };
  const scene = {
    enemies: {
      create(x, y, textureKey) {
        const enemy = { x, y, textureKey };
        created.push(enemy);
        return enemy;
      }
    },
    initializeEnemyFromConfig(enemy, config, scaling, isElite) {
      initialized.push({ enemy, config, scaling, isElite });
    },
    spawnEliteAtEdge(eliteType, scaling, position) {
      eliteSpawns.push({ eliteType, scaling, position });
      return eliteClone;
    }
  };

  const ordinary = cloneEnemyAt(
    scene,
    { enemyType: "infectedStaff" },
    11,
    12,
    balance
  );
  const child = cloneEnemyAt(
    scene,
    { enemyType: "biomassChild", isBiomassChild: true },
    21,
    22,
    balance
  );
  const elite = cloneEnemyAt(
    scene,
    { isElite: true, eliteType: "biomass" },
    31,
    32,
    balance
  );

  assert.equal(ordinary.textureKey, "enemy-infected");
  assert.equal(child.textureKey, "biomass-child");
  assert.equal(child.isBiomassChild, true);
  assert.equal(child.canSplit, false);
  assert.equal(elite, eliteClone);
  assert.deepEqual(
    created.map(({ x, y, textureKey }) => ({ x, y, textureKey })),
    [
      { x: 11, y: 12, textureKey: "enemy-infected" },
      { x: 21, y: 22, textureKey: "biomass-child" }
    ]
  );
  assert.deepEqual(
    initialized.map(({ config, scaling, isElite }) => ({ config, scaling, isElite })),
    [
      {
        config: balance.enemy.types.infectedStaff,
        scaling: { healthMultiplier: 1, damageMultiplier: 1 },
        isElite: false
      },
      {
        config: balance.enemy.elite.types.biomassChild,
        scaling: { healthMultiplier: 1, damageMultiplier: 1 },
        isElite: false
      }
    ]
  );
  assert.deepEqual(eliteSpawns, [
    {
      eliteType: "biomass",
      scaling: { healthMultiplier: 1, damageMultiplier: 1 },
      position: { x: 31, y: 32 }
    }
  ]);
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
  while (children.length < balance.enemy.maxActiveEnemies) {
    children.push({ active: true });
  }

  assert.equal(
    tryReplicateEnemy(scene, source, balance, deterministicMath, {
      width: 1_280,
      height: 720
    }),
    null
  );
  assert.equal(children.length, balance.enemy.maxActiveEnemies);
  assert.equal(source.nextReplicateAtMs, 16_000);
});

test("schedules replication before knockback and stagger skip movement", async () => {
  const source = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const updateBlock = source.slice(
    source.indexOf("  updateEnemies()"),
    source.indexOf("  tryReplicateEnemy(enemy)")
  );

  const replicationIndex = updateBlock.indexOf("this.tryReplicateEnemy(enemy)");
  const knockbackIndex = updateBlock.indexOf("enemy.knockbackUntilMs");
  const staggerIndex = updateBlock.indexOf("enemy.staggerUntilMs");

  assert.ok(replicationIndex >= 0, "updateEnemies must schedule replication");
  assert.ok(replicationIndex < knockbackIndex, "knockback must not delay replication");
  assert.ok(replicationIndex < staggerIndex, "stagger must not delay replication");
});

test("spawn boss-minion and frenzy routes begin on fallback keys before unified initialization", async () => {
  const enemies = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const spawnEnemy = enemies.slice(
    enemies.indexOf("  spawnEnemyAtEdge("),
    enemies.indexOf("  spawnEliteAtEdge(")
  );
  const spawnElite = enemies.slice(
    enemies.indexOf("  spawnEliteAtEdge("),
    enemies.indexOf("  spawnBiomassChild(")
  );
  const spawnChild = enemies.slice(
    enemies.indexOf("  spawnBiomassChild("),
    enemies.indexOf("  initializeEnemyFromConfig(")
  );
  const normalBossWave = enemies.slice(
    enemies.indexOf("  summonBossMinions("),
    enemies.indexOf("  summonBossFrenzyWave(")
  );
  const frenzyWave = enemies.slice(
    enemies.indexOf("  summonBossFrenzyWave("),
    enemies.indexOf("  handleBossDefeat(")
  );

  assert.match(
    spawnEnemy,
    /this\.enemies\.create\(x, y, config\.textureKey\)/
  );
  assert.doesNotMatch(spawnEnemy, /resolveCharacterTexture|r17-/);
  assert.ok(
    spawnEnemy.indexOf("this.enemies.create")
      < spawnEnemy.indexOf("this.initializeEnemyFromConfig")
  );

  assert.match(spawnElite, /TEXTURES\.eliteRiot/);
  assert.match(spawnElite, /TEXTURES\.eliteBlink/);
  assert.match(spawnElite, /TEXTURES\.eliteBiomass/);
  assert.match(spawnElite, /this\.enemies\.create\(x, y, textureKey\)/);
  assert.ok(
    spawnElite.indexOf("this.enemies.create")
      < spawnElite.indexOf("this.initializeEnemyFromConfig")
  );

  assert.match(spawnChild, /TEXTURES\.biomassChild/);
  assert.ok(
    spawnChild.indexOf("this.enemies.create")
      < spawnChild.indexOf("this.initializeEnemyFromConfig")
  );

  assert.match(
    normalBossWave,
    /this\.enemies\.create\(spawnX, spawnY, baseConfig\.textureKey\)/
  );
  assert.doesNotMatch(normalBossWave, /resolveCharacterTexture|r17-/);
  assert.ok(
    normalBossWave.indexOf("this.enemies.create")
      < normalBossWave.indexOf("this.initializeEnemyFromConfig")
  );

  assert.match(
    frenzyWave,
    /this\.enemies\.create\(spawnX, spawnY, droneConfig\.textureKey\)/
  );
  assert.match(
    frenzyWave,
    /this\.spawnEliteAtEdge\(type, scaling, \{ x: spawnX, y: spawnY \}\)/
  );
  assert.ok(
    frenzyWave.indexOf("this.enemies.create")
      < frenzyWave.indexOf("this.initializeEnemyFromConfig")
  );
});

test("replication delegates presentation to initializer without duplicate production switching", async () => {
  const source = await readFile(
    new URL("../src/scene/enemyReplication.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /scene\.initializeEnemyFromConfig\(clone, cloneSpec\.config, scaling, false\)/);
  assert.match(source, /scene\.spawnEliteAtEdge\(cloneSpec\.eliteType, scaling, \{ x, y \}\)/);
  assert.doesNotMatch(
    source,
    /applyEnemyPresentation|ENEMY_PRESENTATION|resolveCharacterTexture|r17-|\.setTexture\(|\.setScale\(|\.play\(/
  );
});
