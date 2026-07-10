# Three-Agent Next-Phase Coordination Design

## Status and authority

- Approved by the project owner on 2026-07-10.
- Maintained by the Project Lead.
- Applies to `dev/v2`, `feature/ui-art-overhaul`, and `dev/app-platform`.
- Baseline at approval: commit `e9662e0` on all three branches and `main`.
- This document authorizes planning work only. Implementation begins only after the Project Lead approves the relevant branch plan.

## Objective

Start the next three workstreams without allowing gameplay, presentation, and platform work to collide in shared files. The first wave produces reviewable plans. After plan approval, implementation may proceed in isolated ownership areas and is integrated in a controlled order.

The selected coordination model is:

> Parallel planning, gated implementation, sequential integration.

This preserves momentum across all three workstreams while ensuring that gameplay contracts settle before presentation integration and that client packaging validates the final combined build.

## Alternatives considered

### Gameplay-first, fully sequential

Finish v2 before starting UI/Art and App Platform. This minimizes simultaneous change but leaves two agents idle and delays early discovery of asset and packaging constraints.

### UI-first vertical slice

Finish presentation before gameplay. This gives an early visual result but risks repeated UI and asset rework when v2 changes Boss states, HUD signals, or runtime hooks.

### Selected: parallel planning with gated implementation

All three agents prepare plans at the same time. The Project Lead reviews scope, contracts, shared files, tests, and merge risk before authorizing implementation. Gameplay and UI/Art may then work concurrently only where their file ownership does not overlap. App Platform may validate architecture independently, but final packaging integration remains last.

## Wave 1: planning assignments

### Gameplay/Core — `dev/v2`

#### Planning objective

Design a rule-driven SCP-049 Boss milestone that makes the existing finale recognizably SCP-specific rather than only increasing health, damage, projectiles, or enemy count.

The proposal must preserve the six-minute run and current victory condition unless it explicitly requests a separately reviewed product change. It should build on the existing SCP-049 implementation instead of introducing a large new SCP roster, multiple maps, containment-node systems, regional power management, or evacuation.

#### Required deliverables

- Current-state analysis of the SCP-049 implementation.
- Player-facing rule, how it is signaled, how the player learns it, and the decisions it creates.
- Boss state machine, transitions, failure cases, and interaction with summoned enemies.
- Impact on all three weapons, including fairness and accessibility.
- Required gameplay data and presentation hooks.
- Exact proposed files and contracts to change.
- Restart, pause, victory, defeat, Debug skip, and persistence considerations.
- Targeted automated checks where practical and a browser smoke-test checklist.
- Scope exclusions and rollback strategy.

#### Planning constraints

- No implementation during Wave 1.
- No UI redesign, final art, animation assets, audio assets, client packaging, or dependency changes.
- No manifest, Preload, `AudioManager`, or `UIManager` interface changes without an explicit contract request.
- Avoid `src/main.js`; if it is genuinely required, identify the smallest change and wait for Project Lead approval.
- Do not modify localStorage keys or existing saved-data semantics.

### UI/Art — `feature/ui-art-overhaul`

#### Planning objective

Design the first presentation vertical slice covering the visual theme, title flow, weapon selection, and combat HUD. The plan must use the established Preload/manifest/fallback foundation and keep the game playable when formal assets are missing.

#### Required deliverables

- Current UI and asset inventory, including reusable procedural elements.
- Visual language proposal for a Foundation facility: palette, typography, spacing, hierarchy, states, and accessibility considerations.
- Screen-by-screen scope for title, weapon selection, and combat HUD.
- Asset list classified as original, generated, external, or procedural fallback.
- Manifest keys, loading behavior, fallback expectations, and duplicate-key safeguards.
- Asset provenance table fields and licensing checks for every external source.
- Exact proposed files and interfaces to change.
- Representative viewport, pointer-hit-area, missing-asset, restart, pause, and console smoke tests.
- Scope exclusions and rollback strategy.

#### Planning constraints

- No implementation or asset import during Wave 1.
- No damage, health, spawn, AI, upgrade probability, timeline, victory, defeat, or meta-progression changes.
- No hidden gameplay behavior inside presentation code.
- Existing texture keys and fallback behavior remain compatible unless a separately reviewed migration is proposed.
- `src/main.js`, gameplay configuration, persistence, and foundation interfaces require explicit Project Lead approval.

### App Platform — `dev/app-platform`

#### Planning objective

Design a Windows-first client proof of concept while defining a platform strategy that can later accommodate desktop, mobile, PWA, launchers, and other client containers without pretending that one wrapper must serve every platform.

#### Required deliverables

- Current web-build and runtime assumption audit.
- Comparison of Electron, Tauri, and a PWA/Capacitor-oriented route against project needs.
- Recommended Windows proof-of-concept stack with reasons and rejected alternatives.
- Proposed directory boundary for platform code.
- Startup, local asset path, audio interaction, window, persistence, offline, security, and lifecycle behavior.
- Build, installer, signing, update, store, and distribution boundaries, clearly separating proof-of-concept work from release work.
- Cross-client capability matrix for desktop, mobile, PWA, and launcher responsibilities.
- Exact proposed files, dependencies, commands, and CI impact.
- Web-regression, packaged-startup, offline, path, audio, persistence, and clean-install test plan.
- Scope exclusions and rollback strategy.

#### Planning constraints

- No implementation during Wave 1.
- Do not change `package.json`, `package-lock.json`, `index.html`, Vite configuration, CI, or game source before plan approval.
- Do not change gameplay semantics, UI direction, asset content, or persistence format.
- Code signing, store submission, public release, automatic update deployment, and paid services remain separately authorized actions.

## Shared-file gate

The following remain Project Lead controlled:

- `src/main.js`;
- `package.json` and `package-lock.json`;
- `index.html`, Vite configuration, and CI workflows;
- `src/assets/manifest.js`, Preload flow, and texture-key contracts;
- `AudioManager` and `UIManager` public interfaces;
- gameplay-to-presentation event contracts;
- localStorage keys and schemas;
- README, changelog, architecture, roadmap, governance, and release documents.

A branch plan that needs one of these files must state:

1. why the change is necessary;
2. the smallest proposed contract;
3. which other branches are affected;
4. how backward compatibility is preserved;
5. how the change is verified and rolled back.

No agent receives ownership of a shared file merely by listing it in a plan.

## Plan review gate

The Project Lead reviews each Wave 1 plan for:

- alignment with the product vision;
- clear player or platform benefit;
- responsibility-boundary compliance;
- explicit file and interface scope;
- absence of unapproved long-term features;
- compatibility with restart, pause, fallback, localStorage, and the stable web build;
- credible verification and rollback;
- collision risk with the other two plans.

Possible review outcomes are approved, approved with required edits, or rejected for redesign. Implementation may start only after an approved outcome is recorded.

## Implementation ownership after plan approval

### Gameplay/Core preferred area

- `src/scene/enemies.js`
- `src/scene/combat.js`
- `src/scene/timeline.js`
- `src/config/balance.js`
- narrowly related gameplay modules explicitly named in the approved plan

Gameplay should expose minimal presentation data instead of constructing new art systems.

### UI/Art preferred area

- `src/ui/`
- presentation portions of `src/scene/hud.js` and `src/scene/menus.js`
- approved asset directories and provenance records
- manifest and Preload only if the approved plan passes the shared-file gate

UI/Art should consume gameplay state without changing its meaning.

### App Platform preferred area

- a new, approved platform-owned top-level directory or directories
- platform configuration and packaging files named in the approved plan
- dependency and CI changes only after the shared-file gate is approved

Platform code should treat the web game as a build artifact and stable runtime contract.

## Integration order

The default integration sequence is:

1. Review and approve all three plans.
2. Implement and review the v2 gameplay milestone.
3. Integrate v2 into `main` after gameplay verification.
4. Fast-forward or rebase UI/Art onto the updated `main`, resolve only presentation-contract changes, then review and integrate UI/Art.
5. Fast-forward or rebase App Platform onto the combined gameplay and UI baseline.
6. Run web and packaged-client verification, then integrate App Platform last.

App Platform may conduct isolated proof-of-concept work before steps 3–4 complete, but its final integration candidate must be rebuilt from the combined baseline.

## Merge method

- Prefer fast-forward when a branch remains a direct, reviewed descendant of `main`.
- Use a merge commit when preserving a substantial branch boundary materially improves auditability.
- Do not squash by default because the approved plans and review fixes should remain traceable.
- Never force-push or rewrite shared branch history without explicit authorization.

The Project Lead selects the final method after inspecting actual ancestry and commit quality.

## Required verification

### Every branch

- `git diff --check` against its approved base;
- production web build;
- clean final Git status;
- exact commit and file report;
- review of changes outside the approved file list.

### Gameplay/Core

- two consecutive runs separated by Scene restart;
- pause and resume during affected Boss states;
- victory, defeat, and Debug Boss skip;
- all three weapons against SCP-049;
- no localStorage regression.

### UI/Art

- title, weapon selection, HUD, upgrade, pause, victory, defeat, and restart;
- representative viewport and pointer alignment;
- formal asset present and missing fallback paths;
- no duplicate texture keys or console errors;
- asset provenance and license records complete.

### App Platform

- unchanged web build behavior;
- packaged startup and clean exit;
- local asset and route loading;
- first-interaction audio and persistence;
- offline behavior appropriate to the selected proof of concept;
- clean install and uninstall where an installer is in scope;
- platform security settings documented.

## Communication and handoff

Each Agent reports:

- branch, worktree, base commit, and final HEAD;
- plan or implementation commits with purpose;
- exact files and public contracts changed;
- commands run and actual results;
- untested paths, risks, and follow-ups;
- final Git status;
- requested Project Lead action without self-merging or self-pushing unless explicitly authorized.

Cross-branch questions are routed through the Project Lead. Agents do not negotiate shared ownership by directly changing each other's responsibility areas.

## Success criteria

This coordination milestone succeeds when:

- all three Wave 1 plans are delivered without implementation changes;
- each plan has bounded files, interfaces, tests, and exclusions;
- shared-file needs are identified before code is written;
- the Project Lead can approve, revise, or reject each plan independently;
- subsequent implementation can proceed without two agents editing the same responsibility area;
- the stable web version remains buildable throughout the sequence.
