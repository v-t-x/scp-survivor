import test from "node:test";
import assert from "node:assert/strict";
import {
  OPENING_VIEWPORT,
  OPENING_ASSET_SPECS,
  HUD_REGIONS,
  OPENING_FACILITY_ZONES
} from "../src/art/openingVisualContract.js";

test("opening visual contract fixes the approved production dimensions", () => {
  assert.deepEqual(OPENING_VIEWPORT, { width: 960, height: 540 });
  assert.deepEqual(OPENING_ASSET_SPECS.player, {
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    idleFrames: 4,
    moveFrames: 6,
    hitFrames: 2
  });
  assert.deepEqual(OPENING_ASSET_SPECS.weaponIllustration, { width: 96, height: 96 });
  assert.equal(HUD_REGIONS.mission.anchor, "top-left");
  assert.equal(HUD_REGIONS.vitals.anchor, "bottom-left");
  assert.equal(HUD_REGIONS.weapon.anchor, "bottom-right");
  assert.equal(HUD_REGIONS.facility.anchor, "top-center");
  assert.deepEqual(Object.keys(OPENING_FACILITY_ZONES), [
    "entry",
    "observation",
    "maintenance",
    "contamination"
  ]);
});
