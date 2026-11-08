'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Terminal as TerminalIcon } from 'lucide-react';

type Entry = { cmd: string; output: ReactNode };

const commands: Record<string, ReactNode> = {
  help: (
    <div className="term-help">
      <p>Available commands:</p>
      <span><b>about</b> — a short introduction</span>
      <span><b>projects</b> — selected builds and coursework</span>
      <span><b>stack</b> — tools and technologies</span>
      <span><b>focus</b> — current learning direction</span>
      <span><b>education</b> — academic background</span>
      <span><b>contact</b> — contact availability</span>
      <span><b>clear</b> — clear the terminal</span>
    </div>
  ),
  about: <p>Bilal — an AI and machine learning engineering student at AMC Engineering College, Bengaluru. Interested in applied ML, generative AI and building useful products.</p>,
  whoami: <p>Bilal. AIML engineering student, independent builder and lifelong learner.</p>,
  projects: <p>01 / MechanicAI — automotive service product concept<br />02 / Credit Card Fraud Detection — Kaggle dataset, applied ML<br />03 / Emotion Detection API — IBM course project, Flask and NLP</p>,
  stack: <p>Python · JavaScript · TypeScript · Next.js · React · Tailwind CSS · Flask · NumPy · Pandas · Scikit-learn · Supabase</p>,
  focus: <p>Currently developing knowledge across generative AI applications, LLMs, retrieval-augmented generation, AI agents, model evaluation and applied machine learning.</p>,
  education: <p>B.E. in Artificial Intelligence &amp; Machine Learning — AMC Engineering College, Bengaluru. Expected completion: 2027.</p>,
  contact: <p>For professional enquiries, use the contact details published on this page when available.</p>,
};

export default function Terminal() {
  const [entries, setEntries] = useState<Entry[]>([
    { cmd: 'welcome', output: <p>Welcome to bilal.shell <span className="term-dim">v1.1.0</span><br />A little more context, one command at a time. Type <b>help</b>.</p> },
  ]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [entries]);

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === 'clear') {
      setEntries([]);
      setValue('');
      setHistoryIndex(-1);
      return;
    }
    const output = commands[cmd] ?? <p>Command not found: <b>{cmd}</b>. Type <b>help</b> to see what is available.</p>;
    setEntries((old) => [...old, { cmd: raw.trim(), output }]);
    setHistory((old) => [...old, raw.trim()]);
    setHistoryIndex(-1);
    setValue('');
  }

  return (
    <div className="terminal-window" onClick={() => input.current?.focus()}>
      <div className="terminal-bar">
        <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
        <span><TerminalIcon size={13} /> BILAL.SHELL — INTERACTIVE PROFILE</span>
        <span className="terminal-live">● LIVE</span>
      </div>
      <div className="terminal-body" role="log" aria-live="polite" aria-relevant="additions text">
        {entries.map((entry, index) => (
          <div className="term-entry" key={`${entry.cmd}-${index}`}>
            {entry.cmd !== 'welcome' && <div className="term-command"><span>visitor@bilal:~$</span> {entry.cmd}</div>}
            <div className="term-output">{entry.output}</div>
          </div>
        ))}
        <form className="term-form" onSubmit={(event) => { event.preventDefault(); run(value); }}>
          <label htmlFor="terminal-input">visitor@bilal:~$</label>
          <input
            ref={input}
            id="terminal-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                const next = Math.min(historyIndex + 1, history.length - 1);
                setHistoryIndex(next);
                setValue(history[history.length - 1 - next] ?? '');
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                const next = Math.max(historyIndex - 1, -1);
                setHistoryIndex(next);
                setValue(next < 0 ? '' : history[history.length - 1 - next] ?? '');
              }
            }}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Terminal command"
          />
          <span className="term-caret" aria-hidden="true" />
        </form>
        <div ref={end} />
      </div>
      <div className="terminal-status"><span>LOCAL SESSION</span><span>TRY: HELP / ABOUT / PROJECTS</span><span>UTF-8</span></div>
    </div>
  );
}
