import { For, createEffect, createMemo, createSignal, createUniqueId, onSettled, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate, motionValue, type AnimationPlaybackControls } from 'motion';
import { ArrowUp02Icon } from '@hugeicons/core-free-icons';

import './SlingButton.css';

export type SlingAxis = 'any' | 'horizontal' | 'vertical';

export interface SlingButtonProps {
  children?: JSX.Element;
  onSend?: () => void;
  padColor?: string;
  iconColor?: string;
  accentColor?: string;
  wellColor?: string;
  bandColor?: string;
  size?: number;
  strokeWidth?: number;
  armAt?: number;
  maxPull?: number;
  launchSpeed?: number;
  recoil?: number;
  flight?: number;
  particles?: number;
  spread?: number;
  axis?: SlingAxis;
  tapSends?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

interface Sample {
  x: number;
  y: number;
  t: number;
}

interface Grip {
  id: number;
  startX: number;
  startY: number;
  scale: number;
  moved: boolean;
  hist: Sample[];
  rawOrigin: { x: number; y: number };
  slop: number;
}

interface Config {
  size: number;
  strokeWidth: number;
  R: number;
  ARM: number;
  wellR: number;
  padR: number;
  count: number;
  launchSpeed: number;
  recoil: number;
  flight: number;
  spread: number;
  axis: SlingAxis;
  tapSends: boolean;
  disabled: boolean;
  reduce: boolean;
  reset: string;
}

const GAP = 4;
const SLOP = { fine: 4, coarse: 8 };
const FINGER_MAX = 3000;
const HAND_MAX = 6000;
const CANCEL = 0.5;
const POWER_CAP = 1.5;
const DOT_MS = 300;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const attempt = (fn: () => void) => {
  try {
    fn();
  } catch {
    return;
  }
};
const rubberband = (o: number, dim: number, c = 0.55) => (o * dim * c) / (dim + c * Math.abs(o));

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

function ArrowIcon(props: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
    >
      {ArrowUp02Icon.map(([, attrs]) => (
        <path
          d={String(attrs.d)}
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width={2.2}
        />
      ))}
    </svg>
  );
}

export default function SlingButton(props: SlingButtonProps) {
  const reduce = useReducedMotion();
  const geo = createMemo(() => {
    const size = props.size ?? 56;
    const strokeWidth = props.strokeWidth ?? 3;
    const R = props.maxPull ?? 160;
    const wellR = size / 2 + GAP + strokeWidth;
    return {
      size,
      strokeWidth,
      R,
      ARM: Math.min(props.armAt ?? 48, 0.8 * R),
      wellR,
      padR: size / 2 - strokeWidth / 2,
      arcR: wellR,
      H: wellR + strokeWidth + 2,
      DOT: Math.max(6, Math.round(size / 7)),
      count: Math.max(0, Math.round(props.particles ?? 14))
    };
  });
  const dots = createMemo(() => Array.from({ length: geo().count }, (_, i) => i));
  const [held, setHeld] = createSignal(false);
  const [armed, setArmed] = createSignal(false);
  const [sent, setSent] = createSignal(false);
  let rootEl: HTMLSpanElement | undefined;
  let padEl: HTMLButtonElement | undefined;
  let moveEl: HTMLSpanElement | undefined;
  let fxEl: SVGGElement | undefined;
  let bandEl: SVGPathElement | undefined;
  let hotEl: SVGPathElement | undefined;
  let arcEl: SVGCircleElement | undefined;
  let iconEl: HTMLSpanElement | undefined;
  const dotRefs: (HTMLSpanElement | null)[] = [];
  let power = 0;
  let grip: Grip | null = null;
  let dir = { ux: 0, uy: -1 };
  let animX: AnimationPlaybackControls | null = null;
  let animY: AnimationPlaybackControls | null = null;
  let armedNow = false;
  let dotPending = false;
  let dotTimer: ReturnType<typeof setTimeout> | undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let paintQueued = false;
  let skipClick = false;
  let mounted = false;
  let cfg = { reset: '' } as Config;
  const hintId = createUniqueId();

  const px = motionValue(0);
  const py = motionValue(0);

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const relaxIcon = () => {
    const icon = iconEl;
    if (!icon) return;
    icon.style.transition = cfg.reduce ? 'none' : 'transform 360ms cubic-bezier(0.23, 1, 0.32, 1)';
    icon.style.transform = 'rotate(0deg)';
  };

  const launchDot = () => {
    dotPending = false;
    clearTimeout(dotTimer);
    const { ux, uy } = dir;
    relaxIcon();
    const { wellR, flight, spread } = cfg;
    const base = Math.atan2(-uy, -ux);
    const cone = (spread * Math.PI) / 180;
    const push = 0.85 + 0.35 * power;
    dotRefs.slice(0, cfg.count).forEach((dot, i) => {
      if (!dot) return;
      const lead = i === 0;
      const angle = base + (lead ? 0 : (Math.random() + Math.random() - 1) * (cone / 2));
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      const reach = (lead ? flight : flight * (0.3 + Math.random())) * push;
      const drift = lead ? 0 : (Math.random() - 0.5) * flight * 0.4;
      const scale = lead ? 1 : 0.3 + Math.random() * 0.6;
      const shrink = lead ? 0.6 : scale * (0.2 + Math.random() * 0.4);
      const duration = lead ? DOT_MS : DOT_MS * (0.7 + Math.random());
      const delay = lead ? 0 : Math.random() * 70;
      const to = wellR + reach;
      dot.animate(
        [
          { transform: `translate(${cx * wellR}px, ${cy * wellR}px) scale(${scale})` },
          { transform: `translate(${cx * to - cy * drift}px, ${cy * to + cx * drift}px) scale(${shrink})` }
        ],
        { duration, delay, easing: EASE_OUT, fill: 'none' }
      );
      dot.animate(
        [
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.55 },
          { opacity: 0, offset: 1 }
        ],
        { duration, delay, easing: 'linear', fill: 'none' }
      );
    });
  };

  const aimIcon = (ux: number, uy: number, dist: number) => {
    const icon = iconEl;
    if (!icon) return;
    const angle = (Math.atan2(-uy, -ux) * 180) / Math.PI + 90;
    icon.style.transition = 'none';
    icon.style.transform = `rotate(${angle * clamp(dist / 12, 0, 1)}deg)`;
  };

  const paint = () => {
    paintQueued = false;
    const band = bandEl;
    const hot = hotEl;
    const arc = arcEl;
    const fx = fxEl;
    if (!band || !hot || !arc || !fx) return;
    const { wellR, padR, ARM, size } = cfg;
    const x = px.get();
    const y = py.get();
    const { ux, uy } = dir;
    const proj = x * ux + y * uy;
    const p = clamp(proj / ARM, 0, 1);
    const dist = Math.hypot(x, y);
    let d = '';
    if (dist > 0.5) {
      const a = Math.atan2(y, x);
      const b = Math.acos(clamp((wellR - padR) / dist, -1, 1));
      d = [a + b, a - b]
        .map(t => {
          const cx = Math.cos(t);
          const cy = Math.sin(t);
          return `M${(wellR * cx).toFixed(2)},${(wellR * cy).toFixed(2)}L${(x + padR * cx).toFixed(2)},${(y + padR * cy).toFixed(2)}`;
        })
        .join('');
    }
    band.setAttribute('d', d);
    hot.setAttribute('d', d);
    hot.style.opacity = String(p);
    fx.style.opacity = String(clamp(proj / 6, 0, 1));
    arc.setAttribute('stroke-dasharray', `${p} ${1 - p}`);
    arc.setAttribute('stroke-dashoffset', String(p / 2));
    arc.style.opacity = p > 0.01 ? '1' : '0';
    if (grip) aimIcon(ux, uy, dist);
    arc.setAttribute('transform', `rotate(${(Math.atan2(-uy, -ux) * 180) / Math.PI})`);
    if (dotPending && proj <= size / 4) launchDot();
  };
  const schedulePaint = () => {
    if (paintQueued) return;
    paintQueued = true;
    requestAnimationFrame(() => {
      if (mounted) paint();
      else paintQueued = false;
    });
  };

  const resetPad = () => {
    animX?.stop();
    animY?.stop();
    px.jump(0);
    py.jump(0);
    paint();
  };

  createEffect(
    () => {
      const g = geo();
      const axis = props.axis ?? 'any';
      return {
        size: g.size,
        strokeWidth: g.strokeWidth,
        R: g.R,
        ARM: g.ARM,
        wellR: g.wellR,
        padR: g.padR,
        count: g.count,
        launchSpeed: props.launchSpeed ?? 2600,
        recoil: props.recoil ?? 0.2,
        flight: props.flight ?? 120,
        spread: props.spread ?? 60,
        axis,
        tapSends: props.tapSends ?? true,
        disabled: props.disabled ?? false,
        reduce: reduce(),
        reset: [g.size, g.strokeWidth, props.armAt ?? 48, g.R, axis].join('~')
      };
    },
    value => {
      const changed = value.reset !== cfg.reset;
      cfg = value;
      if (mounted && changed) resetPad();
    }
  );

  const settle = (v0: { x: number; y: number }) => {
    if (cfg.reduce) {
      const fx = fxEl;
      if (fx) {
        fx.style.transition = 'opacity 200ms ease';
        fx.style.opacity = '0';
      }
      later(() => {
        px.jump(0);
        py.jump(0);
        if (fx) fx.style.transition = '';
      }, 200);
      return;
    }
    animX = animate(px, 0, { type: 'spring', duration: 0.4, bounce: cfg.recoil, velocity: v0.x });
    animY = animate(py, 0, { type: 'spring', duration: 0.4, bounce: cfg.recoil, velocity: v0.y });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (cfg.disabled || grip || e.button !== 0) return;
    const el = rootEl;
    if (!el) return;
    const R = cfg.R;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    animX?.stop();
    animY?.stop();
    const x = px.get();
    const y = py.get();
    const dNow = Math.hypot(x, y);
    const dClamped = Math.min(dNow, 0.95 * R);
    const rawNow = dNow > 0.5 ? (R * dClamped) / (R - dClamped) : 0;
    grip = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scale,
      moved: false,
      hist: [],
      rawOrigin: dNow > 0.5 ? { x: (rawNow * x) / dNow, y: (rawNow * y) / dNow } : { x: 0, y: 0 },
      slop: e.pointerType === 'touch' ? SLOP.coarse : SLOP.fine
    };
    attempt(() => padEl?.setPointerCapture(e.pointerId));
    setHeld(true);
  };

  const onPointerMove = (e: PointerEvent) => {
    const g = grip;
    if (!g || g.id !== e.pointerId) return;
    const { R, ARM, size, axis } = cfg;
    const dx = (e.clientX - g.startX) / g.scale;
    const dy = (e.clientY - g.startY) / g.scale;
    let rx = g.rawOrigin.x + dx;
    let ry = g.rawOrigin.y + dy;
    if (axis === 'horizontal') ry = rubberband(ry, size / 4);
    else if (axis === 'vertical') rx = rubberband(rx, size / 4);
    if (!g.moved && Math.hypot(dx, dy) > g.slop) g.moved = true;
    const raw = Math.hypot(rx, ry);
    if (raw < 0.01) return;
    const d = (R * raw) / (R + raw);
    const ux = rx / raw;
    const uy = ry / raw;
    dir = { ux, uy };
    px.set(d * ux);
    py.set(d * uy);
    const t = performance.now();
    g.hist.push({ x: d * ux, y: d * uy, t });
    while (g.hist.length > 4 || t - g.hist[0].t > 80) g.hist.shift();
    const isArmed = d >= ARM;
    if (isArmed !== armedNow) {
      armedNow = isArmed;
      setArmed(isArmed);
    }
  };

  const release = (pointerId: number, cancelled: boolean) => {
    const g = grip;
    if (!g || g.id !== pointerId) return;
    grip = null;
    skipClick = true;
    attempt(() => padEl?.releasePointerCapture(pointerId));
    const { ARM, launchSpeed, tapSends } = cfg;
    const d = Math.hypot(px.get(), py.get());
    const p = d / ARM;
    const { ux, uy } = dir;
    let vx = 0;
    let vy = 0;
    if (!cancelled && g.hist.length > 1) {
      const a = g.hist[0];
      const b = g.hist[g.hist.length - 1];
      const dt = b.t - a.t;
      if (dt > 0 && performance.now() - b.t < 50) {
        vx = ((b.x - a.x) / dt) * 1000;
        vy = ((b.y - a.y) / dt) * 1000;
      }
    }
    const fm = Math.hypot(vx, vy);
    if (fm > FINGER_MAX) {
      vx *= FINGER_MAX / fm;
      vy *= FINGER_MAX / fm;
    }
    if (!g.moved) {
      relaxIcon();
      if (tapSends && !cancelled) props.onSend?.();
    } else {
      const fire = armedNow && !cancelled;
      const launch = fire ? launchSpeed * Math.min(p, POWER_CAP) : CANCEL * launchSpeed * Math.min(p, 1);
      let v0x = vx - ux * launch;
      let v0y = vy - uy * launch;
      const m = Math.hypot(v0x, v0y);
      if (m > HAND_MAX) {
        v0x *= HAND_MAX / m;
        v0y *= HAND_MAX / m;
      }
      if (!fire) relaxIcon();
      if (fire) {
        props.onSend?.();
        if (cfg.reduce) {
          setSent(true);
          later(() => {
            setSent(false);
          }, 200);
        } else {
          power = clamp((Math.min(p, POWER_CAP) - 1) / (POWER_CAP - 1), 0, 1);
          dotPending = true;
          dotTimer = setTimeout(launchDot, 150);
        }
      }
      settle({ x: v0x, y: v0y });
    }
    armedNow = false;
    setHeld(false);
    setArmed(false);
  };

  onSettled(() => {
    mounted = true;
    const writeMove = () => {
      if (moveEl) moveEl.style.transform = `translate(${px.get()}px, ${py.get()}px)`;
    };
    const onChange = () => {
      writeMove();
      schedulePaint();
    };
    const offX = px.on('change', onChange);
    const offY = py.on('change', onChange);
    writeMove();
    resetPad();
    return () => {
      mounted = false;
      offX();
      offY();
      animX?.stop();
      animY?.stop();
      clearTimeout(dotTimer);
      timers.forEach(id => clearTimeout(id));
      timers.clear();
      px.destroy();
      py.destroy();
    };
  });

  const rootStyle = createMemo(() => {
    const g = geo();
    return {
      '--sl-size': `${g.size}px`,
      '--sl-svg': `${2 * g.H}px`,
      '--sl-pad': props.padColor ?? '#f5f5f5',
      '--sl-icon': props.iconColor ?? '#18181b',
      '--sl-accent': props.accentColor ?? '#f5f5f5',
      '--sl-well': props.wellColor ?? '#27272a',
      '--sl-band': props.bandColor ?? '#52525b',
      '--sl-stroke': `${g.strokeWidth}px`,
      '--sl-dot': `${g.DOT}px`
    } as JSX.CSSProperties;
  });

  return (
    <span
      ref={el => (rootEl = el)}
      class={['sling-button', props.className]}
      data-armed={armed() ? '' : undefined}
      data-sent={sent() ? '' : undefined}
      style={rootStyle()}
    >
      <svg
        class="sling-button__fx"
        viewBox={`${-geo().H} ${-geo().H} ${2 * geo().H} ${2 * geo().H}`}
        aria-hidden="true"
      >
        <g ref={el => (fxEl = el)} class="sling-button__tension" style={{ opacity: 0 }}>
          <path ref={el => (bandEl = el)} class="sling-button__band" />
          <path ref={el => (hotEl = el)} class="sling-button__band sling-button__band--hot" />
        </g>
        <circle class="sling-button__well" r={geo().wellR} />
        <circle
          ref={el => (arcEl = el)}
          class="sling-button__arc"
          r={geo().arcR}
          pathLength="1"
          stroke-dasharray="0 1"
          style={{ opacity: 0 }}
        />
      </svg>
      <For each={dots()}>
        {i => (
          <span
            ref={el => {
              dotRefs[i] = el;
            }}
            class="sling-button__dot"
            aria-hidden="true"
          />
        )}
      </For>
      <span ref={el => (moveEl = el)} class="sling-button__move">
        <button
          ref={el => (padEl = el)}
          type="button"
          class="sling-button__pad"
          aria-label={props.ariaLabel ?? 'Send'}
          aria-describedby={hintId}
          aria-disabled={props.disabled ? 'true' : undefined}
          data-held={held() ? '' : undefined}
          data-armed={armed() ? '' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={e => release(e.pointerId, false)}
          onPointerCancel={e => release(e.pointerId, true)}
          onLostPointerCapture={e => release(e.pointerId, true)}
          onKeyDown={e => {
            if (e.key === 'Escape' && grip) release(grip.id, true);
          }}
          onClick={() => {
            if (skipClick) {
              skipClick = false;
              return;
            }
            if (!props.disabled) props.onSend?.();
          }}
        >
          <span class="sling-button__face">
            <span ref={el => (iconEl = el)} class="sling-button__icon">
              {props.children ?? <ArrowIcon size={Math.round(geo().size * 0.4)} />}
            </span>
          </span>
        </button>
      </span>
      <span id={hintId} class="sling-button__sr">
        Press Enter to send, or drag away and release.
      </span>
    </span>
  );
}
