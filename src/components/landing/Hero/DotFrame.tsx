import { createEffect, onSettled } from 'solid-js';
import { DOT, gridLayout } from './heroUtils';

export default function DotFrame(props: { color: string; live: boolean }) {
  let node: HTMLDivElement | undefined;

  const clear = () => {
    node?.style.removeProperty('--hole-x');
    node?.style.removeProperty('--hole-y');
  };

  const move = (event: PointerEvent) => {
    const el = node;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    el.style.setProperty('--hole-x', `${(event.clientX - bounds.left).toFixed(1)}px`);
    el.style.setProperty('--hole-y', `${(event.clientY - bounds.top).toFixed(1)}px`);
  };

  createEffect(
    () => props.live,
    live => {
      if (!live) {
        clear();
        return;
      }
      window.addEventListener('pointermove', move, { passive: true });
      return () => {
        window.removeEventListener('pointermove', move);
        clear();
      };
    }
  );

  onSettled(() => {
    const el = node;
    const host = el?.parentElement;
    if (!el || !host) return;
    const layout = () => {
      const { cell, startX, startY } = gridLayout(host);
      el.style.backgroundSize = `${cell}px ${cell}px`;
      el.style.backgroundPosition = `${startX - cell / 2}px ${startY - cell / 2}px`;
    };
    const observer = new ResizeObserver(layout);
    observer.observe(host);
    layout();
    return () => observer.disconnect();
  });

  return (
    <div
      ref={el => (node = el)}
      class="lh-dotframe"
      aria-hidden="true"
      style={{ '--frame-color': props.color, '--frame-dot': `${DOT.size / 2 + 0.15}px` }}
    />
  );
}
