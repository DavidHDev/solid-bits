import { Show, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue } from 'motion';
import './CometDial.css';

const R = 80;
const DEAD = 44;
const K = 12;
const V_FULL = 4;
const V_FLICK = 2;
const TAU_FOLLOW = 0.06;
const TAU_V = 0.05;
const DECEL = 0.99;
const DRAG_PX = 10;
const STALE_MS = 80;

export interface CometDialChangeDetail {
  velocity: number;
  bounce: number;
}

export interface CometDialProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  accent?: string;
  ink?: string;
  size?: number;
  sweep?: number;
  thickness?: number;
  speed?: number;
  tapBounce?: number;
  flickBounce?: number;
  momentum?: number;
  cometReach?: number;
  cometWidth?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number, detail: CometDialChangeDetail) => void;
  className?: string;
}

type Sample = [number, number];

interface Grip {
  id: number;
  at: number | null;
  hist: Sample[];
  side: 'hi' | 'lo' | null;
  moved: boolean;
  x0: number;
  y0: number;
}

interface Loop {
  raf: number;
  last: number;
  v: number;
  rPrev: number | null;
  text: string;
  valueText: string;
}

interface Settings {
  min: number;
  max: number;
  step: number;
  unit: string;
  sweep: number;
  thickness: number;
  speed: number;
  tapBounce: number;
  flickBounce: number;
  momentum: number;
  cometReach: number;
  cometWidth: number;
  disabled: boolean;
  range: number;
  gap: number;
  start: number;
  end: number;
  decimals: number;
  k: number;
  crit: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const a = hist[0];
  const b = hist[hist.length - 1];
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
};
const decimalsOf = (step: number) => {
  const s = String(step);
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
};
const pointAt = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [100 + Math.cos(a) * R, 100 + Math.sin(a) * R];
};
const arcPath = (a0: number, a1: number) => {
  const [x0, y0] = pointAt(a0);
  const [x1, y1] = pointAt(a1);
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}`;
};

export default function CometDial(props: CometDialProps) {
  const settings = createMemo<Settings>(() => {
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const step = props.step ?? 1;
    const sweep = props.sweep ?? 320;
    const speed = props.speed ?? 25;
    const gap = 360 - sweep;
    const start = 90 + gap / 2;
    const k = 200 + (clamp(speed, 0, 100) / 100) * 700;
    return {
      min,
      max,
      step,
      unit: props.unit ?? '%',
      sweep,
      thickness: props.thickness ?? 5,
      speed,
      tapBounce: props.tapBounce ?? 0.2,
      flickBounce: props.flickBounce ?? 0.1,
      momentum: props.momentum ?? 1,
      cometReach: props.cometReach ?? 180,
      cometWidth: props.cometWidth ?? 12,
      disabled: props.disabled ?? false,
      range: Math.max(1e-9, max - min),
      gap,
      start,
      end: start + sweep,
      decimals: decimalsOf(step),
      k,
      crit: 2 * Math.sqrt(k)
    };
  });

  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduce = mq?.matches ?? false;
  let current = untrack(settings);
  const [dragging, setDragging] = createSignal(false);
  let svgEl: SVGSVGElement | undefined;
  let litEl: SVGPathElement | undefined;
  let headEl: SVGCircleElement | undefined;
  let figureEl: HTMLSpanElement | undefined;
  const comet: (SVGPathElement | undefined)[] = [];
  let target = untrack(() => clamp(props.value ?? props.defaultValue ?? 62, current.min, current.max));
  const initial = target;
  let grip: Grip | null = null;
  let unbind: (() => void) | null = null;
  const loop: Loop = { raf: 0, last: 0, v: 0, rPrev: null, text: '', valueText: '' };
  const reading = motionValue(target);

  const snap = (v: number) => {
    const c = current;
    return c.step > 0 ? clamp(Math.round((v - c.min) / c.step) * c.step + c.min, c.min, c.max) : clamp(v, c.min, c.max);
  };

  const commit = (v: number, finished: boolean, detail?: CometDialChangeDetail) => {
    const s = snap(v);
    if (s !== target) {
      target = s;
      props.onChange?.(s);
    }
    if (finished) props.onChangeEnd?.(s, detail ?? { velocity: 0, bounce: current.tapBounce });
  };

  const tick = (now: number) => paint(now);
  const wake = () => {
    const L = loop;
    if (L.raf) return;
    L.last = performance.now();
    L.rPrev = null;
    L.raf = requestAnimationFrame(tick);
  };
  const launch = (to: number, bounce: number, velocity = reading.getVelocity()) => {
    reading.stop();
    if (reduce) {
      reading.jump(to);
      wake();
      return;
    }
    animate(reading, to, {
      type: 'spring',
      stiffness: current.k,
      damping: current.crit * (1 - clamp(bounce, 0, 0.9)),
      mass: 1,
      velocity
    });
    wake();
  };

  const paint = (now: number) => {
    const L = loop;
    const svg = svgEl;
    const c = current;
    if (!svg) {
      L.raf = 0;
      return;
    }
    const dt = clamp((now - L.last) / 1000, 0, 0.05);
    L.last = now;
    const g = grip;
    if (g && g.at != null) {
      if (reduce) reading.jump(g.at);
      else reading.set(reading.get() + (g.at - reading.get()) * (1 - Math.exp(-dt / TAU_FOLLOW)));
    }
    const r = reading.get();
    const vRaw = L.rPrev == null || dt === 0 || reduce ? 0 : (r - L.rPrev) / dt / c.range;
    L.rPrev = r;
    L.v += (vRaw - L.v) * (1 - Math.exp(-dt / TAU_V));
    const v = L.v;
    const s = clamp(Math.abs(v) / V_FULL, 0, 1);
    const dir = Math.sign(v) || 1;
    const f = clamp((r - c.min) / c.range, 0, 1);
    const ang = c.start + f * c.sweep;
    if (litEl) litEl.setAttribute('d', f > 0.0005 ? arcPath(c.start, ang) : '');
    if (headEl) {
      const [cx, cy] = pointAt(ang);
      headEl.setAttribute('cx', cx.toFixed(3));
      headEl.setAttribute('cy', cy.toFixed(3));
    }
    const seg = (c.cometReach * s) / K;
    for (let j = 0; j < K; j++) {
      const el = comet[j];
      if (!el) continue;
      let a0 = dir > 0 ? ang - (j + 1) * seg : ang + j * seg;
      let a1 = dir > 0 ? ang - j * seg : ang + (j + 1) * seg;
      a0 = clamp(a0, c.start, c.end);
      a1 = clamp(a1, c.start, c.end);
      if (seg < 0.01 || a1 - a0 < 0.01) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        continue;
      }
      const w = 1 - j / K;
      el.setAttribute('d', arcPath(a0, a1));
      el.setAttribute('stroke-width', (c.thickness + c.cometWidth * w * s).toFixed(2));
      el.style.opacity = (w * s).toFixed(3);
    }
    const shown = clamp(r, c.min, c.max).toFixed(c.decimals);
    if (shown !== L.text) {
      L.text = shown;
      if (figureEl) figureEl.textContent = shown;
      svg.setAttribute('aria-valuenow', shown);
    }
    const valueText = `${target}${c.unit}`;
    if (valueText !== L.valueText) {
      L.valueText = valueText;
      svg.setAttribute('aria-valuetext', valueText);
    }
    const moving = !!g || reading.isAnimating() || Math.abs(v) > 0.002;
    if (!moving) {
      for (const el of comet) if (el && el.style.opacity !== '0') el.style.opacity = '0';
    }
    L.raf = moving ? requestAnimationFrame(tick) : 0;
  };

  const localPoint = (cx: number, cy: number): [number, number] => {
    const b = (svgEl as SVGSVGElement).getBoundingClientRect();
    return [((cx - b.left) / b.width) * 200 - 100, ((cy - b.top) / b.height) * 200 - 100];
  };
  const angleAt = (cx: number, cy: number) => {
    const c = current;
    const [x, y] = localPoint(cx, cy);
    let rel = ((Math.atan2(y, x) * 180) / Math.PI - c.start + 720) % 360;
    const g = grip;
    if (rel > c.sweep) rel = g && g.side ? (g.side === 'hi' ? c.sweep : 0) : rel < c.sweep + c.gap / 2 ? c.sweep : 0;
    else if (g) g.side = rel > c.sweep / 2 ? 'hi' : 'lo';
    return c.min + (rel / c.sweep) * c.range;
  };

  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    if (!g.moved) {
      if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < DRAG_PX) return;
      g.moved = true;
      reading.stop();
    }
    g.at = angleAt(e.clientX, e.clientY);
    g.hist.push([performance.now(), g.at]);
    if (g.hist.length > 4) g.hist.shift();
    commit(g.at, false);
    wake();
  };
  const up = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    unbind?.();
    unbind = null;
    setDragging(false);
    try {
      svgEl?.releasePointerCapture(e.pointerId);
    } catch {
      void 0;
    }
    if (!g.moved) {
      commit(target, true);
      return;
    }
    const c = current;
    const stale = performance.now() - g.hist[g.hist.length - 1][0] > STALE_MS;
    const v = e.type === 'pointercancel' || stale ? 0 : velocityOf(g.hist);
    const bounce = c.tapBounce + (c.flickBounce - c.tapBounce) * clamp(Math.abs(v) / c.range / V_FLICK, 0, 1);
    const to = snap((g.at ?? target) + (v / 1000) * (DECEL / (1 - DECEL)) * c.momentum);
    commit(to, true, { velocity: v, bounce });
    launch(to, bounce, v);
  };

  const down = (e: PointerEvent) => {
    if (current.disabled || grip || e.button > 0) return;
    const [x, y] = localPoint(e.clientX, e.clientY);
    if (Math.hypot(x, y) < DEAD) return;
    e.preventDefault();
    const svg = svgEl as SVGSVGElement;
    try {
      svg.setPointerCapture(e.pointerId);
    } catch {
      void 0;
    }
    svg.focus({ preventScroll: true });
    grip = { id: e.pointerId, at: null, hist: [], side: null, moved: false, x0: e.clientX, y0: e.clientY };
    const at = angleAt(e.clientX, e.clientY);
    grip.hist.push([performance.now(), at]);
    setDragging(true);
    commit(at, false);
    launch(snap(at), current.tapBounce);
    const onMove = (ev: PointerEvent) => {
      if (ev.isTrusted) move(ev);
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.isTrusted) up(ev);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    unbind = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  };

  const key = (e: KeyboardEvent) => {
    const c = current;
    if (c.disabled) return;
    const t = target;
    const big = e.shiftKey ? 10 : 1;
    let to: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        to = t + c.step * big;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        to = t - c.step * big;
        break;
      case 'PageUp':
        to = t + c.step * 10;
        break;
      case 'PageDown':
        to = t - c.step * 10;
        break;
      case 'Home':
        to = c.min;
        break;
      case 'End':
        to = c.max;
        break;
      default:
        return;
    }
    e.preventDefault();
    to = snap(to);
    reading.stop();
    reading.jump(to);
    commit(to, true);
    wake();
  };

  createEffect(settings, value => {
    current = value;
    loop.text = '';
    loop.valueText = '';
    paint(performance.now());
  });

  createEffect(
    () => props.value,
    value => {
      if (value === undefined || grip) return;
      const s = snap(value);
      if (s === target) return;
      target = s;
      launch(s, current.tapBounce);
    }
  );

  onSettled(() => {
    const onReduce = () => {
      reduce = mq?.matches ?? false;
    };
    mq?.addEventListener('change', onReduce);
    paint(performance.now());
    return () => {
      mq?.removeEventListener('change', onReduce);
      cancelAnimationFrame(loop.raf);
      loop.raf = 0;
      unbind?.();
      unbind = null;
      reading.stop();
      svgEl = undefined;
    };
  });

  const style = (): JSX.CSSProperties => {
    const size = props.size ?? 250;
    return {
      '--cd-accent': props.accent ?? '#f5f5f5',
      '--cd-ink': props.ink ?? '#fdfdfd',
      '--cd-size': `${size}px`,
      '--cd-figure': `${Math.round(size * 0.16)}px`
    };
  };

  return (
    <div
      class={['comet-dial', props.className]}
      data-dragging={dragging() ? '' : undefined}
      data-disabled={settings().disabled ? '' : undefined}
      style={style()}
    >
      <svg
        ref={el => (svgEl = el)}
        class="comet-dial__ring"
        viewBox="0 0 200 200"
        role="slider"
        tabindex={settings().disabled ? -1 : 0}
        aria-label={props.label ?? 'Level'}
        aria-valuemin={settings().min}
        aria-valuemax={settings().max}
        aria-valuenow={initial}
        aria-valuetext={`${initial}${untrack(() => current.unit)}`}
        aria-disabled={settings().disabled ? 'true' : undefined}
        onPointerDown={down}
        onKeyDown={key}
      >
        <path
          class="comet-dial__track"
          d={arcPath(settings().start, settings().end)}
          stroke-width={settings().thickness}
        />
        <path ref={el => (litEl = el)} class="comet-dial__lit" stroke-width={settings().thickness} />
        <g class="comet-dial__comet">
          {Array.from({ length: K }, (_, j) => (
            <path ref={el => (comet[j] = el)} style={{ opacity: 0 }} />
          ))}
        </g>
        <circle ref={el => (headEl = el)} class="comet-dial__head" r={settings().thickness * 1.8} />
      </svg>
      <div class="comet-dial__readout" aria-hidden="true">
        <span class="comet-dial__value">
          <span ref={el => (figureEl = el)} class="comet-dial__figure" />
          <Show when={settings().unit}>
            <span class="comet-dial__unit">{settings().unit}</span>
          </Show>
        </span>
      </div>
    </div>
  );
}
