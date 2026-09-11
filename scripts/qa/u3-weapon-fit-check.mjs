import {createRequire} from 'node:module';
import {chromium,openGame,beginMission,capture,assert,fs,path,output} from './u3-browser-support.mjs';
const sharp=createRequire(import.meta.url)('sharp');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const cases=[];
try {
  for(const weapon of ['rifle','tesla']) {
    const {data,info}=await sharp(`public/assets/art/u1/weapon-${weapon}-hero.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const alpha={left:info.width,top:info.height,right:0,bottom:0,width:info.width,height:info.height};
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>24){alpha.left=Math.min(alpha.left,x);alpha.right=Math.max(alpha.right,x+1);alpha.top=Math.min(alpha.top,y);alpha.bottom=Math.max(alpha.bottom,y+1);}
    const {page,context,errors}=await openGame(browser);
    await beginMission(page,weapon==='rifle'?'pistol':'tesla');
    await page.keyboard.down('Tab');await page.waitForTimeout(180);
    const geometry=await page.locator('.u3-build-weapon.is-primary .u3-build-diagram').evaluate((node,alpha)=>{
      const picture=node.querySelector('image'),matrix=picture.getScreenCTM();
      const scale=Math.min(picture.width.baseVal.value/alpha.width,picture.height.baseVal.value/alpha.height);
      const x=picture.x.baseVal.value+(picture.width.baseVal.value-alpha.width*scale)/2;
      const y=picture.y.baseVal.value+(picture.height.baseVal.value-alpha.height*scale)/2;
      const start=new DOMPoint(x+alpha.left*scale,y+alpha.top*scale).matrixTransform(matrix);
      const end=new DOMPoint(x+alpha.right*scale,y+alpha.bottom*scale).matrixTransform(matrix);
      const frame=node.getBoundingClientRect();
      return {top:start.y-frame.top,bottom:frame.bottom-end.y,left:start.x-frame.left,right:frame.right-end.x,frame:{width:frame.width,height:frame.height}};
    },alpha);
    await capture(page,`weapon-fit-${weapon}`);
    assert.ok(geometry.top>=4&&geometry.bottom>=4&&geometry.left>=4&&geometry.right>=4,`${weapon} complete alpha silhouette needs clear margins: ${JSON.stringify(geometry)}`);
    assert.deepEqual(errors,[]);cases.push({weapon,alpha,geometry,errors});await context.close();
  }
  console.log(JSON.stringify({passed:true,cases}));
}finally{await fs.writeFile(path.join(output,'weapon-fit-results.json'),JSON.stringify({source:'真实游戏与正式PNG alpha轮廓；构造武器状态，真实Tab输入',cases},null,2));await browser.close();}
