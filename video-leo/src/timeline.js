// Timeline partagée entre le rendu 3D (navigateur) et la bande son (Node).
// Répliques calées sur la voix-off (out/voix/voix_maxime.mp3, posée à +0.4 s).

export const FPS = 30;
export const DURATION = 79.5;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VOICE_OFFSET = 0.4;

// [début, fin, texte]
export const LINES = [
  [0.50, 2.74, "Dans cette ville, faire du bruit coûte 15 €."],
  [3.01, 5.48, "Un pas un peu trop fort, ding, 15 € ;"],
  [5.71, 7.82, "un éternuement, ding, encore 15."],
  [8.17, 11.60, "Alors ici, tout le monde marche sur la pointe des pieds et parle en chuchotant."],
  [11.91, 14.38, "Moi, c'est Léo, et j'ai le rhume une semaine sur deux."],
  [14.67, 17.22, "Atchoum, 15 € ; atchoum, 30."],
  [17.52, 20.41, "À la fin du mois, mon argent de poche disparaît avant même d'arriver."],
  [20.74, 23.59, "Le système appartient à M. Vane, le gardien du vieux phare."],
  [23.90, 27.58, "Mais depuis trois semaines, les amendes explosent même quand la rue est déserte :"],
  [27.79, 31.33, "la boulangère, le pêcheur et même ma petite sœur Mila ont tout perdu."],
  [31.69, 34.28, "Pourtant, la nuit, la ville est censée être calme."],
  [34.62, 36.14, "Jeudi soir, je n'ai pas dormi."],
  [36.47, 40.10, "À minuit, depuis le sommet du phare, un faisceau a balayé les maisons"],
  [40.10, 41.67, "et déclenché tous les compteurs d'un coup :"],
  [41.90, 45.50, "M. Vane diffusait des sons enregistrés dans les rues pour faire grimper les amendes."],
  [45.78, 46.91, "Je suis monté jusqu'au phare."],
  [47.16, 50.49, "Là-haut, des écrans affichaient chaque habitant et le total de ses amendes."],
  [50.74, 54.26, "Mila, 90 € ; le pêcheur, 240..."],
  [54.49, 57.58, "Et tout en haut, en rouge : Léo, record de la semaine."],
  [57.80, 59.32, "Chaque amende remplissait son coffre."],
  [59.57, 62.80, "J'ai pris une photo avec mon téléphone : demain, tout le monde verrait la fraude."],
  [63.05, 65.65, "Mais derrière moi, clac, la porte en fer s'est verrouillée."],
  [65.87, 67.58, "Sur l'écran, M. Vane souriait :"],
  [67.83, 69.58, "« Personne ne quitte le phare avec les preuves. »"],
  [69.85, 71.33, "Et soudain, le sol a vibré."],
  [71.56, 73.22, "Le phare n'était pas ancré dans la roche :"],
  [73.37, 75.73, "il s'élevait dans les airs, emportant la salle avec lui."],
];

export const EV = {
  bikeBrake: 1.75, bikeBip: 2.05,
  stomp: 4.3,
  sneezeP: 6.5,
  leoSneeze: [14.75, 16.35],
  purse: 18.2,
  cascade: [24.1, 24.7, 25.2, 25.8, 26.3, 26.8, 27.2],
  night: 31.6,
  waves: [36.9, 38.2, 39.5, 40.6],
  allCounters: 40.6,
  fakeSounds: [42.2, 42.9, 43.6, 44.3, 45.0],
  climbStart: 45.7,
  interior: 47.1,
  milaScreen: 50.7, pecheurScreen: 52.5,
  bigScreen: 55.9,
  billsStart: 57.8,
  safeCounter: [58.0, 58.6, 59.2],
  photo: 60.7,
  doorSlam: 63.95,
  vaneOn: 65.9,
  glassesGlint: 67.0,
  rumble: 69.85,
  liftOff: 71.5,
  endTitle: 76.3,
  whooshes: [31.6, 47.1, 71.5],
};
