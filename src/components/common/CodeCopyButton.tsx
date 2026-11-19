import { Show, createSignal, onSettled } from 'solid-js';
import { CheckIcon, CopyIcon } from '@/components/icons/Icons';

const COPY_RESET_MS = 2000;

export default function CodeCopyButton(props: { codeString?: string | null }) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const handleCopy = async () => {
    if (!props.codeString) return;
    try {
      await navigator.clipboard.writeText(props.codeString);
      setCopied(true);
      clearTimeout(timer);
      timer = setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch (error) {
      console.error('Failed to copy text: ', error);
    }
  };

  onSettled(() => () => clearTimeout(timer));

  return (
    <Show when={props.codeString}>
      <button
        type="button"
        class={['docs-copy-button', { 'docs-copy-button--done': copied() }]}
        title={copied() ? 'Copied!' : 'Copy to clipboard'}
        aria-label={copied() ? 'Code copied to clipboard' : 'Copy code to clipboard'}
        onClick={handleCopy}
      >
        <Show when={copied()} fallback={<CopyIcon size={16} />}>
          <CheckIcon size={16} />
        </Show>
      </button>
    </Show>
  );
}
