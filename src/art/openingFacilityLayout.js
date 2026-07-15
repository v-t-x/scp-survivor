import { TEXTURES } from "../assets/manifest.js";

const SAFE_HALF_WIDTH = 192;
const SAFE_HALF_HEIGHT = 144;
const OPENING_VIEWPORT_WIDTH = 960;
const OPENING_VIEWPORT_HEIGHT = 540;
const MAX_CONTAMINATION_SEGMENTS = 3;
const APPROVED_ZONES = new Set(["entry", "combat", "maintenance", "contamination"]);
const FLOOR_KEYS = new Set([
  TEXTURES.facilityFloor,
  TEXTURES.facilityCombatFloor,
  TEXTURES.facilityMaintenanceDeck
]);
const ROLE_KEYS = new Map([
  ["entry-threshold", TEXTURES.facilityEntryThreshold],
  ["wall-bank", TEXTURES.facilityWallBank],
  ["power-junction", TEXTURES.facilityPowerJunction],
  ["contamination-trail", TEXTURES.facilityContaminationTrail]
]);
const TEXTURE_DIMENSIONS = new Map([
  [TEXTURES.facilityFloor, { width: 32, height: 32 }],
  [TEXTURES.facilityCombatFloor, { width: 128, height: 128 }],
  [TEXTURES.facilityEntryThreshold, { width: 128, height: 64 }],
  [TEXTURES.facilityMaintenanceDeck, { width: 128, height: 128 }],
  [TEXTURES.facilityWallBank, { width: 128, height: 64 }],
  [TEXTURES.facilityPowerJunction, { width: 96, height: 96 }],
  [TEXTURES.facilityContaminationTrail, { width: 64, height: 64 }]
]);

function addViolation(violations, code) {
  if (!violations.includes(code)) violations.push(code);
}

function createSafeRect(centerX, centerY) {
  return {
    x: centerX - SAFE_HALF_WIDTH,
    y: centerY - SAFE_HALF_HEIGHT,
    width: SAFE_HALF_WIDTH * 2,
    height: SAFE_HALF_HEIGHT * 2
  };
}

function displayBounds(item) {
  const dimensions = TEXTURE_DIMENSIONS.get(item.key);
  if (!dimensions || ![item.x, item.y, item.rotation, item.scaleX, item.scaleY].every(Number.isFinite)) {
    return null;
  }

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

function clipToViewport(bounds, viewport) {
  const left = Math.max(bounds.left, viewport.x);
  const right = Math.min(bounds.right, viewport.x + viewport.width);
  const top = Math.max(bounds.top, viewport.y);
  const bottom = Math.min(bounds.bottom, viewport.y + viewport.height);
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

function hasExpectedKey(item) {
  if (item.role === "floor") return FLOOR_KEYS.has(item.key);
  return ROLE_KEYS.get(item.role) === item.key;
}

function findCombatCenter(layout) {
  return layout.find(({ id }) => id === "combat-floor-center") ?? null;
}

export function createOpeningFacilityLayout(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const safeRect = createSafeRect(centerX, centerY);
  const maintenanceX = safeRect.x + safeRect.width + 160;

  return [
    { id: "entry-floor", parentId: null, zone: "entry", role: "floor", key: TEXTURES.facilityFloor, x: safeRect.x - 160, y: centerY, depth: -20, rotation: 0, scaleX: 8, scaleY: 8 },
    { id: "entry-threshold", parentId: "entry-floor", zone: "entry", role: "entry-threshold", key: TEXTURES.facilityEntryThreshold, x: safeRect.x - 160, y: centerY, depth: -11, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "combat-floor-left", parentId: null, zone: "combat", role: "floor", key: TEXTURES.facilityCombatFloor, x: safeRect.x + 64, y: centerY, depth: -20, rotation: 0, scaleX: 1, scaleY: 2 },
    { id: "combat-floor-center", parentId: "combat-floor-left", zone: "combat", role: "floor", key: TEXTURES.facilityCombatFloor, x: centerX, y: centerY, depth: -20, rotation: 0, scaleX: 1, scaleY: 2 },
    { id: "combat-floor-right", parentId: "combat-floor-center", zone: "combat", role: "floor", key: TEXTURES.facilityCombatFloor, x: safeRect.x + safeRect.width - 64, y: centerY, depth: -20, rotation: 0, scaleX: 1, scaleY: 2 },
    { id: "maintenance-floor", parentId: null, zone: "maintenance", role: "floor", key: TEXTURES.facilityMaintenanceDeck, x: maintenanceX, y: centerY, depth: -20, rotation: 0, scaleX: 1, scaleY: 2 },
    { id: "maintenance-wall-bank", parentId: "maintenance-floor", zone: "maintenance", role: "wall-bank", key: TEXTURES.facilityWallBank, x: maintenanceX, y: centerY - 80, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-power-junction", parentId: "maintenance-wall-bank", zone: "maintenance", role: "power-junction", key: TEXTURES.facilityPowerJunction, x: maintenanceX, y: centerY + 16, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "contamination-trail-a", parentId: null, zone: "contamination", role: "contamination-trail", key: TEXTURES.facilityContaminationTrail, x: safeRect.x + safeRect.width + 128, y: centerY + 128, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "contamination-trail-b", parentId: "contamination-trail-a", zone: "contamination", role: "contamination-trail", key: TEXTURES.facilityContaminationTrail, x: safeRect.x + safeRect.width + 160, y: centerY + 160, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "contamination-trail-c", parentId: "contamination-trail-b", zone: "contamination", role: "contamination-trail", key: TEXTURES.facilityContaminationTrail, x: safeRect.x + safeRect.width + 192, y: centerY + 192, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 }
  ];
}

export function validateOpeningFacilityRelationships(layout) {
  if (!Array.isArray(layout)) return ["layout-invalid"];

  const violations = [];
  const byId = new Map();
  const indexById = new Map();

  for (const [index, item] of layout.entries()) {
    if (!item || typeof item !== "object") {
      addViolation(violations, "layout-item-invalid");
      continue;
    }
    if (typeof item.id !== "string" || byId.has(item.id)) addViolation(violations, "duplicate-id");
    byId.set(item.id, item);
    indexById.set(item.id, index);
    if (!APPROVED_ZONES.has(item.zone)) addViolation(violations, "unknown-zone");
    if (item.role !== "floor" && !ROLE_KEYS.has(item.role)) addViolation(violations, "unknown-role");
    if (!hasExpectedKey(item)) addViolation(violations, "role-key-mismatch");
    if (!displayBounds(item)) addViolation(violations, "unknown-texture");
  }

  const center = findCombatCenter(layout);
  const safeRect = center ? createSafeRect(center.x, center.y) : null;
  if (!safeRect) addViolation(violations, "combat-center-missing");

  for (const [index, item] of layout.entries()) {
    if (!item || typeof item !== "object") continue;
    const parent = item.parentId === null ? null : byId.get(item.parentId);
    if (item.parentId !== null && !parent) {
      addViolation(violations, "parent-invalid");
    }
    if (parent && parent.zone !== item.zone) {
      addViolation(violations, "parent-zone-mismatch");
    }
    if (parent && indexById.get(item.parentId) >= index) {
      addViolation(violations, "parent-order-invalid");
    }
    if (item.parentId === null && item.role !== "floor" && item.role !== "contamination-trail") {
      addViolation(violations, "decorative-orphan");
    }

    const bounds = displayBounds(item);
    if (!bounds || !safeRect) continue;
    if (item.role !== "floor" && intersectsRect(bounds, safeRect)) {
      addViolation(violations, "safe-area-intrusion");
    }
    if (item.zone === "entry" && bounds.right > safeRect.x) {
      addViolation(violations, "entry-not-left");
    }
    if (item.zone === "combat" && !intersectsRect(bounds, safeRect)) {
      addViolation(violations, "combat-not-centered");
    }
    if ((item.zone === "maintenance" || item.zone === "contamination") && bounds.left < safeRect.x + safeRect.width) {
      addViolation(violations, item.zone === "maintenance" ? "maintenance-not-right" : "contamination-not-at-maintenance-edge");
    }
  }

  for (const zone of APPROVED_ZONES) {
    if (!layout.some((item) => item?.zone === zone)) addViolation(violations, "missing-zone");
  }

  const floorKeys = new Set(layout.filter(({ role }) => role === "floor").map(({ key }) => key));
  if (floorKeys.size !== FLOOR_KEYS.size || [...FLOOR_KEYS].some((key) => !floorKeys.has(key))) {
    addViolation(violations, "missing-floor-type");
  }

  const contamination = layout.filter(({ zone }) => zone === "contamination");
  if (contamination.length === 0) addViolation(violations, "contamination-missing");
  if (contamination.length > MAX_CONTAMINATION_SEGMENTS) addViolation(violations, "contamination-too-large");
  const contaminationRoots = contamination.filter(({ parentId }) => parentId === null);
  const connectedContamination = new Set(contaminationRoots.map(({ id }) => id));
  let connectedChanged = true;
  while (connectedChanged) {
    connectedChanged = false;
    for (const item of contamination) {
      if (!connectedContamination.has(item.id) && connectedContamination.has(item.parentId)) {
        connectedContamination.add(item.id);
        connectedChanged = true;
      }
    }
  }
  if (contaminationRoots.length !== 1 || connectedContamination.size !== contamination.length) {
    addViolation(violations, "contamination-disconnected");
  }

  if (safeRect) {
    const viewport = {
      x: safeRect.x + SAFE_HALF_WIDTH - OPENING_VIEWPORT_WIDTH / 2,
      y: safeRect.y + SAFE_HALF_HEIGHT - OPENING_VIEWPORT_HEIGHT / 2,
      width: OPENING_VIEWPORT_WIDTH,
      height: OPENING_VIEWPORT_HEIGHT
    };
    const visibleContamination = contamination
      .map(displayBounds)
      .filter(Boolean)
      .map((bounds) => clipToViewport(bounds, viewport))
      .filter(Boolean);
    const contaminationArea = rectangleUnionArea(visibleContamination);
    if (contaminationArea > OPENING_VIEWPORT_WIDTH * OPENING_VIEWPORT_HEIGHT * 0.1) {
      addViolation(violations, "contamination-coverage-exceeded");
    }
  }

  return violations;
}
