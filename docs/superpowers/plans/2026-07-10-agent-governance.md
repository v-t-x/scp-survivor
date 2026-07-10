# Agent Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tracked, automatically discoverable project-wide agent rules and focused guides for every active development branch.

**Architecture:** `AGENTS.md` is the single authoritative policy source. `CLAUDE.md` is a minimal Claude Code entry point that redirects to the authoritative rules. Five branch guides under `docs/agents/` define role-specific scope, prohibited work, shared-file gates, verification, and handoff requirements without duplicating the universal policy.

**Tech Stack:** Markdown, Git, PowerShell validation, existing Git worktrees.

## Global Constraints

- Do not modify gameplay, UI, audio, asset, desktop packaging, or persistence code.
- Do not edit another worktree while implementing these files.
- Do not merge, push, delete branches/worktrees, rewrite history, or publish a release.
- `AGENTS.md` is the only authoritative policy source; `CLAUDE.md` must not duplicate it.
- Unknown branches default to read-only inspection and reporting.
- Every current branch must map to exactly one focused guide.
- Shared-file changes require Project Lead approval before implementation.
- All new governance files must be tracked in Git and pass `git diff --check`.

---

## File Map

- Create `AGENTS.md`: authoritative universal policy and branch-routing table.
- Create `CLAUDE.md`: Claude Code bootstrap pointing to `AGENTS.md`.
- Create `docs/agents/main.md`: protected integration branch guide.
- Create `docs/agents/dev-v2.md`: gameplay/core branch guide.
- Create `docs/agents/release-desktop-app.md`: desktop packaging branch guide.
- Create `docs/agents/refactor-ui-foundation.md`: frozen foundation branch guide.
- Create `docs/agents/feature-ui-art-overhaul.md`: UI/art branch guide.

### Task 1: Add universal entry files

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: current Git branch name from `git branch --show-current`.
- Produces: authoritative project policy and a deterministic mapping from branch name to guide path.

- [ ] **Step 1: Verify entry files do not already exist**

Run:

```powershell
if (Test-Path AGENTS.md) { throw "AGENTS.md already exists" }
if (Test-Path CLAUDE.md) { throw "CLAUDE.md already exists" }
```

Expected: command exits successfully with no output.

- [ ] **Step 2: Create `AGENTS.md` with the universal policy**

Create the file with these exact sections and requirements:

```markdown
# SCP Survivor Agent Governance

## Authority

This file is the authoritative collaboration policy for every AI agent working
in this repository. Direct user instructions override this file. Branch guides
may narrow scope but may not weaken these rules.

## Mandatory startup

Before analysis or modification:

1. Run `Get-Location`, `git branch --show-current`, `git status --short --branch`,
   and `git worktree list`.
2. Confirm the current worktree matches the assigned branch.
3. Read the guide selected by the branch-routing table below.
4. If the branch is unknown or the worktree is unexpectedly dirty, stop
   modification and report the condition.

## Branch routing

| Branch | Required guide |
|---|---|
| `main` | `docs/agents/main.md` |
| `dev/v2` | `docs/agents/dev-v2.md` |
| `release/desktop-app` | `docs/agents/release-desktop-app.md` |
| `refactor/ui-foundation` | `docs/agents/refactor-ui-foundation.md` |
| `feature/ui-art-overhaul` | `docs/agents/feature-ui-art-overhaul.md` |

Any unlisted branch defaults to read-only inspection. Do not modify it until the
Project Lead assigns a scope or explicitly authorizes the work.

## Universal safety rules

- Work only inside the current worktree. Never edit another worktree.
- Preserve existing user and agent changes. Do not reset, discard, overwrite,
  stash, move, or delete them without explicit authorization.
- Stay inside the current branch guide's responsibility area.
- Before changing a shared file, report the reason, affected contract, impacted
  branches, and required verification, then wait for Project Lead approval.
- Do not merge, push, delete branches/worktrees, rewrite history, create releases,
  or publish artifacts unless the Project Lead explicitly authorizes that exact
  action.
- Do not claim success from inspection alone. Provide fresh build, test, smoke,
  diff, and Git-status evidence proportionate to the change.
- A successful build proves compilation only, not gameplay correctness.

## Shared-file gate

Treat these as cross-domain, high-conflict files or interfaces:

- `src/main.js`
- `package.json` and `package-lock.json`
- `index.html` and build configuration
- asset manifests and the preload flow
- `AudioManager` and `UIManager` public interfaces
- shared configuration and persistence schemas
- README, changelog, roadmap, architecture, and governance documents

These files are not permanently forbidden, but modifying them requires prior
Project Lead approval.

## Required handoff

Every implementation report must include:

- branch, worktree, and final HEAD;
- commit hashes and purpose;
- files and public contracts changed;
- exact verification commands and actual results;
- limitations, risks, and follow-ups;
- final `git status`;
- requested next action without performing an unauthorized merge or push.

## Escalation

Stop and report when scope crosses branches, a shared file needs an unapproved
change, remote ancestry differs from expectations, the worktree is unexpectedly
dirty, tests expose an unrelated regression, or credentials/irreversible actions
are required.
```

- [ ] **Step 3: Create the Claude Code entry point**

Create `CLAUDE.md` with this exact content:

```markdown
# Claude Code Entry Point

Before any analysis, plan, command, or edit:

1. Read `AGENTS.md` in full. It is the authoritative project policy.
2. Determine the current branch and read the branch guide selected by the routing
   table in `AGENTS.md`.
3. Follow both documents. If they conflict, `AGENTS.md` wins unless the user gives
   a newer direct instruction.

Do not infer permission to merge, push, delete, rewrite history, publish, or edit
another worktree. These actions require explicit Project Lead authorization.
```

- [ ] **Step 4: Validate universal entry files**

Run:

```powershell
$agents = Get-Content -Raw -Encoding UTF8 AGENTS.md
$claude = Get-Content -Raw -Encoding UTF8 CLAUDE.md
foreach ($branch in @('main','dev/v2','release/desktop-app','refactor/ui-foundation','feature/ui-art-overhaul')) {
  if (-not $agents.Contains($branch)) { throw "Missing branch route: $branch" }
}
if (-not $claude.Contains('AGENTS.md')) { throw 'CLAUDE.md does not route to AGENTS.md' }
```

Expected: command exits successfully with no output.

- [ ] **Step 5: Commit universal entry files**

```powershell
git add AGENTS.md CLAUDE.md
git commit -m "docs: add repository agent governance"
```

Expected: one commit containing exactly `AGENTS.md` and `CLAUDE.md`.

### Task 2: Add focused branch guides

**Files:**
- Create: `docs/agents/main.md`
- Create: `docs/agents/dev-v2.md`
- Create: `docs/agents/release-desktop-app.md`
- Create: `docs/agents/refactor-ui-foundation.md`
- Create: `docs/agents/feature-ui-art-overhaul.md`

**Interfaces:**
- Consumes: universal policy and routing table from `AGENTS.md`.
- Produces: branch-specific authorization boundaries and verification gates.

- [ ] **Step 1: Create the protected-main guide**

`docs/agents/main.md` must state:

```markdown
# `main` Integration Guide

## Purpose

`main` is the protected integration baseline. Default work is read-only review,
architecture analysis, governance/roadmap documentation, integration verification,
and explicitly authorized release preparation.

## Allowed

- Review branches, commits, diffs, tests, architecture, and merge risk.
- Maintain governance, roadmap, architecture, and release documentation.
- Perform an explicitly authorized merge, synchronization, push, or release step.

## Not allowed by default

- Implement gameplay, UI/art, audio/assets, or desktop features directly.
- Fix a feature defect that belongs to an active owning branch.
- Merge or push merely because a branch appears ready.

## Integration gate

Confirm source review approval, clean worktrees, expected ancestry, approved merge
method, fresh build/smoke evidence, and final clean status. Stop if remote state or
ancestry changed.
```

- [ ] **Step 2: Create the gameplay guide**

`docs/agents/dev-v2.md` must state:

```markdown
# `dev/v2` Gameplay/Core Guide

## Owns

- Gameplay loop and runtime state.
- SCP entities, bosses, enemies, weapons, events, stages, and level progression.
- Combat, spawning, timeline, progression, balance, and gameplay configuration.

## Does not own

- UI/art redesign, final textures, animation/VFX presentation, or audio assets.
- Asset-loading architecture and manager-interface redesign.
- Desktop packaging, installers, signing, or release automation.

## Shared-file rule

Changes to `src/main.js`, manifests, UI/audio managers, persistence schemas,
dependency manifests, entry points, or project-wide docs require Project Lead
approval before editing.

## Verification

Run the production build plus targeted gameplay smoke tests. Include restart,
pause, victory/defeat, or persistence checks whenever the changed system touches
those paths. Report actual results and final Git status.
```

- [ ] **Step 3: Create the desktop guide**

`docs/agents/release-desktop-app.md` must state:

```markdown
# `release/desktop-app` Desktop Guide

## Owns

- Desktop runtime and packaging.
- Installers, platform metadata, build/release automation, and distribution.
- Desktop-only filesystem, security, startup, offline, and platform integration.

## Does not own

- Gameplay rules, balance, AI, weapons, timeline, win/loss, or meta progression.
- UI/art design or gameplay-facing visual changes.

## Shared-file rule

Before editing `package.json`, lockfiles, `index.html`, build configuration, web
entry points, preload/asset paths, or shared docs, report the exact desktop need
and cross-branch impact and obtain Project Lead approval.

## Verification

Run the web production build, desktop startup, and an appropriate package or
installer dry run. When relevant, verify offline assets, CSP/security, filesystem
paths, audio, and clean uninstall/upgrade behavior. Report final Git status.
```

- [ ] **Step 4: Create the frozen-foundation guide**

`docs/agents/refactor-ui-foundation.md` must state:

```markdown
# `refactor/ui-foundation` Maintenance Guide

## Status

Phase 1 is complete and approved. This branch is frozen for audit and narrowly
approved defect fixes. New UI/art implementation belongs on
`feature/ui-art-overhaul`.

## Allowed

- Read-only audit and historical comparison.
- Explicitly requested lifecycle, fallback, manager, or documentation fixes.

## Not allowed

- New visual design, art/audio content, gameplay features, or desktop packaging.
- Unrequested refactoring of the established foundation interfaces.

## Verification

For lifecycle changes, run the production build and at least two game runs
separated by `scene.restart()`. Check texture fallback, duplicate keys, managers,
timers, listeners, console output, and final Git status as relevant.
```

- [ ] **Step 5: Create the UI/art guide**

`docs/agents/feature-ui-art-overhaul.md` must state:

```markdown
# `feature/ui-art-overhaul` UI/Art Guide

## Owns

- HUD, menus, overlays, layout, theme, accessibility, and presentation.
- Textures, spritesheets, atlases, animation, VFX, and art assets.
- Audio assets and presentation-layer audio integration.
- Gradual migration to approved asset, UI, and audio foundation interfaces.

## Does not own

- Gameplay balance, enemy AI, weapon mechanics, timeline rules, win/loss, or
  meta-progression behavior.
- Desktop packaging and release automation.

## Interface rule

Request missing gameplay hooks as explicit interface changes. Do not hide gameplay
behavior changes inside rendering, UI, asset, or audio commits. Shared foundation
interfaces require Project Lead approval before editing.

## Verification

Run the production build and inspect title, weapon selection, combat HUD, pause,
overlays, and restart paths affected by the change. Check representative viewport
sizes, pointer hit areas, missing/duplicate asset keys, console output, fallback
behavior, and final Git status.
```

- [ ] **Step 6: Validate branch guides against the routing table**

Run:

```powershell
$required = @(
  'docs/agents/main.md',
  'docs/agents/dev-v2.md',
  'docs/agents/release-desktop-app.md',
  'docs/agents/refactor-ui-foundation.md',
  'docs/agents/feature-ui-art-overhaul.md'
)
$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing) { throw "Missing guides: $($missing -join ', ')" }
$routes = Get-Content -Raw -Encoding UTF8 AGENTS.md
foreach ($path in $required) {
  if (-not $routes.Contains($path)) { throw "Guide is not routed: $path" }
}
```

Expected: command exits successfully with no output.

- [ ] **Step 7: Commit branch guides**

```powershell
git add docs/agents
git commit -m "docs: add branch-specific agent guides"
```

Expected: one commit containing exactly the five branch guides.

### Task 3: Run governance acceptance checks

**Files:**
- Verify: `AGENTS.md`
- Verify: `CLAUDE.md`
- Verify: `docs/agents/*.md`
- Verify: `docs/superpowers/specs/2026-07-10-agent-governance-design.md`

**Interfaces:**
- Consumes: all governance files created by Tasks 1 and 2.
- Produces: evidence that branch routing, policy authority, scope boundaries, and repository cleanliness meet the design acceptance criteria.

- [ ] **Step 1: Verify all expected files are tracked**

Run:

```powershell
$expected = @(
  'AGENTS.md',
  'CLAUDE.md',
  'docs/agents/main.md',
  'docs/agents/dev-v2.md',
  'docs/agents/release-desktop-app.md',
  'docs/agents/refactor-ui-foundation.md',
  'docs/agents/feature-ui-art-overhaul.md'
)
$tracked = git ls-files
foreach ($path in $expected) {
  if ($tracked -notcontains $path) { throw "Not tracked: $path" }
}
```

Expected: command exits successfully with no output.

- [ ] **Step 2: Scan for placeholders and contradictory authority**

Run:

```powershell
$files = @('AGENTS.md','CLAUDE.md') + (Get-ChildItem docs/agents/*.md | ForEach-Object FullName)
$bad = Select-String -Path $files -Pattern 'TBD|TODO|PLACEHOLDER|待定|待补' -CaseSensitive:$false
if ($bad) { throw "Placeholder text found: $bad" }
$claude = Get-Content -Raw -Encoding UTF8 CLAUDE.md
if (-not $claude.Contains('AGENTS.md')) { throw 'Claude authority redirect missing' }
```

Expected: command exits successfully with no output.

- [ ] **Step 3: Run Git formatting and scope checks**

Run:

```powershell
git diff --check HEAD~2..HEAD
git show --stat --oneline HEAD~2..HEAD
git status --short --branch
```

Expected:

- `git diff --check` has no output;
- the two implementation commits contain only governance Markdown files;
- status shows `main` with no modified or untracked files.

- [ ] **Step 4: Report completion without merging or pushing**

Report the design commit, two implementation commits, files created, validation
commands and results, final HEAD, and Git status. Do not push or synchronize the
other worktrees until the Project Lead separately approves that action.
