import { createEffect, createSignal } from 'solid-js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function ColorChannelInput(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = createSignal(String(props.value));
  const [focused, setFocused] = createSignal(false);

  createEffect(
    () => [props.value, focused()] as const,
    ([value, isFocused]) => {
      if (!isFocused) setDraft(String(value));
    }
  );

  const commitText = (text: string) => {
    const parsed = parseFloat(text);
    if (Number.isFinite(parsed)) props.onCommit(clamp(parsed, props.min, props.max));
    else setDraft(String(props.value));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const input = event.currentTarget as HTMLInputElement;
    if (event.key === 'Enter') {
      commitText(draft());
      input.select();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const delta = (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1);
      const next = clamp((parseFloat(draft()) || 0) + delta, props.min, props.max);
      setDraft(String(next));
      input.value = String(next);
      props.onCommit(next);
    }
  };

  return (
    <label class="cp-channel">
      <input
        class="cp-input cp-input--number"
        inputmode="decimal"
        value={draft()}
        aria-label={props.label}
        onFocus={event => {
          setFocused(true);
          event.currentTarget.select();
        }}
        onInput={event => setDraft(event.currentTarget.value)}
        onBlur={() => {
          setFocused(false);
          commitText(draft());
        }}
        onKeyDown={onKeyDown}
      />
      <span class="cp-channel-label">
        {props.label}
        {props.suffix ?? ''}
      </span>
    </label>
  );
}
