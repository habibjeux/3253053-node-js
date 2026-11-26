// Environments (sets) and props. Each set returns { scene, update(t), lights }.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0, emissive: o.emissive ?? 0, emissiveIntensity: o.ei ?? 1, transparent: !!o.opacity, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide });
function box(w, h, d, mat, x = 0, y = 0, z = 0, r = 0) {
  const m = new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const TEX = {};
function tatami() {
  return TEX.tatami ||= canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#8c7a45'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < h; i += 4) { x.fillStyle = `rgba(${60 + (i % 8) * 4},50,20,0.18)`; x.fillRect(0, i, w, 2); }
    x.fillStyle = '#2a2016'; x.fillRect(0, 0, w, 14); x.fillRect(0, h - 14, w, 14);
  }, [4, 4]);
}
function woodTex() {
  return TEX.wood ||= canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#5b3a22'; x.fillRect(0, 0, w, h); const r = rng(3);
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(30,15,5,${0.15 + r() * 0.2})`; x.lineWidth = 1 + r() * 3; const y = r() * h; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + 10, w * 0.6, y - 10, w, y + r() * 8); x.stroke(); }
    for (let i = 0; i < w; i += 64) { x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(i, 0, 3, h); }
  }, [3, 3]);
}
function shojiTex() {
  return TEX.shoji ||= canvasTex(512, 1024, (x, w, h) => {
    x.fillStyle = '#f6dfb2'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#3a2414'; x.lineWidth = 14;
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); }
    for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke(); }
  });
}
function stoneTex() {
  return TEX.stone ||= canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#3c4150'; x.fillRect(0, 0, w, h); const r = rng(9);
    for (let yy = 0; yy < h; yy += 64) for (let xx = -(yy / 64 % 2) * 64; xx < w; xx += 128) { x.fillStyle = `rgb(${50 + r() * 20},${55 + r() * 20},${68 + r() * 20})`; x.fillRect(xx + 3, yy + 3, 122, 58); }
  }, [8, 8]);
}
function floorTex() {
  return TEX.floor ||= canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#9a7a52'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 64) { x.fillStyle = 'rgba(60,35,15,0.5)'; x.fillRect(i, 0, 3, h); }
  }, [6, 6]);
}
function chalkTex() {
  return TEX.chalk ||= canvasTex(1024, 512, (x, w, h) => {
    x.fillStyle = '#1f3a2c'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(240,240,230,0.7)'; x.lineWidth = 5; x.lineCap = 'round';
    const r = rng(4); for (let k = 0; k < 6; k++) { x.beginPath(); let px = 80, py = 80 + k * 60; x.moveTo(px, py); for (let i = 0; i < 18; i++) { px += 20 + r() * 25; x.lineTo(px, py + (r() - 0.5) * 18); } x.stroke(); }
  });
}

// ---------- props ----------
export function paperLantern(color = 0xffa04a, s = 1, white = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * s, 0.55 * s, 1.3 * s, 16), M(white ? 0xfff2d8 : 0xffb060, { emissive: color, ei: 2.2 }));
  g.add(body);
  for (const y of [-0.7, 0.7]) g.add(box(1.0 * s, 0.12 * s, 1.0 * s, M(0x2a160a), 0, y * s, 0));
  const ribs = M(0x6a3010, { emissive: 0x401800, ei: 0.4 });
  for (let i = -2; i <= 2; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(0.56 * s, 0.02 * s, 4, 20), ribs); rib.rotation.x = Math.PI / 2; rib.position.y = i * 0.22 * s; g.add(rib); }
  const light = new THREE.PointLight(color, 6, 14 * s, 1.6); g.add(light); g.userData.light = light;
  return g;
}
export function candle(s = 1) {
  const g = new THREE.Group();
  g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.17 * s, 0.7 * s, 12), M(0xf3ead4, { rough: 0.5 })), { castShadow: true }));
  g.children[0].position.y = 0.35 * s;
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.07 * s, 8, 8), M(0xffd27a, { emissive: 0xffb040, ei: 4 }));
  flame.scale.y = 2; flame.position.y = 0.82 * s; g.add(flame);
  const l = new THREE.PointLight(0xff9a40, 2.2, 7, 1.8); l.position.y = 1.0 * s; g.add(l);
  g.userData = { flame, light: l, seed: Math.random() * 10 };
  return g;
}
export function flicker(c, t) {
  const n = 0.85 + 0.15 * Math.sin(t * 13 + c.userData.seed) * Math.sin(t * 7.3 + c.userData.seed * 2);
  c.userData.light.intensity = 2.2 * n; c.userData.flame.scale.set(1, 2 * n, 1);
}
export function lowTable() {
  const g = new THREE.Group(); const w = M(0x3a1f10, { rough: 0.5 });
  g.add(box(5, 0.25, 3, w, 0, 1.0, 0, 0.05));
  for (const [x, z] of [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]]) g.add(box(0.3, 1.0, 0.3, w, x, 0.5, z));
  return g;
}
export function cushion(color = 0x6a1a20) { return box(1.8, 0.3, 1.8, M(color), 0, 0.15, 0, 0.12); }
export function bed(o = {}) {
  const g = new THREE.Group();
  g.add(box(3.6, 0.9, 7.5, M(0xe8e4dc), 0, 0.45, 0, 0.1));                       // futon/mattress
  g.add(box(3.7, 0.5, 4.6, M(o.blanket || 0x5b6f8f), 0, 1.05, 1.3, 0.2));         // blanket
  g.add(box(2.0, 0.5, 1.0, M(0xf6f2ea), 0, 1.15, -3.0, 0.2));                     // pillow
  if (o.frame) { const w = M(0xb8bcc4, { metal: 0.6, rough: 0.4 }); g.add(box(3.9, 2.5, 0.2, w, 0, 1.25, -3.8)); g.add(box(3.9, 1.6, 0.2, w, 0, 0.8, 3.8)); }
  return g;
}
export function cursedFinger() { // dark withered finger relic with talisman wrap
  const g = new THREE.Group(); const f = M(0x4a2c2c, { rough: 0.6, emissive: 0x200008, ei: 1 });
  const segs = [[0, 0, 0.9], [0, 0.95, 0.75], [0, 1.75, 0.6]];
  segs.forEach(([x, y, h], i) => { const s = new THREE.Mesh(new RoundedBoxGeometry(0.5 - i * 0.05, h, 0.5 - i * 0.05, 2, 0.15), f); s.position.set(x, y + h / 2, 0); s.rotation.z = i * 0.08; g.add(s); });
  const nail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.1), M(0x2a1818)); nail.position.set(0.05, 2.25, 0.22); g.add(nail);
  const wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.35, 12), M(0xe8d9a0)); wrap.position.y = 0.4; g.add(wrap);
  const glow = new THREE.PointLight(0xb020ff, 3, 6, 2); glow.position.y = 1.2; g.add(glow); g.userData.light = glow;
  return g;
}
export function woodBox(open = 0) {
  const g = new THREE.Group(); const w = M(0x4a2a14, { rough: 0.6 });
  g.add(box(2.2, 1.0, 1.4, w, 0, 0.5, 0, 0.04));
  const lid = new THREE.Group(); lid.position.set(0, 1.0, -0.7); lid.add(box(2.25, 0.2, 1.45, w, 0, 0.1, 0.72, 0.04)); lid.rotation.x = -open * 1.6; g.add(lid);
  g.add(box(2.24, 0.25, 0.08, M(0xd8c890, { emissive: 0x302810 }), 0, 0.7, 0.72)); // talisman strip
  g.userData.lid = lid; return g;
}
export function oldUniform() { // folded dark uniform jacket with gold buttons
  const g = new THREE.Group(); const c = M(0x15161c, { rough: 0.7 });
  g.add(box(2.2, 0.35, 1.8, c, 0, 0.18, 0, 0.08));
  g.add(box(2.0, 0.2, 0.5, c, 0, 0.42, -0.55, 0.08));
  const gold = M(0xd4a93a, { metal: 0.8, rough: 0.3 });
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), gold); b.position.set(0, 0.38, -0.2 + i * 0.4); g.add(b); }
  return g;
}

// ---------- creature ----------
export function creature() {
  const g = new THREE.Group(); const r = rng(77);
  const skin = M(0x1c1426, { rough: 0.5, emissive: 0x14031e, ei: 1 });
  const vein = M(0x7a1fd0, { emissive: 0x9a30ff, ei: 1.6 });
  const body = new THREE.Group(); g.add(body);
  // lumpy torso of stacked rounded blocks
  for (let i = 0; i < 9; i++) { const s = 2.2 + r() * 1.6; const b = box(s, s * (0.8 + r() * 0.4), s * 0.9, skin, (r() - 0.5) * 2, 3 + i * 0.9, (r() - 0.5) * 1.5, 0.4); b.rotation.set(r(), r(), r()); body.add(b); }
  for (let i = 0; i < 10; i++) { const v = box(0.12, 1.5 + r() * 2, 0.12, vein, (r() - 0.5) * 3.2, 4 + r() * 6, 1.1 + r() * 0.4); v.rotation.z = (r() - 0.5) * 1.2; body.add(v); }
  // many eyes
  const eyes = [];
  const eyeM = M(0xfff0a0, { emissive: 0xffc030, ei: 1.2 }), pup = M(0x000000);
  for (let i = 0; i < 9; i++) {
    const e = new THREE.Group(); const sz = 0.25 + r() * 0.35;
    const w = new THREE.Mesh(new THREE.SphereGeometry(sz, 14, 10), eyeM); e.add(w);
    const p = new THREE.Mesh(new THREE.SphereGeometry(sz * 0.45, 10, 8), pup); p.position.z = sz * 0.75; p.scale.z = 0.5; e.add(p);
    e.position.set((r() - 0.5) * 3, 6 + r() * 4.5, 1.5 + r() * 0.5); body.add(e); eyes.push(e);
  }
  // mouth with teeth
  const mouth = new THREE.Group(); mouth.position.set(0, 5.2, 1.6); body.add(mouth);
  mouth.add(box(2.6, 0.9, 0.4, M(0x2a0008, { emissive: 0x300010 }), 0, 0, 0, 0.2));
  const tooth = M(0xf2ead8);
  for (let i = 0; i < 9; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.45, 4), tooth); t.position.set(-1.1 + i * 0.27, 0.25, 0.25); t.rotation.x = Math.PI; mouth.add(t); const t2 = t.clone(); t2.position.y = -0.25; t2.rotation.x = 0; mouth.add(t2); }
  // long arms with claws
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 2.2, 8, 0); body.add(a);
    a.add(box(0.8, 5.5, 0.8, skin, 0, -2.6, 0, 0.3)); a.add(box(0.7, 4.5, 0.7, skin, 0, -7.2, 0.6, 0.3));
    for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2, 4), tooth); c.position.set(-0.3 + k * 0.2, -9.8, 0.8); c.rotation.x = Math.PI * 0.9; a.add(c); }
    a.rotation.z = s * 0.25; arms.push(a);
  }
  const aura = new THREE.PointLight(0x9a30ff, 18, 22, 1.5); aura.position.set(0, 6, 3); g.add(aura);
  g.userData = { eyes, arms, mouth, body, aura };
  return g;
}
export function animateCreature(c, t, rage = 0) {
  const u = c.userData;
  u.body.position.y = Math.sin(t * 1.3) * 0.25;
  u.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (0.25 + 0.15 * Math.sin(t * 1.1 + i)) - (i ? 1 : -1) * rage * 0.6; a.rotation.x = -rage * 0.9 + Math.sin(t * 0.9 + i) * 0.1; });
  u.eyes.forEach((e, i) => { const b = Math.sin(t * 0.7 + i * 1.7) > 0.96 ? 0.1 : 1; e.scale.set(1, b, 1); e.rotation.y = Math.sin(t * 0.5 + i) * 0.4; });
  u.mouth.scale.y = 1 + rage * 0.8 + Math.sin(t * 3) * 0.08;
  u.aura.intensity = 18 + 6 * Math.sin(t * 2.3);
}

// ---------- particles (dust / embers / fog sprites) ----------
function fogSprites(scene, n, area, color, opacity, seed = 1, size = 10) {
  const tex = TEX.fog ||= canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const r = rng(seed); const list = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: opacity * (0.5 + r() * 0.5), depthWrite: false }));
    s.position.set(area[0] + r() * (area[1] - area[0]), area[2] + r() * (area[3] - area[2]), area[4] + r() * (area[5] - area[4]));
    s.scale.setScalar(size * (0.6 + r() * 0.8)); s.userData.v = (r() - 0.5) * 0.6; s.userData.x0 = s.position.x; scene.add(s); list.push(s);
  }
  return t => list.forEach(s => { s.position.x = s.userData.x0 + Math.sin(t * 0.1 + s.userData.v * 10) * 2 + t * s.userData.v; });
}
function dust(scene, n, area, color = 0xffd8a0, seed = 2) {
  const r = rng(seed); const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = area[0] + r() * (area[1] - area[0]); pos[i * 3 + 1] = area[2] + r() * (area[3] - area[2]); pos[i * 3 + 2] = area[4] + r() * (area[5] - area[4]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = TEX.dot ||= canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.09, map: tex, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts);
  const base = pos.slice();
  return t => { for (let i = 0; i < n; i++) { pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.4 + i) * 0.3; pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + i * 2) * 0.3; } geo.attributes.position.needsUpdate = true; };
}

// ---------- sets ----------
function baseScene(bg, fog) { const s = new THREE.Scene(); s.background = new THREE.Color(bg); if (fog) s.fog = new THREE.FogExp2(bg, fog); return s; }
function shadowLight(color, intensity, pos, size = 20) {
  const l = new THREE.DirectionalLight(color, intensity); l.position.set(...pos); l.castShadow = true; l.shadow.mapSize.set(2048, 2048);
  Object.assign(l.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: 0.5, far: 120 }); l.shadow.bias = -0.0005; return l;
}

// traditional room, candle-lit, low table (scenes 1–2)
export function setWashitsu() {
  const scene = baseScene(0x120a06, 0.02); const ups = [];
  scene.add(new THREE.HemisphereLight(0xffb070, 0x1a0c05, 0.35));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: tatami(), roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const sh = new THREE.MeshStandardMaterial({ map: shojiTex(), emissive: 0xff9a40, emissiveMap: shojiTex(), emissiveIntensity: 0.55, roughness: 0.9 });
  for (const [x, z, ry] of [[0, -10, 0], [-10, 0, Math.PI / 2], [10, 0, -Math.PI / 2]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), sh); w.position.set(x, 5, z); w.rotation.y = ry; scene.add(w);
  }
  const wood = M(0x2a160a, { rough: 0.6 });
  for (const x of [-10, -5, 0, 5, 10]) scene.add(box(0.5, 10, 0.5, wood, x, 5, -9.8));
  scene.add(box(21, 0.6, 0.6, wood, 0, 9.8, -9.8)); scene.add(box(21, 0.4, 0.5, wood, 0, 6.5, -9.8));
  scene.add(box(30, 0.3, 30, M(0x1a0d06), 0, 10.2, 0)); // ceiling
  const table = lowTable(); scene.add(table);
  const cands = []; for (const [x, z] of [[-1.6, 0.3], [0, -0.5], [1.6, 0.3], [-0.8, 0.8], [0.9, -0.9]]) { const c = candle(1); c.position.set(x, 1.13, z); scene.add(c); cands.push(c); }
  for (const [x, z] of [[-7, -7], [7, -7]]) { const l = paperLantern(0xff9040, 1); l.position.set(x, 7.5, z); scene.add(l); }
  const key = shadowLight(0xffa860, 0.6, [4, 14, 8]); scene.add(key);
  ups.push(dust(scene, 400, [-9, 9, 0.5, 9, -9, 9]));
  return { scene, update: t => { cands.forEach(c => flicker(c, t)); ups.forEach(u => u(t)); } };
}

// grandfather's room (hospital-like, evening light through window)
export function setBedroom() {
  const scene = baseScene(0x1a1410, 0.015); const ups = [];
  scene.add(new THREE.HemisphereLight(0xffd6a8, 0x201510, 0.6));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.7 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = M(0xcfc2ad, { rough: 0.95 });
  scene.add(box(30, 12, 0.3, wallM, 0, 6, -8)); scene.add(box(0.3, 12, 30, wallM, -9, 6, 0)); scene.add(box(0.3, 12, 30, wallM, 9, 6, 0));
  // window with sunset glow
  const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.5), M(0xffa060, { emissive: 0xff7a30, ei: 1.4 })); win.position.set(4, 6.5, -7.8); scene.add(win);
  const fr = M(0x3a2a1a); scene.add(box(6.4, 0.3, 0.3, fr, 4, 8.8, -7.7)); scene.add(box(6.4, 0.3, 0.3, fr, 4, 4.2, -7.7)); scene.add(box(0.3, 4.8, 0.3, fr, 4, 6.5, -7.7));
  const b = bed({ frame: true, blanket: 0x7d8ea6 }); b.position.set(-1.5, 0, -2); scene.add(b);
  // bedside table + lamp
  scene.add(box(1.6, 1.8, 1.4, M(0x6a4a2a), 2.4, 0.9, -4.6, 0.05));
  const lamp = new THREE.PointLight(0xffb070, 8, 14, 1.6); lamp.position.set(2.4, 3.2, -4.6); scene.add(lamp);
  scene.add(box(0.7, 0.8, 0.7, M(0xfff0d0, { emissive: 0xffb060, ei: 1.5 }), 2.4, 2.6, -4.6));
  const sun = shadowLight(0xff9a50, 2.0, [10, 9, -16]); scene.add(sun);
  ups.push(dust(scene, 300, [-8, 8, 0.5, 8, -7, 6], 0xffe0b0));
  return { scene, update: t => ups.forEach(u => u(t)) };
}

// school classroom at golden hour
export function setClassroom() {
  const scene = baseScene(0x2a1e18, 0.01); const ups = [];
  scene.add(new THREE.HemisphereLight(0xffe0c0, 0x302018, 0.9));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = M(0xe9e1d0, { rough: 0.95 });
  scene.add(box(40, 12, 0.3, wallM, 0, 6, -12));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), new THREE.MeshStandardMaterial({ map: chalkTex(), roughness: 0.9 })); board.position.set(0, 6, -11.8); scene.add(board);
  // window wall (right) with bright light
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(5, 6), M(0xffd9a0, { emissive: 0xffb060, ei: 1.2 })); w.position.set(12, 6, -9 + i * 6.5); w.rotation.y = -Math.PI / 2; scene.add(w); scene.add(box(0.4, 12, 0.6, wallM, 12.1, 6, -5.7 + i * 6.5)); }
  scene.add(box(0.4, 2.5, 40, wallM, 12.1, 1.25, 0)); scene.add(box(0.4, 2.5, 40, wallM, 12.1, 10.8, 0));
  scene.add(box(0.3, 12, 40, wallM, -12, 6, 0));
  // desks
  const deskTop = M(0xc89a62, { rough: 0.5 }), metal = M(0x5a5e66, { metal: 0.6, rough: 0.4 });
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    const g = new THREE.Group(); g.position.set(-7.5 + col * 5, 0, -4 + row * 4.5);
    g.add(box(2.6, 0.15, 1.8, deskTop, 0, 2.6, 0, 0.03)); g.add(box(0.15, 2.6, 0.15, metal, -1.1, 1.3, -0.7)); g.add(box(0.15, 2.6, 0.15, metal, 1.1, 1.3, -0.7)); g.add(box(0.15, 2.6, 0.15, metal, -1.1, 1.3, 0.7)); g.add(box(0.15, 2.6, 0.15, metal, 1.1, 1.3, 0.7));
    scene.add(g);
  }
  const sun = shadowLight(0xffb070, 3.2, [22, 12, 4], 26); scene.add(sun);
  ups.push(dust(scene, 500, [-10, 10, 0.5, 10, -10, 12], 0xfff0c0));
  return { scene, update: t => ups.forEach(u => u(t)) };
}

// night street with lanterns, torii gate, full moon and fog (blue)
export function setStreet() {
  const scene = baseScene(0x0b1030, 0.022); const ups = [];
  scene.add(new THREE.HemisphereLight(0x6a80ff, 0x140c18, 1.3));
  const rimS = new THREE.DirectionalLight(0x7a8cff, 2.2); rimS.position.set(0, 10, -30); scene.add(rimS);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.55, metalness: 0.1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const moonLight = shadowLight(0x9fb4ff, 1.6, [-20, 30, -40], 30); scene.add(moonLight);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 24), M(0xf4f6ff, { emissive: 0xdfe6ff, ei: 1.6 })); moon.position.set(10, 40, -120); scene.add(moon);
  // houses along both sides
  const wall = M(0x2a1c14, { rough: 0.8 }), roof = M(0x15182a, { rough: 0.6 }), warm = M(0xffb060, { emissive: 0xff8a30, ei: 1.6 });
  const lanterns = [];
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const z = 6 - i * 12, x = side * 8;
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    g.add(box(8, 8, 10, wall, side * 2, 4, 0));
    const rf = box(10.5, 0.6, 12.5, roof, side * 2, 8.6, 0); rf.rotation.z = side * -0.25; g.add(rf);
    for (const dz of [-2.5, 2.5]) g.add(box(0.2, 3.2, 2.6, warm, -side * 2.05, 3.6, dz));
    if (i % 2 === 0) { const l = paperLantern(0xff8a30, 0.9); l.position.set(-side * 2.6, 6.2, 0); g.add(l); lanterns.push(l); }
  }
  // torii gate at the end of the street
  const red = M(0xb3221c, { rough: 0.5, emissive: 0x300404 });
  const tor = new THREE.Group(); tor.position.set(0, 0, -70); scene.add(tor);
  for (const s of [-1, 1]) tor.add(box(1.2, 14, 1.2, red, s * 6, 7, 0, 0.2));
  tor.add(box(17, 1.1, 1.6, red, 0, 14.2, 0, 0.2)); tor.add(box(14, 0.8, 1.0, red, 0, 11.8, 0)); tor.add(box(19, 0.5, 2, M(0x111111), 0, 14.9, 0));
  ups.push(fogSprites(scene, 40, [-25, 25, 0.5, 4, -90, 15], 0x6f7fc8, 0.18, 4, 16));
  ups.push(dust(scene, 600, [-15, 15, 0.5, 14, -60, 15], 0xb0c0ff, 5));
  return { scene, update: t => { ups.forEach(u => u(t)); lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.3 + i) * 0.05; }); } };
}

// dark place (old school building at night, purple fog) for the creature
export function setDark() {
  const scene = baseScene(0x07050f, 0.035); const ups = [];
  scene.add(new THREE.HemisphereLight(0x5a4ab0, 0x050308, 0.8));
  const rimD = new THREE.DirectionalLight(0xb060ff, 3.5); rimD.position.set(-6, 12, -25); scene.add(rimD);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.5 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // school building silhouette with a few broken lit windows
  const b = M(0x14121c, { rough: 0.9 });
  scene.add(box(60, 18, 6, b, 0, 9, -30));
  const r = rng(12);
  for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 12; i++) { const lit = r() < 0.12; scene.add(box(3, 2.5, 0.2, lit ? M(0x8a70ff, { emissive: 0x5030c0, ei: 1.2 }) : M(0x0a0910), -26 + i * 4.7, 4 + fl * 5, -26.9)); }
  const moonLight = shadowLight(0x8a90ff, 0.9, [15, 25, 20], 30); scene.add(moonLight);
  ups.push(fogSprites(scene, 45, [-30, 30, 0.3, 3, -30, 15], 0x7a40c0, 0.22, 7, 14));
  ups.push(dust(scene, 500, [-15, 15, 0.5, 12, -25, 12], 0xc0a0ff, 8));
  return { scene, update: t => ups.forEach(u => u(t)) };
}
