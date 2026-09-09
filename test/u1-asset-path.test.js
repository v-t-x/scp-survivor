import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { generateFallbackTextures } from "../src/assets/fallbackTextureFactory.js";
import { ATLAS_ASSETS, IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

const U1_ASSETS = [
  ["u1ArmoryChassis", "u1-armory-chassis", "assets/art/u1/armory-chassis-rework.png", [1672, 941]],
  ["u1QuartermasterChassis", "u1-quartermaster-chassis", "assets/art/u1/quartermaster-chassis-rework.png", [1672, 941]],
  ["u1RifleHero", "u1-rifle-hero", "assets/art/u1/weapon-rifle-hero.png", [256, 192]],
  ["u1TeslaHero", "u1-tesla-hero", "assets/art/u1/weapon-tesla-hero.png", [256, 192]],
  ["u1PerkArmor", "u1-perk-armor", "assets/art/u1/perk-armor.png", [128, 128]],
  ["u1PerkMobility", "u1-perk-mobility", "assets/art/u1/perk-mobility.png", [128, 128]],
  ["u1PerkArmoryAuth", "u1-perk-armory-auth", "assets/art/u1/perk-armory-auth.png", [128, 128]],
  ["u1PerkRecoveryBeacon", "u1-perk-recovery-beacon", "assets/art/u1/perk-recovery-beacon.png", [128, 128]]
];
const U1_ATLAS = ["u1StateParts", "u1-state-parts", "assets/art/u1/state-parts.png", "assets/art/u1/state-parts.json", [512, 256]];
const REJECTED_CLOSED_UNLOCK_ATLAS_SHA256 = "A7FC525F7F1C245896616E86282D7F6FCBDAEE537A9F318B6974F5D05A98C553";
const REJECTED_CLOSED_UNLOCK_FRAME_SHA256 = "AB02036070F3AA04065D70CF0352F5A306AA47294DC69AA33FFD0C9ECA27B888";
const PRESERVED_STATE_FRAME_SHA256 = Object.freeze({
  "status-check": "C849558C0195DBC9BB74DD2FFE771761478EA03FA2CD4ED07E0DBEB05648D74E",
  "status-lock": "EC4A2F3E320959E738AC2E76F86FBFB047EBDCEF4BDF157668CEDDA4220D2B7E",
  "action-forward": "EB1C9FEBEE339DF0C1A7026EA733EB212A7800F5482C5EF01EAB5DCA1017352E",
  "action-purchase": "1212FA4C7FF42D15FB168A5FB16D622205CAB5B64CD136895827A811B407FD28",
  "stamp-authorized": "40403F8806D095B5DA2B52AC3F513E3A361ADE5647DF84628C17A90190B8655A",
  "lamp-warning": "08195BC693CD912F9C7AF6AA117F325D78ADAC0728F00331D0CE28F79B211E6D",
  "lamp-contained": "31F4B32A1130E02421EBD7CAEBD5C61ECA8C67F2B190BD9666262DF48FE28735"
});

function pngSize(buffer) {
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex").toUpperCase();
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
      assert.equal(data[8], 8, "U1 atlas must use 8-bit channels");
      assert.equal(data[9], 6, "U1 atlas must use RGBA color type 6");
    } else if (type === "IDAT") imageData.push(data);
    offset += length + 12;
  }

  const stride = width * 4;
  const encoded = inflateSync(Buffer.concat(imageData));
  const pixels = Buffer.alloc(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = encoded[sourceOffset++];
    assert.ok(filter >= 0 && filter <= 4, `unsupported PNG filter ${filter}`);
    for (let x = 0; x < stride; x += 1) {
      const raw = encoded[sourceOffset + x];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? above
            : filter === 3
              ? Math.floor((left + above) / 2)
              : paethPredictor(left, above, upperLeft);
      pixels[y * stride + x] = (raw + predictor) & 0xff;
    }
    sourceOffset += stride;
  }
  return { width, height, pixels };
}

function atlasFramePixels(atlas, frame) {
  const result = Buffer.alloc(frame.w * frame.h * 4);
  for (let y = 0; y < frame.h; y += 1) {
    const sourceStart = ((frame.y + y) * atlas.width + frame.x) * 4;
    atlas.pixels.copy(result, y * frame.w * 4, sourceStart, sourceStart + frame.w * 4);
  }
  return result;
}

// Break caught: a U1 property is omitted, aliases a shared key, or stops having one authoritative preload path.
test("U1 images have immutable keys, one formal path, and no shared-key collision", () => {
  const sharedKeys = new Set([
    TEXTURES.weaponPistolIcon,
    TEXTURES.weaponTeslaIcon,
    TEXTURES.upgradeMaxHealth,
    TEXTURES.upgradeMoveSpeed,
    TEXTURES.upgradeDamage,
    TEXTURES.upgradePickupRadius
  ]);
  const keys = new Set();
  const paths = new Set();
  for (const [property, key, path] of U1_ASSETS) {
    assert.equal(TEXTURES[property], key, `${property} key`);
    assert.deepEqual(IMAGE_ASSETS.filter((asset) => asset.key === key), [{ key, path }]);
    assert.equal(keys.has(key), false, `${key} must be unique`);
    assert.equal(paths.has(path), false, `${path} must be unique`);
    assert.equal(sharedKeys.has(key), false, `${key} must not replace a shared selector or upgrade key`);
    keys.add(key);
    paths.add(path);
  }
  const [property, key, texturePath, dataPath] = U1_ATLAS;
  assert.equal(TEXTURES[property], key, `${property} key`);
  assert.deepEqual(ATLAS_ASSETS.filter((asset) => asset.key === key), [{ key, texturePath, dataPath }]);
  assert.equal(keys.has(key), false, `${key} must be unique`);
  assert.equal(paths.has(texturePath), false, `${texturePath} must be unique`);
  assert.equal(paths.has(dataPath), false, `${dataPath} must be unique`);
  assert.equal(sharedKeys.has(key), false, `${key} must not replace a shared selector or upgrade key`);
});

// Break caught: an admitted U1 asset is absent, resized, or the state atlas loses a deterministic frame.
test("U1 raster and atlas files preserve the frozen production admission contract", async () => {
  for (const [, key, path, size] of U1_ASSETS) {
    const buffer = await readFile(new URL(`../public/${path}`, import.meta.url));
    assert.deepEqual(pngSize(buffer), size, key);
  }
  const [, key, texturePath, dataPath] = U1_ATLAS;
  const atlas = { key, texturePath, dataPath };
  assert.deepEqual(ATLAS_ASSETS.filter((asset) => asset.key === atlas.key), [atlas]);
  assert.deepEqual(pngSize(await readFile(new URL(`../public/${texturePath}`, import.meta.url))), [512, 256]);
  const data = JSON.parse(await readFile(new URL(`../public/${dataPath}`, import.meta.url), "utf8"));
  const names = ["status-check", "status-unlock", "status-lock", "action-forward", "action-purchase", "stamp-authorized", "lamp-warning", "lamp-contained"];
  assert.deepEqual(Object.keys(data.frames).sort(), [...names].sort());
  for (const [index, name] of names.entries()) {
    assert.deepEqual(data.frames[name].frame, { x: (index % 4) * 128, y: Math.floor(index / 4) * 128, w: 128, h: 128 }, name);
  }
});

// Break caught: the frame named status-unlock visually regressed to the rejected
// closed amber padlock. Pixel identity prevents that asset from silently returning;
// independent original-size review remains the authority for open-lock semantics.
test("U1 state atlas replaces only the rejected closed status-unlock frame", async () => {
  const texturePath = U1_ATLAS[2];
  const dataPath = U1_ATLAS[3];
  const png = await readFile(new URL(`../public/${texturePath}`, import.meta.url));
  const data = JSON.parse(await readFile(new URL(`../public/${dataPath}`, import.meta.url), "utf8"));
  const atlas = decodeRgbaPng(png);
  const frameHashes = Object.fromEntries(Object.entries(data.frames).map(([name, { frame }]) => (
    [name, sha256(atlasFramePixels(atlas, frame))]
  )));

  assert.notEqual(
    sha256(png),
    REJECTED_CLOSED_UNLOCK_ATLAS_SHA256,
    "the visually rejected closed-unlock atlas must not be re-admitted"
  );
  assert.notEqual(
    frameHashes["status-unlock"],
    REJECTED_CLOSED_UNLOCK_FRAME_SHA256,
    "status-unlock must replace the visually rejected closed padlock pixels"
  );
  assert.notEqual(
    frameHashes["status-unlock"],
    frameHashes["status-lock"],
    "available and insufficient states must not share one pixel frame"
  );
  assert.deepEqual(
    Object.fromEntries(Object.keys(PRESERVED_STATE_FRAME_SHA256).map((name) => [name, frameHashes[name]])),
    PRESERVED_STATE_FRAME_SHA256,
    "repairing status-unlock must preserve the other seven admitted frame pixels"
  );
});

// Break caught: a procedural fallback silently becomes the source of truth for a formal U1 asset.
test("U1 formal assets have no procedural fallback ownership", async () => {
  const source = await readFile(new URL("../src/assets/fallbackTextureFactory.js", import.meta.url), "utf8");
  for (const [property] of U1_ASSETS) assert.doesNotMatch(source, new RegExp(`TEXTURES\\.${property}`));
  assert.doesNotMatch(source, /TEXTURES\.u1StateParts/);
});

test("existing loaded keys suppress procedural generation", async () => {
  let generated = 0;
  const graphics = {
    generateTexture() { generated += 1; },
    destroy() { this.destroyed = true; }
  };
  generateFallbackTextures({
    textures: { exists() { return true; } },
    add: { graphics() { return graphics; } }
  });
  assert.equal(generated, 0);
  assert.equal(graphics.destroyed, true);
});
