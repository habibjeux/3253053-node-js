// Derives the sound/animation cue list from the narration timing so that
// picture (render.js) and sound (audio.py) stay in sync.
const fs = require('fs');
const path = require('path');

function load() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'build', 'timing.json'), 'utf8'));
}

// estimated time at which `word` is spoken inside a line (character-proportional)
function wordTime(line, word) {
  const i = line.text.indexOf(word);
  if (i < 0) throw new Error(`word "${word}" not in "${line.text}"`);
  return line.start + (i / line.text.length) * (line.end - line.start);
}

function build(timing) {
  const S = {}; for (const s of timing.scenes) S[s.id] = s;
  const L = (id, k) => S[id].lines[k];
  const cues = {};
  const ev = [];
  const series = (type, t0, t1, period, strength, extra = {}) => { for (let t = t0; t < t1; t += period) ev.push({ t: +t.toFixed(3), type, strength, ...extra }); };

  // S1 — distant hopping figure + a faint bell
  cues.s1 = { hopStart: S[1].start + 1.0, hopPeriod: 1.05 };
  ev.push({ t: S[1].start + 0.4, type: 'wind', strength: 0.6, dur: 6 });
  series('hop', cues.s1.hopStart + 1.05 * 0.72, S[1].end + 0.2, 1.05, 0.3);
  ev.push({ t: wordTime(L(1, 0), 'bruit'), type: 'bell', strength: 0.35 });
  ev.push({ t: wordTime(L(1, 1), 'suivre') - 0.2, type: 'boom', strength: 0.5 });
  // S2 — apparition
  ev.push({ t: S[2].start + 0.2, type: 'swell', strength: 0.8, dur: 3 });
  ev.push({ t: wordTime(L(2, 0), 'cadavre'), type: 'boom', strength: 0.9 });
  // S4 — hopping on the road
  cues.s4 = { hopStart: S[4].start + 0.3, hopPeriod: 0.95 };
  series('hop', cues.s4.hopStart + 0.95 * 0.72, S[4].end - 0.1, 0.95, 1.0);
  // S5 — funeral gong
  ev.push({ t: S[5].start + 0.6, type: 'gong', strength: 0.55 });
  ev.push({ t: S[5].lines[0].end - 2.5, type: 'gong', strength: 0.4 });
  // S6 — priest with bell, jiangshi following
  cues.s6 = { p2: L(6, 1).start - 0.6, hopPeriod: 1.0 };
  series('bell', cues.s6.p2 + 0.3, S[6].end, 1.0, 0.55);
  for (let k = 0; k < 3; k++) series('hop', cues.s6.p2 + 0.72 + k * 0.33, S[6].end, 1.0, 0.35);
  // S7 — warning
  cues.s7 = { slam: wordTime(L(7, 1), 'fermer') + 0.25, look: wordTime(L(7, 1), 'regarder') - 0.3, run: wordTime(L(7, 1), 'rentrer') - 0.4 };
  series('bell', S[7].start + 0.1, L(7, 0).end + 0.5, 0.42, 0.7);
  ev.push({ t: cues.s7.slam, type: 'door', strength: 1 });
  series('hop', cues.s7.slam + 0.9, S[7].end + 0.2, 0.95, 0.45);
  // S8 — bamboo poles
  cues.s8 = { p2: L(8, 1).start - 0.4 };
  series('creak', S[8].start + 0.5, cues.s8.p2, 0.8, 0.35);
  ev.push({ t: cues.s8.p2 + 0.3, type: 'gong', strength: 0.35 });
  // S9 — awakening in the dark room
  cues.s9 = { wake: wordTime(L(9, 0), 'réveiller'), blind: L(9, 1).start, sense: L(9, 2).start - 0.2 };
  ev.push({ t: cues.s9.wake, type: 'boom', strength: 0.8 });
  series('hop', cues.s9.sense + 0.75, S[9].end - 0.1, 1.15, 0.7);
  // S10 — talisman torn by the wind
  cues.s10 = { gust: wordTime(L(10, 1), 'rafale') - 0.2, rip: wordTime(L(10, 1), 'arrache'), free: wordTime(L(10, 1), 'libérée') };
  ev.push({ t: cues.s10.gust, type: 'wind', strength: 1.2, dur: 3.2 });
  ev.push({ t: cues.s10.rip, type: 'rip', strength: 1 });
  ev.push({ t: cues.s10.free - 0.05, type: 'boom', strength: 1.1 });
  ev.push({ t: cues.s10.free, type: 'shriek', strength: 0.6 });
  // S11 — mountain road, bell behind you, abrupt cut
  const last = L(11, 2);
  cues.s11 = { bell: wordTime(L(11, 0), 'clochette'), away: L(11, 1).start, cut: last.end + 0.45 };
  ev.push({ t: S[11].start + 0.2, type: 'wind', strength: 0.7, dur: 8 });
  series('bell', cues.s11.bell, cues.s11.cut - 0.2, 0.85, 0.5);
  series('hop', cues.s11.away, cues.s11.cut - 0.3, 1.0, 0.45);
  ev.push({ t: cues.s11.cut - 0.12, type: 'sting', strength: 1.2 });
  ev.push({ t: cues.s11.cut, type: 'cut', strength: 1 });

  ev.sort((a, b) => a.t - b.t);
  return { cues, events: ev, total: timing.total };
}

module.exports = { load, build, wordTime };

if (require.main === module) {
  const t = load(); const b = build(t);
  fs.writeFileSync(path.join(__dirname, 'build', 'events.json'), JSON.stringify(b, null, 1));
  console.log(b.events.length, 'events; cut at', b.cues.s11.cut.toFixed(2), 'total', b.total);
}
