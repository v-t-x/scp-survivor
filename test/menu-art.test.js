import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { TEXTURES } from "../src/assets/manifest.js";
import { createFacilityMenuBackdrop } from "../src/art/menuBackdrop.js";

const menusPath = fileURLToPath(new URL("../src/scene/menus.js", import.meta.url));

function makeDisplayObject() {
  return {
    setDepth(depth) {
      this.depth = depth;
      return this;
    },
    setScrollFactor(value) {
      this.scrollFactor = value;
      return this;
    },
    setDisplaySize(width, height) {
      this.displaySize = [width, height];
      return this;
    }
  };
}

test("facility menu backdrop creates non-interactive screen-fixed facility layers", () => {
  const calls = [];
  const scene = {
    add: {
      tileSprite(...args) {
        calls.push({ type: "tileSprite", args });
        return makeDisplayObject();
      },
      image(...args) {
        calls.push({ type: "image", args });
        return makeDisplayObject();
      },
      rectangle(...args) {
        calls.push({ type: "rectangle", args });
        return makeDisplayObject();
      }
    }
  };
  const cleanup = [];

  createFacilityMenuBackdrop(scene, cleanup, 7);

  assert.deepEqual(calls[0], {
    type: "tileSprite",
    args: [480, 270, 960, 540, TEXTURES.facilityFloor]
  });
  assert.equal(calls.filter(({ type }) => type === "image").length, 4);
  assert.equal(calls.filter(({ type }) => type === "rectangle").length, 1);
  assert.equal(cleanup.length, calls.length);
  for (const object of cleanup) {
    assert.equal(object.scrollFactor, 0);
    assert.equal(typeof object.setInteractive, "undefined");
  }
});

test("weapon selection uses formal weapon textures instead of symbol text", async () => {
  const source = await readFile(menusPath, "utf8");

  for (const symbol of ["\u25A0", "\u25B2", "\u2248"]) {
    assert.doesNotMatch(
      source,
      new RegExp(`symbol\\s*:\\s*["']${symbol}["']`, "u"),
      `weapon selection must not retain the ${symbol} symbol contract`
    );
  }

  for (const textureName of [
    "weaponPistolIcon",
    "weaponBreacherIcon",
    "weaponTeslaIcon"
  ]) {
    assert.match(
      source,
      new RegExp(`textureKey\\s*:\\s*TEXTURES\\.${textureName}`),
      `weapon selection must reference TEXTURES.${textureName}`
    );
  }

  assert.match(
    source,
    /this\.add\.image\(cardX, cardY - 122, option\.textureKey\)/,
    "weapon selection must render each option's formal texture"
  );

  assert.match(
    source,
    /createTitleBackdrop\(this, this\.startScreenObjects, 7\)/,
    "title menu must use its dedicated production facility backdrop"
  );
  assert.match(
    source,
    /createFacilityMenuBackdrop\(this, this\.weaponSelectUiObjects, 0\)/,
    "weapon selection must place the facility backdrop behind its existing panel"
  );
});
