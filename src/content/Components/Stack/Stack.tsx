import { For, createEffect, createMemo, createSignal, onCleanup, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue, styleEffect } from 'motion';
import type { MotionValue, ValueAnimationTransition } from 'motion';

import './Stack.css';

type Layout = 'fan' | 'cascade' | 'deck' | 'pile';
type Vector = [number, number];
type Sample = [number, number, number];
type SpringKind = 'place' | 'settle' | 'tuck' | 'face' | 'lean' | 'press' | 'fling';

interface PlaceOptions {
  delay?: number;
  lift?: number;
  kind?: SpringKind;
  velocity?: Vector | null;
  keepZ?: boolean;
}

interface PlaceAllOptions {
  stagger?: number;
  lift?: number;
  released?: number;
  velocity?: Vector | null;
  kind?: SpringKind;
}

export interface StackProps {
  cards?: JSX.Element[];
  layout?: Layout;
  visible?: number;
  spread?: number;
  depth?: number;
  radius?: number;
  frame?: number;
  frameColor?: string;
  shadow?: boolean;
  tilt?: number;
  threshold?: number;
  speed?: number;
  sendToBackOnClick?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  onChange?: (index: number) => void;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Placement {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

interface CardValues {
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  spin: MotionValue<number>;
  lift: MotionValue<number>;
  grabX: MotionValue<number>;
  grabY: MotionValue<number>;
  z: MotionValue<number>;
  opacity: MotionValue<number>;
  shade: MotionValue<number>;
}

interface Settings {
  layout: Layout;
  visible: number;
  spread: number;
  depth: number;
  tilt: number;
  threshold: number;
  speed: number;
  sendToBackOnClick: boolean;
  count: number;
  reduceMotion: boolean;
}

interface DragState {
  card: number;
  id: number;
  element: HTMLDivElement;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  idle: ReturnType<typeof setTimeout> | 0;
  moved: boolean;
  progress: number;
  capture?: boolean;
  samples: Sample[];
}

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format'
];

const ORIGINS: Record<Layout, Vector> = { fan: [0.9, 0.9], cascade: [0.5, 0.5], deck: [0.5, 0], pile: [0.5, 0.5] };
const EXITS: Partial<Record<Layout, Vector>> = { fan: [1, -0.3], cascade: [0.8, 0.6], deck: [0, 1] };
const SHADOW = '0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)';
const CLICK_SLOP = 6;
const FLICK_SPEED = 650;
const LEAN_SPEED = 1300;
const LEAN_REACH = 260;
const PRESS_SCALE = 1.035;
const SPRINGS: Record<SpringKind, Vector> = {
  place: [260, 24],
  settle: [320, 34],
  tuck: [240, 28],
  face: [240, 30],
  lean: [240, 28],
  press: [420, 34],
  fling: [650, 42]
};
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const noise = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const placement = (layout: Layout, position: number, card: number, spread: number, depth: number): Placement => {
  if (layout === 'cascade') {
    return { x: -position * spread * 28, y: -position * spread * 28, rotate: 0, scale: 1 - position * depth * 0.07 };
  }
  if (layout === 'deck') {
    return { x: 0, y: -position * spread * 32, rotate: 0, scale: 1 - position * depth * 0.1 };
  }
  if (layout === 'pile') {
    return {
      x: (noise(card + 1) - 0.5) * spread * 56,
      y: (noise(card + 2) - 0.5) * spread * 44,
      rotate: (noise(card + 3) - 0.5) * spread * 40,
      scale: 1 - position * depth * 0.03
    };
  }
  return { x: 0, y: 0, rotate: position * spread * 8, scale: 1 - position * depth * 0.12 };
};

const releaseVelocity = (samples: Sample[], time: number): Vector => {
  const recent = samples.filter(sample => time - sample[2] <= 100);
  if (recent.length < 2) return [0, 0];
  const first = recent[0];
  const last = recent[recent.length - 1];
  const elapsed = Math.max((last[2] - first[2]) / 1000, 0.008);
  return [(last[0] - first[0]) / elapsed, (last[1] - first[1]) / elapsed];
};

const normalizeOrder = (order: number[], count: number) => {
  if (order.length === count && !order.some(index => index >= count)) return order;
  const next = order.filter(index => index < count);
  for (let index = 0; index < count; index++) if (!next.includes(index)) next.push(index);
  return next;
};

export default function Stack(props: StackProps) {
  const items = createMemo<JSX.Element[]>(() => {
    const cards = props.cards;
    return cards && cards.length
      ? cards
      : DEFAULT_IMAGES.map((src, index) => <img src={src} alt={`Card ${index + 1}`} draggable="false" />);
  });
  const count = createMemo(() => items().length);
  const shape = createMemo<Layout>(() => {
    const layout = props.layout ?? 'fan';
    return layout in ORIGINS ? layout : 'fan';
  });
  const [reduceMotion, setReduceMotion] = createSignal(
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
  const [order, setOrder] = createSignal<number[]>(prev =>
    normalizeOrder(prev ?? Array.from({ length: count() }, (_, index) => index), count())
  );
  const [dragging, setDragging] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);

  const settings = createMemo<Settings>(() => ({
    layout: shape(),
    visible: clamp(Math.round(props.visible ?? 4), 1, Math.max(count(), 1)),
    spread: clamp(props.spread ?? 0.5, 0, 2),
    depth: clamp(props.depth ?? 0.5, 0, 1),
    tilt: clamp(props.tilt ?? 30, 0, 89),
    threshold: Math.max(props.threshold ?? 90, 0),
    speed: clamp(props.speed ?? 1, 0.2, 4),
    sendToBackOnClick: props.sendToBackOnClick ?? false,
    count: count(),
    reduceMotion: reduceMotion()
  }));

  let rootEl: HTMLDivElement | undefined;
  let current: Settings = untrack(settings);
  let orderRef: number[] = untrack(order);
  const values = new Map<number, CardValues>();
  const elements = new Map<number, HTMLDivElement>();
  const flying = new Map<number, { turned: boolean }>();
  let drag: DragState | null = null;
  let alive = true;
  let mounted = false;

  const valuesFor = (index: number): CardValues => {
    let group = values.get(index);
    if (!group) {
      const s = current;
      const position = Math.max(0, orderRef.indexOf(index));
      const start = placement(
        s.layout,
        s.reduceMotion ? Math.min(position, s.visible - 1) : 0,
        index,
        s.spread,
        s.depth
      );
      group = {
        x: motionValue(start.x),
        y: motionValue(start.y),
        rotate: motionValue(start.rotate),
        scale: motionValue(start.scale),
        tiltX: motionValue(0),
        tiltY: motionValue(0),
        spin: motionValue(0),
        lift: motionValue(1),
        grabX: motionValue(0.5),
        grabY: motionValue(0.5),
        z: motionValue(s.count - position),
        opacity: motionValue(position < s.visible ? 1 : 0),
        shade: motionValue(0)
      };
      values.set(index, group);
    }
    return group;
  };

  const springFor = (
    s: Settings,
    kind: SpringKind,
    extra: ValueAnimationTransition<number> = {}
  ): ValueAnimationTransition<number> => {
    if (s.reduceMotion) return { duration: 0.2, ease: 'easeOut', delay: extra.delay || 0 };
    const [stiffness, damping] = SPRINGS[kind];
    return {
      type: 'spring',
      stiffness: stiffness * s.speed * s.speed,
      damping: damping * s.speed,
      restDelta: 0.01,
      restSpeed: 0.5,
      ...extra
    };
  };

  const settleFace = (group: CardValues, s: Settings, delay = 0) => {
    const transition = springFor(s, 'face', { delay });
    animate(group.tiltX, 0, transition);
    animate(group.tiltY, 0, transition);
    animate(group.spin, 0, transition);
    animate(group.lift, 1, transition);
  };

  const placeCard = (
    index: number,
    position: number,
    { delay = 0, lift = 0, kind = 'place', velocity = null, keepZ = false }: PlaceOptions = {}
  ) => {
    const s = current;
    const group = valuesFor(index);
    const shown = Math.min(position, s.visible - 1);
    const target = placement(s.layout, shown, index, s.spread, s.depth);
    if (lift > 0 && shown > 0) {
      const ahead = placement(s.layout, shown - 1, index, s.spread, s.depth);
      target.x = mix(target.x, ahead.x, lift);
      target.y = mix(target.y, ahead.y, lift);
      target.rotate = mix(target.rotate, ahead.rotate, lift);
      target.scale = mix(target.scale, ahead.scale, lift);
    }
    const motionSpring = springFor(s, kind, { delay });
    const fade: ValueAnimationTransition<number> = {
      duration: s.reduceMotion ? 0.2 : 0.35 / s.speed,
      ease: 'easeOut',
      delay
    };
    if (!keepZ) group.z.set(s.count - position);
    animate(group.x, target.x, velocity ? { ...motionSpring, velocity: velocity[0] } : motionSpring);
    animate(group.y, target.y, velocity ? { ...motionSpring, velocity: velocity[1] } : motionSpring);
    animate(group.rotate, target.rotate, motionSpring);
    animate(group.scale, target.scale, motionSpring);
    settleFace(group, s, delay);
    animate(group.opacity, position < s.visible ? 1 : 0, fade);
    animate(group.shade, Math.min(0.6, shown * s.depth * 0.14 * (1 - lift)), fade);
  };

  const placeAll = ({
    stagger = 0,
    lift = 0,
    released = -1,
    velocity = null,
    kind = 'place'
  }: PlaceAllOptions = {}) => {
    const active = drag;
    orderRef.forEach((index, position) => {
      const flight = flying.get(index);
      if (flight && !flight.turned) return;
      if (active && active.moved && active.card === index) return;
      const isReleased = index === released;
      placeCard(index, position, {
        delay: position * stagger,
        lift: position > 0 ? lift : 0,
        kind: flight ? 'tuck' : isReleased ? 'settle' : kind,
        velocity: isReleased ? velocity : null,
        keepZ: !!flight
      });
    });
  };

  const commit = (next: number[]) => {
    orderRef = next;
    setOrder(next);
  };

  const sendToBack = (direction: Vector | null, velocity: Vector | null = null) => {
    const s = current;
    const currentOrder = orderRef;
    if (currentOrder.length < 2) return;
    const top = currentOrder[0];
    if (flying.has(top)) return;
    const next = [...currentOrder.slice(1), top];
    if (s.reduceMotion) {
      commit(next);
      return;
    }
    let [dx, dy] = direction || EXITS[s.layout] || [Math.cos(noise(top + 9) * 6.283), Math.sin(noise(top + 9) * 6.283)];
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const bounds = rootEl?.getBoundingClientRect();
    const width = bounds?.width || 240;
    const height = bounds?.height || 240;
    const clearance = Math.min(width / Math.max(Math.abs(dx), 0.01), height / Math.max(Math.abs(dy), 0.01));
    const home = placement(s.layout, 0, top, s.spread, s.depth);
    const travel = clearance * 1.12 + 40;
    const out = [home.x + dx * travel, home.y + dy * travel];
    const group = valuesFor(top);
    const launch = springFor(s, 'fling');
    const flight = { turned: false };
    flying.set(top, flight);
    group.z.set(s.count + 1);
    animate(group.x, out[0], velocity ? { ...launch, velocity: velocity[0] } : launch);
    animate(group.y, out[1], velocity ? { ...launch, velocity: velocity[1] } : launch);
    settleFace(group, s);
    commit(next);
    const span = Math.max(Math.hypot(out[0] - group.x.get(), out[1] - group.y.get()), 1);
    let landed = false;
    const turn = () => {
      flight.turned = true;
      const position = orderRef.indexOf(top);
      if (position >= 0) placeCard(top, position, { kind: 'tuck', keepZ: !landed });
    };
    const land = () => {
      landed = true;
      if (flying.get(top) === flight) flying.delete(top);
      const position = orderRef.indexOf(top);
      if (position >= 0) group.z.set(current.count - position);
    };
    const fallback = setTimeout(() => {
      if (!flight.turned) turn();
      if (!landed) land();
    }, 1500 / s.speed);
    const clearOfPile = () => {
      const element = elements.get(top);
      if (!element) return true;
      const mine = element.getBoundingClientRect();
      for (const [index, other] of elements) {
        if (index === top || flying.has(index) || valuesFor(index).opacity.get() < 0.5) continue;
        const box = other.getBoundingClientRect();
        if (mine.left < box.right && mine.right > box.left && mine.top < box.bottom && mine.bottom > box.top) {
          return false;
        }
      }
      return true;
    };
    const watch = () => {
      if (!alive || (flight.turned && landed)) {
        clearTimeout(fallback);
        return;
      }
      const x = group.x.get();
      const y = group.y.get();
      const outward = group.x.getVelocity() * dx + group.y.getVelocity() * dy;
      if (!flight.turned && (Math.hypot(out[0] - x, out[1] - y) <= span * 0.06 || outward < 0)) turn();
      if (!landed && (clearOfPile() || (flight.turned && outward < 0))) land();
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  };

  const lean = (state: DragState) => {
    const s = current;
    if (s.reduceMotion) return;
    const group = valuesFor(state.card);
    const offsetX = group.x.get() - state.homeX;
    const offsetY = group.y.get() - state.homeY;
    const sideways = clamp(state.vx / LEAN_SPEED, -1, 1) * 0.7 + clamp(offsetX / LEAN_REACH, -1, 1) * 0.3;
    const upward = clamp(-state.vy / LEAN_SPEED, -1, 1) * 0.7 + clamp(-offsetY / LEAN_REACH, -1, 1) * 0.3;
    const follow = springFor(s, 'lean');
    animate(group.tiltY, sideways * s.tilt, follow);
    animate(group.tiltX, upward * s.tilt, follow);
    animate(group.spin, clamp(offsetX / LEAN_REACH, -1, 1) * 6, follow);
  };

  const onMove = (event: PointerEvent) => {
    const state = drag;
    if (!state || event.pointerId !== state.id) return;
    const s = current;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const group = valuesFor(state.card);
    if (!state.moved) {
      if (Math.hypot(dx, dy) < CLICK_SLOP) return;
      state.moved = true;
      group.x.stop();
      group.y.stop();
      state.originX = group.x.get() - dx;
      state.originY = group.y.get() - dy;
      try {
        state.element.setPointerCapture(state.id);
      } catch {
        state.capture = false;
      }
      setDragging(true);
    }
    group.x.set(state.originX + dx);
    group.y.set(state.originY + dy);
    state.samples.push([event.clientX, event.clientY, event.timeStamp]);
    if (state.samples.length > 12) state.samples.shift();
    [state.vx, state.vy] = releaseVelocity(state.samples, event.timeStamp);
    lean(state);
    clearTimeout(state.idle);
    state.idle = setTimeout(() => {
      if (drag !== state) return;
      state.vx = 0;
      state.vy = 0;
      lean(state);
    }, 70);
    const progress = clamp(Math.hypot(dx, dy) / Math.max(s.threshold, 1), 0, 1);
    if (Math.abs(progress - state.progress) > 0.02) {
      state.progress = progress;
      placeAll({ lift: progress * 0.4, kind: 'settle' });
    }
  };

  const onUp = (event: PointerEvent) => {
    const state = drag;
    if (!state || event.pointerId !== state.id) return;
    drag = null;
    clearTimeout(state.idle);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    try {
      state.element.releasePointerCapture(state.id);
    } catch {
      state.capture = false;
    }
    const s = current;
    if (!state.moved) {
      if (event.type === 'pointerup' && s.sendToBackOnClick) sendToBack(null);
      else settleFace(valuesFor(state.card), s);
      return;
    }
    setDragging(false);
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const [vx, vy] = releaseVelocity(state.samples, event.timeStamp);
    const distance = Math.hypot(dx, dy);
    const pace = Math.hypot(vx, vy);
    const flick = pace > FLICK_SPEED && distance > 16 && vx * dx + vy * dy > 0;
    if (event.type === 'pointerup' && s.count > 1 && (distance > s.threshold || flick)) {
      sendToBack(pace > 300 ? [vx, vy] : [dx, dy], [vx, vy]);
    } else {
      placeAll({ released: state.card, velocity: [clamp(vx, -3000, 3000), clamp(vy, -3000, 3000)] });
    }
  };

  const onDown = (event: PointerEvent & { currentTarget: HTMLDivElement }, index: number) => {
    if (event.button !== 0 || drag) return;
    if (orderRef[0] !== index || flying.has(index)) return;
    const s = current;
    const group = valuesFor(index);
    const home = placement(s.layout, 0, index, s.spread, s.depth);
    const bounds = event.currentTarget.getBoundingClientRect();
    group.grabX.set(clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1));
    group.grabY.set(clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1));
    if (!s.reduceMotion) animate(group.lift, PRESS_SCALE, springFor(s, 'press'));
    drag = {
      card: index,
      id: event.pointerId,
      element: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      originX: 0,
      originY: 0,
      homeX: home.x,
      homeY: home.y,
      vx: 0,
      vy: 0,
      idle: 0,
      moved: false,
      progress: 0,
      samples: [[event.clientX, event.clientY, event.timeStamp]]
    };
    if (event.pointerType === 'mouse') event.preventDefault();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const onKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement }) => {
    if (event.target !== event.currentTarget) return;
    if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      sendToBack(null);
    }
  };

  let lastOrder: number[] | null = null;
  let lastKey = '';
  createEffect(
    () => ({ next: order(), s: settings() }),
    ({ next, s }) => {
      current = s;
      const key = [s.layout, s.visible, s.spread, s.depth, s.speed, s.count].join('|');
      if (next === lastOrder && key === lastKey) return;
      lastOrder = next;
      lastKey = key;
      orderRef = next;
      placeAll({ stagger: mounted ? 0 : 0.06 });
      mounted = true;
    }
  );

  let changed = false;
  createEffect(
    () => order()[0],
    top => {
      if (!changed) {
        changed = true;
        return;
      }
      if (top !== undefined) untrack(() => props.onChange)?.(top);
    }
  );

  createEffect(
    () => ({
      enabled: !!props.autoplay && count() >= 2 && !dragging() && !((props.pauseOnHover ?? false) && hovered()),
      delay: props.autoplayDelay ?? 3000,
      order: order()
    }),
    ({ enabled, delay }) => {
      if (!enabled) return undefined;
      const timer = setTimeout(() => sendToBack(null), Math.max(300, delay));
      return () => clearTimeout(timer);
    }
  );

  onSettled(() => {
    alive = true;
    const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
    const onMedia = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    media?.addEventListener('change', onMedia);
    return () => {
      alive = false;
      media?.removeEventListener('change', onMedia);
      if (drag) clearTimeout(drag.idle);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      values.forEach(group => Object.values(group).forEach(value => value.stop()));
    };
  });

  const innerRadius = () => Math.max(0, (props.radius ?? 16) - (props.frame ?? 0));

  return (
    <div
      ref={el => (rootEl = el)}
      class={['stack', props.className]}
      style={props.style}
      tabindex={0}
      role="group"
      aria-label="Card stack"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <For each={items()} keyed={false}>
        {(card, index) => {
          const group = untrack(() => valuesFor(index));
          const perspective = motionValue(800);
          let unbindCard: (() => void) | null = null;
          let unbindFace: (() => void) | null = null;
          let unbindShade: (() => void) | null = null;
          onCleanup(() => {
            unbindCard?.();
            unbindFace?.();
            unbindShade?.();
            elements.delete(index);
          });
          const isTop = () => order()[0] === index;
          return (
            <div
              ref={el => {
                elements.set(index, el);
                unbindCard = styleEffect(el, {
                  x: group.x,
                  y: group.y,
                  rotate: group.rotate,
                  scale: group.scale,
                  zIndex: group.z,
                  opacity: group.opacity
                });
                styleEffect.flush(el);
              }}
              class="stack-card"
              data-top={isTop() ? '' : undefined}
              aria-hidden={isTop() ? undefined : 'true'}
              style={{
                'transform-origin': `${ORIGINS[shape()][0] * 100}% ${ORIGINS[shape()][1] * 100}% 0`,
                cursor: isTop() ? (dragging() ? 'grabbing' : 'grab') : 'default',
                'touch-action': isTop() ? 'pan-y' : 'auto'
              }}
              onPointerDown={event => onDown(event, index)}
            >
              <div
                ref={el => {
                  unbindFace = styleEffect(el, {
                    transformPerspective: perspective,
                    rotateX: group.tiltX,
                    rotateY: group.tiltY,
                    rotate: group.spin,
                    scale: group.lift,
                    originX: group.grabX,
                    originY: group.grabY
                  });
                  styleEffect.flush(el);
                }}
                class="stack-card-face"
                style={{
                  'border-radius': `${props.radius ?? 16}px`,
                  padding: `${props.frame ?? 0}px`,
                  'background-color': (props.frame ?? 0) > 0 ? (props.frameColor ?? '#ffffff') : 'transparent',
                  'box-shadow': (props.shadow ?? true) ? SHADOW : 'none'
                }}
              >
                <div class="stack-card-content" style={{ 'border-radius': `${innerRadius()}px` }}>
                  {card()}
                </div>
                <div
                  ref={el => {
                    unbindShade = styleEffect(el, { opacity: group.shade });
                    styleEffect.flush(el);
                  }}
                  class="stack-card-shade"
                  style={{ 'border-radius': `${props.radius ?? 16}px` }}
                />
              </div>
            </div>
          );
        }}
      </For>
    </div>
  );
}
