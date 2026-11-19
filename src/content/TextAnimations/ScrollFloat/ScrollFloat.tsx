import { For, Show, children, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

type ScrollFloatEffect = 'float' | 'flip' | 'scatter' | 'blur' | 'wave';
type ScrollFloatSplit = 'chars' | 'words';
type ScrollFloatDirection = 'up' | 'down';
type ScrollFloatOrder = 'start' | 'end' | 'center' | 'edges' | 'random';

export interface ScrollFloatProps {
  children: JSX.Element;
  scrollContainerRef?: HTMLElement | null;
  containerClassName?: string;
  textClassName?: string;
  effect?: ScrollFloatEffect;
  splitBy?: ScrollFloatSplit;
  direction?: ScrollFloatDirection;
  order?: ScrollFloatOrder;
  fromColor?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  stagger?: number;
  distance?: number;
  stretch?: number;
  smoothing?: number;
}

type Settings = {
  scroller: HTMLElement | null | undefined;
  text: string | null;
  effect: ScrollFloatEffect;
  splitBy: ScrollFloatSplit;
  direction: ScrollFloatDirection;
  order: ScrollFloatOrder;
  shiftColor: string | null;
  animationDuration: number;
  ease: string;
  scrollStart: string;
  scrollEnd: string;
  stagger: number;
  distance: number;
  stretch: number;
  smoothing: number;
};

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const smoothstep = (from: number, to: number, value: number) => {
  const k = clamp01((value - from) / (to - from));
  return k * k * (3 - 2 * k);
};

const random = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const getDelays = (count: number, order: ScrollFloatOrder, stagger: number) => {
  const middle = (count - 1) / 2;
  const ranks = Array.from({ length: count }, (_, index) => {
    if (order === 'end') return count - 1 - index;
    if (order === 'center') return Math.abs(index - middle);
    if (order === 'edges') return middle - Math.abs(index - middle);
    return index;
  });
  if (order === 'random') {
    const shuffled = ranks.map((_, index) => index).sort((a, b) => random(a, 9) - random(b, 9));
    shuffled.forEach((target, rank) => {
      ranks[target] = rank;
    });
  }
  const first = Math.min(...ranks);
  return ranks.map(rank => (rank - first) * Math.max(0, stagger));
};

export default function ScrollFloat(props: ScrollFloatProps) {
  let containerEl: HTMLHeadingElement | undefined;
  let textEl: HTMLSpanElement | undefined;
  let current!: Settings;
  let mounted = false;
  let teardown: (() => void) | null = null;

  const resolved = children(() => props.children);

  const text = createMemo(() => {
    const parts = resolved.toArray();
    return parts.every(part => typeof part === 'string' || typeof part === 'number') ? parts.join('') : null;
  });

  const shiftColor = createMemo(() => {
    const value = props.fromColor ?? 'currentColor';
    return value && value !== 'currentColor' ? value : null;
  });

  const shiftStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    const value = shiftColor();
    return value
      ? { color: `color-mix(in oklab, ${value} calc(var(--scroll-float-mix, 0) * 100%), currentColor)` }
      : undefined;
  });

  const words = createMemo(() => (text() === null ? [] : (text() as string).split(/(\s+)/)));

  const effect = () => props.effect ?? 'float';

  const settings = createMemo<Settings>(() => ({
    scroller: props.scrollContainerRef,
    text: text(),
    effect: effect(),
    splitBy: props.splitBy ?? 'chars',
    direction: props.direction ?? 'up',
    order: props.order ?? 'start',
    shiftColor: shiftColor(),
    animationDuration: props.animationDuration ?? 1,
    ease: props.ease ?? 'back.inOut(2)',
    scrollStart: props.scrollStart ?? 'center bottom+=50%',
    scrollEnd: props.scrollEnd ?? 'bottom bottom-=40%',
    stagger: props.stagger ?? 0.03,
    distance: props.distance ?? 120,
    stretch: props.stretch ?? 2.3,
    smoothing: props.smoothing ?? 0
  }));

  const setup = (s: Settings) => {
    const el = containerEl;
    const target = textEl;
    if (!el || !target) return null;
    if (s.scroller === null) return null;

    const scroller = s.scroller || window;
    const pieces = el.querySelectorAll<HTMLElement>(
      s.splitBy === 'words' ? '.scroll-float-word' : '.scroll-float-char'
    );
    const targets: HTMLElement[] = pieces.length ? Array.from(pieces) : [target];
    const indexOf = new Map<Element, number>(targets.map((item, index) => [item, index]));
    const at = (fn: (index: number) => number) => (_: number, item: Element) => fn(indexOf.get(item) ?? 0);
    const middle = (targets.length - 1) / 2;
    const edge = (index: number) => (middle > 0 ? (index - middle) / middle : 0);
    const delays = getDelays(targets.length, s.order, s.stagger);
    const sign = s.direction === 'down' ? -1 : 1;
    const reach = Math.max(0, Number(s.distance) || 0) / 120;
    const squeeze = s.stretch > 0 ? s.stretch ** -0.43 : 1;
    const ease = s.ease;
    const baseEase = gsap.parseEase(ease) || ((p: number) => p);
    const timing = (p: number) => clamp01(baseEase(p));
    const size = () => parseFloat(getComputedStyle(target).fontSize) || 16;
    const swell = (p: number) => {
      const t = timing(p);
      return 1 - Math.cos(t * Math.PI * 2.5) * Math.pow(1 - t, 2.6);
    };
    const sway = (p: number) => {
      const t = timing(p);
      return Math.sin(t * Math.PI * 2.5) * Math.pow(1 - t, 2.6);
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scroller,
          start: s.scrollStart,
          end: clampToScroll(s.scrollEnd),
          scrub: s.smoothing > 0 ? s.smoothing : true,
          invalidateOnRefresh: true
        }
      });
      const add = (fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => {
        gsap.set(targets, { willChange: 'opacity, transform', ...fromVars });
        return timeline.fromTo(
          targets,
          { willChange: 'opacity, transform', ...fromVars },
          { duration: s.animationDuration, stagger: (index: number) => delays[index] || 0, ...toVars },
          0
        );
      };

      if (s.effect === 'flip') {
        add(
          {
            rotationX: -90 * sign,
            transformPerspective: () => size() * 4,
            transformOrigin: () => `50% 50% ${(-size() * 0.55 * reach).toFixed(2)}`,
            backfaceVisibility: 'hidden'
          },
          { ease, rotationX: 0 }
        );
        add({ opacity: 0 }, { ease: (p: number) => smoothstep(0.05, 0.55, timing(p)), opacity: 1 });
      } else if (s.effect === 'scatter') {
        add(
          {
            x: at(index => ((random(index, 1) * 2 - 1) * 1.3 - edge(index) * 0.9) * size() * reach),
            y: at(index => sign * (0.35 + random(index, 2)) * size() * 1.1 * reach),
            rotation: at(index => (random(index, 3) < 0.5 ? -1 : 1) * (40 + random(index, 4) * 120)),
            scale: at(index => 0.35 + random(index, 5) * 0.9),
            transformOrigin: '50% 50%'
          },
          { ease, x: 0, y: 0, rotation: 0, scale: 1 }
        );
        add({ opacity: 0 }, { ease: (p: number) => smoothstep(0, 0.4, timing(p)), opacity: 1 });
      } else if (s.effect === 'blur') {
        add(
          {
            willChange: 'opacity, transform, filter',
            opacity: 0,
            y: () => sign * size() * 0.3 * reach,
            scale: 1.45,
            filter: () => `blur(${(size() * 0.2).toFixed(2)}px)`,
            transformOrigin: '50% 50%'
          },
          { ease, opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
        );
      } else if (s.effect === 'wave') {
        add(
          {
            yPercent: 120 * reach * sign,
            scaleY: s.stretch,
            scaleX: squeeze,
            transformOrigin: sign > 0 ? '50% 100%' : '50% 0%'
          },
          { ease: swell, yPercent: 0, scaleY: 1, scaleX: 1 }
        );
        add({ rotation: 0 }, { ease: sway, rotation: -16 * sign });
        add({ opacity: 0 }, { ease: (p: number) => clamp01(timing(p) * 2.5), opacity: 1 });
      } else {
        add(
          {
            opacity: 0,
            yPercent: 120 * reach * sign,
            scaleY: s.stretch,
            scaleX: squeeze,
            transformOrigin: sign > 0 ? '50% 0%' : '50% 100%'
          },
          { ease, opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1 }
        );
      }

      if (s.shiftColor) {
        add(
          { '--scroll-float-mix': 1 },
          { ease: (p: number) => smoothstep(0.5, 1, timing(p)), '--scroll-float-mix': 0 }
        );
      }
    });

    return () => mm.revert();
  };

  const run = () => {
    teardown?.();
    teardown = setup(current);
  };

  createEffect(settings, value => {
    current = value;
    if (mounted) run();
  });

  onSettled(() => {
    current = settings();
    mounted = true;
    run();
    return () => {
      mounted = false;
      teardown?.();
      teardown = null;
    };
  });

  return (
    <h2
      ref={el => (containerEl = el)}
      class={['scroll-float', { 'scroll-float--open': effect() !== 'float' }, props.containerClassName]}
    >
      <Show when={text() !== null}>
        <span class="scroll-float-sr">{text()}</span>
      </Show>
      <span
        ref={el => (textEl = el)}
        class={['scroll-float-text', props.textClassName]}
        style={text() === null ? shiftStyle() : undefined}
        aria-hidden={text() !== null ? 'true' : undefined}
      >
        <Show when={text() !== null} fallback={resolved()}>
          <For each={words()}>
            {word =>
              word.trim() === '' ? (
                word
              ) : (
                <span class="scroll-float-word">
                  <For each={Array.from(word)}>
                    {char => (
                      <span class="scroll-float-char" style={shiftStyle()}>
                        {char}
                      </span>
                    )}
                  </For>
                </span>
              )
            }
          </For>
        </Show>
      </span>
    </h2>
  );
}
