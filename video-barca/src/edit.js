// Montage vertical 9:16 à partir des images extraites (frames/<clip>/%05d.jpg, 50 i/s) :
// recadrages, ralentis, arrêts sur image annotés, sous-titres mot à mot.
import { LINES, WIDTH, HEIGHT, DURATION } from './timeline.js';

await document.fonts.load('80px "Luckiest Guy"');
const SCALE = Number(new URLSearchParams(location.search).get('s') || 1);
const out = document.getElementById('out');
out.width = Math.round(WIDTH * SCALE); out.height = Math.round(HEIGHT * SCALE);
const ctx = out.getContext('2d');
const FONT = '"Luckiest Guy", "DejaVu Sans", sans-serif';
const SRC_FPS = 50, SRC_N = { a: 688, b: 880, c: 900 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const range = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
const easeOutBack = (u) => { u = clamp(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };

const GOLD = '#edbb00', GRANA = '#a50044', BLAU = '#004d98', CYAN = '#3ee0ff';

// ---------------- découpage ----------------
// crop : [[cx, cy, cw] début, [cx, cy, cw] fin], ar = hauteur/largeur du recadrage
const SEGS = [
  { t0: 0.0, t1: 3.75, src: 'b', s0: 3.6, s1: 7.35, ar: 1.25, crop: [[1000, 540, 864], [1060, 540, 864]] },
  { t0: 3.75, t1: 7.95, src: 'c', s0: 13.8, s1: 18.0, ar: 1.25, crop: [[760, 540, 864], [560, 540, 864]] },
  { t0: 7.95, t1: 18.45, src: 'a', s0: 0.0, s1: 0.0, ar: 0.75, crop: [[960, 540, 1440], [1000, 440, 1300]] },
  { t0: 18.45, t1: 21.55, src: 'a', s0: 0.0, s1: 1.5, ar: 0.75, crop: [[1000, 440, 1300], [760, 420, 1200]] },
  { t0: 21.55, t1: 25.5, src: 'a', s0: 1.5, s1: 5.6, ar: 0.75, crop: [[720, 440, 1440], [960, 440, 1440]] },
  { t0: 25.5, t1: 27.95, src: 'a', s0: 10.0, s1: 11.6, ar: 1.0, crop: [[900, 540, 1080], [940, 540, 1080]] },
  { t0: 27.95, t1: 32.85, src: 'a', s0: 11.6, s1: 13.7, ar: 0.75, crop: [[960, 540, 1440], [960, 540, 1440]] },
  { t0: 32.85, t1: 44.5, src: 'a', s0: 7.0, s1: 7.0, ar: 0.75, crop: [[800, 470, 1440], [780, 480, 1260]] },
  { t0: 44.5, t1: 47.0, src: 'a', s0: 7.0, s1: 8.4, ar: 0.75, crop: [[780, 480, 1260], [760, 480, 1300]] },
  { t0: 47.0, t1: 48.95, src: 'b', s0: 0.0, s1: 0.9, ar: 1.25, crop: [[700, 540, 864], [760, 540, 864]] },
  { t0: 48.95, t1: 54.25, src: 'b', s0: 0.9, s1: 3.0, ar: 0.75, crop: [[960, 540, 1440], [1040, 540, 1300]] },
  { t0: 54.25, t1: 55.45, src: 'b', s0: 4.6, s1: 5.8, ar: 1.25, crop: [[1050, 540, 864], [1050, 540, 760]] },
  { t0: 55.45, t1: 59.9, src: 'b', s0: 12.0, s1: 16.4, ar: 1.778, crop: [[1350, 540, 608], [1250, 540, 608]] },
  { t0: 59.9, t1: DURATION, src: 'c', s0: 9.6, s1: 12.7, ar: 1.778, crop: [[900, 540, 608], [930, 540, 560]] },
];
// annotations (coordonnées dans l'image source 1920×1080)
const ANN = [
  // arrêt sur image : Raphinha
  { seg: 2, t: 9.27, type: 'circle', p: [1540, 415], r: 70, color: GOLD, label: 'RAPHINHA' },
  { seg: 2, t: 11.41, type: 'banner', text: '2 POSSIBILITÉS', color: GOLD },
  { seg: 2, t: 12.63, type: 'arrow', p: [1505, 400], q: [530, 285], color: GOLD, label: '1', curve: -0.12 },
  { seg: 2, t: 12.9, type: 'circle', p: [495, 278], r: 60, color: GOLD, label: 'YAMAL' },
  { seg: 2, t: 13.8, type: 'tag', p: [720, 300], text: '1 CONTRE 1', color: GOLD, dy: 130 },
  { seg: 2, t: 15.17, type: 'zone', p: [960, 620], r: [230, 110], color: CYAN, label: "L'ESPACE" },
  { seg: 2, t: 15.17, type: 'arrow', p: [1515, 445], q: [1040, 600], color: CYAN, label: '2', dashed: true },
  // la passe en glissant
  { seg: 3, t: 18.6, type: 'circle', p: [1540, 415], r: 70, color: GOLD, until: 19.6 },
  { seg: 3, t: 20.3, type: 'pop', text: 'MÊME EN GLISSANT !', color: GOLD, y: 300 },
  { seg: 4, t: 21.7, type: 'banner', text: 'LAMINE YAMAL', color: GOLD },
  { seg: 5, t: 26.2, type: 'circle', p: [1290, 430], r: 140, color: '#ff4d4d', label: 'IL RECULE !' },
  { seg: 6, t: 28.3, type: 'banner', text: '+ 2 DÉFENSEURS', color: '#ff4d4d' },
  { seg: 6, t: 30.6, type: 'pop', text: 'INARRÊTABLE', color: GOLD, y: 300 },
  // arrêt sur image : les solutions de Yamal
  { seg: 7, t: 33.0, type: 'circle', p: [1215, 310], r: 60, color: GOLD, label: 'YAMAL' },
  { seg: 7, t: 34.0, type: 'banner', text: '2 SOLUTIONS', color: GOLD },
  { seg: 7, t: 35.3, type: 'arrow', p: [1190, 330], q: [470, 610], color: '#ffffff', label: 'CENTRER', curve: 0.18, dashed: true },
  { seg: 7, t: 37.4, type: 'arrow', p: [1180, 350], q: [300, 470], color: '#ff4d4d', label: 'DRIBBLER', curve: -0.25, dashed: true },
  { seg: 7, t: 39.85, type: 'dim' },
  { seg: 7, t: 39.85, type: 'circle', p: [864, 680], r: 62, color: CYAN, label: 'FERMÍN' },
  { seg: 7, t: 42.0, type: 'arrow', p: [860, 690], q: [560, 790], color: CYAN, label: "L'APPEL" },
  // la passe
  { seg: 8, t: 44.6, type: 'trace', p: [1220, 360], q: [600, 760], dur: 0.9, color: CYAN },
  { seg: 8, t: 45.2, type: 'pop', text: 'PASSE CHIRURGICALE', color: CYAN, y: 300 },
  { seg: 9, t: 47.1, type: 'banner', text: 'FERMÍN', color: CYAN },
  { seg: 10, t: 51.6, type: 'pop', text: 'PETIT FILET !', color: GOLD, y: 300 },
  { seg: 11, t: 54.26, type: 'goal' },
  { seg: 12, t: 55.5, type: 'banner', text: 'TOUJOURS UNE SOLUTION', color: GOLD },
];

// ---------------- images ----------------
const cache = new Map();
function img(src, n) {
  const k = src + n; if (cache.has(k)) return cache.get(k);
  const im = new Image(); im.src = `frames/${src}/${String(n).padStart(5, '0')}.jpg`;
  const p = im.decode().then(() => im); cache.set(k, p);
  if (cache.size > 40) cache.delete(cache.keys().next().value);
  return p;
}

// ---------------- dessin ----------------
let cur = null; // transformation du segment courant
function S(p) { return [(p[0] - cur.x) * cur.k, (p[1] - cur.y) * cur.k + cur.dy]; }
function outlined(text, x, y, size, fill, stroke = '#000', lw = null) {
  ctx.font = `${size}px ${FONT}`; ctx.lineJoin = 'round';
  ctx.lineWidth = lw ?? size * 0.2; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
function pill(text, x, y, size, color, textColor = '#111', s = 1) {
  ctx.font = `${size}px ${FONT}`; const w = ctx.measureText(text).width + size * 0.9, h = size * 1.35;
  x = clamp(x, w / 2 + 14, WIDTH - w / 2 - 14);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.font = `${size}px ${FONT}`;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 6, -h / 2 + 8, w, h, h / 2); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.06);
  ctx.restore();
}
function arrowPath(a, b, curve, prog) {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * curve, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * curve;
  const pts = []; const N = 40;
  for (let i = 0; i <= N * prog; i++) { const u = i / N; pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * my + u * u * b[1]]); }
  return pts;
}
function drawAnn(an, t) {
  const age = t - an.t; if (age < 0 || (an.until && t > an.until)) return;
  const s = easeOutBack(range(age, 0, 0.3));
  ctx.save();
  if (an.type === 'dim') { ctx.fillStyle = `rgba(0,0,0,${0.35 * smooth(range(age, 0, 0.4))})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (an.type === 'circle') {
    const [x, y] = S(an.p); const r = an.r * cur.k;
    ctx.translate(x, y); ctx.scale(1, 0.55);
    ctx.lineWidth = 10; ctx.strokeStyle = an.color; ctx.shadowColor = an.color; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(0, 0, r * s, 0, Math.PI * 2 * smooth(range(age, 0, 0.35))); ctx.stroke();
    ctx.restore(); ctx.save();
    if (an.label) pill(an.label, x, y - r * 0.55 - 70, 50, an.color, '#111', s);
  }
  if (an.type === 'zone') {
    const [x, y] = S(an.p);
    ctx.translate(x, y); ctx.fillStyle = an.color + '44'; ctx.strokeStyle = an.color; ctx.lineWidth = 6; ctx.setLineDash([18, 12]);
    ctx.beginPath(); ctx.ellipse(0, 0, an.r[0] * cur.k * s, an.r[1] * cur.k * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.restore(); ctx.save(); if (an.label) pill(an.label, x, y, 50, an.color, '#111', s);
  }
  if (an.type === 'arrow' || an.type === 'trace') {
    const prog = smooth(range(age, 0, an.dur || 0.5));
    const pts = arrowPath(S(an.p), S(an.q), an.curve || 0, prog);
    if (pts.length > 1) {
      ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.5)';
      if (an.dashed) ctx.setLineDash([30, 20]);
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 4, y + 5) : ctx.moveTo(x + 4, y + 5))); ctx.stroke();
      ctx.strokeStyle = an.color; ctx.shadowColor = an.color; ctx.shadowBlur = 18; ctx.lineWidth = 11;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.setLineDash([]);
      const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[Math.max(0, pts.length - 4)];
      const ang = Math.atan2(y2 - y1, x2 - x1);
      if (an.type === 'arrow') { ctx.fillStyle = an.color; ctx.beginPath(); ctx.moveTo(x2 + Math.cos(ang) * 30, y2 + Math.sin(ang) * 30); ctx.lineTo(x2 + Math.cos(ang + 2.4) * 34, y2 + Math.sin(ang + 2.4) * 34); ctx.lineTo(x2 + Math.cos(ang - 2.4) * 34, y2 + Math.sin(ang - 2.4) * 34); ctx.fill(); }
      else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x2, y2, 12, 0, 7); ctx.fill(); }
      ctx.shadowBlur = 0;
      if (an.label && prog > 0.6) { const m = pts[Math.floor(pts.length * 0.55)]; pill(an.label, m[0], m[1] - 50, 46, an.color, '#111', easeOutBack(range(age, 0.3, 0.6))); }
    }
  }
  if (an.type === 'tag') { const [x, y] = S(an.p); pill(an.text, x, y + an.dy, 46, an.color, '#111', s); }
  if (an.type === 'banner') { pill(an.text, WIDTH / 2, cur.dy - 70 > 120 ? cur.dy - 70 : 230, 64, an.color, '#111', s); }
  if (an.type === 'pop') {
    const a2 = 1 - range(age, 1.6, 1.9); ctx.globalAlpha = a2;
    ctx.translate(WIDTH / 2, an.y); ctx.rotate(-0.05); ctx.scale(s, s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlined(an.text, 0, 0, 96, an.color, '#000', 18);
  }
  if (an.type === 'goal') {
    ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - range(age, 0, 0.3))})`; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.translate(WIDTH / 2, 760); ctx.rotate(-0.08); const k = easeOutBack(range(age, 0, 0.25)) * (1 + age * 0.08); ctx.scale(k, k);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlined('BUUUUT !', 0, 0, 190, GOLD, GRANA, 34);
  }
  ctx.restore();
}

// sous-titres (mot actif en or)
const CHUNKS = [];
for (const [a, b, text] of LINES) {
  const words = [];
  for (const w of text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().split(/\s+/)) {
    if (words.length && /^([€:;!?,.»…]+|\.\.\.)$/.test(w)) words[words.length - 1] += ' ' + w; else words.push(w);
  }
  const weights = words.map((w) => w.length + 3); const tot = weights.reduce((s, v) => s + v, 0);
  let tt = a; const timed = words.map((w, i) => { const d = (b - a) * weights[i] / tot; const r = { w, t0: tt, t1: tt + d }; tt += d; return r; });
  let c = [];
  const flush = () => { if (c.length) CHUNKS.push({ words: c, t0: c[0].t0, t1: c[c.length - 1].t1 }); c = []; };
  for (const tw of timed) { const len = c.reduce((s, x) => s + x.w.length + 1, 0); if (c.length >= 3 || len + tw.w.length > 17) flush(); c.push(tw); if (/[,.:;!?…]$/.test(tw.w) && c.length >= 2) flush(); }
  flush();
}
function drawSubtitles(t, cy) {
  const ch = CHUNKS.find((c) => t >= c.t0 && t < c.t1 + 0.05); if (!ch) return;
  const size = 88; ctx.font = `${size}px ${FONT}`;
  const words = ch.words.map((w) => w.w.toUpperCase()); const space = size * 0.28;
  const widths = words.map((w) => ctx.measureText(w).width);
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => { if (rw + widths[i] > WIDTH - 120 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += widths[i] + space; });
  const pop = easeOutBack(range(t, ch.t0, ch.t0 + 0.16));
  ctx.save(); ctx.translate(WIDTH / 2, cy); ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop); ctx.translate(-WIDTH / 2, -cy);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  rows.forEach((row, ri) => {
    const total = row.reduce((s, i) => s + widths[i], 0) + space * (row.length - 1);
    let x = WIDTH / 2 - total / 2; const y = cy + (ri - (rows.length - 1) / 2) * size * 1.12;
    for (const i of row) {
      const active = t >= ch.words[i].t0 && t < ch.words[i].t1 + 0.02;
      ctx.save(); if (active) { ctx.translate(x + widths[i] / 2, y); ctx.scale(1.08, 1.08); ctx.translate(-(x + widths[i] / 2), -y); }
      ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowOffsetY = 8;
      outlined(words[i], x, y, size, active ? GOLD : '#ffffff', '#000', 17);
      ctx.restore(); x += widths[i] + space;
    }
  });
  ctx.restore();
}

async function renderFrame(t) {
  const si = SEGS.findIndex((s) => t >= s.t0 && t < s.t1); const seg = SEGS[si < 0 ? SEGS.length - 1 : si];
  const u = range(t, seg.t0, seg.t1);
  const st = lerp(seg.s0, seg.s1, u);
  const n = clamp(Math.round(st * SRC_FPS) + 1, 1, SRC_N[seg.src]);
  const im = await img(seg.src, n);
  const e = smooth(u);
  const [cx, cy, cw] = seg.crop[0].map((v, k) => lerp(v, seg.crop[1][k], e));
  const chh = cw * seg.ar;
  const k = WIDTH / cw, dh = chh * k;
  const dy = seg.ar > 1.7 ? 0 : Math.round(860 - dh / 2);
  cur = { x: clamp(cx - cw / 2, 0, 1920 - cw), y: clamp(cy - chh / 2, 0, 1080 - chh), k, dy };
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  // fond flouté
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (seg.ar < 1.7) {
    ctx.save(); ctx.filter = 'blur(30px) brightness(0.45) saturate(1.2)';
    const bw = HEIGHT * 16 / 9; ctx.drawImage(im, (WIDTH - bw) / 2, 0, bw, HEIGHT); ctx.restore();
  }
  ctx.drawImage(im, cur.x, cur.y, cw, chh, 0, dy, WIDTH, dh);
  if (seg.ar < 1.7) { ctx.fillStyle = GOLD; ctx.fillRect(0, dy - 6, WIDTH, 6); ctx.fillStyle = GRANA; ctx.fillRect(0, dy + dh, WIDTH, 6); }
  // arrêt sur image : léger voile + icône pause
  if (seg.s0 === seg.s1) {
    ctx.fillStyle = 'rgba(0,0,30,.12)'; ctx.fillRect(0, dy, WIDTH, dh);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(WIDTH - 90, dy + 30, 16, 50); ctx.fillRect(WIDTH - 62, dy + 30, 16, 50);
  }
  // vignette
  const g = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const an of ANN) if (an.seg === (si < 0 ? SEGS.length - 1 : si)) drawAnn(an, t);
  // badge « mi-temps »
  if (t > 3.9 && t < 7.95) pill('MI-TEMPS : 0 - 2', WIDTH / 2, 230, 64, '#ffffff', GRANA, easeOutBack(range(t, 3.9, 4.2)));
  // flash de coupe
  for (const s of SEGS) { const a = t - s.t0; if (s.t0 > 0 && a >= 0 && a < 0.12) { ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - a / 0.12)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); } }
  drawSubtitles(t, seg.ar > 1.7 ? 1500 : Math.min(1560, dy + dh + 160));
  const f = range(t, DURATION - 0.8, DURATION - 0.05); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (t < 0.25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.25})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
}

window.renderFrame = async (t, type = 'image/jpeg', q = 0.93) => { await renderFrame(t); return out.toDataURL(type, q); };
window.IS_READY = true;
