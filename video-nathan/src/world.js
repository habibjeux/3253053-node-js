// Décors : vallée enneigée, village, téléphérique, intérieur de la cabine de Gaspard.
import * as THREE from 'three';
import { box, mat, glow, pine, prism, plane, canvasTex, signTex, redraw, Character, FONT, hash, V3 } from './lib.js';

// ---------------- Personnages ----------------
export function makeCast() {
  const C = {};
  C.nathan = new Character({ skin: '#ffcf9e', shirt: '#2f6fe4', pants: '#d62828', shoes: '#16161d', hat: 'beanie', hatColor: '#ffd23f', bandColor: '#e63946', pompom: '#e63946', scale: 0.85, freckles: true, stripe: null });
  C.zoe = new Character({ skin: '#ffd9b3', shirt: '#ff6fae', pants: '#7b4fd6', shoes: '#fff', hat: 'beanie', hatColor: '#ffffff', bandColor: '#f3f3f3', pompom: '#ff4fa0', hair: '#6b3a1f', pigtails: true, scale: 0.66 });
  C.gaspard = new Character({ skin: '#f2c9a0', shirt: '#2b1d3f', sleeve: '#2b1d3f', pants: '#1c1428', shoes: '#0d0a12', hat: 'tophat', hatColor: '#efe6d2', bandColor: '#7b2cbf', hair: '#e8e4dc', sideHair: true, mustache: '#f2efe8', monocle: true, tie: '#d62828', scale: 1.12 });
  C.facteur = new Character({ skin: '#e0ac7e', shirt: '#2a5bd7', pants: '#1f3f99', hat: 'cap', hatColor: '#1f3f99', bag: '#ffc300', mustache: '#4a2c1a', scale: 1.05 });
  C.boulangere = new Character({ skin: '#ffd2a8', shirt: '#ff9f1c', pants: '#6d3b1f', hat: 'chef', apron: '#ffffff', hair: '#b5652b', scale: 1.0 });
  C.dame = new Character({ skin: '#f1c27d', shirt: '#8e44ad', pants: '#34495e', hat: 'beanie', hatColor: '#27ae60', bandColor: '#1e8449', pompom: '#f1c40f', scarf: '#e74c3c', scale: 1.0 });
  C.stilt1 = new Character({ skin: '#c68642', shirt: '#16a085', pants: '#2c3e50', hat: 'beanie', hatColor: '#e67e22', bandColor: '#d35400', pompom: '#fff', stilts: true, scarf: '#f1c40f' });
  C.stilt2 = new Character({ skin: '#ffdbac', shirt: '#e74c3c', pants: '#2c3e50', hat: 'cap', hatColor: '#9b59b6', stilts: true, scale: 0.95 });
  C.zip = new Character({ skin: '#8d5524', shirt: '#f39c12', pants: '#2c3e50', hat: 'beanie', hatColor: '#3498db', bandColor: '#2471a3', pompom: '#fff', scarf: '#1abc9c' });
  C.riche = new Character({ skin: '#ffe0bd', shirt: '#f5f5f5', sleeve: '#222', pants: '#222', hat: 'tophat', hatColor: '#111', bandColor: '#d4af37', mustache: '#3b2a1a', tie: '#d4af37' });
  C.walker1 = new Character({ skin: '#ffcc99', shirt: '#00b4d8', pants: '#023e8a', hat: 'beanie', hatColor: '#ef476f', bandColor: '#c9184a', pompom: '#ffd166' });
  C.walker2 = new Character({ skin: '#d2a679', shirt: '#80b918', pants: '#3a2e39', hat: 'cap', hatColor: '#ff7b00', scale: 0.95 });
  C.kid1 = new Character({ skin: '#ffd9b3', shirt: '#06d6a0', pants: '#073b4c', hat: 'beanie', hatColor: '#118ab2', bandColor: '#073b4c', pompom: '#ffd166', scale: 0.75 });
  C.kid2 = new Character({ skin: '#a0673d', shirt: '#ffd166', pants: '#5e548e', hat: 'beanie', hatColor: '#ef476f', bandColor: '#9d0208', pompom: '#fff', scale: 0.72 });
  C.kid3 = new Character({ skin: '#ffe0bd', shirt: '#9b5de5', pants: '#00bbf9', hair: '#f4d35e', pigtails: true, scale: 0.7 });
  return C;
}

// ---------------- Ciel ----------------
export function skyTex(top, bottom, stars = 0) {
  return canvasTex(64, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

// ---------------- Téléphérique ----------------
export const CABLE = { zA: 36, yA: 11.5, zB: -205, yB: 74, sag: 6 };
export function cableP(x, s) {
  return V3(x, CABLE.yA + (CABLE.yB - CABLE.yA) * s - CABLE.sag * Math.sin(Math.PI * s), CABLE.zA + (CABLE.zB - CABLE.zA) * s);
}
export const LINE_UP = -1.6, LINE_DOWN = 1.6;

export function makeCabin(color, { emblem = false, dark = false, hose = false, trim = '#ffd23f', scale = 1 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group(); body.scale.setScalar(scale); g.add(body);
  box(body, 0.12, 3.0, 0.12, '#555b66', 0, -1.5, 0);
  box(body, 0.9, 0.3, 0.9, '#3a3f4a', 0, -0.1, 0);
  box(body, 3.4, 0.35, 3.0, dark ? '#16131c' : trim, 0, -3.1, 0);
  box(body, 3.2, 2.6, 2.8, color, 0, -4.55, 0);
  box(body, 3.4, 0.3, 3.0, dark ? '#16131c' : trim, 0, -5.95, 0);
  // vitres
  const glass = dark ? mat('#1a2a44', { emissive: '#3a0a5a', emissiveIntensity: 0.6, roughness: 0.2 }) : mat('#a9d8ff', { roughness: 0.15, metalness: 0.3 });
  box(body, 2.6, 1.1, 0.06, glass, 0, -4.2, 1.42, false);
  box(body, 2.6, 1.1, 0.06, glass, 0, -4.2, -1.42, false);
  box(body, 0.06, 1.1, 2.2, glass, 1.62, -4.2, 0, false);
  box(body, 0.06, 1.1, 2.2, glass, -1.62, -4.2, 0, false);
  if (emblem) {
    const t = canvasTex(256, 256, (ctx, w) => {
      ctx.fillStyle = dark ? '#16131c' : '#ffd23f'; ctx.fillRect(0, 0, w, w);
      ctx.fillStyle = dark ? '#d4af37' : '#c1121f'; ctx.beginPath(); ctx.arc(128, 128, 110, 0, 7); ctx.fill();
      ctx.fillStyle = dark ? '#16131c' : '#fff'; ctx.font = `190px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('G', 128, 140);
    });
    const em = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
    for (const s of [-1, 1]) { const p = plane(body, 1.1, 1.1, em, s * 1.63, -5.25, 0); p.rotation.y = s * Math.PI / 2; p.scale.set(1, 0.55 / 1.1 * 1.0, 1); p.scale.set(0.6, 0.6, 1); }
    const pf = plane(body, 0.7, 0.7, em, 0, -5.25, 1.46); pf.scale.set(0.9, 0.9, 1);
  }
  if (hose) {
    g.hose = [];
    const hm = mat('#2b2b2b', { roughness: 0.5 });
    for (let i = 0; i < 14; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.08, 8), hm);
      seg.castShadow = true; g.add(seg); g.hose.push(seg);
    }
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.25, 0.7, 8), mat('#d4af37', { metalness: 0.8, roughness: 0.3 }));
    g.add(nozzle); g.nozzle = nozzle;
  }
  return g;
}

// tuyau : courbe depuis le bas de la cabine vers un point bas
export function layHose(cab, len, lean, t) {
  const n = cab.hose.length;
  const start = V3(0, -6.1, 0);
  let prev = start.clone();
  const segLen = len / n;
  const up = V3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const u = (i + 1) / n;
    const p = V3(Math.sin(t * 2 + u * 3) * 0.25 * u, -6.1 - len * u, -lean * u * u * len * 0.35);
    const seg = cab.hose[i];
    seg.visible = true;
    const mid = prev.clone().add(p).multiplyScalar(0.5);
    seg.position.copy(mid);
    const dir = p.clone().sub(prev).normalize();
    seg.quaternion.setFromUnitVectors(up, dir);
    seg.scale.set(1, prev.distanceTo(p) / 1.0 * 1.0, 1);
    prev = p;
  }
  cab.nozzle.position.copy(prev).add(V3(0, -0.3, 0));
  cab.nozzle.visible = true;
  return cab.localToWorld(prev.clone());
}
export function hideHose(cab) { for (const s of cab.hose) s.visible = false; cab.nozzle.visible = false; }

function station(parent, x, y, z, w, h, d, color, facing = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  box(g, w, h, d, color, 0, h / 2, 0);
  box(g, w + 1, 0.6, d + 1, '#3a3f4a', 0, h + 0.3, 0);
  box(g, w + 0.6, 0.6, d + 0.6, '#f4f9ff', 0, h + 0.75, 0);
  for (let i = -1; i <= 1; i++) box(g, 1.6, 1.4, 0.1, glow('#ffe8a3', 0.25), i * 3, h * 0.62, facing * (d / 2 + 0.05), false);
  return g;
}

// ---------------- Village ----------------
export function makeVillage(scene) {
  const W = new THREE.Group(); scene.add(W);
  const R = {};
  // sol neigeux
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat('#eef5ff', { roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; W.add(ground);
  // rue (neige tassée) + trottoirs
  box(W, 8, 0.06, 92, '#dfe9f5', 0, 0.03, -10, false).receiveShadow = true;
  // glace (couche brillante dont l'étendue est animée)
  const iceGeo = new THREE.PlaneGeometry(7.6, 1);
  iceGeo.translate(0, -0.5, 0); // origine à une extrémité
  R.iceMat = new THREE.MeshPhysicalMaterial({ color: '#bfe8ff', roughness: 0.06, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.92 });
  R.ice = new THREE.Mesh(iceGeo, R.iceMat);
  R.ice.rotation.x = -Math.PI / 2; R.ice.position.set(0, 0.075, 30); R.ice.receiveShadow = true; W.add(R.ice);
  // reflets / fissures sur la glace : bandes claires
  for (let i = 0; i < 18; i++) {
    const s = box(null, 0.12, 0.01, 2 + hash(i) * 4, glow('#ffffff', 0.4), -3 + hash(i + 9) * 6, 0.09, 26 - i * 4.6, false);
    s.rotation.y = 0.4 + hash(i * 3) * 0.6; W.add(s); (R.iceGlints ||= []).push(s);
  }
  // maisons colorées
  const colors = ['#e63946', '#ff9f1c', '#2a9d8f', '#8338ec', '#ffbe0b', '#3a86ff', '#fb5607', '#06d6a0', '#ff006e', '#4cc9f0', '#f77f00', '#7209b7'];
  R.windows = [];
  const winMat = mat('#30415f', { emissive: '#ffcf6e', emissiveIntensity: 0.05, roughness: 0.3 });
  R.winMat = winMat;
  const house = (x, z, i, side, opts = {}) => {
    const w = opts.w || 6.5 + hash(i) * 1.5, d = opts.d || 6, h = opts.h || 4.5 + hash(i + 3) * 2.5;
    const g = new THREE.Group(); g.position.set(x, 0, z); W.add(g);
    const col = opts.color || colors[i % colors.length];
    box(g, w, h, d, col, 0, h / 2, 0);
    const rh = 2.6 + hash(i + 7) * 0.8;
    prism(g, w + 0.9, rh, d + 0.8, '#7a3b2e', 0, h, 0);
    prism(g, w + 1.1, rh, d + 1.0, '#f7fbff', 0, h + 0.28, 0);
    box(g, 0.8, 2, 0.8, '#8d5a44', w * 0.25, h + rh * 0.6, 1.2);
    box(g, 0.95, 0.3, 0.95, '#f7fbff', w * 0.25, h + rh * 0.6 + 1.1, 1.2);
    const fx = side * (w / 2 + 0.03); // façade côté rue
    box(g, 0.1, 2.0, 1.2, '#5a3a22', fx, 1.0, 0, false); // porte
    box(g, 0.14, 0.25, 1.5, '#fff', fx, 2.15, 0, false);
    for (const dz of [-1.9, 1.9]) {
      const win = box(g, 0.1, 1.1, 1.1, winMat, fx, 2.0, dz, false); R.windows.push(win);
      box(g, 0.14, 0.12, 1.3, '#ffffff', fx, 1.4, dz, false);
      if (h > 5.2) box(g, 0.1, 1.0, 1.0, winMat, fx, h - 1.3, dz, false);
    }
    // neige au pied
    box(g, w + 0.6, 0.35, 0.8, '#f4f9ff', 0, 0.17, side * -(d / 2), false);
    return g;
  };
  R.houses = [];
  let i = 0;
  for (let z = 28; z >= -50; z -= 8.2) {
    for (const side of [-1, 1]) {
      const x = side * 9.5;
      if (side === 1 && Math.abs(z - -13.0) < 3) { i++; continue; } // école
      const bakery = side === -1 && Math.abs(z - 3.4) < 1;
      const g = house(x, z, i++, -side, bakery ? { w: 7, h: 5.2, color: '#ffb4a2' } : {});
      g.rotation.y = 0; R.houses.push(g);
    }
  }
  // boulangerie (côté gauche, z≈3.4)
  const bak = signTex('BOULANGERIE', { bg: '#7b3f00', fg: '#ffe8b0', border: '#ffd23f', size: 62, w: 512, h: 120 });
  const bs = plane(W, 5, 1.2, new THREE.MeshStandardMaterial({ map: bak }), -5.92, 3.5, 3.4); bs.rotation.y = Math.PI / 2;
  // école (côté droit)
  const sc = new THREE.Group(); sc.position.set(11, 0, -13); W.add(sc);
  box(sc, 8, 7, 12, '#f4a261', 0, 3.5, 0);
  prism(sc, 9, 3, 13, '#9c2c2c', 0, 7, 0); prism(sc, 9.3, 3, 13.2, '#f7fbff', 0, 7.3, 0);
  box(sc, 2, 3, 2, '#e9c46a', 0, 10.5, 0); box(sc, 2.4, 0.4, 2.4, '#f7fbff', 0, 12.2, 0);
  box(sc, 0.12, 2.6, 2.4, '#3d2b1f', -4.03, 1.3, 0, false);
  for (const dz of [-4, -2, 2, 4]) box(sc, 0.1, 1.4, 1.2, winMat, -4.03, 4.6, dz, false);
  const ecole = signTex('ÉCOLE', { bg: '#264653', fg: '#fff', border: '#e9c46a', size: 100 });
  const es = plane(sc, 4.4, 1.4, new THREE.MeshStandardMaterial({ map: ecole }), -4.08, 6.0, 0); es.rotation.y = -Math.PI / 2;
  R.school = sc;
  // lampadaires
  R.lamps = [];
  for (let z = 24; z >= -48; z -= 12) for (const s of [-1, 1]) {
    box(W, 0.25, 5, 0.25, '#2b2d42', s * 4.6, 2.5, z + (s > 0 ? 6 : 0));
    const l = box(W, 0.7, 0.6, 0.7, glow('#ffe29a', 0.3), s * 4.6, 5.2, z + (s > 0 ? 6 : 0), false); R.lamps.push(l);
  }
  // sapins et montagnes
  for (let k = 0; k < 70; k++) {
    const a = hash(k) * Math.PI * 2, r = 30 + hash(k + 50) * 60;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 10;
    if (Math.abs(x) < 16 && z > -60 && z < 40) continue;
    pine(W, x, z, 0.8 + hash(k + 99) * 0.9);
  }
  const mountain = (x, z, r, h, seg, col = '#5b6f8f') => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(col, { flatShading: true }));
    m.position.set(x, h / 2 - 1, z); m.rotation.y = hash(x + z) * 3; m.receiveShadow = true; W.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.38, h * 0.38, seg), mat('#f4f9ff', { flatShading: true }));
    cap.position.set(x, h - h * 0.19 - 1 + 0.3, z); cap.rotation.y = m.rotation.y; W.add(cap);
    return m;
  };
  mountain(0, -215, 70, 76, 7, '#4f6283');
  const ring = [[-120, -170, 70, 120], [120, -180, 80, 135], [-200, -60, 70, 110], [210, -40, 80, 120], [-190, 90, 75, 100], [200, 120, 70, 95], [-60, -260, 70, 150], [80, -280, 80, 160], [0, 260, 90, 110], [-110, 230, 60, 90], [130, 250, 70, 100], [-260, -150, 80, 140], [270, -150, 80, 130]];
  ring.forEach(([x, z, r, h], k) => mountain(x, z, r, h, 5 + (k % 3), k % 2 ? '#5b6f8f' : '#667fa3'));
  // gare basse (z≈38) + panneau 50 €
  station(W, 0, 0, 40, 12, 9, 8, '#c1121f', -1);
  const s50 = signTex('50 € LE TRAJET', { bg: '#d62828', fg: '#fff', border: '#ffd23f', size: 78, w: 640, h: 170 });
  R.sign50 = plane(W, 7.2, 1.9, new THREE.MeshStandardMaterial({ map: s50, emissive: '#ffffff', emissiveMap: s50, emissiveIntensity: 0.25 }), 0, 7.0, 35.9);
  R.sign50.rotation.y = Math.PI;
  const gG = canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(128, 128, 120, 0, 7); ctx.fill(); ctx.fillStyle = '#c1121f'; ctx.beginPath(); ctx.arc(128, 128, 100, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `180px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('G', 128, 140); });
  const gm = plane(W, 2.6, 2.6, new THREE.MeshStandardMaterial({ map: gG, transparent: true }), 0, 10.6, 35.8); gm.rotation.y = Math.PI;
  // gare haute (au sommet)
  const top = station(W, 0, 70, -207, 14, 8, 10, '#2b1d3f', 1);
  R.topLight = box(W, 1.2, 1.2, 1.2, glow('#ff2e4d', 1.5), 0, 80.5, -207, false);
  // pylônes
  for (const s of [0.42, 0.72]) {
    const p = cableP(0, s);
    box(W, 1.2, p.y + 1, 1.2, '#4a5060', 0, (p.y + 1) / 2 - 0.5, p.z);
    box(W, 5.6, 0.6, 0.8, '#4a5060', 0, p.y + 0.3, p.z);
  }
  // câbles
  const cableM = mat('#22252c', { roughness: 0.4 });
  for (const x of [LINE_UP, LINE_DOWN]) {
    const pts = []; for (let k = 0; k <= 60; k++) pts.push(cableP(x, k / 60));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.07, 5), cableM);
    W.add(tube);
  }
  // câble de glisse entre les toits (côté gauche)
  const zl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 60, 5), cableM);
  zl.rotation.x = Math.PI / 2; zl.position.set(-4.2, 8.6, -5); W.add(zl);
  box(W, 0.3, 8.6, 0.3, '#5a3a22', -4.2, 4.3, 25);
  box(W, 0.3, 8.6, 0.3, '#5a3a22', -4.2, 4.3, -35);
  // cabines
  R.cabGreen = makeCabin('#2dc653', {}); W.add(R.cabGreen);
  R.cabYellow = makeCabin('#ffd23f', { emblem: true, trim: '#c1121f' }); W.add(R.cabYellow);
  R.cabBlue = makeCabin('#4cc9f0', {}); W.add(R.cabBlue);
  R.cabBlack = makeCabin('#141018', { emblem: true, dark: true, hose: true }); W.add(R.cabBlack);
  // grande cabine révélée (la « salle »)
  R.bigCab = makeBigCabin(); W.add(R.bigCab);
  // tirelire cochon
  R.pig = makePig(); W.add(R.pig);
  // pièces au sol / lettres / baguettes (particules simples)
  R.bits = [];
  for (let k = 0; k < 24; k++) {
    const b = box(W, 0.5, 0.04, 0.34, k % 3 === 0 ? '#ffffff' : (k % 3 === 1 ? '#fff3d6' : '#d9a441'), 0, 0, 0, false);
    b.visible = false; R.bits.push(b);
  }
  // spray (points)
  const N = 900;
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  R.spray = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#d8f6ff', size: 0.35, transparent: true, opacity: 0.85, depthWrite: false }));
  R.spray.frustumCulled = false; W.add(R.spray);
  // neige qui tombe
  const SN = 2500;
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SN * 3), 3));
  R.snow = new THREE.Points(ng, new THREE.PointsMaterial({ color: '#ffffff', size: 0.22, transparent: true, opacity: 0.95, depthWrite: false }));
  R.snow.frustumCulled = false; W.add(R.snow);
  // étoiles
  const ST = 1500; const sp = new Float32Array(ST * 3);
  for (let k = 0; k < ST; k++) {
    const th = hash(k) * Math.PI * 2, ph = 0.05 + hash(k + 7) * 1.4, r = 800;
    sp[k * 3] = Math.cos(th) * Math.cos(ph) * r; sp[k * 3 + 1] = Math.sin(ph) * r; sp[k * 3 + 2] = Math.sin(th) * Math.cos(ph) * r;
  }
  const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  R.stars = new THREE.Points(stg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false }));
  W.add(R.stars);
  // lune
  R.moon = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff6d8', fog: false }));
  R.moon.position.set(-160, 260, -520); W.add(R.moon);
  R.group = W;
  return R;
}

export function updateSnow(R, t, center, cam) {
  const a = R.snow.geometry.attributes.position; const n = a.count;
  for (let k = 0; k < n; k++) {
    const H = 30;
    const y = H - frac(hash(k + 3) - t * (0.08 + hash(k) * 0.05)) * H;
    a.array[k * 3] = center.x + (hash(k * 7) - 0.5) * 70 + Math.sin(t * 0.8 + k) * 0.6;
    a.array[k * 3 + 1] = Math.max(0, center.y - 6 + y);
    a.array[k * 3 + 2] = center.z + (hash(k * 13) - 0.5) * 70;
    if (cam) { const dx = a.array[k * 3] - cam.x, dy = a.array[k * 3 + 1] - cam.y, dz = a.array[k * 3 + 2] - cam.z; if (dx * dx + dy * dy + dz * dz < 36) a.array[k * 3 + 1] = -5; }
  }
  a.needsUpdate = true;
}
const frac = (x) => x - Math.floor(x);

export function updateSpray(R, t, nozzle, on, ground = 0.1) {
  const a = R.spray.geometry.attributes.position; const n = a.count;
  R.spray.visible = on;
  if (!on) return;
  for (let k = 0; k < n; k++) {
    const u = frac(t * 1.6 + hash(k));
    const ang = hash(k + 1) * Math.PI * 2, rad = u * (1.2 + hash(k + 2) * 3.2);
    const y = nozzle.y - 0.6 - u * (nozzle.y - ground);
    a.array[k * 3] = nozzle.x + Math.cos(ang) * rad;
    a.array[k * 3 + 1] = Math.max(ground, y);
    a.array[k * 3 + 2] = nozzle.z + Math.sin(ang) * rad * 0.8 - u * 1.2;
  }
  a.needsUpdate = true;
}

function makePig() {
  const g = new THREE.Group();
  const pink = '#ff8fab';
  box(g, 1.6, 1.2, 1.1, pink, 0, 1.0, 0);
  box(g, 0.5, 0.4, 0.4, '#ff6f91', 0.95, 1.0, 0);
  box(g, 0.08, 0.12, 0.08, '#7a2840', 1.21, 1.04, 0.1, false); box(g, 0.08, 0.12, 0.08, '#7a2840', 1.21, 1.04, -0.1, false);
  for (const [x, z] of [[-0.5, 0.35], [0.5, 0.35], [-0.5, -0.35], [0.5, -0.35]]) box(g, 0.3, 0.5, 0.3, '#ff6f91', x, 0.25, z);
  box(g, 0.25, 0.3, 0.1, '#ff6f91', 0.55, 1.7, 0.35); box(g, 0.25, 0.3, 0.1, '#ff6f91', 0.55, 1.7, -0.35);
  box(g, 0.1, 0.12, 0.1, '#1d1b2a', 0.81, 1.3, 0.25, false); box(g, 0.1, 0.12, 0.1, '#1d1b2a', 0.81, 1.3, -0.25, false);
  box(g, 0.6, 0.06, 0.12, '#1d1b2a', 0, 1.61, 0, false);
  g.visible = false;
  return g;
}

function makeBigCabin() {
  const g = new THREE.Group();
  const red = '#b5172b', yel = '#ffc928';
  box(g, 0.6, 7, 0.6, '#3a3f4a', 0, -3.5, 0);
  box(g, 3, 1, 3, '#2a2d35', 0, -0.4, 0);
  box(g, 17, 0.8, 11, yel, 0, -7.4, 0);
  box(g, 16.4, 9, 10.4, red, 0, -12.2, 0);
  box(g, 17, 0.8, 11, yel, 0, -17.0, 0);
  for (const x of [-8.3, 8.3]) for (const z of [-5.3, 5.3]) box(g, 0.7, 10, 0.7, yel, x, -12.2, z);
  const win = mat('#ffcf6e', { emissive: '#ffb347', emissiveIntensity: 1.2 });
  for (const z of [-3, 0, 3]) { box(g, 0.1, 2.4, 2.0, win, -8.25, -11.6, z, false); box(g, 0.1, 2.4, 2.0, win, 8.25, -11.6, z, false); }
  for (const x of [-5, 0, 5]) box(g, 3.2, 2.4, 0.1, win, x, -11.6, 5.25, false);
  const t = canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = '#16131c'; ctx.beginPath(); ctx.arc(128, 128, 120, 0, 7); ctx.fill(); ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(128, 128, 100, 0, 7); ctx.fill(); ctx.fillStyle = '#16131c'; ctx.font = `180px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('G', 128, 140); });
  const p = plane(g, 3, 3, new THREE.MeshStandardMaterial({ map: t, transparent: true, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.4 }), 0, -15.0, 5.26);
  g.visible = false;
  return g;
}

// ---------------- Intérieur (salle des écrans) ----------------
export const SCREENS = [
  ['LÉON', 29], ['ZOÉ', 40], ['FACTEUR', 112],
  ['BOULANGÈRE', 87], ['M. ROGER', 63], ['MME LILI', 51],
];
export function screenTex(name, n, { hot = 0, big = false } = {}) {
  return canvasTex(big ? 1024 : 512, big ? 256 : 280, (ctx, w, h) => drawScreen(ctx, w, h, name, n, hot, big));
}
export function drawScreen(ctx, w, h, name, n, hot, big) {
  ctx.fillStyle = big ? '#3a0006' : '#06121f'; ctx.fillRect(0, 0, w, h);
  // lignes de balayage
  ctx.fillStyle = big ? 'rgba(255,60,60,.08)' : 'rgba(80,200,255,.07)';
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (big) {
    ctx.fillStyle = hot ? '#ffffff' : '#ff3b3b';
    ctx.font = `92px ${FONT}`;
    ctx.fillText(`${name} : ${n}`, w / 2, h * 0.38);
    ctx.fillStyle = '#ffd23f'; ctx.font = `58px ${FONT}`;
    ctx.fillText('★ MEILLEUR CLIENT ★', w / 2, h * 0.78);
    ctx.strokeStyle = hot ? '#ffd23f' : '#ff3b3b'; ctx.lineWidth = 12; ctx.strokeRect(8, 8, w - 16, h - 16);
  } else {
    ctx.fillStyle = hot ? '#ffd23f' : '#7fe7ff'; ctx.font = `62px ${FONT}`;
    ctx.fillText(name, w / 2, h * 0.3);
    ctx.fillStyle = hot ? '#ffffff' : '#d7f7ff'; ctx.font = `104px ${FONT}`;
    ctx.fillText(String(n), w / 2, h * 0.66);
    ctx.font = `30px ${FONT}`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillText('CHUTES', w / 2, h * 0.9);
    if (hot) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14); }
  }
}

export function makeInterior(scene) {
  const G = new THREE.Group(); scene.add(G);
  const I = { group: G };
  const red = '#b5172b', yel = '#ffc928';
  // sol damier
  const floorT = canvasTex(512, 512, (ctx, w) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? '#2a0d12' : '#6e1420'; ctx.fillRect(x * 64, y * 64, 64, 64); } });
  floorT.wrapS = floorT.wrapT = THREE.RepeatWrapping; floorT.repeat.set(2, 1.25);
  const floor = plane(G, 16, 10, new THREE.MeshStandardMaterial({ map: floorT, roughness: 0.35, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  // trappe
  I.hatch = box(G, 1.8, 0.05, 1.8, '#140a0c', -3, 0.02, 2.2, false);
  box(G, 2.1, 0.06, 0.15, yel, -3, 0.03, 3.15, false); box(G, 2.1, 0.06, 0.15, yel, -3, 0.03, 1.25, false);
  // murs
  box(G, 16, 9, 0.3, red, 0, 4.5, -5.15); // fond (écrans)
  box(G, 0.3, 9, 10.6, red, -8.15, 4.5, 0);
  box(G, 0.3, 9, 10.6, red, 8.15, 4.5, 0);
  box(G, 6.5, 9, 0.3, red, -4.75, 4.5, 5.15); box(G, 6.5, 9, 0.3, red, 4.75, 4.5, 5.15);
  box(G, 3.0, 4.6, 0.3, red, 0, 6.7, 5.15);
  box(G, 16.6, 0.4, 10.8, '#7a0f1d', 0, 9.1, 0);
  // poutres et plinthes jaunes
  for (const x of [-7.9, -2.7, 2.7, 7.9]) box(G, 0.4, 9, 0.4, yel, x, 4.5, -4.9);
  box(G, 16, 0.4, 0.4, yel, 0, 0.2, -4.9); box(G, 16, 0.5, 0.5, yel, 0, 8.7, -4.9);
  for (const z of [-2.5, 0, 2.5]) box(G, 16, 0.35, 0.4, yel, 0, 8.8, z);
  box(G, 0.4, 0.4, 10, yel, -7.9, 0.2, 0); box(G, 0.4, 0.4, 10, yel, 7.9, 0.2, 0);
  // fenêtres côté gauche (ciel étoilé qui défile)
  I.skyT = canvasTex(256, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#060b24'); g.addColorStop(1, '#1b2d63'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let k = 0; k < 160; k++) { ctx.fillStyle = `rgba(255,255,255,${0.4 + hash(k) * 0.6})`; ctx.fillRect(hash(k + 1) * w, hash(k + 2) * h, 2 + hash(k) * 2, 2 + hash(k) * 2); }
    ctx.fillStyle = '#ffe9a8'; for (let k = 0; k < 30; k++) ctx.fillRect(hash(k + 40) * w, h * 0.85 + hash(k + 41) * h * 0.15, 4, 4);
  });
  I.skyT.wrapT = THREE.RepeatWrapping; I.skyT.repeat.set(1, 0.35);
  for (const z of [-2.4, 1.4]) {
    const p = plane(G, 2.4, 2.8, new THREE.MeshBasicMaterial({ map: I.skyT }), -7.98, 4.6, z); p.rotation.y = Math.PI / 2;
    box(G, 0.2, 3.2, 0.25, yel, -7.95, 4.6, z - 1.32); box(G, 0.2, 3.2, 0.25, yel, -7.95, 4.6, z + 1.32);
    box(G, 0.2, 0.25, 2.9, yel, -7.95, 6.1, z); box(G, 0.2, 0.25, 2.9, yel, -7.95, 3.1, z);
  }
  // écrans
  I.screens = [];
  SCREENS.forEach(([name, n], k) => {
    const col = k % 3, row = Math.floor(k / 3);
    const x = (col - 1) * 3.3, y = row === 0 ? 4.5 : 2.4;
    const tex = screenTex(name, n);
    const m = plane(G, 2.8, 1.55, new THREE.MeshBasicMaterial({ map: tex }), x, y, -4.9);
    box(G, 3.05, 1.8, 0.12, '#1a1a1a', x, y, -5.02, false);
    I.screens.push({ mesh: m, tex, name, n });
  });
  I.bigTex = screenTex('NATHAN', '3 000 CHUTES', { big: true });
  I.big = plane(G, 6.6, 2.0, new THREE.MeshBasicMaterial({ map: I.bigTex }), 0, 6.95, -4.9);
  box(G, 7.0, 2.4, 0.14, '#ffc928', 0, 6.95, -5.03, false);
  // tube + coffre (côté droit)
  const gold = mat('#e8b923', { metalness: 0.85, roughness: 0.3 });
  I.gold = gold;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5, 12), mat('#c9a227', { metalness: 0.9, roughness: 0.25 }));
  tube.position.set(5.6, 6.6, -2.2); G.add(tube);
  const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 0.5, 12), gold); lip.position.set(5.6, 4.0, -2.2); G.add(lip);
  I.tubeMouth = V3(5.6, 3.8, -2.2);
  const chest = new THREE.Group(); chest.position.set(5.6, 0, -2.2); G.add(chest);
  box(chest, 3.2, 1.7, 2.2, '#7a4a1f', 0, 0.85, 0);
  for (const x of [-1.4, 0, 1.4]) box(chest, 0.25, 1.75, 2.25, '#e8b923', x, 0.86, 0);
  const lid = box(chest, 3.2, 0.3, 2.2, '#7a4a1f', 0, 2.6, -1.4); lid.rotation.x = -1.2;
  I.pile = box(chest, 2.9, 0.4, 1.9, gold, 0, 1.6, 0, false);
  for (let k = 0; k < 9; k++) box(chest, 0.6, 0.25, 0.3, gold, -1 + (k % 3) * 0.95, 1.85 + Math.floor(k / 3) * 0.12, -0.4 + (k % 2) * 0.6, false).rotation.y = hash(k) * 1.5;
  // pièces qui tombent (instanced)
  const coinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12);
  I.coins = new THREE.InstancedMesh(coinGeo, gold, 140);
  I.coins.frustumCulled = false; G.add(I.coins);
  I.bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.22, 0.28), gold, 20);
  I.bars.frustumCulled = false; G.add(I.bars);
  // compteur
  I.counterTex = canvasTex(768, 220, (ctx, w, h) => drawCounter(ctx, w, h, '0 €', 0));
  I.counter = plane(G, 5.0, 1.45, new THREE.MeshBasicMaterial({ map: I.counterTex }), 5.2, 6.0, -1.0);
  I.counter.rotation.y = -Math.PI / 2;
  I.counter.position.set(7.86, 6.4, -0.6);
  box(G, 0.12, 1.7, 5.3, '#ffc928', 8.0, 6.4, -0.6, false);
  // porte violette à barreaux (mur avant z=+5)
  const purple = '#7b2cbf';
  box(G, 0.5, 4.6, 0.5, purple, -1.7, 2.3, 5.0); box(G, 0.5, 4.6, 0.5, purple, 1.7, 2.3, 5.0); box(G, 3.9, 0.5, 0.5, purple, 0, 4.55, 5.0);
  I.gate = new THREE.Group(); G.add(I.gate);
  for (let k = -3; k <= 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.3, 8), mat('#9d4edd', { metalness: 0.6, roughness: 0.3 })); b.position.set(k * 0.45, 2.15, 0); b.castShadow = true; I.gate.add(b); }
  for (const y of [0.8, 2.0, 3.95]) box(I.gate, 3.2, 0.14, 0.14, '#9d4edd', 0, y, 0);
  I.gate.position.set(0, 0, 5.0);
  // couloir derrière la porte
  box(G, 6, 0.2, 5, '#1c1428', 0, -0.1, 7.5);
  box(G, 6, 5, 0.3, '#2b1d3f', 0, 2.5, 10.1);
  box(G, 0.3, 5, 5, '#2b1d3f', -3, 2.5, 7.5); box(G, 0.3, 5, 5, '#2b1d3f', 3, 2.5, 7.5);
  box(G, 6, 0.3, 5, '#2b1d3f', 0, 5, 7.5);
  box(G, 1.0, 0.25, 1.0, glow('#c77dff', 1.2), 0, 4.8, 8, false);
  // éclairage intérieur
  I.lights = [];
  const pl1 = new THREE.PointLight('#ffb36b', 60, 30, 1.6); pl1.position.set(-3, 7.5, 1); G.add(pl1); I.lights.push(pl1);
  const pl2 = new THREE.PointLight('#ff6b6b', 40, 30, 1.6); pl2.position.set(4, 7.5, 0); G.add(pl2); I.lights.push(pl2);
  const pl3 = new THREE.PointLight('#c77dff', 30, 12, 1.5); pl3.position.set(0, 4, 8); G.add(pl3); I.lights.push(pl3);
  // téléphone
  I.phone = new THREE.Group();
  box(I.phone, 0.32, 0.6, 0.06, '#111', 0, 0, 0, false);
  I.phoneScreen = box(I.phone, 0.27, 0.5, 0.01, glow('#9ad1ff', 1.2), 0, 0, 0.035, false);
  return I;
}

export function drawCounter(ctx, w, h, text, flash) {
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ffc928'; ctx.lineWidth = 10; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = flash ? '#ffffff' : '#ffd23f'; ctx.font = `${text.length > 9 ? 116 : 136}px ${FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 8);
}
export { redraw };
