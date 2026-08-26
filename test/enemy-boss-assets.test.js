import assert from "node:assert/strict";
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
