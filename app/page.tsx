'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  MotionConfig,
} from 'framer-motion';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Command,
  Copy,
  Download,
  Github,
  Linkedin,
  Mail,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';

import Terminal from '@/components/Terminal';
import Cursor from '@/components/Cursor';
import Playground from '@/components/Playground';
import BackgroundNetwork from '@/components/BackgroundNetwork';
import BootScreen from '@/components/BootScreen';
import CommandPalette from '@/components/CommandPalette';
import SoundToggle from '@/components/SoundToggle';
import CaseStudyDrawer from '@/components/CaseStudyDrawer';
import MobileActionBar from '@/components/MobileActionBar';
import { projects } from '@/lib/projects';
import { buzz, installHaptics } from '@/lib/haptics';

const NeuralScene = dynamic(() => import('@/components/NeuralScene'), {
  ssr: false,
  loading: () => <div className="neural-fallback" aria-hidden="true" />,
});

const skills = [
  {
    group: 'LANGUAGES',
    items: ['Python', 'JavaScript', 'TypeScript', 'SQL'],
  },
  {
    group: 'AI / MACHINE LEARNING',
    items: [
      'Machine Learning',
      'Deep Learning · learning',
      'NLP',
      'LLMs',
      'RAG · exploring',
      'AI Agents · exploring',
    ],
  },
  {
    group: 'FRAMEWORKS & TOOLS',
    items: [
      'NumPy',
      'Pandas',
      'Scikit-learn',
      'Keras · learning',
      'LangChain · exploring',
      'Git',
      'Docker',
    ],
  },
  {
    group: 'PRODUCT & WEB',
    items: [
      'Next.js',
      'React',
      'Tailwind CSS',
      'Flask',
      'Supabase',
      'Vercel',
    ],
  },
];

const timeline = [
  {
    date: 'EXPECTED 2027',
    title: 'B.E. · Artificial Intelligence & Machine Learning',
    place: 'AMC Engineering College · Bengaluru',
    text: 'Undergraduate study focused on artificial intelligence, machine learning and the foundations of software engineering.',
  },
  {
    date: 'COMPLETED',
    title: 'Python for Data Science, AI & Development',
    place: 'IBM · Coursera',
    text: 'Completed the IBM course covering Python foundations and its application to data science and AI workflows.',
  },
  {
    date: 'IN PROGRESS',
    title: 'Generative AI Engineering',
    place: 'IBM Professional Certificate · Coursera',
    text: 'Continuing through generative AI application development, machine learning, deep learning, LLMs, transformers and AI-agent workflows.',
  },
  {
    date: 'ONGOING',
    title: 'Independent builds & experiments',
    place: 'Applied learning',
    text: 'Developing practical projects across applied machine learning, NLP and full-stack AI product concepts.',
  },
];

type ContactRow = {
  label: string;
  value: string;
  href: string;
  Icon: LucideIcon;
  external?: boolean;
  download?: boolean;
};

const prettyUrl = (u: string) =>
  u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

const rowBorder = {
  borderColor: 'color-mix(in srgb, currentColor 20%, transparent)',
};

// scroll-reveal props, spread onto any motion element
const reveal = (i = 0) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: 0.65,
    delay: Math.min(i * 0.07, 0.3),
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
});

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span className="eyebrow-dot" />
      {children}
    </div>
  );
}

function SectionHeading({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note?: string;
}) {
  return (
    <motion.div className="section-heading" {...reveal()}>
      <span className="section-index">{index} / 07</span>
      <h2>{title}</h2>
      {note && <p>{note}</p>}
    </motion.div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [time, setTime] = useState('');
  const [ready, setReady] = useState(false);
  const [caseOpen, setCaseOpen] = useState(false);
  const [coarse, setCoarse] = useState(false);

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
  const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL;
  const resumeUrl = process.env.NEXT_PUBLIC_RESUME_URL;

  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Fade the scroll indicator as the visitor leaves the hero.
  const heroFootOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.42],
    [1, 0.55, 0]
  );

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date())
      );
    };

    update();

    const id = window.setInterval(update, 30000);

    return () => window.clearInterval(id);
  }, []);

  // touch devices: enable haptics + card swiping
  useEffect(() => {
    installHaptics();
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const goProject = (dir: number) => {
    setActiveProject((i) => (i + dir + projects.length) % projects.length);
    buzz(10);
  };

  const copyEmail = async () => {
    if (!contactEmail) return;
    try {
      await navigator.clipboard.writeText(contactEmail);
      setCopied(true);
      buzz(12);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the mailto link still works */
    }
  };

  const contactRows: ContactRow[] = [];
  if (contactEmail) {
    contactRows.push({
      label: 'EMAIL',
      value: contactEmail,
      href: `mailto:${contactEmail}`,
      Icon: Mail,
    });
  }
  if (linkedinUrl) {
    contactRows.push({
      label: 'LINKEDIN',
      value: prettyUrl(linkedinUrl),
      href: linkedinUrl,
      external: true,
      Icon: Linkedin,
    });
  }
  if (githubUrl) {
    contactRows.push({
      label: 'GITHUB',
      value: prettyUrl(githubUrl),
      href: githubUrl,
      external: true,
      Icon: Github,
    });
  }
  if (resumeUrl) {
    contactRows.push({
      label: 'RESUME',
      value: 'Download PDF',
      href: resumeUrl,
      download: true,
      Icon: Download,
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <main id="main-content">
        <BackgroundNetwork />
        <BootScreen onDone={() => setReady(true)} />
        <CommandPalette
          email={contactEmail}
          github={githubUrl}
          linkedin={linkedinUrl}
          resume={resumeUrl}
        />
        <MobileActionBar suppress={menuOpen} />

        <a className="skip-link" href="#about">
          Skip to content
        </a>

        <Cursor />

        {/* NAVIGATION */}
        <header className="topbar">
          <a href="#top" className="wordmark" aria-label="Bilal home">
            BK<span>.</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#about">About</a>
            <a href="#work">Selected work</a>
            <a href="#stack">Capabilities</a>
            <a href="#journey">Journey</a>
            <a href="#playground">Playground</a>
          </nav>

          <div className="nav-right">
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(new Event('portfolio:open-palette'))
              }
              aria-label="Open command palette"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px]"
              style={rowBorder}
            >
              <Command size={13} /> K
            </button>

            <SoundToggle />

            <span className="availability">
              <i /> AI / ML · BUILDER
            </span>

            <a className="nav-contact" href="#contact">
              LET’S TALK <ArrowUpRight size={14} />
            </a>
          </div>

          <button
            className="mobile-menu"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={
              menuOpen ? 'Close navigation menu' : 'Open navigation menu'
            }
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* MOBILE NAVIGATION */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className="mobile-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {[
                ['About', '#about'],
                ['Selected work', '#work'],
                ['Capabilities', '#stack'],
                ['Journey', '#journey'],
                ['Playground', '#playground'],
                ['Contact', '#contact'],
              ].map(([t, h]) => (
                <a key={h} href={h} onClick={closeMenu}>
                  {t}
                  <ArrowUpRight size={17} />
                </a>
              ))}

              <div className="flex gap-3 px-1 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    window.dispatchEvent(new Event('portfolio:open-palette'));
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 font-mono text-[11px]"
                  style={rowBorder}
                >
                  <Command size={13} /> SEARCH
                </button>
                <SoundToggle />
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* HERO */}
        <section className="hero" id="top" ref={heroRef}>
          <div className="hero-grid" />

          <div className="hero-meta">
            <span>INDEPENDENT THINKER / BUILDER</span>
            <span>BENGALURU, IN · {time || '—'}</span>
          </div>

          <motion.div className="hero-copy">
            <Eyebrow>AI / ML ENGINEERING STUDENT</Eyebrow>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              Curious by
              <br />
              <em>nature.</em>
              <br />
              <span>Building by design.</span>
            </motion.h1>

            <div className="hero-bottom">
              <p>
                I’m Bilal — exploring the space between machine intelligence,
                thoughtful engineering and products that solve real problems.
              </p>

              <a
                href="#work"
                className="circle-link"
                aria-label="Explore selected work"
              >
                <ArrowDown size={20} />
              </a>
            </div>
          </motion.div>

          <div className="hero-art" aria-hidden="true">
            <NeuralScene progress={scrollYProgress} />
          </div>

          <motion.div
            className="hero-foot"
            style={{ opacity: heroFootOpacity }}
          >
            <span>SCROLL TO EXPLORE</span>
            <span>01 — 07</span>
          </motion.div>

          <div className="vertical-note">
            DESIGNING WITH INTENT · LEARNING IN PUBLIC
          </div>
        </section>

        {/* ABOUT */}
        <section className="intro section-pad" id="about">
          <div className="intro-aside">
            <Eyebrow>A LITTLE CONTEXT</Eyebrow>
            <span className="aside-number">01—</span>
          </div>

          <div className="intro-main">
            <motion.p className="intro-lead" {...reveal()}>
              I’m not here to collect buzzwords. I’m here to{' '}
              <em>understand how things work</em> — and then make something
              useful with that understanding.
            </motion.p>

            <motion.div className="intro-columns" {...reveal(1)}>
              <p>
                Currently pursuing a B.E. in Artificial Intelligence & Machine
                Learning at AMC Engineering College, Bengaluru. My interests
                sit across applied machine learning, generative AI and
                full-stack product development.
              </p>

              <p>
                I learn by building: testing ideas, getting things wrong,
                debugging, and iterating until the pieces make sense. The
                long-term direction is clear — become an engineer who can take
                intelligent systems from concept to something people can
                actually use.
              </p>
            </motion.div>

            <motion.div className="signature-row" {...reveal(2)}>
              <span className="signature">Bilal.</span>
              <span className="signature-caption">
                ENGINEERING THE NEXT ITERATION
                <br />
                ONE BUILD AT A TIME.
              </span>
            </motion.div>
          </div>
        </section>

        {/* SELECTED WORK */}
        <section className="work section-pad" id="work">
          <SectionHeading
            index="02"
            title="Selected work."
            note="A few things I’ve built, explored or taken from idea to implementation."
          />

          <div className="project-layout">
            <motion.div className="project-list" {...reveal()}>
              {projects.map((p, i) => (
                <button
                  key={p.n}
                  type="button"
                  className={`project-row ${
                    activeProject === i ? 'selected' : ''
                  }`}
                  aria-pressed={activeProject === i}
                  aria-controls="project-feature"
                  onMouseEnter={() => setActiveProject(i)}
                  onFocus={() => setActiveProject(i)}
                  onClick={() => setActiveProject(i)}
                >
                  <span className="project-no">{p.n}</span>
                  <span className="project-name">{p.title}</span>
                  <span className="project-type">{p.type}</span>
                  <ArrowUpRight className="project-arrow" size={19} />
                </button>
              ))}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.article
                id="project-feature"
                aria-live="polite"
                className={`project-feature ${projects[activeProject].tone}`}
                key={activeProject}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                drag={coarse ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 || info.velocity.x < -500) goProject(1);
                  else if (info.offset.x > 60 || info.velocity.x > 500) goProject(-1);
                }}
              >
                <div className="feature-top">
                  <span>
                    FEATURED CASE / {projects[activeProject].n}
                  </span>
                  <span>{projects[activeProject].year}</span>
                </div>

                <div className="feature-visual">
                  <div className="visual-grid" />
                  <span className="visual-mark">
                    {projects[activeProject].mark}
                  </span>
                  <span className="visual-corner">B / LAB</span>
                  <span className="visual-cross">✳</span>
                </div>

                <div className="feature-info">
                  <div>
                    <span className="feature-type">
                      {projects[activeProject].type}
                    </span>
                    <h3>{projects[activeProject].title}</h3>
                  </div>

                  <p>{projects[activeProject].desc}</p>
                </div>

                <p className="feature-detail">
                  {projects[activeProject].detail}
                </p>

                <div className="tag-row">
                  {projects[activeProject].stack.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCaseOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em]"
                  style={rowBorder}
                >
                  Read case study <ArrowUpRight size={14} />
                </button>
              </motion.article>
            </AnimatePresence>
          </div>

          {/* swipe dots (phones) */}
          <div className="mt-6 hidden items-center justify-between max-[650px]:flex">
            <div className="flex items-center">
              {projects.map((p, i) => (
                <button
                  key={p.n}
                  type="button"
                  aria-label={`Show project ${p.n}: ${p.title}`}
                  aria-current={activeProject === i}
                  onClick={() => setActiveProject(i)}
                  className="grid h-8 w-8 place-items-center"
                >
                  <span
                    className="block rounded-full transition-all"
                    style={{
                      height: 8,
                      width: activeProject === i ? 22 : 8,
                      background: 'currentColor',
                      opacity: activeProject === i ? 1 : 0.35,
                    }}
                  />
                </button>
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] opacity-60">
              Swipe the card ← →
            </span>
          </div>

          <CaseStudyDrawer
            project={projects[activeProject]}
            open={caseOpen}
            onClose={() => setCaseOpen(false)}
          />

          <p className="work-footnote">
            * Selected projects are presented as learning and build snapshots.
            Detailed repositories and live demos can be linked here as they are
            made public.
          </p>
        </section>

        {/* CAPABILITIES */}
        <section className="capabilities section-pad" id="stack">
          <SectionHeading
            index="03"
            title="Tools are means."
            note="A growing toolkit for turning questions into working systems."
          />

          <div className="capability-body">
            <motion.div className="capability-statement" {...reveal()}>
              <span className="big-asterisk">✳</span>
              <p>
                Technical depth comes from knowing <em>when</em> to use a tool
                — and why.
              </p>
              <span className="small-note">
                CURRENTLY LEARNING, ALWAYS ITERATING.
              </span>
            </motion.div>

            <div className="skill-groups">
              {skills.map((g, i) => (
                <motion.div
                  className="skill-group"
                  key={g.group}
                  {...reveal(i)}
                >
                  <span className="skill-index">0{i + 1}</span>

                  <div>
                    <h3>{g.group}</h3>
                    <div className="skill-tags">
                      {g.items.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TERMINAL */}
        <section className="terminal-section section-pad" id="terminal">
          <motion.div className="terminal-intro" {...reveal()}>
            <Eyebrow>A MORE DIRECT ROUTE</Eyebrow>

            <h2>
              Prefer to
              <br />
              <em>explore?</em>
            </h2>

            <p>
              A small terminal, just for fun. Type a command and get to know
              the work behind the page.
            </p>

            <span className="terminal-hint">
              <Command size={13} /> TRY <b>help</b> TO BEGIN
            </span>
          </motion.div>

          <Terminal />
        </section>

        {/* JOURNEY */}
        <section className="journey section-pad" id="journey">
          <SectionHeading
            index="05"
            title="In progress."
            note="A timeline of education, learning and the work in between."
          />

          <div className="timeline">
            {timeline.map((t, i) => (
              <motion.div
                className="timeline-item"
                key={t.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="timeline-marker">
                  <span />
                </div>

                <span className="timeline-date">{t.date}</span>

                <div className="timeline-content">
                  <h3>{t.title}</h3>
                  <span className="timeline-place">{t.place}</span>
                  <p>{t.text}</p>
                </div>

                <span className="timeline-count">0{i + 1}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PLAYGROUND */}
        <section className="playground-section section-pad" id="playground">
          <SectionHeading
            index="06"
            title="Playground."
            note="Two small machine-learning experiments. Break them on purpose."
          />

          <Playground />
        </section>

        {/* CONTACT */}
        <section className="contact section-pad" id="contact">
          <motion.div className="contact-top" {...reveal()}>
            <Eyebrow>07 / OPEN CHANNEL</Eyebrow>
            <span>HAVE A GOOD QUESTION? EVEN BETTER.</span>
          </motion.div>

          <motion.h2 {...reveal(1)}>
            Let’s make
            <br />
            <em>something matter.</em>
          </motion.h2>

          <p className="mt-6 max-w-xl">
            For opportunities, collaborations, thoughtful conversations or
            interesting problems.
          </p>

          {/* DESKTOP / TABLET: rows */}
          {contactRows.length > 0 && (
            <ul
              className="relative z-10 mt-10 border-t max-[650px]:hidden"
              style={rowBorder}
            >
              {contactRows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center gap-3 border-b"
                  style={rowBorder}
                >
                  <a
                    href={row.href}
                    {...(row.external
                      ? { target: '_blank', rel: 'noreferrer' }
                      : {})}
                    {...(row.download ? { download: true } : {})}
                    className="group flex min-w-0 flex-1 items-center gap-4 py-5 md:gap-8"
                  >
                    <span className="flex w-28 shrink-0 items-center gap-2 font-mono text-[11px] tracking-[0.16em] opacity-60 md:w-36">
                      <row.Icon size={18} />
                      {row.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[clamp(1.05rem,2.6vw,2rem)]">
                      {row.value}
                    </span>
                    <ArrowUpRight
                      size={22}
                      className="shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    />
                  </a>

                  {row.label === 'EMAIL' && (
                    <button
                      type="button"
                      onClick={copyEmail}
                      aria-label={
                        copied ? 'Email copied' : 'Copy email address'
                      }
                      className="flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 font-mono text-[10.5px] tracking-[0.16em]"
                      style={rowBorder}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span className="hidden sm:inline">
                        {copied ? 'COPIED' : 'COPY'}
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* PHONES: icon buttons */}
          {contactRows.length > 0 && (
            <div className="relative z-10 mt-10 hidden max-[650px]:block">
              <ul className="flex flex-wrap gap-x-5 gap-y-6">
                {contactRows.map((row) => (
                  <li key={row.label}>
                    <a
                      href={row.href}
                      {...(row.external
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                      {...(row.download ? { download: true } : {})}
                      aria-label={
                        row.label === 'RESUME'
                          ? 'Download resume'
                          : row.label === 'EMAIL'
                          ? 'Send an email'
                          : `Open ${row.label.toLowerCase()}`
                      }
                      className="flex flex-col items-center gap-2"
                    >
                      <span
                        className="grid h-16 w-16 place-items-center rounded-full border"
                        style={rowBorder}
                      >
                        <row.Icon size={26} />
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                        {row.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {contactEmail && (
                <div
                  className="mt-8 flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3"
                  style={rowBorder}
                >
                  <span className="min-w-0 break-all text-[14px] leading-snug">
                    {contactEmail}
                  </span>
                  <button
                    type="button"
                    onClick={copyEmail}
                    aria-label={copied ? 'Email copied' : 'Copy email address'}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border"
                    style={rowBorder}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}
            </div>
          )}

          {contactRows.length === 0 &&
            process.env.NODE_ENV !== 'production' && (
              <p className="mt-8 font-mono text-[12px] opacity-70">
                Dev note: set NEXT_PUBLIC_CONTACT_EMAIL,
                NEXT_PUBLIC_LINKEDIN_URL and NEXT_PUBLIC_GITHUB_URL in
                .env.local, then restart the dev server.
              </p>
            )}

          <div className="contact-orbit" aria-hidden="true">
            BK.
          </div>
        </section>

        {/* FOOTER */}
        <footer className="footer">
          <a href="#top" className="footer-logo">
            BK.
          </a>

          <span>
            © {new Date().getFullYear()} BILAL. BUILT WITH INTENTION.
          </span>

          <div className="socials">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <Github size={17} />
              </a>
            )}

            {linkedinUrl && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin size={17} />
              </a>
            )}

            {contactEmail && (
              <a href={`mailto:${contactEmail}`} aria-label="Email">
                <Mail size={17} />
              </a>
            )}
          </div>

          <a href="#top" className="back-top">
            BACK TO TOP ↑
          </a>
        </footer>
      </main>
    </MotionConfig>
  );
}