"""Builds the soundtrack: processed narration + synthesized music, wind, bells and impacts.
Reads build/voice.npy, build/timing.json, build/events.json -> writes build/mix.wav
"""
import json, os, subprocess, wave
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build")
SR = 48000
rs = np.random.default_rng(7)

timing = json.load(open(os.path.join(B, "timing.json"), encoding="utf-8"))
evd = json.load(open(os.path.join(B, "events.json")))
events, cues = evd["events"], evd["cues"]
TOTAL = timing["total"]
CUT = cues["s11"]["cut"]
N = int(TOTAL * SR)
tt = np.arange(N) / SR

def wav_write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(x.shape[1] if x.ndim > 1 else 1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

def wav_read(path):
    with wave.open(path) as w:
        d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32767
        return d.reshape(-1, w.getnchannels()) if w.getnchannels() > 1 else d

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"); return signal.sosfilt(sos, x)
def lp(x, f, order=2):
    sos = signal.butter(order, f, btype="low", fs=SR, output="sos"); return signal.sosfilt(sos, x)
def hp(x, f, order=2):
    sos = signal.butter(order, f, btype="high", fs=SR, output="sos"); return signal.sosfilt(sos, x)
def env(n, a, d):  # attack (s), exp decay time-constant (s)
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def place(buf, t, x, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.41
    buf[i:i + len(x), 1] += x * gain * r * 1.41

# ---------------- narration ----------------
voice = np.load(os.path.join(B, "voice.npy"))[:N]
voice = np.pad(voice, (0, N - len(voice)))
wav_write(os.path.join(B, "voice_raw.wav"), voice)
# deeper, warmer voice: slight pitch-down (formant preserved), EQ, gentle compression
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", os.path.join(B, "voice_raw.wav"), "-af",
                ("" if timing.get("voiceSource") == "external" else "rubberband=pitch=0.88:formant=preserved,") + "highpass=f=70,equalizer=f=140:t=q:w=1:g=4,equalizer=f=3200:t=q:w=1.5:g=2,"
                "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,aresample=48000",
                "-ar", str(SR), os.path.join(B, "voice_proc.wav")], check=True)
v = wav_read(os.path.join(B, "voice_proc.wav"))
v = np.pad(v, (0, max(0, N - len(v))))[:N]
v = v / (np.max(np.abs(v)) + 1e-9) * 0.82
# small dark room reverb
ir_n = int(1.1 * SR)
ir = rs.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR / 0.32)
ir = lp(ir, 3500); ir[0] = 0; ir /= np.sqrt(np.sum(ir ** 2))
wet = signal.fftconvolve(v, ir)[:N]
voiceL = v + wet * 0.10; voiceR = v + np.roll(wet, 480) * 0.10

# ducking envelope from the voice
venv = np.abs(v); venv = lp(venv, 4)
venv = venv / (venv.max() + 1e-9)
duck = 1 - 0.68 * np.clip(venv * 4, 0, 1)

mix = np.zeros((N, 2))

# ---------------- music ----------------
music = np.zeros((N, 2))
# low drone A1 + E2 with slow beating and breathing filter
lfo = 0.5 + 0.5 * np.sin(2 * np.pi * tt / 11.0)
drone = (np.sin(2 * np.pi * 55 * tt) + 0.6 * np.sin(2 * np.pi * 55.25 * tt + 1) + 0.4 * np.sin(2 * np.pi * 82.4 * tt)
         + 0.25 * np.sin(2 * np.pi * 110.3 * tt) * lfo)
nz = lp(rs.standard_normal(N), 300) * 0.8
drone = (drone * 0.18 + nz * 0.05) * (0.6 + 0.4 * lfo)
music[:, 0] += drone; music[:, 1] += np.roll(drone, 900)
# eerie high pad (minor second shimmer) fading in/out
pad = (np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 466.2 * tt) * 0.6 + np.sin(2 * np.pi * 659.3 * tt) * 0.4)
padenv = 0.5 + 0.5 * np.sin(2 * np.pi * tt / 23.0 - 1.5)
pad = lp(pad, 1500) * 0.022 * padenv ** 2
music[:, 0] += pad; music[:, 1] += np.roll(pad, 2400)

# plucked zither (Karplus-Strong), A minor pentatonic
def pluck(freq, dur=3.0, bright=0.5):
    n = int(dur * SR); p = int(SR / freq)
    buf = rs.uniform(-1, 1, p); buf = lp(buf, 1000 + 5000 * bright, 1)
    out = np.zeros(n); idx = 0
    for i in range(n):
        out[i] = buf[idx]
        nxt = (idx + 1) % p
        buf[idx] = 0.996 * 0.5 * (buf[idx] + buf[nxt])
        idx = nxt
    return out * np.minimum(1, np.arange(n) / 40)
scale = [220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3]
tp = 2.0
pl_cache = {}
while tp < CUT - 3:
    f = scale[rs.integers(0, len(scale))]
    if f not in pl_cache: pl_cache[f] = pluck(f, 2.5, 0.4)
    place(music, tp, pl_cache[f], 0.09, rs.uniform(-0.6, 0.6))
    if rs.random() < 0.4:  # grace note
        f2 = scale[max(0, scale.index(f) - 1)]
        if f2 not in pl_cache: pl_cache[f2] = pluck(f2, 2.5, 0.4)
        place(music, tp + 0.18, pl_cache[f2], 0.06, rs.uniform(-0.6, 0.6))
    tp += rs.choice([2.4, 3.2, 4.0, 4.8])

# slow taiko heartbeat at scene starts (except the first)
def taiko(g=1.0):
    n = int(1.2 * SR); t = np.arange(n) / SR
    f = 60 + 50 * np.exp(-t * 25)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
    x += lp(rs.standard_normal(n), 400) * np.exp(-t * 30) * 0.5
    return x * g
for s in timing["scenes"][1:]:
    place(music, s["start"] - 0.05, taiko(), 0.25)
music *= duck[:, None]

# ---------------- ambience: wind bed ----------------
wn = rs.standard_normal(N)
w_lfo = 0.55 + 0.45 * np.sin(2 * np.pi * tt / 7.3) * np.sin(2 * np.pi * tt / 3.1 + 1)
wind = bp(wn, 250, 900) * w_lfo * 0.07 + lp(wn, 200) * 0.05
mix[:, 0] += wind; mix[:, 1] += np.roll(wind, 7000)

# ---------------- SFX ----------------
def bell(g=1.0):
    n = int(2.2 * SR); t = np.arange(n) / SR
    f0 = 1320 * (1 + rs.uniform(-0.01, 0.01))
    x = sum(a * np.sin(2 * np.pi * f0 * r * t + rs.uniform(0, 6)) * np.exp(-t / d)
            for r, a, d in [(1, 1, 0.9), (2.01, 0.5, 0.6), (2.76, 0.45, 0.45), (5.40, 0.25, 0.2), (8.93, 0.15, 0.08)])
    x += hp(rs.standard_normal(n), 3000) * np.exp(-t * 200) * 0.6
    return x * 0.25 * g
def thump(g=1.0):
    n = int(0.6 * SR); t = np.arange(n) / SR
    f = 40 + 70 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    x += lp(rs.standard_normal(n), 700) * np.exp(-t * 40) * 0.8   # dirt / cloth
    x += bp(rs.standard_normal(n), 1500, 4000) * np.exp(-((t - 0.02) / 0.05) ** 2) * 0.15  # robe rustle
    return x * g
def boom(g=1.0):
    n = int(3.5 * SR); t = np.arange(n) / SR
    f = 32 + 40 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    x += lp(rs.standard_normal(n), 250) * np.exp(-t * 3) * 0.7
    return x * 0.8 * g
def swell(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = bp(rs.standard_normal(n), 200, 4000) * (t / dur) ** 3
    x += np.sin(2 * np.pi * (80 + 80 * t / dur) * t) * (t / dur) ** 2 * 0.4
    return x * 0.35 * g
def gong(g=1.0):
    n = int(5 * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in [(98, 1, 2.5), (98.6, 0.7, 2.5), (196.5, 0.4, 1.5), (271, 0.35, 1.0), (412, 0.2, 0.6)])
    return x * np.minimum(1, t / 0.01) * 0.3 * g
def door(g=1.0):
    n = int(1.0 * SR); t = np.arange(n) / SR
    x = thump(1.2)[:n] if len(thump()) >= n else np.pad(thump(1.2), (0, n))[:n]
    x = x + bp(rs.standard_normal(n), 200, 900) * np.exp(-t * 25) * 0.9
    x += bp(rs.standard_normal(n), 900, 3000) * (np.exp(-((t - 0.12) / 0.03) ** 2) + np.exp(-((t - 0.2) / 0.02) ** 2)) * 0.3
    return x * g
def creak(g=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 420 + 160 * np.sin(2 * np.pi * 3 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rs.uniform(0.6, 1, n))
    x = bp(x, 300, 1800) * np.sin(np.pi * t / t[-1]) ** 2
    return x * 0.12 * g
def rip(g=1.0):
    n = int(0.7 * SR); t = np.arange(n) / SR
    crack = (rs.random(n) < 0.02) * rs.uniform(-1, 1, n)
    x = hp(rs.standard_normal(n) * 0.4 + crack * 2, 1500) * np.exp(-t * 4) * np.minimum(1, t / 0.02)
    return x * 0.5 * g
def gust(dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    x = bp(rs.standard_normal(n), 300, 2500) * e
    whistle = np.sin(2 * np.pi * np.cumsum(700 + 300 * np.sin(2 * np.pi * 0.7 * t)) / SR) * e * 0.06
    return (x * 0.35 + whistle) * g
def shriek(g=1.0):
    n = int(1.4 * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 0.8) * (1 + 0.03 * np.sin(2 * np.pi * 7 * t))
    x = np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 2) * np.minimum(1, t / 0.05)
    return bp(x, 300, 3000) * 0.18 * g
def sting(g=1.0):
    n = int(1.5 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) for f in [880, 932, 1245, 1318]) * np.exp(-t * 3) * 0.12
    return (x + boom(1)[:n]) * g

for e in events:
    t, s, typ = e["t"], e["strength"], e["type"]
    if typ == "bell": place(mix, t, bell(), 0.55 * s, rs.uniform(-0.3, 0.3))
    elif typ == "hop": place(mix, t, thump(), 0.85 * s, rs.uniform(-0.15, 0.15))
    elif typ == "boom": place(mix, t, boom(), 0.7 * s)
    elif typ == "swell": place(mix, t, swell(e.get("dur", 3)), s)
    elif typ == "gong": place(mix, t, gong(), s)
    elif typ == "door": place(mix, t, door(), 0.9 * s, 0.2)
    elif typ == "creak": place(mix, t, creak(), s, rs.uniform(-0.5, 0.5))
    elif typ == "rip": place(mix, t, rip(), s)
    elif typ == "wind": place(mix, t, gust(e.get("dur", 3)), s * 0.8, rs.uniform(-0.4, 0.4))
    elif typ == "shriek": place(mix, t, shriek(), s)
    elif typ == "sting": place(mix, t, sting(), 0.8 * s)

mix *= (0.55 + 0.45 * duck)[:, None]  # keep SFX under the voice a bit
final = mix + music * 0.7
final[:, 0] += voiceL; final[:, 1] += voiceR
# fade in, hard cut to silence at the cut to black
fi = np.clip(tt / 1.0, 0, 1)
final *= fi[:, None]
cut_i = int(CUT * SR)
final[cut_i:] = 0
final[cut_i - 240:cut_i] *= np.linspace(1, 0, 240)[:, None]
# soft limiter / normalise
peak = np.max(np.abs(final))
final = np.tanh(final / peak * 1.1) / np.tanh(1.1) * 0.93
wav_write(os.path.join(B, "mix.wav"), final)
print("mix written", final.shape, "cut at", CUT)
