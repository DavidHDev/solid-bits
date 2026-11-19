import { For, Show, children, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { cancelFrame, frame, motionValue, springValue, type FrameData } from 'motion';

import './CircularText.css';

type HoverMode = 'slowDown' | 'speedUp' | 'pause' | 'goBonkers';

export interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: HoverMode;
  direction?: 'clockwise' | 'counterclockwise';
  size?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  color?: string;
  startAngle?: number;
  fill?: boolean;
  repeat?: number;
  ring?: boolean;
  ringColor?: string;
  tilt?: number;
  hoverTilt?: number;
  draggable?: boolean;
  children?: JSX.Element;
  className?: string;
}

interface SpinState {
  dragging: boolean;
  hovering: boolean;
  fling: number;
  cruise: number;
  angle: number | null;
  travel: number;
  samples: [number, number][];
}

const HOVER_SPEED: Record<HoverMode, number> = { slowDown: 0.5, speedUp: 4, pause: 0, goBonkers: 20 };
const MAX_FLING = 1440;

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const reducedMotionQuery = () =>
  typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

export default function CircularText(props: CircularTextProps) {
  let rootEl: HTMLDivElement | undefined;
  let tiltEl: HTMLDivElement | undefined;
  let ringEl: HTMLDivElement | undefined;
  const glyphEls: (HTMLSpanElement | undefined)[] = [];
  const state: SpinState = {
    dragging: false,
    hovering: false,
    fling: 0,
    cruise: 0,
    angle: null,
    travel: 0,
    samples: []
  };
  const [advances, setAdvances] = createSignal<number[] | null>(null);
  const [settled, setSettled] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);
  const [reduceMotion, setReduceMotion] = createSignal(Boolean(reducedMotionQuery()?.matches));
  const rotation = motionValue<number>(0);
  const speed = springValue<number>(1, { stiffness: 60, damping: 18 });
  const scale = springValue<number>(1, { stiffness: 300, damping: 20 });
  const tiltX = springValue<number>(0, { stiffness: 150, damping: 18 });
  const tiltY = springValue<number>(0, { stiffness: 150, damping: 18 });

  const center = children(() => props.children);
  const hasCenter = createMemo(() => {
    const value = center();
    return value != null && (value as unknown) !== false && !(Array.isArray(value) && value.length === 0);
  });

  const size = () => props.size ?? 200;
  const fontSize = () => props.fontSize ?? 24;
  const fontWeight = () => props.fontWeight ?? 500;
  const glyphs = createMemo(() => Array.from(props.text ?? ''));
  const copies = createMemo(() => Math.max(1, Math.round(props.repeat ?? 1) || 1));
  const letters = createMemo(() => {
    const list = glyphs();
    return Array.from({ length: copies() }, () => list).flat();
  });

  const angles = createMemo(() => {
    const glyphList = glyphs();
    const letterList = letters();
    const count = glyphList.length;
    const startAngle = props.startAngle ?? 0;
    const fill = props.fill ?? true;
    const ringSize = size();
    const fs = fontSize();
    const letterSpacing = props.letterSpacing ?? 0;
    const copyCount = copies();
    const measured = advances();
    if (!count) return [] as number[];
    if (fill) return letterList.map((_, i) => startAngle + (360 / letterList.length) * i);
    const known = measured && measured.length === count ? measured : null;
    const toDegrees = 180 / (Math.PI * Math.max(ringSize / 2 - fs * 0.6, 1));
    const arcs = glyphList.map((glyph, i) => {
      const width = known ? known[i] : fs * (glyph === ' ' ? 0.3 : 0.6);
      return Math.max(0, width + letterSpacing * fs) * toDegrees;
    });
    const span = arcs.reduce((sum, arc) => sum + arc, 0);
    const fit = span > 0 ? Math.min(1, 360 / (span * copyCount)) : 1;
    const result: number[] = [];
    for (let copy = 0; copy < copyCount; copy += 1) {
      let cursor = startAngle + (360 / copyCount) * copy - (arcs[0] * fit) / 2;
      for (let i = 0; i < count; i += 1) {
        const arc = arcs[i] * fit;
        result.push(cursor + arc / 2);
        cursor += arc;
      }
    }
    return result;
  });

  let measureConfig = { fill: true, count: 0 };

  const measure = () => {
    if (measureConfig.fill || !rootEl?.isConnected) return;
    const widths = Array.from({ length: measureConfig.count }, (_, i) => glyphEls[i]?.offsetWidth ?? 0);
    setAdvances(prev =>
      prev && prev.length === widths.length && prev.every((width, i) => width === widths[i]) ? prev : widths
    );
  };

  createEffect(
    () => {
      measureConfig = {
        fill: props.fill ?? true,
        count: glyphs().length
      };
      fontSize();
      fontWeight();
      void props.className;
      return measureConfig;
    },
    () => {
      if (measureConfig.fill) return undefined;
      let alive = true;
      const run = () => {
        if (alive) measure();
      };
      run();
      document.fonts?.ready.then(run).catch(() => {});
      return () => {
        alive = false;
      };
    }
  );

  createEffect(
    () => ({
      spinDuration: props.spinDuration ?? 20,
      direction: props.direction ?? 'clockwise',
      reduce: reduceMotion()
    }),
    value => {
      const root = rootEl;
      const turn = value.direction === 'counterclockwise' ? -1 : 1;
      state.cruise = value.spinDuration > 0 && !value.reduce ? (360 / value.spinDuration) * turn : 0;
      if (!root || value.reduce) return undefined;

      const spin = ({ delta }: FrameData) => {
        if (state.dragging) return;
        const dt = Math.min(delta, 100) / 1000;
        state.fling *= Math.exp(-dt / 0.7);
        if (Math.abs(state.fling) < 1) state.fling = 0;
        const velocity = state.cruise * speed.get() + state.fling;
        if (velocity) rotation.set((rotation.get() + velocity * dt) % 360);
      };

      let running = false;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting === running) return;
        running = entry.isIntersecting;
        if (running) frame.update(spin, true);
        else cancelFrame(spin);
      });
      observer.observe(root);

      return () => {
        observer.disconnect();
        cancelFrame(spin);
      };
    }
  );

  createEffect(
    () => ({ hoverTilt: props.hoverTilt ?? 0, reduce: reduceMotion() }),
    value => {
      if (value.hoverTilt && !value.reduce) return undefined;
      tiltX.set(0);
      tiltY.set(0);
      return undefined;
    }
  );

  onSettled(() => {
    const paintRing = () => {
      if (ringEl) ringEl.style.transform = `rotate(${rotation.get()}deg)`;
    };
    const paintTilt = () => {
      if (!tiltEl) return;
      const parts: string[] = [];
      const s = scale.get();
      const x = tiltX.get();
      const y = tiltY.get();
      if (s !== 1) parts.push(`scale(${s})`);
      if (x !== 0) parts.push(`rotateX(${x}deg)`);
      if (y !== 0) parts.push(`rotateY(${y}deg)`);
      tiltEl.style.transform = parts.length ? parts.join(' ') : 'none';
    };
    const scheduleRing = () => {
      frame.render(paintRing);
    };
    const scheduleTilt = () => {
      frame.render(paintTilt);
    };
    const unsubscribers = [
      rotation.on('change', scheduleRing),
      scale.on('change', scheduleTilt),
      tiltX.on('change', scheduleTilt),
      tiltY.on('change', scheduleTilt)
    ];

    const media = reducedMotionQuery();
    const updateReduce = () => {
      setReduceMotion(Boolean(media?.matches));
    };
    media?.addEventListener?.('change', updateReduce);

    measure();
    const settleId = requestAnimationFrame(() => {
      setSettled(true);
    });

    return () => {
      cancelAnimationFrame(settleId);
      media?.removeEventListener?.('change', updateReduce);
      unsubscribers.forEach(unsubscribe => unsubscribe());
      cancelFrame(paintRing);
      cancelFrame(paintTilt);
      rotation.destroy();
      speed.destroy();
      scale.destroy();
      tiltX.destroy();
      tiltY.destroy();
    };
  });

  const applyScale = () => {
    const bonkers = state.hovering && props.onHover === 'goBonkers' && !reduceMotion();
    scale.set((bonkers ? 0.8 : 1) * (state.dragging ? 0.96 : 1));
  };

  const pointerAngle = (e: PointerEvent): number | null => {
    const root = rootEl;
    if (!root) return null;
    const rect = root.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < rect.width * 0.06) return null;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const handleEnter = () => {
    state.hovering = true;
    const onHover = props.onHover ?? 'speedUp';
    if (onHover && !reduceMotion()) speed.set(HOVER_SPEED[onHover] ?? 1);
    applyScale();
  };

  const handleLeave = () => {
    state.hovering = false;
    speed.set(1);
    tiltX.set(0);
    tiltY.set(0);
    applyScale();
  };

  const handleMove = (e: PointerEvent) => {
    const root = rootEl;
    if (!root) return;

    if (state.dragging) {
      const angle = pointerAngle(e);
      if (angle !== null) {
        if (state.angle !== null) {
          let delta = angle - state.angle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          state.travel += delta;
          rotation.set((rotation.get() + delta) % 360);
          state.samples.push([e.timeStamp, state.travel]);
          while (state.samples.length > 2 && e.timeStamp - state.samples[0][0] > 100) state.samples.shift();
        }
        state.angle = angle;
      }
    }

    const hoverTilt = props.hoverTilt ?? 0;
    if (!hoverTilt || reduceMotion() || e.pointerType === 'touch') return;
    const rect = root.getBoundingClientRect();
    const nx = clamp(((e.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const ny = clamp(((e.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    tiltX.set(-ny * hoverTilt);
    tiltY.set(nx * hoverTilt);
  };

  const handleDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    if (!props.draggable || (e.pointerType === 'mouse' && e.button !== 0)) return;
    state.dragging = true;
    state.fling = 0;
    state.angle = pointerAngle(e);
    state.travel = 0;
    state.samples = [[e.timeStamp, 0]];
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragging(true);
    applyScale();
  };

  const handleUp = (e: PointerEvent) => {
    if (!state.dragging) return;
    state.dragging = false;
    setDragging(false);
    applyScale();
    const [startTime, startTravel] = state.samples[0];
    const lastTime = state.samples[state.samples.length - 1][0];
    const elapsed = e.timeStamp - startTime;
    const velocity = elapsed > 0 && e.timeStamp - lastTime < 80 ? ((state.travel - startTravel) / elapsed) * 1000 : 0;
    state.fling = reduceMotion() ? 0 : clamp(velocity, -MAX_FLING, MAX_FLING) - state.cruise * speed.get();
  };

  return (
    <div
      ref={el => (rootEl = el)}
      class={['circular-text', props.className]}
      data-settled={settled() ? '' : undefined}
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        'font-size': `${fontSize()}px`,
        'font-weight': String(fontWeight()),
        color: props.color || undefined,
        perspective: `${size() * 2.5}px`,
        cursor: props.draggable ? (dragging() ? 'grabbing' : 'grab') : undefined,
        'touch-action': props.draggable ? 'none' : undefined,
        'user-select': props.draggable ? 'none' : undefined,
        '-webkit-user-select': props.draggable ? 'none' : undefined
      }}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onPointerMove={handleMove}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      <div ref={el => (tiltEl = el)} class="circular-text__tilt">
        <div class="circular-text__plane" style={{ transform: props.tilt ? `rotateX(${props.tilt}deg)` : undefined }}>
          <span
            class="circular-text__line"
            style={{
              'border-width': `${Math.max(1, fontSize() / 16)}px`,
              'border-color': props.ringColor || undefined,
              opacity: props.ring ? 1 : 0
            }}
          />
          <div ref={el => (ringEl = el)} class="circular-text__ring" role="img" aria-label={props.text}>
            <For each={letters()} keyed={false}>
              {(letter, i) => (
                <span class="circular-text__letter" style={{ transform: `rotate(${angles()[i] ?? 0}deg)` }}>
                  <span ref={el => (glyphEls[i] = el)}>{letter()}</span>
                </span>
              )}
            </For>
          </div>
        </div>
        <Show when={hasCenter()}>
          <div class="circular-text__center">{center()}</div>
        </Show>
      </div>
    </div>
  );
}
