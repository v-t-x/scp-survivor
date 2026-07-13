import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createOpeningFacilityLayout } from "../src/art/openingFacilityLayout.js";
import { createFacilityRoomVisuals } from "../src/art/facilityRoom.js";
import { TEXTURES } from "../src/assets/manifest.js";

function createSceneStub() {
  const created = [];

  function makeDisplayObject(kind, x, y, width, height, key) {
    const object = {
      kind,
      x,
      y,
      width,
      height,
      key,
      depth: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
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
      setData(name, value) {
        this.data.set(name, value);
        return this;
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
        return makeDisplayObject("image", x, y, null, null, key);
      },
      tileSprite(x, y, width, height, key) {
        return makeDisplayObject("tileSprite", x, y, width, height, key);
      }
    }
  };
}

test("facility room renders the semantic graph with debugging metadata", () => {
  const scene = createSceneStub();
  const layout = createOpeningFacilityLayout(1920, 1920);
  const visuals = createFacilityRoomVisuals(scene, 1920, 1920);

  assert.equal(visuals.length, scene.created.length, "facilityVisuals must own every created room visual");
  assert.ok(scene.created.some(({ key }) => key === TEXTURES.facilityFloor));
  assert.ok(scene.created.some(({ key }) => key === TEXTURES.facilityServiceFloor));
  assert.ok(scene.created.some(({ key }) => key === TEXTURES.facilityHazardStripe));

  for (const item of layout) {
    const visual = scene.created.find((candidate) => (
      candidate.kind === "image"
      && candidate.key === item.key
      && candidate.x === item.x
      && candidate.y === item.y
    ));
    assert.ok(visual, `${item.id} should render from the semantic layout`);
    assert.equal(visual.data.get("facilityRole"), item.role);
    assert.equal(visual.data.get("facilityZone"), item.zone);
    assert.equal(visual.depth, item.depth);
    assert.equal(visual.rotation, item.rotation);
    assert.equal(visual.scaleX, item.scaleX);
    assert.equal(visual.scaleY, item.scaleY);
  }

  assert.ok(visuals.every((visual) => (
    typeof visual.data.get("facilityRole") === "string"
    && typeof visual.data.get("facilityZone") === "string"
  )));
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
    "facilityPipeBank"
  ]) {
    assert.match(source, new RegExp(`ensureTexture\\(scene, TEXTURES\\.${key}`));
  }
});
