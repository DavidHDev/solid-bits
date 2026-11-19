import { For, Loading, Show, createEffect, createMemo, createSignal, lazy, onSettled, type Component } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import { useLocation, useNavigate } from '@solidjs/router';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import Navbar from '@/components/landing/Navbar/Navbar';
import { colorMode } from '@/hooks/useTheme';
import { findComponentBySlug, suggestComponents } from '@/utils/routeMatch';
import markup from '@/assets/svg/404.svg?raw';
import '@/css/not-found.css';

const MARK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const MARK_VIEWBOX = markup.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 1897 742';
const MARK_PATH = markup.match(/ d="([^"]+)"/)?.[1] ?? '';
const STAGE_SCALE = 0.56;

const PALETTES = {
  dark: { color: '#dcecfa', glowColor: '#0aa0ef', bend: 0.5, glow: 0.2 },
  light: { color: '#0977ae', glowColor: '#9cc7ea', bend: 0.45, glow: 0.42 }
};

const CATEGORY_LINKS = [
  { label: 'Text Animations', to: '/c/text-animations' },
  { label: 'Animations', to: '/c/animations' },
  { label: 'Components', to: '/c/components' },
  { label: 'Backgrounds', to: '/c/backgrounds' },
  { label: 'Micro', to: '/c/micro' }
];

const BOOT: [number, number][] = [
  [420, 0.55],
  [500, 0.04],
  [760, 0.38],
  [820, 0],
  [1080, 1]
];
const BROWNOUT: [number, number][] = [
  [0, 0.62],
  [80, 1],
  [170, 0.8],
  [240, 1]
];

type ElectricLogoComponent = Component<Record<string, unknown>>;

const electricModules = import.meta.glob<{ default: ElectricLogoComponent }>(
  '../content/Animations/ElectricLogo/ElectricLogo.tsx'
);
const electricLoader = Object.values(electricModules)[0];
const ElectricLogo = electricLoader ? lazy(electricLoader) : null;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

function EmbeddedNotFound() {
  const location = useLocation();
  const suggestions = createMemo(() => suggestComponents(location.pathname.split('/').filter(Boolean).pop() ?? ''));

  return (
    <div class="category-page">
      <div class="docs-not-found">
        <p class="docs-not-found-title">Not found</p>
        <p class="docs-not-found-text">The link may be broken, or the page may have moved.</p>
        <Show when={suggestions().length > 0}>
          <nav class="sb-not-found-suggest" aria-label="Suggested components">
            <span>Did you mean</span>
            <For each={suggestions()}>
              {item => (
                <a href={item.path}>
                  {item.name} <span>{item.category}</span>
                </a>
              )}
            </For>
          </nav>
        </Show>
        <a href="/get-started/index" class="docs-pill-button">
          Browse components
        </a>
      </div>
    </div>
  );
}

function FullNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const palette = createMemo(() => PALETTES[colorMode()]);
  const [reducedMotion, setReducedMotion] = createSignal(prefersReducedMotion());
  const [entering, setEntering] = createSignal(!prefersReducedMotion());
  const [power, setPower] = createSignal(0);
  let stageEl: HTMLDivElement | undefined;
  let titleEl: HTMLHeadingElement | undefined;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let brownoutTimer: ReturnType<typeof setTimeout> | undefined;
  let lit = false;
  let reduced = prefersReducedMotion();

  const segments = createMemo(() => location.pathname.split('/').filter(Boolean));
  const lastSegment = createMemo(() => segments()[segments().length - 1] || '');
  const suggestions = createMemo(() => suggestComponents(lastSegment()));

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  const play = (sequence: [number, number][]) => {
    clearTimers();
    if (prefersReducedMotion()) {
      setPower(sequence[sequence.length - 1][1]);
      return;
    }
    sequence.forEach(([at, level]) => {
      timers.push(setTimeout(() => setPower(level), at));
    });
  };

  const scheduleBrownout = () => {
    clearTimeout(brownoutTimer);
    if (!lit || reduced) return;
    brownoutTimer = setTimeout(
      () => {
        play(BROWNOUT);
        scheduleBrownout();
      },
      10000 + Math.random() * 9000
    );
  };

  createEffect(
    () => [power() === 1, reducedMotion()] as const,
    ([isLit, isReduced]) => {
      lit = isLit;
      reduced = isReduced;
      if (isLit) scheduleBrownout();
    }
  );

  createEffect(
    () => {
      const parts = segments();
      if (parts.length !== 1) return null;
      const direct = findComponentBySlug(parts[0]);
      return direct ? `${direct.path}${location.search}${location.hash}` : null;
    },
    target => {
      if (target) navigate(target, { replace: true });
    }
  );

  onSettled(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      setReducedMotion(motionQuery.matches);
      if (motionQuery.matches) setEntering(false);
      clearTimers();
      setPower(1);
    };
    motionQuery.addEventListener('change', syncMotion);
    const enteringTimer = setTimeout(() => setEntering(false), 1900);
    play(BOOT);

    let resizeObserver: ResizeObserver | null = null;
    const stage = stageEl;
    const title = titleEl;
    if (stage && title) {
      const sync = () => stage.style.setProperty('--nf-glyph-w', `${title.offsetWidth}px`);
      sync();
      resizeObserver = new ResizeObserver(sync);
      resizeObserver.observe(title);
    }

    return () => {
      clearTimers();
      clearTimeout(brownoutTimer);
      clearTimeout(enteringTimer);
      resizeObserver?.disconnect();
      motionQuery.removeEventListener('change', syncMotion);
    };
  });

  return (
    <div class="nf" data-entering={entering() ? '' : undefined} style={{ '--nf-power': power() }}>
      <Navbar showDocs />

      <main class="nf-main">
        <div class="nf-default">
          <div ref={el => (stageEl = el)} class="nf-stage" style={{ '--nf-scale': STAGE_SCALE }} aria-hidden="true">
            <div class="nf-sign">
              <svg class="nf-tubes" viewBox={MARK_VIEWBOX} preserveAspectRatio="xMidYMid meet">
                <path d={MARK_PATH} />
              </svg>
              <Show when={ElectricLogo}>
                <Loading fallback={null}>
                  <Dynamic
                    component={ElectricLogo!}
                    src={MARK_SRC}
                    theme={colorMode()}
                    color={palette().color}
                    glowColor={palette().glowColor}
                    bend={palette().bend}
                    glow={palette().glow}
                    intensity={power()}
                    interactive={!reducedMotion()}
                    speed={reducedMotion() ? 0 : 1.8}
                    arcs={reducedMotion() ? 0 : 0.55}
                    flicker={reducedMotion() ? 0 : 0.3}
                    scale={STAGE_SCALE}
                    thickness={1.6}
                    cursorRadius={90}
                  />
                </Loading>
              </Show>
            </div>
          </div>

          <h1 ref={el => (titleEl = el)} class="nf-title">
            <span class="nf-sr-only">404.</span>
            This page doesn’t exist
          </h1>
          <p class="nf-lede">The link may be broken, or the page may have moved.</p>

          <Show when={suggestions().length > 0}>
            <nav class="nf-suggest" aria-label="Suggested components">
              <span class="nf-suggest-label">Did you mean</span>
              <For each={suggestions()}>
                {item => (
                  <a href={item.path} class="nf-suggest-link">
                    <span class="nf-suggest-name">{item.name}</span>
                    <span class="nf-suggest-category">{item.category}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} class="nf-suggest-arrow" />
                  </a>
                )}
              </For>
            </nav>
          </Show>

          <a href="/get-started/index" class="nf-btn">
            Browse components
          </a>
        </div>
      </main>

      <nav class="nf-categories" aria-label="Categories">
        <For each={CATEGORY_LINKS}>
          {(link, index) => (
            <a href={link.to} style={{ '--nf-order': index() }}>
              {link.label}
            </a>
          )}
        </For>
      </nav>
    </div>
  );
}

export default function NotFoundPage(props: { embedded?: boolean }) {
  onSettled(() => {
    document.title = 'Page not found - Solid Bits';
  });
  return (
    <Show when={props.embedded} fallback={<FullNotFound />}>
      <EmbeddedNotFound />
    </Show>
  );
}
