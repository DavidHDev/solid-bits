import { Show, createEffect, createSignal } from 'solid-js';
import { useLocation } from '@solidjs/router';
import CodeCopyButton from './CodeCopyButton';
import ShikiCode from './ShikiCode';

const routeExpansionState: Record<string, Record<string, boolean>> = {};

const hashSnippet = (str: string) => {
  if (!str) return 'empty';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    if (i > 500) break;
  }
  return hash.toString(36);
};

export default function CodeHighlighter(props: {
  language?: string;
  codeString?: string | null;
  showLineNumbers?: boolean;
  maxLines?: number;
  snippetId?: string;
  showCopyButton?: boolean;
}) {
  const location = useLocation();
  const language = () => props.language ?? 'tsx';
  const maxLines = () => props.maxLines ?? 25;
  const key = () => props.snippetId || hashSnippet(`${props.codeString ?? ''}|${language()}`);
  const [expanded, setExpanded] = createSignal<boolean>(() => routeExpansionState[location.pathname]?.[key()] ?? false);

  createEffect(
    () => [expanded(), location.pathname, key()] as const,
    ([value, path, snippet]) => {
      if (!routeExpansionState[path]) routeExpansionState[path] = {};
      routeExpansionState[path][snippet] = value;
    }
  );

  const shouldCollapse = () => (props.codeString?.split('\n').length ?? 0) > maxLines();

  return (
    <div class="code-highlighter-root" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          'max-height': shouldCollapse() && !expanded() ? `calc(1.55em * ${maxLines()} + 2.5rem)` : 'none'
        }}
      >
        <Show
          when={props.codeString}
          fallback={
            <div
              class="code-unsupported"
              style={{ display: 'flex', 'align-items': 'center', gap: '8px', color: 'var(--text-dimmed)' }}
            >
              <span>Sorry, this combination is not supported</span>
            </div>
          }
        >
          <ShikiCode code={props.codeString!} language={language()} showLineNumbers={props.showLineNumbers ?? true} />
        </Show>
        <Show when={shouldCollapse() && !expanded()}>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to bottom, transparent, var(--code-bg))'
            }}
          />
        </Show>
        <Show when={shouldCollapse()}>
          <button type="button" class="docs-expand-button" onClick={() => setExpanded(value => !value)}>
            {expanded() ? 'Collapse Snippet' : 'Expand Snippet'}
          </button>
        </Show>
      </div>
      <Show when={props.codeString && (props.showCopyButton ?? true)}>
        <div class="docs-code-header">
          <CodeCopyButton codeString={props.codeString} />
        </div>
      </Show>
    </div>
  );
}
