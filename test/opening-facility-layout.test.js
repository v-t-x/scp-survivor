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

function closestTextureBoundsDistance(item) {
  const dimensions = TEXTURE_DIMENSIONS.get(item.key);
  assert.ok(dimensions, `missing dimensions for ${item.key}`);
  const cosine = Math.abs(Math.cos(item.rotation));
  const sine = Math.abs(Math.sin(item.rotation));
  const halfWidth = dimensions.width * Math.abs(item.scaleX) / 2;
  const halfHeight = dimensions.height * Math.abs(item.scaleY) / 2;
  const rotatedHalfWidth = cosine * halfWidth + sine * halfHeight;
  const rotatedHalfHeight = sine * halfWidth + cosine * halfHeight;
  const closestX = Math.max(Math.abs(item.x - CENTER) - rotatedHalfWidth, 0);
  const closestY = Math.max(Math.abs(item.y - CENTER) - rotatedHalfHeight, 0);
  return Math.hypot(closestX, closestY);
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
  }
});

test("vents and pipes inherit a wall or maintenance relationship", () => {
  const layout = getLayout();
  for (const utility of layout.filter(({ role }) => ["vent", "pipe"].includes(role))) {
    const parent = getById(layout, utility.parentId);
    assert.ok(parent, utility.id);
    assert.ok(parent.role === "wall" || parent.zone === "maintenance", utility.id);
  }
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
    left: CENTER - 480,
    right: CENTER + 480,
    top: CENTER - 270,
    bottom: CENTER + 270
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
  const brokenTrail = getLayout().map((item) => (
    item.id === "incident-trail-b" ? { ...item, parentId: null } : item
  ));

  assert.ok(validateOpeningFacilityRelationships(duplicate).includes("duplicate-id"));
  assert.ok(validateOpeningFacilityRelationships(detachedDoor).includes("door-detached"));
  assert.ok(validateOpeningFacilityRelationships(detachedConsole).includes("console-detached"));
  assert.ok(validateOpeningFacilityRelationships(brokenUtility).includes("utility-detached"));
  assert.ok(validateOpeningFacilityRelationships(brokenTrail).includes("contamination-disconnected"));
});

test("semantic layout remains display-only", async () => {
  const source = await readFile(new URL("../src/art/openingFacilityLayout.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bphysics\b|add\.existing|body\./);
});
