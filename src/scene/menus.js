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
import { createTerminalOverlay } from "../ui/terminalOverlay.js";

const PAUSE_OVERLAY_DEPTH = 70;
const RESULT_OVERLAY_DEPTH = 50;

function releaseMissionDisplayObject(object) {
  if (!object) return;
  try {
    object.disableInteractive?.();
  } catch {
    // Continue releasing the object even if its input plugin is already gone.
  }
  try {
    object.removeInteractive?.();
  } catch {
    // Continue through destruction so partially initialized objects cannot leak.
  }
  try {
    object.destroy?.();
  } catch {
    // Listener cleanup still runs when a partially initialized destroy hook fails.
  } finally {
    try {
      object.removeAllListeners?.();
    } catch {
      // Teardown is best-effort after the object itself has been destroyed.
    }
  }
}

function createMissionOverlayOwner(overlay, tone) {
  const objects = [...overlay.objects];
  const objectSet = new Set(objects);
  const ownedObjects = [];
  const ownedControllers = [];
  let destroyed = false;

  const owner = {
    container: overlay.container,
    body: overlay.body,
    header: overlay.header,
    content: overlay.content,
    objects,
    actions: {},
    tone,
    fallback: false,
    ownObject(object, parent = overlay.content) {
      if (!objectSet.has(object)) {
        objectSet.add(object);
        objects.push(object);
        ownedObjects.push(object);
      }
      parent?.add(object);
      return object;
    },
    ownController(controller, parent = overlay.content) {
      ownedControllers.push(controller);
      for (const object of controller.objects ?? []) {
        if (!objectSet.has(object)) {
          objectSet.add(object);
          objects.push(object);
        }
      }
      parent?.add(controller.objects ?? []);
      return controller;
    },
    setTone(nextTone) {
      if (destroyed) return;
      owner.tone = nextTone;
      overlay.setTone(nextTone);
    },
    setVisible(visible) {
      if (destroyed) return;
      overlay.setVisible(visible);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const action of Object.values(owner.actions)) {
        try {
          action?.setState?.("disabled");
          action?.hitArea?.disableInteractive?.();
        } catch {
          // Continue tearing down every object owned by this overlay.
        }
      }
      for (const controller of [...ownedControllers].reverse()) {
        try {
          controller?.destroy?.();
        } catch {
          // Continue releasing the rest of the transaction.
        }
      }
      for (const object of [...ownedObjects].reverse()) {
        try {
          releaseMissionDisplayObject(object);
        } catch {
          // Continue releasing the rest of the transaction.
        }
      }
      try {
        overlay.destroy();
      } catch {
        // All directly owned objects have already been released.
      }
    }
  };

  return owner;
}

function configureMissionObject(object, depth, scrollFactor, origin = null) {
  object.setDepth(depth);
  object.setScrollFactor(scrollFactor);
  if (origin) object.setOrigin(...origin);
  return object;
}

function createOwnedMissionText(scene, owner, {
  x,
  y,
  text,
  style,
  depth,
  scrollFactor,
  origin = [0, 0]
}) {
  const object = owner.ownObject(scene.add.text(x, y, text, style));
  return configureMissionObject(object, depth, scrollFactor, origin);
}

function getPauseObjective(scene) {
  if (scene.bossPhaseActive || scene.bossEnemy?.active) {
    return "重新收容 SCP-049";
  }
  if (scene.survivalPhaseEnded) {
    return "等待 SCP-049 收容接触";
  }
  return "维持生存 // 等待收容窗口";
}

function getPauseFacilityStatus(scene) {
  const event = scene.activeFacilityEvent;
  if (event) {
    const configured = BALANCE.facility.events[event.type];
    const name = event.name ?? configured?.name ?? event.type;
    const warning = event.warning ?? configured?.warning ?? "处置协议执行中";
    return `${name} // ${warning}`;
  }
  if (scene.bossPhaseActive) {
    return "终局收容区 // 高危封锁";
  }
  return "设施在线 // 常规警戒";
}

function createPauseTerminalController(scene) {
  let owner = null;
  try {
    const cx = GAME_WIDTH / 2;
    const overlay = createTerminalOverlay(scene, {
      x: 0,
      y: 0,
      width: 580,
      height: 420,
      depth: PAUSE_OVERLAY_DEPTH,
      scrollFactor: 1,
      eyebrow: "SITE-19 // MISSION CONTROL",
      title: "行动暂停",
      subtitle: "任务时序冻结 // 等待操作员指令",
      tone: "standard",
      surfaceTextureKey: TEXTURES.terminalSurfaceGrid
    });
    owner = createMissionOverlayOwner(overlay, "standard");

    const statusStyle = {
      fontFamily: THEME.font.mono,
      fontSize: "15px",
      color: THEME.text.secondary
    };
    const lines = [
      `站点编号 // SITE-19`,
      `当前任务 // ${getPauseObjective(scene)}`,
      `运行时间 // ${scene.getFinalSurvivalTimeSeconds()} 秒`,
      `设施状态 // ${getPauseFacilityStatus(scene)}`
    ];
    lines.forEach((text, index) => {
      createOwnedMissionText(scene, owner, {
        x: cx - 248,
        y: 180 + index * 30,
        text,
        style: statusStyle,
        depth: PAUSE_OVERLAY_DEPTH + 1,
        scrollFactor: 1
      });
    });

    const resume = owner.ownController(createTerminalButton(scene, {
      x: cx - 120,
      y: 314,
      width: 240,
      height: 54,
      text: "继续行动",
      variant: "primary",
      activateOn: "pointerdown",
      depth: PAUSE_OVERLAY_DEPTH + 1,
      scrollFactor: 1,
      onActivate: () => scene.resumeFromPause()
    }));
    const quit = owner.ownController(createTerminalButton(scene, {
      x: cx - 120,
      y: 378,
      width: 240,
      height: 54,
      text: "返回标题",
      variant: "danger",
      activateOn: "pointerdown",
      depth: PAUSE_OVERLAY_DEPTH + 1,
      scrollFactor: 1,
      onActivate: () => scene.quitToTitle()
    }));
    owner.actions.resume = resume;
    owner.actions.quit = quit;
    owner.resumeButton = resume;
    owner.quitButton = quit;

    scene.syncScreenOverlayPosition(owner.container);
    return owner;
  } catch (error) {
    owner?.destroy();
    throw error;
  }
}

function addResultStats(scene, owner, {
  finalTime,
  killCount,
  runCredits,
  totalCredits,
  depth,
  scrollFactor
}) {
  const rows = [
    ["生存时间", `${finalTime} 秒`],
    ["击杀数", `${killCount}`],
    ["当局学分", `+${runCredits}`],
    ["累计学分", `${totalCredits}`]
  ];
  rows.forEach(([label, value], index) => {
    const y = 226 + index * 31;
    createOwnedMissionText(scene, owner, {
      x: GAME_WIDTH / 2 - 190,
      y,
      text: label,
      style: {
        fontFamily: THEME.font.label,
        fontSize: "14px",
        color: THEME.text.secondary
      },
      depth,
      scrollFactor,
      origin: [0, 0.5]
    });
    createOwnedMissionText(scene, owner, {
      x: GAME_WIDTH / 2 + 190,
      y,
      text: value,
      style: {
        fontFamily: THEME.font.mono,
        fontSize: "16px",
        fontStyle: "bold",
        color: THEME.text.primary
      },
      depth,
      scrollFactor,
      origin: [1, 0.5]
    });
  });
}

function createResultTerminalController(scene, {
  tone,
  eyebrow,
  statusText,
  subtitle,
  stampTextureKey,
  finalTime,
  killCount,
  runCredits,
  totalCredits,
  onRestart
}) {
  let owner = null;
  try {
    const overlay = createTerminalOverlay(scene, {
      x: 0,
      y: 0,
      width: 540,
      height: 400,
      depth: RESULT_OVERLAY_DEPTH,
      scrollFactor: 0,
      eyebrow,
      title: statusText,
      subtitle,
      tone,
      surfaceTextureKey: TEXTURES.terminalSurfaceGrid
    });
    owner = createMissionOverlayOwner(overlay, tone);

    const stamp = owner.ownObject(
      scene.add.image(GAME_WIDTH / 2, 194, stampTextureKey)
    );
    configureMissionObject(stamp, RESULT_OVERLAY_DEPTH + 1, 0);
    stamp.setDisplaySize(144, 48);

    createOwnedMissionText(scene, owner, {
      x: GAME_WIDTH / 2,
      y: 194,
      text: statusText,
      style: {
        fontFamily: THEME.font.label,
        fontSize: "15px",
        fontStyle: "bold",
        color: tone === "danger" ? THEME.text.critical : THEME.text.contained
      },
      depth: RESULT_OVERLAY_DEPTH + 2,
      scrollFactor: 0,
      origin: [0.5, 0.5]
    });

    addResultStats(scene, owner, {
      finalTime,
      killCount,
      runCredits,
      totalCredits,
      depth: RESULT_OVERLAY_DEPTH + 1,
      scrollFactor: 0
    });

    const restart = owner.ownController(createTerminalButton(scene, {
      x: GAME_WIDTH / 2 - 85,
      y: 382,
      width: 170,
      height: 52,
      text: "返回行动准备",
      variant: tone === "danger" ? "danger" : "success",
      activateOn: "pointerdown",
      depth: RESULT_OVERLAY_DEPTH + 2,
      scrollFactor: 0,
      onActivate: onRestart
    }));
    owner.actions.restart = restart;
    owner.restartButton = restart;
    return owner;
  } catch (error) {
    owner?.destroy();
    throw error;
  }
}

function createMinimalResultFallback(scene, { tone, onRestart }) {
  const objects = [];
  const objectSet = new Set();
  let container = null;
  let interactiveObject = null;
  let pointerdownHandler = null;
  let destroyed = false;
  let activated = false;
  let committed = false;

  const own = (object) => {
    if (object && !objectSet.has(object)) {
      objectSet.add(object);
      objects.push(object);
    }
    return object;
  };
  const releaseRejected = (object) => {
    if (!object) return;
    if (objectSet.delete(object)) {
      const index = objects.indexOf(object);
      if (index >= 0) objects.splice(index, 1);
    }
    if (container === object) container = null;
    releaseMissionDisplayObject(object);
  };
  const releaseAll = () => {
    for (const object of [...objects].reverse()) {
      releaseMissionDisplayObject(object);
    }
  };
  const attempt = (factory, configure) => {
    let object = null;
    try {
      object = own(factory());
      configure(object);
      return object;
    } catch {
      releaseRejected(object);
      return null;
    }
  };

  try {
    container = attempt(
      () => scene.add.container(0, 0),
      (object) => configureMissionObject(object, RESULT_OVERLAY_DEPTH, 0)
    );
    const addToContainer = (object) => {
      if (!object || !container) return;
      try {
        container.add(object);
      } catch {
        // Screen-fixed fallback objects remain usable without a parent container.
      }
    };

    const backdrop = attempt(
      () => scene.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.82
      ),
      (object) => {
        configureMissionObject(object, RESULT_OVERLAY_DEPTH, 0);
        addToContainer(object);
      }
    );
    const hitArea = attempt(
      () => scene.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        170,
        52,
        tone === "danger" ? THEME.terminal.danger : THEME.terminal.contained,
        1
      ),
      (object) => {
        configureMissionObject(object, RESULT_OVERLAY_DEPTH + 1, 0);
        addToContainer(object);
      }
    );
    const label = attempt(
      () => scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "返回行动准备", {
        fontFamily: THEME.font.label,
        fontSize: "18px",
        fontStyle: "bold",
        color: THEME.text.onButton
      }),
      (object) => {
        configureMissionObject(object, RESULT_OVERLAY_DEPTH + 2, 0, [0.5, 0.5]);
        addToContainer(object);
      }
    );

    const disableInteraction = () => {
      try {
        interactiveObject?.disableInteractive?.();
      } catch {
        // The local activation guard still prevents a duplicate restart.
      }
    };
    pointerdownHandler = () => {
      if (activated || destroyed) return;
      activated = true;
      disableInteraction();
      onRestart();
    };

    const installCandidate = (candidate) => {
      if (!candidate || !objectSet.has(candidate)) return false;
      try {
        candidate.setInteractive({ useHandCursor: true });
        candidate.on("pointerdown", pointerdownHandler);
        interactiveObject = candidate;
        return true;
      } catch {
        try {
          candidate.off?.("pointerdown", pointerdownHandler);
        } catch {
          // Releasing the candidate below removes any partially added listeners.
        }
        releaseRejected(candidate);
        return false;
      }
    };

    for (const candidate of [hitArea, label, backdrop]) {
      if (installCandidate(candidate)) break;
    }

    if (!interactiveObject) {
      activated = true;
      destroyed = true;
      releaseAll();
      onRestart();
      return null;
    }

    const activeLabel = objectSet.has(label) ? label : null;
    const restart = {
      objects: [...new Set([interactiveObject, activeLabel].filter(Boolean))],
      hitArea: interactiveObject,
      label: activeLabel,
      setState(state) {
        if (state === "disabled") disableInteraction();
      },
      destroy() {
        disableInteraction();
      }
    };

    if (!container) container = interactiveObject;
    const controller = {
      container,
      content: container,
      objects,
      actions: { restart },
      restartButton: restart,
      tone,
      fallback: true,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        restart.setState("disabled");
        try {
          interactiveObject?.off?.("pointerdown", pointerdownHandler);
        } catch {
          // Object release below clears any listener that remains.
        }
        releaseAll();
        interactiveObject = null;
        pointerdownHandler = null;
      }
    };
    committed = true;
    return controller;
  } finally {
    if (!committed && !destroyed) {
      destroyed = true;
      releaseAll();
    }
  }
}

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
    this.medkitSpawned = false;
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
    return this.showMissionResultOverlay({
      type: "failure",
      tone: "danger",
      eyebrow: "SITE-19 // INCIDENT REPORT",
      statusText: "行动终止",
      subtitle: "任务记录已封存 // 等待重新部署",
      stampTextureKey: TEXTURES.incidentStampFrame
    });
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
    return this.showMissionResultOverlay({
      type: "victory",
      tone: "success",
      eyebrow: "SITE-19 // RECONTAINMENT REPORT",
      statusText: "重新收容确认",
      subtitle: "SCP-049 已重新收容 // 行动记录完成",
      stampTextureKey: TEXTURES.recontainmentStampFrame
    });
  },


  showMissionResultOverlay({
    type,
    tone,
    eyebrow,
    statusText,
    subtitle,
    stampTextureKey
  }) {
    if (this.resultOverlayController || this.resultOverlay) {
      return this.resultOverlayController ?? null;
    }

    const finalTime = this.getFinalSurvivalTimeSeconds();
    const stats = {
      finalTime,
      killCount: this.killCount,
      runCredits: this.lastRunCreditsEarned ?? 0,
      totalCredits: this.meta.credits
    };
    let controller = null;
    let restarted = false;
    const restart = () => {
      if (restarted) return;
      restarted = true;
      controller?.actions?.restart?.setState?.("disabled");
      controller?.actions?.restart?.hitArea?.disableInteractive?.();
      this.destroyResultOverlay();
      this.scene.restart();
    };

    try {
      controller = createResultTerminalController(this, {
        tone,
        eyebrow,
        statusText,
        subtitle,
        stampTextureKey,
        ...stats,
        onRestart: restart
      });
    } catch {
      try {
        controller = createMinimalResultFallback(this, { tone, onRestart: restart });
      } catch {
        restart();
        controller = null;
      }
    }

    if (!controller) {
      this.resultOverlayController = null;
      this.resultOverlay = null;
      return null;
    }

    controller.resultType = type;
    this.resultOverlayController = controller;
    this.resultOverlay = controller.container;
    return controller;
  },


  destroyResultOverlay() {
    const controller = this.resultOverlayController;
    const overlay = this.resultOverlay;
    this.resultOverlayController = null;
    this.resultOverlay = null;

    if (controller) {
      try {
        controller.destroy();
      } catch {
        // References are already cleared; Scene teardown can continue safely.
      }
      return;
    }
    try {
      overlay?.destroy?.(true);
    } catch {
      // Legacy compatibility teardown is best-effort and idempotent.
    }
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
    if (this.pauseOverlayController || this.pauseOverlay) {
      return this.pauseOverlayController ?? null;
    }

    let controller = null;
    try {
      controller = createPauseTerminalController(this);
      this.pauseOverlayController = controller;
      this.pauseOverlay = controller.container;
      return controller;
    } catch {
      controller?.destroy();
      this.pauseOverlayController = null;
      this.pauseOverlay = null;
      const gameplayWasPaused = this.isPaused === true;
      this.isPaused = false;
      if (gameplayWasPaused) {
        this.resumeGameplaySystems();
      }
      return null;
    }
  },


  hidePauseOverlay() {
    const controller = this.pauseOverlayController;
    const overlay = this.pauseOverlay;
    this.pauseOverlayController = null;
    this.pauseOverlay = null;

    if (controller) {
      try {
        controller.destroy();
      } catch {
        // References are already cleared; repeated teardown remains safe.
      }
      return;
    }
    try {
      overlay?.destroy?.(true);
    } catch {
      // Legacy compatibility teardown is best-effort and idempotent.
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
    this.destroyLevelUpOverlay();
    this.scene.restart();
  },


  teardownTerminalOverlays() {
    for (const teardown of [
      this.cancelLevelUpResolutionTimer,
      this.destroyLevelUpOverlay,
      this.hidePauseOverlay,
      this.destroyResultOverlay,
      this.destroyBuildPanel
    ]) {
      try {
        teardown?.call(this);
      } catch {
        // One failed subsystem must not strand the remaining Scene overlays.
      }
    }
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

    this.destroyLevelUpOverlay();
    this.isLevelUpActive = false;
    this.isResolvingLevelUp = false;
    this.isPaused = false;
    this.hidePauseOverlay();
    this.hideBuildPanel();
    this.pickupRadiusIndicator.clear();
  }
};
