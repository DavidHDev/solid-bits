import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled,
  untrack,
  type Accessor
} from 'solid-js';
import { animate, frame, motionValue, springValue, type AnimationPlaybackControls } from 'motion';
import './SquishSwitch.css';

export interface SquishSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  trackColor?: string;
  trackOnColor?: string;
  thumbColor?: string;
  thumbOnColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  speed?: number;
  stretch?: number;
  hoverScale?: number;
  colorDuration?: number;
  ariaLabel?: string;
  className?: string;
  id?: string;
}

interface Grip {
  id: number;
  grab: number | null;
  moved: boolean;
  startX: number;
  onAtPress: boolean;
  slop: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };
const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };
const MAX_STRETCH = 0.4;
const STRETCH_SPEED = 600;
const TAP_SLOP = { fine: 4, coarse: 8 };

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

export default function SquishSwitch(props: SquishSwitchProps) {
  const reduce = useReducedMotion();
  const autoId = createUniqueId();

  const geometry = createMemo(() => {
    const width = props.width ?? 76;
    const height = props.height ?? 38;
    const radius = props.radius ?? 19;
    const inset = Math.max(3, Math.round(height * 0.11));
    const thumb = height - inset * 2;
    const min = inset;
    const max = width - inset - thumb;
    const trackRadius = Math.min(radius, height / 2);
    return {
      width,
      height,
      inset,
      thumb,
      min,
      max,
      mid: (min + max) / 2,
      trackRadius,
      thumbRadius: Math.max(2, trackRadius - inset)
    };
  });

  const isControlled = () => props.checked !== undefined;
  const [inner, setInner] = createSignal(() => props.defaultChecked ?? false);
  const on = createMemo(() => (isControlled() ? !!props.checked : inner()));
  const [dragging, setDragging] = createSignal(false);
  const buttonId = () => props.id ?? autoId;

  let trackEl: HTMLSpanElement | undefined;
  let thumbEl: HTMLSpanElement | undefined;
  let grip: Grip | null = null;
  let onNow = untrack(on);
  let skipClick = false;
  let skipTimer: ReturnType<typeof setTimeout> | undefined;
  let geo = untrack(geometry);
  let gain = 0;

  const x = motionValue<number>(onNow ? geo.max : geo.min);
  const velocity = motionValue(x.getVelocity());
  const flow = springValue(velocity, FLOW_SPRING);
  const swell = springValue<number>(1, SWELL_SPRING);
  const stretchOf = (v: number) => 1 + Math.min(MAX_STRETCH, Math.abs(v) / STRETCH_SPEED) * gain;

  const paint = () => {
    if (!thumbEl) return;
    const v = flow.get();
    const h = swell.get();
    const s = stretchOf(v);
    thumbEl.style.transform = `translateX(${x.get()}px) scaleX(${s * h}) scaleY(${h / s})`;
  };
  const schedule = () => {
    frame.render(paint);
  };

  createEffect(on, value => {
    onNow = value;
  });

  createEffect(
    () => ({ g: geometry(), gain: reduce() ? 0 : clamp(props.stretch ?? 36, 0, 100) / 100 }),
    value => {
      geo = value.g;
      gain = value.gain;
      schedule();
    }
  );

  createEffect(
    () => ({
      on: on(),
      dragging: dragging(),
      min: geometry().min,
      max: geometry().max,
      speed: props.speed ?? 50,
      reduce: reduce()
    }),
    value => {
      if (value.dragging) return;
      const target = value.on ? value.max : value.min;
      if (value.reduce) {
        x.jump(target);
        return;
      }
      const controls: AnimationPlaybackControls = animate(x, target, {
        type: 'spring',
        stiffness: 170 - (50 - clamp(value.speed, 0, 100)) * 1.1,
        damping: 21.5,
        mass: 0.9,
        restDelta: 0.001,
        restSpeed: 0.01
      });
      return () => controls.stop();
    }
  );

  onSettled(() => {
    const updateVelocity = () => {
      const latest = x.getVelocity();
      velocity.set(latest);
      if (latest) frame.update(updateVelocity);
    };
    const offX = x.on('change', () => {
      frame.update(updateVelocity, false, true);
      schedule();
    });
    const offFlow = flow.on('change', schedule);
    const offSwell = swell.on('change', schedule);
    paint();
    return () => {
      offX();
      offFlow();
      offSwell();
      clearTimeout(skipTimer);
      x.destroy();
      velocity.destroy();
      flow.destroy();
      swell.destroy();
    };
  });

  const commit = (next: boolean) => {
    if (next === onNow) return;
    onNow = next;
    if (!isControlled()) setInner(next);
    props.onChange?.(next);
  };

  const localX = (clientX: number) => {
    const el = trackEl;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    return (clientX - rect.left) / scale;
  };
  const down = (e: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    if (props.disabled || grip || e.button !== 0) return;
    grip = {
      id: e.pointerId,
      grab: null,
      moved: false,
      startX: e.clientX,
      onAtPress: onNow,
      slop: e.pointerType === 'touch' ? TAP_SLOP.coarse : TAP_SLOP.fine
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDragging(true);
  };
  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const lx = localX(e.clientX);
    if (g.grab === null) {
      g.grab = lx - x.get();
      return;
    }
    if (!g.moved && Math.abs(e.clientX - g.startX) > g.slop) g.moved = true;
    if (!g.moved) return;
    const nx = clamp(lx - g.grab, geo.min, geo.max);
    x.set(nx);
    commit(nx > geo.mid);
  };
  const up = (e: { pointerId: number; currentTarget: HTMLButtonElement }, cancelled: boolean) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (cancelled) commit(g.onAtPress);
    else if (!g.moved) commit(!onNow);
    skipClick = true;
    clearTimeout(skipTimer);
    skipTimer = setTimeout(() => {
      skipClick = false;
    }, 0);
    setDragging(false);
  };
  const click = () => {
    if (skipClick) {
      skipClick = false;
      return;
    }
    if (!props.disabled) commit(!onNow);
  };

  return (
    <span class={['squish-switch-root', props.className]}>
      <button
        id={buttonId()}
        type="button"
        role="switch"
        aria-checked={on() ? 'true' : 'false'}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        class="squish-switch"
        data-on={on() ? '' : undefined}
        data-held={dragging() ? '' : undefined}
        style={{
          '--ss-w': `${geometry().width}px`,
          '--ss-h': `${geometry().height}px`,
          '--ss-inset': `${geometry().inset}px`,
          '--ss-thumb': `${geometry().thumb}px`,
          '--ss-r': `${geometry().trackRadius}px`,
          '--ss-thumb-r': `${geometry().thumbRadius}px`,
          '--ss-track': props.trackColor ?? '#27272a',
          '--ss-track-on': props.trackOnColor ?? '#f5f5f5',
          '--ss-thumb-color':
            props.thumbColor ||
            `color-mix(in srgb, ${props.trackOnColor ?? '#f5f5f5'} 19%, ${props.trackColor ?? '#27272a'})`,
          '--ss-thumb-on': props.thumbOnColor || (props.trackColor ?? '#27272a'),
          '--ss-fade': `${props.colorDuration ?? 320}ms`
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={e => up(e, false)}
        onPointerCancel={e => up(e, true)}
        onPointerEnter={e => {
          if (e.pointerType === 'mouse' && !props.disabled) swell.set(props.hoverScale ?? 1.035);
        }}
        onPointerLeave={() => swell.set(1)}
        onKeyDown={e => {
          if (e.key === 'Escape' && grip) up({ pointerId: grip.id, currentTarget: e.currentTarget }, true);
        }}
        onClick={click}
      >
        <span ref={el => (trackEl = el)} class="squish-switch__track">
          <span ref={el => (thumbEl = el)} class="squish-switch__thumb" aria-hidden="true" />
        </span>
      </button>
      <Show when={props.label}>
        <label for={buttonId()} class="squish-switch__label">
          {props.label}
        </label>
      </Show>
    </span>
  );
}
