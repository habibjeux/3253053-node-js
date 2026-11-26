// Serves the project and drives headless Chromium. usage: node shoot.js <fnName> <out.png> [args json]
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.json': 'application/json', '.ttf': 'font/ttf' };
function serve() {
  return new Promise(res => { const s = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }); s.listen(0, () => res(s)); });
}
async function open() {
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => console.log('[err]', e.message));
  await page.goto(`http://localhost:${srv.address().port}/web/index.html`);
  await page.waitForFunction(() => window.ready === true);
  return { srv, browser, page };
}
module.exports = { open };
if (require.main === module) (async () => {
  const [fn, out, args] = process.argv.slice(2);
  const { srv, browser, page } = await open();
  const t0 = Date.now();
  await page.evaluate(([f, a]) => window[f](...(a ? JSON.parse(a) : [])), [fn, args]);
  console.log('render ms', Date.now() - t0);
  await page.screenshot({ path: out });
  await browser.close(); srv.close();
})();
