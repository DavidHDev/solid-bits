import { For, createEffect, createMemo, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';

type IdleMode = 'none' | 'wave' | 'pulse';

export interface TextPressureProps {
  text?: string;
  fontFamily?: string;
  fontUrl?: string;
  width?: boolean;
  weight?: boolean;
  italic?: boolean;
  alpha?: boolean;
  flex?: boolean;
  stroke?: boolean;
  scale?: boolean;
  radius?: number;
  smoothing?: number;
  idle?: IdleMode;
  idleSpeed?: number;
  clickRipple?: boolean;
  textColor?: string;
  pressureColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
  minFontSize?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Ripple extends Point {
  start: number;
}

interface PressureOptions {
  width: boolean;
  weight: boolean;
  italic: boolean;
  alpha: boolean;
  radius: number;
  smoothing: number;
  idle: IdleMode;
  idleSpeed: number;
  clickRipple: boolean;
  textColor: string;
  pressureColor: string;
  count: number;
  minFontSize: number;
  scale: boolean;
  text: string;
  flex: boolean;
  fontFamily: string;
}

interface AppliedStyle {
  span: HTMLSpanElement;
  settings: string;
  alphaVal: string;
  color: string;
}

const RIPPLE_LIFE = 1.3;
const MAX_RIPPLES = 6;
const WAVE_PERIOD = 3.2;
const PULSE_PERIOD = 2.8;
const PULSE_DEPTH = 0.42;

const DEFAULT_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap';

const dist = (a: Point, b: Point) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const getIdlePressure = (mode: IdleMode, position: number, clock: number, spread: number) => {
  if (mode === 'wave') {
    const crest = 0.5 + 0.5 * Math.cos(Math.PI * 2 * (position / spread - clock / WAVE_PERIOD));
    return crest * crest;
  }
  if (mode === 'pulse') {
    const lag = Math.abs(position - 0.5) * 0.4;
    const breath = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (clock / PULSE_PERIOD - lag));
    return PULSE_DEPTH * breath * breath * (3 - 2 * breath);
  }
  return 0;
};

const getRipplePressure = (ripples: Ripple[], point: Point, now: number, span: number) => {
  const band = Math.max(span * 0.14, 32);
  let total = 0;
  for (const ripple of ripples) {
    const age = (now - ripple.start) / 1000;
    if (age <= 0 || age >= RIPPLE_LIFE) continue;
    const offset = (dist(ripple, point) - age * span * 1.25) / band;
    if (offset <= -1 || offset >= 1) continue;
    const fade = 1 - age / RIPPLE_LIFE;
    const swell = (1 - offset * offset) ** 2 * fade * fade * Math.min(1, age / 0.06);
    total = 1 - (1 - total) * (1 - swell);
  }
  return total;
};

export default function TextPressure(props: TextPressureProps) {
  let containerEl: HTMLDivElement | undefined;
  let titleEl: HTMLHeadingElement | undefined;
  let current!: PressureOptions;
  let wake: (() => void) | null = null;
  let resize: (() => void) | null = null;

  const chars = createMemo(() => Array.from(props.text ?? 'Compressa'));

  const options = createMemo<PressureOptions>(() => ({
    width: props.width ?? true,
    weight: props.weight ?? true,
    italic: props.italic ?? true,
    alpha: props.alpha ?? false,
    radius: props.radius ?? 0.5,
    smoothing: props.smoothing ?? 0.5,
    idle: props.idle ?? 'none',
    idleSpeed: props.idleSpeed ?? 1,
    clickRipple: props.clickRipple ?? true,
    textColor: props.textColor ?? 'currentColor',
    pressureColor: props.pressureColor ?? '',
    count: chars().length,
    minFontSize: props.minFontSize ?? 24,
    scale: props.scale ?? false,
    text: props.text ?? 'Compressa',
    flex: props.flex ?? true,
    fontFamily: props.fontFamily ?? 'Roboto Flex'
  }));

  createEffect(options, value => {
    const previous = current;
    current = value;
    if (
      !previous ||
      previous.count !== value.count ||
      previous.minFontSize !== value.minFontSize ||
      previous.scale !== value.scale
    ) {
      resize?.();
    }
    wake?.();
  });

  onSettled(() => {
    current = options();
    const container = containerEl;
    const title = titleEl;
    if (!container || !title) return;

    const mouse: Point = { x: 0, y: 0 };
    const cursor: Point & { seen: boolean } = { x: 0, y: 0, seen: false };
    const ripples: Ripple[] = [];
    let visible = true;

    const nudge = () => wake?.();
    const track = (x: number, y: number) => {
      cursor.x = x;
      cursor.y = y;
      cursor.seen = true;
      nudge();
    };
    const handleMouseMove = (e: MouseEvent) => track(e.clientX, e.clientY);
    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) track(t.clientX, t.clientY);
    };
    const handleLeave = () => {
      cursor.seen = false;
      nudge();
    };
    const handlePress = (e: PointerEvent) => {
      if (!current.clickRipple) return;
      ripples.push({ x: e.clientX, y: e.clientY, start: performance.now() });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      nudge();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouch, { passive: true });
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleLeave);
    window.addEventListener('touchcancel', handleLeave);
    window.addEventListener('scroll', nudge, { passive: true, capture: true });
    document.documentElement.addEventListener('mouseleave', handleLeave);
    document.fonts?.addEventListener?.('loadingdone', nudge);
    container.addEventListener('pointerdown', handlePress);

    const start = container.getBoundingClientRect();
    mouse.x = start.left + start.width / 2;
    mouse.y = start.top + start.height / 2;
    cursor.x = mouse.x;
    cursor.y = mouse.y;

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (entry.isIntersecting) nudge();
    });
    intersection.observe(container);

    resize = () => {
      const { width: containerW, height: containerH } = container.getBoundingClientRect();
      const count = current.count;
      const minFontSize = current.minFontSize;
      const nextFontSize = Math.max(count ? containerW / (count / 2) : minFontSize, minFontSize);
      const scaleY = current.scale && containerH > 0 ? containerH / nextFontSize : 1;
      title.style.fontSize = `${nextFontSize}px`;
      title.style.transform = `scale(1, ${scaleY})`;
      nudge();
    };
    resize();
    const sizeObserver = new ResizeObserver(() => resize?.());
    sizeObserver.observe(container);

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const applied: AppliedStyle[] = [];
    let rafId = 0;
    let last = 0;
    let idleFrames = 0;
    let clock = 0;
    let engage = current.idle === 'wave' || current.idle === 'pulse' ? 0 : 1;

    const tick = (now: number) => {
      rafId = 0;
      const elapsed = last ? Math.min(now - last, 64) : 1000 / 60;
      last = now;

      const opts = current;
      const idleMode: IdleMode =
        (opts.idle === 'wave' || opts.idle === 'pulse') && !motionQuery?.matches ? opts.idle : 'none';
      const lag = 1000 * opts.smoothing * opts.smoothing;
      const follow = lag > 1 ? 1 - Math.exp(-elapsed / lag) : 1;
      mouse.x += (cursor.x - mouse.x) * follow;
      mouse.y += (cursor.y - mouse.y) * follow;

      let present = 1;
      if (idleMode !== 'none') {
        const box = container.getBoundingClientRect();
        const inside = cursor.x >= box.left && cursor.x <= box.right && cursor.y >= box.top && cursor.y <= box.bottom;
        present = cursor.seen && inside ? 1 : 0;
      }
      engage += (present - engage) * (1 - Math.exp(-elapsed / 320));
      if (Math.abs(present - engage) < 0.002) engage = present;
      const idling = idleMode !== 'none' && engage < 1;
      if (idling) clock += (elapsed / 1000) * opts.idleSpeed;

      while (ripples.length && now - ripples[0].start > RIPPLE_LIFE * 1000) ripples.shift();

      const titleRect = title.getBoundingClientRect();
      const maxDist = Math.max(titleRect.width * opts.radius, 1);
      const spread = Math.max(opts.radius * 2, 0.2);
      const spans = Array.from(title.children) as HTMLSpanElement[];
      const centers = spans.map(span => {
        const rect = span.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });

      let changed = false;
      spans.forEach((span, i) => {
        const center = centers[i];

        let pressure = clamp01(1 - dist(mouse, center) / maxDist);
        if (idling) {
          const position = (center.x - titleRect.left) / Math.max(titleRect.width, 1);
          const resting = getIdlePressure(idleMode, position, clock, spread);
          pressure = resting + (pressure - resting) * engage;
        }
        if (ripples.length) {
          const swell = getRipplePressure(ripples, center, now, titleRect.width);
          pressure = 1 - (1 - pressure) * (1 - swell);
        }

        const wdth = opts.width ? Math.floor(5 + 200 * pressure) : 100;
        const wght = opts.weight ? Math.floor(100 + 900 * pressure) : 400;
        const italVal = opts.italic ? pressure.toFixed(2) : '0';
        const alphaVal = opts.alpha ? pressure.toFixed(2) : '';
        const tint = Math.round((1 - (1 - pressure) * (1 - pressure)) * 100);
        const color = opts.pressureColor
          ? `color-mix(in oklab, ${opts.pressureColor} ${tint}%, ${opts.textColor})`
          : '';
        const settings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;
        const previous = applied[i];

        if (
          !previous ||
          previous.span !== span ||
          previous.settings !== settings ||
          previous.alphaVal !== alphaVal ||
          previous.color !== color
        ) {
          span.style.fontVariationSettings = settings;
          span.style.opacity = alphaVal;
          span.style.color = color;
          applied[i] = { span, settings, alphaVal, color };
          changed = true;
        }
      });

      const moving = Math.abs(cursor.x - mouse.x) > 0.1 || Math.abs(cursor.y - mouse.y) > 0.1;
      const animating = moving || idling || engage !== present || ripples.length > 0;
      idleFrames = animating ? 0 : idleFrames + 1;

      if (animating || (changed && idleFrames < 60)) rafId = requestAnimationFrame(tick);
      else last = 0;
    };

    wake = () => {
      if (!rafId && visible) rafId = requestAnimationFrame(tick);
    };
    wake();

    return () => {
      cancelAnimationFrame(rafId);
      wake = null;
      resize = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleLeave);
      window.removeEventListener('touchcancel', handleLeave);
      window.removeEventListener('scroll', nudge, { capture: true });
      document.documentElement.removeEventListener('mouseleave', handleLeave);
      document.fonts?.removeEventListener?.('loadingdone', nudge);
      container.removeEventListener('pointerdown', handlePress);
      intersection.disconnect();
      sizeObserver.disconnect();
    };
  });

  const titleStyle = createMemo<JSX.CSSProperties>(() => {
    const flex = props.flex ?? true;
    return {
      'font-family': props.fontFamily ?? 'Roboto Flex',
      'text-transform': 'uppercase',
      'line-height': 1,
      'transform-origin': 'center top',
      margin: 0,
      'text-align': 'center',
      'user-select': 'none',
      'white-space': 'nowrap',
      'font-weight': 100,
      width: '100%',
      color: props.textColor ?? 'currentColor',
      display: flex ? 'flex' : undefined,
      'justify-content': flex ? 'space-between' : undefined,
      '--text-pressure-stroke-width': `${props.strokeWidth ?? 3}px`,
      '--text-pressure-stroke-color': props.strokeColor ?? '#FF0000'
    };
  });

  return (
    <div
      ref={el => (containerEl = el)}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'transparent'
      }}
    >
      <style>{`
        @import url('${props.fontUrl ?? DEFAULT_FONT_URL}');

        .text-pressure-title.is-stroke span {
          position: relative;
        }

        .text-pressure-title.is-stroke span::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: var(--text-pressure-stroke-width);
          -webkit-text-stroke-color: var(--text-pressure-stroke-color);
        }
      `}</style>
      <h1
        ref={el => (titleEl = el)}
        aria-label={props.text ?? 'Compressa'}
        class={['text-pressure-title', { 'is-stroke': props.stroke ?? false }, props.className]}
        style={titleStyle()}
      >
        <For each={chars()} keyed={false}>
          {char => (
            <span data-char={char()} aria-hidden="true" style={{ display: 'inline-block' }}>
              {char()}
            </span>
          )}
        </For>
      </h1>
    </div>
  );
}
