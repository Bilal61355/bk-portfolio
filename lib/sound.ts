const KEY = 'bilal-sound';

let enabled = false;
let installed = false;
let audio: AudioContext | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function ctx(): AudioContext | null {
  if (!audio) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
  }
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function blip(freq: number, dur: number, vol: number, type: OscillatorType = 'sine') {
  const c = ctx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.6), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const onKey = (e: KeyboardEvent) => {
  if (!enabled || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (!t || !(t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'Enter') blip(180, 0.09, 0.05, 'triangle');
  else if (e.key.length === 1 || e.key === 'Backspace')
    blip(1400 + Math.random() * 500, 0.03, 0.025, 'square');
};

const onClick = (e: MouseEvent) => {
  if (!enabled) return;
  const t = (e.target as HTMLElement | null)?.closest('a, button');
  if (t) blip(620, 0.06, 0.04);
};

export function toggleSound() {
  enabled = !enabled;
  try {
    localStorage.setItem(KEY, enabled ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
  if (enabled) {
    blip(660, 0.12, 0.05);
    window.setTimeout(() => blip(880, 0.14, 0.05), 90);
  }
  emit();
}

function init() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  try {
    enabled = localStorage.getItem(KEY) === '0';
  } catch {
    enabled = false;
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', onClick);
  window.addEventListener('portfolio:toggle-sound', toggleSound);
  emit();
}

export const soundStore = {
  subscribe(cb: () => void) {
    subs.add(cb);
    init();
    return () => {
      subs.delete(cb);
    };
  },
  getSnapshot: () => enabled,
  getServerSnapshot: () => false,
};