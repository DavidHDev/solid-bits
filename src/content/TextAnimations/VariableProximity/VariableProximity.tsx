import { For, Show, createEffect, createMemo, createSignal, omit } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './VariableProximity.css';

type Falloff = 'linear' | 'exponential' | 'gaussian';

type ContainerRef = HTMLElement | { current?: HTMLElement | null } | null | undefined;

export interface VariableProximityProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  'style' | 'onClick' | 'ref' | 'children'
> {
  label?: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  containerRef?: ContainerRef;
  radius?: number;
  falloff?: Falloff;
  smoothing?: number;
  fromColor?: string;
  toColor?: string;
  scale?: number;
  lift?: number;
  idleWave?: boolean;
  fontSize?: number | string;
  className?: string;
  onClick?: () => void;
  style?: JSX.CSSProperties;
  ref?: HTMLSpanElement | ((el: HTMLSpanElement) => void);
}

interface ProximityState {
  pointer: { x: number; y: number; active: boolean };
  levels: number[];
  targets: number[];
}

interface Axis {
  axis: string;
  fromValue: number;
  toValue: number;
}

interface Motion {
  axes: Axis[];
  from: string;
  containerRef: ContainerRef;
  radius: number;
  falloff: Falloff;
  smoothing: number;
  fromColor: string | undefined;
  toColor: string | undefined;
  scale: number;
  lift: number;
  idleWave: boolean;
  fontSize: number | string | undefined;
  label: string;
  letterCount: number;
  lineStarts: string | null;
}

const OWN_KEYS = [
  'label',
  'fromFontVariationSettings',
  'toFontVariationSettings',
  'containerRef',
  'radius',
  'falloff',
  'smoothing',
  'fromColor',
  'toColor',
  'scale',
  'lift',
  'idleWave',
  'fontSize',
  'className',
  'onClick',
  'style',
  'ref'
] as const;

const DEFAULT_FROM = "'wght' 400, 'opsz' 9";
const DEFAULT_TO = "'wght' 1000, 'opsz' 40";

const GAUSSIAN_EDGE = Math.exp(-2);
const WAVE_PERIOD = 3.2;
const WAVE_PEAK = 0.7;

const parseSettings = (settings: string) =>
  new Map(
    settings
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [name, value] = part.split(/\s+/);
        return [name.replace(/['"]/g, ''), parseFloat(value)] as [string, number];
      })
  );

const strengthAt = (distance: number, radius: number, falloff: Falloff) => {
  if (distance >= radius) return 0;
  const norm = 1 - distance / radius;
  switch (falloff) {
    case 'exponential':
      return norm * norm;
    case 'gaussian':
      return (Math.exp(-2 * (distance / radius) ** 2) - GAUSSIAN_EDGE) / (1 - GAUSSIAN_EDGE);
    case 'linear':
    default:
      return norm;
  }
};

const resolveContainer = (ref: ContainerRef) => {
  if (!ref) return null;
  if (ref instanceof HTMLElement) return ref;
  return ref.current ?? null;
};

export default function VariableProximity(props: VariableProximityProps) {
  const rest = omit(props, ...OWN_KEYS);

  let rootEl: HTMLSpanElement | undefined;
  const letterRefs: (HTMLSpanElement | undefined)[] = [];
  const state: ProximityState = { pointer: { x: 0, y: 0, active: false }, levels: [], targets: [] };
  const [lineStarts, setLineStarts] = createSignal<string | null>(null);

  const label = () => props.label ?? '';
  const from = () => props.fromFontVariationSettings ?? DEFAULT_FROM;
  const to = () => props.toFontVariationSettings ?? DEFAULT_TO;

  const axes = createMemo<Axis[]>(() => {
    const fromSettings = parseSettings(from());
    const toSettings = parseSettings(to());
    return Array.from(fromSettings.entries()).map(([axis, fromValue]) => ({
      axis,
      fromValue,
      toValue: toSettings.get(axis) ?? fromValue
    }));
  });

  const words = createMemo(() => {
    let letterIndex = 0;
    return label()
      .split(' ')
      .map(word => ({
        letters: word.split('').map(char => ({ char, index: letterIndex++ }))
      }));
  });

  const breakSet = createMemo(() => {
    const starts = lineStarts();
    return new Set(starts ? starts.split(',').map(Number) : []);
  });

  const setRoot = (el: HTMLSpanElement) => {
    rootEl = el;
    const ref = props.ref;
    if (typeof ref === 'function') ref(el);
  };

  createEffect(
    () => ({ label: label(), from: from(), fontSize: props.fontSize }),
    layout => {
      const root = rootEl;
      if (!root) return;
      let frame = 0;
      let live = true;
      let lastWidth = -1;

      const measure = () => {
        frame = 0;
        if (!live) return;
        const wordEls = Array.from(root.querySelectorAll<HTMLElement>('[data-word]'));
        const breaks = Array.from(root.querySelectorAll<HTMLElement>('br'));
        const letters = letterRefs.filter((letter): letter is HTMLSpanElement => Boolean(letter));
        const saved = letters.map(letter => letter.style.fontVariationSettings);
        const wrap = root.style.whiteSpace;
        root.style.whiteSpace = 'normal';
        breaks.forEach(node => (node.style.display = 'none'));
        letters.forEach(letter => (letter.style.fontVariationSettings = layout.from));
        const starts: number[] = [];
        let lastTop: number | null = null;
        wordEls.forEach((word, index) => {
          const top = word.getBoundingClientRect().top;
          if (lastTop !== null && top > lastTop + 2) starts.push(index);
          lastTop = top;
        });
        letters.forEach((letter, index) => (letter.style.fontVariationSettings = saved[index]));
        breaks.forEach(node => (node.style.display = ''));
        root.style.whiteSpace = wrap;
        const key = starts.join(',');
        setLineStarts(previous => (previous === key ? previous : key));
      };

      const queue = (entries?: ResizeObserverEntry[]) => {
        const width = entries?.[0]?.contentRect.width;
        if (width !== undefined) {
          if (Math.abs(width - lastWidth) < 1) return;
          lastWidth = width;
        }
        if (!frame) frame = requestAnimationFrame(measure);
      };

      measure();
      const parent = root.parentElement;
      const observer = parent && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(queue) : null;
      if (parent) observer?.observe(parent);
      document.fonts?.ready.then(() => queue());

      return () => {
        live = false;
        cancelAnimationFrame(frame);
        observer?.disconnect();
      };
    }
  );

  createEffect(
    (): Motion => ({
      axes: axes(),
      from: from(),
      containerRef: props.containerRef,
      radius: props.radius ?? 50,
      falloff: props.falloff ?? 'linear',
      smoothing: props.smoothing ?? 0.2,
      fromColor: props.fromColor,
      toColor: props.toColor,
      scale: props.scale ?? 1,
      lift: props.lift ?? 0,
      idleWave: props.idleWave ?? false,
      fontSize: props.fontSize,
      label: label(),
      letterCount: words().reduce((count, word) => count + word.letters.length, 0),
      lineStarts: lineStarts()
    }),
    motion => {
      const { pointer, levels, targets } = state;
      const { axes: axisList, from: fromSettings, radius, falloff, smoothing, fromColor, toColor } = motion;
      letterRefs.length = motion.letterCount;
      const written: string[] = [];
      const painted: string[] = [];
      const moved: string[] = [];
      const anchors: { x: number; y: number }[] = [];
      const tinted = Boolean(fromColor || toColor);
      const restColor = fromColor || 'currentColor';
      const nearColor = toColor || 'currentColor';
      const growth = (Number(motion.scale) || 1) - 1;
      const rise = Number(motion.lift) || 0;
      const transformed = growth !== 0 || rise !== 0;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const waving = motion.idleWave && !reduced;
      let frame = 0;
      let lastTime = 0;
      let dirty = true;
      let layoutDirty = true;
      let nearAny = false;
      let lastNear = -Infinity;
      let waveMix = 0;
      let span = 1;
      let visible = true;

      letterRefs.forEach(letter => {
        if (!letter) return;
        if (!tinted) letter.style.color = '';
        if (!transformed) letter.style.transform = '';
      });

      const settingsAt = (level: number) =>
        axisList
          .map(({ axis, fromValue, toValue }) => `'${axis}' ${fromValue + (toValue - fromValue) * level}`)
          .join(', ');

      const measureAnchors = () => {
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        letterRefs.forEach((letter, index) => {
          if (!letter) return;
          const rect = letter.getBoundingClientRect();
          anchors[index] = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          left = Math.min(left, rect.left);
          top = Math.min(top, rect.top);
          right = Math.max(right, rect.right);
        });
        anchors.forEach(anchor => {
          anchor.x -= left;
          anchor.y -= top;
        });
        span = Math.max(220, (right - left) * 0.85);
      };

      const measure = () => {
        targets.length = letterRefs.length;
        targets.fill(0);
        nearAny = false;
        if (!pointer.active) return;

        const area = resolveContainer(motion.containerRef)?.getBoundingClientRect();
        if (area) {
          const dx = Math.max(area.left - pointer.x, 0, pointer.x - area.right);
          const dy = Math.max(area.top - pointer.y, 0, pointer.y - area.bottom);
          if (dx * dx + dy * dy >= radius * radius) return;
        }

        letterRefs.forEach((letter, index) => {
          if (!letter) return;
          const rect = letter.getBoundingClientRect();
          const distance = Math.hypot(
            pointer.x - (rect.left + rect.width / 2),
            pointer.y - (rect.top + rect.height / 2)
          );
          targets[index] = strengthAt(distance, radius, falloff);
          if (targets[index] > 0) nearAny = true;
        });
      };

      const waveAt = (index: number, time: number) => {
        const anchor = anchors[index];
        if (!anchor) return 0;
        const phase = ((anchor.x + anchor.y * 0.6) / span - time / WAVE_PERIOD) * Math.PI * 2;
        return WAVE_PEAK * ((1 + Math.cos(phase)) / 2) ** 2.2;
      };

      const tick = (now: number) => {
        frame = 0;
        const delta = lastTime ? Math.min(now - lastTime, 64) : 16;
        lastTime = now;

        if (dirty) {
          measure();
          dirty = false;
        }
        if (waving && layoutDirty) {
          measureAnchors();
          layoutDirty = false;
        }

        if (nearAny) lastNear = now;
        const idle = waving && visible && !nearAny && now - lastNear > 500;
        const goal = idle ? 1 : 0;
        waveMix += (goal - waveMix) * (1 - Math.exp(-delta / 600));
        if (Math.abs(goal - waveMix) < 0.002) waveMix = goal;

        const ease = smoothing > 0 ? 1 - Math.exp(-delta / (smoothing * 400)) : 1;
        const time = now / 1000;
        let settling = false;

        letterRefs.forEach((letter, index) => {
          if (!letter) return;
          let target = targets[index] ?? 0;
          if (waveMix > 0) target = Math.max(target, waveMix * waveAt(index, time));
          const current = levels[index] ?? 0;
          let next = current + (target - current) * ease;
          if (Math.abs(target - next) < 0.002) {
            next = target;
          } else {
            settling = true;
          }
          levels[index] = next;

          const settings = next === 0 ? fromSettings : settingsAt(next);
          if (written[index] !== settings) {
            written[index] = settings;
            letter.style.fontVariationSettings = settings;
          }

          if (tinted) {
            const paint =
              next === 0
                ? fromColor || ''
                : `color-mix(in oklab, ${restColor} ${((1 - next) * 100).toFixed(1)}%, ${nearColor})`;
            if (painted[index] !== paint) {
              painted[index] = paint;
              letter.style.color = paint;
            }
          }

          if (transformed) {
            const shift =
              next === 0 ? '' : `translateY(${(-rise * next).toFixed(3)}em) scale(${(1 + growth * next).toFixed(3)})`;
            if (moved[index] !== shift) {
              moved[index] = shift;
              letter.style.transform = shift;
            }
          }
        });

        if (settling || waveMix > 0 || (waving && visible && !nearAny)) {
          frame = requestAnimationFrame(tick);
        } else {
          lastTime = 0;
        }
      };

      const schedule = () => {
        dirty = true;
        if (!frame) frame = requestAnimationFrame(tick);
      };

      const relayout = () => {
        layoutDirty = true;
        schedule();
      };

      const handleMove = (x: number, y: number) => {
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
        schedule();
      };

      const handleMouseMove = (event: MouseEvent) => handleMove(event.clientX, event.clientY);
      const handleTouchMove = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (touch) handleMove(touch.clientX, touch.clientY);
      };
      const handleLeave = () => {
        pointer.active = false;
        schedule();
      };

      const doc = document.documentElement;
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleLeave);
      window.addEventListener('touchcancel', handleLeave);
      window.addEventListener('scroll', schedule, { capture: true, passive: true });
      window.addEventListener('resize', relayout);
      doc.addEventListener('mouseleave', handleLeave);

      let observer: IntersectionObserver | null = null;
      if (waving && rootEl && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver(entries => {
          visible = entries.some(entry => entry.isIntersecting);
          schedule();
        });
        observer.observe(rootEl);
      }
      if (waving) document.fonts?.ready.then(relayout);

      schedule();

      return () => {
        cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleLeave);
        window.removeEventListener('touchcancel', handleLeave);
        window.removeEventListener('scroll', schedule, { capture: true });
        window.removeEventListener('resize', relayout);
        doc.removeEventListener('mouseleave', handleLeave);
      };
    }
  );

  const rootStyle = (): JSX.CSSProperties => {
    const size = props.fontSize;
    return {
      display: 'inline',
      ...(size !== undefined ? { 'font-size': typeof size === 'number' ? `${size}px` : size } : {}),
      ...(lineStarts() !== null ? { 'white-space': 'nowrap' } : {}),
      ...props.style
    };
  };

  return (
    <span
      ref={setRoot}
      class={[props.className ?? '', 'variable-proximity']}
      onClick={() => props.onClick?.()}
      style={rootStyle()}
      {...rest}
    >
      <For each={words()}>
        {(word, wordIndex) => (
          <>
            <Show when={breakSet().has(wordIndex())}>
              <br />
            </Show>
            <span data-word="" style={{ display: 'inline-block', 'white-space': 'nowrap' }}>
              <For each={word.letters}>
                {letter => (
                  <span
                    ref={el => {
                      letterRefs[letter.index] = el;
                    }}
                    style={{
                      display: 'inline-block',
                      'font-variation-settings': from(),
                      color: props.fromColor || undefined,
                      'transform-origin': '50% 80%'
                    }}
                    aria-hidden="true"
                  >
                    {letter.char}
                  </span>
                )}
              </For>
              <Show when={wordIndex() < words().length - 1}>
                <span style={{ display: 'inline-block' }}>&nbsp;</span>
              </Show>
            </span>
          </>
        )}
      </For>
      <span class="sr-only">{label()}</span>
    </span>
  );
}
