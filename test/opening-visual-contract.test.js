import test from "node:test";
import assert from "node:assert/strict";
import * as contract from "../src/art/openingVisualContract.js";

const {
  OPENING_VIEWPORT,
  OPENING_ASSET_SPECS,
  HUD_REGIONS,
  OPENING_FACILITY_ZONES
} = contract;

const expectedFacilityModuleSpecs = {
  facilityCombatFloor: {
    key: "facility-combat-floor",
    path: "assets/art/facility/combat-floor.png",
    width: 128,
    height: 128,
    alpha: "opaque"
  },
  facilityEntryThreshold: {
    key: "facility-entry-threshold",
    path: "assets/art/facility/entry-threshold.png",
    width: 128,
    height: 64,
    alpha: "opaque"
  },
  facilityMaintenanceDeck: {
    key: "facility-maintenance-deck",
    path: "assets/art/facility/maintenance-deck.png",
    width: 128,
    height: 128,
    alpha: "opaque"
  },
  facilityWallBank: {
    key: "facility-wall-bank",
    path: "assets/art/facility/wall-bank.png",
    width: 128,
    height: 64,
    alpha: "binary"
  },
  facilityPowerJunction: {
    key: "facility-power-junction",
    path: "assets/art/facility/power-junction.png",
    width: 96,
    height: 96,
    alpha: "binary"
  },
  facilityContaminationTrail: {
    key: "facility-contamination-trail",
    path: "assets/art/facility/contamination-trail.png",
    width: 64,
    height: 64,
    alpha: "binary"
  }
};

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
    "combat",
    "maintenance",
    "contamination"
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(expectedFacilityModuleSpecs).map((key) => [key, OPENING_ASSET_SPECS[key]])
    ),
    expectedFacilityModuleSpecs
  );
  assert.deepEqual(contract.OPENING_FACILITY_ZONE_KEYS, {
    entry: ["facility-entry-threshold"],
    combat: ["facility-combat-floor"],
    maintenance: [
      "facility-maintenance-deck",
      "facility-wall-bank",
      "facility-power-junction"
    ],
    contamination: ["facility-contamination-trail"]
  });
  assert.ok(Object.isFrozen(OPENING_ASSET_SPECS));
  assert.ok(
    Object.keys(expectedFacilityModuleSpecs).every((key) => Object.isFrozen(OPENING_ASSET_SPECS[key]))
  );
  assert.ok(Object.isFrozen(contract.OPENING_FACILITY_ZONE_KEYS));
  assert.ok(
    Object.values(contract.OPENING_FACILITY_ZONE_KEYS).every((keys) => Object.isFrozen(keys))
  );
});
