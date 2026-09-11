import { chromium,openGame,inScene,capture,fs,path,output } from './u3-browser-support.mjs';
const browser=await chromium.launch({headless:true,channel:process.env.U3_BROWSER_CHANNEL??'msedge'});
const {page,context,errors}=await openGame(browser);
const held=new Set();
try {
  await page.mouse.click(180,385);await page.waitForTimeout(100);
  await page.mouse.click(157,207);await page.waitForTimeout(100);await page.mouse.click(470,490);
  let state;
  for(let index=0;index<330;index++) {
    state=await inScene(page,s=>({active:s.isMissionActive,upgrade:s.isLevelUpActive,over:s.isGameOver,health:s.health,elapsed:s.elapsedSurvivalMs,kills:s.killCount,level:s.level,x:s.player.x,y:s.player.y,gems:s.xpGems.getChildren().filter(g=>g.active).map(g=>({x:g.x,y:g.y})),enemies:s.enemies.getChildren().filter(e=>e.active).map(e=>({x:e.x,y:e.y}))}));
    if(state.upgrade||state.over)break;
    const nearest=state.gems.sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];
    let dx=0,dy=0;
    if(nearest){dx=nearest.x-state.x;dy=nearest.y-state.y;}
    else if(state.enemies.some(e=>Math.hypot(e.x-state.x,e.y-state.y)<70)) {
      const close=state.enemies.sort((a,b)=>Math.hypot(a.x-state.x,a.y-state.y)-Math.hypot(b.x-state.x,b.y-state.y))[0];dx=state.x-close.x;dy=state.y-close.y;
    }
    const wanted=new Set([...(dx>8?['KeyD']:dx< -8?['KeyA']:[]),...(dy>8?['KeyS']:dy< -8?['KeyW']:[])]);
    for(const key of held)if(!wanted.has(key)){await page.keyboard.up(key);held.delete(key);}
    for(const key of wanted)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
    if(index===25)await capture(page,'natural-combat');
    await page.waitForTimeout(200);
  }
  for(const key of held)await page.keyboard.up(key);
  await capture(page,state.upgrade?'natural-first-upgrade':state.over?'natural-failure':'natural-gameplay-end');
  const report={source:'自然游玩：仅真实指针/键盘输入，读取场景定位经验，不写游戏状态、数值、时间或存档',state,errors};
  await fs.writeFile(path.join(output,'natural-play.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({upgrade:state.upgrade,over:state.over,health:state.health,elapsed:state.elapsed,level:state.level,kills:state.kills,errors}));
}finally{await context.close();await browser.close();}
