import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CHARACTER_DISPLAY_SCALE,
  getOutagePresentation
} from "../src/art/presentationRules.js";

test("outage preserves facility readability at full strength", () => {
  assert.deepEqual(CHARACTER_DISPLAY_SCALE, {
    player: 1.2,
    infectedStaff: 1.15,
    scp049: 1.2
  });
  const state = getOutagePresentation(1, 1000);
  assert.equal(state.darknessAlpha, 0.82);
  assert.ok(state.facilityAlpha >= 0.62 && state.facilityAlpha <= 0.88);
  assert.equal(state.facilityTint, 0x9b3942);
});

test("outage integration no longer depends on removed arenaGrid", async () => {
  const timeline = await readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8");
  const world = await readFile(new URL("../src/scene/world.js", import.meta.url), "utf8");
  assert.doesNotMatch(timeline, /arenaGrid/);
  assert.match(world, /this\.facilityVisuals\s*=\s*createFacilityRoomVisuals/);
});
