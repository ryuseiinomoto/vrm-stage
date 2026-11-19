// The near part of a ruined city, built as dark silhouettes round the stage: a broken elevated road on tall piers,
// two pylons with sagging and snapped cables, a dead tower crane, a billboard reduced to its frame, a few gutted
// blocks with a handful of lit windows, fires and their smoke. Everything stands on ground far below the stage.
// The far skyline is painted by the sky shader in main.js; these pieces give it depth when the view is turned.
import * as THREE from 'three';

const V = THREE.Vector3;

export function createRuins() {
  const group = new THREE.Group();
  const lamp = new THREE.MeshBasicMaterial({color: '#ff8a1f'});
  const lampDim = new THREE.MeshBasicMaterial({color: '#ff8a1f', transparent: true, opacity: 0.28});
  const flicker = new THREE.MeshBasicMaterial({color: '#ff8a1f', transparent: true, opacity: 1});
  const fireMat = new THREE.MeshBasicMaterial({color: '#c9521a', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false});
  const solids = []; // silhouettes, each tinted by how far off it stands
  const lines = [];
  const solid = (dist) => {
    const m = new THREE.MeshBasicMaterial({color: '#000'});
    solids.push({m, dist});
    return m;
  };
  const box = (w, h, d, x, y, z, mat, f) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    f?.(m);
    group.add(m);
    return m;
  };
  const strokes = (pts, dist) => {
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({color: '#000'});
    lines.push({m, dist});
    const l = new THREE.LineSegments(g, m);
    group.add(l);
    return l;
  };
  const dist = (x, z) => Math.hypot(x, z);
  let road = null;
  const onRoad = []; // the fire that burns on the road deck, and its smoke
  // a hanging cable between two points, as line segments
  const cable = (a, b, sag, n = 22) => {
    const out = [];
    let prev = a.clone();
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const p = new V().lerpVectors(a, b, t);
      p.y -= sag * 4 * t * (1 - t);
      out.push(prev, p.clone());
      prev = p;
    }
    return out;
  };

  // ------------------------------------------------------------ the elevated road
  {
    const yaw = 0.16;
    road = new THREE.Group();
    road.rotation.y = yaw;
    road.position.set(0, -1.7, -7.6);
    group.add(road);
    const m = solid(8);
    const part = (w, h, d, x, y, z, mat = m, f) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      b.position.set(x, y, z);
      f?.(b);
      road.add(b);
      return b;
    };
    part(17, 0.42, 2.6, -4, 0, 0); // the standing span
    part(7.5, 0.42, 2.6, 8.3, -1.05, 0, m, (b) => (b.rotation.z = -0.3)); // the span that has dropped at one end
    part(3.2, 0.42, 2.6, 16.5, -0.2, 0); // a stub left on the far pier
    for (const x of [-11.5, -5.5, 0.5, 4.4, 16.5]) part(0.8, 34, 0.9, x, -17.2, 0);
    for (const z of [-1.25, 1.25]) {
      part(17, 0.3, 0.09, -4, 0.36, z);
      part(3.2, 0.3, 0.09, 16.5, 0.16, z);
    }
    // street lamps: two alight, one failing, the rest dead; some knocked askew
    [[-11, 0, lamp], [-7.2, 0.22, null], [-3.4, 0, flicker], [0.4, -0.35, null], [3.6, 0, lampDim]].forEach(([x, lean, mat]) => {
      const post = new THREE.Group();
      post.position.set(x, 0.2, -1.1);
      post.rotation.z = lean;
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.2, 0.07), m);
      pole.position.y = 1.1;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.7), m);
      arm.position.set(0, 2.2, 0.32);
      post.add(pole, arm);
      if (mat) {
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.34), mat);
        head.position.set(0, 2.15, 0.52);
        post.add(head);
      }
      road.add(post);
    });
    // wrecks left on the deck
    part(1.7, 0.55, 0.8, -8.5, 0.5, 0.4, m, (b) => (b.rotation.y = 0.3));
    part(1.5, 0.5, 0.75, -1.8, 0.47, -0.3, m, (b) => (b.rotation.y = -0.5));
    part(1.9, 0.6, 0.85, 6.4, -0.2, 0.2, m, (b) => b.rotation.set(0.5, 0.2, -0.3));
  }

  // ------------------------------------------------------------ pylons and their cables
  const pylon = (x, z, base, top, lean = 0) => {
    const pts = [];
    const d = dist(x, z);
    const P = (px, py, pz) => new V(x + px + lean * (py - base) * 0.04, py, z + pz);
    const H = top - base;
    const wAt = (t) => 1.5 * (1 - t) + 0.22 * t;
    const levels = 9;
    for (let i = 0; i < levels; i++) {
      const t0 = i / levels;
      const t1 = (i + 1) / levels;
      const w0 = wAt(t0);
      const w1 = wAt(t1);
      const y0 = base + H * t0;
      const y1 = base + H * t1;
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) pts.push(P(sx * w0, y0, sz * w0), P(sx * w1, y1, sz * w1));
      // bracing on the two faces that show
      pts.push(P(-w0, y0, w0), P(w1, y1, w1), P(w0, y0, w0), P(-w1, y1, w1), P(w0, y0, -w0), P(w1, y1, w1));
      pts.push(P(-w1, y1, w1), P(w1, y1, w1), P(w1, y1, -w1), P(w1, y1, w1));
    }
    const tips = [];
    for (const [t, span] of [[0.72, 3.2], [0.86, 2.5], [0.97, 1.6]]) {
      const y = base + H * t;
      const a = P(-span, y, 0);
      const b = P(span, y, 0);
      pts.push(a, b, a, P(0, y + 0.6, 0), b, P(0, y + 0.6, 0));
      tips.push(a, b);
    }
    strokes(pts, d);
    return tips;
  };
  {
    const A = pylon(-11, -11, -30, 7.5);
    const B = pylon(12.5, -13, -30, 6.2, 1.6);
    const pts = [];
    for (const i of [0, 1, 2, 5]) pts.push(...cable(A[i], B[i], 1.8 + (i % 3) * 0.5));
    // snapped: these hang straight down from one side only
    pts.push(...cable(A[3], A[3].clone().add(new V(2.2, -6.5, 0.4)), -0.6, 10));
    pts.push(...cable(B[4], B[4].clone().add(new V(-1.2, -5, 0.2)), -0.4, 8));
    // a line run on out of sight to the left
    pts.push(...cable(A[0], new V(-30, 3, -4), 2.5));
    strokes(pts, 12);
  }

  // ------------------------------------------------------------ a dead tower crane
  {
    const x = 14.5;
    const z = 3.5;
    const pts = [];
    const top = 11;
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) pts.push(new V(x + sx * 0.45, -30, z + sz * 0.45), new V(x + sx * 0.45, top, z + sz * 0.45));
    for (let y = -30; y < top; y += 1.4) pts.push(new V(x - 0.45, y, z + 0.45), new V(x + 0.45, y + 1.4, z + 0.45), new V(x + 0.45, y, z - 0.45), new V(x + 0.45, y + 1.4, z + 0.45));
    // the jib, swung in over the city and drooping, with its counter-arm
    const tip = new V(x - 11, top - 1.6, z - 5.5);
    const tail = new V(x + 3.6, top + 0.2, z + 1.8);
    const head = new V(x, top + 2.2, z);
    const root = new V(x, top, z);
    pts.push(root, tip, head, tip, root, tail, head, tail, root, head);
    for (let i = 1; i < 8; i++) {
      const a = new V().lerpVectors(root, tip, i / 8);
      const b = new V().lerpVectors(head, tip, (i - 0.5) / 8);
      pts.push(a, b, b, new V().lerpVectors(root, tip, (i - 1) / 8));
    }
    const hookAt = new V().lerpVectors(root, tip, 0.7);
    pts.push(hookAt, hookAt.clone().add(new V(0.15, -7, 0)));
    strokes(pts, dist(x, z));
    box(1.4, 1.1, 1.0, tail.x, tail.y - 0.5, tail.z, solid(dist(x, z)));
    box(0.5, 0.7, 0.5, hookAt.x + 0.15, hookAt.y - 7.3, hookAt.z, solid(dist(x, z)));
  }

  // ------------------------------------------------------------ a billboard, mostly frame
  {
    const b = new THREE.Group();
    b.position.set(-8.2, 0.2, -4.2);
    b.rotation.y = 0.75;
    group.add(b);
    const m = solid(9);
    const add = (w, h, d, x, y, z, mat = m, f) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      o.position.set(x, y, z);
      f?.(o);
      b.add(o);
    };
    for (const x of [-1.9, 1.9]) add(0.18, 34, 0.18, x, -15, 0);
    add(5.2, 0.12, 0.12, 0, 4.1, 0);
    add(5.2, 0.12, 0.12, 0, 1.5, 0);
    for (const x of [-2.6, -0.87, 0.87, 2.6]) add(0.1, 2.7, 0.1, x, 2.8, 0);
    // the panels that are still up, one hanging by a corner
    add(1.65, 2.5, 0.05, -1.73, 2.8, 0);
    add(1.65, 2.5, 0.05, 1.73, 2.3, 0.05, m, (o) => (o.rotation.z = -0.5));
    // what is left of the lettering
    add(0.9, 0.22, 0.06, -1.75, 3.3, 0.06, flicker);
    add(0.5, 0.22, 0.06, -1.95, 2.8, 0.06, lampDim);
    add(1.1, 0.22, 0.06, -1.65, 2.3, 0.06, lampDim);
  }

  // ------------------------------------------------------------ gutted blocks close by
  {
    let s = 7001;
    const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    const spots = [[-18, -15, 4.2, 8.5], [-7, -22, 4.6, 5], [6.5, -21, 3.8, 9.5], [20, -10, 4.4, 4], [-21, -1, 4, 3], [22, 9, 4.4, 6.5], [-17, 13, 3.8, 2]];
    for (const [x, z, w, top] of spots) {
      const d = dist(x, z);
      const m = solid(d);
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.lookAt(0, 0, 0); // its front face looks at the stage
      g.rotation.z = (r() - 0.5) * 0.12; // a little off true
      group.add(g);
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, 40, w * 0.8), m);
      body.position.y = top - 20;
      g.add(body);
      // the crown, knocked down in steps, with bars standing out of it
      for (let i = 0; i < 3; i++) {
        const cw = w * (0.25 + r() * 0.3);
        const ch = 0.6 + r() * 2.2;
        const c = new THREE.Mesh(new THREE.BoxGeometry(cw, ch, w * 0.8 * (0.5 + r() * 0.5)), m);
        c.position.set((r() - 0.5) * (w - cw), top + ch / 2, 0);
        g.add(c);
      }
      for (let i = 0; i < 6; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8 + r() * 1.6, 0.05), m);
        bar.position.set((r() - 0.5) * w * 0.9, top + 0.8 + r(), (r() - 0.5) * w * 0.5);
        bar.rotation.z = (r() - 0.5) * 0.5;
        g.add(bar);
      }
      // windows: nearly all dark
      const cols = Math.round(w / 1.05);
      for (let row = 0; row < 16; row++)
        for (let c = 0; c < cols; c++) {
          const k = r();
          if (k > 0.04) continue;
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), k < 0.006 ? flicker : k < 0.014 ? lamp : lampDim);
          win.position.set((c - (cols - 1) / 2) * 1.05, top - 0.9 - row * 1.25, w * 0.4 + 0.03);
          g.add(win);
        }
    }
  }

  // ------------------------------------------------------------ fires and smoke
  const smokeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {uT: {value: 0}, uCol: {value: new THREE.Color('#0d0c0d')}},
    vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uT; uniform vec3 uCol; varying vec2 vU;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
      void main(){
        // a column that widens and leans as it climbs, thinning out at the top
        float x = (vU.x - 0.5 - 0.18 * vU.y * vU.y) / (0.1 + 0.34 * vU.y);
        float body = 1.0 - smoothstep(0.35, 1.0, abs(x));
        float d = fbm(vec2(x * 1.6, vU.y * 5.0 - uT * 0.22)) * 1.5 - 0.25;
        float a = body * clamp(d, 0.0, 1.0) * smoothstep(0.0, 0.06, vU.y) * (1.0 - smoothstep(0.55, 1.0, vU.y));
        gl_FragColor = vec4(uCol, a * 0.8); }`,
  });
  const smokes = [];
  for (const [x, y, z, h] of [[-8.6, -1.25, -6.3, 11], [18.5, 4, -9.5, 15], [-19.5, 3, -1.5, 12]]) {
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), fireMat);
    fire.scale.set(1.2, 0.8, 1.0);
    fire.position.set(x, y + 0.2, z);
    group.add(fire);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), flicker);
    core.position.set(x, y + 0.15, z);
    group.add(core);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(h * 0.55, h), smokeMat);
    sm.position.set(x, y + h / 2, z);
    sm.renderOrder = 6;
    group.add(sm);
    smokes.push(sm);
    if (!onRoad.length) onRoad.push([fire, fire.position.y], [core, core.position.y], [sm, sm.position.y]);
  }

  const c0 = new THREE.Color();
  const haze = new THREE.Color();
  function setColour(rim) {
    lamp.color.set(rim);
    lampDim.color.set(rim);
    flicker.color.set(rim);
    haze.set(rim).multiplyScalar(0.007).add(c0.set('#080707'));
    // far things take on the colour of the dust between them and the eye
    for (const {m, dist: d} of [...solids, ...lines]) m.color.set('#040405').lerp(haze, THREE.MathUtils.clamp((d - 5) / 18, 0, 1));
    smokeMat.uniforms.uCol.value.set('#070607').lerp(haze, 0.5);
  }
  function update(T, camera) {
    // failing lights: mostly on, dropping out in short bursts
    const k = Math.sin(T * 13.0) * Math.sin(T * 7.3 + 1.0) * Math.sin(T * 2.1);
    flicker.opacity = k > 0.25 ? 0.15 : 0.85 + 0.15 * Math.sin(T * 31.0);
    fireMat.opacity = 0.7 + 0.2 * Math.sin(T * 9.0) * Math.sin(T * 5.3);
    smokeMat.uniforms.uT.value = T;
    for (const sm of smokes) sm.rotation.y = Math.atan2(camera.position.x - sm.position.x, camera.position.z - sm.position.z);
  }
  // The road normally passes just behind the stage. With buildings standing close it has to run lower, below them.
  function setRoadDrop(drop) {
    road.position.y = -1.7 - drop;
    for (const [o, y] of onRoad) o.position.y = y - drop;
  }
  setColour('#ff8a1f');
  return {group, setColour, update, setRoadDrop};
}
