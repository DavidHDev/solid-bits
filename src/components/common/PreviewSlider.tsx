import { ariaBool } from '@/utils/aria';
import { For, createMemo, createSignal, onSettled } from 'solid-js';
import { useScrubGesture } from '@/hooks/useScrubGesture';

const TICKS = 9;
const TICK_POSITIONS = Array.from({ length: TICKS }, (_, i) => ((i + 1) / (TICKS + 1)) * 100);

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);
const stepDecimals = (step: number) => {
  const s = step.toString();
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
};
const roundToStep = (val: number, step: number, min: number) => {
  const raw = Math.round((val - min) / step) * step + min;
  const decimals = Math.max(stepDecimals(step), stepDecimals(min));
  return Number(raw.toFixed(decimals));
};

export default function PreviewSlider(props: {
  title?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  valueUnit?: string;
  isDisabled?: boolean;
  displayValue?: (value: number) => string;
  onChange?: (value: number) => void;
}) {
  let trackEl: HTMLDivElement | undefined;
  const [isHovering, setIsHovering] = createSignal(false);
  const [isHoverDevice, setIsHoverDevice] = createSignal(false);

  const min = () => props.min ?? 0;
  const max = () => props.max ?? 100;
  const step = () => props.step ?? 1;
  const value = () => props.value ?? 0;

  const percentage = createMemo(() => {
    const range = max() - min();
    return range > 0 ? ((value() - min()) / range) * 100 : 0;
  });

  const computeValue = (clientX: number) => {
    if (!trackEl) return value();
    const rect = trackEl.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const raw = min() + ratio * (max() - min());
    return clamp(roundToStep(raw, step(), min()), min(), max());
  };

  const setValue = (next: number) => {
    if (next !== value()) props.onChange?.(next);
  };

  const gesture = useScrubGesture({
    track: () => trackEl,
    computeValue,
    onChange: setValue,
    isDisabled: () => Boolean(props.isDisabled)
  });

  const isActive = () => gesture.isDragging() || (isHoverDevice() && isHovering());

  const formattedValue = () =>
    props.displayValue
      ? props.displayValue(value())
      : `${Number(value().toFixed(stepDecimals(step())))}${props.valueUnit ?? ''}`;

  const onKeyDown = (e: KeyboardEvent) => {
    if (props.isDisabled) return;
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = value() + step();
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value() - step();
        break;
      case 'Home':
        next = min();
        break;
      case 'End':
        next = max();
        break;
      default:
        return;
    }
    e.preventDefault();
    setValue(clamp(roundToStep(next, step(), min()), min(), max()));
  };

  onSettled(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsHoverDevice(mq.matches);
    const onMediaChange = (e: MediaQueryListEvent) => setIsHoverDevice(e.matches);
    mq.addEventListener('change', onMediaChange);
    return () => mq.removeEventListener('change', onMediaChange);
  });

  return (
    <div class="scrubber">
      <div
        ref={el => (trackEl = el)}
        class="scrubber-track"
        role="slider"
        aria-label={props.title}
        aria-valuemin={min()}
        aria-valuemax={max()}
        aria-valuenow={value()}
        aria-disabled={ariaBool(Boolean(props.isDisabled))}
        tabindex={props.isDisabled ? -1 : 0}
        data-dragging={String(gesture.isDragging())}
        data-disabled={String(Boolean(props.isDisabled))}
        data-active={String(isActive())}
        onPointerDown={gesture.onPointerDown}
        onPointerMove={gesture.onPointerMove}
        onPointerUp={gesture.onPointerUp}
        onPointerCancel={gesture.onPointerCancel}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onKeyDown={onKeyDown}
      >
        <div class="scrubber-fill" style={{ width: `${percentage()}%` }} />
        <div class="scrubber-ticks">
          <For each={TICK_POSITIONS}>{pos => <div class="scrubber-tick" style={{ left: `${pos}%` }} />}</For>
        </div>
        <div class="scrubber-thumb-wrapper" style={{ left: `${percentage()}%` }}>
          <div class="scrubber-thumb" />
        </div>
        <div class="scrubber-label">{props.title}</div>
        <div class="scrubber-value">{formattedValue()}</div>
      </div>
    </div>
  );
}
