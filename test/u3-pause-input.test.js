import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BALANCE} from '../src/config/balance.js';

async function inputScene() {
  const source=await readFile(new URL('../src/scene/systems.js',import.meta.url),'utf8');
  const declaration='export const systemsMixin =';
  const body=source.slice(source.indexOf(declaration)).replace(declaration,'const systemsMixin =');
  const mixin=Function('Phaser','DEBUG_MODE','BALANCE',`${body}\nreturn systemsMixin;`)({Input:{Keyboard:{KeyCodes:{}}}},false,BALANCE);
  const handlers=new Map();
  const scene={input:{keyboard:{addKeys(){return {};},on(name,handler){handlers.set(name,handler);}}},pauseToggles:0,togglePause(){this.pauseToggles++;},buildToggles:0,buildHides:0,toggleBuildPanel(){this.buildToggles++;},hideBuildPanel(){this.buildHides++;}};
  mixin.setupInputHandlers.call(scene);
  return {scene,dash:mixin.tryStartDash,escape:handlers.get('keydown-ESC'),tab:handlers.get('keydown-TAB'),tabUp:handlers.get('keyup-TAB')};
}

test('one Esc event replayed in a keyboard queue toggles pause only once',async()=>{
  const {scene,escape}=await inputScene();
  const first={timeStamp:12},second={timeStamp:13};
  escape(first);escape(first);
  assert.equal(scene.pauseToggles,1);
  escape(second);escape(first);escape(second);
  assert.equal(scene.pauseToggles,2,'Distinct presses remain usable even when earlier queue entries replay');
});

test('Tab release keeps build open; holding or replaying a press cannot toggle repeatedly',async()=>{
  const {scene,tab,tabUp}=await inputScene();
  const first={preventDefault(){},repeat:false},second={preventDefault(){},repeat:false};
  tab(first);tab(first);tab({...first,repeat:true});tabUp(first);
  assert.equal(scene.buildToggles,1);assert.equal(scene.buildHides,0);
  tab(second);tab(first);tabUp(second);
  assert.equal(scene.buildToggles,2);assert.equal(scene.buildHides,0);
});

test('pause event bookkeeping belongs to the scene input lifecycle',async()=>{
  const first=await inputScene(),restarted=await inputScene(),event={timeStamp:12};
  first.escape(event);first.escape(event);restarted.escape(event);
  assert.equal(first.scene.pauseToggles,1);
  assert.equal(restarted.scene.pauseToggles,1);
});

test('paused build cannot spend dash cooldown or queue dash effects; a fresh resumed press works',async()=>{
  const {scene,dash}=await inputScene();
  Object.assign(scene,{isMissionActive:true,isPaused:true,isGameOver:false,isLevelUpActive:false,
    elapsedSurvivalMs:1000,dashReadyAtMs:0,dashUntilMs:0,playerInvulnerableUntilMs:0,playerFacingAngle:0,
    keys:Object.fromEntries(['left','right','up','down'].map(key=>[key,{isDown:false}])),
    trails:0,sounds:0,spawnDashTrail(){this.trails++;},playSound(){this.sounds++;}});
  dash.call(scene);
  assert.equal(scene.dashReadyAtMs,0);assert.equal(scene.dashUntilMs,0);
  assert.equal(scene.playerInvulnerableUntilMs,0);assert.equal(scene.trails,0);assert.equal(scene.sounds,0);
  scene.isPaused=false;dash.call(scene);
  assert.equal(scene.dashReadyAtMs,1000+BALANCE.player.dashCooldownMs);
  assert.equal(scene.dashUntilMs,1000+BALANCE.player.dashDurationMs);
  assert.equal(scene.trails,1);assert.equal(scene.sounds,1);
});
