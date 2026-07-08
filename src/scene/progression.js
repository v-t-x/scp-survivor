import Phaser from "phaser";
import {
  DEBUG_MODE,
  GAME_WIDTH,
  GAME_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  ENEMY_GRID_CELL_SIZE,
  ENEMY_GRID_STRIDE
} from "../config/constants.js";
import { BALANCE } from "../config/balance.js";
import { UPGRADE_DEFINITIONS } from "../config/upgrades.js";
import { META_PERKS, loadMetaProgress, saveMetaProgress } from "../config/meta.js";

// Domain mixin: progression. Methods are Object.assign'd onto PrototypeScene.prototype.
export const progressionMixin = {

  applyUnlockedPerks() {
    for (const perk of META_PERKS) {
      if (this.meta.perks[perk.key]) {
        perk.apply(this);
      }
    }
  },


  awardRunCredits(isVictory) {
    const survivalSeconds = this.elapsedSurvivalMs / 1000;
    const earned =
      Math.floor(
        this.killCount * BALANCE.meta.killCreditRate +
          survivalSeconds * BALANCE.meta.timeCreditRate
      ) + (isVictory ? BALANCE.meta.victoryBonus : 0);
    this.meta.credits += earned;
    saveMetaProgress(this.meta);
    return earned;
  },


  handleExperienceCollection() {
    const collectDistance = 14;
    for (const gem of this.xpGems.getChildren()) {
      if (!gem.active) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        gem.x,
        gem.y
      );

      // Begin magnetizing once the gem enters pickup radius.
      if (!gem.isMagnetized && distance <= this.pickupRadius) {
        gem.isMagnetized = true;
      }

      if (gem.isMagnetized) {
        if (distance <= collectDistance) {
          const xpValue = gem.xpValue ?? BALANCE.xp.gemValue;
          this.spawnGemPickupSpark(gem.x, gem.y);
          gem.destroy();
          this.addExperience(xpValue);
          continue;
        }

        // Accelerate toward the player for a satisfying vacuum feel.
        gem.magnetSpeed = Math.min(620, (gem.magnetSpeed ?? 180) + 26);
        const angle = Phaser.Math.Angle.Between(
          gem.x,
          gem.y,
          this.player.x,
          this.player.y
        );
        const step = (gem.magnetSpeed / 1000) * 16;
        gem.x += Math.cos(angle) * step;
        gem.y += Math.sin(angle) * step;
      }
    }
  },


  addExperience(amount) {
    this.currentXp += amount;

    while (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.level += 1;
      this.pendingLevelUps += 1;
      this.xpToNextLevel = this.getRequiredXpForLevel(this.level);
    }

    if (
      this.pendingLevelUps > 0 &&
      !this.isLevelUpActive
    ) {
      this.showLevelUpOverlay();
    }
  },


  getRequiredXpForLevel(level) {
    return Math.floor(
      BALANCE.xp.firstLevelRequirement +
        (level - 1) * BALANCE.xp.requirementGrowthPerLevel
    );
  },


  showLevelUpOverlay() {
    if (this.isGameOver) {
      return;
    }

    this.isLevelUpActive = true;
    this.isResolvingLevelUp = false;
    this.hideBuildPanel();
    this.pauseGameplaySystems();

    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy(true);
    }

    this.levelUpOverlay = this.add.container(0, 0);
    this.levelUpOverlay.setDepth(60);
    // Pin to the current viewport in WORLD space (not scrollFactor 0), so the
    // interactive cards' hit areas line up with where they are drawn.
    this.syncScreenOverlayPosition(this.levelUpOverlay);

    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      760,
      420,
      0x000000,
      0.84
    );
    backdrop.setStrokeStyle(2, 0x5a6b95);

    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 175,
      "升级",
      {
        fontSize: "50px",
        color: "#fff4c2"
      }
    );
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 132,
      "选择一个升级",
      {
        fontSize: "22px",
        color: "#ffffff"
      }
    );
    subtitle.setOrigin(0.5);

    this.levelUpOverlay.add([backdrop, title, subtitle]);

    this.levelUpCardObjects = [];
    this.levelUpCards = [];
    this.renderLevelUpCards();
    this.createLevelUpButtons();
  },


  syncScreenOverlayPosition(container) {
    // Place the container so its children (laid out in viewport coordinates)
    // render over the current camera view while staying in world space, which
    // keeps interactive hit areas aligned with the drawn cards.
    const cam = this.cameras.main;
    container.setPosition(cam.scrollX, cam.scrollY);
  },


  renderLevelUpCards() {
    if (this.levelUpCardObjects) {
      for (const object of this.levelUpCardObjects) {
        if (object?.active) {
          object.destroy();
        }
      }
    }
    this.levelUpCardObjects = [];
    this.levelUpCards = [];

    const options = this.getLevelUpChoices();
    const startX = GAME_WIDTH / 2 - 240;

    options.forEach((upgrade, index) => {
      const optionX = startX + index * 240;
      const optionY = GAME_HEIGHT / 2 - 15;
      const currentLevel = this.getUpgradeCurrentLevel(upgrade);

      const isMutation = !!upgrade.isMutation;
      const cardFill = isMutation ? 0x2a2140 : 0x1c2333;
      const cardHoverFill = isMutation ? 0x392c58 : 0x27314a;
      const card = this.add.rectangle(optionX, optionY, 220, 230, cardFill, 1);
      card.setStrokeStyle(isMutation ? 3 : 2, isMutation ? 0xc79bff : 0x4b5d88);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(cardHoverFill, 1));
      card.on("pointerout", () => card.setFillStyle(cardFill, 1));
      card.on("pointerdown", () => {
        this.applyUpgrade(upgrade, card);
      });
      this.levelUpCards.push(card);

      if (isMutation) {
        const badge = this.add.text(optionX, optionY - 96, "★ 质变", {
          fontSize: "15px",
          fontStyle: "bold",
          color: "#e2c6ff",
          align: "center"
        });
        badge.setOrigin(0.5);
        this.levelUpCardObjects.push(badge);
        this.levelUpOverlay.add(badge);
      }

      const nameText = this.add.text(optionX, optionY - 62, upgrade.name, {
        fontSize: "22px",
        color: isMutation ? "#e0b6ff" : "#8cd5ff",
        align: "center",
        wordWrap: { width: 190 }
      });
      nameText.setOrigin(0.5);

      const descriptionText = this.add.text(
        optionX,
        optionY + 5,
        upgrade.description,
        {
          fontSize: "16px",
          color: "#dde7ff",
          align: "center",
          wordWrap: { width: 185 }
        }
      );
      descriptionText.setOrigin(0.5);

      const currentLevelText = this.add.text(
        optionX,
        optionY + 82,
        `当前：Lv ${currentLevel}`,
        {
          fontSize: "15px",
          color: "#ffd990",
          align: "center",
          wordWrap: { width: 195 }
        }
      );
      currentLevelText.setOrigin(0.5);

      this.levelUpCardObjects.push(card, nameText, descriptionText, currentLevelText);
      this.levelUpOverlay.add([card, nameText, descriptionText, currentLevelText]);
    });
  },


  createLevelUpButtons() {
    const buttonY = GAME_HEIGHT / 2 + 160;

    const rerollButton = this.add.rectangle(
      GAME_WIDTH / 2 - 115,
      buttonY,
      200,
      46,
      0x2d3a55,
      1
    );
    rerollButton.setStrokeStyle(2, 0x5f78b0);
    rerollButton.setInteractive({ useHandCursor: true });

    const rerollLabel = this.add.text(GAME_WIDTH / 2 - 115, buttonY, "", {
      fontSize: "18px",
      color: "#dfe8ff",
      align: "center"
    });
    rerollLabel.setOrigin(0.5);

    rerollButton.on("pointerover", () => {
      if (this.rerollsRemaining > 0) {
        rerollButton.setFillStyle(0x3a4b6e, 1);
      }
    });
    rerollButton.on("pointerout", () => rerollButton.setFillStyle(0x2d3a55, 1));
    rerollButton.on("pointerdown", () => this.rerollLevelUpChoices());

    const skipButton = this.add.rectangle(
      GAME_WIDTH / 2 + 115,
      buttonY,
      200,
      46,
      0x2d3a55,
      1
    );
    skipButton.setStrokeStyle(2, 0x5f78b0);
    skipButton.setInteractive({ useHandCursor: true });

    const skipLabel = this.add.text(
      GAME_WIDTH / 2 + 115,
      buttonY,
      `跳过（+${BALANCE.upgrades.skipHealAmount} 生命）`,
      {
        fontSize: "18px",
        color: "#dfe8ff",
        align: "center"
      }
    );
    skipLabel.setOrigin(0.5);

    skipButton.on("pointerover", () => skipButton.setFillStyle(0x3a4b6e, 1));
    skipButton.on("pointerout", () => skipButton.setFillStyle(0x2d3a55, 1));
    skipButton.on("pointerdown", () => this.skipLevelUpChoice());

    this.levelUpRerollButton = rerollButton;
    this.levelUpRerollLabel = rerollLabel;
    this.levelUpOverlay.add([rerollButton, rerollLabel, skipButton, skipLabel]);
    this.updateRerollButtonState();
  },


  updateRerollButtonState() {
    if (!this.levelUpRerollLabel) {
      return;
    }
    this.levelUpRerollLabel.setText(`重抽（剩 ${this.rerollsRemaining}）`);
    const enabled = this.rerollsRemaining > 0;
    this.levelUpRerollLabel.setColor(enabled ? "#dfe8ff" : "#6b7590");
    this.levelUpRerollButton.setStrokeStyle(2, enabled ? 0x5f78b0 : 0x3a4256);
  },


  rerollLevelUpChoices() {
    if (this.isResolvingLevelUp || this.rerollsRemaining <= 0) {
      return;
    }
    this.rerollsRemaining -= 1;
    this.renderLevelUpCards();
    this.updateRerollButtonState();
    this.playSound("levelUp");
  },


  skipLevelUpChoice() {
    if (this.isResolvingLevelUp) {
      return;
    }
    this.isResolvingLevelUp = true;

    for (const card of this.levelUpCards) {
      card.disableInteractive();
    }

    this.health = Math.min(
      this.maxHealth,
      this.health + BALANCE.upgrades.skipHealAmount
    );

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
    }
    this.updateUI();

    this.time.delayedCall(120, () => {
      if (this.pendingLevelUps > 0) {
        this.showLevelUpOverlay();
        return;
      }
      if (this.levelUpOverlay) {
        this.levelUpOverlay.destroy(true);
        this.levelUpOverlay = null;
      }
      this.levelUpCards = [];
      this.levelUpCardObjects = [];
      this.isLevelUpActive = false;
      this.isResolvingLevelUp = false;
      this.resumeGameplaySystems();
      this.updateUI();
    });
  },


  applyUpgrade(upgrade, selectedCard) {
    if (this.isResolvingLevelUp) {
      return;
    }
    this.isResolvingLevelUp = true;

    for (const card of this.levelUpCards) {
      card.disableInteractive();
    }
    selectedCard.setStrokeStyle(4, 0xffdd66);
    selectedCard.setFillStyle(0x35527a, 1);

    upgrade.apply(this);
    this.upgradeLevels[upgrade.key] += 1;
    if (upgrade.kind === "weapon") {
      const weaponId = upgrade.weaponId ?? this.selectedWeaponId;
      if (weaponId && this.weapons[weaponId]) {
        this.weapons[weaponId].currentLevel += 1;
      }
    }

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
    }
    this.updateUI();
    this.playSound("levelUp");

    this.time.delayedCall(160, () => {
      if (this.pendingLevelUps > 0) {
        this.showLevelUpOverlay();
        return;
      }

      if (this.levelUpOverlay) {
        this.levelUpOverlay.destroy(true);
        this.levelUpOverlay = null;
      }
      this.levelUpCards = [];
      this.levelUpCardObjects = [];
      this.isLevelUpActive = false;
      this.isResolvingLevelUp = false;
      this.resumeGameplaySystems();
      this.updateUI();
    });
  },


  getUpgradeCurrentLevel(upgrade) {
    if (upgrade.kind === "weapon") {
      const weaponId = upgrade.weaponId ?? this.selectedWeaponId;
      if (weaponId && this.weapons[weaponId]) {
        return this.weapons[weaponId].currentLevel;
      }
    }
    return this.upgradeLevels[upgrade.key] ?? 0;
  },


  getLevelUpChoices() {
    const available = UPGRADE_DEFINITIONS.filter(
      (upgrade) => upgrade.isAvailable?.(this) ?? true
    );
    const shuffled = Phaser.Utils.Array.Shuffle([...available]);
    const choices = [];
    const seen = new Set();

    for (const upgrade of shuffled) {
      if (seen.has(upgrade.key)) {
        continue;
      }
      choices.push(upgrade);
      seen.add(upgrade.key);
      if (choices.length === 3) {
        break;
      }
    }

    if (choices.length < 3) {
      const genericFallback = available.filter((upgrade) => upgrade.kind === "generic");
      for (const upgrade of genericFallback) {
        if (choices.length === 3) {
          break;
        }
        if (seen.has(upgrade.key)) {
          continue;
        }
        choices.push(upgrade);
        seen.add(upgrade.key);
      }
    }

    if (choices.length < 3) {
      const emergency = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.key === "emergencyHeal");
      if (emergency && !seen.has(emergency.key)) {
        choices.push(emergency);
        seen.add(emergency.key);
      }
    }

    return choices;
  },


  dropExperienceGem(x, y, xpValue = BALANCE.xp.gemValue) {
    const gem = this.xpGems.create(x, y, "xp-gem");
    gem.xpValue = xpValue;
    gem.setCircle(5);
  },


  spawnCombatStim(x, y) {
    const stim = this.supplyPickups.create(x, y, "combat-stim");
    stim.pickupType = "combatStim";
    stim.setCircle(8);
    stim.setDepth(14);
  },


  updateSupplyPickups() {
    for (const pickup of this.supplyPickups.getChildren()) {
      pickup.rotation += 0.035;
    }
  },


  updateScp500Spawn() {
    if (this.scp500Spawned || !this.isMissionActive || this.isGameOver) {
      return;
    }
    if (this.elapsedSurvivalMs < BALANCE.match.scp500SpawnAtMs) {
      return;
    }
    this.scp500Spawned = true;
    this.spawnScp500();
  },


  spawnScp500() {
    // Place it a short distance from the player so it is reachable in the
    // larger world but still requires deliberate movement to grab.
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(240, 420);
    const x = Phaser.Math.Clamp(
      this.player.x + Math.cos(angle) * distance,
      72,
      WORLD_WIDTH - 72
    );
    const y = Phaser.Math.Clamp(
      this.player.y + Math.sin(angle) * distance,
      72,
      WORLD_HEIGHT - 72
    );
    const pickup = this.supplyPickups.create(x, y, "scp500");
    pickup.pickupType = "scp500";
    pickup.setCircle(9);
    pickup.setDepth(14);
    this.showTopBanner("异常物品", "SCP-500 已在设施内出现", 2400);
  }
};
