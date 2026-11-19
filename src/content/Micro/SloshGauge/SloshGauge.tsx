import { createEffect, createMemo, createSignal, onSettled, Show, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './SloshGauge.css';

export interface SloshGaugeProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  interactive?: boolean;
  showValue?: boolean;
  disabled?: boolean;
  liquidColor?: string;
  glassColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  ticks?: number;
  viscosity?: number;
  tilt?: number;
  splash?: number;
  unit?: string;
  ariaLabel?: string;
  className?: string;
}

interface Sim {
  x: number;
  v: number;
  L: number;
  raf: number;
  last: number;
}

interface Grip {
  id: number;
  rect: DOMRect;
  scale: number;
  band: boolean;
  grab: number | null;
  at: number;
  sent: number;
}

interface Live {
  viscosity: number;
  tilt: number;
  splash: number;
  width: number;
  height: number;
  value: number | undefined;
  onChange: ((value: number) => void) | undefined;
  unit: string;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const H = 1 / 120;
const DT_MAX = 0.05;
const TILT_GAIN = 0.07;
const TILT_MAX = 30;
const REST_POS = 0.05;
const REST_VEL = 2;
const STEP = 2;
const BIG = 10;
const BAND = 10;

const onColor = (hex: string) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(c => c + c).join('') : raw;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
};

export default function SloshGauge(props: SloshGaugeProps) {
  let root: HTMLDivElement | undefined;
  let liquid: HTMLDivElement | undefined;
  let marker: HTMLDivElement | undefined;
  let textA: HTMLSpanElement | undefined;
  let textB: HTMLSpanElement | undefined;
  const start = untrack(() => clamp(props.value ?? props.defaultValue ?? 60, 0, 100));
  const sim: Sim = { x: start, v: 0, L: start, raf: 0, last: 0 };
  let grip: Grip | null = null;
  let reduce = false;
  let disposed = false;
  const [held, setHeld] = createSignal(false);

  const settings = createMemo<Live>(() => ({
    viscosity: props.viscosity ?? 0.15,
    tilt: props.tilt ?? 0.45,
    splash: props.splash ?? 0.42,
    width: props.width ?? 88,
    height: props.height ?? 180,
    value: props.value,
    onChange: props.onChange,
    unit: props.unit ?? '%'
  }));
  let live: Live = untrack(settings);

  const interactive = () => props.interactive ?? false;
  const disabled = () => props.disabled ?? false;
  const showValue = () => props.showValue ?? true;
  const width = () => props.width ?? 88;
  const height = () => props.height ?? 180;
  const radius = () => props.radius ?? 20;
  const ticks = () => props.ticks ?? 4;
  const liquidColor = () => props.liquidColor ?? '#f5f5f5';
  const r = () => Math.min(radius(), width() / 2, height() / 2);
  const label = untrack(() => `${Math.round(start)}${props.unit ?? '%'}`);

  const paint = () => {
    const { x, v, L } = sim;
    const { tilt: t, width: W, height: Hh } = live;
    const th = reduce ? 0 : clamp(t * v * TILT_GAIN, -TILT_MAX, TILT_MAX);
    const lean = (Math.tan((th * Math.PI) / 180) * W) / 2;
    const top = 100 - x;
    if (liquid) {
      liquid.style.clipPath = `polygon(0 calc(${top}% + ${lean}px), 100% calc(${top}% - ${lean}px), 100% 100%, 0 100%)`;
    }
    if (marker) marker.style.transform = `translateY(${((100 - L) * Hh) / 100}px)`;
  };

  const say = () => {
    const n = Math.round(sim.L);
    const s = `${n}${live.unit}`;
    root?.setAttribute('aria-valuenow', String(n));
    if (textA) textA.textContent = s;
    if (textB) textB.textContent = s;
  };

  const tick = (now: number) => {
    const s = sim;
    const { viscosity: vis, splash: give } = live;
    const dt = s.last ? Math.min((now - s.last) / 1000, DT_MAX) : H;
    s.last = now;
    if (vis <= 0) {
      s.x = s.L;
      s.v = 0;
    } else {
      const k = 1224 - 1044 * vis;
      const zeta = reduce ? 1 : 0.26 - 0.17 * vis;
      const c = 2 * zeta * Math.sqrt(k);
      const rest = reduce ? 0 : give;
      for (let n = Math.ceil(dt / H), h = dt / n; n > 0; n -= 1) {
        s.v = s.v * Math.exp(-c * h) + k * (s.L - s.x) * h;
        s.x += s.v * h;
        if (s.x > 100) {
          s.x = 100;
          s.v = -s.v * rest;
        } else if (s.x < 0) {
          s.x = 0;
          s.v = -s.v * rest;
        }
      }
      if (!grip && Math.abs(s.L - s.x) < REST_POS && Math.abs(s.v) < REST_VEL) {
        s.x = s.L;
        s.v = 0;
      }
    }
    paint();
    const parked = !grip && s.x === s.L && s.v === 0;
    if (parked) {
      s.raf = 0;
      s.last = 0;
    } else {
      s.raf = requestAnimationFrame(tick);
    }
  };
  const wake = () => {
    if (disposed) return;
    if (!sim.raf) sim.raf = requestAnimationFrame(tick);
  };
  const setLevel = (L: number, instant?: boolean) => {
    const s = sim;
    s.L = clamp(L, 0, 100);
    if (instant) {
      s.x = s.L;
      s.v = 0;
    }
    say();
    wake();
  };

  createEffect(settings, value => {
    live = value;
  });

  createEffect(
    () => props.value,
    value => {
      if (value === undefined) return;
      if (grip && Math.round(sim.L) === value) return;
      setLevel(value, false);
    }
  );

  createEffect(
    () => [width(), height(), props.tilt, showValue(), interactive(), disabled(), props.unit],
    () => {
      say();
      paint();
    }
  );

  onSettled(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduce = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    say();
    paint();
    return () => {
      disposed = true;
      mq.removeEventListener('change', sync);
      cancelAnimationFrame(sim.raf);
      sim.raf = 0;
    };
  });

  const levelAt = (clientY: number, g: Grip) =>
    clamp(((g.rect.bottom - clientY) / g.scale / (root?.offsetHeight || g.rect.height)) * 100, 0, 100);
  const report = () => {
    const g = grip;
    const n = Math.round(sim.L);
    if (g && n !== g.sent) {
      g.sent = n;
      live.onChange?.(n);
    }
  };

  const down = (e: PointerEvent) => {
    if (!interactive() || disabled() || grip || e.button !== 0) return;
    const el = root;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = rect.height / (el.offsetHeight || rect.height) || 1;
    const markerY = rect.top + ((100 - sim.L) / 100) * rect.height;
    const g: Grip = {
      id: e.pointerId,
      rect,
      scale,
      band: Math.abs(e.clientY - markerY) <= BAND * scale,
      grab: null,
      at: sim.L,
      sent: NaN
    };
    grip = g;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    setHeld(true);
    if (g.band) {
      wake();
    } else {
      setLevel(levelAt(e.clientY, g));
      report();
    }
  };
  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const at = levelAt(e.clientY, g);
    if (g.band && g.grab === null) {
      g.grab = sim.L - at;
      return;
    }
    setLevel(at + (g.grab ?? 0));
    report();
  };
  const up = (e: { pointerId: number }, reason?: 'cancel' | 'escape') => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try {
      root?.releasePointerCapture(e.pointerId);
    } catch {}
    setHeld(false);
    if (reason === 'escape') {
      setLevel(g.at);
      live.onChange?.(Math.round(g.at));
    } else if (live.value !== undefined && Math.round(sim.L) !== live.value) {
      setLevel(live.value);
    }
    wake();
  };
  const key = (e: KeyboardEvent) => {
    if (!interactive() || disabled()) return;
    if (e.key === 'Escape') {
      if (grip) up({ pointerId: grip.id }, 'escape');
      return;
    }
    const L = sim.L;
    const d = e.shiftKey ? BIG : STEP;
    const next: number | undefined = (
      {
        ArrowUp: L + d,
        ArrowRight: L + d,
        ArrowDown: L - d,
        ArrowLeft: L - d,
        PageUp: L + BIG,
        PageDown: L - BIG,
        Home: 0,
        End: 100
      } as Record<string, number>
    )[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setLevel(next, true);
    live.onChange?.(Math.round(sim.L));
  };

  const style = (): JSX.CSSProperties => ({
    '--sg-w': `${width()}px`,
    '--sg-h': `${height()}px`,
    '--sg-r': `${r()}px`,
    '--sg-glass': props.glassColor ?? '#27272a',
    '--sg-liquid': liquidColor(),
    '--sg-on-liquid': onColor(liquidColor()),
    '--sg-ticks': ticks(),
    '--sg-font': `${clamp(Math.round(width() * 0.16), 12, 20)}px`
  });

  return (
    <div
      ref={el => (root = el)}
      class={['slosh-gauge', props.className]}
      role={interactive() ? 'slider' : 'meter'}
      tabindex={interactive() && !disabled() ? 0 : undefined}
      aria-label={props.ariaLabel ?? 'Level'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(start)}
      aria-orientation={interactive() ? 'vertical' : undefined}
      aria-disabled={disabled() ? 'true' : undefined}
      data-interactive={interactive() ? 'true' : 'false'}
      data-held={held() ? 'true' : 'false'}
      data-disabled={disabled() ? 'true' : 'false'}
      style={style()}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={e => up(e)}
      onPointerCancel={e => up(e, 'cancel')}
      onLostPointerCapture={e => up(e, 'cancel')}
      onKeyDown={key}
    >
      <Show when={showValue()}>
        <span ref={el => (textA = el)} class="slosh-gauge__value" aria-hidden="true">
          {label}
        </span>
      </Show>
      <div ref={el => (liquid = el)} class="slosh-gauge__liquid" aria-hidden="true">
        <Show when={showValue()}>
          <span ref={el => (textB = el)} class="slosh-gauge__value">
            {label}
          </span>
        </Show>
      </div>
      <Show when={ticks() > 0}>
        <div class="slosh-gauge__ticks" aria-hidden="true" />
      </Show>
      <Show when={interactive() && !disabled()}>
        <div ref={el => (marker = el)} class="slosh-gauge__marker" aria-hidden="true" />
      </Show>
    </div>
  );
}
