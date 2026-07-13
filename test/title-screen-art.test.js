import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";
import { createTitleBackdrop } from "../src/art/titleBackdrop.js";
import { THEME } from "../src/ui/theme.js";

function makeDisplayObject() {
  return {
    x: 0,
    y: 0,
    alpha: 1,
    commands: [],
    setDepth(depth) {
      this.depth = depth;
      return this;
    },
    setScrollFactor(value) {
      this.scrollFactor = value;
      return this;
    },
    setScale(value) {
      this.scale = value;
      return this;
    },
    setOrigin(...value) {
      this.origin = value;
      return this;
    },
    clear() {
      this.commands = [];
      return this;
    },
    fillStyle(...args) {
      this.commands.push(["fillStyle", ...args]);
      return this;
    },
    fillRect(...args) {
      this.commands.push(["fillRect", ...args]);
      return this;
    },
    lineStyle(...args) {
      this.commands.push(["lineStyle", ...args]);
      return this;
    },
    strokeRect(...args) {
      this.commands.push(["strokeRect", ...args]);
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

test("title backdrop owns gradient, gate focus and every tween idempotently", () => {
  const calls = [];
  const tweens = [];
  const scene = {
    add: {
      image(...args) {
        calls.push({ type: "image", args });
        return makeDisplayObject();
      },
      graphics(...args) {
        calls.push({ type: "graphics", args });
        return makeDisplayObject();
      },
      rectangle(...args) {
        calls.push({ type: "rectangle", args });
        return makeDisplayObject();
      },
      circle(...args) {
        calls.push({ type: "circle", args });
        return makeDisplayObject();
      },
      text(...args) {
        calls.push({ type: "text", args });
        return makeDisplayObject();
      }
    },
    tweens: {
      add(config) {
        const tween = { config, stopCount: 0, stop() { this.stopCount += 1; } };
        tweens.push(tween);
        return tween;
      }
    }
  };
  const cleanup = [];

  const controller = createTitleBackdrop(scene, cleanup, 7);

  assert.equal(calls[0].type, "image");
  assert.deepEqual(calls[0].args, [480, 270, TEXTURES.titleFacilityBackdrop]);
  assert.equal(calls.filter(({ type }) => type === "graphics").length, 2);
  assert.equal(calls.some(({ type, args }) => type === "rectangle" && args[2] === 440 && args[3] === 540), false);
  assert.equal(tweens.length, 3);
  assert.deepEqual(cleanup, controller.objects);
  const gradientCommands = controller.objects[1].commands;
  const expectedGradientCommands = Array.from({ length: 12 }, (_, index) => [
    ["fillStyle", THEME.title.scrim, Math.max(0.08, 0.82 - index * 0.065)],
    ["fillRect", index * 48, 0, 52, 540]
  ]).flat();
  assert.deepEqual(gradientCommands, expectedGradientCommands);
  assert.deepEqual(
    controller.objects[3].commands.filter(([type]) => type === "strokeRect"),
    [
      ["strokeRect", 592, 124, 286, 366],
      ["strokeRect", 604, 136, 22, 3],
      ["strokeRect", 844, 474, 22, 3]
    ]
  );
  const gateLabel = calls.find(({ type }) => type === "text");
  assert.deepEqual(gateLabel.args.slice(0, 3), [604, 112, "GATE 03 // BREACH"]);
  assert.ok(gateLabel.args[1] < 124);
  assert.equal(cleanup.length, controller.objects.length);
  assert.ok(controller.objects.every((object) => object.scrollFactor === 0));
  controller.stop();
  controller.stop();
  assert.ok(tweens.every((tween) => tween.stopCount === 1));
});
