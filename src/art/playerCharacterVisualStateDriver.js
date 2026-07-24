import { syncCharacterPresentation } from "./characterPresentation.js";
import { applyTextureAndScalePreservingBody } from "./presentationRules.js";

const FACING_ANGLES = Object.freeze({
  down: Math.PI / 2,
  left: Math.PI,
  right: 0,
  up: -Math.PI / 2
});
const MOTIONS = Object.freeze([
  "idle", "forward", "backward", "strafeLeft", "strafeRight", "hit"
]);
const SPEED = 80;
const clean = (value) => Math.abs(value) < 1e-9 ? 0 : value;

function velocityFor(angle, motion) {
  const forward = [Math.cos(angle), Math.sin(angle)];
  const right = [-forward[1], forward[0]];
  const units = {
    idle: [0, 0],
    forward,
    backward: [-forward[0], -forward[1]],
    strafeLeft: [-right[0], -right[1]],
    strafeRight: right,
    hit: [0, 0]
  }[motion];
  return Object.freeze({ x: clean(units[0] * SPEED), y: clean(units[1] * SPEED) });
}

export const PLAYER_CHARACTER_VISUAL_STATES = Object.freeze(Object.fromEntries(
  Object.entries(FACING_ANGLES).flatMap(([facing, angle]) => MOTIONS.map((motion) => [
    `${facing}-${motion}`,
    Object.freeze({ facing, motion, angle, velocity: velocityFor(angle, motion) })
  ]))
));

function bodySnapshot(body) {
  return Object.freeze({
    x: body.x, y: body.y, width: body.width, height: body.height,
    offsetX: body.offset?.x ?? 0, offsetY: body.offset?.y ?? 0
  });
}

export function createPlayerCharacterVisualStateDriver({
  scene,
  syncPresentation = syncCharacterPresentation
}) {
  if (!scene?.player?.body || !scene.player.anims) {
    throw new Error("player character prototype requires an active player sprite");
  }
  const player = scene.player;
  if (player.isTinted) {
    throw new Error("wait for player hit tint to clear before starting character prototype review");
  }
  const original = {
    hasPrototypeEnabled: Object.hasOwn(player, "presentationPrototypeEnabled"),
    prototypeEnabled: player.presentationPrototypeEnabled,
    hasOverride: Object.hasOwn(player, "presentationSmokeOverride"),
    override: player.presentationSmokeOverride,
    animationFamily: player.presentationAnimationFamily,
    presentationFacing: player.presentationFacing,
    textureKey: player.texture?.key ?? null,
    scale: player.scaleX,
    flipX: player.flipX,
    animationKey: player.anims.currentAnim?.key ?? null,
    animationProgress: player.anims.getProgress?.() ?? 0
  };
  let restored = false;

  function restorePresentation() {
    if (original.hasPrototypeEnabled) {
      player.presentationPrototypeEnabled = original.prototypeEnabled;
    } else {
      delete player.presentationPrototypeEnabled;
    }
    if (original.hasOverride) {
      player.presentationSmokeOverride = original.override;
    } else {
      delete player.presentationSmokeOverride;
    }
    player.presentationAnimationFamily = original.animationFamily;
    player.presentationFacing = original.presentationFacing;
    if (original.textureKey) {
      applyTextureAndScalePreservingBody(player, original.textureKey, original.scale);
    }
    player.setFlipX?.(original.flipX);
    if (original.animationKey) {
      player.play(original.animationKey, true);
      player.anims.setProgress?.(original.animationProgress);
    } else {
      player.anims.stop?.();
    }
  }

  function restore() {
    if (restored) return;
    restored = true;
    restorePresentation();
  }

  function applyState(name, { usePrototype = true } = {}) {
    if (restored) throw new Error("player character prototype driver already restored");
    const state = PLAYER_CHARACTER_VISUAL_STATES[name];
    if (!state) throw new Error(`unknown player character visual state: ${name}`);
    const beforeBody = bodySnapshot(player.body);
    try {
      const override = Object.freeze({
        facingAngle: state.angle,
        velocityX: state.velocity.x,
        velocityY: state.velocity.y,
        hit: state.motion === "hit"
      });
      player.presentationPrototypeEnabled = usePrototype;
      player.presentationSmokeOverride = override;
      syncPresentation(scene, override);
      const body = bodySnapshot(player.body);
      // World geometry (x/y/width/height) is the gameplay-relevant invariant.
      // applyTextureAndScalePreservingBody legitimately recomputes body.offset
      // from the new frame's displayOrigin to keep that world geometry stable,
      // so offsets are reported in the snapshot but excluded from this guard.
      for (const field of ["x", "y", "width", "height"]) {
        if (body[field] !== beforeBody[field]) {
          throw new Error(`player body ${field} changed in visual state ${name}`);
        }
      }
      return Object.freeze({
        name,
        animationKey: player.anims.currentAnim?.key ?? null,
        textureKey: player.texture?.key ?? null,
        scaleX: player.scaleX,
        scaleY: player.scaleY,
        body
      });
    } catch (error) {
      restore();
      throw error;
    }
  }

  return Object.freeze({
    listStates: () => Object.keys(PLAYER_CHARACTER_VISUAL_STATES),
    applyState,
    restore
  });
}

export function installPlayerCharacterVisualStateBridge(scene, windowRef = window) {
  const driver = createPlayerCharacterVisualStateDriver({ scene });
  windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__?.restore?.();
  Object.defineProperty(windowRef, "__SCP_PLAYER_CHARACTER_PROTOTYPE__", {
    configurable: true,
    value: driver
  });
  const cleanup = () => {
    driver.restore();
    delete windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__;
    scene.events.off("shutdown", cleanup);
    scene.events.off("destroy", cleanup);
  };
  scene.events.once("shutdown", cleanup);
  scene.events.once("destroy", cleanup);
  return driver;
}
