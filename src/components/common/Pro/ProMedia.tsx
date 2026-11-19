import { Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { isLight } from '@/hooks/useTheme';
import { PRO_ASSET_BASE, type ProMediaItem } from '@/constants/Pro';

export default function ProMedia(props: { item: ProMediaItem; baseUrl?: string }) {
  let rootEl: HTMLSpanElement | undefined;
  const [playing, setPlaying] = createSignal(false);
  const [failed, setFailed] = createSignal<string[]>([]);

  const resolve = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    const base = props.baseUrl ?? PRO_ASSET_BASE;
    return new URL(path.replace(/^\//, ''), `${base.replace(/\/$/, '')}/`).href;
  };

  const still = createMemo(() => resolve(isLight() ? props.item.media?.light : props.item.media?.dark));
  const poster = createMemo(() => resolve(props.item.media?.poster));
  const animated = createMemo(() => resolve(props.item.media?.animated));
  const source = createMemo(() => {
    const failedList = failed();
    if (still() && !failedList.includes(still())) return still();
    return playing() && animated() && !failedList.includes(animated()) ? animated() : poster();
  });
  const showImage = createMemo(() => Boolean(source()) && !failed().includes(source()));

  const onError = () => {
    const current = source();
    setFailed(list => (list.includes(current) ? list : [...list, current]));
  };

  let observer: IntersectionObserver | null = null;
  let motion: MediaQueryList | null = null;
  let visible = false;
  let mounted = false;
  let hasStill = false;

  const update = () => {
    setPlaying(visible && !motion?.matches && !document.hidden);
  };

  const stop = () => {
    observer?.disconnect();
    observer = null;
    motion?.removeEventListener('change', update);
    document.removeEventListener('visibilitychange', update);
  };

  const start = () => {
    stop();
    if (!mounted || !rootEl || hasStill || typeof IntersectionObserver === 'undefined') return;
    motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    observer = new IntersectionObserver(
      entries => {
        visible = entries.some(entry => entry.isIntersecting);
        update();
      },
      { rootMargin: '80px' }
    );
    observer.observe(rootEl);
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
  };

  createEffect(still, value => {
    hasStill = Boolean(value);
    start();
  });

  onSettled(() => {
    mounted = true;
    start();
    return () => {
      mounted = false;
      stop();
    };
  });

  return (
    <span ref={el => (rootEl = el)} class="pro-media" aria-hidden="true">
      <Show when={showImage()} fallback={<span class="pro-media-fallback">{props.item.name}</span>}>
        <img src={source()} alt="" loading="lazy" decoding="async" onError={onError} />
      </Show>
    </span>
  );
}
