// Décors : chambre de nuit, rue pluvieuse devant la fenêtre, téléphone et mains en gros plan.
import * as THREE from 'three';
import { box, mat, glow, prism, plane, canvasTex, Character, FONT, hash, V3 } from './lib.js';

export const frac = (x) => x - Math.floor(x);

export function makeCast() {
  const C = {};
  C.moi = new Character({ skin: '#f3ebe4', shirt: '#4a4e69', pants: '#22223b', shoes: '#111', longHair: '#121016', scale: 1.0 });
  C.owen = new Character({ skin: '#f5efe9', shirt: '#6b705c', pants: '#3a3a3a', shoes: '#222', puffyHair: '#8a3b1f', scale: 1.05 });
  C.ombre = new Character({ skin: '#d9d9de', shirt: '#121214', sleeve: '#121214', pants: '#2b2b30', shoes: '#0a0a0a', hood: '#0d0d10', hair: '#3a3a3a', scale: 1.05 });
  return C;
}

// main blocky blanche (avec ou sans bague)
export function makeHand(color = '#f5efe9', ring = true) {
  const g = new THREE.Group();
  box(g, 1.0, 1.1, 0.42, color, 0, 0, 0);
  for (let k = 0; k < 4; k++) box(g, 0.21, 0.62, 0.36, color, -0.37 + k * 0.245, 0.86, 0);
  const th = box(g, 0.26, 0.6, 0.34, color, -0.62, 0.15, 0.05); th.rotation.z = 0.6;
  box(g, 0.9, 0.55, 0.4, color, 0, -0.8, 0); // poignet
  if (ring) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 8, 24), mat('#e3e7ec', { metalness: 1, roughness: 0.18 }));
    r.rotation.x = Math.PI / 2; r.position.set(0.37 - 0.245, 0.72, 0); g.add(r);
    const gem = box(g, 0.08, 0.08, 0.08, mat('#ffffff', { metalness: 1, roughness: 0.05 }), 0.37 - 0.245, 0.72, 0.2, false);
    g.ring = r;
  }
  return g;
}

export function rainGlassTex() {
  return canvasTex(256, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let k = 0; k < 140; k++) {
      const x = hash(k) * w, y = hash(k + 1) * h, r = 1.5 + hash(k + 2) * 4;
      ctx.fillStyle = 'rgba(200,225,255,.35)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.3, 0, 0, 7); ctx.fill();
      if (hash(k + 3) > 0.7) { ctx.fillStyle = 'rgba(200,225,255,.18)'; ctx.fillRect(x - 1, y, 2, 20 + hash(k + 4) * 60); }
    }
  });
}

export function makeHouse(scene) {
  const W = new THREE.Group(); scene.add(W);
  const R = { group: W };
  // ---- chambre (x -5..5, z -6..6, y 0..6) ----
  const wallM = mat('#2b2f45', { roughness: 0.9 });
  const fl = canvasTex(256, 256, (ctx, w) => { for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#5a3d2b' : '#6b4a35'; ctx.fillRect(0, i * 32, w, 32); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, i * 32, w, 2); ctx.fillRect(((i * 97) % 256), i * 32, 2, 32); } });
  fl.wrapS = fl.wrapT = THREE.RepeatWrapping; fl.repeat.set(3, 3);
  const floor = plane(W, 10, 12, new THREE.MeshStandardMaterial({ map: fl, roughness: 0.6 }), 0, 0.01, 0); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  box(W, 10.4, 6, 0.3, wallM, 0, 3, -6.15);                // fond
  box(W, 0.3, 6, 12.6, wallM, -5.15, 3, 0);                // gauche
  box(W, 10.4, 6, 0.3, wallM, 0, 3, 6.15);                 // avant (hors champ)
  box(W, 10.6, 0.3, 12.6, '#1f2233', 0, 6.15, 0);          // plafond
  // mur droit (x=5) avec fenêtre z -4.6..-1.4, y 1.6..4.4
  const wx = 5.15;
  box(W, 0.3, 6, 1.4, wallM, wx, 3, -5.3); box(W, 0.3, 6, 7.4, wallM, wx, 3, 2.3);
  box(W, 0.3, 1.6, 3.2, wallM, wx, 0.8, -3); box(W, 0.3, 1.6, 3.2, wallM, wx, 5.2, -3);
  // façade extérieure (bardage)
  const sid = canvasTex(128, 128, (ctx, w) => { ctx.fillStyle = '#4b5d73'; ctx.fillRect(0, 0, w, w); ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let y = 0; y < w; y += 16) ctx.fillRect(0, y, w, 3); });
  sid.wrapS = sid.wrapT = THREE.RepeatWrapping; sid.repeat.set(4, 3);
  const sm = new THREE.MeshStandardMaterial({ map: sid, roughness: 0.6 });
  box(W, 0.1, 7, 1.4, sm, 5.35, 3.5, -5.3); box(W, 0.1, 7, 9.4, sm, 5.35, 3.5, 3.3); box(W, 0.1, 1.6, 3.2, sm, 5.35, 0.8, -3); box(W, 0.1, 2.6, 3.2, sm, 5.35, 5.7, -3);
  prism(W, 1, 1, 1, '#2b2d42', 0, 0, 0).visible = false;
  box(W, 2.4, 1.2, 14, '#2b2d42', 4.8, 7.4, 0).rotation.z = -0.5; // toit
  // cadre de fenêtre
  const frameM = mat('#e9ecef', { roughness: 0.5 });
  for (const [y, h] of [[1.55, 0.14], [4.45, 0.14]]) { box(W, 0.4, h, 3.4, frameM, wx, y, -3); }
  for (const z of [-4.65, -1.35, -3]) box(W, 0.4, 3, z === -3 ? 0.08 : 0.14, frameM, wx, 3, z);
  box(W, 0.7, 0.12, 3.6, frameM, wx - 0.2, 1.45, -3); // rebord
  R.glass = box(W, 0.04, 2.8, 3.2, new THREE.MeshPhysicalMaterial({ color: '#9fc4e8', transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0, clearcoat: 1 }), wx + 0.05, 3, -3, false);
  R.rainTex = rainGlassTex(); R.rainTex.wrapT = THREE.RepeatWrapping;
  R.rainGlass = plane(W, 3.2, 2.8, new THREE.MeshBasicMaterial({ map: R.rainTex, transparent: true, depthWrite: false }), wx - 0.02, 3, -3);
  R.rainGlass.rotation.y = -Math.PI / 2;
  const rg2 = plane(W, 3.2, 2.8, new THREE.MeshBasicMaterial({ map: R.rainTex, transparent: true, depthWrite: false }), wx + 0.1, 3, -3); rg2.rotation.y = Math.PI / 2;
  // rideaux entrouverts
  const curM = mat('#5c2a3a', { roughness: 0.95 });
  R.curtains = [];
  for (const [z0, dir] of [[-4.9, 1], [-1.1, -1]]) {
    const g = new THREE.Group(); g.position.set(wx - 0.35, 0, z0); W.add(g);
    for (let k = 0; k < 4; k++) box(g, 0.18, 4.4, 0.3, curM, (k % 2) * 0.1, 3.05, dir * k * 0.26);
    R.curtains.push(g);
  }
  box(W, 0.1, 0.1, 4.6, '#adb5bd', wx - 0.35, 5.3, -3);
  // lit double
  const bed = new THREE.Group(); bed.position.set(0, 0, -3); W.add(bed); R.bed = bed;
  box(bed, 4.6, 0.6, 5.2, '#3d2b1f', 0, 0.45, 0);
  box(bed, 4.4, 0.5, 5.0, '#d8d8e0', 0, 1.0, 0);
  box(bed, 4.8, 2.6, 0.3, '#3d2b1f', 0, 1.6, -2.65);
  box(bed, 1.6, 0.4, 0.9, '#e9ecef', -1.05, 1.42, -2.05); box(bed, 1.6, 0.4, 0.9, '#e9ecef', 1.05, 1.42, -2.05);
  R.blanketM = mat('#1b2a5a', { roughness: 0.92 });
  R.blanket = box(bed, 4.5, 0.42, 3.4, R.blanketM, 0, 1.42, 0.85);
  R.lumps = [box(bed, 1.4, 0.3, 2.6, R.blanketM, -1.05, 1.6, 0.9), box(bed, 1.5, 0.32, 2.8, R.blanketM, 1.05, 1.62, 0.8)];
  box(bed, 4.5, 0.1, 0.8, '#2a3b75', 0, 1.65, -0.7); // revers
  // table de chevet + réveil
  const ns = new THREE.Group(); ns.position.set(-3.4, 0, -5.2); W.add(ns);
  box(ns, 1.3, 1.3, 1.1, '#3d2b1f', 0, 0.65, 0); box(ns, 1.1, 0.1, 0.05, '#c9a227', 0, 0.9, 0.56, false);
  box(ns, 0.95, 0.5, 0.45, '#111', 0, 1.55, 0.05);
  R.clockTex = canvasTex(256, 128, (ctx, w, h) => drawClock(ctx, w, h, '3:17'));
  R.clockFace = plane(ns, 0.85, 0.42, new THREE.MeshBasicMaterial({ map: R.clockTex }), 0, 1.55, 0.285);
  R.clockLight = new THREE.PointLight('#ff2020', 3, 4, 1.8); R.clockLight.position.set(-3.4, 1.7, -4.6); W.add(R.clockLight);
  box(ns, 0.3, 0.6, 0.3, '#adb5bd', 0.35, 1.6, -0.3); // lampe éteinte
  // décor
  const rug = plane(W, 4.5, 3, mat('#3a2e5a'), 0, 0.02, 1.8); rug.rotation.x = -Math.PI / 2;
  box(W, 0.15, 3.6, 1.8, '#3d2b1f', -5.0, 1.8, 2.5); // porte
  box(W, 0.2, 0.2, 0.2, '#c9a227', -4.88, 1.8, 1.8, false);
  const poster = canvasTex(256, 360, (ctx, w, h) => { ctx.fillStyle = '#1b1b2f'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#e94560'; ctx.beginPath(); ctx.arc(w / 2, h * 0.4, 70, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `48px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('NIGHT', w / 2, h * 0.85); });
  plane(W, 1.4, 2, new THREE.MeshStandardMaterial({ map: poster }), -2.0, 3.9, -5.99);
  box(W, 2.2, 0.12, 0.6, '#3d2b1f', -4.6, 3.6, -1.5).rotation.y = Math.PI / 2;
  for (let k = 0; k < 5; k++) box(W, 0.4, 0.5 + hash(k) * 0.3, 0.25, ['#e63946', '#457b9d', '#f1faee', '#2a9d8f', '#ffb703'][k], -4.6, 3.95, -2.4 + k * 0.42);
  // ---- extérieur (x > 5.4) ----
  const ext = new THREE.Group(); W.add(ext); R.ext = ext;
  R.wetM = new THREE.MeshPhysicalMaterial({ color: '#1e2a22', roughness: 0.25, metalness: 0.1, clearcoat: 0.8 });
  const lawn = plane(ext, 8, 40, R.wetM, 9.4, 0.0, -2); lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true;
  const walk = plane(ext, 2.6, 40, new THREE.MeshPhysicalMaterial({ color: '#5a5f66', roughness: 0.15, clearcoat: 1 }), 14.7, 0.02, -2); walk.rotation.x = -Math.PI / 2; walk.receiveShadow = true;
  const road = plane(ext, 14, 60, new THREE.MeshPhysicalMaterial({ color: '#202228', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }), 23, 0.0, -2); road.rotation.x = -Math.PI / 2; road.receiveShadow = true;
  for (let z = -30; z < 30; z += 6) box(ext, 0.25, 0.02, 3, '#d9d9a0', 23, 0.02, z, false);
  for (let k = 0; k < 8; k++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.6 + hash(k) * 1.2, 16), new THREE.MeshPhysicalMaterial({ color: '#0c0f14', roughness: 0.0, metalness: 0.6 })); p.rotation.x = -Math.PI / 2; p.position.set(8 + hash(k + 1) * 18, 0.03, -12 + hash(k + 2) * 20); ext.add(p); }
  // buissons, boîte aux lettres, nain de jardin
  for (const [x, z, s] of [[7.0, -6.2, 1.2], [6.8, 0.6, 1.0], [7.2, 2.6, 1.3], [7.4, -8.4, 1.1]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat('#1f4d2b', { flatShading: true })); b.position.set(x, s * 0.7, z); b.castShadow = true; ext.add(b);
  }
  const mb = new THREE.Group(); mb.position.set(12.8, 0, 1.5); ext.add(mb);
  box(mb, 0.18, 1.5, 0.18, '#3d2b1f', 0, 0.75, 0); box(mb, 0.6, 0.55, 1.0, '#2b4c7e', 0, 1.7, 0); box(mb, 0.06, 0.4, 0.06, '#e63946', 0.32, 2.0, 0.3);
  const gn = new THREE.Group(); gn.position.set(7.6, 0, -1.4); gn.rotation.y = -Math.PI / 2; ext.add(gn); R.gnome = gn;
  box(gn, 0.5, 0.5, 0.4, '#2b6cb0', 0, 0.25, 0); box(gn, 0.42, 0.35, 0.36, '#f1c27d', 0, 0.68, 0);
  box(gn, 0.4, 0.3, 0.12, '#f8f9fa', 0, 0.55, 0.2);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 4), mat('#c1121f', { flatShading: true })); hat.position.y = 1.1; hat.rotation.y = Math.PI / 4; gn.add(hat);
  box(gn, 0.06, 0.06, 0.02, '#111', -0.1, 0.72, 0.19, false); box(gn, 0.06, 0.06, 0.02, '#111', 0.1, 0.72, 0.19, false);
  // lampadaire
  box(ext, 0.25, 7, 0.25, '#2b2d42', 15.8, 3.5, -9); box(ext, 1.6, 0.2, 0.3, '#2b2d42', 15.1, 7, -9);
  R.lampHead = box(ext, 0.7, 0.3, 0.6, glow('#ffc078', 2.5), 14.4, 6.85, -9, false);
  R.streetLight = new THREE.SpotLight('#ffb062', 260, 40, 0.9, 0.6, 1.4); R.streetLight.position.set(14.4, 6.7, -9); R.streetLight.target.position.set(11, 0, -4); R.streetLight.castShadow = true; R.streetLight.shadow.mapSize.set(1024, 1024); ext.add(R.streetLight); ext.add(R.streetLight.target);
  // maisons d'en face
  for (const [z, c] of [[-14, '#3a3f58'], [-4, '#4a3b4f'], [6, '#2f4a4a']]) {
    const g = new THREE.Group(); g.position.set(34, 0, z); ext.add(g);
    box(g, 8, 6, 8, c, 0, 3, 0); prism(g, 9, 3, 8.6, '#1f2233', 0, 6, 0);
    for (const dz of [-2, 2]) box(g, 0.1, 1.2, 1.2, hash(z + dz) > 0.6 ? glow('#ffcf6e', 1.2) : mat('#14161f'), -4.05, 3, dz, false);
  }
  // pluie (segments)
  const N = 1800; const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
  R.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#9fb7d6', transparent: true, opacity: 0.55 }));
  R.rain.frustumCulled = false; W.add(R.rain);
  // éclairage nocturne
  R.moon = new THREE.DirectionalLight('#7f9cff', 0.9); R.moon.position.set(40, 30, 10); R.moon.target.position.set(0, 0, -3); R.moon.castShadow = true;
  R.moon.shadow.mapSize.set(2048, 2048); const sc = R.moon.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 20; sc.bottom = -20; sc.far = 120; R.moon.shadow.bias = -0.0005;
  W.add(R.moon); W.add(R.moon.target);
  R.phoneLight = new THREE.PointLight('#9fd8ff', 6, 5, 1.6); W.add(R.phoneLight);
  return R;
}

export function drawClock(ctx, w, h, text) {
  ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ff1f1f'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 18;
  ctx.font = `bold 104px "DejaVu Sans Mono", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2 + 4); ctx.shadowBlur = 0;
  ctx.fillStyle = '#5a0a0a'; ctx.font = `bold 22px "DejaVu Sans", sans-serif`; ctx.fillText('AM', w - 26, 22);
}

export function updateRain(R, t, center, size = 30) {
  const a = R.rain.geometry.attributes.position; const n = a.count / 2;
  for (let k = 0; k < n; k++) {
    const x = center.x + (hash(k * 3) - 0.5) * size, z = center.z + (hash(k * 7) - 0.5) * size;
    const H = 14; const y = H - frac(hash(k + 1) + t * (1.4 + hash(k) * 0.4)) * H;
    const o = k * 6;
    a.array[o] = x; a.array[o + 1] = y; a.array[o + 2] = z;
    a.array[o + 3] = x - 0.05; a.array[o + 4] = y - 0.7; a.array[o + 5] = z;
  }
  a.needsUpdate = true;
}

// plateau des gros plans (téléphone tenu, mains jointes), loin de la chambre
export function makeCloseSet(scene) {
  const S = new THREE.Group(); S.position.set(300, 0, 0); scene.add(S);
  const fab = canvasTex(256, 256, (ctx, w) => { ctx.fillStyle = '#16224a'; ctx.fillRect(0, 0, w, w); for (let k = 0; k < 400; k++) { ctx.fillStyle = `rgba(255,255,255,${0.02 + hash(k) * 0.03})`; ctx.fillRect(hash(k + 1) * w, hash(k + 2) * w, 3, 3); } ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3; for (let y = 0; y < w; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 8); ctx.stroke(); } });
  fab.wrapS = fab.wrapT = THREE.RepeatWrapping; fab.repeat.set(4, 4);
  const bg = plane(S, 30, 30, new THREE.MeshStandardMaterial({ map: fab, roughness: 0.95 }), 0, 0, -3);
  // fold de couverture
  const fold = box(S, 20, 1.2, 3, mat('#1b2a5a', { roughness: 0.95 }), 0, -6.5, -1.6); fold.rotation.x = 0.4;
  // téléphone
  const P = new THREE.Group(); S.add(P);
  box(P, 3.3, 6.6, 0.32, mat('#0e0e12', { metalness: 0.6, roughness: 0.3 }), 0, 0, 0);
  const scr = canvasTex(720, 1480, () => {});
  const screen = plane(P, 3.06, 6.3, new THREE.MeshBasicMaterial({ map: scr, toneMapped: false }), 0, 0, 0.17);
  box(P, 0.6, 0.12, 0.05, '#222', 0, 2.98, 0.17, false);
  const hand = makeHand('#f3ebe4', false); hand.scale.setScalar(1.1); hand.position.set(0.9, -3.9, 0.3); hand.rotation.set(0, 0, 0.25); P.add(hand);
  const fingers = makeHand('#f3ebe4', false); fingers.scale.setScalar(1.2); fingers.position.set(-1.8, 0.4, -0.3); fingers.rotation.set(0, 0.2, -1.45); P.add(fingers);
  const pl = new THREE.PointLight('#bfe6ff', 30, 12, 1.5); pl.position.set(0, 0, 3); P.add(pl);
  // mains jointes (gros plan bague)
  const J = new THREE.Group(); J.position.set(40, 0, 0); S.add(J);
  plane(S, 30, 30, new THREE.MeshStandardMaterial({ map: fab, roughness: 0.95 }), 40, 0, -3);
  const hm = makeHand('#f3ebe4', false); hm.position.set(-0.9, 0, 0); hm.rotation.set(0.2, 0.2, -1.3); J.add(hm);
  const ho = makeHand('#f5efe9', true); ho.position.set(0.7, 0.1, 0.35); ho.rotation.set(-0.1, -0.3, 1.5); J.add(ho);
  const cover = box(J, 8, 1.4, 3, mat('#1b2a5a', { roughness: 0.95 }), 0, -1.6, 0.6); cover.rotation.x = -0.25;
  const jl = new THREE.PointLight('#9fd8ff', 14, 8, 1.6); jl.position.set(1, 2.5, 3); J.add(jl);
  return { group: S, phone: P, screen: scr, joined: J, ring: ho.ring, ownHand: hm, owenHand: ho };
}
