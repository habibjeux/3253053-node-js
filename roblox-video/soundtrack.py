"""Soundtrack for a part: original voice-over + synthesized music and sound effects.
Usage: python3 soundtrack.py <voice.mp3> <timing.json> <cues.json> <out.wav> <total_seconds>"""
import json, subprocess, sys, wave
import numpy as np
from scipy import signal

SR = 48000
voice_path, timing_path, cues_path, out, total = sys.argv[1:6]
N = int(float(total) * SR); tt = np.arange(N) / SR
rs = np.random.default_rng(11)
T = json.load(open(timing_path, encoding="utf-8")); P = T["phrases"]
cues = json.load(open(cues_path))

def lp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b, o=2): return signal.sosfilt(signal.butter(o, [a, b], "band", fs=SR, output="sos"), x)
def place(buf, t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i < 0: return
    x = x[: len(buf) - i]; l, r = np.cos((pan + 1) * np.pi / 4) * 1.41, np.sin((pan + 1) * np.pi / 4) * 1.41
    buf[i:i + len(x), 0] += x * g * l; buf[i:i + len(x), 1] += x * g * r

# ---- voice ----
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", voice_path, "-af", "highpass=f=70,acompressor=threshold=-18dB:ratio=2.5:attack=5:release=100",
                      "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
v = np.frombuffer(raw, dtype=np.float32).copy(); v = v / (np.abs(v).max() + 1e-9) * 0.85
v = np.pad(v, (0, max(0, N - len(v))))[:N]
env = lp(np.abs(v), 4); env /= env.max() + 1e-9
duck = 1 - 0.65 * np.clip(env * 4, 0, 1)

# ---- sounds ----
def boom(g=1):
    n = int(2.5 * SR); t = np.arange(n) / SR; f = 34 + 60 * np.exp(-t * 7)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) + lp(rs.standard_normal(n), 300) * np.exp(-t * 4) * 0.6
    return x * 0.8 * g
def hit(g=1):  # punch
    n = int(0.6 * SR); t = np.arange(n) / SR; f = 60 + 140 * np.exp(-t * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) + bp(rs.standard_normal(n), 500, 5000) * np.exp(-t * 30) * 0.9
    return np.tanh(x * 2) * 0.6 * g
def whoosh(dur=0.6, g=1):
    n = int(dur * SR); t = np.arange(n) / SR; e = np.sin(np.pi * t / dur) ** 2
    return bp(rs.standard_normal(n), 400, 3500) * e * 0.5 * g
def swell(dur=2.5, g=1):
    n = int(dur * SR); t = np.arange(n) / SR
    return (bp(rs.standard_normal(n), 200, 3000) * (t / dur) ** 3 * 0.4 + np.sin(2 * np.pi * (70 + 60 * t / dur) * t) * (t / dur) ** 2 * 0.3) * g
def beep(g=1, f=1000):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, (n - np.arange(n)) / 400) * 0.18 * g
def flat(dur=1.8, g=1):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1000 * t) * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.3) * 0.12 * g
def growl(dur=2.5, g=1):
    n = int(dur * SR); t = np.arange(n) / SR; e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.7
    f = 55 + 15 * np.sin(2 * np.pi * 3 * t) + 8 * rs.standard_normal(n).cumsum() / np.sqrt(n)
    saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    x = lp(saw, 600) * (0.7 + 0.3 * np.sin(2 * np.pi * 13 * t)) + lp(rs.standard_normal(n), 400) * 0.4
    return np.tanh(x * 1.5) * e * 0.45 * g
def shatter(g=1):
    n = int(1.6 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for _ in range(70):
        i = int(rs.uniform(0, 0.9) * SR); m = int(0.08 * SR); f = rs.uniform(2500, 7000)
        seg = np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / SR * 60) * rs.uniform(0.2, 1)
        x[i:i + m] += seg[: n - i]
    x += hp(rs.standard_normal(n), 2000) * np.exp(-t * 5) * 0.5
    return x * 0.35 * g
def crash(g=1):
    n = int(1.8 * SR); t = np.arange(n) / SR
    x = lp(rs.standard_normal(n), 900) * np.exp(-t * 4) + boom(1)[:n] * 0.6
    for _ in range(25):
        i = int(rs.uniform(0.05, 1.2) * SR); m = int(0.05 * SR); x[i:i + m] += bp(rs.standard_normal(m), 300, 2000)[: n - i] * np.exp(-np.arange(m) / SR * 50)[: n - i] * 0.5
    return np.tanh(x * 1.5) * 0.6 * g
def shimmer(dur=2.0, g=1):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in [1318, 1568, 1760, 2093, 2637]: x += np.sin(2 * np.pi * f * t + rs.uniform(0, 6)) * np.exp(-t * 1.5) * (0.5 + 0.5 * np.sin(2 * np.pi * 6 * t + f))
    return x * 0.05 * g
def step(g=1):
    n = int(0.15 * SR); t = np.arange(n) / SR
    return lp(rs.standard_normal(n), 800) * np.exp(-t * 40) * 0.3 * g

SFX = dict(boom=boom, hit=hit, whoosh=lambda g=1: whoosh(0.6, g), swell=lambda g=1: swell(2.5, g), beep=beep, flat=flat, growl=growl,
           shatter=shatter, crash=crash, shimmer=shimmer, step=step)
fx = np.zeros((N, 2))
for c in cues:
    place(fx, c["t"], SFX[c["type"]](c.get("g", 1)), 1.0, c.get("pan", 0))

# ---- music: dark drone + pulse + pentatonic plucks ----
mu = np.zeros((N, 2))
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * tt / 9)
drone = np.sin(2 * np.pi * 49 * tt) + 0.6 * np.sin(2 * np.pi * 49.3 * tt + 1) + 0.35 * np.sin(2 * np.pi * 73.4 * tt) * lfo
mu += (drone * 0.14)[:, None]
pad = lp(np.sin(2 * np.pi * 392 * tt) + 0.6 * np.sin(2 * np.pi * 415.3 * tt), 1200) * 0.02 * (0.5 + 0.5 * np.sin(2 * np.pi * tt / 17)) ** 2
mu[:, 0] += pad; mu[:, 1] += np.roll(pad, 3000)
def pluck(freq, dur=2.0):
    n = int(dur * SR); p = int(SR / freq); buf = lp(rs.uniform(-1, 1, p), 3000, 1); out_ = np.zeros(n); i = 0
    for k in range(n):
        out_[k] = buf[i]; j = (i + 1) % p; buf[i] = 0.995 * 0.5 * (buf[i] + buf[j]); i = j
    return out_
notes = [196.0, 233.1, 261.6, 293.7, 349.2, 392.0, 466.2]
cache = {}
bpm = 96; beat = 60 / bpm
t = 0.0; k = 0
pattern = [0, 3, 5, 2, 4, 1, 6, 3]
while t < float(total) - 2:
    f = notes[pattern[k % len(pattern)]]
    if f not in cache: cache[f] = pluck(f)
    place(mu, t, cache[f], 0.07, 0.4 * np.sin(k))
    t += beat * 2; k += 1
# heartbeat-like kick on every beat during the action (from the 'action' cue onward)
act = next((c["t"] for c in cues if c["type"] == "boom" and c.get("action")), None)
def kick():
    n = int(0.4 * SR); t_ = np.arange(n) / SR; f = 45 + 80 * np.exp(-t_ * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t_ * 9) * 0.5
if act:
    t = act
    while t < float(total) - 1.5: place(mu, t, kick(), 0.6); place(mu, t + beat * 0.4, kick(), 0.35); t += beat * 2
mu *= duck[:, None]

mix = fx * (0.6 + 0.4 * duck)[:, None] + mu * 0.75
mix[:, 0] += v; mix[:, 1] += v
fade = np.clip((float(total) - tt) / 1.0, 0, 1); mix *= fade[:, None]
mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.1) / np.tanh(1.1) * 0.93
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print("written", out)
