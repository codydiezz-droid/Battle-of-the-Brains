/** Tiny synthesized sounds (no audio files): kick, net, save, whistle, crowd. */
let ctx: AudioContext | null = null;
let muted = false;

try {
  muted = localStorage.getItem("pc-muted") === "1";
} catch {
  /* storage may be unavailable */
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("pc-muted", m ? "1" : "0");
  } catch {
    /* ignore */
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

function noise(a: AudioContext, seconds: number) {
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * seconds), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  return src;
}

function envelope(a: AudioContext, peak: number, attack: number, release: number) {
  const g = a.createGain();
  const t = a.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  return g;
}

export function kick() {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  o.frequency.setValueAtTime(150, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(45, a.currentTime + 0.12);
  const g = envelope(a, 0.6, 0.005, 0.14);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + 0.2);
}

export function crowd(kind: "cheer" | "groan") {
  const a = ac();
  if (!a) return;
  const n = noise(a, 1.8);
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = kind === "cheer" ? 1100 : 420;
  f.Q.value = 0.7;
  const g = envelope(a, kind === "cheer" ? 0.28 : 0.18, 0.18, 1.4);
  n.connect(f).connect(g).connect(a.destination);
  n.start();
}

export function thud() {
  const a = ac();
  if (!a) return;
  const n = noise(a, 0.2);
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 600;
  const g = envelope(a, 0.5, 0.004, 0.16);
  n.connect(f).connect(g).connect(a.destination);
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
  const g = envelope(a, 0.12, 0.02, 0.35);
  o.connect(g).connect(a.destination);
  o.start();
  lfo.start();
  o.stop(a.currentTime + 0.4);
  lfo.stop(a.currentTime + 0.4);
}
