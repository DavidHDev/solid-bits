import { Show, children, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';

export default function HeroWindow(props: {
  title: string;
  class?: string;
  action?: JSX.Element;
  status?: JSX.Element;
  children: JSX.Element;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });
  const status = children(() => props.status);
  let drag: { x: number; y: number; start: { x: number; y: number } } | null = null;

  const down = (event: PointerEvent) => {
    if (event.button !== 0 || (event.target as Element).closest('button')) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;
    drag = { x: event.clientX, y: event.clientY, start: offset() };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const move = (event: PointerEvent) => {
    if (!drag) return;
    setOffset({
      x: drag.start.x + event.clientX - drag.x,
      y: drag.start.y + event.clientY - drag.y
    });
  };

  const up = () => {
    drag = null;
  };

  return (
    <div
      class={['lh-window', props.class]}
      style={{ '--wx': `${offset().x}px`, '--wy': `${offset().y}px` }}
      onPointerEnter={() => props.onPointerEnter?.()}
      onPointerLeave={() => props.onPointerLeave?.()}
    >
      <div class="lh-window-bar" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {props.title}
        {props.action}
      </div>
      <div class="lh-well">{props.children}</div>
      <Show when={status()}>
        <div class="lh-window-status">{status()}</div>
      </Show>
    </div>
  );
}
