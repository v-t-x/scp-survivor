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
import { TEXTURES } from "../assets/manifest.js";
import { createTerminalButton } from "../ui/tacticalUi.js";
import {
  createTerminalCard,
  createTerminalOverlay
} from "../ui/terminalOverlay.js";
import { UPGRADE_PRESENTATION } from "../ui/upgradePresentation.js";

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
      !this.isLevelUpActive &&
      !this._levelUpPresentationUnavailable
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
    if (this.isGameOver || this._levelUpPresentationUnavailable) {
      return;
    }

    this.isLevelUpActive = true;
    this.isResolvingLevelUp = false;
    this.hideBuildPanel();
    this.pauseGameplaySystems();

    this.destroyLevelUpOverlay();

    try {
      this.levelUpOverlayController = createTerminalOverlay(this, {
        x: 0,
        y: 0,
        width: 760,
        height: 420,
        depth: 60,
        scrollFactor: 1,
        eyebrow: "SITE-19 / FIELD AUTHORIZATION",
        title: "升级授权",
        subtitle: "选择一项现场强化协议",
        tone: "standard",
        surfaceTextureKey: TEXTURES.terminalSurfaceGrid
      });
      this.levelUpOverlay = this.levelUpOverlayController.container;
      // Keep this overlay in world space so visuals and Phaser hit areas share
      // the same camera transform.
      this.syncScreenOverlayPosition(this.levelUpOverlay);
      this.renderLevelUpCards();
      this.createLevelUpButtons();
    } catch {
      this.replaceFailedTerminalWithLegacyLevelUpOverlay();
    }
  },


  replaceFailedTerminalWithLegacyLevelUpOverlay() {
    this.destroyLevelUpOverlay();
    try {
      this.createLegacyLevelUpOverlay();
      return true;
    } catch {
      this.handleLevelUpPresentationFailure();
      return false;
    }
  },


  handleLevelUpPresentationFailure() {
    this.destroyLevelUpOverlay();
    this._levelUpPresentationUnavailable = true;
    this.isLevelUpActive = false;
    this.isResolvingLevelUp = false;
    this.resumeGameplaySystems();
    this.updateUI();
  },


  createLegacyLevelUpOverlay() {
    const created = [];
    let container = null;
    try {
      container = this.add.container(0, 0);
      created.push(container);
      container.setDepth(60);
      this.syncScreenOverlayPosition(container);
      this.levelUpOverlayController = null;
      this.levelUpOverlay = container;

      const backdrop = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        760,
        420,
        0x000000,
        0.84
      );
      created.push(backdrop);
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
      created.push(title);
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
      created.push(subtitle);
      subtitle.setOrigin(0.5);
      container.add([backdrop, title, subtitle]);

      this.renderLegacyLevelUpCards();
      this.createLegacyLevelUpButtons();
      return container;
    } catch (error) {
      this.destroyLevelUpCards();
      this.destroyLevelUpButtons();
      if (container?.active) {
        container.destroy(true);
      }
      for (const object of created) {
        if (object?.active) object.destroy();
      }
      this.levelUpOverlay = null;
      this.levelUpOverlayController = null;
      throw error;
    }
  },


  syncScreenOverlayPosition(container) {
    // Place the container so its children (laid out in viewport coordinates)
    // render over the current camera view while staying in world space, which
    // keeps interactive hit areas aligned with the drawn cards.
    const cam = this.cameras.main;
    container.setPosition(cam.scrollX, cam.scrollY);
  },


  renderLevelUpCards() {
    this.destroyLevelUpCards();

    if (!this.levelUpOverlayController) {
      this.renderLegacyLevelUpCards();
      return;
    }

    const options = this.getLevelUpChoices();
    const startX = GAME_WIDTH / 2 - 240;
    const controllers = [];
    try {
      options.forEach((upgrade, index) => {
        const presentation = UPGRADE_PRESENTATION[upgrade.key];
        const currentLevel = this.getUpgradeCurrentLevel(upgrade);
        let cardController = null;
        cardController = createTerminalCard(this, {
          x: startX + index * 240,
          y: GAME_HEIGHT / 2 - 15,
          width: 220,
          height: 230,
          depth: 60,
          scrollFactor: 1,
          parent: this.levelUpOverlayController.content,
          iconKey: presentation.textureKey,
          eyebrow: upgrade.isMutation
            ? "ANOMALOUS MUTATION"
            : upgrade.kind === "weapon"
              ? "WEAPON PROTOCOL"
              : "FIELD PROTOCOL",
          title: upgrade.name,
          description: upgrade.description,
          footer: `当前：Lv ${currentLevel}`,
          riskLabel: presentation.riskLabel,
          tone: presentation.tone,
          onActivate: () => this.applyUpgrade(upgrade, cardController)
        });
        controllers.push(cardController);
      });
      this.levelUpCards = controllers;
      this.levelUpCardObjects = controllers.flatMap(({ objects }) => objects);
    } catch (error) {
      for (const controller of controllers) controller.destroy();
      this.levelUpCards = [];
      this.levelUpCardObjects = [];
      throw error;
    }
  },


  renderLegacyLevelUpCards() {
    this.destroyLevelUpCards();
    const objects = [];
    const cards = [];
    const options = this.getLevelUpChoices();
    const startX = GAME_WIDTH / 2 - 240;

    try {
      options.forEach((upgrade, index) => {
        const optionX = startX + index * 240;
        const optionY = GAME_HEIGHT / 2 - 15;
        const currentLevel = this.getUpgradeCurrentLevel(upgrade);
        const isMutation = !!upgrade.isMutation;
        const cardFill = isMutation ? 0x2a2140 : 0x1c2333;
        const cardHoverFill = isMutation ? 0x392c58 : 0x27314a;
        const card = this.add.rectangle(optionX, optionY, 220, 230, cardFill, 1);
        objects.push(card);
        card.setStrokeStyle(isMutation ? 3 : 2, isMutation ? 0xc79bff : 0x4b5d88);
        card.setInteractive({ useHandCursor: true });
        card.on("pointerover", () => card.setFillStyle(cardHoverFill, 1));
        card.on("pointerout", () => card.setFillStyle(cardFill, 1));
        card.on("pointerdown", () => this.applyUpgrade(upgrade, card));
        cards.push(card);

        if (isMutation) {
          const badge = this.add.text(optionX, optionY - 96, "★ 质变", {
            fontSize: "15px",
            fontStyle: "bold",
            color: "#e2c6ff",
            align: "center"
          });
          objects.push(badge);
          badge.setOrigin(0.5);
        }

        const nameText = this.add.text(optionX, optionY - 62, upgrade.name, {
          fontSize: "22px",
          color: isMutation ? "#e0b6ff" : "#8cd5ff",
          align: "center",
          wordWrap: { width: 190 }
        });
        objects.push(nameText);
        nameText.setOrigin(0.5);

        const descriptionText = this.add.text(optionX, optionY + 5, upgrade.description, {
          fontSize: "16px",
          color: "#dde7ff",
          align: "center",
          wordWrap: { width: 185 }
        });
        objects.push(descriptionText);
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
        objects.push(currentLevelText);
        currentLevelText.setOrigin(0.5);
      });
      this.levelUpOverlay.add(objects);
      this.levelUpCards = cards;
      this.levelUpCardObjects = objects;
    } catch (error) {
      for (const object of objects) {
        if (object?.active) object.destroy();
      }
      this.levelUpCards = [];
      this.levelUpCardObjects = [];
      throw error;
    }
  },


  createLevelUpButtons() {
    this.destroyLevelUpButtons();
    if (!this.levelUpOverlayController) {
      this.createLegacyLevelUpButtons();
      return;
    }

    const controllers = [];
    try {
      const reroll = createTerminalButton(this, {
        x: GAME_WIDTH / 2 - 215,
        y: GAME_HEIGHT / 2 + 137,
        width: 200,
        height: 46,
        text: "",
        state: "idle",
        variant: "standard",
        activateOn: "pointerdown",
        depth: 60,
        scrollFactor: 1,
        onActivate: () => this.rerollLevelUpChoices()
      });
      controllers.push(reroll);
      this.levelUpOverlayController.content.add(reroll.objects);

      const skip = createTerminalButton(this, {
        x: GAME_WIDTH / 2 + 15,
        y: GAME_HEIGHT / 2 + 137,
        width: 200,
        height: 46,
        text: `跳过（+${BALANCE.upgrades.skipHealAmount} 生命）`,
        state: "idle",
        variant: "primary",
        activateOn: "pointerdown",
        depth: 60,
        scrollFactor: 1,
        onActivate: () => this.skipLevelUpChoice()
      });
      controllers.push(skip);
      this.levelUpOverlayController.content.add(skip.objects);

      this.levelUpButtonControllers = controllers;
      this.levelUpButtonObjects = controllers.flatMap(({ objects }) => objects);
      this.levelUpRerollButtonController = reroll;
      this.levelUpRerollButton = reroll.hitArea;
      this.levelUpRerollLabel = reroll.label;
      this.levelUpSkipButtonController = skip;
      this.levelUpSkipButton = skip.hitArea;
      this.updateRerollButtonState();
    } catch (error) {
      for (const controller of controllers) controller.destroy();
      this.destroyLevelUpButtons();
      throw error;
    }
  },


  createLegacyLevelUpButtons() {
    const objects = [];
    const buttonY = GAME_HEIGHT / 2 + 160;
    try {
      const rerollButton = this.add.rectangle(
        GAME_WIDTH / 2 - 115,
        buttonY,
        200,
        46,
        0x2d3a55,
        1
      );
      objects.push(rerollButton);
      rerollButton.setStrokeStyle(2, 0x5f78b0);
      rerollButton.setInteractive({ useHandCursor: true });

      const rerollLabel = this.add.text(GAME_WIDTH / 2 - 115, buttonY, "", {
        fontSize: "18px",
        color: "#dfe8ff",
        align: "center"
      });
      objects.push(rerollLabel);
      rerollLabel.setOrigin(0.5);
      rerollButton.on("pointerover", () => {
        if (this.rerollsRemaining > 0) rerollButton.setFillStyle(0x3a4b6e, 1);
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
      objects.push(skipButton);
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
      objects.push(skipLabel);
      skipLabel.setOrigin(0.5);
      skipButton.on("pointerover", () => skipButton.setFillStyle(0x3a4b6e, 1));
      skipButton.on("pointerout", () => skipButton.setFillStyle(0x2d3a55, 1));
      skipButton.on("pointerdown", () => this.skipLevelUpChoice());

      this.levelUpOverlay.add(objects);
      this.levelUpButtonControllers = [];
      this.levelUpButtonObjects = objects;
      this.levelUpRerollButtonController = null;
      this.levelUpRerollButton = rerollButton;
      this.levelUpRerollLabel = rerollLabel;
      this.levelUpSkipButtonController = null;
      this.levelUpSkipButton = skipButton;
      this.updateRerollButtonState();
    } catch (error) {
      for (const object of objects) {
        if (object?.active) object.destroy();
      }
      this.destroyLevelUpButtons();
      throw error;
    }
  },


  updateRerollButtonState() {
    if (!this.levelUpRerollLabel) {
      return;
    }
    this.levelUpRerollLabel.setText(`重抽（剩 ${this.rerollsRemaining}）`);
    const enabled = this.rerollsRemaining > 0;
    if (this.levelUpRerollButtonController) {
      this.levelUpRerollButtonController.setState(enabled ? "idle" : "disabled");
      return;
    }
    this.levelUpRerollLabel.setColor(enabled ? "#dfe8ff" : "#6b7590");
    this.levelUpRerollButton.setStrokeStyle(2, enabled ? 0x5f78b0 : 0x3a4256);
  },


  rerollLevelUpChoices() {
    if (this.isResolvingLevelUp || this.rerollsRemaining <= 0) {
      return;
    }
    this.rerollsRemaining -= 1;
    try {
      this.renderLevelUpCards();
    } catch {
      if (this.levelUpOverlayController) {
        if (!this.replaceFailedTerminalWithLegacyLevelUpOverlay()) return;
      } else {
        this.handleLevelUpPresentationFailure();
        return;
      }
    }
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
      this.destroyLevelUpOverlay();
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
    if (this.levelUpOverlayController) {
      selectedCard.setState("selected");
      selectedCard.hitArea.disableInteractive();
    } else {
      selectedCard.setStrokeStyle(4, 0xffdd66);
      selectedCard.setFillStyle(0x35527a, 1);
    }

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

      this.destroyLevelUpOverlay();
      this.isLevelUpActive = false;
      this.isResolvingLevelUp = false;
      this.resumeGameplaySystems();
      this.updateUI();
    });
  },


  destroyLevelUpCards() {
    for (const card of this.levelUpCards ?? []) {
      card?.disableInteractive?.();
      card?.destroy?.();
    }
    for (const object of this.levelUpCardObjects ?? []) {
      if (object?.active) object.destroy();
    }
    this.levelUpCards = [];
    this.levelUpCardObjects = [];
  },


  destroyLevelUpButtons() {
    for (const controller of this.levelUpButtonControllers ?? []) {
      controller?.destroy?.();
    }
    for (const object of this.levelUpButtonObjects ?? []) {
      if (object?.active) object.destroy();
    }
    this.levelUpButtonControllers = [];
    this.levelUpButtonObjects = [];
    this.levelUpRerollButtonController = null;
    this.levelUpRerollButton = null;
    this.levelUpRerollLabel = null;
    this.levelUpSkipButtonController = null;
    this.levelUpSkipButton = null;
  },


  destroyLevelUpOverlay() {
    this.destroyLevelUpCards();
    this.destroyLevelUpButtons();
    if (this.levelUpOverlayController) {
      this.levelUpOverlayController.destroy();
    } else if (this.levelUpOverlay?.active) {
      this.levelUpOverlay.destroy(true);
    }
    this.levelUpOverlayController = null;
    this.levelUpOverlay = null;
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
