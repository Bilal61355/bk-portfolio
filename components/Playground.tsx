"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

/* ───────────────────────── shared ───────────────────────── */

const INK = "28,28,30";
const BLUE = "110,170,225";
const CHAMP = "190,160,110";

const mono =
  "font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#1c1c1e]";

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

function useInView(ref: RefObject<HTMLElement>) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

function useStageSize(heightFor: (w: number) => number) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      if (w > 0) setSize((s) => (s.w === w ? s : { w, h: heightFor(w) }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [heightFor]);
  return { ref, size };
}

function setupCanvas(c: HTMLCanvasElement, w: number, h: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  c.style.width = `${w}px`;
  c.style.height = `${h}px`;
  const ctx = c.getContext("2d");
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function Btn({
  children,
  onClick,
  active,
  disabled,
  swatch,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  swatch?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`${mono} inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors disabled:opacity-40 ${
        active
          ? "border-[#1c1c1e] bg-[#1c1c1e] !text-[#f4efe6]"
          : "border-[#1c1c1e]/25 hover:border-[#1c1c1e]"
      }`}
    >
      {swatch && (
        <i
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: `rgb(${swatch})` }}
        />
      )}
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className={mono}>
          {label}
        </label>
        <span className={`${mono} opacity-60`}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#1c1c1e]"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-[#1c1c1e]/15 pt-2">
      <div className={`${mono} opacity-50`}>{label}</div>
      <div className="mt-1 font-mono text-[15px] tabular-nums text-[#1c1c1e]">
        {value}
      </div>
    </div>
  );
}

const frame =
  "overflow-hidden rounded-[2px] border border-[#1c1c1e]/15 bg-white/40";
const panel = "flex flex-col gap-5 border border-[#1c1c1e]/15 bg-white/30 p-5";

/* ───────────────────── 01 · GRADIENT DESCENT ───────────────────── */

const XMIN = -4;
const XMAX = 4;
const f = (x: number) =>
  0.08 * x * x + 0.8 * Math.sin(1.7 * x) + 0.25 * Math.sin(4.3 * x);
const df = (x: number) =>
  0.16 * x + 1.36 * Math.cos(1.7 * x) + 1.075 * Math.cos(4.3 * x);

const { GX, FMIN, FMAX } = (() => {
  let gx = 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (let x = XMIN; x <= XMAX; x += 0.002) {
    const y = f(x);
    if (y < lo) {
      lo = y;
      gx = x;
    }
    if (y > hi) hi = y;
  }
  return { GX: gx, FMIN: lo, FMAX: hi };
})();

const STEP_MS = 45;
const gdHeight = (w: number) => (w < 520 ? 270 : 360);

function GradientDescentLab({ scenario }: { scenario: Scenario | null }) {
  const reduce = usePrefersReducedMotion();
  const { ref: stageRef, size } = useStageSize(gdHeight);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(stageRef);

  const [lr, setLr] = useState(0.08);
  const [mom, setMom] = useState(0);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({
    step: 0,
    x: -3.3,
    loss: f(-3.3),
    grad: df(-3.3),
    status: "Drag on the landscape to drop the ball.",
  });

  const lrRef = useRef(lr);
  const momRef = useRef(mom);
  const runningRef = useRef(running);
  const inViewRef = useRef(inView);
  lrRef.current = lr;
  momRef.current = mom;
  runningRef.current = running;
  inViewRef.current = inView;

  const s = useRef({
    x: -3.3,
    startX: -3.3,
    v: 0,
    trail: [] as number[],
    step: 0,
    still: 0,
    dragging: false,
    placed: false,
    done: false,
    status: "Descending…",
  });

  useEffect(() => {
    setRunning(!reduce);
  }, [reduce]);

  const drop = (x: number, run: boolean) => {
    const st = s.current;
    st.x = Math.min(XMAX, Math.max(XMIN, x));
    st.startX = st.x;
    st.v = 0;
    st.trail = [];
    st.step = 0;
    st.still = 0;
    st.done = false;
    st.status = "Descending…";
    setRunning(run);
  };
    // guide missions drive the controls
  useEffect(() => {
    if (!scenario) return;
    if (scenario.lr !== undefined) setLr(scenario.lr);
    if (scenario.mom !== undefined) setMom(scenario.mom);
    s.current.placed = true;
    drop(scenario.x ?? -3.3, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // stats readout (decoupled from the 60fps loop)
  useEffect(() => {
    const id = window.setInterval(() => {
      const st = s.current;
      setStats({
        step: st.step,
        x: st.x,
        loss: f(st.x),
        grad: df(st.x),
        status: st.placed || st.step > 0 ? st.status : "Drag on the landscape to drop the ball.",
      });
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const ctx = setupCanvas(canvas, size.w, size.h);
    if (!ctx) return;

    const { w, h } = size;
    const padX = 18;
    const top = 38;
    const bottom = 30;
    const sx = (w - padX * 2) / (XMAX - XMIN);
    const sy = (h - top - bottom) / (FMAX - FMIN);
    const X = (x: number) => padX + (x - XMIN) * sx;
    const Y = (y: number) => top + (FMAX - y) * sy;

    const N = Math.max(160, Math.floor(w / 2));
    const curve: [number, number][] = Array.from({ length: N + 1 }, (_, i) => {
      const x = XMIN + (i / N) * (XMAX - XMIN);
      return [X(x), Y(f(x))];
    });

    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const stepOnce = () => {
      const st = s.current;
      const g = df(st.x);
      st.v = momRef.current * st.v - lrRef.current * g;
      st.trail.push(st.x);
      if (st.trail.length > 70) st.trail.shift();
      const nx = st.x + st.v;
      st.step++;

      if (nx < XMIN || nx > XMAX) {
        st.x = Math.min(XMAX, Math.max(XMIN, nx));
        st.done = true;
        st.status = "Overshot the landscape: learning rate too high.";
        setRunning(false);
        return;
      }
      st.x = nx;
      st.still = Math.abs(st.v) < 2e-4 ? st.still + 1 : 0;
      if (st.still >= 12) {
        st.done = true;
        st.status =
          Math.abs(st.x - GX) < 0.12
            ? "Global minimum found."
            : "Stuck in a local minimum.";
        setRunning(false);
      }
    };

    const draw = () => {
      const st = s.current;
      ctx.clearRect(0, 0, w, h);

      // fill under the curve
      const fill = ctx.createLinearGradient(0, top, 0, h - bottom);
      fill.addColorStop(0, `rgba(${BLUE},0.22)`);
      fill.addColorStop(1, `rgba(${BLUE},0)`);
      ctx.beginPath();
      ctx.moveTo(curve[0][0], h - bottom + 8);
      for (const [cx, cy] of curve) ctx.lineTo(cx, cy);
      ctx.lineTo(curve[curve.length - 1][0], h - bottom + 8);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();

      // axis
      ctx.strokeStyle = `rgba(${INK},0.12)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, h - bottom + 8.5);
      ctx.lineTo(w - padX, h - bottom + 8.5);
      ctx.stroke();

      // curve
      ctx.beginPath();
      curve.forEach(([cx, cy], i) => (i ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy)));
      ctx.strokeStyle = `rgba(${INK},0.85)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // global minimum marker
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = `rgba(${CHAMP},0.9)`;
      ctx.beginPath();
      ctx.moveTo(X(GX), Y(f(GX)) + 6);
      ctx.lineTo(X(GX), h - bottom + 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${CHAMP},1)`;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText("GLOBAL MIN", X(GX), h - 8);

      // labels
      ctx.fillStyle = `rgba(${INK},0.5)`;
      ctx.textAlign = "left";
      ctx.fillText("LOSS L(θ)", padX, 20);
      ctx.textAlign = "right";
      ctx.fillText("θ →", w - padX, 20);

      // trail
      st.trail.forEach((tx, i) => {
        const a = ((i + 1) / st.trail.length) * 0.55;
        ctx.fillStyle = `rgba(${BLUE},${a})`;
        ctx.beginPath();
        ctx.arc(X(tx), Y(f(tx)), 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      const bx = X(st.x);
      const by = Y(f(st.x));
      const g = df(st.x);

      // tangent
      const m = -g * (sy / sx);
      const half = 46 / Math.sqrt(1 + m * m);
      ctx.strokeStyle = `rgba(${CHAMP},0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - half, by - m * half);
      ctx.lineTo(bx + half, by + m * half);
      ctx.stroke();

      // next-step preview
      if (!st.done) {
        const nx = st.x + momRef.current * st.v - lrRef.current * g;
        if (nx >= XMIN && nx <= XMAX) {
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = `rgba(${INK},0.55)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(X(nx), Y(f(nx)));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(X(nx), Y(f(nx)), 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${INK},0.55)`;
          ctx.stroke();
        }
      }

      // ball
      ctx.beginPath();
      ctx.arc(bx, by - 9, 10, 0, Math.PI * 2);
      const ball = ctx.createRadialGradient(bx - 3, by - 13, 1, bx, by - 9, 11);
      ball.addColorStop(0, "#ffffff");
      ball.addColorStop(0.6, "#e6e9ee");
      ball.addColorStop(1, "#aeb8c6");
      ctx.fillStyle = ball;
      ctx.fill();
      ctx.strokeStyle = `rgba(${CHAMP},1)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (!st.placed && st.step === 0) {
        ctx.fillStyle = `rgba(${INK},0.55)`;
        ctx.textAlign = "center";
        ctx.fillText("DRAG ANYWHERE TO DROP THE BALL", w / 2, 20);
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 100);
      last = now;
      if (!inViewRef.current) return;
      const st = s.current;
      if (runningRef.current && !st.dragging && !st.done) {
        acc += dt;
        while (acc >= STEP_MS) {
          acc -= STEP_MS;
          stepOnce();
        }
      } else {
        acc = 0;
      }
      draw();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  const toTheta = (clientX: number) => {
    const c = canvasRef.current;
    if (!c) return 0;
    const r = c.getBoundingClientRect();
    return XMIN + ((clientX - r.left - 18) / (r.width - 36)) * (XMAX - XMIN);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    s.current.dragging = true;
    s.current.placed = true;
    drop(toTheta(e.clientX), false);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!s.current.dragging) return;
    s.current.x = Math.min(XMAX, Math.max(XMIN, toTheta(e.clientX)));
    s.current.startX = s.current.x;
  };
  const onUp = () => {
    if (!s.current.dragging) return;
    s.current.dragging = false;
    setRunning(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className={frame} ref={stageRef} style={{ minHeight: 270 }}>
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="img"
          aria-label="Loss landscape. Drag to drop a ball and watch gradient descent roll it downhill."
        />
      </div>

      <div className={panel}>
        <div>
          <div className={`${mono} mb-2 opacity-50`}>Status</div>
          <p className="font-mono text-[12px] leading-relaxed text-[#1c1c1e]" aria-live="polite">
            {stats.status}
          </p>
        </div>

        <Slider
          label="Learning rate"
          value={lr}
          min={0.005}
          max={0.6}
          step={0.005}
          onChange={setLr}
          format={(v) => v.toFixed(3)}
        />
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => setLr(0.01)} active={lr === 0.01}>Crawl</Btn>
          <Btn onClick={() => setLr(0.08)} active={lr === 0.08}>Balanced</Btn>
          <Btn onClick={() => setLr(0.5)} active={lr === 0.5}>Overshoot</Btn>
        </div>

        <Slider
          label="Momentum"
          value={mom}
          min={0}
          max={0.95}
          step={0.05}
          onChange={setMom}
          format={(v) => v.toFixed(2)}
        />

        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={() => {
              if (s.current.done) drop(s.current.startX, true);
              else setRunning((r) => !r);
            }}
          >
            {s.current.done ? "Replay" : running ? "Pause" : "Run"}
          </Btn>
          <Btn onClick={() => { s.current.placed = true; drop(-3.6 + Math.random() * 7.2, true); }}>
            Random drop
          </Btn>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat label="Step" value={String(stats.step)} />
          <Stat label="θ" value={stats.x.toFixed(3)} />
          <Stat label="Loss" value={stats.loss.toFixed(3)} />
          <Stat label="Gradient" value={stats.grad.toFixed(3)} />
        </div>

        <p className="text-[12px] leading-relaxed text-[#1c1c1e]/60">
          Too high a learning rate overshoots; too low crawls. Momentum lets the ball roll
          over small hills and escape local minima.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── 02 · TRAIN A TINY NETWORK ───────────────────── */

type Pt = { x: number; y: number; c: 0 | 1 };

type Net = {
  h: number;
  n: number;
  th: Float64Array;
  m: Float64Array;
  v: Float64Array;
  g: Float64Array;
  a1: Float64Array;
  a2: Float64Array;
  d1: Float64Array;
  d2: Float64Array;
  t: number;
  o: { W1: number; b1: number; W2: number; b2: number; W3: number; b3: number };
};

const randn = () => {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

function createNet(h: number): Net {
  const o = {
    W1: 0,
    b1: 2 * h,
    W2: 3 * h,
    b2: 3 * h + h * h,
    W3: 4 * h + h * h,
    b3: 5 * h + h * h,
  };
  const n = 5 * h + h * h + 1;
  const th = new Float64Array(n);
  for (let i = 0; i < 2 * h; i++) th[o.W1 + i] = randn() * 1.2;
  for (let i = 0; i < h * h; i++) th[o.W2 + i] = randn() * Math.sqrt(1 / h);
  for (let i = 0; i < h; i++) th[o.W3 + i] = randn() * Math.sqrt(1 / h);
  return {
    h, n, th, o, t: 0,
    m: new Float64Array(n),
    v: new Float64Array(n),
    g: new Float64Array(n),
    a1: new Float64Array(h),
    a2: new Float64Array(h),
    d1: new Float64Array(h),
    d2: new Float64Array(h),
  };
}

function predict(net: Net, x: number, y: number) {
  const { h, th, o, a1, a2 } = net;
  for (let i = 0; i < h; i++) {
    a1[i] = Math.tanh(th[o.W1 + 2 * i] * x + th[o.W1 + 2 * i + 1] * y + th[o.b1 + i]);
  }
  for (let i = 0; i < h; i++) {
    let s = th[o.b2 + i];
    const r = o.W2 + i * h;
    for (let j = 0; j < h; j++) s += th[r + j] * a1[j];
    a2[i] = Math.tanh(s);
  }
  let s = th[o.b3];
  for (let j = 0; j < h; j++) s += th[o.W3 + j] * a2[j];
  return 1 / (1 + Math.exp(-s));
}

function evaluate(net: Net, pts: Pt[]) {
  if (!pts.length) return { loss: 0, acc: 0 };
  let loss = 0;
  let ok = 0;
  for (const p of pts) {
    const q = predict(net, p.x, p.y);
    loss -= p.c * Math.log(q + 1e-9) + (1 - p.c) * Math.log(1 - q + 1e-9);
    if ((q > 0.5 ? 1 : 0) === p.c) ok++;
  }
  return { loss: loss / pts.length, acc: ok / pts.length };
}

function trainEpoch(net: Net, pts: Pt[], lr: number) {
  const { h, th, o, g, a1, a2, d1, d2 } = net;
  g.fill(0);
  for (const p of pts) {
    const q = predict(net, p.x, p.y);
    const d3 = q - p.c;
    for (let j = 0; j < h; j++) g[o.W3 + j] += d3 * a2[j];
    g[o.b3] += d3;
    for (let i = 0; i < h; i++) {
      d2[i] = d3 * th[o.W3 + i] * (1 - a2[i] * a2[i]);
    }
    for (let j = 0; j < h; j++) d1[j] = 0;
    for (let i = 0; i < h; i++) {
      const r = o.W2 + i * h;
      for (let j = 0; j < h; j++) {
        g[r + j] += d2[i] * a1[j];
        d1[j] += d2[i] * th[r + j];
      }
      g[o.b2 + i] += d2[i];
    }
    for (let j = 0; j < h; j++) {
      const d = d1[j] * (1 - a1[j] * a1[j]);
      g[o.W1 + 2 * j] += d * p.x;
      g[o.W1 + 2 * j + 1] += d * p.y;
      g[o.b1 + j] += d;
    }
  }
  // Adam
  net.t++;
  const B1 = 0.9;
  const B2 = 0.999;
  const lrt = (lr * Math.sqrt(1 - Math.pow(B2, net.t))) / (1 - Math.pow(B1, net.t));
  const inv = 1 / pts.length;
  for (let k = 0; k < net.n; k++) {
    const gk = g[k] * inv;
    net.m[k] = B1 * net.m[k] + (1 - B1) * gk;
    net.v[k] = B2 * net.v[k] + (1 - B2) * gk * gk;
    th[k] -= (lrt * net.m[k]) / (Math.sqrt(net.v[k]) + 1e-8);
  }
}

const clamp = (v: number) => Math.max(-0.95, Math.min(0.95, v));
const jit = (s: number) => randn() * s;

type Preset = "blobs" | "xor" | "circles" | "spiral";
const PRESETS: { id: Preset; label: string }[] = [
  { id: "blobs", label: "Blobs" },
  { id: "xor", label: "XOR" },
  { id: "circles", label: "Circles" },
  { id: "spiral", label: "Spiral" },
];

function makePreset(kind: Preset): Pt[] {
  const out: Pt[] = [];
  const add = (x: number, y: number, c: 0 | 1) => out.push({ x: clamp(x), y: clamp(y), c });
  if (kind === "blobs") {
    for (let i = 0; i < 40; i++) {
      add(-0.45 + jit(0.17), -0.4 + jit(0.17), 0);
      add(0.45 + jit(0.17), 0.4 + jit(0.17), 1);
    }
  } else if (kind === "xor") {
    for (let i = 0; i < 20; i++) {
      add(0.55 + jit(0.13), 0.55 + jit(0.13), 0);
      add(-0.55 + jit(0.13), -0.55 + jit(0.13), 0);
      add(-0.55 + jit(0.13), 0.55 + jit(0.13), 1);
      add(0.55 + jit(0.13), -0.55 + jit(0.13), 1);
    }
  } else if (kind === "circles") {
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = Math.sqrt(Math.random()) * 0.36;
      add(Math.cos(a) * r0, Math.sin(a) * r0, 0);
      const a2 = Math.random() * Math.PI * 2;
      const r1 = 0.66 + Math.random() * 0.22;
      add(Math.cos(a2) * r1, Math.sin(a2) * r1, 1);
    }
  } else {
    for (let i = 0; i < 55; i++) {
      const t = i / 55;
      const r = 0.06 + t * 0.82;
      for (const arm of [0, 1] as const) {
        const ang = t * 3.1 * Math.PI + arm * Math.PI;
        add(r * Math.cos(ang) + jit(0.025), r * Math.sin(ang) + jit(0.025), arm);
      }
    }
  }
  return out;
}

const GRID = 56;
const netHeight = (w: number) => w;

function NetworkLab({ scenario }: { scenario: Scenario | null })  {
  const reduce = usePrefersReducedMotion();
  const { ref: stageRef, size } = useStageSize(netHeight);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inView = useInView(stageRef);

  const [cls, setCls] = useState<0 | 1>(0);
  const [training, setTraining] = useState(false);
  const [width, setWidth] = useState(8);
  const [lr, setLr] = useState(0.03);
  const [preset, setPreset] = useState<Preset>("blobs");
  const [stats, setStats] = useState({ epoch: 0, loss: 0, acc: 0, n: 0 });
  const [hist, setHist] = useState<number[]>([]);

  const netRef = useRef<Net | null>(null);
  const ptsRef = useRef<Pt[]>([]);
  const epochRef = useRef(0);
  const histRef = useRef<number[]>([]);
  const dirty = useRef(true);
  const clsRef = useRef(cls);
  const trainingRef = useRef(training);
  const lrRef = useRef(lr);
  const inViewRef = useRef(inView);
  clsRef.current = cls;
  trainingRef.current = training;
  lrRef.current = lr;
  inViewRef.current = inView;

  const resetNet = (h: number) => {
    netRef.current = createNet(h);
    epochRef.current = 0;
    histRef.current = [];
    dirty.current = true;
  };

  // initial dataset
  useEffect(() => {
    ptsRef.current = makePreset("blobs");
    resetNet(8);
    setTraining(!reduce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPreset = (p: Preset) => {
    setPreset(p);
    ptsRef.current = makePreset(p);
    resetNet(width);
    setTraining(true);
  };
    // guide missions drive the controls
  useEffect(() => {
    if (!scenario) return;
    const w = scenario.width ?? width;
    if (scenario.width !== undefined) setWidth(scenario.width);
    if (scenario.preset) {
      setPreset(scenario.preset);
      ptsRef.current = makePreset(scenario.preset);
    }
    resetNet(w);
    setTraining(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  // stats readout
  useEffect(() => {
    const id = window.setInterval(() => {
      const net = netRef.current;
      if (!net) return;
      const e = evaluate(net, ptsRef.current);
      setStats({ epoch: epochRef.current, loss: e.loss, acc: e.acc, n: ptsRef.current.length });
      setHist([...histRef.current]);
    }, 150);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const ctx = setupCanvas(canvas, size.w, size.h);
    if (!ctx) return;
    const { w, h } = size;

    const off = document.createElement("canvas");
    off.width = GRID;
    off.height = GRID;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    const img = offCtx.createImageData(GRID, GRID);

    dirty.current = true;
    let raf = 0;

    const draw = () => {
      const net = netRef.current;
      if (!net) return;

      // decision boundary
      const d = img.data;
      for (let gy = 0; gy < GRID; gy++) {
        for (let gx = 0; gx < GRID; gx++) {
          const x = ((gx + 0.5) / GRID) * 2 - 1;
          const y = 1 - ((gy + 0.5) / GRID) * 2;
          const p = predict(net, x, y);
          const t = Math.abs(2 * p - 1);
          const i = (gy * GRID + gx) * 4;
          if (t < 0.07) {
            d[i] = 28; d[i + 1] = 28; d[i + 2] = 30;
            d[i + 3] = Math.round(255 * 0.4 * (1 - t / 0.07));
          } else {
            const [r, g, b] = p > 0.5 ? [190, 160, 110] : [110, 170, 225];
            d[i] = r; d[i + 1] = g; d[i + 2] = b;
            d[i + 3] = Math.round(255 * (0.1 + 0.3 * t));
          }
        }
      }
      offCtx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, w, h);

      // axes
      ctx.strokeStyle = `rgba(${INK},0.08)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
      ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
      ctx.stroke();

      // points
      for (const p of ptsRef.current) {
        const px = ((p.x + 1) / 2) * w;
        const py = ((1 - p.y) / 2) * h;
        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${p.c ? CHAMP : BLUE})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${INK},0.8)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (!ptsRef.current.length) {
        ctx.fillStyle = `rgba(${INK},0.55)`;
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.fillText("CLICK TO ADD POINTS", w / 2, h / 2);
      }
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!inViewRef.current) return;
      const net = netRef.current;
      if (!net) return;
      const pts = ptsRef.current;
      if (trainingRef.current && pts.length >= 2) {
        for (let k = 0; k < 4; k++) {
          trainEpoch(net, pts, lrRef.current);
          epochRef.current++;
          if (epochRef.current % 3 === 0) {
            histRef.current.push(evaluate(net, pts).loss);
            if (histRef.current.length > 150) histRef.current.shift();
          }
        }
        dirty.current = true;
      }
      if (dirty.current) {
        dirty.current = false;
        draw();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  const addPoint = (clientX: number, clientY: number, c: 0 | 1) => {
    const el = canvasRef.current;
    if (!el || ptsRef.current.length >= 400) return;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 2 - 1;
    const y = 1 - ((clientY - r.top) / r.height) * 2;
    ptsRef.current = [...ptsRef.current, { x, y, c }];
    dirty.current = true;
    setTraining(true);
  };

  const down = useRef({ x: 0, y: 0, t: 0 });
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    down.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;
    const moved = Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y);
    if (moved < 6 && performance.now() - down.current.t < 500) {
      addPoint(e.clientX, e.clientY, clsRef.current);
    }
  };

  const maxLoss = Math.max(0.01, ...hist);
  const spark = hist
    .map((v, i) => `${(i / Math.max(hist.length - 1, 1)) * 120},${27 - (v / maxLoss) * 25}`)
    .join(" ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
      <div className={`${frame} w-full max-w-[560px]`} ref={stageRef} style={{ minHeight: 280 }}>
        <canvas
          ref={canvasRef}
          className="block cursor-crosshair"
          style={{ touchAction: "pan-y" }}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onContextMenu={(e) => {
            e.preventDefault();
            addPoint(e.clientX, e.clientY, clsRef.current === 0 ? 1 : 0);
          }}
          role="img"
          aria-label="Two-dimensional plane. Click to add training points; a small neural network learns to separate the two classes."
        />
      </div>

      <div className={`${panel} lg:max-w-[360px]`}>
        <div>
          <div className={`${mono} mb-2 opacity-50`}>Dataset</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Btn key={p.id} onClick={() => loadPreset(p.id)} active={preset === p.id}>
                {p.label}
              </Btn>
            ))}
          </div>
        </div>

        <div>
          <div className={`${mono} mb-2 opacity-50`}>Click adds</div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => setCls(0)} active={cls === 0} swatch={BLUE}>Class A</Btn>
            <Btn onClick={() => setCls(1)} active={cls === 1} swatch={CHAMP}>Class B</Btn>
          </div>
          <p className="mt-2 text-[11px] text-[#1c1c1e]/50">Right-click adds the other class.</p>
        </div>

        <Slider
          label="Neurons / layer"
          value={width}
          min={3}
          max={16}
          step={1}
          onChange={(v) => {
            setWidth(v);
            resetNet(v);
          }}
        />
        <Slider
          label="Learning rate"
          value={lr}
          min={0.005}
          max={0.1}
          step={0.005}
          onChange={setLr}
          format={(v) => v.toFixed(3)}
        />

        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => setTraining((t) => !t)} active={training}>
            {training ? "Pause" : "Train"}
          </Btn>
          <Btn onClick={() => { resetNet(width); setTraining(true); }}>Reset weights</Btn>
          <Btn
            onClick={() => {
              ptsRef.current = [];
              resetNet(width);
              setTraining(false);
            }}
          >
            Clear
          </Btn>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat label="Epoch" value={String(stats.epoch)} />
          <Stat label="Points" value={String(stats.n)} />
          <Stat label="Loss" value={stats.loss.toFixed(3)} />
          <Stat label="Accuracy" value={`${Math.round(stats.acc * 100)}%`} />
        </div>

        <svg viewBox="0 0 120 28" className="h-8 w-full" aria-hidden="true" preserveAspectRatio="none">
          <polyline points={spark} fill="none" stroke={`rgb(${INK})`} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <p className="text-[12px] leading-relaxed text-[#1c1c1e]/60">
          A 2 → N → N → 1 network trained with Adam, running live in your browser. Try the
          spiral with few neurons, then add more.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── guide + shell ───────────────────── */

type Scenario = {
  lr?: number;
  mom?: number;
  x?: number;
  preset?: Preset;
  width?: number;
};

// Find a start point where plain descent gets stuck but momentum reaches the global minimum
const simulate = (x0: number, lr: number, mom: number) => {
  let x = x0;
  let v = 0;
  for (let i = 0; i < 600; i++) {
    v = mom * v - lr * df(x);
    x += v;
    if (x < XMIN || x > XMAX) return null;
    if (i > 20 && Math.abs(v) < 2e-4) break;
  }
  return x;
};

const DEMO_X = (() => {
  for (let x = -3.6; x <= 3.6; x += 0.1) {
    const plain = simulate(x, 0.08, 0);
    const heavy = simulate(x, 0.05, 0.85);
    if (
      plain !== null &&
      heavy !== null &&
      Math.abs(plain - GX) > 0.3 &&
      Math.abs(heavy - GX) < 0.12
    ) {
      return x;
    }
  }
  return -3.3;
})();

type Mission = { title: string; hint: string; scenario: Scenario };
type GuideContent = {
  story: string;
  plain: string;
  terms: { term: string; def: string }[];
  missions: Mission[];
  outro: string;
};

const GUIDES: Record<"gd" | "net", GuideContent> = {
  gd: {
    story:
      "You're blindfolded on a hilly field and told to find the lowest ground. All you can feel is the slope under your feet, so you take a step downhill. Then another.",
    plain:
      "That's gradient descent, the method almost every AI model uses to learn. The ball is you, the hills are how wrong the model is, and the valleys are where it's getting things right.",
    terms: [
      { term: "The hills · Loss", def: "How wrong the model is. Higher ground means worse. The goal is the lowest valley." },
      { term: "Champagne line · Gradient", def: "The slope under the ball. It tells the ball which way is downhill." },
      { term: "Dotted line · Learning rate", def: "How big each step is. The dotted line previews the next step." },
      { term: "Momentum", def: "A heavy ball keeps some speed, so it can roll over small bumps." },
    ],
    missions: [
      { title: "Roll downhill", hint: "Normal settings. Watch it find a dip and settle.", scenario: { lr: 0.08, mom: 0, x: -3.3 } },
      { title: "Baby steps", hint: "Tiny steps. Safe, but painfully slow.", scenario: { lr: 0.01, mom: 0, x: -3.3 } },
      { title: "Giant leaps", hint: "Huge steps. Watch it jump around and overshoot.", scenario: { lr: 0.5, mom: 0, x: -3.3 } },
      { title: "Heavy ball", hint: "Momentum on. It can roll over bumps that trap a light ball.", scenario: { lr: 0.05, mom: 0.85, x: DEMO_X } },
    ],
    outro: "Then drag the ball anywhere and play with the sliders yourself.",
  },
  net: {
    story:
      "Imagine teaching a robot to sort gold coins from blue stones by showing it examples. At first it guesses badly. Each round it checks its mistakes, nudges its tiny internal dials, and tries again.",
    plain:
      "That's how a neural network learns. Below, it does thousands of those rounds in a second, and you can watch it redraw its border as it improves.",
    terms: [
      { term: "Dots · Examples", def: "Blue and gold are two categories the network must tell apart." },
      { term: "Tinted background · Its guess", def: "What the network currently believes about every spot on the plane." },
      { term: "Dark line · The border", def: "Where it has decided one category ends and the other begins." },
      { term: "Loss & Accuracy", def: "How wrong it is, and how many dots it gets right. Watch the loss fall." },
    ],
    missions: [
      { title: "Easy split", hint: "Two clear groups. It learns almost instantly.", scenario: { preset: "blobs", width: 8 } },
      { title: "Bend the line", hint: "One group sits inside the other, so the border must curve.", scenario: { preset: "circles", width: 8 } },
      { title: "Tiny brain", hint: "A hard spiral with only 3 neurons per layer. It will struggle.", scenario: { preset: "spiral", width: 3 } },
      { title: "Bigger brain", hint: "Same spiral, 16 neurons. More capacity, a better border.", scenario: { width: 16 } },
    ],
    outro: "Then click the canvas to add your own points and teach it something new.",
  },
};

function Guide({
  content,
  active,
  onRun,
}: {
  content: GuideContent;
  active: number | null;
  onRun: (i: number) => void;
}) {
  return (
    <details open className="group mb-6 border border-[#1c1c1e]/15 bg-white/30">
      <summary
        className={`${mono} flex cursor-pointer list-none items-center justify-between px-5 py-4 [&::-webkit-details-marker]:hidden`}
      >
        <span>✳ New here? Start with this</span>
        <span className="opacity-50 group-open:hidden">Show</span>
        <span className="hidden opacity-50 group-open:inline">Hide</span>
      </summary>

      <div className="grid gap-8 border-t border-[#1c1c1e]/15 p-5 md:p-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-[clamp(1.1rem,2.1vw,1.5rem)] leading-snug text-[#1c1c1e]">
            {content.story}
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-[#1c1c1e]/65">
            {content.plain}
          </p>
        </div>

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {content.terms.map((t) => (
            <div key={t.term} className="border-t border-[#1c1c1e]/15 pt-2">
              <dt className={mono}>{t.term}</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#1c1c1e]/65">
                {t.def}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-[#1c1c1e]/15 p-5 md:p-6">
        <div className={`${mono} mb-3 opacity-50`}>Try it · tap a mission</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.missions.map((m, i) => (
            <button
              key={m.title}
              type="button"
              onClick={() => onRun(i)}
              aria-pressed={active === i}
              className={`rounded-[2px] border p-4 text-left transition-colors ${
                active === i
                  ? "border-[#1c1c1e] bg-[#1c1c1e] text-[#f4efe6]"
                  : "border-[#1c1c1e]/20 text-[#1c1c1e] hover:border-[#1c1c1e]"
              }`}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] opacity-50">
                0{i + 1}
              </span>
              <span className="mt-1 block text-[15px] font-medium">{m.title}</span>
              <span className="mt-1 block text-[12.5px] leading-snug opacity-70">
                {m.hint}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] text-[#1c1c1e]/55">{content.outro}</p>
      </div>
    </details>
  );
}

const TABS = [
  { id: "gd", label: "01 · Gradient Descent", blurb: "Drop a ball on a loss landscape and watch optimisation succeed or fail." },
  { id: "net", label: "02 · Train a Network", blurb: "Place points and watch a neural network learn the boundary between them." },
] as const;

export default function Playground() {
  const reduce = usePrefersReducedMotion();
  const [tab, setTab] = useState<"gd" | "net">("gd");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const labRef = useRef<HTMLDivElement>(null);

  const current = TABS.find((t) => t.id === tab)!;
  const guide = GUIDES[tab];

  const switchTab = (t: "gd" | "net") => {
    setTab(t);
    setScenario(null);
    setActive(null);
  };

  const runMission = (i: number) => {
    setActive(i);
    setScenario({ ...guide.missions[i].scenario });
    labRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  };

  return (
    <div className="w-full">
      <div role="tablist" aria-label="Playground experiments" className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => switchTab(t.id)}
            className={`${mono} rounded-full border px-5 py-2.5 transition-colors ${
              tab === t.id
                ? "border-[#1c1c1e] bg-[#1c1c1e] !text-[#f4efe6]"
                : "border-[#1c1c1e]/25 hover:border-[#1c1c1e]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-6 max-w-xl text-[14px] text-[#1c1c1e]/65">{current.blurb}</p>

      <Guide key={tab} content={guide} active={active} onRun={runMission} />

      <div ref={labRef} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "gd" ? (
          <GradientDescentLab scenario={scenario} />
        ) : (
          <NetworkLab scenario={scenario} />
        )}
      </div>
    </div>
  );
}