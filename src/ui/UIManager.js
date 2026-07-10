// UIManager — a transitional facade over the HUD.
//
// STAGE NOTE: At this stage the UIManager owns no widgets of its own. It is a
// thin, stable-interface wrapper that FORWARDS to the HUD methods still defined
// on the scene (hud.js: updateUI, showTopBanner, setGameplayHudVisible, ...).
//
// The point is to give gameplay code a stable target (scene.ui.update(),
// scene.ui.showBanner(), scene.ui.setGameplayVisible()) so that when the HUD is
// actually rewritten in the second stage, only this file changes — not the many
// gameplay call sites.
//
// IMPORTANT — no forwarding recursion:
// The scene still calls its own this.updateUI() directly (unchanged). UIManager
// forwards the OTHER direction: ui.update() -> scene.updateUI(). It must never be
// wired so that scene.updateUI() calls ui.update() again, which would loop
// updateUI -> ui.update -> updateUI. UIManager only ever calls the concrete HUD
// methods on the scene; the HUD methods never call back into UIManager.
//
// Owned by the UI Agent.
export class UIManager {
  constructor(scene) {
    this.scene = scene;
  }

  // Per-frame HUD refresh. Forwards to the concrete HUD implementation.
  update() {
    this.scene.updateUI();
  }

  // Event / boss-warning banner. Forwards to the concrete HUD implementation.
  showBanner(title, detail, durationMs) {
    this.scene.showTopBanner(title, detail, durationMs);
  }

  // Show/hide the gameplay HUD cluster.
  setGameplayVisible(isVisible) {
    this.scene.setGameplayHudVisible(isVisible);
  }

  destroy() {
    this.scene = null;
  }
}
