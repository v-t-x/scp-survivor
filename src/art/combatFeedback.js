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
  update() {},
  setPaused() {},
  destroy() {}
});

const DEFAULT_POOL_LIMITS = Object.freeze({ attack: 12, hit: 24, death: 12 });
const DEFAULT_EFFECT_DURATION_MS = 140;

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

function drawAttackGraphic(graphics, snapshot) {
  const heavy = snapshot.heavy === true;
  const length = heavy ? 13 : 9;
  const spread = heavy ? 5 : 3;
  setVisual(graphics, "clear");
  setVisual(graphics, "lineStyle", heavy ? 3 : 2, heavy ? 0xd39c3c : 0x8be7f1, 0.95);
  setVisual(graphics, "lineBetween", 0, 0, length, 0);
  setVisual(graphics, "lineBetween", 2, 0, length - 2, -spread);
  setVisual(graphics, "lineBetween", 2, 0, length - 2, spread);
  if (heavy) {
    setVisual(graphics, "lineStyle", 1, 0xffe7a3, 0.8);
    setVisual(graphics, "lineBetween", -2, 0, length + 3, 0);
  }
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
  const effectDurationMs = Math.max(1, finiteNumber(options.effectDurationMs, DEFAULT_EFFECT_DURATION_MS));
  let paused = false;
  let destroyed = false;
  let disabled = false;
  let nowMs = finiteNumber(scene.time?.now, 0);

  function releaseAll() {
    for (const { visual } of shadows.values()) destroyVisual(visual, destroyedVisuals);
    shadows.clear();
    for (const pool of Object.values(pools)) {
      for (const record of pool) destroyVisual(record.visual, destroyedVisuals);
      pool.length = 0;
    }
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
    const snapshot = { ...payload };
    try {
      record.active = true;
      record.startedAt = nowMs;
      record.snapshot = snapshot;
      configure(record.visual, snapshot, record.isGraphics);
      setVisual(record.visual, "setAlpha", 0.7);
      setVisual(record.visual, "setVisible", true);
      return true;
    } catch {
      record.active = false;
      record.startedAt = -Infinity;
      record.snapshot = null;
      disableAfterAllocationFailure(record.visual);
      return false;
    }
  }

  function trackActor(actor, { kind = "actor", radius = 12, offsetY = 0 } = {}) {
    if (destroyed || disabled || !actor) return false;
    if (shadows.has(actor)) return true;
    const resolvedRadius = Math.max(1, finiteNumber(radius, 12));
    const resolvedOffsetY = finiteNumber(offsetY, 0);
    const visual = createConfiguredVisual(finiteNumber(actor.x), finiteNumber(actor.y), (created) => {
      setVisual(created, "setOrigin", 0.5, 0.5);
      setVisual(created, "setAlpha", 0.56);
      setVisual(created, "setTint", 0x1b1d22);
    });
    if (!visual) return false;
    shadows.set(actor, { actor, kind, radius: resolvedRadius, offsetY: resolvedOffsetY, visual });
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
    const { actor, radius, offsetY, visual } = record;
    if (!actor || actor.active === false || actor.destroyed) {
      shadows.delete(actor);
      destroyVisual(visual, destroyedVisuals);
      return;
    }
    const x = finiteNumber(actor.x);
    const y = finiteNumber(actor.y) + radius + offsetY;
    setVisual(visual, "setPosition", x, y);
    setVisual(visual, "setDisplaySize", radius * 2, radius);
    setVisual(visual, "setDepth", finiteNumber(actor.depth) - 1);
    setVisual(visual, "setVisible", true);
  }

  function updatePool(pool) {
    for (const record of pool) {
      if (!record.active) continue;
      const elapsed = nowMs - record.startedAt;
      if (elapsed >= effectDurationMs) {
        record.active = false;
        record.snapshot = null;
        setVisual(record.visual, "setVisible", false);
        setVisual(record.visual, "setAlpha", 0);
        continue;
      }
      const progress = Math.max(0, Math.min(1, elapsed / effectDurationMs));
      setVisual(record.visual, "setAlpha", 0.7 * (1 - progress));
    }
  }

  return {
    trackActor,
    untrackActor,
    notifyAttack(payload = {}) {
      return activateEffect("attack", payload, (visual, snapshot, isGraphics) => {
        setVisual(visual, "setPosition", finiteNumber(snapshot.originX), finiteNumber(snapshot.originY));
        setVisual(visual, "setRotation", finiteNumber(snapshot.angle));
        if (isGraphics) {
          drawAttackGraphic(visual, snapshot);
        } else {
          setVisual(visual, "setDisplaySize", snapshot.heavy ? 24 : 16, snapshot.heavy ? 12 : 8);
          setVisual(visual, "setTint", snapshot.heavy ? 0xd39c3c : 0x8be7f1);
        }
        setVisual(visual, "setDepth", COMBAT_PRESENTATION_DEPTH.decorationMin + 2);
      });
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
    return createRealCombatFeedbackController(scene, options);
  } catch {
    return createNoopController();
  }
}
