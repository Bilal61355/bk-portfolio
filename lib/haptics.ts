let installed = false;

const canVibrate = () =>
  typeof navigator !== 'undefined' && 'vibrate' in navigator;

export function buzz(ms: number | number[] = 8) {
  if (typeof window === 'undefined' || !canVibrate()) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate(ms);
}

export function installHaptics() {
  if (installed || typeof window === 'undefined' || !canVibrate()) return;
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  installed = true;
  document.addEventListener(
    'click',
    (e) => {
      const t = (e.target as HTMLElement | null)?.closest('a, button');
      if (t) buzz(8);
    },
    { passive: true }
  );
}