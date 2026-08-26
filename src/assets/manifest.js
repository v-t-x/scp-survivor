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
  playerResponseOperativeBodySheet: "player-response-operative-body-sheet",
  playerResponseOperativePrototypeSheet: "player-response-operative-prototype-sheet",
  playerResponseOperativeBodyPrototypeSheet: "player-response-operative-body-prototype-sheet",
  playerResponseOperativeSheet: "player-response-operative-sheet",
  playerResponseOperativeBreacherSampleSheet: "player-response-operative-breacher-sample-sheet",
  playerResponseOperativeCbrnSampleSheet: "player-response-operative-cbrn-sample-sheet",
  enemyInfected: "enemy-infected",
  infectedOpeningSheet: "infected-opening-sheet",
  r17Drifter: "r17-drifter",
  r17RiftSkimmer: "r17-rift-skimmer",
  r17PulseSac: "r17-pulse-sac",
  r17CarapaceGate: "r17-carapace-gate",
  r17FrameGap: "r17-frame-gap",
  r17BroodMass: "r17-brood-mass",
  r17Bud: "r17-bud",
  r17DrifterActionSheet: "r17-drifter-action-sheet",
  r17RiftSkimmerActionSheet: "r17-rift-skimmer-action-sheet",
  r17PulseSacActionSheet: "r17-pulse-sac-action-sheet",
  r17CarapaceGateActionSheet: "r17-carapace-gate-action-sheet",
  r17FrameGapActionSheet: "r17-frame-gap-action-sheet",
  r17BroodMassActionSheet: "r17-brood-mass-action-sheet",
  r17BudActionSheet: "r17-bud-action-sheet",
  enemyCrawler: "enemy-crawler",
  enemyDrone: "enemy-drone",
  eliteRiot: "elite-riot",
  eliteBlink: "elite-blink",
  eliteBiomass: "elite-biomass",
  biomassChild: "biomass-child",
  enemyScp049: "enemy-scp049",
  enemyScp049LocomotionSheet: "enemy-scp049-locomotion-sheet",
  enemyScp049ActionSheet: "enemy-scp049-action-sheet",
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
  facilityCombatFloor: "facility-combat-floor",
  facilityEntryThreshold: "facility-entry-threshold",
  facilityMaintenanceDeck: "facility-maintenance-deck",
  facilityWallBank: "facility-wall-bank",
  facilityPowerJunction: "facility-power-junction",
  facilityContaminationTrail: "facility-contamination-trail",
  titleFacilityBackdrop: "title-facility-backdrop",
  armoryRackBackdrop: "armory-rack-backdrop",
  weaponPistolIcon: "weapon-pistol-icon",
  weaponBreacherIcon: "weapon-breacher-icon",
  weaponTeslaIcon: "weapon-tesla-icon",
  playerFoundationRifleCore: "player-foundation-rifle-core",
  playerTeslaEmitterCore: "player-tesla-emitter-core",
  playerTeslaPowerModule: "player-tesla-power-module",
  playerFoundationRifleConnectorBack: "player-foundation-rifle-connector-back",
  playerFoundationRifleConnectorFront: "player-foundation-rifle-connector-front",
  playerTeslaEmitterConnectorBack: "player-tesla-emitter-connector-back",
  playerTeslaEmitterConnectorFront: "player-tesla-emitter-connector-front",
  playerFoundationRifleSameBack: "player-foundation-rifle-same-back",
  playerFoundationRifleSameFront: "player-foundation-rifle-same-front",
  playerFoundationRifleCrossBack: "player-foundation-rifle-cross-back",
  playerFoundationRifleCrossFront: "player-foundation-rifle-cross-front",
  playerTeslaEmitterSameBack: "player-tesla-emitter-same-back",
  playerTeslaEmitterSameFront: "player-tesla-emitter-same-front",
  playerTeslaEmitterCrossBack: "player-tesla-emitter-cross-back",
  playerTeslaEmitterCrossFront: "player-tesla-emitter-cross-front",
  playerFoundationRifleAimBack: "player-foundation-rifle-aim-back",
  playerFoundationRifleAimFront: "player-foundation-rifle-aim-front",
  playerFoundationRifleAimRecoilBack: "player-foundation-rifle-aim-recoil-back",
  playerFoundationRifleAimRecoilFront: "player-foundation-rifle-aim-recoil-front",
  playerTeslaEmitterAimBack: "player-tesla-emitter-aim-back",
  playerTeslaEmitterAimFront: "player-tesla-emitter-aim-front",
  playerTeslaEmitterAimRecoilBack: "player-tesla-emitter-aim-recoil-back",
  playerTeslaEmitterAimRecoilFront: "player-tesla-emitter-aim-recoil-front",
  upgradeDamage: "upgrade-damage",
  upgradeAttackSpeed: "upgrade-attack-speed",
  upgradeMoveSpeed: "upgrade-move-speed",
  upgradeMaxHealth: "upgrade-max-health",
  upgradeProjectileCount: "upgrade-projectile-count",
  upgradePenetration: "upgrade-penetration",
  upgradePickupRadius: "upgrade-pickup-radius",
  upgradeEmergencyHeal: "upgrade-emergency-heal",
  upgradeBreacherKnockback: "upgrade-breacher-knockback",
  upgradeBreacherSuppression: "upgrade-breacher-suppression",
  upgradeBreacherMagazine: "upgrade-breacher-magazine",
  upgradeTeslaChains: "upgrade-tesla-chains",
  upgradeTeslaCooldown: "upgrade-tesla-cooldown",
  upgradePistolBoomerang: "upgrade-pistol-boomerang",
  upgradeBreacherExplosive: "upgrade-breacher-explosive",
  upgradeTeslaField: "upgrade-tesla-field",
  terminalSurfaceGrid: "terminal-surface-grid",
  incidentStampFrame: "incident-stamp-frame",
  recontainmentStampFrame: "recontainment-stamp-frame",
  contactShadow: "contact-shadow",
  bullet: "bullet-circle",
  enemyProjectile: "enemy-projectile",
  xpGem: "xp-gem",
  combatStim: "combat-stim",
  medkit: "medkit",
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
  { key: TEXTURES.facilityCombatFloor, path: "assets/art/facility/combat-floor.png" },
  { key: TEXTURES.facilityEntryThreshold, path: "assets/art/facility/entry-threshold.png" },
  { key: TEXTURES.facilityMaintenanceDeck, path: "assets/art/facility/maintenance-deck.png" },
  { key: TEXTURES.facilityWallBank, path: "assets/art/facility/wall-bank.png" },
  { key: TEXTURES.facilityPowerJunction, path: "assets/art/facility/power-junction.png" },
  { key: TEXTURES.facilityContaminationTrail, path: "assets/art/facility/contamination-trail.png" },
  { key: TEXTURES.player, path: "assets/art/characters/player.png" },
  { key: TEXTURES.enemyScp049, path: "assets/art/characters/scp-049.png" },
  { key: TEXTURES.armoryRackBackdrop, path: "assets/art/menus/armory-rack-backdrop.png" },
  { key: TEXTURES.weaponPistolIcon, path: "assets/art/weapons/foundation-containment-rifle-icon.png" },
  { key: TEXTURES.weaponBreacherIcon, path: "assets/art/weapons/breacher.png" },
  { key: TEXTURES.weaponTeslaIcon, path: "assets/art/weapons/tesla-containment-emitter-icon.png" },
  { key: TEXTURES.playerTeslaPowerModule, path: "assets/art/weapons/tesla-containment-power-module.png" },
  { key: TEXTURES.titleFacilityBackdrop, path: "assets/art/menus/title-facility-backdrop.png" },
  { key: TEXTURES.upgradeDamage, path: "assets/art/upgrades/damage.png" },
  { key: TEXTURES.upgradeAttackSpeed, path: "assets/art/upgrades/attack-speed.png" },
  { key: TEXTURES.upgradeMoveSpeed, path: "assets/art/upgrades/move-speed.png" },
  { key: TEXTURES.upgradeMaxHealth, path: "assets/art/upgrades/max-health.png" },
  { key: TEXTURES.upgradeProjectileCount, path: "assets/art/upgrades/projectile-count.png" },
  { key: TEXTURES.upgradePenetration, path: "assets/art/upgrades/penetration.png" },
  { key: TEXTURES.upgradePickupRadius, path: "assets/art/upgrades/pickup-radius.png" },
  { key: TEXTURES.upgradeEmergencyHeal, path: "assets/art/upgrades/emergency-heal.png" },
  { key: TEXTURES.upgradeBreacherKnockback, path: "assets/art/upgrades/breacher-knockback.png" },
  { key: TEXTURES.upgradeBreacherSuppression, path: "assets/art/upgrades/breacher-suppression.png" },
  { key: TEXTURES.upgradeBreacherMagazine, path: "assets/art/upgrades/breacher-magazine.png" },
  { key: TEXTURES.upgradeTeslaChains, path: "assets/art/upgrades/tesla-chains.png" },
  { key: TEXTURES.upgradeTeslaCooldown, path: "assets/art/upgrades/tesla-cooldown.png" },
  { key: TEXTURES.upgradePistolBoomerang, path: "assets/art/upgrades/pistol-boomerang.png" },
  { key: TEXTURES.upgradeBreacherExplosive, path: "assets/art/upgrades/breacher-explosive.png" },
  { key: TEXTURES.upgradeTeslaField, path: "assets/art/upgrades/tesla-field.png" },
  { key: TEXTURES.terminalSurfaceGrid, path: "assets/art/ui/terminal-surface-grid.png" },
  { key: TEXTURES.incidentStampFrame, path: "assets/art/ui/incident-stamp-frame.png" },
  { key: TEXTURES.recontainmentStampFrame, path: "assets/art/ui/recontainment-stamp-frame.png" },
  { key: TEXTURES.contactShadow, path: "assets/art/effects/contact-shadow.png" }
];

// Opening character sheets keep the original static textures above as fallback.
export const SPRITESHEET_ASSETS = [
  {
    key: TEXTURES.playerOpeningSheet,
    path: "assets/art/characters/player-opening-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.playerResponseOperativeBodySheet,
    path: "assets/art/characters/player-response-operative-body.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerFoundationRifleAimBack,
    path: "assets/art/weapons/foundation-containment-rifle-aim-back.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerFoundationRifleAimFront,
    path: "assets/art/weapons/foundation-containment-rifle-aim-front.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerFoundationRifleAimRecoilBack,
    path: "assets/art/weapons/foundation-containment-rifle-aim-recoil-back.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerFoundationRifleAimRecoilFront,
    path: "assets/art/weapons/foundation-containment-rifle-aim-recoil-front.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerTeslaEmitterAimBack,
    path: "assets/art/weapons/tesla-containment-emitter-aim-back.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerTeslaEmitterAimFront,
    path: "assets/art/weapons/tesla-containment-emitter-aim-front.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerTeslaEmitterAimRecoilBack,
    path: "assets/art/weapons/tesla-containment-emitter-aim-recoil-back.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerTeslaEmitterAimRecoilFront,
    path: "assets/art/weapons/tesla-containment-emitter-aim-recoil-front.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17Drifter,
    path: "assets/art/enemies/r17-drifter.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17RiftSkimmer,
    path: "assets/art/enemies/r17-rift-skimmer.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17PulseSac,
    path: "assets/art/enemies/r17-pulse-sac.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17CarapaceGate,
    path: "assets/art/enemies/r17-carapace-gate.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17FrameGap,
    path: "assets/art/enemies/r17-frame-gap.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17BroodMass,
    path: "assets/art/enemies/r17-brood-mass.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17Bud,
    path: "assets/art/enemies/r17-bud.png",
    frameConfig: { frameWidth: 32, frameHeight: 32 }
  }
];

function createImmutableSet(values) {
  const valuesSet = new Set(values);
  const rejectMutation = () => {
    throw new TypeError("PRODUCTION_SPRITESHEET_KEYS is immutable");
  };
  let immutableSet = null;
  immutableSet = new Proxy(valuesSet, {
    get(target, property) {
      if (["add", "delete", "clear"].includes(property)) return rejectMutation;
      if (property === "valueOf") return () => immutableSet;
      if (property === "forEach") {
        return (callback, thisArg) => {
          if (typeof callback !== "function") {
            return Set.prototype.forEach.call(target, callback, thisArg);
          }
          return target.forEach((value, key) => {
            Reflect.apply(callback, thisArg, [value, key, immutableSet]);
          });
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
  return Object.freeze(immutableSet);
}

export const PRODUCTION_SPRITESHEET_KEYS = createImmutableSet(
  SPRITESHEET_ASSETS.map(({ key }) => key)
);

// Gate-only comparison sheets are loaded by the Vite development server and
// stay outside the production preload contract until the owner accepts one.
export const DEVELOPMENT_SPRITESHEET_ASSETS = [
  {
    key: TEXTURES.playerResponseOperativePrototypeSheet,
    path: "assets/art/characters/player-response-operative-prototype.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerResponseOperativeBodyPrototypeSheet,
    path: "assets/art/characters/player-response-operative-body-prototype.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerResponseOperativeBreacherSampleSheet,
    path: "assets/art/characters/player-response-operative-breacher-sample.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.playerResponseOperativeCbrnSampleSheet,
    path: "assets/art/characters/player-response-operative-cbrn-sample.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17DrifterActionSheet,
    path: "assets/art/enemies/r17-drifter-action-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17DrifterActionSheet
  },
  {
    key: TEXTURES.r17RiftSkimmerActionSheet,
    path: "assets/art/enemies/r17-rift-skimmer-action-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17RiftSkimmerActionSheet
  },
  {
    key: TEXTURES.r17PulseSacActionSheet,
    path: "assets/art/enemies/r17-pulse-sac-action-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17PulseSacActionSheet
  },
  {
    key: TEXTURES.r17CarapaceGateActionSheet,
    path: "assets/art/enemies/r17-carapace-gate-action-sheet.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17CarapaceGateActionSheet
  },
  {
    key: TEXTURES.r17FrameGapActionSheet,
    path: "assets/art/enemies/r17-frame-gap-action-sheet.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17FrameGapActionSheet
  },
  {
    key: TEXTURES.r17BroodMassActionSheet,
    path: "assets/art/enemies/r17-brood-mass-action-sheet.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17BroodMassActionSheet
  },
  {
    key: TEXTURES.r17BudActionSheet,
    path: "assets/art/enemies/r17-bud-action-sheet.png",
    frameConfig: { frameWidth: 32, frameHeight: 32 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.r17BudActionSheet
  },
  {
    key: TEXTURES.enemyScp049LocomotionSheet,
    path: "assets/art/characters/scp-049-locomotion-sheet.png",
    frameConfig: { frameWidth: 80, frameHeight: 96 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.enemyScp049LocomotionSheet
  },
  {
    key: TEXTURES.enemyScp049ActionSheet,
    path: "assets/art/characters/scp-049-action-sheet.png",
    frameConfig: { frameWidth: 80, frameHeight: 96 },
    previewQuery: Object.freeze({ name: "enemyPresentation", value: "candidate" }),
    candidateId: TEXTURES.enemyScp049ActionSheet
  }
];

export const ATLAS_ASSETS = [];

// Real audio assets to preload. Empty for now — audio is synthesized at runtime
// by AudioManager via the Web Audio API.
export const AUDIO_ASSETS = [];
