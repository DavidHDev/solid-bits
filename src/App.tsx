import { Loading, Show } from 'solid-js';
import { lazy } from 'solid-js';
import Toaster from '@/components/common/Toaster';
import { installSearchShortcut, useSearch } from '@/hooks/useSearch';
import { installThemeShortcut } from '@/hooks/useTheme';
import { Router } from './router';

const SearchDialog = lazy(() => import('@/components/common/SearchDialog'));

installThemeShortcut();
installSearchShortcut();

export default function App() {
  const { mounted } = useSearch();
  return (
    <Router>
      {props => (
        <>
          <Loading fallback={null}>{props.children}</Loading>
          <Show when={mounted()}>
            <Loading fallback={null}>
              <SearchDialog />
            </Loading>
          </Show>
          <Toaster />
        </>
      )}
    </Router>
  );
}
