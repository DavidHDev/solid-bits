import {
  For,
  Show,
  children as resolveChildren,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  onSettled,
  untrack,
  useContext,
  type Accessor
} from 'solid-js';
import { Portal, type JSX } from '@solidjs/web';
import {
  animate,
  cancelFrame,
  frame,
  mapValue,
  motionValue,
  springValue,
  transformValue,
  type AnimationPlaybackControls,
  type MotionValue
} from 'motion';
import './WarmTooltip.css';

export type WarmTooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type WarmTooltipSize = 'sm' | 'md' | 'lg';

export interface WarmTooltipGroupHandle {
  reset: () => void;
}

export interface WarmTooltipGroupProps {
  delay?: number;
  warmWindow?: number;
  travel?: number;
  lean?: number;
  onWarmChange?: (warm: boolean) => void;
  children?: JSX.Element;
  ref?: WarmTooltipGroupHandle | ((handle: WarmTooltipGroupHandle) => void);
}

export interface WarmTooltipProps {
  content: JSX.Element;
  shortcut?: JSX.Element;
  children: JSX.Element;
  side?: WarmTooltipSide;
  delay?: number;
  warmWindow?: number;
  surfaceColor?: string;
  inkColor?: string;
  size?: WarmTooltipSize;
  radius?: number;
  gap?: number;
  arrow?: boolean;
  popDuration?: number;
  popScale?: number;
  popBlur?: number;
  showFuse?: boolean;
  longPress?: number;
  disabled?: boolean;
  className?: string;
}

type Timer = ReturnType<typeof setTimeout> | undefined;
type Mode = 'cold' | 'warm' | 'instant';
type Phase = 'closed' | 'open' | 'closing';
type Swap = { dir: number; across: boolean };

interface Payload {
  id: string;
  trigger: HTMLElement;
  content: JSX.Element;
  shortcut?: JSX.Element;
  side: WarmTooltipSide;
  gap: number;
  arrow: boolean;
  surfaceColor: string;
  inkColor: string;
  radius: number;
  font: number;
  px: number;
  py: number;
  popDuration: number;
  popScale: number;
  popBlur: number;
  warmWindow: number;
}

interface Layer {
  key: string;
  payload: Payload;
  mode: 'initial' | 'enter' | 'leave';
  swap: Swap;
  started: boolean;
  el?: HTMLSpanElement;
  text?: HTMLSpanElement;
  anim?: AnimationPlaybackControls;
}

interface GroupApi {
  id: string;
  readonly delay: number;
  readonly warmWindow: number;
  activeId: Accessor<string | null>;
  isWarm: () => boolean;
  show: (payload: Payload, mode: Mode) => void;
  hide: (tooltipId: string, instant?: boolean) => void;
  reset: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const LEAN_SPRING = { stiffness: 260, damping: 22, mass: 0.4 };
const FULL_LEAN_SPEED = 1200;
const SIGN: Record<WarmTooltipSide, number> = { top: 1, bottom: -1, left: -1, right: 1 };
const ORIGIN: Record<WarmTooltipSide, string> = {
  top: 'center bottom',
  bottom: 'center top',
  left: 'right center',
  right: 'left center'
};
const SIZES: Record<WarmTooltipSize, { font: number; px: number; py: number }> = {
  sm: { font: 11.5, px: 8, py: 5 },
  md: { font: 12.5, px: 10, py: 6 },
  lg: { font: 13.5, px: 12, py: 7 }
};
const MARGIN = 8;
const HOLD_SLOP = 10;
const SWAP = 0.14;
const SWAP_SHIFT = 10;
const RISE = 4;
const GRACE = 80;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const horizontal = (side: WarmTooltipSide) => side === 'top' || side === 'bottom';

const anchorOf = (rect: DOMRect, side: WarmTooltipSide, gap: number): [number, number] => {
  if (side === 'top') return [rect.left + rect.width / 2, rect.top - gap];
  if (side === 'bottom') return [rect.left + rect.width / 2, rect.bottom + gap];
  if (side === 'left') return [rect.left - gap, rect.top + rect.height / 2];
  return [rect.right + gap, rect.top + rect.height / 2];
};

const layoutOf = (x: number, y: number, width: number, height: number, side: WarmTooltipSide) => {
  if (horizontal(side)) {
    const X = clamp(x - width / 2, MARGIN, Math.max(MARGIN, window.innerWidth - MARGIN - width));
    return { X, Y: side === 'top' ? y - height : y };
  }
  const Y = clamp(y - height / 2, MARGIN, Math.max(MARGIN, window.innerHeight - MARGIN - height));
  return { X: side === 'left' ? x - width : x, Y };
};

const LAYER = {
  enter: ({ dir, across }: Swap) => ({
    opacity: dir === 0 ? 1 : 0,
    x: across ? 0 : SWAP_SHIFT * dir,
    y: across ? SWAP_SHIFT * dir : 0,
    filter: dir === 0 ? 'blur(0px)' : 'blur(3px)'
  }),
  show: { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' },
  exit: ({ dir, across }: Swap) => ({
    opacity: 0,
    x: across ? 0 : -SWAP_SHIFT * dir,
    y: across ? -SWAP_SHIFT * dir : 0,
    filter: 'blur(3px)'
  })
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

function velocityOf(value: MotionValue<number>) {
  const velocity = motionValue(value.getVelocity());
  const update = () => {
    const latest = value.getVelocity();
    velocity.set(latest);
    if (latest) frame.update(update);
  };
  const off = value.on('change', () => {
    frame.update(update, false, true);
  });
  const stop = () => {
    off();
    cancelFrame(update);
    velocity.destroy();
  };
  return { velocity, stop };
}

const capture = (el: Element | undefined, pointerId: number) => {
  try {
    el?.setPointerCapture(pointerId);
  } catch {
    return;
  }
};

const GroupContext = createContext<GroupApi | null>(null);

export function WarmTooltipGroup(props: WarmTooltipGroupProps) {
  const reduce = useReducedMotion();
  const id = createUniqueId();
  const [current, setCurrent] = createSignal<Payload | null>(null);
  const [state, setState] = createSignal<Phase>('closed');
  const [layers, setLayers] = createSignal<Layer[]>([]);
  const st = {
    state: 'closed' as Phase,
    current: null as Payload | null,
    mode: 'cold' as Mode | 'move',
    instant: false,
    warmUntil: -Infinity,
    warm: false,
    swap: { dir: 0, across: false } as Swap,
    closeTimer: undefined as Timer,
    leaveTimer: undefined as Timer,
    warmTimer: undefined as Timer
  };
  let layerList: Layer[] = [];
  let reduceNow = untrack(reduce);
  let leanDeg = 0;
  let travel = 320;
  let onWarmChange: ((warm: boolean) => void) | undefined;
  let outerEl: HTMLSpanElement | undefined;
  let boxEl: HTMLSpanElement | undefined;
  let arrowEl: HTMLSpanElement | undefined;

  createEffect(
    () => ({ reduce: reduce(), lean: props.lean ?? 0, travel: props.travel ?? 320, onWarm: props.onWarmChange }),
    value => {
      reduceNow = value.reduce;
      leanDeg = value.reduce ? 0 : value.lean;
      travel = value.travel;
      onWarmChange = value.onWarm;
    }
  );

  const commitLayers = (next: Layer[]) => {
    layerList = next;
    setLayers(next);
  };

  const ax = motionValue(0);
  const ay = motionValue(0);
  const w = motionValue(0);
  const h = motionValue(0);
  const presence = motionValue(0);
  const vx = velocityOf(ax);
  const vy = velocityOf(ay);
  const speed = transformValue(() => {
    const a = vx.velocity.get();
    const b = vy.velocity.get();
    return st.current && !horizontal(st.current.side) ? b : a;
  });
  const leanTarget = mapValue(speed, [-FULL_LEAN_SPEED, 0, FULL_LEAN_SPEED], [1, 0, -1], { clamp: true });
  const leanUnit = springValue(leanTarget, LEAN_SPRING);

  const place = transformValue(() => {
    const x = ax.get();
    const y = ay.get();
    const width = w.get();
    const height = h.get();
    const side = st.current ? st.current.side : 'top';
    const { X, Y } = layoutOf(x, y, width, height, side);
    return `translate(${X}px, ${Y}px)`;
  });
  const arrowAt = transformValue(() => {
    const x = ax.get();
    const y = ay.get();
    const width = w.get();
    const height = h.get();
    const side = st.current ? st.current.side : 'top';
    const { X, Y } = layoutOf(x, y, width, height, side);
    return horizontal(side) ? clamp(x - X, 10, width - 10) : clamp(y - Y, 10, height - 10);
  });
  const pop = transformValue(() => {
    const p = presence.get();
    const l = leanUnit.get();
    const c = st.current;
    const side = c ? c.side : 'top';
    if (reduceNow || !c) return 'none';
    const scale = c.popScale + (1 - c.popScale) * p;
    const rise = (1 - p) * RISE * SIGN[side] * (side === 'left' ? -1 : 1);
    const rotate = l * leanDeg * SIGN[side];
    const tx = horizontal(side) ? 0 : rise;
    const ty = horizontal(side) ? rise : 0;
    return `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotate}deg)`;
  });
  const blur = transformValue(() => {
    const p = presence.get();
    const c = st.current;
    return reduceNow || !c ? 'none' : `blur(${c.popBlur * (1 - p)}px)`;
  });

  const paintOuter = () => {
    if (!outerEl) return;
    outerEl.style.transform = place.get();
    outerEl.style.width = `${w.get()}px`;
    outerEl.style.height = `${h.get()}px`;
  };
  const paintBox = () => {
    if (!boxEl) return;
    boxEl.style.transform = pop.get();
    boxEl.style.opacity = String(presence.get());
    boxEl.style.filter = blur.get();
  };
  const paintArrow = () => {
    if (!arrowEl) return;
    const side = st.current ? st.current.side : 'top';
    const at = `${arrowAt.get()}px`;
    if (horizontal(side)) {
      arrowEl.style.left = at;
      arrowEl.style.top = '';
    } else {
      arrowEl.style.top = at;
      arrowEl.style.left = '';
    }
  };

  const subscriptions = [
    place.on('change', paintOuter),
    w.on('change', paintOuter),
    h.on('change', paintOuter),
    pop.on('change', paintBox),
    presence.on('change', paintBox),
    blur.on('change', paintBox),
    arrowAt.on('change', paintArrow)
  ];

  const isWarm = () => st.state !== 'closed' || now() < st.warmUntil;
  const notify = () => {
    const next = isWarm();
    if (next === st.warm) return;
    st.warm = next;
    onWarmChange?.(next);
  };

  const finishClose = () => {
    st.state = 'closed';
    st.current = null;
    layerList.forEach(layer => layer.anim?.stop());
    commitLayers([]);
    setState('closed');
    setCurrent(null);
    notify();
  };

  const show = (payload: Payload, mode: Mode) => {
    clearTimeout(st.closeTimer);
    clearTimeout(st.leaveTimer);
    const prev = st.current;
    const fresh = st.state === 'closed';
    if (prev && prev.id !== payload.id) {
      const [px, py] = anchorOf(prev.trigger.getBoundingClientRect(), prev.side, prev.gap);
      const [nx, ny] = anchorOf(payload.trigger.getBoundingClientRect(), payload.side, payload.gap);
      const across = !horizontal(payload.side);
      st.swap = { dir: Math.sign(across ? ny - py : nx - px) || 1, across };
    } else {
      st.swap = { dir: 0, across: !horizontal(payload.side) };
    }
    st.mode = fresh ? mode : mode === 'instant' ? 'instant' : 'move';
    st.instant = mode === 'instant';
    st.current = payload;
    st.state = 'open';
    const swap = st.swap;
    if (fresh || layerList.length === 0) {
      commitLayers([{ key: payload.id, payload, mode: 'initial', swap, started: true }]);
    } else {
      const live = layerList.find(layer => layer.key === payload.id && layer.mode !== 'leave');
      if (live) {
        live.payload = payload;
      } else {
        const kept = layerList.filter(layer => {
          if (layer.key !== payload.id) return true;
          layer.anim?.stop();
          return false;
        });
        kept.forEach(layer => {
          if (layer.mode === 'leave') return;
          layer.mode = 'leave';
          layer.swap = swap;
          layer.started = false;
        });
        commitLayers([...kept, { key: payload.id, payload, mode: 'enter', swap, started: false }]);
      }
    }
    setCurrent(payload);
    setState('open');
    notify();
  };

  const beginClose = (instant: boolean) => {
    const c = st.current;
    if (!c || st.state !== 'open') return;
    st.state = 'closing';
    setState('closing');
    st.warmUntil = now() + c.warmWindow;
    clearTimeout(st.warmTimer);
    st.warmTimer = setTimeout(notify, c.warmWindow + 1);
    if (instant) {
      presence.jump(0);
      finishClose();
      return;
    }
    const closeMs = Math.round(c.popDuration * 0.8);
    animate(presence, 0, { duration: closeMs / 1000, ease: EASE_OUT });
    st.closeTimer = setTimeout(finishClose, closeMs);
  };

  const hide = (tooltipId: string, instant?: boolean) => {
    const c = st.current;
    if (!c || c.id !== tooltipId || st.state !== 'open') return;
    clearTimeout(st.leaveTimer);
    if (instant || st.instant) {
      beginClose(true);
      return;
    }
    st.leaveTimer = setTimeout(() => beginClose(false), GRACE);
  };

  const reset = () => {
    if (st.current) hide(st.current.id, true);
    st.warmUntil = -Infinity;
    clearTimeout(st.warmTimer);
    notify();
  };

  const group: GroupApi = {
    id,
    get delay() {
      return props.delay ?? 400;
    },
    get warmWindow() {
      return props.warmWindow ?? 300;
    },
    activeId: () => current()?.id ?? null,
    isWarm,
    show,
    hide,
    reset
  };

  createEffect(layers, list => {
    for (const layer of list) {
      if (layer.started || !layer.el) continue;
      layer.started = true;
      const el = layer.el;
      const transition = { duration: reduceNow ? 0 : SWAP, ease: EASE_OUT };
      if (layer.mode === 'enter') {
        const from = LAYER.enter(layer.swap);
        const to = LAYER.show;
        layer.anim = animate(
          el,
          {
            opacity: [from.opacity, to.opacity],
            x: [from.x, to.x],
            y: [from.y, to.y],
            filter: [from.filter, to.filter]
          },
          transition
        );
      } else if (layer.mode === 'leave') {
        const anim = animate(el, LAYER.exit(layer.swap), transition);
        layer.anim = anim;
        anim.finished.then(() => {
          if (layer.anim !== anim || !layerList.includes(layer)) return;
          commitLayers(layerList.filter(item => item !== layer));
        });
      }
    }
  });

  createEffect(
    () => ({ c: current(), s: state() }),
    ({ c: active, s }) => {
      const c = st.current;
      if (!active || !c || s !== 'open') return;
      const text = layerList.find(layer => layer.key === c.id && layer.mode !== 'leave')?.text;
      if (!text) return;
      const [tx, ty] = anchorOf(c.trigger.getBoundingClientRect(), c.side, c.gap);
      const tw = text.offsetWidth + c.px * 2;
      const th = text.offsetHeight + c.py * 2;
      const mode = st.mode;
      if (mode === 'move' && !reduceNow && travel > 0) {
        const spring = { type: 'spring' as const, duration: travel / 1000, bounce: 0.1 };
        animate(ax, tx, spring);
        animate(ay, ty, spring);
        animate(w, tw, spring);
        animate(h, th, spring);
        animate(presence, 1, { duration: 0.12, ease: EASE_OUT });
        return;
      }
      ax.jump(tx);
      ay.jump(ty);
      w.jump(tw);
      h.jump(th);
      if (mode === 'cold') {
        presence.jump(0);
        animate(presence, 1, { duration: c.popDuration / 1000, ease: EASE_OUT });
      } else {
        presence.jump(1);
      }
    }
  );

  createEffect(state, s => {
    if (s === 'closed') return undefined;
    let raf = 0;
    const follow = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const c = st.current;
        if (!c) return;
        const [tx, ty] = anchorOf(c.trigger.getBoundingClientRect(), c.side, c.gap);
        ax.jump(tx);
        ay.jump(ty);
      });
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden' && st.current) hide(st.current.id, true);
    };
    window.addEventListener('scroll', follow, { capture: true, passive: true });
    window.addEventListener('resize', follow);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', follow, { capture: true });
      window.removeEventListener('resize', follow);
      document.removeEventListener('visibilitychange', onHidden);
    };
  });

  onSettled(() => {
    const handle = { reset };
    const ref = props.ref;
    if (typeof ref === 'function') ref(handle);
  });

  onCleanup(() => {
    clearTimeout(st.closeTimer);
    clearTimeout(st.leaveTimer);
    clearTimeout(st.warmTimer);
    layerList.forEach(layer => layer.anim?.stop());
    subscriptions.forEach(off => off());
    vx.stop();
    vy.stop();
    [blur, pop, arrowAt, place, leanUnit, leanTarget, speed].forEach(value => value.destroy());
    [ax, ay, w, h, presence].forEach(value => value.stop());
  });

  const canPortal = typeof document !== 'undefined';

  return (
    <GroupContext value={group}>
      {props.children}
      <Show when={canPortal && state() !== 'closed' && current()}>
        {c => (
          <Portal>
            <span
              ref={el => {
                outerEl = el;
                paintOuter();
              }}
              id={id}
              role="tooltip"
              class="warm-tooltip"
              data-side={c().side}
              style={{
                '--wt-surface': c().surfaceColor,
                '--wt-ink': c().inkColor,
                '--wt-radius': `${c().radius}px`,
                '--wt-font': `${c().font}px`,
                '--wt-origin': ORIGIN[c().side]
              }}
            >
              <span
                ref={el => {
                  boxEl = el;
                  paintBox();
                }}
                class="warm-tooltip__box"
              >
                <For each={layers()}>
                  {layer => {
                    const view = () => {
                      const active = current();
                      return active && active.id === layer.key && layer.mode !== 'leave' ? active : layer.payload;
                    };
                    return (
                      <span
                        ref={el => {
                          layer.el = el;
                          if (layer.mode === 'enter' && !layer.started) {
                            const from = LAYER.enter(layer.swap);
                            el.style.opacity = String(from.opacity);
                            el.style.transform = `translateX(${from.x}px) translateY(${from.y}px)`;
                            el.style.filter = from.filter;
                          }
                        }}
                        class="warm-tooltip__layer"
                      >
                        <span ref={el => (layer.text = el)} class="warm-tooltip__text">
                          {view().content}
                          <Show when={view().shortcut}>
                            {shortcut => <kbd class="warm-tooltip__kbd">{shortcut()}</kbd>}
                          </Show>
                        </span>
                      </span>
                    );
                  }}
                </For>
                <Show when={c().arrow}>
                  <span
                    ref={el => {
                      arrowEl = el;
                      paintArrow();
                    }}
                    class="warm-tooltip__arrow"
                    data-side={c().side}
                    aria-hidden="true"
                  />
                </Show>
              </span>
            </span>
          </Portal>
        )}
      </Show>
    </GroupContext>
  );
}

function Trigger(props: WarmTooltipProps) {
  const group = useContext(GroupContext)!;
  const id = createUniqueId();
  let triggerEl: HTMLSpanElement | undefined;
  const [fuse, setFuse] = createSignal<'idle' | 'arming'>('idle');
  const [pressing, setPressing] = createSignal(false);
  const t = {
    open: undefined as Timer,
    press: undefined as Timer,
    press0: null as { x: number; y: number; id: number } | null,
    suppressClick: false
  };
  let disabledNow = false;
  const active = createMemo(() => group.activeId() === id);
  const resolved = resolveChildren(() => props.children);
  const coldDelay = () => props.delay ?? group.delay;

  const payload = (): Payload => {
    const preset = SIZES[props.size ?? 'md'] || SIZES.md;
    return {
      id,
      trigger: triggerEl!,
      content: props.content,
      shortcut: props.shortcut,
      side: props.side ?? 'top',
      gap: props.gap ?? 8,
      arrow: props.arrow ?? true,
      surfaceColor: props.surfaceColor ?? '#f5f5f5',
      inkColor: props.inkColor ?? '#18181b',
      radius: props.radius ?? 8,
      font: preset.font,
      px: preset.px,
      py: preset.py,
      popDuration: props.popDuration ?? 160,
      popScale: props.popScale ?? 0.94,
      popBlur: props.popBlur ?? 4,
      warmWindow: props.warmWindow ?? group.warmWindow
    };
  };

  const hide = (instant: boolean) => {
    clearTimeout(t.open);
    setFuse('idle');
    group.hide(id, instant);
  };

  const arm = () => {
    if (group.isWarm()) {
      group.show(payload(), 'warm');
      return;
    }
    setFuse('arming');
    t.open = setTimeout(() => {
      setFuse('idle');
      group.show(payload(), 'cold');
    }, coldDelay());
  };

  const cancelPress = () => {
    clearTimeout(t.press);
    if (!t.press0) return;
    t.press0 = null;
    setPressing(false);
    setFuse('idle');
  };

  createEffect(
    () => props.disabled ?? false,
    disabled => {
      disabledNow = disabled;
      if (disabled) {
        cancelPress();
        hide(true);
      }
    }
  );

  createEffect(active, isActive => {
    if (!isActive) return undefined;
    const onOutside = (e: PointerEvent) => {
      if (triggerEl && !triggerEl.contains(e.target as Node)) hide(false);
    };
    document.addEventListener('pointerdown', onOutside, true);
    return () => document.removeEventListener('pointerdown', onOutside, true);
  });

  let described: string | null = null;
  let describedEl: Element | null = null;
  createEffect(
    () => ({ el: resolved.toArray()[0], isActive: active() }),
    ({ el, isActive }) => {
      if (!(el instanceof Element)) return;
      if (el !== describedEl) {
        describedEl = el;
        described = el.getAttribute('aria-describedby');
      }
      if (isActive) el.setAttribute('aria-describedby', group.id);
      else if (described !== null) el.setAttribute('aria-describedby', described);
      else el.removeAttribute('aria-describedby');
    }
  );

  onSettled(() => {
    const el = triggerEl;
    if (!el) return;
    const onClickCapture = (e: MouseEvent) => {
      if (disabledNow || !t.suppressClick) return;
      t.suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('click', onClickCapture, true);
    return () => el.removeEventListener('click', onClickCapture, true);
  });

  onCleanup(() => {
    clearTimeout(t.open);
    clearTimeout(t.press);
  });

  const onPointerEnter = (e: PointerEvent) => {
    if (disabledNow) return;
    if (e.pointerType !== 'touch' && e.buttons === 0) arm();
  };
  const onPointerLeave = (e: PointerEvent) => {
    if (disabledNow) return;
    if (e.pointerType !== 'touch') hide(false);
  };
  const onPointerDown = (e: PointerEvent) => {
    if (disabledNow) return;
    if (e.pointerType === 'mouse') {
      hide(false);
      return;
    }
    capture(triggerEl, e.pointerId);
    t.press0 = { x: e.clientX, y: e.clientY, id: e.pointerId };
    setPressing(true);
    setFuse('arming');
    t.press = setTimeout(() => {
      t.suppressClick = true;
      t.press0 = null;
      setPressing(false);
      setFuse('idle');
      group.show(payload(), 'cold');
    }, props.longPress ?? 500);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (disabledNow) return;
    const p = t.press0;
    if (p && p.id === e.pointerId && Math.hypot(e.clientX - p.x, e.clientY - p.y) > HOLD_SLOP) cancelPress();
  };
  const onPointerEnd = () => {
    if (disabledNow) return;
    cancelPress();
  };
  const onContextMenu = (e: MouseEvent) => {
    if (disabledNow) return;
    if (t.press0) e.preventDefault();
  };
  const onFocusIn = (e: FocusEvent) => {
    if (disabledNow) return;
    const target = e.target as Element | null;
    if (target?.matches?.(':focus-visible')) group.show(payload(), 'instant');
  };
  const onFocusOut = () => {
    if (disabledNow) return;
    hide(true);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (disabledNow) return;
    if (e.key === 'Escape') hide(true);
  };

  return (
    <span
      ref={el => (triggerEl = el)}
      class={['warm-tooltip__trigger', props.className]}
      data-pressing={pressing() ? '' : undefined}
      style={{
        '--wt-surface': props.surfaceColor ?? '#f5f5f5',
        '--wt-fuse-ms': `${pressing() ? (props.longPress ?? 500) : coldDelay()}ms`
      }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={onContextMenu}
      onFocusIn={onFocusIn}
      onFocusOut={onFocusOut}
      onKeyDown={onKeyDown}
    >
      {resolved()}
      <Show when={props.showFuse ?? false}>
        <span class="warm-tooltip__fuse" data-side={props.side ?? 'top'} data-fuse={fuse()} aria-hidden="true" />
      </Show>
    </span>
  );
}

export default function WarmTooltip(props: WarmTooltipProps) {
  const context = useContext(GroupContext);
  return (
    <Show
      when={context}
      fallback={
        <WarmTooltipGroup delay={props.delay} warmWindow={props.warmWindow}>
          <Trigger {...props} />
        </WarmTooltipGroup>
      }
    >
      <Trigger {...props} />
    </Show>
  );
}
