import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TEXTURES } from "../src/assets/manifest.js";
import { OPENING_FACILITY_ZONES } from "../src/art/openingVisualContract.js";
import {
  createOpeningFacilityLayout,
  validateOpeningFacilityRelationships
} from "../src/art/openingFacilityLayout.js";

const WORLD_SIZE = 1920;
const CENTER = WORLD_SIZE / 2;
const SAFE_RADIUS = 260;
const CAMERA = {
  left: CENTER - 480,
  top: CENTER - 270,
  width: 960,
  height: 540
};
const HUD_BOUNDS = { left: 0, right: 400, top: 0, bottom: 180 };
const KNOWN_ROLES = new Set([
  "wall",
  "door",
  "window",
  "console",
  "pipe",
  "vent",
  "incident-origin",
  "incident-trail"
]);
const TEXTURE_DIMENSIONS = new Map([
  [TEXTURES.facilityWall, { width: 64, height: 64 }],
  [TEXTURES.facilityDoor, { width: 64, height: 64 }],
  [TEXTURES.facilityObservationWindow, { width: 96, height: 64 }],
  [TEXTURES.facilityConsole, { width: 64, height: 64 }],
  [TEXTURES.facilityPipeBank, { width: 96, height: 64 }],
  [TEXTURES.facilityVent, { width: 32, height: 32 }],
  [TEXTURES.facilityDecal, { width: 32, height: 32 }]
]);

function getLayout() {
  return createOpeningFacilityLayout(WORLD_SIZE, WORLD_SIZE);
}

function getById(layout, id) {
  return layout.find((item) => item.id === id);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rotatedHalfExtents(item) {
  const dimensions = TEXTURE_DIMENSIONS.get(item.key);
  assert.ok(dimensions, `missing dimensions for ${item.key}`);
  const cosine = Math.abs(Math.cos(item.rotation));
  const sine = Math.abs(Math.sin(item.rotation));
  const halfWidth = dimensions.width * Math.abs(item.scaleX) / 2;
  const halfHeight = dimensions.height * Math.abs(item.scaleY) / 2;
  return {
    x: cosine * halfWidth + sine * halfHeight,
    y: sine * halfWidth + cosine * halfHeight
  };
}

function textureBoundsGap(a, b) {
  const aHalf = rotatedHalfExtents(a);
  const bHalf = rotatedHalfExtents(b);
  const gapX = Math.max(Math.abs(a.x - b.x) - aHalf.x - bHalf.x, 0);
  const gapY = Math.max(Math.abs(a.y - b.y) - aHalf.y - bHalf.y, 0);
  return Math.hypot(gapX, gapY);
}

function projectedBounds(item) {
  const half = rotatedHalfExtents(item);
  const x = item.x - CAMERA.left;
  const y = item.y - CAMERA.top;
  return {
    left: x - half.x,
    right: x + half.x,
    top: y - half.y,
    bottom: y + half.y
  };
}

function closestTextureBoundsDistance(item) {
  const half = rotatedHalfExtents(item);
  const closestX = Math.max(Math.abs(item.x - CENTER) - half.x, 0);
  const closestY = Math.max(Math.abs(item.y - CENTER) - half.y, 0);
  return Math.hypot(closestX, closestY);
}

function assertAttachedChain(layout, ids) {
  for (let index = 1; index < ids.length; index += 1) {
    const previous = getById(layout, ids[index - 1]);
    const current = getById(layout, ids[index]);
    assert.ok(previous, `${ids[index - 1]} should exist`);
    assert.ok(current, `${ids[index]} should exist`);
    assert.equal(current.parentId, previous.id, `${current.id} should continue its structural chain`);
    assert.ok(textureBoundsGap(current, previous) <= 8, `${current.id} should touch ${previous.id}`);
  }
}

test("opening facility entries have unique semantic identities", () => {
  const layout = getLayout();
  assert.equal(new Set(layout.map(({ id }) => id)).size, layout.length);
  assert.ok(layout.every(({ id, parentId, zone, role, key, x, y, depth, rotation, scaleX, scaleY }) => (
    typeof id === "string"
    && (parentId === null || typeof parentId === "string")
    && Object.hasOwn(OPENING_FACILITY_ZONES, zone)
    && KNOWN_ROLES.has(role)
    && typeof key === "string"
    && [x, y, depth, rotation, scaleX, scaleY].every(Number.isFinite)
  )));
});

test("doors remain attached to nearby wall segments", () => {
  const layout = getLayout();
  const walls = layout.filter(({ role }) => role === "wall");
  for (const door of layout.filter(({ role }) => role === "door")) {
    assert.ok(walls.some((wall) => distance(door, wall) <= 72), door.id);
  }
});

test("consoles stay in functional zones beside their assigned door or window", () => {
  const layout = getLayout();
  for (const console of layout.filter(({ role }) => role === "console")) {
    const parent = getById(layout, console.parentId);
    assert.ok(["maintenance", "observation"].includes(console.zone), console.id);
    assert.ok(parent && ["door", "window"].includes(parent.role), console.id);
    assert.ok(distance(console, parent) <= 128, console.id);
    assert.ok(textureBoundsGap(console, parent) <= 8, `${console.id} should touch ${parent.id}`);
  }
});

test("vents and pipes sit against their declared structural parent", () => {
  const layout = getLayout();
  for (const utility of layout.filter(({ role }) => ["vent", "pipe"].includes(role))) {
    const parent = getById(layout, utility.parentId);
    assert.ok(parent, utility.id);
    assert.ok(parent.role === "wall" || parent.zone === "maintenance", utility.id);
    assert.ok(textureBoundsGap(utility, parent) <= 8, `${utility.id} should touch ${parent.id}`);
  }
});

test("observation windows are mounted directly into their wall chain", () => {
  const layout = getLayout();
  for (const window of layout.filter(({ role }) => role === "window")) {
    const parent = getById(layout, window.parentId);
    assert.equal(parent?.role, "wall", window.id);
    assert.ok(textureBoundsGap(window, parent) <= 8, `${window.id} should touch ${parent?.id}`);
  }
});

test("left entry and right observation-maintenance boundaries form continuous chains", () => {
  const layout = getLayout();
  assertAttachedChain(layout, [
    "entry-wall-left",
    "entry-door",
    "entry-wall-right",
    "entry-wall-lower",
    "entry-wall-bottom"
  ]);
  assertAttachedChain(layout, [
    "observation-wall",
    "observation-window",
    "observation-corner-wall",
    "maintenance-wall-upper",
    "maintenance-wall-middle",
    "maintenance-wall-lower",
    "maintenance-wall-bottom"
  ]);
});

test("contamination is one parent-linked incident trail", () => {
  const contamination = getLayout().filter(({ zone }) => zone === "contamination");
  const origins = contamination.filter(({ role }) => role === "incident-origin");
  assert.equal(origins.length, 1);
  const visited = new Set([origins[0].id]);
  while (visited.size < contamination.length) {
    const next = contamination.find(({ id, parentId }) => !visited.has(id) && visited.has(parentId));
    assert.ok(next, "contamination entries must form one connected trail");
    visited.add(next.id);
  }
});

test("all semantic texture bounds preserve the 260px center safe radius", () => {
  for (const item of getLayout()) {
    assert.ok(closestTextureBoundsDistance(item) >= SAFE_RADIUS, item.id);
  }
});

test("the initial 960x540 camera reads entry, walls and functional equipment", () => {
  const layout = getLayout();
  const camera = {
    left: CAMERA.left,
    right: CAMERA.left + CAMERA.width,
    top: CAMERA.top,
    bottom: CAMERA.top + CAMERA.height
  };
  const visible = layout.filter(({ x, y }) => (
    x >= camera.left && x <= camera.right && y >= camera.top && y <= camera.bottom
  ));
  assert.ok(visible.some(({ zone, role }) => zone === "entry" && role === "door"));
  assert.ok(visible.some(({ role }) => role === "wall"));
  assert.ok(visible.some(({ zone, role }) => (
    zone === "maintenance" && ["console", "pipe", "vent"].includes(role)
  )));
});

test("the projected entry is fully visible below the current top-left HUD", () => {
  const entry = getById(getLayout(), "entry-door");
  const bounds = projectedBounds(entry);
  const overlapsHud = (
    bounds.left < HUD_BOUNDS.right
    && bounds.right > HUD_BOUNDS.left
    && bounds.top < HUD_BOUNDS.bottom
    && bounds.bottom > HUD_BOUNDS.top
  );

  assert.ok(bounds.left >= 0 && bounds.right <= CAMERA.width, "entry should fit horizontally");
  assert.ok(bounds.top >= 0 && bounds.bottom <= CAMERA.height, "entry should fit vertically");
  assert.equal(overlapsHud, false, "entry should not project under the top-left HUD");
});

test("relationship validator accepts the approved opening graph", () => {
  assert.deepEqual(validateOpeningFacilityRelationships(getLayout()), []);
});

test("relationship validator reports broken semantic relationships", () => {
  const duplicate = getLayout().map((item, index) => (
    index === 1 ? { ...item, id: "entry-wall-left" } : item
  ));
  const detachedDoor = getLayout().map((item) => (
    item.id === "entry-door" ? { ...item, x: CENTER } : item
  ));
  const detachedConsole = getLayout().map((item) => (
    item.id === "maintenance-console" ? { ...item, parentId: "lower-wall" } : item
  ));
  const brokenUtility = getLayout().map((item) => (
    item.id === "maintenance-pipes" ? { ...item, parentId: "incident-origin" } : item
  ));
  const distantUtility = getLayout().map((item) => (
    item.id === "maintenance-pipes" ? { ...item, x: item.x - 160 } : item
  ));
  const detachedWindow = getLayout().map((item) => (
    item.id === "observation-window" ? { ...item, x: item.x - 192 } : item
  ));
  const brokenStructure = getLayout().map((item) => (
    item.id === "maintenance-wall-middle" ? { ...item, y: item.y + 64 } : item
  ));
  const brokenTrail = getLayout().map((item) => (
    item.id === "incident-trail-b" ? { ...item, parentId: null } : item
  ));

  assert.ok(validateOpeningFacilityRelationships(duplicate).includes("duplicate-id"));
  assert.ok(validateOpeningFacilityRelationships(detachedDoor).includes("door-detached"));
  assert.ok(validateOpeningFacilityRelationships(detachedConsole).includes("console-detached"));
  assert.ok(validateOpeningFacilityRelationships(brokenUtility).includes("utility-detached"));
  assert.ok(validateOpeningFacilityRelationships(distantUtility).includes("utility-detached"));
  assert.ok(validateOpeningFacilityRelationships(detachedWindow).includes("window-detached"));
  assert.ok(validateOpeningFacilityRelationships(brokenStructure).includes("structure-detached"));
  assert.ok(validateOpeningFacilityRelationships(brokenTrail).includes("contamination-disconnected"));
});

test("semantic layout remains display-only", async () => {
  const source = await readFile(new URL("../src/art/openingFacilityLayout.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bphysics\b|add\.existing|body\./);
});
