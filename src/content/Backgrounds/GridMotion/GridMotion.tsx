import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';

import './GridMotion.css';

export type GridMotionItem =
  string | number | boolean | null | undefined | Node | (() => JSX.Element) | { src: string; alt?: string };

export type GridMotionDirection = 'alternate' | 'left' | 'right';

export type GridMotionProps = {
  items?: GridMotionItem[];
  rows?: number;
  aspectRatio?: number;
  gap?: number;
  radius?: number;
  angle?: number;
  tilt?: number;
  speed?: number;
  direction?: GridMotionDirection;
  parallax?: number;
  spotlight?: number;
  dim?: number;
  grayscale?: boolean;
  fade?: number;
  tileColor?: string;
  textColor?: string;
  theme?: 'dark' | 'light';
  className?: string;
  style?: JSX.CSSProperties;
};

type TileData =
  | { kind: 'empty' }
  | { kind: 'node'; node: Node | (() => JSX.Element) }
  | { kind: 'image'; src: string; alt: string }
  | { kind: 'text'; text: string };

type Motion = {
  offsets: number[];
  shifts: number[];
  intro: number;
  pointer: { x: number; y: number; active: boolean };
};

type Settings = {
  speed: number;
  direction: GridMotionDirection;
  parallax: number;
  spotlight: number;
  tilt: number;
  angle: number;
  gap: number;
};

type Layout = {
  planeWidth: number;
  planeHeight: number;
  tileWidth: number;
  tileHeight: number;
  step: number;
  perRow: number;
  period: number;
  copies: number;
  top: number;
  perspective: number;
};

const THEMES = {
  dark: {
    tile: '#1a1c1f',
    text: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(255, 255, 255, 0.07)'
  },
  light: {
    tile: '#f4f5f6',
    text: '#3f4247',
    border: 'rgba(24, 26, 29, 0.08)'
  }
};

const DIRECTIONS: GridMotionDirection[] = ['alternate', 'left', 'right'];
const IMAGE = /^(https?:\/\/|\/\/|\/|\.\.?\/|data:image\/|blob:)|\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i;
const INERTIA = [0.42, 0.32, 0.26, 0.22];
const PACE = [1, 0.86, 1.12, 0.94];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, total: number) => ((value % total) + total) % total;
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const feather = (side: string, zone: number) => {
  const stops: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const alpha = t * t * t * (t * (t * 6 - 15) + 10);
    stops.push(`rgba(0, 0, 0, ${alpha.toFixed(4)}) ${(t * zone).toFixed(2)}%`);
  }
  const mirrored = stops.map((_, i) => {
    const t = (12 - i) / 12;
    const alpha = t * t * t * (t * (t * 6 - 15) + 10);
    return `rgba(0, 0, 0, ${alpha.toFixed(4)}) ${(100 - t * zone).toFixed(2)}%`;
  });
  return `linear-gradient(${side}, ${stops.join(', ')}, ${mirrored.join(', ')})`;
};

const toTile = (item: GridMotionItem): TileData => {
  if (item === null || item === undefined || item === false) return { kind: 'empty' };
  if (typeof item === 'function' || (typeof Node !== 'undefined' && item instanceof Node)) {
    return { kind: 'node', node: item as Node | (() => JSX.Element) };
  }
  if (typeof item === 'object' && 'src' in item && typeof item.src === 'string') {
    return { kind: 'image', src: item.src, alt: item.alt ?? '' };
  }
  const text = String(item).trim();
  return IMAGE.test(text) ? { kind: 'image', src: text, alt: '' } : { kind: 'text', text };
};

const EMPTY: TileData = { kind: 'empty' };

const renderNode = (node: Node | (() => JSX.Element)) => (typeof node === 'function' ? node() : node.cloneNode(true));

const Tile = (props: { tile: TileData }) => (
  <div class="grid-motion__tile">
    <Show when={props.tile.kind === 'image' && props.tile}>
      {tile => {
        const image = () => tile() as { src: string; alt: string };
        return <img src={image().src} alt={image().alt} draggable="false" decoding="async" />;
      }}
    </Show>
    <Show when={props.tile.kind === 'text' && props.tile}>
      {tile => <span class="grid-motion__text">{(tile() as { text: string }).text}</span>}
    </Show>
    <Show when={props.tile.kind === 'node' && props.tile} keyed>
      {tile => renderNode((tile as { node: Node | (() => JSX.Element) }).node)}
    </Show>
  </div>
);

export default function GridMotion(props: GridMotionProps) {
  let rootEl: HTMLDivElement | undefined;
  let planeEl: HTMLDivElement | undefined;
  const motion: Motion = { offsets: [], shifts: [], intro: 0, pointer: { x: 0, y: 0, active: false } };
  const [size, setSize] = createSignal({ width: 0, height: 0 });

  const rows = createMemo(() => clamp(Math.round(props.rows ?? 4), 1, 12));
  const aspect = createMemo(() => clamp(props.aspectRatio ?? 1.33, 0.3, 4));
  const gap = createMemo(() => Math.max(0, props.gap ?? 16));
  const angle = createMemo(() => props.angle ?? -12);
  const tilt = createMemo(() => clamp(props.tilt ?? 0, 0, 75));
  const dim = createMemo(() => clamp(props.dim ?? 0.35, 0, 1));
  const fade = createMemo(() => clamp(props.fade ?? 0.5, 0, 1));
  const palette = createMemo(() => THEMES[props.theme ?? 'dark'] ?? THEMES.dark);

  const settings = createMemo<Settings>(() => {
    const direction = props.direction ?? 'alternate';
    return {
      speed: props.speed ?? 24,
      direction: DIRECTIONS.includes(direction) ? direction : 'alternate',
      parallax: clamp(props.parallax ?? 0.5, 0, 1),
      spotlight: clamp(props.spotlight ?? 0.6, 0, 1),
      tilt: tilt(),
      angle: angle(),
      gap: gap()
    };
  });

  const layout = createMemo<Layout | null>(() => {
    const { width, height } = size();
    if (!width || !height) return null;
    const rowCount = rows();
    const gapSize = gap();
    const turn = (angle() * Math.PI) / 180;
    const lean = (tilt() * Math.PI) / 180;
    const cos = Math.abs(Math.cos(turn));
    const sin = Math.abs(Math.sin(turn));
    const planeHeight = ((width * sin + height * cos) / Math.max(0.3, Math.cos(lean))) * 1.12;
    const planeWidth = (width * cos + height * sin) * (1 + Math.sin(lean) * 0.9) * 1.12;
    const tileHeight = Math.max(16, (planeHeight - gapSize * (rowCount - 1)) / rowCount);
    const tileWidth = tileHeight * aspect();
    const step = tileWidth + gapSize;
    const perRow = Math.ceil(planeWidth / step) + 1;
    const period = perRow * step;
    return {
      planeWidth,
      planeHeight,
      tileWidth,
      tileHeight,
      step,
      perRow,
      period,
      copies: Math.ceil(planeWidth / period) + 2,
      top: (planeHeight - rowCount * tileHeight - (rowCount - 1) * gapSize) / 2,
      perspective: Math.max(width, height) * 1.5
    };
  });

  const tiles = createMemo(() => (props.items ?? []).map(toTile));

  const rowTiles = createMemo<TileData[][]>(() => {
    const grid = layout();
    if (!grid) return [];
    const list = tiles();
    return Array.from({ length: rows() }, (_, r) => {
      const sequence = Array.from({ length: grid.perRow }, (_, j) =>
        list.length ? list[(r * grid.perRow + j) % list.length] : EMPTY
      );
      return Array.from({ length: grid.copies * grid.perRow }, (_, k) => sequence[k % grid.perRow]);
    });
  });

  const mask = createMemo(() =>
    fade() > 0 ? `${feather('to right', fade() * 34)}, ${feather('to bottom', fade() * 44)}` : undefined
  );

  let current!: Settings;

  createEffect(settings, value => {
    current = value;
  });

  onSettled(() => {
    const root = rootEl;
    if (!root) return;
    const observer = new ResizeObserver(() => {
      const width = Math.round(root.clientWidth);
      const height = Math.round(root.clientHeight);
      setSize(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(root);
    const onMove = (event: PointerEvent) => {
      motion.pointer.x = event.clientX;
      motion.pointer.y = event.clientY;
      motion.pointer.active = true;
    };
    const onUp = (event: PointerEvent) => {
      if (event.pointerType === 'touch') motion.pointer.active = false;
    };
    const onLeave = () => {
      motion.pointer.active = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('blur', onLeave);
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('blur', onLeave);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  });

  createEffect(
    () => ({ layout: layout(), rows: rowTiles() }),
    ({ layout: grid }) => {
      const root = rootEl;
      if (!root || !grid) return undefined;

      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      let plane: HTMLDivElement | null = null;
      let rowEls: HTMLElement[] = [];
      let tileEls: HTMLElement[][] = [];
      let spots: Float32Array[] = [];
      let written: Float32Array[] = [];
      let raf = 0;
      let last = performance.now();
      let visible = true;
      let alive = true;

      const attach = () => {
        plane = planeEl ?? null;
        if (!plane) return false;
        rowEls = Array.from(plane.children) as HTMLElement[];
        tileEls = rowEls.map(row => Array.from(row.children) as HTMLElement[]);
        spots = tileEls.map(list => new Float32Array(list.length));
        written = tileEls.map(list => new Float32Array(list.length));
        if (motion.intro >= 1) plane.style.opacity = '1';
        return true;
      };

      const frame = (now: number) => {
        raf = 0;
        if (!alive) return;
        if (!plane && !attach()) {
          raf = requestAnimationFrame(frame);
          return;
        }
        const target = plane as HTMLDivElement;
        const s = current;
        const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
        last = now;

        if (motion.intro < 1) {
          motion.intro = Math.min(1, motion.intro + dt / 0.9);
          target.style.opacity = String(1 - (1 - motion.intro) ** 3);
        }

        const rect = root.getBoundingClientRect();
        const scale = rect.width ? root.clientWidth / rect.width : 1;
        const halfWidth = root.clientWidth / 2 || 1;
        const halfHeight = root.clientHeight / 2 || 1;
        const px = (motion.pointer.x - rect.left) * scale - halfWidth;
        const py = (motion.pointer.y - rect.top) * scale - halfHeight;
        const inside = motion.pointer.active && Math.abs(px) <= halfWidth && Math.abs(py) <= halfHeight;
        const lean = (s.tilt * Math.PI) / 180;
        const turn = (s.angle * Math.PI) / 180;
        const depth = grid.perspective;
        let flatY = py;
        let flatX = px;
        if (lean > 0.0001) {
          flatY = (py * depth) / (depth * Math.cos(lean) + py * Math.sin(lean));
          flatX = (px * (depth - flatY * Math.sin(lean))) / depth;
        }
        const planeX = flatX * Math.cos(turn) + flatY * Math.sin(turn);
        const planeY = -flatX * Math.sin(turn) + flatY * Math.cos(turn);
        const nudge = motion.pointer.active ? clamp(px / halfWidth, -1, 1) : 0;
        const reach = (0.6 + 2.2 * s.spotlight) * Math.max(grid.tileWidth, grid.tileHeight);
        const settle = 1 - Math.exp(-dt / 0.22);

        rowEls.forEach((row, r) => {
          const drift = s.direction === 'left' ? -1 : s.direction === 'right' ? 1 : r % 2 ? 1 : -1;
          if (motion.offsets[r] === undefined) {
            motion.offsets[r] = r * grid.step * 0.37;
            motion.shifts[r] = 0;
          }
          if (!reduce) motion.offsets[r] += s.speed * drift * PACE[r % PACE.length] * dt;
          const goal = reduce ? 0 : s.parallax * grid.tileWidth * 1.2 * nudge * (r % 2 ? -1 : 1);
          motion.shifts[r] += (goal - motion.shifts[r]) * (1 - Math.exp(-dt / INERTIA[r % INERTIA.length]));
          const x = -grid.period + wrap(motion.offsets[r] + motion.shifts[r], grid.period);
          row.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;

          const rowY = grid.top + r * (grid.tileHeight + s.gap) + grid.tileHeight / 2 - grid.planeHeight / 2;
          const left = x - grid.planeWidth / 2 + grid.tileWidth / 2;
          const list = tileEls[r];
          const values = spots[r];
          const marks = written[r];
          for (let k = 0; k < list.length; k++) {
            let wanted = 0;
            if (inside && s.spotlight > 0) {
              const distance = Math.hypot(left + k * grid.step - planeX, rowY - planeY) / reach;
              wanted = 1 - smoothstep(0.25, 1, distance);
            }
            values[k] += (wanted - values[k]) * settle;
            if (Math.abs(values[k] - marks[k]) > 0.004 || (wanted === 0 && values[k] < 0.004 && marks[k] !== 0)) {
              marks[k] = values[k] < 0.004 ? 0 : values[k];
              list[k].style.setProperty('--spot', marks[k].toFixed(3));
            }
          }
        });

        if (visible) raf = requestAnimationFrame(frame);
      };

      const visibility = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      });
      visibility.observe(root);
      raf = requestAnimationFrame(frame);

      return () => {
        alive = false;
        cancelAnimationFrame(raf);
        visibility.disconnect();
      };
    }
  );

  return (
    <div
      ref={el => (rootEl = el)}
      class={['grid-motion', { 'grid-motion--gray': !!props.grayscale }, props.className]}
      style={{
        '--gm-tile': props.tileColor ?? palette().tile,
        '--gm-text': props.textColor ?? palette().text,
        '--gm-border': palette().border,
        '--gm-radius': `${Math.max(0, props.radius ?? 14)}px`,
        '--gm-dim': String(dim()),
        perspective: layout() && tilt() > 0 ? `${layout()!.perspective}px` : undefined,
        'mask-image': mask(),
        '-webkit-mask-image': mask(),
        'mask-composite': mask() ? 'intersect' : undefined,
        '-webkit-mask-composite': mask() ? 'source-in' : undefined,
        ...props.style
      }}
    >
      <Show when={layout()}>
        {grid => (
          <div
            ref={el => (planeEl = el)}
            class="grid-motion__plane"
            aria-hidden="true"
            style={{
              width: `${grid().planeWidth}px`,
              height: `${grid().planeHeight}px`,
              transform: `translate(-50%, -50%) rotateX(${tilt()}deg) rotateZ(${angle()}deg)`,
              '--gm-gap': `${gap()}px`,
              '--gm-tile-w': `${grid().tileWidth}px`,
              '--gm-tile-h': `${grid().tileHeight}px`,
              '--gm-font': `${clamp(grid().tileHeight * 0.12, 12, 32)}px`
            }}
          >
            <For each={rowTiles()} keyed={false}>
              {(sequence, r) => (
                <div class="grid-motion__row" style={{ top: `${grid().top + r * (grid().tileHeight + gap())}px` }}>
                  <For each={sequence()} keyed={false}>
                    {tile => <Tile tile={tile()} />}
                  </For>
                </div>
              )}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
}
