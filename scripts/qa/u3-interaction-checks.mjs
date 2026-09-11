import { chromium, openGame, beginMission, capture, inScene, restart, syntheticUpgrade, assert, fs, path, output } from './u3-browser-support.mjs';

const browser = await chromium.launch({ headless:true, channel:process.env.U3_BROWSER_CHANNEL ?? 'msedge' });
const report = { origin:'http://127.0.0.1:49183', storage:'fresh ephemeral contexts, never the user browser profile', checks:[], errors:[] };
const record = (name, detail) => { report.checks.push({ name, passed:true, detail }); console.log(`PASS ${name}`); };
const pauseFrame = page => page.waitForTimeout(80);
const visible = (page, kind) => page.locator(`[data-scp-u3="${kind}"]`);
try {
  const { page, context, errors } = await openGame(browser);
  // Real pointer path through the unmodified U1 screens.
  await page.mouse.click(180,385); await pauseFrame(page);
  await page.mouse.click(158,207); await pauseFrame(page);
  await capture(page,'u1-rifle-selected');
  await page.mouse.click(470,491);
  await page.waitForFunction(() => window.__u3TestGame.scene.getScene('PrototypeScene').isMissionActive);
  await page.keyboard.down('KeyD'); await page.waitForTimeout(650); await page.keyboard.up('KeyD');
  await capture(page,'natural-ui-start-and-movement');
  record('U1 title → armory → rifle selection → deployment through pointer input');

  await page.keyboard.press('Tab'); await pauseFrame(page);
  assert.equal(await visible(page,'build').isVisible(),true);
  const timeA=await inScene(page,s=>s.elapsedSurvivalMs);
  await page.waitForTimeout(180);
  const timeB=await inScene(page,s=>s.elapsedSurvivalMs);
  assert.equal(timeB,timeA,'Build must pause the combat clock');
  assert.equal(await inScene(page,s=>s.isPaused || s.physics.world.isPaused),true);
  assert.equal(await page.locator('[data-scp-hud-text]').evaluate(node=>node.style.display),'none');
  assert.equal(await visible(page,'build').isVisible(),true,'Tab keyup must leave build open');
  await page.keyboard.press('Escape'); await pauseFrame(page);
  assert.equal(await visible(page,'build').isVisible(),false);
  assert.equal(await visible(page,'pause').count(),0,'Esc closes build without stacking the pause menu');
  assert.equal(await inScene(page,s=>s.isPaused || s.physics.world.isPaused),false);
  const resumedAt=await inScene(page,s=>s.elapsedSurvivalMs);
  await page.waitForFunction(before=>window.__u3TestGame.scene.getScene('PrototypeScene').elapsedSurvivalMs>before+100,resumedAt,{timeout:1500});
  await page.keyboard.press('Tab'); await pauseFrame(page);
  assert.equal(await visible(page,'build').isVisible(),true);
  await page.keyboard.press('Tab'); await pauseFrame(page);
  assert.equal(await visible(page,'build').isVisible(),false,'Second Tab press closes build');
  assert.equal(await inScene(page,s=>s.isPaused || s.physics.world.isPaused),false);
  const toggledResumeAt=await inScene(page,s=>s.elapsedSurvivalMs);
  await page.waitForFunction(before=>window.__u3TestGame.scene.getScene('PrototypeScene').elapsedSurvivalMs>before+100,toggledResumeAt,{timeout:1500});
  assert.equal(await page.locator('[data-scp-hud-text]').evaluate(node=>node.style.display),'block');
  record('Tab toggles a pause-owning build; keyup keeps it open; Esc or second Tab closes and resumes', {timeA,timeB});

  await page.keyboard.press('Escape'); await pauseFrame(page);
  assert.equal(await visible(page,'pause').isVisible(),true);
  const frozen=await inScene(page,s=>s.elapsedSurvivalMs);
  await page.waitForTimeout(150);
  assert.equal(await inScene(page,s=>s.elapsedSurvivalMs),frozen);
  await capture(page,'pause-natural-after-camera-move');
  await page.getByRole('button',{ name:'继续行动',exact:true }).click();
  assert.equal(await visible(page,'pause').count(),0);
  await page.keyboard.press('Escape'); await pauseFrame(page);
  await page.getByRole('button',{ name:'返回标题',exact:true }).click();
  await page.waitForTimeout(160);
  assert.equal(await inScene(page,s=>s.isMissionActive),false);
  record('Esc pause freezes time; aligned resume and quit hit areas after camera movement');

  await beginMission(page,'pistol');
  await inScene(page,s=>{s.health=95;s.playerInvulnerableUntilMs=1e9;});
  await syntheticUpgrade(page,['damage','maxHealth','attackSpeed'],{pending:3});
  await page.keyboard.press('Tab'); await pauseFrame(page);
  assert.equal(await visible(page,'build').isVisible(),false);
  const expectedBefore=await inScene(page,s=>({damage:s.weapons.pistol.damage,max:s.maxHealth}));
  const damageCard=page.locator('.u3-upgrade-card').first();
  await damageCard.hover(); await capture(page,'upgrade-hover');
  await page.mouse.move(20,20); await damageCard.focus(); await capture(page,'upgrade-focus');
  const cardBounds=await damageCard.boundingBox();
  await page.mouse.move(cardBounds.x+cardBounds.width/2,cardBounds.y+cardBounds.height/2);
  await page.mouse.down();await capture(page,'upgrade-pressed');
  await page.mouse.move(20,20);await page.mouse.up();
  await damageCard.evaluate(node=>{node.click();node.click();});
  await capture(page,'upgrade-selected');
  const applied=await inScene(page,s=>({damage:s.weapons.pistol.damage,count:s.upgradeLevels.damage,pending:s.pendingLevelUps}));
  assert.equal(applied.damage,expectedBefore.damage*1.2); assert.equal(applied.count,1); assert.equal(applied.pending,2);
  await page.waitForTimeout(210);
  assert.equal(await visible(page,'upgrade').isVisible(),true);
  for(let i=0;i<3;i++) await page.getByRole('button',{name:/^重抽/}).click();
  assert.equal(await inScene(page,s=>s.rerollsRemaining),0);
  assert.equal(await page.getByRole('button',{name:/^重抽/}).isDisabled(),true);
  await capture(page,'upgrade-rerolls-exhausted');
  await page.getByRole('button',{name:/^跳过/}).evaluate(node=>{node.click();node.click();});
  assert.equal(await inScene(page,s=>s.health),100);
  assert.equal(await inScene(page,s=>s.pendingLevelUps),1);
  await page.waitForTimeout(160);
  await page.getByRole('button',{name:/^跳过/}).click();
  await page.waitForTimeout(180);
  assert.equal(await inScene(page,s=>s.isLevelUpActive),false);
  record('Rifle apply once, sequential pending upgrades, 3 rerolls exhausted, skip clamps to max health');

  await page.evaluate(async()=>{
    const scene=window.__u3TestGame.scene.getScene('PrototypeScene');
    const {UPGRADE_DEFINITIONS}=await import('/src/config/upgrades.js');
    for(const upgrade of UPGRADE_DEFINITIONS) {
      if(upgrade.weaponId==='shotgun'||upgrade.isMutation)continue;
      for(let i=0;i<8;i++) if(upgrade.isAvailable(scene)) {upgrade.apply(scene);scene.upgradeLevels[upgrade.key]++; if(upgrade.kind==='weapon')scene.weapons[scene.selectedWeaponId].currentLevel++;}
    }
    const mutation=UPGRADE_DEFINITIONS.find(u=>u.key==='pistolBoomerang'); mutation.apply(scene);scene.upgradeLevels.pistolBoomerang=1;
    scene.updateUI();
  });
  await page.keyboard.press('Tab');await pauseFrame(page);
  const scroll=page.locator('.u3-build-scroll');
  await scroll.evaluate(node=>{node.scrollTop=node.scrollHeight;node.focus();});
  const scrollBefore=await scroll.evaluate(node=>node.scrollTop);
  const denseTime=await inScene(page,s=>s.elapsedSurvivalMs);
  await page.waitForTimeout(180);
  assert.ok(scrollBefore>0); assert.equal(await scroll.evaluate(node=>node.scrollTop),scrollBefore);
  assert.equal(await inScene(page,s=>s.elapsedSurvivalMs),denseTime);
  await capture(page,'build-dense-rifle-scrolled');
  assert.ok(await page.locator('.u3-build-host').innerText().then(text=>text.includes('常驻电场')&&text.includes('额外链击')));
  await page.keyboard.press('Tab');await pauseFrame(page);
  assert.equal(await visible(page,'build').isVisible(),false);
  record('Dense build retains all weapon protocols/mutations and scroll while its owned pause freezes combat');

  await restart(page); await beginMission(page,'tesla');
  await inScene(page,s=>{s.playerInvulnerableUntilMs=1e9;s.weapons.tesla.cooldownMs=185;s.weapons.tesla.chainTargets=7;});
  await syntheticUpgrade(page,['attackSpeed','teslaChains','teslaField']);
  await capture(page,'tesla-cap-and-mutation');
  const text=await visible(page,'upgrade').innerText();
  assert.match(text,/180/); assert.match(text,/不可撤销/);
  await page.locator('.u3-upgrade-card').nth(0).click();await page.waitForTimeout(200);
  assert.equal(await inScene(page,s=>s.weapons.tesla.cooldownMs),180);
  assert.equal(await inScene(page,s=>s.weapons.tesla.damage),6);
  await syntheticUpgrade(page,['teslaField','damage','maxHealth']);
  await page.locator('.u3-upgrade-card').nth(0).click();await page.waitForTimeout(200);
  assert.equal(await inScene(page,s=>s.weaponMutations.teslaField),true);
  await page.evaluate(async()=>{
    const {UPGRADE_DEFINITIONS}=await import('/src/config/upgrades.js');const s=window.__u3TestGame.scene.getScene('PrototypeScene');
    window.__mutationAvailable=UPGRADE_DEFINITIONS.find(x=>x.key==='teslaField').isAvailable(s);
  });
  assert.equal(await page.evaluate(()=>window.__mutationAvailable),false);
  await syntheticUpgrade(page,['attackSpeed','teslaField','teslaChains']);
  assert.equal(await page.locator('.u3-upgrade-card').nth(0).isDisabled(),true);
  assert.equal(await page.locator('.u3-upgrade-card').nth(1).isDisabled(),true);
  await capture(page,'tesla-disabled-cap-and-active-mutation');
  await inScene(page,s=>{s.destroyLevelUpOverlay();s.isLevelUpActive=false;s.isResolvingLevelUp=false;s.pendingLevelUps=0;s.resumeGameplaySystems();});
  record('Tesla real minimum interval clamp, 6 damage unchanged, mutation one-shot, cap and mutation disabled states');

  for(const type of ['victory','failure','victory','failure']) {
    const beforeCredits=await inScene(page,s=>s.meta.credits);
    await inScene(page,(s,type)=>{s.elapsedSurvivalMs=378000;s.killCount=247;if(type==='victory')s.triggerVictory();else{s.health=0;s.triggerGameOver();}},type);
    const afterCredits=await inScene(page,s=>s.meta.credits);
    const award=await inScene(page,s=>s.lastRunCreditsEarned);
    assert.equal(afterCredits,beforeCredits+award);
    await inScene(page,(s,type)=>{for(let i=0;i<3;i++){if(type==='victory')s.showVictoryOverlay();else s.showGameOverOverlay();}},type);
    assert.equal(await inScene(page,s=>s.meta.credits),afterCredits);
    await page.keyboard.press('Tab');assert.equal(await visible(page,'build').isVisible(),false);
    await capture(page,`${type}-result-interaction`);
    await page.getByRole('button',{name:'返回行动准备',exact:true}).evaluate(node=>{node.click();node.click();});
    await page.waitForTimeout(180);
    assert.equal(await inScene(page,s=>s.isMissionActive),false);
    assert.equal(await inScene(page,s=>s.selectedWeaponId),null);
    assert.equal(await inScene(page,s=>s.meta.credits),afterCredits);
    assert.equal(await page.locator('[data-scp-u3]').count(),1,'only hidden build controller should remain');
    assert.equal(await page.locator('[data-scp-hud-text]').count(),1);
    await beginMission(page,'tesla');
  }
  record('Four victory/failure restarts: exact persisted reward once; replaying UI/clicks does not award twice; run resets');
  report.errors.push(...errors);await context.close();

  const detached=await openGame(browser);
  await beginMission(detached.page);
  await detached.page.keyboard.press('Tab');await pauseFrame(detached.page);
  await visible(detached.page,'build').evaluate(node=>node.remove());
  await pauseFrame(detached.page);
  assert.equal(await inScene(detached.page,s=>s.buildPanelController.mode),'terminal');
  assert.equal(await inScene(detached.page,s=>s.buildPanel.visible),true);
  assert.equal(await inScene(detached.page,s=>s.isPaused || s.physics.world.isPaused),true);
  await capture(detached.page,'fallback-build-detached-visible');
  await detached.page.keyboard.press('Tab');await pauseFrame(detached.page);
  assert.equal(await inScene(detached.page,s=>s.buildPanel.visible),false);
  assert.equal(await inScene(detached.page,s=>s.isPaused || s.physics.world.isPaused),false);
  report.errors.push(...detached.errors);await detached.context.close();
  record('Visible paused build DOM detaches → visible terminal fallback; second Tab closes and resumes');

  for(const fallback of ['texture','dom']) {
    const f=await openGame(browser,{failTexture:fallback==='texture',failDom:fallback==='dom'});
    await beginMission(f.page);await syntheticUpgrade(f.page,['damage','maxHealth','attackSpeed']);
    if(fallback==='texture') {
      assert.equal(await visible(f.page,'upgrade').isVisible(),true);
      await f.page.waitForFunction(() => ![...document.querySelectorAll('[data-scp-u3="upgrade"] image')].some(image => /u3-(ammunition|vitals)-v2/.test(image.getAttribute('href'))));
      await capture(f.page,'fallback-missing-material');
      await f.page.locator('.u3-upgrade-card').first().click();
    } else {
      assert.equal(await visible(f.page,'upgrade').count(),0);
      assert.equal(await inScene(f.page,s=>!!s.levelUpOverlay?.active),true);
      await capture(f.page,'fallback-phaser-upgrade');
      await f.page.mouse.click(240,255);
    }
    await f.page.waitForTimeout(210);
    assert.equal(await inScene(f.page,s=>s.isLevelUpActive),false);
    await inScene(f.page,s=>s.pauseGame());await capture(f.page,`fallback-${fallback}-pause`);
    if(fallback==='dom') await inScene(f.page,s=>s.resumeFromPause());else await f.page.getByRole('button',{name:'继续行动',exact:true}).click();
    await inScene(f.page,s=>s.triggerVictory());await capture(f.page,`fallback-${fallback}-victory`);
    assert.equal(await inScene(f.page,s=>!!s.resultOverlay?.active),true);
    report.errors.push(...f.errors);await f.context.close();
    record(`${fallback} unavailable: upgrade/pause/result recover with operable exit`);
  }
  assert.deepEqual(report.errors,[]);
} catch(error) { report.failure=String(error.stack??error);throw error; }
finally { await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'interaction-results.json'),JSON.stringify(report,null,2));await browser.close(); }
