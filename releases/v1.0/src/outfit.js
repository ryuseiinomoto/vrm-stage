// Clothes built here from simple shapes and fitted to whatever avatar is on the stage: an oversized pullover hoodie
// in a gothic street style with silver emblems, and chunky high-top sneakers with a thick sole and a long tongue.
// Both are original designs: no brand's logo, lettering or signature motif is drawn.
//
// build() must run while the model is in its rest pose (arms out in a T). Every piece is made in the model's own
// space from the positions of its bones and then handed to the bone it follows, so it moves with the pose.
import {VRMSpringBoneCollider, VRMSpringBoneColliderShapeCapsule} from '@pixiv/three-vrm';
import * as THREE from 'three';

const V = THREE.Vector3;
const lighten = (hex, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k).getHexString();
const darken = (hex, k) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#000000'), k).getHexString();

// The emblem: a dagger star. Four blades from one centre, the lower one long, short spikes between them and an
// open ring in the middle. ky stretches it so it comes out upright on a surface whose texture is not square.
function emblem(g, cx, cy, s, col, base, ky = 1) {
  g.save();
  g.translate(cx, cy);
  g.scale(1, ky);
  g.fillStyle = col;
  const blade = (ang, len, w) => {
    g.save();
    g.rotate(ang);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(w, -len * 0.3);
    g.lineTo(0, -len);
    g.lineTo(-w, -len * 0.3);
    g.closePath();
    g.fill();
    g.restore();
  };
  blade(0, s * 0.95, s * 0.17);
  blade(Math.PI, s * 1.7, s * 0.17);
  blade(Math.PI / 2, s * 0.8, s * 0.15);
  blade(-Math.PI / 2, s * 0.8, s * 0.15);
  for (const a of [0.25, 0.75, 1.25, 1.75]) blade(a * Math.PI, s * 0.42, s * 0.07);
  g.beginPath();
  g.arc(0, 0, s * 0.27, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = base;
  g.beginPath();
  g.arc(0, 0, s * 0.15, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
const stud = (g, x, y, r, col, ky) => {
  g.save();
  g.translate(x, y);
  g.scale(1, ky);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r, 0);
  g.lineTo(0, r);
  g.lineTo(-r, 0);
  g.closePath();
  g.fill();
  g.restore();
};
const cloth = (g, w, h, base) => {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  // a little weave so large flat areas are not dead
  let s = 99173;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = lighten(base, 0.07);
  for (let i = 0; i < (w * h) / 90; i++) g.fillRect(r() * w, r() * h, 1.5, 1.5);
};
const rib = (g, x, y, w, h, base) => {
  g.fillStyle = darken(base, 0.18);
  g.fillRect(x, y, w, h);
  g.fillStyle = lighten(base, 0.1);
  for (let i = 0; i < w; i += 7) g.fillRect(x + i, y, 2.5, h);
};

function torsoTexture(base, mark, ky) {
  const W = 1024;
  const H = 1024;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  cloth(g, W, H, base);
  rib(g, 0, H * 0.93, W, H * 0.07, base);
  // front: the emblem on the chest and the pouch pocket under it
  emblem(g, W * 0.5, H * 0.33, 40, mark, base, ky);
  g.strokeStyle = lighten(base, 0.22);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(W * 0.5 - 86, H * 0.64);
  g.lineTo(W * 0.5 + 86, H * 0.64);
  g.lineTo(W * 0.5 + 118, H * 0.76);
  g.lineTo(W * 0.5 + 118, H * 0.9);
  g.lineTo(W * 0.5 - 118, H * 0.9);
  g.lineTo(W * 0.5 - 118, H * 0.76);
  g.closePath();
  g.stroke();
  // back, drawn across the seam: a large emblem inside a ring of studs
  for (const x of [0, W]) {
    emblem(g, x, H * 0.4, 78, mark, base, ky);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      stud(g, x + Math.cos(a) * 150, H * 0.43 + Math.sin(a) * 150 * ky, 7, mark, ky);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function sleeveTexture(base, mark, ky) {
  const W = 256;
  const H = 512;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  cloth(g, W, H, base);
  // emblems down the sleeve, on both sides so one always faces out
  for (const x of [W * 0.25, W * 0.75]) for (const y of [0.3, 0.7]) emblem(g, x, H * y, 15, mark, base, ky);
  for (const x of [0, W * 0.5, W]) for (const y of [0.1, 0.5, 0.9]) stud(g, x, H * y, 4.5, mark, ky);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// A tube of superellipse rings: [y, half-width, half-depth, z centre]. The seam is at the back, u runs left to right
// across the front as the viewer sees it, v from the hem up.
function ringTube(rings, seg = 40, power = 2.7) {
  const pos = [];
  const uv = [];
  const idx = [];
  const y0 = rings[0][0];
  const y1 = rings[rings.length - 1][0];
  rings.forEach(([y, rx, rz, zc]) => {
    for (let j = 0; j <= seg; j++) {
      const th = (j / seg) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const e = 2 / power;
      pos.push(-rx * Math.sign(s) * Math.abs(s) ** e, y, zc - rz * Math.sign(c) * Math.abs(c) ** e);
      uv.push(j / seg, (y - y0) / (y1 - y0));
    }
  });
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function createOutfit() {
  const mats = {
    torso: new THREE.MeshToonMaterial({side: THREE.DoubleSide}),
    sleeve: new THREE.MeshToonMaterial({side: THREE.DoubleSide}),
    plain: new THREE.MeshToonMaterial({side: THREE.DoubleSide}),
    cuff: new THREE.MeshToonMaterial(),
    cord: new THREE.MeshToonMaterial({color: '#e8e8ec'}),
    metal: new THREE.MeshToonMaterial({color: '#c9ccd6'}),
    upper: new THREE.MeshToonMaterial(),
    tongue: new THREE.MeshToonMaterial(),
    sole: new THREE.MeshToonMaterial({color: '#f1f0ea'}),
    lace: new THREE.MeshToonMaterial({color: '#f6f6f2'}),
  };
  let hoodie = [];
  let kicks = [];
  let dims = {torsoKy: 1.7, sleeveKy: 3};
  // Guards that keep the hair on the outside of the hoodie. The model's own hair colliders are sized for its body;
  // the hoodie is a few centimetres bigger and has a hood, so the swinging strands get these extra shapes to rest on.
  let guard = {name: 'hoodie', colliders: []};
  let springs = null;
  let guarded = false;
  const setGuard = (on) => {
    if (!springs || on === guarded) return;
    for (const j of springs.joints) {
      const i = j.colliderGroups.indexOf(guard);
      if (on && i < 0) j.colliderGroups.push(guard);
      if (!on && i >= 0) j.colliderGroups.splice(i, 1);
    }
    guarded = on;
  };
  let last = '';

  const clear = () => {
    for (const m of [...hoodie, ...kicks]) {
      m.removeFromParent();
      m.geometry.dispose();
    }
    setGuard(false);
    for (const c of guard.colliders) c.removeFromParent();
    guard = {name: 'hoodie', colliders: []};
    springs = null;
    hoodie = [];
    kicks = [];
  };

  function build(vrm, height) {
    clear();
    const root = vrm.scene;
    const H = vrm.humanoid;
    if (!H) return;
    const k = height / 1.55;
    const bone = (n) => H.getNormalizedBoneNode(n);
    const at = (n) => {
      const b = bone(n);
      return b ? root.worldToLocal(b.getWorldPosition(new V())) : null;
    };
    const put = (list, geo, mat, follow, f) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.frustumCulled = false;
      f?.(m);
      root.add(m);
      m.updateMatrixWorld(true);
      follow.attach(m); // keeps its place in the world, now carried by the bone
      list.push(m);
      return m;
    };
    // a cylinder laid from a to b
    const span = (a, b, r0, r1, seg = 20) => {
      const d = new V().subVectors(b, a);
      const geo = new THREE.CylinderGeometry(r1, r0, d.length(), seg, 1, true);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), d.clone().normalize()));
      geo.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      return geo;
    };

    // ---------------------------------------------------------- hoodie
    const hips = at('hips');
    const neck = at('neck');
    const shL = at('leftUpperArm');
    const body = bone('upperChest') || bone('chest') || bone('spine');
    if (hips && neck && shL && body) {
      const shX = Math.abs(shL.x);
      const wide = Math.max(0.178 * k, shX + 0.07 * k);
      const zc = (hips.z + neck.z) / 2;
      const hem = hips.y - 0.1 * k;
      const rings = [
        [hem, wide * 0.97, 0.135 * k, zc],
        [hem + 0.02 * k, wide, 0.142 * k, zc],
        [(hips.y + shL.y) / 2, wide * 1.02, 0.146 * k, zc],
        [shL.y - 0.07 * k, wide * 1.03, 0.146 * k, zc],
        [shL.y + 0.012 * k, shX + 0.05 * k, 0.122 * k, zc],
        [neck.y + 0.002 * k, 0.082 * k, 0.086 * k, neck.z],
      ];
      dims.torsoKy = (2 * Math.PI * wide * 0.82) / (neck.y - hem);
      put(hoodie, ringTube(rings), mats.torso, bone('chest') || body);
      // the hood, down on the back, and the thick collar it hangs from
      const hoodAt = new V(0, neck.y - 0.03 * k, neck.z - 0.1 * k);
      put(hoodie, new THREE.SphereGeometry(1, 28, 18), mats.plain, body, (m) => {
        m.scale.set(0.118 * k, 0.07 * k, 0.078 * k);
        m.position.copy(hoodAt);
        m.rotation.x = 0.45;
      });
      put(hoodie, new THREE.TorusGeometry(0.083 * k, 0.027 * k, 12, 36), mats.plain, body, (m) => {
        m.rotation.x = Math.PI / 2 + 0.3;
        m.position.set(0, neck.y + 0.012 * k, neck.z - 0.004 * k);
      });
      // hair guards: one lying across the hood and two standing in the body of the hoodie. They are kept a little
      // inside the cloth at the sides, so the hair rests on the back and chest without being flared out past the shoulders
      springs = vrm.springBoneManager || null;
      const keep = (shape, where, follow) => {
        const c = new VRMSpringBoneCollider(shape);
        c.position.copy(where);
        root.add(c);
        c.updateMatrixWorld(true);
        follow.attach(c);
        guard.colliders.push(c);
      };
      keep(new VRMSpringBoneColliderShapeCapsule({radius: 0.084 * k, offset: new V(-0.04 * k, 0, 0), tail: new V(0.04 * k, 0, 0)}), hoodAt, body);
      for (const sgn of [-1, 1])
        keep(new VRMSpringBoneColliderShapeCapsule({radius: 0.136 * k, offset: new V(0, 0, 0), tail: new V(0, shL.y - 0.1 * k - (hem + 0.12 * k), 0)}), new V(sgn * 0.03 * k, hem + 0.12 * k, zc), bone('chest') || body);
      // drawstrings with metal tips
      for (const sgn of [-1, 1]) {
        const top = new V(sgn * 0.034 * k, neck.y - 0.012 * k, neck.z + 0.086 * k);
        const end = new V(sgn * 0.04 * k, neck.y - 0.135 * k, neck.z + 0.12 * k);
        put(hoodie, span(top, end, 0.0032 * k, 0.0032 * k, 8), mats.cord, body);
        put(hoodie, span(end, new V(end.x, end.y - 0.02 * k, end.z + 0.002 * k), 0.0045 * k, 0.0045 * k, 8), mats.metal, body);
      }
      // sleeves: shoulder ball, upper sleeve, elbow ball, forearm, ribbed cuff
      for (const side of ['left', 'right']) {
        const sh = at(side + 'UpperArm');
        const elb = at(side + 'LowerArm');
        const wr = at(side + 'Hand');
        if (!sh || !elb || !wr) continue;
        const upper = bone(side + 'UpperArm');
        const lower = bone(side + 'LowerArm');
        const cuffAt = new V().lerpVectors(elb, wr, 0.84);
        dims.sleeveKy = (2 * Math.PI * 0.063 * k) / sh.distanceTo(elb) * 2;
        put(hoodie, new THREE.SphereGeometry(0.073 * k, 20, 14), mats.plain, upper, (m) => m.position.copy(sh));
        put(hoodie, span(sh, elb, 0.07 * k, 0.064 * k), mats.sleeve, upper);
        put(hoodie, new THREE.SphereGeometry(0.0645 * k, 18, 12), mats.plain, lower, (m) => m.position.copy(elb));
        put(hoodie, span(elb, cuffAt, 0.064 * k, 0.056 * k), mats.sleeve, lower);
        put(hoodie, new THREE.SphereGeometry(0.056 * k, 16, 10), mats.plain, lower, (m) => {
          m.position.copy(cuffAt);
          m.scale.setScalar(0.98);
        });
        put(hoodie, span(cuffAt, new V().lerpVectors(elb, wr, 1.0), 0.044 * k, 0.041 * k, 16), mats.cuff, lower);
      }
    }

    // ---------------------------------------------------------- high-tops
    for (const side of ['left', 'right']) {
      const foot = bone(side + 'Foot');
      const a = at(side + 'Foot');
      if (!foot || !a) continue;
      const toes = at(side + 'Toes');
      const s = toes ? THREE.MathUtils.clamp((toes.z - a.z) / 0.115, 0.8, 1.3) * 1.0 : k;
      const o = new V(a.x, 0, a.z); // the floor under the ankle
      const W = 0.092 * s;
      const add = (geo, mat, f) => put(kicks, geo, mat, foot, (m) => {
        f?.(m);
        m.position.add(o);
      });
      // the sole: a thick slab, wider than the upper, rounded at toe and heel
      {
        // drawn from above with the toe toward the bottom of the outline, so that laying it flat needs no mirroring
        const sh = new THREE.Shape();
        const hw = 0.057 * s;
        const tw = hw * 1.05;
        const toe = -(0.2 * s - tw); // outline y is minus the foot's length axis
        const heel = 0.08 * s - hw;
        sh.moveTo(-tw, toe);
        sh.absarc(0, toe, tw, Math.PI, Math.PI * 2, false);
        sh.lineTo(hw, heel);
        sh.absarc(0, heel, hw, 0, Math.PI, false);
        sh.closePath();
        const geo = new THREE.ExtrudeGeometry(sh, {depth: 0.044 * s, bevelEnabled: true, bevelSize: 0.004 * s, bevelThickness: 0.004 * s, bevelSegments: 2, curveSegments: 14});
        geo.rotateX(-Math.PI / 2); // the outline lies on the floor, the thickness goes up
        geo.translate(0, 0.004 * s, 0);
        add(geo, mats.sole);
      }
      // the upper, from its side outline
      {
        const p = new THREE.Shape();
        const pts = [[-0.064, 0.036], [-0.07, 0.12], [-0.066, 0.2], [-0.02, 0.212], [0.012, 0.205], [0.034, 0.15], [0.085, 0.092], [0.14, 0.07], [0.172, 0.056], [0.186, 0.036]];
        p.moveTo(pts[0][0] * s, pts[0][1] * s);
        for (const [z, y] of pts.slice(1)) p.lineTo(z * s, y * s);
        p.closePath();
        const geo = new THREE.ExtrudeGeometry(p, {depth: W - 0.016 * s, bevelEnabled: true, bevelSize: 0.008 * s, bevelThickness: 0.008 * s, bevelSegments: 3});
        geo.rotateY(-Math.PI / 2); // outline x becomes the foot's length, the extrusion its width
        geo.translate((W - 0.016 * s) / 2, 0, 0);
        add(geo, mats.upper);
      }
      // rubber toe cap
      add(new THREE.SphereGeometry(1, 20, 14), mats.sole, (m) => {
        m.scale.set(0.05 * s, 0.024 * s, 0.04 * s);
        m.position.set(0, 0.058 * s, 0.158 * s);
      });
      // the long tongue, standing above the collar
      add(new THREE.BoxGeometry(0.06 * s, 0.15 * s, 0.012 * s), mats.tongue, (m) => {
        m.position.set(0, 0.185 * s, 0.03 * s);
        m.rotation.x = 0.2;
      });
      // laces across the vamp
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        add(new THREE.BoxGeometry(0.072 * s, 0.006 * s, 0.011 * s), mats.lace, (m) => {
          m.position.set(0, (0.158 - 0.062 * t) * s, (0.04 + 0.062 * t) * s);
          m.rotation.x = 0.85;
        });
      }
      // a pull tab at the heel
      add(new THREE.BoxGeometry(0.02 * s, 0.03 * s, 0.006 * s), mats.lace, (m) => m.position.set(0, 0.2 * s, -0.073 * s));
    }
    last = '';
  }

  // st: {hoodie, kicks, hoodieCol, emblemCol, kickCol}
  function apply(st) {
    for (const m of hoodie) m.visible = !!st.hoodie;
    setGuard(!!st.hoodie && hoodie.length > 0);
    for (const m of kicks) m.visible = !!st.kicks;
    const key = [st.hoodieCol, st.emblemCol, st.kickCol, dims.torsoKy.toFixed(2), dims.sleeveKy.toFixed(2)].join();
    if (key === last) return;
    last = key;
    mats.torso.map?.dispose();
    mats.sleeve.map?.dispose();
    mats.torso.map = torsoTexture(st.hoodieCol, st.emblemCol, dims.torsoKy);
    mats.sleeve.map = sleeveTexture(st.hoodieCol, st.emblemCol, dims.sleeveKy);
    mats.torso.needsUpdate = mats.sleeve.needsUpdate = true;
    mats.plain.color.set(st.hoodieCol);
    mats.cuff.color.set(darken(st.hoodieCol, 0.2));
    mats.upper.color.set(st.kickCol);
    mats.tongue.color.set(lighten(st.kickCol, 0.05));
  }
  return {build, apply, clear, get parts() {
    return {hoodie, kicks};
  }};
}
