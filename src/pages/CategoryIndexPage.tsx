import { Show, createEffect, createMemo } from 'solid-js';
import BackToTopButton from '@/components/common/BackToTopButton';
import ComponentList from '@/components/common/ComponentList';
import { useDocsRoute } from '@/hooks/useDocsRoute';
import { useNewSinceLastVisit } from '@/hooks/useNewSinceLastVisit';
import { componentMetadata, type ComponentMetadata } from '@/constants/Information';
import NotFoundPage from './NotFoundPage';

const CATEGORY_KEYS: Record<string, { key: string; heading: string; title: string }> = {
  components: { key: 'Components', heading: 'Components', title: 'Interactive Solid UI Components' },
  animations: { key: 'Animations', heading: 'Animations', title: 'Solid Animation Effects' },
  backgrounds: { key: 'Backgrounds', heading: 'Backgrounds', title: 'Animated Solid Backgrounds' },
  'text-animations': { key: 'TextAnimations', heading: 'Text Animations', title: 'Solid Text Animations' },
  micro: { key: 'Micro', heading: 'Micro Interactions', title: 'Solid Micro Interactions' }
};

export default function CategoryIndexPage() {
  const route = useDocsRoute();
  const entry = createMemo(() => CATEGORY_KEYS[route.category()]);
  const list = createMemo<ComponentMetadata>(() =>
    Object.fromEntries(
      Object.entries(componentMetadata).filter(([, meta]) => meta.category === entry()?.key && !meta.hidden)
    )
  );
  const newSinceLastVisit = useNewSinceLastVisit(
    Object.keys(componentMetadata).filter(name => !componentMetadata[name].hidden)
  );

  createEffect(entry, value => {
    document.title = value ? `${value.title} | Solid Bits` : 'Category not found | Solid Bits';
  });

  return (
    <Show when={entry()} keyed fallback={<NotFoundPage embedded />}>
      {value => (
        <div>
          <ComponentList
            title={value.heading}
            list={list()}
            hasFavoriteButton
            sorting="alphabetical"
            showSortControl
            newSinceLastVisit={newSinceLastVisit}
            basePath="/c"
            showCategoryFilter={false}
            showDirectory
          />
          <BackToTopButton />
        </div>
      )}
    </Show>
  );
}
