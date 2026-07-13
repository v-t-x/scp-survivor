import { TEXTURES } from "../assets/manifest.js";
import { OPENING_FACILITY_ZONES } from "./openingVisualContract.js";

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
const STRUCTURAL_ROLES = new Set(["wall", "door", "window"]);
const TEXTURE_DIMENSIONS = new Map([
  [TEXTURES.facilityWall, { width: 64, height: 64 }],
  [TEXTURES.facilityDoor, { width: 64, height: 64 }],
  [TEXTURES.facilityObservationWindow, { width: 96, height: 64 }],
  [TEXTURES.facilityConsole, { width: 64, height: 64 }],
  [TEXTURES.facilityPipeBank, { width: 96, height: 64 }],
  [TEXTURES.facilityVent, { width: 32, height: 32 }],
  [TEXTURES.facilityDecal, { width: 32, height: 32 }]
]);

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rotatedHalfExtents(item) {
  const dimensions = TEXTURE_DIMENSIONS.get(item.key);
  if (!dimensions) return null;
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
  if (!aHalf || !bHalf) return Number.POSITIVE_INFINITY;
  const gapX = Math.max(Math.abs(a.x - b.x) - aHalf.x - bHalf.x, 0);
  const gapY = Math.max(Math.abs(a.y - b.y) - aHalf.y - bHalf.y, 0);
  return Math.hypot(gapX, gapY);
}

function addViolation(violations, code) {
  if (!violations.includes(code)) violations.push(code);
}

export function createOpeningFacilityLayout(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  return [
    { id: "entry-wall-left", parentId: null, zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 416, y: cy - 96, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-door", parentId: "entry-wall-left", zone: "entry", role: "door", key: TEXTURES.facilityDoor, x: cx - 416, y: cy - 32, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-wall-right", parentId: "entry-door", zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 416, y: cy + 32, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-wall-lower", parentId: "entry-wall-right", zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 416, y: cy + 96, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-wall-bottom", parentId: "entry-wall-lower", zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 416, y: cy + 160, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-wall", parentId: null, zone: "observation", role: "wall", key: TEXTURES.facilityWall, x: cx + 288, y: cy - 96, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-window", parentId: "observation-wall", zone: "observation", role: "window", key: TEXTURES.facilityObservationWindow, x: cx + 368, y: cy - 96, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-corner-wall", parentId: "observation-window", zone: "observation", role: "wall", key: TEXTURES.facilityWall, x: cx + 448, y: cy - 96, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-wall-upper", parentId: "observation-corner-wall", zone: "maintenance", role: "wall", key: TEXTURES.facilityWall, x: cx + 448, y: cy - 32, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-wall-middle", parentId: "maintenance-wall-upper", zone: "maintenance", role: "wall", key: TEXTURES.facilityWall, x: cx + 448, y: cy + 32, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-wall-lower", parentId: "maintenance-wall-middle", zone: "maintenance", role: "wall", key: TEXTURES.facilityWall, x: cx + 448, y: cy + 96, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-wall-bottom", parentId: "maintenance-wall-lower", zone: "maintenance", role: "wall", key: TEXTURES.facilityWall, x: cx + 448, y: cy + 160, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-console", parentId: "observation-window", zone: "maintenance", role: "console", key: TEXTURES.facilityConsole, x: cx + 368, y: cy - 32, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-pipes", parentId: "maintenance-wall-middle", zone: "maintenance", role: "pipe", key: TEXTURES.facilityPipeBank, x: cx + 368, y: cy + 32, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "lower-vent", parentId: "maintenance-wall-lower", zone: "maintenance", role: "vent", key: TEXTURES.facilityVent, x: cx + 400, y: cy + 96, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "incident-origin", parentId: null, zone: "contamination", role: "incident-origin", key: TEXTURES.facilityDecal, x: cx + 352, y: cy + 208, depth: -7, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "incident-trail-a", parentId: "incident-origin", zone: "contamination", role: "incident-trail", key: TEXTURES.facilityDecal, x: cx + 304, y: cy + 176, depth: -7, rotation: 0.35, scaleX: 0.8, scaleY: 0.8 },
    { id: "incident-trail-b", parentId: "incident-trail-a", zone: "contamination", role: "incident-trail", key: TEXTURES.facilityDecal, x: cx + 272, y: cy + 152, depth: -7, rotation: -0.2, scaleX: 0.65, scaleY: 0.65 }
  ];
}

export function validateOpeningFacilityRelationships(layout) {
  const violations = [];
  const byId = new Map();

  for (const item of layout) {
    if (byId.has(item.id)) addViolation(violations, "duplicate-id");
    byId.set(item.id, item);
    if (!Object.hasOwn(OPENING_FACILITY_ZONES, item.zone)) {
      addViolation(violations, "unknown-zone");
    }
    if (!KNOWN_ROLES.has(item.role)) addViolation(violations, "unknown-role");
  }

  const walls = layout.filter(({ role }) => role === "wall");
  for (const door of layout.filter(({ role }) => role === "door")) {
    if (!walls.some((wall) => distance(door, wall) <= 72)) {
      addViolation(violations, "door-detached");
    }
  }

  for (const console of layout.filter(({ role }) => role === "console")) {
    const parent = byId.get(console.parentId);
    const validZone = console.zone === "maintenance" || console.zone === "observation";
    const validParent = parent && (parent.role === "door" || parent.role === "window");
    if (!validZone || !validParent || distance(console, parent) > 128 || textureBoundsGap(console, parent) > 8) {
      addViolation(violations, "console-detached");
    }
  }

  for (const window of layout.filter(({ role }) => role === "window")) {
    const parent = byId.get(window.parentId);
    if (!parent || parent.role !== "wall" || textureBoundsGap(window, parent) > 8) {
      addViolation(violations, "window-detached");
    }
  }

  for (const structure of layout.filter(({ role, parentId }) => (
    parentId !== null && STRUCTURAL_ROLES.has(role)
  ))) {
    const parent = byId.get(structure.parentId);
    if (!parent || !STRUCTURAL_ROLES.has(parent.role) || textureBoundsGap(structure, parent) > 8) {
      addViolation(violations, "structure-detached");
    }
  }

  for (const utility of layout.filter(({ role }) => role === "vent" || role === "pipe")) {
    const parent = byId.get(utility.parentId);
    if (
      !parent
      || (parent.role !== "wall" && parent.zone !== "maintenance")
      || textureBoundsGap(utility, parent) > 8
    ) {
      addViolation(violations, "utility-detached");
    }
  }

  const contamination = layout.filter(({ zone }) => zone === "contamination");
  const origins = contamination.filter(({ role }) => role === "incident-origin");
  const connected = new Set(origins.map(({ id }) => id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of contamination) {
      if (!connected.has(item.id) && connected.has(item.parentId)) {
        connected.add(item.id);
        changed = true;
      }
    }
  }
  if (origins.length !== 1 || connected.size !== contamination.length) {
    addViolation(violations, "contamination-disconnected");
  }

  return violations;
}
