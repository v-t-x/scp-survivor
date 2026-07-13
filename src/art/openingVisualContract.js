export const OPENING_VIEWPORT = Object.freeze({ width: 960, height: 540 });

export const OPENING_ASSET_SPECS = Object.freeze({
  floorTile: Object.freeze({ width: 32, height: 32 }),
  facilityModule: Object.freeze({ allowedSizes: Object.freeze([64, 96]) }),
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
  statusIcon: Object.freeze({ allowedSizes: Object.freeze([24, 32]) })
});

export const HUD_REGIONS = Object.freeze({
  mission: Object.freeze({ anchor: "top-left", x: 16, y: 16, width: 292, height: 92 }),
  vitals: Object.freeze({ anchor: "bottom-left", x: 16, y: 462, width: 268, height: 62 }),
  weapon: Object.freeze({ anchor: "bottom-right", x: 676, y: 446, width: 268, height: 78 }),
  facility: Object.freeze({ anchor: "top-center", x: 320, y: 12, width: 320, height: 48 })
});

export const OPENING_FACILITY_ZONES = Object.freeze({
  entry: Object.freeze({ role: "room-entry" }),
  observation: Object.freeze({ role: "containment-observation" }),
  maintenance: Object.freeze({ role: "door-and-power-control" }),
  contamination: Object.freeze({ role: "incident-trail" })
});
