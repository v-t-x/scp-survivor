export function getBossWavePlan(config, options = {}) {
  if (options.frenzy) {
    return {
      countMin: config.frenzySummonCountMin,
      countMax: config.frenzySummonCountMax,
      radius: config.frenzySummonRadius,
      types: [...config.frenzyMinionTypes],
      healthMultiplier: config.frenzyMinionHealthMultiplier,
      damageMultiplier: config.frenzyMinionDamageMultiplier
    };
  }

  return {
    countMin: config.summonCountMin,
    countMax: config.summonCountMax,
    radius: 52,
    types: ["infectedStaff"],
    healthMultiplier: config.minionHealthMultiplier,
    damageMultiplier: config.minionDamageMultiplier
  };
}

export function getBossDamageMultiplier(weaponId, bossState, config) {
  let multiplier = 1;
  if (weaponId === "shotgun" && config.shotgunDamageMultiplier > 1) {
    multiplier *= config.shotgunDamageMultiplier;
  }
  if (
    config.frenzyEnabled &&
    bossState === "frenzy" &&
    config.exposedDamageMultiplier > 1
  ) {
    multiplier *= config.exposedDamageMultiplier;
  }
  return Math.min(multiplier, config.exposedDamageCap);
}

export function getBossUpdateActions(boss, elapsedSurvivalMs, config) {
  const actions = {
    summonNormal: false,
    enterFrenzy: false,
    exitFrenzy: false,
    nextSummonDelayMs: boss.summonCooldownMs
  };

  if (config.frenzyEnabled) {
    if (boss.bossState === "frenzy") {
      actions.exitFrenzy = elapsedSurvivalMs >= boss.stateUntilMs;
      return actions;
    }
    actions.summonNormal = elapsedSurvivalMs >= boss.nextSummonAtMs;
    actions.enterFrenzy = elapsedSurvivalMs >= boss.nextFrenzyAtMs;
    return actions;
  }

  const hpRatio = boss.health / boss.maxHealth;
  actions.nextSummonDelayMs =
    hpRatio <= config.enragedHpThreshold
      ? boss.summonCooldownMs * config.enragedSummonMultiplier
      : boss.summonCooldownMs;
  actions.summonNormal = elapsedSurvivalMs >= boss.nextSummonAtMs;
  return actions;
}
