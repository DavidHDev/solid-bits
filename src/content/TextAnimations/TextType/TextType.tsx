import { For, Show, createEffect, createMemo, createSignal, omit, onSettled } from 'solid-js';
import { Dynamic, type JSX } from '@solidjs/web';
import { gsap } from 'gsap';
import './TextType.css';

export interface TextTypeProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'style'> {
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorStyle?: 'character' | 'bar' | 'block' | 'underscore';
  cursorCharacter?: string | JSX.Element;
  cursorColor?: string;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  cursorGlide?: boolean;
  text: string | string[];
  as?: string;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  deleteMode?: 'backspace' | 'select';
  typeEffect?: 'none' | 'fade' | 'blur' | 'rise';
  mistakes?: number;
  prefix?: string;
  prefixColor?: string;
  loop?: boolean;
  textColors?: string[];
  variableSpeed?: { min: number; max: number };
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reverseMode?: boolean;
  style?: JSX.CSSProperties;
}

type Effect = { keyframes: Keyframe[]; options: KeyframeAnimationOptions };
type Typo = { plan: string[]; tail: string[]; fixing: boolean };

const OWN_KEYS = [
  'className',
  'showCursor',
  'hideCursorWhileTyping',
  'cursorStyle',
  'cursorCharacter',
  'cursorColor',
  'cursorBlinkDuration',
  'cursorClassName',
  'cursorGlide',
  'text',
  'as',
  'typingSpeed',
  'initialDelay',
  'pauseDuration',
  'deletingSpeed',
  'deleteMode',
  'typeEffect',
  'mistakes',
  'prefix',
  'prefixColor',
  'loop',
  'textColors',
  'variableSpeed',
  'onSentenceComplete',
  'startOnVisible',
  'reverseMode'
] as const;

const NEIGHBORS: Record<string, string> = {
  a: 'qwsz',
  b: 'vghn',
  c: 'xdfv',
  d: 'serfcx',
  e: 'wsdr',
  f: 'drtgvc',
  g: 'ftyhbv',
  h: 'gyujnb',
  i: 'ujko',
  j: 'huikmn',
  k: 'jiolm',
  l: 'kop',
  m: 'njk',
  n: 'bhjm',
  o: 'iklp',
  p: 'ol',
  q: 'wa',
  r: 'edft',
  s: 'awedxz',
  t: 'rfgy',
  u: 'yhji',
  v: 'cfgb',
  w: 'qase',
  x: 'zsdc',
  y: 'tghu',
  z: 'asx',
  0: '9p',
  1: '2q',
  2: '13w',
  3: '24e',
  4: '35r',
  5: '46t',
  6: '57y',
  7: '68u',
  8: '79i',
  9: '80o'
};

const EFFECTS: Record<'fade' | 'blur' | 'rise', Effect> = {
  fade: {
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
    options: { duration: 360, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
  },
  blur: {
    keyframes: [
      { opacity: 0, filter: 'blur(0.3em)' },
      { opacity: 1, filter: 'blur(0em)' }
    ],
    options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  },
  rise: {
    keyframes: [
      { opacity: 0, top: '0.6em' },
      { opacity: 1, top: '0em' }
    ],
    options: { duration: 480, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' }
  }
};

const graphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), part => part.segment);
  }
  return Array.from(value);
};

const typoFor = (char: string): string | null => {
  const keys = NEIGHBORS[char.toLowerCase()];
  if (!keys) return null;
  const pick = keys[Math.floor(Math.random() * keys.length)];
  return char === char.toLowerCase() ? pick : pick.toUpperCase();
};

export default function TextType(props: TextTypeProps) {
  const rest = omit(props, ...OWN_KEYS);

  const [textIndex, setTextIndex] = createSignal(0);
  const [count, setCount] = createSignal(0);
  const [selected, setSelected] = createSignal(0);
  const [typo, setTypo] = createSignal<Typo | null>(null);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(() => !props.startOnVisible);
  const [reduceMotion, setReduceMotion] = createSignal(false);

  let containerEl: HTMLElement | undefined;
  let caretEl: HTMLSpanElement | undefined;
  let cursorEl: HTMLSpanElement | undefined;
  let blinkEl: HTMLSpanElement | undefined;
  let blinkTimeline: gsap.core.Timeline | null = null;
  let blinkResume: gsap.core.Tween | null = null;
  let caretPosition: { x: number; y: number } | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let lastTypo = -1;
  let lastShowCursor: boolean | null = null;
  let effectNow: Effect | undefined;
  let reduceNow = false;
  const place = { glide: true, glideTime: 0.08, reduce: false };

  const textKey = createMemo(() => (Array.isArray(props.text) ? props.text.join('\u0000') : String(props.text ?? '')));
  const textArray = createMemo(() => textKey().split('\u0000'));
  const index = createMemo(() => textIndex() % textArray().length);
  const chars = createMemo(() => graphemes(textArray()[index()]));
  const total = createMemo(() => chars().length);
  const shown = createMemo(() => Math.min(count(), total()));
  const typingSpeed = createMemo(() => props.typingSpeed ?? 50);
  const minSpeed = createMemo(() => props.variableSpeed?.min ?? typingSpeed());
  const maxSpeed = createMemo(() => props.variableSpeed?.max ?? typingSpeed());
  const glideTime = createMemo(() => {
    const pace = (minSpeed() + maxSpeed()) / 2;
    return Math.min(0.18, Math.max(0.06, pace * 0.0016));
  });
  const showCursor = createMemo(() => props.showCursor ?? true);
  const reverseMode = createMemo(() => props.reverseMode ?? false);
  const cursorBlinkDuration = createMemo(() => props.cursorBlinkDuration ?? 0.5);

  const placeCursor = (instant: boolean) => {
    const caret = caretEl;
    const cursor = cursorEl;
    if (!caret || !cursor) return;

    const x = caret.offsetLeft;
    const y = caret.offsetTop;
    const last = caretPosition;
    if (last && Math.abs(last.x - x) < 0.5 && Math.abs(last.y - y) < 0.5) return;
    caretPosition = { x, y };

    if (instant || !last || !place.glide || place.reduce || Math.abs(last.y - y) > 1) {
      gsap.killTweensOf(cursor);
      gsap.set(cursor, { x, y });
    } else {
      gsap.to(cursor, { x, y, duration: place.glideTime, ease: 'power3.out', overwrite: true });
    }

    const timeline = blinkTimeline;
    const blink = blinkEl;
    if (instant || !timeline || !blink) return;
    timeline.pause();
    blinkResume?.kill();
    gsap.to(blink, { opacity: 1, duration: 0.12, ease: 'power1.out' });
    blinkResume = gsap.delayedCall(0.12, () => timeline.restart());
  };

  const animateChar = (node: HTMLSpanElement) => {
    const effect = effectNow;
    if (!effect || reduceNow || typeof node.animate !== 'function') return;
    const play = () => {
      if (node.isConnected) node.animate(effect.keyframes, effect.options);
    };
    queueMicrotask(() => (node.isConnected ? play() : requestAnimationFrame(play)));
  };

  const observeContainer = (el: HTMLElement) => {
    containerEl = el;
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver.observe(el);
    }
  };

  createEffect(
    () => {
      const effect = props.typeEffect ?? 'none';
      return { effect: effect === 'none' ? undefined : EFFECTS[effect], reduce: reduceMotion() };
    },
    value => {
      effectNow = value.effect;
      reduceNow = value.reduce;
    }
  );

  createEffect(
    () => props.startOnVisible ?? false,
    startOnVisible => {
      const node = containerEl;
      if (!startOnVisible || !node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setIsVisible(true);
          observer.disconnect();
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    }
  );

  createEffect(
    () => ({ show: showCursor(), duration: cursorBlinkDuration(), reduce: reduceMotion() }),
    ({ show, duration, reduce }) => {
      const blink = blinkEl;
      if (!show || !blink) return;
      gsap.set(blink, { opacity: 1 });
      if (reduce || duration <= 0) return;

      const hold = duration * 0.7;
      const fade = duration * 0.45;
      const timeline = gsap.timeline({ repeat: -1 });
      timeline
        .to(blink, { opacity: 0, duration: fade, ease: 'sine.inOut' }, hold)
        .to(blink, { opacity: 1, duration: fade, ease: 'sine.inOut' }, hold + fade + duration * 0.4);
      blinkTimeline = timeline;

      return () => {
        timeline.kill();
        blinkResume?.kill();
        gsap.killTweensOf(blink);
        blinkTimeline = null;
      };
    }
  );

  createEffect(
    () => ({
      show: showCursor(),
      glide: props.cursorGlide ?? true,
      glideTime: glideTime(),
      reduce: reduceMotion(),
      shown: shown(),
      selected: selected(),
      typo: typo(),
      index: index(),
      chars: chars(),
      deleting: isDeleting(),
      prefix: props.prefix ?? '',
      style: props.cursorStyle ?? 'character',
      character: props.cursorCharacter,
      reverse: reverseMode(),
      className: props.className
    }),
    value => {
      place.glide = value.glide;
      place.glideTime = value.glideTime;
      place.reduce = value.reduce;
      if (lastShowCursor !== value.show) {
        caretPosition = null;
        lastShowCursor = value.show;
      }
      placeCursor(false);
    }
  );

  createEffect(
    () => ({
      isVisible: isVisible(),
      isDeleting: isDeleting(),
      shown: shown(),
      total: total(),
      chars: chars(),
      selected: selected(),
      typo: typo(),
      index: index(),
      textArray: textArray(),
      loop: props.loop ?? true,
      deletingSpeed: props.deletingSpeed ?? 30,
      deleteMode: props.deleteMode ?? 'backspace',
      pauseDuration: props.pauseDuration ?? 2000,
      initialDelay: props.initialDelay ?? 0,
      minSpeed: minSpeed(),
      maxSpeed: maxSpeed(),
      mistakes: props.mistakes ?? 0,
      reverseMode: reverseMode(),
      reduceMotion: reduceMotion()
    }),
    s => {
      if (!s.isVisible) return;

      let timeout: ReturnType<typeof setTimeout> | undefined;
      let cancelled = false;
      const wait = (ms: number, next: () => void) => {
        timeout = setTimeout(next, ms);
      };
      const speed = () => s.minSpeed + Math.random() * (s.maxSpeed - s.minSpeed);
      const typo = s.typo;

      if (!s.isDeleting) {
        if (typo) {
          if (s.reduceMotion) {
            wait(0, () => setTypo(null));
          } else if (!typo.fixing) {
            if (typo.tail.length < typo.plan.length) {
              wait(speed(), () => setTypo({ ...typo, tail: typo.plan.slice(0, typo.tail.length + 1) }));
            } else {
              wait(260 + Math.random() * 320, () => setTypo({ ...typo, fixing: true }));
            }
          } else if (typo.tail.length) {
            wait(Math.max(45, s.deletingSpeed), () => setTypo({ ...typo, tail: typo.tail.slice(0, -1) }));
          } else {
            wait(90 + Math.random() * 140, () => setTypo(null));
          }
        } else if (s.shown < s.total) {
          const lead = s.shown === 0 ? s.initialDelay : 0;
          const next = s.reverseMode ? s.total - s.shown - 1 : s.shown;
          const wrong = s.mistakes > 0 && s.shown > 0 && lastTypo !== next ? typoFor(s.chars[next]) : null;

          if (s.reduceMotion) {
            wait(lead, () => setCount(s.total));
          } else if (wrong && Math.random() < Math.min(1, s.mistakes) * 0.16) {
            lastTypo = next;
            const plan = [wrong];
            const follow = s.chars[s.reverseMode ? next - 1 : next + 1];
            if (follow && follow.trim() && Math.random() < 0.4) plan.push(follow);
            wait(lead + speed(), () => setTypo({ plan, tail: [wrong], fixing: false }));
          } else {
            wait(lead + speed(), () => setCount(s.shown + 1));
          }
        } else if (s.loop || s.index < s.textArray.length - 1) {
          wait(s.pauseDuration, () => setIsDeleting(true));
        }
      } else if (s.shown > 0) {
        if (s.reduceMotion) {
          wait(0, () => setCount(0));
        } else if (s.deleteMode === 'select') {
          if (s.selected < s.shown) {
            wait(s.deletingSpeed, () => setSelected(s.selected + 1));
          } else {
            wait(Math.max(160, s.deletingSpeed * 8), () => {
              setSelected(0);
              setCount(0);
            });
          }
        } else {
          wait(s.deletingSpeed, () => setCount(s.shown - 1));
        }
      } else {
        queueMicrotask(() => {
          if (cancelled) return;
          props.onSentenceComplete?.(s.textArray[s.index], s.index);
          lastTypo = -1;
          setSelected(0);
          setIsDeleting(false);
          setTextIndex((s.index + 1) % s.textArray.length);
        });
      }

      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }
  );

  onSettled(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => placeCursor(true));
      if (containerEl) resizeObserver.observe(containerEl);
    }

    return () => {
      query.removeEventListener('change', update);
      resizeObserver?.disconnect();
      resizeObserver = null;
      blinkTimeline?.kill();
      blinkTimeline = null;
      blinkResume?.kill();
      blinkResume = null;
      if (cursorEl) gsap.killTweensOf(cursorEl);
      if (blinkEl) gsap.killTweensOf(blinkEl);
    };
  });

  const start = createMemo(() => (reverseMode() ? total() - shown() : 0));
  const marked = createMemo(() => Math.min(selected(), shown()));
  const correctIndices = createMemo(() => {
    const from = start();
    return Array.from({ length: shown() }, (_, i) => from + i);
  });
  const typoIndices = createMemo(() => {
    const list = (typo()?.tail ?? []).map((_, i) => i);
    if (reverseMode()) list.reverse();
    return list;
  });

  const isMarked = (absolute: number) => {
    const i = absolute - start();
    return reverseMode() ? i < marked() : i >= shown() - marked();
  };

  const color = createMemo(() => {
    const colors = props.textColors ?? [];
    return colors.length ? colors[index() % colors.length] : 'inherit';
  });
  const typing = createMemo(() => shown() < total() || isDeleting() || typo() !== null);
  const hideCursor = createMemo(() => (props.hideCursorWhileTyping ?? false) && typing());
  const cursorStyleValue = createMemo(() => props.cursorStyle ?? 'character');
  const customCursorColor = createMemo<JSX.CSSProperties | undefined>(() => {
    const value = props.cursorColor ?? 'currentColor';
    return value && value !== 'currentColor' ? { color: value } : undefined;
  });

  const caret = () => (
    <span ref={el => (caretEl = el)} class="text-type__caret">
      {'​'}
    </span>
  );

  const correct = () => (
    <For each={correctIndices()}>
      {absolute => (
        <span
          ref={el => animateChar(el)}
          class={['text-type__char', { 'text-type__char--selected': isMarked(absolute) }]}
        >
          {chars()[absolute]}
        </span>
      )}
    </For>
  );

  const mistyped = () => (
    <For each={typoIndices()}>
      {i => (
        <span ref={el => animateChar(el)} class="text-type__char">
          {typo()?.tail[i]}
        </span>
      )}
    </For>
  );

  return (
    <Dynamic
      component={props.as ?? 'div'}
      {...rest}
      ref={(el: HTMLElement) => observeContainer(el)}
      class={['text-type', props.className]}
      style={props.style}
    >
      <span class="text-type__sr">{(props.prefix ?? '') + textArray().join(' ')}</span>
      <span class="text-type__content" aria-hidden="true">
        <Show when={props.prefix}>
          <span class="text-type__prefix" style={{ color: props.prefixColor ?? 'currentColor' }}>
            {props.prefix}
          </span>
        </Show>
        <Show when={reverseMode()}>{caret()}</Show>
        <span style={{ color: color() }}>
          <Show
            when={reverseMode()}
            fallback={
              <>
                {correct()}
                {mistyped()}
              </>
            }
          >
            {mistyped()}
            {correct()}
          </Show>
        </span>
        <Show when={!reverseMode()}>{caret()}</Show>
      </span>
      <Show when={showCursor()}>
        <span
          ref={el => (cursorEl = el)}
          aria-hidden="true"
          class={[
            'text-type__cursor',
            `text-type__cursor--${cursorStyleValue()}`,
            { 'text-type__cursor--hidden': hideCursor() },
            props.cursorClassName
          ]}
          style={customCursorColor()}
        >
          <span ref={el => (blinkEl = el)} class="text-type__blink">
            <Show when={cursorStyleValue() === 'character'} fallback={<span class="text-type__shape" />}>
              {props.cursorCharacter ?? '|'}
            </Show>
          </span>
        </span>
      </Show>
    </Dynamic>
  );
}
