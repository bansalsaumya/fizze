import * as THREE from 'three';
import { createCan, updateCanLabel, FLAVOURS, setupRenderer, makeEnv, addLights } from './can.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const range = (p, a, b) => clamp01((p - a) / (b - a));
const ease = (t) => t * t * (3 - 2 * t);

function fit(renderer, camera, canvas) {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

/* ---------------- HERO: rotating can ---------------- */
export function createHeroScene(canvas) {
  const renderer = setupRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer);
  const rimLight = addLights(scene);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  const can = createCan('cola');
  scene.add(can);
  let spinBoost = 0;

  // floating droplets around the can
  const drops = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0, thickness: 0.3, ior: 1.33 }),
    60
  );
  const dropData = [];
  const m = new THREE.Matrix4();
  for (let i = 0; i < 60; i++) {
    dropData.push({ a: Math.random() * Math.PI * 2, r: 1.6 + Math.random() * 1.6, y: (Math.random() - 0.5) * 5, s: 0.4 + Math.random() * 1.4, sp: 0.2 + Math.random() * 0.5 });
  }
  scene.add(drops);

  let progress = 0, active = true;
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
  });

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!active) return;
    fit(renderer, camera, canvas);
    const t = clock.getElapsedTime();
    const mobile = canvas.clientWidth < 700;

    // scroll-driven rotation + gentle float + flavour switch spin boost
    spinBoost *= 0.9;
    can.rotation.y = progress * Math.PI * 4 + t * 0.15 + spinBoost;
    can.rotation.z = lerp(-0.18, 0.22, ease(progress)) + mouse.x * 0.1;
    can.rotation.x = 0.12 + mouse.y * 0.1 + Math.sin(progress * Math.PI) * 0.25;
    can.position.y = Math.sin(t * 1.2) * 0.08 - (mobile ? 0.6 : 0);
    can.position.x = mobile ? 0 : lerp(1.2, -0.2, ease(range(progress, 0.3, 1)));
    const s = (mobile ? 0.75 : 1) * lerp(1, 1.15, Math.sin(progress * Math.PI));
    can.scale.setScalar(s);

    dropData.forEach((d, i) => {
      const a = d.a + t * d.sp * 0.3 + progress * 3;
      m.makeScale(d.s, d.s, d.s);
      m.setPosition(can.position.x + Math.cos(a) * d.r, d.y + Math.sin(t * d.sp + i) * 0.2 + can.position.y, Math.sin(a) * d.r);
      drops.setMatrixAt(i, m);
    });
    drops.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  tick();

  return {
    setProgress: (p) => (progress = p),
    setActive: (v) => (active = v),
    setFlavour: (flavourKey) => {
      updateCanLabel(can, flavourKey);
      if (FLAVOURS[flavourKey]) rimLight.color.setHex(FLAVOURS[flavourKey].rim);
      spinBoost = Math.PI * 2;
    },
  };
}

/* ---------------- POUR: open → pour → bubbles ---------------- */
export function createPourScene(canvas) {
  const renderer = setupRenderer(canvas);
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer);
  addLights(scene, 0xffffff);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.2, 13);

  const root = new THREE.Group();
  scene.add(root);

  // can hangs from a pivot at its top so it pours from the mouth
  const pivot = new THREE.Group();
  const can = createCan('cola');
  can.position.y = -1.9;
  pivot.add(can);
  root.add(pivot);

  // glass (depthWrite: false + renderOrder: 10 so ruby drink & bubbles inside are 100% visible)
  const GLASS_X = 0.9, GLASS_BOTTOM = -3, GLASS_H = 2.6, R = 0.95;
  const glassPts = [
    new THREE.Vector2(0, GLASS_BOTTOM), new THREE.Vector2(R * 0.85, GLASS_BOTTOM),
    new THREE.Vector2(R * 0.88, GLASS_BOTTOM + 0.25), new THREE.Vector2(R, GLASS_BOTTOM + GLASS_H),
    new THREE.Vector2(R - 0.05, GLASS_BOTTOM + GLASS_H), new THREE.Vector2(R * 0.83, GLASS_BOTTOM + 0.3),
    new THREE.Vector2(0, GLASS_BOTTOM + 0.3),
  ];
  const glass = new THREE.Mesh(
    new THREE.LatheGeometry(glassPts, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  glass.position.x = GLASS_X;
  glass.renderOrder = 10;
  root.add(glass);

  // rim highlight ring on top of glass
  const glassRim = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.025, 0.025, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.65 })
  );
  glassRim.rotation.x = Math.PI / 2;
  glassRim.position.set(GLASS_X, GLASS_BOTTOM + GLASS_H, 0);
  root.add(glassRim);

  // glowing ruby red backlight inside the glass
  const rubyLight = new THREE.PointLight(0xff1a35, 18, 6);
  rubyLight.position.set(GLASS_X, GLASS_BOTTOM + 1.3, 0.4);
  root.add(rubyLight);

  // glowing Ruby Red / Cherry Fizz liquid inside glass (scaled on Y)
  const LIQ_BASE = GLASS_BOTTOM + 0.3, LIQ_MAX = 2.0;
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.8, 1, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xe60026,
      emissive: 0x6b0010,
      emissiveIntensity: 0.55,
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: 0.92,
    })
  );
  liquid.position.x = GLASS_X;
  liquid.renderOrder = 2;
  root.add(liquid);

  // pink-tinted fizzy foam head
  const foam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.895, 0.88, 0.14, 48),
    new THREE.MeshStandardMaterial({ color: 0xffd6de, emissive: 0x4a0814, emissiveIntensity: 0.25, roughness: 0.75 })
  );
  foam.position.x = GLASS_X;
  foam.renderOrder = 4;
  root.add(foam);

  // floating translucent ice cubes near top of drink
  const iceGroup = new THREE.Group();
  iceGroup.position.x = GLASS_X;
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffeef2,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 1,
    transparent: true,
    opacity: 0.72,
  });
  const iceGeo = new THREE.BoxGeometry(0.38, 0.34, 0.38);
  const iceCubes = [
    { x: -0.26, z: 0.18, rx: 0.3, ry: 0.5, rz: -0.2 },
    { x: 0.24, z: -0.15, rx: -0.4, ry: 0.2, rz: 0.35 },
    { x: 0.02, z: 0.26, rx: 0.2, ry: -0.6, rz: 0.15 },
  ].map((cfg) => {
    const msh = new THREE.Mesh(iceGeo, iceMat);
    msh.position.set(cfg.x, 0, cfg.z);
    msh.rotation.set(cfg.rx, cfg.ry, cfg.rz);
    msh.renderOrder = 3;
    iceGroup.add(msh);
    return { msh, ...cfg };
  });
  root.add(iceGroup);

  // pouring ruby stream
  const stream = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.11, 1, 20),
    new THREE.MeshPhysicalMaterial({
      color: 0xff0f35,
      emissive: 0x8a0018,
      emissiveIntensity: 0.65,
      roughness: 0.08,
      clearcoat: 1,
      transparent: true,
      opacity: 0.94,
    })
  );
  stream.renderOrder = 5;
  root.add(stream);

  // sparkling ruby & pink bubbles rising in glass
  const BUB = 160;
  const bubbles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.038, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffb3c1,
      emissive: 0xff1e42,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    }),
    BUB
  );
  bubbles.renderOrder = 6;
  const bub = Array.from({ length: BUB }, () => ({ a: Math.random() * 6.28, r: Math.random() * 0.76, y: Math.random(), sp: 0.18 + Math.random() * 0.45, s: 0.5 + Math.random() * 1.1 }));
  root.add(bubbles);

  // splash droplets from opening
  const SPR = 45;
  const spray = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.042, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xcc0022, emissiveIntensity: 0.6, transparent: true, opacity: 0.9 }),
    SPR
  );
  const spr = Array.from({ length: SPR }, () => ({ vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 2, vz: (Math.random() - 0.5) * 1.5 }));
  root.add(spray);

  let progress = 0, active = true;
  const m = new THREE.Matrix4();
  const clock = new THREE.Clock();
  const top = new THREE.Vector3();

  function tick() {
    requestAnimationFrame(tick);
    if (!active) return;
    fit(renderer, camera, canvas);
    const t = clock.getElapsedTime();
    const mobile = canvas.clientWidth < 700;
    root.scale.setScalar(mobile ? 0.7 : 1);
    root.position.set(mobile ? -0.3 : 0.6, mobile ? -0.4 : 0.4, 0);

    const pOpen = ease(range(progress, 0.05, 0.3));
    const pMove = ease(range(progress, 0.3, 0.45));
    const pTilt = ease(range(progress, 0.38, 0.55));
    const pFill = ease(range(progress, 0.45, 0.8));
    const pBack = ease(range(progress, 0.8, 0.95));

    // phase 1: open tab
    const { tabPivot, hole } = can.userData;
    tabPivot.rotation.x = -pOpen * 1.3;
    hole.visible = pOpen > 0.5;

    // phase 2: move over glass & tilt, phase 3: return
    const moveAmt = pMove * (1 - pBack);
    const tiltAmt = pTilt * (1 - pBack);
    pivot.position.set(lerp(-1.6, GLASS_X - 0.55, moveAmt), lerp(1.9, 1.5 + 0.25 * tiltAmt, moveAmt), 0);
    pivot.rotation.z = -tiltAmt * 2.0;
    pivot.rotation.y = lerp(0.5, 0, moveAmt) + (1 - moveAmt) * Math.sin(t * 0.6) * 0.15;

    // liquid level
    const level = Math.max(0.001, pFill * LIQ_MAX);
    liquid.scale.y = level;
    liquid.position.y = LIQ_BASE + level / 2;
    liquid.visible = pFill > 0.001;
    foam.visible = pFill > 0.02;
    foam.position.y = LIQ_BASE + level + 0.05 + Math.sin(t * 3) * 0.01;
    foam.scale.y = 1 + pFill * 1.5;

    // bobbing ice cubes floating near surface of the ruby drink
    iceGroup.visible = pFill > 0.08;
    iceGroup.position.y = LIQ_BASE + Math.max(0.22, level - 0.12);
    iceCubes.forEach((ic, idx) => {
      ic.msh.position.y = Math.sin(t * 2.2 + idx * 2) * 0.04;
      ic.msh.rotation.x = ic.rx + Math.sin(t * 1.5 + idx) * 0.12;
      ic.msh.rotation.z = ic.rz + Math.cos(t * 1.3 + idx) * 0.12;
    });

    // stream from can mouth to liquid surface
    can.userData.hole.getWorldPosition(top);
    root.worldToLocal(top);
    const pouring = tiltAmt > 0.75 && pFill < 1 && pBack < 0.05;
    stream.visible = pouring;
    if (pouring) {
      const surface = LIQ_BASE + level;
      const len = Math.max(0.01, top.y - surface);
      stream.scale.set(1 + Math.sin(t * 30) * 0.08, len, 1);
      stream.position.set(top.x, surface + len / 2, 0.2);
    }

    // bubbles rise inside liquid
    bub.forEach((b, i) => {
      b.y += b.sp * 0.008 * (0.5 + pFill);
      if (b.y > 1) b.y = 0;
      const sc = pFill > 0.05 ? b.s : 0;
      m.makeScale(sc, sc, sc);
      m.setPosition(GLASS_X + Math.cos(b.a + t) * b.r, LIQ_BASE + b.y * level, Math.sin(b.a + t) * b.r);
      bubbles.setMatrixAt(i, m);
    });
    bubbles.instanceMatrix.needsUpdate = true;

    // spray burst while opening
    const burst = range(progress, 0.15, 0.32);
    spr.forEach((s, i) => {
      const k = burst > 0 && burst < 1 ? burst : 0;
      const sc = k ? 1 - k : 0;
      m.makeScale(sc, sc, sc);
      m.setPosition(top.x + s.vx * k, top.y + s.vy * k - 2 * k * k, s.vz * k);
      spray.setMatrixAt(i, m);
    });
    spray.instanceMatrix.needsUpdate = true;

    root.rotation.y = Math.sin(t * 0.4) * 0.06;
    renderer.render(scene, camera);
  }
  tick();

  return {
    setProgress: (p) => (progress = p),
    setActive: (v) => (active = v),
    setFlavour: (flavourKey) => {
      updateCanLabel(can, flavourKey);
      if (FLAVOURS[flavourKey]) rimLight.color.setHex(FLAVOURS[flavourKey].rim);
      spinBoost = Math.PI * 2;
    },
  };
}

