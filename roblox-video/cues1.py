"""Sound cues for part 1, derived from the phrase timing (same anchors as web/story1.js)."""
import json, sys
P = json.load(open("build/p1_timing.json", encoding="utf-8"))["phrases"]
at = lambda k: P[k]["start"] - 0.08
end = lambda k: P[k]["end"]
c = []
add = lambda t, typ, g=1, **kw: c.append({"t": round(t, 3), "type": typ, "g": g, **kw})
add(0.0, "boom", 0.8); add(P[1]["start"] + 1.4, "hit", 0.6)
add(at(2), "shimmer", 1.2)
for t in [at(3) + 0.2 + i * 0.9 for i in range(2)]: add(t, "beep")
add(at(5), "hit", 0.8); add(at(5), "whoosh", 0.7)
add(at(6) + 0.75, "whoosh", 1.2)
for i in range(int((at(15) - at(9)) / 0.9)): add(at(9) + 0.3 + i * 0.9, "beep", 0.6)
add(at(15) + 0.3, "flat", 1)
add(at(18), "swell", 0.8); add(at(18) + 0.2, "shimmer", 0.8)
add(at(21), "swell", 1.0); add(at(24), "growl", 1.0); add(at(24) + 2.2, "growl", 0.8)
add(at(28), "growl", 0.6)
add(at(29) + 0.1, "shatter", 1.0); add(at(29), "boom", 0.9, action=True)
add(at(31), "growl", 1.1); add(at(31) + 2.5, "growl", 0.9)
add(at(32) + 0.2, "whoosh", 0.8); add(at(32) + 0.35, "hit", 1.3)
add(at(33) + 0.3, "whoosh", 0.8); add(at(33) + 0.45, "hit", 1.5)
add(at(34) + 0.1, "growl", 0.9)
add(at(35) + 0.1, "whoosh", 1.0); add(at(35) + 0.55, "crash", 1.4)
add(at(37), "shimmer", 1.0); add(at(38), "swell", 1.1)
json.dump(c, open("build/p1_cues.json", "w"), indent=1); print(len(c), "cues")
