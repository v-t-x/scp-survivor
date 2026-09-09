import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import {
  defaultMetaProgress,
  loadMetaProgress,
  saveMetaProgress
} from "../src/config/meta.js";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

async function loadProgressionMixinForAwards() {
  const source = await readFile(
    new URL("../src/scene/progression.js", import.meta.url),
    "utf8"
  );
  const awardRunCredits = extractObjectMethod(source, "awardRunCredits");
  return Function(
    "BALANCE",
    "saveMetaProgress",
    `"use strict"; return ({${awardRunCredits}});`
  )(BALANCE, saveMetaProgress);
}

function withLocalStorage(t, localStorage) {
  const previousWindow = globalThis.window;
  t.after(() => {
    globalThis.window = previousWindow;
  });
  globalThis.window = { localStorage };
}

test("meta load and save preserve the existing key schema and storage failure fallback", (t) => {
  const writes = [];
  withLocalStorage(t, {
    getItem(key) {
      assert.equal(key, "scp-survivor-meta");
      return JSON.stringify({ credits: 320, perks: { startDamage: true }, ignored: 1 });
    },
    setItem(key, value) {
      writes.push([key, JSON.parse(value)]);
    }
  });

  const loaded = loadMetaProgress();
  assert.deepEqual(loaded, { credits: 320, perks: { startDamage: true } });
  saveMetaProgress(loaded);
  assert.deepEqual(writes, [["scp-survivor-meta", loaded]]);
});

test("meta load returns a fresh default for missing corrupt or unreadable storage", (t) => {
  const cases = [
    { name: "missing", getItem: () => null },
    { name: "corrupt JSON", getItem: () => "{" },
    { name: "storage error", getItem: () => { throw new Error("blocked"); } }
  ];

  for (const storageCase of cases) {
    withLocalStorage(t, { getItem: storageCase.getItem, setItem() {} });
    const firstLoaded = loadMetaProgress();
    const secondLoaded = loadMetaProgress();
    assert.deepEqual(firstLoaded, secondLoaded, storageCase.name);
    assert.notStrictEqual(firstLoaded, secondLoaded, storageCase.name);
    assert.deepEqual(firstLoaded, defaultMetaProgress(), storageCase.name);
  }
});

test("meta save leaves the caller-owned in-memory object intact when storage throws", (t) => {
  withLocalStorage(t, {
    getItem() { return null; },
    setItem() { throw new Error("quota"); }
  });
  const meta = { credits: 45, perks: { startMoveSpeed: true } };
  const before = structuredClone(meta);

  assert.doesNotThrow(() => saveMetaProgress(meta));
  assert.deepEqual(meta, before);
});

// Break caught: award changes to save zero or multiple times, or its existing
// kill/time/victory credit formula is altered while progression.js remains
// intentionally unimportable under Node's Phaser entry path.
test("awardRunCredits saves once and keeps the existing kill time and victory formula", async (t) => {
  const writes = [];
  withLocalStorage(t, {
    setItem(key, value) {
      writes.push([key, JSON.parse(value)]);
    }
  });
  const progressionMixin = await loadProgressionMixinForAwards();
  const cases = [
    {
      name: "non-victory",
      isVictory: false,
      scene: { elapsedSurvivalMs: 7_500, killCount: 8, meta: { credits: 12, perks: {} } },
      earned: 7,
      credits: 19
    },
    {
      name: "victory",
      isVictory: true,
      scene: { elapsedSurvivalMs: 7_500, killCount: 8, meta: { credits: 12, perks: {} } },
      earned: 207,
      credits: 219
    }
  ];

  for (const awardCase of cases) {
    const startWrites = writes.length;
    const earned = progressionMixin.awardRunCredits.call(
      awardCase.scene,
      awardCase.isVictory
    );

    assert.equal(earned, awardCase.earned, awardCase.name);
    assert.equal(awardCase.scene.meta.credits, awardCase.credits, awardCase.name);
    assert.equal(writes.length, startWrites + 1, awardCase.name);
    assert.deepEqual(writes.at(-1), ["scp-survivor-meta", awardCase.scene.meta], awardCase.name);
  }
});
