import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

import { DEVELOPMENT_SPRITESHEET_ASSETS, SPRITESHEET_ASSETS, TEXTURES } from "../src/assets/manifest.js";
import { resolveCharacterPresentation } from "../src/art/characterPresentation.js";

const PROTOTYPE_SHEET_KEY = "player-response-operative-prototype-sheet";
const PROTOTYPE_PATH = "assets/art/characters/player-response-operative-prototype.png";
const BODY_PROTOTYPE_SHEET_KEY = "player-response-operative-body-prototype-sheet";
const BODY_PROTOTYPE_PATH = "assets/art/characters/player-response-operative-body-prototype.png";
const LEGACY_PATH = "assets/art/characters/player-opening-sheet.png";
const LEGACY_SHEET_KEY = TEXTURES.playerOpeningSheet;

const PROTOTYPE_FRAME = 64;
const PROTOTYPE_SHEET_SIZE = [1792, 64];
const PROTOTYPE_MOTIONS = [
  ["idle", 0, 3],
  ["forward", 4, 9],
  ["backward", 10, 15],
  ["strafeLeft", 16, 21],
  ["strafeRight", 22, 27]
];

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
      assert.equal(data[8], 8, "prototype PNG must use 8-bit channels");
      assert.equal(data[9], 6, "prototype PNG must use RGBA color type 6");
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

function loadPng(relativePath) {
  const absolute = fileURLToPath(new URL(`../public/${relativePath}`, import.meta.url));
  return readFile(absolute).then(decodeRgbaPng);
}

function getFrameMetrics(pixels, sheetWidth, frameIndex, frameSize, frameRow = 0) {
  const frameX = frameIndex * frameSize;
  const frameY = frameRow * frameSize;
  let minX = frameSize;
  let minY = frameSize;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < frameSize; y += 1) {
    for (let x = 0; x < frameSize; x += 1) {
      const alpha = pixels[((frameY + y) * sheetWidth + frameX + x) * 4 + 3];
      if (alpha !== 255) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  assert.ok(maxX >= minX && maxY >= minY, `frame ${frameIndex} row ${frameRow} cannot be empty`);
  return {
    minX,
    minY,
    maxX,
    maxY,
    visibleHeight: maxY - minY + 1,
    centerX: (minX + maxX) / 2,
    footY: maxY
  };
}

function getCropHash(pixels, sheetWidth, frameIndex, frameSize, metrics, frameRow = 0) {
  const { minX, minY, maxX, maxY } = metrics;
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const crop = Buffer.alloc(cropWidth * cropHeight * 4);
  const frameX = frameIndex * frameSize;
  const frameY = frameRow * frameSize;
  for (let y = minY; y <= maxY; y += 1) {
    const sourceStart = ((frameY + y) * sheetWidth + frameX + minX) * 4;
    pixels.copy(crop, (y - minY) * cropWidth * 4, sourceStart, sourceStart + cropWidth * 4);
  }
  return createHash("sha256").update(crop).digest("hex");
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

test("manifest declares the exact prototype texture key and spritesheet entry", () => {
  assert.equal(TEXTURES.playerResponseOperativePrototypeSheet, PROTOTYPE_SHEET_KEY);
  assert.deepEqual(
    DEVELOPMENT_SPRITESHEET_ASSETS.find(({ key }) => key === TEXTURES.playerResponseOperativePrototypeSheet),
    {
      key: PROTOTYPE_SHEET_KEY,
      path: PROTOTYPE_PATH,
      frameConfig: { frameWidth: 64, frameHeight: 64 }
    }
  );
});

test("manifest declares the exact body prototype texture key and 64px spritesheet entry", () => {
  assert.equal(TEXTURES.playerResponseOperativeBodyPrototypeSheet, BODY_PROTOTYPE_SHEET_KEY);
  assert.deepEqual(
    DEVELOPMENT_SPRITESHEET_ASSETS.find(({ key }) => key === TEXTURES.playerResponseOperativeBodyPrototypeSheet),
    {
      key: BODY_PROTOTYPE_SHEET_KEY,
      path: BODY_PROTOTYPE_PATH,
      frameConfig: { frameWidth: 64, frameHeight: 64 }
    }
  );
});

test("body prototype is an exact 28-frame native RGBA sheet with binary alpha and limited palette", async () => {
  const { width, height, pixels } = await loadPng(BODY_PROTOTYPE_PATH);
  assert.deepEqual([width, height], PROTOTYPE_SHEET_SIZE);

  const colors = new Set();
  const alphaValues = new Set();
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3];
    alphaValues.add(alpha);
    if (alpha === 255) {
      colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
    }
  }
  assert.deepEqual(alphaValues, new Set([0, 255]));
  assert.ok(colors.size <= 32, `body prototype uses ${colors.size} colors`);
});

test("body prototype exports one measured socket pair for every frame", async () => {
  const socketModule = await import("../src/art/playerResponseOperativeBodySockets.js");
  const sockets = socketModule.PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS;

  assert.equal(socketModule.BODY_SOCKET_SCHEMA_VERSION, 1);
  assert.equal(socketModule.BODY_SOCKET_FRAME_COUNT, 28);
  assert.equal(sockets.length, 28);
  assert.equal(Object.isFrozen(sockets), true);
  const coordinatePairs = new Set();
  sockets.forEach((socket, index) => {
    assert.equal(socket.index, index);
    assert.ok(["front", "behind"].includes(socket.equipmentLayer));
    for (const key of ["gripX", "gripY", "supportX", "supportY"]) {
      assert.ok(Number.isInteger(socket[key]), `${key} must be an integer at frame ${index}`);
      assert.ok(socket[key] >= 0 && socket[key] < 64, `${key} must stay inside frame ${index}`);
    }
    coordinatePairs.add(`${socket.gripX},${socket.gripY}/${socket.supportX},${socket.supportY}`);
  });
  assert.ok(coordinatePairs.size >= 8, "frame sockets must be measured rather than copied once");
});

test("prototype sheet is an exact 1792x64 8-bit RGBA grid with binary alpha and a limited palette", async () => {
  const absolute = fileURLToPath(new URL(`../public/${PROTOTYPE_PATH}`, import.meta.url));
  await access(absolute);
  const { width, height, pixels } = decodeRgbaPng(await readFile(absolute));

  assert.deepEqual([width, height], PROTOTYPE_SHEET_SIZE, "prototype sheet must be one 1792x64 row");
  assert.equal(width / PROTOTYPE_FRAME, 28, "prototype sheet must contain exactly 28 frames");
  assert.equal(height, PROTOTYPE_FRAME, "prototype sheet must not contain a second row");

  const colors = new Set();
  const alphaValues = new Set();
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const alpha = pixels[offset + 3];
    alphaValues.add(alpha);
    if (alpha === 255) {
      colors.add(`${pixels[offset]},${pixels[offset + 1]},${pixels[offset + 2]}`);
    }
  }
  assert.deepEqual(alphaValues, new Set([0, 255]), "prototype must use binary alpha");
  assert.ok(colors.size <= 32, "prototype exceeds the 32-color production palette");
});

test("prototype frames keep the five-motion layout with unique poses, approved heights, baseline and drift", async () => {
  const { width, pixels } = await loadPng(PROTOTYPE_PATH);

  const hashes = new Set();
  for (const [motion, start, end] of PROTOTYPE_MOTIONS) {
    assert.equal(end - start + 1, { idle: 4, forward: 6, backward: 6, strafeLeft: 6, strafeRight: 6 }[motion]);
    const heights = [];
    const centersX = [];
    for (let frameIndex = start; frameIndex <= end; frameIndex += 1) {
      const metrics = getFrameMetrics(pixels, width, frameIndex, PROTOTYPE_FRAME);
      hashes.add(getCropHash(pixels, width, frameIndex, PROTOTYPE_FRAME, metrics));
      assert.ok(
        metrics.visibleHeight >= 44 && metrics.visibleHeight <= 50,
        `${motion} frame ${frameIndex} visible height ${metrics.visibleHeight} is outside 44-50`
      );
      assert.ok(
        metrics.footY >= 55 && metrics.footY <= 57,
        `${motion} frame ${frameIndex} baseline y=${metrics.footY} is outside 56±1`
      );
      heights.push(metrics.visibleHeight);
      centersX.push(metrics.centerX);
    }
    const motionMedian = median(heights);
    assert.ok(
      motionMedian >= 48 && motionMedian <= 50,
      `${motion} median visible height ${motionMedian} is outside 48-50`
    );
    assert.ok(
      Math.max(...centersX) - Math.min(...centersX) <= 2,
      `${motion} drifts horizontally by more than 2 pixels`
    );
  }
  assert.equal(hashes.size, 28, "all 28 translation-normalized poses must be unique");
});

test("prototype display height stays within two pixels of the legacy sheet display height", async () => {
  const [legacy, prototype] = await Promise.all([loadPng(LEGACY_PATH), loadPng(PROTOTYPE_PATH)]);
  assert.deepEqual([legacy.width, legacy.height], [576, 192], "legacy sheet geometry changed");

  const legacyDisplayMedians = [];
  for (let row = 0; row < 4; row += 1) {
    const heights = [];
    for (let column = 0; column < 12; column += 1) {
      const metrics = getFrameMetrics(legacy.pixels, legacy.width, column, 48, row);
      assert.ok(
        metrics.visibleHeight >= 40 && metrics.visibleHeight <= 42,
        `legacy row ${row} frame ${column} visible height ${metrics.visibleHeight} left the approved 40-42 band`
      );
      heights.push(metrics.visibleHeight);
    }
    legacyDisplayMedians.push(median(heights) * 1.2);
  }

  for (const [motion, start, end] of PROTOTYPE_MOTIONS) {
    const heights = [];
    for (let frameIndex = start; frameIndex <= end; frameIndex += 1) {
      heights.push(getFrameMetrics(prototype.pixels, prototype.width, frameIndex, PROTOTYPE_FRAME).visibleHeight);
    }
    const prototypeDisplayMedian = median(heights) * 1.0;
    for (let row = 0; row < 4; row += 1) {
      assert.ok(
        Math.abs(prototypeDisplayMedian - legacyDisplayMedians[row]) <= 2,
        `${motion} median display height ${prototypeDisplayMedian} differs from legacy direction ${row} median display height ${legacyDisplayMedians[row]} by more than 2 pixels`
      );
    }
  }
});

test("prototype sheet contains no extra frames, rows or copied legacy pixels", async () => {
  const [legacy, prototype] = await Promise.all([loadPng(LEGACY_PATH), loadPng(PROTOTYPE_PATH)]);

  assert.equal(prototype.width, 1792, "a 29th frame would change the sheet width");
  assert.equal(prototype.height, 64, "a second row would change the sheet height");

  const legacyHashes = new Set();
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 12; column += 1) {
      const metrics = getFrameMetrics(legacy.pixels, legacy.width, column, 48, row);
      legacyHashes.add(getCropHash(legacy.pixels, legacy.width, column, 48, metrics, row));
    }
  }
  for (let frameIndex = 0; frameIndex < 28; frameIndex += 1) {
    const metrics = getFrameMetrics(prototype.pixels, prototype.width, frameIndex, PROTOTYPE_FRAME);
    const hash = getCropHash(prototype.pixels, prototype.width, frameIndex, PROTOTYPE_FRAME, metrics);
    assert.equal(legacyHashes.has(hash), false, `prototype frame ${frameIndex} copies legacy pixels`);
  }
});

test("production sheet is not preloaded and ordinary resolution stays on the legacy sheet", () => {
  assert.equal(
    SPRITESHEET_ASSETS.some(({ key }) => key === TEXTURES.playerResponseOperativeSheet),
    false,
    "production sheet must not be preloaded before Gate 3 acceptance"
  );

  const scene = {
    textures: {
      exists: (key) => [LEGACY_SHEET_KEY, PROTOTYPE_SHEET_KEY, BODY_PROTOTYPE_SHEET_KEY].includes(key),
      get: (key) => ({ frameTotal: key === LEGACY_SHEET_KEY ? 49 : 29 })
    },
    console: { warn() {} }
  };
  assert.deepEqual(resolveCharacterPresentation(scene), {
    characterId: "foundation-response-operative",
    textureKey: LEGACY_SHEET_KEY,
    animationFamily: "legacy",
    displayScale: 1.2
  });
});
