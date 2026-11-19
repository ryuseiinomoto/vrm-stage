// Records the page to numbered PNG frames by stepping its clock, so the result is smooth however slowly the
// headless browser draws:  node tools/record.mjs [page] [outDir] [width] [height] [fps] [seconds]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const {CHROMIUM, CHROMIUM_ARGS, playwright} = await import(pathToFileURL(path.join(os.homedir(), '.claude/skills/teardown/paths.mjs')).href);
const [page0 = 'teardown-out/dist/stage-live.html', outDir = 'teardown-out/frames', W = '480', H = '270', FPS = '10', SEC = '8'] = process.argv.slice(2);
const w = Number(W);
const h = Number(H);
const fps = Number(FPS);
const seconds = Number(SEC);

const {chromium} = playwright();
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
  (await tryLaunch(['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars']));
if (!browser) {
  console.error('no WebGL in the headless browser from this shell');
  process.exit(2);
}
const page = await browser.newPage({viewport: {width: 1280, height: 720}});
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(path.resolve(page0)).href);
await page.waitForFunction(() => window.STAGE && window.STAGE.vrm, null, {timeout: 60000});
await page.waitForTimeout(1500);
fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});
// one full turn of the figure over the clip, so the loop closes
await page.evaluate((seconds) => {
  const S = window.STAGE;
  S.S.hud = false;
  S.S.spin = true;
  S.apply();
  S.manual(true);
  S.turnTo(0.35);
  S.spinEvery(seconds);
  S.view(8, -3, 1.12); // a little wider and lower, so the smoke under her is in the picture
}, seconds);
// let the camera arrive, the hair settle and the smoke fill out before the first frame
await page.evaluate(() => {
  for (let i = 0; i < 150; i++) window.STAGE.tick(1 / 30);
  window.STAGE.turnTo(0.35);
});
const n = Math.round(fps * seconds);
const t0 = Date.now();
for (let i = 0; i < n; i++) {
  const url = await page.evaluate(([dt, w, h]) => {
    // two half steps a frame keep the hair and the smoke steady at a low frame rate
    window.STAGE.tick(dt / 2);
    window.STAGE.tick(dt / 2);
    return window.STAGE.snap(w, h);
  }, [1 / fps, w, h]);
  fs.writeFileSync(path.join(outDir, String(i).padStart(4, '0') + '.png'), Buffer.from(url.split(',')[1], 'base64'));
}
console.log(`${n} frames ${w}x${h} in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${outDir}`);
await browser.close();
