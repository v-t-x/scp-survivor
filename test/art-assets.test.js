import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { IMAGE_ASSETS, SPRITESHEET_ASSETS, TEXTURES } from "../src/assets/manifest.js";

const approvedImageAssets = [
  { key: "facility-floor", path: "assets/art/facility/floor.png", size: [32, 32] },
  { key: "facility-wall", path: "assets/art/facility/wall.png", size: [64, 64] },
  { key: "facility-door", path: "assets/art/facility/door.png", size: [64, 64] },
  { key: "facility-console", path: "assets/art/facility/console.png", size: [64, 64] },
  { key: "facility-vent", path: "assets/art/facility/vent.png", size: [32, 32] },
  { key: "facility-decal", path: "assets/art/facility/decal.png", size: [32, 32] },
  { key: "facility-service-floor", path: "assets/art/facility/service-floor.png", size: [32, 32] },
  { key: "facility-hazard-stripe", path: "assets/art/facility/hazard-stripe.png", size: [32, 32] },
  { key: "facility-observation-window", path: "assets/art/facility/observation-window.png", size: [96, 64] },
  { key: "facility-pipe-bank", path: "assets/art/facility/pipe-bank.png", size: [96, 64] },
  { key: "player-rect", path: "assets/art/characters/player.png", size: [48, 48] },
  { key: "enemy-infected", path: "assets/art/characters/infected-staff.png", size: [48, 48] },
  { key: "enemy-scp049", path: "assets/art/characters/scp-049.png", size: [64, 80] },
  { key: "weapon-pistol-icon", path: "assets/art/weapons/pistol.png", size: [96, 96] },
  { key: "weapon-breacher-icon", path: "assets/art/weapons/breacher.png", size: [96, 96] },
  { key: "weapon-tesla-icon", path: "assets/art/weapons/tesla.png", size: [96, 96] },
  { key: "title-facility-backdrop", path: "assets/art/menus/title-facility-backdrop.png", size: [960, 540] },
  { key: "armory-rack-backdrop", path: "assets/art/menus/armory-rack-backdrop.png", size: [960, 540] }
];

const expected = new Map(approvedImageAssets.map(({ key, size }) => [key, size]));
const expectedImageAssetPaths = new Map(
  approvedImageAssets.map(({ key, path }) => [key, path])
);

const approvedCharacterSheets = [
  {
    key: "player-opening-sheet",
    path: "assets/art/characters/player-opening-sheet.png",
    size: [576, 192]
  },
  {
    key: "infected-opening-sheet",
    path: "assets/art/characters/infected-opening-sheet.png",
    size: [576, 192]
  }
];

function readPngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodeRgbaPng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  const imageData = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "production PNGs must use 8-bit channels");
      assert.equal(data[9], 6, "production PNGs must use RGBA color type 6");
    } else if (type === "IDAT") {
      imageData.push(data);
    }
    offset += length + 12;
  }

  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const encoded = inflateSync(Buffer.concat(imageData));
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[sourceOffset];
    sourceOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = encoded[sourceOffset + x];
      const left = x >= bytesPerPixel ? pixels[y * stride + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? pixels[(y - 1) * stride + x - bytesPerPixel]
        : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? above
            : filter === 3
              ? Math.floor((left + above) / 2)
              : paethPredictor(left, above, upperLeft);
      assert.ok(filter >= 0 && filter <= 4, `unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = (raw + predictor) & 0xff;
    }
    sourceOffset += stride;
  }
  return { width, height, pixels };
}

function assertApprovedStaticImageAssets(assets) {
  assert.equal(assets.length, 18);
  assert.equal(
    new Set(assets.map(({ key }) => key)).size,
    assets.length,
    "duplicate texture keys detected"
  );
  assert.deepEqual(
    new Map(assets.map(({ key, path }) => [key, path])),
    expectedImageAssetPaths
  );
}

function getFramePixels(pixels, sheetWidth, frameIndex) {
  const frameWidth = 48;
  const frameHeight = 48;
  const frameX = (frameIndex % 12) * frameWidth;
  const frameY = Math.floor(frameIndex / 12) * frameHeight;
  const result = Buffer.alloc(frameWidth * frameHeight * 4);
  for (let y = 0; y < frameHeight; y += 1) {
    const sourceStart = ((frameY + y) * sheetWidth + frameX) * 4;
    const targetStart = y * frameWidth * 4;
    pixels.copy(result, targetStart, sourceStart, sourceStart + frameWidth * 4);
  }
  return result;
}

function getVisibleFootY(framePixels) {
  let footY = -1;
  for (let offset = 0; offset < framePixels.length; offset += 4) {
    if (framePixels[offset + 3] === 255) {
      footY = Math.max(footY, Math.floor(offset / 4 / 48));
    }
  }
  return footY;
}

test("production manifest declares the approved static vertical slice", () => {
  assert.equal(TEXTURES.weaponPistolIcon, "weapon-pistol-icon");
  assert.equal(TEXTURES.weaponBreacherIcon, "weapon-breacher-icon");
  assert.equal(TEXTURES.weaponTeslaIcon, "weapon-tesla-icon");
  assert.equal(TEXTURES.armoryRackBackdrop, "armory-rack-backdrop");
  assert.equal(TEXTURES.facilityServiceFloor, "facility-service-floor");
  assert.equal(TEXTURES.facilityHazardStripe, "facility-hazard-stripe");
  assert.equal(TEXTURES.facilityObservationWindow, "facility-observation-window");
  assert.equal(TEXTURES.facilityPipeBank, "facility-pipe-bank");
  assertApprovedStaticImageAssets(IMAGE_ASSETS);
});

test("production manifest declares exact opening character spritesheets", () => {
  assert.equal(TEXTURES.playerOpeningSheet, "player-opening-sheet");
  assert.equal(TEXTURES.infectedOpeningSheet, "infected-opening-sheet");
  assert.deepEqual(SPRITESHEET_ASSETS, approvedCharacterSheets.map(({ key, path }) => ({
    key,
    path,
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  })));
});

test("production manifest contract rejects duplicate texture keys", () => {
  const approvedAssets = [...expectedImageAssetPaths].map(([key, path]) => ({ key, path }));
  const duplicateAssets = approvedAssets.map((asset, index) =>
    index === 1 ? { ...asset, key: approvedAssets[0].key } : asset
  );

  assert.throws(
    () => assertApprovedStaticImageAssets(duplicateAssets),
    /duplicate texture keys detected/
  );
});

test("production PNGs exist at their exact approved dimensions", async () => {
  for (const [key, path] of expectedImageAssetPaths) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    assert.deepEqual(readPngSize(await readFile(absolute)), expected.get(key), key);
  }
});

test("production PNGs use a limited hard-edged RGBA palette", async () => {
  for (const [key, path] of expectedImageAssetPaths) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));
    const colors = new Set();
    const alphaValues = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      alphaValues.add(alpha);
      if (alpha > 0) {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.ok(colors.size <= 32, `${key} exceeds the 32-color production palette`);
    assert.ok([...alphaValues].every((alpha) => alpha === 0 || alpha === 255), `${key} has soft alpha`);

    if (["facility-floor", "facility-service-floor", "facility-hazard-stripe"].includes(key)) {
      assert.deepEqual(alphaValues, new Set([255]), `${key} must be fully opaque`);
      const pixel = (x, y) => pixels.subarray((y * width + x) * 4, (y * width + x + 1) * 4);
      for (let y = 0; y < height; y += 1) assert.deepEqual(pixel(0, y), pixel(width - 1, y));
      for (let x = 0; x < width; x += 1) assert.deepEqual(pixel(x, 0), pixel(x, height - 1));
    }

    if (["facility-observation-window", "facility-pipe-bank"].includes(key)) {
      assert.deepEqual(alphaValues, new Set([0, 255]), `${key} must contain binary transparency`);
    }
  }
});

test("opening character sheets are exact RGBA 48-frame production assets", async () => {
  for (const { key, path, size } of approvedCharacterSheets) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    const buffer = await readFile(absolute);
    assert.deepEqual(readPngSize(buffer), size, key);
    const { width, height, pixels } = decodeRgbaPng(buffer);
    assert.equal((width / 48) * (height / 48), 48, `${key} must contain 48 frames`);

    const colors = new Set();
    const alphaValues = new Set();
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const alpha = pixels[offset + 3];
      alphaValues.add(alpha);
      if (alpha === 255) {
        colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
      }
    }
    assert.ok(colors.size <= 32, `${key} exceeds the 32-color production palette`);
    assert.deepEqual(alphaValues, new Set([0, 255]), `${key} must use binary alpha with transparency`);

    for (let row = 0; row < 4; row += 1) {
      for (const [motion, start, end] of [
        ["idle", 0, 3],
        ["move", 4, 9],
        ["hit", 10, 11]
      ]) {
        const frames = [];
        for (let column = start; column <= end; column += 1) {
          frames.push(getFramePixels(pixels, width, row * 12 + column));
        }
        assert.ok(
          new Set(frames.map((frame) => frame.toString("base64"))).size >= 2,
          `${key} ${motion} row ${row} cannot repeat one frame`
        );
        const footYs = frames.map(getVisibleFootY);
        assert.ok(footYs.every((value) => value >= 0), `${key} ${motion} row ${row} has an empty frame`);
        assert.ok(
          Math.max(...footYs) - Math.min(...footYs) <= 1,
          `${key} ${motion} row ${row} foot anchor drifts more than one pixel`
        );
      }
    }
  }
});
