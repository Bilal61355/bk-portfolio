'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const INTERACTIVE =
  'a, button, [role="button"], [role="option"], summary, input, textarea, select, label[for]';

export default function Cursor() {
  const [mounted, setMounted] = useState(false);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  // only on devices with a real pointer (mouse/trackpad)
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('bk-cursor-on');

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let scale = 1;
    let target = 1;
    let visible = false;
    let raf = 0;

    const show = (v: boolean) => {
      visible = v;
      const o = v ? '1' : '0';
      if (dot.current) dot.current.style.opacity = o;
      if (ring.current) ring.current.style.opacity = o;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        rx = x;
        ry = y;
        show(true);
      }
      const el = (e.target as Element | null)?.closest(INTERACTIVE);
      target = el ? 1.9 : 1;
    };
    const onDown = () => (target = 0.75);
    const onUp = () => (target = 1);
    const onLeave = () => show(false);

    const tick = () => {
      const ease = reduce ? 1 : 0.18;
      rx += (x - rx) * ease;
      ry += (y - ry) * ease;
      scale += (target - scale) * 0.2;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('bk-cursor-on');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [mounted]);

  if (!mounted) return null;

  const base: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    pointerEvents: 'none',
    zIndex: 10000,
    mixBlendMode: 'difference',
    opacity: 0,
    willChange: 'transform',
    transition: 'opacity 0.2s',
  };

  return createPortal(
    <>
      <style>{`html.bk-cursor-on, html.bk-cursor-on * { cursor: none !important; }`}</style>
      <div
        ref={ring}
        aria-hidden="true"
        style={{
          ...base,
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '1.5px solid #fff',
        }}
      />
      <div
        ref={dot}
        aria-hidden="true"
        style={{
          ...base,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </>,
    document.body
  );
}