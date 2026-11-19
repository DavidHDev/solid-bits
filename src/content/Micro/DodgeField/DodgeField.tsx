import { For, Show, createEffect, createMemo, createSignal, onSettled, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, cancelFrame, frame as frameloop, motionValue } from 'motion';

import './DodgeField.css';

export type DodgeAxis = 'both' | 'x' | 'y';
export type DodgeWall = 'clamp' | 'bounce';
export type DodgeFieldState = { dodges: number; gave: boolean; caught: boolean; fleeing: boolean };

export interface DodgeFieldProps {
  children?: JSX.Element | ((state: DodgeFieldState) => JSX.Element);
  taunts?: string[];
  notice?: string;
  inkColor?: string;
  contrastColor?: string;
  fieldHeight?: number;
  reach?: number;
  radius?: number;
  falloff?: number;
  fleeDuration?: number;
  returnDuration?: number;
  returnBounce?: number;
  axis?: DodgeAxis;
  wall?: DodgeWall;
  patience?: number;
  disabled?: boolean;
  onDodge?: (count: number) => void;
  onRelent?: () => void;
  onCatch?: () => void;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Live {
  reach: number;
  radius: number;
  falloff: number;
  fleeDuration: number;
  returnDuration: number;
  returnBounce: number;
  axis: DodgeAxis;
  wall: DodgeWall;
  still: boolean;
  inside: boolean;
  reduce: boolean;
}

interface Callbacks {
  onDodge?: (count: number) => void;
  onRelent?: () => void;
  onCatch?: () => void;
}

const COUNT_LINE = 0.55;
const DEAD_ZONE = 6;
const CAUGHT_HOLD_MS = 760;
const INSET = 12;
const DEFAULT_TAUNTS = ['Catch me', 'Nope', 'Too slow', 'Almost', 'Okay, okay'];

const wallIt = (t: number, room: number, wall: DodgeWall) => {
  if (wall === 'bounce') {
    if (t > room) return Math.max(-room, 2 * room - t);
    if (t < -room) return Math.min(room, -2 * room - t);
    return t;
  }
  return Math.min(room, Math.max(-room, t));
};
const bearingOf = (dx: number, dy: number, d: number, axis: DodgeAxis) => {
  if (axis === 'x') return { x: Math.sign(dx) || 1, y: 0 };
  if (axis === 'y') return { x: 0, y: Math.sign(dy) || 1 };
  return { x: dx / d, y: dy / d };
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

export default function DodgeField(props: DodgeFieldProps) {
  let fieldEl: HTMLDivElement | undefined;
  let moverEl: HTMLDivElement | undefined;
  const x = motionValue(0);
  const y = motionValue(0);
  const reduce = useReducedMotion();
  const [fine, setFine] = createSignal(true);
  const [inside, setInside] = createSignal(false);
  const [dodges, setDodges] = createSignal(0);
  const [caught, setCaught] = createSignal(false);
  const taunts = () => props.taunts ?? DEFAULT_TAUNTS;
  const disabled = () => props.disabled ?? false;
  const gave = () => dodges() >= Math.max(1, props.patience ?? 4);
  const still = () => gave() || caught() || disabled() || reduce();

  let pointer: { x: number; y: number } | null = null;
  let bearing = { x: 1, y: 0 };
  let armed = true;
  let room = { x: 0, y: 0 };
  let raf = 0;
  let hold: ReturnType<typeof setTimeout> | undefined;
  let callbacks: Callbacks = {};

  const live = createMemo<Live>(() => ({
    reach: props.reach ?? 72,
    radius: props.radius ?? 120,
    falloff: props.falloff ?? 2,
    fleeDuration: props.fleeDuration ?? 130,
    returnDuration: props.returnDuration ?? 620,
    returnBounce: props.returnBounce ?? 0.1,
    axis: props.axis ?? 'both',
    wall: props.wall ?? 'clamp',
    still: still(),
    inside: inside(),
    reduce: reduce()
  }));

  const paint = () => {
    if (moverEl) moverEl.style.transform = `translate(${x.get()}px, ${y.get()}px)`;
  };
  const schedule = () => {
    frameloop.render(paint);
  };

  const frame = () => {
    raf = 0;
    const field = fieldEl;
    const p = pointer;
    const L = live();
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const zoom = rect.width / (field.offsetWidth || rect.width) || 1;
    const dx = p ? (p.x - (rect.left + rect.width / 2)) / zoom : Infinity;
    const dy = p ? (p.y - (rect.top + rect.height / 2)) / zoom : Infinity;
    const d = Math.hypot(dx, dy);
    const isInside = d <= L.radius;
    if (!isInside && !L.inside) return;
    if (!L.still) {
      if (d < L.radius * COUNT_LINE) {
        if (armed) {
          armed = false;
          setDodges(n => n + 1);
        }
      } else if (d > L.radius) {
        armed = true;
      }
    }
    if (Number.isFinite(d) && d > DEAD_ZONE) bearing = bearingOf(dx, dy, d, L.axis);
    const flee = isInside && !L.still ? (1 - d / L.radius) ** L.falloff : 0;
    const tx = wallIt(-bearing.x * flee * L.reach, room.x, L.wall);
    const ty = wallIt(-bearing.y * flee * L.reach, room.y, L.wall);
    if (L.reduce) {
      x.jump(0);
      y.jump(0);
    } else {
      const cfg =
        flee > 0
          ? { type: 'spring' as const, duration: L.fleeDuration / 1000, bounce: 0 }
          : { type: 'spring' as const, duration: L.returnDuration / 1000, bounce: L.returnBounce };
      animate(x, tx, cfg);
      animate(y, ty, cfg);
    }
    if (isInside !== L.inside) setInside(isInside);
  };

  createEffect(
    () => ({ onDodge: props.onDodge, onRelent: props.onRelent, onCatch: props.onCatch }),
    value => {
      callbacks = value;
    }
  );

  onSettled(() => {
    const field = fieldEl;
    const mover = moverEl;
    if (!field || !mover) return;
    const measure = () => {
      room = {
        x: Math.max(0, (field.clientWidth - mover.offsetWidth) / 2 - INSET),
        y: Math.max(0, (field.clientHeight - mover.offsetHeight) / 2 - INSET)
      };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    observer.observe(mover);
    const offX = x.on('change', schedule);
    const offY = y.on('change', schedule);
    paint();
    return () => {
      observer.disconnect();
      offX();
      offY();
      cancelFrame(paint);
      x.stop();
      y.stop();
      clearTimeout(hold);
      cancelAnimationFrame(raf);
      raf = 0;
    };
  });

  createEffect(disabled, isDisabled => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => {
      setFine(query.matches);
    };
    sync();
    query.addEventListener('change', sync);
    if (!query.matches || isDisabled) return () => query.removeEventListener('change', sync);
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      pointer = { x: e.clientX, y: e.clientY };
      tick();
    };
    const onLeave = () => {
      pointer = null;
      tick();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', tick, { passive: true, capture: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      query.removeEventListener('change', sync);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', tick, { capture: true });
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      cancelAnimationFrame(raf);
      raf = 0;
    };
  });

  createEffect(still, () => {
    if (!raf) raf = requestAnimationFrame(frame);
  });
  createEffect(dodges, count => {
    if (count) callbacks.onDodge?.(count);
  });
  createEffect(gave, value => {
    if (value) callbacks.onRelent?.();
  });

  const handleClick = () => {
    setCaught(true);
    callbacks.onCatch?.();
    clearTimeout(hold);
    hold = setTimeout(() => {
      setCaught(false);
      setDodges(0);
      armed = false;
    }, CAUGHT_HOLD_MS);
  };

  const state: DodgeFieldState = {
    get dodges() {
      return dodges();
    },
    get gave() {
      return gave();
    },
    get caught() {
      return caught();
    },
    get fleeing() {
      return inside() && !still();
    }
  };
  const index = () => (gave() || caught() ? taunts().length - 1 : Math.min(dodges(), Math.max(0, taunts().length - 2)));

  const content = createMemo(() => {
    const children = props.children;
    if (typeof children === 'function') return children(state);
    if (children !== undefined && children !== null) return children;
    return (
      <button type="button" class="dodge-field__pill" aria-label={taunts()[0]}>
        <span class="dodge-field__labels">
          <For each={taunts()} keyed={false}>
            {(taunt, i) => (
              <span class="dodge-field__label" data-active={i === index() ? 'true' : 'false'} aria-hidden="true">
                {taunt()}
              </span>
            )}
          </For>
        </span>
      </button>
    );
  });

  return (
    <div
      ref={el => (fieldEl = el)}
      class={['dodge-field', props.className]}
      data-coarse={fine() ? undefined : ''}
      data-flat={reduce() ? '' : undefined}
      style={{
        '--df-ink': props.inkColor ?? '#f5f5f5',
        '--df-contrast': props.contrastColor ?? '#18181b',
        '--df-height': `${props.fieldHeight ?? 240}px`,
        ...props.style
      }}
    >
      <div
        ref={el => (moverEl = el)}
        class="dodge-field__mover"
        data-fled={inside() && !still() ? 'true' : 'false'}
        data-relented={gave() ? 'true' : 'false'}
        data-caught={caught() ? 'true' : 'false'}
        onClick={handleClick}
      >
        {content()}
      </div>
      <Show when={!fine() && props.notice}>
        <p class="dodge-field__notice">{props.notice}</p>
      </Show>
    </div>
  );
}
