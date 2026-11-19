import { Show, createEffect, createSignal, onSettled } from 'solid-js';
import { GripVerticalIcon } from '@/components/icons/Icons';
import { MIN_PREVIEW_WIDTH, type PreviewFrame } from '@/hooks/usePreviewFrame';

const INDICATOR_MS = 2000;
const KEY_STEP = 10;
const KEY_STEP_LARGE = 50;
const HANDLE_INSET = 32;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function PreviewResizer(props: {
  frame: PreviewFrame | null;
  width: number | null;
  onWidthChange: (width: number | null) => void;
  onResizingChange: (resizing: boolean) => void;
}) {
  const [dragging, setDragging] = createSignal(false);
  const [showIndicator, setShowIndicator] = createSignal(false);
  let drag: { id: number; startX: number; startWidth: number } | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingWidth: number | null = null;
  let resizeRaf = 0;

  const current = () => props.width ?? props.frame?.fullWidth ?? 0;

  createEffect(
    () => props.width,
    width => {
      if (width === null) {
        setShowIndicator(false);
        return;
      }
      setShowIndicator(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowIndicator(false), INDICATOR_MS);
    },
    { defer: true }
  );

  onSettled(() => () => {
    clearTimeout(hideTimer);
    cancelAnimationFrame(resizeRaf);
    delete document.documentElement.dataset.previewResizing;
  });

  const commit = (next: number) => {
    const frame = props.frame;
    if (!frame) return;
    const rounded = Math.round(clamp(next, MIN_PREVIEW_WIDTH, frame.fullWidth));
    props.onWidthChange(rounded >= frame.fullWidth ? null : rounded);
  };

  const flushWidth = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = 0;
    if (pendingWidth === null) return;
    const next = pendingWidth;
    pendingWidth = null;
    commit(next);
  };

  const finishDrag = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    flushWidth();
    drag = null;
    setDragging(false);
    props.onResizingChange(false);
    delete document.documentElement.dataset.previewResizing;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, startX: event.clientX, startWidth: current() };
    setDragging(true);
    props.onResizingChange(true);
    document.documentElement.dataset.previewResizing = '';
  };

  const onPointerMove = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return;
    pendingWidth = drag.startWidth + event.clientX - drag.startX;
    if (!resizeRaf) resizeRaf = requestAnimationFrame(flushWidth);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const frame = props.frame;
    if (!frame) return;
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const targets: Record<string, number> = {
      ArrowLeft: current() - step,
      ArrowRight: current() + step,
      Home: MIN_PREVIEW_WIDTH,
      End: frame.fullWidth
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    commit(targets[event.key]);
  };

  return (
    <Show when={props.frame}>
      {frame => (
        <>
          <div
            class="preview-resize-handle"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            aria-label="Drag to resize preview"
            aria-valuemin={MIN_PREVIEW_WIDTH}
            aria-valuemax={frame().fullWidth}
            aria-valuenow={Math.round(current())}
            data-dragging={dragging() ? '' : undefined}
            style={{
              top: `${frame().top + HANDLE_INSET}px`,
              left: `${frame().left + current()}px`,
              height: `${Math.max(0, frame().height - HANDLE_INSET * 2)}px`
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onLostPointerCapture={finishDrag}
            onDblClick={() => props.onWidthChange(null)}
            onKeyDown={onKeyDown}
          >
            <span class="preview-resize-bar" />
            <GripVerticalIcon class="preview-resize-grip" />
          </div>
          <div
            class="preview-width-indicator"
            aria-hidden="true"
            data-visible={dragging() || (showIndicator() && props.width !== null) ? '' : undefined}
            style={{ top: `${frame().top + frame().height}px`, left: `${frame().left + frame().fullWidth / 2}px` }}
          >
            {Math.round(current())}px
          </div>
        </>
      )}
    </Show>
  );
}
