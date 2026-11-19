import { ariaBool } from '@/utils/aria';
import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Portal, type JSX } from '@solidjs/web';

type OptionValue = string | number;
export type SelectOption = { label?: string; value: OptionValue; [key: string]: unknown };

const LABEL_OVERRIDES: Record<string, string> = { pingpong: 'Ping Pong', rotate3d: 'Rotate 3D' };
const formatOptionLabel = (str: string) =>
  LABEL_OVERRIDES[str] ?? str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function PreviewSelect(props: {
  title?: string;
  options?: (SelectOption | string | number)[];
  value?: OptionValue;
  isDisabled?: boolean;
  width?: number | string;
  onChange?: (value: any) => void;
}) {
  const [open, setOpen] = createSignal(false);
  const [rect, setRect] = createSignal<DOMRect | null>(null);
  let wrapEl: HTMLDivElement | undefined;
  let dropdownEl: HTMLDivElement | undefined;

  const formattedOptions = createMemo(() =>
    (props.options ?? []).map(opt =>
      typeof opt === 'string'
        ? { value: opt as OptionValue, label: formatOptionLabel(opt) }
        : typeof opt === 'object' && opt !== null
          ? { ...opt, label: opt.label != null ? opt.label : formatOptionLabel(String(opt.value)) }
          : { value: opt as OptionValue, label: String(opt) }
    )
  );

  const currentLabel = () => {
    const found = formattedOptions().find(opt => opt.value === props.value);
    return found ? found.label : String(props.value ?? '');
  };

  const toggle = () => {
    if (props.isDisabled) return;
    if (!open()) updatePosition();
    setOpen(value => !value);
  };

  const pick = (value: OptionValue) => {
    props.onChange?.(value);
    setOpen(false);
  };

  const onPointerDown = (e: PointerEvent) => {
    const target = e.target as Node;
    if (!wrapEl?.contains(target) && !dropdownEl?.contains(target)) setOpen(false);
  };

  const updatePosition = () => {
    if (wrapEl) setRect(wrapEl.getBoundingClientRect());
  };

  const detach = () => {
    document.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
  };

  createEffect(open, value => {
    if (value) {
      document.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    } else {
      detach();
    }
  });

  onSettled(() => detach);

  const dropdownStyle = (): JSX.CSSProperties => {
    const box = rect();
    if (!box) return {};
    const viewport = window.innerHeight;
    const estimate = formattedOptions().length * 35 + 10;
    const below = viewport - box.bottom - 12;
    const above = box.top - 12;
    const flip = below < Math.min(estimate, 240) && above > below;
    const room = Math.max(120, flip ? above : below);
    return {
      position: 'fixed',
      ...(flip
        ? { top: 'auto', bottom: `${viewport - box.top + 4}px`, 'transform-origin': 'bottom center' }
        : { top: `${box.bottom + 4}px`, bottom: 'auto' }),
      left: `${box.left}px`,
      right: 'auto',
      width: `${box.width}px`,
      'max-height': `${room}px`,
      'overflow-y': 'auto',
      'z-index': 9999
    };
  };

  return (
    <div ref={el => (wrapEl = el)} class="scrubber" style={{ position: 'relative' }}>
      <button
        type="button"
        class="scrubber-track scrubber-track--select"
        aria-label={props.title}
        aria-disabled={ariaBool(Boolean(props.isDisabled))}
        data-disabled={String(Boolean(props.isDisabled))}
        tabindex={props.isDisabled ? -1 : 0}
        onClick={toggle}
      >
        <span class="scrubber-label">{props.title}</span>
        <span class="scrubber-select-right">
          <span class="scrubber-value">{currentLabel()}</span>
          <svg
            class={['scrubber-caret', { 'scrubber-caret--open': open() }]}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </button>
      <Show when={open() && rect()}>
        <Portal>
          <div ref={el => (dropdownEl = el)} class="scrubber-dropdown" style={dropdownStyle()}>
            <For each={formattedOptions()}>
              {opt => (
                <button
                  type="button"
                  class={['scrubber-dropdown-item', { 'scrubber-dropdown-item--active': opt.value === props.value }]}
                  onClick={() => pick(opt.value)}
                >
                  {opt.label}
                </button>
              )}
            </For>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
