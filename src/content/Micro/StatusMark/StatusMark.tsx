import { Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue } from 'motion';
import './StatusMark.css';

export type StatusMarkStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

export interface StatusMarkProps {
  status?: StatusMarkStatus;
  progress?: number;
  label?: JSX.Element;
  color?: string;
  doneColor?: string;
  errorColor?: string;
  size?: number;
  strokeWidth?: number;
  dashes?: number;
  fontSize?: number;
  spinDuration?: number;
  arcLength?: number;
  drawDuration?: number;
  fillOpacity?: number;
  strike?: boolean;
  strikeDelay?: number;
  className?: string;
  style?: JSX.CSSProperties;
}

const UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const MORPH = { duration: 0.3, ease: [0.77, 0, 0.175, 1] as [number, number, number, number] };
const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';
const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';
const TEXT: Record<StatusMarkStatus, string> = {
  pending: 'Pending',
  running: 'In progress',
  done: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};
const IDLE_DASH = 0.3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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

type Motion = {
  status: StatusMarkStatus;
  determinate: boolean;
  indeterminate: boolean;
  solid: boolean;
  targetArc: number;
  reduce: boolean;
  C: number;
  P: number;
  spinDuration: number;
};

export default function StatusMark(props: StatusMarkProps) {
  const reduce = useReducedMotion();

  const geometry = createMemo(() => {
    const strokeWidth = props.strokeWidth ?? 2;
    const r = 10 - strokeWidth / 2;
    const C = 2 * Math.PI * r;
    const P = C / Math.max(1, props.dashes ?? 8);
    return { r, C, P };
  });

  const state = createMemo(() => {
    const status = props.status ?? 'pending';
    const progress = props.progress;
    const determinate = status === 'running' && typeof progress === 'number' && Number.isFinite(progress);
    const indeterminate = status === 'running' && !determinate;
    const solid = status === 'running' || status === 'done' || status === 'failed';
    const targetArc = indeterminate ? (props.arcLength ?? 0.68) : determinate ? clamp01(progress as number) : 1;
    return { status, progress, determinate, indeterminate, solid, targetArc };
  });

  const initial = untrack(state);
  const mode = motionValue(initial.solid ? 1 : 0);
  const arc = motionValue(initial.targetArc);
  const travel = motionValue(0);
  let ringEl: SVGCircleElement | undefined;
  let geo = untrack(geometry);
  let gen = 0;
  let last: Motion | null = null;

  const writeDash = () => {
    const g = geo;
    const m = mode.get();
    const a = arc.get();
    const dash = IDLE_DASH * g.P + (a * g.C - IDLE_DASH * g.P) * m;
    const gap = (1 - IDLE_DASH) * g.P + ((1 - a) * g.C - (1 - IDLE_DASH) * g.P) * m;
    ringEl?.setAttribute('stroke-dasharray', `${Math.max(0, dash)} ${Math.max(0, gap)}`);
  };

  createEffect(geometry, value => {
    geo = value;
    writeDash();
    ringEl?.setAttribute('stroke-dashoffset', String(travel.get()));
  });

  createEffect(
    (): Motion => {
      const s = state();
      const g = geometry();
      return {
        status: s.status,
        determinate: s.determinate,
        indeterminate: s.indeterminate,
        solid: s.solid,
        targetArc: s.targetArc,
        reduce: reduce(),
        C: g.C,
        P: g.P,
        spinDuration: props.spinDuration ?? 1100
      };
    },
    value => {
      const prev = last;
      last = value;
      if (
        prev &&
        prev.status === value.status &&
        prev.determinate === value.determinate &&
        prev.targetArc === value.targetArc &&
        prev.reduce === value.reduce &&
        prev.C === value.C &&
        prev.P === value.P &&
        prev.spinDuration === value.spinDuration
      )
        return;
      const g = ++gen;
      if (value.reduce) {
        mode.jump(value.solid ? 1 : 0);
        arc.jump(value.targetArc);
        travel.jump(0);
        return;
      }
      if (mode.get() === 0) arc.jump(value.targetArc);
      animate(mode, value.solid ? 1 : 0, MORPH);
      animate(arc, value.targetArc, UI);
      if (value.indeterminate) {
        const t0 = travel.get();
        animate(travel, [t0, t0 - value.C], {
          duration: value.spinDuration / 1000,
          ease: 'linear',
          repeat: Infinity
        });
        return;
      }
      const unit = value.determinate ? value.C : value.P;
      const to = Math.floor(travel.get() / unit) * unit;
      animate(travel, to, UI).then(() => {
        if (gen === g) travel.jump(0);
      });
    }
  );

  onSettled(() => {
    writeDash();
    ringEl?.setAttribute('stroke-dashoffset', String(travel.get()));
    const offs = [
      mode.on('change', writeDash),
      arc.on('change', writeDash),
      travel.on('change', (v: number) => ringEl?.setAttribute('stroke-dashoffset', String(v)))
    ];
    return () => {
      offs.forEach(off => off());
      mode.stop();
      arc.stop();
      travel.stop();
      mode.destroy();
      arc.destroy();
      travel.destroy();
    };
  });

  const spoken = createMemo(() => {
    const s = state();
    return TEXT[s.status] + (s.determinate ? `, ${Math.round(clamp01(s.progress as number) * 100)}%` : '');
  });
  const hasLabel = createMemo(() => props.label !== undefined && props.label !== null);

  const rootStyle = createMemo(
    () =>
      ({
        '--sm-size': `${props.size ?? 20}px`,
        '--sm-stroke': props.strokeWidth ?? 2,
        '--sm-color': props.color ?? 'currentColor',
        '--sm-done': props.doneColor ?? '#22c55e',
        '--sm-error': props.errorColor ?? '#ef4444',
        '--sm-fill': props.fillOpacity ?? 0.06,
        '--sm-font': `${props.fontSize ?? 14}px`,
        '--sm-draw': `${props.drawDuration ?? 240}ms`,
        '--sm-strike-delay': `${120 + (props.strikeDelay ?? 60)}ms`,
        ...props.style
      }) as JSX.CSSProperties
  );

  return (
    <span
      class={['status-mark', props.className]}
      data-status={state().status}
      data-indeterminate={state().indeterminate ? '' : undefined}
      data-strike={(props.strike ?? true) ? '' : undefined}
      style={rootStyle()}
    >
      <svg
        class="status-mark__glyph"
        viewBox="0 0 24 24"
        width={props.size ?? 20}
        height={props.size ?? 20}
        role={hasLabel() ? undefined : 'img'}
        aria-label={hasLabel() ? undefined : spoken()}
        aria-hidden={hasLabel() ? 'true' : undefined}
      >
        <circle class="status-mark__track" cx="12" cy="12" r={geometry().r} transform="rotate(-90 12 12)" />
        <circle
          ref={el => (ringEl = el)}
          class="status-mark__ring"
          cx="12"
          cy="12"
          r={geometry().r}
          transform="rotate(-90 12 12)"
        />
        <path class="status-mark__check" d={CHECK} pathLength="1" />
        <path class="status-mark__cross" d={CROSS} pathLength="1" />
      </svg>
      <Show when={hasLabel()}>
        <span class="status-mark__sr">{spoken()}: </span>
        <span class="status-mark__label">
          {props.label}
          <span class="status-mark__strike" aria-hidden="true" />
        </span>
      </Show>
    </span>
  );
}
