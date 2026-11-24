// Personnages « dessinés » en 2D, incrustés dans la 3D (panneau toujours tourné vers la caméra).
// Même interface d'animation que Character (lib.js) : root, hips, torso, headG, armL/R, legL/R, at(), walk(), sit()…
// Le dessin est recalculé à partir des rotations des membres (poses), de l'expression et du sens (face / dos).
import * as THREE from 'three';
import { Character } from './lib.js';

const INK = '#141414';
const CW = 512, CH = 1024, PX = 314; // pixels par unité de hauteur
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

function stroke(ctx, pts, w = 10) { ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }

function face(ctx, cx, ey, expr, o) {
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ex = 60;
  const eye = (s, w = 15, h = 22) => { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(cx + s * ex, ey, w, h, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + s * ex + w * 0.35, ey - h * 0.35, Math.max(3, w * 0.3), 0, 7); ctx.fill(); };
  const brow = (s, y, ang, len = 50) => { ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(cx + s * ex - Math.cos(ang) * len / 2, y - s * Math.sin(ang) * len / 2); ctx.lineTo(cx + s * ex + Math.cos(ang) * len / 2, y + s * Math.sin(ang) * len / 2); ctx.stroke(); };
  const mouthArc = (y, r, a0, a1, w = 10) => { ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, y, r, a0, a1); ctx.stroke(); };
  const openMouth = (y, rx, ry, teeth = false) => { ctx.fillStyle = '#5a1420'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, y, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke(); if (teeth) { ctx.fillStyle = '#fff'; ctx.fillRect(cx - rx * 0.7, y - ry + 6, rx * 1.4, ry * 0.4); } };
  switch (expr) {
    case 'happy': eye(-1); eye(1); brow(-1, ey - 55, 0.1); brow(1, ey - 55, 0.1); mouthArc(ey + 25, 55, 0.18 * Math.PI, 0.82 * Math.PI, 11); break;
    case 'laugh': ctx.lineWidth = 10; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * ex, ey + 8, 18, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } ctx.fillStyle = '#5a1420'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx - 70, ey + 45); ctx.lineTo(cx + 70, ey + 45); ctx.arc(cx, ey + 45, 70, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 55, ey + 47, 110, 16); break;
    case 'smirk': case 'smug': eye(-1, 18, 12); eye(1, 18, 12); brow(-1, ey - 45, -0.25); brow(1, ey - 52, 0.3); ctx.fillStyle = '#fff'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx - 65, ey + 55); ctx.quadraticCurveTo(cx + 10, ey + 120, cx + 80, ey + 40); ctx.quadraticCurveTo(cx + 10, ey + 78, cx - 65, ey + 55); ctx.fill(); ctx.stroke(); ctx.lineWidth = 4; for (let k = 1; k < 6; k++) { const x = cx - 65 + k * 24; ctx.beginPath(); ctx.moveTo(x, ey + 60); ctx.lineTo(x + 3, ey + 86); ctx.stroke(); } break;
    case 'evil': eye(-1, 18, 10); eye(1, 18, 10); brow(-1, ey - 38, 0.45); brow(1, ey - 38, 0.45); ctx.fillStyle = '#fff'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(cx - 80, ey + 40); ctx.quadraticCurveTo(cx, ey + 130, cx + 80, ey + 40); ctx.quadraticCurveTo(cx, ey + 75, cx - 80, ey + 40); ctx.fill(); ctx.stroke(); ctx.lineWidth = 4; for (let k = 1; k < 7; k++) { const x = cx - 80 + k * 23; ctx.beginPath(); ctx.moveTo(x, ey + 48); ctx.lineTo(x, ey + 78); ctx.stroke(); } break;
    case 'surprised': for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx + s * ex, ey, 28, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx + s * ex, ey, 10, 0, 7); ctx.fill(); } brow(-1, ey - 62, -0.2); brow(1, ey - 62, -0.2); openMouth(ey + 80, 24, 30); break;
    case 'scared': for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx + s * ex, ey, 30, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx + s * ex, ey + 4, 8, 0, 7); ctx.fill(); } brow(-1, ey - 58, -0.45); brow(1, ey - 58, -0.45); ctx.lineWidth = 9; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const x = cx - 55 + k * 14; const y = ey + 85 + (k % 2 ? -9 : 9); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.fillStyle = '#7fd3ff'; ctx.beginPath(); ctx.ellipse(cx + 135, ey - 40, 12, 20, 0.3, 0, 7); ctx.fill(); break;
    case 'pain': ctx.lineWidth = 11; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * ex - 18 * s, ey - 18); ctx.lineTo(cx + s * ex + 14 * s, ey); ctx.lineTo(cx + s * ex - 18 * s, ey + 18); ctx.stroke(); } openMouth(ey + 75, 30, 18); break;
    case 'determined': eye(-1, 15, 14); eye(1, 15, 14); brow(-1, ey - 35, 0.4); brow(1, ey - 35, 0.4); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(cx - 35, ey + 70); ctx.lineTo(cx + 35, ey + 66); ctx.stroke(); break;
    case 'cry': ctx.lineWidth = 10; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * ex, ey - 4, 18, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); } ctx.fillStyle = '#7fd3ff'; ctx.fillRect(cx - ex - 8, ey + 10, 14, 80); ctx.fillRect(cx + ex - 6, ey + 10, 14, 80); openMouth(ey + 85, 34, 20); break;
    case 'dummy': ctx.lineWidth = 10; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * ex - 18, ey - 18); ctx.lineTo(cx + s * ex + 18, ey + 18); ctx.moveTo(cx + s * ex + 18, ey - 18); ctx.lineTo(cx + s * ex - 18, ey + 18); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(cx - 50, ey + 70); for (let k = 1; k <= 6; k++) ctx.lineTo(cx - 50 + k * 17, ey + 70 + (k % 2 ? -8 : 8)); ctx.stroke(); break;
    default: eye(-1); eye(1); brow(-1, ey - 52, 0.05); brow(1, ey - 52, 0.05); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(cx - 28, ey + 72); ctx.lineTo(cx + 28, ey + 72); ctx.stroke();
  }
}

// p : { expr, back, arms:[{a, fwd}x2], legs:'stand'|'sit', lstep, rstep, nod, tilt, turn }
export function drawFlat(ctx, o, p) {
  ctx.clearRect(0, 0, CW, CH);
  const cx = CW / 2, hr = 150, hy = 75 + hr; // tête
  const tw = 128, tTop = hy + hr - 14, tH = 185, hipY = tTop + tH;
  const legLen = p.legs === 'sit' ? 150 : 985 - hipY;
  // jambes
  for (const [s, step] of [[-1, p.lstep || 0], [1, p.rstep || 0]]) {
    const hx = cx + s * 26;
    let pts;
    if (p.legs === 'sit') pts = [[hx, hipY], [hx + s * 40, hipY + 60], [hx + s * 34, hipY + legLen]];
    else { const kx = hx + s * 10 + step * 26, fy = hipY + legLen - Math.max(0, -step) * 22; pts = [[hx, hipY], [kx, hipY + legLen * 0.5], [hx + s * 18 + step * 12, fy]]; }
    stroke(ctx, pts, 11);
    const [fx, fy] = pts[pts.length - 1]; ctx.fillStyle = o.shoes || INK; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(fx + s * 16, fy + 4, 32, 15, 0, 0, 7); ctx.fill(); ctx.stroke();
  }
  // bras
  const shoulder = (s) => [cx + s * (tw / 2 - 6), tTop + 34];
  const armPts = (s, a) => { const [sx, sy] = shoulder(s); const ang = clamp(a.a, 0, 3.1); const L = a.fwd ? 125 : 160; const dir = (t) => [Math.sin(t) * s, Math.cos(t)]; const e = dir(ang * 0.85 + 0.12); const h = dir(ang * 1.05 + (a.fwd ? 0.35 : 0.1)); return [[sx, sy], [sx + e[0] * L * 0.52, sy + e[1] * L * 0.52], [sx + e[0] * L * 0.52 + h[0] * L * 0.5, sy + e[1] * L * 0.52 + h[1] * L * 0.5]]; };
  const drawArm = (s, a) => { const pts = armPts(s, a); stroke(ctx, pts, 11); const [x, y] = pts[2]; ctx.fillStyle = o.hand || '#ffffff'; ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x, y, 17, 0, 7); ctx.fill(); ctx.stroke(); };
  if (p.back) { drawArm(-1, p.arms[0]); drawArm(1, p.arms[1]); }
  // torse
  ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  const rr = (x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke(); };
  const L = cx - tw / 2;
  if (o.body === 'vest') {
    rr(L, tTop, tw, tH, 30, '#f4f1ea');
    if (!p.back) { ctx.fillStyle = o.vest || '#d8c7a0'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * (tw / 2 - 4), tTop + 18); ctx.lineTo(cx + s * 12, tTop + 100); ctx.lineTo(cx + s * 12, tTop + tH - 4); ctx.lineTo(cx + s * (tw / 2 - 4), tTop + tH - 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = o.tie || '#e8b400'; ctx.beginPath(); ctx.moveTo(cx - 11, tTop + 6); ctx.lineTo(cx + 11, tTop + 6); ctx.lineTo(cx + 16, tTop + 108); ctx.lineTo(cx, tTop + 134); ctx.lineTo(cx - 16, tTop + 108); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.stroke(); }
    else rr(L + 4, tTop + 4, tw - 8, tH - 8, 26, o.vest || '#d8c7a0');
  } else if (o.body === 'overall') {
    rr(L, tTop, tw, tH, 30, o.shirt || '#ffd21f');
    rr(L + 6, tTop + (p.back ? 60 : 72), tw - 12, tH - (p.back ? 60 : 72), 22, o.overall || '#3d6fd6');
    ctx.fillStyle = o.overall || '#3d6fd6'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(cx + s * 36 - 9, tTop + 6, 18, 72, 8); ctx.fill(); ctx.stroke(); }
    if (!p.back) { ctx.fillStyle = '#ffd21f'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 36, tTop + 80, 8, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); } ctx.lineWidth = 8; ctx.strokeRect(cx - 24, tTop + 108, 48, 38); }
  } else if (o.body === 'dress') {
    rr(L + 6, tTop, tw - 12, tH * 0.55, 24, o.shirt);
    ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.moveTo(L + 4, tTop + tH * 0.5); ctx.lineTo(L + tw - 4, tTop + tH * 0.5); ctx.lineTo(L + tw + 30, tTop + tH + 10); ctx.lineTo(L - 30, tTop + tH + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else rr(L, tTop, tw, tH, 30, o.shirt || '#999');
  if (!p.back) { drawArm(-1, p.arms[0]); drawArm(1, p.arms[1]); }
  // tête
  ctx.save(); ctx.translate(cx, hy); ctx.rotate(p.tilt || 0); ctx.translate(-cx, -hy);
  ctx.fillStyle = o.skin || '#ffffff'; ctx.lineWidth = 13; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(cx, hy, hr, 0, 7); ctx.fill(); ctx.stroke();
  const g = ctx.createRadialGradient(cx - 55, hy - 60, 20, cx, hy, hr); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(110,120,140,.22)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, hy, hr - 7, 0, 7); ctx.fill();
  const fx = cx + (p.turn || 0) * 45, fy = hy + 10 + (p.nod || 0) * 45;
  // cheveux / couvre-chef (derrière ou devant selon le sens)
  const hair = () => {
    if (o.hair === 'slick') { ctx.fillStyle = '#17171a'; ctx.beginPath(); if (p.back) { ctx.arc(cx, hy, hr - 2, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(cx + hr * 0.9, hy + 40); ctx.quadraticCurveTo(cx, hy + 70, cx - hr * 0.9, hy + 40); } else { ctx.moveTo(cx - hr + 8, hy - 26); ctx.bezierCurveTo(cx - hr + 8, hy - hr - 44, cx + hr + 26, hy - hr - 52, cx + hr - 4, hy - 36); ctx.bezierCurveTo(cx + 70, hy - 105, cx - 35, hy - 130, cx - hr + 8, hy - 26); } ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - 60, hy - 130); ctx.quadraticCurveTo(cx + 10, hy - 152, cx + 80, hy - 120); ctx.stroke(); }
    else if (o.hair === 'cap') { ctx.fillStyle = o.cap || '#e53935'; ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.beginPath(); ctx.arc(cx, hy - 16, hr - 4, Math.PI * 1.04, Math.PI * 1.96); ctx.closePath(); ctx.fill(); ctx.stroke(); if (!p.back) { ctx.beginPath(); ctx.ellipse(cx + 50, hy - 34, 135, 22, -0.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } else { ctx.beginPath(); ctx.ellipse(cx, hy - 26, 60, 12, 0, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); } }
    else if (o.hair === 'long' || o.hair === 'pigtails') { ctx.fillStyle = o.hairColor || '#5a3a1f'; ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(cx, hy - 4, hr + 2, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(cx + 40, hy - 110, cx - hr + 6, hy - 22); ctx.fill(); ctx.stroke(); if (o.hair === 'pigtails') for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * (hr + 22), hy + 10, 30, 46, s * 0.3, 0, 7); ctx.fill(); ctx.stroke(); } }
    else if (o.hair === 'beanie') { ctx.fillStyle = o.cap || '#2ec4b6'; ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, hy - 10, hr, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, hy - hr - 12, 24, 0, 7); ctx.fill(); ctx.stroke(); }
  };
  if (!p.back) face(ctx, fx, fy, p.expr, o);
  hair();
  ctx.restore();
}

export class FlatCharacter {
  constructor(o) {
    this.o = o = { scale: 1, ...o };
    this.root = new THREE.Group(); this.root.rotation.order = 'YXZ';
    // squelette invisible (sert aux poses et à placer les accessoires dans les mains)
    this.hips = new THREE.Group(); this.root.add(this.hips);
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    this.headG = new THREE.Group(); this.headG.position.y = 0.6; this.torso.add(this.headG);
    this.legL = new THREE.Group(); this.legL.position.x = -0.13; this.legR = new THREE.Group(); this.legR.position.x = 0.13; this.hips.add(this.legL, this.legR);
    this.armL = new THREE.Group(); this.armL.position.set(-0.33, 0.55, 0); this.armR = new THREE.Group(); this.armR.position.set(0.33, 0.55, 0); this.torso.add(this.armL, this.armR);
    this.canvas = document.createElement('canvas'); this.canvas.width = CW; this.canvas.height = CH;
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(CW / PX, CH / PX), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.04, toneMapped: false, side: THREE.DoubleSide }));
    this.sprite.renderOrder = 2;
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.head = this.headG; this.key = '';
    this.reset();
  }
  addTo(scene) { scene.add(this.root); scene.add(this.sprite); scene.add(this.shadow); }
  setFace(expr) { this.expr = expr; }
  reset() {
    const r = this.root; r.visible = false; r.position.set(0, 0, 0); r.rotation.set(0, 0, 0); r.quaternion.setFromEuler(r.rotation); r.scale.setScalar(this.o.scale);
    this.hips.position.set(0, 1.0, 0); this.hips.rotation.set(0, 0, 0); this.torso.rotation.set(0, 0, 0);
    for (const p of [this.legL, this.legR, this.armL, this.armR]) p.rotation.set(0, 0, 0);
    this.headG.rotation.set(0, 0, 0); this.expr = 'neutral'; this.squash = null;
  }
  worldHead(v = new THREE.Vector3()) { const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.root.quaternion); return v.copy(this.root.position).addScaledVector(up, 3.1 * this.o.scale); }
  // à appeler à chaque image, avant le rendu
  sync(camera, parentVisible = true) {
    const r = this.root; const vis = r.visible && parentVisible;
    this.sprite.visible = vis; this.shadow.visible = vis && r.position.y < 0.6 && Math.abs(r.rotation.x) < 0.3;
    if (!vis) return;
    const s = r.scale.y;
    const sit = this.hips.position.y < 0.6;
    const toCam = camera.position.clone().sub(r.position); toCam.y = 0; toCam.normalize();
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(r.quaternion); fwd.y = 0; fwd.normalize();
    const back = fwd.lengthSq() > 0.01 && fwd.dot(toCam) < -0.35;
    const armA = (a, sgn) => ({ a: Math.max(-a.rotation.x * 0.95, sgn * a.rotation.z, 0), fwd: -a.rotation.x > Math.abs(a.rotation.z) + 0.2 });
    const p = { expr: this.expr, back, legs: sit ? 'sit' : 'stand', lstep: clamp(this.legL.rotation.x, -1, 1), rstep: clamp(this.legR.rotation.x, -1, 1),
      arms: [armA(this.armL, -1), armA(this.armR, 1)], nod: clamp(this.headG.rotation.x, -1, 1), tilt: clamp(this.headG.rotation.z + this.torso.rotation.z * 0.5, -0.6, 0.6), turn: clamp(this.headG.rotation.y, -1, 1) };
    if (back) { const t = p.arms[0]; p.arms[0] = p.arms[1]; p.arms[1] = t; }
    const q = (x) => Math.round(x * 20) / 20;
    const key = [p.expr, p.back, p.legs, q(p.lstep), q(p.rstep), q(p.arms[0].a), p.arms[0].fwd, q(p.arms[1].a), p.arms[1].fwd, q(p.nod), q(p.tilt), q(p.turn)].join('|');
    if (key !== this.key) { this.key = key; drawFlat(this.canvas.getContext('2d'), this.o, p); this.tex.needsUpdate = true; }
    // orientation : face à la caméra, « haut » = haut du personnage (suit les wagons à l'envers)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(r.quaternion);
    const feetDrop = sit ? 0.62 : 0; // assis : le dessin est plus court
    const hpx = CH / PX, footPx = (CH - 990) / PX;
    const center = r.position.clone().addScaledVector(up, (hpx / 2 - footPx - feetDrop * 0) * s - (sit ? 0.55 * s : 0));
    this.sprite.position.copy(center);
    const m = new THREE.Matrix4().lookAt(camera.position, center, up); // regarde depuis la caméra vers le centre
    this.sprite.quaternion.setFromRotationMatrix(m);
    this.sprite.scale.set(s * (r.scale.x / s), s, 1);
    this.shadow.position.set(r.position.x, r.position.y + 0.04, r.position.z); this.shadow.scale.setScalar(s * 1.1);
  }
}
for (const k of ['at', 'walk', 'fall', 'lie', 'sit', 'tiptoe', 'sneak', 'climb']) FlatCharacter.prototype[k] = Character.prototype[k];
