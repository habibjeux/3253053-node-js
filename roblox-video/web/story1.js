// Partie 1 — shot list, keyed to the narration phrases (build/p1_timing.json).
import * as THREE from 'three';
import { makeAvatar, SPECS, pose, walk } from './avatar.js';
import * as S from './sets.js';
import { cam, faceCam, track, lerp, ease, easeOut, prog, clamp, flash, talking } from './film.js';

const A = (name, expr, pos = [0, 0, 0], ry = 0) => { const a = makeAvatar(SPECS[name]); a.position.set(...pos); a.rotation.y = ry; a.userData.setExpression(expr); return a; };
const SIT = { legL: [-1.5, 0, 0], legR: [-1.5, 0, 0], bob: -1.0 };
const expr = (a, e, o = {}) => a.userData.setExpression(e, o);
const shake = (t, hits, amp = 0.25) => { let s = 0; for (const h of hits) { const d = t - h; if (d >= 0 && d < 0.5) s += amp * Math.exp(-d * 9); } return s; };

function lyingGrandpa(scene, e = 'sleep') {
  const gp = A('grandpa', e, [-1.5, 1.35, -0.25]); gp.rotation.x = -Math.PI / 2; pose(gp, { armL: [0, 0, -0.05], armR: [0, 0, 0.05] }); scene.add(gp); return gp;
}
function hospital(night) {
  const st = night ? S.setHospitalNight() : S.setBedroom();
  const mon = S.monitor(); mon.position.set(2.4, 2.45, -4.6); mon.rotation.y = -0.5; st.scene.add(mon); st.monitor = mon;
  return st;
}
function fingerInsert() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07040c); scene.fog = new THREE.FogExp2(0x07040c, 0.06);
  scene.add(new THREE.HemisphereLight(0x8060c0, 0x000000, 0.6));
  const key = new THREE.SpotLight(0xffd0a0, 60, 20, 0.5, 0.6); key.position.set(3, 6, 4); scene.add(key);
  const f = S.cursedFinger(); f.position.set(0, -1.2, 0); scene.add(f);
  // paper talismans wrapped around
  const paper = new THREE.MeshStandardMaterial({ color: 0xe9d68a, roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16, 1, true), paper); p.position.y = -0.6 + i * 0.7; p.rotation.z = (i - 1) * 0.15; f.add(p); }
  return { scene, finger: f };
}

export function makeShots(T) {
  const P = T.phrases;
  const at = k => P[k].start, end = k => P[k].end;
  const spans = (...ks) => ks.map(k => [P[k].start, P[k].end]);
  const shots = [];
  const shot = (k, build, update) => shots.push({ t0: k === 0 ? 0 : at(k) - 0.08, build, update });

  // 0 — condemned, traditional room, candles
  shot(0, () => {
    const st = S.setWashitsu(); const s = st.scene;
    st.hero = A('hero', 'determined', [0, 0, -3.2]); pose(st.hero, { ...SIT, armL: [-0.2, 0, -0.1], armR: [-0.2, 0, 0.1] }); s.add(st.hero);
    for (const [n, e, p, r] of [['adult', 'angry', [-4, 0, -0.5], 1.2], ['adult2', 'neutral', [4, 0, -0.5], -1.2], ['adult', 'determined', [-3.4, 0, 3.2], 2.5], ['adult2', 'angry', [3.4, 0, 3.2], -2.5]]) { const a = A(n, e, p, r); pose(a, { ...SIT, armL: [-0.4, 0, 0], armR: [-0.4, 0, 0] }); s.add(a); }
    st.f = S.cursedFinger(); st.f.scale.setScalar(0.45); st.f.position.set(0, 1.13, 0.4); st.f.rotation.z = Math.PI / 2; s.add(st.f);
    return st;
  }, (st, lt) => {
    const d = end(1);
    cam(track([[0, [0, 6.5, 14]], [d, [0, 5.3, 5.2]]], lt), track([[0, [0, 3.6, -2]], [d, [0, 4.6, -3.2]]], lt), 40);
    st.f.userData.light.intensity = 3 + Math.sin(lt * 4);
  });
  // 1 — 19 others
  shot(2, () => {
    const st = S.setWashitsu(); const s = st.scene;
    st.hero = A('hero', 'surprised', [0, 0, -3.2]); pose(st.hero, { ...SIT }); s.add(st.hero);
    st.fs = []; for (let i = 0; i < 19; i++) { const f = S.cursedFinger(); f.scale.setScalar(0.28); f.userData.light.intensity = i % 4 ? 0 : 2; s.add(f); st.fs.push(f); }
    return st;
  }, (st, lt, t) => {
    st.fs.forEach((f, i) => { const a = (i / 19) * Math.PI * 2 + lt * 0.6, on = easeOut(prog(lt, i * 0.08, i * 0.08 + 0.4)); f.position.set(Math.cos(a) * 3.0, 5.0 + Math.sin(a * 2 + lt) * 0.4, -3.2 + Math.sin(a) * 1.5); f.rotation.set(lt + i, a, 0.3); f.scale.setScalar(0.28 * on); });
    cam(track([[0, [0, 5.0, 5.8]], [3, [0, 5.0, 4.0]]], lt), [0, 4.8, -3.2], 42);
  });
  // 2 — it all started at the hospital
  shot(3, () => { const st = hospital(false); st.gp = lyingGrandpa(st.scene); return st; }, (st, lt, t) => {
    st.monitor.userData.draw(t, false);
    cam(track([[0, [4.5, 8.5, 2.5]], [1.6, [3.6, 7.6, 1.2]]], lt), [-1.5, 1.8, -3.8], 42);
  });
  // 3 — I'm strong, weirdly strong
  shot(4, () => { const st = S.setField(); st.hero = A('hero', 'determined', [0, 0, 0], 0.2); st.scene.add(st.hero); return st; }, (st, lt, t) => {
    const k = at(5) - at(4);
    const up = easeOut(prog(lt, 0, 0.5));
    pose(st.hero, { armR: [0, 0, lerp(0.05, 2.6, up)], armL: [0, 0, -0.1], head: [0, -0.15, 0] });
    expr(st.hero, lt > k ? 'grin' : 'determined');
    const z = lt > k ? lerp(8, 5.5, easeOut(prog(lt, k, k + 0.3))) : lerp(11, 9, lt / k);
    cam([0.6, 4.8, z], [0, 4.4, 0], 40, shake(lt, [k], 0.18), t);
  });
  // 4 — throws the shot put further than the whole team
  shot(6, () => {
    const st = S.setField(); const s = st.scene;
    st.hero = A('hero', 'determined', [0, 0, 0], -0.4); s.add(st.hero);
    st.ball = S.shotPut(); s.add(st.ball);
    st.crowd = [A('athlete', 'neutral', [-5, 0, 3], 0.6), A('athlete2', 'neutral', [-6.5, 0, 0.5], 0.9), A('athlete', 'neutral', [-4, 0, 6], 0.4)]; st.crowd.forEach(a => s.add(a));
    return st;
  }, (st, lt, t) => {
    const wind = ease(prog(lt, 0, 0.7)), fire = easeOut(prog(lt, 0.7, 0.9));
    pose(st.hero, { armR: [lerp(0, 0.6, wind) - fire * 2.4, 0, lerp(0.1, 1.2, wind) - fire * 0.6], armL: [0, 0, -0.6 * wind], torso: [0, lerp(0, 0.6, wind) - fire * 1.0, 0], legL: [-0.3 * fire, 0, 0], legR: [0.4 * fire, 0, 0] });
    const fl = Math.max(0, lt - 0.85);
    if (lt < 0.85) st.ball.position.set(1.6 + Math.sin(lt) * 0.2, 4.0, 0.3); else st.ball.position.set(1.6 + fl * 2, 4.0 + fl * 14 - 4.9 * fl * fl, -fl * 30);
    st.crowd.forEach(a => { expr(a, lt > 1.2 ? 'surprised' : 'neutral'); pose(a, { head: [lt > 1.2 ? -0.4 : 0, 0, 0] }); });
    const c = track([[0, [8, 5.5, 12]], [0.9, [7.5, 5.5, 12]], [2.6, [5, 6.5, 13]]], lt);
    const fo = clamp((lt - 0.9) / 1.2) * 0.35;
    cam(c, [lerp(0.3, st.ball.position.x, fo), lerp(3.6, st.ball.position.y, fo), lerp(0, st.ball.position.z, fo)], 44);
  });
  // 5 — occult club, home at 5 pm
  shot(7, () => {
    const st = S.setClubroom(); const s = st.scene;
    st.b = A('studentB', 'smile', [-3.0, 0, -0.8]); pose(st.b, SIT); s.add(st.b);
    st.c = A('studentC', 'smile', [-0.6, 0, -0.8]); pose(st.c, SIT); s.add(st.c);
    st.hero = A('hero', 'neutral', [2.8, 0, 2.6], -0.6); s.add(st.hero);
    return st;
  }, (st, lt, t) => {
    const d = end(7) - at(7);
    pose(st.c, { ...SIT, armR: [0, 0, 2.6 + Math.sin(lt * 9) * 0.3] }); pose(st.b, { ...SIT, armL: [-0.6, 0, 0] });
    expr(st.hero, lt > d * 0.6 ? 'smile' : 'neutral');
    cam(track([[0, [3, 6, 11]], [d * 0.62, [1.5, 6.5, 8]], [d, [-4.5, 8.8, -6.5]]], lt), track([[0, [-1, 3.8, -0.5]], [d * 0.62, [-1, 4.2, -0.5]], [d, [-6, 9.2, -11.8]]], lt), 42);
  });
  // 6 — time to visit grandpa
  shot(8, () => { const st = S.setStreet(); st.hero = A('hero', 'neutral', [0, 0, 0]); st.scene.add(st.hero); return st; }, (st, lt, t) => {
    st.hero.position.z = -lt * 4; walk(st.hero, t, 1.1, 0.6);
    cam([1.5, 4.8, 9 - lt * 4], [0, 4.2, -lt * 4], 40);
  });
  // 7 — that night, he grabbed my hand
  shot(9, () => {
    const st = hospital(true); st.gp = lyingGrandpa(st.scene, 'open');
    st.hero = A('hero', 'worried', [1.2, 0, -2.6], -Math.PI / 2); st.scene.add(st.hero); return st;
  }, (st, lt, t) => {
    st.monitor.userData.draw(t, false);
    const g = easeOut(prog(lt, 0.3, 0.8));
    pose(st.gp, { armR: [-1.5 * g, 0, 0.05 + 0.3 * g] });
    pose(st.hero, { armR: [-0.9, 0, 0.15], head: [0.4, 0, 0] });
    cam(track([[0, [-4.8, 4.8, 0.2]], [1.6, [-4.0, 4.3, -0.6]]], lt), [0.4, 2.9, -2.6], 44);
  });
  // 8 — "you're strong, so help people"
  shot(11, () => { const st = hospital(true); st.gp = lyingGrandpa(st.scene, 'determined'); return st; }, (st, lt, t) => {
    expr(st.gp, 'determined', { talk: talking(t, spans(11, 12)) });
    st.monitor.userData.draw(t, false);
    faceCam(st.gp, track([[0, 4.2], [2, 3.4]], lt), 0.5, 0.6, 36);
  });
  // 9 — "don't die alone like me"
  shot(13, () => { const st = hospital(true); st.gp = lyingGrandpa(st.scene, 'sad'); st.hero = A('hero', 'sad', [1.4, 0, -3.4], -1.9); pose(st.hero, { head: [0.3, 0, 0] }); st.scene.add(st.hero); return st; }, (st, lt, t) => {
    expr(st.hero, 'sad', { tear: lt > 1.0 });
    expr(st.gp, 'sad', { talk: talking(t, spans(13, 14)) });
    faceCam(st.hero, track([[0, 4.6], [2.7, 3.6]], lt), 0.35, 0.15, 36);
  });
  // 10 — then he was gone
  shot(15, () => { const st = hospital(true); st.gp = lyingGrandpa(st.scene, 'sleep'); st.hero = A('hero', 'sad', [1.4, 0, -3.0], -1.9); pose(st.hero, { head: [0.55, 0, 0] }); expr(st.hero, 'sad', { tear: true }); st.scene.add(st.hero); return st; }, (st, lt, t) => {
    st.monitor.userData.draw(t, lt > 0.3);
    cam(track([[0, [-1.5, 6.5, 6]], [1.2, [-1.5, 6.8, 7.5]]], lt), [-0.5, 2.4, -3], 42);
    flash(0.35 * prog(lt, 0.4, 1.2), '#000');
  });
  // 11 — signing papers, a boy in a black uniform approaches
  shot(16, () => {
    const st = hospital(true); const s = st.scene;
    const dk = S.desk(); dk.position.set(3, 0, 1.5); s.add(dk);
    const pp = S.papers(); pp.position.set(3, 2.68, 1.6); s.add(pp);
    st.hero = A('hero', 'sad', [3, 0, 0.3]); pose(st.hero, { ...SIT, armR: [-1.2, 0, 0.1], armL: [-1.1, 0, -0.1], head: [0.35, 0, 0] }); s.add(st.hero);
    st.boy = A('studentA', 'determined', [-6, 0, -5], 0.9); s.add(st.boy);
    return st;
  }, (st, lt, t) => {
    const d = end(16) - at(16);
    const w = prog(lt, d * 0.35, d);
    st.boy.position.set(lerp(-6, -0.2, w), 0, lerp(-5, 0.6, w)); if (w > 0 && w < 1) walk(st.boy, t, 1, 0.5); else pose(st.boy, {});
    st.hero.userData.parts.armR.rotation.y = Math.sin(t * 8) * 0.15 * (lt < d * 0.5 ? 1 : 0);
    if (lt > d * 0.7) { pose(st.hero, { ...SIT, armR: [-1.2, 0, 0.1], armL: [-1.1, 0, -0.1], head: [0, -0.7, 0] }); expr(st.hero, 'surprised'); }
    cam(track([[0, [5.5, 6, 9]], [d, [4.5, 5.6, 7.5]]], lt), [1.5, 3.8, -0.5], 46);
  });
  // 12a — the boy speaks
  const boyClose = (k0, k1, e) => shot(k0, () => { const st = hospital(true); st.boy = A('studentA', e, [0, 0, 0], 0.25); st.scene.add(st.boy); return st; }, (st, lt, t) => {
    expr(st.boy, e, { talk: talking(t, spans(...Array.from({ length: k1 - k0 + 1 }, (_, i) => k0 + i))) });
    faceCam(st.boy, track([[0, 4.6], [3, 3.8]], lt), 0.3, 0.1, 36);
  });
  boyClose(17, 17, 'determined');
  // 12b — insert: rotten finger wrapped in paper talismans
  shot(18, () => fingerInsert(), (st, lt) => { st.finger.rotation.y = lt * 0.9; st.finger.userData.light.intensity = 4 + 2 * Math.sin(lt * 5); cam([0, 0, track([[0, 5.5], [3, 4.2]], lt)], [0, 0, 0], 40); return { bloom: 1.0 }; });
  boyClose(19, 19, 'angry');
  // 13 — the club found it in an old box
  shot(20, () => {
    const st = S.setClubroom(); const s = st.scene;
    st.box = S.talismanBox(0, 0); st.box.position.set(-1.8, 2.68, 0.6); st.box.scale.setScalar(0.8); s.add(st.box);
    st.b = A('studentB', 'surprised', [-3.6, 0, -0.9], 0.3); pose(st.b, SIT); s.add(st.b);
    st.c = A('studentC', 'smile', [-0.2, 0, -0.9], -0.3); pose(st.c, SIT); s.add(st.c);
    return st;
  }, (st, lt) => {
    const o = ease(prog(lt, 0.3, 1.2)); st.box.userData.lid.rotation.x = -o * 1.6; st.box.userData.finger.userData.light.intensity = o * 5;
    cam(track([[0, [-1.8, 5.2, 6.2]], [1.7, [-1.8, 4.8, 4.8]]], lt), [-1.8, 3.4, -0.3], 42);
  });
  // 14 — that night, they peeled the talismans at school
  shot(21, () => {
    const st = S.setClassNight(); const s = st.scene;
    st.box = S.talismanBox(1, 1); st.box.position.set(-2.5, 2.68, 0.5); st.box.scale.setScalar(0.8); s.add(st.box);
    st.b = A('studentB', 'smile', [-4.3, 0, 2.2], 2.4); s.add(st.b); st.c = A('studentC', 'open', [-0.9, 0, 2.3], -2.4); s.add(st.c);
    return st;
  }, (st, lt, t) => {
    const g = prog(lt, 0, 2.2);
    st.box.userData.finger.userData.light.intensity = 4 + g * 14; st.purple.intensity = 10 + g * 50;
    pose(st.b, { armR: [-1.3, 0, -0.3] }); pose(st.c, { armL: [-1.2, 0, 0.3] });
    if (lt > 1.6) { expr(st.b, 'surprised'); expr(st.c, 'scared'); }
    cam(track([[0, [-2.5, 7.8, -7.8]], [2.3, [-2.5, 7.0, -6.4]]], lt), [-2.6, 4.2, 1.8], 44);
    return { bloom: 0.9 };
  });
  // 15 — so your friends are going to be eaten
  shot(23, () => {
    const st = hospital(true); st.boy = A('studentA', 'determined', [-1.2, 0, 1.0], 0.9); st.hero = A('hero', 'surprised', [1.6, 0, 1.6], -1.3); st.scene.add(st.boy, st.hero); return st;
  }, (st, lt, t) => {
    expr(st.boy, 'determined', { talk: talking(t, spans(23)) });
    faceCam(st.hero, track([[0, 5], [1.7, 3.6]], lt), 0.25, 0.2, 38);
  });
  // 16 — monsters born from people's bad feelings
  shot(24, () => { const st = S.setDark(); st.c = S.creature(); st.c.position.set(0, -12, -8); st.scene.add(st.c); return st; }, (st, lt, t) => {
    const r = easeOut(prog(lt, 0, 3.0)); st.c.position.y = lerp(-12, 0, r);
    S.animateCreature(st.c, t, 0);
    cam(track([[0, [0, 3, 14]], [4, [0, 5.5, 12]]], lt), track([[0, [0, 3, -8]], [4, [0, 7.5, -8]]], lt), 52);
    return { bloom: 0.7 };
  });
  // 17 — most people can't see them; they love to eat energy
  shot(27, () => {
    const st = S.setStreet(); const s = st.scene;
    st.people = [A('adult', 'neutral', [-2.5, 0, 2]), A('adult2', 'neutral', [2, 0, -1]), A('athlete', 'neutral', [0, 0, -5])]; st.people.forEach(p => s.add(p));
    st.c = S.creature(); st.c.position.set(0.5, 0, -14); st.c.scale.setScalar(1.25); s.add(st.c);
    return st;
  }, (st, lt, t) => {
    st.people.forEach((p, i) => { p.position.z = [2, -1, -5][i] + lt * 2.2; walk(p, t + i * 0.3, 1, 0.5); });
    const k = at(28) - at(27);
    S.animateCreature(st.c, t, lt > k ? 0.6 * prog(lt, k, k + 1) : 0);
    cam(track([[0, [1.5, 3.8, 15]], [k, [1.5, 4.5, 14]], [k + 2.5, [1.0, 6.5, 12]]], lt), track([[0, [0, 4.5, 0]], [k, [0, 7, -6]], [k + 2.5, [0, 11, -12]]], lt), 46);
  });
  // 18 — arriving at school, 4th floor windows shattered
  shot(29, () => { const st = S.setSchoolNight(); st.hero = A('hero', 'determined', [0, 0, 10], Math.PI); st.scene.add(st.hero); return st; }, (st, lt, t) => {
    st.hero.position.z = 10 - lt * 5; walk(st.hero, t, 1.8, 1.0, { torso: [0.2, 0, 0] });
    cam(track([[0, [2, 3.2, 20]], [1.2, [2, 3.5, 19]], [3.5, [1, 6, 22]]], lt), track([[0, [0, 4, 8]], [1.2, [0, 5, 4]], [3.5, [0, 20, -25]]], lt), 48);
    return { bloom: 0.9 };
  });
  // 19 — the creature squeezing the two seniors
  shot(31, () => {
    const st = S.setClassNight(); const s = st.scene;
    st.c = S.creature(); st.c.position.set(0, 0, -6); st.c.scale.setScalar(0.9); s.add(st.c);
    st.b = A('studentB', 'scared', [-3.2, 4.5, -3.5], 0.3); st.c2 = A('studentC', 'scared', [3.2, 4.0, -3.5], -0.3); s.add(st.b, st.c2);
    return st;
  }, (st, lt, t) => {
    S.animateCreature(st.c, t, 0.3);
    const sq = 1 - 0.12 * (0.5 + 0.5 * Math.sin(lt * 4));
    for (const p of [st.b, st.c2]) { p.scale.set(sq, 1 + (1 - sq) * 0.6, 1); pose(p, { armL: [0, 0, -0.9], armR: [0, 0, 0.9], legL: [0.3 * Math.sin(lt * 10), 0, 0], legR: [-0.3 * Math.sin(lt * 10), 0, 0] }); }
    cam(track([[0, [0, 2.0, 12]], [5, [0, 2.6, 8.5]]], lt), [0, 6.5, -4], 52);
    return { bloom: 0.8 };
  });
  // 20 — I punched it, as hard as I've ever punched anything
  shot(32, () => {
    const st = S.setClassNight({ desks: false }); const s = st.scene;
    st.c = S.creature(); st.c.position.set(0, 0, -6); st.c.scale.setScalar(0.9); s.add(st.c);
    st.hero = A('hero', 'angry', [0, 0, 4], Math.PI); s.add(st.hero);
    return st;
  }, (st, lt, t) => {
    const h1 = 0.35, h2 = at(33) - at(32) + 0.45;
    const run = prog(lt, 0, h1);
    st.hero.position.z = lerp(4, -2.2, run);
    const punch = (h) => easeOut(prog(lt, h - 0.15, h)) * (1 - prog(lt, h + 0.3, h + 0.6));
    const p = Math.max(punch(h1), punch(h2));
    if (lt < h1) walk(st.hero, t, 2, 1); else pose(st.hero, { armR: [-1.6 * p - 0.2, 0, 0.1], armL: [0.5 * p, 0, -0.2], torso: [0.15, 0.5 * p, 0], legL: [0.4, 0, 0], legR: [-0.4, 0, 0] });
    S.animateCreature(st.c, t, 0.1);
    const hit = (h) => Math.exp(-Math.max(0, lt - h) * 10) * (lt >= h ? 1 : 0);
    flash(Math.max(hit(h1), hit(h2)) * 0.8);
    const k = at(33) - at(32);
    cam(lt < k ? track([[0, [9, 4.5, 2]], [k, [8, 4.5, 0]]], lt) : track([[k, [6, 3.2, -0.5]], [k + 3, [5, 3.4, -1.2]]], lt), [0, 5, -3], 48, shake(lt, [h1, h2], 0.35), t);
  });
  // 21 — it barely noticed
  shot(34, () => {
    const st = S.setClassNight({ desks: false }); const s = st.scene;
    st.c = S.creature(); st.c.position.set(0, 0, -6); st.c.scale.setScalar(0.9); s.add(st.c);
    st.hero = A('hero', 'surprised', [0, 0, -2.2], 0.25); s.add(st.hero); return st;
  }, (st, lt, t) => {
    S.animateCreature(st.c, t * 0.6, 0);
    st.c.userData.eyes.forEach(e => e.rotation.x = 0.4);
    if (lt < 0.55) cam([1.5, 5.5, 3.5], [0, 7.5, -6], 46); else faceCam(st.hero, track([[0.55, 3.8], [1.4, 3.2]], lt), -0.25, 0.4, 38);
  });
  // 22 — the boy is thrown through a wall, bleeding
  shot(35, () => {
    const st = S.setClassNight({ desks: false }); const s = st.scene;
    st.boy = A('studentA', 'scared', [6, 3, 2], -Math.PI / 2); s.add(st.boy);
    const kl = new THREE.PointLight(0xc0b0ff, 25, 18, 1.4); kl.position.set(0, 6, 7); s.add(kl);
    st.deb = S.debris(40); st.deb.position.set(-7, 0, 2); st.deb.rotation.y = -Math.PI / 2; s.add(st.deb);
    st.hole = new THREE.Mesh(new THREE.CircleGeometry(2.4, 7), new THREE.MeshBasicMaterial({ color: 0x020205 })); st.hole.position.set(-11.75, 3.5, 2); st.hole.rotation.y = Math.PI / 2; s.add(st.hole);
    return st;
  }, (st, lt, t) => {
    const hitT = 0.55, k = at(36) - at(35);
    const f = prog(lt, 0, hitT);
    if (lt < hitT) { st.boy.position.set(lerp(6, -10.5, f), 3 + Math.sin(f * Math.PI) * 1.2, 2); st.boy.rotation.z = f * 1.5; pose(st.boy, { armL: [-2.5, 0, 0], armR: [-2.5, 0, 0], legL: [0.5, 0, 0], legR: [0.5, 0, 0] }); }
    else { st.boy.position.set(-8.8, 0.6, 6.2); st.boy.rotation.set(-Math.PI / 2 + 0.15, 0, 0.3); expr(st.boy, 'sad', { blood: true }); pose(st.boy, { head: [-0.3, 0, 0] }); }
    st.hole.visible = lt >= hitT; st.deb.visible = lt >= hitT; st.deb.userData.at(lt - hitT);
    flash(Math.exp(-Math.max(0, lt - hitT) * 8) * (lt >= hitT ? 0.6 : 0));
    if (lt < k) cam([0, 4.5, 11.5], [lerp(3, -8, f), 3.2, 2], 52, shake(lt, [hitT], 0.4), t);
    else faceCam(st.boy, track([[k, 4.2], [k + 1.2, 3.4]], lt), 0.3, 0.3, 38);
  });
  // 23 — he looked at the finger on the floor
  shot(37, () => {
    const st = S.setClassNight(); const s = st.scene;
    st.f = S.cursedFinger(); st.f.scale.setScalar(0.45); st.f.position.set(0, 0.25, 0); st.f.rotation.set(0, 0.6, Math.PI / 2); s.add(st.f);
    st.boy = A('studentA', 'worried', [-4.5, 0.6, -3.5]); st.boy.rotation.set(-Math.PI / 2 + 0.25, 0.6, 0); expr(st.boy, 'worried', { blood: true }); s.add(st.boy);
    return st;
  }, (st, lt) => {
    st.f.userData.light.intensity = 5 + 2 * Math.sin(lt * 4);
    cam(track([[0, [1.6, 1.4, 3.2]], [1.3, [1.1, 1.0, 2.4]]], lt), [-0.6, 0.5, -0.8], 42);
    return { bloom: 1.0 };
  });
  // 24 — only cursed energy can hurt it…
  shot(38, () => {
    const st = S.setClassNight(); const s = st.scene;
    st.hero = A('hero', 'determined', [0, 0, 0], 0); s.add(st.hero);
    const up = new THREE.PointLight(0xa040ff, 30, 12, 1.6); up.position.set(0, 2, 2.5); s.add(up);
    return st;
  }, (st, lt, t) => {
    pose(st.hero, { head: [0.35, 0, 0], armR: [-0.8, 0, 0.2] });
    cam(track([[0, [0.4, 4.4, 5.4]], [2.4, [0.2, 4.8, 3.4]]], lt), [0, 4.85, 0], 38);
    flash(prog(lt, end(38) - at(38) + 0.1, end(38) - at(38) + 0.9), '#000');
    return { bloom: 1.0 };
  });
  return shots;
}
