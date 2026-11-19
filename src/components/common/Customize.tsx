import { ariaBool } from '@/utils/aria';
import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { RotateCcwIcon } from '@/components/icons/Icons';
import CategoryProFooter from './Pro/CategoryProFooter';
import { useTabsRegistration } from './TabsLayout';

export default function Customize(props: { children: JSX.Element; className?: string }) {
  const { tabs, register } = useTabsRegistration();
  register(t => t.registerCustomize());
  const canReset = () => tabs?.canReset() ?? false;

  return (
    <>
      <div class={['customize-frame', props.className]}>
        <div class="customize-heading">
          <h2>Customize</h2>
          <div class="customize-heading-actions">
            <Show when={tabs}>
              <button
                type="button"
                class={['customize-heading-action customize-reset-action', { 'is-visible': canReset() }]}
                disabled={!canReset()}
                aria-hidden={ariaBool(!canReset())}
                tabindex={canReset() ? 0 : -1}
                onClick={() => tabs?.reset()}
              >
                <RotateCcwIcon size={14} />
                <span>Reset</span>
              </button>
            </Show>
          </div>
        </div>
        <div class="preview-options">{props.children}</div>
      </div>
      <Show when={tabs}>
        <CategoryProFooter category={tabs!.category()} />
      </Show>
    </>
  );
}
