// The place she stands in the ruined city: a rusted steel girder spanning the gap between two abandoned buildings,
// and those two buildings worked up in detail because they are close. Each has a concrete front with drawn windows
// (smashed, boarded, dirty), floor ledges, piers, sills, air-conditioning boxes, shutters, a drain pipe, a blade sign
// with most of its panels dead, a fire escape with one landing torn loose, and a roof with a water tank, plant,
// an aerial and an upper frame that never got its walls or lost them.
// The girder runs along z through the origin; its top is y = 0. One building faces her back, the other her front.
import * as THREE from 'three';

const V = THREE.Vector3;
const rng = (seed) => {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};

const FLOOR = 3.0; // metres from one floor to the next
const BAYS = 4;

// One tile of a building front: four bays wide, two floors high.
function facadeTexture(seed, tileW) {
  const r = rng(seed);
  const W = 1024;
  const Hh = Math.round((W * FLOOR * 2) / tileW);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = Hh;
  const g = cv.getContext('2d');
  const m = W / tileW; // pixels per metre
  g.fillStyle = '#2f2b27';
  g.fillRect(0, 0, W, Hh);
  // the grain of the concrete and the lines the formwork left
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.07)';
    g.fillRect(r() * W, r() * Hh, 1 + r() * 2, 1 + r() * 2);
  }
  g.strokeStyle = 'rgba(0,0,0,.16)';
  g.lineWidth = 1;
  for (let y = 0; y < Hh; y += 0.6 * m) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  const bay = W / BAYS;
  for (let f = 0; f < 2; f++) {
    const top = f * FLOOR * m;
    // the band at each floor line
    g.fillStyle = 'rgba(255,255,255,.05)';
    g.fillRect(0, top, W, 0.3 * m);
    for (let b = 0; b < BAYS; b++) {
      const cx = (b + 0.5) * bay;
      const cy = top + 1.5 * m;
      const ww = 1.45 * m;
      const wh = 1.7 * m;
      const x0 = cx - ww / 2;
      const y0 = cy - wh / 2;
      // the reveal, then what is in the opening
      g.fillStyle = '#191715';
      g.fillRect(x0 - 5, y0 - 5, ww + 10, wh + 10);
      const k = r();
      g.fillStyle = k < 0.55 ? '#060607' : '#11161a';
      g.fillRect(x0, y0, ww, wh);
      if (k < 0.3) {
        // smashed: shards left round the frame
        g.fillStyle = '#1a2228';
        for (let i = 0; i < 7; i++) {
          const px = x0 + r() * ww;
          const fromTop = r() < 0.5;
          g.beginPath();
          g.moveTo(px - 10 - r() * 24, fromTop ? y0 : y0 + wh);
          g.lineTo(px + 10 + r() * 24, fromTop ? y0 : y0 + wh);
          g.lineTo(px + (r() - 0.5) * 20, (fromTop ? y0 : y0 + wh) + (fromTop ? 1 : -1) * (18 + r() * wh * 0.35));
          g.closePath();
          g.fill();
        }
      } else if (k < 0.55) {
        // empty: a blind hanging off one end
        g.strokeStyle = 'rgba(120,120,115,.28)';
        g.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          g.beginPath();
          g.moveTo(x0 + 6, y0 + 8 + i * 9);
          g.lineTo(x0 + ww - 6, y0 + 8 + i * 9 + i * 5);
          g.stroke();
        }
      } else {
        // glass still in: grime and one streak of sky
        g.fillStyle = 'rgba(70,60,45,.25)';
        g.fillRect(x0, y0 + wh * 0.55, ww, wh * 0.45);
        g.strokeStyle = 'rgba(150,165,175,.16)';
        g.lineWidth = 9;
        g.beginPath();
        g.moveTo(x0 + ww * 0.15, y0 + wh);
        g.lineTo(x0 + ww * 0.55, y0);
        g.stroke();
        if (r() < 0.4) {
          g.strokeStyle = 'rgba(200,210,215,.3)';
          g.lineWidth = 1.2;
          const sx = x0 + ww * (0.3 + r() * 0.4);
          const sy = y0 + wh * (0.3 + r() * 0.4);
          for (let i = 0; i < 6; i++) {
            g.beginPath();
            g.moveTo(sx, sy);
            g.lineTo(sx + (r() - 0.5) * ww * 0.9, sy + (r() - 0.5) * wh * 0.9);
            g.stroke();
          }
        }
      }
      // frame and the bars across it
      g.strokeStyle = '#3d3934';
      g.lineWidth = 5;
      g.strokeRect(x0, y0, ww, wh);
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, y0);
      g.lineTo(cx, y0 + wh);
      g.moveTo(x0, y0 + wh * 0.38);
      g.lineTo(x0 + ww, y0 + wh * 0.38);
      g.stroke();
      // what has run down the wall from the sill
      for (let i = 0; i < 4; i++) {
        const sx = x0 + r() * ww;
        const len = (0.4 + r() * 1.1) * m;
        const grad = g.createLinearGradient(0, y0 + wh, 0, y0 + wh + len);
        grad.addColorStop(0, r() < 0.3 ? 'rgba(110,55,20,.42)' : 'rgba(0,0,0,.42)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(sx, y0 + wh, 6 + r() * 16, len);
      }
    }
  }
  // cracks
  g.strokeStyle = 'rgba(0,0,0,.55)';
  g.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) {
    let x = r() * W;
    let y = r() * Hh;
    g.beginPath();
    g.moveTo(x, y);
    for (let j = 0; j < 9; j++) {
      x += (r() - 0.5) * 46;
      y += 12 + r() * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // a patch where the render has come away to the brick
  for (let i = 0; i < 2; i++) {
    const x = r() * W * 0.8;
    const y = r() * Hh * 0.8;
    g.fillStyle = 'rgba(90,48,30,.5)';
    g.beginPath();
    g.ellipse(x, y, 40 + r() * 50, 24 + r() * 36, r(), 0, 6.3);
    g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function steelTexture() {
  const r = rng(4242);
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 1024;
  const g = cv.getContext('2d');
  g.fillStyle = '#371c13';
  g.fillRect(0, 0, 256, 1024);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = ['rgba(20,8,4,.3)', 'rgba(120,62,30,.16)', 'rgba(0,0,0,.25)', 'rgba(150,90,45,.07)'][Math.floor(r() * 4)];
    g.fillRect(r() * 256, r() * 1024, 2 + r() * 26, 2 + r() * 60);
  }
  // scuffs where people have walked it
  g.strokeStyle = 'rgba(190,170,150,.14)';
  for (let i = 0; i < 60; i++) {
    g.lineWidth = 1 + r() * 2;
    const x = 60 + r() * 136;
    const y = r() * 1024;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 30, y + 20 + r() * 60);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function createNearCity() {
  const group = new THREE.Group();
  const M = {
    concrete: new THREE.MeshLambertMaterial({color: '#37322e'}),
    dark: new THREE.MeshLambertMaterial({color: '#1c1a19'}),
    metal: new THREE.MeshLambertMaterial({color: '#24272a'}),
    rust: new THREE.MeshLambertMaterial({color: '#5a2e1b'}),
    wood: new THREE.MeshLambertMaterial({color: '#4a3320'}),
    tank: new THREE.MeshLambertMaterial({color: '#3c4146'}),
    lamp: new THREE.MeshBasicMaterial({color: '#ff8a1f'}),
    lampDim: new THREE.MeshBasicMaterial({color: '#ff8a1f', transparent: true, opacity: 0.32}),
    room: new THREE.MeshBasicMaterial({color: '#ff8a1f', transparent: true, opacity: 0.2}), // a lit room seen through dirty glass
    flicker: new THREE.MeshBasicMaterial({color: '#ff8a1f', transparent: true}),
    warn: new THREE.MeshBasicMaterial({color: '#ff2a1a', transparent: true}),
    line: new THREE.LineBasicMaterial({color: '#0c0c0d'}),
  };

  function building({zf, face, w, d, roofY, seed, sign}) {
    const r = rng(seed);
    const g = new THREE.Group();
    g.position.z = zf;
    g.rotation.y = face > 0 ? 0 : Math.PI; // the front is local +z
    group.add(g);
    const add = (geo, mat, x, y, z, f) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      f?.(m);
      g.add(m);
      return m;
    };
    const box = (bw, bh, bd, x, y, z, mat = M.concrete, f) => add(new THREE.BoxGeometry(bw, bh, bd), mat, x, y, z, f);
    const BOT = -44;
    const H = roofY - BOT;
    const bayW = w / BAYS;
    const tex = facadeTexture(seed, w);
    const face2 = (rx) => {
      const t = tex.clone();
      t.needsUpdate = true;
      const ry = H / (FLOOR * 2);
      t.repeat.set(rx, ry);
      t.offset.y = 1 - (ry % 1); // a floor line falls exactly on the roof line
      return new THREE.MeshLambertMaterial({map: t});
    };
    const front = face2(1);
    const side = face2(d / w);
    box(w, H, d, 0, roofY - H / 2, -d / 2, [side, side, M.dark, M.dark, front, front]);

    // ledges at the floor lines, and the piers between the bays
    const LOW = -13;
    for (let y = roofY; y > LOW; y -= FLOOR) box(w + 0.36, 0.2, 0.42, 0, y, 0.16);
    for (let i = 0; i <= BAYS; i++) box(0.46, roofY - LOW, 0.26, -w / 2 + bayW * i, (roofY + LOW) / 2, 0.11);

    // the windows near enough to see into
    for (let j = 0; j < 7; j++) {
      const yc = roofY - FLOOR * j - 1.5;
      if (yc < LOW) break;
      for (let i = 0; i < BAYS; i++) {
        const xc = -w / 2 + bayW * (i + 0.5);
        box(1.78, 0.09, 0.3, xc, yc - 0.9, 0.16);
        const k = r();
        if (k < 0.24) {
          // an air-conditioning box under the sill, with its grille and a bracket
          const ax = xc + (r() - 0.5) * 0.6;
          box(0.92, 0.56, 0.5, ax, yc - 1.32, 0.3, M.metal);
          add(new THREE.CircleGeometry(0.2, 14), M.dark, ax - 0.15, yc - 1.32, 0.556);
          box(0.05, 0.05, 0.5, ax - 0.4, yc - 1.62, 0.3, M.rust);
          box(0.05, 0.05, 0.5, ax + 0.4, yc - 1.62, 0.3, M.rust);
        } else if (k < 0.42) {
          // boarded up
          for (let b = 0; b < 3; b++) box(1.75, 0.17, 0.04, xc, yc - 0.5 + b * 0.5, 0.06, M.wood, (m) => (m.rotation.z = (r() - 0.5) * 0.3));
        } else if (k < 0.54) {
          // a roller shutter stuck part way, slats and all
          const drop = 0.6 + r() * 0.8;
          box(1.5, drop, 0.05, xc, yc + 0.85 - drop / 2, 0.05, M.metal);
          for (let s = 0; s < drop / 0.14; s++) box(1.52, 0.02, 0.07, xc, yc + 0.85 - s * 0.14, 0.05, M.dark);
          box(1.62, 0.16, 0.14, xc, yc + 0.93, 0.08, M.metal);
        } else if (k < 0.6) {
          // someone is still here
          add(new THREE.PlaneGeometry(1.4, 1.64), M.room, xc, yc, 0.012);
          box(0.42, 1.64, 0.02, xc - 0.5, yc, 0.02, M.dark);
        } else if (k < 0.72) {
          // the frame of an awning, the cloth long gone
          for (const sx of [-0.75, 0.75]) box(0.04, 0.04, 0.9, xc + sx, yc + 0.7, 0.45, M.rust, (m) => (m.rotation.x = 0.35));
          box(1.54, 0.04, 0.04, xc, yc + 0.55, 0.87, M.rust);
        }
      }
    }

    // the drain pipe and its brackets
    add(new THREE.CylinderGeometry(0.07, 0.07, roofY - LOW, 8), M.metal, -w / 2 + 0.72, (roofY + LOW) / 2, 0.2);
    for (let y = roofY - 1; y > LOW; y -= FLOOR) box(0.26, 0.05, 0.12, -w / 2 + 0.72, y, 0.2, M.rust);

    // a blade sign, most of its panels dead or gone
    if (sign) {
      const sx = -w / 2 + bayW;
      const sy = roofY - FLOOR * 2.5;
      box(0.2, 4.6, 1.05, sx, sy, 0.86, M.metal);
      for (const y of [1.9, -1.9]) box(0.08, 0.08, 0.5, sx, sy + y, 0.25, M.rust);
      for (let p = 0; p < 4; p++) {
        const k = r();
        if (k < 0.3) continue;
        const mat = k < 0.5 ? M.flicker : k < 0.72 ? M.lampDim : M.dark;
        for (const s of [-1, 1]) add(new THREE.PlaneGeometry(0.82, 0.86), mat, sx + s * 0.104, sy + 1.62 - p * 1.08, 0.86, (m) => (m.rotation.y = (s * Math.PI) / 2));
      }
    }

    // the fire escape on the last bay: landings, rails, flights, and one landing hanging by its inner edge
    {
      const xc = w / 2 - bayW / 2;
      const pw = bayW * 0.86;
      for (let j = 0; j < 5; j++) {
        const y = roofY - FLOOR * (j + 1) + 0.12;
        if (y < LOW) break;
        const torn = j === 2;
        const land = new THREE.Group();
        land.position.set(xc, y, 0.42);
        if (torn) land.rotation.x = 0.95;
        g.add(land);
        const part = (bw, bh, bd, x, yy, z, mat = M.metal) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
          m.position.set(x, yy, z);
          land.add(m);
        };
        part(pw, 0.06, 1.05, 0, 0, 0.52);
        for (let s = 0; s < 9; s++) part(0.03, 0.065, 1.05, -pw / 2 + (s + 0.5) * (pw / 9), 0.003, 0.52, M.dark);
        for (const px of [-pw / 2, 0, pw / 2]) part(0.045, 1.0, 0.045, px, 0.5, 1.03, M.rust);
        part(pw, 0.045, 0.045, 0, 1.0, 1.03, M.rust);
        part(pw, 0.03, 0.03, 0, 0.52, 1.03, M.rust);
        for (const px of [-pw / 2, pw / 2]) {
          part(0.045, 0.045, 1.05, px, 1.0, 0.52, M.rust);
        }
        if (!torn && j !== 1 && y - FLOOR > LOW) {
          // the flight down to the next landing, with a few treads showing
          const dir = j % 2 ? 1 : -1;
          const run = pw * 0.8;
          const len = Math.hypot(run, FLOOR);
          const flight = new THREE.Group();
          flight.position.set(xc, y - FLOOR / 2, 1.2);
          flight.rotation.z = dir * Math.atan2(FLOOR, run);
          g.add(flight);
          for (const z of [-0.3, 0.3]) {
            const str = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.04), M.rust);
            str.position.z = z;
            flight.add(str);
          }
          for (let s = 0; s < 10; s++) {
            const tr = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.6), M.metal);
            tr.position.x = -len / 2 + (s + 0.5) * (len / 10);
            tr.rotation.z = -dir * Math.atan2(FLOOR, run);
            flight.add(tr);
          }
        }
      }
    }

    // the roof: parapet, tank on its stand, plant, an aerial
    for (const [bw, bd, x, z] of [[w, 0.22, 0, -0.11], [w, 0.22, 0, -d + 0.11], [0.22, d, -w / 2 + 0.11, -d / 2], [0.22, d, w / 2 - 0.11, -d / 2]]) box(bw, 0.7, bd, x, roofY + 0.35, z);
    {
      const tx = -w / 4;
      const tz = -d * 0.45;
      add(new THREE.CylinderGeometry(1.0, 1.0, 1.7, 18), M.tank, tx, roofY + 2.25, tz);
      add(new THREE.ConeGeometry(1.06, 0.4, 18), M.tank, tx, roofY + 3.3, tz);
      for (const y of [1.75, 2.75]) add(new THREE.TorusGeometry(1.01, 0.03, 6, 24), M.rust, tx, roofY + y, tz, (m) => (m.rotation.x = Math.PI / 2));
      for (const [lx, lz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) box(0.09, 1.4, 0.09, tx + lx, roofY + 0.7, tz + lz, M.rust);
      box(1.6, 0.06, 0.06, tx, roofY + 0.75, tz - 0.7, M.rust);
      box(1.6, 0.06, 0.06, tx, roofY + 0.75, tz + 0.7, M.rust);
    }
    box(1.3, 0.8, 0.9, w * 0.08, roofY + 0.4, -d * 0.7, M.metal);
    box(0.9, 0.6, 0.7, w * 0.22, roofY + 0.3, -d * 0.72, M.metal);
    {
      const ax = -w * 0.42;
      const az = -d * 0.2;
      const pts = [];
      const P = (x, y, z) => new V(ax + x, roofY + y, az + z);
      pts.push(P(0, 0, 0), P(0, 6.5, 0));
      for (const y of [4.2, 5.0, 5.8]) pts.push(P(-0.7, y, 0), P(0.7, y, 0), P(0, y, -0.5), P(0, y, 0.5));
      for (const [gx, gz] of [[-2.2, 0], [1.4, 1.6], [1.2, -1.8]]) pts.push(P(0, 5.2, 0), P(gx, 0, gz));
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), M.line));
    }
    // the upper frame on the far half of the roof: columns and slabs with no walls, one slab dropped at one end
    {
      const x0 = w * 0.06;
      const x1 = w / 2 - 0.3;
      const zs = [-0.5, -d * 0.5, -d + 0.5];
      const xs = [x0, (x0 + x1) / 2, x1];
      for (const x of xs) for (const z of zs) box(0.34, x === x1 && z === zs[0] ? 3.0 : 6.0, 0.34, x, roofY + (x === x1 && z === zs[0] ? 1.5 : 3.0), z);
      box(x1 - x0 + 0.5, 0.22, d - 0.6, (x0 + x1) / 2, roofY + 3.0, -d / 2);
      box((x1 - x0) * 0.55, 0.22, d * 0.5, x0 + (x1 - x0) * 0.3, roofY + 6.0, -d * 0.7);
      box((x1 - x0) * 0.5, 0.2, d * 0.42, x1 - (x1 - x0) * 0.28, roofY + 5.2, -d * 0.28, M.concrete, (m) => (m.rotation.z = -0.42));
      for (let i = 0; i < 14; i++) box(0.04, 0.7 + r() * 1.3, 0.04, x0 + r() * (x1 - x0), roofY + 6.3 + r() * 0.6, -r() * d, M.rust, (m) => m.rotation.set((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7));
      // rubble along the edge
      for (let i = 0; i < 10; i++) box(0.3 + r() * 0.6, 0.2 + r() * 0.3, 0.3 + r() * 0.5, x0 + r() * (x1 - x0), roofY + 3.25, -0.4 - r() * 1.6, M.concrete, (m) => m.rotation.set(r(), r(), r()));
    }
    return g;
  }

  const Z_BACK = -10;
  const Z_FRONT = 13;
  building({zf: Z_BACK, face: 1, w: 11, d: 9, roofY: 8.5, seed: 1109, sign: true});
  building({zf: Z_FRONT, face: -1, w: 9.6, d: 8, roofY: 5.5, seed: 2207, sign: false});

  // ------------------------------------------------------------ the girder
  {
    const L = Z_FRONT - Z_BACK + 0.6;
    const zc = (Z_FRONT + Z_BACK) / 2;
    const tex = steelTexture();
    tex.repeat.set(1, L / 3);
    const steel = new THREE.MeshLambertMaterial({map: tex});
    const steelPlain = new THREE.MeshLambertMaterial({color: '#3a1d13'});
    const add = (geo, mat, x, y, z, f) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      f?.(m);
      group.add(m);
      return m;
    };
    const FW = 0.7; // flange width
    const DEPTH = 0.6;
    // box faces: +x, -x, +y, -y, +z, -z; the walked-on top takes the scuffed texture
    add(new THREE.BoxGeometry(FW, 0.05, L), [steelPlain, steelPlain, steel, steelPlain, steelPlain, steelPlain], 0, -0.025, zc);
    add(new THREE.BoxGeometry(0.036, DEPTH - 0.1, L), steelPlain, 0, -DEPTH / 2, zc);
    add(new THREE.BoxGeometry(FW, 0.05, L), steelPlain, 0, -DEPTH + 0.025, zc);
    // stiffeners between the flanges
    for (let z = Z_BACK + 0.9; z < Z_FRONT; z += 1.5) for (const s of [-1, 1]) add(new THREE.BoxGeometry(FW / 2 - 0.03, DEPTH - 0.1, 0.022), steelPlain, (s * FW) / 4, -DEPTH / 2, z);
    // splice plates and bolt heads
    const bolts = [];
    for (const z of [-4.4, 6.2]) {
      add(new THREE.BoxGeometry(FW + 0.02, 0.022, 1.3), steelPlain, 0, 0.011, z);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.022, DEPTH - 0.2, 1.1), steelPlain, s * 0.03, -DEPTH / 2, z);
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) for (const t of [0.14, 0.28]) bolts.push([s * t, 0.03, z - 0.5 + i * 0.2]);
    }
    for (let z = Z_BACK + 0.4; z < Z_FRONT; z += 0.75) for (const s of [-1, 1]) bolts.push([s * (FW / 2 - 0.06), 0.008, z]);
    const boltMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.019, 0.019, 0.018, 6), new THREE.MeshLambertMaterial({color: '#2a1610'}), bolts.length);
    const m4 = new THREE.Matrix4();
    bolts.forEach((b, i) => boltMesh.setMatrixAt(i, m4.makeTranslation(b[0], b[1], b[2])));
    group.add(boltMesh);
    // her shadow on the steel
    const sh = add(new THREE.PlaneGeometry(FW, 7), new THREE.ShadowMaterial({color: '#000', opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8}), 0, 0.002, 0, (m) => (m.rotation.x = -Math.PI / 2));
    sh.receiveShadow = true;
    // the seat at each wall: a plate and two gussets
    for (const [z, s] of [[Z_BACK, 1], [Z_FRONT, -1]]) {
      add(new THREE.BoxGeometry(1.2, 1.0, 0.1), steelPlain, 0, -DEPTH / 2, z + s * 0.05);
      add(new THREE.BoxGeometry(1.0, 0.06, 0.5), steelPlain, 0, -DEPTH - 0.03, z + s * 0.25);
      for (const x of [-0.42, 0.42]) add(new THREE.BoxGeometry(0.03, 0.5, 0.5), steelPlain, x, -DEPTH - 0.3, z + s * 0.25, (m) => (m.rotation.x = s * 0.5));
    }
    // a lifeline at hand height on stanchions, slack between them
    const pts = [];
    const stz = [Z_BACK + 0.5, -3.2, 3.8, Z_FRONT - 0.5];
    for (const z of stz) {
      add(new THREE.BoxGeometry(0.035, 1.1, 0.035), M.metal, -FW / 2 + 0.02, 0.55, z);
      add(new THREE.BoxGeometry(0.12, 0.05, 0.12), M.metal, -FW / 2 + 0.02, 0.02, z);
    }
    for (let i = 0; i < stz.length - 1; i++) {
      let prev = new V(-FW / 2 + 0.02, 1.08, stz[i]);
      for (let k = 1; k <= 14; k++) {
        const t = k / 14;
        const p = new V(-FW / 2 + 0.02, 1.08 - 0.22 * 4 * t * (1 - t), stz[i] + (stz[i + 1] - stz[i]) * t);
        pts.push(prev, p);
        prev = p;
      }
    }
    // a chain and hook left hanging under the span, and a loose cable
    pts.push(new V(0.2, -DEPTH, -5.6), new V(0.2, -DEPTH - 2.6, -5.6));
    for (let k = 0; k < 10; k++) pts.push(new V(-0.25, -DEPTH - k * 0.35, 7.5 + Math.sin(k * 0.9) * 0.12), new V(-0.25, -DEPTH - (k + 1) * 0.35, 7.5 + Math.sin((k + 1) * 0.9) * 0.12));
    group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), M.line));
    add(new THREE.TorusGeometry(0.09, 0.022, 6, 12, Math.PI * 1.4), M.metal, 0.2, -DEPTH - 2.7, -5.6);
    // an obstruction light at each seat
    for (const z of [Z_BACK + 0.35, Z_FRONT - 0.35]) {
      add(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 10), M.metal, FW / 2 - 0.08, 0.05, z);
      add(new THREE.SphereGeometry(0.045, 10, 8), M.warn, FW / 2 - 0.08, 0.13, z);
    }
  }

  function setColour(rim) {
    M.lamp.color.set(rim);
    M.lampDim.color.set(rim);
    M.room.color.set(rim);
    M.flicker.color.set(rim);
  }
  function update(T) {
    const k = Math.sin(T * 11.0) * Math.sin(T * 6.1 + 2.0) * Math.sin(T * 1.7);
    M.flicker.opacity = k > 0.3 ? 0.1 : 0.8;
    M.warn.opacity = Math.sin(T * 2.4) > 0.55 ? 1 : 0.12;
  }
  setColour('#ff8a1f');
  return {group, setColour, update};
}
