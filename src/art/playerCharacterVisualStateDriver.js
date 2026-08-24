import { createPlayerPresentationSnapshot } from "./playerPresentationModel.js";

const FACING_ANGLES = Object.freeze({
  down: Math.PI / 2,
  left: Math.PI,
  right: 0,
  up: -Math.PI / 2
});
const MOTIONS = Object.freeze([
  "idle",
  "forward",
  "backward",
  "strafeLeft",
  "strafeRight",
  "hit"
]);
const SPEED = 80;
const PREVIEW_MODES = Object.freeze(new Set([
  "body",
  "legacy",
  "static",
  "sample-a",
  "sample-b",
  "two-direction"
]));
const BRIDGE_MODES = Object.freeze(new Set(["states", ...PREVIEW_MODES]));
const GLOBAL_ENTRY = "__SCP_PLAYER_PRESENTATION_PREVIEW__";
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
  return Object.freeze({
    x: clean(units[0] * SPEED),
    y: clean(units[1] * SPEED)
  });
}

export const PLAYER_CHARACTER_VISUAL_STATES = Object.freeze(Object.fromEntries(
  Object.entries(FACING_ANGLES).flatMap(([facing, angle]) =>
    MOTIONS.map((motion) => [
      `${facing}-${motion}`,
      Object.freeze({
        facing,
        motion,
        angle,
        velocity: velocityFor(angle, motion)
      })
    ])
  )
));

function createOverride(mode, {
  facingAngle,
  velocityX,
  velocityY,
  hit
}) {
  return Object.freeze({
    mode,
    facingAngle,
    velocityX,
    velocityY,
    hit
  });
}

export function createPlayerCharacterVisualStateDriver({ scene }) {
  const playerPresentation = scene?.playerPresentation;
  if (
    !playerPresentation
    || typeof playerPresentation.setPreviewOverride !== "function"
    || typeof playerPresentation.update !== "function"
    || typeof playerPresentation.snapshot !== "function"
  ) {
    throw new Error("player presentation preview requires an active presentation controller");
  }
  let restored = false;

  function updatePresentation(
    override,
    delta = 0,
    snapshot = createPlayerPresentationSnapshot(scene)
  ) {
    if (restored) {
      throw new Error("player presentation preview driver already restored");
    }
    if (playerPresentation.setPreviewOverride(override) !== true) {
      throw new Error("presentation controller rejected preview override");
    }
    if (
      playerPresentation.update(
        snapshot,
        Number.isFinite(delta) ? delta : 0
      ) !== true
    ) {
      restore();
      throw new Error("presentation controller rejected preview update");
    }
  }

  function applyState(name, { mode = "body" } = {}) {
    if (!PREVIEW_MODES.has(mode)) {
      throw new Error(`unknown player presentation preview mode: ${mode}`);
    }
    const state = PLAYER_CHARACTER_VISUAL_STATES[name];
    if (!state) {
      throw new Error(`unknown player character visual state: ${name}`);
    }
    updatePresentation(createOverride(mode, {
      facingAngle: state.angle,
      velocityX: state.velocity.x,
      velocityY: state.velocity.y,
      hit: state.motion === "hit"
    }));
    return Object.freeze({
      name,
      ...playerPresentation.snapshot()
    });
  }

  function applyLiveState(mode, delta = 0) {
    if (!PREVIEW_MODES.has(mode)) {
      throw new Error(`unknown player presentation preview mode: ${mode}`);
    }
    const snapshot = createPlayerPresentationSnapshot(scene);
    updatePresentation(createOverride(mode, {
      facingAngle: snapshot.facingAngle,
      velocityX: snapshot.velocityX,
      velocityY: snapshot.velocityY,
      hit: scene?.player?.isTinted === true
    }), delta, snapshot);
    return playerPresentation.snapshot();
  }

  function restore() {
    if (restored) {
      return true;
    }
    try {
      if (playerPresentation.setPreviewOverride(null) !== true) {
        return false;
      }
      if (
        playerPresentation.update(
          createPlayerPresentationSnapshot(scene),
          0
        ) !== true
      ) {
        return false;
      }
    } catch {
      return false;
    }
    restored = true;
    return true;
  }

  function snapshot() {
    return Object.freeze({
      ...playerPresentation.snapshot(),
      restored
    });
  }

  return Object.freeze({
    listStates: () => Object.keys(PLAYER_CHARACTER_VISUAL_STATES),
    applyState,
    applyLiveState,
    restore,
    snapshot
  });
}

export function installPlayerCharacterVisualStateBridge(
  scene,
  windowRef = window,
  { mode = "states" } = {}
) {
  if (!BRIDGE_MODES.has(mode)) {
    throw new Error(`unknown player presentation bridge mode: ${mode}`);
  }

  const previous = windowRef[GLOBAL_ENTRY];
  for (const method of ["cleanup", "restore"]) {
    try {
      previous?.[method]?.();
    } catch {
      // A stale development bridge cannot block the current Scene install.
    }
  }

  const driver = createPlayerCharacterVisualStateDriver({ scene });
  let cleanupComplete = false;
  let bridge = null;

  function attemptCleanup(action) {
    try {
      action();
      return true;
    } catch {
      return false;
    }
  }

  function restoreSafely() {
    try {
      return driver.restore() === true;
    } catch {
      return false;
    }
  }

  function onUpdate(_time, delta) {
    try {
      const mainUpdateOwnsDelta = (
        scene?.isMissionActive === true
        && scene?.isGameOver !== true
        && scene?.isPaused !== true
        && scene?.isLevelUpActive !== true
      );
      driver.applyLiveState(mode, mainUpdateOwnsDelta ? 0 : delta);
    } catch {
      // A development preview must never escape into the gameplay update.
      cleanup();
    }
  }

  function cleanup() {
    if (cleanupComplete) return true;
    const restored = restoreSafely();
    const updateDetached = attemptCleanup(
      () => scene.events.off("update", onUpdate)
    );
    const shutdownDetached = attemptCleanup(
      () => scene.events.off("shutdown", cleanup)
    );
    const destroyDetached = attemptCleanup(
      () => scene.events.off("destroy", cleanup)
    );
    const globalDetached = attemptCleanup(() => {
      if (windowRef[GLOBAL_ENTRY] === bridge) {
        delete windowRef[GLOBAL_ENTRY];
      }
    });
    cleanupComplete = (
      restored
      && updateDetached
      && shutdownDetached
      && destroyDetached
      && globalDetached
    );
    return cleanupComplete;
  }

  bridge = Object.freeze({
    listStates: driver.listStates,
    applyState: driver.applyState,
    restore: restoreSafely,
    snapshot: driver.snapshot,
    cleanup
  });
  Object.defineProperty(windowRef, GLOBAL_ENTRY, {
    configurable: true,
    value: bridge
  });

  if (mode !== "states") {
    scene.events.on("update", onUpdate);
  }
  scene.events.once("shutdown", cleanup);
  scene.events.once("destroy", cleanup);

  if (mode !== "states") {
    onUpdate(0, 0);
  }
  return bridge;
}
