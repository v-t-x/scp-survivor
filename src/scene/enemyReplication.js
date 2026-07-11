export function resolveEnemyCloneSpec(source, balance) {
  if (source.isElite && source.eliteType) {
    if (!balance.enemy.elite.types[source.eliteType]) {
      return null;
    }
    return {
      mode: "elite",
      eliteType: source.eliteType
    };
  }

  const isBiomassChild = source.isBiomassChild === true;
  const config = isBiomassChild
    ? balance.enemy.elite.types.biomassChild
    : balance.enemy.types[source.enemyType];

  if (!config) {
    return null;
  }

  return {
    mode: "standard",
    config,
    textureKey: isBiomassChild ? "biomass-child" : config.textureKey,
    isBiomassChild
  };
}

export function cloneEnemyAt(scene, source, x, y, balance) {
  const cloneSpec = resolveEnemyCloneSpec(source, balance);
  const scaling = { healthMultiplier: 1, damageMultiplier: 1 };

  if (!cloneSpec) {
    return null;
  }

  if (cloneSpec.mode === "elite") {
    return scene.spawnEliteAtEdge(cloneSpec.eliteType, scaling, { x, y });
  }

  const clone = scene.enemies.create(x, y, cloneSpec.textureKey);
  scene.initializeEnemyFromConfig(clone, cloneSpec.config, scaling, false);
  if (cloneSpec.isBiomassChild) {
    clone.isBiomassChild = true;
    clone.canSplit = false;
  }
  return clone;
}

export function tryReplicateEnemy(scene, enemy, balance, math, worldBounds) {
  if (!enemy.active || enemy.isDying || enemy.isBoss) {
    return null;
  }
  if ((enemy.nextReplicateAtMs ?? 0) > scene.elapsedSurvivalMs) {
    return null;
  }

  enemy.nextReplicateAtMs =
    scene.elapsedSurvivalMs +
    math.Between(
      balance.enemy.replication.intervalMinMs,
      balance.enemy.replication.intervalMaxMs
    );

  if (scene.enemies.getLength() >= balance.enemy.replication.maxTotalEnemies) {
    return null;
  }

  const spawnX = math.Clamp(
    enemy.x + math.Between(-24, 24),
    24,
    worldBounds.width - 24
  );
  const spawnY = math.Clamp(
    enemy.y + math.Between(-24, 24),
    24,
    worldBounds.height - 24
  );
  const clone = cloneEnemyAt(scene, enemy, spawnX, spawnY, balance);
  if (clone && enemy.isBossMinion) {
    clone.isBossMinion = true;
  }
  return clone;
}
