import { Show } from 'solid-js';
import { ArrowDown01Icon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import type { AIMenuItem } from '@/hooks/useAIExportActions';
import AIMenuSections from './AIMenuSections';
import DocsMenu from './DocsMenu';

export default function CopyForAIMenu(props: {
  copyItems: AIMenuItem[];
  openItems: AIMenuItem[];
  done: string | null;
  zIndex?: number;
}) {
  return (
    <DocsMenu
      placement="bottom-end"
      gutter={8}
      minWidth="236px"
      zIndex={props.zIndex ?? 1500}
      trigger={
        <button type="button" class="docs-tool" aria-label="Copy for AI">
          <Show
            when={props.done}
            fallback={<HugeiconsIcon icon={Copy01Icon as IconSvgElement} size={16} strokeWidth={1.6} />}
          >
            <span class="docs-menu-icon docs-tool-done">
              <HugeiconsIcon icon={Tick02Icon as IconSvgElement} size={16} strokeWidth={1.6} />
            </span>
          </Show>
          {props.done ? 'Copied' : 'Copy for AI'}
          <HugeiconsIcon
            icon={ArrowDown01Icon as IconSvgElement}
            size={14}
            strokeWidth={1.8}
            class="docs-tool-chevron"
          />
        </button>
      }
    >
      <AIMenuSections copyItems={props.copyItems} openItems={props.openItems} done={props.done} />
    </DocsMenu>
  );
}
