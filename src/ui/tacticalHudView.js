import { TEXTURES } from "../assets/manifest.js";
import { BALANCE } from "../config/balance.js";
import { THEME } from "./theme.js";
import { SITE_CODE } from "./siteIdentity.js";
import { createHudTextOverlay } from "./hudTextOverlay.js";
import { selectTimelineHudContainers } from "./hudPresentation.js";

const HUD_DEPTH = 45;
const FACILITY_DEPTH = 58;
const OUTAGE_DEPTH = 40;
const WEAPON_ICON_SIZE = 34;
const INSTRUMENT = Object.freeze({
  ink: "#e5e8e4", secondary: "#bccacc", muted: "#9aa8ad",
  health: 0x83c9aa, critical: 0xd8786c, track: 0x142326,
  experience: 0x8baec7, rim: 0xa9b4a4
});
const PICKUP_RADIUS_CUE_DURATION_MS = 650;

function toneColor(tone) {
  return { warning: "#e7c688", danger: "#efac9f", contained: "#a7d8c0",
    anomaly: "#d5b1db", disabled: "#9aa8ad" }[tone] ?? INSTRUMENT.ink;
}

function boundedRatio(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function updateBar(bar, width, ratio) {
  bar.setDisplaySize(width * boundedRatio(ratio), bar.height);
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
  let textOverlay;
  const labels = [];
  let gameplayVisible = true;
  let facilityCollapsed = false;
  let facilityExpanded = false;
  let topBannerActive = false;
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

    // These are local visual objects, owned by the existing five regions.
    function text(container, name, x, y, value = "", size = 14, color = INSTRUMENT.ink, mono = false) {
      const label = createHudText(scene, tracker, container, x, y, value, {
        color, fontFamily: mono ? 'Bahnschrift, "Arial Narrow", sans-serif' : THEME.font.label,
        fontSize: size + "px", fontStyle: mono ? "600" : "", resolution: 2
      }, container.depth);
      label.name = name;
      labels.push(label);
      return label;
    }

    function rect(container, name, x, y, width, height, color, alpha = 1) {
      const shape = trackCreatedObject(tracker, scene.add.rectangle(x, y, width, height, color, alpha));
      setHudDisplay(shape, container.depth).setOrigin(0, 0);
      shape.name = name;
      container.add([shape]);
      return shape;
    }

    function graphic(container, name, draw) {
      const shape = createHudGraphic(scene, tracker, container, container.depth, draw);
      shape.name = name;
      return shape;
    }

    function polygon(g, points, color, alpha = 1) {
      g.fillStyle(color, alpha).beginPath().moveTo(...points[0]);
      for (const point of points.slice(1)) g.lineTo(...point);
      g.closePath().fillPath();
    }

    // Narrow graphite instruments retain the approved cut corners and sage lip.
    function panel(container, width, height, kind = "mission", x = 0, y = 0) {
      return graphic(container, "", (g) => {
        const topAt = (p) => kind === "left" ? Math.max(0, p - width + 12)
          : kind === "right" ? Math.max(0, 12 - p)
          : Math.max(0, 8 - p, p - width + 16);
        const bottomAt = (p) => height - (kind === "left" ? Math.max(0, p - width + 8)
          : kind === "right" ? Math.max(0, 8 - p) : 0);
        const stops = [...new Set([0, 8, 12, width - 16, width - 12, width - 8, width,
          ...Array.from({ length: 17 }, (_, i) => width * i / 16)])].sort((a, b) => a - b);
        for (let i = 0; i < stops.length - 1; i++) {
          const a = stops[i], b = stops[i + 1], t = (a + b) / (2 * width);
          const rgb = kind === "boss" ? [[57, 45, 46], [36, 43, 46]]
            : [[45, 62, 60], [29, 44, 49]];
          const color = rgb[0].reduce((value, channel, k) =>
            (value << 8) + Math.round(channel + (rgb[1][k] - channel) * t), 0);
          polygon(g, [[x+a,y+topAt(a)], [x+b,y+topAt(b)], [x+b,y+bottomAt(b)], [x+a,y+bottomAt(a)]], color, 0.97);
        }
        g.lineStyle(1, 0x708480, 0.65).beginPath()
          .moveTo(x+(kind === "right" ? 8 : 0), y+height-0.5)
          .lineTo(x+width-(kind === "left" ? 8 : 0), y+height-0.5).strokePath();
      });
    }

    function fit(label, value, size, maxWidth) {
      label.setText(value);
      if (typeof label.setFontSize === "function") {
        label.setFontSize(size);
        if (label.width > maxWidth) label.setFontSize(Math.max(10, size * maxWidth / label.width));
      }
      return label;
    }

    function child(container, name, screenX, screenY) {
      const group = trackCreatedObject(tracker, scene.add.container(screenX - container.x, screenY - container.y));
      setHudDisplay(group, container.depth);
      group.name = name;
      container.add([group]);
      return group;
    }

    panel(mission.container, 416, 48);
    const missionLip = rect(mission.container, "", 12, 0, 386, 1, INSTRUMENT.rim);
    panel(vitals.container, 238, 70, "left");
    rect(vitals.container, "", 0, 0, 226, 2, INSTRUMENT.rim);
    panel(weapon.container, 232, 70, "right");
    rect(weapon.container, "", 12, 0, 220, 2, INSTRUMENT.rim);

    graphic(mission.container, "", (g) =>
      polygon(g, [[8,2],[75,2],[75,46],[2,46],[2,8]], 0xaeb9a8));
    text(mission.container, "", 10, 5, "生存时间", 10, "#202d2e");
    const elapsedText = text(mission.container, "elapsedTime", 10, 18, "00:00", 24, "#202d2e", true);
    const phaseText = text(mission.container, "", 85, 6, "", 14);
    const missionDetail = text(mission.container, "", 85, 28, "", 12, INSTRUMENT.secondary);
    const killsText = text(mission.container, "", 295, 28, "", 12, INSTRUMENT.secondary);
    killsText.setOrigin(1, 0);
    rect(mission.container, "", 305, 8, 1, 32, 0x8fa69a, 0.25);

    const bossHud = child(mission.container, "bossHud", 446, 12);
    panel(bossHud, 274, 46, "boss");
    rect(bossHud, "", 12, 0, 244, 1, 0xb3746a);
    text(bossHud, "", 12, 5, "SCP-049", 15, INSTRUMENT.ink, true);
    text(bossHud, "", 88, 8, "终局目标", 10, "#c6ada6");
    const bossPercent = text(bossHud, "bossPercent", 262, 4, "", 17, INSTRUMENT.ink, true);
    bossPercent.setOrigin(1, 0);
    rect(bossHud, "", 12, 28, 250, 8, 0x191e23);
    const bossHealthBar = rect(bossHud, "bossHealthBar", 12, 28, 250, 6, 0xc78272);
    bossHud.setVisible(false);

    // Facility remains an independent timeline target, visually inside mission.
    // Only the 24px detail extension belongs to the fading notification surface.
    const eventBannerContainer = trackCreatedObject(tracker, scene.add.container(0, 0));
    setHudDisplay(eventBannerContainer, FACILITY_DEPTH);
    facility.container.add([eventBannerContainer]);
    const eventBannerBg = createHudGraphic(scene, tracker, eventBannerContainer, FACILITY_DEPTH, (g) => {
      g.fillStyle(0x243438, 0.97).fillRect(-305, 48, 416, 24);
      g.fillStyle(0x708480, 0.65).fillRect(-305, 71, 416, 1);
    });
    const eventBannerDetail = text(eventBannerContainer, "", -293, 52, "", 12, "#e1dfd0");
    const facilitySignal = rect(facility.container, "facilitySignal", 11, 13, 5, 5, 0x85b29d);
    const eventBannerTitle = text(facility.container, "", 22, 7, "", 12);
    const facilitySite = text(facility.container, "facilitySite", 11, 30, SITE_CODE, 9, INSTRUMENT.muted, true);
    eventBannerContainer.setVisible(false);
    eventBannerBg.setVisible(false);
    eventBannerDetail.setVisible(false);

    const medical = graphic(vitals.container, "", (g) => {
      polygon(g, [[17,13],[23,13],[23,17],[27,17],[27,23],[23,23],[23,27],[17,27],[17,23],[13,23],[13,17],[17,17]], INSTRUMENT.health);
    });
    const healthLabel = text(vitals.container, "", 12, 33, "生命", 11, INSTRUMENT.secondary);
    const statsVitals = text(vitals.container, "", 36, 1, "", 27, INSTRUMENT.ink, true);
    const healthMax = text(vitals.container, "", 75, 14, "", 12, INSTRUMENT.secondary, true);
    const lowHealthLabel = text(vitals.container, "lowHealthLabel", 12, 33, "危急", 11, "#ffb2a1");
    lowHealthLabel.setVisible(false);
    const criticalAccent = rect(vitals.container, "", 0, 0, 226, 2, INSTRUMENT.critical);
    criticalAccent.setVisible(false);
    rect(vitals.container, "", 40, 36, 104, 8, INSTRUMENT.track);
    const healthBar = rect(vitals.container, "healthBar", 40, 36, 104, 6, INSTRUMENT.health);
    const healthGlint = rect(vitals.container, "", 40, 36, 104, 1, 0xc9f0d9, 0.75);
    for (const step of [1, 2, 3]) rect(vitals.container, "", 40 + 26 * step, 36, 1, 6, 0x122a24, 0.4);
    rect(vitals.container, "", 12, 48, 214, 1, 0x8caaa3, 0.24);
    const levelText = text(vitals.container, "", 12, 53, "", 12);
    const xpLabel = text(vitals.container, "", 56, 54, "经验", 11, INSTRUMENT.secondary);
    const xpBarBackground = rect(vitals.container, "", 85, 59, 91, 4, INSTRUMENT.track);
    const xpBarFill = rect(vitals.container, "", 85, 59, 91, 3, INSTRUMENT.experience);
    const xpText = text(vitals.container, "", 226, 54, "", 11, INSTRUMENT.secondary, true);
    xpText.setOrigin(1, 0);

    graphic(weapon.container, "", (g) =>
      polygon(g, [[12,9],[41,9],[47,15],[47,36],[12,36]], 0x52635c, 0.45));
    rect(weapon.container, "", 12, 9, 2, 27, 0x9fae9a);
    const weaponImage = trackCreatedObject(tracker, scene.add.image(30, 23, TEXTURES.weaponPistolIcon));
    weaponImage.setDisplaySize(WEAPON_ICON_SIZE, WEAPON_ICON_SIZE);
    setHudDisplay(weaponImage, HUD_DEPTH);
    weapon.container.add([weaponImage]);
    const weaponLevel = text(weapon.container, "weaponLevel", 13, 43, "", 11, "#c3cbbb", true);
    const weaponHudText = text(weapon.container, "", 56, 6, "", 14);
    const weaponStatus = text(weapon.container, "weaponStatus", 56, 28, "", 12);
    const weaponDetail = text(weapon.container, "weaponDetail", 56, 46, "", 12, INSTRUMENT.secondary);

    const dashHud = child(vitals.container, "dashHud", 168, 466);
    rect(dashHud, "", 0, 0, 1, 33, 0x77877c, 0.48);
    text(dashHud, "", 8, 0, "闪避", 12);
    rect(dashHud, "", 37, 1, 33, 15, 0x243336).setStrokeStyle(1, 0x728284, 0.47);
    text(dashHud, "", 40, 2, "SPACE", 8, "#a4b1b5", true);
    const dashIcon = graphic(dashHud, "dashIcon", () => {});
    const weaponDashText = text(dashHud, "dashText", 28, 16, "", 12);
    rect(dashHud, "", 9, 34, 61, 3, INSTRUMENT.track);
    const dashBar = rect(dashHud, "dashBar", 9, 34, 61, 3, 0x8cceaf);
    let previousDashReady;
    let previousCritical;

    // Visible control faces stay light; the full 96x40 areas remain clickable.
    panel(system.container, 92, 32, "mission", 2, 3);
    panel(system.container, 92, 32, "mission", 102, 3);
    const pauseHitArea = trackCreatedObject(tracker, scene.add.rectangle(48, 20, 96, 40, 0, 0));
    setHudDisplay(pauseHitArea, HUD_DEPTH).setInteractive({ useHandCursor: true });
    const muteHitArea = trackCreatedObject(tracker, scene.add.rectangle(148, 20, 96, 40, 0, 0));
    setHudDisplay(muteHitArea, HUD_DEPTH).setInteractive({ useHandCursor: true });
    system.container.add([pauseHitArea, muteHitArea]);
    graphic(system.container, "", (g) => {
      g.lineStyle(1.6, 0xcbd2d0, 1).beginPath().moveTo(14,13).lineTo(14,25)
        .moveTo(19,13).lineTo(19,25).strokePath();
      g.beginPath().moveTo(111,17).lineTo(114,17).lineTo(119,13).lineTo(119,25)
        .lineTo(114,21).lineTo(111,21).closePath().strokePath();
      g.beginPath().moveTo(123,15).lineTo(126,19).lineTo(123,23).strokePath();
    });
    const pauseButtonLabel = text(system.container, "", 29, 10, "", 12);
    const muteText = text(system.container, "", 132, 10, "", 12);
    rect(system.container, "", 62, 11, 24, 16, 0x243336).setStrokeStyle(1, 0x728284, 0.47);
    text(system.container, "", 65, 12, "ESC", 10, "#a4b1b5", true);
    rect(system.container, "", 177, 11, 13, 16, 0x243336).setStrokeStyle(1, 0x728284, 0.47);
    const muteKey = text(system.container, "", 180, 12, "M", 10, "#a4b1b5", true);
    const pauseActive = rect(system.container, "pauseActive", 2, 34, 92, 1, 0xe3b668);
    const muteActive = rect(system.container, "muteActive", 102, 34, 92, 1, 0xe3b668);
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
      const showExpanded = topBannerActive || (facilityExpanded && !facilityCollapsed);

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
      const elapsedSeconds = Math.floor(Math.max(0, pickupData.nowMs ?? 0) / 1000);
      elapsedText.setText(String(Math.floor(elapsedSeconds / 60)).padStart(2, "0") + ":" + String(elapsedSeconds % 60).padStart(2, "0"));
      killsText.setText(missionData.killsText ?? "");
      fit(phaseText, missionData.bossActive ? "终局收容" : missionData.title ?? "", 14, 210);
      fit(missionDetail, missionData.bossActive ? "进行中" : missionData.detail ?? "", 12, 142);
      bossHud.setVisible(missionData.active === true && missionData.bossActive === true);
      updateBar(bossHealthBar, 250, missionData.bossHealthRatio);
      bossPercent.setText(Math.round(boundedRatio(missionData.bossHealthRatio) * 100) + "%");

      const [health = "", maximum = ""] = (vitalsData.healthText ?? "").split(" / ");
      fit(statsVitals, health, 27, 69).setColor(INSTRUMENT.ink).setAlpha(1);
      fit(healthMax, "/ " + maximum, 12, 43);
      healthMax.x = statsVitals.x + (statsVitals.width ?? health.length * 14) + 3;
      const critical = vitalsData.critical === true;
      healthLabel.setVisible(!critical);
      lowHealthLabel.setVisible(critical);
      criticalAccent.setVisible(critical).setAlpha(vitalsData.pulseAlpha ?? 1);
      if (critical !== previousCritical) {
        previousCritical = critical;
        medical.clear();
        polygon(medical, [[17,13],[23,13],[23,17],[27,17],[27,23],[23,23],[23,27],[17,27],[17,23],[13,23],[13,17],[17,17]],
          critical ? 0xf49086 : INSTRUMENT.health);
      }
      healthBar.setFillStyle(critical ? INSTRUMENT.critical : INSTRUMENT.health);
      healthGlint.setFillStyle(critical ? 0xffd2c5 : 0xc9f0d9, 0.75);
      updateBar(healthBar, 104, vitalsData.healthRatio);
      updateBar(healthGlint, 104, vitalsData.healthRatio);
      fit(levelText, vitalsData.levelText ?? "", 12, 50);
      xpText.setText(vitalsData.xpText ?? "");
      // XP retains all digits and yields track width as levels and totals grow.
      xpLabel.x = 12 + (levelText.width ?? 39) + 5;
      xpBarBackground.x = xpBarFill.x = xpLabel.x + 29;
      const xpWidth = Math.max(8, 226 - (xpText.width ?? 39) - 7 - xpBarBackground.x);
      xpBarBackground.setDisplaySize(xpWidth, 4);
      updateBar(xpBarFill, xpWidth, vitalsData.xpRatio);

      fit(weaponHudText, weaponData.name ?? "", 14, 164);
      fit(weaponStatus, weaponData.statusText ?? "", 12, 164).setColor(toneColor(weaponData.statusTone));
      const detailMatch = /^(?:等级) (\d+) · (.*)$/.exec(weaponData.detail ?? "");
      weaponLevel.setText(detailMatch ? "Lv. " + detailMatch[1] : "").setVisible(Boolean(detailMatch));
      fit(weaponDetail, detailMatch ? detailMatch[2] : weaponData.detail ?? "", 12, 164);
      const ready = weaponData.dashReady === true;
      weaponDashText.setText(ready ? "" : (weaponData.dashText ?? "").replace(/^闪避\s*(?:冷却\s*)?/, ""));
      dashBar.setFillStyle(ready ? 0x8cceaf : 0x8faaa8).setVisible(true);
      updateBar(dashBar, 61, weaponData.dashRatio);
      if (ready !== previousDashReady) {
        previousDashReady = ready;
        dashIcon.clear().lineStyle(1.8, ready ? 0x9adfc3 : 0x81958f, 1).beginPath();
        const x = ready ? 28 : 9, y = 18, span = ready ? 5 : 4, gap = ready ? 9 : 7;
        for (const offset of [0, gap]) dashIcon.moveTo(x+offset,y).lineTo(x+offset+span,y+5).lineTo(x+offset,y+10);
        dashIcon.strokePath();
      }
      if (weaponTextureExists(scene, weaponData.iconKey) && weaponImage.texture?.key !== weaponData.iconKey) {
        weaponImage.setTexture(weaponData.iconKey);
      }

      facilitySignal.setFillStyle({ warning: 0xe3b668, danger: 0xe87770, anomaly: 0xc8a0ff }[facilityData.tone] ?? 0x85b29d);
      missionLip.setFillStyle({ warning: 0xb29569, danger: 0xb97669 }[facilityData.tone] ?? INSTRUMENT.rim);
      facilityExpanded = facilityData.expanded === true;
      outageWarningVisible = facilityData.tone === "warning";
      fit(eventBannerTitle, facilityData.title ?? "", 12, 87).setColor(toneColor(facilityData.tone));
      eventBannerDetail.setText(facilityData.detail ?? "");
      syncFacilityVisibility();

      pauseButtonLabel.setText(systemData.paused ? "继续" : "暂停").setColor(INSTRUMENT.ink);
      fit(muteText, BALANCE.audio.enabled !== true ? "音频 关闭" : systemData.muted ? "静音" : "音频开", 12, 42).setColor(INSTRUMENT.ink);
      pauseActive.setVisible(systemData.paused === true);
      muteActive.setVisible(BALANCE.audio.enabled === true && systemData.muted === true);
      muteKey.setAlpha(BALANCE.audio.enabled === true ? 1 : 0.5);

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

    textOverlay = createHudTextOverlay(scene, labels);

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
      setTopBannerActive(active) {
        topBannerActive = active === true;
        syncFacilityVisibility();
      },
      setFacilityCollapsed(collapsed) {
        facilityCollapsed = collapsed === true;
        if (facilityCollapsed && scene.topBannerState === null) topBannerActive = false;
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
        textOverlay?.destroy();
        tracker.destroy();
      }
    };
  } catch (error) {
    destroyed = true;
    textOverlay?.destroy();
    tracker.destroy();
    throw error;
  }
}
