import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceGroundedLocomotion,
  createGroundedLocomotionState
} from "../src/art/playerGroundedLocomotion.js";

function movingAt(x, y, overrides = {}) {
  return Object.freeze({ x, y, velocityX: 80, velocityY: 0, ...overrides });
}

test("actual travel advances the walk cycle while elapsed time alone cannot", () => {
  let state = createGroundedLocomotionState({ x: 100, y: 200 });

  state = advanceGroundedLocomotion(state, movingAt(100, 200), 0, false);
  assert.equal(state.frame, 1);
  state = advanceGroundedLocomotion(state, movingAt(100, 200), 500, false);
  assert.equal(state.frame, 1);
  state = advanceGroundedLocomotion(state, movingAt(111, 200), 0, false);
  assert.equal(state.frame, 1, "11px is below the original fast stride");
  state = advanceGroundedLocomotion(state, movingAt(112, 200), 0, false);
  assert.equal(state.frame, 2);
});

test("diagonal travel and dash both use the original fast distance-driven stride", () => {
  let state = createGroundedLocomotionState({ x: 0, y: 0 });

  state = advanceGroundedLocomotion(state, movingAt(0, 0), 0, false);
  state = advanceGroundedLocomotion(state, movingAt(8, 8, { velocityY: 80 }), 0, false);
  assert.equal(state.frame, 1);
  state = advanceGroundedLocomotion(state, movingAt(9, 9, { velocityY: 80 }), 0, false);
  assert.equal(state.frame, 2, "diagonal remainder advances after total travel exceeds 12px");

  state = advanceGroundedLocomotion(state, movingAt(21, 9, { dashActive: true }), 0, false);
  assert.equal(state.frame, 3, "dash distance advances the same fast leg cycle");
  state = advanceGroundedLocomotion(state, movingAt(33, 9, { dashActive: true }), 0, false);
  assert.equal(state.frame, 4);
  state = advanceGroundedLocomotion(state, movingAt(33, 9, { dashActive: true }), 500, false);
  assert.equal(state.frame, 4, "elapsed time without travel still cannot advance the legs");
  state = advanceGroundedLocomotion(state, movingAt(33, 9), 0, false);
  assert.equal(state.frame, 4, "leaving dash keeps the continuous walk cycle");
});

test("stopping settles, pauses freeze locomotion, and a fresh state starts from its snapshot", () => {
  let state = createGroundedLocomotionState({ x: 20, y: 30 });

  state = advanceGroundedLocomotion(state, movingAt(20, 30), 0, false);
  state = advanceGroundedLocomotion(state, movingAt(32, 30), 0, false);
  assert.equal(state.frame, 2);
  state = advanceGroundedLocomotion(state, movingAt(44, 30), 0, false);
  assert.equal(state.frame, 3);
  state = advanceGroundedLocomotion(state, { x: 44, y: 30, velocityX: 0, velocityY: 0 }, 0, false);
  assert.equal(state.frame, 2, "the authored settle frame appears immediately");
  state = advanceGroundedLocomotion(state, { x: 44, y: 30, velocityX: 0, velocityY: 0 }, 99, false);
  assert.equal(state.frame, 2);
  state = advanceGroundedLocomotion(state, { x: 44, y: 30, velocityX: 0, velocityY: 0 }, 500, true);
  assert.equal(state.frame, 2, "pause does not consume settle time");
  state = advanceGroundedLocomotion(state, { x: 44, y: 30, velocityX: 0, velocityY: 0 }, 1, false);
  assert.equal(state.frame, 0);

  state = createGroundedLocomotionState({ x: 500, y: 900 });
  state = advanceGroundedLocomotion(state, movingAt(500, 900), 0, false);
  assert.equal(state.frame, 1, "a reset does not inherit prior travel distance");
});

test("non-finite snapshot coordinates preserve the current grounded walk state", () => {
  let state = createGroundedLocomotionState({ x: 10, y: 20 });

  state = advanceGroundedLocomotion(state, movingAt(10, 20), 0, false);
  state = advanceGroundedLocomotion(
    state,
    { x: Number.NaN, y: Number.POSITIVE_INFINITY, velocityX: 80, velocityY: 0 },
    0,
    false
  );

  assert.equal(state.frame, 1);
  assert.equal(state.x, 10);
  assert.equal(state.y, 20);
  assert.equal(state.distanceRemainderPx, 0);
  assert.ok(
    [state.frame, state.x, state.y, state.distanceRemainderPx].every(Number.isFinite),
    "invalid snapshot coordinates cannot create an invalid locomotion state"
  );
});

test("overflowing world-coordinate distance preserves a valid walk state without advancing", () => {
  let state = createGroundedLocomotionState({ x: Number.MAX_VALUE, y: 0 });

  state = advanceGroundedLocomotion(state, movingAt(Number.MAX_VALUE, 0), 0, false);
  state = advanceGroundedLocomotion(state, movingAt(-Number.MAX_VALUE, 0), 0, false);

  assert.equal(state.frame, 1);
  assert.equal(state.x, Number.MAX_VALUE);
  assert.equal(state.y, 0);
  assert.equal(state.distanceRemainderPx, 0);
  assert.ok(
    [state.frame, state.x, state.y, state.distanceRemainderPx].every(Number.isFinite),
    "overflow cannot create NaN state or an undefined frame"
  );
});
