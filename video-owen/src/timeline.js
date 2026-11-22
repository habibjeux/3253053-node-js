// Timeline partagée (image + son). Durée provisoire : à recaler sur la voix-off.

export const FPS = 30;
export const DURATION = 60;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VOICE_OFFSET = 0;

// [début, fin, texte] — rempli quand la voix-off sera fournie
export const LINES = [];

// messages d'Owen : [heure d'arrivée, type, contenu]
export const MSGS = [
  [6.8, 'text', 'Tu dors ?'],
  [10.4, 'loc', 'Owen - Maison · Maintenant'],
  [18.6, 'text', 'Ne te retourne pas.'],
  [22.6, 'photo', ''],
  [26.4, 'text', "J'arrivais pas à dormir, alors je suis sorti marcher."],
  [28.4, 'text', "Quand je suis revenu, je l'ai vu par la fenêtre."],
  [30.4, 'text', 'Il est à ma place.'],
  [43.8, 'text', 'Ne le laisse pas te toucher.'],
];

export const EV = {
  clock: [[0, '3:17'], [32, '3:18'], [42, '3:19']],
  lightning: [15.6, 47.2, 55.0],
  ringGlint: 38.2,
  creepHand: 51.0,
  windowSlap: 50.4,
  dilemma: 54.2,
  endTitle: 57.0,
  whooshes: [14, 32, 42],
};
