// Bande son « Soren et la tour des reflets » : nappes, crépitements de verre, bourdonnements, engrenages (calée sur src/timeline.js).
// Sortie : out/bande_son.wav (48 kHz stéréo)
import fs from 'node:fs';
import { EV, DURATION } from './src/timeline.js';

const SR = 48000;
const N = Math.ceil(DURATION * SR);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function put(t, buf, gain = 1, pan = 0) {
  const s0 = Math.floor(t * SR);
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < buf.length; i++) { const k = s0 + i; if (k < 0 || k >= N) continue; L[k] += buf[i] * gl; R[k] += buf[i] * gr; }
}
const len = (d) => new Float32Array(Math.floor(d * SR));

// ---------- instruments ----------
function pluck(freq, dur = 0.6, bright = 0.5) {
  const b = len(dur); const P = Math.max(2, Math.round(SR / freq));
  const ring = new Float32Array(P); for (let i = 0; i < P; i++) ring[i] = noise();
  let idx = 0;
  for (let i = 0; i < b.length; i++) {
    const nx = (idx + 1) % P; const v = ring[idx];
    ring[idx] = (v * bright + ring[nx] * (1 - bright)) * 0.996;
    b[i] = v; idx = nx;
  }
  for (let i = 0; i < b.length; i++) b[i] *= Math.min(1, (b.length - i) / (SR * 0.05));
  return b;
}
function bell(freq, dur = 1.2, ratios = [1, 2.76, 5.4, 8.93], amps = [1, 0.5, 0.25, 0.12]) {
  const b = len(dur);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR; let v = 0;
    ratios.forEach((r, k) => { v += Math.sin(2 * Math.PI * freq * r * t) * amps[k] * Math.exp(-t * (3 + k * 3)); });
    b[i] = v * Math.min(1, t * 400);
  }
  return b;
}
function bass(freq, dur) {
  const b = len(dur);
  for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t)) * Math.exp(-t * 3) * Math.min(1, t * 200); }
  return b;
}
function pad(freqs, dur, attack = 1.5) {
  const b = len(dur);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR; let v = 0;
    for (const f of freqs) for (const d of [-0.4, 0.4]) v += Math.sin(2 * Math.PI * (f + d) * t + Math.sin(t * 0.7) * 0.3);
    b[i] = v / freqs.length * Math.min(1, t / attack, (dur - t) / attack);
  }
  return b;
}
function lowpass(b, a) { let y = 0; for (let i = 0; i < b.length; i++) { y += a * (b[i] - y); b[i] = y; } return b; }
function highpass(b, a) { let y = 0, px = 0; for (let i = 0; i < b.length; i++) { y = a * (y + b[i] - px); px = b[i]; b[i] = y; } return b; }

// ---------- bruitages ----------
const ding = (f = 1760) => bell(f, 1.0, [1, 2.0, 3.0], [1, 0.35, 0.15]);
function boum() {
  const b = len(0.7);
  for (let i = 0; i < b.length; i++) { const t = i / SR; const f = 40 + 110 * Math.exp(-t * 18); b[i] = Math.sin(2 * Math.PI * f * t * (1 + 0)) * Math.exp(-t * 7) * 1.2; }
  const n = lowpass(Float32Array.from(len(0.25), noise), 0.08); for (let i = 0; i < n.length; i++) b[i] += n[i] * Math.exp(-i / SR * 25) * 1.5;
  return b;
}
function whoosh(d = 0.6) {
  const b = len(d); let y = 0;
  for (let i = 0; i < b.length; i++) { const u = i / b.length; const a = 0.02 + 0.25 * Math.sin(u * Math.PI); y += a * (noise() - y); b[i] = y * Math.sin(u * Math.PI) * 1.4; }
  return b;
}
function hiss(d) {
  const b = highpass(Float32Array.from(len(d), noise), 0.9);
  for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= Math.min(1, t * 4, (d - t) * 3) * (0.8 + 0.2 * Math.sin(t * 23)); }
  return b;
}
function clac() {
  const b = bell(180, 1.4, [1, 1.47, 2.09, 2.56, 3.7], [1, 0.8, 0.6, 0.5, 0.3]);
  const n = len(0.12); for (let i = 0; i < n.length; i++) b[i] += noise() * Math.exp(-i / SR * 40) * 1.5;
  const th = boum(); for (let i = 0; i < th.length; i++) b[i] += th[i] * 0.8;
  return b;
}
function shutter() { const b = len(0.18); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = noise() * (Math.exp(-t * 120) + (t > 0.08 ? Math.exp(-(t - 0.08) * 120) : 0)); } return highpass(b, 0.7); }
function rumble(d) {
  const b = lowpass(Float32Array.from(len(d), noise), 0.01);
  for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= 9 * Math.min(1, t * 2, (d - t) * 2) * (0.7 + 0.3 * Math.sin(t * 31)); }
  return b;
}
function riser(d) {
  const b = len(d); let ph = 0;
  for (let i = 0; i < b.length; i++) { const u = i / b.length; ph += 2 * Math.PI * (110 * Math.pow(4, u)) / SR; b[i] = (Math.sin(ph) * 0.5 + Math.sin(ph * 1.5) * 0.25 + noise() * 0.15 * u) * u * u; }
  return b;
}
function heartbeat() { const b = len(0.5); for (let i = 0; i < b.length; i++) { const t = i / SR; const env = Math.exp(-t * 18) + (t > 0.18 ? 0.7 * Math.exp(-(t - 0.18) * 18) : 0); b[i] = Math.sin(2 * Math.PI * 55 * t) * env; } return b; }
function pop() { const b = len(0.12); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * (500 + 1600 * t * 8) * t) * Math.exp(-t * 35); } return b; }

function crackle(d = 0.6) { const b = len(d); for (let i = 0; i < b.length; i++) { const t = i / SR; if (rnd() < 0.012 * Math.exp(-t * 3)) { for (let k = 0; k < 120 && i + k < b.length; k++) b[i + k] += noise() * Math.exp(-k / 25) * 0.9; } } for (let k = 0; k < 6; k++) { const g = bell(2400 + rnd() * 3000, 0.4, [1, 1.53, 2.7], [1, 0.5, 0.3]); for (let i = 0; i < g.length; i++) { const j = Math.floor(rnd() * SR * 0.3) + i; if (j < b.length) b[j] += g[i] * 0.12; } } return highpass(b, 0.5); }
function hum(d = 1.6) { const b = len(d); for (let i = 0; i < b.length; i++) { const t = i / SR; const env = Math.min(1, t * 3, (d - t) * 3); b[i] = (Math.sin(2 * Math.PI * 55 * t) + 0.6 * Math.sin(2 * Math.PI * 110.5 * t) + 0.3 * Math.sin(2 * Math.PI * 165 * t)) * env * (0.7 + 0.3 * Math.sin(t * 30)); } return b; }
function shimmer(d) { const b = len(d); for (let i = 0; i < b.length; i++) { const t = i / SR; let v = 0; for (const f of [1318, 1760, 1975, 2637]) v += Math.sin(2 * Math.PI * f * t + Math.sin(t * 3 + f)) * 0.25; b[i] = v * Math.min(1, t / 1.5, (d - t) / 1.5) * (0.5 + 0.5 * Math.sin(t * 1.7)); } return b; }
function gearsS(d) { const b = len(d); for (let t = 0; t < d; t += 0.42) { const c = clac(); for (let i = 0; i < c.length; i++) { const j = Math.floor(t * SR) + i; if (j < b.length) b[j] += c[i] * 0.35; } } return lowpass(b, 0.25); }
function lockS() { const b = len(0.5); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = noise() * Math.exp(-t * 60) + Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 25) * 0.6 + (t > 0.12 ? noise() * Math.exp(-(t - 0.12) * 70) * 0.8 : 0); } return b; }

// ---------- musique : nappes mystérieuses (ré mineur), pulsation, montée finale ----------
put(0, drone2(36.7, 49.0), 0.0);
function drone2(f, d) { return pad([f, f * 1.5, f * 2], d, 2); }
put(0, pad([mtof(38), mtof(45), mtof(50), mtof(53)], 49.0, 1.5), 0.13);
put(0, shimmer(49.0), 0.03);
put(49.0, pad([mtof(36), mtof(43), mtof(51)], 15.7, 1.2), 0.17);
put(64.7, pad([mtof(38), mtof(41), mtof(45), mtof(49)], 23, 1.5), 0.14);
for (let t = 52.1; t < 64.7; t += 0.85) put(t, heartbeat(), 0.3);
for (let t = 64.7; t < 87.8; t += 0.5) put(t, pluck(mtof(Math.floor((t - 64.7) / 0.5) % 2 ? 86 : 81), 0.08, 0.9), 0.05, (Math.floor((t - 64.7) / 0.5) % 2 ? 0.5 : -0.5));
put(86.5, riser(3.6), 0.25);
put(90.09, pad([mtof(37), mtof(44), mtof(49), mtof(56)], DURATION - 90.09, 0.4), 0.22);
put(90.09, boum(), 0.9); put(90.09, bell(mtof(50), 4, [1, 2.01, 3.02, 4.1], [1, 0.6, 0.4, 0.2]), 0.3);
put(93.77, shimmer(DURATION - 93.77), 0.08);
put(EV.endTitle, bell(mtof(62), 3, [1, 2.76, 5.4], [1, 0.4, 0.2]), 0.25);

// ---------- bruitages placés ----------
for (const t of [EV.ruleCrack, EV.sorenCrack]) { put(t, crackle(0.8), 0.6); put(t, bell(2800, 0.8, [1, 1.53, 2.7], [1, 0.5, 0.3]), 0.12); }
for (const t of [EV.ruleHum, EV.sorenHum]) put(t - 0.1, hum(1.6), 0.35);
put(EV.sorenSmile, bell(mtof(93), 1.2), 0.08);
for (const t of [EV.lostBoul, EV.lostVeil, EV.lostMaya]) put(t, shimmer(0.8), 0.06);
put(EV.mayaLeave, hum(3.5), 0.18);
EV.whooshes.forEach((t) => put(t - 0.2, whoosh(0.5), 0.3));
put(EV.reflectionsSlide, shimmer(5), 0.07);
put(EV.gears, gearsS(3.8), 0.6);
put(EV.climb, whoosh(1.2), 0.3);
put(EV.mayaCard, pop(), 0.15); put(EV.boulCard, pop(), 0.15);
put(EV.bigScreen, bell(mtof(84), 1.2), 0.15);
put(EV.photo, shutter(), 0.6);
put(EV.doorLock, lockS(), 0.7); put(EV.doorLock, clac(), 0.4);
put(EV.guardianTurn + 1.0, bell(mtof(96), 0.8), 0.1);
put(EV.tremble, rumble(2.4), 0.6); put(EV.tremble, clac(), 0.4);

// ---------- normalisation + WAV ----------
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const f = (i < SR * 0.02 ? i / (SR * 0.02) : 1) * (i > N - SR * 1.2 ? (N - i) / (SR * 1.2) : 1);
  buf.writeInt16LE(Math.round(Math.tanh(L[i] * g * 1.1) * 32000 * f), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] * g * 1.1) * 32000 * f), 46 + i * 4);
}
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/bande_son.wav', buf);
console.log('out/bande_son.wav', DURATION, 's, gain', g.toFixed(3));

// ---------- sous-titres SRT (guide d'enregistrement de la voix-off) ----------
import { LINES } from './src/timeline.js';
const ts = (s) => { const ms = Math.round(s * 1000); const p = (n, w = 2) => String(n).padStart(w, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
fs.writeFileSync('out/voix_off.srt', LINES.map(([a, b, txt], i) => `${i + 1}\n${ts(a)} --> ${ts(b)}\n${txt}\n`).join('\n'));
console.log('out/voix_off.srt');
