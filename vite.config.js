import { realpath, rm } from "node:fs/promises";
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

function normalizePathForContainment(candidate) {
  const resolved = path.resolve(candidate);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

async function resolvePathThroughExistingAncestor(candidate) {
  const unresolvedSegments = [];
  let current = path.resolve(candidate);

  while (true) {
    try {
      const canonicalAncestor = await realpath(current);
      return normalizePathForContainment(path.join(canonicalAncestor, ...unresolvedSegments));
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") {
        throw error;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        return normalizePathForContainment(candidate);
      }
      unresolvedSegments.unshift(path.basename(current));
      current = parent;
    }
  }
}

function isPathWithin(directory, candidate) {
  const relative = path.relative(
    normalizePathForContainment(directory),
    normalizePathForContainment(candidate)
  );
  return relative === "" || (
    relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function pathsOverlap(left, right) {
  return isPathWithin(left, right) || isPathWithin(right, left);
}

async function rejectPublicOutputOverlap(outputDir, publicDir) {
  const lexicalOutputDir = normalizePathForContainment(outputDir);
  const lexicalPublicDir = normalizePathForContainment(publicDir);
  const [canonicalOutputDir, canonicalPublicDir] = await Promise.all([
    resolvePathThroughExistingAncestor(outputDir),
    resolvePathThroughExistingAncestor(publicDir)
  ]);
  if (
    pathsOverlap(lexicalOutputDir, lexicalPublicDir)
    || pathsOverlap(canonicalOutputDir, canonicalPublicDir)
  ) {
    throw new Error("refusing to build into an output directory that overlaps the public source directory");
  }
}

function resolveBuildOutputDirectories(resolvedConfig) {
  const defaultOutputDir = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir);
  const configuredOutput = resolvedConfig.build.rollupOptions?.output;
  const outputDirectories = new Set([defaultOutputDir]);
  if (!configuredOutput) {
    return [...outputDirectories];
  }

  for (const output of (Array.isArray(configuredOutput) ? configuredOutput : [configuredOutput])) {
    if (!output?.dir) {
      continue;
    }

    // Vite empties custom output directories relative to config.root, while Rollup writes
    // the raw output.dir relative to process.cwd(). Both interpretations can mutate files.
    outputDirectories.add(path.resolve(resolvedConfig.root, output.dir));
    outputDirectories.add(path.resolve(output.dir));
  }
  return [...outputDirectories];
}

function removeDevelopmentPlayerAssets() {
  let resolvedPublicDir = null;

  return {
    name: "remove-development-player-assets",
    apply: "build",
    async configResolved(resolvedConfig) {
      resolvedPublicDir = resolvedConfig.publicDir || null;
      if (!resolvedPublicDir) {
        return;
      }
      for (const outputDir of resolveBuildOutputDirectories(resolvedConfig)) {
        await rejectPublicOutputOverlap(outputDir, resolvedPublicDir);
      }
    },
    async writeBundle(outputOptions) {
      const outDir = path.resolve(outputOptions.dir ?? "dist");
      await rejectPublicOutputOverlap(outDir, resolvedPublicDir ?? path.resolve("public"));
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
