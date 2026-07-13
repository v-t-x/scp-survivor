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
    },
    beginPath() {
      this.commands.push(["beginPath"]);
      return this;
    },
    moveTo(...args) {
      this.commands.push(["moveTo", ...args]);
      return this;
    },
    lineTo(...args) {
      this.commands.push(["lineTo", ...args]);
      return this;
    },
    strokePath() {
      this.commands.push(["strokePath"]);
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

test("title screen delegates presentation and keeps the existing mission transition", async () => {
  const source = await readFile(new URL("../src/scene/menus.js", import.meta.url), "utf8");
  const method = source.slice(source.indexOf("createStartScreen()"), source.indexOf("beginFromStartScreen() {"));
  assert.match(method, /createTitleBackdrop\(this, this\.startScreenObjects, 7\)/);
  assert.match(method, /createTitleScreenView\(this, this\.startScreenObjects, \{/);
  assert.match(method, /credits:\s*this\.meta\.credits/);
  assert.match(method, /onActivate:\s*\(\)\s*=>\s*this\.beginFromStartScreen\(\)/);
  assert.doesNotMatch(method, /this\.add\.text|createTerminalButton|createStatusLamp/);

  const destroyMethod = source.slice(source.indexOf("destroyStartScreen() {"), source.indexOf("createWeaponSelectionScreen() {"));
  assert.match(destroyMethod, /this\.titleScreenController\?\.stop\(\)/);
  assert.match(destroyMethod, /this\.titleBackdropController\?\.stop\(\)/);
  assert.match(destroyMethod, /object\.destroy\(\)/);
});

test("title backdrop uses a smooth early scrim fade and door-only gate marks", () => {
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
  assert.equal(tweens.length, 4);
  assert.deepEqual(cleanup, controller.objects);
  const gradientCommands = controller.objects[1].commands;
  const expectedGradientCommands = Array.from({ length: 18 }, (_, index) => [
    ["fillStyle", THEME.title.scrim, 0.02 + 0.78 * ((17 - index) / 17) ** 2],
    ["fillRect", index * 32, 0, 34, 540]
  ]).flat();
  assert.deepEqual(gradientCommands, expectedGradientCommands);
  const gradientAlphas = gradientCommands
    .filter(([type]) => type === "fillStyle")
    .map(([, , alpha]) => alpha);
  assert.ok(gradientAlphas[8] < 0.25, "scrim should already be light by x=256");
  assert.ok(gradientAlphas[14] < 0.06, "scrim should nearly clear before x=470");
  assert.ok(gradientAlphas.every((alpha, index) => index === 0 || alpha < gradientAlphas[index - 1]));

  const gateCommands = controller.objects[3].commands;
  assert.equal(gateCommands.some(([type]) => type === "strokeRect"), false);
  const gateSegments = gateCommands.filter(([type]) => type === "lineTo");
  assert.ok(gateSegments.length >= 8, "gate focus should be composed from short corner/tick segments");
  assert.ok(gateSegments.every(([, x]) => x <= 798), "gate marks must not frame the monitor wall");
  const gateLabel = calls.find(({ type }) => type === "text");
  assert.deepEqual(gateLabel.args.slice(0, 3), [604, 112, "GATE 03 // BREACH"]);
  assert.ok(gateLabel.args[1] < 150);
  const scanlineCall = calls.find(({ type, args }) => type === "rectangle" && args[3] === 2);
  assert.ok(scanlineCall.args[2] <= 80, "scanline should stay local to the door frame");
  const scanTween = tweens.find(({ config }) => config.targets === controller.objects[6]);
  assert.ok(scanTween.config.y.to - scanTween.config.y.from <= 48, "scanline travel should be short");
  const gateEntranceTween = tweens.find(({ config }) => Array.isArray(config.targets));
  assert.deepEqual(gateEntranceTween.config.targets, [controller.objects[3], controller.objects[4]]);
  assert.equal(controller.objects[6].alpha, 0);
  assert.ok(gateEntranceTween.config.delay >= 420, "gate focus must illuminate last");
  assert.ok(scanTween.config.delay >= 420, "gate scan must also wait for the final entrance beat");
  assert.equal(cleanup.length, controller.objects.length);
  assert.ok(controller.objects.every((object) => object.scrollFactor === 0));
  controller.stop();
  controller.stop();
  assert.ok(tweens.every((tween) => tween.stopCount === 1));
});
