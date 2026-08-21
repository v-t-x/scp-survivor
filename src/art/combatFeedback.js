import { TEXTURES } from "../assets/manifest.js";

export const COMBAT_PRESENTATION_DEPTH = Object.freeze({
  decorationMin: 16,
  decorationMax: 26,
  warning: 30
});

const NOOP_METHODS = Object.freeze({
  trackActor() {},
  untrackActor() {},
  notifyHit() { return false; },
  notifyDeath() { return false; },
  notifyTeslaChannel() { return false; },
  update() {},
  setPaused() {},
  destroy() {}
});

const DEFAULT_POOL_LIMITS = Object.freeze({ attack: 12, hit: 24, death: 12 });
const DEFAULT_EFFECT_DURATION_MS = 140;
const DEFAULT_ATTACK_TIMING = Object.freeze({
  ballistic: Object.freeze({ durationMs: 45, startAlpha: 1 }),
  tesla: Object.freeze({ durationMs: 90, startAlpha: 0.95 })
});
const PROJECTILE_LAUNCH_DURATION_MS = 70;

// Muzzle VFX uses the formal equipment action point when available. If the
// presentation seam is unavailable it retains the established center offset;
// movement still owns body facing, so shots never rotate the gameplay anchor.
const MUZZLE_OFFSET_PX = Object.freeze({ light: 14, heavy: 16 });
const RECOIL_SKEW = 0.05;
const RECOIL_DURATION_MS = 80;

// A brief skew pulse opposite the shot direction. Skew is the only safe
// channel: position/scale/displayOrigin feed the Arcade body recompute, so
// the recoil must never touch them.
function applyAnchorRecoilPulse(scene, payload) {
  try {
    const player = scene.player;
    if (!player || player.active === false) return;
    if (typeof scene.tweens?.add !== "function") return;
    const angle = finiteNumber(payload.angle);
    scene.tweens.add({
      targets: player,
      props: {
        skewX: { from: 0, to: -Math.cos(angle) * RECOIL_SKEW },
        skewY: { from: 0, to: -Math.sin(angle) * RECOIL_SKEW }
      },
      duration: RECOIL_DURATION_MS,
      yoyo: true
    });
  } catch {
    // Recoil is cosmetic; it must never break shot feedback.
  }
}

function applyRecoilPulse(scene, payload) {
  let handledByPlayerPresentation = false;
  try {
    handledByPlayerPresentation = scene.playerPresentation?.notifyAttack({
      angle: finiteNumber(payload.angle),
      weaponId: payload.weaponId,
      heavy: payload.heavy === true
    }) === true;
  } catch {
    // Visible-body feedback failures fall through to the legacy anchor pulse.
  }
  if (!handledByPlayerPresentation) {
    applyAnchorRecoilPulse(scene, payload);
  }
}

const MATERIAL_STYLES = Object.freeze({
  neutral: Object.freeze({ kind: "neutral", hitTint: 0x9ed4df, deathTint: 0x8b2635, accentTint: 0xd7e3e8, hitSize: [12, 6], deathSize: [24, 12] }),
  biomass: Object.freeze({ kind: "biomass", hitTint: 0xa14a72, deathTint: 0x6e274f, accentTint: 0x41152f, hitSize: [11, 5], deathSize: [22, 10] }),
  metal: Object.freeze({ kind: "metal", hitTint: 0xe5f4ff, deathTint: 0xa9c7d4, accentTint: 0x7ea6b8, hitSize: [15, 3], deathSize: [28, 7] }),
  spatial: Object.freeze({ kind: "spatial", hitTint: 0x7de7f2, deathTint: 0xa178ff, accentTint: 0x7653c7, hitSize: [12, 8], deathSize: [26, 15] }),
  boss: Object.freeze({ kind: "boss", hitTint: 0xd7e3e8, deathTint: 0x8b2635, accentTint: 0x6a2333, hitSize: [18, 8], deathSize: [36, 18] })
});

const BIOMASS_TYPES = new Set(["biomass", "biomassChild"]);
const METAL_TYPES = new Set(["drone", "riotUnit", "crawler"]);
const SPATIAL_TYPES = new Set(["blinkStalker"]);

function resolveMaterialStyle(snapshot) {
  if (snapshot.isBoss === true || snapshot.enemyType === "scp049") {
    return MATERIAL_STYLES.boss;
  }
  const family = snapshot.eliteType ?? snapshot.enemyType;
  if (BIOMASS_TYPES.has(family)) return MATERIAL_STYLES.biomass;
  if (METAL_TYPES.has(family)) return MATERIAL_STYLES.metal;
  if (SPATIAL_TYPES.has(family)) return MATERIAL_STYLES.spatial;
  return MATERIAL_STYLES.neutral;
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function resolveAttackEffectSnapshot(scene, payload) {
  const angle = finiteNumber(payload.angle);
  const centerOwnedField = payload.weaponId === "tesla-field";
  let resolved = null;
  if (!centerOwnedField) {
    try {
      resolved = scene.playerPresentation?.getAttackEffectOrigin?.({
        weaponId: payload.weaponId,
        angle
      });
    } catch {
      // Equipment-origin lookup is presentation-only; center fallback remains authoritative.
    }
  }
  const usesEquipmentActionPoint = Number.isFinite(resolved?.x) && Number.isFinite(resolved?.y);
  const defaultVfxType = payload.weaponId?.startsWith?.("tesla") ? "tesla" : "ballistic";
  const vfxType = ["ballistic", "tesla"].includes(resolved?.vfxType)
    ? resolved.vfxType
    : defaultVfxType;
  return Object.freeze(Object.assign({}, payload, {
    originX: usesEquipmentActionPoint ? resolved.x : payload.originX,
    originY: usesEquipmentActionPoint ? resolved.y : payload.originY,
    vfxType,
    usesEquipmentActionPoint,
    centerOwnedField
  }));
}

function destroyVisual(visual, destroyedVisuals) {
  if (!visual || destroyedVisuals.has(visual)) return;
  destroyedVisuals.add(visual);
  visual.destroy?.();
}

function setVisual(visual, method, ...args) {
  visual?.[method]?.(...args);
}

function createShadowVisual(scene, x, y) {
  return scene.add.image(x, y, TEXTURES.contactShadow);
}

function drawBallisticAttackGraphic(graphics) {
  setVisual(graphics, "clear");
  setVisual(graphics, "fillStyle", 0xffffff, 0.98);
  setVisual(graphics, "fillRect", -2, -2, 5, 5);
  setVisual(graphics, "fillStyle", 0xffd27a, 0.95);
  setVisual(graphics, "fillRect", 1, -1, 4, 3);
  setVisual(graphics, "lineStyle", 2, 0xffb054, 0.95);
  setVisual(graphics, "lineBetween", 3, 0, 10, 0);
  setVisual(graphics, "lineStyle", 1, 0xffffff, 0.95);
  setVisual(graphics, "lineBetween", 2, 0, 7, 0);
  setVisual(graphics, "lineStyle", 1, 0xffd27a, 0.88);
  setVisual(graphics, "lineBetween", 2, 0, 7, -5);
  setVisual(graphics, "lineBetween", 2, 0, 7, 5);
}

function drawTeslaAttackGraphic(graphics) {
  const segments = Object.freeze([
    Object.freeze([1, 0, 8, -3]),
    Object.freeze([8, -3, 15, 3]),
    Object.freeze([15, 3, 22, 0])
  ]);
  setVisual(graphics, "clear");
  setVisual(graphics, "fillStyle", 0xe2f7ff, 0.98);
  setVisual(graphics, "fillRect", -1.5, -1.5, 3, 3);
  setVisual(graphics, "lineStyle", 3, 0x3692ff, 0.92);
  for (const segment of segments) setVisual(graphics, "lineBetween", ...segment);
  setVisual(graphics, "lineStyle", 1, 0xe2f7ff, 0.98);
  for (const segment of segments) setVisual(graphics, "lineBetween", ...segment);
}

function drawAttackGraphic(graphics, snapshot) {
  if (snapshot.vfxType === "tesla") {
    drawTeslaAttackGraphic(graphics);
    return;
  }
  drawBallisticAttackGraphic(graphics);
}

function drawBiomassGraphic(graphics, style, isDeath) {
  const fragments = isDeath
    ? [[-11, -4, 7, 3], [-3, 2, 8, 3], [6, -2, 6, 3], [-7, 7, 5, 2]]
    : [[-7, -2, 6, 3], [1, 1, 6, 2], [-2, 5, 4, 2]];
  setVisual(graphics, "fillStyle", isDeath ? style.deathTint : style.hitTint, 0.95);
  for (const fragment of fragments) setVisual(graphics, "fillRect", ...fragment);
  setVisual(graphics, "fillStyle", style.accentTint, 0.9);
  setVisual(graphics, "fillRect", isDeath ? 3 : -4, isDeath ? 6 : -5, isDeath ? 5 : 3, 2);
}

function drawMetalGraphic(graphics, style, isDeath) {
  const rays = isDeath
    ? [[-14, 0, -5, 0], [5, 0, 14, 0], [0, -12, 0, -4], [0, 4, 0, 12], [-10, -8, -4, -3], [4, 3, 10, 8], [-10, 8, -4, 3], [4, -3, 10, -8]]
    : [[-9, 0, -3, 0], [3, 0, 9, 0], [0, -7, 0, -2], [0, 2, 0, 7]];
  setVisual(graphics, "lineStyle", isDeath ? 2 : 1, isDeath ? style.deathTint : style.hitTint, 1);
  for (const ray of rays) setVisual(graphics, "lineBetween", ...ray);
  setVisual(graphics, "fillStyle", style.accentTint, 0.9);
  setVisual(graphics, "fillRect", -1, -1, 3, 3);
}

function drawSpatialGraphic(graphics, style, isDeath) {
  const frames = isDeath
    ? [[-13, -8, 8, 7], [-2, -2, 9, 8], [8, -10, 7, 6], [-9, 6, 6, 5]]
    : [[-8, -5, 7, 6], [2, -1, 7, 6]];
  setVisual(graphics, "lineStyle", 2, isDeath ? style.deathTint : style.hitTint, 0.95);
  for (const frame of frames) setVisual(graphics, "strokeRect", ...frame);
  setVisual(graphics, "lineStyle", 1, style.accentTint, 0.9);
  setVisual(graphics, "lineBetween", isDeath ? -15 : -9, isDeath ? 10 : 7, isDeath ? 14 : 9, isDeath ? -11 : -7);
}

function drawBossGraphic(graphics, style, isDeath) {
  setVisual(graphics, "lineStyle", 2, style.hitTint, 0.9);
  setVisual(graphics, "strokeCircle", 0, 0, isDeath ? 14 : 8);
  if (isDeath) setVisual(graphics, "strokeCircle", 0, 0, 8);
  setVisual(graphics, "lineStyle", isDeath ? 2 : 1, style.accentTint, 0.95);
  const arm = isDeath ? 18 : 11;
  setVisual(graphics, "lineBetween", -arm, 0, -5, 0);
  setVisual(graphics, "lineBetween", 5, 0, arm, 0);
  setVisual(graphics, "lineBetween", 0, -arm, 0, -5);
  setVisual(graphics, "lineBetween", 0, 5, 0, arm);
}

function drawNeutralGraphic(graphics, style, isDeath) {
  setVisual(graphics, "lineStyle", isDeath ? 2 : 1, isDeath ? style.deathTint : style.hitTint, 0.9);
  setVisual(graphics, "strokeCircle", 0, 0, isDeath ? 9 : 5);
  setVisual(graphics, "lineBetween", isDeath ? -12 : -7, 0, isDeath ? 12 : 7, 0);
  setVisual(graphics, "lineBetween", 0, isDeath ? -12 : -7, 0, isDeath ? 12 : 7);
  setVisual(graphics, "fillStyle", style.accentTint, 0.85);
  setVisual(graphics, "fillRect", -1, -1, 3, 3);
}

function drawMaterialGraphic(graphics, style, isDeath) {
  setVisual(graphics, "clear");
  if (style.kind === "biomass") return drawBiomassGraphic(graphics, style, isDeath);
  if (style.kind === "metal") return drawMetalGraphic(graphics, style, isDeath);
  if (style.kind === "spatial") return drawSpatialGraphic(graphics, style, isDeath);
  if (style.kind === "boss") return drawBossGraphic(graphics, style, isDeath);
  return drawNeutralGraphic(graphics, style, isDeath);
}

function createNoopController() {
  return {
    ...NOOP_METHODS,
    notifyAttack() { return false; }
  };
}

export function createNoopCombatFeedbackController() {
  return createNoopController();
}

function createRealCombatFeedbackController(scene, options) {
  const shadows = new Map();
  const destroyedVisuals = new Set();
  const poolLimits = {
    attack: Math.max(1, Math.floor(finiteNumber(options.poolLimits?.attack, DEFAULT_POOL_LIMITS.attack))),
    hit: Math.max(1, Math.floor(finiteNumber(options.poolLimits?.hit, DEFAULT_POOL_LIMITS.hit))),
    death: Math.max(1, Math.floor(finiteNumber(options.poolLimits?.death, DEFAULT_POOL_LIMITS.death)))
  };
  const pools = {
    attack: [],
    hit: [],
    death: []
  };
  const projectileLaunches = [];
  let teslaChannelVisual = null;
  const projectileLaunchLimit = Math.max(
    1,
    Math.floor(finiteNumber(options.poolLimits?.projectileLaunch, DEFAULT_POOL_LIMITS.attack))
  );
  const effectDurationOverrideMs = Number.isFinite(options.effectDurationMs)
    ? Math.max(1, options.effectDurationMs)
    : null;
  let paused = false;
  let destroyed = false;
  let disabled = false;
  let nowMs = finiteNumber(scene.time?.now, 0);

  function releaseAll() {
    for (const record of projectileLaunches) releaseProjectileLaunch(record, true);
    for (const { visual } of shadows.values()) destroyVisual(visual, destroyedVisuals);
    shadows.clear();
    for (const pool of Object.values(pools)) {
      for (const record of pool) destroyVisual(record.visual, destroyedVisuals);
      pool.length = 0;
    }
    for (const record of projectileLaunches) destroyVisual(record.visual, destroyedVisuals);
    projectileLaunches.length = 0;
    destroyVisual(teslaChannelVisual, destroyedVisuals);
    teslaChannelVisual = null;
  }

  function disableAfterAllocationFailure(visual) {
    destroyVisual(visual, destroyedVisuals);
    releaseAll();
    disabled = true;
  }

  function createConfiguredVisual(x, y, configure) {
    let visual = null;
    try {
      visual = createShadowVisual(scene, x, y);
      configure(visual);
      return visual;
    } catch {
      disableAfterAllocationFailure(visual);
      return null;
    }
  }

  function createConfiguredEffectVisual() {
    let visual = null;
    try {
      const isGraphics = typeof scene.add.graphics === "function";
      visual = isGraphics
        ? scene.add.graphics()
        : createShadowVisual(scene, 0, 0);
      if (!isGraphics) setVisual(visual, "setOrigin", 0.5, 0.5);
      setVisual(visual, "setVisible", false);
      setVisual(visual, "setAlpha", 0);
      return { visual, isGraphics };
    } catch {
      disableAfterAllocationFailure(visual);
      return null;
    }
  }

  function allocateEffect(poolName) {
    const pool = pools[poolName];
    const inactive = pool
      .filter((record) => !record.active)
      .reduce((oldest, record) => !oldest || record.startedAt < oldest.startedAt ? record : oldest, null);
    if (inactive) return inactive;
    if (pool.length < poolLimits[poolName]) {
      const allocation = createConfiguredEffectVisual();
      if (!allocation) return null;
      const record = {
        ...allocation,
        active: false,
        startedAt: -Infinity,
        durationMs: DEFAULT_EFFECT_DURATION_MS,
        startAlpha: 0.7,
        snapshot: null
      };
      pool.push(record);
      return record;
    }
    return pool.reduce((oldest, record) => record.startedAt < oldest.startedAt ? record : oldest);
  }

  function activateEffect(poolName, payload, configure) {
    if (destroyed || disabled) return false;
    const record = allocateEffect(poolName);
    if (!record) return false;
    const snapshot = Object.isFrozen(payload) ? payload : { ...payload };
    try {
      const attackTiming = poolName === "attack"
        ? DEFAULT_ATTACK_TIMING[snapshot.vfxType] ?? DEFAULT_ATTACK_TIMING.ballistic
        : null;
      record.active = true;
      record.startedAt = nowMs;
      record.durationMs = effectDurationOverrideMs
        ?? attackTiming?.durationMs
        ?? DEFAULT_EFFECT_DURATION_MS;
      record.startAlpha = attackTiming?.startAlpha ?? 0.7;
      record.snapshot = snapshot;
      configure(record.visual, snapshot, record.isGraphics);
      setVisual(record.visual, "setAlpha", record.startAlpha);
      setVisual(record.visual, "setVisible", true);
      return true;
    } catch {
      record.active = false;
      record.startedAt = -Infinity;
      record.durationMs = DEFAULT_EFFECT_DURATION_MS;
      record.startAlpha = 0.7;
      record.snapshot = null;
      disableAfterAllocationFailure(record.visual);
      return false;
    }
  }

  function trackActor(actor, {
    kind = "actor",
    radius = 12,
    offsetY = 0,
    widthScale = 1,
    roundPosition = false
  } = {}) {
    if (destroyed || disabled || !actor) return false;
    if (shadows.has(actor)) return true;
    const resolvedRadius = Math.max(1, finiteNumber(radius, 12));
    const resolvedOffsetY = finiteNumber(offsetY, 0);
    const resolvedWidthScale = Number.isFinite(widthScale) && widthScale > 0 ? widthScale : 1;
    const resolvedRoundPosition = roundPosition === true;
    const visual = createConfiguredVisual(finiteNumber(actor.x), finiteNumber(actor.y), (created) => {
      setVisual(created, "setOrigin", 0.5, 0.5);
      setVisual(created, "setAlpha", 0.56);
      setVisual(created, "setTint", 0x1b1d22);
    });
    if (!visual) return false;
    shadows.set(actor, {
      actor,
      kind,
      radius: resolvedRadius,
      offsetY: resolvedOffsetY,
      widthScale: resolvedWidthScale,
      roundPosition: resolvedRoundPosition,
      visual
    });
    return true;
  }

  function untrackActor(actor) {
    const record = shadows.get(actor);
    if (!record) return false;
    shadows.delete(actor);
    destroyVisual(record.visual, destroyedVisuals);
    return true;
  }

  function updateShadow(record) {
    const { actor, radius, offsetY, widthScale, roundPosition, visual } = record;
    if (!actor || actor.active === false || actor.destroyed) {
      shadows.delete(actor);
      destroyVisual(visual, destroyedVisuals);
      return;
    }
    const x = finiteNumber(actor.x);
    const y = finiteNumber(actor.y) + radius + offsetY;
    setVisual(visual, "setPosition", roundPosition ? Math.round(x) : x, roundPosition ? Math.round(y) : y);
    setVisual(visual, "setDisplaySize", radius * 2 * widthScale, radius);
    setVisual(visual, "setDepth", finiteNumber(actor.depth) - 1);
    setVisual(visual, "setVisible", true);
  }

  function updatePool(pool) {
    for (const record of pool) {
      if (!record.active) continue;
      const elapsed = nowMs - record.startedAt;
      if (elapsed >= record.durationMs) {
        record.active = false;
        record.snapshot = null;
        setVisual(record.visual, "setVisible", false);
        setVisual(record.visual, "setAlpha", 0);
        continue;
      }
      const progress = Math.max(0, Math.min(1, elapsed / record.durationMs));
      setVisual(record.visual, "setAlpha", record.startAlpha * (1 - progress));
    }
  }

  function setProjectileVisible(projectile, visible) {
    if (typeof projectile?.setVisible === "function") {
      projectile.setVisible(visible);
    } else if (projectile) {
      projectile.visible = visible;
    }
  }

  function detachProjectileDestroyListener(record) {
    if (!record.projectile || !record.onProjectileDestroy) return;
    if (typeof record.projectile.off === "function") {
      record.projectile.off("destroy", record.onProjectileDestroy);
    } else {
      record.projectile.removeListener?.("destroy", record.onProjectileDestroy);
    }
    record.onProjectileDestroy = null;
  }

  function releaseProjectileLaunch(record, revealProjectile) {
    if (!record) return;
    detachProjectileDestroyListener(record);
    if (revealProjectile && record.projectile?.active !== false && !record.projectile?.destroyed) {
      try {
        setProjectileVisible(record.projectile, true);
      } catch {
        // Visibility restoration is best-effort during presentation teardown.
      }
    }
    setVisual(record.visual, "setVisible", false);
    setVisual(record.visual, "setAlpha", 0);
    record.active = false;
    record.reserved = false;
    record.startedAt = -Infinity;
    record.projectile = null;
    record.onProjectileDestroy = null;
    record.offsetX = 0;
    record.offsetY = 0;
  }

  function allocateProjectileLaunch() {
    const reusable = projectileLaunches.find((record) => !record.active && !record.reserved);
    if (reusable) {
      reusable.reserved = true;
      return reusable;
    }
    if (projectileLaunches.length >= projectileLaunchLimit) return null;
    let visual = null;
    try {
      visual = scene.add.image(0, 0, TEXTURES.bullet);
      if (!visual) throw new Error("projectile launch proxy allocation returned no visual");
      setVisual(visual, "setOrigin", 0.5, 0.5);
      setVisual(visual, "setDisplaySize", 12, 3);
      setVisual(visual, "setTint", 0xffd27a);
      setVisual(visual, "setVisible", false);
      setVisual(visual, "setAlpha", 0);
      const record = {
        active: false,
        reserved: true,
        startedAt: -Infinity,
        projectile: null,
        onProjectileDestroy: null,
        offsetX: 0,
        offsetY: 0,
        visual
      };
      projectileLaunches.push(record);
      return record;
    } catch {
      destroyVisual(visual, destroyedVisuals);
      return null;
    }
  }

  function rollbackProjectileLaunches(records, projectiles) {
    for (const projectile of projectiles) {
      try {
        setProjectileVisible(projectile, true);
      } catch {
        // A cosmetic bridge cannot prevent the physical projectile from continuing.
      }
    }
    for (const record of records) releaseProjectileLaunch(record, false);
  }

  function createProjectileLaunches(snapshot, projectiles) {
    if (snapshot.vfxType !== "ballistic" || snapshot.usesEquipmentActionPoint !== true) return;
    if (!Array.isArray(projectiles) || projectiles.length === 0) return;

    const eligibleProjectiles = projectiles.filter((projectile) => (
      projectile
      && projectile.active !== false
      && projectile.body?.enable !== false
    ));
    const allocations = [];
    try {
      for (const projectile of eligibleProjectiles) {
        const record = allocateProjectileLaunch();
        if (!record) throw new Error("projectile launch proxy pool exhausted");
        record.projectile = projectile;
        record.offsetX = finiteNumber(snapshot.originX) - finiteNumber(projectile.x);
        record.offsetY = finiteNumber(snapshot.originY) - finiteNumber(projectile.y);
        setVisual(record.visual, "setPosition", snapshot.originX, snapshot.originY);
        setVisual(record.visual, "setRotation", finiteNumber(projectile.presentationAngle, finiteNumber(snapshot.angle)));
        setVisual(record.visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin + 3);
        allocations.push(record);
      }

      for (const record of allocations) {
        setProjectileVisible(record.projectile, false);
        record.active = true;
        record.reserved = false;
        record.startedAt = nowMs;
        record.onProjectileDestroy = () => releaseProjectileLaunch(record, false);
        record.projectile.once?.("destroy", record.onProjectileDestroy);
        setVisual(record.visual, "setAlpha", 1);
        setVisual(record.visual, "setVisible", true);
      }
    } catch {
      rollbackProjectileLaunches(allocations, eligibleProjectiles);
    }
  }

  function updateProjectileLaunches() {
    for (const record of projectileLaunches) {
      if (!record.active) continue;
      const projectile = record.projectile;
      if (!projectile || projectile.active === false || projectile.destroyed) {
        releaseProjectileLaunch(record, false);
        continue;
      }
      const elapsed = Math.max(0, nowMs - record.startedAt);
      if (elapsed >= PROJECTILE_LAUNCH_DURATION_MS) {
        releaseProjectileLaunch(record, true);
        continue;
      }
      const progress = elapsed / PROJECTILE_LAUNCH_DURATION_MS;
      setVisual(record.visual, "setPosition",
        finiteNumber(projectile.x) + record.offsetX * (1 - progress),
        finiteNumber(projectile.y) + record.offsetY * (1 - progress));
    }
  }

  function hideTeslaChannel() {
    if (!teslaChannelVisual) return;
    setVisual(teslaChannelVisual, "clear");
    setVisual(teslaChannelVisual, "setAlpha", 0);
    setVisual(teslaChannelVisual, "setVisible", false);
  }

  function allocateTeslaChannelVisual() {
    if (teslaChannelVisual) return teslaChannelVisual;
    let visual = null;
    try {
      visual = scene.add.graphics();
      if (!visual) throw new Error("Tesla channel graphics allocation returned no visual");
      setVisual(visual, "setPosition", 0, 0);
      setVisual(visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin + 3);
      setVisual(visual, "setAlpha", 0);
      setVisual(visual, "setVisible", false);
      teslaChannelVisual = visual;
      return visual;
    } catch {
      destroyVisual(visual, destroyedVisuals);
      return null;
    }
  }

  function copyTeslaSegments(segments) {
    if (!Array.isArray(segments)) return [];
    return segments.flatMap((segment) => {
      if (
        !Number.isFinite(segment?.x1)
        || !Number.isFinite(segment?.y1)
        || !Number.isFinite(segment?.x2)
        || !Number.isFinite(segment?.y2)
      ) {
        return [];
      }
      return [{
        x1: segment.x1,
        y1: segment.y1,
        x2: segment.x2,
        y2: segment.y2
      }];
    });
  }

  function drawTeslaTexture(visual, segments, visualPhase, width, color, alpha) {
    setVisual(visual, "lineStyle", width, color, alpha);
    for (const segment of segments) {
      const deltaX = segment.x2 - segment.x1;
      const deltaY = segment.y2 - segment.y1;
      const length = Math.hypot(deltaX, deltaY);
      if (length < 8) continue;
      const normalX = -deltaY / length;
      const normalY = deltaX / length;
      let previousX = segment.x1;
      let previousY = segment.y1;
      for (let step = 1; step <= 5; step += 1) {
        const progress = step / 5;
        const isEndpoint = step === 5;
        const direction = (visualPhase + step) % 2 === 0 ? 1 : -1;
        const amplitude = isEndpoint ? 0 : 2 + ((visualPhase + step * 3) % 3);
        const nextX = segment.x1 + deltaX * progress + normalX * amplitude * direction;
        const nextY = segment.y1 + deltaY * progress + normalY * amplitude * direction;
        setVisual(visual, "lineBetween", previousX, previousY, nextX, nextY);
        previousX = nextX;
        previousY = nextY;
      }
    }
  }

  function drawTeslaChannel(visual, segments, visualPhase) {
    setVisual(visual, "clear");
    setVisual(visual, "lineStyle", 4, 0x3692ff, 0.42);
    for (const segment of segments) {
      setVisual(visual, "lineBetween", segment.x1, segment.y1, segment.x2, segment.y2);
    }
    setVisual(visual, "lineStyle", 1, 0xe2f7ff, 0.58);
    for (const segment of segments) {
      setVisual(visual, "lineBetween", segment.x1, segment.y1, segment.x2, segment.y2);
    }
    drawTeslaTexture(visual, segments, visualPhase, 2, 0x3692ff, 0.9);
    drawTeslaTexture(visual, segments, visualPhase, 1, 0xe2f7ff, 1);
  }

  return {
    trackActor,
    untrackActor,
    notifyAttack(payload = {}, committedProjectiles = []) {
      const effectSnapshot = resolveAttackEffectSnapshot(scene, payload);
      applyRecoilPulse(scene, payload);
      const activated = activateEffect("attack", effectSnapshot, (visual, snapshot, isGraphics) => {
        const angle = finiteNumber(snapshot.angle);
        const offset = snapshot.heavy === true ? MUZZLE_OFFSET_PX.heavy : MUZZLE_OFFSET_PX.light;
        const visualOriginX = finiteNumber(snapshot.originX);
        const visualOriginY = finiteNumber(snapshot.originY);
        const useExactOrigin = snapshot.usesEquipmentActionPoint === true || snapshot.centerOwnedField === true;
        setVisual(visual, "setPosition",
          useExactOrigin ? visualOriginX : Math.round(visualOriginX + Math.cos(angle) * offset),
          useExactOrigin ? visualOriginY : Math.round(visualOriginY + Math.sin(angle) * offset));
        setVisual(visual, "setRotation", angle);
        if (isGraphics) {
          drawAttackGraphic(visual, snapshot);
        } else {
          const tesla = snapshot.vfxType === "tesla";
          setVisual(visual, "setDisplaySize", tesla ? 22 : 14, tesla ? 6 : 8);
          setVisual(visual, "setTint", tesla ? 0x3692ff : 0xffd27a);
        }
        setVisual(visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin + 2);
      });
      if (activated) createProjectileLaunches(effectSnapshot, committedProjectiles);
      return activated;
    },
    notifyTeslaChannel(payload = {}) {
      if (destroyed || disabled || paused) return false;
      if (payload.phase === "stop") {
        hideTeslaChannel();
        return true;
      }
      if (payload.phase !== "start" && payload.phase !== "sustain") return false;
      const segments = copyTeslaSegments(payload.segments);
      if (segments.length === 0) {
        hideTeslaChannel();
        return false;
      }
      const visual = allocateTeslaChannelVisual();
      if (!visual) return false;
      const aimPayload = {
        angle: finiteNumber(payload.angle),
        weaponId: payload.weaponId ?? "tesla"
      };
      try {
        scene.playerPresentation?.updateAim?.(aimPayload);
      } catch {
        // Aim updates are cosmetic; the channel remains visible.
      }
      if (payload.phase === "start") {
        applyRecoilPulse(scene, {
          ...aimPayload,
          heavy: true
        });
      }
      try {
        drawTeslaChannel(visual, segments, Math.floor(finiteNumber(payload.visualPhase)));
        setVisual(visual, "setPosition", 0, 0);
        setVisual(visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin + 3);
        setVisual(visual, "setAlpha", 1);
        setVisual(visual, "setVisible", true);
        return true;
      } catch {
        hideTeslaChannel();
        return false;
      }
    },
    notifyHit(payload = {}) {
      return activateEffect("hit", payload, (visual, snapshot, isGraphics) => {
        const style = resolveMaterialStyle(snapshot);
        const lethalScale = snapshot.lethal ? 1.35 : 1;
        setVisual(visual, "setPosition", finiteNumber(snapshot.impactX, finiteNumber(snapshot.x)), finiteNumber(snapshot.impactY, finiteNumber(snapshot.y)));
        if (isGraphics) {
          drawMaterialGraphic(visual, style, false);
        } else {
          setVisual(visual, "setDisplaySize", style.hitSize[0] * lethalScale, style.hitSize[1] * lethalScale);
          setVisual(visual, "setTint", style.hitTint);
        }
        setVisual(visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin + 1);
      });
    },
    notifyDeath(payload = {}) {
      return activateEffect("death", payload, (visual, snapshot, isGraphics) => {
        const style = resolveMaterialStyle(snapshot);
        setVisual(visual, "setPosition", finiteNumber(snapshot.x), finiteNumber(snapshot.y));
        if (isGraphics) {
          drawMaterialGraphic(visual, style, true);
        } else {
          setVisual(visual, "setDisplaySize", style.deathSize[0], style.deathSize[1]);
          setVisual(visual, "setTint", style.deathTint);
        }
        setVisual(visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin);
      });
    },
    update(nextNowMs) {
      if (destroyed || disabled || paused) return;
      nowMs = finiteNumber(nextNowMs, nowMs);
      for (const record of [...shadows.values()]) updateShadow(record);
      for (const pool of Object.values(pools)) updatePool(pool);
      updateProjectileLaunches();
    },
    setPaused(nextPaused) {
      if (destroyed || disabled) return;
      paused = Boolean(nextPaused);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      releaseAll();
    }
  };
}

export function createCombatFeedbackController(scene, options = {}) {
  if (!scene?.add?.image) return createNoopController();
  try {
    if (
      typeof scene.textures?.exists === "function"
      && !scene.textures.exists(TEXTURES.contactShadow)
    ) {
      return createNoopController();
    }
    return createRealCombatFeedbackController(scene, options);
  } catch {
    return createNoopController();
  }
}
