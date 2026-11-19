import { For, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, type AnimationPlaybackControls, type Easing } from 'motion';

type Snapshot = Record<string, string | number>;
type Keyframes = Record<string, Array<string | number>>;
type Target = Record<string, string | number | Array<string | number>>;
type Transition = Record<string, unknown>;
type Phase = 'from' | 'in' | 'out' | 'rest';

export type BlurTextEffect = 'blur' | 'zoom' | 'tilt' | 'focus' | 'drift';
export type BlurTextStaggerFrom = 'start' | 'center' | 'end' | 'random';
export type BlurTextTrigger = 'view' | 'load' | 'hover' | 'click';

export interface BlurTextProps {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom' | 'left' | 'right';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: Easing | Easing[];
  onAnimationComplete?: () => void;
  stepDuration?: number;
  blur?: number;
  distance?: number;
  effect?: BlurTextEffect;
  staggerFrom?: BlurTextStaggerFrom;
  trigger?: BlurTextTrigger;
  loop?: boolean;
  loopDelay?: number;
  color?: string;
  fromColor?: string;
  focusOnHover?: boolean;
}

interface EffectConfig {
  from: Snapshot;
  steps: Snapshot[];
  exit: Snapshot;
  times: number[];
  fade: Easing;
  bounce: number | null;
  settle: number;
  origin?: { originX: number; originY: number };
  exitEase: Easing;
}

interface Piece {
  word: number;
  content: string;
  key: string;
}

interface Plan {
  phase: Phase;
  target: Target;
  transitions: Transition[];
  count: number;
  reduce: boolean;
}

const AXES: Record<NonNullable<BlurTextProps['direction']>, ['x' | 'y', number]> = {
  top: ['y', -1],
  bottom: ['y', 1],
  left: ['x', -1],
  right: ['x', 1]
};

const EASE_OUT: Easing = [0.33, 1, 0.68, 1];
const EASE_IN_OUT: Easing = [0.65, 0, 0.35, 1];
const EASE_IN: Easing = [0.55, 0, 0.9, 0.45];
const CSS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MOVE_KEYS = ['x', 'y', 'scale', 'rotateX', 'rotateY', 'skewX'];
const INSTANT: Transition = { duration: 0 };

const SR_ONLY: JSX.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  'white-space': 'nowrap',
  border: 0,
  'user-select': 'none'
};

const PIECE_STYLE: JSX.CSSProperties = { display: 'inline-block', 'will-change': 'transform, filter, opacity' };
const WORD_STYLE: JSX.CSSProperties = { display: 'inline-flex' };

const blurTo = (px: number) => `blur(${Math.max(0, px)}px)`;

const buildEffect = (
  effect: BlurTextEffect,
  direction: NonNullable<BlurTextProps['direction']>,
  blur: number,
  distance: number
): EffectConfig => {
  const [axis, sign] = AXES[direction] || AXES.top;
  const b = Math.max(0, blur);
  const d = distance;

  if (effect === 'zoom') {
    return {
      from: { filter: blurTo(b * 1.2), opacity: 0, scale: 1.4, [axis]: sign * d * 0.35 },
      steps: [
        { filter: blurTo(b * 0.2), opacity: 0.9, scale: 0.97, [axis]: -sign * d * 0.03 },
        { filter: blurTo(0), opacity: 1, scale: 1, [axis]: 0 }
      ],
      exit: { filter: blurTo(b), opacity: 0, scale: 0.82, [axis]: -sign * d * 0.2 },
      times: [0, 0.6, 1],
      fade: EASE_OUT,
      bounce: 0.25,
      settle: 0.5,
      exitEase: EASE_IN
    };
  }

  if (effect === 'tilt') {
    const rotate = axis === 'y' ? 'rotateX' : 'rotateY';
    const lean = axis === 'y' ? -sign : sign;
    return {
      from: { filter: blurTo(b), opacity: 0, [rotate]: lean * 55, [axis]: sign * d * 0.5, transformPerspective: 600 },
      steps: [
        {
          filter: blurTo(b * 0.15),
          opacity: 0.95,
          [rotate]: -lean * 8,
          [axis]: -sign * d * 0.04,
          transformPerspective: 600
        },
        { filter: blurTo(0), opacity: 1, [rotate]: 0, [axis]: 0, transformPerspective: 600 }
      ],
      exit: { filter: blurTo(b), opacity: 0, [rotate]: -lean * 40, [axis]: -sign * d * 0.3, transformPerspective: 600 },
      times: [0, 0.6, 1],
      fade: EASE_OUT,
      bounce: 0.3,
      settle: 0.8,
      origin: { originX: axis === 'x' ? (sign < 0 ? 0 : 1) : 0.5, originY: axis === 'y' ? (sign < 0 ? 0 : 1) : 0.5 },
      exitEase: EASE_IN
    };
  }

  if (effect === 'focus') {
    const soft: Snapshot = { filter: blurTo(b * 1.4), opacity: 0.32, scale: 1.12 };
    return {
      from: soft,
      steps: [
        { filter: blurTo(b * 0.1), opacity: 0.95, scale: 0.995 },
        { filter: blurTo(0), opacity: 1, scale: 1 }
      ],
      exit: soft,
      times: [0, 0.72, 1],
      fade: EASE_IN_OUT,
      bounce: null,
      settle: 1,
      exitEase: EASE_IN_OUT
    };
  }

  if (effect === 'drift') {
    const h = direction === 'right' ? 1 : -1;
    const v = axis === 'y' ? sign : 0;
    return {
      from: { filter: blurTo(b), opacity: 0, x: h * d * 1.6, y: v * d * 0.3, skewX: h * 28 },
      steps: [
        { filter: blurTo(b * 0.15), opacity: 0.95, x: -h * d * 0.06, y: 0, skewX: -h * 7 },
        { filter: blurTo(0), opacity: 1, x: 0, y: 0, skewX: 0 }
      ],
      exit: { filter: blurTo(b), opacity: 0, x: -h * d * 1.2, y: -v * d * 0.2, skewX: h * 20 },
      times: [0, 0.62, 1],
      fade: EASE_OUT,
      bounce: 0.3,
      settle: 0.55,
      exitEase: EASE_IN
    };
  }

  return {
    from: { filter: blurTo(b), opacity: 0, [axis]: sign * d },
    steps: [
      { filter: blurTo(b / 2), opacity: 0.5, [axis]: (-sign * d) / 10 },
      { filter: blurTo(0), opacity: 1, [axis]: 0 }
    ],
    exit: { filter: blurTo(b), opacity: 0, [axis]: -sign * d * 0.6 },
    times: [0, 0.5, 1],
    fade: 'linear',
    bounce: 0.35,
    settle: 0.5,
    exitEase: EASE_IN
  };
};

const buildKeyframes = (from: Snapshot, steps: Snapshot[]): Keyframes => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap(s => Object.keys(s))]);

  const keyframes: Keyframes = {};
  keys.forEach(k => {
    keyframes[k] = [from[k], ...steps.map(s => s[k])];
  });
  return keyframes;
};

const buildRanks = (count: number, staggerFrom: BlurTextStaggerFrom, seedText: string): number[] => {
  const ranks = Array.from({ length: count }, (_, i) => i);
  if (staggerFrom === 'end') return ranks.map(i => count - 1 - i);
  if (staggerFrom === 'center') {
    const mid = (count - 1) / 2;
    const offset = count % 2 === 0 ? 0.5 : 0;
    return ranks.map(i => Math.abs(i - mid) - offset);
  }
  if (staggerFrom === 'random') {
    let seed = 2166136261;
    for (let i = 0; i < seedText.length; i++) seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619) >>> 0;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const order = ranks.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach((piece, rank) => {
      ranks[piece] = rank;
    });
  }
  return ranks;
};

const startPhase = (trigger: BlurTextTrigger): Phase =>
  trigger === 'load' ? 'in' : trigger === 'hover' || trigger === 'click' ? 'rest' : 'from';

const finalValues = (target: Target): Snapshot => {
  const values: Snapshot = {};
  for (const key in target) {
    const value = target[key];
    values[key] = Array.isArray(value) ? value[value.length - 1] : value;
  }
  return values;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function BlurText(props: BlurTextProps) {
  let containerEl: HTMLParagraphElement | undefined;
  const els: (HTMLSpanElement | undefined)[] = [];
  const applied = new WeakMap<HTMLSpanElement, Map<string, string>>();
  const running = new Set<AnimationPlaybackControls>();
  let firstPhase: Phase | null = null;
  let settled = false;
  let alive = true;

  const [phase, setPhase] = createSignal<Phase>(() => startPhase(props.trigger ?? 'view'));
  const [focusWord, setFocusWord] = createSignal(-1);

  const text = createMemo(() => props.text ?? '');
  const blur = createMemo(() => props.blur ?? 10);
  const fx = createMemo(() =>
    buildEffect(props.effect ?? 'blur', props.direction ?? 'top', blur(), props.distance ?? 50)
  );

  const custom = createMemo(() => Boolean(props.animationFrom || props.animationTo || props.easing));
  const fromSnapshot = createMemo(() => props.animationFrom ?? fx().from);
  const toSnapshots = createMemo(() => props.animationTo ?? fx().steps);
  const exitSnapshot = createMemo(() => props.animationFrom ?? fx().exit);
  const restSnapshot = createMemo(() => {
    const steps = toSnapshots();
    return steps[steps.length - 1];
  });
  const animateKeyframes = createMemo(() =>
    buildKeyframes(fromSnapshot(), custom() ? toSnapshots() : [restSnapshot()])
  );

  const stepDuration = createMemo(() => props.stepDuration ?? 0.35);
  const stepCount = createMemo(() => toSnapshots().length + 1);
  const totalDuration = createMemo(() => stepDuration() * (stepCount() - 1));
  const times = createMemo(() => {
    const count = stepCount();
    return props.animationTo
      ? Array.from({ length: count }, (_, i) => (count === 1 ? 0 : i / (count - 1)))
      : fx().times;
  });
  const stagger = createMemo(() => Math.max(0, props.delay ?? 200) / 1000);
  const exitDuration = createMemo(() => stepDuration() * 1.3);
  const exitStagger = createMemo(() => stagger() * 0.4);

  const words = createMemo(() => text().split(' '));

  const pieces = createMemo<Piece[]>(() => {
    const list: Piece[] = [];
    const all = words();
    const byWords = (props.animateBy ?? 'words') === 'words';
    all.forEach((word, w) => {
      const isLast = w === all.length - 1;
      if (byWords) {
        list.push({ word: w, content: isLast ? word : `${word} `, key: `word-${w}` });
        return;
      }
      Array.from(word).forEach((char, c) => list.push({ word: w, content: char, key: `char-${w}-${c}` }));
      if (!isLast) list.push({ word: w, content: ' ', key: `space-${w}` });
    });
    return list;
  });

  const groups = createMemo(() => {
    const list: number[][] = words().map(() => []);
    pieces().forEach((piece, index) => list[piece.word].push(index));
    return list;
  });

  const ranks = createMemo(() => buildRanks(pieces().length, props.staggerFrom ?? 'start', text()));
  const maxRank = createMemo(() => ranks().reduce((max, rank) => Math.max(max, rank), 0));
  const inTotal = createMemo(
    () => (totalDuration() * (custom() ? 1 : Math.max(1, fx().settle * 2.2)) + maxRank() * stagger()) * 1000
  );
  const outTotal = createMemo(() => (exitDuration() + maxRank() * exitStagger()) * 1000);

  const inTransition = (rank: number): Transition => {
    const delayed = rank * stagger();
    if (custom()) return { duration: totalDuration(), times: times(), delay: delayed, ease: props.easing ?? 'linear' };
    const effect = fx();
    const transition: Transition = { duration: totalDuration(), delay: delayed, ease: effect.fade };
    if (effect.bounce === null) return transition;
    const move = {
      type: 'spring',
      visualDuration: totalDuration() * effect.settle,
      bounce: effect.bounce,
      delay: delayed
    };
    const from = fromSnapshot();
    MOVE_KEYS.forEach(key => {
      if (key in from) transition[key] = move;
    });
    return transition;
  };

  const plan = createMemo<Plan>(() => {
    const current = phase();
    const target: Target =
      current === 'in'
        ? animateKeyframes()
        : current === 'out'
          ? exitSnapshot()
          : current === 'rest'
            ? restSnapshot()
            : fromSnapshot();
    const rankList = ranks();
    const transitions = rankList.map(rank =>
      current === 'in'
        ? inTransition(rank)
        : current === 'out'
          ? { duration: exitDuration(), ease: fx().exitEase, delay: rank * exitStagger() }
          : INSTANT
    );
    return { phase: current, target, transitions, count: pieces().length, reduce: prefersReducedMotion() };
  });

  const track = (controls: AnimationPlaybackControls) => {
    running.add(controls);
    controls.finished.then(
      () => running.delete(controls),
      () => running.delete(controls)
    );
  };

  createEffect(
    () => ({ plan: plan(), from: fromSnapshot() }),
    ({ plan: value, from }) => {
      if (!alive) return;
      if (firstPhase === null) firstPhase = value.phase;
      for (let i = 0; i < value.count; i++) {
        const el = els[i];
        if (!el) continue;
        let state = applied.get(el);
        if (!state) {
          state = new Map();
          applied.set(el, state);
          if (firstPhase === 'rest') {
            const initial = finalValues(value.target);
            track(animate(el, initial, { duration: 0 }));
            for (const key in value.target) state.set(key, JSON.stringify(value.target[key]));
            continue;
          }
          track(animate(el, from, { duration: 0 }));
          for (const key in from) state.set(key, JSON.stringify(from[key]));
        }
        const changed: Target = {};
        let any = false;
        for (const key in value.target) {
          const json = JSON.stringify(value.target[key]);
          if (state.get(key) === json) continue;
          state.set(key, json);
          changed[key] = value.target[key];
          any = true;
        }
        if (!any) continue;
        const options = { ...value.transitions[i], reduceMotion: value.reduce };
        track(animate(el, changed as never, options as never));
      }
    }
  );

  createEffect(
    () => ({
      phase: phase(),
      trigger: props.trigger ?? 'view',
      threshold: props.threshold ?? 0.1,
      rootMargin: props.rootMargin ?? '0px'
    }),
    ({ phase: current, trigger, threshold, rootMargin }) => {
      if (current !== 'from') return;
      if (trigger === 'load') {
        setPhase('in');
        return;
      }
      if (trigger === 'hover' || trigger === 'click') {
        setPhase('rest');
        return;
      }
      const element = containerEl;
      if (!element) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setPhase(value => (value === 'from' ? 'in' : value));
            observer.disconnect();
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(element);
      return () => observer.disconnect();
    }
  );

  createEffect(
    () => ({
      phase: phase(),
      loop: props.loop ?? false,
      loopDelay: props.loopDelay ?? 2,
      inTotal: inTotal(),
      outTotal: outTotal()
    }),
    ({ phase: current, loop, loopDelay, inTotal: inMs, outTotal: outMs }) => {
      let timer = 0;
      if (current === 'in') {
        settled = false;
        timer = window.setTimeout(() => {
          settled = true;
          props.onAnimationComplete?.();
          if (loop) timer = window.setTimeout(() => setPhase('out'), Math.max(0, loopDelay) * 1000);
        }, inMs);
      } else if (current === 'rest') {
        settled = true;
        if (loop) timer = window.setTimeout(() => setPhase('out'), Math.max(0, loopDelay) * 1000);
      } else if (current === 'out') {
        settled = false;
        timer = window.setTimeout(() => setPhase('in'), outMs);
      }
      return () => window.clearTimeout(timer);
    }
  );

  onSettled(() => {
    alive = true;
    return () => {
      alive = false;
      running.forEach(controls => controls.stop());
      running.clear();
    };
  });

  const replay = () => {
    const current = phase();
    if (current === 'out' || current === 'from') return;
    setPhase('out');
  };

  const handleEnter = () => {
    if ((props.trigger ?? 'view') === 'hover' && settled) replay();
  };

  const handleClick = () => {
    if ((props.trigger ?? 'view') === 'click') replay();
  };

  const tinted = createMemo(() => Boolean(props.fromColor) && (phase() === 'from' || phase() === 'out'));
  const dim = createMemo(() => Math.min(6, Math.max(2, blur() * 0.3)));
  const pieceBase = createMemo<JSX.CSSProperties>(() => {
    const origin = fx().origin;
    return origin && !custom()
      ? { ...PIECE_STYLE, 'transform-origin': `${origin.originX * 100}% ${origin.originY * 100}% 0` }
      : PIECE_STYLE;
  });

  const pieceStyle = (index: number): JSX.CSSProperties => {
    const base = pieceBase();
    if (!props.fromColor) return base;
    const rank = ranks()[index] ?? 0;
    const current = phase();
    return {
      ...base,
      color: tinted() ? props.fromColor : undefined,
      transition:
        current === 'in'
          ? `color ${totalDuration() * 0.9}s ${CSS_EASE} ${rank * stagger()}s`
          : current === 'out'
            ? `color ${exitDuration()}s ${CSS_EASE} ${rank * exitStagger()}s`
            : 'none'
    };
  };

  const wordStyle = (w: number): JSX.CSSProperties => {
    if (!props.focusOnHover) return WORD_STYLE;
    const dimmed = focusWord() !== -1 && focusWord() !== w;
    return {
      ...WORD_STYLE,
      filter: dimmed ? `blur(${dim()}px)` : 'blur(0px)',
      opacity: dimmed ? 0.3 : 1,
      transition: `filter 0.45s ${CSS_EASE}, opacity 0.45s ${CSS_EASE}`
    };
  };

  return (
    <p
      ref={el => (containerEl = el)}
      class={props.className ?? ''}
      style={{
        display: 'flex',
        'flex-wrap': 'wrap',
        color: props.color,
        cursor: (props.trigger ?? 'view') === 'click' ? 'pointer' : undefined
      }}
      onPointerEnter={handleEnter}
      onClick={handleClick}
    >
      <span style={SR_ONLY}>{text()}</span>
      <For each={groups()}>
        {(indices, w) => (
          <span
            style={wordStyle(w())}
            onPointerEnter={() => {
              if (props.focusOnHover) setFocusWord(w());
            }}
            onPointerLeave={() => {
              if (props.focusOnHover) setFocusWord(-1);
            }}
          >
            <For each={indices}>
              {index => (
                <span aria-hidden="true" ref={el => (els[index] = el)} style={pieceStyle(index)}>
                  {pieces()[index]?.content}
                </span>
              )}
            </For>
          </span>
        )}
      </For>
    </p>
  );
}
