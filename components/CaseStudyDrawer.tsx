'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Github, X } from 'lucide-react';
import type { Project } from '@/lib/projects';

const border = {
  borderColor: 'color-mix(in srgb, currentColor 20%, transparent)',
};
const label =
  'font-mono text-[10.5px] uppercase tracking-[0.16em] opacity-55';

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t pt-5" style={border}>
      <h3 className={`${label} mb-3`}>{title}</h3>
      {children}
    </section>
  );
}

export default function CaseStudyDrawer({
  project,
  open,
  onClose,
}: {
  project: Project;
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (!nodes || !nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus();
    };
  }, [open]);

  const cs = project.caseStudy;
  const hasLinks = project.links?.github || project.links?.live;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cs-backdrop"
            className="fixed inset-0 z-[80] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key="cs-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="case-study-title"
            className="fixed right-0 top-0 z-[81] h-full w-full max-w-[720px] overflow-y-auto p-6 md:p-10"
            style={{
              background: 'var(--cs-bg, #f4efe6)',
              color: 'var(--cs-fg, #1c1c1e)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className={label}>
                Case study / {project.n} · {cs.status}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close case study"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                style={border}
              >
                <X size={16} />
              </button>
            </div>

            <h2
              id="case-study-title"
              className="text-[clamp(2rem,5vw,3.4rem)] leading-[1.02]"
            >
              {project.title}
            </h2>
            <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed opacity-70">
              {project.desc}
            </p>

            <div className="mt-10 flex flex-col gap-8">
              <Block title="The problem">
                <p className="leading-relaxed">{cs.problem}</p>
              </Block>

              <Block title="The approach">
                <p className="leading-relaxed">{cs.approach}</p>
              </Block>

              <Block title="Architecture">
                <ol className="flex flex-col">
                  {cs.architecture.map((row, i) => (
                    <li key={row.layer}>
                      <div className="rounded-[3px] border p-4" style={border}>
                        <div className={`${label} mb-2`}>{row.layer}</div>
                        <div className="flex flex-wrap gap-2">
                          {row.nodes.map((n) => (
                            <span
                              key={n}
                              className="rounded-full border px-3 py-1 text-[13px]"
                              style={border}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                      {i < cs.architecture.length - 1 && (
                        <div
                          aria-hidden="true"
                          className="py-1 text-center font-mono text-[12px] opacity-40"
                        >
                          ↓
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </Block>

              <Block title="Key features">
                <ul className="flex flex-col gap-2">
                  {cs.features.map((f) => (
                    <li key={f} className="flex gap-3 leading-relaxed">
                      <span aria-hidden="true" className="opacity-40">✳</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Stack">
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border px-3 py-1 text-[13px]"
                      style={border}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Block>

              {cs.next && cs.next.length > 0 && (
                <Block title="What’s next">
                  <ul className="flex flex-col gap-2">
                    {cs.next.map((f) => (
                      <li key={f} className="flex gap-3 leading-relaxed opacity-80">
                        <span aria-hidden="true" className="opacity-40">→</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}

              <Block title="Links">
                {hasLinks ? (
                  <div className="flex flex-wrap gap-3">
                    {project.links?.github && (
                      <a
                        href={project.links.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em]"
                        style={border}
                      >
                        <Github size={14} /> GitHub <ArrowUpRight size={13} />
                      </a>
                    )}
                    {project.links?.live && (
                      <a
                        href={project.links.live}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em]"
                        style={border}
                      >
                        Live demo <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-[14px] opacity-60">
                    Repository and live-demo links will be added when this work is public.
                  </p>
                )}
              </Block>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}