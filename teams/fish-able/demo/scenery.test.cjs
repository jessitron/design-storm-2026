const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1120},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.DEMO_URL||'http://localhost:8766/teams/fish-able/demo/');
 await page.waitForSelector('#scenery[data-ready=true]');
 assert.equal(await page.locator('#scenery canvas').count(),1);
 await page.selectOption('#episode','2023');await page.selectOption('#starting','sntl-531');await page.click('#start');
 await page.waitForTimeout(4000);await page.screenshot({path:'.context/fish-journey-3d.png',fullPage:true});
 await page.click('#view-mode');assert.equal(await page.locator('#scene-shell').isVisible(),false);
 await page.click('[data-leg=headwaters]');await page.waitForFunction(()=>document.querySelector('#location').textContent.includes('Eleven Mile'));
 const events=await page.locator('#events').textContent();await page.click('#view-mode');assert.equal(await page.locator('#scene-shell').isVisible(),true);assert.equal(await page.locator('#events').textContent(),events);
 // Scenery errors must not prevent a complete local Journey in diagram mode.
 await page.route('https://**/*',r=>r.abort());await page.reload();await page.waitForSelector('#scenery[data-ready=true]');await page.click('#view-mode');
 await page.selectOption('#episode','2023');await page.selectOption('#starting','sntl-531');await page.click('#start');
 for(const id of ['headwaters','canyon','river','reservoir','foothills']){await page.click(`[data-leg=${id}]`);await page.waitForFunction(()=>!document.querySelector('#choices').textContent.includes('Following the selected Leg'));}
 assert.equal(await page.locator('#status').textContent(),'JOURNEY COMPLETED');assert.deepEqual(errors,[]);
 console.log('PASS: 3D initializes, 3D/2D switching preserves Journey, blocked remote scenery does not prevent local completion.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
