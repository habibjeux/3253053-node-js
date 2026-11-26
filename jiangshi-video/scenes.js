// The eleven scenes. Each scene draws a full 1080x1920 frame for global time t.
const L = require('./lib');
const { W, H, P, clamp, lerp, ease, easeIO, easeOut, easeIn, prog, rng, noise1, track, hop, mk, ellipse, rrect, glow, rgba, fillStroke } = L;
const { createCanvas, Path2D } = require('@napi-rs/canvas');

// ---------- helpers ----------
function camT(ctx, cx, cy, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); }
function withCam(ctx, cam, p, fn) {
  const [cx, cy, z] = cam;
  ctx.save(); camT(ctx, W / 2 + (cx - W / 2) * p, H / 2 + (cy - H / 2) * p, 1 + (z - 1) * p); fn(); ctx.restore();
}
const pool = [mk(W, H), mk(W, H), mk(W, H)];
let poolDepth = 0;
// draw fn into an offscreen layer and composite with alpha
function layer(ctx, alpha, fn) {
  if (alpha <= 0.001) return;
  if (alpha >= 0.999) { fn(ctx); return; }
  const [c, x] = pool[poolDepth++];
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, W, H); fn(x);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(c, 0, 0); ctx.restore();
  poolDepth--;
}
function particles(ctx, t, n, seed, color, area = [0, 0, W, H], size = 3, speed = 20, a = 0.6) {
  const r = rng(seed); ctx.save();
  for (let i = 0; i < n; i++) {
    const x0 = r() * area[2], y0 = r() * area[3], ph = r() * 10, sp = speed * (0.5 + r());
    const x = area[0] + ((x0 + Math.sin(t * 0.4 + ph) * 30 + t * sp * 0.3) % area[2] + area[2]) % area[2];
    const y = area[1] + ((y0 - t * sp) % area[3] + area[3]) % area[3];
    ctx.globalAlpha = a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + ph)));
    ellipse(ctx, x, y, size * (0.5 + r()), size * (0.5 + r())); ctx.fillStyle = color; ctx.fill();
  }
  ctx.restore();
}
// hop position helper: forward motion only while airborne
function hopper(t, t0, period, stride, height) {
  const h = hop(t, period, height, t0);
  if (t < t0) return { x: 0, y: 0, sq: 0, air: 0 };
  const n = Math.floor((t - t0) / period), p = ((t - t0) / period) % 1;
  const x = n * stride + (p < 0.72 ? stride * easeIO(p / 0.72) : stride);
  return { x, y: h.y, sq: h.sq, air: h.air };
}

// ---------- prebuilt scenery strips ----------
function forestStrip(seed, w, h, color, n, hMin, hMax, bare = 0) {
  const [c, x] = mk(w, h); const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const tx = r() * w, th = hMin + r() * (hMax - hMin);
    if (r() < bare) L.bareTree(x, tx, h, th, color, seed * 100 + i); else L.pine(x, tx, h, th, color, seed * 100 + i);
  }
  x.fillStyle = color; x.fillRect(0, h - 30, w, 30);
  return c;
}
const forestFar = forestStrip(3, W * 3, 700, '#14213a', 90, 260, 520);
const forestMid = forestStrip(4, W * 3, 900, '#0c1426', 45, 420, 820, 0.25);
const forestNear = forestStrip(5, W * 3, 1400, '#05080f', 10, 900, 1400, 0.4);
const ridges = {
  a: L.ridgePath(1, -W * 2, W * 4, 1150, 520, 1),
  b: L.ridgePath(2, -W * 2, W * 4, 1260, 360, 1),
  c: L.ridgePath(3, -W * 2, W * 4, 1380, 240, 0.8),
  d: L.ridgePath(9, -W * 2, W * 4, 1150, 700, 1.2),
};

function clouds(ctx, t, y, a = 0.25, color = '#5a6b86', seed = 3) {
  const r = rng(seed); ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = ((r() * W * 2 + t * (8 + r() * 10)) % (W * 2.2)) - W * 0.5, yy = y + (r() - 0.5) * 300;
    ctx.fillStyle = rgba(color, a * (0.5 + r() * 0.5));
    for (let k = 0; k < 4; k++) { ellipse(ctx, x + k * 70, yy + Math.sin(k) * 10, 120 - k * 10, 30 + (k % 2) * 10); ctx.fill(); }
  }
  ctx.restore();
}
function nightSky(ctx, t, cam, o = {}) {
  L.sky(ctx, o.top || '#060a13', o.bottom || '#1b2a42', o.mid);
  withCam(ctx, cam, 0.05, () => { L.stars(ctx, 0, o.stars == null ? 1 : o.stars, t); });
}
function road(ctx, y0, color = '#10141d') {
  ctx.fillStyle = color; ctx.fillRect(-W * 3, y0, W * 9, H * 3);
}
function cobbles(ctx, x0, x1, y, seed, color = '#1d2330', edge = '#2f3a4c') {
  const r = rng(seed);
  for (let x = x0; x < x1; x += 50 + r() * 60) {
    const yy = y + r() * 160, w = 40 + r() * 60;
    ellipse(ctx, x, yy, w, 10 + r() * 8); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.stroke();
  }
}

// =====================================================================
// SCENE 1 — dark forest, huge moon, a figure hopping in the distance
function s1(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const cam = [540 + lt * 4, lerp(1000, 960, ease(lt / d)), lerp(1.0, 1.18, easeIO(lt / d))];
  nightSky(ctx, t, cam, { top: '#04070e', bottom: '#1a2944' });
  withCam(ctx, cam, 0.1, () => { L.drawMoon(ctx, 560, 700, 210, { glow: 1.1 }); clouds(ctx, t, 600, 0.35); });
  withCam(ctx, cam, 0.25, () => { ctx.fillStyle = '#172338'; ctx.fill(ridges.a); });
  withCam(ctx, cam, 0.4, () => { ctx.drawImage(forestFar, -W, 1300 - 700); L.mist(ctx, t, 1200, 0.22, '#8ea2c2', 1, 2); });
  withCam(ctx, cam, 0.7, () => {
    ctx.drawImage(forestMid, -W, 1420 - 900);
    road(ctx, 1400, '#0a0e16');
    // path fading into the distance
    ctx.fillStyle = '#151b27'; ctx.beginPath(); ctx.moveTo(-W, 1440); ctx.quadraticCurveTo(540, 1395, W * 2, 1430); ctx.lineTo(W * 2, 1480); ctx.quadraticCurveTo(540, 1450, -W, 1500); ctx.fill();
    // distant hopping silhouette
    const hp = hopper(t, cu.s1.hopStart, cu.s1.hopPeriod, 95, 95);
    const x = -40 + hp.x;
    glow(ctx, 540, 1420, 700, '#7f93b5', 0.25);
    L.drawJiangshi(ctx, 'side', x, 1452 + hp.y * 0.45, 0.45, { shade: 1, shadeColor: '#03050a', eye: 0.9, flare: hp.air ? 0.5 : 0, squash: hp.sq, groundY: 1452, lift: -hp.y });
    L.mist(ctx, t * 1.3, 1460, 0.18, '#7d90b0', 1.4, 4);
  });
  withCam(ctx, cam, 1.15, () => { L.pine(ctx, -40, 2150, 1500, '#03050a', 7); L.pine(ctx, 1150, 2200, 1650, '#03050a', 8); });
  particles(ctx, t, 26, 17, '#b9d1ff', [0, 400, W, 1400], 2.2, 8, 0.5);
}

// SCENE 2 — apparition in front of the moon
function s2(ctx, t, sc) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const jy = 1500, js = 1.25, faceY = jy - 505 * js;
  const z = track([[0, 0.92], [1.6, 0.98], [d, 2.25]], lt);
  const cy = track([[0, 1080], [1.6, 1080], [d, faceY + 30]], lt);
  const cam = [540, cy, z];
  nightSky(ctx, t, cam, { top: '#05080f', bottom: '#22324e' });
  withCam(ctx, cam, 0.35, () => { L.drawMoon(ctx, 540, 860, 340, { glow: 1.3 }); clouds(ctx, t * 1.5, 900, 0.3, '#3f4f6a', 8); });
  withCam(ctx, cam, 0.6, () => { ctx.fillStyle = '#0d1524'; ctx.fill(ridges.c); });
  withCam(ctx, cam, 1, () => {
    ctx.fillStyle = '#060910'; ctx.beginPath(); ctx.moveTo(-W, 1560); ctx.quadraticCurveTo(540, 1440, W * 2, 1560); ctx.lineTo(W * 2, H * 2); ctx.lineTo(-W, H * 2); ctx.fill();
    const a = easeOut(prog(lt, 0.1, 1.8));
    const rise = (1 - easeOut(prog(lt, 0.1, 1.6))) * 60;
    L.drawJiangshi(ctx, 'front', 540, jy + rise, js, {
      alpha: a, shade: lerp(1, 0.5, ease(prog(lt, 1.2, 3.5))), shadeColor: '#060a14', eye: ease(prog(lt, 1.5, 2.5)),
      talismanGlow: 0.4 + 0.3 * Math.sin(lt * 3), talismanSwing: Math.sin(lt * 1.6) * 0.4, rim: 1, groundY: jy,
    });
    L.mist(ctx, t, 1520, 0.32, '#9db0cc', 1, 7);
  });
  particles(ctx, t, 30, 21, '#d6e4ff', [0, 300, W, 1500], 2.5, 10, 0.45);
}

// SCENE 3 — description: robe, mould, nails, face
function s3(ctx, t, sc) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const l0 = sc.lines[0], l1 = sc.lines[1];
  const a0 = l0.start - sc.start, b0 = l0.end - sc.start, a1 = l1.start - sc.start, b1 = l1.end - sc.start;
  const jx = 540, jy = 1600, js = 1.55;
  const P_ = (x, y) => [jx + x * js, jy + y * js];
  const cam = track([
    [0, [540, 1080, 0.82]], [a0 + 1.0, [540, 1080, 0.82]],
    [a0 + 3.2, [...P_(0, -290), 1.75]], [b0, [...P_(25, -260), 1.9]],
    [a1 + 0.2, [...P_(-119, -250), 2.5]], [a1 + (b1 - a1) * 0.45, [...P_(119, -250), 2.5]],
    [b1 - 0.4, [...P_(0, -470), 1.35]], [d, [...P_(0, -480), 1.45]],
  ], lt);
  L.sky(ctx, '#05080f', '#151f31');
  withCam(ctx, cam, 0.3, () => {
    L.drawMoon(ctx, 260, 560, 150, { glow: 0.9 });
    // temple wall & eave behind
    ctx.fillStyle = '#121927'; ctx.fillRect(-W, 900, W * 3, 1400);
    ctx.strokeStyle = 'rgba(70,85,110,0.35)'; ctx.lineWidth = 3;
    for (let y = 940; y < 1600; y += 60) { ctx.beginPath(); ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); ctx.stroke(); for (let x = -W + ((y / 60) % 2) * 60; x < W * 2; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke(); } }
    ctx.fillStyle = '#090c14'; ctx.beginPath(); ctx.moveTo(-W, 880); ctx.lineTo(W * 2, 880); ctx.lineTo(W * 2, 930); ctx.lineTo(-W, 930); ctx.fill();
    L.drawLantern(ctx, 120, 940, 1.2, t, null, 0.9); L.drawLantern(ctx, 960, 940, 1.2, t + 2, null, 0.9);
  });
  withCam(ctx, cam, 1, () => {
    ctx.fillStyle = '#0a0d15'; ctx.fillRect(-W, jy - 40, W * 3, 1200);
    glow(ctx, jx, jy - 400, 700, '#5d7aa6', 0.22);
    const sway = Math.sin(lt * 0.9) * 0.25;
    L.drawJiangshi(ctx, 'front', jx, jy, js, { headTurn: sway * 0.4, eye: 0.7 + 0.2 * Math.sin(lt * 2), talismanSwing: Math.sin(lt * 1.3) * 0.5, shade: 0.12, shadeColor: '#0a1020' });
    // hand tremor highlight on nails during line 2
    const hn = ease(prog(lt, a1, a1 + 0.8)) * (1 - ease(prog(lt, b1 - 1.2, b1 - 0.4)));
    if (hn > 0) for (const s of [-1, 1]) glow(ctx, jx + s * 119 * js, jy - 210 * js, 150, '#c9d6ff', 0.18 * hn);
  });
  L.mist(ctx, t, 1700, 0.2, '#8fa3bd', 1, 9);
  particles(ctx, t, 30, 33, '#cfe0ff', [0, 0, W, H], 2.5, 12, 0.35);
}

// SCENE 4 — it cannot bend its knees… it hops
function s4(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const ls = sc.lines.map(l => l.start - sc.start);
  const gy = 1560, js = 1.0;
  const hp = hopper(t, cu.s4.hopStart, cu.s4.hopPeriod, 150, 130);
  const jx = 200 + hp.x;
  const z = track([[0, 2.3], [ls[1] - 0.2, 2.0], [ls[1] + 0.6, 1.4], [ls[2] - 0.1, 1.3], [ls[2] + 1.2, 0.88], [d, 0.86]], lt);
  const cy = track([[0, gy - 120], [ls[1] - 0.2, gy - 140], [ls[1] + 0.6, gy - 330], [ls[2] + 1.2, gy - 420], [d, gy - 430]], lt);
  const cam = [jx + track([[0, 0], [ls[2], 70]], lt), cy, z];
  nightSky(ctx, t, cam, { top: '#070b18', bottom: '#24365a', mid: '#152443' });
  withCam(ctx, cam, 0.08, () => {
    // crescent moon
    L.drawMoon(ctx, 820, 520, 70, { glow: 0.8 });
    ctx.fillStyle = '#152443'; ellipse(ctx, 850, 505, 66, 66); ctx.fill();
  });
  withCam(ctx, cam, 0.2, () => { ctx.fillStyle = '#122039'; ctx.fill(ridges.b); });
  withCam(ctx, cam, 0.55, () => {
    for (let i = 0; i < 7; i++) L.drawHouse(ctx, -500 + i * 520, 1330, 380, 260, { lit: i % 2 === 0, t: t + i, wall: '#2e3a4e', roof: '#111725', moonEdge: 0.5, lanterns: i % 3 === 1, lw: 4 });
    L.mist(ctx, t, 1330, 0.2, '#8ea2c2', 1, 12);
  });
  withCam(ctx, cam, 1, () => {
    road(ctx, gy - 140, '#161c28');
    cobbles(ctx, -600, 4000, gy - 120, 44, '#1f2635', '#323d52');
    L.drawJiangshi(ctx, 'side', jx, gy + hp.y, js, { eye: 0.7, flare: hp.air ? Math.sin(hp.air * Math.PI) * 0.8 : 0, squash: hp.sq, talismanSwing: hp.air ? -1 : 0.3, groundY: gy, lift: -hp.y, shade: 0.1 });
    // dust puff at landing
    if (hp.sq > 0) { ctx.save(); ctx.globalAlpha = hp.sq * 0.5; for (const s of [-1, 1]) { ellipse(ctx, jx + s * 90, gy - 10, 60, 18); ctx.fillStyle = '#6d7891'; ctx.fill(); } ctx.restore(); }
  });
  withCam(ctx, cam, 1.3, () => { cobbles(ctx, -800, 5000, gy + 120, 71, '#0c1018', '#1b2230'); });
  particles(ctx, t, 20, 41, '#cfe0ff', [0, 0, W, H], 2, 10, 0.35);
}

// SCENE 5 — old village, families, funeral procession
function mourner(ctx, x, y, s, ph, o = {}) { L.drawPerson(ctx, x, y, s, { phase: ph, coat: '#cfcbbd', coat2: '#b9b4a4', lantern: o.lantern, ...o }); }
function s5(ctx, t, sc) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const cam = [track([[0, 330], [d, 700]], lt, ease), track([[0, 1240], [d, 1280]], lt), track([[0, 1.3], [d, 1.45]], lt)];
  nightSky(ctx, t, cam, { top: '#0a1222', bottom: '#2a3b58', mid: '#1a2944' });
  withCam(ctx, cam, 0.08, () => L.drawMoon(ctx, 760, 480, 120));
  withCam(ctx, cam, 0.2, () => { ctx.fillStyle = '#1c2b46'; ctx.fill(ridges.a); L.mist(ctx, t, 1000, 0.3, '#a9b8cf', 1, 13); });
  withCam(ctx, cam, 0.45, () => {
    for (let i = 0; i < 9; i++) L.drawHouse(ctx, -400 + i * 300, 1180, 240, 170, { lit: true, t: t + i * 0.7, wall: '#3b4659', roof: '#141a26', lw: 3, lanterns: i % 2 === 0, lanternScale: 0.6, door: i % 2 === 1 });
    L.mist(ctx, t, 1200, 0.2, '#a9b8cf', 1, 14);
  });
  withCam(ctx, cam, 1, () => {
    road(ctx, 1330, '#161b26');
    // left/right house fronts with families at doors
    L.drawHouse(ctx, -60, 1400, 420, 300, { lit: true, t, wall: '#465166', roof: '#121722', lanterns: true, doorLit: 0.8 });
    L.drawHouse(ctx, 1320, 1400, 420, 300, { lit: true, t: t + 1, wall: '#465166', roof: '#121722', lanterns: true, doorLit: 0.8 });
    const fam = [[90, 1420, 0.5, '#2f3a4d'], [160, 1425, 0.38, '#3a3346'], [1180, 1420, 0.52, '#2f3a4d'], [1250, 1426, 0.36, '#46394a'], [1120, 1424, 0.45, '#2e2a38']];
    fam.forEach(([x, y, s, c], i) => L.drawPerson(ctx, x, y, s, { phase: 0, coat: c, flip: x > 600, look: 0 }));
    // procession crossing
    const px = -500 + lt * 95;
    const step = lt * 5;
    for (let i = 0; i < 2; i++) mourner(ctx, px + 520 - i * 90, 1470, 0.42, step + i, { lantern: true, noShadow: false });
    // banner
    ctx.save(); ctx.translate(px + 600, 1300); ctx.strokeStyle = '#2b1d12'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(0, -60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(46, -55 + Math.sin(t * 3) * 6); ctx.lineTo(40, 70 + Math.sin(t * 3 + 1) * 8); ctx.lineTo(0, 60); ctx.closePath(); fillStroke(ctx, '#e8e4d6', 4); ctx.restore();
    // coffin carried by four
    const cx = px + 250, bob = Math.sin(step) * 4;
    for (const k of [-1, 1]) for (const j of [0, 1]) L.drawPerson(ctx, cx + k * 120 + j * 20, 1480 + j * 6, 0.42, { phase: step + k + j * 2, coat: '#d4d0c2', coat2: '#bdb8a8' });
    ctx.save(); ctx.translate(cx, 1325 + bob);
    rrect(ctx, -170, -40, 340, 70, [18, 30, 30, 18]); fillStroke(ctx, '#2a1412', 5);
    ctx.fillStyle = '#5a201b'; ctx.fillRect(-150, -30, 300, 10);
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-210, 30); ctx.lineTo(210, 30); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 3; i++) mourner(ctx, px + 20 - i * 110, 1475 + (i % 2) * 8, 0.42, step + 2 + i, { lantern: i === 1 });
    // white paper money drifting
    const r = rng(55);
    for (let i = 0; i < 14; i++) {
      const x0 = px + 600 - r() * 900, ph = r() * 6, tt = (lt * 0.6 + r()) % 1;
      const x = x0 + Math.sin(lt * 1.5 + ph) * 40 + tt * 120, y = 1150 + tt * 330;
      ctx.save(); ctx.translate(x, y); ctx.rotate(lt * 2 + ph); ctx.globalAlpha = 0.8 * Math.sin(tt * Math.PI); ctx.fillStyle = '#efe9d6';
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.arc(0, 0, 4, 0, Math.PI * 2, true); ctx.fill(); ctx.restore();
    }
  });
  L.mist(ctx, t * 1.2, 1650, 0.25, '#9fb0c8', 1, 15);
}

// SCENE 6 — distant villages; the priest leads the dead
function s6(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const p2 = cu.s6.p2 - sc.start;
  // part A: vast mountains
  const partA = c => {
    const cam = [track([[0, 300], [p2 + 0.6, 800]], lt, ease), track([[0, 1100], [p2 + 0.6, 900]], lt), track([[0, 1.0], [p2 + 0.6, 1.15]], lt)];
    nightSky(c, t, cam, { top: '#060b16', bottom: '#2a3d5e' });
    withCam(c, cam, 0.05, () => L.drawMoon(c, 760, 560, 110));
    withCam(c, cam, 0.2, () => { c.fillStyle = '#1d2c49'; c.fill(ridges.d); L.mist(c, t, 1000, 0.35, '#b3c2d8', 1, 21); });
    withCam(c, cam, 0.35, () => {
      c.fillStyle = '#152239'; c.fill(ridges.a);
      // tiny far village lights
      const r = rng(61); for (let i = 0; i < 9; i++) { const x = 1250 + r() * 220, y = 900 + r() * 60; glow(c, x, y, 26, '#ffae5a', 0.8); c.fillStyle = '#ffd08a'; c.fillRect(x - 2, y - 2, 4, 4); }
      L.mist(c, t * 1.2, 1150, 0.3, '#b3c2d8', 1, 22);
    });
    withCam(c, cam, 0.6, () => { c.fillStyle = '#0d1628'; c.fill(ridges.b); L.mist(c, t, 1350, 0.25, '#9fb0c8', 1, 23); });
    withCam(c, cam, 1, () => { c.fillStyle = '#070b14'; c.fill(ridges.c); });
  };
  // part B: procession on the mountain path
  const partB = c => {
    const lb = lt - p2;
    const per = cu.s6.hopPeriod;
    const leadX = 700 + lb * 110;
    const cam = [leadX - 230, 1250, track([[0, 1.3], [d - p2, 1.42]], lb)];
    nightSky(c, t, cam, { top: '#060b16', bottom: '#2a3d5e' });
    withCam(c, cam, 0.06, () => L.drawMoon(c, 820, 540, 150));
    withCam(c, cam, 0.25, () => { c.fillStyle = '#18263f'; c.fill(ridges.d); L.mist(c, t, 1050, 0.3, '#b3c2d8', 1, 24); });
    withCam(c, cam, 0.5, () => { c.fillStyle = '#0f1a2e'; c.fill(ridges.b); c.drawImage(forestFar, -W, 1420 - 700); });
    withCam(c, cam, 1, () => {
      road(c, 1440, '#0b1019');
      c.fillStyle = '#141b28'; c.fillRect(-W * 2, 1430, W * 9, 60);
      const bellEv = (t - (cu.s6.p2 + 0.3)) % 1.0, ringGlow = t > cu.s6.p2 + 0.3 ? Math.exp(-bellEv * 5) : 0;
      // three jiangshi, one after another (back to front)
      for (let k = 2; k >= 0; k--) {
        const t0 = cu.s6.p2 + k * 0.33;
        const h = hop(t, per, 80, t0);
        const jx = leadX - 330 - k * 260;
        L.drawJiangshi(c, 'side', jx, 1470 + h.y, 0.62, { eye: 0.7, flare: h.air ? Math.sin(h.air * Math.PI) * 0.7 : 0, squash: h.sq, groundY: 1470, lift: -h.y, shade: 0.2 + k * 0.08, shadeColor: '#0a1020', talismanSwing: h.air ? -1 : 0 });
      }
      L.drawPriest(c, leadX, 1480, 0.62, lb, { ring: lt * 9, ringGlow });
      // lantern on a pole carried by priest
      c.strokeStyle = '#2a1a10'; c.lineWidth = 5; c.beginPath(); c.moveTo(leadX - 40, 1240); c.lineTo(leadX - 110, 1160); c.stroke();
      L.drawLantern(c, leadX - 110, 1160, 0.6, t, null, 1, true);
    });
    L.mist(c, t * 1.3, 1600, 0.22, '#9fb0c8', 1.3, 25);
  };
  const mixB = ease(prog(lt, p2 - 0.3, p2 + 0.4));
  if (mixB < 1) partA(ctx);
  if (mixB > 0) layer(ctx, mixB, partB);
}

function bellCloseup(c, x, y, s, swing, ringGlow, ph) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // sound rings
  for (let k = 0; k < 3; k++) { const r = 200 + ((ph + k / 3) % 1) * 600; c.strokeStyle = `rgba(255,214,140,${0.35 * (1 - ((ph + k / 3) % 1))})`; c.lineWidth = 6; ellipse(c, 0, 330, r, r * 0.9); c.stroke(); }
  // sleeve + hand holding the handle (from top)
  c.beginPath(); c.moveTo(-170, -700); c.lineTo(170, -700); c.lineTo(120, -120); c.lineTo(-120, -120); c.closePath(); fillStroke(c, '#b7862c', 8);
  c.fillStyle = '#7a4f17'; c.fillRect(-140, -200, 280, 30);
  c.beginPath(); c.moveTo(-90, -140); c.quadraticCurveTo(-110, 10, -50, 40); c.lineTo(60, 40); c.quadraticCurveTo(110, 0, 90, -140); c.closePath(); fillStroke(c, '#d7b08a', 8);
  for (let f = 0; f < 4; f++) { rrect(c, -60 + f * 30, -10, 28, 70, 14); fillStroke(c, '#d7b08a', 6); }
  c.rotate(swing);
  rrect(c, -16, 40, 32, 140, 10); fillStroke(c, '#6b4a1a', 7);
  c.beginPath(); c.moveTo(-150, 470); c.quadraticCurveTo(-150, 180, 0, 170); c.quadraticCurveTo(150, 180, 150, 470); c.closePath();
  const g = c.createLinearGradient(-150, 0, 150, 0); g.addColorStop(0, '#7a5a18'); g.addColorStop(0.4, '#e0b54a'); g.addColorStop(1, '#8a6620');
  fillStroke(c, g, 8);
  c.strokeStyle = '#5a3f10'; c.lineWidth = 6; for (const yy of [260, 330, 420]) { c.beginPath(); c.moveTo(-140, yy); c.quadraticCurveTo(0, yy + 14, 140, yy); c.stroke(); }
  rrect(c, -165, 450, 330, 34, 14); fillStroke(c, '#c99a32', 7);
  c.save(); c.rotate(-swing * 1.8); ellipse(c, 0, 520, 26, 26); fillStroke(c, '#3a2a10', 6); c.restore();
  glow(c, 0, 330, 520, '#ffd27a', ringGlow * 0.45);
  c.restore();
}

// SCENE 7 — the warning: bell, running villager, door, silhouette at the window
function s7(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const l1 = sc.lines[1].start - sc.start, run = cu.s7.run - sc.start, slam = cu.s7.slam - sc.start, look = cu.s7.look - sc.start;
  const partA = c => { // close-up on the bell
    const cam = [540, 960, track([[0, 1.0], [l1, 1.2]], lt)];
    L.sky(c, '#04060c', '#121a2a');
    withCam(c, cam, 0.3, () => { L.drawMoon(c, 820, 420, 160, { glow: 0.7 }); L.mist(c, t, 1300, 0.25, '#7d90b0', 1, 31); });
    withCam(c, cam, 1, () => {
      const ph = ((lt - 0.1) % 0.42) / 0.42, ringGlow = Math.exp(-ph * 4);
      bellCloseup(c, 540, 820, 1.0, Math.sin(lt * Math.PI * 2 / 0.42) * 0.35, ringGlow, ph);
    });
  };
  const partB = c => { // street: villager hears, runs, door slams
    const lb = lt - l1;
    const cam = [track([[0, 560], [run - l1, 560], [slam - l1, 760]], lb), 1220, track([[0, 1.25], [slam - l1, 1.4]], lb)];
    nightSky(c, t, cam, { top: '#070b15', bottom: '#253554' });
    withCam(c, cam, 0.1, () => L.drawMoon(c, 260, 560, 100));
    withCam(c, cam, 0.4, () => { for (let i = 0; i < 6; i++) L.drawHouse(c, -300 + i * 330, 1200, 260, 180, { lit: i % 2 === 0, t: t + i, wall: '#2c3648', roof: '#10151f', lw: 3 }); L.mist(c, t, 1200, 0.2, '#8ea2c2', 1, 32); });
    withCam(c, cam, 1, () => {
      road(c, 1380, '#141a25'); cobbles(c, -400, 2000, 1400, 51);
      // house with door on the right
      const hx = 900; const doorOpen = 1 - easeIn(prog(lb, slam - l1 - 0.25, slam - l1));
      L.drawHouse(c, hx, 1420, 460, 330, { lit: true, t, wall: '#3c475c', roof: '#121722', door: false, lanterns: true });
      const dw = 100, dh = 205, dx = hx - dw / 2, dyy = 1420 - dh;
      c.fillStyle = '#ffb45a'; c.fillRect(dx, dyy, dw, dh); glow(c, hx, 1420 - dh / 2, 260, '#ff9a3c', 0.5 * doorOpen);
      // two door leaves
      const leaf = dw / 2 * (1 - doorOpen * 0.9);
      c.beginPath(); c.rect(dx, dyy, leaf, dh); fillStroke(c, '#3a2417', 4); c.beginPath(); c.rect(dx + dw - leaf, dyy, leaf, dh); fillStroke(c, '#3a2417', 4);
      // villager
      const heard = ease(prog(lb, 0.4, 1.0));
      const rp = clamp((lb - (run - l1)) / (slam - run - 0.35));
      const vx = lerp(380, hx - 20, easeIn(rp) * 0.4 + rp * 0.6);
      const inside = lb > slam - l1 - 0.3;
      if (!inside) L.drawPerson(c, vx, 1460, 0.75, { phase: lb * 14, run: rp > 0 ? 1 : 0, flip: rp <= 0 && heard > 0.5, coat: '#4a4f62', look: heard, lantern: rp <= 0 });
      if (rp <= 0 && heard > 0.3) { c.save(); c.globalAlpha = heard * 0.9; c.fillStyle = '#e8e0c8'; c.font = 'bold 90px sans-serif'; c.fillText('!', vx - 15, 1460 - 360); c.restore(); }
    });
  };
  const partC = c => { // indoors: silhouette passing behind the paper window
    const lc = lt - look;
    const cam = [540, 900, track([[0, 1.0], [d - look, 1.15]], lc)];
    L.sky(c, '#07090e', '#0d1118');
    withCam(c, cam, 1, () => {
      // wooden wall
      c.fillStyle = '#17120f'; c.fillRect(-W, -H, W * 3, H * 3);
      c.strokeStyle = 'rgba(60,40,28,0.6)'; c.lineWidth = 4; for (let x = -W; x < W * 2; x += 90) { c.beginPath(); c.moveTo(x, -H); c.lineTo(x, H * 2); c.stroke(); }
      // window with paper lattice lit by moon
      const wx = 190, wy = 520, ww = 700, wh = 620;
      c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip();
      const g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, '#6f86a8'); g.addColorStop(1, '#3d4f6c'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
      // silhouette hopping across, seen through the paper
      const per = 0.95, h = hopper(t, cu.s7.slam + 0.9 - 0.72 * per, per, 150, 70);
      const sx = -140 + h.x;
      L.drawJiangshi(c, 'side', sx + 60, wy + wh + 120 + h.y, 1.15, { shade: 1, shadeColor: 'rgba(10,14,24,0.85)', eye: 0, noShadow: true, flare: h.air ? 0.6 : 0, squash: h.sq });
      c.restore();
      glow(c, wx + ww / 2, wy + wh / 2, 700, '#8fb0e0', 0.25);
      c.strokeStyle = '#2a1c13'; c.lineWidth = 16; c.strokeRect(wx, wy, ww, wh);
      c.lineWidth = 9; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(wx + k * ww / 5, wy); c.lineTo(wx + k * ww / 5, wy + wh); c.stroke(); }
      for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(wx, wy + k * wh / 4); c.lineTo(wx + ww, wy + k * wh / 4); c.stroke(); }
      // the villager hiding below the window (back view), trembling
      const tr = Math.sin(t * 40) * 3;
      c.save(); c.translate(540 + tr, 1760);
      ellipse(c, 0, -330, 150, 220); fillStroke(c, '#0c0b0e', 0);
      ellipse(c, 0, -600, 85, 95); fillStroke(c, '#0c0b0e', 0);
      c.restore();
      // floor + moonlight patch
      c.fillStyle = '#0d0a08'; c.fillRect(-W, 1500, W * 3, H);
      c.save(); c.globalAlpha = 0.35; c.fillStyle = '#7d94b8'; c.beginPath(); c.moveTo(wx + 100, 1520); c.lineTo(wx + ww + 120, 1520); c.lineTo(wx + ww + 300, 1900); c.lineTo(wx - 60, 1900); c.fill(); c.restore();
    });
  };
  const mB = ease(prog(lt, l1 - 0.3, l1 + 0.3)), mC = ease(prog(lt, look - 0.35, look + 0.15));
  if (mB < 1) partA(ctx);
  if (mB > 0 && mC < 1) layer(ctx, mB, partB);
  if (mC > 0) layer(ctx, mC, partC);
}

// SCENE 8 — bodies on bamboo poles; not all the dead made it home
function bambooCarry(ctx, x, y, s, t, k) {
  const step = t * 6 + k;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const span = 520, bounce = Math.sin(step * 2) * 14, sag = 28 + Math.sin(step * 2 + 1.2) * 22;
  L.drawPerson(ctx, span / 2, 0, 1, { phase: step, coat: '#3b3a42' });
  // pole on shoulders
  const y0 = -330 + bounce;
  ctx.strokeStyle = '#a58a4a'; ctx.lineWidth = 14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-span / 2 - 40, y0); ctx.quadraticCurveTo(0, y0 + sag * 2, span / 2 + 40, y0); ctx.stroke();
  ctx.strokeStyle = '#6e5a2c'; ctx.lineWidth = 3; for (let i = -4; i <= 4; i++) { const xx = i * 60; ctx.beginPath(); ctx.moveTo(xx, y0 + sag * (1 - (xx / (span / 2 + 40)) ** 2) - 7); ctx.lineTo(xx, y0 + sag * (1 - (xx / (span / 2 + 40)) ** 2) + 7); ctx.stroke(); }
  // wrapped body hanging below
  const by = y0 + sag + 30;
  ctx.save(); ctx.translate(0, by); ctx.rotate(Math.sin(step * 2 + 2) * 0.04);
  rrect(ctx, -210, 0, 420, 80, 40); fillStroke(ctx, '#8d8670', 5);
  ctx.strokeStyle = '#4f4a3a'; ctx.lineWidth = 6; for (const xx of [-150, -60, 40, 130]) { ctx.beginPath(); ctx.moveTo(xx, -30); ctx.lineTo(xx, 80); ctx.stroke(); }
  ctx.restore();
  L.drawPerson(ctx, -span / 2, 0, 1, { phase: step + Math.PI, coat: '#34333b' });
  L.drawLantern(ctx, span / 2 + 40, y0 + 5, 0.9, t + k, null, 1, true);
  ctx.restore();
}
function s8(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start, p2 = cu.s8.p2 - sc.start;
  const cam = [track([[0, 330], [p2 - 0.2, 650], [p2 + 2.5, 2100], [d, 2180]], lt), track([[0, 1330], [p2 - 0.2, 1330], [p2 + 2.5, 1250], [d, 1230]], lt), track([[0, 1.4], [p2, 1.45], [p2 + 2.5, 1.15], [d, 1.25]], lt)];
  nightSky(ctx, t, cam, { top: '#060a13', bottom: '#25344f' });
  withCam(ctx, cam, 0.06, () => L.drawMoon(ctx, 900, 520, 130));
  withCam(ctx, cam, 0.25, () => { ctx.fillStyle = '#17243c'; ctx.fill(ridges.a); L.mist(ctx, t, 1100, 0.3, '#a9b8cf', 1, 41); });
  withCam(ctx, cam, 0.55, () => { ctx.drawImage(forestFar, -W, 1380 - 700); });
  withCam(ctx, cam, 1, () => {
    road(ctx, 1450, '#0d121b');
    ctx.fillStyle = '#151c29'; ctx.fillRect(-W * 2, 1440, W * 9, 70);
    // porters walking left→right, slowly receding
    const px = 160 + lt * 70;
    bambooCarry(ctx, px, 1540, 0.62, t, 0);
    bambooCarry(ctx, px - 460, 1520, 0.55, t, 2);
    // lonely abandoned grave further along the road
    const gx = 2250;
    L.bareTree(ctx, gx + 240, 1470, 900, '#05070c', 77);
    ctx.fillStyle = '#121822'; ctx.beginPath(); ctx.ellipse(gx - 40, 1480, 230, 70, 0, Math.PI, 0); ctx.fill();
    ctx.save(); ctx.translate(gx - 40, 1430); ctx.rotate(-0.18); L.grave(ctx, 0, 0, 1.0, '#1a212d'); ctx.restore();
    // wrapped body left on the ground
    rrect(ctx, gx - 300, 1450, 250, 52, 26); fillStroke(ctx, '#5e5a4c', 4);
    L.drawLantern(ctx, gx + 120, 1380, 0.8, t, null, 0.15 + 0.15 * Math.abs(Math.sin(t * 9)) * (noise1(t * 3) > 0.2 ? 1 : 0.2), true);
  });
  L.mist(ctx, t * 1.2, 1620, 0.28, '#9fb0c8', 1, 42);
  particles(ctx, t, 18, 43, '#cfe0ff', [0, 0, W, H], 2, 8, 0.3);
}

// SCENE 9 — the awakened corpse in a dark room
function s9(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const wake = cu.s9.wake - sc.start, blind = cu.s9.blind - sc.start, sense = cu.s9.sense - sc.start;
  const per = 1.15, nh = Math.max(0, Math.floor((lt - sense - 0.03) / per) + (lt > sense ? 1 : 0));
  const h = hop(t, per, 70, cu.s9.sense + 0.75 - 0.72 * per);
  const approach = clamp((lt - sense) / (d - sense));
  const js = 1.25 + approach * 0.55, jy = 1580 + approach * 230;
  const cam = [540, track([[0, 1050], [wake, 950], [blind, 900], [d, 950]], lt), track([[0, 0.95], [wake, 1.15], [blind, 1.25], [sense, 1.15], [d, 1.25]], lt)];
  L.sky(ctx, '#050608', '#0b0d12');
  withCam(ctx, cam, 0.9, () => {
    ctx.fillStyle = '#120f0d'; ctx.fillRect(-W, -H, W * 3, H * 3);
    ctx.strokeStyle = 'rgba(50,36,26,0.7)'; ctx.lineWidth = 5; for (let x = -W; x < W * 2; x += 110) { ctx.beginPath(); ctx.moveTo(x, -H); ctx.lineTo(x, 1500); ctx.stroke(); }
    // small lattice window, moonlight shaft
    const wx = 120, wy = 420, ww = 260, wh = 300;
    ctx.fillStyle = '#4b6286'; ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#1e140e'; ctx.lineWidth = 10; ctx.strokeRect(wx, wy, ww, wh);
    ctx.lineWidth = 6; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(wx + k * ww / 4, wy); ctx.lineTo(wx + k * ww / 4, wy + wh); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx, wy + k * wh / 4); ctx.lineTo(wx + ww, wy + k * wh / 4); ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(wx, wy, 900, 1700); g.addColorStop(0, 'rgba(110,140,190,0.28)'); g.addColorStop(1, 'rgba(110,140,190,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + ww, wy); ctx.lineTo(1200, 1700); ctx.lineTo(420, 1800); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#0b0907'; ctx.fillRect(-W, 1500, W * 3, H * 2);
    // candle on the right (the presence it senses)
    const cx = 930, cyy = 1430; const fl = 0.8 + 0.2 * noise1(t * 8, 3);
    rrect(ctx, cx - 14, cyy - 80, 28, 80, 4); fillStroke(ctx, '#d9d1b8', 3);
    glow(ctx, cx, cyy - 100, 260 * fl, '#ff9a40', 0.55 * fl);
    ctx.beginPath(); ctx.ellipse(cx + noise1(t * 6) * 3, cyy - 98, 8, 18 * fl, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffd890'; ctx.fill();
  });
  withCam(ctx, cam, 1, () => {
    const awake = ease(prog(lt, wake - 0.1, wake + 0.3));
    const jitter = awake * (lt < blind ? Math.sin(t * 60) * 4 * (1 - prog(lt, wake, wake + 1.5)) : 0);
    const turn = lt < blind ? 0 : lt < sense ? Math.sin((lt - blind) * 1.4) * 0.9 : lerp(Math.sin((sense - blind) * 1.4) * 0.9, 0.7, ease(prog(lt, sense, sense + 1)));
    const jx = 540 + approach * 120;
    L.drawJiangshi(ctx, 'front', jx + jitter, jy + h.y * (lt > sense ? 1 : 0), js, {
      eye: lerp(0, 1, awake), headTurn: turn, mouth: awake * 0.6, squash: lt > sense ? h.sq : 0, groundY: jy, lift: -h.y,
      shade: lerp(0.65, 0.35, awake), shadeColor: '#07090f', talismanSwing: Math.sin(lt * 2) * 0.4, rim: 0.6,
    });
  });
  // blindness: heavy dark blur-ish vignette during line 2
  const bl = ease(prog(lt, blind - 0.2, blind + 0.6)) * (1 - ease(prog(lt, sense - 0.3, sense + 0.5)));
  if (bl > 0) { ctx.save(); ctx.globalAlpha = 0.5 * bl; ctx.drawImage(L.vignette, -200, -300, W + 400, H + 600); ctx.drawImage(L.vignette, 0, 0); ctx.restore(); }
  particles(ctx, t, 40, 51, '#c9d6f0', [0, 300, W, 1400], 2, 6, 0.4);
}

// SCENE 10 — the talisman, the gust, the release
function s10(ctx, t, sc, cu) {
  const lt = t - sc.start, d = sc.end - sc.start;
  const gust = cu.s10.gust - sc.start, rip = cu.s10.rip - sc.start, free = cu.s10.free - sc.start;
  const js = 3.0, jy = 950 + 505 * js;
  const z = track([[0, 1.05], [gust, 1.35], [free, 1.15], [d, 1.0]], lt);
  const cam = [540, track([[0, 940], [gust, 880], [d, 960]], lt), z];
  L.sky(ctx, '#05070d', '#141c2c');
  withCam(ctx, cam, 0.2, () => { L.drawMoon(ctx, 880, 300, 160, { glow: 0.7 }); clouds(ctx, t * (lt > gust ? 6 : 1), 400, 0.3, '#3f4f6a', 13); });
  const wind = ease(prog(lt, gust, gust + 0.6)) * (1 - 0.6 * ease(prog(lt, free + 0.5, d)));
  withCam(ctx, cam, 1, () => {
    const frozen = lt < gust;
    const isFree = lt >= free;
    const det = clamp((lt - rip) / 1.0);
    const flutter = frozen ? Math.sin(lt * 0.8) * 0.15 : Math.sin(lt * 25) * (0.6 + wind * 1.4);
    const jerk = isFree ? Math.exp(-(lt - free) * 6) : 0;
    L.drawJiangshi(ctx, 'front', 540 + jerk * 30 * Math.sin(lt * 50), jy - jerk * 40, js, {
      eye: isFree ? 1 : frozen ? 0.25 : 0.4, eyeRed: isFree, mouth: isFree ? 1 : 0,
      talismanGlow: frozen ? 0.55 + 0.35 * Math.sin(lt * 3) : 0.2, talismanSwing: flutter, talismanDetach: lt >= rip ? det : 0,
      talismanGone: det >= 1, shade: 0.18, shadeColor: '#0a1020', noShadow: true, headTurn: isFree ? Math.sin((lt - free) * 3) * 0.15 : 0,
    });
  });
  // wind streaks + leaves
  if (wind > 0) {
    const r = rng(81); ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const y = r() * H, sp = 1400 + r() * 1800, len = 120 + r() * 260, x = ((r() * W * 2 + (t - cu.s10.gust) * sp) % (W * 2)) - W * 0.5;
      ctx.strokeStyle = `rgba(190,205,230,${0.25 * wind * r()})`; ctx.lineWidth = 2 + r() * 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len, y + len * 0.08); ctx.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const y = r() * H, sp = 900 + r() * 700, x = ((r() * W * 2 + (t - cu.s10.gust) * sp) % (W * 2)) - W * 0.5;
      ctx.save(); ctx.translate(x, y + Math.sin(t * 5 + i) * 40); ctx.rotate(t * 8 + i); ctx.globalAlpha = wind;
      ellipse(ctx, 0, 0, 16, 7); ctx.fillStyle = '#3c3324'; ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  // flash on release
  const fl = Math.exp(-Math.max(0, lt - free) * 9) * (lt >= free ? 1 : 0);
  if (fl > 0.01) { ctx.save(); ctx.globalAlpha = fl * 0.55; ctx.fillStyle = '#ffd9c8'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (lt >= free) { ctx.save(); ctx.globalAlpha = 0.18 * (1 - prog(lt, free, d)); ctx.fillStyle = '#5a0000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// SCENE 11 — mountain road, a light in the distance, the approach, cut
function s11(ctx, t, sc, cu) {
  const lt = t - sc.start, d = cu.s11.cut - sc.start;
  const bell = cu.s11.bell - sc.start, away = cu.s11.away - sc.start;
  const vpY = 1080;
  const z = track([[0, 1.0], [bell, 1.15], [away, 1.35], [d - 0.6, 1.9], [d, 2.4]], lt, x => x);
  const cam = [540, track([[0, 1000], [d, vpY - 40]], lt), z];
  nightSky(ctx, t, cam, { top: '#04070e', bottom: '#1f2e4a' });
  withCam(ctx, cam, 0.08, () => { L.drawMoon(ctx, 540, 560, 170, { glow: 1.1 }); clouds(ctx, t, 640, 0.3, '#45556f', 5); });
  withCam(ctx, cam, 0.25, () => { ctx.fillStyle = '#16233b'; ctx.fill(ridges.d); L.mist(ctx, t, 1000, 0.3, '#a9b8cf', 1, 61); });
  withCam(ctx, cam, 0.5, () => { ctx.fillStyle = '#0d1729'; ctx.fill(ridges.b); });
  withCam(ctx, cam, 1, () => {
    // ground + road in perspective
    ctx.fillStyle = '#070b12'; ctx.fillRect(-W * 2, vpY, W * 5, H * 2);
    ctx.fillStyle = '#1a212e'; ctx.beginPath(); ctx.moveTo(530, vpY); ctx.lineTo(550, vpY); ctx.quadraticCurveTo(760, 1400, 1500, H + 200); ctx.lineTo(-420, H + 200); ctx.quadraticCurveTo(320, 1400, 530, vpY); ctx.fill();
    // moving stones on road toward camera (perspective)
    const r = rng(91);
    for (let i = 0; i < 40; i++) {
      const u0 = r(), side = r() - 0.5, u = (u0 + lt * 0.06) % 1;
      const k = u * u; const y = vpY + k * (H + 200 - vpY), half = 10 + k * 960;
      ellipse(ctx, 540 + side * half * 1.4, y, 6 + k * 60, 2 + k * 14); ctx.fillStyle = `rgba(60,72,92,${0.25 + k * 0.5})`; ctx.fill();
    }
    // pines along the road
    for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, k = 0.25 + i * 0.12; L.pine(ctx, 540 + s * (180 + k * 900), vpY + k * 700, 400 + k * 900, '#04060b', 300 + i); }
    // the light and the silhouette in the distance
    const appear = ease(prog(lt, bell - 1.2, bell + 0.5));
    const lunge = easeIn(prog(lt, d - 0.5, d));
    const per = 1.0, h = hop(t, per, 50, cu.s11.away - 0.72 * per);
    const jsc = lerp(0.16, 0.42, ease(prog(lt, away - 1, d - 0.5))) + lunge * 1.8;
    const jy = vpY + 40 + jsc * 160;
    glow(ctx, 600, jy - 120 * jsc / 0.16 * 0.2, 120 + jsc * 200, '#ffd59a', appear * 0.7);
    L.drawLantern(ctx, 610 + jsc * 90, jy - 520 * jsc, jsc * 0.9, t, null, appear, true);
    if (appear > 0) L.drawJiangshi(ctx, 'front', 540, jy + (lt > away ? h.y * jsc : 0), jsc, { alpha: appear, shade: lerp(0.92, 0.5, lunge), shadeColor: '#03050a', eye: appear, eyeRed: lunge > 0.2, rim: 1, groundY: jy, talismanGlow: 0.3 + lunge * 0.6 });
  });
  L.mist(ctx, t * 1.4, 1500, 0.22, '#9fb0c8', 1.2, 62);
  particles(ctx, t, 20, 93, '#cfe0ff', [0, 0, W, H], 2, 10, 0.3);
}

module.exports = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7, 8: s8, 9: s9, 10: s10, 11: s11 };
