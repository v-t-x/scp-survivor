import Phaser from "phaser";
import { BALANCE } from "../config/balance.js";
import { TEXTURES } from "./manifest.js";

// Procedural fallback textures.
//
// This is the "no real art yet" path: every texture the game needs is drawn with
// Graphics.generateTexture. When real image assets are added to the manifest and
// loaded in PreloadScene, those keys will already exist, and each generator below
// is guarded by textures.exists(key) — so a real sprite is never overwritten and
// Phaser never warns about a duplicate texture key.
//
// Owned by the UI/art Agent. The drawing code is a verbatim move from the old
// world.js createPlaceholderTextures(); visuals are unchanged.

// Generate a single texture only when its key is not already registered.
function ensureTexture(scene, key, draw) {
  if (scene.textures.exists(key)) {
    return;
  }
  draw();
}

export function generateFallbackTextures(scene) {
  const graphics = scene.add.graphics();

  ensureTexture(scene, TEXTURES.titleFacilityBackdrop, () => {
    graphics.clear();
    graphics.fillStyle(0x151b24, 1);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(0x303b4b, 1);
    graphics.fillRect(480, 0, 480, 540);
    graphics.lineStyle(3, 0x596779, 1);
    for (let x = 480; x < 960; x += 64) graphics.lineBetween(x, 0, x, 540);
    for (let y = 0; y < 540; y += 64) graphics.lineBetween(480, y, 960, y);
    graphics.fillStyle(0x495363, 1);
    graphics.fillRect(585, 150, 230, 300);
    graphics.fillStyle(0x222a35, 1);
    graphics.fillRect(690, 150, 20, 300);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(602, 292, 196, 12);
    graphics.fillStyle(0x303b4b, 1);
    graphics.fillRect(830, 112, 112, 250);
    graphics.fillStyle(0x1b2430, 1);
    graphics.fillRect(846, 132, 80, 118);
    graphics.fillStyle(0x68d9bc, 1);
    graphics.fillRect(854, 142, 64, 42);
    graphics.fillStyle(0x788596, 1);
    graphics.fillRect(850, 274, 72, 34);
    graphics.generateTexture(TEXTURES.titleFacilityBackdrop, 960, 540);
  });

  ensureTexture(scene, TEXTURES.armoryRackBackdrop, () => {
    graphics.clear();
    graphics.fillStyle(0x070b10, 1);
    graphics.fillRect(0, 0, 960, 540);
    graphics.fillStyle(0x151d25, 1);
    graphics.fillRect(54, 74, 852, 392);
    graphics.fillStyle(0x27323d, 1);
    graphics.fillRect(72, 92, 816, 28);
    graphics.fillRect(72, 420, 816, 28);
    for (let index = 0; index < 3; index += 1) {
      const x = 102 + index * 270;
      graphics.fillStyle(0x0b1118, 1);
      graphics.fillRect(x, 126, 216, 288);
      graphics.lineStyle(index === 1 ? 3 : 2, index === 1 ? 0x8da6c2 : 0x53677d, 1);
      graphics.strokeRect(x, 126, 216, 288);
      graphics.fillStyle(index === 1 ? 0x6fd6b4 : 0xd2a34b, 1);
      graphics.fillRect(x + 92, 104, 32, 6);
    }
    graphics.lineStyle(6, 0x303b4b, 1);
    graphics.lineBetween(74, 62, 74, 478);
    graphics.lineBetween(886, 62, 886, 478);
    graphics.generateTexture(TEXTURES.armoryRackBackdrop, 960, 540);
  });

  ensureTexture(scene, TEXTURES.facilityFloor, () => {
    graphics.clear();
    graphics.fillStyle(0x151b24, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.lineStyle(1, 0x202a36, 1);
    graphics.strokeRect(0, 0, 31, 31);
    graphics.generateTexture(TEXTURES.facilityFloor, 32, 32);
  });

  ensureTexture(scene, TEXTURES.facilityWall, () => {
    graphics.clear();
    graphics.fillStyle(0x303b4b, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(3, 0x596779, 1);
    graphics.strokeRect(1, 1, 62, 62);
    graphics.generateTexture(TEXTURES.facilityWall, 64, 64);
  });

  ensureTexture(scene, TEXTURES.facilityDoor, () => {
    graphics.clear();
    graphics.fillStyle(0x495363, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x222a35, 1);
    graphics.fillRect(29, 0, 6, 64);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(8, 30, 48, 4);
    graphics.generateTexture(TEXTURES.facilityDoor, 64, 64);
  });

  ensureTexture(scene, TEXTURES.facilityConsole, () => {
    graphics.clear();
    graphics.fillStyle(0x303b4b, 1);
    graphics.fillRect(0, 0, 64, 64);
    graphics.fillStyle(0x1b2430, 1);
    graphics.fillRect(8, 8, 48, 30);
    graphics.fillStyle(0x68d9bc, 1);
    graphics.fillRect(13, 13, 38, 12);
    graphics.fillStyle(0x788596, 1);
    graphics.fillRect(12, 46, 40, 10);
    graphics.generateTexture(TEXTURES.facilityConsole, 64, 64);
  });

  ensureTexture(scene, TEXTURES.facilityVent, () => {
    graphics.clear();
    graphics.fillStyle(0x3d4857, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.lineStyle(2, 0x151b24, 1);
    for (let y = 5; y < 32; y += 6) {
      graphics.lineBetween(4, y, 28, y);
    }
    graphics.generateTexture(TEXTURES.facilityVent, 32, 32);
  });

  ensureTexture(scene, TEXTURES.facilityDecal, () => {
    graphics.clear();
    graphics.fillStyle(0x812f35, 0.7);
    graphics.fillCircle(16, 16, 12);
    graphics.fillStyle(0x411b22, 0.9);
    graphics.fillCircle(13, 14, 5);
    graphics.fillCircle(20, 20, 4);
    graphics.generateTexture(TEXTURES.facilityDecal, 32, 32);
  });

  ensureTexture(scene, TEXTURES.facilityServiceFloor, () => {
    graphics.clear();
    graphics.fillStyle(0x202a36, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x35475a, 1);
    graphics.fillRect(0, 5, 32, 7);
    graphics.fillRect(0, 20, 32, 7);
    graphics.lineStyle(1, 0x596779, 1);
    graphics.lineBetween(0, 0, 31, 0);
    graphics.lineBetween(0, 31, 31, 31);
    graphics.generateTexture(TEXTURES.facilityServiceFloor, 32, 32);
  });

  ensureTexture(scene, TEXTURES.facilityHazardStripe, () => {
    graphics.clear();
    graphics.fillStyle(0x242930, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0xb27d2e, 1);
    for (let y = -24; y < 32; y += 16) {
      graphics.fillTriangle(0, y + 8, 0, y + 16, 32, y - 16);
      graphics.fillTriangle(0, y + 16, 32, y - 16, 32, y - 8);
    }
    graphics.generateTexture(TEXTURES.facilityHazardStripe, 32, 32);
  });

  ensureTexture(scene, TEXTURES.facilityObservationWindow, () => {
    graphics.clear();
    graphics.fillStyle(0x303b4b, 1);
    graphics.fillRect(2, 7, 92, 50);
    graphics.fillStyle(0x071424, 1);
    graphics.fillRect(10, 14, 76, 34);
    graphics.lineStyle(2, 0x788596, 1);
    graphics.strokeRect(2, 7, 91, 49);
    graphics.fillStyle(0x68d9bc, 1);
    graphics.fillRect(6, 27, 3, 8);
    graphics.fillRect(87, 27, 3, 8);
    graphics.generateTexture(TEXTURES.facilityObservationWindow, 96, 64);
  });

  ensureTexture(scene, TEXTURES.facilityPipeBank, () => {
    graphics.clear();
    graphics.fillStyle(0x222a35, 1);
    graphics.fillRect(3, 7, 90, 50);
    for (const y of [16, 31, 46]) {
      graphics.fillStyle(0x667585, 1);
      graphics.fillRect(7, y - 4, 82, 8);
      graphics.fillStyle(0xaeb9c2, 1);
      graphics.fillRect(9, y - 3, 78, 2);
    }
    graphics.fillStyle(0xb27d2e, 1);
    graphics.fillRect(44, 26, 8, 10);
    graphics.generateTexture(TEXTURES.facilityPipeBank, 96, 64);
  });

  ensureTexture(scene, TEXTURES.facilityCombatFloor, () => {
    graphics.clear();
    graphics.fillStyle(0x18212c, 1);
    graphics.fillRect(0, 0, 128, 128);
    graphics.lineStyle(1, 0x2d3a49, 1);
    for (let x = 0; x <= 128; x += 16) graphics.lineBetween(x, 0, x, 128);
    for (let y = 0; y <= 128; y += 16) graphics.lineBetween(0, y, 128, y);
    graphics.fillStyle(0x22303e, 1);
    graphics.fillRect(16, 16, 8, 8);
    graphics.fillRect(96, 80, 8, 8);
    graphics.generateTexture(TEXTURES.facilityCombatFloor, 128, 128);
  });

  ensureTexture(scene, TEXTURES.facilityEntryThreshold, () => {
    graphics.clear();
    graphics.fillStyle(0x222b35, 1);
    graphics.fillRect(0, 0, 128, 64);
    graphics.fillStyle(0x111820, 1);
    graphics.fillRect(0, 20, 128, 24);
    graphics.fillStyle(0x9d772c, 1);
    for (let x = -16; x < 128; x += 32) {
      graphics.fillTriangle(x, 44, x + 12, 44, x + 28, 20);
    }
    graphics.lineStyle(2, 0x596779, 1);
    graphics.strokeRect(1, 1, 126, 62);
    graphics.generateTexture(TEXTURES.facilityEntryThreshold, 128, 64);
  });

  ensureTexture(scene, TEXTURES.facilityMaintenanceDeck, () => {
    graphics.clear();
    graphics.fillStyle(0x202b37, 1);
    graphics.fillRect(0, 0, 128, 128);
    graphics.fillStyle(0x151d26, 1);
    graphics.fillRect(0, 16, 128, 12);
    graphics.fillRect(0, 84, 128, 12);
    graphics.fillStyle(0x4d6073, 1);
    graphics.fillRect(0, 20, 128, 2);
    graphics.fillRect(0, 88, 128, 2);
    graphics.lineStyle(2, 0x435668, 1);
    graphics.strokeRect(40, 40, 48, 32);
    graphics.fillStyle(0x6f7e8c, 1);
    graphics.fillRect(46, 48, 36, 3);
    graphics.fillRect(46, 61, 36, 3);
    graphics.generateTexture(TEXTURES.facilityMaintenanceDeck, 128, 128);
  });

  ensureTexture(scene, TEXTURES.facilityWallBank, () => {
    graphics.clear();
    graphics.fillStyle(0x25313d, 1);
    graphics.fillRect(6, 12, 116, 42);
    graphics.fillStyle(0x121922, 1);
    graphics.fillRect(14, 20, 100, 26);
    graphics.fillStyle(0x647486, 1);
    graphics.fillRect(18, 24, 88, 4);
    graphics.fillRect(18, 38, 88, 4);
    graphics.fillStyle(0xb27d2e, 1);
    graphics.fillRect(62, 28, 8, 10);
    graphics.fillStyle(0x7ed5d6, 1);
    graphics.fillRect(24, 31, 5, 5);
    graphics.fillRect(98, 31, 5, 5);
    graphics.generateTexture(TEXTURES.facilityWallBank, 128, 64);
  });

  ensureTexture(scene, TEXTURES.facilityPowerJunction, () => {
    graphics.clear();
    graphics.fillStyle(0x27323d, 1);
    graphics.fillRect(18, 18, 60, 60);
    graphics.fillStyle(0x101720, 1);
    graphics.fillRect(26, 26, 44, 44);
    graphics.lineStyle(4, 0x6a7988, 1);
    graphics.lineBetween(0, 24, 24, 36);
    graphics.lineBetween(72, 58, 96, 70);
    graphics.fillStyle(0xc58f32, 1);
    graphics.fillRect(42, 34, 20, 6);
    graphics.fillStyle(0x78d9d6, 1);
    graphics.fillCircle(52, 54, 7);
    graphics.generateTexture(TEXTURES.facilityPowerJunction, 96, 96);
  });

  ensureTexture(scene, TEXTURES.facilityContaminationTrail, () => {
    graphics.clear();
    graphics.fillStyle(0x522838, 1);
    graphics.fillCircle(34, 34, 15);
    graphics.fillCircle(20, 42, 8);
    graphics.fillCircle(48, 24, 7);
    graphics.fillStyle(0x2c1729, 1);
    graphics.fillCircle(30, 30, 7);
    graphics.fillCircle(43, 37, 5);
    graphics.fillRect(12, 47, 12, 4);
    graphics.fillRect(46, 18, 8, 3);
    graphics.generateTexture(TEXTURES.facilityContaminationTrail, 64, 64);
  });

  ensureTexture(scene, TEXTURES.weaponPistolIcon, () => {
    graphics.clear();
    graphics.fillStyle(0x202832, 1);
    graphics.fillRect(15, 36, 57, 18);
    graphics.fillRect(23, 30, 37, 8);
    graphics.fillRect(45, 51, 15, 26);
    graphics.fillStyle(0x667585, 1);
    graphics.fillRect(20, 39, 43, 5);
    graphics.fillRect(50, 56, 6, 18);
    graphics.fillStyle(0xd6dde4, 1);
    graphics.fillRect(26, 33, 21, 3);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(59, 44, 5, 5);
    graphics.generateTexture(TEXTURES.weaponPistolIcon, 96, 96);
  });

  ensureTexture(scene, TEXTURES.weaponBreacherIcon, () => {
    graphics.clear();
    graphics.fillStyle(0x1c242d, 1);
    graphics.fillRect(8, 41, 73, 16);
    graphics.fillRect(21, 57, 23, 12);
    graphics.fillRect(11, 54, 15, 11);
    graphics.fillStyle(0x697887, 1);
    graphics.fillRect(14, 44, 63, 5);
    graphics.fillRect(42, 51, 24, 8);
    graphics.fillStyle(0xcbd5de, 1);
    graphics.fillRect(68, 42, 14, 12);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(33, 45, 5, 5);
    graphics.generateTexture(TEXTURES.weaponBreacherIcon, 96, 96);
  });

  ensureTexture(scene, TEXTURES.weaponTeslaIcon, () => {
    graphics.clear();
    graphics.fillStyle(0x202832, 1);
    graphics.fillRect(23, 39, 46, 21);
    graphics.fillRect(38, 59, 16, 21);
    graphics.fillStyle(0x70808f, 1);
    graphics.fillRect(29, 44, 34, 6);
    graphics.fillRect(42, 63, 6, 12);
    graphics.lineStyle(5, 0xc18443, 1);
    graphics.strokeCircle(32, 50, 14);
    graphics.strokeCircle(60, 50, 14);
    graphics.fillStyle(0x77d8e8, 1);
    graphics.fillRect(27, 47, 8, 6);
    graphics.fillRect(57, 47, 8, 6);
    graphics.fillRect(68, 47, 9, 5);
    graphics.generateTexture(TEXTURES.weaponTeslaIcon, 96, 96);
  });

  // Upgrade and terminal fallbacks are intentionally simple glyphs. Formal PNGs
  // from the manifest take precedence because ensureTexture never overwrites a key.
  ensureTexture(scene, TEXTURES.upgradeDamage, () => {
    graphics.clear();
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillTriangle(3, 16, 20, 4, 14, 15);
    graphics.fillTriangle(29, 16, 12, 28, 18, 17);
    graphics.generateTexture(TEXTURES.upgradeDamage, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeAttackSpeed, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillCircle(16, 16, 10);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillTriangle(16, 2, 21, 12, 11, 12);
    graphics.fillTriangle(30, 16, 20, 21, 20, 11);
    graphics.fillTriangle(16, 30, 11, 20, 21, 20);
    graphics.generateTexture(TEXTURES.upgradeAttackSpeed, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeMoveSpeed, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(5, 7, 11, 18);
    graphics.fillRect(12, 21, 9, 6);
    graphics.fillStyle(0x4fd6e8, 1);
    graphics.fillTriangle(18, 8, 29, 13, 18, 18);
    graphics.generateTexture(TEXTURES.upgradeMoveSpeed, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeMaxHealth, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillTriangle(16, 2, 29, 7, 25, 23);
    graphics.fillTriangle(16, 30, 7, 23, 3, 7);
    graphics.fillStyle(0x4fd6e8, 1);
    graphics.fillRect(13, 8, 6, 16);
    graphics.fillRect(8, 13, 16, 6);
    graphics.generateTexture(TEXTURES.upgradeMaxHealth, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeProjectileCount, () => {
    graphics.clear();
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillTriangle(4, 5, 17, 9, 7, 13);
    graphics.fillTriangle(4, 12, 20, 16, 4, 20);
    graphics.fillTriangle(7, 19, 17, 23, 4, 27);
    graphics.generateTexture(TEXTURES.upgradeProjectileCount, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradePenetration, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(8, 4, 4, 24);
    graphics.fillRect(20, 4, 4, 24);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(3, 13, 22, 6);
    graphics.fillTriangle(29, 16, 23, 10, 23, 22);
    graphics.generateTexture(TEXTURES.upgradePenetration, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradePickupRadius, () => {
    graphics.clear();
    graphics.lineStyle(3, 0x4fd6e8, 1);
    graphics.strokeCircle(16, 16, 12);
    graphics.fillStyle(0x8be7f1, 1);
    graphics.fillTriangle(16, 8, 23, 16, 16, 24);
    graphics.fillTriangle(16, 8, 9, 16, 16, 24);
    graphics.generateTexture(TEXTURES.upgradePickupRadius, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeEmergencyHeal, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(4, 8, 15, 16);
    graphics.fillStyle(0x4fd6e8, 1);
    graphics.fillRect(21, 9, 5, 14);
    graphics.fillRect(17, 13, 13, 6);
    graphics.generateTexture(TEXTURES.upgradeEmergencyHeal, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeBreacherKnockback, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(3, 11, 17, 10);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillTriangle(29, 5, 21, 16, 29, 27);
    graphics.generateTexture(TEXTURES.upgradeBreacherKnockback, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeBreacherSuppression, () => {
    graphics.clear();
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(13, 3, 7, 15);
    graphics.fillStyle(0x34465a, 1);
    graphics.fillTriangle(4, 28, 16, 15, 16, 28);
    graphics.fillTriangle(28, 28, 16, 15, 16, 28);
    graphics.generateTexture(TEXTURES.upgradeBreacherSuppression, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeBreacherMagazine, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(5, 4, 22, 24);
    graphics.fillStyle(0xd39c3c, 1);
    graphics.fillRect(17, 7, 6, 5);
    graphics.fillRect(17, 14, 6, 5);
    graphics.fillRect(17, 21, 6, 5);
    graphics.generateTexture(TEXTURES.upgradeBreacherMagazine, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeTeslaChains, () => {
    graphics.clear();
    graphics.lineStyle(3, 0x4fd6e8, 1);
    graphics.lineBetween(8, 8, 24, 12);
    graphics.lineBetween(24, 12, 10, 25);
    graphics.fillStyle(0x34465a, 1);
    graphics.fillCircle(7, 7, 5);
    graphics.fillCircle(25, 11, 5);
    graphics.fillCircle(9, 25, 5);
    graphics.generateTexture(TEXTURES.upgradeTeslaChains, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeTeslaCooldown, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(8, 6, 12, 21);
    graphics.lineStyle(3, 0x4fd6e8, 1);
    graphics.strokeCircle(20, 16, 9);
    graphics.lineBetween(20, 16, 25, 11);
    graphics.generateTexture(TEXTURES.upgradeTeslaCooldown, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradePistolBoomerang, () => {
    graphics.clear();
    graphics.fillStyle(0xa66cff, 1);
    graphics.fillRect(5, 13, 14, 6);
    graphics.fillTriangle(23, 16, 17, 10, 17, 22);
    graphics.lineStyle(3, 0xd3b4ff, 1);
    graphics.strokeCircle(16, 16, 12);
    graphics.generateTexture(TEXTURES.upgradePistolBoomerang, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeBreacherExplosive, () => {
    graphics.clear();
    graphics.fillStyle(0x34465a, 1);
    graphics.fillRect(4, 12, 19, 8);
    graphics.fillStyle(0xa66cff, 1);
    graphics.fillTriangle(29, 3, 25, 13, 20, 6);
    graphics.fillTriangle(29, 29, 25, 19, 20, 26);
    graphics.fillTriangle(29, 16, 22, 12, 22, 20);
    graphics.generateTexture(TEXTURES.upgradeBreacherExplosive, 32, 32);
  });

  ensureTexture(scene, TEXTURES.upgradeTeslaField, () => {
    graphics.clear();
    graphics.lineStyle(3, 0xa66cff, 1);
    graphics.strokeCircle(16, 16, 13);
    graphics.fillStyle(0x34465a, 1);
    graphics.fillCircle(16, 16, 6);
    graphics.fillStyle(0xd3b4ff, 1);
    graphics.fillRect(14, 5, 4, 7);
    graphics.fillRect(14, 20, 4, 7);
    graphics.generateTexture(TEXTURES.upgradeTeslaField, 32, 32);
  });

  ensureTexture(scene, TEXTURES.terminalSurfaceGrid, () => {
    graphics.clear();
    graphics.lineStyle(1, 0x31517d, 0.8);
    for (let x = 8; x < 128; x += 16) graphics.lineBetween(x, 0, x, 128);
    for (let y = 8; y < 128; y += 16) graphics.lineBetween(0, y, 128, y);
    graphics.fillStyle(0x4fd6e8, 0.8);
    for (let x = 8; x < 128; x += 32) {
      for (let y = 8; y < 128; y += 32) graphics.fillRect(x - 1, y - 1, 3, 3);
    }
    graphics.generateTexture(TEXTURES.terminalSurfaceGrid, 128, 128);
  });

  ensureTexture(scene, TEXTURES.incidentStampFrame, () => {
    graphics.clear();
    graphics.lineStyle(3, 0xa52a31, 1);
    graphics.strokeRect(2, 2, 92, 28);
    graphics.lineStyle(1, 0xe05b61, 1);
    graphics.strokeRect(6, 6, 84, 20);
    graphics.generateTexture(TEXTURES.incidentStampFrame, 96, 32);
  });

  ensureTexture(scene, TEXTURES.recontainmentStampFrame, () => {
    graphics.clear();
    graphics.lineStyle(3, 0x2b7a4b, 1);
    graphics.strokeRect(2, 2, 92, 28);
    graphics.lineStyle(1, 0x68d9a1, 1);
    graphics.strokeRect(6, 6, 84, 20);
    graphics.generateTexture(TEXTURES.recontainmentStampFrame, 96, 32);
  });

  // Static character textures remain the safe fallback when an opening sheet is
  // missing or incomplete. Do not synthesize formal spritesheet keys here.
  ensureTexture(scene, TEXTURES.player, () => {
    graphics.clear();
    graphics.fillStyle(0x3f82ff, 1);
    graphics.fillRect(0, 0, 28, 28);
    graphics.generateTexture(TEXTURES.player, 28, 28);
  });

  ensureTexture(scene, TEXTURES.enemyInfected, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.types.infectedStaff.color, 1);
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture(TEXTURES.enemyInfected, 20, 20);
  });

  ensureTexture(scene, TEXTURES.enemyCrawler, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.types.crawler.color, 1);
    graphics.fillTriangle(10, 0, 20, 18, 0, 18);
    graphics.generateTexture(TEXTURES.enemyCrawler, 20, 20);
  });

  ensureTexture(scene, TEXTURES.enemyDrone, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.types.drone.color, 1);
    graphics.fillRect(0, 0, 22, 22);
    graphics.generateTexture(TEXTURES.enemyDrone, 22, 22);
  });

  ensureTexture(scene, TEXTURES.eliteRiot, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.riotUnit.color, 1);
    graphics.fillRect(0, 0, 34, 34);
    graphics.generateTexture(TEXTURES.eliteRiot, 34, 34);
  });

  ensureTexture(scene, TEXTURES.eliteBlink, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.blinkStalker.color, 1);
    graphics.fillTriangle(16, 0, 32, 16, 16, 32);
    graphics.fillTriangle(16, 0, 16, 32, 0, 16);
    graphics.generateTexture(TEXTURES.eliteBlink, 32, 32);
  });

  ensureTexture(scene, TEXTURES.eliteBiomass, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.biomass.color, 1);
    graphics.fillCircle(18, 18, 18);
    graphics.generateTexture(TEXTURES.eliteBiomass, 36, 36);
  });

  ensureTexture(scene, TEXTURES.biomassChild, () => {
    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.biomassChild.color, 1);
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture(TEXTURES.biomassChild, 20, 20);
  });

  ensureTexture(scene, TEXTURES.bullet, () => {
    graphics.clear();
    graphics.fillStyle(0xffde59, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture(TEXTURES.bullet, 8, 8);
  });

  ensureTexture(scene, TEXTURES.enemyProjectile, () => {
    graphics.clear();
    graphics.fillStyle(0xff3db9, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture(TEXTURES.enemyProjectile, 10, 10);
  });

  ensureTexture(scene, TEXTURES.xpGem, () => {
    graphics.clear();
    graphics.fillStyle(0x50d66c, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture(TEXTURES.xpGem, 10, 10);
  });

  ensureTexture(scene, TEXTURES.combatStim, () => {
    graphics.clear();
    graphics.fillStyle(0x9affcc, 1);
    graphics.fillRect(2, 2, 12, 12);
    graphics.fillStyle(0x1b4f36, 1);
    graphics.fillRect(7, 4, 2, 8);
    graphics.fillRect(4, 7, 8, 2);
    graphics.generateTexture(TEXTURES.combatStim, 16, 16);
  });

  ensureTexture(scene, TEXTURES.scp500, () => {
    graphics.clear();
    graphics.fillStyle(0xff4040, 1);
    graphics.fillCircle(9, 9, 9);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(9, 9, 4);
    graphics.generateTexture(TEXTURES.scp500, 18, 18);
  });

  ensureTexture(scene, TEXTURES.enemyScp049, () => {
    graphics.clear();
    graphics.fillStyle(0x1a4d32, 1);
    graphics.fillRect(0, 0, 36, 36);
    graphics.fillStyle(0x2d6b45, 1);
    graphics.fillRect(6, 6, 24, 24);
    graphics.lineStyle(2, 0x8fd4a8, 1);
    graphics.strokeRect(0, 0, 36, 36);
    graphics.generateTexture(TEXTURES.enemyScp049, 36, 36);
  });

  ensureTexture(scene, TEXTURES.powerOutageLight, () => {
    graphics.clear();
    const lightRadius = 220;
    const lightCenter = lightRadius;
    for (let radius = lightRadius; radius > 0; radius -= 6) {
      const progress = 1 - radius / lightRadius;
      const alpha = Phaser.Math.Clamp(0.02 + progress * 0.12, 0.02, 0.2);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(lightCenter, lightCenter, radius);
    }
    graphics.generateTexture(
      TEXTURES.powerOutageLight,
      lightRadius * 2,
      lightRadius * 2
    );
  });

  graphics.destroy();
}
