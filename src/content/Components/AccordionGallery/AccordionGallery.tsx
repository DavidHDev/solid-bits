import { For, Show, createEffect, createMemo, createSignal, onSettled, type Component } from 'solid-js';
import { dynamic, type JSX } from '@solidjs/web';
import { gsap } from 'gsap';

import './AccordionGallery.css';

export interface AccordionGalleryItem {
  image: string;
  label?: string;
  link?: string;
  alt?: string;
}

export interface AccordionGalleryProps {
  items?: AccordionGalleryItem[];
  defaultIndex?: number;
  accentColor?: string;
  overlayColor?: string;
  textColor?: string;
  height?: number;
  gap?: number;
  radius?: number;
  expandRatio?: number;
  orientation?: 'horizontal' | 'vertical';
  duration?: number;
  ease?: string;
  parallax?: number;
  tilt?: number;
  stagger?: number;
  trigger?: 'hover' | 'click';
  showLabels?: boolean;
  grayscale?: boolean;
  className?: string;
}

const DEFAULT_ITEMS: AccordionGalleryItem[] = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' }
];

type Layout = {
  active: number;
  count: number;
  gap: number;
  expandRatio: number;
  duration: number;
  ease: string;
  vertical: boolean;
  tilt: number;
  parallax: number;
  grayscale: boolean;
  showLabels: boolean;
  stagger: number;
};

export default function AccordionGallery(props: AccordionGalleryProps) {
  let rootEl: HTMLDivElement | undefined;
  const panelRefs: (HTMLElement | null)[] = [];
  const mediaRefs: (HTMLElement | null)[] = [];
  const barRefs: (HTMLElement | null)[] = [];
  const textRefs: (HTMLElement | null)[] = [];
  let tl: gsap.core.Timeline | null = null;
  let firstRun = true;
  let mediaSize = 320;
  let current!: Layout;
  let refresh: (() => void) | null = null;

  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const count = createMemo(() => items().length);
  const vertical = createMemo(() => (props.orientation ?? 'horizontal') === 'vertical');
  const [active, setActive] = createSignal(() => Math.min(Math.max(props.defaultIndex ?? 2, 0), count() - 1));

  const layout = createMemo<Layout>(() => ({
    active: active(),
    count: count(),
    gap: props.gap ?? 10,
    expandRatio: props.expandRatio ?? 0.52,
    duration: props.duration ?? 0.6,
    ease: props.ease ?? 'power3.out',
    vertical: vertical(),
    tilt: props.tilt ?? 8,
    parallax: props.parallax ?? 0.5,
    grayscale: props.grayscale ?? true,
    showLabels: props.showLabels ?? true,
    stagger: props.stagger ?? 0.06
  }));

  const applyLayout = (animate: boolean) => {
    const s = current;
    const panels = panelRefs.slice(0, s.count);
    if (!panels.length) return;

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    const r = Math.min(Math.max(s.expandRatio, 0.2), 0.9);
    const grow = s.count > 1 ? (r * (s.count - 1)) / (1 - r) : 1;

    tl?.kill();
    const dur = animate && !prefersReduced ? s.duration : 0;
    const next = gsap.timeline();
    const ease = s.ease;

    panels.forEach((panel, i) => {
      if (!panel) return;
      const isActive = i === s.active;
      const media = mediaRefs[i];
      const bar = barRefs[i];
      const text = textRefs[i];

      const rot = isActive ? 0 : i < s.active ? s.tilt : -s.tilt;
      const rotProp = s.vertical ? { rotateX: -rot } : { rotateY: rot };

      next.to(panel, { flexGrow: isActive ? grow : 1, ...rotProp, duration: dur, ease }, 0);

      if (media) {
        const drift = Math.max(-1.5, Math.min(1.5, s.active - i));
        const shift = drift * s.parallax * mediaSize * 0.06;
        const gray = s.grayscale ? (isActive ? 0 : 1) : 0;
        next.to(
          media,
          {
            xPercent: -50,
            yPercent: -50,
            x: s.vertical ? 0 : isActive ? 0 : shift,
            y: s.vertical ? (isActive ? 0 : shift) : 0,
            '--ag-gray': gray,
            '--ag-dim': isActive ? 0 : 0.35,
            duration: dur,
            ease
          },
          0
        );
      }

      if (s.showLabels && bar && text && bar.isConnected && text.isConnected) {
        if (isActive) {
          next.to([bar, text], { opacity: 1, x: 0, duration: dur, ease, stagger: prefersReduced ? 0 : s.stagger }, 0);
        } else {
          next.to([bar, text], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0);
        }
      }
    });

    tl = next;
  };

  createEffect(layout, value => {
    current = value;
    refresh?.();
  });

  onSettled(() => {
    current = layout();
    const el = rootEl;
    if (!el) return;

    const measure = () => {
      const s = current;
      const rect = el.getBoundingClientRect();
      const total = s.vertical ? rect.height : rect.width;
      const usable = Math.max(total - s.gap * (s.count - 1), 120);
      const size = Math.max(140, usable * Math.min(Math.max(s.expandRatio, 0.2), 0.9) * 1.22);
      mediaSize = size;
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout(!firstRun);
    };

    measure();
    firstRun = false;
    refresh = measure;
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    return () => {
      ro.disconnect();
      refresh = null;
      tl?.kill();
      tl = null;
    };
  });

  const handleEnter = (i: number) => {
    if ((props.trigger ?? 'hover') === 'hover') setActive(i);
  };

  const handleClick = (i: number, e: MouseEvent) => {
    if (i !== active()) {
      e.preventDefault();
      setActive(i);
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent) => {
    const n = count();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i + 1) % n);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i - 1 + n) % n);
    }
  };

  const rootStyle = (): JSX.CSSProperties => {
    const height = props.height ?? 460;
    return {
      '--ag-accent': props.accentColor ?? '#ffffff',
      '--ag-overlay': props.overlayColor ?? '#060708',
      '--ag-text': props.textColor ?? '#ffffff',
      '--ag-gap': `${props.gap ?? 10}px`,
      '--ag-radius': `${props.radius ?? 16}px`,
      height: vertical() ? `${Math.round(height * 1.6)}px` : `${height}px`
    };
  };

  return (
    <div
      ref={el => (rootEl = el)}
      class={['accordion-gallery', { 'accordion-gallery--vertical': vertical() }, props.className]}
      style={rootStyle()}
      role="list"
      aria-label="Image accordion gallery"
    >
      <For each={items()} keyed={false}>
        {(item, i) => {
          const Tag = dynamic(() => (item().link ? 'a' : 'div')) as unknown as Component<Record<string, unknown>>;
          return (
            <Tag
              ref={(el: HTMLElement) => {
                panelRefs[i] = el;
              }}
              class={['ag-panel', { 'ag-panel--active': active() === i }]}
              style={{ 'border-radius': `${props.radius ?? 16}px` }}
              href={item().link || undefined}
              onClick={(e: MouseEvent) => handleClick(i, e)}
              onMouseEnter={() => handleEnter(i)}
              onFocus={() => setActive(i)}
              onKeyDown={(e: KeyboardEvent) => handleKeyDown(i, e)}
              role="listitem"
              tabindex={0}
              aria-current={active() === i ? 'true' : undefined}
              aria-label={item().label}
            >
              <span class="ag-panel__frame">
                <span
                  class="ag-panel__media"
                  ref={el => {
                    mediaRefs[i] = el;
                  }}
                >
                  <img src={item().image} alt={item().alt || item().label || ''} draggable="false" />
                </span>
                <span class="ag-panel__overlay" aria-hidden="true" />
              </span>
              <Show when={props.showLabels ?? true}>
                <span class="ag-panel__label" aria-hidden="true">
                  <span
                    class="ag-panel__bar"
                    ref={el => {
                      barRefs[i] = el;
                    }}
                  />
                  <span
                    class="ag-panel__text"
                    ref={el => {
                      textRefs[i] = el;
                    }}
                  >
                    {item().label}
                  </span>
                </span>
              </Show>
            </Tag>
          );
        }}
      </For>
    </div>
  );
}
