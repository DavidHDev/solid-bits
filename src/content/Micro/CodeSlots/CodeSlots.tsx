import {
  For,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled,
  untrack,
  type Accessor
} from 'solid-js';
import { animate, cancelFrame, frame, motionValue, type MotionValue } from 'motion';
import { Tick02Icon } from '@hugeicons/core-free-icons';

import './CodeSlots.css';

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const WASH_IN = 0.3;
const WASH_OUT = 0.2;
const SINK_DELAY = 0.06;
const SINK_STEP = 0.03;
const CHECK_DELAY = 0.28;
const CHECK_RISE = 8;
const SINK_FADE = 0.6;

export type CodeSlotsStatus = 'idle' | 'error' | 'success';

export interface CodeSlotsProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  status?: CodeSlotsStatus;
  mask?: boolean;
  caret?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: string;
  inkColor?: string;
  slotColor?: string;
  digitColor?: string;
  dangerColor?: string;
  slotSize?: number;
  gap?: number;
  radius?: number;
  bounce?: number;
  settle?: number;
  rise?: number;
  cascade?: number;
  ariaLabel?: string;
  className?: string;
}

interface Springs {
  mvs: MotionValue<number>[];
  drops: MotionValue<number>[];
}

interface Live {
  length: number;
  settle: number;
  bounce: number;
  cascade: number;
  reduce: boolean;
  springs: Springs;
  pitch: number;
  washRadius: number;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
}

interface SlotProps {
  mv: MotionValue<number> | undefined;
  drop: MotionValue<number> | undefined;
  char: string;
  active: boolean;
  rise: number;
  sink: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const digitsOf = (raw: string | undefined) => String(raw ?? '').replace(/\D/g, '');
const toSlots = (raw: string | undefined, n: number) => {
  const d = digitsOf(raw).slice(0, n);
  return Array.from({ length: n }, (_, i) => d[i] ?? '');
};
const firstEmptyOf = (slots: string[]) => {
  const i = slots.indexOf('');
  return i === -1 ? slots.length - 1 : i;
};
const isFull = (slots: string[]) => slots.every(Boolean);

const kebab = (name: string) => name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
const tickMarkup = (strokeWidth: number) =>
  (Tick02Icon as unknown as [string, Record<string, string | number>][])
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([name]) => name !== 'key')
        .map(([name, value]) => `${kebab(name)}="${name === 'strokeWidth' ? strokeWidth : value}"`);
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

function TickIcon(props: { size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      innerHTML={tickMarkup(props.strokeWidth)}
    />
  );
}

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

export default function CodeSlots(props: CodeSlotsProps) {
  const uid = createUniqueId();
  const reduce = useReducedMotion();
  let inputEl: HTMLInputElement | undefined;
  let rowEl: HTMLDivElement | undefined;
  let washEl: HTMLSpanElement | undefined;
  let checkEl: HTMLSpanElement | undefined;
  let caretEl: HTMLSpanElement | undefined;

  const length = createMemo(() => props.length ?? 6);
  const status = createMemo<CodeSlotsStatus>(() => props.status ?? 'idle');
  const slotSize = () => props.slotSize ?? 44;
  const radius = () => props.radius ?? 12;
  const height = () => Math.round(slotSize() * 1.18);

  const initialLength = untrack(length);
  const initialStatus = untrack(status);
  const initialRaw = untrack(() => props.value ?? props.defaultValue ?? '');

  let slotsRef = toSlots(initialRaw, initialLength);
  const resized = (n: number) => Array.from({ length: n }, (_, i) => slotsRef[i] ?? '');
  const [slots, setSlots] = createSignal<string[]>(() => resized(length()));
  let activeNow = firstEmptyOf(slotsRef);
  const [active, setActive] = createSignal<number>(() => firstEmptyOf(resized(length())));
  const [focused, setFocused] = createSignal(false);
  const [veiled, setVeiled] = createSignal(initialStatus === 'success');
  const activeMv = motionValue(activeNow);
  const openMv = motionValue(initialStatus === 'success' ? 1 : 0);
  const checkMv = motionValue(initialStatus === 'success' ? 1 : 0);
  const glide = new Set<number>();
  let target: number[] = [];
  let draining = false;
  let drainTimer: ReturnType<typeof setTimeout> | undefined;
  let statusRef: CodeSlotsStatus = initialStatus;
  let emitted = digitsOf(initialRaw).slice(0, initialLength);

  const springs = createMemo<Springs>(() => {
    const n = length();
    return {
      mvs: Array.from({ length: n }, (_, i) => motionValue(slotsRef[i] ? 1 : 0)),
      drops: Array.from({ length: n }, () => motionValue(statusRef === 'success' ? 1 : 0))
    };
  });
  const indices = createMemo(() => Array.from({ length: length() }, (_, i) => i));

  const readLive = (): Live => ({
    length: length(),
    settle: props.settle ?? 0.3,
    bounce: props.bounce ?? 0.2,
    cascade: props.cascade ?? 20,
    reduce: reduce(),
    springs: springs(),
    pitch: slotSize() + (props.gap ?? 8),
    washRadius: Math.min(radius(), slotSize() / 2),
    onChange: props.onChange,
    onComplete: props.onComplete
  });
  let live = untrack(readLive);

  const paintCaret = () => {
    if (!caretEl) return;
    const { mvs } = live.springs;
    const pitch = live.pitch;
    const a = activeMv.get();
    let x = a * pitch;
    for (let j = 0; j < mvs.length; j++) {
      const h = clamp01(mvs[j].get());
      if (!glide.has(j)) continue;
      const to = target[j];
      if (to === undefined || h === clamp01(to)) {
        glide.delete(j);
        continue;
      }
      x += j < a ? -(1 - h) * pitch : h * pitch;
    }
    x = Math.min(Math.max(x, 0), (mvs.length - 1) * pitch);
    caretEl.style.transform = `translateX(${x}px)`;
  };
  const paintWash = () => {
    if (washEl) washEl.style.clipPath = `inset(0 ${(1 - clamp01(openMv.get())) * 50}% round ${live.washRadius}px)`;
  };
  const paintCheck = () => {
    if (!checkEl) return;
    const c = checkMv.get();
    checkEl.style.transform = `translateY(${(1 - c) * CHECK_RISE}px) scale(${0.85 + 0.15 * Math.max(c, 0)})`;
    checkEl.style.opacity = String(clamp01(c));
  };
  const scheduleCaret = () => {
    frame.render(paintCaret);
  };
  const scheduleWash = () => {
    frame.render(paintWash);
  };
  const scheduleCheck = () => {
    frame.render(paintCheck);
  };

  createEffect(readLive, value => {
    live = value;
    scheduleCaret();
    scheduleWash();
  });

  createEffect(springs, value => {
    const offs = value.mvs.map(mv => mv.on('change', scheduleCaret));
    scheduleCaret();
    return () => {
      offs.forEach(off => off());
      value.mvs.forEach(mv => mv.stop());
      value.drops.forEach(mv => mv.stop());
    };
  });

  const drive = (i: number, to: number, delayMs = 0) => {
    const mv = live.springs.mvs[i];
    if (!mv) return;
    target[i] = to;
    if (live.reduce) {
      mv.jump(to);
      return;
    }
    animate(mv, to, { type: 'spring', duration: live.settle, bounce: live.bounce, delay: delayMs / 1000 });
  };
  const land = (i: number, delayMs = 0) => {
    const mv = live.springs.mvs[i];
    if (!mv) return;
    if (mv.get() > 0) mv.jump(0);
    drive(i, 1, delayMs);
  };
  const moveActive = (next: number, crossed: number[]) => {
    crossed.forEach(j => glide.add(j));
    activeMv.jump(next);
    activeNow = next;
    setActive(next);
    scheduleCaret();
  };
  const jumpActive = (next: number) => {
    glide.clear();
    activeMv.jump(next);
    activeNow = next;
    setActive(next);
    scheduleCaret();
  };

  const commit = (next: string[]) => {
    const prev = slotsRef;
    slotsRef = next;
    setSlots(next);
    const code = next.join('');
    emitted = code;
    live.onChange?.(code);
    if (!isFull(prev) && isFull(next)) live.onComplete?.(code);
  };

  const insert = (raw: string, from = activeNow) => {
    const digits = digitsOf(raw);
    if (!digits) return;
    const n = live.length;
    const next = [...slotsRef];
    const crossed: number[] = [];
    const step = live.reduce ? 0 : live.cascade;
    let i = from;
    for (const ch of digits) {
      if (i >= n) break;
      next[i] = ch;
      land(i, (i - from) * step);
      crossed.push(i);
      i += 1;
    }
    if (!crossed.length) return;
    commit(next);
    moveActive(Math.min(i, n - 1), crossed);
  };
  const clearSlot = (i: number, stepBack = false) => {
    if (!slotsRef[i]) {
      if (stepBack) jumpActive(i);
      return;
    }
    const next = [...slotsRef];
    next[i] = '';
    drive(i, 0);
    commit(next);
    if (stepBack) moveActive(i, [i]);
  };

  const isBusy = () => (props.disabled ?? false) || draining || status() === 'success';
  const onKeyDown = (e: KeyboardEvent) => {
    if (isBusy() || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const n = live.length;
    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      insert(k);
    } else if (k === 'Backspace') {
      e.preventDefault();
      if (slotsRef[activeNow]) clearSlot(activeNow);
      else if (activeNow > 0) clearSlot(activeNow - 1, true);
    } else if (k === 'Delete') {
      e.preventDefault();
      clearSlot(activeNow);
    } else if (k === 'ArrowLeft') {
      e.preventDefault();
      jumpActive(Math.max(activeNow - 1, 0));
    } else if (k === 'ArrowRight') {
      e.preventDefault();
      jumpActive(Math.min(activeNow + 1, n - 1));
    } else if (k === 'Home') {
      e.preventDefault();
      jumpActive(0);
    } else if (k === 'End') {
      e.preventDefault();
      jumpActive(n - 1);
    }
  };
  const onPaste = (e: ClipboardEvent) => {
    if (isBusy()) return;
    e.preventDefault();
    insert(e.clipboardData?.getData('text') ?? '');
  };
  const onInput = (e: Event & { currentTarget: HTMLInputElement }) => {
    const el = e.currentTarget;
    const raw = el.value;
    el.value = '';
    if (isBusy()) return;
    const d = digitsOf(raw);
    if (!d) return;
    insert(d, d.length === 1 ? activeNow : 0);
  };
  const onRowMouseDown = (e: MouseEvent) => {
    if (props.disabled ?? false) return;
    e.preventDefault();
    const row = rowEl;
    if (row && !draining && status() !== 'success') {
      const rect = row.getBoundingClientRect();
      const zoom = rect.width / (row.offsetWidth || rect.width) || 1;
      const i = Math.floor((e.clientX - rect.left) / zoom / live.pitch);
      jumpActive(Math.max(0, Math.min(i, firstEmptyOf(slotsRef))));
    }
    inputEl?.focus();
  };

  createEffect(length, n => {
    glide.clear();
    target = [];
    const next = resized(n);
    slotsRef = next;
    activeNow = firstEmptyOf(next);
    activeMv.jump(activeNow);
    scheduleCaret();
    const code = next.join('');
    if (code !== emitted) {
      emitted = code;
      live.onChange?.(code);
    }
  });

  createEffect(
    () => ({ value: props.value, length: length() }),
    ({ value, length: n }) => {
      if (value === undefined) return;
      const clean = digitsOf(value).slice(0, n);
      if (clean === emitted) return;
      emitted = clean;
      const prev = slotsRef;
      const next = toSlots(clean, n);
      const hidden = statusRef === 'success';
      const landing: number[] = [];
      const leaving: number[] = [];
      next.forEach((ch, i) => {
        if (ch === prev[i]) return;
        (ch ? landing : leaving).push(i);
      });
      const { mvs, drops } = live.springs;
      const step = live.reduce || hidden ? 0 : live.cascade;
      landing.forEach((i, k) => land(i, k * step));
      leaving.reverse().forEach((i, k) => {
        if (hidden) {
          target[i] = 0;
          mvs[i]?.jump(0);
          drops[i]?.jump(0);
        } else drive(i, 0, k * step);
      });
      slotsRef = next;
      setSlots(next);
      moveActive(firstEmptyOf(next), [...landing, ...leaving]);
      if (!isFull(prev) && isFull(next)) live.onComplete?.(clean);
    }
  );

  const playStatus = (next: CodeSlotsStatus) => {
    const was = statusRef;
    const L = live;
    const { drops } = L.springs;
    if (next === 'success') {
      setVeiled(true);
      if (L.reduce) {
        openMv.jump(1);
        drops.forEach(d => d.jump(1));
        checkMv.jump(1);
        return;
      }
      animate(openMv, 1, { duration: WASH_IN, ease: EASE_OUT });
      drops.forEach((d, k) =>
        animate(d, 1, { type: 'spring', duration: 0.3, bounce: 0, delay: SINK_DELAY + k * SINK_STEP })
      );
      animate(checkMv, 1, { type: 'spring', duration: 0.35, bounce: L.bounce, delay: CHECK_DELAY });
      return;
    }
    if (was !== 'success') return;
    if (L.reduce) {
      openMv.jump(0);
      checkMv.jump(0);
      drops.forEach(d => d.jump(0));
      setVeiled(false);
      return;
    }
    animate(checkMv, 0, { duration: 0.15, ease: EASE_OUT });
    animate(openMv, 0, { duration: WASH_OUT, ease: EASE_OUT, delay: 0.06 }).then(() => {
      if (openMv.get() === 0) setVeiled(false);
    });
    drops.forEach(d => animate(d, 0, { type: 'spring', duration: 0.3, bounce: 0, delay: 0.1 }));
  };

  const playError = (next: CodeSlotsStatus) => {
    if (next !== 'error') return;
    const filled = slotsRef.map((c, i) => (c ? i : -1)).filter(i => i >= 0);
    if (!filled.length) return;
    filled.reverse();
    draining = true;
    const L = live;
    const n = L.length;
    const step = L.reduce ? 0 : L.cascade;
    filled.forEach((i, k) => drive(i, 0, k * step));
    moveActive(
      0,
      slotsRef.map((_, j) => j)
    );
    clearTimeout(drainTimer);
    drainTimer = setTimeout(
      () => {
        draining = false;
        commit(Array.from({ length: n }, () => ''));
      },
      L.reduce ? 300 : (filled.length - 1) * step + L.settle * 1000
    );
  };

  createEffect(status, next => {
    playStatus(next);
    playError(next);
    statusRef = next;
  });

  createEffect(
    () => props.autoFocus ?? false,
    autoFocus => {
      if (autoFocus) inputEl?.focus();
    }
  );

  onSettled(() => {
    const offs = [
      activeMv.on('change', scheduleCaret),
      openMv.on('change', scheduleWash),
      checkMv.on('change', scheduleCheck)
    ];
    paintCaret();
    paintWash();
    paintCheck();
    return () => {
      offs.forEach(off => off());
      cancelFrame(paintCaret);
      cancelFrame(paintWash);
      cancelFrame(paintCheck);
      activeMv.stop();
      openMv.stop();
      checkMv.stop();
      clearTimeout(drainTimer);
    };
  });

  const view = createMemo(() => {
    const s = slots();
    const n = length();
    return s.length === n ? s : Array.from({ length: n }, (_, i) => s[i] ?? '');
  });
  const showCaret = () =>
    (props.caret ?? true) &&
    focused() &&
    !(props.disabled ?? false) &&
    !veiled() &&
    status() !== 'success' &&
    (status() === 'error' || !view()[active()]);

  return (
    <div
      class={['code-slots', props.className]}
      style={{
        '--cs-accent': props.accentColor ?? '#f5f5f5',
        '--cs-ink': props.inkColor ?? '#f5f5f5',
        '--cs-slot': props.slotColor ?? '#27272a',
        '--cs-digit': props.digitColor ?? '#18181b',
        '--cs-danger': props.dangerColor ?? '#ff3b30',
        '--cs-size': `${slotSize()}px`,
        '--cs-height': `${height()}px`,
        '--cs-gap': `${props.gap ?? 8}px`,
        '--cs-radius': `${Math.min(radius(), slotSize() / 2)}px`,
        '--cs-font': `${Math.round(slotSize() * 0.5)}px`
      }}
    >
      <div
        ref={el => (rowEl = el)}
        class="code-slots__row"
        data-status={status()}
        data-focused={focused() ? '' : undefined}
        data-disabled={(props.disabled ?? false) ? '' : undefined}
        onMouseDown={onRowMouseDown}
      >
        <input
          ref={el => (inputEl = el)}
          class="code-slots__input"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]*"
          value=""
          maxlength={length()}
          aria-label={props.ariaLabel ?? 'One-time code'}
          aria-invalid={status() === 'error' ? 'true' : 'false'}
          aria-describedby={`${uid}-count`}
          disabled={props.disabled ?? false}
          readonly={status() === 'success'}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onInput={onInput}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
        />
        <For each={indices()}>
          {i => (
            <Slot
              mv={springs().mvs[i]}
              drop={springs().drops[i]}
              char={(props.mask ?? false) && view()[i] ? '•' : (view()[i] ?? '')}
              active={focused() && i === active()}
              rise={props.rise ?? 8}
              sink={Math.round(height() * 0.5)}
            />
          )}
        </For>
        <span
          ref={el => {
            washEl = el;
            paintWash();
          }}
          class="code-slots__wash"
          aria-hidden="true"
        >
          <span
            ref={el => {
              checkEl = el;
              paintCheck();
            }}
            class="code-slots__check"
          >
            <TickIcon size={Math.round(slotSize() * 0.6)} strokeWidth={2.2} />
          </span>
        </span>
        <span
          ref={el => {
            caretEl = el;
            paintCaret();
          }}
          class="code-slots__caret"
          aria-hidden="true"
          data-show={showCaret() ? '' : undefined}
        >
          <For each={[active()]}>{() => <span class="code-slots__caret-line" />}</For>
        </span>
      </div>
      <span id={`${uid}-count`} class="code-slots__sr" aria-live="polite">
        {status() === 'success' ? 'Code accepted' : `${view().filter(Boolean).length} of ${length()} digits entered`}
      </span>
    </div>
  );
}

function Slot(props: SlotProps) {
  let fillEl: HTMLSpanElement | undefined;
  let digitEl: HTMLSpanElement | undefined;
  const shown = createMemo<string>(prev => props.char || prev || '');
  let cur = untrack(() => ({ mv: props.mv, drop: props.drop, rise: props.rise, sink: props.sink }));

  const paint = () => {
    const { mv, drop, rise, sink } = cur;
    if (!mv || !drop) return;
    const t = mv.get();
    const d = drop.get();
    if (fillEl) fillEl.style.transform = `scale(${Math.max(t, 0)})`;
    if (digitEl) {
      digitEl.style.transform = `translateY(${(1 - t) * rise + Math.max(d, 0) * sink}px)`;
      digitEl.style.opacity = String(clamp01(t) * (1 - clamp01(d / SINK_FADE)));
    }
  };
  const schedule = () => {
    frame.render(paint);
  };

  createEffect(
    () => ({ mv: props.mv, drop: props.drop, rise: props.rise, sink: props.sink }),
    value => {
      cur = value;
      paint();
      if (!value.mv || !value.drop) return;
      const offs = [value.mv.on('change', schedule), value.drop.on('change', schedule)];
      return () => {
        offs.forEach(off => off());
        cancelFrame(paint);
      };
    }
  );

  return (
    <span
      class="code-slots__slot"
      data-active={props.active ? '' : undefined}
      data-filled={props.char ? '' : undefined}
      aria-hidden="true"
    >
      <span
        ref={el => {
          fillEl = el;
          paint();
        }}
        class="code-slots__fill"
      />
      <span
        ref={el => {
          digitEl = el;
          paint();
        }}
        class="code-slots__digit"
      >
        {shown()}
      </span>
    </span>
  );
}
