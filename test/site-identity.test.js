import test from "node:test";
import assert from "node:assert/strict";
import { SITE_CODE, SITE_CHANNELS } from "../src/ui/siteIdentity.js";

test("SITE-CN-03 is the sole Stage 1 production identity and exposes every approved channel", () => {
  assert.equal(SITE_CODE, "SITE-CN-03");
  assert.deepEqual(SITE_CHANNELS, {
    containmentIncident: "SITE-CN-03 // CONTAINMENT INCIDENT",
    armoryControl: "SITE-CN-03 // ARMORY CONTROL",
    quartermaster: "SITE-CN-03 // QUARTERMASTER",
    containmentSystem: "SITE-CN-03 // CONTAINMENT SYSTEM",
    fieldAuthorization: "SITE-CN-03 // FIELD AUTHORIZATION",
    operatorLoadout: "SITE-CN-03 // OPERATOR LOADOUT",
    missionControl: "SITE-CN-03 // MISSION CONTROL",
    incidentReport: "SITE-CN-03 // INCIDENT REPORT",
    recontainmentReport: "SITE-CN-03 // RECONTAINMENT REPORT"
  });
  assert.equal(Object.isFrozen(SITE_CHANNELS), true);
});
