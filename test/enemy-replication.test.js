import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  cloneEnemyAt,
  resolveEnemyCloneSpec,
  tryReplicateEnemy
} from "../src/scene/enemyReplication.js";
import { BALANCE } from "../src/config/balance.js";

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

async function loadEnemyMethods(...names) {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  const Phaser = {
    Math: {
      Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
      Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) }
    }
  };
  return new Function("Phaser", "BALANCE", `"use strict"; return ({${methods}});`)(Phaser, BALANCE);
}

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

  const enemies = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const initializer = enemies.slice(
    enemies.indexOf("  initializeEnemyFromConfig("),
    enemies.indexOf("  updateEnemies()")
  );
  assert.equal((initializer.match(/enemyPresentation\?\.trackActor\?\./g) ?? []).length, 1);
  assert.doesNotMatch(source, /enemyPresentation|_presentationId/);
});

async function runCommittedDroneShot(mode) {
  const methods = await loadEnemyMethods("updateDroneBehavior", "fireEnemyProjectile");
  const projectiles = [];
  const notifications = [];
  const enemy = {
    active: true,
    isBossMinion: true,
    _presentationId: 23,
    x: 100,
    y: 100,
    moveSpeed: 40,
    preferredRangeMin: 50,
    preferredRangeMax: 150,
    nextShotAtMs: 1_000,
    shootCooldownMs: 800,
    projectileDamage: 13,
    body: {
      velocity: { x: 3, y: 4 },
      setVelocity(x, y) { this.velocity.x = x; this.velocity.y = y; }
    }
  };
  const scene = {
    ...methods,
    elapsedSurvivalMs: 1_000,
    isGameOver: false,
    isLevelUpActive: false,
    player: { x: 200, y: 100 },
    enemyProjectiles: {
      create(x, y, textureKey) {
        const projectile = {
          x,
          y,
          textureKey,
          body: { velocity: { x: 0, y: 0 } },
          setCircle(radius) { this.radius = radius; }
        };
        projectiles.push(projectile);
        return projectile;
      }
    },
    physics: {
      moveToObject(actor, _target, speed) {
        if (actor === enemy) {
          actor.body.setVelocity(speed, 0);
        } else {
          actor.body.velocity.x = speed;
          actor.body.velocity.y = 0;
        }
      }
    }
  };
  const snapshotProjectile = () => {
    const projectile = projectiles[0];
    return {
      x: projectile.x,
      y: projectile.y,
      textureKey: projectile.textureKey,
      body: { velocity: { ...projectile.body.velocity } },
      radius: projectile.radius,
      damage: projectile.damage,
      expireAtMs: projectile.expireAtMs
    };
  };
  if (mode !== "missing") {
    scene.enemyPresentation = {
      notifyAction(snapshot) {
        notifications.push({
          raw: snapshot,
          snapshot: structuredClone(snapshot),
          nextShotAtMs: enemy.nextShotAtMs,
          projectile: snapshotProjectile()
        });
        if (mode === "throw") throw new Error("release presentation failed");
      }
    };
  }

  assert.doesNotThrow(() => methods.updateDroneBehavior.call(scene, enemy));
  return {
    gameplay: {
      nextShotAtMs: enemy.nextShotAtMs,
      isBossMinion: enemy.isBossMinion,
      projectile: snapshotProjectile()
    },
    notifications
  };
}

// Break caught: release fires before deadline/projectile commitment or uses the controller's old atMs schema.
test("Pulse Sac release is a frozen three-field event after the complete projectile commit", async () => {
  const missing = await runCommittedDroneShot("missing");
  const normal = await runCommittedDroneShot("normal");
  const throwing = await runCommittedDroneShot("throw");

  assert.deepEqual(normal.gameplay, missing.gameplay);
  assert.deepEqual(throwing.gameplay, missing.gameplay);
  assert.equal(normal.gameplay.nextShotAtMs, 1_800);
  assert.equal(normal.gameplay.isBossMinion, true);
  assert.deepEqual(normal.gameplay.projectile, {
    x: 100,
    y: 100,
    textureKey: "enemy-projectile",
    body: { velocity: { x: BALANCE.combat.enemyProjectileSpeed, y: 0 } },
    radius: 5,
    damage: 13,
    expireAtMs: 1_000 + BALANCE.combat.enemyProjectileLifetimeMs
  });
  for (const run of [normal, throwing]) {
    assert.equal(run.notifications.length, 1);
    const [{ raw, snapshot, nextShotAtMs, projectile }] = run.notifications;
    assert.equal(Object.isFrozen(raw), true);
    assert.deepEqual(Object.keys(snapshot), ["presentationId", "action", "shotAtMs"]);
    assert.deepEqual(snapshot, {
      presentationId: 23,
      action: "shoot-release",
      shotAtMs: 1_000
    });
    assert.equal(nextShotAtMs, 1_800);
    assert.deepEqual(projectile, normal.gameplay.projectile);
  }
});

function actionRecorder(mode, snapshots, inspect) {
  if (mode === "missing") return undefined;
  return {
    notifyAction(snapshot) {
      inspect(snapshot.action);
      snapshots.push({ raw: snapshot, snapshot: structuredClone(snapshot) });
      if (mode === "throw") throw new Error("action presentation failed");
    }
  };
}

async function runCommittedEnemyActions(mode) {
  const methods = await loadEnemyMethods(
    "updateRiotElite",
    "updateBlinkElite",
    "enterFrenzy",
    "exitFrenzy"
  );
  const snapshots = [];
  const inspections = [];
  const scene = {
    ...methods,
    elapsedSurvivalMs: 1_000,
    player: { x: 200, y: 100 },
    physics: { moveToObject() {} },
    createChargeWarning(enemy) { enemy.warningCreated = true; },
    createTeleportWarning(enemy) { enemy.warningCreated = true; },
    clearEliteWarning(enemy) { enemy.warningCleared = true; },
    getBlinkTeleportDestination: () => ({ x: 310, y: 320 }),
    summonBossMinions(_boss, options) {
      assert.equal(options.frenzy, true);
      scene.minions = Array.from({ length: 20 }, (_, index) => ({ index, isBossMinion: true }));
    },
    showTopBanner() { scene.bannerCommitted = true; },
    clearFrenzyTint(boss) { boss.tintCleared = true; }
  };
  scene.enemyPresentation = actionRecorder(mode, snapshots, (action) => {
    if (action === "brace") {
      inspections.push({ action, state: riotIdle.eliteState, warning: riotIdle.warningCreated });
    } else if (action === "charge") {
      inspections.push({
        action,
        state: riotWarning.eliteState,
        chargeUntilMs: riotWarning.chargeUntilMs,
        nextActionAtMs: riotWarning.nextActionAtMs,
        warningCleared: riotWarning.warningCleared
      });
    } else if (action === "phase-out") {
      inspections.push({
        action,
        state: blinkIdle.eliteState,
        target: [blinkIdle.teleportTargetX, blinkIdle.teleportTargetY],
        warningCreated: blinkIdle.warningCreated
      });
    } else if (action === "reappear-dash") {
      inspections.push({
        action,
        state: blinkWarning.eliteState,
        position: [blinkWarning.x, blinkWarning.y],
        dashUntilMs: blinkWarning.dashUntilMs,
        warningCleared: blinkWarning.warningCleared
      });
    } else if (action === "frenzy-enter") {
      inspections.push({
        action,
        state: boss.bossState,
        minions: scene.minions.length,
        ownership: scene.minions.every((minion) => minion.isBossMinion),
        banner: scene.bannerCommitted
      });
    } else if (action === "frenzy-exit") {
      inspections.push({
        action,
        state: boss.bossState,
        nextFrenzyAtMs: boss.nextFrenzyAtMs,
        tintCleared: boss.tintCleared
      });
    }
  });

  const baseBody = () => ({
    velocity: { x: 0, y: 0 },
    setVelocity(x, y) { this.velocity.x = x; this.velocity.y = y; }
  });
  const riotIdle = {
    _presentationId: 1, x: 100, y: 100, eliteState: "idle", nextActionAtMs: 1_000,
    moveSpeed: 40, chargeWarningMs: 300, facingAngle: 0, body: baseBody()
  };
  const riotWarning = {
    _presentationId: 2, eliteState: "warning", warningUntilMs: 1_000,
    chargeDurationMs: 500, chargeCooldownMs: 900, body: baseBody()
  };
  const blinkIdle = {
    _presentationId: 3, x: 100, y: 100, eliteState: "idle", nextActionAtMs: 1_000,
    moveSpeed: 40, teleportWarningMs: 250, teleportCooldownMs: 800, body: baseBody(),
    setAlpha(value) { this.alpha = value; }
  };
  const blinkWarning = {
    _presentationId: 4, x: 100, y: 100, eliteState: "teleportWarning", warningUntilMs: 1_000,
    teleportTargetX: 330, teleportTargetY: 340, postTeleportDashMs: 350, body: baseBody(),
    setPosition(x, y) { this.x = x; this.y = y; },
    setAlpha(value) { this.alpha = value; }
  };
  const boss = {
    _presentationId: 5,
    bossState: "normal",
    health: 1_000,
    maxHealth: 2_500,
    body: baseBody(),
    setTint(value) { this.tint = value; }
  };

  assert.doesNotThrow(() => methods.updateRiotElite.call(scene, riotIdle));
  assert.doesNotThrow(() => methods.updateRiotElite.call(scene, riotWarning));
  assert.doesNotThrow(() => methods.updateBlinkElite.call(scene, blinkIdle));
  assert.doesNotThrow(() => methods.updateBlinkElite.call(scene, blinkWarning));
  assert.doesNotThrow(() => methods.enterFrenzy.call(scene, boss));
  assert.doesNotThrow(() => methods.exitFrenzy.call(scene, boss));

  return {
    gameplay: {
      riotIdle: { state: riotIdle.eliteState, warningUntilMs: riotIdle.warningUntilMs, chargeAngle: riotIdle.chargeAngle },
      riotWarning: { state: riotWarning.eliteState, chargeUntilMs: riotWarning.chargeUntilMs, nextActionAtMs: riotWarning.nextActionAtMs },
      blinkIdle: {
        state: blinkIdle.eliteState,
        target: [blinkIdle.teleportTargetX, blinkIdle.teleportTargetY],
        warningUntilMs: blinkIdle.warningUntilMs,
        nextActionAtMs: blinkIdle.nextActionAtMs
      },
      blinkWarning: { state: blinkWarning.eliteState, position: [blinkWarning.x, blinkWarning.y], dashUntilMs: blinkWarning.dashUntilMs },
      boss: {
        state: boss.bossState,
        nextFrenzyAtMs: boss.nextFrenzyAtMs,
        minionCount: scene.minions.length,
        minionOwnership: scene.minions.every((minion) => minion.isBossMinion)
      }
    },
    snapshots,
    inspections
  };
}

// Break caught: Riot/Blink/Frenzy notifications run before state/VFX/wave commits or throwing actions alter gameplay.
test("Riot Blink and Frenzy actions are frozen post-commit void notifications", async () => {
  const missing = await runCommittedEnemyActions("missing");
  const normal = await runCommittedEnemyActions("normal");
  const throwing = await runCommittedEnemyActions("throw");
  assert.deepEqual(normal.gameplay, missing.gameplay);
  assert.deepEqual(throwing.gameplay, missing.gameplay);
  assert.deepEqual(normal.inspections, [
    { action: "brace", state: "warning", warning: true },
    { action: "charge", state: "charging", chargeUntilMs: 1_500, nextActionAtMs: 1_900, warningCleared: true },
    { action: "phase-out", state: "teleportWarning", target: [310, 320], warningCreated: true },
    { action: "reappear-dash", state: "postDash", position: [330, 340], dashUntilMs: 1_350, warningCleared: true },
    { action: "frenzy-enter", state: "frenzy", minions: 20, ownership: true, banner: true },
    {
      action: "frenzy-exit",
      state: "normal",
      nextFrenzyAtMs: 1_000 + BALANCE.boss.scp049.frenzyCooldownMs * BALANCE.boss.scp049.frenzyEnragedMultiplier,
      tintCleared: true
    }
  ]);
  assert.deepEqual(throwing.inspections, normal.inspections);
  for (const run of [normal, throwing]) {
    assert.equal(run.snapshots.length, 6);
    for (const { raw, snapshot } of run.snapshots) {
      assert.equal(Object.isFrozen(raw), true);
      assert.deepEqual(Object.keys(snapshot), ["presentationId", "action", "atMs"]);
      assert.equal(snapshot.atMs, 1_000);
    }
  }
});
