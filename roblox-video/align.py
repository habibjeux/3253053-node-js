"""Align a voice-over recording with its text, keeping the recording untouched.
Text is split into phrases (at punctuation); phrases are assigned to the speech
islands of the recording by dynamic programming on expected duration.
Usage: python3 align.py <audio> <text> <out.json>
"""
import json, re, subprocess, sys
import numpy as np
SR = 48000
audio_path, text_path, out = sys.argv[1:4]
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", audio_path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
a = np.frombuffer(raw, dtype=np.float32)
text = open(text_path, encoding="utf-8").read().strip()
# phrases: split after , . ? ! … and around quotes
parts = re.findall(r"[^,.?!…]+[,.?!…]*\s*»?", text)
phrases = [p.strip() for p in parts if p.strip(" «»")]
# speech islands
hop = SR // 100; n = len(a) // hop
db = 20 * np.log10(np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, axis=1)) + 1e-9)
v = db > -40
isl = []; i = 0
while i < n:
    if v[i]:
        j = i
        while j < n and v[j]: j += 1
        isl.append([i, j]); i = j
    else: i += 1
m = [isl[0]]
for s, e in isl[1:]:
    if s - m[-1][1] < 18: m[-1][1] = e
    else: m.append([s, e])
isl = [(s / 100, e / 100) for s, e in m if e - s >= 4]
w = lambda p: len(re.sub(r"[«»\s]", "", p)) + 3
spoken = sum(e - s for s, e in isl); rate = spoken / sum(w(p) for p in phrases)
P, I = len(phrases), len(isl)
INF = 1e18
# dp over (phrase index, island index): each island gets >=1 consecutive phrases
cost = np.full((I + 1, P + 1), INF); back = np.zeros((I + 1, P + 1), dtype=int); cost[0, 0] = 0
for k in range(1, I + 1):
    d = isl[k - 1][1] - isl[k - 1][0]
    for j in range(k, P + 1):
        for q in range(k - 1, j):
            if cost[k - 1, q] >= INF: continue
            exp = sum(w(p) for p in phrases[q:j]) * rate
            c = ((d - exp) / (exp + 0.4)) ** 2
            # islands usually end on punctuation that marks a real pause
            if not re.search(r"[.?!…»]$", phrases[j - 1]): c += 0.15
            if cost[k - 1, q] + c < cost[k, j]: cost[k, j] = cost[k - 1, q] + c; back[k, j] = q
if cost[I, P] >= INF: sys.exit("more islands than phrases: lower the merge threshold")
res = []; j = P
for k in range(I, 0, -1):
    q = back[k, j]; res.append((k - 1, q, j)); j = q
res.reverse()
segs = []
for k, q, j in res:
    s, e = isl[k]; group = phrases[q:j]; tot = sum(w(p) for p in group); acc = 0
    for p in group:
        ps = s + (e - s) * acc / tot; acc += w(p); pe = s + (e - s) * acc / tot
        segs.append({"text": p, "start": round(ps, 3), "end": round(pe, 3)})
json.dump({"duration": len(a) / SR, "phrases": segs}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for sgm in segs: print(f"{sgm['start']:6.2f}-{sgm['end']:6.2f}  {sgm['text']}")
