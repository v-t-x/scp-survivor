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
