import { createSignal, onSettled } from 'solid-js';

export function useNearOnce(rootMargin = '600px 0px') {
  const [near, setNear] = createSignal(false);
  let target: HTMLElement | undefined;

  onSettled(() => {
    const node = target;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  });

  const ref = (el: HTMLElement) => {
    target = el;
  };

  return [ref, near] as const;
}
