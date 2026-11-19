// Opens the built page in the headless browser that came with the teardown kit, poses the avatar, and writes square
// PNGs for a profile image:  node tools/snap.mjs
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import os from 'node:os';

// the teardown kit keeps the headless browser; it is installed as a Claude Code skill in the home folder
const {CHROMIUM, CHROMIUM_ARGS, playwright} = await import(pathToFileURL(path.join(os.homedir(), '.claude/skills/teardown/paths.mjs')).href);

const page0 = path.resolve('teardown-out/dist/stage-live.html');
const out = path.resolve('profile');
const SHOTS = [
  {name: 'float-front', cam: '全身', pose: 'ふわふわ', face: 'ふつう', look: '強気', nose: '高く', turn: 0.25},
  {name: 'float-side', cam: '全身', pose: 'ふわふわ', face: 'ふつう', look: '強気', nose: '高く', turn: 1.3},
  {name: 'stand-front', cam: '全身', pose: '立ち', face: 'ふつう', look: '強気', nose: '高く', turn: 0.25},
];
const {chromium} = playwright();
// Try the real GPU first; where the shell cannot reach one, fall back to the software renderer.
const tryLaunch = async (args) => {
  const b = await chromium.launch({executablePath: CHROMIUM, args});
  const p = await b.newPage();
  const ok = await p.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
  await p.close();
  if (ok) return b;
  await b.close();
  return null;
};
const browser =
  (await tryLaunch(CHROMIUM_ARGS)) ||
  (await tryLaunch(['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars'])) ||
  (await tryLaunch(['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']));
if (!browser) {
  console.error('no WebGL in the headless browser from this shell');
  process.exit(2);
}
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(page0).href);
await page.waitForFunction(() => window.STAGE && window.STAGE.vrm, null, {timeout: 60000});
for (const s of SHOTS) {
  await page.evaluate((s) => {
    const click = (t) => [...document.querySelectorAll('.sv-bt')].find((b) => b.textContent === t)?.click();
    click('オフ');
    window.STAGE.front();
    click(s.cam);
    click(s.pose);
    click(s.face);
    click(s.look);
    click(s.nose);
    window.STAGE.turnTo(s.turn || 0);
  }, s);
  await page.waitForTimeout(6500); // the camera eases in, the hair settles, the smoke fills out
  if (s === SHOTS[0]) console.log('nose vertices:', await page.evaluate(() => JSON.stringify(window.STAGE.nose)));
  const url = await page.evaluate(() => window.STAGE.snap(1024));
  const file = path.join(out, `${s.name}.png`);
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  console.log(file, fs.statSync(file).size);
}
await browser.close();
