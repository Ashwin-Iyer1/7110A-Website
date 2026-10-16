import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('legacy routes redirect under the project base and do not attach a custom domain', async()=>{
 const html=await readFile('dist/404.html','utf8'); const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 for(const [pathname,expected] of [['/7110A-Website/cads/sled','/7110A-Website/#cad/sled'],['/members','/#team'],['/7110A-Website/blocks','/7110A-Website/#planner']]){let actual;vm.runInNewContext(script,{location:{pathname,replace:value=>actual=value}});expect(actual).toBe(expected);}
 await expect(readFile('dist/CNAME')).rejects.toThrow();
});
test('catalog loads no GLB until requested, filters, handles missing models and 3D failure',async({page})=>{
 const requested=[];page.on('request',r=>{if(r.url().endsWith('.glb'))requested.push(r.url());});
 await page.goto('/');await expect(page.getByRole('heading',{name:/Build it/})).toBeVisible();await page.screenshot({path:'test-results/archive-desktop.png',fullPage:true});
 await page.getByRole('link',{name:'CAD library',exact:true}).click();await page.getByLabel('Find a model').fill('sled');await expect(page.locator('#result-count')).toHaveText('1 model');
 expect(requested).toEqual([]);await page.locator('.cad-card').click();await expect(page.locator('#model-status')).toContainText('has not been downloaded');
 await page.route('**/sled.glb',r=>r.fulfill({status:503,body:'unavailable'}));await page.getByRole('button',{name:/Load interactive 3D/}).click();await expect(page.locator('#model-status')).toContainText('could not load',{timeout:20000});
 await expect(page.getByRole('link',{name:'Download original GLB'})).toBeVisible();await page.goto('/#cad/missing');await expect(page.getByRole('heading',{name:'Model not found.'})).toBeVisible();
});
test('actual small archived Sled model renders through the viewer',async({page})=>{
 await page.route('**/sled.glb',async r=>r.fulfill({contentType:'model/gltf-binary',body:await readFile('7110a-website/Models/sled.glb')}));
 await page.goto('/#cad/sled');await page.getByRole('button',{name:/Load interactive 3D/}).click();await expect(page.locator('#model-status')).toContainText('3D ready',{timeout:30000});await page.getByRole('button',{name:'Reset view'}).click();
 await page.screenshot({path:'test-results/sled-model.png',fullPage:true});
});
test('route builder synchronizes blocks, keyboard steps, replay and validated imports',async({page})=>{
 await page.goto('/#planner');await expect(page.locator('#plan-state')).toHaveText('7 / 100 steps');await expect(page.locator('#pose')).toContainText('(72, 72)');
 await page.getByRole('button',{name:'Clear route',exact:true}).click();await page.getByLabel('Command',{exact:true}).selectOption('straight');await page.locator('#step-value').fill('144');await page.getByRole('button',{name:'Add step',exact:true}).click();await expect(page.locator('#warnings')).toContainText('leaves the field');
 await page.getByRole('button',{name:'Edit step 1',exact:true}).click();await page.locator('#step-value').fill('24');await page.getByRole('button',{name:'Update step',exact:true}).click();await expect(page.locator('#code')).toContainText('straight(24);');
 await page.locator('#import-plan').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await expect(page.getByRole('alert')).toContainText('valid route JSON');await expect(page.locator('#code')).toContainText('straight(24);');
 await page.getByRole('button',{name:'Load square example'}).click();await page.locator('#replay').fill('0');await expect(page.locator('#pose')).toContainText('heading 0');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download plan JSON'}).click();expect((await download).suggestedFilename()).toBe('7110a-route.json');
 await page.getByRole('link',{name:'CAD library',exact:true}).click();await page.getByRole('link',{name:'Route builder',exact:true}).click();await expect(page.locator('.blocklySvg')).toHaveCount(1);
 await page.screenshot({path:'test-results/route-builder.png',fullPage:true});
});
test('team photos, narrow layout and code-lab source links remain usable',async({page})=>{
 await page.setViewportSize({width:360,height:850});await page.goto('/#team');await expect(page.locator('.member')).toHaveCount(7);await page.getByRole('button',{name:'Next photo of Ashwin Iyer'}).click();await expect(page.locator('#photo-count-1')).toHaveText('2 / 3');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('link',{name:'Route builder',exact:true}).click();await expect(page.locator('#plan-state')).toContainText('steps');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/planner-mobile.png',fullPage:true});
 await page.getByRole('link',{name:'Code lab ↗',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(await page.locator('a[href*="Competition/src/main.cpp"]').getAttribute('href')).toContain('e3d7960af0ead4ad6b2c89cbdcb92fa4ca036cc6');
});
