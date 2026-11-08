'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const KEY = 'bilal-booted';
const LINES = [
  '> initialising bilal.portfolio',
  '> loading neural core ........ ok',
  '> linking network nodes ...... ok',
  '> mounting playground ........ ok',
  '> ready.',
];

export default function BootScreen({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(0);
  const [fast, setFast] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
    onDoneRef.current?.();
  }, []);

  // skip straight through for returning visitors and reduced motion
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) {
      setFast(true);
      finish();
    }
  }, [finish]);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setCount((c) => Math.min(c + 1, LINES.length));
    }, 280);
    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (count < LINES.length) return;
    const t = window.setTimeout(finish, 650);
    return () => window.clearTimeout(t);
  }, [count, finish]);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        finish();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [visible, finish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="boot"
          role="dialog"
          aria-label="Loading portfolio"
          className="fixed inset-0 z-[9999] flex flex-col justify-between p-6 md:p-12"
          style={{ background: '#0f0f10', color: '#efe9dc', cursor: 'pointer' }}
          onClick={finish}
          exit={{ opacity: 0 }}
          transition={{ duration: fast ? 0.12 : 0.5 }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
            BK. / Portfolio
          </div>

          <div
            className="font-mono text-[clamp(0.85rem,1.6vw,1.1rem)] leading-loose"
            aria-live="polite"
          >
            {LINES.slice(0, count).map((l) => (
              <div key={l}>{l}</div>
            ))}
            <span className="inline-block animate-pulse">▍</span>
          </div>

          <div>
            <div className="h-px w-full" style={{ background: 'rgba(239,233,220,0.18)' }}>
              <div
                className="h-px transition-[width] duration-300"
                style={{
                  width: `${(count / LINES.length) * 100}%`,
                  background: '#efe9dc',
                }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em]">
              <span className="opacity-50">Press any key or click to skip</span>
              <button
                type="button"
                onClick={finish}
                className="rounded-full border px-4 py-2"
                style={{ borderColor: 'rgba(239,233,220,0.35)' }}
              >
                Skip ↵
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}