// Film engine: shot list -> frame at time t. Shots build their own scene lazily.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
// overlay for flashes / fades / vignette
const overlay = document.createElement('div');
overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)';
const flashDiv = document.createElement('div'); flashDiv.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;background:#fff';
document.body.append(overlay, flashDiv);

export const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 500);
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
const rp = new RenderPass(new THREE.Scene(), camera); composer.addPass(rp);
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.7, 0.6, 0.82); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---- helpers for shots ----
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export function track(keys, t, fn = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [t0, v0] = keys[i], [t1, v1] = keys[i + 1]; if (t <= t1) { const p = fn((t - t0) / (t1 - t0)); return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], p)) : lerp(v0, v1, p); } }
  return keys[keys.length - 1][1];
}
export function cam(pos, target, fov = 40, shake = 0, t = 0) {
  const s = shake ? [Math.sin(t * 61) * shake, Math.sin(t * 47 + 1) * shake, 0] : [0, 0, 0];
  camera.up.set(0, 1, 0); camera.position.set(pos[0] + s[0], pos[1] + s[1], pos[2]); camera.fov = fov; camera.updateProjectionMatrix(); camera.lookAt(target[0] + s[0], target[1] + s[1], target[2]);
}
// close-up camera on an avatar's face: dist in front, yaw offset (rad), dy above eye line
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
export function faceCam(av, dist = 4, yaw = 0.3, dy = 0.2, fov = 36, shakeAmt = 0, t = 0, look = 0) {
  const head = av.userData.parts.head; head.updateWorldMatrix(true, false);
  const p = head.getWorldPosition(new THREE.Vector3());
  head.getWorldQuaternion(_q);
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(_q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(_q);
  fwd.applyAxisAngle(up, yaw);
  const c = p.clone().addScaledVector(fwd, dist).addScaledVector(up, dy);
  cam([c.x, c.y, c.z], [p.x, p.y + look, p.z], fov, shakeAmt, t);
  camera.up.copy(up); camera.lookAt(p.x, p.y + look, p.z);
}
export function flash(a, color = '#fff') { flashDiv.style.background = color; flashDiv.style.opacity = String(clamp(a)); }
// talking mouth: toggles 'talk' amount while a phrase is spoken
export function talking(t, spans) { for (const [a, b] of spans) if (t >= a && t <= b) return 0.5 + 0.5 * Math.abs(Math.sin((t - a) * 17)); return 0; }

// ---- film ----
export class Film {
  constructor(shots, timing) { this.shots = shots; this.timing = timing; this.cur = -1; this.state = null; }
  frame(t) {
    const i = Math.max(0, this.shots.findIndex((s, k) => t >= s.t0 && (k === this.shots.length - 1 || t < this.shots[k + 1].t0)));
    if (i !== this.cur) {
      if (this.state?.scene) this.state.scene.traverse(o => { o.geometry?.dispose?.(); });
      this.cur = i; this.state = this.shots[i].build();
    }
    const sh = this.shots[i], st = this.state;
    flash(0);
    const bl = sh.update(st, t - sh.t0, t, sh) || {};
    st.update?.(t);
    rp.scene = st.scene; bloom.strength = bl.bloom ?? 0.75;
    composer.render();
  }
}
