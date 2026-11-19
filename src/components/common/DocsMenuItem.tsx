import type { JSX } from '@solidjs/web';
import { useDocsMenu } from './docsMenuContext';

export default function DocsMenuItem(props: {
  itemClass?: string;
  disabled?: boolean;
  keepOpen?: boolean;
  onSelect?: () => void;
  children: JSX.Element;
}) {
  const menu = useDocsMenu();
  const select = () => {
    if (props.disabled) return;
    props.onSelect?.();
    if (!props.keepOpen) menu?.close(true);
  };
  return (
    <div
      class={props.itemClass ?? 'docs-menu-item'}
      role="menuitem"
      data-part="item"
      data-disabled={props.disabled ? '' : undefined}
      tabindex="-1"
      onClick={select}
    >
      {props.children}
    </div>
  );
}
