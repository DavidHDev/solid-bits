import { For, Show } from 'solid-js';
import { ArrowUpRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { VercelIcon } from '@/components/icons/Icons';
import type { AIMenuItem } from '@/hooks/useAIExportActions';
import DocsMenuGroup from './DocsMenuGroup';
import DocsMenuItem from './DocsMenuItem';

const MenuIcon = (props: { icon: AIMenuItem['icon']; size: number }) => (
  <Show when={props.icon !== 'vercel'} fallback={<VercelIcon size={props.size - 2} />}>
    <HugeiconsIcon icon={props.icon as IconSvgElement} size={props.size} strokeWidth={1.6} />
  </Show>
);

export default function AIMenuSections(props: {
  copyItems: AIMenuItem[];
  openItems: AIMenuItem[];
  done: string | null;
}) {
  return (
    <>
      <DocsMenuGroup label="Copy">
        <For each={props.copyItems}>
          {item => (
            <DocsMenuItem onSelect={() => item.run()}>
              <Show
                when={props.done === item.key}
                fallback={
                  <span class="docs-menu-icon">
                    <MenuIcon icon={item.icon} size={16} />
                  </span>
                }
              >
                <span class="docs-menu-icon docs-tool-done">
                  <HugeiconsIcon icon={Tick02Icon as IconSvgElement} size={16} strokeWidth={1.6} />
                </span>
              </Show>
              {props.done === item.key ? 'Copied' : item.label}
            </DocsMenuItem>
          )}
        </For>
      </DocsMenuGroup>
      <DocsMenuGroup label="Open in">
        <For each={props.openItems}>
          {item => (
            <DocsMenuItem onSelect={() => item.run()}>
              <span class="docs-menu-icon">
                <MenuIcon icon={item.icon} size={15} />
              </span>
              {item.label}
              <span class="docs-menu-trail">
                <HugeiconsIcon icon={ArrowUpRight01Icon as IconSvgElement} size={14} strokeWidth={1.8} />
              </span>
            </DocsMenuItem>
          )}
        </For>
      </DocsMenuGroup>
    </>
  );
}
