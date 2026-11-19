import { For, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue, type MotionValue } from 'motion';

import './JellyRadio.css';

export type JellyRadioItem = string | { value: string; label: JSX.Element; icon?: JSX.Element; disabled?: boolean };

export interface JellyRadioProps {
  items?: JellyRadioItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, index: number) => void;
  chipColor?: string;
  activeColor?: string;
  textColor?: string;
  activeTextColor?: string;
  size?: 'sm' | 'md' | 'lg';
  gap?: number;
  radius?: number;
  swell?: number;
  barge?: number;
  shrink?: number;
  jelly?: number;
  bounce?: number;
  stagger?: number;
  stiffness?: number;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface ChipValues {
  x: MotionValue<number>;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}

interface Config {
  swell: number;
  barge: number;
  shrink: number;
  jelly: number;
  bounce: number;
  stagger: number;
  stiffness: number;
  reduce: boolean;
  count: number;
  layout: string;
}

interface ListItem {
  value: string;
  label: JSX.Element;
  icon?: JSX.Element;
  disabled?: boolean;
}

const DEFAULT_ITEMS: JellyRadioItem[] = ['Off', 'Low', 'Medium', 'High', 'Max'];
const SIZES: Record<string, [number, number, number]> = { sm: [28, 12, 12], md: [36, 13, 16], lg: [44, 14, 20] };

const spring = (k: number, m: number, bounce: number) => ({
  type: 'spring' as const,
  stiffness: k,
  damping: 2 * Math.sqrt(k * m) * (1 - bounce),
  mass: m
});

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

function Chip(props: {
  mv: ChipValues;
  chipRef: (el: HTMLButtonElement) => void;
  on: boolean;
  disabled: boolean;
  onClick: (e: MouseEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  children: JSX.Element;
}) {
  let el: HTMLButtonElement | undefined;
  onSettled(() => {
    const mv = props.mv;
    const write = () => {
      if (el) el.style.transform = `translateX(${mv.x.get()}px) scale(${mv.sx.get()}, ${mv.sy.get()})`;
    };
    write();
    const offs = [mv.x.on('change', write), mv.sx.on('change', write), mv.sy.on('change', write)];
    return () => offs.forEach(off => off());
  });
  return (
    <button
      ref={node => {
        el = node;
        props.chipRef(node);
      }}
      type="button"
      role="radio"
      aria-checked={props.on ? 'true' : 'false'}
      tabindex={props.on ? 0 : -1}
      disabled={props.disabled}
      class="jelly-radio__chip"
      data-on={props.on ? 'true' : 'false'}
      onClick={e => props.onClick(e)}
      onKeyDown={e => props.onKeyDown(e)}
    >
      {props.children}
    </button>
  );
}

export default function JellyRadio(props: JellyRadioProps) {
  const list = createMemo<ListItem[]>(() =>
    (props.items ?? DEFAULT_ITEMS).map(it => (typeof it === 'string' ? { value: it, label: it } : it))
  );
  const [inner, setInner] = createSignal<string | undefined>(() =>
    untrack(() => props.defaultValue ?? list()[0]?.value)
  );
  const current = createMemo(() => props.value ?? inner());
  const at = createMemo(() =>
    Math.max(
      0,
      list().findIndex(it => it.value === current())
    )
  );
  const reduce = useReducedMotion();
  let groupEl: HTMLDivElement | undefined;
  const chipRefs: (HTMLButtonElement | null)[] = [];
  let widths: number[] = [];
  const mvs: ChipValues[] = [];
  let applied = untrack(at);
  let cfg = { layout: '' } as Config;
  let mounted = false;
  let teardown: (() => void) | null = null;

  const mvFor = (i: number) => {
    let mv = mvs[i];
    if (!mv) {
      mv = { x: motionValue(0), sx: motionValue(1), sy: motionValue(1) };
      mvs[i] = mv;
    }
    return mv;
  };

  const apply = (sel: number, instant: boolean) => {
    const C = cfg;
    const group = groupEl;
    const rtl = group ? getComputedStyle(group).direction === 'rtl' : false;
    const push = ((widths[sel] ?? 0) * C.swell) / 2 + C.barge;
    for (let i = 0; i < C.count; i++) {
      const mv = mvFor(i);
      const on = i === sel;
      const far = Math.abs(i - sel);
      const dir = Math.sign(i - sel) * (rtl ? -1 : 1);
      const x = dir * push;
      const s = on ? 1 + C.swell : 1 - C.shrink;
      if (instant || C.reduce) {
        mv.x.jump(x);
        mv.sx.jump(s);
        mv.sy.jump(s);
        continue;
      }
      const k = C.stiffness * (1 - 0.12 * Math.min(far, 3));
      const inFlight = mv.x.isAnimating() || mv.sx.isAnimating() || mv.sy.isAnimating();
      const delay = inFlight ? 0 : (far * C.stagger) / 1000;
      animate(mv.x, x, { ...spring(k, 0.9, C.bounce), delay });
      const j = C.jelly;
      animate(mv.sx, s, {
        ...spring(k * (1 + 0.24 * j), 0.9 - 0.1 * j, Math.min(0.85, C.bounce + 0.3 * j)),
        delay
      });
      animate(mv.sy, s, { ...spring(k * (1 - 0.14 * j), 0.9 + 0.05 * j, C.bounce), delay: delay + 0.05 * j });
    }
  };

  const measure = () => {
    const group = groupEl;
    if (!group) return;
    const chips = chipRefs.slice(0, cfg.count);
    widths = chips.map(el => el?.offsetWidth ?? 0);
    const chipH = chips[0]?.offsetHeight ?? 0;
    const maxW = Math.max(0, ...widths);
    group.style.setProperty('--jr-pad-x', `${Math.ceil((maxW * cfg.swell * 1.3) / 2 + cfg.barge) + 2}px`);
    group.style.setProperty('--jr-pad-y', `${Math.ceil((chipH * cfg.swell) / 2) + 2}px`);
  };

  const setup = () => {
    let alive = true;
    const settle = () => {
      if (!alive) return;
      measure();
      apply(applied, true);
    };
    settle();
    const observer = new ResizeObserver(settle);
    if (groupEl) observer.observe(groupEl);
    document.fonts?.ready.then(settle);
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
      const items = list();
      const swell = props.swell ?? 0.2;
      const barge = props.barge ?? 6;
      const shrink = props.shrink ?? 0.05;
      return {
        swell,
        barge,
        shrink,
        jelly: props.jelly ?? 1,
        bounce: props.bounce ?? 0.25,
        stagger: props.stagger ?? 22,
        stiffness: props.stiffness ?? 580,
        reduce: reduce(),
        count: items.length,
        layout: [items.map(it => it.value).join('|'), props.size ?? 'md', props.gap ?? 8, swell, barge, shrink].join(
          '~'
        )
      };
    },
    value => {
      const relayout = value.layout !== cfg.layout;
      cfg = value;
      if (mounted && relayout) restart();
    }
  );

  createEffect(at, value => {
    if (applied === value) return;
    applied = value;
    apply(value, true);
  });

  onSettled(() => {
    mounted = true;
    restart();
    return () => {
      mounted = false;
      teardown?.();
      teardown = null;
      mvs.forEach(mv => {
        mv.x.destroy();
        mv.sx.destroy();
        mv.sy.destroy();
      });
    };
  });

  const commit = (i: number, instant: boolean) => {
    const items = list();
    if (props.disabled || i === at() || !items[i] || items[i].disabled) return;
    applied = i;
    apply(i, instant);
    if (props.value === undefined) setInner(items[i].value);
    props.onChange?.(items[i].value, i);
  };
  const stepFrom = (i: number, dir: number) => {
    const items = list();
    const n = items.length;
    let j = i;
    for (let tries = 0; tries < n; tries++) {
      j = (j + dir + n) % n;
      if (!items[j].disabled) return j;
    }
    return i;
  };
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = stepFrom(i, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = stepFrom(i, -1);
    else if (e.key === 'Home') next = stepFrom(-1, 1);
    else if (e.key === 'End') next = stepFrom(list().length, -1);
    else if (e.key === ' ' || e.key === 'Enter') next = i;
    if (next === null) return;
    e.preventDefault();
    commit(next, true);
    chipRefs[next]?.focus();
  };

  const groupStyle = createMemo(() => {
    const [h, font, px] = SIZES[props.size ?? 'md'] ?? SIZES.md;
    return {
      '--jr-chip': props.chipColor ?? '#27272a',
      '--jr-active': props.activeColor ?? '#f5f5f5',
      '--jr-text': props.textColor ?? '#f5f5f5',
      '--jr-active-text': props.activeTextColor ?? '#18181b',
      '--jr-gap': `${props.gap ?? 8}px`,
      '--jr-radius': `${props.radius ?? 18}px`,
      '--jr-h': `${h}px`,
      '--jr-font': `${font}px`,
      '--jr-px': `${px}px`
    } as JSX.CSSProperties;
  });

  return (
    <div
      ref={el => (groupEl = el)}
      role="radiogroup"
      aria-label={props.ariaLabel ?? 'Options'}
      data-disabled={props.disabled ? '' : undefined}
      class={['jelly-radio', props.className]}
      style={groupStyle()}
    >
      <For each={list()} keyed={false}>
        {(it, i) => (
          <Chip
            mv={mvFor(i)}
            chipRef={el => {
              chipRefs[i] = el;
            }}
            on={i === at()}
            disabled={!!props.disabled || !!it().disabled}
            onClick={e => commit(i, e.detail === 0)}
            onKeyDown={e => onKeyDown(e, i)}
          >
            <span class="jelly-radio__skin">
              {it().icon ? <span class="jelly-radio__icon">{it().icon}</span> : null}
              <span class="jelly-radio__label">{it().label}</span>
            </span>
          </Chip>
        )}
      </For>
    </div>
  );
}
