import { For, Show, createEffect, createMemo, createSignal, onSettled, type Component } from 'solid-js';
import { dynamic, type JSX, type ValidComponent } from '@solidjs/web';
import './PillNav.css';

export interface PillNavItem {
  label: string;
  href?: string;
  icon?: JSX.Element | (() => JSX.Element);
  ariaLabel?: string;
}

export interface PillNavProps {
  logo?: string | JSX.Element;
  logoAlt?: string;
  logoHref?: string;
  items?: PillNavItem[];
  activeHref?: string;
  defaultActiveIndex?: number;
  onItemClick?: (item: PillNavItem, index: number, event: MouseEvent) => void;
  linkComponent?: ValidComponent;
  theme?: 'dark' | 'light';
  layout?: 'split' | 'joined';
  size?: 'sm' | 'md' | 'lg';
  surface?: 'glass' | 'solid' | 'none';
  itemStyle?: 'pill' | 'plain';
  hoverEffect?: 'fill' | 'glide' | 'none';
  indicator?: 'dot' | 'pill' | 'none';
  highlightColor?: string;
  highlightTextColor?: string;
  barColor?: string;
  textColor?: string;
  bounce?: number;
  stretch?: number;
  intro?: boolean;
  collapse?: 'auto' | 'always' | 'never';
  onMenuToggle?: (open: boolean) => void;
  ariaLabel?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

interface LinkProps {
  class: string;
  'aria-current'?: 'page' | 'false';
  'aria-label'?: string;
  tabindex?: number;
  onClick?: (event: MouseEvent) => void;
}

interface Engine {
  enter: (index: number, event?: PointerEvent) => void;
  leave: () => void;
  focus: (index: number, event?: FocusEvent) => void;
  blur: () => void;
  press: (event?: PointerEvent) => void;
  release: () => void;
  refresh: () => void;
}

interface Settings {
  hoverEffect: 'fill' | 'glide' | 'none';
  indicator: 'dot' | 'pill' | 'none';
  activeIndex: number;
  bounce: number;
  stretch: number;
}

interface Layout {
  collapse: 'auto' | 'always' | 'never';
  joined: boolean;
  hasLogo: boolean;
  size: string;
}

const THEMES: Record<string, Record<string, string>> = {
  dark: {
    '--pn-surface': 'rgba(36, 38, 42, 0.66)',
    '--pn-solid': '#24262a',
    '--pn-edge': 'rgba(255, 255, 255, 0.08)',
    '--pn-rim': 'rgba(255, 255, 255, 0.07)',
    '--pn-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--pn-text': 'rgba(244, 244, 245, 0.64)',
    '--pn-strong': '#f4f4f5',
    '--pn-pill': 'linear-gradient(180deg, #ffffff 0%, #eceef1 100%)',
    '--pn-pill-ink': '#090b0e',
    '--pn-pill-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 16px -6px rgba(0, 0, 0, 0.6)',
    '--pn-dot': '#f4f4f5',
    '--pn-ring': 'rgba(244, 244, 245, 0.55)',
    '--pn-row-hover': 'rgba(255, 255, 255, 0.06)',
    '--pn-tile': 'linear-gradient(180deg, #373a40 0%, #25282c 100%)',
    '--pn-tile-rim':
      'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)'
  },
  light: {
    '--pn-surface': 'rgba(240, 241, 243, 0.8)',
    '--pn-solid': '#f0f1f3',
    '--pn-edge': 'rgba(24, 24, 27, 0.07)',
    '--pn-rim': 'rgba(255, 255, 255, 0.95)',
    '--pn-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--pn-text': 'rgba(24, 24, 27, 0.6)',
    '--pn-strong': '#18181b',
    '--pn-pill': 'linear-gradient(180deg, #2b2d31 0%, #18181b 100%)',
    '--pn-pill-ink': '#ffffff',
    '--pn-pill-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 6px 14px -6px rgba(24, 24, 27, 0.45)',
    '--pn-dot': '#18181b',
    '--pn-ring': 'rgba(24, 24, 27, 0.45)',
    '--pn-row-hover': 'rgba(24, 24, 27, 0.05)',
    '--pn-tile': 'linear-gradient(180deg, #ffffff 0%, #f5f6f8 100%)',
    '--pn-tile-rim':
      'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)'
  }
};

const SIZES: Record<string, Record<string, string>> = {
  sm: {
    '--pn-h': '36px',
    '--pn-pad': '3px',
    '--pn-inner': '30px',
    '--pn-x': '12px',
    '--pn-font': '13px',
    '--pn-gap': '6px',
    '--pn-mark': '18px'
  },
  md: {
    '--pn-h': '44px',
    '--pn-pad': '4px',
    '--pn-inner': '36px',
    '--pn-x': '16px',
    '--pn-font': '14px',
    '--pn-gap': '8px',
    '--pn-mark': '22px'
  },
  lg: {
    '--pn-h': '52px',
    '--pn-pad': '5px',
    '--pn-inner': '42px',
    '--pn-x': '20px',
    '--pn-font': '15px',
    '--pn-gap': '10px',
    '--pn-mark': '26px'
  }
};

const ROOT = 'pill-nav';
const SURFACE = 'pill-nav__surface';
const RIM = 'pill-nav__rim';
const ROOT_RIM = 'pill-nav__rim pill-nav__rim--root';
const LOGO = 'pill-nav__logo';
const LOGO_LINK = 'pill-nav__logo-link';
const MARK = 'pill-nav__mark';
const BAR = 'pill-nav__bar';
const TRACK = 'pill-nav__track';
const LIST = 'pill-nav__list';
const SLOT = 'pill-nav__slot';
const ITEM = 'pill-nav__item';
const FACE = 'pill-nav__face';
const FACE_ALT = 'pill-nav__face-alt';
const FILL = 'pill-nav__fill';
const GLIDE = 'pill-nav__glide';
const INK = 'pill-nav__ink';
const INK_ITEM = 'pill-nav__ink-item';
const DOT = 'pill-nav__dot';
const TOGGLE = 'pill-nav__toggle';
const TOGGLE_BARE = 'pill-nav__toggle--bare';
const BURGER = 'pill-nav__burger';
const LINE_TOP = 'pill-nav__line pill-nav__line--top';
const LINE_BOTTOM = 'pill-nav__line pill-nav__line--bottom';
const PANEL = 'pill-nav__panel';
const MENU = 'pill-nav__menu';
const ROW = 'pill-nav__row';
const MEASURE = 'pill-nav__measure';

const DEFAULT_ITEMS: PillNavItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' }
];

const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

let panelCount = 0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const contrastInk = (color?: string): string | null => {
  const hex = String(color || '')
    .trim()
    .replace('#', '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map(c => c + c)
          .join('')
      : hex;
  const channel = (index: number) => {
    const value = parseInt(full.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.36 ? '#090b0e' : '#ffffff';
};

const readVar = (element: Element, name: string) => parseFloat(getComputedStyle(element).getPropertyValue(name)) || 0;

const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const renderIcon = (icon: PillNavItem['icon']) => (typeof icon === 'function' ? icon() : icon);

export default function PillNav(props: PillNavProps) {
  const LinkTag = dynamic(() => props.linkComponent ?? 'a') as unknown as Component<Record<string, unknown>>;
  const panelId = `pill-nav-panel-${++panelCount}`;
  let rootEl: HTMLElement | undefined;
  let barEl: HTMLDivElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  let glideEl: HTMLSpanElement | undefined;
  let inkEl: HTMLDivElement | undefined;
  let dotEl: HTMLSpanElement | undefined;
  let logoEl: HTMLSpanElement | undefined;
  let markEl: HTMLSpanElement | undefined;
  let toggleEl: HTMLButtonElement | undefined;
  let panelEl: HTMLDivElement | undefined;
  let measureEl: HTMLDivElement | undefined;
  let measureListEl: HTMLDivElement | undefined;
  let engine: Engine | null = null;
  let stopEngine: (() => void) | null = null;
  let mounted = false;
  let introLeft = true;
  let slide = false;
  let pending: boolean | null = null;
  let isCollapsed = false;
  let isOpen = false;
  let engineCollapsed = false;
  let engineCount = 0;
  let current!: Settings;
  let lay!: Layout;

  const [selected, setSelected] = createSignal(() => props.defaultActiveIndex ?? 0);
  const [collapsed, setCollapsed] = createSignal(() => props.collapse === 'always');
  const [open, setOpen] = createSignal(false);
  const [panelShown, setPanelShown] = createSignal(false);

  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const controlled = () => props.activeHref !== undefined;
  const activeIndex = createMemo(() =>
    controlled() ? items().findIndex(item => item.href === props.activeHref) : selected()
  );
  const layout = () => props.layout ?? 'split';
  const joined = createMemo(() => layout() === 'joined');
  const hasLogo = createMemo(() => Boolean(props.logo));
  const hoverEffect = () => props.hoverEffect ?? 'fill';
  const indicator = () => props.indicator ?? 'dot';
  const fill = createMemo(() => hoverEffect() === 'fill');
  const glide = createMemo(() => !fill() && (hoverEffect() === 'glide' || indicator() === 'pill'));

  const settings = createMemo<Settings>(() => ({
    hoverEffect: hoverEffect(),
    indicator: indicator(),
    activeIndex: activeIndex(),
    bounce: clamp(props.bounce ?? 0.3, 0, 1),
    stretch: clamp(props.stretch ?? 0.5, 0, 1)
  }));

  const layoutSettings = createMemo<Layout>(() => ({
    collapse: props.collapse ?? 'auto',
    joined: joined(),
    hasLogo: hasLogo(),
    size: props.size ?? 'md'
  }));

  const style = createMemo(() => {
    const theme = props.theme ?? 'dark';
    const surface = props.surface ?? 'glass';
    const palette = THEMES[theme] ?? THEMES.dark;
    const vars: Record<string, string> = { ...palette, ...(SIZES[props.size ?? 'md'] ?? SIZES.md) };
    if (surface === 'glass') vars['--pn-blur'] = 'blur(20px) saturate(1.6)';
    if (surface === 'solid') {
      vars['--pn-surface'] = palette['--pn-solid'];
      vars['--pn-blur'] = 'none';
    }
    if (surface === 'none') {
      vars['--pn-surface'] = 'transparent';
      vars['--pn-shadow'] = 'none';
      vars['--pn-blur'] = 'none';
      vars['--pn-edge'] = 'transparent';
      vars['--pn-rim'] = 'transparent';
    }
    if (props.barColor) {
      vars['--pn-surface'] = props.barColor;
      vars['--pn-solid'] = props.barColor;
    }
    if (props.textColor) {
      vars['--pn-strong'] = props.textColor;
      vars['--pn-text'] = `color-mix(in srgb, ${props.textColor} 64%, transparent)`;
    }
    if (props.highlightColor) {
      vars['--pn-pill'] = props.highlightColor;
      vars['--pn-dot'] = props.highlightColor;
      vars['--pn-pill-shadow'] = 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -6px rgba(0, 0, 0, 0.45)';
      vars['--pn-pill-ink'] = props.highlightTextColor || contrastInk(props.highlightColor) || palette['--pn-pill-ink'];
    } else if (props.highlightTextColor) {
      vars['--pn-pill-ink'] = props.highlightTextColor;
    }
    return { ...vars, ...props.style } as JSX.CSSProperties;
  });

  const getSlots = (): HTMLLIElement[] =>
    trackEl?.isConnected ? Array.from(trackEl.querySelectorAll<HTMLLIElement>(`.${SLOT}`)) : [];

  const startEngine = () => {
    stopEngine?.();
    stopEngine = null;
    engine = null;
    const root = rootEl;
    if (!root) return;
    const reduce = prefersReduced();
    const state = {
      x0: 0,
      x1: 0,
      v0: 0,
      v1: 0,
      alpha: 0,
      pop: 1,
      press: 1,
      pressVelocity: 0,
      dotX: 0,
      dotVelocity: 0,
      dotAlpha: 0,
      hover: -1,
      focus: false,
      sliding: false,
      pressing: false,
      waiting: slide && !reduce
    };
    slide = false;
    const rects: { left: number; width: number }[] = [];
    let trackWidth = 0;
    let trackHeight = 0;
    let raf = 0;
    let last = 0;

    const measure = () => {
      const track = trackEl;
      if (!track || !track.isConnected) return;
      trackWidth = track.offsetWidth;
      trackHeight = track.offsetHeight;
      getSlots().forEach((slot, index) => {
        rects[index] = { left: slot.offsetLeft, width: slot.offsetWidth };
        const reach = Math.ceil(2 * Math.sqrt((slot.offsetWidth / 2) ** 2 + slot.offsetHeight ** 2)) + 2;
        slot.style.setProperty('--pn-fill', `${reach}px`);
      });
    };

    const glideIndex = () => {
      const s = current;
      if (s.hoverEffect === 'fill') return -1;
      if (s.hoverEffect === 'glide' && state.hover >= 0) return state.hover;
      return s.indicator === 'pill' ? s.activeIndex : -1;
    };

    const sync = () => {
      const s = current;
      getSlots().forEach((slot, index) => {
        const hovered = state.hover === index;
        slot.toggleAttribute('data-lit', hovered);
        slot.toggleAttribute('data-hover', hovered && s.hoverEffect === 'fill');
      });
      root.toggleAttribute('data-focus', state.focus && state.hover >= 0);
      root.toggleAttribute(
        'data-dot-lit',
        s.hoverEffect === 'fill' && state.hover >= 0 && state.hover === s.activeIndex
      );
    };

    const render = () => {
      const width = Math.max(0, state.x1 - state.x0);
      const scale = state.press * state.pop;
      const target = rects[glideIndex()];
      const squash = target ? 1 - clamp((width / Math.max(target.width, 1) - 1) * 0.3, 0, 0.14) : 1;
      if (glideEl) {
        glideEl.style.width = `${width}px`;
        glideEl.style.transform = `translate3d(${state.x0}px, 0, 0) scale(${scale}, ${scale * squash})`;
        glideEl.style.opacity = `${state.alpha}`;
      }
      if (inkEl) {
        const half = (width * scale) / 2;
        const center = (state.x0 + state.x1) / 2;
        const inset = (trackHeight * (1 - scale * squash)) / 2;
        inkEl.style.clipPath = `inset(${inset}px ${trackWidth - center - half}px ${inset}px ${center - half}px round ${trackHeight / 2}px)`;
        inkEl.style.opacity = `${state.alpha}`;
      }
      if (dotEl) {
        const pull = clamp(Math.abs(state.dotVelocity) / 700, 0, 2.2);
        dotEl.style.transform = `translate3d(${state.dotX}px, 0, 0) scaleX(${1 + pull})`;
        dotEl.style.opacity = `${state.dotAlpha}`;
      }
    };

    const tick = (now: number) => {
      raf = 0;
      const s = current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const index = glideIndex();
      const target = rects[index];
      const zeta = 1 - 0.55 * s.bounce;
      const base = 520;
      let busy = false;

      if (target && !state.waiting) {
        const t0 = target.left;
        const t1 = target.left + target.width;
        if (state.alpha < 0.02 && !state.sliding) {
          state.x0 = t0;
          state.x1 = t1;
          state.v0 = 0;
          state.v1 = 0;
          state.pop = 0.9;
        }
        if (reduce) {
          state.x0 = t0;
          state.x1 = t1;
          state.v0 = 0;
          state.v1 = 0;
        } else {
          const direction = Math.sign((t0 + t1) / 2 - (state.x0 + state.x1) / 2);
          const lead = base * (1 + 0.9 * s.stretch);
          const trail = base * (1 - 0.5 * s.stretch);
          const k0 = direction < 0 ? lead : direction > 0 ? trail : base;
          const k1 = direction > 0 ? lead : direction < 0 ? trail : base;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.v0 += (-k0 * (state.x0 - t0) - 2 * zeta * Math.sqrt(k0) * state.v0) * h;
            state.x0 += state.v0 * h;
            state.v1 += (-k1 * (state.x1 - t1) - 2 * zeta * Math.sqrt(k1) * state.v1) * h;
            state.x1 += state.v1 * h;
          }
        }
        state.alpha += (1 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.06));
        busy =
          Math.abs(state.x0 - t0) > 0.05 ||
          Math.abs(state.x1 - t1) > 0.05 ||
          Math.abs(state.v0) > 0.5 ||
          Math.abs(state.v1) > 0.5 ||
          state.alpha < 0.999;
        if (!busy) state.sliding = false;
      } else {
        state.alpha += (0 - state.alpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.07));
        if (state.alpha > 0.002) busy = true;
        else state.alpha = 0;
      }

      state.pop += (1 - state.pop) * (reduce ? 1 : 1 - Math.exp(-dt / 0.09));
      if (Math.abs(1 - state.pop) > 0.001) busy = true;

      const pressTarget = state.pressing ? 0.95 : 1;
      if (reduce) {
        state.press = pressTarget;
        state.pressVelocity = 0;
      } else {
        state.pressVelocity += (-700 * (state.press - pressTarget) - 30 * state.pressVelocity) * dt;
        state.press += state.pressVelocity * dt;
      }
      if (Math.abs(state.press - pressTarget) > 0.0005 || Math.abs(state.pressVelocity) > 0.01) busy = true;

      const dotTarget = s.indicator === 'dot' ? rects[s.activeIndex] : null;
      if (dotTarget && !state.waiting) {
        const center = dotTarget.left + dotTarget.width / 2;
        if (state.dotAlpha < 0.02) {
          state.dotX = center;
          state.dotVelocity = 0;
        }
        if (reduce) {
          state.dotX = center;
          state.dotVelocity = 0;
        } else {
          const k = 360;
          const steps = Math.ceil(dt / (1 / 240));
          const h = dt / steps;
          for (let i = 0; i < steps; i++) {
            state.dotVelocity +=
              (-k * (state.dotX - center) - 2 * (1 - 0.5 * s.bounce) * Math.sqrt(k) * state.dotVelocity) * h;
            state.dotX += state.dotVelocity * h;
          }
        }
        state.dotAlpha += (1 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (Math.abs(state.dotX - center) > 0.05 || Math.abs(state.dotVelocity) > 0.5 || state.dotAlpha < 0.999)
          busy = true;
      } else {
        state.dotAlpha += (0 - state.dotAlpha) * (reduce ? 1 : 1 - Math.exp(-dt / 0.1));
        if (state.dotAlpha > 0.002) busy = true;
        else state.dotAlpha = 0;
      }

      render();
      if (busy) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const next: Engine = {
      enter: (index, event) => {
        if (event?.pointerType === 'touch') return;
        state.hover = index;
        state.focus = false;
        sync();
        wake();
      },
      leave: () => {
        if (state.focus) return;
        state.hover = -1;
        sync();
        wake();
      },
      focus: (index, event) => {
        const target = event?.target;
        const visible = target instanceof Element && target.matches(':focus-visible');
        state.focus = visible;
        state.hover = visible ? index : state.hover;
        sync();
        wake();
      },
      blur: () => {
        if (!state.focus) return;
        state.focus = false;
        state.hover = -1;
        sync();
        wake();
      },
      press: event => {
        if (event && event.button > 0) return;
        state.pressing = true;
        wake();
      },
      release: () => {
        if (!state.pressing) return;
        state.pressing = false;
        wake();
      },
      refresh: () => {
        measure();
        sync();
        wake();
      }
    };
    engine = next;

    measure();
    sync();
    render();
    wake();

    let timer = 0;
    if (state.waiting) {
      state.x0 = 0;
      state.x1 = 0;
      timer = window.setTimeout(() => {
        state.waiting = false;
        if (glideIndex() >= 0) {
          state.alpha = 1;
          state.sliding = true;
        }
        wake();
      }, 420);
    }

    const resizeObserver = new ResizeObserver(() => {
      measure();
      render();
      wake();
    });
    if (trackEl?.isConnected) resizeObserver.observe(trackEl);
    let alive = true;
    document.fonts?.ready
      ?.then(() => {
        if (alive) next.refresh();
      })
      .catch(() => {});
    window.addEventListener('pointerup', next.release);
    window.addEventListener('pointercancel', next.release);

    stopEngine = () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('pointerup', next.release);
      window.removeEventListener('pointercancel', next.release);
      if (engine === next) engine = null;
    };
  };

  const commitCollapsed = (next: boolean) => {
    isCollapsed = next;
    setCollapsed(next);
  };

  const commitOpen = (next: boolean) => {
    isOpen = next;
    setOpen(next);
  };

  const evaluate = () => {
    const root = rootEl;
    if (!root || !measureEl) return;
    const { collapse, joined: isJoined, hasLogo: withLogo } = lay;
    if (collapse === 'always' || collapse === 'never') {
      commitCollapsed(collapse === 'always');
      return;
    }
    const parent = root.parentElement;
    if (!parent) return;
    const styles = getComputedStyle(parent);
    const available =
      parent.clientWidth - (parseFloat(styles.paddingLeft) || 0) - (parseFloat(styles.paddingRight) || 0);
    const listWidth = measureListEl?.offsetWidth ?? 0;
    const height = readVar(root, '--pn-h');
    const pad = readVar(root, '--pn-pad');
    const gap = readVar(root, '--pn-gap');
    const inner = readVar(root, '--pn-inner');
    const need = isJoined
      ? pad * 2 + (withLogo ? inner + 2 : 0) + listWidth
      : (withLogo ? height + gap : 0) + listWidth + pad * 2;
    const next = need > available + 0.5;
    if (introLeft && next !== isCollapsed) pending = next;
    commitCollapsed(next);
  };

  const runIntro = (isNowCollapsed: boolean) => {
    const root = rootEl;
    if (!root || !introLeft) return;
    if (pending !== null && pending !== isNowCollapsed) return;
    pending = null;
    introLeft = false;
    if (prefersReduced()) return;
    const pop = (element: HTMLElement | undefined, delay: number) =>
      element?.animate(
        [
          { opacity: 0, transform: 'scale(0.6)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        { duration: 700, delay, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' }
      );
    const reveal = (element: HTMLElement | undefined) => {
      if (!element) return;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      element.animate(
        [
          { clipPath: `inset(0px ${Math.max(0, width - height)}px 0px 0px round ${height / 2}px)` },
          { clipPath: `inset(0px 0px 0px 0px round ${height / 2}px)` }
        ],
        { duration: 760, delay: 90, easing: EASE_OUT, fill: 'backwards' }
      );
    };
    pop(logoEl?.isConnected ? logoEl : undefined, 0);
    if (isNowCollapsed) {
      pop(toggleEl?.isConnected ? toggleEl : undefined, 120);
      return;
    }
    slide = true;
    reveal(lay.joined ? root : barEl);
    getSlots().forEach((slot, index) => {
      slot.animate(
        [
          { opacity: 0, transform: 'translateX(-10px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        { duration: 560, delay: 200 + index * 50, easing: EASE_OUT, fill: 'backwards' }
      );
    });
  };

  createEffect(
    () => ({
      settings: settings(),
      items: items(),
      size: props.size,
      layout: layout(),
      itemStyle: props.itemStyle,
      surface: props.surface,
      glide: glide()
    }),
    value => {
      current = value.settings;
      engine?.refresh();
    }
  );

  createEffect(layoutSettings, value => {
    lay = value;
    if (mounted) queueMicrotask(evaluate);
  });

  createEffect(
    () => ({ collapsed: collapsed(), count: items().length }),
    value => {
      if (!mounted) return;
      const changed = value.collapsed !== engineCollapsed || value.count !== engineCount;
      if (!changed) return;
      const flipped = value.collapsed !== engineCollapsed;
      engineCollapsed = value.collapsed;
      engineCount = value.count;
      isCollapsed = value.collapsed;
      if (flipped) {
        queueMicrotask(() => {
          evaluate();
          runIntro(value.collapsed);
        });
      }
      startEngine();
      if (!value.collapsed && isOpen) {
        commitOpen(false);
        setPanelShown(false);
      }
    },
    { defer: true }
  );

  createEffect(
    () => ({ open: open(), shown: panelShown(), joined: joined() }),
    value => {
      const panel = panelEl;
      const root = rootEl;
      if (!value.shown || !panel || !panel.isConnected || !root) return;
      const reduce = prefersReduced();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const header = value.joined ? root.offsetHeight : (toggleEl?.offsetHeight ?? 44);
      const start = value.joined
        ? `inset(0px 0px ${Math.max(0, height - header)}px 0px round ${header / 2}px)`
        : `inset(0px 0px ${Math.max(0, height - header)}px ${Math.max(0, width - header)}px round ${header / 2}px)`;
      const end = 'inset(0px 0px 0px 0px round 24px)';
      const rows = panel.querySelectorAll('li');
      const running: Animation[] = [];
      if (value.open) {
        if (reduce) return;
        running.push(panel.animate([{ clipPath: start }, { clipPath: end }], { duration: 560, easing: EASE_OUT }));
        rows.forEach((row, index) => {
          running.push(
            row.animate(
              [
                { opacity: 0, transform: 'translateY(-8px)' },
                { opacity: 1, transform: 'translateY(0)' }
              ],
              { duration: 420, delay: 90 + index * 40, easing: EASE_OUT, fill: 'backwards' }
            )
          );
        });
      } else {
        if (reduce) {
          setPanelShown(false);
          return;
        }
        const morph = panel.animate([{ clipPath: end }, { clipPath: start }], {
          duration: 380,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          fill: 'forwards'
        });
        morph.onfinish = () => setPanelShown(false);
        running.push(morph);
        rows.forEach(row => {
          running.push(row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
        });
      }
      return () => {
        running.forEach(animation => {
          animation.onfinish = null;
          animation.cancel();
        });
      };
    }
  );

  createEffect(open, value => {
    if (!value) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootEl?.contains(target)) return;
      commitOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      commitOpen(false);
      toggleEl?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  onSettled(() => {
    current = settings();
    lay = layoutSettings();
    introLeft = props.intro ?? true;
    isCollapsed = collapsed();
    engineCollapsed = isCollapsed;
    engineCount = items().length;
    mounted = true;
    const initial = isCollapsed;
    evaluate();
    runIntro(initial);
    startEngine();
    const root = rootEl;
    const observer = new ResizeObserver(() => evaluate());
    if (root?.parentElement) observer.observe(root.parentElement);
    if (measureEl) observer.observe(measureEl);
    return () => {
      mounted = false;
      observer.disconnect();
      stopEngine?.();
      stopEngine = null;
    };
  });

  const spin = (event: PointerEvent) => {
    const mark = markEl;
    if (!mark || event.pointerType === 'touch' || mark.getAnimations().length) return;
    if (prefersReduced()) return;
    mark.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
      duration: 900,
      easing: 'cubic-bezier(0.65, 0, 0.25, 1)'
    });
  };

  const choose = (item: PillNavItem, index: number, event: MouseEvent) => {
    props.onItemClick?.(item, index, event);
    if (!controlled()) setSelected(index);
  };

  const toggle = () => {
    const next = !isOpen;
    if (next) setPanelShown(true);
    commitOpen(next);
    props.onMenuToggle?.(next);
  };

  const link = (item: PillNavItem, linkProps: LinkProps, children: () => JSX.Element) => {
    if (!item.href) {
      return (
        <button type="button" {...linkProps}>
          {children()}
        </button>
      );
    }
    return (
      <LinkTag href={item.href} {...linkProps}>
        {children()}
      </LinkTag>
    );
  };

  const face = (item: PillNavItem) => (
    <>
      {renderIcon(item.icon)}
      {item.label}
    </>
  );

  return (
    <nav
      ref={el => (rootEl = el)}
      class={[ROOT, { [SURFACE]: joined() }, props.className]}
      data-layout={layout()}
      data-items={props.itemStyle ?? 'pill'}
      data-collapsed={collapsed() ? '' : undefined}
      data-open={open() ? '' : undefined}
      data-panel={panelShown() ? '' : undefined}
      style={style()}
      aria-label={props.ariaLabel ?? 'Main'}
    >
      <Show when={props.logo}>
        <span ref={el => (logoEl = el)} class={[LOGO, { [SURFACE]: !joined() }]}>
          <LinkTag
            href={props.logoHref ?? '#'}
            class={LOGO_LINK}
            aria-label={props.logoAlt ?? 'Logo'}
            onPointerEnter={spin}
          >
            <span ref={el => (markEl = el)} class={MARK}>
              {typeof props.logo === 'string' ? <img src={props.logo} alt="" draggable="false" /> : props.logo}
            </span>
          </LinkTag>
          <Show when={!joined()}>
            <span class={RIM} />
          </Show>
        </span>
      </Show>

      <Show when={!collapsed()}>
        <div ref={el => (barEl = el)} class={[BAR, { [SURFACE]: !joined() }]}>
          <div ref={el => (trackEl = el)} class={TRACK} onPointerLeave={() => engine?.leave()}>
            <ul class={LIST}>
              <For each={items()}>
                {(item, index) => (
                  <li
                    class={SLOT}
                    data-on={fill() && indicator() === 'pill' && index() === activeIndex() ? '' : undefined}
                    onPointerEnter={event => engine?.enter(index(), event)}
                    onPointerDown={event => engine?.press(event)}
                    onFocusIn={event => engine?.focus(index(), event)}
                    onFocusOut={() => engine?.blur()}
                  >
                    {link(
                      item,
                      {
                        class: ITEM,
                        get 'aria-current'() {
                          return index() === activeIndex() ? ('page' as const) : ('false' as const);
                        },
                        'aria-label': item.ariaLabel,
                        onClick: event => choose(item, index(), event)
                      },
                      () => (
                        <>
                          <Show when={fill()}>
                            <span class={FILL} aria-hidden="true" />
                          </Show>
                          <span class={FACE}>{face(item)}</span>
                          <Show when={fill()}>
                            <span class={FACE_ALT} aria-hidden="true">
                              {face(item)}
                            </span>
                          </Show>
                        </>
                      )
                    )}
                  </li>
                )}
              </For>
            </ul>
            <Show when={glide()}>
              <span ref={el => (glideEl = el)} class={GLIDE} aria-hidden="true" />
            </Show>
            <Show when={glide()}>
              <div ref={el => (inkEl = el)} class={INK} aria-hidden="true">
                <For each={items()}>{item => <span class={INK_ITEM}>{face(item)}</span>}</For>
              </div>
            </Show>
            <Show when={indicator() === 'dot'}>
              <span ref={el => (dotEl = el)} class={DOT} aria-hidden="true" />
            </Show>
          </div>
          <Show when={!joined()}>
            <span class={RIM} />
          </Show>
        </div>
      </Show>

      <Show when={collapsed()}>
        <button
          ref={el => (toggleEl = el)}
          type="button"
          class={[TOGGLE, joined() ? TOGGLE_BARE : SURFACE]}
          aria-expanded={open() ? 'true' : 'false'}
          aria-controls={panelId}
          aria-label={open() ? 'Close menu' : 'Open menu'}
          onClick={toggle}
        >
          <span class={BURGER} aria-hidden="true">
            <span class={LINE_TOP} />
            <span class={LINE_BOTTOM} />
          </span>
          <Show when={!joined()}>
            <span class={RIM} />
          </Show>
        </button>
      </Show>

      <Show when={collapsed() && panelShown()}>
        <div ref={el => (panelEl = el)} id={panelId} class={[PANEL, SURFACE]}>
          <ul class={MENU}>
            <For each={items()}>
              {(item, index) => (
                <li>
                  {link(
                    item,
                    {
                      class: ROW,
                      get 'aria-current'() {
                        return index() === activeIndex() ? ('page' as const) : ('false' as const);
                      },
                      get tabindex() {
                        return open() ? undefined : -1;
                      },
                      onClick: event => {
                        choose(item, index(), event);
                        commitOpen(false);
                        props.onMenuToggle?.(false);
                      }
                    },
                    () => face(item)
                  )}
                </li>
              )}
            </For>
          </ul>
          <span class={RIM} />
        </div>
      </Show>

      <div ref={el => (measureEl = el)} class={MEASURE} aria-hidden="true">
        <div ref={el => (measureListEl = el)} class={LIST}>
          <For each={items()}>{item => <span class={INK_ITEM}>{face(item)}</span>}</For>
        </div>
      </div>

      <Show when={joined()}>
        <span class={ROOT_RIM} />
      </Show>
    </nav>
  );
}
