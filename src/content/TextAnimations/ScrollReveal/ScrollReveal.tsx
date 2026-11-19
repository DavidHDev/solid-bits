import { For, Show, children, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

gsap.registerPlugin(ScrollTrigger);

const SCRUB_SPAN = 0.5;
const RISE_MASK = 'inset(-1em -1em -0.15em -1em)';

type RevealSplit = 'words' | 'chars' | 'lines';
type RevealEffect = 'fade' | 'rise' | 'flip' | 'scale';
type RevealMode = 'scrub' | 'enter';

export interface ScrollRevealProps {
  children: JSX.Element;
  scrollContainerRef?: HTMLElement | null;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  baseOffset?: number;
  stagger?: number;
  smoothing?: number;
  splitBy?: RevealSplit;
  effect?: RevealEffect;
  mode?: RevealMode;
  duration?: number;
  highlightColor?: string;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

interface RevealLook {
  effect: RevealEffect;
  masked: boolean;
  baseOpacity: number;
  blur: number;
  offset: number;
  highlightColor: string;
}

type Settings = {
  scroller: HTMLElement | null | undefined;
  text: string | null;
  splitBy: RevealSplit;
  effect: RevealEffect;
  mode: RevealMode;
  duration: number;
  highlightColor: string;
  enableBlur: boolean;
  baseOpacity: number;
  baseRotation: number;
  blurStrength: number;
  baseOffset: number;
  stagger: number;
  smoothing: number;
  rotationEnd: string;
  wordAnimationEnd: string;
};

type Segment = { word: string; space: boolean; pieces: string[] };

const clampToScroll = (position: string) =>
  typeof position === 'string' && !position.startsWith('clamp(') ? `clamp(${position})` : position;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const smooth = (value: number) => value * value * (3 - 2 * value);
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
const easeBack = (value: number, overshoot: number) => {
  const shifted = value - 1;
  return 1 + (overshoot + 1) * shifted * shifted * shifted + overshoot * shifted * shifted;
};
const glowAt = (t: number) => (t <= 0 || t >= 1 ? 0 : t < 0.35 ? smooth(t / 0.35) : 1 - smooth((t - 0.35) / 0.65));

const paintPiece = (piece: HTMLElement, t: number, look: RevealLook) => {
  let reveal = t;
  let fadeIn = t;
  let motion = '';
  if (look.effect === 'rise') {
    reveal = easeOut(t);
    fadeIn = clamp01(reveal * 1.25);
    if (reveal < 1) {
      motion = look.masked
        ? `translateY(${((1 - reveal) * 100).toFixed(2)}%) translateY(${((1 - reveal) * 0.2).toFixed(3)}em)`
        : `translateY(${((1 - reveal) * 0.8).toFixed(3)}em)`;
    }
  } else if (look.effect === 'flip') {
    reveal = easeBack(t, 1.2);
    fadeIn = clamp01(t * 2);
    if (t < 1) motion = `perspective(6em) rotateX(${((1 - reveal) * 90).toFixed(2)}deg)`;
  } else if (look.effect === 'scale') {
    reveal = easeBack(t, 1.6);
    fadeIn = clamp01(t * 1.6);
    if (t < 1) motion = `scale(${(0.35 + 0.65 * reveal).toFixed(4)})`;
  }
  if (look.highlightColor) fadeIn = Math.max(fadeIn, clamp01(t / 0.35));
  const settle = clamp01(reveal);
  const lift = look.offset * (1 - settle);
  piece.style.opacity = t >= 1 ? '' : (look.baseOpacity + (1 - look.baseOpacity) * fadeIn).toFixed(3);
  piece.style.transform = [lift ? `translateY(${lift.toFixed(2)}px)` : '', motion].filter(Boolean).join(' ');
  piece.style.filter = look.blur && settle < 1 ? `blur(${(look.blur * (1 - settle)).toFixed(2)}px)` : '';
  if (look.highlightColor) {
    const glow = glowAt(t);
    piece.style.color =
      glow > 0.002 ? `color-mix(in srgb, ${look.highlightColor} ${(glow * 100).toFixed(1)}%, currentColor)` : '';
  }
};

export default function ScrollReveal(props: ScrollRevealProps) {
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

  const segments = createMemo<Segment[]>(() => {
    const value = text();
    if (value === null) return [];
    const chars = props.splitBy === 'chars';
    return value
      .split(/(\s+)/)
      .map(word =>
        word.trim() === ''
          ? { word, space: true, pieces: [] }
          : { word, space: false, pieces: chars ? Array.from(word) : [word] }
      );
  });

  const settings = createMemo<Settings>(() => ({
    scroller: props.scrollContainerRef,
    text: text(),
    splitBy: props.splitBy ?? 'words',
    effect: props.effect ?? 'fade',
    mode: props.mode ?? 'scrub',
    duration: props.duration ?? 0.8,
    highlightColor: props.highlightColor ?? '',
    enableBlur: props.enableBlur ?? true,
    baseOpacity: props.baseOpacity ?? 0.1,
    baseRotation: props.baseRotation ?? 3,
    blurStrength: props.blurStrength ?? 4,
    baseOffset: props.baseOffset ?? 0,
    stagger: props.stagger ?? 0.05,
    smoothing: props.smoothing ?? 0,
    rotationEnd: props.rotationEnd ?? 'bottom bottom',
    wordAnimationEnd: props.wordAnimationEnd ?? 'bottom bottom'
  }));

  const setup = (s: Settings) => {
    const el = containerEl;
    const textNode = textEl;
    if (!el || !textNode) return null;
    if (s.scroller === null) return null;

    const scroller = s.scroller || window;
    const wrappers = Array.from(el.querySelectorAll<HTMLElement>('.scroll-reveal-word'));
    const pieces = wrappers.length ? Array.from(el.querySelectorAll<HTMLElement>('.scroll-reveal-piece')) : [textNode];
    const viewportHeight = () => (scroller instanceof HTMLElement ? scroller.clientHeight : window.innerHeight);
    const scrub = s.smoothing > 0 ? s.smoothing : true;
    const span = s.mode === 'enter' ? Math.max(0.05, s.duration) : SCRUB_SPAN;
    const gap = Math.max(0, s.stagger);
    const look: RevealLook = {
      effect: s.effect,
      masked: s.effect === 'rise' && wrappers.length > 0,
      baseOpacity: s.baseOpacity,
      blur: s.enableBlur ? s.blurStrength : 0,
      offset: s.baseOffset,
      highlightColor: s.highlightColor
    };
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const order = pieces.map((_, index) => index);
      const last = pieces.map(() => -1);
      const state = { p: 0 };
      let count = pieces.length;

      const measure = () => {
        if (s.splitBy !== 'lines' || !wrappers.length) return;
        let line = -1;
        let top = -Infinity;
        wrappers.forEach((wrapper, index) => {
          const next = wrapper.offsetTop;
          if (Math.abs(next - top) > 2) {
            line += 1;
            top = next;
          }
          order[index] = line;
        });
        count = line + 1;
      };

      const total = () => span + Math.max(0, count - 1) * gap;

      const render = () => {
        const at = state.p * total();
        pieces.forEach((piece, index) => {
          const t = clamp01((at - order[index] * gap) / span);
          if (t === last[index]) return;
          last[index] = t;
          paintPiece(piece, t, look);
        });
      };

      measure();
      pieces.forEach(piece => {
        piece.style.willChange =
          pieces.length > 80 ? '' : s.effect === 'fade' && !s.baseOffset ? 'opacity' : 'opacity, transform';
        piece.style.transformOrigin = s.effect === 'flip' ? '50% 100%' : '';
      });
      if (look.masked) {
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = RISE_MASK;
        });
      }
      render();

      if (s.mode === 'enter') {
        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          gsap.to(state, { p: 1, duration: total(), ease: 'none', onUpdate: render });
          if (s.baseRotation) gsap.to(el, { rotate: 0, duration: Math.min(total(), 1.4), ease: 'power3.out' });
        };
        const startAt = () => {
          const view = viewportHeight();
          const top =
            el.getBoundingClientRect().top -
            (scroller instanceof HTMLElement
              ? scroller.getBoundingClientRect().top + scroller.clientTop - scroller.scrollTop
              : -window.scrollY);
          const raw = top - view + 0.2 * Math.min(el.offsetHeight, view);
          return Math.min(raw, ScrollTrigger.maxScroll(scroller) - 1);
        };
        if (s.baseRotation) gsap.set(el, { transformOrigin: '0% 50%', rotate: s.baseRotation });
        ScrollTrigger.create({
          trigger: el,
          scroller,
          start: startAt,
          onEnter: play,
          onLeave: play,
          onRefresh: (self: ScrollTrigger) => {
            if (self.progress > 0) play();
          }
        });
      } else {
        if (s.baseRotation) {
          gsap.fromTo(
            el,
            { transformOrigin: '0% 50%', rotate: s.baseRotation },
            {
              ease: 'none',
              rotate: 0,
              scrollTrigger: {
                trigger: el,
                scroller,
                start: 'top bottom',
                end: clampToScroll(s.rotationEnd),
                scrub
              }
            }
          );
        }
        gsap.to(state, {
          p: 1,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: () => `top bottom-=${0.2 * Math.min(el.offsetHeight, viewportHeight())}`,
            end: clampToScroll(s.wordAnimationEnd),
            scrub
          }
        });
      }

      const resizeObserver =
        s.splitBy === 'lines' && typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => {
              measure();
              last.fill(-1);
              render();
            })
          : null;
      resizeObserver?.observe(textNode);

      return () => {
        resizeObserver?.disconnect();
        pieces.forEach(piece => {
          piece.style.opacity = '';
          piece.style.transform = '';
          piece.style.transformOrigin = '';
          piece.style.filter = '';
          piece.style.color = '';
          piece.style.willChange = '';
        });
        wrappers.forEach(wrapper => {
          wrapper.style.clipPath = '';
        });
      };
    });

    return () => mm.revert();
  };

  const run = () => {
    teardown?.();
    teardown = setup(current);
  };

  createEffect(
    () => ({ value: settings(), layout: segments() }),
    ({ value }) => {
      current = value;
      if (mounted) run();
    }
  );

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
      class={['scroll-reveal', props.containerClassName]}
      aria-label={text() ?? undefined}
    >
      <span
        ref={el => (textEl = el)}
        class={['scroll-reveal-text', props.textClassName]}
        aria-hidden={text() === null ? undefined : 'true'}
      >
        <Show when={text() !== null} fallback={resolved()}>
          <For each={segments()}>
            {segment =>
              segment.space ? (
                segment.word
              ) : (
                <span class="scroll-reveal-word">
                  <For each={segment.pieces}>{piece => <span class="scroll-reveal-piece">{piece}</span>}</For>
                </span>
              )
            }
          </For>
        </Show>
      </span>
    </h2>
  );
}
