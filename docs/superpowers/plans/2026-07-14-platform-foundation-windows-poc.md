# Platform Foundation and Windows PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `dev/app-platform` 中建立隔离的 Windows Electron 工程 PoC，验证标准 Vite artifact 的 staging、安全 origin、生命周期、离线、音频和存档。

**Architecture:** 根 Phaser/Vite 项目仍是唯一游戏实现，Electron 只消费根 `dist/`。所有桌面依赖、脚本、测试和生成物放在 `clients/desktop-electron/`；renderer 不获得 Node、Electron、preload 或 IPC 能力。

**Tech Stack:** Phaser 3.90、Vite 7.3、JavaScript ES Modules、Node.js >= 22.12.0、Electron 43.1.0、Electron Forge CLI 7.11.2、Node `node:test`。

## Global Constraints

- 只在 `C:\scp-survivor-app` 的 `dev/app-platform` worktree 执行。
- 保留未跟踪的旧 App proposal，同步前后核对其 SHA256。
- 先 fast-forward 到批准的 `main`，不得改写历史。
- 只制作 unpacked Windows x64 内部 PoC；不做 installer、签名或发布。
- 不修改根 manifest、lockfile、HTML、Vite、CI、游戏源码、资源合同或存档 schema。
- renderer 固定 `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`；无 preload、IPC、remote content 或 webview。
- renderer 只允许 `app://scp-survivor/`，拒绝外部导航、新窗口、下载和权限。
- 保持 `scp-survivor-meta` key 和 JSON 语义。
- 每个代码任务先写失败测试，再写最小实现，再提交。
- Task 2 以前必须完成 Level 2 审查，或由 Project Lead 明确接受可回退 PoC 风险。

---

## File Map

- Create `clients/desktop-electron/package.json` and nested lockfile: 独立依赖图。
- Create `clients/desktop-electron/.gitignore`: 忽略依赖、staging 和 package 输出。
- Create `clients/desktop-electron/scripts/stage-web.mjs`: 校验、复制和指纹化根 `dist/`。
- Create `clients/desktop-electron/src/app-protocol.mjs`: 安全映射 app origin。
- Create `clients/desktop-electron/src/security.mjs`: CSP、renderer 和导航策略。
- Create `clients/desktop-electron/src/main.mjs`: 单窗口生命周期。
- Create `clients/desktop-electron/forge.config.mjs`: unpacked Windows package。
- Create `clients/desktop-electron/test/*.test.mjs`: manifest、staging、protocol、security 测试。
- Create `clients/desktop-electron/README.md`: 人工 smoke 记录。
- Modify `docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md`: 更新旧事实。

### Task 1: Synchronize the App worktree and refresh the proposal

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md`

**Interfaces:**
- Consumes: approved multi-platform design on `main`。
- Produces: tracked, current Windows PoC proposal。

- [ ] **Step 1: Verify current state**

```powershell
Set-Location C:\scp-survivor-app
git branch --show-current
git status --short --branch
Get-FileHash docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md -Algorithm SHA256
git log --oneline dev/app-platform..main
```

Expected: branch is `dev/app-platform` and the proposal is the only untracked project file.

- [ ] **Step 2: Fast-forward and preserve the file**

```powershell
git merge --ff-only main
if ($LASTEXITCODE -ne 0) { throw 'App branch did not fast-forward' }
Get-FileHash docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md -Algorithm SHA256
```

Expected: fast-forward succeeds and the proposal hash is unchanged.

- [ ] **Step 3: Apply exact proposal updates**

Add a line naming `docs/superpowers/specs/2026-07-14-multi-platform-client-design.md` as the upper-level design. Replace the stale build row with Vite 7.3.6, 29 transformed modules, `dist/index.html` and the current hashed asset. Restrict the first artifact to an unpacked Windows x64 directory. Keep installer, signing, updater, stores and public download excluded.

- [ ] **Step 4: Verify and commit**

```powershell
npm.cmd run build
git diff --check
git add docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md
git commit -m "docs: refresh Windows client proposal"
```

### Task 2: Scaffold the isolated Electron client

**Files:**
- Create: `clients/desktop-electron/package.json`
- Create: `clients/desktop-electron/package-lock.json`
- Create: `clients/desktop-electron/.gitignore`
- Test: `clients/desktop-electron/test/package-contract.test.mjs`

**Interfaces:**
- Produces commands `test`, `stage`, `start` and `package:win`.

- [ ] **Step 1: Write the failing test**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("desktop dependencies stay isolated", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8")
  );
  assert.equal(manifest.private, true);
  assert.equal(manifest.type, "module");
  assert.equal(manifest.main, "src/main.mjs");
  assert.equal(manifest.devDependencies.electron, "43.1.0");
  assert.equal(manifest.devDependencies["@electron-forge/cli"], "7.11.2");
});
```

- [ ] **Step 2: Run RED**

Run `node --test clients/desktop-electron/test/package-contract.test.mjs`.

Expected: FAIL with `ENOENT` for the missing manifest.

- [ ] **Step 3: Create the exact manifest**

```json
{
  "name": "scp-survivor-desktop-electron",
  "version": "0.0.0-poc",
  "private": true,
  "type": "module",
  "main": "src/main.mjs",
  "scripts": {
    "test": "node --test test/*.test.mjs",
    "stage": "node scripts/stage-web.mjs",
    "start": "npm run stage && electron-forge start",
    "package:win": "npm run stage && electron-forge package --platform=win32 --arch=x64"
  },
  "devDependencies": {
    "@electron-forge/cli": "7.11.2",
    "electron": "43.1.0"
  }
}
```

Ignore exactly:

```gitignore
node_modules/
.web-dist/
out/
```

- [ ] **Step 4: Install nested dependencies and run GREEN**

```powershell
npm.cmd install --prefix clients/desktop-electron
node --test clients/desktop-electron/test/package-contract.test.mjs
git diff -- package.json package-lock.json
```

Expected: test passes and root manifests have no diff.

- [ ] **Step 5: Commit**

```powershell
git add clients/desktop-electron
git commit -m "build(app): isolate Electron client dependencies"
```

### Task 3: Stage and fingerprint the Web artifact

**Files:**
- Create: `clients/desktop-electron/scripts/stage-web.mjs`
- Test: `clients/desktop-electron/test/stage-web.test.mjs`

**Interfaces:**
- Produces `stageWeb({ sourceDir, stageDir, commit, dirty })` returning `{ commit, dirty, files }`.

- [ ] **Step 1: Write RED tests**

```js
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { stageWeb } from "../scripts/stage-web.mjs";

test("stageWeb copies and fingerprints sorted files", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "scp-stage-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceDir = join(root, "dist");
  const stageDir = join(root, "stage");
  await mkdir(join(sourceDir, "assets"), { recursive: true });
  await writeFile(join(sourceDir, "index.html"), "<main>ok</main>");
  await writeFile(join(sourceDir, "assets", "game.js"), "export default 1;");

  const manifest = await stageWeb({
    sourceDir,
    stageDir,
    commit: "abc123",
    dirty: false
  });

  assert.deepEqual(manifest.files.map((entry) => entry.path), [
    "assets/game.js",
    "index.html"
  ]);
  assert.equal(manifest.files.every((entry) => entry.sha256.length === 64), true);
  assert.equal(await readFile(join(stageDir, "index.html"), "utf8"), "<main>ok</main>");
  const saved = JSON.parse(
    await readFile(join(stageDir, "build-manifest.json"), "utf8")
  );
  assert.deepEqual(saved, manifest);
});

test("stageWeb rejects a source without index.html", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "scp-stage-missing-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "dist"));
  await assert.rejects(
    stageWeb({
      sourceDir: join(root, "dist"),
      stageDir: join(root, "stage"),
      commit: "abc123",
      dirty: false
    }),
    { message: "Missing web entry: index.html" }
  );
});
```

Run `node --test clients/desktop-electron/test/stage-web.test.mjs`.

Expected: FAIL because the module is absent.

- [ ] **Step 2: Implement staging**

Create `scripts/stage-web.mjs`:

```js
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

async function copyTree(sourceRoot, currentDir, stageDir, files) {
  const names = (await readdir(currentDir)).sort();
  for (const name of names) {
    const sourcePath = join(currentDir, name);
    const info = await lstat(sourcePath);
    if (info.isSymbolicLink()) {
      throw new Error("Symbolic links are not allowed: " + sourcePath);
    }
    const relativePath = relative(sourceRoot, sourcePath);
    const targetPath = join(stageDir, relativePath);
    if (info.isDirectory()) {
      await mkdir(targetPath, { recursive: true });
      await copyTree(sourceRoot, sourcePath, stageDir, files);
      continue;
    }
    if (!info.isFile()) {
      throw new Error("Unsupported artifact entry: " + sourcePath);
    }
    const bytes = await readFile(sourcePath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, bytes);
    files.push({
      path: relativePath.split(sep).join("/"),
      size: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex")
    });
  }
}

export async function stageWeb({ sourceDir, stageDir, commit, dirty }) {
  let entry;
  try {
    entry = await lstat(join(sourceDir, "index.html"));
  } catch {
    throw new Error("Missing web entry: index.html");
  }
  if (!entry.isFile()) {
    throw new Error("Missing web entry: index.html");
  }
  await rm(stageDir, { recursive: true, force: true });
  await mkdir(stageDir, { recursive: true });
  const files = [];
  await copyTree(sourceDir, sourceDir, stageDir, files);
  files.sort((left, right) => left.path.localeCompare(right.path));
  const manifest = { commit, dirty, files };
  await writeFile(
    join(stageDir, "build-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return manifest;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const clientRoot = resolve(dirname(scriptPath), "..");
  const repoRoot = resolve(clientRoot, "..", "..");
  const commit = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
    encoding: "utf8"
  }).trim();
  const dirty = execFileSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8"
  }).trim().length > 0;
  await stageWeb({
    sourceDir: join(repoRoot, "dist"),
    stageDir: join(clientRoot, ".web-dist"),
    commit,
    dirty
  });
}
```

- [ ] **Step 3: Run GREEN with fixtures and real output**

```powershell
node --test clients/desktop-electron/test/stage-web.test.mjs
npm.cmd run build
npm.cmd --prefix clients/desktop-electron run stage
Get-Content -Raw clients/desktop-electron/.web-dist/build-manifest.json
```

- [ ] **Step 4: Commit**

```powershell
git add clients/desktop-electron/scripts clients/desktop-electron/test/stage-web.test.mjs
git commit -m "build(app): stage verified web artifact"
```

### Task 4: Add the secure app origin

**Files:**
- Create: `clients/desktop-electron/src/app-protocol.mjs`
- Create: `clients/desktop-electron/src/security.mjs`
- Test: `clients/desktop-electron/test/app-protocol.test.mjs`
- Test: `clients/desktop-electron/test/security.test.mjs`

**Interfaces:**
- Produces `resolveAppPath`, `registerAppProtocol`, `WINDOW_WEB_PREFERENCES`, `CONTENT_SECURITY_POLICY` and `isAllowedAppUrl`.

- [ ] **Step 1: Write RED assertions**

Create `test/app-protocol.test.mjs`:

```js
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import test from "node:test";
import { resolveAppPath } from "../src/app-protocol.mjs";

const root = resolve("C:/virtual/web-root");

test("maps only the approved app origin inside web root", () => {
  assert.equal(resolveAppPath("app://scp-survivor/", root), join(root, "index.html"));
  assert.equal(
    resolveAppPath("app://scp-survivor/assets/a.js", root),
    join(root, "assets", "a.js")
  );
  assert.throws(
    () => resolveAppPath("app://other/index.html", root),
    /Rejected app origin/
  );
  assert.throws(
    () => resolveAppPath("app://scp-survivor/%2e%2e%2fsecret", root),
    /Rejected app path/
  );
});
```

Create `test/security.test.mjs`:

```js
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
```

Expected: tests fail because source modules are absent.

- [ ] **Step 2: Implement path enforcement**

Create `src/app-protocol.mjs`:

```js
import { isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function resolveAppPath(requestUrl, webRoot) {
  const url = new URL(requestUrl);
  if (url.protocol !== "app:" || url.host !== "scp-survivor") {
    throw new Error("Rejected app origin");
  }
  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes("\0") || decoded.includes("\\")) {
    throw new Error("Rejected app path");
  }
  const parts = decoded.split("/").filter(Boolean);
  if (parts.includes("..")) {
    throw new Error("Rejected app path");
  }
  const candidate = resolve(webRoot, parts.length === 0 ? "index.html" : join(...parts));
  const boundary = relative(resolve(webRoot), candidate);
  if (boundary.startsWith("..") || isAbsolute(boundary)) {
    throw new Error("Rejected app path");
  }
  return candidate;
}

export function registerAppProtocol({ protocol, net, webRoot }) {
protocol.handle("app", (request) => {
  const filePath = resolveAppPath(request.url, webRoot);
  return net.fetch(pathToFileURL(filePath).toString());
});
}
```

Do not add localhost or `file://` fallback.

- [ ] **Step 3: Implement renderer defaults and CSP**

Create `src/security.mjs`:

```js
export const WINDOW_WEB_PREFERENCES = Object.freeze({
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webviewTag: false
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
```

- [ ] **Step 4: Run GREEN and commit**

```powershell
node --test clients/desktop-electron/test/app-protocol.test.mjs clients/desktop-electron/test/security.test.mjs
git add clients/desktop-electron/src clients/desktop-electron/test
git commit -m "feat(app): add secure desktop artifact origin"
```

### Task 5: Add the single-window lifecycle

**Files:**
- Create: `clients/desktop-electron/src/main.mjs`
- Create: `clients/desktop-electron/forge.config.mjs`
- Modify/Test: security module and test.

**Interfaces:**
- Produces one sandboxed window loading `app://scp-survivor/index.html`.

- [ ] **Step 1: Write RED window-option assertions**

Extend `test/security.test.mjs`:

```js
import {
  CONTENT_SECURITY_POLICY,
  WINDOW_OPTIONS,
  WINDOW_WEB_PREFERENCES,
  isAllowedAppUrl
} from "../src/security.mjs";

test("window starts hidden at the approved desktop size", () => {
  assert.equal(WINDOW_OPTIONS.show, false);
  assert.equal(WINDOW_OPTIONS.width, 1100);
  assert.equal(WINDOW_OPTIONS.height, 700);
  assert.equal(WINDOW_OPTIONS.minWidth, 960);
  assert.equal(WINDOW_OPTIONS.minHeight, 540);
  assert.equal(WINDOW_OPTIONS.autoHideMenuBar, true);
  assert.deepEqual(WINDOW_OPTIONS.webPreferences, WINDOW_WEB_PREFERENCES);
});
```

- [ ] **Step 2: Implement lifecycle**

Add to `src/security.mjs`:

```js
export const WINDOW_OPTIONS = Object.freeze({
  width: 1100,
  height: 700,
  minWidth: 960,
  minHeight: 540,
  show: false,
  autoHideMenuBar: true,
  webPreferences: WINDOW_WEB_PREFERENCES
});
```

Create `src/main.mjs`:

```js
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
```

Do not add tray, background process, preload, IPC or updater.

- [ ] **Step 3: Add Forge config**

```js
export default {
  packagerConfig: {
    asar: true,
    extraResource: [".web-dist"]
  },
  makers: []
};
```

- [ ] **Step 4: Run GREEN and commit**

```powershell
npm.cmd --prefix clients/desktop-electron test
git diff --check
git add clients/desktop-electron
git commit -m "feat(app): add sandboxed Windows shell"
```

### Task 6: Package and smoke the unpacked PoC

**Files:**
- Create: `clients/desktop-electron/README.md`
- Verify: ignored output below `clients/desktop-electron/out/`.

**Interfaces:**
- Produces an unpacked Windows x64 test directory and smoke evidence.

- [ ] **Step 1: Document exact commands**

```powershell
npm.cmd run build
npm.cmd --prefix clients/desktop-electron test
npm.cmd --prefix clients/desktop-electron run stage
npm.cmd --prefix clients/desktop-electron run start
npm.cmd --prefix clients/desktop-electron run package:win
```

README must mark PASS, FAIL or NOT TESTED for one window, title screen, starting a run, keyboard movement, first-interaction audio, mute, ten Scene restarts, meta persistence, offline cold start, 100%/125% DPI, no remaining process, unavailable renderer `process`/`require`, denied external navigation, rejected unknown path and no security warning.

- [ ] **Step 2: Run automated gates**

```powershell
npm.cmd run build
npm.cmd --prefix clients/desktop-electron test
npm.cmd --prefix clients/desktop-electron run stage
git diff --check
```

- [ ] **Step 3: Run development and packaged smoke**

Run `start`, then `package:win`. Launch the generated executable once online and once offline. Record actual evidence for every README row.

- [ ] **Step 4: Verify scope and commit**

```powershell
git diff --check
git status --short --branch
git diff --stat
git add clients/desktop-electron/README.md
git commit -m "docs(app): record Windows PoC verification"
```

Expected: root shared files are unchanged; dependencies, staging, package output and root `dist/` remain ignored.

## Completion Gate

The PoC is complete only when the root build and all client tests pass; the unpacked app starts offline; renderer isolation is observed; audio and `scp-survivor-meta` persistence work; close leaves no process; unexecuted checks are marked NOT TESTED; root shared files remain unchanged; and `dev/app-platform` finishes clean.

Passing this plan does not authorize installer work or Android, iOS, or WeChat implementation. Those receive separate plans after this PoC under `docs/superpowers/specs/2026-07-14-multi-platform-client-design.md`.
