import { For } from 'solid-js';
import { ArrowRightIcon } from '@/components/icons/Icons';
import type { ComponentOverview } from '@/utils/catalog';

export default function RelatedComponents(props: { overview: ComponentOverview }) {
  return (
    <section class="docs-related customize-frame" aria-labelledby="related-components-heading">
      <div class="customize-heading">
        <h2 id="related-components-heading">Related components</h2>
        <a
          href={props.overview.category.path}
          class="customize-heading-action"
          aria-label={`View all ${props.overview.category.name.toLowerCase()}`}
        >
          View all
          <ArrowRightIcon size={14} />
        </a>
      </div>
      <div class="docs-related-grid">
        <For each={props.overview.related}>
          {item => (
            <a href={item.path} class="docs-related-card component-pager-link" title={item.name}>
              <span class="component-pager-name">{item.name}</span>
              <ArrowRightIcon size={16} />
            </a>
          )}
        </For>
      </div>
    </section>
  );
}
