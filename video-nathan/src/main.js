// Mise en scène : plans, caméra, éclairages, habillage 2D (sous-titres TikTok, popups « -10 € »).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { V3, clamp, lerp, smooth, easeOut, easeOutBack, range, hash, frac, FONT, redraw } from './lib.js';
import { makeCast, makeVillage, makeInterior, skyTex, cableP, LINE_UP, LINE_DOWN, layHose, hideHose, updateSnow, updateSpray, drawCounter, drawScreen, SCREENS, CABLE } from './world.js';
import { LINES, EV, WIDTH, HEIGHT, DURATION } from './timeline.js';

// ---------------- moteur ----------------
await document.fonts.load('80px "Luckiest Guy"');
const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;

const out = document.getElementById('out');
out.width = WIDTH; out.height = HEIGHT;
const ctx = out.getContext('2d');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 2000);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const hemi = new THREE.HemisphereLight('#cfe8ff', '#f2f6ff', 1.2); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
sun.shadow.radius = 4;
scene.add(sun); scene.add(sun.target);
const fill = new THREE.PointLight('#ffffff', 0, 30, 1.5); scene.add(fill);

const C = makeCast();
for (const c of Object.values(C)) scene.add(c.root);
const R = makeVillage(scene);
const I = makeInterior(scene);
I.phone.visible = false; scene.add(I.phone);

const SKY = {
  day: skyTex('#5fa8ec', '#dcefff'),
  clear: skyTex('#2f8cf0', '#bfe4ff'),
  morning: skyTex('#3d8fe6', '#ffd9a8'),
  night: skyTex('#03081e', '#1c3170'),
};

let MODE = null;
function setMode(m) {
  MODE = m;
  const night = m === 'night', inter = m === 'interior';
  R.group.visible = !inter; I.group.visible = inter;
  scene.background = inter ? new THREE.Color('#12040a') : SKY[m];
  R.snow.visible = m === 'day';
  R.stars.visible = night; R.moon.visible = night;
  const fogC = { day: '#d6e9fb', clear: '#cfe7ff', morning: '#f3dcc2', night: '#0b1638', interior: '#12040a' }[m];
  scene.fog = inter ? null : new THREE.Fog(fogC, night ? 60 : 90, night ? 420 : 650);
  scene.environmentIntensity = night ? 0.12 : inter ? 0.35 : 0.55;
  hemi.visible = true;
  if (night) {
    hemi.color.set('#4b6cc7'); hemi.groundColor.set('#1a2140'); hemi.intensity = 0.9;
    sun.color.set('#9db8ff'); sun.intensity = 1.1;
    R.winMat.emissiveIntensity = 1.6; for (const l of R.lamps) l.material.emissiveIntensity = 2.2;
    renderer.toneMappingExposure = 1.15;
  } else if (inter) {
    hemi.color.set('#ff9a7a'); hemi.groundColor.set('#3a0b12'); hemi.intensity = 0.7;
    sun.intensity = 0; renderer.toneMappingExposure = 1.05;
  } else {
    hemi.color.set('#cfe8ff'); hemi.groundColor.set('#f2f6ff'); hemi.intensity = m === 'morning' ? 0.9 : 1.15;
    sun.color.set(m === 'morning' ? '#ffcf96' : '#fff4e0'); sun.intensity = m === 'clear' ? 3.0 : 2.5;
    R.winMat.emissiveIntensity = 0.05; for (const l of R.lamps) l.material.emissiveIntensity = 0.3;
    renderer.toneMappingExposure = 1.0;
  }
  for (const l of I.lights) l.visible = inter;
  fill.intensity = 0;
}
function shadowAt(x, y, z, size = 25, dir = [0.55, 1, 0.45]) {
  sun.target.position.set(x, y, z);
  sun.position.set(x + dir[0] * 60, y + dir[1] * 60, z + dir[2] * 60);
  const sc = sun.shadow.camera;
  sc.left = -size; sc.right = size; sc.top = size; sc.bottom = -size; sc.near = 1; sc.far = 200;
  sc.updateProjectionMatrix();
}
function setIce(z0, z1) {
  if (z1 <= z0 + 0.01) { R.ice.visible = false; for (const g of R.iceGlints) g.visible = false; return; }
  R.ice.visible = true; R.ice.position.z = z0; R.ice.scale.y = z1 - z0;
  for (const g of R.iceGlints) g.visible = g.position.z > z0 && g.position.z < z1;
}

// ---------------- caméra ----------------
function look(p, t, fov = 50, roll = 0) {
  camera.position.set(...p); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(...t);
  if (roll) camera.rotateZ(roll);
}
// keys : [temps, pos, cible, fov?]
function camKeys(lt, keys, ease = smooth) {
  let i = 0; while (i < keys.length - 2 && lt > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const u = b === a ? 0 : ease(range(lt, a[0], b[0]));
  const L = (p, q) => p.map((v, k) => lerp(v, q[k], u));
  look(L(a[1], b[1]), L(a[2], b[2]), lerp(a[3] || 50, b[3] || 50, u));
}
function shake(amount, t) {
  camera.position.x += Math.sin(t * 63) * amount; camera.position.y += Math.sin(t * 71 + 1) * amount;
  camera.rotateZ(Math.sin(t * 47) * amount * 0.05);
}

// ---------------- habillage 2D ----------------
const OV = { popups: [], comics: [], tags: [], sparkles: [], flash: 0, fade: 0, title: null, vignette: 0.45 };
function resetOV() { OV.popups = []; OV.comics = []; OV.tags = []; OV.sparkles = []; OV.flash = 0; OV.fade = 0; OV.title = null; OV.vignette = 0.45; }
const proj = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * WIDTH, y: (1 - p.y) / 2 * HEIGHT, ok: p.z < 1 }; };
function popup(text, worldPos, age, { color = '#ff2e4d', size = 96, dur = 1.3 } = {}) {
  if (age < 0 || age > dur) return;
  OV.popups.push({ text, worldPos: worldPos.clone(), age, color, size, dur });
}
function comic(text, x, y, age, { color = '#ffd23f', size = 150, rot = -0.12, dur = 1.1, stroke = '#1d1b2a' } = {}) {
  if (age < 0 || age > dur) return;
  OV.comics.push({ text, x, y, age, color, size, rot, dur, stroke });
}
function tag(text, worldPos, age, dur = 2.2, color = '#ffffff', bg = '#e63946') {
  if (age < 0 || age > dur) return;
  OV.tags.push({ text, worldPos: worldPos.clone(), age, dur, color, bg });
}
function sparkle(worldPos, age, size = 120) { if (age >= 0 && age < 0.6) OV.sparkles.push({ worldPos: worldPos.clone(), age, size }); }

function outlined(text, x, y, size, fill, stroke = '#1d1b2a', lw = null) {
  ctx.font = `${size}px ${FONT}`;
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  ctx.lineWidth = lw ?? size * 0.2; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}

// sous-titres : découpage en groupes de mots, mot actif en jaune
const CHUNKS = [];
for (const [a, b, text] of LINES) {
  const raw = text.split(/\s+/);
  const words = [];
  for (const w of raw) {
    if (words.length && /^([€:;!?,.»]+|\.\.\.)$/.test(w)) words[words.length - 1] += ' ' + w;
    else if (words.length && words[words.length - 1] === '«') words[words.length - 1] += ' ' + w;
    else words.push(w);
  }
  // fusion « 3 000 », « 1 000 » etc.
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
  const ch = CHUNKS.find((c) => t >= c.t0 && t < c.t1 + 0.05);
  if (!ch) return;
  const size = 88;
  ctx.font = `${size}px ${FONT}`;
  const words = ch.words.map((w) => w.w.toUpperCase());
  const space = size * 0.28;
  const widths = words.map((w) => ctx.measureText(w).width);
  // retour à la ligne si trop large
  const maxW = WIDTH - 140;
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => { if (rw + widths[i] > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += widths[i] + space; });
  const pop = easeOutBack(range(t, ch.t0, ch.t0 + 0.16));
  const cy = 1290;
  ctx.save();
  ctx.translate(WIDTH / 2, cy); ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop); ctx.translate(-WIDTH / 2, -cy);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  rows.forEach((row, ri) => {
    const total = row.reduce((s, i) => s + widths[i], 0) + space * (row.length - 1);
    let x = WIDTH / 2 - total / 2;
    const y = cy + (ri - (rows.length - 1) / 2) * size * 1.12;
    for (const i of row) {
      const active = t >= ch.words[i].t0 && t < ch.words[i].t1 + 0.02;
      ctx.save();
      if (active) { ctx.translate(x + widths[i] / 2, y); ctx.scale(1.08, 1.08); ctx.translate(-(x + widths[i] / 2), -y); }
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 8;
      outlined(words[i], x, y, size, active ? '#ffd23f' : '#ffffff', '#141218', 17);
      ctx.restore();
      x += widths[i] + space;
    }
  });
  ctx.restore();
}

function compose(t) {
  ctx.drawImage(glCanvas, 0, 0);
  // vignette
  const g = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.25, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,20,${OV.vignette})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // étiquettes (noms)
  for (const tg of OV.tags) {
    const p = proj(tg.worldPos); if (!p.ok) continue;
    const s = easeOutBack(range(tg.age, 0, 0.25)) * (1 - range(tg.age, tg.dur - 0.2, tg.dur));
    ctx.save(); ctx.translate(p.x, p.y - 40); ctx.scale(s, s); ctx.rotate(-0.04);
    ctx.font = `64px ${FONT}`; const w = ctx.measureText(tg.text).width + 60;
    ctx.fillStyle = '#141218'; ctx.beginPath(); ctx.roundRect(-w / 2 + 8, -44 + 8, w, 88, 20); ctx.fill();
    ctx.fillStyle = tg.bg; ctx.beginPath(); ctx.roundRect(-w / 2, -44, w, 88, 20); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#141218'; ctx.stroke();
    ctx.fillStyle = tg.color; ctx.fillText(tg.text, 0, 6);
    ctx.beginPath(); ctx.moveTo(-18, 44); ctx.lineTo(18, 44); ctx.lineTo(0, 74); ctx.closePath(); ctx.fillStyle = tg.bg; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  // popups monde (« -10 € »)
  for (const pp of OV.popups) {
    const p = proj(pp.worldPos); if (!p.ok) continue;
    const s = easeOutBack(range(pp.age, 0, 0.22));
    const a = 1 - range(pp.age, pp.dur - 0.3, pp.dur);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y - 30 - pp.age * 120); ctx.scale(s, s); ctx.rotate(Math.sin(pp.age * 9) * 0.05);
    outlined(pp.text, 0, 0, pp.size, pp.color, '#ffffff', pp.size * 0.22);
    ctx.lineWidth = 3; ctx.strokeStyle = '#141218'; ctx.strokeText(pp.text, 0, 0);
    ctx.restore();
  }
  // étincelles
  for (const sp of OV.sparkles) {
    const p = proj(sp.worldPos); if (!p.ok) continue;
    const k = Math.sin(range(sp.age, 0, 0.6) * Math.PI); const r = sp.size * k;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(sp.age * 3); ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 30;
    ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.16 : r; const an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // onomatopées BD
  for (const c of OV.comics) {
    const s = easeOutBack(range(c.age, 0, 0.2)); const a = 1 - range(c.age, c.dur - 0.25, c.dur);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(c.x, c.y); ctx.rotate(c.rot); ctx.scale(s * (1 + c.age * 0.08), s * (1 + c.age * 0.08));
    // éclat
    ctx.font = `${c.size}px ${FONT}`; const w = ctx.measureText(c.text).width;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#141218'; ctx.lineWidth = 8; ctx.beginPath();
    const N = 18; for (let i = 0; i < N * 2; i++) { const an = i / (N * 2) * Math.PI * 2; const rx = (w * 0.62 + 30) * (i % 2 ? 0.8 : 1.05), ry = (c.size * 0.85) * (i % 2 ? 0.8 : 1.05); ctx.lineTo(Math.cos(an) * rx, Math.sin(an) * ry); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    outlined(c.text, 0, c.size * 0.06, c.size, c.color, c.stroke, c.size * 0.16);
    ctx.restore();
  }
  // titre haut (« MARDI — 23:59 »)
  if (OV.title) {
    const { text, age, sub } = OV.title;
    const s = easeOutBack(range(age, 0, 0.3));
    ctx.save(); ctx.translate(WIDTH / 2, 300); ctx.scale(s, s);
    ctx.font = `80px ${FONT}`; const w = Math.max(ctx.measureText(text).width + 80, 420);
    ctx.fillStyle = 'rgba(10,14,40,.78)'; ctx.beginPath(); ctx.roundRect(-w / 2, -70, w, sub ? 200 : 140, 30); ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 6; ctx.stroke();
    outlined(text, 0, 2, 80, '#ffffff', '#141218', 12);
    if (sub) outlined(sub, 0, 92, 64, '#ffd23f', '#141218', 10);
    ctx.restore();
  }
  drawSubtitles(t);
  if (OV.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${clamp(OV.flash)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (OV.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(OV.fade)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
}

// ---------------- aides d'animation ----------------
const HEAD = (c) => c.worldHead();
// marche puis glissade + chute : renvoie l'état
function slipWalk(c, lt, { x, z, heading = 0, speed = 1.3, tFall, slide = 1.6, faceBefore = 'neutral', faceAfter = 'pain', fallDur = 0.5 }) {
  const dx = Math.sin(heading), dz = Math.cos(heading);
  let d;
  if (lt < tFall) d = lt * speed;
  else d = tFall * speed + slide * (1 - Math.exp(-3 * (lt - tFall)));
  c.at(x + dx * d, 0, z + dz * d, heading);
  if (lt < tFall) {
    c.walk(lt * 7, 0.6); c.setFace(faceBefore);
    // déséquilibre juste avant
    const w = range(lt, tFall - 0.35, tFall); c.armL.rotation.z -= w * 1.2; c.armR.rotation.z += w * 1.2;
  } else if (lt < tFall + fallDur) { c.fall(range(lt, tFall, tFall + fallDur)); c.setFace('surprised'); }
  else { c.lie(lt); c.setFace(faceAfter); }
}

function placeCabins(t) {
  R.cabGreen.position.copy(cableP(LINE_UP, 0.06 + frac(t * 0.004) * 0.85));
  R.cabBlue.position.copy(cableP(LINE_UP, 0.5 + frac(t * 0.004) * 0.4));
  R.cabYellow.position.copy(cableP(LINE_DOWN, 0.3 - frac(t * 0.004) * 0.25));
  R.cabBlack.visible = false;
  for (const cb of [R.cabGreen, R.cabBlue, R.cabYellow]) cb.visible = true;
}

function screenHot(k, hot) {
  const s = I.screens[k];
  if (s.hot === hot) return; s.hot = hot;
  redraw(s.tex, (cx, w, h) => drawScreen(cx, w, h, s.name, s.n, hot, false));
}
let bigHot = null;
function bigScreen(hot) { if (bigHot === hot) return; bigHot = hot; redraw(I.bigTex, (cx, w, h) => drawScreen(cx, w, h, 'NATHAN', '3 000 CHUTES', hot, true)); }
let counterVal = null;
function counter(text, flash) { const k = text + flash; if (counterVal === k) return; counterVal = k; redraw(I.counterTex, (cx, w, h) => drawCounter(cx, w, h, text, flash)); }

function coinsAt(lt, on, rate = 1) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
  const mouth = I.tubeMouth;
  for (let k = 0; k < I.coins.count; k++) {
    const age = frac(lt * 1.25 * rate + hash(k)) / 1.25;
    const vx = (hash(k + 3) - 0.5) * 1.6, vz = (hash(k + 5) - 0.5) * 1.2;
    const y = mouth.y - 0.5 * 9.8 * age * age;
    const vis = on && y > 1.75;
    e.set(age * 12 + k, age * 7, k); q.setFromEuler(e); s.setScalar(vis ? 1 : 0);
    m.compose(V3(mouth.x - 5.6 + 5.6 + vx * age - 0 , y, mouth.z + vz * age).add(V3(0, 0, 0)), q, s);
    // coordonnées locales du groupe intérieur (le groupe est à l'origine)
    I.coins.setMatrixAt(k, m);
  }
  I.coins.instanceMatrix.needsUpdate = true;
  for (let k = 0; k < I.bars.count; k++) {
    const age = frac(lt * 0.9 * rate + hash(k + 40)) / 0.9;
    const y = mouth.y - 0.5 * 9.8 * age * age;
    const vis = on && y > 1.9 && hash(k + 77) > 0.4;
    e.set(age * 5, k, age * 4); q.setFromEuler(e); s.setScalar(vis ? 1 : 0);
    m.compose(V3(mouth.x + (hash(k) - 0.5) * age * 2, y, mouth.z + (hash(k + 1) - 0.5) * age * 2), q, s);
    I.bars.setMatrixAt(k, m);
  }
  I.bars.instanceMatrix.needsUpdate = true;
}

// ---------------- les plans ----------------
const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });

// 1A — plan large plongeant sur le village
shot(0, 3.4, (lt, t) => {
  setMode('day'); shadowAt(0, 0, 5, 45);
  camKeys(lt, [[0, [42, 62, 92], [0, 10, -25], 46], [3.4, [17, 21, 44], [0, 3, 2], 50]], (u) => u);
  const ws = [
    [C.walker1, -1.6, -8, 0, 1.4], [C.walker2, 2.0, 14, Math.PI, 1.2], [C.dame, 0.6, 4, 0, 1.1], [C.facteur, -2.6, 18, Math.PI, 1.0],
  ];
  for (const [c, x, z, h, sp] of ws) { c.at(x, 0, z + Math.cos(h) * lt * sp, h).walk(lt * 7 + x, 0.6); }
  C.stilt1.at(-2.8, 0, -2 + lt * 0.8, 0).walk(lt * 4, 0.35);
  C.stilt2.at(2.6, 0, 6 - lt * 0.7, Math.PI).walk(lt * 4 + 1, 0.35);
  C.zip.at(-4.2, 5.6, -10 + lt * 5, 0); C.zip.armL.rotation.x = C.zip.armR.rotation.x = Math.PI; C.zip.legL.rotation.x = 0.3; C.zip.setFace('happy');
  EV.wideDings.forEach((te, k) => { const c = ws[k % 4][0]; popup('-10 €', HEAD(c), t - te, { size: 70 }); });
});

// 1B — « Un pas, ding, 10 € ; deux pas, ding ding, 20 »
shot(3.4, 6.8, (lt, t) => {
  setMode('day');
  const z = 6 + lt * 1.2;
  shadowAt(0, 0, z, 14);
  const c = C.dame; c.at(0, 0, z, 0).walk(lt * 5.2, 0.55);
  c.setFace(t > EV.dings[0] ? (t > EV.dings[1] ? 'scared' : 'surprised') : 'neutral');
  C.walker1.at(-2.6, 0, z - 6 + lt * 0.2, 0).walk(lt * 6, 0.6);
  look([1.3, 1.9, z + 5.2 + lt * 0.15], [0, 1.5, z], 48);
  popup('-10 €', HEAD(c), t - EV.dings[0], { size: 110 });
  popup('-20 €', HEAD(c), t - EV.dings[1], { size: 120 });
  const foot = V3(0.3, 0.1, z + 0.2);
  comic('DING !', 290, 1560, t - EV.dings[0], { size: 110, rot: -0.15, dur: 0.9 });
  comic('DING DING !', 760, 1580, t - EV.dings[1], { size: 100, rot: 0.1, dur: 1.0 });
  sparkle(foot, t - EV.dings[0]); sparkle(foot, t - EV.dings[1]); sparkle(foot, t - EV.dings[2]);
});

// 1C — échasses, câbles, téléphérique des riches
shot(6.8, 12.6, (lt, t) => {
  setMode('day'); shadowAt(0, 0, 6, 25);
  C.stilt1.at(-1.8, 0, 3 + lt * 0.9, 0).walk(lt * 3.5, 0.35); C.stilt1.setFace('happy');
  C.stilt2.at(1.9, 0, 0 + lt * 0.8, 0).walk(lt * 3.5 + 1.5, 0.35); C.stilt2.setFace('neutral');
  const zz = -14 + lt * 4.2;
  C.zip.at(-4.2, 5.55, zz, 0); C.zip.armL.rotation.x = C.zip.armR.rotation.x = Math.PI;
  C.zip.legL.rotation.x = 0.35 + Math.sin(lt * 4) * 0.2; C.zip.legR.rotation.x = 0.1 - Math.sin(lt * 4) * 0.2; C.zip.setFace('happy');
  C.zip.root.rotation.x = Math.sin(lt * 3) * 0.08;
  const s = 0.112 + lt * 0.0035;
  const cp = cableP(LINE_UP, s);
  R.cabGreen.position.copy(cp);
  C.riche.at(cp.x, cp.y - 6.45, cp.z, Math.PI * 0.85); C.riche.setFace('smirk');
  C.riche.armR.rotation.x = -1.2;
  const cb = cp.clone().add(V3(0, -4.3, 0));
  camKeys(lt, [
    [0, [4.2, 1.0, 13.5], [0, 3.6, 6], 52],
    [1.9, [3.4, 2.2, 13], [-1.5, 4.6, 6], 52],
    [3.5, [1.5, 5.2, 9], [-4.2, 6.6, zz - 3.5 + 0.0], 50],
    [5.8, [3.5, 9.5, cb.z + 11], [cb.x, cb.y, cb.z], 44],
  ]);
  tag('LES RICHES', cb.clone().add(V3(0, 2.2, 0)), lt - 4.2, 1.5, '#1d1b2a', '#ffd23f');
});

// 1D — Nathan tombe tout le temps
shot(12.6, 17.4, (lt, t) => {
  setMode('day');
  const N = C.nathan;
  const tf = [EV.nathanFalls[0] - 12.6, EV.nathanFalls[1] - 12.6, EV.nathanFalls[2] - 12.6];
  const zStop = -1 + tf[0] * 1.45;
  const z = Math.min(-1 + lt * 1.45, zStop + 0.6 * (lt > tf[0] ? 1 - Math.exp(-4 * (lt - tf[0])) : 0));
  N.at(0.4, 0, lt < tf[0] ? -1 + lt * 1.45 : zStop + 0.7 * (1 - Math.exp(-4 * (lt - tf[0]))), 0);
  if (lt < tf[0]) {
    N.walk(lt * 7, 0.6); N.setFace('happy');
    const wave = range(lt, 0.2, 0.5) * (1 - range(lt, 1.9, 2.2));
    N.armR.rotation.x = -2.8 * wave; N.armR.rotation.z = 0.3 * wave + Math.sin(lt * 14) * 0.25 * wave;
    const w = range(lt, tf[0] - 0.3, tf[0]); N.armL.rotation.z -= w; N.armR.rotation.z += w;
  } else if (lt < tf[0] + 0.45) { N.fall(range(lt, tf[0], tf[0] + 0.45)); N.setFace('surprised'); }
  else if (lt < tf[1] - 0.05) { N.fall(1 - 0.55 * range(lt, tf[0] + 0.5, tf[1] - 0.05)); N.setFace('pain'); }
  else if (lt < tf[1] + 0.3) { N.fall(0.45 + 0.55 * range(lt, tf[1] - 0.05, tf[1] + 0.3)); N.setFace('surprised'); }
  else if (lt < tf[2] - 0.05) { N.fall(1 - 0.5 * range(lt, tf[1] + 0.3, tf[2] - 0.05)); N.setFace('pain'); }
  else if (lt < tf[2] + 0.3) { N.fall(0.5 + 0.5 * range(lt, tf[2] - 0.05, tf[2] + 0.3)); N.setFace('surprised'); }
  else { N.lie(lt); N.setFace('pain'); }
  const nz = N.root.position.z;
  shadowAt(0, 0, nz, 12);
  C.walker2.at(-3.2, 0, nz - 4 - lt * 0.8, Math.PI).walk(lt * 6, 0.6);
  C.stilt2.at(-3, 0, nz - 8 + lt * 0.4, 0).walk(lt * 3.5, 0.35);
  look([2.4, 2.1 - range(lt, tf[0], tf[0] + 0.6) * 0.6, Math.min(-1 + lt * 1.45, zStop) + 6.2], [0.3, 1.3 - range(lt, tf[0], tf[0] + 0.6) * 0.5, Math.min(-1 + lt * 1.45, zStop)], 48);
  tag('NATHAN', HEAD(C.nathan), lt - 0.25, 2.5, '#ffd23f', '#2f6fe4');
  const h = HEAD(N);
  popup('-10 €', h, lt - tf[0] - 0.3, { size: 110 }); popup('-20 €', h, lt - tf[1] - 0.25, { size: 120 }); popup('-30 €', h, lt - tf[2] - 0.25, { size: 135 });
  comic('BOUM !', 300, 640, lt - tf[0] - 0.35, { size: 130, color: '#ff8c1a' });
  comic('BOUM !', 760, 560, lt - tf[1] - 0.25, { size: 120, color: '#ff8c1a', rot: 0.12, dur: 0.6 });
  comic('BOUM !', 520, 470, lt - tf[2] - 0.25, { size: 140, color: '#ff8c1a', rot: -0.05 });
});

// 1E — devant l'école : « Patatra »
shot(17.4, 20.0, (lt, t) => {
  setMode('day'); shadowAt(4, 0, -13, 16);
  const tF = EV.nathanFalls[3] - 17.4;
  slipWalk(C.nathan, lt, { x: 2.8, z: -17.5, heading: 0, speed: 1.6, tFall: tF, slide: 1.4, faceBefore: 'neutral', faceAfter: 'pain', fallDur: 0.45 });
  const kids = [[C.kid1, 5.6, -11.2], [C.kid2, 5.9, -13.2], [C.kid3, 5.4, -15.0]];
  kids.forEach(([k, x, z], i) => {
    k.at(x, Math.max(0, Math.sin((lt + i) * 12)) * 0.15 * (lt > tF + 0.3 ? 1 : 0), z, -Math.PI / 2);
    if (lt > tF + 0.3) { k.setFace('laugh'); k.armR.rotation.x = -1.5; k.armL.rotation.x = -0.4 + Math.sin(lt * 15 + i) * 0.3; k.torso.rotation.x = Math.sin(lt * 14 + i) * 0.12; }
    else k.setFace('neutral');
  });
  camKeys(lt, [[0, [-3.2, 3.4, -4.5], [4.6, 2.6, -13.5], 50], [2.6, [-2.6, 3.0, -6.5], [4.0, 2.2, -13.5], 46]]);
  comic('PATATRA !', WIDTH / 2, 520, lt - tF - 0.3, { size: 160, color: '#ff4fa0', dur: 1.6, rot: -0.08 });
  popup('-10 €', HEAD(C.nathan), lt - tF - 0.4, { size: 100 });
});

// 2F — cabine jaune « G » et panneau 50 €
shot(20.0, 23.2, (lt, t) => {
  setMode('clear'); shadowAt(0, 4, 30, 25);
  placeCabins(t);
  const s = 0.05 + lt * 0.012;
  const cp = cableP(LINE_UP, s);
  R.cabYellow.position.copy(cp);
  R.cabGreen.position.copy(cableP(LINE_UP, 0.25));
  C.gaspard.at(cp.x, cp.y - 6.95, cp.z, Math.PI); C.gaspard.setFace('smirk');
  camKeys(lt, [[0, [-3.2, 3.6, 20.5], [0, 7.0, 36], 44], [1.4, [-3.4, 3.6, 18.5], [0, 7.6, 35], 46], [3.2, [-3.2, 3.0, 4.5], [cp.x, cp.y - 4.5, cp.z], 50]]);
  sparkle(R.sign50.position.clone().add(V3(2.6, 0.8, 0)), lt - 0.2, 110);
  comic('50 € !', 780, 760, lt - 0.35, { size: 120, color: '#ff2e4d', rot: 0.1, dur: 1.2 });
  tag('GASPARD', HEAD(C.gaspard), lt - 1.9, 1.3, '#ffd23f', '#7b2cbf');
});

// 2G — la rue-patinoire : facteur, boulangère, Zoé
shot(23.2, 30.0, (lt, t) => {
  setMode('clear'); setIce(-52, 30);
  placeCabins(t);
  slipWalk(C.facteur, lt, { x: -1.0, z: -11.5, heading: 0, speed: 1.3, tFall: EV.facteurFall - 23.2, slide: 2.0, faceBefore: 'happy' });
  slipWalk(C.boulangere, lt - 2.6, { x: -4.6, z: 3.4, heading: Math.PI / 2 + 0.3, speed: 1.2, tFall: EV.boulangereFall - 25.8, slide: 1.8, faceBefore: 'happy' });
  if (lt < 2.6) C.boulangere.at(-4.6, 0, 3.4, Math.PI / 2).setFace('happy');
  slipWalk(C.zoe, lt - 4.5, { x: 1.4, z: 9.5, heading: 0.15, speed: 1.0, tFall: EV.zoeFall - 27.7, slide: 1.4, faceBefore: 'happy', faceAfter: 'cry' });
  if (lt < 4.5) C.zoe.at(1.4, 0, 9.5, 0).walk(lt * 8, 0.5);
  // projections : lettres, baguettes
  const flying = (k0, n, origin, age, col) => {
    for (let k = 0; k < n; k++) {
      const b = R.bits[k0 + k]; if (age < 0 || age > 1.6) continue;
      b.visible = true; const a = Math.min(age, 1.0);
      b.position.set(origin.x + (hash(k + k0) - 0.5) * 3 * a, Math.max(0.1, origin.y + 6 * a - 6 * a * a), origin.z + (hash(k + 9) - 0.3) * 2.5 * a);
      b.rotation.set(age * 9 + k, age * 5, k); b.material = b.material; if (col) b.scale.set(0.9, 0.18, 0.18);
    }
  };
  const tf1 = EV.facteurFall - 23.2, tf2 = EV.boulangereFall - 23.2, tf3 = EV.zoeFall - 23.2;
  flying(0, 9, V3(-1, 1.5, -11.5 + tf1 * 1.3), lt - tf1 - 0.1);
  flying(9, 7, V3(-3.8, 1.5, 3.8), lt - tf2 - 0.1, true);
  camKeys(lt, [
    [0, [3.6, 2.2, -2.8], [-1, 1.2, -9.5], 46],
    [2.6, [3.2, 2.0, -3.3], [-1, 0.8, -8.4], 46],
    [3.0, [3.8, 2.4, 9.8], [-3.2, 1.2, 3.8], 48],
    [4.4, [3.2, 2.0, 9.4], [-2.5, 0.7, 3.8], 48],
    [4.8, [-1.4, 1.5, 17.2], [1.6, 0.9, 11.2], 46],
    [6.8, [-0.9, 1.3, 16.3], [1.7, 0.5, 11.9], 44],
  ]);
  shadowAt(0, 0, camera.position.z - 8, 16);
  const hF = HEAD(C.facteur), hB = HEAD(C.boulangere), hZ = HEAD(C.zoe);
  tag('LE FACTEUR', hF, lt - 0.1, 0.9);
  popup('-10 €', hF, lt - tf1 - 0.35, { size: 100 }); comic('AÏE !', 300, 620, lt - tf1 - 0.3, { size: 120, color: '#4cc9f0' });
  tag('LA BOULANGÈRE', hB, lt - 2.9, 0.9);
  popup('-10 €', hB, lt - tf2 - 0.35, { size: 100 }); comic('OUILLE !', 760, 600, lt - tf2 - 0.3, { size: 110, color: '#ff9f1c', rot: 0.1 });
  tag('ZOÉ, 6 ANS', hZ, lt - 4.75, 1.0, '#ffffff', '#ff4fa0');
  popup('-10 €', hZ, lt - tf3 - 0.35, { size: 100 });
});

// 2H — Zoé pleure, tirelire vide -400 €
shot(30.0, 34.0, (lt, t) => {
  setMode('clear'); setIce(-52, 30); placeCabins(t); shadowAt(2, 0, 12, 10);
  const Z = C.zoe; Z.at(1.5, 0, 12.4, 0.5); Z.sit(); Z.setFace('cry');
  Z.torso.rotation.x = 0.08 + Math.sin(lt * 18) * 0.04; Z.armL.rotation.x = -0.9; Z.armR.rotation.x = -0.9; Z.armL.rotation.z = 0.2; Z.armR.rotation.z = -0.2;
  Z.headG.rotation.x = 0.15 + Math.sin(lt * 18) * 0.05;
  R.pig.visible = true; R.pig.position.set(2.7, 0, 11.2); R.pig.rotation.set(0, -1.9, Math.sin(lt * 10) * 0.05 * (lt < 1.4 ? 1 : 0)); R.pig.scale.setScalar(0.6);
  camKeys(lt, [[0, [0.6, 1.7, 17.4], [2.1, 0.9, 12.2], 44], [4, [1.3, 1.4, 15.8], [2.1, 0.8, 12.3], 40]]);
  comic('-400 €', 540, 560, lt - 1.1, { size: 190, color: '#ff2e4d', dur: 3.0, rot: -0.06 });
  comic('40 CHUTES', 760, 820, lt - 0.3, { size: 80, color: '#ffffff', dur: 1.2, rot: 0.1 });
});

// 2I — « il n'avait pas neigé… pourtant chaque matin, la rue était couverte de glace »
shot(34.0, 40.0, (lt, t) => {
  if (lt < 2.2) {
    setMode('clear'); setIce(-52, 30); placeCabins(t); shadowAt(0, 0, 5, 30);
    camKeys(lt, [[0, [0, 3, 26], [0, 40, -20], 55], [2.2, [0, 3.5, 24], [0, 8, -10], 55]]);
    comic('0 FLOCON', 540, 620, lt - 0.3, { size: 120, color: '#ffffff', rot: -0.08, dur: 1.9, stroke: '#1d4ed8' });
    C.walker1.at(-1.2, 0, 8, 0).walk(lt * 6, 0.5);
  } else {
    setMode('morning'); setIce(-52, 30); placeCabins(t);
    const u = lt - 2.2;
    shadowAt(0, 0, 8 - u * 2, 20, [-0.9, 0.45, -0.3]);
    look([1.8, 0.55 + u * 0.05, 22 - u * 3.2], [0.2, 0.25, 2 - u * 3.2], 52);
    // passants qui glissent au loin
    slipWalk(C.walker2, u, { x: -1.6, z: -4, heading: 0, speed: 1.2, tFall: 1.4, slide: 1.8, faceBefore: 'neutral' });
    slipWalk(C.dame, u, { x: 1.5, z: -12, heading: 0.1, speed: 1.1, tFall: 2.5, slide: 1.6 });
    for (let k = 0; k < R.iceGlints.length; k++) { const g = R.iceGlints[k]; sparkle(g.position.clone().add(V3(0, 0.1, 0)), frac(u * 0.7 + hash(k)) * 2.4, 70); }
  }
});

// 3J — nuit : Nathan guette depuis la ruelle
shot(40.0, 42.6, (lt, t) => {
  setMode('night'); setIce(0, 0); shadowAt(-4, 0, 6, 14, [-0.4, 1, 0.6]);
  placeCabins(t); R.cabGreen.visible = R.cabYellow.visible = R.cabBlue.visible = false;
  const N = C.nathan; N.at(-5.6, 0, 7.5, Math.PI / 2 + 0.3); N.setFace('determined');
  N.torso.rotation.z = -0.15 + Math.sin(lt * 2) * 0.03; N.headG.rotation.y = Math.sin(lt * 1.3) * 0.25;
  N.armL.rotation.x = -0.6;
  fill.position.set(-4.5, 3, 9); fill.intensity = 14; fill.color.set('#ffcf8a');
  camKeys(lt, [[0, [-8.8, 2.5, 8.0], [-1, 1.7, 5.2], 60], [2.6, [-8.3, 2.3, 7.8], [-1, 1.7, 5.2], 54]]);
  OV.title = { text: lt < 2.25 ? 'MARDI — 23:59' : 'MARDI — 00:00', age: lt, sub: null };
  OV.vignette = 0.7;
  OV.fade = 1 - range(lt, 0, 0.45);
});

const blackS = (t) => 0.33 - range(t, 42.6, 48.8) * 0.255;
// 3K — la cabine noire passe et arrose la rue
shot(42.6, 48.8, (lt, t) => {
  setMode('night'); OV.vignette = 0.7;
  const s = blackS(t);
  const cp = cableP(LINE_DOWN, s);
  const cab = R.cabBlack; cab.visible = true; cab.position.copy(cp);
  const len = cp.y - 6.1 - 3.6;
  const noz = layHose(cab, len, 0.5, t);
  const spraying = t > EV.sprayStart;
  updateSpray(R, t, noz, spraying);
  const zStart = cableP(LINE_DOWN, blackS(EV.sprayStart)).z;
  setIce(zStart, spraying ? noz.z + 0.5 : zStart);
  const N = C.nathan; N.at(-5.0, 0, 7.5, Math.PI / 2 - 0.5); N.setFace(spraying ? 'surprised' : 'scared');
  N.headG.rotation.x = -0.45; N.armL.rotation.x = -0.6;
  if (lt < 2.6) {
    shadowAt(-3, 0, 6, 16, [-0.4, 1, 0.6]);
    look([-3.9, 0.9, 10.8], [cp.x * 0.5 - 1, Math.max(4, cp.y - 5), cp.z * 0.6 + 2], 64);
    fill.position.set(-4.5, 3, 9.5); fill.intensity = 10; fill.color.set('#ffcf8a');
  } else {
    shadowAt(1, 0, noz.z, 16, [-0.4, 1, 0.6]);
    const u = lt - 2.6;
    look([4.6, 2.4 + u * 0.2, 21.5 - u * 0.4], [0.8, 3.0, noz.z - 4], 52);
    fill.position.copy(noz).add(V3(0, -2, 0)); fill.intensity = 40; fill.color.set('#9fe8ff');
  }
  sparkle(R.cabBlack.position.clone().add(V3(0, -5.25, 1.6)), frac(lt * 0.9) * 0.6, 60);
  comic('PSCHHHHH !', 560, 520, t - EV.sprayStart - 0.1, { size: 115, color: '#9fe8ff', rot: -0.06, dur: 1.6 });
  comic('LA GLACE !', 540, 1700, t - 46.9, { size: 90, color: '#9fe8ff', rot: 0.05, dur: 1.6 });
});

// 3L — Nathan s'accroche sous la cabine
shot(48.8, 52.0, (lt, t) => {
  setMode('night'); OV.vignette = 0.7; setIce(-52, 30);
  const s = lt < 0.7 ? blackS(48.8) : blackS(48.8) + (lt - 0.7) * 0.034;
  const cp = cableP(LINE_DOWN, s);
  const cab = R.cabBlack; cab.visible = true; cab.position.copy(cp);
  const L0 = cableP(LINE_DOWN, blackS(48.8)).y - 6.1 - 3.6;
  const grab = EV.nathanJump - 48.8 + 0.2;
  const len = lt < grab ? L0 : Math.max(1.5, L0 - (lt - grab) * 4.5);
  const noz = layHose(cab, len, 0.1, t);
  updateSpray(R, t, noz, false);
  const N = C.nathan; N.setFace('determined');
  const tj = EV.nathanJump - 48.8;
  if (lt < tj) {
    const u = lt / tj;
    N.at(lerp(-2.5, noz.x, u), 0, lerp(11.5, noz.z - 0.2, u), Math.atan2(noz.x + 2.5, noz.z - 11.5)); N.walk(lt * 13, 0.9);
  } else {
    const jumpU = range(lt, tj, grab);
    const hang = V3(noz.x, noz.y - 0.35 - 2.5, noz.z);
    const ground = V3(noz.x, 0, noz.z - 0.2);
    const p = ground.clone().lerp(hang, easeOut(jumpU));
    N.at(p.x, p.y, p.z, Math.PI);
    N.armL.rotation.x = N.armR.rotation.x = Math.PI * (0.5 + 0.5 * jumpU);
    N.legL.rotation.x = 0.4 + Math.sin(lt * 6) * 0.3; N.legR.rotation.x = -0.2 - Math.sin(lt * 6) * 0.3;
    N.root.rotation.z = Math.sin(lt * 3) * 0.08;
  }
  const nh = HEAD(N);
  shadowAt(noz.x, 0, noz.z, 14, [-0.4, 1, 0.6]);
  const camY = Math.max(2.2, nh.y + 0.5);
  look([noz.x + 1.8, camY - 0.5, noz.z + 9.5], [noz.x, Math.max(1.8, nh.y + 0.8), noz.z], 56);
  fill.position.copy(nh).add(V3(2, 1, 3)); fill.intensity = 14; fill.color.set('#ffd9a0');
  comic('HOP !', 760, 760, lt - tj, { size: 120, color: '#ffd23f', rot: 0.12 });
});

// 4M — l'intérieur : les écrans
shot(52.0, 58.4, (lt, t) => {
  setMode('interior');
  const N = C.nathan;
  if (lt < 1.0) { N.at(-3, -2.6 + 2.6 * easeOut(lt), 2.2, Math.PI); N.armL.rotation.x = N.armR.rotation.x = -2.6 * (1 - lt); N.setFace('determined'); }
  else if (lt < 2.2) { const u = range(lt, 1, 2.2); N.at(lerp(-3, -1, u), 0, lerp(2.2, 1.2, u), Math.PI); N.walk(lt * 7, 0.5); N.setFace('surprised'); }
  else { N.at(-1, 0, 1.2, Math.PI); N.setFace('surprised'); N.headG.rotation.y = Math.sin(lt * 0.9) * 0.4; }
  for (let k = 0; k < 6; k++) screenHot(k, (k === 1 && t >= 56.0 && t < 57.3) || (k === 2 && t >= 57.3));
  bigScreen(false);
  coinsAt(t, true, 0.4); counter('999 870 €', false);
  camKeys(lt, [
    [0, [-5.5, 2.6, 4.6], [-3, 1.3, 1.8], 58],
    [1.5, [-5.0, 3.0, 4.4], [-2.5, 2.6, -2], 58],
    [2.2, [-3.3, 3.6, 3.8], [-3.3, 3.6, -5], 56],
    [3.9, [3.3, 3.6, 3.8], [3.3, 3.6, -5], 56],
    [4.3, [0, 4.2, 1.6], [0, 4.4, -5], 46],
    [5.2, [0, 4.2, 1.2], [0, 4.4, -5], 43],
    [5.5, [3.3, 4.2, 1.6], [3.3, 4.4, -5], 46],
    [6.4, [3.3, 4.2, 1.1], [3.3, 4.4, -5], 43],
  ]);
});

// 4N — « NATHAN : 3 000 CHUTES — MEILLEUR CLIENT »
shot(58.4, 62.6, (lt, t) => {
  setMode('interior');
  for (let k = 0; k < 6; k++) screenHot(k, false);
  const on = t > EV.bigScreen;
  bigScreen(on && frac(t * 3) < 0.5);
  coinsAt(t, true, 0.4); counter('999 870 €', false);
  const N = C.nathan; N.at(-1, 0, 1.2, Math.PI); N.setFace(lt < 2.4 ? 'surprised' : 'scared');
  I.lights[1].intensity = on ? 40 + 60 * (frac(t * 3) < 0.5 ? 1 : 0) : 40;
  if (lt < 2.4) {
    camKeys(lt, [[0, [0, 3.4, 4.6], [0, 3.6, -5], 62], [0.9, [0, 5.0, 4.8], [0, 6.6, -5], 62], [2.4, [0, 5.2, 4.2], [0, 6.7, -5], 58]]);
  } else {
    N.headG.rotation.x = -0.25; N.armL.rotation.x = N.armR.rotation.x = -0.5; N.armL.rotation.z = -0.3; N.armR.rotation.z = 0.3;
    camKeys(lt, [[2.4, [-1.3, 2.3, -2.6], [-1, 2.0, 1.2], 54], [4.2, [-1.2, 2.2, -1.9], [-1, 2.0, 1.2], 50]]);
    fill.position.set(-1, 5, -3); fill.intensity = 30 + 30 * (frac(t * 3) < 0.5 ? 1 : 0); fill.color.set('#ff3b3b');
  }
  comic('3 000 !', 300, 1600, lt - 0.9, { size: 120, color: '#ff2e4d', rot: -0.1, dur: 1.5 });
});

// 4O — le coffre : 10 €, 1 000, 1 000 000 €
shot(62.6, 67.2, (lt, t) => {
  setMode('interior'); bigScreen(false);
  coinsAt(t, true, 1.2 + lt * 0.4);
  const [c1, c2, c3] = EV.counter;
  if (t < c1) counter('0 €', false); else if (t < c2) counter('10 €', t - c1 < 0.15); else if (t < c3) counter('1 000 €', t - c2 < 0.15); else counter('1 000 000 €', frac(t * 4) < 0.5);
  I.pile.scale.y = 0.4 + range(t, c1, c3 + 0.8) * 2.2; I.pile.position.y = 1.6 + range(t, c1, c3 + 0.8) * 0.4;
  const N = C.nathan; N.at(0.6, 0, 1.6, Math.PI / 2 + 0.6); N.setFace(t > c3 ? 'surprised' : 'scared');
  camKeys(lt, [[0, [-2, 3.4, 4.4], [5.4, 2.8, -1.8], 58], [1.8, [-2.6, 4.0, 3.4], [6.5, 4.2, -1.2], 54], [4.6, [-3, 4.6, 2.6], [7.5, 5.2, -1.0], 50]]);
  comic('KA-CHING !', 540, 1620, t - c3, { size: 120, color: '#ffd23f', dur: 1.2 });
  sparkle(V3(7.9, 6.4, -0.6), t - c3, 160);
  sparkle(V3(5.6, 2.2, -2.2), t - c2, 120);
});

// 4P — la photo
shot(67.2, 70.6, (lt, t) => {
  setMode('interior'); bigScreen(false); coinsAt(t, true, 1.0); counter('1 000 000 €', false);
  const N = C.nathan; N.at(-1, 0, 1.2, Math.PI);
  const raise = smooth(range(lt, 0, 0.5));
  N.armR.rotation.x = -1.75 * raise; N.armL.rotation.x = -1.55 * raise; N.armL.rotation.z = 0.35 * raise;
  N.setFace(lt < 1.2 ? 'determined' : 'happy');
  N.root.updateMatrixWorld(true);
  I.phone.visible = true;
  I.phone.position.copy(N.armR.localToWorld(V3(-0.25, -0.95, 0.1)));
  I.phone.quaternion.copy(N.root.quaternion);
  I.phone.rotateY(Math.PI); I.phone.rotateX(-0.2);
  I.phoneScreen.material.emissiveIntensity = t > EV.photo ? 2.5 : 1.0;
  if (lt < 1.4) camKeys(lt, [[0, [-2.6, 2.7, 4.4], [-0.2, 4.0, -5], 58], [1.4, [-2.3, 2.6, 3.8], [-0.3, 4.2, -5], 56]]);
  else camKeys(lt, [[1.4, [-1.4, 2.3, -2.4], [-1, 2.0, 1.2], 54], [3.4, [-1.3, 2.2, -1.8], [-1, 2.0, 1.2], 50]]);
  OV.flash = 1 - range(t, EV.photo, EV.photo + 0.35);
  if (t < EV.photo) OV.flash = 0;
  comic('CLIC !', 760, 520, t - EV.photo, { size: 110, color: '#ffffff', rot: 0.1, dur: 0.9 });
});

// 4Q — la porte se ferme : « Laissez-moi sortir ! »
const gateY = (t) => t < EV.doorSlam ? 4.6 : Math.abs(Math.cos(range(t, EV.doorSlam, EV.doorSlam + 0.5) * Math.PI * 1.5)) * 0.35 * (1 - range(t, EV.doorSlam, EV.doorSlam + 0.5)) * (t - EV.doorSlam > 0.12 ? 1 : 0) + (t - EV.doorSlam < 0.12 ? 4.6 * (1 - (t - EV.doorSlam) / 0.12) : 0);
shot(70.6, 75.0, (lt, t) => {
  setMode('interior'); bigScreen(false); coinsAt(t, true, 1.0); counter('1 000 000 €', false);
  I.gate.position.set(0, gateY(t), 5.45);
  const N = C.nathan;
  const tS = EV.doorSlam - 70.6;
  if (lt < tS + 0.2) { N.at(-0.6, 0, 1.2, Math.PI); N.setFace('happy'); }
  else if (lt < tS + 0.6) { N.at(-0.6, 0, 1.2, Math.PI + Math.PI * smooth(range(lt, tS + 0.2, tS + 0.6))); N.setFace('surprised'); }
  else if (lt < 2.6) { const u = range(lt, tS + 0.6, 2.6); N.at(-0.4, 0, lerp(1.2, 4.35, u), 0); N.walk(lt * 12, 0.8); N.setFace('scared'); }
  else {
    N.at(-0.4, 0, 4.35, 0); N.setFace('scared');
    const sh = Math.sin(lt * 22) * 0.12;
    N.armL.rotation.x = N.armR.rotation.x = -1.9 + sh; N.armL.rotation.z = -0.25; N.armR.rotation.z = 0.25;
    N.torso.rotation.x = 0.1 + sh * 0.5;
  }
  C.gaspard.at(0.4, 0, 7.4, Math.PI); C.gaspard.setFace('smirk');
  if (lt < 2.4) look([-0.2, 2.6, -1.6], [0, 2.4, 5.2], 50);
  else camKeys(lt, [[2.4, [2.3, 2.6, 2.2], [-0.4, 2.1, 4.6], 46], [4.4, [2.0, 2.5, 2.8], [-0.4, 2.2, 4.8], 42]]);
  if (lt > tS && lt < tS + 0.4) shake(0.1 * (1 - range(lt, tS, tS + 0.4)), t);
  comic('CLAC !', 540, 600, lt - tS, { size: 170, color: '#c77dff', rot: -0.1, dur: 1.2 });
});

// 4R — Gaspard derrière les barreaux
shot(75.0, 79.8, (lt, t) => {
  setMode('interior'); bigScreen(false); coinsAt(t, true, 1.0); counter('1 000 000 €', false);
  I.gate.position.set(0, 0, 5.45);
  const N = C.nathan; N.at(-0.75, 0, 4.35, 0); N.setFace('scared');
  N.armL.rotation.x = N.armR.rotation.x = -1.9; N.armR.rotation.z = 0.3;
  const G = C.gaspard; G.at(0.25, 0, 6.6, Math.PI); G.setFace(lt < 2.0 ? 'smirk' : 'evil');
  G.headG.rotation.z = Math.sin(lt * 0.8) * 0.06; G.armR.rotation.x = -0.35; G.armL.rotation.x = -0.25;
  camKeys(lt, [[0, [0.7, 2.8, 0.9], [0.25, 2.7, 6.6], 50], [2.0, [0.5, 2.9, 1.6], [0.25, 2.85, 6.6], 44], [4.8, [0.4, 2.95, 2.3], [0.25, 2.95, 6.6], 40]]);
  fill.position.set(0.3, 3.4, 5.3); fill.intensity = 7; fill.color.set('#c77dff');
  G.root.updateMatrixWorld(true);
  const mono = G.monocle.getWorldPosition(V3());
  sparkle(mono, t - EV.monocleGlint, 150);
  sparkle(mono, t - EV.monocleGlint - 2.2, 120);
  OV.vignette = 0.75;
});

// 4S — la salle bouge
shot(79.8, 81.8, (lt, t) => {
  setMode('interior'); coinsAt(t, true, 1.6); counter('1 000 000 €', frac(t * 6) < 0.5);
  bigScreen(frac(t * 4) < 0.5);
  I.gate.position.set(0, 0, 5.45);
  I.skyT.offset.y = -lt * 0.25;
  const N = C.nathan; N.at(-0.6 + Math.sin(lt * 5) * 0.3, 0, 3.0, Math.PI + 0.4); N.setFace('scared');
  N.armL.rotation.z = -1.3 + Math.sin(lt * 9) * 0.3; N.armR.rotation.z = 1.3 + Math.sin(lt * 8) * 0.3; N.root.rotation.z = Math.sin(lt * 6) * 0.15;
  N.legL.rotation.x = Math.sin(lt * 7) * 0.4; N.legR.rotation.x = -Math.sin(lt * 7) * 0.4;
  look([-6.2, 4.4, -1.6], [0.5, 2.4, 3.0], 56);
  shake(0.12, t);
  for (const l of I.lights) l.intensity *= frac(t * 7) < 0.3 ? 0.3 : 1;
  comic('BRRROUM !', 540, 560, lt - 0.2, { size: 120, color: '#ff8c1a', rot: -0.08, dur: 1.6 });
});

// 4T — ce n'était pas une salle, c'était une cabine
shot(81.8, DURATION, (lt, t) => {
  setMode('night'); setIce(-52, 30); placeCabins(t);
  R.cabGreen.visible = R.cabBlue.visible = false;
  const s = 0.5 + lt * 0.012;
  const cp = cableP(LINE_UP, s);
  const B = R.bigCab; B.visible = true; B.position.copy(cp); B.position.y += 1.5;
  B.rotation.z = Math.sin(lt * 1.4) * 0.03;
  const body = cp.clone().add(V3(0, -11, 0));
  const top = V3(0, 78, -207);
  shadowAt(cp.x, cp.y - 12, cp.z, 30, [-0.4, 1, 0.6]);
  const u = easeOut(range(lt, 0, 4.6));
  const camP = V3(lerp(16, 46, u), lerp(-6, 4, u), lerp(20, 62, u)).add(body);
  const tgt = body.clone().lerp(top, 0.03 + 0.12 * u);
  look(camP.toArray(), tgt.toArray(), lerp(52, 44, u));
  R.topLight.material.emissiveIntensity = 1.2 + Math.sin(t * 5) * 0.9;
  fill.position.copy(body).add(V3(10, 0, 12)); fill.intensity = 120; fill.color.set('#ffb347'); fill.distance = 60;
  sparkle(top, frac(t * 0.8) * 0.6, 90);
  OV.vignette = 0.8;
  OV.flash = 0.8 * (1 - range(lt, 0, 0.35));
  if (t > EV.endTitle) OV.title = { text: 'À SUIVRE...', age: t - EV.endTitle, sub: 'PATATRA — ÉPISODE 1' };
  OV.fade = range(t, DURATION - 0.9, DURATION - 0.1);
});

// transitions rapides
function transitions(t) {
  for (const w of [20.0, 52.0]) { const a = t - w; if (a >= 0 && a < 0.25) OV.flash = Math.max(OV.flash, 0.7 * (1 - a / 0.25)); }
  const b = 40.0 - t; if (b > 0 && b < 0.35) OV.fade = Math.max(OV.fade, 1 - b / 0.35);
}

// ---------------- rendu d'une image ----------------
const allChars = Object.values(C);
function renderFrame(t) {
  resetOV();
  for (const c of allChars) c.reset();
  R.pig.visible = false; for (const b of R.bits) { b.visible = false; b.scale.set(0.5, 0.04, 0.34); }
  R.bigCab.visible = false; hideHose(R.cabBlack); R.spray.visible = false;
  I.phone.visible = false; I.gate.position.set(0, 4.6, 5.45); I.skyT.offset.y = 0;
  fill.distance = 30;
  for (const l of I.lights) l.intensity = l.userData.base ??= l.intensity;
  placeCabins(t);
  setIce(-52, 30);
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  sh.fn(t - sh.t0, t);
  transitions(t);
  if (R.snow.visible) updateSnow(R, t, camera.position.clone().add(V3(0, 0, -15)), camera.position);
  renderer.render(scene, camera);
  compose(t);
}

window.renderFrame = (t, type = 'image/jpeg', q = 0.93) => { renderFrame(t); return out.toDataURL(type, q); };
window.renderOnly = (t) => { renderFrame(t); return true; };
window.IS_READY = true;
