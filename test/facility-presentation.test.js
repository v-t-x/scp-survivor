import test from "node:test";
import assert from "node:assert/strict";
import { getFacilityPresentation } from "../src/art/facilityPresentation.js";

const PRESENTATION_KEYS = [
  "ambientTint",
  "ambientAlpha",
  "maintenanceTint",
  "maintenanceAlpha",
  "contaminationTint",
  "contaminationAlpha",
  "warningPulseAlpha"
];

const ALPHA_KEYS = PRESENTATION_KEYS.filter((key) => key.endsWith("Alpha"));

test("facility presentation returns a frozen deterministic normal-state snapshot without mutating input", () => {
  const input = Object.freeze({
    outageStrength: 0,
    activeEventType: null,
    bossPhaseActive: false
  });

  const first = getFacilityPresentation(input);
  const second = getFacilityPresentation(input);

  assert.deepEqual(first, {
    ambientTint: 0xffffff,
    ambientAlpha: 1,
    maintenanceTint: 0xffffff,
    maintenanceAlpha: 1,
    contaminationTint: 0xffffff,
    contaminationAlpha: 1,
    warningPulseAlpha: 1
  });
  assert.deepEqual(second, first);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(second));
  assert.deepEqual(input, {
    outageStrength: 0,
    activeEventType: null,
    bossPhaseActive: false
  });
});

test("facility presentation turns outage, facility events, and boss state into display-only variants", () => {
  const normal = getFacilityPresentation({
    outageStrength: 0,
    activeEventType: null,
    bossPhaseActive: false
  });
  const outage = getFacilityPresentation({
    outageStrength: 1,
    activeEventType: null,
    bossPhaseActive: false
  });
  const event = getFacilityPresentation({
    outageStrength: 0,
    activeEventType: "powerOutage",
    bossPhaseActive: false
  });
  const boss = getFacilityPresentation({
    outageStrength: 0,
    activeEventType: null,
    bossPhaseActive: true
  });
  const combined = getFacilityPresentation({
    outageStrength: 1,
    activeEventType: "powerOutage",
    bossPhaseActive: true
  });

  assert.notDeepEqual(outage, normal);
  assert.notDeepEqual(event, normal);
  assert.notDeepEqual(boss, normal);
  assert.notDeepEqual(combined, outage);
  assert.notDeepEqual(combined, event);
  assert.notDeepEqual(combined, boss);
  assert.deepEqual(Object.keys(combined).sort(), [...PRESENTATION_KEYS].sort());
});

test("facility presentation keeps every output finite and every alpha clamped", () => {
  const presentation = getFacilityPresentation({
    outageStrength: Number.POSITIVE_INFINITY,
    activeEventType: { unexpected: true },
    bossPhaseActive: "yes"
  });

  for (const key of PRESENTATION_KEYS) {
    assert.ok(Number.isFinite(presentation[key]), `${key} must be finite`);
  }
  for (const key of ALPHA_KEYS) {
    assert.ok(presentation[key] >= 0 && presentation[key] <= 1, `${key} must be clamped`);
  }
});
