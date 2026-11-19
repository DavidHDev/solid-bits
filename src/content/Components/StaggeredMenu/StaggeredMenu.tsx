import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  isFixed?: boolean;
}

const DEFAULT_LOGO = '/src/assets/logos/solidbits-gh-white.svg';

export default function StaggeredMenu(props: StaggeredMenuProps) {
  const [open, setOpen] = createSignal(false);
  const [textLines, setTextLines] = createSignal<string[]>(['Menu', 'Close']);
  let openState = false;
  let panelEl: HTMLElement | undefined;
  let preLayersEl: HTMLDivElement | undefined;
  let preLayerEls: HTMLElement[] = [];
  let plusHEl: HTMLSpanElement | undefined;
  let plusVEl: HTMLSpanElement | undefined;
  let iconEl: HTMLSpanElement | undefined;
  let textInnerEl: HTMLSpanElement | undefined;
  let toggleBtnEl: HTMLButtonElement | undefined;

  let openTl: gsap.core.Timeline | null = null;
  let closeTween: gsap.core.Tween | null = null;
  let spinTween: gsap.core.Tween | null = null;
  let textCycleAnim: gsap.core.Tween | null = null;
  let colorTween: gsap.core.Tween | null = null;
  let busy = false;

  const position = () => props.position ?? 'right';
  const menuButtonColor = () => props.menuButtonColor ?? '#fff';
  const openMenuButtonColor = () => props.openMenuButtonColor ?? '#fff';
  const changeMenuColorOnOpen = () => props.changeMenuColorOnOpen ?? true;
  const accentColor = () => props.accentColor ?? '#0aa0ef';

  const layers = createMemo(() => {
    const colors = props.colors ?? ['#6ec9f7', '#0aa0ef'];
    const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1f22', '#35373c'];
    const arr = [...raw];
    if (arr.length >= 3) {
      const mid = Math.floor(arr.length / 2);
      arr.splice(mid, 1);
    }
    return arr;
  });

  createEffect(
    () => ({ color: menuButtonColor(), side: position() }),
    ({ color, side }) => {
      const ctx = gsap.context(() => {
        const panel = panelEl;
        const preContainer = preLayersEl;
        const plusH = plusHEl;
        const plusV = plusVEl;
        const icon = iconEl;
        const textInner = textInnerEl;
        if (!panel || !plusH || !plusV || !icon || !textInner) return;

        let preLayers: HTMLElement[] = [];
        if (preContainer) {
          preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer')) as HTMLElement[];
        }
        preLayerEls = preLayers;

        const offscreen = side === 'left' ? -100 : 100;
        gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
        if (preContainer) {
          gsap.set(preContainer, { xPercent: 0, opacity: 1 });
        }
        gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
        gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
        gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
        gsap.set(textInner, { yPercent: 0 });
        if (toggleBtnEl) gsap.set(toggleBtnEl, { color });
      });
      return () => ctx.revert();
    }
  );

  const buildOpenTimeline = () => {
    const panel = panelEl;
    const layerEls = preLayerEls;
    if (!panel) return null;

    openTl?.kill();
    if (closeTween) {
      closeTween.kill();
      closeTween = null;
    }

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
    ) as HTMLElement[];
    const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];

    const offscreen = position() === 'left' ? -100 : 100;
    const layerStates = layerEls.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTl = tl;
    return tl;
  };

  const playOpen = () => {
    if (busy) return;
    busy = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busy = false;
      });
      tl.play(0);
    } else {
      busy = false;
    }
  };

  const playClose = () => {
    openTl?.kill();
    openTl = null;

    const panel = panelEl;
    const layerEls = preLayerEls;
    if (!panel) return;

    const all: HTMLElement[] = [...layerEls, panel];
    closeTween?.kill();
    const offscreen = position() === 'left' ? -100 : 100;
    closeTween = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel')) as HTMLElement[];
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        const numberEls = Array.from(
          panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')
        ) as HTMLElement[];
        if (numberEls.length) {
          gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        const socialTitle = panel.querySelector('.sm-socials-title') as HTMLElement | null;
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link')) as HTMLElement[];
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        busy = false;
      }
    });
  };

  const animateIcon = (opening: boolean) => {
    const icon = iconEl;
    if (!icon) return;
    spinTween?.kill();
    if (opening) {
      spinTween = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTween = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  };

  const animateColor = (opening: boolean) => {
    const btn = toggleBtnEl;
    if (!btn) return;
    colorTween?.kill();
    if (changeMenuColorOnOpen()) {
      const targetColor = opening ? openMenuButtonColor() : menuButtonColor();
      colorTween = gsap.to(btn, {
        color: targetColor,
        delay: 0.18,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.set(btn, { color: menuButtonColor() });
    }
  };

  createEffect(
    () => ({ change: changeMenuColorOnOpen(), closed: menuButtonColor(), opened: openMenuButtonColor() }),
    ({ change, closed, opened }) => {
      if (toggleBtnEl) {
        if (change) {
          const targetColor = openState ? opened : closed;
          gsap.set(toggleBtnEl, { color: targetColor });
        } else {
          gsap.set(toggleBtnEl, { color: closed });
        }
      }
    }
  );

  const animateText = (opening: boolean) => {
    const inner = textInnerEl;
    if (!inner) return;
    textCycleAnim?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnim = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  };

  const toggleMenu = () => {
    const target = !openState;
    openState = target;
    setOpen(target);
    if (target) {
      props.onMenuOpen?.();
      playOpen();
    } else {
      props.onMenuClose?.();
      playClose();
    }
    animateIcon(target);
    animateColor(target);
    animateText(target);
  };

  const closeMenu = () => {
    if (openState) {
      openState = false;
      setOpen(false);
      props.onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  };

  createEffect(
    () => ({ enabled: props.closeOnClickAway ?? true, isOpen: open() }),
    ({ enabled, isOpen }) => {
      if (!enabled || !isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          panelEl &&
          !panelEl.contains(event.target as Node) &&
          toggleBtnEl &&
          !toggleBtnEl.contains(event.target as Node)
        ) {
          closeMenu();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  );

  onSettled(() => () => {
    openTl?.kill();
    closeTween?.kill();
    spinTween?.kill();
    textCycleAnim?.kill();
    colorTween?.kill();
  });

  return (
    <div
      class={[props.className, 'staggered-menu-wrapper', { 'fixed-wrapper': !!props.isFixed }]}
      style={accentColor() ? { '--sm-accent': accentColor() } : undefined}
      data-position={position()}
      data-open={open() ? 'true' : undefined}
    >
      <div ref={el => (preLayersEl = el)} class="sm-prelayers" aria-hidden="true">
        <For each={layers()} keyed={false}>
          {c => <div class="sm-prelayer" style={{ background: c() }} />}
        </For>
      </div>
      <header class="staggered-menu-header" aria-label="Main navigation header">
        <div class="sm-logo" aria-label="Logo">
          <img
            src={props.logoUrl || DEFAULT_LOGO}
            alt="Logo"
            class="sm-logo-img"
            draggable="false"
            width={110}
            height={24}
          />
        </div>
        <button
          ref={el => (toggleBtnEl = el)}
          class="sm-toggle"
          aria-label={open() ? 'Close menu' : 'Open menu'}
          aria-expanded={open() ? 'true' : 'false'}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span class="sm-toggle-textWrap" aria-hidden="true">
            <span ref={el => (textInnerEl = el)} class="sm-toggle-textInner">
              <For each={textLines()} keyed={false}>
                {l => <span class="sm-toggle-line">{l()}</span>}
              </For>
            </span>
          </span>
          <span ref={el => (iconEl = el)} class="sm-icon" aria-hidden="true">
            <span ref={el => (plusHEl = el)} class="sm-icon-line" />
            <span ref={el => (plusVEl = el)} class="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </header>

      <aside
        id="staggered-menu-panel"
        ref={el => (panelEl = el)}
        class="staggered-menu-panel"
        aria-hidden={open() ? 'false' : 'true'}
      >
        <div class="sm-panel-inner">
          <ul
            class="sm-panel-list"
            role="list"
            data-numbering={(props.displayItemNumbering ?? true) ? 'true' : undefined}
          >
            <Show
              when={props.items && props.items.length}
              fallback={
                <li class="sm-panel-itemWrap" aria-hidden="true">
                  <span class="sm-panel-item">
                    <span class="sm-panel-itemLabel">No items</span>
                  </span>
                </li>
              }
            >
              <For each={props.items ?? []}>
                {(it, idx) => (
                  <li class="sm-panel-itemWrap">
                    <a class="sm-panel-item" href={it.link} aria-label={it.ariaLabel} data-index={idx() + 1}>
                      <span class="sm-panel-itemLabel">{it.label}</span>
                    </a>
                  </li>
                )}
              </For>
            </Show>
          </ul>
          <Show when={(props.displaySocials ?? true) && props.socialItems && props.socialItems.length > 0}>
            <div class="sm-socials" aria-label="Social links">
              <h3 class="sm-socials-title">Socials</h3>
              <ul class="sm-socials-list" role="list">
                <For each={props.socialItems ?? []}>
                  {s => (
                    <li class="sm-socials-item">
                      <a href={s.link} target="_blank" rel="noopener noreferrer" class="sm-socials-link">
                        {s.label}
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </div>
      </aside>
    </div>
  );
}
