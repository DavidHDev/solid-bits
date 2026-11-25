import { Show, createEffect, createMemo, createSignal, createUniqueId, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { Archive02Icon, Tick02Icon, Undo02Icon } from '@hugeicons/core-free-icons';

import './FuseButton.css';

export type FusePosition = 'outline' | 'bottom' | 'top';
export type FuseCommitOn = 'press' | 'fuseEnd';
export type FuseSettle = 'reset' | 'stay';
export type FusePhase = 'idle' | 'armed' | 'settled';
export type FuseSize = 'sm' | 'md' | 'lg';

export interface FuseButtonProps {
  label?: string;
  undoLabel?: string;
  doneLabel?: string;
  icon?: JSX.Element;
  color?: string;
  background?: string;
  fuseColor?: string;
  size?: FuseSize;
  radius?: number;
  undoWindow?: number;
  fuse?: FusePosition;
  fuseThickness?: number;
  crossfadeMs?: number;
  commitOn?: FuseCommitOn;
  pauseOnHover?: boolean;
  settle?: FuseSettle;
  disabled?: boolean;
  onCommit?: (reason: FuseCommitOn) => void;
  onUndo?: () => void;
  onFuseEnd?: () => void;
  onPhaseChange?: (phase: FusePhase) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

type Settings = {
  undoWindow: number;
  fuse: FusePosition;
  commitOn: FuseCommitOn;
  pauseOnHover: boolean;
  settle: FuseSettle;
  disabled: boolean;
  onCommit?: (reason: FuseCommitOn) => void;
  onUndo?: () => void;
  onFuseEnd?: () => void;
  onPhaseChange?: (phase: FusePhase) => void;
};

type IconSvgElement = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const LINE: Keyframe[] = [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }];
const OUTLINE: Keyframe[] = [{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }];
const SIZES: Record<FuseSize, { height: number; font: number; icon: number; px: number }> = {
  sm: { height: 36, font: 13, icon: 14, px: 16 },
  md: { height: 44, font: 14, icon: 15, px: 20 },
  lg: { height: 52, font: 15, icon: 17, px: 24 }
};

const escapeAttr = (value: string | number) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const iconMarkup = (icon: IconSvgElement, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${escapeAttr(name === 'stroke-width' ? strokeWidth : value)}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

function Icon(props: { icon: IconSvgElement; size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      innerHTML={iconMarkup(props.icon, props.strokeWidth)}
    />
  );
}

export default function FuseButton(props: FuseButtonProps) {
  let rootEl: HTMLSpanElement | undefined;
  let idleEl: HTMLButtonElement | undefined;
  let undoEl: HTMLButtonElement | undefined;
  let lineEl: HTMLElement | undefined;
  let rimEl: SVGRectElement | undefined;
  let anim: Animation | null = null;
  let current!: Settings;
  let phaseNow: FusePhase = 'idle';
  let windowMs = 4000;
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  const pause = { hover: false, hidden: false, canHoverPause: false };

  const [phase, setPhase] = createSignal<FusePhase>('idle');
  const [instant, setInstant] = createSignal(false);
  const statusId = createUniqueId();

  const settings = createMemo<Settings>(() => ({
    undoWindow: props.undoWindow ?? 4000,
    fuse: props.fuse ?? 'outline',
    commitOn: props.commitOn ?? 'press',
    pauseOnHover: props.pauseOnHover ?? true,
    settle: props.settle ?? 'reset',
    disabled: props.disabled ?? false,
    onCommit: props.onCommit,
    onUndo: props.onUndo,
    onFuseEnd: props.onFuseEnd,
    onPhaseChange: props.onPhaseChange
  }));

  const fuse = () => props.fuse ?? 'outline';
  const preset = () => SIZES[props.size ?? 'md'] || SIZES.md;

  const go = (next: FusePhase) => {
    setInstant(lastInput === 'keyboard');
    setPhase(next);
    phaseNow = next;
    current.onPhaseChange?.(next);
  };

  const syncPlayState = () => {
    const a = anim;
    if (!a) return;
    const { hover, hidden } = pause;
    if (hover || hidden) {
      if (a.playState === 'running') a.pause();
    } else if (a.playState === 'paused') {
      a.play();
    }
  };

  const light = (from = 0) => {
    const outline = current.fuse === 'outline';
    const el = outline ? rimEl : lineEl;
    if (!el) return;
    anim?.cancel();
    const a = el.animate(outline ? OUTLINE : LINE, {
      duration: windowMs,
      easing: 'linear',
      fill: 'forwards'
    });
    if (from) a.currentTime = from;
    a.onfinish = () => {
      const l = current;
      l.onFuseEnd?.();
      if (l.commitOn === 'fuseEnd') l.onCommit?.('fuseEnd');
      lastInput = 'pointer';
      go(l.settle === 'stay' ? 'settled' : 'idle');
    };
    anim = a;
    syncPlayState();
  };

  const arm = () => {
    if (current.disabled || phaseNow !== 'idle') return;
    windowMs = current.undoWindow;
    light();
    pause.canHoverPause = false;
    pause.hover = false;
    if (current.commitOn === 'press') current.onCommit?.('press');
    go('armed');
  };

  const undo = () => {
    if (phaseNow !== 'armed') return;
    const a = anim;
    if (a) {
      a.onfinish = null;
      a.pause();
    }
    current.onUndo?.();
    go('idle');
  };

  createEffect(settings, value => {
    const prevFuse = current?.fuse;
    current = value;
    if (prevFuse !== undefined && prevFuse !== value.fuse && anim && phaseNow === 'armed') {
      light(Number(anim.currentTime) || 0);
    }
    if (!value.pauseOnHover) {
      pause.hover = false;
      syncPlayState();
    }
  });

  createEffect(phase, next => {
    const inside = rootEl?.contains(document.activeElement);
    if (next === 'armed') undoEl?.focus({ preventScroll: true });
    else if (inside) (next === 'idle' ? idleEl : rootEl)?.focus({ preventScroll: true });
  });

  onSettled(() => {
    current = settings();
    const onVisibility = () => {
      pause.hidden = document.hidden;
      syncPlayState();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      anim?.cancel();
    };
  });

  const handlePointerDown = (e: PointerEvent) => {
    lastInput = 'pointer';
    const pressable = phaseNow === 'armed' || (phaseNow === 'idle' && !current.disabled);
    if (e.button === 0 && pressable && rootEl) rootEl.dataset.pressed = '';
  };
  const release = () => {
    if (rootEl) delete rootEl.dataset.pressed;
  };
  const handlePointerEnter = (e: PointerEvent) => {
    if (current.pauseOnHover && e.pointerType === 'mouse' && pause.canHoverPause) {
      pause.hover = true;
      syncPlayState();
    }
  };
  const handlePointerLeave = (e: PointerEvent) => {
    release();
    if (e.pointerType !== 'mouse') return;
    pause.canHoverPause = true;
    pause.hover = false;
    syncPlayState();
  };
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') lastInput = 'keyboard';
    if (e.key === 'Escape' && phaseNow === 'armed') {
      e.preventDefault();
      lastInput = 'keyboard';
      undo();
    }
  };

  const actionIcon = () => props.icon ?? <Icon icon={Archive02Icon} size={preset().icon} strokeWidth={1.8} />;

  return (
    <span
      ref={el => (rootEl = el)}
      tabindex={-1}
      class={['fuse-button', props.className]}
      data-phase={phase()}
      data-fuse={fuse()}
      data-instant={instant() ? '' : undefined}
      aria-disabled={phase() === 'settled' ? 'true' : undefined}
      style={{
        '--fb-ink': props.color ?? '#f5f5f5',
        '--fb-bg': props.background ?? '#27272a',
        '--fb-fuse': props.fuseColor ?? '#24adf5',
        '--fb-fuse-h': `${props.fuseThickness ?? 1.5}px`,
        '--fb-radius': `${props.radius ?? 22}px`,
        '--fb-fade': `${props.crossfadeMs ?? 200}ms`,
        '--fb-h': `${preset().height}px`,
        '--fb-fs': `${preset().font}px`,
        '--fb-icon': `${preset().icon}px`,
        '--fb-px': `${preset().px}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={el => (idleEl = el)}
        type={props.type ?? 'button'}
        class="fuse-button__face fuse-button__idle"
        disabled={props.disabled ?? false}
        inert={phase() !== 'idle'}
        onClick={arm}
      >
        <span class="fuse-button__icon" aria-hidden="true">
          {actionIcon()}
        </span>
        {props.label ?? 'Archive'}
      </button>
      <button
        ref={el => (undoEl = el)}
        type="button"
        class="fuse-button__face fuse-button__undo"
        aria-describedby={statusId}
        aria-keyshortcuts="Escape"
        inert={phase() !== 'armed'}
        onClick={undo}
      >
        <span class="fuse-button__icon fuse-button__icon--undo" aria-hidden="true">
          <Icon icon={Undo02Icon} size={preset().icon} strokeWidth={2} />
        </span>
        {props.undoLabel ?? 'Undo'}
        <Show when={fuse() !== 'outline'}>
          <i ref={el => (lineEl = el)} class="fuse-button__fuse" aria-hidden="true" />
        </Show>
      </button>
      <span class="fuse-button__face fuse-button__settled" inert={phase() !== 'settled'}>
        <span class="fuse-button__icon" aria-hidden="true">
          <Icon icon={Tick02Icon} size={preset().icon} strokeWidth={2.2} />
        </span>
        {props.doneLabel ?? 'Archived'}
      </span>
      <Show when={fuse() === 'outline'}>
        <svg class="fuse-button__rim" aria-hidden="true">
          <rect ref={el => (rimEl = el)} pathLength="1" />
        </svg>
      </Show>
      <span class="fuse-button__status" id={statusId} role="status" aria-live="polite">
        {phase() === 'idle' ? '' : (props.doneLabel ?? 'Archived')}
      </span>
    </span>
  );
}
