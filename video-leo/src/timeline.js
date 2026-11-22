// Timeline partagée entre le rendu 3D (navigateur) et la bande son (Node).
// Les répliques de la voix-off (LINES) seront ajoutées quand le texte sera fourni.

export const FPS = 30;
export const DURATION = 88;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// [début, fin, texte]
export const LINES = [];

export const EV = {
  // 1. Introduction
  boardFlash: [6.2],
  bikeBrake: 14.2,
  bikeBip: 14.55,
  crowdLook: 17.2,
  // 2. Le piège du silence
  milaSneeze: 26.6,
  purse: 30.8,
  whispers: [35.0, 36.4, 37.6],
  // 3. Nuit
  waveStart: 43.4,
  waves: [43.6, 44.8, 46.0, 47.2],
  climbStart: 48.2,
  // 4. Phare
  bigScreen: 57.6,
  billsStart: 62.0,
  safeCounter: [63.2, 64.6, 66.0],
  photo: 68.4,
  doorSlam: 71.8,
  vaneOn: 75.2,
  glassesGlint: 77.4,
  rumble: 80.0,
  liftOff: 83.0,
  endTitle: 86.4,
  whooshes: [20.0, 40.0, 52.0, 83.0],
};
