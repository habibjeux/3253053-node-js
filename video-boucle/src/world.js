// Décors : parc d'attractions, deux montagnes russes à boucle déformable, wagons, explosion, piste de démonstration.
import * as THREE from 'three';
import { box, mat, glow, plane, canvasTex, Character, FONT, hash, V3, addOutline } from './lib.js';
import { FlatCharacter } from './flat.js';

export const frac = (x) => x - Math.floor(x);
const WHITE = '#f6f6f4';

// ---------------- personnages ----------------
export function makeCast() {
  const C = {};
  C.createur = new FlatCharacter({ body: 'overall', shirt: '#ffd21f', overall: '#3d6fd6', hair: 'cap', cap: '#e53935', scale: 1.0 });
  C.rival = new FlatCharacter({ body: 'vest', vest: '#d8c7a0', tie: '#e8b400', hair: 'slick', scale: 1.05 });
  C.fille = new FlatCharacter({ body: 'dress', shirt: '#ff6fae', hair: 'pigtails', hairColor: '#5a3a1f', scale: 0.7 });
  C.pere = new FlatCharacter({ body: 'shirt', shirt: '#2ec4b6', hair: 'cap', cap: '#264653', scale: 1.0 });
  C.mere = new FlatCharacter({ body: 'shirt', shirt: '#ff9f1c', hair: 'long', hairColor: '#8a4b2a', scale: 0.95 });
  C.queue = [];
  const cols = ['#e63946', '#457b9d', '#8ac926', '#ffca3a', '#6a4c93', '#f15bb5', '#00bbf9', '#fb5607'];
  for (let k = 0; k < 10; k++) C.queue.push(new FlatCharacter({ body: 'shirt', shirt: cols[k % 8], hair: ['beanie', 'long', 'cap', null][k % 4], cap: cols[(k + 3) % 8], hairColor: ['#2b1d14', '#d4a373', '#141418'][k % 3], scale: 0.85 + hash(k) * 0.25 }));
  // mannequin de test : tout jaune, yeux en croix
  C.dummy = new FlatCharacter({ body: 'shirt', shirt: '#ffd23f', skin: '#ffd23f', hand: '#ffd23f', scale: 1.0 });
  return C;
}

// ---------------- textures ----------------
export function skyTex(top, bottom) { return canvasTex(64, 512, (ctx, w, h) => { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }); }
const grassTex = () => { const t = canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = '#4caf50'; ctx.fillRect(0, 0, w, w); for (let k = 0; k < 900; k++) { ctx.fillStyle = `rgba(${hash(k) > 0.5 ? '255,255,255' : '0,60,0'},${0.05 + hash(k + 1) * 0.06})`; ctx.fillRect(hash(k + 2) * w, hash(k + 3) * w, 2, 5); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 60); return t; };

// ---------------- formes de boucle ----------------
// m : 0 = cercle parfait, 1 = base élargie (courbe douce), 2 = goutte haute et étroite (clothoïde)
export function loopPoints(cx, by, m, N = 90) {
  // boucle construite par sa courbure κ(s) : douce en bas, plus serrée en haut (clothoïde) ; tour complet = 2π
  const k1 = Math.min(1, m), k2 = Math.max(0, m - 1);
  // m0 : cercle R10 ; m1 : base élargie (bas doux) ; m2 : goutte haute et étroite, courbure concentrée en haut
  const kb = 1 / (10 + k1 * 6 + k2 * 4), kt = 1 / (10 - k2 * 2), pw = 2 + 2 * k2;
  const steps = 2000; let avg = 0; for (let i = 0; i < steps; i++) avg += Math.sin(Math.PI * (i + 0.5) / steps) ** pw; avg /= steps;
  const Ltot = (2 * Math.PI) / (kb + (kt - kb) * avg), ds = Ltot / steps;
  let x = 0, y = 0, th = 0; const raw = [[0, 0]];
  for (let i = 1; i <= steps; i++) { const f = Math.sin(Math.PI * (i - 0.5) / steps) ** pw; th += (kb + (kt - kb) * f) * ds; x += Math.cos(th) * ds; y += Math.sin(th) * ds; raw.push([x, y]); }
  const pts = [];
  for (let i = 0; i <= N; i++) { const [px, py] = raw[Math.round(i / N * steps)]; pts.push(V3(cx - 7 + px, by + py, ((i / N) - 0.5) * 3.2)); }
  return pts;
}
// tracé complet : gare → montée → crête → descente → boucle → sortie
export function coasterPoints(m, { loopX = 14 } = {}) {
  const P = [];
  P.push(V3(-62, 2.2, -1.6), V3(-50, 2.2, -1.6), V3(-44, 4, -1.6));
  for (let i = 0; i <= 10; i++) P.push(V3(-40 + i * 2.2, 6 + i * 2.2, -1.6));
  P.push(V3(-14.5, 29.5, -1.6), V3(-11.5, 29.8, -1.6), V3(-8.8, 28.4, -1.6));
  P.push(V3(-5.5, 20, -1.6), V3(-2.5, 9, -1.6), V3(1, 2.4, -1.6), V3(5.5, 1.5, -1.6));
  const L = loopPoints(loopX, 1.5, m, 64);
  for (const p of L.slice(1, -1)) P.push(p);
  const ex = Math.max(L[L.length - 1].x, loopX - 7) + 2;
  P.push(V3(ex, 1.5, 1.6), V3(ex + 11, 1.5, 1.6), V3(ex + 25, 2.2, 1.6), V3(ex + 37, 2.2, 1.6));
  return P;
}

const railMat = (color) => mat(color, { metalness: 0.4, roughness: 0.35 });
export function buildTrack(points, color, supportColor) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const n = 700; const frames = [];
  for (let i = 0; i <= n; i++) { const u = i / n; const p = curve.getPointAt(u), T = curve.getTangentAt(u); const up = new THREE.Vector3(0, 0, 1).cross(T).normalize(); const side = T.clone().cross(up).normalize(); frames.push({ p, T, up, side }); }
  const railM = new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.42, emissive: color, emissiveIntensity: 0.12 });
  const rail = (sx, uy, r) => { const pts = frames.map((f) => f.p.clone().addScaledVector(f.side, sx).addScaledVector(f.up, uy)); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 8, false), railM); m.castShadow = true; g.add(m); return pts; };
  const Lr = rail(0.7, 0, 0.11), Rr = rail(-0.7, 0, 0.11), Sp = rail(0, -1.0, 0.2);
  const brace = new THREE.CylinderGeometry(0.045, 0.045, 1, 5); const bm = new THREE.InstancedMesh(brace, railM, n * 4); let bi = 0;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const add = (a, b) => { const d = b.clone().sub(a); const len = d.length(); q.setFromUnitVectors(Y, d.normalize()); m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1)); bm.setMatrixAt(bi++, m); };
  for (let i = 0; i < n; i += 3) { add(Lr[i], Sp[i]); add(Rr[i], Sp[i]); add(Lr[i], Rr[i]); if (i + 3 <= n) add(Rr[i], Sp[Math.min(n, i + 3)]); }
  bm.count = bi; bm.castShadow = true; g.add(bm);
  const supM = new THREE.MeshStandardMaterial({ color: supportColor, metalness: 0.2, roughness: 0.5 });
  for (let i = 0; i < n; i += 22) { const f = frames[i]; if (f.p.y < 3 || f.up.y < 0.2) continue; const h = f.p.y - 1.0; const s = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, h, 8), supM); s.position.set(f.p.x, h / 2, f.p.z); s.castShadow = true; g.add(s); }
  g.curve = curve; g.frames = frames;
  return g;
}
// pose d'un wagon sur la piste (u : 0→1)
export function placeOnTrack(obj, track, u, origin) {
  const fr = track.frames; const fi = Math.min(fr.length - 1, Math.max(0, u * (fr.length - 1)));
  const i = Math.floor(fi), j = Math.min(fr.length - 1, i + 1), k = fi - i;
  const p = fr[i].p.clone().lerp(fr[j].p, k), T = fr[i].T.clone().lerp(fr[j].T, k).normalize();
  const up = new THREE.Vector3(0, 0, 1).cross(T).normalize(); const side = T.clone().cross(up).normalize();
  obj.position.copy(p).add(origin || V3());
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, T));
}

export function makeWagon(color, seats = 2) {
  const g = new THREE.Group();
  box(g, 1.9, 0.9, 3.0, color, 0, 0.75, 0);
  box(g, 2.0, 0.25, 3.1, '#222', 0, 0.3, 0);
  box(g, 1.9, 1.0, 0.5, color, 0, 1.2, 1.3); // nez
  box(g, 1.7, 0.2, 0.3, '#ffd23f', 0, 1.25, 1.56, false);
  for (const z of [-0.9, 0.9]) for (const x of [-0.85, 0.85]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.25, 10), mat('#333')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.2, z); g.add(w); }
  box(g, 1.6, 0.15, 0.15, '#cfd4dc', 0, 1.65, -0.2); // barre de sécurité
  addOutline(g, 0.06);
  g.seat = V3(0, 0.55, -0.4);
  return g;
}

// ---------------- parc ----------------
export function makePark(scene) {
  const W = new THREE.Group(); scene.add(W);
  const R = { group: W };
  // terrain vallonné (plat sur l'aire de jeu)
  const hgt = (x, z) => { const d = Math.hypot((x + 10) / 1.3, z + 30); const k = Math.min(1, Math.max(0, (d - 95) / 80)); return k * (9 * Math.sin(x * 0.012 + 1) * Math.cos(z * 0.015) + 6 * Math.sin(x * 0.03 + z * 0.02) + 7); };
  const tg = new THREE.PlaneGeometry(1600, 1600, 260, 260); tg.rotateX(-Math.PI / 2);
  { const pos = tg.attributes.position; const cols = new Float32Array(pos.count * 3); const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, hgt(x, z)); const n = hash(Math.floor(x * 0.3) * 13 + Math.floor(z * 0.3)); c.setHSL(0.26 + n * 0.05, 0.62, 0.21 + n * 0.07); cols.set([c.r, c.g, c.b], i * 3); }
    tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals(); }
  const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); ground.receiveShadow = true; W.add(ground);
  // herbe en brins, par zones (instanciée)
  { const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.025, 0, 0, 0.025, 0, 0, 0, 0.24, 0.02]), 3)); blade.computeVertexNormals();
    const zones = [[8, 6, 26, 70000], [-52, 6, 16, 22000], [-30, 4, 18, 22000], [4, -64, 26, 45000], [44, -70, 18, 22000], [600 - 600, 0, 0, 0]];
    const total = zones.reduce((a, z) => a + z[3], 0); const im = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.9 }), total);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pp = new THREE.Vector3(), c = new THREE.Color(); let i = 0;
    for (const [zx, zz, zr, zn] of zones) for (let k = 0; k < zn; k++, i++) { const r = Math.sqrt(hash(i * 3.1)) * zr, a = hash(i * 7.3) * Math.PI * 2; pp.set(zx + Math.cos(a) * r, 0, zz + Math.sin(a) * r); e.set((hash(i + 2) - 0.5) * 0.7, hash(i + 3) * 6.28, (hash(i + 4) - 0.5) * 0.7); q.setFromEuler(e); const kk = 0.7 + hash(i + 5) * 1.0; sc.set(kk, kk * (0.8 + hash(i + 6) * 0.9), kk); m4.compose(pp, q, sc); im.setMatrixAt(i, m4); c.setHSL(0.24 + hash(i + 7) * 0.08, 0.62, 0.2 + hash(i + 8) * 0.15); im.setColorAt(i, c); }
    im.count = i; im.receiveShadow = true; W.add(im); }
  // ciels (dômes en dégradé)
  const dome = (top, bottom) => { const gg = new THREE.SphereGeometry(2500, 32, 16); const cc = []; const pp2 = gg.attributes.position; for (let i = 0; i < pp2.count; i++) { const y = pp2.getY(i) / 2500; const k = Math.pow(Math.max(0, y), 0.45); const col = new THREE.Color(bottom).lerp(new THREE.Color(top), k); cc.push(col.r, col.g, col.b); } gg.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); return new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false })); };
  R.skyDay = dome('#1f6fe5', '#bfe2ff'); R.skyNight = dome('#020616', '#1c2c5c'); W.add(R.skyDay); W.add(R.skyNight);
  // allées
  for (const [x, z, w, d] of [[0, 14, 140, 6], [-30, -20, 6, 70]]) { const p = plane(W, w, d, mat('#e9d8b4', { roughness: 0.9 }), x, 0.03, z); p.rotation.x = -Math.PI / 2; p.receiveShadow = true; }
  // montagnes russes du créateur (rouge) et du rival (blanche), en contrebas / au loin
  R.trackKey = {}; R.tracks = {};
  R.creatorOrigin = V3(0, 0, 0); R.rivalOrigin = V3(30, 0, -70);
  // gare du créateur
  const st = new THREE.Group(); st.position.set(-56, 0, -1.6); W.add(st);
  box(st, 10, 2, 6, '#9c6b43', 0, 1, 0); box(st, 10.2, 0.2, 6.2, '#b9875a', 0, 2.05, 0); box(st, 12, 0.5, 8, '#ffd23f', 0, 5.5, 0); for (const x of [-5, 5]) for (const z of [-3.5, 3.5]) box(st, 0.4, 5.5, 0.4, '#ffffff', x, 2.75, z);
  // gare du rival
  const sr = new THREE.Group(); sr.position.set(30 - 56, 0, -71.6); W.add(sr);
  box(sr, 10, 2, 6, '#e8e8e8', 0, 1, 0); box(sr, 12, 0.5, 8, '#d4af37', 0, 5.5, 0); for (const x of [-5, 5]) for (const z of [-3.5, 3.5]) box(sr, 0.4, 5.5, 0.4, '#d4af37', x, 2.75, z);
  // grande roue
  const fw = new THREE.Group(); fw.position.set(-70, 0, -60); W.add(fw); R.wheel = new THREE.Group(); R.wheel.position.y = 26; fw.add(R.wheel);
  for (const s of [-1, 1]) { const l = box(fw, 0.6, 28, 0.6, '#9aa5b1', s * 7, 13, 0); l.rotation.z = s * 0.25; }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(20, 0.35, 8, 64), mat('#e0e6ee')); R.wheel.add(ring);
  R.gondolas = [];
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; box(R.wheel, 0.25, 20, 0.25, '#c9d1da', Math.cos(a) * 10, Math.sin(a) * 10, 0, false).rotation.z = a - Math.PI / 2; const gd = box(W, 2.2, 2.2, 2.2, ['#e53935', '#fdd835', '#1e88e5', '#43a047'][k % 4], 0, 0, 0); gd.userData.a = a; R.gondolas.push(gd); }
  R.wheelBulbs = [];
  // arbres (instanciés, feuillage en plusieurs boules)
  { const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.42, 3.2, 7), new THREE.MeshStandardMaterial({ color: '#5b4330', roughness: 1 }), 160);
    const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), 640);
    const m4 = new THREE.Matrix4(), c = new THREE.Color(); let ti = 0, li = 0;
    for (let k = 0; k < 160; k++) { const a = hash(k) * Math.PI * 2, r = 75 + hash(k + 1) * 150; const x = Math.cos(a) * r - 10, z = Math.sin(a) * r - 30; const y = hgt(x, z), s2 = 0.9 + hash(k + 2) * 1.0;
      m4.compose(V3(x, y + 1.6 * s2, z), new THREE.Quaternion(), V3(s2, s2, s2)); trunk.setMatrixAt(ti++, m4);
      for (let j = 0; j < 4; j++) { const o = [[0, 4.4, 0, 2.6], [1.3, 3.8, 0.4, 1.8], [-1.2, 4.0, -0.3, 1.9], [0.2, 5.6, 0.2, 1.7]][j]; m4.compose(V3(x + o[0] * s2, y + o[1] * s2, z + o[2] * s2), new THREE.Quaternion(), V3(o[3] * s2, o[3] * s2 * 0.9, o[3] * s2)); leaves.setMatrixAt(li, m4); c.setHSL(0.27 + hash(k * 4 + j) * 0.06, 0.55, 0.24 + hash(k + j) * 0.1); leaves.setColorAt(li++, c); } }
    trunk.count = ti; leaves.count = li; trunk.castShadow = leaves.castShadow = true; W.add(trunk); W.add(leaves); }
  // stands
  for (const [x, z, col] of [[-20, 22, '#e53935'], [-6, 24, '#1e88e5'], [10, 22, '#fdd835']]) { const g = new THREE.Group(); g.position.set(x, 0, z); W.add(g); box(g, 5, 3, 3.5, '#ffffff', 0, 1.5, 0); box(g, 5.6, 0.6, 4, col, 0, 3.3, 0); }
  // bannière d'inauguration + guirlandes
  const bn = canvasTex(1024, 220, (ctx, w, h) => { ctx.fillStyle = '#c62828'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffd23f'; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 14, w, 14); ctx.fillStyle = '#fff'; ctx.font = `120px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('INAUGURATION DEMAIN', w / 2, h / 2 + 8); });
  R.banner = new THREE.Group(); R.banner.position.set(-56, 0, 4.5); W.add(R.banner);
  box(R.banner, 0.4, 9, 0.4, '#8d6e63', -7, 4.5, 0); box(R.banner, 0.4, 9, 0.4, '#8d6e63', 7, 4.5, 0);
  plane(R.banner, 13, 2.8, new THREE.MeshStandardMaterial({ map: bn, side: THREE.DoubleSide, emissive: '#ffffff', emissiveMap: bn, emissiveIntensity: 0.15 }), 0, 7.6, 0.25);
  R.bulbs = [];
  const bulbCols = ['#ffd23f', '#ff4f6d', '#4fc3ff', '#7dff8a'];
  for (const [a, b] of [[V3(-63, 8.8, 4.5), V3(-49, 8.8, 4.5)], [V3(-49, 8.8, 4.5), V3(-30, 7, 14)], [V3(-30, 7, 14), V3(-6, 7, 20)], [V3(-6, 7, 20), V3(14, 7, 20)]]) {
    for (let k = 0; k <= 16; k++) { const u = k / 16; const p = a.clone().lerp(b, u); p.y -= Math.sin(u * Math.PI) * 1.4; const bl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glow(bulbCols[k % 4], 0.3)); bl.material = bl.material.clone(); bl.position.copy(p); W.add(bl); R.bulbs.push(bl); }
  }
  // ciel nocturne
  const ST = 1500; const sp = new Float32Array(ST * 3);
  for (let i = 0; i < ST; i++) { const th = hash(i) * Math.PI * 2, ph = 0.05 + hash(i + 7) * 1.4, r = 900; sp[i * 3] = Math.cos(th) * Math.cos(ph) * r; sp[i * 3 + 1] = Math.sin(ph) * r; sp[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r; }
  const stg = new THREE.BufferGeometry(); stg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  R.stars = new THREE.Points(stg, new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, fog: false })); W.add(R.stars);
  R.moon = new THREE.Mesh(new THREE.SphereGeometry(30, 20, 14), new THREE.MeshBasicMaterial({ color: '#fff8e0', fog: false })); R.moon.position.set(120, 260, -520); W.add(R.moon);
  // nuages (billboards doux)
  R.clouds = [];
  { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
    for (let k = 0; k < 30; k++) { const gx = 128 + (hash(k) - 0.5) * 120, gy = 140 + (hash(k + 1) - 0.5) * 50, gr = 40 + hash(k + 2) * 40; const gd = x.createRadialGradient(gx, gy, 0, gx, gy, gr); gd.addColorStop(0, 'rgba(255,255,255,.95)'); gd.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gd; x.fillRect(0, 0, 256, 256); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    for (let k = 0; k < 14; k++) { const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false })); sp2.position.set(-300 + hash(k + 50) * 600, 90 + hash(k + 51) * 70, -300 - hash(k + 52) * 250); sp2.scale.set(110 + hash(k) * 70, 48 + hash(k + 3) * 24, 1); W.add(sp2); R.clouds.push(sp2); } }
  // halo de lune
  { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d'); const gd = x.createRadialGradient(64, 64, 10, 64, 64, 64); gd.addColorStop(0, 'rgba(255,248,220,.6)'); gd.addColorStop(1, 'rgba(255,248,220,0)'); x.fillStyle = gd; x.fillRect(0, 0, 128, 128);
    R.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, fog: false, toneMapped: false })); R.moonGlow.position.copy(R.moon.position).multiplyScalar(0.98); R.moonGlow.scale.set(220, 220, 1); W.add(R.moonGlow); }
  // wagons
  R.wagonC = makeWagon('#e53935'); W.add(R.wagonC);
  R.wagonR = makeWagon('#f2f2f2'); W.add(R.wagonR);
  // accessoires
  R.wallet = new THREE.Group(); W.add(R.wallet);
  box(R.wallet, 0.9, 0.14, 0.6, '#6d4c41', 0, 0, 0); R.walletLid = new THREE.Group(); R.walletLid.position.set(0, 0.07, -0.3); R.wallet.add(R.walletLid); box(R.walletLid, 0.9, 0.12, 0.6, '#5d4037', 0, 0, 0.3);
  R.mallet = new THREE.Group(); W.add(R.mallet); box(R.mallet, 0.14, 1.6, 0.14, '#8d6e63', 0, -0.8, 0); box(R.mallet, 0.7, 0.45, 0.45, '#424242', 0, -1.6, 0); addOutline(R.mallet, 0.05);
  R.plan = new THREE.Group(); W.add(R.plan); const pt = canvasTex(256, 192, (ctx, w, h) => { ctx.fillStyle = '#1e4d8c'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#cfe3ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w / 2, h / 2, 50, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20, h - 30); ctx.lineTo(w / 2 - 50, h / 2 + 40); ctx.stroke(); ctx.font = '18px DejaVu Sans'; ctx.fillStyle = '#cfe3ff'; ctx.fillText('PLAN', 12, 24); });
  plane(R.plan, 1.4, 1.05, new THREE.MeshStandardMaterial({ map: pt, side: THREE.DoubleSide }), 0, 0, 0);
  R.balloon = new THREE.Group(); W.add(R.balloon); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat('#e53935', { roughness: 0.3 })); bb.scale.y = 1.15; bb.position.y = 2.2; R.balloon.add(bb); box(R.balloon, 0.03, 2.0, 0.03, '#ffffff', 0, 1.0, 0, false);
  // étincelles (coups de maillet) et explosion
  const N = 400; const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  R.sparks = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffd27f', size: 0.25, transparent: true, depthWrite: false })); R.sparks.frustumCulled = false; W.add(R.sparks);
  R.boom = new THREE.Group(); W.add(R.boom);
  R.fire = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true })); R.boom.add(R.fire);
  R.fire2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshBasicMaterial({ color: '#ff5a1f', transparent: true, opacity: 0.85 })); R.boom.add(R.fire2);
  R.smoke = []; for (let k = 0; k < 24; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat('#3a3a3a', { flatShading: true, transparent: true, opacity: 0.9 })); s.material = s.material.clone(); R.boom.add(s); R.smoke.push(s); }
  R.debris = []; for (let k = 0; k < 30; k++) { const d = box(R.boom, 0.6, 0.3, 0.9, k % 2 ? '#f2f2f2' : '#d4af37', 0, 0, 0); R.debris.push(d); }
  R.boomLight = new THREE.PointLight('#ff8a3a', 0, 400, 1.2); R.boom.add(R.boomLight);
  return R;
}
export function setTrack(R, who, m) {
  const key = Math.round(m * 50) / 50; if (R.trackKey[who] === key) return R.tracks[who];
  R.trackKey[who] = key;
  const old = R.tracks[who]; if (old) { R.group.remove(old); old.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); }
  const t = buildTrack(coasterPoints(key), who === 'c' ? '#e53935' : '#f4f4f4', who === 'c' ? '#ffd23f' : '#d4af37');
  t.position.copy(who === 'c' ? R.creatorOrigin : R.rivalOrigin); R.group.add(t); R.tracks[who] = t;
  return t;
}

// ---------------- piste de démonstration (voitures) ----------------
export function makeDemo(scene) {
  const G = new THREE.Group(); G.position.set(600, 0, 0); scene.add(G);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 0.95 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; G.add(g);
  // route : virage serré (arc de rayon 10)
  G.R = 10;
  const road = new THREE.Mesh(new THREE.RingGeometry(G.R - 3, G.R + 3, 64, 1, 0, Math.PI), mat('#3c4046', { roughness: 0.8 })); road.rotation.x = -Math.PI / 2; road.position.y = 0.03; road.receiveShadow = true; G.add(road);
  for (const s of [-1, 1]) { const st = plane(G, 6, 60, mat('#3c4046'), s * G.R, 0.03, 30); st.rotation.x = -Math.PI / 2; }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI; const d = box(G, 0.25, 0.02, 1.2, '#ffffff', Math.cos(a) * G.R, 0.05, -Math.sin(a) * G.R, false); d.rotation.y = a; }
  const car = (col) => { const c = new THREE.Group(); box(c, 2.0, 0.8, 4.0, col, 0, 0.7, 0); box(c, 1.7, 0.7, 2.0, '#cfe8ff', 0, 1.4, -0.2); for (const z of [-1.3, 1.3]) for (const x of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12), mat('#222')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z); c.add(w); } addOutline(c, 0.06); G.add(c); return c; };
  G.carSlow = car('#1e88e5'); G.carFast = car('#e53935');
  return G;
}
