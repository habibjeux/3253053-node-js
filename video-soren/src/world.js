// Décors : ville aux reflets, tour de verre, couloir au miroir, salle de la tour suspendue dans le vide.
import * as THREE from 'three';
import { box, mat, glow, prism, plane, canvasTex, Character, FONT, hash, V3 } from './lib.js';

export const frac = (x) => x - Math.floor(x);

// ---------------- personnages ----------------
const SOREN = { skin: '#e8c4a0', shirt: '#23262f', sleeve: '#23262f', pants: '#30343f', shoes: '#f1f1f1', hood: '#1b1d24', hair: '#2b1d14', bag: '#b5462f', scale: 0.92 };
const MAYA = { skin: '#f1c9a5', shirt: '#ff7aa8', stripe: '#ffd166', pants: '#5b5f97', shoes: '#ffffff', hair: '#3b2416', pigtails: true, backpack: '#4cc9f0', scale: 0.66 };
export function makeCast() {
  const C = {};
  C.soren = new Character(SOREN);
  C.maya = new Character(MAYA);
  C.gardien = new Character({ skin: '#d9cbbd', shirt: '#14141c', sleeve: '#14141c', pants: '#101018', shoes: '#050508', coat: '#191923', coatTrim: '#2c2c3a', hair: '#c9c9d1', sideHair: true, glasses: true, scale: 1.28 });
  C.boulanger = new Character({ skin: '#f0c8a0', shirt: '#e9e3d6', pants: '#6b5847', hat: 'chef', apron: '#ffffff', mustache: '#5a3a22', scale: 1.05 });
  C.veilleur = new Character({ skin: '#c99a76', shirt: '#2a3550', pants: '#1d2333', hat: 'cap', hatColor: '#1d2333', badge: '#c0c8d8', scale: 1.08 });
  C.p1 = new Character({ skin: '#ffdbac', shirt: '#6c7a89', pants: '#3a3f4a', hair: '#4a3a2a' });
  C.p2 = new Character({ skin: '#8d5524', shirt: '#7d6b91', pants: '#2f2f3a', hat: 'beanie', hatColor: '#455a64', bandColor: '#37474f', pompom: '#90a4ae', scale: 0.96 });
  C.kid = new Character({ skin: '#ffe0bd', shirt: '#2a9d8f', pants: '#264653', hair: '#6b3a1f', scale: 0.7 });
  // reflets (doubles argentés)
  C.rSoren = makeReflection(SOREN);
  C.rMaya = makeReflection(MAYA);
  C.rP1 = makeReflection(C.p1.o);
  C.rBoul = makeReflection(C.boulanger.o);
  C.rVeil = makeReflection(C.veilleur.o);
  C.doubles = []; // les doubles de Soren autour de la salle
  for (let k = 0; k < 26; k++) C.doubles.push(makeReflection(SOREN, 0.9 + hash(k) * 0.5));
  return C;
}
export const REFL = new THREE.MeshStandardMaterial({ color: '#d4dcf0', metalness: 1, roughness: 0.14, emissive: '#3a4c88', emissiveIntensity: 0.45 });
export function makeReflection(o, glowK = 0.45) {
  const c = new Character({ ...o });
  const m = glowK === 0.45 ? REFL : REFL.clone(); if (m !== REFL) m.emissiveIntensity = glowK;
  c.root.traverse((n) => { if (n.isMesh) { if (Array.isArray(n.material)) n.material = n.material.map((x, i) => (i === 4 ? x : m)); else n.material = m; } });
  c.faceMat.color.set('#c6d2ff'); c.faceMat.metalness = 0.5; c.faceMat.roughness = 0.2; c.faceMat.emissive = new THREE.Color('#202a55'); c.faceMat.emissiveIntensity = 0.6;
  c.isReflection = true;
  return c;
}

// ---------------- textures ----------------
export function skyTex(top, bottom) {
  return canvasTex(64, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
}
const cobbleTex = () => {
  const t = canvasTex(512, 512, (ctx, w) => {
    ctx.fillStyle = '#4a4e57'; ctx.fillRect(0, 0, w, w);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const j = hash(x * 31 + y * 7); ctx.fillStyle = `hsl(${215 + j * 15},${8 + j * 8}%,${34 + j * 12}%)`; ctx.beginPath(); ctx.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 8); ctx.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const facadeTex = (hue) => {
  const t = canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = `hsl(${hue},14%,40%)`; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; for (let y = 0; y < h; y += 24) ctx.fillRect(0, y, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 48) for (let x = (y / 48 % 2) * 24; x < w; x += 48) ctx.fillRect(x, y, 2, 24);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};

// ---------------- ville ----------------
export const TOWER = V3(0, 0, -96);
export function makeCity(scene) {
  const W = new THREE.Group(); scene.add(W);
  const R = { group: W };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat('#2a2d35', { roughness: 0.9 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; W.add(ground);
  const ct = cobbleTex(); ct.repeat.set(2.5, 32);
  R.streetMat = new THREE.MeshPhysicalMaterial({ map: ct, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const street = plane(W, 10, 130, R.streetMat, 0, 0.02, -35); street.rotation.x = -Math.PI / 2; street.receiveShadow = true;
  R.winMat = mat('#1d2230', { emissive: '#ffcf8a', emissiveIntensity: 0.1, roughness: 0.2 });
  R.mirrorMat = new THREE.MeshStandardMaterial({ color: '#cfd8e8', metalness: 1, roughness: 0.04, envMapIntensity: 1.4 });
  R.shopGlass = new THREE.MeshPhysicalMaterial({ color: '#9fb6d8', transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0.2, clearcoat: 1, depthWrite: false });
  R.vitrines = []; R.mirrors = [];
  let k = 0;
  for (let z = 22; z >= -66; z -= 11) {
    for (const side of [-1, 1]) {
      const i = k++; const h = 11 + hash(i) * 8, w = 10.4, d = 9;
      const g = new THREE.Group(); g.position.set(side * 10.5, 0, z); W.add(g);
      const ft = facadeTex(205 + hash(i + 3) * 40); ft.repeat.set(2, h / 8);
      box(g, d, h, w, new THREE.MeshStandardMaterial({ map: ft, roughness: 0.85 }), 0, h / 2, 0);
      box(g, d + 0.6, 0.6, w + 0.6, '#2b2e38', 0, h + 0.3, 0);
      prism(g, d + 0.8, 2.4, w + 0.8, '#262a36', 0, h + 0.6, 0);
      const fx = -side * (d / 2 + 0.02);
      for (let y = 6; y < h - 1.5; y += 3.2) for (const dz of [-3.2, 0, 3.2]) {
        box(g, 0.1, 1.7, 1.3, R.winMat, fx, y, dz, false);
        box(g, 0.2, 0.15, 1.6, '#c9ccd6', fx - side * 0.05, y - 0.95, dz, false);
      }
      // rez-de-chaussée : vitrine (côté rue) ou grand miroir mural
      if (i % 3 !== 2) {
        const v = new THREE.Group(); v.position.set(fx - side * 0.75, 0, -1.2); W.add(v); v.position.add(g.position);
        box(v, 1.5, 0.5, 5.4, '#3a2f2a', 0, 0.25, 0);
        box(v, 1.5, 0.35, 5.6, '#3a2f2a', 0, 3.75, 0);
        box(v, 0.1, 3.1, 5.2, mat('#121620', { emissive: '#ffb86b', emissiveIntensity: 0.08 }), side * 0.7, 2.05, 0, false);
        box(v, 1.4, 3.1, 0.1, '#2a2622', 0, 2.05, 2.6, false); box(v, 1.4, 3.1, 0.1, '#2a2622', 0, 2.05, -2.6, false);
        const vl = new THREE.PointLight('#cfd8ff', 4, 4, 1.6); vl.position.set(0, 3.3, 0); v.add(vl);
        const gl = box(v, 0.05, 3.2, 5.3, R.shopGlass, -side * 0.75, 2.05, 0, false);
        const sign = canvasTex(512, 96, (ctx, w2, h2) => { ctx.fillStyle = '#1b1d26'; ctx.fillRect(0, 0, w2, h2); ctx.fillStyle = '#e8dcc0'; ctx.font = `56px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['BOULANGERIE', 'HORLOGER', 'LIBRAIRIE', 'MERCERIE', 'OPTICIEN', 'CAFÉ'][i % 6], w2 / 2, h2 / 2 + 4); });
        const sp = plane(v, 5, 0.9, new THREE.MeshStandardMaterial({ map: sign }), -side * 0.77, 4.4, 0); sp.rotation.y = -side * Math.PI / 2;
        R.vitrines.push({ g: v, side, glass: gl, pos: v.position.clone(), x: v.position.x - side * 0.7, z: v.position.z });
      } else {
        const m = new THREE.Group(); m.position.set(fx - side * 0.08, 0, 0); m.position.add(g.position); W.add(m);
        box(m, 0.25, 5.2, 2.8, '#b08d57', 0, 3.0, 0);
        const mm = box(m, 0.06, 4.8, 2.4, R.mirrorMat, -side * 0.14, 3.0, 0, false);
        R.mirrors.push({ g: m, side, x: m.position.x - side * 0.2, z: m.position.z });
      }
    }
  }
  // lampadaires
  R.lamps = [];
  for (let z = 18; z >= -64; z -= 14) for (const s of [-1, 1]) {
    box(W, 0.22, 5.2, 0.22, '#1d1f27', s * 4.7, 2.6, z + (s > 0 ? 7 : 0));
    const l = box(W, 0.6, 0.6, 0.6, glow('#cfe0ff', 0.2), s * 4.7, 5.4, z + (s > 0 ? 7 : 0), false); R.lamps.push(l);
  }
  // la tour de verre
  const T = new THREE.Group(); T.position.copy(TOWER); W.add(T); R.tower = T;
  const grid = canvasTex(256, 1024, (ctx, w, h) => { ctx.fillStyle = '#0a1426'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = 'rgba(160,200,255,.55)'; ctx.lineWidth = 3; for (let x = 0; x <= w; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y <= h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } for (let k2 = 0; k2 < 120; k2++) { ctx.fillStyle = `rgba(200,225,255,${0.3 + hash(k2) * 0.6})`; ctx.fillRect(Math.floor(hash(k2 + 1) * 8) * 32 + 3, Math.floor(hash(k2 + 2) * 42) * 24 + 3, 26, 18); } });
  grid.wrapS = grid.wrapT = THREE.RepeatWrapping; grid.repeat.set(2, 3);
  R.towerMat = new THREE.MeshPhysicalMaterial({ color: '#8fb0de', metalness: 0.75, roughness: 0.06, clearcoat: 1, emissive: '#ffffff', emissiveMap: grid, emissiveIntensity: 0.25 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 150, 8, 1), R.towerMat); shaft.position.y = 75; shaft.rotation.y = Math.PI / 8; shaft.castShadow = true; T.add(shaft);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(9.5, 26, 8), R.towerMat); crown.position.y = 163; crown.rotation.y = Math.PI / 8; T.add(crown);
  R.beacon = box(T, 2, 2, 2, glow('#ff3b4e', 1.5), 0, 177, 0, false);
  for (const y of [30, 60, 90, 120]) { const r = new THREE.Mesh(new THREE.TorusGeometry(11.2 - y * 0.02, 0.5, 6, 8), mat('#c9d4e8', { metalness: 0.9, roughness: 0.2 })); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 8; r.position.y = y; T.add(r); }
  // mécanismes (engrenages géants sur la face avant)
  R.gears = [];
  const gearM = mat('#a9b4c8', { metalness: 0.9, roughness: 0.3, emissive: '#3a4c88', emissiveIntensity: 0.2 });
  for (const [x, y, r] of [[-4, 22, 6], [5, 34, 4.5], [-2, 48, 5], [4, 62, 3.6]]) {
    const g = new THREE.Group(); g.position.set(x, y, 11.6); T.add(g);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.16, 6, 24), gearM); g.add(ring);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const tooth = box(g, r * 0.3, r * 0.3, 0.8, gearM, Math.cos(a) * r * 1.12, Math.sin(a) * r * 1.12, 0, false); tooth.rotation.z = a; }
    for (let i = 0; i < 3; i++) box(g, r * 2, 0.5, 0.5, gearM, 0, 0, 0, false).rotation.z = i * Math.PI / 3;
    g.r = r; R.gears.push(g);
  }
  // collines / immeubles lointains
  for (let i = 0; i < 40; i++) { const a = hash(i) * Math.PI * 2, r = 120 + hash(i + 1) * 80; const h = 20 + hash(i + 2) * 40; box(W, 14, h, 14, '#1e2230', Math.cos(a) * r, h / 2, Math.sin(a) * r - 40); }
  // étoiles, lune
  const ST = 1600; const sp = new Float32Array(ST * 3);
  for (let i = 0; i < ST; i++) { const th = hash(i) * Math.PI * 2, ph = 0.05 + hash(i + 7) * 1.4, r = 900; sp[i * 3] = Math.cos(th) * Math.cos(ph) * r; sp[i * 3 + 1] = Math.sin(ph) * r; sp[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r; }
  const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  R.stars = new THREE.Points(stg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); W.add(R.stars);
  R.moon = new THREE.Mesh(new THREE.SphereGeometry(26, 16, 12), new THREE.MeshBasicMaterial({ color: '#e8f0ff', fog: false })); R.moon.position.set(-220, 330, -620); W.add(R.moon);
  // colis
  R.parcel = new THREE.Group(); box(R.parcel, 0.7, 0.5, 0.5, '#b08850', 0, 0, 0); box(R.parcel, 0.72, 0.08, 0.52, '#e0c080', 0, 0.05, 0, false); W.add(R.parcel);
  // éclats de verre (particules)
  const N = 300; const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  R.shards = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#e6f0ff', size: 0.12, transparent: true, opacity: 0.9, depthWrite: false })); R.shards.frustumCulled = false; W.add(R.shards);
  return R;
}

// ---------------- couloir au miroir ----------------
export function makeCorridor(scene) {
  const G = new THREE.Group(); G.position.set(200, 0, 0); scene.add(G);
  const build = (parent) => {
    const wp = canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = '#20343a'; ctx.fillRect(0, 0, w, w); ctx.fillStyle = 'rgba(200,220,210,.08)'; for (let y = 0; y < w; y += 32) for (let x = (y / 32 % 2) * 16; x < w; x += 32) { ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); } });
    wp.wrapS = wp.wrapT = THREE.RepeatWrapping; wp.repeat.set(3, 1.5);
    const wm = new THREE.MeshStandardMaterial({ map: wp, roughness: 0.9 });
    const fl = canvasTex(256, 256, (ctx, w) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#4a3426' : '#56402f'; ctx.fillRect(i * 32, 0, 32, w); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(i * 32, 0, 2, w); } });
    fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(1, 3);
    const f = plane(parent, 4, 10, new THREE.MeshStandardMaterial({ map: fl, roughness: 0.6 }), 0, 0.01, 5); f.rotation.x = -Math.PI / 2; f.receiveShadow = true;
    box(parent, 0.3, 4.2, 10, wm, -2.15, 2.1, 5); box(parent, 0.3, 4.2, 10, wm, 2.15, 2.1, 5);
    box(parent, 4.6, 0.3, 10, '#1a2226', 0, 4.35, 5);
    box(parent, 0.35, 0.9, 10, '#3a2a20', -1.95, 0.45, 5); box(parent, 0.35, 0.9, 10, '#3a2a20', 1.95, 0.45, 5);
    for (const z of [3, 7]) { box(parent, 0.12, 1.4, 1.0, '#c9a227', -1.98, 2.6, z, false); box(parent, 0.06, 1.2, 0.8, mat('#2a3a4a', { emissive: '#ffcf8a', emissiveIntensity: 0.25 }), -1.92, 2.6, z, false); }
    box(parent, 0.9, 0.12, 0.9, glow('#ffd9a0', 1.4), 0, 4.15, 5, false);
    box(parent, 0.6, 2.4, 1.2, '#4a3426', 1.98, 1.2, 8.2); // porte
    box(parent, 1.2, 0.9, 0.5, '#3a2a20', -1.5, 0.45, 2.0); // console
    box(parent, 0.25, 0.4, 0.25, '#c9d4e8', -1.5, 1.1, 2.0);
  };
  const real = new THREE.Group(); G.add(real); build(real);
  const mirrored = new THREE.Group(); mirrored.scale.z = -1; G.add(mirrored); build(mirrored); // le monde « dans » le miroir
  G.mirrored = mirrored;
  // cadre du miroir (plan z = 0)
  box(G, 2.4, 0.25, 0.25, '#b08d57', 0, 3.6, 0.05); box(G, 2.4, 0.25, 0.25, '#b08d57', 0, 0.55, 0.05);
  box(G, 0.25, 3.3, 0.25, '#b08d57', -1.2, 2.08, 0.05); box(G, 0.25, 3.3, 0.25, '#b08d57', 1.2, 2.08, 0.05);
  // murs autour du cadre (cachent le couloir miroir hors du cadre)
  box(G, 0.95, 4.2, 0.2, '#20343a', -1.78, 2.1, 0.0); box(G, 0.95, 4.2, 0.2, '#20343a', 1.78, 2.1, 0.0);
  box(G, 2.2, 0.55, 0.2, '#20343a', 0, 0.28, 0.0); box(G, 2.2, 0.65, 0.2, '#20343a', 0, 3.95, 0.0);
  // vitre teintée (le « verre » du miroir), fissures
  G.glassMat = new THREE.MeshPhysicalMaterial({ color: '#c8d8f0', transparent: true, opacity: 0.16, roughness: 0.02, metalness: 0.4, clearcoat: 1, depthWrite: false });
  G.glass = plane(G, 2.2, 3.05, G.glassMat, 0, 2.08, 0.02);
  G.crackTex = canvasTex(512, 720, (ctx, w, h) => drawCracks(ctx, w, h, 0));
  G.cracks = plane(G, 2.2, 3.05, new THREE.MeshBasicMaterial({ map: G.crackTex, transparent: true, depthWrite: false }), 0, 2.08, 0.03);
  G.light = new THREE.PointLight('#ffd9a0', 18, 14, 1.6); G.light.position.set(0, 3.8, 5); G.add(G.light);
  G.lightR = new THREE.PointLight('#9fb6ff', 10, 14, 1.6); G.lightR.position.set(0, 3.8, -5); G.add(G.lightR);
  return G;
}
export function drawCracks(ctx, w, h, k) {
  ctx.clearRect(0, 0, w, h); if (k <= 0) return;
  ctx.strokeStyle = 'rgba(235,245,255,.9)'; ctx.lineWidth = 2.5; ctx.shadowColor = '#aac8ff'; ctx.shadowBlur = 6;
  const cx = w * 0.55, cy = h * 0.32;
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2 + hash(i) * 0.3; let x = cx, y = cy; ctx.beginPath(); ctx.moveTo(x, y);
    const L = (120 + hash(i + 2) * 300) * k;
    for (let s = 0; s < 6; s++) { x += Math.cos(a + (hash(i * 7 + s) - 0.5) * 0.6) * L / 6; y += Math.sin(a + (hash(i * 5 + s) - 0.5) * 0.6) * L / 6; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 18 * k, 0, 7); ctx.stroke();
}

// ---------------- salle de la tour ----------------
export const CARDS = [['BOULANGER', 'PERDU'], ['GARDIEN DE NUIT', 'PERDU'], ['MAYA', 'ISOLÉE'], ['M. ARNAUD', 'PERDU'], ['LÉNA', 'SOUS CONTRÔLE'], ['SACHA', 'REMPLACÉ']];
export function drawCard(ctx, w, h, name, state, hot) {
  ctx.fillStyle = '#081222'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(140,190,255,.07)'; for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.fillStyle = 'rgba(170,200,255,.25)'; ctx.fillRect(18, 18, 90, 110);
  ctx.fillStyle = '#c6d2ff'; ctx.beginPath(); ctx.arc(63, 58, 22, 0, 7); ctx.fill(); ctx.fillRect(38, 84, 50, 34);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? '#ffd23f' : '#e6eeff'; ctx.font = `900 ${name.length > 12 ? 34 : 44}px "Montserrat", sans-serif`; ctx.fillText(name, 128, 52);
  ctx.fillStyle = state === 'ISOLÉE' ? '#ff9f43' : state === 'PERDU' ? '#ff5a6e' : state === 'REMPLACÉ' ? '#8fa8ff' : '#7fe7ff'; ctx.font = `800 32px "Montserrat", sans-serif`; ctx.fillText(state, 128, 102);
  ctx.strokeStyle = hot ? '#ffd23f' : 'rgba(140,190,255,.5)'; ctx.lineWidth = hot ? 10 : 4; ctx.strokeRect(4, 4, w - 8, h - 8);
}
export function drawBig(ctx, w, h, hot) {
  ctx.fillStyle = '#2a0008'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,60,60,.08)'; for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? '#ffffff' : '#ff3b4e'; ctx.font = `900 120px "Montserrat", sans-serif`; ctx.fillText('SOREN', w / 2, h * 0.33);
  ctx.fillStyle = hot ? '#ffd23f' : '#ff8a96'; ctx.font = `900 56px "Montserrat", sans-serif`; ctx.fillText('REFLET DE REMPLACEMENT', w / 2, h * 0.72);
  ctx.strokeStyle = hot ? '#ffd23f' : '#ff3b4e'; ctx.lineWidth = 14; ctx.strokeRect(8, 8, w - 16, h - 16);
}
export function makeTowerRoom(scene) {
  const G = new THREE.Group(); G.position.set(400, 0, 0); scene.add(G);
  const I = { group: G };
  const fl = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), new THREE.MeshPhysicalMaterial({ color: '#0e1422', metalness: 0.6, roughness: 0.15, clearcoat: 1 })); fl.position.y = -0.2; fl.receiveShadow = true; G.add(fl);
  for (let i = -6; i <= 6; i += 2) { box(G, 0.04, 0.02, 14, glow('#3f6ad8', 0.6), i, 0.01, 0, false); box(G, 14, 0.02, 0.04, glow('#3f6ad8', 0.6), 0, 0.01, i, false); }
  // parois de verre (laissent voir le vide et les doubles)
  I.glassMat = new THREE.MeshPhysicalMaterial({ color: '#7f9cd8', transparent: true, opacity: 0.14, roughness: 0.03, metalness: 0.3, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
  for (const [x, z, ry] of [[-7, 0, Math.PI / 2], [7, 0, -Math.PI / 2], [0, 7, Math.PI]]) { const p = plane(G, 14, 9, I.glassMat, x, 4.5, z); p.rotation.y = ry; }
  const frame = mat('#c9d4e8', { metalness: 0.9, roughness: 0.25 });
  for (const x of [-7, 7]) for (const z of [-7, 7]) box(G, 0.35, 9, 0.35, frame, x, 4.5, z);
  for (const y of [0.1, 9]) { box(G, 14.3, 0.3, 0.3, frame, 0, y, 7); box(G, 14.3, 0.3, 0.3, frame, 0, y, -7); box(G, 0.3, 0.3, 14.3, frame, 7, y, 0); box(G, 0.3, 0.3, 14.3, frame, -7, y, 0); }
  box(G, 14.3, 0.4, 14.3, '#0b0f1a', 0, 9.2, 0);
  // mur d'écrans (fond, z = -7)
  box(G, 14, 9, 0.3, '#070a12', 0, 4.5, -7.15);
  I.cards = [];
  CARDS.forEach(([name, state], k) => {
    const col = k % 3, row = Math.floor(k / 3);
    const tex = canvasTex(512, 150, (c, w, h) => drawCard(c, w, h, name, state, false));
    const p = plane(G, 3.6, 1.05, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), (col - 1) * 4.1, row === 0 ? 4.0 : 2.6, -6.98);
    I.cards.push({ tex, name, state, mesh: p, hot: null });
  });
  I.bigTex = canvasTex(1024, 300, (c, w, h) => drawBig(c, w, h, false));
  I.big = plane(G, 9, 2.6, new THREE.MeshBasicMaterial({ map: I.bigTex, toneMapped: false }), 0, 6.6, -6.97);
  // console à leviers
  const con = new THREE.Group(); con.position.set(0, 0, -3.5); G.add(con); I.console = con;
  box(con, 5, 1.2, 1.4, '#151a28', 0, 0.6, 0); box(con, 5.2, 0.15, 1.6, '#c9d4e8', 0, 1.25, 0);
  I.levers = [];
  for (let k = 0; k < 3; k++) { const l = new THREE.Group(); l.position.set(-1.5 + k * 1.5, 1.3, 0.2); con.add(l); box(l, 0.12, 1.1, 0.12, '#c9d4e8', 0, 0.55, 0); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), glow(k === 1 ? '#ff3b4e' : '#5fa8ff', 1.5)); knob.position.y = 1.15; l.add(knob); l.rotation.x = -0.5; I.levers.push(l); }
  // porte verrouillable (paroi avant, z = +7)
  I.door = new THREE.Group(); I.door.position.set(0, 0, 6.85); G.add(I.door);
  box(I.door, 2.6, 4.2, 0.3, mat('#2a3348', { metalness: 0.8, roughness: 0.3 }), 0, 2.1, 0);
  I.bolt = box(I.door, 0.9, 0.22, 0.22, '#c9d4e8', 1.6, 2.1, -0.25);
  I.lockLight = box(I.door, 0.3, 0.3, 0.1, glow('#3dff8a', 1.5), 0, 4.0, -0.2, false); I.lockLight.material = I.lockLight.material.clone();
  // chaînes qui suspendent la salle
  for (const x of [-6, 6]) for (const z of [-6, 6]) for (let k = 0; k < 18; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 5, 10), mat('#8a93a8', { metalness: 0.9, roughness: 0.3 })); c.position.set(x, 9.6 + k * 0.5, z); c.rotation.y = k % 2 ? Math.PI / 2 : 0; G.add(c); }
  // lumières
  I.lights = [];
  const l1 = new THREE.PointLight('#9fb6ff', 50, 30, 1.5); l1.position.set(0, 8, 0); G.add(l1); I.lights.push(l1);
  const l2 = new THREE.PointLight('#ff3b4e', 20, 20, 1.6); l2.position.set(0, 6, -5); G.add(l2); I.lights.push(l2);
  I.phone = new THREE.Group(); box(I.phone, 0.32, 0.6, 0.06, '#111', 0, 0, 0, false); I.phoneScreen = box(I.phone, 0.27, 0.5, 0.01, glow('#9ad1ff', 1.2), 0, 0, 0.035, false); I.phone.visible = false; scene.add(I.phone);
  return I;
}
