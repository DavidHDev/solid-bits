import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import gsap from 'gsap';
import './DepthCarousel.css';

export type DepthCarouselItem = string | { image: string; alt?: string };
type TiltDirection = 'left' | 'right';

export interface DepthCarouselProps {
  items?: DepthCarouselItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  tint?: string;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: TiltDirection;
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  blur?: number;
  duration?: number;
  ease?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number, item: { image: string; alt?: string }) => void;
  className?: string;
}

interface CarouselConfig {
  count: number;
  depth: number;
  spread: number;
  tilt: number;
  tiltDirection: TiltDirection;
  visibleCards: number;
  falloff: number;
  blur: number;
  duration: number;
  ease: string;
  loop: boolean;
  cardWidth: number;
  cardHeight: number;
  radius: number;
  autoplayDelay: number;
}

interface DragState {
  x: number;
  startPos: number;
  lastX: number;
  lastT: number;
  v: number;
  moved: boolean;
  id: number;
}

const DEFAULT_ITEMS: DepthCarouselItem[] = [
  { image: 'https://picsum.photos/seed/depth1/800/1000', alt: 'Slide 1' },
  { image: 'https://picsum.photos/seed/depth2/800/1000', alt: 'Slide 2' },
  { image: 'https://picsum.photos/seed/depth3/800/1000', alt: 'Slide 3' },
  { image: 'https://picsum.photos/seed/depth4/800/1000', alt: 'Slide 4' },
  { image: 'https://picsum.photos/seed/depth5/800/1000', alt: 'Slide 5' },
  { image: 'https://picsum.photos/seed/depth6/800/1000', alt: 'Slide 6' }
];

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeItem = (it: DepthCarouselItem) => (typeof it === 'string' ? { image: it, alt: '' } : it);

export default function DepthCarousel(props: DepthCarouselProps) {
  const data = createMemo(() => {
    const items = props.items ?? DEFAULT_ITEMS;
    return (Array.isArray(items) ? items : []).map(normalizeItem);
  });
  const count = () => data().length;

  let rootEl: HTMLDivElement | undefined;
  const cardEls: (HTMLDivElement | undefined)[] = [];
  const overlayEls: (HTMLSpanElement | undefined)[] = [];

  let pos = 0;
  let focus = 0;
  let tween: gsap.core.Tween | null = null;
  let scale = 1;
  let drag: DragState | null = null;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;
  let autoTimer: ReturnType<typeof setInterval> | null = null;
  let reduced = false;

  const [active, setActive] = createSignal(0);

  const config = createMemo<CarouselConfig>(() => ({
    count: count(),
    depth: props.depth ?? 220,
    spread: props.spread ?? 90,
    tilt: props.tilt ?? 22,
    tiltDirection: props.tiltDirection ?? 'right',
    visibleCards: props.visibleCards ?? 4,
    falloff: props.falloff ?? 0.2,
    blur: props.blur ?? 6,
    duration: props.duration ?? 700,
    ease: props.ease ?? 'power3.out',
    loop: props.loop ?? true,
    cardWidth: props.cardWidth ?? 300,
    cardHeight: props.cardHeight ?? 380,
    radius: props.radius ?? 18,
    autoplayDelay: props.autoplayDelay ?? 3200
  }));

  let cfg: CarouselConfig = {} as CarouselConfig;

  const layout = (p: number) => {
    const n = cfg.count;
    if (!n) return;
    const dir = cfg.tiltDirection === 'left' ? -1 : 1;
    const sc = scale;

    for (let i = 0; i < n; i++) {
      const el = cardEls[i];
      if (!el) continue;

      let d = i - p;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }

      const back = Math.max(0, d);
      const az = Math.abs(d);
      const shown = az <= cfg.visibleCards + 0.5;

      const tz = -cfg.depth * d;
      const tx = dir * cfg.spread * d;
      const ry = dir * cfg.tilt * clamp(d, 0, 1);

      let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;

      const brightness = Math.max(0.15, 1 - back * cfg.falloff);
      const blurPx = cfg.blur > 0 ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur) : 0;
      const zi = Math.round(2000 - d * 20);

      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(zi);
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';

      const ov = overlayEls[i];
      if (ov) ov.style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3);
    }
  };

  createEffect(config, value => {
    cfg = value;
    layout(pos);
  });

  const notify = (idx: number) => {
    setActive(idx);
    props.onChange?.(idx, data()[idx]);
  };

  const tweenTo = (target: number, animate: boolean) => {
    tween?.kill();
    const proxy = { p: pos };
    const dur = animate && !reduced ? cfg.duration / 1000 : 0;
    tween = gsap.to(proxy, {
      p: target,
      duration: dur,
      ease: cfg.ease,
      onUpdate: () => {
        pos = proxy.p;
        layout(proxy.p);
      },
      onComplete: () => {
        const n = cfg.count;
        if (n > 0) pos = ((pos % n) + n) % n;
        layout(pos);
      }
    });
  };

  const setFocus = (rawIndex: number, animate = true) => {
    const n = cfg.count;
    if (!n) return;
    const idx = cfg.loop ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1);
    let delta = idx - pos;
    if (cfg.loop && n > 1) {
      delta = ((delta % n) + n) % n;
      if (delta > n / 2) delta -= n;
    }
    tweenTo(pos + delta, animate);
    if (idx !== focus) {
      focus = idx;
      notify(idx);
    }
  };

  const navigateBy = (step: number) => setFocus(focus + step, true);

  onSettled(() => {
    const root = rootEl;
    if (!root) return;
    cfg = config();
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    layout(pos);

    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const needed = cfg.cardWidth + Math.abs(cfg.spread) * 2 + 120;
      scale = clamp(w / needed, 0.4, 1);
      layout(pos);
    });
    ro.observe(root);

    const onWheel = (e: WheelEvent) => {
      if (cfg.count < 2) return;
      e.preventDefault();
      tween?.kill();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const delta = e.deltaMode === 1 ? raw * 24 : raw;
      const step = clamp(delta / (cfg.cardWidth * 0.9), -0.6, 0.6);
      pos += step;
      layout(pos);
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => setFocus(Math.round(pos), true), 130);
    };
    root.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      ro.disconnect();
      root.removeEventListener('wheel', onWheel);
      tween?.kill();
      if (wheelTimer) clearTimeout(wheelTimer);
      if (autoTimer) clearInterval(autoTimer);
    };
  });

  createEffect(
    () => ({ autoplay: props.autoplay ?? false, delay: props.autoplayDelay ?? 3200, count: count() }),
    value => {
      reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const root = rootEl;
      if (!value.autoplay || reduced || value.count < 2 || !root) return;
      let hovered = false;
      let focused = false;
      const stop = () => {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = null;
      };
      const start = () => {
        stop();
        autoTimer = setInterval(
          () => {
            if (!hovered && !focused) navigateBy(1);
          },
          Math.max(value.delay, 600)
        );
      };
      const onEnter = () => {
        hovered = true;
      };
      const onLeave = () => {
        hovered = false;
      };
      const onFocusIn = () => {
        focused = true;
      };
      const onFocusOut = () => {
        focused = false;
      };
      root.addEventListener('mouseenter', onEnter);
      root.addEventListener('mouseleave', onLeave);
      root.addEventListener('focusin', onFocusIn);
      root.addEventListener('focusout', onFocusOut);
      start();
      return () => {
        stop();
        root.removeEventListener('mouseenter', onEnter);
        root.removeEventListener('mouseleave', onLeave);
        root.removeEventListener('focusin', onFocusIn);
        root.removeEventListener('focusout', onFocusOut);
      };
    }
  );

  const onPointerDown = (e: PointerEvent) => {
    if (cfg.count < 2) return;
    tween?.kill();
    drag = {
      x: e.clientX,
      startPos: pos,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId
    };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scale, 40);
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      rootEl?.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;
    const now = performance.now();
    const dt = Math.max(now - drag.lastT, 1);
    drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = now;
    pos = drag.startPos - dx / stepPx;
    layout(pos);
  };

  const onPointerEnd = () => {
    const current = drag;
    if (!current) return;
    drag = null;
    if (!current.moved) return;
    const stepPx = Math.max(cfg.cardWidth * 0.55 * scale, 40);
    const projected = pos - (current.v * 180) / stepPx;
    setFocus(Math.round(projected), true);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateBy(1);
    }
  };

  const onCardClick = (index: number) => {
    if (drag?.moved) return;
    setFocus(index, true);
  };

  return (
    <div
      ref={el => (rootEl = el)}
      class={['depth-carousel', props.className]}
      style={{ '--dc-perspective': `${props.perspective ?? 1400}px` }}
      role="group"
      aria-roledescription="carousel"
      aria-label="Depth carousel"
      tabindex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div class="depth-carousel__stage">
        <For each={data()} keyed={false}>
          {(item, i) => (
            <div
              class="depth-carousel__card"
              ref={el => (cardEls[i] = el)}
              style={{
                width: `${props.cardWidth ?? 300}px`,
                height: `${props.cardHeight ?? 380}px`,
                'border-radius': `${props.radius ?? 18}px`
              }}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count()}`}
              aria-hidden={active() !== i ? 'true' : 'false'}
              onClick={() => onCardClick(i)}
            >
              <img class="depth-carousel__img" src={item().image} alt={item().alt || ''} draggable="false" />
              <span
                class="depth-carousel__tint"
                ref={el => (overlayEls[i] = el)}
                style={{ background: props.tint ?? '#05060a' }}
              />
            </div>
          )}
        </For>
      </div>

      <Show when={(props.showControls ?? true) && count() > 1}>
        <button
          type="button"
          class="depth-carousel__arrow depth-carousel__arrow--prev"
          aria-label="Previous slide"
          onClick={() => navigateBy(-1)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="depth-carousel__arrow depth-carousel__arrow--next"
          aria-label="Next slide"
          onClick={() => navigateBy(1)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </Show>

      <Show when={(props.showIndicators ?? true) && count() > 1}>
        <div class="depth-carousel__dots" role="tablist" aria-label="Slides">
          <For each={data()} keyed={false}>
            {(_, i) => (
              <button
                type="button"
                role="tab"
                aria-selected={active() === i ? 'true' : 'false'}
                aria-label={`Go to slide ${i + 1}`}
                class={['depth-carousel__dot', { 'is-active': active() === i }]}
                onClick={() => setFocus(i, true)}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
