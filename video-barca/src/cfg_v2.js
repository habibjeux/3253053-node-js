// Configuration v2 : images de match propres (a/b/c) recadrées, annotations complètes.
import { DURATION, OLD_STARTS, NEW_STARTS } from './timeline.js';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const range = (t, a, b) => clamp((t - a) / (b - a));
const R = (t) => { for (let i = 0; i < OLD_STARTS.length - 1; i++) if (t <= OLD_STARTS[i + 1]) return lerp(NEW_STARTS[i], NEW_STARTS[i + 1], range(t, OLD_STARTS[i], OLD_STARTS[i + 1])); return t; };
const GOLD = '#f5c518', GRANA = '#a50044', CYAN = '#38e1ff', RED = '#ff3d5a', WHITE = '#ffffff';
// ---------------- découpage ----------------
export const SEGS = [
  { t0: 0.0, t1: 3.75, src: 'b', s0: 3.6, s1: 7.35, ar: 1.25, crop: [[1000, 540, 864], [1060, 540, 864]] },
  { t0: 3.75, t1: 7.95, src: 'c', s0: 13.8, s1: 18.0, ar: 1.25, crop: [[760, 540, 864], [560, 540, 864]] },
  { t0: 7.95, t1: 18.45, src: 'a', s0: 0.0, s1: 0.0, ar: 0.75, crop: [[960, 540, 1440], [1010, 440, 1300]] },
  { t0: 18.45, t1: 21.55, src: 'a', s0: 0.0, s1: 1.5, ar: 0.75, crop: [[1010, 440, 1300], [760, 420, 1200]] },
  { t0: 21.55, t1: 25.5, src: 'a', s0: 1.5, s1: 5.6, ar: 0.75, crop: [[720, 440, 1440], [960, 440, 1440]] },
  { t0: 25.5, t1: 27.95, src: 'a', s0: 10.0, s1: 11.6, ar: 1.0, crop: [[900, 540, 1080], [940, 540, 1080]] },
  { t0: 27.95, t1: 32.85, src: 'a', s0: 11.6, s1: 13.7, ar: 0.75, crop: [[960, 540, 1440], [960, 540, 1440]] },
  { t0: 32.85, t1: 44.5, src: 'a', s0: 7.0, s1: 7.0, ar: 0.75, crop: [[800, 470, 1440], [780, 480, 1260]] },
  { t0: 44.5, t1: 47.0, src: 'a', s0: 7.0, s1: 8.4, ar: 0.75, crop: [[780, 480, 1260], [760, 480, 1300]] },
  { t0: 47.0, t1: 48.95, src: 'b', s0: 0.0, s1: 0.9, ar: 1.25, crop: [[700, 540, 864], [760, 540, 864]] },
  { t0: 48.95, t1: 54.25, src: 'b', s0: 0.9, s1: 3.0, ar: 0.75, crop: [[960, 540, 1440], [1040, 540, 1300]] },
  { t0: 54.25, t1: 55.45, src: 'b', s0: 4.6, s1: 5.8, ar: 1.25, crop: [[1050, 540, 864], [1050, 540, 760]] },
  { t0: 55.45, t1: 59.9, src: 'b', s0: 12.0, s1: 16.4, ar: 1.778, crop: [[1350, 540, 608], [1250, 540, 608]] },
  { t0: 59.9, t1: 63.0, src: 'c', s0: 9.6, s1: 12.7, ar: 1.778, crop: [[900, 540, 608], [930, 540, 560]] },
].map((s) => ({ ...s, t0: R(s.t0), t1: s.t1 >= 63 ? DURATION : R(s.t1) }));

// annotations (coordonnées dans l'image source 1920×1080 ; temps de la 1re version, recalés par R)
export const ANN = [
  // ① arrêt sur image : Raphinha et ses deux options
  { seg: 2, t: 9.27, type: 'focus', p: [1540, 440], r: 150, until: 12.5 },
  { seg: 2, t: 9.27, type: 'spot', p: [1540, 435], r: 62, color: GOLD, name: 'RAPHINHA', sub: 'RÉCUPÈRE' },
  { seg: 2, t: 11.41, type: 'banner', text: '2 POSSIBILITÉS', color: GOLD },
  { seg: 2, t: 12.63, type: 'pass', p: [1500, 405], q: [545, 292], curve: -0.14, color: GOLD, badge: '1', label: 'LANCER YAMAL' },
  { seg: 2, t: 13.0, type: 'spot', p: [495, 292], r: 52, color: GOLD, name: 'YAMAL', sub: '1 CONTRE 1', side: 'below' },
  { seg: 2, t: 15.17, type: 'zone', p: [960, 625], r: [250, 105], color: CYAN, label: "L'ESPACE" },
  { seg: 2, t: 15.17, type: 'run', p: [1510, 450], q: [1060, 600], curve: 0.1, color: CYAN, badge: '2' },
  // la passe en glissant
  { seg: 3, t: 18.5, type: 'spot', p: [1540, 435], r: 62, color: GOLD, name: 'RAPHINHA', until: 19.7 },
  { seg: 3, t: 20.4, type: 'pop', text: 'MÊME EN GLISSANT !', color: GOLD },
  { seg: 4, t: 21.7, type: 'banner', text: 'LAMINE YAMAL', color: GOLD },
  // Yamal face au défenseur
  { seg: 5, t: 25.9, type: 'track', keys: [[10.0, 1080, 700], [10.5, 1180, 700], [11.0, 1300, 690], [11.6, 1330, 700]], r: 120, color: RED, name: 'IL RECULE !' },
  { seg: 6, t: 28.2, type: 'banner', text: '+ 2 DÉFENSEURS', color: RED },
  { seg: 6, t: 30.8, type: 'pop', text: 'INARRÊTABLE', color: GOLD },
  // ② arrêt sur image : les solutions de Yamal
  { seg: 7, t: 32.95, type: 'spot', p: [1218, 350], r: 52, color: GOLD, name: 'YAMAL' },
  { seg: 7, t: 33.9, type: 'banner', text: '2 SOLUTIONS', color: GOLD },
  { seg: 7, t: 35.3, type: 'pass', p: [1190, 360], q: [500, 600], curve: 0.2, color: WHITE, badge: '1', label: 'CENTRER' },
  { seg: 7, t: 37.3, type: 'run', p: [1185, 385], q: [330, 490], curve: -0.22, color: RED, badge: '2', label: 'DRIBBLER' },
  { seg: 7, t: 39.85, type: 'focus', p: [864, 690], r: 170 },
  { seg: 7, t: 39.85, type: 'spot', p: [864, 698], r: 52, color: CYAN, name: 'FERMÍN', sub: 'SEUL !', side: 'below' },
  { seg: 7, t: 41.9, type: 'run', p: [850, 712], q: [570, 800], curve: 0.05, color: CYAN, label: "L'APPEL", loop: true },
  // la passe
  { seg: 8, t: 44.55, type: 'pass', p: [1225, 365], q: [600, 770], curve: 0.06, color: CYAN, dur: 0.8, ball: true },
  { seg: 8, t: 45.1, type: 'pop', text: 'PASSE CHIRURGICALE', color: CYAN },
  { seg: 9, t: 47.1, type: 'banner', text: 'FERMÍN', color: CYAN },
  { seg: 10, t: 51.6, type: 'pop', text: 'PETIT FILET !', color: GOLD },
  { seg: 11, t: 54.26, type: 'goal' },
  { seg: 12, t: 55.5, type: 'banner', text: 'TOUJOURS UNE SOLUTION', color: GOLD },
].map((a) => ({ ...a, t: R(a.t), until: a.until && R(a.until) }));

export const EXTRA = { halftime: 1 };
