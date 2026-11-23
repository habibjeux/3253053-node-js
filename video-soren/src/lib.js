// Briques de base : matériaux, cubes, textures canvas, personnages « blocky ».
import * as THREE from 'three';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
export const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
export const easeIn = (u) => Math.pow(clamp(u), 3);
export const easeOutBack = (u) => { u = clamp(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
export const range = (t, a, b) => clamp((t - a) / (b - a));
export const frac = (x) => x - Math.floor(x);
// bruit déterministe
export const hash = (n) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// ---------- matériaux ----------
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...opts }));
  }
  return matCache.get(key);
}
export function glow(color, intensity = 1) {
  return mat(color, { emissive: color, emissiveIntensity: intensity });
}

const UNIT = new THREE.BoxGeometry(1, 1, 1);
export function box(parent, w, h, d, material, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(UNIT, typeof material === 'string' || typeof material === 'number' ? mat(material) : material);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// ---------- textures canvas ----------
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.userData = { canvas: c, ctx, draw };
  return tex;
}
export function redraw(tex, draw) {
  const { canvas, ctx } = tex.userData;
  draw(ctx, canvas.width, canvas.height);
  tex.needsUpdate = true;
}
export const FONT = '"Luckiest Guy", "DejaVu Sans", sans-serif';

export function signTex(text, { bg = '#d62828', fg = '#fff', w = 512, h = 160, size = 96, border = '#ffd23f', sub = null } = {}) {
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = border; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bg; ctx.fillRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${size}px ${FONT}`;
    if (sub) {
      ctx.fillText(text, w / 2, h * 0.4);
      ctx.font = `${size * 0.45}px ${FONT}`;
      ctx.fillText(sub, w / 2, h * 0.78);
    } else ctx.fillText(text, w / 2, h / 2 + size * 0.06);
  });
}

export function plane(parent, w, h, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

// ---------- visages ----------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, r); ctx.fill();
}
function drawFace(ctx, S, o, expr) {
  ctx.fillStyle = o.skin; ctx.fillRect(0, 0, S, S);
  const k = S / 128;
  ctx.save(); ctx.scale(k, k);
  const ink = '#1d1b2a';
  ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const eye = (x, y, w, h) => { ctx.fillStyle = ink; rr(ctx, x, y, w, h, w / 2.2); ctx.fillStyle = '#fff'; rr(ctx, x + w * 0.18, y - h * 0.22, w * 0.32, h * 0.28, 3); };
  const brow = (x, y, ang, len = 22) => { ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * len / 2, y - Math.sin(ang) * len / 2); ctx.lineTo(x + Math.cos(ang) * len / 2, y + Math.sin(ang) * len / 2); ctx.stroke(); };
  const cheeks = (a = 0.35) => { ctx.fillStyle = `rgba(255,110,130,${a})`; ctx.beginPath(); ctx.ellipse(28, 84, 11, 7, 0, 0, 7); ctx.ellipse(100, 84, 11, 7, 0, 0, 7); ctx.fill(); };
  ctx.lineWidth = 6;
  switch (expr) {
    case 'happy':
      eye(42, 58, 14, 22); eye(86, 58, 14, 22); brow(42, 36, -0.12); brow(86, 36, 0.12); cheeks();
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(64, 78, 20, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); break;
    case 'laugh':
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(42, 62, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(86, 62, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); cheeks(0.5);
      ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.moveTo(40, 80); ctx.lineTo(88, 80); ctx.arc(64, 80, 24, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#ff6f7d'; ctx.beginPath(); ctx.ellipse(64, 96, 12, 6, 0, 0, 7); ctx.fill(); break;
    case 'surprised':
      eye(42, 56, 18, 28); eye(86, 56, 18, 28); brow(42, 28, -0.25); brow(86, 28, 0.25);
      ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.ellipse(64, 96, 10, 13, 0, 0, 7); ctx.fill(); break;
    case 'scared':
      eye(42, 58, 18, 26); eye(86, 58, 18, 26); brow(42, 34, -0.45); brow(86, 34, 0.45);
      ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.ellipse(64, 95, 16, 11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(50, 86, 28, 5); break;
    case 'determined':
      eye(42, 60, 14, 16); eye(86, 60, 14, 16); brow(42, 44, 0.4, 26); brow(86, 44, -0.4, 26);
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(50, 92); ctx.lineTo(80, 89); ctx.stroke(); break;
    case 'pain':
      ctx.lineWidth = 7;
      for (const x of [42, 86]) { const s = x < 64 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x - 10 * s, 50); ctx.lineTo(x + 8 * s, 58); ctx.lineTo(x - 10 * s, 66); ctx.stroke(); }
      ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.ellipse(64, 92, 14, 9, 0, 0, 7); ctx.fill(); break;
    case 'cry':
      ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(42, 56, 10, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(86, 56, 10, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
      brow(42, 38, -0.5); brow(86, 38, 0.5);
      ctx.fillStyle = '#6fd3ff'; ctx.fillRect(36, 64, 9, 52); ctx.fillRect(83, 64, 9, 52);
      ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.moveTo(44, 100); ctx.quadraticCurveTo(64, 74, 84, 100); ctx.closePath(); ctx.fill(); cheeks(0.6); break;
    case 'smirk':
      ctx.fillStyle = ink; rr(ctx, 42, 58, 16, 10, 4); rr(ctx, 86, 56, 16, 14, 4);
      brow(42, 42, 0.25, 24); brow(86, 36, -0.35, 24);
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(46, 90); ctx.quadraticCurveTo(70, 98, 88, 80); ctx.stroke(); break;
    case 'evil':
      ctx.fillStyle = ink; rr(ctx, 42, 58, 16, 9, 4); rr(ctx, 86, 58, 16, 9, 4);
      brow(42, 46, 0.45, 26); brow(86, 46, -0.45, 26);
      ctx.fillStyle = '#5a1020'; ctx.beginPath(); ctx.moveTo(40, 84); ctx.quadraticCurveTo(64, 112, 90, 80); ctx.quadraticCurveTo(64, 92, 40, 84); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(52, 86, 26, 5); break;
    case 'sleep':
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(42, 56, 10, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(86, 56, 10, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(58, 90); ctx.lineTo(70, 90); ctx.stroke(); break;
    case 'blank':
      ctx.fillStyle = '#0a0a0f'; ctx.beginPath(); ctx.ellipse(42, 60, 7, 9, 0, 0, 7); ctx.ellipse(86, 60, 7, 9, 0, 0, 7); ctx.fill(); break;
    case 'worried':
      eye(42, 58, 15, 22); eye(86, 58, 15, 22); brow(42, 36, -0.4); brow(86, 36, 0.4);
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(64, 98, 12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); break;
    case 'smile':
      eye(42, 58, 12, 20); eye(86, 58, 12, 20);
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(64, 74, 22, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); break;
    default:
      eye(42, 58, 14, 20); eye(86, 58, 14, 20); brow(42, 38, -0.08); brow(86, 38, 0.08);
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(54, 90); ctx.lineTo(74, 90); ctx.stroke();
  }
  if (o.mustache) {
    ctx.fillStyle = o.mustache;
    ctx.beginPath(); ctx.ellipse(52, 80, 15, 6, -0.25, 0, 7); ctx.ellipse(76, 80, 15, 6, 0.25, 0, 7); ctx.fill();
  }
  if (o.freckles) { ctx.fillStyle = 'rgba(160,80,40,.6)'; for (const [x, y] of [[30, 76], [36, 82], [26, 84], [98, 76], [92, 82], [102, 84]]) { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); } }
  ctx.restore();
}

// ---------- personnages ----------
const Q = (o) => o; // lisibilité
export class Character {
  constructor(o) {
    this.o = o = Q({ skin: '#ffcf9e', shirt: '#3a86ff', pants: '#2b2d42', shoes: '#222', sleeve: null, scale: 1, ...o });
    this.root = new THREE.Group();
    this.root.rotation.order = 'YXZ';
    this.root.scale.setScalar(o.scale);
    this.faces = {};
    this.faceMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const R = this.root;
    this.hips = new THREE.Group(); this.hips.position.y = 1.0; R.add(this.hips);
    const leg = (x) => {
      const p = new THREE.Group(); p.position.set(x, 0, 0); this.hips.add(p);
      box(p, 0.46, 0.75, 0.48, o.pants, 0, -0.38, 0);
      if (o.slippers) box(p, 0.72, 0.42, 0.9, o.slippers, 0, -0.84, 0.12);
      else box(p, 0.48, 0.27, 0.56, o.shoes, 0, -0.87, 0.03);
      if (o.stilts) { box(p, 0.16, 2.2, 0.16, '#a0662f', 0, -2.1, 0); box(p, 0.5, 0.12, 0.5, '#7a4a1f', 0, -3.15, 0); }
      return p;
    };
    this.legL = leg(-0.25); this.legR = leg(0.25);
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    box(this.torso, 1.0, 1.05, 0.52, o.shirt, 0, 0.52, 0);
    if (o.apron) box(this.torso, 0.84, 1.15, 0.06, o.apron, 0, 0.42, 0.28);
    if (o.tie) box(this.torso, 0.14, 0.7, 0.05, o.tie, 0, 0.62, 0.28);
    if (o.stripe) box(this.torso, 1.02, 0.18, 0.54, o.stripe, 0, 0.55, 0);
    if (o.scarf) { box(this.torso, 1.04, 0.2, 0.6, o.scarf, 0, 1.0, 0); box(this.torso, 0.22, 0.6, 0.08, o.scarf, 0.25, 0.7, 0.32); }
    if (o.coat) { box(this.torso, 1.12, 1.9, 0.64, o.coat, 0, 0.12, 0); box(this.torso, 1.16, 0.3, 0.66, o.coatTrim || o.coat, 0, 0.98, 0); }
    if (o.backpack) { box(this.torso, 0.8, 0.9, 0.4, o.backpack, 0, 0.5, -0.45); box(this.torso, 0.5, 0.3, 0.1, o.backpack, 0, 0.3, -0.68); }
    if (o.bag) { box(this.torso, 0.5, 0.45, 0.22, o.bag, 0.62, -0.05, 0.12); box(this.torso, 0.08, 1.2, 0.56, o.bag, 0.1, 0.55, 0).rotation.z = 0.75; }
    const arm = (x) => {
      const p = new THREE.Group(); p.position.set(x, 0.95, 0); this.torso.add(p);
      box(p, 0.4, 0.78, 0.44, o.sleeve || o.shirt, 0, -0.32, 0);
      box(p, 0.36, 0.25, 0.4, o.skin, 0, -0.83, 0);
      return p;
    };
    this.armL = arm(-0.71); this.armR = arm(0.71);
    this.headG = new THREE.Group(); this.headG.position.y = 1.05; this.torso.add(this.headG);
    const skinM = mat(o.skin);
    const head = new THREE.Mesh(UNIT, [skinM, skinM, skinM, skinM, this.faceMat, skinM]);
    head.scale.set(0.82, 0.82, 0.82); head.position.y = 0.43; head.castShadow = true; head.receiveShadow = true;
    this.headG.add(head); this.head = head;
    this.buildHat(o);
    this.setFace('neutral');
    this.reset();
  }
  buildHat(o) {
    const H = this.headG;
    if (o.hair) {
      box(H, 0.88, 0.2, 0.88, o.hair, 0, 0.86, -0.02);
      box(H, 0.88, 0.62, 0.16, o.hair, 0, 0.55, -0.4);
      if (o.pigtails) for (const s of [-1, 1]) box(H, 0.2, 0.5, 0.2, o.hair, s * 0.52, 0.42, -0.15);
      if (o.sideHair) for (const s of [-1, 1]) box(H, 0.1, 0.35, 0.6, o.hair, s * 0.45, 0.55, -0.1);
    }
    if (o.longHair) {
      const c = o.longHair;
      box(H, 0.92, 0.22, 0.92, c, 0, 0.9, -0.01);
      box(H, 0.92, 1.25, 0.2, c, 0, 0.3, -0.44);
      for (const sx of [-1, 1]) box(H, 0.16, 1.15, 0.7, c, sx * 0.47, 0.35, -0.1);
      box(H, 0.92, 0.18, 0.12, c, 0, 0.8, 0.42);
    }
    if (o.puffyHair) {
      const pm = mat(o.puffyHair, { flatShading: true });
      for (const [x, y, z, r] of [[0, 0.95, 0, 0.55], [-0.35, 0.85, 0.15, 0.36], [0.35, 0.88, 0.1, 0.38], [0, 0.85, -0.35, 0.45], [0.2, 1.1, 0.25, 0.3]]) {
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), pm); b.position.set(x, y, z); b.castShadow = true; H.add(b);
      }
    }
    if (o.hood) {
      const c = o.hood;
      box(H, 1.06, 0.2, 1.0, c, 0, 0.93, -0.02);
      box(H, 1.06, 1.0, 0.2, c, 0, 0.45, -0.5);
      for (const sx of [-1, 1]) box(H, 0.14, 1.0, 0.98, c, sx * 0.53, 0.45, -0.02);
    }
    if (o.hat === 'beanie') {
      box(H, 0.9, 0.36, 0.9, o.hatColor, 0, 0.98, 0);
      box(H, 0.94, 0.16, 0.94, o.bandColor || o.hatColor, 0, 0.83, 0);
      box(H, 0.6, 0.14, 0.6, o.hatColor, 0, 1.2, 0);
      const pp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), mat(o.pompom, { flatShading: true }));
      pp.position.y = 1.38; pp.castShadow = true; H.add(pp);
    } else if (o.hat === 'tophat') {
      box(H, 1.2, 0.08, 1.2, o.hatColor, 0, 0.88, 0);
      box(H, 0.72, 0.75, 0.72, o.hatColor, 0, 1.28, 0);
      box(H, 0.74, 0.14, 0.74, o.bandColor, 0, 0.99, 0);
    } else if (o.hat === 'cap') {
      box(H, 0.9, 0.3, 0.9, o.hatColor, 0, 0.95, 0);
      box(H, 0.9, 0.06, 0.4, o.visorColor || o.hatColor, 0, 0.82, 0.6);
      box(H, 0.3, 0.16, 0.05, o.badge || '#ffd23f', 0, 0.98, 0.46);
    } else if (o.hat === 'souwester') {
      box(H, 1.25, 0.08, 1.25, o.hatColor, 0, 0.86, -0.05);
      box(H, 0.9, 0.34, 0.9, o.hatColor, 0, 1.05, 0);
    } else if (o.hat === 'helmet') {
      box(H, 0.96, 0.4, 1.0, o.hatColor, 0, 0.98, 0);
      box(H, 0.98, 0.1, 0.5, '#222', 0, 1.05, 0);
    } else if (o.hat === 'chef') {
      box(H, 0.86, 0.2, 0.86, '#fff', 0, 0.9, 0);
      box(H, 1.0, 0.5, 1.0, '#fff', 0, 1.25, 0);
    }
    if (o.glasses) {
      const gm = mat('#1d1b2a', { metalness: 0.6, roughness: 0.3 });
      for (const sx of [-0.2, 0.2]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 16), gm); r.position.set(sx, 0.5, 0.42); H.add(r); }
      box(H, 0.14, 0.03, 0.03, '#1d1b2a', 0, 0.52, 0.42, false);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshStandardMaterial({ color: '#dff4ff', transparent: true, opacity: 0.3, metalness: 1, roughness: 0 }));
      lens.position.set(0.2, 0.5, 0.425); H.add(lens); this.glasses = lens;
    }
    if (o.monocle) {
      const g = new THREE.Group(); g.position.set(0.2, 0.5, 0.42); H.add(g);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 16), mat('#e8b923', { metalness: 0.9, roughness: 0.25 }));
      g.add(ring);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), new THREE.MeshStandardMaterial({ color: '#cfefff', transparent: true, opacity: 0.35, metalness: 1, roughness: 0 }));
      g.add(glass);
      box(g, 0.02, 0.5, 0.02, '#e8b923', 0.12, -0.3, 0, false).rotation.z = 0.3;
      this.monocle = g;
    }
  }
  setFace(expr) {
    if (this.expr === expr) return;
    this.expr = expr;
    if (!this.faces[expr]) {
      this.faces[expr] = canvasTex(256, 256, (ctx, S) => drawFace(ctx, S, this.o, expr));
    }
    this.faceMat.map = this.faces[expr];
    this.faceMat.needsUpdate = true;
  }
  reset() {
    const r = this.root;
    r.visible = false;
    r.position.set(0, 0, 0); r.rotation.set(0, 0, 0);
    this.hips.position.set(0, 1.0, 0); this.hips.rotation.set(0, 0, 0);
    this.torso.rotation.set(0, 0, 0);
    for (const p of [this.legL, this.legR, this.armL, this.armR]) p.rotation.set(0, 0, 0);
    this.headG.rotation.set(0, 0, 0);
    this.setFace('neutral');
    if (this.o.stilts) r.position.y = 2.2;
  }
  // place + oriente (heading en radians, 0 = regarde +z)
  at(x, y, z, heading = 0) {
    this.root.visible = true;
    this.root.position.set(x, y + (this.o.stilts ? 2.2 * this.o.scale : 0), z);
    this.root.rotation.y = heading;
    return this;
  }
  walk(phase, amp = 0.6) {
    const s = Math.sin(phase);
    this.legL.rotation.x = s * amp; this.legR.rotation.x = -s * amp;
    this.armL.rotation.x = -s * amp * 0.9; this.armR.rotation.x = s * amp * 0.9;
    this.hips.position.y = 1.0 + Math.abs(Math.cos(phase)) * 0.06;
    this.torso.rotation.z = s * 0.03;
    return this;
  }
  // chute en arrière : p 0→1 (glissade, vol, impact), rebond
  fall(p) {
    const r = this.root;
    const k = smooth(range(p, 0, 0.55));
    const bounce = p > 0.55 ? Math.sin(range(p, 0.55, 0.85) * Math.PI) * 0.12 : 0;
    r.rotation.x = -k * Math.PI / 2 * 0.98 + bounce;
    r.position.y += Math.sin(k * Math.PI) * 0.5 + k * 0.27 * this.o.scale;
    const kick = Math.sin(range(p, 0, 0.7) * Math.PI);
    this.legL.rotation.x = -0.4 - kick * 1.0; this.legR.rotation.x = -0.2 - kick * 0.7;
    this.armL.rotation.x = -2.4 * k + Math.sin(p * 30) * 0.2 * (1 - p); this.armR.rotation.x = -2.0 * k;
    this.armL.rotation.z = -0.5 * k; this.armR.rotation.z = 0.5 * k;
    this.headG.rotation.x = 0.3 * k;
  }
  // allongé au sol (après la chute)
  lie(t = 0) {
    this.root.rotation.x = -Math.PI / 2 * 0.98;
    this.root.position.y += 0.27 * this.o.scale;
    this.legL.rotation.x = -0.3 + Math.sin(t * 9) * 0.1; this.legR.rotation.x = -0.15;
    this.armL.rotation.z = -0.9; this.armR.rotation.z = 0.9;
    this.armL.rotation.x = -0.3; this.armR.rotation.x = -0.3;
  }
  // marche sur la pointe des pieds
  tiptoe(phase) {
    const s = Math.sin(phase);
    this.legL.rotation.x = s * 0.35; this.legR.rotation.x = -s * 0.35;
    this.hips.position.y = 1.12 + Math.abs(Math.cos(phase)) * 0.05;
    this.armL.rotation.x = -0.4; this.armR.rotation.x = -0.4; this.armL.rotation.z = -0.6; this.armR.rotation.z = 0.6;
    this.torso.rotation.x = 0.12;
  }
  // accroupi, se faufile
  sneak(phase) {
    const s = Math.sin(phase);
    this.hips.position.y = 0.72;
    this.legL.rotation.x = -0.7 + s * 0.4; this.legR.rotation.x = -0.7 - s * 0.4;
    this.torso.rotation.x = 0.45; this.headG.rotation.x = -0.35;
    this.armL.rotation.x = -0.9 - s * 0.3; this.armR.rotation.x = -0.9 + s * 0.3;
  }
  // escalade (face à la paroi)
  climb(phase) {
    const s = Math.sin(phase);
    this.armL.rotation.x = Math.PI * 0.85 + s * 0.35; this.armR.rotation.x = Math.PI * 0.85 - s * 0.35;
    this.legL.rotation.x = -0.5 - Math.max(0, s) * 0.8; this.legR.rotation.x = -0.5 - Math.max(0, -s) * 0.8;
    this.headG.rotation.x = -0.3;
  }
  sit() {
    this.hips.position.y = 0.35;
    this.legL.rotation.x = -1.45; this.legR.rotation.x = -1.35;
    this.legL.rotation.z = -0.15; this.legR.rotation.z = 0.15;
  }
  worldHead(v = new THREE.Vector3()) {
    this.root.updateMatrixWorld(true);
    return this.head.getWorldPosition(v).add(new THREE.Vector3(0, 0.9 * this.o.scale, 0));
  }
}

// ---------- éléments de décor ----------
export function pine(parent, x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
  box(g, 0.6, 1.6, 0.6, '#6b4226', 0, 0.8, 0);
  const tiers = [[3.4, 2.4, 2.2], [2.6, 2.2, 3.8], [1.8, 2.0, 5.3]];
  for (const [r, h, y] of tiers) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), mat('#2e7d4f', { flatShading: true }));
    c.position.y = y; c.rotation.y = Math.PI / 4; c.castShadow = true; c.receiveShadow = true; g.add(c);
    const sn = new THREE.Mesh(new THREE.ConeGeometry(r * 0.55, h * 0.5, 4), mat('#f4f9ff', { flatShading: true }));
    sn.position.y = y + h * 0.27; sn.rotation.y = Math.PI / 4; g.add(sn);
  }
  return g;
}

export function prism(parent, w, h, len, material, x, y, z) {
  // prisme triangulaire (toit), arête parallèle à z
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 3), typeof material === 'string' ? mat(material, { flatShading: true }) : material);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w / 1.732, len, h / 1.5);
  m.position.set(x, y + 0.5 * (h / 1.5), z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
