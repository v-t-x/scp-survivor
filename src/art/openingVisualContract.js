export const OPENING_VIEWPORT = Object.freeze({ width: 960, height: 540 });

export const OPENING_ASSET_SPECS = Object.freeze({
  floorTile: Object.freeze({ width: 32, height: 32 }),
  facilityModule: Object.freeze({ allowedSizes: Object.freeze([64, 96, 128]) }),
  player: Object.freeze({
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    idleFrames: 4,
    moveFrames: 6,
    hitFrames: 2
  }),
  ordinaryEnemy: Object.freeze({
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    idleFrames: 4,
    moveFrames: 6,
    hitFrames: 2
  }),
  weaponIllustration: Object.freeze({ width: 96, height: 96 }),
  statusIcon: Object.freeze({ allowedSizes: Object.freeze([24, 32]) }),
  facilityCombatFloor: Object.freeze({
    key: "facility-combat-floor",
    path: "assets/art/facility/combat-floor.png",
    width: 128,
    height: 128,
    alpha: "opaque"
  }),
  facilityEntryThreshold: Object.freeze({
    key: "facility-entry-threshold",
    path: "assets/art/facility/entry-threshold.png",
    width: 128,
    height: 64,
    alpha: "opaque"
  }),
  facilityMaintenanceDeck: Object.freeze({
    key: "facility-maintenance-deck",
    path: "assets/art/facility/maintenance-deck.png",
    width: 128,
    height: 128,
    alpha: "opaque"
  }),
  facilityWallBank: Object.freeze({
    key: "facility-wall-bank",
    path: "assets/art/facility/wall-bank.png",
    width: 128,
    height: 64,
    alpha: "binary"
  }),
  facilityPowerJunction: Object.freeze({
    key: "facility-power-junction",
    path: "assets/art/facility/power-junction.png",
    width: 96,
    height: 96,
    alpha: "binary"
  }),
  facilityContaminationTrail: Object.freeze({
    key: "facility-contamination-trail",
    path: "assets/art/facility/contamination-trail.png",
    width: 64,
    height: 64,
    alpha: "binary"
  })
});

export const HUD_REGIONS = Object.freeze({
  mission: Object.freeze({ anchor: "top-left", x: 16, y: 16, width: 292, height: 92 }),
  vitals: Object.freeze({ anchor: "bottom-left", x: 16, y: 462, width: 268, height: 62 }),
  weapon: Object.freeze({ anchor: "bottom-right", x: 676, y: 446, width: 268, height: 78 }),
  facility: Object.freeze({ anchor: "top-center", x: 320, y: 12, width: 320, height: 48 }),
  system: Object.freeze({ anchor: "top-right", x: 824, y: 12, width: 120, height: 64 })
});

export const OPENING_FACILITY_ZONES = Object.freeze({
  entry: Object.freeze({ role: "room-entry" }),
  observation: Object.freeze({ role: "containment-observation" }),
  combat: Object.freeze({ role: "combat-floor" }),
  maintenance: Object.freeze({ role: "door-and-power-control" }),
  contamination: Object.freeze({ role: "incident-trail" })
});

export const OPENING_FACILITY_ZONE_KEYS = Object.freeze({
  entry: Object.freeze(["facility-entry-threshold"]),
  combat: Object.freeze(["facility-combat-floor"]),
  maintenance: Object.freeze([
    "facility-maintenance-deck",
    "facility-wall-bank",
    "facility-power-junction"
  ]),
  contamination: Object.freeze(["facility-contamination-trail"])
});
