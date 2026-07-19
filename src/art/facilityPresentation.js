const NORMAL_TINT = 0xffffff;
const OUTAGE_TINT = 0x9b3942;
const EVENT_TINT = 0xb0703f;
const BOSS_TINT = 0x74506f;
const CONTAMINATION_TINT = 0x8d355a;

function clampAlpha(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function normalizeOutageStrength(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function hasActiveFacilityEvent(activeEventType) {
  return typeof activeEventType === "string" && activeEventType.length > 0;
}

export function getFacilityPresentation({
  outageStrength = 0,
  activeEventType = null,
  bossPhaseActive = false
} = {}) {
  const outage = normalizeOutageStrength(outageStrength);
  const hasEvent = hasActiveFacilityEvent(activeEventType);
  const bossActive = bossPhaseActive === true;

  return Object.freeze({
    ambientTint: bossActive ? BOSS_TINT : hasEvent ? OUTAGE_TINT : NORMAL_TINT,
    ambientAlpha: clampAlpha(1 - outage * 0.28 - (hasEvent ? 0.08 : 0) - (bossActive ? 0.08 : 0)),
    maintenanceTint: bossActive ? BOSS_TINT : hasEvent ? EVENT_TINT : NORMAL_TINT,
    maintenanceAlpha: clampAlpha(1 - outage * 0.22 - (hasEvent ? 0.1 : 0) - (bossActive ? 0.08 : 0)),
    contaminationTint: bossActive || hasEvent ? CONTAMINATION_TINT : NORMAL_TINT,
    contaminationAlpha: clampAlpha(1 - outage * 0.08 - (hasEvent ? 0.04 : 0) - (bossActive ? 0.04 : 0)),
    warningPulseAlpha: clampAlpha(1 - outage * 0.34 - (hasEvent ? 0.18 : 0) - (bossActive ? 0.14 : 0))
  });
}
