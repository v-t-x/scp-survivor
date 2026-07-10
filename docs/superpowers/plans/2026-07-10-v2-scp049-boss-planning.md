# v2 SCP-049 Rule-Driven Boss Planning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans only after the Project Lead approves the resulting proposal. This plan's first wave produces a proposal and no gameplay code.

**Goal:** Produce a bounded, reviewable proposal for making the existing SCP-049 finale rule-driven and SCP-specific without changing the game during the planning wave.

**Architecture:** Treat the existing Boss fields and update methods as the current runtime boundary. The proposal must prefer a small state machine and explicit gameplay-to-presentation signals over a new scene or a broad combat rewrite. The implementation candidate must remain inside the Gameplay/Core ownership area and preserve the current six-minute flow, victory path, restart path, and localStorage schema.

**Tech Stack:** Phaser 3.90, Vite 7, JavaScript ES Modules, existing `PrototypeScene` mixins, `BALANCE` configuration, and the repository's Markdown planning records.

## Global Constraints

- Planning wave only: do not edit `src/` or implement gameplay.
- Keep the current six-minute run and SCP-049 victory condition unless the proposal labels a product change for separate approval.
- Do not add new SCP entities, multiple maps, containment-node systems, regional power management, or evacuation systems.
- Do not edit UI/art, asset, audio, client-platform, dependency, or persistence interfaces.
- `src/main.js`, `AudioManager`, `UIManager`, manifests, and shared docs require Project Lead approval for any later implementation change.
- Preserve existing texture keys, `this.playSound()` calls, pause/restart behavior, and `scp-survivor-meta` storage semantics.
- End with a clean worktree, exact verification output, and a small commit containing the proposal only.

---

### Task 1: Audit the current SCP-049 runtime

**Files:**
- Read: `src/scene/enemies.js`
- Read: `src/scene/combat.js`
- Read: `src/scene/timeline.js`
- Read: `src/scene/weapons.js`
- Read: `src/config/balance.js`
- Read: `src/main.js`
- Read: `docs/design.md`
- Create: `docs/superpowers/plans/2026-07-10-v2-scp049-boss-proposal.md`

**Interfaces:**
- Consumes: current `spawnScp049Boss()`, `updateBoss()`, `summonBossMinions()`, `handleBossDefeat()`, Boss balance entries, and weapon target-selection behavior.
- Produces: a fact table naming current Boss state, timers, damage paths, spawn paths, phase transitions, and presentation hooks.

- [ ] **Step 1: Confirm the branch and clean state**

Run:

```powershell
Get-Location
git branch --show-current
git status --short --branch
git rev-parse HEAD
```

Expected: the assigned `dev/v2` worktree is clean and based on `e9662e0` or a later Project Lead-approved commit.

- [ ] **Step 2: Trace the Boss lifecycle**

Run:

```powershell
rg -n "spawnScp049Boss|updateBoss|summonBossMinions|handleBossDefeat|bossPhaseActive|bossEnemy|scp049" src/scene src/config src/main.js
```

Record the exact methods, timers, fields, and balance keys in the proposal. Do not infer behavior that is not visible in the source.

- [ ] **Step 3: Trace weapon fairness and terminal paths**

Run:

```powershell
rg -n "bossPhaseActive|shotgunDamageMultiplier|prioritizeBoss|triggerVictory|triggerGameOver|scene\.restart|skipToBossPhase|pause" src/scene src/main.js
```

Record how pistol, breacher, and Tesla target or damage SCP-049, and how pause, Debug skip, victory, defeat, and restart interact with Boss state.

- [ ] **Step 4: Fill the current-state section**

The proposal must contain a table with these columns: `Current behavior`, `Source`, `Risk if changed`, and `Compatibility requirement`. Every row must cite an exact file and method.

### Task 2: Compare candidate SCP-specific rules

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-v2-scp049-boss-proposal.md`

**Interfaces:**
- Consumes: Task 1 fact table.
- Produces: three bounded mechanic options and one recommendation for Project Lead review.

- [ ] **Step 1: Define three candidate rules**

Each option must specify:

1. the player-observable rule;
2. the telegraph and feedback needed;
3. the player decision it creates;
4. the exact Boss state and timer data required;
5. interaction with summoned minions;
6. effects on each weapon;
7. accessibility and readability risks;
8. likely files to change;
9. a rollback path.

At least one option must reuse existing summon or movement behavior, and no option may require a new map, task system, or second Boss.

- [ ] **Step 2: Score the options**

Use a table scoring SCP identity, player decision quality, implementation scope, weapon fairness, UI dependency, restart safety, and testability from 1–5. Explain every score of 1 or 5.

- [ ] **Step 3: Recommend one option**

The recommendation must state why it best satisfies the four product-vision questions and what must be explicitly excluded from the first implementation. Mark any product decision that still needs Project Owner confirmation.

### Task 3: Define the implementation contract and verification

**Files:**
- Modify: `docs/superpowers/plans/2026-07-10-v2-scp049-boss-proposal.md`

**Interfaces:**
- Consumes: selected recommendation and current-state fact table.
- Produces: implementation file list, state-machine contract, test matrix, and risk register.

- [ ] **Step 1: Describe the proposed state machine**

Use a table with `State`, `Entry condition`, `Update rule`, `Exit condition`, `Player signal`, and `Cleanup`. Include normal Boss, any proposed telegraph or hazard state, enraged behavior, dying state, and scene shutdown/restart cleanup.

- [ ] **Step 2: Name exact public data and methods**

For every proposed field or method, provide its exact name, owning file, input/output shape, initialization point, update owner, and cleanup owner. Do not use vague labels such as “Boss manager” or “handle edge cases.”

- [ ] **Step 3: Define verification**

Include commands and expected observations for:

```powershell
npm run build
```

and browser smoke coverage of two consecutive runs, Debug Boss skip, pause/resume during every Boss state, all three weapons, victory, defeat, restart, and localStorage preservation. State which checks are manual because the repository has no browser automation harness.

- [ ] **Step 4: Review scope and commit**

Run:

```powershell
git diff --check
git status --short --branch
git diff --stat
```

Expected: only the proposal file is changed. Commit:

```powershell
git add docs/superpowers/plans/2026-07-10-v2-scp049-boss-proposal.md
git commit -m "docs: propose rule-driven SCP-049 boss"
```

Report the commit hash and wait for Project Lead approval. Do not implement the proposal in the same turn.
