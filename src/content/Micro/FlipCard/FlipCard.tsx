import { Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue, springValue, type AnimationPlaybackControls } from 'motion';

import './FlipCard.css';

export type FlipCardAxis = 'x' | 'y';

export interface FlipCardProps {
  front?: JSX.Element;
  back?: JSX.Element;
  flipped?: boolean;
  defaultFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  axis?: FlipCardAxis;
  flipOnClick?: boolean;
  draggable?: boolean;
  dragDistance?: number;
  tilt?: boolean;
  tiltMax?: number;
  glare?: boolean;
  glareOpacity?: number;
  hoverScale?: number;
  perspective?: number;
  stiffness?: number;
  damping?: number;
  width?: number;
  height?: number;
  radius?: number;
  background?: string;
  color?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowOpacity?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface Grip {
  id: number;
  x: number;
  y: number;
  base: number;
  moved: boolean;
  slop: number;
  hist: { t: number; v: number }[];
}

type Config = {
  axis: FlipCardAxis;
  flipOnClick: boolean;
  draggable: boolean;
  dragDistance: number;
  tilt: boolean;
  tiltMax: number;
  hoverScale: number;
  perspective: number;
  stiffness: number;
  damping: number;
  width: number;
  height: number;
  disabled: boolean;
  reduce: boolean;
};

const SLOP = { fine: 4, coarse: 8 };
const TILT_SPRING = { stiffness: 240, damping: 24, mass: 0.6 };
const LIFT_SPRING = { stiffness: 320, damping: 26 };
const FLING = 0.16;
const HISTORY_MS = 90;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const snap = (deg: number) => Math.round(deg / 180) * 180;
const isBack = (deg: number) => Math.abs(Math.round(deg / 180)) % 2 === 1;

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

export default function FlipCard(props: FlipCardProps) {
  const reduce = useReducedMotion();
  const [inner, setInner] = createSignal<boolean>(() => untrack(() => props.defaultFlipped ?? false));
  const [dragging, setDragging] = createSignal(false);
  const shown = createMemo(() => (props.flipped !== undefined ? props.flipped : inner()));

  let rootEl: HTMLDivElement | undefined;
  let rotorEl: HTMLDivElement | undefined;
  let shadowEl: HTMLSpanElement | undefined;
  let shownRef = untrack(shown);
  let grip: Grip | null = null;
  let spin: AnimationPlaybackControls | null = null;
  let target = shownRef ? 180 : 0;
  let C = {} as Config;

  const turn = motionValue(target);
  const tiltX = springValue<number>(0, TILT_SPRING);
  const tiltY = springValue<number>(0, TILT_SPRING);
  const lift = springValue<number>(1, LIFT_SPRING);
  const sheen = springValue<number>(0, LIFT_SPRING);
  const gx = motionValue(50);
  const gy = motionValue(50);

  const paintShadow = () => {
    const el = shadowEl;
    if (!el) return;
    const f = Math.abs(Math.cos((turn.get() * Math.PI) / 180));
    const spread = 0.08 + 0.92 * f;
    el.style.transform = C.axis === 'x' ? `scaleY(${spread})` : `scaleX(${spread})`;
    el.style.opacity = String(0.1 + 0.9 * f * f);
  };

  const paintRotor = () => {
    const el = rotorEl;
    if (!el) return;
    if (C.reduce) {
      el.style.removeProperty('transform');
      el.style.removeProperty('--fc-gx');
      el.style.removeProperty('--fc-gy');
      el.style.removeProperty('--fc-sheen');
      return;
    }
    const p = C.perspective;
    const t = turn.get();
    el.style.transform =
      C.axis === 'x'
        ? `perspective(${p}px) scale(${lift.get()}) rotateY(${tiltY.get()}deg) rotateX(${t + tiltX.get()}deg)`
        : `perspective(${p}px) scale(${lift.get()}) rotateX(${tiltX.get()}deg) rotateY(${t + tiltY.get()}deg)`;
    el.style.setProperty('--fc-gx', `${gx.get()}%`);
    el.style.setProperty('--fc-gy', `${gy.get()}%`);
    el.style.setProperty('--fc-sheen', String(sheen.get()));
  };

  const paint = () => {
    paintRotor();
    paintShadow();
  };

  createEffect(
    () => ({
      axis: props.axis ?? 'y',
      flipOnClick: props.flipOnClick ?? true,
      draggable: props.draggable ?? true,
      dragDistance: props.dragDistance ?? 0,
      tilt: props.tilt ?? true,
      tiltMax: props.tiltMax ?? 12,
      hoverScale: props.hoverScale ?? 1.03,
      perspective: props.perspective ?? 1100,
      stiffness: props.stiffness ?? 170,
      damping: props.damping ?? 20,
      width: props.width ?? 300,
      height: props.height ?? 400,
      disabled: props.disabled ?? false,
      reduce: reduce()
    }),
    value => {
      C = value;
      paint();
    }
  );

  createEffect(shown, value => {
    shownRef = value;
  });

  const rest = () => {
    tiltX.set(0);
    tiltY.set(0);
    sheen.set(0);
    lift.set(1);
  };

  createEffect(
    () => props.flipped,
    flipped => {
      if (flipped === undefined || isBack(target) === flipped) return;
      const base = target;
      spin?.stop();
      target = isBack(base) ? base - 180 : base + 180;
      if (C.reduce) turn.jump(target);
      else
        spin = animate(turn, target, { type: 'spring', stiffness: C.stiffness, damping: C.damping, restDelta: 0.05 });
    }
  );

  createEffect(
    () => props.disabled ?? false,
    disabled => {
      if (disabled) rest();
    }
  );

  onSettled(() => {
    const values = [turn, tiltX, tiltY, lift, sheen, gx, gy];
    const offs = [
      turn.on('change', paint),
      tiltX.on('change', paintRotor),
      tiltY.on('change', paintRotor),
      lift.on('change', paintRotor),
      sheen.on('change', paintRotor),
      gx.on('change', paintRotor),
      gy.on('change', paintRotor)
    ];
    paint();
    return () => {
      spin?.stop();
      offs.forEach(off => off());
      values.forEach(mv => mv.destroy());
    };
  });

  const settle = (to: number, velocity: number, instant: boolean) => {
    spin?.stop();
    target = to;
    if (instant || C.reduce) turn.jump(to);
    else
      spin = animate(turn, to, {
        type: 'spring',
        stiffness: C.stiffness,
        damping: C.damping,
        velocity,
        restDelta: 0.05
      });
    const next = isBack(to);
    if (next === shownRef) return;
    shownRef = next;
    if (props.flipped === undefined) setInner(next);
    props.onFlipChange?.(next);
  };
  const flip = (instant: boolean) => {
    const base = snap(turn.get());
    settle(isBack(base) ? base - 180 : base + 180, 0, instant);
  };

  const onPointerDown = (e: PointerEvent) => {
    const el = rootEl;
    if (C.disabled || e.button !== 0 || grip || !el) return;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
    spin?.stop();
    grip = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      base: turn.get(),
      moved: false,
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine,
      hist: []
    };
    if (!C.reduce) lift.set(C.hoverScale);
  };
  const onPointerMove = (e: PointerEvent) => {
    const g = grip;
    if (g && g.id === e.pointerId) {
      const d = C.axis === 'x' ? e.clientY - g.y : e.clientX - g.x;
      if (!g.moved) {
        if (Math.abs(d) < g.slop || !C.draggable || C.reduce) return;
        g.moved = true;
        setDragging(true);
        tiltX.set(0);
        tiltY.set(0);
        sheen.set(0);
      }
      const span = C.dragDistance > 0 ? C.dragDistance : C.axis === 'x' ? C.height : C.width;
      const deg = g.base + (C.axis === 'x' ? -1 : 1) * (d / span) * 180;
      turn.set(deg);
      const now = performance.now();
      g.hist.push({ t: now, v: deg });
      while (g.hist.length > 2 && now - g.hist[0].t > HISTORY_MS) g.hist.shift();
      return;
    }
    if (!C.tilt || C.reduce || C.disabled || e.pointerType === 'touch' || !rootEl) return;
    const r = rootEl.getBoundingClientRect();
    const px = clamp((e.clientX - r.left) / r.width, 0, 1);
    const py = clamp((e.clientY - r.top) / r.height, 0, 1);
    tiltX.set((0.5 - py) * 2 * C.tiltMax);
    tiltY.set((px - 0.5) * 2 * C.tiltMax);
    gx.set(px * 100);
    gy.set(py * 100);
    sheen.set(1);
  };
  const release = (e: PointerEvent, cancelled: boolean) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try {
      if (rootEl?.hasPointerCapture(e.pointerId)) rootEl.releasePointerCapture(e.pointerId);
    } catch {}
    setDragging(false);
    if (e.pointerType === 'touch' || !rootEl?.matches(':hover')) rest();
    if (!g.moved) {
      if (!cancelled && C.flipOnClick) flip(false);
      else settle(target, 0, false);
      return;
    }
    const here = turn.get();
    let velocity = 0;
    const a = g.hist[0];
    const b = g.hist[g.hist.length - 1];
    if (!cancelled && a && b && b.t > a.t && performance.now() - b.t < 60)
      velocity = ((b.v - a.v) / (b.t - a.t)) * 1000;
    const to = cancelled ? snap(g.base) : clamp(snap(here + velocity * FLING), snap(here) - 180, snap(here) + 180);
    settle(to, velocity, false);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (C.disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (!e.repeat) flip(true);
  };
  const onClick = (e: MouseEvent) => {
    if (!C.disabled && e.detail === 0) flip(true);
  };

  const rootStyle = createMemo(
    () =>
      ({
        '--fc-w': `${props.width ?? 300}px`,
        '--fc-h': `${props.height ?? 400}px`,
        '--fc-radius': `${props.radius ?? 22}px`,
        '--fc-bg': props.background ?? '#27272a',
        '--fc-ink': props.color ?? '#f5f5f5',
        '--fc-shadow': props.shadowColor ?? '#000000',
        '--fc-shadow-o': props.shadowOpacity ?? 0.45,
        '--fc-glare': props.glareOpacity ?? 0.22
      }) as JSX.CSSProperties
  );

  return (
    <div
      ref={el => (rootEl = el)}
      role="button"
      tabindex={props.disabled ? -1 : 0}
      aria-pressed={shown() ? 'true' : 'false'}
      aria-label={props.ariaLabel ?? 'Flip card'}
      aria-disabled={props.disabled ? 'true' : undefined}
      class={['flip-card', props.className]}
      data-axis={props.axis ?? 'y'}
      data-draggable={(props.draggable ?? true) && !props.disabled && !reduce() ? '' : undefined}
      data-dragging={dragging() ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
      data-fade={reduce() ? (shown() ? 'back' : 'front') : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={e => release(e, false)}
      onPointerCancel={e => release(e, true)}
      onLostPointerCapture={e => release(e, true)}
      onPointerEnter={e => {
        if (!C.reduce && !C.disabled && e.pointerType !== 'touch') lift.set(C.hoverScale);
      }}
      onPointerLeave={() => {
        if (!grip) rest();
      }}
      onKeyDown={onKeyDown}
      onClick={onClick}
      onDragStart={e => e.preventDefault()}
      style={rootStyle()}
    >
      <Show when={props.shadow ?? true}>
        <span
          ref={el => {
            shadowEl = el;
            paintShadow();
          }}
          class="flip-card__shadow"
          aria-hidden="true"
        />
      </Show>
      <div ref={el => (rotorEl = el)} class="flip-card__rotor">
        <div class="flip-card__face flip-card__face--front" aria-hidden={shown() ? 'true' : 'false'} inert={shown()}>
          {props.front ?? null}
          <Show when={props.glare ?? true}>
            <span class="flip-card__glare" aria-hidden="true" />
          </Show>
        </div>
        <div class="flip-card__face flip-card__face--back" aria-hidden={shown() ? 'false' : 'true'} inert={!shown()}>
          {props.back ?? null}
          <Show when={props.glare ?? true}>
            <span class="flip-card__glare" aria-hidden="true" />
          </Show>
        </div>
      </div>
    </div>
  );
}
