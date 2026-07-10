// Asset manifest — the single source of truth for asset keys and paths.
//
// This file is owned by the UI/art Agent. Gameplay code references textures via
// the TEXTURES key constants below (never raw strings), so renaming an asset or
// swapping a procedural fallback for a real sprite only touches this file.
//
// Current stage: no real image/audio files exist yet. IMAGE_ASSETS and
// AUDIO_ASSETS are intentionally empty; every texture is produced procedurally
// by src/assets/fallbackTextureFactory.js. When real art arrives, add entries
// here and the loader in PreloadScene will prefer them over the fallback.

// Stable texture keys. Gameplay imports these instead of hard-coding strings.
// The string values match the keys the game already used, so nothing that reads
// them needs to change.
export const TEXTURES = {
  player: "player-rect",
  enemyInfected: "enemy-infected",
  enemyCrawler: "enemy-crawler",
  enemyDrone: "enemy-drone",
  eliteRiot: "elite-riot",
  eliteBlink: "elite-blink",
  eliteBiomass: "elite-biomass",
  biomassChild: "biomass-child",
  enemyScp049: "enemy-scp049",
  bullet: "bullet-circle",
  enemyProjectile: "enemy-projectile",
  xpGem: "xp-gem",
  combatStim: "combat-stim",
  scp500: "scp500",
  powerOutageLight: "power-outage-light"
};

// Real image assets to preload, e.g. { key: TEXTURES.player, path: "assets/player.png" }.
// Empty for now — everything falls back to procedural generation.
export const IMAGE_ASSETS = [];

// Real spritesheet / texture-atlas assets. Empty at this stage.
export const SPRITESHEET_ASSETS = [];
export const ATLAS_ASSETS = [];

// Real audio assets to preload. Empty for now — audio is synthesized at runtime
// by AudioManager via the Web Audio API.
export const AUDIO_ASSETS = [];
