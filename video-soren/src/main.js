// Mise en scène « Soren et la tour des reflets » : plans, caméra, éclairages, habillage TikTok.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { V3, clamp, lerp, smooth, easeOut, easeIn, easeOutBack, range, hash, FONT, redraw } from './lib.js';
import { makeCast, makeCity, makeCorridor, makeTowerRoom, skyTex, drawCracks, drawCard, drawBig, TOWER, frac } from './world.js';
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
const hemi = new THREE.HemisphereLight('#b8c8e0', '#3a3f4a', 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#dfe8ff', 1.6);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 5;
scene.add(sun); scene.add(sun.target);
const fill = new THREE.PointLight('#ffffff', 0, 30, 1.5); scene.add(fill);
const rim = new THREE.PointLight('#9fb6ff', 0, 30, 1.5); scene.add(rim);

const C = makeCast();
for (const c of Object.values(C)) if (c && c.root) scene.add(c.root);
for (const d of C.doubles) scene.add(d.root);
const R = makeCity(scene);
const CO = makeCorridor(scene);
const I = makeTowerRoom(scene);
const SKY = { day: skyTex('#5d6f8f', '#b9c6d8'), dusk: skyTex('#1f2a4a', '#6b6f8f'), night: skyTex('#02040f', '#14214a'), void: skyTex('#000005', '#0a0f24') };

let MODE = '';
function setMode(m) {
  MODE = m;
  const city = m === 'day' || m === 'night' || m === 'dusk';
  R.group.visible = city; CO.visible = m === 'corridor'; I.group.visible = m === 'room';
  scene.background = m === 'corridor' ? new THREE.Color('#0b1014') : m === 'room' ? SKY.void : SKY[m];
  R.stars.visible = m === 'night'; R.moon.visible = m === 'night';
  scene.fog = m === 'day' ? new THREE.Fog('#a9b6ca', 60, 420) : m === 'night' ? new THREE.Fog('#0b1330', 50, 360) : m === 'room' ? new THREE.Fog('#05081a', 30, 120) : null;
  scene.environmentIntensity = m === 'day' ? 0.6 : 0.35;
  if (m === 'day') { scene.fog.far = 700; hemi.color.set('#b8c8e0'); hemi.groundColor.set('#3a3f4a'); hemi.intensity = 1.25; sun.color.set('#dfe8ff'); sun.intensity = 1.5; R.winMat.emissiveIntensity = 0.08; R.towerMat.emissiveIntensity = 0.12; for (const l of R.lamps) l.material.emissiveIntensity = 0.2; renderer.toneMappingExposure = 1.0; }
  else if (m === 'night' || m === 'dusk') { hemi.color.set('#3b5aa8'); hemi.groundColor.set('#0d1020'); hemi.intensity = 0.9; sun.color.set('#9fb6ff'); sun.intensity = 1.1; R.winMat.emissiveIntensity = 0.6; R.towerMat.emissiveIntensity = 1.1; for (const l of R.lamps) l.material.emissiveIntensity = 2.0; renderer.toneMappingExposure = 1.2; }
  else if (m === 'corridor') { hemi.color.set('#6a7a8a'); hemi.groundColor.set('#1a1410'); hemi.intensity = 0.5; sun.intensity = 0; renderer.toneMappingExposure = 1.1; }
  else { hemi.color.set('#4a5a9a'); hemi.groundColor.set('#05060c'); hemi.intensity = 0.6; sun.intensity = 0; renderer.toneMappingExposure = 1.15; }
  for (const l of I.lights) l.visible = m === 'room';
  fill.intensity = 0; rim.intensity = 0;
}
function shadowAt(x, y, z, size = 25, dir = [0.4, 1, 0.5]) {
  sun.target.position.set(x, y, z); sun.position.set(x + dir[0] * 70, y + dir[1] * 70, z + dir[2] * 70);
  const sc = sun.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = 250; sc.updateProjectionMatrix();
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

// ---------------- sous-titres karaoké (zone sûre TikTok : centrés, au-dessus du tiers bas, loin des icônes à droite) ----------------
const GOLD = '#f5c518', SILVER = '#cfd8ff', RED = '#ff3b4e';
const KEYWORDS = /^(SOREN|MAYA|GARDIEN|REFLET|REFLETS|TOUR|MINUIT|MIROIR)/;
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
const SUB_CX = 500, SUB_MAXW = 860;
function drawSubtitles(t, cy) {
  const ch = CHUNKS.find((c) => t >= c.t0 && t < c.t1 + 0.08); if (!ch) return;
  const size = 80; ctx.font = `900 ${size}px ${SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
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
      ctx.fillStyle = active ? (key ? '#fff' : '#0b0d18') : key ? SILVER : '#ffffff';
      ctx.fillText(words[i], x, y + 3);
      ctx.restore();
      x += widths[i] + space;
    }
  });
  ctx.restore();
}
// accroche (2 premières secondes)
function drawHook(h) {
  const s = easeOutBack(range(h.age, 0, 0.25)); const a = 1 - range(h.age, h.dur - 0.3, h.dur);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(SUB_CX, 330); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `italic 900 70px ${SANS}`;
  const lines = h.text.split('\n'); const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 70;
  ctx.fillStyle = 'rgba(5,8,20,.82)'; ctx.beginPath(); ctx.roundRect(-w / 2, -60 - (lines.length - 1) * 40, w, 120 + (lines.length - 1) * 80, 24); ctx.fill();
  ctx.fillStyle = RED; ctx.fillRect(-w / 2, -60 - (lines.length - 1) * 40, 14, 120 + (lines.length - 1) * 80);
  lines.forEach((l, i) => { ctx.fillStyle = i === lines.length - 1 ? RED : '#fff'; ctx.fillText(l, 6, (i - (lines.length - 1) / 2) * 80 + 4); });
  ctx.restore();
}
// ---------------- habillage 2D ----------------
const OV = { popups: [], comics: [], tags: [], sparkles: [], flash: 0, fade: 0, title: null, vignette: 0.45 };
function resetOV() { OV.popups = []; OV.comics = []; OV.tags = []; OV.sparkles = []; OV.flash = 0; OV.fade = 0; OV.title = null; OV.vignette = 0.5; OV.hook = null; OV.subY = 1180; }
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
  drawSubtitles(t, OV.subY);
  if (OV.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(OV.flash)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (OV.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(OV.fade)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
}


// ---------------- aides ----------------
const HEAD = (c) => c.worldHead();
const headDown = (c, k = 1) => { c.headG.rotation.x = 0.55 * k; };
// copie la pose d'un personnage sur son reflet (gauche/droite inversées)
function mirrorPose(src, dst) {
  const cp = (a, b) => { b.rotation.set(a.rotation.x, -a.rotation.y, -a.rotation.z); };
  cp(src.legL, dst.legR); cp(src.legR, dst.legL); cp(src.armL, dst.armR); cp(src.armR, dst.armL);
  cp(src.headG, dst.headG); cp(src.torso, dst.torso); dst.hips.position.copy(src.hips.position);
}
// reflet dans une vitrine : le personnage est dans la rue face à la vitrine
function vitrine(side, nearZ) { let best = null; for (const v of R.vitrines) if (v.side === side && (!best || Math.abs(v.z - nearZ) < Math.abs(best.z - nearZ))) best = v; return best; }
function placeInVitrine(v, c, r, dz = 0) {
  const gx = v.x, sx = -v.side; // sx : direction rue
  c.at(gx + sx * 1.7, 0, v.z + dz, -sx * Math.PI / 2 * 1); c.root.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
  r.at(gx - sx * 0.75, 0, v.z + dz, 0); r.root.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
}
const shardOrigin = new THREE.Vector3();
function shards(t, t0, origin, spread = 1) {
  const age = t - t0; const a = R.shards.geometry.attributes.position;
  R.shards.visible = age > 0 && age < 1.6;
  if (!R.shards.visible) return;
  for (let k = 0; k < a.count; k++) {
    const v = [(hash(k) - 0.5) * 6, hash(k + 1) * 4, (hash(k + 2) - 0.5) * 6];
    a.array[k * 3] = origin.x + v[0] * age * spread; a.array[k * 3 + 1] = Math.max(0.02, origin.y + v[1] * age - 4.9 * age * age); a.array[k * 3 + 2] = origin.z + v[2] * age * spread;
  }
  a.needsUpdate = true;
}
function gearsAt(t, speed = 1) { R.gears.forEach((g, k) => { g.rotation.z = t * speed * (k % 2 ? -1 : 1) * (3 / g.r); }); }
const memo = new Map();
const once = (key, val, fn) => { if (memo.get(key) === val) return; memo.set(key, val); fn(); };
const cardHot = (k, hot) => { const c = I.cards[k]; once('card' + k, hot, () => redraw(c.tex, (cx, w, h) => drawCard(cx, w, h, c.name, c.state, hot))); };
const bigHot = (hot) => once('big', hot, () => redraw(I.bigTex, (cx, w, h) => drawBig(cx, w, h, hot)));
const cracks = (k) => once('cracks', Math.round(k * 20), () => redraw(CO.crackTex, (cx, w, h) => drawCracks(cx, w, h, k)));
const RP = (x, y, z) => [400 + x, y, z]; // salle de la tour
const CP = (x, y, z) => [200 + x, y, z]; // couloir

// ---------------- plans ----------------
const SHOTS = []; const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });

// HOOK : un homme lève la tête après minuit… son reflet, lui, ne bouge pas.
shot(0, 2.6, (lt, t) => {
  setMode('night'); const v = vitrine(-1, -2);
  const M = C.p1, Rf = C.rP1; placeInVitrine(v, M, Rf);
  const up = smooth(range(t, 0.35, 0.9));
  M.headG.rotation.x = lerp(0.55, -0.6, up); M.setFace(t > EV.hookCrack ? 'scared' : 'neutral');
  mirrorPose(M, Rf); Rf.headG.rotation.x = 0.55; Rf.setFace(t > EV.hookCrack + 0.3 ? 'smile' : 'neutral');
  if (t > EV.hookCrack + 0.6) Rf.headG.rotation.x = lerp(0.55, -0.2, smooth(range(t, 1.6, 2.4)));
  const g = V3(v.x, 2.2, v.z);
  shadowAt(v.x, 0, v.z, 10, [0.4, 1, 0.5]);
  camKeys(lt, [[0, [v.x + 3.4, 2.1, v.z + 6.2], [v.x - 0.2, 2.0, v.z - 0.6], 42], [2.6, [v.x + 3.0, 2.1, v.z + 5.0], [v.x - 0.3, 2.0, v.z - 0.6], 38]]);
  fill.position.set(v.x + 1.2, 3, v.z + 2.5); fill.intensity = 22; fill.color.set('#cfe0ff');
  shards(t, EV.hookCrack, g);
  OV.hook = { text: 'NE LÈVE JAMAIS LA TÊTE\nAPRÈS MINUIT.', age: lt - 0.05, dur: 2.6 };
  comic('CRRRK', 360, 760, t - EV.hookCrack, { size: 100, color: SILVER, rot: -0.1, dur: 0.8 });
  OV.flash = t > EV.hookCrack && t < EV.hookCrack + 0.12 ? 0.5 : 0;
});
// la ville et la tour de verre (jour gris-bleuté)
shot(2.6, 6.5, (lt, t) => {
  setMode('day'); shadowAt(0, 0, -20, 60);
  camKeys(lt, [[0, [70, 120, 110], [0, 10, -40], 44], [3.9, [18, 42, 46], [0, 30, -80], 50]], (u) => u);
  const crowd = [[C.p1, -2, 10, Math.PI, 1.1], [C.p2, 2.5, -2, 0, 1.0], [C.boulanger, -3, -14, 0, 0.9], [C.kid, 1, 4, Math.PI, 1.2]];
  for (const [c, x, z, h, sp] of crowd) { c.at(x, 0, z + Math.cos(h) * lt * sp, h).walk(lt * 6 + x, 0.5); headDown(c); }
  gearsAt(t, 0.15);
});
// Soren livre ses colis, les yeux baissés
shot(6.5, 11, (lt, t) => {
  setMode('day');
  const S = C.soren; const z = 2 + lt * 1.3; S.at(0.8, 0, z, 0).walk(lt * 7, 0.55); headDown(S);
  S.armR.rotation.x = -0.9; S.root.updateMatrixWorld(true);
  R.parcel.visible = true; R.parcel.position.copy(S.armR.localToWorld(V3(0, -0.8, 0.35)));
  shadowAt(0.8, 0, z, 10);
  camKeys(lt, [[0, [2.4, 2.4, z + 5.5], [0.6, 1.6, z], 44], [4.5, [1.8, 2.2, z + 4.6], [0.7, 1.7, z], 40]]);
  tag('SOREN', HEAD(S), lt - 0.4, 2.6, '#ffffff', '#23262f');
  C.p2.at(-2.6, 0, z - 5 + lt * 0.3, 0).walk(lt * 6, 0.5); headDown(C.p2);
});
// tout le monde marche en fixant le sol
shot(11, 15, (lt, t) => {
  setMode('day'); shadowAt(0, 0, -6, 18);
  const crowd = [[C.boulanger, -2.6, -10, 0, 1.0], [C.p1, 2.4, 2, Math.PI, 1.1], [C.kid, -0.8, -4, 0, 1.2], [C.veilleur, 1.2, -14, 0, 0.9], [C.p2, -3.2, 4, Math.PI, 1.0]];
  for (const [c, x, z, h, sp] of crowd) { c.at(x, 0, z + Math.cos(h) * lt * sp, h).walk(lt * 6 + x, 0.5); headDown(c); }
  camKeys(lt, [[0, [0, 9, 14], [0, 0.5, -6], 44], [4, [0, 6.5, 10], [0, 0.8, -6], 44]]);
  comic('TÊTE BAISSÉE.', 500, 520, lt - 0.6, { size: 80, color: '#ffffff', rot: -0.04, dur: 3.0, burst: false });
});
// la règle : après minuit, on lève la tête… crac, le reflet se désynchronise
shot(15, 20, (lt, t) => {
  setMode('night'); const v = vitrine(1, -24);
  const M = C.veilleur, Rf = C.rVeil; placeInVitrine(v, M, Rf);
  const up = smooth(range(t, EV.ruleLook - 0.3, EV.ruleLook + 0.3));
  M.headG.rotation.x = lerp(0.55, -0.55, up); M.setFace(t > EV.ruleCrack ? 'scared' : 'neutral');
  mirrorPose(M, Rf);
  if (t > EV.ruleCrack) { const d = smooth(range(t, EV.ruleCrack, EV.ruleCrack + 0.8)); Rf.headG.rotation.x = lerp(-0.55, 0.3, d); Rf.headG.rotation.y = 0.4 * d; Rf.armR.rotation.x = -2.6 * d; Rf.setFace('smile'); Rf.root.position.x += (v.side) * 0.0; }
  shadowAt(v.x, 0, v.z, 10, [0.4, 1, 0.5]);
  if (lt < 1.2) look([v.x - 2, 1.6, v.z + 6], [v.x, 2.5, v.z - 2], 46);
  else camKeys(lt, [[1.2, [v.x - 3.4, 2.1, v.z + 6.2], [v.x + 0.2, 2.0, v.z - 0.6], 42], [5, [v.x - 3.0, 2.1, v.z + 5.0], [v.x + 0.3, 2.0, v.z - 0.6], 38]]);
  fill.position.set(v.x - 1.2, 3, v.z + 2.5); fill.intensity = 16; fill.color.set('#cfe0ff');
  OV.title = lt < 1.6 ? { text: '00:01', age: lt, sub: 'APRÈS MINUIT' } : null;
  shards(t, EV.ruleCrack, V3(v.x - v.side * 0.6, 2.2, v.z));
  comic('CRRRK', 360, 760, t - EV.ruleCrack, { size: 100, color: SILVER, rot: -0.1, dur: 0.8 });
  OV.flash = t > EV.ruleCrack && t < EV.ruleCrack + 0.1 ? 0.45 : 0;
  OV.vignette = 0.75;
});
// le couloir et le miroir : Maya regarde trop longtemps
function corridorMaya(t, { freeze = false, detach = 0 } = {}) {
  const M = C.maya, Rf = C.rMaya;
  M.at(200, 0, 2.2, Math.PI); M.setFace('happy');
  Rf.at(200, 0, -2.2, 0);
  return [M, Rf];
}
shot(20, 28, (lt, t) => {
  setMode('corridor');
  const [M, Rf] = corridorMaya(t);
  const walk = range(lt, 0, 2.2); M.root.position.z = lerp(5.5, 2.2, walk); if (walk < 1) M.walk(lt * 7, 0.5);
  M.headG.rotation.x = lt > 2.4 ? -0.08 : 0; M.setFace(lt > 3 ? 'neutral' : 'happy');
  M.headG.rotation.z = Math.sin(lt * 0.8) * 0.06 * (lt > 3 ? 1 : 0);
  mirrorPose(M, Rf); Rf.root.position.z = -M.root.position.z; Rf.setFace(M.expr);
  CO.light.intensity = 18; CO.lightR.intensity = 10; cracks(0);
  camKeys(lt, [[0, CP(0.6, 2.2, 8.6), CP(0, 1.5, 0), 46], [8, CP(0.5, 1.6, 5.2), CP(0, 1.4, 0), 40]]);
  tag('MAYA', HEAD(M), lt - 1.0, 2.0, '#0b0d18', '#ff7aa8');
  if (lt > 4) comic('…', 760, 620, lt - 4.2, { size: 120, color: '#ffffff', dur: 3, burst: false });
});
shot(28, 34, (lt, t) => {
  setMode('corridor');
  const [M, Rf] = corridorMaya(t);
  // Maya bouge, son reflet reste figé… puis se détache et recule dans le couloir du miroir
  M.headG.rotation.z = Math.sin(lt * 2.2) * 0.22; M.armR.rotation.x = -1.6 - Math.sin(lt * 6) * 0.4 * (lt > 1 && lt < 3 ? 1 : 0); M.setFace(lt < 1.5 ? 'surprised' : 'scared');
  Rf.setFace(t > EV.mirrorDetach ? 'smile' : 'neutral');
  if (t > EV.mirrorDetach) { const d = range(t, EV.mirrorDetach, EV.mirrorDetach + 2.6); Rf.root.position.z = -2.2 - d * 4.5; Rf.root.rotation.y = d > 0.15 ? Math.PI : 0; Rf.walk(t * 6, 0.4); Rf.headG.rotation.y = d > 0.15 ? 0 : 0; }
  CO.light.intensity = lerp(18, 7, range(lt, 0, 6)); CO.lightR.intensity = lerp(10, 2, range(lt, 0, 6));
  OV.vignette = lerp(0.6, 0.85, range(lt, 0, 6));
  if (lt < 3) camKeys(lt, [[0, CP(1.5, 1.4, 4.4), CP(-0.2, 1.3, -1), 44], [3, CP(1.4, 1.3, 3.8), CP(-0.2, 1.3, -1.2), 40]]);
  else camKeys(lt, [[3, CP(1.6, 1.5, 4.6), CP(-0.3, 1.3, -3), 40], [6, CP(1.4, 1.4, 3.8), CP(-0.3, 1.2, -4), 34]]);
  comic('IL NE BOUGE PLUS', 500, 520, t - EV.mirrorFreeze - 0.4, { size: 70, color: SILVER, rot: -0.04, dur: 2.4, burst: false });
});
shot(34, 36.5, (lt, t) => {
  setMode('corridor');
  const [M, Rf] = corridorMaya(t); M.setFace('cry'); M.armL.rotation.x = M.armR.rotation.x = -2.0; Rf.visible = false; Rf.root.visible = false;
  cracks(smooth(range(t, EV.mirrorCrack, EV.mirrorCrack + 0.3)));
  CO.light.intensity = 5 + Math.sin(t * 40) * 2; CO.lightR.intensity = 1;
  look(CP(1.3, 1.9, 5.6), CP(-0.1, 1.8, 0), 40);
  if (lt > 0.05 && lt < 0.3) shake(0.06, t);
  comic('CRAC !', 500, 640, t - EV.mirrorCrack, { size: 130, color: SILVER, rot: -0.08, dur: 1.0 });
  OV.vignette = 0.85;
});
// les autres habitants perdent aussi leur reflet
shot(36.5, 40, (lt, t) => {
  setMode('dusk'); const v = vitrine(-1, 10);
  const B = C.boulanger; placeInVitrine(v, B, C.rBoul); C.rBoul.root.visible = false; B.setFace('scared'); B.headG.rotation.x = 0.1;
  B.armR.rotation.x = -1.2;
  shadowAt(v.x, 0, v.z, 10);
  camKeys(lt, [[0, [v.x + 3.4, 2.1, v.z + 6.2], [v.x - 0.2, 2.0, v.z - 0.6], 42], [3.5, [v.x + 3.0, 2.1, v.z + 5.0], [v.x - 0.3, 2.0, v.z - 0.6], 38]]);
  fill.position.set(v.x + 2.5, 3, v.z + 1.5); fill.intensity = 14;
  comic('PLUS DE REFLET.', 500, 520, lt - 0.6, { size: 80, color: SILVER, rot: -0.04, dur: 2.6, burst: false });
  OV.vignette = 0.7;
});
// nuit : Soren reste éveillé
shot(40, 42.5, (lt, t) => {
  setMode('night'); shadowAt(-3, 0, 4, 14, [-0.4, 1, 0.6]);
  const S = C.soren; S.at(-3.6, 0, 4, Math.PI * 0.9); S.sneak(lt * 5); S.setFace('determined'); S.headG.rotation.x = -0.5;
  look([-1.6, 1.6, 7.8], [-3.4, 4, -10], 52);
  fill.position.set(-2.5, 3, 6); fill.intensity = 12; fill.color.set('#9fb6ff');
  OV.title = { text: 'MINUIT', age: lt, sub: 'SOREN NE DORT PAS' }; OV.vignette = 0.75; OV.fade = 1 - range(lt, 0, 0.4);
});
// des dizaines de reflets glissent le long des murs vers la tour
function wallReflections(t, k0 = 0) {
  const list = [C.rBoul, C.rVeil, C.rP1, C.rMaya, ...C.doubles.slice(0, 8)];
  list.forEach((r, k) => {
    const side = k % 2 ? 1 : -1; const ph = hash(k + 3);
    const z = 20 - frac(t * 0.06 + ph) * 90; const y = 1.5 + frac(t * 0.05 + hash(k + 7)) * 9;
    r.at(side * 5.95, y, z, 0); r.root.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
    r.root.rotation.order = 'YXZ'; r.root.rotation.x = 0; r.walk(t * 6 + k, 0.5); r.setFace('blank');
  });
}
shot(42.5, 46, (lt, t) => {
  setMode('night'); shadowAt(0, 0, -10, 30, [-0.4, 1, 0.6]);
  wallReflections(t);
  camKeys(lt, [[0, [0, 1.6, 16], [0, 6, -40], 52], [3.5, [0, 2.6, 8], [0, 14, -60], 52]]);
  comic('LES REFLETS SORTENT', 500, 520, lt - 0.4, { size: 66, color: SILVER, rot: -0.04, dur: 2.8, burst: false });
  OV.vignette = 0.75;
});
// ils montent sur la tour et actionnent les mécanismes
shot(46, 49, (lt, t) => {
  setMode('night'); shadowAt(0, 30, -85, 40, [-0.4, 1, 0.6]);
  gearsAt(t, 1.2);
  C.doubles.slice(8, 18).forEach((r, k) => { const x = -8 + (k % 5) * 4, y = 8 + frac(t * 0.12 + hash(k)) * 50; r.at(TOWER.x + x, y, TOWER.z + 12.6, 0); r.climb(t * 7 + k); r.setFace('blank'); });
  camKeys(lt, [[0, [2.5, 4, -48], [0, 22, -84], 52], [3, [2, 12, -56], [0, 44, -84], 50]]);
  comic('CLAC… CLAC…', 500, 1480, lt - 0.3, { size: 70, color: SILVER, rot: 0.04, dur: 2.4, burst: false });
  OV.vignette = 0.75;
});
// Soren grimpe jusqu'au sommet
shot(49, 52, (lt, t) => {
  setMode('night'); gearsAt(t, 1.2);
  const S = C.soren; const y = 2 + smooth(range(lt, 0, 3)) * 40; S.at(TOWER.x + 7, y, TOWER.z + 12.6, Math.PI); S.climb(t * 9); S.setFace('determined');
  shadowAt(TOWER.x, y, TOWER.z + 12, 20, [-0.4, 1, 0.6]);
  look([TOWER.x + 16, y + 2, TOWER.z + 30], [TOWER.x + 6, y + 4, TOWER.z + 12], 50);
  rim.position.set(TOWER.x + 10, y + 4, TOWER.z + 18); rim.intensity = 30;
});
// la salle : les écrans des habitants
shot(52, 58.4, (lt, t) => {
  setMode('room'); bigHot(false);
  const S = C.soren;
  if (lt < 1.6) { const u = range(lt, 0, 1.6); S.at(400, 0, lerp(8, 3, u), Math.PI); S.walk(lt * 7, 0.5); }
  else { S.at(400, 0, 3, Math.PI); S.headG.rotation.y = Math.sin((lt - 1.6) * 1.1) * 0.5; }
  S.setFace('surprised');
  for (let k = 0; k < I.cards.length; k++) cardHot(k, k === 2 && lt > 3.6);
  if (lt < 1.6) look(RP(1.5, 2.6, -2.5), RP(0, 2.0, 7), 54);
  else camKeys(lt, [[1.6, RP(-3.5, 3.4, 2.5), RP(-4.1, 3.4, -7), 52], [3.4, RP(3.5, 3.4, 2.5), RP(4.1, 3.4, -7), 52], [4.2, RP(0, 3.6, 0.8), RP(0, 4.0, -7), 44], [6.4, RP(0, 3.8, 0.2), RP(0, 4.0, -7), 40]]);
});
// SOREN : REFLET DE REMPLACEMENT
shot(58.4, 62.5, (lt, t) => {
  setMode('room'); for (let k = 0; k < I.cards.length; k++) cardHot(k, false);
  const on = t > EV.bigScreen; bigHot(on && frac(t * 3) < 0.5);
  I.lights[1].intensity = on ? 20 + 50 * (frac(t * 3) < 0.5 ? 1 : 0) : 20;
  const S = C.soren; S.at(400, 0, 3, Math.PI);
  if (lt < 2.4) { camKeys(lt, [[0, RP(0, 3.8, 1.5), RP(0, 4.6, -7), 50], [1.0, RP(0, 5.2, 2.0), RP(0, 6.5, -7), 48], [2.4, RP(0, 5.6, 0.6), RP(0, 6.6, -7), 44]]); S.setFace('surprised'); }
  else { S.setFace('scared'); S.headG.rotation.x = -0.2; camKeys(lt, [[2.4, RP(0.3, 2.2, 0.4), RP(0, 2.0, 3), 50], [4.1, RP(0.25, 2.15, 0.9), RP(0, 2.0, 3), 46]]); fill.position.set(400, 5, 0); fill.intensity = 25 + 25 * (frac(t * 3) < 0.5 ? 1 : 0); fill.color.set('#ff3b4e'); }
});
// la photo
shot(62.5, 65.6, (lt, t) => {
  setMode('room'); bigHot(false);
  const S = C.soren; S.at(399.5, 0, 3, Math.PI);
  const raise = smooth(range(lt, 0, 0.5)); S.armR.rotation.x = -1.75 * raise; S.armL.rotation.x = -1.55 * raise; S.armL.rotation.z = 0.35 * raise; S.setFace('determined');
  S.root.updateMatrixWorld(true);
  I.phone.visible = true; I.phone.position.copy(S.armR.localToWorld(V3(-0.25, -0.95, 0.1))); I.phone.quaternion.copy(S.root.quaternion); I.phone.rotateY(Math.PI); I.phone.rotateX(-0.2);
  I.phoneScreen.material.emissiveIntensity = t > EV.photo ? 2.5 : 1.0;
  camKeys(lt, [[0, RP(-1.7, 3.0, 5.8), RP(0, 4.6, -7), 52], [3.1, RP(-1.5, 2.9, 5.2), RP(0, 4.8, -7), 50]]);
  OV.flash = t > EV.photo ? 1 - range(t, EV.photo, EV.photo + 0.35) : 0;
  comic('CLIC', 760, 520, t - EV.photo, { size: 100, color: '#ffffff', rot: 0.1, dur: 0.8 });
});
// la porte se verrouille
shot(65.6, 69.5, (lt, t) => {
  setMode('room'); bigHot(false);
  const locked = t > EV.doorLock; I.bolt.position.x = locked ? lerp(1.6, 0.6, easeOut(range(t, EV.doorLock, EV.doorLock + 0.15))) : 1.6;
  I.lockLight.material.color.set(locked ? '#ff2b3d' : '#3dff8a'); I.lockLight.material.emissive.set(locked ? '#ff2b3d' : '#3dff8a');
  const S = C.soren; const ts = EV.doorLock - 65.6;
  if (lt < ts + 0.3) { S.at(399.5, 0, 3, Math.PI); S.setFace('happy'); }
  else if (lt < ts + 0.7) { S.at(399.5, 0, 3, Math.PI + Math.PI * smooth(range(lt, ts + 0.3, ts + 0.7))); S.setFace('surprised'); }
  else { const u = range(lt, ts + 0.7, 3.2); S.at(399.7, 0, lerp(3, 6.1, u), 0); if (u < 1) S.walk(lt * 12, 0.8); else { const b = Math.abs(Math.sin(lt * 11)); S.armL.rotation.x = -1.6 - b * 0.6; S.armR.rotation.x = -1.6 - (1 - b) * 0.6; } S.setFace('scared'); }
  fill.position.set(400, 4, 4.5); fill.intensity = 30; fill.color.set(locked ? '#ff6070' : '#9fb6ff');
  camKeys(lt, [[0, RP(3.2, 2.7, 0.2), RP(-0.2, 2.3, 6.8), 52], [3.9, RP(2.6, 2.5, 2.6), RP(-0.2, 2.2, 6.8), 46]]);
  comic('CLAC !', 500, 600, t - EV.doorLock, { size: 150, color: RED, rot: -0.1, dur: 1.0 });
});
// le Gardien de la Tour
shot(69.5, 75, (lt, t) => {
  setMode('room'); bigHot(false);
  const G = C.gardien; const appear = smooth(range(t, EV.guardian, EV.guardian + 1.2));
  G.at(400, 0, -5.3, 0); G.setFace(t < EV.guardian + 2.5 ? 'smirk' : 'evil');
  G.root.position.y = 0; G.armR.rotation.x = t > EV.lever - 0.4 ? -1.2 : -0.5; G.armL.rotation.x = -0.4;
  I.levers[1].rotation.x = t > EV.lever ? lerp(-0.5, 0.6, smooth(range(t, EV.lever, EV.lever + 0.4))) : -0.5;
  rim.position.set(400, 3.5, -2); rim.intensity = 30 * appear; rim.color.set('#9fb6ff');
  I.lights[0].intensity = lerp(50, 18, appear);
  const S = C.soren; S.at(400.3, 0, 5.9, Math.PI); S.setFace('scared');
  camKeys(lt, [[0, RP(0.6, 3.0, 4.6), RP(0, 2.6, -5.3), 46], [2.6, RP(0.4, 3.1, 0.6), RP(0, 3.0, -5.3), 38], [5.5, RP(0.3, 3.2, -1.6), RP(0, 3.4, -5.3), 32]]);
  G.root.updateMatrixWorld(true);
  sparkle(G.glasses.getWorldPosition(V3()), t - (EV.guardian + 1.6), 110);
  tag('LE GARDIEN', HEAD(G), t - EV.guardian - 0.8, 1.8, '#ffffff', '#191923');
  comic('CLONK', 500, 1500, t - EV.lever, { size: 90, color: SILVER, rot: 0.06, dur: 0.8 });
  OV.vignette = 0.75;
});
// la salle tremble
shot(75, 78, (lt, t) => {
  setMode('room'); bigHot(frac(t * 4) < 0.5);
  const S = C.soren; S.at(400 + Math.sin(lt * 5) * 0.3, 0, 3.5, Math.PI + 0.4); S.setFace('scared');
  S.armL.rotation.z = -1.3 + Math.sin(lt * 9) * 0.3; S.armR.rotation.z = 1.3 + Math.sin(lt * 8) * 0.3; S.root.rotation.z = Math.sin(lt * 6) * 0.15;
  C.gardien.at(400, 0, -5.3, 0); C.gardien.setFace('evil');
  for (const l of I.lights) l.intensity *= frac(t * 7) < 0.3 ? 0.3 : 1;
  look(RP(-5.2, 4.6, 5.4), RP(0.5, 2.6, -2), 58); shake(0.13, t);
  comic('VRRRMMM', 500, 600, lt - 0.2, { size: 110, color: SILVER, rot: -0.08, dur: 2.2 });
});
// la salle est suspendue dans le vide… entourée de dizaines de doubles de Soren
shot(78, DURATION, (lt, t) => {
  setMode('room'); bigHot(false);
  const S = C.soren; S.at(400, 0, 1.5, Math.PI * 0.85); S.setFace('scared'); S.headG.rotation.y = Math.sin(lt * 0.9) * 0.5;
  C.gardien.at(400, 0, -5.3, 0); C.gardien.setFace('evil');
  C.doubles.forEach((d, k) => {
    const a = (k / C.doubles.length) * Math.PI * 2 + hash(k) * 0.2, r = 10.5 + hash(k + 1) * 11, y = -4 + hash(k + 2) * 12;
    const x = 400 + Math.cos(a) * r, z = Math.sin(a) * r;
    d.at(x, y, z, Math.atan2(400 - x, 0 - z)); d.setFace(lt > 2.5 ? 'smile' : 'blank'); d.headG.rotation.x = clamp((y - 1) / r, -0.6, 0.6) * -0.8;
  });
  I.group.position.y = Math.sin(t * 0.7) * 0.15; I.group.rotation.z = Math.sin(t * 0.9) * 0.012;
  const u = easeOut(range(lt, 0, 5.5));
  look(RP(lerp(1.5, 22, u), lerp(3, 7, u), lerp(3, 27, u)), RP(0, 3, -1), lerp(48, 56, u));
  rim.position.set(400, 6, 14); rim.intensity = 60; rim.distance = 60; rim.color.set('#9fb6ff');
  OV.vignette = 0.85; OV.flash = 0.6 * (1 - range(lt, 0, 0.3));
  if (t > EV.endTitle) OV.title = { text: 'À SUIVRE...', age: t - EV.endTitle, sub: 'LA TOUR DES REFLETS — ÉP. 1' };
  OV.fade = range(t, DURATION - 0.9, DURATION - 0.1);
});

// ---------------- rendu ----------------
const allChars = Object.values(C).filter((c) => c && c.root).concat(C.doubles);
function renderFrame(t) {
  resetOV();
  for (const c of allChars) { c.reset(); c.visible = true; }
  R.parcel.visible = false; R.shards.visible = false; I.phone.visible = false; I.group.position.y = 0; I.group.rotation.z = 0;
  for (const l of I.lights) l.intensity = l.userData.base ??= l.intensity;
  fill.color.set("#ffffff"); rim.distance = 30;
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  sh.fn(t - sh.t0, t);
  R.beacon.material.emissiveIntensity = 1 + Math.sin(t * 4) * 0.8;
  for (const w of EV.whooshes) { const a = t - w; if (a >= 0 && a < 0.2) OV.flash = Math.max(OV.flash, 0.5 * (1 - a / 0.2)); }
  renderer.render(scene, camera);
  compose(t);
}
window.renderFrame = (t, type = 'image/jpeg', q = 0.93) => { renderFrame(t); return out.toDataURL(type, q); };
window.IS_READY = true;
