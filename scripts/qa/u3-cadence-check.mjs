import {chromium,openGame,beginMission,syntheticUpgrade,inScene,assert,fs,path,output} from './u3-browser-support.mjs';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={source:'实际运行游戏，49183 独立临时上下文；测试构造升级选项/封顶数值，不改用户存档或截图',cases:[],errors:[]};
async function inspect(page,name,expectedAfter,disabled=false,missing=false) {
 const card=page.locator('.u3-upgrade-card').last();
 await card.waitFor({state:'visible'});
 await page.waitForTimeout(80);
 const geometry=await card.evaluate(card=>{
  const bounds=card.getBoundingClientRect();
  const blocks=[...card.querySelectorAll('.u3-upgrade-card-head,.u3-upgrade-visual,.u3-upgrade-benefit,.u3-upgrade-description,.u3-upgrade-comparisons')].map(node=>{
   const b=node.getBoundingClientRect();return {name:node.className,top:b.top,bottom:b.bottom,left:b.left,right:b.right,scrollHeight:node.scrollHeight,clientHeight:node.clientHeight};
  });
  const image=card.querySelector('[data-u3-cadence-weapon]'),matrix=image?.getScreenCTM();
  return {disabled:card.disabled,text:card.innerText,bounds:{top:bounds.top,bottom:bounds.bottom,left:bounds.left,right:bounds.right},blocks,
   trace:[...card.querySelectorAll('[data-cadence-spacing]')].map(node=>({spacing:Number(node.dataset.cadenceSpacing),interval:Number(node.dataset.cadenceInterval)})),
   weapon:image?{url:image.getAttribute('href'),scaleX:Math.hypot(matrix.a,matrix.b),scaleY:Math.hypot(matrix.c,matrix.d)}:null,
   fallbackVisible:card.querySelector('[data-u3-cadence-fallback]')?.getAttribute('visibility')!=='hidden'};
 });
 await page.screenshot({path:path.join(output,`${name}.png`)});
 await card.screenshot({path:path.join(output,`${name}-card.png`)});
 report.cases.push({name,...geometry});
 assert.equal(geometry.disabled,disabled);
 assert.equal(geometry.trace[1].interval,expectedAfter);
 assert.ok(Math.abs(geometry.trace[1].spacing/geometry.trace[0].spacing-expectedAfter/geometry.trace[0].interval)<.00001);
 for(const block of geometry.blocks){assert.ok(block.top>=geometry.bounds.top&&block.bottom<=geometry.bounds.bottom+1,`${name} ${block.name} clipped`);assert.ok(block.scrollHeight<=block.clientHeight+1,`${name} ${block.name} overflows`);}
 for(let i=1;i<geometry.blocks.length;i++)assert.ok(geometry.blocks[i].top>=geometry.blocks[i-1].bottom-1,`${name} blocks overlap`);
 if(missing){assert.equal(geometry.weapon,null);assert.equal(geometry.fallbackVisible,true);}
 else{assert.ok(Math.abs(geometry.weapon.scaleX-geometry.weapon.scaleY)<.00001,'Weapon is scaled uniformly');assert.equal(geometry.fallbackVisible,false);}
 return card;
}
try{
 for(const width of [960,1440])for(const dpr of [1,1.5,2])for(const weapon of ['pistol','tesla']){
  const {page,context,errors}=await openGame(browser,{width,height:width*540/960,dpr});
  await beginMission(page,weapon);
  await syntheticUpgrade(page,['damage','maxHealth','attackSpeed']);
  const before=await inScene(page,s=>s.weapons[s.selectedWeaponId].cooldownMs);
  const card=await inspect(page,`${weapon}-${width}-dpr${dpr}`,before*.85);
  if(width===960&&dpr===1){await card.hover();await card.screenshot({path:path.join(output,`${weapon}-hover-card.png`)});}
  await card.click();await page.waitForTimeout(170);
  assert.equal(await inScene(page,s=>s.weapons[s.selectedWeaponId].cooldownMs),before*.85);
  assert.equal(await page.locator('[data-scp-u3="upgrade"]').count(),0);
  report.errors.push(...errors);await context.close();
 }
 for(const [weapon,key,before,after,disabled] of [
  ['pistol','attackSpeed',90,80,false],['pistol','attackSpeed',80,80,true],
  ['tesla','attackSpeed',200,180,false],['tesla','teslaCooldown',190,180,false],['tesla','teslaCooldown',180,180,true]
 ]){
  const {page,context,errors}=await openGame(browser);await beginMission(page,weapon);
  await inScene(page,(s,value)=>{s.weapons[s.selectedWeaponId].cooldownMs=value;s.syncCombatStatsFromWeapons();},before);
  await syntheticUpgrade(page,['damage','maxHealth',key]);
  await inspect(page,`${weapon}-${key}-${before}-to-${after}`,after,disabled);
  report.errors.push(...errors);await context.close();
 }
 for(const weapon of ['pistol','tesla']){
  const {page,context,errors}=await openGame(browser,{failWeaponArt:true});
  await beginMission(page,weapon);await syntheticUpgrade(page,['damage','maxHealth','attackSpeed']);
  await page.waitForFunction(()=>!document.querySelector('[data-u3-cadence-weapon]'));
  const before=await inScene(page,s=>s.weapons[s.selectedWeaponId].cooldownMs);
  const card=await inspect(page,`${weapon}-missing-weapon`,before*.85,false,true);
  await card.click();assert.equal(await inScene(page,s=>s.weapons[s.selectedWeaponId].cooldownMs),before*.85);
  report.errors.push(...errors);await context.close();
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(`PASS ${report.cases.length} cadence game cases, DPR 1/1.5/2, both weapons, caps, fallback and immediate apply`);
}catch(error){report.failure=String(error.stack??error);throw error;}
finally{await fs.writeFile(path.join(output,'cadence-check.json'),JSON.stringify(report,null,2));await browser.close();}
