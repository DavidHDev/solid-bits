import { Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  CommandLineIcon,
  File02Icon,
  PencilEdit01Icon,
  RefreshIcon,
  Search01Icon,
  Tick02Icon
} from '@hugeicons/core-free-icons';

import './CallChip.css';

export type CallChipStatus = 'idle' | 'running' | 'done' | 'error';
export type CallChipIcon = 'terminal' | 'file' | 'search' | 'edit';

export interface CallChipProps {
  icon?: CallChipIcon | JSX.Element;
  name?: string;
  argument?: string;
  status?: CallChipStatus;
  expectedMs?: number;
  size?: number;
  radius?: number;
  color?: string;
  surfaceColor?: string;
  progressColor?: string;
  progressOpacity?: number;
  doneColor?: string;
  errorColor?: string;
  washOpacity?: number;
  shake?: number;
  showTimer?: boolean;
  onRetry?: () => void;
  className?: string;
  style?: JSX.CSSProperties;
}

type Glyph = 'tool' | 'check' | 'retry';
type IconSvgElement = readonly (readonly [string, { readonly [key: string]: string | number }])[];
type Settings = { name: string; argument: string; shake: number; showTimer: boolean };

const HOLD_AT = 0.9;
const SHAKE = [0, -1, 1, -0.66, 0.66, -0.33, 0];
const ICONS: Record<CallChipIcon, IconSvgElement> = {
  terminal: CommandLineIcon,
  file: File02Icon,
  search: Search01Icon,
  edit: PencilEdit01Icon
};
const WORDS: Record<CallChipStatus, string> = { running: 'running', done: 'done', error: 'failed', idle: 'queued' };

const fmt = (ms: number) => (ms < 10000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`);
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const glyphOf = (s: CallChipStatus): Glyph => (s === 'done' ? 'check' : s === 'error' ? 'retry' : 'tool');

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

function Icon(props: { icon: IconSvgElement; size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      innerHTML={iconMarkup(props.icon, props.strokeWidth)}
    />
  );
}

export default function CallChip(props: CallChipProps) {
  let rootEl: HTMLSpanElement | undefined;
  let fillEl: HTMLSpanElement | undefined;
  let timerEl: HTMLSpanElement | undefined;
  let srEl: HTMLSpanElement | undefined;
  let mounted = false;
  let fraction = 0;
  let lastStatus: CallChipStatus | null = null;
  let shakeAnim: Animation | null = null;
  let stopTimer: (() => void) | undefined;
  const clock = { ms: 0 };
  let current!: Settings;

  const status = createMemo<CallChipStatus>(() => props.status ?? 'running');
  const settings = createMemo<Settings>(() => ({
    name: props.name ?? 'bash',
    argument: props.argument ?? 'npm test',
    shake: props.shake ?? 6,
    showTimer: props.showTimer ?? true
  }));
  const roll = createMemo<{ cur: Glyph; prev: Glyph | null }>(prev => {
    const g = glyphOf(status());
    if (!prev) return { cur: g, prev: null };
    return g !== prev.cur ? { cur: g, prev: prev.cur } : prev;
  });
  const [pressed, setPressed] = createSignal(false);

  const size = () => props.size ?? 34;
  const font = () => Math.max(11, Math.round(size() * 0.38));
  const iconSize = () => font() + 2;
  const glyphState = (g: Glyph) => (g === roll().cur ? 'in' : g === roll().prev ? 'out' : undefined);
  const toolIcon = () => {
    const icon = props.icon ?? 'terminal';
    return typeof icon === 'string' ? (ICONS[icon as CallChipIcon] ?? ICONS.terminal) : null;
  };

  const setFraction = (f: number, instant: boolean) => {
    const fill = fillEl;
    if (!fill) return;
    fraction = f;
    if (instant) fill.style.transition = 'none';
    fill.style.transform = `scaleX(${f})`;
    if (instant) {
      void fill.getBoundingClientRect();
      fill.style.transition = '';
    }
  };

  const apply = (s: CallChipStatus, animate: boolean, live: number) => {
    if (s === 'running') {
      shakeAnim?.cancel();
      setFraction(0, true);
      if (animate) setFraction(HOLD_AT, false);
    } else if (s === 'done') {
      setFraction(1, !animate);
    } else if (s === 'error') {
      setFraction(Math.min(1, Math.max(0, live)), true);
      const shake = current.shake;
      if (animate && shake > 0 && !reduceMotion() && rootEl) {
        shakeAnim = rootEl.animate(
          SHAKE.map(k => ({ transform: `translateX(${k * shake}px)`, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' })),
          { duration: 450, composite: 'add' }
        );
      }
    } else setFraction(0, true);
  };

  const startTimer = (s: CallChipStatus) => {
    stopTimer?.();
    stopTimer = undefined;
    const write = (ms: number) => {
      clock.ms = ms;
      if (timerEl) timerEl.textContent = fmt(ms);
    };
    if (s !== 'running') {
      if ((s === 'idle' || !clock.ms) && timerEl) timerEl.textContent = '—';
      return;
    }
    const startedAt = performance.now();
    write(0);
    if (reduceMotion()) {
      const id = setInterval(() => write(performance.now() - startedAt), 100);
      stopTimer = () => {
        clearInterval(id);
        write(performance.now() - startedAt);
      };
      return;
    }
    let raf = 0;
    const tick = () => {
      write(performance.now() - startedAt);
      raf = requestAnimationFrame(tick);
    };
    tick();
    stopTimer = () => {
      cancelAnimationFrame(raf);
      write(performance.now() - startedAt);
    };
  };

  const announce = (s: CallChipStatus) => {
    const ms = current.showTimer && clock.ms ? Math.round(clock.ms) : 0;
    const when = s === 'done' && ms ? ` in ${ms} ms` : s === 'error' && ms ? ` after ${ms} ms` : '';
    if (srEl) srEl.textContent = `${current.name} ${current.argument}, ${WORDS[s] ?? s}${when}`;
  };

  const liveFraction = () => (fillEl ? new DOMMatrix(getComputedStyle(fillEl).transform).a : fraction);

  createEffect(
    () => ({ s: status(), cfg: settings() }),
    ({ s, cfg }) => {
      current = cfg;
      if (!mounted || s === lastStatus) return;
      lastStatus = s;
      const live = liveFraction();
      if (rootEl) rootEl.dataset.status = s;
      apply(s, true, live);
      startTimer(s);
      announce(s);
    }
  );

  onSettled(() => {
    current = settings();
    const s = status();
    mounted = true;
    lastStatus = s;
    if (rootEl) {
      rootEl.dataset.status = s;
      rootEl.dataset.mounted = '';
    }
    apply(s, s === 'running', fraction);
    startTimer(s);
    announce(s);
    return () => {
      mounted = false;
      shakeAnim?.cancel();
      stopTimer?.();
      stopTimer = undefined;
    };
  });

  return (
    <span
      ref={el => (rootEl = el)}
      role="status"
      aria-busy={status() === 'running' ? 'true' : undefined}
      data-pressed={pressed() ? '' : undefined}
      class={['call-chip', props.className]}
      style={{
        '--cc-size': `${size()}px`,
        '--cc-font': `${font()}px`,
        '--cc-pad': `${Math.round(size() * 0.35)}px`,
        '--cc-gap': `${Math.round(font() * 0.55)}px`,
        '--cc-radius': `${props.radius ?? 10}px`,
        '--cc-color': props.color ?? 'currentColor',
        '--cc-surface': props.surfaceColor ?? '#27272a',
        '--cc-progress': props.progressColor ?? 'currentColor',
        '--cc-progress-pct': `${(props.progressOpacity ?? 0.08) * 100}%`,
        '--cc-done': props.doneColor ?? '#22c55e',
        '--cc-error': props.errorColor ?? '#ef4444',
        '--cc-wash-pct': `${(props.washOpacity ?? 0.14) * 100}%`,
        '--cc-expected': `${props.expectedMs ?? 2500}ms`,
        ...props.style
      }}
    >
      <span ref={el => (fillEl = el)} class="call-chip__fill" aria-hidden="true" />
      <span class="call-chip__slot" aria-hidden="true">
        <span class="call-chip__glyph" data-state={glyphState('tool')}>
          <Show when={toolIcon()} fallback={props.icon as JSX.Element}>
            {icon => <Icon icon={icon()} size={iconSize()} strokeWidth={1.8} />}
          </Show>
        </span>
        <span class="call-chip__glyph" data-state={glyphState('check')}>
          <Icon icon={Tick02Icon} size={iconSize()} strokeWidth={2.2} />
        </span>
        <span class="call-chip__glyph" data-state={glyphState('retry')}>
          <Icon icon={RefreshIcon} size={iconSize()} strokeWidth={2} />
        </span>
      </span>
      <span class="call-chip__name" aria-hidden="true">
        {settings().name}
      </span>
      <span class="call-chip__arg" aria-hidden="true">
        {settings().argument}
      </span>
      <Show when={settings().showTimer}>
        <span ref={el => (timerEl = el)} class="call-chip__timer" aria-hidden="true">
          0 ms
        </span>
      </Show>
      <Show when={status() === 'error' && props.onRetry}>
        <button
          type="button"
          class="call-chip__retry"
          aria-label={`Retry ${settings().name} ${settings().argument}`}
          onClick={() => props.onRetry?.()}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
        />
      </Show>
      <span ref={el => (srEl = el)} class="call-chip__sr" />
    </span>
  );
}
