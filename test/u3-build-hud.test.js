import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { menusMixin } from "../src/scene/menus.js";

async function loadHudMixin() {
  const source = await readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8");
  const declaration = "export const hudMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1);
  const body = source.slice(start).replace(declaration, "const hudMixin =");
  return Function(
    "Phaser", "GAME_WIDTH", "GAME_HEIGHT", "BALANCE", "UPGRADE_DEFINITIONS",
    "PLAYER_WEAPON_ALLOWLIST", "isPlayerUpgradeVisible", "HUD_REGIONS", "TEXTURES",
    "getHudPresentation", "selectTimelineHudContainers", "THEME", "createTacticalHudView",
    "createStatusLamp", "createTacticalPanel", "createTerminalOverlay", "UPGRADE_PRESENTATION",
    "createU3BuildView", "HUD_DEPTH", "FACILITY_HUD_DEPTH", "HEALTH_BAR_WIDTH",
    "XP_BAR_WIDTH", "WEAPON_STATUS_BAR_WIDTH", "DASH_BAR_WIDTH", "SITE_CODE", "SITE_CHANNELS",
    `${body}\nreturn hudMixin;`
  )(
    { Scenes: { Events: { SHUTDOWN: "shutdown", DESTROY: "destroy" } } },
    960, 540, {}, [], ["pistol", "tesla"], () => true, {}, {}, () => ({}), () => [], {},
    () => null, () => null, () => null, () => null, {},
    (scene, options) => scene.u3Factory?.(options) ?? null,
    45, 58, 150, 82, 92, 72, "SITE-CN-03", {}
  );
}

const hudMixin = await loadHudMixin();

function controller(mode) {
  const container = {
    visible: false,
    setVisible(value) { this.visible = value === true; return this; },
    destroy() { this.visible = false; }
  };
  return {
    mode,
    container,
    objects: [],
    updates: 0,
    destroyed: false,
    setVisible: (visible) => container.setVisible(visible),
    update() { this.updates += 1; },
    destroy() { this.destroyed = true; container.destroy(); }
  };
}

function createScene() {
  const calls = [];
  const scene = {
    isMissionActive: true,
    isPaused: false,
    isGameOver: false,
    isLevelUpActive: false,
    buildPanel: null,
    buildPanelController: null
  };
  Object.assign(scene, menusMixin, hudMixin);
  scene.pauseGameplaySystems = () => calls.push('pause');
  scene.resumeGameplaySystems = () => calls.push('resume');
  scene.updateUI = () => {};
  scene.showPauseOverlay = () => { scene.pauseOverlay = {}; };
  scene.hidePauseOverlay = () => { scene.pauseOverlay = null; };
  scene.releaseBuildPanelObjects = () => {};
  scene.u3Factory = function u3Factory(options) {
    calls.push("u3"); this.u3Options = options; return controller("u3");
  };
  scene.createTerminalBuildPanel = () => { calls.push("terminal"); return controller("terminal"); };
  scene.createLegacyBuildPanel = () => { calls.push("legacy"); return controller("legacy"); };
  return { scene, calls };
}

test("Tab toggles a persistent build view and owns its gameplay pause", () => {
  const { scene, calls } = createScene();

  scene.createBuildPanel();

  assert.deepEqual(calls, ["u3"]);
  assert.equal(scene.buildPanelController.mode, "u3");
  assert.equal(scene.buildPanel.visible, false);
  scene.toggleBuildPanel();
  assert.equal(scene.buildPanel.visible, true);
  assert.equal(scene.isPaused, true);
  assert.equal(scene.isBuildPanelPaused, true);
  assert.equal(scene.buildPanelController.updates, 1);
  scene.toggleBuildPanel();
  assert.equal(scene.buildPanel.visible, false);
  assert.equal(scene.isPaused, false);
  assert.equal(scene.isBuildPanelPaused, false);
  assert.deepEqual(calls,['u3','pause','resume']);
});

test("DOM unavailability and U3 construction failure fall back terminal then legacy", () => {
  for (const failure of ["null", "throw"]) {
    const { scene, calls } = createScene();
    scene.u3Factory = failure === "null"
      ? () => { calls.push("u3"); return null; }
      : () => { calls.push("u3"); throw new Error("U3 failed"); };
    scene.createBuildPanel();
    assert.deepEqual(calls, ["u3", "terminal"]);
    assert.equal(scene.buildPanelController.mode, "terminal");
  }

  const { scene, calls } = createScene();
  scene.u3Factory = () => { calls.push("u3"); return null; };
  scene.createTerminalBuildPanel = () => { calls.push("terminal"); throw new Error("terminal failed"); };
  scene.createBuildPanel();
  assert.deepEqual(calls, ["u3", "terminal", "legacy"]);
  assert.equal(scene.buildPanelController.mode, "legacy");
});

test("upgrade and result states cannot open U3 build view", () => {
  for (const blocked of ["isLevelUpActive", "isGameOver"]) {
    const { scene } = createScene();
    scene.createBuildPanel();
    scene[blocked] = true;
    scene.toggleBuildPanel();
    assert.equal(scene.buildPanel.visible, false);
    assert.equal(scene.buildPanelController.updates, 0);
  }
});

test("runtime DOM failure restores a visible build panel through terminal fallback", () => {
  const { scene, calls } = createScene();
  scene.createBuildPanel();
  scene.toggleBuildPanel();
  scene.buildPanel.visible = false;

  scene.u3Options.onFailure(new Error("detached"), { visible: true });

  assert.deepEqual(calls, ["u3", "pause", "terminal"]);
  assert.equal(scene.buildPanelController.mode, "terminal");
  assert.equal(scene.buildPanel.visible, true);
  assert.equal(scene.isPaused,true);
  scene.toggleBuildPanel();
  assert.equal(scene.isPaused,false);
});

test('Esc closes build without leaving a build overlay over resumed gameplay',()=>{
  const {scene,calls}=createScene();scene.createBuildPanel();scene.toggleBuildPanel();
  scene.togglePause();
  assert.equal(scene.buildPanel.visible,false);assert.equal(scene.isPaused,false);
  assert.equal(scene.isBuildPanelPaused,false);assert.equal(scene.pauseOverlay??null,null);
  assert.equal(calls.filter(call=>call==='resume').length,1);
  scene.togglePause();assert.equal(scene.isPaused,true);assert.ok(scene.pauseOverlay);
  scene.toggleBuildPanel();assert.equal(scene.buildPanel.visible,false);
  scene.togglePause();assert.equal(scene.isPaused,false);
});

test('build cannot open from title, upgrade, result or a separate pause',()=>{
  for(const state of [{isMissionActive:false},{isLevelUpActive:true},{isGameOver:true},{isPaused:true}]){
    const {scene,calls}=createScene();scene.createBuildPanel();Object.assign(scene,state);
    scene.toggleBuildPanel();assert.equal(scene.buildPanel.visible,false);
    assert.deepEqual(calls,['u3']);
  }
});

test('upgrade and result take over build pause without briefly resuming combat',()=>{
  for(const blocked of ['isLevelUpActive','isGameOver']){
    const {scene,calls}=createScene();scene.createBuildPanel();scene.toggleBuildPanel();
    scene[blocked]=true;scene.hideBuildPanel();
    assert.equal(scene.buildPanel.visible,false);assert.equal(scene.isBuildPanelPaused,false);
    assert.equal(scene.isPaused,false);assert.equal(calls.includes('resume'),false);
  }
});

test('normal pause takeover and shutdown release build ownership without resuming',()=>{
  const {scene,calls}=createScene();scene.createBuildPanel();scene.toggleBuildPanel();
  scene.pauseGame();assert.equal(scene.buildPanel.visible,false);assert.equal(scene.isPaused,true);
  assert.equal(scene.isBuildPanelPaused,false);assert.ok(scene.pauseOverlay);
  assert.equal(calls.includes('resume'),false);
  scene.resumeFromPause();scene.toggleBuildPanel();
  const resumes=calls.filter(call=>call==='resume').length;
  scene.destroyBuildPanel();assert.equal(scene.isBuildPanelPaused,false);
  assert.equal(calls.filter(call=>call==='resume').length,resumes);
});

test('failure of all visible build fallbacks restores an operable running state',()=>{
  const {scene,calls}=createScene();scene.createBuildPanel();scene.toggleBuildPanel();
  scene.createTerminalBuildPanel=()=>{const c=controller('terminal');c.update=()=>{throw Error('draw failed');};return c;};
  scene.createLegacyBuildPanel=()=>{throw Error('legacy unavailable');};
  assert.doesNotThrow(()=>scene.u3Options.onFailure(Error('detached'),{visible:true}));
  assert.equal(scene.buildPanel.visible,false);assert.equal(scene.isPaused,false);
  assert.equal(scene.isBuildPanelPaused,false);
  assert.equal(calls.filter(call=>call==='resume').length,1);
  scene.toggleBuildPanel();assert.equal(scene.isPaused,false,'Noop cannot strand pause');
});
