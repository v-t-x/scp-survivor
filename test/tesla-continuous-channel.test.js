import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("unterminated weapons mixin");
}

function createPhaserStub() {
  return {
    Math: {
      Angle: {
        Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1)
      },
      Distance: {
        Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
      },
      DegToRad: (degrees) => (degrees * Math.PI) / 180,
      FloatBetween: () => 0,
      Linear: (start, end, amount) => start + (end - start) * amount,
      Between: () => 0
    }
  };
}

async function loadWeaponsMixin() {
  const source = await readFile(new URL("../src/scene/weapons.js", import.meta.url), "utf8");
  const declarationStart = source.indexOf("export const weaponsMixin =");
  assert.ok(declarationStart >= 0, "weapons mixin export must exist");
  const objectStart = source.indexOf("{", declarationStart);
  const objectEnd = findMatchingBrace(source, objectStart);
  const objectLiteral = source.slice(objectStart, objectEnd + 1);
  const helperSource = source.slice(objectEnd + 2);

  return new Function(
    "Phaser",
    "BALANCE",
    `"use strict"; ${helperSource}\nreturn (${objectLiteral});`
  )(createPhaserStub(), BALANCE);
}

function enemy(id, x, y, overrides = {}) {
  return {
    id,
    x,
    y,
    active: true,
    isDying: false,
    isBoss: false,
    ...overrides
  };
}

function isTargetAvailable(target, x, y, range, excluded) {
  return Boolean(
    target?.active &&
    !target.isDying &&
    !excluded?.has(target) &&
    Math.hypot(target.x - x, target.y - y) <= range
  );
}

function createTeslaScene(mixin, {
  targets = [],
  weapon = {},
  overrides = {}
} = {}) {
  const damageCalls = [];
  const channelSnapshots = [];
  const legacyAttackSnapshots = [];
  const lightningSegments = [];
  const scene = {
    player: { x: 0, y: 0 },
    elapsedSurvivalMs: 0,
    bossPhaseActive: false,
    bossEnemy: null,
    weaponMutations: { teslaField: false },
    weapons: {
      tesla: {
        id: "tesla",
        unlocked: true,
        currentLevel: 1,
        damage: 6,
        cooldownMs: 300,
        range: 320,
        chainTargets: 1,
        chainSearchRadius: 180,
        nextAttackAtMs: 0,
        ...weapon
      }
    },
    findNearestEnemy(range, x = this.player.x, y = this.player.y, excluded = null, prioritizeBoss = false) {
      if (
        prioritizeBoss &&
        isTargetAvailable(this.bossEnemy, x, y, range, excluded)
      ) {
        return this.bossEnemy;
      }
      return targets
        .filter((target) => isTargetAvailable(target, x, y, range, excluded))
        .sort((left, right) => (
          Math.hypot(left.x - x, left.y - y) -
          Math.hypot(right.x - x, right.y - y)
        ))[0] ?? null;
    },
    damageEnemy(target, amount, hitX, hitY, sourceX, sourceY, metadata) {
      damageCalls.push({
        target,
        amount,
        hitX,
        hitY,
        sourceX,
        sourceY,
        metadata
      });
    },
    spawnLightningSegment(startX, startY, endX, endY) {
      lightningSegments.push({ startX, startY, endX, endY });
    },
    emitTeslaChannelPresentation(snapshot) {
      channelSnapshots.push(structuredClone(snapshot));
    },
    emitAttackPresentation(snapshot) {
      legacyAttackSnapshots.push(structuredClone(snapshot));
    },
    resolvePlayerAttackVisualOrigin() {
      return null;
    }
  };

  Object.assign(scene, mixin, {
    findNearestEnemy: scene.findNearestEnemy,
    damageEnemy: scene.damageEnemy,
    spawnLightningSegment: scene.spawnLightningSegment,
    emitTeslaChannelPresentation: scene.emitTeslaChannelPresentation,
    emitAttackPresentation: scene.emitAttackPresentation,
    resolvePlayerAttackVisualOrigin: scene.resolvePlayerAttackVisualOrigin,
    ...overrides
  });

  return {
    scene,
    damageCalls,
    channelSnapshots,
    legacyAttackSnapshots,
    lightningSegments
  };
}

function runWeaponUpdate(scene, elapsedSurvivalMs) {
  scene.elapsedSurvivalMs = elapsedSurvivalMs;
  scene.updateWeapons();
}

function roundedDamage(calls) {
  return calls.map(({ amount }) => Number(amount.toFixed(4)));
}

test("initializes the Tesla channel at 6 damage with a 300 ms tick and 320 range", async () => {
  const mixin = await loadWeaponsMixin();
  const scene = {
    selectedWeaponId: "tesla",
    syncCombatStatsFromWeapons() {}
  };

  mixin.initWeapons.call(scene);

  assert.equal(scene.weapons.tesla.damage, 6);
  assert.equal(scene.weapons.tesla.cooldownMs, 300);
  assert.equal(scene.weapons.tesla.range, 320);
});

test("Tesla interval upgrades remain effective after the 300 ms baseline and clamp at 180 ms", () => {
  const attackSpeed = UPGRADE_DEFINITIONS.find(({ key }) => key === "attackSpeed");
  const rapidDischarge = UPGRADE_DEFINITIONS.find(({ key }) => key === "teslaCooldown");
  const scene = {
    selectedWeaponId: "tesla",
    weapons: { tesla: { cooldownMs: 300 } },
    syncCombatStatsFromWeapons() {}
  };

  assert.equal(attackSpeed.isAvailable(scene), true);
  attackSpeed.apply(scene);
  assert.equal(scene.weapons.tesla.cooldownMs, 255);
  assert.equal(rapidDischarge.isAvailable(scene), true);
  rapidDischarge.apply(scene);
  assert.equal(scene.weapons.tesla.cooldownMs, 224.4);

  for (let index = 0; index < 20; index += 1) rapidDischarge.apply(scene);
  assert.equal(scene.weapons.tesla.cooldownMs, 180);
  assert.equal(rapidDischarge.isAvailable(scene), false);
});

test("sustains the visible Tesla channel every update but damages only on 300 ms ticks", async () => {
  const mixin = await loadWeaponsMixin();
  const primary = enemy("primary", 120, 0);
  const { scene, damageCalls, channelSnapshots } = createTeslaScene(mixin, {
    targets: [primary],
    overrides: {
      resolvePlayerAttackVisualOrigin() {
        return { x: 12, y: -6 };
      }
    }
  });

  runWeaponUpdate(scene, 0);
  primary.x = 140;
  runWeaponUpdate(scene, 100);
  runWeaponUpdate(scene, 299);
  runWeaponUpdate(scene, 300);

  assert.deepEqual(damageCalls.map(({ target }) => target.id), ["primary", "primary"]);
  assert.deepEqual(roundedDamage(damageCalls), [6, 6]);
  assert.equal(channelSnapshots[0]?.phase, "start");
  assert.ok(
    channelSnapshots.some(({ phase, segments }) => (
      phase === "sustain" &&
      segments[0]?.x1 === 12 &&
      segments[0]?.y1 === -6 &&
      segments[0]?.x2 === 140 &&
      segments[0]?.y2 === 0
    )),
    "a non-damage update refreshes the channel from the dynamic muzzle to the moved target"
  );
});

test("keeps its primary lock while valid even when another enemy becomes nearer", async () => {
  const mixin = await loadWeaponsMixin();
  const locked = enemy("locked", 100, 0);
  const challenger = enemy("challenger", 220, 0);
  const { scene, damageCalls, channelSnapshots } = createTeslaScene(mixin, {
    targets: [locked, challenger]
  });

  runWeaponUpdate(scene, 0);
  challenger.x = 30;
  runWeaponUpdate(scene, 100);
  runWeaponUpdate(scene, 300);

  assert.deepEqual(damageCalls.map(({ target }) => target.id), ["locked", "locked"]);
  assert.equal(channelSnapshots.at(-1).segments[0].x2, 100);
});

for (const [reason, invalidate] of [
  ["inactive", (target) => { target.active = false; }],
  ["dying", (target) => { target.isDying = true; }],
  ["outside 320 range", (target) => { target.x = 321; }]
]) {
  test(`immediately retargets the channel without early damage when the locked primary is ${reason}`, async () => {
    const mixin = await loadWeaponsMixin();
    const first = enemy("first", 100, 0);
    const replacement = enemy("replacement", 200, 0);
    const { scene, damageCalls, channelSnapshots } = createTeslaScene(mixin, {
      targets: [first, replacement]
    });

    runWeaponUpdate(scene, 0);
    invalidate(first);
    runWeaponUpdate(scene, 100);

    assert.equal(damageCalls.length, 1, "retargeting the visual cannot apply an early damage tick");
    assert.equal(
      channelSnapshots.at(-1)?.segments[0]?.x2,
      replacement.x,
      "the sustained arc immediately reconnects to the replacement"
    );

    runWeaponUpdate(scene, 300);

    assert.deepEqual(damageCalls.map(({ target }) => target.id), ["first", "replacement"]);
  });
}

test("stops an invalid channel immediately when no replacement exists without applying an early tick", async () => {
  const mixin = await loadWeaponsMixin();
  const primary = enemy("primary", 100, 0);
  const { scene, damageCalls, channelSnapshots } = createTeslaScene(mixin, {
    targets: [primary]
  });

  runWeaponUpdate(scene, 0);
  primary.active = false;
  runWeaponUpdate(scene, 100);

  assert.equal(damageCalls.length, 1);
  assert.equal(channelSnapshots.length, 2, "the channel emits start and immediate stop snapshots");
  assert.equal(channelSnapshots.at(-1).phase, "stop");
});

test("an in-range boss preempts a valid primary and keeps repeated overcharge falloff", async () => {
  const mixin = await loadWeaponsMixin();
  const regular = enemy("regular", 100, 0);
  const boss = enemy("boss", 240, 0, { isBoss: true });
  const { scene, damageCalls, channelSnapshots } = createTeslaScene(mixin, {
    targets: [regular],
    weapon: { chainTargets: 3 }
  });

  runWeaponUpdate(scene, 0);
  scene.bossPhaseActive = true;
  scene.bossEnemy = boss;
  runWeaponUpdate(scene, 100);

  assert.deepEqual(damageCalls.map(({ target }) => target.id), ["regular"]);
  assert.equal(
    channelSnapshots.at(-1)?.segments[0]?.x2,
    boss.x,
    "the visible lock preempts to the boss before the next damage tick"
  );

  runWeaponUpdate(scene, 300);

  assert.deepEqual(damageCalls.map(({ target }) => target.id), [
    "regular",
    "boss",
    "boss",
    "boss"
  ]);
  assert.deepEqual(roundedDamage(damageCalls.slice(1)), [6, 4.8, 3.84]);
});

test("each damage tick preserves regular chain search order and 0.8 falloff", async () => {
  const mixin = await loadWeaponsMixin();
  const first = enemy("first", 100, 0);
  const second = enemy("second", 220, 0);
  const third = enemy("third", 340, 0);
  const { scene, damageCalls } = createTeslaScene(mixin, {
    targets: [first, second, third],
    weapon: { chainTargets: 3, chainSearchRadius: 180 }
  });

  runWeaponUpdate(scene, 0);

  assert.deepEqual(damageCalls.map(({ target }) => target.id), ["first", "second", "third"]);
  assert.deepEqual(roundedDamage(damageCalls), [6, 4.8, 3.84]);
});

test("a throwing Tesla channel presentation never escapes or changes committed damage", async () => {
  const mixin = await loadWeaponsMixin();
  const primary = enemy("primary", 100, 0);
  let presentationAttempts = 0;
  const { scene, damageCalls } = createTeslaScene(mixin, {
    targets: [primary],
    overrides: {
      emitTeslaChannelPresentation() {
        presentationAttempts += 1;
        throw new Error("presentation unavailable");
      },
      emitAttackPresentation() {
        presentationAttempts += 1;
        throw new Error("legacy presentation unavailable");
      }
    }
  });

  assert.doesNotThrow(() => runWeaponUpdate(scene, 0));
  assert.ok(presentationAttempts >= 1, "the real presentation failure path must be exercised");
  assert.deepEqual(damageCalls.map(({ target, amount }) => [target.id, amount]), [["primary", 6]]);
});

test("a throwing aggregate hit sound cannot repeat a committed Tesla damage tick", async () => {
  const mixin = await loadWeaponsMixin();
  const primary = enemy("primary", 100, 0);
  const { scene, damageCalls } = createTeslaScene(mixin, {
    targets: [primary],
    overrides: {
      playSound() {
        throw new Error("audio unavailable");
      }
    }
  });

  assert.doesNotThrow(() => runWeaponUpdate(scene, 0));
  assert.equal(damageCalls.length, 1);
  assert.equal(scene.weapons.tesla.nextAttackAtMs, 300);

  assert.doesNotThrow(() => runWeaponUpdate(scene, 0));
  assert.equal(damageCalls.length, 1, "the committed tick cannot repeat at the same clock time");

  assert.doesNotThrow(() => runWeaponUpdate(scene, 300));
  assert.equal(damageCalls.length, 2);
});

test("unchanged elapsed time and a large resume jump never create catch-up damage bursts", async () => {
  const mixin = await loadWeaponsMixin();
  const primary = enemy("primary", 100, 0);
  const { scene, damageCalls } = createTeslaScene(mixin, {
    targets: [primary]
  });

  runWeaponUpdate(scene, 0);
  runWeaponUpdate(scene, 0);
  runWeaponUpdate(scene, 0);
  assert.equal(damageCalls.length, 1, "paused time cannot advance channel damage");

  runWeaponUpdate(scene, 5_000);
  assert.equal(damageCalls.length, 2, "resume commits at most one elapsed tick");
  runWeaponUpdate(scene, 5_000);
  runWeaponUpdate(scene, 5_299);
  assert.equal(damageCalls.length, 2, "the next tick is scheduled from the resumed clock");
  runWeaponUpdate(scene, 5_300);
  assert.equal(damageCalls.length, 3);
});
