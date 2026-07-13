# Shoulder Fire-Control Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为三类现有武器增加贴身肩载火控表现，使人物移动朝向与自动攻击方向解耦，并把手枪额外弹丸表现为同一模块上的并联火控通道。

**Architecture:** 保留现有 `PrototypeScene`、武器控制流、投射物出生位置和所有数值语义。新增纯函数 `weaponRigPresentation` 将只读武器快照映射成冻结的八方向展示状态；`weaponRigView` 只拥有 Phaser 显示对象、tween 和短曳光。武器成功锁定目标后发送可选表现通知，通知缺失或失败不得影响 `didAttack`、冷却、伤害、目标或弹道。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node `node:test`、OpenAI `image_gen`、现有 manifest/fallback/asset-register 合同。

## Global Constraints

- 仅在 `feature/ui-art-overhaul` worktree 实施；保留既有未跟踪 `.superpowers/`。
- 不修改自动目标选择、攻击触发条件、伤害、冷却、bullet body、真实出生位置、速度、射程、穿透、升级概率、AI、刷怪、Boss、胜负、六分钟时间轴和存档。
- 人物身体继续由移动速度决定朝向；肩载模块只读取已有攻击角度。
- 实际弹丸继续从现有玩家物理位置生成；模块只移动枪口火光并绘制短曳光。
- 保持 `player-opening-sheet` key、576×192 尺寸、48×48 单帧、48 帧、脚底基准和 physics geometry。
- 三个新模块纹理必须同时进入 manifest、fallback 和 `docs/art/asset-register.md`。
- 所有控制器、tween、显示对象和监听器必须在 pause/restart/shutdown/destroy 路径幂等清理。
- 每个任务严格 RED→GREEN；实现后做规格审查和代码质量审查。
- 最终门槛：全量 `node --test`、`npm run build`、`git diff --check`、960×540 WebGL smoke、console warn/error 0、独立代码与视觉复审无 Critical/Important。

## File Map

- `src/art/weaponRigPresentation.js`：纯数据校验、八方向量化和三武器展示状态。
- `src/art/weaponRigView.js`：创建、更新、暂停、开火和销毁肩载模块显示对象。
- `src/assets/manifest.js`、`src/assets/fallbackTextureFactory.js`：三个稳定模块 key、生产 PNG 和 fallback。
- `src/main.js`、`src/scene/systems.js`：创建、逐帧更新、暂停与销毁。
- `src/scene/weapons.js`：三武器成功锁定后的可选表现通知；玩法控制流保持不变。
- `src/config/upgrades.js`：只把手枪额外弹丸文案改为“并联火控”，`apply` 原样保留。
- `public/assets/art/weapons/rig-*.png`：三个 768×96、每帧 96×96 的八方向透明模块 spritesheet。
- `public/assets/art/characters/player-opening-sheet.png`：低姿态操作员正式 48 帧素材。
- `test/weapon-rig-presentation.test.js`、`test/weapon-rig-view.test.js`、`test/weapon-rig-lifecycle.test.js`、`test/weapon-rig-weapons.test.js`：模型、控制器、生命周期和三武器接入合同。
- `test/art-assets.test.js`、`docs/art/asset-register.md`：真实像素与来源门禁。

---

### Task 1: Lock the pure shoulder-rig presentation model

**Files:**
- Create: `src/art/weaponRigPresentation.js`
- Create: `test/weapon-rig-presentation.test.js`

**Interfaces:**
- Consumes: 只读 `{ weaponId, aimAngle, hasTarget, targetAgeMs, paused, isReloading, projectileCount, currentShells, magazineSize, chainTargets, cooldownRatio, outageStrength }`。
- Produces: `quantizeWeaponRigDirection(angle, fallbackIndex)`、`createWeaponRigPresentation(input, previousState)`、`createWeaponRigFireSnapshot(input, previousDirectionIndex)`。

- [ ] **Step 1: Write the failing pure-model tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createWeaponRigFireSnapshot,
  createWeaponRigPresentation,
  quantizeWeaponRigDirection
} from "../src/art/weaponRigPresentation.js";

test("weapon rig quantizes finite angles into eight Phaser screen directions", () => {
  assert.equal(quantizeWeaponRigDirection(0), 0);
  assert.equal(quantizeWeaponRigDirection(Math.PI / 4), 1);
  assert.equal(quantizeWeaponRigDirection(Math.PI / 2), 2);
  assert.equal(quantizeWeaponRigDirection(Math.PI), 4);
  assert.equal(quantizeWeaponRigDirection(-Math.PI / 2), 6);
  assert.equal(quantizeWeaponRigDirection(Number.NaN, 7), 7);
});

test("pistol channels clamp to the existing one-to-five contract", () => {
  assert.equal(createWeaponRigPresentation({ weaponId: "pistol", projectileCount: -2 }).channelCount, 1);
  assert.equal(createWeaponRigPresentation({ weaponId: "pistol", projectileCount: 5 }).channelCount, 5);
  assert.equal(createWeaponRigPresentation({ weaponId: "pistol", projectileCount: 99 }).channelCount, 5);
});

test("shotgun reload and Tesla charge map existing read-only state", () => {
  const shotgun = createWeaponRigPresentation({
    weaponId: "shotgun", hasTarget: true, isReloading: true,
    currentShells: 2, magazineSize: 4
  });
  assert.equal(shotgun.mode, "reloading");
  assert.equal(shotgun.shellCount, 2);
  assert.equal(shotgun.magazineSize, 4);

  const tesla = createWeaponRigPresentation({
    weaponId: "tesla", hasTarget: true, chainTargets: 99,
    cooldownRatio: 0.25, outageStrength: 2
  });
  assert.equal(tesla.mode, "charging");
  assert.equal(tesla.coilNodes, 8);
  assert.equal(tesla.cooldownRatio, 0.25);
  assert.equal(tesla.outageStrength, 1);
});

test("unknown weapons stow and invalid aim preserves the last direction", () => {
  const previous = createWeaponRigPresentation({ weaponId: "shotgun", aimAngle: Math.PI / 2, hasTarget: true });
  const state = createWeaponRigPresentation({ weaponId: "unknown", aimAngle: Infinity, hasTarget: true }, previous);
  assert.equal(state.weaponId, null);
  assert.equal(state.mode, "travel");
  assert.equal(state.directionIndex, previous.directionIndex);
  assert.ok(Object.isFrozen(state));
});

test("lost targets hold aim for 250ms before returning to travel", () => {
  assert.equal(createWeaponRigPresentation({
    weaponId: "pistol", hasTarget: false, targetAgeMs: 249
  }).mode, "aiming");
  assert.equal(createWeaponRigPresentation({
    weaponId: "pistol", hasTarget: false, targetAgeMs: 250
  }).mode, "travel");
});

test("fire snapshots expose display data only", () => {
  assert.deepEqual(createWeaponRigFireSnapshot({
    weaponId: "tesla", aimAngle: -Math.PI / 4, firedAtMs: 1200,
    chainTargets: 6, anchorX: 400, anchorY: 300
  }), {
    weaponId: "tesla", directionIndex: 7, aimAngle: -Math.PI / 4,
    firedAtMs: 1200, channelCount: 1, shellCount: 0,
    magazineSize: 0, coilNodes: 6, anchorX: 400, anchorY: 300
  });
});
```

- [ ] **Step 2: Run RED**

Run: `node --test test/weapon-rig-presentation.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/art/weaponRigPresentation.js`.

- [ ] **Step 3: Implement the minimal frozen model**

```js
const WEAPON_IDS = new Set(["pistol", "shotgun", "tesla"]);
export const TRAVEL_DIRECTION_INDEX = 3;
const STEP = Math.PI / 4;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(finite(value, min))));

export function quantizeWeaponRigDirection(angle, fallbackIndex = TRAVEL_DIRECTION_INDEX) {
  if (!Number.isFinite(angle)) return clampInt(fallbackIndex, 0, 7);
  const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
  return (Math.round(normalized / STEP) + 8) % 8;
}

export function createWeaponRigPresentation(input = {}, previousState = {}) {
  const weaponId = WEAPON_IDS.has(input.weaponId) ? input.weaponId : null;
  const directionIndex = quantizeWeaponRigDirection(input.aimAngle, previousState.directionIndex);
  const targetAgeMs = Math.max(0, finite(input.targetAgeMs, Number.POSITIVE_INFINITY));
  const hasTarget = Boolean(weaponId && (input.hasTarget || targetAgeMs < 250));
  const paused = Boolean(input.paused);
  const mode = !hasTarget || paused || !weaponId
    ? "travel"
    : input.isReloading ? "reloading"
      : weaponId === "tesla" && finite(input.cooldownRatio, 1) < 1 ? "charging"
        : "aiming";
  return Object.freeze({
    weaponId, mode, paused, directionIndex,
    aimAngle: finite(input.aimAngle, finite(previousState.aimAngle, 0)),
    channelCount: weaponId === "pistol" ? clampInt(input.projectileCount, 1, 5) : 1,
    shellCount: weaponId === "shotgun" ? clampInt(input.currentShells, 0, 99) : 0,
    magazineSize: weaponId === "shotgun" ? clampInt(input.magazineSize, 0, 99) : 0,
    coilNodes: weaponId === "tesla" ? clampInt(input.chainTargets, 1, 8) : 0,
    targetAgeMs,
    cooldownRatio: Math.min(1, Math.max(0, finite(input.cooldownRatio, 1))),
    outageStrength: Math.min(1, Math.max(0, finite(input.outageStrength, 0)))
  });
}

export function createWeaponRigFireSnapshot(input = {}, previousDirectionIndex = TRAVEL_DIRECTION_INDEX) {
  const state = createWeaponRigPresentation({ ...input, hasTarget: true }, { directionIndex: previousDirectionIndex });
  return Object.freeze({
    weaponId: state.weaponId, directionIndex: state.directionIndex, aimAngle: state.aimAngle,
    firedAtMs: finite(input.firedAtMs, 0), channelCount: state.channelCount,
    shellCount: state.shellCount, magazineSize: state.magazineSize, coilNodes: state.coilNodes,
    anchorX: finite(input.anchorX, 0), anchorY: finite(input.anchorY, 0)
  });
}
```

- [ ] **Step 4: Run GREEN and boundary tests**

Run: `node --test test/weapon-rig-presentation.test.js test/character-presentation.test.js test/presentation-rules.test.js`

Expected: PASS; `weaponRigPresentation.js` has no Phaser import or Scene writes.

- [ ] **Step 5: Commit**

```bash
git add src/art/weaponRigPresentation.js test/weapon-rig-presentation.test.js
git commit -m "feat(art): model shoulder fire-control presentation"
```

---

### Task 2: Add production module assets, manifest entries and fallbacks

**Files:**
- Create: `public/assets/art/weapons/rig-pistol.png`
- Create: `public/assets/art/weapons/rig-breacher.png`
- Create: `public/assets/art/weapons/rig-tesla.png`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`
- Modify: `docs/art/asset-register.md`
- Modify: `test/art-assets.test.js`

**Interfaces:**
- Consumes: existing weapon icon palette and manifest/spritesheet/fallback contract.
- Produces: `TEXTURES.weaponRigPistol`、`TEXTURES.weaponRigBreacher`、`TEXTURES.weaponRigTesla`; each resolves to a 768×96 transparent PNG containing eight 96×96 direction frames or an equivalent generated fallback sheet.

- [ ] **Step 1: Add failing manifest and PNG tests**

Add these exact entries to the approved spritesheet list and dimensions to the expected map:

```js
{ key: "weapon-rig-pistol", path: "assets/art/weapons/rig-pistol.png", frameConfig: { frameWidth: 96, frameHeight: 96 } },
{ key: "weapon-rig-breacher", path: "assets/art/weapons/rig-breacher.png", frameConfig: { frameWidth: 96, frameHeight: 96 } },
{ key: "weapon-rig-tesla", path: "assets/art/weapons/rig-tesla.png", frameConfig: { frameWidth: 96, frameHeight: 96 } }
```

```js
assert.equal(TEXTURES.weaponRigPistol, "weapon-rig-pistol");
assert.equal(TEXTURES.weaponRigBreacher, "weapon-rig-breacher");
assert.equal(TEXTURES.weaponRigTesla, "weapon-rig-tesla");
for (const key of ["weapon-rig-pistol", "weapon-rig-breacher", "weapon-rig-tesla"]) {
  assert.deepEqual(expected.get(key), { width: 768, height: 96, frameCount: 8 });
}
```

Extend the fallback source test so each new key has `ensureTexture(...)`, `generateTexture(..., 768, 96)` and eight registered 96×96 frames. Assert all three rig sheets use hard alpha and at most 32 visible colors per sheet.

- [ ] **Step 2: Run RED**

Run: `node --test test/art-assets.test.js`

Expected: FAIL because the three fields and files do not exist.

- [ ] **Step 3: Generate three assets with the `imagegen` skill**

Use only the matching existing icon as reference (`pistol.png`、`breacher.png`、`tesla.png`). Prompt:

```text
Edit this exact SCP Survivor weapon icon into a compact Foundation shoulder-mounted fire-control module head. Produce one horizontal eight-frame direction sheet in this exact order: east, south-east, south, south-west, west, north-west, north, north-east. Every cell is exactly 96x96 with identical center pivot, scale, lighting and silhouette volume. Preserve the weapon identity, dark naval-gray metal, unlit cyan/red indicator housings, crisp high-detail pixel-art edges, transparent background, no human, no floating parts, no text, no logo, no scenery. Active glow will be drawn separately in game. Add a short armored pivot collar at the center of every frame so it visibly mounts to a backpack actuator. Total canvas exactly 768x96.
```

Add per weapon: pistol has sockets for five parallel channels; breacher has a hydraulic recoil sleeve and box-feed interface; Tesla has twin coils and eight small node lights. Reject scenery, text, soft blur, wrong perspective or unrecognizable weapon identity.

- [ ] **Step 4: Normalize, register and add fallbacks**

Reject any generated sheet whose grid, frame order or pivot drifts. Correct individual cells with nearest-neighbor pixel editing; never obtain the other directions by runtime rotation. Each final PNG must be exactly 768×96 RGBA, transparent padded, hard alpha `{0,255}`, ≤32 visible colors, nearest-neighbor only, with eight consistent 96×96 frames. Record the imagegen output path, reference path, per-frame corrections, modification and rights review in `docs/art/asset-register.md`.

Add keys and assets:

```js
weaponRigPistol: "weapon-rig-pistol",
weaponRigBreacher: "weapon-rig-breacher",
weaponRigTesla: "weapon-rig-tesla",
```

```js
{ key: TEXTURES.weaponRigPistol, path: "assets/art/weapons/rig-pistol.png", frameConfig: { frameWidth: 96, frameHeight: 96 } },
{ key: TEXTURES.weaponRigBreacher, path: "assets/art/weapons/rig-breacher.png", frameConfig: { frameWidth: 96, frameHeight: 96 } },
{ key: TEXTURES.weaponRigTesla, path: "assets/art/weapons/rig-tesla.png", frameConfig: { frameWidth: 96, frameHeight: 96 } },
```

Append these entries to `SPRITESHEET_ASSETS`, not `IMAGE_ASSETS`. Add three existence-guarded 768×96 fallback sheets with a centered rear pivot and distinct pistol/breacher/Tesla silhouettes in every direction; register numeric frames `0..7` after generation so the view uses the same API for production and fallback textures.

- [ ] **Step 5: Run GREEN and build**

Run:

```bash
node --test test/art-assets.test.js
npm run build
```

Expected: PASS; build loads 18 image entries and 5 spritesheet entries without duplicate keys.

- [ ] **Step 6: Commit**

```bash
git add public/assets/art/weapons/rig-pistol.png public/assets/art/weapons/rig-breacher.png public/assets/art/weapons/rig-tesla.png src/assets/manifest.js src/assets/fallbackTextureFactory.js docs/art/asset-register.md test/art-assets.test.js
git commit -m "feat(art): add Foundation shoulder module assets"
```

## Task 3: Build the Phaser weapon-rig view controller

**Files:**

- Create: `src/art/weaponRigView.js`
- Create: `test/weapon-rig-view.test.js`

- [ ] **Step 1: Write failing controller-contract tests**

Create a minimal Phaser scene stub with `add.graphics()`, `add.image()`, `tweens.add()` and destroyable objects. Test this public API:

```js
const rig = createWeaponRigView(scene, { depth: 16 });

assert.equal(typeof rig.update, "function");
assert.equal(typeof rig.fire, "function");
assert.equal(typeof rig.setPaused, "function");
assert.equal(typeof rig.destroy, "function");
assert.ok(rig.objects.length >= 5);
```

Add assertions that:

- `update(snapshot, deltaMs)` shows only the selected weapon head, uses `setFrame(directionIndex)` and never runtime-rotates pixel art;
- an unknown weapon leaves only the generic backpack/pivot in a stowed pose and does not fire;
- target age 249ms holds the last aim while 250ms produces the travel pose;
- pistol channels 1–5, shotgun shells/reload and Tesla coil nodes/charge are drawn on the reusable status `Graphics`;
- outage strength dims only the status-light drawing, not the physical module image;
- `fire()` reuses one muzzle object and one tracer object instead of allocating per shot;
- `setPaused(true)` prevents new fire tweens and pauses existing owned tweens;
- `destroy()` stops owned tweens, destroys every owned object and is idempotent;
- `update()` and `fire()` never mutate their input snapshots.

- [ ] **Step 2: Run RED**

Run: `node --test test/weapon-rig-view.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/art/weaponRigView.js`.

- [ ] **Step 3: Implement the controller with reusable Phaser objects**

Export:

```js
export function createWeaponRigView(scene, { depth = 16 } = {}) {
  return { objects, update, fire, setPaused, destroy };
}
```

Own exactly one backpack base `Graphics`, one pivot/status `Graphics`, three module `Image` objects, one muzzle `Graphics` and one tracer `Graphics`. All objects start hidden so the title and armory cannot expose the module before the mission starts. Keep every tween created by the controller in a `Set`; remove completed tweens from the set. Never create a Phaser object from `update()` or `fire()`.

`update(snapshot, deltaMs)` must call the pure presentation model, select the matching module texture, position the rig from the player's display position, select frame `0..7` without rotating the image, and apply the module state. The pure model's 250ms target grace determines when the module returns to travel. Unknown weapon keys hide all module heads while leaving the generic base stowed. Redraw channel, shell/reload and coil/charge indicators on the pivot/status `Graphics`; a power-outage snapshot dims only these indicators and must not hide or fade the physical module.

`fire(snapshot)` must call the pure fire-presentation model, place the muzzle effect at the shoulder module muzzle, and draw a short tracer toward the existing center-origin projectile path. Stop and replace the prior muzzle/tracer tween before replaying it. This is a visual bridge only: it must not create projectiles, change attack timing or alter a target.

`setPaused(paused)` pauses or resumes only tweens owned by this controller. `destroy()` stops tweens, clears the set, destroys all owned objects and tolerates repeated calls.

- [ ] **Step 4: Run GREEN and regression tests**

Run:

```bash
node --test test/weapon-rig-presentation.test.js test/weapon-rig-view.test.js
node --test
```

Expected: PASS with no leaked tween or object assertions.

- [ ] **Step 5: Commit**

```bash
git add src/art/weaponRigView.js test/weapon-rig-view.test.js
git commit -m "feat(art): render the shoulder fire-control rig"
```

## Task 4: Attach the rig to the gameplay Scene lifecycle

**Files:**

- Modify: `src/main.js`
- Modify: `src/scene/systems.js`
- Create: `test/weapon-rig-lifecycle.test.js`

- [ ] **Step 1: Write failing lifecycle and source-order tests**

Use a scene stub to verify that the rig is created only after `createPlayer()` has produced `scene.player`, receives one update after `syncCharacterPresentation(scene)`, pauses and resumes with gameplay systems, and is destroyed and nulled during teardown. Force the controller factory to throw once and assert the Scene still reaches the title screen with `weaponRigView === null`, so legacy attacks remain available.

Add source-contract assertions that:

```js
assert.ok(createPlayerIndex < createWeaponRigViewIndex);
assert.ok(syncCharacterIndex < weaponRigUpdateIndex);
assert.match(mainSource, /weaponRigView\?\.destroy\(\)/);
```

Also assert that no rig lifecycle source writes `player.body`, `player.velocity`, `player.x`, `player.y`, enemy state, weapon cooldowns, damage or save data.

- [ ] **Step 2: Run RED**

Run: `node --test test/weapon-rig-lifecycle.test.js`

Expected: FAIL because `PrototypeScene` does not yet create or update the rig.

- [ ] **Step 3: Create and update the rig in gameplay only**

After `createPlayer(this)`, initialize the visual aim cache, then create the optional controller inside one local `try/catch`:

```js
this.weaponRigHasTarget = false;
this.weaponRigAimAngle = 0;
this.weaponRigLastTargetAtMs = Number.NEGATIVE_INFINITY;
try {
  this.weaponRigView = createWeaponRigView(this, { depth: 16 });
} catch (error) {
  console.warn("Shoulder fire-control presentation disabled", error);
  this.weaponRigView = null;
}
```

After `syncCharacterPresentation(this)` in the gameplay update loop, read the selected weapon once and pass a new frozen snapshot plus the current `delta`. It contains `anchorX`, `anchorY`, `weaponId`, `aimAngle`, `hasTarget`, `targetAgeMs`, `projectileCount`, `currentShells`, `magazineSize`, `isReloading`, `chainTargets`, `cooldownRatio`, `outageStrength` and `paused`. Compute `targetAgeMs` as `elapsedSurvivalMs - weaponRigLastTargetAtMs`; compute `cooldownRatio` from the already existing `nextAttackAtMs` and `cooldownMs` without writing either field. Do not expose the live player or weapon objects to the controller.

The controller may exist hidden after player creation, but title and armory must not display it, and result screens must freeze it without creating or updating a second controller. Preserve existing player body size, display scale, movement-facing behavior and depth ordering.

- [ ] **Step 4: Integrate pause, resume and teardown**

In the existing gameplay pause/resume functions, call `this.weaponRigView?.setPaused(true)` and `this.weaponRigView?.setPaused(false)`. In the existing idempotent manager teardown, destroy the controller and set the reference to `null` so both `SHUTDOWN` and `DESTROY` remain safe. Because all rig objects start hidden and update runs only during an active mission, title and armory remain module-free; pause, level-up and result paths freeze owned effects without replaying missed fire on resume.

- [ ] **Step 5: Run GREEN and full tests**

Run:

```bash
node --test test/weapon-rig-lifecycle.test.js test/weapon-rig-view.test.js
node --test
```

Expected: PASS; existing restart and pause contracts remain unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/main.js src/scene/systems.js test/weapon-rig-lifecycle.test.js
git commit -m "feat(art): attach the shoulder rig lifecycle"
```

## Task 5: Connect existing weapon fire to presentation snapshots

**Files:**

- Modify: `src/scene/weapons.js`
- Modify: `src/config/upgrades.js`
- Create: `test/weapon-rig-weapons.test.js`

- [ ] **Step 1: Write failing gameplay-preservation tests**

For pistol, shotgun and Tesla, execute the existing attack function once with no controller and once with a spy controller. Assert both runs produce identical projectile or chain counts, angles, damage values, cooldowns, ammunition changes and selected targets. The only additional result may be one presentation snapshot.

Assert the snapshots contain:

```js
{
  weaponId,
  anchorX,
  anchorY,
  aimAngle,
  firedAtMs,
  projectileCount, // pistol
  currentShells,
  magazineSize,    // shotgun
  isReloading,
  chainTargets,    // Tesla actual chain count
  cooldownRatio
}
```

Tesla's snapshot uses the angle to its first existing chain target, while its damage chain and target order remain byte-for-byte equivalent. Repeat each comparison with a controller whose `fire()` throws; attacks must still complete with identical gameplay results and the broken controller must be disabled. Add source-contract guards proving no projectile spawn, damage call, shell decrement, cooldown assignment or return value depends on `weaponRigView` or the result of `fire()`.

- [ ] **Step 2: Run RED**

Run: `node --test test/weapon-rig-weapons.test.js`

Expected: FAIL because no weapon publishes presentation snapshots.

- [ ] **Step 3: Publish optional snapshots without changing attacks**

At the start of each existing `updateWeapons()` tick, reset only the visual flag:

```js
this.weaponRigHasTarget = false;
```

Add a presentation-only `notifyWeaponRigFire(snapshot)` helper to the weapons mixin. It freezes a copied snapshot, calls the optional controller inside `try/catch`, and on a presentation exception destroys and nulls that controller without changing or re-running the attack. When an existing attack has already selected a valid target and committed its normal gameplay state, set `weaponRigHasTarget`, `weaponRigAimAngle` and `weaponRigLastTargetAtMs`, then call this helper. Ignore its return value.

- Pistol: publish the existing base angle and current clamped projectile count after normal target selection.
- Shotgun: keep the current `playerFacingAngle = baseAngle` assignment and shell logic intact; publish the remaining shells, magazine size and reload state after decrement.
- Tesla: calculate a visual base angle to the already selected first target, then publish the actual completed chain count and `cooldownRatio: 0` after the chain is committed; the per-frame snapshot advances the ratio from existing cooldown fields. Do not change chain selection or damage.

Modify the legacy `spawnMuzzleFlash` entry point to return before creating its old center-origin flash when a rig controller exists. Keep the complete old implementation as fallback when the controller is absent.

- [ ] **Step 4: Rename only the pistol upgrade copy**

In `src/config/upgrades.js`, change the display name `额外弹丸` to `并联火控`, and describe adding one synchronized module channel. Preserve the upgrade key, weight, maximum, apply callback and projectile-count clamp exactly.

- [ ] **Step 5: Run GREEN and full regression tests**

Run:

```bash
node --test test/weapon-rig-weapons.test.js test/weapon-rig-lifecycle.test.js
node --test
```

Expected: PASS; all before/after gameplay values are identical.

- [ ] **Step 6: Commit**

```bash
git add src/scene/weapons.js src/config/upgrades.js test/weapon-rig-weapons.test.js
git commit -m "feat(art): connect weapon fire to the shoulder rig"
```

## Task 6: Convert the operator to a low-ready silhouette and complete visual acceptance

**Files:**

- Modify: `public/assets/art/characters/player-opening-sheet.png`
- Modify: `src/art/weaponRigView.js`
- Modify: `test/weapon-rig-view.test.js`
- Modify: `test/art-assets.test.js`
- Modify: `docs/art/asset-register.md`

- [ ] **Step 1: Add failing sprite and final-layout contracts**

Extend the asset test to preserve the formal player-sheet contract: exactly 576×192 RGBA, 4 rows × 12 frames, 48×48 cells, hard alpha `{0,255}`, no more than 32 visible colors, and the same opaque foot baseline at local `y = 44` in every frame. For the right-facing movement row (`row = 1`, frames `0..9`), count opaque pixels in local `x = 36..47`; require at most 8 total instead of the current 32, proving the forward-firing silhouette was removed. Require at least 220 opaque pixels inside local torso/backpack rectangle `x = 15..32, y = 8..39` in every movement frame `0..9`; the current minimum is 234, so the character cannot pass by becoming smaller.

Export and test immutable final layout constants from `weaponRigView.js`:

```js
export const WEAPON_RIG_LAYOUT = Object.freeze({
  shoulderX: 7,
  shoulderY: -13,
  moduleScale: 0.5,
  muzzleDistance: 18,
  tracerDistance: 7,
});
```

Assert that all three module heads use these constants, keep their pivot at `anchorY - 13`, render at scale `0.5`, and never read or write the player's 24×24 physics body.

- [ ] **Step 2: Run RED**

Run:

```bash
node --test test/art-assets.test.js test/weapon-rig-view.test.js
```

Expected: FAIL because the current operator still has the prominent firing weapon and the final layout constants do not exist.

- [ ] **Step 3: Edit the exact player sheet with the `imagegen` skill**

Use only `public/assets/art/characters/player-opening-sheet.png` as the reference. Prompt:

```text
Edit this exact 4-row by 12-column SCP Survivor player sprite sheet. Preserve the same Foundation operator, navy armor, backpack, helmet, palette, transparent background, exact 48x48 cell grid, four directional rows, twelve-frame movement timing, body scale and foot placement. Remove the prominently firing handheld firearm and replace it with a compact low-ready control grip or scanner held close to the torso. Do not add a shoulder weapon; that is rendered separately in game. Crisp high-detail pixel art, hard alpha, no text, no logo, no scenery, no soft blur, no frame reordering.
```

Reject any result that changes sheet dimensions, grid alignment, direction order, timing, foot baseline, character identity or uses soft alpha. Normalize to nearest-neighbor, at most 32 visible colors and hard alpha.

- [ ] **Step 4: Lock final rig placement and record provenance**

Replace local placement numbers in the view with `WEAPON_RIG_LAYOUT`. Keep all module art above the existing physics body and below HUD depth. Update the asset register with the imagegen output path, source reference, modification summary, rights review and normalized output checks for the player sheet.

- [ ] **Step 5: Run automated final gates**

Run:

```bash
node --test
npm run build
git diff --check b700f69..HEAD
```

Expected: all tests pass, Vite builds successfully, and diff check prints no output.

- [ ] **Step 6: Run the 960×540 gameplay smoke matrix**

Launch the local Vite game and capture screenshots for:

- title and armory: no shoulder module before gameplay;
- pistol: player moving opposite the target while module aims independently, with both one-channel and five-channel fire;
- shotgun: distinct recoil, shell-feed and reload/travel pose;
- Tesla: charge nodes, first-target aim and unchanged chain path;
- facility power outage: physical module remains visible while indicators dim;
- pause and level-up: module and effects freeze, then resume once;
- pause-to-title, defeat restart and Scene shutdown: no duplicate rig or stale effect;
- forced missing module textures: fallback silhouettes render with zero texture-key errors.

Confirm bullets, chains, damage, cooldowns, ammunition, movement, collision, enemy AI, upgrade odds, win/loss and save behavior match the baseline. Capture runtime console errors; expected count is zero.

- [ ] **Step 7: Request code and visual review, then fix findings**

Request a Superpowers code review against the approved design spec and `b700f69..HEAD`. The review must explicitly check presentation/gameplay separation, lifecycle cleanup, fallback behavior, object reuse, input immutability and asset provenance. Run one visual review over the smoke screenshots for silhouette clarity, independent aim readability, weapon identity and HUD occlusion. Fix every Critical or Important finding, rerun the affected tests and repeat review until none remain.

- [ ] **Step 8: Commit**

```bash
git add public/assets/art/characters/player-opening-sheet.png public/assets/art/weapons/rig-pistol.png public/assets/art/weapons/rig-breacher.png public/assets/art/weapons/rig-tesla.png src/art/weaponRigPresentation.js src/art/weaponRigView.js src/assets/manifest.js src/assets/fallbackTextureFactory.js src/main.js src/scene/systems.js src/scene/weapons.js src/config/upgrades.js test/weapon-rig-presentation.test.js test/weapon-rig-view.test.js test/weapon-rig-lifecycle.test.js test/weapon-rig-weapons.test.js test/art-assets.test.js docs/art/asset-register.md
git commit -m "feat(art): finish the shoulder fire-control presentation"
```

## Final Branch Gate

- [ ] Run the complete evidence gate from the branch root:

```bash
node --test
npm run build
git diff --check b700f69..HEAD
git status --short --branch
```

- [ ] Verify the only untracked path is the pre-existing `.superpowers/` workspace and that no files outside the plan's file map changed.
- [ ] Report branch, final HEAD, commits, test count, build result, smoke evidence, review outcome, remaining risks and Git status.
- [ ] Stop before merge, push, branch/worktree deletion, history rewrite, release or publication unless the project owner separately authorizes that exact operation.
