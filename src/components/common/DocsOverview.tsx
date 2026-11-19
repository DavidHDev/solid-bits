import type { ComponentOverview } from '@/utils/catalog';

export default function DocsOverview(props: { overview: ComponentOverview }) {
  return (
    <header class="docs-overview">
      <h1 class="sub-category">{props.overview.heading}</h1>
      <p class="docs-overview-description" title={props.overview.intro}>
        {props.overview.intro}
      </p>
    </header>
  );
}
