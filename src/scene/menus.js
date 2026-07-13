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
import { createTitleBackdrop } from "../art/titleBackdrop.js";
import { createTitleScreenView } from "../art/titleScreenView.js";
import { createArmorySlot } from "../art/weaponSelectionView.js";
import { THEME } from "../ui/theme.js";
import { createTerminalButton } from "../ui/tacticalUi.js";

// Domain mixin: menus. Methods are Object.assign'd onto PrototypeScene.prototype.
export const menusMixin = {

  createStartScreen() {
    this.setGameplayHudVisible(false);
    this.cameras.main.setBackgroundColor(THEME.surface.facility);
    this.startScreenObjects = [];
    this.titleBackdropController = createTitleBackdrop(this, this.startScreenObjects, 7);
    this.titleScreenController = createTitleScreenView(this, this.startScreenObjects, {
      credits: this.meta.credits,
      depth: 20,
      onActivate: () => this.beginFromStartScreen()
    });
  },


  beginFromStartScreen() {
    this.destroyStartScreen();
    this.createWeaponSelectionScreen();
  },


  destroyStartScreen() {
    this.titleScreenController?.stop();
    this.titleScreenController = null;
    this.titleBackdropController?.stop();
    this.titleBackdropController = null;
    if (!this.startScreenObjects) {
      return;
    }
    for (const object of this.startScreenObjects) {
      if (object?.active) {
        object.destroy();
      }
    }
    this.startScreenObjects = null;
  },


  createWeaponSelectionScreen() {
    this.setGameplayHudVisible(false);
    this.cameras.main.setBackgroundColor(THEME.surface.facility);
    this.weaponSelectOverlay = null;
    this.weaponSelectUiObjects = [];
    this.weaponSelectHoveredCardId = null;
    this.weaponSelectButtonHovered = false;

    const armoryBackdrop = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURES.armoryRackBackdrop);
    armoryBackdrop.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    armoryBackdrop.setDepth(0);
    const contrastVeil = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      THEME.surface.facility,
      0.24
    );
    contrastVeil.setDepth(1);
    const commandRail = this.add.rectangle(
      GAME_WIDTH / 2,
      48,
      GAME_WIDTH,
      96,
      THEME.terminal.panelFill,
      0.9
    );
    commandRail.setDepth(10);
    const lowerRail = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 39,
      GAME_WIDTH,
      78,
      THEME.terminal.panelFill,
      0.94
    );
    lowerRail.setDepth(10);
    this.weaponSelectUiObjects.push(armoryBackdrop, contrastVeil, commandRail, lowerRail);

    const title = this.add.text(GAME_WIDTH / 2, 34, "军械库 / 主武器授权", {
      fontFamily: THEME.font.display,
      fontSize: "30px",
      fontStyle: "bold",
      color: THEME.text.primary
    });
    title.setShadow(0, 2, "#05080f", 5, false, true);
    title.setOrigin(0.5);
    title.setDepth(21);
    this.weaponSelectUiObjects.push(title);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      70,
      "选择装备槽位，锁定后确认部署。",
      {
        fontFamily: THEME.font.body,
        fontSize: "14px",
        color: THEME.text.secondary
      }
    );
    subtitle.setOrigin(0.5);
    subtitle.setDepth(21);
    this.weaponSelectUiObjects.push(subtitle);

    this.weaponSelectCards = [];
    const options = [
      {
        id: "pistol",
        textureKey: TEXTURES.weaponPistolIcon,
        role: "可靠的中远距离单体武器",
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.pistol.baseDamage}` },
          { label: "冷却", value: `${BALANCE.weapons.pistol.baseCooldownMs} ms` },
          { label: "射程", value: `${BALANCE.weapons.pistol.range}` }
        ]
      },
      {
        id: "shotgun",
        textureKey: TEXTURES.weaponBreacherIcon,
        role: "近距离爆发、击退与控场",
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.shotgun.baseDamage}/弹丸` },
          { label: "弹药", value: "4" },
          { label: "装填", value: "2000 ms" }
        ]
      },
      {
        id: "tesla",
        textureKey: TEXTURES.weaponTeslaIcon,
        role: "对密集敌群造成链式伤害",
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.tesla.baseDamage}` },
          { label: "冷却", value: `${BALANCE.weapons.tesla.baseCooldownMs} ms` },
          { label: "链击", value: `${BALANCE.weapons.tesla.baseChainTargets}` }
        ]
      }
    ];

    const slotWidth = 228;
    const slotHeight = 316;
    const startX = GAME_WIDTH / 2 - 270;
    options.forEach((option, index) => {
      const slotX = startX + index * 270;
      const slotY = 286;
      const slot = createArmorySlot(this, {
        x: slotX,
        y: slotY,
        width: slotWidth,
        height: slotHeight,
        textureKey: option.textureKey,
        name: BALANCE.weapons[option.id].name,
        role: option.role,
        stats: option.stats,
        depth: 20,
        scrollFactor: 0,
        nameStyle: {
          fontFamily: THEME.font.display,
          fontSize: "20px",
          fontStyle: "bold",
          color: THEME.text.primary,
          align: "center",
          wordWrap: { width: 196 }
        },
        roleStyle: {
          fontFamily: THEME.font.body,
          fontSize: "13px",
          color: THEME.text.secondary,
          align: "center",
          wordWrap: { width: 188 }
        },
        statsStyle: {
          fontFamily: THEME.font.mono,
          fontSize: "13px",
          color: THEME.text.primary,
          align: "left",
          lineSpacing: 5
        },
        lockedStyle: {
          fontFamily: THEME.font.label,
          fontSize: "12px",
          fontStyle: "bold",
          color: THEME.text.contained
        },
        onActivate: () => {
          this.pendingSelectedWeaponId = option.id;
          this.refreshWeaponSelectionVisuals();
        }
      });
      slot.hitArea.on("pointerover", () => {
        this.weaponSelectHoveredCardId = option.id;
        this.refreshWeaponSelectionVisuals();
      });
      slot.hitArea.on("pointerout", () => {
        this.weaponSelectHoveredCardId = null;
        this.refreshWeaponSelectionVisuals();
      });
      this.weaponSelectCards.push({ id: option.id, slot });
      this.weaponSelectUiObjects.push(...slot.objects);
    });

    this.startMissionButtonController = createTerminalButton(this, {
      x: GAME_WIDTH / 2 - 125,
      y: GAME_HEIGHT - 66,
      width: 250,
      height: 52,
      text: "请选择武器",
      state: "idle",
      depth: 30,
      scrollFactor: 0,
      onActivate: () => {
        if (this.pendingSelectedWeaponId) {
          this.startMissionWithWeapon(this.pendingSelectedWeaponId);
        }
      }
    });
    this.startMissionButton = this.startMissionButtonController.hitArea;
    this.startMissionButtonLabel = this.startMissionButtonController.label;
    this.startMissionButton.on("pointerover", () => {
      this.weaponSelectButtonHovered = true;
      this.refreshWeaponSelectionVisuals();
    });
    this.startMissionButton.on("pointerout", () => {
      this.weaponSelectButtonHovered = false;
      this.refreshWeaponSelectionVisuals();
    });
    this.weaponSelectUiObjects.push(...this.startMissionButtonController.objects);

    // Meta progression: credits display + unlock-store entry.
    this.weaponSelectCreditsLabel = this.add.text(
      28,
      108,
      `学分：${this.meta.credits}`,
      {
        fontFamily: THEME.font.label,
        fontSize: "18px",
        fontStyle: "bold",
        color: THEME.text.secondary
      }
    );
    this.weaponSelectCreditsLabel.setOrigin(0, 0.5);
    this.weaponSelectCreditsLabel.setDepth(31);

    const unlockButton = this.add.rectangle(
      GAME_WIDTH - 94,
      108,
      140,
      40,
      THEME.surface.raised,
      1
    );
    unlockButton.setStrokeStyle(2, THEME.signal.anomaly);
    unlockButton.setDepth(31);
    unlockButton.setInteractive({ useHandCursor: true });
    unlockButton.on("pointerover", () => unlockButton.setFillStyle(THEME.border.default, 1));
    unlockButton.on("pointerout", () => unlockButton.setFillStyle(THEME.surface.raised, 1));
    unlockButton.on("pointerdown", () => this.openPerkStore());

    const unlockLabel = this.add.text(
      GAME_WIDTH - 94,
      108,
      "解锁商店",
      {
        fontFamily: THEME.font.label,
        fontSize: "17px",
        fontStyle: "bold",
        color: THEME.text.secondary
      }
    );
    unlockLabel.setOrigin(0.5);
    unlockLabel.setDepth(32);

    this.weaponSelectUiObjects.push(
      this.weaponSelectCreditsLabel,
      unlockButton,
      unlockLabel
    );

    // The camera follows the player at world center, so all selection UI must
    // be pinned to the screen to stay visible and centered.
    for (const object of this.weaponSelectUiObjects) {
      object.setScrollFactor?.(0);
    }
    this.refreshWeaponSelectionVisuals();
  },


  refreshWeaponSelectionVisuals() {
    for (const entry of this.weaponSelectCards) {
      const selected = this.pendingSelectedWeaponId === entry.id;
      const hovered = this.weaponSelectHoveredCardId === entry.id;
      entry.slot.setState({ selected, hovered });
    }

    const canStart = !!this.pendingSelectedWeaponId;
    const terminalState = canStart
      ? this.weaponSelectButtonHovered
        ? "hover"
        : "armed"
      : "disabled";
    this.startMissionButtonController.setState(terminalState);
    this.startMissionButtonLabel.setText(canStart ? "开始任务" : "请选择武器");
  },


  destroyWeaponSelectionScreen() {
    this.closePerkStore();
    if (!this.weaponSelectUiObjects) {
      return;
    }
    for (const object of this.weaponSelectUiObjects) {
      if (object?.active) {
        object.destroy();
      }
    }
    this.weaponSelectUiObjects = [];
    this.weaponSelectCards = [];
    this.weaponSelectOverlay = null;
    this.startMissionButtonController = null;
    this.startMissionButton = null;
    this.startMissionButtonLabel = null;
  },


  openPerkStore() {
    if (this.perkStoreObjects) {
      return;
    }
    this.perkStoreObjects = [];

    const panelW = 560;
    const panelH = 420;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const backdrop = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    backdrop.setDepth(60);
    backdrop.setInteractive();
    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x141c2f, 1);
    panel.setStrokeStyle(2, 0x8f78c8);
    panel.setDepth(61);

    const title = this.add.text(cx, cy - panelH / 2 + 30, "解锁商店（永久起始加成）", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
      fontSize: "24px",
      fontStyle: "bold",
      color: "#e2c6ff"
    });
    title.setOrigin(0.5);
    title.setDepth(62);

    this.perkStoreCreditsLabel = this.add.text(
      cx,
      cy - panelH / 2 + 60,
      `学分：${this.meta.credits}`,
      {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "18px",
        color: "#ffe08a"
      }
    );
    this.perkStoreCreditsLabel.setOrigin(0.5);
    this.perkStoreCreditsLabel.setDepth(62);

    this.perkStoreObjects.push(backdrop, panel, title, this.perkStoreCreditsLabel);

    const rowStartY = cy - panelH / 2 + 100;
    const rowHeight = 64;
    this.perkStoreRows = [];
    META_PERKS.forEach((perk, index) => {
      const rowY = rowStartY + index * rowHeight;

      const nameText = this.add.text(cx - panelW / 2 + 26, rowY, perk.name, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "18px",
        fontStyle: "bold",
        color: "#f2f6ff"
      });
      nameText.setOrigin(0, 0.5);
      nameText.setDepth(62);

      const descText = this.add.text(
        cx - panelW / 2 + 26,
        rowY + 20,
        `${perk.description}  （${perk.cost} 学分）`,
        {
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
          fontSize: "14px",
          color: "#9fb2d8"
        }
      );
      descText.setOrigin(0, 0.5);
      descText.setDepth(62);

      const actionButton = this.add.rectangle(cx + panelW / 2 - 70, rowY + 8, 96, 40, 0x2d3a55, 1);
      actionButton.setDepth(62);
      const actionLabel = this.add.text(cx + panelW / 2 - 70, rowY + 8, "", {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "16px",
        fontStyle: "bold",
        color: "#dfe8ff"
      });
      actionLabel.setOrigin(0.5);
      actionLabel.setDepth(63);
      actionButton.setInteractive({ useHandCursor: true });
      actionButton.on("pointerdown", () => this.purchasePerk(perk.key));

      this.perkStoreRows.push({ perk, actionButton, actionLabel });
      this.perkStoreObjects.push(nameText, descText, actionButton, actionLabel);
    });

    const closeButton = this.add.rectangle(cx, cy + panelH / 2 - 34, 160, 44, 0x3f4a63, 1);
    closeButton.setStrokeStyle(2, 0x6a7796);
    closeButton.setDepth(62);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.on("pointerover", () => closeButton.setFillStyle(0x4d5a78, 1));
    closeButton.on("pointerout", () => closeButton.setFillStyle(0x3f4a63, 1));
    closeButton.on("pointerdown", () => this.closePerkStore());
    const closeLabel = this.add.text(cx, cy + panelH / 2 - 34, "返回", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
      fontSize: "18px",
      color: "#ffffff"
    });
    closeLabel.setOrigin(0.5);
    closeLabel.setDepth(63);
    this.perkStoreObjects.push(closeButton, closeLabel);

    for (const object of this.perkStoreObjects) {
      object.setScrollFactor?.(0);
    }
    this.refreshPerkStore();
  },


  refreshPerkStore() {
    if (!this.perkStoreRows) {
      return;
    }
    this.perkStoreCreditsLabel.setText(`学分：${this.meta.credits}`);
    for (const row of this.perkStoreRows) {
      const owned = !!this.meta.perks[row.perk.key];
      const affordable = this.meta.credits >= row.perk.cost;
      if (owned) {
        row.actionButton.setFillStyle(0x2f4a3a, 1);
        row.actionLabel.setText("已解锁");
        row.actionLabel.setColor("#9fe6b8");
        row.actionButton.disableInteractive();
      } else {
        row.actionButton.setFillStyle(affordable ? 0x35527a : 0x2a3242, 1);
        row.actionLabel.setText("解锁");
        row.actionLabel.setColor(affordable ? "#dfe8ff" : "#6f7a90");
        row.actionButton.setInteractive({ useHandCursor: true });
      }
    }
  },


  purchasePerk(perkKey) {
    const perk = META_PERKS.find((entry) => entry.key === perkKey);
    if (!perk || this.meta.perks[perkKey] || this.meta.credits < perk.cost) {
      return;
    }
    this.meta.credits -= perk.cost;
    this.meta.perks[perkKey] = true;
    saveMetaProgress(this.meta);
    this.playSound("levelUp");
    if (this.weaponSelectCreditsLabel?.active) {
      this.weaponSelectCreditsLabel.setText(`学分：${this.meta.credits}`);
    }
    this.refreshPerkStore();
  },


  closePerkStore() {
    if (!this.perkStoreObjects) {
      return;
    }
    for (const object of this.perkStoreObjects) {
      if (object?.active) {
        object.destroy();
      }
    }
    this.perkStoreObjects = null;
    this.perkStoreRows = null;
    this.perkStoreCreditsLabel = null;
  },


  startMissionWithWeapon(weaponId) {
    if (!weaponId) {
      return;
    }
    this.selectedWeaponId = weaponId;
    this.pendingSelectedWeaponId = weaponId;
    this.isMissionActive = true;
    this.elapsedSurvivalMs = 0;
    this.powerOutageTriggered = false;
    this.bossWarningShown = false;
    this.regularSpawningActive = true;
    this.survivalPhaseEnded = false;
    this.scp500Spawned = false;
    this.bossPhaseActive = false;
    this.bossEnemy = null;
    this.bossIntroTimer = null;
    this.activeFacilityEvent = null;
    this.activeFacilityEventEndAtMs = 0;

    this.initWeapons();
    this.syncCombatStatsFromWeapons();
    this.applyUnlockedPerks();
    this.setupSpawning();
    this.cameras.main.setBackgroundColor("#111319");
    this.setGameplayHudVisible(true);
    this.updateUI();

    this.destroyWeaponSelectionScreen();
  },


  showGameOverOverlay() {
    const finalTime = this.getFinalSurvivalTimeSeconds();

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      420,
      280,
      0x000000,
      0.7
    );
    overlay.setDepth(50);
    overlay.setScrollFactor(0);

    const gameOverText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 90,
      "游戏结束",
      {
        fontSize: "46px",
        color: "#ffffff"
      }
    );
    gameOverText.setDepth(51);
    gameOverText.setOrigin(0.5);
    gameOverText.setScrollFactor(0);

    const finalStatsText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 20,
      `最终生存时间：${finalTime}秒\n最终击杀数：${this.killCount}\n获得学分：+${this.lastRunCreditsEarned ?? 0}（累计 ${this.meta.credits}）`,
      {
        fontSize: "22px",
        color: "#d7defa",
        align: "center"
      }
    );
    finalStatsText.setDepth(51);
    finalStatsText.setOrigin(0.5);
    finalStatsText.setScrollFactor(0);

    const restartButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 78,
      170,
      52,
      0x3f82ff,
      1
    );
    restartButton.setDepth(51);
    restartButton.setScrollFactor(0);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerdown", () => {
      this.scene.restart();
    });

    const restartLabel = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 78,
      "重新开始",
      {
        fontSize: "25px",
        color: "#ffffff"
      }
    );
    restartLabel.setDepth(52);
    restartLabel.setOrigin(0.5);
    restartLabel.setScrollFactor(0);
  },


  triggerGameOver() {
    this.isGameOver = true;
    this.isVictory = false;
    this.lastRunCreditsEarned = this.awardRunCredits(false);
    this.freezeForGameOver();
    this.updateUI();
    this.showGameOverOverlay();
  },


  showVictoryOverlay() {
    const finalTime = this.getFinalSurvivalTimeSeconds();
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      480,
      320,
      0x000000,
      0.72
    );
    overlay.setDepth(50);
    overlay.setStrokeStyle(2, 0x7bd7a8);
    overlay.setScrollFactor(0);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 98, "任务完成", {
      fontSize: "44px",
      color: "#cbffe1"
    });
    title.setOrigin(0.5);
    title.setDepth(51);
    title.setScrollFactor(0);

    const detail = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 12,
      `SCP-049 已被成功收容。\n生存时间：${finalTime}秒\n击杀数：${this.killCount}\n获得学分：+${this.lastRunCreditsEarned ?? 0}（累计 ${this.meta.credits}）`,
      {
        fontSize: "22px",
        color: "#d7defa",
        align: "center"
      }
    );
    detail.setOrigin(0.5);
    detail.setDepth(51);
    detail.setScrollFactor(0);

    const restartButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 92,
      170,
      52,
      0x4da07b,
      1
    );
    restartButton.setDepth(51);
    restartButton.setScrollFactor(0);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerdown", () => {
      this.scene.restart();
    });

    const restartLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 92, "重新开始", {
      fontSize: "25px",
      color: "#ffffff"
    });
    restartLabel.setOrigin(0.5);
    restartLabel.setDepth(52);
    restartLabel.setScrollFactor(0);
  },


  triggerVictory() {
    if (this.isGameOver) {
      return;
    }
    this.isGameOver = true;
    this.isVictory = true;
    this.lastRunCreditsEarned = this.awardRunCredits(true);
    this.freezeForGameOver();
    this.updateUI();
    this.showVictoryOverlay();
  },


  showPauseOverlay() {
    if (this.pauseOverlay) {
      return;
    }
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const fontFamily =
      '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif';

    this.pauseOverlay = this.add.container(0, 0);
    this.pauseOverlay.setDepth(70);
    // Camera follows the player, so keep the overlay in world space at the
    // current viewport (not scrollFactor 0) or the interactive hit areas end up
    // offset from where the buttons are drawn — same fix as the level-up menu.
    this.syncScreenOverlayPosition(this.pauseOverlay);

    const backdrop = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.65);
    backdrop.setInteractive();
    const panel = this.add.rectangle(cx, cy, 420, 300, 0x141c2f, 1);
    panel.setStrokeStyle(2, 0x6f91d8);

    const title = this.add.text(cx, cy - 100, "已暂停", {
      fontFamily,
      fontSize: "44px",
      fontStyle: "bold",
      color: "#f4f7ff"
    });
    title.setOrigin(0.5);

    const resumeButton = this.add.rectangle(cx, cy - 12, 240, 54, 0x2a3242, 1);
    resumeButton.setStrokeStyle(2, 0x6f91d8);
    resumeButton.setInteractive({ useHandCursor: true });
    resumeButton.on("pointerover", () => resumeButton.setFillStyle(0x39527f, 1));
    resumeButton.on("pointerout", () => resumeButton.setFillStyle(0x2a3242, 1));
    resumeButton.on("pointerdown", () => this.resumeFromPause());
    const resumeLabel = this.add.text(cx, cy - 12, "继续游戏", {
      fontFamily,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffffff"
    });
    resumeLabel.setOrigin(0.5);

    const quitButton = this.add.rectangle(cx, cy + 62, 240, 54, 0x3a2530, 1);
    quitButton.setStrokeStyle(2, 0xb06a78);
    quitButton.setInteractive({ useHandCursor: true });
    quitButton.on("pointerover", () => quitButton.setFillStyle(0x53303e, 1));
    quitButton.on("pointerout", () => quitButton.setFillStyle(0x3a2530, 1));
    quitButton.on("pointerdown", () => this.quitToTitle());
    const quitLabel = this.add.text(cx, cy + 62, "返回标题", {
      fontFamily,
      fontSize: "22px",
      fontStyle: "bold",
      color: "#ffd9df"
    });
    quitLabel.setOrigin(0.5);

    this.pauseOverlay.add([
      backdrop,
      panel,
      title,
      resumeButton,
      resumeLabel,
      quitButton,
      quitLabel
    ]);
  },


  hidePauseOverlay() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy(true);
      this.pauseOverlay = null;
    }
  },


  togglePause() {
    // Only meaningful during an active mission, and never on top of the
    // level-up overlay (which has its own pause) or the game-over screen.
    if (!this.isMissionActive || this.isGameOver || this.isLevelUpActive) {
      return;
    }
    if (this.isPaused) {
      this.resumeFromPause();
    } else {
      this.pauseGame();
    }
  },


  pauseGame() {
    this.isPaused = true;
    this.pauseGameplaySystems();
    this.showPauseOverlay();
  },


  resumeFromPause() {
    this.isPaused = false;
    this.hidePauseOverlay();
    this.resumeGameplaySystems();
  },


  quitToTitle() {
    // Return to the title screen; a fresh create() resets all run state.
    this.isPaused = false;
    this.hidePauseOverlay();
    this.scene.restart();
  },


  getFinalSurvivalTimeSeconds() {
    return (this.elapsedSurvivalMs / 1000).toFixed(1);
  },


  freezeForGameOver() {
    this.pauseGameplaySystems();
    this.clearCombatEntities();
    this.activeStimUntilMs = 0;
    this.moveSpeedBuffMultiplier = 1;
    this.clearFacilitySystems();

    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy(true);
      this.levelUpOverlay = null;
    }
    this.levelUpCards = [];
    this.isLevelUpActive = false;
    this.isResolvingLevelUp = false;
    this.isPaused = false;
    this.hidePauseOverlay();
    this.hideBuildPanel();
    this.pickupRadiusIndicator.clear();
  }
};
