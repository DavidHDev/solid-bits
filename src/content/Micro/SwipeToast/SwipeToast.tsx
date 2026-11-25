import { Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue } from 'motion';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import './SwipeToast.css';

export type SwipeToastCloseReason = 'timeout' | 'swipe' | 'action' | 'close' | 'escape' | 'programmatic';
export type SwipeToastFuse = 'bottom' | 'top' | 'none';
export type SwipeToastPhase = 'open' | 'closing' | 'gone';

export interface SwipeToastProps {
  title?: JSX.Element;
  description?: JSX.Element;
  icon?: JSX.Element;
  actionLabel?: JSX.Element;
  onAction?: () => void;
  open?: boolean;
  onClose?: (reason: SwipeToastCloseReason) => void;
  background?: string;
  color?: string;
  fuseColor?: string;
  width?: number;
  radius?: number;
  slideMs?: number;
  settleBounce?: number;
  swipeDistance?: number;
  duration?: number;
  fuse?: SwipeToastFuse;
  pauseOnHover?: boolean;
  closeButton?: boolean;
  inline?: boolean;
  dismissible?: boolean;
  className?: string;
}

type Sample = [number, number];

interface Drag {
  id: number;
  startY: number;
  grab: number | null;
  moved: boolean;
  hist: Sample[];
}

interface Latest {
  onClose?: (reason: SwipeToastCloseReason) => void;
  onAction?: () => void;
  slideMs: number;
  inline: boolean;
  settleBounce: number;
  swipeDistance: number;
  pauseOnHover: boolean;
  dismissible: boolean;
}

type IconNode = readonly [string, { readonly [key: string]: string | number }];

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const FLICK = 0.11;
const DEAD_ZONE = 3;
const RESIST_PX = 24;
const COLLAPSE_MS = 200;
const EXIT = 0.7;
const BURN = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }];
const HAS_STARTING_STYLE = typeof window !== 'undefined' && 'CSSStartingStyleRule' in window;

const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0;
  const [t0, y0] = hist[0];
  const [t1, y1] = hist[hist.length - 1];
  return performance.now() - t1 > 100 ? 0 : (y1 - y0) / Math.max(1, t1 - t0);
};

const iconMarkup = (icon: readonly IconNode[], strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${String(name === 'stroke-width' ? strokeWidth : value).replace(/"/g, '&quot;')}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const CLOSE_ICON = iconMarkup(Cancel01Icon as readonly IconNode[], 2.5);

function useReducedMotion(): Accessor<boolean> {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const [reduce, setReduce] = createSignal(mq?.matches ?? false);
  onSettled(() => {
    if (!mq) return;
    const onChange = () => {
      setReduce(mq.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  });
  return reduce;
}

export default function SwipeToast(props: SwipeToastProps) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = createSignal<SwipeToastPhase>('open');
  const [instant, setInstant] = createSignal(false);
  const [mounted, setMounted] = createSignal(HAS_STARTING_STYLE);
  let cardEl: HTMLDivElement | undefined;
  let fuseEl: HTMLElement | undefined;
  let anim: Animation | null = null;
  let drag: Drag | null = null;
  const flags = { hover: false, interacting: false, focus: false, hidden: false };
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  let pendingClose: SwipeToastCloseReason | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let leaving = false;
  let phaseNow: SwipeToastPhase = 'open';
  let reduceNow = false;

  const config = createMemo<Latest>(() => ({
    onClose: props.onClose,
    onAction: props.onAction,
    slideMs: props.slideMs ?? 400,
    inline: props.inline ?? false,
    settleBounce: props.settleBounce ?? 0.2,
    swipeDistance: props.swipeDistance ?? 40,
    pauseOnHover: props.pauseOnHover ?? true,
    dismissible: props.dismissible ?? true
  }));
  let latest: Latest = untrack(config);

  const y = motionValue(0);
  const fade = motionValue(1);

  const enterPhase = (next: SwipeToastPhase) => {
    phaseNow = next;
    setPhase(next);
  };

  const syncFuse = () => {
    const a = anim;
    if (!a) return;
    const f = flags;
    if (f.hover || f.interacting || f.focus || f.hidden) a.pause();
    else if (a.playState === 'paused') a.play();
  };
  const finish = (why: SwipeToastCloseReason) => {
    enterPhase('gone');
    leaving = false;
    if (latest.inline) closeTimer = setTimeout(() => latest.onClose?.(why), COLLAPSE_MS);
    else latest.onClose?.(why);
  };
  const close = (why: SwipeToastCloseReason) => {
    if (phaseNow !== 'open' || leaving) return;
    if (drag) {
      pendingClose = why;
      return;
    }
    anim?.pause();
    const now = why === 'escape' || ((why === 'action' || why === 'close') && lastInput === 'keyboard');
    setInstant(now);
    enterPhase('closing');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => finish(why), now ? 0 : latest.slideMs * EXIT + 60);
  };
  const rescue = () => {
    clearTimeout(closeTimer);
    setInstant(false);
    y.set(0);
    fade.set(1);
    enterPhase('open');
  };

  createEffect(config, value => {
    latest = value;
  });
  createEffect(reduce, value => {
    reduceNow = value;
  });

  createEffect(
    () => props.open ?? true,
    open => {
      if (!open) close('programmatic');
      else if (phaseNow !== 'open') rescue();
    }
  );

  createEffect(
    () => ({ phase: phase(), duration: props.duration ?? 4000 }),
    value => {
      if (value.phase !== 'open' || value.duration <= 0 || !fuseEl) return undefined;
      anim?.cancel();
      const a = fuseEl.animate(BURN, { duration: value.duration, easing: 'linear', fill: 'forwards' });
      a.onfinish = () => close('timeout');
      anim = a;
      syncFuse();
      return () => {
        a.onfinish = null;
        a.pause();
      };
    }
  );

  createEffect(
    () => props.pauseOnHover ?? true,
    pauseOnHover => {
      if (!pauseOnHover) {
        flags.hover = false;
        syncFuse();
      }
    }
  );

  onSettled(() => {
    if (!HAS_STARTING_STYLE) requestAnimationFrame(() => setMounted(true));
    const offY = y.on('change', v => {
      if (cardEl) cardEl.style.transform = `translateY(${v}px)`;
    });
    const offFade = fade.on('change', v => {
      if (cardEl) cardEl.style.opacity = String(v);
    });
    const onVisibility = () => {
      flags.hidden = document.hidden;
      syncFuse();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(closeTimer);
      anim?.cancel();
      offY();
      offFade();
      y.stop();
      fade.stop();
      y.destroy();
      fade.destroy();
    };
  });

  const swipeOut = (dy: number, v: number) => {
    anim?.pause();
    leaving = true;
    pendingClose = null;
    if (!reduceNow && cardEl) {
      animate(y, dy + cardEl.offsetHeight, { type: 'spring', duration: 0.3, bounce: 0, velocity: v * 1000 });
    }
    animate(fade, 0, { duration: 0.2, ease: EASE_OUT }).then(() => finish('swipe'));
  };
  const onPointerDown = (e: PointerEvent) => {
    lastInput = 'pointer';
    if (e.button !== 0 || !latest.dismissible || drag || leaving || (e.target as HTMLElement).closest('button')) return;
    if (phaseNow === 'closing') rescue();
    try {
      cardEl?.setPointerCapture(e.pointerId);
    } catch {}
    y.stop();
    drag = {
      id: e.pointerId,
      startY: e.clientY,
      grab: null,
      moved: false,
      hist: [[performance.now(), y.get()]]
    };
    flags.interacting = true;
    syncFuse();
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag;
    if (!d || d.id !== e.pointerId) return;
    if (d.grab === null) {
      if (Math.abs(e.clientY - d.startY) < DEAD_ZONE) return;
      d.grab = e.clientY - y.get();
      if (cardEl) cardEl.dataset.swiping = '';
    }
    const raw = e.clientY - d.grab;
    const next = raw >= 0 ? raw : rubberband(raw, RESIST_PX);
    y.set(next);
    d.moved = true;
    d.hist.push([performance.now(), next]);
    if (d.hist.length > 4) d.hist.shift();
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag;
    if (!d || d.id !== e.pointerId) return;
    drag = null;
    if (cardEl) delete cardEl.dataset.swiping;
    try {
      cardEl?.releasePointerCapture(e.pointerId);
    } catch {}
    flags.interacting = false;
    const dy = y.get();
    const v = velocityOf(d.hist);
    if (dy > 0 && (v > FLICK || (dy >= latest.swipeDistance && v >= 0))) {
      swipeOut(dy, v);
      return;
    }
    if (d.moved) {
      animate(
        y,
        0,
        reduceNow
          ? { duration: 0.2, ease: EASE_OUT }
          : { type: 'spring', duration: 0.5, bounce: latest.settleBounce, velocity: v * 1000 }
      );
    }
    const queued = pendingClose;
    pendingClose = null;
    if (queued) close(queued);
    else syncFuse();
  };

  const rootStyle = createMemo(
    () =>
      ({
        '--st-bg': props.background ?? '#27272a',
        '--st-ink': props.color ?? '#f5f5f5',
        '--st-fuse': props.fuseColor ?? '#24adf5',
        '--st-w': `${props.width ?? 356}px`,
        '--st-radius': `${props.radius ?? 12}px`,
        '--st-slide': `${props.slideMs ?? 400}ms`,
        '--st-gap': '10px'
      }) as JSX.CSSProperties
  );

  return (
    <div
      class={['swipe-toast', props.className]}
      data-phase={phase()}
      data-inline={(props.inline ?? false) ? 'true' : 'false'}
      data-fuse={(props.duration ?? 4000) > 0 ? (props.fuse ?? 'bottom') : 'none'}
      data-dismissible={(props.dismissible ?? true) ? 'true' : 'false'}
      data-instant={instant() ? '' : undefined}
      data-mounted={mounted() ? 'true' : 'false'}
      style={rootStyle()}
    >
      <div class="swipe-toast__gate">
        <div class="swipe-toast__lift">
          <div
            ref={el => (cardEl = el)}
            class="swipe-toast__card"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabindex={0}
            style={{ transform: 'translateY(0px)', opacity: '1' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={e => {
              if (latest.pauseOnHover && e.pointerType === 'mouse') {
                flags.hover = true;
                syncFuse();
              }
            }}
            onPointerLeave={e => {
              if (e.pointerType === 'mouse') {
                flags.hover = false;
                syncFuse();
              }
            }}
            onFocusIn={() => {
              flags.focus = true;
              syncFuse();
            }}
            onFocusOut={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                flags.focus = false;
                syncFuse();
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
              if (e.key === 'Escape' && latest.dismissible) {
                e.stopPropagation();
                close('escape');
              }
            }}
          >
            <Show when={props.icon}>
              {icon => (
                <span class="swipe-toast__icon" aria-hidden="true">
                  {icon()}
                </span>
              )}
            </Show>
            <span class="swipe-toast__body">
              <span class="swipe-toast__title">{props.title ?? 'File archived'}</span>
              <Show when={props.description}>
                {description => <span class="swipe-toast__desc">{description()}</span>}
              </Show>
            </span>
            <Show when={props.actionLabel}>
              {actionLabel => (
                <button
                  type="button"
                  class="swipe-toast__action"
                  onClick={() => {
                    latest.onAction?.();
                    close('action');
                  }}
                >
                  {actionLabel()}
                </button>
              )}
            </Show>
            <Show when={props.closeButton ?? false}>
              <button type="button" class="swipe-toast__close" aria-label="Close" onClick={() => close('close')}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  color="currentColor"
                  innerHTML={CLOSE_ICON}
                />
              </button>
            </Show>
            <i ref={el => (fuseEl = el)} class="swipe-toast__fuse" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
