import { createEffect, onSettled } from 'solid-js';
import { DOT, gridLayout, smootherstep } from './heroUtils';

export type PointerHolder = { current: { x: number; y: number } | null };

export default function GhostReveal(props: { active: boolean; start: PointerHolder; color: string }) {
  let root: HTMLDivElement | undefined;
  let spot: HTMLDivElement | undefined;
  let dots: HTMLDivElement | undefined;
  const grid = { width: 0, originX: 0, originY: 0 };
  let frame = 0;

  const run = (active: boolean) => {
    cancelAnimationFrame(frame);
    frame = 0;
    const node = root;
    const host = node?.parentElement;
    const spotEl = spot;
    const dotsEl = dots;
    if (!node || !host || !spotEl || !dotsEl || !active) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cell = DOT.size + DOT.gap;
    const wrap = (value: number) => ((value % cell) + cell) % cell;
    const bounds = host.getBoundingClientRect();
    const stage = host.querySelector('.lh-stage')?.getBoundingClientRect();
    const band = Math.max(240, (stage ? stage.top : bounds.top + 400) - bounds.top);
    const start = props.start.current;
    const from =
      start && start.y - bounds.top < band + DOT.radius * 0.5
        ? { x: start.x - bounds.left, y: start.y - bounds.top }
        : null;
    const began = performance.now();
    const tick = (now: number) => {
      const t = (now - began) / 1000;
      const { width, originX, originY } = grid;
      const x = width * 0.58 + width * 0.36 * (0.62 * Math.sin(t * 0.16 + 0.4) + 0.38 * Math.sin(t * 0.07 + 2.2));
      const y = band * 0.52 + band * 0.3 * (0.6 * Math.sin(t * 0.12 + 1.1) + 0.4 * Math.sin(t * 0.05 + 0.3));
      const blend = from ? smootherstep(t / 3.2) : 1;
      const left = (from ? from.x + (x - from.x) * blend : x) - DOT.radius;
      const top = (from ? from.y + (y - from.y) * blend : y) - DOT.radius;
      spotEl.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      dotsEl.style.transform = `translate3d(${(wrap(originX - left) - cell).toFixed(1)}px, ${(wrap(originY - top) - cell).toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  let settled = false;
  let pending = false;

  createEffect(
    () => props.active,
    active => {
      pending = active;
      if (settled) run(active);
    }
  );

  onSettled(() => {
    const host = root?.parentElement;
    let observer: ResizeObserver | undefined;
    if (host) {
      const layout = () => {
        const { cell, width, startX, startY } = gridLayout(host);
        grid.width = width;
        grid.originX = startX - cell / 2;
        grid.originY = startY - cell / 2;
      };
      observer = new ResizeObserver(layout);
      observer.observe(host);
      layout();
    }
    settled = true;
    run(pending);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  });

  return (
    <div
      ref={el => (root = el)}
      class="lh-ghost"
      data-on={props.active ? '' : undefined}
      aria-hidden="true"
      style={{
        '--ghost-color': props.color,
        '--ghost-dot': `${DOT.size / 2 + 0.15}px`,
        '--ghost-radius': `${DOT.radius}px`,
        '--ghost-cell': `${DOT.size + DOT.gap}px`,
        '--ghost-strength': String(DOT.strength)
      }}
    >
      <div ref={el => (spot = el)} class="lh-ghost-spot">
        <div ref={el => (dots = el)} class="lh-ghost-dots" />
      </div>
    </div>
  );
}
