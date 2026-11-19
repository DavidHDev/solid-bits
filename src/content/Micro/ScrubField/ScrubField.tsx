import { Show, createEffect, createMemo, createSignal, createUniqueId, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue } from 'motion';

import './ScrubField.css';

export type ScrubFieldSize = 'sm' | 'md' | 'lg';

export interface ScrubFieldProps {
  label?: string;
  suffix?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  size?: ScrubFieldSize;
  sensitivity?: number;
  rubberReach?: number;
  returnDuration?: number;
  coarseMultiplier?: number;
  fineMultiplier?: number;
  showDelta?: boolean;
  showDirty?: boolean;
  showFill?: boolean;
  accent?: string;
  chipColor?: string;
  disabled?: boolean;
  onChange?: (value: number) => void;
  onCommit?: (value: number) => void;
  className?: string;
}

interface DragState {
  id: number;
  x: number;
  raw: number;
  mult: number;
  moved: boolean;
  before: number;
  slack: number;
  left: number;
}

type Modifiers = { shiftKey: boolean; altKey: boolean };

type Settings = {
  min: number;
  max: number;
  step: number;
  sensitivity: number;
  rubberReach: number;
  returnDuration: number;
  coarseMultiplier: number;
  fineMultiplier: number;
  baseDecimals: number;
  fineDecimals: number;
};

const SPRING_UI = { type: 'spring' as const, duration: 0.3, bounce: 0 };
const LEAN = 4;
const SIZES: Record<ScrubFieldSize, { height: number; font: number; radius: number; width: number }> = {
  sm: { height: 28, font: 12, radius: 6, width: 104 },
  md: { height: 34, font: 13, radius: 8, width: 128 },
  lg: { height: 44, font: 16, radius: 10, width: 160 }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const decimalsOf = (n: number) => {
  const s = String(n);
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
};
const onColor = (hex: string) => {
  const raw = hex.replace('#', '');
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '#ffffff';
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return yiq >= 128 ? '#111111' : '#ffffff';
};
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function ScrubField(props: ScrubFieldProps) {
  const id = createUniqueId();
  const initial = untrack(() => (props.value !== undefined ? props.value : (props.defaultValue ?? 24)));
  const [value, setValue] = createSignal<number>(initial);
  const [dragging, setDragging] = createSignal(false);
  const [draft, setDraftSignal] = createSignal<string | null>(null);
  const display = motionValue(initial);
  let chipEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let ghostEl: HTMLSpanElement | undefined;
  let fillEl: HTMLSpanElement | undefined;
  let drag: DragState | null = null;
  let valueRef = initial;
  let draftRef: string | null = null;
  let typing = false;
  let moved = false;
  let esc: ((e: KeyboardEvent) => void) | null = null;
  let cur: Settings | undefined;

  const setDraft = (next: string | null) => {
    draftRef = next;
    setDraftSignal(next);
  };

  const settings = createMemo<Settings>(() => {
    const step = props.step ?? 1;
    const fineMultiplier = props.fineMultiplier ?? 0.1;
    const baseDecimals = decimalsOf(step);
    return {
      min: props.min ?? 0,
      max: props.max ?? 100,
      step,
      sensitivity: props.sensitivity ?? 2,
      rubberReach: props.rubberReach ?? 8,
      returnDuration: props.returnDuration ?? 300,
      coarseMultiplier: props.coarseMultiplier ?? 10,
      fineMultiplier,
      baseDecimals,
      fineDecimals: Math.min(6, baseDecimals + decimalsOf(fineMultiplier))
    };
  });
  const preset = createMemo(() => SIZES[props.size ?? 'md'] || SIZES.md);

  const s = () => cur ?? untrack(settings);

  const fmtWith = (v: number, base: number, fine: number) => {
    const scaled = v * 10 ** base;
    return v.toFixed(Math.abs(scaled - Math.round(scaled)) < 1e-6 ? base : fine);
  };
  const fmt = (v: number) => {
    const c = s();
    return fmtWith(v, c.baseDecimals, c.fineDecimals);
  };
  const signed = (d: number) => (d < 0 ? '−' : '+') + fmt(Math.abs(d));

  const reachOf = (c: Settings) => (c.rubberReach / 100) * Math.max(c.max - c.min, Number.EPSILON);
  const bend = (raw: number) => {
    const reach = reachOf(s());
    return reach ? Math.sign(raw) * reach * Math.log1p(Math.abs(raw) / reach) : 0;
  };
  const unbend = (over: number) => {
    const reach = reachOf(s());
    return reach ? Math.sign(over) * reach * Math.expm1(Math.abs(over) / reach) : 0;
  };
  const toShown = (raw: number) => {
    const { min, max } = s();
    const c = clamp(raw, min, max);
    return c + bend(raw - c);
  };
  const toRaw = (shown: number) => {
    const { min, max } = s();
    const c = clamp(shown, min, max);
    return c + unbend(shown - c);
  };
  const multiplierOf = (e: Modifiers) => {
    const c = s();
    return e.shiftKey ? c.coarseMultiplier : e.altKey ? c.fineMultiplier : 1;
  };

  const commit = (next: number) => {
    const { min, max, fineDecimals } = s();
    const rounded = clamp(Number(next.toFixed(fineDecimals)), min, max);
    if (rounded === valueRef) return;
    valueRef = rounded;
    setValue(rounded);
    props.onChange?.(rounded);
  };

  const paintMotion = (d: number) => {
    const c = s();
    const reach = reachOf(c);
    const lean = reducedMotion() || !reach ? 0 : clamp((d - clamp(d, c.min, c.max)) / reach, -1, 1) * LEAN;
    if (chipEl) chipEl.style.transform = `translateX(${lean}px)`;
    if (fillEl) {
      const fill = (clamp(d, c.min, c.max) - c.min) / Math.max(c.max - c.min, Number.EPSILON);
      fillEl.style.transform = `scaleX(${fill})`;
    }
  };

  const onDisplay = (d: number) => {
    if (!typing && inputEl) inputEl.value = fmt(d);
    if (chipEl) chipEl.dataset.over = d < s().min || d > s().max ? 'true' : 'false';
    paintMotion(d);
  };
  const unsubscribe = display.on('change', onDisplay);

  const adopt = (next: number) => {
    valueRef = next;
    setValue(next);
    display.jump(next);
    if (!typing && inputEl) inputEl.value = fmt(next);
  };

  let decimalsKey = '';
  createEffect(settings, next => {
    cur = next;
    const key = `${next.baseDecimals}:${next.fineDecimals}`;
    if (key !== decimalsKey) {
      decimalsKey = key;
      if (!typing && inputEl) inputEl.value = fmt(valueRef);
    }
    paintMotion(display.get());
  });

  createEffect(
    () => props.value,
    next => {
      if (next === undefined) return;
      queueMicrotask(() => {
        if (!drag && next !== valueRef) adopt(clamp(next, s().min, s().max));
      });
    }
  );

  let lastDefault: number | undefined;
  createEffect(
    () => props.defaultValue ?? 24,
    next => {
      const first = lastDefault === undefined;
      const changed = next !== lastDefault;
      lastDefault = next;
      if (first || !changed) return;
      if (untrack(() => props.value) !== undefined) return;
      queueMicrotask(() => {
        if (!drag) adopt(clamp(next, s().min, s().max));
      });
    }
  );

  const end = (cancel = false) => {
    const g = drag;
    if (!g) return;
    drag = null;
    setDragging(false);
    document.documentElement.style.cursor = '';
    if (esc) {
      window.removeEventListener('keydown', esc);
      esc = null;
    }
    if (cancel) {
      commit(g.before);
      display.jump(g.before);
      return;
    }
    if (!g.moved) {
      inputEl?.focus();
      return;
    }
    const { min, max, returnDuration } = s();
    const bound = clamp(display.get(), min, max);
    if (display.get() !== bound) {
      if (reducedMotion()) display.jump(bound);
      else animate(display, bound, { ...SPRING_UI, duration: returnDuration / 1000 });
    }
    if (g.moved && valueRef !== g.before) props.onCommit?.(valueRef);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (props.disabled || drag || e.button !== 0 || typing) return;
    if (e.pointerType !== 'touch') e.preventDefault();
    display.stop();
    moved = false;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      raw: toRaw(display.get()),
      mult: multiplierOf(e),
      moved: false,
      before: valueRef,
      slack: e.pointerType === 'touch' ? 8 : 3,
      left: chipEl ? chipEl.getBoundingClientRect().left : 0
    };
    try {
      chipEl?.setPointerCapture(e.pointerId);
    } catch {}
    esc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') end(true);
    };
    window.addEventListener('keydown', esc);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const g = drag;
    if (!g || e.pointerId !== g.id) return;
    if (!g.moved) {
      if (Math.abs(e.clientX - g.x) < g.slack) return;
      g.moved = true;
      moved = true;
      g.x = e.clientX;
      setDragging(true);
      document.documentElement.style.cursor = 'ew-resize';
    }
    const { min, max, step, sensitivity } = s();
    const m = multiplierOf(e);
    if (m !== g.mult) {
      g.mult = m;
      g.raw = toRaw(display.get());
      g.x = e.clientX;
    }
    const raw = g.raw + Math.round((e.clientX - g.x) / sensitivity) * step * m;
    const shown = toShown(raw);
    display.set(shown);
    commit(clamp(raw, min, max));
    if (ghostEl) {
      ghostEl.style.translate = `calc(${e.clientX - g.left}px - 50%) -100%`;
      ghostEl.textContent = signed(shown - g.before);
    }
  };

  const leaveTyping = () => {
    typing = false;
    setDraft(null);
    if (inputEl) inputEl.value = fmt(valueRef);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const { min, max, step, coarseMultiplier } = s();
    const typedNumber = draftRef !== null && draftRef.trim() !== '' ? Number(draftRef) : NaN;
    const from = Number.isNaN(typedNumber) ? valueRef : typedNumber;
    const deltas: Record<string, number> = {
      ArrowUp: step * multiplierOf(e),
      ArrowDown: -step * multiplierOf(e),
      PageUp: step * coarseMultiplier,
      PageDown: -step * coarseMultiplier
    };
    const delta = deltas[e.key];
    const target = e.currentTarget as HTMLInputElement;
    if (delta !== undefined || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      leaveTyping();
      commit(delta !== undefined ? from + delta : e.key === 'Home' ? min : max);
      display.jump(valueRef);
      if (inputEl) inputEl.value = fmt(valueRef);
      props.onCommit?.(valueRef);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      target.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      leaveTyping();
      target.blur();
    }
  };

  const handleFocus = (e: FocusEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    typing = true;
    setDraft(target.value);
    target.select();
  };

  const handleBlur = () => {
    const n = draftRef === null ? NaN : parseFloat(draftRef.replace(/[^\d.-]/g, ''));
    if (!Number.isNaN(n)) {
      commit(n);
      props.onCommit?.(valueRef);
    }
    leaveTyping();
    display.jump(valueRef);
  };

  onSettled(() => {
    cur = untrack(settings);
    if (inputEl) inputEl.value = fmt(valueRef);
    onDisplay(display.get());
    return () => {
      document.documentElement.style.cursor = '';
      if (esc) window.removeEventListener('keydown', esc);
      esc = null;
      drag = null;
      unsubscribe();
      display.destroy();
    };
  });

  const dirty = () => (props.showDirty ?? false) && value() !== (props.defaultValue ?? 24);
  const suffix = () => props.suffix ?? 'px';
  const accent = () => props.accent ?? '#f5f5f5';

  const chipStyle = createMemo<JSX.CSSProperties>(() => {
    const p = preset();
    return {
      '--sf-accent': accent(),
      '--sf-chip': props.chipColor ?? '#27272a',
      '--sf-ghost-ink': onColor(accent()),
      '--sf-h': `${p.height}px`,
      '--sf-fs': `${p.font}px`,
      '--sf-r': `${p.radius}px`,
      '--sf-w': `${p.width}px`
    };
  });

  return (
    <div
      ref={el => (chipEl = el)}
      class={['scrub-field', props.className]}
      data-dirty={dirty() ? 'true' : 'false'}
      data-dragging={dragging() ? 'true' : 'false'}
      data-typing={draft() !== null ? 'true' : 'false'}
      data-disabled={props.disabled ? 'true' : 'false'}
      aria-disabled={props.disabled ? 'true' : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => end()}
      onPointerCancel={() => end(true)}
      onLostPointerCapture={() => end()}
      style={chipStyle()}
    >
      <Show when={props.showFill ?? true}>
        <span class="scrub-field__track" aria-hidden="true">
          <span
            ref={el => {
              fillEl = el;
              if (cur) {
                const d = display.get();
                el.style.transform = `scaleX(${(clamp(d, cur.min, cur.max) - cur.min) / Math.max(cur.max - cur.min, Number.EPSILON)})`;
              }
            }}
            class="scrub-field__fill"
          />
        </span>
      </Show>
      <label
        for={id}
        class="scrub-field__handle"
        onClick={e => {
          if (moved) e.preventDefault();
        }}
      >
        {props.label ?? 'Radius'}
      </label>
      <input
        ref={el => (inputEl = el)}
        id={id}
        class="scrub-field__input"
        type="text"
        inputmode="decimal"
        role="spinbutton"
        aria-valuenow={value()}
        aria-valuemin={settings().min}
        aria-valuemax={settings().max}
        aria-valuetext={`${fmtWith(value(), settings().baseDecimals, settings().fineDecimals)}${suffix() ? ` ${suffix()}` : ''}`}
        disabled={props.disabled}
        onFocus={handleFocus}
        onInput={e => setDraft(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      <Show when={suffix()}>
        <span class="scrub-field__suffix" aria-hidden="true">
          {suffix()}
        </span>
      </Show>
      <Show when={props.showDelta ?? true}>
        <span ref={el => (ghostEl = el)} class="scrub-field__ghost" aria-hidden="true" />
      </Show>
    </div>
  );
}
