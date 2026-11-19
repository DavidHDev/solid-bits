import { ariaBool } from '@/utils/aria';
import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Portal } from '@solidjs/web';
import { useNavigate } from '@solidjs/router';
import {
  ArrowTurnBackwardIcon,
  File01Icon,
  Image01Icon,
  Motion01Icon,
  MousePointerClickIcon,
  PuzzleIcon,
  Search01Icon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { useSearch } from '@/hooks/useSearch';
import { CATEGORIES } from '@/constants/Categories';
import { componentMetadata } from '@/constants/Information';
import { getComponentMatchLabel, rankComponentSearch } from '@/utils/componentSearch';

type Result = { categoryName: string; componentName: string; matchLabel: string; score: number };

const CATEGORY_ICONS: Record<string, IconSvgElement> = {
  'Get Started': File01Icon,
  'Text Animations': TextFontIcon,
  Animations: Motion01Icon,
  Components: PuzzleIcon,
  Micro: MousePointerClickIcon,
  Backgrounds: Image01Icon
};

const slug = (value: string) => value.replace(/\s+/g, '-').toLowerCase();

const pathOf = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const metadataByPath = new Map(Object.values(componentMetadata).map(meta => [pathOf(meta.docsUrl), meta]));

function searchComponents(query: string): Result[] {
  if (!query || query.trim() === '') return [];
  const results: Result[] = [];
  CATEGORIES.forEach(category => {
    const { name: categoryName, subcategories } = category;
    if (categoryName === 'Get Started') return;
    subcategories.forEach(componentName => {
      const metadata = metadataByPath.get(`/${slug(categoryName)}/${slug(componentName)}`);
      const match = rankComponentSearch(
        { title: componentName, categoryLabel: categoryName, description: metadata?.description, tags: metadata?.tags },
        query
      );
      if (match) {
        results.push({
          categoryName,
          componentName,
          matchLabel: getComponentMatchLabel(categoryName, match.type),
          score: match.score
        });
      }
    });
  });
  return results.sort((a, b) => b.score - a.score || a.componentName.localeCompare(b.componentName)).slice(0, 8);
}

export default function SearchDialog() {
  const { isSearchOpen, closeSearch } = useSearch();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = createSignal('');
  const [searchValue, setSearchValue] = createSignal('');
  const [topGradientOpacity, setTopGradientOpacity] = createSignal(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = createSignal(1);
  const [selectedIndex, setSelectedIndex] = createSignal(-1);
  const [highlight, setHighlight] = createSignal<{
    y: number;
    height: number;
    visible: boolean;
    ready: boolean;
  } | null>(null);
  let keyboardNav = false;
  let resultsEl: HTMLDivElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const results = createMemo(() => searchComponents(searchValue()));

  const onInput = (value: string) => {
    setInputValue(value);
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      setSearchValue(value);
      setSelectedIndex(-1);
    }, 180);
  };

  const handleScroll = (event: Event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget as HTMLElement;
    setTopGradientOpacity(Math.min(scrollTop / 50, 1));
    const bottomDist = scrollHeight - (scrollTop + clientHeight);
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDist / 50, 1));
  };

  const reset = () => {
    clearTimeout(debounce);
    setInputValue('');
    setSearchValue('');
    setSelectedIndex(-1);
  };

  const handleSelect = (result: Result | undefined) => {
    if (!result) return;
    navigate(`/${slug(result.categoryName)}/${slug(result.componentName)}`);
    reset();
    closeSearch();
  };

  createEffect(results, () => {
    requestAnimationFrame(() => {
      if (!resultsEl) return;
      const { scrollTop, scrollHeight, clientHeight } = resultsEl;
      setBottomGradientOpacity(
        scrollHeight <= clientHeight ? 0 : Math.min((scrollHeight - (scrollTop + clientHeight)) / 50, 1)
      );
    });
  });

  createEffect(
    () => [selectedIndex(), results()] as const,
    ([index]) => {
      const frame = requestAnimationFrame(() => {
        const row = index >= 0 ? resultsEl?.querySelector<HTMLElement>(`[data-index="${index}"]`) : null;
        const previous = highlight();
        if (!row) setHighlight(previous ? { ...previous, visible: false } : null);
        else setHighlight({ y: row.offsetTop, height: row.offsetHeight, visible: true, ready: Boolean(previous) });
        if (!keyboardNav || !row || !resultsEl) return;
        const container = resultsEl;
        const margin = 50;
        const itemTop = row.offsetTop;
        const itemBottom = itemTop + row.offsetHeight;
        if (itemTop < container.scrollTop + margin) {
          container.scrollTo({ top: itemTop - margin, behavior: 'smooth' });
        } else if (itemBottom > container.scrollTop + container.clientHeight - margin) {
          container.scrollTo({ top: itemBottom - container.clientHeight + margin, behavior: 'smooth' });
        }
        keyboardNav = false;
      });
      return () => cancelAnimationFrame(frame);
    }
  );

  createEffect(isSearchOpen, open => {
    if (open) {
      const timer = setTimeout(() => inputEl?.focus(), 50);
      return () => clearTimeout(timer);
    }
    reset();
    setHighlight(null);
    setTopGradientOpacity(0);
    setBottomGradientOpacity(1);
  });

  onSettled(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isSearchOpen() || !searchValue()) return;
      if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
        event.preventDefault();
        keyboardNav = true;
        setSelectedIndex(Math.min(selectedIndex() + 1, results().length - 1));
      } else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
        event.preventDefault();
        keyboardNav = true;
        setSelectedIndex(Math.max(selectedIndex() - 1, 0));
      } else if (event.key === 'Enter' && selectedIndex() >= 0) {
        event.preventDefault();
        handleSelect(results()[selectedIndex()]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(debounce);
    };
  });

  return (
    <Show when={isSearchOpen()}>
      <Portal>
        <div class="search-backdrop" onClick={closeSearch}>
          <div class="search-dialog" role="dialog" aria-label="Search" onClick={event => event.stopPropagation()}>
            <div class="search-input-row">
              <span class="search-input-icon">
                <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.6} />
              </span>
              <input
                ref={el => (inputEl = el)}
                value={inputValue()}
                onInput={event => onInput(event.currentTarget.value)}
                class="search-input"
                placeholder="Search components, categories, or keywords..."
                aria-label="Search"
              />
              <kbd class="search-kbd" onClick={closeSearch}>
                esc
              </kbd>
            </div>

            <Show when={searchValue()}>
              <div class="search-results-wrapper">
                <div ref={el => (resultsEl = el)} class="search-results" role="listbox" onScroll={handleScroll}>
                  <Show
                    when={results().length > 0}
                    fallback={
                      <p class="search-no-results">
                        No results for <strong>{searchValue()}</strong>
                      </p>
                    }
                  >
                    <span
                      class="search-highlight"
                      aria-hidden="true"
                      data-ready={highlight()?.ready ? '' : undefined}
                      style={
                        highlight()
                          ? {
                              height: `${highlight()!.height}px`,
                              transform: `translateY(${highlight()!.y}px)`,
                              opacity: highlight()!.visible ? 1 : 0
                            }
                          : { opacity: 0 }
                      }
                    />
                    <div class="search-group-label">Solid Bits</div>
                    <For each={results()}>
                      {(result, index) => (
                        <div
                          class="search-row"
                          data-index={index()}
                          data-selected={index() === selectedIndex() ? '' : undefined}
                          role="option"
                          aria-selected={ariaBool(index() === selectedIndex())}
                          onMouseMove={() => index() !== selectedIndex() && setSelectedIndex(index())}
                          onClick={() => handleSelect(result)}
                        >
                          <span class="search-row-icon">
                            <HugeiconsIcon
                              icon={CATEGORY_ICONS[result.categoryName] ?? Search01Icon}
                              size={16}
                              strokeWidth={1.6}
                            />
                          </span>
                          <span class="search-row-text">
                            <span class="search-row-title">{result.componentName}</span>
                            <span class="search-row-meta">{result.matchLabel}</span>
                          </span>
                          <span class="search-row-trail">
                            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} strokeWidth={1.6} />
                          </span>
                        </div>
                      )}
                    </For>
                  </Show>
                </div>
                <div class="search-gradient search-gradient-top" style={{ opacity: topGradientOpacity() }} />
                <div class="search-gradient search-gradient-bottom" style={{ opacity: bottomGradientOpacity() }} />
              </div>
            </Show>

            <div class="search-footer">
              <div class="search-hints" aria-hidden="true">
                <span>
                  <kbd>↑</kbd>
                  <kbd>↓</kbd>
                  Navigate
                </span>
                <span>
                  <kbd>↵</kbd>
                  Open
                </span>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
