import { For, Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import DocsCopyButton from './DocsCopyButton';

export type CommandItem = { key: string; label: string; command: string };

export default function CommandList(props: {
  items: CommandItem[];
  icon?: (item: CommandItem) => JSX.Element;
  note?: (item: CommandItem) => JSX.Element;
}) {
  return (
    <ul class="docs-cmds">
      <For each={props.items}>
        {item => (
          <li class="docs-cmd">
            <span class="docs-cmd-head">
              {props.icon?.(item)}
              {item.label}
            </span>
            <span class={['docs-cmd-line', { 'is-block': item.command.includes('\n') }]}>
              <code class="docs-cmd-code">{item.command}</code>
              <DocsCopyButton text={item.command} />
            </span>
            <Show when={props.note}>
              <span class="docs-cmd-note">{props.note!(item)}</span>
            </Show>
          </li>
        )}
      </For>
    </ul>
  );
}
