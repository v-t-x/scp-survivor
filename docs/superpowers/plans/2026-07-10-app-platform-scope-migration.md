# App Platform Scope Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the misleading desktop-only App branch and governance scope with a multi-client `dev/app-platform` role covering every SCP Survivor client form.

**Architecture:** Update the authoritative governance layer on `main` first, then rename the existing clean App branch in its current worktree, fast-forward it to the corrected main, publish the new remote branch, and delete the obsolete remote only after verification. Finally synchronize the corrected governance to the other active worktrees.

**Tech Stack:** Markdown, Git branches/worktrees, PowerShell, npm/Vite.

## Global Constraints

- The App role covers SCP Survivor desktop, mobile, PWA/installable web, launchers, and future client containers.
- Keep the App worktree at `C:\scp-survivor-app`.
- Rename `release/desktop-app` to `dev/app-platform`.
- Do not modify game or App implementation code.
- Stop if the old App branch is dirty or contains commits not reachable from `main`.
- Push and verify `dev/app-platform` before deleting `origin/release/desktop-app`.
- If the new remote push fails, preserve the old remote branch and stop.
- Use fast-forward-only synchronization; do not create merge commits or rewrite history.
- Finish with all worktrees clean and all active remote branches aligned with the corrected `main`.

---

## File Map

- Modify `AGENTS.md`: route `dev/app-platform` to the new guide.
- Delete `docs/agents/release-desktop-app.md`: obsolete desktop-only guide.
- Create `docs/agents/dev-app-platform.md`: multi-client App ownership and verification.
- Modify `docs/agents/main.md`: replace desktop-only exclusion wording.
- Modify `docs/agents/dev-v2.md`: replace desktop-only exclusion wording.
- Modify `docs/agents/feature-ui-art-overhaul.md`: replace desktop-only exclusion wording.
- Modify `docs/agents/refactor-ui-foundation.md`: replace desktop-only exclusion wording.
- Modify `docs/superpowers/specs/2026-07-10-agent-governance-design.md`: update branch/file names and App ownership.
- Modify `docs/superpowers/plans/2026-07-10-agent-governance.md`: update branch/file names and App ownership examples.

### Task 1: Correct the authoritative governance layer

**Files:**
- Modify: `AGENTS.md`
- Delete: `docs/agents/release-desktop-app.md`
- Create: `docs/agents/dev-app-platform.md`
- Modify: `docs/agents/main.md`
- Modify: `docs/agents/dev-v2.md`
- Modify: `docs/agents/feature-ui-art-overhaul.md`
- Modify: `docs/agents/refactor-ui-foundation.md`
- Modify: `docs/superpowers/specs/2026-07-10-agent-governance-design.md`
- Modify: `docs/superpowers/plans/2026-07-10-agent-governance.md`

**Interfaces:**
- Consumes: the approved scope in `docs/superpowers/specs/2026-07-10-app-platform-scope-design.md`.
- Produces: branch route `dev/app-platform -> docs/agents/dev-app-platform.md` and target-aware App verification rules.

- [ ] **Step 1: Verify the old and new routing state**

Run:

```powershell
if (-not (Test-Path docs/agents/release-desktop-app.md)) { throw 'Old App guide missing' }
if (Test-Path docs/agents/dev-app-platform.md) { throw 'New App guide already exists' }
$agents = Get-Content -Raw -Encoding UTF8 AGENTS.md
if (-not $agents.Contains('release/desktop-app')) { throw 'Old branch route missing' }
```

Expected: command exits successfully with no output.

- [ ] **Step 2: Replace the branch route in `AGENTS.md`**

Replace this row:

```markdown
| `release/desktop-app` | `docs/agents/release-desktop-app.md` |
```

with:

```markdown
| `dev/app-platform` | `docs/agents/dev-app-platform.md` |
```

- [ ] **Step 3: Replace the App guide**

Delete `docs/agents/release-desktop-app.md` and create
`docs/agents/dev-app-platform.md` with this exact content:

```markdown
# `dev/app-platform` Multi-Client App Guide

## Owns

- Desktop clients and native desktop containers.
- Mobile clients and mobile wrappers.
- Installable web/PWA behavior.
- Launchers and future platform-specific client shells.
- Platform startup, lifecycle, filesystem, permissions, security, and offline operation.
- Installation, updates, signing, stores, packaging, release automation, and distribution.
- Platform-specific integrations that preserve gameplay semantics.

## Does not own

- Gameplay rules, balance, enemies, weapons, bosses, events, timeline, progression,
  win/loss, or meta-progression behavior.
- UI/art visual direction, asset creation, animation/VFX design, or audio content.
- Hidden gameplay changes implemented through platform adapters.

## Shared-file rule

Before editing dependency manifests, lockfiles, `index.html`, build configuration,
web entry points, preload/asset contracts, UI/audio manager interfaces,
persistence schemas, or shared docs, report the exact platform requirement and
cross-branch impact and obtain Project Lead approval.

## Verification

Always run the web production build. Run startup and package checks for each
platform affected by the change, and verify relevant offline, permission, path,
security, audio, update, signing, or store behavior. When a shared client contract
changes, confirm unaffected platforms or report them as explicitly untested.
Report actual results and final Git status.
```

- [ ] **Step 4: Correct cross-domain wording in focused guides**

Apply these exact replacements:

| File | Replace | With |
|---|---|---|
| `docs/agents/main.md` | `desktop features directly` | `App-platform features directly` |
| `docs/agents/dev-v2.md` | `Desktop packaging, installers, signing, or release automation.` | `Client containers, platform packaging, installers, signing, stores, or release automation.` |
| `docs/agents/feature-ui-art-overhaul.md` | `Desktop packaging and release automation.` | `Client containers, platform packaging, stores, and release automation.` |
| `docs/agents/refactor-ui-foundation.md` | `desktop packaging.` | `client-platform implementation.` |

- [ ] **Step 5: Correct the active governance design**

In `docs/superpowers/specs/2026-07-10-agent-governance-design.md`:

- replace every `release/desktop-app` with `dev/app-platform`;
- replace every `release-desktop-app.md` with `dev-app-platform.md`;
- rename the role heading/owner from desktop application to App Platform;
- replace desktop-only ownership bullets with desktop, mobile, PWA, launcher,
  platform integration, packaging, signing, stores, and distribution ownership;
- change exclusions in other roles from desktop-only language to client/App-platform language;
- make verification target-aware while always requiring the web production build.

- [ ] **Step 6: Correct the active governance implementation plan**

In `docs/superpowers/plans/2026-07-10-agent-governance.md`:

- replace every `release/desktop-app` with `dev/app-platform`;
- replace every `release-desktop-app.md` with `dev-app-platform.md`;
- replace the embedded desktop guide content with the exact App guide content from Step 3;
- update the file map, required-file arrays, validation loops, and cross-role exclusions;
- rename desktop verification language to target-aware App-platform verification.

- [ ] **Step 7: Validate governance consistency**

Run:

```powershell
$required = @(
  'AGENTS.md',
  'docs/agents/dev-app-platform.md',
  'docs/agents/main.md',
  'docs/agents/dev-v2.md',
  'docs/agents/feature-ui-art-overhaul.md',
  'docs/agents/refactor-ui-foundation.md'
)
foreach ($path in $required) {
  if (-not (Test-Path $path)) { throw "Missing file: $path" }
}
if (Test-Path docs/agents/release-desktop-app.md) { throw 'Obsolete guide still exists' }
$active = @('AGENTS.md') + (Get-ChildItem docs/agents/*.md | ForEach-Object FullName)
$old = Select-String -Path $active -Pattern 'release/desktop-app|release-desktop-app|Desktop Guide|Desktop-only' -CaseSensitive:$false
if ($old) { throw "Stale desktop-only governance found: $old" }
$agents = Get-Content -Raw -Encoding UTF8 AGENTS.md
if (-not $agents.Contains('dev/app-platform')) { throw 'New App branch route missing' }
if (-not $agents.Contains('docs/agents/dev-app-platform.md')) { throw 'New App guide route missing' }
git diff --check
```

Expected: command exits successfully with no output.

- [ ] **Step 8: Commit corrected governance**

```powershell
git add AGENTS.md docs/agents docs/superpowers/specs/2026-07-10-agent-governance-design.md docs/superpowers/plans/2026-07-10-agent-governance.md docs/superpowers/plans/2026-07-10-app-platform-scope-migration.md
git commit -m "docs: broaden app agent to all client platforms"
```

Expected: one documentation-only commit with no source or package changes.

### Task 2: Verify and publish corrected `main`

**Files:**
- Verify: governance Markdown files from Task 1.

**Interfaces:**
- Consumes: corrected governance commit.
- Produces: `origin/main` containing the new App branch route before branch migration.

- [ ] **Step 1: Run the production build and Git checks**

Run:

```powershell
npm.cmd run build
git diff --check HEAD~1..HEAD
git status --short --branch
```

Expected: 27 modules transform successfully, only the existing bundle-size warning
appears, and the worktree is clean with `main` ahead of `origin/main`.

- [ ] **Step 2: Fetch and verify push ancestry**

Run:

```powershell
git fetch origin --prune
git merge-base --is-ancestor origin/main main
if ($LASTEXITCODE -ne 0) { throw 'origin/main is not an ancestor of main' }
git rev-list --left-right --count origin/main...main
```

Expected: remote main has no unique commits; local main contains only the approved
scope design, migration plan, and corrected governance commits.

- [ ] **Step 3: Push main**

```powershell
git push origin main
```

Expected: `origin/main` advances to the corrected governance commit.

### Task 3: Rename and publish the App branch

**Files:**
- Worktree: `C:\scp-survivor-app`
- Branches: `release/desktop-app`, `dev/app-platform`

**Interfaces:**
- Consumes: corrected `main` from Task 2.
- Produces: local and remote `dev/app-platform`; removes obsolete local/remote branch names after verification.

- [ ] **Step 1: Verify the old App branch is safe to migrate**

Run in `C:\scp-survivor-app`:

```powershell
git branch --show-current
git status --short --branch
git log --oneline main..release/desktop-app
git rev-list --left-right --count main...release/desktop-app
```

Expected:

- current branch is `release/desktop-app`;
- worktree is clean;
- `main..release/desktop-app` has no commits;
- the old branch may be behind main but has no unique commits.

- [ ] **Step 2: Rename the local branch and fast-forward it**

```powershell
git branch -m dev/app-platform
git merge --ff-only main
git branch --unset-upstream
```

Expected: `C:\scp-survivor-app` is on `dev/app-platform` at the same HEAD as
`main`, with no upstream until the new branch is pushed.

- [ ] **Step 3: Read the newly active branch guide and build**

```powershell
Get-Content -Raw -Encoding UTF8 AGENTS.md
Get-Content -Raw -Encoding UTF8 docs/agents/dev-app-platform.md
npm.cmd run build
git status --short --branch
```

Expected: routing and guide identify `dev/app-platform`; build transforms 27
modules; worktree is clean.

- [ ] **Step 4: Push and verify the new remote branch**

```powershell
git push -u origin dev/app-platform
git rev-list --left-right --count origin/dev/app-platform...dev/app-platform
```

Expected: push succeeds and the count is `0 0`.

- [ ] **Step 5: Delete the obsolete remote branch only after verification**

```powershell
git push origin --delete release/desktop-app
git fetch origin --prune
git branch --list release/desktop-app
git branch -r --list origin/release/desktop-app
```

Expected: delete succeeds and neither command lists the obsolete branch.

### Task 4: Synchronize corrected governance to remaining worktrees

**Files:**
- Worktree: `C:\scp-survivor-v2`
- Worktree: `C:\scp-survivor-ui-art`
- Worktree: `C:\scp-survivor-ui-foundation`

**Interfaces:**
- Consumes: corrected `main`.
- Produces: every active worktree automatically reads the corrected App role.

- [ ] **Step 1: Fast-forward and push `dev/v2`**

```powershell
git -C C:\scp-survivor-v2 status --short --branch
git -C C:\scp-survivor-v2 merge --ff-only main
npm.cmd --prefix C:\scp-survivor-v2 run build
git -C C:\scp-survivor-v2 push origin dev/v2
```

Expected: clean fast-forward, successful build, successful push.

- [ ] **Step 2: Fast-forward and push `feature/ui-art-overhaul`**

```powershell
git -C C:\scp-survivor-ui-art status --short --branch
git -C C:\scp-survivor-ui-art merge --ff-only main
npm.cmd --prefix C:\scp-survivor-ui-art run build
git -C C:\scp-survivor-ui-art push origin feature/ui-art-overhaul
```

Expected: clean fast-forward, successful build, successful push.

- [ ] **Step 3: Fast-forward frozen UI Foundation locally**

```powershell
git -C C:\scp-survivor-ui-foundation status --short --branch
git -C C:\scp-survivor-ui-foundation merge --ff-only main
```

Expected: clean fast-forward; no remote branch is created.

### Task 5: Final migration audit

**Files:**
- Verify: all worktrees and branch refs.

**Interfaces:**
- Consumes: completed tasks 1-4.
- Produces: evidence that the old identity is gone and all active branches use the new governance.

- [ ] **Step 1: Verify worktree and remote topology**

Run:

```powershell
git fetch origin --prune
git worktree list --porcelain
git branch --all --verbose --no-abbrev
```

Expected:

- `C:\scp-survivor-app` is on `dev/app-platform`;
- no local or remote `release/desktop-app` remains;
- `origin/dev/app-platform` exists;
- main, App, gameplay, and UI/art remote branches point at the corrected governance commit.

- [ ] **Step 2: Verify all worktrees are clean**

```powershell
git status --short --branch
git -C C:\scp-survivor-app status --short --branch
git -C C:\scp-survivor-v2 status --short --branch
git -C C:\scp-survivor-ui-art status --short --branch
git -C C:\scp-survivor-ui-foundation status --short --branch
```

Expected: every worktree is clean; all remote-tracking branches are synchronized.

- [ ] **Step 3: Verify active governance has no stale desktop-only identity**

```powershell
$active = @('AGENTS.md') + (Get-ChildItem docs/agents/*.md | ForEach-Object FullName)
$stale = Select-String -Path $active -Pattern 'release/desktop-app|release-desktop-app|Desktop Guide|Desktop-only' -CaseSensitive:$false
if ($stale) { throw "Stale desktop-only governance found: $stale" }
git diff --check
```

Expected: command exits successfully with no output.

- [ ] **Step 4: Report migration**

Report the design, plan, and governance commits; the branch rename; old remote
deletion; build/push results; final worktree paths and branches; and any platform
targets not yet implemented. Do not claim that desktop, mobile, or PWA clients
exist merely because the governance now authorizes them.
