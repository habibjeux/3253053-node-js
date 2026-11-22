// Timeline partagée (image + son), calée sur la voix-off (out/voix/voix.mp3 posée à +0.5 s).

export const FPS = 30;
export const DURATION = 54.5;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VOICE_OFFSET = 0.5;

// [début, fin, texte]
export const LINES = [
  [0.55, 4.85, "Imagine que ton petit ami t'envoie un texto à 3h17 alors qu'il dort juste à côté de toi."],
  [5.36, 5.73, "« Tu dors ?"],
  [6.15, 6.88, "Ne te retourne pas. »"],
  [7.32, 10.00, "Tu vérifies sa localisation, ça indique qu'il est à la maison,"],
  [10.22, 11.38, "puis il t'envoie une photo."],
  [11.72, 14.46, "Ta fenêtre vue de la rue, à travers l'entrebâillement des rideaux."],
  [14.78, 16.87, "Toi, dans ton lit, ton téléphone allumé,"],
  [17.22, 19.31, "et à côté de toi quelqu'un sous la couverture."],
  [19.83, 21.95, "« J'arrivais pas à dormir, alors je suis sorti marcher."],
  [22.29, 23.95, "Quand je suis revenu, je l'ai vu par la fenêtre."],
  [24.30, 25.01, "Il est à ma place. »"],
  [25.41, 27.07, "À côté de toi, il respire encore."],
  [27.42, 29.83, "Lentement, régulièrement, comme dans son sommeil."],
  [30.18, 32.74, "Celui qui est à côté de toi attrape ta main comme tous les soirs."],
  [33.08, 36.04, "Et à son doigt, la bague que tu lui as offerte, qu'il n'enlève jamais."],
  [36.39, 37.48, "Ton téléphone s'allume à nouveau :"],
  [37.81, 38.85, "« Ne le laisse pas te toucher. »"],
  [39.19, 40.89, "Puis quelque chose tape contre ta fenêtre."],
  [41.16, 43.05, "Une main plaquée à plat contre la vitre."],
  [43.31, 44.81, "À son doigt, la même bague."],
  [45.13, 46.20, "Tu n'en as acheté qu'une seule."],
  [46.52, 47.75, "L'un des deux est ton petit ami :"],
  [48.08, 50.41, "celui dans ton lit, ou celui de l'autre côté de la fenêtre."],
];

// messages d'Owen : [heure d'arrivée, type, contenu]
export const MSGS = [
  [5.35, 'text', 'Tu dors ?'],
  [6.15, 'text', 'Ne te retourne pas.'],
  [7.7, 'loc', 'Owen - Maison · Maintenant'],
  [10.5, 'photo', ''],
  [19.9, 'text', "J'arrivais pas à dormir, alors je suis sorti marcher."],
  [22.3, 'text', "Quand je suis revenu, je l'ai vu par la fenêtre."],
  [24.3, 'text', 'Il est à ma place.'],
  [37.85, 'text', 'Ne le laisse pas te toucher.'],
];

export const EV = {
  clock: [[0, '3:17'], [25.3, '3:18'], [36.2, '3:19']],
  lightning: [12.0, 39.3, 46.4],
  grab: 30.7,
  ringGlint: 33.4,
  knocks: [39.9, 40.3],
  windowSlap: 41.25,
  slapGlint: 43.6,
  creepHand: 46.5,
  dilemma: 45.2,
  whooshes: [11.6, 25.3, 36.1],
};
