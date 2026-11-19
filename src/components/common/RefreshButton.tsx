import { Show } from 'solid-js';
import { Portal } from '@solidjs/web';
import { ReloadIcon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { usePreviewStage } from './previewStage';

export default function RefreshButton(props: { onClick?: () => void; label?: string }) {
  const stage = usePreviewStage();
  const button = () => (
    <button
      type="button"
      class="docs-refresh"
      aria-label={props.label ?? 'Refresh animation'}
      onClick={() => props.onClick?.()}
    >
      <HugeiconsIcon icon={ReloadIcon} size={16} strokeWidth={1.6} />
    </button>
  );
  return (
    <Show when={stage?.hasControls()} fallback={button()}>
      <Show when={stage?.controls()}>{mount => <Portal mount={mount()}>{button()}</Portal>}</Show>
    </Show>
  );
}
