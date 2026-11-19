import { For, Match, Show, Switch, createEffect, createMemo, createSignal, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate } from 'motion';
import { ArrowDown01Icon, SparklesIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import './ThoughtLine.css';

export type ThoughtLineGlyph = 'sparkle' | 'dot' | 'none' | JSX.Element;

export interface ThoughtLineProps {
  label?: string;
  doneLabel?: string;
  renderLabel?: (text: string, working: boolean) => JSX.Element;
  glyph?: ThoughtLineGlyph;
  steps?: string[];
  collapsible?: boolean;
  collapseOnSettle?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  breathPeriod?: number;
  breathDepth?: number;
  shimmer?: boolean;
  shimmerDuration?: number;
  settleDuration?: number;
  settleBlur?: number;
  working?: boolean;
  settleAfter?: number;
  elapsed?: number;
  showTimer?: boolean;
  onSettle?: (seconds: number) => void;
  className?: string;
  style?: JSX.CSSProperties;
}

type IconSvgElement = readonly (readonly [string, { readonly [key: string]: string | number }])[];
type Playback = { stop: () => void };

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const GLYPH_DONE = 0.55;
const EMPTY_STEPS: string[] = [];

const fmt = (ds: number) =>
  ds < 600 ? `${(ds / 10).toFixed(1)}s` : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;
const spoken = (ds: number) =>
  ds < 600
    ? `${(ds / 10).toFixed(1)} seconds`
    : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;

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

function Icon(props: { icon: IconSvgElement; size: number | string; strokeWidth: number }) {
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

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export default function ThoughtLine(props: ThoughtLineProps) {
  let glyphEl: HTMLSpanElement | undefined;
  let breathEl: HTMLSpanElement | undefined;
  let timerEl: HTMLSpanElement | undefined;
  let stackEl: HTMLSpanElement | undefined;
  let workEl: HTMLSpanElement | undefined;
  let doneEl: HTMLSpanElement | undefined;
  let srEl: HTMLSpanElement | undefined;
  let ds = 0;
  let announce = '';
  let prevWorking: boolean | null = null;

  const [reduce, setReduce] = createSignal(reducedMotion());

  const label = createMemo(() => props.label ?? 'Thinking…');
  const glyph = createMemo(() => (props.glyph === undefined ? 'sparkle' : props.glyph));
  const steps = createMemo(() => props.steps ?? EMPTY_STEPS);
  const collapsible = createMemo(() => props.collapsible ?? true);
  const collapseOnSettle = createMemo(() => props.collapseOnSettle ?? true);
  const color = createMemo(() => props.color ?? 'currentColor');
  const fontSize = createMemo(() => props.fontSize ?? 16);
  const breathPeriod = createMemo(() => props.breathPeriod ?? 1.6);
  const breathDepth = createMemo(() => props.breathDepth ?? 0.45);
  const shimmer = createMemo(() => props.shimmer ?? true);
  const settleDuration = createMemo(() => props.settleDuration ?? 350);
  const working = createMemo(() => props.working ?? true);
  const settleAfter = createMemo(() => props.settleAfter ?? 0);
  const showTimer = createMemo(() => props.showTimer ?? true);

  const [autoSettled, setAutoSettled] = createSignal<boolean>(() => {
    working();
    return false;
  });
  const isWorking = createMemo(() => working() && !autoSettled());
  const [open, setOpen] = createSignal<boolean>(prev => {
    const w = isWorking();
    const collapse = collapseOnSettle();
    if (w) return true;
    if (collapse) return false;
    return prev ?? true;
  });

  const doneText = createMemo(() => props.doneLabel || (showTimer() ? 'Thought for' : 'Done thinking'));
  const hasTrace = createMemo(() => steps().length > 0);
  const depth = createMemo(() => (reduce() ? Math.min(breathDepth(), 0.2) : breathDepth()));
  const period = createMemo(() => (reduce() ? breathPeriod() * 1.5 : breathPeriod()));
  const trough = createMemo(() => 1 - depth());
  const sheen = createMemo(() => shimmer() && !reduce());
  const toggle = createMemo(() => hasTrace() && collapsible());

  createEffect(
    () => ({
      working: isWorking(),
      period: period(),
      depth: depth(),
      trough: trough(),
      settle: settleDuration(),
      glyph: glyph(),
      sheen: sheen(),
      collapsible: collapsible()
    }),
    v => {
      const glyphNode = v.glyph !== 'none' && glyphEl?.isConnected ? glyphEl : undefined;
      const breathNode = breathEl?.isConnected ? breathEl : undefined;
      if (!breathNode) return undefined;
      const s = v.settle / 1000;
      const loop = (el: HTMLElement, delay: number) =>
        animate(
          el,
          { opacity: [v.trough, 1, v.trough] },
          { duration: v.period, ease: EASE_IN_OUT, repeat: Infinity, delay }
        );
      let cancelled = false;
      const running: Playback[] = [];
      if (v.working) {
        if (v.depth > 0) {
          if (v.sheen) running.push(animate(breathNode, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
          if (glyphNode) {
            const lead = animate(glyphNode, { opacity: v.trough }, { duration: 0.2, ease: EASE_OUT });
            running.push(lead);
            lead.then(() => {
              if (cancelled) return;
              running.push(loop(glyphNode, 0));
              if (!v.sheen) running.push(loop(breathNode, 0.14));
            });
          } else if (!v.sheen) {
            running.push(loop(breathNode, 0.14));
          }
        } else {
          if (glyphNode) running.push(animate(glyphNode, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
          running.push(animate(breathNode, { opacity: 1 }, { duration: 0.2, ease: EASE_OUT }));
        }
      } else {
        if (glyphNode) running.push(animate(glyphNode, { opacity: GLYPH_DONE }, { duration: s, ease: EASE_OUT }));
        running.push(animate(breathNode, { opacity: 1 }, { duration: s, ease: EASE_OUT }));
      }
      return () => {
        cancelled = true;
        running.forEach(a => a.stop());
      };
    }
  );

  const paint = (value: number) => {
    ds = value;
    if (timerEl?.isConnected) timerEl.textContent = fmt(value);
  };

  createEffect(
    () => ({ working: isWorking(), elapsed: props.elapsed, settleAfter: settleAfter() }),
    v => {
      if (v.elapsed != null) {
        paint(Math.round(v.elapsed * 10));
        return undefined;
      }
      if (!v.working) return undefined;
      const startedAt = performance.now();
      paint(0);
      const id = setInterval(() => {
        const value = Math.floor((performance.now() - startedAt) / 100);
        paint(value);
        if (v.settleAfter > 0 && value >= Math.round(v.settleAfter * 10)) setAutoSettled(true);
      }, 100);
      return () => clearInterval(id);
    }
  );

  createEffect(
    () => ({
      working: isWorking(),
      label: label(),
      doneText: doneText(),
      fontSize: fontSize(),
      showTimer: showTimer(),
      collapsible: collapsible(),
      glyph: glyph()
    }),
    v => {
      const t = timerEl?.isConnected ? timerEl : undefined;
      const stack = stackEl;
      if (!t || !stack) return undefined;
      const place = (glide: boolean) => {
        const active = v.working ? workEl : doneEl;
        if (!active) return;
        const shift = active.offsetWidth - stack.offsetWidth;
        if (!glide) t.style.transition = 'none';
        t.style.transform = `translateX(${shift}px)`;
        if (!glide) {
          void t.offsetWidth;
          t.style.transition = '';
        }
      };
      place(prevWorking !== null && prevWorking !== v.working);
      prevWorking = v.working;
      const ro = new ResizeObserver(() => place(false));
      if (workEl) ro.observe(workEl);
      if (doneEl) ro.observe(doneEl);
      return () => ro.disconnect();
    }
  );

  createEffect(isWorking, w => {
    const latest = untrack(() => ({
      label: label(),
      doneText: doneText(),
      showTimer: showTimer(),
      onSettle: props.onSettle
    }));
    if (w) {
      announce = latest.label;
      if (srEl) srEl.textContent = announce;
      return;
    }
    announce = latest.showTimer ? `${latest.doneText} ${spoken(ds)}` : latest.doneText;
    if (srEl) srEl.textContent = announce;
    latest.onSettle?.(ds / 10);
  });

  onSettled(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduce(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });

  const head = () => (
    <>
      <Show when={glyph() !== 'none'}>
        <span ref={el => (glyphEl = el)} class="thought-line__glyph" aria-hidden="true">
          <Switch fallback={glyph() as JSX.Element}>
            <Match when={glyph() === 'sparkle'}>
              <Icon icon={SparklesIcon} size="100%" strokeWidth={2} />
            </Match>
            <Match when={glyph() === 'dot'}>
              <span class="thought-line__dot" />
            </Match>
          </Switch>
        </span>
      </Show>
      <span ref={el => (stackEl = el)} class="thought-line__label" aria-hidden="true">
        <span ref={el => (workEl = el)} class="thought-line__text" data-active={isWorking() ? '' : undefined}>
          <span ref={el => (breathEl = el)} class="thought-line__breath" data-shimmer={sheen() ? '' : undefined}>
            {props.renderLabel ? props.renderLabel(label(), true) : label()}
          </span>
        </span>
        <span
          ref={el => (doneEl = el)}
          class="thought-line__text thought-line__text--done"
          data-active={isWorking() ? undefined : ''}
        >
          {props.renderLabel ? props.renderLabel(doneText(), false) : doneText()}
        </span>
      </span>
      <Show when={showTimer()}>
        <span
          ref={el => {
            timerEl = el;
            el.textContent = fmt(ds);
          }}
          class="thought-line__timer"
          data-done={isWorking() ? undefined : ''}
          aria-hidden="true"
        >
          0.0s
        </span>
      </Show>
      <Show when={collapsible()}>
        <span class="thought-line__chevron" data-on={hasTrace() ? '' : undefined} aria-hidden="true">
          <Icon icon={ArrowDown01Icon} size="1em" strokeWidth={2.2} />
        </span>
      </Show>
      <span
        ref={el => {
          srEl = el;
          el.textContent = announce;
        }}
        class="thought-line__sr"
        role="status"
      />
    </>
  );

  return (
    <div
      class={['thought-line', props.className]}
      data-working={isWorking() ? '' : undefined}
      data-open={open() && hasTrace() ? '' : undefined}
      style={{
        '--tl-font': `${fontSize()}px`,
        '--tl-color': color(),
        '--tl-glyph': props.glyphColor || color(),
        '--tl-settle': `${settleDuration()}ms`,
        '--tl-blur': `${props.settleBlur ?? 2}px`,
        '--tl-shimmer': `${props.shimmerDuration ?? 1.8}s`,
        ...props.style
      }}
    >
      <Show when={collapsible()} fallback={<div class="thought-line__head">{head()}</div>}>
        <button
          type="button"
          class="thought-line__head"
          data-toggle={toggle() ? '' : undefined}
          aria-expanded={toggle() ? (open() ? 'true' : 'false') : undefined}
          tabindex={toggle() ? 0 : -1}
          onClick={() => {
            if (toggle()) setOpen(v => !v);
          }}
        >
          {head()}
        </button>
      </Show>
      <Show when={hasTrace()}>
        <div class="thought-line__trace" data-open={open() ? '' : undefined} aria-hidden={open() ? 'false' : 'true'}>
          <div class="thought-line__fold">
            <div class="thought-line__steps">
              <For each={steps()}>
                {(text, i) => {
                  const done = () => !isWorking() || i() < steps().length - 1;
                  return (
                    <div class="thought-line__step" data-done={done() ? '' : undefined}>
                      <span class="thought-line__mark" aria-hidden="true">
                        <Show when={done()} fallback={<i class="thought-line__pulse" />}>
                          <Icon icon={Tick02Icon} size="1em" strokeWidth={2.5} />
                        </Show>
                      </span>
                      <span class="thought-line__step-text">{text}</span>
                    </div>
                  );
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
