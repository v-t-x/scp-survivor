import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT
} from "../config/constants.js";
import { BALANCE } from "../config/balance.js";
import { UPGRADE_DEFINITIONS } from "../config/upgrades.js";
import { HUD_REGIONS } from "../art/openingVisualContract.js";
import { TEXTURES } from "../assets/manifest.js";
import {
  getHudPresentation,
  selectTimelineHudContainers
} from "../ui/hudPresentation.js";
import { THEME } from "../ui/theme.js";
import { createTacticalHudView } from "../ui/tacticalHudView.js";
import { createStatusLamp, createTacticalPanel } from "../ui/tacticalUi.js";
import { createTerminalOverlay } from "../ui/terminalOverlay.js";
import { UPGRADE_PRESENTATION } from "../ui/upgradePresentation.js";

const HUD_DEPTH = 45;
const FACILITY_HUD_DEPTH = 58;
const HEALTH_BAR_WIDTH = 150;
const XP_BAR_WIDTH = 82;
const WEAPON_STATUS_BAR_WIDTH = 92;
const DASH_BAR_WIDTH = 72;

// Domain mixin: hud. Methods are Object.assign'd onto PrototypeScene.prototype.
export const hudMixin = {

  createUI() {
    if (this.tacticalHudView && !this._hudTornDown) {
      this.teardownHud();
    }
    this._hudTornDown = false;
    this._pickupRadiusIndicatorSyncDone = false;
    const baselineObjects = this.snapshotHudObjectIdentities();
    let view;

    try {
      view = createTacticalHudView(this, {
        regions: HUD_REGIONS,
        onTogglePause: () => this.togglePause?.(),
        onToggleMute: () => {}
      });
    } catch {
      this.destroyHudObjectsSince(baselineObjects);
      try {
        this.createLegacyHud();
        view = this.createLegacyHudView(baselineObjects);
      } catch {
        this.destroyHudObjectsSince(baselineObjects);
        view = this.createNoopHudView();
      }
    }

    this.tacticalHudView = view;
    this.installHudAliases(view);
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.teardownHud, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.teardownHud, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardownHud, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.teardownHud, this);
    this.updateMuteText();
  },


  installHudAliases(view) {
    this.missionHudContainer = view.regions.mission.container;
    this.facilityHudContainer = view.regions.facility.container;
    this.vitalsHudContainer = view.regions.vitals.container;
    this.weaponHudContainer = view.regions.weapon.container;
    this.systemHudContainer = view.regions.system.container;
    for (const [name, object] of Object.entries(view.refs)) {
      this[name] = object;
    }
    this.gameplayHudContainers = [...view.timelineContainers];
    this.timelineHudBasePositions = view.timelineContainers.map(
      (container) => [container, container.x, container.y]
    );
  },


  snapshotHudObjectIdentities() {
    const objects = new Set();
    const visit = (object) => {
      if (!object || objects.has(object)) return;
      objects.add(object);
      for (const child of object.list ?? []) visit(child);
    };
    for (const object of this.children?.list ?? []) visit(object);
    return objects;
  },


  collectHudObjectsSince(baselineObjects) {
    const collected = [];
    const seen = new Set();
    const visit = (object) => {
      if (!object || seen.has(object)) return;
      seen.add(object);
      if (!baselineObjects.has(object)) collected.push(object);
      for (const child of object.list ?? []) visit(child);
    };
    for (const object of this.children?.list ?? []) visit(object);
    return collected;
  },


  destroyHudObjectsSince(baselineObjects) {
    const objects = this.collectHudObjectsSince(baselineObjects);
    for (const object of [...objects].reverse()) {
      object?.disableInteractive?.();
      object?.removeInteractive?.();
      object?.destroy?.(true);
      object?.removeAllListeners?.();
    }
  },


  createNoopHudView() {
    const createNoopObject = () => {
      const object = {
        active: false,
        visible: false,
        x: 0,
        y: 0
      };
      for (const method of [
        "clear", "destroy", "disableInteractive", "erase", "fill",
        "removeAllListeners", "removeInteractive", "setAlpha", "setColor",
        "setFillStyle", "setPosition", "setText", "setVisible"
      ]) {
        object[method] = () => object;
      }
      return object;
    };
    const regions = Object.fromEntries(
      ["mission", "facility", "vitals", "weapon", "system"]
        .map((name) => [name, { container: createNoopObject() }])
    );
    const refs = Object.fromEntries(
      [
        "statsText", "levelText", "xpBarBackground", "xpBarFill", "xpText",
        "weaponHudText", "phaseText", "muteText", "pauseButton", "pauseButtonLabel",
        "pickupRadiusIndicator", "eventBannerContainer", "eventBannerBg",
        "eventBannerTitle", "eventBannerDetail", "outageDarknessRt", "outageLightSprite"
      ].map((name) => [name, createNoopObject()])
    );
    return {
      mode: "noop",
      objects: [],
      regions,
      refs,
      timelineContainers: Object.freeze([]),
      controls: {
        pauseHitArea: refs.pauseButton,
        muteHitArea: refs.muteText
      },
      update() {},
      setGameplayVisible() {},
      setFacilityCollapsed() {},
      notifyPickupCue() {},
      destroy() {}
    };
  },


  createLegacyHudView(baselineObjects) {
    const scene = this;
    const objects = this.collectHudObjectsSince(baselineObjects);
    const noopSystem = this.createNoopHudView().regions.system.container;
    const regions = {
      mission: { container: this.missionHudContainer },
      facility: { container: this.facilityHudContainer },
      vitals: { container: this.vitalsHudContainer },
      weapon: { container: this.weaponHudContainer },
      system: { container: noopSystem }
    };
    const refs = {
      statsText: this.statsText,
      levelText: this.levelText,
      xpBarBackground: this.xpBarBackground,
      xpBarFill: this.xpBarFill,
      xpText: this.xpText,
      weaponHudText: this.weaponHudText,
      phaseText: this.phaseText,
      muteText: this.muteText,
      pauseButton: this.pauseButton,
      pauseButtonLabel: this.pauseButtonLabel,
      pickupRadiusIndicator: this.pickupRadiusIndicator,
      eventBannerContainer: this.eventBannerContainer,
      eventBannerBg: this.eventBannerBg,
      eventBannerTitle: this.eventBannerTitle,
      eventBannerDetail: this.eventBannerDetail,
      outageDarknessRt: this.outageDarknessRt,
      outageLightSprite: this.outageLightSprite
    };
    const timelineContainers = selectTimelineHudContainers(
      Object.fromEntries(Object.entries(regions).map(([name, region]) => [name, region.container]))
    );
    let destroyed = false;
    return {
      mode: "legacy",
      objects,
      regions,
      refs,
      timelineContainers,
      controls: {
        pauseHitArea: refs.pauseButton,
        muteHitArea: refs.muteText
      },
      update(presentation) {
        if (!destroyed) scene.applyLegacyHudPresentation(presentation);
      },
      setGameplayVisible(visible) {
        if (destroyed) return;
        for (const target of [...timelineContainers, refs.muteText, refs.pauseButton, refs.pauseButtonLabel]) {
          target?.setVisible?.(visible);
        }
        refs.pickupRadiusIndicator?.clear?.();
        refs.pickupRadiusIndicator?.setVisible?.(false);
      },
      setFacilityCollapsed(collapsed) {
        if (destroyed || collapsed !== true) return;
        scene.applyLegacyFacilityHudPresentation({
          expanded: false,
          title: "设施稳定",
          detail: "SITE-CN // 收容系统在线",
          tone: "contained"
        });
      },
      notifyPickupCue() {
        if (destroyed) return;
        refs.pickupRadiusIndicator.clear?.();
        refs.pickupRadiusIndicator.setVisible?.(false);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        for (const object of [...objects].reverse()) {
          object?.disableInteractive?.();
          object?.removeInteractive?.();
          object?.destroy?.(true);
          object?.removeAllListeners?.();
        }
      }
    };
  },


  createLegacyHud() {

    this.missionHudContainer = this.add.container(HUD_REGIONS.mission.x, HUD_REGIONS.mission.y);
    this.vitalsHudContainer = this.add.container(HUD_REGIONS.vitals.x, HUD_REGIONS.vitals.y);
    this.weaponHudContainer = this.add.container(HUD_REGIONS.weapon.x, HUD_REGIONS.weapon.y);
    this.facilityHudContainer = this.add.container(HUD_REGIONS.facility.x, HUD_REGIONS.facility.y);
    this.missionHudContainer.setDepth(HUD_DEPTH).setScrollFactor(0);
    this.vitalsHudContainer.setDepth(HUD_DEPTH).setScrollFactor(0);
    this.weaponHudContainer.setDepth(HUD_DEPTH).setScrollFactor(0);
    this.facilityHudContainer.setDepth(FACILITY_HUD_DEPTH).setScrollFactor(0);
    this.gameplayHudContainers = [
      this.missionHudContainer,
      this.vitalsHudContainer,
      this.weaponHudContainer,
      this.facilityHudContainer
    ];

    this.missionPanel = createTacticalPanel(this, {
      x: 0,
      y: 0,
      width: HUD_REGIONS.mission.width,
      height: HUD_REGIONS.mission.height,
      depth: 0,
      scrollFactor: 0,
      fill: THEME.hud.panelFill,
      border: THEME.hud.panelBorder
    });
    this.missionEyebrowText = this.add.text(12, 8, "MISSION // 当前任务", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudEyebrow,
      color: THEME.text.muted
    }).setDepth(0).setScrollFactor(0);
    this.missionTitleText = this.add.text(12, 24, "", {
      fontFamily: THEME.font.label,
      fontSize: THEME.fontSize.hudTitle,
      color: THEME.text.primary
    }).setDepth(0).setScrollFactor(0);
    this.missionDetailText = this.add.text(12, 48, "", {
      fontFamily: THEME.font.body,
      fontSize: THEME.fontSize.hudBody,
      color: THEME.text.secondary
    }).setDepth(0).setScrollFactor(0);
    this.missionKillsText = this.add.text(280, 70, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.muted
    }).setOrigin(1, 0).setDepth(0).setScrollFactor(0);
    this.missionBossBarBackground = this.add.rectangle(12, 78, 174, 5, THEME.hud.barTrack, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0).setVisible(false);
    this.missionBossBarFill = this.add.rectangle(12, 78, 174, 5, THEME.terminal.danger, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0).setVisible(false);
    this.missionHudContainer.add([
      ...this.missionPanel.objects,
      this.missionEyebrowText,
      this.missionTitleText,
      this.missionDetailText,
      this.missionKillsText,
      this.missionBossBarBackground,
      this.missionBossBarFill
    ]);

    this.vitalsPanel = createTacticalPanel(this, {
      x: 0,
      y: 0,
      width: HUD_REGIONS.vitals.width,
      height: HUD_REGIONS.vitals.height,
      depth: 0,
      scrollFactor: 0,
      fill: THEME.hud.panelFill,
      border: THEME.hud.panelBorder
    });
    this.healthLabelText = this.add.text(12, 8, "生命", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudEyebrow,
      color: THEME.text.muted
    }).setDepth(0).setScrollFactor(0);
    this.healthValueText = this.add.text(58, 6, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudBody,
      color: THEME.text.primary
    }).setDepth(0).setScrollFactor(0);
    this.healthBarBackground = this.add.rectangle(12, 27, HEALTH_BAR_WIDTH, 7, THEME.hud.barTrack, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.healthBarFill = this.add.rectangle(12, 27, HEALTH_BAR_WIDTH, 7, THEME.hud.health, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.levelValueText = this.add.text(12, 42, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.contained
    }).setDepth(0).setScrollFactor(0);
    this.xpValueText = this.add.text(174, 8, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.secondary
    }).setDepth(0).setScrollFactor(0);
    this.xpBarTrack = this.add.rectangle(174, 27, XP_BAR_WIDTH, 7, THEME.hud.barTrack, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.xpBarProgress = this.add.rectangle(174, 27, XP_BAR_WIDTH, 7, THEME.hud.experience, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.xpCaptionText = this.add.text(174, 42, "经验", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.muted
    }).setDepth(0).setScrollFactor(0);
    this.vitalsHudContainer.add([
      ...this.vitalsPanel.objects,
      this.healthLabelText,
      this.healthValueText,
      this.healthBarBackground,
      this.healthBarFill,
      this.levelValueText,
      this.xpValueText,
      this.xpBarTrack,
      this.xpBarProgress,
      this.xpCaptionText
    ]);

    this.weaponPanel = createTacticalPanel(this, {
      x: 0,
      y: 0,
      width: HUD_REGIONS.weapon.width,
      height: HUD_REGIONS.weapon.height,
      depth: 0,
      scrollFactor: 0,
      fill: THEME.hud.panelFill,
      border: THEME.hud.panelBorder
    });
    this.weaponIcon = this.add.image(38, 39, TEXTURES.weaponPistolIcon)
      .setDisplaySize(62, 62).setDepth(0).setScrollFactor(0);
    this.weaponDivider = this.add.rectangle(76, 10, 1, 58, THEME.terminal.frame, 0.75)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.weaponNameText = this.add.text(86, 7, "", {
      fontFamily: THEME.font.label,
      fontSize: THEME.fontSize.hudTitle,
      color: THEME.text.primary,
      wordWrap: { width: 170 }
    }).setDepth(0).setScrollFactor(0);
    this.weaponDetailText = this.add.text(86, 28, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.muted
    }).setDepth(0).setScrollFactor(0);
    this.weaponStatusText = this.add.text(86, 46, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.secondary
    }).setDepth(0).setScrollFactor(0);
    this.weaponStatusBarBackground = this.add.rectangle(86, 64, WEAPON_STATUS_BAR_WIDTH, 5, THEME.hud.barTrack, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.weaponStatusBarFill = this.add.rectangle(86, 64, WEAPON_STATUS_BAR_WIDTH, 5, THEME.hud.health, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.dashStatusText = this.add.text(184, 46, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.secondary
    }).setDepth(0).setScrollFactor(0);
    this.dashBarBackground = this.add.rectangle(184, 64, DASH_BAR_WIDTH, 5, THEME.hud.barTrack, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.dashBarFill = this.add.rectangle(184, 64, DASH_BAR_WIDTH, 5, THEME.terminal.contained, 1)
      .setOrigin(0, 0).setDepth(0).setScrollFactor(0);
    this.weaponHudContainer.add([
      ...this.weaponPanel.objects,
      this.weaponIcon,
      this.weaponDivider,
      this.weaponNameText,
      this.weaponDetailText,
      this.weaponStatusText,
      this.weaponStatusBarBackground,
      this.weaponStatusBarFill,
      this.dashStatusText,
      this.dashBarBackground,
      this.dashBarFill
    ]);

    this.facilityCollapsedPanel = createTacticalPanel(this, {
      x: 54,
      y: 0,
      width: 212,
      height: 28,
      depth: 0,
      scrollFactor: 0,
      fill: THEME.hud.panelFill,
      border: THEME.terminal.contained
    });
    this.facilityWarningPanel = createTacticalPanel(this, {
      x: 0,
      y: 0,
      width: HUD_REGIONS.facility.width,
      height: HUD_REGIONS.facility.height,
      depth: 0,
      scrollFactor: 0,
      fill: THEME.hud.panelFill,
      border: THEME.terminal.warning
    });
    this.facilityDangerPanel = createTacticalPanel(this, {
      x: 0,
      y: 0,
      width: HUD_REGIONS.facility.width,
      height: HUD_REGIONS.facility.height,
      depth: 0,
      scrollFactor: 0,
      fill: THEME.hud.panelFill,
      border: THEME.terminal.danger
    });
    this.facilityPanel = this.facilityCollapsedPanel;
    this.facilityWarningPanel.frame.setVisible(false);
    this.facilityDangerPanel.frame.setVisible(false);
    this.facilityLampController = createStatusLamp(this, {
      x: 68,
      y: 14,
      radius: 4,
      state: "contained",
      depth: 0,
      scrollFactor: 0
    });
    this.facilityTitleText = this.add.text(84, 5, "", {
      fontFamily: THEME.font.mono,
      fontSize: THEME.fontSize.hudBody,
      color: THEME.text.contained
    }).setDepth(0).setScrollFactor(0);
    this.facilityDetailText = this.add.text(84, 25, "", {
      fontFamily: THEME.font.body,
      fontSize: THEME.fontSize.hudMicro,
      color: THEME.text.secondary,
      wordWrap: { width: 224 }
    }).setDepth(0).setScrollFactor(0).setVisible(false);
    this.facilityHudContainer.add([
      ...this.facilityCollapsedPanel.objects,
      ...this.facilityWarningPanel.objects,
      ...this.facilityDangerPanel.objects,
      ...this.facilityLampController.objects,
      this.facilityTitleText,
      this.facilityDetailText
    ]);

    // Compatibility properties retained for timeline/UIManager consumers.
    this.statsText = this.healthValueText;
    this.levelText = this.levelValueText;
    this.xpBarBackground = this.xpBarTrack;
    this.xpBarFill = this.xpBarProgress;
    this.xpText = this.xpValueText;
    this.weaponHudText = this.weaponStatusText;
    this.phaseText = this.missionDetailText;

    this.muteText = this.add.text(GAME_WIDTH - 14, 14, "", {
      fontFamily: THEME.font.label,
      fontSize: THEME.fontSize.mute,
      color: THEME.text.secondary
    });
    this.muteText.setOrigin(1, 0);
    this.muteText.setDepth(45);
    this.muteText.setScrollFactor(0);
    this.updateMuteText();

    // Pause button (top-right, below the mute readout). Also bound to ESC.
    this.pauseButton = this.add.rectangle(GAME_WIDTH - 20, 44, 96, 30, THEME.surface.raised, 0.9);
    this.pauseButton.setOrigin(1, 0);
    this.pauseButton.setStrokeStyle(1, THEME.border.default);
    this.pauseButton.setDepth(45);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerover", () => this.pauseButton.setFillStyle(THEME.border.default, 0.95));
    this.pauseButton.on("pointerout", () => this.pauseButton.setFillStyle(THEME.surface.raised, 0.9));
    this.pauseButton.on("pointerdown", () => this.togglePause());

    this.pauseButtonLabel = this.add.text(GAME_WIDTH - 68, 49, "暂停 (ESC)", {
      fontFamily: THEME.font.label,
      fontSize: THEME.fontSize.pauseLabel,
      color: THEME.text.onButton
    });
    this.pauseButtonLabel.setOrigin(0.5, 0);
    this.pauseButtonLabel.setDepth(46);
    this.pauseButtonLabel.setScrollFactor(0);

    this.pickupRadiusIndicator = this.add.graphics();
    this.pickupRadiusIndicator.setDepth(4);
    this.pickupRadiusIndicator.setVisible(false);

    this.eventBannerContainer = this.add.container(0, 0);
    this.eventBannerContainer.setDepth(64);
    this.eventBannerContainer.setScrollFactor(0);
    this.eventBannerContainer.setVisible(false);
    this.eventBannerBg = this.add.rectangle(516, 86, 400, 48, THEME.surface.overlay, 0.88);
    this.eventBannerBg.setStrokeStyle(2, THEME.border.warning);
    this.eventBannerTitle = this.add.text(516, 78, "", {
      fontFamily: THEME.font.display,
      fontSize: THEME.fontSize.bannerTitle,
      color: THEME.color.text.bannerTitle
    });
    this.eventBannerTitle.setOrigin(0.5);
    this.eventBannerDetail = this.add.text(516, 96, "", {
      fontFamily: THEME.font.body,
      fontSize: THEME.fontSize.bannerDetail,
      color: THEME.text.secondary,
      wordWrap: { width: 372 },
      align: "center"
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

    this.timelineHudBasePositions = selectTimelineHudContainers({
      mission: this.missionHudContainer,
      vitals: this.vitalsHudContainer,
      weapon: this.weaponHudContainer,
      facility: this.facilityHudContainer,
      system: this.systemHudContainer
    }).map((container) => [container, container.x, container.y]);

  },


  teardownHud() {
    if (this._hudTornDown) {
      return;
    }
    this._hudTornDown = true;
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.teardownHud, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.teardownHud, this);
    this.teardownTerminalOverlays?.();
    this.tacticalHudView?.destroy?.();
    this.tacticalHudView = null;
    this.gameplayHudContainers = [];
    this.timelineHudBasePositions = [];
    this._hudPresentation = null;
    this.topBannerState = null;
  },


  updateMuteText() {
    if (!this.muteText?.setText) {
      return;
    }
    if (!BALANCE.audio.enabled) {
      this.muteText.setText("音频：关闭");
      return;
    }
    this.muteText.setText(this.soundMuted ? "音频：静音 (M)" : "音频：开启 (M)");
  },


  setGameplayHudVisible(isVisible) {
    this.tacticalHudView?.setGameplayVisible?.(isVisible);
  },


  createBuildPanel() {
    this.destroyBuildPanel();

    let controller = null;
    try {
      controller = this.createTerminalBuildPanel();
    } catch {
      try {
        controller = this.createLegacyBuildPanel();
      } catch {
        controller = null;
      }
    }

    this.buildPanelController = controller;
    if (controller) {
      this.buildPanel = controller.container;
      this.buildPanelText = controller.summaryText ?? null;
      controller.setVisible(false);
      return;
    }

    this.buildPanelText = null;
    this.buildPanel = this.createNoopBuildPanel();
  },


  createNoopBuildPanel() {
    return {
      visible: false,
      setVisible() {
        this.visible = false;
        return this;
      },
      destroy() {
        this.visible = false;
      }
    };
  },


  createTerminalBuildPanel() {
    let terminal = null;
    const ownedObjects = [];
    let destroyed = false;

    const releaseOwned = () => {
      for (const object of [...ownedObjects].reverse()) {
        try {
          object.disableInteractive?.();
          object.removeInteractive?.();
          object.destroy?.();
        } catch {
          // Continue releasing the remainder of the build transaction.
        } finally {
          object.removeAllListeners?.();
        }
      }
      ownedObjects.length = 0;
    };

    try {
      terminal = createTerminalOverlay(this, {
        x: 0,
        y: 0,
        width: 900,
        height: 470,
        depth: 56,
        scrollFactor: 0,
        eyebrow: "SITE-19 // OPERATOR LOADOUT",
        title: "当前构筑",
        subtitle: "TAB 关闭 // 实时装备与异常协议摘要",
        tone: "standard",
        surfaceTextureKey: TEXTURES.terminalSurfaceGrid
      });

      const own = (object, parent = terminal.content) => {
        ownedObjects.push(object);
        object.setDepth(57);
        object.setScrollFactor(0);
        parent?.add(object);
        return object;
      };
      const addHeading = (x, y, text, color = THEME.text.contained) => {
        const heading = own(this.add.text(x, y, text, {
          fontFamily: THEME.font.label,
          fontSize: "13px",
          fontStyle: "bold",
          color
        }));
        return heading;
      };
      const rowRefs = new Map();
      const addRow = ({ id, x, y, iconKey }) => {
        const icon = own(this.add.image(x, y, iconKey));
        icon.setDisplaySize(22, 22);
        const text = own(this.add.text(x + 18, y, "", {
          fontFamily: THEME.font.mono,
          fontSize: "12px",
          color: THEME.text.secondary
        }));
        text.setOrigin(0, 0.5);
        rowRefs.set(id, text);
      };

      addHeading(62, 138, "主武器");
      const weaponIcons = {
        pistol: TEXTURES.weaponPistolIcon,
        shotgun: TEXTURES.weaponBreacherIcon,
        tesla: TEXTURES.weaponTeslaIcon
      };
      ["pistol", "shotgun", "tesla"].forEach((weaponId, index) => {
        addRow({
          id: `weapon:${weaponId}`,
          x: 72,
          y: 172 + index * 32,
          iconKey: weaponIcons[weaponId]
        });
      });

      addHeading(62, 280, "常规强化");
      const genericUpgrades = UPGRADE_DEFINITIONS.filter(
        (upgrade) => upgrade.kind === "generic" && upgrade.isMutation !== true
      );
      genericUpgrades.forEach((upgrade, index) => {
        addRow({
          id: `upgrade:${upgrade.key}`,
          x: 72,
          y: 312 + index * 32,
          iconKey: UPGRADE_PRESENTATION[upgrade.key].textureKey
        });
      });

      addHeading(342, 138, "武器协议", THEME.text.warning ?? THEME.text.secondary);
      const weaponUpgrades = UPGRADE_DEFINITIONS.filter(
        (upgrade) => upgrade.kind === "weapon" && upgrade.isMutation !== true
      );
      weaponUpgrades.forEach((upgrade, index) => {
        addRow({
          id: `upgrade:${upgrade.key}`,
          x: 352,
          y: 172 + index * 31,
          iconKey: UPGRADE_PRESENTATION[upgrade.key].textureKey
        });
      });

      addHeading(662, 138, "异常突变", THEME.text.critical);
      const mutations = UPGRADE_DEFINITIONS.filter((upgrade) => upgrade.isMutation === true);
      mutations.forEach((upgrade, index) => {
        addRow({
          id: `upgrade:${upgrade.key}`,
          x: 672,
          y: 172 + index * 36,
          iconKey: UPGRADE_PRESENTATION[upgrade.key].textureKey
        });
      });

      const summaryText = own(this.add.text(662, 310, "", {
        fontFamily: THEME.font.mono,
        fontSize: "12px",
        color: THEME.text.muted
      }));

      const controller = {
        mode: "terminal",
        container: terminal.container,
        content: terminal.content,
        objects: [...terminal.objects, ...ownedObjects],
        rowRefs,
        summaryText,
        setVisible: (visible) => terminal.setVisible(visible === true),
        update: () => {
          for (const weaponId of ["pistol", "shotgun", "tesla"]) {
            rowRefs.get(`weapon:${weaponId}`)?.setText(this.getBuildWeaponLine(weaponId));
          }
          for (const upgrade of UPGRADE_DEFINITIONS) {
            rowRefs.get(`upgrade:${upgrade.key}`)?.setText(this.getBuildUpgradeLine(upgrade));
          }
          summaryText.setText(`行动员 // ${this.selectedWeaponId ?? "未选择"}`);
        },
        destroy: () => {
          if (destroyed) return;
          destroyed = true;
          releaseOwned();
          terminal.destroy();
        }
      };
      controller.update();
      return controller;
    } catch (error) {
      destroyed = true;
      releaseOwned();
      terminal?.destroy?.();
      throw error;
    }
  },


  createLegacyBuildPanel() {
    const objects = [];
    let destroyed = false;
    const own = (object) => {
      objects.push(object);
      return object;
    };
    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      for (const object of [...objects].reverse()) {
        try {
          object.disableInteractive?.();
          object.removeInteractive?.();
          object.destroy?.();
        } catch {
          // Continue rolling back the complete legacy transaction.
        } finally {
          object.removeAllListeners?.();
        }
      }
    };

    try {
      const container = own(this.add.container(0, 0));
      container.setDepth(56);
      container.setScrollFactor(0);
      container.setVisible(false);

      const panelBackground = own(this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        500,
        500,
        0x000000,
        0.78
      ));
      panelBackground.setStrokeStyle(2, 0x4060a0);
      const title = own(this.add.text(GAME_WIDTH / 2, 42, "当前构筑 (TAB)", {
        fontFamily: THEME.font.display,
        fontSize: "28px",
        color: THEME.text.primary
      }));
      title.setOrigin(0.5);
      const text = own(this.add.text(48, 78, "", {
        fontFamily: THEME.font.body,
        fontSize: "16px",
        color: THEME.text.secondary,
        lineSpacing: 6
      }));
      container.add([panelBackground, title, text]);

      const controller = {
        mode: "legacy",
        container,
        content: container,
        objects,
        summaryText: text,
        setVisible(visible) {
          container.setVisible(visible === true);
        },
        update: () => text.setText(this.getLegacyBuildPanelText()),
        destroy
      };
      controller.update();
      return controller;
    } catch (error) {
      destroy();
      throw error;
    }
  },


  getBuildWeaponLine(weaponId) {
    const weapon = this.weapons?.[weaponId];
    if (!weapon) return `${weaponId}  未配置`;
    if (weapon.unlocked === false) return `${weapon.name ?? weaponId}  未解锁`;
    if (weaponId === "pistol") {
      return `${weapon.name}  Lv ${weapon.currentLevel}  ${weapon.damage.toFixed(1)} / ${weapon.cooldownMs.toFixed(0)}ms`;
    }
    if (weaponId === "shotgun") {
      return `${weapon.name}  Lv ${weapon.currentLevel}  ${weapon.damage.toFixed(1)}x${weapon.pelletCount}`;
    }
    return `${weapon.name}  Lv ${weapon.currentLevel}  ${weapon.damage.toFixed(1)} / 链${weapon.chainTargets}`;
  },


  getBuildUpgradeLine(upgrade) {
    if (upgrade.isMutation === true) {
      const active = this.weaponMutations?.[upgrade.key] === true;
      return `${upgrade.name}  ${active ? "已激活" : "未激活"}`;
    }
    const level = this.upgradeLevels?.[upgrade.key] ?? 0;
    const value = {
      damage: this.weapons?.[this.selectedWeaponId]?.damage?.toFixed?.(1),
      attackSpeed: this.weapons?.[this.selectedWeaponId]?.cooldownMs?.toFixed?.(0),
      moveSpeed: this.playerMoveSpeed?.toFixed?.(0),
      maxHealth: this.maxHealth,
      projectileCount: this.projectileCount,
      penetration: this.bulletPenetration,
      pickupRadius: this.pickupRadius?.toFixed?.(0),
      emergencyHeal: this.health,
      breacherKnockback: this.weapons?.shotgun?.knockbackStrength?.toFixed?.(0),
      breacherSuppression: this.weapons?.shotgun?.staggerDurationMs?.toFixed?.(0),
      breacherMagazine: this.weapons?.shotgun?.magazineSize,
      teslaChains: this.weapons?.tesla?.chainTargets,
      teslaCooldown: this.weapons?.tesla?.cooldownMs?.toFixed?.(0)
    }[upgrade.key];
    return `${upgrade.name}  Lv ${level}${value === undefined ? "" : `  ${value}`}`;
  },


  getLegacyBuildPanelText() {
    const pistol = this.weapons.pistol;
    const shotgun = this.weapons.shotgun;
    const tesla = this.weapons.tesla;
    const attacksPerSecond = (1000 / pistol.cooldownMs).toFixed(2);
    const upgradeLines = UPGRADE_DEFINITIONS.map(
      (upgrade) => `${upgrade.name}：Lv ${this.upgradeLevels[upgrade.key]}`
    ).join("\n");
    return [
      `伤害倍率：x${(pistol.damage / BALANCE.weapons.pistol.baseDamage).toFixed(2)}`,
      `攻击冷却：${pistol.cooldownMs.toFixed(0)} ms (${attacksPerSecond}/秒)`,
      `移动速度：${this.playerMoveSpeed.toFixed(0)}`,
      `最大生命值：${this.maxHealth}`,
      `弹丸数量：${this.projectileCount}`,
      `弹丸穿透：${this.bulletPenetration}`,
      `拾取范围：${this.pickupRadius.toFixed(0)}`,
      "",
      "武器",
      `- 手枪 Lv ${pistol.currentLevel}：伤害 ${pistol.damage.toFixed(1)}，冷却 ${pistol.cooldownMs.toFixed(0)}ms`,
      shotgun.unlocked
        ? `- 突破器 Lv ${shotgun.currentLevel}：伤害 ${shotgun.damage.toFixed(1)} x ${shotgun.pelletCount}`
        : "- 突破器：未解锁",
      tesla.unlocked
        ? `- 特斯拉 Lv ${tesla.currentLevel}：伤害 ${tesla.damage.toFixed(1)}，链击 ${tesla.chainTargets}`
        : "- 特斯拉：未解锁",
      "",
      "升级等级",
      upgradeLines
    ].join("\n");
  },


  toggleBuildPanel() {
    if (this.isGameOver || this.isLevelUpActive) {
      return;
    }

    if (!this.buildPanel?.setVisible) {
      return;
    }
    this.buildPanel.setVisible(this.buildPanel.visible !== true);
    if (this.buildPanel.visible) {
      this.updateBuildPanelText();
    }
  },


  hideBuildPanel() {
    this.buildPanel?.setVisible?.(false);
  },


  updateBuildPanelText() {
    this.buildPanelController?.update?.();
  },


  destroyBuildPanel() {
    const controller = this.buildPanelController;
    const panel = this.buildPanel;
    this.buildPanelController = null;
    this.buildPanelText = null;
    this.buildPanel = this.createNoopBuildPanel();

    if (controller) {
      try {
        controller.destroy?.();
      } catch {
        // References are already cleared; Scene teardown can continue.
      }
      return;
    }
    try {
      panel?.destroy?.(true);
    } catch {
      // Legacy and no-op panels are best-effort teardown targets.
    }
  },


  updateUI() {
    const phaseHudState = this.getPhaseHudState();
    const selectedWeapon = this.weapons?.[this.selectedWeaponId] ?? null;
    const facilityEvent = this.activeFacilityEvent
      ? {
          ...this.activeFacilityEvent,
          warning: BALANCE.facility.events[this.activeFacilityEvent.type]?.warning
        }
      : null;
    const bossHealthRatio = this.bossEnemy?.active && this.bossEnemy.maxHealth > 0
      ? this.bossEnemy.health / this.bossEnemy.maxHealth
      : 0;
    const presentation = getHudPresentation({
      isMissionActive: this.isMissionActive && !this.isGameOver,
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level,
      currentXp: this.currentXp,
      xpToNextLevel: this.xpToNextLevel,
      killCount: this.killCount,
      elapsedSurvivalMs: this.elapsedSurvivalMs,
      selectedWeaponId: this.selectedWeaponId,
      weapon: selectedWeapon,
      dashReadyAtMs: this.dashReadyAtMs,
      dashCooldownMs: BALANCE.player.dashCooldownMs,
      phaseLabel: phaseHudState.phaseLabel,
      nextNodeSeconds: phaseHudState.nextNodeSeconds,
      missionDetail: phaseHudState.missionDetail,
      bossPhaseActive: this.bossPhaseActive && !this.isGameOver,
      bossHealthRatio,
      activeFacilityEvent: facilityEvent,
      eventBannerActive: this.topBannerState !== null,
      soundMuted: this.soundMuted,
      isPaused: this.isPaused,
      pickupRadius: this.pickupRadius,
      buildPanelVisible: this.buildPanel?.visible === true
    });
    this._hudPresentation = presentation;
    if (presentation.facility.expanded) {
      this.tacticalHudView?.setFacilityCollapsed?.(false);
    }
    this.tacticalHudView?.update?.(presentation);
    this.applyTopBannerOverlay();
  },


  updateWeaponHud() {
    this.updateUI();
  },


  applyHudPresentation(presentation) {
    this.tacticalHudView?.update?.(presentation);
  },


  applyLegacyHudPresentation(presentation) {
    const { mission, vitals, weapon, facility } = presentation;
    for (const container of this.gameplayHudContainers ?? []) {
      container.setVisible(mission.active);
    }
    this.missionTitleText.setText(mission.title);
    this.missionDetailText.setText(mission.detail);
    this.missionKillsText.setText(mission.killsText);
    const bossVisible = facility.tone === "danger" && mission.active;
    this.missionBossBarBackground.setVisible(bossVisible);
    this.missionBossBarFill.setVisible(bossVisible);
    this.missionBossBarFill.width = 174 * mission.bossHealthRatio;

    this.healthValueText.setText(vitals.healthText);
    this.healthValueText.setColor(
      vitals.critical ? THEME.text.critical : THEME.text.primary
    );
    this.healthBarFill.setFillStyle(
      vitals.critical ? THEME.hud.healthCritical : THEME.hud.health,
      1
    );
    this.healthBarFill.width = HEALTH_BAR_WIDTH * vitals.healthRatio;
    this.levelValueText.setText(vitals.levelText);
    this.xpValueText.setText(vitals.xpText);
    this.xpBarProgress.width = XP_BAR_WIDTH * vitals.xpRatio;

    if (weapon.iconKey) {
      if (this.weaponIcon.texture?.key !== weapon.iconKey) {
        this.weaponIcon.setTexture(weapon.iconKey);
      }
      this.weaponIcon.setVisible(true);
    } else {
      this.weaponIcon.setVisible(false);
    }
    this.weaponNameText.setText(weapon.name);
    this.weaponDetailText.setText(weapon.detail);
    this.weaponStatusText.setText(weapon.statusText);
    const weaponToneColor = weapon.statusTone === "warning"
      ? THEME.terminal.warning
      : weapon.statusTone === "contained"
        ? THEME.terminal.contained
        : THEME.hud.neutral;
    this.weaponStatusBarFill.setFillStyle(weaponToneColor, 1);
    this.weaponStatusBarFill.width = WEAPON_STATUS_BAR_WIDTH * weapon.statusRatio;
    this.dashStatusText.setText(
      weapon.dashReady ? "闪避 就绪" : weapon.dashText.replace("闪避 冷却 ", "闪避 ")
    );
    this.dashStatusText.setColor(
      weapon.dashReady ? THEME.text.contained : THEME.text.secondary
    );
    this.dashBarFill.setFillStyle(
      weapon.dashReady ? THEME.terminal.contained : THEME.terminal.warning,
      1
    );
    this.dashBarFill.width = DASH_BAR_WIDTH * weapon.dashRatio;

    this.applyLegacyFacilityHudPresentation(facility);
  },


  applyFacilityHudPresentation(facility) {
    const presentation = this._hudPresentation
      ? { ...this._hudPresentation, facility }
      : null;
    if (presentation) {
      this._hudPresentation = presentation;
    }
    if (this.tacticalHudView?.mode === "legacy") {
      this.applyLegacyFacilityHudPresentation(facility);
      this.applyTopBannerOverlay();
      return;
    }
    if (!presentation) {
      this.applyTopBannerOverlay();
      return;
    }
    this.tacticalHudView?.update?.(presentation);
    this.applyTopBannerOverlay();
  },


  applyLegacyFacilityHudPresentation(facility) {
    const warning = facility.expanded && facility.tone !== "danger";
    const danger = facility.expanded && facility.tone === "danger";
    this.facilityCollapsedPanel.frame.setVisible(!facility.expanded);
    this.facilityWarningPanel.frame.setVisible(warning);
    this.facilityDangerPanel.frame.setVisible(danger);
    this.facilityLampController.setState(facility.tone);
    this.facilityTitleText.setText(facility.title);
    this.facilityTitleText.setColor(
      danger
        ? THEME.text.critical
        : warning
          ? THEME.color.text.phase
          : THEME.text.contained
    );
    this.facilityDetailText.setText(facility.detail);
    this.facilityDetailText.setVisible(facility.expanded);
  },


  collapseFacilityHud() {
    this.tacticalHudView?.setFacilityCollapsed?.(true);
  },


  notifyPickupRadiusCue(reason, nowMs = this.elapsedSurvivalMs) {
    try {
      this.tacticalHudView?.notifyPickupCue({ reason, nowMs, durationMs: 650 });
    } catch {
      // Presentation failures must not affect pickup gameplay.
    }
  },


  updatePickupRadiusIndicator() {
    if (this._pickupRadiusIndicatorSyncDone) {
      return;
    }
    this._pickupRadiusIndicatorSyncDone = true;
    const nowMs = this._hudPresentation?.pickup?.nowMs
      ?? Math.max(0, Number.isFinite(this.elapsedSurvivalMs) ? this.elapsedSurvivalMs : 0);
    try {
      this.tacticalHudView?.notifyPickupCue?.({
        reason: "legacy-update",
        nowMs,
        durationMs: 0
      });
    } catch {
      // The compatibility shim must stay gameplay-safe.
    }
  },


  showTopBanner(title, detail, durationMs = 1500) {
    if (!this.eventBannerContainer) {
      return;
    }
    this.topBannerState = {
      title,
      detail,
      expiresAtMs: this.elapsedSurvivalMs + durationMs
    };
    this.eventBannerContainer.setAlpha(1);
    this.applyTopBannerOverlay();
  },


  applyTopBannerOverlay() {
    if (!this.topBannerState) {
      return;
    }
    this.eventBannerTitle?.setText?.(this.topBannerState.title);
    this.eventBannerDetail?.setText?.(this.topBannerState.detail);
    this.eventBannerContainer?.setVisible?.(true);
    this.eventBannerBg?.setVisible?.(true);
    this.eventBannerDetail?.setVisible?.(true);
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
