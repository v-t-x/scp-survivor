import { TEXTURES } from "../assets/manifest.js";
import {
  TRAVEL_DIRECTION_INDEX,
  createWeaponRigFireSnapshot,
  createWeaponRigPresentation
} from "./weaponRigPresentation.js";

export const WEAPON_RIG_LAYOUT = Object.freeze({
  shoulderX: 7,
  shoulderY: -13,
  moduleScale: 0.5,
  muzzleDistance: 18,
  tracerDistance: 7
});

const MODULE_TEXTURES = Object.freeze({
  pistol: TEXTURES.weaponRigPistol,
  shotgun: TEXTURES.weaponRigBreacher,
  tesla: TEXTURES.weaponRigTesla
});
const MODULE_IDS = Object.freeze(["pistol", "shotgun", "tesla"]);

const COLORS = Object.freeze({
  base: 0x111820,
  baseEdge: 0x526170,
  pivot: 0x667585,
  disabled: 0x27313b,
  active: 0x78c9b1,
  warning: 0xd69b54,
  charge: 0x67c7d9,
  muzzle: 0xf1d39a,
  tracer: 0x9fd8e8
});

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function setPosition(object, x, y) {
  if (typeof object.setPosition === "function") object.setPosition(x, y);
  else {
    object.x = x;
    object.y = y;
  }
}

function setVisible(object, visible) {
  if (typeof object.setVisible === "function") object.setVisible(visible);
  else object.visible = visible;
}

function setAlpha(object, alpha) {
  if (typeof object.setAlpha === "function") object.setAlpha(alpha);
  else object.alpha = alpha;
}

function drawBackpack(graphics) {
  graphics.clear();
  graphics.fillStyle(COLORS.base, 1);
  graphics.fillRect(-14, -18, 28, 36);
  graphics.lineStyle(2, COLORS.baseEdge, 1);
  graphics.strokeRect(-14, -18, 28, 36);
  graphics.fillStyle(COLORS.baseEdge, 1);
  graphics.fillRect(-10, -13, 20, 4);
  graphics.fillRect(-10, 9, 20, 4);
}

function drawStatus(graphics, state) {
  const indicatorAlpha = 1 - state.outageStrength * 0.75;
  graphics.clear();
  graphics.fillStyle(COLORS.base, 1);
  graphics.fillCircle(0, 0, 12);
  graphics.fillStyle(COLORS.pivot, 1);
  graphics.fillCircle(0, 0, 8);
  graphics.lineStyle(1, COLORS.baseEdge, 1);
  graphics.strokeCircle(0, 0, 12);

  if (state.weaponId === "pistol") {
    for (let index = 0; index < 5; index += 1) {
      graphics.fillStyle(index < state.channelCount ? COLORS.active : COLORS.disabled, indicatorAlpha);
      graphics.fillRect(-10 + index * 5, 15, 3, 5);
    }
    return;
  }

  if (state.weaponId === "shotgun") {
    const shellCount = Math.min(state.shellCount, state.magazineSize || state.shellCount, 8);
    for (let index = 0; index < shellCount; index += 1) {
      graphics.fillStyle(COLORS.warning, indicatorAlpha);
      graphics.fillCircle(-10 + index * 3, 16, 1.5);
    }
    if (state.mode === "reloading") {
      graphics.lineStyle(2, COLORS.warning, indicatorAlpha);
      graphics.lineBetween(-11, 22, 11, 22);
    }
    return;
  }

  if (state.weaponId === "tesla") {
    const chargeAlpha = indicatorAlpha * (1 - state.cooldownRatio * 0.65);
    for (let index = 0; index < 8; index += 1) {
      const x = -10 + (index % 4) * 7;
      const y = index < 4 ? 15 : 21;
      graphics.fillStyle(index < state.coilNodes ? COLORS.charge : COLORS.disabled, chargeAlpha);
      graphics.fillCircle(x, y, 2);
    }
    graphics.lineStyle(1, COLORS.charge, indicatorAlpha);
    graphics.strokeCircle(0, 0, 10);
  }
}

function getAnchor(snapshot) {
  return {
    x: finite(snapshot.anchorX, finite(snapshot.displayX, finite(snapshot.x, 0))),
    y: finite(snapshot.anchorY, finite(snapshot.displayY, finite(snapshot.y, 0)))
  };
}

export function createWeaponRigView(scene, { depth = 16 } = {}) {
  const objects = [];
  const modules = [];
  let base;
  let status;
  let muzzle;
  let tracer;

  try {
    base = scene.add.graphics();
    objects.push(base);
    base.setDepth(depth);
    status = scene.add.graphics();
    objects.push(status);
    status.setDepth(depth + 1);
    for (const weaponId of MODULE_IDS) {
      const module = scene.add.image(0, 0, MODULE_TEXTURES[weaponId]);
      objects.push(module);
      module.setDepth(depth + 2);
      modules.push(module);
    }
    muzzle = scene.add.graphics();
    objects.push(muzzle);
    muzzle.setDepth(depth + 3);
    tracer = scene.add.graphics();
    objects.push(tracer);
    tracer.setDepth(depth + 3);

    drawBackpack(base);
    for (const module of modules) {
      module.setOrigin?.(0.5, 0.5);
      module.setScale?.(WEAPON_RIG_LAYOUT.moduleScale);
    }
    setAlpha(muzzle, 0);
    setAlpha(tracer, 0);
    for (const object of objects) setVisible(object, false);
  } catch (error) {
    for (const object of objects) object.destroy?.();
    throw error;
  }

  const tweens = new Set();
  let presentationState = {};
  let effectTween = null;
  let paused = false;
  let destroyed = false;

  function update(snapshot = {}, deltaMs = 0) {
    if (destroyed) return;
    const state = createWeaponRigPresentation(snapshot, presentationState);
    presentationState = state;
    const { x, y } = getAnchor(snapshot);
    setPosition(base, x, y);
    setPosition(status, x + WEAPON_RIG_LAYOUT.shoulderX, y + WEAPON_RIG_LAYOUT.shoulderY);
    setVisible(base, true);
    setVisible(status, true);
    drawStatus(status, state);

    const frame = state.mode === "travel" ? TRAVEL_DIRECTION_INDEX : state.directionIndex;
    for (const [index, module] of modules.entries()) {
      const selected = state.weaponId === MODULE_IDS[index];
      setVisible(module, selected);
      if (!selected) continue;
      setPosition(module, x + WEAPON_RIG_LAYOUT.shoulderX, y + WEAPON_RIG_LAYOUT.shoulderY);
      module.setFrame?.(frame);
      setAlpha(module, 1);
    }
    void deltaMs;
  }

  function stopEffectTween() {
    if (!effectTween) return;
    effectTween.stop?.();
    tweens.delete(effectTween);
    effectTween = null;
  }

  function fire(snapshot = {}) {
    if (destroyed || paused) return;
    const fireState = createWeaponRigFireSnapshot(
      snapshot,
      presentationState.directionIndex ?? TRAVEL_DIRECTION_INDEX
    );
    if (!fireState.weaponId) return;

    stopEffectTween();
    const { x, y } = getAnchor(fireState);
    const shoulderX = x + WEAPON_RIG_LAYOUT.shoulderX;
    const shoulderY = y + WEAPON_RIG_LAYOUT.shoulderY;
    const directionX = Math.cos(fireState.aimAngle);
    const directionY = Math.sin(fireState.aimAngle);
    const muzzleX = shoulderX + directionX * WEAPON_RIG_LAYOUT.muzzleDistance;
    const muzzleY = shoulderY + directionY * WEAPON_RIG_LAYOUT.muzzleDistance;
    const tracerEndX = muzzleX - directionX * WEAPON_RIG_LAYOUT.tracerDistance;
    const tracerEndY = muzzleY - directionY * WEAPON_RIG_LAYOUT.tracerDistance;

    muzzle.clear();
    muzzle.fillStyle(COLORS.muzzle, 1);
    muzzle.fillCircle(0, 0, 6);
    setPosition(muzzle, muzzleX, muzzleY);
    tracer.clear();
    tracer.lineStyle(2, COLORS.tracer, 1);
    tracer.lineBetween(muzzleX, muzzleY, tracerEndX, tracerEndY);
    setPosition(tracer, 0, 0);
    setAlpha(muzzle, 1);
    setAlpha(tracer, 1);
    setVisible(muzzle, true);
    setVisible(tracer, true);

    let createdTween;
    createdTween = scene.tweens.add({
      targets: [muzzle, tracer],
      alpha: 0,
      duration: 90,
      ease: "Quad.Out",
      onComplete: (completedTween) => {
        const tween = completedTween ?? createdTween;
        if (tween) tweens.delete(tween);
        if (effectTween === tween) effectTween = null;
        setVisible(muzzle, false);
        setVisible(tracer, false);
      }
    });
    tweens.add(createdTween);
    effectTween = createdTween;
    if (paused) createdTween.pause?.();
  }

  function setPaused(nextPaused) {
    if (destroyed || paused === Boolean(nextPaused)) return;
    paused = Boolean(nextPaused);
    for (const tween of tweens) {
      if (paused) tween.pause?.();
      else tween.resume?.();
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const tween of tweens) tween.stop?.();
    tweens.clear();
    effectTween = null;
    for (const object of objects) object.destroy?.();
  }

  return { objects, update, fire, setPaused, destroy };
}
