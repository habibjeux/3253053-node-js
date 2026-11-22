// Mise en scène « Léo et la ville du silence » : plans, caméra, éclairage, habillage 2D.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { V3, clamp, lerp, smooth, easeOut, easeIn, easeOutBack, range, hash, FONT, redraw } from './lib.js';
import { makeCast, makeTown, makeControlRoom, makeStudio, skyTex, drawBoard, drawCounter, drawFee, drawBig, drawSafe, LH, LANTERN, frac } from './world.js';
import { LINES, EV, WIDTH, HEIGHT, DURATION } from './timeline.js';

await document.fonts.load('80px "Luckiest Guy"');
const SCALE = Number(new URLSearchParams(location.search).get('s') || 1);

// ---------------- moteur ----------------
const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(Math.round(WIDTH * SCALE), Math.round(HEIGHT * SCALE), false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;

const out = document.getElementById('out');
out.width = Math.round(WIDTH * SCALE); out.height = Math.round(HEIGHT * SCALE);
const ctx = out.getContext('2d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 3000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const hemi = new THREE.HemisphereLight('#d6ecff', '#f3e3c3', 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1d6', 2.8);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 4;
scene.add(sun); scene.add(sun.target);
const fill = new THREE.PointLight('#ffffff', 0, 30, 1.5); scene.add(fill);
const lanternLight = new THREE.PointLight('#ffd84a', 0, 80, 1.2); lanternLight.position.copy(LANTERN); scene.add(lanternLight);

const C = makeCast();
for (const c of Object.values(C)) scene.add(c.root);
const R = makeTown(scene);
const vaneRT = new THREE.WebGLRenderTarget(768, 384, { samples: 4 });
const I = makeControlRoom(scene, vaneRT);
const ST = makeStudio(scene);
ST.cam.aspect = 2; ST.cam.updateProjectionMatrix();

const SKY = { day: skyTex('#2f8cf0', '#bfe9ff'), golden: skyTex('#3d7fe0', '#ffd6a5'), night: skyTex('#03081e', '#1c3170') };

function setMode(m) {
  const night = m === 'night', inter = m === 'interior';
  R.group.visible = !inter; I.group.visible = inter;
  scene.background = inter ? new THREE.Color('#0b0f18') : SKY[m];
  R.stars.visible = night; R.moon.visible = night;
  scene.fog = inter ? null : new THREE.Fog(night ? '#0b1638' : m === 'golden' ? '#ffe2c0' : '#cfeaff', night ? 80 : 120, night ? 500 : 900);
  scene.environmentIntensity = night ? 0.12 : inter ? 0.35 : 0.55;
  R.beam.visible = night; for (const r of R.rings) r.visible = false;
  for (const l of I.lights) l.visible = inter;
  if (night) {
    hemi.color.set('#4b6cc7'); hemi.groundColor.set('#1a2140'); hemi.intensity = 0.9;
    sun.color.set('#9db8ff'); sun.intensity = 1.1;
    R.winMat.emissiveIntensity = 0.5; for (const l of R.lamps) l.material.emissiveIntensity = 2.2;
    R.lighthouse.lampMat.emissiveIntensity = 3; lanternLight.intensity = 400;
    R.seaMat.color.set('#0d3a6b');
    renderer.toneMappingExposure = 1.15;
  } else if (inter) {
    hemi.color.set('#9fb4d6'); hemi.groundColor.set('#1a1d26'); hemi.intensity = 0.7; sun.intensity = 0; lanternLight.intensity = 0;
    renderer.toneMappingExposure = 1.05;
  } else {
    hemi.color.set('#d6ecff'); hemi.groundColor.set('#f3e3c3'); hemi.intensity = 1.15;
    sun.color.set(m === 'golden' ? '#ffd29a' : '#fff1d6'); sun.intensity = 2.9;
    R.winMat.emissiveIntensity = 0.05; for (const l of R.lamps) l.material.emissiveIntensity = 0.3;
    R.lighthouse.lampMat.emissiveIntensity = 0.4; lanternLight.intensity = 0;
    R.seaMat.color.set('#1593d6');
    renderer.toneMappingExposure = 1.0;
  }
  fill.intensity = 0;
}
function shadowAt(x, y, z, size = 25, dir = [0.55, 1, 0.45]) {
  sun.target.position.set(x, y, z); sun.position.set(x + dir[0] * 70, y + dir[1] * 70, z + dir[2] * 70);
  const sc = sun.shadow.camera; sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = 250; sc.updateProjectionMatrix();
}

// ---------------- caméra ----------------
function look(p, t, fov = 50) { camera.position.set(...p); camera.fov = fov; camera.updateProjectionMatrix(); camera.up.set(0, 1, 0); camera.lookAt(...t); }
function camKeys(lt, keys, ease = smooth) {
  let i = 0; while (i < keys.length - 2 && lt > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = b === a ? 0 : ease(range(lt, a[0], b[0]));
  const L = (p, q) => p.map((v, k) => lerp(v, q[k], u));
  look(L(a[1], b[1]), L(a[2], b[2]), lerp(a[3] || 50, b[3] || 50, u));
}
function shake(amount, t) { camera.position.x += Math.sin(t * 63) * amount; camera.position.y += Math.sin(t * 71 + 1) * amount; camera.rotateZ(Math.sin(t * 47) * amount * 0.05); }

// ---------------- habillage 2D ----------------
const OV = { popups: [], comics: [], tags: [], sparkles: [], flash: 0, fade: 0, title: null, vignette: 0.45 };
function resetOV() { OV.popups = []; OV.comics = []; OV.tags = []; OV.sparkles = []; OV.flash = 0; OV.fade = 0; OV.title = null; OV.vignette = 0.45; }
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

const CHUNKS = [];
for (const [a, b, text] of LINES) {
  const words = [];
  for (const w of text.split(/\s+/)) {
    if (words.length && /^([€:;!?,.»]+|\.\.\.)$/.test(w)) words[words.length - 1] += ' ' + w;
    else if (words.length && words[words.length - 1] === '«') words[words.length - 1] += ' ' + w;
    else words.push(w);
  }
  for (let i = 0; i < words.length - 1; i++) if (/^\d+$/.test(words[i]) && /^\d{3}/.test(words[i + 1])) { words[i] += ' ' + words[i + 1]; words.splice(i + 1, 1); }
  const weights = words.map((w) => w.length + 3); const tot = weights.reduce((s, v) => s + v, 0);
  let tt = a; const timed = words.map((w, i) => { const d = (b - a) * weights[i] / tot; const r = { w, t0: tt, t1: tt + d }; tt += d; return r; });
  let cur = [];
  const flush = () => { if (cur.length) CHUNKS.push({ words: cur, t0: cur[0].t0, t1: cur[cur.length - 1].t1 }); cur = []; };
  for (const tw of timed) {
    const len = cur.reduce((s, x) => s + x.w.length + 1, 0);
    if (cur.length >= 3 || len + tw.w.length > 17) flush();
    cur.push(tw);
    if (/[,.:;!?»]$/.test(tw.w) && cur.length >= 2) flush();
  }
  flush();
}
function drawSubtitles(t) {
  const ch = CHUNKS.find((c) => t >= c.t0 && t < c.t1 + 0.05); if (!ch) return;
  const size = 88; ctx.font = `${size}px ${FONT}`;
  const words = ch.words.map((w) => w.w.toUpperCase()); const space = size * 0.28;
  const widths = words.map((w) => ctx.measureText(w).width);
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => { if (rw + widths[i] > WIDTH - 140 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += widths[i] + space; });
  const pop = easeOutBack(range(t, ch.t0, ch.t0 + 0.16)); const cy = 1290;
  ctx.save(); ctx.translate(WIDTH / 2, cy); ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop); ctx.translate(-WIDTH / 2, -cy);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  rows.forEach((row, ri) => {
    const total = row.reduce((s, i) => s + widths[i], 0) + space * (row.length - 1);
    let x = WIDTH / 2 - total / 2; const y = cy + (ri - (rows.length - 1) / 2) * size * 1.12;
    for (const i of row) {
      const active = t >= ch.words[i].t0 && t < ch.words[i].t1 + 0.02;
      ctx.save();
      if (active) { ctx.translate(x + widths[i] / 2, y); ctx.scale(1.08, 1.08); ctx.translate(-(x + widths[i] / 2), -y); }
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowOffsetY = 8;
      outlined(words[i], x, y, size, active ? '#ffd23f' : '#ffffff', '#141218', 17);
      ctx.restore(); x += widths[i] + space;
    }
  });
  ctx.restore();
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
  drawSubtitles(t);
  if (OV.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(OV.flash)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (OV.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(OV.fade)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
}

// ---------------- états d'écrans (redessinés seulement si changement) ----------------
const memo = new Map();
const once = (key, val, fn) => { if (memo.get(key) === val) return; memo.set(key, val); fn(); };
const board = (db, alert, line2 = 'AMENDE : 15 €') => once('board', `${db.toFixed(2)}|${alert}|${line2}`, () => redraw(R.boardTex, (c, w, h) => drawBoard(c, w, h, { db, alert, line2 })));
function sensorOn(k, on) { const s = R.sensors[k]; once('sens' + k, on, () => { redraw(s.tex, (c, w, h) => drawCounter(c, w, h, on ? '-15 €' : '15 €', on)); s.led.material.emissiveIntensity = on ? 3 : 0.2; }); }
const feeHot = (k, hot) => { const f = I.fees[k]; once('fee' + k, hot, () => redraw(f.tex, (c, w, h) => drawFee(c, w, h, f.name, f.price, hot))); };
const bigHot = (hot) => once('big', hot, () => redraw(I.bigTex, (c, w, h) => drawBig(c, w, h, hot)));
const safeText = (text, flash) => once('safe', text + flash, () => redraw(I.safeTex, (c, w, h) => drawSafe(c, w, h, text, flash)));
function bigShowsVane(on) { const m = on ? vaneRT.texture : I.bigTex; if (I.bigMat.map !== m) { I.bigMat.map = m; I.bigMat.needsUpdate = true; } }

// ---------------- aides d'animation ----------------
const HEAD = (c) => c.worldHead();
function eqAnim(t, k = 1) { I.eq.forEach((b, i) => { const h = 0.2 + k * (0.5 + 0.5 * Math.sin(t * (6 + i * 1.3) + i)) * 1.4; b.scale.y = h; b.position.y = 1.5 + h / 2; }); }
function billsAt(t, rate = 1) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
  const top = I.tubeTop, bot = I.tubeBottom;
  for (let k = 0; k < I.bills.count; k++) {
    const u = frac(t * 0.8 * rate + hash(k));
    const y = lerp(top.y, bot.y + 0.2, u);
    const vis = rate > 0;
    e.set(Math.sin(t * 5 + k) * 1.2, t * 3 + k, Math.cos(t * 4 + k) * 0.8); q.setFromEuler(e); s.setScalar(vis ? 1 : 0);
    m.compose(V3(top.x + Math.sin(k * 2.3 + t * 3) * 0.35, y, top.z + Math.cos(k * 1.7 + t * 2) * 0.35), q, s);
    I.bills.setMatrixAt(k, m);
  }
  I.bills.instanceMatrix.needsUpdate = true;
}
function gulls(t, center = V3(0, 0, 10)) {
  R.gulls.forEach((g, k) => {
    const a = t * (0.3 + hash(k) * 0.2) + k * 0.9, r = 14 + hash(k + 2) * 18;
    g.position.set(center.x + Math.cos(a) * r, 16 + hash(k + 4) * 10 + Math.sin(t + k) * 1.5, center.z + Math.sin(a) * r);
    g.rotation.y = -a; const f = Math.sin(t * 9 + k) * 0.5; g.userData.wl.rotation.z = f; g.userData.wr.rotation.z = -f;
  });
}
function sea(t) { for (const f of R.foam) { const u = f.userData; f.position.set(u.x + Math.sin(t * 0.4 + u.ph * 6) * 2, -1.14, u.z + frac(t * 0.02 + u.ph) * 8); } R.boats.forEach((b, k) => { b.rotation.z = Math.sin(t * 1.2 + k) * 0.04; b.position.y = -1.0 + Math.sin(t * 1.5 + k) * 0.08; }); }
function crowd(list, t, area) { list.forEach(([c, x, z, h, sp], k) => { const d = t * sp; c.at(x + Math.sin(h) * d, 0, z + Math.cos(h) * d, h); c.tiptoe(t * 6 + k); }); }

// ---------------- les plans ----------------
const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });
const DAYCROWD = () => [[C.p1, -8, -4, 0.4, 0.7], [C.p2, 6, 4, -2.4, 0.6], [C.p3, -3, 8, 2.6, 0.6], [C.p4, 2, -6, 1.2, 0.7]];

// 1A — plan large : ville, port, phare
shot(0, 4, (lt, t) => {
  setMode('day'); shadowAt(0, 0, 0, 50); board(0, false);
  camKeys(lt, [[0, [70, 48, 95], [8, 8, -2], 44], [4, [30, 22, 48], [0, 6, -6], 50]], (u) => u);
  crowd(DAYCROWD(), t);
});
// 1B — le panneau : BRUIT AUTORISÉ 0 dB / AMENDE 15 €
shot(4, 8, (lt, t) => {
  setMode('day'); shadowAt(0, 0, -6, 20);
  const alert = t > EV.boardFlash[0] && t < EV.boardFlash[0] + 1.2 && frac(t * 4) < 0.5;
  board(t > EV.boardFlash[0] ? 0.1 : 0, alert);
  camKeys(lt, [[0, [3, 1.6, 8], [0, 7.5, -11], 58], [4, [1.5, 2.6, 4], [0, 9.6, -11], 56]]);
  C.p1.at(-2.5 + lt * 0.9, 0, -3, Math.PI / 2).tiptoe(lt * 6); C.p1.headG.rotation.x = -0.35;
  C.p2.at(3, 0, -2 - lt * 0.3, -Math.PI / 2 - 0.3).tiptoe(lt * 6 + 1); C.p2.setFace('scared');
});
// 1C — tout le monde marche sur la pointe des pieds
shot(8, 12.5, (lt, t) => {
  setMode('day'); shadowAt(0, 0, 2, 14); board(0, false);
  look([3.2 - lt * 0.3, 0.55, 5.6], [-0.5, 0.9, 1.2], 52);
  C.p3.at(-4 + lt * 1.1, 0, 1.5, Math.PI / 2).tiptoe(lt * 7); C.p3.setFace('scared');
  C.p4.at(3 - lt * 0.9, 0, -0.5, -Math.PI / 2).tiptoe(lt * 7 + 2); C.p4.setFace('neutral');
  C.p1.at(-1 + lt * 0.3, 0, -4, 0.3).tiptoe(lt * 6);
  comic('TIP… TIP… TIP…', 540, 520, lt - 0.6, { size: 90, color: '#ffffff', rot: -0.05, dur: 3.2, burst: false });
});
// 1D — le livreur freine : bip ! -15 €
shot(12.5, 17, (lt, t) => {
  setMode('day'); board(0, false);
  const tb = EV.bikeBrake - 12.5;
  const v = 6;
  const x = lt < tb ? -18 + lt * v : -18 + tb * v + (1 - Math.exp(-5 * (lt - tb))) * 1.6;
  const B = R.bike; B.visible = true; B.position.set(x, 0, 4); B.rotation.set(lt > tb ? -Math.sin(range(lt, tb, tb + 0.4) * Math.PI) * 0.12 : 0, Math.PI / 2, 0);
  const L = C.livreur; L.at(x, 0.45, 4, Math.PI / 2); L.sit(); L.hips.position.y = 1.0; L.legL.rotation.x = -1.2 + Math.sin(lt * 9) * 0.4 * (lt < tb ? 1 : 0); L.legR.rotation.x = -1.2 - Math.sin(lt * 9) * 0.4 * (lt < tb ? 1 : 0);
  L.armL.rotation.x = L.armR.rotation.x = -1.2; L.torso.rotation.x = 0.25 + (lt > tb ? Math.sin(range(lt, tb, tb + 0.4) * Math.PI) * 0.3 : 0);
  L.setFace(lt < tb ? 'happy' : lt < tb + 0.6 ? 'surprised' : 'pain');
  shadowAt(x, 0, 4, 12);
  look([x + 1.5, 2.2, 11.5], [x, 1.6, 4], 50);
  const tbip = EV.bikeBip - 12.5;
  sensorOn(0, lt > tbip && lt < tbip + 1.8 && frac(lt * 4) < 0.6);
  bubble('bip', HEAD(L).add(V3(1.2, -0.6, 0)), lt - tbip, 0.6, 50);
  popup('-15 €', HEAD(L), lt - tbip - 0.25, { size: 120, dur: 1.6 });
  comic('SKRIIIIK !', 540, 620, lt - tb, { size: 110, color: '#ff8c1a', rot: -0.08, dur: 0.8 });
  C.p2.at(x + 4, 0, 0.5, -0.4).tiptoe(lt * 6); C.p2.setFace(lt > tbip ? 'surprised' : 'neutral');
});
// 1E — les passants lèvent les yeux vers le compteur géant
shot(17, 20, (lt, t) => {
  setMode('day'); shadowAt(0, 0, -4, 18);
  board(0.9, frac(t * 3) < 0.5, 'LIVREUR : -15 €');
  camKeys(lt, [[0, [-0.5, 1.2, 9.5], [0, 7.5, -11], 60], [3, [-0.5, 1.6, 8], [0, 9, -11], 56]]);
  [[C.p1, -2.4, 1.5], [C.p2, 1.6, 1.0], [C.p3, -0.6, 3.2], [C.p4, 2.8, 3.6], [C.s1, -3.6, 4.2]].forEach(([c, x, z], k) => {
    c.at(x, 0, z, Math.PI + (x * -0.04)); c.headG.rotation.x = -0.45 * smooth(range(lt, 0.1 + k * 0.12, 0.6 + k * 0.12)); c.setFace(k % 2 ? 'surprised' : 'scared');
  });
  C.livreur.at(4.6, 0, -2, -2.4); C.livreur.setFace('pain'); C.livreur.armR.rotation.x = -2.6;
});

// 2F — zoom sur le phare qui surplombe la ville (M. Vane sur la galerie)
shot(20, 24, (lt, t) => {
  setMode('day'); shadowAt(28, 14, 8, 30); board(0, false);
  const top = LANTERN.clone().add(V3(0, -3, 0));
  camKeys(lt, [[0, [-8, 2.4, 10], top.toArray(), 42], [2.2, [-8, 2.4, 10], top.toArray(), 16], [4, [-7.5, 2.6, 9.5], [top.x, top.y - 1.2, top.z], 12]]);
  C.vane.at(LH.x - 3.05, LH.y + 26.1, LH.z + 0.3, -Math.PI / 2); C.vane.setFace('smirk'); C.vane.armR.rotation.x = -0.3;
  C.vane.root.updateMatrixWorld(true);
  sparkle(C.vane.glasses.getWorldPosition(V3()), lt - 3.0, 90);
  crowd([[C.p3, -3, 4, 1.6, 0.6], [C.p4, 2, 2, -1.5, 0.6]], t);
});
// 2G — Mila éternue : -15 €
shot(24, 30, (lt, t) => {
  setMode('day'); board(0, false);
  const ts = EV.milaSneeze - 24;
  const M = C.mila;
  const x = -12.5 + Math.min(lt, ts - 0.6) * 1.3;
  M.at(x, 0, 8, Math.PI / 2);
  if (lt < ts - 0.6) { M.walk(lt * 7, 0.5); M.setFace('happy'); }
  else if (lt < ts) { const u = range(lt, ts - 0.6, ts); M.headG.rotation.x = -0.45 * u; M.torso.rotation.x = -0.15 * u; M.setFace('surprised'); }
  else if (lt < ts + 0.35) { M.headG.rotation.x = 0.4; M.torso.rotation.x = 0.35; M.setFace('pain'); M.armL.rotation.x = M.armR.rotation.x = -1.2; }
  else { M.setFace(lt < ts + 1.4 ? 'surprised' : 'scared'); M.headG.rotation.y = -0.6 * smooth(range(lt, ts + 0.5, ts + 1)); }
  shadowAt(x, 0, 8, 12);
  camKeys(lt, [[0, [-10.5, 1.4, 12.8], [-11.5, 1.0, 8], 46], [ts - 0.5, [-9.6, 1.4, 12.6], [-9.9, 1.0, 8], 46], [ts + 0.8, [-9.4, 1.8, 13.4], [-9.6, 2.0, 6], 54], [6, [-9.3, 1.9, 13.6], [-9.5, 2.2, 5.5], 54]]);
  sensorOn(0, lt > ts + 0.2 && frac(lt * 4) < 0.6);
  comic('ATCHOUM !', 540, 600, lt - ts, { size: 120, color: '#7df9ff', rot: 0.08, dur: 1.0 });
  popup('-15 €', HEAD(M), lt - ts - 0.4, { size: 120, dur: 1.8 });
  tag('MILA', HEAD(M), lt - 0.3, 2.0, '#1d1b2a', '#ffd23f');
  C.p1.at(-4, 0, 11, -1.2).tiptoe(lt * 6); C.p1.setFace(lt > ts ? 'surprised' : 'neutral');
});
// 2H — porte-monnaie vide
shot(30, 34, (lt, t) => {
  setMode('day'); board(0, false); shadowAt(-7, 0, 8, 10);
  const M = C.mila; M.at(-7, 0, 8, 0.25); M.setFace(lt < 1.2 ? 'scared' : 'cry');
  M.armL.rotation.x = M.armR.rotation.x = -0.75; M.armL.rotation.z = 0.25; M.armR.rotation.z = -0.25; M.headG.rotation.x = 0.35;
  M.root.updateMatrixWorld(true);
  const hand = M.armR.localToWorld(V3(-0.3, -0.95, 0.2));
  R.purse.visible = true; R.purse.position.copy(hand); R.purse.rotation.set(0, 0.25, 0);
  R.purseLid.rotation.x = -1.8 * smooth(range(t, EV.purse, EV.purse + 0.5));
  camKeys(lt, [[0, [-5.6, 1.5, 13.8], [-7, 1.0, 8], 40], [4, [-5.9, 1.4, 12.8], [-7, 0.95, 8], 36]]);
  comic('0 €', 540, 400, t - EV.purse - 0.3, { size: 200, color: '#ff2e4d', dur: 3, rot: -0.06 });
  sparkle(hand.clone().add(V3(0, 0.3, 0)), t - EV.purse - 0.2, 40);
});
// 2I — chuchotements et chaussons épais
shot(34, 40, (lt, t) => {
  setMode('day'); board(0, false);
  if (lt < 3) {
    shadowAt(-20, 0, -2, 12);
    const A = C.s1, B = C.s2;
    A.at(-20.5, 0, -2.5, 0.9); B.at(-19.0, 0, -1.6, -2.3);
    A.armR.rotation.x = -2.3; A.armR.rotation.z = 0.5; A.headG.rotation.y = 0.3; A.setFace('scared');
    B.headG.rotation.z = 0.15; B.setFace('surprised'); B.torso.rotation.x = 0.1;
    look([-18.6, 2.0, 5.6], [-19.8, 1.5, -2.0], 42);
    bubble('chut…', HEAD(A), t - EV.whispers[0], 1.3, 58);
    bubble('psst…', HEAD(B), t - EV.whispers[1], 1.3, 58);
  } else {
    const u = lt - 3;
    const P = C.pecheur; P.at(-14, 0.0, 19 + u * 0.7, 0); P.tiptoe(u * 5); P.setFace('scared'); P.armR.rotation.x = -0.6;
    shadowAt(-14, 0, 21, 10);
    camKeys(u, [[0, [-12.0, 0.9, 27.5], [-14, 0.5, 20.5], 46], [3, [-12.2, 1.7, 28.5], [-14, 1.6, 21.5], 50]]);
    bubble('chut…', HEAD(P), t - EV.whispers[2], 1.4, 58);
    tag('LE PÊCHEUR', HEAD(P), u - 0.2, 1.4, '#1d1b2a', '#ffd000');
  }
});

// 3J — nuit : Léo se faufile
shot(40, 43, (lt, t) => {
  setMode('night'); shadowAt(4, 0, 6, 16, [-0.4, 1, 0.6]); board(0, false);
  const L = C.leo; const x = -2 + lt * 1.6; L.at(x, 0, 6, Math.PI / 2 - 0.15); L.sneak(lt * 7); L.setFace('determined');
  look([x - 5.2, 1.3, 9.2], [x + 8, 8, 7], 60);
  fill.position.set(x - 1, 3, 8); fill.intensity = 12; fill.color.set('#ffcf8a');
  OV.title = { text: 'MINUIT', age: lt, sub: 'LA VILLE DORT…' }; OV.vignette = 0.7;
  OV.fade = 1 - range(lt, 0, 0.45);
  tag('LÉO', HEAD(L), lt - 0.6, 1.8, '#ffd23f', '#2fa84f');
  comic('Z z z', 820, 760, lt - 0.2, { size: 80, color: '#cfe8ff', rot: 0.1, dur: 2.6, burst: false });
});
// 3K — faisceau et onde sonore depuis la lanterne
shot(43, 48, (lt, t) => {
  setMode('night'); OV.vignette = 0.7; board(0, false);
  for (let k = 0; k < R.rings.length; k++) {
    const age = t - EV.waves[k]; const r = R.rings[k];
    if (age < 0 || age > 2.6) continue;
    r.visible = true; const rad = 1 + age * 26; r.scale.setScalar(rad); r.position.set(LANTERN.x, LANTERN.y - age * 9, LANTERN.z);
    r.material.opacity = 0.6 * (1 - age / 2.6);
  }
  R.sensors.forEach((s, k) => {
    const d = Math.hypot(s.pos.x - LANTERN.x, s.pos.z - LANTERN.z);
    let on = false; for (const w of EV.waves) { const age = t - w; if (age > 0 && Math.abs(1 + age * 26 - d) < 5) on = true; }
    sensorOn(k, on);
  });
  if (lt < 2.5) { camKeys(lt, [[0, [22, 46, 26], [6, 12, -6], 52], [2.5, [20, 44, 24], [4, 8, -6], 54]]); shadowAt(10, 0, 0, 40, [-0.4, 1, 0.6]); }
  else { camKeys(lt, [[2.5, [-12, 9, 19], [8, 6, 2], 56], [5, [-11, 8, 17.5], [9, 7, 3], 54]]); shadowAt(0, 0, 4, 25, [-0.4, 1, 0.6]); }
  comic('VWOOOM…', 540, 1640, t - EV.waves[0], { size: 90, color: '#7df9ff', rot: -0.05, dur: 1.4, burst: false });
});
// 3L — Léo grimpe la falaise
shot(48, 52, (lt, t) => {
  setMode('night'); OV.vignette = 0.7; board(0, false);
  const L = C.leo; const tc = EV.climbStart - 48;
  let y = 0, x = 21.2;
  if (lt < tc) { L.at(19 + lt * 10, 0, 13, Math.PI / 2); L.sneak(lt * 9); }
  else if (lt < 3.5) { y = 12.6 * smooth(range(lt, tc, 3.5)); L.at(x, y, 13, Math.PI / 2); L.climb(lt * 6); }
  else { const u = range(lt, 3.5, 4); L.at(lerp(x, 22.8, u), lerp(12.6, 14.2, u), 13, Math.PI / 2); L.climb(0); }
  L.setFace('determined');
  const ly = L.root.position.y;
  shadowAt(22, ly, 13, 14, [-0.4, 1, 0.6]);
  look([14.5, ly + 2.2, 21.5], [21.5, ly + 2.8, 12.5], 56);
  fill.position.set(18, ly + 3, 16); fill.intensity = 20; fill.color.set('#9fb8ff');
});

// 4M — la salle de contrôle
shot(52, 57, (lt, t) => {
  setMode('interior'); bigShowsVane(false); bigHot(false); eqAnim(t); billsAt(t, 0.5); safeText('84 300 €', false);
  I.door.position.x = I.doorOpenX;
  const L = C.leo;
  if (lt < 2) { const u = range(lt, 0, 2); L.at(0, 0, lerp(9.5, 3.2, u), Math.PI); L.walk(lt * 7, 0.5); L.setFace('surprised'); }
  else { L.at(0, 0, 3.2, Math.PI); L.setFace('surprised'); L.headG.rotation.y = Math.sin((lt - 2) * 1.2) * 0.6; }
  const pan = range(lt, 2, 5);
  for (let k = 0; k < 4; k++) feeHot(k, false);
  if (lt > 2) { const order = [1, 0, 2, 3]; const idx = Math.min(3, Math.floor(pan * 4)); feeHot(order[idx], true); }
  if (lt < 2) look([1.6, 3.0, -3.5], [0, 2.2, 7], 56);
  else {
    const a = lerp(-1.25, 1.25, smooth(pan));
    look([0, 4.0, 3.2], [Math.sin(a) * 7.5, 4.2, -Math.cos(a) * 7.5], 50);
  }
  comic('ÉTERNUEMENT = 15 € ?!', 540, 1640, lt - 2.4, { size: 72, color: '#7df9ff', rot: -0.04, dur: 1.6, burst: false });
});
// 4N — LÉO : 420 € — RECORD DE LA SEMAINE
shot(57, 62, (lt, t) => {
  setMode('interior'); bigShowsVane(false); eqAnim(t); billsAt(t, 0.5); safeText('84 300 €', false); I.door.position.x = I.doorOpenX;
  const on = t > EV.bigScreen; bigHot(on && frac(t * 3) < 0.5);
  for (let k = 0; k < 4; k++) feeHot(k, false);
  const L = C.leo; L.at(0, 0, 3.2, Math.PI);
  if (lt < 3.2) { camKeys(lt, [[0, [0, 4.0, 3.0], [0, 4.6, -7.5], 52], [1.0, [0, 4.8, 2.0], [0, 5.2, -7.5], 46], [3.2, [0, 5.0, 0.5], [0, 5.2, -7.5], 40]]); L.setFace('surprised'); }
  else {
    L.setFace('scared'); L.headG.rotation.x = -0.2; L.armL.rotation.x = L.armR.rotation.x = -0.6; L.armL.rotation.z = -0.3; L.armR.rotation.z = 0.3;
    camKeys(lt, [[3.2, [0.3, 2.3, 0.4], [0, 2.1, 3.2], 52], [5, [0.25, 2.25, 0.9], [0, 2.1, 3.2], 48]]);
    fill.position.set(0, 5, 0); fill.intensity = 25 + 25 * (frac(t * 3) < 0.5 ? 1 : 0); fill.color.set('#ff3b3b');
  }
  I.lights[1].intensity = on ? 30 + 50 * (frac(t * 3) < 0.5 ? 1 : 0) : 30;
  comic('420 € !', 300, 1620, lt - 1.1, { size: 130, color: '#ff2e4d', rot: -0.1, dur: 1.6 });
});
// 4O — les billets tombent dans le coffre blindé
shot(62, 67, (lt, t) => {
  setMode('interior'); bigShowsVane(false); bigHot(false); eqAnim(t); I.door.position.x = I.doorOpenX;
  billsAt(t, 1.4 + lt * 0.3);
  const [c1, c2, c3] = EV.safeCounter;
  if (t < c1) safeText('84 300 €', false); else if (t < c2) safeText('84 315 €', t - c1 < 0.15); else if (t < c3) safeText('84 720 €', t - c2 < 0.15); else safeText('1 000 000 €', frac(t * 4) < 0.5);
  I.wheel.rotation.z = t * 2;
  const L = C.leo; L.at(0.8, 0, 2.6, Math.PI * 0.78); L.setFace(t > c3 ? 'surprised' : 'scared');
  camKeys(lt, [[0, [-0.8, 3.6, 3.6], [4.4, 4.2, -3.2], 56], [5, [0.6, 3.6, 1.8], [4.4, 3.4, -3.2], 50]]);
  comic('KA-CHING !', 540, 1620, t - c3, { size: 120, color: '#38d26b', dur: 1.2 });
  sparkle(V3(4.4, 3.7, -2.1), t - c3, 140);
});
// 4P — la photo
shot(67, 71, (lt, t) => {
  setMode('interior'); bigShowsVane(false); bigHot(false); eqAnim(t); billsAt(t, 1); safeText('1 000 000 €', false); I.door.position.x = I.doorOpenX;
  const L = C.leo; L.at(-0.5, 0, 3.2, Math.PI);
  const raise = smooth(range(lt, 0, 0.5));
  L.armR.rotation.x = -1.75 * raise; L.armL.rotation.x = -1.55 * raise; L.armL.rotation.z = 0.35 * raise;
  L.setFace(lt < 1.6 ? 'determined' : 'happy');
  L.root.updateMatrixWorld(true);
  I.phone.visible = true; I.phone.position.copy(L.armR.localToWorld(V3(-0.25, -0.95, 0.1)));
  I.phone.quaternion.copy(L.root.quaternion); I.phone.rotateY(Math.PI); I.phone.rotateX(-0.2);
  I.phoneScreen.material.emissiveIntensity = t > EV.photo ? 2.5 : 1.0;
  if (lt < 2.2) camKeys(lt, [[0, [-2.3, 2.8, 6.2], [0, 4.6, -7.5], 54], [2.2, [-2.0, 2.7, 5.4], [0, 4.8, -7.5], 52]]);
  else camKeys(lt, [[2.2, [-0.7, 2.3, 0.2], [-0.5, 2.1, 3.2], 52], [4, [-0.65, 2.25, 0.7], [-0.5, 2.1, 3.2], 48]]);
  OV.flash = t > EV.photo ? 1 - range(t, EV.photo, EV.photo + 0.35) : 0;
  comic('CLIC !', 760, 520, t - EV.photo, { size: 110, color: '#ffffff', rot: 0.1, dur: 0.9 });
});
// 4Q — la porte blindée se referme
shot(71, 75, (lt, t) => {
  setMode('interior'); bigShowsVane(false); bigHot(false); eqAnim(t); billsAt(t, 1); safeText('1 000 000 €', false);
  const ts = EV.doorSlam - 71;
  I.door.position.x = lt < ts ? I.doorOpenX : I.doorOpenX * (1 - easeIn(range(lt, ts, ts + 0.3)));
  const L = C.leo;
  if (lt < ts + 0.2) { L.at(-0.5, 0, 3.2, Math.PI); L.setFace('happy'); }
  else if (lt < ts + 0.6) { L.at(-0.5, 0, 3.2, Math.PI + Math.PI * smooth(range(lt, ts + 0.2, ts + 0.6))); L.setFace('surprised'); }
  else if (lt < 2.4) { const u = range(lt, ts + 0.6, 2.4); L.at(-0.3, 0, lerp(3.2, 6.9, u), 0); L.walk(lt * 12, 0.8); L.setFace('scared'); }
  else { L.at(-0.3, 0, 6.9, 0); L.setFace('scared'); const b = Math.abs(Math.sin(lt * 11)); L.armL.rotation.x = -1.6 - b * 0.6; L.armR.rotation.x = -1.6 - (1 - b) * 0.6; L.torso.rotation.x = 0.1; }
  if (lt < 2.2) look([0.6, 2.8, -2.2], [0, 2.6, 8], 54);
  else camKeys(lt, [[2.2, [3.0, 2.6, 4.2], [-0.3, 2.2, 7.2], 50], [4, [2.7, 2.5, 4.6], [-0.3, 2.2, 7.3], 46]]);
  if (lt > ts + 0.3 && lt < ts + 0.7) shake(0.12 * (1 - range(lt, ts + 0.3, ts + 0.7)), t);
  comic('CLANG !', 540, 600, lt - ts - 0.3, { size: 170, color: '#adb5bd', rot: -0.1, dur: 1.2 });
  bubble('Hé ! Ouvrez !', HEAD(L), lt - 2.6, 1.3, 56);
});
// 4R — M. Vane apparaît sur l'écran
shot(75, 80, (lt, t) => {
  setMode('interior'); eqAnim(t, 0.5); billsAt(t, 1); safeText('1 000 000 €', false); I.door.position.x = 0;
  const glitch = t > EV.vaneOn && t < EV.vaneOn + 0.35;
  bigShowsVane(t > EV.vaneOn && !(glitch && frac(t * 20) < 0.5));
  const V = C.vane; V.at(500, 0, -0.3, 0); V.setFace(lt < 2.4 ? 'smirk' : 'evil'); V.armR.rotation.x = -0.4; V.armL.rotation.x = -0.4; V.headG.rotation.z = Math.sin(lt * 0.8) * 0.05;
  const L = C.leo; L.at(-0.6, 0, 1.2, Math.PI); L.setFace('scared');
  camKeys(lt, [[0, [0.6, 3.2, 4.0], [0, 5.0, -7.5], 50], [2.5, [0.3, 4.6, 0.5], [0, 5.2, -7.5], 40], [5, [0.1, 5.0, -2.5], [0, 5.2, -7.5], 36]]);
  // reflet des lunettes : projeté de la caméra du studio vers l'écran
  V.root.updateMatrixWorld(true);
  const g = V.glasses.getWorldPosition(V3()).project(ST.cam);
  sparkle(V3(g.x * 3.3, 5.2 + g.y * 1.65, -7.45), t - EV.glassesGlint, 110);
  sparkle(V3(g.x * 3.3, 5.2 + g.y * 1.65, -7.45), t - EV.glassesGlint - 1.8, 90);
  tag('M. VANE', V3(0, 7.3, -7.4), t - EV.vaneOn - 0.4, 1.8, '#ffffff', '#5c677d');
  OV.vignette = 0.7;
});
// 4S — le phare vrombit
shot(80, 83, (lt, t) => {
  setMode('interior'); eqAnim(t, 1.5); billsAt(t, 2); safeText('1 000 000 €', frac(t * 6) < 0.5); I.door.position.x = 0;
  bigShowsVane(true);
  const V = C.vane; V.at(500, 0, -0.3, 0); V.setFace('evil'); V.armR.rotation.x = -0.4; V.armL.rotation.x = -0.4;
  I.alarm.material.emissiveIntensity = frac(t * 3) < 0.5 ? 4 : 0.2;
  fill.position.set(0, 8, 0); fill.color.set('#ff2e4d'); fill.intensity = frac(t * 3) < 0.5 ? 60 : 5;
  const L = C.leo; L.at(-0.6 + Math.sin(lt * 5) * 0.3, 0, 2.5, Math.PI + 0.4); L.setFace('scared');
  L.armL.rotation.z = -1.3 + Math.sin(lt * 9) * 0.3; L.armR.rotation.z = 1.3 + Math.sin(lt * 8) * 0.3; L.root.rotation.z = Math.sin(lt * 6) * 0.15;
  look([5.2, 4.4, 4.6], [-0.5, 3.0, -3], 58); shake(0.14, t);
  comic('VRRROOOOM !', 540, 560, lt - 0.2, { size: 115, color: '#ff8c1a', rot: -0.08, dur: 2.2 });
});
// 4T — le phare se détache et s'élève au-dessus de l'océan
shot(83, DURATION, (lt, t) => {
  setMode('night'); board(0, false);
  const u = easeIn(range(lt, 0.3, 4.6));
  const Lh = R.lighthouse; Lh.position.set(LH.x + u * 14, LH.y + u * 34 + Math.sin(t * 40) * 0.08 * (1 - u), LH.z + u * 10);
  Lh.rotation.z = -0.05 * u;
  for (const j of Lh.jets) { j.visible = lt > 0.2; j.scale.set(1, 0.8 + Math.sin(t * 50) * 0.2 + u, 1); }
  R.crater.visible = true;
  R.beamPivot.position.copy(Lh.position).add(V3(0, 27.5, 0));
  lanternLight.position.copy(R.beamPivot.position);
  R.debris.forEach((d, k) => {
    const t0 = 0.2 + hash(k) * 2.5, age = lt - t0; if (age < 0) return;
    d.visible = true;
    d.position.set(LH.x + (hash(k + 1) - 0.5) * 9 + u * 14 * 0.5, LH.y + (hash(k + 2) - 0.2) * 2 - 4.9 * age * age + 3 * age, LH.z + (hash(k + 3) - 0.5) * 9 + u * 6);
    d.rotation.set(age * 3 + k, age * 2, k);
    if (d.position.y < -1.5) d.visible = false;
  });
  const p = Lh.position;
  shadowAt(p.x, 10, p.z, 40, [-0.4, 1, 0.6]);
  const w = easeOut(range(lt, 0, 4.6));
  look([p.x - lerp(26, 70, w), lerp(16, 22, w), p.z + lerp(34, 80, w)], [p.x, p.y + 10 - 6 * w, p.z], lerp(52, 46, w));
  fill.position.copy(p).add(V3(-8, 4, 10)); fill.intensity = 80; fill.color.set('#7df9ff'); fill.distance = 60;
  OV.vignette = 0.8;
  OV.flash = 0.8 * (1 - range(lt, 0, 0.35));
  if (t > EV.endTitle) OV.title = { text: 'À SUIVRE...', age: t - EV.endTitle, sub: 'LA VILLE DU SILENCE — ÉP. 1' };
  OV.fade = range(t, DURATION - 0.9, DURATION - 0.1);
});

function transitions(t) {
  for (const w of [20.0, 52.0]) { const a = t - w; if (a >= 0 && a < 0.25) OV.flash = Math.max(OV.flash, 0.7 * (1 - a / 0.25)); }
  const b = 40.0 - t; if (b > 0 && b < 0.35) OV.fade = Math.max(OV.fade, 1 - b / 0.35);
}

// ---------------- rendu d'une image ----------------
const allChars = Object.values(C);
function renderFrame(t) {
  resetOV();
  for (const c of allChars) c.reset();
  R.bike.visible = false; R.purse.visible = false; R.crater.visible = false;
  for (const d of R.debris) d.visible = false;
  R.lighthouse.position.copy(LH); R.lighthouse.rotation.set(0, 0, 0); for (const j of R.lighthouse.jets) j.visible = false;
  R.beamPivot.position.copy(LANTERN); lanternLight.position.copy(LANTERN);
  I.phone.visible = false; fill.distance = 30;
  for (const l of I.lights) l.intensity = l.userData.base ??= l.intensity;
  I.alarm.material.emissiveIntensity = 0.2;
  for (let k = 0; k < R.sensors.length; k++) sensorOn(k, false);
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  sh.fn(t - sh.t0, t);
  // animations d'ambiance
  sea(t); gulls(t);
  R.beamPivot.rotation.y = t * 1.3;
  for (const s of R.sensors) s.g.visible = true;
  transitions(t);
  if (I.bigMat.map === vaneRT.texture) { renderer.setRenderTarget(vaneRT); renderer.render(scene, ST.cam); renderer.setRenderTarget(null); }
  renderer.render(scene, camera);
  compose(t);
}

window.renderFrame = (t, type = 'image/jpeg', q = 0.93) => { renderFrame(t); return out.toDataURL(type, q); };
window.IS_READY = true;
