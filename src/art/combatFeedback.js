import { TEXTURES } from "../assets/manifest.js";

const NOOP_METHODS = Object.freeze({
  trackActor() {},
  untrackActor() {},
  notifyHit() {},
  notifyDeath() {},
  update() {},
  setPaused() {},
  destroy() {}
});

const DEFAULT_POOL_LIMITS = Object.freeze({ attack: 12, hit: 24, death: 12 });
const DEFAULT_EFFECT_DURATION_MS = 140;

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

function createVisual(scene, x, y) {
  return scene.add.image(x, y, TEXTURES.contactShadow);
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
      visual = createVisual(scene, x, y);
      configure(visual);
      return visual;
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
      const visual = createConfiguredVisual(0, 0, (created) => {
        setVisual(created, "setOrigin", 0.5, 0.5);
        setVisual(created, "setVisible", false);
        setVisual(created, "setAlpha", 0);
      });
      if (!visual) return null;
      const record = { visual, active: false, startedAt: -Infinity, snapshot: null };
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
      configure(record.visual, snapshot);
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
      return activateEffect("attack", payload, (visual, snapshot) => {
        setVisual(visual, "setPosition", finiteNumber(snapshot.originX), finiteNumber(snapshot.originY));
        setVisual(visual, "setDisplaySize", snapshot.heavy ? 24 : 16, snapshot.heavy ? 12 : 8);
        setVisual(visual, "setRotation", finiteNumber(snapshot.angle));
        setVisual(visual, "setTint", snapshot.heavy ? 0xd39c3c : 0x8be7f1);
      });
    },
    notifyHit(payload = {}) {
      return activateEffect("hit", payload, (visual, snapshot) => {
        setVisual(visual, "setPosition", finiteNumber(snapshot.impactX, finiteNumber(snapshot.x)), finiteNumber(snapshot.impactY, finiteNumber(snapshot.y)));
        setVisual(visual, "setDisplaySize", snapshot.lethal ? 18 : 12, snapshot.lethal ? 9 : 6);
        setVisual(visual, "setTint", snapshot.lethal ? 0xd39c3c : 0x9ed4df);
      });
    },
    notifyDeath(payload = {}) {
      return activateEffect("death", payload, (visual, snapshot) => {
        setVisual(visual, "setPosition", finiteNumber(snapshot.x), finiteNumber(snapshot.y));
        setVisual(visual, "setDisplaySize", snapshot.isBoss ? 36 : 24, snapshot.isBoss ? 18 : 12);
        setVisual(visual, "setTint", finiteNumber(snapshot.color, 0x8b2635));
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
