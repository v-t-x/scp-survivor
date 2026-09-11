import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');
export { assert, fs, path };
export const origin = process.env.U3_TEST_ORIGIN ?? 'http://127.0.0.1:49183';
export const output = path.resolve(process.env.U3_EVIDENCE_DIR ?? 'docs/art/u3/evidence');

export async function openGame(browser, { dpr = 1, width = 960, height = 540, failTexture = false, failDom = false, failWeaponArt = false } = {}) {
  assert.match(origin, /^http:\/\/127\.0\.0\.1:49183$/, 'Only the isolated U3 test origin is permitted.');
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Test-only response instrumentation. The delivered source has no debug global or synthetic-state URL.
  await page.route('**/src/main.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('new Phaser.Game(config);', 'window.__u3TestGame = new Phaser.Game(config);');
    await route.fulfill({ response, body });
  });
  if (failTexture) await page.route(/\/assets\/u3-(steel|chassis|ammunition|vitals|paper|containment)(-v2)?\.png/, route => route.abort());
  if (failWeaponArt) await page.route('**/assets/art/u1/weapon-*-hero.png', route => route.abort());
  if (failDom) await page.route('**/src/ui/u3DomOverlay.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('export function createU3Overlay(scene,', 'export function createU3Overlay_DISABLED(scene,');
    await route.fulfill({ response, body: body + '\nexport function createU3Overlay() { return null; }\n' });
  });
  await page.goto(origin, { waitUntil:'networkidle' });
  await page.waitForFunction(() => window.__u3TestGame?.scene.getScene('PrototypeScene')?.player);
  if(width !== 960) await page.addStyleTag({ content:`canvas { width:${width}px !important; height:${height}px !important; }` });
  await fs.mkdir(output, { recursive:true });
  return { context, page, errors };
}

export async function inScene(page, fn, arg) {
  return page.evaluate(({ source, arg }) => {
    const scene = window.__u3TestGame.scene.getScene('PrototypeScene');
    return new Function('scene', 'arg', `return (${source})(scene, arg)`)(scene, arg);
  }, { source:fn.toString(), arg });
}

export async function beginMission(page, weapon = 'pistol') {
  await inScene(page, (scene, weapon) => {
    scene.beginFromStartScreen();
    scene.startMissionWithWeapon(weapon);
  }, weapon);
  await page.waitForTimeout(100);
}

export async function capture(page, name) {
  await page.screenshot({ path:path.join(output, `${name}.png`) });
}

export async function restart(page) {
  await inScene(page, scene => scene.scene.restart());
  await page.waitForFunction(() => {
    const scene = window.__u3TestGame.scene.getScene('PrototypeScene');
    return scene.player && !scene.isMissionActive && !scene.isGameOver;
  });
  await page.waitForTimeout(100);
}

export async function syntheticUpgrade(page, keys, { pending = 1, rerolls = 3 } = {}) {
  await page.evaluate(async ({ keys, pending, rerolls }) => {
    const scene = window.__u3TestGame.scene.getScene('PrototypeScene');
    const { UPGRADE_DEFINITIONS } = await import('/src/config/upgrades.js');
    const original = scene.getLevelUpChoices;
    scene.getLevelUpChoices = () => keys.map(key => UPGRADE_DEFINITIONS.find(upgrade => upgrade.key === key));
    scene.pendingLevelUps = pending; scene.rerollsRemaining = rerolls;
    scene.showLevelUpOverlay();
    scene.getLevelUpChoices = original;
  }, { keys, pending, rerolls });
  await page.waitForTimeout(80);
}
