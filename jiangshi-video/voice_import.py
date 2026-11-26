"""Use a recorded voice-over (e.g. ElevenLabs) instead of the Piper TTS.

Splits the recording on its pauses, aligns the pieces to the script lines
(dynamic programming on expected durations), then re-spaces them on the
video timeline and writes build/voice.npy + build/timing.json (same format as tts.py).

Usage: python3 voice_import.py <voice.mp3|wav>
"""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build"); os.makedirs(BUILD, exist_ok=True)
SR = 48000
GAP_LINE = 0.85   # pause between lines of a scene
TAIL = 0.75       # pause after the last line of a scene
END_PAD = 1.6     # black after the final line

src = sys.argv[1]
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                     check=True, capture_output=True).stdout
audio = np.frombuffer(raw, dtype=np.float32).copy()
script = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
lines = [(sc["id"], i, txt) for sc in script["scenes"] for i, txt in enumerate(sc["lines"])]

# --- speech islands (10 ms frames, -40 dBFS threshold, pauses >= 0.2 s) ---
hop = SR // 100
nfr = len(audio) // hop
rms = np.sqrt(np.mean(audio[: nfr * hop].reshape(nfr, hop) ** 2, axis=1) + 1e-12)
voiced = 20 * np.log10(rms) > -40
segs = []; i = 0
while i < nfr:
    if voiced[i]:
        j = i
        while j < nfr and voiced[j]: j += 1
        segs.append([i, j]); i = j
    else: i += 1
merged = [segs[0]]
for a, b in segs[1:]:
    if a - merged[-1][1] < 20: merged[-1][1] = b
    else: merged.append([a, b])
segs = [(a / 100, b / 100) for a, b in merged if b - a >= 5]
gaps = [segs[k + 1][0] - segs[k][1] for k in range(len(segs) - 1)]
print(f"{len(segs)} speech islands for {len(lines)} lines")
if os.environ.get("DEBUG"): print([(round(a,2),round(b,2)) for a,b in segs])

# --- align islands -> lines ---
# optional forced splits (seconds in the recording), from script.json 'voiceCuts'
CUTS = script.get("voiceCuts", [])
spoken = sum(b - a for a, b in segs)
weight = lambda t: max(len(t), 8)
rate = spoken / sum(weight(t) for _, _, t in lines)
S, Lc = len(segs), len(lines)
INF = 1e18
cost = np.full((Lc + 1, S + 1), INF); back = np.zeros((Lc + 1, S + 1), dtype=int); cost[0, 0] = 0
for l in range(1, Lc + 1):
    exp = weight(lines[l - 1][2]) * rate
    for s in range(l, S + 1):
        for p in range(l - 1, s):
            if cost[l - 1, p] >= INF: continue
            if any(segs[p][0] < x < segs[s - 1][1] for x in CUTS): continue  # forced split
            dur = segs[s - 1][1] - segs[p][0]
            c = ((dur - exp) / (exp + 0.5)) ** 2
            if s < S: c -= 0.6 * min(gaps[s - 1], 1.0)  # prefer splitting at long pauses
            if cost[l - 1, p] + c < cost[l, s]: cost[l, s] = cost[l - 1, p] + c; back[l, s] = p
bounds = []; s = S
for l in range(Lc, 0, -1):
    p = back[l, s]; bounds.append((p, s)); s = p
bounds.reverse()

# --- lay out on the video timeline ---
timeline, pieces, t = [], [], 0.0
k = 0
for sc in script["scenes"]:
    start = t; t += sc["lead"]
    out = []
    for i, txt in enumerate(sc["lines"]):
        p, s = bounds[k]; k += 1
        a = max(0, int(segs[p][0] * SR) - int(0.04 * SR)); b = min(len(audio), int(segs[s - 1][1] * SR) + int(0.08 * SR))
        clip = audio[a:b].copy(); f = int(0.01 * SR); clip[:f] *= np.linspace(0, 1, f); clip[-f:] *= np.linspace(1, 0, f)
        d = len(clip) / SR
        print(f"  s{sc['id']}.{i}  src {segs[p][0]:6.2f}-{segs[s-1][1]:6.2f}  ({d:4.1f}s)  {txt[:60]}")
        out.append({"text": txt, "start": round(t, 3), "end": round(t + d, 3)})
        pieces.append((t, clip)); t += d + (GAP_LINE if i < len(sc["lines"]) - 1 else TAIL)
    timeline.append({"id": sc["id"], "start": round(start, 3), "lines": out})
for i, s in enumerate(timeline):
    s["end"] = timeline[i + 1]["start"] if i + 1 < len(timeline) else round(t + END_PAD, 3)
total = timeline[-1]["end"]
track = np.zeros(int(total * SR) + SR, dtype=np.float32)
for st, a in pieces:
    i = int(st * SR); track[i:i + len(a)] += a
np.save(os.path.join(BUILD, "voice.npy"), track)
json.dump({"total": total, "scenes": timeline, "highlight": script["highlight"], "voiceSource": "external"},
          open(os.path.join(BUILD, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("total %.2fs" % total)
