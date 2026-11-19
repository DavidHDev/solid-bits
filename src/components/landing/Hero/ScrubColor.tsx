import { For, Show, createEffect, createSignal } from 'solid-js';

export default function ScrubColor(props: {
  value: string;
  swatches: string[];
  label: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = createSignal(false);
  let root: HTMLSpanElement | undefined;

  const onDown = (event: PointerEvent) => {
    if (!root?.contains(event.target as Node)) setOpen(false);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };

  createEffect(open, isOpen => {
    if (!isOpen) return;
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  });

  return (
    <span ref={el => (root = el)} class="lh-color">
      <button
        type="button"
        class="lh-scrub lh-value"
        aria-label={props.label}
        aria-expanded={open() ? 'true' : 'false'}
        onClick={() => setOpen(value => !value)}
      >
        <i style={{ background: props.value }} />
        {`"${props.value}"`}
      </button>
      <Show when={open()}>
        <span class="lh-swatches">
          <For each={props.swatches}>
            {color => (
              <button
                type="button"
                aria-label={color}
                aria-pressed={color.toLowerCase() === String(props.value).toLowerCase() ? 'true' : 'false'}
                style={{ '--swatch': color }}
                onClick={() => props.onChange(color)}
              />
            )}
          </For>
        </span>
      </Show>
    </span>
  );
}
