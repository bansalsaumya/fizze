import { playBubblePop } from './sound.js';
// Simple display-only cart (no payment). Stored in localStorage.
export const WHATSAPP_NUMBER = '919999999999'; // TODO: apna WhatsApp number daalo (country code ke saath)
const KEY = 'fizze-cart';
let items = JSON.parse(localStorage.getItem(KEY) || '[]');

const $ = (id) => document.getElementById(id);
const save = () => localStorage.setItem(KEY, JSON.stringify(items));

export function openCart() {
  document.body.classList.add('cart-open');
}
function closeCart() {
  document.body.classList.remove('cart-open');
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function render() {
  const list = $('cart-items');
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  $('cart-count').textContent = count;
  $('cart-count').classList.toggle('has', count > 0);
  $('cart-total').textContent = '₹' + total.toLocaleString('en-IN');

  list.innerHTML = items.length
    ? items
        .map(
          (i) => `
      <div class="cart-item ${i.flavour}">
        <img src="${i.img}" alt="" />
        <div><strong>${i.name}</strong><small>${i.pack}</small><b>₹${i.price}</b></div>
        <div class="qty">
          <button data-act="dec" data-id="${i.id}">−</button><span>${i.qty}</span><button data-act="inc" data-id="${i.id}">+</button>
        </div>
      </div>`
        )
        .join('')
    : `<div class="cart-empty"><span>🥤</span><p>Your cart is empty</p><a href="#flavours" class="pill-button" id="cart-shop">SHOP FLAVOURS ↗</a></div>`;

  const msg = items.length
    ? `Hi FIZZÉ! I'd like to order:\n` + items.map((i) => `• ${i.name} (${i.pack}) x${i.qty}`).join('\n') + `\nTotal: ₹${total}`
    : 'Hi FIZZÉ!';
  $('cart-whatsapp').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  $('cart-whatsapp').classList.toggle('disabled', !items.length);
}

export function addToCart(p, silent = false) {
  const ex = items.find((i) => i.id === p.id);
  if (ex) ex.qty++;
  else items.push({ id: p.id, name: p.name, pack: p.pack, price: p.price, flavour: p.flavour, img: p.img, qty: 1 });
  save();
  render();
  if (silent) return;
  playBubblePop();
  toast(`${p.name} added to cart 🥤`);
  openCart();
}

export function initCart() {
  $('cart-open').onclick = openCart;
  $('cart-close').onclick = closeCart;
  $('cart-overlay').onclick = closeCart;
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeCart());
  $('cart-items').addEventListener('click', (e) => {
    if (e.target.id === 'cart-shop') return closeCart();
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const it = items.find((i) => i.id === b.dataset.id);
    it.qty += b.dataset.act === 'inc' ? 1 : -1;
    if (it.qty <= 0) items = items.filter((i) => i !== it);
    save();
    render();
  });
  render();
}
