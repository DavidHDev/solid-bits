import { For, Show, createEffect, createMemo, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './LatticeLoader.css';

export type LatticeStatus = 'working' | 'done' | 'error';
export type LatticePatternName =
  'arrow' | 'dots' | 'orbit' | 'ripple' | 'snake' | 'spiral' | 'sweep' | 'spin' | 'rain' | 'pulse';
export type LatticeGrid = 3 | 4;

export interface LatticePattern {
  cells: (number | null)[];
  loop?: number;
  scale?: number;
  lit?: 0.25 | 0.35 | 0.45 | 0.62;
}

export interface LatticeLoaderProps {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  status?: LatticeStatus;
  pattern?: LatticePatternName | LatticePattern;
  grid?: LatticeGrid;
  shape?: 'square' | 'round';
  color?: string;
  doneColor?: string;
  errorColor?: string;
  cellSize?: number;
  gap?: number;
  fontSize?: number;
  step?: number;
  idleOpacity?: number;
  glow?: boolean;
  glowColor?: string;
  showTimer?: boolean;
  elapsed?: number;
  className?: string;
  style?: JSX.CSSProperties;
}

type ResolvedPattern = { cells: (number | null)[]; loop: number; scale: number; lit?: number };

const PATTERNS: Record<LatticePatternName, Partial<Record<LatticeGrid, ResolvedPattern>>> = {
  arrow: { 3: { cells: [1, 2, 3, 0, 1, 2, 1, 2, 3], loop: 7.2, scale: 1 } },
  dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
  ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
  spiral: { 3: { cells: [0, 1, 2, 7, 8, 3, 6, 5, 4], loop: 9, scale: 1.2, lit: 0.35 } },
  orbit: {
    3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 },
    4: { cells: [0, 1, 2, 3, 11, null, null, 4, 10, null, null, 5, 9, 8, 7, 6], loop: 6, scale: 1.2, lit: 0.45 }
  },
  snake: {
    3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1, lit: 0.35 },
    4: { cells: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12], loop: 16, scale: 1, lit: 0.25 }
  },
  sweep: { 4: { cells: [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6], loop: 5, scale: 1, lit: 0.45 } },
  spin: { 4: { cells: [0, 0, 1, 1, 0, 0, 1, 1, 3, 3, 2, 2, 3, 3, 2, 2], loop: 4, scale: 1.6, lit: 0.35 } },
  rain: { 4: { cells: [0, 2, 1, 3, 1, 3, 2, 4, 2, 4, 3, 5, 3, 5, 4, 6], loop: 4, scale: 1.2, lit: 0.35 } },
  pulse: { 4: { cells: [2, 1, 1, 2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 1, 1, 2], loop: 2.4, scale: 2.5, lit: 0.45 } }
};
const DEFAULT_PATTERN: Record<LatticeGrid, LatticePatternName> = { 3: 'orbit', 4: 'sweep' };
const MARKS: Record<LatticeGrid, Record<'done' | 'error', number[]>> = {
  3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] },
  4: { done: [7, 8, 10, 13], error: [0, 3, 5, 6, 9, 10, 12, 15] }
};

const resolvePattern = (pattern: LatticePatternName | LatticePattern, grid: LatticeGrid): ResolvedPattern => {
  if (typeof pattern === 'string') {
    const named = PATTERNS[pattern];
    return (named && named[grid]) || (PATTERNS[DEFAULT_PATTERN[grid]][grid] as ResolvedPattern);
  }
  const cells = Array.from({ length: grid * grid }, (_, i) => pattern.cells[i] ?? null);
  const max = Math.max(0, ...cells.filter((v): v is number => v != null));
  return { cells, loop: pattern.loop ?? max + 4.2, scale: pattern.scale ?? 1, lit: pattern.lit ?? 0.62 };
};
const fmt = (ds: number) =>
  ds < 600 ? `${(ds / 10).toFixed(1)}s` : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;
const spoken = (ds: number) =>
  ds < 600
    ? `${(ds / 10).toFixed(1)} seconds`
    : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;

export default function LatticeLoader(props: LatticeLoaderProps) {
  let timerEl: HTMLSpanElement | undefined;
  let srEl: HTMLSpanElement | undefined;
  let dsNow = 0;
  let lastMark: 'done' | 'error' = 'done';

  const status = () => props.status ?? 'working';
  const n = createMemo<LatticeGrid>(() => (props.grid === 4 ? 4 : 3));
  const pat = createMemo(() => resolvePattern(props.pattern ?? 'orbit', n()));
  const d = createMemo(() => (props.step ?? 90) * pat().scale);
  const cycle = createMemo(() => Math.round(pat().loop * d()));
  const mark = createMemo(() => {
    const s = status();
    if (s !== 'working') lastMark = s;
    return lastMark;
  });
  const markColor = () => (status() === 'error' ? (props.errorColor ?? '#ef4444') : (props.doneColor ?? '#22c55e'));

  const paint = (ds: number) => {
    dsNow = ds;
    if (timerEl) timerEl.textContent = fmt(ds);
  };

  createEffect(
    () => ({ status: status(), elapsed: props.elapsed }),
    value => {
      if (value.elapsed != null) {
        paint(Math.round(value.elapsed * 10));
        return undefined;
      }
      if (value.status !== 'working') return undefined;
      const startedAt = performance.now();
      paint(0);
      const id = setInterval(() => paint(Math.floor((performance.now() - startedAt) / 100)), 100);
      return () => clearInterval(id);
    }
  );

  createEffect(
    () => {
      const s = status();
      return untrack(() => ({
        status: s,
        label: props.label ?? 'Thinking',
        doneLabel: props.doneLabel ?? 'Done in',
        errorLabel: props.errorLabel ?? 'Failed after',
        showTimer: props.showTimer ?? true
      }));
    },
    value => {
      if (!srEl) return;
      if (value.status === 'working') srEl.textContent = `${value.label}, in progress`;
      else
        srEl.textContent = `${value.status === 'done' ? value.doneLabel : value.errorLabel}${
          value.showTimer ? ` ${spoken(dsNow)}` : ''
        }`;
    }
  );

  const rootStyle = createMemo(
    () =>
      ({
        '--ll-n': n(),
        '--ll-cell': `${props.cellSize ?? 6}px`,
        '--ll-gap': `${props.gap ?? 2}px`,
        '--ll-font': `${props.fontSize ?? 14}px`,
        '--ll-color': props.color ?? 'currentColor',
        '--ll-mark': markColor(),
        '--ll-idle': props.idleOpacity ?? 0.15,
        '--ll-glow': props.glowColor || (props.color ?? 'currentColor'),
        '--ll-mark-glow': props.glowColor || markColor(),
        '--ll-cycle': `${cycle()}ms`,
        ...props.style
      }) as JSX.CSSProperties
  );

  const lit = () => {
    const value = pat().lit;
    return value && value !== 0.62 ? Math.round(value * 100) : undefined;
  };

  return (
    <span
      role="status"
      class={['lattice-loader', props.className]}
      data-status={status()}
      data-shape={props.shape ?? 'round'}
      data-glow={props.glow ? '' : undefined}
      style={rootStyle()}
    >
      <span class="lattice-loader__grid" aria-hidden="true">
        <span class="lattice-loader__layer lattice-loader__run">
          <For each={pat().cells} keyed={false}>
            {unit => (
              <span
                class="lattice-loader__cell"
                data-hole={unit() == null ? '' : undefined}
                data-lit={lit()}
                style={unit() == null ? undefined : { 'animation-delay': `${Math.round((unit() as number) * d())}ms` }}
              />
            )}
          </For>
        </span>
        <span class="lattice-loader__layer lattice-loader__mark">
          <For each={pat().cells} keyed={false}>
            {(_, i) => <span class="lattice-loader__cell" data-on={MARKS[n()][mark()].includes(i) ? '' : undefined} />}
          </For>
        </span>
      </span>
      <span class="lattice-loader__label" aria-hidden="true">
        <span class="lattice-loader__text" data-active={status() === 'working' ? '' : undefined}>
          {props.label ?? 'Thinking'}
        </span>
        <span class="lattice-loader__text" data-active={status() === 'done' ? '' : undefined}>
          {props.doneLabel ?? 'Done in'}
        </span>
        <span class="lattice-loader__text" data-active={status() === 'error' ? '' : undefined}>
          {props.errorLabel ?? 'Failed after'}
        </span>
      </span>
      <Show when={props.showTimer ?? true}>
        <span ref={el => (timerEl = el)} class="lattice-loader__timer" aria-hidden="true">
          {fmt(dsNow)}
        </span>
      </Show>
      <span ref={el => (srEl = el)} class="lattice-loader__sr" />
    </span>
  );
}
