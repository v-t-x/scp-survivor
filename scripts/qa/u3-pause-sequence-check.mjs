import {chromium, openGame, inScene, fs, path, output, assert} from './u3-browser-support.mjs';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const records=[];
try {
 const {page,context}=await openGame(browser,{dpr:2});
 await inScene(page,scene=>{
   window.__pauseTrace=[];
   for (const type of ['keydown','keyup']) window.addEventListener(type,event=>window.__pauseTrace.push({type,key:event.key,time:event.timeStamp,phase:'capture',paused:scene.isPaused}),true);
   for (const name of ['togglePause','pauseGame','resumeFromPause']) {
     const fn=scene[name];
     scene[name]=function(...args){window.__pauseTrace.push({method:name,paused:this.isPaused,time:performance.now()});return fn.apply(this,args);};
   }
 });
 await page.mouse.click(180,385);await page.waitForTimeout(130);
 await page.mouse.click(158,207);await page.waitForTimeout(80);
 await page.mouse.click(470,491);await page.waitForTimeout(150);
 await page.keyboard.down('KeyD');await page.waitForTimeout(320);await page.keyboard.up('KeyD');
 const snap=async label=>records.push({label,build:await page.locator('[data-scp-u3="build"]').isVisible(),pause:await page.locator('[data-scp-u3="pause"]').isVisible(),...await inScene(page,s=>({paused:s.isPaused,mission:s.isMissionActive,over:s.isGameOver,upgrade:s.isLevelUpActive,prev:[s.input.keyboard.prevCode,s.input.keyboard.prevType,s.input.keyboard.prevTime],queue:s.input.keyboard.manager.queue.map(e=>({key:e.key,type:e.type,cancel:e.cancelled,time:e.timeStamp})),trace:window.__pauseTrace.slice()}))});
 await page.keyboard.press('Tab');await page.waitForTimeout(80);await snap('build opened');
 await page.keyboard.press('Escape');await page.waitForTimeout(80);await snap('build closed by escape');
 await page.keyboard.press('Tab');await page.waitForTimeout(80);await snap('build reopened');
 await page.keyboard.press('Tab');await page.waitForTimeout(80);await snap('build closed by tab');
 assert.deepEqual(records.slice(0,4).map(record=>({paused:record.paused,build:record.build,pause:record.pause})),[
  {paused:true,build:true,pause:false},
  {paused:false,build:false,pause:false},
  {paused:true,build:true,pause:false},
  {paused:false,build:false,pause:false}
 ]);
 await page.keyboard.press('Escape');await page.waitForTimeout(80);await snap('first pause');
 await page.screenshot({path:path.join(output,'pause-sequence-before.png')});
 await page.keyboard.press('Tab');await page.keyboard.press('Space');await snap('space resume');
 await page.keyboard.press('Escape');await page.waitForTimeout(60);await snap('immediate escape');
 await page.waitForTimeout(200);await page.keyboard.press('Escape');await page.waitForTimeout(60);await snap('later escape');
 assert.deepEqual(records.slice(4).map(record=>record.paused),[true,false,true,false]);
 assert.equal(records.at(-1).trace.filter(event=>event.method==='togglePause').length-records[3].trace.filter(event=>event.method==='togglePause').length,3);
 await context.close();console.log('PASS build Esc closes without pause menu; three later Esc presses cause exactly three pause toggles');
}finally{await fs.writeFile(path.join(output,'pause-sequence-debug.json'),JSON.stringify(records,null,2));await browser.close();}
