import { TEXTURES } from "../assets/manifest.js";
import { createOpeningFacilityLayout } from "./openingFacilityLayout.js";

const NEAREST_FILTER = 1;

function tagFacilityVisual(visual, role, zone, id = null) {
  visual.setData("facilityRole", role);
  visual.setData("facilityZone", zone);
  if (id !== null) visual.setData("facilityId", id);
  return visual;
}

export function applyProductionTextureFiltering(scene) {
  for (const key of Object.values(TEXTURES)) {
    if (scene.textures.exists(key)) {
      scene.textures.get(key).setFilter(NEAREST_FILTER);
    }
  }
}

export function createFacilityRoomVisuals(scene, width, height) {
  applyProductionTextureFiltering(scene);

  const centerX = width / 2;
  const centerY = height / 2;
  const objects = [];
  const addLayer = (visual, role, zone, id = null) => {
    objects.push(tagFacilityVisual(visual, role, zone, id));
  };

  addLayer(
    scene.add.tileSprite(centerX, centerY, width, height, TEXTURES.facilityFloor).setDepth(-20),
    "base-floor",
    "maintenance"
  );

  addLayer(
    scene.add.tileSprite(centerX + 32, centerY - 192, 640, 64, TEXTURES.facilityServiceFloor).setDepth(-19),
    "service-floor",
    "maintenance"
  );
  addLayer(
    scene.add.tileSprite(centerX + 320, centerY - 144, 64, 128, TEXTURES.facilityServiceFloor).setDepth(-19),
    "service-floor",
    "maintenance"
  );
  addLayer(
    scene.add.tileSprite(centerX + 32, centerY - 224, 640, 8, TEXTURES.facilityHazardStripe).setDepth(-18),
    "hazard-stripe",
    "entry"
  );
  addLayer(
    scene.add.tileSprite(centerX + 288, centerY - 144, 8, 128, TEXTURES.facilityHazardStripe).setDepth(-18),
    "hazard-stripe",
    "maintenance"
  );

  for (const item of createOpeningFacilityLayout(width, height)) {
    const visual = scene.add.image(item.x, item.y, item.key)
      .setDepth(item.depth)
      .setRotation(item.rotation)
      .setScale(item.scaleX, item.scaleY);
    addLayer(visual, item.role, item.zone, item.id);
  }

  return objects;
}
