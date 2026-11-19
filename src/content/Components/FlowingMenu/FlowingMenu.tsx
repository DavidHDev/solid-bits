import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import './FlowingMenu.css';

export interface FlowingMenuItem {
  text: string;
  link?: string;
  image?: string;
  marquee?: string;
  meta?: string;
}

export interface FlowingMenuProps {
  items?: FlowingMenuItem[];
  speed?: number;
  direction?: 'left' | 'right' | 'alternate';
  followCursor?: number;
  duration?: number;
  stretch?: number;
  magnet?: number;
  bandInset?: number;
  bandRadius?: number;
  carryContent?: boolean;
  textColor?: string;
  bgColor?: string;
  marqueeBgColor?: string;
  marqueeTextColor?: string;
  borderColor?: string;
  dividers?: boolean;
  dimInactive?: boolean;
  align?: 'center' | 'left';
  showIndex?: boolean;
  showArrow?: boolean;
  imageShape?: 'pill' | 'rounded' | 'circle';
  intro?: boolean;
  activeIndex?: number;
  onItemClick?: (item: FlowingMenuItem, index: number, event: MouseEvent) => void;
  ariaLabel?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Row {
  item?: HTMLLIElement | null;
  band?: HTMLDivElement | null;
  track?: HTMLDivElement | null;
}

interface Marquee {
  x: number;
  part: number;
  spin: number;
  covered: boolean;
}

interface Metric {
  top: number;
  height: number;
}

interface Settings {
  speed: number;
  direction: string;
  followCursor: number;
  duration: number;
  stretch: number;
  magnet: number;
  bandInset: number;
  bandRadius: number;
  carryContent: boolean;
  dimInactive: boolean;
  onItemClick?: FlowingMenuProps['onItemClick'];
}

type IconNode = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const ROOT = 'flowing-menu';
const LIST = 'flowing-menu__list';
const ITEM = 'flowing-menu__item';
const DIVIDER = 'flowing-menu__divider';
const LINK = 'flowing-menu__link';
const INDEX = 'flowing-menu__index';
const LABEL = 'flowing-menu__label';
const LABEL_TEXT = 'flowing-menu__label-text';
const DOT = 'flowing-menu__dot';
const END = 'flowing-menu__end';
const META = 'flowing-menu__meta';
const ARROW = 'flowing-menu__arrow';
const BAND = 'flowing-menu__band';
const TRACK = 'flowing-menu__track';
const PART = 'flowing-menu__part';
const PART_TEXT = 'flowing-menu__part-text';
const IMAGE = 'flowing-menu__image';
const FLOAT = 'flowing-menu__float';
const FLOAT_LAYER = 'flowing-menu__float-layer';

const DIRECTIONS = ['left', 'right', 'alternate'];
const SHAPES = ['pill', 'rounded', 'circle'];
const EASE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const prefersReduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const iconMarkup = (icon: IconNode, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = name === 'stroke-width' ? strokeWidth : value;
          return `${name}="${String(next).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

function Icon(props: { icon: IconNode; size: number; strokeWidth: number }) {
  return (
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
}

function FlowingMenu(props: FlowingMenuProps) {
  let rootEl: HTMLElement | undefined;
  let listEl: HTMLUListElement | undefined;
  let floatEl: HTMLDivElement | undefined;
  const rows: Row[] = [];
  const marquees: Marquee[] = [];
  let metrics: (Metric | null)[] = [];
  const layerEls: (HTMLDivElement | null)[] = [];
  const layerTracks: (HTMLDivElement | null)[] = [];
  const band = {
    top: 0,
    bottom: 0,
    vTop: 0,
    vBottom: 0,
    toTop: 0,
    toBottom: 0,
    lead: 1,
    shown: false,
    index: -1,
    rest: 0
  };
  const cursor: { x: number; y: number | null; t: number; vx: number } = { x: 0, y: null, t: 0, vx: 0 };
  const engine: { raf: number; last: number; timers: ReturnType<typeof setTimeout>[]; touched: boolean } = {
    raf: 0,
    last: 0,
    timers: [],
    touched: false
  };
  const roll = { current: 0, p: 1, dir: 1, slots: [-1, -1], fromOpacity: 0, fromOffset: 0 };
  const [copies, setCopies] = createSignal<number[]>([]);
  let copyCounts: number[] = [];
  const [slots, setSlots] = createSignal([-1, -1]);
  let observer: ResizeObserver | null = null;
  let mounted = false;

  const items = createMemo(() => props.items ?? []);

  const settings = createMemo<Settings>(() => {
    const direction = props.direction ?? 'left';
    return {
      speed: Math.max(0, props.speed ?? 60),
      direction: DIRECTIONS.includes(direction) ? direction : 'left',
      followCursor: clamp(props.followCursor ?? 0.4, 0, 1),
      duration: Math.max(0.1, props.duration ?? 0.5),
      stretch: clamp(props.stretch ?? 0.6, 0, 1),
      magnet: clamp(props.magnet ?? 0.25, 0, 1),
      bandInset: Math.max(0, props.bandInset ?? 0),
      bandRadius: Math.max(0, props.bandRadius ?? 0),
      carryContent: props.carryContent ?? false,
      dimInactive: props.dimInactive ?? false,
      onItemClick: props.onItemClick
    };
  });
  let current!: Settings;

  const marqueeAt = (index: number) => {
    if (!marquees[index]) marquees[index] = { x: 0, part: 0, spin: 0, covered: false };
    return marquees[index];
  };

  const insetFor = (height: number) => Math.min(current.bandInset, Math.max(0, height / 2 - 2));

  const markRows = () => {
    const b = band;
    const dim = current.dimInactive && b.index >= 0;
    rows.forEach((row, index) => {
      if (!row?.item) return;
      if (index === b.index) row.item.setAttribute('data-current', '');
      else row.item.removeAttribute('data-current');
      if (dim && index !== b.index) row.item.setAttribute('data-dimmed', '');
      else row.item.removeAttribute('data-dimmed');
    });
  };

  const rowHeight = () => metrics.find(Boolean)?.height ?? 0;

  const paintFloat = () => {
    const b = band;
    const s = current;
    const r = roll;
    const el = floatEl?.isConnected ? floatEl : undefined;
    const list = listEl;
    if (!el || !list) return;
    if (!b.shown || b.bottom - b.top < 0.25) {
      el.style.visibility = 'hidden';
      return;
    }
    const height = rowHeight();
    const side = Math.min(s.bandInset, Math.max(0, height / 2 - 2));
    const radius = Math.min(s.bandRadius, (b.bottom - b.top) / 2, Math.max(0, list.clientWidth / 2 - side));
    el.style.visibility = 'visible';
    el.style.clipPath = `inset(${b.top.toFixed(2)}px ${side}px ${(list.clientHeight - b.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`;
    const center = (b.top + b.bottom) / 2;
    const eased = 1 - Math.pow(1 - r.p, 3);
    const travel = height * 0.8 * r.dir;
    [0, 1].forEach(slot => {
      const layer = layerEls[slot];
      const index = r.slots[slot];
      if (!layer) return;
      const isCurrent = slot === r.current;
      const visible = index >= 0 && (isCurrent || r.p < 1);
      layer.style.visibility = visible ? 'visible' : 'hidden';
      if (!visible) return;
      const offset = isCurrent ? (1 - eased) * travel : r.fromOffset - eased * travel;
      const opacity = isCurrent ? eased : r.fromOpacity * (1 - eased);
      layer.style.height = `${height}px`;
      layer.style.opacity = opacity.toFixed(3);
      layer.style.transform = `translate3d(0, ${(center - height / 2 + offset).toFixed(2)}px, 0)`;
      const state = marqueeAt(index);
      state.covered = true;
      const track = layerTracks[slot];
      if (track) track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`;
    });
  };

  const paint = () => {
    const b = band;
    const s = current;
    const height = Math.max(0, b.bottom - b.top);
    rows.forEach((row, index) => {
      const m = metrics[index];
      if (!row?.band || !m) return;
      const state = marqueeAt(index);
      state.covered = false;
      const from = Math.max(b.top, m.top);
      const to = Math.min(b.bottom, m.top + m.height);
      if (s.carryContent || !b.shown || to - from < 0.25) {
        row.band.style.visibility = 'hidden';
      } else {
        const side = Math.min(s.bandInset, Math.max(0, m.height / 2 - 2));
        const radius = Math.min(s.bandRadius, height / 2, Math.max(0, (row.item?.clientWidth ?? 0) / 2 - side));
        row.band.style.visibility = 'visible';
        row.band.style.clipPath = `inset(${(b.top - m.top).toFixed(2)}px ${side}px ${(m.top + m.height - b.bottom).toFixed(2)}px ${side}px round ${radius.toFixed(2)}px)`;
        state.covered = (to - from) / m.height > 0.04;
      }
      if (row.track) row.track.style.transform = `translate3d(${state.x.toFixed(2)}px, 0, 0)`;
    });
    if (s.carryContent) paintFloat();
    else if (floatEl) floatEl.style.visibility = 'hidden';
  };

  const frame = (now: number) => {
    const loop = engine;
    loop.raf = 0;
    const s = current;
    const b = band;
    const c = cursor;
    const reduced = prefersReduced();
    const elapsed = clamp((now - loop.last) / 1000, 0, 1 / 20);
    loop.last = now;
    let busy = false;

    if (b.shown) {
      const currentRow = b.index >= 0 ? metrics[b.index] : null;
      if (currentRow) {
        const inset = insetFor(currentRow.height);
        const lean =
          c.y === null || reduced
            ? 0
            : clamp(
                (c.y - (currentRow.top + currentRow.height / 2)) * s.magnet,
                -currentRow.height * 0.3,
                currentRow.height * 0.3
              );
        b.toTop = currentRow.top + inset + lean;
        b.toBottom = currentRow.top + currentRow.height - inset + lean;
      } else if (b.index < 0) {
        b.toTop = b.toBottom = b.rest;
      }
      const gap = (b.toTop + b.toBottom) / 2 - (b.top + b.bottom) / 2;
      if (Math.abs(gap) > 2) b.lead = gap > 0 ? 1 : -1;
      if (reduced) {
        b.top = b.toTop;
        b.bottom = b.toBottom;
        b.vTop = b.vBottom = 0;
      } else {
        const omega = (Math.PI * 2) / s.duration;
        const fast = omega * (1 + 1.1 * s.stretch);
        const slow = omega * (1 - 0.4 * s.stretch);
        const zeta = 1 - 0.3 * s.stretch;
        const wTop = b.lead > 0 ? slow : fast;
        const wBottom = b.lead > 0 ? fast : slow;
        const steps = Math.max(1, Math.ceil(elapsed / (1 / 240)));
        const dt = elapsed / steps;
        for (let i = 0; i < steps; i++) {
          b.vTop += (-wTop * wTop * (b.top - b.toTop) - 2 * zeta * wTop * b.vTop) * dt;
          b.vBottom += (-wBottom * wBottom * (b.bottom - b.toBottom) - 2 * zeta * wBottom * b.vBottom) * dt;
          b.top += b.vTop * dt;
          b.bottom += b.vBottom * dt;
          if (b.bottom < b.top) {
            const mid = (b.top + b.bottom) / 2;
            const v = (b.vTop + b.vBottom) / 2;
            b.top = b.bottom = mid;
            b.vTop = b.vBottom = v;
          }
        }
      }
      const resting =
        Math.abs(b.top - b.toTop) < 0.1 &&
        Math.abs(b.bottom - b.toBottom) < 0.1 &&
        Math.abs(b.vTop) < 2 &&
        Math.abs(b.vBottom) < 2;
      if (resting) {
        b.top = b.toTop;
        b.bottom = b.toBottom;
        b.vTop = b.vBottom = 0;
        if (b.index < 0 && b.bottom - b.top < 0.5) b.shown = false;
      } else busy = true;
    }

    const r = roll;
    if (r.p < 1) {
      r.p = reduced ? 1 : Math.min(1, r.p + elapsed / (s.duration * 0.8));
      busy = true;
    }

    c.vx *= Math.exp(-elapsed / 0.3);
    const push = clamp(c.vx * s.followCursor * 0.55, -1600, 1600);

    marquees.forEach((state, index) => {
      if (!state) return;
      const goal = state.covered ? 1 : 0;
      state.spin += (goal - state.spin) * (1 - Math.exp(-elapsed / 0.35));
      if (Math.abs(goal - state.spin) < 0.002) state.spin = goal;
      if (!state.covered && state.spin === 0) return;
      busy = true;
      if (state.part <= 0 || reduced) return;
      const flow = s.direction === 'alternate' ? (index % 2 ? 1 : -1) : s.direction === 'right' ? 1 : -1;
      state.x += (flow * s.speed + push) * state.spin * elapsed;
      state.x = (((state.x % state.part) + state.part) % state.part) - state.part;
    });

    paint();
    if (busy) loop.raf = requestAnimationFrame(frame);
  };

  const kick = () => {
    const loop = engine;
    if (loop.raf || typeof window === 'undefined' || !mounted) return;
    loop.last = performance.now();
    loop.raf = requestAnimationFrame(frame);
  };

  const goTo = (index: number, from: 'top' | 'bottom' | 'center') => {
    const m = metrics[index];
    if (!m) return;
    const b = band;
    const inset = insetFor(m.height);
    const top = m.top + inset;
    const bottom = m.top + m.height - inset;
    const r = roll;
    const showing = r.slots[r.current];
    if (current.carryContent && showing !== index) {
      if (!b.shown || showing < 0) {
        r.slots[r.current] = index;
        r.p = 1;
      } else {
        const eased = 1 - Math.pow(1 - r.p, 3);
        r.fromOpacity = eased;
        r.fromOffset = (1 - eased) * m.height * 0.8 * r.dir;
        r.dir = index > showing ? 1 : -1;
        r.current = 1 - r.current;
        r.slots[r.current] = index;
        r.p = 0;
      }
      setSlots([...r.slots]);
    }
    if (!b.shown) {
      const start = from === 'bottom' ? bottom : from === 'center' ? (top + bottom) / 2 : top;
      b.top = b.bottom = start;
      b.vTop = b.vBottom = 0;
      b.shown = true;
    }
    const shift = (top + bottom) / 2 - (b.top + b.bottom) / 2;
    if (Math.abs(shift) > 0.5) b.lead = shift > 0 ? 1 : -1;
    else b.lead = from === 'bottom' ? -1 : 1;
    b.toTop = top;
    b.toBottom = bottom;
    b.index = index;
    markRows();
    kick();
  };

  const release = (toward: 'top' | 'bottom' | 'center') => {
    const b = band;
    if (!b.shown) return;
    const point = toward === 'top' ? b.toTop : toward === 'bottom' ? b.toBottom : (b.toTop + b.toBottom) / 2;
    b.lead = toward === 'top' ? -1 : 1;
    b.rest = point;
    b.toTop = b.toBottom = point;
    b.index = -1;
    cursor.y = null;
    markRows();
    kick();
  };

  const rowAt = (clientY: number) => {
    const list = listEl;
    if (!list) return -1;
    const y = clientY - list.getBoundingClientRect().top;
    return metrics.findIndex(m => m && y >= m.top && y < m.top + m.height);
  };

  const halfOf = (clientY: number, index: number): 'top' | 'bottom' => {
    const list = listEl;
    const m = metrics[index];
    if (!list || !m) return 'top';
    return clientY - list.getBoundingClientRect().top - m.top < m.height / 2 ? 'top' : 'bottom';
  };

  const stopIntro = () => {
    const loop = engine;
    loop.touched = true;
    loop.timers.forEach(clearTimeout);
    loop.timers = [];
  };

  const measure = () => {
    const list = listEl;
    metrics = rows.map(row => (row?.item ? { top: row.item.offsetTop, height: row.item.offsetHeight } : null));
    if (list && metrics[0]) {
      const height = metrics[0].height;
      const inset = insetFor(height);
      rootEl?.style.setProperty('--flowing-menu-band', String(height ? (height - inset * 2) / height : 1));
    }
    const next = rows.map((row, index) => {
      const state = marqueeAt(index);
      const part = row?.track?.firstElementChild;
      const width = part?.getBoundingClientRect().width ?? 0;
      const total = row?.item?.getBoundingClientRect().width ?? 0;
      if (width > 0) {
        state.part = width;
        state.x = (((state.x % width) + width) % width) - width;
      }
      return width > 0 ? Math.max(2, Math.ceil(total / width) + 1) : 3;
    });
    const prev = copyCounts;
    if (!(prev.length === next.length && prev.every((value, index) => value === next[index]))) {
      copyCounts = next;
      setCopies(next);
    }
    const b = band;
    if (b.shown && b.index >= 0) {
      const m = metrics[b.index];
      if (m) {
        const inset = insetFor(m.height);
        b.toTop = m.top + inset;
        b.toBottom = m.top + m.height - inset;
      }
    }
    paint();
    kick();
  };

  const observe = () => {
    observer?.disconnect();
    const root = rootEl;
    if (!root || typeof ResizeObserver === 'undefined') return;
    observer ??= new ResizeObserver(() => measure());
    observer.observe(root);
    rows.forEach(row => {
      const part = row?.track?.firstElementChild;
      if (part) observer?.observe(part);
    });
  };

  createEffect(
    () => ({ s: settings(), count: items().length }),
    ({ s, count }) => {
      current = s;
      rows.length = count;
      marquees.length = count;
      if (mounted) paint();
    }
  );

  createEffect(
    () => ({ list: items(), inset: props.bandInset }),
    () => {
      if (!mounted) return;
      measure();
      observe();
    }
  );

  onSettled(() => {
    current = settings();
    mounted = true;
    const loop = engine;
    rows.length = items().length;
    marquees.length = items().length;
    measure();
    observe();
    paint();

    const root = rootEl;
    if ((props.intro ?? true) && !prefersReduced() && root) {
      root.querySelectorAll('[data-intro-line]').forEach((node, index) => {
        node.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], {
          duration: 900,
          delay: index * 70,
          easing: EASE,
          fill: 'backwards'
        });
      });
      root.querySelectorAll('[data-intro-fade]').forEach((node, index) => {
        node.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 700,
          delay: 200 + index * 40,
          easing: 'ease',
          fill: 'backwards'
        });
      });
      root.querySelectorAll('[data-intro-rule]').forEach((node, index) => {
        node.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], {
          duration: 1100,
          delay: index * 70,
          easing: EASE,
          fill: 'backwards'
        });
      });
      const count = rows.filter(Boolean).length;
      const start = 650 + count * 70;
      for (let index = 0; index < count; index++) {
        loop.timers.push(
          setTimeout(
            () => {
              if (!loop.touched) goTo(index, 'top');
            },
            start + index * 170
          )
        );
      }
      loop.timers.push(
        setTimeout(
          () => {
            if (!loop.touched) release('bottom');
          },
          start + count * 170 + 120
        )
      );
    }

    return () => {
      mounted = false;
      loop.timers.forEach(clearTimeout);
      loop.timers = [];
      cancelAnimationFrame(loop.raf);
      loop.raf = 0;
      observer?.disconnect();
      observer = null;
    };
  });

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    stopIntro();
    const c = cursor;
    const now = performance.now();
    const gap = (now - c.t) / 1000;
    if (gap > 0 && gap < 0.1) {
      const instant = (event.clientX - c.x) / gap;
      c.vx += (instant - c.vx) * (1 - Math.exp(-gap / 0.08));
    }
    c.x = event.clientX;
    c.t = now;
    const list = listEl;
    if (list) c.y = event.clientY - list.getBoundingClientRect().top;
    const index = rowAt(event.clientY);
    if (index >= 0 && index !== band.index) goTo(index, halfOf(event.clientY, index));
    else kick();
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const list = listEl;
    const b = band;
    if (!list || b.index < 0) return;
    const rect = list.getBoundingClientRect();
    if (event.clientY <= rect.top) release('top');
    else if (event.clientY >= rect.bottom) release('bottom');
    else release(halfOf(event.clientY, b.index));
  };

  const linkHandlers = (item: () => FlowingMenuItem, index: number) => ({
    onPointerDown: (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return;
      stopIntro();
      goTo(index, halfOf(event.clientY, index));
    },
    onFocus: (event: FocusEvent & { currentTarget: HTMLElement }) => {
      if (!event.currentTarget.matches(':focus-visible')) return;
      stopIntro();
      goTo(index, 'top');
    },
    onBlur: (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && listEl?.contains(next)) return;
      release('bottom');
    },
    onClick: (event: MouseEvent) => current.onItemClick?.(item(), index, event)
  });

  const shape = () => {
    const value = props.imageShape ?? 'pill';
    return SHAPES.includes(value) ? value : 'pill';
  };

  const marqueeParts = (item: () => FlowingMenuItem | null | undefined, count: () => number) => (
    <For each={item() ? range(count()) : []} keyed={false}>
      {() => (
        <div class={PART}>
          <span class={PART_TEXT}>{item()?.marquee ?? item()?.text}</span>
          <Show when={item()?.image}>
            {image => <span class={IMAGE} style={{ 'background-image': `url(${image()})` }} />}
          </Show>
        </div>
      )}
    </For>
  );

  return (
    <nav
      ref={el => (rootEl = el)}
      class={[ROOT, props.className]}
      style={{
        'background-color': props.bgColor ?? '#0c0f13',
        color: props.textColor ?? '#ffffff',
        '--flowing-menu-border': props.borderColor ?? 'rgba(255, 255, 255, 0.14)',
        ...(props.style ?? {})
      }}
      aria-label={props.ariaLabel ?? 'Menu'}
      data-align={props.align === 'left' ? 'left' : 'center'}
      data-shape={shape()}
    >
      <ul ref={el => (listEl = el)} class={LIST} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
        <For each={items()} keyed={false}>
          {(item, index) => {
            const active = () => index === props.activeIndex;
            const handlers = linkHandlers(item, index);
            const content = () => (
              <>
                <span class={INDEX} data-intro-fade="" aria-hidden="true">
                  {props.showIndex ? String(index + 1).padStart(2, '0') : null}
                </span>
                <span class={LABEL}>
                  <span class={LABEL_TEXT} data-intro-line="">
                    {item().text}
                  </span>
                  <Show when={active()}>
                    <span class={DOT} aria-hidden="true" />
                  </Show>
                </span>
                <span class={END} data-intro-fade="" aria-hidden="true">
                  <Show when={item().meta}>
                    <span class={META}>{item().meta}</span>
                  </Show>
                  <Show when={props.showArrow}>
                    <span class={ARROW}>
                      <Icon icon={ArrowUpRight01Icon} size={22} strokeWidth={1.75} />
                    </span>
                  </Show>
                </span>
              </>
            );
            return (
              <li ref={el => (rows[index] = { ...rows[index], item: el })} class={ITEM}>
                <Show when={(props.dividers ?? true) && index > 0}>
                  <span class={DIVIDER} data-intro-rule="" aria-hidden="true" />
                </Show>
                <Show
                  when={item().link}
                  fallback={
                    <button
                      type="button"
                      class={LINK}
                      aria-current={active() ? 'page' : undefined}
                      onPointerDown={handlers.onPointerDown}
                      onFocus={handlers.onFocus}
                      onBlur={handlers.onBlur}
                      onClick={handlers.onClick}
                    >
                      {content()}
                    </button>
                  }
                >
                  <a
                    class={LINK}
                    href={item().link}
                    aria-current={active() ? 'page' : undefined}
                    onPointerDown={handlers.onPointerDown}
                    onFocus={handlers.onFocus}
                    onBlur={handlers.onBlur}
                    onClick={handlers.onClick}
                  >
                    {content()}
                  </a>
                </Show>
                <div
                  class={BAND}
                  aria-hidden="true"
                  style={{
                    'background-color': props.marqueeBgColor ?? '#ffffff',
                    color: props.marqueeTextColor ?? '#0c0f13'
                  }}
                  ref={el => (rows[index] = { ...rows[index], band: el })}
                >
                  <div class={TRACK} ref={el => (rows[index] = { ...rows[index], track: el })}>
                    {marqueeParts(item, () => copies()[index] ?? 3)}
                  </div>
                </div>
              </li>
            );
          }}
        </For>
      </ul>
      <Show when={props.carryContent}>
        <div
          class={FLOAT}
          aria-hidden="true"
          ref={el => (floatEl = el)}
          style={{
            'background-color': props.marqueeBgColor ?? '#ffffff',
            color: props.marqueeTextColor ?? '#0c0f13'
          }}
        >
          <For each={[0, 1]}>
            {slot => (
              <div class={FLOAT_LAYER} ref={el => (layerEls[slot] = el)}>
                <div class={TRACK} ref={el => (layerTracks[slot] = el)}>
                  {marqueeParts(
                    () => (slots()[slot] >= 0 ? items()[slots()[slot]] : null),
                    () => copies()[slots()[slot]] ?? 3
                  )}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </nav>
  );
}

export default FlowingMenu;
