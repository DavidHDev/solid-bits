import { For, Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { frame, springValue } from 'motion';

import './TearTicket.css';

export type TearTicketOrientation = 'horizontal' | 'vertical';

export interface TearTicketProps {
  children?: JSX.Element;
  stub?: JSX.Element;
  image?: string;
  imageAlt?: string;
  scrim?: boolean;
  imageRadius?: number;
  orientation?: TearTicketOrientation;
  torn?: boolean;
  defaultTorn?: boolean;
  onTear?: () => void;
  width?: number;
  height?: number;
  stubSize?: number;
  radius?: number;
  holes?: number;
  holeSize?: number;
  notch?: number;
  roughness?: number;
  tearAngle?: number;
  stretch?: number;
  resistance?: number;
  rotate?: number;
  tilt?: boolean;
  tiltMax?: number;
  tiltReach?: number;
  parallax?: number;
  perspective?: number;
  background?: string;
  color?: string;
  border?: boolean;
  borderColor?: string;
  borderWidth?: number;
  stubBackground?: string;
  recenter?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Bridge extends Point {
  y0: number;
  y1: number;
  mid: number;
  pts: number[][];
}

interface End extends Point {
  v: number;
}

interface Geometry {
  vertical: boolean;
  cross: number;
  body: string;
  stub: string;
  bridges: Bridge[];
  ends: End[];
  bodyOutline: string;
  stubOutline: string;
}

type Phase = 'idle' | 'held' | 'free' | 'drop' | 'return';

interface Sim {
  raf: number;
  last: number;
  phase: Phase;
  id: number | null;
  sign: number;
  hinge: Point;
  hingeV: number;
  grab: Point;
  start: Point;
  point: Point;
  a0: number;
  theta: number;
  thetaV: number;
  sx: number;
  sy: number;
  vx: number;
  vy: number;
  spin: number;
  pvx: number;
  pvy: number;
  pt: number;
  fade: number;
  age: number;
  bx: number;
  bv: number;
  snapped: boolean[];
  snapAt: number[];
  span: number[];
}

interface Cfg {
  geo: Geometry;
  tearAngle: number;
  stretch: number;
  resistance: number;
  height: number;
  notch: number;
  reduce: boolean;
  onTear?: () => void;
  controlled: boolean;
}

const TILT_SPRING = { stiffness: 220, damping: 24, mass: 0.6 };
const GRAVITY = 2400;
const ART_INSET = 8;
const ART_SPAN = 0.78;
const RETRACT = 0.17;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (deg: number) => (deg * Math.PI) / 180;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const noise = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const f = (n: number) => n.toFixed(2);

const buildGeometry = (
  W: number,
  H: number,
  S: number,
  R: number,
  holes: number,
  hole: number,
  notch: number,
  rough: number,
  vertical: boolean
): Geometry => {
  const main = vertical ? H : W;
  const cross = vertical ? W : H;
  const x = main - S;
  const hr = hole / 2;
  const n = Math.max(1, Math.round(holes));
  const span = cross - 2 * notch;
  const bridge = Math.max(2, (span - n * hole) / (n + 1));
  const random = noise(n * 7919 + Math.round(cross));
  const at = (u: number, v: number): Point => (vertical ? { x: v, y: u } : { x: u, y: v });
  const pt = (u: number, v: number) => (vertical ? `${f(v)},${f(u)}` : `${f(u)},${f(v)}`);
  const arc = (r: number, sweep: number, u: number, v: number) =>
    `A${f(r)},${f(r)} 0 0 ${vertical ? 1 - sweep : sweep} ${pt(u, v)}`;
  const bridges: Bridge[] = [];
  for (let i = 0; i <= n; i += 1) {
    const y0 = notch + i * (bridge + hole);
    const y1 = y0 + bridge;
    const steps = Math.max(2, Math.round(bridge / 2.2));
    const pts: number[][] = [];
    for (let k = 1; k < steps; k += 1) pts.push([x + (random() - 0.5) * 2 * rough, y0 + (bridge * k) / steps]);
    bridges.push({ y0, y1, mid: (y0 + y1) / 2, pts, ...at(x, (y0 + y1) / 2) });
  }
  let body = `M${pt(R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`;
  bridges.forEach((b, i) => {
    b.pts.forEach(p => {
      body += `L${pt(p[0], p[1])}`;
    });
    body += `L${pt(x, b.y1)}`;
    if (i < n) body += arc(hr, 0, x, b.y1 + hole);
  });
  body += `${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}Z`;
  let stub = `M${pt(x + notch, 0)}L${pt(main - R, 0)}${arc(R, 1, main, R)}L${pt(main, cross - R)}${arc(R, 1, main - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`;
  for (let i = n; i >= 0; i -= 1) {
    const b = bridges[i];
    for (let k = b.pts.length - 1; k >= 0; k -= 1) stub += `L${pt(b.pts[k][0], b.pts[k][1])}`;
    stub += `L${pt(x, b.y0)}`;
    if (i > 0) stub += arc(hr, 0, x, b.y0 - hole);
  }
  stub += `${arc(notch, 0, x + notch, 0)}Z`;
  const ends = [
    { ...at(x, notch), v: notch },
    { ...at(x, cross - notch), v: cross - notch }
  ];
  const bodyOutline = `M${pt(x, cross - notch)}${arc(notch, 0, x - notch, cross)}L${pt(R, cross)}${arc(R, 1, 0, cross - R)}L${pt(0, R)}${arc(R, 1, R, 0)}L${pt(x - notch, 0)}${arc(notch, 0, x, notch)}`;
  const stubOutline = `M${pt(x, notch)}${arc(notch, 0, x + notch, 0)}L${pt(main - R, 0)}${arc(R, 1, main, R)}L${pt(main, cross - R)}${arc(R, 1, main - R, cross)}L${pt(x + notch, cross)}${arc(notch, 0, x, cross - notch)}`;
  return { vertical, cross, body, stub, bridges, ends, bodyOutline, stubOutline };
};

function useReducedMotion(): Accessor<boolean> {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [reduce, setReduce] = createSignal(mq?.matches ?? false);
  onSettled(() => {
    if (!mq) return;
    const onChange = () => {
      setReduce(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  });
  return reduce;
}

export default function TearTicket(props: TearTicketProps) {
  const reduce = useReducedMotion();
  const controlled = () => props.torn !== undefined;
  const [inner, setInner] = createSignal(() => props.defaultTorn ?? false);
  const used = createMemo(() => (controlled() ? !!props.torn : inner()));
  const [grabbing, setGrabbing] = createSignal(false);
  const initialUsed = untrack(used);
  const [boxWidth, setBoxWidth] = createSignal(0);
  let rootEl: HTMLDivElement | undefined;
  let stageEl: HTMLDivElement | undefined;
  let planeEl: HTMLDivElement | undefined;
  let imageEl: HTMLImageElement | undefined;
  let contentEl: HTMLDivElement | undefined;
  let bodyEl: HTMLDivElement | undefined;
  let stubEl: HTMLDivElement | undefined;
  const fibres: (SVGPathElement | undefined)[] = [];
  const setInstant = (value: boolean) => {
    rootEl?.toggleAttribute('data-instant', value);
  };

  const width = () => props.width ?? 460;
  const height = () => props.height ?? 250;
  const stubSize = () => props.stubSize ?? 150;
  const orientation = () => props.orientation ?? 'horizontal';
  const vertical = () => orientation() === 'vertical';
  const disabled = () => props.disabled ?? false;
  const border = () => props.border ?? true;
  const background = () => props.background ?? '#27272a';
  const color = () => props.color ?? '#f5f5f5';
  const fit = createMemo(() => Math.min(1, boxWidth() / width()) || 1);

  const geo = createMemo(() =>
    buildGeometry(
      width(),
      height(),
      stubSize(),
      props.radius ?? 16,
      props.holes ?? 12,
      props.holeSize ?? 6,
      props.notch ?? 3,
      props.roughness ?? 0,
      vertical()
    )
  );

  let cfg!: Cfg;
  const config = createMemo<Cfg>(() => ({
    geo: geo(),
    tearAngle: props.tearAngle ?? 30,
    stretch: props.stretch ?? 30,
    resistance: props.resistance ?? 0.45,
    height: height(),
    notch: props.notch ?? 3,
    reduce: reduce(),
    onTear: props.onTear,
    controlled: controlled()
  }));
  cfg = untrack(config);

  const sim: Sim = {
    raf: 0,
    last: 0,
    phase: 'idle',
    id: null,
    sign: 1,
    hinge: { x: 0, y: 0 },
    hingeV: 0,
    grab: { x: 0, y: 0 },
    start: { x: 0, y: 0 },
    point: { x: 0, y: 0 },
    a0: 0,
    theta: 0,
    thetaV: 0,
    sx: 0,
    sy: 0,
    vx: 0,
    vy: 0,
    spin: 0,
    pvx: 0,
    pvy: 0,
    pt: 0,
    fade: 1,
    age: 0,
    bx: 0,
    bv: 0,
    snapped: [],
    snapAt: [],
    span: []
  };

  const tiltX = springValue<number>(0, TILT_SPRING);
  const tiltY = springValue<number>(0, TILT_SPRING);
  let look = { perspective: 1000, rotate: 4, depth: 6 / 9, reduce: false };

  const paintTilt = () => {
    const tx = tiltX.get();
    const ty = tiltY.get();
    if (planeEl)
      planeEl.style.transform = `perspective(${look.perspective}px) rotate(${look.rotate}deg) rotateX(${tx}deg) rotateY(${ty}deg)`;
    if (imageEl) imageEl.style.transform = look.reduce ? '' : `translate(${-ty * look.depth}px, ${tx * look.depth}px)`;
    if (contentEl)
      contentEl.style.transform = look.reduce
        ? ''
        : `translate(${ty * look.depth * 0.22}px, ${-tx * look.depth * 0.22}px)`;
  };
  const scheduleTilt = () => {
    frame.render(paintTilt);
  };

  createEffect(config, value => {
    cfg = value;
  });

  createEffect(
    () => {
      const tiltMax = props.tiltMax ?? 9;
      const parallax = props.parallax ?? 6;
      return {
        perspective: props.perspective ?? 1000,
        rotate: props.rotate ?? 4,
        depth: tiltMax > 0 ? parallax / tiltMax : 0,
        reduce: reduce(),
        image: props.image ?? ''
      };
    },
    value => {
      look = value;
      paintTilt();
    }
  );

  const paint = (now: number): boolean => {
    const s = sim;
    const c = cfg;
    if (stubEl) {
      stubEl.style.transform = `translate(${s.sx.toFixed(2)}px, ${s.sy.toFixed(2)}px) rotate(${((s.theta * s.sign * 180) / Math.PI).toFixed(3)}deg)`;
      stubEl.style.opacity = s.fade.toFixed(3);
    }
    const up = c.geo.vertical;
    if (bodyEl) bodyEl.style.transform = `translate${up ? 'Y' : 'X'}(${s.bx.toFixed(2)}px)`;
    const cos = Math.cos(s.theta * s.sign);
    const sin = Math.sin(s.theta * s.sign);
    const lx = up ? 1.6 : 0;
    const ly = up ? 0 : 1.6;
    let busy = false;
    c.geo.bridges.forEach((b, i) => {
      const dx = b.x - s.hinge.x;
      const dy = b.y - s.hinge.y;
      const tx = s.hinge.x + dx * cos - dy * sin + s.sx;
      const ty = s.hinge.y + dx * sin + dy * cos + s.sy;
      const ox = b.x + (up ? 0 : s.bx);
      const oy = b.y + (up ? s.bx : 0);
      const gx = tx - ox;
      const gy = ty - oy;
      const gap = Math.hypot(gx, gy);
      const near = fibres[i * 2];
      const far = fibres[i * 2 + 1];
      if (!near || !far) return;
      const live = s.phase !== 'idle' && !c.reduce;
      if (!s.snapped[i]) {
        if (!live || gap < 0.35) {
          near.style.opacity = '0';
          far.style.opacity = '0';
          return;
        }
        const k = clamp(gap / c.stretch, 0, 1);
        const sag = gap * 0.18;
        const w = (1.7 - 1.15 * k).toFixed(2);
        const sx = (up ? sag : 0) + gx / 2;
        const sy = (up ? 0 : sag) + gy / 2;
        near.setAttribute(
          'd',
          `M${f(ox - lx)},${f(oy - ly)}Q${f(ox - lx + sx)},${f(oy - ly + sy)} ${f(tx - lx)},${f(ty - ly)}`
        );
        far.setAttribute(
          'd',
          `M${f(ox + lx)},${f(oy + ly)}Q${f(ox + lx + gx - sx)},${f(oy + ly + gy - sy)} ${f(tx + lx)},${f(ty + ly)}`
        );
        near.style.strokeWidth = w;
        far.style.strokeWidth = w;
        near.style.opacity = '1';
        far.style.opacity = '1';
        s.span[i] = gap;
        return;
      }
      const t = (now - s.snapAt[i]) / 1000 / RETRACT;
      if (!live || t >= 1 || !s.snapAt[i]) {
        near.style.opacity = '0';
        far.style.opacity = '0';
        return;
      }
      busy = true;
      const left = (1 - t) * (1 - t);
      const len = (s.span[i] || c.stretch) * 0.5 * left;
      const ux = gap > 0.01 ? gx / gap : 1;
      const uy = gap > 0.01 ? gy / gap : 0;
      near.setAttribute('d', `M${f(ox)},${f(oy)}L${f(ox + ux * len)},${f(oy + uy * len)}`);
      far.setAttribute('d', `M${f(tx)},${f(ty)}L${f(tx - ux * len)},${f(ty - uy * len)}`);
      near.style.strokeWidth = '0.9';
      far.style.strokeWidth = '0.9';
      near.style.opacity = left.toFixed(2);
      far.style.opacity = left.toFixed(2);
    });
    return busy;
  };

  const finish = () => {
    const c = cfg;
    if (stubEl) stubEl.style.visibility = 'hidden';
    if (!c.controlled) setInner(true);
    c.onTear?.();
  };

  const step = (now: number) => {
    const s = sim;
    const c = cfg;
    const dt = clamp((now - s.last) / 1000, 0.001, 0.034);
    s.last = now;
    const limit = rad(c.tearAngle);
    if (s.phase === 'held') {
      const count = c.geo.bridges.length;
      let intact = 0;
      for (let i = 0; i < count; i += 1) if (!s.snapped[i]) intact += 1;
      const hold = count ? intact / count : 0;
      const follow = 0.92 * (1 - clamp(c.resistance, 0, 0.95) * hold);
      const a = Math.atan2(s.point.y - s.hinge.y, s.point.x - s.hinge.x);
      const want = clamp(wrap(a - s.a0) * s.sign * follow, 0, limit + 0.1);
      s.theta += (want - s.theta) * (1 - Math.exp(-dt / 0.035));
      const up = c.geo.vertical;
      const away = clamp(((up ? s.point.y - s.start.y : s.point.x - s.start.x) || 0) * 0.05, -2, 4);
      const side = clamp(((up ? s.point.x - s.start.x : s.point.y - s.start.y) || 0) * 0.05, -3, 3);
      const px = up ? side : away;
      const py = up ? away : side;
      s.sx += (px - s.sx) * (1 - Math.exp(-dt / 0.05));
      s.sy += (py - s.sy) * (1 - Math.exp(-dt / 0.05));
      const slack = Math.hypot(s.sx, s.sy);
      let left = 0;
      c.geo.bridges.forEach((b, i) => {
        if (s.snapped[i]) return;
        const d = Math.abs(b.mid - s.hingeV);
        if (2 * d * Math.sin(s.theta / 2) + slack > c.stretch || s.theta >= limit) {
          s.snapped[i] = true;
          s.snapAt[i] = now;
          s.bv -= 560 / c.geo.bridges.length;
        } else left += 1;
      });
      if (left === 0) {
        s.phase = 'free';
        s.bv -= 150;
      }
    } else if (s.phase === 'free') {
      const cos = Math.cos(s.theta * s.sign);
      const sin = Math.sin(s.theta * s.sign);
      const gx = s.grab.x - s.hinge.x;
      const gy = s.grab.y - s.hinge.y;
      const wx = s.point.x - s.hinge.x - (gx * cos - gy * sin);
      const wy = s.point.y - s.hinge.y - (gx * sin + gy * cos);
      s.sx += (wx - s.sx) * (1 - Math.exp(-dt / 0.045));
      s.sy += (wy - s.sy) * (1 - Math.exp(-dt / 0.045));
      const hang = limit * 0.55 + clamp(s.pvx * 0.0009 * s.sign, -0.3, 0.3);
      s.theta += (hang - s.theta) * (1 - Math.exp(-dt / 0.12));
    } else if (s.phase === 'drop') {
      s.age += dt;
      s.vy += GRAVITY * dt;
      s.sx += s.vx * dt;
      s.sy += s.vy * dt;
      s.theta += s.spin * dt;
      if (s.age > 0.16) s.fade = clamp(1 - (s.age - 0.16) / 0.42, 0, 1);
      if (s.fade <= 0) {
        s.phase = 'idle';
        finish();
      }
    } else if (s.phase === 'return') {
      s.thetaV += (-300 * s.theta - 24 * s.thetaV) * dt;
      s.theta += s.thetaV * dt;
      s.sx += (0 - s.sx) * (1 - Math.exp(-dt / 0.07));
      s.sy += (0 - s.sy) * (1 - Math.exp(-dt / 0.07));
      if (Math.abs(s.theta) < 0.0008 && Math.abs(s.thetaV) < 0.01 && Math.hypot(s.sx, s.sy) < 0.05) {
        s.theta = 0;
        s.thetaV = 0;
        s.sx = 0;
        s.sy = 0;
        s.phase = 'idle';
      }
    }
    s.bv += (-520 * s.bx - 30 * s.bv) * dt;
    s.bx += s.bv * dt;
    const busy = paint(now);
    const moving = Math.abs(s.bx) > 0.02 || Math.abs(s.bv) > 0.5;
    if (s.phase !== 'idle' || moving || busy) s.raf = requestAnimationFrame(step);
    else {
      s.bx = 0;
      s.bv = 0;
      paint(now);
      s.raf = 0;
    }
  };
  const run = () => {
    const s = sim;
    if (s.raf) return;
    s.last = performance.now();
    s.raf = requestAnimationFrame(step);
  };

  const reset = () => {
    const s = sim;
    cancelAnimationFrame(s.raf);
    Object.assign(s, {
      raf: 0,
      phase: 'idle',
      id: null,
      theta: 0,
      thetaV: 0,
      sx: 0,
      sy: 0,
      fade: 1,
      age: 0,
      bx: 0,
      bv: 0
    });
    s.snapped = [];
    s.snapAt = [];
    s.span = [];
    if (stubEl) stubEl.style.visibility = '';
    paint(performance.now());
  };

  createEffect(used, value => {
    if (value) {
      if (sim.phase === 'idle' && stubEl) stubEl.style.visibility = 'hidden';
      return;
    }
    setInstant(false);
    reset();
  });
  createEffect(geo, value => {
    cfg = { ...cfg, geo: value };
    reset();
  });

  onSettled(() => {
    const root = rootEl;
    const offX = tiltX.on('change', scheduleTilt);
    const offY = tiltY.on('change', scheduleTilt);
    paintTilt();
    let ro: ResizeObserver | null = null;
    if (root) {
      setBoxWidth(root.clientWidth);
      ro = new ResizeObserver(() => {
        setBoxWidth(root.clientWidth);
      });
      ro.observe(root);
    }
    return () => {
      cancelAnimationFrame(sim.raf);
      sim.raf = 0;
      ro?.disconnect();
      offX();
      offY();
      tiltX.destroy();
      tiltY.destroy();
    };
  });

  const local = (e: PointerEvent): Point => {
    const r = stageEl!.getBoundingClientRect();
    const k = r.width / width() || 1;
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  };
  const tearNow = () => {
    const s = sim;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.phase = 'idle';
    setInstant(true);
    finish();
  };
  const onStubDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    const s = sim;
    if (disabled() || used() || e.button !== 0 || s.id !== null || s.phase === 'drop') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const g = geo();
    const p = local(e);
    s.id = e.pointerId;
    s.start = p;
    s.point = p;
    s.pt = performance.now();
    s.pvx = 0;
    s.pvy = 0;
    if (s.theta < 0.01) {
      const far = (g.vertical ? p.x : p.y) < g.cross / 2;
      const end = g.ends[far ? 1 : 0];
      s.sign = (far ? 1 : -1) * (g.vertical ? -1 : 1);
      s.hinge = { x: end.x, y: end.y };
      s.hingeV = end.v;
      if (stubEl) stubEl.style.transformOrigin = `${s.hinge.x}px ${s.hinge.y}px`;
    }
    const cos = Math.cos(-s.theta * s.sign);
    const sin = Math.sin(-s.theta * s.sign);
    const ux = p.x - s.sx - s.hinge.x;
    const uy = p.y - s.sy - s.hinge.y;
    s.grab = { x: s.hinge.x + ux * cos - uy * sin, y: s.hinge.y + ux * sin + uy * cos };
    s.a0 = Math.atan2(s.grab.y - s.hinge.y, s.grab.x - s.hinge.x) - (s.theta * s.sign) / 0.92;
    s.phase = 'held';
    s.thetaV = 0;
    tiltX.set(0);
    tiltY.set(0);
    setGrabbing(true);
    run();
  };
  const onStubMove = (e: PointerEvent) => {
    const s = sim;
    if (s.id !== e.pointerId) return;
    const p = local(e);
    const now = performance.now();
    const dt = Math.max(0.004, (now - s.pt) / 1000);
    s.pvx += ((p.x - s.point.x) / dt - s.pvx) * 0.35;
    s.pvy += ((p.y - s.point.y) / dt - s.pvy) * 0.35;
    s.pt = now;
    s.point = p;
    if (cfg.reduce && Math.hypot(p.x - s.start.x, p.y - s.start.y) > 28) {
      s.id = null;
      setGrabbing(false);
      tearNow();
    }
  };
  const onStubUp = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    const s = sim;
    if (s.id !== e.pointerId) return;
    s.id = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setGrabbing(false);
    if (s.phase === 'free') {
      const still = performance.now() - s.pt > 80;
      s.vx = still ? 0 : clamp(s.pvx, -1600, 1600);
      s.vy = still ? 0 : clamp(s.pvy, -1600, 1200);
      s.spin = clamp(s.vx * 0.004, -6, 6) + 1.2 * s.sign;
      s.age = 0;
      s.phase = 'drop';
    } else if (s.phase === 'held') {
      s.phase = 'return';
    }
    run();
  };
  const onStubKey = (e: KeyboardEvent) => {
    if (disabled() || used() || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (!e.repeat) tearNow();
  };

  createEffect(
    () => ({
      tilt: props.tilt ?? true,
      reduce: reduce(),
      disabled: disabled(),
      tiltMax: props.tiltMax ?? 9,
      tiltReach: props.tiltReach ?? 260
    }),
    value => {
      if (!value.tilt || value.reduce || value.disabled) return;
      const move = (e: PointerEvent) => {
        const el = rootEl;
        if (!el || e.pointerType === 'touch' || sim.id !== null) return;
        const r = el.getBoundingClientRect();
        const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2 + value.tiltReach), -1, 1);
        const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2 + value.tiltReach), -1, 1);
        tiltY.set(nx * value.tiltMax);
        tiltX.set(-ny * value.tiltMax);
      };
      window.addEventListener('pointermove', move);
      return () => window.removeEventListener('pointermove', move);
    }
  );

  return (
    <div
      ref={el => {
        rootEl = el;
        if (initialUsed) el.setAttribute('data-instant', '');
      }}
      class={['tear-ticket', props.className]}
      data-used={used() ? '' : undefined}
      data-orientation={orientation()}
      data-shift={used() && (props.recenter ?? true) ? (vertical() ? 'y' : 'x') : undefined}
      data-grabbing={grabbing() ? '' : undefined}
      data-disabled={disabled() ? '' : undefined}
      style={{
        '--tt-w': `${width()}px`,
        '--tt-h': `${height()}px`,
        '--tt-stub': `${stubSize()}px`,
        '--tt-bg': background(),
        '--tt-stub-bg': props.stubBackground || background(),
        '--tt-ink': color(),
        '--tt-edge': props.borderColor || `color-mix(in srgb, ${color()} 16%, transparent)`,
        '--tt-edge-w': String(props.borderWidth ?? 1),
        '--tt-parallax': `${props.parallax ?? 6}px`,
        '--tt-body-w': `${vertical() ? width() : width() - stubSize()}px`,
        '--tt-body-h': `${vertical() ? height() - stubSize() : height()}px`,
        '--tt-inset': `${ART_INSET}px`,
        '--tt-span': String(ART_SPAN),
        '--tt-art-radius': `${props.imageRadius ?? 8}px`,
        '--tt-fit': String(fit()),
        height: `${height() * fit()}px`
      }}
    >
      <div ref={el => (stageEl = el)} class="tear-ticket__stage">
        <div ref={el => (planeEl = el)} class="tear-ticket__plane">
          <div ref={el => (bodyEl = el)} class="tear-ticket__piece">
            <Show when={border()}>
              <svg class="tear-ticket__edge" viewBox={`0 0 ${width()} ${height()}`} aria-hidden="true">
                <path d={geo().bodyOutline} />
              </svg>
            </Show>
            <div class="tear-ticket__paper" style={{ 'clip-path': `path('${geo().body}')` }}>
              <Show when={props.image}>
                <div class="tear-ticket__art">
                  <img
                    ref={el => (imageEl = el)}
                    class="tear-ticket__image"
                    src={props.image}
                    alt={props.imageAlt ?? ''}
                    draggable="false"
                  />
                  <Show when={props.scrim ?? true}>
                    <div class="tear-ticket__scrim" />
                  </Show>
                </div>
              </Show>
              <div ref={el => (contentEl = el)} class="tear-ticket__content">
                {props.children}
              </div>
            </div>
          </div>
          <svg class="tear-ticket__fibres" aria-hidden="true">
            <For each={geo().bridges} keyed={false}>
              {(_bridge, i) => (
                <g>
                  <path ref={el => (fibres[i * 2] = el)} />
                  <path ref={el => (fibres[i * 2 + 1] = el)} />
                </g>
              )}
            </For>
          </svg>
          <div
            ref={el => (stubEl = el)}
            class="tear-ticket__piece tear-ticket__piece--stub"
            role="button"
            tabindex={disabled() || used() ? -1 : 0}
            aria-label={props.ariaLabel ?? 'Tear off the stub'}
            aria-hidden={used() ? 'true' : undefined}
            aria-disabled={disabled() ? 'true' : undefined}
            onPointerDown={onStubDown}
            onPointerMove={onStubMove}
            onPointerUp={onStubUp}
            onPointerCancel={onStubUp}
            onLostPointerCapture={onStubUp}
            onKeyDown={onStubKey}
            onDragStart={e => e.preventDefault()}
          >
            <Show when={border()}>
              <svg class="tear-ticket__edge" viewBox={`0 0 ${width()} ${height()}`} aria-hidden="true">
                <path d={geo().stubOutline} />
              </svg>
            </Show>
            <div class="tear-ticket__paper tear-ticket__paper--stub" style={{ 'clip-path': `path('${geo().stub}')` }}>
              <div class="tear-ticket__stub">{props.stub}</div>
            </div>
          </div>
        </div>
      </div>
      <span class="tear-ticket__sr" role="status">
        {used() ? 'Used' : ''}
      </span>
    </div>
  );
}
