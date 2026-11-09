'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Briefcase, Mail, Search, Volume2, VolumeX } from 'lucide-react';
import { soundStore, toggleSound } from '@/lib/sound';

const item =
  'flex h-12 min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-full px-2';
const label = 'font-mono text-[10px] uppercase tracking-[0.08em]';

export default function MobileActionBar({ suppress }: { suppress?: boolean }) {
  const [scrolledAway, setScrolledAway] = useState(false);
  const soundOn = useSyncExternalStore(
    soundStore.subscribe,
    soundStore.getSnapshot,
    soundStore.getServerSnapshot
  );

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last;
        if (Math.abs(dy) > 6) {
          setScrolledAway(dy > 0 && y > 240);
          last = y;
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hidden = scrolledAway || suppress;

  return (
    <nav
      aria-label="Quick actions"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] hidden justify-center px-4 max-[650px]:flex"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
        transform: hidden ? 'translateY(150%)' : 'none',
        transition: 'transform .35s cubic-bezier(.22,1,.36,1)',
      }}
    >
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full border px-2 py-1.5 shadow-lg"
        style={{
          background: 'var(--paper)',
          color: 'var(--ink)',
          borderColor: 'var(--line)',
        }}
      >
        <a href="#work" className={item} aria-label="Selected work">
          <Briefcase size={18} />
          <span className={label}>Work</span>
        </a>

        <button
          type="button"
          className={item}
          aria-label="Open search"
          onClick={() => window.dispatchEvent(new Event('portfolio:open-palette'))}
        >
          <Search size={18} />
          <span className={label}>Search</span>
        </button>

        <button
          type="button"
          className={item}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
          onClick={toggleSound}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span className={label}>Sound</span>
        </button>

        <a href="#contact" className={item} aria-label="Contact">
          <Mail size={18} />
          <span className={label}>Contact</span>
        </a>
      </div>
    </nav>
  );
}