# UI/Art Phase 1 Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans only after the Project Lead approves the resulting proposal. This plan's first wave produces a presentation proposal and no asset or UI implementation.

**Goal:** Produce a concrete, licensed, fallback-safe proposal for the first UI/Art vertical slice: theme, title, weapon selection, and combat HUD.

**Architecture:** Keep gameplay semantics in `src/scene/` and presentation ownership in `src/ui/`, presentation portions of `hud.js` and `menus.js`, and approved asset directories. The proposal must consume the existing `PreloadScene`, manifest, fallback texture, `AudioManager`, and `UIManager` contracts instead of replacing them during the planning wave.

**Tech Stack:** Phaser 3.90, Vite 7, JavaScript ES Modules, existing UI theme tokens, asset manifest, procedural fallback factory, Web Audio foundation, and Markdown provenance records.

## Global Constraints

- Planning wave only: do not edit `src/`, import assets, or change runtime behavior.
- Do not change damage, health, spawning, AI, timeline, upgrade probability, victory, defeat, or meta-progression.
- Preserve existing texture keys, fallback behavior, `this.playSound()` compatibility, and localStorage semantics.
- External assets require author/source, original URL, license, modification status, commercial-use status, and required attribution before implementation.
- Do not edit `src/main.js`, gameplay configuration, persistence, `AudioManager`, `UIManager`, or Preload contracts without a separately listed Project Lead gate.
- End with a clean worktree, exact verification output, and a small proposal-only commit.

---

### Task 1: Inventory current presentation and resource contracts

**Files:**
- Read: `src/ui/theme.js`
- Read: `src/ui/UIManager.js`
- Read: `src/assets/manifest.js`
- Read: `src/assets/fallbackTextureFactory.js`
- Read: `src/scenes/PreloadScene.js`
- Read: `src/scene/hud.js`
- Read: `src/scene/menus.js`
- Read: `src/scene/effects.js`
- Read: `src/audio/AudioManager.js`
- Read: `docs/art-and-asset-direction.md`
- Read: `docs/licensing-and-commercialization.md`
- Create: `docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`

**Interfaces:**
- Consumes: current UI object ownership, texture keys, manifest arrays, fallback generation, manager facade, and audio calls.
- Produces: a fact-based inventory and a list of safe presentation seams.

- [ ] **Step 1: Confirm branch and clean state**

Run:

```powershell
Get-Location
git branch --show-current
git status --short --branch
git rev-parse HEAD
```

Expected: the assigned `feature/ui-art-overhaul` worktree is clean and based on `e9662e0` or a later Project Lead-approved commit.

- [ ] **Step 2: Trace title, selection, HUD, and overlay ownership**

Run:

```powershell
rg -n "createStartScreen|createWeaponSelection|createUI|updateUI|pause|levelUp|showVictory|showGameOver|setGameplayHudVisible|theme|UIManager" src/ui src/scene src/main.js
```

Record which objects are created, destroyed, pinned to the camera, and made interactive. Identify any current shared-file dependency.

- [ ] **Step 3: Trace asset and audio loading**

Run:

```powershell
rg -n "IMAGE_ASSETS|SPRITESHEET_ASSETS|ATLAS_ASSETS|AUDIO_ASSETS|textures\.exists|generateTexture|AudioManager|playSound" src/assets src/scenes src/audio src/scene src/main.js
```

Record current key names, fallback behavior, duplicate-key protections, first-interaction audio behavior, and destruction behavior.

### Task 2: Design the first visual slice

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`

**Interfaces:**
- Consumes: Task 1 inventory and the approved art direction.
- Produces: a theme proposal and screen-by-screen scope with explicit gameplay boundaries.

- [ ] **Step 1: Define visual language**

Specify palette tokens, typography roles, spacing scale, panel/card states, alert states, focus/hover/disabled states, contrast expectations, and fallback appearance. Every token must have a name, value or range, and usage location.

- [ ] **Step 2: Define screen scope**

For title, weapon selection, and combat HUD, specify layout hierarchy, text/data consumed, object ownership, interaction behavior, responsive constraints, and exit/destroy behavior. Explicitly list what remains unchanged in gameplay.

- [ ] **Step 3: Define asset migration order**

Classify each proposed asset as procedural, original, external, or generated. For external assets, include a provenance row with source URL, license, modifications, commercial-use status, attribution, and redistribution constraints. Do not accept “to be sourced” as an asset record.

- [ ] **Step 4: Define manifest and fallback contract**

For every proposed key, specify the key string, asset type, loader entry, fallback generator, expected dimensions, and duplicate-key check. Keep all current keys backward compatible or provide a reviewed migration table.

### Task 3: Define implementation boundaries and verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`

**Interfaces:**
- Consumes: visual slice and asset contract.
- Produces: exact file list, shared-file requests, verification matrix, and rollback plan.

- [ ] **Step 1: Name exact files and ownership**

Separate files into `UI/Art-owned`, `Project Lead approval required`, and `Gameplay-owned`. For every shared file, state the smallest requested change and affected branches.

- [ ] **Step 2: Define verification**

Include commands and manual checks for:

```powershell
npm run build
git diff --check
```

and title, weapon selection, HUD, upgrade, pause, victory, defeat, restart, representative viewport sizes, pointer-hit alignment, missing assets, duplicate keys, first-interaction audio, console output, and clean worktree.

- [ ] **Step 3: Review scope and commit**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat
```

Expected: only the proposal file is changed. Commit:

```powershell
git add docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md
git commit -m "docs: propose UI art phase one slice"
```

Report the commit hash and wait for Project Lead approval. Do not import assets or implement UI in the same turn.
