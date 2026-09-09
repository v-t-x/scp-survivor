import test from "node:test";
import assert from "node:assert/strict";
import * as contract from "../src/art/openingVisualContract.js";

const {
  OPENING_VIEWPORT,
  OPENING_ASSET_SPECS,
  OPENING_PLAYER_ASSET_SPECS,
  DEFAULT_OPENING_PLAYER_ASSET_ID,
  DEFAULT_OPENING_PLAYER_ASSET_SPEC,
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

function regionsOverlap(first, second) {
  return (
    first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y
  );
}

test("opening player asset specs freeze the named legacy and response operative contracts", () => {
  assert.deepEqual(OPENING_PLAYER_ASSET_SPECS.legacy, {
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    framesPerDirection: 12,
    totalFrames: 48,
    displayScale: 1.2,
    motions: { idle: 4, move: 6, hit: 2 }
  });
  assert.deepEqual(OPENING_PLAYER_ASSET_SPECS.responseOperative, {
    frameWidth: 64,
    frameHeight: 64,
    directions: 4,
    framesPerDirection: 30,
    totalFrames: 120,
    displayScale: 1,
    motions: {
      idle: 4,
      forward: 6,
      backward: 6,
      strafeLeft: 6,
      strafeRight: 6,
      hit: 2
    }
  });
  assert.equal(DEFAULT_OPENING_PLAYER_ASSET_ID, "legacy");
  assert.equal(DEFAULT_OPENING_PLAYER_ASSET_SPEC, OPENING_PLAYER_ASSET_SPECS.legacy);
  assert.equal(OPENING_ASSET_SPECS.player, DEFAULT_OPENING_PLAYER_ASSET_SPEC);
  assert.equal(Object.isFrozen(OPENING_PLAYER_ASSET_SPECS), true);
  assert.equal(Object.isFrozen(OPENING_PLAYER_ASSET_SPECS.legacy), true);
  assert.equal(Object.isFrozen(OPENING_PLAYER_ASSET_SPECS.responseOperative), true);
  assert.equal(Object.isFrozen(OPENING_PLAYER_ASSET_SPECS.legacy.motions), true);
  assert.equal(Object.isFrozen(OPENING_PLAYER_ASSET_SPECS.responseOperative.motions), true);
});

test("HUD regions freeze split instruments with only facility contained in mission", () => {
  assert.deepEqual(Object.keys(HUD_REGIONS), [
    "mission",
    "vitals",
    "weapon",
    "facility",
    "system"
  ]);
  assert.deepEqual(Object.fromEntries(
    Object.entries(HUD_REGIONS).map(([name, { x, y, width, height }]) => [name, { x, y, width, height }])
  ), {
    mission: { x: 12, y: 12, width: 416, height: 48 },
    vitals: { x: 12, y: 458, width: 238, height: 70 },
    weapon: { x: 716, y: 458, width: 232, height: 70 },
    facility: { x: 317, y: 12, width: 111, height: 48 },
    system: { x: 752, y: 12, width: 196, height: 40 }
  });

  const regions = Object.entries(HUD_REGIONS);
  for (const [name, region] of regions) {
    assert.equal(Object.isFrozen(region), true, `${name} region is frozen`);
    assert.equal(region.x >= 0, true, `${name} stays inside the left edge`);
    assert.equal(region.y >= 0, true, `${name} stays inside the top edge`);
    assert.equal(region.x + region.width <= OPENING_VIEWPORT.width, true, `${name} stays inside the right edge`);
    assert.equal(region.y + region.height <= OPENING_VIEWPORT.height, true, `${name} stays inside the bottom edge`);
  }
  for (let index = 0; index < regions.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < regions.length; otherIndex += 1) {
      const [name, region] = regions[index];
      const [otherName, otherRegion] = regions[otherIndex];
      if ((name === "mission" && otherName === "facility") || (name === "facility" && otherName === "mission")) {
        const mission = HUD_REGIONS.mission;
        const facility = HUD_REGIONS.facility;
        assert.ok(facility.x >= mission.x && facility.y >= mission.y, "facility begins inside mission");
        assert.ok(facility.x + facility.width <= mission.x + mission.width, "facility fits mission width");
        assert.ok(facility.y + facility.height <= mission.y + mission.height, "facility fits mission height");
        continue;
      }
      assert.equal(regionsOverlap(region, otherRegion), false, `${name} and ${otherName} do not overlap`);
    }
  }
});

test("opening visual contract fixes the approved production dimensions", () => {
  assert.deepEqual(OPENING_VIEWPORT, { width: 960, height: 540 });
  assert.deepEqual(OPENING_ASSET_SPECS.facilityModule.allowedSizes, [64, 96, 128]);
  assert.deepEqual(OPENING_ASSET_SPECS.weaponIllustration, { width: 96, height: 96 });
  assert.equal(HUD_REGIONS.mission.anchor, "top-left");
  assert.equal(HUD_REGIONS.vitals.anchor, "bottom-left");
  assert.equal(HUD_REGIONS.weapon.anchor, "bottom-right");
  assert.equal(HUD_REGIONS.facility.anchor, "top-center");
  assert.equal(HUD_REGIONS.system.anchor, "top-right");
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
  assert.ok(Object.isFrozen(HUD_REGIONS));
});
