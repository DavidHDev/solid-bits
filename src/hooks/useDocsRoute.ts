import { useParams } from '@solidjs/router';

export function useDocsRoute() {
  const params = useParams<{ category?: string; subcategory?: string }>();
  return {
    category: () => params.category ?? '',
    subcategory: () => params.subcategory ?? ''
  };
}
