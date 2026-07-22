# Elite Visual Declutter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the generic yellow outline and “精英” title from every non-Boss elite while preserving the riot armor arc and all temporary combat warnings.

**Architecture:** Keep elite gameplay and state unchanged. `attachEliteVisuals()` will own only the riot-specific `shieldIndicator` plus the existing destroy/warning cleanup, and `updateEliteVisuals()` will update that shield independently instead of using the removed generic outline as a lifecycle gate.

**Tech Stack:** Phaser 3.90 Graphics, JavaScript ES modules, Node `node:test`, Vite.

## Global Constraints

- Work only in `C:\scp-survivor-workspaces\active\ui-art` on `feature/ui-art-overhaul`.
- Preserve the existing untracked `.superpowers/` directory and never stage it.
- Do not change damage, mitigation, AI, state machines, collision bodies, spawning, win/loss, timeline, persistence, player behavior, or SCP-049.
- Keep `shieldIndicator`, charge warnings, teleport warnings, hit/death effects, danger states, and Boss presentation.
- Do not add replacement titles, rarity borders, permanent icons, per-frame sprite scale, flip, or rotation.
- Do not merge or push without explicit user authorization.

---

### Task 1: Remove Generic Elite Decorations Without Breaking Functional Indicators

**Files:**
- Modify: `test/enemy-presentation.test.js`
- Modify: `src/scene/enemies.js`

**Interfaces:**
- Consumes: `getRiotArmorArcPresentation(frontArcDegrees)` from `src/art/enemyPresentation.js`.
- Preserves: `enemy.shieldIndicator`, `enemy.warningGraphic`, `attachEliteVisuals(enemy)`, and `updateEliteVisuals(enemy)`.
- Removes: runtime creation and updates of `enemy.eliteMarker` and `enemy.eliteOutline`.

- [ ] **Step 1: Replace the old decorator expectations with failing behavior tests**

Update `createEliteVisualScene()` so `clearEliteWarning()` records its calls:

```js
function createEliteVisualScene() {
  const created = {
    graphics: [],
    texts: [],
    triangles: [],
    transients: []
  };
  return {
    created,
    clearEliteWarningCalls: 0,
    add: {
      text(...args) {
        const object = createDisplaySpy("text");
        object.createArgs = args;
        created.texts.push(object);
        return object;
      },
      graphics(...args) {
        const object = createDisplaySpy("graphics");
        object.createArgs = args;
        created.graphics.push(object);
        return object;
      },
      triangle(...args) {
        const object = createDisplaySpy("triangle");
        object.createArgs = args;
        created.triangles.push(object);
        return object;
      }
    },
    registerTransientEffect(object) {
      created.transients.push(object);
    },
    clearEliteWarning() {
      this.clearEliteWarningCalls += 1;
    }
  };
}
```

Expose `attachSource` from `loadEliteVisualMethods()` for the source contract:

```js
return {
  attachEliteVisuals: new Function(
    `"use strict"; return ({${attachSource}}).attachEliteVisuals;`
  )(),
  updateEliteVisuals: new Function(
    "getRiotArmorArcPresentation",
    `"use strict"; return ({${updateSource}}).updateEliteVisuals;`
  )(enemyPresentationModule.getRiotArmorArcPresentation),
  attachSource,
  updateSource
};
```

Then replace the existing riot/non-riot decorator tests with the following contracts:

```js
test("riot elite owns only its functional armor arc and destroys it cleanly", async () => {
  const { attachEliteVisuals } = await loadEliteVisualMethods();
  const scene = createEliteVisualScene();
  const enemy = createEliteVisualEnemy("riotUnit");

  attachEliteVisuals.call(scene, enemy);

  assert.equal(scene.created.texts.length, 0);
  assert.equal(scene.created.triangles.length, 0);
  assert.equal(scene.created.graphics.length, 1);
  assert.equal(enemy.eliteMarker, undefined);
  assert.equal(enemy.eliteOutline, undefined);
  assert.equal(enemy.shieldIndicator, scene.created.graphics[0]);
  assert.deepEqual(enemy.shieldIndicator.commands, [["setDepth", 11]]);
  assert.deepEqual(scene.created.transients, [enemy.shieldIndicator]);

  enemy.listeners.get("destroy")();

  assert.equal(scene.clearEliteWarningCalls, 1);
  assert.equal(enemy.shieldIndicator.destroyCount, 1);
});

test("riot armor arc updates without a generic marker or outline", async () => {
  const { updateEliteVisuals } = await loadEliteVisualMethods();
  const shield = createDisplaySpy("shield");
  const enemy = {
    x: 145,
    y: 278,
    eliteType: "riotUnit",
    frontArcDegrees: 120,
    facingAngle: -0.625,
    shieldIndicator: shield
  };

  updateEliteVisuals.call({}, enemy);

  assert.deepEqual(shield.commands, [
    ["clear"],
    ["lineStyle", 3, 0x9fc7da, 0.95],
    ["beginPath"],
    ["arc", 0, 0, 28, -Math.PI / 3, Math.PI / 3, false],
    ["strokePath"],
    ["lineStyle", 1, 0x5f8294, 0.8],
    ["lineBetween", 22, -11, 22, 11],
    ["setPosition", enemy.x, enemy.y],
    ["setRotation", enemy.facingAngle]
  ]);
});

test("blink and biomass elites create no permanent generic decoration", async () => {
  const { attachEliteVisuals, updateEliteVisuals } = await loadEliteVisualMethods();

  for (const eliteType of ["blinkStalker", "biomass"]) {
    const scene = createEliteVisualScene();
    const enemy = createEliteVisualEnemy(eliteType);

    attachEliteVisuals.call(scene, enemy);
    updateEliteVisuals.call({}, enemy);

    assert.equal(scene.created.texts.length, 0);
    assert.equal(scene.created.graphics.length, 0);
    assert.equal(scene.created.triangles.length, 0);
    assert.deepEqual(scene.created.transients, []);
    assert.equal(enemy.eliteMarker, undefined);
    assert.equal(enemy.eliteOutline, undefined);
    assert.equal(enemy.shieldIndicator, undefined);

    enemy.listeners.get("destroy")();
    assert.equal(scene.clearEliteWarningCalls, 1);
  }
});
```

Add a source contract that rejects permanent decorator reintroduction while retaining the functional calls:

```js
test("elite visuals contain no generic title or yellow outline source path", async () => {
  const { attachSource, updateSource } = await loadEliteVisualMethods();

  assert.doesNotMatch(attachSource, /add\.text\s*\(/);
  assert.doesNotMatch(attachSource, /eliteMarker|eliteOutline/);
  assert.doesNotMatch(updateSource, /eliteMarker|eliteOutline|0xfff08e/);
  assert.match(
    updateSource,
    /getRiotArmorArcPresentation\(enemy\.frontArcDegrees\)/
  );
  assert.match(updateSource, /setRotation\(enemy\.facingAngle\)/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test test/enemy-presentation.test.js
```

Expected: FAIL because current code creates one text plus generic outline Graphics for every elite, and `updateEliteVisuals()` returns when `eliteOutline` is absent.

- [ ] **Step 3: Remove marker/outline creation and decouple armor-arc updates**

Replace the two methods in `src/scene/enemies.js` with this minimal implementation:

```js
attachEliteVisuals(enemy) {
  if (enemy.eliteType === "riotUnit") {
    const shield = this.add.graphics();
    shield.setDepth(11);
    this.registerTransientEffect(shield);
    enemy.shieldIndicator = shield;
  }

  enemy.once("destroy", () => {
    this.clearEliteWarning(enemy);
    if (enemy.shieldIndicator?.active) {
      enemy.shieldIndicator.destroy();
    }
  });
},

updateEliteVisuals(enemy) {
  if (!enemy.shieldIndicator) {
    return;
  }

  const arc = getRiotArmorArcPresentation(enemy.frontArcDegrees);
  enemy.shieldIndicator.clear();
  enemy.shieldIndicator.lineStyle(3, 0x9fc7da, 0.95);
  enemy.shieldIndicator.beginPath();
  enemy.shieldIndicator.arc(
    0,
    0,
    arc.radius,
    arc.startAngle,
    arc.endAngle,
    false
  );
  enemy.shieldIndicator.strokePath();
  enemy.shieldIndicator.lineStyle(1, 0x5f8294, 0.8);
  enemy.shieldIndicator.lineBetween(22, -11, 22, 11);
  enemy.shieldIndicator.setPosition(enemy.x, enemy.y);
  enemy.shieldIndicator.setRotation(enemy.facingAngle);
},
```

Do not modify `createChargeWarning()`, `createTeleportWarning()`, `clearEliteWarning()`, elite state transitions, or damage fields.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
node --test test/enemy-presentation.test.js test/presentation-rules.test.js test/biomass-collision-compatibility.test.js
```

Expected: PASS. Armor-arc commands, body-only biomass compatibility, and presentation source contracts remain green.

- [ ] **Step 5: Run full verification**

Run:

```powershell
node --test
npm run build
git diff --check 557d534..HEAD
git status --short --branch
```

Expected: all tests pass; build succeeds with only the existing large-chunk warning; diff check emits no output; status contains only intended tracked edits plus the existing untracked `.superpowers/` before commit.

- [ ] **Step 6: Commit the implementation**

```powershell
git add -- src/scene/enemies.js test/enemy-presentation.test.js
git commit -m "fix(art): remove generic elite decorations"
```

Expected: exactly the two authorized files are committed and `.superpowers/` remains untracked.

---

### Task 2: Independent Review and User Smoke Handoff

**Files:**
- Verify only: `src/scene/enemies.js`
- Verify only: `test/enemy-presentation.test.js`
- Temporary, never stage: `.superpowers/sdd/elite-visual-declutter-review/**`

**Interfaces:**
- Consumes: the Task 1 commit.
- Produces: review evidence and a fixed-port manual-smoke handoff.

- [ ] **Step 1: Request an independent code review**

Review the Task 1 range against `docs/superpowers/specs/2026-07-15-elite-visual-declutter-design.md`. The reviewer must confirm:

- no generic text/outline object is created for riot, blink, or biomass;
- the riot armor arc still draws and rotates from existing gameplay state;
- charge/teleport warnings and destroy cleanup remain functional;
- no gameplay, body, AI, damage, timing, player, Boss, texture, or spritesheet changes exist;
- tests execute the real method bodies and would fail if the yellow outline or title returned.

Fix every Critical or Important finding with a new RED/GREEN loop and a separate `fix(art): ...` commit, then re-review.

- [ ] **Step 2: Re-run final automated gates after review**

```powershell
node --test
npm run build
git diff --check 557d534..HEAD
git status --short --branch
```

Expected: all tests pass, build succeeds, diff check is clean, and only `.superpowers/` is untracked.

- [ ] **Step 3: Hand off fixed-port manual smoke**

Read-only check port `64126`. If free, run:

```powershell
npm run dev -- --host 127.0.0.1 --port 64126 --strictPort
```

Give the user `http://localhost:64126/` and ask them to confirm:

- no yellow generic outline appears around any elite;
- no “精英” title follows any elite;
- riot armor arc, charge warning, and blink teleport warning remain visible and correctly aligned;
- no runtime, missing-texture, or duplicate-animation errors appear.

Do not kill an unknown process if the port is occupied.
