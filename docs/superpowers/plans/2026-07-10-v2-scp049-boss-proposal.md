# SCP-049 Rule-Driven Boss Proposal

> **Status:** Planning-wave proposal only. No `src/` changes are made or authorized
> by this document. Implementation requires explicit Project Lead approval, after
> which `superpowers:executing-plans` applies.
>
> **Source plan:** `docs/superpowers/plans/2026-07-10-v2-scp049-boss-planning.md`
> **Branch / worktree:** `dev/v2` at `C:\scp-survivor-v2`
> **Baseline HEAD at audit:** `12e13d3` (later than the plan's `e9662e0` floor; clean worktree)
> **Authority:** `AGENTS.md`, `docs/agents/dev-v2.md`, `docs/product-vision.md`,
> `docs/design.md`, `docs/development-strategy.md`

### Revision history

- **Rev 1 (initial):** Option C recommended; replace-vs-layer of
  `enragedSummonMultiplier` left as an open product decision.
- **Rev 2 (this revision, post Project Lead review):** Direction approved for
  revision; still **not** approved to write `src/`. This revision resolves the six
  points the Project Lead requested:
  1. First implementation **replaces** `enragedSummonMultiplier` — no open
     replace/layer state remains (§2.3, §3.1, §3.2).
  2. Concrete initial values and rationale for every frenzy/exposed config key (§3.2.1).
  3. Explicit `summonBossMinions` frenzy call interface (§3.2.2).
  4. Explicit `exposedDamageMultiplier` × breacher-1.5× stacking rule and cap (§3.2.3).
  5. `handleBossDefeat()` sets `boss.bossState = "dying"`, plus frenzy-tint cleanup
     method and lifecycle (§3.2.4).
  6. Docs-only wave: no `src/` change, no push, no merge (§ handoff).

---

## Task 1 — Current SCP-049 runtime audit

All rows below cite behavior visible in the source at the audited HEAD. No behavior
is inferred beyond what the code shows.

### 1.1 Boss lifecycle map (methods, timers, fields, balance keys)

| Concern | Exact location | What the source does |
|---|---|---|
| State flags init | `src/main.js:67-68` | `this.bossPhaseActive = false; this.bossEnemy = null;` set in `create()` |
| Per-run reset | `src/scene/menus.js:709-711` (`startMissionWithWeapon`) | Resets `bossPhaseActive=false`, `bossEnemy=null`, `bossIntroTimer=null` at mission start |
| Update dispatch | `src/main.js:176-178` (`update`) | `if (this.bossPhaseActive) this.updateBoss();` — only runs while unpaused, mission active, not game over, not level-up |
| Boss phase entry | `src/scene/timeline.js:359-394` (`endSurvivalPhase`) | At 6:00 (`BALANCE.match.survivalDurationMs`): `stopRegularSpawning()`, clears decoys/projectiles/regular enemies, banner, then `bossIntroTimer = this.time.delayedCall(BALANCE.boss.scp049.introDelayMs, …)` → `spawnScp049Boss()`. `immediateBoss=true` skips the delay |
| Debug skip | `src/scene/weapons.js:560-570` (`skipToBossPhase`), bound at `src/scene/systems.js:55-59` (key `B`, `DEBUG_MODE` only) | Forces `elapsedSurvivalMs` to survival duration and calls `endSurvivalPhase(true)` |
| Boss spawn | `src/scene/enemies.js:691-744` (`spawnScp049Boss`) | Guard: returns if `bossEnemy?.active` or `isGameOver`. Creates `this.enemies.create(x, y, "enemy-scp049")` above the player. Sets `isBoss=true`, `isElite=false`, `isDying=false`, `enemyType="scp049"`, `behavior="chase"`, `moveSpeed/contactDamage/maxHealth/health` from config, `xpReward=0`, `setCircle(18)`, `setDepth(12)`, `setCollideWorldBounds(true)`, `body.setImmovable(true)`, `summonCooldownMs`, `nextSummonAtMs = elapsedSurvivalMs + summonInitialDelayMs`. Adds `boss.bossLabel` text (transient effect), sets `bossEnemy=boss`, `bossPhaseActive=true`, camera shake, `playSound("bossAppear")`, top banner |
| Boss update | `src/scene/enemies.js:747-774` (`updateBoss`) | Guard on `active/isDying/isGameOver`. Repositions label. If `staggerUntilMs > elapsedSurvivalMs` → `setVelocity(0,0)`, else `physics.moveToObject(boss, player, moveSpeed)`. Computes `hpRatio`; `summonInterval = hpRatio <= enragedHpThreshold ? summonCooldownMs * enragedSummonMultiplier : summonCooldownMs`. When `elapsedSurvivalMs >= nextSummonAtMs` → `summonBossMinions(boss)` and `nextSummonAtMs += summonInterval` |
| Minion summon | `src/scene/enemies.js:777-807` (`summonBossMinions`) | `count = Between(summonCountMin, summonCountMax)`; base = `BALANCE.enemy.types.infectedStaff` with `healthMultiplier=minionHealthMultiplier`, `damageMultiplier=minionDamageMultiplier`. Spawns on a ring radius 52 around the boss, respecting `BALANCE.enemy.maxActiveEnemies` cap, `initializeEnemyFromConfig(...)`, `minion.isBossMinion=true`, `playSound("bossSummon")` |
| Boss defeat | `src/scene/enemies.js:810-825` (`handleBossDefeat`) | Guard on `isDying`. Sets `isDying=true`, stops velocity, `killCount+=1`, `bossPhaseActive=false`, banner, `playEnemyDeathEffect`, then `time.delayedCall(BALANCE.feedback.deathShrinkMs + 120, …)` → `triggerVictory()` if not game over |
| Damage → defeat | `src/scene/combat.js:171-180` (`damageEnemy`) | On `health <= 0`, if `enemy.isBoss` calls `handleBossDefeat(enemy)` and returns (no XP/kill-reward path) |
| Boss balance keys | `src/config/balance.js:267-283` (`boss.scp049`) | `health:2500, speed:85, contactDamage:20, summonInitialDelayMs:5000, summonCooldownMs:11000, enragedHpThreshold:0.5, enragedSummonMultiplier:0.6, summonCountMin:2, summonCountMax:3, minionHealthMultiplier:0.6, minionDamageMultiplier:0.85, introDelayMs:2800, shotgunDamageMultiplier:1.5` |
| Presentation hooks | `src/scene/enemies.js:742,806` + `src/audio/AudioManager.js:130-140` | `playSound("bossAppear")`, `playSound("bossSummon")` resolve to procedural tones. Camera shake + `showTopBanner` are Scene-owned. Boss label is a transient effect (`registerTransientEffect`, `src/scene/effects.js:72`) |
| HUD boss readout | `src/scene/timeline.js:312-338` (`updatePhaseHud`) | After survival ends, shows `终局：SCP-049 | Boss 生命 N%` from `bossEnemy.health/maxHealth`, else `等待 Boss 登场` |

### 1.2 Weapon fairness and terminal paths

| Concern | Exact location | What the source does |
|---|---|---|
| Boss-priority targeting | `src/scene/enemies.js:846-864` (`findNearestEnemy`, `prioritizeBoss` arg) | When `prioritizeBoss` and boss is active/not dying and within `maxDistance`, returns the boss regardless of nearer enemies |
| Pistol vs boss | `src/scene/weapons.js:271-309` (`attackWithPistol`) | Calls `findNearestEnemy(weapon.range)` with **no** `prioritizeBoss` and default `triggerRange`-less range. Pistol treats the boss as an ordinary nearest target; it does **not** force-lock the boss |
| Breacher vs boss | `src/scene/weapons.js:312-371` (`attackWithShotgun`) | In boss phase, `attackRange = weapon.range` (full range, not `triggerRange`), and `findNearestEnemy(..., prioritizeBoss=true)`. Boss takes `shotgunDamageMultiplier` (1.5×) via `src/scene/combat.js:183-192` |
| Breacher control on boss | `src/scene/combat.js:58-101` (`applyBreacherPelletEffects`) | Knockback + stagger + suppression slow are gated on `!enemy.isElite`. The boss is `isElite=false`, so pellets **do** set `boss.staggerUntilMs` and knockback velocity — but `updateBoss` overrides velocity each frame (stagger still zeroes movement; knockback is effectively neutralized by `body.setImmovable(true)` + `moveToObject`) |
| Tesla vs boss | `src/scene/weapons.js:374-418` (`attackWithTesla`) | `prioritizeBoss=true`; if first target is the boss, **all** `chainTargets` iterations are aimed at the boss (an "overload" dump) with per-chain falloff, instead of bouncing between separate enemies |
| Victory | `src/scene/menus.js:869-879` (`triggerVictory`) | Sets `isGameOver=true`, `isVictory=true`, awards credits (win bonus), `freezeForGameOver()`, victory overlay |
| Defeat | `src/scene/combat.js:287-303` (`applyPlayerDamage`) → `src/scene/menus.js:798-805` (`triggerGameOver`) | On `health<=0`, game over overlay; boss contact damage is `contactDamage=20` via `handlePlayerEnemyOverlap` (`src/scene/combat.js:273-275`) |
| Freeze/cleanup | `src/scene/menus.js:1000-…` (`freezeForGameOver`) + `src/scene/systems.js:173-…` (`clearCombatEntities`) | Pauses systems, clears all groups (`enemies`, projectiles, bullets, gems, pickups, decoys). Boss object is destroyed with the `enemies` group; `boss.once("destroy")` nulls `bossEnemy` (`enemies.js:730-737`) |
| Pause semantics | `src/scene/menus.js:959-992` + `src/scene/systems.js:143-170` | `pauseGameplaySystems()` pauses `this.physics` and the spawn event only. `this.time` (Phaser clock) is **not** paused, and `elapsedSurvivalMs` stops advancing because `update` early-returns on `isPaused`. Consequence: `elapsedSurvivalMs`-driven summon timing is pause-safe; any `this.time.delayedCall` timer keeps counting during pause |
| Restart | `src/scene/menus.js:780,856,991` | Victory/defeat/quit all call `this.scene.restart()`, re-running `create()`; boss fields re-init at `main.js:67-68` and again in `startMissionWithWeapon` |
| Persistence | `src/config` meta + `scp-survivor-meta` localStorage (`docs/design.md:114`) | Boss path only writes credits via `awardRunCredits`; no boss-specific persistence. Schema is `{credits, perks}` |

### 1.3 Current-state fact table (plan-required columns)

| Current behavior | Source | Risk if changed | Compatibility requirement |
|---|---|---|---|
| `bossPhaseActive` gate drives `updateBoss` and weapon boss-priority | `main.js:176-178`, `weapons.js:318,324,375` | Breaking the flag desyncs targeting and update loop | Any new state must keep `bossPhaseActive` truthy for the whole fight and reset it on defeat/restart |
| Boss enters via `introDelayMs` timer after clear-out | `timeline.js:378-393` | Adding spawn-time state can double-spawn if the `bossEnemy?.active` guard is bypassed | Preserve the `spawnScp049Boss` idempotency guard (`enemies.js:692-694`) and `bossIntroTimer` cleanup |
| Boss chases via `moveToObject`; immovable body | `enemies.js:760`, `enemies.js:715` | New movement states could let minions shove the boss or break world-bounds clamp | Keep `setImmovable(true)`; any stop/telegraph state must restore chase cleanly |
| Stagger zeroes boss velocity per frame | `enemies.js:757-761`, `combat.js:74-79` | A new "vulnerable/rooted" state overlapping stagger could freeze the boss permanently | New states must compose with `staggerUntilMs`, not replace the velocity logic silently |
| Summon cadence via `nextSummonAtMs` + enrage multiplier | `enemies.js:763-773` | Reworking cadence can starve or flood minions vs `maxActiveEnemies` | Preserve `summonCountMin/Max` and `maxActiveEnemies` cap; keep enrage threshold behavior or explicitly re-approve it |
| Minions are `infectedStaff` with `isBossMinion=true` | `enemies.js:800-803` | Marking/tracking minions differently can break reward/cleanup branches | Preserve `isBossMinion` and its reward branch (`combat.js:214-216`) |
| Defeat → delayed `triggerVictory` | `enemies.js:810-825` | A new dying state can skip victory or fire it twice | Keep single-shot `isDying` guard and the six-minute → victory contract |
| Pistol does **not** force-lock boss; breacher/tesla do | `weapons.js:272,324,375` | New rules that assume all weapons hit the boss equally will misjudge fairness | Any rule must be viable with pistol's non-prioritized targeting, or explicitly re-balance it under Project Lead approval |
| Breacher 1.5× + stagger on boss | `combat.js:186-192`, `combat.js:67-79` | Adding damage-mult states can stack unexpectedly with 1.5× | New damage windows must define interaction with `shotgunDamageMultiplier` |
| Boss cleaned via `enemies` group + destroy hook | `enemies.js:730-737`, `systems.js:173-179` | New per-boss timers/arrays leak across restart if not cleared | Every new field/timer needs an explicit cleanup owner tied to defeat/restart/quit |
| Pause freezes physics + `elapsedSurvivalMs`, not `this.time` | `systems.js:143-149`, `main.js:162-164` | `delayedCall`-based boss logic will drift during pause | Prefer `elapsedSurvivalMs` deadlines over `this.time.delayedCall` for boss-state timing |
| Presentation via `playSound`/shake/banner/label | `enemies.js:742,806,741,743` | Audio keys and managers are shared-file/other-branch territory | Reuse existing `this.playSound(...)` keys and Scene-owned shake/banner/text; do not add `AudioManager`/`UIManager` API |
| localStorage schema `{credits,perks}` | `docs/design.md:114` | Persisting boss state breaks old saves | No boss data may enter `scp-survivor-meta` |

---

## Task 2 — Candidate SCP-specific rules

The four product-vision questions (`docs/product-vision.md:41-49`) frame every option:
(1) reinforce SCP identity, (2) create a new player decision, (3) differentiate from
generic Survivors-like, (4) avoid being only bigger numbers.

SCP-049's canonical identity is the *Plague Doctor* who "cures" the living by killing
them, reanimating corpses as SCP-049-2 instances, and who carries a lethal pestilence
on contact. All three options below stay inside Gameplay/Core, add no new map/task/
second boss, reuse existing summon or movement, and preserve the six-minute → single
SCP-049 → victory flow.

### Option A — "The Cure": corpse reanimation

1. **Player-observable rule:** When a boss minion dies, it leaves a marked corpse. If
   the boss is not interrupted, after a short telegraph it reanimates that corpse into a
   stronger SCP-049-2 instance. Corpses near the boss reanimate; corpses that decay
   (timer) or are re-hit disappear.
2. **Telegraph/feedback:** Corpse marker sprite/tint + a windup tint on the boss during
   a `operating` state; `playSound("bossSummon")` reused for the reanimate beat; top
   banner on first reanimation only.
3. **Player decision:** Where and when to kill minions — fight them away from the boss,
   or spend fire clearing corpses instead of damaging the boss.
4. **Boss state/timer data:** `boss.bossState`, `boss.stateUntilMs`, a bounded
   `boss.pendingCorpses` list of `{x, y, expireAtMs}`; reanimation deadline via
   `elapsedSurvivalMs`.
5. **Minion interaction:** Directly reuses `summonBossMinions` and `isBossMinion`; adds a
   death hook that records a corpse for `isBossMinion` kills only.
6. **Weapon effects:** Pistol/breacher/tesla can all destroy corpse markers (reuse
   `damageEnemy`/overlap). Breacher's AoE (`applyBreacherExplosion`) naturally clears
   clusters — mild breacher favoring, acceptable and re-balanceable.
7. **Accessibility/readability risk:** Highest — a second corpse entity type adds
   on-screen clutter; colorblind-safe marker + count cap required.
8. **Likely files:** `src/scene/enemies.js` (state, reanimation), `src/scene/combat.js`
   (minion-death hook), `src/config/balance.js` (config), reuse `effects.js` transient
   markers. No `main.js`/manager/manifest edits.
9. **Rollback path:** Feature-gated by a single balance flag (e.g. `reanimation.enabled`);
   disabling reverts to current summon-only fight; corpse list is cleared in the same
   cleanup owners as the boss.

### Option B — "Pestilence Touch": telegraphed surgical lunge

1. **Player-observable rule:** Periodically the boss stops, telegraphs, then lunges
   toward the player. A landed lunge applies a stacking "感染" debuff that blocks the
   skip-heal (`docs/design.md:68`) and slightly raises damage taken for a few seconds.
2. **Telegraph/feedback:** Boss tint + a directional warning (reuse elite teleport
   warning style, `enemies.js:630-643`); reuse `playSound("bossAppear")`-family tone;
   contact resolves through the existing player-overlap path.
3. **Player decision:** Spacing and dodge-timing during the telegraph, and whether to
   burn the dash (`space`) defensively instead of repositioning for damage.
4. **Boss state/timer data:** `boss.bossState` (`normal`/`winding`/`lunging`),
   `boss.stateUntilMs`, `boss.nextLungeAtMs`; player `infectionStacks`, `infectionUntilMs`.
5. **Minion interaction:** Independent of summons; summon cadence unchanged. Reuses
   movement (`moveToObject`) and the stagger velocity path.
6. **Weapon effects:** Neutral across weapons; lunge windup is a free-damage window for
   all three, keeping pistol viable (addresses the pistol non-lock gap).
7. **Accessibility/readability risk:** Medium — telegraph direction and infection stacks
   need clear HUD/entity signals; must not rely on color alone.
8. **Likely files:** `src/scene/enemies.js` (lunge state), `src/scene/combat.js`
   (infection application/heal-block), `src/config/balance.js`. Heal-block touches the
   skip-heal path in `progression`/`combat`; scoped and reversible.
9. **Rollback path:** Balance flag `pestilence.enabled`; off → boss reverts to pure chase.
   Infection fields reset on damage-cooldown expiry and on restart.

### Option C — "Surgery Frenzy": explicit vulnerable summon window

1. **Player-observable rule:** Convert today's implicit enrage (faster summons under 50%
   HP) into an explicit telegraphed `frenzy` state: the boss roots itself to summon a
   larger wave and, during that window, takes bonus damage ("exposed").
2. **Telegraph/feedback:** Root + tint + banner; reuse `playSound("bossSummon")`; HUD
   already shows boss HP% (`timeline.js:321-325`).
3. **Player decision:** Whether to burst the exposed boss or first thin the incoming
   wave; risk/reward on positioning during the root.
4. **Boss state/timer data:** `boss.bossState` (`normal`/`frenzy`), `boss.stateUntilMs`,
   reuse `nextSummonAtMs`; `exposedDamageMultiplier`.
5. **Minion interaction:** Directly reuses `summonBossMinions`; the frenzy simply gates a
   bigger/earlier summon and the exposure window.
6. **Weapon effects:** Exposure benefits all weapons; must define interaction with the
   existing `shotgunDamageMultiplier` (1.5×) to avoid runaway stacking.
7. **Accessibility/readability risk:** Lowest — one extra state, reuses existing HUD and
   summon telegraphs.
8. **Likely files:** `src/scene/enemies.js` (state in `updateBoss`), `src/config/balance.js`.
   Smallest surface; no new entity type, no combat-path heal changes.
9. **Rollback path:** Balance flag `frenzy.enabled`; off → revert to current enrage
   multiplier. No persistent fields beyond the boss object.

**Constraint check:** Options A and C reuse the existing summon behavior; Option B reuses
existing movement. None requires a new map, task system, or second boss.

### 2.2 Scoring (1–5; 1 and 5 explained)

| Criterion | A: Reanimation | B: Pestilence | C: Frenzy |
|---|---|---|---|
| SCP identity | **5** — reanimation *is* SCP-049's defining mechanic | 4 | 3 |
| Player-decision quality | **5** — new spatial layer (where minions die) | 4 | 3 |
| Implementation scope | 2 — new corpse entity + tracking | 3 | **5** — one state + one multiplier, reuses summon/HUD |
| Weapon fairness | 3 (breacher AoE favored) | **4** free windows for all incl. pistol | 4 |
| UI dependency | 2 — needs a clear new marker | 3 | **5** — reuses existing HUD/banners |
| Restart safety | 3 — corpse list needs cleanup wiring | 3 | **5** — no persistent structures |
| Testability | 2 — most new states/edges to smoke | 3 | **5** — smallest matrix, deterministic |

*Explained extremes.* A-identity **5**: reanimating the dead is the literal SCP-049
canon, not a reskin. A-decision **5**: it introduces a positioning decision absent from
the current fight. C-scope/UI/restart/testability **5**: C adds a single boss state plus
one damage multiplier, reuses `summonBossMinions`, the existing HUD HP readout, and adds
no per-boss data structures, so restart and smoke coverage stay minimal.

### 2.3 Recommendation

**Recommend Option C ("Surgery Frenzy") for the first implementation, structured as an
explicit boss state machine, with Option A recorded as the preferred follow-up.**

Against the four questions: C reinforces SCP identity by making the containment/enrage
rhythm *observable and answerable* (Q1), creates a real burst-vs-survive decision during
the telegraphed window (Q2), differentiates from generic auto-battling by rewarding read-
and-punish over pure DPS (Q3), and is explicitly **not** just larger numbers because the
new value is a legible rule, not a stat bump (Q4). C also best satisfies the plan's
architecture directive — "prefer a small state machine and explicit gameplay-to-
presentation signals" — and scores highest on scope, restart safety, and testability,
which matters for a first bounded change to a shared boss path.

Option A scores higher on identity and decision depth but carries the most readability,
cleanup, and test surface; it is the recommended **second** wave once the state-machine
scaffold from C exists (A can reuse the same `bossState` field and `operating` window).

**Explicitly excluded from the first implementation:** new corpse/SCP-049-2 entity,
heal-blocking infection, lunge/movement rework, any new map/task/second boss, and any
change to victory/defeat/restart contracts beyond adding one intermediate boss state.

**Resolved product decision (Rev 2):** the first implementation **replaces** the current
implicit `enragedSummonMultiplier` behavior with the explicit frenzy window. The old
`enragedSummonMultiplier` key is retired (see §3.2.1); enrage below `enragedHpThreshold`
now expresses itself as a shorter frenzy cadence via `frenzyEnragedMultiplier`, not as a
hidden summon-interval scale. There is no remaining replace/layer open question.

---

## Task 3 — Implementation contract and verification

> Contract for the approved Option C. Not implemented in this wave.

### 3.1 Proposed state machine

`boss.bossState` is a string owned by the boss game object, driven exclusively by
`updateBoss` (`src/scene/enemies.js`). Enrage is a modifier read from HP, not an
exclusive state; the table lists it per the plan requirement.

| State | Entry condition | Update rule | Exit condition | Player signal | Cleanup |
|---|---|---|---|---|---|
| `normal` | On spawn (`spawnScp049Boss`) | `moveToObject` chase; summon when `elapsedSurvivalMs >= nextSummonAtMs` | `elapsedSurvivalMs >= nextFrenzyAtMs` → `frenzy` | Chasing boss + HP% HUD | none (steady state) |
| `frenzy` | From `normal` at `nextFrenzyAtMs` (cadence scales with HP ≤ `enragedHpThreshold`) | Root (velocity 0), summon one enlarged wave via `summonBossMinions(boss, { frenzy: true })`, apply `exposedDamageMultiplier` | `elapsedSurvivalMs >= stateUntilMs` (after `frenzyDurationMs`) → `exitFrenzy` → `normal`, set next `nextFrenzyAtMs` | Boss tint + banner + `playSound("bossSummon")`; HUD unchanged | `exitFrenzy` clears the frenzy tint (§3.2.4) |
| enraged (modifier) | `boss.health/maxHealth <= enragedHpThreshold` | Shortens `nextFrenzyAtMs` cadence via `frenzyEnragedMultiplier` (replaces the retired `enragedSummonMultiplier`) | HP rises above threshold (won't in practice) | Faster frenzy rhythm | none |
| `dying` | `health <= 0` via `handleBossDefeat` | `handleBossDefeat` sets `bossState="dying"` and `isDying=true`, zeroes velocity, and blocks all further `updateBoss` state transitions (`updateBoss` already early-returns on `isDying`) | `deathShrinkMs+120` delayed → `triggerVictory` | Death effect + banner | `handleBossDefeat` calls `clearFrenzyTint(boss)` and cancels any pending frenzy (`stateUntilMs`/`nextFrenzyAtMs` become inert once `dying`) (§3.2.4) |
| shutdown/restart | `scene.restart` / quit / game over | n/a (object destroyed with `enemies` group) | new `create` | none | `destroy` hook nulls `bossEnemy`; `startMissionWithWeapon` resets flags |

Guard composition: `frenzy` root must coexist with `staggerUntilMs` (both zero velocity;
no conflict). `bossPhaseActive` stays `true` across `normal`/`frenzy`, flips `false` only
in `handleBossDefeat` (unchanged).

### 3.2 Exact public data and methods

**New/changed fields (initialized in `spawnScp049Boss`, `src/scene/enemies.js`):**

| Name | Owner file | Shape | Init point | Update owner | Cleanup owner |
|---|---|---|---|---|---|
| `boss.bossState` | `enemies.js` | string `"normal"`/`"frenzy"`/`"dying"` | `spawnScp049Boss` (`="normal"`) | `updateBoss` | destroyed with boss; re-init on next spawn |
| `boss.stateUntilMs` | `enemies.js` | number (ms, `elapsedSurvivalMs` clock) | `spawnScp049Boss` (`=0`) | `updateBoss` | with boss |
| `boss.nextFrenzyAtMs` | `enemies.js` | number (ms) | `spawnScp049Boss` (`= elapsed + frenzyFirstDelayMs`) | `updateBoss` | with boss |

No new Scene-level fields; no new arrays/timers requiring separate teardown. All boss
state lives on the boss object and dies with it (existing `boss.once("destroy")`,
`enemies.js:730-737`).

#### 3.2.1 New/changed config with concrete initial values (`src/config/balance.js`, `boss.scp049`)

The old `enragedSummonMultiplier: 0.6` key is **removed** (retired by the Rev-2 replace
decision). The old `summonInitialDelayMs`, `summonCooldownMs`, `summonCountMin/Max`
continue to drive the `normal`-state trickle summon; the frenzy keys below drive the new
explicit window. All timers use the `elapsedSurvivalMs` clock (pause-safe, per §3.4).

| Key | Type | Initial value | Rationale |
|---|---|---:|---|
| `frenzyEnabled` | boolean | `true` | Master rollback flag; setting `false` reverts the fight to normal-only chase+trickle summon with no other change |
| `frenzyFirstDelayMs` | number | `12000` | First frenzy ~12 s after the boss appears. Long enough for the player to read the normal chase + first trickle summon (`summonInitialDelayMs:5000`) before the first telegraphed window, so the mechanic is taught in a calm beat rather than at spawn |
| `frenzyCooldownMs` | number | `14000` | Base gap between frenzy windows. Sits just above the existing `summonCooldownMs:11000` so a frenzy is a distinct punctuation, not overlapping the trickle summon each cycle; yields ~3–4 windows across a full-HP fight of the current 2500-HP boss |
| `frenzyEnragedMultiplier` | number | `0.65` | Cadence scale applied to `frenzyCooldownMs` when `hpRatio <= enragedHpThreshold (0.5)` → ~9.1 s gap. Preserves the "gets more aggressive under half HP" feel that `enragedSummonMultiplier:0.6` used to give, now expressed through the visible frenzy rhythm |
| `frenzyDurationMs` | number | `2500` | Root/exposed window length. Long enough to be a clear burst opportunity for all weapons (pistol included, §2.2) and to land the enlarged wave, short enough that the rooted boss is not a free kill |
| `frenzySummonCountMin` | number | `3` | Lower bound of the frenzy wave. One above the normal `summonCountMin:2` so a frenzy visibly summons more than a trickle |
| `frenzySummonCountMax` | number | `4` | Upper bound; one above normal `summonCountMax:3`. Still modest so the wave respects `maxActiveEnemies` and stays readable |
| `exposedDamageMultiplier` | number | `1.35` | Bonus damage taken while `bossState==="frenzy"`. Rewards committing to the rooted boss without trivializing the 2500-HP pool; interaction with breacher 1.5× is capped in §3.2.3 |

#### 3.2.2 `summonBossMinions` frenzy call interface

`summonBossMinions` gains an **optional options argument** so the frenzy path can request a
larger wave without a second method. Signature and contract:

```
summonBossMinions(boss, options = {})
  options.frenzy  : boolean  (default false)
```

- When `options.frenzy` is falsy → **unchanged** current behavior: count =
  `Between(summonCountMin, summonCountMax)`, using `minionHealthMultiplier` /
  `minionDamageMultiplier`, ring radius 52, `maxActiveEnemies` cap, `isBossMinion=true`,
  `playSound("bossSummon")`. This is exactly the existing call from the `normal` trickle.
- When `options.frenzy` is `true` → count =
  `Between(frenzySummonCountMin, frenzySummonCountMax)`; **all other behavior is
  identical** (same base config, same scaling multipliers, same ring placement, same
  `maxActiveEnemies` cap check inside the loop, same `isBossMinion=true`, same sound).
- The `maxActiveEnemies` guard stays **inside** the spawn loop (`enemies.js:787-789`), so a
  frenzy wave that would exceed the cap simply spawns fewer — no overflow (smoke row #12).
- Callers: `normal` state calls `summonBossMinions(boss)` (unchanged); `enterFrenzy` calls
  `summonBossMinions(boss, { frenzy: true })`.

#### 3.2.3 `exposedDamageMultiplier` × breacher-1.5× stacking and cap

The two multipliers combine **multiplicatively**, then the boss-specific portion is
**clamped to a hard cap of 2.0×** so a fully-exposed breacher shot cannot exceed double
damage. Defined against the existing `getEnemyDamageTakenMultiplier` boss branch
(`src/scene/combat.js:186-192`):

- Non-boss enemies: unaffected (no `exposed`, no breacher-boss branch).
- Boss, `normal`, breacher pellet → `1.5×` (unchanged).
- Boss, `normal`, pistol/tesla → `1.0×` (unchanged).
- Boss, `frenzy`, pistol/tesla → `exposedDamageMultiplier = 1.35×`.
- Boss, `frenzy`, breacher pellet → `1.5 × 1.35 = 2.025×`, **clamped to 2.0×**.

Implementation shape (no signature change): compute
`bossMultiplier = shotgunFactor * exposedFactor`, then
`bossMultiplier = Math.min(bossMultiplier, BALANCE.boss.scp049.exposedDamageCap)` with
`exposedDamageCap: 2.0` added to config. The cap key is listed here rather than in §3.2.1
because it exists only to bound this interaction. Smoke row #6 verifies the breacher case
lands at the 2.0× cap, not 2.025×.

#### 3.2.4 `handleBossDefeat` state + frenzy tint lifecycle

**`handleBossDefeat(boss)` (`src/scene/enemies.js:810-825`) — modified:**

- Sets `boss.bossState = "dying"` immediately after the existing `boss.isDying = true`
  line. This makes the death state explicit in the state machine (§3.1) and, together with
  the existing `if (!boss?.active || boss.isDying …) return;` guard in `updateBoss`
  (`enemies.js:749`), guarantees no `frenzy`/`normal` transition can fire after defeat.
- Calls `this.clearFrenzyTint(boss)` so a boss killed **mid-frenzy** does not play its
  death effect while still wearing the frenzy tint. Pending frenzy timers
  (`stateUntilMs`, `nextFrenzyAtMs`) need no explicit cancel — they become inert once
  `updateBoss` early-returns on `isDying`.

**Frenzy tint lifecycle (single owner pair):**

- `enterFrenzy(boss)` — applies the tint via `boss.setTint(<frenzy color>)` and records
  nothing extra (Phaser tint lives on the sprite; no separate object to track).
- `clearFrenzyTint(boss)` — *new, private helper (`enemies.js`)*: `boss.clearTint()` (guard
  on `boss?.active`). Single method used by **both** `exitFrenzy` (normal window end) and
  `handleBossDefeat` (death mid-frenzy).
- `exitFrenzy(boss)` — calls `clearFrenzyTint(boss)`, sets `bossState="normal"`, computes
  next `nextFrenzyAtMs`.
- Restart/quit/game-over: the boss sprite is destroyed with the `enemies` group
  (`clearCombatEntities`, `systems.js:173-179`), so no tint can survive a scene restart;
  a fresh boss starts untinted at `spawnScp049Boss`. No Scene-level tint state exists.

Reuses only the existing Phaser `setTint`/`clearTint` on the boss sprite — no
`AudioManager`/`UIManager` API and no new manager or manifest surface.

#### 3.2.5 Methods summary (`src/scene/enemies.js`, `src/scene/combat.js`)

- `updateBoss()` — *modified.* Reads `this.bossEnemy`, `elapsedSurvivalMs`; mutates boss.
  Adds the `normal`/`frenzy` state switch and calls `enterFrenzy`/`exitFrenzy` at the
  timer boundaries. Update owner of `bossState`, `stateUntilMs`, `nextFrenzyAtMs`.
- `enterFrenzy(boss)` — *new, private.* Sets `bossState="frenzy"`,
  `stateUntilMs = elapsedSurvivalMs + frenzyDurationMs`, applies frenzy tint, calls
  `summonBossMinions(boss, { frenzy: true })`, plays `playSound("bossSummon")` + banner.
  Called only from `updateBoss`.
- `exitFrenzy(boss)` — *new, private.* Calls `clearFrenzyTint(boss)`, restores
  `bossState="normal"`, sets `nextFrenzyAtMs = elapsedSurvivalMs + frenzyCooldownMs *
  (hpRatio <= enragedHpThreshold ? frenzyEnragedMultiplier : 1)`.
- `clearFrenzyTint(boss)` — *new, private.* `boss.clearTint()` (guarded). Shared by
  `exitFrenzy` and `handleBossDefeat` (§3.2.4).
- `summonBossMinions(boss, options)` — *modified.* Optional `options.frenzy` selects the
  frenzy count range; all other behavior unchanged (§3.2.2).
- `handleBossDefeat(boss)` — *modified.* Sets `bossState="dying"`, calls
  `clearFrenzyTint(boss)` (§3.2.4); existing victory path unchanged.
- `getEnemyDamageTakenMultiplier(enemy, …)` (`src/scene/combat.js`) — *modified.* Adds the
  `frenzy` exposed factor and the 2.0× cap (§3.2.3). No signature change.

No edits to `src/main.js`, `AudioManager`, `UIManager`, manifests, or persistence.
Reuses existing `this.playSound("bossSummon")`, `showTopBanner`, and Phaser sprite tint.

### 3.3 Verification

**Build (deterministic):**

```powershell
npm run build
```

Expected: Vite production build completes with exit code 0 and no new errors/warnings
attributable to the boss files. A green build proves compilation only, not gameplay
correctness (`AGENTS.md:58`).

**Manual browser smoke — no automation harness exists in this repo, so every row below
is manual** (run `npm run dev`, use `DEBUG_MODE` key `B` where noted):

| # | Scenario | Expected observation |
|---|---|---|
| 1 | Two consecutive full runs to 6:00 | Boss spawns once each run; no leaked state/tint from run 1 into run 2 |
| 2 | Debug `B` skip to boss | `endSurvivalPhase(true)` path spawns boss; frenzy cadence starts from spawn, not from 0:00 |
| 3 | Pause/resume in `normal` | Physics + `elapsedSurvivalMs` freeze; frenzy timer does not advance while paused; resumes cleanly |
| 4 | Pause/resume during `frenzy` | Root/exposed window resumes at the same remaining duration; no double-summon |
| 5 | Pistol full fight | Boss killable; frenzy window gives pistol a usable exposure burst despite non-lock targeting |
| 6 | Breacher full fight | 1.5× + `exposedDamageMultiplier` interaction matches the documented cap; stagger still zeroes movement |
| 7 | Tesla full fight | Overload dump still targets boss; exposure applies to chained boss hits |
| 8 | Victory | Boss defeat → single `triggerVictory`; no frenzy re-entry after `isDying` |
| 9 | Defeat during frenzy | Player death still routes to `triggerGameOver`; boss root cleaned by `freezeForGameOver` |
| 10 | Restart from victory and from defeat | `scene.restart` → title flow; boss fields reset; no residual `bossState`/tint |
| 11 | localStorage | `scp-survivor-meta` still `{credits, perks}`; no boss data written; old saves load |
| 12 | `maxActiveEnemies` under frenzy | Enlarged wave respects the cap; no summon overflow |

### 3.4 Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Frenzy timer drifts across pause (if `this.time.delayedCall` used) | Med | Med | Use `elapsedSurvivalMs` deadlines only (matches audited pause semantics) |
| `exposedDamageMultiplier` stacks with 1.5× breacher → burst too high | Med | Med | Resolved: multiplicative then hard-capped at 2.0× via `exposedDamageCap` (§3.2.3); smoke row #6 verifies the cap |
| Boss stuck rooted if frenzy exit missed | Low | High | `stateUntilMs` hard deadline in `updateBoss`; `dying` guard blocks re-entry |
| Restart leaks tint/state | Low | Med | All state on boss object; `clearFrenzyTint` on exit/defeat; sprite dies with `enemies` group; re-init on spawn (§3.2.4) |
| Pistol non-lock makes fight unfair without exposure | Med | Med | Frenzy window is the designed equalizer; smoke row #5 gates it |
| Retiring `enragedSummonMultiplier` changes existing difficulty feel | Med | Low | Enrage feel preserved via `frenzyEnragedMultiplier:0.65` (§3.2.1); tune in `balance.js`; decision resolved in Rev 2 (§2.3) |
| Shared-file scope creep (`main.js`/managers/manifest) | Low | High | Contract touches only `enemies.js`, `combat.js`, `balance.js`; none are shared-gate files |

---

## Scope, verification, and handoff for this planning wave

- **This wave (Rev 2):** revision of the proposal document only, per Project Lead
  review. Direction approved; writing `src/` is **not** yet approved.
- **Files changed this wave:** this proposal only
  (`docs/superpowers/plans/2026-07-10-v2-scp049-boss-proposal.md`).
- **`src/` changes:** none. No push, no merge.
- **Resolved this revision:** replace decision finalized (§2.3, §3.1); concrete config
  values + rationale (§3.2.1); `summonBossMinions` frenzy interface (§3.2.2); exposed ×
  breacher stacking + 2.0× cap (§3.2.3); `handleBossDefeat` `bossState="dying"` + frenzy
  tint lifecycle (§3.2.4).
- **Verification run this wave:** documentation only; no build/gameplay run was required
  or performed for a docs-only change. The build/smoke matrix in §3.3 is the *proposed*
  verification for the future implementation wave.
- **Requested next action:** Project Lead re-review of the revised Option C contract
  before any `src/` work begins.
