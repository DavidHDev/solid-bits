import { For, Repeat, Show, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CommandIcon,
  Drag04Icon,
  Image01Icon,
  Layers01Icon,
  Timer02Icon
} from '@hugeicons/core-free-icons';

import './Carousel.css';

export interface CarouselItem {
  id?: string | number;
  title?: JSX.Element;
  description?: JSX.Element;
  icon?: JSX.Element;
  image?: string;
  alt?: string;
}

export type CarouselEntry = CarouselItem | string | JSX.Element;

export interface CarouselProps {
  items?: CarouselEntry[];
  baseWidth?: number | string;
  aspectRatio?: number;
  peek?: number;
  gap?: number;
  radius?: number;
  frame?: boolean;
  effect?: 'tilt' | 'slide' | 'scale' | 'fade' | 'cube';
  indicator?: 'dots' | 'bars' | 'counter' | 'none';
  arrows?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  draggable?: boolean;
  round?: boolean;
  initialIndex?: number;
  theme?: 'dark' | 'light';
  onChange?: (index: number) => void;
  className?: string;
  style?: JSX.CSSProperties;
}

type Settings = {
  count: number;
  mode: string;
  width: number;
  bleed: number;
  inset: number;
  cardWidth: number;
  span: number;
  loop: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  pauseOnHover: boolean;
  draggable: boolean;
  bars: boolean;
  shade: number;
};

type Drag = {
  id: number;
  x: number;
  y: number;
  p: number;
  from: number;
  moved: boolean;
  samples: [number, number][];
};

type Engine = {
  goTo: (index: number) => void;
  step: (direction: number, auto?: boolean) => void;
  sync: () => void;
};

type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const iconMarkup = (icon: IconData, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${name === 'stroke-width' ? strokeWidth : value}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const Icon = (props: { icon: IconData; size: number; strokeWidth: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.size}
    height={props.size}
    viewBox="0 0 24 24"
    fill="none"
    color="currentColor"
    aria-hidden="true"
    innerHTML={iconMarkup(props.icon, props.strokeWidth)}
  />
);

const defaultItems = (): CarouselItem[] => [
  {
    id: 1,
    title: 'Swipe with momentum',
    description: 'Fling the cards and they glide into place.',
    icon: <Icon icon={Drag04Icon} size={16} strokeWidth={1.8} />
  },
  {
    id: 2,
    title: 'Autoplay with a timer',
    description: 'The indicator fills up so people know what comes next.',
    icon: <Icon icon={Timer02Icon} size={16} strokeWidth={1.8} />
  },
  {
    id: 3,
    title: 'Five transitions',
    description: 'Tilt, slide, scale, fade or turn the cards like a cube.',
    icon: <Icon icon={Layers01Icon} size={16} strokeWidth={1.8} />
  },
  {
    id: 4,
    title: 'Keyboard friendly',
    description: 'Arrow keys, Home and End move between the cards.',
    icon: <Icon icon={CommandIcon} size={16} strokeWidth={1.8} />
  },
  {
    id: 5,
    title: 'Bring any content',
    description: 'Pass text, images or your own components as cards.',
    icon: <Icon icon={Image01Icon} size={16} strokeWidth={1.8} />
  }
];

const THEMES: Record<string, Record<string, string>> = {
  dark: {
    '--carousel-frame': 'rgba(35, 37, 40, 0.66)',
    '--carousel-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--carousel-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--carousel-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--carousel-tile': 'linear-gradient(180deg, #393b3f 0%, #26282c 100%)',
    '--carousel-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--carousel-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--carousel-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--carousel-ink': '#f4f5f6',
    '--carousel-muted': 'rgba(244, 245, 246, 0.6)',
    '--carousel-faint': 'rgba(255, 255, 255, 0.22)',
    '--carousel-soft': 'rgba(255, 255, 255, 0.42)',
    '--carousel-badge': 'rgba(255, 255, 255, 0.08)',
    '--carousel-hover': 'brightness(1.12)',
    '--carousel-press': 'brightness(0.8)'
  },
  light: {
    '--carousel-frame': 'rgba(240, 241, 243, 0.8)',
    '--carousel-frame-edge': 'rgba(24, 25, 27, 0.07)',
    '--carousel-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--carousel-frame-shadow': '0 22px 44px -22px rgba(24, 25, 27, 0.3), 0 6px 16px -10px rgba(24, 25, 27, 0.16)',
    '--carousel-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)',
    '--carousel-tile-edge': 'rgba(24, 25, 27, 0.08)',
    '--carousel-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--carousel-tile-shadow': '0 4px 10px -5px rgba(24, 25, 27, 0.25)',
    '--carousel-ink': '#27282a',
    '--carousel-muted': 'rgba(39, 40, 42, 0.6)',
    '--carousel-faint': 'rgba(24, 25, 27, 0.16)',
    '--carousel-soft': 'rgba(24, 25, 27, 0.34)',
    '--carousel-badge': 'rgba(24, 25, 27, 0.05)',
    '--carousel-hover': 'brightness(0.97)',
    '--carousel-press': 'brightness(0.92)'
  }
};

const EFFECTS = ['tilt', 'slide', 'scale', 'fade', 'cube'];
const STIFFNESS = 150;
const DAMPING = 24;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, count: number) => ((value % count) + count) % count;
const nearest = (offset: number, count: number) => wrap(offset + count / 2, count) - count / 2;

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const edgeMask = (size: number) => {
  const stops = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map(t => [smootherstep(t).toFixed(3), (t * size).toFixed(1)]);
  const left = stops.map(([alpha, x]) => `rgba(0, 0, 0, ${alpha}) ${x}px`);
  const right = [...stops].reverse().map(([alpha, x]) => `rgba(0, 0, 0, ${alpha}) calc(100% - ${x}px)`);
  return `linear-gradient(to right, ${[...left, ...right].join(', ')})`;
};

const band = (value: number, max: number) => {
  if (value < 0) return -0.3 * (1 - Math.exp(value / 0.55));
  if (value > max) return max + 0.3 * (1 - Math.exp((max - value) / 0.55));
  return value;
};

const pose = (index: number, position: number, s: Settings) => {
  const offset = s.loop ? nearest(index - position, s.count) : index - position;
  const distance = Math.abs(offset);
  const near = Math.min(distance, 1);
  const result = {
    transform: 'none',
    opacity: 1,
    visible: true,
    layer: 10 - Math.min(9, Math.round(distance * 2)),
    shade: 0,
    focus: 1
  };
  if (s.mode === 'fade') {
    const half = Math.min(1, near * 2);
    result.visible = distance < 1;
    result.opacity = 1 - near * near * (3 - 2 * near);
    result.transform = `scale(${1 - 0.04 * near})`;
    result.focus = 1 - half * half * (3 - 2 * half);
    return result;
  }
  if (s.mode === 'cube') {
    const half = s.cardWidth / 2;
    const turn = Math.sin(Math.PI * (position - Math.floor(position)));
    result.visible = distance < 1;
    result.transform = `scale(${1 - 0.12 * turn}) translateZ(${-half}px) rotateY(${clamp(offset, -1, 1) * 90}deg) translateZ(${half}px)`;
    result.shade = near * s.shade;
    return result;
  }
  let x = offset * s.span;
  result.visible = x > -(s.inset + s.cardWidth + 2) && x < s.width + s.bleed * 2 - s.inset + 2;
  result.focus = 1 - near * near * (3 - 2 * near);
  if (s.mode === 'tilt') {
    result.visible = result.visible && distance < 1;
    result.transform = `translate3d(${x}px, 0, 0) rotateY(${-clamp(offset, -1, 1) * 90}deg)`;
  } else if (s.mode === 'scale') {
    x -= Math.sign(offset) * near * s.cardWidth * 0.06;
    result.transform = `translate3d(${x}px, 0, 0) scale(${1 - 0.12 * near})`;
    result.opacity = 1 - 0.5 * near;
  } else {
    result.transform = `translate3d(${x}px, 0, 0)`;
  }
  return result;
};

const isCustom = (item: CarouselEntry) =>
  (typeof Node !== 'undefined' && item instanceof Node) || Array.isArray(item) || typeof item === 'function';

const Chevron = (props: { flip?: boolean }) => (
  <Icon icon={props.flip ? ArrowLeft01Icon : ArrowRight01Icon} size={16} strokeWidth={2} />
);

const Card = (props: { item: CarouselEntry; round: boolean; compact: boolean }) => {
  const data = createMemo<CarouselItem>(() => {
    const item = props.item;
    if (typeof item === 'string') return { image: item };
    if (item && typeof item === 'object' && !isCustom(item)) return item as CarouselItem;
    return {};
  });
  const text = () => Boolean(data().title || data().description);

  return (
    <Show
      when={!isCustom(props.item)}
      fallback={
        <div class={['carousel-card is-custom', { 'is-round': props.round }]}>
          {props.item}
          <span class="carousel-card-rim" />
        </div>
      }
    >
      <div class={['carousel-card', { 'has-image': Boolean(data().image), 'is-round': props.round }]}>
        <Show when={data().image}>
          {image => (
            <img class="carousel-image" src={image()} alt={data().alt ?? ''} draggable="false" decoding="async" />
          )}
        </Show>
        <Show when={data().image && text()}>
          <span class="carousel-scrim" />
        </Show>
        <Show when={data().icon}>
          <span class="carousel-icon">{data().icon}</span>
        </Show>
        <Show when={text()}>
          <div class="carousel-text">
            <Show when={data().title}>
              <div class="carousel-title">{data().title}</div>
            </Show>
            <Show when={data().description && !props.compact}>
              <p class="carousel-description">{data().description}</p>
            </Show>
          </div>
        </Show>
        <span class="carousel-card-rim" />
      </div>
    </Show>
  );
};

export default function Carousel(props: CarouselProps) {
  let rootEl: HTMLDivElement | undefined;
  let stageEl: HTMLDivElement | undefined;
  let viewportEl: HTMLDivElement | undefined;
  let counterEl: HTMLSpanElement | undefined;
  const slideEls: (HTMLDivElement | undefined)[] = [];
  const shadeEls: (HTMLSpanElement | undefined)[] = [];
  const fillEls: (HTMLSpanElement | undefined)[] = [];
  let engine: Engine | null = null;
  let current!: Settings;

  const defaults = defaultItems();
  const items = createMemo<CarouselEntry[]>(() => props.items ?? defaults);
  const count = () => items().length;
  const frame = () => props.frame ?? true;
  const round = () => props.round ?? false;
  const indicator = () => props.indicator ?? 'dots';
  const arrows = () => props.arrows ?? false;
  const theme = () => props.theme ?? 'dark';
  const mode = () => {
    const effect = props.effect ?? 'tilt';
    return EFFECTS.includes(effect) ? effect : 'tilt';
  };
  const ratio = () => clamp(props.aspectRatio ?? 1.25, 0.3, 4);
  const maxWidth = createMemo(() => {
    const baseWidth = props.baseWidth ?? 300;
    return typeof baseWidth === 'number' && round() && frame()
      ? 20 + (baseWidth - 20) * Math.min(1, 1 / ratio())
      : baseWidth;
  });

  const [width, setWidth] = createSignal(
    untrack(() => {
      const value = maxWidth();
      return typeof value === 'number' ? value - (frame() ? 20 : 0) : 300;
    })
  );
  const start = untrack(() => clamp(Math.round(props.initialIndex ?? 0), 0, Math.max(0, items().length - 1)));
  const [active, setActive] = createSignal(start);

  const layout = createMemo(() => {
    const w = width();
    const m = mode();
    const stacked = m === 'fade' || m === 'cube';
    const isRound = round();
    const hasFrame = frame();
    const side = stacked || (isRound && hasFrame) ? 0 : clamp(props.peek ?? 0, 0, w * 0.2);
    const slot = Math.max(40, w - side * 2);
    const diameter = hasFrame ? slot : Math.min(slot, slot / ratio());
    const cardWidth = isRound ? diameter : slot;
    const cardHeight = isRound ? diameter : slot / ratio();
    const clipped = !hasFrame && !stacked;
    const bleed = clipped ? Math.round(Math.min(48, cardWidth * 0.12)) : 0;
    const inset = bleed + (w - cardWidth) / 2;
    const n = count();
    const settings: Settings = {
      count: n,
      mode: m,
      width: w,
      bleed,
      inset,
      cardWidth,
      span: cardWidth + Math.max(0, props.gap ?? 16),
      loop: (props.loop ?? false) && n > 1,
      autoplay: (props.autoplay ?? false) && n > 1,
      autoplayDelay: Math.max(600, props.autoplayDelay ?? 3000),
      pauseOnHover: props.pauseOnHover ?? false,
      draggable: (props.draggable ?? true) && n > 1,
      bars: indicator() === 'bars',
      shade: theme() === 'light' ? 0.3 : 0.6
    };
    return { cardWidth, cardHeight, clipped, bleed, inset, settings };
  });
  const settings = () => layout().settings;

  createEffect(
    () => ({ settings: settings(), active: active() }),
    value => {
      current = value.settings;
      engine?.sync();
    }
  );

  let reported = start;
  createEffect(
    () => ({ index: active(), onChange: props.onChange }),
    value => {
      if (reported === value.index) return;
      reported = value.index;
      value.onChange?.(value.index);
    }
  );

  let previous = start;
  createEffect(
    () => ({ index: active(), count: count(), loop: props.loop ?? false }),
    value => {
      const last = previous;
      previous = value.index;
      const counter = counterEl;
      if (!counter?.isConnected || !counter.animate || last === value.index) return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      const delta = value.loop && value.count > 1 ? nearest(value.index - last, value.count) : value.index - last;
      counter.animate(
        [
          { transform: `translateY(${delta > 0 ? 70 : -70}%)`, opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
      );
    }
  );

  onSettled(() => {
    const root = rootEl;
    const stage = stageEl;
    const viewport = viewportEl;
    if (!root || !stage || !viewport) return;
    current = settings();

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = {
      p: start,
      v: 0,
      target: start,
      shown: start,
      elapsed: 0,
      hovered: false,
      focused: false,
      visible: true,
      drag: null as Drag | null,
      wheeling: false,
      wheelTimer: 0 as number,
      suppress: false,
      last: 0
    };
    let raf = 0;
    let alive = true;

    const unit = (s: Settings) => (s.mode === 'fade' || s.mode === 'cube' ? s.cardWidth : s.span);
    const limit = (s: Settings, value: number) => (s.loop ? value : clamp(value, 0, s.count - 1));

    const apply = () => {
      const s = current;
      for (let i = 0; i < s.count; i++) {
        const slide = slideEls[i];
        if (!slide) continue;
        const next = pose(i, state.p, s);
        slide.style.transform = next.transform;
        slide.style.opacity = String(next.opacity);
        slide.style.visibility = next.visible ? 'visible' : 'hidden';
        slide.style.zIndex = String(next.layer);
        slide.style.setProperty('--carousel-focus', String(next.focus));
        const shade = shadeEls[i];
        if (shade) shade.style.opacity = String(next.shade);
      }
      if (!s.bars) return;
      const progress = s.autoplay ? clamp(state.elapsed / s.autoplayDelay, 0, 1) : 1;
      for (let i = 0; i < s.count; i++) {
        const fill = fillEls[i];
        if (fill) fill.style.transform = `scaleX(${i < state.shown ? 1 : i === state.shown ? progress : 0})`;
      }
    };

    const announce = () => {
      const s = current;
      if (!s.count) return;
      const index = s.loop ? wrap(Math.round(state.target), s.count) : clamp(Math.round(state.target), 0, s.count - 1);
      if (index === state.shown) return;
      state.shown = index;
      setActive(index);
    };

    const paused = (s: Settings) =>
      (s.pauseOnHover && state.hovered) ||
      state.focused ||
      Boolean(state.drag) ||
      state.wheeling ||
      !state.visible ||
      document.hidden;

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = current;
      const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
      state.last = now;
      let busy = false;
      if (!state.drag?.moved && !state.wheeling) {
        if (reduce) {
          state.p = state.target;
          state.v = 0;
        } else {
          const steps = Math.ceil(dt * 240);
          const h = dt / steps;
          for (let k = 0; k < steps; k++) {
            state.v += (STIFFNESS * (state.target - state.p) - DAMPING * state.v) * h;
            state.p += state.v * h;
          }
          if (Math.abs(state.target - state.p) < 0.0004 && Math.abs(state.v) < 0.004) {
            state.p = state.target;
            state.v = 0;
          } else {
            busy = true;
          }
        }
        if (!busy && s.loop && s.count) {
          state.target = wrap(Math.round(state.target), s.count);
          state.p = state.target;
        }
      }
      if (s.autoplay && !paused(s)) {
        state.elapsed += dt * 1000;
        if (state.elapsed >= s.autoplayDelay) step(1, true);
        busy = true;
      }
      apply();
      if (busy) raf = requestAnimationFrame(tick);
      else state.last = 0;
    };

    const wake = () => {
      if (!raf && alive) raf = requestAnimationFrame(tick);
    };

    const moveTo = (target: number) => {
      state.target = target;
      state.elapsed = 0;
      announce();
      apply();
      wake();
    };

    const step = (direction: number, auto = false) => {
      const s = current;
      if (s.count < 2) return;
      let next = Math.round(state.target) + direction;
      if (!s.loop) {
        if (auto && next > s.count - 1) next = 0;
        next = clamp(next, 0, s.count - 1);
      }
      moveTo(next);
    };

    const goTo = (index: number) => {
      const s = current;
      if (!s.count) return;
      const goal = clamp(Math.round(index), 0, s.count - 1);
      const now = Math.round(state.target);
      moveTo(s.loop ? now + nearest(goal - wrap(now, s.count), s.count) : goal);
    };

    const onPointerDown = (event: PointerEvent) => {
      const s = current;
      if (!s.draggable || (event.pointerType === 'mouse' && event.button !== 0)) return;
      state.drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        p: state.p,
        from: 0,
        moved: false,
        samples: []
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.id) return;
      const s = current;
      if (!drag.moved) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          state.drag = null;
          return;
        }
        drag.moved = true;
        drag.x = event.clientX;
        drag.p = state.p;
        drag.from = Math.round(state.target);
        viewport.setPointerCapture?.(event.pointerId);
        viewport.dataset.dragging = 'true';
      }
      const raw = drag.p - (event.clientX - drag.x) / unit(s);
      state.p = s.loop ? raw : band(raw, s.count - 1);
      state.v = 0;
      state.target = Math.round(limit(s, state.p));
      drag.samples.push([event.timeStamp, event.clientX]);
      if (drag.samples.length > 8) drag.samples.shift();
      announce();
      apply();
    };

    const onPointerUp = (event: PointerEvent) => {
      const drag = state.drag;
      if (!drag || event.pointerId !== drag.id) return;
      state.drag = null;
      delete viewport.dataset.dragging;
      if (!drag.moved) {
        wake();
        return;
      }
      state.suppress = true;
      window.setTimeout(() => {
        state.suppress = false;
      }, 0);
      const s = current;
      const sample: [number, number] = drag.samples.find(([time]) => event.timeStamp - time < 90) ?? [
        event.timeStamp,
        event.clientX
      ];
      const elapsed = Math.max(16, event.timeStamp - sample[0]);
      const velocity = clamp(((sample[1] - event.clientX) / elapsed) * (1000 / unit(s)), -12, 12);
      const travelled = state.p - drag.from;
      let target = Math.round(state.p + velocity * 0.2);
      if (target === drag.from) {
        if (Math.abs(velocity) > 0.8) target += Math.sign(velocity);
        else if (Math.abs(travelled) > 0.18) target += Math.sign(travelled);
      }
      if (!s.loop) target = clamp(target, 0, s.count - 1);
      const inside = s.loop || (state.p >= 0 && state.p <= s.count - 1);
      state.v = inside ? velocity : 0;
      moveTo(target);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!state.suppress) return;
      event.preventDefault();
      event.stopPropagation();
      state.suppress = false;
    };

    const onWheel = (event: WheelEvent) => {
      const s = current;
      if (!s.draggable || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      const raw = state.p + event.deltaX / unit(s);
      state.p = s.loop ? raw : clamp(raw, -0.15, s.count - 0.85);
      state.v = 0;
      state.wheeling = true;
      state.target = Math.round(limit(s, state.p));
      announce();
      apply();
      window.clearTimeout(state.wheelTimer);
      state.wheelTimer = window.setTimeout(() => {
        state.wheeling = false;
        moveTo(Math.round(limit(current, state.p)));
      }, 120);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]'))
        return;
      const s = current;
      const keys: Record<string, () => void> = {
        ArrowRight: () => step(1),
        ArrowLeft: () => step(-1),
        Home: () => goTo(0),
        End: () => goTo(s.count - 1)
      };
      if (!keys[event.key]) return;
      event.preventDefault();
      keys[event.key]();
    };

    const onEnter = () => {
      state.hovered = true;
    };

    const onLeave = () => {
      state.hovered = false;
      wake();
    };

    const onFocusIn = () => {
      try {
        state.focused = root.matches(':focus-visible') || Boolean(root.querySelector(':focus-visible'));
      } catch {
        state.focused = false;
      }
    };

    const onFocusOut = (event: FocusEvent) => {
      if (root.contains(event.relatedTarget as Node | null)) return;
      state.focused = false;
      wake();
    };

    const onVisibility = () => {
      if (document.hidden) return;
      state.last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(entries => {
      const box = entries[entries.length - 1]?.contentRect;
      if (box) setWidth(Math.max(1, Math.round(box.width)));
    });
    resizeObserver.observe(stage);
    const visibility = new IntersectionObserver(entries => {
      state.visible = entries.some(entry => entry.isIntersecting);
      if (state.visible) wake();
    });
    visibility.observe(root);

    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);
    viewport.addEventListener('click', onClickCapture, true);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', onVisibility);

    engine = {
      goTo,
      step,
      sync: () => {
        const s = current;
        if (!s.loop && s.count) {
          state.target = clamp(Math.round(state.target), 0, s.count - 1);
          state.p = clamp(state.p, -0.3, s.count - 0.7);
        }
        announce();
        apply();
        wake();
      }
    };
    engine.sync();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(state.wheelTimer);
      engine = null;
      resizeObserver.disconnect();
      visibility.disconnect();
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
      viewport.removeEventListener('click', onClickCapture, true);
      viewport.removeEventListener('wheel', onWheel);
      root.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });

  const controls = () => count() > 1 && (indicator() !== 'none' || arrows());
  const atStart = () => !settings().loop && active() === 0;
  const atEnd = () => !settings().loop && active() === count() - 1;
  const perspective = () =>
    mode() === 'cube' ? `${Math.round(layout().cardWidth * 2.6)}px` : mode() === 'tilt' ? '1000px' : undefined;
  const mask = () => (layout().clipped ? edgeMask(layout().inset) : undefined);
  const inside = () => frame() && !round();

  const controlsNode = () => (
    <Show when={controls()}>
      <div class="carousel-controls" style={{ width: `${layout().cardWidth}px` }}>
        <Show when={arrows()}>
          <button
            type="button"
            class="carousel-arrow"
            aria-label="Previous slide"
            disabled={atStart()}
            onClick={() => engine?.step(-1)}
          >
            <Chevron flip />
          </button>
        </Show>

        <Show when={indicator() === 'dots'}>
          <div class="carousel-dots">
            <Repeat count={count()}>
              {index => (
                <button
                  type="button"
                  class={['carousel-dot', { 'is-active': index === active() }]}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === active() ? 'true' : undefined}
                  onClick={() => engine?.goTo(index)}
                >
                  <span class="carousel-dot-mark" />
                </button>
              )}
            </Repeat>
          </div>
        </Show>

        <Show when={indicator() === 'bars'}>
          <div class="carousel-bars">
            <Repeat count={count()}>
              {index => (
                <button
                  type="button"
                  class="carousel-bar"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === active() ? 'true' : undefined}
                  onClick={() => engine?.goTo(index)}
                >
                  <span class="carousel-bar-track">
                    <span
                      ref={el => (fillEls[index] = el)}
                      class="carousel-bar-fill"
                      style={{
                        transform: `scaleX(${index < active() ? 1 : index === active() && !settings().autoplay ? 1 : 0})`
                      }}
                    />
                  </span>
                </button>
              )}
            </Repeat>
          </div>
        </Show>

        <Show when={indicator() === 'counter'}>
          <div class="carousel-counter">
            <span ref={el => (counterEl = el)} class="carousel-counter-current">
              {String(active() + 1).padStart(2, '0')}
            </span>
            <span>/</span>
            <span>{String(count()).padStart(2, '0')}</span>
          </div>
        </Show>

        <Show when={arrows()}>
          <button
            type="button"
            class="carousel-arrow"
            aria-label="Next slide"
            disabled={atEnd()}
            onClick={() => engine?.step(1)}
          >
            <Chevron />
          </button>
        </Show>
      </div>
    </Show>
  );

  const slideStyle = (index: number): JSX.CSSProperties => {
    const l = layout();
    const initial = pose(index, untrack(active), l.settings);
    return {
      left: `${l.inset}px`,
      width: `${l.cardWidth}px`,
      height: `${l.cardHeight}px`,
      transform: initial.transform,
      opacity: String(initial.opacity),
      visibility: initial.visible ? 'visible' : 'hidden',
      'z-index': String(initial.layer),
      '--carousel-focus': String(initial.focus)
    };
  };

  return (
    <div
      ref={el => (rootEl = el)}
      class={['carousel-container', { 'has-frame': frame(), 'is-round': round() }, props.className]}
      style={{
        ...(THEMES[theme()] ?? THEMES.dark),
        '--carousel-radius': `${round() ? 9999 : Math.max(0, props.radius ?? 12)}px`,
        '--carousel-scale': String(clamp(layout().cardWidth / 300, 0.86, 1)),
        width: typeof maxWidth() === 'number' ? '100%' : String(maxWidth()),
        'max-width': typeof maxWidth() === 'number' ? `${maxWidth()}px` : undefined,
        ...props.style
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Carousel"
      tabindex={0}
    >
      <div ref={el => (stageEl = el)} class="carousel-stage">
        <div
          ref={el => (viewportEl = el)}
          class="carousel-viewport"
          data-draggable={settings().draggable ? 'true' : undefined}
          aria-live={settings().autoplay ? 'off' : 'polite'}
          style={{
            height: `${layout().cardHeight}px`,
            'margin-inline': layout().bleed ? `${-layout().bleed}px` : undefined,
            perspective: perspective(),
            'overflow-x': layout().clipped ? 'clip' : 'visible',
            'mask-image': mask(),
            '-webkit-mask-image': mask()
          }}
        >
          <For each={items()} keyed={false}>
            {(item, index) => (
              <div
                ref={el => (slideEls[index] = el)}
                class="carousel-slide"
                style={slideStyle(index)}
                data-current={index === active() ? 'true' : undefined}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count()}`}
                onClick={() => {
                  if (index !== active()) engine?.goTo(index);
                }}
              >
                <Card item={item()} round={round()} compact={round() && layout().cardWidth < 240} />
                <Show when={mode() === 'cube'}>
                  <span
                    ref={el => (shadeEls[index] = el)}
                    class="carousel-shade"
                    style={{ opacity: String(pose(index, untrack(active), settings()).shade) }}
                  />
                </Show>
              </div>
            )}
          </For>
        </div>

        <Show when={inside()}>{controlsNode()}</Show>
        <Show when={frame()}>
          <span class="carousel-frame-rim" />
        </Show>
      </div>

      <Show when={!inside()}>{controlsNode()}</Show>
    </div>
  );
}
