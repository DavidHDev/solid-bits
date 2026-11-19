import { For, Show, createEffect, createMemo, createSignal, omit, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './SplitFlapText.css';

type TileState = {
  current: string;
  next: string;
  flipping: boolean;
  tick: number;
};

type AnimationPlan = {
  index: number;
  from: string;
  target: string;
  sequence: string[];
  start: number;
  step: number;
  done: boolean;
};

type TileUpdate = {
  index: number;
  current: string;
  next: string;
  done: boolean;
};

type Timing = {
  flipMs: number;
  staggerMs: number;
  holdMs: number;
  flips: number;
  glyphs: string;
  order: SplitFlapOrder;
};

export type SplitFlapAlign = 'left' | 'center' | 'right';

export type SplitFlapOrder = 'left' | 'right' | 'center' | 'random';

export type SplitFlapTileStyle = 'board' | 'minimal';

export interface SplitFlapTextProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'style'> {
  words?: string[];
  text?: string;
  flipDuration?: number;
  stagger?: number;
  cycleDelay?: number;
  charset?: 'alpha' | 'alphanumeric' | 'numeric' | (string & {});
  flipsPerChar?: number;
  tileColor?: string;
  textColor?: string;
  tileRadius?: number | string;
  gap?: number | string;
  fontSize?: number | string;
  loop?: boolean;
  padTo?: number;
  align?: SplitFlapAlign;
  intro?: boolean;
  glare?: number;
  depth?: number;
  order?: SplitFlapOrder;
  tileStyle?: SplitFlapTileStyle;
  className?: string;
  style?: JSX.CSSProperties;
}

const OWN_KEYS = [
  'words',
  'text',
  'flipDuration',
  'stagger',
  'cycleDelay',
  'charset',
  'flipsPerChar',
  'tileColor',
  'textColor',
  'tileRadius',
  'gap',
  'fontSize',
  'loop',
  'padTo',
  'align',
  'intro',
  'glare',
  'depth',
  'order',
  'tileStyle',
  'className',
  'style'
] as const;

const DEFAULT_WORDS = ['LAUNCH READY', 'SYNC ONLINE', 'SIGNAL LIVE'];

const CHARSETS: Record<string, string> = {
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  numeric: '0123456789'
};

const toCssUnit = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const resolveCharset = (charset: SplitFlapTextProps['charset']) => {
  if (charset && CHARSETS[charset]) return CHARSETS[charset];
  return typeof charset === 'string' && charset.length > 0 ? charset : CHARSETS.alphanumeric;
};

const normalizePhrase = (phrase: string, width: number, align: SplitFlapAlign = 'left') => {
  const safe = String(phrase ?? '').slice(0, width);
  if (align === 'right') return safe.padStart(width, ' ');
  if (align === 'center') {
    return safe.padStart(safe.length + Math.floor((width - safe.length) / 2), ' ').padEnd(width, ' ');
  }
  return safe.padEnd(width, ' ');
};

const createTiles = (phrase: string): TileState[] =>
  phrase.split('').map(char => ({
    current: char,
    next: char,
    flipping: false,
    tick: 0
  }));

const sampleChar = (charset: string) => charset.charAt(Math.floor(Math.random() * charset.length)) || ' ';

const buildSequence = (target: string, flips: number, charset: string) => {
  const steps: string[] = [];
  for (let i = 0; i < flips; i += 1) {
    steps.push(sampleChar(charset));
  }
  steps.push(target);
  return steps;
};

const toGlyph = (char: string) => (char === ' ' ? ' ' : char);

const shuffleIndices = (count: number) => {
  const list = Array.from({ length: count }, (_, index) => index);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const cascadeStep = (index: number, width: number, order: SplitFlapOrder, randomOrder: number[] | null) => {
  if (order === 'right') return width - 1 - index;
  if (order === 'center') return Math.floor(Math.abs(index - (width - 1) / 2));
  if (order === 'random' && randomOrder) return randomOrder[index];
  return index;
};

const clampUnit = (value: number) => Math.min(1, Math.max(0, Number(value) || 0));

const round = (value: number) => Number(value.toFixed(3));

const getReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

export default function SplitFlapText(props: SplitFlapTextProps) {
  const rest = omit(props, ...OWN_KEYS);
  const [prefersReducedMotion, setPrefersReducedMotion] = createSignal(getReducedMotion());

  let rafId: number | null = null;
  let shown: string | null = null;
  let fromPhrase: string | null = null;
  let phraseIndex = 0;
  let lastPhrases: string[] | null = null;
  let tilesNow: TileState[] = [];
  let timingNow: Timing | null = null;

  const phrasesKey = createMemo(() => {
    const words = props.words ?? DEFAULT_WORDS;
    const sourceWords = Array.isArray(words) && words.length > 0 ? words : DEFAULT_WORDS;
    return typeof props.text === 'string' ? props.text : sourceWords.map(word => String(word ?? '')).join('\u001f');
  });
  const phrases = createMemo(() => phrasesKey().split('\u001f'));

  const width = createMemo(() => {
    const longest = phrases().reduce((max, phrase) => Math.max(max, phrase.length), 1);
    return Math.max(1, Math.ceil(Number(props.padTo ?? 12) || 0), longest);
  });

  const normalizedPhrases = createMemo(() => {
    const w = width();
    const align = props.align ?? 'left';
    return phrases().map(phrase => normalizePhrase(phrase, w, align));
  });

  const timing = createMemo<Timing>(() => ({
    flipMs: Math.max(40, (Number(props.flipDuration ?? 0.12) || 0.12) * 1000),
    staggerMs: Math.max(0, (Number(props.stagger ?? 0.06) || 0) * 1000),
    holdMs: Math.max(400, Number(props.cycleDelay ?? 2400) || 2400),
    flips: Math.max(0, Math.floor(Number(props.flipsPerChar ?? 8) || 0)),
    glyphs: resolveCharset(props.charset ?? 'alphanumeric'),
    order: props.order ?? 'left'
  }));

  tilesNow = untrack(() => createTiles((props.intro ?? true) ? ' '.repeat(width()) : normalizedPhrases()[0]));
  const [tiles, setTiles] = createSignal<TileState[]>(tilesNow);
  const [activeIndex, setActiveIndex] = createSignal(0);

  const commitTiles = (next: TileState[]) => {
    tilesNow = next;
    setTiles(next);
  };

  createEffect(timing, value => {
    timingNow = value;
  });

  createEffect(
    () => ({
      normalized: normalizedPhrases(),
      width: width(),
      loop: props.loop ?? true,
      intro: props.intro ?? true,
      reduced: prefersReducedMotion(),
      seed: untrack(timing)
    }),
    ({ normalized, width: boardWidth, loop, intro, reduced, seed }) => {
      if (!timingNow) timingNow = seed;
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const currentTiming = () => timingNow ?? seed;

      const stopFrame = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      };

      const animateTo = (target: string) => {
        const { flipMs, staggerMs, flips, glyphs, order: cascade } = currentTiming();
        const from = normalizePhrase(shown ?? target, target.length);
        const randomOrder = cascade === 'random' ? shuffleIndices(target.length) : null;

        stopFrame();
        shown = target;
        fromPhrase = null;

        const plans: AnimationPlan[] = [];
        if (!reduced) {
          for (let index = 0; index < target.length; index += 1) {
            if (from[index] === target[index]) continue;
            plans.push({
              index,
              from: from[index],
              target: target[index],
              sequence: buildSequence(target[index], flips, glyphs),
              start: cascadeStep(index, target.length, cascade, randomOrder) * staggerMs,
              step: -1,
              done: false
            });
          }
        }

        if (!plans.length) {
          commitTiles(createTiles(target));
          return 0;
        }

        fromPhrase = from;
        commitTiles(createTiles(from));

        const totalDuration = plans.reduce((max, plan) => Math.max(max, plan.start + plan.sequence.length * flipMs), 0);
        const startedAt = performance.now();

        const tick = (now: number) => {
          if (cancelled) return;

          const elapsed = now - startedAt;
          const updates: TileUpdate[] = [];
          let running = false;

          plans.forEach(plan => {
            const localElapsed = elapsed - plan.start;

            if (localElapsed < 0) {
              running = true;
              return;
            }

            const step = Math.floor(localElapsed / flipMs);

            if (step < plan.sequence.length) {
              running = true;

              if (step !== plan.step) {
                plan.step = step;
                updates.push({
                  index: plan.index,
                  current: step === 0 ? plan.from : plan.sequence[step - 1],
                  next: plan.sequence[step],
                  done: false
                });
              }
            } else if (!plan.done) {
              plan.done = true;
              updates.push({
                index: plan.index,
                current: plan.target,
                next: plan.target,
                done: true
              });
            }
          });

          if (updates.length > 0) {
            const nextTiles = [...tilesNow];
            updates.forEach(update => {
              const tile = nextTiles[update.index];
              if (!tile) return;

              nextTiles[update.index] = {
                current: update.current,
                next: update.next,
                flipping: !update.done,
                tick: tile.tick + 1
              };
            });
            commitTiles(nextTiles);
          }

          if (running) {
            rafId = requestAnimationFrame(tick);
          } else {
            rafId = null;
            fromPhrase = null;
          }
        };

        rafId = requestAnimationFrame(tick);
        return totalDuration;
      };

      const show = (index: number) => {
        phraseIndex = index;
        setActiveIndex(index);
        return animateTo(normalized[index]);
      };

      const scheduleNext = (delay: number) => {
        timer = setTimeout(() => {
          if (cancelled) return;

          if (document.hidden) {
            scheduleNext(currentTiming().holdMs);
            return;
          }

          const nextIndex = phraseIndex + 1;
          if (nextIndex >= normalized.length && !loop) return;

          const duration = show(nextIndex % normalized.length);
          scheduleNext(currentTiming().holdMs + duration);
        }, delay);
      };

      const samePhrases = lastPhrases === normalized;
      lastPhrases = normalized;

      if (shown === null) {
        shown = intro ? ' '.repeat(boardWidth) : normalized[0];
      }

      if (!samePhrases || phraseIndex >= normalized.length) {
        phraseIndex = 0;
      } else if (fromPhrase !== null) {
        shown = fromPhrase;
      }

      let startDuration = 0;
      if (shown === normalized[phraseIndex]) {
        stopFrame();
        fromPhrase = null;
        setActiveIndex(phraseIndex);
        commitTiles(createTiles(shown));
      } else {
        startDuration = show(phraseIndex);
      }

      if (normalized.length > 1) {
        scheduleNext(currentTiming().holdMs + startDuration);
      }

      return () => {
        cancelled = true;
        clearTimeout(timer);
        stopFrame();
      };
    }
  );

  onSettled(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  });

  const label = () => String(phrases()[activeIndex()] ?? phrases()[0] ?? '').trim();
  const minimal = () => (props.tileStyle ?? 'board') === 'minimal';
  const level = () => clampUnit(props.depth ?? 0.5);
  const sheen = () => (minimal() ? 0 : clampUnit(props.glare ?? 0));
  const shaded = () => !minimal() && Math.max(0, level() - 0.5) * 2 > 0;

  const componentStyle = createMemo<JSX.CSSProperties>(() => {
    const depthLevel = level();
    const flat = Math.min(1, depthLevel * 2);
    const deep = Math.max(0, depthLevel - 0.5) * 2;
    const flipDuration = props.flipDuration ?? 0.12;
    return {
      '--split-flap-tile-color': props.tileColor ?? '#111827',
      '--split-flap-text-color': props.textColor ?? '#f8fafc',
      '--split-flap-radius': toCssUnit(props.tileRadius ?? 8),
      '--split-flap-gap': toCssUnit(props.gap ?? 6),
      '--split-flap-font-size': toCssUnit(props.fontSize ?? 52),
      '--split-flap-flip-duration': `${Math.max(0.04, Number(flipDuration) || 0.12)}s`,
      '--split-flap-front-from': round(1 + 0.08 * flat),
      '--split-flap-front-to': round(1 - 0.48 * flat - 0.3 * deep),
      '--split-flap-back-from': round(1 - 0.42 * flat - 0.3 * deep),
      '--split-flap-hinge': `calc(1px + ${round(deep * 0.05)}em)`,
      '--split-flap-hinge-shade': round(0.25 + 0.39 * flat + 0.21 * deep),
      '--split-flap-drop': round(0.28 * flat + 0.2 * deep),
      '--split-flap-lift': round(0.4 + 0.6 * flat + 0.7 * deep),
      '--split-flap-cast': round(deep * 0.62),
      '--split-flap-edge': `${round(deep * 0.035)}em`,
      '--split-flap-split': `${round(0.015 + depthLevel * 0.06)}em`,
      '--split-flap-glare': round(sheen() * 0.55),
      ...props.style
    };
  });

  return (
    <div
      class={[
        'split-flap-text',
        { 'split-flap-text--minimal': minimal(), 'split-flap-text--glare': sheen() > 0 },
        props.className
      ]}
      style={componentStyle()}
      {...rest}
    >
      <span class="split-flap-text__sr">{label()}</span>
      <Show when={tiles().length} keyed>
        {_count => (
          <For each={tiles()} keyed={false}>
            {tile => (
              <span class={['split-flap-text__tile', { 'is-flipping': tile().flipping }]} aria-hidden="true">
                <Show when={minimal() ? `top-${tile().tick}` : 'top'} keyed>
                  {_key => (
                    <span class="split-flap-text__half split-flap-text__half--top">
                      <span class="split-flap-text__char">
                        {toGlyph(tile().flipping ? tile().next : tile().current)}
                      </span>
                    </span>
                  )}
                </Show>
                <Show when={minimal() ? `bottom-${tile().tick}` : 'bottom'} keyed>
                  {_key => (
                    <span class="split-flap-text__half split-flap-text__half--bottom">
                      <span class="split-flap-text__char">{toGlyph(tile().current)}</span>
                    </span>
                  )}
                </Show>
                <Show when={tile().flipping && tile().tick} keyed>
                  {_tick => (
                    <>
                      <Show when={shaded()}>
                        <span class="split-flap-text__shade split-flap-text__shade--top" />
                        <span class="split-flap-text__shade split-flap-text__shade--bottom" />
                      </Show>
                      <span class="split-flap-text__flap split-flap-text__flap--front">
                        <span class="split-flap-text__char">{toGlyph(tile().current)}</span>
                      </span>
                      <span class="split-flap-text__flap split-flap-text__flap--back">
                        <span class="split-flap-text__char">{toGlyph(tile().next)}</span>
                      </span>
                    </>
                  )}
                </Show>
              </span>
            )}
          </For>
        )}
      </Show>
    </div>
  );
}
