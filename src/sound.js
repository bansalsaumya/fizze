// Procedural ASMR Sound Effects using Web Audio API (no external audio files needed)
let ctx = null;
let enabled = true;

function getCtx() {
  if (!enabled) return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) ctx = new AudioCtx();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Unlock audio on first user click/scroll interaction
window.addEventListener('pointerdown', () => getCtx(), { once: true });

export function isSoundEnabled() {
  return enabled;
}

export function toggleSound() {
  enabled = !enabled;
  if (enabled) playBubblePop();
  return enabled;
}

/** Crisp metallic pull-tab click + pressurized carbonation hiss ("Tsshhk!") */
export function playCanOpen() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  // 1) Metallic snap
  const osc = c.createOscillator();
  const snapGain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1900, now);
  osc.frequency.exponentialRampToValueAtTime(280, now + 0.045);
  snapGain.gain.setValueAtTime(0.35, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(snapGain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.055);

  // 2) Pressurized gas release ("pssshhh")
  const bufferSize = c.sampleRate * 0.45;
  const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const whiteNoise = c.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(4200, now + 0.03);
  filter.frequency.exponentialRampToValueAtTime(1800, now + 0.42);
  filter.Q.value = 1.4;

  const hissGain = c.createGain();
  hissGain.gain.setValueAtTime(0.001, now);
  hissGain.gain.linearRampToValueAtTime(0.28, now + 0.05);
  hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  whiteNoise.connect(filter).connect(hissGain).connect(c.destination);
  whiteNoise.start(now + 0.02);
  whiteNoise.stop(now + 0.46);
}

/** Fizzy liquid pour + sparkling bubbles */
export function playPourFizz() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  // Fizzy noise bed
  const dur = 0.9;
  const bufferSize = Math.floor(c.sampleRate * dur);
  const noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const noise = c.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.linearRampToValueAtTime(2400, now + dur);
  filter.Q.value = 2.0;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  noise.connect(filter).connect(gain).connect(c.destination);
  noise.start(now);
  noise.stop(now + dur);

  // Random tiny bubble pops
  for (let i = 0; i < 8; i++) {
    const t = now + 0.08 + Math.random() * 0.7;
    const bOsc = c.createOscillator();
    const bGain = c.createGain();
    const f = 500 + Math.random() * 900;
    bOsc.type = 'sine';
    bOsc.frequency.setValueAtTime(f, t);
    bOsc.frequency.exponentialRampToValueAtTime(f * 2.1, t + 0.045);
    bGain.gain.setValueAtTime(0.08, t);
    bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    bOsc.connect(bGain).connect(c.destination);
    bOsc.start(t);
    bOsc.stop(t + 0.055);
  }
}

/** Subtle crisp bubble pop for UI clicks / flavour switch */
export function playBubblePop() {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(1150, now + 0.055);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.065);
}

