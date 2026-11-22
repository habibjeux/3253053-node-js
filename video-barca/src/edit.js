// Montage vertical 9:16 à partir des images extraites (frames/<clip>/%05d.jpg, 50 i/s) :
// recadrages, ralentis, arrêts sur image annotés façon analyse télé, sous-titres « karaoké ».
import { LINES, WIDTH, HEIGHT, DURATION } from './timeline.js';

await Promise.all([document.fonts.load('80px "Luckiest Guy"'), document.fonts.load('900 80px "Montserrat"'), document.fonts.load('italic 900 80px "Montserrat"')]);
const SCALE = Number(new URLSearchParams(location.search).get('s') || 1);
const out = document.getElementById('out');
out.width = Math.round(WIDTH * SCALE); out.height = Math.round(HEIGHT * SCALE);
const ctx = out.getContext('2d');
const COMIC = '"Luckiest Guy", "DejaVu Sans", sans-serif';
const SANS = '"Montserrat", "DejaVu Sans", sans-serif';
const SRC_FPS = { a: 50, b: 50, c: 50, v1: 30, v2: 30, v3: 30, v4: 30 }, SRC_N = { a: 688, b: 880, c: 900, v1: 308, v2: 456, v3: 432, v4: 293 };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const range = (t, a, b) => clamp((t - a) / (b - a));
const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
const easeOutBack = (u) => { u = clamp(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };

const GOLD = '#f5c518', GRANA = '#a50044', BLAU = '#1e6fd9', CYAN = '#38e1ff', RED = '#ff3d5a', WHITE = '#ffffff';

// ---------------- découpage (selon ?cfg=) ----------------
const CFG = new URLSearchParams(location.search).get('cfg') || 'v3';
const { SEGS, ANN, EXTRA } = await import(`./cfg_${CFG}.js`);
// ---------------- images ----------------
const cache = new Map();
function img(src, n) {
  const k = src + n; if (cache.has(k)) return cache.get(k);
  const im = new Image(); im.src = `frames/${src}/${String(n).padStart(5, '0')}.jpg`;
  const p = im.decode().then(() => im); cache.set(k, p);
  if (cache.size > 40) cache.delete(cache.keys().next().value);
  return p;
}

// ---------------- primitives graphiques ----------------
let cur = null;
const S = (p) => [(p[0] - cur.x) * cur.k, (p[1] - cur.y) * cur.k + cur.dy];
function txt(text, x, y, size, fill, { font = SANS, weight = 900, italic = false, stroke = '#000', lw = 0, align = 'center' } = {}) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
}
// étiquette façon habillage TV : panneau sombre, liseré couleur
function plate(name, sub, x, y, color, s = 1) {
  ctx.font = `italic 900 46px ${SANS}`; const w1 = ctx.measureText(name).width;
  ctx.font = `800 26px ${SANS}`; const w2 = sub ? ctx.measureText(sub).width : 0;
  const w = Math.max(w1, w2) + 64, h = sub ? 104 : 72;
  x = clamp(x, w / 2 + 16, WIDTH - w / 2 - 16);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgba(8,10,20,.88)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 14); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, 12, h, [14, 0, 0, 14]); ctx.fill();
  txt(name, 6, sub ? -16 : 2, 46, '#fff', { italic: true });
  if (sub) txt(sub, 6, 30, 26, color, { weight: 800 });
  ctx.restore();
  return x;
}
function badge(label, x, y, color, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12;
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.lineWidth = 5; ctx.strokeStyle = '#0b0d18'; ctx.stroke();
  txt(label, 0, 2, 40, '#0b0d18'); ctx.restore();
}
function curvePts(a, b, curve, prog, N = 60) {
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * curve, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * curve;
  const pts = [];
  for (let i = 0; i <= Math.round(N * prog); i++) { const u = i / N; pts.push([(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * my + u * u * b[1]]); }
  return pts;
}
function head(x2, y2, ang, color, size = 46) {
  ctx.save(); ctx.translate(x2, y2); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(size * 0.55, 0); ctx.lineTo(-size * 0.55, size * 0.55); ctx.lineTo(-size * 0.3, 0); ctx.lineTo(-size * 0.55, -size * 0.55); ctx.closePath();
  ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = '#0b0d18'; ctx.stroke(); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
function label(text, pts, color, s) {
  const m = pts[Math.floor(pts.length * 0.5)], m2 = pts[Math.min(pts.length - 1, Math.floor(pts.length * 0.5) + 2)];
  const nx = -(m2[1] - m[1]), ny = m2[0] - m[0], l = Math.hypot(nx, ny) || 1;
  const off = ny / l < 0 ? -1 : 1; // étiquette au-dessus de la ligne
  ctx.font = `italic 900 40px ${SANS}`; const w = ctx.measureText(text).width + 40;
  let x = m[0] - (nx / l) * 62 * off, y = m[1] - (ny / l) * 62 * off;
  x = clamp(x, w / 2 + 14, WIDTH - w / 2 - 14);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 12;
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(-w / 2, -30, w, 60, 30); ctx.fill();
  ctx.shadowColor = 'transparent'; txt(text, 0, 2, 40, '#0b0d18', { italic: true });
  ctx.restore();
}
// passe : trait plein qui s'épaissit, ballon qui file le long de la courbe
function drawPass(an, age, t) {
  const dur = an.dur || 0.6; const prog = easeOut(range(age, 0, dur));
  const pts = curvePts(S(an.p), S(an.q), an.curve || 0, prog);
  if (pts.length < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const pass of [0, 1]) {
    for (let i = 1; i < pts.length; i++) {
      const u = i / 60; const w = 7 + 11 * u;
      ctx.lineWidth = pass ? w : w + 10; ctx.strokeStyle = pass ? an.color : 'rgba(5,6,12,.75)';
      ctx.beginPath(); ctx.moveTo(...pts[i - 1]); ctx.lineTo(...pts[i]); ctx.stroke();
    }
  }
  // reflet clair au centre
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
  const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[Math.max(0, pts.length - 3)];
  if (prog > 0.98) head(x2, y2, Math.atan2(y2 - y1, x2 - x1), an.color);
  else { // ballon en mouvement + traînée
    for (let k = 1; k < 8; k++) { const q = pts[Math.max(0, pts.length - 1 - k * 2)]; ctx.fillStyle = `rgba(255,255,255,${0.35 - k * 0.04})`; ctx.beginPath(); ctx.arc(q[0], q[1], 13 - k, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0b0d18'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x2, y2, 14, 0, 7); ctx.fill(); ctx.stroke();
  }
  if (an.badge) badge(an.badge, ...S(an.p).map((v, i) => v + (i ? -40 : -40)), an.color, easeOutBack(range(age, 0, 0.3)));
  if (an.label && prog > 0.6) label(an.label, pts, an.color, easeOutBack(range(age, dur * 0.6, dur * 0.6 + 0.3)));
}
// course : pointillés qui défilent
function drawRun(an, age, t) {
  const dur = an.dur || 0.6; const prog = easeOut(range(age, 0, dur));
  const pts = curvePts(S(an.p), S(an.q), an.curve || 0, prog);
  if (pts.length < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = () => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); };
  ctx.setLineDash([]); ctx.lineWidth = 20; ctx.strokeStyle = 'rgba(5,6,12,.7)'; path(); ctx.stroke();
  ctx.setLineDash([26, 18]); ctx.lineDashOffset = -t * 90; ctx.lineWidth = 11; ctx.strokeStyle = an.color; path(); ctx.stroke();
  ctx.setLineDash([]);
  const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[Math.max(0, pts.length - 3)];
  if (prog > 0.9) head(x2, y2, Math.atan2(y2 - y1, x2 - x1), an.color, 42);
  if (an.badge) badge(an.badge, S(an.p)[0] - 40, S(an.p)[1] + 44, an.color, easeOutBack(range(age, 0, 0.3)));
  if (an.label && prog > 0.6) label(an.label, pts, an.color, easeOutBack(range(age, dur * 0.6, dur * 0.6 + 0.3)));
}
// projecteur au sol sous le joueur + anneau qui tourne + étiquette reliée
function drawSpot(p, r, color, age, t, name, sub, side) {
  const [x, y] = S(p); const rr = r * cur.k * (0.6 + 0.4 * easeOutBack(range(age, 0, 0.35)));
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.42);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr * 1.4); g.addColorStop(0, color + 'aa'); g.addColorStop(0.6, color + '33'); g.addColorStop(1, color + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rr * 1.4, 0, 7); ctx.fill();
  ctx.lineWidth = 9; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2 * smooth(range(age, 0, 0.35))); ctx.stroke();
  ctx.shadowBlur = 0; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); ctx.lineDashOffset = t * 40;
  ctx.beginPath(); ctx.arc(0, 0, rr * 1.32, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  if (!name) return;
  const s = easeOutBack(range(age, 0.15, 0.45)); if (s <= 0) return;
  const below = side === 'below';
  const py = below ? y + rr * 0.42 + 120 : y - 150 - rr * 0.3;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = clamp(s);
  ctx.beginPath(); ctx.moveTo(x, below ? y + rr * 0.42 : y - 90); ctx.lineTo(x, below ? py - 50 : py + 50); ctx.stroke(); ctx.restore();
  plate(name, sub, x, py, color, s);
}
function drawAnn(an, t) {
  const age = t - an.t; if (age < 0 || (an.until && t > an.until)) return;
  const s = easeOutBack(range(age, 0, 0.3));
  ctx.save();
  if (an.type === 'focus') {
    const [x, y] = S(an.p); const a = 0.5 * smooth(range(age, 0, 0.35)) * (an.until ? 1 - range(t, an.until - 0.3, an.until) : 1);
    ctx.beginPath(); ctx.rect(0, cur.dy, WIDTH, cur.dh); ctx.moveTo(x + an.r * cur.k * 1.4, y); ctx.ellipse(x, y, an.r * cur.k * 1.4, an.r * cur.k, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,10,${a})`; ctx.fill('evenodd');
  }
  if (an.type === 'spot') drawSpot(an.p, an.r, an.color, age, t, an.name, an.sub, an.side);
  if (an.type === 'track') {
    const k = an.keys; const st = cur.st; let i = 0; while (i < k.length - 2 && st > k[i + 1][0]) i++;
    const u = range(st, k[i][0], k[i + 1][0]); const p = [lerp(k[i][1], k[i + 1][1], u), lerp(k[i][2], k[i + 1][2], u)];
    drawSpot(p, an.r, an.color, age, t, an.name, null);
  }
  if (an.type === 'zone') {
    const [x, y] = S(an.p); const rx = an.r[0] * cur.k * s, ry = an.r[1] * cur.k * s;
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.clip();
    ctx.fillStyle = an.color + '30'; ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    ctx.strokeStyle = an.color + '88'; ctx.lineWidth = 5; const off = (t * 30) % 28;
    for (let d = -rx - ry; d < rx + ry; d += 28) { ctx.beginPath(); ctx.moveTo(x + d + off - ry, y + ry); ctx.lineTo(x + d + off + ry, y - ry); ctx.stroke(); }
    ctx.restore();
    ctx.lineWidth = 6 + Math.sin(t * 6) * 2; ctx.strokeStyle = an.color; ctx.setLineDash([22, 14]); ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    if (an.label) { ctx.font = `italic 900 40px ${SANS}`; const w = ctx.measureText(an.label).width + 40; ctx.fillStyle = an.color; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 30, w, 60, 30); ctx.fill(); txt(an.label, x, y + 2, 40, '#0b0d18', { italic: true }); }
  }
  if (an.type === 'tag') { // étiquette posée sur une annotation existante
    const [x, y] = S(an.p); ctx.font = `italic 900 44px ${SANS}`; const w = ctx.measureText(an.text).width + 48 + (an.badge ? 60 : 0);
    const cx = clamp(x, w / 2 + 14, WIDTH - w / 2 - 14);
    ctx.translate(cx, y); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(8,10,20,.9)'; ctx.beginPath(); ctx.roundRect(-w / 2, -34, w, 68, 34); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 4; ctx.strokeStyle = an.color; ctx.stroke();
    if (an.badge) { ctx.fillStyle = an.color; ctx.beginPath(); ctx.arc(-w / 2 + 34, 0, 26, 0, 7); ctx.fill(); txt(an.badge, -w / 2 + 34, 2, 32, '#0b0d18'); }
    txt(an.text, an.badge ? 30 : 0, 2, 44, an.color, { italic: true });
  }
  if (an.type === 'plate') { // étiquette TV reliée à un joueur déjà entouré
    const [x, y] = S(an.p); const py = y - 190 > 220 ? y - 190 : y + 190;
    ctx.save(); ctx.strokeStyle = an.color; ctx.lineWidth = 4; ctx.globalAlpha = clamp(s);
    ctx.beginPath(); ctx.moveTo(x, py < y ? y - 70 : y + 70); ctx.lineTo(x, py < y ? py + 52 : py - 52); ctx.stroke();
    ctx.fillStyle = an.color; ctx.beginPath(); ctx.arc(x, py < y ? y - 70 : y + 70, 7, 0, 7); ctx.fill(); ctx.restore();
    plate(an.name, an.sub, x, py, an.color, s);
  }
  if (an.type === 'pass') drawPass(an, age, t);
  if (an.type === 'run') drawRun(an, age, t);
  if (an.type === 'banner') {
    const life = an.life || 2.8; if (age > life) { ctx.restore(); return; }
    ctx.globalAlpha = 1 - range(age, life - 0.3, life);
    const y = cur.dy > 260 ? cur.dy - 78 : 250; const w = 0;
    ctx.translate(WIDTH / 2, y); ctx.scale(s, s);
    ctx.font = `italic 900 58px ${SANS}`; const bw = ctx.measureText(an.text).width + 110;
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(8,10,20,.9)'; ctx.beginPath(); ctx.moveTo(-bw / 2 + 24, -42); ctx.lineTo(bw / 2, -42); ctx.lineTo(bw / 2 - 24, 42); ctx.lineTo(-bw / 2, 42); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = an.color; ctx.beginPath(); ctx.moveTo(-bw / 2 + 24, -42); ctx.lineTo(-bw / 2 + 52, -42); ctx.lineTo(-bw / 2 + 28, 42); ctx.lineTo(-bw / 2, 42); ctx.closePath(); ctx.fill();
    txt(an.text, 20, 2, 58, '#fff', { italic: true });
  }
  if (an.type === 'pop') {
    const a2 = 1 - range(age, 1.5, 1.8); ctx.globalAlpha = a2;
    const y = cur.dy > 300 ? cur.dy - 90 : 300;
    ctx.translate(WIDTH / 2, y); ctx.rotate(-0.05); ctx.scale(s, s);
    txt(an.text, 0, 0, 92, an.color, { font: COMIC, weight: 400, stroke: '#000', lw: 18 });
  }
  if (an.type === 'goal') {
    if (age > 2.2) { ctx.restore(); return; }
    ctx.globalAlpha = 1 - range(age, 1.8, 2.2);
    ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - range(age, 0, 0.3))})`; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.translate(WIDTH / 2, 760); ctx.rotate(-0.08); const k = easeOutBack(range(age, 0, 0.25)) * (1 + age * 0.08); ctx.scale(k, k);
    txt('BUUUUT !', 0, 0, 190, GOLD, { font: COMIC, weight: 400, stroke: GRANA, lw: 34 });
  }
  ctx.restore();
}

// ---------------- sous-titres « karaoké » ----------------
const KEYWORDS = /^(BARÇA|YAMAL|LAMINE|RAPHINHA|FERMÍN|VILLARREAL|CATALANS|BUUUUT)/;
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
  for (const tw of timed) { const len = c.reduce((s, x) => s + x.w.length + 1, 0); if (c.length >= 3 || len + tw.w.length > 16) flush(); c.push(tw); if (/[,.:;!?…]$/.test(tw.w)) flush(); }
  flush();
}
function drawSubtitles(t, cy) {
  const ch = CHUNKS.find((c) => t >= c.t0 && t < c.t1 + 0.08); if (!ch) return;
  const size = 84; ctx.font = `900 ${size}px ${SANS}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const words = ch.words.map((w) => w.w.toUpperCase()); const space = 22;
  const widths = words.map((w) => ctx.measureText(w).width);
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => { if (rw + widths[i] > WIDTH - 110 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += widths[i] + space; });
  const enter = easeOutBack(range(t, ch.t0, ch.t0 + 0.14));
  ctx.save(); ctx.translate(WIDTH / 2, cy); ctx.scale(0.86 + 0.14 * enter, 0.86 + 0.14 * enter); ctx.translate(-WIDTH / 2, -cy);
  rows.forEach((row, ri) => {
    const total = row.reduce((s, i) => s + widths[i], 0) + space * (row.length - 1);
    let x = WIDTH / 2 - total / 2; const y = cy + (ri - (rows.length - 1) / 2) * size * 1.18;
    for (const i of row) {
      const w = ch.words[i]; const active = t >= w.t0 && t < w.t1 + 0.03; const said = t >= w.t0;
      const key = KEYWORDS.test(words[i]);
      if (active) { // encadré qui « saute » sur le mot prononcé
        const k = easeOutBack(range(t, w.t0, w.t0 + 0.12));
        ctx.save(); ctx.translate(x + widths[i] / 2, y); ctx.rotate(-0.025); ctx.scale(k, k);
        ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
        ctx.fillStyle = key ? GRANA : GOLD; ctx.beginPath(); ctx.roundRect(-widths[i] / 2 - 16, -size * 0.58, widths[i] + 32, size * 1.12, 16); ctx.fill();
        ctx.restore();
      }
      ctx.save();
      if (active) { ctx.translate(x + widths[i] / 2, y); ctx.scale(1.06, 1.06); ctx.translate(-(x + widths[i] / 2), -y); }
      ctx.lineJoin = 'round'; ctx.lineWidth = active ? 0 : 16; ctx.strokeStyle = '#000';
      if (!active) { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowOffsetY = 7; ctx.strokeText(words[i], x, y + 3); ctx.shadowColor = 'transparent'; }
      ctx.fillStyle = active ? (key ? '#fff' : '#0b0d18') : key ? GOLD : said ? '#ffffff' : 'rgba(255,255,255,.92)';
      ctx.fillText(words[i], x, y + 3);
      ctx.restore();
      x += widths[i] + space;
    }
  });
  ctx.restore();
}

async function renderFrame(t) {
  let si = SEGS.findIndex((s) => t >= s.t0 && t < s.t1); if (si < 0) si = SEGS.length - 1;
  const seg = SEGS[si];
  const u = range(t, seg.t0, seg.t1);
  const st = lerp(seg.s0, seg.s1, u);
  const n = clamp(Math.round(st * SRC_FPS[seg.src]) + 1, 1, SRC_N[seg.src]);
  const im = await img(seg.src, n);
  const e = smooth(u);
  const [cx, cy, cw] = seg.full ? [540, 960, 1080] : seg.crop[0].map((v, k) => lerp(v, seg.crop[1][k], e));
  if (seg.full) seg.ar = 16 / 9;
  const chh = cw * seg.ar, k = WIDTH / cw, dh = chh * k;
  const dy = seg.ar > 1.7 ? 0 : Math.round(860 - dh / 2);
  const chhFull = seg.full ? 1920 : chh;
  const SW = seg.full ? 1080 : 1920, SH = seg.full ? 1920 : 1080;
  cur = { x: clamp(cx - cw / 2, 0, SW - cw), y: clamp(cy - chh / 2, 0, SH - chh), k, dy, dh, st };
  const frozen = seg.s0 === seg.s1 && !seg.hold;
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (seg.ar < 1.7) { ctx.save(); ctx.filter = 'blur(30px) brightness(0.4) saturate(1.2)'; const bw = HEIGHT * 16 / 9; ctx.drawImage(im, (WIDTH - bw) / 2, 0, bw, HEIGHT); ctx.restore(); }
  ctx.save(); if (frozen) ctx.filter = 'saturate(0.75) brightness(0.92)';
  ctx.drawImage(im, cur.x, cur.y, cw, chh, 0, dy, WIDTH, dh); ctx.restore();
  if (seg.ar < 1.7) { ctx.fillStyle = GOLD; ctx.fillRect(0, dy - 5, WIDTH, 5); ctx.fillStyle = GRANA; ctx.fillRect(0, dy + dh, WIDTH, 5); }
  if (frozen) { // indicateur « ARRÊT SUR IMAGE »
    ctx.fillStyle = 'rgba(8,10,20,.85)'; ctx.beginPath(); ctx.roundRect(24, dy + dh - 78, 276, 56, 28); ctx.fill();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(56, dy + dh - 50, 9 + Math.sin(t * 8) * 2, 0, 7); ctx.fill();
    txt('ARRÊT SUR IMAGE', 174, dy + dh - 48, 26, '#fff', { weight: 800 });
  }
  const g = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (const an of ANN) if (an.seg === si) drawAnn(an, t);
  if (si === EXTRA.halftime) drawAnn({ type: 'banner', life: 9, text: 'MI-TEMPS : 0 - 2', color: RED, t: SEGS[EXTRA.halftime].t0 + 0.15 }, t);
  for (const s of SEGS) { const a = t - s.t0; if (s.t0 > 0 && !s.hold && a >= 0 && a < 0.12) { ctx.fillStyle = `rgba(255,255,255,${0.3 * (1 - a / 0.12)})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); } }
  drawSubtitles(t, seg.ar > 1.7 ? 1480 : clamp(dy + dh + 150, 1380, 1560));
  const f = range(t, DURATION - 0.8, DURATION - 0.05); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
  if (t < 0.25) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.25})`; ctx.fillRect(0, 0, WIDTH, HEIGHT); }
}

window.renderFrame = async (t, type = 'image/jpeg', q = 0.93) => { await renderFrame(t); return out.toDataURL(type, q); };
window.IS_READY = true;
