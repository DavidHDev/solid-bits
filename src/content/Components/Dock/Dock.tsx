import { For, Show, createEffect, createMemo, createSignal, onCleanup, onSettled, untrack } from 'solid-js';
import { Portal } from '@solidjs/web';
import type { JSX } from '@solidjs/web';

import './Dock.css';

export type DockSide = 'bottom' | 'top' | 'left' | 'right';

export type DockMenuItem = {
  label?: JSX.Element;
  onClick?: () => void;
  icon?: JSX.Element;
  checked?: boolean;
  disabled?: boolean;
  shortcut?: JSX.Element;
  items?: DockMenuItem[];
  separator?: boolean;
};

export type DockItemData = {
  icon?: JSX.Element;
  label?: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  badge?: JSX.Element;
  menu?: DockMenuItem[];
  separator?: boolean;
};

export type DockSpring = {
  mass?: number;
  stiffness?: number;
  damping?: number;
};

export type DockProps = {
  items?: DockItemData[];
  position?: DockSide;
  theme?: 'dark' | 'light';
  baseItemSize?: number;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
  gap?: number;
  roundness?: number;
  spring?: DockSpring;
  bounce?: boolean;
  autoHide?: boolean;
  tiles?: boolean;
  showLabels?: boolean;
  showIndicators?: boolean;
  showBadges?: boolean;
  badgeColor?: string;
  accentColor?: string;
  className?: string;
  style?: JSX.CSSProperties;
};

type Tokens = Record<string, string>;
type Point = { x: number; y: number };
type Edge = { left: number; right: number; top: number };
type Frame = { left: number; top: number; width: number; height: number };
type SubMenu = { index: number; keyboard: boolean; edge: Edge };

type MenuState = {
  id: number;
  index: number;
  point: Point;
  keyboard: boolean;
  closing: boolean;
  restore: boolean;
  rows?: DockMenuItem[];
};

type DockMenuProps = {
  rows: DockMenuItem[];
  label?: string;
  side?: DockSide | null;
  point?: Point;
  edge?: Edge;
  tokens: Tokens;
  nested?: boolean;
  focusFirst?: boolean;
  closing?: boolean;
  pressing: { current: boolean };
  onSelect?: (row: DockMenuItem, keyboard: boolean) => void;
  onDismiss?: (restore: boolean) => void;
  onBack?: () => void;
  onEnter?: () => void;
  onExited?: () => void;
};

type Motion = {
  size: number;
  velocity: number;
  lift: number;
  rise: number;
  launch: number;
  gravity: number;
  hopping: boolean;
  drawn: string;
  node: HTMLButtonElement | null;
};

type Actions = {
  hop: (index: number) => void;
  focus: (index: number) => void;
  hold: (index: number | null) => void;
};

type Press = { id: number; x: number; y: number; timer: number; cleanup: () => void };

type Settings = {
  items: DockItemData[];
  side: DockSide;
  vertical: boolean;
  length: number;
  base: number;
  peak: number;
  thickness: number;
  gap: number;
  distance: number;
  mass: number;
  stiffness: number;
  damping: number;
  bounce: boolean;
  autoHide: boolean;
};

const SIDES: DockSide[] = ['bottom', 'top', 'left', 'right'];
const EDGE = 12;
const HOP = 0.4;
const HOP_TIME = 0.38;
const HOLD_TIME = 450;
const TAIL = 9;
const TAIL_HALF = 9;
const MENU_RADIUS = 10;
const MENU_GAP = 8;
const MARGIN = 8;
const POP = 'cubic-bezier(0.2, 1.25, 0.4, 1)';

const THEMES: Record<'dark' | 'light', Tokens> = {
  dark: {
    '--dock-panel': 'rgba(34, 36, 40, 0.66)',
    '--dock-panel-edge': 'rgba(255, 255, 255, 0.08)',
    '--dock-panel-highlight': 'rgba(255, 255, 255, 0.07)',
    '--dock-panel-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--dock-tile': 'linear-gradient(180deg, #36393e 0%, #24272b 100%)',
    '--dock-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--dock-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--dock-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--dock-ink': '#f2f4f7',
    '--dock-label': '#26292d',
    '--dock-label-ink': '#f2f4f7',
    '--dock-dot': 'rgba(255, 255, 255, 0.72)',
    '--dock-separator': 'rgba(255, 255, 255, 0.12)',
    '--dock-press': 'brightness(0.75)',
    '--dock-menu': 'rgba(36, 38, 42, 0.8)',
    '--dock-menu-edge': 'rgba(255, 255, 255, 0.13)',
    '--dock-menu-ink': '#f2f4f7',
    '--dock-menu-muted': 'rgba(242, 244, 247, 0.42)',
    '--dock-menu-separator': 'rgba(255, 255, 255, 0.1)',
    '--dock-menu-shadow': '0 18px 40px -12px rgba(0, 0, 0, 0.65), 0 3px 10px rgba(0, 0, 0, 0.3)'
  },
  light: {
    '--dock-panel': 'rgba(240, 241, 243, 0.8)',
    '--dock-panel-edge': 'rgba(23, 25, 28, 0.07)',
    '--dock-panel-highlight': 'rgba(255, 255, 255, 0.95)',
    '--dock-panel-shadow': '0 22px 44px -22px rgba(23, 25, 28, 0.3), 0 6px 16px -10px rgba(23, 25, 28, 0.16)',
    '--dock-tile': 'linear-gradient(180deg, #ffffff 0%, #f5f6f7 100%)',
    '--dock-tile-edge': 'rgba(23, 25, 28, 0.08)',
    '--dock-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--dock-tile-shadow': '0 4px 10px -5px rgba(23, 25, 28, 0.25)',
    '--dock-ink': '#26282b',
    '--dock-label': '#ffffff',
    '--dock-label-ink': '#12161c',
    '--dock-dot': 'rgba(23, 25, 28, 0.55)',
    '--dock-separator': 'rgba(23, 25, 28, 0.12)',
    '--dock-press': 'brightness(0.9)',
    '--dock-menu': 'rgba(248, 249, 250, 0.86)',
    '--dock-menu-edge': 'rgba(23, 25, 28, 0.1)',
    '--dock-menu-ink': '#12161c',
    '--dock-menu-muted': 'rgba(23, 25, 28, 0.4)',
    '--dock-menu-separator': 'rgba(23, 25, 28, 0.1)',
    '--dock-menu-shadow': '0 18px 40px -14px rgba(23, 25, 28, 0.3), 0 3px 10px rgba(23, 25, 28, 0.1)'
  }
};

const hasBadge = (badge: unknown) => badge !== undefined && badge !== null && badge !== false;
const usable = (row?: DockMenuItem | null): row is DockMenuItem => !!row && !row.separator && !row.disabled;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

const menuPath = (width: number, height: number, side: DockSide | null, at: number) => {
  const r = MENU_RADIUS;
  const p = (x: number, y: number) => `${(x + TAIL).toFixed(2)} ${(y + TAIL).toFixed(2)}`;
  const tail = (x: number, y: number, dx: number, dy: number, nx: number, ny: number) => {
    const q = (u: number, v: number) => p(x + dx * u + nx * v, y + dy * u + ny * v);
    return `L ${q(-TAIL_HALF, 0)} L ${q(-TAIL_HALF * 0.18, TAIL * 0.82)} Q ${q(0, TAIL)} ${q(TAIL_HALF * 0.18, TAIL * 0.82)} L ${q(TAIL_HALF, 0)}`;
  };
  return [
    `M ${p(r, 0)}`,
    side === 'top' ? tail(at, 0, 1, 0, 0, -1) : '',
    `L ${p(width - r, 0)} A ${r} ${r} 0 0 1 ${p(width, r)}`,
    side === 'right' ? tail(width, at, 0, 1, 1, 0) : '',
    `L ${p(width, height - r)} A ${r} ${r} 0 0 1 ${p(width - r, height)}`,
    side === 'bottom' ? tail(at, height, -1, 0, 0, 1) : '',
    `L ${p(r, height)} A ${r} ${r} 0 0 1 ${p(0, height - r)}`,
    side === 'left' ? tail(0, at, 0, -1, -1, 0) : '',
    `L ${p(0, r)} A ${r} ${r} 0 0 1 ${p(r, 0)} Z`
  ].join(' ');
};

const CheckGlyph = () => (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3.5 8.5l3 3 6-7" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

const ChevronGlyph = () => (
  <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M6 3.5L10.5 8 6 12.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

function DockMenu(props: DockMenuProps) {
  let outerEl: HTMLDivElement | undefined;
  let listEl: HTMLDivElement | undefined;
  let glassEl: HTMLSpanElement | undefined;
  let shapeEl: SVGSVGElement | undefined;
  let pathEl: SVGPathElement | undefined;
  let highlightEl: HTMLSpanElement | undefined;
  const rowEls: (HTMLButtonElement | null)[] = [];
  let frame: Frame | null = null;
  let timer = 0;
  let alive = true;
  let reduce = false;
  let activeNow = -1;
  let subNow: SubMenu | null = null;
  let chosenNow = false;
  const [active, setActiveSignal] = createSignal(-1);
  const [sub, setSubSignal] = createSignal<SubMenu | null>(null);
  const [blink, setBlinkSignal] = createSignal(false);

  const setActive = (value: number) => {
    activeNow = value;
    setActiveSignal(value);
  };
  const setSub = (value: SubMenu | null) => {
    subNow = value;
    setSubSignal(value);
  };
  const setBlink = (value: boolean) => {
    setBlinkSignal(value);
  };
  const setChosen = (value: boolean) => {
    chosenNow = value;
  };

  const rows = createMemo(() => props.rows);
  const checks = createMemo(() => rows().some(row => row && !row.separator && row.checked !== undefined));
  const subIndex = createMemo(() => sub()?.index ?? -1);
  const subToken = createMemo(() => {
    const index = subIndex();
    return index >= 0 ? { index } : null;
  });

  const layers = () =>
    [outerEl?.firstElementChild, glassEl, shapeEl, listEl].filter((layer): layer is Element => Boolean(layer));

  onSettled(() => {
    const outer = outerEl;
    const list = listEl;
    const glass = glassEl;
    const shape = pathEl;
    if (!outer || !list || !glass || !shape) return;
    alive = true;
    const side = props.side ?? null;
    const nested = props.nested ?? false;
    const { x, y } = props.point ?? { x: 0, y: 0 };
    const box = props.edge ?? { left: 0, right: 0, top: 0 };
    reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const width = list.offsetWidth;
    const height = list.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    let left: number;
    let top: number;
    let at = 0;
    let origin: string;
    if (side === 'bottom' || side === 'top') {
      left = clamp(x - width / 2, MARGIN, vw - MARGIN - width);
      top = side === 'bottom' ? y - TAIL - height : y + TAIL;
      at = clamp(x - left, MENU_RADIUS + TAIL_HALF, width - MENU_RADIUS - TAIL_HALF);
      origin = `${at}px ${side === 'bottom' ? height + TAIL : -TAIL}px`;
    } else if (side === 'left' || side === 'right') {
      top = clamp(y - height / 2, MARGIN, vh - MARGIN - height);
      left = side === 'right' ? x - TAIL - width : x + TAIL;
      at = clamp(y - top, MENU_RADIUS + TAIL_HALF, height - MENU_RADIUS - TAIL_HALF);
      origin = `${side === 'right' ? width + TAIL : -TAIL}px ${at}px`;
    } else {
      const flip = box.right - 4 + width > vw - MARGIN && box.left + 4 - width >= MARGIN;
      left = flip ? box.left + 4 - width : box.right - 4;
      top = clamp(box.top - 5, MARGIN, vh - MARGIN - height);
      origin = flip ? 'right top' : 'left top';
    }
    const path = menuPath(width, height, side, at);
    frame = { left, top, width, height };
    outer.style.left = `${left}px`;
    outer.style.top = `${top}px`;
    outer.style.transformOrigin = origin;
    outer.style.visibility = 'visible';
    glass.style.clipPath = `path('${path}')`;
    shape.setAttribute('d', path);
    if (reduce) {
      layers().forEach(layer => layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' }));
    } else {
      outer.animate([{ transform: `scale(${nested ? 0.94 : 0.82})` }, { transform: 'scale(1)' }], {
        duration: nested ? 220 : 340,
        easing: POP
      });
      layers().forEach(layer =>
        layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: nested ? 120 : 160, easing: 'ease-out' })
      );
    }
    const first = props.rows.findIndex(usable);
    if (props.focusFirst && first >= 0) {
      setActive(first);
      rowEls[first]?.focus({ preventScroll: true });
    } else {
      list.focus({ preventScroll: true });
    }
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  });

  createEffect(
    () => props.closing ?? false,
    closing => {
      if (!closing) return undefined;
      const outer = outerEl;
      const duration = reduce ? 100 : 150;
      let done = false;
      const finish = () => {
        if (done || !alive) return;
        done = true;
        props.onExited?.();
      };
      if (outer && !reduce) {
        outer.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }], {
          duration,
          easing: 'ease-in',
          fill: 'forwards'
        });
      }
      layers().forEach(layer =>
        layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: 'ease-in', fill: 'forwards' })
      );
      const exitTimer = window.setTimeout(finish, duration);
      return () => window.clearTimeout(exitTimer);
    }
  );

  createEffect(
    () => [active(), blink()] as const,
    ([index, blinking]) => {
      const highlight = highlightEl;
      if (!highlight) return;
      const row = rowEls[index];
      if (!row || blinking) {
        if (blinking) highlight.style.transition = 'none';
        highlight.style.opacity = '0';
        return;
      }
      const jump = highlight.style.opacity !== '1' || reduce;
      if (jump) highlight.style.transition = 'none';
      highlight.style.transform = `translateY(${row.offsetTop}px)`;
      highlight.style.height = `${row.offsetHeight}px`;
      highlight.style.opacity = '1';
      if (jump) {
        void highlight.offsetHeight;
        highlight.style.transition = '';
      }
    }
  );

  const activate = (index: number) => {
    setActive(index);
    rowEls[index]?.focus({ preventScroll: true });
  };

  const openSub = (index: number, keyboard: boolean) => {
    window.clearTimeout(timer);
    const row = rowEls[index];
    if (!frame || !row) return;
    setSub({
      index,
      keyboard,
      edge: { left: frame.left, right: frame.left + frame.width, top: frame.top + row.offsetTop }
    });
  };

  const closeSub = () => {
    window.clearTimeout(timer);
    setSub(null);
  };

  const choose = (index: number, keyboard: boolean) => {
    if (chosenNow) return;
    const row = props.rows[index];
    setChosen(true);
    setActive(index);
    window.clearTimeout(timer);
    if (reduce) {
      props.onSelect?.(row, keyboard);
      return;
    }
    setBlink(true);
    window.setTimeout(() => alive && setBlink(false), 70);
    window.setTimeout(() => alive && props.onSelect?.(row, keyboard), 150);
  };

  const enterRow = (index: number) => {
    const list = props.rows;
    if (chosenNow || activeNow === index || !usable(list[index])) return;
    activate(index);
    window.clearTimeout(timer);
    if (list[index].items?.length) {
      if (subNow?.index !== index) timer = window.setTimeout(() => openSub(index, false), 120);
    } else if (subNow) {
      timer = window.setTimeout(closeSub, 220);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (chosenNow) return;
    const { key } = event;
    const list = props.rows;
    const order = list.flatMap((row, i) => (usable(row) ? [i] : []));
    let handled = true;
    if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Home' || key === 'End') {
      if (order.length) {
        const at = order.indexOf(activeNow);
        let next = order[0];
        if (key === 'End') next = order[order.length - 1];
        else if (key === 'ArrowDown') next = order[(at + 1) % order.length];
        else if (key === 'ArrowUp') next = order[at <= 0 ? order.length - 1 : at - 1];
        if (subNow) closeSub();
        activate(next);
      }
    } else if (key === 'ArrowRight' && list[activeNow]?.items?.length) {
      openSub(activeNow, true);
    } else if ((key === 'ArrowLeft' || key === 'Escape') && props.nested) {
      props.onBack?.();
    } else if (key === 'Escape' || key === 'Tab') {
      props.onDismiss?.(true);
    } else {
      handled = false;
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const subRow = () => {
    const current = sub();
    return current ? rows()[current.index] : null;
  };

  return (
    <>
      <Portal>
        <div ref={el => (outerEl = el)} class="dock-menu" style={props.tokens as JSX.CSSProperties} data-dock-menu="">
          <span class="dock-menu-shadow" />
          <span ref={el => (glassEl = el)} class="dock-menu-glass" />
          <svg ref={el => (shapeEl = el)} class="dock-menu-shape" aria-hidden="true">
            <path ref={el => (pathEl = el)} />
          </svg>
          <div
            ref={el => (listEl = el)}
            class="dock-menu-list"
            role="menu"
            aria-label={props.label}
            tabindex={-1}
            onKeyDown={onKeyDown}
            onPointerEnter={() => props.onEnter?.()}
            onPointerLeave={() => {
              if (subNow || chosenNow) return;
              setActive(-1);
              listEl?.focus({ preventScroll: true });
            }}
          >
            <span ref={el => (highlightEl = el)} class="dock-menu-highlight" />
            <For each={rows()} keyed={false}>
              {(row, index) => (
                <Show when={row()}>
                  <Show when={!row().separator} fallback={<span class="dock-menu-separator" role="separator" />}>
                    {(() => {
                      onCleanup(() => {
                        rowEls[index] = null;
                      });
                      const submenu = () => Boolean(row().items?.length);
                      return (
                        <button
                          ref={el => (rowEls[index] = el)}
                          type="button"
                          class="dock-menu-row"
                          role={row().checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
                          aria-checked={row().checked !== undefined ? (row().checked ? 'true' : 'false') : undefined}
                          aria-disabled={row().disabled ? 'true' : undefined}
                          aria-haspopup={submenu() ? 'menu' : undefined}
                          aria-expanded={submenu() ? (sub()?.index === index ? 'true' : 'false') : undefined}
                          tabindex={-1}
                          data-dock-row={index}
                          data-active={index === active() && !blink() ? '' : undefined}
                          onPointerMove={() => enterRow(index)}
                          onPointerUp={() => {
                            if (!props.pressing.current || !usable(row()) || submenu()) return;
                            props.pressing.current = false;
                            choose(index, false);
                          }}
                          onClick={event => {
                            if (chosenNow || !usable(row())) return;
                            if (submenu()) openSub(index, event.detail === 0);
                            else choose(index, event.detail === 0);
                          }}
                        >
                          <Show when={checks()}>
                            <span class="dock-menu-check">
                              <Show when={row().checked}>
                                <CheckGlyph />
                              </Show>
                            </span>
                          </Show>
                          <Show when={row().icon}>
                            <span class="dock-menu-icon">{row().icon}</span>
                          </Show>
                          <span class="dock-menu-text">{row().label}</span>
                          <Show when={row().shortcut}>
                            <span class="dock-menu-shortcut">{row().shortcut}</span>
                          </Show>
                          <Show when={submenu()}>
                            <span class="dock-menu-chevron">
                              <ChevronGlyph />
                            </span>
                          </Show>
                        </button>
                      );
                    })()}
                  </Show>
                </Show>
              )}
            </For>
          </div>
        </div>
      </Portal>
      <Show when={subToken()} keyed>
        {token => (
          <DockMenu
            rows={subRow()?.items ?? []}
            label={typeof subRow()?.label === 'string' ? (subRow()?.label as string) : undefined}
            edge={sub()?.edge}
            tokens={props.tokens}
            nested
            focusFirst={sub()?.keyboard}
            closing={props.closing}
            pressing={props.pressing}
            onSelect={(row, keyboard) => props.onSelect?.(row, keyboard)}
            onDismiss={restore => props.onDismiss?.(restore)}
            onBack={() => {
              closeSub();
              activate(token.index);
            }}
            onEnter={() => {
              window.clearTimeout(timer);
              setActive(token.index);
            }}
          />
        )}
      </Show>
    </>
  );
}

export default function Dock(props: DockProps) {
  let rootEl: HTMLDivElement | undefined;
  const itemEls: (HTMLButtonElement | null)[] = [];
  let wake: (() => void) | null = null;
  let actions: Actions | null = null;
  let observeHost: (() => void) | null = null;
  let menuNow: MenuState | null = null;
  let serial = 0;
  let press: Press | null = null;
  const pressing = { current: false };
  let skip = -1;
  const [fit, setFit] = createSignal(1);
  const [menu, setMenuSignal] = createSignal<MenuState | null>(null);
  const startHidden = untrack(() => Boolean(props.autoHide));

  const setMenu = (value: MenuState | null) => {
    menuNow = value;
    setMenuSignal(value);
  };

  const items = createMemo(() => props.items ?? []);
  const side = createMemo<DockSide>(() => {
    const position = props.position ?? 'bottom';
    return SIDES.includes(position) ? position : 'bottom';
  });
  const vertical = createMemo(() => side() === 'left' || side() === 'right');

  const geometry = createMemo(() => {
    const list = items();
    const rawBase = Math.max(16, props.baseItemSize ?? 50);
    const rawPeak = Math.max(rawBase, props.magnification ?? 70);
    const rawThickness = Math.max(rawBase, props.panelHeight ?? 68);
    const rawGap = Math.max(0, props.gap ?? 10);
    const length =
      list.reduce((sum, item) => sum + (item?.separator ? 1 : rawBase), 0) +
      rawGap * Math.max(0, list.length - 1) +
      rawThickness -
      rawBase;
    return { rawBase, rawPeak, rawThickness, rawGap, length, vertical: vertical(), total: length + rawPeak - rawBase };
  });

  const tokens = createMemo<Tokens>(() => ({
    ...(THEMES[props.theme ?? 'dark'] ?? THEMES.dark),
    '--dock-accent': props.accentColor ?? '#0a84ff',
    '--dock-badge': props.badgeColor ?? '#ff453a'
  }));

  const settings = createMemo<Settings>(() => {
    const g = geometry();
    const f = fit();
    const spring = props.spring ?? { mass: 0.1, stiffness: 150, damping: 12 };
    return {
      items: items(),
      side: side(),
      vertical: g.vertical,
      length: g.total,
      base: g.rawBase * f,
      peak: g.rawPeak * f,
      thickness: g.rawThickness * f,
      gap: g.rawGap * f,
      distance: Math.max(1, props.distance ?? 200) * f,
      mass: Math.max(0.01, spring?.mass ?? 0.1),
      stiffness: Math.max(1, spring?.stiffness ?? 150),
      damping: Math.max(0, spring?.damping ?? 12),
      bounce: props.bounce ?? true,
      autoHide: props.autoHide ?? false
    };
  });

  let current: Settings = untrack(settings);
  let geo = untrack(geometry);
  let geoKey = '';

  createEffect(settings, value => {
    current = value;
    wake?.();
  });

  createEffect(geometry, value => {
    geo = value;
    const key = `${value.length}|${value.vertical}|${value.rawPeak}|${value.rawBase}`;
    if (key === geoKey) return;
    geoKey = key;
    observeHost?.();
  });

  onSettled(() => {
    const root = rootEl;
    if (!root) return;

    let observer: ResizeObserver | null = null;
    const measure = () => {
      const host = root.offsetParent ?? document.documentElement;
      const room = (geo.vertical ? host.clientHeight : host.clientWidth) - EDGE * 2;
      const next = geo.total > 0 ? Math.min(1, Math.max(0.4, room / geo.total)) : 1;
      setFit(Math.round(next * 1000) / 1000);
    };
    observeHost = () => {
      observer?.disconnect();
      const host = root.offsetParent ?? document.documentElement;
      observer = new ResizeObserver(measure);
      observer.observe(host);
    };
    observeHost();

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const motion = new Map<number, Motion>();
    const pointer = { x: 0, y: 0, inside: false };
    let focused = -1;
    let held: number | null = null;
    let lastFocus: number | null = null;
    let lastRest: number[] = [];
    let lastBase = current.base;
    let hidden = root.hasAttribute('data-hidden');
    let hiding = current.autoHide;
    let hideTimer = 0;
    let raf = 0;
    let last = 0;
    let alive = true;

    const entry = (index: number): Motion => {
      let state = motion.get(index);
      if (!state) {
        state = {
          size: current.base,
          velocity: 0,
          lift: 0,
          rise: 0,
          launch: 0,
          gravity: 0,
          hopping: false,
          drawn: '',
          node: null
        };
        motion.set(index, state);
      }
      return state;
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = current;
      const dt = Math.min(1 / 30, Math.max(0.001, (now - last) / 1000));
      last = now;
      if (s.base !== lastBase) {
        const ratio = s.base / lastBase;
        motion.forEach(state => {
          state.size *= ratio;
          state.velocity *= ratio;
        });
        lastBase = s.base;
      }
      const rect = root.getBoundingClientRect();
      const center = s.vertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const spans = s.items.map(item => (item?.separator ? 1 : s.base));
      let cursor = -(spans.reduce((sum, span) => sum + span, 0) + s.gap * Math.max(0, spans.length - 1)) / 2;
      const rest = spans.map(span => {
        const middle = cursor + span / 2;
        cursor += span + s.gap;
        return middle;
      });
      let focus: number | null = null;
      if (held !== null) focus = held;
      else if (pointer.inside) focus = (s.vertical ? pointer.y : pointer.x) - center;
      else if (rest[focused] !== undefined) focus = rest[focused];
      lastFocus = focus;
      lastRest = rest;
      const steps = Math.max(1, Math.ceil(dt * 240));
      const h = dt / steps;
      const k = s.stiffness / s.mass;
      const c = s.damping / s.mass;
      let moving = false;

      s.items.forEach((item, index) => {
        const node = itemEls[index];
        if (!node || item?.separator) return;
        const state = entry(index);
        const reach = focus === null ? 1 : Math.abs(focus - rest[index]) / s.distance;
        const target = s.base + (s.peak - s.base) * (reach < 1 ? Math.cos((reach * Math.PI) / 2) ** 2 : 0);
        if (reduce) {
          state.size = target;
          state.velocity = 0;
        } else {
          for (let i = 0; i < steps; i++) {
            state.velocity = (state.velocity + h * k * (target - state.size)) / (1 + h * c + h * h * k);
            state.size += state.velocity * h;
            if (!state.hopping) continue;
            state.rise -= state.gravity * h;
            state.lift += state.rise * h;
            if (state.lift > 0) continue;
            state.lift = 0;
            state.rise *= -0.36;
            if (state.rise < state.launch * 0.2) {
              state.rise = 0;
              state.hopping = false;
              node.removeAttribute('data-hop');
            }
          }
        }
        if (Math.abs(state.velocity) < 0.01 && Math.abs(target - state.size) < 0.01) {
          state.size = target;
          state.velocity = 0;
        } else {
          moving = true;
        }
        if (state.hopping) moving = true;
        const size = Math.max(1, state.size);
        const drawn = `${size.toFixed(2)} ${state.lift.toFixed(2)} ${s.side}`;
        if (drawn === state.drawn && node === state.node) return;
        state.drawn = drawn;
        state.node = node;
        const lift = s.side === 'bottom' || s.side === 'right' ? -state.lift : state.lift;
        const tile = node.firstElementChild as HTMLElement | null;
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        if (tile)
          tile.style.transform = `translate(${s.vertical ? `${lift}px, 0` : `0, ${lift}px`}) scale(${size / s.base})`;
      });

      if (moving) raf = requestAnimationFrame(tick);
    };

    const wakeTick = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const show = () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      if (!hidden) return;
      hidden = false;
      root.removeAttribute('data-hidden');
    };

    const hide = () => {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      const blocked = pointer.inside || held !== null || root.contains(document.activeElement);
      if (hidden || !current.autoHide || blocked) return;
      hidden = true;
      root.setAttribute('data-hidden', '');
    };

    const hideLater = () => {
      if (hidden || hideTimer || !current.autoHide) return;
      hideTimer = window.setTimeout(hide, 600);
    };

    wake = () => {
      const enabled = current.autoHide;
      if (enabled !== hiding) {
        hiding = enabled;
        if (enabled) hide();
        else show();
      }
      wakeTick();
    };

    actions = {
      hop: (index: number) => {
        const node = itemEls[index];
        if (reduce || !current.bounce || !node) return;
        const state = entry(index);
        if (state.hopping) return;
        const height = state.size * HOP;
        state.gravity = (8 * height) / (HOP_TIME * HOP_TIME);
        state.launch = (state.gravity * HOP_TIME) / 2;
        state.rise = state.launch;
        state.hopping = true;
        node.setAttribute('data-hop', '');
        wakeTick();
      },
      focus: (index: number) => {
        focused = index;
        wakeTick();
      },
      hold: (index: number | null) => {
        if (index === null) {
          held = null;
          wakeTick();
          hideLater();
          return;
        }
        held = lastFocus ?? lastRest[index] ?? 0;
        show();
        wakeTick();
      }
    };

    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      show();
      wakeTick();
    };
    const onLeave = () => {
      pointer.inside = false;
      wakeTick();
      hideLater();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (!root.contains(event.relatedTarget as Node | null)) hideLater();
    };
    const onWindowMove = (event: PointerEvent) => {
      const s = current;
      if (!s.autoHide || pointer.inside) return;
      const host = root.offsetParent;
      const rect = host
        ? host.getBoundingClientRect()
        : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const zone = EDGE + s.thickness * 0.6;
      const x = event.clientX;
      const y = event.clientY;
      const within = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      const near = {
        bottom: y >= rect.bottom - zone,
        top: y <= rect.top + zone,
        left: x <= rect.left + zone,
        right: x >= rect.right - zone
      }[s.side];
      if (within && near) show();
      else hideLater();
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    root.addEventListener('focusin', show);
    root.addEventListener('focusout', onFocusOut);
    window.addEventListener('pointermove', onWindowMove);
    window.addEventListener('pointerdown', onWindowMove);
    wakeTick();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(hideTimer);
      observer?.disconnect();
      observeHost = null;
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      root.removeEventListener('focusin', show);
      root.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('pointermove', onWindowMove);
      window.removeEventListener('pointerdown', onWindowMove);
      wake = null;
      actions = null;
      if (press) {
        window.clearTimeout(press.timer);
        press.cleanup();
        press = null;
      }
    };
  });

  const closeMenu = (restore: boolean) => {
    const open = menuNow;
    if (!open || open.closing) return;
    const rows = current.items[open.index]?.menu ?? [];
    setMenu({ ...open, closing: true, restore, rows });
  };

  const finishMenu = () => {
    const open = menuNow;
    setMenu(null);
    actions?.hold(null);
    if (open?.restore) itemEls[open.index]?.focus({ preventScroll: true });
  };

  createEffect(menu, open => {
    if (!open || open.closing) return undefined;
    const owner = itemEls[open.index];
    const onDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && (target.closest('[data-dock-menu]') || owner?.contains(target))) return;
      closeMenu(false);
    };
    const onScroll = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[data-dock-menu]')) return;
      closeMenu(false);
    };
    const onAway = () => closeMenu(false);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onAway);
    window.addEventListener('blur', onAway);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onAway);
      window.removeEventListener('blur', onAway);
    };
  });

  const openMenu = (index: number, mode: 'pointer' | 'keyboard' | 'press') => {
    const node = itemEls[index];
    if (!node || !current.items[index]?.menu?.length) return false;
    const open = menuNow;
    if (open && open.index === index && !open.closing) return true;
    actions?.hold(index);
    const rect = node.getBoundingClientRect();
    const point = {
      bottom: { x: rect.left + rect.width / 2, y: rect.top - MENU_GAP },
      top: { x: rect.left + rect.width / 2, y: rect.bottom + MENU_GAP },
      left: { x: rect.right + MENU_GAP, y: rect.top + rect.height / 2 },
      right: { x: rect.left - MENU_GAP, y: rect.top + rect.height / 2 }
    }[current.side];
    serial += 1;
    setMenu({
      id: serial,
      index,
      point,
      keyboard: mode === 'keyboard',
      closing: false,
      restore: false
    });
    return true;
  };

  const endPress = () => {
    const active = press;
    if (!active) return;
    window.clearTimeout(active.timer);
    active.cleanup();
    press = null;
  };

  const startPress = (event: PointerEvent & { currentTarget: HTMLButtonElement }, index: number) => {
    endPress();
    const target = event.currentTarget;
    const next: Press = { id: event.pointerId, x: event.clientX, y: event.clientY, timer: 0, cleanup: () => {} };
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
    const onMove = (moved: PointerEvent) => {
      if (moved.pointerId !== next.id) return;
      if (Math.hypot(moved.clientX - next.x, moved.clientY - next.y) > 8) endPress();
    };
    const onUp = (released: PointerEvent) => {
      if (released.pointerId === next.id) endPress();
    };
    next.cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    next.timer = window.setTimeout(() => {
      next.cleanup();
      press = null;
      if (!openMenu(index, 'press')) return;
      skip = index;
      pressing.current = true;
      window.addEventListener(
        'pointerup',
        () => {
          pressing.current = false;
        },
        { once: true }
      );
    }, HOLD_TIME);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    press = next;
  };

  const onItemKeyDown = (event: KeyboardEvent, index: number) => {
    const s = current;
    const toward = { bottom: 'ArrowUp', top: 'ArrowDown', left: 'ArrowRight', right: 'ArrowLeft' }[s.side];
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10') || event.key === toward) {
      if (openMenu(index, 'keyboard')) event.preventDefault();
      return;
    }
    const order = s.items.flatMap((item, i) => (item?.separator ? [] : [i]));
    const at = order.indexOf(index);
    const keys = s.vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    let next: number | undefined;
    if (event.key === keys[0]) next = order[(at - 1 + order.length) % order.length];
    else if (event.key === keys[1]) next = order[(at + 1) % order.length];
    else if (event.key === 'Home') next = order[0];
    else if (event.key === 'End') next = order[order.length - 1];
    if (next === undefined) return;
    event.preventDefault();
    itemEls[next]?.focus();
  };

  const openIndex = createMemo(() => {
    const open = menu();
    return open && !open.closing ? open.index : -1;
  });
  const menuId = createMemo(() => menu()?.id ?? 0);

  const rootStyle = createMemo<JSX.CSSProperties>(() => {
    const g = geometry();
    const f = fit();
    const base = g.rawBase * f;
    const peak = g.rawPeak * f;
    const thickness = g.rawThickness * f;
    return {
      ...tokens(),
      '--dock-base': `${base}px`,
      '--dock-thickness': `${thickness}px`,
      '--dock-gap': `${g.rawGap * f}px`,
      '--dock-pad': `${(thickness - base) / 2}px`,
      '--dock-reach': `${peak - base}px`,
      '--dock-round': String(clamp(props.roundness ?? 0.5, 0, 1)),
      ...props.style
    } as JSX.CSSProperties;
  });

  return (
    <div
      ref={el => (rootEl = el)}
      class={['dock', `dock--${side()}`, { 'dock--bare': !(props.tiles ?? true) }, props.className]}
      role="toolbar"
      aria-label="Dock"
      aria-orientation={vertical() ? 'vertical' : 'horizontal'}
      data-hidden={startHidden ? '' : undefined}
      style={rootStyle()}
    >
      <For each={items()} keyed={false}>
        {(item, index) => (
          <Show when={!item()?.separator} fallback={<span class="dock-separator" aria-hidden="true" />}>
            {(() => {
              onCleanup(() => {
                itemEls[index] = null;
              });
              const hasMenu = () => Boolean(item().menu?.length);
              return (
                <button
                  ref={el => (itemEls[index] = el)}
                  type="button"
                  class={['dock-item', item().className]}
                  aria-label={item().label}
                  aria-haspopup={hasMenu() ? 'menu' : undefined}
                  aria-expanded={hasMenu() ? (openIndex() === index ? 'true' : 'false') : undefined}
                  data-open={openIndex() === index ? '' : undefined}
                  onPointerDown={event => {
                    skip = -1;
                    const open = menuNow;
                    if (open && !open.closing) {
                      if (event.button === 2 || event.ctrlKey) return;
                      skip = index;
                      closeMenu(false);
                      return;
                    }
                    if (item().menu?.length && event.button === 0 && !event.ctrlKey) startPress(event, index);
                  }}
                  onContextMenu={event => {
                    if (!item().menu?.length) return;
                    event.preventDefault();
                    endPress();
                    openMenu(index, 'pointer');
                  }}
                  onClick={() => {
                    if (skip === index) {
                      skip = -1;
                      return;
                    }
                    actions?.hop(index);
                    item().onClick?.();
                  }}
                  onFocus={event => {
                    if (event.currentTarget.matches(':focus-visible')) actions?.focus(index);
                  }}
                  onBlur={() => actions?.focus(-1)}
                  onKeyDown={event => onItemKeyDown(event, index)}
                >
                  <span class="dock-tile">
                    <span class="dock-face">{item().icon}</span>
                    <Show when={(props.showBadges ?? true) && hasBadge(item().badge)}>
                      <span class="dock-badge">{item().badge === true ? null : item().badge}</span>
                    </Show>
                  </span>
                  <Show when={(props.showIndicators ?? true) && item().active}>
                    <span class="dock-dot" aria-hidden="true" />
                  </Show>
                  <Show when={(props.showLabels ?? true) && item().label && !menu()}>
                    <span class="dock-label" aria-hidden="true">
                      {item().label}
                    </span>
                  </Show>
                </button>
              );
            })()}
          </Show>
        )}
      </For>
      <Show when={menuId()} keyed>
        {_id => (
          <DockMenu
            rows={menu()?.rows ?? items()[menu()?.index ?? -1]?.menu ?? []}
            label={items()[menu()?.index ?? -1]?.label}
            side={side()}
            point={menu()?.point}
            tokens={tokens()}
            focusFirst={menu()?.keyboard}
            closing={menu()?.closing}
            pressing={pressing}
            onSelect={(row, keyboard) => {
              closeMenu(keyboard || Boolean(menuNow?.keyboard));
              row.onClick?.();
            }}
            onDismiss={closeMenu}
            onExited={finishMenu}
          />
        )}
      </Show>
    </div>
  );
}
