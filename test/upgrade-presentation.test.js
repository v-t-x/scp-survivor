import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

const EXPECTED_PRESENTATION = {
  damage: ["upgrade-damage", "assets/art/upgrades/damage.png", "weapon"],
  attackSpeed: ["upgrade-attack-speed", "assets/art/upgrades/attack-speed.png", "weapon"],
  moveSpeed: ["upgrade-move-speed", "assets/art/upgrades/move-speed.png", "standard"],
  maxHealth: ["upgrade-max-health", "assets/art/upgrades/max-health.png", "standard"],
  projectileCount: ["upgrade-projectile-count", "assets/art/upgrades/projectile-count.png", "weapon"],
  penetration: ["upgrade-penetration", "assets/art/upgrades/penetration.png", "weapon"],
  pickupRadius: ["upgrade-pickup-radius", "assets/art/upgrades/pickup-radius.png", "standard"],
  emergencyHeal: ["upgrade-emergency-heal", "assets/art/upgrades/emergency-heal.png", "standard"],
  breacherKnockback: ["upgrade-breacher-knockback", "assets/art/upgrades/breacher-knockback.png", "weapon"],
  breacherSuppression: ["upgrade-breacher-suppression", "assets/art/upgrades/breacher-suppression.png", "weapon"],
  breacherMagazine: ["upgrade-breacher-magazine", "assets/art/upgrades/breacher-magazine.png", "weapon"],
  teslaChains: ["upgrade-tesla-chains", "assets/art/upgrades/tesla-chains.png", "weapon"],
  teslaCooldown: ["upgrade-tesla-cooldown", "assets/art/upgrades/tesla-cooldown.png", "weapon"],
  pistolBoomerang: ["upgrade-pistol-boomerang", "assets/art/upgrades/pistol-boomerang.png", "mutation"],
  breacherExplosive: ["upgrade-breacher-explosive", "assets/art/upgrades/breacher-explosive.png", "mutation"],
  teslaField: ["upgrade-tesla-field", "assets/art/upgrades/tesla-field.png", "mutation"]
};

const EXPECTED_TEXTURE_PROPERTIES = {
  upgradeDamage: "upgrade-damage",
  upgradeAttackSpeed: "upgrade-attack-speed",
  upgradeMoveSpeed: "upgrade-move-speed",
  upgradeMaxHealth: "upgrade-max-health",
  upgradeProjectileCount: "upgrade-projectile-count",
  upgradePenetration: "upgrade-penetration",
  upgradePickupRadius: "upgrade-pickup-radius",
  upgradeEmergencyHeal: "upgrade-emergency-heal",
  upgradeBreacherKnockback: "upgrade-breacher-knockback",
  upgradeBreacherSuppression: "upgrade-breacher-suppression",
  upgradeBreacherMagazine: "upgrade-breacher-magazine",
  upgradeTeslaChains: "upgrade-tesla-chains",
  upgradeTeslaCooldown: "upgrade-tesla-cooldown",
  upgradePistolBoomerang: "upgrade-pistol-boomerang",
  upgradeBreacherExplosive: "upgrade-breacher-explosive",
  upgradeTeslaField: "upgrade-tesla-field",
  terminalSurfaceGrid: "terminal-surface-grid",
  incidentStampFrame: "incident-stamp-frame",
  recontainmentStampFrame: "recontainment-stamp-frame"
};

test("upgrade presentation maps the exact real upgrade key set without gameplay copies", async () => {
  const { UPGRADE_PRESENTATION } = await import("../src/ui/upgradePresentation.js");
  const definitionKeys = UPGRADE_DEFINITIONS.map(({ key }) => key).sort();

  assert.deepEqual(Object.keys(UPGRADE_PRESENTATION).sort(), definitionKeys);
  assert.deepEqual(Object.keys(UPGRADE_PRESENTATION).sort(), Object.keys(EXPECTED_PRESENTATION).sort());

  for (const definition of UPGRADE_DEFINITIONS) {
    const presentation = UPGRADE_PRESENTATION[definition.key];
    const [textureKey, path, tone] = EXPECTED_PRESENTATION[definition.key];
    assert.deepEqual(Object.keys(presentation).sort(), ["path", "riskLabel", "textureKey", "tone"]);
    assert.deepEqual(presentation, {
      textureKey,
      path,
      tone,
      riskLabel: definition.isMutation ? "本局不可撤销" : null
    });
    assert.equal("name" in presentation, false);
    assert.equal("description" in presentation, false);
    assert.equal("apply" in presentation, false);
  }
});

test("all 19 terminal upgrade assets have unique manifest keys and guarded fallbacks", async () => {
  for (const [property, key] of Object.entries(EXPECTED_TEXTURE_PROPERTIES)) {
    assert.equal(TEXTURES[property], key);
  }

  const expectedKeys = new Set(Object.values(EXPECTED_TEXTURE_PROPERTIES));
  assert.equal(expectedKeys.size, 19);
  const manifestAssets = IMAGE_ASSETS.filter(({ key }) => expectedKeys.has(key));
  assert.equal(manifestAssets.length, 19);
  assert.equal(new Set(manifestAssets.map(({ key }) => key)).size, 19);

  const fallbackSource = await readFile(
    new URL("../src/assets/fallbackTextureFactory.js", import.meta.url),
    "utf8"
  );
  for (const property of Object.keys(EXPECTED_TEXTURE_PROPERTIES)) {
    assert.match(
      fallbackSource,
      new RegExp(`ensureTexture\\(scene, TEXTURES\\.${property},`),
      `${property} must have an existence-guarded fallback`
    );
  }
});
