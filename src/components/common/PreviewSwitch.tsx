import { ariaBool } from '@/utils/aria';
export default function PreviewSwitch(props: {
  title?: string;
  isChecked?: boolean;
  isDisabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const toggle = () => {
    if (props.isDisabled) return;
    props.onChange?.(!props.isChecked);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };
  return (
    <div class="scrubber">
      <button
        type="button"
        class="scrubber-track scrubber-track--switch"
        role="switch"
        aria-checked={ariaBool(Boolean(props.isChecked))}
        aria-label={props.title}
        aria-disabled={ariaBool(Boolean(props.isDisabled))}
        data-disabled={String(Boolean(props.isDisabled))}
        data-checked={String(Boolean(props.isChecked))}
        tabindex={props.isDisabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span class="scrubber-label">{props.title}</span>
        <span class="scrubber-switch-toggle">
          <span class="scrubber-switch-knob" />
        </span>
      </button>
    </div>
  );
}
