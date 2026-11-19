import { For, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue, type MotionValue } from 'motion';

import './RubberSegment.css';

export type RubberSegmentSize = 'sm' | 'md' | 'lg';
export type RubberSegmentItem = string | { value: string; label: JSX.Element; icon?: JSX.Element };

export interface RubberSegmentProps {
  items: RubberSegmentItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  trackColor?: string;
  thumbColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: RubberSegmentSize;
  radius?: number;
  inset?: number;
  equalSlots?: boolean;
  stretch?: number;
  squash?: number;
  speed?: number;
  glide?: number;
  draggable?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

type ListItem = { value: string; label: JSX.Element; icon?: JSX.Element };
type Slot = { l: number; r: number };
type Sample = [number, number];
type Drag = {
  id: number;
  x0: number;
  slot: number;
  onThumb: boolean;
  live: boolean;
  offset: number;
  w: number;
  hist: Sample[];
};
type Config = {
  inset: number;
  thumbRadius: number;
  stretch: number;
  squash: number;
  speed: number;
  glide: number;
  draggable: boolean;
  disabled: boolean;
  reduce: boolean;
  layout: string;
};

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const SPRING_MOMENTUM = { type: 'spring' as const, duration: 0.4, bounce: 0.2 };
const SPRING_RELAX = { type: 'spring' as const, duration: 0.16, bounce: 0 };
const DILATE = 0.19;
const HANDOFF = 0.15;
const FLICK = 110;
const MAX_VELOCITY = 2000;
const DEADZONE = 4;
const SLOP = 10;
const RUBBER = 0.55;
const SIZES: Record<RubberSegmentSize, { height: number; font: number; pad: number; min: number }> = {
  sm: { height: 28, font: 12, pad: 10, min: 36 },
  md: { height: 36, font: 13, pad: 14, min: 44 },
  lg: { height: 44, font: 14, pad: 18, min: 48 }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const rubber = (over: number, dim: number) => (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over));
const project = (v: number, glide: number) => {
  const d = 1 - 0.1 * Math.pow(0.05, glide / 100);
  return ((v / 1000) * d) / (1 - d);
};
const velocityOf = (hist: Sample[], now: number) => {
  const recent = hist.filter(([t]) => now - t <= 100);
  if (recent.length < 2) return 0;
  const [t0, x0] = recent[0];
  const [t1, x1] = recent[recent.length - 1];
  return t1 - t0 >= 8 ? ((x1 - x0) / (t1 - t0)) * 1000 : 0;
};
const nearestSlot = (slots: Slot[], x: number) => {
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    if (Math.abs((slots[i].l + slots[i].r) / 2 - x) < Math.abs((slots[best].l + slots[best].r) / 2 - x)) best = i;
  }
  return best;
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

export default function RubberSegment(props: RubberSegmentProps) {
  const list = createMemo<ListItem[]>(() =>
    props.items.map(item => (typeof item === 'string' ? { value: item, label: item } : item))
  );
  const [inner, setInner] = createSignal<string | undefined>(() =>
    untrack(() => props.defaultValue ?? list()[0]?.value)
  );
  const current = createMemo(() => (props.value !== undefined ? props.value : inner()));
  const index = createMemo(() =>
    Math.max(
      0,
      list().findIndex(item => item.value === current())
    )
  );
  const reduce = useReducedMotion();

  let trackEl: HTMLDivElement | undefined;
  let thumbEl: HTMLDivElement | undefined;
  const itemRefs: (HTMLButtonElement | null)[] = [];
  let slots: Slot[] = [];
  let box: DOMRect | null = null;
  let committed = untrack(index);
  let handoff: ReturnType<typeof setTimeout> | undefined;
  let drag: Drag | null = null;
  let gen = 0;
  let mounted = false;
  let teardown: (() => void) | null = null;
  let C = { layout: '' } as Config;

  const edgeL = motionValue(0);
  const edgeR = motionValue(0);
  const innerW = motionValue(0);

  const writeClip = () => {
    if (!thumbEl) return;
    thumbEl.style.clipPath = `inset(0 ${Math.max(0, innerW.get() - edgeR.get())}px 0 ${Math.max(0, edgeL.get())}px round ${C.thumbRadius}px)`;
  };

  const t = (seconds: number) => seconds / C.speed;

  const jumpTo = (i: number) => {
    const s = slots[i];
    if (!s) return;
    clearTimeout(handoff);
    gen += 1;
    edgeL.jump(s.l);
    edgeR.jump(s.r);
  };

  const measure = () => {
    const track = trackEl;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    box = rect;
    slots = untrack(list).map((_, i) => {
      const el = itemRefs[i];
      if (!el) return { l: 0, r: 0 };
      const r = el.getBoundingClientRect();
      return { l: r.left - rect.left - C.inset, r: r.right - rect.left - C.inset };
    });
    innerW.set(rect.width - C.inset * 2);
    jumpTo(committed);
  };

  const setup = () => {
    let alive = true;
    const run = () => {
      if (alive) measure();
    };
    run();
    const observer = new ResizeObserver(run);
    if (trackEl) observer.observe(trackEl);
    if (typeof document !== 'undefined' && document.fonts) document.fonts.ready.then(run);
    return () => {
      alive = false;
      observer.disconnect();
    };
  };

  const restart = () => {
    teardown?.();
    teardown = setup();
  };

  createEffect(
    () => {
      const radius = props.radius ?? 10;
      const inset = props.inset ?? 3;
      const equalSlots = props.equalSlots ?? true;
      return {
        inset,
        thumbRadius: Math.max(0, radius - inset),
        stretch: props.stretch ?? 100,
        squash: props.squash ?? 3,
        speed: props.speed ?? 1,
        glide: props.glide ?? 75,
        draggable: props.draggable ?? true,
        disabled: props.disabled ?? false,
        reduce: reduce(),
        layout: [
          list()
            .map(item => item.value)
            .join('|'),
          props.size ?? 'md',
          inset,
          equalSlots
        ].join('~')
      };
    },
    value => {
      const relayout = value.layout !== C.layout;
      C = value;
      writeClip();
      if (mounted && relayout) restart();
    }
  );

  createEffect(index, value => {
    if (!drag && committed !== value) {
      committed = value;
      jumpTo(value);
    }
  });

  onSettled(() => {
    mounted = true;
    const offs = [edgeL.on('change', writeClip), edgeR.on('change', writeClip), innerW.on('change', writeClip)];
    writeClip();
    restart();
    return () => {
      mounted = false;
      teardown?.();
      teardown = null;
      clearTimeout(handoff);
      offs.forEach(off => off());
      edgeL.stop();
      edgeR.stop();
      edgeL.destroy();
      edgeR.destroy();
      innerW.destroy();
    };
  });

  const commit = (i: number) => {
    committed = i;
    if (i === index()) return;
    const items = list();
    if (props.value === undefined) setInner(items[i].value);
    props.onChange?.(items[i].value, i);
  };

  const land = (to: number, v: number | null, flick: boolean, withSquash: boolean) => {
    const b = slots[to];
    if (!b) return;
    const g = ++gen;
    const dir = Math.sign((b.l + b.r) / 2 - (edgeL.get() + edgeR.get()) / 2) || 1;
    const [lead, leadTo, trail, trailTo] = dir > 0 ? [edgeR, b.r, edgeL, b.l] : [edgeL, b.l, edgeR, b.r];
    const velocityFor = (mv: MotionValue<number>) =>
      clamp(v === null ? mv.getVelocity() : v, -MAX_VELOCITY, MAX_VELOCITY);
    animate(lead, leadTo, {
      ...(flick ? SPRING_MOMENTUM : SPRING_UI),
      duration: t(flick ? 0.4 : 0.3),
      velocity: velocityFor(lead)
    });
    const trailVelocity = velocityFor(trail);
    if (!withSquash || C.squash <= 0) {
      animate(trail, trailTo, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity });
      return;
    }
    animate(trail, trailTo + dir * C.squash, { ...SPRING_UI, duration: t(0.3), velocity: trailVelocity }).then(() => {
      if (gen === g) animate(trail, trailTo, { ...SPRING_RELAX, duration: t(0.16) });
    });
  };

  const travel = (from: number, to: number) => {
    const a = slots[from];
    const b = slots[to];
    if (!a || !b) return;
    clearTimeout(handoff);
    gen += 1;
    if (C.reduce) {
      edgeL.jump(b.l);
      edgeR.jump(b.r);
      return;
    }
    const u = C.stretch / 100;
    const tween = { duration: t(DILATE), ease: EASE_OUT };
    animate(edgeL, b.l + (Math.min(a.l, b.l) - b.l) * u, tween);
    animate(edgeR, b.r + (Math.max(a.r, b.r) - b.r) * u, tween);
    handoff = setTimeout(() => land(to, null, false, true), t(HANDOFF) * 1000);
  };

  const localX = (e: { clientX: number }) => e.clientX - (box ? box.left : 0) - C.inset;

  const handlePointerDown = (e: PointerEvent, i: number) => {
    if (C.disabled || drag || e.button !== 0) return;
    const el = itemRefs[i];
    box = trackEl?.getBoundingClientRect() ?? null;
    try {
      el?.setPointerCapture(e.pointerId);
    } catch {}
    const x = localX(e);
    const onThumb = C.draggable && x >= edgeL.get() && x <= edgeR.get();
    drag = { id: e.pointerId, x0: x, slot: i, onThumb, live: false, offset: 0, w: 0, hist: [[e.timeStamp, x]] };
    if (onThumb) {
      clearTimeout(handoff);
      gen += 1;
      edgeL.stop();
      edgeR.stop();
    } else if (!C.reduce && el) {
      el.dataset.pressed = '';
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    const d = drag;
    if (!d || e.pointerId !== d.id || !d.onThumb) return;
    const x = localX(e);
    d.hist.push([e.timeStamp, x]);
    if (d.hist.length > 8) d.hist.shift();
    if (!d.live) {
      if (Math.abs(x - d.x0) < DEADZONE) return;
      d.live = true;
      d.offset = x - edgeL.get();
      d.w = edgeR.get() - edgeL.get();
      if (trackEl) trackEl.dataset.held = '';
    }
    const width = innerW.get();
    const l = x - d.offset;
    const maxL = width - d.w;
    if (C.reduce) {
      const c = clamp(l, 0, maxL);
      edgeL.set(c);
      edgeR.set(c + d.w);
    } else if (l < 0) {
      edgeL.set(0);
      edgeR.set(d.w - rubber(-l, d.w));
    } else if (l > maxL) {
      edgeR.set(width);
      edgeL.set(maxL + rubber(l - maxL, d.w));
    } else {
      edgeL.set(l);
      edgeR.set(l + d.w);
    }
  };

  const release = () => {
    const d = drag as Drag;
    drag = null;
    if (trackEl) delete trackEl.dataset.held;
    const el = itemRefs[d.slot];
    if (el) delete el.dataset.pressed;
    return d;
  };

  const handlePointerUp = (e: PointerEvent) => {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    release();
    const x = localX(e);
    if (!d.live) {
      if (Math.abs(x - d.x0) <= SLOP && d.slot !== committed) {
        const from = committed;
        commit(d.slot);
        travel(from, d.slot);
      }
      return;
    }
    const v = velocityOf(d.hist, e.timeStamp);
    const flick = Math.abs(v) > FLICK;
    let to = nearestSlot(slots, (edgeL.get() + edgeR.get()) / 2 + project(v, C.glide));
    if (flick && to === committed) to = clamp(to + Math.sign(v), 0, list().length - 1);
    commit(to);
    if (C.reduce) jumpTo(to);
    else land(to, v, flick, flick);
  };

  const handlePointerCancel = (e: PointerEvent) => {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    release();
    if (!d.live) return;
    if (C.reduce) jumpTo(committed);
    else land(committed, null, false, false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (C.disabled) return;
    const at = index();
    const last = list().length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = Math.min(last, at + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, at - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    if (next === at) return;
    commit(next);
    jumpTo(next);
    itemRefs[next]?.focus();
  };

  const trackStyle = createMemo(() => {
    const radius = props.radius ?? 10;
    const inset = props.inset ?? 3;
    const preset = SIZES[props.size ?? 'md'] || SIZES.md;
    return {
      '--rs-track': props.trackColor ?? '#27272a',
      '--rs-thumb': props.thumbColor ?? '#fafafa',
      '--rs-ink': props.textColor ?? '#fafafa',
      '--rs-ink-active': props.activeTextColor ?? '#18181b',
      '--rs-radius': `${radius}px`,
      '--rs-inset': `${inset}px`,
      '--rs-thumb-radius': `${Math.max(0, radius - inset)}px`,
      '--rs-h': `${preset.height}px`,
      '--rs-font': `${preset.font}px`,
      '--rs-pad': `${preset.pad}px`,
      '--rs-min': `${preset.min}px`
    } as JSX.CSSProperties;
  });

  return (
    <div
      ref={el => (trackEl = el)}
      role="radiogroup"
      aria-label={props['aria-label'] ?? 'Segmented control'}
      aria-disabled={props.disabled ? 'true' : undefined}
      data-equal={(props.equalSlots ?? true) ? '' : undefined}
      data-draggable={(props.draggable ?? true) && !props.disabled ? '' : undefined}
      class={['rubber-segment', props.className]}
      style={trackStyle()}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
    >
      <For each={list()} keyed={false}>
        {(item, i) => (
          <button
            ref={el => {
              itemRefs[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === index() ? 'true' : 'false'}
            tabindex={i === index() ? 0 : -1}
            disabled={props.disabled ?? false}
            class="rubber-segment__item"
            onPointerDown={e => handlePointerDown(e, i)}
            onKeyDown={handleKeyDown}
          >
            {item().icon}
            {item().label}
          </button>
        )}
      </For>
      <div ref={el => (thumbEl = el)} class="rubber-segment__thumb" aria-hidden="true">
        <For each={list()} keyed={false}>
          {item => (
            <span class="rubber-segment__item rubber-segment__copy">
              {item().icon}
              {item().label}
            </span>
          )}
        </For>
      </div>
    </div>
  );
}
