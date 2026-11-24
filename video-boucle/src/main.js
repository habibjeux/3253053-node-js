// Mise en scène « La boucle » : parc d'attractions, duel de montagnes russes, explication physique.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { V3, clamp, lerp, smooth, easeOut, easeIn, easeOutBack, range, hash, FONT, redraw } from './lib.js';
import { makeCast, makePark, makeDemo, setTrack, placeOnTrack, loopPoints, skyTex, frac } from './world.js';
import { LINES, EV, WIDTH, HEIGHT, DURATION } from './timeline.js';

await Promise.all([document.fonts.load('80px "Luckiest Guy"'), document.fonts.load('900 80px "Montserrat"'), document.fonts.load('italic 900 80px "Montserrat"'), document.fonts.load('800 40px "Montserrat"')]);
const SCALE = Number(new URLSearchParams(location.search).get('s') || 1);
const SANS = '"Montserrat", "DejaVu Sans", sans-serif';

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(Math.round(WIDTH * SCALE), Math.round(HEIGHT * SCALE), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
const out = document.getElementById('out');
out.width = Math.round(WIDTH * SCALE); out.height = Math.round(HEIGHT * SCALE);
const ctx = out.getContext('2d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 3000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const hemi = new THREE.HemisphereLight('#bfe3ff', '#7cb342', 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3dc', 3.0);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
scene.add(sun); scene.add(sun.target);
const fill = new THREE.PointLight('#ffffff', 0, 30, 1.5); scene.add(fill);

const C = makeCast();
for (const c of [C.createur, C.rival, C.fille, C.pere, C.mere, C.dummy, ...C.queue]) scene.add(c.root);
const R = makePark(scene);
const D = makeDemo(scene);
const SKY = { day: skyTex('#1e88ff', '#bfe6ff'), night: skyTex('#030716', '#1a2a5a') };

function setMode(m) {
  const night = m === 'night';
  R.group.visible = m !== 'demo'; D.visible = m === 'demo';
  scene.background = SKY[night ? 'night' : 'day'];
  R.stars.visible = night; R.moon.visible = night; for (const c of R.clouds) c.visible = !night;
  scene.fog = new THREE.Fog(night ? '#0b1638' : '#cfe8ff', night ? 80 : 150, night ? 500 : 900);
  scene.environmentIntensity = night ? 0.15 : 0.6;
  if (night) { hemi.color.set('#4b6cc7'); hemi.groundColor.set('#102018'); hemi.intensity = 0.9; sun.color.set('#cfdcff'); sun.intensity = 1.4; for (const b of R.bulbs) b.material.emissiveIntensity = 2.5; renderer.toneMappingExposure = 1.2; }
  else { hemi.color.set('#bfe3ff'); hemi.groundColor.set('#7cb342'); hemi.intensity = 1.2; sun.color.set('#fff3dc'); sun.intensity = 3.0; for (const b of R.bulbs) b.material.emissiveIntensity = 0.3; renderer.toneMappingExposure = 1.0; }
  fill.intensity = 0;
}
function shadowAt(x, y, z, size = 30, dir = [0.5, 1, 0.6]) {
  sun.target.position.set(x, y, z); sun.position.set(x + dir[0] * 80, y + dir[1] * 80, z + dir[2] * 80);
  const sc = sun.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = 300; sc.updateProjectionMatrix();
}
function look(p, t, fov = 50) { camera.position.set(...p); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(...t); }
function camKeys(lt, keys, ease = smooth) {
  let i = 0; while (i < keys.length - 2 && lt > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = b === a ? 0 : ease(range(lt, a[0], b[0]));
  const L = (p, q) => p.map((v, k) => lerp(v, q[k], u));
  look(L(a[1], b[1]), L(a[2], b[2]), lerp(a[3] || 50, b[3] || 50, u));
}
function shake(amount, t) { camera.position.x += Math.sin(t * 63) * amount; camera.position.y += Math.sin(t * 71 + 1) * amount; camera.rotateZ(Math.sin(t * 47) * amount * 0.05); }

// ---------------- sous-titres karaoké (centrés en bas, marge de sécurité TikTok) ----------------
const GOLD = '#ffd21f', RED = '#e53935', BLUE = '#1e88e5', SILVER = '#e8eef8';
const KEYWORDS = /^(BOUCLE|RIVAL|CERCLE|WAGON|MANNEQUIN|BOOM|EXPLOSION)/;
const CHUNKS = [];
for (const [a, b, text] of LINES) {
  const words = [];
  for (const w of text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().split(/\s+/)) {
    if (words.length && /^([€:;!?,.»…]+|\.\.\.)$/.test(w)) words[words.length - 1] += w === '…' ? w : ' ' + w; else words.push(w);
  }
  const weights = words.map((w) => w.replace(/[^\p{L}\d]/gu, '').length + 2.5); const tot = weights.reduce((s, v) => s + v, 0);
  let tt = a; const timed = words.map((w, i) => { const d = (b - a) * weights[i] / tot; const r = { w, t0: tt, t1: tt + d }; tt += d; return r; });
  let c = [];
  const flush = () => { if (c.length) CHUNKS.push({ words: c, t0: c[0].t0, t1: c[c.length - 1].t1 }); c = []; };
  for (const tw of timed) { const len = c.reduce((s, x) => s + x.w.length + 1, 0); if (c.length >= 3 || len + tw.w.length > 15) flush(); c.push(tw); if (/[,.:;!?…]$/.test(tw.w)) flush(); }
  flush();
}
const SUB_CX = 520, SUB_MAXW = 880;
function drawSubtitles(t, cy) {
  const ch = CHUNKS.find((c) => t >= c.t0 && t < c.t1 + 0.08); if (!ch) return;
  const size = 82; ctx.font = `900 ${size}px ${SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const words = ch.words.map((w) => w.w.toUpperCase()); const space = 20;
  const widths = words.map((w) => ctx.measureText(w).width);
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => { if (rw + widths[i] > SUB_MAXW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += widths[i] + space; });
  const enter = easeOutBack(range(t, ch.t0, ch.t0 + 0.14));
  ctx.save(); ctx.translate(SUB_CX, cy); ctx.scale(0.86 + 0.14 * enter, 0.86 + 0.14 * enter); ctx.translate(-SUB_CX, -cy);
  rows.forEach((row, ri) => {
    const total = row.reduce((s, i) => s + widths[i], 0) + space * (row.length - 1);
    let x = SUB_CX - total / 2; const y = cy + (ri - (rows.length - 1) / 2) * size * 1.18;
    for (const i of row) {
      const w = ch.words[i]; const active = t >= w.t0 && t < w.t1 + 0.03; const key = KEYWORDS.test(words[i]);
      if (active) {
        const k = easeOutBack(range(t, w.t0, w.t0 + 0.12));
        ctx.save(); ctx.translate(x + widths[i] / 2, y); ctx.rotate(-0.025); ctx.scale(k, k);
        ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
        ctx.fillStyle = key ? RED : GOLD; ctx.beginPath(); ctx.roundRect(-widths[i] / 2 - 15, -size * 0.58, widths[i] + 30, size * 1.12, 16); ctx.fill();
        ctx.restore();
      }
      ctx.save();
      if (active) { ctx.translate(x + widths[i] / 2, y); ctx.scale(1.06, 1.06); ctx.translate(-(x + widths[i] / 2), -y); }
      ctx.lineJoin = 'round';
      if (!active) { ctx.lineWidth = 15; ctx.strokeStyle = '#000'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowOffsetY = 7; ctx.strokeText(words[i], x, y + 3); ctx.shadowColor = 'transparent'; }
      ctx.fillStyle = active ? (key ? '#fff' : '#111') : key ? GOLD : '#ffffff';
      ctx.fillText(words[i], x, y + 3);
      ctx.restore();
      x += widths[i] + space;
    }
  });
  ctx.restore();
}
function drawHook(h) {
  const s = easeOutBack(range(h.age, 0, 0.25)); const a = 1 - range(h.age, h.dur - 0.3, h.dur);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(SUB_CX, 300); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `italic 900 68px ${SANS}`;
  const lines = h.text.split('\n'); const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 70;
  ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.beginPath(); ctx.roundRect(-w / 2, -60 - (lines.length - 1) * 40, w, 120 + (lines.length - 1) * 80, 24); ctx.fill();
  ctx.fillStyle = RED; ctx.fillRect(-w / 2, -60 - (lines.length - 1) * 40, 14, 120 + (lines.length - 1) * 80);
  lines.forEach((l, i) => { ctx.fillStyle = i === lines.length - 1 ? RED : '#111'; ctx.fillText(l, 6, (i - (lines.length - 1) / 2) * 80 + 4); });
  ctx.restore();
}

// ---------------- habillage 2D ----------------
const OV = { popups: [], comics: [], tags: [], sparkles: [], flash: 0, fade: 0, title: null, vignette: 0.45 };
function resetOV() { OV.popups = []; OV.comics = []; OV.tags = []; OV.sparkles = []; OV.flash = 0; OV.fade = 0; OV.title = null; OV.vignette = 0.5; OV.hook = null; OV.subY = 1400; }
const proj = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * WIDTH, y: (1 - p.y) / 2 * HEIGHT, ok: p.z < 1 }; };
function popup(text, worldPos, age, { color = '#ff2e4d', size = 96, dur = 1.3 } = {}) { if (age >= 0 && age <= dur) OV.popups.push({ text, worldPos: worldPos.clone(), age, color, size, dur }); }
function comic(text, x, y, age, { color = '#ffd23f', size = 150, rot = -0.12, dur = 1.1, stroke = '#1d1b2a', burst = true } = {}) { if (age >= 0 && age <= dur) OV.comics.push({ text, x, y, age, color, size, rot, dur, stroke, burst }); }
function bubble(text, worldPos, age, dur = 1.2, size = 64) { if (age >= 0 && age <= dur) OV.tags.push({ text, worldPos: worldPos.clone(), age, dur, color: '#1d1b2a', bg: '#ffffff', size, bubble: true }); }
function tag(text, worldPos, age, dur = 2.2, color = '#ffffff', bg = '#e63946') { if (age >= 0 && age <= dur) OV.tags.push({ text, worldPos: worldPos.clone(), age, dur, color, bg, size: 64 }); }
function sparkle(worldPos, age, size = 120) { if (age >= 0 && age < 0.6) OV.sparkles.push({ worldPos: worldPos.clone(), age, size }); }

function outlined(text, x, y, size, fill, stroke = '#1d1b2a', lw = null) {
  ctx.font = `${size}px ${FONT}`; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  ctx.lineWidth = lw ?? size * 0.2; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

function compose(t) {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.drawImage(glCanvas, 0, 0, WIDTH, HEIGHT);
  const g = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.25, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,20,${OV.vignette})`); ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const tg of OV.tags) {
    const p = proj(tg.worldPos); if (!p.ok) continue;
    const s = easeOutBack(range(tg.age, 0, 0.25)) * (1 - range(tg.age, tg.dur - 0.2, tg.dur));
    ctx.save(); ctx.translate(p.x, p.y - 40); ctx.scale(s, s); ctx.rotate(-0.04);
    ctx.font = `${tg.size}px ${FONT}`; const w = ctx.measureText(tg.text).width + 60, hh = tg.size * 1.38;
    if (!tg.bubble) { ctx.fillStyle = '#141218'; ctx.beginPath(); ctx.roundRect(-w / 2 + 8, -hh / 2 + 8, w, hh, 20); ctx.fill(); }
    ctx.fillStyle = tg.bg; ctx.beginPath(); ctx.roundRect(-w / 2, -hh / 2, w, hh, tg.bubble ? hh / 2 : 20); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#141218'; ctx.stroke();
    ctx.fillStyle = tg.color; ctx.fillText(tg.text, 0, 6);
    ctx.beginPath(); ctx.moveTo(-18, hh / 2); ctx.lineTo(18, hh / 2); ctx.lineTo(tg.bubble ? -10 : 0, hh / 2 + 30); ctx.closePath(); ctx.fillStyle = tg.bg; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  for (const pp of OV.popups) {
    const p = proj(pp.worldPos); if (!p.ok) continue;
    const s = easeOutBack(range(pp.age, 0, 0.22)); const a = 1 - range(pp.age, pp.dur - 0.3, pp.dur);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y - 30 - pp.age * 120); ctx.scale(s, s); ctx.rotate(Math.sin(pp.age * 9) * 0.05);
    outlined(pp.text, 0, 0, pp.size, pp.color, '#ffffff', pp.size * 0.22);
    ctx.lineWidth = 3; ctx.strokeStyle = '#141218'; ctx.strokeText(pp.text, 0, 0);
    ctx.restore();
  }
  for (const sp of OV.sparkles) {
    const p = proj(sp.worldPos); if (!p.ok) continue;
    const k = Math.sin(range(sp.age, 0, 0.6) * Math.PI); const r = sp.size * k;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(sp.age * 3); ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 30;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.16 : r; const an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
  }
  for (const c of OV.comics) {
    const s = easeOutBack(range(c.age, 0, 0.2)); const a = 1 - range(c.age, c.dur - 0.25, c.dur);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(s * (1 + c.age * 0.08), s * (1 + c.age * 0.08));
    ctx.font = `${c.size}px ${FONT}`; const w = ctx.measureText(c.text).width;
    if (c.burst) {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#141218'; ctx.lineWidth = 8; ctx.beginPath();
      const N = 18; for (let i = 0; i < N * 2; i++) { const an = i / (N * 2) * Math.PI * 2; const rx = (w * 0.62 + 30) * (i % 2 ? 0.8 : 1.05), ry = (c.size * 0.85) * (i % 2 ? 0.8 : 1.05); ctx.lineTo(Math.cos(an) * rx, Math.sin(an) * ry); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    outlined(c.text, 0, c.size * 0.06, c.size, c.color, c.stroke, c.size * 0.16);
    ctx.restore();
  }
  if (OV.hook) drawHook(OV.hook);
  if (OV.title) {
    const { text, age, sub } = OV.title; const s = easeOutBack(range(age, 0, 0.3));
    ctx.save(); ctx.translate(WIDTH / 2, 300); ctx.scale(s, s);
    ctx.font = `80px ${FONT}`; const w = Math.max(ctx.measureText(text).width + 80, 420);
    ctx.fillStyle = 'rgba(10,14,40,.78)'; ctx.beginPath(); ctx.roundRect(-w / 2, -70, w, sub ? 200 : 140, 30); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.stroke();
    outlined(text, 0, 2, 80, '#ffffff', '#141218', 12);
    if (sub) outlined(sub, 0, 92, 60, '#ffd23f', '#141218', 10);
    ctx.restore();
  }
  if (OV.diagram) drawDiagram(OV.diagram.age);
  drawSubtitles(t, OV.subY);
  if (OV.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(OV.flash)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (OV.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(OV.fade)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
}


// ---------------- aides ----------------
const HEAD = (c) => c.worldHead();
const TO = (o, x, y, z) => [o.x + x, o.y + y, o.z + z];
const CO = R.creatorOrigin, RO = R.rivalOrigin;
const LOOPX = 14;
function uAtX(track, x, after = 0) { const f = track.frames; for (let i = Math.floor(after * (f.length - 1)); i < f.length; i++) if (f[i].p.x >= x) return i / (f.length - 1); return 1; }
function ride(c, wagon, face = 'happy') { // personnage assis dans un wagon
  c.reset(); c.root.visible = true; c.sit(); c.root.scale.setScalar(c.o.scale);
  wagon.updateMatrixWorld(true);
  c.root.position.copy(wagon.localToWorld(wagon.seat.clone()));
  c.root.quaternion.copy(wagon.quaternion);
  c.setFace(face);
}
function sparks(t, t0s, origin) {
  const a = R.sparks.geometry.attributes.position; let age = -1;
  for (const t0 of t0s) if (t >= t0 && t - t0 < 0.6) age = t - t0;
  R.sparks.visible = age >= 0; if (!R.sparks.visible) return;
  for (let k = 0; k < a.count; k++) { const v = [(hash(k) - 0.5) * 9, hash(k + 1) * 7, (hash(k + 2) - 0.5) * 9]; a.array[k * 3] = origin.x + v[0] * age; a.array[k * 3 + 1] = Math.max(0.05, origin.y + v[1] * age - 9.8 * age * age); a.array[k * 3 + 2] = origin.z + v[2] * age; }
  a.needsUpdate = true;
}
function wheelAt(t) { R.wheel.rotation.z = t * 0.12; R.gondolas.forEach((g) => { const a = g.userData.a + t * 0.12; g.position.set(-70 + Math.cos(a) * 20, 26 + Math.sin(a) * 20 - 1.4, -60); }); }
function bulbsAt(t) { R.bulbs.forEach((b, k) => { b.material.emissiveIntensity *= 0.6 + 0.4 * (frac(t * 1.5 + k * 0.25) < 0.5 ? 1 : 0.3); }); }
function boom(t, t0, at) {
  const age = t - t0; R.boom.visible = age >= 0 && age < 6; if (!R.boom.visible) return;
  R.boom.position.copy(at);
  const s = easeOut(range(age, 0, 1.2)) * 18;
  R.fire.scale.setScalar(s * 0.8); R.fire.material.opacity = 1 - range(age, 0.6, 2.2);
  R.fire2.scale.setScalar(s); R.fire2.material.opacity = 0.85 * (1 - range(age, 0.8, 2.6));
  R.smoke.forEach((m, k) => { const a = hash(k) * Math.PI * 2, e = hash(k + 1); const r = s * (0.6 + e * 0.6); m.position.set(Math.cos(a) * r * 0.8, r * (0.4 + e) + age * 4, Math.sin(a) * r * 0.5); m.scale.setScalar(3 + age * 3 * (0.5 + e)); m.material.opacity = 0.9 * (1 - range(age, 3, 6)); });
  R.debris.forEach((d, k) => { const v = V3((hash(k) - 0.5) * 30, 10 + hash(k + 1) * 25, (hash(k + 2) - 0.5) * 30); d.position.set(v.x * age, Math.max(0, v.y * age - 4.9 * age * age), v.z * age); d.rotation.set(age * 5 + k, age * 3, k); });
  R.boomLight.intensity = 3000 * (1 - range(age, 0.2, 2.5));
}
let creatorShape = 0;
const shapeAt = (t) => { // 0 cercle → 1 base élargie (coups de maillet) → 2 goutte haute et étroite (sabotage)
  let m = 0; EV.hammer.forEach((h, k) => { if (t > h) m = (k + 1) / EV.hammer.length; });
  EV.tighten.forEach((h, k) => { if (t > h) m = 1 + (k + 1) / EV.tighten.length; });
  return m;
};

// ---------------- schéma : vitesse × courbure = force G ----------------
function gProfile(m) {
  const pts = loopPoints(0, 0, m, 160); const g = 9.8, h0 = 28;
  const mx = pts.reduce((s2, p) => s2 + p.x, 0) / pts.length; for (const p of pts) p.x -= mx;
  const out = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const v2 = 2 * g * Math.max(1, h0 - b.y);
    const ab = Math.hypot(b.x - a.x, b.y - a.y), bc = Math.hypot(c.x - b.x, c.y - b.y), ac = Math.hypot(c.x - a.x, c.y - a.y);
    const cross = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
    const k = (2 * cross) / (ab * bc * ac + 1e-6);
    const ny = ((a.y + c.y) / 2 - b.y); // signe : intérieur de la boucle
    const tx = (c.x - a.x) / (ac + 1e-6);
    const G = v2 * k / g + tx; // force ressentie : centripète + composante de la gravité
    out.push({ x: b.x, y: b.y, G: Math.max(0, G), v: Math.sqrt(v2) });
  }
  return out;
}
const PROF = { circle: gProfile(0), drop: gProfile(2) };
const gColor = (G) => (G < 3 ? '#43d17a' : G < 4.5 ? '#ffd21f' : G < 5.5 ? '#ff8a1f' : '#ff2d3d');
function drawLoopDiagram(prof, cx, cy, scale, prog, title, sub) {
  const n = Math.floor(prof.length * prog);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 1; i < n; i++) { const a = prof[i - 1], b = prof[i]; ctx.strokeStyle = gColor(b.G); ctx.lineWidth = 10 + b.G * 3; ctx.beginPath(); ctx.moveTo(cx + a.x * scale, cy - a.y * scale); ctx.lineTo(cx + b.x * scale, cy - b.y * scale); ctx.stroke(); }
  const maxG = Math.max(...prof.slice(0, Math.max(1, n)).map((p) => p.G));
  if (n > 1) { const p = prof[n - 1]; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx + p.x * scale, cy - p.y * scale, 16, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `italic 900 50px ${SANS}`; ctx.lineWidth = 12; ctx.strokeStyle = '#000'; ctx.lineJoin = 'round';
  ctx.strokeText(title, cx, cy + 90); ctx.fillStyle = '#fff'; ctx.fillText(title, cx, cy + 90);
  const gtxt = `${maxG.toFixed(1).replace('.', ',')} G`;
  ctx.font = `900 64px ${SANS}`; ctx.strokeText(gtxt, cx, cy + 160); ctx.fillStyle = gColor(maxG); ctx.fillText(gtxt, cx, cy + 160);
  ctx.font = `800 26px ${SANS}`; ctx.strokeText(sub, cx, cy + 215); ctx.fillStyle = '#e8eef8'; ctx.fillText(sub, cx, cy + 215);
  ctx.restore();
}

// ---------------- plans ----------------
const SHOTS = []; const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });
// hook : le créateur présente sa boucle géante
shot(0, 2.6, (lt, t) => {
  setMode('day'); setTrack(R, 'c', 0); setTrack(R, 'r', 0).visible = false; shadowAt(14, 0, 4, 30);
  const P = C.createur; P.at(10, 0, 7, 0.2); P.setFace('happy');
  const a = smooth(range(lt, 0.1, 0.6)); P.armL.rotation.z = -2.2 * a; P.armR.rotation.z = 2.2 * a; P.armL.rotation.x = P.armR.rotation.x = -0.3 * a;
  camKeys(lt, [[0, [6, 0.8, 16], [12, 9, -1], 58], [2.6, [5, 1.2, 13.5], [12, 11, -1], 56]]);
  OV.hook = { text: 'IL A TOUT MISÉ\nSUR UNE SEULE BOUCLE.', age: lt - 0.05, dur: 2.6 };
});
// le portefeuille vide
shot(2.6, 5.2, (lt, t) => {
  setMode('day'); setTrack(R, 'c', 0); setTrack(R, 'r', 0).visible = false; shadowAt(10, 0, 7, 10);
  const P = C.createur; P.at(10, 0, 7, 0.2); P.setFace(t < EV.wallet + 0.4 ? 'neutral' : 'pain');
  P.armL.rotation.x = P.armR.rotation.x = -1.0; P.armL.rotation.z = 0.3; P.armR.rotation.z = -0.3; P.headG.rotation.x = 0.3;
  P.root.updateMatrixWorld(true); const hand = P.armR.localToWorld(V3(-0.3, -0.95, 0.2));
  R.wallet.visible = true; R.wallet.position.copy(hand); R.wallet.rotation.set(0, 0.2, 0); R.walletLid.rotation.x = -1.8 * smooth(range(t, EV.wallet, EV.wallet + 0.4));
  camKeys(lt, [[0, [12.8, 3.0, 14.5], [10.2, 2.0, 7], 46], [2.6, [12.4, 2.8, 13.2], [10.2, 1.9, 7], 42]]);
  comic('0 €', 540, 520, t - EV.wallet - 0.4, { size: 190, color: RED, rot: -0.06, dur: 2.0 });
});
// le rival copie le plan et construit un cercle parfait
shot(5.2, 9, (lt, t) => {
  setMode('day'); setTrack(R, 'c', 0); const tr = setTrack(R, 'r', 0); tr.visible = true;
  tr.scale.y = 0.05 + 0.95 * easeOut(range(t, EV.rivalBuild + 0.6, 8.6)); shadowAt(RO.x + 10, 0, RO.z, 40);
  const V = C.rival; V.at(RO.x + 22, 0, RO.z + 8, -0.6); V.setFace('smirk'); V.armR.rotation.x = -1.4; V.armL.rotation.x = -1.2;
  V.root.updateMatrixWorld(true); R.plan.visible = true; R.plan.position.copy(V.armR.localToWorld(V3(-0.4, -1.0, 0.3))); R.plan.rotation.set(-0.3, -0.6 + Math.PI, 0);
  camKeys(lt, [[0, TO(RO, 30, 3.2, 20), TO(RO, 21, 2.6, 8), 44], [1.2, TO(RO, 30, 4, 22), TO(RO, 18, 4, 4), 50], [3.8, TO(RO, 36, 8, 34), TO(RO, 12, 10, 0), 52]]);
  tag('LE RIVAL', HEAD(V), lt - 0.2, 1.6, '#111', '#ffd21f');
  comic('COPIÉ !', 540, 560, lt - 1.6, { size: 110, color: GOLD, rot: -0.06, dur: 1.6 });
});
// la veille de l'ouverture, de nuit : test du wagon rouge
shot(9, 12, (lt, t) => {
  setMode('night'); const tr = setTrack(R, 'c', 0); setTrack(R, 'r', 0).visible = true; shadowAt(-20, 0, 0, 50, [-0.4, 1, 0.6]); bulbsAt(t);
  R.wagonC.visible = true; const u = lerp(uAtX(tr, -30), uAtX(tr, LOOPX + 6, 0.5) , easeIn(range(lt, 0, 3)));
  placeOnTrack(R.wagonC, tr, u, CO); ride(C.dummy, R.wagonC, 'neutral');
  camKeys(lt, [[0, [-48, 3, 18], [-56, 7, 4.5], 50], [3, [-30, 10, 34], [0, 12, 0], 54]]);
  OV.title = lt < 2 ? { text: 'VEILLE DE L\'OUVERTURE', age: lt, sub: 'TEST DE NUIT' } : null;
  OV.vignette = 0.7; OV.fade = 1 - range(lt, 0, 0.4);
});
// le wagon revient… le mannequin est écrasé
shot(12, 16, (lt, t) => {
  setMode('night'); const tr = setTrack(R, 'c', 0); shadowAt(-50, 0, 0, 20, [-0.4, 1, 0.6]); bulbsAt(t);
  R.wagonC.visible = true; const u = lerp(uAtX(tr, -75 + 140) > 0.9 ? 0.0 : 0.0, 0.02, easeOut(range(lt, 0, 1.2)));
  const uS = uAtX(tr, -46); placeOnTrack(R.wagonC, tr, uS + 0.02 * (1 - easeOut(range(lt, 0, 1.2))), CO);
  ride(C.dummy, R.wagonC, 'pain'); C.dummy.root.translateY(0.9); C.dummy.root.scale.set(1.35, 0.42, 1.3); C.dummy.headG.rotation.z = 0.5; C.dummy.armL.rotation.z = -1.4; C.dummy.armR.rotation.z = 1.4;
  const P = C.createur; P.at(-44.5, 0, 3.2, -Math.PI * 0.75); P.setFace(t > EV.testReturn + 0.8 ? 'scared' : 'surprised'); P.armL.rotation.x = P.armR.rotation.x = -2.6 * smooth(range(t, EV.testReturn + 0.8, EV.testReturn + 1.2));
  const w = R.wagonC.position;
  camKeys(lt, [[0, [w.x + 7, w.y + 3.5, w.z + 6], [w.x, w.y + 1.2, w.z], 40], [4, [w.x + 5.5, w.y + 3, w.z + 5], [w.x, w.y + 1.2, w.z], 36]]);
  fill.position.set(w.x + 2, 5, w.z + 3); fill.intensity = 30; fill.color.set('#ffe0a0');
  comic('CRAC !', 540, 560, t - EV.testReturn - 0.3, { size: 140, color: GOLD, rot: -0.08, dur: 1.1 });
  OV.vignette = 0.7;
});
// le maillet : il élargit la base de la boucle
shot(16, 22, (lt, t) => {
  setMode('night'); const m = shapeAt(t); setTrack(R, 'c', m); shadowAt(LOOPX, 0, 0, 30, [-0.4, 1, 0.6]); bulbsAt(t);
  const P = C.createur; P.at(LOOPX - 9, 0, 4.2, Math.PI * 0.8); P.setFace('determined');
  let hit = 0; for (const h of EV.hammer) { const a = t - h; if (a > -0.35 && a < 0.1) hit = a < 0 ? (a + 0.35) / 0.35 : 1 - a / 0.1; }
  P.armR.rotation.x = -2.8 + hit * 1.6; P.armL.rotation.x = -2.6 + hit * 1.6;
  P.root.updateMatrixWorld(true); R.mallet.visible = t > EV.mallet; R.mallet.position.copy(P.armR.localToWorld(V3(0, -0.9, 0))); R.mallet.quaternion.copy(P.armR.getWorldQuaternion(new THREE.Quaternion())); R.mallet.rotateX(Math.PI / 2);
  sparks(t, EV.hammer, V3(LOOPX - 10, 2, 2));
  camKeys(lt, [[0, [LOOPX - 13, 3.5, 15], [LOOPX - 6, 5, 0], 52], [6, [LOOPX - 10, 5, 22], [LOOPX - 2, 8, 0], 54]]);
  fill.position.set(LOOPX - 8, 6, 8); fill.intensity = 40; fill.color.set('#ffe0a0');
  for (const h of EV.hammer) comic('BANG', 300 + hash(h) * 480, 600 + hash(h + 1) * 200, t - h, { size: 90, color: GOLD, rot: (hash(h) - 0.5) * 0.3, dur: 0.5 });
  tag('LE CRÉATEUR', HEAD(P), lt - 0.2, 1.6, '#ffffff', '#e53935');
  OV.vignette = 0.7;
});
// le rival se faufile et resserre les côtés : haute et étroite
shot(22, 28.5, (lt, t) => {
  setMode('night'); const m = shapeAt(t); setTrack(R, 'c', m); shadowAt(LOOPX, 0, 0, 30, [-0.4, 1, 0.6]); bulbsAt(t);
  const V = C.rival; const x = lerp(LOOPX + 26, LOOPX + 10.5, smooth(range(lt, 0, 2.2)));
  V.at(x, 0, 3.2, -Math.PI / 2); if (lt < 2.2) V.sneak(lt * 7); V.setFace('evil');
  let hit = 0; for (const h of EV.tighten) { const a = t - h; if (a > -0.35 && a < 0.1) hit = a < 0 ? (a + 0.35) / 0.35 : 1 - a / 0.1; }
  if (lt > 2.2) { V.armR.rotation.x = -2.8 + hit * 1.6; V.armL.rotation.x = -2.0; }
  V.root.updateMatrixWorld(true); R.mallet.visible = lt > 2.2; R.mallet.position.copy(V.armR.localToWorld(V3(0, -0.9, 0))); R.mallet.quaternion.copy(V.armR.getWorldQuaternion(new THREE.Quaternion())); R.mallet.rotateX(Math.PI / 2);
  sparks(t, EV.tighten, V3(LOOPX + 9, 3, 2));
  camKeys(lt, [[0, [LOOPX + 30, 2.5, 18], [LOOPX + 22, 2.2, 3], 46], [2.4, [LOOPX + 22, 4, 26], [LOOPX + 8, 8, 0], 52], [6.5, [LOOPX + 16, 8, 38], [LOOPX, 14, 0], 56]]);
  for (const h of EV.tighten) comic('TOC', 760, 640 + hash(h) * 200, t - h, { size: 80, color: SILVER, rot: 0.1, dur: 0.45 });
  comic('HAUTE ET ÉTROITE…', 540, 520, t - EV.tighten[3] - 0.4, { size: 64, color: SILVER, rot: -0.04, dur: 1.2, burst: false });
  OV.vignette = 0.75;
});
// le jour de l'ouverture : la foule devant le cercle parfait du rival
shot(28.5, 31, (lt, t) => {
  setMode('day'); setTrack(R, 'c', 2); setTrack(R, 'r', 0).visible = true; shadowAt(RO.x - 50, 0, RO.z + 6, 30);
  C.queue.forEach((q, k) => { q.at(RO.x - 46 + k * 1.6, 0, RO.z + 6 + (k % 2) * 0.8, -Math.PI / 2); q.setFace(k % 3 ? 'happy' : 'surprised'); q.headG.rotation.x = -0.2; q.walk(t * 2 + k, 0.08); });
  const F = C.fille; F.at(RO.x - 30, 0, RO.z + 9, -2.4); F.setFace('happy'); F.armR.rotation.x = -2.7;
  F.root.updateMatrixWorld(true); R.balloon.visible = true; R.balloon.position.copy(F.armR.localToWorld(V3(0, -0.9, 0))); R.balloon.rotation.z = Math.sin(t * 1.5) * 0.12;
  C.pere.at(RO.x - 28, 0, RO.z + 10, -2.2).setFace('happy'); C.mere.at(RO.x - 27, 0, RO.z + 8.6, -2.6).setFace('happy');
  const V = C.rival; V.at(RO.x - 52, 0, RO.z + 3.2, 0.2); V.setFace('smirk'); V.armL.rotation.z = -1.0;
  camKeys(lt, [[0, TO(RO, -20, 3, 22), TO(RO, -40, 2, 4), 48], [2.5, TO(RO, -18, 6, 24), TO(RO, -30, 8, 0), 50]]);
  OV.title = lt < 1.6 ? { text: "JOUR J", age: lt, sub: "L'INAUGURATION" } : null;
});
// les deux hommes montent dans leurs wagons… la montée
shot(31, 35.4, (lt, t) => {
  setMode('day'); const tc = setTrack(R, 'c', 2); const trr = setTrack(R, 'r', 0); trr.visible = true;
  const u0 = uAtX(tc, -40), u1 = uAtX(tc, -14.5);
  const u = lerp(u0, u1, smooth(range(lt, 0, 4.4)));
  R.wagonC.visible = true; placeOnTrack(R.wagonC, tc, u, CO); ride(C.createur, R.wagonC, 'happy');
  R.wagonR.visible = true; placeOnTrack(R.wagonR, trr, u, RO); ride(C.rival, R.wagonR, 'smirk');
  const w = R.wagonC.position; shadowAt(w.x, w.y, w.z, 20);
  if (lt < 2.2) camKeys(lt, [[0, [w.x + 4, w.y + 3, w.z + 7], [w.x, w.y + 1, w.z], 44], [2.2, [w.x + 4, w.y + 3, w.z + 7], [w.x, w.y + 1, w.z], 44]]);
  else { const r = R.wagonR.position; look([r.x + 5, r.y + 3, r.z + 8], [r.x, r.y + 1, r.z], 44); }
  comic('CLIC-CLIC-CLIC', 540, 560, lt - 0.3, { size: 70, color: '#fff', rot: -0.04, dur: 3.6, burst: false });
});
// la crête… et la boucle haute et étroite devant lui
shot(35.4, 40, (lt, t) => {
  setMode('day'); const tc = setTrack(R, 'c', 2); setTrack(R, 'r', 0).visible = true;
  const u = lerp(uAtX(tc, -14.5), uAtX(tc, -8.8), smooth(range(lt, 0, 1.6)));
  R.wagonC.visible = true; placeOnTrack(R.wagonC, tc, u, CO); ride(C.createur, R.wagonC, lt < 1.2 ? 'happy' : 'scared');
  R.wagonC.updateMatrixWorld(true);
  const w = R.wagonC.position; const eye = V3(w.x - 6, w.y + 4, w.z + 2.5), ahead = V3(LOOPX, 9, 0);
  look(eye.toArray(), ahead.toArray(), 60);
  shadowAt(LOOPX, 0, 0, 30);
  comic('?!', 820, 560, lt - 1.4, { size: 150, color: RED, rot: 0.1, dur: 1.6 });
});
// démonstration : virage serré lentement… puis à grande vitesse
shot(40, 48, (lt, t) => {
  setMode('demo'); shadowAt(600, 0, 0, 25);
  const Rr = D.R;
  const pos = (car, a) => { car.position.set(Math.cos(a) * Rr, 0, -Math.sin(a) * Rr); car.rotation.set(0, a + Math.PI, 0); };
  D.carSlow.visible = t < EV.fastCar; D.carFast.visible = t >= EV.fastCar;
  if (t < EV.fastCar) { const a = lerp(0, Math.PI, smooth(range(lt, 0.2, 3.8))); pos(D.carSlow, a); camKeys(lt, [[0, [600, 16, 22], [600, 0, -2], 48], [4, [600, 18, 24], [600, 0, -3], 48]]); comic('LENT + SERRÉ = OK', 540, 420, lt - 0.4, { size: 66, color: '#43d17a', rot: -0.04, dur: 3.4, burst: false }); }
  else {
    const u = t - EV.fastCar; const tr = EV.roll - EV.fastCar;
    if (u < tr) pos(D.carFast, lerp(-0.2, 0.6, u / tr));
    else { const a = 0.6; pos(D.carFast, a); const k = u - tr; D.carFast.position.x += -Math.sin(a) * k * 9 + Math.cos(a) * k * 6; D.carFast.position.z += -Math.cos(a) * k * 9; D.carFast.position.y = Math.max(0, Math.sin(Math.min(k * 3, Math.PI)) * 2); D.carFast.rotateZ(Math.min(k * 7, Math.PI * 2.5)); }
    camKeys(lt - 4, [[0, [600, 16, 22], [608, 0, -2], 48], [4, [606, 14, 20], [612, 0, -6], 50]]);
    if (u > tr && u < tr + 0.6) shake(0.08, t);
    comic('RAPIDE + SERRÉ = TONNEAU', 540, 420, u - tr, { size: 60, color: RED, rot: -0.04, dur: 2.2, burst: false });
  }
});
// le tracé : où le wagon va vite, où la courbe est serrée
shot(48, 55, (lt, t) => {
  setMode('day'); setTrack(R, 'c', 2); setTrack(R, 'r', 0).visible = true; shadowAt(LOOPX, 0, 0, 30);
  look([LOOPX + 2, 14, 46], [LOOPX, 12, 0], 50);
  OV.diagram = { age: lt };
});
// le créateur passe la boucle haute sans encombre
shot(55, 59.4, (lt, t) => {
  setMode('day'); const tc = setTrack(R, 'c', 2); setTrack(R, 'r', 0).visible = true;
  const u0 = uAtX(tc, 2), u1 = uAtX(tc, LOOPX + 14, 0.55);
  const u = lerp(u0, u1, range(lt, 0, 4.4));
  R.wagonC.visible = true; placeOnTrack(R.wagonC, tc, u, CO); ride(C.createur, R.wagonC, 'laugh');
  C.createur.armL.rotation.x = C.createur.armR.rotation.x = -2.9;
  const w = R.wagonC.position; shadowAt(LOOPX, 0, 0, 30);
  look([LOOPX + 3, 13, 42], [w.x * 0.4 + LOOPX * 0.6, w.y * 0.5 + 8, 0], 46);
  comic('YOUHOU !', 760, 560, lt - 1.4, { size: 110, color: GOLD, rot: 0.08, dur: 1.4 });
});
// au loin, la boucle circulaire du rival explose
shot(59.4, DURATION, (lt, t) => {
  setMode('day'); const tc = setTrack(R, 'c', 2); const trr = setTrack(R, 'r', 0); trr.visible = t < EV.boom + 0.25;
  R.wagonC.visible = true; placeOnTrack(R.wagonC, tc, lerp(uAtX(tc, LOOPX + 14, 0.55), uAtX(tc, LOOPX + 40, 0.6), range(lt, 0, 3.6)), CO); ride(C.createur, R.wagonC, t > EV.boom + 0.5 ? 'surprised' : 'happy');
  const w = R.wagonC.position;
  boom(t, EV.boom, V3(RO.x + LOOPX, RO.y + 10, RO.z));
  look([w.x + 6, 4.5, w.z + 9], [RO.x + LOOPX - 10, 12, RO.z], 50);
  if (t > EV.boom && t < EV.boom + 0.8) shake(0.12 * (1 - range(t, EV.boom, EV.boom + 0.8)), t);
  OV.flash = t > EV.boom && t < EV.boom + 0.2 ? 0.6 : 0;
  comic('BOUM !', 540, 520, t - EV.boom - 0.15, { size: 170, color: '#ff8a1f', rot: -0.08, dur: 1.6 });
  if (t > EV.endTitle) OV.title = { text: 'LA BONNE COURBE', age: t - EV.endTitle, sub: 'CHANGE TOUT' };
  OV.fade = range(t, DURATION - 0.7, DURATION - 0.05);
});

// ---------------- rendu ----------------
const allChars = [C.createur, C.rival, C.fille, C.pere, C.mere, C.dummy, ...C.queue];
function renderFrame(t) {
  resetOV(); OV.diagram = null;
  for (const c of allChars) c.reset();
  for (const k of ['wagonC', 'wagonR', 'wallet', 'mallet', 'plan', 'balloon', 'sparks', 'boom']) R[k].visible = false;
  if (R.tracks.r) R.tracks.r.scale.y = 1;
  fill.distance = 30;
  wheelAt(t);
  for (const c of R.clouds) c.position.x += 0;
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  sh.fn(t - sh.t0, t);
  for (const w of EV.whooshes) { const a = t - w; if (a >= 0 && a < 0.15) OV.flash = Math.max(OV.flash, 0.4 * (1 - a / 0.15)); }
  renderer.render(scene, camera);
  compose(t);
}
function drawDiagram(a) {
  ctx.save(); ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = `rgba(6,10,24,${0.82 * Math.min(1, a / 0.4)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const prog1 = range(a, 0.3, 2.8), prog2 = range(a, 2.6, 5.2);
  drawLoopDiagram(PROF.circle, 290, 1080, 14, prog1, 'CERCLE', 'SERRÉ LÀ OÙ ÇA VA VITE');
  drawLoopDiagram(PROF.drop, 790, 1080, 14, prog2, 'GOUTTE', 'SERRÉ LÀ OÙ ÇA RALENTIT');
  ctx.textAlign = 'center'; ctx.font = `italic 900 46px ${SANS}`; ctx.lineWidth = 10; ctx.strokeStyle = '#000';
  const legend = [['#43d17a', 'DOUX'], ['#ffd21f', 'FORT'], ['#ff2d3d', 'DANGER']];
  legend.forEach(([c, l], k) => { const x = 250 + k * 270, y = 420; ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(x - 110, y - 32, 220, 64, 32); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillText(l, x, y + 3); });
  ctx.restore();
}
window.renderFrame = (t, type = 'image/jpeg', q = 0.93) => { renderFrame(t); return out.toDataURL(type, q); };
window.IS_READY = true;
