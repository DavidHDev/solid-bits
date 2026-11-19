import CodeCopyButton from '@/components/common/CodeCopyButton';
import ShikiCode from '@/components/common/ShikiCode';

export default function DocsCodeBlock(props: { code: string; language?: string; showLineNumbers?: boolean }) {
  return (
    <div class="docs-code">
      <div class="docs-code-header">
        <CodeCopyButton codeString={props.code.trim()} />
      </div>
      <ShikiCode
        code={props.code}
        language={props.language ?? 'bash'}
        showLineNumbers={props.showLineNumbers ?? false}
      />
    </div>
  );
}
