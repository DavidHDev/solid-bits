import { Loading, Match, Switch, createEffect, createMemo, type Component } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import { useLocation, useNavigate } from '@solidjs/router';
import { lazy } from 'solid-js';
import BackToTopButton from '@/components/common/BackToTopButton';
import DocsOverview from '@/components/common/DocsOverview';
import { CATEGORIES } from '@/constants/Categories';
import { componentMap } from '@/constants/Components';
import { useDocsRoute } from '@/hooks/useDocsRoute';
import { getComponentOverviewByPath, toSlug } from '@/utils/catalog';
import { findComponentBySlug } from '@/utils/routeMatch';
import { decodeLabel } from '@/utils/utils';
import IndexPage from './IndexPage';
import NotFoundPage from './NotFoundPage';

const DOCS_CATEGORIES = new Set(CATEGORIES.map(category => toSlug(category.name)));

const lazyCache = new Map<string, Component>();

const pageFor = (slug: string): Component | null => {
  const loader = componentMap[slug];
  if (!loader) return null;
  let page = lazyCache.get(slug);
  if (!page) {
    page = lazy(loader);
    lazyCache.set(slug, page);
  }
  return page;
};

export default function CategoryPage() {
  const route = useDocsRoute();
  const location = useLocation();
  const navigate = useNavigate();

  const category = route.category;
  const sub = route.subcategory;
  const focusPrefix = () => (location.pathname.startsWith('/c/') ? '/c' : '');
  const niceName = () =>
    CATEGORIES.find(entry => toSlug(entry.name) === category())?.subcategories.find(label => toSlug(label) === sub()) ??
    decodeLabel(sub());
  const isGetStarted = () => category() === 'get-started';
  const isIndexPage = () => sub() === 'index';
  const overview = createMemo(() => getComponentOverviewByPath(`/${category()}/${sub()}`));

  const redirect = createMemo(() => {
    const cat = category();
    const slug = sub();
    if (slug === 'index') {
      if (cat === 'get-started') return null;
      return DOCS_CATEGORIES.has(cat) ? `/c/${cat}` : null;
    }
    const match = findComponentBySlug(slug);
    if (match && match.path !== `/${cat}/${slug}`) return `${focusPrefix()}${match.path}`;
    return null;
  });

  const status = createMemo<'redirect' | 'index' | 'missing' | 'page'>(() => {
    if (redirect()) return 'redirect';
    const cat = category();
    const slug = sub();
    if (!DOCS_CATEGORIES.has(cat)) return 'missing';
    if (slug === 'index') return cat === 'get-started' ? 'index' : 'missing';
    if (componentMap[slug]) return 'page';
    return 'missing';
  });

  createEffect(
    () => (redirect() ? `${redirect()}${location.search}${location.hash}` : null),
    target => {
      if (target) navigate(target, { replace: true });
    }
  );

  createEffect(
    () => [isIndexPage(), overview()?.heading ?? niceName(), status()] as const,
    ([index, title, state]) => {
      if (index) return;
      if (state === 'missing') document.title = 'Page not found | Solid Bits';
      else if (title) document.title = `${title} - Solid Bits`;
    }
  );

  const page = createMemo(() => (status() === 'page' ? pageFor(sub()) : null));

  return (
    <Switch>
      <Match when={status() === 'index'}>
        <IndexPage />
      </Match>
      <Match when={status() === 'missing'}>
        <NotFoundPage embedded />
      </Match>
      <Match when={status() !== 'redirect'}>
        <div class={['category-page', `category-${category()}`]}>
          {overview() ? <DocsOverview overview={overview()!} /> : null}
          <Switch>
            <Match when={page()}>
              {current => (
                <Loading fallback={<div class="sb-page-loading" />}>
                  <Dynamic component={current()} />
                </Loading>
              )}
            </Match>
            <Match when={!overview() && !isGetStarted()}>
              <h1 class="sub-category">{niceName()}</h1>
            </Match>
          </Switch>
          <BackToTopButton />
        </div>
      </Match>
    </Switch>
  );
}
