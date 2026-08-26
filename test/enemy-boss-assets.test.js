import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  DEVELOPMENT_SPRITESHEET_ASSETS,
  IMAGE_ASSETS,
  SPRITESHEET_ASSETS,
  TEXTURES
} from "../src/assets/manifest.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(root, "scripts/art/data/enemy-boss-animation-contracts.json");

const expected = {
  r17DrifterActionSheet: ["r17-drifter-action-sheet", "assets/art/enemies/r17-drifter-action-sheet.png"],
  r17RiftSkimmerActionSheet: ["r17-rift-skimmer-action-sheet", "assets/art/enemies/r17-rift-skimmer-action-sheet.png"],
  r17PulseSacActionSheet: ["r17-pulse-sac-action-sheet", "assets/art/enemies/r17-pulse-sac-action-sheet.png"],
  r17CarapaceGateActionSheet: ["r17-carapace-gate-action-sheet", "assets/art/enemies/r17-carapace-gate-action-sheet.png"],
  r17FrameGapActionSheet: ["r17-frame-gap-action-sheet", "assets/art/enemies/r17-frame-gap-action-sheet.png"],
  r17BroodMassActionSheet: ["r17-brood-mass-action-sheet", "assets/art/enemies/r17-brood-mass-action-sheet.png"],
  r17BudActionSheet: ["r17-bud-action-sheet", "assets/art/enemies/r17-bud-action-sheet.png"],
  enemyScp049LocomotionSheet: ["enemy-scp049-locomotion-sheet", "assets/art/characters/scp-049-locomotion-sheet.png"],
  enemyScp049ActionSheet: ["enemy-scp049-action-sheet", "assets/art/characters/scp-049-action-sheet.png"],
};

const gate2Expected = {
  r17RiftSkimmerActionSheet: {
    productionPath: "assets/art/enemies/r17-rift-skimmer-action-sheet.png",
    frameWidth: 48,
    frameHeight: 48,
    frameCount: 18,
    sheetWidth: 864,
    sheetHeight: 48,
    sha256: "7b944216e4b78eaacb1a36d8ae023ac03c343e5fbda523e56fc4ec226065e304",
    clips: {
      move: { start: 0, end: 5, fps: 12, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      pierce: { start: 14, end: 17, fps: 15, repeat: 0 },
    },
  },
  r17BudActionSheet: {
    productionPath: "assets/art/enemies/r17-bud-action-sheet.png",
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 18,
    sheetWidth: 576,
    sheetHeight: 32,
    sha256: "22ff646ce9ee1ddc1b67305c95e5d4fa9c6c862a494976598ac87025e0fa99e6",
    clips: {
      move: { start: 0, end: 5, fps: 12, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      snap: { start: 14, end: 17, fps: 16, repeat: 0 },
    },
  },
  r17FrameGapActionSheet: {
    productionPath: "assets/art/enemies/r17-frame-gap-action-sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 22,
    sheetWidth: 1408,
    sheetHeight: 64,
    sha256: "ff72566e4c612ee6292e6135b0f06f2e7d12aa53fe0219f82b6304ab41bcf9c5",
    clips: {
      move: { start: 0, end: 5, fps: 8, repeat: -1 },
      hit: { start: 6, end: 7, fps: 24, repeat: 0 },
      death: { start: 8, end: 13, fps: 12, repeat: 0 },
      "phase-out": { start: 14, end: 17, fps: 6, repeat: 0 },
      "reappear-dash": { start: 18, end: 21, fps: 12.5, repeat: -1 },
    },
  },
};

// Break caught: a public action-sheet key/path changes while existing production keys remain in the manifest.
test("enemy and SCP-049 action contract has the exact nine public key/path mappings", async () => {
  const contract = JSON.parse(await fs.readFile(contractPath, "utf8"));
  assert.equal(contract.schemaVersion, 1);
  assert.deepEqual(Object.keys(contract).filter((key) => key !== "schemaVersion").sort(), Object.keys(expected).sort());
  for (const [id, [textureKey, productionPath]] of Object.entries(expected)) {
    assert.equal(contract[id].textureKey, textureKey, id);
    assert.equal(contract[id].productionPath, productionPath, id);
  }
});

// Break caught: a Gate 2 sheet changes canvas/frame geometry or any clip range before assembly.
test("Gate 2 contract locks exact paths, final dimensions, frame counts and clip ranges", async () => {
  const contract = JSON.parse(await fs.readFile(contractPath, "utf8"));
  for (const [id, expectedEntry] of Object.entries(gate2Expected)) {
    const actual = contract[id];
    const { sha256, ...expectedContract } = expectedEntry;
    assert.deepEqual({
      productionPath: actual?.productionPath,
      frameWidth: actual?.frameWidth,
      frameHeight: actual?.frameHeight,
      frameCount: actual?.frameCount,
      sheetWidth: actual?.sheetWidth,
      sheetHeight: actual?.sheetHeight,
      clips: actual?.clips,
    }, expectedContract, id);

    const buffer = await fs.readFile(path.join(root, "public", expectedEntry.productionPath));
    assert.equal(
      createHash("sha256").update(buffer).digest("hex"),
      sha256,
      `${id} SHA-256`
    );
  }
});

// Break caught: a candidate key or path is omitted, renamed or admitted to production before Gate 4.
test("the manifest exposes all nine action sheets only through the gated development contract", () => {
  const actual = {};
  for (const [property, [key, assetPath]] of Object.entries(expected)) {
    assert.equal(TEXTURES[property], key, property);
    const developmentAsset = DEVELOPMENT_SPRITESHEET_ASSETS.find((asset) => asset.key === key);
    actual[property] = [developmentAsset?.key, developmentAsset?.path];
    assert.equal(SPRITESHEET_ASSETS.some((asset) => asset.key === key), false, property);
  }
  assert.deepEqual(actual, expected);
});

test("the new contract preserves all eight legacy fallback identities and their paths", async () => {
  const fallbacks = {
    r17Drifter: ["r17-drifter", "assets/art/enemies/r17-drifter.png"], r17RiftSkimmer: ["r17-rift-skimmer", "assets/art/enemies/r17-rift-skimmer.png"],
    r17PulseSac: ["r17-pulse-sac", "assets/art/enemies/r17-pulse-sac.png"], r17CarapaceGate: ["r17-carapace-gate", "assets/art/enemies/r17-carapace-gate.png"],
    r17FrameGap: ["r17-frame-gap", "assets/art/enemies/r17-frame-gap.png"], r17BroodMass: ["r17-brood-mass", "assets/art/enemies/r17-brood-mass.png"],
    r17Bud: ["r17-bud", "assets/art/enemies/r17-bud.png"], enemyScp049: ["enemy-scp049", "assets/art/characters/scp-049.png"],
  };
  for (const [property, [key, assetPath]] of Object.entries(fallbacks)) {
    assert.equal(TEXTURES[property], key, property);
    assert.equal([...IMAGE_ASSETS, ...SPRITESHEET_ASSETS].find((asset) => asset.key === key)?.path, assetPath, property);
  }
});
