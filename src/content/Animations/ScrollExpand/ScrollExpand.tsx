import { Show, children, createEffect, createMemo, omit, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';

import './ScrollExpand.css';

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: JSX.Element;
  className?: string;
  style?: JSX.CSSProperties;
  [key: string]: unknown;
}

type Config = {
  startWidth: number;
  startHeight: number;
  startRadius: number;
  endRadius: number;
  mediaZoom: number;
  scrollDistance: number;
  holdDistance: number;
  smoothing: number;
  overlayScrim: number;
  useWindowScroll: boolean;
  enabled: boolean;
};

const OWN_KEYS = [
  'src',
  'mediaType',
  'poster',
  'alt',
  'title',
  'scrollHint',
  'startWidth',
  'startHeight',
  'startRadius',
  'endRadius',
  'mediaZoom',
  'scrollDistance',
  'holdDistance',
  'smoothing',
  'overlayScrim',
  'useWindowScroll',
  'enabled',
  'children',
  'className',
  'style'
] as const;

export default function ScrollExpand(props: ScrollExpandProps) {
  const rest = omit(props, ...OWN_KEYS);
  const overlayContent = children(() => props.children);

  let rootEl: HTMLDivElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  let stageEl: HTMLDivElement | undefined;
  let frameEl: HTMLDivElement | undefined;
  let mediaEl: HTMLImageElement | HTMLVideoElement | undefined;
  let titleEl: HTMLDivElement | undefined;
  let overlayEl: HTMLDivElement | undefined;
  let scrimEl: HTMLDivElement | undefined;
  let hintEl: HTMLDivElement | undefined;

  let current!: Config;
  let refresh: (() => void) | null = null;
  let rebind: (() => void) | null = null;

  const config = createMemo<Config>(() => ({
    startWidth: props.startWidth ?? 42,
    startHeight: props.startHeight ?? 58,
    startRadius: props.startRadius ?? 24,
    endRadius: props.endRadius ?? 0,
    mediaZoom: props.mediaZoom ?? 1.35,
    scrollDistance: props.scrollDistance ?? 1.2,
    holdDistance: props.holdDistance ?? 0.35,
    smoothing: props.smoothing ?? 0.1,
    overlayScrim: props.overlayScrim ?? 0.45,
    useWindowScroll: props.useWindowScroll ?? false,
    enabled: props.enabled ?? true
  }));

  const applyProgress = (p: number) => {
    const frame = frameEl;
    const media = mediaEl;
    if (!frame || !media) return;
    const c = current;

    const e = smoothstep(0, 1, p);

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimEl) scrimEl.style.opacity = `${c.overlayScrim * e}`;

    if (titleEl) {
      const out = smoothstep(0.4, 0.88, p);
      titleEl.style.opacity = `${1 - out}`;
      titleEl.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    if (hintEl) {
      const gone = smoothstep(0, 0.12, p);
      hintEl.style.opacity = `${1 - gone}`;
      hintEl.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayEl) {
      const inn = smoothstep(0.68, 1, p);
      overlayEl.style.opacity = `${inn}`;
      overlayEl.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  };

  createEffect(config, value => {
    const windowChanged = current !== undefined && current.useWindowScroll !== value.useWindowScroll;
    current = value;
    if (windowChanged) rebind?.();
    else refresh?.();
  });

  createEffect(
    () => [props.title, props.scrollHint, props.mediaType, props.src],
    () => {
      refresh?.();
    }
  );

  onSettled(() => {
    current = config();
    const root = rootEl;
    const track = trackEl;
    const stage = stageEl;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let progress = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 20, 84)}px`);
    };

    const readProgress = () => {
      const c = current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      progress += (target - progress) * k;
      if (Math.abs(target - progress) < 0.0004) {
        progress = target;
        running = false;
      }
      applyProgress(progress);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (current.smoothing <= 0 || reduceMotion) {
        progress = target;
        applyProgress(progress);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      progress = target;
      applyProgress(progress);
    };

    let scroller: Window | HTMLElement | null = null;

    const bind = () => {
      if (scroller) scroller.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      onResize();
      scroller = current.useWindowScroll ? window : root;
      scroller.addEventListener('scroll', onScroll, { passive: true });
    };

    bind();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    refresh = onResize;
    rebind = bind;

    return () => {
      refresh = null;
      rebind = null;
      if (raf) cancelAnimationFrame(raf);
      scroller?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  });

  return (
    <div
      ref={el => (rootEl = el)}
      class={['scroll-expand', { 'scroll-expand--scroller': !(props.useWindowScroll ?? false) }, props.className]}
      style={props.style}
      {...rest}
    >
      <div ref={el => (trackEl = el)} class="scroll-expand__track">
        <div ref={el => (stageEl = el)} class="scroll-expand__stage">
          <div ref={el => (frameEl = el)} class="scroll-expand__frame">
            <Show
              when={(props.mediaType ?? 'image') === 'video'}
              fallback={
                <img
                  ref={el => (mediaEl = el)}
                  class="scroll-expand__media"
                  src={props.src ?? ''}
                  alt={props.alt ?? ''}
                  draggable="false"
                />
              }
            >
              <video
                ref={el => (mediaEl = el)}
                class="scroll-expand__media"
                src={props.src ?? ''}
                poster={props.poster ?? ''}
                autoplay
                muted
                loop
                playsinline
              />
            </Show>
            <div ref={el => (scrimEl = el)} class="scroll-expand__scrim" />
            <Show when={overlayContent()}>
              <div ref={el => (overlayEl = el)} class="scroll-expand__overlay">
                {overlayContent()}
              </div>
            </Show>
          </div>
          <Show when={props.title}>
            <div ref={el => (titleEl = el)} class="scroll-expand__title">
              {props.title}
            </div>
          </Show>
          <Show when={props.scrollHint}>
            <div ref={el => (hintEl = el)} class="scroll-expand__hint">
              {props.scrollHint}
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
