// Timeline partagée entre le rendu 3D (navigateur) et la bande son (Node).
// Toutes les valeurs sont en secondes.

export const FPS = 30;
export const DURATION = 88;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Voix-off découpée en répliques (sous-titres type TikTok).
export const LINES = [
  // 1. Introduction
  [0.3, 3.4, "Dans cette ville, toucher le sol coûte 10 €."],
  [3.4, 6.8, "Un pas, ding, 10 € ; deux pas, ding ding, 20."],
  [6.8, 12.6, "Alors ici, on marche sur des échasses, on glisse sur des câbles, et les riches prennent le téléphérique."],
  [12.6, 15.4, "Moi, c'est Nathan et je tombe tout le temps."],
  [15.4, 17.4, "Boum, 10 € ; boum boum, 30."],
  [17.4, 20.0, "À l'école, on m'appelle Patatra."],
  // 2. Le piège de la glace
  [20.0, 23.2, "Le téléphérique appartient à Gaspard, 50 € le trajet."],
  [23.2, 26.5, "Mais depuis un mois, je ne suis plus le seul à tomber :"],
  [26.5, 30.0, "le facteur, la boulangère et même ma petite voisine Zoé, 6 ans."],
  [30.0, 34.0, "Hier, Zoé est tombée 40 fois : 400 €, toute sa tirelire."],
  [34.0, 36.2, "Mais il n'avait pas neigé,"],
  [36.2, 40.0, "pourtant chaque matin, la rue était couverte de glace."],
  // 3. L'enquête de nuit
  [40.0, 42.6, "Mardi soir, je ne me suis pas couché."],
  [42.6, 46.6, "À minuit, la cabine de Gaspard est passée au-dessus de la rue avec un gros tuyau :"],
  [46.6, 48.8, "il arrosait la rue toute la nuit."],
  [48.8, 52.0, "Je me suis accroché sous sa cabine jusqu'en haut."],
  // 4. La révélation & le piège final
  [52.0, 53.6, "Là-haut, des écrans :"],
  [53.6, 56.0, "sur chacun, un nom et un nombre de chutes."],
  [56.0, 58.4, "Zoé 40, le facteur 112..."],
  [58.4, 62.6, "Et tout en haut, en rouge : Nathan, 3 000 chutes, meilleur client."],
  [62.6, 67.2, "Chaque chute remplissait son coffre : 10 €, 1 000, 1 million."],
  [67.2, 70.6, "J'ai pris une photo : demain, toute la ville saurait."],
  [70.6, 73.4, "Mais derrière moi, clac, la porte s'est fermée."],
  [73.4, 75.0, "« Laissez-moi sortir ! »"],
  [75.0, 77.0, "Gaspard souriait derrière la vitre :"],
  [77.0, 79.8, "« Mon meilleur client ne part jamais. »"],
  [79.8, 81.8, "Et la salle s'est mise à bouger."],
  [81.8, 83.8, "Ce n'était pas une salle, c'était une cabine,"],
  [83.8, 86.6, "et elle montait vers le sommet d'où personne n'est jamais redescendu."],
];

// Événements (partagés image + son)
export const EV = {
  // pas payants d'un villageois (plan B) : ding + popup
  dings: [4.0, 5.55, 5.85],
  // pas des villageois sur le plan large (plan A)
  wideDings: [0.9, 1.5, 2.1, 2.6, 3.0],
  // chutes de Nathan (plans D et E)
  nathanFalls: [15.55, 16.35, 16.85, 18.2],
  // chutes rue verglacée (plan G)
  facteurFall: 24.1,
  boulangereFall: 27.0,
  zoeFall: 28.6,
  zoeCry: 30.4,
  // nuit
  cabinPass: 43.0,
  sprayStart: 44.2,
  sprayEnd: 48.8,
  nathanJump: 49.6,
  // intérieur
  bigScreen: 58.9,
  coinsStart: 62.6,
  counter: [63.6, 64.8, 66.0], // 10 €, 1 000, 1 000 000
  photo: 68.0,
  doorSlam: 71.6,
  monocleGlint: 76.2,
  roomShake: 80.0,
  reveal: 81.8,
  endTitle: 86.4,
  whooshes: [20.0, 40.0, 52.0, 81.8],
};
