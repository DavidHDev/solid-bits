import { createSignal } from 'solid-js';

const INTENT_THRESHOLD_PX = 6;

export function useScrubGesture(options: {
  track: () => HTMLElement | undefined;
  computeValue: (clientX: number) => number;
  onChange: (value: number) => void;
  isDisabled: () => boolean;
}) {
  const [isDragging, setIsDragging] = createSignal(false);
  let dragging = false;
  let pending: { id: number; x: number; y: number } | null = null;

  const begin = (e: PointerEvent) => {
    dragging = true;
    setIsDragging(true);
    options.track()?.setPointerCapture(e.pointerId);
    options.onChange(options.computeValue(e.clientX));
  };

  const end = () => {
    dragging = false;
    pending = null;
    setIsDragging(false);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (options.isDisabled()) return;
    if (e.pointerType === 'touch') {
      pending = { id: e.pointerId, x: e.clientX, y: e.clientY };
      return;
    }
    e.preventDefault();
    begin(e);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (pending) {
      if (e.pointerId !== pending.id) return;
      const dx = e.clientX - pending.x;
      const dy = e.clientY - pending.y;
      if (Math.abs(dx) < INTENT_THRESHOLD_PX && Math.abs(dy) < INTENT_THRESHOLD_PX) return;
      pending = null;
      if (Math.abs(dy) >= Math.abs(dx)) return;
      begin(e);
      return;
    }
    if (!dragging) return;
    options.onChange(options.computeValue(e.clientX));
  };

  const onPointerUp = (e: PointerEvent) => {
    if (pending?.id === e.pointerId) options.onChange(options.computeValue(e.clientX));
    end();
  };

  const onPointerCancel = () => end();

  return { isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
