# Agent Governance Design

Date: 2026-07-10
Status: Approved for implementation planning

## 1. Purpose

The project is developed concurrently by several AI agents working in separate
Git branches and worktrees. This governance layer gives every agent a shared set
of safety rules plus a branch-specific responsibility guide. Its goals are to:

- keep gameplay, UI/art, App-platform, and integration work separated;
- prevent agents from editing another worktree or silently overwriting work;
- identify shared, high-conflict files before they are changed;
- require evidence-based build and smoke-test reports;
- reserve merge, push, deletion, history rewrite, and release decisions for the
  Project Lead unless explicitly delegated.

## 2. Chosen Structure

The repository will track one authoritative rule file and a set of focused branch
guides:

```text
AGENTS.md
CLAUDE.md
docs/agents/main.md
docs/agents/dev-v2.md
docs/agents/dev-app-platform.md
docs/agents/refactor-ui-foundation.md
docs/agents/feature-ui-art-overhaul.md
```

`AGENTS.md` is the authoritative project-wide policy. `CLAUDE.md` is a small
Claude Code entry point that requires Claude to read `AGENTS.md` and then select
the correct branch guide. Policy is not duplicated between these two files, which
avoids drift.

Each branch guide contains only the scope, ownership, prohibited changes,
shared-file gates, required verification, and handoff format for that branch.

## 3. Agent Startup Flow

Before analysis or modification, every development agent must:

1. Confirm the current directory, branch, worktree, HEAD, and Git status.
2. Read the repository-root `AGENTS.md`.
3. Select and read the guide mapped to the current branch.
4. Stop and report if the branch has no guide, the worktree is unexpectedly
   dirty, or the checked-out branch does not match the assigned role.
5. Work only inside the current worktree and authorized responsibility area.

An unknown branch defaults to read-only mode. It may inspect and report but may
not modify files until the Project Lead assigns a guide or explicitly approves a
scope.

## 4. Branch Responsibilities

### `main`

Purpose: protected integration baseline.

Allowed work:

- read-only project review and architecture analysis;
- integration verification;
- governance, roadmap, architecture, and release documentation;
- explicitly approved merges and release preparation.

Feature implementation is not performed directly on `main`. A feature or bug
fix should normally be assigned to its owning branch first.

### `dev/v2`

Owner: gameplay/core Agent.

Primary scope:

- gameplay loop and runtime state;
- SCP entities, bosses, enemies, weapons, events, stages, and level progression;
- balance data and gameplay configuration;
- combat, spawning, timeline, progression, and gameplay systems.

It must not redesign UI/art, replace asset pipelines, own client containers or
App-platform release infrastructure unless the Project Lead explicitly approves
a shared-file change.

### `dev/app-platform`

Owner: App Platform Agent.

Primary scope:

- desktop clients and native desktop containers;
- mobile clients and mobile wrappers;
- installable web/PWA behavior;
- launchers and future platform-specific client shells;
- platform startup, lifecycle, filesystem, permissions, security, and offline operation;
- installation, updates, signing, stores, packaging, release automation, and distribution.

It must not change gameplay rules, balance, enemy AI, weapon behavior, or UI/art
visual direction. Changes to web entry points, dependency manifests, preload/asset
contracts, manager interfaces, or persistence schemas require shared-file approval.

### `refactor/ui-foundation`

Purpose: completed Phase 1 foundation, retained temporarily for audit and fixes.

The branch is frozen after its approved merge. Only explicitly requested defect
fixes or documentation corrections are permitted. New UI/art implementation must
move to `feature/ui-art-overhaul`.

### `feature/ui-art-overhaul`

Owner: UI/art Agent.

Primary scope:

- HUD, menus, overlays, layout, theme, and presentation;
- textures, spritesheets, atlases, animations, VFX, and art assets;
- audio assets and presentation-layer audio integration;
- gradual migration to the asset, UI, and audio foundation interfaces.

It must not change gameplay balance, AI, weapon mechanics, timeline rules, win or
loss conditions, or meta-progression behavior. Required gameplay hooks must be
requested as interface changes rather than implemented as hidden behavior edits.

## 5. Shared-File Gate

The following are high-conflict or cross-domain files and interfaces:

- `src/main.js`;
- `package.json` and `package-lock.json`;
- `index.html` and build configuration;
- asset manifests and preload flow;
- `AudioManager` and `UIManager` public interfaces;
- shared configuration and persistence schemas;
- project-wide README, changelog, roadmap, and architecture documentation.

These files are not absolutely immutable. Before modifying one, an agent must
report:

- why the change is necessary;
- which branch owns the requirement;
- the exact files and public contracts affected;
- expected impact on the other active branches;
- build and smoke-test coverage.

The Project Lead decides which agent performs the change and the safe merge order.

## 6. Universal Safety Rules

Unless explicitly authorized, agents must not:

- edit another worktree;
- overwrite, discard, reset, stash, move, or delete existing user/agent changes;
- merge branches, push commits, delete branches/worktrees, rewrite history, or
  publish a release;
- expand the assigned feature scope into another agent's domain;
- treat a successful build as proof of gameplay correctness;
- claim a test passed without providing fresh command or smoke-test evidence.

If a worktree is dirty, a remote branch changed unexpectedly, or a merge is not
fast-forward when it was expected to be, the agent stops and reports instead of
resolving the situation autonomously.

## 7. Verification Requirements

### Gameplay/core

- production build;
- targeted smoke tests for changed gameplay;
- restart, pause, victory/defeat, or persistence checks when affected;
- diff and Git status report.

### UI/art

- production build;
- title, weapon selection, combat HUD, pause, overlays, and restart checks when
  affected;
- missing/duplicate asset-key and console warning checks;
- representative viewport and input-hit-area checks.

### App platform

- web production build;
- startup and package checks for each platform affected by the change;
- relevant offline, permission, path, security, audio, update, signing, and store checks;
- explicit reporting of platforms that were not tested.

### UI foundation fixes

- production build;
- at least two runs separated by `scene.restart()` when lifecycle code changes;
- texture fallback, audio manager, UI manager, timer, and listener checks relevant
  to the fix.

### Main integration

- confirm source branch review approval;
- verify expected ancestry and merge method;
- run the required integration build and smoke tests;
- confirm the final worktree is clean before any authorized push.

## 8. Handoff Report

Every implementation handoff must include:

- branch and worktree;
- commit hashes and purpose;
- files changed;
- behavior and contracts changed;
- build/test commands and their actual results;
- known limitations and follow-ups;
- final `git status`;
- requested next action, without performing an unauthorized merge or push.

## 9. Error Handling and Escalation

Agents stop and escalate to the Project Lead when:

- requirements cross responsibility boundaries;
- a shared file must change without prior approval;
- expected branch ancestry differs from reality;
- remote state changes during integration;
- tests expose an unrelated regression;
- credentials, signing, publishing, deletion, or other irreversible actions are
  required;
- design intent cannot be determined from the repository and approved plans.

## 10. Acceptance Criteria

The implementation is complete when:

- both Codex-style and Claude-style agents automatically encounter an entry file;
- branch routing is unambiguous;
- every current project branch has a focused guide;
- unknown branches default to read-only behavior;
- file ownership and shared-file gates are explicit;
- merge/push/release authority is explicit;
- each guide contains proportionate verification and handoff requirements;
- the documents do not contain contradictory or duplicated policy sources;
- all files are tracked in Git and can be synchronized from `main` to future
  worktrees.
