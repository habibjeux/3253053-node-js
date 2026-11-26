"""Synthesise the French narration line by line with Piper and write timing.json.

Usage: python3 tts.py <voices_dir> [length_scale]
"""
import json, sys, wave, os
import numpy as np
from piper import PiperVoice, SynthesisConfig

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
os.makedirs(BUILD, exist_ok=True)

voices_dir = sys.argv[1]
length_scale = float(sys.argv[2]) if len(sys.argv) > 2 else 1.22
script = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
voice = PiperVoice.load(os.path.join(voices_dir, script["voice"] + ".onnx"))
cfg = SynthesisConfig(length_scale=length_scale, noise_scale=0.6, noise_w_scale=0.7)

SR = 48000
GAP_LINE = 0.75   # silence between lines of a scene
TAIL = 0.5       # silence after the last line of a scene before the next lead

def synth(text):
    chunks = list(voice.synthesize(text, syn_config=cfg))
    audio = np.concatenate([c.audio_float_array for c in chunks])
    sr = chunks[0].sample_rate
    # trim leading/trailing near-silence
    idx = np.where(np.abs(audio) > 0.01)[0]
    audio = audio[max(idx[0] - int(0.02 * sr), 0): idx[-1] + int(0.05 * sr)]
    # resample to 48 kHz (linear interp is fine for speech at this ratio)
    n = int(len(audio) * SR / sr)
    x = np.linspace(0, len(audio) - 1, n)
    return np.interp(x, np.arange(len(audio)), audio).astype(np.float32)

timeline = []
pieces = []
t = 0.0
for sc in script["scenes"]:
    t += sc["lead"]
    start = t - sc["lead"]
    lines = []
    for i, text in enumerate(sc["lines"]):
        a = synth(text)
        d = len(a) / SR
        lines.append({"text": text, "start": round(t, 3), "end": round(t + d, 3)})
        pieces.append((t, a))
        t += d + (GAP_LINE if i < len(sc["lines"]) - 1 else TAIL)
    timeline.append({"id": sc["id"], "start": round(start, 3), "lines": lines})

# scene end = next scene start
for i, s in enumerate(timeline):
    s["end"] = timeline[i + 1]["start"] if i + 1 < len(timeline) else round(t + 1.6, 3)
total = timeline[-1]["end"]

voice_track = np.zeros(int(total * SR) + SR, dtype=np.float32)
for st, a in pieces:
    i = int(st * SR)
    voice_track[i:i + len(a)] += a
np.save(os.path.join(BUILD, "voice.npy"), voice_track)
json.dump({"total": total, "scenes": timeline, "highlight": script["highlight"]},
          open(os.path.join(BUILD, "timing.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("total %.2fs" % total)
for s in timeline:
    print(s["id"], s["start"], s["end"])
