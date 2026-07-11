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
import { THEME } from "../ui/theme.js";

// Domain mixin: menus. Methods are Object.assign'd onto PrototypeScene.prototype.
export const menusMixin = {

  createStartScreen() {
    this.setGameplayHudVisible(false);
    this.cameras.main.setBackgroundColor(THEME.surface.facility);
    this.startScreenObjects = [];

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, THEME.surface.facility, 1);
    bg.setDepth(10);
    this.startScreenObjects.push(bg);

    const title = this.add.text(cx, cy - 130, "SCP：幸存者", {
      fontFamily: THEME.font.display,
      fontSize: "64px",
      fontStyle: "bold",
      color: THEME.text.primary
    });
    title.setShadow(0, 3, "#04070e", 8, false, true);
    title.setOrigin(0.5);
    title.setDepth(11);
    this.startScreenObjects.push(title);

    const subtitle = this.add.text(
      cx,
      cy - 70,
      "在收容失效的设施中生存到底，收容 SCP-049。",
      {
        fontFamily: THEME.font.body,
        fontSize: "20px",
        color: THEME.text.secondary
      }
    );
    subtitle.setOrigin(0.5);
    subtitle.setDepth(11);
    this.startScreenObjects.push(subtitle);

    const hint = this.add.text(
      cx,
      cy - 8,
      "WASD 移动 · 空格 闪避 · TAB 查看构建 · ESC 暂停 · M 静音",
      {
        fontFamily: THEME.font.label,
        fontSize: "15px",
        color: THEME.text.muted
      }
    );
    hint.setOrigin(0.5);
    hint.setDepth(11);
    this.startScreenObjects.push(hint);

    const startButton = this.add.rectangle(cx, cy + 78, 260, 62, THEME.surface.raised, 1);
    startButton.setStrokeStyle(2, THEME.border.focus);
    startButton.setDepth(11);
    startButton.setInteractive({ useHandCursor: true });
    startButton.on("pointerover", () => startButton.setFillStyle(THEME.border.default, 1));
    startButton.on("pointerout", () => startButton.setFillStyle(THEME.surface.raised, 1));
    startButton.on("pointerdown", () => this.beginFromStartScreen());
    this.startScreenObjects.push(startButton);

    const startLabel = this.add.text(cx, cy + 78, "开始游戏", {
      fontFamily: THEME.font.display,
      fontSize: "28px",
      fontStyle: "bold",
      color: THEME.text.onButton
    });
    startLabel.setOrigin(0.5);
    startLabel.setDepth(12);
    this.startScreenObjects.push(startLabel);

    const facilityStatus = this.add.text(cx, cy + 122, "● 电力正常    ● 收容稳定", {
      fontFamily: THEME.font.label,
      fontSize: "13px",
      color: THEME.text.contained
    });
    facilityStatus.setOrigin(0.5);
    facilityStatus.setDepth(11);
    this.startScreenObjects.push(facilityStatus);

    const creditsHint = this.add.text(
      cx,
      cy + 158,
      `累计学分：${this.meta.credits}（进入后可在解锁商店消费）`,
      {
        fontFamily: THEME.font.label,
        fontSize: "15px",
        color: THEME.text.secondary
      }
    );
    creditsHint.setOrigin(0.5);
    creditsHint.setDepth(11);
    this.startScreenObjects.push(creditsHint);

    for (const object of this.startScreenObjects) {
      object.setScrollFactor?.(0);
    }
  },


  beginFromStartScreen() {
    this.destroyStartScreen();
    this.createWeaponSelectionScreen();
  },


  destroyStartScreen() {
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

    const cardWidth = 250;
    const cardHeight = 318;

    const bg = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      870,
      520,
      THEME.surface.panel,
      1
    );
    bg.setStrokeStyle(2, THEME.border.focus);
    bg.setDepth(10);
    this.weaponSelectUiObjects.push(bg);

    const topAccent = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 246,
      830,
      3,
      THEME.signal.info,
      0.8
    );
    topAccent.setDepth(11);
    this.weaponSelectUiObjects.push(topAccent);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 205, "选择主武器", {
      fontFamily: THEME.font.display,
      fontSize: "48px",
      fontStyle: "bold",
      color: THEME.text.primary
    });
    title.setShadow(0, 2, "#05080f", 5, false, true);
    title.setOrigin(0.5);
    title.setDepth(21);
    this.weaponSelectUiObjects.push(title);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 168,
      "部署前请选择一套装备。",
      {
        fontFamily: THEME.font.body,
        fontSize: "20px",
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
        symbol: "■",
        role: "可靠的中远距离单体武器",
        difficulty: { label: "简单", color: "#7FE29A" },
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.pistol.baseDamage}` },
          { label: "冷却", value: `${BALANCE.weapons.pistol.baseCooldownMs} ms` },
          { label: "射程", value: `${BALANCE.weapons.pistol.range}` }
        ]
      },
      {
        id: "shotgun",
        symbol: "▲",
        role: "近距离爆发、击退与控场",
        difficulty: { label: "中等", color: "#FFD166" },
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.shotgun.baseDamage}/弹丸` },
          { label: "弹药", value: "4" },
          { label: "装填", value: "2000 ms" }
        ]
      },
      {
        id: "tesla",
        symbol: "≈",
        role: "对密集敌群造成链式伤害",
        difficulty: { label: "中等", color: "#FFD166" },
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.tesla.baseDamage}` },
          { label: "冷却", value: `${BALANCE.weapons.tesla.baseCooldownMs} ms` },
          { label: "链击", value: `${BALANCE.weapons.tesla.baseChainTargets}` }
        ]
      }
    ];

    const startX = GAME_WIDTH / 2 - 270;
    options.forEach((option, index) => {
      const cardX = startX + index * 260;
      const cardY = GAME_HEIGHT / 2 + 4;

      const cardBg = this.add.graphics();
      cardBg.setDepth(20);
      const divider = this.add.graphics();
      divider.setDepth(21);

      const cardHitArea = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0xffffff, 0.001);
      cardHitArea.setDepth(20);
      cardHitArea.setInteractive({ useHandCursor: true });
      cardHitArea.on("pointerover", () => {
        this.weaponSelectHoveredCardId = option.id;
        this.refreshWeaponSelectionVisuals();
      });
      cardHitArea.on("pointerout", () => {
        this.weaponSelectHoveredCardId = null;
        this.refreshWeaponSelectionVisuals();
      });
      cardHitArea.on("pointerdown", () => {
        this.pendingSelectedWeaponId = option.id;
        this.refreshWeaponSelectionVisuals();
      });

      const symbolText = this.add.text(cardX, cardY - 124, option.symbol, {
        fontFamily: THEME.font.display,
        fontSize: "36px",
        color: THEME.text.secondary
      });
      symbolText.setOrigin(0.5);
      symbolText.setDepth(21);

      const nameText = this.add.text(cardX, cardY - 68, BALANCE.weapons[option.id].name, {
        fontFamily: THEME.font.display,
        fontSize: "22px",
        fontStyle: "bold",
        color: THEME.text.primary,
        align: "center",
        wordWrap: { width: 216 },
        lineSpacing: 2
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(21);

      const roleText = this.add.text(cardX, cardY - 2, option.role, {
        fontFamily: THEME.font.body,
        fontSize: "15px",
        color: THEME.text.secondary,
        align: "center",
        wordWrap: { width: 214 },
        lineSpacing: 2
      });
      roleText.setOrigin(0.5);
      roleText.setDepth(21);

      const difficultyBadge = this.add.rectangle(
        cardX,
        cardY + 50,
        130,
        28,
        THEME.surface.facility,
        1
      );
      difficultyBadge.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(option.difficulty.color).color);
      difficultyBadge.setDepth(21);

      const difficultyText = this.add.text(cardX, cardY + 50, `难度：${option.difficulty.label}`, {
        fontFamily: THEME.font.label,
        fontSize: "15px",
        color: option.difficulty.color
      });
      difficultyText.setOrigin(0.5);
      difficultyText.setDepth(21);

      const selectedLabel = this.add.text(
        cardX + cardWidth / 2 - 12,
        cardY - cardHeight / 2 + 18,
        "已选择",
        {
          fontFamily: THEME.font.label,
          fontSize: "12px",
          fontStyle: "bold",
          color: THEME.text.onButton,
          backgroundColor: "#35578D",
          padding: { left: 8, right: 8, top: 2, bottom: 2 }
        }
      );
      selectedLabel.setOrigin(1, 0.5);
      selectedLabel.setVisible(false);
      selectedLabel.setDepth(22);

      const statRows = [];
      const statStartY = cardY + 92;
      for (let rowIndex = 0; rowIndex < option.stats.length; rowIndex += 1) {
        const stat = option.stats[rowIndex];
        const rowY = statStartY + rowIndex * 30;
        const statLabel = this.add.text(cardX - 90, rowY, stat.label, {
          fontFamily: THEME.font.label,
          fontSize: "16px",
          color: THEME.text.muted
        });
        statLabel.setOrigin(0, 0.5);
        statLabel.setDepth(21);
        const statValue = this.add.text(cardX + 90, rowY, stat.value, {
          fontFamily: THEME.font.mono,
          fontSize: "16px",
          color: THEME.text.primary
        });
        statValue.setOrigin(1, 0.5);
        statValue.setDepth(21);
        statRows.push(statLabel, statValue);
      }

      this.weaponSelectCards.push({
        id: option.id,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        cardBg,
        divider,
        selectedLabel
      });
      this.weaponSelectUiObjects.push(
        cardBg,
        divider,
        cardHitArea,
        symbolText,
        nameText,
        roleText,
        difficultyBadge,
        difficultyText,
        selectedLabel,
        ...statRows
      );
    });

    this.startMissionButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 220,
      250,
      58,
      THEME.surface.raised,
      1
    );
    this.startMissionButton.setStrokeStyle(2, THEME.border.default);
    this.startMissionButton.setDepth(30);
    this.startMissionButton.setInteractive({ useHandCursor: true });
    this.startMissionButton.on("pointerover", () => {
      this.weaponSelectButtonHovered = true;
      this.refreshWeaponSelectionVisuals();
    });
    this.startMissionButton.on("pointerout", () => {
      this.weaponSelectButtonHovered = false;
      this.refreshWeaponSelectionVisuals();
    });
    this.startMissionButton.on("pointerdown", () => {
      if (this.pendingSelectedWeaponId) {
        this.startMissionWithWeapon(this.pendingSelectedWeaponId);
      }
    });

    this.startMissionButtonLabel = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 220,
      "请选择武器",
      {
        fontFamily: THEME.font.display,
        fontSize: "24px",
        fontStyle: "bold",
        color: THEME.text.muted
      }
    );
    this.startMissionButtonLabel.setOrigin(0.5);
    this.startMissionButtonLabel.setDepth(31);

    this.weaponSelectUiObjects.push(this.startMissionButton, this.startMissionButtonLabel);

    // Meta progression: credits display + unlock-store entry.
    this.weaponSelectCreditsLabel = this.add.text(
      GAME_WIDTH / 2 - 410,
      GAME_HEIGHT / 2 - 240,
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
      GAME_WIDTH / 2 + 330,
      GAME_HEIGHT / 2 - 238,
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
      GAME_WIDTH / 2 + 330,
      GAME_HEIGHT / 2 - 238,
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

      const scale = 1;
      const fill = selected ? 0x1e3358 : hovered ? 0x1d2b49 : 0x17223a;
      const border = selected || hovered ? THEME.border.focus : THEME.border.default;
      const borderWidth = selected ? 3 : 2;

      const drawW = entry.cardWidth * scale;
      const drawH = entry.cardHeight * scale;
      const drawX = entry.cardX - drawW / 2;
      const drawY = entry.cardY - drawH / 2;

      entry.cardBg.clear();
      entry.cardBg.fillStyle(fill, 1);
      entry.cardBg.fillRoundedRect(drawX, drawY, drawW, drawH, 10);
      entry.cardBg.lineStyle(borderWidth, border, 1);
      entry.cardBg.strokeRoundedRect(drawX, drawY, drawW, drawH, 10);
      if (selected) {
        entry.cardBg.lineStyle(2, THEME.signal.info, 0.5);
        entry.cardBg.strokeRoundedRect(drawX - 4, drawY - 4, drawW + 8, drawH + 8, 12);
      }

      entry.divider.clear();
      entry.divider.lineStyle(1, THEME.border.default, 1);
      entry.divider.lineBetween(
        entry.cardX - 96,
        entry.cardY + 68,
        entry.cardX + 96,
        entry.cardY + 68
      );
      entry.selectedLabel.setVisible(selected);
      entry.selectedLabel.setPosition(
        entry.cardX + drawW / 2 - 12,
        entry.cardY - drawH / 2 + 18
      );
      entry.cardBg.setVisible(true);
      entry.cardBg.setAlpha(1);
      entry.divider.setVisible(true);
      entry.divider.setAlpha(1);
      entry.selectedLabel.setAlpha(1);
      entry.selectedLabel.setDepth(22);
    }

    const canStart = !!this.pendingSelectedWeaponId;
    this.startMissionButton.setFillStyle(
      canStart
        ? this.weaponSelectButtonHovered
          ? THEME.signal.info
          : THEME.surface.raised
        : THEME.surface.raised,
      1
    );
    this.startMissionButton.setStrokeStyle(
      2,
      canStart ? THEME.border.focus : THEME.border.default
    );
    this.startMissionButtonLabel.setText(canStart ? "开始任务" : "请选择武器");
    this.startMissionButtonLabel.setColor(
      canStart ? THEME.text.onButton : THEME.text.muted
    );
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
