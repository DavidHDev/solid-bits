import { For, Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { attachSpring, cancelFrame, frame, motionValue } from 'motion';

import './WakeSlider.css';

const SETTLE = 9.23;
const FULL_SPEED = 320;
const MIN_REACH = 1.5;
const FLAT = 0.002;

export interface WakeSliderProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  bars?: number;
  height?: number;
  restHeight?: number;
  gap?: number;
  fillColor?: string;
  trackColor?: string;
  crestColor?: string;
  sensitivity?: number;
  reach?: number;
  skew?: number;
  glide?: number;
  smoothing?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

type Paint = {
  pct: number;
  bars: number;
  rest: number;
  crest: boolean;
  sensitivity: number;
  reach: number;
  skew: number;
  reduce: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (s: number) => s * s * (3 - 2 * s);
const toPct = (v: number, min: number, max: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
const snap = (v: number, min: number, max: number, step: number) => {
  if (!(max > min)) return min;
  if (!(step > 0)) return clamp(v, min, max);
  const lastWhole = min + Math.floor(+((max - min) / step).toFixed(6)) * step;
  const grid = clamp(Math.round((v - min) / step) * step + min, min, lastWhole);
  return +(lastWhole < max && Math.abs(v - max) <= Math.abs(v - grid) ? max : grid).toFixed(6);
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

export default function WakeSlider(props: WakeSliderProps) {
  const [inner, setInner] = createSignal(() => props.defaultValue ?? 50);
  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;
  const value = createMemo(() => clamp(props.value ?? inner(), min(), max()));
  const pct = createMemo(() => toPct(value(), min(), max()));
  const reduce = useReducedMotion();
  const format = (v: number) => (props.formatValue ?? String)(v);
  const height = () => props.height ?? 56;
  const rest = createMemo(() => Math.min(props.restHeight ?? 12, height() - 1) / height());
  const barCount = () => props.bars ?? 32;
  const barList = createMemo(() => Array.from({ length: barCount() }, (_, i) => i));
  const disabled = () => props.disabled ?? false;

  let rootEl: HTMLDivElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  let handleEl: HTMLButtonElement | undefined;
  const barEls: (HTMLSpanElement | undefined)[] = [];
  const crestEls: (HTMLSpanElement | undefined)[] = [];
  let pointerId: number | null = null;
  let lastAmp = 0;
  let latest = 0;
  let current: Paint | null = null;
  let litNow = untrack(() => Math.round((pct() / 100) * (barCount() - 1)));

  const target = motionValue(0);
  const head = motionValue(0);
  const rawSpeed = motionValue(0);
  const speed = motionValue(0);

  const paint = (force = false) => {
    const p = current;
    if (!p) return;
    const bars = p.bars;
    const rest = p.rest;
    const h = ((p.reduce ? target.get() : head.get()) / 100) * (bars - 1);
    const v = p.reduce ? 0 : speed.get();
    const amp = smoothstep(clamp((Math.abs(v) * p.sensitivity) / FULL_SPEED, 0, 1));
    const dir = Math.sign(v) || 1;
    const r = MIN_REACH + (p.reach - MIN_REACH) * amp;
    const behind = r * (1 + p.skew);
    const ahead = r * (1 - 0.5 * p.skew);
    const lit = Math.round(h);
    litNow = lit;
    const flat = !force && amp < FLAT && lastAmp < FLAT;
    for (let i = 0; i < bars; i++) {
      const el = barEls[i];
      if (!el) continue;
      const on = i <= lit ? 'true' : 'false';
      if (el.dataset.on !== on) el.dataset.on = on;
      if (flat) continue;
      const d = i - h;
      const R = d * dir < 0 ? behind : ahead;
      const lift = Math.abs(d) < R ? amp * Math.cos((Math.PI * d) / (2 * R)) ** 2 : 0;
      el.style.transform = `scaleY(${rest + lift * (1 - rest)})`;
      const crest = p.crest ? crestEls[i] : undefined;
      if (crest) crest.style.opacity = String(lift);
    }
    lastAmp = amp;
  };
  const run = () => paint();
  const schedule = () => {
    frame.render(run, false, true);
  };
  const updateVelocity = () => {
    const v = head.getVelocity();
    rawSpeed.set(v);
    if (v) frame.update(updateVelocity);
  };
  const trackVelocity = () => {
    frame.update(updateVelocity, false, true);
  };

  createEffect(
    () => ({ glide: props.glide ?? 0.3, smoothing: props.smoothing ?? 100 }),
    ({ glide, smoothing }) => {
      const w0 = SETTLE / glide;
      const wv = 2000 / smoothing;
      const offHead = attachSpring(head, target, { stiffness: w0 * w0, damping: 2 * w0, mass: 1 });
      const offSpeed = attachSpring(speed, rawSpeed, { stiffness: wv * wv, damping: 2.5 * wv, mass: 1 });
      return () => {
        offHead();
        offSpeed();
      };
    }
  );

  createEffect(
    () => ({
      pct: pct(),
      value: value(),
      paint: {
        pct: pct(),
        bars: barList().length,
        rest: rest(),
        crest: !!props.crestColor,
        sensitivity: props.sensitivity ?? 1,
        reach: props.reach ?? 6,
        skew: props.skew ?? 0.6,
        reduce: reduce()
      } as Paint
    }),
    next => {
      const first = current === null;
      current = next.paint;
      latest = next.value;
      if (first) {
        target.jump(next.pct);
        head.jump(next.pct);
      }
      paint(true);
      target.set(next.pct);
    }
  );

  onSettled(() => {
    const offHeadChange = head.on('change', schedule);
    const offHeadVelocity = head.on('change', trackVelocity);
    const offSpeedChange = speed.on('change', schedule);
    paint(true);
    return () => {
      offHeadChange();
      offHeadVelocity();
      offSpeedChange();
      cancelFrame(run);
      cancelFrame(updateVelocity);
      head.destroy();
      speed.destroy();
      rawSpeed.destroy();
      target.destroy();
    };
  });

  const commit = (next: number) => {
    const clean = snap(next, min(), max(), step());
    if (clean === latest) return;
    latest = clean;
    if (props.value === undefined) setInner(clean);
    props.onChange?.(clean);
  };
  const commitFromX = (x: number) => {
    const track = trackEl;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (!rect.width) return;
    let ratio = clamp((x - rect.left) / rect.width, 0, 1);
    if (getComputedStyle(track).direction === 'rtl') ratio = 1 - ratio;
    commit(min() + ratio * (max() - min()));
  };
  const onPointerDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    if (disabled() || pointerId !== null) return;
    pointerId = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    rootEl?.removeAttribute('data-instant');
    handleEl?.focus({ preventScroll: true });
    commitFromX(e.clientX);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId === pointerId) commitFromX(e.clientX);
  };
  const endDrag = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    if (e.pointerId !== pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    pointerId = null;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled()) return;
    const v = value();
    const s = step();
    const jumps: Record<string, number> = {
      ArrowRight: v + s,
      ArrowUp: v + s,
      ArrowLeft: v - s,
      ArrowDown: v - s,
      PageUp: v + s * 10,
      PageDown: v - s * 10,
      Home: min(),
      End: max()
    };
    if (!(e.key in jumps)) return;
    e.preventDefault();
    const clean = snap(jumps[e.key], min(), max(), s);
    const p = toPct(clean, min(), max());
    rootEl?.setAttribute('data-instant', 'true');
    head.jump(p);
    speed.jump(0);
    target.jump(p);
    commit(clean);
  };

  return (
    <div
      ref={el => (rootEl = el)}
      class={['wake-slider', props.className]}
      aria-disabled={disabled() ? 'true' : undefined}
      style={
        {
          '--ws-fill': props.fillColor ?? '#f5f5f5',
          '--ws-track': props.trackColor ?? '#27272a',
          '--ws-crest': props.crestColor || (props.fillColor ?? '#f5f5f5'),
          '--ws-height': `${height()}px`,
          '--ws-gap': `${props.gap ?? 4}px`,
          '--ws-rest': String(rest())
        } as JSX.CSSProperties
      }
    >
      <div
        ref={el => (trackEl = el)}
        class="wake-slider__track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
      >
        <For each={barList()}>
          {i => (
            <span
              ref={el => {
                barEls[i] = el;
                if (!el.dataset.on) el.dataset.on = i <= litNow ? 'true' : 'false';
              }}
              class="wake-slider__bar"
            >
              <Show when={props.crestColor}>
                <span ref={el => (crestEls[i] = el)} class="wake-slider__crest" />
              </Show>
            </span>
          )}
        </For>
        <button
          ref={el => (handleEl = el)}
          type="button"
          role="slider"
          class="wake-slider__handle"
          tabindex={disabled() ? -1 : 0}
          aria-label={props.ariaLabel ?? 'Value'}
          aria-valuemin={min()}
          aria-valuemax={max()}
          aria-valuenow={value()}
          aria-valuetext={format(value())}
          aria-disabled={disabled() ? 'true' : undefined}
          onKeyDown={onKeyDown}
        />
      </div>
      <Show when={props.showValue}>
        <span class="wake-slider__value" aria-hidden="true">
          {format(value())}
        </span>
      </Show>
    </div>
  );
}
