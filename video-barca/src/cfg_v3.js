// Configuration v3 : les 4 clips verticaux fournis (v1..v4, déjà calés sur la voix) gardés tels quels,
// + ouverture (replay du but, mi-temps, arrêt sur image « Raphinha ») et habillage par-dessus.
// Temps = temps de sortie (voix posée à +0,2 s). Coordonnées des clips verticaux : 1080×1920.
import { DURATION } from './timeline.js';
const GOLD = '#f5c518', CYAN = '#38e1ff', RED = '#ff3d5a';

export const SEGS = [
  { t0: 0.0, t1: 4.13, src: 'v4', s0: 5.4, s1: 9.53, full: true },
  { t0: 4.13, t1: 8.2, src: 'c', s0: 13.8, s1: 17.87, ar: 1.25, crop: [[760, 540, 864], [560, 540, 864]] },
  { t0: 8.2, t1: 15.95, src: 'a', s0: 0.0, s1: 0.0, ar: 0.75, crop: [[960, 540, 1440], [1010, 440, 1300]] },
  { t0: 15.95, t1: 26.22, src: 'v1', s0: 0.0, s1: 10.27, full: true },
  { t0: 26.22, t1: 26.65, src: 'v1', s0: 10.2, s1: 10.2, full: true, hold: true },
  { t0: 26.65, t1: 39.83, src: 'v2', s0: 0.0, s1: 13.18, full: true },
  { t0: 39.83, t1: 52.64, src: 'v3', s0: 0.0, s1: 12.81, full: true },
  { t0: 52.64, t1: 62.39, src: 'v4', s0: 0.0, s1: 9.75, full: true },
  { t0: 62.39, t1: DURATION, src: 'v4', s0: 9.75, s1: 9.75, full: true, hold: true },
];

export const ANN = [
  // arrêt sur image (images de match propres) : Raphinha et l'option 1
  { seg: 2, t: 9.54, type: 'focus', p: [1540, 440], r: 150, until: 12.7 },
  { seg: 2, t: 9.54, type: 'spot', p: [1540, 435], r: 62, color: GOLD, name: 'RAPHINHA', sub: 'RÉCUPÈRE' },
  { seg: 2, t: 11.71, type: 'banner', text: '2 POSSIBILITÉS', color: GOLD },
  { seg: 2, t: 12.98, type: 'pass', p: [1500, 405], q: [545, 292], curve: -0.14, color: GOLD, badge: '1', label: 'LANCER YAMAL' },
  { seg: 2, t: 13.3, type: 'spot', p: [495, 292], r: 52, color: GOLD, name: 'YAMAL', sub: '1 CONTRE 1', side: 'below' },
  // v1 : l'espace (ton rectangle), Raphinha qui glisse, Yamal
  { seg: 3, t: 16.95, type: 'tag', p: [541, 1004], text: "L'ESPACE", badge: '2', color: CYAN, until: 18.55 },
  { seg: 3, t: 18.95, type: 'plate', p: [172, 752], name: 'RAPHINHA', sub: 'SERT YAMAL', color: GOLD, until: 20.55 },
  { seg: 3, t: 20.5, type: 'pop', text: 'MÊME EN GLISSANT !', color: GOLD },
  { seg: 3, t: 21.5, type: 'plate', p: [518, 648], name: 'LAMINE YAMAL', sub: 'CONTRÔLE PARFAIT', color: GOLD, until: 23.2 },
  { seg: 3, t: 25.95, type: 'pop', text: 'IL RECULE !', color: RED },
  // v2 : les défenseurs, les deux solutions (ta flèche, ta zone rouge)
  { seg: 5, t: 28.45, type: 'banner', text: '+ 2 DÉFENSEURS', color: RED, life: 2.6 },
  { seg: 5, t: 31.2, type: 'pop', text: 'INARRÊTABLE', color: GOLD },
  { seg: 5, t: 33.95, type: 'banner', text: '2 SOLUTIONS', color: GOLD },
  { seg: 5, t: 35.95, type: 'tag', p: [713, 1020], text: 'CENTRER', badge: '1', color: '#ffffff', until: 37.6 },
  { seg: 5, t: 37.7, type: 'tag', p: [687, 790], text: 'TRAVERSER', badge: '2', color: RED, until: 39.83 },
  // v3 : Fermín (ton cercle), la passe, le petit filet
  { seg: 6, t: 40.6, type: 'plate', p: [962, 1059], name: 'FERMÍN', sub: "L'APPEL", color: CYAN, until: 42.95 },
  { seg: 6, t: 45.2, type: 'pop', text: 'PASSE CHIRURGICALE', color: CYAN },
  { seg: 6, t: 47.75, type: 'banner', text: 'FERMÍN', color: CYAN },
  { seg: 6, t: 52.1, type: 'pop', text: 'PETIT FILET !', color: GOLD },
  // v4 : but
  { seg: 7, t: 54.92, type: 'goal' },
  { seg: 7, t: 56.2, type: 'banner', text: 'TOUJOURS UNE SOLUTION', color: GOLD },
];
export const EXTRA = { halftime: 1 };
