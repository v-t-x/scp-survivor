import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAYER_PRESENTATION_MOTION,
  PLAYER_TWO_DIRECTION_DEFAULT_FACING,
  createPlayerPresentationSnapshot,
  getPlayerTwoDirectionFacing,
  getPlayerMovementPresentation
} from '../src/art/playerPresentationModel.js';

test('creates a frozen snapshot with only nine primitive presentation fields without mutating scene state', () => {
  const scene = {
    player: {
      active: true,
      isDying: false,
      x: 48,
      y: 96,
      body: { velocity: { x: 120, y: -30 } }
    },
    playerFacingAngle: Math.PI / 4,
    elapsedSurvivalMs: 600,
    dashUntilMs: 700,
    selectedWeaponId: "pistol"
  };
  const before = structuredClone(scene);

  const snapshot = createPlayerPresentationSnapshot(scene);

  assert.deepEqual(Object.keys(snapshot), [
    'active', 'x', 'y', 'velocityX', 'velocityY', 'facingAngle', 'elapsedMs', 'dashActive', 'selectedWeaponId'
  ]);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.deepEqual(scene, before);
  assert.equal(snapshot.velocityX, 120);
  assert.equal(snapshot.velocityY, -30);
  assert.equal(snapshot.dashActive, true);
  assert.equal(snapshot.selectedWeaponId, "pistol");
  scene.selectedWeaponId = "tesla";
  assert.equal(snapshot.selectedWeaponId, "pistol", "snapshot retains its primitive weapon id");
});

test('keeps idle presentation level and at its fixed foot world position', () => {
  const presentation = getPlayerMovementPresentation({ x: 30, y: 40, elapsedMs: 99 });

  assert.equal(presentation.footX, 30);
  assert.equal(presentation.footY, 52);
  assert.equal(presentation.bobY, 0);
  assert.equal(presentation.rotation, 0);
  assert.equal(presentation.animationRate, 1);
  assert.equal(Object.isFrozen(presentation), true);
});

test('keeps horizontal movement bob, lean, rate, and shadow-independent foot position within limits', () => {
  const presentation = getPlayerMovementPresentation({
    x: 20,
    y: 35,
    velocityX: 160,
    velocityY: 0,
    elapsedMs: 100
  });

  assert.equal(presentation.footX, 20);
  assert.equal(presentation.footY, 35 + PLAYER_PRESENTATION_MOTION.footOffsetY);
  assert.ok(Math.abs(presentation.bobY) <= 1.25);
  assert.ok(Math.abs(presentation.rotation) <= (2 * Math.PI) / 180);
  assert.ok(presentation.animationRate >= 0.85 && presentation.animationRate <= 1.35);
});

test('allows at most four degrees of dash lean', () => {
  const presentation = getPlayerMovementPresentation({
    velocityX: -160,
    velocityY: 0,
    elapsedMs: 100,
    dashActive: true
  });

  assert.ok(Math.abs(presentation.rotation) <= (4 * Math.PI) / 180);
  assert.equal(presentation.rotation, -PLAYER_PRESENTATION_MOTION.maxDashLeanRadians);
});

test('turns NaN, Infinity, and missing fields into a finite stationary result', () => {
  const snapshot = createPlayerPresentationSnapshot({
    player: {
      active: true,
      x: NaN,
      y: Infinity,
      body: { velocity: { x: NaN, y: -Infinity } }
    },
    playerFacingAngle: Infinity,
    elapsedSurvivalMs: NaN,
    dashUntilMs: Infinity
  });
  const presentation = getPlayerMovementPresentation({
    x: NaN,
    y: Infinity,
    velocityX: Infinity,
    velocityY: NaN,
    elapsedMs: -Infinity,
    dashActive: true
  });

  assert.deepEqual(snapshot, {
    active: true,
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    facingAngle: 0,
    elapsedMs: 0,
    dashActive: false,
    selectedWeaponId: null
  });
  assert.deepEqual(presentation, {
    footX: 0,
    footY: 12,
    bobY: 0,
    rotation: 0,
    animationRate: 1
  });
});

test("two-direction facing changes only on a finite non-zero horizontal velocity", () => {
  assert.equal(PLAYER_TWO_DIRECTION_DEFAULT_FACING, "left");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: -80, previousFacing: "right" }), "left");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: 80, previousFacing: "left" }), "right");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: 0, previousFacing: "left" }), "left");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: 0, previousFacing: "right" }), "right");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: NaN, previousFacing: "right" }), "right");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: Infinity, previousFacing: "left" }), "left");
  assert.equal(getPlayerTwoDirectionFacing({ velocityX: 0, previousFacing: "up" }), "left");
  assert.equal(getPlayerTwoDirectionFacing(), "left");
});
