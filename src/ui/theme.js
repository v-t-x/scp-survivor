// Theme — central catalogue of the UI's colors, fonts, sizes, and spacing.
//
// STAGE NOTE: This file only *collects* values that already exist scattered
// across the scene modules (hud.js, menus.js, progression.js, etc.). It does NOT
// yet replace those literals. Migrating the ~113 color literals to reference this
// theme is deliberately deferred to the second-stage UI work, so nothing about
// the current appearance changes now.
//
// Owned by the UI/art Agent. When the UI is reworked, modules should import from
// here and the literals should be swapped one call site at a time.

// Text colors use CSS hex strings (Phaser text style `color`).
// Shape/graphics colors use numeric 0x hex (Phaser fill/stroke style).
export const THEME = {
  color: {
    // Text (CSS strings)
    text: {
      primary: "#e2e8ff",
      level: "#a7f3d0",
      xp: "#e2e8ff",
      mute: "#d5d5ff",
      weaponHud: "#cbd8ff",
      phase: "#ffdf9a",
      pauseLabel: "#dfe8ff",
      bannerTitle: "#fff2be",
      bannerDetail: "#d8e6ff",
      panelTitle: "#ffffff",
      panelBody: "#e9f0ff",
      damageNumber: "#ffe9a8",
      eliteNeutralized: "#ffe6a2"
    },
    // Shapes / graphics (numeric)
    shape: {
      background: 0x111319,
      xpBarTrack: 0x223344,
      xpBarFill: 0x54d67b,
      pauseButton: 0x243049,
      pauseButtonHover: 0x33436a,
      pauseButtonStroke: 0x5f78b0,
      panelOverlay: 0x000000,
      panelStroke: 0x4060a0,
      bannerStroke: 0x5f7cb8,
      pickupRadius: 0x50d66c,
      arenaBorder: 0x3a4664,
      arenaGrid: 0x191f2b
    }
  },

  surface: {
    facility: 0x080c16,
    panel: 0x141c2f,
    raised: 0x243049,
    overlay: 0x000000
  },

  text: {
    primary: "#e2e8ff",
    secondary: "#c5d2ee",
    muted: "#8fa2c8",
    critical: "#ff8a8a",
    contained: "#a7f3d0",
    onButton: "#ffffff"
  },

  signal: {
    info: 0x6f91d8,
    warning: 0xffdf9a,
    danger: 0xff6b6b,
    contained: 0x54d67b,
    anomaly: 0xc8a0ff
  },

  border: {
    default: 0x40557f,
    focus: 0x6f91d8,
    warning: 0xffb347,
    critical: 0xff6b6b
  },

  motion: {
    stableMs: 120,
    warningMs: 800,
    anomalyJitterPx: 3,
    criticalBannerMs: 3200
  },

  font: {
    display: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
    body: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
    mono: 'Consolas, "Courier New", monospace',
    label: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif'
  },

  // Font sizes as used in Phaser text styles.
  fontSize: {
    stats: "18px",
    level: "18px",
    xp: "16px",
    mute: "14px",
    pauseLabel: "13px",
    weaponHud: "14px",
    phase: "14px",
    bannerTitle: "18px",
    bannerDetail: "13px",
    panelTitle: "28px",
    panelBody: "16px",
    damageNumber: "14px"
  },

  // Layout spacing / line spacing values currently used in the HUD.
  spacing: {
    hudPaddingX: 14,
    hudPaddingTop: 12,
    weaponHudLineSpacing: 3,
    panelLineSpacing: 6
  }
};
