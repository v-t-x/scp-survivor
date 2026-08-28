import Phaser from "phaser";
import {
  DEVELOPMENT_SPRITESHEET_ASSETS,
  IMAGE_ASSETS,
  SPRITESHEET_ASSETS,
  ATLAS_ASSETS,
  AUDIO_ASSETS
} from "../assets/manifest.js";
import { generateFallbackTextures } from "../assets/fallbackTextureFactory.js";
import { registerOpeningCharacterAnimations } from "../art/characterPresentation.js";
import { registerEnemyAnimations } from "../art/enemyPresentation.js";
import { runPreloadCreatePipeline } from "./preloadOrchestration.js";

// PreloadScene — the normal startup entry for asset loading.
//
// Flow is intentionally simple and unchanged in spirit:
//     PreloadScene  ->  PrototypeScene (the existing main game scene)
//
// This is NOT a conversion to a full multi-scene architecture. PreloadScene only
// loads the real assets declared by the manifest and generates procedural
// fallback textures for any missing keys, then hands off to the existing game
// scene. The main scene's own
// startup behavior (start screen, run flow) is untouched.
//
// Owned by the UI/art Agent.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // Load the real assets declared by the manifest; create() handles missing fallbacks.
    for (const asset of IMAGE_ASSETS) {
      this.load.image(asset.key, asset.path);
    }
    for (const sheet of SPRITESHEET_ASSETS) {
      this.load.spritesheet(sheet.key, sheet.path, sheet.frameConfig);
    }
    if (import.meta.env.DEV === true) {
      const searchParams = new URLSearchParams(globalThis.location?.search ?? "");
      const candidateMode = searchParams.get("enemyPresentation") === "candidate";
      const candidateIds = candidateMode
        ? new Set(searchParams.getAll("enemyCandidate"))
        : new Set();
      for (const sheet of DEVELOPMENT_SPRITESHEET_ASSETS) {
        const previewQuery = sheet.previewQuery;
        if (
          previewQuery
          && (
            searchParams.get(previewQuery.name) !== previewQuery.value
            || !candidateIds.has(sheet.candidateId)
          )
        ) {
          continue;
        }
        this.load.spritesheet(sheet.key, sheet.path, sheet.frameConfig);
      }
    }
    for (const atlas of ATLAS_ASSETS) {
      this.load.atlas(atlas.key, atlas.texturePath, atlas.dataPath);
    }
    for (const audio of AUDIO_ASSETS) {
      this.load.audio(audio.key, audio.path);
    }
  }

  create() {
    // Generate procedural fallbacks for any texture key not provided by a real
    // asset above. Existence-checked per key, so real art is never overwritten.
    runPreloadCreatePipeline(this, {
      generateFallbackTextures,
      registerOpeningCharacterAnimations,
      registerEnemyAnimations
    });
  }
}
