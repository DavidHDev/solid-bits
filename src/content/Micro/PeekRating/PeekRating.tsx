import { For, Show, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import { dynamic, type JSX } from '@solidjs/web';
import { FavouriteIcon, FlashIcon, StarIcon } from '@hugeicons/core-free-icons';

import './PeekRating.css';

export type PeekRatingShape = 'star' | 'heart' | 'bolt';

export interface PeekRatingProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onPreview?: (value: number | null) => void;
  count?: number;
  shape?: PeekRatingShape;
  icon?: JSX.Element;
  labels?: string[];
  activeColor?: string;
  idleColor?: string;
  tipColor?: string;
  tipTextColor?: string;
  size?: number;
  lift?: number;
  magnify?: number;
  riseDuration?: number;
  popScale?: number;
  showTip?: boolean;
  allowClear?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface GestureState {
  hover: number | null;
  pressing: boolean;
  pointerId: number | null;
  settled: boolean;
  rect: DOMRect | null;
  rtl: boolean;
}

type IconNode = readonly [string, { readonly [key: string]: string | number }];

type Settings = {
  value: number;
  count: number;
  labels: string[];
  size: number;
  lift: number;
  magnify: number;
  popScale: number;
  showTip: boolean;
  allowClear: boolean;
  interactive: boolean;
};

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

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

const SHAPES: Record<PeekRatingShape, string> = {
  star: iconMarkup(StarIcon as readonly IconNode[], 1.5),
  heart: iconMarkup(FavouriteIcon as readonly IconNode[], 1.5),
  bolt: iconMarkup(FlashIcon as readonly IconNode[], 1.5)
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function PeekRating(props: PeekRatingProps) {
  const [inner, setInner] = createSignal(untrack(() => props.defaultValue ?? 0));
  const count = createMemo(() => props.count ?? 5);
  const value = createMemo(() => clamp(props.value ?? inner(), 0, count()));
  const interactive = createMemo(() => !props.readOnly && !props.disabled);
  const size = createMemo(() => props.size ?? 28);
  const lift = createMemo(() => props.lift ?? 6);
  const showTip = createMemo(() => props.showTip ?? true);

  let rootEl: HTMLDivElement | undefined;
  let rowEl: HTMLDivElement | undefined;
  let tipEl: HTMLSpanElement | undefined;
  const starEls: (HTMLElement | undefined)[] = [];
  const liftEls: (HTMLSpanElement | undefined)[] = [];
  const glyphEls: (HTMLSpanElement | undefined)[] = [];
  let cur: Settings | undefined;
  const st: GestureState = {
    hover: null,
    pressing: false,
    pointerId: null,
    settled: false,
    rect: null,
    rtl: false
  };

  const settings = createMemo<Settings>(() => ({
    value: value(),
    count: count(),
    labels: props.labels ?? [],
    size: size(),
    lift: lift(),
    magnify: props.magnify ?? 1.15,
    popScale: props.popScale ?? 1.3,
    showTip: showTip(),
    allowClear: props.allowClear ?? true,
    interactive: interactive()
  }));

  const paint = () => {
    const s = cur;
    if (!s) return;
    const { hover, settled, rtl } = st;
    const previewing = hover !== null && !settled;
    const shown = previewing ? hover + 1 : s.value;
    const still = reducedMotion();

    for (let i = 0; i < s.count; i++) {
      const liftEl = liftEls[i];
      const glyphEl = glyphEls[i];
      if (!liftEl || !glyphEl) continue;
      const lifted = previewing && !still && i <= hover;
      liftEl.style.transform = lifted
        ? `translateY(${-s.lift}px) scale(${i === hover ? s.magnify : 1})`
        : 'translateY(0px) scale(1)';
      glyphEl.dataset.lit = String(i < shown);
    }

    const tip = s.interactive && s.showTip ? tipEl : undefined;
    if (!tip) return;
    if (previewing && s.showTip) {
      const row = rowEl;
      const slot = row ? row.clientWidth / s.count : s.size;
      const visual = rtl ? s.count - 1 - hover : hover;
      const wasHidden = tip.dataset.show !== 'true';
      if (wasHidden) tip.style.transition = 'none';
      tip.textContent = s.labels[hover] ?? String(hover + 1);
      tip.style.transform = `translate(calc(${slot * (visual + 0.5)}px - 50%), 0)`;
      if (wasHidden) {
        void tip.offsetWidth;
        tip.style.transition = '';
      }
      tip.dataset.show = 'true';
    } else {
      tip.dataset.show = 'false';
    }
  };

  createEffect(settings, next => {
    cur = next;
    paint();
  });

  const setHover = (index: number | null) => {
    if (index === st.hover) return;
    st.hover = index;
    if (index !== null) st.settled = false;
    paint();
    props.onPreview?.(index === null ? null : index + 1);
  };

  const measure = () => {
    const row = rowEl;
    if (!row) return;
    st.rect = row.getBoundingClientRect();
    st.rtl = getComputedStyle(row).direction === 'rtl';
  };

  const indexAt = (x: number, y: number): number | null => {
    const { rect, pressing, rtl } = st;
    const n = count();
    const s = size();
    if (!rect || !rect.width) return null;
    if (pressing && (y < rect.top - s || y > rect.bottom + s)) return null;
    const index = clamp(Math.floor(((x - rect.left) / rect.width) * n), 0, n - 1);
    return rtl ? n - 1 - index : index;
  };

  const commit = (next: number, pop = true) => {
    if (props.value === undefined) setInner(next);
    props.onChange?.(next);
    st.settled = true;
    paint();
    const popScale = props.popScale ?? 1.3;
    const glyph = glyphEls[next - 1];
    if (pop && next > 0 && popScale > 1 && glyph && typeof glyph.animate === 'function' && !reducedMotion()) {
      glyph.getAnimations().forEach(animation => animation.cancel());
      glyph.animate(
        [
          { transform: 'scale(1)', easing: EASE_OUT },
          { transform: `scale(${popScale})`, offset: 0.35, easing: EASE_OUT },
          { transform: 'scale(1)' }
        ],
        { duration: 300 }
      );
    }
  };

  const handlePointerEnter = (e: PointerEvent) => {
    if (!interactive() || e.pointerType !== 'mouse') return;
    rootEl?.removeAttribute('data-instant');
    measure();
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!interactive() || e.button !== 0 || st.pointerId !== null) return;
    rootEl?.removeAttribute('data-instant');
    try {
      rowEl?.setPointerCapture(e.pointerId);
    } catch {}
    st.pointerId = e.pointerId;
    st.pressing = true;
    measure();
    setHover(indexAt(e.clientX, e.clientY));
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!interactive()) return;
    const { pressing, pointerId } = st;
    if (e.pointerType !== 'mouse' && !pressing) return;
    if (pressing && e.pointerId !== pointerId) return;
    if (!pressing && !st.rect) measure();
    setHover(indexAt(e.clientX, e.clientY));
  };

  const endPress = (e: PointerEvent) => {
    const { pressing, pointerId, hover } = st;
    if (!pressing || e.pointerId !== pointerId) return;
    st.pressing = false;
    st.pointerId = null;
    if (e.type === 'pointerup' && hover !== null) {
      const next = hover + 1;
      commit((props.allowClear ?? true) && next === value() ? 0 : next);
    }
    if (e.pointerType !== 'mouse') setHover(null);
  };

  const handlePointerLeave = () => {
    if (!st.pressing) setHover(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!interactive()) return;
    const allowClear = props.allowClear ?? true;
    const n = count();
    const current = value();
    const min = allowClear ? 0 : 1;
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = clamp(current + 1, min, n);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = clamp(current - 1, min, n);
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = n;
        break;
      case 'Backspace':
      case 'Delete':
        if (!allowClear) return;
        next = 0;
        break;
      case ' ':
      case 'Enter': {
        const index = starEls.indexOf(e.target as HTMLElement);
        if (index === -1) return;
        next = allowClear && index + 1 === current ? 0 : index + 1;
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    rootEl?.setAttribute('data-instant', 'true');
    st.hover = null;
    commit(next, false);
    starEls[Math.max(next, 1) - 1]?.focus();
  };

  onSettled(() => {
    const reset = () => {
      st.pressing = false;
      st.pointerId = null;
      setHover(null);
    };
    const onVisibility = () => {
      if (document.hidden) reset();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', reset);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', reset);
    };
  });

  const Star = dynamic(() => (props.readOnly ? 'span' : 'button'));
  const shapeIcon = createMemo(() => SHAPES[props.shape ?? 'star'] || SHAPES.star);
  const slots = createMemo(() => Array.from({ length: count() }, (_, i) => i));

  const cssVars = createMemo<JSX.CSSProperties>(() => {
    const s = size();
    const tipRoom = interactive() && showTip() ? Math.round(s * 0.9) : 0;
    return {
      '--pr-active': props.activeColor ?? '#f5b400',
      '--pr-idle': props.idleColor ?? '#52525b',
      '--pr-tip': props.tipColor ?? '#27272a',
      '--pr-tip-text': props.tipTextColor ?? '#f5f5f5',
      '--pr-size': `${s}px`,
      '--pr-gap': `${Math.round(s * 0.22)}px`,
      '--pr-room': `${lift() + tipRoom}px`,
      '--pr-rise': `${props.riseDuration ?? 320}ms`
    };
  });

  return (
    <div
      ref={el => (rootEl = el)}
      role={props.readOnly ? 'img' : 'radiogroup'}
      aria-label={props.readOnly ? `${value()} of ${count()}` : (props.ariaLabel ?? 'Rating')}
      aria-disabled={props.disabled ? 'true' : undefined}
      class={['peek-rating', props.className]}
      style={cssVars()}
      onKeyDown={e => {
        if (!props.readOnly) handleKeyDown(e);
      }}
    >
      <div
        ref={el => (rowEl = el)}
        class="peek-rating__row"
        onPointerEnter={handlePointerEnter}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPress}
        onPointerCancel={endPress}
        onLostPointerCapture={endPress}
        onPointerLeave={handlePointerLeave}
      >
        <Show when={interactive() && showTip()}>
          <span ref={el => (tipEl = el)} class="peek-rating__tip" aria-hidden="true" />
        </Show>
        <For each={slots()} keyed={false}>
          {(_slot, i) => {
            const checked = () => value() === i + 1;
            const label = () => {
              const labels = props.labels ?? [];
              return labels[i] ? `${i + 1} of ${count()}, ${labels[i]}` : `${i + 1} of ${count()}`;
            };
            return (
              <Star
                ref={(el: HTMLElement) => (starEls[i] = el)}
                type={props.readOnly ? undefined : 'button'}
                class="peek-rating__star"
                role={props.readOnly ? undefined : 'radio'}
                aria-checked={props.readOnly ? undefined : checked() ? 'true' : 'false'}
                aria-label={props.readOnly ? undefined : label()}
                aria-hidden={props.readOnly ? 'true' : undefined}
                tabindex={!interactive() ? -1 : (value() === 0 ? i === 0 : checked()) ? 0 : -1}
              >
                <span ref={el => (liftEls[i] = el)} class="peek-rating__lift">
                  <span ref={el => (glyphEls[i] = el)} class="peek-rating__glyph">
                    {props.icon ?? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={size()}
                        height={size()}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        color="currentColor"
                        stroke="currentColor"
                        stroke-width="1.5"
                        innerHTML={shapeIcon()}
                      />
                    )}
                  </span>
                </span>
              </Star>
            );
          }}
        </For>
      </div>
    </div>
  );
}
