import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("desktop dependencies stay isolated", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  );
  assert.equal(manifest.private, true);
  assert.equal(manifest.type, "module");
  assert.equal(manifest.main, "src/main.mjs");
  assert.equal(manifest.devDependencies.electron, "43.1.0");
  assert.equal(manifest.devDependencies["@electron-forge/cli"], "7.11.2");
});
