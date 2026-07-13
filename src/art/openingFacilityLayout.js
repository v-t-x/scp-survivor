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

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function addViolation(violations, code) {
  if (!violations.includes(code)) violations.push(code);
}

export function createOpeningFacilityLayout(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  return [
    { id: "entry-wall-left", parentId: null, zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 320, y: cy - 224, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-door", parentId: "entry-wall-left", zone: "entry", role: "door", key: TEXTURES.facilityDoor, x: cx - 256, y: cy - 224, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-wall-right", parentId: "entry-door", zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 224, y: cy - 224, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-window", parentId: "observation-wall", zone: "observation", role: "window", key: TEXTURES.facilityObservationWindow, x: cx + 256, y: cy - 224, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-wall", parentId: null, zone: "observation", role: "wall", key: TEXTURES.facilityWall, x: cx + 352, y: cy - 224, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-console", parentId: "observation-window", zone: "maintenance", role: "console", key: TEXTURES.facilityConsole, x: cx + 320, y: cy - 128, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-pipes", parentId: "observation-wall", zone: "maintenance", role: "pipe", key: TEXTURES.facilityPipeBank, x: cx + 416, y: cy - 64, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "lower-vent", parentId: "lower-wall", zone: "maintenance", role: "vent", key: TEXTURES.facilityVent, x: cx - 320, y: cy + 192, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "lower-wall", parentId: null, zone: "maintenance", role: "wall", key: TEXTURES.facilityWall, x: cx - 384, y: cy + 192, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
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
    if (!validZone || !validParent || distance(console, parent) > 128) {
      addViolation(violations, "console-detached");
    }
  }

  for (const utility of layout.filter(({ role }) => role === "vent" || role === "pipe")) {
    const parent = byId.get(utility.parentId);
    if (!parent || (parent.role !== "wall" && parent.zone !== "maintenance")) {
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
