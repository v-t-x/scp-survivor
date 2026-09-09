import test from "node:test";
import assert from "node:assert/strict";
import {
  closePerkStoreController,
  menusMixin,
  openPerkStoreController
} from "../src/scene/menus.js";
import { createPerkStoreWithFallback } from "../src/art/perkStoreView.js";

function withLocalStorage(t, localStorage) {
  const previousWindow = globalThis.window;
  t.after(() => {
    globalThis.window = previousWindow;
  });
  globalThis.window = { localStorage };
}

// Break caught: moving a presentation step before the domain save, omitting a
// later refresh, or allowing a repeated pointer event to purchase twice.
test("purchase deducts saves sounds and refreshes once", (t) => {
  const writes = [];
  const calls = [];
  withLocalStorage(t, {
    setItem(key, value) {
      writes.push([key, JSON.parse(value)]);
      calls.push(["save"]);
    }
  });
  const scene = {
    meta: { credits: 200, perks: {} },
    weaponSelectCreditsLabel: null,
    playSound(key) { calls.push(["sound", key]); },
    refreshPerkStore() { calls.push(["refresh"]); },
    refreshWeaponSelectionVisuals() { calls.push(["armory"]); }
  };

  menusMixin.purchasePerk.call(scene, "startMaxHealth");

  assert.deepEqual(scene.meta, {
    credits: 50,
    perks: { startMaxHealth: true }
  });
  assert.equal(writes.length, 1);
  assert.deepEqual(calls, [
    ["save"],
    ["sound", "levelUp"],
    ["refresh"],
    ["armory"]
  ]);
});

// Break caught: a persistence exception rolling back the committed in-memory
// purchase or preventing its visual reconciliation.
test("storage failure preserves the in-memory purchase and continues presentation", (t) => {
  const order = [];
  withLocalStorage(t, {
    setItem() {
      order.push("save");
      throw new Error("blocked");
    }
  });
  const scene = {
    meta: { credits: 150, perks: {} },
    playSound() { order.push("sound"); },
    refreshPerkStore() { order.push("store"); },
    refreshWeaponSelectionVisuals() { order.push("armory"); }
  };

  assert.doesNotThrow(() => menusMixin.purchasePerk.call(scene, "startMaxHealth"));
  assert.deepEqual(scene.meta, {
    credits: 0,
    perks: { startMaxHealth: true }
  });
  assert.deepEqual(order, ["save", "sound", "store", "armory"]);
});

// Break caught: unknown, owned, or unaffordable requests causing any durable
// mutation, audio, or presentation work.
test("unknown owned and insufficient purchases have no side effects", (t) => {
  let writes = 0;
  withLocalStorage(t, {
    setItem() { writes += 1; }
  });
  const scene = {
    meta: { credits: 100, perks: { startMaxHealth: true } },
    playSound() { throw new Error("must not play"); },
    refreshPerkStore() { throw new Error("must not refresh"); },
    refreshWeaponSelectionVisuals() { throw new Error("must not refresh armory"); }
  };

  for (const key of ["unknown", "startMaxHealth", "startDamage"]) {
    menusMixin.purchasePerk.call(scene, key);
  }

  assert.equal(writes, 0);
  assert.deepEqual(scene.meta, {
    credits: 100,
    perks: { startMaxHealth: true }
  });
});

// Break caught: optional audio or either presenter throwing after commitment
// and either escaping as a false purchase failure or permitting a second buy.
test("approved presentation resilience keeps one committed purchase across audio and refresh failures", (t) => {
  let writes = 0;
  withLocalStorage(t, {
    setItem() { writes += 1; }
  });

  for (const failureAt of ["sound", "store", "armory"]) {
    const order = [];
    const scene = {
      meta: { credits: 300, perks: {} },
      playSound() {
        order.push("sound");
        if (failureAt === "sound") throw new Error("audio failed");
      },
      refreshPerkStore() {
        order.push("store");
        if (failureAt === "store") throw new Error("store refresh failed");
      },
      refreshWeaponSelectionVisuals() {
        order.push("armory");
        if (failureAt === "armory") throw new Error("armory refresh failed");
      }
    };

    assert.doesNotThrow(() => menusMixin.purchasePerk.call(scene, "startDamage"));
    assert.doesNotThrow(() => menusMixin.purchasePerk.call(scene, "startDamage"));
    assert.equal(scene.meta.credits, 50);
    assert.equal(scene.meta.perks.startDamage, true);
    assert.deepEqual(order, ["sound", "store", "armory"]);
  }
  assert.equal(writes, 3);
});

// Break caught: repeated opens constructing duplicate controllers, or close
// clearing the selected weapon instead of only resetting hover presentation.
test("open is idempotent and close preserves pending selection", () => {
  const controller = {
    refreshCalls: 0,
    destroyCalls: 0,
    refresh() { this.refreshCalls += 1; },
    destroy() { this.destroyCalls += 1; }
  };
  let factoryCalls = 0;
  const scene = {
    meta: { credits: 0, perks: {} },
    pendingSelectedWeaponId: "tesla",
    weaponSelectHoveredCardId: "pistol",
    perkStoreController: null,
    purchasePerk() {},
    startMissionButtonController: {},
    refreshWeaponSelectionVisualsCalls: 0,
    refreshWeaponSelectionVisuals() {
      this.refreshWeaponSelectionVisualsCalls += 1;
    }
  };
  const factory = () => {
    factoryCalls += 1;
    return controller;
  };

  assert.equal(openPerkStoreController(scene, factory), controller);
  assert.equal(openPerkStoreController(scene, factory), controller);
  assert.equal(closePerkStoreController(scene), true);
  assert.equal(closePerkStoreController(scene), false);

  assert.equal(factoryCalls, 1);
  assert.equal(controller.destroyCalls, 1);
  assert.equal(scene.refreshWeaponSelectionVisualsCalls, 1);
  assert.equal(scene.pendingSelectedWeaponId, "tesla");
  assert.equal(scene.weaponSelectHoveredCardId, null);
  assert.equal(scene.perkStoreController, null);
});

// Break caught: a store factory failure leaving a fake Scene ownership
// reference or touching the existing armory selection and deploy controls.
test("double store factory failure leaves the armory ownership untouched", () => {
  const scene = {
    meta: { credits: 0, perks: {} },
    pendingSelectedWeaponId: "tesla",
    weaponSelectCards: [{ id: "pistol" }, { id: "tesla" }],
    startMissionButtonController: { active: true },
    purchasePerk() {},
    refreshWeaponSelectionVisuals() {
      throw new Error("must not refresh when opening failed");
    }
  };
  const store = openPerkStoreController(scene, (target, options) =>
    createPerkStoreWithFallback(target, options, {
      createProduction() { throw new Error("production unavailable"); },
      createLegacy() { throw new Error("legacy unavailable"); }
    })
  );

  assert.equal(store, null);
  assert.equal(scene.perkStoreController, null);
  assert.equal(scene.pendingSelectedWeaponId, "tesla");
  assert.equal(scene.weaponSelectCards.length, 2);
  assert.equal(scene.startMissionButtonController.active, true);
});

// Break caught: production view failure preventing a legacy controller from
// forwarding its purchase and close callbacks through Scene-owned commands.
test("legacy fallback keeps purchase and return actions usable", () => {
  let capturedOptions = null;
  const scene = {
    meta: { credits: 200, perks: {} },
    pendingSelectedWeaponId: "pistol",
    weaponSelectHoveredCardId: "tesla",
    startMissionButtonController: {},
    purchasePerkCalls: [],
    purchasePerk(key) { this.purchasePerkCalls.push(key); },
    closePerkStore() { return closePerkStoreController(this); },
    refreshWeaponSelectionVisualsCalls: 0,
    refreshWeaponSelectionVisuals() { this.refreshWeaponSelectionVisualsCalls += 1; }
  };
  const controller = openPerkStoreController(scene, (target, options) =>
    createPerkStoreWithFallback(target, options, {
      createProduction() { throw new Error("production unavailable"); },
      createLegacy(_legacyTarget, legacyOptions) {
        capturedOptions = legacyOptions;
        return {
          kind: "legacy",
          refresh() {},
          destroy() {}
        };
      }
    })
  );

  assert.equal(controller?.kind, "legacy");
  capturedOptions.onPurchase("startMaxHealth");
  capturedOptions.onClose();

  assert.deepEqual(scene.purchasePerkCalls, ["startMaxHealth"]);
  assert.equal(scene.perkStoreController, null);
  assert.equal(scene.pendingSelectedWeaponId, "pistol");
  assert.equal(scene.weaponSelectHoveredCardId, null);
  assert.equal(scene.refreshWeaponSelectionVisualsCalls, 1);
});

// Break caught: cleanup exceptions reattaching the controller or preventing
// the armory refresh attempt needed to restore its hover baseline.
test("close detaches store ownership despite destroy and armory refresh failures", () => {
  for (const failureAt of ["destroy", "armory"]) {
    const controller = {
      destroy() {
        if (failureAt === "destroy") throw new Error("destroy failed");
      }
    };
    const scene = {
      perkStoreController: controller,
      pendingSelectedWeaponId: "tesla",
      weaponSelectHoveredCardId: "pistol",
      startMissionButtonController: {},
      refreshWeaponSelectionVisuals() {
        if (failureAt === "armory") throw new Error("armory failed");
      }
    };

    assert.equal(closePerkStoreController(scene), true);
    assert.equal(scene.perkStoreController, null);
    assert.equal(scene.pendingSelectedWeaponId, "tesla");
    assert.equal(scene.weaponSelectHoveredCardId, null);
  }
});
