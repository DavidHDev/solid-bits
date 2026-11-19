import { createEffect, createMemo, omit, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';

type AnimateOn = 'view' | 'hover' | 'inViewHover' | 'click';
type RevealDirection = 'start' | 'end' | 'center' | 'random';
type Effect = 'scramble' | 'flip' | 'fade';

export interface DecryptedTextProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'style'> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: RevealDirection;
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: AnimateOn;
  clickMode?: 'once' | 'toggle';
  effect?: Effect;
  scrambleColor?: string;
  loop?: boolean;
  loopDelay?: number;
  hoverRadius?: number;
  style?: JSX.CSSProperties;
}

interface Frame {
  shown: string[];
  revealed: boolean[];
  tint: number[];
  dim: number[];
  squeeze: number[];
}

interface FontMetrics {
  font: string;
  spacing: number;
}

interface Run {
  forward: boolean;
  cycle: boolean;
  iteration: number;
  queue: (number | null)[];
}

interface RunOptions {
  from?: boolean[];
  cycle?: boolean;
  lead?: number;
}

interface Cell {
  node: HTMLSpanElement;
  mode: '' | 'revealed' | 'hidden';
  glyph: HTMLSpanElement | null;
}

interface Settings {
  chars: string[];
  pool: string[];
  speed: number;
  step: number;
  maxIterations: number;
  sequential: boolean;
  revealDirection: RevealDirection;
  className: string;
  encryptedClassName: string;
  animateOn: AnimateOn;
  clickMode: 'once' | 'toggle';
  effect: Effect;
  scrambleColor: string;
  loop: boolean;
  loopDelay: number;
  hoverRadius: number;
  hoverable: boolean;
  local: boolean;
}

type Point = { x: number; y: number };

type Group = string | { key: number; letters: number[] };

const OWN_KEYS = [
  'text',
  'speed',
  'maxIterations',
  'sequential',
  'revealDirection',
  'useOriginalCharsOnly',
  'characters',
  'className',
  'parentClassName',
  'encryptedClassName',
  'animateOn',
  'clickMode',
  'effect',
  'scrambleColor',
  'loop',
  'loopDelay',
  'hoverRadius',
  'style'
] as const;

const WRAPPER: JSX.CSSProperties = {
  display: 'inline-block',
  'white-space': 'pre-wrap'
};

const SR_ONLY: JSX.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  'white-space': 'nowrap',
  border: 0
};

const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';

const FADE_FLOOR = 0.16;
const FADE_PEAK = 0.62;
const FADE_LEAD = 6;
const SETTLE = 'color 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)';

const isSpace = (char: string) => /\s/.test(char);

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

const glyphWidths = new Map<string, Map<string, number>>();
let measureContext: CanvasRenderingContext2D | null = null;

const readFont = (node: Element): FontMetrics => {
  const style = window.getComputedStyle(node);
  return {
    font: `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
    spacing: parseFloat(style.letterSpacing) || 0
  };
};

const advance = (font: string, glyph: string): number => {
  let widths = glyphWidths.get(font);
  if (!widths) {
    widths = new Map<string, number>();
    glyphWidths.set(font, widths);
  }
  let width = widths.get(glyph);
  if (width === undefined) {
    measureContext = measureContext || document.createElement('canvas').getContext('2d');
    if (!measureContext) return 0;
    measureContext.font = font;
    width = measureContext.measureText(glyph).width;
    widths.set(glyph, width);
  }
  return width;
};

const flipFrames = (angle: number, opacity: number): Keyframe[] => [
  { transform: `perspective(4em) translateZ(-0.42em) rotateX(${angle}deg) translateZ(0.42em)`, opacity },
  { transform: 'perspective(4em) translateZ(-0.42em) rotateX(0deg) translateZ(0.42em)', opacity: 1 }
];

const setStyle = (node: HTMLElement, name: string, value: string) => {
  if (value) node.style.setProperty(name, value);
  else node.style.removeProperty(name);
};

const buildGroups = (chars: string[]) => {
  const result: Group[] = [];
  let word: { key: number; letters: number[] } | null = null;
  chars.forEach((char, index) => {
    if (isSpace(char)) {
      result.push(char);
      word = null;
      return;
    }
    if (!word) {
      word = { key: index, letters: [] };
      result.push(word);
    }
    word.letters.push(index);
  });
  return result;
};

export default function DecryptedText(props: DecryptedTextProps) {
  const rest = omit(props, ...OWN_KEYS);

  let containerEl: HTMLSpanElement | undefined;
  let lettersEl: HTMLSpanElement | undefined;
  let s!: Settings;
  let mounted = false;

  let cells: (Cell | null)[] = [];
  let frame: Frame = { shown: [], revealed: [], tint: [], dim: [], squeeze: [] };
  let centers: (Point | null)[] = [];
  let mask: boolean[] = [];
  let heat: number[] = [];
  let warmActive = false;
  let pointer: Point | null = null;
  let run: Run | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let hold: ReturnType<typeof setTimeout> | undefined;
  let pending: (() => void) | null = null;
  let visible = true;
  let target = true;
  let played = false;
  let font: FontMetrics | null = null;
  let viewObserver: IntersectionObserver | null = null;

  const chars = createMemo(() => Array.from(String(props.text ?? '')));

  const settings = createMemo<Settings>(() => {
    const list = chars();
    const letters = list.filter(char => !isSpace(char));
    const source =
      (props.useOriginalCharsOnly ?? false)
        ? Array.from(new Set(letters))
        : Array.from(props.characters ?? DEFAULT_CHARACTERS);
    const animateOn = props.animateOn ?? 'hover';
    const hoverRadius = props.hoverRadius ?? 0;
    const hoverable = animateOn === 'hover' || animateOn === 'inViewHover';
    const speed = props.speed ?? 50;
    return {
      chars: list,
      pool: source.length ? source : letters,
      speed,
      step: Math.max(16, speed),
      maxIterations: props.maxIterations ?? 10,
      sequential: props.sequential ?? false,
      revealDirection: props.revealDirection ?? 'start',
      className: props.className ?? '',
      encryptedClassName: props.encryptedClassName ?? '',
      animateOn,
      clickMode: props.clickMode ?? 'once',
      effect: props.effect ?? 'scramble',
      scrambleColor: props.scrambleColor ?? '',
      loop: props.loop ?? false,
      loopDelay: props.loopDelay ?? 2000,
      hoverRadius,
      hoverable,
      local: hoverable && hoverRadius > 0
    };
  });

  const revealOrder = () => {
    const order: number[] = [];
    s.chars.forEach((char, index) => {
      if (!isSpace(char)) order.push(index);
    });
    if (s.revealDirection === 'end') return order.reverse();
    if (s.revealDirection === 'center') {
      const middle = Math.floor(s.chars.length / 2);
      return order.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
    }
    if (s.revealDirection === 'random') {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    return order;
  };

  const fit = (index: number, glyph: string): number => {
    const node = containerEl;
    if (!font && node) font = readFont(node);
    const metrics = font;
    if (!metrics) return 1;
    const room = advance(metrics.font, s.chars[index] ?? glyph) + metrics.spacing;
    const need = advance(metrics.font, glyph) + metrics.spacing;
    return need > room + 0.01 ? Math.round(Math.max(0.05, room / need) * 1000) / 1000 : 1;
  };

  const build = () => {
    const root = lettersEl;
    if (!root) return;
    root.textContent = '';
    cells = s.chars.map(() => null);
    buildGroups(s.chars).forEach(group => {
      if (typeof group === 'string') {
        root.appendChild(document.createTextNode(group));
        return;
      }
      const word = document.createElement('span');
      word.style.whiteSpace = 'nowrap';
      group.letters.forEach(index => {
        const node = document.createElement('span');
        word.appendChild(node);
        cells[index] = { node, mode: '', glyph: null };
      });
      root.appendChild(word);
    });
  };

  const flip = (previous: Frame, next: Frame) => {
    if (s.effect !== 'flip' || prefersReducedMotion()) return;
    next.revealed.forEach((revealed, index) => {
      const node = cells[index]?.node;
      if (!node || typeof node.animate !== 'function' || isSpace(s.chars[index] ?? ' ')) return;
      if (!revealed) {
        node.animate(flipFrames(58 + Math.random() * 26, 0.3), {
          duration: Math.min(s.step * 0.92, 240),
          easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)'
        });
      } else if (previous.revealed[index] === false) {
        node.animate(flipFrames(90, 0), {
          duration: Math.min(Math.max(s.step * 7, 360), 760),
          easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)'
        });
      }
    });
  };

  const render = (next: Frame, fresh: boolean) => {
    const previous = frame;
    frame = next;
    const tinted = Boolean(s.scrambleColor);
    const fading = s.effect === 'fade';
    const flipping = s.effect === 'flip';
    const settles = tinted || fading;

    s.chars.forEach((char, index) => {
      const cell = cells[index];
      if (!cell) return;
      const node = cell.node;
      const revealed = next.revealed[index] ?? true;

      if (revealed) {
        if (cell.mode !== 'revealed') {
          node.textContent = char;
          cell.mode = 'revealed';
          cell.glyph = null;
        }
      } else {
        if (cell.mode !== 'hidden' || !cell.glyph) {
          node.textContent = '';
          const ghost = document.createElement('span');
          ghost.style.visibility = 'hidden';
          ghost.textContent = char;
          const glyph = document.createElement('span');
          glyph.style.position = 'absolute';
          glyph.style.top = '0';
          glyph.style.left = '50%';
          node.append(ghost, glyph);
          cell.glyph = glyph;
          cell.mode = 'hidden';
        }
        const glyph = cell.glyph;
        const shown = next.shown[index] ?? char;
        if (glyph.textContent !== shown) glyph.textContent = shown;
        const squeeze = next.squeeze[index] ?? 1;
        glyph.style.transform = squeeze < 1 ? `translateX(-50%) scaleX(${squeeze})` : 'translateX(-50%)';
      }

      node.className = revealed ? s.className : s.encryptedClassName;
      const boxed = !(revealed && !flipping);
      setStyle(node, 'position', boxed ? 'relative' : '');
      setStyle(node, 'display', boxed ? 'inline-block' : '');
      setStyle(
        node,
        'transition',
        settles ? (revealed ? SETTLE : `color 0.12s linear, opacity ${s.step}ms linear`) : ''
      );
      let color = '';
      if (tinted && !revealed) {
        const amount = Math.round((next.tint[index] ?? 1) * 100);
        color = amount >= 100 ? s.scrambleColor : `color-mix(in srgb, ${s.scrambleColor} ${amount}%, currentColor)`;
      }
      setStyle(node, 'color', color);
      setStyle(node, 'opacity', fading ? String(revealed ? 1 : (next.dim[index] ?? FADE_FLOOR)) : '');
    });

    if (fresh) flip(previous, next);
  };

  const paint = () => {
    const ranks = run?.forward && s.sequential ? new Map(run.queue.map((index, rank) => [index, rank])) : null;
    const ramp = run?.forward && !s.sequential ? Math.min(1, run.iteration / Math.max(1, s.maxIterations)) : 0;
    const next: Frame = { shown: [], revealed: [], tint: [], dim: [], squeeze: [] };
    const pool = s.pool;

    s.chars.forEach((char, index) => {
      const blank = isSpace(char);
      const hot = blank ? 0 : heat[index] || 0;
      const hidden = !blank && !mask[index];
      const scrambled = hidden || (hot > 0 && Math.random() < hot * 2);

      const glyph = scrambled ? pool[Math.floor(Math.random() * pool.length)] : char;
      next.revealed.push(!scrambled);
      next.shown.push(glyph);
      next.squeeze.push(scrambled ? fit(index, glyph) : 1);

      if (!scrambled) {
        next.tint.push(0);
        next.dim.push(1);
      } else if (!hidden) {
        const level = Math.min(1, hot * 1.5);
        next.tint.push(level);
        next.dim.push(1 - (1 - FADE_FLOOR) * level);
      } else {
        const rank = ranks?.get(index);
        const lift = rank === undefined ? ramp : Math.max(0, 1 - rank / FADE_LEAD);
        next.tint.push(1);
        next.dim.push(FADE_FLOOR + (FADE_PEAK - FADE_FLOOR) * lift);
      }
    });

    render(next, true);
  };

  const refit = () => {
    const previous = frame;
    render(
      {
        ...previous,
        squeeze: previous.shown.map((glyph, index) => (previous.revealed[index] ? 1 : fit(index, glyph)))
      },
      false
    );
  };

  const stopTicker = () => {
    clearInterval(timer);
    timer = undefined;
  };

  const ensureTicker = () => {
    if (timer) return;
    timer = setInterval(() => tick(), s.step);
  };

  const stopRun = () => {
    run = null;
    clearTimeout(hold);
    hold = undefined;
    pending = null;
  };

  const schedule = (task: () => void, delay: number) => {
    clearTimeout(hold);
    hold = setTimeout(() => {
      hold = undefined;
      if (visible) task();
      else pending = task;
    }, delay);
  };

  const startRun = (forward: boolean, { from, cycle = false, lead = 0 }: RunOptions = {}) => {
    stopRun();
    target = forward;
    if (from) mask = from;

    if (prefersReducedMotion()) {
      mask = s.chars.map(char => forward || isSpace(char));
      paint();
      return;
    }

    const order = forward ? revealOrder() : revealOrder().reverse();
    const queue = s.sequential ? order.filter(index => mask[index] !== forward) : [];

    run = {
      forward,
      cycle,
      iteration: 0,
      queue: [...new Array<null>(lead).fill(null), ...queue]
    };
    paint();
    ensureTicker();
  };

  const finishRun = (finished: Run) => {
    if (!s.loop) return;
    if (finished.forward) {
      schedule(() => startRun(false, { cycle: true }), Math.max(0, s.loopDelay));
    } else if (finished.cycle) {
      startRun(true, { cycle: true, lead: s.sequential ? Math.max(2, Math.round(320 / s.step)) : 0 });
    }
  };

  const warm = () => {
    const box = pointer && containerEl ? containerEl.getBoundingClientRect() : null;
    const cool = 1 / Math.max(1, s.maxIterations);
    let active = false;

    s.chars.forEach((char, index) => {
      if (isSpace(char)) return;
      let goal = 0;
      const center = centers[index];
      if (box && center && pointer) {
        const distance =
          Math.hypot(box.left + center.x - pointer.x, box.top + center.y - pointer.y) / Math.max(1, s.hoverRadius);
        if (distance < 1) goal = 1 - distance * distance * (3 - 2 * distance);
      }
      const value = Math.max((heat[index] || 0) - cool, goal);
      heat[index] = value > 0.001 ? value : 0;
      if (heat[index] > 0) active = true;
    });

    warmActive = active;
  };

  const tick = () => {
    const active = run;

    if (active) {
      active.iteration += 1;
      let next = mask;
      let done: boolean;

      if (s.sequential) {
        const index = active.queue.shift();
        if (index !== undefined && index !== null) {
          next = next.slice();
          next[index] = active.forward;
        }
        done = active.queue.length === 0;
      } else if (active.forward) {
        done = active.iteration >= s.maxIterations;
        if (done) next = s.chars.map(() => true);
      } else {
        const shownLetters: number[] = [];
        next.forEach((shown, index) => {
          if (shown && !isSpace(s.chars[index])) shownLetters.push(index);
        });
        const hideCount = Math.max(
          1,
          Math.ceil(s.chars.filter(char => !isSpace(char)).length / Math.max(1, s.maxIterations))
        );
        next = next.slice();
        for (let i = 0; i < hideCount && shownLetters.length; i++) {
          next[shownLetters.splice(Math.floor(Math.random() * shownLetters.length), 1)[0]] = false;
        }
        done = shownLetters.length === 0 || active.iteration >= s.maxIterations;
        if (done) next = s.chars.map(char => isSpace(char));
      }

      mask = next;
      if (done) {
        run = null;
        finishRun(active);
      }
    }

    if (s.local) warm();
    else warmActive = false;

    paint();
    if (!run && !warmActive) stopTicker();
  };

  const measure = () => {
    const node = containerEl;
    if (!node) return;
    const box = node.getBoundingClientRect();
    centers = s.chars.map((char, index) => {
      const cell = cells[index]?.node;
      if (isSpace(char) || !cell) return null;
      const rect = cell.getBoundingClientRect();
      return { x: rect.left - box.left + rect.width / 2, y: rect.top - box.top + rect.height / 2 };
    });
  };

  const reset = () => {
    stopRun();
    played = false;
    const hidden =
      s.animateOn === 'click' || ((s.animateOn === 'view' || s.animateOn === 'inViewHover') && !prefersReducedMotion());
    target = !hidden;
    mask = s.chars.map(char => !hidden || isSpace(char));
    heat = s.chars.map(() => 0);
    pointer = null;
    paint();
  };

  const observeView = () => {
    viewObserver?.disconnect();
    viewObserver = null;
    visible = true;
    const viewTrigger = s.animateOn === 'view' || s.animateOn === 'inViewHover';
    const looping = s.loop;
    if (!viewTrigger && !looping) return;
    const node = containerEl;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      entries => {
        const isVisible = entries.some(entry => entry.isIntersecting);
        visible = isVisible;
        if (!isVisible) return;
        if (viewTrigger && !played) {
          played = true;
          startRun(true);
        }
        const resume = pending;
        pending = null;
        resume?.();
        if (!looping) observer.disconnect();
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    viewObserver = observer;
  };

  const sync = (previous: Settings | null, next: Settings) => {
    const charsChanged = !previous || previous.chars !== next.chars;
    if (charsChanged) {
      font = null;
      build();
    }
    if (charsChanged || previous.animateOn !== next.animateOn) reset();
    else render(frame, false);

    if (previous && previous.step !== next.step && timer) {
      stopTicker();
      ensureTicker();
    }

    if (!next.loop) {
      clearTimeout(hold);
      hold = undefined;
      pending = null;
    }

    if (charsChanged || previous.animateOn !== next.animateOn || previous.loop !== next.loop) observeView();
  };

  createEffect(settings, value => {
    const previous = s;
    s = value;
    if (!mounted || previous === value) return;
    sync(previous, value);
  });

  onSettled(() => {
    s = settings();
    mounted = true;
    sync(null, s);
    const node = containerEl;
    if (!node) return;

    const trackPointer = (event: MouseEvent) => {
      if (prefersReducedMotion()) return;
      if (!pointer) measure();
      pointer = { x: event.clientX, y: event.clientY };
      ensureTicker();
    };

    const handleMouseEnter = (event: MouseEvent) => {
      if (!s.hoverable) return;
      if (s.local) {
        trackPointer(event);
        return;
      }
      if (run) return;
      startRun(true, { from: s.chars.map(char => isSpace(char)) });
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (s.hoverable && s.local) trackPointer(event);
    };

    const handleMouseLeave = () => {
      if (!s.hoverable) return;
      if (s.local) {
        pointer = null;
        return;
      }
      stopRun();
      target = true;
      mask = s.chars.map(() => true);
      paint();
      if (s.loop && s.animateOn === 'inViewHover') {
        schedule(() => startRun(false, { cycle: true }), Math.max(0, s.loopDelay));
      }
    };

    const handleClick = () => {
      if (s.animateOn !== 'click') return;
      if (s.clickMode === 'toggle') {
        startRun(!target);
        return;
      }
      if (!target) startRun(true);
    };

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseleave', handleMouseLeave);
    node.addEventListener('click', handleClick);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        const metrics = readFont(node);
        glyphWidths.delete(metrics.font);
        font = metrics;
        refit();
      });
      resizeObserver.observe(node);
    }

    return () => {
      mounted = false;
      clearInterval(timer);
      clearTimeout(hold);
      timer = undefined;
      hold = undefined;
      run = null;
      pending = null;
      viewObserver?.disconnect();
      viewObserver = null;
      resizeObserver?.disconnect();
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mousemove', handleMouseMove);
      node.removeEventListener('mouseleave', handleMouseLeave);
      node.removeEventListener('click', handleClick);
    };
  });

  return (
    <span {...rest} ref={el => (containerEl = el)} class={props.parentClassName ?? ''} style={props.style ?? WRAPPER}>
      <span style={SR_ONLY}>{chars().join('')}</span>
      <span ref={el => (lettersEl = el)} aria-hidden="true" />
    </span>
  );
}
