# App Platform Multi-Client Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans only after the Project Lead approves the resulting proposal. This plan's first wave produces a platform proposal and no packaging implementation.

**Goal:** Produce a Windows-first client proof-of-concept proposal with a clear long-term boundary for desktop, mobile, PWA, launchers, and future client containers.

**Architecture:** Treat the Vite web build as the stable game artifact. Keep platform lifecycle, filesystem, permissions, security, offline, packaging, and distribution in a platform-owned boundary. Do not force desktop, mobile, and PWA into a single wrapper without comparing their constraints.

**Tech Stack:** Existing Phaser 3.90/Vite 7 web build, Node/npm, Windows-first validation, and a documented comparison of Electron, Tauri, PWA, and Capacitor-oriented routes.

## Global Constraints

- Planning wave only: do not edit `package.json`, `package-lock.json`, `index.html`, Vite config, CI, or game source.
- Do not change gameplay semantics, UI direction, asset content, audio behavior, or persistence format.
- Windows is the first proof-of-concept target; desktop, mobile, PWA, and launcher responsibilities must still be mapped.
- Code signing, store submission, automatic updates, paid services, and public release remain separately authorized.
- Any dependency, build, entry-point, preload, asset-path, audio, or persistence change requires Project Lead approval.
- End with a clean worktree, exact verification output, and a small proposal-only commit.

---

### Task 1: Audit the current web client assumptions

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Read: `index.html`
- Read: `vite.config.*` if present
- Read: `src/main.js`
- Read: `src/scenes/PreloadScene.js`
- Read: `src/audio/AudioManager.js`
- Read: `src/config/meta.js`
- Read: `.gitignore`
- Read: `.github/workflows/ci.yml`
- Read: `docs/licensing-and-commercialization.md`
- Create: `docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md`

**Interfaces:**
- Consumes: current web entry, build output, asset paths, audio lifecycle, localStorage behavior, CI, and ignored/generated directories.
- Produces: a fact table of assumptions that a client wrapper must preserve or explicitly adapt.

- [ ] **Step 1: Confirm branch and clean state**

Run:

```powershell
Get-Location
git branch --show-current
git status --short --branch
git rev-parse HEAD
```

Expected: the assigned `dev/app-platform` worktree is clean and based on `e9662e0` or a later Project Lead-approved commit.

- [ ] **Step 2: Audit build and startup**

Run:

```powershell
npm run build
Get-ChildItem -Recurse -File dist | Select-Object FullName,Length
rg -n "new Phaser\.Game|PreloadScene|localStorage|AudioContext|fetch\(|assets|base|server" package.json index.html src vite.config.* .github
```

Record actual output paths, base-path assumptions, startup sequence, and any browser-only API requirement.

- [ ] **Step 3: Audit lifecycle and security-sensitive behavior**

Record first-interaction audio recovery, scene shutdown/restart cleanup, storage fallback, external network calls, asset loading, and any API that would behave differently inside a client shell.

### Task 2: Compare platform approaches

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md`

**Interfaces:**
- Consumes: Task 1 assumptions.
- Produces: a capability matrix and a recommended Windows proof-of-concept route.

- [ ] **Step 1: Compare Electron, Tauri, PWA, and Capacitor-oriented routes**

Score each route from 1–5 for Windows startup reliability, bundle size, Node/runtime needs, Phaser compatibility, filesystem access, audio behavior, offline support, security surface, installer effort, mobile reuse, CI complexity, and team maintainability. Explain every score of 1 or 5.

- [ ] **Step 2: Recommend one Windows proof of concept**

State the selected route, rejected alternatives, minimum supported Windows assumptions, expected artifact, directory boundary, and what is deliberately not included. Do not add dependencies while writing the proposal.

- [ ] **Step 3: Define the cross-client capability matrix**

Use rows for desktop, mobile wrapper, installable PWA, launcher, and future platform-specific container. Use columns for startup, lifecycle, storage, audio, offline, permissions, updates, signing, distribution, and gameplay-contract responsibility.

### Task 3: Define platform contracts and verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md`

**Interfaces:**
- Consumes: recommended route and capability matrix.
- Produces: proposed directory layout, exact shared-file requests, release boundaries, tests, and rollback plan.

- [ ] **Step 1: Define the platform boundary**

Name the proposed platform-owned directories and files. For each file, state whether it is new, modified, generated, ignored, or Project Lead controlled. Define how the platform wrapper receives the web build without changing gameplay semantics.

- [ ] **Step 2: Define lifecycle and release contracts**

Specify startup, clean exit, window behavior, local asset paths, first-interaction audio, persistence, offline behavior, permissions, security defaults, installer/uninstaller, signing, update strategy, and store/distribution boundaries. Separate proof-of-concept requirements from formal release requirements.

- [ ] **Step 3: Define verification**

Include commands and expected observations for:

```powershell
npm run build
git diff --check
```

and web startup, packaged startup, clean exit, local asset loading, first-interaction audio, persistence, offline behavior, clean install/uninstall, and security configuration. Mark untestable items as explicit follow-ups, not assumptions.

- [ ] **Step 4: Review scope and commit**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat
```

Expected: only the proposal file is changed. Commit:

```powershell
git add docs/superpowers/plans/2026-07-10-app-platform-client-proposal.md
git commit -m "docs: propose multi-client app platform route"
```

Report the commit hash and wait for Project Lead approval. Do not add dependencies or platform scaffolding in the same turn.
