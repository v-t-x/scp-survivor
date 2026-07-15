import { TEXTURES } from "../assets/manifest.js";
import { BALANCE } from "../config/balance.js";
import { THEME } from "./theme.js";
import { createStatusLamp, createTacticalPanel } from "./tacticalUi.js";
import { selectTimelineHudContainers } from "./hudPresentation.js";

const HUD_DEPTH = 45;
const FACILITY_DEPTH = 58;
const WEAPON_ICON_SIZE = 48;

function toneColor(tone) {
  return {
    contained: THEME.terminal.contained,
    warning: THEME.terminal.warning,
    danger: THEME.terminal.danger
  }[tone] ?? THEME.text.primary;
}

function cleanUpObject(object) {
  object?.removeAllListeners?.();
  object?.disableInteractive?.();
  object?.removeInteractive?.();
  object?.destroy?.();
}

function createTracker() {
  const objects = [];
  const seen = new Set();
  return {
    objects,
    add(...candidates) {
      for (const candidate of candidates.flat()) {
        if (candidate && !seen.has(candidate)) {
          seen.add(candidate);
          objects.push(candidate);
        }
      }
      return candidates.at(-1);
    },
    destroy() {
      for (const object of [...objects].reverse()) {
        cleanUpObject(object);
      }
    }
  };
}

function setHudDisplay(object, depth) {
  object.setDepth(depth);
  object.setScrollFactor(0);
  return object;
}

function createHudText(scene, tracker, container, x, y, text, style, depth) {
  const label = setHudDisplay(scene.add.text(x, y, text, style), depth).setOrigin(0, 0);
  tracker.add(label);
  container.add([label]);
  return label;
}

function createHudGraphic(scene, tracker, container, depth, draw) {
  const graphic = setHudDisplay(scene.add.graphics(), depth);
  draw(graphic);
  tracker.add(graphic);
  container.add([graphic]);
  return graphic;
}

function weaponTextureExists(scene, textureKey) {
  return textureKey != null && (scene.textures?.exists?.(textureKey) ?? true);
}

export function createTacticalHudView(scene, {
  regions,
  onTogglePause = () => scene.togglePause?.(),
  onToggleMute = () => {}
} = {}) {
  const tracker = createTracker();
  let destroyed = false;
  let gameplayVisible = true;
  let facilityCollapsed = false;
  let pickupCueUntilMs = -1;

  try {
    const regionViews = {};
    for (const regionKey of ["mission", "facility", "vitals", "weapon", "system"]) {
      const region = regions?.[regionKey];
      if (!region) throw new Error(`Missing tactical HUD region: ${regionKey}`);
      const depth = regionKey === "facility" ? FACILITY_DEPTH : HUD_DEPTH;
      const container = setHudDisplay(scene.add.container(region.x, region.y), depth);
      tracker.add(container);
      regionViews[regionKey] = { container };
    }

    const mission = regionViews.mission;
    const facility = regionViews.facility;
    const vitals = regionViews.vitals;
    const weapon = regionViews.weapon;
    const system = regionViews.system;

    function addPanel(regionKey, options = {}) {
      const region = regions[regionKey];
      const depth = regionKey === "facility" ? FACILITY_DEPTH : HUD_DEPTH;
      const panel = createTacticalPanel(scene, {
        width: region.width,
        height: region.height,
        depth,
        scrollFactor: 0,
        ...options
      });
      tracker.add(panel.objects);
      regionViews[regionKey].container.add(panel.objects);
      return panel;
    }

    addPanel("mission");
    addPanel("facility", { fill: THEME.terminal.panelRaised });
    addPanel("vitals");
    addPanel("weapon");
    addPanel("system", { fill: THEME.terminal.panelRaised });

    const textStyle = {
      color: THEME.text.primary,
      fontFamily: THEME.font.label,
      fontSize: THEME.fontSize.weaponHud
    };
    const mutedStyle = { ...textStyle, color: THEME.text.muted };
    const phaseText = createHudText(scene, tracker, mission.container, 12, 10, "", textStyle, HUD_DEPTH);
    const statsText = createHudText(scene, tracker, mission.container, 12, 38, "", mutedStyle, HUD_DEPTH);

    const facilityLamp = createStatusLamp(scene, {
      x: 14,
      y: 24,
      state: "contained",
      depth: FACILITY_DEPTH,
      scrollFactor: 0
    });
    tracker.add(facilityLamp.objects);
    facility.container.add(facilityLamp.objects);
    const eventBannerContainer = setHudDisplay(scene.add.container(28, 0), FACILITY_DEPTH);
    tracker.add(eventBannerContainer);
    facility.container.add([eventBannerContainer]);
    const eventBannerBg = createHudGraphic(scene, tracker, eventBannerContainer, FACILITY_DEPTH, (graphic) => {
      graphic.fillStyle(THEME.terminal.panelRaised, 1);
      graphic.fillRect?.(0, 0, regions.facility.width - 28, regions.facility.height);
    });
    const eventBannerTitle = createHudText(scene, tracker, eventBannerContainer, 8, 7, "", textStyle, FACILITY_DEPTH);
    const eventBannerDetail = createHudText(scene, tracker, eventBannerContainer, 8, 27, "", mutedStyle, FACILITY_DEPTH);

    const levelText = createHudText(scene, tracker, vitals.container, 12, 9, "", textStyle, HUD_DEPTH);
    const statsVitals = createHudText(scene, tracker, vitals.container, 88, 9, "", textStyle, HUD_DEPTH);
    const xpBarBackground = setHudDisplay(
      scene.add.rectangle(88, 40, 160, 8, THEME.terminal.disabled, 1),
      HUD_DEPTH
    );
    tracker.add(xpBarBackground);
    vitals.container.add([xpBarBackground]);
    const xpBarFill = setHudDisplay(
      scene.add.rectangle(88, 40, 160, 8, THEME.terminal.contained, 1),
      HUD_DEPTH
    );
    tracker.add(xpBarFill);
    vitals.container.add([xpBarFill]);
    const xpText = createHudText(scene, tracker, vitals.container, 12, 34, "", mutedStyle, HUD_DEPTH);

    const weaponImage = setHudDisplay(
      scene.add.image(36, 39, TEXTURES.weaponPistolIcon).setDisplaySize(WEAPON_ICON_SIZE, WEAPON_ICON_SIZE),
      HUD_DEPTH
    );
    tracker.add(weaponImage);
    weapon.container.add([weaponImage]);
    const weaponHudText = createHudText(scene, tracker, weapon.container, 70, 10, "", textStyle, HUD_DEPTH);
    const weaponDetailText = createHudText(scene, tracker, weapon.container, 70, 31, "", mutedStyle, HUD_DEPTH);
    const weaponDashText = createHudText(scene, tracker, weapon.container, 70, 52, "", mutedStyle, HUD_DEPTH);

    const pauseHitArea = setHudDisplay(scene.add.rectangle(60, 15, 96, 30, 0x000000, 0), HUD_DEPTH)
      .setInteractive({ useHandCursor: true });
    const muteHitArea = setHudDisplay(scene.add.rectangle(60, 51, 96, 26, 0x000000, 0), HUD_DEPTH)
      .setInteractive({ useHandCursor: true });
    tracker.add(pauseHitArea, muteHitArea);
    system.container.add([pauseHitArea, muteHitArea]);
    const pauseButtonLabel = createHudText(scene, tracker, system.container, 12, 4, "", textStyle, HUD_DEPTH);
    const muteText = createHudText(scene, tracker, system.container, 12, 37, "", mutedStyle, HUD_DEPTH);
    pauseHitArea.on("pointerdown", () => {
      if (!destroyed) onTogglePause();
    });
    muteHitArea.on("pointerdown", () => {
      if (destroyed || BALANCE.audio.enabled !== true) return;
      scene.soundMuted = !scene.soundMuted;
      scene.updateMuteText?.();
      onToggleMute();
    });

    const pickupWorldGraphic = scene.add.graphics().setDepth(HUD_DEPTH - 1).setScrollFactor(1).setVisible(false);
    tracker.add(pickupWorldGraphic);
    const outageDarknessRt = setHudDisplay(scene.add.renderTexture(0, 0, 960, 540), FACILITY_DEPTH)
      .setVisible(false);
    tracker.add(outageDarknessRt);
    facility.container.add([outageDarknessRt]);
    const outageLightSprite = setHudDisplay(scene.add.image(292, 24, TEXTURES.powerOutageLight), FACILITY_DEPTH)
      .setVisible(false);
    tracker.add(outageLightSprite);
    facility.container.add([outageLightSprite]);

    const refs = {
      statsText: statsVitals,
      levelText,
      xpBarBackground,
      xpBarFill,
      xpText,
      weaponHudText,
      phaseText,
      muteText,
      pauseButton: pauseHitArea,
      pauseButtonLabel,
      pickupRadiusIndicator: pickupWorldGraphic,
      eventBannerContainer,
      eventBannerBg,
      eventBannerTitle,
      eventBannerDetail,
      outageDarknessRt,
      outageLightSprite
    };
    const timelineContainers = selectTimelineHudContainers({
      mission: mission.container,
      vitals: vitals.container,
      weapon: weapon.container,
      facility: facility.container,
      system: system.container
    });

    function update(presentation = {}) {
      if (destroyed) return;
      const { mission: missionData = {}, vitals: vitalsData = {}, weapon: weaponData = {}, facility: facilityData = {}, system: systemData = {}, pickup: pickupData = {} } = presentation;
      phaseText.setText(missionData.title ?? "").setColor(toneColor(missionData.bossActive ? "danger" : "normal"));
      statsText.setText(`${missionData.detail ?? ""}  ${missionData.killsText ?? ""}`);
      levelText.setText(vitalsData.levelText ?? "");
      statsVitals.setText(vitalsData.healthText ?? "").setColor(toneColor(vitalsData.critical ? "danger" : "normal"));
      statsVitals.setAlpha(vitalsData.critical ? vitalsData.pulseAlpha ?? 1 : 1);
      xpText.setText(vitalsData.xpText ?? "");
      xpBarFill.setAlpha(vitalsData.xpRatio ?? 0);

      weaponHudText.setText(weaponData.name ?? "");
      weaponDetailText.setText(weaponData.statusText ?? weaponData.detail ?? "").setColor(toneColor(weaponData.statusTone));
      weaponDashText.setText(weaponData.dashText ?? "");
      if (weaponTextureExists(scene, weaponData.iconKey) && weaponImage.textureKey !== weaponData.iconKey) {
        weaponImage.setTexture(weaponData.iconKey);
      }

      facilityLamp.setState(facilityData.tone === "danger" ? "danger" : facilityData.tone === "warning" ? "warning" : "contained");
      eventBannerTitle.setText(facilityData.title ?? "").setColor(toneColor(facilityData.tone));
      eventBannerDetail.setText(facilityData.detail ?? "");
      eventBannerContainer.setVisible(facilityData.expanded === true);
      outageDarknessRt.setVisible(facilityData.tone === "warning");
      outageLightSprite.setVisible(facilityData.tone === "warning");

      pauseButtonLabel.setText(systemData.pauseLabel ?? "").setColor(toneColor(systemData.tone));
      muteText.setText(systemData.muteLabel ?? "").setColor(toneColor(systemData.tone));

      const cueActive = pickupCueUntilMs >= pickupData.nowMs;
      const pickupVisible = gameplayVisible && (pickupData.buildPanelVisible === true || cueActive);
      pickupWorldGraphic.setVisible(pickupVisible);
      if (pickupVisible && scene.player) {
        pickupWorldGraphic.clear();
        pickupWorldGraphic.lineStyle(2, THEME.terminal.contained, 0.75);
        pickupWorldGraphic.strokeCircle(scene.player.x, scene.player.y, pickupData.radius ?? 0);
      }
    }

    return {
      objects: tracker.objects,
      pickupWorldGraphic,
      regions: regionViews,
      refs,
      timelineContainers,
      controls: { pauseHitArea, muteHitArea },
      update,
      setGameplayVisible(visible) {
        gameplayVisible = visible === true;
        for (const regionKey of ["mission", "vitals", "weapon", "facility"]) {
          regionViews[regionKey].container.setVisible(gameplayVisible && (regionKey !== "facility" || !facilityCollapsed));
        }
        regionViews.system.container.setVisible(gameplayVisible);
        if (!gameplayVisible) pickupWorldGraphic.setVisible(false);
      },
      setFacilityCollapsed(collapsed) {
        facilityCollapsed = collapsed === true;
        facility.container.setVisible(gameplayVisible && !facilityCollapsed);
      },
      notifyPickupCue({ nowMs = 0, durationMs = 0 } = {}) {
        pickupCueUntilMs = Math.max(0, nowMs) + Math.max(0, durationMs);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        tracker.destroy();
      }
    };
  } catch (error) {
    destroyed = true;
    tracker.destroy();
    throw error;
  }
}
