import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { VolumeHighIcon, VolumeLowIcon } from '@hugeicons/core-free-icons';
import './ElasticSlider.css';

export interface ElasticSliderProps {
  value?: number;
  defaultValue?: number;
  startingValue?: number;
  maxValue?: number;
  isStepped?: boolean;
  stepSize?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  orientation?: 'horizontal' | 'vertical';
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  iconPlacement?: 'outside' | 'inside';
  valuePosition?: 'top' | 'bubble' | 'inside' | 'none';
  formatValue?: (value: number) => string;
  ticks?: boolean | number[];
  thumb?: boolean;
  fillFrom?: number;
  thickness?: number;
  activeThickness?: number;
  radius?: number;
  restOpacity?: number;
  growOnHover?: boolean;
  maxStretch?: number;
  bounce?: number;
  jumpToClick?: boolean;
  wheel?: boolean;
  trackColor?: string;
  rangeColor?: string;
  iconColor?: string;
  contentColor?: string;
  fillContentColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Motion {
  p: number;
  vp: number;
  target: number;
  s: number;
  vs: number;
  side: number;
  held: boolean;
  a: number;
  va: number;
  goal: number;
  length: number;
  dragging: boolean;
  hovered: boolean;
  focused: boolean;
  raf: number;
  last: number;
  ready: boolean;
}

interface Drag {
  id: number;
  origin: number;
  from: number | null;
}

interface Settings {
  lo: number;
  hi: number;
  span: number;
  step: number;
  vertical: boolean;
  origin: number;
  thickness: number;
  activeThickness: number;
  radius: number | undefined;
  restOpacity: number;
  growOnHover: boolean;
  maxStretch: number;
  bounce: number;
  jumpToClick: boolean;
  controlled: boolean;
  disabled: boolean;
  thumb: boolean;
  place: string;
  inside: boolean;
  rangeColor: string;
  fillContentColor: string;
  onChange: ((value: number) => void) | undefined;
  onChangeEnd: ((value: number) => void) | undefined;
}

type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const ROOT = 'elastic-slider';
const VALUE = 'elastic-slider__value';
const BODY = 'elastic-slider__body';
const ICON = 'elastic-slider__icon';
const ICON_INNER = 'elastic-slider__icon-inner';
const HIT = 'elastic-slider__hit';
const TRACK = 'elastic-slider__track';
const RANGE = 'elastic-slider__range';
const CONTENT = 'elastic-slider__content';
const FILL_CONTENT = 'elastic-slider__content elastic-slider__content--fill';
const TICK = 'elastic-slider__tick';
const FILL_TICK = 'elastic-slider__tick elastic-slider__tick--fill';
const THUMB = 'elastic-slider__thumb';
const BUBBLE = 'elastic-slider__bubble';
const BUBBLE_TEXT = 'elastic-slider__bubble-text';

const TAU = Math.PI * 2;
const VALUE_POSITIONS = ['top', 'bubble', 'inside', 'none'];
const DARK_INK = 'rgba(16, 17, 19, 0.86)';
const LIGHT_INK = 'rgba(255, 255, 255, 0.94)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const decimalsOf = (step: number) => {
  const text = String(step);
  return text.includes('.') ? text.split('.')[1].length : 0;
};

const rubber = (distance: number, limit: number) =>
  limit > 0 ? 2 * (1 / (1 + Math.exp(-distance / limit)) - 0.5) * limit : 0;

const prefersReduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

let probe: CanvasRenderingContext2D | null = null;

const readColor = (text: string): number[] | null => {
  const match = /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(text);
  if (match)
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
  if (typeof document === 'undefined') return null;
  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000000';
  probe.fillStyle = text;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
};

const iconMarkup = (icon: IconData, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = String(name === 'stroke-width' ? strokeWidth : value);
          return `${name}="${next.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const Icon = (props: { icon: IconData; size: number; strokeWidth: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size}
    height={props.size}
    viewBox="0 0 24 24"
    fill="none"
    color="currentColor"
    innerHTML={iconMarkup(props.icon, props.strokeWidth)}
  />
);

export default function ElasticSlider(props: ElasticSliderProps) {
  let rootEl: HTMLDivElement | undefined;
  let hitEl: HTMLDivElement | undefined;
  let bodyEl: HTMLDivElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  let rangeEl: HTMLDivElement | undefined;
  let thumbEl: HTMLSpanElement | undefined;
  let bubbleEl: HTMLSpanElement | undefined;
  let startIconEl: HTMLSpanElement | undefined;
  let endIconEl: HTMLSpanElement | undefined;
  const motion: Motion = {
    p: 0,
    vp: 0,
    target: 0,
    s: 0,
    vs: 0,
    side: 1,
    held: false,
    a: 0,
    va: 0,
    goal: 0,
    length: 0,
    dragging: false,
    hovered: false,
    focused: false,
    raf: 0,
    last: 0,
    ready: false
  };
  let drag: Drag | null = null;
  let mounted = false;
  let measure: (() => void) | null = null;

  const [inner, setInner] = createSignal(() => props.defaultValue ?? 50);

  const settings = createMemo<Settings>(() => {
    const startingValue = props.startingValue ?? 0;
    const maxValue = props.maxValue ?? 100;
    const stepSize = props.stepSize ?? 1;
    const lo = Math.min(startingValue, maxValue);
    const hi = Math.max(startingValue, maxValue);
    const span = hi - lo || 1;
    const place = props.valuePosition ?? 'top';
    return {
      lo,
      hi,
      span,
      step: (props.isStepped ?? false) && stepSize > 0 ? stepSize : 0,
      vertical: (props.orientation ?? 'horizontal') === 'vertical',
      origin: clamp(((props.fillFrom ?? lo) - lo) / span, 0, 1),
      thickness: Math.max(1, props.thickness ?? 6),
      activeThickness: Math.max(1, props.activeThickness ?? 12),
      radius: props.radius,
      restOpacity: clamp(props.restOpacity ?? 0.7, 0, 1),
      growOnHover: props.growOnHover ?? true,
      maxStretch: Math.max(0, props.maxStretch ?? 50),
      bounce: clamp(props.bounce ?? 0.5, 0, 0.95),
      jumpToClick: props.jumpToClick ?? true,
      controlled: props.value !== undefined,
      disabled: props.disabled ?? false,
      thumb: props.thumb ?? false,
      place: VALUE_POSITIONS.includes(place) ? place : 'top',
      inside: (props.iconPlacement ?? 'outside') === 'inside',
      rangeColor: props.rangeColor ?? 'currentColor',
      fillContentColor: props.fillContentColor ?? 'auto',
      onChange: props.onChange,
      onChangeEnd: props.onChangeEnd
    };
  });

  const current = createMemo(() => {
    const s = settings();
    return clamp(s.controlled ? (props.value as number) : inner(), s.lo, s.hi);
  });

  let cur!: Settings;
  let currentVal = 0;

  const snap = (raw: number) => {
    const s = cur;
    let next = clamp(raw, s.lo, s.hi);
    if (s.step) next = clamp(s.lo + Math.round((next - s.lo) / s.step) * s.step, s.lo, s.hi);
    return Number(next.toFixed(10));
  };

  const paint = () => {
    const m = motion;
    const s = cur;
    const track = trackEl;
    const range = rangeEl;
    if (!track || !range) return;
    const thick = s.thickness + (s.activeThickness - s.thickness) * m.a;
    track.style.width = s.vertical ? `${thick.toFixed(2)}px` : '';
    track.style.height = s.vertical ? '' : `${thick.toFixed(2)}px`;
    track.style.setProperty('--elastic-slider-reveal', clamp((thick - 14) / 10, 0, 1).toFixed(3));
    const length = Math.max(1, m.length);
    const along = 1 + m.s / length;
    const across = 1 - 0.22 * clamp(m.s / Math.max(1, s.maxStretch), -1, 1);
    const atEnd = m.side > 0;
    track.style.transformOrigin = s.vertical ? (atEnd ? '50% 100%' : '50% 0%') : atEnd ? '0% 50%' : '100% 50%';
    const scaleX = s.vertical ? across : along;
    const scaleY = s.vertical ? along : across;
    track.style.transform = `scale(${scaleX.toFixed(4)}, ${scaleY.toFixed(4)})`;
    track.style.setProperty(
      '--elastic-slider-unscale',
      `scale(${(1 / scaleX).toFixed(4)}, ${(1 / scaleY).toFixed(4)})`
    );
    const p = clamp(m.p, 0, 1);
    const from = (Math.min(s.origin, p) * 100).toFixed(3);
    const to = ((1 - Math.max(s.origin, p)) * 100).toFixed(3);
    const round = (s.radius ?? thick / 2).toFixed(2);
    range.style.clipPath = s.vertical
      ? `inset(${to}% 0 ${from}% 0 round ${round}px)`
      : `inset(0 ${to}% 0 ${from}% round ${round}px)`;
    const position = atEnd ? p * length * along : length - (1 - p) * length * along;
    const shift = s.vertical
      ? `translate3d(0, ${(-position).toFixed(2)}px, 0)`
      : `translate3d(${position.toFixed(2)}px, 0, 0)`;
    if (thumbEl) thumbEl.style.transform = `${shift} scale(${(1 + 0.12 * m.a).toFixed(3)})`;
    if (bubbleEl) {
      const center = s.vertical ? 'translate(0, 50%)' : 'translate(-50%, 0)';
      bubbleEl.style.transform = `${shift} ${center} scale(${(0.7 + 0.3 * m.a).toFixed(3)})`;
      bubbleEl.style.opacity = clamp(m.a * 1.4 - 0.2, 0, 1).toFixed(3);
    }
    const startShift = atEnd ? 0 : m.s;
    const endShift = atEnd ? m.s : 0;
    const iconScale = (1 + 0.08 * m.a).toFixed(3);
    if (startIconEl) {
      startIconEl.style.transform = s.vertical
        ? `translate3d(0, ${startShift.toFixed(2)}px, 0) scale(${iconScale})`
        : `translate3d(${(-startShift).toFixed(2)}px, 0, 0) scale(${iconScale})`;
    }
    if (endIconEl) {
      endIconEl.style.transform = s.vertical
        ? `translate3d(0, ${(-endShift).toFixed(2)}px, 0) scale(${iconScale})`
        : `translate3d(${endShift.toFixed(2)}px, 0, 0) scale(${iconScale})`;
    }
    if (bodyEl) {
      bodyEl.style.opacity = s.restOpacity < 1 ? (s.restOpacity + (1 - s.restOpacity) * m.a).toFixed(3) : '';
    }
  };

  const frame = (now: number) => {
    const m = motion;
    m.raf = 0;
    if (!mounted) return;
    const s = cur;
    const elapsed = clamp((now - m.last) / 1000, 0, 1 / 20);
    m.last = now;
    if (prefersReduced()) {
      m.p = m.target;
      m.vp = 0;
      if (!m.held) {
        m.s = 0;
        m.vs = 0;
      }
      m.a = m.goal;
      m.va = 0;
    } else {
      const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
      const dt = elapsed / steps;
      const fillOmega = TAU / (m.dragging ? 0.09 : 0.3);
      const fillZeta = m.dragging ? 1 : 0.86;
      const stretchOmega = TAU / 0.42;
      const stretchZeta = 1 - 0.9 * s.bounce;
      const activeOmega = TAU / 0.32;
      for (let i = 0; i < steps; i++) {
        m.vp += (-fillOmega * fillOmega * (m.p - m.target) - 2 * fillZeta * fillOmega * m.vp) * dt;
        m.p += m.vp * dt;
        if (!m.held) {
          m.vs += (-stretchOmega * stretchOmega * m.s - 2 * stretchZeta * stretchOmega * m.vs) * dt;
          m.s += m.vs * dt;
        }
        m.va += (-activeOmega * activeOmega * (m.a - m.goal) - 2 * 0.9 * activeOmega * m.va) * dt;
        m.a += m.va * dt;
      }
    }
    const settled =
      Math.abs(m.p - m.target) < 0.0004 &&
      Math.abs(m.vp) < 0.002 &&
      (m.held || (Math.abs(m.s) < 0.05 && Math.abs(m.vs) < 0.5)) &&
      Math.abs(m.a - m.goal) < 0.002 &&
      Math.abs(m.va) < 0.005;
    if (settled) {
      m.p = m.target;
      m.vp = 0;
      m.a = m.goal;
      m.va = 0;
      if (!m.held) {
        m.s = 0;
        m.vs = 0;
      }
    }
    paint();
    if (!settled || m.dragging) m.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const m = motion;
    if (m.raf || !mounted || typeof window === 'undefined') return;
    m.last = performance.now();
    m.raf = requestAnimationFrame(frame);
  };

  const autoInk = () => {
    const root = rootEl;
    const range = rangeEl;
    if (!root || !range || !mounted || cur.fillContentColor !== 'auto') return;
    const color = readColor(getComputedStyle(range).backgroundColor);
    const ink =
      !color || color[3] < 0.5
        ? 'var(--elastic-slider-content)'
        : (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255 > 0.55
          ? DARK_INK
          : LIGHT_INK;
    root.style.setProperty('--elastic-slider-fill-content', ink);
  };

  const refreshGoal = () => {
    const m = motion;
    m.goal = (m.hovered && cur.growOnHover) || m.dragging || m.focused ? 1 : 0;
    kick();
  };

  const pulse = (side: number) => {
    const icon = (side > 0 ? endIconEl : startIconEl)?.firstElementChild;
    if (!icon || !icon.isConnected || prefersReduced()) return;
    icon.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], {
      duration: 280,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
    });
  };

  const bump = (side: number) => {
    const m = motion;
    const s = cur;
    if (!s.maxStretch || m.held || Math.abs(m.vs) > 40 || Math.abs(m.s) > 2) return;
    m.side = side;
    m.vs = s.maxStretch * 5.5;
    pulse(side);
    kick();
  };

  const commit = (next: number) => {
    const s = cur;
    motion.target = (next - s.lo) / s.span;
    kick();
    if (next === currentVal) return;
    currentVal = next;
    if (!s.controlled) setInner(next);
    s.onChange?.(next);
  };

  let prevValue: number | null = null;
  let prevLo = 0;
  let prevSpan = 0;

  createEffect(
    () => ({ s: settings(), value: current() }),
    ({ s, value }) => {
      const prev = cur;
      cur = s;
      const m = motion;
      if (prevValue === null || value !== prevValue || s.lo !== prevLo || s.span !== prevSpan) {
        prevValue = value;
        prevLo = s.lo;
        prevSpan = s.span;
        currentVal = value;
        const fraction = (value - s.lo) / s.span;
        if (!m.dragging) m.target = fraction;
        if (!m.ready) {
          m.ready = true;
          m.p = fraction;
        } else {
          kick();
        }
      }
      if (prev && prev !== s) {
        if (prev.vertical !== s.vertical) measure?.();
        if (prev.growOnHover !== s.growOnHover) refreshGoal();
      }
      autoInk();
      paint();
    }
  );

  createEffect(
    () => ({ wheel: props.wheel ?? false, disabled: props.disabled ?? false }),
    ({ wheel, disabled }) => {
      const hit = hitEl;
      if (!hit || !wheel || disabled) return undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onWheel = (event: WheelEvent) => {
        event.preventDefault();
        const s = cur;
        const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? -event.deltaY : event.deltaX;
        if (!delta) return;
        const amount = s.step ? Math.sign(delta) * s.step : (delta * s.span) / 800;
        const next = snap(currentVal + amount);
        if (next === currentVal) {
          bump(Math.sign(delta));
          return;
        }
        commit(next);
        clearTimeout(timer);
        timer = setTimeout(() => cur.onChangeEnd?.(currentVal), 200);
      };
      hit.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        clearTimeout(timer);
        hit.removeEventListener('wheel', onWheel);
      };
    }
  );

  onSettled(() => {
    cur = settings();
    mounted = true;
    const hit = hitEl;
    if (!motion.ready) {
      motion.ready = true;
      currentVal = current();
      motion.target = (currentVal - cur.lo) / cur.span;
      motion.p = motion.target;
    }
    measure = () => {
      if (!hit) return;
      motion.length = cur.vertical ? hit.clientHeight : hit.clientWidth;
      paint();
    };
    measure();
    autoInk();
    paint();
    refreshGoal();
    const observer = typeof ResizeObserver === 'undefined' || !hit ? null : new ResizeObserver(() => measure?.());
    if (observer && hit) observer.observe(hit);
    return () => {
      mounted = false;
      observer?.disconnect();
      measure = null;
      cancelAnimationFrame(motion.raf);
      motion.raf = 0;
    };
  });

  const alongOf = (event: PointerEvent) => {
    const rect = hitEl?.getBoundingClientRect();
    if (!rect) return 0;
    return cur.vertical ? rect.bottom - event.clientY : event.clientX - rect.left;
  };

  const follow = (event: PointerEvent) => {
    const d = drag;
    if (!d) return;
    const m = motion;
    const s = cur;
    const length = Math.max(1, m.length);
    const position = alongOf(event);
    const fraction = d.from === null ? position / length : d.from + (position - d.origin) / length;
    const over = fraction < 0 ? -fraction * length : fraction > 1 ? (fraction - 1) * length : 0;
    if (over > 0 && s.maxStretch > 0) {
      const side = fraction < 0 ? -1 : 1;
      if (!m.held || m.side !== side) pulse(side);
      m.held = true;
      m.side = side;
      m.s = rubber(over, s.maxStretch);
      m.vs = 0;
    } else if (m.held) {
      m.held = false;
    }
    commit(snap(s.lo + clamp(fraction, 0, 1) * s.span));
  };

  const onPointerDown = (event: PointerEvent) => {
    const hit = hitEl;
    if (cur.disabled || event.button !== 0 || !hit) return;
    hit.setPointerCapture(event.pointerId);
    const m = motion;
    const s = cur;
    drag = {
      id: event.pointerId,
      origin: alongOf(event),
      from: s.jumpToClick ? null : m.target
    };
    m.dragging = true;
    hit.setAttribute('data-dragging', '');
    refreshGoal();
    if (s.jumpToClick) commit(snap(s.lo + clamp(alongOf(event) / Math.max(1, m.length), 0, 1) * s.span));
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    follow(event);
  };

  const release = () => {
    if (!drag) return;
    const m = motion;
    drag = null;
    m.dragging = false;
    m.held = false;
    hitEl?.removeAttribute('data-dragging');
    refreshGoal();
    cur.onChangeEnd?.(currentVal);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (cur.disabled) return;
    const s = cur;
    const unit = s.step || s.span / 100;
    const large = Math.max(unit, s.span / 10);
    const now = currentVal;
    const keys: Record<string, number> = {
      ArrowRight: now + unit,
      ArrowUp: now + unit,
      ArrowLeft: now - unit,
      ArrowDown: now - unit,
      PageUp: now + large,
      PageDown: now - large,
      Home: s.lo,
      End: s.hi
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const wanted = keys[event.key];
    const next = snap(wanted);
    if (next === now) {
      if (wanted !== now) bump(wanted > now ? 1 : -1);
      return;
    }
    commit(next);
    s.onChangeEnd?.(next);
  };

  const label = createMemo(() => {
    const value = current();
    const step = settings().step;
    return props.formatValue
      ? props.formatValue(value)
      : step
        ? value.toFixed(decimalsOf(step))
        : String(Math.round(value));
  });

  const startIcon = () => {
    const icon = props.leftIcon;
    return icon === undefined ? <Icon icon={VolumeLowIcon} size={20} strokeWidth={1.75} /> : icon;
  };
  const endIcon = () => {
    const icon = props.rightIcon;
    return icon === undefined ? <Icon icon={VolumeHighIcon} size={20} strokeWidth={1.75} /> : icon;
  };
  const hasStart = createMemo(() => {
    const icon = props.leftIcon;
    return icon === undefined || !!icon;
  });
  const hasEnd = createMemo(() => {
    const icon = props.rightIcon;
    return icon === undefined || !!icon;
  });

  const place = () => settings().place;
  const inside = () => settings().inside;
  const vertical = () => settings().vertical;
  const hasContent = createMemo(() => (inside() && hasStart()) || place() === 'inside' || (inside() && hasEnd()));
  const insideStart = () => (inside() ? startIcon() : null);
  const insideEnd = () => (place() === 'inside' ? <span>{label()}</span> : inside() ? endIcon() : null);

  const marks = createMemo(() => {
    const s = settings();
    const ticks = props.ticks ?? false;
    const count = s.step ? Math.round((s.hi - s.lo) / s.step) : 0;
    const tickValues = Array.isArray(ticks)
      ? ticks
      : ticks
        ? count > 0 && count <= 40
          ? Array.from({ length: count + 1 }, (_, index) => s.lo + index * s.step)
          : Array.from({ length: 11 }, (_, index) => s.lo + (index / 10) * (s.hi - s.lo))
        : [];
    return tickValues.map(tick => (tick - s.lo) / s.span).filter(fraction => fraction > 0.001 && fraction < 0.999);
  });

  const marksFor = (name: string) => (
    <For each={marks()}>
      {fraction => (
        <span class={name} style={vertical() ? { bottom: `${fraction * 100}%` } : { left: `${fraction * 100}%` }} />
      )}
    </For>
  );

  const contentFor = (name: string) => (
    <Show when={hasContent()}>
      <span class={name}>
        <span>{insideStart()}</span>
        <span>{insideEnd()}</span>
      </span>
    </Show>
  );

  const rootStyle = createMemo<JSX.CSSProperties>(() => {
    const thickness = props.thickness ?? 6;
    const activeThickness = props.activeThickness ?? 12;
    const fillContentColor = props.fillContentColor ?? 'auto';
    const thumbSize = clamp(activeThickness + 6, 16, 28);
    return {
      '--elastic-slider-track': props.trackColor ?? 'color-mix(in srgb, currentColor 18%, transparent)',
      '--elastic-slider-range': props.rangeColor ?? 'currentColor',
      '--elastic-slider-icon': props.iconColor ?? 'currentColor',
      '--elastic-slider-content': props.contentColor ?? 'currentColor',
      ...(fillContentColor !== 'auto' ? { '--elastic-slider-fill-content': fillContentColor } : {}),
      '--elastic-slider-thumb': props.thumbColor ?? '#ffffff',
      '--elastic-slider-thumb-size': `${thumbSize}px`,
      '--elastic-slider-hit': `${Math.max(34, thickness, activeThickness)}px`,
      '--elastic-slider-pad': `${Math.max(8, Math.round(thickness * 0.32))}px`,
      '--elastic-slider-bubble-offset': `${((props.thumb ?? false) ? thumbSize * 1.12 : activeThickness) / 2 + 8}px`,
      ...(props.radius !== undefined ? { '--elastic-slider-radius': `${props.radius}px` } : {}),
      ...(props.style ?? {})
    };
  });

  return (
    <div
      ref={el => (rootEl = el)}
      class={[ROOT, props.className]}
      style={rootStyle()}
      data-orientation={vertical() ? 'vertical' : 'horizontal'}
      data-disabled={settings().disabled ? '' : undefined}
      onPointerEnter={() => {
        motion.hovered = true;
        autoInk();
        refreshGoal();
      }}
      onPointerLeave={() => {
        motion.hovered = false;
        refreshGoal();
      }}
    >
      <Show when={place() === 'top'}>
        <span class={VALUE} aria-hidden="true">
          {label()}
        </span>
      </Show>
      <div class={BODY} ref={el => (bodyEl = el)}>
        <Show when={!inside() && hasStart()}>
          <span class={ICON} ref={el => (startIconEl = el)} aria-hidden="true">
            <span class={ICON_INNER}>{startIcon()}</span>
          </span>
        </Show>
        <div
          ref={el => (hitEl = el)}
          class={HIT}
          role="slider"
          tabindex={settings().disabled ? -1 : 0}
          aria-label={props.ariaLabel ?? 'Slider'}
          aria-valuemin={settings().lo}
          aria-valuemax={settings().hi}
          aria-valuenow={current()}
          aria-valuetext={label()}
          aria-orientation={vertical() ? 'vertical' : 'horizontal'}
          aria-disabled={settings().disabled ? 'true' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
          onKeyDown={onKeyDown}
          onFocus={event => {
            motion.focused = event.currentTarget.matches(':focus-visible');
            refreshGoal();
          }}
          onBlur={() => {
            motion.focused = false;
            refreshGoal();
          }}
        >
          <div class={TRACK} ref={el => (trackEl = el)}>
            {marksFor(TICK)}
            {contentFor(CONTENT)}
            <div class={RANGE} ref={el => (rangeEl = el)}>
              {marksFor(FILL_TICK)}
              {contentFor(FILL_CONTENT)}
            </div>
          </div>
          <Show when={settings().thumb}>
            <span class={THUMB} ref={el => (thumbEl = el)} aria-hidden="true" />
          </Show>
          <Show when={place() === 'bubble'}>
            <span class={BUBBLE} ref={el => (bubbleEl = el)} aria-hidden="true">
              <span class={BUBBLE_TEXT}>{label()}</span>
            </span>
          </Show>
        </div>
        <Show when={!inside() && hasEnd()}>
          <span class={ICON} ref={el => (endIconEl = el)} aria-hidden="true">
            <span class={ICON_INNER}>{endIcon()}</span>
          </span>
        </Show>
      </div>
    </div>
  );
}
