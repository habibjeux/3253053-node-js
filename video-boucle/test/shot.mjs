// Rend l'image de test : node test/shot.mjs → out/test_style.png
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message)); page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${server.address().port}/test/scene.html${process.argv[2] || ''}`);
await page.waitForFunction(() => window.DONE === true, null, { timeout: 300000 });
const data = await page.evaluate(() => document.getElementById('out').toDataURL('image/png'));
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'out', 'test_style.png'), Buffer.from(data.split(',')[1], 'base64'));
console.log('out/test_style.png', ((Date.now() - t0) / 1000).toFixed(1), 's');
await browser.close(); server.close();
