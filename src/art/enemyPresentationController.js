import { TEXTURES } from "../assets/manifest.js";
import { BALANCE } from "../config/balance.js";
import {
  applyEnemyPresentation,
  getEnemyAnimationKey,
  getEnemyPresentationMode,
  getScp049LocomotionAnimationKey,
  getScp049PresentationMode,
  registerEnemyAnimations
} from "./enemyPresentation.js";
import { applyTextureAndScalePreservingBody } from "./presentationRules.js";

export const R17_DEATH_COPY_POOL_LIMIT = 64;
export const SCP049_TERMINAL_TIMEOUT_MS = 900;

const LIVE_ACTOR_DESTROY_DELAY_MS = 90;
const R17_HIT_HOLD_MS = 100;
const RELEASE_HOLD_MS = 200;
const LEGACY_ENEMY_HIT_TINT = 0xffffff;

const KNOWN_CANDIDATE_IDS = new Set([
  TEXTURES.r17DrifterActionSheet,
  TEXTURES.r17RiftSkimmerActionSheet,
  TEXTURES.r17PulseSacActionSheet,
  TEXTURES.r17CarapaceGateActionSheet,
  TEXTURES.r17FrameGapActionSheet,
  TEXTURES.r17BroodMassActionSheet,
  TEXTURES.r17BudActionSheet,
  TEXTURES.enemyScp049LocomotionSheet,
  TEXTURES.enemyScp049ActionSheet
]);

const ROLE_DURATIONS_MS = Object.freeze({
  contact: 400,
  pierce: 400,
  snap: 300,
  brace: 600,
  charge: 700,
  "phase-out": 600,
  "reappear-dash": 700,
  "frenzy-enter": 500,
  "frenzy-loop": 700
});

export function resolveScp049Direction(vx, vy, lastDirection = "down") {
  const horizontal = Math.abs(vx);
  const vertical = Math.abs(vy);
  if (horizontal + vertical < 0.01) return lastDirection;
  const margin = Math.max(horizontal, vertical) * 0.15;
  const wasHorizontal = lastDirection === "left" || lastDirection === "right";
  const keepHorizontal = wasHorizontal && horizontal + margin >= vertical;
  const keepVertical = !wasHorizontal && vertical + margin >= horizontal;
  if (keepHorizontal || (!keepVertical && horizontal > vertical)) {
    return vx < 0 ? "left" : "right";
  }
  return vy < 0 ? "up" : "down";
}

function getRecordById(records, presentationId) {
  if (!Number.isInteger(presentationId) || presentationId <= 0) return null;
  for (const record of records.values()) {
    if (record.id === presentationId) return record;
  }
  return null;
}

function getGameplayRole(actor, enemyType) {
  if (enemyType === "riotUnit") {
    if (actor.eliteState === "warning") return "brace";
    if (actor.eliteState === "charging") return "charge";
  }
  if (enemyType === "blinkStalker") {
    if (actor.eliteState === "teleportWarning") return "phase-out";
    if (actor.eliteState === "postDash") return "reappear-dash";
  }
  return null;
}

function getBossRole(actor) {
  if (actor.bossState === "frenzy") return "frenzy-loop";
  return null;
}

function isRoleLocked(record, elapsedMs) {
  return record.roleClip !== null && elapsedMs <= record.roleUntilMs;
}

function isReleaseLocked(record, elapsedMs) {
  return record.releaseAtMs >= 0 && elapsedMs <= record.releaseAtMs + RELEASE_HOLD_MS;
}

function callAnimationPause(display, paused) {
  try {
    if (paused) display?.anims?.pause?.();
    else display?.anims?.resume?.();
  } catch {
    // One display object cannot block the remaining presentation lifecycle.
  }
}

function setDisplayFrame(record, frame, marker) {
  if (record.lastClip === marker && record.lastFrame === frame) return;
  record.actor.setFrame?.(frame);
  record.lastClip = marker;
  record.lastFrame = frame;
}

function playDisplayAnimation(scene, record, animationKey, marker) {
  if (record.lastClip === marker) return;
  if (!scene?.anims?.exists?.(animationKey)) return;
  record.actor.play?.(animationKey, true);
  record.lastClip = marker;
  record.lastFrame = -1;
}

function configureCopy(copy, record, snapshot, textureKey) {
  copy.setActive?.(true);
  copy.setVisible?.(true);
  copy.setPosition?.(snapshot.x, snapshot.y);
  copy.setTexture?.(textureKey, Number.isInteger(snapshot.frame) ? snapshot.frame : 0);
  copy.setFlipX?.(snapshot.flipX === true);
  copy.setAlpha?.(Number.isFinite(snapshot.alpha) ? snapshot.alpha : 1);
  copy.setDepth?.(Number.isFinite(snapshot.depth) ? snapshot.depth : 10);
  if (Number.isFinite(snapshot.scaleX) && Number.isFinite(snapshot.scaleY)) {
    copy.setScale?.(snapshot.scaleX, snapshot.scaleY);
  }
  copy._enemyPresentationRecordId = record.id;
}

function removeCopyAnimationListener(copy) {
  const listener = copy?._enemyPresentationAnimationComplete;
  if (listener) copy.off?.("animationcomplete", listener);
  copy._enemyPresentationAnimationComplete = null;
}

function removeTimer(timer) {
  try {
    timer?.remove?.(false);
  } catch {
    // Timer cleanup remains best effort during restart/shutdown.
  }
}

export function createEnemyPresentationController(scene, options = {}) {
  const allowedDevelopmentAssetIds = new Set();
  if (options.allowedDevelopmentAssetIds instanceof Set) {
    for (const candidateId of options.allowedDevelopmentAssetIds) {
      if (KNOWN_CANDIDATE_IDS.has(candidateId)) {
        allowedDevelopmentAssetIds.add(candidateId);
      }
    }
  }

  const forceLegacy = options.forceLegacy === true;
  const resolverOptions = {
    isDevelopment: forceLegacy || allowedDevelopmentAssetIds.size > 0,
    candidateMode: allowedDevelopmentAssetIds.size > 0,
    candidateIds: allowedDevelopmentAssetIds,
    forceLegacy
  };

  try {
    registerEnemyAnimations(scene, resolverOptions);
  } catch {
    // Missing or hostile texture/animation managers keep every actor on fallback.
  }

  const records = new Map();
  const inactiveR17Copies = [];
  const allocatedR17Copies = new Set();
  const terminalCopies = new Set();
  const liveActorDestroyTimers = new Set();
  let nextPresentationId = 1;
  let paused = false;
  let destroyed = false;

  function resolveMode(actor, enemyType, isBoss) {
    try {
      const mode = isBoss
        ? getScp049PresentationMode(scene, resolverOptions)
        : getEnemyPresentationMode(scene, enemyType, resolverOptions);
      applyEnemyPresentation(scene, actor, isBoss ? "scp049" : enemyType, resolverOptions);
      return mode;
    } catch {
      try {
        actor?.setVisible?.(true);
      } catch {
        // The gameplay actor remains authoritative even if visibility restoration throws.
      }
      return { family: "unchanged" };
    }
  }

  function trackActor(actor, actorOptions = {}) {
    if (destroyed || !actor) return 0;
    const existing = records.get(actor);
    if (existing) return existing.id;

    const enemyType = actorOptions.enemyType ?? actor.enemyType ?? "unknown";
    const isBoss = actorOptions.isBoss === true || enemyType === "scp049";
    const record = {
      id: nextPresentationId,
      actor,
      enemyType,
      isBoss,
      mode: resolveMode(actor, enemyType, isBoss),
      displayTextureKey: null,
      lastClip: null,
      lastFrame: -1,
      lastDirection: "down",
      roleClip: null,
      roleUntilMs: -1,
      releaseAtMs: -1,
      hitUntilMs: -1,
      hitOverlay: null,
      formalFrenzyActionKey: null,
      formalHitSuppressionUntilMs: -1,
      formalHitFallbackUntilMs: -1
    };
    if (isBoss) {
      record.displayTextureKey = record.mode.locomotionTextureKey ?? record.mode.textureKey ?? null;
    } else {
      record.displayTextureKey = record.mode.textureKey ?? null;
    }
    nextPresentationId += 1;
    records.set(actor, record);
    return record.id;
  }

  function destroyHitOverlay(record) {
    const overlay = record.hitOverlay;
    record.hitOverlay = null;
    if (!overlay) return;
    try {
      overlay.destroy?.();
    } catch {
      // Overlay cleanup cannot strand actor tracking.
    }
  }

  function invalidateActorPresentationId(record) {
    try {
      if (record.actor?._presentationId === record.id) {
        record.actor._presentationId = 0;
      }
    } catch {
      // Ownership invalidation remains best effort for hostile actor wrappers.
    }
  }

  function untrackActor(actor) {
    const record = records.get(actor);
    if (!record) return;
    destroyHitOverlay(record);
    invalidateActorPresentationId(record);
    records.delete(actor);
  }

  function syncR17(record, elapsedMs) {
    const actor = record.actor;
    if (record.mode.family !== "formal") return;

    if (actor.isDying === true) {
      const terminalClip = record.enemyType === "biomass" && actor.canSplit === true
        ? "split"
        : "death";
      try {
        playDisplayAnimation(
          scene,
          record,
          getEnemyAnimationKey(record.enemyType, terminalClip),
          terminalClip
        );
      } catch {
        // Invalid role data leaves the prior formal frame intact.
      }
      return;
    }

    if (isReleaseLocked(record, elapsedMs)) {
      const releaseElapsedMs = elapsedMs - record.releaseAtMs;
      setDisplayFrame(record, releaseElapsedMs < 100 ? 18 : 19, "shoot-release");
      return;
    }
    if (record.releaseAtMs >= 0) record.releaseAtMs = -1;

    if (isRoleLocked(record, elapsedMs)) {
      try {
        playDisplayAnimation(
          scene,
          record,
          getEnemyAnimationKey(record.enemyType, record.roleClip),
          record.roleClip
        );
      } catch {
        // Unknown action snapshots never affect gameplay or actor visibility.
      }
      return;
    }
    if (record.roleClip !== null) record.roleClip = null;

    const gameplayRole = getGameplayRole(actor, record.enemyType);
    if (gameplayRole !== null) {
      try {
        playDisplayAnimation(
          scene,
          record,
          getEnemyAnimationKey(record.enemyType, gameplayRole),
          gameplayRole
        );
      } catch {
        // A missing role clip falls through to the last safe frame.
      }
      return;
    }

    if (elapsedMs <= record.hitUntilMs) {
      try {
        playDisplayAnimation(
          scene,
          record,
          getEnemyAnimationKey(record.enemyType, "hit"),
          "hit"
        );
      } catch {
        // Hit presentation is optional and never changes damage handling.
      }
      return;
    }

    if (record.enemyType === "drone") {
      const remainingMs = actor.nextShotAtMs - elapsedMs;
      if (remainingMs > 0 && remainingMs <= 400) {
        const frame = 14 + Math.max(0, Math.min(3, Math.floor((400 - remainingMs) / 100)));
        setDisplayFrame(record, frame, "shoot-precharge");
        return;
      }
    }

    try {
      playDisplayAnimation(
        scene,
        record,
        getEnemyAnimationKey(record.enemyType, "move"),
        "move"
      );
    } catch {
      // Unknown types keep their existing fallback presentation.
    }
  }

  function ensureHitOverlay(record) {
    if (record.hitOverlay?.active) return record.hitOverlay;
    if (record.mode.family !== "formal") return null;
    if (!scene?.anims?.exists?.("enemy-scp049-hit-overlay")) return null;
    try {
      const overlay = scene.add?.sprite?.(
        record.actor.x,
        record.actor.y,
        record.mode.actionTextureKey
      );
      if (!overlay) return null;
      overlay.setOrigin?.(0.5);
      overlay.setScale?.(1);
      overlay.setFlipX?.(false);
      overlay.setDepth?.((record.actor.depth ?? 12) + 1);
      overlay.setVisible?.(false);
      record.hitOverlay = overlay;
      return overlay;
    } catch {
      return null;
    }
  }

  function clearFormalBossTint(record) {
    try {
      if (typeof record.actor?.clearTint !== "function") return false;
      record.actor.clearTint();
      return true;
    } catch {
      return false;
    }
  }

  function preserveLegacyBossHitTint(record) {
    try {
      if (typeof record.actor?.setTintFill !== "function") return false;
      record.actor.setTintFill(LEGACY_ENEMY_HIT_TINT);
      return true;
    } catch {
      return false;
    }
  }

  function restoreScp049Locomotion(record) {
    try {
      if (!record.mode.locomotionTextureKey) return;
      if (record.displayTextureKey !== record.mode.locomotionTextureKey) {
        applyTextureAndScalePreservingBody(record.actor, record.mode.locomotionTextureKey, 1);
        record.displayTextureKey = record.mode.locomotionTextureKey;
      }
      record.lastClip = null;
    } catch {
      // A failed formal action leaves the gameplay actor visible for the legacy tint fallback.
    }
  }

  function tryPlayScp049Action(record, bossRole) {
    const actionKey = `enemy-scp049-${bossRole}`;
    if (
      record.mode.family !== "formal"
      || !scene?.anims?.exists?.(actionKey)
      || typeof record.actor?.play !== "function"
    ) {
      record.formalFrenzyActionKey = null;
      if (record.mode.family === "formal") restoreScp049Locomotion(record);
      return false;
    }
    try {
      if (record.displayTextureKey !== record.mode.actionTextureKey) {
        applyTextureAndScalePreservingBody(record.actor, record.mode.actionTextureKey, 1);
        record.displayTextureKey = record.mode.actionTextureKey;
      }
      if (record.formalFrenzyActionKey !== actionKey || record.lastClip !== bossRole) {
        record.actor.play(actionKey, true);
      }
      record.lastClip = bossRole;
      record.formalFrenzyActionKey = actionKey;
      return true;
    } catch {
      record.formalFrenzyActionKey = null;
      restoreScp049Locomotion(record);
      return false;
    }
  }

  function tryPlayScp049HitOverlay(record, atMs) {
    const overlay = ensureHitOverlay(record);
    if (!overlay || typeof overlay.play !== "function") {
      record.formalHitSuppressionUntilMs = -1;
      record.formalHitFallbackUntilMs = atMs + BALANCE.feedback.enemyHitFlashMs;
      if (overlay) destroyHitOverlay(record);
      return false;
    }
    try {
      overlay.setPosition?.(record.actor.x, record.actor.y);
      overlay.setVisible?.(true);
      overlay.play("enemy-scp049-hit-overlay", true);
      record.hitUntilMs = atMs + R17_HIT_HOLD_MS;
      record.formalHitSuppressionUntilMs = record.hitUntilMs;
      record.formalHitFallbackUntilMs = -1;
      clearFormalBossTint(record);
      return true;
    } catch {
      record.formalHitSuppressionUntilMs = -1;
      record.formalHitFallbackUntilMs = atMs + BALANCE.feedback.enemyHitFlashMs;
      destroyHitOverlay(record);
      return false;
    }
  }

  function syncScp049(record, elapsedMs) {
    if (record.mode.family !== "formal" && record.mode.family !== "formal-locomotion") return;
    const actor = record.actor;
    const vx = actor.body?.velocity?.x ?? 0;
    const vy = actor.body?.velocity?.y ?? 0;
    record.lastDirection = resolveScp049Direction(vx, vy, record.lastDirection);

    const bossRole = isRoleLocked(record, elapsedMs) ? record.roleClip : getBossRole(actor);
    if (record.roleClip !== null && !isRoleLocked(record, elapsedMs)) record.roleClip = null;
    let formalFrenzyPlayed = false;
    if (record.mode.family === "formal" && bossRole !== null) {
      formalFrenzyPlayed = tryPlayScp049Action(record, bossRole);
    } else {
      record.formalFrenzyActionKey = null;
      if (record.displayTextureKey !== record.mode.locomotionTextureKey) {
        applyTextureAndScalePreservingBody(actor, record.mode.locomotionTextureKey, 1);
        record.displayTextureKey = record.mode.locomotionTextureKey;
      }
      const locomotion = Math.abs(vx) + Math.abs(vy) < 0.01 ? "idle" : "walk";
      const marker = `${record.lastDirection}-${locomotion}`;
      const animationKey = getScp049LocomotionAnimationKey(record.lastDirection, locomotion);
      if (record.lastClip !== marker && scene?.anims?.exists?.(animationKey)) {
        actor.play?.(animationKey, true);
        record.lastClip = marker;
      }
    }

    const overlay = record.hitOverlay;
    if (overlay?.active) {
      overlay.setPosition?.(actor.x, actor.y);
      overlay.setDepth?.((actor.depth ?? 12) + 1);
      const hitVisible = elapsedMs <= record.hitUntilMs;
      overlay.setVisible?.(hitVisible);
    }

    const preserveLegacyHitTint = elapsedMs <= record.formalHitFallbackUntilMs;
    const formalHitPlaying = elapsedMs <= record.formalHitSuppressionUntilMs;
    if (preserveLegacyHitTint) {
      preserveLegacyBossHitTint(record);
    } else if (formalFrenzyPlayed || formalHitPlaying) {
      clearFormalBossTint(record);
    }
  }

  function sync(elapsedMs, _deltaMs) {
    if (destroyed || paused) return;
    for (const record of records.values()) {
      if (record.actor?.active === false) continue;
      try {
        if (record.isBoss) syncScp049(record, elapsedMs);
        else syncR17(record, elapsedMs);
      } catch {
        try {
          record.actor?.setVisible?.(true);
        } catch {
          // A hostile display object cannot affect the frame's gameplay update.
        }
      }
    }
  }

  function notifyAction(snapshot) {
    if (destroyed) return;
    const record = getRecordById(records, snapshot?.presentationId);
    if (!record || typeof snapshot?.action !== "string") return;
    if (snapshot.action === "shoot-release" && record.enemyType === "drone") {
      const atMs = Number.isFinite(snapshot.shotAtMs) ? snapshot.shotAtMs : 0;
      record.releaseAtMs = atMs;
      record.roleClip = null;
      record.hitUntilMs = -1;
      if (record.mode.family === "formal") {
        setDisplayFrame(record, 18, "shoot-release");
      }
      return;
    }
    if (snapshot.action === "frenzy-exit" && record.isBoss) {
      record.roleClip = null;
      record.roleUntilMs = -1;
      record.hitUntilMs = -1;
      record.formalFrenzyActionKey = null;
      record.formalHitSuppressionUntilMs = -1;
      return;
    }
    const atMs = Number.isFinite(snapshot.atMs) ? snapshot.atMs : 0;
    const durationMs = ROLE_DURATIONS_MS[snapshot.action];
    if (!Number.isFinite(durationMs)) return;
    if (isRoleLocked(record, atMs)) return;
    record.roleClip = snapshot.action;
    record.roleUntilMs = atMs + durationMs;
    record.hitUntilMs = -1;
    if (record.isBoss && snapshot.action === "frenzy-enter") {
      const played = tryPlayScp049Action(record, snapshot.action);
      if (played && atMs > record.formalHitFallbackUntilMs) clearFormalBossTint(record);
    }
  }

  function notifyHit(snapshot) {
    if (destroyed || snapshot?.lethal === true) return;
    const record = getRecordById(records, snapshot?.presentationId);
    if (!record) return;
    const atMs = Number.isFinite(snapshot.atMs) ? snapshot.atMs : 0;
    if (!record.isBoss) {
      if (isReleaseLocked(record, atMs)) return;
      if (isRoleLocked(record, atMs)) return;
      if (getGameplayRole(record.actor, record.enemyType) !== null) return;
      if (record.enemyType === "drone") {
        const remainingMs = record.actor.nextShotAtMs - atMs;
        if (remainingMs > 0 && remainingMs <= 400) return;
      }
    }
    if (record.isBoss) {
      tryPlayScp049HitOverlay(record, atMs);
      return;
    }
    record.hitUntilMs = atMs + R17_HIT_HOLD_MS;
  }

  function playLegacyDeath(record) {
    try {
      scene?.playLegacyEnemyDeathVisual?.(record.actor, { spawnParticles: false });
    } catch {
      try {
        record.actor?.setVisible?.(true);
      } catch {
        // Legacy fallback is best effort and never changes gameplay outcome.
      }
    }
  }

  function acquireR17Copy(record, snapshot) {
    let copy = inactiveR17Copies.pop();
    if (!copy) {
      if (allocatedR17Copies.size >= R17_DEATH_COPY_POOL_LIMIT) return null;
      copy = scene?.add?.sprite?.(snapshot.x, snapshot.y, record.mode.textureKey);
      if (!copy) return null;
      allocatedR17Copies.add(copy);
    }
    return copy;
  }

  function recycleR17Copy(copy) {
    removeCopyAnimationListener(copy);
    try {
      copy.setActive?.(false);
      copy.setVisible?.(false);
    } finally {
      if (!inactiveR17Copies.includes(copy)) inactiveR17Copies.push(copy);
    }
  }

  function scheduleActorDestroy(record) {
    let timer = null;
    timer = scene?.time?.delayedCall?.(LIVE_ACTOR_DESTROY_DELAY_MS, () => {
      if (timer) liveActorDestroyTimers.delete(timer);
      try {
        if (record.actor?.active !== false) record.actor?.destroy?.();
      } catch {
        // Existing gameplay cleanup remains authoritative if actor destroy throws.
      }
    });
    if (timer) liveActorDestroyTimers.add(timer);
    return timer;
  }

  function cancelActorDestroyTimer(timer) {
    if (!timer) return;
    liveActorDestroyTimers.delete(timer);
    removeTimer(timer);
  }

  function startR17Death(record, snapshot, clipName) {
    const copy = acquireR17Copy(record, snapshot);
    if (!copy) {
      playLegacyDeath(record);
      return;
    }
    try {
      configureCopy(copy, record, snapshot, record.mode.textureKey);
      const animationKey = getEnemyAnimationKey(record.enemyType, clipName);
      if (!scene?.anims?.exists?.(animationKey)) throw new Error("missing formal death animation");
      const cleanup = () => recycleR17Copy(copy);
      copy._enemyPresentationAnimationComplete = cleanup;
      copy.once?.("animationcomplete", cleanup);
      copy.play?.(animationKey, true);
      record.actor.setVisible?.(false);
      scheduleActorDestroy(record);
    } catch {
      try {
        recycleR17Copy(copy);
      } catch {
        // Continue to restore the actor and invoke legacy fallback.
      }
      try {
        record.actor.setVisible?.(true);
      } catch {
        // Visibility restoration remains best effort.
      }
      playLegacyDeath(record);
    }
  }

  function cleanupTerminal(entry) {
    if (!entry || entry.cleaned) return;
    entry.cleaned = true;
    terminalCopies.delete(entry);
    removeTimer(entry.timeoutTimer);
    removeCopyAnimationListener(entry.copy);
    try {
      entry.copy?.destroy?.();
    } catch {
      // Terminal cleanup is idempotent even for hostile display objects.
    }
  }

  function startTerminalDeath(record, snapshot) {
    let copy = null;
    let entry = null;
    let actorTimer = null;
    try {
      copy = scene?.add?.sprite?.(snapshot.x, snapshot.y, record.mode.actionTextureKey);
      if (!copy) throw new Error("terminal sprite unavailable");
      configureCopy(copy, record, snapshot, record.mode.actionTextureKey);
      entry = {
        copy,
        timeoutTimer: null,
        cleaned: false
      };
      const cleanup = () => cleanupTerminal(entry);
      copy._enemyPresentationAnimationComplete = cleanup;
      copy.once?.("animationcomplete", cleanup);
      terminalCopies.add(entry);
      copy.play?.("enemy-scp049-recontain", true);
      record.actor.setVisible?.(false);
      actorTimer = scheduleActorDestroy(record);
      entry.timeoutTimer = scene?.time?.delayedCall?.(SCP049_TERMINAL_TIMEOUT_MS, cleanup) ?? null;
    } catch {
      cancelActorDestroyTimer(actorTimer);
      if (entry) {
        cleanupTerminal(entry);
      } else if (copy) {
        try {
          copy.destroy?.();
        } catch {
          // Continue to restore the gameplay actor before fallback.
        }
      }
      try {
        record.actor.setVisible?.(true);
      } catch {
        // Visibility restoration remains best effort.
      }
      playLegacyDeath(record);
    }
  }

  function notifyDeath(snapshot) {
    if (destroyed) return;
    const record = getRecordById(records, snapshot?.presentationId);
    if (!record) return;
    if (record.isBoss) {
      if (
        record.mode.family !== "formal"
        || !scene?.anims?.exists?.("enemy-scp049-recontain")
      ) {
        playLegacyDeath(record);
        return;
      }
      startTerminalDeath(record, snapshot);
      return;
    }
    if (record.mode.family !== "formal") {
      playLegacyDeath(record);
      return;
    }
    const clipName = snapshot?.enemyType === "biomass" && snapshot?.canSplit === true
      ? "split"
      : "death";
    startR17Death(record, snapshot, clipName);
  }

  function setPaused(value) {
    if (destroyed) return;
    paused = value === true;
    for (const record of records.values()) {
      callAnimationPause(record.actor, paused);
      callAnimationPause(record.hitOverlay, paused);
    }
    for (const copy of allocatedR17Copies) {
      if (copy.active !== false) callAnimationPause(copy, paused);
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    paused = true;
    for (const record of records.values()) {
      destroyHitOverlay(record);
      invalidateActorPresentationId(record);
    }
    records.clear();
    for (const copy of allocatedR17Copies) {
      removeCopyAnimationListener(copy);
      try {
        copy.destroy?.();
      } catch {
        // Continue releasing all remaining pool objects.
      }
    }
    allocatedR17Copies.clear();
    inactiveR17Copies.length = 0;
    for (const entry of terminalCopies) cleanupTerminal(entry);
    terminalCopies.clear();
    for (const timer of liveActorDestroyTimers) removeTimer(timer);
    liveActorDestroyTimers.clear();
  }

  return {
    trackActor,
    sync,
    notifyAction,
    notifyHit,
    notifyDeath,
    setPaused,
    untrackActor,
    destroy
  };
}
