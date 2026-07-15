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
const VIEWPORT = {
  x: CENTER_X - 480,
  y: CENTER_Y - 270,
  width: 960,
  height: 540
};
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
const DISPLAY_DIMENSIONS = new Map([
  [TEXTURES.facilityFloor, { width: 32, height: 32 }],
  [TEXTURES.facilityCombatFloor, { width: 128, height: 128 }],
  [TEXTURES.facilityEntryThreshold, { width: 128, height: 64 }],
  [TEXTURES.facilityMaintenanceDeck, { width: 128, height: 128 }],
  [TEXTURES.facilityWallBank, { width: 128, height: 64 }],
  [TEXTURES.facilityPowerJunction, { width: 96, height: 96 }],
  [TEXTURES.facilityContaminationTrail, { width: 64, height: 64 }],
  [TEXTURES.facilityDecal, { width: 32, height: 32 }]
]);

function getLayout() {
  return createOpeningFacilityLayout(WORLD_WIDTH, WORLD_HEIGHT);
}

function boundsFor(item) {
  const dimensions = DISPLAY_DIMENSIONS.get(item.key);
  assert.ok(dimensions, `missing display dimensions for ${item.key}`);
  const cosine = Math.abs(Math.cos(item.rotation));
  const sine = Math.abs(Math.sin(item.rotation));
  const halfWidth = dimensions.width * Math.abs(item.scaleX) / 2;
  const halfHeight = dimensions.height * Math.abs(item.scaleY) / 2;
  const extentX = cosine * halfWidth + sine * halfHeight;
  const extentY = sine * halfWidth + cosine * halfHeight;
  return {
    left: item.x - extentX,
    right: item.x + extentX,
    top: item.y - extentY,
    bottom: item.y + extentY
  };
}

function intersectsRect(bounds, rect) {
  return (
    bounds.left < rect.x + rect.width
    && bounds.right > rect.x
    && bounds.top < rect.y + rect.height
    && bounds.bottom > rect.y
  );
}

function visibleBounds(bounds) {
  const left = Math.max(bounds.left, VIEWPORT.x);
  const right = Math.min(bounds.right, VIEWPORT.x + VIEWPORT.width);
  const top = Math.max(bounds.top, VIEWPORT.y);
  const bottom = Math.min(bounds.bottom, VIEWPORT.y + VIEWPORT.height);
  return right > left && bottom > top ? { left, right, top, bottom } : null;
}

function rectangleUnionArea(rectangles) {
  const edges = [...new Set(rectangles.flatMap(({ left, right }) => [left, right]))].sort((a, b) => a - b);
  let area = 0;

  for (let index = 1; index < edges.length; index += 1) {
    const left = edges[index - 1];
    const right = edges[index];
    const intervals = rectangles
      .filter((rect) => rect.left < right && rect.right > left)
      .map(({ top, bottom }) => [top, bottom])
      .sort(([a], [b]) => a - b);
    let coveredTop = null;
    let coveredBottom = null;

    for (const [top, bottom] of intervals) {
      if (coveredTop === null || top > coveredBottom) {
        if (coveredTop !== null) area += (right - left) * (coveredBottom - coveredTop);
        coveredTop = top;
        coveredBottom = bottom;
      } else {
        coveredBottom = Math.max(coveredBottom, bottom);
      }
    }
    if (coveredTop !== null) area += (right - left) * (coveredBottom - coveredTop);
  }

  return area;
}

function areaOf({ left, right, top, bottom }) {
  return (right - left) * (bottom - top);
}

function contaminationAreas(layout) {
  const bounds = layout.filter(({ zone }) => zone === "contamination").map(boundsFor);
  const visible = bounds.map(visibleBounds).filter(Boolean);
  return {
    fullUnion: rectangleUnionArea(bounds),
    visibleSum: visible.reduce((sum, rectangle) => sum + areaOf(rectangle), 0),
    visibleUnion: rectangleUnionArea(visible)
  };
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

  for (const item of layout.filter(({ role }) => role !== "floor")) {
    assert.equal(intersectsRect(boundsFor(item), SAFE_RECT), false, `${item.id} overlaps the center safe rectangle`);
  }
});

test("contamination stays at the maintenance edge and covers at most ten percent of the first viewport", () => {
  const contamination = getLayout().filter(({ zone }) => zone === "contamination");
  const visible = contamination.map((item) => visibleBounds(boundsFor(item))).filter(Boolean);
  const visibleArea = rectangleUnionArea(visible);

  assert.ok(contamination.length >= 1 && contamination.length <= 3);
  assert.ok(contamination.every(({ role, key, x }) => (
    role === "contamination-trail"
    && key === TEXTURES.facilityContaminationTrail
    && x >= SAFE_RECT.x + SAFE_RECT.width
  )));
  assert.ok(visibleArea > 0, "the controlled trail should read in the first viewport");
  assert.ok(visibleArea <= VIEWPORT.width * VIEWPORT.height * 0.1, `${visibleArea} exceeds the contamination budget`);
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

test("contamination coverage uses clipped rectangle unions rather than summed or off-camera area", () => {
  const layout = getLayout();
  const threshold = VIEWPORT.width * VIEWPORT.height * 0.1;
  const overlapping = layout.map((item) => (
    item.zone === "contamination"
      ? { ...item, x: SAFE_RECT.x + SAFE_RECT.width + 128, y: CENTER_Y + 128, scaleX: 2.2, scaleY: 2.2 }
      : item
  ));
  const offCamera = layout.map((item) => (
    item.zone === "contamination"
      ? { ...item, x: CENTER_X + VIEWPORT.width / 2, y: CENTER_Y + 128, scaleX: 4, scaleY: 4 }
      : item
  ));
  const overlappingAreas = contaminationAreas(overlapping);
  const offCameraAreas = contaminationAreas(offCamera);

  assert.ok(overlappingAreas.visibleSum > threshold, "simple addition must exceed the budget in this fixture");
  assert.ok(overlappingAreas.visibleUnion <= threshold, "overlap union must remain within the budget");
  assert.equal(
    validateOpeningFacilityRelationships(overlapping).includes("contamination-coverage-exceeded"),
    false
  );

  assert.ok(offCameraAreas.fullUnion > threshold, "unclipped area must exceed the budget in this fixture");
  assert.ok(offCameraAreas.visibleUnion <= threshold, "visible clipped area must remain within the budget");
  assert.equal(
    validateOpeningFacilityRelationships(offCamera).includes("contamination-coverage-exceeded"),
    false
  );
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
