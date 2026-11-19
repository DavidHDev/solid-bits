import { For, Show, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './ChromaGrid.css';

export interface ChromaItem {
  image: string;
  title?: string;
  subtitle?: string;
  accent?: string;
  url?: string;
  alt?: string;
  borderColor?: string;
}

export interface ChromaGridProps {
  items?: ChromaItem[];
  columns?: number;
  minCardWidth?: number;
  gap?: number;
  radius?: number;
  softness?: number;
  damping?: number;
  fadeOut?: number;
  grayscale?: number;
  dim?: number;
  glow?: number;
  borderGlow?: number;
  reveal?: 'spotlight' | 'card';
  aspectRatio?: string;
  cardRadius?: number;
  showInfo?: boolean;
  frame?: boolean;
  theme?: 'dark' | 'light';
  className?: string;
}

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--chroma-frame': 'rgba(35, 37, 41, 0.66)',
    '--chroma-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--chroma-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--chroma-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--chroma-tile': 'linear-gradient(180deg, #36393e 0%, #25272b 100%)',
    '--chroma-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--chroma-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--chroma-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--chroma-media-edge': 'rgba(255, 255, 255, 0.06)',
    '--chroma-well': 'rgba(255, 255, 255, 0.08)',
    '--chroma-ink': '#f2f4f7',
    '--chroma-muted': 'rgba(242, 244, 247, 0.55)',
    '--chroma-hover': 'brightness(1.12)',
    '--chroma-press': 'brightness(0.85)'
  },
  light: {
    '--chroma-frame': 'rgba(240, 241, 243, 0.8)',
    '--chroma-frame-edge': 'rgba(24, 25, 27, 0.07)',
    '--chroma-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--chroma-frame-shadow': '0 22px 44px -22px rgba(24, 25, 27, 0.3), 0 6px 16px -10px rgba(24, 25, 27, 0.16)',
    '--chroma-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)',
    '--chroma-tile-edge': 'rgba(24, 25, 27, 0.08)',
    '--chroma-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--chroma-tile-shadow': '0 4px 10px -5px rgba(24, 25, 27, 0.25)',
    '--chroma-media-edge': 'rgba(24, 25, 27, 0.06)',
    '--chroma-well': 'rgba(24, 25, 27, 0.05)',
    '--chroma-ink': '#26282b',
    '--chroma-muted': 'rgba(38, 40, 43, 0.55)',
    '--chroma-hover': 'brightness(0.97)',
    '--chroma-press': 'brightness(0.92)'
  }
};

const DEFAULT_ITEMS: ChromaItem[] = [
  {
    image: 'https://images.unsplash.com/photo-1514519334989-3d5c8b1a9f91?w=800&q=80&auto=format&fit=crop',
    title: 'Golden Hour',
    subtitle: 'Sky study',
    accent: '#ff8a4c'
  },
  {
    image: 'https://images.unsplash.com/photo-1520930528075-4ea5ead759f5?w=800&q=80&auto=format&fit=crop',
    title: 'Steel Arches',
    subtitle: 'Sculpture',
    accent: '#ff5a36'
  },
  {
    image: 'https://images.unsplash.com/photo-1511300636408-a63a89df3482?w=800&q=80&auto=format&fit=crop',
    title: 'Black Beach',
    subtitle: 'Landscape',
    accent: '#6ec9f7'
  },
  {
    image: 'https://images.unsplash.com/photo-1524400968894-6e997a66e03f?w=800&q=80&auto=format&fit=crop',
    title: 'Cloud Front',
    subtitle: 'Weather',
    accent: '#ffb27a'
  },
  {
    image: 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=800&q=80&auto=format&fit=crop',
    title: 'Pink Drift',
    subtitle: 'Sky study',
    accent: '#ff9a7a'
  },
  {
    image: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=800&q=80&auto=format&fit=crop',
    title: 'Cumulus',
    subtitle: 'Weather',
    accent: '#7cc4ff'
  }
];

type Settings = { damping: number; fadeOut: number; spotlight: boolean };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const falloffStops = (softness: number) => {
  const core = clamp(1 - softness, 0, 0.95);
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const u = clamp((t - core) / Math.max(0.0001, 1 - core), 0, 1);
    const alpha = 1 - u * u * u * (u * (u * 6 - 15) + 10);
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(3)}) ${(t * 100).toFixed(1)}%`);
  }
  return stops.join(', ');
};

export default function ChromaGrid(props: ChromaGridProps) {
  let rootEl: HTMLDivElement | undefined;
  let current!: Settings;
  let place: (() => void) | null = null;

  const data = createMemo(() => (props.items?.length ? props.items : DEFAULT_ITEMS));
  const reveal = () => (props.reveal === 'card' ? 'card' : 'spotlight');
  const frame = () => props.frame ?? false;
  const showInfo = () => props.showInfo ?? true;

  const settings = createMemo<Settings>(() => ({
    damping: props.damping ?? 0.45,
    fadeOut: props.fadeOut ?? 0.6,
    spotlight: props.reveal !== 'card'
  }));

  const rootStyle = createMemo<JSX.CSSProperties>(() => {
    const fadeOut = props.fadeOut ?? 0.6;
    return {
      ...(THEMES[props.theme ?? 'dark'] ?? THEMES.dark),
      '--chroma-cols': String(Math.max(1, Math.round(props.columns ?? 3))),
      '--chroma-min': `${Math.max(80, props.minCardWidth ?? 180)}px`,
      '--chroma-gap': `${Math.max(0, props.gap ?? 12)}px`,
      '--chroma-r': `${Math.max(20, props.radius ?? 260)}px`,
      '--chroma-stops': falloffStops(clamp(props.softness ?? 0.6, 0, 1)),
      '--chroma-gray': String(clamp(props.grayscale ?? 1, 0, 1)),
      '--chroma-dim': String(clamp(props.dim ?? 0.12, 0, 0.9)),
      '--chroma-glow': String(clamp(props.glow ?? 0.5, 0, 1)),
      '--chroma-border': String(clamp(props.borderGlow ?? 1, 0, 1)),
      '--chroma-fade': `${Math.max(0, fadeOut)}s`,
      '--chroma-ratio': props.aspectRatio ?? '3 / 2',
      '--chroma-radius': `${Math.max(0, props.cardRadius ?? 22)}px`
    };
  });

  createEffect(settings, value => {
    current = value;
  });

  createEffect(
    () => [rootStyle(), data(), showInfo(), frame()],
    () => {
      place?.();
    }
  );

  onSettled(() => {
    current = settings();
    const root = rootEl;
    if (!root) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = { x: 0, y: 0, tx: 0, ty: 0, power: 0, target: 0, primed: false };
    let raf = 0;
    let last = 0;

    const placeAreas = () => {
      const box = root.getBoundingClientRect();
      root.querySelectorAll<HTMLElement>('[data-chroma-area]').forEach(node => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty('--chroma-ox', `${rect.left - box.left}px`);
        node.style.setProperty('--chroma-oy', `${rect.top - box.top}px`);
      });
    };
    place = placeAreas;

    const frameStep = (now: number) => {
      raf = 0;
      const s = current;
      if (!s) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const follow = reduce ? 1 : 1 - Math.exp(-dt / Math.max(0.01, s.damping * 0.32));
      state.x += (state.tx - state.x) * follow;
      state.y += (state.ty - state.y) * follow;
      const span = state.target > state.power ? 0.1 : Math.max(0.02, s.fadeOut * 0.35);
      state.power += (state.target - state.power) * (reduce ? 1 : 1 - Math.exp(-dt / span));
      root.style.setProperty('--chroma-x', `${state.x.toFixed(2)}px`);
      root.style.setProperty('--chroma-y', `${state.y.toFixed(2)}px`);
      root.style.setProperty('--chroma-power', state.power.toFixed(4));
      const settled =
        Math.abs(state.tx - state.x) < 0.1 &&
        Math.abs(state.ty - state.y) < 0.1 &&
        Math.abs(state.target - state.power) < 0.002;
      if (settled) {
        state.power = state.target;
        root.style.setProperty('--chroma-power', state.power.toFixed(4));
        last = 0;
      } else {
        raf = requestAnimationFrame(frameStep);
      }
    };

    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frameStep);
    };

    const onMove = (event: PointerEvent) => {
      if (!current?.spotlight) return;
      const box = root.getBoundingClientRect();
      state.tx = event.clientX - box.left;
      state.ty = event.clientY - box.top;
      if (!state.primed || state.power < 0.02) {
        state.x = state.tx;
        state.y = state.ty;
        state.primed = true;
      }
      state.target = 1;
      wake();
    };

    const onLeave = () => {
      state.target = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(placeAreas);
    resizeObserver.observe(root);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    placeAreas();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      place = null;
    };
  });

  const body = (item: ChromaItem) => (
    <>
      <span class="chroma-wash" aria-hidden="true" />
      <div class="chroma-media" data-chroma-area="">
        <img class="chroma-mono" src={item.image} alt={item.alt ?? item.title ?? ''} loading="lazy" />
        <img class="chroma-color" src={item.image} alt="" aria-hidden="true" loading="lazy" />
        <span class="chroma-media-rim" aria-hidden="true" />
      </div>
      <Show when={showInfo() && (item.title || item.subtitle)}>
        <div class="chroma-info">
          <Show when={item.title}>
            <span class="chroma-title">{item.title}</span>
          </Show>
          <Show when={item.subtitle}>
            <span class="chroma-subtitle">{item.subtitle}</span>
          </Show>
        </div>
      </Show>
      <span class="chroma-card-rim" aria-hidden="true" />
      <span class="chroma-card-glow" aria-hidden="true" />
    </>
  );

  return (
    <div
      ref={el => (rootEl = el)}
      class={['chroma-grid', { 'has-frame': frame() }, props.className]}
      data-reveal={reveal()}
      style={rootStyle()}
    >
      <div class="chroma-grid-inner">
        <For each={data()}>
          {item => {
            const cardStyle = { '--chroma-accent': item.accent ?? item.borderColor ?? '#ffffff' };
            return (
              <Show
                when={item.url}
                fallback={
                  <article class="chroma-card" data-chroma-area="" style={cardStyle}>
                    {body(item)}
                  </article>
                }
              >
                <a
                  class="chroma-card"
                  data-chroma-area=""
                  style={cardStyle}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {body(item)}
                </a>
              </Show>
            );
          }}
        </For>
      </div>
      <Show when={frame()}>
        <span class="chroma-frame-rim" aria-hidden="true" />
      </Show>
    </div>
  );
}
