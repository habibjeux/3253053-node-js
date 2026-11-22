// Bande son « 3:17 — Owen » : pluie, drone, vibrations, tonnerre, coups à la vitre (calée sur src/timeline.js).
// Sortie : out/bande_son.wav (48 kHz stéréo)
import fs from 'node:fs';
import { EV, MSGS, DURATION } from './src/timeline.js';

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

function buzz() { const b = len(0.55); for (let i = 0; i < b.length; i++) { const t = i / SR; const on = (t < 0.22 || (t > 0.3 && t < 0.52)) ? 1 : 0; b[i] = on * (Math.sin(2 * Math.PI * 140 * t) * 0.6 + Math.sin(2 * Math.PI * 280 * t) * 0.3) * (0.8 + 0.2 * Math.sin(t * 400)); } return lowpass(b, 0.2); }
function pling() { return bell(1568, 0.6, [1, 2.0, 3.0], [1, 0.3, 0.1]); }
function rain(d) { const b = highpass(Float32Array.from(len(d), noise), 0.6); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= 0.6 + 0.4 * Math.sin(t * 0.37) * Math.sin(t * 0.11 + 1); if (rnd() < 0.002) b[i] += noise() * 2; } return b; }
function thunder(d = 3.5) { const b = lowpass(Float32Array.from(len(d), noise), 0.008); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= 14 * Math.exp(-t * 1.1) * (t < 0.05 ? t / 0.05 : 1) * (0.6 + 0.4 * Math.sin(t * 9)); } return b; }
function knock() { const b = len(0.25); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * 180 * t) + 0.5 * Math.sin(2 * Math.PI * 420 * t)) * Math.exp(-t * 30) + noise() * Math.exp(-t * 80) * 0.5; } return b; }
function slap() { const b = len(0.6); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = noise() * Math.exp(-t * 40) * 1.4 + Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t * 9) + Math.sin(2 * Math.PI * 1800 * t) * 0.15 * Math.exp(-t * 6); } return b; }
function drone(f, d, att = 2) { const b = len(d); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 1.5 * t + Math.sin(t * 0.3)) + 0.3 * Math.sin(2 * Math.PI * f * 2.01 * t)) * Math.min(1, t / att, (d - t) / att); } return b; }
function breath() { const b = lowpass(Float32Array.from(len(2.6), noise), 0.05); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] *= 2.5 * Math.pow(Math.sin(Math.PI * t / 2.6), 2); } return b; }
function heartbeat2() { const b = len(0.5); for (let i = 0; i < b.length; i++) { const t = i / SR; const env = Math.exp(-t * 18) + (t > 0.18 ? 0.7 * Math.exp(-(t - 0.18) * 18) : 0); b[i] = Math.sin(2 * Math.PI * 52 * t) * env; } return b; }

// ---------- ambiance ----------
put(0, rain(DURATION), 0.12);
put(0, drone(55, 25.3, 3), 0.16);
put(25.3, drone(51.9, 10.8, 1.5), 0.18);
put(36.1, drone(49, DURATION - 36.1, 1), 0.22);
for (let t = 25.6; t < 30; t += 2.6) put(t, breath(), 0.12, 0.3);
for (let t = 39.1; t < 50.6; t += Math.max(0.45, 0.9 - (t - 39) * 0.03)) put(t, heartbeat2(), 0.35);
put(44.6, riser(3.6), 0.12);
put(48.1, bell(mtof(38), 5, [1, 2.01, 2.99], [1, 0.4, 0.2]), 0.22);

// ---------- bruitages placés ----------
for (const [t] of MSGS) { put(t - 0.05, buzz(), 0.25); put(t, pling(), 0.08); }
for (const t of EV.lightning) put(t + 0.25, thunder(), 0.5);
EV.whooshes.forEach((t) => put(t - 0.2, whoosh(0.5), 0.25));
put(EV.grab, lowpass(Float32Array.from(len(0.5), () => noise() * 0.5), 0.1), 0.25);
put(EV.ringGlint, bell(mtof(96), 1.2), 0.12);
EV.knocks.forEach((t) => put(t, knock(), 0.6));
put(EV.windowSlap + 0.05, slap(), 0.75);
put(EV.slapGlint, bell(mtof(96), 1.2), 0.12);

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
