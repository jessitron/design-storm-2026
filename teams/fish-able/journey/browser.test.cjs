// Uses an externally installed Playwright; no app build or runtime dependencies.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const {mkdirSync} = require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1120},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.DEMO_URL || 'http://localhost:8766/teams/fish-able/journey/');
  await page.selectOption('#episode','2023');await page.selectOption('#starting','sntl-531');
  const start=()=>page.click('#start');
  const go=async id=>{await page.click(`[data-leg="${id}"]`);await page.waitForFunction(()=>!document.querySelector('#choices').textContent.includes('Following the selected Leg'));};
  const trunk=async()=>{for(const id of ['headwaters','canyon','river','reservoir'])await go(id);};
  await start();await go('headwaters');assert.match(await page.locator('#readings').textContent(),/Reading unavailable/);
  for(const id of ['canyon','river','reservoir'])await go(id);
  assert.equal(await page.locator('#choices button').count(),2);
  mkdirSync('.context',{recursive:true});await page.screenshot({path:'.context/fish-journey-fork.png',fullPage:true});
  await go('foothills');assert.equal(await page.locator('#status').textContent(),'JOURNEY COMPLETED');
  assert.match(await page.locator('#readings').textContent(),/Observation date: 2023-06-01/);
  await page.screenshot({path:'.context/fish-journey.png',fullPage:true});
  const log=await page.locator('#events').textContent();await page.click('#replay');
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='JOURNEY COMPLETED');assert.equal(await page.locator('#events').textContent(),log);
  await page.click('#restart');assert.equal(await page.locator('#event-count').textContent(),'2 events');await start();await trunk();
  for(const id of ['waterton','conduit20','marston'])await go(id);
  assert.match(await page.locator('#location').textContent(),/Marston Treatment Plant/);assert.match(await page.locator('#readings').textContent(),/Reading unavailable/);
  await page.click('#restart');await page.fill('#departure','2023-06-20');await page.locator('#departure').dispatchEvent('change');await start();await go('headwaters');
  assert.match(await page.locator('#summary').textContent(),/Episode boundary/);assert.match(await page.locator('#location').textContent(),/Hoosier/);
  await page.click('#restart');await page.fill('#departure','2023-05-25');await page.locator('#departure').dispatchEvent('change');
  await page.getByText('About the Journey · sources & assumptions',{exact:true}).click();await page.check('#fixture');await start();await trunk();await go('foothills');
  assert.match(await page.locator('#events').textContent(),/Selected Leg found closed under the Regime/);assert.equal(await page.locator('#status').textContent(),'JOURNEY ENDED');assert.match(await page.locator('#location').textContent(),/Strontia/);
  // Restart cancels an in-flight animation; no stale arrival can mutate the new Journey.
  await page.uncheck('#fixture');await page.emulateMedia({reducedMotion:'no-preference'});await start();await page.click('[data-leg="headwaters"]');await page.click('#restart');await page.waitForTimeout(1800);
  assert.equal(await page.locator('#event-count').textContent(),'2 events');assert.match(await page.locator('#location').textContent(),/Hoosier/);
  await page.emulateMedia({reducedMotion:'reduce'});await page.selectOption('#episode','2024');await start();await trunk();await go('foothills');assert.equal(await page.locator('#status').textContent(),'JOURNEY COMPLETED');
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'.context/fish-journey-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: both Episodes, both forks, exact dates, missing Readings, boundary, fixture closure, replay, restart during animation, mobile layout; no browser errors.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
