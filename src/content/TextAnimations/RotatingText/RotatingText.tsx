import { For, Show, createEffect, createMemo, createSignal, flush, omit, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  animate as animateMotion,
  type AnimationOptions,
  type AnimationPlaybackControls,
  type DOMKeyframesDefinition
} from 'motion';

import './RotatingText.css';

const segmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;

const splitIntoCharacters = (text: string): string[] =>
  segmenter ? Array.from(segmenter.segment(text), segment => segment.segment) : Array.from(text);

const withFilter = <T,>(state: T, filter: string): T =>
  state && typeof state === 'object' && !Array.isArray(state) ? ({ ...state, filter } as T) : state;

export type RotatingTextEffect = 'slide' | 'flip' | 'blur' | 'scale' | 'drop';
export type RotatingTextTarget = Record<string, string | number>;
export type RotatingTextTransition = AnimationOptions;

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'children' | 'style' | 'ref' | 'onMouseEnter' | 'onMouseLeave'
> {
  texts: string[];
  transition?: RotatingTextTransition;
  initial?: boolean | RotatingTextTarget;
  animate?: RotatingTextTarget;
  exit?: RotatingTextTarget;
  effect?: RotatingTextEffect;
  direction?: 'up' | 'down';
  highlight?: boolean;
  highlightColor?: string;
  animatePresenceMode?: 'sync' | 'wait';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  pauseOnHover?: boolean;
  blur?: number;
  splitBy?: string;
  onNext?: (index: number) => void;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  className?: string;
  style?: JSX.CSSProperties;
  ref?: RotatingTextRef | ((api: RotatingTextRef) => void);
}

interface EffectPreset {
  initial: RotatingTextTarget;
  animate: RotatingTextTarget;
  exit: RotatingTextTarget;
  transition: RotatingTextTransition;
  exitTransition?: RotatingTextTransition;
}

interface Word {
  characters: string[];
  needsSpace: boolean;
  start: number;
}

interface PresenceItem {
  id: number;
  index: number;
  animateIn: boolean;
  exiting: boolean;
  settled: boolean;
  el?: HTMLSpanElement;
  flip: Flip;
  exit: () => Promise<unknown>;
}

interface Flip {
  play: (el: HTMLElement, dx: number, dy: number, transition: RotatingTextTransition) => void;
  stop: () => void;
}

const LAYOUT_SPRING: RotatingTextTransition = { type: 'spring', damping: 25, stiffness: 300 };
const WIDTH_SPRING: RotatingTextTransition = { type: 'spring', damping: 34, stiffness: 320 };
const FLIP_STYLE: JSX.CSSProperties = { 'transform-origin': '50% 50% -0.45em', 'backface-visibility': 'hidden' };

const EFFECTS: Record<RotatingTextEffect, (up: boolean) => EffectPreset> = {
  slide: up => ({
    initial: { y: up ? '100%' : '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: up ? '-120%' : '120%', opacity: 0 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  }),
  flip: up => ({
    initial: { rotateX: up ? -90 : 90, opacity: 0, transformPerspective: 480 },
    animate: { rotateX: 0, opacity: 1, transformPerspective: 480 },
    exit: { rotateX: up ? 90 : -90, opacity: 0, transformPerspective: 480 },
    transition: { type: 'tween', duration: 0.6, ease: [0.34, 1.4, 0.64, 1] },
    exitTransition: { type: 'tween', duration: 0.32, ease: [0.5, 0, 0.75, 0] }
  }),
  blur: up => ({
    initial: { y: up ? '45%' : '-45%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: up ? '-45%' : '45%', opacity: 0 },
    transition: { type: 'tween', duration: 0.55, ease: [0.22, 1, 0.36, 1] }
  }),
  scale: up => ({
    initial: { scale: up ? 0.35 : 1.7, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: up ? 1.7 : 0.35, opacity: 0 },
    transition: { type: 'spring', damping: 17, stiffness: 240 }
  }),
  drop: () => ({
    initial: { y: '-110%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '110%', opacity: 0 },
    transition: { type: 'spring', damping: 18, stiffness: 320, mass: 0.9 },
    exitTransition: { type: 'tween', duration: 0.3, ease: [0.55, 0, 1, 0.45] }
  })
};

const TRANSFORM_ORDER = [
  'transformPerspective',
  'x',
  'y',
  'z',
  'translateX',
  'translateY',
  'translateZ',
  'scale',
  'scaleX',
  'scaleY',
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'skew',
  'skewX',
  'skewY'
];

const TRANSFORM_NAMES: Record<string, string> = {
  transformPerspective: 'perspective',
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ'
};

const transformUnit = (key: string, value: string | number): string => {
  if (typeof value !== 'number') return value;
  if (key === 'transformPerspective' || key === 'x' || key === 'y' || key === 'z' || key.startsWith('translate')) {
    return `${value}px`;
  }
  if (key.startsWith('rotate') || key.startsWith('skew')) return `${value}deg`;
  return `${value}`;
};

const applyState = (el: HTMLElement, state: RotatingTextTarget) => {
  const transforms: string[] = [];
  for (const key of TRANSFORM_ORDER) {
    if (key in state) transforms.push(`${TRANSFORM_NAMES[key] ?? key}(${transformUnit(key, state[key])})`);
  }
  if (transforms.length) el.style.transform = transforms.join(' ');
  for (const key of Object.keys(state)) {
    if (TRANSFORM_ORDER.includes(key)) continue;
    const name = key.startsWith('--') ? key : key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    el.style.setProperty(name, String(state[key]));
  }
};

const enterKeyframes = (from: RotatingTextTarget, to: RotatingTextTarget) => {
  const keyframes: Record<string, string | number | (string | number)[]> = {};
  for (const key of Object.keys(to)) keyframes[key] = key in from ? [from[key], to[key]] : to[key];
  return keyframes as DOMKeyframesDefinition;
};

const matchZeroUnits = <T,>(state: T, others: unknown[]): T => {
  if (!state || typeof state !== 'object') return state;
  const result = { ...(state as RotatingTextTarget) };
  for (const key of Object.keys(result)) {
    if (result[key] !== 0) continue;
    for (const other of others) {
      const value = other && typeof other === 'object' ? (other as RotatingTextTarget)[key] : undefined;
      const unit = typeof value === 'string' ? value.match(/^-?[\d.]+([a-z%]+)$/i)?.[1] : undefined;
      if (unit) {
        result[key] = `0${unit}`;
        break;
      }
    }
  }
  return result as T;
};

const splitText = (text: string, splitBy: string): Word[] => {
  let parts: { characters: string[]; needsSpace: boolean }[];
  if (splitBy === 'characters') {
    const words = text.split(' ');
    parts = words.map((word, i) => ({ characters: splitIntoCharacters(word), needsSpace: i !== words.length - 1 }));
  } else {
    const separator = splitBy === 'words' ? ' ' : splitBy === 'lines' ? '\n' : splitBy;
    parts = text.split(separator).map((part, i, arr) => ({ characters: [part], needsSpace: i !== arr.length - 1 }));
  }
  let start = 0;
  return parts.map(part => {
    const word = { ...part, start };
    start += part.characters.length;
    return word;
  });
};

const createFlip = (): Flip => {
  let x = 0;
  let y = 0;
  let controls: AnimationPlaybackControls | null = null;
  return {
    play(el, dx, dy, transition) {
      const sx = x + dx;
      const sy = y + dy;
      controls?.stop();
      controls = null;
      if (Math.abs(sx) < 0.5 && Math.abs(sy) < 0.5) {
        x = 0;
        y = 0;
        el.style.transform = '';
        return;
      }
      x = sx;
      y = sy;
      el.style.transform = `translate(${x}px, ${y}px)`;
      controls = animateMotion(1, 0, {
        ...(transition as object),
        onUpdate: (f: number) => {
          x = sx * f;
          y = sy * f;
          el.style.transform = `translate(${x}px, ${y}px)`;
        },
        onComplete: () => {
          x = 0;
          y = 0;
          el.style.transform = '';
        }
      });
    },
    stop() {
      controls?.stop();
      controls = null;
    }
  };
};

const readableText = (color: string): string | undefined => {
  const value = String(color ?? '').trim();
  let rgb: number[] | null = null;
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const digits = hex[1].length < 6 ? [...hex[1].slice(0, 3)].map(c => c + c).join('') : hex[1].slice(0, 6);
    rgb = [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16));
  } else {
    const fn = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (fn) rgb = fn.slice(1, 4).map(Number);
  }
  if (!rgb) return undefined;
  const [r, g, b] = rgb.map(channel => {
    const c = Math.min(Math.max(channel / 255, 0), 1);
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#0b0b0c' : '#ffffff';
};

export default function RotatingText(props: RotatingTextProps) {
  const rest = omit(
    props,
    'texts',
    'transition',
    'initial',
    'animate',
    'exit',
    'effect',
    'direction',
    'highlight',
    'highlightColor',
    'animatePresenceMode',
    'animatePresenceInitial',
    'rotationInterval',
    'staggerDuration',
    'staggerFrom',
    'loop',
    'auto',
    'pauseOnHover',
    'blur',
    'splitBy',
    'onNext',
    'onMouseEnter',
    'onMouseLeave',
    'mainClassName',
    'splitLevelClassName',
    'elementLevelClassName',
    'className',
    'style',
    'ref'
  );

  const [currentTextIndex, setCurrentTextIndex] = createSignal(0);
  const [hovered, setHovered] = createSignal(false);
  const [items, setItems] = createSignal<PresenceItem[]>([]);

  let outerEl: HTMLSpanElement | undefined;
  let contentEl: HTMLSpanElement | undefined;
  let list: PresenceItem[] = [];
  let indexValue = 0;
  let nextId = 0;
  let pendingIndex: number | null = null;
  let alive = false;
  const running = new Set<AnimationPlaybackControls>();
  const outerFlip = createFlip();
  const reduceMotion =
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const lastIndex = createMemo(() => Math.max((props.texts?.length ?? 0) - 1, 0));
  const activeIndex = createMemo(() => Math.min(currentTextIndex(), lastIndex()));
  const highlight = createMemo(() => props.highlight ?? false);
  const splitBy = createMemo(() => props.splitBy ?? 'characters');

  const motionState = createMemo(() => {
    const effect = props.effect ?? 'slide';
    const preset = (EFFECTS[effect] ?? EFFECTS.slide)(props.direction !== 'down');
    const blur = props.blur ?? 0;
    const blurAmount = blur > 0 ? blur : effect === 'blur' ? 10 : 0;
    const enterState = matchZeroUnits(props.initial ?? preset.initial, [props.animate ?? preset.animate]);
    const leaveState = matchZeroUnits(props.exit ?? preset.exit, [props.animate ?? preset.animate]);
    const restState = matchZeroUnits(props.animate ?? preset.animate, [enterState, leaveState]);
    return {
      enterFrom: blurAmount > 0 ? withFilter(enterState, `blur(${blurAmount}px)`) : enterState,
      enterTo: blurAmount > 0 ? withFilter(restState, 'blur(0px)') : restState,
      leaveTo: blurAmount > 0 ? withFilter(leaveState, `blur(${blurAmount}px)`) : leaveState,
      charTransition: props.transition ?? preset.transition,
      exitTransition: props.transition || props.exit ? null : (preset.exitTransition ?? null),
      layoutTransition: props.transition ?? LAYOUT_SPRING,
      staggerDuration: props.staggerDuration ?? 0,
      staggerFrom: props.staggerFrom ?? 'first'
    };
  });

  const charStyle = createMemo(() => ((props.effect ?? 'slide') === 'flip' ? FLIP_STYLE : undefined));

  const run = (el: Element, keyframes: DOMKeyframesDefinition, options: RotatingTextTransition) => {
    const controls = animateMotion(el, keyframes, { ...(options as object), reduceMotion } as AnimationOptions);
    running.add(controls);
    const done = () => {
      running.delete(controls);
    };
    controls.finished.then(done, done);
    return controls;
  };

  const makeItem = (index: number, animateIn: boolean): PresenceItem => ({
    id: nextId++,
    index,
    animateIn,
    exiting: false,
    settled: false,
    flip: createFlip(),
    exit: () => Promise.resolve()
  });

  const commit = (next: PresenceItem[]) => {
    const outer = outerEl;
    const animateLayout = alive && !reduceMotion && !highlight() && !!outer && outer.isConnected;
    const outerBefore = outer ? { x: outer.offsetLeft, y: outer.offsetTop } : null;
    const innerBefore = new Map<PresenceItem, { x: number; y: number }>();
    if (animateLayout) {
      for (const item of list) if (item.el) innerBefore.set(item, { x: item.el.offsetLeft, y: item.el.offsetTop });
    }
    list = next;
    setItems(next);
    flush();
    if (!animateLayout || !outer || !outerBefore) return;
    const transition = motionState().layoutTransition;
    outerFlip.play(outer, outerBefore.x - outer.offsetLeft, outerBefore.y - outer.offsetTop, transition);
    for (const item of next) {
      const before = innerBefore.get(item);
      if (!before || !item.el) continue;
      item.flip.play(item.el, before.x - item.el.offsetLeft, before.y - item.el.offsetTop, transition);
    }
  };

  const startExit = (item: PresenceItem, done: () => void) => {
    item.exiting = true;
    item.exit().then(() => {
      if (alive) done();
    });
  };

  const show = (index: number) => {
    if (props.animatePresenceMode === 'sync') {
      for (const item of list) {
        if (item.exiting) continue;
        startExit(item, () => {
          item.flip.stop();
          commit(list.filter(entry => entry !== item));
        });
      }
      commit([...list, makeItem(index, true)]);
      return;
    }
    pendingIndex = index;
    const present = list.find(item => !item.exiting);
    if (present) {
      startExit(present, () => {
        present.flip.stop();
        const remaining = list.filter(entry => entry !== present);
        const target = pendingIndex;
        pendingIndex = null;
        commit(target === null ? remaining : [...remaining, makeItem(target, true)]);
      });
    } else if (!list.length) {
      pendingIndex = null;
      commit([makeItem(index, true)]);
    }
  };

  const goTo = (index: number) => {
    if (index === indexValue) return;
    indexValue = index;
    setCurrentTextIndex(index);
    if (alive) show(index);
    props.onNext?.(index);
  };

  const next = () => {
    const last = lastIndex();
    const current = Math.min(indexValue, last);
    goTo(current < last ? current + 1 : (props.loop ?? true) ? 0 : current);
  };

  const previous = () => {
    const last = lastIndex();
    const current = Math.min(indexValue, last);
    goTo(current > 0 ? current - 1 : (props.loop ?? true) ? last : current);
  };

  const jumpTo = (index: number) => goTo(Math.max(0, Math.min(index, lastIndex())));

  const reset = () => goTo(0);

  const api: RotatingTextRef = { next, previous, jumpTo, reset };

  const timer = createMemo(() => ({
    auto: props.auto ?? true,
    paused: (props.pauseOnHover ?? false) && hovered(),
    interval: props.rotationInterval ?? 2000,
    active: activeIndex(),
    last: lastIndex(),
    loop: props.loop ?? true
  }));

  createEffect(timer, value => {
    if (!value.auto || value.paused) return undefined;
    const timeoutId = setTimeout(next, value.interval);
    return () => clearTimeout(timeoutId);
  });

  createEffect(highlight, on => {
    const outer = outerEl;
    const content = contentEl;
    if (!outer) return undefined;
    if (!on || !content) {
      outer.style.width = '';
      return undefined;
    }
    let controls: AnimationPlaybackControls | null = null;
    let settled = false;
    let width = 0;
    const fit = () => {
      if (!content.isConnected) return;
      if (!settled && !content.offsetWidth) return;
      const target = content.offsetWidth + 1;
      controls?.stop();
      if (!settled || reduceMotion) {
        settled = true;
        width = target;
        outer.style.width = `${target}px`;
        return;
      }
      controls = animateMotion(width, target, {
        ...(WIDTH_SPRING as object),
        onUpdate: (value: number) => {
          width = value;
          outer.style.width = `${value}px`;
        }
      });
    };
    fit();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    observer?.observe(content);
    return () => {
      observer?.disconnect();
      controls?.stop();
    };
  });

  onSettled(() => {
    alive = true;
    indexValue = activeIndex();
    list = [makeItem(indexValue, props.animatePresenceInitial ?? false)];
    setItems(list);
    const ref = props.ref;
    if (typeof ref === 'function') ref(api);
    return () => {
      alive = false;
      running.forEach(controls => controls.stop());
      running.clear();
      outerFlip.stop();
      list.forEach(item => item.flip.stop());
    };
  });

  const handleMouseEnter = (event: MouseEvent) => {
    if (props.pauseOnHover) setHovered(true);
    props.onMouseEnter?.(event);
  };

  const handleMouseLeave = (event: MouseEvent) => {
    setHovered(false);
    props.onMouseLeave?.(event);
  };

  const blockStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    const style = props.style;
    if (!highlight()) return style;
    const color = props.highlightColor ?? '#6ec9f7';
    return { ...style, 'background-color': color, color: readableText(color) ?? style?.color };
  });

  const renderGroup = (item: PresenceItem) => {
    const words = createMemo(() => splitText(props.texts?.[Math.min(item.index, lastIndex())] ?? '', splitBy()));
    const order = createMemo(() => {
      const total = words().reduce((sum, word) => sum + word.characters.length, 0);
      const shuffled = Array.from({ length: total }, (_, i) => i).sort(() => Math.random() - 0.5);
      return { total, shuffled };
    });
    const chars = new Map<HTMLElement, () => number>();
    let pending: { el: HTMLElement; enter: boolean }[] = [];
    let scheduled = false;

    const delayOf = (index: number) => {
      const { staggerFrom, staggerDuration } = motionState();
      const { total, shuffled } = order();
      if (staggerFrom === 'first') return index * staggerDuration;
      if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
      if (staggerFrom === 'center') return Math.abs(Math.floor(total / 2) - index) * staggerDuration;
      if (staggerFrom === 'random') return (shuffled[index] ?? 0) * staggerDuration;
      return Math.abs((staggerFrom as number) - index) * staggerDuration;
    };

    const processPending = () => {
      scheduled = false;
      if (!alive) return;
      const batch = pending;
      pending = [];
      const state = motionState();
      const from = typeof state.enterFrom === 'object' ? state.enterFrom : null;
      for (const { el, enter } of batch) {
        const indexOf = chars.get(el);
        if (!indexOf || !el.isConnected) continue;
        if (enter && from) {
          applyState(el, from);
          run(el, enterKeyframes(from, state.enterTo), {
            ...(state.charTransition as object),
            delay: delayOf(indexOf())
          });
        } else {
          run(el, state.enterTo as DOMKeyframesDefinition, { duration: 0 });
        }
      }
      item.settled = true;
    };

    const registerChar = (el: HTMLElement, indexOf: () => number) => {
      chars.set(el, indexOf);
      pending.push({ el, enter: item.settled || item.animateIn });
      if (!scheduled) {
        scheduled = true;
        queueMicrotask(processPending);
      }
    };

    item.exit = () => {
      const state = motionState();
      const exits: Promise<unknown>[] = [];
      chars.forEach((indexOf, el) => {
        if (!el.isConnected) return;
        const delay = delayOf(indexOf());
        const options = state.exitTransition
          ? { ...(state.exitTransition as object), delay }
          : { ...(state.charTransition as object), delay };
        exits.push(run(el, state.leaveTo as DOMKeyframesDefinition, options).finished);
      });
      return Promise.all(exits);
    };

    return (
      <span
        ref={el => (item.el = el)}
        class={splitBy() === 'lines' ? 'text-rotate-lines' : 'text-rotate'}
        aria-hidden="true"
      >
        <For each={words()} keyed={false}>
          {word => (
            <span class={['text-rotate-word', props.splitLevelClassName]}>
              <For each={word().characters} keyed={false}>
                {(char, charIndex) => (
                  <span
                    ref={el => registerChar(el, () => word().start + charIndex)}
                    class={['text-rotate-element', props.elementLevelClassName]}
                    style={charStyle()}
                  >
                    {char()}
                  </span>
                )}
              </For>
              <Show when={word().needsSpace}>
                <span class="text-rotate-space"> </span>
              </Show>
            </span>
          )}
        </For>
      </span>
    );
  };

  const presence = () => <For each={items()}>{item => renderGroup(item)}</For>;

  return (
    <span
      {...rest}
      ref={el => (outerEl = el)}
      class={['text-rotate', { 'text-rotate-highlight': highlight() }, props.mainClassName, props.className]}
      style={blockStyle()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span class="text-rotate-sr-only">{props.texts?.[activeIndex()]}</span>
      <Show when={highlight()} fallback={presence()}>
        <span ref={el => (contentEl = el)} class="text-rotate-highlight-content">
          {presence()}
        </span>
      </Show>
    </span>
  );
}
