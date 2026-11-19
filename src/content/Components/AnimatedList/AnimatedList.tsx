import { For, Show, createEffect, createMemo, createSignal, createUniqueId, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  CodeIcon,
  FigmaIcon,
  File01Icon,
  FileZipIcon,
  Folder01Icon,
  Image01Icon,
  MusicNote01Icon,
  Note01Icon,
  Pdf01Icon,
  Presentation01Icon,
  Table01Icon,
  Video01Icon
} from '@hugeicons/core-free-icons';

import './AnimatedList.css';

export interface AnimatedListEntry {
  id?: string | number;
  icon?: JSX.Element;
  image?: string;
  title: JSX.Element;
  description?: JSX.Element;
  meta?: JSX.Element;
}

export type AnimatedListItem = string | AnimatedListEntry;

type Animation = 'pop' | 'slide' | 'fade';
type State = 'in' | 'above' | 'below';

export interface AnimatedListProps {
  items?: AnimatedListItem[];
  onItemSelect?: (item: AnimatedListItem, index: number) => void;
  renderItem?: (item: AnimatedListItem, index: number, isSelected: boolean) => JSX.Element;
  initialSelectedIndex?: number;
  selectOnHover?: boolean;
  enableArrowNavigation?: boolean;
  loop?: boolean;
  animation?: Animation | 'none';
  animateOnce?: boolean;
  stagger?: number;
  showGradients?: boolean;
  fadeSize?: number;
  displayScrollbar?: boolean;
  frame?: boolean;
  theme?: 'dark' | 'light';
  accentColor?: string;
  radius?: number;
  gap?: number;
  width?: number | string;
  maxHeight?: number | string;
  className?: string;
  itemClassName?: string;
  style?: JSX.CSSProperties;
}

type IconSvgElement = readonly (readonly [string, { readonly [key: string]: string | number }])[];

type Settings = {
  items: AnimatedListItem[];
  selected: number;
  selectOnHover: boolean;
  enableArrowNavigation: boolean;
  loop: boolean;
  animation: Animation | 'none';
  animateOnce: boolean;
  stagger: number;
  showGradients: boolean;
  fadeSize: number;
};

interface Engine {
  place: (snap: boolean) => void;
  syncRing: () => void;
  updateFades: () => void;
  sync: () => void;
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--al-frame': 'rgba(36, 38, 41, 0.66)',
    '--al-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--al-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--al-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--al-tile': 'linear-gradient(180deg, #37393d 0%, #25272a 100%)',
    '--al-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--al-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--al-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--al-well': 'rgba(255, 255, 255, 0.08)',
    '--al-ink': '#f4f5f6',
    '--al-muted': 'rgba(244, 245, 246, 0.55)',
    '--al-thumb': 'rgba(255, 255, 255, 0.16)',
    '--al-ring': 'rgba(244, 245, 246, 0.3)',
    '--al-ring-fill': 'rgba(244, 245, 246, 0.05)',
    '--al-hover': 'brightness(1.12)',
    '--al-press': 'brightness(0.85)',
    '--al-active': 'brightness(1.16)'
  },
  light: {
    '--al-frame': 'rgba(240, 241, 243, 0.8)',
    '--al-frame-edge': 'rgba(22, 24, 27, 0.07)',
    '--al-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--al-frame-shadow': '0 22px 44px -22px rgba(22, 24, 27, 0.3), 0 6px 16px -10px rgba(22, 24, 27, 0.16)',
    '--al-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)',
    '--al-tile-edge': 'rgba(22, 24, 27, 0.08)',
    '--al-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--al-tile-shadow': '0 4px 10px -5px rgba(22, 24, 27, 0.25)',
    '--al-well': 'rgba(22, 24, 27, 0.05)',
    '--al-ink': '#26282b',
    '--al-muted': 'rgba(38, 40, 43, 0.55)',
    '--al-thumb': 'rgba(22, 24, 27, 0.16)',
    '--al-ring': 'rgba(22, 24, 27, 0.28)',
    '--al-ring-fill': 'transparent',
    '--al-hover': 'brightness(0.97)',
    '--al-press': 'brightness(0.92)',
    '--al-active': 'none'
  }
};

const iconMarkup = (icon: IconSvgElement) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${name === 'stroke-width' ? 1.8 : value}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const glyph = (icon: IconSvgElement): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    color="currentColor"
    innerHTML={iconMarkup(icon)}
  />
);

const file = (icon: IconSvgElement, title: string, description: string, meta: string): AnimatedListEntry => ({
  get icon() {
    return glyph(icon);
  },
  title,
  description,
  meta
});

const DEFAULT_ITEMS: AnimatedListEntry[] = [
  file(Folder01Icon, 'Brand assets', '24 files', '2m'),
  file(Image01Icon, 'Launch hero.png', '2.4 MB', '18m'),
  file(Video01Icon, 'Product tour.mp4', '148 MB', '1h'),
  file(Note01Icon, 'Pricing notes', '1,240 words', '3h'),
  file(CodeIcon, 'landing-page.tsx', '12 KB', '5h'),
  file(FigmaIcon, 'Onboarding flow', '38 frames', '8h'),
  file(MusicNote01Icon, 'Ambient loop.wav', '9.1 MB', '1d'),
  file(Table01Icon, 'Q3 forecast', '4 sheets', '1d'),
  file(Pdf01Icon, 'Brand guidelines.pdf', '6.8 MB', '2d'),
  file(Presentation01Icon, 'Investor update', '22 slides', '3d'),
  file(FileZipIcon, 'Icon set.zip', '1.2 MB', '4d'),
  file(Image01Icon, 'Moodboard.jpg', '3.6 MB', '5d'),
  file(File01Icon, 'Release notes', 'Version 2.4', '1w'),
  file(Folder01Icon, 'Archive', '118 files', '2w'),
  file(Video01Icon, 'Teaser cut.mov', '86 MB', '3w')
];

const HIDDEN: Record<Animation, Record<'above' | 'below', string>> = {
  pop: { above: 'translate3d(0, -12px, 0) scale(0.8)', below: 'translate3d(0, 12px, 0) scale(0.8)' },
  slide: { above: 'translate3d(0, -28px, 0) scale(0.98)', below: 'translate3d(0, 28px, 0) scale(0.98)' },
  fade: { above: 'translate3d(0, -4px, 0)', below: 'translate3d(0, 4px, 0)' }
};

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const FADE_MASK = (() => {
  const steps = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
  const top = steps.map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) calc(var(--al-fade-top) * ${t})`);
  const bottom = [...steps]
    .reverse()
    .map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) calc(100% - var(--al-fade-bottom) * ${t})`);
  return `linear-gradient(to bottom, ${[...top, ...bottom].join(', ')})`;
})();

const size = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const toEntry = (item: AnimatedListItem): AnimatedListEntry =>
  item !== null && typeof item === 'object' ? item : { title: item };

function Row(props: { entry: AnimatedListEntry }) {
  return (
    <>
      {(() => {
        const entry = props.entry;
        if (entry.image) {
          return (
            <span class="animated-list__lead">
              <img src={entry.image} alt="" draggable="false" />
            </span>
          );
        }
        const icon = entry.icon;
        return icon ? <span class="animated-list__lead">{icon}</span> : null;
      })()}
      <span class="animated-list__text">
        <span class="animated-list__title">{props.entry.title}</span>
        <Show when={props.entry.description}>
          <span class="animated-list__description">{props.entry.description}</span>
        </Show>
      </span>
      <Show when={props.entry.meta}>
        <span class="animated-list__meta">{props.entry.meta}</span>
      </Show>
    </>
  );
}

export default function AnimatedList(props: AnimatedListProps) {
  let rootEl: HTMLDivElement | undefined;
  let viewportEl: HTMLDivElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  let indicatorEl: HTMLSpanElement | undefined;
  let ringEl: HTMLSpanElement | undefined;
  const itemEls: (HTMLDivElement | null)[] = [];
  let engine: Engine | null = null;
  let keyboard = false;
  let navigating = false;
  let current!: Settings;
  const [selected, setSelected] = createSignal(() => props.initialSelectedIndex ?? -1);
  const baseId = createUniqueId();

  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const animation = createMemo(() => props.animation ?? 'pop');
  const showGradients = createMemo(() => props.showGradients ?? true);
  const fadeSize = createMemo(() => props.fadeSize ?? 56);

  const settings = createMemo<Settings>(() => ({
    items: items(),
    selected: selected(),
    selectOnHover: props.selectOnHover ?? true,
    enableArrowNavigation: props.enableArrowNavigation ?? true,
    loop: props.loop ?? false,
    animation: animation(),
    animateOnce: props.animateOnce ?? false,
    stagger: props.stagger ?? 0.05,
    showGradients: showGradients(),
    fadeSize: fadeSize()
  }));

  createEffect(settings, value => {
    current = value;
  });

  onSettled(() => {
    current = settings();
    const root = rootEl;
    const viewport = viewportEl;
    const track = trackEl;
    const indicator = indicatorEl;
    const ring = ringEl;
    if (!root || !viewport || !track || !indicator || !ring) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const springEase = CSS.supports?.('transition-timing-function', 'linear(0, 1)')
      ? SPRING
      : 'cubic-bezier(0.34, 1.4, 0.64, 1)';
    const transition = `transform 620ms ${springEase}, opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 200ms ease`;
    const motion = { y: 0, h: 0, vy: 0, vh: 0, ty: 0, th: 0, ready: false };
    const fades = { top: '', bottom: '' };
    let boxes: (number[] | null)[] = [];
    let mode: Animation | 'none' | null = null;
    let entered = false;
    let engaged = false;
    let pointer = [0, 0];
    let raf = 0;
    let last = 0;

    const resolveMode = (): Animation | 'none' => {
      const chosen = current.animation;
      if (chosen === 'none' || !HIDDEN[chosen]) return 'none';
      return reduced ? 'fade' : chosen;
    };

    const apply = (element: HTMLElement, state: State) => {
      element.dataset.state = state;
      const pose = mode && mode !== 'none' && state !== 'in' ? HIDDEN[mode][state] : '';
      element.style.transform = pose;
      element.style.opacity = pose ? '0' : '';
    };

    const syncRing = () => {
      const item = itemEls[current.selected];
      if (!item) return;
      const state = (item.dataset.state as State | undefined) || 'in';
      if (state === ring.dataset.state) return;
      ring.style.transitionDelay = item.style.transitionDelay;
      apply(ring, state);
    };

    const write = () => {
      indicator.style.transform = `translate3d(0, ${motion.y.toFixed(2)}px, 0)`;
      indicator.style.height = `${motion.h.toFixed(2)}px`;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const omega = 30;
      const zeta = 0.78;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        motion.vy += (omega * omega * (motion.ty - motion.y) - 2 * zeta * omega * motion.vy) * h;
        motion.vh += (omega * omega * (motion.th - motion.h) - 2 * zeta * omega * motion.vh) * h;
        motion.y += motion.vy * h;
        motion.h += motion.vh * h;
      }
      const moving =
        Math.abs(motion.ty - motion.y) > 0.05 ||
        Math.abs(motion.th - motion.h) > 0.05 ||
        Math.abs(motion.vy) + Math.abs(motion.vh) > 0.5;
      if (!moving) {
        motion.y = motion.ty;
        motion.h = motion.th;
        motion.vy = motion.vh = 0;
      }
      write();
      if (moving) raf = requestAnimationFrame(frame);
    };

    const place = (snap: boolean) => {
      const item = itemEls[current.selected];
      if (!item) {
        indicator.style.opacity = '0';
        motion.ready = false;
        return;
      }
      indicator.style.opacity = '1';
      motion.ty = item.offsetTop;
      motion.th = item.offsetHeight;
      if (snap || reduced || !motion.ready) {
        motion.y = motion.ty;
        motion.h = motion.th;
        motion.vy = motion.vh = 0;
        motion.ready = true;
        write();
        return;
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const updateFades = () => {
      const s = current;
      const span = Math.max(1, s.fadeSize);
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const top = s.showGradients ? Math.min(span, Math.max(0, scrollTop)) : 0;
      const bottom = s.showGradients ? Math.min(span, Math.max(0, scrollHeight - clientHeight - scrollTop)) : 0;
      const nextTop = `${top.toFixed(1)}px`;
      const nextBottom = `${bottom.toFixed(1)}px`;
      if (nextTop !== fades.top) {
        fades.top = nextTop;
        viewport.style.setProperty('--al-fade-top', nextTop);
      }
      if (nextBottom !== fades.bottom) {
        fades.bottom = nextBottom;
        viewport.style.setProperty('--al-fade-bottom', nextBottom);
      }
    };

    const measure = () => {
      const offset = track.offsetTop;
      boxes = itemEls.map(item => (item ? [offset + item.offsetTop, item.offsetHeight] : null));
    };

    const reveal = (entrance: boolean) => {
      if (!entered) return;
      const s = current;
      const top = viewport.scrollTop;
      const view = viewport.clientHeight;
      let order = 0;
      itemEls.forEach((item, index) => {
        const box = boxes[index];
        if (!item || !box) return;
        const start = box[0] - top;
        const overlap = Math.min(view, start + box[1]) - Math.max(0, start);
        const hidden =
          mode !== 'none' && overlap < Math.min(box[1], view) * 0.5 && !(s.animateOnce && item.dataset.seen);
        const state = hidden ? (start + box[1] / 2 < view / 2 ? 'above' : 'below') : 'in';
        if (state === item.dataset.state) return;
        const delay = entrance && !hidden ? (order++ * Math.max(0, s.stagger)).toFixed(3) : 0;
        item.style.transitionDelay = delay ? `${delay}s, ${delay}s, 0s` : '';
        if (!hidden) item.dataset.seen = 'true';
        apply(item, state);
      });
      syncRing();
    };

    const sync = () => {
      const s = current;
      itemEls.length = s.items.length;
      const list = itemEls.filter((item): item is HTMLDivElement => Boolean(item));
      const next = resolveMode();
      const changed = next !== mode;
      const restyle = changed ? list : list.filter(item => !item.dataset.state);
      mode = next;
      if (mode === 'none') entered = true;
      if (restyle.length) {
        const elements = changed ? [...restyle, ring] : restyle;
        for (const element of elements) element.style.transition = 'none';
        for (const item of restyle)
          apply(item, mode === 'none' ? 'in' : (item.dataset.state as State | undefined) || 'below');
        if (changed) apply(ring, (itemEls[s.selected]?.dataset.state as State | undefined) || 'in');
        void root.offsetHeight;
        for (const element of elements) element.style.transition = transition;
      }
      measure();
      reveal(restyle.length > 0);
    };

    sync();

    const gate =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries, observer) => {
              if (!entries.some(entry => entry.isIntersecting)) return;
              observer.disconnect();
              if (entered) return;
              entered = true;
              measure();
              reveal(true);
            },
            { rootMargin: '0px 0px -10% 0px' }
          );
    if (!entered) {
      if (gate) gate.observe(root);
      else {
        entered = true;
        reveal(true);
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      place(true);
      updateFades();
      measure();
      reveal(false);
    });
    resizeObserver.observe(viewport);
    resizeObserver.observe(track);

    const onScroll = () => {
      updateFades();
      reveal(false);
    };

    const onKey = (event: KeyboardEvent) => {
      const s = current;
      if (!s.enableArrowNavigation || event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const active = document.activeElement;
      const focused = active === viewport;
      const idle = !active || active === document.body || active === document.documentElement;
      if (!focused && !(engaged && idle)) return;
      const count = s.items.length;
      if (!count) return;
      const index = s.selected;
      let next: number | null = null;
      if (event.key === 'ArrowDown') next = index < 0 ? 0 : index + 1;
      else if (event.key === 'ArrowUp') next = index < 0 ? count - 1 : index - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = count - 1;
      else if ((event.key === 'Enter' || (focused && event.key === ' ')) && index >= 0 && index < count) {
        event.preventDefault();
        props.onItemSelect?.(s.items[index], index);
        return;
      }
      if (next === null) return;
      event.preventDefault();
      next = s.loop ? (next + count) % count : Math.min(count - 1, Math.max(0, next));
      keyboard = true;
      navigating = true;
      setSelected(next);
    };

    const onPointerMove = (event: PointerEvent) => {
      const moved = event.clientX !== pointer[0] || event.clientY !== pointer[1];
      pointer = [event.clientX, event.clientY];
      if (!navigating || !moved) return;
      navigating = false;
      const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-index]') : null;
      if (item && root.contains(item) && current.selectOnHover) setSelected(Number(item.dataset.index));
    };

    const onEnter = () => {
      engaged = true;
    };
    const onLeave = () => {
      engaged = false;
    };

    viewport.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointermove', onPointerMove);

    updateFades();
    place(true);
    syncRing();

    engine = { place, syncRing, updateFades, sync };

    return () => {
      cancelAnimationFrame(raf);
      gate?.disconnect();
      resizeObserver.disconnect();
      viewport.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointermove', onPointerMove);
      engine = null;
    };
  });

  createEffect(
    () => [items(), animation()],
    () => {
      engine?.sync();
    }
  );

  createEffect(
    () => ({ index: selected(), fade: fadeSize(), gradients: showGradients() }),
    ({ index, fade, gradients }) => {
      if (!engine) return;
      engine.place(false);
      engine.syncRing();
      if (!keyboard) return;
      keyboard = false;
      const viewport = viewportEl;
      const track = trackEl;
      const item = itemEls[index];
      if (!viewport || !track || !item) return;
      const top = track.offsetTop + item.offsetTop;
      const bottom = top + item.offsetHeight;
      const room = Math.max(0, (viewport.clientHeight - item.offsetHeight) / 2);
      const margin = Math.min(gradients ? Math.max(12, fade) : 12, room);
      if (top < viewport.scrollTop + margin) {
        viewport.scrollTo({ top: Math.max(0, top - margin), behavior: 'smooth' });
      } else if (bottom > viewport.scrollTop + viewport.clientHeight - margin) {
        viewport.scrollTo({ top: bottom - viewport.clientHeight + margin, behavior: 'smooth' });
      }
    }
  );

  createEffect(
    () => [showGradients(), fadeSize(), props.maxHeight, props.gap],
    () => {
      engine?.updateFades();
    }
  );

  const hover = (index: number) => {
    if (!navigating) setSelected(index);
  };

  const choose = (item: AnimatedListItem, index: number) => {
    setSelected(index);
    props.onItemSelect?.(item, index);
  };

  const rootStyle = createMemo<JSX.CSSProperties>(() => {
    const accent = props.accentColor;
    return {
      ...(THEMES[props.theme ?? 'dark'] ?? THEMES.dark),
      '--al-radius': `${Math.max(0, props.radius ?? 14)}px`,
      '--al-gap': `${Math.max(0, props.gap ?? 8)}px`,
      '--al-width': size(props.width ?? 420),
      '--al-accent': accent || 'var(--al-ink)',
      ...(accent ? { '--al-ring': accent, '--al-ring-fill': `color-mix(in srgb, ${accent} 8%, transparent)` } : {}),
      ...props.style
    };
  });

  const viewportStyle = createMemo<JSX.CSSProperties>(() => {
    const mask = showGradients() ? FADE_MASK : undefined;
    return {
      'max-height': size(props.maxHeight ?? 440),
      'mask-image': mask,
      '-webkit-mask-image': mask
    };
  });

  return (
    <div
      ref={el => (rootEl = el)}
      class={['animated-list', { 'animated-list--framed': props.frame ?? true }, props.className]}
      data-animated={animation() !== 'none' ? '' : undefined}
      style={rootStyle()}
    >
      <div
        ref={el => (viewportEl = el)}
        class={['animated-list__viewport', { 'animated-list__viewport--bare': !(props.displayScrollbar ?? true) }]}
        role="listbox"
        tabindex={0}
        aria-activedescendant={selected() >= 0 && selected() < items().length ? `${baseId}-${selected()}` : undefined}
        style={viewportStyle()}
      >
        <div ref={el => (trackEl = el)} class="animated-list__track">
          <For each={items()} keyed={false}>
            {(item, index) => (
              <div
                ref={el => {
                  itemEls[index] = el;
                }}
                id={`${baseId}-${index}`}
                class={['animated-list__item', props.itemClassName]}
                role="option"
                aria-selected={index === selected() ? 'true' : 'false'}
                data-index={index}
                data-selected={index === selected() ? '' : undefined}
                onPointerEnter={() => {
                  if (props.selectOnHover ?? true) hover(index);
                }}
                onClick={() => choose(item(), index)}
              >
                {props.renderItem ? (
                  props.renderItem(item(), index, index === selected())
                ) : (
                  <Row entry={toEntry(item())} />
                )}
                <span class="animated-list__rim" aria-hidden="true" />
              </div>
            )}
          </For>
          <span ref={el => (indicatorEl = el)} class="animated-list__indicator" aria-hidden="true">
            <span ref={el => (ringEl = el)} class="animated-list__ring" />
          </span>
        </div>
      </div>
      <Show when={props.frame ?? true}>
        <span class="animated-list__frame-rim" aria-hidden="true" />
      </Show>
    </div>
  );
}
