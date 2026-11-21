// Bande son synthétisée (musique + bruitages), calée sur src/timeline.js.
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

// ---------- musique ----------
const BPM = 104, beat = 60 / BPM;
// D mineur, progression Dm – Bb – Gm – A
const prog = [[50, [62, 65, 69]], [46, [58, 62, 65]], [43, [55, 58, 62]], [45, [57, 61, 64]]];
function playfulSection(t0, t1, gain = 1) {
  let bar = 0;
  for (let t = t0; t < t1 - 0.01; t += beat * 4, bar++) {
    const [b, ch] = prog[bar % 4];
    put(t, bass(mtof(b - 12), beat * 1.8), 0.32 * gain);
    put(t + beat * 2, bass(mtof(b - 12), beat * 1.8), 0.26 * gain);
    const arp = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]];
    arp.forEach((n, k) => { const tt = t + k * beat / 2; if (tt < t1) put(tt, pluck(mtof(n), 0.5, 0.45), 0.13 * gain, (k % 2 ? 0.35 : -0.35)); });
    if (bar % 2 === 1) put(t + beat * 3.5, bell(mtof(ch[2] + 24), 0.8), 0.05 * gain, 0.4);
  }
}
playfulSection(0, 40);
// nuit : drone + battements de cœur + trémolo
put(40, pad([mtof(38), mtof(45), mtof(50)], 12.2, 1.0), 0.16);
for (let t = 40.3; t < 52; t += 0.9) put(t, heartbeat(), 0.35);
for (let t = 44; t < 52; t += 0.125) put(t, bell(mtof(t < 48 ? 74 : 77), 0.12, [1, 2], [1, 0.3]), 0.025, Math.sin(t * 3) * 0.5);
// intérieur : tic-tac mystérieux + nappe
put(52, pad([mtof(50), mtof(53), mtof(57), mtof(61)], 18.6, 2.0), 0.12);
for (let t = 52; t < 70.6; t += beat / 2) put(t, pluck(mtof(Math.floor((t - 52) / beat) % 2 ? 86 : 81), 0.08, 0.9), 0.06, (Math.floor((t - 52) / (beat / 2)) % 2 ? 0.5 : -0.5));
playfulSection(62.6, 70.6, 0.55);
// piège : nappe grave + riser vers la révélation
put(70.6, pad([mtof(37), mtof(44), mtof(49)], 11.4, 0.6), 0.2);
put(78.8, riser(3.0), 0.25);
put(81.8, pad([mtof(38), mtof(45), mtof(53), mtof(57)], DURATION - 81.8, 0.3), 0.22);
put(81.8, boum(), 0.9); put(81.8, bell(mtof(50), 3.5, [1, 2.01, 3.02, 4.1], [1, 0.6, 0.4, 0.2]), 0.3);
put(EV.endTitle, bell(mtof(62), 3, [1, 2.76, 5.4], [1, 0.4, 0.2]), 0.25);
put(EV.endTitle, boum(), 0.6);

// ---------- bruitages placés ----------
EV.wideDings.forEach((t) => put(t, ding(1760), 0.12, (rnd() - 0.5)));
EV.dings.forEach((t) => put(t, ding(1975), 0.3));
EV.nathanFalls.forEach((t) => { put(t, whoosh(0.3), 0.25); put(t + 0.35, boum(), 0.9); put(t + 0.42, ding(1760), 0.22); });
for (const t of [EV.facteurFall, EV.boulangereFall, EV.zoeFall]) { put(t, whoosh(0.3), 0.25); put(t + 0.4, boum(), 0.75); put(t + 0.45, ding(1760), 0.2); }
put(18.5, pop(), 0.3); put(12.85, pop(), 0.25); put(23.3, pop(), 0.2); put(25.9, pop(), 0.2); put(27.9, pop(), 0.2);
put(31.1, bell(mtof(55), 1.6, [1, 1.5, 2], [1, 0.5, 0.3]), 0.25); // -400 €
put(34.3, bell(mtof(81), 1.2), 0.12);
EV.whooshes.forEach((t) => put(t - 0.25, whoosh(0.55), 0.45));
put(EV.cabinPass - 0.5, rumble(3.0), 0.3);
put(EV.sprayStart, hiss(EV.sprayEnd - EV.sprayStart), 0.35);
put(EV.nathanJump, whoosh(0.4), 0.35);
for (let t = EV.coinsStart; t < 81.8; t += 0.07 + rnd() * 0.1) put(t, bell(3000 + rnd() * 2500, 0.15, [1, 1.7], [1, 0.4]), t < 67.2 ? 0.05 : 0.025, rnd() * 0.6);
EV.counter.forEach((t, k) => { put(t, bell(2093 + k * 300, 1.0), 0.25); put(t, pop(), 0.2); });
put(EV.counter[2], bell(2637, 1.5), 0.3);
put(EV.photo, shutter(), 0.6);
put(EV.doorSlam, clac(), 0.7);
put(EV.monocleGlint, bell(mtof(96), 0.8), 0.12);
put(EV.roomShake - 0.2, rumble(2.2), 0.6);

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
