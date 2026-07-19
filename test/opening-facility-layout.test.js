import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TEXTURES } from "../src/assets/manifest.js";
import {
  createOpeningFacilityLayout,
  validateOpeningFacilityRelationships
} from "../src/art/openingFacilityLayout.js";

const WORLD_WIDTH = 1920;
const WORLD_HEIGHT = 1920;
const CENTER_X = WORLD_WIDTH / 2;
const CENTER_Y = WORLD_HEIGHT / 2;
const SAFE_RECT = {
  x: CENTER_X - 192,
  y: CENTER_Y - 144,
  width: 384,
  height: 288
};
const VIEWPORT_WIDTH = 960;
const VIEWPORT_HEIGHT = 540;
const VIEWPORT_AREA = 518_400;
const CONTAMINATION_COVERAGE_LIMIT = 51_840;
const CONTAMINATION_TEXTURE_SIZE = 64;
const LAYOUT_FIELDS = [
  "id",
  "parentId",
  "zone",
  "role",
  "key",
  "x",
  "y",
  "depth",
  "rotation",
  "scaleX",
  "scaleY"
];
const EXPECTED_ZONES = ["entry", "combat", "maintenance", "contamination"];

function getLayout() {
  return createOpeningFacilityLayout(WORLD_WIDTH, WORLD_HEIGHT);
}

test("opening layout uses exactly the four approved semantic zones", () => {
  const layout = getLayout();
  const ids = new Set();

  assert.deepEqual([...new Set(layout.map(({ zone }) => zone))].sort(), [...EXPECTED_ZONES].sort());
  for (const [index, item] of layout.entries()) {
    assert.deepEqual(Object.keys(item).sort(), [...LAYOUT_FIELDS].sort(), item.id);
    assert.equal(typeof item.id, "string");
    assert.equal(typeof item.key, "string");
    assert.ok([item.x, item.y, item.depth, item.rotation, item.scaleX, item.scaleY].every(Number.isFinite), item.id);
    assert.equal(ids.has(item.id), false, `duplicate id ${item.id}`);
    ids.add(item.id);

    if (item.parentId !== null) {
      const parentIndex = layout.findIndex(({ id }) => id === item.parentId);
      assert.ok(parentIndex >= 0 && parentIndex < index, `${item.id} must point at an earlier item`);
      assert.equal(layout[parentIndex].zone, item.zone, `${item.id} must stay inside its parent zone`);
    }
  }
});

test("three production floor types establish entry, combat, and maintenance reads", () => {
  const layout = getLayout();
  const floors = layout.filter(({ role }) => role === "floor");

  assert.deepEqual(
    [...new Set(floors.map(({ key }) => key))].sort(),
    [
      TEXTURES.facilityFloor,
      TEXTURES.facilityCombatFloor,
      TEXTURES.facilityMaintenanceDeck
    ].sort()
  );
  assert.ok(floors.some(({ zone, key }) => zone === "entry" && key === TEXTURES.facilityFloor));
  assert.ok(floors.some(({ zone, key }) => zone === "combat" && key === TEXTURES.facilityCombatFloor));
  assert.ok(floors.some(({ zone, key }) => zone === "maintenance" && key === TEXTURES.facilityMaintenanceDeck));

  const threshold = layout.find(({ role }) => role === "entry-threshold");
  const wallBank = layout.find(({ role }) => role === "wall-bank");
  const powerJunction = layout.find(({ role }) => role === "power-junction");
  assert.equal(threshold?.zone, "entry");
  assert.equal(threshold?.key, TEXTURES.facilityEntryThreshold);
  assert.equal(wallBank?.zone, "maintenance");
  assert.equal(wallBank?.key, TEXTURES.facilityWallBank);
  assert.equal(powerJunction?.zone, "maintenance");
  assert.equal(powerJunction?.key, TEXTURES.facilityPowerJunction);
});

test("formal 128 by 128 floor modules preserve square nearest-neighbor pixels", () => {
  const modules = getLayout().filter(({ role, key }) => (
    role === "floor"
    && (key === TEXTURES.facilityCombatFloor || key === TEXTURES.facilityMaintenanceDeck)
  ));

  assert.ok(modules.length > 0);
  for (const module of modules) {
    assert.equal(module.scaleX, module.scaleY, `${module.id} must not stretch a square floor texture`);
    assert.ok(Number.isInteger(module.scaleX) && module.scaleX >= 1, `${module.id} must use integer pixel scale`);
  }
});

test("the exact center safe rectangle contains floor only", () => {
  const layout = getLayout();
  assert.deepEqual(SAFE_RECT, { x: CENTER_X - 192, y: CENTER_Y - 144, width: 384, height: 288 });
  assert.ok(layout.some(({ role, x, y }) => role === "floor" && x === CENTER_X && y === CENTER_Y));
  assert.equal(validateOpeningFacilityRelationships(layout).includes("safe-area-intrusion"), false);
});

test("contamination stays at the maintenance edge and covers at most ten percent of the first viewport", () => {
  const layout = getLayout();
  const contamination = layout.filter(({ zone }) => zone === "contamination");

  assert.ok(contamination.length >= 1 && contamination.length <= 3);
  assert.ok(contamination.every(({ role, key, x }) => (
    role === "contamination-trail"
    && key === TEXTURES.facilityContaminationTrail
    && x >= SAFE_RECT.x + SAFE_RECT.width
  )));
  assert.equal(validateOpeningFacilityRelationships(layout).includes("contamination-coverage-exceeded"), false);
});

test("contamination must touch the maintenance floor and remain visually continuous through its parent chain", () => {
  const layout = getLayout();
  const detachedRoot = layout.map((item) => (
    item.zone === "contamination" ? { ...item, x: item.x + 256 } : item
  ));
  const detachedTrail = layout.map((item) => (
    item.id === "contamination-trail-b" || item.id === "contamination-trail-c"
      ? { ...item, x: item.x + 128 }
      : item
  ));

  assert.ok(
    validateOpeningFacilityRelationships(detachedRoot).includes("contamination-root-detached-from-maintenance")
  );
  assert.ok(validateOpeningFacilityRelationships(detachedTrail).includes("contamination-trail-detached"));
});

test("contamination coverage unions three fully overlapping fixed rectangles", () => {
  const layout = getLayout();
  const overlapping = layout.map((item) => (
    item.zone === "contamination"
      ? { ...item, x: 1280, y: 1024, rotation: 0, scaleX: 3, scaleY: 3 }
      : item
  ));

  assert.equal(VIEWPORT_WIDTH * VIEWPORT_HEIGHT, VIEWPORT_AREA);
  assert.equal(VIEWPORT_AREA * 0.1, CONTAMINATION_COVERAGE_LIMIT);
  assert.equal(CONTAMINATION_TEXTURE_SIZE * 3, 192);
  assert.equal(192 * 192, 36_864);
  assert.equal(36_864 * 3, 110_592);
  assert.ok(36_864 < CONTAMINATION_COVERAGE_LIMIT, "one 192 by 192 union must stay below ten percent");
  assert.ok(110_592 > CONTAMINATION_COVERAGE_LIMIT, "three simply added rectangles must exceed ten percent");
  assert.deepEqual(validateOpeningFacilityRelationships(overlapping), []);
});

test("contamination coverage clips a fixed rectangle at the viewport edge", () => {
  const layout = getLayout();
  const offCamera = layout.map((item) => (
    item.zone === "contamination"
      ? { ...item, x: 1440, y: 1088, rotation: 0, scaleX: 4, scaleY: 4 }
      : item
  ));

  assert.equal(CONTAMINATION_TEXTURE_SIZE * 4, 256);
  assert.equal(256 * 256, 65_536);
  assert.equal(128 * 256, 32_768);
  assert.ok(65_536 > CONTAMINATION_COVERAGE_LIMIT, "the full 256 by 256 rectangle must exceed ten percent");
  assert.ok(32_768 < CONTAMINATION_COVERAGE_LIMIT, "the visible 128 by 256 half must stay below ten percent");
  assert.equal(1440, CENTER_X + VIEWPORT_WIDTH / 2, "the fixture center must sit on the right camera edge");
  assert.deepEqual(validateOpeningFacilityRelationships(offCamera), []);
});

test("relationship validator accepts the approved graph and rejects safety, parent, and coverage violations", () => {
  const layout = getLayout();
  assert.deepEqual(validateOpeningFacilityRelationships(layout), []);

  const safeIntrusion = layout.map((item) => (
    item.role === "entry-threshold" ? { ...item, x: CENTER_X, y: CENTER_Y } : item
  ));
  const missingParent = layout.map((item) => (
    item.role === "entry-threshold" ? { ...item, parentId: "missing-parent" } : item
  ));
  const crossZoneParent = layout.map((item) => (
    item.role === "entry-threshold" ? { ...item, parentId: "combat-floor-center" } : item
  ));
  const futureParent = layout.map((item) => (
    item.id === "combat-floor-left" ? { ...item, parentId: "combat-floor-center" } : item
  ));
  const orphanedDecoration = layout.map((item) => (
    item.role === "power-junction" ? { ...item, parentId: null } : item
  ));
  const excessiveCoverage = layout.map((item) => (
    item.id === "contamination-trail-c"
      ? { ...item, x: CENTER_X + 640, y: CENTER_Y, scaleX: 10, scaleY: 10 }
      : item
  ));

  assert.ok(validateOpeningFacilityRelationships(safeIntrusion).includes("safe-area-intrusion"));
  assert.ok(validateOpeningFacilityRelationships(missingParent).includes("parent-invalid"));
  assert.ok(validateOpeningFacilityRelationships(crossZoneParent).includes("parent-zone-mismatch"));
  assert.ok(validateOpeningFacilityRelationships(futureParent).includes("parent-order-invalid"));
  assert.ok(validateOpeningFacilityRelationships(orphanedDecoration).includes("decorative-orphan"));
  assert.ok(validateOpeningFacilityRelationships(excessiveCoverage).includes("contamination-coverage-exceeded"));
});

test("semantic layout remains display-only", async () => {
  const source = await readFile(new URL("../src/art/openingFacilityLayout.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bphysics\b|add\.existing|body\./);
});
