import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createHeroScene, createPourScene } from './scenes.js';
import { renderProductShots, mountCanStage, updateCanLabel, FLAVOURS } from './can.js';
import { initCart, addToCart } from './cart.js';
import { initShop, openQuickView } from './shop.js';
import { toggleSound, playCanOpen, playPourFizz, playBubblePop } from './sound.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- DATA ---------- */
const PRODUCTS = [
  { id: 'cola-1', flavour: 'cola', name: 'Classic Cola', pack: '330ml · Pack of 6', price: 299, mrp: 399, tag: '🔥 MOST ORDERED', desc: 'The bold, crisp cola taste you love — with zero sugar and maximum fizz.' },
  { id: 'lemon-1', flavour: 'lemon', name: 'Lemon Zest', pack: '330ml · Pack of 6', price: 279, mrp: 349, tag: 'FRESH', desc: 'Sharp, zesty lemon with a clean sparkling finish. Summer in a can.' },
  { id: 'orange-1', flavour: 'orange', name: 'Orange Pop', pack: '330ml · Pack of 6', price: 279, mrp: 349, tag: 'NEW', desc: 'Juicy orange flavour that pops on every sip. Bright, bubbly, bold.' },
  { id: 'berry-1', flavour: 'berry', name: 'Berry Blast', pack: '330ml · Pack of 6', price: 319, mrp: 429, tag: 'LIMITED', desc: 'A wild mix of berries with a sparkling kick. Limited edition.' },
  { id: 'cola-12', flavour: 'cola', name: 'Classic Cola', pack: '330ml · Pack of 12', price: 549, mrp: 799, tag: 'PARTY PACK', desc: 'Twelve cans of classic fizz. Made for parties and sharing.' },
  { id: 'lemon-12', flavour: 'lemon', name: 'Lemon Zest', pack: '330ml · Pack of 12', price: 529, mrp: 699, tag: 'VALUE', desc: 'Stock up on zesty refreshment with the 12-can value pack.' },
];


/* ---------- LOADER ---------- */
const loaderNum = document.getElementById('loader-num');
const bubbleBox = document.querySelector('.loader-bubbles');
for (let i = 0; i < 25; i++) {
  const b = document.createElement('i');
  b.style.left = Math.random() * 100 + '%';
  b.style.animationDelay = Math.random() * 3 + 's';
  b.style.width = b.style.height = 6 + Math.random() * 20 + 'px';
  bubbleBox.appendChild(b);
}
const loadState = { v: 0 };
gsap.to(loadState, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => (loaderNum.textContent = Math.round(loadState.v)) });

/* ---------- SMOOTH SCROLL ---------- */
const lenis = new Lenis({ duration: 1.15, smoothWheel: !reduced });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    lenis.scrollTo(el, { offset: id === '#top' ? 0 : -60 });
  })
);

/* ---------- 3D SCENES ---------- */
const hero = createHeroScene(document.getElementById('can-canvas'));
const pour = createPourScene(document.getElementById('pour-canvas'));

const heroNum = document.getElementById('hero-num');
const heroBar = document.getElementById('hero-progress');
const captions = document.querySelectorAll('.hero-caption');
ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
  onToggle: (s) => hero.setActive(s.isActive || s.progress < 1),
  onUpdate: (s) => {
    hero.setProgress(s.progress);
    heroBar.style.transform = `scaleX(${s.progress})`;
    const idx = Math.min(2, Math.floor(s.progress * 3));
    heroNum.textContent = '0' + (idx + 1);
    captions.forEach((c, i) => c.classList.toggle('show', i === idx));
  },
});
captions[0].classList.add('show');

// hero headline parallax out
gsap.to('.hero-copy', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '55% top', end: 'bottom bottom', scrub: true } });
gsap.to('.hero-watermark', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true } });

const STEPS = [
  ['01', 'CRACK IT OPEN', 'THE MOMENT STARTS HERE'],
  ['02', 'POUR IT SLOW', 'LISTEN TO THAT FIZZ'],
  ['03', 'ENJOY THE BUBBLES', 'ICE COLD. ALL YOURS.'],
];
const stepNum = document.getElementById('step-num'), stepTitle = document.getElementById('step-title'), stepCap = document.getElementById('step-cap');
const pourNum = document.getElementById('pour-num'), pourBar = document.getElementById('pour-progress');
let curStep = 0;
ScrollTrigger.create({
  trigger: '.pour',
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
  onToggle: (s) => pour.setActive(s.isActive),
  onUpdate: (s) => {
    pour.setProgress(s.progress);
    pourBar.style.transform = `scaleX(${s.progress})`;
    const idx = s.progress < 0.33 ? 0 : s.progress < 0.8 ? 1 : 2;
    if (idx !== curStep) {
      curStep = idx;
      gsap.fromTo('.pour-step', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
      [stepNum.textContent, stepTitle.textContent, stepCap.textContent] = STEPS[idx];
      pourNum.textContent = STEPS[idx][0];
      if (navigator.vibrate) navigator.vibrate(15);
      if (idx === 0 || (idx === 1 && s.direction > 0)) playCanOpen();
      if (idx === 1) playPourFizz();
    }
  },
});
pour.setActive(false);
gsap.to('.pour-watermark', { xPercent: -30, ease: 'none', scrollTrigger: { trigger: '.pour', start: 'top bottom', end: 'bottom top', scrub: true } });

/* ---------- PRODUCTS ---------- */
const shots = renderProductShots();
const grid = document.getElementById('product-grid');
grid.innerHTML = PRODUCTS.map(
  (p) => `
  <article class="product-card ${p.flavour}" data-flavour="${p.flavour}">
    <div class="product-visual" data-can-stage="${p.flavour}">
      <span class="product-tag">${p.tag}</span>
      <span class="product-off">-${Math.round((1 - p.price / p.mrp) * 100)}%</span>
      <span class="spin-hint">360° ↻</span>
      <img class="stage-fallback" src="${shots[p.flavour]}" alt="${p.name} can" />
      <button class="quick-btn" data-qv="${p.id}">QUICK VIEW</button>
    </div>
    <div class="product-info">
      <div><h3>${p.name}</h3><small>${p.pack}</small></div>
      <div class="price"><strong>₹${p.price}</strong><s>₹${p.mrp}</s></div>
    </div>
    <button class="add-btn" data-id="${p.id}">ADD TO CART <span>+</span></button>
  </article>`
).join('');
grid.addEventListener('click', (e) => {
  const qv = e.target.closest('.quick-btn');
  if (qv) return openQuickView(qv.dataset.qv);
  const btn = e.target.closest('.add-btn');
  if (!btn) return;
  const p = PRODUCTS.find((x) => x.id === btn.dataset.id);
  addToCart({ ...p, img: shots[p.flavour] });
  gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
});
// Mount live 3D spinning cans inside each product card
grid.querySelectorAll('[data-can-stage]').forEach((el) => {
  mountCanStage(el, el.dataset.canStage, { spinSpeed: 1.05, scale: 1 });
});

// tabs
document.getElementById('tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
  const f = b.dataset.filter;
  const cards = grid.querySelectorAll('.product-card');
  cards.forEach((c) => (c.style.display = f === 'all' || c.dataset.flavour === f ? '' : 'none'));
  gsap.fromTo([...cards].filter((c) => c.style.display !== 'none'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.5 });
  ScrollTrigger.refresh();
});

/* ---------- SOUND TOGGLE (#1) ---------- */
const soundBtn = document.getElementById('sound-toggle');
const soundLabel = document.getElementById('sound-label');
soundBtn.addEventListener('click', () => {
  const on = toggleSound();
  soundBtn.classList.toggle('on', on);
  soundLabel.textContent = on ? 'SOUND ON' : 'SOUND OFF';
});

/* ---------- HERO LIVE FLAVOUR SWITCHER (#2) ---------- */
document.getElementById('hero-switcher').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-flavour]');
  if (!b) return;
  const fKey = b.dataset.flavour;
  const f = FLAVOURS[fKey];
  if (!f) return;
  document.querySelectorAll('#hero-switcher button').forEach((x) => x.classList.toggle('active', x === b));
  document.documentElement.style.setProperty('--red', f.color);
  document.documentElement.style.setProperty('--red-dark', f.dark);
  hero.setFlavour(fKey);
  playCanOpen();
});

/* ---------- CUSTOM 3D CAN PERSONALIZER (#4) ---------- */
const custStageEl = document.getElementById('custom-can-stage');
let custFlavour = 'cola';
const custInput = document.getElementById('cust-name');
const custView = mountCanStage(custStageEl, custFlavour, { spinSpeed: 0.85, scale: 0.88 });
updateCanLabel(custView.can, custFlavour, custInput.value);

custInput.addEventListener('input', () => {
  updateCanLabel(custView.can, custFlavour, custInput.value || 'YOUR NAME');
  custView.velY = 0.08;
  playBubblePop();
});

document.getElementById('cust-flavours').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-flavour]');
  if (!b) return;
  custFlavour = b.dataset.flavour;
  document.querySelectorAll('#cust-flavours button').forEach((x) => x.classList.toggle('active', x === b));
  updateCanLabel(custView.can, custFlavour, custInput.value || 'YOUR NAME');
  custView.velY = 0.22;
  playCanOpen();
});

document.getElementById('cust-add').addEventListener('click', () => {
  const name = (custInput.value || 'CUSTOM').trim().toUpperCase();
  const f = FLAVOURS[custFlavour];
  playCanOpen();
  addToCart({
    id: `custom-${custFlavour}-${name}`,
    flavour: custFlavour,
    name: `${f.name} ("${name}")`,
    pack: 'Custom 330ml · Pack of 6',
    price: 349,
    img: shots[custFlavour],
  });
});

/* ---------- NUTRITION COMPARISON BARS (#5) ---------- */
gsap.utils.toArray('.c-bar i').forEach((bar) => {
  gsap.fromTo(
    bar,
    { width: '0%' },
    {
      width: bar.style.getPropertyValue('--w'),
      duration: 1.3,
      ease: 'power3.out',
      scrollTrigger: { trigger: bar, start: 'top 90%' },
    }
  );
});

/* ---------- RECIPES, VIDEOS, SEARCH (Malaki-style) ---------- */
initShop(PRODUCTS, shots);
document.getElementById('shop-all').addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('#tabs [data-filter="all"]').click();
});

/* ---------- REVEALS & COUNTERS ---------- */
gsap.utils.toArray('.reveal').forEach((el) =>
  gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
);
gsap.utils.toArray('.product-card').forEach((el, i) =>
  gsap.from(el, { y: 80, opacity: 0, duration: 0.9, delay: (i % 3) * 0.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } })
);
document.querySelectorAll('.counter').forEach((el) => {
  const o = { v: 0 };
  gsap.to(o, { v: +el.dataset.to, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => (el.textContent = Math.round(o.v)) });
});
gsap.utils.toArray('.break-bg span').forEach((s, i) =>
  gsap.fromTo(s, { xPercent: i % 2 ? -20 : 10 }, { xPercent: i % 2 ? 10 : -20, ease: 'none', scrollTrigger: { trigger: '.break', start: 'top bottom', end: 'bottom top', scrub: true } })
);
gsap.from('.closing h2', { scale: 0.7, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'center center', scrub: true } });

/* ---------- HEADER / MENU ---------- */
const header = document.querySelector('.header');
lenis.on('scroll', ({ scroll, direction }) => {
  header.classList.toggle('scrolled', scroll > 40);
  header.classList.toggle('hide', direction === 1 && scroll > 400);
});
const menu = document.getElementById('mobile-menu');
const toggle = document.getElementById('menu-toggle');
function closeMenu() {
  menu.classList.remove('open');
  toggle.classList.remove('open');
}
toggle.onclick = () => {
  menu.classList.toggle('open');
  toggle.classList.toggle('open');
};

/* ---------- CURSOR + MAGNETIC ---------- */
const cursor = document.querySelector('.cursor');
if (matchMedia('(pointer:fine)').matches) {
  window.addEventListener('pointermove', (e) => gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.25 }));
  document.querySelectorAll('a, button').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('big'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('big'));
  });
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.3 });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
  });
} else cursor.remove();

/* ---------- NEWSLETTER ---------- */
document.getElementById('news-form').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('news-msg').textContent = "🎉 You're in! Welcome to the Fizz Club.";
  e.target.reset();
});

initCart();

/* ---------- INTRO ---------- */
window.addEventListener('load', () => {
  const tl = gsap.timeline({ delay: 1.7 });
  tl.to('#loader', { yPercent: -100, duration: 0.9, ease: 'power4.inOut' })
    .from('.hero h1 > span', { yPercent: 110, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power4.out' }, '-=0.3')
    .from('.hero-copy p, .hero-copy .pill-button, .eyebrow', { y: 20, opacity: 0, stagger: 0.08, duration: 0.6 }, '-=0.5')
    .from('#can-canvas', { scale: 0.6, opacity: 0, duration: 1.2, ease: 'expo.out' }, '-=1')
    .from('.hero-aside, .hero-bottom, .header', { opacity: 0, y: 20, duration: 0.6 }, '-=0.8')
    .add(() => ScrollTrigger.refresh());
});

