// Frame renderer. Usage:
//   node render.js stills t1 t2 ...          -> build/still_<t>.png
//   node render.js seg <k> <n>               -> build/seg_<k>.mp4 (k-th of n parts)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { GlobalFonts } = require('@napi-rs/canvas');
const L = require('./lib');
const SCENES = require('./scenes');
const E = require('./events');
const { W, H, clamp, ease, easeOut, mk, noise1 } = L;

GlobalFonts.registerFromPath(path.join(__dirname, 'assets/fonts/Anton-Regular.ttf'), 'Anton');
const FPS = 30;
const timing = E.load();
const { cues, events } = E.build(timing);
const scenes = timing.scenes;
const CUT = cues.s11.cut;
const TOTAL = timing.total;
const XF = 0.35; // half crossfade

// ---------- subtitles ----------
const HL = new Set(timing.highlight.filter(w => !w.includes(' ')).map(w => w.toLowerCase()));
const norm = w => w.toLowerCase().replace(/[.,!?;:«»"]/g, '').replace(/^(l|d|s|n|c|qu|j|t)'/, '');
function chunkLine(line) {
  const words = line.text.split(' ');
  const chunks = []; let cur = [];
  const len = a => a.join(' ').length;
  for (const w of words) {
    cur.push(w);
    const endPunct = /[,.!?]$/.test(w);
    if (len(cur) >= 17 || (endPunct && len(cur) >= 6) || cur.length >= 4) { chunks.push(cur); cur = []; }
  }
  if (cur.length) { if (len(cur) < 6 && chunks.length) chunks[chunks.length - 1].push(...cur); else chunks.push(cur); }
  const total = line.text.length; let acc = 0; const out = [];
  for (const c of chunks) {
    const s = line.start + (acc / total) * (line.end - line.start);
    acc += c.join(' ').length + 1;
    const e = line.start + (Math.min(acc, total) / total) * (line.end - line.start);
    out.push({ words: c, start: s, end: e });
  }
  out[out.length - 1].end = line.end + 0.25;
  return out;
}
const SUBS = scenes.flatMap(s => s.lines.flatMap(chunkLine));
function drawSubs(ctx, t) {
  const sub = SUBS.find(s => t >= s.start && t < s.end);
  if (!sub) return;
  const p = easeOut((t - sub.start) / 0.12);
  const size = 96;
  ctx.save();
  ctx.font = `${size}px Anton`;
  ctx.textBaseline = 'alphabetic';
  // layout into up to two lines of max width
  const maxW = 900, space = size * 0.28;
  const items = sub.words.map(w => ({ w, up: w.toUpperCase(), hl: HL.has(norm(w)) }));
  items.forEach(it => it.width = ctx.measureText(it.up).width);
  const lines = [[]]; let lw = 0;
  for (const it of items) { if (lw + it.width > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(it); lw += it.width + space; }
  const y0 = 1500 - (lines.length - 1) * size * 0.55;
  ctx.translate(W / 2, y0); ctx.scale(0.82 + 0.18 * p, 0.82 + 0.18 * p); ctx.globalAlpha = clamp(p * 1.5);
  lines.forEach((ln, li) => {
    const tw = ln.reduce((a, it) => a + it.width, 0) + space * (ln.length - 1);
    let x = -tw / 2; const y = li * size * 1.1;
    for (const it of ln) {
      ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      ctx.strokeText(it.up, x, y);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = it.hl ? '#ffd23a' : '#ffffff'; ctx.fillText(it.up, x, y);
      x += it.width + space;
    }
  });
  ctx.restore();
}

// ---------- camera shake from impacts ----------
const SHAKE = events.filter(e => ['hop', 'door', 'boom', 'sting'].includes(e.type));
function shake(t) {
  let a = 0;
  for (const e of SHAKE) { const dt = t - e.t; if (dt >= 0 && dt < 0.45) a += e.strength * Math.exp(-dt * 11) * (e.type === 'hop' ? 16 : 26); }
  return [noise1(t * 40, 1) * a, noise1(t * 40, 2) * a];
}

// ---------- frame ----------
const [main, ctx] = mk(W, H);
const [bufB, ctxB] = mk(W, H);
function drawScene(c, i, t) {
  const s = scenes[i];
  c.save(); const [sx, sy] = shake(t); c.translate(sx, sy);
  c.translate(-W * 0.02, -H * 0.02); c.scale(1.04, 1.04); // margin for shake
  SCENES[s.id](c, t, s, cues);
  c.restore();
}
function frame(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (t >= CUT) return main;
  let i = scenes.findIndex(s => t >= s.start && t < s.end); if (i < 0) i = scenes.length - 1;
  const s = scenes[i];
  let other = -1, mix = 0;
  if (i > 0 && t - s.start < XF) { other = i - 1; mix = 1 - ease((t - s.start + XF) / (2 * XF)); }
  else if (i < scenes.length - 1 && s.end - t < XF) { other = i + 1; mix = ease((t - (s.end - XF)) / (2 * XF)); }
  drawScene(ctx, i, t);
  if (other >= 0 && mix > 0.001) {
    ctxB.setTransform(1, 0, 0, 1, 0, 0); ctxB.clearRect(0, 0, W, H);
    drawScene(ctxB, other, t);
    ctx.save(); ctx.globalAlpha = mix; ctx.drawImage(bufB, 0, 0); ctx.restore();
  }
  // film look: vignette + grain
  ctx.drawImage(L.vignette, 0, 0);
  ctx.save(); ctx.globalAlpha = 0.07; ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(L.grainFrames[Math.floor(t * FPS) % L.grainFrames.length], 0, 0, W, H); ctx.restore();
  // fade in
  const fin = clamp(t / 1.2);
  if (fin < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - ease(fin)})`; ctx.fillRect(0, 0, W, H); }
  drawSubs(ctx, t);
  return main;
}

async function renderSegment(k, n) {
  const NF = Math.ceil(TOTAL * FPS);
  const a = Math.floor(NF * k / n), b = Math.floor(NF * (k + 1) / n);
  const out = path.join(__dirname, 'build', `seg_${k}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = a; f < b; f++) {
    const buf = frame(f / FPS).data();
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - a) % 150 === 0) console.log(`[seg ${k}] ${f - a}/${b - a} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`[seg ${k}] done`);
}

const [mode, ...args] = process.argv.slice(2);
if (mode === 'stills') {
  for (const a of args) { const t = parseFloat(a); fs.writeFileSync(path.join(__dirname, 'build', `still_${a}.png`), frame(t).toBuffer('image/png')); }
} else if (mode === 'seg') {
  renderSegment(+args[0], +args[1]);
} else {
  console.log('usage: node render.js stills <t...> | seg <k> <n>');
}
