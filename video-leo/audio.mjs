// Bande son synthétisée « Léo et la ville du silence » (musique + bruitages), calée sur src/timeline.js.
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

function bip() { const b = len(0.18); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = Math.sign(Math.sin(2 * Math.PI * 1800 * t)) * 0.4 * (t < 0.15 ? 1 : 0) * Math.min(1, (0.15 - t) * 200); } return b; }
function skid(d = 0.6) { const b = len(d); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += 2 * Math.PI * (2400 + Math.sin(t * 90) * 300) / SR; b[i] = (Math.sin(ph) * 0.3 + noise() * 0.4) * Math.min(1, t * 30) * (1 - t / d); } return highpass(b, 0.6); }
function sneeze() { const b = len(0.7); for (let i = 0; i < b.length; i++) { const t = i / SR; const a = t < 0.25 ? Math.sin(2 * Math.PI * (300 + t * 400) * t) * t * 2 : 0; b[i] = a * 0.4 + (t > 0.25 ? noise() * Math.exp(-(t - 0.25) * 9) : 0); } return highpass(b, 0.5); }
function clang() { return clac(); }
function waves(d) { const b = lowpass(Float32Array.from(len(d), noise), 0.02); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= 3 * (0.6 + 0.4 * Math.sin(t * 0.9)) * Math.min(1, t, d - t); } return b; }
function gull() { const b = len(0.5); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += 2 * Math.PI * (1400 - t * 1200 + Math.sin(t * 60) * 80) / SR; b[i] = Math.sin(ph) * Math.sin(Math.PI * t / 0.5) * 0.5; } return b; }
function sonar(d = 1.6) { const b = len(d); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * (180 + 60 * Math.sin(t * 6)) * t) * Math.exp(-t * 1.5) + Math.sin(2 * Math.PI * 1200 * t) * 0.2 * Math.exp(-t * 4); } return b; }

// ---------- musique ----------
const BPM = 112, beat = 60 / BPM;
// sol mineur sautillant, pizzicati « sur la pointe des pieds »
const prog = [[43, [55, 58, 62]], [48, [60, 63, 67]], [46, [58, 62, 65]], [50, [62, 66, 69]]];
function sneakySection(t0, t1, gain = 1) {
  let bar = 0;
  for (let t = t0; t < t1 - 0.01; t += beat * 4, bar++) {
    const [b, ch] = prog[bar % 4];
    for (let k = 0; k < 4; k++) put(t + k * beat, pluck(mtof(b - 12 + (k % 2 ? 7 : 0)), 0.3, 0.6), 0.22 * gain);
    [0, 1.5, 2, 3, 3.5].forEach((o, k) => put(t + o * beat, pluck(mtof(ch[k % 3] + 12), 0.25, 0.4), 0.12 * gain, k % 2 ? 0.4 : -0.4));
    if (bar % 2) put(t + beat * 2.5, bell(mtof(ch[2] + 24), 0.6), 0.05 * gain, 0.3);
  }
}
sneakySection(0, 40);
put(0, waves(40), 0.08);
for (const t of [1.5, 9, 21, 33]) put(t, gull(), 0.08, 0.5);
put(40, pad([mtof(43), mtof(50), mtof(55)], 12.2, 1.0), 0.16);
put(40, waves(12), 0.06);
for (let t = 48.2; t < 52; t += 0.75) put(t, heartbeat(), 0.35);
put(52, pad([mtof(43), mtof(46), mtof(50), mtof(53)], 19, 2.0), 0.12);
for (let t = 52; t < 71; t += beat / 2) put(t, pluck(mtof(Math.floor((t - 52) / beat) % 2 ? 86 : 79), 0.08, 0.9), 0.05, (Math.floor((t - 52) / (beat / 2)) % 2 ? 0.5 : -0.5));
sneakySection(62, 71, 0.5);
put(71, pad([mtof(42), mtof(49), mtof(54)], 12, 0.6), 0.2);
put(80, riser(3.0), 0.28);
put(83, pad([mtof(43), mtof(50), mtof(58), mtof(62)], DURATION - 83, 0.3), 0.22);
put(83, boum(), 0.9); put(83, bell(mtof(55), 3.5, [1, 2.01, 3.02, 4.1], [1, 0.6, 0.4, 0.2]), 0.3);
put(EV.endTitle, bell(mtof(67), 3, [1, 2.76, 5.4], [1, 0.4, 0.2]), 0.25);

// ---------- bruitages placés ----------
EV.boardFlash.forEach((t) => put(t, bip(), 0.15));
put(EV.bikeBrake, skid(0.6), 0.35);
put(EV.bikeBip, bip(), 0.4); put(EV.bikeBip + 0.25, ding(1760), 0.25);
put(EV.crowdLook, pop(), 0.2);
put(20.0 + 3.0, bell(mtof(96), 0.8), 0.1);
put(EV.milaSneeze - 0.3, sneeze(), 0.5); put(EV.milaSneeze + 0.4, ding(1760), 0.25); put(EV.milaSneeze + 0.2, bip(), 0.2);
put(EV.purse + 0.3, bell(mtof(55), 1.6, [1, 1.5, 2], [1, 0.5, 0.3]), 0.25);
EV.whispers.forEach((t) => put(t, highpass(Float32Array.from(len(0.6), () => noise() * 0.4), 0.85), 0.15));
EV.waves.forEach((t) => put(t, sonar(1.8), 0.3));
EV.whooshes.forEach((t) => put(t - 0.25, whoosh(0.55), 0.45));
put(EV.bigScreen, bell(mtof(84), 1.2), 0.15);
for (let t = EV.billsStart; t < 83; t += 0.05 + rnd() * 0.08) put(t, highpass(Float32Array.from(len(0.05), () => noise() * 0.5), 0.7), 0.05, rnd() * 0.6);
EV.safeCounter.forEach((t, k) => { put(t, bell(2093 + k * 300, 1.0), 0.25); put(t, pop(), 0.2); });
put(EV.photo, shutter(), 0.6);
put(EV.doorSlam + 0.3, clang(), 0.75);
put(EV.vaneOn, hiss(0.35), 0.3);
put(EV.glassesGlint, bell(mtof(96), 0.8), 0.12);
put(EV.rumble - 0.2, rumble(3.2), 0.6);
put(EV.liftOff, rumble(4.5), 0.55); put(EV.liftOff + 0.2, hiss(4.0), 0.25);

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
