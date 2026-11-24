// Personnages stickman 2.5D : grosse tête blanche ronde à contour noir épais, petit torse habillé,
// bras et jambes en traits noirs fins. Même interface d'animation que Character (lib.js).
import * as THREE from 'three';
import { Character, drawFace, mat, box, canvasTex, addOutline } from './lib.js';

const INK = new THREE.MeshBasicMaterial({ color: '#111114' });
const OUTLINE = new THREE.MeshBasicMaterial({ color: '#0d0d12', side: THREE.BackSide });
const LIMB = new THREE.CylinderGeometry(0.055, 0.055, 1, 8);
const JOINT = new THREE.SphereGeometry(0.075, 10, 8);
const HEAD = new THREE.SphereGeometry(0.62, 40, 28);

function line(parent, len, y0 = 0) { // trait noir vertical vers le bas depuis le pivot
  const m = new THREE.Mesh(LIMB, INK); m.scale.y = len; m.position.y = y0 - len / 2; m.castShadow = true; parent.add(m);
  const j = new THREE.Mesh(JOINT, INK); j.position.y = y0 - len; parent.add(j);
  return m;
}

export class StickCharacter {
  constructor(o) {
    this.o = o = { skin: '#ffffff', shirt: '#ffd21f', scale: 1, ...o };
    this.root = new THREE.Group(); this.root.rotation.order = 'YXZ'; this.root.scale.setScalar(o.scale);
    this.faces = {};
    this.hips = new THREE.Group(); this.hips.position.y = 1.0; this.root.add(this.hips);
    const leg = (x) => { const p = new THREE.Group(); p.position.set(x, 0, 0); this.hips.add(p); line(p, 0.95); const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mat(o.shoes || '#111114')); f.scale.set(1, 0.6, 1.5); f.position.set(0, -0.98, 0.07); f.castShadow = true; p.add(f); return p; };
    this.legL = leg(-0.13); this.legR = leg(0.13);
    this.torso = new THREE.Group(); this.hips.add(this.torso);
    // petit torse habillé
    const T = new THREE.Group(); this.torso.add(T); this.torsoBody = T;
    box(T, 0.56, 0.62, 0.36, o.shirt, 0, 0.3, 0);
    if (o.overall) { box(T, 0.6, 0.26, 0.4, o.overall, 0, 0.1, 0); box(T, 0.4, 0.3, 0.06, o.overall, 0, 0.38, 0.19); for (const s of [-1, 1]) box(T, 0.07, 0.34, 0.05, o.overall, s * 0.17, 0.48, 0.2); box(T, 0.06, 0.06, 0.02, '#ffd21f', -0.1, 0.48, 0.23, false); box(T, 0.06, 0.06, 0.02, '#ffd21f', 0.1, 0.48, 0.23, false); }
    if (o.vest) { box(T, 0.58, 0.5, 0.38, o.vest, 0, 0.32, 0); box(T, 0.18, 0.5, 0.02, o.shirtFront || '#ffffff', 0, 0.36, 0.2); }
    if (o.tie) box(T, 0.08, 0.36, 0.03, o.tie, 0, 0.4, 0.21);
    if (o.dress) box(T, 0.7, 0.4, 0.46, o.dress, 0, -0.02, 0);
    addOutline(T, 0.05);
    const arm = (x) => { const p = new THREE.Group(); p.position.set(x, 0.55, 0); this.torso.add(p); line(p, 0.85); const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat('#ffffff')); h.position.y = -0.9; p.add(h); const ho = new THREE.Mesh(h.geometry, OUTLINE); ho.scale.setScalar(1.35); ho.position.copy(h.position); p.add(ho); return p; };
    this.armL = arm(-0.33); this.armR = arm(0.33);
    // grosse tête ronde, contour épais
    this.headG = new THREE.Group(); this.headG.position.y = 0.6; this.torso.add(this.headG);
    line(this.headG, 0.0001);
    this.faceMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
    const head = new THREE.Mesh(HEAD, this.faceMat); head.position.y = 0.62; head.castShadow = true; this.headG.add(head); this.head = head;
    const ho = new THREE.Mesh(HEAD, OUTLINE); ho.scale.setScalar(1.085); ho.position.copy(head.position); this.headG.add(ho);
    this.buildHat(o);
    this.setFace('neutral');
    this.reset();
  }
  buildHat(o) {
    const H = this.headG, cy = 0.62;
    const cap = (color, s = 1) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.64 * s, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.3), mat(color, { roughness: 0.5 })); m.position.y = cy; m.castShadow = true; H.add(m); return m; };
    if (o.cap) { cap(o.cap, 1.03); const v = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 20, 1, false, -Math.PI / 2, Math.PI), mat(o.capVisor || o.cap)); v.position.set(0, cy + 0.28, 0.45); v.rotation.x = 0.12; H.add(v); addOutline(v, 0.04); }
    if (o.slick) { const hr = cap(o.slick, 1.04); hr.rotation.x = -0.45; hr.position.z = -0.05; const sh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.4 })); sh.scale.set(1.6, 0.4, 0.6); sh.position.set(-0.22, cy + 0.6, 0.12); H.add(sh); }
    if (o.hair) { const hr = cap(o.hair, 1.04); hr.rotation.x = -0.3; }
    if (o.pigtails) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(o.pigtails)); p.position.set(s * 0.66, cy + 0.1, -0.1); H.add(p); }
    if (o.beanie) { cap(o.beanie, 1.05); const pp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mat('#ffffff')); pp.position.y = cy + 0.68; H.add(pp); }
  }
  setFace(expr) {
    if (this.expr === expr) return; this.expr = expr;
    if (!this.faces[expr]) {
      const o = this.o;
      this.faces[expr] = canvasTex(1024, 512, (ctx) => {
        ctx.fillStyle = o.skin; ctx.fillRect(0, 0, 1024, 512);
        ctx.save(); ctx.translate(160, 150); // l'avant de la sphère (+z) est à u = 0,25
        drawFace(ctx, 192, { ...o, skin: o.skin }, expr);
        ctx.restore();
      });
    }
    this.faceMat.map = this.faces[expr]; this.faceMat.needsUpdate = true;
  }
  reset() {
    const r = this.root; r.visible = false; r.position.set(0, 0, 0); r.rotation.set(0, 0, 0); r.scale.setScalar(this.o.scale);
    this.hips.position.set(0, 1.0, 0); this.hips.rotation.set(0, 0, 0); this.torso.rotation.set(0, 0, 0);
    for (const p of [this.legL, this.legR, this.armL, this.armR]) p.rotation.set(0, 0, 0);
    this.headG.rotation.set(0, 0, 0); this.setFace('neutral');
  }
}
for (const k of ['at', 'walk', 'fall', 'lie', 'sit', 'tiptoe', 'sneak', 'climb', 'worldHead']) StickCharacter.prototype[k] = Character.prototype[k];
