import { For, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './DepthText.css';

export interface DepthTextProps {
  text?: string;
  layers?: number;
  depth?: number;
  faceColor?: string;
  depthColor?: string;
  gradientDepth?: boolean;
  tilt?: number;
  pointerTracking?: boolean;
  smoothing?: number;
  perspective?: number;
  autoOrbit?: boolean;
  orbitSpeed?: number;
  hoverPush?: number;
  float?: boolean;
  fontSize?: string;
  fontWeight?: number | string;
  shadow?: boolean;
  outline?: boolean;
  intro?: boolean;
  className?: string;
  style?: JSX.CSSProperties;
}

interface DepthLayer {
  index: number;
  color: string;
  transform: string;
}

interface Rotation {
  x: number;
  y: number;
}

interface Motion {
  push: number;
  velocity: number;
  float: number;
}

interface MotionConfig {
  autoOrbit: boolean;
  baseRotation: Rotation;
  pointerTracking: boolean;
  safeOrbitSpeed: number;
  safeSmoothing: number;
  safeTilt: number;
  safePush: number;
  float: boolean;
  extent: number;
}

const MAX_LAYERS = 64;
const INTRO_MS = 1200;
const PUSH_STIFFNESS = 260;
const PUSH_DAMPING = 17;
const PRESS_EXTRA = 0.25;
const FLOAT_EASE = 0.7;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const getLayerColor = (faceColor: string, depthColor: string, index: number, total: number): string => {
  const progress = total <= 1 ? 1 : index / total;
  const eased = progress * progress;
  const faceMix = Math.round((1 - eased) * 72 + 4);
  return `color-mix(in srgb, color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor}) 92%, black)`;
};

const getFadeColor = (depthColor: string, index: number, total: number, outline: boolean): string => {
  const reach = (layer: number) => Math.pow(clamp(1 - (layer - 0.5) / total, 0, 1), 1.6);
  const here = reach(index);
  const behind = index >= total ? 0 : reach(index + 1);
  const alpha = outline ? here : behind >= 1 ? 1 : 1 - (1 - here) / (1 - behind);
  return `color-mix(in srgb, ${depthColor} ${(clamp(alpha, 0, 1) * 100).toFixed(2)}%, transparent)`;
};

const getTransform = (rotateX: number, rotateY: number, lift = 0, roll = 0, sink = 0): string =>
  [
    lift ? `translateY(${lift.toFixed(2)}px)` : '',
    roll ? `rotateZ(${roll.toFixed(3)}deg)` : '',
    `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`,
    sink ? `translateZ(${(-sink).toFixed(2)}px)` : ''
  ]
    .filter(Boolean)
    .join(' ');

export default function DepthText(props: DepthTextProps) {
  let rootEl: HTMLSpanElement | undefined;
  let stageEl: HTMLSpanElement | undefined;
  let rotation: Rotation | null = null;
  const motion: Motion = { push: 0, velocity: 0, float: 0 };
  let introProgress = untrack(() => ((props.intro ?? true) ? 0 : 1));
  const [introDone, setIntroDone] = createSignal(introProgress >= 1);

  const text = () => props.text ?? 'Elevate';
  const faceColor = () => props.faceColor ?? 'currentColor';
  const depthColor = () => props.depthColor ?? '#0aa0ef';
  const gradientDepth = () => props.gradientDepth ?? false;
  const outline = () => props.outline ?? false;
  const shadow = () => props.shadow ?? true;

  const safeLayers = createMemo(() => clamp(Math.round(Number(props.layers ?? 34) || 1), 2, MAX_LAYERS));
  const safeDepth = createMemo(() => clamp(Number(props.depth ?? 2.4) || 0, 0, 12));
  const safeTilt = createMemo(() => clamp(Number(props.tilt ?? 7.5) || 0, 0, 12));
  const safePerspective = createMemo(() => clamp(Number(props.perspective ?? 900) || 900, 300, 2000));
  const baseRotation = createMemo<Rotation>(() => ({ x: -safeTilt() * 0.32, y: safeTilt() * 0.42 }));

  const initialTransform = untrack(() => getTransform(baseRotation().x, baseRotation().y));

  const motionConfig = createMemo<MotionConfig>(() => ({
    autoOrbit: props.autoOrbit ?? true,
    baseRotation: baseRotation(),
    pointerTracking: props.pointerTracking ?? true,
    safeOrbitSpeed: clamp(Number(props.orbitSpeed ?? 0.35) || 0, 0, 2),
    safeSmoothing: clamp(Number(props.smoothing ?? 0.14) || 0.14, 0.02, 0.35),
    safeTilt: safeTilt(),
    safePush: clamp(Number(props.hoverPush ?? 0) || 0, 0, 1),
    float: props.float ?? false,
    extent: safeLayers() * safeDepth()
  }));

  const depthLayers = createMemo<DepthLayer[]>(() => {
    const total = safeLayers();
    const spacing = safeDepth();
    const face = faceColor();
    const tint = depthColor();
    const fade = gradientDepth();
    const lines = outline();
    return Array.from({ length: total }, (_, layerIndex) => {
      const index = total - layerIndex;
      return {
        index,
        color: fade ? getFadeColor(tint, index, total, lines) : getLayerColor(face, tint, index, total),
        transform: `translateZ(calc(var(--depth-text-grow, 1) * ${(-index * spacing).toFixed(2)}px))`
      };
    });
  });

  let config!: MotionConfig;
  let restart: (() => void) | null = null;

  const setup = (cfg: MotionConfig): (() => void) | undefined => {
    const root = rootEl;
    const stage = stageEl;
    if (!root || !stage) return undefined;

    const { autoOrbit, baseRotation: base, pointerTracking, safeOrbitSpeed, safeSmoothing, safeTilt: tilt } = cfg;
    const { safePush, float, extent } = cfg;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const canTrackPointer = pointerTracking && finePointer && !reducedMotion;
    const listensToHover = (safePush > 0 || float) && !reducedMotion;

    let frameId = 0;
    let visible = true;
    let activePointer = false;
    let hovered = false;
    let pressed = false;
    let lastTime = 0;
    let size = root.offsetHeight;
    const startTime = performance.now();
    const current = rotation || { ...base };
    const target = { ...base };
    rotation = current;

    const sinkAmount = () => clamp(motion.push, -0.25, 1);

    const applyTransform = (now = performance.now()) => {
      const time = (now - startTime) / 1000;
      const drift = motion.float;
      stage.style.transform = getTransform(
        current.x + (drift ? Math.cos(time * 1.19) * 2 * drift : 0),
        current.y + (drift ? Math.sin(time * 0.86 + 2.1) * 4 * drift : 0),
        drift ? Math.sin(time * 1.43) * size * 0.045 * drift : 0,
        drift ? Math.sin(time * 1.03 + 0.8) * 1.6 * drift : 0,
        sinkAmount() * extent
      );
    };

    const applyGrow = () => {
      const progress = introProgress;
      const grow = progress >= 1 ? 1 : 1 - Math.pow(1 - progress, 3);
      const value = grow * (1 - sinkAmount());
      stage.style.setProperty('--depth-text-grow', value === 1 ? '1' : value.toFixed(4));
    };

    if (reducedMotion) {
      introProgress = 1;
      motion.push = 0;
      motion.velocity = 0;
      motion.float = 0;
      applyGrow();
      setIntroDone(true);
      current.x = base.x;
      current.y = base.y;
      applyTransform();
      return undefined;
    }

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const tick = (now: number) => {
      const delta = lastTime ? Math.min(now - lastTime, 50) : 16;
      lastTime = now;

      if (introProgress < 1) {
        introProgress = Math.min(1, introProgress + delta / INTRO_MS);
        if (introProgress >= 1) setIntroDone(true);
      }

      if ((!canTrackPointer || !activePointer) && autoOrbit) {
        const elapsed = (now - startTime) / 1000;
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2;
        const fallbackAmount = canTrackPointer ? 0.18 : 0.55;
        target.x = base.x + Math.sin(orbit) * tilt * fallbackAmount;
        target.y = base.y + Math.cos(orbit * 0.85) * tilt * fallbackAmount;
      }

      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;

      const pushGoal = safePush > 0 && (hovered || pressed) ? Math.min(1, safePush + (pressed ? PRESS_EXTRA : 0)) : 0;
      let remaining = delta / 1000;
      while (remaining > 0) {
        const step = Math.min(remaining, 1 / 120);
        motion.velocity += (PUSH_STIFFNESS * (pushGoal - motion.push) - PUSH_DAMPING * motion.velocity) * step;
        motion.push += motion.velocity * step;
        remaining -= step;
      }
      const springIdle = Math.abs(pushGoal - motion.push) < 0.0005 && Math.abs(motion.velocity) < 0.002;
      if (springIdle) {
        motion.push = pushGoal;
        motion.velocity = 0;
      }

      const floatGoal = float && !hovered && !pressed ? 1 : 0;
      motion.float += (floatGoal - motion.float) * (1 - Math.exp(-delta / 1000 / FLOAT_EASE));
      if (Math.abs(floatGoal - motion.float) < 0.001) motion.float = floatGoal;

      applyGrow();
      applyTransform(now);

      const settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;
      if (!autoOrbit && !motion.float && settled && springIdle && introProgress >= 1) {
        frameId = 0;
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frameId || !visible) return;
      lastTime = 0;
      frameId = requestAnimationFrame(tick);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      activePointer = true;
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8), -1, 1);
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8), -1, 1);

      target.x = base.x - y * tilt;
      target.y = base.y + x * tilt;
      start();
    };

    const handlePointerLeave = () => {
      activePointer = false;
      target.x = base.x;
      target.y = base.y;
      start();
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) handlePointerLeave();
    };

    const isHoverPointer = (event: PointerEvent) => event.pointerType === 'mouse' || event.pointerType === 'pen';

    const handleEnter = (event: PointerEvent) => {
      if (!isHoverPointer(event)) return;
      hovered = true;
      start();
    };

    const handleLeave = () => {
      hovered = false;
      pressed = false;
      start();
    };

    const handleDown = () => {
      pressed = true;
      start();
    };

    const handleUp = (event: PointerEvent) => {
      pressed = false;
      if (!isHoverPointer(event)) hovered = false;
      start();
    };

    if (canTrackPointer) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerout', handlePointerOut);
      window.addEventListener('blur', handlePointerLeave);
    }

    if (listensToHover) {
      root.addEventListener('pointerenter', handleEnter);
      root.addEventListener('pointerleave', handleLeave);
      root.addEventListener('pointerdown', handleDown);
      root.addEventListener('pointerup', handleUp);
      root.addEventListener('pointercancel', handleLeave);
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) start();
            else stop();
          });
    observer?.observe(root);

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            size = root.offsetHeight;
          });
    resizeObserver?.observe(root);

    applyGrow();
    applyTransform();
    start();

    return () => {
      if (canTrackPointer) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerout', handlePointerOut);
        window.removeEventListener('blur', handlePointerLeave);
      }
      if (listensToHover) {
        root.removeEventListener('pointerenter', handleEnter);
        root.removeEventListener('pointerleave', handleLeave);
        root.removeEventListener('pointerdown', handleDown);
        root.removeEventListener('pointerup', handleUp);
        root.removeEventListener('pointercancel', handleLeave);
      }
      observer?.disconnect();
      resizeObserver?.disconnect();
      stop();
    };
  };

  createEffect(motionConfig, value => {
    config = value;
    restart?.();
  });

  onSettled(() => {
    config = motionConfig();
    let teardown: (() => void) | undefined;
    restart = () => {
      teardown?.();
      teardown = setup(config);
    };
    restart();
    return () => {
      restart = null;
      teardown?.();
      teardown = undefined;
    };
  });

  const rootStyle = (): JSX.CSSProperties => {
    const tint = depthColor();
    return {
      ...props.style,
      '--depth-text-perspective': `${safePerspective()}px`,
      '--depth-text-font-size': props.fontSize ?? 'clamp(3rem, 12vw, 7rem)',
      '--depth-text-font-weight': String(props.fontWeight ?? 500),
      '--depth-text-face-color': faceColor(),
      '--depth-text-shadow':
        shadow() && !gradientDepth() ? `0 0.18em 0.32em color-mix(in srgb, ${tint} 24%, rgba(0, 0, 0, 0.42))` : 'none',
      '--depth-text-face-shadow': shadow() ? '0 0.035em 0.07em rgba(0, 0, 0, 0.28)' : 'none'
    };
  };

  return (
    <span
      ref={el => (rootEl = el)}
      class={['depth-text', { 'depth-text--outline': outline() }, props.className]}
      style={rootStyle()}
    >
      <span
        ref={el => (stageEl = el)}
        class="depth-text__stage"
        style={{ transform: initialTransform, '--depth-text-grow': introDone() ? '1' : '0' }}
      >
        <For each={depthLayers()} keyed={false}>
          {layer => (
            <span
              aria-hidden="true"
              class={['depth-text__layer', { 'depth-text__layer--back': layer().index === safeLayers() }]}
              style={{ color: layer().color, transform: layer().transform }}
            >
              {text()}
            </span>
          )}
        </For>
        <span class="depth-text__face">{text()}</span>
      </span>
    </span>
  );
}
