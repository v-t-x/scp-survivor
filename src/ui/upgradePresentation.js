import { TEXTURES } from "../assets/manifest.js";

const mutationRisk = "本局不可撤销";

export const UPGRADE_PRESENTATION = Object.freeze({
  damage: Object.freeze({ textureKey: TEXTURES.upgradeDamage, path: "assets/art/upgrades/damage.png", tone: "weapon", riskLabel: null }),
  attackSpeed: Object.freeze({ textureKey: TEXTURES.upgradeAttackSpeed, path: "assets/art/upgrades/attack-speed.png", tone: "weapon", riskLabel: null }),
  moveSpeed: Object.freeze({ textureKey: TEXTURES.upgradeMoveSpeed, path: "assets/art/upgrades/move-speed.png", tone: "standard", riskLabel: null }),
  maxHealth: Object.freeze({ textureKey: TEXTURES.upgradeMaxHealth, path: "assets/art/upgrades/max-health.png", tone: "standard", riskLabel: null }),
  projectileCount: Object.freeze({ textureKey: TEXTURES.upgradeProjectileCount, path: "assets/art/upgrades/projectile-count.png", tone: "weapon", riskLabel: null }),
  penetration: Object.freeze({ textureKey: TEXTURES.upgradePenetration, path: "assets/art/upgrades/penetration.png", tone: "weapon", riskLabel: null }),
  pickupRadius: Object.freeze({ textureKey: TEXTURES.upgradePickupRadius, path: "assets/art/upgrades/pickup-radius.png", tone: "standard", riskLabel: null }),
  emergencyHeal: Object.freeze({ textureKey: TEXTURES.upgradeEmergencyHeal, path: "assets/art/upgrades/emergency-heal.png", tone: "standard", riskLabel: null }),
  breacherKnockback: Object.freeze({ textureKey: TEXTURES.upgradeBreacherKnockback, path: "assets/art/upgrades/breacher-knockback.png", tone: "weapon", riskLabel: null }),
  breacherSuppression: Object.freeze({ textureKey: TEXTURES.upgradeBreacherSuppression, path: "assets/art/upgrades/breacher-suppression.png", tone: "weapon", riskLabel: null }),
  breacherMagazine: Object.freeze({ textureKey: TEXTURES.upgradeBreacherMagazine, path: "assets/art/upgrades/breacher-magazine.png", tone: "weapon", riskLabel: null }),
  teslaChains: Object.freeze({ textureKey: TEXTURES.upgradeTeslaChains, path: "assets/art/upgrades/tesla-chains.png", tone: "weapon", riskLabel: null }),
  teslaCooldown: Object.freeze({ textureKey: TEXTURES.upgradeTeslaCooldown, path: "assets/art/upgrades/tesla-cooldown.png", tone: "weapon", riskLabel: null }),
  pistolBoomerang: Object.freeze({ textureKey: TEXTURES.upgradePistolBoomerang, path: "assets/art/upgrades/pistol-boomerang.png", tone: "mutation", riskLabel: mutationRisk }),
  breacherExplosive: Object.freeze({ textureKey: TEXTURES.upgradeBreacherExplosive, path: "assets/art/upgrades/breacher-explosive.png", tone: "mutation", riskLabel: mutationRisk }),
  teslaField: Object.freeze({ textureKey: TEXTURES.upgradeTeslaField, path: "assets/art/upgrades/tesla-field.png", tone: "mutation", riskLabel: mutationRisk })
});
