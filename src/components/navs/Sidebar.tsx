import { ariaBool } from '@/utils/aria';
import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Portal } from '@solidjs/web';
import { useLocation, useNavigate } from '@solidjs/router';
import { animate } from 'motion';
import {
  DashboardSquare01Icon,
  Image01Icon,
  Motion01Icon,
  MousePointerClickIcon,
  PuzzleIcon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { LayoutGridIcon, SearchIcon } from '@/components/icons/Icons';
import { usePreviewMediaAllowed } from '@/hooks/usePreviewMediaAllowed';
import { colorMode } from '@/hooks/useTheme';
import { NEW, UPDATED } from '@/constants/Badges';
import { CATEGORIES, TOTAL_COMPONENTS } from '@/constants/Categories';
import { componentMap } from '@/constants/Components';
import { componentMetadata } from '@/constants/Information';

type SidebarCategory = { name: string; subcategories: string[]; index: number };
type Preview = { key: string; title: string; label: string; videoBase: string };

const SCROLL_OFFSET = 100;
const BOTTOM_ENTER_PX = 8;
const BOTTOM_EXIT_PX = 48;
const PREVIEW_WIDTH = 304;
const PREVIEW_HEIGHT = 226;
const PREVIEW_DELAY = 260;
const PREVIEW_EXIT_MS = 180;

const PICKER: { key: string; label: string; icon: IconSvgElement }[] = [
  { key: 'all', label: 'All', icon: DashboardSquare01Icon },
  { key: 'text-animations', label: 'Text Animations', icon: TextFontIcon },
  { key: 'components', label: 'Components', icon: PuzzleIcon },
  { key: 'micro', label: 'Micro', icon: MousePointerClickIcon },
  { key: 'animations', label: 'Animations', icon: Motion01Icon },
  { key: 'backgrounds', label: 'Backgrounds', icon: Image01Icon }
];

const slug = (value: string) => value.replace(/\s+/g, '-').toLowerCase();
const scrollToTop = () => window.scrollTo(0, 0);
const pathOf = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const METADATA_BY_PATH = new Map(Object.values(componentMetadata).map(meta => [pathOf(meta.docsUrl), meta]));

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const previewMediaAllowed = usePreviewMediaAllowed();

  const [sidebarFilter, setSidebarFilter] = createSignal('');
  const [pendingActivePath, setPendingSignal] = createSignal<string | null>(null);
  let pendingPath: string | null = null;
  const setPendingActivePath = (value: string | null) => {
    pendingPath = value;
    setPendingSignal(value);
  };
  const [pickerTip, setPickerTip] = createSignal<{ label: string; x: number; y: number } | null>(null);
  const [isAtTop, setIsAtTop] = createSignal(true);
  const [isAtBottom, setIsAtBottom] = createSignal(false);
  const [preview, setPreviewSignal] = createSignal<Preview | null>(null);
  let previewCurrent: Preview | null = null;
  const [previewLeaving, setPreviewLeaving] = createSignal(false);
  const [renderedPreview, setRenderedSignal] = createSignal<Preview | null>(null);
  let renderedCurrent: Preview | null = null;
  const setRenderedPreview = (value: Preview | null) => {
    renderedCurrent = value;
    setRenderedSignal(value);
  };
  const [failedPreview, setFailedPreview] = createSignal<string | null>(null);
  let scrollEl: HTMLDivElement | undefined;
  let previewEl: HTMLElement | undefined;
  const itemRefs = new Map<string, HTMLElement>();
  const previewPos = { x: 260, y: 100 };
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let exitTimer: ReturnType<typeof setTimeout> | undefined;

  const filterQuery = () => sidebarFilter().trim().toLowerCase();
  const focusSlug = () => location.pathname.match(/^\/c\/([^/]+)/)?.[1] ?? null;
  const basePath = () => (focusSlug() ? '/c' : '');
  const onIndexPage = () => location.pathname === '/get-started/index';
  const pickerIndex = () =>
    Math.max(
      0,
      PICKER.findIndex(option => option.key === (focusSlug() ?? 'all'))
    );

  const filterCount = () => {
    const focus = focusSlug();
    return focus
      ? (CATEGORIES.find(category => slug(category.name) === focus)?.subcategories.length ?? TOTAL_COMPONENTS)
      : TOTAL_COMPONENTS;
  };

  const sidebarCategories = createMemo<SidebarCategory[]>(() => {
    const query = filterQuery();
    const focus = focusSlug();
    return CATEGORIES.map((category, index) => ({
      ...category,
      index,
      subcategories:
        query && !category.name.toLowerCase().includes(query)
          ? category.subcategories.filter(item => item.toLowerCase().includes(query))
          : [...category.subcategories]
    })).filter(category => !focus || category.index === 0 || slug(category.name) === focus);
  });

  const showFavorites = () => !filterQuery() || 'favorites saved'.includes(filterQuery());
  const hasResults = () => showFavorites() || sidebarCategories().some(category => category.subcategories.length > 0);
  const activePath = () => pendingActivePath() || location.pathname;

  const pathFor = (category: SidebarCategory, sub: string) =>
    `${category.name === 'Get Started' ? '' : basePath()}/${slug(category.name)}/${slug(sub)}`;

  const pickCategory = (key: string) => {
    setPickerTip(null);
    const focus = focusSlug();
    if (key === 'all') {
      if (!focus) return;
      const rest = location.pathname.replace(/^\/c/, '');
      navigate(rest.split('/').filter(Boolean).length >= 2 ? rest : '/get-started/index');
      return;
    }
    if (key !== focus) navigate(`/c/${key}`);
  };

  const showTip = (event: Event, label: string) => {
    const target = event.currentTarget as HTMLElement;
    const item = target.getBoundingClientRect();
    const nav = target.closest('nav')?.getBoundingClientRect();
    setPickerTip({ label, x: (nav?.right ?? item.right) + 10, y: item.top + item.height / 2 });
  };

  const navigateTo = (event: MouseEvent, path: string, subcategory: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (location.pathname === path) return;
    setPendingActivePath(path);
    componentMap[slug(subcategory)]?.();
    navigate(path);
    scrollToTop();
  };

  const updateScrollEdges = () => {
    const el = scrollEl;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtTop(el.scrollTop <= 2);
    setIsAtBottom(isAtBottom() ? remaining <= BOTTOM_EXIT_PX : remaining <= BOTTOM_ENTER_PX);
  };

  const scrollActiveItemIntoView = () => {
    const activeEl = itemRefs.get(activePath().replace(/^\/c(?=\/)/, ''));
    const container = scrollEl;
    if (!activeEl || !container) return;
    const containerRect = container.getBoundingClientRect();
    const elementRect = activeEl.getBoundingClientRect();
    const isOutOfView =
      elementRect.top < containerRect.top + SCROLL_OFFSET || elementRect.bottom > containerRect.bottom - SCROLL_OFFSET;
    if (isOutOfView) {
      container.scrollTo({
        top: container.scrollTop + (elementRect.top - containerRect.top) - SCROLL_OFFSET,
        behavior: 'smooth'
      });
    }
  };

  const videoSuffix = () => (colorMode() === 'light' && failedPreview() !== renderedPreview()?.key ? '-light' : '');
  const previewBase = () => {
    const current = renderedPreview();
    return current ? `${current.videoBase}${videoSuffix()}` : '';
  };

  const onPreviewError = () => {
    const current = renderedPreview();
    if (current && videoSuffix()) setFailedPreview(current.key);
  };

  const movePreview = (x: number, y: number, instant: boolean) => {
    previewPos.x = x;
    previewPos.y = y;
    if (!previewEl) return;
    if (instant || reducedMotion()) {
      previewEl.style.transform = `translate(${x}px, ${y}px)`;
      return;
    }
    animate(previewEl, { x, y }, { type: 'spring', stiffness: 400, damping: 36, mass: 0.75 });
  };

  const updatePreviewPosition = (event: MouseEvent, instant = false) => {
    const target = event.currentTarget as HTMLElement;
    const itemRect = target.getBoundingClientRect();
    const sidebarRect = target.closest('nav')?.getBoundingClientRect();
    const pointerX = event.clientX || itemRect.left + itemRect.width / 2;
    const pointerY = event.clientY || itemRect.top + itemRect.height / 2;
    const sidebarLeft = sidebarRect?.left ?? 16;
    const sidebarWidth = sidebarRect?.width ?? 256;
    const sidebarRight = sidebarRect?.right ?? sidebarLeft + sidebarWidth;
    const pointerProgress = Math.max(0, Math.min(1, (pointerX - sidebarLeft) / sidebarWidth));
    const horizontalDrift = (pointerProgress - 0.5) * 12;
    const nextX = Math.min(window.innerWidth - PREVIEW_WIDTH - 16, sidebarRight + 16 + horizontalDrift);
    const minY = sidebarRect?.top ?? 76;
    const maxY = Math.max(minY, window.innerHeight - PREVIEW_HEIGHT - 16);
    const nextY = Math.max(minY, Math.min(maxY, pointerY - PREVIEW_HEIGHT / 2));
    movePreview(nextX, nextY, instant);
  };

  const handlePreviewEnter = (categoryName: string, componentName: string, event: MouseEvent) => {
    if (!previewMediaAllowed() || categoryName === 'Get Started') return;
    const key = `/${slug(categoryName)}/${slug(componentName)}`;
    const metadata = METADATA_BY_PATH.get(key);
    if (!metadata?.videoUrl) return;
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    updatePreviewPosition(event, !preview());
    const videoBase = metadata.videoUrl.replace(/\.(webm|mp4)$/i, '');
    const delay = preview() ? 70 : PREVIEW_DELAY;
    showTimer = setTimeout(() => setPreview({ key, title: componentName, label: categoryName, videoBase }), delay);
  };

  const handlePreviewMove = (event: MouseEvent) => {
    if (previewMediaAllowed() && preview()) updatePreviewPosition(event);
  };

  const handlePreviewLeave = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => setPreview(null), 90);
  };

  function setPreview(next: Preview | null) {
    if (next === previewCurrent) return;
    previewCurrent = next;
    setPreviewSignal(next);
    clearTimeout(exitTimer);
    if (next) {
      setPreviewLeaving(false);
      setRenderedPreview(next);
      return;
    }
    if (!renderedCurrent) return;
    setPreviewLeaving(true);
    exitTimer = setTimeout(() => {
      setRenderedPreview(null);
      setPreviewLeaving(false);
    }, PREVIEW_EXIT_MS);
  }

  createEffect(
    () => location.pathname,
    path => {
      if (pendingPath && path === pendingPath) setPendingActivePath(null);
      setPreview(null);
      const timer = setTimeout(scrollActiveItemIntoView, 100);
      return () => clearTimeout(timer);
    }
  );

  createEffect(
    sidebarFilter,
    () => {
      setPreview(null);
    },
    { defer: true }
  );

  createEffect(sidebarCategories, () => {
    requestAnimationFrame(updateScrollEdges);
  });

  createEffect(previewMediaAllowed, allowed => {
    if (!allowed) setPreview(null);
  });

  onSettled(() => {
    const el = scrollEl;
    el?.addEventListener('scroll', updateScrollEdges, { passive: true });
    updateScrollEdges();
    const timer = setTimeout(scrollActiveItemIntoView, 100);
    return () => {
      el?.removeEventListener('scroll', updateScrollEdges);
      clearTimeout(timer);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(exitTimer);
    };
  });

  return (
    <>
      <nav class="sidebar" aria-label="Docs navigation">
        <a
          href="/get-started/index"
          class="sidebar-browse"
          aria-current={onIndexPage() ? 'page' : undefined}
          tabindex={onIndexPage() ? -1 : undefined}
          onClick={scrollToTop}
        >
          <LayoutGridIcon size={13} strokeWidth={2} class="sidebar-browse__icon" />
          <span class="sidebar-browse__label sb-fade-swap">
            {onIndexPage() ? 'Viewing all components' : 'Browse all components'}
          </span>
        </a>

        <div
          class="sidebar-picker"
          role="tablist"
          aria-label="Category"
          style={{ '--sp-i': pickerIndex(), '--sp-n': PICKER.length }}
          onMouseLeave={() => setPickerTip(null)}
        >
          <span class="sidebar-picker__pill" aria-hidden="true" />
          <For each={PICKER}>
            {(option, i) => (
              <button
                type="button"
                role="tab"
                aria-selected={ariaBool(i() === pickerIndex())}
                aria-label={option.label}
                class="sidebar-picker__item"
                data-active={i() === pickerIndex() ? '' : undefined}
                onClick={() => pickCategory(option.key)}
                onMouseEnter={event => showTip(event, option.label)}
                onFocus={event => showTip(event, option.label)}
                onBlur={() => setPickerTip(null)}
              >
                <HugeiconsIcon icon={option.icon} size={18} strokeWidth={1.8} />
              </button>
            )}
          </For>
        </div>

        <label class="sidebar-filter">
          <SearchIcon size={13} />
          <input
            value={sidebarFilter()}
            onInput={e => setSidebarFilter(e.currentTarget.value)}
            placeholder={`Filter ${filterCount()} components...`}
            aria-label="Filter sidebar navigation"
          />
        </label>

        <div class={['sidebar-scroll-shell', { 'is-at-top': isAtTop(), 'is-at-bottom': isAtBottom() }]}>
          <div ref={el => (scrollEl = el)} class="sidebar-scroll">
            <div class="sidebar-sections">
              <For each={sidebarCategories()}>
                {cat => (
                  <Show when={cat.subcategories.length > 0 || (cat.index === 0 && showFavorites())}>
                    <div class="sidebar-section">
                      <p class="category-name">{cat.name}</p>
                      <div class="sidebar-link-stack">
                        <For each={cat.subcategories}>
                          {sub => {
                            const path = () => pathFor(cat, sub);
                            return (
                              <a
                                ref={el => itemRefs.set(`/${slug(cat.name)}/${slug(sub)}`, el)}
                                href={path()}
                                class={['sidebar-item', { 'active-sidebar-item': activePath() === path() }]}
                                aria-current={activePath() === path() ? 'page' : undefined}
                                onClick={event => navigateTo(event, path(), sub)}
                                onMouseEnter={event => handlePreviewEnter(cat.name, sub, event)}
                                onMouseMove={handlePreviewMove}
                                onMouseLeave={handlePreviewLeave}
                                onFocus={event => handlePreviewEnter(cat.name, sub, event as unknown as MouseEvent)}
                                onBlur={handlePreviewLeave}
                              >
                                {sub}
                                <Show when={NEW.includes(sub)}>
                                  <span class="new-tag">New</span>
                                </Show>
                                <Show when={UPDATED.includes(sub)}>
                                  <span class="updated-tag">Updated</span>
                                </Show>
                              </a>
                            );
                          }}
                        </For>
                        <Show when={cat.index === 0 && showFavorites()}>
                          <a
                            ref={el => itemRefs.set('/favorites', el)}
                            href="/favorites"
                            class={['sidebar-item', { 'active-sidebar-item': location.pathname === '/favorites' }]}
                            onClick={scrollToTop}
                          >
                            Favorites
                          </a>
                        </Show>
                      </div>
                    </div>
                  </Show>
                )}
              </For>
              <Show when={!hasResults()}>
                <p class="sidebar-filter-empty">No matching pages</p>
              </Show>
            </div>
          </div>
        </div>
      </nav>

      <Show when={pickerTip()}>
        {tip => (
          <Portal>
            <div
              class="sidebar-picker-tip sb-tip-in"
              role="tooltip"
              style={{ left: `${tip().x}px`, top: `${tip().y}px`, transform: 'translateY(-50%)' }}
            >
              <span style={{ display: 'block' }}>{tip().label}</span>
            </div>
          </Portal>
        )}
      </Show>

      <Show when={previewMediaAllowed() && renderedPreview()}>
        {current => (
          <Portal>
            <aside
              ref={el => {
                previewEl = el;
                el.style.transform = `translate(${previewPos.x}px, ${previewPos.y}px)`;
              }}
              class="sidebar-hover-preview sb-preview"
              data-leaving={previewLeaving() ? '' : undefined}
              aria-hidden="true"
            >
              <div class="sidebar-hover-preview-media">
                <div class="sidebar-hover-preview-frame">
                  <Show when={previewBase()} keyed>
                    {base => (
                      <video autoplay loop muted playsinline preload="metadata" onError={onPreviewError}>
                        <source src={`${base}.webm`} type="video/webm" onError={onPreviewError} />
                        <source src={`${base}.mp4`} type="video/mp4" onError={onPreviewError} />
                      </video>
                    )}
                  </Show>
                </div>
              </div>
              <div class="sidebar-hover-preview-caption">
                <span class="sidebar-hover-preview-title">{current().title}</span>
                <span class="sidebar-hover-preview-item">{current().label}</span>
              </div>
            </aside>
          </Portal>
        )}
      </Show>
    </>
  );
}
