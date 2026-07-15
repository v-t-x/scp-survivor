import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createOpeningFacilityLayout } from "../src/art/openingFacilityLayout.js";

function createSceneStub({ failOnImageCall = null, failure = new Error("image creation failed") } = {}) {
  const created = [];
  let imageCalls = 0;

  function makeDisplayObject(x, y, key) {
    const object = {
      kind: "image",
      x,
      y,
      key,
      depth: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      tint: 0xffffff,
      alpha: 1,
      visible: true,
      destroyed: false,
      destroyCalls: 0,
      data: new Map(),
      setDepth(value) {
        this.depth = value;
        return this;
      },
      setRotation(value) {
        this.rotation = value;
        return this;
      },
      setScale(xScale, yScale = xScale) {
        this.scaleX = xScale;
        this.scaleY = yScale;
        return this;
      },
      setTint(value) {
        this.tint = value;
        return this;
      },
      setAlpha(value) {
        this.alpha = value;
        return this;
      },
      setVisible(value) {
        this.visible = value;
        return this;
      },
      setData(name, value) {
        this.data.set(name, value);
        return this;
      },
      destroy() {
        this.destroyCalls += 1;
        this.destroyed = true;
      }
    };
    created.push(object);
    return object;
  }

  return {
    created,
    textures: {
      exists() {
        return true;
      },
      get() {
        return { setFilter() {} };
      }
    },
    add: {
      image(x, y, key) {
        imageCalls += 1;
        if (imageCalls === failOnImageCall) throw failure;
        return makeDisplayObject(x, y, key);
      }
    }
  };
}

async function loadFacilityRoom() {
  const facilityRoom = await import("../src/art/facilityRoom.js");
  assert.equal(typeof facilityRoom.createFacilityRoomController, "function", "controller export is required");
  assert.equal(typeof facilityRoom.createFacilityRoomVisuals, "function", "compatibility façade is required");
  return facilityRoom;
}

test("facility room controller owns every semantic visual and the façade returns its objects", async () => {
  const { createFacilityRoomController, createFacilityRoomVisuals } = await loadFacilityRoom();
  const layout = createOpeningFacilityLayout(1920, 1920);
  const scene = createSceneStub();
  const controller = createFacilityRoomController(scene, 1920, 1920);

  assert.deepEqual(Object.keys(controller).sort(), ["byId", "destroy", "objects", "reset", "setPresentation"]);
  assert.ok(controller.byId instanceof Map);
  assert.equal(controller.objects.length, layout.length);
  assert.equal(scene.created.length, layout.length);

  for (const item of layout) {
    const visual = controller.byId.get(item.id);
    assert.ok(visual, `${item.id} should have one owned visual`);
    assert.equal(visual.x, item.x);
    assert.equal(visual.y, item.y);
    assert.equal(visual.key, item.key);
    assert.equal(visual.depth, item.depth);
    assert.equal(visual.rotation, item.rotation);
    assert.equal(visual.scaleX, item.scaleX);
    assert.equal(visual.scaleY, item.scaleY);
    assert.equal(visual.data.get("facilityId"), item.id);
    assert.equal(visual.data.get("facilityRole"), item.role);
    assert.equal(visual.data.get("facilityZone"), item.zone);
  }

  const façadeScene = createSceneStub();
  const visuals = createFacilityRoomVisuals(façadeScene, 1920, 1920);
  assert.equal(visuals.length, layout.length);
  assert.equal(visuals.length, façadeScene.created.length);
});

test("facility room controller rolls back created visuals and rethrows image creation failures", async () => {
  const { createFacilityRoomController } = await loadFacilityRoom();
  const failure = new Error("fourth image failed");
  const scene = createSceneStub({ failOnImageCall: 4, failure });

  assert.throws(
    () => createFacilityRoomController(scene, 1920, 1920),
    (error) => error === failure
  );
  assert.equal(scene.created.length, 3);
  assert.ok(scene.created.every(({ destroyed, destroyCalls }) => destroyed && destroyCalls === 1));
});

test("facility room presentation changes tint alpha and visibility without changing layout geometry", async () => {
  const { createFacilityRoomController } = await loadFacilityRoom();
  const layout = createOpeningFacilityLayout(1920, 1920);
  const scene = createSceneStub();
  const controller = createFacilityRoomController(scene, 1920, 1920);
  const geometry = new Map(controller.objects.map((visual) => [visual, {
    x: visual.x,
    y: visual.y,
    depth: visual.depth,
    rotation: visual.rotation,
    scaleX: visual.scaleX,
    scaleY: visual.scaleY
  }]));

  controller.setPresentation({
    ambientTint: 0x617487,
    ambientAlpha: 0.45,
    maintenanceTint: 0x947751,
    maintenanceAlpha: 0.6,
    contaminationTint: 0x8d355a,
    contaminationAlpha: 0.8,
    warningPulseAlpha: 0.5,
    visible: false
  });

  for (const item of layout) {
    const visual = controller.byId.get(item.id);
    const expected = item.zone === "contamination"
      ? { tint: 0x8d355a, alpha: 0.8 }
      : item.zone === "maintenance"
        ? { tint: 0x947751, alpha: item.role === "power-junction" ? 0.3 : 0.6 }
        : { tint: 0x617487, alpha: 0.45 };
    assert.equal(visual.tint, expected.tint, item.id);
    assert.equal(visual.alpha, expected.alpha, item.id);
    assert.equal(visual.visible, false, item.id);
    assert.deepEqual(geometry.get(visual), {
      x: visual.x,
      y: visual.y,
      depth: visual.depth,
      rotation: visual.rotation,
      scaleX: visual.scaleX,
      scaleY: visual.scaleY
    }, `${item.id} geometry changed during presentation update`);
  }

  controller.reset();
  for (const visual of controller.objects) {
    assert.equal(visual.tint, 0xffffff);
    assert.equal(visual.alpha, 1);
    assert.equal(visual.visible, true);
  }
});

test("facility room controller destroy is idempotent and releases ownership", async () => {
  const { createFacilityRoomController } = await loadFacilityRoom();
  const scene = createSceneStub();
  const controller = createFacilityRoomController(scene, 1920, 1920);

  controller.destroy();
  controller.destroy();
  controller.setPresentation({ ambientAlpha: 0.1, visible: false });
  controller.reset();

  assert.equal(controller.objects.length, 0);
  assert.equal(controller.byId.size, 0);
  assert.ok(scene.created.every(({ destroyed, destroyCalls }) => destroyed && destroyCalls === 1));
});

test("facility room rendering is display-only", async () => {
  const source = await readFile(new URL("../src/art/facilityRoom.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bphysics\b|add\.existing|body\./);
});

test("every opening facility texture has an existence-guarded fallback", async () => {
  const source = await readFile(new URL("../src/assets/fallbackTextureFactory.js", import.meta.url), "utf8");
  for (const key of [
    "facilityFloor",
    "facilityWall",
    "facilityDoor",
    "facilityConsole",
    "facilityVent",
    "facilityDecal",
    "facilityServiceFloor",
    "facilityHazardStripe",
    "facilityObservationWindow",
    "facilityPipeBank",
    "facilityCombatFloor",
    "facilityEntryThreshold",
    "facilityMaintenanceDeck",
    "facilityWallBank",
    "facilityPowerJunction",
    "facilityContaminationTrail"
  ]) {
    assert.match(source, new RegExp(`ensureTexture\\(scene, TEXTURES\\.${key}`));
  }
});
