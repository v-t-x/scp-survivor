import {chromium,assert,fs,path,output} from './u3-browser-support.mjs';
const origin='http://127.0.0.1:49185';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={origin,source:'生产 dist，真实指针键盘，无响应改写、无游戏状态注入、独立临时浏览器上下文',checks:[],errors:[],materials:[]};
try{
  const context=await browser.newContext({viewport:{width:960,height:540},deviceScaleFactor:2});
  const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  page.on('response',response=>{if(/u3-(steel|chassis)-.*\.png/.test(response.url()))report.materials.push({url:response.url(),status:response.status()});});
  const response=await page.goto(origin,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.waitForTimeout(400);await page.screenshot({path:path.join(output,'production-title-dpr2.png')});
  await page.mouse.click(180,385);await page.waitForTimeout(130);
  await page.mouse.click(158,207);await page.waitForTimeout(80);
  await page.mouse.click(470,491);await page.waitForTimeout(150);
  await page.keyboard.down('KeyD');await page.waitForTimeout(320);await page.keyboard.up('KeyD');
  await page.keyboard.down('Tab');await page.waitForTimeout(80);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),true);
  assert.equal(await page.locator('[data-scp-u3="build"]').evaluate(node=>node.classList.contains('u3-frame-ready')),true);
  await page.screenshot({path:path.join(output,'production-build-dpr2.png')});
  await page.keyboard.up('Tab');await page.waitForTimeout(60);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),true);
  await page.keyboard.press('Tab');await page.waitForTimeout(60);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),false);
  await page.keyboard.press('Escape');await page.waitForTimeout(80);
  assert.equal(await page.locator('[data-scp-u3="pause"]').isVisible(),true);
  await page.screenshot({path:path.join(output,'production-pause-dpr2.png')});
  for (let i=0;i<8;i++) {
    await page.keyboard.press('Tab');await page.keyboard.press(i%2 ? 'Enter' : 'Space');
    assert.equal(await page.locator('[data-scp-u3="pause"]').count(),0);
    await page.keyboard.press('Escape');await page.waitForTimeout(60);
    assert.equal(await page.locator('[data-scp-u3="pause"]').isVisible(),true,`Immediate re-pause ${i+1}`);
  }
  await page.getByRole('button',{name:'返回标题',exact:true}).click();await page.waitForTimeout(160);
  assert.equal(await page.locator('[data-scp-u3]').count(),1);
  assert.equal(await page.locator('[data-scp-u3="build"]').isVisible(),false);
  assert.equal(await page.locator('[data-scp-hud-text]').count(),1);
  assert.ok(report.materials.some(asset=>asset.url.includes('u3-chassis-')&&asset.status===200));
  assert.ok(report.materials.some(asset=>asset.url.includes('u3-steel-')&&asset.status===200));
  // Also verify decorations used on upgrade/result pages exist in the built output.
  // This reads assets only; the production game remains free of test state injection.
  const builtAssets = await fs.readdir(path.resolve('dist/assets'));
  for (const name of ['ammunition','vitals','paper','chassis','containment']) {
    const asset = builtAssets.find(file => file.startsWith(`u3-${name}-v2-`) && file.endsWith('.png'));
    assert.ok(asset, `Missing production decoration: ${name}`);
    const url = `${origin}/assets/${asset}`;
    const assetResponse = await page.request.get(url);
    report.materials.push({url,status:assetResponse.status()});
    assert.equal(assetResponse.status(),200);
  }
  assert.deepEqual(report.errors,[]);
  report.checks.push('Production HTTP 200, steel plus all five v2 hashed U3 assets 200, DPR2 real display','Pointer title/selection/deployment, keyboard movement and Tab-toggle paused build','Eight immediate Space/Enter resume then Escape re-pause cycles; pointer quit returns title, no duplicate native roots');
  report.passed=true;await context.close();console.log('PASS production UI smoke at '+origin);
}catch(error){report.passed=false;report.failure=String(error.stack??error);throw error;}
finally{await fs.writeFile(path.join(output,'production-smoke.json'),JSON.stringify(report,null,2));await browser.close();}
