import {chromium,openGame,beginMission,inScene,syntheticUpgrade,restart,assert,fs,path,output} from './u3-browser-support.mjs';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={source:'49183 独立临时浏览器上下文，真实键盘；升级/结算/故障为测试构造，未写用户存档',checks:[],errors:[]};
const tick=page=>page.waitForTimeout(100);
const state=page=>inScene(page,s=>({owner:s.isBuildPanelPaused,paused:s.isPaused,physics:s.physics.world.isPaused,visible:s.buildPanel.visible,time:s.elapsedSurvivalMs,x:s.player.x,y:s.player.y,health:s.health,kills:s.killCount,cooldown:s.weapons[s.selectedWeaponId]?.cooldownMs,dashReady:s.dashReadyAtMs,dashUntil:s.dashUntilMs,invulnerable:s.playerInvulnerableUntilMs}));
try{
 for(const weapon of ['pistol','tesla'])for(const dpr of [1,2]){
  const {page,context,errors}=await openGame(browser,{dpr});await beginMission(page,weapon);
  await page.keyboard.down('Tab');await page.keyboard.down('Tab');await tick(page);await page.keyboard.up('Tab');
  const frozen=await state(page);assert.equal(frozen.visible,true);assert.equal(frozen.owner,true);assert.equal(frozen.paused,true);assert.equal(frozen.physics,true);
  await page.keyboard.down('KeyD');await page.waitForTimeout(400);await page.keyboard.up('KeyD');
  await page.keyboard.press('Space');
  assert.deepEqual(await state(page),frozen,'No movement, combat clock, health or combat progression while build is paused');
  assert.equal(await page.locator('[data-scp-hud-text]').evaluate(node=>node.style.display),'none');
  assert.match(await page.locator('[data-scp-u3="build"]').innerText(),/行动已暂停/);
  await page.screenshot({path:path.join(output,`${weapon}-tab-paused-dpr${dpr}.png`)});
  await page.keyboard.press('Tab');await tick(page);assert.equal((await state(page)).paused,false);assert.equal((await state(page)).visible,false);
  await page.keyboard.down('KeyD');await page.waitForTimeout(150);await page.keyboard.up('KeyD');
  const running=await state(page);assert.ok(running.time>frozen.time);assert.ok(running.x>frozen.x);assert.equal(running.physics,false);
  await page.keyboard.press('Space');assert.ok((await state(page)).dashReady>running.dashReady,'A new Space after resume starts dash normally');
  await page.keyboard.press('Tab');await page.keyboard.press('Escape');await tick(page);
  assert.equal((await state(page)).visible,false);assert.equal((await state(page)).paused,false);
  assert.equal(await page.locator('[data-scp-u3="pause"]').count(),0);
  await page.keyboard.press('Escape');await tick(page);await page.keyboard.press('Tab');
  assert.equal((await state(page)).visible,false);assert.equal((await state(page)).paused,true);
  await page.keyboard.press('Escape');await tick(page);
  // Observe actual pause-system transfers without replacing their behavior.
  await inScene(page,s=>{s.__tabResumeCalls=0;const resume=s.resumeGameplaySystems;s.resumeGameplaySystems=function(...args){this.__tabResumeCalls++;return resume.apply(this,args);};});
  await page.keyboard.press('Tab');await syntheticUpgrade(page,['damage','maxHealth','attackSpeed']);
  assert.equal(await inScene(page,s=>s.__tabResumeCalls),0,'Upgrade takeover does not briefly resume');
  const upgrade=await state(page);assert.equal(upgrade.owner,false);assert.equal(upgrade.paused,false);assert.equal(upgrade.physics,true);assert.equal(upgrade.visible,false);
  await page.keyboard.press('Tab');assert.equal((await state(page)).visible,false);
  await page.keyboard.press('Space');await page.waitForTimeout(200);
  assert.equal((await state(page)).physics,false);assert.equal((await state(page)).paused,false);
  await page.keyboard.press('Tab');
  const resumes=await inScene(page,s=>s.__tabResumeCalls);
  await inScene(page,(s,win)=>win?s.triggerVictory():s.triggerGameOver(),weapon==='pistol');
  assert.equal(await inScene(page,s=>s.__tabResumeCalls),resumes,'Result takeover does not resume');
  assert.equal((await state(page)).owner,false);assert.equal((await state(page)).visible,false);assert.equal((await state(page)).physics,true);
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('button',{name:'返回行动准备',exact:true}).evaluate(node=>node===document.activeElement),true);
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>{const s=window.__u3TestGame.scene.getScene('PrototypeScene');return s.player&&!s.isMissionActive&&!s.isGameOver;},null,{timeout:3000});
  await tick(page);
  assert.equal(await inScene(page,s=>s.isMissionActive),false);assert.equal((await state(page)).owner,false);
  await beginMission(page,weapon);await page.keyboard.press('Tab');await tick(page);assert.equal((await state(page)).visible,true);
  await restart(page);await beginMission(page,weapon);await page.keyboard.press('Tab');await tick(page);assert.equal((await state(page)).visible,true);
  await page.keyboard.press('Tab');assert.equal((await state(page)).paused,false);
  report.checks.push({weapon,dpr,passed:true,frozen,running});report.errors.push(...errors);await context.close();
 }
 for(const fallback of ['terminal','legacy','none']){
  const {page,context,errors}=await openGame(browser);await beginMission(page);
  await page.keyboard.press('Tab');await tick(page);
  await inScene(page,(s,fallback)=>{
   if(fallback!=='terminal')s.createTerminalBuildPanel=()=>{throw Error('Test terminal failure');};
   if(fallback==='none')s.createLegacyBuildPanel=()=>{throw Error('Test legacy failure');};
   s.buildPanelController.root.remove();
  },fallback);await tick(page);
  if(fallback==='none'){assert.equal((await state(page)).paused,false);assert.equal((await state(page)).owner,false);}
  else{assert.equal((await state(page)).paused,true);assert.equal((await state(page)).visible,true);assert.equal(await inScene(page,s=>s.buildPanelController.mode),fallback);}
  await page.screenshot({path:path.join(output,`tab-fallback-${fallback}.png`)});
  if(fallback!=='none')await page.keyboard.press('Tab');
  assert.equal((await state(page)).paused,false);assert.equal((await state(page)).physics,false);
  await page.keyboard.press('Escape');await tick(page);assert.equal(await page.locator('[data-scp-u3="pause"]').isVisible(),true);
  report.checks.push({fallback,passed:true});report.errors.push(...errors);await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS Tab toggle: both weapons/DPR1+2, key release and repeat, full combat freeze, Esc, modal takeover, restart and three fallback paths');
}catch(error){report.failure=String(error.stack??error);throw error;}
finally{await fs.writeFile(path.join(output,'tab-toggle-check.json'),JSON.stringify(report,null,2));await browser.close();}
