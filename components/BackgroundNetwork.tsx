"use client";

import { useEffect, useRef } from "react";

type Node = {
  bx: number; by: number; // base position (page space)
  ax: number; ay: number; // drift amplitude
  fx: number; fy: number; // drift frequency
  ph: number;
  x: number; y: number;   // current position
  pulse: number;
};
type Edge = { a: number; b: number; alpha: number };
type Signal = { from: number; to: number; t: number; speed: number; hops: number };

const LINK_DIST = 170;
const MAX_HOPS = 7;
const PARALLAX = 0.9; // 1 = glued to content, lower = more depth
const CULL = 80;
const DENSITY = 22000; // px² per node, lower = denser
const POINTER_R = 170;

export default function BackgroundNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = mq.matches;

    let vw = 0;
    let vh = 0;
    let dpr = 1;
    let worldW = 0;
    let worldH = 0;
    let raf = 0;
    let staticQueued = false;
    let last = performance.now();
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let adj: number[][] = [];
    let signals: Signal[] = [];
    let debounce = 0;
        // ink colour follows the theme (--ink as "r g b"), with a safe default
    let ink = "28,28,30";
    const readInk = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim();
      ink = v ? v.split(/[\s,]+/).join(",") : "28,28,30";
    };
    readInk();
    const themeObs = new MutationObserver(() => {
      readInk();
      if (reduce) drawStatic();
    });
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // cursor
    const fine = window.matchMedia("(pointer: fine)").matches;
    const ptr = { x: -9999, y: -9999, active: false, lastSpawn: 0 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.active = true;
    };
    const onLeave = () => {
      ptr.active = false;
    };

    const docHeight = () =>
      Math.max(document.documentElement.scrollHeight, window.innerHeight);

    const sizeCanvas = () => {
      // only reallocate when needed (avoids flicker as mobile URL bars collapse)
      if (window.innerWidth === vw && window.innerHeight <= vh) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      canvas.style.width = `${vw}px`;
      canvas.style.height = `${vh}px`;
    };

    const addNodes = (y0: number, y1: number) => {
      const count = Math.min(
        1100,
        Math.floor((worldW * (y1 - y0)) / DENSITY)
      );
      for (let i = 0; i < count; i++) {
        const bx = Math.random() * worldW;
        const by = y0 + Math.random() * (y1 - y0);
        nodes.push({
          bx, by,
          ax: 3 + Math.random() * 7,
          ay: 3 + Math.random() * 7,
          fx: 0.0003 + Math.random() * 0.0004,
          fy: 0.0003 + Math.random() * 0.0004,
          ph: Math.random() * Math.PI * 2,
          x: bx, y: by,
          pulse: 0,
        });
      }
    };

    const relink = () => {
      edges = [];
      adj = nodes.map(() => []);
      const cell = LINK_DIST;
      const cols = Math.ceil(worldW / cell) + 1;
      const grid = new Map<number, number[]>();
      nodes.forEach((n, i) => {
        const k = Math.floor(n.by / cell) * cols + Math.floor(n.bx / cell);
        let arr = grid.get(k);
        if (!arr) {
          arr = [];
          grid.set(k, arr);
        }
        arr.push(i);
      });
      nodes.forEach((n, i) => {
        const cx = Math.floor(n.bx / cell);
        const cy = Math.floor(n.by / cell);
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          for (let gx = cx - 1; gx <= cx + 1; gx++) {
            const arr = grid.get(gy * cols + gx);
            if (!arr) continue;
            for (const j of arr) {
              if (j <= i) continue;
              const d = Math.hypot(n.bx - nodes[j].bx, n.by - nodes[j].by);
              if (d < LINK_DIST) {
                edges.push({ a: i, b: j, alpha: (1 - d / LINK_DIST) * 0.13 });
                adj[i].push(j);
                adj[j].push(i);
              }
            }
          }
        }
      });
    };

    const ensureWorld = () => {
      const w = window.innerWidth;
      const h = docHeight();
      if (w !== worldW) {
        worldW = w;
        worldH = h;
        nodes = [];
        signals = [];
        addNodes(0, worldH);
        relink();
      } else if (h > worldH + 150) {
        addNodes(worldH, h); // page grew: extend the network, keep existing nodes
        worldH = h;
        relink();
      }
    };

    const spawnSignal = (sy: number) => {
      for (let tries = 0; tries < 10; tries++) {
        const i = Math.floor(Math.random() * nodes.length);
        const n = nodes[i];
        if (n && adj[i].length && n.y > sy && n.y < sy + vh) {
          const to = adj[i][Math.floor(Math.random() * adj[i].length)];
          signals.push({ from: i, to, t: 0, speed: 0.35 + Math.random() * 0.35, hops: 0 });
          return;
        }
      }
    };

    const draw = (now: number, dt: number, animate: boolean) => {
      const sy = window.scrollY * PARALLAX;
      const top = sy - CULL;
      const bot = sy + vh + CULL;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, -sy * dpr);

      for (const n of nodes) {
        if (animate) {
          n.x = n.bx + Math.sin(now * n.fx + n.ph) * n.ax;
          n.y = n.by + Math.cos(now * n.fy + n.ph) * n.ay;
          n.pulse = Math.max(0, n.pulse - dt * 0.0015);
        }
      }
            // cursor interaction (fine pointers only, never in reduced-motion mode)
      if (animate && fine && ptr.active) {
        const wx = ptr.x;
        const wy = ptr.y + sy;
        let nearest = -1;
        let nearestD = POINTER_R;
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.y < top || n.y > bot) continue;
          const dx = wx - n.x;
          const dy = wy - n.y;
          const d = Math.hypot(dx, dy);
          if (d >= POINTER_R) continue;
          const k = 1 - d / POINTER_R;
          n.x += dx * k * k * 0.1;
          n.y += dy * k * k * 0.1;
          n.pulse = Math.max(n.pulse, k * 0.85);
          ctx.strokeStyle = `rgba(110,170,225,${k * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
          if (d < nearestD) {
            nearestD = d;
            nearest = i;
          }
        }
        if (
          nearest >= 0 &&
          adj[nearest].length &&
          now - ptr.lastSpawn > 450 &&
          signals.length < 24
        ) {
          ptr.lastSpawn = now;
          signals.push({
            from: nearest,
            to: adj[nearest][Math.floor(Math.random() * adj[nearest].length)],
            t: 0,
            speed: 0.9,
            hops: 0,
          });
        }
      }

      // connections
      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if ((a.y < top && b.y < top) || (a.y > bot && b.y > bot)) continue;
        ctx.strokeStyle = `rgba(${ink},${e.alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        if (n.y < top || n.y > bot) continue;
        ctx.fillStyle = `rgba(${ink},${0.22 + n.pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6 + n.pulse * 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (n.pulse > 0.05) {
          ctx.fillStyle = `rgba(110,170,225,${n.pulse * 0.25})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 6 + n.pulse * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!animate) return;

      // signals
      const maxSignals = Math.max(4, Math.round((vw * vh) / 90000));
      if (signals.length < maxSignals && Math.random() < 0.05) spawnSignal(sy);

      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        const a = nodes[sig.from];
        const b = nodes[sig.to];

        if (a.y < sy - vh * 0.5 || a.y > sy + vh * 1.5) {
          signals.splice(s, 1);
          continue;
        }

        sig.t += (dt / 1000) * sig.speed;

        if (sig.t >= 1) {
          b.pulse = 1;
          const next = adj[sig.to].filter((k) => k !== sig.from);
          if (sig.hops < MAX_HOPS && next.length) {
            sig.from = sig.to;
            sig.to = next[Math.floor(Math.random() * next.length)];
            sig.t = 0;
            sig.hops++;
          } else {
            signals.splice(s, 1);
          }
          continue;
        }

        const x = a.x + (b.x - a.x) * sig.t;
        const y = a.y + (b.y - a.y) * sig.t;
        const tt = Math.max(0, sig.t - 0.18);
        const tx = a.x + (b.x - a.x) * tt;
        const ty = a.y + (b.y - a.y) * tt;

        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, "rgba(110,170,225,0)");
        grad.addColorStop(1, "rgba(110,170,225,0.75)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = "rgba(110,170,225,0.18)";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(190,160,110,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      draw(now, dt, true);
      raf = requestAnimationFrame(loop);
    };

    const drawStatic = () => {
      if (staticQueued) return;
      staticQueued = true;
      requestAnimationFrame(() => {
        staticQueued = false;
        draw(0, 0, false);
      });
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduce) {
        drawStatic();
      } else if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const onResize = () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        sizeCanvas();
        ensureWorld();
        if (reduce) drawStatic();
      }, 150);
    };

    const onMotionChange = () => {
      reduce = mq.matches;
      start();
    };

    sizeCanvas();
    ensureWorld();
    start();

    const ro = new ResizeObserver(onResize); // catches page-height changes
    ro.observe(document.body);

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", drawStatic, { passive: true }); // only matters when reduced motion
    document.addEventListener("visibilitychange", start);
    mq.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(debounce);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("mouseleave", onLeave);
      themeObs.disconnect();
      window.removeEventListener("scroll", drawStatic);
      document.removeEventListener("visibilitychange", start);
      mq.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}