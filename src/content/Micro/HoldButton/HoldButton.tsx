import { createEffect, createSignal, createUniqueId, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';

import './HoldButton.css';

export type HoldButtonSize = 'sm' | 'md' | 'lg';
export type HoldButtonDirection = 'right' | 'up';

export interface HoldButtonProps {
  children?: JSX.Element;
  doneLabel?: JSX.Element;
  icon?: JSX.Element;
  doneIcon?: JSX.Element;
  backgroundColor?: string;
  fillColor?: string;
  textColor?: string;
  fillTextColor?: string;
  size?: HoldButtonSize;
  radius?: number;
  fillDirection?: HoldButtonDirection;
  holdTime?: number;
  releaseTime?: number;
  pressScale?: number;
  wave?: boolean;
  waveAmplitude?: number;
  glow?: boolean;
  resetAfter?: number;
  disabled?: boolean;
  onHold?: () => void;
  onTap?: () => void;
  className?: string;
}

type Phase = 'idle' | 'holding' | 'done';
type Input = 'pointer' | 'key' | null;

interface Motion {
  raf: number;
  p: number;
  from: number;
  to: number;
  start: number;
}

interface Gesture {
  pointerId: number | null;
  start: number;
  rect: DOMRect | null;
}

interface ReleaseOptions {
  drifted?: boolean;
}

const TAP_MS = 250;
const HIT_PAD = 10;
const LINEAR = (t: number) => t;
const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

export default function HoldButton(props: HoldButtonProps) {
  const [phase, setPhase] = createSignal<Phase>('idle');
  const [input, setInput] = createSignal<Input>(null);
  let phaseNow: Phase = 'idle';
  let inputNow: Input = null;
  let buttonEl: HTMLButtonElement | undefined;
  const gesture: Gesture = { pointerId: null, start: 0, rect: null };
  const timers = { complete: 0, reset: 0 };
  const motion: Motion = { raf: 0, p: 0, from: 0, to: 0, start: 0 };
  const hintId = createUniqueId();

  const holdTime = () => props.holdTime ?? 2000;
  const releaseTime = () => props.releaseTime ?? 200;

  const go = (next: Phase, kind: Input = null) => {
    phaseNow = next;
    inputNow = kind;
    setPhase(next);
    setInput(kind);
  };

  const clearTimers = () => {
    clearTimeout(timers.complete);
    clearTimeout(timers.reset);
  };

  const drive = (to: number, duration: number, ease: (t: number) => number) => {
    const m = motion;
    cancelAnimationFrame(m.raf);
    m.from = m.p;
    m.to = to;
    m.start = performance.now();
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - m.start) / duration) : 1;
      m.p = m.from + (m.to - m.from) * ease(t);
      buttonEl?.style.setProperty('--hb-p', m.p.toFixed(4));
      if (t < 1) {
        m.raf = requestAnimationFrame(step);
        return;
      }
      m.raf = 0;
      if (m.to === 1) complete();
    };
    m.raf = requestAnimationFrame(step);
  };

  const complete = () => {
    if (phaseNow !== 'holding') return;
    if (performance.now() - gesture.start < holdTime() - 50) return;
    clearTimers();
    go('done', inputNow);
    props.onHold?.();
    const resetAfter = props.resetAfter ?? 1200;
    if (resetAfter > 0) {
      timers.reset = window.setTimeout(() => {
        go('idle');
        drive(0, releaseTime(), EASE_OUT);
      }, resetAfter);
    }
  };

  const begin = (kind: Input) => {
    if (props.disabled || phaseNow !== 'idle') return false;
    const button = buttonEl;
    if (!button) return false;
    gesture.start = performance.now();
    gesture.rect = button.getBoundingClientRect();
    go('holding', kind);
    drive(1, holdTime(), LINEAR);
    timers.complete = window.setTimeout(complete, holdTime() + 100);
    return true;
  };

  const release = ({ drifted = false }: ReleaseOptions = {}) => {
    if (phaseNow !== 'holding') return;
    clearTimers();
    const held = performance.now() - gesture.start;
    go('idle');
    drive(0, releaseTime(), EASE_OUT);
    if (!drifted && held < TAP_MS) props.onTap?.();
  };

  const handlePointerDown = (e: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    if (e.button !== 0 || !e.isPrimary || gesture.pointerId !== null) return;
    if (!begin('pointer')) return;
    gesture.pointerId = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const endPointer = (e: PointerEvent & { currentTarget: HTMLButtonElement }, options?: ReleaseOptions) => {
    if (e.pointerId !== gesture.pointerId) return;
    gesture.pointerId = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    release(options);
  };

  const handlePointerMove = (e: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    if (e.pointerId !== gesture.pointerId) return;
    const r = gesture.rect;
    if (!r) return;
    const out =
      e.clientX < r.left - HIT_PAD ||
      e.clientX > r.right + HIT_PAD ||
      e.clientY < r.top - HIT_PAD ||
      e.clientY > r.bottom + HIT_PAD;
    if (out) endPointer(e, { drifted: true });
  };

  const handlePointerLeave = (e: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    if (e.pointerType !== 'touch') endPointer(e, { drifted: true });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (inputNow === 'key') release({ drifted: true });
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!e.repeat) begin('key');
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (inputNow === 'key') release();
    }
  };

  onSettled(() => {
    const button = buttonEl;
    if (!button) return;
    const measure = () => {
      button.style.setProperty('--hb-w', `${button.offsetWidth}px`);
      button.style.setProperty('--hb-h', `${button.offsetHeight}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(button);
    return () => {
      ro.disconnect();
      clearTimeout(timers.complete);
      clearTimeout(timers.reset);
      cancelAnimationFrame(motion.raf);
    };
  });

  createEffect(phase, p => {
    if (p !== 'holding') return;
    const cancel = () => release({ drifted: true });
    const onVisibility = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });

  const labels = () => (
    <>
      <span class="hold-button__idle" aria-hidden={phase() === 'done' ? 'true' : 'false'}>
        {props.icon ? <span class="hold-button__icon">{props.icon}</span> : null}
        {props.children ?? 'Hold to delete'}
      </span>
      <span class="hold-button__done" aria-hidden={phase() !== 'done' ? 'true' : 'false'}>
        {props.doneIcon ? <span class="hold-button__icon">{props.doneIcon}</span> : null}
        {props.doneLabel ?? 'Deleted'}
      </span>
    </>
  );

  return (
    <button
      ref={el => (buttonEl = el)}
      type="button"
      disabled={props.disabled ?? false}
      class={['hold-button', `hold-button--${props.size ?? 'md'}`, props.className]}
      data-phase={phase()}
      data-input={input() ?? undefined}
      data-direction={props.fillDirection === 'up' ? 'up' : 'right'}
      data-glow={(props.glow ?? true) ? 'true' : undefined}
      aria-describedby={hintId}
      style={{
        '--hb-radius': `${props.radius ?? 14}px`,
        '--hb-bg': props.backgroundColor ?? '#26282b',
        '--hb-fill': props.fillColor ?? '#0aa0ef',
        '--hb-text': props.textColor ?? '#f5f5f5',
        '--hb-fill-text': props.fillTextColor ?? '#ffffff',
        '--hb-hold': `${holdTime()}ms`,
        '--hb-cycles': holdTime() / 1100,
        '--hb-release': `${releaseTime()}ms`,
        '--hb-press': props.pressScale ?? 0.97,
        '--hb-wave': `${(props.wave ?? true) ? (props.waveAmplitude ?? 6) : 0}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={e => endPointer(e)}
      onPointerCancel={e => endPointer(e, { drifted: true })}
      onLostPointerCapture={e => endPointer(e, { drifted: true })}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={e => e.preventDefault()}
    >
      <span class="hold-button__pulse" aria-hidden="true" />
      <span class="hold-button__label">{labels()}</span>
      <span class="hold-button__clip" aria-hidden="true">
        <span class="hold-button__fill">
          <span class="hold-button__label hold-button__label--fill">{labels()}</span>
        </span>
        <span class="hold-button__crest" aria-hidden="true">
          <span class="hold-button__label hold-button__label--fill">{labels()}</span>
        </span>
      </span>
      <span id={hintId} class="hold-button__sr">
        Press and hold for {Math.round(holdTime() / 100) / 10} seconds to confirm
      </span>
    </button>
  );
}
