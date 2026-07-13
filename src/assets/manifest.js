// Asset manifest — the single source of truth for asset keys and paths.
//
// This file is owned by the UI/art Agent. Gameplay code references textures via
// the TEXTURES key constants below (never raw strings), so renaming an asset or
// swapping a procedural fallback for a real sprite only touches this file.
//
// Approved formal art has priority. PreloadScene loads any declared real assets
// first, then src/assets/fallbackTextureFactory.js fills only the missing keys.

// Stable texture keys. Gameplay imports these instead of hard-coding strings.
// The string values match the keys the game already used, so nothing that reads
// them needs to change.
export const TEXTURES = {
  player: "player-rect",
  playerOpeningSheet: "player-opening-sheet",
  enemyInfected: "enemy-infected",
  infectedOpeningSheet: "infected-opening-sheet",
  enemyCrawler: "enemy-crawler",
  enemyDrone: "enemy-drone",
  eliteRiot: "elite-riot",
  eliteBlink: "elite-blink",
  eliteBiomass: "elite-biomass",
  biomassChild: "biomass-child",
  enemyScp049: "enemy-scp049",
  facilityFloor: "facility-floor",
  facilityWall: "facility-wall",
  facilityDoor: "facility-door",
  facilityConsole: "facility-console",
  facilityVent: "facility-vent",
  facilityDecal: "facility-decal",
  facilityServiceFloor: "facility-service-floor",
  facilityHazardStripe: "facility-hazard-stripe",
  facilityObservationWindow: "facility-observation-window",
  facilityPipeBank: "facility-pipe-bank",
  titleFacilityBackdrop: "title-facility-backdrop",
  armoryRackBackdrop: "armory-rack-backdrop",
  weaponPistolIcon: "weapon-pistol-icon",
  weaponBreacherIcon: "weapon-breacher-icon",
  weaponTeslaIcon: "weapon-tesla-icon",
  weaponRigPistol: "weapon-rig-pistol",
  weaponRigBreacher: "weapon-rig-breacher",
  weaponRigTesla: "weapon-rig-tesla",
  bullet: "bullet-circle",
  enemyProjectile: "enemy-projectile",
  xpGem: "xp-gem",
  combatStim: "combat-stim",
  scp500: "scp500",
  powerOutageLight: "power-outage-light"
};

// Real image assets to preload. The loader will prefer these over fallback
// textures and will leave the procedural texture in place if the file is absent.
export const IMAGE_ASSETS = [
  { key: TEXTURES.facilityFloor, path: "assets/art/facility/floor.png" },
  { key: TEXTURES.facilityWall, path: "assets/art/facility/wall.png" },
  { key: TEXTURES.facilityDoor, path: "assets/art/facility/door.png" },
  { key: TEXTURES.facilityConsole, path: "assets/art/facility/console.png" },
  { key: TEXTURES.facilityVent, path: "assets/art/facility/vent.png" },
  { key: TEXTURES.facilityDecal, path: "assets/art/facility/decal.png" },
  { key: TEXTURES.facilityServiceFloor, path: "assets/art/facility/service-floor.png" },
  { key: TEXTURES.facilityHazardStripe, path: "assets/art/facility/hazard-stripe.png" },
  { key: TEXTURES.facilityObservationWindow, path: "assets/art/facility/observation-window.png" },
  { key: TEXTURES.facilityPipeBank, path: "assets/art/facility/pipe-bank.png" },
  { key: TEXTURES.player, path: "assets/art/characters/player.png" },
  { key: TEXTURES.enemyInfected, path: "assets/art/characters/infected-staff.png" },
  { key: TEXTURES.enemyScp049, path: "assets/art/characters/scp-049.png" },
  { key: TEXTURES.armoryRackBackdrop, path: "assets/art/menus/armory-rack-backdrop.png" },
  { key: TEXTURES.weaponPistolIcon, path: "assets/art/weapons/pistol.png" },
  { key: TEXTURES.weaponBreacherIcon, path: "assets/art/weapons/breacher.png" },
  { key: TEXTURES.weaponTeslaIcon, path: "assets/art/weapons/tesla.png" },
  { key: TEXTURES.titleFacilityBackdrop, path: "assets/art/menus/title-facility-backdrop.png" }
];

// Opening character sheets keep the original static textures above as fallback.
export const SPRITESHEET_ASSETS = [
  {
    key: TEXTURES.playerOpeningSheet,
    path: "assets/art/characters/player-opening-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.infectedOpeningSheet,
    path: "assets/art/characters/infected-opening-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.weaponRigPistol,
    path: "assets/art/weapons/rig-pistol.png",
    frameConfig: { frameWidth: 96, frameHeight: 96 }
  },
  {
    key: TEXTURES.weaponRigBreacher,
    path: "assets/art/weapons/rig-breacher.png",
    frameConfig: { frameWidth: 96, frameHeight: 96 }
  },
  {
    key: TEXTURES.weaponRigTesla,
    path: "assets/art/weapons/rig-tesla.png",
    frameConfig: { frameWidth: 96, frameHeight: 96 }
  }
];
export const ATLAS_ASSETS = [];

// Real audio assets to preload. Empty for now — audio is synthesized at runtime
// by AudioManager via the Web Audio API.
export const AUDIO_ASSETS = [];
