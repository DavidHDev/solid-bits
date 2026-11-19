import { Show } from 'solid-js';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons/Icons';

type DocsLink = { label: string; route: string };

export default function DocsButtonBar(props: { next?: DocsLink | null; previous?: DocsLink | null }) {
  return (
    <div class="docs-button-bar">
      <Show when={props.previous}>
        {previous => (
          <a href={previous().route} class="docs-button docs-button-primary">
            <ArrowLeftIcon size={13} />
            <span>{previous().label}</span>
          </a>
        )}
      </Show>
      <Show when={props.next}>
        {next => (
          <a href={next().route} class="docs-button docs-button-secondary">
            <span>{next().label}</span>
            <ArrowRightIcon size={13} />
          </a>
        )}
      </Show>
    </div>
  );
}
