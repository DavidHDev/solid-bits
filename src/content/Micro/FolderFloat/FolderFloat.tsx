import { For, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import Matter from 'matter-js';
import './FolderFloat.css';

const { Bodies, Body, Composite, Engine } = Matter;

export type FolderFloatItem = string | { label: string; value: string };
export type FolderFloatTrigger = 'hover' | 'click';

export interface FolderFloatProps {
  items?: FolderFloatItem[];
  label?: string;
  sublabel?: string;
  trigger?: FolderFloatTrigger;
  defaultOpen?: boolean;
  closeOnSelect?: boolean;
  physics?: boolean;
  drift?: number;
  onSelect?: (value: string, index: number) => void;
  onOpenChange?: (open: boolean) => void;
  folderColor?: string;
  frontColor?: string;
  paperColor?: string;
  itemColor?: string;
  itemTextColor?: string;
  labelColor?: string;
  width?: number;
  height?: number;
  radius?: number;
  spread?: number;
  lift?: number;
  tilt?: number;
  flapAngle?: number;
  restAngle?: number;
  openDuration?: number;
  stagger?: number;
  bounce?: number;
  className?: string;
}

type Entry = { label: string; value: string };
type Size = { w: number; h: number };
type Zone = { left: number; right: number; top: number; bottom: number };
type Drag = { i: number; id: number; dx: number; dy: number; sx: number; sy: number; moved: boolean };
type PhaseBody = Matter.Body & { plugin: { phase: number } };
interface World {
  engine: Matter.Engine | null;
  bodies: Matter.Body[];
  sizes: Size[];
  raf: number;
  last: number;
  t0: number;
  drag: Drag | null;
  zone: Zone | null;
  live: boolean;
}

const DEFAULT_ITEMS: FolderFloatItem[] = [
  'Try a warmer palette',
  'Tighten the spacing',
  'Logo feels small',
  'Love the new hero'
];
const PAD = 28;
const CHAR = 6.8;
const GAP = 12;
const ROW = 52;
const DRAG_MIN = 4;
const ZONE_PAD = 8;

const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

const layout = (list: Entry[], spread: number, lift: number, tilt: number, sizes: (Size | null)[]) => {
  const rows: { items: { i: number; pw: number }[]; width: number }[] = [];
  let row: { i: number; pw: number }[] = [];
  let width = 0;
  list.forEach((item, i) => {
    const pw = sizes[i]?.w ?? PAD + item.label.length * CHAR;
    if (row.length && width + GAP + pw > spread * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, pw });
    width += (row.length > 1 ? GAP : 0) + pw;
  });
  if (row.length) rows.push({ items: row, width });
  const pos: { x: number; y: number; r: number }[] = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(16, spread * 0.1);
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i);
      pos[i] = { x: x + pw / 2 + shift + (j - 0.5) * 6, y: -lift - ri * ROW - j * 6, r: tilt * (j * 2 - 1) };
      x += pw + GAP;
    });
  });
  return pos;
};

export default function FolderFloat(props: FolderFloatProps) {
  const [open, setOpen] = createSignal<boolean>(() => props.defaultOpen ?? false);
  const [popped, setPopped] = createSignal(-1);
  const [live, setLive] = createSignal(false);
  const [sizes, setSizes] = createSignal<Size[]>([]);
  let anchorEl: HTMLDivElement | undefined;
  const world: World = {
    engine: null,
    bodies: [],
    sizes: [],
    raf: 0,
    last: 0,
    t0: 0,
    drag: null,
    zone: null,
    live: false
  };
  let reduce = false;
  let popTimer: ReturnType<typeof setTimeout> | undefined;
  let liveTimer: ReturnType<typeof setTimeout> | undefined;

  const list = createMemo<Entry[]>(() =>
    (props.items ?? DEFAULT_ITEMS).map(item => (typeof item === 'string' ? { label: item, value: item } : item))
  );
  const n = () => list().length;
  const label = () => props.label ?? 'Design feedback';
  const sub = () => props.sublabel || `${n()} ${n() === 1 ? 'note' : 'notes'}`;
  const spread = () => props.spread ?? 180;
  const lift = () => props.lift ?? 26;
  const physics = () => props.physics ?? true;
  const trigger = () => props.trigger ?? 'hover';
  const openDuration = () => props.openDuration ?? 520;
  const stagger = () => props.stagger ?? 45;
  const pos = createMemo(() => layout(list(), spread(), lift(), props.tilt ?? 8, sizes()));
  const labelsKey = createMemo(() =>
    list()
      .map(item => item.label)
      .join('|')
  );

  const pills = () =>
    anchorEl ? Array.from(anchorEl.querySelectorAll<HTMLButtonElement>(':scope > .folder-float__item')) : [];

  const measure = () => {
    if (!anchorEl?.isConnected) return;
    const sized = pills().map(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
    const prev = sizes();
    if (prev.length === sized.length && prev.every((s, i) => s.w === sized[i].w && s.h === sized[i].h)) return;
    setSizes(sized);
  };

  createEffect(labelsKey, () => {
    let alive = true;
    const raf = requestAnimationFrame(measure);
    document.fonts?.ready.then(() => {
      if (alive) measure();
    });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  });

  const stopPhysics = (silent = false) => {
    const w = world;
    clearTimeout(liveTimer);
    cancelAnimationFrame(w.raf);
    w.raf = 0;
    if (w.engine) {
      const els = pills();
      w.bodies.forEach((b, i) => {
        const el = els[i];
        if (!el) return;
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`);
        el.style.setProperty('--y', `${(b.position.y - w.sizes[i].h / 2).toFixed(1)}px`);
      });
      Composite.clear(w.engine.world, false, true);
      Engine.clear(w.engine);
      w.engine = null;
    }
    w.bodies = [];
    w.drag = null;
    w.live = false;
    if (!silent) setLive(false);
  };

  const startPhysics = () => {
    const w = world;
    if (w.engine) return;
    const els = pills();
    if (!els.length || els.length !== n()) return;
    const p0 = pos();
    const sp = spread();
    const lf = lift();
    const engine = Engine.create({ gravity: { x: 0, y: 0 } });
    engine.enableSleeping = false;
    w.engine = engine;
    w.sizes = els.map(el => ({ w: el.offsetWidth, h: el.offsetHeight }));
    const ys = p0.map(p => p.y);
    const zone = {
      left: -sp - ZONE_PAD,
      right: sp + ZONE_PAD,
      top: Math.min(...ys) - ZONE_PAD,
      bottom: -lf + Math.max(...w.sizes.map(s => s.h))
    };
    w.zone = zone;
    w.bodies = els.map((_el, i) => {
      const { w: bw, h: bh } = w.sizes[i];
      const b = Bodies.rectangle(p0[i].x, p0[i].y + bh / 2, bw, bh, {
        chamfer: { radius: Math.min(bh / 2 - 1, 16) },
        restitution: 0.55,
        friction: 0,
        frictionAir: 0.08,
        inertia: Infinity
      });
      (b as PhaseBody).plugin = { phase: jitter(i) * Math.PI * 2 };
      return b;
    });
    const T = 80;
    const walls = [
      Bodies.rectangle((zone.left + zone.right) / 2, zone.top - T / 2, zone.right - zone.left + 2 * T, T, {
        isStatic: true
      }),
      Bodies.rectangle((zone.left + zone.right) / 2, zone.bottom + T / 2, zone.right - zone.left + 2 * T, T, {
        isStatic: true
      }),
      Bodies.rectangle(zone.left - T / 2, (zone.top + zone.bottom) / 2, T, zone.bottom - zone.top + 2 * T, {
        isStatic: true
      }),
      Bodies.rectangle(zone.right + T / 2, (zone.top + zone.bottom) / 2, T, zone.bottom - zone.top + 2 * T, {
        isStatic: true
      })
    ];
    Composite.add(engine.world, [...w.bodies, ...walls]);
    w.live = true;
    w.last = 0;
    w.t0 = performance.now();
    setLive(true);
    const tick = (now: number) => {
      const s = world;
      if (!s.engine) return;
      const dt = s.last ? Math.min(32, now - s.last) : 16;
      s.last = now;
      const t = (now - s.t0) / 1000;
      const k = (props.drift ?? 0.5) * 0.00005 * Math.min(1, t / 2);
      s.bodies.forEach((b, i) => {
        if (s.drag && s.drag.i === i) return;
        const ph = (b as PhaseBody).plugin.phase;
        Body.applyForce(b, b.position, {
          x: Math.sin(t * 0.9 + ph) * k * b.mass,
          y: Math.cos(t * 1.3 + ph * 1.7) * k * b.mass
        });
      });
      Engine.update(s.engine, dt);
      const els = pills();
      s.bodies.forEach((b, i) => {
        const el = els[i];
        if (!el) return;
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`);
        el.style.setProperty('--y', `${(b.position.y - s.sizes[i].h / 2).toFixed(1)}px`);
      });
      s.raf = requestAnimationFrame(tick);
    };
    w.raf = requestAnimationFrame(tick);
  };

  const set = (next: boolean) => {
    if (!next) stopPhysics();
    if (open() === next) return;
    setOpen(next);
    props.onOpenChange?.(next);
  };

  createEffect(
    () => ({
      open: open(),
      physics: physics(),
      delay: openDuration() + (n() - 1) * stagger() + 80,
      key: `${n()}|${spread()}|${lift()}|${pos()
        .map(p => `${p.x},${p.y}`)
        .join('|')}`
    }),
    v => {
      clearTimeout(liveTimer);
      if (!v.open || !v.physics || reduce) {
        if (!v.open) stopPhysics();
        else if (!v.physics) stopPhysics();
        return undefined;
      }
      liveTimer = setTimeout(startPhysics, v.delay);
      return () => clearTimeout(liveTimer);
    }
  );

  onSettled(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduce = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      clearTimeout(popTimer);
      stopPhysics(true);
    };
  });

  const pick = (item: Entry, i: number) => {
    props.onSelect?.(item.value, i);
    clearTimeout(popTimer);
    setPopped(i);
    popTimer = setTimeout(() => setPopped(-1), 320);
    if (props.closeOnSelect ?? true) set(false);
  };

  const pointerAt = (e: PointerEvent) => {
    const r = anchorEl?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };
  const down = (e: PointerEvent, el: HTMLButtonElement, i: number) => {
    const w = world;
    if (!w.live || e.button !== 0) return;
    const b = w.bodies[i];
    if (!b) return;
    const p = pointerAt(e);
    w.drag = {
      i,
      id: e.pointerId,
      dx: b.position.x - p.x,
      dy: b.position.y - p.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false
    };
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
  };
  const move = (e: PointerEvent, el: HTMLButtonElement, i: number) => {
    const w = world;
    const d = w.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_MIN) {
      d.moved = true;
      el.setAttribute('data-drag', '');
    }
    if (!d.moved) return;
    const b = w.bodies[i];
    const { w: bw, h: bh } = w.sizes[i];
    const z = w.zone as Zone;
    const p = pointerAt(e);
    const x = Math.min(z.right - bw / 2, Math.max(z.left + bw / 2, p.x + d.dx));
    const y = Math.min(z.bottom - bh / 2, Math.max(z.top + bh / 2, p.y + d.dy));
    Body.setVelocity(b, { x: (x - b.position.x) * 0.6, y: (y - b.position.y) * 0.6 });
    Body.setPosition(b, { x, y });
  };
  const up = (e: PointerEvent, el: HTMLButtonElement, i: number, item: Entry) => {
    const w = world;
    const d = w.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    w.drag = null;
    el.removeAttribute('data-drag');
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {}
    if (!d.moved && e.type === 'pointerup') pick(item, i);
  };

  return (
    <div
      class={['folder-float', props.className]}
      data-open={open() ? '' : undefined}
      data-live={live() ? '' : undefined}
      data-physics={physics() ? '' : undefined}
      data-trigger={trigger()}
      onPointerEnter={() => {
        if (trigger() === 'hover') set(true);
      }}
      onPointerLeave={() => {
        if (trigger() === 'hover' && !world.drag) set(false);
      }}
      onKeyDown={e => {
        if (e.key === 'Escape' && open()) {
          e.stopPropagation();
          set(false);
        }
      }}
      style={{
        '--ff-w': `${props.width ?? 200}px`,
        '--ff-h': `${props.height ?? 148}px`,
        '--ff-r': `${props.radius ?? 14}px`,
        '--ff-back': props.folderColor ?? '#3c4046',
        '--ff-front': props.frontColor ?? '#50555c',
        '--ff-paper': props.paperColor ?? '#f5f5f5',
        '--ff-item': props.itemColor ?? '#f5f5f5',
        '--ff-item-ink': props.itemTextColor ?? '#12161c',
        '--ff-label': props.labelColor ?? '#f5f5f5',
        '--ff-spread': `${spread()}px`,
        '--ff-lift': `${lift()}px`,
        '--ff-angle': `${props.flapAngle ?? 34}deg`,
        '--ff-rest': `${props.restAngle ?? 16}deg`,
        '--ff-open': `${openDuration()}ms`,
        '--ff-close': `${Math.round(openDuration() * 0.6)}ms`,
        '--ff-stagger': `${stagger()}ms`,
        '--ff-n': String(n()),
        '--ff-spring': `cubic-bezier(0.34, ${(1 + (props.bounce ?? 0.3) * 1.9).toFixed(2)}, 0.64, 1)`
      }}
    >
      <div ref={el => (anchorEl = el)} class="folder-float__items">
        <For each={list()} keyed={false}>
          {(item, i) => {
            let el!: HTMLButtonElement;
            const p = () => pos()[i] ?? { x: 0, y: 0, r: 0 };
            return (
              <button
                ref={node => (el = node)}
                type="button"
                class="folder-float__item"
                tabindex={open() ? 0 : -1}
                aria-hidden={open() ? 'false' : 'true'}
                data-pop={popped() === i ? '' : undefined}
                style={{
                  '--i': String(i),
                  '--x': `${p().x.toFixed(1)}px`,
                  '--y': `${p().y.toFixed(1)}px`,
                  '--r': `${p().r.toFixed(2)}deg`
                }}
                onPointerDown={e => down(e, el, i)}
                onPointerMove={e => move(e, el, i)}
                onPointerUp={e => up(e, el, i, item())}
                onPointerCancel={e => up(e, el, i, item())}
                onClick={e => {
                  if (!world.live || e.detail === 0) pick(item(), i);
                }}
              >
                <span class="folder-float__drift">{item().label}</span>
              </button>
            );
          }}
        </For>
      </div>
      <div class="folder-float__folder">
        <span class="folder-float__back" aria-hidden="true" />
        <span class="folder-float__paper" aria-hidden="true" />
        <span class="folder-float__front" aria-hidden="true">
          <span class="folder-float__label">{label()}</span>
          <span class="folder-float__sub">{sub()}</span>
        </span>
        <button
          type="button"
          class="folder-float__trigger"
          aria-expanded={open() ? 'true' : 'false'}
          aria-label={`${label()}, ${sub()}`}
          onClick={() => set(!open())}
        />
      </div>
    </div>
  );
}
