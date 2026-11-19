import { For, Show, createSignal } from 'solid-js';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import DocsMenu from './DocsMenu';
import DocsMenuItem from './DocsMenuItem';

export default function ToolbarSelect(props: {
  value: string;
  options: string[];
  name?: string;
  width?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  let rootEl: HTMLDivElement | undefined;
  const [menuWidth, setMenuWidth] = createSignal<string | undefined>(undefined);

  return (
    <div ref={el => (rootEl = el)} class="docs-select" style={{ '--docs-select-width': props.width ?? '180px' }}>
      <DocsMenu
        placement="bottom-start"
        gutter={8}
        minWidth={menuWidth()}
        onOpenChange={open => {
          if (open && rootEl) setMenuWidth(`${rootEl.offsetWidth}px`);
        }}
        trigger={
          <button
            type="button"
            class="docs-tool docs-select-trigger"
            name={props.name}
            disabled={props.disabled}
            aria-haspopup="listbox"
          >
            <span class="docs-select-value">{props.value}</span>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} class="docs-tool-chevron" />
          </button>
        }
      >
        <For each={props.options}>
          {option => (
            <DocsMenuItem onSelect={() => props.onChange(option)}>
              {option}
              <Show when={option === props.value}>
                <span class="docs-menu-check">
                  <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={1.6} />
                </span>
              </Show>
            </DocsMenuItem>
          )}
        </For>
      </DocsMenu>
    </div>
  );
}
