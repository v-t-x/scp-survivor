export const WINDOW_WEB_PREFERENCES = Object.freeze({
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webviewTag: false
});

export const WINDOW_OPTIONS = Object.freeze({
  width: 1100,
  height: 700,
  minWidth: 960,
  minHeight: 540,
  show: false,
  autoHideMenuBar: true,
  webPreferences: WINDOW_WEB_PREFERENCES
});

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'"
].join("; ");

export function isAllowedAppUrl(value) {
  const url = new URL(value);
  return url.protocol === "app:" && url.host === "scp-survivor";
}
