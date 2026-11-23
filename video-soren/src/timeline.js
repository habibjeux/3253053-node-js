// Timeline partagée (image + son). Minutage provisoire du storyboard : à recaler sur la voix-off.
export const FPS = 30;
export const DURATION = 86;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const VOICE_OFFSET = 0;

// [début, fin, texte] — rempli quand la voix-off sera fournie
export const LINES = [];

export const EV = {
  hookCrack: 1.0,
  ruleClock: 15.2,
  ruleLook: 16.4,
  ruleCrack: 16.9,
  mayaStare: 21.0,
  mirrorFreeze: 27.5,
  mirrorDetach: 31.0,
  mirrorCrack: 34.0,
  noReflection: 36.5,
  nightTitle: 40.0,
  reflectionsSlide: 42.5,
  gears: 46.0,
  climb: 49.0,
  screensPan: 52.0,
  bigScreen: 58.4,
  photo: 63.2,
  doorLock: 66.0,
  guardian: 69.5,
  lever: 73.5,
  tremble: 75.0,
  reveal: 78.0,
  endTitle: 83.5,
  whooshes: [20, 40, 52, 78],
};
