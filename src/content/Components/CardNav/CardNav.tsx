import {
  For,
  Show,
  children,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onSettled,
  type Component
} from 'solid-js';
import { dynamic, type JSX, type ValidComponent } from '@solidjs/web';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import './CardNav.css';

export interface CardNavLink {
  label: string;
  href?: string;
  ariaLabel?: string;
}

export interface CardNavItem {
  label: string;
  description?: string;
  bgColor?: string;
  textColor?: string;
  links?: CardNavLink[];
}

export interface CardNavCta {
  label: string;
  href?: string;
  onClick?: (event: MouseEvent) => void;
}

export interface CardNavProps {
  logo?: string | JSX.Element;
  logoAlt?: string;
  logoHref?: string;
  items?: CardNavItem[];
  cta?: CardNavCta;
  theme?: 'dark' | 'light';
  surface?: 'glass' | 'solid';
  openOn?: 'click' | 'hover';
  cardEffect?: 'rise' | 'unfold' | 'fade';
  stagger?: number;
  bounce?: number;
  speed?: number;
  cardHeight?: number;
  maxWidth?: number;
  accentColor?: string;
  menuLabel?: boolean;
  intro?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  linkComponent?: ValidComponent;
  onLinkClick?: (link: CardNavLink, item: CardNavItem, event: MouseEvent) => void;
  ariaLabel?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

type IconData = readonly (readonly [string, Readonly<Record<string, string | number>>])[];

type Settings = {
  open: boolean;
  cardEffect: 'rise' | 'unfold' | 'fade';
  stagger: number;
  bounce: number;
  speed: number;
};

const THEMES: Record<string, Record<string, string>> = {
  dark: {
    '--cn-panel': 'rgba(36, 38, 42, 0.72)',
    '--cn-solid': '#24262a',
    '--cn-edge': 'rgba(255, 255, 255, 0.08)',
    '--cn-highlight': 'rgba(255, 255, 255, 0.07)',
    '--cn-shadow': '0 24px 48px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--cn-text': '#f2f4f7',
    '--cn-muted': 'rgba(242, 244, 247, 0.56)',
    '--cn-hover': 'rgba(255, 255, 255, 0.06)',
    '--cn-ring': 'rgba(242, 244, 247, 0.55)',
    '--cn-tile': 'linear-gradient(180deg, #313337 0%, #25272b 100%)',
    '--cn-tile-rim':
      'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 10px -4px rgba(0, 0, 0, 0.6)',
    '--cn-cta': 'linear-gradient(180deg, #ffffff 0%, #ebedf0 100%)',
    '--cn-cta-ink': '#090b0e',
    '--cn-cta-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 6px 16px -6px rgba(0, 0, 0, 0.6)',
    '--cn-cta-hover': 'brightness(0.94)'
  },
  light: {
    '--cn-panel': 'rgba(243, 244, 246, 0.84)',
    '--cn-solid': '#f3f4f6',
    '--cn-edge': 'rgba(22, 24, 27, 0.07)',
    '--cn-highlight': 'rgba(255, 255, 255, 0.95)',
    '--cn-shadow': '0 24px 48px -24px rgba(22, 24, 27, 0.3), 0 6px 16px -10px rgba(22, 24, 27, 0.16)',
    '--cn-text': '#11151b',
    '--cn-muted': 'rgba(22, 24, 27, 0.56)',
    '--cn-hover': 'rgba(22, 24, 27, 0.05)',
    '--cn-ring': 'rgba(22, 24, 27, 0.45)',
    '--cn-tile': 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
    '--cn-tile-rim':
      'inset 0 0 0 1px rgba(22, 24, 27, 0.07), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(22, 24, 27, 0.22)',
    '--cn-cta': 'linear-gradient(180deg, #2b2d31 0%, #11151b 100%)',
    '--cn-cta-ink': '#ffffff',
    '--cn-cta-shadow': 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 6px 14px -6px rgba(22, 24, 27, 0.45)',
    '--cn-cta-hover': 'brightness(1.25)'
  }
};

const ROOT = 'card-nav';
const PANEL = 'card-nav__panel';
const RIM = 'card-nav__rim';
const BAR = 'card-nav__bar';
const MENU = 'card-nav__menu';
const BURGER = 'card-nav__burger';
const LINE_TOP = 'card-nav__line card-nav__line--top';
const LINE_BOTTOM = 'card-nav__line card-nav__line--bottom';
const MENU_LABEL = 'card-nav__menu-label';
const WORD_OPEN = 'card-nav__word card-nav__word--open';
const WORD_CLOSE = 'card-nav__word card-nav__word--close';
const LOGO = 'card-nav__logo';
const CTA = 'card-nav__cta';
const CTA_WIDE = 'card-nav__cta card-nav__cta--wide';
const CONTENT = 'card-nav__content';
const CARDS = 'card-nav__cards';
const CARD = 'card-nav__card';
const CARD_HEAD = 'card-nav__card-head';
const LABEL = 'card-nav__label';
const DESCRIPTION = 'card-nav__description';
const LINKS = 'card-nav__links';
const LINK = 'card-nav__link';
const ARROW = 'card-nav__arrow';
const ARROW_OUT = 'card-nav__arrow-icon card-nav__arrow-icon--out';
const ARROW_IN = 'card-nav__arrow-icon card-nav__arrow-icon--in';

const DEFAULT_ITEMS: CardNavItem[] = [
  {
    label: 'About',
    description: 'The people and the story behind the studio.',
    links: [
      { label: 'Company', href: '#' },
      { label: 'Careers', href: '#' }
    ]
  },
  {
    label: 'Projects',
    description: 'Selected work from the last few years.',
    links: [
      { label: 'Featured', href: '#' },
      { label: 'Case studies', href: '#' }
    ]
  },
  {
    label: 'Contact',
    description: 'Say hello, we read everything.',
    links: [
      { label: 'Email', href: '#' },
      { label: 'X', href: '#' },
      { label: 'LinkedIn', href: '#' }
    ]
  }
];

const NARROW = 560;
const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const easeOut = (t: number) => 1 - (1 - t) ** 3;

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

const iconMarkup = (icon: IconData, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = String(name === 'stroke-width' ? strokeWidth : value);
          return `${name}="${next.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const ARROW_MARKUP = iconMarkup(ArrowUpRight01Icon as unknown as IconData, 2);

const Arrow = (props: { class: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class={props.class}
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    color="currentColor"
    innerHTML={ARROW_MARKUP}
  />
);

export default function CardNav(props: CardNavProps) {
  const contentId = createUniqueId();
  let rootEl: HTMLDivElement | undefined;
  let panelEl: HTMLElement | undefined;
  let contentEl: HTMLDivElement | undefined;
  let menuEl: HTMLButtonElement | undefined;
  let barEl: HTMLDivElement | undefined;
  let engine: { wake: () => void; refresh: () => void } | null = null;
  let leave = 0;
  let current!: Settings;

  const [openState, setOpenState] = createSignal(() => props.defaultOpen ?? false);
  const [narrow, setNarrow] = createSignal(false);
  const [shown, setShown] = createSignal(() => props.defaultOpen ?? false);

  const Link = dynamic(() => props.linkComponent ?? 'a') as unknown as Component<Record<string, unknown>>;
  const logo = children(() => props.logo as JSX.Element);

  const controlled = () => props.open !== undefined;
  const open = createMemo(() => (props.open !== undefined ? props.open : openState()));
  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const menuLabel = () => props.menuLabel ?? true;

  const settings = createMemo<Settings>(() => ({
    open: open(),
    cardEffect: props.cardEffect ?? 'rise',
    stagger: clamp(props.stagger ?? 0.12, 0, 0.3),
    bounce: clamp(props.bounce ?? 0.2, 0, 1),
    speed: clamp(props.speed ?? 1, 0.2, 3)
  }));

  const vars = createMemo(() => {
    const palette = THEMES[props.theme ?? 'dark'] ?? THEMES.dark;
    const surface = props.surface ?? 'glass';
    const next: Record<string, string> = {
      ...palette,
      '--cn-max': `${props.maxWidth ?? 800}px`,
      '--cn-bar': '60px',
      '--cn-inset': '8px',
      '--cn-gap': '8px',
      '--cn-radius': '18px',
      '--cn-logo': '24px',
      '--cn-card': `${props.cardHeight ?? 176}px`
    };
    if (surface === 'glass') next['--cn-blur'] = 'blur(20px) saturate(1.6)';
    if (surface === 'solid') {
      next['--cn-panel'] = palette['--cn-solid'];
      next['--cn-blur'] = 'none';
    }
    const accentColor = props.accentColor;
    if (accentColor) {
      next['--cn-cta'] = accentColor;
      next['--cn-cta-ink'] = contrastInk(accentColor) || '#ffffff';
      next['--cn-cta-shadow'] = 'inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 16px -6px rgba(0, 0, 0, 0.45)';
      next['--cn-cta-hover'] = 'brightness(1.08)';
    }
    return next;
  });

  const rootStyle = createMemo(() => ({ ...vars(), ...(props.style ?? {}) }) as JSX.CSSProperties);

  const setOpen = (next: boolean) => {
    if (next === open()) return;
    if (!controlled()) setOpenState(next);
    props.onOpenChange?.(next);
  };

  createEffect(settings, value => {
    current = value;
  });

  createEffect(open, () => {
    engine?.refresh();
    engine?.wake();
  });

  createEffect(
    () => [items(), narrow(), Boolean(props.cta), vars()],
    () => {
      engine?.refresh();
    }
  );

  createEffect(open, isOpen => {
    if (!isOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootEl?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      menuEl?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  onSettled(() => {
    const root = rootEl;
    const panel = panelEl;
    const content = contentEl;
    const bar = barEl;
    if (!root || !panel || !content || !bar) return;
    current = settings();

    const measure = () => setNarrow(root.offsetWidth < NARROW);
    measure();
    const sizeObserver = new ResizeObserver(measure);
    sizeObserver.observe(root);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const state = { p: current.open ? 1 : 0, v: 0, height: content.offsetHeight, bar: 60 };
    let raf = 0;
    let last = 0;

    const cardElements = () => {
      const [grid, ...rest] = Array.from(content.children) as HTMLElement[];
      return [...(grid ? (Array.from(grid.children) as HTMLElement[]) : []), ...rest];
    };

    const render = () => {
      const s = current;
      state.bar = parseFloat(getComputedStyle(panel).getPropertyValue('--cn-bar')) || 60;
      panel.style.height = `${state.bar + Math.max(0, state.p) * state.height}px`;
      const cards = cardElements();
      const count = cards.length;
      const lag = count > 1 ? Math.min(s.stagger, 0.7 / (count - 1)) : 0;
      const span = 1 - lag * (count - 1);
      cards.forEach((card, index) => {
        const local = clamp((state.p - index * lag) / Math.max(span, 0.05), 0, 1);
        const e = easeOut(local);
        if (s.cardEffect === 'unfold') {
          card.style.transform = `translateY(${(1 - e) * -10}px) rotateX(${(1 - e) * -72}deg)`;
          card.style.opacity = `${clamp(local * 1.8, 0, 1)}`;
          card.style.filter = '';
        } else if (s.cardEffect === 'fade') {
          card.style.transform = `translateY(${(1 - e) * 6}px)`;
          card.style.opacity = `${e}`;
          card.style.filter = e < 0.999 ? `blur(${(1 - e) * 6}px)` : '';
        } else {
          card.style.transform = `translateY(${(1 - e) * 26}px) scale(${0.97 + 0.03 * e})`;
          card.style.opacity = `${e}`;
          card.style.filter = '';
        }
      });
    };

    const tick = (now: number) => {
      raf = 0;
      const s = current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const target = s.open ? 1 : 0;
      if (target === 1) setShown(true);
      if (reduce) {
        state.p = target;
        state.v = 0;
      } else {
        const k = 160 * s.speed * s.speed;
        const zeta = s.open ? 1 - 0.68 * s.bounce : 1;
        const steps = Math.ceil(dt / (1 / 240));
        const h = dt / steps;
        for (let i = 0; i < steps; i++) {
          state.v += (-k * (state.p - target) - 2 * zeta * Math.sqrt(k) * state.v) * h;
          state.p += state.v * h;
        }
      }
      const done = Math.abs(state.p - target) < 0.0005 && Math.abs(state.v) < 0.002;
      if (done) {
        state.p = target;
        state.v = 0;
      }
      render();
      if (done && target === 0) setShown(false);
      if (!done) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    engine = {
      wake,
      refresh: () => {
        state.height = content.offsetHeight;
        render();
      }
    };

    render();
    const contentObserver = new ResizeObserver(() => {
      state.height = content.offsetHeight;
      render();
    });
    contentObserver.observe(content);

    if ((props.intro ?? true) && !reduce) {
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const radius = parseFloat(getComputedStyle(panel).borderTopLeftRadius) || 18;
      panel.animate(
        [
          { clipPath: `inset(0px ${Math.max(0, (width - height) / 2)}px round ${height / 2}px)`, opacity: 0 },
          { clipPath: `inset(0px 0px round ${radius}px)`, opacity: 1 }
        ],
        { duration: 820, easing: EASE_OUT, fill: 'backwards' }
      );
      Array.from(bar.children).forEach((child, index) => {
        child.animate(
          [
            { opacity: 0, transform: 'translateY(8px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ],
          { duration: 560, delay: 220 + index * 70, easing: EASE_OUT, fill: 'backwards' }
        );
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      contentObserver.disconnect();
      sizeObserver.disconnect();
      window.clearTimeout(leave);
      engine = null;
    };
  });

  const onPointerEnter = (event: PointerEvent) => {
    if (props.openOn !== 'hover' || event.pointerType === 'touch') return;
    window.clearTimeout(leave);
    setOpen(true);
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (props.openOn !== 'hover' || event.pointerType === 'touch') return;
    window.clearTimeout(leave);
    leave = window.setTimeout(() => setOpen(false), 160);
  };

  const Anchor = (anchor: {
    target: CardNavLink | CardNavCta;
    class: string;
    ariaLabel?: string;
    tabindex?: number;
    onClick: (event: MouseEvent) => void;
    children: JSX.Element;
  }) => (
    <Show
      when={anchor.target.href}
      fallback={
        <button
          type="button"
          class={anchor.class}
          aria-label={anchor.ariaLabel}
          tabindex={anchor.tabindex}
          onClick={event => anchor.onClick(event)}
        >
          {anchor.children}
        </button>
      }
    >
      {href => (
        <Link
          href={href()}
          class={anchor.class}
          aria-label={anchor.ariaLabel}
          tabindex={anchor.tabindex}
          onClick={(event: MouseEvent) => anchor.onClick(event)}
        >
          {anchor.children}
        </Link>
      )}
    </Show>
  );

  const CtaButton = (cta: { target: CardNavCta; wide: boolean }) => (
    <Anchor
      target={cta.target}
      class={cta.wide ? CTA_WIDE : CTA}
      tabindex={cta.wide && !open() ? -1 : undefined}
      onClick={event => {
        cta.target.onClick?.(event);
        if (cta.wide) setOpen(false);
      }}
    >
      {cta.target.label}
    </Anchor>
  );

  return (
    <div
      ref={el => (rootEl = el)}
      class={[ROOT, props.className]}
      data-open={open() ? '' : undefined}
      data-shown={shown() || open() ? '' : undefined}
      data-narrow={narrow() ? '' : undefined}
      style={rootStyle()}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <nav ref={el => (panelEl = el)} class={PANEL} aria-label={props.ariaLabel ?? 'Main'}>
        <div ref={el => (barEl = el)} class={BAR}>
          <button
            ref={el => (menuEl = el)}
            type="button"
            class={MENU}
            data-icon-only={menuLabel() ? undefined : ''}
            aria-expanded={open() ? 'true' : 'false'}
            aria-controls={contentId}
            aria-label={menuLabel() ? undefined : open() ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen(!open())}
          >
            <span class={BURGER} aria-hidden="true">
              <span class={LINE_TOP} />
              <span class={LINE_BOTTOM} />
            </span>
            <Show when={menuLabel()}>
              <span class={MENU_LABEL}>
                <span class={WORD_OPEN} aria-hidden={open() ? 'true' : 'false'}>
                  Menu
                </span>
                <span class={WORD_CLOSE} aria-hidden={open() ? 'false' : 'true'}>
                  Close
                </span>
              </span>
            </Show>
          </button>

          <Show when={logo()}>
            {resolved => (
              <Link href={props.logoHref ?? '#'} class={LOGO} aria-label={props.logoAlt ?? 'Logo'}>
                {typeof resolved() === 'string' ? (
                  <img src={resolved() as string} alt="" draggable="false" />
                ) : (
                  resolved()
                )}
              </Link>
            )}
          </Show>

          <Show when={props.cta && !narrow() ? props.cta : undefined}>
            {cta => <CtaButton target={cta()} wide={false} />}
          </Show>
        </div>

        <div ref={el => (contentEl = el)} id={contentId} class={CONTENT} aria-hidden={open() ? 'false' : 'true'}>
          <div class={CARDS}>
            <For each={items()} keyed={false}>
              {item => (
                <div
                  class={CARD}
                  data-tinted={item().bgColor ? '' : undefined}
                  style={item().bgColor ? { background: item().bgColor, color: item().textColor } : undefined}
                >
                  <div class={CARD_HEAD}>
                    <span class={LABEL}>{item().label}</span>
                    <Show when={item().description}>{description => <p class={DESCRIPTION}>{description()}</p>}</Show>
                  </div>
                  <ul class={LINKS}>
                    <For each={item().links ?? []} keyed={false}>
                      {link => (
                        <li>
                          <Anchor
                            target={link()}
                            class={LINK}
                            ariaLabel={link().ariaLabel}
                            tabindex={open() ? undefined : -1}
                            onClick={event => {
                              props.onLinkClick?.(link(), item(), event);
                              setOpen(false);
                            }}
                          >
                            <span class={ARROW} aria-hidden="true">
                              <Arrow class={ARROW_OUT} />
                              <Arrow class={ARROW_IN} />
                            </span>
                            {link().label}
                          </Anchor>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              )}
            </For>
          </div>
          <Show when={props.cta && narrow() ? props.cta : undefined}>
            {cta => (
              <div>
                <CtaButton target={cta()} wide />
              </div>
            )}
          </Show>
        </div>
        <span class={RIM} />
      </nav>
    </div>
  );
}
