import { lazy } from 'solid-js';
import { createRouter } from '@solidjs/router';
import DocsLayout from '@/components/layouts/DocsLayout';
import LandingPage from '@/pages/LandingPage';
import ChangelogRedirect from '@/pages/ChangelogRedirect';
import { CATEGORIES } from '@/constants/Categories';
import { componentMap, componentSlugs } from '@/constants/Components';
import { toSlug } from '@/utils/catalog';
import { findComponentBySlug } from '@/utils/routeMatch';

const DOCS_CATEGORIES = new Set(CATEGORIES.map(category => toSlug(category.name)));

const isDocsCategory = (category: string) => DOCS_CATEGORIES.has(category);
const isCategoryIndex = (category: string) => category !== 'get-started' && DOCS_CATEGORIES.has(category);
const isDocsPage = (slug: string) =>
  slug === 'index' || slug in componentMap || componentSlugs.has(slug) || Boolean(findComponentBySlug(slug));

const PAGE_FILTERS = { category: isDocsCategory, subcategory: isDocsPage };

export const Router = createRouter({
  routes: [
    { path: '/', component: LandingPage },
    { path: '/changelog', component: ChangelogRedirect },
    {
      component: DocsLayout,
      children: [
        {
          path: '/c/:category',
          matchFilters: { category: isCategoryIndex },
          component: lazy(() => import('@/pages/CategoryIndexPage'))
        },
        {
          path: '/c/:category/:subcategory',
          matchFilters: PAGE_FILTERS,
          component: lazy(() => import('@/pages/CategoryPage'))
        },
        { path: '/favorites', component: lazy(() => import('@/pages/FavoritesPage')) },
        {
          path: '/:category/:subcategory',
          matchFilters: PAGE_FILTERS,
          component: lazy(() => import('@/pages/CategoryPage'))
        }
      ]
    },
    { path: '*404', component: lazy(() => import('@/pages/NotFoundPage')) }
  ]
});
