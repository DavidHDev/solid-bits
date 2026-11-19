export default function PreviewInput(props: {
  title?: string;
  value?: string;
  placeholder?: string;
  maxLength?: number;
  isDisabled?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div class="scrubber">
      <div class="scrubber-track scrubber-track--input" data-disabled={String(Boolean(props.isDisabled))}>
        <span class="scrubber-label">{props.title}</span>
        <input
          class="scrubber-input"
          type="text"
          value={props.value ?? ''}
          placeholder={props.placeholder}
          maxlength={props.maxLength}
          disabled={props.isDisabled}
          aria-label={props.title}
          onInput={e => props.onChange?.(e.currentTarget.value)}
        />
      </div>
    </div>
  );
}
