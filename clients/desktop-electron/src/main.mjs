import {
  app,
  BrowserWindow,
  net,
  protocol,
  session
} from "electron";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAppProtocol } from "./app-protocol.mjs";
import {
  CONTENT_SECURITY_POLICY,
  WINDOW_OPTIONS,
  isAllowedAppUrl
} from "./security.mjs";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true
    }
  }
]);

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function createWindow() {
  const window = new BrowserWindow(WINDOW_OPTIONS);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isAllowedAppUrl(targetUrl)) {
      event.preventDefault();
    }
  });
  window.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedUrl) => {
      if (errorCode === -3) {
        return;
      }
      console.error("Desktop load failed", {
        errorCode,
        errorDescription,
        validatedUrl
      });
      process.exitCode = 1;
      app.quit();
    }
  );
  window.once("ready-to-show", () => window.show());
  void window.loadURL("app://scp-survivor/index.html");
  return window;
}

app.whenReady().then(() => {
  const webRoot = app.isPackaged
    ? join(process.resourcesPath, ".web-dist")
    : join(clientRoot, ".web-dist");
  registerAppProtocol({ protocol, net, webRoot });
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false)
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.on("will-download", (event) => event.preventDefault());
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CONTENT_SECURITY_POLICY]
      }
    });
  });
  createWindow();
});

app.on("window-all-closed", () => app.quit());
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
