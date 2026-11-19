import { For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './LineSidebar.css';

type Falloff = 'linear' | 'smooth' | 'sharp';

export interface LineSidebarProps {
  items?: string[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number | null;
  onItemClick?: (index: number, label: string) => void;
  className?: string;
}

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: p => p,
  smooth: p => p * p * (3 - 2 * p),
  sharp: p => p * p * p
};

const DEFAULT_ITEMS = [
  'Overview',
  'Components',
  'Animations',
  'Backgrounds',
  'Showcase',
  'Playground',
  'Templates',
  'Changelog',
  'Community',
  'Resources',
  'Documentation',
  'Support'
];

export default function LineSidebar(props: LineSidebarProps) {
  let listEl: HTMLUListElement | undefined;
  let targets: number[] = [];
  const currents: number[] = [];
  let raf: number | null = null;
  let last = 0;
  let active: number | null = null;
  const [activeIndex, setActiveIndex] = createSignal<number | null>(() => props.defaultActive ?? null);

  const itemEls = () => (listEl ? (Array.from(listEl.children) as HTMLLIElement[]) : []);

  const runFrame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const tau = Math.max(props.smoothing ?? 100, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const els = itemEls();
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const target = Math.max(targets[i] || 0, active === i ? 1 : 0);
      const cur = currents[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currents[i] = value;
      el.style.setProperty('--effect', value.toFixed(4));
      if (!settled) moving = true;
    }

    raf = moving ? requestAnimationFrame(runFrame) : null;
  };

  const startLoop = () => {
    if (raf != null) cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(runFrame);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const list = listEl;
    if (!list) return;
    const rect = list.getBoundingClientRect();
    const pointerY = e.clientY - rect.top;
    const ease = FALLOFF_CURVES[props.falloff ?? 'smooth'] ?? FALLOFF_CURVES.linear;
    const proximityRadius = props.proximityRadius ?? 100;
    const els = itemEls();
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const center = el.offsetTop + el.offsetHeight / 2;
      const distance = Math.abs(pointerY - center);
      targets[i] = ease(Math.max(0, 1 - distance / proximityRadius));
    }
    startLoop();
  };

  const handlePointerLeave = () => {
    targets = targets.map(() => 0);
    startLoop();
  };

  const handleClick = (index: number, label: string) => {
    active = index;
    setActiveIndex(index);
    props.onItemClick?.(index, label);
  };

  createEffect(activeIndex, value => {
    active = value;
    startLoop();
  });

  onCleanup(() => {
    if (raf != null) cancelAnimationFrame(raf);
    raf = null;
  });

  return (
    <nav
      class={[
        'line-sidebar',
        { 'line-sidebar--markers': props.showMarker ?? true, 'line-sidebar--scale-tick': props.scaleTick ?? true },
        props.className
      ]}
      style={
        {
          '--accent-color': props.accentColor ?? '#6ec9f7',
          '--text-color': props.textColor ?? '#c4c4c4',
          '--marker-color': props.markerColor ?? '#6c6c6c',
          '--marker-length': `${props.markerLength ?? 60}px`,
          '--marker-gap': `${props.markerGap ?? 0}px`,
          '--tick-scale': props.tickScale ?? 0.5,
          '--max-shift': `${props.maxShift ?? 30}px`,
          '--item-gap': `${props.itemGap ?? 20}px`,
          '--font-size': `${props.fontSize ?? 1.1}rem`,
          '--smoothing': `${props.smoothing ?? 100}ms`
        } as JSX.CSSProperties
      }
    >
      <ul
        ref={el => (listEl = el)}
        class="line-sidebar__list"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <For each={props.items ?? DEFAULT_ITEMS}>
          {(label, index) => (
            <li
              class="line-sidebar__item"
              aria-current={activeIndex() === index() ? 'true' : undefined}
              onClick={() => handleClick(index(), label)}
            >
              <Show when={props.showMarker ?? true}>
                <span class="line-sidebar__marker" aria-hidden="true" />
              </Show>
              <span class="line-sidebar__label">
                <Show when={props.showIndex ?? true}>
                  <span class="line-sidebar__index">{String(index() + 1).padStart(2, '0')}</span>
                </Show>
                <span class="line-sidebar__text">{label}</span>
              </span>
            </li>
          )}
        </For>
      </ul>
    </nav>
  );
}
