import { Show, createMemo, onSettled } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/Icons';
import { CATEGORIES, slug } from '@/constants/Categories';

type PagerItem = { category: string; component: string; path: string };

const SHORTCUTS = { previous: '[', next: ']' } as const;

const routes: PagerItem[] = CATEGORIES.filter(category => category.name !== 'Get Started').flatMap(category =>
  category.subcategories.map(component => ({
    category: category.name,
    component,
    path: `/${slug(category.name)}/${slug(component)}`
  }))
);

const isEditable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    Boolean(target.closest('[role="textbox"], [role="combobox"], [contenteditable="true"]')));

export default function ComponentPager(props: { category: string; subcategory: string }) {
  const navigate = useNavigate();
  const index = createMemo(() => routes.findIndex(item => item.path === `/${props.category}/${props.subcategory}`));
  const previous = createMemo(() => (index() > 0 ? routes[index() - 1] : null));
  const next = createMemo(() => (index() >= 0 ? (routes[index() + 1] ?? null) : null));

  onSettled(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (index() < 0) return;
      if (event.defaultPrevented || event.repeat || event.isComposing) return;
      if (event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return;
      const target = event.key === SHORTCUTS.previous ? previous() : event.key === SHORTCUTS.next ? next() : null;
      if (!target) return;
      event.preventDefault();
      navigate(target.path);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <Show when={index() >= 0}>
      <nav class="component-pager" aria-label="Component navigation">
        <Show
          when={previous()}
          fallback={
            <span class="component-pager-empty component-pager-previous">
              <span>
                <span class="component-pager-label">Collection</span>
                <span class="component-pager-name">Start of library</span>
              </span>
            </span>
          }
        >
          {item => (
            <a
              class="component-pager-link component-pager-previous"
              href={item().path}
              aria-keyshortcuts={SHORTCUTS.previous}
            >
              <ArrowLeftIcon size={16} />
              <span>
                <span class="component-pager-label">
                  Previous
                  <kbd class="component-pager-key" aria-hidden="true">
                    {SHORTCUTS.previous}
                  </kbd>
                </span>
                <span class="component-pager-name">{item().component}</span>
              </span>
            </a>
          )}
        </Show>
        <Show
          when={next()}
          fallback={
            <span class="component-pager-empty component-pager-next">
              <span>
                <span class="component-pager-label">Collection</span>
                <span class="component-pager-name">End of library</span>
              </span>
            </span>
          }
        >
          {item => (
            <a class="component-pager-link component-pager-next" href={item().path} aria-keyshortcuts={SHORTCUTS.next}>
              <span>
                <span class="component-pager-label">
                  Next
                  <kbd class="component-pager-key" aria-hidden="true">
                    {SHORTCUTS.next}
                  </kbd>
                </span>
                <span class="component-pager-name">{item().component}</span>
              </span>
              <ArrowRightIcon size={16} />
            </a>
          )}
        </Show>
      </nav>
    </Show>
  );
}
