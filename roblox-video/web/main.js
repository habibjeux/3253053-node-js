import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { makeAvatar, SPECS, pose, walk } from './avatar.js';
import * as SETS from './sets.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 400);
let composer = null, bloom = null;
function draw(scene, strength = 0.7) {
  if (!composer) {
    composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), strength, 0.6, 0.82); composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  composer.passes[0].scene = scene; bloom.strength = strength;
  composer.render();
}
const av = (name, expr, pos = [0, 0, 0], ry = 0) => { const a = makeAvatar(SPECS[name]); a.position.set(...pos); a.rotation.y = ry; a.userData.setExpression(expr); return a; };
function look(p, target) { camera.position.set(...p); camera.lookAt(...target); camera.updateProjectionMatrix(); }

// quick previews of each set with the cast, for style validation
const PREVIEWS = {
  washitsu(t) {
    const S = SETS.setWashitsu(); const s = S.scene;
    const hero = av('hero', 'determined', [0, 0, -3.2]); pose(hero, { armL: [-0.2, 0, -0.1], armR: [-0.2, 0, 0.1], legL: [-1.5, 0, 0], legR: [-1.5, 0, 0], bob: -1.0 }); s.add(hero);
    const seats = [['adult', 'worried', [-4, 0, -0.5], 1.2], ['studentA', 'neutral', [4, 0, -0.5], -1.2], ['studentB', 'surprised', [-3.2, 0, 2.8], 2.4], ['adult', 'open', [3.2, 0, 2.8], -2.4]];
    for (const [n, e, p, r] of seats) { const a = av(n, e, p, r); pose(a, { legL: [-1.5, 0, 0], legR: [-1.5, 0, 0], bob: -1.0, armL: [-0.4, 0, 0], armR: [-0.4, 0, 0] }); s.add(a); }
    S.update(t); look([0, 6.2, 10.5], [0, 3.2, -1.5]); camera.fov = 42; draw(s, 0.8);
  },
  bedroom(t) {
    const S = SETS.setBedroom(); const s = S.scene;
    const gp = av('grandpa', 'sleep', [-1.5, 1.35, -0.25]); gp.rotation.x = -Math.PI / 2; pose(gp, { armL: [0, 0, -0.05], armR: [0, 0, 0.05] }); s.add(gp);
    const hero = av('hero', 'sad', [2.0, 0, -2.6], -1.9); pose(hero, { head: [0.3, 0, 0], armR: [-0.5, 0, 0.3] }); s.add(hero);
    S.update(t); look([4.8, 7.2, 7.5], [-0.6, 3.0, -3.6]); camera.fov = 42; draw(s, 0.6);
  },
  classroom(t) {
    const S = SETS.setClassroom(); const s = S.scene;
    const kids = [['studentA', 'neutral', [-7.5, 0, 0.6]], ['studentB', 'smile', [-2.5, 0, 0.6]], ['studentC', 'open', [2.5, 0, 0.6]], ['studentA', 'surprised', [-2.5, 0, 5.1]], ['studentC', 'worried', [2.5, 0, 5.1]]];
    for (const [n, e, p] of kids) { const a = av(n, e, p, Math.PI); pose(a, { legL: [-1.4, 0, 0], legR: [-1.4, 0, 0], bob: -0.55 }); s.add(a); }
    const hero = av('hero', 'determined', [5.5, 0, 9], -0.5); pose(hero, { armL: [0.1, 0, -0.1] }); s.add(hero);
    S.update(t); look([3, 8, 21], [0, 3.2, 0]); camera.fov = 44; draw(s, 0.6);
  },
  street(t) {
    const S = SETS.setStreet(); const s = S.scene;
    const hero = av('hero', 'determined', [-1.2, 0, 4], 0.15); walk(hero, t, 1, 0.4); s.add(hero);
    const mentor = av('mentor', 'blind', [3, 0, 0], -0.3); pose(mentor, { armL: [0, 0, -0.08], armR: [0, 0, 0.08] }); s.add(mentor);
    const b1 = av('studentA', 'angry', [-3.5, 0, -6], 0.2); s.add(b1); const b2 = av('studentB', 'open', [1.0, 0, -9], 0); s.add(b2); const b3 = av('studentC', 'scared', [-6, 0, -11], 0.4); s.add(b3);
    S.update(t); look([0.8, 5.3, 13.5], [0, 4.6, -4]); camera.fov = 40; draw(s, 0.9);
  },
  dark(t) {
    const S = SETS.setDark(); const s = S.scene;
    const c = SETS.creature(); c.position.set(0, 0, -10); s.add(c); SETS.animateCreature(c, t, 0.4);
    const hero = av('hero', 'determined', [-1.5, 0, 2], Math.PI * 0.9); pose(hero, { armL: [-0.3, 0, -0.5], armR: [-1.3, 0, 0.2], legL: [0.3, 0, 0], legR: [-0.3, 0, 0] }); s.add(hero);
    S.update(t); look([-4, 3.5, 11], [0, 6.5, -6]); camera.fov = 52; draw(s, 0.6);
  },
  props(t) {
    const S = SETS.setWashitsu(); const s = S.scene;
    const bx = SETS.woodBox(1); bx.position.set(-1.6, 1.13, 0.5); s.add(bx);
    const f = SETS.cursedFinger(); f.position.set(1.2, 1.13, 0.8); f.scale.setScalar(0.8); s.add(f);
    const u = SETS.oldUniform(); u.position.set(0, 1.13, -1.2); s.add(u);
    S.update(t); look([0, 3.6, 4.2], [0, 1.6, 0]); camera.fov = 44; draw(s, 0.6);
  },
};
window.preview = (name, t = 1) => { composer = null; PREVIEWS[name](t); };
window.ready = true;
