// Blocky avatar builder: rounded-box body parts, spiky hair, outfits and drawn face expressions.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const geoCache = new Map();
function rbox(w, h, d, r = 0.08) {
  const k = `${w},${h},${d},${r}`;
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, r));
  return geoCache.get(k);
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.62, metalness: o.metal ?? 0, emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m;
}
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// ---------------- faces ----------------
// expression: neutral | determined | worried | surprised | smile | scared | sleep | sad | angry | blind | open
function drawFace(ctx, expr, o = {}) {
  const S = 512; ctx.clearRect(0, 0, S, S);
  const ink = '#111'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const eyeY = 230, ex = 105;
  const brow = (s, tilt, y = 165, len = 78, w = 18) => { // tilt>0: inner end down (angry)
    ctx.strokeStyle = o.browColor || ink; ctx.lineWidth = w; ctx.beginPath();
    const xi = 256 + s * 40, xo = 256 + s * (40 + len);
    ctx.moveTo(xo, y - tilt * 0.4); ctx.lineTo(xi, y + tilt); ctx.stroke();
  };
  const eye = (s, h = 1, lid = 0, pupil = 1) => {
    const cx = 256 + s * ex, w = 62, hh = 46 * h;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, eyeY, w, hh, 0, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
    ctx.fillStyle = o.iris || ink; ctx.beginPath(); ctx.ellipse(cx - s * 10, eyeY + 4, 30 * pupil, 36 * pupil, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - s * 18, eyeY - 12, 9 * pupil, 0, Math.PI * 2); ctx.fill();
    if (lid > 0) { ctx.fillStyle = o.skin || '#f3e6d6'; ctx.fillRect(cx - w - 2, eyeY - hh - 2, w * 2 + 4, hh * 2 * lid); }
    ctx.restore();
    ctx.strokeStyle = ink; ctx.lineWidth = 12; ctx.beginPath(); ctx.ellipse(cx, eyeY, w, hh, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
    if (lid > 0) { ctx.beginPath(); ctx.moveTo(cx - w, eyeY - hh + hh * 2 * lid); ctx.lineTo(cx + w, eyeY - hh + hh * 2 * lid - s * 0); ctx.lineWidth = 12; ctx.stroke(); }
  };
  const mouthLine = (w = 40, y = 360, curve = 0) => { ctx.strokeStyle = ink; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(256 - w, y); ctx.quadraticCurveTo(256, y + curve, 256 + w, y); ctx.stroke(); };
  const mouthOpen = (w, h, y = 360) => { ctx.fillStyle = '#3a1418'; ctx.beginPath(); ctx.ellipse(256, y, w, h, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 9; ctx.stroke(); };
  if (o.blush) { ctx.fillStyle = 'rgba(240,120,120,0.35)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(256 + s * 120, 300, 36, 18, 0, 0, Math.PI * 2); ctx.fill(); } }
  if (o.wrinkles) { ctx.strokeStyle = 'rgba(80,60,50,0.55)'; ctx.lineWidth = 5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(256 + s * 150, 250); ctx.lineTo(256 + s * 178, 262); ctx.stroke(); ctx.beginPath(); ctx.moveTo(256 + s * 70, 330); ctx.quadraticCurveTo(256 + s * 90, 370, 256 + s * 70, 395); ctx.stroke(); } }
  switch (expr) {
    case 'determined': brow(-1, 26); brow(1, 26); eye(-1, 0.75, 0.35); eye(1, 0.75, 0.35); mouthLine(34, 365, -2); break;
    case 'angry': brow(-1, 40); brow(1, 40); eye(-1, 0.7, 0.4, 0.8); eye(1, 0.7, 0.4, 0.8); mouthOpen(40, 14, 368); break;
    case 'worried': brow(-1, -26, 160); brow(1, -26, 160); eye(-1, 0.95, 0.1, 0.85); eye(1, 0.95, 0.1, 0.85); ctx.strokeStyle = ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(220, 368); ctx.quadraticCurveTo(238, 356, 256, 368); ctx.quadraticCurveTo(274, 380, 292, 366); ctx.stroke(); break;
    case 'surprised': brow(-1, -10, 140); brow(1, -10, 140); eye(-1, 1.25, 0, 0.6); eye(1, 1.25, 0, 0.6); mouthOpen(24, 30, 372); break;
    case 'scared': brow(-1, -30, 145); brow(1, -30, 145); eye(-1, 1.2, 0, 0.45); eye(1, 1.2, 0, 0.45); mouthOpen(40, 26, 372); break;
    case 'smile': brow(-1, -6); brow(1, -6); for (const s of [-1, 1]) { ctx.strokeStyle = ink; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(256 + s * ex, eyeY + 20, 42, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); } ctx.fillStyle = '#3a1418'; ctx.beginPath(); ctx.moveTo(206, 345); ctx.quadraticCurveTo(256, 420, 306, 345); ctx.closePath(); ctx.fill(); break;
    case 'open': brow(-1, 0); brow(1, 0); eye(-1, 1, 0.1); eye(1, 1, 0.1); mouthOpen(34, 22, 368); break;
    case 'sleep': brow(-1, -8, 175); brow(1, -8, 175); for (const s of [-1, 1]) { ctx.strokeStyle = ink; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(256 + s * ex, eyeY - 14, 46, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); } mouthLine(26, 368, 0); break;
    case 'sad': brow(-1, -22, 168); brow(1, -22, 168); eye(-1, 0.8, 0.3, 0.8); eye(1, 0.8, 0.3, 0.8); mouthLine(32, 372, -16);
      if (o.tear) { ctx.fillStyle = 'rgba(140,200,255,0.9)'; ctx.beginPath(); ctx.ellipse(256 + ex + 20, 300, 10, 22, 0, 0, Math.PI * 2); ctx.fill(); } break;
    case 'blind': mouthLine(30, 372, o.smirk ? -10 : 0); break;
    case 'grin': brow(-1, 18); brow(1, 18); eye(-1, 0.7, 0.3); eye(1, 0.7, 0.3); ctx.fillStyle = '#fff'; ctx.strokeStyle = ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(190, 345); ctx.quadraticCurveTo(256, 410, 322, 345); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    default: brow(-1, 8); brow(1, 8); eye(-1, 0.85, 0.2); eye(1, 0.85, 0.2); mouthLine(26, 368, 0);
  }
  if (o.marks) { // dark marks under the eyes (possessed look)
    ctx.strokeStyle = '#111'; ctx.lineWidth = 8;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(256 + s * 60, 300); ctx.lineTo(256 + s * 150, 300); ctx.stroke(); ctx.beginPath(); ctx.moveTo(256 + s * 75, 318); ctx.lineTo(256 + s * 135, 318); ctx.stroke(); }
  }
}

// ---------------- hair ----------------
function spikyHair(color, o = {}) {
  const g = new THREE.Group(); const r = rng(o.seed || 1);
  const m = mat(color, { rough: 0.5, emissive: o.emissive || 0x000000, ei: 0.35 });
  const cap = mesh(new THREE.SphereGeometry(0.76, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), m, 0, 0.3, -0.04);
  cap.scale.set(1.0, 0.75, 1.0); g.add(cap);
  const back = mesh(rbox(1.42, 0.9, 0.5, 0.2), m, 0, 0.05, -0.45); g.add(back);
  for (const s of [-1, 1]) g.add(mesh(rbox(0.22, 0.75, 0.85, 0.1), m, s * 0.68, 0.12, -0.12));
  const n = o.count || 70, up = o.up ?? 1;
  let made = 0, guard = 0;
  while (made < n && guard++ < 2000) {
    const d = new THREE.Vector3(r() * 2 - 1, r() * 1.3 - 0.25, r() * 2 - 1);
    if (d.length() < 0.2) continue; d.normalize();
    if (d.z > 0.35 && d.y < 0.55) continue;          // keep the face clear (fringe handles the front)
    if (d.y < -0.1 && d.z > -0.2) continue;           // nothing below the ears at the sides/front
    const len = (o.len || 0.6) * (0.65 + r() * 0.7), rad = (o.thick || 0.17) * (0.75 + r() * 0.5);
    const cone = mesh(new THREE.ConeGeometry(rad, len, 5), m);
    const out = new THREE.Vector3(d.x, d.y * up + 0.25 * up, d.z).add(new THREE.Vector3((r() - 0.5) * 0.5, (r() - 0.5) * 0.4, (r() - 0.5) * 0.5)).normalize();
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), out);
    cone.position.copy(d.clone().multiplyScalar(0.62)).add(out.clone().multiplyScalar(len * 0.38)).add(new THREE.Vector3(0, 0.1, -0.04));
    g.add(cone); made++;
  }
  const nf = o.fringeCount ?? 8;
  for (let i = 0; i < nf; i++) { // fringe locks falling over the forehead
    const x = -0.52 + i * (1.04 / (nf - 1)) + (r() - 0.5) * 0.08, len = 0.45 + r() * 0.18;
    const cone = mesh(new THREE.ConeGeometry(0.2, len, 5), m);
    const dir = new THREE.Vector3(x * 0.4 + (r() - 0.5) * 0.4, -1, 0.8 + r() * 0.3).normalize();
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    cone.position.set(x, 0.6, 0.6).add(dir.clone().multiplyScalar(len * 0.45));
    g.add(cone);
  }
  return g;
}
function shortHair(color, o = {}) {
  const g = new THREE.Group(); const m = mat(color, { rough: 0.6 });
  const cap = mesh(new THREE.SphereGeometry(0.7, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), m, 0, 0.2, -0.03); cap.scale.set(1.02, 0.85, 1.02); g.add(cap);
  const back = mesh(rbox(1.32, 0.7, 0.4, 0.15), m, 0, 0.05, -0.48); g.add(back);
  if (o.bald) { g.remove(cap); for (const s of [-1, 1]) g.add(mesh(rbox(0.25, 0.5, 0.9, 0.1), m, s * 0.62, 0.0, -0.1)); }
  if (o.long) { const l = mesh(rbox(1.4, 1.2, 0.35, 0.15), m, 0, -0.35, -0.5); g.add(l); for (const s of [-1, 1]) g.add(mesh(rbox(0.25, 1.1, 0.7, 0.1), m, s * 0.66, -0.3, -0.1)); }
  if (o.fringe) { const f = mesh(rbox(1.25, 0.3, 0.3, 0.12), m, 0, 0.45, 0.5); g.add(f); }
  return g;
}

// ---------------- avatar ----------------
export const SPECS = {
  hero: { skin: 0xf2e3d2, hair: { style: 'spiky', color: 0x2b31c4, emissive: 0x161a8a, seed: 3, len: 0.6, up: 0.35, count: 95, thick: 0.2, fringeCount: 9 }, top: 0x1d1d28, collar: 0xc8202a, cuffs: 0xc8202a, pants: 0x1d1d28, shoes: 0x0c0c10, iris: '#14163a' },
  grandpa: { skin: 0xe8d2bc, hair: { style: 'short', color: 0xbfbfbf, bald: true }, top: 0xd9d2c0, pants: 0xcfc8b4, shoes: 0x6a5a48, mustache: 0xc9c9c9, wrinkles: true, scale: 0.97 },
  mentor: { skin: 0xf4e8dc, hair: { style: 'spiky', color: 0xf2f4ff, emissive: 0x6670b0, seed: 9, len: 0.75, count: 80, up: 1.6, fringeCount: 0 }, top: 0x1a1a24, collar: 0x1a1a24, highCollar: true, pants: 0x1a1a24, shoes: 0x0a0a0d, blindfold: true, scale: 1.1 },
  studentA: { skin: 0xf0dfcc, hair: { style: 'spiky', color: 0x16120f, seed: 5, len: 0.45, count: 50 }, top: 0x111116, collar: 0x111116, buttons: true, pants: 0x111116, shoes: 0x0c0c10 },
  studentB: { skin: 0xf2e2d0, hair: { style: 'short', color: 0x2a1a12, fringe: true }, top: 0x1b1e33, shirt: 0xf2f2f2, bow: 0xa0202a, pants: 0x1b1e33, shoes: 0x0c0c10 },
  studentC: { skin: 0xeedbc6, hair: { style: 'short', color: 0x3a2418, long: true, fringe: true }, top: 0x1b1e33, shirt: 0xf2f2f2, bow: 0xa0202a, pants: 0x262a45, skirt: true, shoes: 0x0c0c10 },
  adult: { skin: 0xead6c0, hair: { style: 'short', color: 0x1e1a18 }, top: 0x3b3f4a, shirt: 0xe8e8e8, tie: 0x6a1f24, pants: 0x2a2d35, shoes: 0x1a1410 },
};

export function makeAvatar(spec) {
  const root = new THREE.Group();
  const skin = mat(spec.skin, { rough: 0.6 });
  const top = mat(spec.top), pants = mat(spec.pants), shoes = mat(spec.shoes, { rough: 0.4 });
  const parts = {};
  // hips pivot at y=2
  const hips = new THREE.Group(); hips.position.y = 2; root.add(hips); parts.hips = hips;
  // legs (pivot at hip)
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * 0.5, 0, 0); hips.add(leg);
    leg.add(mesh(rbox(0.96, 1.7, 0.98, 0.1), pants, 0, -0.85, 0));
    leg.add(mesh(rbox(1.0, 0.36, 1.08, 0.12), shoes, 0, -1.82, 0.04));
    parts[s < 0 ? 'legL' : 'legR'] = leg;
  }
  // torso
  const torso = new THREE.Group(); hips.add(torso); parts.torso = torso;
  torso.add(mesh(rbox(2.0, 2.0, 1.0, 0.1), top, 0, 1.0, 0));
  if (spec.skirt) { const sk = mesh(new THREE.CylinderGeometry(1.05, 1.3, 0.9, 16), mat(spec.pants), 0, -0.3, 0); sk.scale.z = 0.62; hips.add(sk); }
  if (spec.shirt) { torso.add(mesh(new THREE.BoxGeometry(0.7, 0.9, 0.04), mat(spec.shirt), 0, 1.5, 0.51)); }
  if (spec.bow) { const b = mat(spec.bow); for (const s of [-1, 1]) { const w = mesh(new THREE.ConeGeometry(0.2, 0.4, 4), b, s * 0.18, 1.78, 0.56); w.rotation.z = s * Math.PI / 2; torso.add(w); } }
  if (spec.tie) torso.add(mesh(rbox(0.22, 0.9, 0.06, 0.03), mat(spec.tie), 0, 1.45, 0.54));
  if (spec.buttons) { const gold = mat(0xd4a93a, { metal: 0.8, rough: 0.3 }); for (let i = 0; i < 4; i++) torso.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), gold, 0, 1.75 - i * 0.42, 0.53)); }
  if (spec.collar) { // high collar ring
    const c = mesh(new THREE.CylinderGeometry(0.62, 0.7, spec.highCollar ? 0.75 : 0.42, 20, 1, true), mat(spec.collar, { rough: 0.6 }), 0, spec.highCollar ? 2.25 : 2.12, 0.02);
    c.material.side = THREE.DoubleSide; c.scale.z = 0.85; torso.add(c);
    if (spec.collar === 0xc8202a) { const hood = mesh(rbox(1.6, 0.35, 1.1, 0.15), mat(spec.collar), 0, 2.02, -0.05); torso.add(hood); }
  }
  // arms (pivot at shoulder)
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * 1.5, 1.85, 0); torso.add(arm);
    arm.add(mesh(rbox(0.96, 1.6, 0.98, 0.1), top, 0, -0.65, 0));
    if (spec.cuffs) arm.add(mesh(rbox(1.0, 0.22, 1.02, 0.06), mat(spec.cuffs), 0, -1.35, 0));
    arm.add(mesh(rbox(0.9, 0.5, 0.92, 0.12), skin, 0, -1.65, 0));
    parts[s < 0 ? 'armL' : 'armR'] = arm;
  }
  // head (pivot at neck)
  const neck = new THREE.Group(); neck.position.y = 2.05; torso.add(neck); parts.neck = neck;
  const head = new THREE.Group(); head.position.y = 0.72; neck.add(head); parts.head = head;
  head.add(mesh(rbox(1.3, 1.3, 1.25, 0.32), skin));
  // face
  const fc = document.createElement('canvas'); fc.width = fc.height = 512;
  const fctx = fc.getContext('2d'); const ftex = new THREE.CanvasTexture(fc); ftex.colorSpace = THREE.SRGBColorSpace; ftex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 1.18), new THREE.MeshStandardMaterial({ map: ftex, transparent: true, roughness: 0.7 }));
  face.position.set(0, -0.02, 0.628); head.add(face);
  const faceOpts = { skin: '#' + new THREE.Color(spec.skin).getHexString(), iris: spec.iris, wrinkles: spec.wrinkles };
  let curExpr = null;
  const setExpression = (e, extra = {}) => { const k = e + JSON.stringify(extra); if (k === curExpr) return; curExpr = k; drawFace(fctx, spec.blindfold ? 'blind' : e, { ...faceOpts, ...extra }); ftex.needsUpdate = true; };
  setExpression('neutral');
  // hair
  const h = spec.hair;
  if (h) { const hg = h.style === 'spiky' ? spikyHair(h.color, h) : shortHair(h.color, h); hg.position.y = 0.05; head.add(hg); }
  if (spec.blindfold) { const bf = mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.36, 24), mat(0x0b0b0e, { rough: 0.5 }), 0, 0.1, 0); bf.scale.z = 0.93; head.add(bf); }
  if (spec.mustache) { const mm = mat(spec.mustache); for (const s of [-1, 1]) { const ms = mesh(rbox(0.38, 0.12, 0.1, 0.05), mm, s * 0.17, -0.25, 0.64); ms.rotation.z = s * -0.25; head.add(ms); } }
  if (spec.scale) root.scale.setScalar(spec.scale);
  root.userData = { parts, setExpression, spec };
  return root;
}

// pose helper: angles in radians; missing keys reset to 0
export function pose(av, p = {}) {
  const P = av.userData.parts;
  const set = (o, v) => o.rotation.set(v?.[0] || 0, v?.[1] || 0, v?.[2] || 0);
  set(P.armL, p.armL); set(P.armR, p.armR); set(P.legL, p.legL); set(P.legR, p.legR);
  set(P.neck, p.head); set(P.torso, p.torso);
  P.hips.position.y = 2 + (p.bob || 0);
}
// walk/run cycle
export function walk(av, t, speed = 1, amp = 0.6, extra = {}) {
  const s = Math.sin(t * speed * Math.PI * 2);
  pose(av, { armL: [s * amp, 0, -0.05], armR: [-s * amp, 0, 0.05], legL: [-s * amp, 0, 0], legR: [s * amp, 0, 0], bob: Math.abs(s) * 0.08 * amp, ...extra });
}
