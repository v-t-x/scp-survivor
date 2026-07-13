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
    scene.add.tileSprite(centerX - 352, centerY + 32, 64, 320, TEXTURES.facilityServiceFloor).setDepth(-19),
    "service-floor",
    "entry"
  );
  addLayer(
    scene.add.tileSprite(centerX + 368, centerY - 32, 160, 64, TEXTURES.facilityServiceFloor).setDepth(-19),
    "service-floor",
    "maintenance"
  );
  addLayer(
    scene.add.tileSprite(centerX + 368, centerY + 64, 96, 320, TEXTURES.facilityServiceFloor).setDepth(-19),
    "service-floor",
    "maintenance"
  );
  addLayer(
    scene.add.tileSprite(centerX - 384, centerY + 32, 8, 320, TEXTURES.facilityHazardStripe).setDepth(-18),
    "hazard-stripe",
    "entry"
  );
  addLayer(
    scene.add.tileSprite(centerX + 368, centerY - 64, 160, 8, TEXTURES.facilityHazardStripe).setDepth(-18),
    "hazard-stripe",
    "observation"
  );
  addLayer(
    scene.add.tileSprite(centerX + 416, centerY + 64, 8, 320, TEXTURES.facilityHazardStripe).setDepth(-18),
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
