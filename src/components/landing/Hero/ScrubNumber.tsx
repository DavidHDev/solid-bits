import { createSignal } from 'solid-js';
import { clamp, roundTo } from './heroUtils';

export type ScrubField = { name: string; label: string; min: number; max: number; step: number };

export default function ScrubNumber(props: { value: number; field: ScrubField; onChange: (value: number) => void }) {
  const [active, setActive] = createSignal(false);
  let drag: { x: number; value: number } | null = null;

  const down = (event: PointerEvent) => {
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = { x: event.clientX, value: props.value };
    setActive(true);
  };

  const move = (event: PointerEvent) => {
    if (!drag) return;
    const { min, max, step } = props.field;
    const delta = ((event.clientX - drag.x) / 260) * (max - min);
    props.onChange(roundTo(clamp(drag.value + delta, min, max), step));
  };

  const up = () => {
    drag = null;
    setActive(false);
  };

  const key = (event: KeyboardEvent) => {
    const direction = ({ ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 } as Record<string, number>)[
      event.key
    ];
    if (!direction) return;
    event.preventDefault();
    const { min, max, step } = props.field;
    const amount = step * (event.shiftKey ? 10 : 1) * direction;
    props.onChange(roundTo(clamp(props.value + amount, min, max), step));
  };

  return (
    <span
      class="lh-scrub lh-value"
      role="slider"
      tabindex="0"
      aria-label={props.field.label}
      aria-valuemin={props.field.min}
      aria-valuemax={props.field.max}
      aria-valuenow={props.value}
      data-active={active() ? '' : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
    >
      {roundTo(props.value, props.field.step)}
    </span>
  );
}
