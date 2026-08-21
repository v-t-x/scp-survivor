import test from "node:test";
import assert from "node:assert/strict";

const TESLA_BLUE = 0x3692ff;
const TESLA_WHITE = 0xe2f7ff;

function freezeSegments(segments) {
  return Object.freeze(segments.map((segment) => Object.freeze({ ...segment })));
}

function createChannelSnapshot({ phase, angle = 0, visualPhase = 0, segments = [] }) {
  const snapshot = {
    phase,
    segments: freezeSegments(segments)
  };
  if (phase !== "stop") {
    snapshot.weaponId = "tesla";
    snapshot.angle = angle;
    snapshot.visualPhase = visualPhase;
  }
  return Object.freeze(snapshot);
}

function createVisual() {
  return {
    active: true,
    visible: true,
    alpha: 1,
    x: 0,
    y: 0,
    destroyed: false,
    destroyCalls: 0,
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setOrigin() { return this; },
    setDisplaySize() { return this; },
    setRotation() { return this; },
    setTint() { return this; },
    setDepth() { return this; },
    setAlpha(alpha) { this.alpha = alpha; return this; },
    setVisible(visible) { this.visible = visible; return this; },
    destroy() {
      this.destroyCalls += 1;
      this.destroyed = true;
      this.active = false;
    }
  };
}

function createGraphicsVisual() {
  const visual = createVisual();
  visual.visible = false;
  visual.lines = [];
  visual.clearCalls = 0;
  visual.currentLineStyle = null;
  visual.clear = function clear() {
    this.clearCalls += 1;
    this.lines.length = 0;
    this.currentLineStyle = null;
    return this;
  };
  visual.lineStyle = function lineStyle(width, color, alpha) {
    this.currentLineStyle = { width, color, alpha };
    return this;
  };
  visual.lineBetween = function lineBetween(x1, y1, x2, y2) {
    this.lines.push({
      x1,
      y1,
      x2,
      y2,
      width: this.currentLineStyle?.width,
      color: this.currentLineStyle?.color,
      alpha: this.currentLineStyle?.alpha
    });
    return this;
  };
  visual.fillStyle = function fillStyle() { return this; };
  visual.fillRect = function fillRect() { return this; };
  return visual;
}

function createScene({ playerPresentation = undefined } = {}) {
  const graphics = [];
  const images = [];
  const tweenCalls = [];
  const scene = {
    time: { now: 0 },
    textures: { exists: () => true },
    player: {
      x: 100,
      y: 120,
      active: true,
      skewX: 0,
      skewY: 0,
      body: { velocity: { x: 0, y: 0 } }
    },
    tweens: {
      add(config) {
        tweenCalls.push(config);
        return { remove() {} };
      }
    },
    add: {
      image(x, y, key) {
        const visual = createVisual();
        visual.x = x;
        visual.y = y;
        visual.key = key;
        images.push(visual);
        return visual;
      },
      graphics() {
        const visual = createGraphicsVisual();
        graphics.push(visual);
        return visual;
      }
    }
  };
  if (playerPresentation !== undefined) scene.playerPresentation = playerPresentation;
  return { scene, graphics, images, tweenCalls };
}

function getWorldLines(graphics) {
  return graphics
    .filter((visual) => visual.visible && !visual.destroyed)
    .flatMap((visual) => visual.lines.map((line) => ({
      ...line,
      x1: line.x1 + visual.x,
      y1: line.y1 + visual.y,
      x2: line.x2 + visual.x,
      y2: line.y2 + visual.y
    })));
}

function assertSegmentUsesBlueWhite(lines, expected) {
  for (const color of [TESLA_BLUE, TESLA_WHITE]) {
    assert.ok(lines.some((line) => (
      line.color === color
      && line.x1 === expected.x1
      && line.y1 === expected.y1
      && line.x2 === expected.x2
      && line.y2 === expected.y2
    )), `missing ${color.toString(16)} Tesla line for ${JSON.stringify(expected)}`);
  }
}

async function createController(fixture) {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const controller = createCombatFeedbackController(fixture.scene);
  assert.equal(
    typeof controller.notifyTeslaChannel,
    "function",
    "combat feedback must expose the Tesla channel seam"
  );
  return controller;
}

test("Tesla channel start consumes a frozen coordinate snapshot and applies one ordered aim-plus-recoil pulse", async () => {
  const events = [];
  const fixture = createScene({
    playerPresentation: {
      updateAim(payload) {
        events.push(["aim", structuredClone(payload)]);
        return true;
      },
      notifyAttack(payload) {
        events.push(["recoil", structuredClone(payload)]);
        return true;
      }
    }
  });
  const controller = await createController(fixture);
  const snapshot = createChannelSnapshot({
    phase: "start",
    angle: 0.4,
    visualPhase: 2,
    segments: [
      { x1: 132, y1: 88, x2: 164, y2: 101 },
      { x1: 164, y1: 101, x2: 191, y2: 119 }
    ]
  });
  const before = structuredClone(snapshot);

  assert.equal(controller.notifyTeslaChannel(snapshot), true);

  assert.deepEqual(events.map(([kind]) => kind), ["aim", "recoil"]);
  for (const [, payload] of events) {
    assert.equal(payload.weaponId, "tesla");
    assert.equal(payload.angle, 0.4);
  }
  assert.equal(fixture.tweenCalls.length, 0, "handled visible recoil cannot also pulse the legacy anchor");
  assert.deepEqual(snapshot, before, "channel feedback cannot mutate its frozen caller snapshot");
  assert.ok(fixture.graphics.length > 0 && fixture.graphics.every(({ visible }) => visible));
});

test("Tesla sustain keeps one persistent blue-white arc set and follows updated world coordinates without another recoil", async () => {
  const aimUpdates = [];
  const recoilPulses = [];
  const fixture = createScene({
    playerPresentation: {
      updateAim(payload) { aimUpdates.push(structuredClone(payload)); return true; },
      notifyAttack(payload) { recoilPulses.push(structuredClone(payload)); return true; }
    }
  });
  const controller = await createController(fixture);
  const start = createChannelSnapshot({
    phase: "start",
    angle: 0,
    visualPhase: 0,
    segments: [{ x1: 128, y1: 96, x2: 180, y2: 96 }]
  });
  const sustain = createChannelSnapshot({
    phase: "sustain",
    angle: 0.75,
    visualPhase: 1,
    segments: [
      { x1: 130, y1: 91, x2: 158, y2: 112 },
      { x1: 158, y1: 112, x2: 199, y2: 137 }
    ]
  });

  assert.equal(controller.notifyTeslaChannel(start), true);
  const ownedGraphics = [...fixture.graphics];
  controller.update(5000);
  assert.ok(ownedGraphics.every(({ visible }) => visible), "a channel remains visible instead of timing out like a muzzle flash");

  assert.equal(controller.notifyTeslaChannel(sustain), true);

  assert.equal(fixture.graphics.length, ownedGraphics.length, "sustain reuses the channel visuals instead of allocating per tick");
  assert.ok(fixture.graphics.every((visual, index) => visual === ownedGraphics[index]));
  assert.equal(aimUpdates.length, 2, "start and sustain both keep the weapon aimed at the live target");
  assert.equal(aimUpdates[1].angle, 0.75);
  assert.equal(recoilPulses.length, 1, "sustain cannot retrigger recoil every damage tick");

  const lines = getWorldLines(fixture.graphics);
  assertSegmentUsesBlueWhite(lines, { x1: 130, y1: 91, x2: 158, y2: 112 });
  assertSegmentUsesBlueWhite(lines, { x1: 158, y1: 112, x2: 199, y2: 137 });
  assert.ok(
    lines.every(({ color }) => color === TESLA_BLUE || color === TESLA_WHITE),
    "the sustained discharge cannot inherit ballistic orange"
  );
  assert.ok(!lines.some(({ x2, y2 }) => x2 === 180 && y2 === 96), "stale target coordinates must be cleared");

  const directKeys = new Set(sustain.segments.map(({ x1, y1, x2, y2 }) => `${x1},${y1},${x2},${y2}`));
  const phaseOneTexture = lines
    .filter(({ x1, y1, x2, y2 }) => !directKeys.has(`${x1},${y1},${x2},${y2}`))
    .map(({ x1, y1, x2, y2, color }) => [x1, y1, x2, y2, color]);
  assert.ok(phaseOneTexture.length > 0, "the continuous discharge needs deterministic electric texture, not a flat laser line");

  controller.notifyTeslaChannel(createChannelSnapshot({
    phase: "sustain",
    angle: 0.75,
    visualPhase: 2,
    segments: sustain.segments
  }));
  const phaseTwoTexture = getWorldLines(fixture.graphics)
    .filter(({ x1, y1, x2, y2 }) => !directKeys.has(`${x1},${y1},${x2},${y2}`))
    .map(({ x1, y1, x2, y2, color }) => [x1, y1, x2, y2, color]);
  assert.notDeepEqual(phaseTwoTexture, phaseOneTexture, "visualPhase animates electric texture without consuming gameplay RNG");
});

test("pause freezes Tesla channel coordinates while resume updates them and stop hides and clears the arc", async () => {
  const fixture = createScene({
    playerPresentation: {
      updateAim() { return true; },
      notifyAttack() { return true; }
    }
  });
  const controller = await createController(fixture);
  const start = createChannelSnapshot({
    phase: "start",
    angle: 0,
    segments: [{ x1: 120, y1: 90, x2: 170, y2: 90 }]
  });
  const moved = createChannelSnapshot({
    phase: "sustain",
    angle: 1,
    visualPhase: 1,
    segments: [{ x1: 124, y1: 94, x2: 177, y2: 143 }]
  });
  const stop = Object.freeze({ phase: "stop" });

  assert.equal(controller.notifyTeslaChannel(start), true);
  const frozenLines = structuredClone(getWorldLines(fixture.graphics));
  controller.setPaused(true);
  controller.notifyTeslaChannel(moved);
  controller.update(9000);
  assert.deepEqual(getWorldLines(fixture.graphics), frozenLines);

  controller.setPaused(false);
  assert.equal(controller.notifyTeslaChannel(moved), true);
  assertSegmentUsesBlueWhite(getWorldLines(fixture.graphics), { x1: 124, y1: 94, x2: 177, y2: 143 });

  assert.equal(controller.notifyTeslaChannel(stop), true);
  assert.ok(fixture.graphics.every(({ visible }) => visible === false));
  assert.ok(fixture.graphics.every(({ lines }) => lines.length === 0));
  assert.deepEqual(stop, { phase: "stop" });
});

test("destroy releases every Tesla channel visual once and later snapshots fail closed", async () => {
  const fixture = createScene({
    playerPresentation: {
      updateAim() { return true; },
      notifyAttack() { return true; }
    }
  });
  const controller = await createController(fixture);
  const start = createChannelSnapshot({
    phase: "start",
    segments: [{ x1: 100, y1: 100, x2: 150, y2: 120 }]
  });

  assert.equal(controller.notifyTeslaChannel(start), true);
  const ownedGraphics = [...fixture.graphics];
  controller.destroy();
  controller.destroy();

  assert.ok(ownedGraphics.every(({ destroyed, destroyCalls }) => destroyed && destroyCalls === 1));
  assert.equal(controller.notifyTeslaChannel(start), false);
  assert.doesNotThrow(() => controller.update(12000));
});

test("Tesla channel drawing never consumes Phaser.Math.Between or global Math.random", async () => {
  const fixture = createScene({
    playerPresentation: {
      updateAim() { return true; },
      notifyAttack() { return true; }
    }
  });
  const controller = await createController(fixture);
  const originalRandom = Math.random;
  const hadPhaser = Object.hasOwn(globalThis, "Phaser");
  const originalPhaser = globalThis.Phaser;
  let randomCalls = 0;
  let betweenCalls = 0;

  Math.random = () => {
    randomCalls += 1;
    throw new Error("Tesla presentation consumed gameplay RNG");
  };
  globalThis.Phaser = {
    Math: {
      Linear(from, to, amount) { return from + (to - from) * amount; },
      Between() {
        betweenCalls += 1;
        throw new Error("Tesla presentation consumed Phaser RNG");
      }
    }
  };

  try {
    assert.equal(controller.notifyTeslaChannel(createChannelSnapshot({
      phase: "start",
      visualPhase: 0,
      segments: [{ x1: 111, y1: 92, x2: 165, y2: 116 }]
    })), true);
    assert.equal(controller.notifyTeslaChannel(createChannelSnapshot({
      phase: "sustain",
      visualPhase: 1,
      segments: [{ x1: 112, y1: 93, x2: 168, y2: 119 }]
    })), true);
  } finally {
    Math.random = originalRandom;
    if (hadPhaser) globalThis.Phaser = originalPhaser;
    else delete globalThis.Phaser;
  }

  assert.equal(randomCalls, 0);
  assert.equal(betweenCalls, 0);
});

test("absent or throwing player-presentation hooks cannot mutate snapshots, interrupt arcs, or add sustain recoil", async () => {
  for (const mode of ["absent", "throwing"]) {
    const fixture = createScene({
      playerPresentation: mode === "throwing"
        ? {
            updateAim() { throw new Error("aim presentation failed"); },
            notifyAttack() { throw new Error("recoil presentation failed"); }
          }
        : undefined
    });
    const controller = await createController(fixture);
    const start = createChannelSnapshot({
      phase: "start",
      angle: 0.25,
      segments: [{ x1: 125, y1: 97, x2: 172, y2: 109 }]
    });
    const sustain = createChannelSnapshot({
      phase: "sustain",
      angle: 0.5,
      visualPhase: 1,
      segments: [{ x1: 127, y1: 99, x2: 181, y2: 126 }]
    });
    const startBefore = structuredClone(start);
    const sustainBefore = structuredClone(sustain);
    const playerBefore = structuredClone(fixture.scene.player);

    assert.doesNotThrow(() => assert.equal(controller.notifyTeslaChannel(start), true), mode);
    assert.equal(fixture.tweenCalls.length, 1, `${mode} uses exactly one legacy start recoil fallback`);
    assert.doesNotThrow(() => assert.equal(controller.notifyTeslaChannel(sustain), true), mode);
    assert.equal(fixture.tweenCalls.length, 1, `${mode} sustain cannot create fallback recoil`);
    assertSegmentUsesBlueWhite(getWorldLines(fixture.graphics), { x1: 127, y1: 99, x2: 181, y2: 126 });
    assert.deepEqual(start, startBefore, `${mode} leaves the start snapshot untouched`);
    assert.deepEqual(sustain, sustainBefore, `${mode} leaves the sustain snapshot untouched`);
    assert.deepEqual(fixture.scene.player, playerBefore, `${mode} presentation failures cannot mutate gameplay state`);
  }
});

test("no-op combat feedback exposes the Tesla channel seam and rejects frozen snapshots without side effects", async () => {
  const { createNoopCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const controller = createNoopCombatFeedbackController();
  const snapshot = createChannelSnapshot({
    phase: "start",
    segments: [{ x1: 1, y1: 2, x2: 3, y2: 4 }]
  });
  const before = structuredClone(snapshot);

  assert.equal(typeof controller.notifyTeslaChannel, "function");
  assert.equal(controller.notifyTeslaChannel(snapshot), false);
  assert.deepEqual(snapshot, before);
});
