import { Show, children, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './TiltedCard.css';

type Axis = 'both' | 'horizontal' | 'vertical';

export interface TiltedCardLayerProps {
  depth?: number;
  className?: string;
  style?: JSX.CSSProperties;
  children?: JSX.Element;
}

export interface TiltedCardProps {
  imageSrc?: string;
  altText?: string;
  captionText?: string;
  containerHeight?: number | string;
  containerWidth?: number | string;
  imageHeight?: number | string;
  imageWidth?: number | string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showTooltip?: boolean;
  overlayContent?: JSX.Element;
  displayOverlayContent?: boolean;
  overlayDepth?: number;
  children?: JSX.Element;
  backContent?: JSX.Element;
  flipOnClick?: boolean;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  radius?: number | string;
  perspective?: number | string;
  smoothness?: number;
  glare?: number;
  glareColor?: string;
  shadow?: number;
  parallax?: number;
  axis?: Axis;
  reverse?: boolean;
  trackWindow?: boolean;
  floating?: boolean;
  gyroscope?: boolean;
  intro?: boolean;
  introDelay?: number;
  onClick?: (event: MouseEvent | KeyboardEvent) => void;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Settings {
  amplitude: number;
  scale: number;
  smoothness: number;
  glare: number;
  shadow: number;
  parallax: number;
  axis: Axis;
  reverse: boolean;
  trackWindow: boolean;
  floating: boolean;
  gyroscope: boolean;
  intro: boolean;
  introDelay: number;
  flippable: boolean;
  interactive: boolean;
  flipped: boolean;
  tooltip: boolean;
}

type OrientationRequest = { requestPermission?: () => Promise<string> };

const FLIP_THRESHOLD = 6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const parseColor = (value: string): number[] | null => {
  const text = String(value || '').trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map(channel => clamp(Math.round(parseFloat(channel)), 0, 255));
  return null;
};

const toLength = (value: number | string | undefined) => (typeof value === 'number' ? `${value}px` : value);

const smoother = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const step = (state: Record<string, number>, key: string, target: number, omega: number, zeta: number, dt: number) => {
  const velocity = `v${key}`;
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  for (let index = 0; index < steps; index++) {
    state[velocity] += (omega * omega * (target - state[key]) - 2 * zeta * omega * state[velocity]) * h;
    state[key] += state[velocity] * h;
  }
  const settled = Math.abs(target - state[key]) < 0.001 && Math.abs(state[velocity]) < 0.01;
  if (settled) {
    state[key] = target;
    state[velocity] = 0;
  }
  return !settled;
};

const present = (nodes: unknown[]) => nodes.some(node => node != null && node !== false && node !== '');

export function TiltedCardLayer(props: TiltedCardLayerProps) {
  return (
    <div class={['tilted-card__layer', props.className]} style={{ '--tc-depth': props.depth ?? 20, ...props.style }}>
      {props.children}
    </div>
  );
}

export default function TiltedCard(props: TiltedCardProps) {
  let figureEl: HTMLElement | undefined;
  let bodyEl: HTMLDivElement | undefined;
  let shadowEl: HTMLDivElement | undefined;
  let captionEl: HTMLElement | undefined;
  let current!: Settings;
  let wake: (() => void) | null = null;
  let canActivate: (() => boolean) | null = null;

  const back = children(() => props.backContent);
  const overlay = children(() => props.overlayContent);
  const hasBack = createMemo(() => present(back.toArray()));
  const hasOverlay = createMemo(() => present(overlay.toArray()));

  const [innerFlipped, setInnerFlipped] = createSignal(false);
  const controlled = () => typeof props.flipped === 'boolean';
  const isFlipped = createMemo(() => hasBack() && (controlled() ? Boolean(props.flipped) : innerFlipped()));
  const flippable = createMemo(() => hasBack() && (props.flipOnClick ?? true));
  const interactive = createMemo(() => flippable() || Boolean(props.onClick));
  const captionText = () => props.captionText ?? '';
  const altText = () => props.altText ?? 'Tilted card image';
  const showCaption = createMemo(() => (props.showTooltip ?? true) && Boolean(captionText()));

  const settings = createMemo<Settings>(() => ({
    amplitude: clamp(props.rotateAmplitude ?? 12, 0, 60),
    scale: Math.max(0.5, props.scaleOnHover ?? 1.05),
    smoothness: clamp(props.smoothness ?? 0.6, 0, 1),
    glare: clamp(props.glare ?? 0.5, 0, 1),
    shadow: clamp(props.shadow ?? 0.5, 0, 1),
    parallax: Math.max(0, props.parallax ?? 1),
    axis: props.axis ?? 'both',
    reverse: props.reverse ?? false,
    trackWindow: props.trackWindow ?? false,
    floating: props.floating ?? false,
    gyroscope: props.gyroscope ?? true,
    intro: props.intro ?? true,
    introDelay: Math.max(0, props.introDelay ?? 0),
    flippable: flippable(),
    interactive: interactive(),
    flipped: isFlipped(),
    tooltip: showCaption()
  }));

  createEffect(settings, value => {
    current = value;
    wake?.();
  });

  onSettled(() => {
    current = settings();
    const figure = figureEl;
    const body = bodyEl;
    if (!figure || !body) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const state = {
      rx: 0,
      vrx: 0,
      ry: 0,
      vry: 0,
      lift: 0,
      vlift: 0,
      ty: 0,
      vty: 0,
      flip: 0,
      vflip: 0,
      press: 0,
      vpress: 0,
      tip: 0,
      vtip: 0,
      shown: 0,
      vshown: 0,
      tx: 0,
      tyy: 0
    };
    const pointer = { nx: 0, ny: 0, x: 0, y: 0, inside: false, mouse: false, seen: false, vx: 0, last: 0 };
    const press = { active: false, x: 0, y: 0, moved: false };
    const tilt = { gamma: 0, beta: 0, baseGamma: 0, baseBeta: 0, calibrated: false, live: false, asked: false };
    let opacity = 1;
    let entered = true;
    let introAt = -1;
    let time = Math.random() * 10;
    let focused = false;
    let raf = 0;
    let last = 0;
    let visible = true;

    if (current.intro && !reduced) {
      entered = false;
      opacity = 0;
      state.rx = 16;
      state.ty = 22;
      body.style.opacity = '0';
    }

    const frame = (now: number) => {
      raf = 0;
      const s = current;
      const dt = clamp((now - last) / 1000 || 0, 0, 0.05);
      last = Math.max(last, now);
      time += dt;
      let busy = false;

      const amplitude = s.amplitude * (reduced ? 0.3 : 1);
      const hovering = pointer.inside && pointer.mouse;
      const touching = press.active && !pointer.mouse;
      const following = hovering || touching || (s.trackWindow && pointer.seen && !coarse);
      let inputX = 0;
      let inputY = 0;
      if (following) {
        inputX = pointer.nx;
        inputY = pointer.ny;
      } else if (tilt.live && s.gyroscope) {
        inputX = clamp((tilt.gamma - tilt.baseGamma) / 22, -1, 1);
        inputY = clamp((tilt.beta - tilt.baseBeta) / 22, -1, 1);
        tilt.baseGamma += (tilt.gamma - tilt.baseGamma) * (1 - Math.exp(-dt / 4));
        tilt.baseBeta += (tilt.beta - tilt.baseBeta) * (1 - Math.exp(-dt / 4));
        busy = true;
      } else if (s.floating && !reduced && visible) {
        inputX = 0.32 * Math.sin(time * 0.62) + 0.12 * Math.sin(time * 1.31 + 0.7);
        inputY = 0.26 * Math.sin(time * 0.83 + 1.9) + 0.1 * Math.sin(time * 1.57);
        busy = true;
      }
      if (s.axis === 'horizontal') inputY = 0;
      if (s.axis === 'vertical') inputX = 0;
      const sign = s.reverse ? -1 : 1;

      const omega = 20 * Math.pow(0.2, s.smoothness);
      const zeta = 1 - 0.3 * s.smoothness;
      const lifted = hovering || touching || focused ? 1 : 0;

      if (!entered && introAt >= 0 && now >= introAt) entered = true;
      const settle = entered || !s.intro || reduced;
      busy = step(state, 'rx', settle ? -inputY * amplitude * sign : state.rx, omega, zeta, dt) || busy;
      busy = step(state, 'ry', settle ? inputX * amplitude * sign : state.ry, omega, zeta, dt) || busy;
      busy =
        step(
          state,
          'ty',
          settle ? (s.floating && !following && !reduced ? -4 * Math.sin(time * 0.9) : 0) : state.ty,
          omega * 0.8,
          0.9,
          dt
        ) || busy;
      busy = step(state, 'lift', lifted, omega, Math.max(zeta, 0.85), dt) || busy;
      busy = step(state, 'flip', s.flipped ? 180 : 0, reduced ? 18 : 9.5, 0.72, dt) || busy;
      busy = step(state, 'press', press.active && !press.moved && s.interactive ? 1 : 0, 26, 0.8, dt) || busy;
      if (settle && opacity < 1) {
        opacity = Math.min(1, opacity + dt / 0.45);
        busy = true;
      }

      const active = lifted > 0 || state.lift > 0.01;
      if (active !== figure.hasAttribute('data-active')) figure.toggleAttribute('data-active', active);
      const scale = 1 + (s.scale - 1) * state.lift - 0.02 * state.press;
      const rx = state.rx;
      const ry = state.ry;
      const radiansX = (rx * Math.PI) / 180;
      const radiansY = (ry * Math.PI) / 180;
      body.style.transform = `translate3d(0, ${state.ty.toFixed(2)}px, 0) rotateX(${rx.toFixed(3)}deg) rotateY(${(ry + state.flip).toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      body.style.opacity = opacity < 1 ? smoother(opacity).toFixed(3) : '';
      body.style.setProperty('--tc-px', (Math.sin(radiansY) * s.parallax).toFixed(4));
      body.style.setProperty('--tc-py', (-Math.sin(radiansX) * s.parallax).toFixed(4));
      const reach = Math.max(amplitude, 1);
      body.style.setProperty('--tc-gx', `${(50 + (ry / reach) * 46).toFixed(2)}%`);
      body.style.setProperty('--tc-gy', `${(50 - (rx / reach) * 46).toFixed(2)}%`);
      const energy = Math.min(1, Math.hypot(rx, ry) / reach);
      body.style.setProperty(
        '--tc-glare',
        (s.glare * Math.max(state.lift, energy) * (opacity < 1 ? smoother(opacity) : 1)).toFixed(3)
      );

      const shade = shadowEl;
      if (shade) {
        const strength = s.shadow * (opacity < 1 ? smoother(opacity) : 1);
        const offsetX = -Math.sin(radiansY) * 22;
        const offsetY = 12 + 16 * state.lift + Math.sin(radiansX) * 18 - state.ty * 0.6;
        const turn = Math.abs(Math.cos((state.flip * Math.PI) / 180));
        const spread = scale * (0.86 + 0.04 * state.lift);
        shade.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) scale(${(spread * (0.2 + 0.8 * turn)).toFixed(4)}, ${spread.toFixed(4)})`;
        shade.style.opacity = (strength * (0.6 + 0.4 * state.lift)).toFixed(3);
      }

      const caption = captionEl;
      if (caption && caption.isConnected) {
        const show = s.tooltip && hovering ? 1 : 0;
        busy = step(state, 'shown', show, 16, 1, dt) || busy;
        const follow = 1 - Math.exp(-dt / 0.035);
        state.tx += (pointer.x - state.tx) * follow;
        state.tyy += (pointer.y - state.tyy) * follow;
        if (Math.abs(pointer.x - state.tx) + Math.abs(pointer.y - state.tyy) > 0.2) busy = true;
        pointer.vx *= Math.exp(-dt / 0.08);
        busy = step(state, 'tip', reduced ? 0 : clamp(-pointer.vx * 0.012, -14, 14), 18, 0.62, dt) || busy;
        caption.style.transform = `translate3d(${state.tx.toFixed(1)}px, ${state.tyy.toFixed(1)}px, 0) rotate(${state.tip.toFixed(2)}deg)`;
        caption.style.opacity = Math.max(0, state.shown).toFixed(3);
      }

      if ((busy || (!settle && s.intro)) && visible) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    wake = start;

    const locate = (event: PointerEvent, area: HTMLElement) => {
      const rect = area.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height)
      };
    };

    const track = (event: PointerEvent) => {
      const spot = locate(event, figure);
      const now = performance.now();
      const elapsed = Math.max(8, now - (pointer.last || now - 16)) / 1000;
      const dx = spot.x - pointer.x;
      pointer.vx += (dx / elapsed - pointer.vx) * 0.5;
      pointer.last = now;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.nx = clamp((spot.x - spot.width / 2) / (spot.width / 2), -1, 1);
      pointer.ny = clamp((spot.y - spot.height / 2) / (spot.height / 2), -1, 1);
    };

    const onEnter = (event: PointerEvent) => {
      pointer.inside = true;
      pointer.mouse = event.pointerType === 'mouse' || event.pointerType === 'pen';
      const spot = locate(event, figure);
      pointer.x = spot.x;
      pointer.y = spot.y;
      state.tx = spot.x;
      state.tyy = spot.y;
      pointer.vx = 0;
      track(event);
      start();
    };
    const onMove = (event: PointerEvent) => {
      pointer.mouse = event.pointerType === 'mouse' || event.pointerType === 'pen';
      if (!pointer.inside && pointer.mouse) {
        pointer.inside = true;
        const spot = locate(event, figure);
        pointer.x = spot.x;
        pointer.y = spot.y;
        state.tx = spot.x;
        state.tyy = spot.y;
        pointer.vx = 0;
      }
      track(event);
      if (press.active && Math.hypot(event.clientX - press.x, event.clientY - press.y) > FLIP_THRESHOLD)
        press.moved = true;
      start();
    };
    const onLeave = () => {
      pointer.inside = false;
      pointer.vx = 0;
      start();
    };
    const onWindowMove = (event: PointerEvent) => {
      if (pointer.inside && pointer.mouse && !figure.contains(event.target as Node)) onLeave();
      if (!current.trackWindow || pointer.inside) return;
      const rect = figure.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      pointer.seen = true;
      pointer.nx = clamp((event.clientX - cx) / Math.max(1, window.innerWidth / 2), -1, 1);
      pointer.ny = clamp((event.clientY - cy) / Math.max(1, window.innerHeight / 2), -1, 1);
      start();
    };
    const onWindowLeave = () => {
      pointer.seen = false;
      start();
    };

    const askMotion = () => {
      if (!current.gyroscope || !coarse || tilt.asked) return;
      tilt.asked = true;
      const request = (window.DeviceOrientationEvent as unknown as OrientationRequest | undefined)?.requestPermission;
      if (typeof request === 'function') request.call(window.DeviceOrientationEvent).catch(() => {});
    };

    const onDown = (event: PointerEvent) => {
      press.active = true;
      press.moved = false;
      press.x = event.clientX;
      press.y = event.clientY;
      pointer.mouse = event.pointerType === 'mouse' || event.pointerType === 'pen';
      if (!pointer.mouse) {
        pointer.inside = true;
        track(event);
      }
      askMotion();
      start();
    };
    const onUp = (event: PointerEvent) => {
      if (!press.active) return;
      press.active = false;
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') pointer.inside = false;
      start();
    };
    const onCancel = () => {
      press.active = false;
      press.moved = true;
      pointer.inside = false;
      start();
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;
      tilt.gamma = event.gamma;
      tilt.beta = event.beta;
      if (!tilt.calibrated) {
        tilt.baseGamma = event.gamma;
        tilt.baseBeta = event.beta;
        tilt.calibrated = true;
      }
      tilt.live = coarse;
      start();
    };

    canActivate = () => {
      if (press.moved) return false;
      return true;
    };

    const onFocus = () => {
      focused = figure.matches(':focus-visible');
      start();
    };
    const onBlur = () => {
      focused = false;
      start();
    };

    figure.addEventListener('pointerenter', onEnter);
    figure.addEventListener('pointermove', onMove);
    figure.addEventListener('pointerleave', onLeave);
    figure.addEventListener('pointerdown', onDown);
    figure.addEventListener('focus', onFocus);
    figure.addEventListener('blur', onBlur);
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onCancel, { passive: true });
    window.addEventListener('pointermove', onWindowMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onWindowLeave);
    window.addEventListener('deviceorientation', onOrientation);

    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && !entered && introAt < 0) introAt = performance.now() + current.introDelay;
      start();
    });
    observer.observe(figure);

    start();

    return () => {
      cancelAnimationFrame(raf);
      wake = null;
      canActivate = null;
      observer.disconnect();
      figure.removeEventListener('pointerenter', onEnter);
      figure.removeEventListener('pointermove', onMove);
      figure.removeEventListener('pointerleave', onLeave);
      figure.removeEventListener('pointerdown', onDown);
      figure.removeEventListener('focus', onFocus);
      figure.removeEventListener('blur', onBlur);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('pointermove', onWindowMove);
      document.documentElement.removeEventListener('pointerleave', onWindowLeave);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  });

  const toggle = () => {
    const next = !isFlipped();
    if (!controlled()) setInnerFlipped(next);
    props.onFlip?.(next);
  };

  const activate = (event: MouseEvent) => {
    if (!interactive()) return;
    if (canActivate && !canActivate()) return;
    if (flippable()) toggle();
    props.onClick?.(event);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!interactive() || event.target !== figureEl || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (event.repeat) return;
    if (flippable()) toggle();
    props.onClick?.(event);
  };

  const corner = () => toLength(props.radius ?? 15);
  const glareRgb = () => (parseColor(props.glareColor ?? '#ffffff') || [255, 255, 255]).join(', ');
  const bleed = createMemo(
    () =>
      Math.ceil(
        Math.sin((clamp(props.rotateAmplitude ?? 12, 0, 60) * Math.PI) / 180) * 24 * Math.max(0, props.parallax ?? 1)
      ) + 1
  );

  return (
    <figure
      ref={el => (figureEl = el)}
      class={['tilted-card', props.className]}
      style={{
        width: toLength(props.containerWidth ?? '100%'),
        height: toLength(props.containerHeight ?? '300px'),
        perspective: toLength(props.perspective ?? 800),
        ...props.style
      }}
      data-interactive={interactive() ? '' : undefined}
      data-flipped={isFlipped() ? '' : undefined}
      tabindex={interactive() ? 0 : undefined}
      role={interactive() ? 'button' : undefined}
      aria-pressed={flippable() ? (isFlipped() ? 'true' : 'false') : undefined}
      aria-label={interactive() ? captionText() || altText() : undefined}
      onClick={activate}
      onKeyDown={onKeyDown}
    >
      <div
        ref={el => (shadowEl = el)}
        class="tilted-card__shadow"
        aria-hidden="true"
        style={{
          width: toLength(props.imageWidth ?? '300px'),
          height: toLength(props.imageHeight ?? '300px'),
          'border-radius': corner()
        }}
      />
      <div
        ref={el => (bodyEl = el)}
        class="tilted-card__body"
        style={{
          width: toLength(props.imageWidth ?? '300px'),
          height: toLength(props.imageHeight ?? '300px'),
          '--tc-radius': corner(),
          '--tc-glare-rgb': glareRgb()
        }}
      >
        <div class="tilted-card__face tilted-card__front">
          <Show when={props.imageSrc}>
            <img
              class="tilted-card__img"
              src={props.imageSrc}
              alt={altText()}
              draggable="false"
              style={{
                '--tc-depth': -24,
                top: `-${bleed()}px`,
                left: `-${bleed()}px`,
                width: `calc(100% + ${bleed() * 2}px)`,
                height: `calc(100% + ${bleed() * 2}px)`
              }}
            />
          </Show>
          {props.children}
          <span class="tilted-card__glare" aria-hidden="true" />
          <span class="tilted-card__rim" aria-hidden="true" />
          <span class="tilted-card__edge" aria-hidden="true" />
        </div>
        <Show when={hasBack()}>
          <div class="tilted-card__face tilted-card__back" aria-hidden={isFlipped() ? 'false' : 'true'}>
            {back()}
            <span class="tilted-card__glare" aria-hidden="true" />
            <span class="tilted-card__rim" aria-hidden="true" />
            <span class="tilted-card__edge" aria-hidden="true" />
          </div>
        </Show>
        <Show when={props.displayOverlayContent && hasOverlay()}>
          <div class="tilted-card__overlay" style={{ '--tc-lift': `${props.overlayDepth ?? 30}px` }}>
            {overlay()}
          </div>
        </Show>
      </div>
      <Show when={showCaption()}>
        <figcaption ref={el => (captionEl = el)} class="tilted-card__caption">
          {captionText()}
        </figcaption>
      </Show>
    </figure>
  );
}
