import { chromium, openGame, beginMission, syntheticUpgrade, inScene, assert, fs, path, output } from './u3-browser-support.mjs';

const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={origin:'http://127.0.0.1:49183',stateSource:'隔离上下文内构造升级选项，真实键盘输入',checks:[]};
try {
  const {page,context,errors}=await openGame(browser);
  await beginMission(page);
  await syntheticUpgrade(page,['damage','maxHealth','attackSpeed']);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('.u3-upgrade-card').first().evaluate(node=>node===document.activeElement),true,'Tab reaches first upgrade card');
  const before=await inScene(page,s=>s.weapons.pistol.damage);
  await page.keyboard.press('Space');
  assert.equal(await inScene(page,s=>s.weapons.pistol.damage),before*1.2,'Space applies exactly once');
  await page.waitForFunction(() => !window.__u3TestGame.scene.getScene('PrototypeScene').isLevelUpActive, null, {timeout:1500});
  assert.equal(await inScene(page,s=>s.isLevelUpActive),false);
  await page.keyboard.down('Tab');await page.waitForTimeout(70);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),true,'Combat Tab still opens build');
  await page.keyboard.up('Tab');await page.waitForTimeout(70);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),true,'Tab keyup leaves build open');
  assert.equal(await inScene(page,s=>s.isPaused || s.physics.world.isPaused),true);
  await page.keyboard.press('Tab');await page.waitForTimeout(70);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),false,'Second Tab press closes build');
  assert.equal(await inScene(page,s=>s.isPaused || s.physics.world.isPaused),false);
  report.checks.push('Upgrade Tab focus and Space activate once; combat Tab press toggles paused build');
  await page.keyboard.press('Escape');await page.waitForTimeout(70);
  await page.keyboard.press('Tab');
  assert.equal(await page.getByRole('button',{name:'继续行动',exact:true}).evaluate(node=>node===document.activeElement),true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.getByRole('button',{name:'返回标题',exact:true}).evaluate(node=>node===document.activeElement),true);
  await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-scp-u3="pause"]').count(),0);
  report.checks.push('Pause Tab/Shift+Tab cycle within modal, Enter resumes');
  await inScene(page,s=>s.triggerVictory());
  await page.keyboard.press('Tab');await page.keyboard.press('Space');await page.waitForTimeout(180);
  assert.equal(await inScene(page,s=>s.isMissionActive),false);
  assert.equal(await page.locator('[data-scp-u3]').count(),1);
  report.checks.push('Result Space returns to preparation with modal cleaned');
  assert.deepEqual(errors,[]);report.errors=errors;
  await context.close();console.log('PASS U3 keyboard integration');
}catch(error){report.failure=String(error.stack??error);throw error;}
finally{await fs.writeFile(path.join(output,'keyboard-results.json'),JSON.stringify(report,null,2));await browser.close();}
