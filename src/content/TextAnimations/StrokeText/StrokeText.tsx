import { For, Show, createEffect, createMemo, createSignal, createUniqueId, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './StrokeText.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export type StrokeTextTrigger = 'mount' | 'hover' | 'scroll' | 'loop';
export type StrokeTextFillMode = 'wipe' | 'fade' | 'none';
export type StrokeTextWipeFrom = 'left' | 'right' | 'top' | 'bottom';
export type StrokeTextStyle = 'solid' | 'dashed' | 'dotted';

export interface StrokeTextProps {
  text?: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  ease?: string;
  trigger?: StrokeTextTrigger;
  fillMode?: StrokeTextFillMode;
  wipeFrom?: StrokeTextWipeFrom;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: number;
  reverse?: boolean;
  strokeStyle?: StrokeTextStyle;
  dashLength?: number;
  marching?: boolean;
  hoverRedraw?: boolean;
  shadow?: boolean;
  shadowColor?: string;
  className?: string;
  style?: JSX.CSSProperties;
}

interface StrokeTextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DashPattern {
  array: string;
  period: number;
}

interface MeasureSettings {
  fontSize: number;
  strokeWidth: number;
}

const DEFAULT_TEXT = 'Draw Attention';
const SHADOW_OPACITY = 0.5;

const getWipeFrames = (box: StrokeTextBox, wipeFrom: StrokeTextWipeFrom) => {
  const end = { x: box.x, y: box.y, width: box.width, height: box.height };
  if (wipeFrom === 'right') return { start: { ...end, x: box.x + box.width, width: 0 }, end };
  if (wipeFrom === 'top') return { start: { ...end, height: 0 }, end };
  if (wipeFrom === 'bottom') return { start: { ...end, y: box.y + box.height, height: 0 }, end };
  return { start: { ...end, width: 0 }, end };
};

const getDashPattern = (strokeStyle: StrokeTextStyle, dashLength: number, strokeWidth: number): DashPattern | null => {
  const width = Math.max(Number(strokeWidth) || 0, 0.1);
  const length = Math.max(Number(dashLength) || 0, 1);
  if (strokeStyle === 'dotted') {
    const gap = Math.max(length, width * 1.8);
    return { array: `0 ${gap}`, period: gap };
  }
  if (strokeStyle === 'dashed') {
    const on = Math.max(length - width, 0.5);
    const off = length * 0.6 + width;
    return { array: `${on} ${off}`, period: on + off };
  }
  return null;
};

export default function StrokeText(props: StrokeTextProps) {
  let rootEl: HTMLSpanElement | undefined;
  let strokeTextEl: SVGTextElement | undefined;
  let wipeRectEl: SVGRectElement | undefined;
  let shadowEl: SVGFEDropShadowElement | undefined;
  let measureSettings!: MeasureSettings;
  let remeasure: (() => void) | null = null;

  const [box, setBox] = createSignal<StrokeTextBox | null>(null);

  const baseId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '');
  const wipeId = `stroke-text-wipe-${baseId}`;
  const revealId = `stroke-text-reveal-${baseId}`;
  const erodeId = `stroke-text-erode-${baseId}`;
  const shadowId = `stroke-text-shadow-${baseId}`;

  const label = createMemo(() => String(props.text ?? DEFAULT_TEXT));
  const characters = createMemo(() => Array.from(label()));
  const fontSize = createMemo(() => props.fontSize ?? 128);
  const strokeWidth = createMemo(() => props.strokeWidth ?? 1.4);
  const fillMode = createMemo(() => props.fillMode ?? 'wipe');
  const wipeFrom = createMemo(() => props.wipeFrom ?? 'left');
  const strokeColor = createMemo(() => props.strokeColor ?? '#6ec9f7');

  const dash = createMemo(() => Math.max(fontSize() * 7, 200));
  const pattern = createMemo(() => getDashPattern(props.strokeStyle ?? 'solid', props.dashLength ?? 10, strokeWidth()));
  const dashArray = createMemo(() => pattern()?.array ?? null);
  const lift = createMemo(() => fontSize() * 0.06);
  const softness = createMemo(() => fontSize() * 0.016);
  const castShadow = createMemo(() => (props.shadow ?? false) && fillMode() !== 'none');

  const fontStyle = createMemo<JSX.CSSProperties>(() => ({
    'font-family': props.fontFamily ?? 'inherit',
    'font-size': `${fontSize()}px`,
    'font-weight': String(props.fontWeight ?? 500),
    'letter-spacing': `${props.letterSpacing ?? -4}px`
  }));

  const measureKey = createMemo(() => ({
    characters: characters(),
    font: fontStyle(),
    fontSize: fontSize(),
    strokeWidth: strokeWidth()
  }));

  createEffect(measureKey, value => {
    measureSettings = value;
    const run = remeasure;
    if (run) queueMicrotask(run);
  });

  onSettled(() => {
    measureSettings = measureKey();
    const root = rootEl;
    if (!root || !strokeTextEl) return;

    let cancelled = false;

    const measure = () => {
      const outline = strokeTextEl;
      if (cancelled || !outline || !outline.isConnected) return;
      let bbox: DOMRect | undefined;
      try {
        bbox = outline.getBBox();
      } catch {
        return;
      }
      if (!bbox || !bbox.width) return;

      const { fontSize: size, strokeWidth: width } = measureSettings;
      const pad = Math.max(Number(width) || 1, size * 0.1);
      const next = {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };

      setBox(prev =>
        prev &&
        Math.abs(prev.x - next.x) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5 &&
        Math.abs(prev.y - next.y) < 0.5 &&
        Math.abs(prev.height - next.height) < 0.5
          ? prev
          : next
      );
    };

    remeasure = () => {
      measure();
      document.fonts?.ready?.then(measure).catch(() => {});
    };

    measure();
    document.fonts?.ready?.then(measure).catch(() => {});

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(root);

    return () => {
      cancelled = true;
      remeasure = null;
      observer?.disconnect();
    };
  });

  const timeline = createMemo(() => ({
    box: box(),
    dash: dash(),
    drawDuration: props.drawDuration ?? 1.6,
    fillDelay: props.fillDelay ?? 0.2,
    stagger: props.stagger ?? 0.05,
    ease: props.ease ?? 'power2.out',
    trigger: props.trigger ?? 'mount',
    fillMode: fillMode(),
    wipeFrom: wipeFrom(),
    reverse: props.reverse ?? false,
    dashArray: dashArray(),
    dashPeriod: pattern()?.period ?? 0,
    marching: props.marching ?? false,
    hoverRedraw: props.hoverRedraw ?? false,
    castShadow: castShadow(),
    lift: lift(),
    fontSize: fontSize()
  }));

  createEffect(timeline, settings => {
    const root = rootEl;
    const box = settings.box;
    if (typeof window === 'undefined' || !root || !box) return undefined;

    const {
      dash,
      drawDuration,
      fillDelay,
      stagger,
      ease,
      trigger,
      fillMode,
      wipeFrom,
      reverse,
      dashArray,
      dashPeriod,
      marching,
      hoverRedraw,
      lift,
      fontSize
    } = settings;

    const strokes = gsap.utils.toArray<SVGTSpanElement>(root.querySelectorAll('[data-stroke-char]'));
    const fills = gsap.utils.toArray<SVGTSpanElement>(root.querySelectorAll('[data-fill-char]'));
    const wipe = wipeRectEl?.isConnected ? wipeRectEl : null;
    const outline = strokeTextEl?.isConnected ? strokeTextEl : null;
    const drop = shadowEl?.isConnected ? shadowEl : null;
    if (!strokes.length) return undefined;

    const fillEnabled = fillMode !== 'none';
    const useWipe = fillEnabled && fillMode === 'wipe';
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig: number | gsap.StaggerVars = reverse ? { each: stagger, from: 'end' as const } : stagger;
    const frames = getWipeFrames(box, wipeFrom);
    const lifted = { dx: lift, dy: lift, 'flood-opacity': SHADOW_OPACITY };
    const grounded = { dx: 0, dy: 0, 'flood-opacity': 0 };
    const targets = [...strokes, ...fills, wipe, drop].filter(Boolean) as Element[];

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash, strokeOpacity: 1 });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: frames.start });
      if (drop) gsap.set(drop, { attr: grounded });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0, strokeOpacity: 1 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: fillEnabled ? frames.end : frames.start });
      if (drop) gsap.set(drop, { attr: fillEnabled ? lifted : grounded });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setEnd();
      return () => {
        gsap.killTweensOf(targets);
      };
    }

    const build = () => {
      setStart();
      const looping = trigger === 'loop';
      const tl = gsap.timeline({
        paused: true,
        repeat: looping ? -1 : 0,
        repeatDelay: looping ? 0.9 : 0,
        yoyo: looping,
        defaults: { overwrite: 'auto' }
      });

      tl.to(strokes, { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig }, 0);

      if (useWipe && wipe) {
        tl.to(wipe, { attr: frames.end, duration: fillDuration, ease: 'power2.inOut' }, drawDuration + fillDelay);
      } else if (fillEnabled) {
        tl.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: 'power2.out', stagger: staggerConfig },
          drawDuration + fillDelay
        );
      }

      if (drop && fillEnabled) {
        tl.to(
          drop,
          { attr: lifted, duration: fillDuration * 1.4, ease: 'power3.out' },
          drawDuration + fillDelay + fillDuration * 0.3
        );
      }

      return tl;
    };

    let tl: gsap.core.Timeline | null = null;
    let scrollTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
    let redraw: gsap.core.Timeline | null = null;
    const listeners: (() => void)[] = [];

    const listen = (handler: () => void) => {
      root.addEventListener('pointerenter', handler);
      listeners.push(handler);
    };

    if (trigger === 'hover') {
      setEnd();
      listen(() => {
        tl?.kill();
        tl = build();
        tl.play(0);
      });
    } else {
      tl = build();
      if (trigger === 'scroll') {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            tl?.play(0);
          }
        });
      } else {
        tl.play(0);
      }

      if (hoverRedraw && trigger !== 'loop') {
        listen(() => {
          if (!tl || tl.progress() < 1 || redraw?.isActive()) return;
          redraw?.kill();
          redraw = gsap
            .timeline()
            .to(strokes, { strokeOpacity: 0, duration: 0.2, ease: 'power1.out' })
            .set(strokes, { strokeDashoffset: dash, strokeOpacity: 1 })
            .to(strokes, { strokeDashoffset: 0, duration: drawDuration * 0.8, ease, stagger: staggerConfig });
        });
      }
    }

    const march =
      dashArray && marching && outline
        ? gsap.fromTo(
            outline,
            { strokeDashoffset: 0 },
            { strokeDashoffset: -dashPeriod, duration: dashPeriod / (fontSize * 0.22), ease: 'none', repeat: -1 }
          )
        : null;

    return () => {
      listeners.forEach(handler => root.removeEventListener('pointerenter', handler));
      scrollTrigger?.kill();
      tl?.kill();
      redraw?.kill();
      march?.kill();
      gsap.killTweensOf(targets);
    };
  });

  const viewBox = createMemo(() => {
    const current = box();
    return current
      ? `${current.x} ${current.y} ${current.width} ${current.height}`
      : `0 ${-fontSize()} 600 ${fontSize() * 1.3}`;
  });
  const wipeStart = createMemo(() => {
    const current = box();
    return current ? getWipeFrames(current, wipeFrom()).start : null;
  });
  const region = createMemo<Partial<StrokeTextBox>>(() => {
    const current = box();
    const size = fontSize();
    return current
      ? { x: current.x - size, y: current.y - size, width: current.width + size * 2, height: current.height + size * 2 }
      : {};
  });
  const maskStroke = createMemo(() => (Number(strokeWidth()) || 1) + 2);
  const erodeRadius = createMemo(() => (Number(strokeWidth()) || 1) / 2 + 0.75);

  const outlineLayer = () => (
    <text
      ref={el => (strokeTextEl = el)}
      class="stroke-text__stroke"
      x="0"
      y="0"
      fill="none"
      stroke={strokeColor()}
      stroke-width={strokeWidth()}
      stroke-linejoin="round"
      stroke-linecap="round"
      stroke-dasharray={dashArray() || undefined}
      mask={dashArray() ? `url(#${revealId})` : undefined}
      style={fontStyle()}
    >
      <For each={characters()} keyed={false}>
        {char => <tspan data-stroke-char={dashArray() ? undefined : ''}>{char()}</tspan>}
      </For>
    </text>
  );

  return (
    <span
      ref={el => (rootEl = el)}
      class={['stroke-text', { 'stroke-text--hover': (props.trigger ?? 'mount') === 'hover' }, props.className]}
      style={{ ...props.style, '--stroke-text-width': `${box()?.width ?? 600}px` }}
      role="img"
      aria-label={label()}
    >
      <svg
        class="stroke-text__svg"
        viewBox={viewBox()}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        style={box() ? undefined : { visibility: 'hidden' }}
      >
        <defs>
          <Show when={fillMode() === 'wipe' && wipeStart()}>
            {start => (
              <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
                <rect
                  ref={el => (wipeRectEl = el)}
                  x={start().x}
                  y={start().y}
                  width={start().width}
                  height={start().height}
                />
              </clipPath>
            )}
          </Show>

          <Show when={dashArray()}>
            <filter id={erodeId} filterUnits="userSpaceOnUse" {...region()}>
              <feMorphology operator="erode" radius={erodeRadius()} />
            </filter>
          </Show>

          <Show when={dashArray()}>
            <mask id={revealId} maskUnits="userSpaceOnUse" {...region()}>
              <text
                x="0"
                y="0"
                fill="none"
                stroke="#fff"
                stroke-width={maskStroke()}
                stroke-linejoin="round"
                stroke-linecap="round"
                style={fontStyle()}
              >
                <For each={characters()} keyed={false}>
                  {char => <tspan data-stroke-char="">{char()}</tspan>}
                </For>
              </text>
              <text x="0" y="0" fill="#000" stroke="none" filter={`url(#${erodeId})`} style={fontStyle()}>
                <For each={characters()} keyed={false}>
                  {char => <tspan>{char()}</tspan>}
                </For>
              </text>
            </mask>
          </Show>

          <Show when={castShadow()}>
            <filter id={shadowId} filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB" {...region()}>
              <feDropShadow
                ref={el => (shadowEl = el)}
                dx={lift()}
                dy={lift()}
                stdDeviation={softness()}
                flood-color={props.shadowColor || strokeColor()}
                flood-opacity={SHADOW_OPACITY}
              />
            </filter>
          </Show>
        </defs>

        <Show when={!dashArray()}>{outlineLayer()}</Show>

        <g filter={castShadow() ? `url(#${shadowId})` : undefined}>
          <text
            class="stroke-text__fill"
            x="0"
            y="0"
            fill={props.fillColor ?? 'currentColor'}
            stroke="none"
            style={fontStyle()}
            clip-path={fillMode() === 'wipe' && wipeStart() ? `url(#${wipeId})` : undefined}
          >
            <For each={characters()} keyed={false}>
              {char => <tspan data-fill-char="">{char()}</tspan>}
            </For>
          </text>
        </g>

        <Show when={dashArray()}>{outlineLayer()}</Show>
      </svg>
    </span>
  );
}
