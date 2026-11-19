import { For, Show, createMemo } from 'solid-js';
import { PRO_ASSET_BASE, PRO_CATEGORIES } from '@/constants/Pro';
import { proLinkProps } from '@/utils/pro';
import ProMedia from './ProMedia';

const PLACEMENT = 'docs-related-pro';

const ArrowUpRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

export default function CategoryProFooter(props: { category: string }) {
  const collection = createMemo(() => PRO_CATEGORIES[props.category]);
  const items = createMemo(() =>
    (collection()?.items ?? []).slice(0, 4).map(item => ({ item, link: proLinkProps(item.href, PLACEMENT) }))
  );
  const allLink = createMemo(() => {
    const value = collection();
    return value ? proLinkProps(value.path, PLACEMENT) : null;
  });

  return (
    <Show when={collection() && items().length && allLink()}>
      <section class="cat-pro" aria-label="Related React components from React Bits Pro">
        <div class="cat-pro-heading">
          <div>
            <h2>
              More {collection()!.noun} in React Bits Pro
              <span class="cat-pro-tag">React</span>
            </h2>
            <Show when={collection()!.pitch}>
              <p>{collection()!.pitch}</p>
            </Show>
          </div>
          <a class="cat-pro-all" {...allLink()!}>
            View all {collection()!.count}
            <ArrowUpRightIcon />
          </a>
        </div>
        <div class="cat-pro-grid">
          <For each={items()}>
            {entry => (
              <a class="cat-pro-item" {...entry.link}>
                <ProMedia item={entry.item} baseUrl={PRO_ASSET_BASE} />
                <span class="cat-pro-item-name">
                  {entry.item.name}
                  <ArrowUpRightIcon />
                </span>
              </a>
            )}
          </For>
        </div>
      </section>
    </Show>
  );
}
