import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export const FLAVOURS = {
  cola: { name: 'CLASSIC COLA', sub: 'BOLD SPARKLING COLA', color: '#e10600', dark: '#8c0300', accent: '#ffffff', rim: 0xff2a2a },
  lemon: { name: 'LEMON ZEST', sub: 'CRISP CITRUS SPARKLE', color: '#f2c200', dark: '#b58e00', accent: '#124a1e', rim: 0xffe640 },
  orange: { name: 'ORANGE POP', sub: 'JUICY TANGY FIZZ', color: '#ff6a00', dark: '#b34600', accent: '#ffffff', rim: 0xff8830 },
  berry: { name: 'BERRY BLAST', sub: 'WILD MIXED BERRY', color: '#8a1d6b', dark: '#4f0c3c', accent: '#ffd0ee', rim: 0xe040b0 },
};

const texCache = {};

function drawIcon(g, key, x, y, r, col) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 6;
  if (key === 'lemon' || key === 'orange') {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(0, 0, r * 0.82, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
      g.stroke();
    }
  } else if (key === 'berry') {
    for (const [bx, by, br] of [[-18, 10, 22], [18, 10, 22], [0, -16, 24], [0, 18, 20]]) {
      g.beginPath();
      g.arc(bx, by, br, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // cola fizz star + bubbles
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.beginPath();
      g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      g.stroke();
    }
  }
  g.restore();
}

/** Draws the can label on a 2D canvas and returns a texture (supports optional customName) */
export function makeLabel(flavourKey, customName = '') {
  const cleanName = customName.trim().toUpperCase().slice(0, 14);
  const cacheKey = `${flavourKey}:${cleanName}`;
  if (texCache[cacheKey]) return texCache[cacheKey];
  const f = FLAVOURS[flavourKey] || FLAVOURS.cola;
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext('2d');

  // brushed silver metallic base
  const grad = g.createLinearGradient(0, 0, c.width, c.height);
  grad.addColorStop(0, '#f7f7f9');
  grad.addColorStop(0.25, '#dcdce2');
  grad.addColorStop(0.5, '#f5f5f7');
  grad.addColorStop(0.75, '#ceced6');
  grad.addColorStop(1, '#f4f4f6');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  // subtle diagonal pinstripes
  g.save();
  g.strokeStyle = 'rgba(0,0,0,0.035)';
  g.lineWidth = 4;
  for (let x = -c.height; x < c.width + c.height; x += 28) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + c.height, c.height);
    g.stroke();
  }
  g.restore();

  // fine brushed lines
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.28})`;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 80 + Math.random() * 260, 1.5);
  }

  // top & bottom colour wave bands
  const wgrad = g.createLinearGradient(0, 560, 0, c.height);
  wgrad.addColorStop(0, f.color);
  wgrad.addColorStop(1, f.dark);
  g.fillStyle = wgrad;
  g.beginPath();
  g.moveTo(0, 620);
  for (let x = 0; x <= c.width; x += 16) {
    g.lineTo(x, 635 + Math.sin((x / c.width) * Math.PI * 4) * 55);
  }
  g.lineTo(c.width, c.height);
  g.lineTo(0, c.height);
  g.fill();

  // accent wave highlight line
  g.strokeStyle = f.accent;
  g.lineWidth = 6;
  g.beginPath();
  for (let x = 0; x <= c.width; x += 16) {
    const y = 620 + Math.sin((x / c.width) * Math.PI * 4) * 55;
    x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
  }
  g.stroke();

  // top colour crown band + dark pinstripe
  g.fillStyle = f.color;
  g.fillRect(0, 0, c.width, 78);
  g.fillStyle = '#111';
  g.fillRect(0, 78, c.width, 8);

  // carbonation bubbles across the wave
  for (let i = 0; i < 120; i++) {
    const bx = Math.random() * c.width;
    const by = 520 + Math.random() * 480;
    const br = 3 + Math.random() * 16;
    g.beginPath();
    g.arc(bx, by, br, 0, Math.PI * 2);
    g.fillStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.22})`;
    g.fill();
  }

  // CylinderGeometry starts UV u=0 at +Z (Wait: u=0.5 is directly facing +Z!).
  // Put main front face at x = 1024 (u=0.5, directly facing camera at rot.y = 0)
  // and second hero face at x = 0 & 2048 (back), with side panels at x = 512 and 1536!
  const drawFront = (cx) => {
    g.save();
    g.translate(cx, 0);

    // top pill tag
    g.fillStyle = '#fff';
    g.font = '700 26px "DM Sans", Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('★  SPARKLING CRAFT DRINK  ★', 0, 50);

    // ZERO SUGAR badge pill
    g.fillStyle = '#111';
    g.beginPath();
    g.roundRect(-170, 118, 340, 52, 26);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '700 26px "DM Sans", Arial, sans-serif';
    g.fillText('ZERO SUGAR · 0 CAL', 0, 153);

    // Big bold FIZZÉ logo with 3D offset shadow
    g.font = '900 250px Anton, Impact, "Arial Black", sans-serif';
    g.fillStyle = '#111';
    g.fillText('FIZZÉ', 10, 418);
    g.fillStyle = f.color;
    g.fillText('FIZZÉ', 0, 408);
    g.lineWidth = 5;
    g.strokeStyle = '#ffffff';
    g.strokeText('FIZZÉ', 0, 408);

    // Flavour ribbon banner
    g.fillStyle = '#111';
    g.beginPath();
    g.roundRect(-250, 450, 500, 74, 14);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '700 44px "DM Sans", Arial, sans-serif';
    g.fillText(f.name, 0, 502);

    // Sub caption or Custom Name Banner
    if (cleanName) {
      g.fillStyle = f.color;
      g.beginPath();
      g.roundRect(-240, 536, 480, 62, 31);
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = '#111';
      g.stroke();
      g.fillStyle = '#fff';
      g.font = '900 32px "DM Sans", Arial, sans-serif';
      g.fillText(`★ MADE FOR ${cleanName} ★`, 0, 578);
    } else {
      g.fillStyle = '#222';
      g.font = '700 25px "DM Sans", Arial, sans-serif';
      g.fillText(f.sub, 0, 565);
    }

    // Flavour emblem inside colour wave
    drawIcon(g, flavourKey, 0, 765, 52, f.accent);

    // Bottom net quantity
    g.fillStyle = f.accent;
    g.font = '700 38px "DM Sans", Arial, sans-serif';
    g.fillText('SERVE ICE COLD  ✳  330 ML', 0, 905);
    g.font = '700 24px "DM Sans", Arial, sans-serif';
    g.fillText('100% VEGAN  ·  NATURAL FLAVOURS  ·  HIGH FIZZ', 0, 955);

    g.restore();
  };

  drawFront(1024);
  drawFront(0);
  drawFront(2048);

  // Side panel 1 (x = 512): vertical bold typography + flavour badge
  g.save();
  g.translate(512, 520);
  g.rotate(-Math.PI / 2);
  g.textAlign = 'center';
  g.font = '900 110px Anton, Impact, sans-serif';
  g.strokeStyle = 'rgba(0,0,0,0.18)';
  g.lineWidth = 4;
  g.strokeText('POP · POUR · FIZZ', 0, 35);
  g.restore();

  // Side panel 2 (x = 1536): Nutrition facts + barcode
  g.save();
  g.translate(1536, 130);
  g.fillStyle = 'rgba(255,255,255,0.92)';
  g.strokeStyle = '#111';
  g.lineWidth = 5;
  g.beginPath();
  g.roundRect(-140, 0, 280, 420, 14);
  g.fill();
  g.stroke();

  g.fillStyle = '#111';
  g.textAlign = 'left';
  g.font = '900 32px "DM Sans", Arial, sans-serif';
  g.fillText('NUTRITION', -115, 45);
  g.fillRect(-115, 58, 230, 5);
  g.font = '700 22px "DM Sans", Arial, sans-serif';
  const rows = [
    ['ENERGY', '0 kcal'],
    ['TOTAL SUGAR', '0 g'],
    ['CARBS', '0 g'],
    ['SODIUM', '15 mg'],
    ['FIZZ LEVEL', '100%'],
  ];
  rows.forEach(([k, v], i) => {
    const ry = 98 + i * 44;
    g.fillText(k, -115, ry);
    g.textAlign = 'right';
    g.fillText(v, 115, ry);
    g.textAlign = 'left';
    g.fillRect(-115, ry + 12, 230, 1.5);
  });

  // Barcode at bottom of nutrition box
  for (let bx = -110; bx < 110; bx += 7) {
    g.fillRect(bx, 325, (bx * 13) % 3 === 0 ? 4 : 2, 65);
  }
  g.textAlign = 'center';
  g.font = '700 18px monospace';
  g.fillText('8 901234 567890', 0, 408);
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  texCache[cacheKey] = tex;
  return tex;
}

/** Updates an existing 3D can's flavour and/or custom name on the fly */
export function updateCanLabel(can, flavourKey, customName = '') {
  const tex = makeLabel(flavourKey, customName);
  can.userData.body.material.map = tex;
  can.userData.body.material.needsUpdate = true;
  can.userData.flavour = flavourKey;
  can.userData.customName = customName;
}

// Shared condensation droplet geometry & material
let dropGeo, dropMat, dropPositions;
function addCondensation(can) {
  if (!dropGeo) {
    dropGeo = new THREE.SphereGeometry(0.028, 8, 8);
    dropMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.05,
      metalness: 0.05,
      ior: 1.33,
      transparent: true,
      opacity: 0.85,
    });
    // pre-compute deterministic droplet transforms so every can is crisp & fast
    dropPositions = [];
    for (let i = 0; i < 110; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const y = (Math.sin(i * 12.9898) * 0.5) * 2.95;
      const s = 0.45 + ((i * 7) % 10) * 0.11;
      dropPositions.push({ a, y, s });
    }
  }
  const inst = new THREE.InstancedMesh(dropGeo, dropMat, dropPositions.length);
  const dummy = new THREE.Object3D();
  dropPositions.forEach(({ a, y, s }, i) => {
    dummy.position.set(Math.cos(a) * 1.005, y, Math.sin(a) * 1.005);
    dummy.rotation.y = -a;
    dummy.scale.set(s, s * 1.35, s * 0.65);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  });
  inst.instanceMatrix.needsUpdate = true;
  can.add(inst);
}

/** Builds a detailed 3D can with metallic rim, pull-tab, and cold condensation droplets */
export function createCan(flavourKey = 'cola', { droplets = true } = {}) {
  const can = new THREE.Group();
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe6e6ec, metalness: 0.96, roughness: 0.16 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x9999a1, metalness: 0.9, roughness: 0.3 });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 3.2, 96, 1, true),
    new THREE.MeshPhysicalMaterial({
      map: makeLabel(flavourKey),
      metalness: 0.55,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    })
  );
  can.add(body);

  // bottom tapered dome + silver rim
  const bottomPts = [
    new THREE.Vector2(0, -1.72), new THREE.Vector2(0.55, -1.8), new THREE.Vector2(0.82, -1.83),
    new THREE.Vector2(0.95, -1.72), new THREE.Vector2(1, -1.6),
  ];
  can.add(new THREE.Mesh(new THREE.LatheGeometry(bottomPts, 96), chrome));

  // tapered neck +rolled lip + recessed lid
  const topPts = [
    new THREE.Vector2(1, 1.6), new THREE.Vector2(0.98, 1.68), new THREE.Vector2(0.87, 1.85),
    new THREE.Vector2(0.9, 1.91), new THREE.Vector2(0.86, 1.95), new THREE.Vector2(0.81, 1.93),
    new THREE.Vector2(0.79, 1.85), new THREE.Vector2(0, 1.85),
  ];
  can.add(new THREE.Mesh(new THREE.LatheGeometry(topPts, 96), chrome));

  // Lid score line ring
  const groove = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.71, 64), darkMetal);
  groove.rotation.x = -Math.PI / 2;
  groove.position.y = 1.855;
  can.add(groove);

  // opening (dark) - hidden until opened, or scored outline when closed
  const scoreRing = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.215, 32), darkMetal);
  scoreRing.rotation.x = -Math.PI / 2;
  scoreRing.position.set(0, 1.856, 0.36);
  scoreRing.scale.set(1, 1.25, 1);
  can.add(scoreRing);

  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.2, 32),
    new THREE.MeshBasicMaterial({ color: 0x090909 })
  );
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(0, 1.858, 0.36);
  hole.scale.set(1, 1.25, 1);
  hole.visible = false;
  can.add(hole);

  // realistic pull tab (two finger rings + central rivet)
  const tabPivot = new THREE.Group();
  tabPivot.position.set(0, 1.87, 0);

  const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 24), chrome);
  tabPivot.add(rivet);

  const ringBack = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.032, 12, 32), chrome);
  ringBack.rotation.x = Math.PI / 2;
  ringBack.scale.set(1, 1.25, 0.45);
  ringBack.position.set(0, 0.015, -0.22);
  tabPivot.add(ringBack);

  const ringFront = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.026, 12, 28), chrome);
  ringFront.rotation.x = Math.PI / 2;
  ringFront.scale.set(1, 1.1, 0.45);
  ringFront.position.set(0, 0.015, 0.14);
  tabPivot.add(ringFront);

  can.add(tabPivot);

  if (droplets) addCondensation(can);

  can.userData = { tabPivot, hole, body, flavour: flavourKey };
  return can;
}

export function setupRenderer(canvas, { alpha = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function makeEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  return pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
}

export function addLights(scene, rimColor = 0xff2a2a) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 1.1);
  fill.position.set(-5, -2, 4);
  scene.add(fill);
  const rim = new THREE.PointLight(rimColor, 32, 20);
  rim.position.set(-4, 1, -3);
  scene.add(rim);
  return rim;
}

/** Renders a high-res still image of each flavour can for thumbnails / cart */
export function renderProductShots() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(420, 560, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = makeEnv(renderer);
  const rim = addLights(scene, 0xffffff);
  const camera = new THREE.PerspectiveCamera(30, 420 / 560, 0.1, 50);
  camera.position.set(0, 0.15, 9.2);
  const shots = {};
  for (const key of Object.keys(FLAVOURS)) {
    rim.color.setHex(FLAVOURS[key].rim);
    const can = createCan(key);
    can.rotation.set(0.08, 0.18, -0.06);
    scene.add(can);
    renderer.render(scene, camera);
    shots[key] = canvas.toDataURL('image/png');
    scene.remove(can);
  }
  renderer.dispose();
  return shots;
}

/**
 * Mounts an interactive, auto-spinning 3D can inside every element matching
 * `[data-can-stage]`, using a single shared WebGL canvas overlay (scissor test)
 * so all product cards & quick-view spin smoothly at 60fps with 1 WebGL context.
 */
let stageViews = [];
let stageOverlay, stageRenderer, stageEnv;

export function mountCanStage(el, flavourKey, { spinSpeed = 0.9, scale = 1 } = {}) {
  ensureStageRenderer();
  // remove existing view on the same element if re-mounted
  stageViews = stageViews.filter((v) => v.el !== el);

  const scene = new THREE.Scene();
  scene.environment = stageEnv;
  addLights(scene, FLAVOURS[flavourKey]?.rim || 0xffffff);

  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 50);
  camera.position.set(0, 0.05, 9.6);

  const can = createCan(flavourKey);
  can.scale.setScalar(scale);
  can.rotation.set(0.1, Math.random() * 0.6 - 0.3, -0.07);
  scene.add(can);

  const view = {
    el,
    scene,
    camera,
    can,
    baseScale: scale,
    spinSpeed,
    hovered: false,
    dragging: false,
    lastX: 0,
    lastY: 0,
    velY: 0,
    tiltX: 0.1,
    offsetY: 0,
  };

  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerenter', () => (view.hovered = true));
  el.addEventListener('pointerleave', () => {
    view.hovered = false;
    view.dragging = false;
  });
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    view.dragging = true;
    view.lastX = e.clientX;
    view.lastY = e.clientY;
    el.setPointerCapture?.(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!view.dragging) return;
    const dx = e.clientX - view.lastX;
    const dy = e.clientY - view.lastY;
    view.lastX = e.clientX;
    view.lastY = e.clientY;
    view.can.rotation.y += dx * 0.018;
    view.velY = dx * 0.012;
    view.tiltX = Math.max(-0.45, Math.min(0.45, view.tiltX + dy * 0.008));
  });
  el.addEventListener('pointerup', () => (view.dragging = false));

  stageViews.push(view);
  return view;
}

function ensureStageRenderer() {
  if (stageRenderer) return;
  const stageOverlay = document.createElement('canvas');
  stageOverlay.width = 480;
  stageOverlay.height = 600;

  stageRenderer = new THREE.WebGLRenderer({ canvas: stageOverlay, antialias: true, alpha: true });
  stageRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  stageRenderer.outputColorSpace = THREE.SRGBColorSpace;
  stageEnv = makeEnv(stageRenderer);

  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    stageViews = stageViews.filter((v) => v.el.isConnected);
    if (!stageViews.length) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const v of stageViews) {
      if (v.el.offsetParent === null && !v.el.closest('.modal.open')) continue;
      if (v.el.closest('.modal') && !v.el.closest('.modal.open')) continue;

      const r = v.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h || r.right < 0 || r.left > w || r.width < 10 || r.height < 10) continue;

      // Lazily attach a 2D display canvas inside the card / modal
      if (!v.canvas) {
        v.canvas = document.createElement('canvas');
        v.canvas.className = 'can-stage-canvas';
        v.el.appendChild(v.canvas);
        v.ctx = v.canvas.getContext('2d');
        const fallback = v.el.querySelector('.stage-fallback');
        if (fallback) fallback.style.opacity = '0';
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.min(600, Math.round(r.width * dpr)));
      const ch = Math.max(1, Math.min(720, Math.round(r.height * dpr)));
      if (v.canvas.width !== cw || v.canvas.height !== ch) {
        v.canvas.width = cw;
        v.canvas.height = ch;
      }
      if (stageOverlay.width !== cw || stageOverlay.height !== ch) {
        stageRenderer.setSize(cw, ch, false);
      }

      // Spin + interactive drag physics
      if (!v.dragging) {
        const targetSpeed = (v.hovered ? v.spinSpeed * 2.4 : v.spinSpeed) * dt;
        v.can.rotation.y += targetSpeed + v.velY;
        v.velY *= 0.92;
        v.tiltX += (0.1 - v.tiltX) * 0.08;
      }
      v.can.rotation.x = v.tiltX + Math.sin(t * 1.8) * 0.04;
      v.can.rotation.z = -0.07 + Math.cos(t * 1.4) * 0.04;

      const targetS = v.baseScale * (v.hovered ? 1.07 : 1);
      v.can.scale.setScalar(v.can.scale.x + (targetS - v.can.scale.x) * 0.12);
      v.can.position.y = Math.sin(t * 2 + r.left * 0.01) * 0.08;

      v.camera.aspect = cw / ch;
      v.camera.updateProjectionMatrix();

      stageRenderer.render(v.scene, v.camera);
      v.ctx.clearRect(0, 0, cw, ch);
      v.ctx.drawImage(stageOverlay, 0, 0, cw, ch);
    }
  }
  loop();
}
