// usage: node shoot_film.js stills <story> <timing> <outdir> t1 t2 ...
//        node shoot_film.js video  <story> <timing> <out.mp4> <t0> <t1> [fps]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const serve = () => new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }); s.listen(0, () => res(s)); });
(async () => {
  const [mode, story, timing, out, ...rest] = process.argv.slice(2);
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('[err]', e.message)); page.on('console', m => { if (!/GL Driver|GPU stall/.test(m.text())) console.log('[page]', m.text()); });
  await page.goto(`http://localhost:${srv.address().port}/web/film.html?story=${story}&timing=/${timing}`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 });
  if (mode === 'stills') {
    fs.mkdirSync(out, { recursive: true });
    for (const a of rest) { await page.evaluate(t => window.frame(t), parseFloat(a)); await page.screenshot({ path: path.join(out, `s_${a}.jpg`), type: 'jpeg', quality: 85 }); }
  } else {
    const [t0, t1, fpsS] = rest; const fps = +(fpsS || 30);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const a = Math.round(+t0 * fps), b = Math.round(+t1 * fps); const st = Date.now();
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.frame(t), f / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - a) % 120 === 0) console.log(`${out}: ${f - a}/${b - a} ${((Date.now() - st) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close(); srv.close();
})();
