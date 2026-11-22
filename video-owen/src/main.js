// Mise en scène « 3:17 — Owen » : chambre de nuit, messages, mains, fenêtre.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { V3, clamp, lerp, smooth, easeOut, easeIn, easeOutBack, range, hash, FONT, redraw, box, glow } from './lib.js';
import { makeCast, makeHouse, makeCloseSet, makeHand, drawClock, updateRain, frac } from './world.js';
import { LINES, MSGS, EV, WIDTH, HEIGHT, DURATION } from './timeline.js';

await document.fonts.load('80px "Luckiest Guy"');
const SCALE = Number(new URLSearchParams(location.search).get('s') || 1);

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(Math.round(WIDTH * SCALE), Math.round(HEIGHT * SCALE), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.2;
const out = document.getElementById('out');
out.width = Math.round(WIDTH * SCALE); out.height = Math.round(HEIGHT * SCALE);
const ctx = out.getContext('2d');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070f');
scene.fog = new THREE.Fog('#0a1020', 18, 70);
const camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.05, 500);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.12;
const hemi = new THREE.HemisphereLight('#3b4f8f', '#0b0d18', 0.7); scene.add(hemi);

const C = makeCast(); for (const c of Object.values(C)) scene.add(c.root);
const R = makeHouse(scene);
const CS = makeCloseSet(scene);
// petit téléphone dans la chambre
const miniPhone = new THREE.Group(); scene.add(miniPhone);
box(miniPhone, 0.36, 0.7, 0.06, '#0e0e12', 0, 0, 0, false);
box(miniPhone, 0.32, 0.64, 0.01, glow('#bfe6ff', 2.5), 0, 0, 0.035, false);
// main à la fenêtre
const winHand = makeHand('#f5efe9', true); winHand.scale.setScalar(0.85); scene.add(winHand);

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
  const pop = easeOutBack(range(t, ch.t0, ch.t0 + 0.16)); const cy = 1620;
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
      outlined(words[i], x, y, size, active ? '#ff4040' : '#ffffff', '#000000', 17);
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
  drawExtras(t);
  drawSubtitles(t);
  if (OV.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(OV.flash)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (OV.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(OV.fade)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
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
function shake(amount, t) { camera.position.x += Math.sin(t * 63) * amount; camera.position.y += Math.sin(t * 71 + 1) * amount; }
const P300 = (x, y, z) => [300 + x, y, z];

// ---------------- extras 2D : badge horaire, dilemme ----------------
const clockAt = (t) => { let c = EV.clock[0][1]; for (const [ts, v] of EV.clock) if (t >= ts) c = v; return c; };
function drawExtras(t) {
  const txt = clockAt(t) + ' AM';
  ctx.save(); ctx.translate(48, 120);
  ctx.font = `64px "DejaVu Sans Mono", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width + 110;
  ctx.fillStyle = 'rgba(8,8,14,.78)'; ctx.beginPath(); ctx.roundRect(0, -52, w, 104, 26); ctx.fill();
  ctx.strokeStyle = '#ff2b2b'; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = frac(t) < 0.5 ? '#ff2b2b' : '#7a1010'; ctx.beginPath(); ctx.arc(46, 0, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.fillText(txt, 76, 4);
  ctx.restore();
  if (OV.dilemma) {
    const a = OV.dilemma.age;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const s1 = easeOutBack(range(a, 0, 0.3));
    ctx.save(); ctx.translate(WIDTH / 2, 330); ctx.scale(s1, s1); outlined('UNE SEULE BAGUE.', 0, 0, 92, '#e3e7ec', '#000', 16); ctx.restore();
    const s2 = easeOutBack(range(a, 1.3, 1.6));
    ctx.save(); ctx.translate(WIDTH / 2, 470); ctx.scale(s2, s2); outlined('LEQUEL EST LE VRAI OWEN ?', 0, 0, 74, '#ff3b3b', '#000', 14); ctx.restore();
    for (const [lab, p, d] of [['LE LIT ?', { x: 330, y: 1380 }, 2.95], ['LA FENÊTRE ?', { x: 760, y: 820 }, 3.85]]) {
      const s = easeOutBack(range(a, d, d + 0.3)); if (s <= 0) continue;
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
      ctx.font = `64px ${FONT}`; const w = ctx.measureText(lab).width + 60;
      ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.beginPath(); ctx.roundRect(-w / 2, -50, w, 100, 24); ctx.fill();
      ctx.strokeStyle = '#e3e7ec'; ctx.lineWidth = 5; ctx.stroke();
      outlined(lab, 0, 6, 64, '#ffffff', '#000', 10);
      ctx.restore();
    }
  }
}

// ---------------- écran du téléphone ----------------
const photoCanvas = document.createElement('canvas'); photoCanvas.width = 512; photoCanvas.height = 384;
let photoReady = false;
const avatarCanvas = (() => { const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'); x.fillStyle = '#8a3b1f'; x.beginPath(); x.arc(48, 48, 48, 0, 7); x.fill(); x.fillStyle = '#f5efe9'; x.fillRect(26, 40, 44, 40); x.fillStyle = '#111'; x.fillRect(36, 52, 6, 8); x.fillRect(56, 52, 6, 8); return c; })();
function wrap(c, text, maxW) { const words = text.split(' '); const lines = []; let cur = ''; for (const w of words) { const tst = cur ? cur + ' ' + w : w; if (c.measureText(tst).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tst; } if (cur) lines.push(cur); return lines; }
function drawMap(c, x, y, w, h) {
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 24); c.clip();
  c.fillStyle = '#1d2530'; c.fillRect(x, y, w, h);
  c.fillStyle = '#1f3a2a'; c.fillRect(x + w * 0.62, y + 20, w * 0.3, h * 0.35);
  c.strokeStyle = '#3a4656'; c.lineWidth = 14; for (const k of [0.25, 0.6]) { c.beginPath(); c.moveTo(x, y + h * k); c.lineTo(x + w, y + h * k + 20); c.stroke(); }
  c.lineWidth = 10; for (const k of [0.3, 0.7]) { c.beginPath(); c.moveTo(x + w * k, y); c.lineTo(x + w * k - 30, y + h); c.stroke(); }
  const px = x + w * 0.46, py = y + h * 0.5;
  c.fillStyle = 'rgba(60,140,255,.25)'; c.beginPath(); c.arc(px, py, 60, 0, 7); c.fill();
  c.drawImage(avatarCanvas, px - 34, py - 34, 68, 68);
  c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.arc(px, py, 35, 0, 7); c.stroke();
  c.restore();
}
function drawPhone(c, w, h, t) {
  c.fillStyle = '#0b0b10'; c.fillRect(0, 0, w, h);
  // barre d'état
  c.fillStyle = '#fff'; c.font = `bold 30px "DejaVu Sans", sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText(clockAt(t), 40, 44); c.textAlign = 'right'; c.fillText('▮▮▮  23 %', w - 36, 44);
  // en-tête
  c.fillStyle = '#16161e'; c.fillRect(0, 80, w, 130);
  c.drawImage(avatarCanvas, 90, 97, 96, 96);
  c.fillStyle = '#fff'; c.font = `bold 44px "DejaVu Sans", sans-serif`; c.textAlign = 'left'; c.fillText('Owen', 210, 130);
  c.fillStyle = '#4cd964'; c.font = `26px "DejaVu Sans", sans-serif`; c.fillText('en ligne', 210, 172);
  c.fillStyle = '#5ac8fa'; c.font = `bold 50px "DejaVu Sans", sans-serif`; c.fillText('‹', 34, 145);
  // messages arrivés
  const items = [];
  const font = `36px "DejaVu Sans", sans-serif`; c.font = font;
  for (const [ts, type, text] of MSGS) {
    if (t < ts - 0.9) break;
    if (t < ts) { items.push({ type: 'typing', h: 90 }); break; }
    if (type === 'text') { const lines = wrap(c, text, 470); items.push({ type, lines, h: 34 + lines.length * 46 + 24, age: t - ts, red: text.startsWith('Il est') || text.startsWith('Ne le') }); }
    else if (type === 'loc') items.push({ type, text, h: 380, age: t - ts });
    else if (type === 'photo') items.push({ type, h: 420, age: t - ts });
  }
  let y = h - 150;
  c.fillStyle = '#16161e'; c.fillRect(0, h - 120, w, 120); c.fillStyle = '#2a2a34'; c.beginPath(); c.roundRect(40, h - 95, w - 180, 70, 35); c.fill();
  c.fillStyle = '#777'; c.font = `30px "DejaVu Sans", sans-serif`; c.textAlign = 'left'; c.fillText('Message…', 72, h - 60);
  for (let i = items.length - 1; i >= 0 && y > 230; i--) {
    const it = items[i]; y -= it.h; const x = 40;
    const pop = it.age === undefined ? 1 : easeOutBack(range(it.age, 0, 0.25));
    c.save(); c.translate(x, y + it.h); c.scale(pop, pop); c.translate(-x, -(y + it.h));
    if (it.type === 'typing') {
      c.fillStyle = '#26262f'; c.beginPath(); c.roundRect(x, y + 10, 150, 70, 35); c.fill();
      for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * (frac(t * 2 - k * 0.2) < 0.5 ? 1 : 0)})`; c.beginPath(); c.arc(x + 42 + k * 33, y + 45, 10, 0, 7); c.fill(); }
    } else if (it.type === 'text') {
      c.font = font; const bw = Math.max(...it.lines.map((l) => c.measureText(l).width)) + 56;
      c.fillStyle = it.red ? '#3a1015' : '#26262f'; c.beginPath(); c.roundRect(x, y + 8, bw, it.h - 24, 30); c.fill();
      c.fillStyle = it.red ? '#ff5a5f' : '#f2f2f7'; c.textAlign = 'left'; c.textBaseline = 'middle';
      it.lines.forEach((l, k) => c.fillText(l, x + 28, y + 8 + 40 + k * 46));
    } else if (it.type === 'loc') {
      c.fillStyle = '#26262f'; c.beginPath(); c.roundRect(x, y + 8, 520, it.h - 24, 30); c.fill();
      drawMap(c, x + 14, y + 22, 492, 250);
      c.fillStyle = '#fff'; c.font = `bold 32px "DejaVu Sans", sans-serif`; c.textAlign = 'left'; c.fillText('Owen - Maison', x + 28, y + 310);
      c.fillStyle = '#4cd964'; c.font = `28px "DejaVu Sans", sans-serif`; c.fillText('● Maintenant', x + 28, y + 344);
    } else if (it.type === 'photo') {
      c.fillStyle = '#26262f'; c.beginPath(); c.roundRect(x, y + 8, 540, it.h - 24, 30); c.fill();
      c.save(); c.beginPath(); c.roundRect(x + 14, y + 22, 512, 368, 22); c.clip(); c.drawImage(photoCanvas, x + 14, y + 22, 512, 368); c.restore();
    }
    c.restore();
  }
}
let phoneKey = '';
function phoneScreen(t) { const k = Math.round(t * 15); if (k === phoneKey) return; phoneKey = k; redraw(CS.screen, (c, w, h) => drawPhone(c, w, h, t)); }

// ---------------- poses ----------------
const BED_Y = 1.25;
function bedPose(t, { look = 0, phone = true, owenFace = 'sleep', creep = 0 } = {}) {
  const M = C.moi, O = C.owen;
  M.at(-1.05, BED_Y, -1.9, 0); M.lie(0); M.setFace('worried');
  O.at(1.1, BED_Y, -1.9, 0); O.lie(0); O.setFace(owenFace);
  O.armL.rotation.z = -0.15 - creep * 1.1; O.armL.rotation.x = -0.1 - creep * 0.6;
  O.armR.rotation.z = 0.15; O.armL.rotation.y = 0;
  M.headG.rotation.y = look;
  R.lumps[1].position.y = 1.62 + Math.sin(t * 1.9) * 0.05;
  O.torso.rotation.y = Math.sin(t * 0.8) * 0.0;
  if (phone) {
    M.armR.rotation.set(-1.45, 0, -0.35); M.armL.rotation.set(-1.4, 0, 0.35);
    M.root.updateMatrixWorld(true);
    const hp = M.headG.localToWorld(V3(0, 0.45, 1.25));
    miniPhone.visible = true; miniPhone.position.copy(hp); miniPhone.rotation.set(Math.PI / 2, Math.PI, 0);
    R.phoneLight.position.copy(hp).add(V3(0, -0.2, 0)); R.phoneLight.intensity = 6;
  }
}
function doPhoto() {
  if (photoReady) return;
  for (const c of Object.values(C)) c.reset();
  bedPose(0, { phone: true }); R.phoneLight.intensity = 18; R.phoneLight.distance = 8;
  const pc = new THREE.PerspectiveCamera(42, 512 / 384, 0.1, 200);
  pc.position.set(10.5, 2.6, -1.8); pc.lookAt(0.2, 1.6, -3.6);
  updateRain(R, 3, V3(10, 0, -3));
  const rt = new THREE.WebGLRenderTarget(512, 384);
  renderer.setRenderTarget(rt); renderer.render(scene, pc);
  const px = new Uint8Array(512 * 384 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 512, 384, px); renderer.setRenderTarget(null);
  const pctx = photoCanvas.getContext('2d'); const img = pctx.createImageData(512, 384);
  for (let y = 0; y < 384; y++) for (let x = 0; x < 512; x++) {
    const s = ((383 - y) * 512 + x) * 4, d = (y * 512 + x) * 4; const n = (hash(x * 13 + y * 7) - 0.5) * 30;
    for (let k = 0; k < 3; k++) img.data[d + k] = Math.min(255, Math.max(0, Math.pow(px[s + k] / 255, 1 / 2.2) * 255 * 1.9 + n));
    img.data[d + 3] = 255;
  }
  pctx.putImageData(img, 0, 0);
  pctx.fillStyle = 'rgba(255,255,255,.85)'; pctx.font = '18px "DejaVu Sans Mono"'; pctx.fillText('03:17', 448, 370);
  photoReady = true;
}

// ---------------- plans ----------------
const SHOTS = []; const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });
const lightning = (t) => { let f = 0; for (const l of EV.lightning) { const a = t - l; if (a >= 0 && a < 0.5) f = Math.max(f, (a < 0.08 || (a > 0.18 && a < 0.26)) ? 1 : 0.15); } return f; };
let clockShown = '';
function clockFace(t) { const v = clockAt(t); if (v !== clockShown) { clockShown = v; redraw(R.clockTex, (c, w, h) => drawClock(c, w, h, v)); } }
function phoneShot(lt, t, keys) {
  phoneScreen(t);
  const P = CS.phone; P.position.set(Math.sin(t * 1.3) * 0.05, Math.sin(t * 1.7) * 0.05, 0); P.rotation.set(-0.05, 0.04, Math.sin(t * 0.9) * 0.02);
  for (const [ts] of MSGS) { const a = t - ts; if (a > 0 && a < 0.35) { P.position.x += Math.sin(a * 120) * 0.06; } }
  camKeys(lt, keys);
}
const PH_WIDE = [P300(0, 0, 8.4), P300(0, 0, 0), 46];

const CLOCK_CAM = [[-2.9, 2.0, -2.0], [-3.4, 1.55, -4.95], 36];
// « Imagine que ton petit ami t'envoie un texto à 3h17… »
shot(0, 2.5, (lt, t) => { bedPose(t); camKeys(lt, [[0, ...CLOCK_CAM], [2.5, [-3.0, 1.9, -2.6], [-3.4, 1.55, -4.95], 32]]); OV.fade = 1 - range(lt, 0, 0.6); });
// « …alors qu'il dort juste à côté de toi. »
shot(2.5, 5.2, (lt, t) => { bedPose(t); camKeys(lt, [[0, [3.4, 4.6, 3.2], [0, 1.4, -3.6], 50], [2.7, [2.6, 4.0, 1.6], [0, 1.5, -3.8], 48]]);
  comic('z z z', 760, 760, lt - 0.4, { size: 70, color: '#cfd8ff', rot: 0.1, dur: 2.3, burst: false }); });
// « Tu dors ? Ne te retourne pas. »
shot(5.2, 7.1, (lt, t) => phoneShot(lt, t, [[0, P300(-0.3, -1.4, 6.8), P300(-0.3, -1.4, 0), 44], [1.9, P300(-0.3, -1.6, 6.4), P300(-0.3, -1.6, 0), 44]]));
// « Tu vérifies sa localisation… »
shot(7.1, 9.9, (lt, t) => phoneShot(lt, t, [[0, P300(-0.3, -1.0, 7.4), P300(-0.3, -1.0, 0), 44], [2.8, P300(-0.3, -1.0, 6.4), P300(-0.3, -1.0, 0), 44]]));
// « …puis il t'envoie une photo. »
shot(9.9, 11.6, (lt, t) => phoneShot(lt, t, [[0, P300(-0.3, -0.8, 7.0), P300(-0.3, -0.8, 0), 44], [1.7, P300(-0.3, -1.0, 6.4), P300(-0.3, -1.0, 0), 44]]));
// « Ta fenêtre vue de la rue… » puis « Toi, dans ton lit… quelqu'un sous la couverture. »
shot(11.6, 17.4, (lt, t) => { bedPose(t); camKeys(lt, [[0, [13.5, 2.4, 2.0], [5.3, 2.9, -3], 44], [3.0, [10.5, 2.7, -1.0], [5.3, 3.0, -3], 40], [5.8, [7.4, 2.9, -2.4], [0.5, 1.6, -3.6], 38]]); });
shot(17.4, 19.6, (lt, t) => { bedPose(t); R.phoneLight.position.set(1.6, 3.0, -3.8); camKeys(lt, [[0, [2.4, 4.8, -1.6], [1.1, 1.5, -3.2], 44], [2.2, [1.8, 4.2, -2.2], [1.1, 1.5, -3.4], 40]]); });
// messages : « J'arrivais pas à dormir… Il est à ma place. »
shot(19.6, 25.3, (lt, t) => phoneShot(lt, t, [[0, P300(-0.3, -1.0, 7.6), P300(-0.3, -1.0, 0), 44], [5.7, P300(-0.3, -1.6, 6.4), P300(-0.3, -1.6, 0), 44]]));
// 3:18 — « À côté de toi, il respire encore. Lentement… »
shot(25.3, 30.0, (lt, t) => {
  bedPose(t);
  if (lt < 1.1) look([-3.0, 1.9, -2.6], [-3.4, 1.55, -4.95], 32);
  else { R.phoneLight.position.set(1.6, 3.0, -3.8); R.phoneLight.intensity = 5; camKeys(lt, [[1.1, [1.8, 4.6, -2.6], [1.1, 1.6, -4.6], 44], [4.7, [1.1, 3.6, -3.9], [1.1, 1.6, -4.8], 36]]); }
});
// « Celui qui est à côté de toi attrape ta main… Et à son doigt, la bague… »
shot(30.0, 36.1, (lt, t) => {
  const g = smooth(range(t, EV.grab, EV.grab + 0.7));
  CS.owenHand.position.set(lerp(3.2, 0.7, g), lerp(-0.8, 0.1, g), 0.35); CS.owenHand.rotation.z = 1.5 + Math.sin(t * 0.6) * 0.02;
  camKeys(lt, [[0, P300(40.8, 1.4, 7.2), P300(40.3, 0.3, 0), 40], [2.6, P300(40.6, 1.1, 5.4), P300(40.3, 0.4, 0.1), 36], [6.1, P300(40.5, 0.9, 3.6), P300(40.55, 0.6, 0.2), 30]]);
  CS.ring.updateMatrixWorld(true);
  sparkle(CS.ring.getWorldPosition(V3()).add(V3(0, 0, 0.3)), t - EV.ringGlint, 120);
  sparkle(CS.ring.getWorldPosition(V3()).add(V3(0, 0, 0.3)), t - EV.ringGlint - 1.8, 90);
});
// 3:19 — « Ton téléphone s'allume à nouveau : Ne le laisse pas te toucher. »
shot(36.1, 39.1, (lt, t) => {
  if (lt < 0.9) { bedPose(t); look([-3.0, 1.9, -2.6], [-3.4, 1.55, -4.95], 32); }
  else phoneShot(lt, t, [[0.9, P300(-0.3, -1.4, 7.0), P300(-0.3, -1.4, 0), 44], [3.0, P300(-0.3, -1.7, 6.4), P300(-0.3, -1.7, 0), 44]]);
});
// « Puis quelque chose tape contre ta fenêtre. »
shot(39.1, 41.15, (lt, t) => {
  bedPose(t);
  const S = C.ombre; S.at(6.55, 0, -3.1, -Math.PI / 2); S.setFace('blank');
  let k = 0; for (const kt of EV.knocks) { const a = t - kt; if (a > -0.15 && a < 0.15) k = 1 - Math.abs(a) / 0.15; }
  S.armR.rotation.x = -2.0 - 0.35 * k; S.armR.rotation.z = 0.1;
  camKeys(lt, [[0, [12.5, 2.3, 3.6], [6.0, 2.8, -2.8], 44], [2.05, [11.2, 2.5, 2.4], [5.9, 2.9, -3.0], 40]]);
  comic('TOC… TOC…', 540, 560, t - EV.knocks[0], { size: 90, color: '#e3e7ec', rot: -0.05, dur: 1.0, burst: false });
});
// « Une main plaquée à plat contre la vitre. À son doigt, la même bague. »
shot(41.15, 45.15, (lt, t) => {
  bedPose(t);
  const S = C.ombre; S.at(6.7, 0, -3.1, -Math.PI / 2); S.setFace('blank'); S.armR.rotation.x = -2.3;
  const a = t - EV.windowSlap;
  winHand.visible = true; winHand.rotation.set(0, -Math.PI / 2, 0.15);
  winHand.position.set(a < 0 ? 7.5 : lerp(7.0, 5.5, easeIn(range(a, 0, 0.1))), 3.2, -3.2);
  camKeys(lt, [[0, [0.6, 2.9, -3.8], [5.3, 3.1, -3.1], 44], [1.8, [1.4, 3.0, -3.5], [5.3, 3.1, -3.15], 40], [4.0, [3.2, 3.15, -3.25], [5.4, 3.3, -3.2], 36]]);
  if (a > 0.1 && a < 0.4) shake(0.08 * (1 - range(a, 0.1, 0.4)), t);
  comic('BAM !', 820, 600, a - 0.1, { size: 120, color: '#e3e7ec', rot: 0.1, dur: 0.7 });
  winHand.updateMatrixWorld(true);
  sparkle(winHand.ring.getWorldPosition(V3()), t - EV.slapGlint, 110);
});
// « Tu n'en as acheté qu'une seule. L'un des deux est ton petit ami… »
shot(45.15, DURATION, (lt, t) => {
  bedPose(t, { creep: smooth(range(t, EV.creepHand, EV.creepHand + 3.5)), phone: true });
  C.moi.setFace('scared');
  const S = C.ombre; S.at(6.7, 0, -3.1, -Math.PI / 2); S.setFace('blank'); S.armR.rotation.x = -2.3;
  winHand.visible = true; winHand.rotation.set(0, -Math.PI / 2, 0.15); winHand.position.set(5.5, 3.2, -3.2);
  camKeys(lt, [[0, [-3.6, 4.6, 3.2], [1.6, 2.2, -3.2], 52], [9.35, [-3.0, 4.2, 2.2], [1.8, 2.3, -3.2], 50]]);
  OV.dilemma = { age: t - EV.dilemma };
  OV.vignette = 0.85;
  OV.fade = range(t, DURATION - 1.2, DURATION - 0.1);
});

// ---------------- rendu ----------------
const allChars = Object.values(C);
function renderFrame(t) {
  if (!photoReady && t > MSGS.find((m) => m[1] === 'photo')[0] - 1) doPhoto();
  resetOV(); OV.dilemma = null; OV.vignette = 0.75;
  for (const c of allChars) c.reset();
  miniPhone.visible = false; winHand.visible = false; R.phoneLight.intensity = 0; R.phoneLight.distance = 5;
  clockFace(t);
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  sh.fn(t - sh.t0, t);
  const L = lightning(t);
  hemi.intensity = 0.7 + L * 3; R.moon.intensity = 0.9 + L * 6;
  if (L > 0.5) OV.flash = Math.max(OV.flash, 0.12);
  R.rainTex.offset.y = -t * 0.08;
  R.rain.visible = camera.position.x < 100;
  updateRain(R, t, camera.position.x > 5 ? V3(camera.position.x - 6, 0, camera.position.z - 6) : V3(11, 0, -3), camera.position.x > 5 ? 26 : 16);
  for (const w of EV.whooshes) { const a = t - w; if (a >= 0 && a < 0.2) OV.fade = Math.max(OV.fade, 1 - a / 0.2); }
  renderer.render(scene, camera);
  compose(t);
}
window.renderFrame = (t, type = 'image/jpeg', q = 0.93) => { renderFrame(t); return out.toDataURL(type, q); };
window.IS_READY = true;
