import { For, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { attachSpring, cancelFrame, frame, motionValue, scroll, transform, type FrameData } from 'motion';

import './ScrollVelocity.css';

interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

interface VelocityTextProps {
  children: JSX.Element;
  baseVelocity: number;
  scrollContainerRef?: HTMLElement | null;
  copyClass?: string;
  damping: number;
  stiffness: number;
  numCopies: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: JSX.CSSProperties;
  scrollerStyle?: JSX.CSSProperties;
  separator?: JSX.Element;
  pauseOnHover: boolean;
  hoveredRef: { current: boolean };
  skewWithVelocity: number;
  scaleWithVelocity: number;
  outline: boolean;
  gap: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  draggable: boolean;
}

export interface ScrollVelocityProps {
  scrollContainerRef?: HTMLElement | null;
  texts: JSX.Element[];
  velocity?: number;
  className?: string;
  damping?: number;
  stiffness?: number;
  numCopies?: number;
  velocityMapping?: VelocityMapping;
  parallaxClassName?: string;
  scrollerClassName?: string;
  parallaxStyle?: JSX.CSSProperties;
  scrollerStyle?: JSX.CSSProperties;
  separator?: JSX.Element;
  pauseOnHover?: boolean;
  fadeEdges?: boolean;
  skewWithVelocity?: number;
  scaleWithVelocity?: number;
  outlineAlternate?: boolean;
  gap?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  draggable?: boolean;
}

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const FADE_STEPS = Array.from({ length: 9 }, (_, i) => i / 8);

const FADE_MASK = `linear-gradient(to right, ${[
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * 12).toFixed(1)}%`),
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(1 - t).toFixed(3)}) ${(88 + t * 12).toFixed(1)}%`)
].join(', ')})`;

const OUTLINE_STYLE: JSX.CSSProperties = {
  '-webkit-text-fill-color': 'transparent',
  '-webkit-text-stroke': 'max(1px, 0.028em) currentColor'
};

const NBSP = String.fromCharCode(160);

const DEFAULT_MAPPING: VelocityMapping = { input: [0, 1000], output: [0, 5] };

function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  const mod = (((v - min) % range) + range) % range;
  return mod + min;
}

function VelocityText(props: VelocityTextProps) {
  let parallaxEl: HTMLDivElement | undefined;
  let scrollerEl: HTMLDivElement | undefined;
  let copyEl: HTMLSpanElement | undefined;

  const scrollY = motionValue(0);
  const scrollVelocity = motionValue(0);
  const smoothVelocity = motionValue(0);

  let baseX = 0;
  let skewX = 0;
  let scaleY = 1;
  let copyWidth = 0;
  let reduceMotion = false;
  let directionFactor = 1;
  let pace = 1;
  let fling = 0;
  const drag = { active: false, pointerId: -1, lastX: 0, lastTime: 0, velocity: 0, travel: 0 };

  createEffect(
    () => props.scrollContainerRef,
    container =>
      scroll(
        (_progress, info) => {
          scrollY.set(info.y.current);
        },
        container ? { container } : {}
      )
  );

  createEffect(
    () => ({ damping: props.damping, stiffness: props.stiffness }),
    options => attachSpring(smoothVelocity, scrollVelocity, options)
  );

  const copies = createMemo(() => Array.from({ length: Math.max(0, props.numCopies) }, (_, i) => i));

  const typeStyle = createMemo<JSX.CSSProperties>(() => {
    const fontSize = props.fontSize;
    const fontWeight = props.fontWeight;
    const color = props.color;
    return {
      ...(fontSize !== undefined
        ? { 'font-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, 'line-height': 1 }
        : {}),
      ...(fontWeight !== undefined ? { 'font-weight': fontWeight } : {}),
      ...(color ? { color } : {}),
      ...(props.outline ? OUTLINE_STYLE : {})
    };
  });

  const parallaxStyle = createMemo<JSX.CSSProperties>(() => ({
    ...(props.draggable
      ? { cursor: 'grab', 'user-select': 'none', '-webkit-user-select': 'none', 'touch-action': 'pan-y' }
      : {}),
    ...props.parallaxStyle
  }));

  const render = () => {
    const scroller = scrollerEl;
    if (!scroller) return;
    const x = copyWidth === 0 ? 0 : wrap(-copyWidth, 0, baseX);
    const parts: string[] = [];
    if (x !== 0) parts.push(`translateX(${x}px)`);
    if (scaleY !== 1) parts.push(`scaleY(${scaleY})`);
    if (skewX !== 0) parts.push(`skewX(${skewX}deg)`);
    scroller.style.transform = parts.length ? parts.join(' ') : 'none';
  };

  const tick = ({ delta }: FrameData) => {
    if (reduceMotion) {
      render();
      return;
    }

    const baseVelocity = props.baseVelocity;
    const skewWithVelocity = props.skewWithVelocity;
    const scaleWithVelocity = props.scaleWithVelocity;
    const mapping = props.velocityMapping;
    const velocityFactor = transform(
      smoothVelocity.get(),
      mapping?.input || DEFAULT_MAPPING.input,
      mapping?.output || DEFAULT_MAPPING.output,
      { clamp: false }
    );

    const grab = drag;
    const seconds = Math.min(delta, 64) / 1000;
    const targetPace = grab.active || (props.pauseOnHover && props.hoveredRef.current) ? 0 : 1;
    pace += (targetPace - pace) * (1 - Math.exp(-delta / 150));

    let moveBy = directionFactor * baseVelocity * (delta / 1000);

    if (velocityFactor < 0) {
      directionFactor = -1;
    } else if (velocityFactor > 0) {
      directionFactor = 1;
    }

    moveBy += directionFactor * moveBy * velocityFactor;
    let travel = moveBy * pace;

    if (!grab.active && fling !== 0) {
      travel += fling * seconds;
      fling *= Math.exp(-delta / 420);
      if (Math.abs(fling) < 4) fling = 0;
    }

    baseX += travel;

    if (!skewWithVelocity && !scaleWithVelocity && skewX === 0 && scaleY === 1) {
      render();
      return;
    }

    const thrown = grab.active ? grab.velocity : fling;
    const scrollSurge = Math.tanh(Math.abs(smoothVelocity.get()) / 1600) * pace;
    const throwSurge = Math.tanh(Math.abs(thrown) / 2000);
    const surge = Math.max(scrollSurge, throwSurge);
    const heading =
      throwSurge > scrollSurge ? Math.sign(thrown) : Math.sign(travel) || directionFactor * Math.sign(baseVelocity);
    const ease = 1 - Math.exp(-delta / 110);
    const nextSkew = skewX + (-heading * skewWithVelocity * surge - skewX) * ease;
    const nextScale = scaleY + (1 + scaleWithVelocity * surge - scaleY) * ease;
    skewX = Math.abs(nextSkew) < 0.01 && !skewWithVelocity ? 0 : nextSkew;
    scaleY = Math.abs(nextScale - 1) < 0.0005 && !scaleWithVelocity ? 1 : nextScale;
    render();
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!props.draggable || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const target = event.currentTarget as HTMLDivElement;
    const grab = drag;
    grab.active = true;
    grab.pointerId = event.pointerId;
    grab.lastX = event.clientX;
    grab.lastTime = event.timeStamp;
    grab.velocity = 0;
    grab.travel = 0;
    fling = 0;
    target.setPointerCapture?.(event.pointerId);
    target.style.cursor = 'grabbing';
  };

  const handlePointerMove = (event: PointerEvent) => {
    const grab = drag;
    if (!grab.active || event.pointerId !== grab.pointerId) return;
    const dx = event.clientX - grab.lastX;
    const dt = Math.max(event.timeStamp - grab.lastTime, 1);
    grab.lastX = event.clientX;
    grab.lastTime = event.timeStamp;
    grab.travel += Math.abs(dx);
    baseX += dx;
    render();
    grab.velocity += ((dx / dt) * 1000 - grab.velocity) * (1 - Math.exp(-dt / 50));
  };

  const handlePointerUp = (event: PointerEvent) => {
    const grab = drag;
    if (!grab.active || event.pointerId !== grab.pointerId) return;
    const target = event.currentTarget as HTMLDivElement;
    grab.active = false;
    const resting = event.timeStamp - grab.lastTime > 90;
    fling = resting ? 0 : Math.max(-5000, Math.min(5000, grab.velocity));
    grab.velocity = 0;
    if (target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
    target.style.cursor = 'grab';
  };

  const handleClickCapture = (event: MouseEvent) => {
    if (!props.draggable) return;
    if (drag.travel > 6) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  onSettled(() => {
    const parallax = parallaxEl;
    const copy = copyEl;

    const updateVelocity = () => {
      const latest = scrollY.getVelocity();
      scrollVelocity.set(latest);
      if (latest) frame.update(updateVelocity);
    };
    const unsubscribe = scrollY.on('change', () => {
      frame.update(updateVelocity, false, true);
    });

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    reduceMotion = Boolean(motionQuery?.matches);
    const onMotionChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
    };
    motionQuery?.addEventListener?.('change', onMotionChange);

    let observer: ResizeObserver | null = null;
    const updateWidth = () => {
      if (copy) copyWidth = copy.offsetWidth;
    };
    if (copy) {
      if (typeof ResizeObserver === 'undefined') {
        updateWidth();
        window.addEventListener('resize', updateWidth);
      } else {
        observer = new ResizeObserver(([entry]) => {
          copyWidth = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        });
        observer.observe(copy);
      }
    }

    parallax?.addEventListener('click', handleClickCapture, true);
    frame.update(tick, true);
    render();

    return () => {
      cancelFrame(tick);
      cancelFrame(updateVelocity);
      unsubscribe();
      motionQuery?.removeEventListener?.('change', onMotionChange);
      observer?.disconnect();
      window.removeEventListener('resize', updateWidth);
      parallax?.removeEventListener('click', handleClickCapture, true);
      scrollY.destroy();
      scrollVelocity.destroy();
      smoothVelocity.destroy();
    };
  });

  return (
    <div
      ref={el => (parallaxEl = el)}
      class={props.parallaxClassName}
      style={parallaxStyle()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        ref={el => (scrollerEl = el)}
        class={props.scrollerClassName}
        style={{ ...typeStyle(), ...props.scrollerStyle }}
      >
        <For each={copies()}>
          {i => (
            <span
              class={props.copyClass}
              ref={el => {
                if (i === 0) copyEl = el;
              }}
              aria-hidden={i > 0 ? 'true' : undefined}
              style={!props.separator && props.gap > 0 ? { 'padding-right': `${props.gap}px` } : undefined}
            >
              {props.children}
              {NBSP}
              {props.separator ? (
                <>
                  <span style={props.gap > 0 ? { margin: `0 ${props.gap / 2}px` } : undefined}>{props.separator}</span>
                  {NBSP}
                </>
              ) : null}
            </span>
          )}
        </For>
      </div>
    </div>
  );
}

export default function ScrollVelocity(props: ScrollVelocityProps) {
  const hoveredRef = { current: false };

  const sectionStyle = createMemo<JSX.CSSProperties>(() => ({
    width: '100%',
    ...(props.fadeEdges ? { '-webkit-mask-image': FADE_MASK, 'mask-image': FADE_MASK } : {})
  }));

  return (
    <section
      style={sectionStyle()}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <For each={props.texts ?? []} keyed={false}>
        {(text, index) => (
          <VelocityText
            copyClass={props.className ?? ''}
            baseVelocity={index % 2 !== 0 ? -(props.velocity ?? 100) : (props.velocity ?? 100)}
            scrollContainerRef={props.scrollContainerRef}
            damping={props.damping ?? 50}
            stiffness={props.stiffness ?? 400}
            numCopies={props.numCopies ?? 6}
            velocityMapping={props.velocityMapping ?? DEFAULT_MAPPING}
            parallaxClassName={props.parallaxClassName ?? 'parallax'}
            scrollerClassName={props.scrollerClassName ?? 'scroller'}
            parallaxStyle={props.parallaxStyle}
            scrollerStyle={props.scrollerStyle}
            separator={props.separator ?? ''}
            pauseOnHover={props.pauseOnHover ?? false}
            hoveredRef={hoveredRef}
            skewWithVelocity={props.skewWithVelocity ?? 0}
            scaleWithVelocity={props.scaleWithVelocity ?? 0}
            outline={(props.outlineAlternate ?? false) && index % 2 !== 0}
            gap={props.gap ?? 0}
            fontSize={props.fontSize}
            fontWeight={props.fontWeight}
            color={props.color}
            draggable={props.draggable ?? false}
          >
            {text()}
          </VelocityText>
        )}
      </For>
    </section>
  );
}
