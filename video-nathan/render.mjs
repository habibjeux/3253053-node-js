// Rendu image par image (Chromium headless + Three.js) → ffmpeg.
// Usage : node render.mjs --preview 1.5,12,30   (PNG dans out/preview)
//         node render.mjs [--from 0 --to 88] [--workers 3]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { FPS, DURATION } from './src/timeline.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/index.html`;

async function openPage(browser) {
  const page = await browser.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(URL_);
  await page.waitForFunction(() => window.IS_READY === true, null, { timeout: 120000 });
  return page;
}
const launch = () => chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });

if (args.includes('--preview')) {
  const times = (arg('--preview', '') || '1').split(',').map(Number);
  const dir = path.join(ROOT, 'out', arg('--dir', 'preview')); fs.mkdirSync(dir, { recursive: true });
  const browser = await launch(); const page = await openPage(browser);
  for (const t of times) {
    const t0 = Date.now();
    const data = await page.evaluate((t) => window.renderFrame(t, 'image/jpeg', 0.85), t);
    const f = path.join(dir, `t${String(t.toFixed(2)).padStart(6, '0')}.jpg`);
    fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
    console.log(f, Date.now() - t0, 'ms');
  }
  await browser.close(); server.close();
} else {
  const from = Number(arg('--from', 0)), to = Number(arg('--to', DURATION));
  const workers = Number(arg('--workers', 3));
  const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS);
  const per = Math.ceil((f1 - f0) / workers);
  const segs = [];
  const started = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = f0 + w * per, b = Math.min(f1, a + per);
    if (a >= b) return;
    const file = path.join(ROOT, 'out', `seg_${String(w).padStart(2, '0')}.mp4`);
    segs[w] = file;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const browser = await launch(); const page = await openPage(browser);
    for (let f = a; f < b; f++) {
      const data = await page.evaluate((t) => window.renderFrame(t, 'image/jpeg', 0.95), f / FPS);
      const buf = Buffer.from(data.split(',')[1], 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      done++;
      if (done % 60 === 0) { const el = (Date.now() - started) / 1000; console.log(`${done}/${f1 - f0} images — ${el.toFixed(0)} s — reste ~${((f1 - f0 - done) * el / done / 60).toFixed(1)} min`); }
    }
    ff.stdin.end(); await new Promise((r) => ff.on('close', r));
    await browser.close();
  }));
  server.close();
  const list = path.join(ROOT, 'out', 'segments.txt');
  fs.writeFileSync(list, segs.filter(Boolean).map((s) => `file '${s}'`).join('\n'));
  const video = path.join(ROOT, 'out', 'video_sans_son.mp4');
  await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video], { stdio: 'inherit' }).on('close', r));
  console.log('OK', video, ((Date.now() - started) / 60000).toFixed(1), 'min');
}
