import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import config, { NON_PRODUCTION_PLAYER_ASSETS } from "../vite.config.js";

const NON_PRODUCTION_PLAYER_ASSET_PATHS = [
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
];

const REQUIRED_RUNTIME_PLAYER_ASSET_PATHS = [
  "assets/art/characters/player-response-operative-body.png",
  "assets/art/weapons/foundation-containment-rifle-aim-back.png",
  "assets/art/weapons/foundation-containment-rifle-aim-front.png",
  "assets/art/weapons/foundation-containment-rifle-aim-recoil-back.png",
  "assets/art/weapons/foundation-containment-rifle-aim-recoil-front.png",
  "assets/art/weapons/tesla-containment-emitter-aim-back.png",
  "assets/art/weapons/tesla-containment-emitter-aim-front.png",
  "assets/art/weapons/tesla-containment-emitter-aim-recoil-back.png",
  "assets/art/weapons/tesla-containment-emitter-aim-recoil-front.png",
  "assets/art/weapons/tesla-containment-power-module.png",
  "assets/art/weapons/foundation-containment-rifle-icon.png",
  "assets/art/weapons/tesla-containment-emitter-icon.png"
];

test("production preview code uses Vite's statically replaceable DEV guard", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(source, /if \(import\.meta\.env && import\.meta\.env\.DEV\) \{/);
  assert.doesNotMatch(source, /import\.meta\.env\?\.DEV/);
});

test("build cleanup removes every non-production player candidate but retains runtime assets", async () => {
  assert.deepEqual(NON_PRODUCTION_PLAYER_ASSETS, NON_PRODUCTION_PLAYER_ASSET_PATHS);
  const outDir = await mkdtemp(path.join(tmpdir(), "scp-player-assets-"));
  const plugin = config.plugins.find(({ name }) => name === "remove-development-player-assets");
  assert.ok(plugin);
  try {
    for (const relative of [...NON_PRODUCTION_PLAYER_ASSET_PATHS, ...REQUIRED_RUNTIME_PLAYER_ASSET_PATHS]) {
      const target = path.join(outDir, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, relative);
    }

    await plugin.writeBundle({ dir: outDir });

    for (const relative of NON_PRODUCTION_PLAYER_ASSET_PATHS) {
      await assert.rejects(stat(path.join(outDir, relative)));
    }
    for (const relative of REQUIRED_RUNTIME_PLAYER_ASSET_PATHS) {
      const target = path.join(outDir, relative);
      assert.equal(await readFile(target, "utf8"), relative);
    }
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("build cleanup refuses a public outDir before touching source player assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "scp-public-boundary-"));
  const publicDir = path.join(root, "public");
  const protectedAsset = path.join(publicDir, NON_PRODUCTION_PLAYER_ASSET_PATHS[0]);
  const previousCwd = process.cwd();
  const plugin = config.plugins.find(({ name }) => name === "remove-development-player-assets");
  try {
    await mkdir(path.dirname(protectedAsset), { recursive: true });
    await writeFile(protectedAsset, "must-not-delete");
    process.chdir(root);

    await assert.rejects(plugin.writeBundle({ dir: publicDir }), /public/i);
    assert.equal((await readFile(protectedAsset, "utf8")), "must-not-delete");
  } finally {
    process.chdir(previousCwd);
    await rm(root, { recursive: true, force: true });
  }
});
