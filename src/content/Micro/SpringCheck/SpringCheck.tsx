import { Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue } from 'motion';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import './SpringCheck.css';

export type StrikeSide = 'left' | 'center' | 'right' | 'none';

export interface SpringCheckProps {
  label?: JSX.Element;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: string;
  fillColor?: string;
  checkColor?: string;
  boxSize?: number;
  boxRadius?: number;
  fontSize?: number;
  bounce?: number;
  strikeLag?: number;
  doneOpacity?: number;
  strike?: StrikeSide;
  ariaLabel?: string;
  className?: string;
}

const VISUAL_DURATION = 0.2;
const RULE_END = 0.84;
const SWELL = 0.35;
const TICK_PATH = String((Tick02Icon[0][1] as Record<string, unknown>).d);
const ORIGIN: Record<StrikeSide, string> = {
  left: 'left center',
  center: 'center',
  right: 'right center',
  none: 'left center'
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const zetaOf = (bounce: number) =>
  bounce <= 0 ? 1 : -Math.log(bounce) / Math.sqrt(Math.PI ** 2 + Math.log(bounce) ** 2);

const readings = (t: number, doneOpacity: number, strikeLag: number) => {
  const held = clamp01(t);
  return {
    fill: `scale(${Math.max(t, 0)})`,
    box: `scale(${1 + SWELL * Math.max(0, t - 1)})`,
    tick: 1 - held,
    word: 1 - (1 - doneOpacity) * held,
    rule: `scaleX(${clamp01((held - strikeLag) / (RULE_END - strikeLag))})`
  };
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

export default function SpringCheck(props: SpringCheckProps) {
  const controlled = () => props.checked !== undefined;
  const [inner, setInner] = createSignal(() => props.defaultChecked ?? false);
  const on = createMemo(() => (controlled() ? !!props.checked : inner()));
  const reduce = useReducedMotion();

  const t = motionValue(untrack(on) ? 1 : 0);
  let viaPointer = false;
  let instant = false;
  let onNow = untrack(on);
  let rowEl: HTMLButtonElement | undefined;
  let boxEl: HTMLSpanElement | undefined;
  let fillEl: HTMLSpanElement | undefined;
  let tickEl: SVGPathElement | undefined;
  let wordEl: HTMLSpanElement | undefined;
  let ruleEl: HTMLSpanElement | undefined;
  let cfg = { doneOpacity: 0.42, strikeLag: 0.12, disabled: false, reduce: false };

  const write = (value: number) => {
    const r = readings(value, cfg.doneOpacity, cfg.strikeLag);
    if (fillEl) fillEl.style.transform = r.fill;
    if (boxEl) boxEl.style.transform = r.box;
    if (tickEl) tickEl.style.strokeDashoffset = String(r.tick);
    if (wordEl) wordEl.style.opacity = String(r.word);
    if (ruleEl) ruleEl.style.transform = r.rule;
  };

  const view = createMemo(() => {
    const boxSize = props.boxSize ?? 28;
    const fontSize = props.fontSize ?? 18;
    const strike = props.strike ?? 'left';
    return {
      strike,
      style: {
        '--sc-ink': props.color ?? '#ffffff',
        '--sc-fill': props.fillColor ?? '#ffffff',
        '--sc-check': props.checkColor ?? '#0b0b0f',
        '--sc-box': `${boxSize}px`,
        '--sc-radius': `${props.boxRadius ?? 9}px`,
        '--sc-font': `${fontSize}px`,
        '--sc-ring': `${boxSize >= 24 ? 2 : 1.5}px`,
        '--sc-gap': `${Math.min(16, Math.max(8, Math.round(boxSize * 0.43)))}px`,
        '--sc-row': `${Math.max(44, boxSize + 16)}px`,
        '--sc-rule': `${Math.max(1.5, Math.round(fontSize / 6) / 2)}px`,
        '--sc-origin': ORIGIN[strike] || ORIGIN.left
      } as JSX.CSSProperties
    };
  });

  createEffect(
    () => ({
      doneOpacity: props.doneOpacity ?? 0.42,
      strikeLag: props.strikeLag ?? 0.12,
      disabled: props.disabled ?? false,
      reduce: reduce(),
      strike: view().strike
    }),
    value => {
      cfg = value;
      write(t.get());
    }
  );

  createEffect(
    () => ({ on: on(), reduce: reduce(), bounce: props.bounce ?? 0.2 }),
    value => {
      onNow = value.on;
      const target = value.on ? 1 : 0;
      if (value.reduce || instant) {
        instant = false;
        t.jump(target);
        return undefined;
      }
      if (t.get() === target && t.getVelocity() === 0) return undefined;
      const controls = animate(t, target, {
        type: 'spring',
        visualDuration: VISUAL_DURATION,
        bounce: 1 - zetaOf(value.bounce)
      });
      return () => controls.stop();
    }
  );

  onSettled(() => {
    write(t.get());
    const off = t.on('change', write);
    return () => {
      off();
      t.destroy();
    };
  });

  const r0 = readings(t.get(), cfg.doneOpacity, cfg.strikeLag);

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || cfg.disabled) return;
    viaPointer = true;
    if (!cfg.reduce && rowEl) rowEl.dataset.pressed = '';
  };
  const handlePointerUp = () => {
    if (rowEl) delete rowEl.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer = false;
    handlePointerUp();
  };
  const toggle = () => {
    if (cfg.disabled) return;
    instant = !viaPointer;
    viaPointer = false;
    const next = !onNow;
    if (!controlled()) setInner(next);
    props.onChange?.(next);
  };

  return (
    <button
      ref={el => (rowEl = el)}
      type="button"
      role="checkbox"
      aria-checked={on() ? 'true' : 'false'}
      aria-label={props.ariaLabel}
      disabled={props.disabled ?? false}
      class={['spring-check', props.className]}
      style={view().style}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onClick={toggle}
    >
      <span class="spring-check__press">
        <span ref={el => (boxEl = el)} class="spring-check__box" style={{ transform: r0.box }}>
          <span class="spring-check__ring" aria-hidden="true" />
          <span ref={el => (fillEl = el)} class="spring-check__fill" style={{ transform: r0.fill }} />
          <svg class="spring-check__tick" viewBox="0 0 24 24" aria-hidden="true">
            <path
              ref={el => (tickEl = el)}
              d={TICK_PATH}
              pathLength="1"
              stroke-dasharray="1"
              style={{ 'stroke-dashoffset': String(r0.tick) }}
            />
          </svg>
        </span>
      </span>
      <span class="spring-check__label">
        <span ref={el => (wordEl = el)} class="spring-check__word" style={{ opacity: String(r0.word) }}>
          {props.label ?? 'Ship the build'}
        </span>
        <Show when={view().strike !== 'none'}>
          <span
            ref={el => {
              ruleEl = el;
              el.style.transform = readings(t.get(), cfg.doneOpacity, cfg.strikeLag).rule;
            }}
            class="spring-check__rule"
            aria-hidden="true"
          />
        </Show>
      </span>
    </button>
  );
}
