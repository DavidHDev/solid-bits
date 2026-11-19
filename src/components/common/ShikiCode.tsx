import { Show, createEffect, createSignal } from 'solid-js';
import { highlightCode, peekHighlight } from '@/utils/shiki';
import { useTabs } from './previewStage';

export default function ShikiCode(props: { code: string; language?: string; showLineNumbers?: boolean }) {
  const tabs = useTabs();
  const source = () => String(props.code ?? '');
  const language = () => props.language ?? 'tsx';
  const visible = () => (tabs ? tabs.codeMounted() : true);
  const [html, setHtml] = createSignal<string>(() => peekHighlight(source(), language()));

  createEffect(
    () => [source(), language(), visible()] as const,
    ([code, lang, isVisible]) => {
      let active = true;
      setHtml(peekHighlight(code, lang));
      if (!isVisible) return;
      highlightCode(code, lang)
        .then(result => {
          if (active) setHtml(result);
        })
        .catch(error => console.error('Failed to highlight code with Shiki:', error));
      return () => {
        active = false;
      };
    }
  );

  return (
    <Show
      when={html()}
      fallback={
        <div class={['shiki-code is-loading', { 'has-line-numbers': props.showLineNumbers ?? true }]}>
          <pre class="shiki-fallback">
            <code>{source()}</code>
          </pre>
        </div>
      }
    >
      <div class={['shiki-code', { 'has-line-numbers': props.showLineNumbers ?? true }]} innerHTML={html()} />
    </Show>
  );
}
