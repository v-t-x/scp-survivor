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

// Domain mixin: hud. Methods are Object.assign'd onto PrototypeScene.prototype.
export const hudMixin = {

  createUI() {
    this.statsText = this.add.text(14, 12, "", {
      fontSize: "18px",
      color: "#e2e8ff"
    });
    this.statsText.setDepth(45);
    this.statsText.setScrollFactor(0);

    this.levelText = this.add.text(14, 40, "", {
      fontSize: "18px",
      color: "#a7f3d0"
    });
    this.levelText.setDepth(45);
    this.levelText.setScrollFactor(0);

    this.xpBarBackground = this.add.rectangle(15, 72, 250, 14, 0x223344, 1);
    this.xpBarBackground.setOrigin(0, 0);
    this.xpBarBackground.setDepth(45);
    this.xpBarBackground.setScrollFactor(0);

    this.xpBarFill = this.add.rectangle(16, 73, 248, 12, 0x54d67b, 1);
    this.xpBarFill.setOrigin(0, 0);
    this.xpBarFill.setDepth(46);
    this.xpBarFill.setScrollFactor(0);

    this.xpText = this.add.text(272, 67, "", {
      fontSize: "16px",
      color: "#e2e8ff"
    });
    this.xpText.setDepth(45);
    this.xpText.setScrollFactor(0);

    this.muteText = this.add.text(GAME_WIDTH - 14, 14, "", {
      fontSize: "14px",
      color: "#d5d5ff"
    });
    this.muteText.setOrigin(1, 0);
    this.muteText.setDepth(45);
    this.muteText.setScrollFactor(0);
    this.updateMuteText();

    // Pause button (top-right, below the mute readout). Also bound to ESC.
    this.pauseButton = this.add.rectangle(GAME_WIDTH - 20, 44, 96, 30, 0x243049, 0.9);
    this.pauseButton.setOrigin(1, 0);
    this.pauseButton.setStrokeStyle(1, 0x5f78b0);
    this.pauseButton.setDepth(45);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerover", () => this.pauseButton.setFillStyle(0x33436a, 0.95));
    this.pauseButton.on("pointerout", () => this.pauseButton.setFillStyle(0x243049, 0.9));
    this.pauseButton.on("pointerdown", () => this.togglePause());

    this.pauseButtonLabel = this.add.text(GAME_WIDTH - 68, 49, "暂停 (ESC)", {
      fontSize: "13px",
      color: "#dfe8ff"
    });
    this.pauseButtonLabel.setOrigin(0.5, 0);
    this.pauseButtonLabel.setDepth(46);
    this.pauseButtonLabel.setScrollFactor(0);

    this.pickupRadiusIndicator = this.add.graphics();
    this.pickupRadiusIndicator.setDepth(4);

    this.weaponHudText = this.add.text(14, 98, "", {
      fontSize: "14px",
      color: "#cbd8ff",
      lineSpacing: 3
    });
    this.weaponHudText.setDepth(45);
    this.weaponHudText.setScrollFactor(0);

    this.phaseText = this.add.text(14, 148, "", {
      fontSize: "14px",
      color: "#ffdf9a"
    });
    this.phaseText.setDepth(45);
    this.phaseText.setScrollFactor(0);

    this.eventBannerContainer = this.add.container(0, 0);
    this.eventBannerContainer.setDepth(58);
    this.eventBannerContainer.setScrollFactor(0);
    this.eventBannerContainer.setVisible(false);
    this.eventBannerBg = this.add.rectangle(GAME_WIDTH / 2, 30, 640, 52, 0x000000, 0.78);
    this.eventBannerBg.setStrokeStyle(2, 0x5f7cb8);
    this.eventBannerTitle = this.add.text(GAME_WIDTH / 2, 20, "", {
      fontSize: "18px",
      color: "#fff2be"
    });
    this.eventBannerTitle.setOrigin(0.5);
    this.eventBannerDetail = this.add.text(GAME_WIDTH / 2, 38, "", {
      fontSize: "13px",
      color: "#d8e6ff"
    });
    this.eventBannerDetail.setOrigin(0.5);
    this.eventBannerContainer.add([
      this.eventBannerBg,
      this.eventBannerTitle,
      this.eventBannerDetail
    ]);

    this.outageDarknessRt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.outageDarknessRt.setOrigin(0, 0);
    this.outageDarknessRt.setScrollFactor(0);
    this.outageDarknessRt.setDepth(40);
    this.outageDarknessRt.setVisible(false);
    this.outageLightSprite = this.add.image(0, 0, "power-outage-light");
    this.outageLightSprite.setVisible(false);
    this.outageLightSprite.setOrigin(0.5);

    this.timelineHudBasePositions = [
      [this.statsText, this.statsText.x, this.statsText.y],
      [this.levelText, this.levelText.x, this.levelText.y],
      [this.xpText, this.xpText.x, this.xpText.y],
      [this.weaponHudText, this.weaponHudText.x, this.weaponHudText.y],
      [this.phaseText, this.phaseText.x, this.phaseText.y]
    ];
  },


  updateMuteText() {
    if (!this.muteText) {
      return;
    }
    if (!BALANCE.audio.enabled) {
      this.muteText.setText("音频：关闭");
      return;
    }
    this.muteText.setText(this.soundMuted ? "音频：静音 (M)" : "音频：开启 (M)");
  },


  setGameplayHudVisible(isVisible) {
    const targets = [
      this.statsText,
      this.levelText,
      this.xpBarBackground,
      this.xpBarFill,
      this.xpText,
      this.muteText,
      this.pauseButton,
      this.pauseButtonLabel,
      this.weaponHudText,
      this.phaseText,
      this.pickupRadiusIndicator
    ];
    for (const target of targets) {
      if (target) {
        target.setVisible(isVisible);
      }
    }
  },


  createBuildPanel() {
    this.buildPanel = this.add.container(0, 0);
    this.buildPanel.setDepth(56);
    this.buildPanel.setScrollFactor(0);
    this.buildPanel.setVisible(false);

    const panelBackground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      500,
      560,
      0x000000,
      0.78
    );
    panelBackground.setStrokeStyle(2, 0x4060a0);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 250, "当前构筑 (TAB)", {
      fontSize: "28px",
      color: "#ffffff"
    });
    title.setOrigin(0.5);

    this.buildPanelText = this.add.text(
      GAME_WIDTH / 2 - 220,
      GAME_HEIGHT / 2 - 218,
      "",
      {
        fontSize: "16px",
        color: "#e9f0ff",
        lineSpacing: 6
      }
    );

    this.buildPanel.add([panelBackground, title, this.buildPanelText]);
  },


  toggleBuildPanel() {
    if (this.isGameOver || this.isLevelUpActive) {
      return;
    }

    this.buildPanel.setVisible(!this.buildPanel.visible);
    if (this.buildPanel.visible) {
      this.updateBuildPanelText();
    }
  },


  hideBuildPanel() {
    if (this.buildPanel) {
      this.buildPanel.setVisible(false);
    }
  },


  updateBuildPanelText() {
    const pistol = this.weapons.pistol;
    const shotgun = this.weapons.shotgun;
    const tesla = this.weapons.tesla;
    const attacksPerSecond = (1000 / pistol.cooldownMs).toFixed(2);
    const upgradeLines = UPGRADE_DEFINITIONS.map(
      (upgrade) => `${upgrade.name}：Lv ${this.upgradeLevels[upgrade.key]}`
    ).join("\n");

    this.buildPanelText.setText(
      [
        `伤害倍率：x${(pistol.damage / BALANCE.weapons.pistol.baseDamage).toFixed(2)}`,
        `攻击冷却：${pistol.cooldownMs.toFixed(0)} ms (${attacksPerSecond}/秒)`,
        `移动速度：${this.playerMoveSpeed.toFixed(0)}`,
        `最大生命值：${this.maxHealth}`,
        `弹丸数量：${this.projectileCount}`,
        `弹丸穿透：${this.bulletPenetration}`,
        `拾取范围：${this.pickupRadius.toFixed(0)}`,
        "",
        `武器`,
        `- 手枪 Lv ${pistol.currentLevel}：伤害 ${pistol.damage.toFixed(1)}，冷却 ${pistol.cooldownMs.toFixed(0)}ms`,
        shotgun.unlocked
          ? `- 突破器 Lv ${shotgun.currentLevel}：伤害 ${shotgun.damage.toFixed(1)} x ${shotgun.pelletCount}，冷却 ${shotgun.cooldownMs.toFixed(0)}ms，弹药 ${shotgun.currentShells}/${shotgun.magazineSize}，装填 ${shotgun.reloadDurationMs}ms`
          : `- 突破器：未解锁`,
        tesla.unlocked
          ? `- 特斯拉 Lv ${tesla.currentLevel}：伤害 ${tesla.damage.toFixed(1)}，链击 ${tesla.chainTargets}，冷却 ${tesla.cooldownMs.toFixed(0)}ms，射程 ${tesla.range.toFixed(0)}`
          : `- 特斯拉：未解锁`,
        "",
        "升级等级",
        upgradeLines
      ].join("\n")
    );
  },


  updateUI() {
    const elapsedSeconds = this.elapsedSurvivalMs / 1000;

    this.statsText.setText(
      `生命：${Math.floor(this.health)} / ${this.maxHealth}   时间：${elapsedSeconds.toFixed(1)}秒   击杀：${this.killCount}`
    );
    this.levelText.setText(`等级：${this.level}`);

    const xpProgress = Phaser.Math.Clamp(this.currentXp / this.xpToNextLevel, 0, 1);
    this.xpBarFill.width = 248 * xpProgress;
    this.xpText.setText(`${this.currentXp} / ${this.xpToNextLevel} 经验`);
    this.updateWeaponHud();
    this.updatePhaseHud();
  },


  updateWeaponHud() {
    if (!this.isMissionActive || !this.selectedWeaponId) {
      this.weaponHudText.setText("");
      return;
    }

    const lines = [];
    if (this.selectedWeaponId === "pistol") {
      const pistol = this.weapons.pistol;
      const fireRate = (1000 / pistol.cooldownMs).toFixed(2);
      lines.push(`■ ${pistol.name} — 等级 ${pistol.currentLevel}`);
      lines.push(`伤害 ${pistol.damage.toFixed(1)} | ${fireRate}/秒`);
    } else if (this.selectedWeaponId === "shotgun") {
      const breacher = this.weapons.shotgun;
      const status = breacher.isReloading
        ? `装填 ${(
            Math.max(0, breacher.reloadEndAtMs - this.elapsedSurvivalMs) / 1000
          ).toFixed(1)}秒`
        : `弹药 ${breacher.currentShells}/${breacher.magazineSize}`;
      lines.push(`▲ ${breacher.name} — 等级 ${breacher.currentLevel}`);
      lines.push(`${status} | 弹丸伤害 ${breacher.damage.toFixed(1)}`);
    } else if (this.selectedWeaponId === "tesla") {
      const tesla = this.weapons.tesla;
      const cdLeft = Math.max(0, tesla.nextAttackAtMs - this.elapsedSurvivalMs);
      lines.push(`≈ ${tesla.name} — 等级 ${tesla.currentLevel}`);
      lines.push(`链击 ${tesla.chainTargets} | 放电 ${(cdLeft / 1000).toFixed(1)}秒`);
    }

    const dashCdLeft = Math.max(0, this.dashReadyAtMs - this.elapsedSurvivalMs);
    lines.push(
      dashCdLeft > 0
        ? `闪避(空格) 冷却 ${(dashCdLeft / 1000).toFixed(1)}秒`
        : `闪避(空格) 就绪`
    );

    this.weaponHudText.setText(lines.join("\n"));
  },


  updatePickupRadiusIndicator() {
    this.pickupRadiusIndicator.clear();
    this.pickupRadiusIndicator.fillStyle(0x50d66c, 0.1);
    this.pickupRadiusIndicator.lineStyle(1, 0x50d66c, 0.35);
    this.pickupRadiusIndicator.fillCircle(this.player.x, this.player.y, this.pickupRadius);
    this.pickupRadiusIndicator.strokeCircle(this.player.x, this.player.y, this.pickupRadius);
  },


  showTopBanner(title, detail, durationMs = 1500) {
    if (!this.eventBannerContainer) {
      return;
    }
    this.eventBannerTitle.setText(title);
    this.eventBannerDetail.setText(detail);
    this.eventBannerContainer.setVisible(true);
    this.eventBannerContainer.setAlpha(1);
    this.topBannerState = {
      expiresAtMs: this.elapsedSurvivalMs + durationMs
    };
  },


  updateTopBanner() {
    if (!this.eventBannerContainer?.visible || !this.topBannerState) {
      return;
    }
    if (this.elapsedSurvivalMs >= this.topBannerState.expiresAtMs) {
      this.eventBannerContainer.setVisible(false);
      this.eventBannerContainer.setAlpha(1);
      this.topBannerState = null;
      return;
    }
    const remaining = this.topBannerState.expiresAtMs - this.elapsedSurvivalMs;
    if (remaining < 280) {
      this.eventBannerContainer.setAlpha(remaining / 280);
    } else {
      this.eventBannerContainer.setAlpha(1);
    }
  }
};
