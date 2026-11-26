"""Build an ASS subtitle file (short chunks, keywords in yellow) from an alignment json.
Usage: python3 subs.py <timing.json> <out.ass> [keywords...]"""
import json, re, sys
T = json.load(open(sys.argv[1], encoding="utf-8")); out = sys.argv[2]
KW = {w.lower() for w in sys.argv[3:]}
def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"
norm = lambda w: re.sub(r"[^\wàâäéèêëïîôöùûüç'-]", "", w.lower()).split("'")[-1]
ev = []
for p in T["phrases"]:
    words = p["text"].replace("«", "").replace("»", "").split()
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(" ".join(cur)) >= 16 or len(cur) >= 4: chunks.append(cur); cur = []
    if cur:
        if chunks and len(" ".join(cur)) < 7: chunks[-1] += cur
        else: chunks.append(cur)
    tot = sum(len(" ".join(c)) + 1 for c in chunks); acc = 0
    for c in chunks:
        a = p["start"] + (p["end"] - p["start"]) * acc / tot; acc += len(" ".join(c)) + 1
        b = p["start"] + (p["end"] - p["start"]) * acc / tot
        txt = " ".join(("{\\c&H3AD2FF&}" + w.upper() + "{\\c&HFFFFFF&}") if norm(w) in KW else w.upper() for w in c)
        ev.append((a, b, txt))
# extend each chunk to the next one (no flicker) but cap the hold
lines = []
for i, (a, b, txt) in enumerate(ev):
    nb = ev[i + 1][0] if i + 1 < len(ev) else b + 0.6
    b2 = min(nb, b + 0.5) if nb - b < 0.5 else b + 0.15
    lines.append(f"Dialogue: 0,{ts(a)},{ts(b2)},Main,,0,0,0,,{{\\fscx88\\fscy88\\t(0,90,\\fscx100\\fscy100)}}{txt}")
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Anton,92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,1,0,1,7,3,8,70,70,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
open(out, "w", encoding="utf-8").write(head + "\n".join(lines) + "\n")
print(len(lines), "subtitle events")
