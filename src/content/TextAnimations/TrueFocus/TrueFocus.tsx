import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, type AnimationOptions } from 'motion';
import './TrueFocus.css';

export interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  focusStyle?: 'brackets' | 'box' | 'underline' | 'highlight';
  order?: 'sequential' | 'random';
  easing?: 'smooth' | 'spring';
  blurAmount?: number;
  focusScale?: number;
  borderColor?: string;
  highlightColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
  cornerSize?: number;
  borderWidth?: number;
  unfocusedOpacity?: number;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const FRAME_GAP = 10;
const SMOOTH_EASE = [0.65, 0, 0.35, 1] as const;
const SMOOTH_CSS = 'cubic-bezier(0.65, 0, 0.35, 1)';
const SPRING_CSS = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

type Target = Record<string, number>;

function MotionSpan(props: {
  class: JSX.HTMLAttributes<HTMLSpanElement>['class'];
  target: Target;
  transition: AnimationOptions;
}) {
  let el: HTMLSpanElement | undefined;
  let mounted = false;
  let lastKey = '';
  let controls: { stop: () => void } | null = null;

  createEffect(
    () => ({ target: { ...props.target }, transition: props.transition }),
    ({ target, transition }) => {
      if (!el) return;
      const key = Object.keys(target)
        .map(name => `${name}:${target[name]}`)
        .join('|');
      if (!mounted) {
        mounted = true;
        lastKey = key;
        const held: Record<string, [number, number]> = {};
        for (const name of Object.keys(target)) held[name] = [target[name], target[name]];
        el.style.transform = `translateX(${target.x ?? 0}px) translateY(${target.y ?? 0}px)`;
        if (target.width !== undefined) el.style.width = `${target.width}px`;
        if (target.height !== undefined) el.style.height = `${target.height}px`;
        el.style.opacity = '0';
        controls = animate(el, { ...held, opacity: [0, 1] }, transition);
        return;
      }
      if (key === lastKey) return;
      lastKey = key;
      controls?.stop();
      controls = animate(el, { ...target, opacity: 1 }, transition);
    }
  );

  onSettled(() => () => {
    controls?.stop();
    controls = null;
  });

  return <span ref={node => (el = node)} class={props.class} aria-hidden="true" />;
}

export default function TrueFocus(props: TrueFocusProps) {
  let containerEl: HTMLDivElement | undefined;
  const wordEls: (HTMLSpanElement | undefined)[] = [];

  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [focusRect, setFocusRect] = createSignal<FocusRect | null>(null);
  const [reduceMotion, setReduceMotion] = createSignal(false);

  const sentence = () => props.sentence ?? 'True Focus';
  const separator = () => props.separator ?? ' ';
  const manualMode = () => props.manualMode ?? false;
  const focusStyle = () => props.focusStyle ?? 'brackets';
  const order = () => props.order ?? 'sequential';
  const easing = () => props.easing ?? 'smooth';
  const blurAmount = () => props.blurAmount ?? 5;
  const focusScale = () => props.focusScale ?? 1;
  const borderColor = () => props.borderColor ?? 'green';
  const glowColor = () => props.glowColor ?? 'transparent';
  const animationDuration = () => props.animationDuration ?? 0.5;
  const pauseBetweenAnimations = () => props.pauseBetweenAnimations ?? 1;
  const cornerSize = () => props.cornerSize ?? 16;
  const borderWidth = () => props.borderWidth ?? 3;
  const unfocusedOpacity = () => props.unfocusedOpacity ?? 1;

  const words = createMemo(() =>
    sentence()
      .split(separator())
      .filter(word => word.trim() !== '')
  );
  const duration = createMemo(() => (reduceMotion() ? 0 : animationDuration()));
  const activeIndex = createMemo(() => (words().length ? currentIndex() % words().length : -1));
  const spring = createMemo(() => easing() === 'spring' && !reduceMotion());
  const transition = createMemo<AnimationOptions>(() =>
    spring()
      ? { type: 'spring', visualDuration: duration(), bounce: 0.38 }
      : { duration: duration(), ease: [...SMOOTH_EASE] }
  );

  onSettled(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    setReduceMotion(query.matches);
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  });

  createEffect(
    () => ({
      manual: manualMode(),
      animationDuration: animationDuration(),
      pause: pauseBetweenAnimations(),
      length: words().length,
      order: order()
    }),
    ({ manual, animationDuration, pause, length, order }) => {
      if (manual || length < 2) return;
      const interval = setInterval(
        () => {
          const roll = Math.random();
          setCurrentIndex(prev => {
            const current = prev % length;
            if (order !== 'random') return (current + 1) % length;
            const next = Math.floor(roll * (length - 1));
            return next >= current ? next + 1 : next;
          });
        },
        (animationDuration + pause) * 1000
      );
      return () => clearInterval(interval);
    }
  );

  createEffect(
    () => ({ index: activeIndex(), words: words() }),
    ({ index, words }) => {
      wordEls.length = words.length;
      const container = containerEl;
      const word = wordEls[index];
      if (!container || !word) return;

      const measure = () => {
        const next = { x: word.offsetLeft, y: word.offsetTop, width: word.offsetWidth, height: word.offsetHeight };
        setFocusRect(prev =>
          prev && prev.x === next.x && prev.y === next.y && prev.width === next.width && prev.height === next.height
            ? prev
            : next
        );
      };

      measure();
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(container);
      wordEls.forEach(node => node && observer.observe(node));
      return () => observer.disconnect();
    }
  );

  const frame = createMemo<FocusRect | null>(() => {
    const rect = focusRect();
    if (!rect) return null;
    const scale = focusScale();
    return {
      x: rect.x - (rect.width * (scale - 1)) / 2,
      y: rect.y - (rect.height * (scale - 1)) / 2,
      width: rect.width * scale,
      height: rect.height * scale
    };
  });

  const corners = createMemo<Record<Corner, { x: number; y: number }> | null>(() => {
    const f = frame();
    if (!f) return null;
    const size = cornerSize();
    return {
      'top-left': { x: f.x - FRAME_GAP, y: f.y - FRAME_GAP },
      'top-right': { x: f.x + f.width + FRAME_GAP - size, y: f.y - FRAME_GAP },
      'bottom-left': { x: f.x - FRAME_GAP, y: f.y + f.height + FRAME_GAP - size },
      'bottom-right': {
        x: f.x + f.width + FRAME_GAP - size,
        y: f.y + f.height + FRAME_GAP - size
      }
    };
  });

  const shapes = createMemo(() => {
    const f = frame();
    if (!f) return null;
    return {
      box: {
        x: f.x - FRAME_GAP,
        y: f.y - FRAME_GAP,
        width: f.width + FRAME_GAP * 2,
        height: f.height + FRAME_GAP * 2
      },
      underline: {
        x: f.x,
        y: f.y + f.height + FRAME_GAP * 0.4,
        width: f.width,
        height: borderWidth()
      },
      highlight: {
        x: f.x - f.height * 0.14,
        y: f.y + f.height * 0.04,
        width: f.width + f.height * 0.28,
        height: f.height * 0.92
      }
    };
  });

  const cornerTarget = (corner: Corner): Target => {
    const c = corners()?.[corner];
    return c ? { x: c.x, y: c.y } : { x: 0, y: 0 };
  };

  const frameStyle = createMemo<JSX.CSSProperties>(() => ({
    '--border-color': borderColor(),
    '--highlight-color': `color-mix(in srgb, ${props.highlightColor ?? borderColor()} 30%, transparent)`,
    '--glow-color': glowColor(),
    '--corner-size': `${cornerSize()}px`,
    '--border-width': `${borderWidth()}px`
  }));

  const wordStyle = (isActive: boolean): JSX.CSSProperties => ({
    filter: `blur(${isActive ? 0 : blurAmount()}px)`,
    opacity: isActive ? 1 : unfocusedOpacity(),
    transform: focusScale() !== 1 ? `scale(${isActive ? focusScale() : 1})` : undefined,
    transition: `filter ${duration()}s ease, opacity ${duration()}s ease, transform ${duration()}s ${spring() ? SPRING_CSS : SMOOTH_CSS}`
  });

  return (
    <div class="focus-container" ref={el => (containerEl = el)} style={frameStyle()}>
      <Show when={focusStyle() === 'highlight' && shapes()}>
        <MotionSpan class="focus-highlight" target={shapes()!.highlight} transition={transition()} />
      </Show>

      <For each={words()} keyed={false}>
        {(word, index) => (
          <span
            ref={el => (wordEls[index] = el)}
            class={['focus-word', { manual: manualMode(), active: index === activeIndex() && !manualMode() }]}
            style={wordStyle(index === activeIndex())}
            onMouseEnter={() => {
              if (manualMode()) setCurrentIndex(index);
            }}
          >
            {word()}
          </span>
        )}
      </For>

      <Show when={shapes() && corners() && focusStyle() !== 'highlight'}>
        <div class="focus-frame" aria-hidden="true">
          <Show when={focusStyle() === 'box'}>
            <MotionSpan class="focus-box" target={shapes()!.box} transition={transition()} />
          </Show>
          <Show when={focusStyle() === 'underline'}>
            <MotionSpan class="focus-underline" target={shapes()!.underline} transition={transition()} />
          </Show>
          <Show when={focusStyle() !== 'box' && focusStyle() !== 'underline'}>
            <For each={CORNERS}>
              {corner => (
                <MotionSpan class={['corner', corner]} target={cornerTarget(corner)} transition={transition()} />
              )}
            </For>
          </Show>
        </div>
      </Show>
    </div>
  );
}
