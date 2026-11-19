import { For, Show, createMemo, createSignal, onSettled } from 'solid-js';
import { Portal } from '@solidjs/web';
import { useLocation } from '@solidjs/router';
import { LayoutGridIcon, SearchIcon } from '@/components/icons/Icons';
import ProIcon from '@/components/common/Pro/ProIcon';
import { CATEGORIES, TOTAL_COMPONENTS } from '@/constants/Categories';
import { PRO_FREE_COUNTS, PRO_SECTIONS } from '@/constants/Pro';
import { proLinkProps } from '@/utils/pro';

const PRO_LINKS = PRO_SECTIONS.map(section => ({
  slug: section.slug,
  icon: section.icon,
  label: section.sidebarLabel || section.label,
  free: PRO_FREE_COUNTS[section.countKey] || 0,
  link: proLinkProps(section.proPath, 'sidebar-mobile')
}));

const slugify = (value: string) => value.replace(/\s+/g, '-').toLowerCase();
const pathFor = (category: string, sub: string) => `/${slugify(category)}/${slugify(sub)}`;

export default function DocsMobileMenu(props: { onClose: () => void }) {
  const location = useLocation();
  const [filter, setFilter] = createSignal('');
  const query = () => filter().trim().toLowerCase();
  const onIndexPage = () => location.pathname === '/get-started/index';

  const categories = createMemo(() =>
    CATEGORIES.map((category, index) => ({
      ...category,
      index,
      subcategories:
        query() && !category.name.toLowerCase().includes(query())
          ? category.subcategories.filter(item => item.toLowerCase().includes(query()))
          : category.subcategories
    }))
  );
  const showFavorites = () => !query() || 'favorites saved'.includes(query());
  const hasResults = () => showFavorites() || categories().some(category => category.subcategories.length > 0);

  onSettled(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  });

  return (
    <Portal>
      <div class="ln-navbar-mobile-backdrop" onClick={() => props.onClose()} />
      <div class="ln-navbar-mobile-menu ln-navbar-mobile-menu-docs">
        <div class="ln-navbar-mobile-scroll">
          <a
            class="sidebar-browse sidebar-browse--menu"
            href="/get-started/index"
            aria-current={onIndexPage() ? 'page' : undefined}
            tabindex={onIndexPage() ? -1 : undefined}
            onClick={() => props.onClose()}
          >
            <LayoutGridIcon size={14} class="sidebar-browse__icon" />
            <span class="sidebar-browse__label">
              {onIndexPage() ? 'Viewing all components' : 'Browse all components'}
            </span>
          </a>
          <label class="ln-navbar-mobile-filter">
            <SearchIcon size={14} />
            <input
              value={filter()}
              onInput={e => setFilter(e.currentTarget.value)}
              placeholder={`Filter ${TOTAL_COMPONENTS} components...`}
              aria-label="Filter navigation"
            />
          </label>
          <For each={categories()}>
            {cat => (
              <>
                <div class="ln-navbar-mobile-section">
                  <Show when={cat.subcategories.length > 0 || (cat.index === 0 && showFavorites())}>
                    <span class="ln-navbar-mobile-label">{cat.name}</span>
                    <div class="ln-navbar-mobile-group">
                      <For each={cat.subcategories}>
                        {sub => (
                          <a
                            class={[
                              'ln-navbar-mobile-link',
                              { 'ln-navbar-mobile-link-active': location.pathname === pathFor(cat.name, sub) }
                            ]}
                            href={pathFor(cat.name, sub)}
                            onClick={() => props.onClose()}
                          >
                            {sub}
                          </a>
                        )}
                      </For>
                      <Show when={cat.index === 0 && showFavorites()}>
                        <a
                          class={[
                            'ln-navbar-mobile-link',
                            { 'ln-navbar-mobile-link-active': location.pathname === '/favorites' }
                          ]}
                          href="/favorites"
                          onClick={() => props.onClose()}
                        >
                          Favorites
                        </a>
                      </Show>
                    </div>
                  </Show>
                </div>
                <Show when={cat.index === 0 && !query()}>
                  <div class="ln-navbar-mobile-section">
                    <span class="ln-navbar-mobile-label">React Bits Pro</span>
                    <div class="ln-navbar-mobile-group">
                      <For each={PRO_LINKS}>
                        {section => (
                          <a
                            class="ln-navbar-mobile-link ln-navbar-mobile-pro-link"
                            {...section.link}
                            onClick={() => props.onClose()}
                          >
                            <ProIcon name={section.icon} size={14} class="ln-navbar-mobile-pro-icon" />
                            <span>{section.label}</span>
                            <Show when={section.free}>
                              <span class="ln-navbar-mobile-pro-tag">{section.free} free</span>
                            </Show>
                          </a>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </>
            )}
          </For>
          <Show when={!hasResults()}>
            <p class="ln-navbar-mobile-empty">No matching pages</p>
          </Show>
        </div>
      </div>
    </Portal>
  );
}
