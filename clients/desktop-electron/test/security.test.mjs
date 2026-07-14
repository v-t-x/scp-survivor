import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_SECURITY_POLICY,
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
