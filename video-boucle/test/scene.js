// Image de test « style détaillé » : décor 3D enrichi (ciel physique, collines, herbe en brins, treillis, bloom)
// + personnage dessiné en 2D incrusté.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { drawStick } from './draw2d.js';

const W = 1080, H = 1920;
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const canvas = document.getElementById('out');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 4000);

// ---- ciel en dégradé (bleu franc) + environnement ----
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(50), THREE.MathUtils.degToRad(210));
const skyGeo = new THREE.SphereGeometry(3000, 32, 16); const sc0 = []; const sp0 = skyGeo.attributes.position;
for (let i = 0; i < sp0.count; i++) { const y = sp0.getY(i) / 3000; const k = Math.pow(Math.max(0, y), 0.45); const c = new THREE.Color('#bfe2ff').lerp(new THREE.Color('#1f6fe5'), k); sc0.push(c.r, c.g, c.b); }
skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(sc0, 3));
const skyMesh = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, toneMapped: false })); scene.add(skyMesh);
const pmrem = new THREE.PMREMGenerator(renderer); const skyScene = new THREE.Scene(); skyScene.add(skyMesh.clone());
scene.environment = pmrem.fromScene(skyScene).texture; scene.environmentIntensity = 0.8;
const sun = new THREE.DirectionalLight('#fff1dc', 3.6); sun.position.copy(sunDir).multiplyScalar(80); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.far = 300; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04; sun.shadow.radius = 3;
scene.add(sun); scene.add(new THREE.HemisphereLight('#bcd8ff', '#5d7a3a', 0.9));
scene.fog = new THREE.FogExp2('#bcdcff', 0.0016);

// ---- terrain vallonné ----
const hgt = (x, z) => { const d = Math.hypot(x, z + 10); const flat = Math.min(1, Math.max(0, (d - 30) / 60)); return flat * (6 * Math.sin(x * 0.02 + 1) * Math.cos(z * 0.025) + 4 * Math.sin(x * 0.05 + z * 0.03) + 3) ; };
const tg = new THREE.PlaneGeometry(900, 900, 240, 240); tg.rotateX(-Math.PI / 2);
const pos = tg.attributes.position; const cols = new Float32Array(pos.count * 3);
for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, hgt(x, z)); const n = hash(Math.floor(x * 0.4) * 13 + Math.floor(z * 0.4)); const c = new THREE.Color().setHSL(0.26 + n * 0.05, 0.7, 0.2 + n * 0.07); cols.set([c.r, c.g, c.b], i * 3); }
tg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); tg.computeVertexNormals();
const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); terrain.receiveShadow = true; scene.add(terrain);
// terre battue autour du tableau
const dirtT = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const g = x.createRadialGradient(256, 256, 40, 256, 256, 256); g.addColorStop(0, 'rgba(150,104,64,1)'); g.addColorStop(0.7, 'rgba(140,100,62,.85)'); g.addColorStop(1, 'rgba(140,100,62,0)'); x.fillStyle = g; x.fillRect(0, 0, 512, 512); for (let k = 0; k < 3000; k++) { x.fillStyle = `rgba(${hash(k) > .5 ? '90,60,35' : '190,150,100'},${hash(k + 1) * 0.3})`; x.fillRect(hash(k + 2) * 512, hash(k + 3) * 512, 3, 3); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const dirt = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshStandardMaterial({ map: dirtT, transparent: true, roughness: 1, depthWrite: false })); dirt.rotation.x = -Math.PI / 2; dirt.position.set(0, 0.02, 3.5); dirt.receiveShadow = true; scene.add(dirt);
const path = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 80), new THREE.MeshStandardMaterial({ color: '#a8794a', roughness: 1 })); path.rotation.x = -Math.PI / 2; path.rotation.z = 0.5; path.position.set(-14, 0.03, -18); path.receiveShadow = true; scene.add(path);

// ---- herbe en brins (instanciée) ----
{
  const blade = new THREE.BufferGeometry(); blade.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.022, 0, 0, 0.022, 0, 0, 0, 0.2, 0.015]), 3)); blade.computeVertexNormals();
  const N = 240000; const im = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.9 }), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(hash(i)) * 34, a = hash(i + 1) * Math.PI * 2; const x = 1 + Math.cos(a) * r, z = 2 + Math.sin(a) * r * 1.4;
    if (Math.hypot((x - 0) / 6.2, (z - 3.5) / 4.2) < 1 && hash(i + 9) > 0.15) continue;
    if (Math.hypot(x - 4.5, z - 14) < 5) continue;
    p.set(x, hgt(x, z), z); e.set((hash(i + 2) - 0.5) * 0.7, hash(i + 3) * 6.28, (hash(i + 4) - 0.5) * 0.7); q.setFromEuler(e); const k = 0.6 + hash(i + 5) * 1.1; s.set(k, k * (0.8 + hash(i + 6) * 0.9), k);
    m.compose(p, q, s); im.setMatrixAt(i, m); c.setHSL(0.24 + hash(i + 7) * 0.08, 0.65, 0.2 + hash(i + 8) * 0.16); im.setColorAt(i, c);
  }
  im.receiveShadow = true; scene.add(im);
}
// ---- arbres ----
{
  const trunkG = new THREE.CylinderGeometry(0.25, 0.4, 3, 7), leafG = new THREE.IcosahedronGeometry(1, 2);
  const trunk = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: '#5b4330', roughness: 1 }), 120);
  const leaves = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), 120 * 4);
  const m = new THREE.Matrix4(), c = new THREE.Color(); let li = 0, ti = 0;
  for (let k = 0; k < 120; k++) {
    const a = hash(k) * Math.PI * 2, r = 38 + hash(k + 1) * 140; const x = Math.cos(a) * r, z = Math.sin(a) * r - 30; if (z > 10 && Math.abs(x) < 30) continue; if (Math.abs(x) < 18 && z < 0 && z > -70) continue;
    const y = hgt(x, z), sc2 = 0.8 + hash(k + 2) * 0.9;
    m.compose(new THREE.Vector3(x, y + 1.5 * sc2, z), new THREE.Quaternion(), new THREE.Vector3(sc2, sc2, sc2)); trunk.setMatrixAt(ti++, m);
    for (let j = 0; j < 4; j++) { const o = [[0, 4.2, 0, 2.4], [1.2, 3.6, 0.4, 1.7], [-1.1, 3.8, -0.3, 1.8], [0.2, 5.3, 0.2, 1.6]][j]; m.compose(new THREE.Vector3(x + o[0] * sc2, y + o[1] * sc2, z + o[2] * sc2), new THREE.Quaternion(), new THREE.Vector3(o[3] * sc2, o[3] * sc2 * 0.9, o[3] * sc2)); leaves.setMatrixAt(li, m); c.setHSL(0.27 + hash(k * 4 + j) * 0.06, 0.55, 0.26 + hash(k + j) * 0.1); leaves.setColorAt(li++, c); }
  }
  trunk.castShadow = leaves.castShadow = true; leaves.count = li; trunk.count = ti; scene.add(trunk); scene.add(leaves);
}

// ---- boucle blanche en treillis ----
const white = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.05, roughness: 0.45, emissive: '#cfd8e6', emissiveIntensity: 0.25 });
function truss(curvePts, closed = false) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(curvePts, closed); const n = 400; const fr = [];
  for (let i = 0; i <= n; i++) { const u = i / n; const p = curve.getPointAt(u), T = curve.getTangentAt(u); const up = new THREE.Vector3(0, 0, 1).cross(T).normalize(); const side = T.clone().cross(up).normalize(); fr.push({ p, T, up, side }); }
  const rail = (sx, uy, r) => { const pts = fr.map((f) => f.p.clone().addScaledVector(f.side, sx).addScaledVector(f.up, uy)); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), n, r, 8, closed), white); m.castShadow = true; g.add(m); return pts; };
  const L = rail(0.55, 0, 0.09), Rr = rail(-0.55, 0, 0.09), S = rail(0, -0.9, 0.16);
  const brace = new THREE.CylinderGeometry(0.035, 0.035, 1, 5); const bm = new THREE.InstancedMesh(brace, white, n * 4); let bi = 0; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const add = (a, b) => { const d = b.clone().sub(a); const len = d.length(); q.setFromUnitVectors(Y, d.normalize()); m.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, len, 1)); bm.setMatrixAt(bi++, m); };
  for (let i = 0; i < n; i += 3) { add(L[i], S[i]); add(Rr[i], S[i]); add(L[i], Rr[i]); if (i + 3 <= n) add(L[i], S[Math.min(n, i + 3)]); }
  bm.count = bi; bm.castShadow = true; g.add(bm);
  return g;
}
const loopC = new THREE.Vector3(-4, 0, -26), R0 = 15;
const loopPts = []; for (let i = 0; i <= 120; i++) { const th = -Math.PI / 2 + i / 120 * Math.PI * 2; loopPts.push(new THREE.Vector3(loopC.x + Math.cos(th) * R0, 1.6 + R0 + Math.sin(th) * R0, loopC.z + (i / 120 - 0.5) * 2.4)); }
const pre = [new THREE.Vector3(-48, 1.6, loopC.z - 1.2), new THREE.Vector3(-30, 1.6, loopC.z - 1.2)];
const post = [new THREE.Vector3(18, 1.6, loopC.z + 1.2), new THREE.Vector3(48, 1.6, loopC.z + 1.2)];
scene.add(truss([...pre, ...loopPts.slice(1, -1), ...post]));
// colonnes de soutien
for (const [x, h] of [[-28, 1.6], [-19, 8], [11, 8], [16, 1.6]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, Math.max(h, 1.6) + 0.6, 10), white); c.position.set(x, (Math.max(h, 1.6) + 0.6) / 2 - 0.6, loopC.z); c.castShadow = true; scene.add(c); }
// ---- grue jaune ----
{
  const yel = new THREE.MeshStandardMaterial({ color: '#f2b705', metalness: 0.3, roughness: 0.45 }); const g = new THREE.Group(); g.position.set(14, 0, -30); scene.add(g);
  const mast = new THREE.Mesh(new THREE.BoxGeometry(1.2, 30, 1.2), yel); mast.position.y = 15; mast.castShadow = true; g.add(mast);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(34, 0.7, 0.7), yel); boom.position.set(-12, 30, 0); boom.rotation.z = -0.12; boom.castShadow = true; g.add(boom);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2, 1.8, 2), yel); cab.position.y = 29; g.add(cab);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 4), new THREE.MeshStandardMaterial({ color: '#222' })); cable.position.set(-26, 26.5, 0); cable.scale.y = 3.5; g.add(cable);
}
// ---- grande roue au loin ----
{
  const g = new THREE.Group(); g.position.set(26, 0, -70); scene.add(g); const wm = new THREE.MeshStandardMaterial({ color: '#e9eef5', metalness: 0.4, roughness: 0.35 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(16, 0.35, 8, 80), wm); ring.position.y = 19; g.add(ring);
  for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 16, 4), wm); sp.position.set(Math.cos(a) * 8, 19 + Math.sin(a) * 8, 0); sp.rotation.z = a - Math.PI / 2; g.add(sp); const gd = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: ['#e53935', '#fdd835', '#1e88e5', '#43a047'][k % 4] })); gd.position.set(Math.cos(a) * 16, 19 + Math.sin(a) * 16 - 1.2, 0); g.add(gd); }
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 21, 6), wm); l.position.set(s * 4, 9.5, 0); l.rotation.z = s * 0.2; g.add(l); }
}
// ---- nuages (billboards doux) ----
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let k = 0; k < 30; k++) { const g = x.createRadialGradient(128 + (hash(k) - 0.5) * 120, 140 + (hash(k + 1) - 0.5) * 50, 0, 128 + (hash(k) - 0.5) * 120, 140 + (hash(k + 1) - 0.5) * 50, 40 + hash(k + 2) * 40); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  for (let k = 0; k < 10; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, color: '#ffffff', toneMapped: false })); s.position.set(-200 + hash(k + 50) * 400, 70 + hash(k + 51) * 60, -250 - hash(k + 52) * 200); s.scale.set(90 + hash(k) * 60, 40 + hash(k + 3) * 20, 1); scene.add(s); }
}
// ---- tableau à craie sur chevalet ----
{
  const g = new THREE.Group(); g.position.set(-1.6, 0, 3.4); g.rotation.y = 0.4; scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.7 });
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.12), wood); l.position.set(s * 1.0, 1.2, 0); l.rotation.x = -0.12; l.castShadow = true; g.add(l); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 0.1), wood); back.position.set(0, 1.15, -0.5); back.rotation.x = 0.35; g.add(back);
  const bt = (() => { const c = document.createElement('canvas'); c.width = 768; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#16324d'; x.fillRect(0, 0, 768, 512); x.strokeStyle = 'rgba(230,240,255,.85)'; x.lineWidth = 5; x.beginPath(); x.arc(470, 240, 120, 0, 7); x.stroke(); x.beginPath(); x.moveTo(60, 420); x.bezierCurveTo(200, 420, 280, 380, 360, 330); x.stroke(); x.font = 'bold 54px "DejaVu Sans"'; x.fillStyle = 'rgba(255,120,120,.9)'; x.fillText('PLAN', 40, 80); x.fillStyle = 'rgba(230,240,255,.85)'; x.font = '30px "DejaVu Sans"'; x.fillText('BOUCLE R = 15 m', 40, 130); x.fillText('h = 30 m', 40, 170); x.font = '22px "DejaVu Sans"'; x.fillText('v² = 2·g·h', 560, 470); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.08), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: bt, roughness: 0.9 }), wood]); board.position.set(0, 1.85, 0.05); board.rotation.x = -0.12; board.castShadow = true; g.add(board);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.75, 0.06), wood); frame.position.set(0, 1.85, 0.0); frame.rotation.x = -0.12; g.add(frame);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.25), wood); tray.position.set(0, 1.0, 0.18); g.add(tray);
}
// ---- personnage dessiné (billboard) ----
const charC = document.createElement('canvas'); charC.width = 512; charC.height = 1024;
drawStick(charC.getContext('2d'), 512, 1024, { body: 'vest', hair: 'slick', face: 'smug', pose: { armL: [[-60, 0], [-110, 90], [-150, 150]], armR: [[60, 0], [110, 120], [70, 210]] } });
const ct = new THREE.CanvasTexture(charC); ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 8;
const charMat = new THREE.MeshBasicMaterial({ map: ct, transparent: true, alphaTest: 0.02, toneMapped: false });
const person = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 4.0), charMat); person.position.set(1.4, 2.0, 4.2); scene.add(person);
const shadowC = document.createElement('canvas'); shadowC.width = 128; shadowC.height = 64; { const x = shadowC.getContext('2d'); const g = x.createRadialGradient(64, 32, 4, 64, 32, 60); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 64); }
const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowC), transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.set(1.8, 0.04, 4.5); scene.add(blob);

// ---- caméra + post-traitement ----
camera.position.set(3.6, 1.7, 13.5); camera.lookAt(-1.2, 6.2, -10); camera.fov = 56; camera.updateProjectionMatrix();
person.lookAt(camera.position.x, person.position.y, camera.position.z);
if (location.search.includes("noperson")) person.visible = false;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.18, 0.5, 0.97));
composer.addPass(new OutputPass());
composer.render();
window.DONE = true;
