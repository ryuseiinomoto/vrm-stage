// A dark stage for an anime-style avatar: one spotlight pool on a black floor, the model on a slow turntable, hair and
// clothes moved by the model's own spring bones. Drag to orbit, wheel to zoom. The panel has four tabs: how you look
// at her, her colours and shirt pattern, accessories built here from simple shapes, and the stage around her.
// Drop any .vrm file on the page to put another avatar on the stage.
//
// The avatar bundled here is VRM1_Constraint_Twist_Sample, (c) 2022 pixiv Inc., VRM Public License 1.0
// (use by everyone, modification and redistribution allowed, credit not required).
import {VRMLoaderPlugin, VRMUtils} from '@pixiv/three-vrm';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import MODEL_B64 from '../model/girl.glb';
import {createOutfit} from './outfit.js';
import {createNearCity} from './nearcity.js';
import {createRuins} from './ruins.js';

const JP = `'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',sans-serif`;
const MONO = `'JetBrains Mono',ui-monospace,monospace`;
const CSS = `
html,body{background:#000;overflow:hidden;height:100%}
#app{position:fixed!important;inset:0!important;font-family:Inter,${JP};color:#e9e9ee;-webkit-font-smoothing:antialiased}
#gl{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}
#gl.drag{cursor:grabbing}
.sv-title{position:absolute;left:28px;top:22px;pointer-events:none}
.sv-title b{display:block;font:300 34px/1 Inter,sans-serif;letter-spacing:10px}
.sv-title span{display:block;margin-top:8px;font:500 10px ${MONO};letter-spacing:3px;color:#8d8d99}
.sv-hint{position:absolute;right:28px;top:26px;font:500 11px/1.7 ${JP};color:#8d8d99;text-align:right;pointer-events:none}
.sv-credit{position:absolute;right:28px;bottom:16px;font:500 9px ${MONO};letter-spacing:1px;color:#55555f;pointer-events:none;text-align:right}
.sv-bar{position:absolute;left:28px;top:96px;bottom:28px;width:272px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(14,14,18,.78);backdrop-filter:blur(10px);overflow:hidden}
.sv-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.1);flex:0 0 auto}
.sv-tab{flex:1;text-align:center;padding:11px 0 10px;font:600 12px ${JP};color:#8d8d99;cursor:pointer;user-select:none;border-bottom:2px solid transparent}
.sv-tab.on{color:#fff;border-bottom-color:#fff}
.sv-page{display:none;flex-direction:column;gap:15px;padding:16px;overflow-y:auto;flex:1 1 auto}
.sv-page.on{display:flex}
.sv-grp{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.sv-grp em{flex:0 0 100%;font:600 10px ${JP};font-style:normal;letter-spacing:2px;color:#8d8d99}
.sv-bt{height:26px;padding:0 11px;display:flex;align-items:center;border:1px solid rgba(255,255,255,.16);border-radius:999px;font:600 11.5px ${JP};color:#d8d8e0;white-space:nowrap;cursor:pointer;user-select:none}
.sv-bt:hover{background:rgba(255,255,255,.08)}
.sv-bt.on{background:#f2f2f6;border-color:#f2f2f6;color:#111}
.sv-sw{width:20px;height:20px;border-radius:50%;border:2px solid rgba(255,255,255,.18);cursor:pointer;box-sizing:border-box}
.sv-sw.on{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.35)}
.sv-pick{width:26px;height:22px;padding:0;border:1px solid rgba(255,255,255,.25);border-radius:6px;background:none;cursor:pointer}
.sv-note{font:500 10.5px/1.6 ${JP};color:#77777f}
.sv-hud{position:absolute;left:328px;right:28px;top:96px;bottom:44px;pointer-events:none;color:var(--hud,#35e0ff);font:500 10px/1.75 ${MONO};letter-spacing:1.6px;transition:opacity .4s}
.sv-hud i{position:absolute;width:26px;height:26px;border:1.5px solid currentColor;opacity:.8}
.sv-hud i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}
.sv-hud i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
.sv-hud i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}
.sv-hud i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
.sv-hud pre{position:absolute;right:14px;top:12px;margin:0;text-align:right;font:inherit;opacity:.92}
.sv-hud u{position:absolute;left:14px;bottom:12px;text-decoration:none;opacity:.8}
.sv-hud s{position:absolute;right:14px;bottom:12px;width:120px;height:3px;background:rgba(255,255,255,.12);text-decoration:none}
.sv-hud s b{display:block;height:100%;background:currentColor}
.sv-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:500 12px ${MONO};letter-spacing:4px;color:#8d8d99;background:#000;transition:opacity .8s}
.sv-drop{position:absolute;inset:14px;border:2px dashed rgba(255,255,255,.5);border-radius:18px;display:none;align-items:center;justify-content:center;font:600 18px ${JP};background:rgba(0,0,0,.55);pointer-events:none}
@media (max-width:760px){.sv-title b{font-size:22px;letter-spacing:6px}.sv-hint{display:none}.sv-bar{left:8px;right:8px;top:auto;bottom:8px;width:auto;height:44vh}.sv-credit{display:none}.sv-hud{left:8px;right:8px;top:70px;bottom:calc(44vh + 16px)}}
`;

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const el = (h, parent) => {
  const d = document.createElement('div');
  d.innerHTML = h.trim();
  const n = d.firstElementChild;
  parent.appendChild(n);
  return n;
};

// ------------------------------------------------------------ page
const style = document.createElement('style');
style.textContent = CSS;
document.head.appendChild(style);
document.title = 'STAGE / avatar viewer';
const app = document.getElementById('app');
const canvas = document.createElement('canvas');
canvas.id = 'gl';
app.appendChild(canvas);
el(`<div class="sv-title"><b>STAGE</b><span>AVATAR VIEWER</span></div>`, app);
el(`<div class="sv-hint">ドラッグで回す ・ ホイールで拡大<br>.vrm ファイルをドロップすると差し替え</div>`, app);
const hud = el(`<div class="sv-hud"><i></i><i></i><i></i><i></i><pre></pre><u></u><s><b></b></s></div>`, app);
const hudText = hud.querySelector('pre');
const hudLeft = hud.querySelector('u');
const hudBar = hud.querySelector('s b');
const credit = el(`<div class="sv-credit"></div>`, app);
const bar = el(`<div class="sv-bar"><div class="sv-tabs"></div></div>`, app);
const drop = el(`<div class="sv-drop">ここに .vrm ファイルをドロップ</div>`, app);
const loading = el(`<div class="sv-load">LOADING</div>`, app);

// ------------------------------------------------------------ stage
const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 80);

const LIGHTS = {
  white: {name: '白', key: '#ffffff', pool: '#9a9aa2', rim: '#cfd8ff'},
  cyber: {name: 'サイバー', key: '#eefcff', pool: '#2f8f9e', rim: '#35e0ff'},
  ice: {name: '青', key: '#e6f1ff', pool: '#6f8fb8', rim: '#7fb6ff'},
  rose: {name: 'ピンク', key: '#fff0f3', pool: '#b87f97', rim: '#ff9cc4'},
  gold: {name: '金', key: '#fff6e0', pool: '#b89a66', rim: '#ffd27a'},
  amber: {name: '警告色', key: '#fff0dc', pool: '#9c5f2a', rim: '#ff8a1f'},
};
const BGS = {
  black: {name: '黒', lo: '#000000', hi: '#000000'},
  night: {name: '夜空', lo: '#01020a', hi: '#0c1a3c'},
  dusk: {name: '夕暮れ', lo: '#05020a', hi: '#33123a'},
  aurora: {name: 'オーロラ', lo: '#01060a', hi: '#0b3b3a'},
  dome: {name: '地下ドーム', lo: '#050404', hi: '#070606', dome: 1},
  ruin: {name: '荒廃都市', lo: '#060505', hi: '#0a0908', dome: 2},
};
const key = new THREE.DirectionalLight('#fff', 1.15);
key.position.set(1.2, 4.2, 3.0);
key.castShadow = true;
Object.assign(key.shadow.camera, {left: -2, right: 2, top: 2.8, bottom: -0.6, near: 0.5, far: 12});
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#cfd8ff', 0.55);
rim.position.set(-1.6, 2.6, -3.2);
scene.add(rim);
scene.add(new THREE.AmbientLight('#ffffff', 0.28));

// the sky behind: one vertical gradient
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {uLo: {value: new THREE.Color('#000')}, uHi: {value: new THREE.Color('#000')}, uDome: {value: 0}, uGlow: {value: new THREE.Color('#ff8a1f')}, uT: {value: 0}},
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  // uDome 1: an original underground hall. Overhead a lattice of six-sided ceiling panels, a few of them lit and
  // slowly breathing; round the horizon a ring of dark towers with scattered windows, standing in a low haze.
  fragmentShader: `uniform vec3 uLo; uniform vec3 uHi; uniform vec3 uGlow; uniform float uDome; uniform float uT; varying vec3 vD;
    float h1(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
    float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
    float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
    float hexD(vec2 p){ p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
    vec4 hexC(vec2 p){ const vec2 s = vec2(1.0, 1.7320508);
      vec4 c = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
      vec4 h = vec4(p - c.xy * s, p - (c.zw + 0.5) * s);
      return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy) : vec4(h.zw, c.zw + 0.5); }
    void main(){
      vec3 d = normalize(vD);
      float k = smoothstep(-0.05, 0.75, d.y);
      vec3 col = mix(uLo, uHi, k);
      if (uDome > 0.5 && uDome < 1.5) {
        float y = d.y;
        if (y > 0.0) {
          vec2 p = d.xz / (y + 0.22) * 2.6;
          vec4 hc = hexC(p);
          float e = hexD(hc.xy);
          float rnd = h2(hc.zw);
          float line = smoothstep(0.455, 0.5, e);
          float lit = step(0.88, rnd) * (1.0 - smoothstep(0.2, 0.44, e)) * (0.55 + 0.45 * sin(uT * 0.6 + rnd * 40.0));
          float up = smoothstep(0.015, 0.16, y);
          col += uGlow * (line * 0.085 + lit * 0.5) * up;
          // the ribs of the dome, running down to the rim
          float rib = 1.0 - smoothstep(0.0, 0.012, abs(fract(atan(d.z, d.x) * 1.9099) - 0.5) - 0.488);
          col += uGlow * rib * 0.05 * (1.0 - up) * smoothstep(0.0, 0.2, y);
        }
        // The towers stand on a floor far below the stage, so they run on down past eye level. Between them a
        // second, dimmer ring further off, and a glow rising from the depths. Everything sinks into haze well below.
        float deep = smoothstep(0.1, -0.7, y);
        col += uGlow * (0.2 * exp(-abs(y + 0.04) * 7.0) + 0.1 * deep);
        float a2 = atan(d.z, d.x) * 41.0 + 3.7;
        float seg2 = floor(a2);
        float hgt2 = 0.01 + 0.07 * pow(h1(seg2 + 21.0), 2.0);
        float far2 = step(y, hgt2) * step(abs(fract(a2) - 0.5), 0.38);
        vec2 w2 = vec2(fract(a2) * 5.0, y * 520.0);
        float win2 = step(0.86, h2(floor(w2) + seg2 + 50.0)) * step(0.4, fract(w2.x)) * step(0.5, fract(w2.y));
        col = mix(col, vec3(0.02, 0.016, 0.016) + uGlow * (0.035 + win2 * 0.16), far2 * 0.9);
        float a = atan(d.z, d.x) * 26.0;
        float seg = floor(a);
        float hgt = 0.018 + 0.1 * pow(h1(seg), 3.0) + 0.03 * h1(seg * 1.7 + 3.0);
        float tower = step(y, hgt) * step(abs(fract(a) - 0.5), 0.34 + 0.1 * h1(seg + 9.0));
        vec2 w = vec2(fract(a) * 7.0, y * 420.0);
        float win = step(0.82, h2(floor(w) + seg)) * step(0.35, fract(w.x)) * step(0.45, fract(w.y));
        float beacon = step(hgt - 0.004, y) * step(0.93, h1(seg + 5.0)) * step(abs(fract(a) - 0.5), 0.05) * step(0.0, sin(uT * 3.0 + seg));
        // a lit band every so often down the face of a tower, so the long drop has a scale
        float band = step(0.965, fract(y * 9.0 + h1(seg) * 3.0)) * step(0.5, h1(seg + 2.0));
        vec3 tcol = vec3(0.012, 0.011, 0.013) + uGlow * (win * (0.42 - 0.2 * deep) + band * 0.22 + beacon * 1.4);
        col = mix(col, tcol, tower);
        col = mix(col, uGlow * 0.07, smoothstep(-0.45, -0.95, y));
      }
      // uDome 2: a ruined city under a dusty sky. A dim sun behind the haze, drifting dust, three columns of smoke.
      // The skyline leans, its tops are knocked down in steps with bars standing out of them, some blocks are gutted
      // to the frame, and only a few windows are still alight, some of them failing. Fires burn low among them.
      if (uDome > 1.5) {
        float y = d.y;
        float ang = atan(d.z, d.x) / 6.2831853 + 0.5;
        vec3 dust = uGlow * 0.17 + vec3(0.05, 0.043, 0.04);
        col = mix(dust, vec3(0.01, 0.01, 0.013), smoothstep(-0.03, 0.34, y));
        vec3 sunDir = normalize(vec3(-0.55, 0.1, -0.83));
        float sd = max(dot(d, sunDir), 0.0);
        col += uGlow * (pow(sd, 1400.0) * 0.6 + pow(sd, 90.0) * 0.12);
        float cl = fbm(d.xz * 2.2 / (abs(y) + 0.35) + vec2(uT * 0.006, 0.0));
        col *= mix(1.0, 0.45 + 1.0 * cl, smoothstep(-0.02, 0.2, y));
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float da = abs(fract(ang - h1(fi + 31.0) - 0.035 * y * y + 0.5) - 0.5);
          float wd = 0.004 + 0.035 * max(y + 0.06, 0.0);
          float plume = (1.0 - smoothstep(wd * 0.3, wd, da)) * clamp(fbm(vec2(da * 140.0, y * 9.0 - uT * 0.1 + fi * 7.0)) * 1.6 - 0.2, 0.0, 1.0);
          col = mix(col, vec3(0.03, 0.027, 0.028), plume * smoothstep(-0.07, 0.02, y) * (1.0 - smoothstep(0.3, 0.7, y)) * 0.88);
        }
        float a2 = ang * 246.0;
        float seg2 = floor(a2);
        float far2 = step(y, 0.012 + 0.06 * pow(h1(seg2 + 21.0), 2.0)) * step(abs(fract(a2) - 0.5), 0.4);
        col = mix(col, mix(vec3(0.03, 0.026, 0.026), dust, 0.35), far2 * 0.85);
        float a = (ang + y * 0.012 * sin(ang * 31.0)) * 164.0;
        float seg = floor(a);
        float fx = fract(a);
        float hgt = 0.02 + 0.12 * pow(h1(seg), 2.5) + 0.03 * h1(seg * 1.7 + 3.0);
        float broken = step(0.45, h1(seg + 7.0));
        float top = hgt - broken * 0.035 * h1(seg + floor(fx * 6.0) * 3.1);
        float inside = step(abs(fx - 0.5), 0.34 + 0.1 * h1(seg + 9.0));
        float body = step(y, top) * inside;
        float bars = broken * inside * step(top, y) * step(y, top + 0.02 * h1(seg + floor(fx * 22.0))) * step(fract(fx * 22.0), 0.14);
        vec2 w = vec2(fx * 7.0, y * 420.0);
        float gutted = step(0.8, h1(seg + 13.0)) * step(top - 0.06, y);
        float lattice = max(step(fract(w.x), 0.16), step(fract(w.y * 0.5), 0.14));
        float lit = step(0.955, h2(floor(w) + seg)) * step(0.35, fract(w.x)) * step(0.45, fract(w.y));
        lit *= mix(1.0, step(0.3, fract(sin(floor(uT * 7.0) + seg * 3.0) * 43.7)), step(0.8, h2(floor(w) + seg + 4.0)));
        float deep = smoothstep(0.1, -0.7, y);
        vec3 tcol = vec3(0.014, 0.012, 0.013) + uGlow * lit * (0.5 - 0.2 * deep);
        col = mix(col, tcol, max(body * mix(1.0, lattice, gutted), bars));
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          vec2 q = vec2(abs(fract(ang - h1(fi + 31.0) + 0.5) - 0.5) * 70.0, (y + 0.03 + 0.03 * fi) * 18.0);
          col += vec3(1.0, 0.45, 0.12) * exp(-dot(q, q)) * (0.5 + 0.2 * sin(uT * (6.0 + fi) + fi));
        }
        col = mix(col, dust * 0.5, smoothstep(-0.4, -0.95, y));
      }
      gl_FragColor = vec4(col, 1.0); }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 16), skyMat);
sky.renderOrder = -10;
scene.add(sky);

// the floor: dark, one pool of light under the model, and a measuring grid that can be lit
const poolMat = new THREE.ShaderMaterial({
  uniforms: {uCol: {value: new THREE.Color(LIGHTS.white.pool)}, uR: {value: 2.3}, uBase: {value: new THREE.Color('#000')}, uHex: {value: 0}, uGrid: {value: 0}, uGridCol: {value: new THREE.Color('#35e0ff')}, uT: {value: 0}},
  vertexShader: `varying vec2 vP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 uCol; uniform vec3 uBase; uniform vec3 uGridCol; uniform float uR; uniform float uGrid; uniform float uHex; uniform float uT; varying vec2 vP;
    float fh2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float fhexD(vec2 p){ p = abs(p); return max(dot(p, vec2(0.5, 0.8660254)), p.x); }
    vec4 fhexC(vec2 p){ const vec2 s = vec2(1.0, 1.7320508);
      vec4 c = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
      vec4 h = vec4(p - c.xy * s, p - (c.zw + 0.5) * s);
      return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy) : vec4(h.zw, c.zw + 0.5); }
    void main(){ float len = length(vP); float d = len / uR; float k = 1.0 - smoothstep(0.0, 1.0, d); k = k * k * (0.55 + 0.45 * k);
      float n = fract(sin(dot(floor(vP * 260.0), vec2(12.9898, 78.233))) * 43758.5453);
      float far = smoothstep(4.0, 14.0, len);
      vec3 col = mix(uCol * k * (0.96 + 0.08 * n), uBase, far);
      // lines every 0.5 m, a brighter one every 2 m, and a slow pulse running outward
      vec2 a = vP * 2.0;
      vec2 g = abs(fract(a - 0.5) - 0.5) / max(fwidth(a), vec2(1e-4));
      float line = 1.0 - min(min(g.x, g.y), 1.0);
      vec2 b = vP * 0.5;
      vec2 g2 = abs(fract(b - 0.5) - 0.5) / max(fwidth(b), vec2(1e-4));
      float major = 1.0 - min(min(g2.x, g2.y), 1.0);
      float pulse = 0.6 + 0.4 * smoothstep(0.92, 1.0, sin(len * 2.4 - uT * 1.6));
      // six-sided tiles, 0.6 m across, a few of them lit
      vec4 hc = fhexC(vP * 1.6667);
      float he = fhexD(hc.xy);
      float hw = fwidth(vP.x * 1.6667) * 1.5;
      float hline = smoothstep(0.5 - hw - 0.012, 0.5 - hw * 0.3, he);
      float hr = fh2(hc.zw);
      float hlit = step(0.9, hr) * (1.0 - smoothstep(0.3, 0.46, he)) * (0.5 + 0.5 * sin(uT * 1.1 + hr * 30.0));
      float sq = line * 0.34 + major * 0.5;
      float hx = hline * 0.6 + hlit * 0.3;
      col += uGridCol * uGrid * mix(sq, hx, uHex) * pulse * (1.0 - smoothstep(1.5, 9.0, len));
      gl_FragColor = vec4(col, 1.0); }`,
});
const STAGE_R = 1.16;
const STAGE_H = 0.18;
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), poolMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const shadowMat = new THREE.ShadowMaterial({color: '#000', opacity: 0.6, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8});
const shade = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), shadowMat);
shade.rotation.x = -Math.PI / 2;
shade.receiveShadow = true;
scene.add(shade);
// the stage: a low drum with a lit top edge and a second ring of light round its foot
const stage = new THREE.Group();
{
  const top = new THREE.Mesh(new THREE.CircleGeometry(STAGE_R, 72), poolMat);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.001;
  const topShade = new THREE.Mesh(new THREE.CircleGeometry(STAGE_R, 72), shadowMat);
  topShade.rotation.x = -Math.PI / 2;
  topShade.position.y = 0.002;
  topShade.receiveShadow = true;
  const side = new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R, STAGE_R + 0.07, STAGE_H, 72, 1, true), new THREE.MeshToonMaterial({color: '#14151a'}));
  side.position.y = -STAGE_H / 2;
  const under = new THREE.Mesh(new THREE.CircleGeometry(STAGE_R + 0.07, 72), new THREE.MeshBasicMaterial({color: '#050506'}));
  under.rotation.x = Math.PI / 2;
  under.position.y = -STAGE_H;
  stage.add(top, topShade, side, under);
  stage.userData = {topShade};
}
scene.add(stage);

// glowing parts share one material, so they all take the colour of the stage light
const ledMat = new THREE.MeshBasicMaterial({color: '#35e0ff'});
const holoMat = new THREE.MeshBasicMaterial({color: '#35e0ff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide});
const holoSoft = new THREE.MeshBasicMaterial({color: '#35e0ff', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide});
const glassMat = new THREE.MeshBasicMaterial({color: '#35e0ff', transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide});

// rings on the floor, turning against each other
const floorRings = new THREE.Group();
{
  const flat = (geo, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    return m;
  };
  const inner = new THREE.Group();
  inner.add(flat(new THREE.RingGeometry(0.62, 0.632, 96), holoMat));
  for (let i = 0; i < 4; i++) inner.add(flat(new THREE.RingGeometry(0.66, 0.7, 20, 1, (i / 4) * Math.PI * 2, 0.9), holoSoft));
  const outer = new THREE.Group();
  for (let i = 0; i < 24; i++) outer.add(flat(new THREE.RingGeometry(0.93, i % 6 === 0 ? 1.02 : 0.965, 3, 1, (i / 24) * Math.PI * 2, 0.05), holoMat));
  outer.add(flat(new THREE.RingGeometry(1.06, 1.066, 96), holoSoft));
  floorRings.add(inner, outer);
  floorRings.position.y = 0.006;
  floorRings.userData = {inner, outer};
}
scene.add(floorRings);
// the stage's own lights, in the colour of the stage light
{
  const ring = (r, tube, y) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 96), ledMat);
    m.rotation.x = Math.PI / 2;
    m.position.y = y;
    stage.add(m);
  };
  ring(STAGE_R + 0.004, 0.009, -0.008);
  ring(STAGE_R + 0.072, 0.007, -STAGE_H + 0.012);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.006), i % 3 === 0 ? ledMat : holoSoft);
    m.position.set(Math.cos(a) * (STAGE_R + 0.037), -STAGE_H / 2, Math.sin(a) * (STAGE_R + 0.037));
    m.rotation.y = -a + Math.PI / 2;
    stage.add(m);
  }
}

// the beam: a faint cone of light from above
const beamMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  uniforms: {uCol: {value: new THREE.Color('#cfd8ff')}, uA: {value: 0}},
  vertexShader: `varying float vH; varying vec3 vN; varying vec3 vV; void main(){ vH = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 uCol; uniform float uA; varying float vH; varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); gl_FragColor = vec4(uCol, uA * f * (0.25 + 0.75 * vH * vH)); }`,
});
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.15, 5.4, 48, 1, true), beamMat);
beam.position.y = 2.7;
beam.renderOrder = 8;
scene.add(beam);
const shafts = new THREE.Group();
const shaftMat = beamMat.clone();
shaftMat.uniforms = {uCol: {value: new THREE.Color('#ff8a1f')}, uA: {value: 0.2}};
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2 + 0.4;
  const r = 9 + (i % 3) * 3.5;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.9 + (i % 2) * 0.8, 16, 28, 1, true), shaftMat);
  m.position.set(Math.cos(a) * r, 8, Math.sin(a) * r);
  m.rotation.set(Math.sin(a * 3.0) * 0.06, 0, Math.cos(a * 2.0) * 0.06);
  m.renderOrder = 7;
  shafts.add(m);
}
shafts.visible = false;
scene.add(shafts);
const ruins = createRuins();
ruins.group.visible = false;
scene.add(ruins.group);
const near = createNearCity();
near.group.visible = false;
scene.add(near.group);

// ------------------------------------------------------------ things in the air
const NP = 420;
const pBase = new Float32Array(NP * 5); // x, y, z, phase, speed
{
  let s = 1234567;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < NP; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 2.6;
    pBase.set([Math.cos(a) * d, r() * 3.2, Math.sin(a) * d, r() * 6.28, 0.6 + r() * 0.8], i * 5);
  }
}
const ptsGeo = new THREE.BufferGeometry();
ptsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
const pts = new THREE.Points(ptsGeo, new THREE.PointsMaterial({color: '#ffffff', size: 1.6, transparent: true, opacity: 0.32, depthWrite: false, sizeAttenuation: false}));
pts.frustumCulled = false;
scene.add(pts);
const NPET = 150;
const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.019, 6), new THREE.MeshBasicMaterial({color: '#ffb7cf', side: THREE.DoubleSide, transparent: true, opacity: 0.92}), NPET);
petals.frustumCulled = false;
petals.visible = false;
scene.add(petals);
const FX = {ash: '灰', data: 'データ粒', dust: 'ほこり', snow: '雪', petal: '花びら', spark: 'きらめき', none: 'なし'};
const FXP = {
  dust: {n: 260, size: 1.6, op: 0.32, fall: -0.035, drift: 0.12},
  snow: {n: NP, size: 3.2, op: 0.85, fall: 0.22, drift: 0.22, white: true},
  spark: {n: NP, size: 2.4, op: 0.9, fall: -0.06, drift: 0.12, blink: true},
  data: {n: 300, size: 2.6, op: 0.85, fall: -0.42, drift: 0.0, blink: true},
  ash: {n: NP, size: 2.0, op: 0.6, fall: 0.11, drift: 0.34, grey: true},
};

// ------------------------------------------------------------ the avatar
const turntable = new THREE.Group();
scene.add(turntable);
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));
let vrm = null;
let height = 1.5;
let tris = 0;
const PART_RE = {hair: /hair/i, eye: /eyeiris|iris/i, top: /tops|onepiece|onep/i, bottom: /bottoms/i, shoes: /shoes/i};
const PART_NAME = {hair: '髪', eye: '目', top: 'トップス', bottom: 'ボトムス', shoes: 'くつ'};
const parts = {}; // part -> [{mat, map, shade, col, shadeCol, made}]

// A texture pulled to another colour: its light-and-dark drawing is kept as a ramp of the new colour.
// pattern draws a second colour across the cloth in texture space.
function recolor(tex, hex, {dark = 0.5, pattern = 'plain', hex2 = '#ffffff'} = {}) {
  const img = tex?.image;
  if (!img || !img.width) return null;
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', {willReadFrequently: true});
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h);
  const p = d.data;
  let lo = 255;
  let hi = 0;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 8) continue;
    const l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    if (l < lo) lo = l;
    if (l > hi) hi = l;
  }
  const span = Math.max(110, hi - lo);
  const c1 = new THREE.Color(hex);
  const c2 = new THREE.Color(hex2);
  const A1 = [c1.r * 255, c1.g * 255, c1.b * 255];
  const B1 = [c2.r * 255, c2.g * 255, c2.b * 255];
  const band = Math.max(4, Math.round(h / 26));
  const cell = Math.max(8, Math.round(w / 22));
  const thin = Math.max(1, Math.round(w / 512));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const l = clamp(1 - (hi - (0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2])) / span, 0, 1);
      let m = 0; // how much of the second colour
      let glow = 0; // drawn at full brightness, like a lit line
      if (pattern === 'stripe') m = Math.floor(y / band) % 2;
      else if (pattern === 'grad') m = clamp((y / h - 0.25) / 0.5, 0, 1);
      else if (pattern === 'dot') {
        const dx = (x % cell) - cell / 2;
        const dy = (y % cell) - cell / 2;
        m = dx * dx + dy * dy < cell * cell * 0.075 ? 1 : 0;
      } else if (pattern === 'check') m = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 ? 0.55 : 0;
      else if (pattern === 'tech') {
        // circuit lines: a fine lattice, heavier traces every fourth cell, pads where they cross
        const cx = x % cell;
        const cy = y % cell;
        const hx = Math.floor(x / cell) % 4 === 0 && cx < thin * 3;
        const hy = Math.floor(y / cell) % 4 === 0 && cy < thin * 3;
        const pad = cx < thin * 5 && cy < thin * 5 && (Math.floor(x / cell) + Math.floor(y / cell)) % 3 === 0;
        if (hx || hy || pad) glow = 1;
        else if (cx < thin || cy < thin) m = 0.35;
      }
      for (let j = 0; j < 3; j++) {
        const c = A1[j] + (B1[j] - A1[j]) * m;
        const light = c + (255 - c) * 0.16;
        const v = c * dark + (light - c * dark) * l;
        p[i + j] = glow ? B1[j] + (255 - B1[j]) * 0.25 : v;
      }
    }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = tex.colorSpace;
  t.flipY = tex.flipY;
  t.wrapS = tex.wrapS;
  t.wrapT = tex.wrapT;
  return t;
}

// ------------------------------------------------------------ state
const THEMES = {
  cyber: {name: 'サイバー', hair: '#e6e9f5', eye: '#35e0ff', top: '#2b2b35', pattern: 'tech', color2: '#35e0ff', bottom: '#2b2b35', shoes: '#e6e9f5', hoodie: true, kicks: true, hoodieCol: '#15161b', emblemCol: '#dfe2ea', kickCol: '#15161b', headset: true, visor: false, patch: true, holo: true, ribbon: false, flower: false, ears: false, tail: false, halo: false, wings: false, acc: '#ff3d4d', fx: 'data', bg: 'night', light: 'cyber', beam: false, grid: true, rings: true, hud: true, floorPat: 'sq', stand: 'stage', floor: false},
  ruin: {name: '廃墟の街', hair: '#c9693a', eye: '#74b8ff', top: '#2b2b35', pattern: 'tech', color2: '#ff8a1f', bottom: '#2b2b35', shoes: '#e6e9f5', hoodie: true, kicks: true, hoodieCol: '#15161b', emblemCol: '#ff8a1f', kickCol: '#15161b', headset: false, visor: false, patch: true, holo: false, ribbon: false, flower: false, ears: true, tail: false, halo: false, wings: false, acc: '#ff3d4d', fx: 'ash', bg: 'ruin', light: 'amber', beam: false, grid: true, rings: false, hud: true, floorPat: 'hex', stand: 'beam', floor: false},
  base: {name: '地下基地', hair: '#c9693a', eye: '#74b8ff', top: '#2b2b35', pattern: 'tech', color2: '#ff8a1f', bottom: '#2b2b35', shoes: '#e6e9f5', hoodie: true, kicks: true, hoodieCol: '#15161b', emblemCol: '#ff8a1f', kickCol: '#15161b', headset: false, visor: false, patch: true, holo: false, ribbon: false, flower: false, ears: true, tail: false, halo: false, wings: false, acc: '#ff3d4d', fx: 'dust', bg: 'dome', light: 'amber', beam: false, grid: true, rings: true, hud: true, floorPat: 'hex', stand: 'stage', floor: false},
  snow: {name: '雪の精', hair: '#e6e9f5', eye: '#74b8ff', top: '#ffffff', pattern: 'grad', color2: '#74b8ff', bottom: '#2f4a7a', shoes: '#e6e9f5', hoodie: false, kicks: false, hoodieCol: '#15161b', emblemCol: '#dfe2ea', kickCol: '#15161b', headset: false, visor: false, patch: false, holo: false, ribbon: true, flower: false, ears: false, tail: false, halo: false, wings: false, acc: '#74b8ff', fx: 'snow', bg: 'night', light: 'ice', beam: true, grid: false, rings: false, hud: false, floorPat: 'sq', stand: 'stage', floor: false},
  sakura: {name: 'さくら', hair: '#f5a3c0', eye: '#e4476b', top: '#ffffff', pattern: 'dot', color2: '#f5a3c0', bottom: '#e4476b', shoes: '#ffffff', hoodie: false, kicks: false, hoodieCol: '#15161b', emblemCol: '#dfe2ea', kickCol: '#15161b', headset: false, visor: false, patch: false, holo: false, ribbon: true, flower: true, ears: false, tail: false, halo: false, wings: false, acc: '#e4476b', fx: 'petal', bg: 'dusk', light: 'rose', beam: false, grid: false, rings: false, hud: false, floorPat: 'sq', stand: 'stage', floor: false},
  cat: {name: '黒ねこ', hair: '#2b2b35', eye: '#f3d67c', top: '#2b2b35', pattern: 'stripe', color2: '#b79af5', bottom: '#2b2b35', shoes: '#b79af5', hoodie: false, kicks: false, hoodieCol: '#15161b', emblemCol: '#dfe2ea', kickCol: '#15161b', headset: false, visor: false, patch: false, holo: false, ribbon: false, flower: false, ears: true, tail: true, halo: false, wings: false, acc: '#b79af5', fx: 'spark', bg: 'dusk', light: 'white', beam: false, grid: false, rings: false, hud: false, floorPat: 'sq', stand: 'stage', floor: false},
  angel: {name: '天使', hair: '#f3d67c', eye: '#69d8b4', top: '#ffffff', pattern: 'plain', color2: '#f3d67c', bottom: '#ffffff', shoes: '#f3d67c', hoodie: false, kicks: false, hoodieCol: '#15161b', emblemCol: '#dfe2ea', kickCol: '#15161b', headset: false, visor: false, patch: false, holo: false, ribbon: false, flower: false, ears: false, tail: false, halo: true, wings: true, acc: '#f3d67c', fx: 'spark', bg: 'aurora', light: 'gold', beam: true, grid: false, rings: false, hud: false, floorPat: 'sq', stand: 'stage', floor: false},
  plain: {name: '元にもどす', hair: null, eye: null, top: null, bottom: null, shoes: null, pattern: 'plain', color2: '#e4476b', hoodie: false, kicks: false, hoodieCol: '#15161b', emblemCol: '#dfe2ea', kickCol: '#15161b', headset: false, visor: false, patch: false, holo: false, ribbon: false, flower: false, ears: false, tail: false, halo: false, wings: false, acc: '#e4476b', fx: 'dust', bg: 'black', light: 'white', beam: false, grid: false, rings: false, hud: false, floorPat: 'sq', stand: 'none', floor: true},
};
const S = {spin: true, pose: 'stand', face: 'neutral', cam: 'full', thigh: 1.12, ...THEMES.ruin};
delete S.name;
const CAMS = {
  full: {name: '全身', ty: 0.5, d: 4.05, az: 12, el: 9},
  bust: {name: '上半身', ty: 0.84, d: 1.3, az: 14, el: 2},
  face: {name: '顔', ty: 0.93, d: 0.66, az: 10, el: 0},
  back: {name: '後ろ姿', ty: 0.5, d: 4.05, az: 162, el: 9},
  feet: {name: '足元', ty: 0.07, d: 1.05, az: 38, el: 14},
};
const POSES = {stand: '立ち', wave: '手を振る', model: 'ポーズ', tpose: 'T字'};
const FACES = {neutral: 'ふつう', happy: '笑顔', relaxed: 'おだやか', surprised: 'びっくり', angry: 'むっ', sad: 'しょんぼり'};
const PATTERNS = {plain: '無地', tech: '回路', stripe: 'ボーダー', grad: 'グラデ', dot: 'ドット', check: 'チェック'};
const SWATCH = ['#e6e9f5', '#f3d67c', '#f5a3c0', '#b79af5', '#74b8ff', '#35e0ff', '#69d8b4', '#ff3d4d', '#e4476b', '#8a5a3c', '#2b2b35'];
const off = {az: 0, el: 0, k: 1};
const cam = {ty: 0.8, d: 3, az: 12, el: 4};
let turn = 0;
let poseNow = null;

function applyPart(part) {
  const hex = S[part];
  for (const h of parts[part] || []) {
    h.made?.dispose();
    h.made = null;
    if (hex) {
      h.made = recolor(h.map, hex, {dark: part === 'eye' ? 0.22 : part === 'hair' ? 0.56 : 0.5, pattern: part === 'top' ? S.pattern : 'plain', hex2: S.color2});
      if (!h.made) continue;
      h.mat.map = h.made;
      if ('shadeMultiplyTexture' in h.mat) h.mat.shadeMultiplyTexture = h.made;
      h.mat.color?.set('#ffffff');
      h.mat.shadeColorFactor?.set('#b4b9d2');
    } else {
      h.mat.map = h.map;
      if ('shadeMultiplyTexture' in h.mat) h.mat.shadeMultiplyTexture = h.shade;
      if (h.col) h.mat.color.copy(h.col);
      if (h.shadeCol) h.mat.shadeColorFactor.copy(h.shadeCol);
    }
    h.mat.needsUpdate = true;
  }
  if (part === 'hair') furMat.color.set(S.hair || '#7a5a48');
}
const applyColours = () => Object.keys(PART_RE).forEach(applyPart);
function applyStage() {
  const L = LIGHTS[S.light];
  key.color.set(L.key);
  rim.color.set(L.rim);
  poolMat.uniforms.uCol.value.set(L.pool);
  poolMat.uniforms.uGridCol.value.set(L.rim);
  beamMat.uniforms.uCol.value.set(L.rim);
  for (const m of [ledMat, holoMat, holoSoft, glassMat]) m.color.set(L.rim);
  hud.style.setProperty('--hud', L.rim);
  const B = BGS[S.bg];
  skyMat.uniforms.uLo.value.set(B.lo);
  skyMat.uniforms.uHi.value.set(B.hi);
  skyMat.uniforms.uDome.value = B.dome || 0;
  ruins.group.visible = B.dome === 2;
  ruins.setColour(L.rim);
  skyMat.uniforms.uGlow.value.set(L.rim);
  shaftMat.uniforms.uCol.value.set(L.rim);
  shafts.visible = B.dome === 1;
  poolMat.uniforms.uHex.value = S.floorPat === 'hex' ? 1 : 0;
  // on a stage the wide floor, if it is shown at all, lies below the drum
  stage.visible = S.stand === 'stage';
  near.group.visible = S.stand === 'beam';
  ruins.setRoadDrop(S.stand === 'beam' ? 12 : 0);
  near.setColour(L.rim);
  floor.visible = !!S.floor;
  // the wide floor lies under the drum, or far down as the street when she is up on the girder
  floor.position.y = S.stand === 'stage' ? -STAGE_H : S.stand === 'beam' ? -44 : 0;
  shade.visible = !!S.floor;
  shade.position.y = floor.position.y;
  poolMat.uniforms.uBase.value.set(B.lo);
  const f = FXP[S.fx];
  pts.visible = !!f;
  petals.visible = S.fx === 'petal';
  if (f) {
    pts.material.size = f.size;
    pts.material.opacity = f.op;
    pts.material.color.set(f.white ? '#ffffff' : f.grey ? '#b3aca4' : L.rim);
  }
  hud.style.opacity = S.hud ? 1 : 0;
}

// ------------------------------------------------------------ accessories, built from simple shapes
// Sizes are in metres for a model about 1.55 m tall and are scaled to the avatar on mount.
// Head pieces sit in the head bone's frame: x to the model's left, y up, z to the front.
const toon = (c) => new THREE.MeshToonMaterial({color: c});
const accMat = toon(S.acc);
const furMat = toon('#e6e9f5');
const innerMat = toon('#ffc2d6');
const metalMat = toon('#23252d');
const patchMat = toon('#15161b');
const whiteMat = new THREE.MeshToonMaterial({color: '#ffffff', side: THREE.DoubleSide, emissive: '#30323c'});
const glowMat = new THREE.MeshBasicMaterial({color: '#fff2b0'});
const glowSoft = new THREE.MeshBasicMaterial({color: '#ffe680', transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false});
const yellowMat = toon('#ffd95a');
const ACCS = {headset: 'ヘッドセット', visor: 'バイザー', patch: '眼帯', holo: 'ホロリング', ribbon: 'リボン', flower: '花かざり', ears: 'ねこ耳', halo: '天使の輪', wings: 'はね', tail: 'しっぽ'};
const A = {};
{
  const mesh = (geo, mat, f) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = mat !== holoMat && mat !== holoSoft && mat !== glassMat;
    f?.(m);
    return m;
  };

  // an interface headset: two tapered sensor pods above the temples, each with a lit strip and an aerial,
  // joined by a band round the back of the head. An original piece in the sci-fi pilot style.
  const headset = new THREE.Group();
  for (const sgn of [-1, 1]) {
    const pod = new THREE.Group();
    pod.add(mesh(new THREE.CylinderGeometry(0.007, 0.02, 0.092, 6), accMat, (m) => m.scale.set(0.62, 1, 1.35)));
    pod.add(mesh(new THREE.BoxGeometry(0.0035, 0.058, 0.007), ledMat, (m) => m.position.set(sgn * 0.0085, 0.004, 0)));
    pod.add(mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.014, 20), metalMat, (m) => {
      m.rotation.z = Math.PI / 2;
      m.position.set(0, -0.046, 0);
    }));
    pod.add(mesh(new THREE.TorusGeometry(0.0165, 0.0028, 8, 24), ledMat, (m) => {
      m.rotation.y = Math.PI / 2;
      m.position.set(sgn * 0.008, -0.046, 0);
    }));
    pod.add(mesh(new THREE.CylinderGeometry(0.0013, 0.0013, 0.05, 6), metalMat, (m) => m.position.set(0, 0.07, -0.004)));
    pod.add(mesh(new THREE.SphereGeometry(0.0042, 10, 8), ledMat, (m) => m.position.set(0, 0.096, -0.004)));
    pod.position.set(sgn * 0.097, 0.158, -0.012);
    pod.rotation.set(-0.42, 0, -sgn * 0.3);
    headset.add(pod);
  }
  headset.add(mesh(new THREE.TorusGeometry(0.098, 0.0042, 8, 40, Math.PI), metalMat, (m) => {
    m.rotation.x = Math.PI / 2; // the half ring lies flat and runs round the back
    m.rotation.z = Math.PI;
    m.position.set(0, 0.112, -0.012);
  }));
  A.headset = {node: headset, bone: 'head'};

  // a visor: a strip of light across the eyes
  const visor = new THREE.Group();
  visor.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 40, 1, true, -1.05, 2.1), glassMat));
  for (const y of [-0.015, 0.015]) visor.add(mesh(new THREE.CylinderGeometry(0.1005, 0.1005, 0.002, 40, 1, true, -1.05, 2.1), holoMat, (m) => (m.position.y = y)));
  visor.position.set(0, 0.066, 0.006);
  A.visor = {node: visor, bone: 'head'};

  // an eyepatch over the model's left eye: a dark oval pad with a lit edge, on a strap that runs up across the
  // forehead and round the head. It is placed from the model's own eye bone when it is mounted.
  const patch = new THREE.Group();
  const pad = new THREE.Group();
  pad.add(mesh(new THREE.CylinderGeometry(1, 1, 1, 36), patchMat, (m) => {
    m.scale.set(0.029, 0.005, 0.023);
    m.rotation.x = Math.PI / 2;
  }));
  pad.add(mesh(new THREE.BoxGeometry(0.026, 0.0022, 0.002), ledMat, (m) => m.position.set(0, -0.0135, 0.003)));
  pad.add(mesh(new THREE.SphereGeometry(0.0026, 8, 6), ledMat, (m) => m.position.set(0.019, 0.011, 0.003)));
  pad.rotation.y = 0.3;
  const strap = new THREE.Group();
  strap.add(mesh(new THREE.TorusGeometry(0.1, 0.0026, 6, 64), patchMat, (m) => (m.rotation.x = Math.PI / 2)));
  strap.rotation.z = -0.6;
  patch.add(pad, strap);
  patch.userData = {pad, strap};
  A.patch = {
    node: patch,
    bone: 'head',
    place(u) {
      const e = eyeSpot ? eyeSpot.clone().divideScalar(u) : new THREE.Vector3(0.032, 0.066, 0.078);
      pad.position.set(e.x + 0.002, e.y, e.z + 0.011);
      // the strap is a ring about the middle of the head, tilted so that it passes through the pad
      const r = Math.hypot(e.x, e.z + 0.011) + 0.001;
      strap.scale.setScalar(r / 0.1);
      strap.position.set(0, e.y + Math.tan(0.6) * (e.x + 0.002), 0);
    },
  };

  // a holographic ring behind the head
  const holo = new THREE.Group();
  const spin = new THREE.Group();
  spin.add(mesh(new THREE.RingGeometry(0.15, 0.1535, 72), holoMat));
  for (let i = 0; i < 12; i++) spin.add(mesh(new THREE.RingGeometry(0.172, i % 3 === 0 ? 0.196 : 0.182, 4, 1, (i / 12) * Math.PI * 2, 0.16), holoMat));
  const counter = new THREE.Group();
  for (let i = 0; i < 3; i++) counter.add(mesh(new THREE.RingGeometry(0.118, 0.13, 20, 1, (i / 3) * Math.PI * 2, 1.2), holoSoft));
  holo.add(spin, counter);
  holo.position.set(0, 0.105, -0.15);
  holo.userData = {spin, counter};
  A.holo = {node: holo, bone: 'head'};

  // a bow on top of the head
  const ribbon = new THREE.Group();
  for (const sgn of [-1, 1]) {
    ribbon.add(mesh(new THREE.SphereGeometry(0.052, 20, 14), accMat, (m) => {
      m.scale.set(1.25, 0.8, 0.42);
      m.position.set(sgn * 0.058, 0.012, 0);
      m.rotation.z = sgn * 0.32;
    }));
    ribbon.add(mesh(new THREE.BoxGeometry(0.03, 0.085, 0.008), accMat, (m) => {
      m.position.set(sgn * 0.026, -0.052, -0.012);
      m.rotation.z = sgn * 0.3;
    }));
  }
  ribbon.add(mesh(new THREE.SphereGeometry(0.02, 14, 10), accMat));
  ribbon.position.set(0, 0.205, -0.02);
  A.ribbon = {node: ribbon, bone: 'head'};

  // a flower at the temple
  const flower = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    flower.add(mesh(new THREE.SphereGeometry(0.019, 12, 8), accMat, (m) => {
      m.scale.set(1, 1, 0.35);
      m.position.set(Math.cos(a) * 0.021, Math.sin(a) * 0.021, 0);
    }));
  }
  flower.add(mesh(new THREE.SphereGeometry(0.011, 10, 8), yellowMat, (m) => (m.position.z = 0.006)));
  flower.position.set(0.086, 0.118, 0.062);
  flower.rotation.y = 0.85;
  A.flower = {node: flower, bone: 'head'};

  // cat ears, the colour of the hair
  const ears = new THREE.Group();
  for (const sgn of [-1, 1]) {
    const e = new THREE.Group();
    e.add(mesh(new THREE.ConeGeometry(0.04, 0.085, 4), furMat, (m) => m.scale.set(1, 1, 0.55)));
    e.add(mesh(new THREE.ConeGeometry(0.024, 0.055, 4), innerMat, (m) => {
      m.scale.set(1, 1, 0.5);
      m.position.set(0, -0.008, 0.014);
    }));
    e.position.set(sgn * 0.066, 0.2, 0.0);
    e.rotation.z = -sgn * 0.38;
    e.rotation.y = Math.PI / 4;
    ears.add(e);
  }
  A.ears = {node: ears, bone: 'head'};

  // a tail that sways
  const tail = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.06, -0.11), new THREE.Vector3(0.01, -0.04, -0.23), new THREE.Vector3(0.03, 0.07, -0.3), new THREE.Vector3(0.05, 0.2, -0.3)]);
  tail.add(mesh(new THREE.TubeGeometry(curve, 28, 0.016, 10, false), furMat));
  tail.add(mesh(new THREE.SphereGeometry(0.019, 12, 10), furMat, (m) => m.position.copy(curve.getPoint(1))));
  tail.position.set(0, 0.0, -0.085);
  A.tail = {node: tail, bone: 'hips'};

  // a ring of light over the head
  const halo = new THREE.Group();
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.0065, 12, 56), glowMat));
  halo.add(new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.022, 12, 56), glowSoft));
  halo.rotation.x = Math.PI / 2 - 0.12;
  halo.position.set(0, 0.3, -0.01);
  A.halo = {node: halo, bone: 'head'};

  // two wings of overlapping feathers
  const wings = new THREE.Group();
  for (const sgn of [-1, 1]) {
    const w = new THREE.Group();
    const N = 9;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const len = 0.2 + 0.34 * Math.sin(u * Math.PI * 0.86 + 0.25);
      const ang = (-62 + 128 * u) * D2R; // from pointing down to pointing up and out
      w.add(mesh(new THREE.CircleGeometry(1, 18), whiteMat, (m) => {
        m.scale.set(len / 2, 0.052 + 0.012 * u, 1);
        m.position.set((Math.cos(ang) * len) / 2, (Math.sin(ang) * len) / 2, -0.004 * i);
        m.rotation.z = ang;
      }));
    }
    w.scale.x = sgn;
    w.position.set(sgn * 0.035, 0.03, -0.1);
    w.userData.sgn = sgn;
    wings.add(w);
  }
  A.wings = {node: wings, bone: 'upperChest', alt: 'chest'};
}
const outfit = createOutfit();
let topMats = [];
let shoeMats = [];
function applyOutfit() {
  outfit.apply(S);
  // the model's own top and shoes step aside for the built ones
  for (const m of topMats) m.visible = !S.hoodie || !outfit.parts.hoodie.length;
  for (const m of shoeMats) m.visible = !S.kicks || !outfit.parts.kicks.length;
}
function applyBody() {
  const H = vrm?.humanoid;
  if (!H) return;
  const t = S.thigh || 1;
  for (const side of ['left', 'right']) {
    H.getRawBoneNode(side + 'UpperLeg')?.scale.set(t, 1, t);
    H.getRawBoneNode(side + 'LowerLeg')?.scale.set(1 / t, 1, 1 / t);
  }
}
function applyAcc() {
  accMat.color.set(S.acc);
  for (const [k, a] of Object.entries(A)) a.node.visible = !!S[k];
}
function attachAcc() {
  const u = height / 1.55;
  for (const a of Object.values(A)) {
    const bone = vrm.humanoid?.getNormalizedBoneNode(a.bone) || (a.alt && vrm.humanoid?.getNormalizedBoneNode(a.alt));
    a.node.removeFromParent();
    if (!bone) continue;
    a.node.scale.setScalar(u);
    a.base ??= a.node.position.clone();
    a.node.position.copy(a.base).multiplyScalar(u);
    bone.add(a.node);
    a.place?.(u);
  }
}

// The centre of the drawn left iris, in the head bone's frame, in metres. The eye bone sits inside the skull at the
// pivot of the eyeball, so the iris itself is read from the mesh: every vertex painted with the iris material on the
// model's left side. Must run while the model is still in its rest pose.
let eyeSpot = null;
function findEye() {
  eyeSpot = null;
  const head = vrm.humanoid?.getNormalizedBoneNode('head');
  if (!head) return;
  const root = vrm.scene;
  const headAt = root.worldToLocal(head.getWorldPosition(new THREE.Vector3()));
  const sum = new THREE.Vector3();
  const v = new THREE.Vector3();
  let n = 0;
  let front = -Infinity;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.index) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const pos = o.geometry.attributes.position;
    const idx = o.geometry.index;
    const groups = o.geometry.groups.length ? o.geometry.groups : [{start: 0, count: idx.count, materialIndex: 0}];
    for (const g of groups) {
      if (!PART_RE.eye.test(mats[g.materialIndex]?.name || '')) continue;
      for (let i = g.start; i < g.start + g.count; i++) {
        root.worldToLocal(v.fromBufferAttribute(pos, idx.getX(i)).applyMatrix4(o.matrixWorld));
        if (v.x <= headAt.x) continue; // the model's left is +x
        sum.add(v);
        n++;
        if (v.z > front) front = v.z;
      }
    }
  });
  if (n) eyeSpot = sum.divideScalar(n).setZ(front).sub(headAt);
}

function mount(gltf, label) {
  const next = gltf.userData.vrm;
  if (!next) throw new Error('not a VRM file');
  for (const a of Object.values(A)) a.node.removeFromParent();
  outfit.clear();
  if (vrm) {
    turntable.remove(vrm.scene);
    VRMUtils.deepDispose(vrm.scene);
  }
  vrm = next;
  VRMUtils.rotateVRM0(vrm); // older files face the other way
  for (const k of Object.keys(PART_RE)) parts[k] = [];
  topMats = [];
  shoeMats = [];
  const seen = new Set();
  tris = 0;
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    o.frustumCulled = false;
    o.castShadow = true;
    const geo = o.geometry;
    tris += Math.round((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || seen.has(m)) continue;
      seen.add(m);
      if (PART_RE.top.test(m.name)) topMats.push(m);
      if (PART_RE.shoes.test(m.name)) shoeMats.push(m);
      if (/outline/i.test(m.name) || !m.map) continue;
      const part = Object.keys(PART_RE).find((k) => PART_RE[k].test(m.name));
      if (part) parts[part].push({mat: m, map: m.map, shade: m.shadeMultiplyTexture ?? null, col: m.color?.clone(), shadeCol: m.shadeColorFactor?.clone(), made: null});
    }
  });
  turntable.add(vrm.scene);
  vrm.scene.updateMatrixWorld(true);
  const head = vrm.humanoid?.getNormalizedBoneNode('head');
  height = head ? head.getWorldPosition(new THREE.Vector3()).y + 0.16 : 1.5;
  if (vrm.lookAt) vrm.lookAt.target = camera;
  const meta = vrm.meta || {};
  const who = (meta.authors || [meta.author]).filter(Boolean).join(', ');
  credit.textContent = `MODEL: ${meta.name || meta.title || label}${who ? ' · ' + who : ''}${meta.copyrightInformation ? ' · ' + meta.copyrightInformation : ''}`;
  findEye();
  outfit.build(vrm, height);
  attachAcc();
  applyColours();
  applyAcc();
  applyOutfit();
  applyBody();
  poseNow = null;
}
const parse = (buffer, label) => new Promise((res, rej) => loader.parse(buffer, '', (g) => res(mount(g, label)), rej));

// ------------------------------------------------------------ the panel
const tabsEl = bar.firstElementChild;
const pages = {};
const tabBtns = {};
const showTab = (id) => {
  for (const k of Object.keys(pages)) {
    pages[k].classList.toggle('on', k === id);
    tabBtns[k].classList.toggle('on', k === id);
  }
};
for (const [id, name] of [['look', '見る'], ['wear', '服'], ['colour', '色'], ['acc', '小物'], ['stage', '舞台']]) {
  tabBtns[id] = el(`<div class="sv-tab">${name}</div>`, tabsEl);
  tabBtns[id].addEventListener('click', () => showTab(id));
  pages[id] = el(`<div class="sv-page"></div>`, bar);
}
const syncers = [];
const sync = () => syncers.forEach((f) => f());
const group = (page, label, keyName, items, after) => {
  const g = el(`<div class="sv-grp"><em>${label}</em></div>`, pages[page]);
  for (const [v, text] of items) {
    const b = el(`<div class="sv-bt">${text}</div>`, g);
    b.addEventListener('click', () => {
      S[keyName] = v;
      if (keyName === 'cam') Object.assign(off, {az: 0, el: 0, k: 1});
      after?.();
      sync();
    });
    syncers.push(() => b.classList.toggle('on', S[keyName] === v));
  }
};
const toggles = (page, label, items, after) => {
  const g = el(`<div class="sv-grp"><em>${label}</em></div>`, pages[page]);
  for (const [k, text] of items) {
    const b = el(`<div class="sv-bt">${text}</div>`, g);
    b.addEventListener('click', () => {
      S[k] = !S[k];
      after?.();
      sync();
    });
    syncers.push(() => b.classList.toggle('on', !!S[k]));
  }
};
let pending = null;
const later = (f) => {
  // a colour picker fires many times a second; repaint a texture once per frame at most
  if (!pending) requestAnimationFrame(() => {
    const g = pending;
    pending = null;
    g?.();
  });
  pending = f;
};
const colours = (page, label, keyName, after, {none = true} = {}) => {
  const g = el(`<div class="sv-grp"><em>${label}</em></div>`, pages[page]);
  if (none) {
    const b = el(`<div class="sv-bt" style="padding:0 9px">元</div>`, g);
    b.addEventListener('click', () => {
      S[keyName] = null;
      after();
      sync();
    });
    syncers.push(() => b.classList.toggle('on', !S[keyName]));
  }
  for (const c of SWATCH) {
    const sw = el(`<div class="sv-sw" style="background:${c}"></div>`, g);
    sw.addEventListener('click', () => {
      S[keyName] = c;
      after();
      sync();
    });
    syncers.push(() => sw.classList.toggle('on', S[keyName] === c));
  }
  const pick = el(`<input class="sv-pick" type="color" value="${S[keyName] || '#ffffff'}">`, g);
  pick.addEventListener('input', () => {
    S[keyName] = pick.value;
    later(() => {
      after();
      sync();
    });
  });
  syncers.push(() => {
    if (S[keyName] && pick.value !== S[keyName]) pick.value = S[keyName];
  });
};
const applyAll = () => {
  applyColours();
  applyAcc();
  applyOutfit();
  applyBody();
  applyStage();
  sync();
};

{
  const g = el(`<div class="sv-grp"><em>テーマ（ひと押しで全部変わる）</em></div>`, pages.look);
  for (const t of Object.values(THEMES)) {
    const b = el(`<div class="sv-bt">${t.name}</div>`, g);
    b.addEventListener('click', () => {
      const {name, ...rest} = t;
      Object.assign(S, rest);
      applyAll();
    });
  }
}
group('look', '回転', 'spin', [[true, 'オン'], [false, 'オフ']]);
group('look', 'カメラ', 'cam', Object.entries(CAMS).map(([k, v]) => [k, v.name]));
group('look', 'ポーズ', 'pose', Object.entries(POSES));
group('look', '表情', 'face', Object.entries(FACES));
group('wear', '太もも', 'thigh', [[1, '元'], [1.12, '少し太め'], [1.22, '太め']], applyBody);
group('wear', 'トップス', 'hoodie', [[true, 'パーカー'], [false, 'Tシャツ']], applyOutfit);
colours('wear', 'パーカーの色', 'hoodieCol', applyOutfit, {none: false});
colours('wear', 'エンブレムの色', 'emblemCol', applyOutfit, {none: false});
group('wear', 'くつ', 'kicks', [[true, '厚底ハイカット'], [false, '元のくつ']], applyOutfit);
colours('wear', 'くつの色', 'kickCol', applyOutfit, {none: false});
el(`<div class="sv-note">パーカーとくつは、このページが図形から組み立てたものです。髪が服にめり込むことがあります。Tシャツと元のくつの色は「色」タブで変えられます。</div>`, pages.wear);
for (const part of Object.keys(PART_RE)) colours('colour', PART_NAME[part], part, () => applyPart(part));
group('colour', 'トップスの柄', 'pattern', Object.entries(PATTERNS), () => {
  if (!S.top) S.top = '#ffffff';
  applyPart('top');
});
colours('colour', '柄の色', 'color2', () => applyPart('top'), {none: false});
el(`<div class="sv-note">柄はトップスに色を付けると出ます。別のモデルでは、部位の名前が合わないと色が変わらないことがあります。</div>`, pages.colour);
toggles('acc', 'テック', [['headset', ACCS.headset], ['patch', ACCS.patch], ['visor', ACCS.visor], ['holo', ACCS.holo]], applyAcc);
toggles('acc', '頭', [['ribbon', ACCS.ribbon], ['flower', ACCS.flower], ['ears', ACCS.ears], ['halo', ACCS.halo]], applyAcc);
toggles('acc', 'からだ', [['wings', ACCS.wings], ['tail', ACCS.tail]], applyAcc);
colours('acc', '小物の色（ヘッドセット・リボン・花）', 'acc', applyAcc, {none: false});
el(`<div class="sv-note">光る部分は舞台のライトの色になります。ねこ耳としっぽは髪の色に合わせて変わります。</div>`, pages.acc);
group('stage', 'ライト', 'light', Object.entries(LIGHTS).map(([k, v]) => [k, v.name]), applyStage);
group('stage', '背景', 'bg', Object.entries(BGS).map(([k, v]) => [k, v.name]), applyStage);
group('stage', '空中', 'fx', Object.entries(FX), applyStage);
group('stage', '立つ場所', 'stand', [['beam', '鉄骨'], ['stage', 'ステージ台'], ['none', 'なし']], applyStage);
toggles('stage', '地面', [['floor', 'まわりの床']], applyStage);
group('stage', '床の模様', 'floorPat', [['hex', '六角'], ['sq', '四角']], applyStage);
toggles('stage', 'テック演出', [['grid', '床のグリッド'], ['rings', '床のリング'], ['hud', '計器表示'], ['beam', '光のビーム']], applyStage);
showTab('look');
sync();

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  drag = {x: e.clientX, y: e.clientY};
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('drag');
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  off.az -= (e.clientX - drag.x) * 0.4;
  off.el = clamp(off.el + (e.clientY - drag.y) * 0.25, -20, 70);
  drag = {x: e.clientX, y: e.clientY};
});
const endDrag = () => {
  drag = null;
  canvas.classList.remove('drag');
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  off.k = clamp(off.k * Math.exp(e.deltaY * 0.0012), 0.35, 2.2);
}, {passive: false});

// another avatar: drop a .vrm on the page
addEventListener('dragover', (e) => {
  e.preventDefault();
  drop.style.display = 'flex';
});
addEventListener('dragleave', () => (drop.style.display = 'none'));
addEventListener('drop', async (e) => {
  e.preventDefault();
  drop.style.display = 'none';
  const f = e.dataTransfer?.files?.[0];
  if (!f) return;
  try {
    await parse(await f.arrayBuffer(), f.name);
  } catch (err) {
    credit.textContent = `読み込めませんでした: ${f.name}`;
    console.warn(err);
  }
});

const fit = () => {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};
fit();
addEventListener('resize', fit);

// ------------------------------------------------------------ poses, as angles on the model's own skeleton
// The bones start in a T. Each entry is [x, y, z] applied as twist about the bone (x) first, then y, then z, so an
// upper arm can be turned about its own length before it is lowered and the elbow then folds the natural way.
// t is seconds.
const poseAt = (name, t) => {
  const b = Math.sin(t * 1.5) * 0.012; // breath
  const sway = Math.sin(t * 0.7) * 0.02;
  const P = {
    hips: [0, sway * 0.6, sway * 0.4],
    spine: [b, 0, -sway * 0.4],
    chest: [b * 1.5, 0, 0],
    neck: [0, 0, 0],
    head: [Math.sin(t * 0.5) * 0.03, Math.sin(t * 0.33) * 0.07, Math.sin(t * 0.41) * 0.02],
    leftUpperArm: [0, 0, -1.22 - b],
    rightUpperArm: [0, 0, 1.22 + b],
    leftLowerArm: [0, -0.18, 0],
    rightLowerArm: [0, 0.18, 0],
    leftHand: [0, 0, -0.08],
    rightHand: [0, 0, 0.08],
    leftUpperLeg: [0, 0, 0],
    rightUpperLeg: [0, 0, 0],
  };
  if (name === 'tpose') {
    for (const k of ['leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand']) P[k] = [0, 0, 0];
  } else if (name === 'wave') {
    const w = Math.sin(t * 7.5);
    P.rightUpperArm = [-1.5, 0, -0.32];
    P.rightLowerArm = [0, 1.25 + 0.36 * w, 0];
    P.rightHand = [0, 0.18 * w, 0];
    P.head = [0.02, 0.05, -0.08];
    P.spine = [b, 0, -0.04];
  } else if (name === 'model') {
    // weight on one leg, a hand on the hip, the other arm a little out
    P.hips = [0, 0.18, 0.05];
    P.spine = [b, -0.1, -0.05];
    P.chest = [b * 1.5, -0.06, 0];
    P.head = [0.04, 0.22 + Math.sin(t * 0.4) * 0.05, 0.06];
    P.leftUpperArm = [1.45, 0, -0.8];
    P.leftLowerArm = [0, -1.8, 0];
    P.leftHand = [0, -0.25, 0];
    P.rightUpperArm = [0, 0, 0.92];
    P.rightLowerArm = [0, 0.12, 0];
    P.rightUpperLeg = [0, -0.12, 0.07];
    P.leftUpperLeg = [0, 0.05, -0.03];
  }
  return P;
};

// ------------------------------------------------------------ the frame
let lastNow = performance.now();
let T = 0;
let beamA = 0;
let gridA = 0;
let ringA = 0;
let fps = 60;
let hudAt = 0;
const eu = new THREE.Euler();
const q = new THREE.Quaternion();
const m4 = new THREE.Matrix4();
const v3 = new THREE.Vector3();
const one = new THREE.Vector3(1, 1, 1);
const frame = () => {
  const now = performance.now();
  const raw = Math.max(0.0001, (now - lastNow) / 1000);
  const dt = Math.min(0.05, raw);
  lastNow = now;
  T += dt;
  fps += (1 / raw - fps) * 0.05;
  if (vrm) {
    if (S.spin && !drag) turn += dt * 0.42;
    turntable.rotation.y = turn;

    const target = poseAt(S.pose, T);
    const k = poseNow ? 1 - Math.exp(-dt / 0.16) : 1;
    poseNow ??= {};
    for (const [bone, r] of Object.entries(target)) {
      const cur = (poseNow[bone] ??= [...r]);
      for (let i = 0; i < 3; i++) cur[i] += (r[i] - cur[i]) * k;
      const n = vrm.humanoid?.getNormalizedBoneNode(bone);
      if (n) n.quaternion.copy(q.setFromEuler(eu.set(cur[0], cur[1], cur[2], 'ZYX')));
    }
    const ex = vrm.expressionManager;
    if (ex) {
      for (const name of Object.keys(FACES)) if (name !== 'neutral') ex.setValue(name, 0);
      if (S.face !== 'neutral') ex.setValue(S.face, 1);
      // a blink every few seconds, skipped while the face already closes the eyes
      const ph = (T % 4.2) / 0.16;
      ex.setValue('blink', S.face === 'happy' || S.face === 'relaxed' ? 0 : ph < 1 ? Math.sin(ph * Math.PI) : 0);
    }
    // accessories that move on their own
    const u = height / 1.55;
    A.tail.node.rotation.set(Math.sin(T * 0.9) * 0.08, Math.sin(T * 1.3) * 0.28, 0);
    A.halo.node.position.y = (A.halo.base?.y ?? 0.3) * u + Math.sin(T * 1.7) * 0.006;
    A.halo.node.rotation.z = T * 0.5;
    A.holo.node.userData.spin.rotation.z = T * 0.45;
    A.holo.node.userData.counter.rotation.z = -T * 0.8;
    for (const w of A.wings.node.children) w.rotation.y = w.userData.sgn * (0.55 + 0.14 * Math.sin(T * 1.6));
    vrm.update(dt);
  }

  const c = CAMS[S.cam];
  const level = S.stand === 'beam' ? 3 : BGS[S.bg].dome && (S.cam === 'full' || S.cam === 'back') ? -4 : 0;
  const tgt = {ty: c.ty * height, d: c.d * (height / 1.5) * off.k * Math.max(1, 1.25 / camera.aspect), az: c.az + off.az, el: clamp(c.el + level + off.el, -15, 75)};
  const kc = 1 - Math.exp(-dt / 0.3);
  for (const key2 of ['ty', 'd', 'az', 'el']) cam[key2] += (tgt[key2] - cam[key2]) * kc;
  const az = cam.az * D2R;
  const elv = cam.el * D2R;
  camera.position.set(cam.d * Math.cos(elv) * Math.sin(az), cam.ty + cam.d * Math.sin(elv), cam.d * Math.cos(elv) * Math.cos(az));
  camera.lookAt(0, cam.ty, 0);
  const wide = innerWidth > 760;
  camera.setViewOffset(innerWidth, innerHeight, wide ? -Math.min(150, innerWidth * 0.11) : 0, wide ? 0 : innerHeight * 0.2, innerWidth, innerHeight);
  sky.position.copy(camera.position);

  const ease = 1 - Math.exp(-dt / 0.4);
  beamA += ((S.beam ? 0.5 : 0) - beamA) * ease;
  beamMat.uniforms.uA.value = beamA * (0.9 + 0.1 * Math.sin(T * 0.8)) * clamp((cam.d - 1.0) / 0.9, 0, 1);
  beam.visible = beamA > 0.005;
  gridA += ((S.grid ? 1 : 0) - gridA) * ease;
  poolMat.uniforms.uGrid.value = gridA;
  poolMat.uniforms.uT.value = T;
  skyMat.uniforms.uT.value = T;
  if (ruins.group.visible) ruins.update(T, camera);
  if (near.group.visible) near.update(T);
  shaftMat.uniforms.uA.value = 0.17 + 0.03 * Math.sin(T * 0.5);
  ringA += ((S.rings ? 1 : 0) - ringA) * ease;
  floorRings.visible = ringA > 0.01 && S.stand !== 'beam';
  floorRings.scale.setScalar(0.6 + 0.4 * ringA);
  floorRings.userData.inner.rotation.y = T * 0.5;
  floorRings.userData.outer.rotation.y = -T * 0.22;

  // the air
  const f = FXP[S.fx];
  if (f) {
    const dp = ptsGeo.attributes.position.array;
    for (let i = 0; i < NP; i++) {
      const j = i * 5;
      if (i >= f.n) {
        dp[i * 3 + 1] = -5;
        continue;
      }
      const ph = pBase[j + 3];
      const sp = pBase[j + 4];
      const y = (((pBase[j + 1] - T * f.fall * sp) % 3.2) + 3.2) % 3.2;
      dp[i * 3] = pBase[j] + Math.sin(T * 0.21 * sp + ph) * f.drift;
      // a blinking mote drops out of sight for part of its cycle
      dp[i * 3 + 1] = f.blink && Math.sin(T * 2.2 * sp + ph * 3.0) < 0.2 ? -5 : y;
      dp[i * 3 + 2] = pBase[j + 2] + Math.cos(T * 0.17 + ph * 1.7) * f.drift;
    }
    ptsGeo.attributes.position.needsUpdate = true;
  }
  if (petals.visible) {
    for (let i = 0; i < NPET; i++) {
      const j = i * 5;
      const ph = pBase[j + 3];
      const sp = pBase[j + 4];
      v3.set(pBase[j] + Math.sin(T * 0.5 * sp + ph) * 0.35, (((pBase[j + 1] - T * 0.24 * sp) % 3.2) + 3.2) % 3.2, pBase[j + 2] + Math.cos(T * 0.4 + ph * 1.3) * 0.3);
      q.setFromEuler(eu.set(T * 1.1 * sp + ph, T * 0.7 + ph * 2.0, ph, 'XYZ'));
      petals.setMatrixAt(i, m4.compose(v3, q, one));
    }
    petals.instanceMatrix.needsUpdate = true;
  }

  // the readout: only numbers the page actually has
  if (S.hud && T - hudAt > 0.12) {
    hudAt = T;
    const deg = (((turn / D2R) % 360) + 360) % 360;
    hudText.textContent = `ROT ${deg.toFixed(1).padStart(5, '0')}°\nCAM ${cam.d.toFixed(2)} M\nHEIGHT ${height.toFixed(2)} M\nTRIS ${tris.toLocaleString('en-US')}\nBONES ${Object.keys(vrm?.humanoid?.humanBones || {}).length}\nFPS ${Math.round(fps)}`;
    hudLeft.textContent = `POSE ${S.pose.toUpperCase()} · FACE ${S.face.toUpperCase()}`;
    hudBar.style.width = `${(deg / 360) * 100}%`;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
};

applyStage();
fetch('data:application/octet-stream;base64,' + MODEL_B64)
  .then((r) => r.arrayBuffer())
  .then((buf) => parse(buf, 'bundled model'))
  .then(() => {
    Object.assign(cam, {ty: CAMS.full.ty * height, d: CAMS.full.d * (height / 1.5) * 1.5, az: -30, el: 10});
    loading.style.opacity = 0;
    setTimeout(() => loading.remove(), 900);
    requestAnimationFrame(frame);
  })
  .catch((err) => {
    loading.textContent = 'LOAD FAILED';
    console.error(err);
  });
window.STAGE = {S, THEMES, sync, showTab, apply: applyAll, get eyeSpot() {
  return eyeSpot;
}, front() {
  turn = 0;
}, get vrm() {
  return vrm;
}, get height() {
  return height;
}};
