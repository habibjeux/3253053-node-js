// Timeline partagée (image + son), calée sur la voix-off (out/voix/voix.mp3 posée à +0.3 s).
export const FPS = 30;
export const DURATION = 101;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VOICE_OFFSET = 0.3;

export const LINES = [
  [0.30, 3.80, "Dans cette ville, personne n'a le droit de regarder le ciel après minuit."],
  [4.25, 8.08, "Une seconde à lever les yeux, un léger crépitement, et ton reflet change ;"],
  [8.36, 11.64, "deux secondes, un bourdonnement sourd, et il ne te suit plus."],
  [11.95, 17.08, "Alors ici, tout le monde garde la tête baissée dès que la nuit tombe et marche en fixant ses chaussures."],
  [17.47, 20.41, "Moi, c'est Soren, et je suis le livreur de nuit de la ville."],
  [20.81, 24.29, "Un regard en l'air, un léger crépitement, et mon reflet s'arrête ;"],
  [24.57, 28.26, "un autre, un bourdonnement sourd, et il me sourit depuis la vitrine."],
  [28.66, 34.15, "À l'atelier, les anciens disent que les reflets qui s'échappent montent vers la grande tour de verre qui domine le centre."],
  [34.40, 38.19, "Mais depuis trois semaines, des gens perdent leur reflet même sans lever les yeux :"],
  [38.49, 41.90, "le boulanger, le gardien de nuit et même ma petite sœur Maya."],
  [42.25, 44.76, "Hier, Maya a croisé un miroir dans le couloir :"],
  [45.01, 48.74, "son reflet est resté planté là pendant que le reste de la maison s'assombrissait."],
  [49.04, 51.79, "Pourtant, la nuit, personne n'est censé sortir."],
  [52.18, 53.92, "Mercredi soir, je n'ai pas dormi."],
  [54.25, 59.18, "À minuit, j'ai vu des dizaines de reflets glisser le long des murs et monter vers la tour de verre :"],
  [59.46, 63.02, "ils actionnaient de grands leviers qui déplaçaient les ombres de toute la ville."],
  [63.33, 64.36, "J'ai grimpé jusqu'en haut."],
  [64.69, 68.10, "Là-haut, des écrans affichaient chaque habitant et l'état de son reflet :"],
  [68.45, 71.42, "Maya, isolée ; le boulanger, perdu..."],
  [71.78, 75.34, "Et tout en haut, en rouge : Soren, reflet de remplacement."],
  [75.70, 79.39, "J'ai pris une photo : demain, toute la ville verrait ce qui volait nos images."],
  [79.73, 82.54, "Mais derrière moi, clac, la porte s'est verrouillée."],
  [82.89, 84.82, "Le gardien de la tour s'est retourné en souriant :"],
  [85.12, 87.44, "« Un reflet ne retourne jamais à sa place. »"],
  [87.81, 89.73, "Et la pièce entière s'est mise à trembler."],
  [90.09, 91.40, "Ce n'était pas le sommet de la tour :"],
  [91.68, 93.54, "la salle était suspendue dans le vide,"],
  [93.77, 97.44, "et les vitres autour de moi montraient des dizaines de Soren qui me regardaient tous en même temps."],
];

export const EV = {
  ruleLook: 4.5, ruleCrack: 6.1, ruleChange: 7.6, ruleHum: 9.7, ruleStop: 11.0,
  sorenLook: 21.0, sorenCrack: 22.4, sorenStop: 23.7, sorenHum: 25.9, sorenSmile: 27.2,
  lostBoul: 38.5, lostVeil: 39.7, lostMaya: 40.8,
  mayaMirror: 42.25, mayaLeave: 45.0,
  night: 49.0,
  reflectionsSlide: 54.25,
  gears: 59.46,
  climb: 63.33,
  screensPan: 64.7, mayaCard: 68.45, boulCard: 70.66,
  bigScreen: 73.0,
  photo: 76.5,
  doorLock: 81.0,
  guardianTurn: 83.2,
  tremble: 87.81,
  reveal: 90.09,
  doublesStare: 93.77,
  endTitle: 97.8,
  whooshes: [11.95, 17.4, 28.3, 42.25, 49.0, 64.7, 90.09],
};
