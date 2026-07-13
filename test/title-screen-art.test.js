import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";
import { createTitleBackdrop } from "../src/art/titleBackdrop.js";

function makeDisplayObject() {
  return {
    setDepth(depth) {
      this.depth = depth;
      return this;
    },
    setScrollFactor(value) {
      this.scrollFactor = value;
      return this;
    }
  };
}

test("title screen declares a dedicated production backdrop", () => {
  assert.equal(TEXTURES.titleFacilityBackdrop, "title-facility-backdrop");
  assert.ok(IMAGE_ASSETS.some((asset) =>
    asset.key === TEXTURES.titleFacilityBackdrop
    && asset.path === "assets/art/menus/title-facility-backdrop.png"
  ));
});

test("title screen uses the tactical terminal instead of a rectangle button", async () => {
  const source = await readFile(new URL("../src/scene/menus.js", import.meta.url), "utf8");
  const method = source.slice(source.indexOf("createStartScreen()"), source.indexOf("beginFromStartScreen()"));
  assert.match(method, /createTitleBackdrop/);
  assert.match(method, /createTerminalButton/);
  assert.doesNotMatch(method, /startButton\s*=\s*this\.add\.rectangle/);
});

test("title backdrop owns screen-fixed layers and stops its tween", () => {
  const calls = [];
  const tween = { stopped: false, stop() { this.stopped = true; } };
  const scene = {
    add: {
      image(...args) {
        calls.push({ type: "image", args });
        return makeDisplayObject();
      },
      rectangle(...args) {
        calls.push({ type: "rectangle", args });
        return makeDisplayObject();
      },
      circle(...args) {
        calls.push({ type: "circle", args });
        return makeDisplayObject();
      }
    },
    tweens: {
      add(config) {
        calls.push({ type: "tween", config });
        return tween;
      }
    }
  };
  const cleanup = [];

  const controller = createTitleBackdrop(scene, cleanup, 7);

  assert.equal(controller.objects.length, 4);
  assert.deepEqual(cleanup, controller.objects);
  assert.deepEqual(calls[0], {
    type: "image",
    args: [480, 270, TEXTURES.titleFacilityBackdrop]
  });
  for (const object of controller.objects) assert.equal(object.scrollFactor, 0);
  controller.stop();
  assert.equal(tween.stopped, true);
});
