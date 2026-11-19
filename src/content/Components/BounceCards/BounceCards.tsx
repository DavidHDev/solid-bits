import { For, Show, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';

import './BounceCards.css';

export type BounceCardImage = string | { src: string; alt?: string };

export type BounceCardsProps = {
  images?: BounceCardImage[];
  className?: string;
  style?: JSX.CSSProperties;
  containerWidth?: number;
  containerHeight?: number;
  cardSize?: number;
  spread?: number;
  rotation?: number;
  arc?: number;
  animationDelay?: number;
  animationStagger?: number;
  bounciness?: number;
  enableHover?: boolean;
  pushDistance?: number;
  hoverScale?: number;
  borderWidth?: number;
  borderColor?: string;
  radius?: number;
  shadow?: boolean;
  transformStyles?: string[];
  onCardClick?: (index: number) => void;
};

type Slot = { x: number; y: number; rotate: number };

type Body = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  vx: number;
  vy: number;
  vr: number;
  vs: number;
  born: number;
};

type Settings = {
  slots: Slot[];
  cardSize: number;
  delay: number;
  stagger: number;
  bounciness: number;
  enableHover: boolean;
  pushDistance: number;
  hoverScale: number;
  clickable: boolean;
};

const PATTERN = [1, 0.5, -0.3, -1, 0.2, 0.75, -0.6, 0.35, -0.85, 0.1];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseTransform = (value: string | undefined): Slot | null => {
  if (typeof value !== 'string') return null;
  const rotate = value.match(/rotate\(\s*(-?[\d.]+)deg\s*\)/);
  const translate = value.match(/translate\(\s*(-?[\d.]+)px(?:\s*,\s*(-?[\d.]+)px)?\s*\)/);
  return {
    x: translate ? Number(translate[1]) : 0,
    y: translate && translate[2] ? Number(translate[2]) : 0,
    rotate: rotate ? Number(rotate[1]) : 0
  };
};

const toCard = (item: BounceCardImage) =>
  typeof item === 'string' ? { src: item, alt: '' } : { src: item?.src, alt: item?.alt ?? '' };

export default function BounceCards(props: BounceCardsProps) {
  let rootEl: HTMLDivElement | undefined;
  const cardEls: (HTMLDivElement | null)[] = [];
  let current!: Settings;
  let wake: (() => void) | null = null;

  const cards = createMemo(() => (props.images ?? []).map(toCard));

  const settings = createMemo<Settings>(() => {
    const list = cards();
    const count = list.length;
    const middle = (count - 1) / 2;
    const reach = Math.max(1, middle);
    const spread = props.spread ?? 85;
    const rotation = props.rotation ?? 10;
    const arc = props.arc ?? 0;
    const transformStyles = props.transformStyles;
    const slots = list.map((_, i): Slot => {
      const custom = transformStyles ? parseTransform(transformStyles[i]) : null;
      if (custom) return custom;
      const offset = i - middle;
      return {
        x: offset * spread,
        y: arc * (offset / reach) ** 2,
        rotate: rotation * PATTERN[i % PATTERN.length]
      };
    });
    return {
      slots,
      cardSize: Math.max(10, props.cardSize ?? 200),
      delay: Math.max(0, props.animationDelay ?? 0.5),
      stagger: Math.max(0, props.animationStagger ?? 0.06),
      bounciness: clamp(props.bounciness ?? 0.6, 0, 1),
      enableHover: props.enableHover ?? true,
      pushDistance: props.pushDistance ?? 160,
      hoverScale: clamp(props.hoverScale ?? 1.06, 0.5, 2),
      clickable: typeof props.onCardClick === 'function'
    };
  });

  createEffect(settings, value => {
    current = value;
    cardEls.length = value.slots.length;
    wake?.();
  });

  onSettled(() => {
    current = settings();
    const root = rootEl;
    if (!root) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const bodies: Body[] = [];
    const state = { hovered: -1, time: 0, layer: -1 };
    let raf = 0;
    let last = performance.now();
    let alive = true;

    const body = (i: number): Body => {
      if (!bodies[i]) {
        const slot = current.slots[i] ?? { x: 0, y: 0, rotate: 0 };
        bodies[i] = {
          x: slot.x,
          y: slot.y,
          rotate: slot.rotate,
          scale: reduce ? 1 : 0,
          vx: 0,
          vy: 0,
          vr: 0,
          vs: 0,
          born: state.time
        };
      }
      return bodies[i];
    };

    const step = (
      value: number,
      velocity: number,
      target: number,
      stiffness: number,
      damping: number,
      dt: number
    ): [number, number] => {
      const next = velocity + ((target - value) * stiffness - velocity * damping) * dt;
      return [value + next * dt, next];
    };

    const frame = (now: number) => {
      raf = 0;
      if (!alive) return;
      const s = current;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      state.time += dt;

      const hovered = s.enableHover ? state.hovered : -1;
      const popStiffness = 170;
      const popDamping = 2 * (1 - 0.85 * s.bounciness) * Math.sqrt(popStiffness);
      const moveStiffness = 210;
      const moveDamping = 2 * (reduce ? 1 : 0.72) * Math.sqrt(moveStiffness);
      const substeps = Math.ceil(dt / (1 / 240));
      const h = dt / substeps;
      let moving = 0;

      for (let i = 0; i < s.slots.length; i++) {
        const el = cardEls[i];
        if (!el) continue;
        const card = body(i);
        const slot = s.slots[i];
        const appeared = reduce || state.time - card.born >= s.delay + i * s.stagger;
        let targetX = slot.x;
        let targetY = slot.y;
        let targetRotate = slot.rotate;
        let targetScale = appeared ? 1 : 0;
        if (hovered >= 0 && appeared) {
          if (i === hovered) {
            targetY = slot.y - s.cardSize * 0.04;
            targetRotate = 0;
            targetScale = s.hoverScale;
          } else {
            targetX = slot.x + Math.sign(i - hovered) * s.pushDistance;
          }
        }
        for (let k = 0; k < substeps; k++) {
          [card.x, card.vx] = step(card.x, card.vx, targetX, moveStiffness, moveDamping, h);
          [card.y, card.vy] = step(card.y, card.vy, targetY, moveStiffness, moveDamping, h);
          [card.rotate, card.vr] = step(card.rotate, card.vr, targetRotate, moveStiffness, moveDamping, h);
          if (reduce) {
            card.scale = targetScale;
            card.vs = 0;
          } else {
            [card.scale, card.vs] = step(card.scale, card.vs, targetScale, popStiffness, popDamping, h);
          }
        }
        moving +=
          Math.abs(card.vx) +
          Math.abs(card.vy) +
          Math.abs(card.vr) +
          Math.abs(card.vs) * 100 +
          Math.abs(targetX - card.x) +
          Math.abs(targetY - card.y) +
          Math.abs(targetRotate - card.rotate) +
          Math.abs(targetScale - card.scale) * 100 +
          (appeared ? 0 : 1);
        el.style.transform = `translate(-50%, -50%) translate3d(${card.x.toFixed(2)}px, ${card.y.toFixed(2)}px, 0) rotate(${card.rotate.toFixed(3)}deg) scale(${Math.max(0, card.scale).toFixed(4)})`;
      }

      if (state.layer !== hovered) {
        state.layer = hovered;
        cardEls.forEach((el, i) => {
          if (!el) return;
          el.style.zIndex = i === hovered ? String(s.slots.length + 1) : String(i + 1);
          el.toggleAttribute('data-active', i === hovered);
        });
      }

      if (moving > 0.02) raf = requestAnimationFrame(frame);
    };

    wake = () => {
      if (raf || !alive) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const pick = (event: MouseEvent): number => {
      const s = current;
      const rect = root.getBoundingClientRect();
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      let best = -1;
      let distance = Infinity;
      s.slots.forEach((slot, i) => {
        const gap = Math.abs(px - slot.x);
        if (gap < distance) {
          distance = gap;
          best = i;
        }
      });
      if (best < 0) return -1;
      const slot = s.slots[best];
      const half = s.cardSize / 2;
      if (Math.abs(py - slot.y) > half + 12 || distance > half + 12) return -1;
      if (state.hovered >= 0 && state.hovered !== best) {
        const active = s.slots[state.hovered];
        if (active && Math.abs(px - active.x) - distance < 6) return state.hovered;
      }
      return best;
    };

    const onMove = (event: PointerEvent) => {
      const next = pick(event);
      if (next !== state.hovered) {
        state.hovered = next;
        wake?.();
      }
    };
    const onLeave = () => {
      if (state.hovered !== -1) {
        state.hovered = -1;
        wake?.();
      }
    };
    const onClick = (event: MouseEvent) => {
      const index = pick(event);
      if (index < 0) return;
      const card = bodies[index];
      if (card && !reduce) card.vs -= 2.2;
      wake?.();
      props.onCardClick?.(index);
    };
    const onFocus = (event: FocusEvent) => {
      const index = cardEls.indexOf(event.target as HTMLDivElement);
      if (index >= 0) {
        state.hovered = index;
        wake?.();
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const index = cardEls.indexOf(event.target as HTMLDivElement);
      if (index < 0 || !current.clickable) return;
      event.preventDefault();
      if (bodies[index] && !reduce) bodies[index].vs -= 2.2;
      wake?.();
      props.onCardClick?.(index);
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerdown', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('click', onClick);
    root.addEventListener('focusin', onFocus);
    root.addEventListener('focusout', onLeave);
    root.addEventListener('keydown', onKey);
    wake();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      wake = null;
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerdown', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('click', onClick);
      root.removeEventListener('focusin', onFocus);
      root.removeEventListener('focusout', onLeave);
      root.removeEventListener('keydown', onKey);
    };
  });

  const rootStyle = createMemo<JSX.CSSProperties>(() => {
    const shadow = props.shadow ?? true;
    return {
      width: `${props.containerWidth ?? 400}px`,
      height: `${props.containerHeight ?? 400}px`,
      '--bounce-cards-size': `${settings().cardSize}px`,
      '--bounce-cards-border': `${Math.max(0, props.borderWidth ?? 5)}px`,
      '--bounce-cards-border-color': props.borderColor ?? '#ffffff',
      '--bounce-cards-radius': `${Math.max(0, props.radius ?? 25)}px`,
      '--bounce-cards-shadow': shadow ? '0 1px 2px rgba(0, 0, 0, 0.12), 0 10px 28px -6px rgba(0, 0, 0, 0.32)' : 'none',
      '--bounce-cards-shadow-active': shadow
        ? '0 2px 4px rgba(0, 0, 0, 0.14), 0 22px 44px -10px rgba(0, 0, 0, 0.42)'
        : 'none',
      ...props.style
    };
  });

  return (
    <div ref={el => (rootEl = el)} class={['bounce-cards', props.className]} style={rootStyle()}>
      <For each={cards()} keyed={false}>
        {(card, i) => (
          <div
            ref={el => {
              cardEls[i] = el;
            }}
            class={['bounce-cards__card', { 'bounce-cards__card--clickable': settings().clickable }]}
            style={{ 'z-index': i + 1 }}
            role={settings().clickable ? 'button' : undefined}
            tabindex={settings().clickable ? 0 : undefined}
            aria-label={settings().clickable ? card().alt || `Card ${i + 1}` : undefined}
          >
            <Show when={card().src}>
              <img src={card().src} alt={card().alt} draggable="false" />
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
