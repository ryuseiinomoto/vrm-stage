// One still of the wallpaper page at a desktop shape, to check its framing:  node tools/wallshot.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const {CHROMIUM, playwright} = await import(pathToFileURL(path.join(os.homedir(), '.claude/skills/teardown/paths.mjs')).href);
const {chromium} = playwright();
const browser = await chromium.launch({executablePath: CHROMIUM, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars']});
const page = await browser.newPage({viewport: {width: 1280, height: 832}});
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(path.resolve('teardown-out/dist/stage-wall.html')).href);
await page.waitForFunction(() => window.STAGE && window.STAGE.vrm, null, {timeout: 60000});
await page.evaluate(() => {
  window.STAGE.manual(true);
  for (let i = 0; i < 240; i++) window.STAGE.tick(1 / 30);
});
const visible = await page.evaluate(() => [...document.querySelectorAll('.sv-title,.sv-hint,.sv-hud,.sv-credit,.sv-bar')].filter((n) => getComputedStyle(n).display !== 'none').length);
fs.mkdirSync('docs', {recursive: true});
await page.screenshot({path: 'teardown-out/wall-check.png'});
console.log('panel elements still visible:', visible);
await browser.close();
