import { TEXTURES } from "../assets/manifest.js";
import { createOpeningFacilityLayout } from "./openingFacilityLayout.js";

const NEAREST_FILTER = 1;
const NORMAL_PRESENTATION = Object.freeze({
  ambientTint: 0xffffff,
  ambientAlpha: 1,
  maintenanceTint: 0xffffff,
  maintenanceAlpha: 1,
  contaminationTint: 0xffffff,
  contaminationAlpha: 1,
  warningPulseAlpha: 1,
  visible: true
});

function tagFacilityVisual(visual, role, zone, id) {
  visual.setData("facilityRole", role);
  visual.setData("facilityZone", zone);
  visual.setData("facilityId", id);
  return visual;
}

export function applyProductionTextureFiltering(scene) {
  for (const key of Object.values(TEXTURES)) {
    if (scene.textures.exists(key)) {
      scene.textures.get(key).setFilter(NEAREST_FILTER);
    }
  }
}

function normalizeTint(value, fallback) {
  return Number.isInteger(value) ? value : fallback;
}

function normalizeAlpha(value, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

function normalizePresentation(state = {}) {
  return {
    ambientTint: normalizeTint(state.ambientTint, NORMAL_PRESENTATION.ambientTint),
    ambientAlpha: normalizeAlpha(state.ambientAlpha, NORMAL_PRESENTATION.ambientAlpha),
    maintenanceTint: normalizeTint(state.maintenanceTint, NORMAL_PRESENTATION.maintenanceTint),
    maintenanceAlpha: normalizeAlpha(state.maintenanceAlpha, NORMAL_PRESENTATION.maintenanceAlpha),
    contaminationTint: normalizeTint(state.contaminationTint, NORMAL_PRESENTATION.contaminationTint),
    contaminationAlpha: normalizeAlpha(state.contaminationAlpha, NORMAL_PRESENTATION.contaminationAlpha),
    warningPulseAlpha: normalizeAlpha(state.warningPulseAlpha, NORMAL_PRESENTATION.warningPulseAlpha),
    visible: typeof state.visible === "boolean" ? state.visible : NORMAL_PRESENTATION.visible
  };
}

function destroyVisuals(objects) {
  for (let index = objects.length - 1; index >= 0; index -= 1) {
    try {
      objects[index].destroy?.();
    } catch {
      // Continue releasing the rest of the transaction even if one visual rejects destruction.
    }
  }
  objects.length = 0;
}

function presentationForItem(item, state) {
  if (item.zone === "contamination") {
    return { tint: state.contaminationTint, alpha: state.contaminationAlpha };
  }
  if (item.zone === "maintenance") {
    return {
      tint: state.maintenanceTint,
      alpha: item.role === "power-junction"
        ? state.maintenanceAlpha * state.warningPulseAlpha
        : state.maintenanceAlpha
    };
  }
  return { tint: state.ambientTint, alpha: state.ambientAlpha };
}

function createFacilityVisual(scene, item, width, height) {
  if (item.id === "base-floor" && item.role === "floor" && item.key === TEXTURES.facilityFloor) {
    return scene.add.tileSprite(item.x, item.y, width, height, item.key);
  }
  return scene.add.image(item.x, item.y, item.key);
}

export function createFacilityRoomController(scene, width, height) {
  const objects = [];
  const byId = new Map();
  const layout = createOpeningFacilityLayout(width, height);
  let destroyed = false;

  try {
    applyProductionTextureFiltering(scene);
    for (const item of layout) {
      const visual = createFacilityVisual(scene, item, width, height);
      objects.push(visual);
      visual
        .setDepth(item.depth)
        .setRotation(item.rotation)
        .setScale(item.scaleX, item.scaleY);
      tagFacilityVisual(visual, item.role, item.zone, item.id);
      byId.set(item.id, visual);
    }
  } catch (error) {
    destroyVisuals(objects);
    byId.clear();
    throw error;
  }

  function setPresentation(state) {
    if (destroyed) return;
    const presentation = normalizePresentation(state);
    for (const item of layout) {
      const visual = byId.get(item.id);
      if (!visual) continue;
      const style = presentationForItem(item, presentation);
      visual.setTint(style.tint).setAlpha(style.alpha).setVisible(presentation.visible);
    }
  }

  function reset() {
    setPresentation(NORMAL_PRESENTATION);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    destroyVisuals(objects);
    byId.clear();
  }

  return {
    objects,
    byId,
    setPresentation,
    reset,
    destroy
  };
}

export function createFacilityRoomVisuals(scene, width, height) {
  return createFacilityRoomController(scene, width, height).objects;
}
