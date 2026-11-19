import { ariaBool } from '@/utils/aria';
import { For } from 'solid-js';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import DocsTooltip from './DocsTooltip';
import type { DEMO_MODES } from './demoModes';
import type { DemoMode } from './previewStage';

export default function BackgroundModeSwitch(props: {
  modes: typeof DEMO_MODES;
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}) {
  const index = () =>
    Math.max(
      0,
      props.modes.findIndex(item => item.value === props.mode)
    );
  return (
    <div class="bgc-switch" role="group" aria-label="Demo content" style={{ '--bgc-index': index() }}>
      <span class="bgc-switch-pill" aria-hidden="true" />
      <For each={props.modes}>
        {item => (
          <DocsTooltip label={item.label} placement="bottom">
            <button
              type="button"
              class="bgc-switch-button"
              aria-label={item.label}
              aria-pressed={ariaBool(props.mode === item.value)}
              onClick={() => props.onChange(item.value)}
            >
              <HugeiconsIcon icon={item.icon} size={16} strokeWidth={1.6} />
            </button>
          </DocsTooltip>
        )}
      </For>
    </div>
  );
}
