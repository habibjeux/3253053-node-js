// Bande son « La boucle » : musique de fête foraine, cliquetis de montée, maillet, crash, explosion (calée sur src/timeline.js).
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

function clicks(d) { const b = len(d); for (let t = 0; t < d; t += 0.11) { const s = Math.floor(t * SR); for (let i = 0; i < 400 && s + i < b.length; i++) b[s + i] += noise() * Math.exp(-i / 60) * 0.8 + Math.sin(i * 0.3) * Math.exp(-i / 90) * 0.4; } return highpass(b, 0.6); }
function bang() { const b = len(0.5); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = noise() * Math.exp(-t * 40) + Math.sin(2 * Math.PI * 520 * t) * Math.exp(-t * 18) * 0.7 + Math.sin(2 * Math.PI * 1310 * t) * Math.exp(-t * 22) * 0.4; } return b; }
function crush() { const b = len(0.8); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = noise() * Math.exp(-t * 9) * (0.6 + 0.4 * Math.sin(t * 300)) + Math.sin(2 * Math.PI * (90 - t * 50) * t) * Math.exp(-t * 6); } return lowpass(b, 0.35); }
function wind(d) { const b = lowpass(Float32Array.from(len(d), noise), 0.03); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= 6 * Math.min(1, t * 2, (d - t) * 2) * (0.6 + 0.4 * Math.sin(t * 2.3)); } return b; }
function explosion() { const b = len(5); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = noise() * Math.exp(-t * 1.2) * 1.4; } const l = lowpass(b, 0.02); const th = boum(); for (let i = 0; i < th.length; i++) l[i] += th[i] * 2; return l; }
function skid2(d = 1.0) { const b = len(d); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += 2 * Math.PI * (1800 + Math.sin(t * 70) * 250) / SR; b[i] = (Math.sin(ph) * 0.3 + noise() * 0.4) * Math.min(1, t * 20) * (1 - t / d); } return highpass(b, 0.6); }
function laugh() { const b = len(1.3); for (let k = 0; k < 4; k++) { const s0 = Math.floor(k * 0.28 * SR); for (let i = 0; i < 0.2 * SR; i++) { const t = i / SR; b[s0 + i] += Math.sin(2 * Math.PI * (220 - k * 12) * t + Math.sin(t * 60) * 2) * Math.sin(Math.PI * t / 0.2) * 0.5 + noise() * 0.1 * Math.sin(Math.PI * t / 0.2); } } return b; }

// ---------- musique : orgue de foire en do majeur (jour), mystérieuse (nuit), tension (descente), explication (calme) ----------
const BPM = 128, beat = 60 / BPM;
const prog = [[48, [60, 64, 67]], [53, [60, 65, 69]], [55, [59, 62, 67]], [48, [60, 64, 67]]];
function fair(t0, t1, gain = 1) { let bar = 0; for (let t = t0; t < t1 - 0.01; t += beat * 4, bar++) { const [b, ch] = prog[bar % 4]; put(t, bass(mtof(b - 12), beat * 0.9), 0.25 * gain); put(t + beat * 2, bass(mtof(b - 5), beat * 0.9), 0.2 * gain); for (let k = 0; k < 8; k++) { const tt = t + k * beat / 2; if (tt < t1) put(tt, pluck(mtof(ch[k % 3] + 12 + (k > 3 ? 12 : 0)), 0.25, 0.5), 0.1 * gain, k % 2 ? 0.3 : -0.3); } } }
fair(0, 12.04);
put(12.04, pad([mtof(45), mtof(52), mtof(57)], 21.6, 1.0), 0.14);
for (let t = 25.65; t < 33.6; t += beat) put(t, pluck(mtof(Math.floor((t - 25.65) / beat) % 2 ? 57 : 52), 0.2, 0.7), 0.12);
fair(33.65, 39.8, 0.8);
put(39.82, riser(9.4), 0.18);
put(49.26, pad([mtof(48), mtof(55), mtof(60), mtof(64)], 21.3, 1.5), 0.12);
for (let t = 49.26; t < 70.5; t += beat) put(t, pluck(mtof([72, 76, 79, 76][Math.floor((t - 49.26) / beat) % 4]), 0.15, 0.8), 0.05);
fair(70.53, 75.0, 0.8);
put(75.0, pad([mtof(48), mtof(55), mtof(64)], DURATION - 75, 0.5), 0.18);

// ---------- bruitages placés ----------
put(EV.wallet + 0.4, bell(mtof(55), 1.2, [1, 1.5, 2], [1, 0.5, 0.3]), 0.2);
for (let t = EV.rivalBuild + 0.6; t < 11.6; t += 0.32) put(t, bang(), 0.12, (rnd() - 0.5));
put(12.4, clicks(1.6), 0.25); put(EV.crush, crush(), 0.7);
EV.hammer.forEach((t) => put(t, bang(), 0.55));
put(EV.question, pop(), 0.2);
put(EV.rivalLaugh, laugh(), 0.45);
EV.tighten.forEach((t) => put(t, bang(), 0.35, 0.3));
put(EV.twig, crush(), 0.3);
put(EV.ride, clicks(4.3), 0.3);
put(EV.crest, whoosh(0.8), 0.3); put(EV.tooLate, wind(2), 0.35);
put(EV.slowCar, wind(3.5), 0.08);
put(EV.fastCar, wind(1.8), 0.25); put(EV.roll - 0.3, skid2(0.8), 0.35); put(EV.roll, crush(), 0.6);
put(EV.diagCrushed, crush(), 0.3);
EV.whooshes.forEach((t) => put(t - 0.2, whoosh(0.5), 0.3));
put(EV.safeLoop, wind(2.4), 0.3);
put(EV.rivalDrop, wind(2.0), 0.3);
put(EV.boom, explosion(), 0.9);
put(EV.endTitle, bell(mtof(72), 2.5, [1, 2.76, 5.4], [1, 0.4, 0.2]), 0.2);

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
