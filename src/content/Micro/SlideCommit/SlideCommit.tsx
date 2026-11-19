import { For, createEffect, createMemo, createSignal, onSettled, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue } from 'motion';
import { ArrowRight02Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import './SlideCommit.css';

export type SlideCommitPhase = 'idle' | 'pending' | 'done' | 'error';

export interface SlideCommitProps {
  label?: JSX.Element;
  doneLabel?: JSX.Element;
  errorLabel?: JSX.Element;
  onConfirm?: () => void | Promise<unknown>;
  onDone?: () => void;
  onError?: (reason: unknown) => void;
  trackColor?: string;
  handleColor?: string;
  successColor?: string;
  dangerColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  speed?: number;
  returnBounce?: number;
  landingDip?: number;
  holdMs?: number;
  disabled?: boolean;
  icon?: JSX.Element;
  className?: string;
}

type Sample = [number, number];
type Grip = { id: number; grab: number | null; moved: boolean; hist: Sample[] };
type MoveEvent = { pointerId: number; clientX: number; timeStamp: number };
type UpEvent = { pointerId: number };
type IconNode = readonly (readonly [string, Record<string, string | number>])[];

const PAD = 4;
const SQUASH_MAX = 0.08;
const SQUASH_DIV = 110;
const SWELL = 1.03;
const MIN_PENDING = 300;
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SHAKE = [0, -5, 5, -3, 3, -1, 0];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const onColor = (hex: string) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
};
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const [t0, x0] = hist[0];
  const [t1, x1] = hist[hist.length - 1];
  return ((x1 - x0) / Math.max(1, t1 - t0)) * 1000;
};
const attempt = (fn: () => void) => {
  try {
    fn();
  } catch {
    return;
  }
};
const finePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

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

function Icon(props: { icon: IconNode; size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
    >
      <For each={props.icon}>
        {node => (
          <path
            d={String(node[1].d)}
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={props.strokeWidth}
          />
        )}
      </For>
    </svg>
  );
}

function Spinner(props: { size: number }) {
  return (
    <svg class="slide-commit__spinner" width={props.size} height={props.size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
    </svg>
  );
}

type Config = {
  width: number;
  GRIP: number;
  INNER: number;
  TRAVEL: number;
  gripR: number;
  commitSpring: { type: 'spring'; stiffness: number; damping: number; mass: number };
  homeSpring: { type: 'spring'; stiffness: number; damping: number; mass: number };
  swell: number;
  reduce: boolean;
  labelText: string;
};

export default function SlideCommit(props: SlideCommitProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = createSignal<SlideCommitPhase>('idle');
  const [held, setHeld] = createSignal(false);
  const [hot, setHot] = createSignal(false);

  let trackEl: HTMLDivElement | undefined;
  let capsuleEl: HTMLDivElement | undefined;
  let contentEl: HTMLDivElement | undefined;
  let sayEl: HTMLSpanElement | undefined;
  let arrowEl: HTMLSpanElement | undefined;
  let spinEl: HTMLSpanElement | undefined;
  let doneEl: HTMLSpanElement | undefined;
  let grip: Grip | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let homeTimer: ReturnType<typeof setTimeout> | undefined;
  let run = 0;
  let unwatch: (() => void) | null = null;
  let lastPercent = 0;
  let phaseNow: SlideCommitPhase = 'idle';
  let doneShown: boolean | null = null;

  const geo = createMemo(() => {
    const width = props.width ?? 280;
    const height = props.height ?? 56;
    const GRIP = height - PAD * 2;
    const INNER = width - PAD * 2;
    const r = clamp(props.radius ?? 28, 0, height / 2);
    return {
      width,
      height,
      GRIP,
      INNER,
      TRAVEL: Math.max(1, INNER - GRIP),
      r,
      gripR: Math.max(0, r - PAD)
    };
  });

  const config = createMemo<Config>(() => {
    const g = geo();
    const k = 260 + (clamp(props.speed ?? 50, 0, 100) / 100) * 640;
    const mass = 0.9;
    const critical = 2 * Math.sqrt(k * mass);
    const commitSpring = { type: 'spring' as const, stiffness: k, damping: critical, mass };
    const label = props.label ?? 'Slide to pay';
    return {
      width: g.width,
      GRIP: g.GRIP,
      INNER: g.INNER,
      TRAVEL: g.TRAVEL,
      gripR: g.gripR,
      commitSpring,
      homeSpring: { ...commitSpring, damping: critical * (1 - clamp(props.returnBounce ?? 0.38, 0, 0.5)) },
      swell: hot() && !held() && phase() === 'idle' && !reduce() ? SWELL : 1,
      reduce: reduce(),
      labelText: typeof label === 'string' ? label : 'Slide to confirm'
    };
  });
  let cfg!: Config;

  const x = motionValue(0);
  const anchor = motionValue(0);
  const shown = motionValue(1);
  const spin = motionValue(0);
  const pulse = motionValue(1);
  const shake = motionValue(0);

  const paint = () => {
    const { TRAVEL, GRIP, INNER, gripR, swell } = cfg;
    const raw = x.get();
    const seen = clamp(raw, 0, TRAVEL);
    const edge = seen + GRIP + clamp(anchor.get() - seen, 0, TRAVEL);
    const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -raw) / SQUASH_DIV);
    if (trackEl) trackEl.style.transform = `translateX(${shake.get()}px) scale(${pulse.get()})`;
    if (sayEl) sayEl.style.opacity = String(clamp(1 - seen / (TRAVEL * 0.55), 0, 1));
    if (capsuleEl) {
      capsuleEl.style.clipPath = `inset(0 ${INNER - edge}px 0 0 round ${gripR}px)`;
      capsuleEl.style.transform = `scale(${q * swell}, ${swell / q})`;
      capsuleEl.style.transformOrigin = `${seen}px 50%`;
      const percent = Math.round((seen / TRAVEL) * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        capsuleEl.setAttribute('aria-valuenow', String(percent));
        capsuleEl.setAttribute('aria-valuetext', `${cfg.labelText}, ${percent}%`);
      }
    }
    if (contentEl) contentEl.style.transform = `translateX(${(seen + edge) / 2 - INNER / 2}px)`;
    if (arrowEl) arrowEl.style.opacity = String(shown.get() * clamp(1 - (seen - TRAVEL * 0.55) / (TRAVEL * 0.4), 0, 1));
    if (spinEl) spinEl.style.opacity = String(spin.get());
  };

  createEffect(config, value => {
    cfg = value;
    paint();
  });

  createEffect(
    () => ({ done: phase() === 'done', reduce: reduce() }),
    value => {
      if (!doneEl) return;
      const target = { opacity: value.done ? 1 : 0, scale: value.done || value.reduce ? 1 : 0.95 };
      const first = doneShown === null;
      doneShown = value.done;
      const controls = animate(doneEl, target, { duration: first ? 0 : 0.2, ease: EASE_OUT });
      return () => controls.stop();
    }
  );

  const local = (clientX: number) => {
    const rect = trackEl?.getBoundingClientRect();
    if (!rect) return 0;
    return (clientX - rect.left) / (rect.width / cfg.width || 1);
  };

  const goHome = (velocity: number) => {
    if (cfg.reduce) animate(x, 0, { duration: 0.2, ease: EASE_OUT });
    else animate(x, 0, { ...cfg.homeSpring, velocity: Math.min(0, velocity) });
  };

  const enter = (next: SlideCommitPhase) => {
    phaseNow = next;
    setPhase(next);
  };

  const settle = () => {
    enter('idle');
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (cfg.reduce) anchor.set(0);
    else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 });
  };

  const resolve = (viaKey: boolean) => {
    enter('done');
    anchor.set(x.get());
    animate(spin, 0, { duration: 0.12 });
    const landingDip = props.landingDip ?? 0.026;
    if (cfg.reduce) x.set(0);
    else {
      animate(x, 0, cfg.commitSpring);
      if (!viaKey && landingDip > 0) {
        animate(pulse, [1, 1 - landingDip, 1], { duration: 0.46, times: [0, 0.62, 1], ease: EASE_OUT, delay: 0.1 });
      }
    }
    props.onDone?.();
    const holdMs = props.holdMs ?? 1500;
    if (holdMs > 0) timer = setTimeout(settle, holdMs);
  };

  const reject = (reason: unknown) => {
    enter('error');
    props.onError?.(reason);
    animate(spin, 0, { duration: 0.12 });
    animate(shown, 1, { duration: 0.2, delay: 0.12 });
    if (cfg.reduce) goHome(0);
    else {
      animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT });
      homeTimer = setTimeout(() => {
        if (!grip) goHome(0);
      }, 300);
    }
    timer = setTimeout(() => enter('idle'), Math.max(props.holdMs ?? 1500, 1500));
  };

  const commit = (viaKey: boolean) => {
    clearTimeout(timer);
    const id = ++run;
    x.set(cfg.TRAVEL);
    let out: void | Promise<unknown>;
    try {
      out = props.onConfirm?.();
    } catch (reason) {
      reject(reason);
      return;
    }
    const pending = out && typeof out.then === 'function' ? out : null;
    if (!pending) {
      animate(shown, 0, { duration: 0.12 });
      resolve(viaKey);
      return;
    }
    enter('pending');
    animate(shown, 0, { duration: 0.2 });
    animate(spin, 1, { duration: 0.2 });
    const t0 = performance.now();
    const later = (fn: () => void) => {
      setTimeout(
        () => {
          if (id === run) fn();
        },
        Math.max(0, MIN_PENDING - (performance.now() - t0))
      );
    };
    pending.then(
      () => later(() => resolve(viaKey)),
      reason => later(() => reject(reason))
    );
  };

  const move = (e: MoveEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) {
      g.grab = at - x.get();
      return;
    }
    const next = clamp(at - g.grab, 0, cfg.TRAVEL);
    if (Math.abs(next - x.get()) > 0.5) g.moved = true;
    g.hist.push([e.timeStamp, next]);
    if (g.hist.length > 4) g.hist.shift();
    x.set(next);
  };

  const up = (e: UpEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    unwatch?.();
    attempt(() => trackEl?.releasePointerCapture(e.pointerId));
    setHeld(false);
    if (x.get() >= cfg.TRAVEL) commit(false);
    else if (g.moved) goHome(velocityOf(g.hist));
  };

  const down = (e: PointerEvent) => {
    if (props.disabled || grip || phaseNow === 'pending' || phaseNow === 'done' || e.button !== 0) return;
    x.stop();
    grip = { id: e.pointerId, grab: null, moved: false, hist: [] };
    setHeld(true);
    attempt(() => trackEl?.setPointerCapture(e.pointerId));
    unwatch?.();
    const onMove = (ev: PointerEvent) => ev.isTrusted && move(ev);
    const onUp = (ev: PointerEvent) => ev.isTrusted && up(ev);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    unwatch = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      unwatch = null;
    };
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (props.disabled || phaseNow === 'pending' || phaseNow === 'done') return;
    const step = cfg.TRAVEL / 10;
    if (e.key === 'End') {
      e.preventDefault();
      commit(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(cfg.TRAVEL, x.get() + step);
      x.set(next);
      if (next >= cfg.TRAVEL) commit(true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      x.set(Math.max(0, x.get() - step));
    } else if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      if (grip) up({ pointerId: grip.id });
      else x.set(0);
    }
  };

  onSettled(() => {
    cfg = config();
    const values = [x, anchor, shown, spin, pulse, shake];
    const offs = values.map(value => value.on('change', paint));
    paint();
    return () => {
      offs.forEach(off => off());
      clearTimeout(timer);
      clearTimeout(homeTimer);
      unwatch?.();
      run += 1;
      values.forEach(value => value.destroy());
    };
  });

  const rootStyle = createMemo(() => {
    const g = geo();
    const handleColor = props.handleColor ?? '#f5f5f5';
    const successColor = props.successColor ?? '#22c55e';
    const dangerColor = props.dangerColor ?? '#e5484d';
    return {
      width: `${g.width}px`,
      height: `${g.height}px`,
      '--sc-track': props.trackColor ?? '#262626',
      '--sc-ink': handleColor,
      '--sc-ok': successColor,
      '--sc-no': dangerColor,
      '--sc-on-ink': onColor(handleColor),
      '--sc-on-ok': onColor(successColor),
      '--sc-on-no': onColor(dangerColor),
      '--sc-radius': `${g.r}px`,
      '--sc-grip-r': `${g.gripR}px`,
      '--sc-pad': `${PAD}px`,
      '--sc-font': `${clamp(Math.round(g.height * 0.25), 13, 17)}px`
    } as JSX.CSSProperties;
  });

  const iconSize = () => Math.round(geo().GRIP * 0.42);

  return (
    <div
      class={['slide-commit', props.className]}
      data-phase={phase()}
      data-held={held() ? '' : undefined}
      data-disabled={props.disabled ? '' : undefined}
      style={rootStyle()}
    >
      <div ref={el => (trackEl = el)} class="slide-commit__track" onPointerDown={e => down(e)}>
        <span ref={el => (sayEl = el)} class="slide-commit__label" aria-hidden="true">
          <span class="slide-commit__text slide-commit__text--plain">{props.label ?? 'Slide to pay'}</span>
          <span class="slide-commit__text slide-commit__text--error">{props.errorLabel ?? 'Payment failed'}</span>
        </span>
        <div
          ref={el => (capsuleEl = el)}
          role="slider"
          tabindex={props.disabled ? -1 : 0}
          aria-label={config().labelText}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-busy={phase() === 'pending' ? 'true' : undefined}
          aria-disabled={props.disabled ? 'true' : undefined}
          class="slide-commit__capsule"
          onPointerEnter={e => {
            if (e.pointerType === 'mouse' && finePointer()) setHot(true);
          }}
          onPointerLeave={() => {
            setHot(false);
          }}
          onKeyDown={e => onKeyDown(e)}
        >
          <div ref={el => (contentEl = el)} class="slide-commit__content">
            <span ref={el => (arrowEl = el)} class="slide-commit__arrow" aria-hidden="true">
              {props.icon ?? <Icon icon={ArrowRight02Icon as IconNode} size={iconSize()} strokeWidth={2} />}
            </span>
            <span ref={el => (spinEl = el)} class="slide-commit__spin" aria-hidden="true">
              <Spinner size={iconSize()} />
            </span>
            <span ref={el => (doneEl = el)} class="slide-commit__done" aria-hidden="true" style={{ opacity: 0 }}>
              <Icon icon={Tick02Icon as IconNode} size={Math.round(geo().GRIP * 0.38)} strokeWidth={2.5} />
              {props.doneLabel ?? 'Paid'}
            </span>
          </div>
        </div>
        <span class="slide-commit__sr" aria-live="polite">
          {phase() === 'pending'
            ? 'Working'
            : phase() === 'done'
              ? (props.doneLabel ?? 'Paid')
              : phase() === 'error'
                ? (props.errorLabel ?? 'Payment failed')
                : ''}
        </span>
      </div>
    </div>
  );
}
