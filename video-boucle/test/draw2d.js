// Personnages « dessinés » en 2D (canvas) : grosse tête ronde, contour épais, corps fin, membres en traits.
// Rendus en panneaux plats (billboards) dans la scène 3D.

const INK = '#141414';
function lineSeg(ctx, pts, w = 9) { ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); }

// o : { body:'vest'|'overall', hair:'slick'|'cap', face:'smug'|'happy'|'scared'|'worried', pose:{...} }
export function drawStick(ctx, W, H, o) {
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, hy = 250, hr = 175;
  const pose = { armL: [[-60, 0], [-120, 120], [-80, 230]], armR: [[60, 0], [150, 70], [250, 40]], legL: [[-30, 0], [-50, 190], [-55, 330]], legR: [[30, 0], [45, 190], [55, 330]], ...(o.pose || {}) };
  const torsoTop = hy + hr - 10, torsoH = 210, torsoW = 150, hipY = torsoTop + torsoH;
  // ombre portée légère au sol (dans le dessin)
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, hipY + 345, 120, 22, 0, 0, 7); ctx.fill();
  // jambes
  for (const [k, leg] of [[-1, pose.legL], [1, pose.legR]]) {
    const pts = leg.map(([x, y]) => [cx + x, hipY + y]); lineSeg(ctx, pts, 10);
    const [fx, fy] = pts[pts.length - 1]; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(fx + k * 18, fy + 6, 34, 15, 0, 0, 7); ctx.fill();
  }
  // bras arrière
  const shoulder = (s) => [cx + s * (torsoW / 2 - 8), torsoTop + 40];
  lineSeg(ctx, pose.armL.map(([x, y], i) => i === 0 ? shoulder(-1) : [cx + x, torsoTop + 40 + y]), 10);
  // torse
  ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  const rr = (x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke(); };
  if (o.body === 'vest') {
    rr(cx - torsoW / 2, torsoTop, torsoW, torsoH, 34, '#f4f1ea');
    ctx.fillStyle = '#d8c7a0'; ctx.beginPath(); ctx.moveTo(cx - torsoW / 2 + 4, torsoTop + 20); ctx.lineTo(cx - 14, torsoTop + 110); ctx.lineTo(cx - 14, torsoTop + torsoH - 4); ctx.lineTo(cx - torsoW / 2 + 4, torsoTop + torsoH - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + torsoW / 2 - 4, torsoTop + 20); ctx.lineTo(cx + 14, torsoTop + 110); ctx.lineTo(cx + 14, torsoTop + torsoH - 4); ctx.lineTo(cx + torsoW / 2 - 4, torsoTop + torsoH - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8b400'; ctx.beginPath(); ctx.moveTo(cx - 12, torsoTop + 6); ctx.lineTo(cx + 12, torsoTop + 6); ctx.lineTo(cx + 18, torsoTop + 120); ctx.lineTo(cx, torsoTop + 150); ctx.lineTo(cx - 18, torsoTop + 120); ctx.closePath(); ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = INK; for (const y of [130, 165]) { ctx.beginPath(); ctx.arc(cx - 34, torsoTop + y, 6, 0, 7); ctx.fill(); }
  } else {
    rr(cx - torsoW / 2, torsoTop, torsoW, torsoH, 34, '#ffd21f');
    rr(cx - torsoW / 2 + 6, torsoTop + 80, torsoW - 12, torsoH - 80, 24, '#3d6fd6');
    ctx.fillStyle = '#3d6fd6'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.roundRect(cx + s * 40 - 10, torsoTop + 8, 20, 80, 8); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffd21f'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * 40, torsoTop + 88, 9, 0, 7); ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); }
    ctx.lineWidth = 9; ctx.strokeRect(cx - 28, torsoTop + 120, 56, 44);
  }
  // bras avant
  lineSeg(ctx, pose.armR.map(([x, y], i) => i === 0 ? shoulder(1) : [cx + x, torsoTop + 40 + y]), 10);
  for (const arm of [pose.armL, pose.armR]) { const [x, y] = arm[arm.length - 1]; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx + x, torsoTop + 40 + y, 17, 0, 7); ctx.fill(); ctx.stroke(); }
  // tête
  ctx.fillStyle = '#ffffff'; ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(cx, hy, hr, 0, 7); ctx.fill(); ctx.stroke();
  // ombrage doux de la tête
  const g = ctx.createRadialGradient(cx - 60, hy - 70, 20, cx, hy, hr); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,130,150,.22)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, hy, hr - 7, 0, 7); ctx.fill();
  if (o.hair === 'slick') {
    ctx.fillStyle = '#17171a'; ctx.beginPath(); ctx.moveTo(cx - hr + 10, hy - 30); ctx.bezierCurveTo(cx - hr + 10, hy - hr - 50, cx + hr + 30, hy - hr - 60, cx + hr - 4, hy - 40); ctx.bezierCurveTo(cx + 80, hy - 120, cx - 40, hy - 150, cx - hr + 10, hy - 30); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - 70, hy - 150); ctx.quadraticCurveTo(cx + 10, hy - 175, cx + 90, hy - 140); ctx.stroke();
  } else if (o.hair === 'cap') {
    ctx.fillStyle = '#e53935'; ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, hy - 20, hr - 4, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + 60, hy - 40, 150, 26, -0.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  // visage
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = 'round';
  const ex = 62, ey = hy + 10;
  if (o.face === 'smug') {
    ctx.lineWidth = 12; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * ex - 34, ey - 60 - s * 14); ctx.lineTo(cx + s * ex + 34, ey - 52 + s * 10); ctx.stroke(); }
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * ex, ey, 22, 13, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + s * ex + 7, ey - 4, 5, 0, 7); ctx.fill(); ctx.fillStyle = INK; }
    ctx.lineWidth = 9; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(cx - 70, ey + 58); ctx.quadraticCurveTo(cx + 10, ey + 135, cx + 86, ey + 44); ctx.quadraticCurveTo(cx + 10, ey + 82, cx - 70, ey + 58); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 4; for (let k = 1; k < 6; k++) { const x = cx - 70 + k * 26; ctx.beginPath(); ctx.moveTo(x, ey + 62 + Math.sin(k) * 2); ctx.lineTo(x + 4, ey + 92); ctx.stroke(); }
  } else if (o.face === 'scared') {
    for (const s of [-1, 1]) { ctx.fillStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx + s * ex, ey, 30, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx + s * ex, ey, 9, 0, 7); ctx.fill(); }
    ctx.lineWidth = 9; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const x = cx - 60 + k * 15; const y = ey + 80 + (k % 2 ? -10 : 10); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  } else {
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * ex, ey, 16, 24, 0, 0, 7); ctx.fill(); }
    ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, ey + 40, 60, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
}
