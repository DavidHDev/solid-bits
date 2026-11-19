import { For, Show, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue, type AnimationPlaybackControls } from 'motion';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import './BellToggle.css';

export type BellToggleSize = 'sm' | 'md' | 'lg';

export interface BellToggleProps {
  offLabel?: string;
  onLabel?: string;
  icon?: JSX.Element;
  label?: string;
  color?: string;
  background?: string;
  onColor?: string;
  onBackground?: string;
  size?: BellToggleSize;
  radius?: number;
  ringAmplitude?: number;
  ringPasses?: number;
  ringDecay?: number;
  ringDuration?: number;
  ringPivot?: number;
  crossfadeMs?: number;
  revealBounce?: number;
  count?: number;
  badge?: boolean;
  badgeColor?: string;
  badgeTextColor?: string;
  waves?: boolean;
  clapper?: boolean;
  pressed?: boolean;
  defaultPressed?: boolean;
  onChange?: (pressed: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const SEG_EASE = 'cubic-bezier(0.77, 0, 0.175, 1)';
const WARP = 0.6;
const SIZES: Record<string, [number, number, number, number, number]> = {
  sm: [36, 12.5, 14, 15, 8],
  md: [44, 13.5, 16, 19, 9],
  lg: [52, 15, 18, 23, 10]
};
const WOBBLE = { amplitude: 0.4, passes: 3, duration: 420 };
const BELL_BODY = 'M6 16.5V10a6 6 0 0 1 12 0v6.5l1.6 2.3H4.4L6 16.5z';
const BELL_ICON = (Notification03Icon as unknown as [string, Record<string, string>][]).map(node => String(node[1].d));

type Ring = {
  ringAmplitude: number;
  ringPasses: number;
  ringDecay: number;
  ringDuration: number;
  revealBounce: number;
  waves: boolean;
};

const passOffset = (k: number, passes: number) => 1 - Math.pow(1 - (k + 2 / 3) / (passes + 1), WARP);
const ringKeyframes = (from: number, amplitude: number, passes: number, decay: number): Keyframe[] => {
  const frames: Keyframe[] = [{ transform: `rotate(${from}deg)`, offset: 0, easing: SEG_EASE }];
  for (let k = 0; k < passes; k++) {
    const angle = amplitude * Math.pow(1 - k / passes, decay) * (k % 2 ? 1 : -1);
    frames.push({ transform: `rotate(${angle.toFixed(2)}deg)`, offset: passOffset(k, passes), easing: SEG_EASE });
  }
  frames.push({ transform: 'rotate(0deg)', offset: 1 });
  return frames;
};
const liveAngle = (el: Element) => {
  const tf = getComputedStyle(el).transform;
  if (!tf || tf === 'none') return 0;
  const m = new DOMMatrix(tf);
  return (Math.atan2(m.b, m.a) * 180) / Math.PI;
};

function BellIcon(props: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
    >
      <For each={BELL_ICON}>
        {d => <path d={d} stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />}
      </For>
    </svg>
  );
}

export default function BellToggle(props: BellToggleProps) {
  const [inner, setInner] = createSignal(() => props.defaultPressed ?? false);
  const on = createMemo(() => props.pressed ?? inner());
  const dims = createMemo(() => SIZES[props.size ?? 'md'] ?? SIZES.md);
  const ring = createMemo<Ring>(() => ({
    ringAmplitude: props.ringAmplitude ?? 17,
    ringPasses: props.ringPasses ?? 5,
    ringDecay: props.ringDecay ?? 1,
    ringDuration: props.ringDuration ?? 820,
    revealBounce: props.revealBounce ?? 0,
    waves: props.waves ?? true
  }));
  const count = () => props.count ?? 0;
  const clapper = () => props.clapper ?? false;
  const badge = () => props.badge ?? true;

  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduce = mq?.matches ?? false;
  let current = untrack(ring);
  let rootEl: HTMLSpanElement | undefined;
  let glyphEl: HTMLSpanElement | undefined;
  let clapperEl: HTMLSpanElement | undefined;
  let waveLeft: SVGSVGElement | undefined;
  let waveRight: SVGSVGElement | undefined;
  let offEl: HTMLSpanElement | undefined;
  let onEl: HTMLSpanElement | undefined;
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let pending: 'pointer' | 'keyboard' | null = null;
  let spring: AnimationPlaybackControls | null = null;
  let prevCount: number | null = null;

  const t = motionValue(untrack(on) ? 1 : 0);
  const wOff = motionValue(0);
  const wOn = motionValue(0);
  const writeClip = () => {
    const v = t.get();
    const a = wOff.get();
    const b = wOn.get();
    rootEl?.style.setProperty('--bt-clip', `${Math.max(a, b) - (a + (b - a) * v)}px`);
  };

  const swing = (amplitude: number, passes: number, duration: number) => {
    const el = glyphEl;
    if (!el) return;
    const c = current;
    el.getAnimations().forEach(a => a.cancel());
    el.animate(ringKeyframes(liveAngle(el), amplitude, passes, c.ringDecay), { duration, easing: 'linear' });
    const cl = clapperEl;
    if (cl && cl.isConnected) {
      cl.getAnimations().forEach(a => a.cancel());
      cl.animate(ringKeyframes(liveAngle(cl), amplitude * 1.6, passes, c.ringDecay), {
        duration,
        delay: 70,
        easing: 'linear'
      });
    }
    if (!c.waves) return;
    for (let k = 0; k < passes; k++) {
      const side = k % 2 ? waveRight : waveLeft;
      if (!side) continue;
      const strength = Math.pow(1 - k / passes, c.ringDecay);
      side.animate(
        [
          { opacity: 0, transform: 'scale(0.55)' },
          { opacity: 0.9 * strength, offset: 0.3 },
          { opacity: 0, transform: 'scale(1.25)' }
        ],
        { duration: 380, delay: passOffset(k, passes) * duration, easing: 'ease-out' }
      );
    }
  };

  createEffect(ring, value => {
    current = value;
  });

  createEffect(on, value => {
    const pointer = pending === 'pointer' && !reduce;
    pending = null;
    spring?.stop();
    if (pointer) spring = animate(t, value ? 1 : 0, { ...SPRING_UI, bounce: current.revealBounce });
    else t.jump(value ? 1 : 0);
    if (value && pointer) swing(current.ringAmplitude, current.ringPasses, current.ringDuration);
  });

  createEffect(
    () => ({ count: count(), on: on() }),
    value => {
      const was = prevCount ?? value.count;
      prevCount = value.count;
      if (value.count > was && value.on && !reduce)
        swing(current.ringAmplitude * WOBBLE.amplitude, WOBBLE.passes, WOBBLE.duration);
    }
  );

  onSettled(() => {
    let alive = true;
    const onReduce = () => {
      reduce = mq?.matches ?? false;
    };
    mq?.addEventListener('change', onReduce);
    const measure = () => {
      if (!alive) return;
      if (offEl) wOff.set(offEl.offsetWidth);
      if (onEl) wOn.set(onEl.offsetWidth);
    };
    const offT = t.on('change', writeClip);
    const offA = wOff.on('change', writeClip);
    const offB = wOn.on('change', writeClip);
    measure();
    writeClip();
    const observer = new ResizeObserver(measure);
    if (offEl) observer.observe(offEl);
    if (onEl) observer.observe(onEl);
    document.fonts?.ready.then(measure);
    return () => {
      alive = false;
      mq?.removeEventListener('change', onReduce);
      observer.disconnect();
      offT();
      offA();
      offB();
      spring?.stop();
      spring = null;
      t.stop();
    };
  });

  const toggle = () => {
    pending = lastInput;
    const next = !on();
    if (props.pressed === undefined) setInner(next);
    props.onChange?.(next);
  };
  const press = (e: PointerEvent) => {
    lastInput = 'pointer';
    if (e.button === 0 && !props.disabled && rootEl) rootEl.dataset.pressed = '';
  };
  const release = () => {
    if (rootEl) delete rootEl.dataset.pressed;
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
  };

  const showBadge = () => badge() && on() && count() > 0;

  const style = (): JSX.CSSProperties => {
    const [h, fs, iconSize, px, gap] = dims();
    return {
      '--bt-color': props.color ?? '#f5f5f5',
      '--bt-bg': props.background ?? '#27272a',
      '--bt-on-color': props.onColor ?? '#18181b',
      '--bt-on-bg': props.onBackground ?? '#f5f5f5',
      '--bt-badge': props.badgeColor ?? '#ef4444',
      '--bt-badge-ink': props.badgeTextColor ?? '#ffffff',
      '--bt-radius': `${props.radius ?? 22}px`,
      '--bt-fade': `${props.crossfadeMs ?? 200}ms`,
      '--bt-pivot': `${props.ringPivot ?? 16}%`,
      '--bt-h': `${h}px`,
      '--bt-fs': `${fs}px`,
      '--bt-icon': `${iconSize}px`,
      '--bt-px': `${px}px`,
      '--bt-gap': `${gap}px`
    };
  };

  return (
    <span
      ref={el => (rootEl = el)}
      class={['bell-toggle', props.className]}
      data-on={on() ? 'true' : 'false'}
      data-disabled={props.disabled ? '' : undefined}
      style={style()}
    >
      <button
        type="button"
        class="bell-toggle__button"
        aria-pressed={on() ? 'true' : 'false'}
        aria-label={props.label ?? props.offLabel ?? 'Notify me'}
        disabled={props.disabled ?? false}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        onKeyDown={key}
        onClick={toggle}
      >
        <span class="bell-toggle__bell" aria-hidden="true">
          <span ref={el => (glyphEl = el)} class="bell-toggle__glyph">
            <Show when={clapper()} fallback={props.icon ?? <BellIcon size={dims()[2]} />}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d={BELL_BODY} />
                <path d="M12 2.5V4" />
              </svg>
            </Show>
          </span>
          <Show when={clapper()}>
            <span ref={el => (clapperEl = el)} class="bell-toggle__clapper">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="20.4" r="1.7" fill="currentColor" />
              </svg>
            </span>
          </Show>
          <Show when={ring().waves}>
            <svg ref={el => (waveLeft = el)} class="bell-toggle__wave bell-toggle__wave--left" viewBox="0 0 14 14">
              <path d="M14 8a6 6 0 0 0-6 6" />
              <path d="M14 4A10 10 0 0 0 4 14" />
            </svg>
            <svg ref={el => (waveRight = el)} class="bell-toggle__wave bell-toggle__wave--right" viewBox="0 0 14 14">
              <path d="M0 8a6 6 0 0 1 6 6" />
              <path d="M0 4a10 10 0 0 1 10 10" />
            </svg>
          </Show>
          <Show when={badge()}>
            <span class="bell-toggle__badge" data-show={showBadge() ? '' : undefined}>
              <For each={[count()]}>{c => <span class="bell-toggle__digit">{c > 9 ? '9+' : c}</span>}</For>
            </span>
          </Show>
        </span>
        <span class="bell-toggle__say" aria-hidden="true">
          <span ref={el => (offEl = el)} class="bell-toggle__face bell-toggle__face--off">
            {props.offLabel ?? 'Notify me'}
          </span>
          <span ref={el => (onEl = el)} class="bell-toggle__face bell-toggle__face--on">
            {props.onLabel ?? "You'll be notified"}
          </span>
        </span>
      </button>
    </span>
  );
}
