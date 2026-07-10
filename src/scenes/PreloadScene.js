import Phaser from "phaser";
import {
  IMAGE_ASSETS,
  SPRITESHEET_ASSETS,
  ATLAS_ASSETS,
  AUDIO_ASSETS
} from "../assets/manifest.js";
import { generateFallbackTextures } from "../assets/fallbackTextureFactory.js";

// PreloadScene — the normal startup entry for asset loading.
//
// Flow is intentionally simple and unchanged in spirit:
//     PreloadScene  ->  PrototypeScene (the existing main game scene)
//
// This is NOT a conversion to a full multi-scene architecture. PreloadScene only
// loads any declared real assets (none yet) and generates the procedural fallback
// textures, then hands off to the existing game scene. The main scene's own
// startup behavior (start screen, run flow) is untouched.
//
// Owned by the UI/art Agent.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    // Load real assets when the manifest declares them. All empty for now.
    for (const asset of IMAGE_ASSETS) {
      this.load.image(asset.key, asset.path);
    }
    for (const sheet of SPRITESHEET_ASSETS) {
      this.load.spritesheet(sheet.key, sheet.path, sheet.frameConfig);
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
    generateFallbackTextures(this);

    this.scene.start("PrototypeScene");
  }
}
