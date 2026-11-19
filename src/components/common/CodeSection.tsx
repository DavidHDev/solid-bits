import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import CodeCopyButton from './CodeCopyButton';

export default function CodeSection(props: {
  title: string;
  note?: string | null;
  copy?: string | null;
  class?: string;
  actions?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <section class={['code-section-frame', props.class]}>
      <header class="code-section-heading">
        <div class="code-section-title-group">
          <h2>{props.title}</h2>
          <Show when={props.note}>
            <span class="code-section-note">{props.note}</span>
          </Show>
        </div>
        <Show when={props.actions || props.copy}>
          <div class="code-section-actions">
            {props.actions}
            <Show when={props.copy}>
              <CodeCopyButton codeString={props.copy} />
            </Show>
          </div>
        </Show>
      </header>
      <div class="code-section-body">{props.children}</div>
    </section>
  );
}
