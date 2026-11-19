import { createMemo, createSignal, onSettled } from 'solid-js';
import BackToTopButton from '@/components/common/BackToTopButton';
import ComponentList from '@/components/common/ComponentList';
import { componentMetadata, type ComponentMetadata } from '@/constants/Information';
import { getSavedComponents } from '@/utils/favorites';

export default function FavoritesPage() {
  const [savedKeys, setSavedKeys] = createSignal<string[]>(getSavedComponents());

  const savedList = createMemo<ComponentMetadata>(() =>
    Object.fromEntries(
      (savedKeys() || [])
        .filter(key => typeof key === 'string' && key.includes('/') && componentMetadata[key])
        .map(key => [key, componentMetadata[key]])
    )
  );

  onSettled(() => {
    document.title = 'Favorites - Solid Bits';
    const update = () => setSavedKeys(getSavedComponents());
    const onStorage = (event: StorageEvent) => {
      if (!event || event.key === 'savedComponents') update();
    };
    window.addEventListener('favorites:updated', update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('favorites:updated', update);
      window.removeEventListener('storage', onStorage);
    };
  });

  return (
    <div>
      <ComponentList title="Favorites" list={savedList()} hasDeleteButton sorting="none" />
      <BackToTopButton />
    </div>
  );
}
