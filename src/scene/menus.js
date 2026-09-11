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
import {
  isPlayerWeaponAllowed
} from "../config/playerWeaponAvailability.js";
import { UPGRADE_DEFINITIONS } from "../config/upgrades.js";
import { META_PERKS, loadMetaProgress, saveMetaProgress } from "../config/meta.js";
import { TEXTURES } from "../assets/manifest.js";
import { createTitleBackdrop } from "../art/titleBackdrop.js";
import { createTitleScreenView } from "../art/titleScreenView.js";
import { createPerkStoreWithFallback } from "../art/perkStoreView.js";
import {
  ARMORY_WORKBENCH_LAYOUT,
  LEGACY_ARMORY_WORKBENCH_LAYOUT,
  createArmoryDeploySymbol,
  createArmoryDetailView,
  createArmorySlot
} from "../art/weaponSelectionView.js";
import {
  getArmoryPresentation,
  getPerkStorePresentation
} from "../ui/stage1MenuPresentation.js";
import { THEME } from "../ui/theme.js";
import { createTerminalButton } from "../ui/tacticalUi.js";
import { createTerminalOverlay } from "../ui/terminalOverlay.js";
import { SITE_CODE, SITE_CHANNELS } from "../ui/siteIdentity.js";
import { U1_TYPE, createU1InsetButton, drawU1FoundationSeal } from "../ui/u1MaterialUi.js";
import {
  createU3PauseView,
  createU3ResultModel,
  createU3ResultView
} from "../ui/u3MissionViews.js";

const PAUSE_OVERLAY_DEPTH = 70;
const RESULT_OVERLAY_DEPTH = 50;

function releaseArmoryObjects(objects) {
  for (const object of [...objects].reverse()) {
    try {
      object?.disableInteractive?.();
    } catch {
      // Continue releasing every object in this small construction transaction.
    }
    try {
      object?.removeInteractive?.();
    } catch {
      // The input plugin may already be unavailable during Scene teardown.
    }
    try {
      object?.removeAllListeners?.();
    } catch {
      // Listener cleanup is best-effort for partially initialized display objects.
    }
    try {
      object?.destroy?.();
    } catch {
      // Continue through the remaining objects when a renderer resource is gone.
    }
  }
}

function createArmoryAuthorizationController(kind, controller) {
  const objects = Object.freeze([...new Set(controller.objects ?? [])]);
  let destroyed = false;
  return {
    kind,
    insetKind: controller.kind,
    objects,
    hitArea: controller.hitArea,
    label: controller.label,
    setState: controller.setState?.bind(controller),
    destroy() {
      if (destroyed) return;
      destroyed = true;
      try {
        controller.destroy?.();
      } catch {
        releaseArmoryObjects(objects);
      }
    }
  };
}

function drawArmoryAmberFrame(graphics, { x, y, width, height, active }) {
  const cut = 7;
  const right = x + width;
  const bottom = y + height;
  graphics.clear();
  graphics.fillStyle(THEME.terminal.panelRaised, active ? 0.94 : 0.7);
  graphics.lineStyle(2, active ? THEME.semantic.warning : THEME.semantic.disabled, 1);
  graphics.beginPath();
  graphics.moveTo(x + cut, y);
  graphics.lineTo(right - cut, y);
  graphics.lineTo(right, y + cut);
  graphics.lineTo(right, bottom - cut);
  graphics.lineTo(right - cut, bottom);
  graphics.lineTo(x + cut, bottom);
  graphics.lineTo(x, bottom - cut);
  graphics.lineTo(x, y + cut);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
  graphics.fillStyle(active ? THEME.semantic.warning : THEME.semantic.disabled, 1);
  graphics.fillCircle?.(right - 14, y + height / 2, 4);
}

export function createArmoryAmberAction(scene, options = {}) {
  if (options.formalChassis) return createU1InsetButton(scene, { ...options, kind: 'authorization' });
  const {
    x = 0,
    y = 0,
    width = 140,
    height = 40,
    text = "永久授权",
    state = "armed",
    depth = 0,
    scrollFactor = 0,
    onActivate = () => {}
  } = options;
  const objects = [];
  let destroyed = false;
  let currentState = state;
  const own = (object) => {
    objects.push(object);
    object.setScrollFactor?.(scrollFactor);
    return object;
  };

  try {
    const frame = own(scene.add.graphics());
    frame.setDepth(depth);
    const label = own(scene.add.text(x + 14, y + height / 2, text, {
      fontFamily: THEME.font.label,
      fontSize: "14px",
      fontStyle: "bold",
      color: THEME.semanticText.warning
    }));
    label.setOrigin(0, 0.5).setDepth(depth + 1);
    const hitArea = own(scene.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      0xffffff,
      0.001
    ));
    hitArea.setDepth(depth + 2);

    function setState(nextState) {
      if (destroyed) return;
      currentState = nextState;
      const active = nextState !== "disabled";
      drawArmoryAmberFrame(frame, { x, y, width, height, active });
      label.setStyle?.({
        color: active ? THEME.semanticText.warning : THEME.semanticText.disabled
      });
      if (active) {
        hitArea.setInteractive({ useHandCursor: true });
      } else {
        hitArea.disableInteractive();
      }
    }

    hitArea.on("pointerover", () => {
      if (!destroyed && currentState !== "disabled") {
        frame.setAlpha?.(0.82);
      }
    });
    hitArea.on("pointerout", () => {
      if (!destroyed && currentState !== "disabled") {
        frame.setAlpha?.(1);
      }
    });
    hitArea.on("pointerup", () => {
      if (!destroyed && currentState !== "disabled") onActivate();
    });
    setState(state);

    return {
      objects: Object.freeze([...objects]),
      frame,
      hitArea,
      label,
      setState,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        releaseArmoryObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    releaseArmoryObjects(objects);
    throw error;
  }
}

export function createArmoryAuthorizationEntry(scene, options = {}, dependencies = {}) {
  const { createAmberAction = createArmoryAmberAction } = dependencies;
  let controller = null;
  try {
    controller = createAmberAction(scene, {
      ...options,
      height: 40,
      text: options.text ?? "永久授权",
      state: "armed"
    });
    return createArmoryAuthorizationController("production", controller);
  } catch (error) {
    try {
      controller?.destroy?.();
    } catch {
      releaseArmoryObjects(controller?.objects ?? []);
    }
    throw error;
  }
}

export function createLegacyArmoryAuthorizationEntry(scene, options = {}, dependencies = {}) {
  const {
    x = 0,
    y = 0,
    width = 140,
    height = 40,
    depth = 0,
    scrollFactor = 0,
    onActivate = () => {}
  } = options;
  const {
    addRectangle = scene.add.rectangle.bind(scene.add),
    addText = scene.add.text.bind(scene.add)
  } = dependencies;
  const objects = [];
  let destroyed = false;

  try {
    const hitArea = addRectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      THEME.surface.raised,
      1
    );
    objects.push(hitArea);
    hitArea.setStrokeStyle?.(2, THEME.signal.anomaly);
    hitArea.setDepth?.(depth);
    hitArea.setScrollFactor?.(scrollFactor);
    hitArea.setInteractive?.({ useHandCursor: true });
    hitArea.on?.("pointerover", () => hitArea.setFillStyle?.(THEME.border.default, 1));
    hitArea.on?.("pointerout", () => hitArea.setFillStyle?.(THEME.surface.raised, 1));
    hitArea.on?.("pointerdown", onActivate);

    const label = addText(x + width / 2, y + height / 2, options.text ?? "永久授权", {
      fontFamily: THEME.font.label,
      fontSize: "17px",
      fontStyle: "bold",
      color: THEME.text.secondary
    });
    objects.push(label);
    label.setOrigin?.(0.5);
    label.setDepth?.(depth + 1);
    label.setScrollFactor?.(scrollFactor);

    return {
      kind: "legacy",
      objects: Object.freeze([...objects]),
      hitArea,
      label,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        releaseArmoryObjects(objects);
      }
    };
  } catch (error) {
    destroyed = true;
    releaseArmoryObjects(objects);
    throw error;
  }
}

export function createArmoryAuthorizationEntryWithFallback(scene, options, factories = {}) {
  const createProduction = factories.createProduction ?? createArmoryAuthorizationEntry;
  const createLegacy = factories.createLegacy ?? createLegacyArmoryAuthorizationEntry;
  try {
    return createProduction(scene, options);
  } catch {
    try {
      return createLegacy(scene, options);
    } catch {
      return null;
    }
  }
}

export function createArmoryDetailWithFallback(scene, options, factories = {}) {
  const createProduction = factories.createProduction ?? createArmoryDetailView;
  try {
    return createProduction(scene, options);
  } catch {
    return null;
  }
}

export function createArmoryDeploySymbolWithFallback(scene, options, factories = {}) {
  const createProduction = factories.createProduction ?? createArmoryDeploySymbol;
  try {
    return createProduction(scene, options);
  } catch {
    return null;
  }
}

export function createDeployCallback(scene) {
  return () => {
    if (isPlayerWeaponAllowed(scene.pendingSelectedWeaponId)) {
      scene.startMissionWithWeapon(scene.pendingSelectedWeaponId);
    }
  };
}

export function openPerkStoreController(
  scene,
  createStore = createPerkStoreWithFallback
) {
  if (scene.perkStoreController) return scene.perkStoreController;
  const controller = createStore(scene, {
    presentation: getPerkStorePresentation(scene.meta),
    onPurchase: (perkKey) => scene.purchasePerk(perkKey),
    onClose: () => scene.closePerkStore()
  });
  scene.perkStoreController = controller ?? null;
  return scene.perkStoreController;
}

export function closePerkStoreController(scene) {
  const controller = scene.perkStoreController;
  if (!controller) return false;
  scene.perkStoreController = null;
  try {
    controller.destroy?.();
  } catch {
    // Scene ownership is already detached; armory recovery still runs.
  } finally {
    scene.weaponSelectHoveredCardId = null;
    if (scene.startMissionButtonController) {
      try {
        scene.refreshWeaponSelectionVisuals();
      } catch {
        // Store is already closed; armory refresh failure cannot reattach it.
      }
    }
  }
  return true;
}

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
      eyebrow: SITE_CHANNELS.missionControl,
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
      `站点编号 // ${SITE_CODE}`,
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


  createWeaponSelectionScreen(dependencies = {}) {
    this.destroyWeaponSelectionScreen?.();
    this.setGameplayHudVisible(false);
    this.cameras.main.setBackgroundColor(THEME.surface.facility);
    this.weaponSelectOverlay = null;
    this.weaponSelectUiObjects = [];
    this.weaponSelectCards = [];
    this.weaponSelectHoveredCardId = null;
    this.armoryDetailController = null;
    this.armoryDeploySymbolController = null;
    this.weaponSelectStoreEntryController = null;
    this.weaponSelectCreditsLabel = null;
    this.startMissionButtonController = null;
    this.startMissionButton = null;
    this.startMissionButtonLabel = null;

    const createSlot = dependencies.createSlot ?? createArmorySlot;
    const createDeployButton = dependencies.createDeployButton ?? ((scene, options) => (
      options.formalChassis ? createU1InsetButton(scene, { ...options, kind: 'deploy' }) : createTerminalButton(scene, options)
    ));
    let layout = ARMORY_WORKBENCH_LAYOUT;
    const ownRaw = (object) => {
      this.weaponSelectUiObjects.push(object);
      object.setScrollFactor?.(0);
      return object;
    };

    try {
      const presentation = getArmoryPresentation({
        meta: this.meta,
        pendingSelectedWeaponId: this.pendingSelectedWeaponId,
        hoveredWeaponId: this.weaponSelectHoveredCardId
      });

      let formalChassis = false;
      let armoryBackdrop = null;
      if (this.textures?.exists?.(presentation.chassisTextureKey) ?? true) {
        let candidate = null;
        try {
          candidate = this.add.image(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            presentation.chassisTextureKey
          );
          candidate.setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);
          armoryBackdrop = ownRaw(candidate);
          formalChassis = true;
        } catch {
          const candidateIndex = this.weaponSelectUiObjects.indexOf(candidate);
          if (candidateIndex >= 0) this.weaponSelectUiObjects.splice(candidateIndex, 1);
          releaseMissionDisplayObject(candidate);
        }
      }
      if (!formalChassis) {
        layout = LEGACY_ARMORY_WORKBENCH_LAYOUT;
        armoryBackdrop = ownRaw(
          this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, TEXTURES.armoryRackBackdrop)
        );
        armoryBackdrop.setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);
        const contrastVeil = ownRaw(this.add.rectangle(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2,
          GAME_WIDTH,
          GAME_HEIGHT,
          THEME.surface.facility,
          0.3
        ));
        contrastVeil.setDepth(1);
        const headerPanel = ownRaw(this.add.rectangle(
          layout.header.x + layout.header.width / 2,
          layout.header.y + layout.header.height / 2,
          layout.header.width,
          layout.header.height,
          0x05080d,
          1
        ));
        headerPanel.setStrokeStyle(3, 0x010205, 1).setDepth(10);
        const headerInset = ownRaw(this.add.rectangle(
          layout.header.x + layout.header.width / 2,
          layout.header.y + layout.header.height / 2,
          layout.header.width - 8,
          layout.header.height - 8,
          THEME.terminal.panelFill,
          0.98
        ));
        headerInset.setStrokeStyle(1, THEME.terminal.frame, 0.9).setDepth(11);
        const headerHighlight = ownRaw(this.add.rectangle(
          layout.header.x + layout.header.width / 2,
          layout.header.y + 7,
          layout.header.width - 24,
          2,
          THEME.terminal.frameFocus,
          0.34
        ));
        headerHighlight.setDepth(12);
        for (const [boltX, boltY] of [
          [layout.header.x + 10, layout.header.y + 10],
          [layout.header.x + layout.header.width - 10, layout.header.y + 10],
          [layout.header.x + 10, layout.header.y + layout.header.height - 10],
          [layout.header.x + layout.header.width - 10, layout.header.y + layout.header.height - 10]
        ]) {
          const bolt = ownRaw(this.add.circle(boltX, boltY, 2, 0x76808a, 0.78));
          bolt.setDepth(13);
        }
      }

      const siteCode = ownRaw(this.add.text(
        formalChassis ? 92 : layout.header.x + 16,
        formalChassis ? 38 : layout.header.y + 16,
        SITE_CODE,
        {
          fontFamily: formalChassis ? U1_TYPE.code : THEME.font.label,
          fontSize: formalChassis ? "17px" : "12px",
          color: formalChassis ? U1_TYPE.label : THEME.text.muted
        }
      ));
      siteCode.setOrigin(0, 0.5).setDepth(21);
      const title = ownRaw(this.add.text(
        formalChassis ? 230 : layout.header.x + 16,
        formalChassis ? 37 : layout.header.y + 43,
        "军械库",
        {
          fontFamily: U1_TYPE.steel,
          fontSize: "28px",
          fontStyle: "bold",
          color: U1_TYPE.label
        }
      ));
      title.setOrigin(0, 0.5).setDepth(21);
      if (formalChassis) {
        const seal = ownRaw(this.add.graphics());
        seal.setDepth(20);
        drawU1FoundationSeal(seal, 43, 38);
        siteCode.setResolution?.(2); title.setResolution?.(2);
      }
      this.weaponSelectCreditsLabel = ownRaw(this.add.text(
        formalChassis ? 610 : layout.header.x + 596,
        formalChassis ? 38 : layout.header.y + layout.header.height / 2,
        presentation.creditsDisplayLabel,
        {
          fontFamily: U1_TYPE.code,
          fontSize: "15px",
          fontStyle: "normal",
          color: U1_TYPE.label
        }
      ));
      this.weaponSelectCreditsLabel.setOrigin(0, 0.5).setDepth(31);

      this.weaponSelectStoreEntryController = createArmoryAuthorizationEntryWithFallback(this, {
        x: formalChassis ? 772 : layout.header.x + layout.header.width - 180,
        y: formalChassis ? 16 : layout.header.y + 12,
        width: formalChassis ? 148 : 164,
        height: 40,
        text: formalChassis ? presentation.authorizationEntryLabel.replace(/\s*>$/, '') : presentation.authorizationEntryLabel,
        depth: 31,
        scrollFactor: 0,
        formalChassis,
        onActivate: () => this.openPerkStore()
      }, dependencies.authorizationFactories ?? {});

      presentation.slots.forEach((slotPresentation, index) => {
        const slotX = layout.selector.x + layout.selector.width / 2;
        const slotY = layout.selector.y
          + index * (layout.selector.height + layout.selector.gap)
          + layout.selector.height / 2;
        const slot = createSlot(this, {
          x: slotX,
          y: slotY,
          width: layout.selector.width,
          height: layout.selector.height,
          textureKey: formalChassis && (this.textures?.exists?.(slotPresentation.heroTextureKey) ?? false)
            ? slotPresentation.heroTextureKey : slotPresentation.textureKey,
          fallbackTextureKey: slotPresentation.textureKey,
          name: slotPresentation.name,
          formalChassis,
          depth: 20,
          scrollFactor: 0,
          nameStyle: {
            fontFamily: THEME.font.display,
            fontSize: "18px",
            fontStyle: "bold",
            color: THEME.text.primary,
            wordWrap: { width: 132 }
          },
          statusStyle: {
            fontFamily: THEME.font.label,
            fontSize: "12px",
            fontStyle: "bold",
            color: THEME.semanticText.neutral
          },
          onActivate: () => {
            this.pendingSelectedWeaponId = slotPresentation.id;
            this.refreshWeaponSelectionVisuals();
          }
        });
        this.weaponSelectCards.push({ id: slotPresentation.id, slot });
        slot.hitArea.on("pointerover", () => {
          this.weaponSelectHoveredCardId = slotPresentation.id;
          this.refreshWeaponSelectionVisuals();
        });
        slot.hitArea.on("pointerout", () => {
          this.weaponSelectHoveredCardId = null;
          this.refreshWeaponSelectionVisuals();
        });
      });

      this.armoryDetailController = createArmoryDetailWithFallback(this, {
        depth: 20,
        scrollFactor: 0,
        formalChassis,
        emptyStyle: {
          fontFamily: THEME.font.label,
          fontSize: "16px",
          color: THEME.text.muted
        },
        nameStyle: {
          fontFamily: THEME.font.display,
          fontSize: "20px",
          fontStyle: "bold",
          color: THEME.text.primary,
          wordWrap: { width: layout.dossier.width - 36 }
        },
        statusStyle: {
          fontFamily: THEME.font.label,
          fontSize: "13px",
          color: THEME.semanticText.contained
        },
        statsStyle: {
          fontFamily: THEME.font.mono,
          fontSize: "13px",
          color: THEME.text.secondary,
          lineSpacing: 8
        }
      }, dependencies.detailFactories ?? {});

      this.startMissionButtonController = createDeployButton(this, {
        x: layout.deploy.x,
        y: layout.deploy.y,
        width: layout.deploy.width,
        height: layout.deploy.height,
        text: "部署",
        state: "disabled",
        formalChassis,
        depth: 30,
        scrollFactor: 0,
        onActivate: createDeployCallback(this)
      });
      this.startMissionButton = this.startMissionButtonController.hitArea;
      this.startMissionButtonLabel = this.startMissionButtonController.label;
      if (!formalChassis) this.startMissionButtonController.signal?.setVisible?.(false);
      this.armoryDeploySymbolController = formalChassis ? null : createArmoryDeploySymbolWithFallback(this, {
        ...layout.deploy,
        depth: 32,
        scrollFactor: 0,
        symbol: "lock",
        state: "disabled"
      }, dependencies.deploySymbolFactories ?? {});

      this.refreshWeaponSelectionVisuals();
    } catch (error) {
      this.destroyWeaponSelectionScreen?.();
      throw error;
    }
  },


  refreshWeaponSelectionVisuals() {
    const presentation = getArmoryPresentation({
      meta: this.meta,
      pendingSelectedWeaponId: this.pendingSelectedWeaponId,
      hoveredWeaponId: this.weaponSelectHoveredCardId
    });
    for (const entry of this.weaponSelectCards) {
      const slotPresentation = presentation.slots.find(({ id }) => id === entry.id);
      entry.slot.setState({
        selected: slotPresentation?.selected ?? false,
        hovered: slotPresentation?.hovered ?? false
      });
    }

    this.armoryDetailController?.refresh(
      presentation.showcase,
      presentation.dossier
    );
    this.weaponSelectStoreEntryController?.label?.setText(
      this.weaponSelectStoreEntryController?.insetKind === 'authorization'
        ? presentation.authorizationEntryLabel.replace(/\s*>$/, '') : presentation.authorizationEntryLabel
    );
    this.weaponSelectCreditsLabel.setText(
      presentation.creditsDisplayLabel
    );
    this.startMissionButtonController.setState(presentation.deploy.state);
    this.startMissionButtonLabel.setText(presentation.deploy.label);
    this.armoryDeploySymbolController?.refresh(
      presentation.deploy.symbol,
      presentation.deploy.state
    );
  },


  destroyWeaponSelectionScreen() {
    this.closePerkStore();
    const slotControllers = this.weaponSelectCards?.map(({ slot }) => slot) ?? [];
    const detailController = this.armoryDetailController;
    const deploySymbolController = this.armoryDeploySymbolController;
    const authorizationEntryController = this.weaponSelectStoreEntryController;
    const deployButtonController = this.startMissionButtonController;
    const rawObjects = this.weaponSelectUiObjects ?? [];
    this.weaponSelectUiObjects = [];
    this.weaponSelectCards = [];
    this.weaponSelectOverlay = null;
    this.armoryDetailController = null;
    this.armoryDeploySymbolController = null;
    this.weaponSelectStoreEntryController = null;
    this.weaponSelectCreditsLabel = null;
    this.weaponSelectPerkProgressLabel = null;
    this.startMissionButtonController = null;
    this.startMissionButton = null;
    this.startMissionButtonLabel = null;
    for (const controller of [
      deployButtonController,
      authorizationEntryController,
      deploySymbolController,
      detailController,
      ...slotControllers.reverse()
    ]) {
      try {
        controller?.destroy?.();
      } catch {
        // Continue tearing down each independently owned controller.
      }
    }
    for (const object of [...rawObjects].reverse()) {
      releaseMissionDisplayObject(object);
    }
  },


  openPerkStore() {
    return openPerkStoreController(this);
  },


  refreshPerkStore() {
    this.perkStoreController?.refresh?.(getPerkStorePresentation(this.meta));
  },


  purchasePerk(perkKey) {
    const perk = META_PERKS.find((entry) => entry.key === perkKey);
    if (!perk || this.meta.perks[perkKey] || this.meta.credits < perk.cost) {
      return;
    }
    this.meta.credits -= perk.cost;
    this.meta.perks[perkKey] = true;
    saveMetaProgress(this.meta);
    try {
      this.playSound("levelUp");
    } catch {
      // Purchase is already committed; optional audio cannot roll it back.
    }
    try {
      this.refreshPerkStore();
    } catch {
      // A committed purchase remains authoritative if optional presentation fails.
    }
    try {
      this.refreshWeaponSelectionVisuals();
    } catch {
      // Armory presentation failure cannot repeat or roll back the purchase.
    }
  },


  closePerkStore() {
    return closePerkStoreController(this);
  },


  startMissionWithWeapon(weaponId) {
    if (!isPlayerWeaponAllowed(weaponId)) {
      return false;
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
    return true;
  },


  showGameOverOverlay() {
    return this.showMissionResultOverlay({
      type: "failure",
      tone: "danger",
      eyebrow: SITE_CHANNELS.incidentReport,
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
      eyebrow: SITE_CHANNELS.recontainmentReport,
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
    const resultModel = createU3ResultModel(this, type, { finalTime });
    let controller = null;
    let activeU3Controller = null;
    let runtimeFallbackController = null;
    let restarted = false;
    const restart = () => {
      if (restarted) return;
      restarted = true;
      controller?.actions?.restart?.setState?.("disabled");
      controller?.actions?.restart?.hitArea?.disableInteractive?.();
      this.destroyResultOverlay();
      this.scene.restart();
    };

    const createLegacyController = () => {
      try {
        return createResultTerminalController(this, {
          tone,
          eyebrow,
          statusText,
          subtitle,
          stampTextureKey,
          ...stats,
          onRestart: restart
        });
      } catch {
        return createMinimalResultFallback(this, { tone, onRestart: restart });
      }
    };

    const recoverU3Result = () => {
      if (activeU3Controller && this.resultOverlayController !== activeU3Controller) return;
      activeU3Controller?.destroy?.();
      this.resultOverlayController = null;
      this.resultOverlay = null;
      try {
        runtimeFallbackController = createLegacyController();
      } catch {
        runtimeFallbackController = null;
      }
      controller = runtimeFallbackController;
      if (!controller) {
        restart();
        return;
      }
      controller.resultType = type;
      this.resultOverlayController = controller;
      this.resultOverlay = controller.container;
    };

    try {
      activeU3Controller = createU3ResultView(this, {
        type,
        model: resultModel,
        onRestart: restart,
        onFailure: recoverU3Result
      });
      controller = activeU3Controller ?? runtimeFallbackController;
    } catch {
      activeU3Controller?.destroy?.();
      activeU3Controller = null;
      controller = runtimeFallbackController;
    }

    if (!controller) {
      try {
        controller = createLegacyController();
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
    let activeU3Controller = null;
    let runtimeFallbackController = null;
    let legacyAttempted = false;
    const recoverU3Pause = () => {
      if (activeU3Controller && this.pauseOverlayController !== activeU3Controller) return;
      activeU3Controller?.destroy?.();
      this.pauseOverlayController = null;
      this.pauseOverlay = null;
      try {
        runtimeFallbackController = createPauseTerminalController(this);
        controller = runtimeFallbackController;
        this.pauseOverlayController = controller;
        this.pauseOverlay = controller.container;
      } catch {
        runtimeFallbackController = null;
        const gameplayWasPaused = this.isPaused === true;
        this.isPaused = false;
        if (gameplayWasPaused) this.resumeGameplaySystems();
        this.updateUI?.();
      }
    };
    try {
      activeU3Controller = createU3PauseView(this, {
        onResume: () => this.resumeFromPause(),
        onQuit: () => this.quitToTitle(),
        onFailure: recoverU3Pause
      });
      controller = activeU3Controller ?? runtimeFallbackController;
      if (!controller) {
        legacyAttempted = true;
        controller = createPauseTerminalController(this);
      }
      this.pauseOverlayController = controller;
      this.pauseOverlay = controller.container;
      return controller;
    } catch {
      controller?.destroy();
      if (!legacyAttempted) {
        try {
          legacyAttempted = true;
          controller = createPauseTerminalController(this);
          this.pauseOverlayController = controller;
          this.pauseOverlay = controller.container;
          return controller;
        } catch {
          // Both presentation paths are unavailable; restore live gameplay below.
        }
      }
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
    if (this.isBuildPanelPaused) {
      this.hideBuildPanel();
      return;
    }
    if (this.isPaused) {
      this.resumeFromPause();
    } else {
      this.pauseGame();
    }
  },


  pauseGame() {
    this.hideBuildPanel?.({ resume: false });
    this.isPaused = true;
    this.pauseGameplaySystems();
    this.showPauseOverlay();
    this.updateUI?.();
  },


  resumeFromPause() {
    this.hideBuildPanel?.({ resume: false });
    this.isPaused = false;
    this.hidePauseOverlay();
    this.resumeGameplaySystems();
    this.updateUI?.();
  },


  quitToTitle() {
    // Return to the title screen; a fresh create() resets all run state.
    this.hideBuildPanel?.({ resume: false });
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
      this.destroyBuildPanel,
      this.closePerkStore
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
    const tesla = this.weapons?.tesla;
    if (tesla) {
      try {
        this.stopTeslaChannel?.(tesla);
      } catch {
        // Terminal state must still commit if optional Tesla cleanup fails.
      }
    }
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
    this.hideBuildPanel({ resume: false });
    this.pickupRadiusIndicator.clear();
  }
};
