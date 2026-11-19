import { For, Show, createEffect, createMemo, createUniqueId, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { gsap } from 'gsap';

import './TextLoop.css';

export type TextLoopShape = 'wave' | 'circle' | 'infinity' | 'arch' | 'line';
export type TextLoopDirection = 'forward' | 'reverse';

export interface TextLoopProps {
  text?: string;
  shape?: TextLoopShape;
  path?: string;
  speed?: number;
  direction?: TextLoopDirection;
  separator?: string;
  curviness?: number;
  tilt?: number;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  edgeFade?: number;
  pauseOnHover?: boolean;
  cross?: boolean;
  crossColor?: string;
  crossAngle?: number;
  draggable?: boolean;
  scrollBoost?: number;
  outline?: boolean;
  outlineWidth?: number;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Metrics {
  length: number;
  reps: number;
  crossLength: number;
  crossReps: number;
}

interface FadeStop {
  offset: number;
  opacity: number;
}

interface LoopSettings {
  speed: number;
  direction: TextLoopDirection;
  pauseOnHover: boolean;
  draggable: boolean;
  scrollBoost: number;
  cross: boolean;
  custom: boolean;
  shape: TextLoopShape;
  mainAngle: number;
  curviness: number;
  ribbonWidth: number;
}

interface MeasureSettings {
  d: string;
  crossD: string;
  unit: string;
  cross: boolean;
  fontSize: number;
  fontWeight: number | string;
  letterSpacing: number;
}

const VIEW_W = 1200;
const VIEW_H = 520;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;
const FADE_STEPS = 8;
const MAX_FLING = 2600;
const MAX_BOOST = 1600;
const NBSP = String.fromCharCode(160);

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrap = (v: number, length: number) => ((v % length) + length) % length;

const circleRadius = (curviness: number, ribbonWidth: number) =>
  Math.min(90 + Math.max(0, curviness) * 0.95, Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD));

const buildPath = (shape: TextLoopShape, curviness: number, ribbonWidth: number, mirrored = false): string => {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
  const flip = mirrored ? -1 : 1;

  switch (shape) {
    case 'circle': {
      const r = circleRadius(curviness, ribbonWidth);
      if (mirrored) {
        const rx = r * 1.22;
        const ry = r * 0.42;
        return `M ${CX - rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX + rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX - rx} ${CY} Z`;
      }
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case 'infinity': {
      const r = 150 + c * 1.4;
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z'
      ].join(' ');
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2) * flip;
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case 'line':
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case 'wave':
    default: {
      const a = Math.min(c * 2.2, room * 2) * flip;
      return `M -320 ${CY} Q -160 ${CY - a} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
};

const buildFade = (edgeFade: number): FadeStop[] => {
  const width = Math.min(1, Math.max(0, edgeFade)) * 0.3;
  if (width <= 0) return [];
  const stops: FadeStop[] = [];
  for (let i = 0; i <= FADE_STEPS; i++) {
    const t = i / FADE_STEPS;
    stops.push({ offset: t * width, opacity: smootherstep(t) });
  }
  for (let i = FADE_STEPS; i >= 0; i--) {
    const t = i / FADE_STEPS;
    stops.push({ offset: 1 - t * width, opacity: smootherstep(t) });
  }
  return stops;
};

const parseHex = (value?: string): number[] | null => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(String(value || '').trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].replace(/./g, ch => ch + ch) : match[1];
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
};

const tint = (color: string, amount: number): string => {
  const rgb = parseHex(color);
  if (!rgb) return color;
  return `#${rgb
    .map(v =>
      Math.round(v + (255 - v) * amount)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
};

const inkOn = (color: string): string => {
  const rgb = parseHex(color);
  if (!rgb) return '#ffffff';
  const [r, g, b] = rgb.map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.2 ? '#0c0f13' : '#ffffff';
};

export default function TextLoop(props: TextLoopProps) {
  let rootEl: HTMLDivElement | undefined;
  let svgEl: SVGSVGElement | undefined;
  let pathEl: SVGPathElement | undefined;
  let crossPathEl: SVGPathElement | undefined;
  let measureEl: SVGTextElement | undefined;
  let headEl: SVGTextPathElement | undefined;
  let tailEl: SVGTextPathElement | undefined;
  let crossHeadEl: SVGTextPathElement | undefined;
  let crossTailEl: SVGTextPathElement | undefined;
  let mainTextA: SVGTextElement | undefined;
  let mainTextB: SVGTextElement | undefined;
  let crossTextA: SVGTextElement | undefined;
  let crossTextB: SVGTextElement | undefined;

  let progress = 0;
  let metrics: Metrics = { length: 0, reps: 1, crossLength: 0, crossReps: 1 };
  let unitText = '';
  let crossOn = false;
  let loopSettings: LoopSettings | null = null;
  let stopLoop: (() => void) | null = null;
  let disposed = false;

  const rawId = createUniqueId();
  const pathId = `text-loop-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const crossId = `${pathId}-cross`;
  const fadeId = `${pathId}-fade`;
  const maskId = `${pathId}-mask`;
  const shadowId = `${pathId}-shadow`;
  const underId = `${pathId}-under`;

  const text = () => props.text ?? 'Solid ✦ Bits';
  const shape = () => props.shape ?? 'wave';
  const curviness = () => props.curviness ?? 90;
  const tilt = () => props.tilt ?? 0;
  const fontSize = () => props.fontSize ?? 46;
  const fontWeight = () => props.fontWeight ?? 500;
  const letterSpacing = () => props.letterSpacing ?? 0;
  const uppercase = () => props.uppercase ?? true;
  const ribbon = () => props.ribbon ?? true;
  const ribbonColor = () => props.ribbonColor ?? '#0aa0ef';
  const ribbonWidth = () => props.ribbonWidth ?? 86;
  const cross = () => props.cross ?? false;
  const crossAngle = () => props.crossAngle ?? 16;
  const draggable = () => props.draggable ?? false;
  const outline = () => props.outline ?? false;
  const outlineWidth = () => props.outlineWidth ?? 1.5;
  const separator = () => props.separator ?? '✦';

  const custom = createMemo(() => Boolean(props.path));
  const d = createMemo(() => props.path || buildPath(shape(), curviness(), ribbonWidth()));
  const crossD = createMemo(() => {
    if (!cross()) return '';
    if (props.path) return props.path;
    const s = shape();
    return buildPath(s, curviness(), ribbonWidth(), s === 'wave' || s === 'arch' || s === 'circle');
  });
  const fade = createMemo(() => buildFade(props.edgeFade ?? 0));
  const fill = createMemo(() => props.color || (ribbon() ? '#ffffff' : 'currentColor'));

  const half = createMemo(() => (cross() ? crossAngle() / 2 : 0));
  const mainAngle = createMemo(() => tilt() + half());
  const crossAngleDeg = createMemo(() => tilt() - half());
  const mainTransform = createMemo(() => (mainAngle() ? `rotate(${mainAngle()} ${CX} ${CY})` : undefined));
  const crossTransform = createMemo(() => (crossAngleDeg() ? `rotate(${crossAngleDeg()} ${CX} ${CY})` : undefined));
  const crossTape = createMemo(() => props.crossColor || tint(ribbonColor(), 0.62));
  const crossFill = createMemo(() => (ribbon() ? inkOn(crossTape()) : props.crossColor || 'currentColor'));
  const crossDim = createMemo(() => (!ribbon() && !props.crossColor ? 0.45 : 1));

  const unit = createMemo(() => {
    const base = uppercase() ? String(text()).toUpperCase() : String(text());
    const sep = separator();
    const gap = sep ? `${NBSP}${sep}${NBSP}` : NBSP.repeat(3);
    return `${base}${gap}`;
  });

  const textStyle = createMemo<JSX.CSSProperties>(() => ({
    'font-size': `${fontSize()}px`,
    'font-weight': fontWeight(),
    'letter-spacing': `${letterSpacing()}px`
  }));

  const paintText = (
    el: SVGTextElement | undefined,
    path: SVGTextPathElement | undefined,
    content: string,
    fit: number
  ) => {
    if (path && path.textContent !== content) path.textContent = content;
    if (!el) return;
    if (fit) el.setAttribute('textLength', String(fit));
    else el.removeAttribute('textLength');
  };

  const paintMetrics = () => {
    const loopText = unitText.repeat(metrics.reps);
    paintText(mainTextA, headEl, loopText, metrics.length);
    paintText(mainTextB, tailEl, loopText, metrics.length);
    if (crossOn) {
      const crossText = unitText.repeat(metrics.crossReps);
      paintText(crossTextA, crossHeadEl, crossText, metrics.crossLength);
      paintText(crossTextB, crossTailEl, crossText, metrics.crossLength);
    }
  };

  const startLoop = () => {
    stopLoop?.();
    stopLoop = null;
    const settings = loopSettings;
    if (!settings || disposed) return;
    stopLoop = runLoop(settings);
  };

  const runLoop = (settings: LoopSettings): (() => void) | null => {
    const { length, crossLength } = metrics;
    const head = headEl;
    const tail = tailEl;
    const root = rootEl;
    const svg = svgEl;
    if (!head || !tail || !root || !svg || !length) return null;

    const crossHead = crossHeadEl;
    const crossTail = crossTailEl;
    const crossPaths = settings.cross && crossHead && crossTail && crossLength > 0 ? [crossHead, crossTail] : null;

    let travel = progress * length;
    const apply = () => {
      const offset = wrap(travel, length);
      progress = offset / length;
      head.setAttribute('startOffset', String(offset));
      tail.setAttribute('startOffset', String(offset - length));
      if (crossPaths) {
        const crossOffset = wrap(-travel, crossLength);
        crossPaths[0].setAttribute('startOffset', String(crossOffset));
        crossPaths[1].setAttribute('startOffset', String(crossOffset - crossLength));
      }
    };
    apply();

    const reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const sign = settings.direction === 'reverse' ? -1 : 1;
    const base = reduced ? 0 : Math.max(0, settings.speed) * sign;
    const hover = { scale: 1 };
    const angle = (settings.mainAngle * Math.PI) / 180;
    const circular = !settings.custom && settings.shape === 'circle';
    const radius = circleRadius(settings.curviness, settings.ribbonWidth);
    const scrollBoost = settings.scrollBoost;
    const boosting = scrollBoost > 0 && !reduced;

    let fling = 0;
    let boost = 0;
    let scrollVelocity = 0;
    let scrollAt = 0;
    let scrollPos = 0;
    let scrollSource: EventTarget | null = null;
    let dragging = false;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let center = { x: 0, y: 0 };
    let running = false;

    const tick = (_: number, deltaMs: number) => {
      if (dragging) return;
      const dt = Math.min(0.05, deltaMs / 1000);
      fling *= Math.exp(-dt / 0.55);
      if (boosting) {
        if (performance.now() - scrollAt > 90) scrollVelocity *= Math.exp(-dt / 0.12);
        const target = clamp(scrollVelocity * scrollBoost * 0.35 * sign, -MAX_BOOST, MAX_BOOST);
        boost += (target - boost) * (1 - Math.exp(-dt / 0.18));
      }
      const v = base * hover.scale + fling + boost;
      if (Math.abs(v) < 0.01) return;
      travel += v * dt;
      apply();
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    };

    const glide = (hovered: boolean) =>
      gsap.to(hover, {
        scale: hovered ? 0 : 1,
        duration: hovered ? 0.6 : 0.9,
        ease: hovered ? 'power2.out' : 'power2.inOut',
        overwrite: true
      });
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') glide(true);
    };
    const onLeave = () => glide(false);

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      root.setPointerCapture?.(event.pointerId);
      lastX = event.clientX;
      lastY = event.clientY;
      lastT = performance.now();
      velocity = base * hover.scale + fling + boost;
      const rect = svg.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      root.style.cursor = 'grabbing';
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const now = performance.now();
      let delta: number;
      if (circular) {
        let turn =
          Math.atan2(event.clientY - center.y, event.clientX - center.x) -
          Math.atan2(lastY - center.y, lastX - center.x);
        if (turn > Math.PI) turn -= Math.PI * 2;
        if (turn < -Math.PI) turn += Math.PI * 2;
        delta = turn * radius;
      } else {
        const scale = VIEW_W / (svg.getBoundingClientRect().width || VIEW_W);
        delta = ((event.clientX - lastX) * Math.cos(angle) + (event.clientY - lastY) * Math.sin(angle)) * scale;
      }
      travel += delta;
      apply();
      const dt = Math.max(1, now - lastT) / 1000;
      velocity = velocity * 0.6 + (delta / dt) * 0.4;
      lastX = event.clientX;
      lastY = event.clientY;
      lastT = now;
    };
    const onUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      root.style.cursor = '';
      if (reduced) return;
      const release = performance.now() - lastT > 90 ? 0 : clamp(velocity, -MAX_FLING, MAX_FLING);
      fling = release - (base * hover.scale + boost);
    };

    const onScroll = (event: Event) => {
      const source = event.target;
      const isPage = source === document || source === document.documentElement || source === document.body;
      if (!isPage && !(source instanceof Node && source.contains(root))) return;
      const pos = isPage ? window.scrollY : (source as Element).scrollTop;
      const now = performance.now();
      if (source !== scrollSource || now - scrollAt > 200) {
        scrollSource = source;
        scrollPos = pos;
        scrollAt = now;
        return;
      }
      const instant = (pos - scrollPos) / (Math.max(8, now - scrollAt) / 1000);
      scrollVelocity = scrollVelocity * 0.5 + instant * 0.5;
      scrollPos = pos;
      scrollAt = now;
    };

    if (settings.pauseOnHover) {
      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointerleave', onLeave);
    }
    if (settings.draggable) {
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);
    }
    if (boosting) window.addEventListener('scroll', onScroll, { capture: true, passive: true });

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) start();
            else stop();
          })
        : null;
    if (observer) observer.observe(root);
    else start();

    return () => {
      observer?.disconnect();
      stop();
      gsap.killTweensOf(hover);
      root.style.cursor = '';
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  };

  createEffect(
    (): MeasureSettings => ({
      d: d(),
      crossD: crossD(),
      unit: unit(),
      cross: cross(),
      fontSize: fontSize(),
      fontWeight: fontWeight(),
      letterSpacing: letterSpacing()
    }),
    value => {
      const path = pathEl;
      const measureNode = measureEl;
      unitText = value.unit;
      crossOn = value.cross;
      if (!path || !measureNode) return;

      let cancelled = false;

      const measure = () => {
        if (cancelled || disposed) return;
        let length: number;
        let unitWidth: number;
        let crossLength: number;
        try {
          length = path.getTotalLength();
          unitWidth = measureNode.getComputedTextLength();
          crossLength = value.cross && crossPathEl ? crossPathEl.getTotalLength() : 0;
        } catch {
          return;
        }
        if (!length) return;

        const repsFor = (total: number) => (unitWidth > 0 ? Math.max(1, Math.round(total / unitWidth)) : 1);
        const next = { length, reps: repsFor(length), crossLength, crossReps: repsFor(crossLength) };
        const changed =
          metrics.length !== next.length ||
          metrics.reps !== next.reps ||
          metrics.crossLength !== next.crossLength ||
          metrics.crossReps !== next.crossReps;
        if (changed) metrics = next;
        paintMetrics();
        if (changed) startLoop();
      };

      measure();
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(measure).catch(() => {});
      }

      return () => {
        cancelled = true;
      };
    }
  );

  createEffect(
    (): LoopSettings => ({
      speed: props.speed ?? 90,
      direction: props.direction ?? 'forward',
      pauseOnHover: props.pauseOnHover ?? true,
      draggable: draggable(),
      scrollBoost: props.scrollBoost ?? 0,
      cross: cross(),
      custom: custom(),
      shape: shape(),
      mainAngle: mainAngle(),
      curviness: curviness(),
      ribbonWidth: ribbonWidth()
    }),
    value => {
      loopSettings = value;
      startLoop();
      return () => {
        stopLoop?.();
        stopLoop = null;
      };
    }
  );

  onSettled(() => () => {
    disposed = true;
    stopLoop?.();
    stopLoop = null;
  });

  const mainPaintFill = () => (outline() ? 'none' : fill());
  const crossPaintFill = () => (outline() ? 'none' : crossFill());

  return (
    <div
      ref={el => (rootEl = el)}
      class={['text-loop', { 'text-loop--draggable': draggable() }, props.className]}
      style={props.style}
    >
      <svg
        ref={el => (svgEl = el)}
        class="text-loop-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={text()}
      >
        <defs>
          <Show when={fade().length > 0}>
            <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
              <For each={fade()} keyed={false}>
                {stop => <stop offset={stop().offset} stop-color="#ffffff" stop-opacity={stop().opacity} />}
              </For>
            </linearGradient>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
              <rect width={VIEW_W} height={VIEW_H} fill={`url(#${fadeId})`} />
            </mask>
          </Show>
          <Show when={cross() && ribbon()}>
            <filter
              id={shadowId}
              filterUnits="userSpaceOnUse"
              x={-VIEW_W}
              y={-VIEW_H}
              width={VIEW_W * 3}
              height={VIEW_H * 3}
            >
              <feGaussianBlur stdDeviation={Math.max(4, ribbonWidth() * 0.11)} />
            </filter>
            <mask
              id={underId}
              maskUnits="userSpaceOnUse"
              x={-VIEW_W}
              y={-VIEW_H}
              width={VIEW_W * 3}
              height={VIEW_H * 3}
            >
              <g transform={crossTransform()}>
                <path
                  d={crossD()}
                  fill="none"
                  stroke="#ffffff"
                  stroke-width={ribbonWidth()}
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>
            </mask>
          </Show>
        </defs>

        <text ref={el => (measureEl = el)} class="text-loop-measure" style={textStyle()} aria-hidden="true">
          {unit()}
        </text>

        <g mask={fade().length > 0 ? `url(#${maskId})` : undefined}>
          <Show when={cross()}>
            <g transform={crossTransform()}>
              <path
                ref={el => (crossPathEl = el)}
                id={crossId}
                d={crossD()}
                fill="none"
                stroke={ribbon() ? crossTape() : 'none'}
                stroke-width={ribbon() ? ribbonWidth() : 0}
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <text
                ref={el => (crossTextA = el)}
                class="text-loop-text"
                style={textStyle()}
                fill={crossPaintFill()}
                fill-opacity={outline() ? undefined : crossDim()}
                stroke={outline() ? crossFill() : undefined}
                stroke-opacity={outline() ? crossDim() : undefined}
                stroke-width={outline() ? outlineWidth() : undefined}
                stroke-linejoin={outline() ? 'round' : undefined}
                dominant-baseline="central"
                aria-hidden="true"
                lengthAdjust="spacing"
              >
                <textPath ref={el => (crossHeadEl = el)} href={`#${crossId}`} startOffset={0} />
              </text>

              <text
                ref={el => (crossTextB = el)}
                class="text-loop-text"
                style={textStyle()}
                fill={crossPaintFill()}
                fill-opacity={outline() ? undefined : crossDim()}
                stroke={outline() ? crossFill() : undefined}
                stroke-opacity={outline() ? crossDim() : undefined}
                stroke-width={outline() ? outlineWidth() : undefined}
                stroke-linejoin={outline() ? 'round' : undefined}
                dominant-baseline="central"
                aria-hidden="true"
                lengthAdjust="spacing"
              >
                <textPath ref={el => (crossTailEl = el)} href={`#${crossId}`} startOffset={0} />
              </text>
            </g>
          </Show>

          <Show when={cross() && ribbon()}>
            <g mask={`url(#${underId})`}>
              <g filter={`url(#${shadowId})`} transform={`translate(0 ${Math.max(4, ribbonWidth() * 0.08)})`}>
                <g transform={mainTransform()}>
                  <path
                    d={d()}
                    fill="none"
                    stroke="#000000"
                    stroke-opacity={0.42}
                    stroke-width={ribbonWidth()}
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
              </g>
            </g>
          </Show>

          <g transform={mainTransform()}>
            <path
              ref={el => (pathEl = el)}
              id={pathId}
              d={d()}
              fill="none"
              stroke={ribbon() ? ribbonColor() : 'none'}
              stroke-width={ribbon() ? ribbonWidth() : 0}
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <text
              ref={el => (mainTextA = el)}
              class="text-loop-text"
              style={textStyle()}
              fill={mainPaintFill()}
              fill-opacity={outline() ? undefined : 1}
              stroke={outline() ? fill() : undefined}
              stroke-opacity={outline() ? 1 : undefined}
              stroke-width={outline() ? outlineWidth() : undefined}
              stroke-linejoin={outline() ? 'round' : undefined}
              dominant-baseline="central"
              aria-hidden="true"
              lengthAdjust="spacing"
            >
              <textPath ref={el => (headEl = el)} href={`#${pathId}`} startOffset={0} />
            </text>

            <text
              ref={el => (mainTextB = el)}
              class="text-loop-text"
              style={textStyle()}
              fill={mainPaintFill()}
              fill-opacity={outline() ? undefined : 1}
              stroke={outline() ? fill() : undefined}
              stroke-opacity={outline() ? 1 : undefined}
              stroke-width={outline() ? outlineWidth() : undefined}
              stroke-linejoin={outline() ? 'round' : undefined}
              dominant-baseline="central"
              aria-hidden="true"
              lengthAdjust="spacing"
            >
              <textPath ref={el => (tailEl = el)} href={`#${pathId}`} startOffset={0} />
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
