import { For, Show, createEffect, createMemo, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './InfiniteSpiral.css';

export interface InfiniteSpiralItem {
  id?: string | number;
  src: string;
  alt?: string;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  label?: string;
}

export interface InfiniteSpiralProps {
  items?: Array<string | InfiniteSpiralItem>;
  speed?: number;
  direction?: 'up' | 'down';
  animationMode?: 'auto' | 'drag' | 'scroll' | 'all';
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  verticalSpacing?: number;
  perspective?: number;
  cardsPerTurn?: number;
  rotation?: number;
  cardTilt?: number;
  cardRadius?: number;
  centerScale?: number;
  edgeFade?: number;
  edgeBlur?: number;
  pauseOnHover?: boolean;
  imageFit?: JSX.CSSProperties['object-fit'];
  grayscale?: number;
  className?: string;
}

type NormalizedItem = InfiniteSpiralItem & { alt: string };

const EMPTY_ITEMS: Array<string | InfiniteSpiralItem> = [];

type Settings = {
  speed: number;
  direction: 'up' | 'down';
  animationMode: 'auto' | 'drag' | 'scroll' | 'all';
  radius: number;
  cardWidth: number;
  cardHeight: number;
  verticalSpacing: number;
  perspective: number;
  cardsPerTurn: number;
  rotation: number;
  cardTilt: number;
  centerScale: number;
  edgeFade: number;
  edgeBlur: number;
  pauseOnHover: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const smoothstep = (min: number, max: number, value: number) => {
  const x = clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
};

export default function InfiniteSpiral(props: InfiniteSpiralProps) {
  let rootEl: HTMLDivElement | undefined;
  const cardRefs: Array<HTMLElement | null> = [];
  let progress = 0;
  let targetProgress = 0;
  let autoSpeed = 0;
  let hovered = false;
  let visible = true;
  let dragging = false;
  let lastPointerY = 0;
  let dragMoved = false;
  let current!: Settings;
  let itemCount = 0;

  const rawItems = createMemo(() => props.items ?? EMPTY_ITEMS);
  const normalizedItems = createMemo<NormalizedItem[]>(() =>
    rawItems().map((item, index) =>
      typeof item === 'string'
        ? { src: item, alt: `Spiral image ${index + 1}` }
        : { alt: `Spiral image ${index + 1}`, ...item }
    )
  );

  const settings = createMemo<Settings>(() => ({
    speed: props.speed ?? 0.55,
    direction: props.direction ?? 'up',
    animationMode: props.animationMode ?? 'auto',
    radius: props.radius ?? 170,
    cardWidth: props.cardWidth ?? 100,
    cardHeight: props.cardHeight ?? 100,
    verticalSpacing: props.verticalSpacing ?? 60,
    perspective: props.perspective ?? 1000,
    cardsPerTurn: props.cardsPerTurn ?? 7,
    rotation: props.rotation ?? 0,
    cardTilt: props.cardTilt ?? 0,
    centerScale: props.centerScale ?? 1.2,
    edgeFade: props.edgeFade ?? 0.3,
    edgeBlur: props.edgeBlur ?? 6,
    pauseOnHover: props.pauseOnHover ?? true
  }));

  createEffect(settings, value => {
    current = value;
  });

  createEffect(
    () => normalizedItems().length,
    count => {
      itemCount = count;
      cardRefs.length = count;
    }
  );

  const dragEnabled = () => {
    const mode = props.animationMode ?? 'auto';
    return mode === 'drag' || mode === 'all';
  };

  const cardRadius = () => props.cardRadius ?? 10;

  const rootStyle = (): JSX.CSSProperties => ({
    perspective: `${props.perspective ?? 1000}px`,
    '--infinite-spiral-card-width': `${props.cardWidth ?? 100}px`,
    '--infinite-spiral-card-height': `${props.cardHeight ?? 100}px`,
    '--infinite-spiral-card-radius': `${cardRadius()}px`,
    cursor: dragEnabled() ? 'grab' : 'default',
    'touch-action': dragEnabled() ? 'pan-x' : 'auto',
    'user-select': dragEnabled() ? 'none' : 'auto'
  });

  const cardStyle = (): JSX.CSSProperties => ({
    width: `${props.cardWidth ?? 100}px`,
    height: `${props.cardHeight ?? 100}px`,
    'border-radius': `${cardRadius()}px`
  });

  const imageStyle = (): JSX.CSSProperties => ({
    width: `${props.cardWidth ?? 100}px`,
    height: `${props.cardHeight ?? 100}px`,
    'max-width': 'none',
    'max-height': 'none',
    'object-fit': props.imageFit ?? 'cover',
    filter: `grayscale(${Math.min(1, Math.max(0, props.grayscale ?? 0))})`
  });

  onSettled(() => {
    current = settings();
    itemCount = normalizedItems().length;
    const root = rootEl;
    if (!root) return;

    let frameId = 0;
    let previousTime = performance.now();
    let bounds = root.getBoundingClientRect();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lastScrollY = window.scrollY;
    const resizeObserver = new ResizeObserver(() => {
      bounds = root.getBoundingClientRect();
    });
    resizeObserver.observe(root);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    intersectionObserver.observe(root);

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      const scrollEnabled = current.animationMode === 'scroll' || current.animationMode === 'all';
      const scrollSpeedMultiplier = Math.max(current.speed, 0) / 0.55;
      if (!scrollEnabled || !visible || scrollDelta === 0) return;
      targetProgress += clamp(
        (scrollDelta * scrollSpeedMultiplier) / Math.max(current.verticalSpacing * 2, 1),
        -1.5,
        1.5
      );
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleClickCapture = (event: MouseEvent) => {
      if (!dragMoved) return;
      event.preventDefault();
      event.stopPropagation();
      dragMoved = false;
    };
    root.addEventListener('click', handleClickCapture, true);

    const render = (time: number) => {
      const s = current;
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const autoEnabled = s.animationMode === 'auto' || s.animationMode === 'all';
      const motionPaused = dragging || (s.pauseOnHover && hovered);
      const directionMultiplier = s.direction === 'down' ? -1 : 1;
      const desiredAutoSpeed =
        autoEnabled && visible && !reducedMotion.matches && !motionPaused ? s.speed * directionMultiplier : 0;
      const speedBlend = 1 - Math.exp(-delta * 7);
      autoSpeed += (desiredAutoSpeed - autoSpeed) * speedBlend;
      targetProgress += autoSpeed * delta;

      const followBlend = 1 - Math.exp(-delta * (dragging ? 22 : 11));
      progress += (targetProgress - progress) * followBlend;

      const count = itemCount;
      if (count > 0) {
        const half = count / 2;
        const width = Math.max(bounds.width, 1);
        const height = Math.max(bounds.height, 1);
        const fit = Math.min(1, width / (s.cardWidth * 2.8), height / (s.cardHeight * 2.35));
        const responsiveRadius = Math.min(s.radius, Math.max(72, width * 0.36)) * fit;
        const fadeStart = clamp(1 - s.edgeFade, 0, 0.98);
        const turnSize = Math.max(s.cardsPerTurn, 1);

        cardRefs.forEach((card, index) => {
          if (!card) return;
          const offset = modulo(index - progress + half, count) - half;
          const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
          const opacity = 1 - smoothstep(fadeStart, 1, edge);
          const focus = 1 - Math.min(Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1);
          const scale = (1 + (s.centerScale - 1) * focus) * fit;
          const angle = offset * (360 / turnSize) + s.rotation;
          const angleRadians = (angle * Math.PI) / 180;
          const x = Math.sin(angleRadians) * responsiveRadius;
          const z = Math.cos(angleRadians) * responsiveRadius;
          const depthScale = clamp(s.perspective / Math.max(s.perspective - z, 1), 0.72, 1.45);
          const visualScale = scale * depthScale;
          const depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;
          const blur = s.edgeBlur * smoothstep(0.35, 1, edge);
          card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${offset * s.verticalSpacing * fit}px, 0) rotateZ(${s.cardTilt}deg) scale(${visualScale})`;
          card.style.opacity = opacity.toFixed(3);
          card.style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';
          card.style.zIndex = String(Math.round(depth * 100000) + index);
          card.style.pointerEvents = opacity > 0.25 ? 'auto' : 'none';
        });
      }
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      root.removeEventListener('click', handleClickCapture, true);
    };
  });

  const stopDragging = (event: PointerEvent) => {
    const root = rootEl;
    if (!dragging || !root) return;
    dragging = false;
    if (root.hasPointerCapture(event.pointerId)) {
      root.releasePointerCapture(event.pointerId);
    }
    root.style.cursor = dragEnabled() ? 'grab' : 'default';
  };

  return (
    <div
      ref={el => (rootEl = el)}
      class={['infinite-spiral', props.className]}
      style={rootStyle()}
      onMouseEnter={() => {
        hovered = true;
      }}
      onMouseLeave={() => {
        hovered = false;
      }}
      onPointerDown={event => {
        const root = rootEl;
        if (!dragEnabled() || event.button !== 0 || !root) return;
        dragging = true;
        dragMoved = false;
        lastPointerY = event.clientY;
        targetProgress = progress;
        root.setPointerCapture(event.pointerId);
        root.style.cursor = 'grabbing';
      }}
      onPointerMove={event => {
        if (!dragging) return;
        const pointerDelta = event.clientY - lastPointerY;
        lastPointerY = event.clientY;
        if (Math.abs(pointerDelta) > 0.5) dragMoved = true;
        targetProgress -= pointerDelta / Math.max(props.verticalSpacing ?? 60, 1);
      }}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      <div class="infinite-spiral__stage" role="list" aria-label="Infinite spiral gallery">
        <For each={normalizedItems()}>
          {(item, index) => {
            const content = (
              <img
                class="infinite-spiral__image"
                src={item.src}
                alt={item.alt}
                loading={index() < 6 ? 'eager' : 'lazy'}
                draggable="false"
                style={imageStyle()}
              />
            );
            const setRef = (node: HTMLElement) => {
              cardRefs[untrack(index)] = node;
            };
            return (
              <Show
                when={item.href}
                fallback={
                  <div
                    ref={setRef}
                    class="infinite-spiral__item"
                    style={cardStyle()}
                    role="listitem"
                    aria-label={item.label ?? item.alt}
                  >
                    {content}
                  </div>
                }
              >
                <a
                  ref={setRef}
                  class="infinite-spiral__item"
                  style={cardStyle()}
                  href={item.href}
                  target={item.target}
                  rel={item.target === '_blank' ? 'noreferrer' : undefined}
                  role="listitem"
                  aria-label={item.label ?? item.alt}
                >
                  {content}
                </a>
              </Show>
            );
          }}
        </For>
      </div>
    </div>
  );
}
