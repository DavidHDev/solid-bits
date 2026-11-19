import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { gsap } from 'gsap';

import './BubbleMenu.css';

type MenuItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  rotation?: number;
  hoverStyles?: {
    bgColor?: string;
    textColor?: string;
  };
};

export type BubbleMenuProps = {
  logo: JSX.Element | string;
  onMenuClick?: (open: boolean) => void;
  className?: string;
  style?: JSX.CSSProperties;
  menuAriaLabel?: string;
  menuBg?: string;
  menuContentColor?: string;
  useFixedPosition?: boolean;
  items?: MenuItem[];
  animationEase?: string;
  animationDuration?: number;
  staggerDelay?: number;
};

const DEFAULT_ITEMS: MenuItem[] = [
  {
    label: 'home',
    href: '#',
    ariaLabel: 'Home',
    rotation: -8,
    hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
  },
  {
    label: 'about',
    href: '#',
    ariaLabel: 'About',
    rotation: 8,
    hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' }
  },
  {
    label: 'projects',
    href: '#',
    ariaLabel: 'Documentation',
    rotation: 8,
    hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' }
  },
  {
    label: 'blog',
    href: '#',
    ariaLabel: 'Blog',
    rotation: 8,
    hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' }
  },
  {
    label: 'contact',
    href: '#',
    ariaLabel: 'Contact',
    rotation: -8,
    hoverStyles: { bgColor: '#0aa0ef', textColor: '#ffffff' }
  }
];

export default function BubbleMenu(props: BubbleMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = createSignal(false);
  const [showOverlay, setShowOverlay] = createSignal(false);

  let overlayEl: HTMLDivElement | undefined;
  let open = false;

  const menuBg = () => props.menuBg ?? '#fff';
  const menuContentColor = () => props.menuContentColor ?? '#111';
  const position = () => (props.useFixedPosition ? 'fixed' : 'absolute');
  const menuItems = createMemo(() => (props.items?.length ? props.items : DEFAULT_ITEMS));

  const parts = () => {
    const overlay = overlayEl?.isConnected ? overlayEl : undefined;
    const bubbles = overlay ? Array.from(overlay.querySelectorAll<HTMLAnchorElement>('.pill-link')) : [];
    const labels = overlay ? Array.from(overlay.querySelectorAll<HTMLSpanElement>('.pill-label')) : [];
    return { overlay, bubbles, labels };
  };

  const handleToggle = () => {
    const nextState = !open;
    open = nextState;
    if (nextState) setShowOverlay(true);
    setIsMenuOpen(nextState);
    props.onMenuClick?.(nextState);
  };

  createEffect(
    () => ({
      isOpen: isMenuOpen(),
      shown: showOverlay(),
      ease: props.animationEase ?? 'back.out(1.5)',
      duration: props.animationDuration ?? 0.5,
      stagger: props.staggerDelay ?? 0.12
    }),
    ({ isOpen, shown, ease, duration, stagger }) => {
      const { overlay, bubbles, labels } = parts();

      if (!overlay || !bubbles.length) return;

      if (isOpen) {
        gsap.set(overlay, { display: 'flex' });
        gsap.killTweensOf([...bubbles, ...labels]);
        gsap.set(bubbles, { scale: 0, transformOrigin: '50% 50%' });
        gsap.set(labels, { y: 24, autoAlpha: 0 });

        bubbles.forEach((bubble, i) => {
          const delay = i * stagger + gsap.utils.random(-0.05, 0.05);
          const tl = gsap.timeline({ delay });

          tl.to(bubble, {
            scale: 1,
            duration,
            ease
          });
          if (labels[i]) {
            tl.to(
              labels[i],
              {
                y: 0,
                autoAlpha: 1,
                duration,
                ease: 'power3.out'
              },
              `-=${duration * 0.9}`
            );
          }
        });
      } else if (shown) {
        gsap.killTweensOf([...bubbles, ...labels]);
        gsap.to(labels, {
          y: 24,
          autoAlpha: 0,
          duration: 0.2,
          ease: 'power3.in'
        });
        gsap.to(bubbles, {
          scale: 0,
          duration: 0.2,
          ease: 'power3.in',
          onComplete: () => {
            gsap.set(overlay, { display: 'none' });
            setShowOverlay(false);
          }
        });
      }
    }
  );

  createEffect(
    () => ({ isOpen: isMenuOpen(), list: menuItems() }),
    ({ isOpen, list }) => {
      const handleResize = () => {
        if (isOpen) {
          const { bubbles } = parts();
          const isDesktop = window.innerWidth >= 900;

          bubbles.forEach((bubble, i) => {
            const item = list[i];
            if (bubble && item) {
              const rotation = isDesktop ? (item.rotation ?? 0) : 0;
              gsap.set(bubble, { rotation });
            }
          });
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  );

  onSettled(() => () => {
    const { bubbles, labels } = parts();
    gsap.killTweensOf([...bubbles, ...labels]);
  });

  return (
    <>
      <nav class={['bubble-menu', position(), props.className]} style={props.style} aria-label="Main navigation">
        <div class="bubble logo-bubble" aria-label="Logo" style={{ background: menuBg() }}>
          <span class="logo-content">
            {typeof props.logo === 'string' ? <img src={props.logo} alt="Logo" class="bubble-logo" /> : props.logo}
          </span>
        </div>

        <button
          type="button"
          class={['bubble toggle-bubble menu-btn', { open: isMenuOpen() }]}
          onClick={handleToggle}
          aria-label={props.menuAriaLabel ?? 'Toggle menu'}
          aria-pressed={isMenuOpen() ? 'true' : 'false'}
          style={{ background: menuBg() }}
        >
          <span class="menu-line" style={{ background: menuContentColor() }} />
          <span class="menu-line short" style={{ background: menuContentColor() }} />
        </button>
      </nav>
      <Show when={showOverlay()}>
        <div
          ref={el => (overlayEl = el)}
          class={['bubble-menu-items', position()]}
          aria-hidden={isMenuOpen() ? 'false' : 'true'}
        >
          <ul class="pill-list" role="menu" aria-label="Menu links">
            <For each={menuItems()}>
              {item => (
                <li role="none" class="pill-col">
                  <a
                    role="menuitem"
                    href={item.href}
                    aria-label={item.ariaLabel || item.label}
                    class="pill-link"
                    style={{
                      '--item-rot': `${item.rotation ?? 0}deg`,
                      '--pill-bg': menuBg(),
                      '--pill-color': menuContentColor(),
                      '--hover-bg': item.hoverStyles?.bgColor || '#f3f4f6',
                      '--hover-color': item.hoverStyles?.textColor || menuContentColor()
                    }}
                  >
                    <span class="pill-label">{item.label}</span>
                  </a>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>
    </>
  );
}
