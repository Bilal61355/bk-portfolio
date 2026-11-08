'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';

type Props = {
  email?: string;
  github?: string;
  linkedin?: string;
  resume?: string;
};

type Item = {
  id: string;
  label: string;
  hint: string;
  group: 'Go to' | 'Actions';
  run: () => void;
};

const border = { borderColor: 'color-mix(in srgb, currentColor 18%, transparent)' };

export default function CommandPalette({ email, github, linkedin, resume }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = () => {
    setOpen(false);
    setQuery('');
    setIdx(0);
  };

  const items = useMemo<Item[]>(() => {
    const go = (id: string) => () => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    };
    const list: Item[] = [
      { id: 'about', label: 'About', hint: 'section', group: 'Go to', run: go('about') },
      { id: 'work', label: 'Selected work', hint: 'projects case studies', group: 'Go to', run: go('work') },
      { id: 'stack', label: 'Capabilities', hint: 'skills tools stack', group: 'Go to', run: go('stack') },
      { id: 'terminal', label: 'Terminal', hint: 'commands help', group: 'Go to', run: go('terminal') },
      { id: 'journey', label: 'Journey', hint: 'timeline education', group: 'Go to', run: go('journey') },
      { id: 'playground', label: 'Playground', hint: 'gradient descent neural network', group: 'Go to', run: go('playground') },
      { id: 'contact', label: 'Contact', hint: 'email linkedin github', group: 'Go to', run: go('contact') },
      { id: 'top', label: 'Back to top', hint: 'hero', group: 'Go to', run: go('top') },
    ];
    if (email) {
      list.push({
        id: 'copy-email',
        label: 'Copy email address',
        hint: email,
        group: 'Actions',
        run: () => {
          void navigator.clipboard?.writeText(email).catch(() => undefined);
        },
      });
    }
    if (resume) {
      list.push({
        id: 'resume',
        label: 'Download resume',
        hint: 'pdf',
        group: 'Actions',
        run: () => {
          const a = document.createElement('a');
          a.href = resume;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          a.remove();
        },
      });
    }
    if (github) {
      list.push({
        id: 'github',
        label: 'Open GitHub',
        hint: 'new tab',
        group: 'Actions',
        run: () => window.open(github, '_blank', 'noreferrer'),
      });
    }
    if (linkedin) {
      list.push({
        id: 'linkedin',
        label: 'Open LinkedIn',
        hint: 'new tab',
        group: 'Actions',
        run: () => window.open(linkedin, '_blank', 'noreferrer'),
      });
    }
    list.push({
      id: 'sound',
      label: 'Toggle sound',
      hint: 'keystroke and click sounds',
      group: 'Actions',
      run: () => window.dispatchEvent(new Event('portfolio:toggle-sound')),
    });
    return list;
  }, [email, github, linkedin, resume]);

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return items;
    return items.filter((it) => {
      const hay = `${it.label} ${it.hint}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [items, query]);

  // open: Cmd/Ctrl+K and the nav button
  useEffect(() => {
    const openIt = () => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => {
          if (!o) lastFocus.current = document.activeElement as HTMLElement | null;
          return !o;
        });
      }
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('portfolio:open-palette', openIt);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('portfolio:open-palette', openIt);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      lastFocus.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    document.getElementById(`palette-opt-${idx}`)?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  const choose = (it?: Item) => {
    if (!it) return;
    close();
    window.setTimeout(it.run, 60);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(filtered[idx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/35 px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-xl overflow-hidden rounded-[4px] border shadow-2xl"
            style={{
              background: 'var(--cs-bg, #f4efe6)',
              color: 'var(--cs-fg, #1c1c1e)',
              ...border,
            }}
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3" style={border}>
              <Search size={16} className="opacity-60" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIdx(0);
                }}
                onKeyDown={onInputKey}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={filtered[idx] ? `palette-opt-${idx}` : undefined}
                aria-label="Search commands"
                placeholder="Jump to a section or run an action…"
                className="w-full bg-transparent text-[16px] outline-none placeholder:opacity-50"
              />
              <span className="hidden font-mono text-[10px] tracking-[0.16em] opacity-50 sm:block">
                ESC
              </span>
            </div>

            <ul
              id="palette-list"
              role="listbox"
              className="max-h-[50vh] overflow-y-auto p-2"
            >
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-[14px] opacity-60">
                  Nothing matches “{query}”.
                </li>
              )}
              {filtered.map((it, i) => (
                <li key={it.id} role="presentation">
                  {(i === 0 || filtered[i - 1].group !== it.group) && (
                    <div className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] opacity-45">
                      {it.group}
                    </div>
                  )}
                  <div
                    id={`palette-opt-${i}`}
                    role="option"
                    aria-selected={i === idx}
                    onMouseMove={() => setIdx(i)}
                    onClick={() => choose(it)}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-[3px] px-3 py-2.5 ${
                      i === idx ? 'bg-black/[0.07]' : ''
                    }`}
                  >
                    <span className="text-[15px]">{it.label}</span>
                    <span className="truncate font-mono text-[11px] opacity-45">
                      {it.hint}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}