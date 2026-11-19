import { createSignal, onSettled } from 'solid-js';

export function useInView(rootMargin = '150px') {
  const [visible, setVisible] = createSignal(false);
  let target: HTMLElement | undefined;

  onSettled(() => {
    const el = target;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    let inView = false;
    let tabVisible = document.visibilityState !== 'hidden';
    const sync = () => setVisible(inView && tabVisible);
    const observer = new IntersectionObserver(
      entries => {
        inView = entries[entries.length - 1].isIntersecting;
        sync();
      },
      { rootMargin }
    );
    observer.observe(el);
    const onVisibilityChange = () => {
      tabVisible = document.visibilityState !== 'hidden';
      sync();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  });

  const ref = (el: HTMLElement) => {
    target = el;
  };

  return [ref, visible] as const;
}
