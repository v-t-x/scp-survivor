import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { stageWeb } from "../scripts/stage-web.mjs";

test("stageWeb copies and fingerprints sorted files", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "scp-stage-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = join(root, "dist");
  const stageDir = join(root, "stage");
  await mkdir(join(sourceDir, "assets"), { recursive: true });
  await writeFile(join(sourceDir, "index.html"), "<main>ok</main>");
  await writeFile(join(sourceDir, "assets", "game.js"), "export default 1;");

  const manifest = await stageWeb({
    sourceDir,
    stageDir,
    commit: "abc123",
    dirty: false
  });

  assert.deepEqual(manifest.files.map((entry) => entry.path), [
    "assets/game.js",
    "index.html"
  ]);
  assert.equal(manifest.files.every((entry) => entry.sha256.length === 64), true);
  assert.equal(await readFile(join(stageDir, "index.html"), "utf8"), "<main>ok</main>");
  const saved = JSON.parse(
    await readFile(join(stageDir, "build-manifest.json"), "utf8")
  );
  assert.deepEqual(saved, manifest);
});

test("stageWeb rejects a source without index.html", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "scp-stage-missing-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "dist"));
  await assert.rejects(
    stageWeb({
      sourceDir: join(root, "dist"),
      stageDir: join(root, "stage"),
      commit: "abc123",
      dirty: false
    }),
    { message: "Missing web entry: index.html" }
  );
});
