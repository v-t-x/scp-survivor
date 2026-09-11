import {chromium,openGame,capture,inScene,assert,fs,path,output} from './u3-browser-support.mjs';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={origin:'http://127.0.0.1:49183',stateSource:'独立浏览器上下文；军需资金、设施事件、Boss和低生命为测试构造；点击键盘为真实输入',checks:[]};
try {
  const {page,context,errors}=await openGame(browser);
  await page.mouse.click(180,385);await page.waitForTimeout(100);
  await page.mouse.click(848,36);await page.waitForTimeout(100);
  assert.equal(await inScene(page,s=>s.perkStoreController.kind),'production');
  await capture(page,'u1-store-insufficient');
  await inScene(page,s=>{s.meta.credits=1000;s.refreshPerkStore();});
  const first=await inScene(page,s=>{const b=s.perkStoreController.rows[0].action.hitArea.getBounds();return{x:b.centerX,y:b.centerY};});
  await page.mouse.click(first.x,first.y);await page.waitForTimeout(80);
  assert.equal(await inScene(page,s=>s.meta.perks.startMaxHealth),true);
  assert.equal(await inScene(page,s=>s.meta.credits),850);
  await page.mouse.click(first.x,first.y);assert.equal(await inScene(page,s=>s.meta.credits),850);
  await capture(page,'u1-store-owned');
  await page.mouse.click(723,498);await page.waitForTimeout(80);
  assert.equal(await inScene(page,s=>s.perkStoreController),null);
  await page.mouse.click(158,350);await page.waitForTimeout(80);
  await capture(page,'u1-tesla-selected');
  await page.mouse.click(470,491);await page.waitForTimeout(100);
  assert.equal(await inScene(page,s=>s.selectedWeaponId),'tesla');
  assert.equal(await inScene(page,s=>s.maxHealth),120);
  report.checks.push('U1 formal store: insufficient/owned; real pointer purchase once; return and Tesla deployment; existing perk applies');
  await inScene(page,s=>{s.elapsedSurvivalMs=181000;s.health=18;s.playerInvulnerableUntilMs=1e9;s.beginFacilityEvent('powerOutage');s.updateUI();});
  await page.waitForTimeout(100);await capture(page,'u2-low-health-and-power-outage');
  await page.keyboard.press('Escape');await page.waitForTimeout(80);
  const pause=await page.locator('[data-scp-u3="pause"]').innerText();
  assert.match(pause,/电力故障/);assert.match(pause,/03:01/);
  await capture(page,'pause-power-outage');
  assert.equal(await page.locator('[data-scp-hud-text]').evaluate(node=>node.style.display),'none');
  await page.getByRole('button',{name:'继续行动',exact:true}).click();
  await inScene(page,s=>{s.endFacilityEvent();s.skipToBossPhase();});
  await page.waitForTimeout(1900);await capture(page,'u2-boss-phase');
  assert.equal(await inScene(page,s=>s.bossPhaseActive),true);
  for(let i=0;i<3;i++) {
    await page.keyboard.press('Escape');await page.waitForTimeout(50);
    assert.equal(await page.locator('[data-scp-u3="pause"]').count(),1);
    await page.getByRole('button',{name:'继续行动',exact:true}).click();
    await page.waitForTimeout(50);
    assert.equal(await page.locator('[data-scp-u3="pause"]').count(),0);
    assert.equal(await page.locator('[data-scp-hud-text]').count(),1);
    assert.equal(await page.locator('[data-scp-hud-text]').evaluate(node=>node.style.display),'block');
  }
  report.checks.push('U2 low health/facility/Boss HUD; pause reads true event and clock; three pause/resume loops no native text leaks or duplicate roots');
  assert.deepEqual(errors,[]);report.errors=errors;await context.close();console.log('PASS U1/U2 regression');
}catch(error){report.failure=String(error.stack??error);throw error;}
finally{await fs.writeFile(path.join(output,'regression-results.json'),JSON.stringify(report,null,2));await browser.close();}
