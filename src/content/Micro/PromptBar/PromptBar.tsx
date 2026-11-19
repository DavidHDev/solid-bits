import { For, Show, createEffect, createMemo, createSignal, onSettled, untrack, type Accessor } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { animate } from 'motion';
import {
  ArrowDown01Icon,
  Attachment01Icon,
  Calendar03Icon,
  Cancel01Icon,
  ChartLineData01Icon,
  File02Icon,
  Globe02Icon,
  HelpCircleIcon,
  Mail01Icon,
  Mic01Icon,
  PlusSignIcon,
  SparklesIcon,
  Tick02Icon
} from '@hugeicons/core-free-icons';
import './PromptBar.css';

export type IconSvgElement =
  | [string, { [key: string]: string | number }][]
  | readonly (readonly [string, { readonly [key: string]: string | number }])[];

export interface PromptBarSource {
  key: string;
  name: string;
  description?: string;
  icon?: JSX.Element | IconSvgElement;
  attach?: boolean;
}

export interface PromptBarCommand {
  key: string;
  name: string;
  description?: string;
}

export interface PromptBarModel {
  key: string;
  name: string;
  tag?: string;
}

export interface PromptBarSendDetail {
  attachments: string[];
  model?: PromptBarModel;
  effort?: string;
}

export interface PromptBarProps {
  placeholder?: string;
  sources?: PromptBarSource[];
  commands?: PromptBarCommand[];
  models?: PromptBarModel[];
  defaultModel?: string;
  efforts?: string[];
  defaultEffort?: string;
  onEffortChange?: (effort: string) => void;
  busy?: boolean;
  onSend?: (text: string, detail: PromptBarSendDetail) => void;
  onStop?: () => void;
  onAttach?: () => string | string[] | void | Promise<string | string[] | void>;
  onDictate?: () => string | void | Promise<string | void>;
  background?: string;
  color?: string;
  menuBackground?: string;
  sparkColor?: string;
  sparkBoost?: number;
  width?: number;
  radius?: number;
  maxRows?: number;
  morphDuration?: number;
  squash?: number;
  tilt?: number;
  pressScale?: number;
  className?: string;
}

type Row = {
  key: string;
  name: string;
  description?: string;
  tag?: string;
  icon?: JSX.Element | IconSvgElement;
  attach?: boolean;
};
type Token = { kind: 'at' | 'slash'; query: string; start: number };
type Spark = {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  life: number;
  span: number;
};

interface SendGlyphProps {
  busy: boolean;
  morphDuration: number;
  squash: number;
  tilt: number;
  reduce: boolean;
}

const ARROW_UP = [12, 4.5, 18.5, 11, 14.25, 11, 14.25, 19.5, 9.75, 19.5, 9.75, 11, 5.5, 11];
const SQUARE = [12, 6, 18, 6, 18, 12, 18, 18, 6, 18, 6, 12, 6, 6];
const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];
const LINE = 22;
const EDGE = 11;

const DEFAULT_SOURCES: PromptBarSource[] = [
  {
    key: 'files',
    name: 'Photos & files',
    description: 'Upload from this device',
    icon: Attachment01Icon,
    attach: true
  },
  { key: 'web', name: 'Web search', description: 'Live results', icon: Globe02Icon },
  { key: 'sales', name: 'Sales data', description: 'Revenue and churn', icon: ChartLineData01Icon },
  { key: 'docs', name: 'Documents', description: 'Specs, notes, briefs', icon: File02Icon },
  { key: 'mail', name: 'Mail', description: 'Read and draft mail', icon: Mail01Icon },
  { key: 'calendar', name: 'Calendar', description: 'Events and availability', icon: Calendar03Icon }
];
const DEFAULT_COMMANDS: PromptBarCommand[] = [
  { key: 'summarize', name: '/summarize', description: 'Digest the thread so far' },
  { key: 'compare', name: '/compare', description: 'Two options side by side' },
  { key: 'draft', name: '/draft', description: 'Write a first version' },
  { key: 'explain', name: '/explain', description: 'A plain-language walkthrough' },
  { key: 'tasks', name: '/tasks', description: 'Turn this into a to-do list' }
];
const DEFAULT_MODELS: PromptBarModel[] = [
  { key: 'nova-3', name: 'Nova 3', tag: 'Flagship' },
  { key: 'nova-mini', name: 'Nova Mini', tag: 'Fast' },
  { key: 'nova-2', name: 'Nova 2', tag: 'Legacy' }
];
const DEFAULT_EFFORTS = ['Low', 'Medium', 'High', 'Extra', 'Max'];

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const pathAt = (a: number[], b: number[], t: number) => {
  let d = '';
  for (let i = 0; i < a.length; i += 2) {
    d += `${i ? 'L' : 'M'}${mix(a[i], b[i], t).toFixed(2)} ${mix(a[i + 1], b[i + 1], t).toFixed(2)}`;
  }
  return `${d}Z`;
};

const parseToken = (draft: string): Token | null => {
  const m = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!m) return null;
  return { kind: m[2] === '@' ? 'at' : 'slash', query: m[3].toLowerCase(), start: m.index + m[1].length };
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

const isIconData = (icon: unknown): icon is IconSvgElement =>
  Array.isArray(icon) && icon.length > 0 && icon.every(node => Array.isArray(node) && typeof node[0] === 'string');

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

const renderIcon = (icon: JSX.Element | IconSvgElement, size: number) =>
  isIconData(icon) ? <Icon icon={icon} size={size} strokeWidth={1.8} /> : (icon as JSX.Element);

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

function SendGlyph(props: SendGlyphProps) {
  let svgEl: SVGSVGElement | undefined;
  let pathEl: SVGPathElement | undefined;
  let dir = -1;
  let t: number | null = null;
  let squash = 0.12;
  let tilt = 8;
  let reduce = false;

  const paint = (v: number) => {
    pathEl?.setAttribute('d', pathAt(ARROW_UP, SQUARE, v));
    const goo = reduce ? 0 : Math.sin(v * Math.PI);
    const sx = 1 - squash * goo;
    if (svgEl) {
      svgEl.style.transform = goo ? `rotate(${dir * tilt * goo}deg) scale(${sx}, ${1 / sx})` : '';
    }
  };

  createEffect(
    () => ({ squash: props.squash, tilt: props.tilt, reduce: props.reduce }),
    value => {
      squash = value.squash;
      tilt = value.tilt;
      reduce = value.reduce;
    }
  );

  createEffect(
    () => ({ busy: props.busy, morphDuration: props.morphDuration, reduce: props.reduce }),
    value => {
      const target = value.busy ? 1 : 0;
      dir = value.busy ? 1 : -1;
      if (t === null) {
        t = target;
        pathEl?.setAttribute('d', pathAt(ARROW_UP, SQUARE, target));
        return undefined;
      }
      if (t === target) return undefined;
      if (value.reduce) {
        t = target;
        paint(target);
        return undefined;
      }
      const controls = animate(t, target, {
        duration: value.morphDuration / 1000,
        ease: EASE_IN_OUT,
        onUpdate: v => {
          t = v;
          paint(v);
        }
      });
      return () => controls.stop();
    }
  );

  return (
    <svg
      ref={el => (svgEl = el)}
      class="prompt-bar__glyph"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="2"
      stroke-linejoin="round"
    >
      <path ref={el => (pathEl = el)} d={pathAt(ARROW_UP, SQUARE, 0)} />
    </svg>
  );
}

export default function PromptBar(props: PromptBarProps) {
  const reduce = useReducedMotion();
  let rootEl: HTMLDivElement | undefined;
  let inputEl: HTMLTextAreaElement | undefined;
  let menuEl: HTMLDivElement | undefined;
  let glowEl: HTMLSpanElement | undefined;
  let sparkEl: HTMLCanvasElement | undefined;
  const typing = { energy: 0, strokes: 0 };
  let boost = 1;
  let lastOpen: string | null = null;
  let dictation = 0;

  const sources = createMemo(() => props.sources ?? DEFAULT_SOURCES);
  const commands = createMemo(() => props.commands ?? DEFAULT_COMMANDS);
  const models = createMemo(() => props.models ?? DEFAULT_MODELS);
  const efforts = createMemo(() => props.efforts ?? DEFAULT_EFFORTS);
  const busy = createMemo(() => props.busy ?? false);
  const sparkColor = createMemo(() => props.sparkColor ?? '#6ec9f7');
  const maxRows = createMemo(() => props.maxRows ?? 5);

  const [draft, setDraft] = createSignal('');
  const [attachments, setAttachments] = createSignal<string[]>([]);
  const [modelKey, setModelKey] = createSignal(untrack(() => props.defaultModel ?? ''));
  const [plusOpen, setPlusOpen] = createSignal(false);
  const [modelOpen, setModelOpen] = createSignal(false);
  const [effortOpen, setEffortOpen] = createSignal(false);
  const [effortIndex, setEffortIndex] = createSignal(
    untrack(() => {
      const list = props.efforts ?? DEFAULT_EFFORTS;
      const i = list.indexOf(props.defaultEffort ?? '');
      return i >= 0 ? i : Math.max(0, Math.floor((list.length - 1) / 2));
    })
  );
  const [dismissed, setDismissed] = createSignal(false);
  const [active, setActive] = createSignal(0);
  const [listening, setListening] = createSignal(false);
  const [pressed, setPressed] = createSignal(false);

  const model = createMemo<PromptBarModel | undefined>(() => models().find(m => m.key === modelKey()) ?? models()[0]);
  const token = createMemo(() => (dismissed() ? null : parseToken(draft())));
  const open = createMemo<'at' | 'slash' | 'model' | 'effort' | null>(() =>
    plusOpen() ? 'at' : (token()?.kind ?? (modelOpen() ? 'model' : effortOpen() ? 'effort' : null))
  );
  const query = createMemo(() => (plusOpen() ? '' : (token()?.query ?? '')));
  const list = createMemo<Row[]>(() => {
    const kind = open();
    const q = query();
    if (kind === 'at') return sources().filter(s => s.name.toLowerCase().includes(q));
    if (kind === 'slash') return commands().filter(c => c.name.replace(/^\//, '').toLowerCase().startsWith(q));
    if (kind === 'model') return models();
    return [];
  });
  const cursor = createMemo(() => Math.min(active(), Math.max(0, list().length - 1)));
  const canSend = createMemo(() => draft().trim().length > 0 || attachments().length > 0);
  const armed = createMemo(() => busy() || canSend());
  const level = createMemo(() => efforts()[effortIndex()] ?? '');
  const maxed = createMemo(() => efforts().length > 1 && effortIndex() === efforts().length - 1);
  const chips = createMemo(() => attachments().map((file, i) => ({ file, i, key: `${file}-${i}` })));

  const focusInput = () => inputEl?.focus({ preventScroll: true });
  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
    setEffortOpen(false);
  };

  createEffect(
    () => props.sparkBoost ?? 1,
    value => {
      boost = value;
    }
  );

  createEffect(
    () => ({ open: open(), cursor: cursor(), list: list() }),
    value => {
      if (!value.open) {
        lastOpen = null;
        return;
      }
      const glow = glowEl;
      if (!glow || !glow.isConnected || !menuEl) return;
      const row = menuEl.querySelectorAll<HTMLButtonElement>(':scope > .prompt-bar__row')[value.cursor];
      if (!row) {
        glow.style.opacity = '0';
        return;
      }
      const fresh = lastOpen !== value.open;
      lastOpen = value.open;
      if (fresh) glow.style.transition = 'none';
      glow.style.top = `${row.offsetTop}px`;
      glow.style.height = `${row.offsetHeight}px`;
      glow.style.opacity = '1';
      if (fresh) {
        void glow.offsetHeight;
        glow.style.transition = '';
      }
    }
  );

  createEffect(
    () => plusOpen() || modelOpen() || effortOpen(),
    anyOpen => {
      if (!anyOpen) return undefined;
      const onDown = (e: PointerEvent) => {
        if (!rootEl?.contains(e.target as Node)) closeMenus();
      };
      document.addEventListener('pointerdown', onDown);
      return () => document.removeEventListener('pointerdown', onDown);
    }
  );

  createEffect(
    () => ({ draft: draft(), maxRows: maxRows() }),
    value => {
      const el = inputEl;
      if (!el) return;
      el.style.height = '0px';
      const max = LINE * value.maxRows;
      el.style.height = `${Math.min(el.scrollHeight, max)}px`;
      el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
    }
  );

  onSettled(() => () => {
    dictation += 1;
  });

  createEffect(
    () => ({ maxed: maxed(), reduce: reduce(), sparkColor: sparkColor() }),
    value => {
      const canvas = sparkEl;
      if (!value.maxed || value.reduce || !canvas) return undefined;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      const color = value.sparkColor;
      typing.strokes = 0;
      let raf = 0;
      let last = performance.now();
      let w = 0;
      let h = 0;
      let due = 0;
      let speed = 1;
      let pulse = 0;
      const parts: Spark[] = [];
      let resizePending = false;
      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        w = rect.width;
        h = rect.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const spawn = (burst: boolean) => {
        parts.push({
          x: Math.random() * w,
          y: burst ? h * (0.2 + Math.random() * 0.8) : h + 3,
          r: 0.9 + Math.random() * 1.1,
          vy: -(7 + Math.random() * 9),
          sway: (Math.random() - 0.5) * 10,
          phase: Math.random() * Math.PI * 2,
          life: burst ? Math.random() * 1.2 : 0,
          span: 2.4 + Math.random() * 2.4
        });
      };
      const tick = (now: number) => {
        if (resizePending) {
          resizePending = false;
          resize();
        }
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const gain = boost;
        typing.energy *= Math.exp(-dt / 0.8);
        pulse *= Math.exp(-dt / 0.16);
        if (typing.strokes > 0) {
          typing.strokes = 0;
          if (gain > 0) pulse = 1;
        }
        const energy = typing.energy * gain;
        speed += (1 + energy * 6 - speed) * (1 - Math.exp(-dt / 0.15));
        due += dt;
        while (due > 0.14) {
          due -= 0.14;
          if (parts.length < 30) spawn(false);
        }
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6 + energy * 10 + pulse * 6;
        for (let i = parts.length - 1; i >= 0; i -= 1) {
          const p = parts[i];
          p.life += dt;
          if (p.life > p.span) {
            parts.splice(i, 1);
            continue;
          }
          const k = p.life / p.span;
          const twinkle = 0.7 + 0.3 * Math.sin((now / 160) * (1 + energy) + p.phase);
          p.y += p.vy * dt * speed;
          if (p.y < -4) {
            p.y = h + 3;
            p.x = Math.random() * w;
          }
          const edge = Math.min(1, Math.max(0, p.y / 14), Math.max(0, (h - p.y) / 14));
          ctx.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * (0.9 + energy * 0.25) * twinkle) * edge;
          ctx.beginPath();
          ctx.arc(
            p.x + Math.sin((now / 900) * (1 + energy * 0.8) + p.phase) * p.sway,
            p.y,
            p.r * twinkle * (1 + energy * 0.35),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        raf = requestAnimationFrame(tick);
      };
      resize();
      for (let i = 0; i < 26; i += 1) spawn(true);
      const ro = new ResizeObserver(() => {
        resizePending = true;
      });
      ro.observe(canvas);
      raf = requestAnimationFrame(tick);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        ctx.clearRect(0, 0, w, h);
      };
    }
  );

  const setEffort = (i: number) => {
    const list = efforts();
    const next = Math.max(0, Math.min(list.length - 1, i));
    if (next === effortIndex()) return;
    setEffortIndex(next);
    props.onEffortChange?.(list[next]);
  };
  const effortFromPointer = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const k = (e.clientX - rect.left - EDGE) / Math.max(1, rect.width - 2 * EDGE);
    setEffort(Math.round(k * (efforts().length - 1)));
  };
  const onEffortKey = (e: KeyboardEvent) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (step) {
      e.preventDefault();
      setEffort(effortIndex() + step);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setEffort(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setEffort(efforts().length - 1);
    } else if (e.key === 'Escape') {
      setEffortOpen(false);
      focusInput();
    }
  };
  const stepAt = (i: number) => `calc(${EDGE}px + (100% - ${EDGE * 2}px) * ${i / Math.max(1, efforts().length - 1)})`;
  const fillAt = (i: number) => (i === efforts().length - 1 ? '100%' : `calc(${stepAt(i)} + 7px)`);

  const pick = (row: Row) => {
    const kind = open();
    if (kind === 'model') {
      setModelKey(row.key);
      setModelOpen(false);
      focusInput();
      return;
    }
    const tok = token();
    const text = draft();
    const head = tok ? text.slice(0, tok.start) : text;
    if (row.attach) {
      setDraft(head);
      Promise.resolve(props.onAttach?.()).then(files => {
        if (!files) return;
        setAttachments(a => [...a, ...(Array.isArray(files) ? files : [files])]);
      });
    } else if (kind === 'at') {
      setDraft(`${head}@${row.name} `);
    } else {
      setDraft(`${head}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    focusInput();
  };

  const send = () => {
    if (!canSend() || busy()) return;
    props.onSend?.(draft().trim(), { attachments: attachments(), model: model(), effort: level() });
    setDraft('');
    setAttachments([]);
    setDismissed(false);
    closeMenus();
    focusInput();
  };

  const toggleListen = () => {
    if (listening()) {
      dictation += 1;
      setListening(false);
      return;
    }
    const seq = ++dictation;
    setListening(true);
    Promise.resolve(props.onDictate?.()).then(
      text => {
        if (seq !== dictation) return;
        setListening(false);
        if (text) setDraft(d => (d.trim() ? `${d.trimEnd()} ${text}` : text));
        focusInput();
      },
      () => {
        if (seq === dictation) setListening(false);
      }
    );
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const rows = list();
    const at = cursor();
    if (open() && rows.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((at + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length);
        return;
      }
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Tab') {
        e.preventDefault();
        pick(rows[at]);
        return;
      }
    }
    if (e.key === 'Escape') {
      if (open()) {
        e.preventDefault();
        setDismissed(true);
        closeMenus();
      }
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const down = (e: PointerEvent) => {
    if (e.button !== 0 || !armed()) return;
    setPressed(true);
  };
  const up = () => {
    setPressed(false);
  };
  const keepFocus = (e: MouseEvent) => e.preventDefault();

  return (
    <div
      ref={el => (rootEl = el)}
      class={['prompt-bar', props.className]}
      data-busy={busy() ? '' : undefined}
      data-max={maxed() ? '' : undefined}
      style={{
        '--pb-bg': props.background ?? '#27292b',
        '--pb-ink': props.color ?? '#f5f5f5',
        '--pb-menu': props.menuBackground ?? '#313437',
        '--pb-w': `${props.width ?? 400}px`,
        '--pb-radius': `${props.radius ?? 16}px`,
        '--pb-spark': sparkColor(),
        '--pb-press': String(props.pressScale ?? 0.96)
      }}
    >
      <Show when={open()}>
        <div
          ref={el => (menuEl = el)}
          class="prompt-bar__menu"
          role={open() === 'effort' ? 'dialog' : 'listbox'}
          aria-label={
            open() === 'at' ? 'Sources' : open() === 'slash' ? 'Commands' : open() === 'model' ? 'Models' : 'Effort'
          }
          data-kind={open()}
        >
          <Show
            when={open() === 'effort'}
            fallback={
              <>
                <span ref={el => (glowEl = el)} class="prompt-bar__glow" aria-hidden="true" />
                <For each={list()} keyed={(row: Row) => row.key}>
                  {(row, i) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={i() === cursor() ? 'true' : 'false'}
                      class="prompt-bar__row"
                      onMouseDown={keepFocus}
                      onPointerEnter={() => {
                        setActive(i());
                      }}
                      onClick={() => pick(row())}
                    >
                      <Show when={open() === 'at'}>
                        <span class="prompt-bar__row-icon">{renderIcon(row().icon, 15)}</span>
                      </Show>
                      <span class="prompt-bar__row-name">{row().name}</span>
                      <Show when={row().description}>
                        <span class="prompt-bar__row-desc">{row().description}</span>
                      </Show>
                      <Show when={open() === 'model'}>
                        <span class="prompt-bar__row-tag">{row().tag}</span>
                        <span class="prompt-bar__row-check" data-on={row().key === model()?.key ? '' : undefined}>
                          <Icon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                        </span>
                      </Show>
                    </button>
                  )}
                </For>
                <Show when={list().length === 0}>
                  <div class="prompt-bar__empty">No matches for “{query()}”</div>
                </Show>
              </>
            }
          >
            <div class="prompt-bar__effort-head">
              <span class="prompt-bar__effort-title">Effort</span>
              <span class="prompt-bar__effort-level">{level()}</span>
              <span class="prompt-bar__effort-help" title="Higher effort thinks longer before answering">
                <Icon icon={HelpCircleIcon} size={14} strokeWidth={1.8} />
              </span>
            </div>
            <div class="prompt-bar__effort-ends">
              <span>Faster</span>
              <span>Smarter</span>
            </div>
            <div
              class="prompt-bar__effort-track"
              role="slider"
              tabindex={0}
              aria-label="Effort"
              aria-valuemin={0}
              aria-valuemax={efforts().length - 1}
              aria-valuenow={effortIndex()}
              aria-valuetext={level()}
              style={{ '--pb-effort-x': stepAt(effortIndex()), '--pb-effort-fill': fillAt(effortIndex()) }}
              onPointerDown={e => {
                if (e.button !== 0) return;
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  void 0;
                }
                e.currentTarget.focus({ preventScroll: true });
                effortFromPointer(e);
              }}
              onPointerMove={e => {
                if (e.buttons & 1) effortFromPointer(e);
              }}
              onKeyDown={onEffortKey}
            >
              <span class="prompt-bar__effort-fill" />
              <For each={efforts()} keyed={(label: string) => label}>
                {(_label, i) => <i class="prompt-bar__effort-dot" style={{ left: stepAt(i()) }} />}
              </For>
              <span class="prompt-bar__effort-thumb" />
            </div>
          </Show>
        </div>
      </Show>

      <div
        class="prompt-bar__field"
        role="presentation"
        data-max={maxed() ? '' : undefined}
        onPointerDown={e => {
          if (e.target === e.currentTarget || e.target === inputEl) closeMenus();
        }}
        onClick={focusInput}
      >
        <canvas ref={el => (sparkEl = el)} class="prompt-bar__sparks" aria-hidden="true" />
        <Show when={attachments().length > 0}>
          <div class="prompt-bar__chips">
            <For each={chips()} keyed={(chip: { key: string }) => chip.key}>
              {chip => (
                <span class="prompt-bar__chip">
                  <Icon icon={File02Icon} size={12} strokeWidth={2} />
                  <span class="prompt-bar__chip-name">{chip().file}</span>
                  <button
                    type="button"
                    class="prompt-bar__chip-x"
                    aria-label={`Remove ${chip().file}`}
                    onClick={() => {
                      const index = chip().i;
                      setAttachments(a => a.filter((_, j) => j !== index));
                    }}
                  >
                    <Icon icon={Cancel01Icon} size={10} strokeWidth={2.5} />
                  </button>
                </span>
              )}
            </For>
          </div>
        </Show>

        <textarea
          ref={el => (inputEl = el)}
          class="prompt-bar__input"
          rows={1}
          value={draft()}
          placeholder={listening() ? 'Listening…' : (props.placeholder ?? 'Ask anything')}
          aria-label="Prompt"
          onInput={e => {
            setDraft(e.currentTarget.value);
            typing.energy = Math.min(1.6, typing.energy + 0.22);
            typing.strokes = Math.min(4, typing.strokes + 1);
            setDismissed(false);
            closeMenus();
            setActive(0);
          }}
          onFocus={closeMenus}
          onKeyDown={onKeyDown}
        />

        <div class="prompt-bar__bar">
          <button
            type="button"
            class="prompt-bar__tool"
            aria-label="Add files and sources"
            aria-expanded={plusOpen() ? 'true' : 'false'}
            data-on={plusOpen() ? '' : undefined}
            onMouseDown={keepFocus}
            onClick={() => {
              setModelOpen(false);
              setEffortOpen(false);
              setActive(0);
              setPlusOpen(v => !v);
              focusInput();
            }}
          >
            <Icon icon={PlusSignIcon} size={16} strokeWidth={2} />
          </button>
          <Show when={models().length > 0}>
            <button
              type="button"
              class="prompt-bar__pick"
              aria-label="Choose model"
              aria-expanded={modelOpen() ? 'true' : 'false'}
              data-on={modelOpen() ? '' : undefined}
              onMouseDown={keepFocus}
              onClick={() => {
                setPlusOpen(false);
                setEffortOpen(false);
                const current = model();
                setActive(Math.max(0, current ? models().indexOf(current) : 0));
                setModelOpen(v => !v);
                focusInput();
              }}
            >
              <span>{model()?.name}</span>
              <Icon icon={ArrowDown01Icon} size={12} strokeWidth={2.4} />
            </button>
          </Show>
          <Show when={efforts().length > 0}>
            <button
              type="button"
              class="prompt-bar__pick"
              aria-label="Choose effort"
              aria-expanded={effortOpen() ? 'true' : 'false'}
              data-on={effortOpen() ? '' : undefined}
              data-max={maxed() ? '' : undefined}
              onMouseDown={keepFocus}
              onClick={() => {
                setPlusOpen(false);
                setModelOpen(false);
                setEffortOpen(v => !v);
                focusInput();
              }}
            >
              <Icon icon={SparklesIcon} size={13} strokeWidth={2} />
              <span>{level()}</span>
            </button>
          </Show>
          <span class="prompt-bar__spacer" />
          <Show when={props.onDictate}>
            <button
              type="button"
              class="prompt-bar__tool"
              aria-label={listening() ? 'Stop dictation' : 'Dictate'}
              aria-pressed={listening() ? 'true' : 'false'}
              data-on={listening() ? '' : undefined}
              onMouseDown={keepFocus}
              onClick={toggleListen}
            >
              <Show when={listening()} fallback={<Icon icon={Mic01Icon} size={15} strokeWidth={2} />}>
                <span class="prompt-bar__eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </Show>
            </button>
          </Show>
          <button
            type="button"
            class="prompt-bar__send"
            disabled={!armed()}
            aria-label={busy() ? 'Stop' : 'Send'}
            data-armed={armed() ? '' : undefined}
            data-pressed={pressed() ? '' : undefined}
            onMouseDown={keepFocus}
            onPointerDown={down}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={up}
            onClick={() => {
              if (busy()) props.onStop?.();
              else send();
            }}
          >
            <SendGlyph
              busy={busy()}
              morphDuration={props.morphDuration ?? 240}
              squash={props.squash ?? 0.12}
              tilt={props.tilt ?? 8}
              reduce={reduce()}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
