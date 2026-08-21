import { rm } from "node:fs/promises";
import path from "node:path";
import { defineConfig } from "vite";

export const NON_PRODUCTION_PLAYER_ASSETS = Object.freeze([
  "assets/art/characters/player-response-operative-prototype.png",
  "assets/art/characters/player-response-operative-body-prototype.png",
  "assets/art/characters/player-response-operative-breacher-sample.png",
  "assets/art/characters/player-response-operative-cbrn-sample.png",
  "assets/art/weapons/foundation-containment-rifle-core.png",
  "assets/art/weapons/tesla-containment-emitter-core.png",
  "assets/art/weapons/foundation-containment-rifle-connector-back.png",
  "assets/art/weapons/foundation-containment-rifle-connector-front.png",
  "assets/art/weapons/tesla-containment-emitter-connector-back.png",
  "assets/art/weapons/tesla-containment-emitter-connector-front.png",
  "assets/art/weapons/foundation-containment-rifle-same-back.png",
  "assets/art/weapons/foundation-containment-rifle-same-front.png",
  "assets/art/weapons/foundation-containment-rifle-cross-back.png",
  "assets/art/weapons/foundation-containment-rifle-cross-front.png",
  "assets/art/weapons/tesla-containment-emitter-same-back.png",
  "assets/art/weapons/tesla-containment-emitter-same-front.png",
  "assets/art/weapons/tesla-containment-emitter-cross-back.png",
  "assets/art/weapons/tesla-containment-emitter-cross-front.png"
]);

function removeDevelopmentPlayerAssets() {
  return {
    name: "remove-development-player-assets",
    apply: "build",
    async writeBundle(outputOptions) {
      const outDir = path.resolve(outputOptions.dir ?? "dist");
      const publicDir = path.resolve("public");
      if (path.relative(publicDir, outDir) === "") {
        throw new Error("refusing to remove development assets from the public source directory");
      }
      await Promise.all(NON_PRODUCTION_PLAYER_ASSETS.map(async (relativePath) => {
        const target = path.resolve(outDir, relativePath);
        const relativeTarget = path.relative(outDir, target);
        if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
          throw new Error(`refusing to remove path outside build output: ${relativePath}`);
        }
        await rm(target, { force: true });
      }));
    }
  };
}

export default defineConfig({
  plugins: [removeDevelopmentPlayerAssets()]
});
