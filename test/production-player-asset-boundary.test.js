import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as viteBuild } from "vite";

import config, { NON_PRODUCTION_PLAYER_ASSETS } from "../vite.config.js";

const REPOSITORY_VITE_CONFIG = fileURLToPath(new URL("../vite.config.js", import.meta.url));
const PUBLIC_SENTINEL_BYTES = Buffer.from("task-1-public-source-sentinel\n", "utf8");

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

async function withTemporaryViteProject(prefix, run) {
  const root = await mkdtemp(path.join(tmpdir(), prefix));
  const publicDir = path.join(root, "public");
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await writeFile(
      path.join(root, "index.html"),
      '<!doctype html><html><body><script type="module" src="/src/main.js"></script></body></html>'
    );
    await writeFile(path.join(root, "src", "main.js"), 'document.body.dataset.task = "asset-boundary";');
    await run({ root, publicDir });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function observeViteBuild(root, build) {
  try {
    await viteBuild({
      root,
      configFile: REPOSITORY_VITE_CONFIG,
      logLevel: "silent",
      build: { emptyOutDir: true, ...build }
    });
    return { status: "fulfilled" };
  } catch (error) {
    return { status: "rejected", message: String(error?.message ?? error) };
  }
}

async function listRelativeFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      return listRelativeFiles(path.join(directory, entry.name), relativePath);
    }
    return [relativePath];
  }));
  return files.flat().sort();
}

function cwdRelativeRollupOutput(target) {
  return path.relative(process.cwd(), target).replaceAll(path.sep, "/");
}

async function assertViteRejectsBeforePublicMutation({ root, publicDir, build }) {
  const sentinel = path.join(publicDir, "task-1-public-source-sentinel.txt");
  await mkdir(path.dirname(sentinel), { recursive: true });
  await writeFile(sentinel, PUBLIC_SENTINEL_BYTES);
  const publicFilesBeforeBuild = await listRelativeFiles(publicDir);

  const outcome = await observeViteBuild(root, build);
  const sentinelAfterBuild = await readFile(sentinel).catch(() => null);
  const publicFilesAfterBuild = await listRelativeFiles(publicDir).catch(() => null);
  assert.deepEqual(
    { status: outcome.status, sentinelAfterBuild, publicFilesAfterBuild },
    {
      status: "rejected",
      sentinelAfterBuild: PUBLIC_SENTINEL_BYTES,
      publicFilesAfterBuild: publicFilesBeforeBuild
    }
  );
  assert.match(outcome.message, /public/i);
}

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

test("build cleanup refuses every public descendant before touching source player assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "scp-public-child-boundary-"));
  const publicDir = path.join(root, "public");
  const protectedAsset = path.join(publicDir, "generated", NON_PRODUCTION_PLAYER_ASSET_PATHS[0]);
  const previousCwd = process.cwd();
  const plugin = config.plugins.find(({ name }) => name === "remove-development-player-assets");
  try {
    await mkdir(path.dirname(protectedAsset), { recursive: true });
    await writeFile(protectedAsset, "must-not-delete");
    process.chdir(root);

    await assert.rejects(
      plugin.writeBundle({ dir: path.join(publicDir.toUpperCase(), "generated") }),
      /public/i
    );
    assert.equal((await readFile(protectedAsset, "utf8")), "must-not-delete");
  } finally {
    process.chdir(previousCwd);
    await rm(root, { recursive: true, force: true });
  }
});

test("real Vite build rejects a public output before emptyOutDir mutates the source directory", async () => {
  await withTemporaryViteProject("scp-vite-public-outdir-", ({ root, publicDir }) => (
    assertViteRejectsBeforePublicMutation({ root, publicDir, build: { outDir: "public" } })
  ));
});

test("real Vite build rejects a public descendant output before emptyOutDir mutates the source directory", async () => {
  await withTemporaryViteProject("scp-vite-public-child-", ({ root, publicDir }) => (
    assertViteRejectsBeforePublicMutation({ root, publicDir, build: { outDir: path.join("public", "generated") } })
  ));
});

test("real Vite build rejects an ancestor output before emptyOutDir mutates the public source directory", async () => {
  await withTemporaryViteProject("scp-vite-public-ancestor-", ({ root, publicDir }) => (
    assertViteRejectsBeforePublicMutation({ root, publicDir, build: { outDir: "." } })
  ));
});

test("real Vite build rejects a single Rollup output directory that targets public", async () => {
  await withTemporaryViteProject("scp-vite-rollup-single-", ({ root, publicDir }) => (
    assertViteRejectsBeforePublicMutation({
      root,
      publicDir,
      build: {
        outDir: "dist",
        rollupOptions: {
          output: {
            dir: process.platform === "win32"
              ? cwdRelativeRollupOutput(publicDir).replace(/public$/i, "PUBLIC")
              : cwdRelativeRollupOutput(publicDir)
          }
        }
      }
    })
  ));
});

test("real Vite build rejects an array Rollup output containing a public directory", async () => {
  await withTemporaryViteProject("scp-vite-rollup-array-", ({ root, publicDir }) => (
    assertViteRejectsBeforePublicMutation({
      root,
      publicDir,
      build: {
        outDir: "dist",
        rollupOptions: {
          output: [
            { dir: cwdRelativeRollupOutput(path.join(root, "dist-first")) },
            { dir: cwdRelativeRollupOutput(publicDir) }
          ]
        }
      }
    })
  ));
});

test("real Vite build rejects a junction-resolved output below public before mutation", async () => {
  await withTemporaryViteProject("scp-vite-public-junction-", async ({ root, publicDir }) => {
    const publicAlias = path.join(root, "public-link");
    await mkdir(publicDir, { recursive: true });
    await symlink(publicDir, publicAlias, "junction");
    await assertViteRejectsBeforePublicMutation({
      root,
      publicDir,
      build: {
        outDir: "dist",
        rollupOptions: {
          output: { dir: cwdRelativeRollupOutput(path.join(publicAlias, "generated")) }
        }
      }
    });
  });
});

test("real Vite build allows a separate dist and strips non-production player assets", async () => {
  await withTemporaryViteProject("scp-vite-dist-", async ({ root, publicDir }) => {
    const candidate = path.join(publicDir, NON_PRODUCTION_PLAYER_ASSET_PATHS[0]);
    const runtime = path.join(publicDir, REQUIRED_RUNTIME_PLAYER_ASSET_PATHS[0]);
    await mkdir(path.dirname(candidate), { recursive: true });
    await mkdir(path.dirname(runtime), { recursive: true });
    await writeFile(candidate, "remove-from-dist");
    await writeFile(runtime, "keep-in-dist");

    const outcome = await observeViteBuild(root, { outDir: "dist" });
    assert.equal(outcome.status, "fulfilled", outcome.message);
    await assert.rejects(stat(path.join(root, "dist", NON_PRODUCTION_PLAYER_ASSET_PATHS[0])));
    assert.equal(
      await readFile(path.join(root, "dist", REQUIRED_RUNTIME_PLAYER_ASSET_PATHS[0]), "utf8"),
      "keep-in-dist"
    );
    await stat(path.join(root, "dist", "index.html"));
  });
});
