import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onSettled,
  untrack
} from 'solid-js';
import { Portal, type JSX } from '@solidjs/web';
import { ArrowLeft01Icon, ArrowRight01Icon, ArrowUpRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import './Masonry.css';

export interface MasonryItem {
  id: string | number;
  img: string;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
  alt?: string;
  url?: string;
  span?: number;
}

export interface MasonryProps {
  items?: MasonryItem[];
  columns?: 'auto' | number;
  columnWidth?: number;
  gap?: number;
  radius?: number;
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random' | 'none';
  stagger?: number;
  duration?: number;
  bounce?: number;
  blurToFocus?: boolean;
  revealOnScroll?: boolean;
  hoverEffect?: 'zoom' | 'lift' | 'tilt' | 'none';
  focusOnHover?: boolean;
  captions?: 'hover' | 'always' | 'none';
  parallax?: number;
  lightbox?: boolean;
  draggable?: boolean;
  onItemClick?: (item: MasonryItem, index: number, event: MouseEvent) => void;
  onReorder?: (items: MasonryItem[]) => void;
  className?: string;
  style?: JSX.CSSProperties;
}

type Measured = Record<string, number>;

interface Grid {
  count: number;
  size: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Tile extends Rect {
  item: MasonryItem;
  id: string;
}

interface Layout {
  tiles: Tile[];
  height: number;
}

interface Spring {
  x: number;
  y: number;
  s: number;
  vx: number;
  vy: number;
  vs: number;
  tx: number;
  ty: number;
  w: number;
  h: number;
  shown: boolean;
  dragging: boolean;
  blur: boolean;
  reveal: number;
  start: number;
}

interface Ghost {
  id: string;
  item: MasonryItem;
  x: number;
  y: number;
  s: number;
  w: number;
  h: number;
}

interface Drag {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
  moved: boolean;
}

type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const ROOT = 'masonry';
const ITEM = 'masonry__item';
const CARD = 'masonry__card';
const MEDIA = 'masonry__media';
const PARALLAX = 'masonry__parallax';
const IMAGE = 'masonry__image';
const CAPTION = 'masonry__caption';
const TITLE = 'masonry__title';
const TEXT = 'masonry__text';
const GHOST = 'masonry__ghost';
const BOX = 'masonry-lightbox';
const BOX_BACKDROP = 'masonry-lightbox__backdrop';
const BOX_IMAGE = 'masonry-lightbox__image';
const BOX_CAPTION = 'masonry-lightbox__caption';
const BOX_MUTED = 'masonry-lightbox__muted';
const BOX_CLOSE = 'masonry-lightbox__button masonry-lightbox__close';
const BOX_PREV = 'masonry-lightbox__button masonry-lightbox__prev';
const BOX_NEXT = 'masonry-lightbox__button masonry-lightbox__next';

const DIRECTIONS = ['bottom', 'top', 'left', 'right'];
const ANIMATE_FROM = ['bottom', 'top', 'left', 'right', 'center', 'random', 'none'];
const HOVER_EFFECTS = ['zoom', 'lift', 'tilt', 'none'];
const CAPTION_MODES = ['hover', 'always', 'none'];
const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const keyOf = (item: MasonryItem) => String(item.id);

const aspectOf = (item: MasonryItem, measured: Measured) => {
  const width = item.width ?? 0;
  const height = item.height ?? 0;
  if (width > 0 && height > 0) return height / width;
  if (measured[keyOf(item)]) return measured[keyOf(item)];
  if (height > 0) return height / 600;
  return 1;
};

const needsMeasure = (item: MasonryItem) => !((item.height ?? 0) > 0);

const gridOf = (width: number, columns: 'auto' | number, columnWidth: number, gap: number): Grid => {
  const fixed = Number(columns);
  const count =
    columns !== 'auto' && fixed > 0
      ? Math.max(1, Math.round(fixed))
      : Math.max(1, Math.floor((width + gap) / (Math.max(40, columnWidth) + gap)));
  return { count, size: Math.max(1, (width - gap * (count - 1)) / count) };
};

const place = (
  heights: number[],
  item: MasonryItem,
  grid: Grid,
  gap: number,
  measured: Measured,
  commit: boolean
): Rect => {
  const { count, size } = grid;
  const span = Math.min(count, Math.max(1, Math.round(item.span || 1)));
  let column = 0;
  let top = Infinity;
  for (let start = 0; start <= count - span; start++) {
    let y = 0;
    for (let k = start; k < start + span; k++) y = Math.max(y, heights[k]);
    if (y < top - 0.5) {
      top = y;
      column = start;
    }
  }
  const w = size * span + gap * (span - 1);
  const h = Math.max(1, w * aspectOf(item, measured));
  if (commit) for (let k = column; k < column + span; k++) heights[k] = top + h + gap;
  return { x: Math.round(column * (size + gap)), y: Math.round(top), w, h };
};

const scrollerOf = (element: HTMLElement | null | undefined): HTMLElement | null => {
  let node = element?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (
      (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const layoutOf = (
  list: MasonryItem[],
  width: number,
  columns: 'auto' | number,
  columnWidth: number,
  gap: number,
  measured: Measured
): Layout => {
  const grid = gridOf(width, columns, columnWidth, gap);
  const heights = new Array(grid.count).fill(0);
  const tiles = list.map(item => ({ item, id: keyOf(item), ...place(heights, item, grid, gap, measured, true) }));
  return { tiles, height: Math.max(0, Math.max(...heights) - gap) };
};

const slotsFor = (
  others: MasonryItem[],
  dragged: MasonryItem,
  width: number,
  columns: 'auto' | number,
  columnWidth: number,
  gap: number,
  measured: Measured
) => {
  const grid = gridOf(width, columns, columnWidth, gap);
  const heights = new Array(grid.count).fill(0);
  const slots: { x: number; y: number }[] = [];
  for (let i = 0; i <= others.length; i++) {
    const slot = place(heights, dragged, grid, gap, measured, false);
    slots.push({ x: slot.x + slot.w / 2, y: slot.y + slot.h / 2 });
    if (i < others.length) place(heights, others[i], grid, gap, measured, true);
  }
  return slots;
};

const reduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const iconMarkup = (icon: IconData, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = String(name === 'stroke-width' ? strokeWidth : value);
          return `${name}="${next.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
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
    innerHTML={iconMarkup(props.icon, props.strokeWidth)}
  />
);

export default function Masonry(props: MasonryProps) {
  let rootEl: HTMLDivElement | undefined;
  let boxEl: HTMLDivElement | undefined;
  const nodes = new Map<string, HTMLDivElement>();
  const springs = new Map<string, Spring>();
  const loaded = new Set<string>();
  const waiting = new Set<string>();
  const pending = new Set<string>();
  const engine = { raf: 0, last: 0, flush: 0 };
  const ghostNodes = new Map<string, HTMLDivElement>();
  const previous = new Map<string, { item: MasonryItem; w: number; h: number }>();
  let drag: Drag | null = null;
  let suppress = false;
  let token = 0;
  let lastShown: string | null = null;
  let opened: string | null = null;
  let openNow: string | null = null;
  let closing = false;
  let measuredNow: Measured = {};

  const [width, setWidth] = createSignal(0);
  const [order, setOrder] = createSignal<{ key: string; ids: string[] } | null>(null);
  const [measured, setMeasured] = createSignal<Measured>({});
  const [timedOut, setTimedOut] = createSignal(false);
  const [ghosts, setGhosts] = createSignal<Ghost[]>([]);
  const [openId, setOpenIdSignal] = createSignal<string | null>(null);

  const setOpenId = (id: string | null) => {
    openNow = id;
    if (id) lastShown = id;
    setOpenIdSignal(id);
  };

  const settings = createMemo(() => {
    const animateFrom = props.animateFrom ?? 'bottom';
    const hoverEffect = props.hoverEffect ?? 'zoom';
    return {
      gap: Math.max(0, props.gap ?? 12),
      animateFrom: ANIMATE_FROM.includes(animateFrom) ? animateFrom : 'bottom',
      stagger: Math.max(0, props.stagger ?? 0.05),
      duration: Math.max(0.05, props.duration ?? 0.6),
      bounce: clamp(props.bounce ?? 0.15, 0, 0.9),
      blurToFocus: props.blurToFocus ?? true,
      revealOnScroll: props.revealOnScroll ?? true,
      hoverEffect: HOVER_EFFECTS.includes(hoverEffect) ? hoverEffect : 'zoom',
      focusOnHover: props.focusOnHover ?? false,
      parallax: clamp(props.parallax ?? 0, 0, 1),
      lightbox: props.lightbox ?? true,
      draggable: props.draggable ?? true
    };
  });

  const items = createMemo(() => props.items ?? []);
  const itemsKey = createMemo(() => items().map(keyOf).join('\u0000'));
  const keyedItems = createMemo(() => {
    itemsKey();
    return untrack(items);
  });
  const columns = () => props.columns ?? 'auto';
  const columnWidth = () => props.columnWidth ?? 240;
  const radius = () => props.radius ?? 12;
  const captionMode = createMemo(() => {
    const captions = props.captions ?? 'hover';
    return CAPTION_MODES.includes(captions) ? captions : 'hover';
  });

  const ready = createMemo<boolean>(
    prev => !!prev || timedOut() || items().every(item => !needsMeasure(item) || Boolean(measured()[keyOf(item)]))
  );

  const ordered = createMemo(() => {
    const list = items();
    const current = order();
    if (!current || current.key !== itemsKey()) return list;
    const byId = new Map(list.map(item => [keyOf(item), item]));
    const result = current.ids.filter(id => byId.has(id)).map(id => byId.get(id) as MasonryItem);
    list.forEach(item => {
      if (!current.ids.includes(keyOf(item))) result.push(item);
    });
    return result;
  });

  const layout = createMemo<Layout | null>(() =>
    width() && ready() ? layoutOf(ordered(), width(), columns(), columnWidth(), settings().gap, measured()) : null
  );

  const openItem = createMemo(() => {
    const id = openId();
    if (!id) return null;
    const list = ordered();
    const index = list.findIndex(item => keyOf(item) === id);
    return index >= 0 ? { item: list[index], index } : null;
  });

  const paint = (id: string, spring: Spring) => {
    const node = nodes.get(id);
    if (!node) return;
    node.style.transform = `translate3d(${spring.x}px, ${spring.y}px, 0) scale(${spring.s})`;
    if (spring.reveal < 1) {
      const eased = 1 - Math.pow(1 - Math.max(0, spring.reveal), 3);
      node.style.opacity = String(eased);
      node.style.filter = spring.blur ? `blur(${((1 - eased) * 12).toFixed(2)}px)` : '';
    } else if (node.style.opacity !== '') {
      node.style.opacity = '';
      node.style.filter = '';
    }
  };

  const frame = (now: number) => {
    const state = engine;
    state.raf = 0;
    const s = settings();
    const elapsed = clamp((now - state.last) / 1000, 0, 1 / 20);
    state.last = now;
    const omega = (Math.PI * 2) / s.duration;
    const zeta = clamp(1 - s.bounce, 0.1, 1);
    const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
    const dt = elapsed / steps;
    let active = false;
    springs.forEach((spring, id) => {
      if (!spring.shown) return;
      if (spring.dragging) {
        paint(id, spring);
        return;
      }
      if (now < spring.start) {
        active = true;
        return;
      }
      for (let i = 0; i < steps; i++) {
        spring.vx += (-omega * omega * (spring.x - spring.tx) - 2 * zeta * omega * spring.vx) * dt;
        spring.vy += (-omega * omega * (spring.y - spring.ty) - 2 * zeta * omega * spring.vy) * dt;
        spring.vs += (-omega * omega * (spring.s - 1) - 2 * zeta * omega * spring.vs) * dt;
        spring.x += spring.vx * dt;
        spring.y += spring.vy * dt;
        spring.s += spring.vs * dt;
      }
      const resting =
        Math.abs(spring.x - spring.tx) < 0.05 &&
        Math.abs(spring.y - spring.ty) < 0.05 &&
        Math.abs(spring.s - 1) < 0.0005 &&
        Math.abs(spring.vx) + Math.abs(spring.vy) < 0.05 &&
        Math.abs(spring.vs) < 0.001;
      if (resting) {
        spring.x = spring.tx;
        spring.y = spring.ty;
        spring.s = 1;
        spring.vx = spring.vy = spring.vs = 0;
      } else active = true;
      if (spring.reveal < 1) {
        spring.reveal = clamp((now - spring.start) / (s.duration * 1000), 0, 1);
        if (spring.reveal < 1) active = true;
      }
      paint(id, spring);
    });
    if (active) state.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    if (engine.raf || typeof window === 'undefined') return;
    engine.last = performance.now();
    engine.raf = requestAnimationFrame(frame);
  };

  const visibleCenter = () => {
    const root = rootEl;
    if (!root) return 0;
    const rect = root.getBoundingClientRect();
    const top = Math.max(0, -rect.top);
    const bottom = Math.min(rect.height, window.innerHeight - rect.top);
    return bottom > top ? (top + bottom) / 2 : rect.height / 2;
  };

  const flushReveals = () => {
    engine.flush = 0;
    const s = settings();
    const batch: { id: string; spring: Spring }[] = [];
    pending.forEach(id => {
      const spring = springs.get(id);
      if (spring && !spring.shown) batch.push({ id, spring });
    });
    pending.clear();
    if (!batch.length) return;
    batch.sort((a, b) => a.spring.ty - b.spring.ty || a.spring.tx - b.spring.tx);
    const now = performance.now();
    const still = reduced() || s.animateFrom === 'none';
    const rootWidth = rootEl?.clientWidth ?? 0;
    const centerY = visibleCenter();
    batch.forEach(({ id, spring }, rank) => {
      spring.shown = true;
      spring.blur = s.blurToFocus && !still;
      if (still) {
        spring.x = spring.tx;
        spring.y = spring.ty;
        spring.s = 1;
        spring.reveal = 1;
        spring.start = now;
        paint(id, spring);
        return;
      }
      const direction =
        s.animateFrom === 'random' ? DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)] : s.animateFrom;
      const distance = 60 + Math.min(spring.h, 280) * 0.35;
      spring.x = spring.tx;
      spring.y = spring.ty;
      spring.s = 0.96;
      if (direction === 'center') {
        spring.x = rootWidth / 2 - spring.w / 2;
        spring.y = centerY - spring.h / 2;
        spring.s = 0.55;
      } else if (direction === 'bottom') spring.y += distance;
      else if (direction === 'top') spring.y -= distance;
      else if (direction === 'left') spring.x -= distance;
      else if (direction === 'right') spring.x += distance;
      spring.vx = spring.vy = spring.vs = 0;
      spring.reveal = 0;
      spring.start = now + rank * s.stagger * 1000;
      paint(id, spring);
    });
    kick();
  };

  const requestReveal = (id: string) => {
    const spring = springs.get(id);
    if (!spring || spring.shown) return;
    if (!loaded.has(id)) {
      waiting.add(id);
      return;
    }
    waiting.delete(id);
    pending.add(id);
    if (!engine.flush) engine.flush = requestAnimationFrame(flushReveals);
  };

  const markLoaded = (id: string) => {
    loaded.add(id);
    const node = nodes.get(id);
    node?.querySelector('img')?.setAttribute('data-loaded', '');
    if (waiting.has(id)) requestReveal(id);
  };

  createEffect(keyedItems, list => {
    const missing = list.filter(item => needsMeasure(item) && !measuredNow[keyOf(item)]);
    if (!missing.length) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setTimedOut(true);
    }, 2500);
    missing.forEach(item => {
      const image = new Image();
      image.onload = () => {
        if (cancelled || !image.naturalWidth) return;
        measuredNow = { ...measuredNow, [keyOf(item)]: image.naturalHeight / image.naturalWidth };
        setMeasured(measuredNow);
      };
      image.src = item.img;
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  });

  createEffect(keyedItems, list => {
    const live = new Set(list.map(keyOf));
    const leaving: Ghost[] = [];
    previous.forEach((entry, id) => {
      if (live.has(id)) return;
      const spring = springs.get(id);
      previous.delete(id);
      if (!spring?.shown) return;
      leaving.push({ id, item: entry.item, x: spring.x, y: spring.y, s: spring.s, w: entry.w, h: entry.h });
      springs.delete(id);
    });
    if (leaving.length) setGhosts(current => [...current.filter(ghost => !live.has(ghost.id)), ...leaving]);
  });

  createEffect(layout, current => {
    if (!current) return;
    const instant = reduced();
    current.tiles.forEach(tile => {
      const node = nodes.get(tile.id);
      let spring = springs.get(tile.id);
      if (!spring) {
        spring = {
          x: tile.x,
          y: tile.y,
          s: 1,
          vx: 0,
          vy: 0,
          vs: 0,
          tx: tile.x,
          ty: tile.y,
          w: tile.w,
          h: tile.h,
          shown: false,
          dragging: false,
          blur: false,
          reveal: 0,
          start: 0
        };
        springs.set(tile.id, spring);
        if (node) {
          node.style.opacity = '0';
          node.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0)`;
        }
      } else if (spring.shown && Math.abs(spring.w - tile.w) > 0.5 && !instant) {
        spring.s *= spring.w / tile.w;
      }
      spring.tx = tile.x;
      spring.ty = tile.y;
      spring.w = tile.w;
      spring.h = tile.h;
      if (!spring.shown) {
        spring.x = tile.x;
        spring.y = tile.y;
        if (node) node.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0)`;
      } else if (instant && !spring.dragging) {
        spring.x = tile.x;
        spring.y = tile.y;
        spring.s = 1;
        paint(tile.id, spring);
      }
      previous.set(tile.id, { item: tile.item, w: tile.w, h: tile.h });
    });
    if (rootEl) rootEl.style.height = `${current.height}px`;
    kick();
  });

  createEffect(
    () => ({ current: layout(), onScroll: settings().revealOnScroll }),
    ({ current, onScroll }) => {
      if (!current) return undefined;
      const ids = current.tiles.map(tile => tile.id);
      if (!onScroll || typeof IntersectionObserver === 'undefined') {
        ids.forEach(requestReveal);
        return undefined;
      }
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute('data-id');
            if (id) requestReveal(id);
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -6% 0px' }
      );
      ids.forEach(id => {
        const node = nodes.get(id);
        if (node && !springs.get(id)?.shown) observer.observe(node);
      });
      return () => observer.disconnect();
    }
  );

  createEffect(layout, () => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    waiting.forEach(id => {
      timers.push(
        setTimeout(() => {
          if (!waiting.has(id)) return;
          loaded.add(id);
          requestReveal(id);
        }, 2500)
      );
    });
    return () => timers.forEach(clearTimeout);
  });

  createEffect(ghosts, list => {
    list.forEach(ghost => {
      const node = ghostNodes.get(ghost.id);
      if (!node || node.getAttribute('data-leaving')) return;
      node.setAttribute('data-leaving', '');
      const from = `translate3d(${ghost.x}px, ${ghost.y}px, 0) scale(${ghost.s})`;
      const to = `translate3d(${ghost.x + ghost.w * 0.04}px, ${ghost.y + ghost.h * 0.04}px, 0) scale(${ghost.s * 0.92})`;
      const animation = node.animate(
        [
          { transform: from, opacity: 1 },
          { transform: to, opacity: 0 }
        ],
        { duration: reduced() ? 1 : 320, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
      );
      animation.finished
        .then(() => setGhosts(current => current.filter(entry => entry.id !== ghost.id)))
        .catch(() => {});
    });
  });

  createEffect(
    () => ({ current: layout(), strength: settings().parallax }),
    ({ current, strength }) => {
      const layers = () => [...nodes.values()].map(node => node.querySelector<HTMLElement>('[data-parallax]'));
      if (!strength || !current) {
        layers().forEach(layer => {
          if (layer) layer.style.transform = '';
        });
        return undefined;
      }
      let raf = 0;
      const scroller = scrollerOf(rootEl);
      const update = () => {
        raf = 0;
        const view = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
        const top = Math.max(view.top, 0);
        const bottom = Math.min(view.bottom, window.innerHeight);
        const center = (top + bottom) / 2;
        nodes.forEach(node => {
          const layer = node.querySelector<HTMLElement>('[data-parallax]');
          if (!layer) return;
          const rect = node.getBoundingClientRect();
          if (rect.bottom < top - 200 || rect.top > bottom + 200) return;
          const reach = strength * 0.2 * rect.height;
          const shift = clamp(-(rect.top + rect.height / 2 - center) * strength * 0.25, -reach, reach);
          layer.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${(1 + strength * 0.4 + 0.002).toFixed(3)})`;
        });
      };
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(update);
      };
      update();
      window.addEventListener('scroll', schedule, { capture: true, passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', schedule, { capture: true });
        window.removeEventListener('resize', schedule);
      };
    }
  );

  const setDimmed = (activeId: string | null) => {
    nodes.forEach((node, id) => {
      if (activeId && id !== activeId) node.setAttribute('data-dimmed', '');
      else node.removeAttribute('data-dimmed');
    });
  };

  const onEnter = (id: string) => {
    if (settings().focusOnHover && !drag?.active) setDimmed(id);
  };

  const onLeave = (card: HTMLElement) => {
    if (settings().focusOnHover) setDimmed(null);
    card.style.removeProperty('--masonry-tilt-x');
    card.style.removeProperty('--masonry-tilt-y');
  };

  const onTilt = (event: PointerEvent, card: HTMLElement) => {
    if (settings().hoverEffect !== 'tilt' || drag?.active) return;
    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--masonry-tilt-x', `${(-py * 10).toFixed(2)}deg`);
    card.style.setProperty('--masonry-tilt-y', `${(px * 10).toFixed(2)}deg`);
  };

  const detachDrag = () => {
    window.removeEventListener('pointermove', moveDrag);
    window.removeEventListener('pointerup', finishDrag);
    window.removeEventListener('pointercancel', finishDrag);
  };

  const finishDrag = () => {
    const current = drag;
    detachDrag();
    drag = null;
    if (!current?.active) return;
    const spring = springs.get(current.id);
    const node = nodes.get(current.id);
    if (spring) spring.dragging = false;
    node?.removeAttribute('data-dragging');
    rootEl?.removeAttribute('data-dragging');
    suppress = true;
    setTimeout(() => {
      suppress = false;
    }, 0);
    kick();
    if (current.moved) props.onReorder?.(ordered());
  };

  const moveDrag = (event: PointerEvent) => {
    const current = drag;
    const root = rootEl;
    if (!current || !root || event.pointerId !== current.pointerId) return;
    if (!current.active) {
      if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return;
      const spring = springs.get(current.id);
      if (!spring?.shown) return;
      current.active = true;
      spring.dragging = true;
      spring.vx = spring.vy = spring.vs = 0;
      nodes.get(current.id)?.setAttribute('data-dragging', '');
      root.setAttribute('data-dragging', '');
      setDimmed(null);
    }
    const rect = root.getBoundingClientRect();
    const spring = springs.get(current.id);
    if (!spring) return;
    spring.x = event.clientX - rect.left - current.offsetX;
    spring.y = event.clientY - rect.top - current.offsetY;
    spring.s = 1;
    paint(current.id, spring);
    kick();
    const list = ordered();
    const dragged = list.find(item => keyOf(item) === current.id);
    const gridWidth = width();
    if (!dragged || !gridWidth) return;
    const others = list.filter(item => keyOf(item) !== current.id);
    const slots = slotsFor(others, dragged, gridWidth, columns(), columnWidth(), settings().gap, measured());
    const cx = spring.x + spring.w / 2;
    const cy = spring.y + spring.h / 2;
    const index = list.indexOf(dragged);
    let best = index;
    let nearest = Math.hypot(slots[index].x - cx, slots[index].y - cy);
    const threshold = nearest * 0.8 - 6;
    slots.forEach((slot, slotIndex) => {
      const distance = Math.hypot(slot.x - cx, slot.y - cy);
      if (distance < nearest && distance < threshold) {
        nearest = distance;
        best = slotIndex;
      }
    });
    if (best === index) return;
    const ids = others.map(keyOf);
    ids.splice(best, 0, current.id);
    current.moved = true;
    setOrder({ key: itemsKey(), ids });
  };

  const startDrag = (event: PointerEvent, id: string) => {
    if (!settings().draggable || event.button !== 0 || event.pointerType === 'touch' || openNow) return;
    const root = rootEl;
    const spring = springs.get(id);
    if (!root || !spring) return;
    const rect = root.getBoundingClientRect();
    drag = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left - spring.x,
      offsetY: event.clientY - rect.top - spring.y,
      active: false,
      moved: false
    };
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  };

  const onCardClick = (event: MouseEvent, item: MasonryItem, index: number) => {
    if (suppress) {
      event.preventDefault();
      return;
    }
    props.onItemClick?.(item, index, event);
    if (event.defaultPrevented) return;
    if (settings().lightbox) {
      event.preventDefault();
      token += 1;
      closing = false;
      setOpenId(keyOf(item));
    }
  };

  const mediaRect = (id: string) => nodes.get(id)?.querySelector('[data-media]')?.getBoundingClientRect() ?? null;

  const frameFor = (item: MasonryItem, known: Measured) => {
    const aspect = aspectOf(item, known);
    const pad = window.innerWidth < 640 ? 16 : 72;
    const room = item.title || item.description || item.url ? 64 : 0;
    const maxW = Math.max(40, window.innerWidth - pad * 2);
    const maxH = Math.max(40, window.innerHeight - pad * 2 - room);
    let w = maxW;
    let h = w * aspect;
    if (h > maxH) {
      h = maxH;
      w = h / aspect;
    }
    const left = (window.innerWidth - w) / 2;
    const top = (window.innerHeight - room - h) / 2;
    return { left, top, width: w, height: h, room };
  };

  const boxView = createMemo(() => {
    const open = openItem();
    if (!open || typeof document === 'undefined') return null;
    return { item: open.item, frame: frameFor(open.item, measured()) };
  });

  const closeBox = () => {
    const id = openNow;
    if (!id || closing) return;
    token += 1;
    const ticket = token;
    const box = boxEl;
    const image = box?.querySelector<HTMLElement>('[data-box-image]');
    const backdrop = box?.querySelector<HTMLElement>('[data-box-backdrop]');
    const rect = mediaRect(id);
    closing = true;
    if (!image || !rect || reduced()) {
      setOpenId(null);
      closing = false;
      return;
    }
    const current = image.getBoundingClientRect();
    const scale = rect.width / current.width;
    image.getAnimations().forEach(animation => animation.cancel());
    const animation = image.animate(
      [
        { transform: 'none', borderRadius: '6px' },
        {
          transform: `translate(${rect.left - current.left}px, ${rect.top - current.top}px) scale(${scale})`,
          borderRadius: `${radius() / Math.max(scale, 0.01)}px`
        }
      ],
      { duration: 380, easing: EASE, fill: 'forwards' }
    );
    backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease', fill: 'forwards' });
    box
      ?.querySelectorAll('[data-box-fade]')
      .forEach(node => node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
    animation.finished
      .then(() => {
        if (ticket !== token) return;
        setOpenId(null);
        closing = false;
      })
      .catch(() => {});
  };

  const stepBox = (direction: number) => {
    const list = ordered();
    const index = openNow ? list.findIndex(item => keyOf(item) === openNow) : -1;
    if (index < 0 || closing || list.length < 2) return;
    const next = list[(index + direction + list.length) % list.length];
    setOpenId(keyOf(next));
  };

  createEffect(openId, id => {
    if (!id) return undefined;
    const node = nodes.get(id);
    node?.setAttribute('data-hidden', '');
    return () => node?.removeAttribute('data-hidden');
  });

  createEffect(
    () => ({ id: openId(), r: radius() }),
    ({ id, r }) => {
      const box = boxEl;
      if (!id || !box) {
        opened = null;
        return;
      }
      if (opened === id) return;
      const image = box.querySelector<HTMLElement>('[data-box-image]');
      const backdrop = box.querySelector<HTMLElement>('[data-box-backdrop]');
      const fades = box.querySelectorAll('[data-box-fade]');
      if (!image) return;
      if (opened) {
        image.animate(
          [
            { opacity: 0, transform: 'scale(0.97)' },
            { opacity: 1, transform: 'none' }
          ],
          { duration: reduced() ? 1 : 320, easing: EASE }
        );
        opened = id;
        return;
      }
      opened = id;
      const rect = mediaRect(id);
      const target = image.getBoundingClientRect();
      if (rect && !reduced()) {
        const scale = rect.width / target.width;
        image.animate(
          [
            {
              transform: `translate(${rect.left - target.left}px, ${rect.top - target.top}px) scale(${scale})`,
              borderRadius: `${r / Math.max(scale, 0.01)}px`
            },
            { transform: 'none', borderRadius: '6px' }
          ],
          { duration: 520, easing: EASE }
        );
        backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease' });
        fades.forEach(fade =>
          fade.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 560, easing: 'ease' })
        );
      }
    }
  );

  createEffect(
    () => Boolean(openId()),
    isOpen => {
      if (!isOpen) return undefined;
      const before = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      boxEl?.querySelector<HTMLElement>('[data-box-close]')?.focus({ preventScroll: true });
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') closeBox();
        else if (event.key === 'ArrowRight') stepBox(1);
        else if (event.key === 'ArrowLeft') stepBox(-1);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        document.documentElement.style.overflow = before;
        nodes
          .get(lastShown ?? '')
          ?.querySelector<HTMLElement>('[data-card]')
          ?.focus({ preventScroll: true });
      };
    }
  );

  onSettled(() => {
    const root = rootEl;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(root);
    setWidth(Math.round(root.getBoundingClientRect().width));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(engine.raf);
      cancelAnimationFrame(engine.flush);
      engine.raf = 0;
      engine.flush = 0;
      detachDrag();
      drag = null;
    };
  });

  return (
    <div
      ref={el => (rootEl = el)}
      class={[ROOT, props.className]}
      style={{ '--masonry-radius': `${Math.max(0, radius())}px`, ...(props.style ?? {}) }}
      data-hover={settings().hoverEffect}
      role="list"
    >
      <For each={layout()?.tiles ?? []} keyed={(tile: Tile) => tile.id}>
        {(tile, index) => {
          const id = untrack(() => tile().id);
          let node: HTMLDivElement | undefined;
          onCleanup(() => {
            if (node && nodes.get(id) === node) nodes.delete(id);
          });
          const label = () => tile().item.title || tile().item.alt || undefined;
          const handlers = {
            onClick: (event: MouseEvent) => onCardClick(event, tile().item, index()),
            onPointerDown: (event: PointerEvent) => startDrag(event, id),
            onPointerEnter: () => onEnter(id),
            onPointerLeave: (event: PointerEvent) => onLeave(event.currentTarget as HTMLElement),
            onPointerMove: (event: PointerEvent) => onTilt(event, event.currentTarget as HTMLElement)
          };
          const content = () => (
            <span class={MEDIA} data-media="">
              <span class={PARALLAX} data-parallax="">
                <img
                  class={IMAGE}
                  src={tile().item.img}
                  alt={tile().item.alt ?? tile().item.title ?? ''}
                  draggable="false"
                  decoding="async"
                  data-loaded={loaded.has(id) ? '' : undefined}
                  onLoad={() => markLoaded(id)}
                  onError={() => markLoaded(id)}
                />
              </span>
              <Show when={captionMode() !== 'none' && (tile().item.title || tile().item.description)}>
                <span class={CAPTION} data-mode={captionMode()}>
                  <Show when={tile().item.title}>
                    <span class={TITLE}>{tile().item.title}</span>
                  </Show>
                  <Show when={tile().item.description}>
                    <span class={TEXT}>{tile().item.description}</span>
                  </Show>
                </span>
              </Show>
            </span>
          );
          return (
            <div
              ref={el => {
                node = el;
                nodes.set(id, el);
              }}
              class={ITEM}
              style={{ width: `${tile().w}px`, height: `${tile().h}px` }}
              data-id={id}
              role="listitem"
            >
              <Switch>
                <Match when={!settings().lightbox && tile().item.url}>
                  <a
                    class={CARD}
                    data-card=""
                    {...handlers}
                    href={tile().item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    draggable="false"
                    aria-label={label()}
                  >
                    {content()}
                  </a>
                </Match>
                <Match when={settings().lightbox || props.onItemClick}>
                  <button class={CARD} data-card="" {...handlers} type="button" aria-label={label()}>
                    {content()}
                  </button>
                </Match>
                <Match when={true}>
                  <div class={CARD} data-card="" {...handlers}>
                    {content()}
                  </div>
                </Match>
              </Switch>
            </div>
          );
        }}
      </For>
      <For each={ghosts()}>
        {ghost => {
          let node: HTMLDivElement | undefined;
          onCleanup(() => {
            if (node && ghostNodes.get(ghost.id) === node) ghostNodes.delete(ghost.id);
          });
          return (
            <div
              ref={el => {
                node = el;
                ghostNodes.set(ghost.id, el);
              }}
              class={GHOST}
              style={{
                width: `${ghost.w}px`,
                height: `${ghost.h}px`,
                transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0) scale(${ghost.s})`
              }}
              aria-hidden="true"
            >
              <div class={MEDIA}>
                <img class={IMAGE} src={ghost.item.img} alt="" data-loaded="" draggable="false" />
              </div>
            </div>
          );
        }}
      </For>
      <Show when={boxView()}>
        {view => (
          <Portal>
            <div
              ref={el => (boxEl = el)}
              class={BOX}
              role="dialog"
              aria-modal="true"
              aria-label={view().item.title || view().item.alt || 'Image'}
            >
              <div class={BOX_BACKDROP} data-box-backdrop="" onClick={() => closeBox()} />
              <img
                class={BOX_IMAGE}
                data-box-image=""
                src={view().item.img}
                alt={view().item.alt ?? view().item.title ?? ''}
                draggable="false"
                style={{
                  width: `${view().frame.width}px`,
                  height: `${view().frame.height}px`,
                  left: `${view().frame.left}px`,
                  top: `${view().frame.top}px`,
                  'border-radius': '6px'
                }}
                onClick={() => closeBox()}
              />
              <Show when={view().frame.room > 0}>
                <div
                  class={BOX_CAPTION}
                  data-box-fade=""
                  style={{ top: `${view().frame.top + view().frame.height + 18}px` }}
                >
                  <Show when={view().item.title}>
                    <span>{view().item.title}</span>
                  </Show>
                  <Show when={view().item.description}>
                    <span class={BOX_MUTED}>{view().item.description}</span>
                  </Show>
                  <Show when={view().item.url}>
                    <a href={view().item.url} target="_blank" rel="noopener noreferrer">
                      Open
                      <Icon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
                    </a>
                  </Show>
                </div>
              </Show>
              <button
                type="button"
                class={BOX_CLOSE}
                data-box-fade=""
                data-box-close=""
                aria-label="Close"
                onClick={() => closeBox()}
              >
                <Icon icon={Cancel01Icon} size={20} strokeWidth={2} />
              </button>
              <Show when={ordered().length > 1}>
                <button
                  type="button"
                  class={BOX_PREV}
                  data-box-fade=""
                  aria-label="Previous"
                  onClick={() => stepBox(-1)}
                >
                  <Icon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
                </button>
                <button type="button" class={BOX_NEXT} data-box-fade="" aria-label="Next" onClick={() => stepBox(1)}>
                  <Icon icon={ArrowRight01Icon} size={20} strokeWidth={2} />
                </button>
              </Show>
            </div>
          </Portal>
        )}
      </Show>
    </div>
  );
}
