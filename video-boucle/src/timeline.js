// Timeline partagée (image + son), calée sur la voix-off (out/voix/voix.mp3 posée à +0.3 s).
export const FPS = 30;
export const DURATION = 79;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VOICE_OFFSET = 0.3;

export const LINES = [
  [0.30, 2.52, "Il a tordu la boucle de ses montagnes russes."],
  [2.76, 7.67, "Tu comprends, c'est la première attraction à faire passer les gens à l'envers et ça lui a coûté tout ce qu'il avait."],
  [7.97, 11.80, "Alors bien sûr, son rival la copie à l'identique, boulon par boulon."],
  [12.04, 16.38, "Mais la veille de l'ouverture, son mannequin de test revient écrasé comme une canette de soda."],
  [16.64, 22.86, "Comme il ne peut pas rater l'ouverture, il attrape un maillet et aplatit le bas de la boucle pour en faire une courbe large et douce."],
  [23.13, 24.56, "Est-ce qu'il sait vraiment ce qu'il fait ?"],
  [24.88, 25.36, "Pas vraiment."],
  [25.65, 33.31, "Son rival rit, puis se faufile et resserre les côtés jusqu'à ce que la boucle devienne haute et étroite, pour que le premier wagon casse comme une brindille."],
  [33.65, 37.46, "Le lendemain matin, toute la ville fait la queue devant le cercle parfait du rival."],
  [37.72, 39.55, "Et le rival monte devant pour faire le malin."],
  [39.82, 47.41, "Le propriétaire monte dans le sien et, quand son wagon bascule au sommet de la première descente, il finit par voir la boucle haute et étroite devant lui."],
  [47.69, 48.95, "Mais il est trop tard."],
  [49.26, 53.00, "Tu vois, une voiture peut passer un virage en épingle à 5 km/h,"],
  [53.26, 55.97, "mais prends-le à 100 km/h et elle part en tonneau."],
  [56.21, 58.53, "Un wagon va le plus vite tout en bas d'une boucle,"],
  [58.70, 62.69, "et un cercle parfait place un virage serré pile là — c'est ce qui a écrasé le mannequin."],
  [62.97, 65.01, "Mais son maillet a rendu le bas tout doux,"],
  [65.21, 70.31, "et le coup de vis du rival a déplacé le virage serré tout en haut, là où le wagon avance au ralenti."],
  [70.53, 72.65, "Alors il passe au-dessus sans une égratignure..."],
  [72.96, 76.24, "pendant que le wagon du rival percute le bas de ce cercle parfait."],
];

export const EV = {
  wallet: 6.1,
  rivalBuild: 8.2,
  testReturn: 14.2, crush: 15.3,
  mallet: 17.2,
  hammer: [19.4, 20.2, 21.0, 21.8, 22.6],
  question: 23.2, notReally: 24.9,
  rivalLaugh: 25.7,
  tighten: [28.6, 29.4, 30.2, 31.0],
  twig: 32.4,
  opening: 33.65,
  rivalFront: 37.75,
  ride: 39.85,
  crest: 44.2,
  tooLate: 47.7,
  slowCar: 49.3,
  fastCar: 53.2,
  roll: 55.0,
  diagCircle: 56.2, diagCrushed: 61.3,
  diagDrop: 62.97, diagTop: 67.0,
  safeLoop: 70.53,
  rivalDrop: 72.95,
  boom: 75.0,
  endTitle: 76.6,
  whooshes: [12.04, 33.65, 49.26, 56.2, 70.53],
};
