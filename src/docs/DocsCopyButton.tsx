import { createSignal, onCleanup } from 'solid-js';
import { CheckIcon, CopyIcon } from '@/components/icons/Icons';

const COPY_RESET_MS = 2000;

export default function DocsCopyButton(props: { text: string; label?: string }) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const label = () => props.label ?? 'Copy command';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.text);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(timer);
    timer = setTimeout(() => setCopied(false), COPY_RESET_MS);
  };

  onCleanup(() => clearTimeout(timer));

  return (
    <button
      type="button"
      class="docs-row-copy"
      aria-label={copied() ? 'Copied' : label()}
      title={copied() ? 'Copied!' : label()}
      onClick={copy}
    >
      {copied() ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
    </button>
  );
}
