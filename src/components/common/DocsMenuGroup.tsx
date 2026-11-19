import type { JSX } from '@solidjs/web';

export default function DocsMenuGroup(props: { label: string; children: JSX.Element }) {
  return (
    <div class="docs-menu-group" role="group">
      <div class="docs-menu-label">{props.label}</div>
      {props.children}
    </div>
  );
}
