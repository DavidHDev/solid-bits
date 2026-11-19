import {
  For,
  Match,
  Show,
  Switch,
  children,
  createEffect,
  createMemo,
  createSignal,
  omit,
  onSettled,
  untrack
} from 'solid-js';
import type { JSX } from '@solidjs/web';
import { ArrowLeft01Icon, ArrowRight01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

import './Stepper.css';

export interface StepProps {
  children?: JSX.Element;
  title?: JSX.Element;
  description?: JSX.Element;
  icon?: JSX.Element;
}

export interface StepIndicatorProps {
  step: number;
  currentStep: number;
  onStepClick: (step: number) => void;
}

type ButtonClick = MouseEvent & { currentTarget: HTMLButtonElement; target: Element };

export type StepperButtonProps = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  className?: string;
  onClick?: (event: ButtonClick) => void;
};

export interface StepperProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style'> {
  children?: JSX.Element;
  step?: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  indicator?: 'numbers' | 'dots' | 'bars';
  orientation?: 'horizontal' | 'vertical';
  transition?: 'slide' | 'fade' | 'none';
  linear?: boolean;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (props: StepIndicatorProps) => JSX.Element;
  showFooter?: boolean;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  backButtonProps?: StepperButtonProps;
  nextButtonProps?: StepperButtonProps;
  completedContent?: JSX.Element;
  theme?: 'dark' | 'light';
  accentColor?: string;
  frame?: boolean;
  radius?: number;
  width?: number | string;
  className?: string;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  style?: JSX.CSSProperties;
}

interface View {
  step: number;
  previous: number | null;
  direction: number;
  id: number;
}

type Status = 'complete' | 'active' | 'upcoming';

type IconNode = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const STEP = Symbol('stepper-step');

interface StepEntry {
  [STEP]: true;
  readonly title?: JSX.Element;
  readonly description?: JSX.Element;
  readonly icon?: JSX.Element;
  render: () => JSX.Element;
}

const THEMES: Record<string, Record<string, string>> = {
  dark: {
    '--stepper-frame': 'rgba(37, 39, 43, 0.66)',
    '--stepper-frame-edge': 'rgba(255, 255, 255, 0.08)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.07)',
    '--stepper-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    '--stepper-tile': 'linear-gradient(180deg, #383b40 0%, #25272b 100%)',
    '--stepper-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--stepper-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--stepper-well': 'rgba(255, 255, 255, 0.07)',
    '--stepper-track': 'rgba(255, 255, 255, 0.1)',
    '--stepper-ink': '#f4f4f5',
    '--stepper-muted': 'rgba(244, 244, 245, 0.55)',
    '--stepper-faint': 'rgba(255, 255, 255, 0.22)',
    '--stepper-ring': 'rgba(244, 244, 245, 0.3)',
    '--stepper-solid': '#f4f4f5',
    '--stepper-solid-ink': '#18181b',
    '--stepper-hover': 'brightness(1.12)',
    '--stepper-hover-fill': 'rgba(255, 255, 255, 0.04)',
    '--stepper-solid-hover': 'brightness(0.9)',
    '--stepper-press': 'brightness(0.85)'
  },
  light: {
    '--stepper-frame': 'rgba(240, 241, 243, 0.8)',
    '--stepper-frame-edge': 'rgba(24, 24, 27, 0.07)',
    '--stepper-frame-highlight': 'rgba(255, 255, 255, 0.95)',
    '--stepper-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
    '--stepper-tile': 'linear-gradient(180deg, #ffffff 0%, #f5f6f7 100%)',
    '--stepper-tile-edge': 'rgba(24, 24, 27, 0.08)',
    '--stepper-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--stepper-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    '--stepper-well': 'rgba(24, 24, 27, 0.05)',
    '--stepper-track': 'rgba(24, 24, 27, 0.08)',
    '--stepper-ink': '#27272a',
    '--stepper-muted': 'rgba(39, 39, 42, 0.55)',
    '--stepper-faint': 'rgba(24, 24, 27, 0.16)',
    '--stepper-ring': 'rgba(24, 24, 27, 0.28)',
    '--stepper-solid': '#27272a',
    '--stepper-solid-ink': '#ffffff',
    '--stepper-hover': 'brightness(0.97)',
    '--stepper-hover-fill': 'rgba(24, 24, 27, 0.035)',
    '--stepper-solid-hover': 'brightness(1.3)',
    '--stepper-press': 'brightness(0.92)'
  }
};

const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const STEPPER_KEYS = [
  'children',
  'step',
  'initialStep',
  'onStepChange',
  'onFinalStepCompleted',
  'indicator',
  'orientation',
  'transition',
  'linear',
  'disableStepIndicators',
  'renderStepIndicator',
  'showFooter',
  'backButtonText',
  'nextButtonText',
  'completeButtonText',
  'backButtonProps',
  'nextButtonProps',
  'completedContent',
  'theme',
  'accentColor',
  'frame',
  'radius',
  'width',
  'className',
  'stepCircleContainerClassName',
  'stepContainerClassName',
  'contentClassName',
  'footerClassName',
  'style'
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const size = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

const readableOn = (color: string) => {
  let hex = String(color || '')
    .trim()
    .replace('#', '');
  if (hex.length === 3) hex = hex.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(index => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#18181b' : '#ffffff';
};

const ease = () =>
  typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)')
    ? SPRING
    : 'cubic-bezier(0.34, 1.4, 0.64, 1)';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const iconMarkup = (icon: IconNode, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = name === 'stroke-width' ? strokeWidth : value;
          return `${name}="${String(next).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

function Icon(props: { icon: IconNode; size: number; strokeWidth: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      aria-hidden="true"
      innerHTML={iconMarkup(props.icon, props.strokeWidth)}
    />
  );
}

function Check() {
  let checkEl: HTMLSpanElement | undefined;

  onSettled(() => {
    const path = checkEl?.querySelector('path');
    if (!path || typeof path.animate !== 'function') return;
    if (reducedMotion()) return;
    path.style.strokeDasharray = '24';
    path.animate([{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], {
      duration: 360,
      easing: SETTLE
    });
  });

  return (
    <span ref={el => (checkEl = el)} class="stepper__check">
      <Icon icon={Tick02Icon} size={16} strokeWidth={2.4} />
    </span>
  );
}

const isStep = (value: unknown): value is StepEntry =>
  typeof value === 'object' && value !== null && STEP in (value as Record<symbol, unknown>);

export function Step(props: StepProps): JSX.Element {
  const entry: StepEntry = {
    [STEP]: true,
    get title() {
      return props.title;
    },
    get description() {
      return props.description;
    },
    get icon() {
      return props.icon;
    },
    render: () => <div class="stepper__step">{props.children}</div>
  };
  return entry as unknown as JSX.Element;
}

export default function Stepper(props: StepperProps) {
  const rest = omit(props, ...STEPPER_KEYS);
  const resolved = children(() => props.children);
  const steps = createMemo(() => resolved.toArray().filter(isStep));
  const total = createMemo(() => steps().length);
  const controlled = () => typeof props.step === 'number';
  const [internal, setInternal] = createSignal(() => props.initialStep ?? 1);
  const current = createMemo(() =>
    clamp(Math.round(typeof props.step === 'number' ? props.step : internal()), 1, total() + 1)
  );
  const completed = createMemo(() => current() > total());
  const vertical = createMemo(() => (props.orientation ?? 'horizontal') === 'vertical');
  const kind = createMemo(() => (vertical() ? 'numbers' : (props.indicator ?? 'numbers')));
  const labelled = createMemo(() => steps().some(entry => entry.title));
  const frame = createMemo(() => props.frame ?? true);

  const [compact, setCompact] = createSignal(false);
  const [tight, setTight] = createSignal(false);
  const rail = createMemo(() => vertical() && !compact());
  const reached = createMemo<number>(prev => Math.max(prev ?? current(), current()));

  const [view, setView] = createSignal<View>(prev => {
    const next = current();
    if (!prev) return { step: next, previous: null, direction: 1, id: 0 };
    if (prev.step === next) return prev;
    return { step: next, previous: prev.step, direction: next > prev.step ? 1 : -1, id: prev.id + 1 };
  });
  const paneIds = createMemo(() => {
    const value = view();
    return value.previous !== null ? [value.id - 1, value.id] : [value.id];
  });

  let rootEl: HTMLDivElement | undefined;
  let trackEl: HTMLDivElement | undefined;
  let gliderEl: HTMLSpanElement | undefined;
  let viewportEl: HTMLDivElement | undefined;
  let viewportHeight = 0;
  let tightNow = false;
  let placed = false;
  let handled = 0;
  const labelWidths: number[] = [];

  const go = (target: number) => {
    const count = total();
    const next = clamp(target, 1, count + 1);
    if (next === current()) return;
    if (!controlled()) setInternal(next);
    if (next > count) props.onFinalStepCompleted?.();
    else props.onStepChange?.(next);
  };

  const reachable = (number: number) =>
    !(props.disableStepIndicators ?? false) &&
    number !== current() &&
    (!(props.linear ?? false) || number <= Math.min(reached(), total()));

  const statusOf = (number: number): Status =>
    completed() || number < current() ? 'complete' : number === current() ? 'active' : 'upcoming';

  createEffect(
    () => ({ vertical: vertical(), labelled: labelled(), frame: frame(), total: total(), kind: kind() }),
    deps => {
      const root = rootEl;
      if (!root) return;
      const measure = () => {
        const folded = deps.vertical && root.clientWidth < 520;
        setCompact(folded);
        const track = deps.kind === 'numbers' ? trackEl : undefined;
        if (!track || !deps.labelled || (deps.vertical && !folded)) {
          tightNow = false;
          setTight(false);
          return;
        }
        const segments = Array.from(track.querySelectorAll<HTMLElement>(':scope > .stepper__segment')).slice(
          0,
          deps.total
        );
        if (!tightNow) {
          segments.forEach((segment, index) => {
            const title = segment.querySelector<HTMLElement>('.stepper__title');
            labelWidths[index] = title ? title.scrollWidth + 8 : 0;
          });
        }
        const badges = segments.reduce(
          (sum, segment) => sum + (segment.firstElementChild?.getBoundingClientRect().width ?? 22) + 20,
          0
        );
        const labels = labelWidths.slice(0, deps.total).reduce((sum, value) => sum + (value || 0), 0);
        const room = track.clientWidth - 8 - 4 * Math.max(0, deps.total - 1);
        tightNow = badges + labels > room + 0.5;
        setTight(tightNow);
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(root);
      return () => observer.disconnect();
    }
  );

  onSettled(() => {
    const viewport = viewportEl;
    if (!viewport) return;
    viewportHeight = viewport.offsetHeight;
    const observer = new ResizeObserver(() => {
      viewportHeight = viewport.offsetHeight;
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  });

  createEffect(
    () => {
      const value = view();
      return {
        id: value.id,
        direction: value.direction,
        transition: props.transition ?? 'slide',
        vertical: vertical()
      };
    },
    run => {
      if (run.id === 0 || run.id === handled) return;
      handled = run.id;
      const id = run.id;
      const viewport = viewportEl;
      const pane = viewport?.querySelector<HTMLDivElement>(`:scope > [data-pane-id="${id}"]`) ?? null;
      const leaving = viewport?.querySelector<HTMLDivElement>(`:scope > [data-pane-id="${id - 1}"]`) ?? null;
      const reduced = reducedMotion();
      const mode = run.transition === 'none' ? 'none' : reduced ? 'fade' : run.transition;
      const finish = () => {
        setView(state => (state.id === id ? { ...state, previous: null } : state));
      };
      if (leaving && pane && leaving.contains(document.activeElement)) pane.focus({ preventScroll: true });
      if (!viewport || typeof viewport.animate !== 'function' || mode === 'none') {
        finish();
        return;
      }
      for (const element of [viewport, pane, leaving])
        element?.getAnimations().forEach(animation => animation.cancel());
      const from = viewportHeight;
      const to = viewport.offsetHeight;
      const spring = ease();
      if (Math.abs(from - to) > 0.5) {
        viewport.animate([{ height: `${from}px` }, { height: `${to}px` }], {
          duration: reduced ? 200 : 560,
          easing: reduced ? SETTLE : spring
        });
      }
      const axis = run.vertical ? 'Y' : 'X';
      const shift = mode === 'slide' ? 36 : 0;
      if (pane) {
        if (shift) {
          pane.animate([{ transform: `translate${axis}(${run.direction * shift}px)` }, { transform: 'none' }], {
            duration: 560,
            easing: spring
          });
        }
        pane.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], {
          duration: 420,
          easing: 'ease-out'
        });
      }
      if (leaving) {
        leaving.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 140,
          easing: 'cubic-bezier(0.2, 0, 0.4, 1)',
          fill: 'forwards'
        });
        const exit = leaving.animate(
          [{ transform: 'none' }, { transform: `translate${axis}(${-run.direction * shift}px)` }],
          { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
        );
        exit.onfinish = finish;
      } else finish();
    }
  );

  createEffect(
    () => ({
      current: current(),
      total: total(),
      completed: completed(),
      kind: kind(),
      labelled: labelled(),
      vertical: vertical(),
      compact: compact(),
      tight: tight()
    }),
    deps => {
      const track = trackEl;
      const glider = gliderEl;
      if (deps.kind !== 'numbers' || !track || !glider) return;
      const place = (animate: boolean) => {
        const segments = track.querySelectorAll<HTMLElement>(':scope > .stepper__segment');
        const segment = segments[Math.min(deps.current, deps.total) - 1];
        if (!segment) return;
        const spring = ease();
        glider.style.transition = animate
          ? `transform 560ms ${spring}, width 560ms ${spring}, height 560ms ${spring}, opacity 200ms ease`
          : 'opacity 200ms ease';
        glider.style.transform = `translate3d(${segment.offsetLeft}px, ${segment.offsetTop}px, 0)`;
        glider.style.width = `${segment.offsetWidth}px`;
        glider.style.height = `${segment.offsetHeight}px`;
        glider.style.opacity = deps.completed ? '0' : '1';
      };
      place(placed && !reducedMotion());
      placed = true;
      const observer = new ResizeObserver(() => place(false));
      observer.observe(track);
      return () => observer.disconnect();
    }
  );

  const paneContent = (number: number) =>
    number > total() ? (props.completedContent ?? null) : (steps()[number - 1]?.render() ?? null);

  const rootStyle = createMemo(
    () =>
      ({
        ...(THEMES[props.theme ?? 'dark'] ?? THEMES.dark),
        '--stepper-radius': `${Math.max(0, props.radius ?? 24)}px`,
        '--stepper-spring': SPRING,
        '--stepper-width': size(props.width ?? 440),
        ...(props.accentColor
          ? { '--stepper-solid': props.accentColor, '--stepper-solid-ink': readableOn(props.accentColor) }
          : {}),
        ...(props.style ?? {})
      }) as JSX.CSSProperties
  );

  const stepLabel = (entry: StepEntry, number: number) =>
    entry.title ? `Step ${number}: ${entry.title}` : `Step ${number}`;

  const badge = (entry: StepEntry, number: () => number, status: () => Status) => (
    <span class="stepper__badge" data-status={status()}>
      <Switch fallback={number()}>
        <Match when={status() === 'complete'}>
          <Check />
        </Match>
        <Match when={entry.icon}>{icon => <span class="stepper__glyph">{icon()}</span>}</Match>
      </Switch>
    </span>
  );

  const segmentText = (entry: StepEntry, status: () => Status) => (
    <Show when={entry.title && !(tight() && !rail())}>
      <span class="stepper__text">
        <span class="stepper__title" data-status={status()}>
          {entry.title}
        </span>
        <Show when={rail() && entry.description}>
          <span class="stepper__description">{entry.description}</span>
        </Show>
      </span>
    </Show>
  );

  const header = () => (
    <Switch>
      <Match when={kind() === 'dots'}>
        <div class="stepper__dots">
          <For each={steps()}>
            {(entry, index) => {
              const number = () => index() + 1;
              const status = () => statusOf(number());
              return (
                <button
                  type="button"
                  class="stepper__dot"
                  data-status={status()}
                  aria-label={stepLabel(entry, number())}
                  aria-current={number() === current() ? 'step' : undefined}
                  disabled={!reachable(number())}
                  onClick={() => go(number())}
                >
                  <span class="stepper__dot-mark" data-status={status()} />
                </button>
              );
            }}
          </For>
        </div>
      </Match>
      <Match when={kind() === 'bars'}>
        <div class="stepper__bars">
          <For each={steps()}>
            {(entry, index) => {
              const number = () => index() + 1;
              return (
                <button
                  type="button"
                  class="stepper__bar"
                  data-status={statusOf(number())}
                  aria-label={stepLabel(entry, number())}
                  aria-current={number() === current() ? 'step' : undefined}
                  disabled={!reachable(number())}
                  onClick={() => go(number())}
                >
                  <span class="stepper__bar-track">
                    <span
                      class="stepper__bar-fill"
                      data-filled={completed() || number() <= current() ? '' : undefined}
                    />
                  </span>
                </button>
              );
            }}
          </For>
        </div>
      </Match>
      <Match when={kind() === 'numbers'}>
        <div ref={el => (trackEl = el)} class="stepper__track" data-layout={rail() ? 'rail' : 'row'}>
          <span ref={el => (gliderEl = el)} class="stepper__glider" aria-hidden="true" />
          <For each={steps()}>
            {(entry, index) => {
              const number = () => index() + 1;
              const status = () => statusOf(number());
              return (
                <Show
                  when={props.renderStepIndicator}
                  fallback={
                    <button
                      type="button"
                      class="stepper__segment"
                      data-status={status()}
                      aria-label={
                        typeof entry.title === 'string' ? `Step ${number()}: ${entry.title}` : `Step ${number()}`
                      }
                      aria-current={number() === current() ? 'step' : undefined}
                      disabled={!reachable(number())}
                      onClick={() => go(number())}
                    >
                      {badge(entry, number, status)}
                      {segmentText(entry, status)}
                    </button>
                  }
                >
                  {render => (
                    <div class="stepper__segment" data-status={status()}>
                      {render()({ step: number(), currentStep: current(), onStepClick: clicked => go(clicked) })}
                      {segmentText(entry, status)}
                    </div>
                  )}
                </Show>
              );
            }}
          </For>
        </div>
      </Match>
    </Switch>
  );

  const isLast = () => current() === total();
  const back = createMemo(() => {
    const { className = '', onClick, ...others } = props.backButtonProps ?? {};
    return { className, onClick, others };
  });
  const next = createMemo(() => {
    const { className = '', onClick, ...others } = props.nextButtonProps ?? {};
    return { className, onClick, others };
  });

  return (
    <div
      {...rest}
      ref={el => (rootEl = el)}
      class={[
        'stepper',
        `stepper--${rail() ? 'vertical' : 'horizontal'}`,
        { 'stepper--framed': frame() },
        props.stepCircleContainerClassName,
        props.className
      ]}
      data-completed={completed() ? '' : undefined}
      style={rootStyle()}
    >
      <div class={['stepper__header', `stepper__header--${kind()}`, props.stepContainerClassName]}>{header()}</div>
      <div class="stepper__body">
        <div ref={el => (viewportEl = el)} class={['stepper__viewport', props.contentClassName]} aria-live="polite">
          <For each={paneIds()}>
            {id => {
              const number = untrack(() => view().step);
              return (
                <div
                  data-pane-id={id}
                  class={['stepper__pane', { 'stepper__pane--leaving': id !== view().id }]}
                  aria-hidden={id !== view().id ? 'true' : undefined}
                  tabindex={id === view().id ? -1 : undefined}
                >
                  {paneContent(number)}
                </div>
              );
            }}
          </For>
        </div>
        <Show when={props.showFooter ?? true}>
          <div
            class="stepper__footer-wrap"
            data-hidden={completed() ? '' : undefined}
            aria-hidden={completed() ? 'true' : undefined}
          >
            <div class="stepper__footer-clip">
              <div class={['stepper__footer', props.footerClassName]}>
                <button
                  type="button"
                  {...back().others}
                  class={['stepper__button', 'stepper__button--back', back().className]}
                  data-hidden={current() <= 1 ? '' : undefined}
                  tabindex={completed() ? -1 : back().others.tabindex}
                  onClick={event => {
                    back().onClick?.(event);
                    if (!event.defaultPrevented) go(current() - 1);
                  }}
                >
                  <Icon icon={ArrowLeft01Icon} size={16} strokeWidth={2} />
                  <span>{props.backButtonText ?? 'Back'}</span>
                </button>
                <button
                  type="button"
                  {...next().others}
                  class={['stepper__button', 'stepper__button--next', next().className]}
                  tabindex={completed() ? -1 : next().others.tabindex}
                  onClick={event => {
                    next().onClick?.(event);
                    if (!event.defaultPrevented) go(current() + 1);
                  }}
                >
                  <span>
                    {isLast() ? (props.completeButtonText ?? 'Complete') : (props.nextButtonText ?? 'Continue')}
                  </span>
                  <Icon icon={isLast() ? Tick02Icon : ArrowRight01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </Show>
      </div>
      <Show when={frame()}>
        <span class="stepper__rim" aria-hidden="true" />
      </Show>
    </div>
  );
}
