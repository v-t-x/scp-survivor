import { TEXTURES } from "../assets/manifest.js";
import { BALANCE } from "../config/balance.js";
import { THEME } from "./theme.js";
import { createStatusLamp, createTacticalPanel } from "./tacticalUi.js";
import { selectTimelineHudContainers } from "./hudPresentation.js";

const HUD_DEPTH = 45;
const FACILITY_DEPTH = 58;
const OUTAGE_DEPTH = 40;
const WEAPON_ICON_SIZE = 48;
const PICKUP_RADIUS_CUE_DURATION_MS = 650;

function toneColor(tone) {
  return {
    contained: THEME.terminal.contained,
    warning: THEME.terminal.warning,
    danger: THEME.terminal.danger
  }[tone] ?? THEME.text.primary;
}

function cleanUpObject(object) {
  const stillOwnedByScene = object?.scene != null || object?.active !== false;
  if (stillOwnedByScene) {
    object?.disableInteractive?.();
    object?.removeInteractive?.();
  }
  object?.destroy?.();
  object?.removeAllListeners?.();
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

function trackCreatedObject(tracker, object) {
  tracker.add(object);
  return object;
}

function createHudText(scene, tracker, container, x, y, text, style, depth) {
  const label = trackCreatedObject(tracker, scene.add.text(x, y, text, style));
  setHudDisplay(label, depth).setOrigin(0, 0);
  container.add([label]);
  return label;
}

function createHudGraphic(scene, tracker, container, depth, draw) {
  const graphic = trackCreatedObject(tracker, scene.add.graphics());
  setHudDisplay(graphic, depth);
  draw(graphic);
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
  let facilityExpanded = false;
  let outageWarningVisible = false;
  let pickupCueUntilMs = -1;
  let previousPickupRadius;

  try {
    const regionViews = {};
    for (const regionKey of ["mission", "facility", "vitals", "weapon", "system"]) {
      const region = regions?.[regionKey];
      if (!region) throw new Error(`Missing tactical HUD region: ${regionKey}`);
      const depth = regionKey === "facility" ? FACILITY_DEPTH : HUD_DEPTH;
      const container = trackCreatedObject(tracker, scene.add.container(region.x, region.y));
      setHudDisplay(container, depth);
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
    const eventBannerTitle = createHudText(
      scene,
      tracker,
      facility.container,
      28,
      7,
      "",
      textStyle,
      FACILITY_DEPTH
    );
    const eventBannerContainer = trackCreatedObject(tracker, scene.add.container(28, 0));
    setHudDisplay(eventBannerContainer, FACILITY_DEPTH);
    facility.container.add([eventBannerContainer]);
    const eventBannerBg = createHudGraphic(scene, tracker, eventBannerContainer, FACILITY_DEPTH, (graphic) => {
      graphic.fillStyle(THEME.terminal.panelRaised, 1);
      graphic.fillRect?.(0, 23, regions.facility.width - 28, regions.facility.height - 23);
    });
    const eventBannerDetail = createHudText(scene, tracker, eventBannerContainer, 8, 27, "", mutedStyle, FACILITY_DEPTH);
    eventBannerContainer.setVisible(false);
    eventBannerBg.setVisible(false);
    eventBannerDetail.setVisible(false);

    const levelText = createHudText(scene, tracker, vitals.container, 12, 9, "", textStyle, HUD_DEPTH);
    const statsVitals = createHudText(scene, tracker, vitals.container, 88, 9, "", textStyle, HUD_DEPTH);
    const xpBarBackground = trackCreatedObject(
      tracker,
      scene.add.rectangle(88, 40, 160, 8, THEME.terminal.disabled, 1)
    );
    setHudDisplay(xpBarBackground, HUD_DEPTH);
    vitals.container.add([xpBarBackground]);
    const xpBarFill = trackCreatedObject(
      tracker,
      scene.add.rectangle(88, 40, 160, 8, THEME.terminal.contained, 1)
    );
    setHudDisplay(xpBarFill, HUD_DEPTH);
    vitals.container.add([xpBarFill]);
    const xpText = createHudText(scene, tracker, vitals.container, 12, 34, "", mutedStyle, HUD_DEPTH);

    const weaponImage = trackCreatedObject(
      tracker,
      scene.add.image(36, 39, TEXTURES.weaponPistolIcon)
    );
    weaponImage.setDisplaySize(WEAPON_ICON_SIZE, WEAPON_ICON_SIZE);
    setHudDisplay(weaponImage, HUD_DEPTH);
    weapon.container.add([weaponImage]);
    const weaponHudText = createHudText(scene, tracker, weapon.container, 70, 10, "", textStyle, HUD_DEPTH);
    const weaponDetailText = createHudText(scene, tracker, weapon.container, 70, 31, "", mutedStyle, HUD_DEPTH);
    const weaponDashText = createHudText(scene, tracker, weapon.container, 70, 52, "", mutedStyle, HUD_DEPTH);

    const pauseHitArea = trackCreatedObject(
      tracker,
      scene.add.rectangle(60, 15, 96, 30, 0x000000, 0)
    );
    setHudDisplay(pauseHitArea, HUD_DEPTH).setInteractive({ useHandCursor: true });
    const muteHitArea = trackCreatedObject(
      tracker,
      scene.add.rectangle(60, 51, 96, 26, 0x000000, 0)
    );
    setHudDisplay(muteHitArea, HUD_DEPTH).setInteractive({ useHandCursor: true });
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

    const pickupWorldGraphic = trackCreatedObject(tracker, scene.add.graphics());
    pickupWorldGraphic.setDepth(HUD_DEPTH - 1).setScrollFactor(1).setVisible(false);
    const outageDarknessRt = trackCreatedObject(
      tracker,
      scene.add.renderTexture(0, 0, 960, 540)
    );
    setHudDisplay(outageDarknessRt, OUTAGE_DEPTH).setOrigin(0, 0).setVisible(false);
    const outageLightSprite = trackCreatedObject(
      tracker,
      scene.add.image(0, 0, TEXTURES.powerOutageLight)
    );
    setHudDisplay(outageLightSprite, OUTAGE_DEPTH).setOrigin(0.5).setVisible(false);

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

    function syncFacilityVisibility() {
      facility.container.setVisible(gameplayVisible);
      eventBannerTitle.setVisible(true);
      const showExpanded = facilityExpanded && !facilityCollapsed;
      eventBannerContainer.setVisible(showExpanded);
      eventBannerBg.setVisible(showExpanded);
      eventBannerDetail.setVisible(showExpanded);
      const showOutage = gameplayVisible && outageWarningVisible;
      outageDarknessRt.setVisible(showOutage);
      // This sprite is an erase mask for the darkness render texture. Rendering
      // it directly would place a large white gradient over the player.
      outageLightSprite.setVisible(false);
    }

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
      facilityExpanded = facilityData.expanded === true;
      outageWarningVisible = facilityData.tone === "warning";
      const facilityTitle = facilityData.title ?? "";
      const facilityDetail = facilityData.detail ?? "";
      eventBannerTitle
        .setText(facilityExpanded ? facilityTitle : `${facilityTitle} // ${facilityDetail}`)
        .setColor(toneColor(facilityData.tone));
      eventBannerDetail.setText(facilityData.detail ?? "");
      syncFacilityVisibility();

      pauseButtonLabel.setText(systemData.pauseLabel ?? "").setColor(toneColor(systemData.tone));
      muteText.setText(systemData.muteLabel ?? "").setColor(toneColor(systemData.tone));

      const pickupNowMs = Number.isFinite(pickupData.nowMs)
        ? Math.max(0, pickupData.nowMs)
        : 0;
      const pickupRadius = Number.isFinite(pickupData.radius)
        ? Math.max(0, pickupData.radius)
        : 0;
      if (previousPickupRadius === undefined) {
        previousPickupRadius = pickupRadius;
      } else if (pickupRadius !== previousPickupRadius) {
        previousPickupRadius = pickupRadius;
        pickupCueUntilMs = Math.max(
          pickupCueUntilMs,
          pickupNowMs + PICKUP_RADIUS_CUE_DURATION_MS
        );
      }
      const cueActive = pickupNowMs < pickupCueUntilMs;
      const pickupVisible = gameplayVisible
        && scene.player
        && (pickupData.buildPanelVisible === true || cueActive);
      pickupWorldGraphic.setVisible(Boolean(pickupVisible));
      if (pickupVisible) {
        pickupWorldGraphic.clear();
        pickupWorldGraphic.lineStyle(2, THEME.terminal.contained, 0.75);
        pickupWorldGraphic.strokeCircle(scene.player.x, scene.player.y, pickupRadius);
      } else {
        pickupWorldGraphic.clear();
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
        for (const regionKey of ["mission", "vitals", "weapon", "system"]) {
          regionViews[regionKey].container.setVisible(gameplayVisible);
        }
        syncFacilityVisibility();
        if (!gameplayVisible) {
          pickupWorldGraphic.setVisible(false);
          pickupWorldGraphic.clear();
        }
      },
      setFacilityCollapsed(collapsed) {
        facilityCollapsed = collapsed === true;
        syncFacilityVisibility();
      },
      notifyPickupCue({ nowMs = 0, durationMs = 0 } = {}) {
        const safeDurationMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
        if (safeDurationMs <= 0) return;
        const safeNowMs = Number.isFinite(nowMs) ? Math.max(0, nowMs) : 0;
        pickupCueUntilMs = Math.max(pickupCueUntilMs, safeNowMs + safeDurationMs);
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
