import { For, Show, createMemo } from 'solid-js';
import { useComponentPropsContext } from '@/components/context/ComponentPropsContext';
import { dependenciesForSlug } from '@/constants/componentDependencies';
import { useDocsRoute } from '@/hooks/useDocsRoute';
import type { CodeObject } from '@/types/code';
import { injectPropsIntoUsage } from '@/utils/codeGeneration';
import CliInstallation from './CliInstallation';
import CodeCopyButton from './CodeCopyButton';
import CodeHighlighter from './CodeHighlighter';
import CodeSection from './CodeSection';
import { useTabsRegistration } from './TabsLayout';

const SKIP_KEYS = new Set(['cli', 'installation', 'dependencies', 'usage', 'code']);
const TITLES: Record<string, string> = { utility: 'Utility source', css: 'CSS', presets: 'Presets' };
const LANGUAGES: Record<string, string> = { utility: 'ts', css: 'css', presets: 'ts', installation: 'bash' };

export default function CodeExample(props: { codeObject: CodeObject; componentName?: string }) {
  const route = useDocsRoute();
  const context = useComponentPropsContext();
  const { register } = useTabsRegistration();
  register(tabs => tabs.registerCode({ codeObject: props.codeObject, componentName: props.componentName ?? '' }));

  const dependencies = createMemo(() => {
    if (props.codeObject.dependencies !== undefined) return props.codeObject.dependencies;
    return dependenciesForSlug(route.subcategory()).join(' ');
  });

  const dynamicUsage = createMemo(() => {
    const usage = props.codeObject.usage;
    const values = context.props();
    if (!usage || !props.componentName || !values || Object.keys(values).length === 0) return usage;
    return injectPropsIntoUsage(
      usage,
      { ...values, ...context.computedProps() },
      {},
      props.componentName,
      context.demoOnlyProps()
    );
  });

  const extraSections = createMemo(() =>
    Object.entries(props.codeObject)
      .filter(([name, snippet]) => !SKIP_KEYS.has(name) && typeof snippet === 'string' && snippet)
      .map(([name, snippet]) => ({
        name,
        snippet: snippet as string,
        title: TITLES[name] ?? name,
        language: LANGUAGES[name] ?? 'tsx'
      }))
  );

  return (
    <>
      <CliInstallation deps={dependencies()} />

      <Show when={dynamicUsage()}>
        {usage => (
          <CodeSection
            title="Usage"
            note={context.hasChanges() ? 'With your settings' : null}
            actions={<CodeCopyButton codeString={usage()} />}
          >
            <CodeHighlighter snippetId="usage" language="tsx" codeString={usage()} showCopyButton={false} />
          </CodeSection>
        )}
      </Show>

      <Show when={props.codeObject.code}>
        {code => (
          <CodeSection title="Code" actions={<CodeCopyButton codeString={code()} />}>
            <CodeHighlighter snippetId="code" language="tsx" codeString={code()} showCopyButton={false} />
          </CodeSection>
        )}
      </Show>

      <For each={extraSections()}>
        {section => (
          <CodeSection title={section.title} actions={<CodeCopyButton codeString={section.snippet} />}>
            <CodeHighlighter
              snippetId={section.name}
              language={section.language}
              codeString={section.snippet}
              showCopyButton={false}
            />
          </CodeSection>
        )}
      </For>
    </>
  );
}
