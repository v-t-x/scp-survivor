import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { menusMixin } from "../src/scene/menus.js";

const SHUTDOWN = "shutdown";
const DESTROY = "destroy";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
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

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
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

async function loadSystemMethods(...names) {
  const source = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function(`"use strict"; return ({${methods}});`)();
}

async function loadMainLifecycle() {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const teardown = extractObjectMethod(source, "teardownManagers");
  const install = extractNamedFunction(source, "installManagerTeardown");
  const teardownManagers = new Function(`"use strict"; return ({${teardown}}).teardownManagers;`)();
  const installManagerTeardown = new Function(
    "Phaser",
    `"use strict"; ${install}; return installManagerTeardown;`
  )({ Scenes: { Events: { SHUTDOWN, DESTROY } } });
  return { source, teardownManagers, installManagerTeardown };
}

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  off(event, fn, context) {
    const next = (this.listeners.get(event) ?? []).filter(
      (entry) => entry.fn !== fn || entry.context !== context
    );
    this.listeners.set(event, next);
    return this;
  }

  once(event, fn, context) {
    const entries = this.listeners.get(event) ?? [];
    entries.push({ fn, context, once: true });
    this.listeners.set(event, entries);
    return this;
  }

  emit(event) {
    const entries = [...(this.listeners.get(event) ?? [])];
    this.listeners.set(event, (this.listeners.get(event) ?? []).filter((entry) => !entry.once));
    for (const entry of entries) entry.fn.call(entry.context);
  }

  listenerCount(event) {
    return (this.listeners.get(event) ?? []).length;
  }
}

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
  const teardown = extractObjectMethod(main, "teardownManagers");

  assert.match(main, /createCombatFeedbackController/);
  assert.match(create, /createCombatFeedbackController\(this\)/);
  assert.doesNotMatch(create, /transientEffects\.add\(this\.combatFeedback\)/);
  assert.match(
    update,
    /handlePlayerMovement\(\)[\s\S]*createPlayerPresentationSnapshot\(this\)[\s\S]*playerPresentation\?\.update\?\.\(snapshot, delta\)[\s\S]*updateWeapons\(\)[\s\S]*combatFeedback\.update\(this\.elapsedSurvivalMs\)/
  );
  assert.doesNotMatch(update, /syncCharacterPresentation\(this\)/);
  assert.match(teardown, /playerPresentation\.setPaused\?\.\(true\)/);
  assert.match(teardown, /playerPresentation\.destroy\?\.\(\)/);
  assert.match(teardown, /this\.playerPresentation\s*=\s*null/);
  assert.match(teardown, /combatFeedback\.setPaused\?\.\(true\)/);
  assert.match(teardown, /combatFeedback\.destroy\?\.\(\)/);
  assert.match(teardown, /this\.combatFeedback\s*=\s*null/);
});

test("three pause and resume cycles forward only controller pause state after gameplay state commits", async () => {
  const { pauseGameplaySystems, resumeGameplaySystems } = await loadSystemMethods(
    "pauseGameplaySystems",
    "resumeGameplaySystems"
  );
  const events = [];
  const scene = {
    physics: {
      pause() { events.push("physics:pause"); },
      resume() { events.push("physics:resume"); }
    },
    spawnEvent: { paused: false },
    regularSpawningActive: true,
    isGameOver: false,
    scheduleNextSpawn() { events.push("spawn:schedule"); },
    combatFeedback: {
      setPaused(value) {
        events.push(`feedback:${value}`);
        assert.equal(scene.spawnEvent.paused, value, "gameplay spawn pause state commits first");
      }
    },
    playerPresentation: {
      setPaused(value) {
        events.push(`player:${value}`);
        assert.equal(scene.spawnEvent.paused, value, "gameplay spawn pause state commits first");
      }
    },
    tweens: { pauseAll() { events.push("tweens:pauseAll"); }, resumeAll() { events.push("tweens:resumeAll"); } }
  };

  for (let cycle = 0; cycle < 3; cycle += 1) {
    pauseGameplaySystems.call(scene);
    resumeGameplaySystems.call(scene);
  }
  assert.deepEqual(events, Array.from({ length: 3 }, () => [
    "physics:pause", "player:true", "feedback:true",
    "physics:resume", "player:false", "feedback:false"
  ]).flat());

  scene.playerPresentation.setPaused = () => { throw new Error("player presentation pause failed"); };
  scene.combatFeedback.setPaused = (value) => events.push(`feedback-after-failure:${value}`);
  assert.doesNotThrow(() => pauseGameplaySystems.call(scene));
  assert.doesNotThrow(() => resumeGameplaySystems.call(scene));
  assert.deepEqual(
    events.filter((event) => event.startsWith("feedback-after-failure:")),
    ["feedback-after-failure:true", "feedback-after-failure:false"]
  );
});

test("clearCombatEntities commits every group clear before untracking each destroyed enemy", async () => {
  const { clearCombatEntities } = await loadSystemMethods("clearCombatEntities");
  const enemies = [{ active: true }, { active: true }, { active: true }];
  const events = [];
  function group(name, children = []) {
    return {
      getChildren: () => children,
      clear(remove, destroy) {
        events.push(`clear:${name}:${remove}:${destroy}`);
        for (const child of children) child.active = false;
      }
    };
  }
  const scene = {
    enemies: group("enemies", enemies),
    enemyProjectiles: group("projectiles"),
    bullets: group("bullets"),
    xpGems: group("gems"),
    supplyPickups: group("pickups"),
    instabilityDecoys: group("decoys"),
    clearTransientEffects() { events.push("clear:transient"); },
    combatFeedback: {
      untrackActor(actor) {
        events.push(`untrack:${enemies.indexOf(actor)}:${actor.active}`);
        if (actor === enemies[1]) throw new Error("one shadow cleanup failed");
      }
    }
  };

  assert.doesNotThrow(() => clearCombatEntities.call(scene));
  assert.deepEqual(events, [
    "clear:enemies:true:true",
    "clear:projectiles:true:true",
    "clear:bullets:true:true",
    "clear:gems:true:true",
    "clear:pickups:true:true",
    "clear:decoys:true:true",
    "clear:transient",
    "untrack:0:false",
    "untrack:1:false",
    "untrack:2:false"
  ]);
});

test("manager teardown clears and destroys player presentation while isolating every cleanup failure", async () => {
  const { teardownManagers } = await loadMainLifecycle();
  for (const failure of [null, "player-pause", "player", "feedback-pause", "feedback", "audio"]) {
    const events = [];
    const scene = {
      playerPresentation: {
        setPaused(value) { events.push(`player:pause:${value}`); if (failure === "player-pause") throw new Error("player pause failed"); },
        destroy() { events.push("player:destroy"); if (failure === "player") throw new Error("player destroy failed"); }
      },
      combatFeedback: {
        setPaused(value) { events.push(`feedback:pause:${value}`); if (failure === "feedback-pause") throw new Error("pause failed"); },
        destroy() { events.push("feedback:destroy"); if (failure === "feedback") throw new Error("feedback failed"); }
      },
      audio: { destroy() { events.push("audio:destroy"); if (failure === "audio") throw new Error("audio failed"); } },
      ui: { destroy() { events.push("ui:destroy"); } }
    };
    assert.doesNotThrow(() => teardownManagers.call(scene));
    assert.deepEqual(events, [
      "player:pause:true",
      "player:destroy",
      "feedback:pause:true",
      "feedback:destroy",
      "audio:destroy",
      "ui:destroy"
    ]);
    assert.deepEqual(
      [scene.playerPresentation, scene.combatFeedback, scene.audio, scene.ui],
      [null, null, null, null]
    );
    assert.doesNotThrow(() => teardownManagers.call(scene));
    assert.equal(events.length, 6, "repeated teardown is inert");
  }
});

test("failure and victory restart loops return managers pools visuals and listeners to baseline", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const { createPlayerPresentationController } = await import("../src/art/playerPresentationController.js");
  const { teardownManagers, installManagerTeardown } = await loadMainLifecycle();

  for (const outcome of ["failure", "victory"]) {
    const events = new EventBus();
    const visuals = [];
    let restartCount = 0;
    const scene = {
      events,
      teardownManagers,
      playerPresentation: null,
      combatFeedback: null,
      audio: null,
      ui: null,
      showMissionResultOverlay(config) {
        assert.equal(config.type, outcome, `${outcome} wrapper must select its real result type`);
        return {
          resultType: config.type,
          activateRestart: () => this.scene.restart()
        };
      },
      scene: {
        restart() {
          restartCount += 1;
          events.emit(SHUTDOWN);
        }
      }
    };
    const showOutcome = outcome === "failure"
      ? menusMixin.showGameOverOverlay
      : menusMixin.showVictoryOverlay;
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const firstCycleVisual = visuals.length;
      const displayScene = createLifecycleDisplayScene(visuals);
      const resourceBaseline = {
        timers: displayScene.timerCount,
        tweens: displayScene.tweenCount,
        visibleSprites: displayScene.visibleSpriteCount
      };
      const baseController = createCombatFeedbackController(displayScene, {
        poolLimits: { attack: 1, hit: 1, death: 1 }
      });
      const ownedTimer = displayScene.time.delayedCall(1000, () => {});
      const ownedTween = displayScene.tweens.add({ duration: 1000 });
      const controller = {
        ...baseController,
        setPaused(value) {
          ownedTimer.paused = value === true;
          ownedTween.paused = value === true;
          baseController.setPaused(value);
        },
        destroy() {
          assert.equal(ownedTimer.paused, true, "shutdown freezes owned timer before destroy");
          assert.equal(ownedTween.paused, true, "shutdown freezes owned tween before destroy");
          ownedTimer.remove();
          ownedTween.remove();
          baseController.destroy();
        }
      };
      const player = createActor();
      player.visible = true;
      player.setVisible = function setVisible(value) {
        this.visible = value;
        return this;
      };
      const enemy = createActor();
      displayScene.player = player;
      const playerPresentation = createPlayerPresentationController(displayScene, { anchor: player });
      assert.equal(playerPresentation.snapshot().hasVisual, true);
      assert.equal(displayScene.visibleSpriteCount, resourceBaseline.visibleSprites + 1);
      controller.trackActor(player, { kind: "player" });
      controller.trackActor(enemy, { kind: "enemy" });
      controller.notifyAttack({ originX: 1, originY: 2, angle: 0, heavy: false });
      controller.notifyHit({ x: 2, y: 3, impactX: 2, impactY: 3, enemyType: "drone", lethal: false });
      controller.notifyDeath({ x: 2, y: 3, enemyType: "drone", isBoss: false });
      controller.update(1);
      scene.playerPresentation = playerPresentation;
      scene.combatFeedback = controller;
      scene.audio = { destroy() {} };
      scene.ui = { destroy() {} };

      installManagerTeardown(scene);
      assert.equal(events.listenerCount(SHUTDOWN), 1, `${outcome} cycle ${cycle} shutdown listener`);
      assert.equal(events.listenerCount(DESTROY), 1, `${outcome} cycle ${cycle} destroy listener`);
      assert.equal(displayScene.timerCount, resourceBaseline.timers + 1, "controller fixture owns one live timer");
      assert.equal(displayScene.tweenCount, resourceBaseline.tweens + 1, "controller fixture owns one live tween");
      const resultOverlay = showOutcome.call(scene);
      assert.equal(resultOverlay.resultType, outcome);
      resultOverlay.activateRestart();

      assert.equal(restartCount, cycle + 1, `${outcome} must execute one real Scene restart per cycle`);
      assert.deepEqual(
        [scene.playerPresentation, scene.combatFeedback, scene.audio, scene.ui],
        [null, null, null, null]
      );
      assert.equal(displayScene.timerCount, resourceBaseline.timers, "feedback teardown preserves timer baseline");
      assert.equal(displayScene.tweenCount, resourceBaseline.tweens, "feedback teardown preserves tween baseline");
      assert.equal(
        displayScene.visibleSpriteCount,
        resourceBaseline.visibleSprites,
        "player presentation teardown preserves visible Sprite baseline"
      );
      assert.equal(player.visible, true, "gameplay anchor is restored for restart");
      const cycleVisuals = visuals.slice(firstCycleVisual);
      assert.ok(cycleVisuals.every((visual) => visual.destroyed), `${outcome} cycle ${cycle} releases shadows and pools`);
      const feedbackVisuals = cycleVisuals.filter((visual) => visual.kind !== "sprite");
      assert.ok(feedbackVisuals.every((visual) => (
        visual.resourcesAtDestroy.timers === resourceBaseline.timers
        && visual.resourcesAtDestroy.tweens === resourceBaseline.tweens
      )), `${outcome} cycle ${cycle} stops feedback timers and tweens before destroying its visuals`);
      assert.equal(events.listenerCount(SHUTDOWN), 0);
      assert.equal(events.listenerCount(DESTROY), 1);
    }
    events.emit(DESTROY);
    assert.equal(events.listenerCount(SHUTDOWN), 0);
    assert.equal(events.listenerCount(DESTROY), 0);
  }
});

function createLifecycleDisplayScene(visuals) {
  function visual(kind = "display", textureKey = null) {
    const target = {
      kind,
      active: true,
      visible: true,
      destroyed: false,
      texture: textureKey === null ? undefined : { key: textureKey },
      setOrigin() { return this; }, setPosition() { return this; }, setDisplaySize() { return this; },
      setAlpha() { return this; }, setVisible() { return this; }, setTint() { return this; },
      setRotation() { return this; }, setDepth() { return this; }, setScale() { return this; },
      setTexture(key) { this.texture = { key }; return this; },
      setFlipX() { return this; }, clear() { return this; },
      fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; },
      lineBetween() { return this; }, strokeRect() { return this; }, strokeCircle() { return this; },
      destroy() {
        if (this.destroyed) return;
        this.resourcesAtDestroy = {
          timers: scene.timerCount,
          tweens: scene.tweenCount
        };
        if (kind === "sprite") scene.visibleSpriteCount -= 1;
        this.active = false;
        this.visible = false;
        this.destroyed = true;
      }
    };
    if (kind === "sprite") scene.visibleSpriteCount += 1;
    visuals.push(target);
    return target;
  }
  const scene = {
    timerCount: 1,
    tweenCount: 1,
    visibleSpriteCount: 0,
    textures: { exists() { return false; } },
    add: {
      image: () => visual(),
      graphics: () => visual(),
      sprite: (_x, _y, key) => visual("sprite", key)
    }
  };
  scene.time = {
    now: 0,
    delayedCall() {
      scene.timerCount += 1;
      let removed = false;
      return {
        paused: false,
        remove() {
          if (removed) return;
          removed = true;
          scene.timerCount -= 1;
        }
      };
    }
  };
  scene.tweens = {
    add() {
      scene.tweenCount += 1;
      let removed = false;
      return {
        paused: false,
        remove() {
          if (removed) return;
          removed = true;
          scene.tweenCount -= 1;
        }
      };
    }
  };
  return scene;
}
