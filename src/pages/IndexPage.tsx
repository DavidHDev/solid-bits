import { onSettled } from 'solid-js';
import BackToTopButton from '@/components/common/BackToTopButton';
import ComponentList from '@/components/common/ComponentList';
import { useNewSinceLastVisit } from '@/hooks/useNewSinceLastVisit';
import { componentMetadata } from '@/constants/Information';

export default function IndexPage() {
  const newSinceLastVisit = useNewSinceLastVisit(
    Object.keys(componentMetadata).filter(key => !componentMetadata[key].hidden)
  );
  onSettled(() => {
    document.title = 'Browse Free Solid Components | Solid Bits';
  });
  return (
    <div>
      <ComponentList
        title="Components"
        list={componentMetadata}
        hasFavoriteButton
        sorting="newest"
        showSortControl
        newSinceLastVisit={newSinceLastVisit}
        showDirectory
      />
      <BackToTopButton />
    </div>
  );
}
