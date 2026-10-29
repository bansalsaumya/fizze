// Malaki-style shopping features: shoppable videos, recipes, quick view, search, WhatsApp float
import gsap from 'gsap';
import { addToCart, WHATSAPP_NUMBER } from './cart.js';
import { mountCanStage } from './can.js';

const MOMENTS = [
  { video: 'videos/v1.mp4', product: 'cola-1', steps: ['Fill with ice', 'Pour FIZZÉ Cola', 'Squeeze of lime'] },
  { video: 'videos/v2.mp4', product: 'lemon-1', steps: ['Muddle fresh mint', 'Add lemon juice', 'Top with Lemon Zest'] },
  { video: 'videos/v3.mp4', product: 'orange-1', steps: ['Orange slices in', 'Crushed ice', 'Pour Orange Pop'] },
  { video: 'videos/v4.mp4', product: 'berry-1', steps: ['Crush some berries', 'Shake it up', 'Finish with Berry Blast'] },
  { video: 'videos/v6.mp4', product: 'cola-12', steps: ['Party time', 'Chill the pack', 'Share the fizz'] },
  { video: 'videos/v2.mp4', product: 'lemon-12', steps: ['Ice cold glass', 'Lemon wheel garnish', 'Pour Lemon Zest'] },
];

const RECIPES = [
  { name: 'Cola Float', video: 'videos/v5.mp4', product: 'cola-1', time: '2 MIN', steps: ['Add two scoops of vanilla ice cream to a tall glass', 'Slowly pour ice-cold FIZZÉ Classic Cola', 'Let it foam up, top with a cherry', 'Serve with a spoon & straw'] },
  { name: 'Minty Lemon Cooler', video: 'videos/v2.mp4', product: 'lemon-1', time: '3 MIN', steps: ['Muddle 6 mint leaves with lime wedges', 'Fill the glass with crushed ice', 'Top with FIZZÉ Lemon Zest', 'Garnish with a lemon wheel'] },
  { name: 'Sunset Spritz', video: 'videos/v3.mp4', product: 'orange-1', time: '3 MIN', steps: ['Pour 60ml orange juice over ice', 'Add a dash of grenadine for the sunset', 'Top with FIZZÉ Orange Pop', 'Stir gently & enjoy'] },
  { name: 'Berry Mojito', video: 'videos/v6.mp4', product: 'berry-1', time: '4 MIN', steps: ['Crush a handful of berries with mint', 'Add lime juice and ice', 'Top with FIZZÉ Berry Blast', 'Shake gently, serve cold'] },
];

let P = [], SHOTS = {};
const byId = (id) => P.find((p) => p.id === id);
const withImg = (p) => ({ ...p, img: SHOTS[p.flavour] });

/* video with placeholder fallback (if file missing) */
function videoHTML(src) {
  return `<div class="vid-fallback" aria-hidden="true"></div>
    <video src="${src}" muted loop playsinline preload="metadata" onerror="this.remove()"></video>`;
}

/* ---------- SHOPPABLE VIDEOS (Infinite Auto-Scrolling Row) ---------- */
function initMoments() {
  const track = document.getElementById('video-track');
  const cardHTML = (m, i) => {
    const p = byId(m.product);
    return `
    <article class="video-card ${p.flavour}" data-i="${i % MOMENTS.length}">
      <div class="video-media">
        ${videoHTML(m.video)}
        <img class="vid-can" src="${SHOTS[p.flavour]}" alt="" />
        <div class="vid-step">${m.steps[0]}</div>
        <span class="vid-play">▶</span>
      </div>
      <div class="video-product">
        <img src="${SHOTS[p.flavour]}" alt="" />
        <div><strong>${p.name} | ${p.pack.split('· ')[1]}</strong><small>RS. ${p.price}.00</small></div>
      </div>
      <button class="vid-add" data-id="${p.id}">Add To Cart</button>
    </article>`;
  };
  // Duplicate cards so the track loops seamlessly forever
  track.innerHTML = [...MOMENTS, ...MOMENTS].map(cardHTML).join('');

  const cards = [...track.querySelectorAll('.video-card')];
  // play only visible videos
  const io = new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      const v = e.target.querySelector('video');
      if (!v) return;
      e.isIntersecting ? v.play().catch(() => {}) : v.pause();
    }), { threshold: 0.15 });
  cards.forEach((c) => io.observe(c));

  // Continuous smooth auto-scroll loop (pauses on hover / touch / arrow jump)
  let paused = false;
  let resumeTimer;
  let pos = 0;
  track.addEventListener('pointerenter', () => (paused = true));
  track.addEventListener('pointerleave', () => (paused = false));
  track.addEventListener('touchstart', () => (paused = true), { passive: true });
  track.addEventListener('touchend', () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      pos = track.scrollLeft;
      paused = false;
    }, 1200);
  });

  function autoScroll() {
    requestAnimationFrame(autoScroll);
    const half = track.scrollWidth / 2;
    if (half <= 0) return;
    if (!paused) {
      pos += 0.9; // smooth steady speed
      if (pos >= half) pos -= half;
      track.scrollLeft = pos;
    } else {
      pos = track.scrollLeft;
      if (pos >= half) {
        pos -= half;
        track.scrollLeft = pos;
      }
    }
  }
  requestAnimationFrame(autoScroll);

  // rotating step captions
  let tick = 0;
  setInterval(() => {
    tick++;
    cards.forEach((c) => {
      const idx = +c.dataset.i;
      const el = c.querySelector('.vid-step');
      const steps = MOMENTS[idx].steps;
      gsap.to(el, { opacity: 0, y: -10, duration: 0.3, onComplete: () => {
        el.textContent = steps[tick % steps.length];
        gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
      } });
    });
  }, 2600);

  track.addEventListener('click', (e) => {
    const add = e.target.closest('.vid-add');
    if (add) return addToCart(withImg(byId(add.dataset.id)));
    const card = e.target.closest('.video-card');
    if (card) openReel(+card.dataset.i);
  });
  const jump = (dir) => {
    paused = true;
    clearTimeout(resumeTimer);
    const step = (cards[0]?.offsetWidth || 300) + 20;
    gsap.to(track, {
      scrollLeft: track.scrollLeft + dir * step,
      duration: 0.55,
      ease: 'power2.out',
      onComplete: () => {
        pos = track.scrollLeft % (track.scrollWidth / 2);
        track.scrollLeft = pos;
        resumeTimer = setTimeout(() => (paused = false), 800);
      },
    });
  };
  document.getElementById('vid-next').onclick = () => jump(1);
  document.getElementById('vid-prev').onclick = () => jump(-1);
}

/* ---------- MODAL (reel + quick view) ---------- */
const modal = document.getElementById('modal');
const box = document.getElementById('modal-box');
function openModal(html, cls) {
  box.className = 'modal-box ' + cls;
  box.innerHTML = `<button class="modal-close" data-close aria-label="Close">✕</button>` + html;
  modal.classList.add('open');
  box.querySelectorAll('video').forEach((v) => v.play().catch(() => {}));
}
function closeModal() {
  modal.classList.remove('open');
  box.querySelectorAll('video').forEach((v) => v.pause());
}
modal.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) return closeModal();
  const add = e.target.closest('[data-add]');
  if (add) {
    const qty = +(box.querySelector('.qv-qty span')?.textContent || 1);
    const p = withImg(byId(add.dataset.add));
    for (let i = 0; i < qty; i++) addToCart(p, i < qty - 1);
    closeModal();
  }
  const q = e.target.closest('[data-q]');
  if (q) {
    const s = box.querySelector('.qv-qty span');
    s.textContent = Math.max(1, +s.textContent + +q.dataset.q);
  }
  const nav = e.target.closest('[data-reel]');
  if (nav) openReel((+nav.dataset.reel + MOMENTS.length) % MOMENTS.length);
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());

function openReel(i) {
  const m = MOMENTS[i], p = byId(m.product);
  openModal(`
    <div class="reel ${p.flavour}">
      ${videoHTML(m.video)}
      <img class="vid-can big" src="${SHOTS[p.flavour]}" alt="" />
      <button class="reel-nav prev" data-reel="${i - 1}">‹</button><button class="reel-nav next" data-reel="${i + 1}">›</button>
      <div class="reel-steps">${m.steps.map((s, k) => `<span>${k + 1}. ${s}</span>`).join('')}</div>
      <div class="reel-product">
        <img src="${SHOTS[p.flavour]}" alt="" />
        <div><strong>${p.name}</strong><small>${p.pack} · ₹${p.price}</small></div>
        <button class="pill-button" data-add="${p.id}">ADD</button>
      </div>
    </div>`, 'reel-box');
}

export function openQuickView(id) {
  const p = byId(id);
  openModal(`
    <div class="qv ${p.flavour}">
      <div class="qv-img" id="qv-stage">
        <span class="spin-hint">DRAG TO SPIN 360° ↻</span>
        <img class="stage-fallback" src="${SHOTS[p.flavour]}" alt="${p.name}" />
      </div>
      <div class="qv-info">
        <span class="product-tag">${p.tag}</span>
        <h3>${p.name}</h3>
        <small>${p.pack}</small>
        <div class="price"><strong>₹${p.price}</strong><s>₹${p.mrp}</s><em>SAVE ₹${p.mrp - p.price}</em></div>
        <p>${p.desc}</p>
        <ul><li>✳ Zero sugar, zero calories</li><li>✳ Extra fizzy carbonation</li><li>✳ Best served ice cold</li></ul>
        <div class="qv-actions">
          <div class="qv-qty"><button data-q="-1">−</button><span>1</span><button data-q="1">+</button></div>
          <button class="pill-button full" data-add="${p.id}">ADD TO CART <span>+</span></button>
        </div>
      </div>
    </div>`, 'qv-box');
  mountCanStage(document.getElementById('qv-stage'), p.flavour, { spinSpeed: 1.15, scale: 1.06 });
}

/* ---------- RECIPES ---------- */
function initRecipes() {
  const tabs = document.getElementById('recipe-tabs');
  const feat = document.getElementById('recipe-feature');
  tabs.innerHTML = RECIPES.map((r, i) => `<button class="${i ? '' : 'active'}" data-i="${i}">${r.name.toUpperCase()}</button>`).join('');
  const show = (i) => {
    const r = RECIPES[i], p = byId(r.product);
    feat.innerHTML = `
      <div class="recipe-media ${p.flavour}">${videoHTML(r.video)}<img class="vid-can big" src="${SHOTS[p.flavour]}" alt="" /><span class="recipe-time">⏱ ${r.time}</span></div>
      <div class="recipe-body">
        <small>RECIPE 0${i + 1}</small>
        <h3>${r.name}</h3>
        <ol>${r.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
        <div class="recipe-product ${p.flavour}">
          <img src="${SHOTS[p.flavour]}" alt="" />
          <div><span>YOU'LL NEED</span><strong>${p.name}</strong><small>${p.pack} · ₹${p.price}</small></div>
          <button class="add-btn" data-id="${p.id}">ADD <span>+</span></button>
        </div>
      </div>`;
    feat.querySelector('video')?.play().catch(() => {});
    gsap.from(feat.querySelectorAll('.recipe-body > *, .recipe-media'), { y: 30, opacity: 0, stagger: 0.06, duration: 0.5 });
  };
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
    show(+b.dataset.i);
  });
  feat.addEventListener('click', (e) => {
    const b = e.target.closest('.add-btn');
    if (b) addToCart(withImg(byId(b.dataset.id)));
  });
  show(0);
}

/* ---------- SEARCH ---------- */
function initSearch() {
  const panel = document.getElementById('search-panel');
  const input = document.getElementById('search-input');
  const res = document.getElementById('search-results');
  const render = (q) => {
    q = q.trim().toLowerCase();
    const list = P.filter((p) => !q || `${p.name} ${p.flavour} ${p.pack}`.toLowerCase().includes(q));
    res.innerHTML = list.length
      ? `<small>${q ? 'RESULTS' : 'POPULAR'}</small>` + list.map((p) => `
        <div class="search-item ${p.flavour}" data-id="${p.id}">
          <img src="${SHOTS[p.flavour]}" alt="" /><div><strong>${p.name}</strong><small>${p.pack}</small></div><b>₹${p.price}</b>
        </div>`).join('')
      : `<p class="no-res">No fizz found for "${q}" 🥲</p>`;
  };
  document.getElementById('search-open').onclick = () => { panel.classList.add('open'); render(''); setTimeout(() => input.focus(), 300); };
  document.getElementById('search-close').onclick = () => panel.classList.remove('open');
  input.addEventListener('input', () => render(input.value));
  res.addEventListener('click', (e) => {
    const it = e.target.closest('.search-item');
    if (!it) return;
    panel.classList.remove('open');
    openQuickView(it.dataset.id);
  });
  document.getElementById('account-btn').onclick = () => {
    const t = document.getElementById('toast');
    t.textContent = 'Accounts coming soon ✳';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1800);
  };
}

export function initShop(products, shots) {
  P = products;
  SHOTS = shots;
  initMoments();
  initRecipes();
  initSearch();
  document.getElementById('wa-float').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi FIZZÉ! I have a question.')}`;
}

