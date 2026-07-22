import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_SECURITY_POLICY,
  WINDOW_OPTIONS,
  WINDOW_WEB_PREFERENCES,
  isAllowedAppUrl
} from "../src/security.mjs";

test("renderer remains sandboxed and app-origin only", () => {
  assert.deepEqual(WINDOW_WEB_PREFERENCES, {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webviewTag: false
  });
  assert.equal(isAllowedAppUrl("app://scp-survivor/index.html"), true);
  assert.equal(isAllowedAppUrl("https://example.com"), false);
  assert.match(CONTENT_SECURITY_POLICY, /connect-src 'none'/);
});

test("window starts hidden at the approved desktop size", () => {
  assert.equal(WINDOW_OPTIONS.show, false);
  assert.equal(WINDOW_OPTIONS.width, 1100);
  assert.equal(WINDOW_OPTIONS.height, 700);
  assert.equal(WINDOW_OPTIONS.minWidth, 960);
  assert.equal(WINDOW_OPTIONS.minHeight, 540);
  assert.equal(WINDOW_OPTIONS.autoHideMenuBar, true);
  assert.deepEqual(WINDOW_OPTIONS.webPreferences, WINDOW_WEB_PREFERENCES);
});
