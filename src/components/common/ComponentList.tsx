import { ariaBool } from '@/utils/aria';
import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import gsap from 'gsap';
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { HeartIcon, TrashIcon } from '@/components/icons/Icons';
import { usePreviewMediaAllowed } from '@/hooks/usePreviewMediaAllowed';
import { addToast } from '@/hooks/useToast';
import { NEW_KEYS } from '@/constants/Badges';
import { CATEGORIES } from '@/constants/Categories';
import type { ComponentMetadata } from '@/constants/Information';
import { rankComponentSearch } from '@/utils/componentSearch';
import { getSavedComponents, removeSavedComponent, toggleSavedComponent } from '@/utils/favorites';
import LazyCardMedia from './LazyCardMedia';
import ToolbarSelect from './ToolbarSelect';

const SORT_NAME = 'A to Z';
const SORT_NEWEST = 'Newest';
const SORT_OPTIONS = [SORT_NAME, SORT_NEWEST];
const ALL = 'All Components';
const CLEAR_APPEAR_DEBOUNCE_MS = 300;

type Item = {
  key: string;
  categoryKey: string;
  componentKey: string;
  categoryLabel: string;
  title: string;
  description: string;
  videoUrl: string;
  tags: string[];
  isNew: boolean;
  added: string;
  hidden: boolean;
  isNewSinceLastVisit: boolean;
};

const slug = (value: string) => (value || '').replace(/\s+/g, '-').toLowerCase();
const fromPascal = (value: string) =>
  (value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const revealsHidden = (item: Item, term: string) => {
  const query = squash(term);
  return query.length >= 4 && squash(item.title).startsWith(query);
};

const pathOf = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const categoriesList = [
  ALL,
  ...CATEGORIES.filter(category => category.name !== 'Get Started')
    .map(category => category.name)
    .sort((a, b) => a.localeCompare(b))
];

export default function ComponentList(props: {
  list: ComponentMetadata;
  hasDeleteButton?: boolean;
  hasFavoriteButton?: boolean;
  sorting?: 'none' | 'newest' | 'alphabetical';
  title?: string;
  newSinceLastVisit?: Set<string>;
  basePath?: string;
  showCategoryFilter?: boolean;
  showSortControl?: boolean;
  showDirectory?: boolean;
}) {
  const showCategoryFilter = () => props.showCategoryFilter ?? true;
  const pathFor = (item: Item) => {
    const meta = props.list[item.key];
    const docsPath = meta?.docsUrl ? pathOf(meta.docsUrl) : '';
    return docsPath
      ? `${props.basePath ?? ''}${docsPath}`
      : `${props.basePath ?? ''}/${slug(fromPascal(item.categoryKey))}/${slug(fromPascal(item.componentKey))}`;
  };

  const [hoveredKey, setHoveredKey] = createSignal<string | null>(null);
  const [sortMode, setSortMode] = createSignal<string | null>(() =>
    props.sorting === 'newest' ? SORT_NEWEST : props.sorting === 'alphabetical' ? SORT_NAME : null
  );
  const [selectedCategory, setSelectedCategory] = createSignal(ALL);
  const [search, setSearch] = createSignal('');
  const [newOnly, setNewOnly] = createSignal(false);
  const [savedSet, setSavedSet] = createSignal(new Set(getSavedComponents()));
  const [debouncedSearch, setDebouncedSearch] = createSignal('');
  const previewMediaAllowed = usePreviewMediaAllowed();
  let clearSlotEl: HTMLDivElement | undefined;
  let clearBtnEl: HTMLButtonElement | undefined;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const items = createMemo<Item[]>(() => {
    if (!props.list) return [];
    const newSince = props.newSinceLastVisit ?? new Set<string>();
    let arr: Item[] = Object.entries(props.list)
      .filter(([key]) => key.includes('/'))
      .map(([key, meta]) => {
        const [cat, comp] = key.split('/');
        return {
          key,
          categoryKey: cat,
          componentKey: comp,
          categoryLabel: fromPascal(meta?.category ?? cat),
          title: fromPascal(meta?.name ?? comp),
          description: meta?.description ?? '',
          videoUrl: meta?.videoUrl ?? '',
          tags: Array.isArray(meta?.tags) ? meta.tags : [],
          isNew: NEW_KEYS.has(key),
          added: meta?.added ?? '',
          hidden: Boolean(meta?.hidden),
          isNewSinceLastVisit: newSince.has(key)
        };
      });
    if (sortMode() === SORT_NEWEST) {
      arr = arr.sort((a, b) => b.added.localeCompare(a.added) || a.title.localeCompare(b.title));
    } else if (sortMode() === SORT_NAME) {
      arr = arr.sort((a, b) => {
        if (a.isNewSinceLastVisit !== b.isNewSinceLastVisit) return a.isNewSinceLastVisit ? -1 : 1;
        if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
    }
    return arr;
  });

  const filtered = createMemo(() => {
    const term = search().trim();
    const all = !showCategoryFilter() || selectedCategory() === ALL;
    return items()
      .filter(item => !item.hidden || revealsHidden(item, term))
      .filter(item => (all || item.categoryLabel === selectedCategory()) && (!newOnly() || item.isNewSinceLastVisit))
      .map(item => ({ item, match: term ? rankComponentSearch(item, term) : { score: 1 } }))
      .filter(({ match }) => Boolean(match))
      .sort((a, b) => (term ? (b.match?.score ?? 0) - (a.match?.score ?? 0) : 0))
      .map(({ item }) => item);
  });

  const directory = createMemo(() => [...filtered()].sort((a, b) => a.title.localeCompare(b.title)));
  const controlsDisabled = () => items().length === 0;
  const hasCategoryFilter = () => showCategoryFilter() && selectedCategory() !== ALL;
  const newSinceLastVisitCount = () => items().filter(item => !item.hidden && item.isNewSinceLastVisit).length;
  const hasActiveFilters = () => hasCategoryFilter() || newOnly() || search().trim().length > 0;
  const showNewStatus = () => newSinceLastVisitCount() > 0 && (!hasActiveFilters() || newOnly());
  const showClear = createMemo(
    () => !controlsDisabled() && (hasCategoryFilter() || newOnly() || debouncedSearch().trim().length > 0)
  );

  createEffect(search, value => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setDebouncedSearch(value), CLEAR_APPEAR_DEBOUNCE_MS);
  });

  createEffect(
    showClear,
    visible => {
      const slot = clearSlotEl;
      const btn = clearBtnEl;
      if (!slot || !btn) return;
      gsap.killTweensOf([slot, btn]);
      if (visible) {
        gsap
          .timeline()
          .to(slot, { width: 44, duration: 0.3, ease: 'power2.out' })
          .fromTo(
            btn,
            { scale: 0.6, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out', force3D: true },
            '<0.05'
          );
      } else {
        gsap
          .timeline()
          .to(btn, { scale: 0, opacity: 0, duration: 0.15, ease: 'power2.in' })
          .to(slot, { width: 0, duration: 0.25, ease: 'power2.inOut' }, '+=0');
      }
    },
    { defer: true }
  );

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(ALL);
    setNewOnly(false);
  };

  const setHoverToItemAtPoint = (x: number, y: number) => {
    let node = document.elementFromPoint(x, y) as HTMLElement | null;
    while (node && node !== document.body) {
      if (node.dataset?.itemKey) {
        setHoveredKey(node.dataset.itemKey);
        return;
      }
      node = node.parentElement;
    }
    setHoveredKey(null);
  };

  const removeFavorite = (event: MouseEvent, key: string) => {
    event.preventDefault();
    event.stopPropagation();
    const { clientX, clientY } = event;
    setSavedSet(new Set(removeSavedComponent(key)));
    (event.currentTarget as HTMLElement | null)?.blur();
    requestAnimationFrame(() => setHoverToItemAtPoint(clientX, clientY));
  };

  const toggleFavorite = (event: MouseEvent, item: Item) => {
    event.preventDefault();
    event.stopPropagation();
    const { saved, list } = toggleSavedComponent(item.key);
    setSavedSet(new Set(list));
    addToast({
      severity: saved ? 'success' : 'error',
      summary: `${saved ? 'Added' : 'Removed'} <${item.title.replace(/\s+/g, '')} /> ${saved ? 'to favorites' : 'from favorites'}`,
      life: 3000
    });
    (event.currentTarget as HTMLElement | null)?.blur();
  };

  onSettled(() => {
    const updateSaved = () => setSavedSet(new Set(getSavedComponents()));
    const onStorage = (event: StorageEvent) => {
      if (!event || event.key === 'savedComponents') updateSaved();
    };
    window.addEventListener('favorites:updated', updateSaved);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('favorites:updated', updateSaved);
      window.removeEventListener('storage', onStorage);
      clearTimeout(debounceTimer);
    };
  });

  return (
    <div class="category-page docs-catalog">
      <header class="docs-catalog-header page-transition-fade">
        <Show when={props.title}>
          <div class="docs-catalog-heading">
            <h1 class="docs-catalog-title">{props.title}</h1>
            <div class="docs-catalog-status" aria-live="polite">
              <Show
                when={showNewStatus()}
                fallback={
                  <Show when={hasActiveFilters()}>
                    <span>
                      {filtered().length} {filtered().length === 1 ? 'component' : 'components'} found
                    </span>
                  </Show>
                }
              >
                <button
                  type="button"
                  aria-pressed={ariaBool(newOnly())}
                  title={newOnly() ? 'Show all components' : 'Show new components'}
                  onClick={() => setNewOnly(value => !value)}
                >
                  {newOnly() ? filtered().length : newSinceLastVisitCount()} new since your last visit
                </button>
              </Show>
            </div>
          </div>
        </Show>

        <div class="docs-catalog-toolbar" data-disabled={controlsDisabled() ? '' : undefined}>
          <label class="docs-search" data-disabled={controlsDisabled() ? '' : undefined}>
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.6} />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search components"
              value={search()}
              onInput={e => setSearch(e.currentTarget.value)}
              disabled={controlsDisabled()}
              tabindex={controlsDisabled() ? -1 : 0}
            />
          </label>

          <Show when={showCategoryFilter()}>
            <ToolbarSelect
              value={selectedCategory()}
              options={categoriesList}
              name="component-list-category-filter"
              width="180px"
              disabled={controlsDisabled()}
              onChange={setSelectedCategory}
            />
          </Show>

          <Show when={props.showSortControl && sortMode()}>
            <ToolbarSelect
              value={sortMode()!}
              options={SORT_OPTIONS}
              name="component-list-sort"
              width="130px"
              disabled={controlsDisabled()}
              onChange={setSortMode}
            />
          </Show>

          <div ref={el => (clearSlotEl = el)} class="docs-clear-slot">
            <button
              ref={el => (clearBtnEl = el)}
              type="button"
              aria-label="Clear filters"
              class="docs-tool docs-tool--icon docs-clear"
              tabindex={showClear() ? 0 : -1}
              style={{ 'pointer-events': showClear() ? 'auto' : 'none' }}
              onClick={clearFilters}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </header>

      <Show
        when={filtered().length > 0}
        fallback={
          <div class="docs-catalog-empty" role="status">
            <h2>{items().length > 0 ? 'No results...' : 'Nothing here yet...'}</h2>
            <p>{items().length > 0 ? 'Try adjusting your filters' : 'Tap the heart on any component to save it'}</p>
            <div class="docs-catalog-empty-actions">
              <Show
                when={items().length > 0}
                fallback={
                  <a href="/get-started/index" class="docs-pill-button">
                    Browse Components
                  </a>
                }
              >
                <button type="button" class="docs-pill-button" onClick={clearFilters}>
                  Clear Filters
                </button>
              </Show>
            </div>
          </div>
        }
      >
        <div class="docs-catalog-grid">
          <For each={filtered()}>
            {item => (
              <a
                href={pathFor(item)}
                data-item-key={item.key}
                role="group"
                class="browse-card"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => hoveredKey() === item.key && setHoveredKey(null)}
              >
                <div class="browse-card-media">
                  <LazyCardMedia
                    videoUrl={item.videoUrl}
                    title={item.title}
                    playing={previewMediaAllowed() && hoveredKey() === item.key}
                  />
                  <Show when={item.isNew || item.isNewSinceLastVisit}>
                    <span class="browse-card-badge">{item.isNewSinceLastVisit ? 'Since last visit' : 'New'}</span>
                  </Show>
                  <Show
                    when={props.hasDeleteButton}
                    fallback={
                      <Show when={props.hasFavoriteButton}>
                        <button
                          type="button"
                          aria-label={savedSet().has(item.key) ? 'Remove from favorites' : 'Add to favorites'}
                          class="browse-card-fav"
                          data-saved={savedSet().has(item.key) ? '' : undefined}
                          data-visible={savedSet().has(item.key) || hoveredKey() === item.key ? '' : undefined}
                          data-interactive={hoveredKey() === item.key ? '' : undefined}
                          onClick={event => toggleFavorite(event, item)}
                        >
                          <HeartIcon size={13} filled={savedSet().has(item.key)} />
                        </button>
                      </Show>
                    }
                  >
                    <button
                      type="button"
                      aria-label="Remove from favorites"
                      class="browse-card-fav browse-card-fav--delete"
                      data-visible={hoveredKey() === item.key ? '' : undefined}
                      data-interactive={hoveredKey() === item.key ? '' : undefined}
                      onClick={event => removeFavorite(event, item.key)}
                    >
                      <TrashIcon size={13} />
                    </button>
                  </Show>
                </div>
                <div class="browse-card-text">
                  <p class="browse-card-title">{item.title}</p>
                  <p class="browse-card-category">{item.categoryLabel}</p>
                </div>
              </a>
            )}
          </For>
        </div>
      </Show>

      <Show when={props.showDirectory && filtered().length > 0}>
        <details class="docs-directory">
          <summary>Browse by name</summary>
          <nav aria-label="Component directory">
            <ul>
              <For each={directory()}>
                {item => (
                  <li>
                    <a href={pathFor(item)}>{item.title}</a>
                  </li>
                )}
              </For>
            </ul>
          </nav>
        </details>
      </Show>
    </div>
  );
}
