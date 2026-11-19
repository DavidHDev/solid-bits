import type { JSX } from '@solidjs/web';

export default function DocsStep(props: { index: number; title: string; children?: JSX.Element }) {
  return (
    <li class="docs-step">
      <h3 class="docs-step-title">
        <span class="docs-step-marker" aria-hidden="true">
          {props.index}
        </span>
        {props.title}
      </h3>
      {props.children}
    </li>
  );
}
