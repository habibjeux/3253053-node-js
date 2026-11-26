// Shared helpers, palette and drawing primitives (characters, buildings, scenery).
const { createCanvas, Path2D } = require('@napi-rs/canvas');

const W = 1080, H = 1920;
const K = '#07080c'; // outline ink

// ---------- math ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeIO = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const prog = (t, a, b) => clamp((t - a) / (b - a));
function rng(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function noise1(x, seed = 0) { // smooth value noise
  const h = i => { const r = Math.sin((i + seed * 57.13) * 127.1) * 43758.5453; return r - Math.floor(r); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}
// keyframe track: [[t, value], ...] (values numbers or arrays)
function track(keys, t, fn = easeIO) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const p = fn((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], p)) : lerp(v0, v1, p);
    }
  }
  return keys[keys.length - 1][1];
}

// hop curve. returns {y (<=0 up), landing phase info}
function hop(t, period, height, t0 = 0) {
  if (t < t0) return { y: 0, air: 0, sq: 0 };
  const p = ((t - t0) / period) % 1;
  const airFrac = 0.72;
  if (p < airFrac) { const q = p / airFrac; return { y: -height * 4 * q * (1 - q), air: q, sq: 0 }; }
  const q = (p - airFrac) / (1 - airFrac);
  return { y: 0, air: 0, sq: Math.sin(q * Math.PI) * (q < 0.5 ? 1 : 0.6) };
}

// ---------- canvas helpers ----------
function mk(w, h) { const c = createCanvas(w, h); return [c, c.getContext('2d')]; }
function fillStroke(ctx, fill, lw = 5, stroke = K) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function glow(ctx, x, y, r, color, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save(); ctx.globalAlpha *= a; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---------- palette ----------
const P = {
  robe: '#263350', robeDark: '#19223a', robeFade: '#3c4a66', trim: '#b8922f', trimDark: '#7d6220',
  pants: '#141824', boot: '#0b0c11', sole: '#c9ced2',
  skin: '#a9c1c2', skinDark: '#7e9799', socket: '#24323b',
  hatDome: '#7a1d22', hatBrim: '#10131e', knob: '#d0342c',
  paper: '#e9c44a', paperDark: '#c9a22f', ink: '#b3221d',
  nail: '#d6cfa6', mold: '#5d6e52',
};

// ---------- talisman glyphs (abstract brush marks, deterministic) ----------
function talismanGlyphs(ctx, w, h, seed = 7, color = P.ink) {
  // abstract Taoist "fu" brushwork: three hooks on top, a spine crossed by strokes and boxes, a spiral tail
  const r = rng(seed);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const bw = w * 0.075;
  ctx.lineWidth = bw;
  for (let k = -1; k <= 1; k++) { // three hooks
    ctx.beginPath(); ctx.moveTo(k * w * 0.22, h * 0.05); ctx.lineTo(k * w * 0.22, h * 0.13); ctx.quadraticCurveTo(k * w * 0.22 + w * 0.08, h * 0.15, k * w * 0.22 + w * 0.1, h * 0.11); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-w * 0.34, h * 0.19); ctx.quadraticCurveTo(0, h * 0.16, w * 0.34, h * 0.2); ctx.stroke();
  // spine
  ctx.lineWidth = bw * 0.9;
  ctx.beginPath(); ctx.moveTo(0, h * 0.2); ctx.bezierCurveTo(w * 0.08, h * 0.4, -w * 0.08, h * 0.6, 0, h * 0.78); ctx.stroke();
  let y = h * 0.26;
  while (y < h * 0.72) {
    const kind = r();
    if (kind < 0.45) { // horizontal stroke
      const ww = w * (0.2 + r() * 0.15);
      ctx.lineWidth = bw * (0.7 + r() * 0.5);
      ctx.beginPath(); ctx.moveTo(-ww, y); ctx.quadraticCurveTo(0, y - h * 0.015, ww, y + h * 0.01); ctx.stroke();
      y += h * 0.055;
    } else if (kind < 0.75) { // small box (口)
      const bx = (r() - 0.5) * w * 0.3, s2 = w * 0.13; ctx.lineWidth = bw * 0.6;
      ctx.strokeRect(bx - s2, y - h * 0.01, s2 * 2, h * 0.05); y += h * 0.075;
    } else { // diagonal pair
      ctx.lineWidth = bw * 0.7;
      ctx.beginPath(); ctx.moveTo(-w * 0.28, y); ctx.lineTo(-w * 0.08, y + h * 0.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.28, y); ctx.lineTo(w * 0.08, y + h * 0.05); ctx.stroke();
      y += h * 0.07;
    }
  }
  // spiral tail
  ctx.lineWidth = bw * 0.7;
  ctx.beginPath(); ctx.moveTo(0, h * 0.76);
  for (let i = 0; i < 5; i++) { const yy = h * (0.78 + i * 0.03); ctx.quadraticCurveTo(w * (i % 2 ? -0.32 : 0.32), yy, 0, yy + h * 0.015); }
  ctx.stroke();
}
function drawTalisman(ctx, w, h, glowAmt = 0, seed = 7) {
  // origin at top-center
  if (glowAmt > 0) glow(ctx, 0, h * 0.5, h * 0.9, '#ffcf5a', glowAmt * 0.5);
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 + w * 0.04, h); ctx.lineTo(-w / 2 - w * 0.02, h * 0.97); ctx.closePath();
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, P.paperDark); g.addColorStop(0.35, P.paper); g.addColorStop(1, '#d9b23c');
  fillStroke(ctx, g, Math.max(2, w * 0.05));
  ctx.save(); talismanGlyphs(ctx, w, h, seed, glowAmt > 0.3 ? '#e0301f' : P.ink); ctx.restore();
}

// ---------- JIANGSHI : FRONT VIEW (origin = feet centre, ~650 px tall) ----------
// o: { headTurn, eye (0..1 glow), eyeRed, talismanSwing, talismanDetach (0..1), talismanGlow, mouth, sil (silhouette colour or null), squash }
function jiangshiFront(ctx, o = {}) {
  const sil = o.sil;
  const c = col => sil || col;
  const lw = sil ? 0 : 6;
  const ht = o.headTurn || 0;
  ctx.save();
  if (o.squash) ctx.scale(1 + o.squash * 0.06, 1 - o.squash * 0.07);
  // legs + boots
  for (const s of [-1, 1]) {
    rrect(ctx, s > 0 ? 8 : -58, -185, 50, 160, 8); fillStroke(ctx, c(P.pants), lw);
    rrect(ctx, s > 0 ? 2 : -70, -45, 68, 45, [14, 14, 6, 6]); fillStroke(ctx, c(P.boot), lw);
    if (!sil) { ctx.fillStyle = P.sole; ctx.fillRect(s > 0 ? 5 : -67, -9, 62, 6); }
  }
  // robe body
  ctx.beginPath(); ctx.moveTo(-98, -412); ctx.lineTo(98, -412);
  ctx.quadraticCurveTo(112, -280, 138, -150); ctx.quadraticCurveTo(0, -138, -138, -150);
  ctx.quadraticCurveTo(-112, -280, -98, -412); ctx.closePath();
  let g = c(P.robe);
  if (!sil) { g = ctx.createLinearGradient(-140, 0, 140, 0); g.addColorStop(0, P.robeDark); g.addColorStop(0.45, P.robe); g.addColorStop(0.7, P.robeFade); g.addColorStop(1, P.robeDark); }
  fillStroke(ctx, g, lw);
  if (!sil) {
    ctx.save(); ctx.clip();
    // faded / mould patches
    const r = rng(11);
    for (let i = 0; i < 16; i++) {
      const x = -120 + r() * 240, y = -400 + r() * 250, rr = 14 + r() * 34;
      const mg = ctx.createRadialGradient(x, y, 0, x, y, rr);
      mg.addColorStop(0, rgba(P.mold, 0.55)); mg.addColorStop(1, rgba(P.mold, 0));
      ctx.fillStyle = mg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      ctx.fillStyle = rgba('#8a9a74', 0.5);
      for (let k = 0; k < 4; k++) { ellipse(ctx, x + (r() - 0.5) * rr, y + (r() - 0.5) * rr, 2 + r() * 3, 2 + r() * 3); ctx.fill(); }
    }
    // hem trim
    ctx.beginPath(); ctx.moveTo(-150, -178); ctx.quadraticCurveTo(0, -166, 150, -178); ctx.lineTo(150, -140); ctx.lineTo(-150, -140); ctx.closePath();
    ctx.fillStyle = P.trim; ctx.fill();
    ctx.fillStyle = P.trimDark;
    for (let x = -126; x <= 126; x += 28) { ellipse(ctx, x, -158, 7, 7); ctx.fill(); }
    // centre opening
    ctx.fillStyle = P.trim; ctx.fillRect(-5, -405, 10, 240);
    // rank badge
    rrect(ctx, -46, -385, 92, 86, 4); fillStroke(ctx, '#3a3a40', 4, P.trim);
    ctx.strokeStyle = rgba('#c9b27a', 0.7); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, -342, 22, 0.3, Math.PI * 1.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-28, -318); ctx.quadraticCurveTo(0, -330, 28, -318); ctx.stroke();
    ctx.restore();
    // re-stroke outline
    ctx.beginPath(); ctx.moveTo(-98, -412); ctx.lineTo(98, -412);
    ctx.quadraticCurveTo(112, -280, 138, -150); ctx.quadraticCurveTo(0, -138, -138, -150);
    ctx.quadraticCurveTo(-112, -280, -98, -412); ctx.closePath(); fillStroke(ctx, null, lw);
  }
  // collar + neck
  rrect(ctx, -22, -450, 44, 44, 6); fillStroke(ctx, c(P.skinDark), lw);
  rrect(ctx, -36, -422, 72, 18, 5); fillStroke(ctx, c(P.trim), lw);
  // sleeves (arms reaching forward, cuffs facing viewer, hands drooping)
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 92, -412); ctx.quadraticCurveTo(s * 165, -390, s * 168, -330);
    ctx.lineTo(s * 70, -318); ctx.quadraticCurveTo(s * 70, -360, s * 66, -380); ctx.closePath();
    fillStroke(ctx, c(s < 0 ? P.robeDark : P.robe), lw);
    ellipse(ctx, s * 119, -324, 52, 22, s * -0.06); fillStroke(ctx, c(P.trim), lw);
    ellipse(ctx, s * 119, -322, 38, 13, s * -0.06); fillStroke(ctx, c('#0c0f18'), 0);
  }
  // hands
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 119, -322);
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-30, 40, -22, 58); ctx.lineTo(22, 58); ctx.quadraticCurveTo(30, 40, 26, 0); ctx.closePath();
    fillStroke(ctx, c(P.skin), lw);
    for (let f = 0; f < 4; f++) {
      const fx = -18 + f * 12;
      ctx.beginPath(); ctx.moveTo(fx, 50); ctx.quadraticCurveTo(fx + 1, 78, fx + s * 2, 92);
      ctx.lineWidth = 11; ctx.strokeStyle = c(K); ctx.lineCap = 'round'; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = c(P.skin); ctx.stroke();
      // long nails
      ctx.beginPath(); ctx.moveTo(fx - 3, 88); ctx.quadraticCurveTo(fx, 120, fx + s * 6 + 4, 142); ctx.lineTo(fx + 4, 90); ctx.closePath();
      fillStroke(ctx, c(P.nail), sil ? 0 : 2.5);
    }
    ctx.restore();
  }
  // head
  ctx.save(); ctx.translate(ht * 6, 0);
  for (const s of [-1, 1]) { ellipse(ctx, s * (60 - ht * s * 8), -500, 13, 20); fillStroke(ctx, c(P.skinDark), lw); }
  ellipse(ctx, 0, -505, 63, 74);
  if (!sil) { const hg = ctx.createLinearGradient(-60, -560, 60, -440); hg.addColorStop(0, '#bed3d3'); hg.addColorStop(0.6, P.skin); hg.addColorStop(1, P.skinDark); g = hg; } else g = sil;
  fillStroke(ctx, g, lw);
  const fx = ht * 22;
  if (!sil) {
    ctx.strokeStyle = rgba('#4f6466', 0.8); ctx.lineWidth = 3;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx + s * 40, -480); ctx.quadraticCurveTo(fx + s * 44, -462, fx + s * 34, -450); ctx.stroke(); }
    for (const s of [-1, 1]) { ellipse(ctx, fx + s * 36, -508, 17, 13); ctx.fillStyle = P.socket; ctx.fill(); }
    // mouth
    const m = o.mouth || 0;
    ctx.beginPath(); ctx.moveTo(fx - 20, -460); ctx.quadraticCurveTo(fx, -466 - m * 4, fx + 20, -460);
    ctx.quadraticCurveTo(fx, -450 + m * 10, fx - 20, -460); ctx.closePath(); fillStroke(ctx, '#2a0f12', 3);
    ctx.fillStyle = '#f2ecd8';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx + s * 12, -462); ctx.lineTo(fx + s * 8, -450 + m * 2); ctx.lineTo(fx + s * 4, -462); ctx.fill(); }
  }
  // hat
  ellipse(ctx, 0, -578, 66, 46); ctx.save(); ctx.clip(); ctx.fillStyle = c(P.hatDome); ctx.fillRect(-70, -630, 140, 54);
  if (!sil) { ctx.strokeStyle = rgba('#000', 0.35); ctx.lineWidth = 3; for (let x = -60; x <= 60; x += 15) { ctx.beginPath(); ctx.moveTo(x * 0.3, -624); ctx.lineTo(x, -578); ctx.stroke(); } }
  ctx.restore(); ellipse(ctx, 0, -578, 66, 46); fillStroke(ctx, null, lw);
  rrect(ctx, -80, -584, 160, 36, 14); fillStroke(ctx, c(P.hatBrim), lw);
  ellipse(ctx, 0, -628, 13, 13); fillStroke(ctx, c(P.knob), lw);
  if (!sil) { ellipse(ctx, -4, -632, 4, 4); ctx.fillStyle = '#ff8c7a'; ctx.fill(); }
  ctx.restore();
  // talisman (pinned under the brim)
  drawTalismanOn(ctx, o, ht * 6 + ht * 14, -552, 54, 128, sil);
  ctx.restore();
  // eyes drawn separately so they can glow through silhouettes
}
function jiangshiFrontEyes(ctx, o = {}) {
  const ht = o.headTurn || 0, fx = ht * 6 + ht * 22, e = o.eye == null ? 0.6 : o.eye;
  const col = o.eyeRed ? '#ff3a2a' : '#f4efc4';
  ctx.save(); if (o.squash) ctx.scale(1 + o.squash * 0.06, 1 - o.squash * 0.07);
  for (const s of [-1, 1]) {
    if (e > 0.05) glow(ctx, fx + s * 36, -508, 30 + e * 25, o.eyeRed ? '#ff2a1a' : '#fff6b0', e * 0.8);
    ellipse(ctx, fx + s * 36, -508, 6 + e * 2, 6 + e * 2); ctx.fillStyle = col; ctx.fill();
  }
  ctx.restore();
}
function drawTalismanOn(ctx, o, px, py, w, h, sil) {
  if (o.talismanGone) return;
  const d = o.talismanDetach || 0;
  ctx.save(); ctx.translate(px, py);
  let rot = (o.talismanSwing || 0) * 0.12;
  if (d > 0) {
    const a = clamp(d / 0.35), b = clamp((d - 0.35) / 0.65);
    ctx.translate(-w / 2, 0); rot += -a * 0.5 + Math.sin(d * 40) * 0.1 * (1 - b); ctx.rotate(rot); ctx.translate(w / 2, 0);
    if (b > 0) { ctx.translate(b * 900, -b * 700 - b * b * 300); ctx.rotate(b * 5); ctx.scale(1 - b * 0.3, 1 - b * 0.3); }
  } else ctx.rotate(rot);
  if (sil) { ctx.beginPath(); ctx.rect(-w / 2, 0, w, h); ctx.fillStyle = o.talismanGlow ? rgba(P.paper, 0.55) : sil; ctx.fill(); }
  else drawTalisman(ctx, w, h, o.talismanGlow || 0);
  ctx.restore();
}

// ---------- JIANGSHI : SIDE VIEW facing right ----------
function jiangshiSide(ctx, o = {}) {
  const sil = o.sil, c = col => sil || col, lw = sil ? 0 : 6;
  const flare = o.flare || 0; // hem lift while airborne
  ctx.save();
  if (o.squash) ctx.scale(1 + o.squash * 0.06, 1 - o.squash * 0.07);
  // far arm (behind)
  sideArm(ctx, o, 12, -8, c(P.robeDark), sil, true);
  // braid (queue)
  ctx.beginPath(); ctx.moveTo(-28, -520); ctx.quadraticCurveTo(-70 - flare * 30, -430, -55 - flare * 40, -300 - flare * 20);
  ctx.lineWidth = 18; ctx.strokeStyle = c('#0d0e14'); ctx.lineCap = 'round'; ctx.stroke();
  // legs + boots
  rrect(ctx, -30, -185, 56, 160, 8); fillStroke(ctx, c(P.pants), lw);
  ctx.beginPath(); ctx.moveTo(-36, -45); ctx.lineTo(40, -45); ctx.quadraticCurveTo(72, -40, 70, -10); ctx.lineTo(70, 0); ctx.lineTo(-36, 0); ctx.closePath(); fillStroke(ctx, c(P.boot), lw);
  if (!sil) { ctx.fillStyle = P.sole; ctx.fillRect(-33, -8, 100, 6); }
  // robe
  const robePath = () => {
    ctx.beginPath(); ctx.moveTo(-62, -412); ctx.lineTo(48, -412);
    ctx.quadraticCurveTo(68, -280, 92 + flare * 20, -150 - flare * 30);
    ctx.quadraticCurveTo(0, -140 - flare * 10, -100 - flare * 25, -152 - flare * 35);
    ctx.quadraticCurveTo(-78, -280, -62, -412); ctx.closePath();
  };
  robePath();
  let g = c(P.robe);
  if (!sil) { g = ctx.createLinearGradient(-100, 0, 90, 0); g.addColorStop(0, P.robeDark); g.addColorStop(0.6, P.robe); g.addColorStop(1, P.robeFade); }
  fillStroke(ctx, g, lw);
  if (!sil) {
    ctx.save(); robePath(); ctx.clip();
    const r = rng(23);
    for (let i = 0; i < 10; i++) {
      const x = -90 + r() * 170, y = -400 + r() * 250, rr = 12 + r() * 28;
      const mg = ctx.createRadialGradient(x, y, 0, x, y, rr); mg.addColorStop(0, rgba(P.mold, 0.5)); mg.addColorStop(1, rgba(P.mold, 0));
      ctx.fillStyle = mg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    ctx.fillStyle = P.trim; ctx.fillRect(-130, -185 - flare * 32, 260, 30);
    ctx.fillStyle = P.trimDark; for (let x = -100; x <= 90; x += 28) { ellipse(ctx, x, -170 - flare * 32, 6, 6); ctx.fill(); }
    ctx.fillStyle = P.trim; ctx.beginPath(); ctx.moveTo(44, -410); ctx.lineTo(54, -410); ctx.lineTo(88, -165); ctx.lineTo(78, -165); ctx.fill();
    ctx.restore(); robePath(); fillStroke(ctx, null, lw);
  }
  // neck + collar
  rrect(ctx, -8, -452, 40, 46, 6); fillStroke(ctx, c(P.skinDark), lw);
  rrect(ctx, -18, -424, 64, 18, 5); fillStroke(ctx, c(P.trim), lw);
  // head (profile)
  ctx.beginPath(); ctx.ellipse(14, -505, 58, 72, 0, 0, Math.PI * 2);
  if (!sil) { const hg = ctx.createLinearGradient(-40, 0, 70, 0); hg.addColorStop(0, P.skinDark); hg.addColorStop(0.5, P.skin); hg.addColorStop(1, '#bfd3d3'); g = hg; } else g = sil;
  fillStroke(ctx, g, lw);
  ctx.beginPath(); ctx.moveTo(66, -500); ctx.quadraticCurveTo(84, -482, 68, -474); fillStroke(ctx, c(P.skin), lw); // nose
  ellipse(ctx, -12, -500, 12, 19); fillStroke(ctx, c(P.skinDark), lw); // ear
  if (!sil) {
    ellipse(ctx, 46, -510, 14, 11); ctx.fillStyle = P.socket; ctx.fill();
    ctx.beginPath(); ctx.moveTo(50, -458); ctx.quadraticCurveTo(62, -462, 70, -456); ctx.lineWidth = 4; ctx.strokeStyle = '#2a0f12'; ctx.stroke();
    ctx.fillStyle = '#f2ecd8'; ctx.beginPath(); ctx.moveTo(62, -460); ctx.lineTo(65, -450); ctx.lineTo(67, -459); ctx.fill();
  }
  // hat
  ctx.save(); ellipse(ctx, 12, -578, 62, 44); ctx.clip(); ctx.fillStyle = c(P.hatDome); ctx.fillRect(-60, -630, 140, 54); ctx.restore();
  ellipse(ctx, 12, -578, 62, 44); fillStroke(ctx, null, lw);
  rrect(ctx, -60, -584, 150, 36, 14); fillStroke(ctx, c(P.hatBrim), lw);
  ellipse(ctx, 12, -628, 13, 13); fillStroke(ctx, c(P.knob), lw);
  // near arm
  sideArm(ctx, o, 0, 0, c(P.robe), sil, false);
  // talisman hanging in front of the face (seen at an angle)
  if (!o.talismanGone) {
    ctx.save(); ctx.translate(76, -552); ctx.rotate(-0.08 - flare * 0.5 + (o.talismanSwing || 0) * 0.1);
    ctx.scale(0.55, 1);
    if (sil) { ctx.beginPath(); ctx.rect(-27, 0, 54, 128); ctx.fillStyle = sil; ctx.fill(); }
    else drawTalisman(ctx, 54, 128, o.talismanGlow || 0);
    ctx.restore();
  }
  ctx.restore();
}
function sideArm(ctx, o, dx, dy, fill, sil, far) {
  const lw = sil ? 0 : 6, c = col => sil || col;
  ctx.save(); ctx.translate(dx, dy);
  ctx.beginPath(); ctx.moveTo(-10, -412); ctx.lineTo(160, -418); ctx.lineTo(166, -352); ctx.lineTo(8, -350); ctx.closePath();
  fillStroke(ctx, fill, lw);
  ellipse(ctx, 166, -385, 14, 38); fillStroke(ctx, c(far ? P.trimDark : P.trim), lw);
  // hand drooping forward
  ctx.save(); ctx.translate(172, -392);
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(40, -16, 50, 6); ctx.lineTo(40, 26); ctx.quadraticCurveTo(10, 22, 0, 18); ctx.closePath();
  fillStroke(ctx, c(far ? P.skinDark : P.skin), lw);
  for (let f = 0; f < 3; f++) {
    const fy = 4 + f * 7;
    ctx.beginPath(); ctx.moveTo(42, fy); ctx.quadraticCurveTo(62, fy + 8, 64, fy + 30);
    ctx.lineWidth = 10; ctx.strokeStyle = c(K); ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = c(far ? P.skinDark : P.skin); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, fy + 26); ctx.quadraticCurveTo(70, fy + 58, 60 + f * 2, fy + 78); ctx.lineTo(67, fy + 28); ctx.closePath();
    fillStroke(ctx, c(P.nail), sil ? 0 : 2.5);
  }
  ctx.restore(); ctx.restore();
}
function jiangshiSideEyes(ctx, o = {}) {
  const e = o.eye == null ? 0.5 : o.eye;
  ctx.save(); if (o.squash) ctx.scale(1 + o.squash * 0.06, 1 - o.squash * 0.07);
  if (e > 0.05) glow(ctx, 48, -510, 30 + e * 20, o.eyeRed ? '#ff2a1a' : '#fff6b0', e * 0.8);
  ellipse(ctx, 48, -510, 5 + e * 2, 5 + e * 2); ctx.fillStyle = o.eyeRed ? '#ff3a2a' : '#f4efc4'; ctx.fill();
  ctx.restore();
}

// buffer for partially-shaded characters
const [shadeBuf, shadeCtx] = mk(W, H);
// draw a jiangshi at (x,y) with scale s. o.shade in [0,1] darkens toward o.shadeColor.
function drawJiangshi(ctx, view, x, y, s, o = {}) {
  const body = view === 'side' ? jiangshiSide : jiangshiFront;
  const eyes = view === 'side' ? jiangshiSideEyes : jiangshiFrontEyes;
  const shade = o.shade || 0, sc = o.shadeColor || '#05070d';
  const place = c => { c.translate(x, y); c.scale(s * (o.flip ? -1 : 1), s); };
  // ground shadow
  if (!o.noShadow) {
    ctx.save(); ctx.translate(x, o.groundY != null ? o.groundY : y); ctx.scale(s, s);
    const lift = o.lift || 0; const k = 1 - clamp(lift / 260) * 0.5;
    ellipse(ctx, 0, 0, 110 * k, 18 * k); ctx.fillStyle = `rgba(0,0,0,${0.45 * k * (o.alpha == null ? 1 : o.alpha)})`; ctx.fill(); ctx.restore();
  }
  if (shade >= 0.999) { ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; place(ctx); body(ctx, { ...o, sil: sc }); ctx.restore(); }
  else if (shade > 0 || (o.alpha != null && o.alpha < 1)) {
    const m = ctx.getTransform();
    shadeCtx.setTransform(1, 0, 0, 1, 0, 0); shadeCtx.clearRect(0, 0, W, H);
    shadeCtx.setTransform(m); place(shadeCtx); body(shadeCtx, o);
    if (shade > 0) {
      shadeCtx.setTransform(1, 0, 0, 1, 0, 0); shadeCtx.globalCompositeOperation = 'source-atop';
      shadeCtx.fillStyle = sc; shadeCtx.globalAlpha = shade; shadeCtx.fillRect(0, 0, W, H);
      shadeCtx.globalAlpha = 1; shadeCtx.globalCompositeOperation = 'source-over';
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha; ctx.drawImage(shadeBuf, 0, 0); ctx.restore();
  } else { ctx.save(); place(ctx); body(ctx, o); ctx.restore(); }
  if (o.eye == null || o.eye > 0) { ctx.save(); if (o.alpha != null) ctx.globalAlpha *= o.alpha; place(ctx); eyes(ctx, o); ctx.restore(); }
  if (o.rim) { // moonlight rim
    ctx.save(); place(ctx); glow(ctx, 0, -380, 420, '#6f8fb8', o.rim * 0.25); ctx.restore();
  }
}

// ---------- PRIEST (side, facing right) ----------
function drawPriest(ctx, x, y, s, t, o = {}) {
  const walk = Math.sin(t * Math.PI * 2 / (o.period || 1.1));
  ctx.save(); ctx.translate(x, y + Math.abs(walk) * -6 * s); ctx.scale(s, s);
  const sil = o.sil, c = col => sil || col, lw = sil ? 0 : 6;
  ellipse(ctx, 0, 6 - Math.abs(walk) * -6, 100, 16); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fill();
  // legs
  for (const k of [-1, 1]) {
    ctx.save(); ctx.translate(0, -170); ctx.rotate(walk * 0.35 * k);
    rrect(ctx, -18, 0, 36, 160, 10); fillStroke(ctx, c('#1b1a20'), lw);
    rrect(ctx, -20, 140, 62, 30, 10); fillStroke(ctx, c('#0b0b0e'), lw); ctx.restore();
  }
  // robe (yellow taoist)
  ctx.beginPath(); ctx.moveTo(-55, -420); ctx.lineTo(45, -420); ctx.quadraticCurveTo(80, -260, 85 + walk * 10, -120);
  ctx.lineTo(-90 + walk * 8, -120); ctx.quadraticCurveTo(-75, -260, -55, -420); ctx.closePath();
  fillStroke(ctx, c('#b7862c'), lw);
  if (!sil) {
    ctx.fillStyle = '#7a4f17'; ctx.fillRect(-70, -290, 140, 22); // sash
    ctx.strokeStyle = '#e8c565'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-5, -350, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -376); ctx.bezierCurveTo(20, -360, -30, -340, -5, -324); ctx.stroke();
  }
  // back arm holds lantern pole
  ctx.save(); ctx.translate(-20, -395); ctx.rotate(0.9 + walk * 0.05);
  rrect(ctx, -14, 0, 28, 130, 12); fillStroke(ctx, c('#9b7124'), lw); ctx.restore();
  // head
  ellipse(ctx, 5, -470, 46, 54); fillStroke(ctx, c('#d7b08a'), lw);
  if (!sil) { ctx.fillStyle = '#1a1a1a'; ellipse(ctx, 30, -478, 5, 6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -430); ctx.quadraticCurveTo(30, -400, 15, -380); ctx.lineTo(0, -430); ctx.fillStyle = '#d8d8d8'; ctx.fill(); } // beard
  // conical straw hat
  ctx.beginPath(); ctx.moveTo(-110, -488); ctx.quadraticCurveTo(5, -600, 120, -488); ctx.quadraticCurveTo(5, -470, -110, -488); ctx.closePath();
  fillStroke(ctx, c('#9a7a45'), lw);
  if (!sil) { ctx.strokeStyle = '#6d5229'; ctx.lineWidth = 3; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(5, -560); ctx.lineTo(5 + i * 32, -484); ctx.stroke(); } }
  // front arm raised with bell
  const ring = o.ring || 0;
  ctx.save(); ctx.translate(25, -395); ctx.rotate(-2.0 + Math.sin(ring) * 0.15);
  rrect(ctx, -15, -10, 30, 120, 12); fillStroke(ctx, c('#b7862c'), lw);
  ctx.translate(0, 120); ellipse(ctx, 0, 0, 18, 18); fillStroke(ctx, c('#d7b08a'), lw);
  ctx.rotate(2.0 + Math.sin(ring) * 0.5);
  // bell (hanging below hand)
  ctx.translate(0, 14); rrect(ctx, -5, 0, 10, 26, 4); fillStroke(ctx, c('#6b4a1a'), sil ? 0 : 3);
  ctx.beginPath(); ctx.moveTo(-22, 66); ctx.quadraticCurveTo(-22, 26, 0, 24); ctx.quadraticCurveTo(22, 26, 22, 66); ctx.closePath();
  fillStroke(ctx, c('#c99a32'), sil ? 0 : 4);
  if (!sil && o.ringGlow) glow(ctx, 0, 50, 90, '#ffd27a', o.ringGlow * 0.5);
  ctx.restore();
  ctx.restore();
}

// ---------- generic villager (side, facing right) ----------
function drawPerson(ctx, x, y, s, o = {}) {
  const ph = o.phase || 0, run = o.run || 0, sil = o.sil, c = col => sil || col, lw = sil ? 0 : 5;
  const sw = Math.sin(ph) * (0.25 + run * 0.6);
  ctx.save(); ctx.translate(x, y - Math.abs(Math.sin(ph)) * run * 18 * s); ctx.scale(s * (o.flip ? -1 : 1), s);
  if (!o.noShadow) { ellipse(ctx, 0, 4, 80, 13); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); }
  ctx.rotate(run * 0.18);
  for (const k of [-1, 1]) { ctx.save(); ctx.translate(0, -160); ctx.rotate(sw * k); rrect(ctx, -15, 0, 30, 158, 10); fillStroke(ctx, c(k < 0 ? '#16171d' : '#24252d'), lw); ctx.restore(); }
  ctx.save(); ctx.translate(0, -330); ctx.rotate(-sw * 1.2); rrect(ctx, -13, 0, 26, 120, 12); fillStroke(ctx, c(o.coat2 || '#2b2a33'), lw); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-45, -345); ctx.lineTo(40, -345); ctx.lineTo(55, -150); ctx.lineTo(-58, -150); ctx.closePath(); fillStroke(ctx, c(o.coat || '#3a3b46'), lw);
  ctx.save(); ctx.translate(0, -330); ctx.rotate(sw * 1.2); rrect(ctx, -13, 0, 26, 120, 12); fillStroke(ctx, c(o.coat || '#3a3b46'), lw); ctx.restore();
  ellipse(ctx, 5, -390, 40, 46); fillStroke(ctx, c('#d2a985'), lw);
  if (!sil) { ellipse(ctx, 26 + (o.look || 0) * 6, -398, 4.5, 5.5); ctx.fillStyle = '#111'; ctx.fill();
    ctx.beginPath(); ctx.arc(5, -400, 42, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = '#121216'; ctx.fill(); }
  if (o.lantern) { // hand lantern
    ctx.save(); ctx.translate(55, -230);
    ctx.strokeStyle = c('#2a1a10'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, 0); ctx.stroke();
    drawLantern(ctx, 0, 0, 0.7, ph, sil); ctx.restore();
  }
  ctx.restore();
}

// ---------- lantern ----------
function drawLantern(ctx, x, y, s, t = 0, sil, glowA = 1, white = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.3) * 0.06); ctx.scale(s, s);
  if (!sil && glowA > 0) glow(ctx, 0, 40, 200, white ? '#e8e2c8' : '#ff8a3c', 0.55 * glowA * (0.9 + 0.1 * Math.sin(t * 7)));
  ctx.strokeStyle = '#1a0d08'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 6); ctx.stroke();
  rrect(ctx, -18, 4, 36, 10, 3); fillStroke(ctx, sil || '#2a1a10', 3);
  ellipse(ctx, 0, 40, 34, 30); fillStroke(ctx, sil || (white ? '#e8e3d2' : '#d8432a'), 4);
  if (!sil) { ctx.strokeStyle = white ? '#b9b39f' : '#9e2516'; ctx.lineWidth = 2.5; for (const k of [-16, 0, 16]) { ctx.beginPath(); ctx.ellipse(0, 40, Math.abs(k) ? 18 : 2, 30, 0, 0, Math.PI * 2); ctx.stroke(); }
    if (white) { ctx.fillStyle = '#222'; ctx.font = '24px sans-serif'; } }
  rrect(ctx, -18, 66, 36, 10, 3); fillStroke(ctx, sil || '#2a1a10', 3);
  ctx.strokeStyle = sil || '#c9302c'; ctx.lineWidth = 4; for (const k of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(k, 76); ctx.lineTo(k, 100); ctx.stroke(); }
  ctx.restore();
}

// ---------- house with curved roof ----------
function drawHouse(ctx, x, y, w, h, o = {}) {
  // (x,y) = bottom-centre
  const roofH = o.roofH || h * 0.45, ov = o.overhang || w * 0.14, t = o.t || 0;
  const wall = o.wall || '#3b4656', roof = o.roof || '#151a24', lw = o.lw == null ? 5 : o.lw;
  ctx.save(); ctx.translate(x, y);
  // wall
  ctx.beginPath(); ctx.rect(-w / 2, -h, w, h); fillStroke(ctx, wall, lw);
  if (o.wallShade !== false) { const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h, w, h); }
  // door / windows
  const lit = o.lit;
  if (o.door !== false) {
    const dw = w * 0.22, dh = h * 0.62;
    ctx.beginPath(); ctx.rect(-dw / 2, -dh, dw, dh); fillStroke(ctx, o.doorColor || '#2a1d16', lw * 0.8);
    if (o.doorLit) { glow(ctx, 0, -dh / 2, dh, '#ffb050', o.doorLit * 0.6); ctx.fillStyle = rgba('#ffb050', o.doorLit * 0.8); ctx.fillRect(-dw / 2 + 4, -dh + 4, dw - 8, dh - 8); }
  }
  for (const s of (o.windows || [-1, 1])) {
    const wx = s * w * 0.3, ww = w * 0.16, wh = h * 0.3, wy = -h * 0.72;
    ctx.beginPath(); ctx.rect(wx - ww / 2, wy, ww, wh);
    const on = lit ? (0.75 + 0.25 * Math.sin(t * 3 + s * 2)) : 0;
    fillStroke(ctx, on ? rgba('#ffc46a', on) : '#1a1f29', lw * 0.7);
    if (on) glow(ctx, wx, wy + wh / 2, ww * 1.8, '#ff9d3c', 0.45 * on);
    ctx.strokeStyle = 'rgba(30,20,12,0.85)'; ctx.lineWidth = 3;
    for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(wx - ww / 2 + k * ww / 3, wy); ctx.lineTo(wx - ww / 2 + k * ww / 3, wy + wh); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy + wh / 2); ctx.lineTo(wx + ww / 2, wy + wh / 2); ctx.stroke();
  }
  // roof with upturned eaves
  const L = -w / 2 - ov, R = w / 2 + ov, top = -h - roofH, base = -h + 6;
  ctx.beginPath(); ctx.moveTo(L - ov * 0.3, base - roofH * 0.42);
  ctx.quadraticCurveTo(L + ov * 0.8, base - roofH * 0.05, -w * 0.25, top + roofH * 0.25);
  ctx.lineTo(-w * 0.32, top); ctx.lineTo(w * 0.32, top); ctx.lineTo(w * 0.25, top + roofH * 0.25);
  ctx.quadraticCurveTo(R - ov * 0.8, base - roofH * 0.05, R + ov * 0.3, base - roofH * 0.42);
  ctx.quadraticCurveTo(R - ov * 0.2, base + 4, R - ov * 0.6, base + 4);
  ctx.lineTo(L + ov * 0.6, base + 4); ctx.quadraticCurveTo(L + ov * 0.2, base + 4, L - ov * 0.3, base - roofH * 0.42);
  ctx.closePath(); fillStroke(ctx, roof, lw);
  // tile lines
  ctx.save(); ctx.clip(); ctx.strokeStyle = o.tile || 'rgba(110,130,160,0.22)'; ctx.lineWidth = 3;
  for (let k = -w * 0.6; k <= w * 0.6; k += 22) { ctx.beginPath(); ctx.moveTo(k * 0.55, top); ctx.lineTo(k * 1.05, base); ctx.stroke(); }
  ctx.restore();
  // ridge
  ctx.beginPath(); ctx.rect(-w * 0.36, top - 12, w * 0.72, 14); fillStroke(ctx, roof, lw * 0.8);
  if (o.moonEdge) { ctx.strokeStyle = rgba('#9fb6d6', o.moonEdge); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.36, top - 12); ctx.lineTo(w * 0.36, top - 12); ctx.stroke(); }
  if (o.lanterns) for (const s of [-1, 1]) drawLantern(ctx, s * (w / 2 + ov * 0.2), base + 10, o.lanternScale || 0.9, t + s, null, o.lanternGlow == null ? 1 : o.lanternGlow);
  ctx.restore();
}

// ---------- scenery ----------
function ridgePath(seed, x0, x1, baseY, amp, rough = 1, step = 12) {
  const p = new Path2D(); p.moveTo(x0, H * 3);
  for (let x = x0; x <= x1; x += step) {
    const y = baseY - amp * (0.55 * (noise1(x / 420, seed) + 1) / 2 + 0.3 * (noise1(x / 150, seed + 3) + 1) / 2 * rough + 0.15 * (noise1(x / 50, seed + 7) + 1) / 2 * rough);
    p.lineTo(x, y);
  }
  p.lineTo(x1, H * 3); p.closePath(); return p;
}
function drawMoon(ctx, x, y, r, o = {}) {
  glow(ctx, x, y, r * 4.5, o.halo || '#c9d6e8', 0.35 * (o.glow == null ? 1 : o.glow));
  glow(ctx, x, y, r * 2, '#eef2e0', 0.35 * (o.glow == null ? 1 : o.glow));
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, o.c1 || '#fbf8e6'); g.addColorStop(1, o.c2 || '#d9d6b8');
  ellipse(ctx, x, y, r, r); ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = 'rgba(150,150,120,0.18)';
  const rr = rng(5); for (let i = 0; i < 9; i++) { ellipse(ctx, x + (rr() - 0.5) * r * 1.3, y + (rr() - 0.5) * r * 1.3, r * (0.06 + rr() * 0.14), r * (0.05 + rr() * 0.1)); ctx.fill(); }
}
function sky(ctx, top, bottom, mid) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); if (mid) g.addColorStop(0.55, mid); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(-W * 3, -H * 3, W * 7, H * 7);
}
const starField = (() => {
  const [c, x] = mk(W * 2, H); const r = rng(99);
  for (let i = 0; i < 420; i++) { const a = r(); x.fillStyle = `rgba(220,230,255,${0.15 + a * 0.6})`; ellipse(x, r() * W * 2, r() * H * 0.7, 0.8 + a * 1.8, 0.8 + a * 1.8); x.fill(); }
  return c;
})();
function stars(ctx, ox = 0, a = 1, t = 0) { ctx.save(); ctx.globalAlpha = a * (0.85 + 0.15 * Math.sin(t * 2)); ctx.drawImage(starField, -W / 2 + ox, 0); ctx.restore(); }

function mist(ctx, t, y, a = 0.25, color = '#8fa3bd', spread = 1, seed = 1) {
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const r = rng(seed * 31 + i);
    const x = ((r() * W * 2.2 + t * (12 + r() * 25) * spread) % (W * 2.4)) - W * 0.7;
    const yy = y + (r() - 0.5) * 220, rx = 360 + r() * 380, ry = 70 + r() * 80;
    ctx.save(); ctx.translate(x, yy); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();
  }
  ctx.restore();
}
// pine silhouette
function pine(ctx, x, y, h, color, seed = 1) {
  const r = rng(seed); ctx.fillStyle = color; ctx.beginPath();
  ctx.rect(x - h * 0.02, y - h * 0.25, h * 0.04, h * 0.25); ctx.fill();
  const tiers = 5 + Math.floor(r() * 3);
  for (let i = 0; i < tiers; i++) {
    const ty = y - h * 0.15 - (h * 0.85) * (i / tiers), tw = h * 0.32 * (1 - i / tiers) + h * 0.05;
    ctx.beginPath(); ctx.moveTo(x - tw, ty); ctx.quadraticCurveTo(x - tw * 0.3, ty - h * 0.05, x + (r() - 0.5) * 6, ty - h * 0.22);
    ctx.quadraticCurveTo(x + tw * 0.3, ty - h * 0.05, x + tw, ty); ctx.closePath(); ctx.fill();
  }
}
function bareTree(ctx, x, y, h, color, seed = 1) {
  const r = rng(seed); ctx.strokeStyle = color; ctx.lineCap = 'round';
  const br = (x, y, len, ang, w, d) => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(ang + 0.3) * len * 0.5, y + Math.sin(ang + 0.3) * len * 0.5, x2, y2); ctx.stroke();
    if (d > 0) { const n = 2 + (r() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) br(x2, y2, len * (0.6 + r() * 0.2), ang + (r() - 0.5) * 1.3, w * 0.62, d - 1); }
  };
  br(x, y, h * 0.35, -Math.PI / 2 + (r() - 0.5) * 0.2, h * 0.06, 5);
}
function grave(ctx, x, y, s, color = '#1c222c', edge = '#4a5668') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-50, -110); ctx.quadraticCurveTo(0, -150, 50, -110); ctx.lineTo(50, 0); ctx.closePath();
  fillStroke(ctx, color, 4, '#05060a');
  ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, -110); ctx.quadraticCurveTo(0, -150, 50, -110); ctx.stroke();
  ctx.fillStyle = 'rgba(160,60,50,0.35)'; for (let i = 0; i < 3; i++) ctx.fillRect(-6, -100 + i * 24, 12, 14);
  ctx.restore();
}

// grain + vignette overlays
const grainFrames = Array.from({ length: 6 }, (_, k) => {
  const [c, x] = mk(540, 960); const img = x.createImageData(540, 960); const r = rng(1000 + k);
  for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
});
const vignette = (() => {
  const [c, x] = mk(W, H); const g = x.createRadialGradient(W / 2, H * 0.48, H * 0.22, W / 2, H * 0.5, H * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.78)'); x.fillStyle = g; x.fillRect(0, 0, W, H); return c;
})();

module.exports = {
  W, H, K, P, clamp, lerp, ease, easeIO, easeOut, easeIn, prog, rng, noise1, track, hop, mk, fillStroke, ellipse, rrect, glow, rgba,
  drawTalisman, drawJiangshi, jiangshiFront, jiangshiSide, drawPriest, drawPerson, drawLantern, drawHouse,
  ridgePath, drawMoon, sky, stars, mist, pine, bareTree, grave, grainFrames, vignette,
};
