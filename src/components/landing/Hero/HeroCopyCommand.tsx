import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { createSignal, onSettled } from 'solid-js';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';

export default function HeroCopyCommand(props: { command: string; buttonClass: string }) {
  const [copied, setCopied] = createSignal(false);
  let timer = 0;

  const copy = () => {
    navigator.clipboard?.writeText(props.command);
    setCopied(true);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => setCopied(false), 1400);
  };

  onSettled(() => () => window.clearTimeout(timer));

  return (
    <button type="button" class={props.buttonClass} aria-label="Copy install command" onClick={copy}>
      <HugeiconsIcon icon={copied() ? Tick02Icon : Copy01Icon} size={13} strokeWidth={1.8} />
    </button>
  );
}
