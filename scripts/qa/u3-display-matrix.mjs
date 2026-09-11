import { chromium, openGame, beginMission, capture, inScene, restart, syntheticUpgrade, assert, fs, path, output } from './u3-browser-support.mjs';

const browser = await chromium.launch({ headless:true, channel:process.env.U3_BROWSER_CHANNEL ?? 'msedge' });
const report = { stateSource:'测试构造状态；所有图像来自实际运行游戏，未修改截图内容', cases:[], errors:[] };
const sizes=process.env.U3_QUICK_MATRIX ? [[960,540]] : [[960,540],[1440,810],[1920,1080]];
const ratios=process.env.U3_QUICK_MATRIX ? [1] : [1,1.5,2];

async function checkAndCapture(page, kind, prefix) {
  const root=page.locator(`[data-scp-u3="${kind}"]`);
  await root.waitFor({state:'visible'});
  await page.waitForTimeout(60);
  const geometry=await root.evaluate(root=>{
    const panel=root.querySelector('.u3-panel'); const bounds=panel.getBoundingClientRect();
    const overflow=[];
    for(const node of panel.querySelectorAll('button, h2, .u3-stat-value, .u3-build-mutations, .u3-pause-actions, .u3-build-weapon-summary, .u3-build-mutation-copy, .u3-upgrade-description, .u3-upgrade-comparisons, .u3-upgrade-risk')) {
      const b=node.getBoundingClientRect();
      if(b.left<bounds.left-1||b.right>bounds.right+1||b.top<bounds.top-1||b.bottom>bounds.bottom+1)overflow.push({className:node.className,text:node.textContent,b:{x:b.x,y:b.y,w:b.width,h:b.height}});
      for(let parent=node.parentElement;parent&&parent!==panel;parent=parent.parentElement) {
        const style=getComputedStyle(parent), p=parent.getBoundingClientRect();
        if(style.overflowY==='hidden'&&b.bottom>p.bottom+1)overflow.push({className:node.className,text:node.textContent,clippedBy:parent.className});
      }
    }
    return {bounds:{x:bounds.x,y:bounds.y,w:bounds.width,h:bounds.height},overflow,frame:root.classList.contains('u3-frame-ready'),font:getComputedStyle(panel).fontFamily};
  });
  await capture(page,`${prefix}-${kind}`);
  report.cases.push({name:`${prefix}-${kind}`,kind,...geometry});
  assert.deepEqual(geometry.overflow,[],`${prefix}-${kind} content outside its device`);
}

try {
  for(const [width,height]of sizes)for(const dpr of ratios) {
    const {page,context,errors}=await openGame(browser,{width,height,dpr});
    const prefix=`${width}x${height}-dpr${dpr}`;
    await beginMission(page,'pistol');
    await inScene(page,s=>{s.elapsedSurvivalMs=128000;s.killCount=37;s.health=76;s.playerInvulnerableUntilMs=1e9;s.player.setPosition(1280,1220);s.updateUI();});
    await syntheticUpgrade(page,['damage','maxHealth','attackSpeed']);
    await checkAndCapture(page,'upgrade',prefix);
    await page.evaluate(async()=>{
      const s=window.__u3TestGame.scene.getScene('PrototypeScene'); const {UPGRADE_DEFINITIONS}=await import('/src/config/upgrades.js');
      s.destroyLevelUpOverlay();s.isLevelUpActive=false;s.pendingLevelUps=0;s.isResolvingLevelUp=false;s.resumeGameplaySystems();
      for(const key of ['damage','maxHealth','attackSpeed']){const u=UPGRADE_DEFINITIONS.find(x=>x.key===key);u.apply(s);s.upgradeLevels[key]++;if(u.kind==='weapon')s.weapons.pistol.currentLevel++;}
      s.toggleBuildPanel();
    });
    await checkAndCapture(page,'build',prefix);
    await inScene(page,s=>{s.hideBuildPanel();s.pauseGame();});
    await checkAndCapture(page,'pause',prefix);
    await inScene(page,s=>{s.resumeFromPause();s.elapsedSurvivalMs=378000;s.killCount=247;s.triggerVictory();});
    await checkAndCapture(page,'victory',prefix);
    await restart(page);await beginMission(page,'tesla');
    await inScene(page,s=>{s.elapsedSurvivalMs=272000;s.killCount=153;s.health=0;s.triggerGameOver();});
    await checkAndCapture(page,'failure',prefix);
    report.errors.push(...errors);await context.close();
    console.log(`PASS ${prefix} five game overlays`);
  }
  assert.deepEqual(report.errors,[]);
} catch(error) {report.failure=String(error.stack??error);throw error;}
finally {await fs.writeFile(path.join(output,'display-matrix.json'),JSON.stringify(report,null,2));await browser.close();}
