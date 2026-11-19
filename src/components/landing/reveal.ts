import { onSettled } from 'solid-js';

const EASE = 'cubic-bezier(0.21, 0.47, 0.32, 0.98)';

export function createReveal() {
  const items: { el: HTMLElement; delay: number }[] = [];

  onSettled(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observers = items.map(({ el, delay }) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          el.style.transition = `opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`;
          el.style.opacity = '1';
          el.style.transform = 'none';
          const done = () => {
            el.style.removeProperty('transition');
            el.style.removeProperty('transform');
            el.style.removeProperty('opacity');
            el.removeEventListener('transitionend', done);
          };
          el.addEventListener('transitionend', done);
        },
        { rootMargin: '-60px' }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach(observer => observer.disconnect());
  });

  return (delay = 0) =>
    (el: HTMLElement) => {
      if (typeof IntersectionObserver === 'undefined') return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      items.push({ el, delay });
    };
}
