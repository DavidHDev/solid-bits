import { For, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { FavouriteIcon, StarIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons';

import './PulseHeart.css';

export type PulseHeartIcon = 'heart' | 'star' | 'thumb';

export interface PulseHeartProps {
  liked?: boolean;
  defaultLiked?: boolean;
  count?: number;
  onChange?: (liked: boolean, count: number) => void;
  showCount?: boolean;
  icon?: PulseHeartIcon | JSX.Element;
  idleOutline?: boolean;
  size?: number;
  corner?: number;
  likedColor?: string;
  idleColor?: string;
  pillColor?: string;
  textColor?: string;
  duration?: number;
  dotSize?: number;
  overshoot?: number;
  beat?: number;
  rollDuration?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];
type Roll = { a: string; b: string; at: number; up: boolean };
type Cell = { ch: string } | { top: string; bottom: string };
type Shown = { liked: boolean; count: number };

const slotOf = (cell: Cell) => ('ch' in cell ? null : cell);
const charOf = (cell: Cell) => ('ch' in cell ? cell.ch : '');

const OUT = 0.4;
const ICONS: Record<PulseHeartIcon, IconData> = {
  heart: FavouriteIcon as IconData,
  star: StarIcon as IconData,
  thumb: ThumbsUpIcon as IconData
};

const back = (k: number, c: number) => {
  const u = k - 1;
  return 1 + (c + 1) * u ** 3 + c * u ** 2;
};
const swellOf = (t: number, c: number) =>
  t <= 0 ? 0 : t < OUT ? 1 - (1 - t / OUT) ** 3 : 1 - back((t - OUT) / (1 - OUT), c);
const format = (n: number) => new Intl.NumberFormat().format(n);
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function PulseHeart(props: PulseHeartProps) {
  const controlled = () => props.liked !== undefined;
  const [inner, setInner] = createSignal(() => props.defaultLiked ?? false);
  const [total, setTotal] = createSignal(() => props.count ?? 0);
  const liked = createMemo(() => (controlled() ? !!props.liked : inner()));
  const [running, setRunning] = createSignal(false);
  const [frozen, setFrozen] = createSignal<Shown>({ liked: false, count: 0 });
  const shown = createMemo<Shown>(() => (running() ? frozen() : { liked: liked(), count: total() }));
  const [roll, setRoll] = createSignal<Roll | null>(null);

  const cfg = createMemo(() => ({
    duration: props.duration ?? 560,
    dotSize: props.dotSize ?? 0.3,
    overshoot: props.overshoot ?? 1.7,
    beat: props.beat ?? 3,
    rollDuration: props.rollDuration ?? 350
  }));

  let rootEl: HTMLButtonElement | undefined;
  let pillEl: HTMLSpanElement | undefined;
  let heartEl: HTMLSpanElement | undefined;
  let glyphEl: SVGGElement | undefined;
  let rollEl: HTMLSpanElement | undefined;
  let raf = 0;
  let rollTimer: ReturnType<typeof setTimeout> | undefined;
  let viaPointer = false;

  createEffect(shown, () => {
    const root = rootEl;
    if (!root || root.dataset.instant === undefined) return;
    root.getBoundingClientRect();
    delete root.dataset.instant;
  });

  createEffect(roll, r => {
    const el = rollEl;
    if (!el || !r) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${r.up ? '0' : '-1em'})`;
    el.getBoundingClientRect();
    el.style.transition = '';
    el.style.transform = `translateY(${r.up ? '-1em' : '0'})`;
  });

  onCleanup(() => {
    cancelAnimationFrame(raf);
    clearTimeout(rollTimer);
  });

  const startRoll = (from: number, to: number) => {
    if (from === to) return;
    const a = format(from);
    const b = format(to);
    const changed = a.length === b.length ? [...b].flatMap((ch, i) => (ch !== a[i] ? [i] : [])) : [];
    setRoll({ a, b, at: changed.length === 1 ? changed[0] : -1, up: to > from });
    clearTimeout(rollTimer);
    rollTimer = setTimeout(() => setRoll(null), cfg().rollDuration);
  };

  const run = (from: Shown, nextLiked: boolean, nextCount: number) => {
    const root = rootEl;
    const heart = heartEl;
    const pill = pillEl;
    if (!root || !heart || !pill) return;
    const glyph = paths() ? glyphEl : undefined;
    root.dataset.running = '';
    setFrozen(from);
    setRunning(true);
    let swapped = false;
    let prev = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const { duration: D, dotSize: dot, overshoot: c, beat: B } = cfg();
      const t = Math.min(1, (now - t0) / D);
      const step = prev ? now - prev : 1000 / 60;
      prev = now;
      const s = swellOf(t, c);
      const k = 1 - (1 - dot) * s;
      if (glyph) glyph.setAttribute('transform', `translate(12 12) scale(${k}) translate(-12 -12)`);
      else heart.style.transform = `scale(${k})`;
      pill.style.transform = `scale(${1 - (B / 100) * s})`;
      if (!swapped && t + step / 2 / D >= OUT) {
        swapped = true;
        root.dataset.liked = String(nextLiked);
        startRoll(from.count, nextCount);
        setFrozen({ liked: nextLiked, count: nextCount });
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      raf = 0;
      if (glyph) glyph.removeAttribute('transform');
      heart.style.transform = '';
      pill.style.transform = '';
      delete root.dataset.running;
      setRunning(false);
    };
    raf = requestAnimationFrame(tick);
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 || props.disabled) return;
    viaPointer = true;
    if (!reducedMotion() && rootEl) rootEl.dataset.pressed = '';
  };
  const handlePointerUp = () => {
    if (rootEl) delete rootEl.dataset.pressed;
  };
  const handlePointerCancel = () => {
    viaPointer = false;
    handlePointerUp();
  };
  const handleKeyDown = () => {
    viaPointer = false;
  };
  const handleClick = (e: MouseEvent) => {
    if (props.disabled || raf) return;
    const pointer = viaPointer && e.detail !== 0;
    viaPointer = false;
    const from = shown();
    const nextLiked = !liked();
    const nextCount = total() + (nextLiked ? 1 : -1);
    if (pointer && !reducedMotion()) run(from, nextLiked, nextCount);
    else if (rootEl) rootEl.dataset.instant = '';
    if (!controlled()) setInner(nextLiked);
    setTotal(nextCount);
    props.onChange?.(nextLiked, nextCount);
  };

  const paths = createMemo(() => {
    const icon = props.icon ?? 'heart';
    return typeof icon === 'string' ? ICONS[icon as PulseHeartIcon] || ICONS.heart : null;
  });

  const cells = createMemo<Cell[]>(() => {
    const r = roll();
    const text = format(shown().count);
    return r
      ? r.at === -1
        ? [{ top: r.up ? r.a : r.b, bottom: r.up ? r.b : r.a }]
        : [...r.b].map((ch, i) => (i === r.at ? { top: r.up ? r.a[i] : ch, bottom: r.up ? ch : r.a[i] } : { ch }))
      : [...text].map(ch => ({ ch }));
  });

  const size = () => props.size ?? 40;
  const showCount = () => props.showCount ?? true;
  const label = () => props.label ?? 'Like';

  return (
    <button
      ref={el => (rootEl = el)}
      type="button"
      aria-pressed={liked() ? 'true' : 'false'}
      disabled={props.disabled ?? false}
      data-liked={String(shown().liked)}
      data-solid={(props.idleOutline ?? true) ? undefined : ''}
      data-no-count={showCount() ? undefined : ''}
      class={['pulse-heart', props.className]}
      style={{
        '--ph-size': `${size()}px`,
        '--ph-corner': `${props.corner ?? 32}px`,
        '--ph-pill': props.pillColor ?? '#222428',
        '--ph-idle': props.idleColor ?? '#8d8f94',
        '--ph-liked': props.likedColor ?? '#ff4d6d',
        '--ph-text': props.textColor ?? '#f5f5f5',
        '--ph-roll': `${cfg().rollDuration}ms`,
        '--ph-stroke': `${(1.5 * size()) / 24}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      <span ref={el => (pillEl = el)} class="pulse-heart__pill">
        <span ref={el => (heartEl = el)} class="pulse-heart__heart" aria-hidden="true">
          <Show when={paths()} fallback={props.icon as JSX.Element}>
            {p => (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g ref={el => (glyphEl = el)}>
                  <For each={p()}>{([, attrs]) => <path d={String(attrs.d)} vector-effect="non-scaling-stroke" />}</For>
                </g>
              </svg>
            )}
          </Show>
        </span>
        <Show when={showCount()}>
          <span class="pulse-heart__count" aria-hidden="true">
            <For each={cells()} keyed={false}>
              {cell => (
                <Show when={slotOf(cell())} fallback={<span>{charOf(cell())}</span>}>
                  {slot => (
                    <span class="pulse-heart__slot">
                      <span ref={el => (rollEl = el)} class="pulse-heart__roll">
                        <span>{slot().top}</span>
                        <span>{slot().bottom}</span>
                      </span>
                    </span>
                  )}
                </Show>
              )}
            </For>
          </span>
        </Show>
        <span class="pulse-heart__sr">{showCount() ? `${label()}, ${format(total())}` : label()}</span>
      </span>
    </button>
  );
}
