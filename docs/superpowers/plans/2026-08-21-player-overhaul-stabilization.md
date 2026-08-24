# Player Overhaul Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `2ae0385` 上的 Player Overhaul 混合 WIP 收敛为经过验证、可回退、按职责提交的 Phase 1/2 两武器版本。

**Architecture:** 保留 24×24 gameplay anchor，把 body/equipment/VFX 放在 display-only controller；普通流程选择 rifle/Tesla 后原子激活 formal rig，失败回退完整 legacy。真实攻击几何继续使用玩家中心，action point 只影响视觉。

**Tech Stack:** Phaser 3、Vite、JavaScript ES Modules、Node test runner、Python/Pillow deterministic asset tools。

**Spec:** `docs/superpowers/specs/2026-08-21-player-overhaul-stabilization-design.md`

## Global Constraints

- 只在 `C:\scp-survivor-workspaces\active\player-combat-presentation-overhaul` 工作。
- 保留 gameplay player identity、24×24 Arcade Body、camera follow target 和 legacy fallback。
- 正式普通流程只暴露 `pistol`（Foundation rifle）与 `tesla`；shotgun 内核保留但不可达。
- Tesla 固定 `baseDamage: 6`、`baseCooldownMs: 300`、range 320、chain falloff 0.8。
- action point 只影响视觉；不得迁移 projectile、target、range 或 damage 的 gameplay origin。
- 不修改、复制、清理 `C:\scp-survivor-workspaces\active\ui-art`。
- 不生成新素材，不进入 Phase 3/4，不 push/PR/merge/release/deploy。
- 所有 stage 使用精确文件清单；提交前读取 cached diff，不使用 broad add。

---

### Task 1: 对齐生产素材、manifest 与登记表

**Files:**
- Modify: `src/assets/manifest.js`
- Modify: `src/scenes/PreloadScene.js`
- Modify: `vite.config.js`
- Modify: `docs/art/asset-register.md`
- Modify: `scripts/art/build_player_character_assets.py`
- Modify: `scripts/art/test_player_character_assets.py`
- Create: `scripts/art/build_player_equipment_assets.py`
- Create: `scripts/art/test_player_equipment_assets.py`
- Create: `scripts/art/build_player_two_direction_asset.py`
- Create: `scripts/art/test_player_two_direction_asset.py`
- Create: `scripts/art/data/player-response-operative-body-sockets.json`
- Create: `scripts/art/data/player-two-direction-quality-sample-sockets.json`
- Modify: `test/player-equipment-assets.test.js`
- Modify: `test/production-player-asset-boundary.test.js`
- Modify: `test/art-assets.test.js`
- Modify: `test/player-character-assets.test.js`
- Create: `public/assets/art/characters/player-response-operative-body-prototype.png`
- Create: `public/assets/art/characters/player-response-operative-body.png`
- Create: `public/assets/art/characters/player-response-operative-breacher-sample.png`
- Create: `public/assets/art/characters/player-response-operative-cbrn-sample.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-aim-back.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-aim-front.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-aim-recoil-back.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-aim-recoil-front.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-connector-back.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-connector-front.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-core.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-cross-back.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-cross-front.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-icon.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-same-back.png`
- Create: `public/assets/art/weapons/foundation-containment-rifle-same-front.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-aim-back.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-aim-front.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-aim-recoil-back.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-aim-recoil-front.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-connector-back.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-connector-front.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-core.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-cross-back.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-cross-front.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-icon.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-same-back.png`
- Create: `public/assets/art/weapons/tesla-containment-emitter-same-front.png`
- Create: `public/assets/art/weapons/tesla-containment-power-module.png`

**Interfaces:**
- Consumes: `TEXTURES`, `IMAGE_ASSETS`, `SPRITESHEET_ASSETS`, `DEVELOPMENT_SPRITESHEET_ASSETS`.
- Produces: production preload containing only body, eight aim/recoil sheets, Tesla module and two icons; build cleanup that removes every non-production Player candidate from `dist` while never touching `public`.

- [ ] **Step 1: Add failing boundary tests**

  Update `test/player-equipment-assets.test.js` so connector/core/same/cross keys are absent from `IMAGE_ASSETS` and `SPRITESHEET_ASSETS`, while body, eight aim/recoil sheets and Tesla module remain. Update `test/production-player-asset-boundary.test.js` with literal lists proving all prototype/sample/core/connector/same/cross files are removed from build output and required runtime files survive.

- [ ] **Step 2: Verify RED**

  Run:

  ```powershell
  node --test test/player-equipment-assets.test.js test/production-player-asset-boundary.test.js
  ```

  Expected: fail because manifest still preloads historical sheets and build cleanup owns only four development files.

- [ ] **Step 3: Implement the minimal production boundary**

  Remove historical core/connector/same/cross entries from production preload arrays without deleting their texture constants or source PNGs. Replace the four-file cleanup contract with explicit non-production Player asset paths, validate every target remains under `dist`, and retain the existing refusal to operate when `outDir` is `public`.

- [ ] **Step 4: Reconcile asset register**

  Record the actual SHA-256 and dimensions for body, eight aim/recoil sheets, Tesla module and icons. Mark core/connector/same/cross as retained historical/reference outputs excluded from preload and production bundle. Keep commercial-release review pending; do not claim final licensing approval.

- [ ] **Step 5: Verify GREEN**

  Run the two focused Node files, three Python asset suites, `test/art-assets.test.js`, and `git diff --check`. Expected: all pass, no whitespace errors.

- [ ] **Step 6: Commit exact Task 1 files**

  Commit message: `feat(art): stabilize operative equipment assets`

### Task 2: 原子切换 formal equipment rig

**Files:**
- Modify: `src/art/playerPresentationController.js`
- Modify: `test/player-presentation-controller.test.js`
- Modify: `src/art/characterPresentation.js`
- Modify: `src/art/playerCharacterVisualStateDriver.js`
- Create: `src/art/playerDynamicSampleDefinitions.js`
- Create: `src/art/playerEquipmentDefinitions.js`
- Create: `src/art/playerEquipmentRig.js`
- Create: `src/art/playerGroundedLocomotion.js`
- Create: `src/art/playerPresentationModel.js`
- Create: `src/art/playerResponseOperativeBodySockets.js`
- Create: `src/art/playerTwoDirectionQualitySampleSockets.js`
- Create: `src/config/playerWeaponAvailability.js`
- Modify: `test/character-presentation.test.js`
- Modify: `test/player-character-visual-state-driver.test.js`
- Create: `test/player-dynamic-samples.test.js`
- Create: `test/player-equipment-complete-pose-rig.test.js`
- Create: `test/player-equipment-definitions.test.js`
- Create: `test/player-equipment-rig.test.js`
- Create: `test/player-grounded-locomotion.test.js`
- Create: `test/player-presentation-model.test.js`

**Interfaces:**
- Consumes: frozen snapshot `selectedWeaponId`, `destroyFormalRig()`, `tryActivateFormal()`.
- Produces: `PLAYER_WEAPON_ALLOWLIST`, `isPlayerWeaponAllowed()`, `isPlayerUpgradeVisible()` and atomic allowed-weapon transition with complete legacy fallback and no gameplay writes.

- [ ] **Step 1: Write the failing switch tests**

  Add behavior tests for pistol→Tesla→pistol and pistol→missing-Tesla→pistol. Assert only the current complete rig survives; prior sprites/tweens are destroyed; legacy is complete on failure; repeated same failed ID does not allocate again; anchor position/body stay byte-for-byte equivalent; action origin and VFX type match the active weapon.

- [ ] **Step 2: Verify RED**

  Run:

  ```powershell
  node --test test/player-presentation-controller.test.js
  ```

  Expected: fail because `update()` never rebuilds an existing formal rig for a changed `selectedWeaponId`.

- [ ] **Step 3: Implement the minimal controller transition**

  In `update()`, detect an allowed selected ID different from `formalWeaponId`; clear owned recoil/tween/timer state, destroy the old rig with legacy restoration, reset the attempt guard for the newly selected ID, and call `tryActivateFormal(snapshot)`. Do not add weapon selection UI, mutate snapshot/gameplay, or change `playerEquipmentRig` mechanics.

- [ ] **Step 4: Verify GREEN and lifecycle coverage**

  Run controller, model, rig, grounded-locomotion and presentation-integration tests. Expected: switch tests and all existing fallback/pause/hit/restart tests pass.

- [ ] **Step 5: Commit exact Task 2 files**

  Commit message: `feat(presentation): add atomic operative equipment switching`

### Task 3: 固化两武器普通流程与 HUD 合同

**Files:**
- Modify: `src/config/balance.js`
- Modify: `src/config/upgrades.js`
- Modify: `src/scene/menus.js`
- Modify: `src/scene/hud.js`
- Modify: `src/scene/progression.js`
- Modify: `src/ui/hudPresentation.js`
- Modify: `test/build-panel-view.test.js`
- Modify: `test/hud-presentation.test.js`
- Modify: `test/level-up-overlay.test.js`
- Modify: `test/menu-art.test.js`
- Modify: `test/overlay-lifecycle.test.js`
- Modify: `test/tactical-hud-view.test.js`
- Modify: `test/weapon-selection-view.test.js`
- Create: `test/player-weapon-availability.test.js`
- Create: `test/tesla-channel-ui.test.js`
- Create: `test/weapon-selection-flow.test.js`

**Interfaces:**
- Consumes: `PLAYER_WEAPON_ALLOWLIST = ["pistol", "tesla"]`.
- Produces: two-card armory, shotgun rejection without partial mission mutation, hidden shotgun upgrades, 6/300ms Tesla copy.

- [ ] **Step 1: Run characterization tests**

  Run weapon availability, selection flow/view, level-up, build-panel, HUD and Tesla UI suites. Expected: pistol/Tesla start normally; shotgun direct start leaves mission state unchanged; shotgun upgrades stay internal; Tesla text reports 6 per 300ms.

- [ ] **Step 2: Resolve only observed contract failures**

  If a characterization test fails, first add a minimal regression test that names the user-visible break, verify RED, then change only the responsible allowlist/menu/progression/HUD path. Do not delete shotgun configuration, attacks or upgrades.

- [ ] **Step 3: Commit exact Task 3 files**

  Commit message: `feat(ui): expose rifle and Tesla player loadouts`

### Task 4: 固化 combat feedback、Tesla channel 与落地移动集成

**Files:**
- Modify: `src/main.js`
- Modify: `src/art/combatFeedback.js`
- Modify: `src/scene/combat.js`
- Modify: `src/scene/effects.js`
- Modify: `src/scene/systems.js`
- Modify: `src/scene/weapons.js`
- Modify: `src/scene/world.js`
- Modify: `test/attack-facing.test.js`
- Modify: `test/attack-feedback-notification.test.js`
- Modify: `test/combat-feedback.test.js`
- Modify: `test/combat-feedback-lifecycle.test.js`
- Modify: `test/combat-presentation-equivalence.test.js`
- Modify: `test/combat-presentation-integration.test.js`
- Modify: `test/hit-feedback-notification.test.js`
- Modify: `test/muzzle-flash-feedback.test.js`
- Modify: `test/presentation-rules.test.js`
- Create: `test/player-presentation-integration.test.js`
- Create: `test/projectile-launch-presentation.test.js`
- Create: `test/tesla-channel-feedback.test.js`
- Create: `test/tesla-continuous-channel.test.js`

**Interfaces:**
- Consumes: frozen presentation snapshot and visual action point.
- Produces: display-only muzzle/proxy/first-arc feedback; Tesla committed deadline before callbacks; grounded locomotion/contact shadow/camera presentation.

- [ ] **Step 1: Run focused mechanics-equivalence suites**

  Verify projectile, damage, cooldown, ammo, target order, Tesla cadence and returns are identical across absent, normal and throwing presentation seams. Verify 6/300ms/320/0.8 and no catch-up burst.

- [ ] **Step 2: Fix only reproduced regressions with TDD**

  For every failure, preserve the failing test before production edits. Never move physical projectile/Tesla gameplay origins to the visual action point.

- [ ] **Step 3: Commit exact Task 4 files**

  Commit message: `feat(combat): integrate operative feedback and Tesla channel`

### Task 5: 收拢历史文档与执行完整验证

**Files:**
- Preserve under this plan's ignored SDD workspace, but do not commit: `docs/superpowers/plans/2026-08-16-player-equipment-complete-playable.md`.
- Preserve under this plan's ignored SDD workspace, but do not commit: `docs/superpowers/plans/2026-08-16-player-equipment-runtime-visual-correction.md`.
- Preserve under this plan's ignored SDD workspace, but do not commit: `docs/superpowers/plans/2026-08-17-player-grounded-locomotion.md`.
- Preserve under this plan's ignored SDD workspace, but do not commit: `docs/superpowers/specs/2026-08-16-player-equipment-complete-playable-design.md`.
- Preserve under this plan's ignored SDD workspace, but do not commit: `docs/superpowers/specs/2026-08-16-player-equipment-runtime-visual-correction-design.md`.
- Preserve in place but ignore: `.superpowers/brainstorm/**`, `scripts/art/__pycache__/**`, `task-3-report.md`.
- Restore `docs/design.md` to its branch baseline only after saving its exact patch in this plan's ignored SDD workspace; it may be updated on main only after integration.
- Modify: `.gitignore` with exactly `.superpowers/brainstorm/`, `scripts/art/__pycache__/`, and `task-*-report.md`.

**Interfaces:**
- Consumes: commits from Tasks 1–4.
- Produces: reproducible local branch with no accidental staged files and a complete verification record.

- [ ] **Step 1: Preserve excluded WIP reversibly**

  Store exact path/hash manifests and the `docs/design.md` patch under this plan's `.superpowers/sdd/` workspace before any restore or move. Do not delete or overwrite old UI/Art files.

- [ ] **Step 2: Run full automated verification**

  Run three Python suites, all focused Player/weapon/fallback/Tesla suites, `node --test`, `npm run build`, bundle path checks and `git diff --check`. Record exact pass/fail counts, module count and warnings.

- [ ] **Step 3: Run browser verification**

  At 960×540 ordinary URL, verify legacy-before-selection, rifle, Tesla, movement/aim split, recoil, pause/resume, hit, restart and no duplicate rig. Capture current screenshots; report user visual Gate separately.

- [ ] **Step 4: Audit Git state**

  Confirm branch/HEAD, commit list, staged/unstaged/untracked counts and no in-progress Git operation. Do not push, create PR or merge.

- [ ] **Step 5: Commit the local evidence boundary**

  Stage only `.gitignore` after confirming the five superseded documents and `docs/design.md` patch exist in this plan's ignored SDD workspace. Commit message: `chore: preserve local player overhaul evidence`.
