import { createEffect, createMemo, createSignal, type Accessor } from 'solid-js';

export const MIN_PREVIEW_WIDTH = 320;

export type PreviewFrame = { top: number; left: number; height: number; fullWidth: number };

const sameFrame = (a: PreviewFrame | null, b: PreviewFrame | null) =>
  a !== null &&
  b !== null &&
  a.top === b.top &&
  a.left === b.left &&
  a.height === b.height &&
  a.fullWidth === b.fullWidth;

const readFrame = (panel: HTMLElement) => {
  const demo = panel.querySelector<HTMLElement>('.demo-container');
  const parent = demo?.parentElement;
  if (!demo || !parent) return { demo: null, frame: null };
  const panelRect = panel.getBoundingClientRect();
  const demoRect = demo.getBoundingClientRect();
  if (panelRect.width === 0 || demoRect.width === 0) return { demo, frame: null };
  const parentRect = parent.getBoundingClientRect();
  const contentRight =
    parentRect.left + parent.clientLeft + parent.clientWidth - parseFloat(getComputedStyle(parent).paddingRight);
  return {
    demo,
    frame: {
      top: demoRect.top - panelRect.top - panel.clientTop,
      left: demoRect.left - panelRect.left - panel.clientLeft,
      height: demoRect.height,
      fullWidth: Math.max(MIN_PREVIEW_WIDTH, Math.floor(contentRight - demoRect.left))
    }
  };
};

export function usePreviewFrame(panel: Accessor<HTMLElement | null>, enabled: Accessor<boolean>) {
  const [measured, setMeasured] = createSignal<PreviewFrame | null>(null);
  let current: PreviewFrame | null = null;

  createEffect(
    () => [panel(), enabled()] as const,
    ([el, isEnabled]) => {
      if (!isEnabled || !el) return;
      let observed: HTMLElement | null = null;
      const measure = () => {
        const { demo, frame: next } = readFrame(el);
        if (demo !== observed) {
          if (observed) observer.unobserve(observed);
          if (demo) observer.observe(demo);
          observed = demo;
        }
        if (next && !sameFrame(current, next)) {
          current = next;
          setMeasured(next);
        }
      };
      const observer = new ResizeObserver(measure);
      const mutations = new MutationObserver(measure);
      observer.observe(el);
      mutations.observe(el, { childList: true, subtree: true });
      const raf = requestAnimationFrame(measure);
      return () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        mutations.disconnect();
      };
    }
  );

  return createMemo(() => (enabled() ? measured() : null));
}
