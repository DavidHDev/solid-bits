import { For, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import type { JSX } from '@solidjs/web';
import './DriftWall.css';

export interface DriftWallItem {
  image: string;
  title?: string;
  href?: string;
}

export interface DriftWallProps {
  items?: DriftWallItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: 'up' | 'down';
  variance?: number;
  parallax?: number;
  pauseOnHover?: boolean;
  lift?: number;
  fade?: number;
  dim?: number;
  grayscale?: boolean;
  overlayColor?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

interface ColumnMeta {
  copyHeight: number;
  copies: number;
}

interface Tile {
  id: string;
  item: DriftWallItem;
  col: number;
}

interface Live {
  meta: ColumnMeta[];
  velocities: number[];
  pauseOnHover: boolean;
  parallax: number;
  reduced: boolean;
  tilt: number;
  turn: number;
  roll: number;
  depth: number;
}

const DEFAULT_ITEMS: DriftWallItem[] = Array.from({ length: 15 }, (_, i) => {
  const ids = [1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110, 133, 164];
  return {
    image: `https://picsum.photos/id/${ids[i % ids.length]}/600/400`,
    title: `Tile ${i + 1}`,
    href: undefined
  };
});

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index: number, variance: number): number => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

export default function DriftWall(props: DriftWallProps) {
  let containerEl: HTMLDivElement | undefined;
  let planeEl: HTMLDivElement | undefined;
  const tracks: (HTMLDivElement | undefined)[] = [];

  let offsets: number[] = [];
  let velocities: number[] = [];
  let hoveredCol = -1;
  let wallHovered = false;
  let pointer = { x: 0, y: 0 };
  const pointerDamped = { x: 0, y: 0 };
  let lastTs: number | null = null;
  let activeIdValue: string | null = null;
  let live!: Live;

  const [containerHeight, setContainerHeight] = createSignal(600);
  const [activeId, setActiveId] = createSignal<string | null>(null);
  const [reduced, setReduced] = createSignal(false);

  const columnItems = createMemo<DriftWallItem[][]>(() => {
    const items = props.items ?? DEFAULT_ITEMS;
    const columns = props.columns ?? 5;
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols.map(col => (col.length ? col : items.slice(0, 1)));
  });

  const columnMeta = createMemo<ColumnMeta[]>(() => {
    const unit = (props.tileHeight ?? 132) + (props.gap ?? 18);
    const height = containerHeight();
    return columnItems().map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((height * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  });

  const baseVelocities = createMemo<number[]>(() => {
    const dirSign = (props.direction ?? 'up') === 'up' ? 1 : -1;
    const speed = props.speed ?? 42;
    const variance = props.variance ?? 0.45;
    return columnItems().map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  });

  const columnTiles = createMemo<Tile[][]>(() => {
    const meta = columnMeta();
    return columnItems().map((col, c) => {
      const tiles: Tile[] = [];
      const copies = meta[c]?.copies ?? 0;
      for (let copyIndex = 0; copyIndex < copies; copyIndex++) {
        col.forEach((item, itemIndex) => tiles.push({ id: `${c}-${copyIndex}-${itemIndex}`, item, col: c }));
      }
      return tiles;
    });
  });

  const liveSettings = createMemo<Live>(() => ({
    meta: columnMeta(),
    velocities: baseVelocities(),
    pauseOnHover: props.pauseOnHover ?? false,
    parallax: props.parallax ?? 0.6,
    reduced: reduced(),
    tilt: props.tilt ?? 16,
    turn: props.turn ?? -14,
    roll: props.roll ?? 0,
    depth: props.depth ?? 120
  }));

  createEffect(liveSettings, value => {
    live = value;
  });

  createEffect(
    () => ({ meta: columnMeta(), cols: columnItems() }),
    ({ meta, cols }) => {
      offsets = meta.map((m, c) => m.copyHeight * ((c * 0.37) % 1));
      velocities = cols.map(() => 0);
      lastTs = null;
    }
  );

  const cssVars = createMemo<JSX.CSSProperties>(() => ({
    '--dw-tile-w': `${props.tileWidth ?? 200}px`,
    '--dw-tile-h': `${props.tileHeight ?? 132}px`,
    '--dw-gap': `${props.gap ?? 18}px`,
    '--dw-radius': `${props.radius ?? 14}px`,
    '--dw-perspective': `${props.perspective ?? 1200}px`,
    '--dw-lift': `${props.lift ?? 64}px`,
    '--dw-dim': String(props.dim ?? 0.55),
    '--dw-gray': (props.grayscale ?? false) ? '1' : '0',
    '--dw-overlay': props.overlayColor ?? '#000710',
    '--dw-edge': `${Math.max(0, (1 - (props.fade ?? 0.6)) * 100)}%`,
    ...props.style
  }));

  const activate = (id: string, index: number): void => {
    activeIdValue = id;
    hoveredCol = index;
    setActiveId(id);
  };

  const release = (): void => {
    activeIdValue = null;
    hoveredCol = -1;
    setActiveId(null);
  };

  const handlePointerMove = (e: PointerEvent) => {
    const rect = containerEl?.getBoundingClientRect();
    if (!rect) return;
    if (live.parallax > 0 && !live.reduced) {
      pointer = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5
      };
    }
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const tile = hit && hit.closest ? (hit.closest('[data-tile-id]') as HTMLElement | null) : null;
    if (!tile) return;
    const id = tile.dataset.tileId ?? null;
    if (id === activeIdValue) return;
    activeIdValue = id;
    hoveredCol = Number(tile.dataset.col);
    setActiveId(id);
  };

  const handlePointerLeaveWall = (): void => {
    wallHovered = false;
    pointer = { x: 0, y: 0 };
    release();
  };

  onSettled(() => {
    live = liveSettings();
    if (!offsets.length) {
      offsets = live.meta.map((m, c) => m.copyHeight * ((c * 0.37) % 1));
      velocities = live.meta.map(() => 0);
    }

    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);

    let ro: ResizeObserver | null = null;
    if (containerEl) {
      ro = new ResizeObserver(([entry]) => {
        setContainerHeight(entry.contentRect.height || 600);
      });
      ro.observe(containerEl);
    }

    const applyPlaneTransform = (px: number, py: number) => {
      const plane = planeEl;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${live.tilt + py}deg) rotateY(${live.turn + px}deg) rotateZ(${live.roll}deg) ` +
        `translateZ(${-live.depth}px)`;
    };

    let raf = 0;
    const animate = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTs) / 1000);
      lastTs = ts;

      const maxTilt = live.parallax * 8;
      const targetX = pointer.x * maxTilt;
      const targetY = -pointer.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDamped.x += (targetX - pointerDamped.x) * damp;
      pointerDamped.y += (targetY - pointerDamped.y) * damp;
      applyPlaneTransform(pointerDamped.x, pointerDamped.y);

      const columnCount = live.meta.length;
      if (!live.reduced) {
        for (let c = 0; c < columnCount; c++) {
          const meta = live.meta[c];
          if (!meta) continue;
          const paused = wallHovered && live.pauseOnHover;
          const factor = paused || hoveredCol === c ? 0 : 1;
          const target = (live.velocities[c] ?? 0) * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocities[c] = (velocities[c] ?? 0) + (target - (velocities[c] ?? 0)) * ease;
          let next = (offsets[c] ?? 0) + velocities[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsets[c] = next;

          const el = tracks[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < columnCount; c++) {
          const el = tracks[c];
          const meta = live.meta[c];
          if (el && meta) el.style.transform = `translate3d(0, ${-(offsets[c] ?? 0)}px, 0)`;
        }
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      lastTs = null;
      mq.removeEventListener('change', onChange);
      ro?.disconnect();
    };
  });

  return (
    <div
      ref={el => (containerEl = el)}
      class={['drift-wall', { 'drift-wall--reduced': reduced() }, props.className]}
      style={cssVars()}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => {
        wallHovered = true;
      }}
      onPointerLeave={handlePointerLeaveWall}
      role="group"
      aria-label="Drifting wall of tiles"
    >
      <div ref={el => (planeEl = el)} class="drift-wall__plane">
        <For each={columnTiles()} keyed={false}>
          {(col, c) => (
            <div class="drift-wall__col">
              <div class="drift-wall__track" ref={el => (tracks[c] = el)}>
                <For each={col()} keyed={(tile: Tile) => tile.id}>
                  {tile => (
                    <Dynamic
                      component={tile().item.href ? 'a' : 'div'}
                      class={['drift-wall__tile', { 'is-active': activeId() === tile().id }]}
                      data-tile-id={tile().id}
                      data-col={tile().col}
                      href={tile().item.href}
                      target={tile().item.href ? '_blank' : undefined}
                      rel={tile().item.href ? 'noreferrer noopener' : undefined}
                      tabindex={tile().item.href ? undefined : 0}
                      role={tile().item.href ? undefined : 'button'}
                      aria-label={tile().item.href ? undefined : (tile().item.title ?? 'tile')}
                      onFocus={() => activate(tile().id, tile().col)}
                      onBlur={release}
                    >
                      <span class="drift-wall__inner">
                        <img
                          src={tile().item.image}
                          alt={tile().item.title ?? ''}
                          loading="lazy"
                          decoding="async"
                          draggable="false"
                        />
                        <span class="drift-wall__overlay" aria-hidden="true" />
                      </span>
                    </Dynamic>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
