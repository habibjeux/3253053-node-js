// Décors : ville côtière, port, falaise et phare, salle de contrôle, studio de M. Vane.
import * as THREE from 'three';
import { box, mat, glow, prism, plane, canvasTex, signTex, redraw, Character, FONT, hash, V3 } from './lib.js';

export const frac = (x) => x - Math.floor(x);

// ---------------- Personnages ----------------
export function makeCast() {
  const C = {};
  C.leo = new Character({ skin: '#ffcf9e', shirt: '#ff7a1a', pants: '#2f5fbf', shoes: '#f4f4f4', hat: 'cap', hatColor: '#2fa84f', visorColor: '#ffd23f', badge: '#ffd23f', hair: '#5a3a1f', scale: 0.85, freckles: true });
  C.mila = new Character({ skin: '#f1c27d', shirt: '#2ec4b6', pants: '#e76f51', shoes: '#ffffff', hair: '#6b3a1f', pigtails: true, backpack: '#ffd23f', scale: 0.66 });
  C.vane = new Character({ skin: '#f0d0b0', shirt: '#7d8597', sleeve: '#7d8597', pants: '#5c677d', shoes: '#111', hat: 'tophat', hatColor: '#1d1b2a', bandColor: '#5c677d', hair: '#3b3b3b', sideHair: true, glasses: true, tie: '#1d1b2a', scale: 1.12 });
  C.pecheur = new Character({ skin: '#e0ac7e', shirt: '#ffd000', sleeve: '#ffd000', pants: '#ffd000', shoes: '#1d3557', hat: 'souwester', hatColor: '#ffd000', mustache: '#ddd', scale: 1.05, slippers: '#fbe4ff' });
  C.livreur = new Character({ skin: '#c68642', shirt: '#e63946', pants: '#1d3557', hat: 'helmet', hatColor: '#06d6a0', scale: 1.0 });
  C.p1 = new Character({ skin: '#ffdbac', shirt: '#9b5de5', pants: '#3a3a5a', hair: '#f4d35e', sideHair: true });
  C.p2 = new Character({ skin: '#8d5524', shirt: '#00bbf9', pants: '#264653', hat: 'cap', hatColor: '#f15bb5', scale: 0.95 });
  C.p3 = new Character({ skin: '#f1c27d', shirt: '#80b918', pants: '#5e548e', hair: '#222', scale: 1.02 });
  C.p4 = new Character({ skin: '#ffe0bd', shirt: '#ff006e', pants: '#3a86ff', hat: 'beanie', hatColor: '#ffbe0b', bandColor: '#fb5607', pompom: '#fff', scale: 0.98 });
  // habitants en chaussons épais
  C.boul = new Character({ skin: '#ffd2a8', shirt: '#ff9f1c', pants: '#6d3b1f', hat: 'chef', apron: '#ffffff', hair: '#b5652b' });
  C.s1 = new Character({ skin: '#ffd2a8', shirt: '#f77f00', pants: '#003049', hair: '#9c6644', slippers: '#ffc8dd' });
  C.s2 = new Character({ skin: '#a0673d', shirt: '#4361ee', pants: '#2b2d42', hat: 'beanie', hatColor: '#e63946', bandColor: '#9d0208', pompom: '#fff', slippers: '#caffbf', scale: 0.96 });
  return C;
}

// ---------------- Ciel ----------------
export function skyTex(top, bottom) {
  return canvasTex(64, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
}

// ---------------- Panneaux LED ----------------
export function drawBoard(ctx, w, h, { db = 0, alert = 0, line2 = 'AMENDE : 15 €' } = {}) {
  ctx.fillStyle = '#07090f'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x < w; x += 8) ctx.fillRect(x, 0, 2, h); for (let y = 0; y < h; y += 8) ctx.fillRect(0, y, w, 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `86px ${FONT}`; ctx.fillStyle = alert ? '#ffffff' : '#ffb703';
  ctx.fillText('BRUIT AUTORISÉ : 0 dB', w / 2, h * 0.22);
  ctx.font = `120px ${FONT}`; ctx.fillStyle = alert ? '#ff2e4d' : '#ff4d4d';
  ctx.fillText(line2, w / 2, h * 0.55);
  // vumètre
  const n = 20; const lit = Math.round(db * n);
  for (let i = 0; i < n; i++) { ctx.fillStyle = i < lit ? (i > 14 ? '#ff2e4d' : i > 9 ? '#ffd23f' : '#38d26b') : '#1b2230'; ctx.fillRect(60 + i * ((w - 120) / n), h * 0.8, (w - 120) / n - 8, h * 0.12); }
  ctx.strokeStyle = alert ? '#ff2e4d' : '#ffb703'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14);
}
export function drawCounter(ctx, w, h, text, on) {
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(h * 0.62)}px ${FONT}`; ctx.fillStyle = on ? '#ff2e4d' : '#3a1016';
  ctx.fillText(text, w / 2, h / 2 + 6);
}

// ---------------- Ville ----------------
export const LH = V3(32, 14, 11); // pied du phare (sommet de la falaise)
export const LANTERN = V3(32, 41.5, 11);

export function makeTown(scene) {
  const W = new THREE.Group(); scene.add(W);
  const R = { group: W };
  // mer
  R.seaMat = new THREE.MeshPhysicalMaterial({ color: '#1593d6', roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1 });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), R.seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.y = -1.2; sea.receiveShadow = true; W.add(sea);
  R.foam = [];
  for (let k = 0; k < 120; k++) { const f = box(W, 1.5 + hash(k) * 3, 0.05, 0.25, glow('#e8f7ff', 0.2), 0, -1.15, 0, false); f.userData = { x: -60 + hash(k + 1) * 220, z: 20 + hash(k + 2) * 160, ph: hash(k + 3) }; R.foam.push(f); }
  // terre ferme + quai
  box(W, 124, 3, 116, '#d8c7a5', -40, -1.5, -40);
  const cob = canvasTex(512, 512, (ctx, w) => {
    ctx.fillStyle = '#b9a68a'; ctx.fillRect(0, 0, w, w);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const j = hash(x * 31 + y * 7); ctx.fillStyle = `hsl(${32 + j * 10},${22 + j * 15}%,${62 + j * 12}%)`; ctx.beginPath(); ctx.roundRect(x * 32 + (y % 2) * 16 + 2, y * 32 + 2, 28, 28, 7); ctx.fill(); }
  });
  cob.wrapS = cob.wrapT = THREE.RepeatWrapping; cob.repeat.set(10, 9);
  const plaza = plane(W, 80, 70, new THREE.MeshStandardMaterial({ map: cob, roughness: 0.9 }), -10, 0.02, -12);
  plaza.rotation.x = -Math.PI / 2; plaza.receiveShadow = true;
  box(W, 124, 0.6, 1.2, '#8a7a66', -40, 0.3, 17.6); // bord du quai
  for (let x = -60; x < 22; x += 4) box(W, 0.5, 0.9, 0.5, '#3d405b', x, 0.45, 17.2); // bittes
  // pontons + bateaux
  R.boats = [];
  for (const [x, len] of [[-14, 18], [-2, 14], [8, 12]]) {
    box(W, 2.6, 0.3, len, '#9c6644', x, -0.2, 18 + len / 2);
    for (let z = 19; z < 18 + len; z += 3) { box(W, 0.35, 2.4, 0.35, '#6b4226', x - 1.2, -1.2, z); box(W, 0.35, 2.4, 0.35, '#6b4226', x + 1.2, -1.2, z); }
  }
  const boat = (x, z, col, rot) => {
    const g = new THREE.Group(); g.position.set(x, -1.0, z); g.rotation.y = rot; W.add(g);
    box(g, 2.6, 1.2, 6, col, 0, 0.3, 0);
    box(g, 1.85, 1.2, 1.85, col, 0, 0.3, 3).rotation.y = Math.PI / 4;
    box(g, 2.8, 0.25, 6.2, '#ffffff', 0, 0.95, 0);
    box(g, 1.8, 1.4, 2, '#f1faee', 0, 1.7, -0.8);
    box(g, 1.9, 0.2, 2.1, '#e63946', 0, 2.5, -0.8);
    box(g, 0.15, 5, 0.15, '#6b4226', 0, 3.3, 1.2);
    R.boats.push(g); return g;
  };
  boat(-10, 24, '#e63946', 0.1); boat(2.5, 22, '#3a86ff', -0.15); boat(12, 26, '#ffbe0b', 0.2); boat(-20, 30, '#2a9d8f', 0.4);
  // maisons
  const cols = ['#ff6b6b', '#ffd166', '#06d6a0', '#4cc9f0', '#f78c6b', '#c77dff', '#ff9f1c', '#2ec4b6', '#f15bb5', '#90be6d'];
  R.winMat = mat('#2b3a55', { emissive: '#ffcf6e', emissiveIntensity: 0.05, roughness: 0.3 });
  let hi = 0;
  const house = (x, z, rotY, opts = {}) => {
    const i = hi++;
    const w = opts.w || 6 + hash(i) * 2, d = 6, h = opts.h || 5 + hash(i + 3) * 4;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; W.add(g);
    box(g, w, h, d, cols[i % cols.length], 0, h / 2, 0);
    if (hash(i + 5) > 0.45) prism(g, w + 0.8, 2.2, d + 0.6, '#c8553d', 0, h, 0).rotation.set(-Math.PI / 2, 0, 0);
    else { box(g, w + 0.3, 0.4, d + 0.3, '#f4f1de', 0, h + 0.2, 0); }
    // façade côté +z local
    box(g, 1.2, 2.1, 0.1, '#5a3a22', 0, 1.05, d / 2 + 0.03, false);
    const shutter = ['#264653', '#2a9d8f', '#e76f51', '#3a86ff'][i % 4];
    for (const dx of [-w / 3, w / 3]) for (const y of h > 7 ? [2.2, 5.2] : [2.4]) {
      if (Math.abs(dx) < 0.8 && y < 3) continue;
      box(g, 1.0, 1.2, 0.1, R.winMat, dx, y, d / 2 + 0.03, false);
      box(g, 0.35, 1.3, 0.12, shutter, dx - 0.7, y, d / 2 + 0.05, false); box(g, 0.35, 1.3, 0.12, shutter, dx + 0.7, y, d / 2 + 0.05, false);
    }
    if (hash(i + 9) > 0.5) box(g, w * 0.8, 0.12, 1.4, ['#ff595e', '#1982c4', '#8ac926'][i % 3], 0, 3.0, d / 2 + 0.7, false); // auvent
    return g;
  };
  for (let x = -38; x <= 14; x += 7.5) house(x, -24, 0);               // rangée nord (face +z)
  for (let z = -15; z <= 9; z += 7.2) house(-26, z, Math.PI / 2);      // rangée ouest (face +x)
  for (let z = -16; z <= -3; z += 7) house(16, z, -Math.PI / 2);      // rangée est (face -x)
  for (let x = -46; x <= -34; x += 7) house(x, 6, Math.PI / 2, { h: 6 });
  for (let x = -60; x < -40; x += 7.5) house(x, -24, 0);
  const bk = signTex('BOULANGERIE', { bg: '#7b3f00', fg: '#ffe8b0', border: '#ffd23f', size: 62, w: 512, h: 120 });
  plane(W, 5, 1.2, new THREE.MeshStandardMaterial({ map: bk }), -8, 4.3, -20.85);
  // panneau géant sur la place
  R.boardTex = canvasTex(1024, 512, (ctx, w, h) => drawBoard(ctx, w, h, {}));
  const bd = new THREE.Group(); bd.position.set(0, 0, -11); W.add(bd); R.board = bd;
  box(bd, 0.6, 7, 0.6, '#3d405b', -6, 3.5, 0); box(bd, 0.6, 7, 0.6, '#3d405b', 6, 3.5, 0);
  box(bd, 13.6, 7.2, 0.8, '#1d1b2a', 0, 9.6, -0.1);
  R.boardScreen = plane(bd, 13, 6.5, new THREE.MeshBasicMaterial({ map: R.boardTex }), 0, 9.6, 0.32);
  box(bd, 14, 0.4, 1.0, '#ffb703', 0, 13.3, 0);
  // capteurs / compteurs dans les rues
  R.sensors = [];
  const sensor = (x, z, ry) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; W.add(g);
    box(g, 0.25, 4.2, 0.25, '#3d405b', 0, 2.1, 0);
    box(g, 1.9, 0.9, 0.35, '#1d1b2a', 0, 4.4, 0);
    const tex = canvasTex(256, 112, (ctx, w, h) => drawCounter(ctx, w, h, '15 €', false));
    const p = plane(g, 1.7, 0.72, new THREE.MeshBasicMaterial({ map: tex }), 0, 4.4, 0.18);
    const micro = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 8, 1, true), mat('#adb5bd', { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }));
    micro.rotation.x = Math.PI; micro.position.set(0, 5.2, 0); g.add(micro);
    const led = box(g, 0.25, 0.25, 0.25, glow('#ff2e4d', 0.2), 0, 5.0, 0, false);
    led.material = led.material.clone();
    const s = { g, tex, led, on: null, pos: V3(x, 4.4, z) };
    R.sensors.push(s); return s;
  };
  sensor(-9, 2, 0.3); sensor(8, -3, -0.5); sensor(-15, -8, 0.6); sensor(13, 9, -0.9); sensor(-2, 13, 0); sensor(-30, -12, 0.8); sensor(5, -18, 0.2); sensor(-20, 12, 0.5);
  // lampadaires
  R.lamps = [];
  for (const [x, z] of [[-10, -6], [10, 4], [-4, 10], [18, 8], [-18, 2], [4, -16]]) {
    box(W, 0.25, 4.8, 0.25, '#2b2d42', x, 2.4, z);
    const l = box(W, 0.7, 0.6, 0.7, glow('#ffe29a', 0.3), x, 5.0, z, false); R.lamps.push(l);
  }
  // falaise et phare
  const rock = ['#8d8070', '#7a6e60', '#9b8f7e', '#6f6455'];
  const blocks = [[32, 6, 11, 20, 15, 22], [30, 3, 2, 14, 9, 8], [38, 4, 20, 14, 11, 10], [26, 5, 14, 8, 13, 12], [41, 7, 7, 8, 17, 12], [35, 1, 24, 12, 6, 6], [27, 10.5, 9, 9, 7, 9], [37, 11, 13, 9, 6, 9]];
  blocks.forEach(([x, y, z, w, h, d], k) => box(W, w, h, d, rock[k % 4], x, y - 1.2, z));
  box(W, 20.5, 0.6, 22.5, '#6cbf4a', 32, 13.95, 11);
  R.crater = box(W, 9, 0.3, 9, '#2d2620', 32, 14.15, 11, false); R.crater.visible = false;
  // chemin et rochers sur la plage de la falaise
  for (let k = 0; k < 10; k++) box(W, 1 + hash(k) * 2, 0.8 + hash(k + 1) * 1.5, 1 + hash(k + 2) * 2, rock[k % 4], 21 + hash(k + 3) * 2, 0.3, -2 + k * 2.2);
  R.lighthouse = makeLighthouse(); R.lighthouse.position.copy(LH); W.add(R.lighthouse);
  // faisceau et ondes
  R.beam = new THREE.Mesh(new THREE.ConeGeometry(7, 70, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff2a8', transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  R.beam.geometry.translate(0, -35, 0); R.beamPivot = new THREE.Group(); R.beamPivot.position.copy(LANTERN); R.beamPivot.add(R.beam); R.beam.rotation.x = Math.PI / 2 + 0.25; W.add(R.beamPivot);
  R.rings = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: '#7df9ff', transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 96), ringMat.clone()); r.rotation.x = Math.PI / 2; W.add(r); R.rings.push(r); }
  // vélo
  R.bike = makeBike(); W.add(R.bike);
  // porte-monnaie
  R.purse = new THREE.Group(); W.add(R.purse);
  box(R.purse, 0.6, 0.12, 0.45, '#9d4edd', 0, 0, 0);
  R.purseLid = new THREE.Group(); R.purseLid.position.set(0, 0.06, -0.22); R.purse.add(R.purseLid);
  box(R.purseLid, 0.6, 0.1, 0.45, '#7b2cbf', 0, 0, 0.22);
  // mouettes
  R.gulls = [];
  for (let k = 0; k < 7; k++) { const g = new THREE.Group(); box(g, 0.35, 0.18, 0.7, '#ffffff', 0, 0, 0, false); const wl = box(g, 1.1, 0.06, 0.4, '#e9ecef', -0.6, 0, 0, false); const wr = box(g, 1.1, 0.06, 0.4, '#e9ecef', 0.6, 0, 0, false); g.userData = { wl, wr, k }; W.add(g); R.gulls.push(g); }
  // débris
  R.debris = [];
  for (let k = 0; k < 40; k++) { const d = box(W, 0.6 + hash(k) * 1.4, 0.6 + hash(k + 1) * 1.2, 0.6 + hash(k + 2) * 1.4, rock[k % 4], 0, 0, 0); d.visible = false; R.debris.push(d); }
  // étoiles, lune
  const ST = 1500; const sp = new Float32Array(ST * 3);
  for (let k = 0; k < ST; k++) { const th = hash(k) * Math.PI * 2, ph = 0.04 + hash(k + 7) * 1.4, r = 800; sp[k * 3] = Math.cos(th) * Math.cos(ph) * r; sp[k * 3 + 1] = Math.sin(ph) * r; sp[k * 3 + 2] = Math.sin(th) * Math.cos(ph) * r; }
  const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  R.stars = new THREE.Points(stg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); W.add(R.stars);
  R.moon = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff6d8', fog: false })); R.moon.position.set(300, 220, 520); W.add(R.moon);
  // bulles « chut »
  return R;
}

function makeLighthouse() {
  const g = new THREE.Group();
  g.add(Object.assign(box(null, 9, 1.4, 9, '#6f6455', 0, -0.8, 0), {})); // socle rocheux qui partira avec le phare
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.9, 1.6, 12), mat('#f1faee', { flatShading: true })); base.position.y = 0.8; base.castShadow = base.receiveShadow = true; g.add(base);
  const n = 8, H = 3;
  for (let i = 0; i < n; i++) {
    const r0 = 3.3 - i * 0.11, r1 = 3.3 - (i + 1) * 0.11;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, H, 12), mat(i % 2 ? '#f1faee' : '#d62828', { flatShading: true }));
    seg.position.y = 1.6 + H * i + H / 2; seg.castShadow = seg.receiveShadow = true; g.add(seg);
  }
  const top = 1.6 + n * H; // 25.6
  const gal = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.5, 16), mat('#1d1b2a', { flatShading: true })); gal.position.y = top + 0.25; g.add(gal);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; box(g, 0.1, 1.1, 0.1, '#1d1b2a', Math.cos(a) * 3.45, top + 1.0, Math.sin(a) * 3.45, false); }
  const rail = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.07, 6, 32), mat('#1d1b2a')); rail.rotation.x = Math.PI / 2; rail.position.y = top + 1.55; g.add(rail);
  g.lampMat = mat('#fff3b0', { emissive: '#ffd84a', emissiveIntensity: 0.4, transparent: true, opacity: 0.85, roughness: 0.1 });
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 3, 12), g.lampMat); lan.position.y = top + 2.0; g.add(lan);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box(g, 0.14, 3, 0.14, '#1d1b2a', Math.cos(a) * 1.92, top + 2.0, Math.sin(a) * 1.92, false); }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.2, 12), mat('#d62828', { flatShading: true })); roof.position.y = top + 4.6; roof.castShadow = true; g.add(roof);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat('#1d1b2a')); ball.position.y = top + 5.9; g.add(ball);
  // porte côté ville (-x) et hublots
  box(g, 0.3, 2.6, 1.8, '#5c677d', -3.25, 2.9, 0);
  box(g, 0.35, 0.2, 2.1, '#adb5bd', -3.28, 4.3, 0);
  for (let i = 0; i < 3; i++) { const w = box(g, 0.25, 1.0, 0.7, mat('#2b3a55', { emissive: '#7df9ff', emissiveIntensity: 0.2 }), -3.0 + i * 0.12, 9 + i * 6, 0, false); }
  // réacteurs (allumés au décollage)
  g.jets = [];
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; const j = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#7df9ff', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); j.rotation.x = Math.PI; j.position.set(Math.cos(a) * 3.2, -3.4, Math.sin(a) * 3.2); j.visible = false; g.add(j); g.jets.push(j); }
  return g;
}

function makeBike() {
  const g = new THREE.Group();
  const tm = mat('#1d1b2a', { roughness: 0.5 });
  for (const z of [-0.9, 0.9]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.08, 8, 20), tm); w.rotation.y = Math.PI / 2; w.position.set(0, 0.55, z); w.castShadow = true; g.add(w); }
  box(g, 0.1, 0.1, 1.8, '#06d6a0', 0, 0.9, 0); box(g, 0.1, 0.7, 0.1, '#06d6a0', 0, 0.95, -0.4); box(g, 0.1, 0.8, 0.1, '#06d6a0', 0, 1.0, 0.8);
  box(g, 0.8, 0.08, 0.08, '#1d1b2a', 0, 1.42, 0.8); box(g, 0.35, 0.12, 0.5, '#1d1b2a', 0, 1.32, -0.4);
  const crate = box(g, 0.9, 0.8, 0.8, '#e63946', 0, 1.35, -1.15);
  const t = canvasTex(128, 128, (ctx, w) => { ctx.fillStyle = '#e63946'; ctx.fillRect(0, 0, w, w); ctx.fillStyle = '#fff'; ctx.font = `90px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', 64, 70); });
  for (const s of [-1, 1]) { const p = plane(g, 0.6, 0.6, new THREE.MeshStandardMaterial({ map: t }), s * 0.46, 1.35, -1.15); p.rotation.y = s * Math.PI / 2; }
  g.visible = false;
  return g;
}

// ---------------- Salle de contrôle (dans le phare) ----------------
export const FEES = [['ÉTERNUEMENT', '15 €'], ['PAS LOURD', '15 €'], ['MILA', '90 €'], ['PÊCHEUR', '240 €']];
export function drawFee(ctx, w, h, name, price, hot) {
  ctx.fillStyle = '#06121f'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(80,200,255,.07)'; for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? '#ffd23f' : '#7fe7ff'; ctx.font = `${name.length > 11 ? 52 : 60}px ${FONT}`; ctx.fillText(name, w / 2, h * 0.34);
  ctx.fillStyle = '#ff4d4d'; ctx.font = `110px ${FONT}`; ctx.fillText(price, w / 2, h * 0.72);
  if (hot) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14); }
}
export function drawBig(ctx, w, h, hot) {
  ctx.fillStyle = '#3a0006'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,60,60,.08)'; for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? '#ffffff' : '#ff3b3b'; ctx.font = `150px ${FONT}`; ctx.fillText('LÉO : 420 €', w / 2, h * 0.4);
  ctx.fillStyle = '#ffd23f'; ctx.font = `64px ${FONT}`; ctx.fillText('★ RECORD DE LA SEMAINE ★', w / 2, h * 0.78);
  ctx.strokeStyle = hot ? '#ffd23f' : '#ff3b3b'; ctx.lineWidth = 14; ctx.strokeRect(8, 8, w - 16, h - 16);
}
export function drawSafe(ctx, w, h, text, flash) {
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#38d26b'; ctx.lineWidth = 10; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = flash ? '#ffffff' : '#38d26b'; ctx.font = `${text.length > 9 ? 100 : 120}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 6);
}

export function makeControlRoom(scene, vaneTarget) {
  const G = new THREE.Group(); scene.add(G);
  const I = { group: G };
  const steel = '#2a3140', red = '#c1121f', white = '#f1faee';
  // sol grille
  const ft = canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = '#20252f'; ctx.fillRect(0, 0, w, w); ctx.strokeStyle = '#3a4252'; ctx.lineWidth = 6; for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, w); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * 32); ctx.lineTo(w, i * 32); ctx.stroke(); } });
  ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 4);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(8, 12), new THREE.MeshStandardMaterial({ map: ft, metalness: 0.5, roughness: 0.5 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; G.add(fl);
  // murs en dodécagone, bande rouge et blanche
  const N = 12, Rr = 8;
  for (let k = 0; k < N; k++) {
    const a = k / N * Math.PI * 2, wlen = 2 * Rr * Math.tan(Math.PI / N) + 0.05;
    const g = new THREE.Group(); g.position.set(Math.sin(a) * Rr, 0, Math.cos(a) * Rr); g.rotation.y = a + Math.PI; G.add(g);
    if (k === 0) { // ouverture de la porte (côté +z)
      box(g, wlen, 2.5, 0.3, steel, 0, 7.75, 0); box(g, 0.6, 6.5, 0.3, steel, -wlen / 2 + 0.3, 3.25, 0); box(g, 0.6, 6.5, 0.3, steel, wlen / 2 - 0.3, 3.25, 0);
      continue;
    }
    box(g, wlen, 9, 0.3, steel, 0, 4.5, 0);
    box(g, wlen, 0.6, 0.35, red, 0, 1.2, 0.02, false); box(g, wlen, 0.3, 0.35, white, 0, 1.65, 0.02, false);
    box(g, wlen, 0.5, 0.35, red, 0, 8.6, 0.02, false);
  }
  box(G, 17, 0.4, 17, '#1d222c', 0, 9.2, 0);
  // escalier en colimaçon (décor)
  for (let k = 0; k < 14; k++) { const a = k * 0.5; box(G, 2.2, 0.15, 0.8, '#5c677d', -5.2 + Math.cos(a) * 1.3, 0.4 + k * 0.6, 4.2 + Math.sin(a) * 1.3).rotation.y = -a; }
  box(G, 0.3, 9, 0.3, '#adb5bd', -5.2, 4.5, 4.2);
  // grand écran central (fond, -z)
  I.bigTex = canvasTex(1024, 512, (ctx, w, h) => drawBig(ctx, w, h, false));
  I.bigMat = new THREE.MeshBasicMaterial({ map: I.bigTex });
  I.big = plane(G, 6.6, 3.3, I.bigMat, 0, 5.2, -7.55);
  box(G, 7.1, 3.8, 0.2, '#ffb703', 0, 5.2, -7.68, false);
  I.vaneTarget = vaneTarget;
  // écrans des tarifs (gauche et droite)
  I.fees = [];
  FEES.forEach(([name, price], k) => {
    const side = k < 2 ? -1 : 1, row = k % 2;
    const a = side * (0.62 + row * 0.5);
    const x = Math.sin(a) * 7.5, z = -Math.cos(a) * 7.5;
    const tex = canvasTex(512, 300, (ctx, w, h) => drawFee(ctx, w, h, name, price, false));
    const p = plane(G, 2.9, 1.7, new THREE.MeshBasicMaterial({ map: tex }), x, 4.2 + (row ? 0 : 0.0), z);
    p.lookAt(0, 4.2, 0);
    const fr = box(G, 3.2, 2.0, 0.15, '#111', x * 1.012, 4.2, z * 1.012, false); fr.lookAt(0, 4.2, 0);
    I.fees.push({ tex, name, price, hot: null, mesh: p });
  });
  // générateur de sons : console + égaliseur + pavillon
  const con = new THREE.Group(); con.position.set(-2.6, 0, -3.6); con.rotation.y = 0.35; G.add(con); I.console = con;
  box(con, 4.4, 1.2, 1.6, '#3d405b', 0, 0.6, 0);
  box(con, 4.4, 0.25, 1.8, '#1d1b2a', 0, 1.3, 0.1).rotation.x = -0.25;
  for (let k = 0; k < 10; k++) { const kn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 10), mat(['#ff2e4d', '#ffd23f', '#38d26b'][k % 3])); kn.position.set(-1.8 + k * 0.4, 1.48, 0.3 - (k % 2) * 0.35); con.add(kn); }
  I.eq = [];
  for (let k = 0; k < 12; k++) { const b = box(con, 0.22, 1, 0.12, glow(k > 8 ? '#ff2e4d' : k > 5 ? '#ffd23f' : '#38d26b', 1.2), -1.65 + k * 0.3, 2.2, -0.75, false); I.eq.push(b); }
  box(con, 4.2, 1.8, 0.1, '#111', 0, 2.3, -0.82, false);
  const horn = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.3, 2.2, 16, 1, true), mat('#ffb703', { metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }));
  horn.position.set(-4.6, 4.2, -4.4); horn.rotation.set(0.4, 0, 0.5); G.add(horn); I.horn = horn;
  const sg = signTex('GÉNÉRATEUR DE SONS', { bg: '#1d1b2a', fg: '#7df9ff', border: '#7df9ff', size: 44, w: 640, h: 110 });
  const sgp = plane(con, 3.6, 0.62, new THREE.MeshBasicMaterial({ map: sg }), 0, 3.45, -0.83);
  // tuyau à billets -> coffre blindé
  const tubeM = new THREE.MeshPhysicalMaterial({ color: '#cfefff', transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0, side: THREE.DoubleSide });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 6, 16, 1, true), tubeM); tube.position.set(5.2, 6.0, 1.6); G.add(tube);
  const ring = (y) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.08, 6, 20), mat('#adb5bd', { metalness: 0.8 })); r.rotation.x = Math.PI / 2; r.position.set(5.2, y, 1.6); G.add(r); };
  ring(3.1); ring(6); ring(8.9);
  I.tubeTop = V3(5.2, 8.9, 1.6); I.tubeBottom = V3(5.2, 3.0, 1.6);
  const safe = new THREE.Group(); safe.position.set(5.2, 0, 1.6); safe.rotation.y = -1.87; G.add(safe);
  box(safe, 3.0, 3.0, 2.6, '#6c757d', 0, 1.5, 0); box(safe, 3.1, 0.3, 2.7, '#495057', 0, 3.0, 0);
  const sd = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.2, 20), mat('#adb5bd', { metalness: 0.85, roughness: 0.25 })); sd.rotation.z = Math.PI / 2; sd.rotation.y = Math.PI / 2; sd.position.set(-1.0, 1.5, 0.6); sd.rotation.set(Math.PI / 2, 0, 0); sd.position.set(0, 1.5, 1.35); safe.add(sd);
  I.wheel = new THREE.Group(); I.wheel.position.set(0, 1.5, 1.5); safe.add(I.wheel);
  for (let k = 0; k < 3; k++) box(I.wheel, 1.3, 0.1, 0.1, '#ffd23f', 0, 0, 0, false).rotation.z = k * Math.PI / 3;
  I.safeTex = canvasTex(512, 160, (ctx, w, h) => drawSafe(ctx, w, h, '0 €', false));
  I.safeScreen = plane(safe, 2.4, 0.75, new THREE.MeshBasicMaterial({ map: I.safeTex }), 0, 3.7, 1.0);
  box(safe, 2.6, 0.95, 0.12, '#111', 0, 3.7, 0.93, false);
  // billets (instanced)
  const billT = canvasTex(128, 64, (ctx, w, h) => { ctx.fillStyle = '#8ad29b'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, w - 8, h - 8); ctx.fillStyle = '#2d6a4f'; ctx.font = `40px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('15 €', 64, 36); });
  I.bills = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ map: billT, side: THREE.DoubleSide }), 60);
  I.bills.frustumCulled = false; G.add(I.bills);
  // porte blindée (coulissante) côté +z
  I.door = new THREE.Group(); G.add(I.door);
  const dm = mat('#868e96', { metalness: 0.85, roughness: 0.35 });
  box(I.door, 3.6, 6.3, 0.5, dm, 0, 3.15, 0);
  for (const y of [1.2, 3.15, 5.1]) box(I.door, 3.7, 0.3, 0.6, '#495057', 0, y, 0);
  for (let k = 0; k < 10; k++) box(I.door, 0.14, 0.14, 0.62, '#343a40', -1.5 + (k % 5) * 0.75, k < 5 ? 0.4 : 5.9, 0, false);
  I.doorClosedX = 0; I.doorOpenX = 3.9;
  I.door.position.set(I.doorOpenX, 0, Rr - 0.25);
  box(G, 9, 0.3, 0.5, '#495057', 1.5, 6.5, Rr - 0.25); // rail
  // dehors derrière la porte : nuit
  plane(G, 12, 10, new THREE.MeshBasicMaterial({ color: '#0b1638' }), 0, 4, Rr + 3).rotation.y = Math.PI;
  // lumières
  I.lights = [];
  const l1 = new THREE.PointLight('#9fdcff', 50, 30, 1.5); l1.position.set(0, 8, 0); G.add(l1); I.lights.push(l1);
  const l2 = new THREE.PointLight('#ff5964', 30, 20, 1.6); l2.position.set(0, 5, -5); G.add(l2); I.lights.push(l2);
  const l3 = new THREE.PointLight('#ffd166', 20, 14, 1.6); l3.position.set(4, 4, -1); G.add(l3); I.lights.push(l3);
  // gyrophare rouge
  I.alarm = box(G, 0.6, 0.4, 0.6, glow('#ff2e4d', 0.2), 0, 8.8, 0, false); I.alarm.material = I.alarm.material.clone();
  // téléphone
  I.phone = new THREE.Group();
  box(I.phone, 0.32, 0.6, 0.06, '#111', 0, 0, 0, false);
  I.phoneScreen = box(I.phone, 0.27, 0.5, 0.01, glow('#9ad1ff', 1.2), 0, 0, 0.035, false);
  I.phone.visible = false; scene.add(I.phone);
  return I;
}

// ---------------- Studio de M. Vane (rendu dans l'écran) ----------------
export function makeStudio(scene, vane) {
  const S = new THREE.Group(); S.position.set(500, 0, 0); scene.add(S);
  const bg = canvasTex(512, 512, (ctx, w) => { const g = ctx.createRadialGradient(w / 2, w / 2, 20, w / 2, w / 2, w / 1.2); g.addColorStop(0, '#3c2a5e'); g.addColorStop(1, '#0d0718'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, w); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.font = `300px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('V', w / 2, w / 2 + 20); });
  plane(S, 12, 8, new THREE.MeshBasicMaterial({ map: bg }), 0, 3.5, -3);
  box(S, 5, 1.1, 1.6, '#1d1b2a', 0, 0.55, 0.8);
  const cam = new THREE.PerspectiveCamera(32, 2, 0.1, 50);
  cam.position.set(500, 2.9, 6.4); cam.lookAt(500, 2.75, 0);
  const key = new THREE.SpotLight('#ffffff', 80, 20, 0.7, 0.5); key.position.set(3, 6, 5); key.target.position.set(500, 2.5, 0); S.add(key); scene.add(key.target);
  const rim = new THREE.PointLight('#b388ff', 25, 10); rim.position.set(-2, 4, -1.5); S.add(rim);
  return { group: S, cam };
}
