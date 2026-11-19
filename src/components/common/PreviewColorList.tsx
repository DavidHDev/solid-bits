import { For } from 'solid-js';
import { MinusIcon, PlusIcon } from '@/components/icons/Icons';
import PreviewColorPickerCustom from './PreviewColorPickerCustom';

const FRESH = ['#40ffaa', '#4079ff', '#ffd93d', '#ff6b6b', '#06b6d4', '#f97316', '#0aa0ef', '#a3e635'];

export default function PreviewColorList(props: {
  title?: string;
  colors: string[];
  min?: number;
  max?: number;
  onChange?: (colors: string[]) => void;
}) {
  const title = () => props.title ?? 'Colors';
  const min = () => props.min ?? 2;
  const max = () => props.max ?? 8;
  const colors = () => props.colors ?? [];

  const update = (index: number, value: string) => {
    const next = [...colors()];
    next[index] = value;
    props.onChange?.(next);
  };

  const add = () => {
    if (colors().length >= max()) return;
    const used = colors().map(color => color.toLowerCase());
    props.onChange?.([...colors(), FRESH.find(color => !used.includes(color)) ?? colors()[colors().length - 1]]);
  };

  const remove = () => {
    if (colors().length > min()) props.onChange?.(colors().slice(0, -1));
  };

  return (
    <div class="scrubber-palette">
      <div class="scrubber-palette-head">
        <span class="scrubber-palette-label">{title()}</span>
        <div class="scrubber-palette-actions">
          <button
            type="button"
            class="scrubber-palette-button"
            disabled={colors().length <= min()}
            aria-label="Remove a color"
            onClick={remove}
          >
            <MinusIcon size={14} />
          </button>
          <button
            type="button"
            class="scrubber-palette-button"
            disabled={colors().length >= max()}
            aria-label="Add a color"
            onClick={add}
          >
            <PlusIcon size={14} />
          </button>
        </div>
      </div>
      <div class="scrubber-palette-strip">
        <For each={colors()} keyed={false}>
          {(color, index) => (
            <PreviewColorPickerCustom
              variant="swatch"
              title={`${title()} ${index + 1}`}
              color={color()}
              onChange={value => update(index, value)}
            />
          )}
        </For>
      </div>
    </div>
  );
}
