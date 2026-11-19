import { For, Show, createEffect, createMemo, createSignal, createUniqueId, onSettled, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, cancelFrame, frame, motionValue } from 'motion';
import { Delete02Icon } from '@hugeicons/core-free-icons';

import './SwipeRow.css';

const HYST = 10;
const FLICK = 110;
const DECEL = 0.998;
const VMAX = 1500;
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const DEFAULT_ACTIONS: SwipeAction[] = [{ id: 'delete', label: 'Delete' }];

export type IconSvgElement =
  | [string, { [key: string]: string | number }][]
  | readonly (readonly [string, { readonly [key: string]: string | number }])[];

export interface SwipeAction {
  id: string;
  label: string;
  icon?: JSX.Element | IconSvgElement;
  color?: string;
  dismiss?: boolean;
  onSelect?: () => void;
}

export interface SwipeRowProps {
  children?: JSX.Element;
  actions?: SwipeAction[];
  actionColor?: string;
  drawerColor?: string;
  rowColor?: string;
  textColor?: string;
  height?: number;
  radius?: number;
  actionWidth?: number;
  direction?: 'left' | 'right';
  snapBounce?: number;
  resistance?: number;
  collapseMs?: number;
  commitAt?: number;
  fullSwipe?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAction?: (action: SwipeAction) => void;
  onCommit?: (action: SwipeAction) => void;
  closeOnAction?: boolean;
  haptic?: boolean;
  label?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

type Sample = [number, number];
type Phase = 'idle' | 'committing' | 'collapsing';

interface Grip {
  id: number;
  x0: number;
  y0: number;
  grab: number | null;
  moved: boolean;
  hist: Sample[];
  touch: boolean;
}

interface Config {
  actions: SwipeAction[];
  primary: SwipeAction | undefined;
  s: number;
  A: number;
  n: number;
  D: number;
  c: number;
  snapBounce: number;
  collapseMs: number;
  commitAt: number;
  fullSwipe: boolean;
  disabled: boolean;
  closeOnAction: boolean;
  haptic: boolean;
  reduce: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rubber = (o: number, dim: number, c: number) => (o * dim * c) / (dim + c * Math.abs(o));
const unrubber = (y: number, dim: number, c: number) => (y * dim) / (c * Math.max(1, dim - Math.abs(y)));
const project = (v: number) => ((v / 1000) * DECEL) / (1 - DECEL);
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const a = hist[0];
  const b = hist[hist.length - 1];
  return ((b[1] - a[1]) / Math.max(1, b[0] - a[0])) * 1000;
};
const onColor = (hex: string) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const h = m[1].length === 3 ? [...m[1]].map(ch => ch + ch).join('') : m[1];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#111111' : '#ffffff';
};

const escapeAttr = (value: string | number) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const iconMarkup = (icon: IconSvgElement, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${escapeAttr(name === 'stroke-width' ? strokeWidth : value)}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const isIconData = (icon: unknown): icon is IconSvgElement =>
  Array.isArray(icon) && icon.length > 0 && icon.every(node => Array.isArray(node) && typeof node[0] === 'string');

function Icon(props: { icon: IconSvgElement; size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      aria-hidden="true"
      innerHTML={iconMarkup(props.icon, props.strokeWidth)}
    />
  );
}

const renderIcon = (icon: JSX.Element | IconSvgElement) =>
  isIconData(icon) ? <Icon icon={icon} size={20} strokeWidth={2} /> : (icon as JSX.Element);

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

export default function SwipeRow(props: SwipeRowProps) {
  const uid = createUniqueId();
  const reduce = useReducedMotion();
  const [openState, setOpenState] = createSignal(false);
  const [phase, setPhaseSignal] = createSignal<Phase>('idle');
  const [say, setSay] = createSignal('');
  const open = createMemo(() => props.open ?? openState());

  const cfg = createMemo<Config>(() => {
    const actions = props.actions ?? DEFAULT_ACTIONS;
    const A = props.actionWidth ?? 80;
    const n = actions.length;
    return {
      actions,
      primary: actions[0],
      s: (props.direction ?? 'left') === 'left' ? -1 : 1,
      A,
      n,
      D: n * A,
      c: clamp(props.resistance ?? 0.55, 0.05, 1),
      snapBounce: props.snapBounce ?? 0.2,
      collapseMs: props.collapseMs ?? 200,
      commitAt: props.commitAt ?? 0.6,
      fullSwipe: props.fullSwipe ?? true,
      disabled: props.disabled ?? false,
      closeOnAction: props.closeOnAction ?? true,
      haptic: props.haptic ?? true,
      reduce: reduce()
    };
  });
  const s = () => cfg().s;
  const drawerColor = () => props.drawerColor ?? '#3f3f46';
  const actionColor = () => props.actionColor ?? '#e5484d';
  const secondary = createMemo(() => cfg().actions.slice(1));

  let rootEl: HTMLDivElement | undefined;
  let surfaceEl: HTMLDivElement | undefined;
  let railEl: HTMLDivElement | undefined;
  let blockEl: HTMLDivElement | undefined;
  let glyphEl: HTMLButtonElement | undefined;
  let cur!: Config;
  let w = 360;
  let grip: Grip | null = null;
  let unwatch: (() => void) | null = null;
  let foldTimer: ReturnType<typeof setTimeout> | undefined;
  let heading: number | null = null;
  let phaseNow: Phase = 'idle';
  let disposed = false;
  let prevOpen: boolean | undefined;
  let prevD: number | undefined;

  const x = motionValue(0);
  const spread = motionValue(0);
  const landed = motionValue(0);

  const setPhase = (next: Phase) => {
    phaseNow = next;
    setPhaseSignal(next);
  };

  const exposed = () => cur.s * x.get();
  const commitPoint = () => Math.max(cur.commitAt * w, cur.D + cur.A / 2);
  const canCommit = () => cur.fullSwipe && cur.n > 0 && commitPoint() <= w;

  const paint = () => {
    if (!cur) return;
    const { s, A, D } = cur;
    const xv = x.get();
    const e = s * xv;
    const shift = spread.get() * Math.max(0, e - A);
    if (surfaceEl) surfaceEl.style.transform = `translateX(${xv}px)`;
    if (railEl) railEl.style.transform = `translateX(${-s * Math.max(0, D - e)}px)`;
    if (blockEl) blockEl.style.transform = `translateX(${s * shift}px)`;
    if (glyphEl) glyphEl.style.transform = `translateX(${-s * landed.get() * (shift - (w - A) / 2)}px)`;
  };
  const schedule = () => {
    frame.render(paint, false, true);
  };

  const map = (raw: number) => {
    const { D, c } = cur;
    const W = w;
    if (raw < 0) return rubber(raw, W, c);
    if (raw <= D) return raw;
    if (!canCommit()) return D + rubber(raw - D, W, c);
    const C = commitPoint();
    const knee = D + (C - D) / c;
    return raw <= knee ? D + c * (raw - D) : C + rubber(raw - knee, W, c);
  };
  const inv = (ex: number) => {
    const { D, c } = cur;
    const W = w;
    if (ex < 0) return unrubber(ex, W, c);
    if (ex <= D) return ex;
    if (!canCommit()) return D + unrubber(ex - D, W, c);
    const C = commitPoint();
    const knee = D + (C - D) / c;
    return ex <= C ? D + (ex - D) / c : knee + unrubber(ex - C, W, c);
  };

  const setOpen = (next: boolean) => {
    if (next === open()) return;
    setOpenState(next);
    props.onOpenChange?.(next);
  };
  const settle = (target: number, v = 0) => {
    const { s } = cur;
    heading = target;
    if (cur.reduce) {
      animate(x, s * target, { duration: 0.2, ease: EASE_OUT });
      return;
    }
    const flick = Math.abs(v) >= FLICK;
    animate(
      x,
      s * target,
      flick
        ? { type: 'spring', duration: 0.4, bounce: cur.snapBounce, velocity: s * clamp(v, -VMAX, VMAX) }
        : { ...SPRING_UI, velocity: s * v }
    );
  };
  const setSpread = (on: boolean) => {
    if ((spread.get() === 1) === on) return;
    if (cur.reduce) spread.set(on ? 1 : 0);
    else animate(spread, on ? 1 : 0, SPRING_UI);
    const primary = cur.primary;
    if (on && primary) {
      setSay(`Release to ${primary.label}`);
      if (cur.haptic && grip?.touch) navigator.vibrate?.(8);
    }
  };
  const commit = (a: SwipeAction, viaKey: boolean, v = 0) => {
    const { s, primary, collapseMs } = cur;
    const leap = a === primary;
    setPhase('committing');
    setSay(a.label);
    setOpen(false);
    const fold = () => {
      if (disposed) return;
      setPhase('collapsing');
      foldTimer = setTimeout(() => {
        props.onCommit?.(a);
        a.onSelect?.();
      }, collapseMs);
    };
    if (viaKey || cur.reduce) {
      if (leap) {
        spread.set(1);
        landed.set(1);
      }
      if (viaKey) {
        x.set(s * w);
        fold();
      } else animate(x, s * w, { duration: 0.2, ease: EASE_OUT }).then(fold);
      return;
    }
    if (leap) {
      if (spread.get() < 1) animate(spread, 1, SPRING_UI);
      animate(landed, 1, SPRING_UI);
    }
    animate(x, s * w, { ...SPRING_UI, velocity: s * v }).then(fold);
  };

  createEffect(
    () => ({ config: cfg(), open: open(), controlled: props.open !== undefined }),
    next => {
      cur = next.config;
      paint();
      const D = next.config.D;
      if (next.open === prevOpen && D === prevD) return;
      prevOpen = next.open;
      prevD = D;
      if (!next.controlled || grip || phaseNow !== 'idle') return;
      const target = next.open ? D : 0;
      if (heading === target) return;
      if (Math.abs(exposed() - target) > 0.5) settle(target);
    }
  );

  const move = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const { s } = cur;
    if (g.grab === null) {
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;
      if (Math.abs(dx) < HYST || Math.abs(dx) < Math.abs(dy)) return;
      g.grab = s * (g.x0 + Math.sign(dx) * HYST) - inv(exposed());
      g.moved = true;
      rootEl?.setAttribute('data-dragging', '');
    }
    const ex = map(s * e.clientX - g.grab);
    x.set(s * ex);
    g.hist.push([performance.now(), ex]);
    if (g.hist.length > 4) g.hist.shift();
    setSpread(canCommit() && ex >= commitPoint());
  };
  const up = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    grip = null;
    unwatch?.();
    unwatch = null;
    rootEl?.removeAttribute('data-dragging');
    try {
      surfaceEl?.releasePointerCapture(e.pointerId);
    } catch {}
    const { D, primary } = cur;
    const ex = exposed();
    const v = velocityOf(g.hist);
    if (!g.moved) {
      if (open()) {
        setOpen(false);
        settle(0);
      }
      return;
    }
    if (primary && canCommit() && ex >= commitPoint()) {
      commit(primary, false, v);
      return;
    }
    const target = Math.abs(v) >= FLICK ? (v > 0 ? D : 0) : ex + project(v) > D / 2 ? D : 0;
    setSpread(false);
    setOpen(target === D);
    settle(target, v);
  };
  const watchWindow = () => {
    const onMove = (e: PointerEvent) => {
      if (e.isTrusted) move(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.isTrusted) up(e);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  };

  const down = (e: PointerEvent) => {
    if (cur.disabled || cur.n === 0 || phaseNow !== 'idle' || grip || e.button !== 0) return;
    x.stop();
    heading = null;
    grip = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      grab: null,
      moved: false,
      hist: [],
      touch: e.pointerType === 'touch'
    };
    try {
      surfaceEl?.setPointerCapture(e.pointerId);
    } catch {}
    unwatch?.();
    unwatch = watchWindow();
  };

  const act = (a: SwipeAction, e: MouseEvent) => {
    if (phaseNow !== 'idle') return;
    props.onAction?.(a);
    if (a === cur.primary || a.dismiss) {
      commit(a, e.detail === 0);
      return;
    }
    a.onSelect?.();
    if (!cur.closeOnAction) return;
    setOpen(false);
    if (e.detail === 0) {
      heading = 0;
      x.set(0);
    } else settle(0);
  };
  const openNow = () => {
    const { s, D, n } = cur;
    heading = D;
    x.set(s * D);
    setOpen(true);
    setSay(`${n} actions revealed`);
  };
  const closeNow = () => {
    heading = 0;
    x.set(0);
    setOpen(false);
  };
  const onToggleKey = (e: KeyboardEvent) => {
    const { s, n, primary, disabled } = cur;
    if (disabled || phaseNow !== 'idle' || n === 0) return;
    const isOpen = open();
    const openKey = s < 0 ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = s < 0 ? 'ArrowRight' : 'ArrowLeft';
    const toggle = e.key === 'Enter' || e.key === ' ';
    if (e.key === openKey || (toggle && !isOpen)) {
      e.preventDefault();
      openNow();
    } else if (e.key === closeKey || e.key === 'Escape' || (toggle && isOpen)) {
      e.preventDefault();
      closeNow();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && isOpen && primary && canCommit()) {
      e.preventDefault();
      commit(primary, true);
    }
  };
  const onToggleClick = (e: MouseEvent) => {
    if (e.detail !== 0 || cur.disabled || phaseNow !== 'idle' || cur.n === 0) return;
    if (open()) closeNow();
    else openNow();
  };

  onSettled(() => {
    const el = rootEl;
    const offX = x.on('change', schedule);
    const offSpread = spread.on('change', schedule);
    const offLanded = landed.on('change', schedule);
    let observer: ResizeObserver | undefined;
    if (el) {
      w = el.offsetWidth || w;
      observer = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width;
        if (width) w = width;
      });
      observer.observe(el);
    }
    paint();
    return () => {
      disposed = true;
      observer?.disconnect();
      clearTimeout(foldTimer);
      unwatch?.();
      unwatch = null;
      offX();
      offSpread();
      offLanded();
      cancelFrame(paint);
      x.destroy();
      spread.destroy();
      landed.destroy();
    };
  });

  const railId = `${uid}-rail`;
  return (
    <div
      ref={el => (rootEl = el)}
      role="group"
      aria-label={props.label ?? 'List item'}
      class={['swipe-row', props.className]}
      data-direction={props.direction ?? 'left'}
      data-open={open() ? '' : undefined}
      data-phase={phase()}
      data-disabled={props.disabled ? '' : undefined}
      style={
        {
          '--sr-h': `${props.height ?? 64}px`,
          '--sr-r': `${props.radius ?? 16}px`,
          '--sr-a': `${cfg().A}px`,
          '--sr-row': props.rowColor ?? '#27272a',
          '--sr-text': props.textColor ?? '#f5f5f5',
          '--sr-drawer': drawerColor(),
          '--sr-on-drawer': onColor(drawerColor()),
          '--sr-action': actionColor(),
          '--sr-on-action': onColor(actionColor()),
          '--sr-collapse': `${cfg().collapseMs}ms`,
          ...props.style
        } as JSX.CSSProperties
      }
    >
      <div class="swipe-row__clip">
        <div
          ref={el => (railEl = el)}
          id={railId}
          class="swipe-row__rail"
          inert={!open() || undefined}
          aria-hidden={open() ? 'false' : 'true'}
        >
          <For each={secondary()} keyed={false}>
            {(a, i) => {
              const fill = () => a().color ?? drawerColor();
              return (
                <button
                  type="button"
                  class="swipe-row__action"
                  onClick={e => act(a(), e)}
                  style={
                    s() < 0
                      ? { right: `${(i + 1) * cfg().A}px`, background: fill(), color: onColor(fill()) }
                      : { left: `${(i + 1) * cfg().A}px`, background: fill(), color: onColor(fill()) }
                  }
                >
                  <span class="swipe-row__glyph">
                    <Show when={a().icon}>
                      <span class="swipe-row__icon">{renderIcon(a().icon)}</span>
                    </Show>
                    <span>{a().label}</span>
                  </span>
                </button>
              );
            }}
          </For>
          <Show when={cfg().primary} keyed>
            {primary => (
              <div ref={el => (blockEl = el)} class="swipe-row__block">
                <button
                  ref={el => (glyphEl = el)}
                  type="button"
                  class="swipe-row__action swipe-row__action--commit"
                  onClick={e => act(primary, e)}
                >
                  <span class="swipe-row__glyph">
                    <span class="swipe-row__icon">
                      {primary.icon ? renderIcon(primary.icon) : <Icon icon={Delete02Icon} size={20} strokeWidth={2} />}
                    </span>
                    <span>{primary.label}</span>
                  </span>
                </button>
              </div>
            )}
          </Show>
        </div>
        <div ref={el => (surfaceEl = el)} class="swipe-row__surface" onPointerDown={down}>
          {props.children}
          <button
            type="button"
            class="swipe-row__toggle"
            tabindex={props.disabled ? -1 : 0}
            aria-expanded={open() ? 'true' : 'false'}
            aria-controls={railId}
            aria-keyshortcuts={s() < 0 ? 'ArrowLeft' : 'ArrowRight'}
            onKeyDown={onToggleKey}
            onClick={onToggleClick}
          >
            {cfg().n} {cfg().n === 1 ? 'action' : 'actions'}
          </button>
        </div>
      </div>
      <span class="swipe-row__sr" aria-live="polite">
        {say()}
      </span>
    </div>
  );
}
