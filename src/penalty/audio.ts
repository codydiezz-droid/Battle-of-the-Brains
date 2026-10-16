/** Synthesized sounds (no audio files): kick, net, glove, post, whistle and the crowd. */
let ctx: AudioContext | null = null;
let muted = false;
let ambience: { gain: GainNode; src: AudioBufferSourceNode } | null = null;

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  if (m && ambience) {
    ambience.src.stop();
    ambience = null;
  }
}

function ac() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(a: AudioContext, seconds: number) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function noise(a: AudioContext, seconds: number) {
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, seconds);
  return src;
}

function envelope(a: AudioContext, peak: number, attack: number, release: number, delay = 0) {
  const g = a.createGain();
  const t = a.currentTime + delay;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  return g;
}

function filtered(a: AudioContext, seconds: number, type: BiquadFilterType, freq: number, q: number, peak: number, attack: number, release: number) {
  const n = noise(a, seconds);
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  n.connect(f).connect(envelope(a, peak, attack, release)).connect(a.destination);
  n.start();
}

/** A low murmur that runs through the match. */
export function startAmbience() {
  const a = ac();
  if (!a || ambience) return;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a, 4);
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 520;
  f.Q.value = 0.5;
  const gain = a.createGain();
  gain.gain.value = 0.045;
  src.connect(f).connect(gain).connect(a.destination);
  src.start();
  ambience = { gain, src };
}

export function stopAmbience() {
  ambience?.src.stop();
  ambience = null;
}

export function kick(power: number) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  o.frequency.setValueAtTime(130 + power * 60, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(42, a.currentTime + 0.12);
  o.connect(envelope(a, 0.5 + power * 0.3, 0.004, 0.14)).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.2);
  filtered(a, 0.08, "highpass", 1800, 0.7, 0.25, 0.002, 0.05);
}

export function glove() {
  const a = ac();
  if (!a) return;
  filtered(a, 0.18, "bandpass", 900, 1.2, 0.5, 0.003, 0.12);
  const o = a.createOscillator();
  o.frequency.setValueAtTime(90, a.currentTime);
  o.connect(envelope(a, 0.4, 0.003, 0.1)).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.15);
}

export function post() {
  const a = ac();
  if (!a) return;
  for (const [f, p] of [
    [620, 0.25],
    [1240, 0.12],
    [1870, 0.06],
  ]) {
    const o = a.createOscillator();
    o.frequency.value = f;
    o.connect(envelope(a, p, 0.002, 0.7)).connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.8);
  }
}

export function net() {
  const a = ac();
  if (!a) return;
  filtered(a, 0.4, "highpass", 2500, 0.5, 0.18, 0.01, 0.3);
}

export function crowd(kind: "cheer" | "groan" | "ooh", big = false) {
  const a = ac();
  if (!a) return;
  const n = noise(a, 2.6);
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = kind === "cheer" ? 1000 : kind === "ooh" ? 600 : 380;
  f.Q.value = 0.6;
  n.connect(f)
    .connect(envelope(a, (kind === "cheer" ? 0.3 : 0.2) * (big ? 1.4 : 1), kind === "cheer" ? 0.12 : 0.25, big ? 2.2 : 1.5))
    .connect(a.destination);
  n.start();
}

export function whistle() {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  o.frequency.value = 2900;
  const lfo = a.createOscillator();
  lfo.frequency.value = 28;
  const lg = a.createGain();
  lg.gain.value = 90;
  lfo.connect(lg).connect(o.frequency);
  o.connect(envelope(a, 0.1, 0.02, 0.35)).connect(a.destination);
  o.start();
  lfo.start();
  o.stop(a.currentTime + 0.4);
  lfo.stop(a.currentTime + 0.4);
}
