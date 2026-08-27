import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import {
  DEVELOPMENT_SPRITESHEET_ASSETS,
  IMAGE_ASSETS,
  PRODUCTION_SPRITESHEET_KEYS,
  SPRITESHEET_ASSETS,
  TEXTURES
} from "../src/assets/manifest.js";
import { UPGRADE_PRESENTATION } from "../src/ui/upgradePresentation.js";

const approvedImageAssets = [
  { key: "facility-floor", path: "assets/art/facility/floor.png", size: [32, 32] },
  { key: "facility-wall", path: "assets/art/facility/wall.png", size: [64, 64] },
  { key: "facility-door", path: "assets/art/facility/door.png", size: [64, 64] },
  { key: "facility-console", path: "assets/art/facility/console.png", size: [64, 64] },
  { key: "facility-vent", path: "assets/art/facility/vent.png", size: [32, 32] },
  { key: "facility-decal", path: "assets/art/facility/decal.png", size: [32, 32] },
  { key: "facility-service-floor", path: "assets/art/facility/service-floor.png", size: [32, 32] },
  { key: "facility-hazard-stripe", path: "assets/art/facility/hazard-stripe.png", size: [32, 32] },
  { key: "facility-observation-window", path: "assets/art/facility/observation-window.png", size: [96, 64] },
  { key: "facility-pipe-bank", path: "assets/art/facility/pipe-bank.png", size: [96, 64] },
  { key: "facility-combat-floor", path: "assets/art/facility/combat-floor.png", size: [128, 128] },
  { key: "facility-entry-threshold", path: "assets/art/facility/entry-threshold.png", size: [128, 64] },
  { key: "facility-maintenance-deck", path: "assets/art/facility/maintenance-deck.png", size: [128, 128] },
  { key: "facility-wall-bank", path: "assets/art/facility/wall-bank.png", size: [128, 64] },
  { key: "facility-power-junction", path: "assets/art/facility/power-junction.png", size: [96, 96] },
  { key: "facility-contamination-trail", path: "assets/art/facility/contamination-trail.png", size: [64, 64] },
  { key: "player-rect", path: "assets/art/characters/player.png", size: [48, 48] },
  { key: "enemy-scp049", path: "assets/art/characters/scp-049.png", size: [64, 80] },
  { key: "weapon-pistol-icon", path: "assets/art/weapons/foundation-containment-rifle-icon.png", size: [96, 96] },
  { key: "weapon-breacher-icon", path: "assets/art/weapons/breacher.png", size: [96, 96] },
  { key: "weapon-tesla-icon", path: "assets/art/weapons/tesla-containment-emitter-icon.png", size: [96, 96] },
  { key: "player-tesla-power-module", path: "assets/art/weapons/tesla-containment-power-module.png", size: [64, 64] },
  { key: "title-facility-backdrop", path: "assets/art/menus/title-facility-backdrop.png", size: [960, 540] },
  { key: "armory-rack-backdrop", path: "assets/art/menus/armory-rack-backdrop.png", size: [960, 540] },
  { key: "upgrade-damage", path: "assets/art/upgrades/damage.png", size: [32, 32] },
  { key: "upgrade-attack-speed", path: "assets/art/upgrades/attack-speed.png", size: [32, 32] },
  { key: "upgrade-move-speed", path: "assets/art/upgrades/move-speed.png", size: [32, 32] },
  { key: "upgrade-max-health", path: "assets/art/upgrades/max-health.png", size: [32, 32] },
  { key: "upgrade-projectile-count", path: "assets/art/upgrades/projectile-count.png", size: [32, 32] },
  { key: "upgrade-penetration", path: "assets/art/upgrades/penetration.png", size: [32, 32] },
  { key: "upgrade-pickup-radius", path: "assets/art/upgrades/pickup-radius.png", size: [32, 32] },
  { key: "upgrade-emergency-heal", path: "assets/art/upgrades/emergency-heal.png", size: [32, 32] },
  { key: "upgrade-breacher-knockback", path: "assets/art/upgrades/breacher-knockback.png", size: [32, 32] },
  { key: "upgrade-breacher-suppression", path: "assets/art/upgrades/breacher-suppression.png", size: [32, 32] },
  { key: "upgrade-breacher-magazine", path: "assets/art/upgrades/breacher-magazine.png", size: [32, 32] },
  { key: "upgrade-tesla-chains", path: "assets/art/upgrades/tesla-chains.png", size: [32, 32] },
  { key: "upgrade-tesla-cooldown", path: "assets/art/upgrades/tesla-cooldown.png", size: [32, 32] },
  { key: "upgrade-pistol-boomerang", path: "assets/art/upgrades/pistol-boomerang.png", size: [32, 32] },
  { key: "upgrade-breacher-explosive", path: "assets/art/upgrades/breacher-explosive.png", size: [32, 32] },
  { key: "upgrade-tesla-field", path: "assets/art/upgrades/tesla-field.png", size: [32, 32] },
  { key: "terminal-surface-grid", path: "assets/art/ui/terminal-surface-grid.png", size: [128, 128] },
  { key: "incident-stamp-frame", path: "assets/art/ui/incident-stamp-frame.png", size: [96, 32] },
  { key: "recontainment-stamp-frame", path: "assets/art/ui/recontainment-stamp-frame.png", size: [96, 32] },
  { key: "contact-shadow", path: "assets/art/effects/contact-shadow.png", size: [32, 16] }
];

const upgradeIconAssets = approvedImageAssets.filter(({ key }) => key.startsWith("upgrade-"));
const weaponToneUpgradeAssets = Object.entries(UPGRADE_PRESENTATION)
  .filter(([, { tone }]) => tone === "weapon")
  .map(([upgradeKey, { textureKey, path }]) => ({ upgradeKey, key: textureKey, path }));
const terminalSurfaceAssets = approvedImageAssets.filter(({ key }) => [
  "terminal-surface-grid",
  "incident-stamp-frame",
  "recontainment-stamp-frame"
].includes(key));

const expected = new Map(approvedImageAssets.map(({ key, size }) => [key, size]));
const expectedImageAssetPaths = new Map(
  approvedImageAssets.map(({ key, path }) => [key, path])
);

const approvedCharacterSheets = [
  {
    key: "player-opening-sheet",
    path: "assets/art/characters/player-opening-sheet.png",
    size: [576, 192]
  }
];

const facilityRoomModuleAssets = [
  { property: "facilityCombatFloor", key: "facility-combat-floor", path: "assets/art/facility/combat-floor.png", size: [128, 128], alpha: "opaque", seamWrap: true },
  { property: "facilityEntryThreshold", key: "facility-entry-threshold", path: "assets/art/facility/entry-threshold.png", size: [128, 64], alpha: "opaque", seamWrap: false },
  { property: "facilityMaintenanceDeck", key: "facility-maintenance-deck", path: "assets/art/facility/maintenance-deck.png", size: [128, 128], alpha: "opaque", seamWrap: true },
  { property: "facilityWallBank", key: "facility-wall-bank", path: "assets/art/facility/wall-bank.png", size: [128, 64], alpha: "binary", seamWrap: false },
  { property: "facilityPowerJunction", key: "facility-power-junction", path: "assets/art/facility/power-junction.png", size: [96, 96], alpha: "binary", seamWrap: false },
  { property: "facilityContaminationTrail", key: "facility-contamination-trail", path: "assets/art/facility/contamination-trail.png", size: [64, 64], alpha: "binary", seamWrap: false }
];

const approvedEnemySheets = [
  { key: "r17-drifter", path: "assets/art/enemies/r17-drifter.png", size: [192, 48], frame: [48, 48], visibleExtent: 36 },
  { key: "r17-rift-skimmer", path: "assets/art/enemies/r17-rift-skimmer.png", size: [192, 48], frame: [48, 48], visibleExtent: 28 },
  { key: "r17-pulse-sac", path: "assets/art/enemies/r17-pulse-sac.png", size: [192, 48], frame: [48, 48], visibleExtent: 34 },
  { key: "r17-carapace-gate", path: "assets/art/enemies/r17-carapace-gate.png", size: [256, 64], frame: [64, 64], visibleExtent: 52 },
  { key: "r17-frame-gap", path: "assets/art/enemies/r17-frame-gap.png", size: [256, 64], frame: [64, 64], visibleExtent: 44 },
  { key: "r17-brood-mass", path: "assets/art/enemies/r17-brood-mass.png", size: [256, 64], frame: [64, 64], visibleExtent: 56 },
  { key: "r17-bud", path: "assets/art/enemies/r17-bud.png", size: [128, 32], frame: [32, 32], visibleExtent: 22 }
];

const approvedPlayerBodySheets = [
  {
    key: "player-response-operative-body-sheet",
    path: "assets/art/characters/player-response-operative-body.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  }
];

const approvedPlayerEquipmentSheets = [
  { key: "player-foundation-rifle-aim-back", path: "assets/art/weapons/foundation-containment-rifle-aim-back.png" },
  { key: "player-foundation-rifle-aim-front", path: "assets/art/weapons/foundation-containment-rifle-aim-front.png" },
  { key: "player-foundation-rifle-aim-recoil-back", path: "assets/art/weapons/foundation-containment-rifle-aim-recoil-back.png" },
  { key: "player-foundation-rifle-aim-recoil-front", path: "assets/art/weapons/foundation-containment-rifle-aim-recoil-front.png" },
  { key: "player-tesla-emitter-aim-back", path: "assets/art/weapons/tesla-containment-emitter-aim-back.png" },
  { key: "player-tesla-emitter-aim-front", path: "assets/art/weapons/tesla-containment-emitter-aim-front.png" },
  { key: "player-tesla-emitter-aim-recoil-back", path: "assets/art/weapons/tesla-containment-emitter-aim-recoil-back.png" },
  { key: "player-tesla-emitter-aim-recoil-front", path: "assets/art/weapons/tesla-containment-emitter-aim-recoil-front.png" }
].map(({ key, path }) => ({
  key,
  path,
  frameConfig: { frameWidth: 64, frameHeight: 64 }
}));

const approvedSpritesheets = [
  ...approvedCharacterSheets.map(({ key, path }) => ({
    key,
    path,
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  })),
  ...approvedPlayerBodySheets,
  ...approvedPlayerEquipmentSheets,
  ...approvedEnemySheets.map(({ key, path, frame: [frameWidth, frameHeight] }) => ({
    key,
    path,
    frameConfig: { frameWidth, frameHeight }
  }))
];

const enemyBossCandidateSheets = [
  { property: "r17DrifterActionSheet", key: "r17-drifter-action-sheet", path: "assets/art/enemies/r17-drifter-action-sheet.png", frameConfig: { frameWidth: 48, frameHeight: 48 } },
  { property: "r17RiftSkimmerActionSheet", key: "r17-rift-skimmer-action-sheet", path: "assets/art/enemies/r17-rift-skimmer-action-sheet.png", frameConfig: { frameWidth: 48, frameHeight: 48 } },
  { property: "r17PulseSacActionSheet", key: "r17-pulse-sac-action-sheet", path: "assets/art/enemies/r17-pulse-sac-action-sheet.png", frameConfig: { frameWidth: 48, frameHeight: 48 } },
  { property: "r17CarapaceGateActionSheet", key: "r17-carapace-gate-action-sheet", path: "assets/art/enemies/r17-carapace-gate-action-sheet.png", frameConfig: { frameWidth: 64, frameHeight: 64 } },
  { property: "r17FrameGapActionSheet", key: "r17-frame-gap-action-sheet", path: "assets/art/enemies/r17-frame-gap-action-sheet.png", frameConfig: { frameWidth: 64, frameHeight: 64 } },
  { property: "r17BroodMassActionSheet", key: "r17-brood-mass-action-sheet", path: "assets/art/enemies/r17-brood-mass-action-sheet.png", frameConfig: { frameWidth: 64, frameHeight: 64 } },
  { property: "r17BudActionSheet", key: "r17-bud-action-sheet", path: "assets/art/enemies/r17-bud-action-sheet.png", frameConfig: { frameWidth: 32, frameHeight: 32 } },
  { property: "enemyScp049LocomotionSheet", key: "enemy-scp049-locomotion-sheet", path: "assets/art/characters/scp-049-locomotion-sheet.png", frameConfig: { frameWidth: 80, frameHeight: 96 } },
  { property: "enemyScp049ActionSheet", key: "enemy-scp049-action-sheet", path: "assets/art/characters/scp-049-action-sheet.png", frameConfig: { frameWidth: 80, frameHeight: 96 } }
];

const gate2CandidateSheets = [
  {
    property: "r17RiftSkimmerActionSheet",
    key: "r17-rift-skimmer-action-sheet",
    path: "assets/art/enemies/r17-rift-skimmer-action-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 },
    finalSize: [864, 48],
    frameCount: 18,
    sha256: "7b944216e4b78eaacb1a36d8ae023ac03c343e5fbda523e56fc4ec226065e304",
    clips: {
      move: { start: 0, end: 5, fps: 12, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      pierce: { start: 14, end: 17, fps: 15, repeat: 0 }
    }
  },
  {
    property: "r17BudActionSheet",
    key: "r17-bud-action-sheet",
    path: "assets/art/enemies/r17-bud-action-sheet.png",
    frameConfig: { frameWidth: 32, frameHeight: 32 },
    finalSize: [576, 32],
    frameCount: 18,
    sha256: "22ff646ce9ee1ddc1b67305c95e5d4fa9c6c862a494976598ac87025e0fa99e6",
    clips: {
      move: { start: 0, end: 5, fps: 12, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      snap: { start: 14, end: 17, fps: 16, repeat: 0 }
    }
  },
  {
    property: "r17FrameGapActionSheet",
    key: "r17-frame-gap-action-sheet",
    path: "assets/art/enemies/r17-frame-gap-action-sheet.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 },
    finalSize: [1408, 64],
    frameCount: 22,
    sha256: "ff72566e4c612ee6292e6135b0f06f2e7d12aa53fe0219f82b6304ab41bcf9c5",
    clips: {
      move: { start: 0, end: 5, fps: 8, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      "phase-out": { start: 14, end: 17, fps: 6, repeat: 0 },
      "reappear-dash": { start: 18, end: 21, fps: 12.5, repeat: -1 }
    }
  }
];

const gate3CandidateSheets = [
  {
    property: "r17DrifterActionSheet",
    key: "r17-drifter-action-sheet",
    path: "assets/art/enemies/r17-drifter-action-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 },
    finalSize: [864, 48],
    frameCount: 18,
    sha256: "9f9f07490834273bc742bddca319fe9fc0529e8993987534505eb8cf449152fd",
    clips: {
      move: { start: 0, end: 5, fps: 6, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      contact: { start: 14, end: 17, fps: 12, repeat: 0 }
    }
  },
  {
    property: "r17PulseSacActionSheet",
    key: "r17-pulse-sac-action-sheet",
    path: "assets/art/enemies/r17-pulse-sac-action-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 },
    finalSize: [960, 48],
    frameCount: 20,
    sha256: "5544920457dce1b8ef0dec09103a5568b7707294d97fc266e9adccd2125d516d",
    clips: {
      move: { start: 0, end: 5, fps: 6, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      shoot: { start: 14, end: 19, fps: 10, repeat: 0, releaseFrame: 18 }
    }
  },
  {
    property: "r17CarapaceGateActionSheet",
    key: "r17-carapace-gate-action-sheet",
    path: "assets/art/enemies/r17-carapace-gate-action-sheet.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 },
    finalSize: [1408, 64],
    frameCount: 22,
    sha256: "4775a31f1341d245725fa569da28fb38476024c5de6205cb323f91cf0694c776",
    clips: {
      move: { start: 0, end: 5, fps: 6, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      brace: { start: 14, end: 17, fps: 5, repeat: 0 },
      charge: { start: 18, end: 21, fps: 9, repeat: -1 }
    }
  },
  {
    property: "r17BroodMassActionSheet",
    key: "r17-brood-mass-action-sheet",
    path: "assets/art/enemies/r17-brood-mass-action-sheet.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 },
    finalSize: [1408, 64],
    frameCount: 22,
    sha256: "d86b730ab9aae6c24769779eb9b6db5ea436e0f70f1049d69d11d2f282f1fdb6",
    clips: {
      move: { start: 0, end: 5, fps: 5, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      split: { start: 14, end: 21, fps: 12, repeat: 0 }
    }
  }
];

const gate4CandidateSheets = [
  {
    property: "enemyScp049LocomotionSheet",
    kind: "scp049-locomotion",
    key: "enemy-scp049-locomotion-sheet",
    path: "assets/art/characters/scp-049-locomotion-sheet.png",
    frameConfig: { frameWidth: 80, frameHeight: 96 },
    finalSize: [800, 384],
    frameCount: 40,
    sha256: "fe7c23bc628f9cad458f7864fde1937d8d5774294137ae886d9b6cbf6c068c21",
    directions: ["down", "left", "right", "up"],
    rowClips: {
      idle: { start: 0, end: 3, fps: 5, repeat: -1 },
      walk: { start: 4, end: 9, fps: 8, repeat: -1 }
    }
  },
  {
    property: "enemyScp049ActionSheet",
    kind: "scp049-action",
    key: "enemy-scp049-action-sheet",
    path: "assets/art/characters/scp-049-action-sheet.png",
    frameConfig: { frameWidth: 80, frameHeight: 96 },
    finalSize: [1520, 96],
    frameCount: 19,
    sha256: "96b8e0cd49405c538d4744b004e61dc2bcfcb6265dba12651d30600bae76413d",
    clips: {
      "frenzy-enter": { start: 0, end: 4, fps: 10, repeat: 0 },
      "frenzy-loop": { start: 5, end: 8, fps: 8, repeat: -1 },
      "hit-overlay": { start: 9, end: 10, fps: 24, repeat: 0 },
      recontain: { start: 11, end: 18, fps: 12, repeat: 0 }
    }
  }
];

const r17TextureKeys = {
  r17Drifter: "r17-drifter",
  r17RiftSkimmer: "r17-rift-skimmer",
  r17PulseSac: "r17-pulse-sac",
  r17CarapaceGate: "r17-carapace-gate",
  r17FrameGap: "r17-frame-gap",
  r17BroodMass: "r17-brood-mass",
  r17Bud: "r17-bud"
};

const legacyFallbackTextureKeys = {
  player: "player-rect",
  enemyInfected: "enemy-infected",
  enemyCrawler: "enemy-crawler",
  enemyDrone: "enemy-drone",
  eliteRiot: "elite-riot",
  eliteBlink: "elite-blink",
  eliteBiomass: "elite-biomass",
  biomassChild: "biomass-child",
  enemyScp049: "enemy-scp049"
};

function readPngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodeRgbaPng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  const imageData = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "production PNGs must use 8-bit channels");
      assert.equal(data[9], 6, "production PNGs must use RGBA color type 6");
    } else if (type === "IDAT") {
      imageData.push(data);
    }
    offset += length + 12;
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const encoded = inflateSync(Buffer.concat(imageData));
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[sourceOffset];
    sourceOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = encoded[sourceOffset + x];
      const left = x >= bytesPerPixel ? pixels[y * stride + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? pixels[(y - 1) * stride + x - bytesPerPixel]
        : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? above
            : filter === 3
              ? Math.floor((left + above) / 2)
              : paethPredictor(left, above, upperLeft);
      assert.ok(filter >= 0 && filter <= 4, `unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = (raw + predictor) & 0xff;
    }
    sourceOffset += stride;
  }
  return { width, height, pixels };
}

function assertApprovedStaticImageAssets(assets) {
  assert.equal(assets.length, approvedImageAssets.length);
  assert.equal(
    new Set(assets.map(({ key }) => key)).size,
    assets.length,
    "duplicate texture keys detected"
  );
  assert.deepEqual(
    new Map(assets.map(({ key, path }) => [key, path])),
    expectedImageAssetPaths
  );
}

function getFramePixels(pixels, sheetWidth, frameIndex) {
  const frameWidth = 48;
  const frameHeight = 48;
  const frameX = (frameIndex % 12) * frameWidth;
  const frameY = Math.floor(frameIndex / 12) * frameHeight;
  const result = Buffer.alloc(frameWidth * frameHeight * 4);
  for (let y = 0; y < frameHeight; y += 1) {
    const sourceStart = ((frameY + y) * sheetWidth + frameX) * 4;
    const targetStart = y * frameWidth * 4;
    pixels.copy(result, targetStart, sourceStart, sourceStart + frameWidth * 4);
  }
  return result;
}

function getEnemyFramePixels(pixels, sheetWidth, frameWidth, frameHeight, frameIndex) {
  const result = Buffer.alloc(frameWidth * frameHeight * 4);
  const framesPerRow = sheetWidth / frameWidth;
  assert.equal(Number.isInteger(framesPerRow), true, "spritesheet width must contain whole frames");
  const frameX = (frameIndex % framesPerRow) * frameWidth;
  const frameY = Math.floor(frameIndex / framesPerRow) * frameHeight;
  for (let y = 0; y < frameHeight; y += 1) {
    const sourceStart = (((frameY + y) * sheetWidth) + frameX) * 4;
    pixels.copy(result, y * frameWidth * 4, sourceStart, sourceStart + frameWidth * 4);
  }
  return result;
}

function getEnemyFrameMetrics(framePixels, frameWidth, frameHeight) {
  let minX = frameWidth;
  let minY = frameHeight;
  let maxX = -1;
  let maxY = -1;
  let visiblePixels = 0;
  const colors = new Set();
  const alphaValues = new Set();
  for (let index = 0; index < frameWidth * frameHeight; index += 1) {
    const offset = index * 4;
    const alpha = framePixels[offset + 3];
    alphaValues.add(alpha);
    if (alpha === 0) continue;
    const x = index % frameWidth;
    const y = Math.floor(index / frameWidth);
    visiblePixels += 1;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    colors.add(`${framePixels[offset]},${framePixels[offset + 1]},${framePixels[offset + 2]}`);
  }
  assert.ok(maxX >= minX && maxY >= minY, "R-17 frame cannot be empty");
  return {
    visiblePixels,
    colors,
    alphaValues,
    bbox: { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 },
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    bottomY: maxY,
    height: maxY - minY + 1
  };
}

function getOpaqueComponentSizes(framePixels, frameWidth, frameHeight) {
  const visited = new Uint8Array(frameWidth * frameHeight);
  const sizes = [];
  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || framePixels[start * 4 + 3] !== 255) continue;
    let size = 0;
    const pending = [start];
    visited[start] = 1;
    while (pending.length > 0) {
      const index = pending.pop();
      size += 1;
      const x = index % frameWidth;
      const y = Math.floor(index / frameWidth);
      for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nextX < 0 || nextX >= frameWidth || nextY < 0 || nextY >= frameHeight) continue;
        const next = nextY * frameWidth + nextX;
        if (visited[next] || framePixels[next * 4 + 3] !== 255) continue;
        visited[next] = 1;
        pending.push(next);
      }
    }
    sizes.push(size);
  }
  return sizes;
}

function normalizeEnemyFrame(framePixels, frameWidth, frameHeight, bbox) {
  const normalized = Buffer.alloc(frameWidth * frameHeight * 4);
  const targetX = Math.round((frameWidth - bbox.width) / 2);
  const targetY = frameHeight - bbox.height - 1;
  for (let y = bbox.minY; y <= bbox.maxY; y += 1) {
    for (let x = bbox.minX; x <= bbox.maxX; x += 1) {
      const sourceOffset = (y * frameWidth + x) * 4;
      const targetOffset = ((targetY + y - bbox.minY) * frameWidth + targetX + x - bbox.minX) * 4;
      framePixels.copy(normalized, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }
  return normalized;
}

function getEnemyPairDifference(firstFrame, secondFrame) {
  let changedPixels = 0;
  let alphaShapePixels = 0;
  let visibleUnionPixels = 0;
  for (let offset = 0; offset < firstFrame.length; offset += 4) {
    const firstVisible = firstFrame[offset + 3] === 255;
    const secondVisible = secondFrame[offset + 3] === 255;
    if (!firstVisible && !secondVisible) continue;
    visibleUnionPixels += 1;
    if (firstVisible !== secondVisible) alphaShapePixels += 1;
    if (!firstFrame.subarray(offset, offset + 4).equals(secondFrame.subarray(offset, offset + 4))) {
      changedPixels += 1;
    }
  }
  return {
    changedPixelRatio: changedPixels / visibleUnionPixels,
    alphaShapeDifferenceRatio: alphaShapePixels / visibleUnionPixels
  };
}

function mirrorEnemyFrameHorizontally(framePixels, frameWidth, frameHeight) {
  const mirrored = Buffer.alloc(framePixels.length);
  for (let y = 0; y < frameHeight; y += 1) {
    for (let x = 0; x < frameWidth; x += 1) {
      const sourceOffset = (y * frameWidth + x) * 4;
      const targetOffset = (y * frameWidth + frameWidth - 1 - x) * 4;
      framePixels.copy(mirrored, targetOffset, sourceOffset, sourceOffset + 4);
    }
  }
  return mirrored;
}

function getCroppedAlphaMask(framePixels, frameWidth, bbox) {
  const mask = Buffer.alloc(bbox.width * bbox.height);
  for (let y = 0; y < bbox.height; y += 1) {
    for (let x = 0; x < bbox.width; x += 1) {
      const sourceOffset = (((bbox.minY + y) * frameWidth) + bbox.minX + x) * 4 + 3;
      mask[y * bbox.width + x] = framePixels[sourceOffset];
    }
  }
  return mask;
}

function mirrorAlphaMaskHorizontally(mask, width, height) {
  const mirrored = Buffer.alloc(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      mirrored[y * width + width - 1 - x] = mask[y * width + x];
    }
  }
  return mirrored;
}

function getOpaqueComponentMetrics(framePixels, frameWidth, frameHeight) {
  const visited = new Uint8Array(frameWidth * frameHeight);
  const components = [];
  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || framePixels[start * 4 + 3] !== 255) continue;
    const pending = [start];
    visited[start] = 1;
    let size = 0;
    let minX = frameWidth;
    let minY = frameHeight;
    let maxX = -1;
    let maxY = -1;
    while (pending.length > 0) {
      const index = pending.pop();
      const x = index % frameWidth;
      const y = Math.floor(index / frameWidth);
      size += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nextX < 0 || nextX >= frameWidth || nextY < 0 || nextY >= frameHeight) continue;
        const next = nextY * frameWidth + nextX;
        if (visited[next] || framePixels[next * 4 + 3] !== 255) continue;
        visited[next] = 1;
        pending.push(next);
      }
    }
    components.push({ size, minX, minY, maxX, maxY });
  }
  return components;
}

function isScp049ContainmentCyan(red, green, blue) {
  return (
    red <= 80
    && green >= 90
    && blue >= 140
    && green - red >= 50
    && blue - red >= 60
  );
}

function isScp049GreenOrOlive(red, green, blue) {
  return green >= 40 && green - red >= 12 && green - blue >= 12;
}

function auditScp049Frame(framePixels, frameWidth, frameHeight, label) {
  const metrics = getEnemyFrameMetrics(framePixels, frameWidth, frameHeight);
  let hiddenRgb = 0;
  let greenWithoutContainmentCyan = 0;
  let containmentCyan = 0;
  let activeWineRed = 0;
  for (let index = 0; index < frameWidth * frameHeight; index += 1) {
    const offset = index * 4;
    const red = framePixels[offset];
    const green = framePixels[offset + 1];
    const blue = framePixels[offset + 2];
    const alpha = framePixels[offset + 3];
    if (alpha === 0) {
      if (red || green || blue) hiddenRgb += 1;
      continue;
    }
    const cyan = isScp049ContainmentCyan(red, green, blue);
    if (cyan) containmentCyan += 1;
    if (isScp049GreenOrOlive(red, green, blue) && !cyan) greenWithoutContainmentCyan += 1;
    if (red >= 90 && red - green >= 45 && red - blue >= 40) activeWineRed += 1;
  }
  for (let x = 0; x < frameWidth; x += 1) {
    assert.equal(framePixels[x * 4 + 3], 0, `${label} touches the top edge`);
    assert.equal(framePixels[((frameHeight - 1) * frameWidth + x) * 4 + 3], 0, `${label} touches the bottom edge`);
  }
  for (let y = 0; y < frameHeight; y += 1) {
    assert.equal(framePixels[(y * frameWidth) * 4 + 3], 0, `${label} touches the left edge`);
    assert.equal(framePixels[(y * frameWidth + frameWidth - 1) * 4 + 3], 0, `${label} touches the right edge`);
  }
  assert.deepEqual(metrics.alphaValues, new Set([0, 255]), `${label} binary alpha`);
  assert.ok(metrics.colors.size <= 32, `${label} exceeds 32 opaque colors`);
  assert.equal(hiddenRgb, 0, `${label} has hidden RGB under transparent pixels`);
  assert.ok(getOpaqueComponentSizes(framePixels, frameWidth, frameHeight).every((size) => size > 1), `${label} has an isolated 1px component`);
  return { ...metrics, greenWithoutContainmentCyan, containmentCyan, activeWineRed };
}

function getVisibleFootY(framePixels) {
  let footY = -1;
  for (let offset = 0; offset < framePixels.length; offset += 4) {
    if (framePixels[offset + 3] === 255) {
      footY = Math.max(footY, Math.floor(offset / 4 / 48));
    }
  }
  return footY;
}

function getAlphaBounds(framePixels) {
  let minX = 48;
  let minY = 48;
  let maxX = -1;
  let maxY = -1;
  for (let offset = 0; offset < framePixels.length; offset += 4) {
    if (framePixels[offset + 3] !== 255) continue;
    const pixelIndex = offset / 4;
    const x = pixelIndex % 48;
    const y = Math.floor(pixelIndex / 48);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  assert.ok(maxX >= minX && maxY >= minY, "character frame cannot be empty");
  return { minX, minY, maxX, maxY };
}

function normalizeFrameByAlphaBoundsAndFeet(framePixels) {
  const { minX, minY, maxX, maxY } = getAlphaBounds(framePixels);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const targetX = Math.floor((48 - width) / 2);
  const targetY = 48 - height;
  const normalized = Buffer.alloc(48 * 48 * 4);

  for (let sourceY = minY; sourceY <= maxY; sourceY += 1) {
    for (let sourceX = minX; sourceX <= maxX; sourceX += 1) {
      const sourceOffset = (sourceY * 48 + sourceX) * 4;
      const destinationX = targetX + sourceX - minX;
      const destinationY = targetY + sourceY - minY;
      const destinationOffset = (destinationY * 48 + destinationX) * 4;
      framePixels.copy(normalized, destinationOffset, sourceOffset, sourceOffset + 4);
    }
  }
  return normalized;
}

function getNormalizedFrameHash(framePixels) {
  return createHash("sha256")
    .update(normalizeFrameByAlphaBoundsAndFeet(framePixels))
    .digest("hex");
}

function getFramePairDifferenceRatios(firstFrame, secondFrame) {
  const first = normalizeFrameByAlphaBoundsAndFeet(firstFrame);
  const second = normalizeFrameByAlphaBoundsAndFeet(secondFrame);
  let changedPixels = 0;
  let changedAlphaShapePixels = 0;
  let visibleUnionPixels = 0;
  for (let offset = 0; offset < first.length; offset += 4) {
    const firstVisible = first[offset + 3] === 255;
    const secondVisible = second[offset + 3] === 255;
    if (!firstVisible && !secondVisible) continue;
    visibleUnionPixels += 1;
    if (firstVisible !== secondVisible) changedAlphaShapePixels += 1;
    if (!first.subarray(offset, offset + 4).equals(second.subarray(offset, offset + 4))) {
      changedPixels += 1;
    }
  }
  assert.ok(visibleUnionPixels > 0, "character frame pair cannot be empty");
  return {
    changedPixelRatio: changedPixels / visibleUnionPixels,
    alphaShapeDifferenceRatio: changedAlphaShapePixels / visibleUnionPixels
  };
}

function assertMeaningfullyDifferentFramePairs(frames, context) {
  for (let firstIndex = 0; firstIndex < frames.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < frames.length; secondIndex += 1) {
      const {
        changedPixelRatio,
        alphaShapeDifferenceRatio
      } = getFramePairDifferenceRatios(frames[firstIndex], frames[secondIndex]);
      assert.ok(
        changedPixelRatio >= 0.04,
        `${context} frames ${firstIndex}<->${secondIndex} changed-pixel ratio ${changedPixelRatio.toFixed(4)} is below 0.0400`
      );
      assert.ok(
        alphaShapeDifferenceRatio >= 0.04,
        `${context} frames ${firstIndex}<->${secondIndex} alpha-shape difference ratio ${alphaShapeDifferenceRatio.toFixed(4)} is below 0.0400`
      );
    }
  }
}

function createAdversarialFrame({ hollowCenter = false, color = [42, 86, 118] } = {}) {
  const frame = Buffer.alloc(48 * 48 * 4);
  for (let y = 24; y <= 43; y += 1) {
    for (let x = 18; x <= 29; x += 1) {
      if (hollowCenter && x >= 20 && x <= 27 && y >= 28 && y <= 35) continue;
      const offset = (y * 48 + x) * 4;
      frame.set([...color, 255], offset);
    }
  }
  return frame;
}

test("character frame gate rejects a non-adjacent copy with one changed visible pixel", () => {
  const original = createAdversarialFrame();
  const interveningPose = createAdversarialFrame({ hollowCenter: true });
  const nearDuplicate = Buffer.from(original);
  nearDuplicate.set([210, 60, 45, 255], (30 * 48 + 20) * 4);

  assert.throws(
    () => assertMeaningfullyDifferentFramePairs(
      [original, interveningPose, nearDuplicate],
      "adversarial idle row 0"
    ),
    /adversarial idle row 0 frames 0<->2 changed-pixel ratio .* is below 0\.0400/
  );
});

test("character frame gate rejects recoloring without alpha-shape motion", () => {
  const original = createAdversarialFrame();
  const recoloredCopy = createAdversarialFrame({ color: [220, 90, 55] });

  assert.throws(
    () => assertMeaningfullyDifferentFramePairs(
      [original, recoloredCopy],
      "recolor move row 0"
    ),
    /recolor move row 0 frames 0<->1 alpha-shape difference ratio 0\.0000 is below 0\.0400/
  );
});

test("response operative texture keys are declared, unique, with only the production body preloaded", () => {
  assert.equal(TEXTURES.playerResponseOperativeBodySheet, "player-response-operative-body-sheet");
  assert.equal(TEXTURES.playerResponseOperativePrototypeSheet, "player-response-operative-prototype-sheet");
  assert.equal(TEXTURES.playerResponseOperativeBodyPrototypeSheet, "player-response-operative-body-prototype-sheet");
  assert.equal(TEXTURES.playerResponseOperativeSheet, "player-response-operative-sheet");

  const allTextureValues = Object.values(TEXTURES);
  assert.equal(
    new Set(allTextureValues).size,
    allTextureValues.length,
    "new character keys must stay unique across every declared texture key"
  );

  const r17Values = new Set(Object.values(r17TextureKeys));
  const legacyValues = new Set(Object.values(legacyFallbackTextureKeys));
  const spritesheetKeys = new Set(SPRITESHEET_ASSETS.map(({ key }) => key));
  const imageKeys = new Set(IMAGE_ASSETS.map(({ key }) => key));
  for (const key of [
    TEXTURES.playerResponseOperativeBodySheet,
    TEXTURES.playerResponseOperativePrototypeSheet,
    TEXTURES.playerResponseOperativeBodyPrototypeSheet,
    TEXTURES.playerResponseOperativeSheet
  ]) {
    assert.equal(r17Values.has(key), false, `${key} must not collide with R-17 keys`);
    assert.equal(legacyValues.has(key), false, `${key} must not collide with legacy fallback keys`);
    assert.equal(imageKeys.has(key), false, `${key} must not be preloaded as a static image`);
  }
  assert.equal(spritesheetKeys.has(TEXTURES.playerResponseOperativeBodySheet), true);
  assert.equal(spritesheetKeys.has(TEXTURES.playerResponseOperativePrototypeSheet), false);
  assert.equal(spritesheetKeys.has(TEXTURES.playerResponseOperativeBodyPrototypeSheet), false);
  assert.equal(
    spritesheetKeys.has(TEXTURES.playerResponseOperativeSheet),
    false,
    "production sheet must not be preloaded before its asset exists"
  );
});

test("production manifest declares the approved static vertical slice", () => {
  assert.equal(TEXTURES.weaponPistolIcon, "weapon-pistol-icon");
  assert.equal(TEXTURES.weaponBreacherIcon, "weapon-breacher-icon");
  assert.equal(TEXTURES.weaponTeslaIcon, "weapon-tesla-icon");
  assert.equal(TEXTURES.armoryRackBackdrop, "armory-rack-backdrop");
  assert.equal(TEXTURES.facilityServiceFloor, "facility-service-floor");
  assert.equal(TEXTURES.facilityHazardStripe, "facility-hazard-stripe");
  assert.equal(TEXTURES.facilityObservationWindow, "facility-observation-window");
  assert.equal(TEXTURES.facilityPipeBank, "facility-pipe-bank");
  for (const { property, key } of facilityRoomModuleAssets) {
    assert.equal(TEXTURES[property], key);
  }
  assertApprovedStaticImageAssets(IMAGE_ASSETS);
});

test("production manifest declares the exact approved spritesheet contract", () => {
  assert.equal(TEXTURES.playerOpeningSheet, "player-opening-sheet");
  assert.equal(TEXTURES.infectedOpeningSheet, "infected-opening-sheet");
  for (const [property, key] of Object.entries(r17TextureKeys)) {
    assert.equal(TEXTURES[property], key);
  }
  assert.deepEqual(SPRITESHEET_ASSETS, [
    ...approvedSpritesheets,
    ...enemyBossCandidateSheets.map(({ key, path, frameConfig }) => ({
      key,
      path,
      frameConfig,
      previewQuery: { name: "enemyPresentation", value: "candidate" },
      candidateId: key
    }))
  ]);
});

// Break caught: production admission moves or mutates any Player development entry.
test("Player development entries remain exact after the nine-sheet production admission", () => {
  assert.deepEqual(DEVELOPMENT_SPRITESHEET_ASSETS.map(({ key }) => key), [
    "player-response-operative-prototype-sheet",
    "player-response-operative-body-prototype-sheet",
    "player-response-operative-breacher-sample-sheet",
    "player-response-operative-cbrn-sample-sheet"
  ]);
  assert.equal(DEVELOPMENT_SPRITESHEET_ASSETS.some(({ key }) => (
    enemyBossCandidateSheets.some((candidate) => candidate.key === key)
  )), false);
});

for (const {
  property,
  key,
  path: assetPath,
  frameConfig,
  finalSize,
  frameCount,
  sha256,
  clips
} of gate2CandidateSheets) {
  // Break caught: this exact Gate 2 sheet is missing or diverges from its production real-asset contract.
  test(`Gate 2 production sheet ${key} has its exact real action sheet`, async () => {
    assert.equal(TEXTURES[property], key, property);
    assert.deepEqual(
      SPRITESHEET_ASSETS.find((asset) => asset.key === key),
      {
        key,
        path: assetPath,
        frameConfig,
        previewQuery: { name: "enemyPresentation", value: "candidate" },
        candidateId: key
      }
    );
    assert.equal(DEVELOPMENT_SPRITESHEET_ASSETS.some((asset) => asset.key === key), false, property);

    const contract = JSON.parse(
      await readFile(new URL("../scripts/art/data/enemy-boss-animation-contracts.json", import.meta.url), "utf8")
    );
    assert.deepEqual({
      productionPath: contract[property]?.productionPath,
      frameWidth: contract[property]?.frameWidth,
      frameHeight: contract[property]?.frameHeight,
      frameCount: contract[property]?.frameCount,
      sheetWidth: contract[property]?.sheetWidth,
      sheetHeight: contract[property]?.sheetHeight,
      clips: contract[property]?.clips
    }, {
      productionPath: assetPath,
      frameWidth: frameConfig.frameWidth,
      frameHeight: frameConfig.frameHeight,
      frameCount,
      sheetWidth: finalSize[0],
      sheetHeight: finalSize[1],
      clips
    }, property);

    const absolute = fileURLToPath(new URL(`../public/${assetPath}`, import.meta.url));
    const buffer = await readFile(absolute);
    const [width, height] = readPngSize(buffer);
    assert.deepEqual([width, height], finalSize, key);
    assert.equal((width / frameConfig.frameWidth) * (height / frameConfig.frameHeight), frameCount, key);
    assert.equal(
      createHash("sha256").update(buffer).digest("hex"),
      sha256,
      `${key} SHA-256`
    );
  });
}

for (const {
  property,
  key,
  path: assetPath,
  frameConfig,
  finalSize,
  frameCount,
  sha256,
  clips
} of gate3CandidateSheets) {
  // Break caught: this exact Gate 3 sheet is missing or diverges from its production real-asset contract.
  test(`Gate 3 production sheet ${key} has its exact real action sheet`, async () => {
    assert.equal(TEXTURES[property], key, property);
    assert.deepEqual(
      SPRITESHEET_ASSETS.find((asset) => asset.key === key),
      {
        key,
        path: assetPath,
        frameConfig,
        previewQuery: { name: "enemyPresentation", value: "candidate" },
        candidateId: key
      }
    );
    assert.equal(DEVELOPMENT_SPRITESHEET_ASSETS.some((asset) => asset.key === key), false, property);

    const contract = JSON.parse(
      await readFile(new URL("../scripts/art/data/enemy-boss-animation-contracts.json", import.meta.url), "utf8")
    );
    assert.deepEqual({
      productionPath: contract[property]?.productionPath,
      frameWidth: contract[property]?.frameWidth,
      frameHeight: contract[property]?.frameHeight,
      frameCount: contract[property]?.frameCount,
      sheetWidth: contract[property]?.sheetWidth,
      sheetHeight: contract[property]?.sheetHeight,
      clips: contract[property]?.clips
    }, {
      productionPath: assetPath,
      frameWidth: frameConfig.frameWidth,
      frameHeight: frameConfig.frameHeight,
      frameCount,
      sheetWidth: finalSize[0],
      sheetHeight: finalSize[1],
      clips
    }, property);

    const absolute = fileURLToPath(new URL(`../public/${assetPath}`, import.meta.url));
    const buffer = await readFile(absolute);
    const [width, height] = readPngSize(buffer);
    assert.deepEqual([width, height], finalSize, key);
    assert.equal((width / frameConfig.frameWidth) * (height / frameConfig.frameHeight), frameCount, key);
    assert.equal(
      createHash("sha256").update(buffer).digest("hex"),
      sha256,
      `${key} SHA-256`
    );

    const { pixels } = decodeRgbaPng(buffer);
    let greenDominantPixels = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] === 0) continue;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      if (green >= 40 && green - red >= 12 && green - blue >= 12) {
        greenDominantPixels += 1;
      }
    }
    assert.equal(greenDominantPixels, 0, `${key} has non-cyan green/olive material residue`);
  });
}

for (const {
  property,
  kind,
  key,
  path: assetPath,
  frameConfig,
  finalSize,
  frameCount,
  sha256,
  directions,
  rowClips,
  clips
} of gate4CandidateSheets) {
  // Break caught: a Gate 4 Boss sheet diverges from its real production contract.
  test(`Gate 4 production sheet ${key} has its exact real formal-animation sheet`, async () => {
    assert.equal(TEXTURES[property], key, property);
    assert.deepEqual(
      SPRITESHEET_ASSETS.find((asset) => asset.key === key),
      {
        key,
        path: assetPath,
        frameConfig,
        previewQuery: { name: "enemyPresentation", value: "candidate" },
        candidateId: key
      }
    );
    assert.equal(IMAGE_ASSETS.some((asset) => asset.key === key), false, property);
    assert.equal(DEVELOPMENT_SPRITESHEET_ASSETS.some((asset) => asset.key === key), false, property);
    assert.equal(PRODUCTION_SPRITESHEET_KEYS.has(key), true, property);

    const contract = JSON.parse(
      await readFile(new URL("../scripts/art/data/enemy-boss-animation-contracts.json", import.meta.url), "utf8")
    );
    assert.deepEqual(contract[property], {
      kind,
      textureKey: key,
      productionPath: assetPath,
      frameWidth: frameConfig.frameWidth,
      frameHeight: frameConfig.frameHeight,
      frameCount,
      sheetWidth: finalSize[0],
      sheetHeight: finalSize[1],
      ...(directions ? { directions, rowClips } : { clips })
    }, property);

    const absolute = fileURLToPath(new URL(`../public/${assetPath}`, import.meta.url));
    const buffer = await readFile(absolute);
    const [width, height] = readPngSize(buffer);
    assert.deepEqual([width, height], finalSize, key);
    assert.equal((width / frameConfig.frameWidth) * (height / frameConfig.frameHeight), frameCount, key);
    assert.equal(createHash("sha256").update(buffer).digest("hex"), sha256, `${key} SHA-256`);
  });
}

// Break caught: SCP-049 direction rows use cyan body material, soft pixels or mirrored side art.
test("Gate 4 SCP-049 locomotion is a clean native four-direction 80x96 sheet", async () => {
  const absolute = fileURLToPath(new URL("../public/assets/art/characters/scp-049-locomotion-sheet.png", import.meta.url));
  const { width, pixels } = decodeRgbaPng(await readFile(absolute));
  const frames = [];
  const audits = [];

  for (let frameIndex = 0; frameIndex < 40; frameIndex += 1) {
    const frame = getEnemyFramePixels(pixels, width, 80, 96, frameIndex);
    const audit = auditScp049Frame(frame, 80, 96, `SCP-049 locomotion frame ${frameIndex}`);
    assert.equal(audit.greenWithoutContainmentCyan, 0, `locomotion frame ${frameIndex} green/olive residue`);
    assert.equal(audit.containmentCyan, 0, `locomotion frame ${frameIndex} must not have a cyan body core`);
    frames.push(frame);
    audits.push(audit);
  }

  for (let clipFrame = 0; clipFrame < 10; clipFrame += 1) {
    const left = frames[10 + clipFrame];
    const right = frames[20 + clipFrame];
    assert.equal(left.equals(right), false, `left/right frame ${clipFrame} is byte-identical`);
    assert.equal(left.equals(mirrorEnemyFrameHorizontally(right, 80, 96)), false, `left/right frame ${clipFrame} is a full-frame mirror`);

    const leftBox = audits[10 + clipFrame].bbox;
    const rightBox = audits[20 + clipFrame].bbox;
    const leftMask = getCroppedAlphaMask(left, 80, leftBox);
    const rightMask = getCroppedAlphaMask(right, 80, rightBox);
    const sameDimensions = leftBox.width === rightBox.width && leftBox.height === rightBox.height;
    assert.equal(sameDimensions && leftMask.equals(rightMask), false, `left/right frame ${clipFrame} has the same cropped alpha`);
    assert.equal(
      sameDimensions && leftMask.equals(mirrorAlphaMaskHorizontally(rightMask, rightBox.width, rightBox.height)),
      false,
      `left/right frame ${clipFrame} has mirrored cropped alpha`
    );
  }
});

// Break caught: the formal hit becomes a replacement body or recontainment shrinks to disappearance.
test("Gate 4 SCP-049 actions keep sparse hit feedback and collapse into an inactive contained remnant", async () => {
  const absolute = fileURLToPath(new URL("../public/assets/art/characters/scp-049-action-sheet.png", import.meta.url));
  const { width, pixels } = decodeRgbaPng(await readFile(absolute));
  const frames = [];
  const audits = [];

  for (let frameIndex = 0; frameIndex < 19; frameIndex += 1) {
    const frame = getEnemyFramePixels(pixels, width, 80, 96, frameIndex);
    const audit = auditScp049Frame(frame, 80, 96, `SCP-049 action frame ${frameIndex}`);
    assert.equal(audit.greenWithoutContainmentCyan, 0, `action frame ${frameIndex} non-cyan green/olive residue`);
    frames.push(frame);
    audits.push(audit);
  }

  assert.deepEqual(
    audits.map(({ containmentCyan }) => containmentCyan),
    [...Array(16).fill(0), 118, 91, 41],
    "cyan must exist only as the final external containment nodes"
  );
  for (let frameIndex = 16; frameIndex <= 18; frameIndex += 1) {
    const cyanRatio = audits[frameIndex].containmentCyan / audits[frameIndex].visiblePixels;
    assert.ok(cyanRatio >= 0.01 && cyanRatio <= 0.08, `recontain frame ${frameIndex} cyan ratio`);
  }

  const minimumFrenzyLoopArea = Math.min(...audits.slice(5, 9).map(({ visiblePixels }) => visiblePixels));
  for (let frameIndex = 9; frameIndex <= 10; frameIndex += 1) {
    const audit = audits[frameIndex];
    const occupancy = audit.visiblePixels / (80 * 96);
    assert.ok(occupancy >= 0.14 && occupancy <= 0.18, `hit-overlay frame ${frameIndex} occupancy`);
    assert.ok(audit.visiblePixels / minimumFrenzyLoopArea <= 0.35, `hit-overlay frame ${frameIndex} must stay local`);
    assert.ok(audit.bbox.height >= 90, `hit-overlay frame ${frameIndex} keeps full-height registration`);
    const components = getOpaqueComponentMetrics(frames[frameIndex], 80, 96)
      .sort((first, second) => second.size - first.size);
    assert.ok(components.length >= 2, `hit-overlay frame ${frameIndex} needs two registered fragments`);
    assert.ok(components[0].size / audit.visiblePixels < 0.70, `hit-overlay frame ${frameIndex} became one body`);
    assert.ok(components[1].size / audit.visiblePixels >= 0.25, `hit-overlay frame ${frameIndex} lost its lower fragment`);
    const [upper, lower] = components.slice(0, 2).sort((first, second) => first.minY - second.minY);
    assert.ok(lower.minY - upper.maxY - 1 >= 28, `hit-overlay frame ${frameIndex} fragments are not separated`);
  }

  for (let frameIndex = 12; frameIndex <= 15; frameIndex += 1) {
    assert.ok(audits[frameIndex].visiblePixels < audits[frameIndex - 1].visiblePixels, `collapse frame ${frameIndex} must lose tension`);
  }
  for (let frameIndex = 17; frameIndex <= 18; frameIndex += 1) {
    assert.ok(audits[frameIndex].visiblePixels < audits[frameIndex - 1].visiblePixels, `containment frame ${frameIndex} must tighten`);
  }

  const loopAverageArea = audits.slice(5, 9)
    .reduce((total, { visiblePixels }) => total + visiblePixels, 0) / 4;
  const loopHeight = Math.max(...audits.slice(5, 9).map(({ height }) => height));
  const finalRemnant = audits[18];
  assert.ok(finalRemnant.visiblePixels / loopAverageArea >= 0.25 && finalRemnant.visiblePixels / loopAverageArea <= 0.35);
  assert.ok(finalRemnant.height / loopHeight >= 0.35 && finalRemnant.height / loopHeight <= 0.45);
  assert.equal(finalRemnant.visiblePixels / audits[11].visiblePixels >= 0.50, true, "final remnant must not shrink away");
  assert.equal(finalRemnant.activeWineRed, 0, "final remnant must be inactive");
  assert.equal(finalRemnant.bottomY, 94, "final remnant must remain grounded inside the frame");
});

// Break caught: the Pulse Sac aperture visibly relights after the death clip has already extinguished.
test("Gate 3 Pulse Sac death dims once and stays cyan-free after global frame 9", async () => {
  const absolute = fileURLToPath(new URL("../public/assets/art/enemies/r17-pulse-sac-action-sheet.png", import.meta.url));
  const { width, pixels } = decodeRgbaPng(await readFile(absolute));
  const saturatedCyanTealByFrame = [];

  for (let frameIndex = 8; frameIndex <= 13; frameIndex += 1) {
    const frame = getEnemyFramePixels(pixels, width, 48, 48, frameIndex);
    let saturatedCyanTealPixels = 0;
    for (let offset = 0; offset < frame.length; offset += 4) {
      if (frame[offset + 3] === 0) continue;
      const red = frame[offset];
      const green = frame[offset + 1];
      const blue = frame[offset + 2];
      if (
        red <= 100
        && green >= 100
        && blue >= 100
        && green - red >= 30
        && blue - red >= 30
        && Math.abs(green - blue) <= 24
      ) {
        saturatedCyanTealPixels += 1;
      }
    }
    saturatedCyanTealByFrame.push(saturatedCyanTealPixels);
  }

  assert.deepEqual(
    saturatedCyanTealByFrame,
    [20, 1, 0, 0, 0, 0],
    "Pulse Sac death must visibly dim once, extinguish, and never relight"
  );
});

// Break caught: a partial production admission leaves one promoted sheet outside the immutable production Set.
test("production sheet admission remains an immutable exact-nine transaction", () => {
  assert.equal(PRODUCTION_SPRITESHEET_KEYS instanceof Set, true);
  assert.deepEqual([...PRODUCTION_SPRITESHEET_KEYS], SPRITESHEET_ASSETS.map(({ key }) => key));
  assert.throws(() => PRODUCTION_SPRITESHEET_KEYS.add("r17-drifter-action-sheet"), /immutable/i);
  assert.throws(() => PRODUCTION_SPRITESHEET_KEYS.delete("player-opening-sheet"), /immutable/i);
  assert.throws(() => PRODUCTION_SPRITESHEET_KEYS.clear(), /immutable/i);
  assert.throws(() => Set.prototype.add.call(PRODUCTION_SPRITESHEET_KEYS, "bypass"), TypeError);
  assert.throws(() => Set.prototype.delete.call(PRODUCTION_SPRITESHEET_KEYS, "player-opening-sheet"), TypeError);
  assert.throws(() => Set.prototype.clear.call(PRODUCTION_SPRITESHEET_KEYS), TypeError);

  const contentsBeforeForEach = [...PRODUCTION_SPRITESHEET_KEYS];
  const callbackThis = { label: "production-sheet-forEach-this" };
  const shadowedCallObservations = [];
  function observeWithShadowedCall(value, key, owner) {
    shadowedCallObservations.push({
      ownerIsExportedSet: owner === PRODUCTION_SPRITESHEET_KEYS,
      preservedThisArg: this === callbackThis,
      valueEqualsKey: value === key
    });
  }
  observeWithShadowedCall.call = null;
  let shadowedCallError = null;
  try {
    PRODUCTION_SPRITESHEET_KEYS.forEach(observeWithShadowedCall, callbackThis);
  } catch (error) {
    shadowedCallError = error?.constructor?.name ?? "unknown";
  }
  const shadowedCallContract = {
    shadowedCallError,
    invocationCount: shadowedCallObservations.length,
    observationsAreNative: shadowedCallObservations.every((observation) =>
      Object.values(observation).every(Boolean)
    )
  };

  const observedPairs = [];
  let callbackOwner = null;
  let preservedThisArg = true;
  PRODUCTION_SPRITESHEET_KEYS.forEach(function observeProductionKey(value, key, owner) {
    observedPairs.push([value, key]);
    callbackOwner = owner;
    preservedThisArg &&= this === callbackThis;
  }, callbackThis);
  const mutationResults = [
    ["add", ["__forEach_leak_probe__"]],
    ["delete", ["player-opening-sheet"]],
    ["clear", []]
  ].map(([method, args]) => {
    try {
      callbackOwner[method](...args);
      return "returned";
    } catch (error) {
      return error?.constructor?.name ?? "unknown";
    }
  });
  assert.deepEqual({
    callbackOwnerIsExportedSet: callbackOwner === PRODUCTION_SPRITESHEET_KEYS,
    preservedThisArg,
    valuesEqualKeys: observedPairs.every(([value, key]) => value === key),
    mutationResults,
    contentsAfterForEach: [...PRODUCTION_SPRITESHEET_KEYS]
  }, {
    callbackOwnerIsExportedSet: true,
    preservedThisArg: true,
    valuesEqualKeys: true,
    mutationResults: ["TypeError", "TypeError", "TypeError"],
    contentsAfterForEach: contentsBeforeForEach
  });
  assert.throws(() => PRODUCTION_SPRITESHEET_KEYS.forEach(null), TypeError);
  const callbackSentinel = new Error("immutable Set forEach callback sentinel");
  assert.throws(
    () => PRODUCTION_SPRITESHEET_KEYS.forEach(() => {
      throw callbackSentinel;
    }),
    (error) => error === callbackSentinel
  );
  assert.equal(PRODUCTION_SPRITESHEET_KEYS.forEach(() => {}), undefined);

  const valueOfResult = PRODUCTION_SPRITESHEET_KEYS.valueOf();
  const contentsBeforeValueOfMutations = [...PRODUCTION_SPRITESHEET_KEYS];
  const valueOfMutationResults = [];
  for (const [method, args] of [
    ["add", ["__valueOf_leak_probe__"]],
    ["delete", [contentsBeforeValueOfMutations[0]]],
    ["clear", []]
  ]) {
    try {
      valueOfResult[method](...args);
      valueOfMutationResults.push("returned");
    } catch (error) {
      valueOfMutationResults.push(error?.constructor?.name ?? "unknown");
    }
  }
  if (valueOfResult !== PRODUCTION_SPRITESHEET_KEYS) {
    valueOfResult.clear();
    contentsBeforeValueOfMutations.forEach((key) => valueOfResult.add(key));
  }
  assert.deepEqual({
    shadowedCallContract,
    valueOfReturnsExportedSet: valueOfResult === PRODUCTION_SPRITESHEET_KEYS,
    mutationResults: valueOfMutationResults,
    contentsAfterValueOf: [...PRODUCTION_SPRITESHEET_KEYS]
  }, {
    shadowedCallContract: {
      shadowedCallError: null,
      invocationCount: contentsBeforeForEach.length,
      observationsAreNative: true
    },
    valueOfReturnsExportedSet: true,
    mutationResults: ["TypeError", "TypeError", "TypeError"],
    contentsAfterValueOf: contentsBeforeValueOfMutations
  });

  const candidateKeys = enemyBossCandidateSheets.map(({ key }) => key);
  const currentlyAdmitted = candidateKeys.filter((key) => PRODUCTION_SPRITESHEET_KEYS.has(key));
  assert.deepEqual(currentlyAdmitted, candidateKeys);
  assert.equal(
    DEVELOPMENT_SPRITESHEET_ASSETS.some(({ key }) => candidateKeys.includes(key)),
    false,
    "no admitted sheet may remain in the development contract"
  );
  assert.notEqual(candidateKeys.slice(0, 8).length, currentlyAdmitted.length);
});

// Break caught: Gate 5 governance loses its complete prompt ledger map or exact admitted-set registration.
test("asset register keeps the complete P74 through P84 map and authoritative Gate 5 admission", async () => {
  const register = await readFile(new URL("../docs/art/asset-register.md", import.meta.url), "utf8");
  const promptIds = [...register.matchAll(/^### P(\d+)\b/gm)].map(([, id]) => Number(id));
  assert.deepEqual(promptIds.filter((id) => id >= 74 && id <= 84), [
    74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84
  ]);
  for (const { key } of enemyBossCandidateSheets) {
    const registerAsset = key.replace(/^enemy-scp049/, "scp-049");
    assert.match(
      register,
      new RegExp(`\\| ${registerAsset} \\|[^\\n]*production admitted after Gates 1–4; Gate 5 integrated acceptance pending \\|`)
    );
  }
});

test("legacy fallback texture keys remain exact and disjoint from R-17 production keys", () => {
  assert.deepEqual(
    Object.fromEntries(Object.keys(legacyFallbackTextureKeys).map((property) => [property, TEXTURES[property]])),
    legacyFallbackTextureKeys
  );

  const legacyValues = new Set(Object.values(legacyFallbackTextureKeys));
  const r17Values = new Set(Object.values(r17TextureKeys));
  assert.equal(legacyValues.size, Object.keys(legacyFallbackTextureKeys).length);
  assert.equal(r17Values.size, 7);
  assert.deepEqual([...legacyValues].filter((key) => r17Values.has(key)), []);
});

test("production manifest contract rejects duplicate texture keys", () => {
  const approvedAssets = [...expectedImageAssetPaths].map(([key, path]) => ({ key, path }));
  const duplicateAssets = approvedAssets.map((asset, index) =>
    index === 1 ? { ...asset, key: approvedAssets[0].key } : asset
  );

  assert.throws(
    () => assertApprovedStaticImageAssets(duplicateAssets),
    /duplicate texture keys detected/
  );
});

test("production PNGs exist at their exact approved dimensions", async () => {
  for (const [key, path] of expectedImageAssetPaths) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    assert.deepEqual(readPngSize(await readFile(absolute)), expected.get(key), key);
  }
});

test("production PNGs use a limited hard-edged RGBA palette", async () => {
  for (const [key, path] of expectedImageAssetPaths) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));
    const colors = new Set();
    const alphaValues = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      alphaValues.add(alpha);
      if (alpha > 0) {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.ok(colors.size <= 32, `${key} exceeds the 32-color production palette`);
    assert.ok([...alphaValues].every((alpha) => alpha === 0 || alpha === 255), `${key} has soft alpha`);

    if (["facility-floor", "facility-service-floor", "facility-hazard-stripe"].includes(key)) {
      assert.deepEqual(alphaValues, new Set([255]), `${key} must be fully opaque`);
      const pixel = (x, y) => pixels.subarray((y * width + x) * 4, (y * width + x + 1) * 4);
      for (let y = 0; y < height; y += 1) assert.deepEqual(pixel(0, y), pixel(width - 1, y));
      for (let x = 0; x < width; x += 1) assert.deepEqual(pixel(x, 0), pixel(x, height - 1));
    }

    if (["facility-observation-window", "facility-pipe-bank"].includes(key)) {
      assert.deepEqual(alphaValues, new Set([0, 255]), `${key} must contain binary transparency`);
    }
  }
});

test("contact-shadow is a transparent hard-edged grayscale 32 by 16 oval with an exact fallback key", async () => {
  assert.equal(TEXTURES.contactShadow, "contact-shadow");
  const asset = IMAGE_ASSETS.find(({ key }) => key === TEXTURES.contactShadow);
  assert.deepEqual(asset, { key: "contact-shadow", path: "assets/art/effects/contact-shadow.png" });
  const fallbackSource = await readFile(new URL("../src/assets/fallbackTextureFactory.js", import.meta.url), "utf8");
  assert.match(fallbackSource, /ensureTexture\(scene, TEXTURES\.contactShadow/);
  assert.match(fallbackSource, /generateTexture\(TEXTURES\.contactShadow, 32, 16\)/);

  const absolute = fileURLToPath(new URL("../public/assets/art/effects/contact-shadow.png", import.meta.url));
  const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));
  assert.deepEqual([width, height], [32, 16]);
  const alpha = new Set();
  const opaqueRows = [];
  for (let y = 0; y < height; y += 1) {
    let minX = width;
    let maxX = -1;
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      alpha.add(pixels[offset + 3]);
      if (pixels[offset + 3] === 0) continue;
      assert.ok(Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) - Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) <= 8, "shadow must stay grayscale");
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
    if (maxX >= minX) opaqueRows.push({ y, width: maxX - minX + 1 });
  }
  assert.deepEqual(alpha, new Set([0, 255]), "contact shadow must use binary alpha");
  assert.ok(opaqueRows.length >= 4, "contact shadow must have a visible hard-edged oval");
  assert.ok(Math.max(...opaqueRows.map(({ width }) => width)) >= 2 * opaqueRows.length, "contact shadow must remain horizontally elongated");
});

test("upgrade icons and terminal surfaces preserve their frozen transparent pixel contracts", async () => {
  for (const { key, path } of upgradeIconAssets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));
    assert.deepEqual([width, height], [32, 32], key);
    const alphaValues = new Set();
    const colors = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      alphaValues.add(alpha);
      if (alpha === 0) {
        assert.deepEqual([...pixels.subarray(offset, offset + 3)], [0, 0, 0], `${key} has transparent RGB residue`);
      } else {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.deepEqual(alphaValues, new Set([0, 255]), `${key} must use binary transparency`);
    assert.ok(colors.size <= 32, `${key} exceeds the 32-color icon palette`);
  }

  for (const { key, path, size } of terminalSurfaceAssets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));
    assert.deepEqual([width, height], size, key);
    const alphaValues = new Set();
    const colors = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      alphaValues.add(alpha);
      if (alpha === 0) {
        assert.deepEqual([...pixels.subarray(offset, offset + 3)], [0, 0, 0], `${key} has transparent RGB residue`);
      } else {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.deepEqual(alphaValues, new Set([0, 255]), `${key} must use binary transparency`);
    assert.ok(colors.size <= 16, `${key} exceeds the 16-color terminal palette`);
  }
});

test("weapon-tone upgrade icons use amber accents without cyan or mutation accents", async () => {
  for (const { upgradeKey, key, path } of weaponToneUpgradeAssets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    const { pixels } = decodeRgbaPng(await readFile(absolute));
    let amberPixels = 0;
    let cyanPixels = 0;
    let purplePixels = 0;

    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] === 0) continue;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      if (red >= 120 && red >= green + 15 && green >= blue + 15) amberPixels += 1;
      if (green >= 150 && blue >= 150 && green >= red + 40 && blue >= red + 40) cyanPixels += 1;
      if (red >= 120 && blue >= 120 && red >= green + 40 && blue >= green + 40) purplePixels += 1;
    }

    assert.ok(amberPixels >= 8, `${key} (${upgradeKey}) must contain a clear R>G>B amber accent`);
    assert.equal(cyanPixels, 0, `${key} (${upgradeKey}) must not contain standard-tone cyan accents`);
    assert.equal(purplePixels, 0, `${key} (${upgradeKey}) must not contain mutation-tone purple accents`);
  }
});

test("facility room module PNGs match their frozen alpha and seam contracts", async () => {
  for (const { key, path, size, alpha, seamWrap } of facilityRoomModuleAssets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));
    assert.deepEqual([width, height], size, key);

    const colors = new Set();
    const alphaValues = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const currentAlpha = pixels[offset + 3];
      alphaValues.add(currentAlpha);
      if (currentAlpha === 0) {
        assert.deepEqual([...pixels.subarray(offset, offset + 3)], [0, 0, 0], `${key} has chroma-key residue`);
      } else {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.ok(colors.size <= 32, `${key} exceeds the 32-color production palette`);
    assert.deepEqual(alphaValues, alpha === "opaque" ? new Set([255]) : new Set([0, 255]), `${key} alpha contract`);

    if (seamWrap) {
      const pixel = (x, y) => pixels.subarray((y * width + x) * 4, (y * width + x + 1) * 4);
      for (let y = 0; y < height; y += 1) assert.deepEqual(pixel(0, y), pixel(width - 1, y), `${key} horizontal seam at ${y}`);
      for (let x = 0; x < width; x += 1) assert.deepEqual(pixel(x, 0), pixel(x, height - 1), `${key} vertical seam at ${x}`);
    }
  }
});

function classifyR17FamilyMaterial(red, green, blue) {
  const channelMaximum = Math.max(red, green, blue);
  const channelMinimum = Math.min(red, green, blue);
  const channelSpread = channelMaximum - channelMinimum;

  if (green >= 180 && blue >= 180 && green - red >= 45 && blue - red >= 45 && Math.abs(green - blue) <= 30) {
    return "cyan";
  }
  if (channelMinimum >= 175 && channelMaximum <= 240 && channelSpread <= 30) {
    return "steel";
  }
  if (red >= 90 && red - green >= 45 && red - blue >= 40) {
    return "red";
  }
  if (channelMaximum <= 72 && channelSpread <= 24) {
    return "charcoal";
  }
  return "other";
}

function getLargestUpperSteelComponent(materials, frameWidth, frameHeight, upperRegionMaxY) {
  const visited = new Uint8Array(materials.length);
  let largestComponent = 0;

  for (let start = 0; start < materials.length; start += 1) {
    const startY = Math.floor(start / frameWidth);
    if (visited[start] || materials[start] !== "steel" || startY > upperRegionMaxY) continue;
    const pending = [start];
    visited[start] = 1;
    let size = 0;

    while (pending.length > 0) {
      const index = pending.pop();
      size += 1;
      const x = index % frameWidth;
      const y = Math.floor(index / frameWidth);
      for (let nextY = y - 1; nextY <= y + 1; nextY += 1) {
        for (let nextX = x - 1; nextX <= x + 1; nextX += 1) {
          if (nextX === x && nextY === y) continue;
          if (nextX < 0 || nextX >= frameWidth || nextY < 0 || nextY >= frameHeight || nextY > upperRegionMaxY) continue;
          const next = nextY * frameWidth + nextX;
          if (visited[next] || materials[next] !== "steel") continue;
          visited[next] = 1;
          pending.push(next);
        }
      }
    }
    largestComponent = Math.max(largestComponent, size);
  }
  return largestComponent;
}

function validateR17BudFrame(framePixels, frameWidth = 32, frameHeight = 32) {
  const opaqueColors = new Set();
  const materials = Array(frameWidth * frameHeight).fill(null);
  const counts = { charcoal: 0, red: 0, steel: 0, cyan: 0, other: 0 };
  let visiblePixels = 0;
  let minY = frameHeight;
  let maxY = -1;

  for (let offset = 0; offset < framePixels.length; offset += 4) {
    if (framePixels[offset + 3] !== 255) continue;
    const pixelIndex = offset / 4;
    const red = framePixels[offset];
    const green = framePixels[offset + 1];
    const blue = framePixels[offset + 2];
    const material = classifyR17FamilyMaterial(red, green, blue);
    const y = Math.floor(pixelIndex / frameWidth);
    visiblePixels += 1;
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    opaqueColors.add(`${red},${green},${blue}`);
    materials[pixelIndex] = material;
    counts[material] += 1;
  }

  const errors = [];
  if (visiblePixels === 0) return { valid: false, errors: ["frame is empty"], counts, visiblePixels };
  const upperRegionMaxY = minY + Math.floor((maxY - minY) * 0.4);
  const steelTagComponentSize = getLargestUpperSteelComponent(materials, frameWidth, frameHeight, upperRegionMaxY);
  if (opaqueColors.size < 4) errors.push("fewer than four opaque colors");
  if (counts.charcoal / visiblePixels < 0.70) errors.push("charcoal organic body is below 70% of visible pixels");
  if (counts.red < 2) errors.push("red tissue seams are absent");
  if (steelTagComponentSize < 2 || steelTagComponentSize > 8) errors.push("small connected bright steel tag is absent from the upper region");
  if (counts.cyan < 1) errors.push("cyan core is absent");
  if (counts.cyan / visiblePixels > 0.12) errors.push("cyan core exceeds 12% of visible pixels");
  return {
    valid: errors.length === 0,
    errors,
    counts,
    visiblePixels,
    charcoalRatio: counts.charcoal / visiblePixels,
    cyanRatio: counts.cyan / visiblePixels,
    upperRegionMaxY,
    steelTagComponentSize
  };
}

test("R-17 bud semantic validator rejects dark red tissue and generic gray as charcoal and steel", () => {
  const fakeFrame = Buffer.alloc(32 * 32 * 4);
  const fakePalette = [
    ...Array(90).fill([128, 50, 58, 255]),
    ...Array(3).fill([112, 40, 48, 255]),
    ...Array(2).fill([120, 120, 120, 255]),
    ...Array(5).fill([151, 238, 238, 255])
  ];
  fakePalette.forEach((color, index) => {
    const x = 11 + (index % 10);
    const y = 11 + Math.floor(index / 10);
    fakeFrame.set(color, (y * 32 + x) * 4);
  });

  const validation = validateR17BudFrame(fakeFrame);
  assert.equal(classifyR17FamilyMaterial(128, 50, 58), "red");
  assert.equal(classifyR17FamilyMaterial(120, 120, 120), "other");
  assert.deepEqual(validation.counts, { charcoal: 0, red: 93, steel: 0, cyan: 5, other: 2 });
  assert.equal(validation.valid, false, "93% dark red plus generic lower gray must not satisfy charcoal-body and upper steel-tag semantics");
  assert.ok(validation.errors.some((message) => message.includes("charcoal organic body")));
  assert.ok(validation.errors.some((message) => message.includes("bright steel tag")));
});

test("R-17 bud retains dominant dark tissue, red seams, a steel tag and a tiny cyan core", async () => {
  const absolute = fileURLToPath(new URL("../public/assets/art/enemies/r17-bud.png", import.meta.url));
  const { width, pixels } = decodeRgbaPng(await readFile(absolute));

  for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
    const frame = getEnemyFramePixels(pixels, width, 32, 32, frameIndex);
    const validation = validateR17BudFrame(frame);
    assert.deepEqual(validation.errors, [], `r17-bud frame ${frameIndex}: ${validation.errors.join("; ")}`);
  }
});

function validateR17RiftFrame(framePixels) {
  const counts = { charcoal: 0, red: 0, steel: 0, cyan: 0, other: 0 };
  let visiblePixels = 0;

  for (let offset = 0; offset < framePixels.length; offset += 4) {
    if (framePixels[offset + 3] !== 255) continue;
    const material = classifyR17FamilyMaterial(
      framePixels[offset],
      framePixels[offset + 1],
      framePixels[offset + 2]
    );
    counts[material] += 1;
    visiblePixels += 1;
  }

  const errors = [];
  if (visiblePixels === 0) return { valid: false, errors: ["frame is empty"], counts, visiblePixels };
  if (counts.charcoal / visiblePixels < 0.35) errors.push("charcoal tissue is below 35% of visible pixels");
  if (counts.red < 2) errors.push("red tissue is not readable");
  if (counts.steel < 2) errors.push("light-steel containment hardware is not readable");
  if (counts.cyan < 1) errors.push("cyan core is absent");
  if (counts.cyan / visiblePixels > 0.12) errors.push("cyan core exceeds 12% of visible pixels");
  return {
    valid: errors.length === 0,
    errors,
    counts,
    visiblePixels,
    charcoalRatio: counts.charcoal / visiblePixels,
    cyanRatio: counts.cyan / visiblePixels
  };
}

test("R-17 family material classifier keeps the production palette mutually exclusive", () => {
  assert.deepEqual([
    classifyR17FamilyMaterial(38, 36, 40),
    classifyR17FamilyMaterial(128, 50, 58),
    classifyR17FamilyMaterial(151, 238, 238),
    classifyR17FamilyMaterial(214, 205, 195),
    classifyR17FamilyMaterial(139, 112, 111)
  ], ["charcoal", "red", "cyan", "steel", "other"]);
});

test("R-17 rift-skimmer retains charcoal tissue, red tissue, steel hardware and a small cyan core", async () => {
  const absolute = fileURLToPath(new URL("../public/assets/art/enemies/r17-rift-skimmer.png", import.meta.url));
  const { width, pixels } = decodeRgbaPng(await readFile(absolute));

  for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
    const frame = getEnemyFramePixels(pixels, width, 48, 48, frameIndex);
    const validation = validateR17RiftFrame(frame);
    assert.deepEqual(validation.errors, [], `r17-rift-skimmer frame ${frameIndex}: ${validation.errors.join("; ")}`);
  }
});

test("R-17 production sheets pass the four-frame animation gate", async () => {
  for (const { key, path, size, frame: [frameWidth, frameHeight], visibleExtent } of approvedEnemySheets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    const buffer = await readFile(absolute);
    assert.deepEqual(readPngSize(buffer), size, key);
    const { width, height, pixels } = decodeRgbaPng(buffer);
    assert.equal(width / frameWidth, 4, `${key} must contain exactly four horizontal frames`);
    assert.equal(height, frameHeight, `${key} must contain exactly one frame row`);

    const frames = [];
    const metrics = [];
    for (let frameIndex = 0; frameIndex < 4; frameIndex += 1) {
      const frame = getEnemyFramePixels(pixels, width, frameWidth, frameHeight, frameIndex);
      const current = getEnemyFrameMetrics(frame, frameWidth, frameHeight);
      assert.ok(current.alphaValues.size <= 2 && [...current.alphaValues].every((alpha) => alpha === 0 || alpha === 255), `${key} frame ${frameIndex} has soft alpha`);
      assert.ok(current.colors.size <= 32, `${key} frame ${frameIndex} exceeds the 32-color production palette`);
      assert.ok(current.bbox.minX > 0 && current.bbox.minY > 0 && current.bbox.maxX < frameWidth - 1 && current.bbox.maxY < frameHeight - 1, `${key} frame ${frameIndex} touches the canvas edge`);
      assert.ok(getOpaqueComponentSizes(frame, frameWidth, frameHeight).every((componentSize) => componentSize >= 2), `${key} frame ${frameIndex} has a single-pixel component`);
      frames.push(frame);
      metrics.push(current);
    }

    const normalizedFrames = frames.map((frame, index) =>
      normalizeEnemyFrame(frame, frameWidth, frameHeight, metrics[index].bbox)
    );
    assert.equal(new Set(normalizedFrames.map((frame) => createHash("sha256").update(frame).digest("hex"))).size, 4, `${key} must have four translation-normalized unique frames`);

    const centersX = metrics.map(({ centerX }) => centerX);
    const centersY = metrics.map(({ centerY }) => centerY);
    const bottoms = metrics.map(({ bottomY }) => bottomY);
    const heights = metrics.map(({ height }) => height);
    const areas = metrics.map(({ visiblePixels }) => visiblePixels);
    assert.ok(Math.max(...centersX) - Math.min(...centersX) <= 2, `${key} drifts horizontally`);
    assert.ok(Math.max(...centersY) - Math.min(...centersY) <= 2, `${key} drifts vertically`);
    assert.ok(Math.max(...bottoms) - Math.min(...bottoms) <= 2, `${key} changes hover baseline`);
    assert.ok(Math.max(...heights) - Math.min(...heights) <= (frameHeight === 32 ? 3 : 4), `${key} changes visible height too much`);
    assert.ok(Math.max(...areas) / Math.min(...areas) <= 1.2, `${key} breathes by scaling`);
    assert.ok(metrics.every(({ bbox }) => Math.abs(Math.max(bbox.width, bbox.height) - visibleExtent) <= 1), `${key} visible extent is not normalized in the PNG`);

    for (let firstIndex = 0; firstIndex < 4; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < 4; secondIndex += 1) {
        const { changedPixelRatio, alphaShapeDifferenceRatio } = getEnemyPairDifference(
          normalizedFrames[firstIndex],
          normalizedFrames[secondIndex]
        );
        assert.ok(changedPixelRatio >= 0.03, `${key} frames ${firstIndex}<->${secondIndex} lack visible motion`);
        assert.ok(alphaShapeDifferenceRatio >= 0.015, `${key} frames ${firstIndex}<->${secondIndex} lack alpha silhouette motion`);
      }
    }
    for (const [firstIndex, secondIndex] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
      const { changedPixelRatio } = getEnemyPairDifference(normalizedFrames[firstIndex], normalizedFrames[secondIndex]);
      assert.ok(changedPixelRatio <= 0.65, `${key} frames ${firstIndex}->${secondIndex} break loop continuity`);
    }
  }
});

test("opening character sheets are exact RGBA 48-frame production assets", async () => {
  for (const { key, path, size } of approvedCharacterSheets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    const buffer = await readFile(absolute);
    assert.deepEqual(readPngSize(buffer), size, key);
    const { width, height, pixels } = decodeRgbaPng(buffer);
    assert.equal((width / 48) * (height / 48), 48, `${key} must contain 48 frames`);

    const colors = new Set();
    const alphaValues = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      alphaValues.add(alpha);
      if (alpha === 255) {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.ok(colors.size <= 32, `${key} exceeds the 32-color production palette`);
    assert.deepEqual(alphaValues, new Set([0, 255]), `${key} must use binary alpha with transparency`);

    for (let row = 0; row < 4; row += 1) {
      for (const [motion, start, end] of [
        ["idle", 0, 3],
        ["move", 4, 9],
        ["hit", 10, 11]
      ]) {
        const frames = [];
        for (let column = start; column <= end; column += 1) {
          frames.push(getFramePixels(pixels, width, row * 12 + column));
        }
        assert.equal(
          new Set(frames.map(getNormalizedFrameHash)).size,
          frames.length,
          `${key} ${motion} row ${row} must contain ${frames.length}/${frames.length} translation-normalized unique poses`
        );
        const footYs = frames.map(getVisibleFootY);
        assert.ok(footYs.every((value) => value >= 0), `${key} ${motion} row ${row} has an empty frame`);
        assert.ok(
          footYs.every((value) => value === 44),
          `${key} ${motion} row ${row} feet must remain at y=44`
        );
        assertMeaningfullyDifferentFramePairs(frames, `${key} ${motion} row ${row}`);
      }
    }
  }
});
