import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import type { JSX } from '@solidjs/web';
import {
  FigmaIcon,
  FingerPrintIcon,
  GitBranchIcon,
  GithubIcon,
  Key01Icon,
  NotionIcon,
  SlackIcon,
  SparklesIcon,
  Tick02Icon
} from '@hugeicons/core-free-icons';

import './MagicBento.css';

export type MagicBentoVisual = 'analytics' | 'dashboard' | 'collaboration' | 'automation' | 'integration' | 'security';

export interface MagicBentoItem {
  id?: string | number;
  label?: string;
  title?: string;
  description?: string;
  icon?: JSX.Element;
  image?: string;
  visual?: MagicBentoVisual | JSX.Element;
  content?: JSX.Element;
  href?: string;
  target?: string;
  rel?: string;
  onClick?: (event: MouseEvent) => void;
  colSpan?: number;
  rowSpan?: number;
}

export interface MagicBentoProps {
  items?: MagicBentoItem[];
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  theme?: 'dark' | 'light';
  glowColor?: string;
  textAutoHide?: boolean;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  enableStars?: boolean;
  particleCount?: number;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  intro?: boolean;
  disableAnimations?: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  className?: string;
  style?: JSX.CSSProperties;
}

interface Settings {
  items: MagicBentoItem[];
  columns: number;
  gap: number;
  enableBorderGlow: boolean;
  enableSpotlight: boolean;
  spotlightRadius: number;
  enableStars: boolean;
  particleCount: number;
  enableTilt: boolean;
  enableMagnetism: boolean;
  clickEffect: boolean;
  intro: boolean;
  disableAnimations: boolean;
  onItemClick?: (item: MagicBentoItem, index: number) => void;
  glow: number[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  rate: number;
}

interface CardState {
  hot: number;
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  vrx: number;
  vry: number;
  vtx: number;
  vty: number;
  press: number;
  vpress: number;
  stars: number;
  particles: Particle[] | null;
  active: boolean;
  drawn?: boolean;
  written: Record<string, string>;
}

type Spring = ['rx' | 'ry' | 'tx' | 'ty', 'vrx' | 'vry' | 'vtx' | 'vty'];

type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const THEMES: Record<'dark' | 'light', Record<string, string>> = {
  dark: {
    '--mb-surface': 'linear-gradient(180deg, #1a1b1d 0%, #121315 100%)',
    '--mb-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-highlight': 'rgba(255, 255, 255, 0.06)',
    '--mb-shadow': '0 24px 48px -28px rgba(0, 0, 0, 0.85), 0 8px 18px -12px rgba(0, 0, 0, 0.6)',
    '--mb-tile': 'linear-gradient(180deg, #383a3f 0%, #26282c 100%)',
    '--mb-tile-edge': 'rgba(255, 255, 255, 0.07)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 0.12)',
    '--mb-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    '--mb-well': 'rgba(255, 255, 255, 0.03)',
    '--mb-well-edge': 'rgba(255, 255, 255, 0.06)',
    '--mb-ink': '#f2f4f7',
    '--mb-muted': 'rgba(242, 244, 247, 0.6)',
    '--mb-faint': 'rgba(242, 244, 247, 0.3)',
    '--mb-line': 'rgba(242, 244, 247, 0.1)',
    '--mb-secondary': '#a0a4aa',
    '--mb-secondary-ink': '#111214',
    '--mb-cursor-stroke': 'rgba(17, 18, 20, 0.9)',
    '--mb-ring': 'rgba(17, 18, 20, 0.85)',
    '--mb-focus': 'rgba(242, 244, 247, 0.5)',
    '--mb-glow-alpha': '0.85',
    '--mb-spot-alpha': '0.07'
  },
  light: {
    '--mb-surface': 'linear-gradient(180deg, #ffffff 0%, #f7f8f9 100%)',
    '--mb-edge': 'rgba(22, 24, 27, 0.08)',
    '--mb-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-shadow': '0 24px 48px -30px rgba(22, 24, 27, 0.28), 0 8px 18px -14px rgba(22, 24, 27, 0.16)',
    '--mb-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f7f8 100%)',
    '--mb-tile-edge': 'rgba(22, 24, 27, 0.08)',
    '--mb-tile-highlight': 'rgba(255, 255, 255, 1)',
    '--mb-tile-shadow': '0 4px 10px -5px rgba(22, 24, 27, 0.22)',
    '--mb-well': 'rgba(22, 24, 27, 0.025)',
    '--mb-well-edge': 'rgba(22, 24, 27, 0.06)',
    '--mb-ink': '#11151b',
    '--mb-muted': 'rgba(22, 24, 27, 0.6)',
    '--mb-faint': 'rgba(22, 24, 27, 0.3)',
    '--mb-line': 'rgba(22, 24, 27, 0.08)',
    '--mb-secondary': '#6f737a',
    '--mb-secondary-ink': '#ffffff',
    '--mb-cursor-stroke': '#ffffff',
    '--mb-ring': '#ffffff',
    '--mb-focus': 'rgba(22, 24, 27, 0.4)',
    '--mb-glow-alpha': '0.5',
    '--mb-spot-alpha': '0.035'
  }
};

const INK: Record<'dark' | 'light', number[]> = { dark: [242, 244, 247], light: [22, 24, 27] };
const MIN_CELL = 150;
const MIN_PAIR = 200;
const STAGGER = 80;
const TILT = 6;
const MAGNET = 6;

const DEFAULT_ITEMS: MagicBentoItem[] = [
  { title: 'Analytics', description: 'Track user behavior', visual: 'analytics' },
  { title: 'Dashboard', description: 'Centralized data view', visual: 'dashboard' },
  {
    title: 'Collaboration',
    description: 'Work together seamlessly',
    visual: 'collaboration',
    colSpan: 2,
    rowSpan: 2
  },
  { title: 'Automation', description: 'Streamline workflows', visual: 'automation', colSpan: 2, rowSpan: 2 },
  { title: 'Integration', description: 'Connect favorite tools', visual: 'integration' },
  { title: 'Security', description: 'Enterprise-grade protection', visual: 'security' }
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const vars = (values: Record<string, string | number>) =>
  Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])) as JSX.CSSProperties;

const iconMarkup = (icon: IconData, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = String(name === 'stroke-width' ? strokeWidth : value);
          return `${name}="${next.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const Icon = (props: { icon: IconData; size: number; strokeWidth: number }) => (
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

const parseRgb = (value?: string | null): number[] | null => {
  if (!value) return null;
  const text = String(value).trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
  if (hex) {
    const full = hex[1].length === 3 ? hex[1].replace(/./g, digit => digit + digit) : hex[1];
    return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16));
  }
  const numbers = text.match(/[\d.]+/g);
  if (numbers && numbers.length >= 3 && /^(rgba?\(|[\d.\s,]+$)/i.test(text)) {
    return numbers.slice(0, 3).map(channel => clamp(Math.round(parseFloat(channel)), 0, 255));
  }
  return null;
};

const inkFor = (rgb: number[]) => {
  const [r, g, b] = rgb.map(channel => channel / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? '#111214' : '#ffffff';
};

const CHART = [3.1, 3.8, 3.5, 4.9, 4.4, 5.8, 5.3, 6.9, 6.5, 8.2, 9.4, 12.4];

const curve = (values: number[], width: number, height: number) => {
  const top = 6;
  const bottom = 2;
  const low = Math.min(...values) * 0.7;
  const high = Math.max(...values);
  const points: number[][] = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    top + (1 - (value - low) / (high - low)) * (height - top - bottom)
  ]);
  const count = points.length;
  const slopes: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === count - 1) return slopes[count - 2];
    return slopes[i - 1] * slopes[i] > 0 ? (slopes[i - 1] + slopes[i]) / 2 : 0;
  });
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const length = a * a + b * b;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[i] = scale * a * slopes[i];
      tangents[i + 1] = scale * b * slopes[i];
    }
  }
  let line = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  const samples: number[][] = [];
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    const c1 = [x0 + third, y0 + tangents[i] * third];
    const c2 = [x1 - third, y1 - tangents[i + 1] * third];
    line += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      const u = 1 - t;
      samples.push([
        u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1
      ]);
    }
  }
  samples.push(points[count - 1]);
  const area = `${line} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  return { line, area, samples };
};

const sampleAt = (samples: number[][], x: number) => {
  let index = 1;
  while (index < samples.length - 1 && samples[index][0] < x) index++;
  const [x0, y0] = samples[index - 1];
  const [x1, y1] = samples[index];
  const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
};

const AnalyticsVisual = () => {
  let chartEl: HTMLDivElement | undefined;
  let plotEl: HTMLDivElement | undefined;
  let scrubEl: HTMLSpanElement | undefined;
  let dotEl: HTMLSpanElement | undefined;
  let valueEl: HTMLSpanElement | undefined;
  let noteEl: HTMLSpanElement | undefined;
  const [size, setSize] = createSignal<{ width: number; height: number } | null>(null);

  const shape = createMemo(() => {
    const current = size();
    return current && current.width > 4 && current.height > 4 ? curve(CHART, current.width, current.height) : null;
  });

  onSettled(() => {
    const plot = plotEl;
    if (!plot) return;
    const update = () => {
      const next = { width: plot.clientWidth, height: plot.clientHeight };
      setSize(previous =>
        previous && previous.width === next.width && previous.height === next.height ? previous : next
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(plot);
    return () => observer.disconnect();
  });

  const scrub = (event: PointerEvent) => {
    const current = shape();
    const plot = plotEl;
    const chart = chartEl;
    const line = scrubEl;
    const dot = dotEl;
    const label = valueEl;
    const note = noteEl;
    if (!current || !plot || !chart || !line || !dot || !label || !note) return;
    const rect = plot.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = sampleAt(current.samples, x);
    const position = (x / Math.max(1, rect.width)) * (CHART.length - 1);
    const index = Math.floor(position);
    const next = Math.min(CHART.length - 1, index + 1);
    const value = CHART[index] + (CHART[next] - CHART[index]) * (position - index);
    chart.dataset.scrub = '';
    line.style.transform = `translateX(${x.toFixed(1)}px)`;
    dot.style.transform = `translateY(${y.toFixed(1)}px)`;
    label.textContent = `${value.toFixed(1)}k`;
    note.textContent = `Oct ${Math.round(position) + 1}`;
  };

  const rest = () => {
    if (chartEl) delete chartEl.dataset.scrub;
    if (valueEl) valueEl.textContent = `${CHART[CHART.length - 1].toFixed(1)}k`;
    if (noteEl) noteEl.textContent = '+18%';
  };

  return (
    <div
      ref={el => (chartEl = el)}
      class="magic-bento__chart"
      onPointerMove={scrub}
      onPointerDown={scrub}
      onPointerLeave={rest}
    >
      <div class="magic-bento__figure">
        <span ref={el => (valueEl = el)} class="magic-bento__figure-value">
          {CHART[CHART.length - 1].toFixed(1)}k
        </span>
        <span ref={el => (noteEl = el)} class="magic-bento__figure-note">
          +18%
        </span>
      </div>
      <div ref={el => (plotEl = el)} class="magic-bento__plot">
        <Show when={shape()}>
          {current => (
            <svg viewBox={`0 0 ${size()?.width ?? 0} ${size()?.height ?? 0}`} aria-hidden="true">
              <path class="magic-bento__chart-area" d={current().area} />
              <path class="magic-bento__chart-line" d={current().line} pathLength="1" />
            </svg>
          )}
        </Show>
        <span ref={el => (scrubEl = el)} class="magic-bento__scrub">
          <span ref={el => (dotEl = el)} class="magic-bento__scrub-dot" />
        </span>
      </div>
    </div>
  );
};

const BARS = [42, 58, 49, 71, 63, 88, 76];

const DashboardVisual = () => (
  <div class="magic-bento__bars">
    <div class="magic-bento__figure">
      <span class="magic-bento__figure-value">$48.2k</span>
      <span class="magic-bento__figure-note">Weekly</span>
    </div>
    <div class="magic-bento__bars-plot">
      <For each={BARS}>
        {(height, index) => (
          <span
            class="magic-bento__bar"
            data-peak={height === Math.max(...BARS) ? '' : undefined}
            style={vars({ '--h': height / 100, '--i': index() })}
          />
        )}
      </For>
    </div>
  </div>
);

const Arrow = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
    <path
      d="M2.2 1.6 13.4 9.9c.5.4.3 1.2-.4 1.3l-4.6.6-2.2 4.2c-.3.6-1.2.5-1.4-.1L1.2 2.4c-.2-.6.5-1.1 1-.8Z"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
  </svg>
);

const CollaborationVisual = () => (
  <div class="magic-bento__collab magic-bento__well">
    <span class="magic-bento__doc-title">Launch plan</span>
    <div class="magic-bento__lines">
      <span class="magic-bento__line" style={vars({ '--w': '92%' })} />
      <span class="magic-bento__line" style={vars({ '--w': '78%' })} />
      <span class="magic-bento__line" style={vars({ '--w': '86%' })} />
      <span class="magic-bento__line" style={vars({ '--w': '44%' })} />
      <span class="magic-bento__line magic-bento__line--gap" style={vars({ '--w': '88%' })} />
      <span class="magic-bento__line" style={vars({ '--w': '70%' })}>
        <span class="magic-bento__selection" style={vars({ '--from': '18%', '--span': '58%' })}>
          <span class="magic-bento__caret" />
        </span>
      </span>
      <span class="magic-bento__line" style={vars({ '--w': '82%' })} />
    </div>
    <span
      class="magic-bento__cursor magic-bento__cursor--primary"
      style={vars({ '--x': '58%', '--y': '52%', '--i': 0, '--path': 'magic-bento-path-a' })}
    >
      <Arrow />
      <span class="magic-bento__cursor-name">Maya</span>
    </span>
    <span
      class="magic-bento__cursor magic-bento__cursor--secondary"
      style={vars({ '--x': '30%', '--y': '24%', '--i': 1, '--path': 'magic-bento-path-b' })}
    >
      <Arrow />
      <span class="magic-bento__cursor-name">Leo</span>
    </span>
  </div>
);

const STEPS = [
  { label: 'Install', time: '8s' },
  { label: 'Build', time: '12s' },
  { label: 'Test', time: '48s' },
  { label: 'Deploy', time: '9s' }
];

const AutomationVisual = () => (
  <div class="magic-bento__flow" style={vars({ '--n': STEPS.length })}>
    <div class="magic-bento__flow-trigger magic-bento__tile">
      <span class="magic-bento__flow-glyph">
        <Icon icon={GitBranchIcon} size={15} strokeWidth={1.8} />
      </span>
      <span class="magic-bento__flow-copy">
        <span class="magic-bento__flow-name">Push to main</span>
        <span class="magic-bento__flow-meta magic-bento__flow-hash">a1c9f3e</span>
      </span>
    </div>
    <ol class="magic-bento__steps magic-bento__well">
      <span class="magic-bento__rail" aria-hidden="true">
        <span class="magic-bento__rail-fill" />
      </span>
      <For each={STEPS}>
        {(step, index) => (
          <li class="magic-bento__step" style={vars({ '--i': index() })}>
            <span class="magic-bento__status">
              <span class="magic-bento__pending" />
              <span class="magic-bento__spinner" />
              <span class="magic-bento__done">
                <Icon icon={Tick02Icon} size={11} strokeWidth={2.6} />
              </span>
            </span>
            {step.label}
            <span class="magic-bento__step-time">{step.time}</span>
          </li>
        )}
      </For>
    </ol>
  </div>
);

const APPS = [
  { icon: SlackIcon, x: '17%', y: '24%' },
  { icon: GithubIcon, x: '83%', y: '24%' },
  { icon: FigmaIcon, x: '17%', y: '78%' },
  { icon: NotionIcon, x: '83%', y: '78%' }
];

const IntegrationVisual = () => (
  <div class="magic-bento__hub">
    <svg class="magic-bento__hub-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <For each={APPS}>
        {app => <line x1={parseFloat(app.x)} y1={parseFloat(app.y)} x2="50" y2="51" pathLength="1" />}
      </For>
    </svg>
    <For each={APPS}>
      {(app, index) => (
        <span class="magic-bento__packet" style={vars({ '--x': app.x, '--y': app.y, '--i': index() })} />
      )}
    </For>
    <For each={APPS}>
      {(app, index) => (
        <span
          class="magic-bento__hub-node magic-bento__tile"
          style={vars({ '--x': app.x, '--y': app.y, '--s': '26px', '--i': index() + 1 })}
        >
          <Icon icon={app.icon} size={14} strokeWidth={1.8} />
        </span>
      )}
    </For>
    <span
      class="magic-bento__hub-node magic-bento__tile"
      style={vars({ '--x': '50%', '--y': '51%', '--s': '34px', '--i': 0 })}
    >
      <Icon icon={SparklesIcon} size={17} strokeWidth={1.8} />
    </span>
  </div>
);

const SETTINGS = [
  { icon: Key01Icon, label: 'SSO' },
  { icon: FingerPrintIcon, label: '2FA' }
];

const SecurityVisual = () => (
  <div class="magic-bento__shield">
    <For each={SETTINGS}>
      {(setting, index) => (
        <div class="magic-bento__setting magic-bento__tile">
          <Icon icon={setting.icon} size={14} strokeWidth={1.8} />
          <span class="magic-bento__setting-label">{setting.label}</span>
          <span class="magic-bento__switch" style={vars({ '--i': index() })} />
        </div>
      )}
    </For>
  </div>
);

const VISUALS: Record<string, () => JSX.Element> = {
  analytics: AnalyticsVisual,
  dashboard: DashboardVisual,
  collaboration: CollaborationVisual,
  automation: AutomationVisual,
  integration: IntegrationVisual,
  security: SecurityVisual
};

const REPLAY = new Set([
  'magic-bento-draw',
  'magic-bento-fade',
  'magic-bento-grow',
  'magic-bento-pop',
  'magic-bento-select',
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-switch-track',
  'magic-bento-switch-knob'
]);

const FLOW = new Set([
  'magic-bento-wait',
  'magic-bento-run',
  'magic-bento-check',
  'magic-bento-rail',
  'magic-bento-fade'
]);

const finite = (animation: Animation) => {
  const timing = animation.effect?.getTiming?.();
  return timing ? timing.iterations !== Infinity : false;
};

const nameOf = (animation: Animation) => (animation as CSSAnimation).animationName || '';

export default function MagicBento(props: MagicBentoProps) {
  let rootEl: HTMLDivElement | undefined;
  const cellRefs: (HTMLDivElement | null)[] = [];
  const cardRefs: (HTMLElement | null)[] = [];
  const starRefs: (HTMLCanvasElement | null)[] = [];
  let engine: { sync: () => void } | null = null;
  let current!: Settings;

  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const palette = createMemo<'dark' | 'light'>(() => (props.theme === 'light' ? 'light' : 'dark'));
  const glow = createMemo(() => parseRgb(props.glowColor) ?? INK[palette()]);
  const [cols, setCols] = createSignal(() => Math.max(1, Math.round(props.columns ?? 4)));

  const settings = createMemo<Settings>(() => ({
    items: items(),
    columns: Math.max(1, Math.round(props.columns ?? 4)),
    gap: Math.max(0, props.gap ?? 12),
    enableBorderGlow: props.enableBorderGlow ?? true,
    enableSpotlight: props.enableSpotlight ?? true,
    spotlightRadius: Math.max(40, props.spotlightRadius ?? 300),
    enableStars: props.enableStars ?? false,
    particleCount: clamp(Math.round(props.particleCount ?? 24), 0, 120),
    enableTilt: props.enableTilt ?? false,
    enableMagnetism: props.enableMagnetism ?? false,
    clickEffect: props.clickEffect ?? true,
    intro: props.intro ?? true,
    disableAnimations: props.disableAnimations ?? false,
    onItemClick: props.onItemClick,
    glow: glow()
  }));

  createEffect(settings, value => {
    current = value;
  });

  createEffect(
    () => [
      items().length,
      cols(),
      props.rowHeight,
      props.gap,
      props.radius,
      props.enableStars ?? false,
      props.enableSpotlight,
      props.enableBorderGlow
    ],
    ([count, , , , , stars]) => {
      cellRefs.length = count as number;
      cardRefs.length = count as number;
      starRefs.length = stars ? (count as number) : 0;
      engine?.sync();
    }
  );

  onSettled(() => {
    current = settings();
    const root = rootEl;
    if (!root) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = !current.disableAnimations && !reduced;
    const playIntro = motion && current.intro;
    if (motion) root.dataset.motion = '';
    else delete root.dataset.motion;
    if (playIntro) root.dataset.intro = '';
    else delete root.dataset.intro;

    const pointer = { x: -1e5, y: -1e5, inside: false, down: -1 };
    const light = { x: -1e5, y: -1e5, near: 0, ready: false };
    const states: CardState[] = [];
    const wave = { x: 0, y: 0, t: -1, duration: 1.1, reach: 800 };
    let rects: (DOMRect | null)[] = [];
    let bounds: DOMRect | null = null;
    let dirty = true;
    let raf = 0;
    let last = 0;
    let visible = true;
    let entered = !playIntro;
    let settleTimer = 0;
    let introTimer = 0;
    const lastFlow: number[] = [];

    const stateFor = (index: number): CardState => {
      if (!states[index]) {
        states[index] = {
          hot: 0,
          rx: 0,
          ry: 0,
          tx: 0,
          ty: 0,
          vrx: 0,
          vry: 0,
          vtx: 0,
          vty: 0,
          press: 1,
          vpress: 0,
          stars: 0,
          particles: null,
          active: false,
          written: {}
        };
      }
      return states[index];
    };

    const write = (element: HTMLElement, state: CardState, name: string, value: string) => {
      if (state.written[name] === value) return;
      state.written[name] = value;
      element.style.setProperty(name, value);
    };

    const measure = () => {
      dirty = false;
      bounds = root.getBoundingClientRect();
      rects = cellRefs.map(cell => (cell ? cell.getBoundingClientRect() : null));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      starRefs.forEach((canvas, index) => {
        const rect = rects[index];
        if (!canvas || !rect) return;
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
      });
    };

    const seed = (index: number, rect: DOMRect): Particle[] => {
      const count = current.particleCount;
      const state = stateFor(index);
      if (state.particles && state.particles.length === count) return state.particles;
      state.particles = Array.from({ length: count }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 6,
        vy: -4 - Math.random() * 10,
        size: 0.6 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        rate: 1.2 + Math.random() * 2.4
      }));
      return state.particles;
    };

    const drawStars = (
      index: number,
      rect: DOMRect,
      state: CardState,
      lx: number,
      ly: number,
      dt: number,
      now: number
    ) => {
      const canvas = starRefs[index];
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      const ratio = canvas.width / Math.max(1, rect.width);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (state.stars < 0.004) return;
      const s = current;
      const particles = seed(index, rect);
      const reach = s.spotlightRadius * 0.75;
      const [r, g, b] = s.glow;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (const particle of particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        if (particle.y < -4) {
          particle.y = rect.height + 4;
          particle.x = Math.random() * rect.width;
        }
        if (particle.x < -4) particle.x = rect.width + 4;
        if (particle.x > rect.width + 4) particle.x = -4;
        const distance = Math.hypot(particle.x - lx, particle.y - ly) / reach;
        if (distance >= 1) continue;
        const falloff = 1 - distance * distance * (3 - 2 * distance);
        const twinkle = 0.55 + 0.45 * Math.sin(now * 0.001 * particle.rate + particle.phase);
        const alpha = state.stars * falloff * twinkle;
        if (alpha < 0.01) continue;
        context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
    };

    const replay = (card: HTMLElement, filter: Set<string>) => {
      if (!motion || !card.getAnimations) return;
      for (const animation of card.getAnimations({ subtree: true })) {
        if (!filter.has(nameOf(animation)) || !finite(animation)) continue;
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        if (target instanceof Element && target.classList.contains('magic-bento__cursor')) continue;
        animation.currentTime = 0;
        animation.play();
      }
    };

    const startWave = (x: number, y: number, duration: number) => {
      if (!motion || !bounds) return;
      wave.x = x;
      wave.y = y;
      wave.t = 0;
      wave.duration = duration;
      wave.reach =
        Math.max(
          Math.hypot(x - bounds.left, y - bounds.top),
          Math.hypot(x - bounds.right, y - bounds.top),
          Math.hypot(x - bounds.left, y - bounds.bottom),
          Math.hypot(x - bounds.right, y - bounds.bottom)
        ) + 140;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (dirty) measure();
      const s = current;
      const cards = cardRefs;
      let busy = false;

      const margin = s.spotlightRadius * 0.5;
      const near =
        pointer.inside &&
        bounds &&
        pointer.x > bounds.left - margin &&
        pointer.x < bounds.right + margin &&
        pointer.y > bounds.top - margin &&
        pointer.y < bounds.bottom + margin
          ? 1
          : 0;
      if (!light.ready && near) {
        light.x = pointer.x;
        light.y = pointer.y;
        light.ready = true;
      }
      const follow = 1 - Math.exp(-dt / 0.05);
      light.x += (pointer.x - light.x) * follow;
      light.y += (pointer.y - light.y) * follow;
      const fade = 1 - Math.exp(-dt / (near > light.near ? 0.12 : 0.4));
      light.near += (near - light.near) * fade;
      if (Math.abs(near - light.near) < 0.002) light.near = near;
      else busy = true;
      if (Math.abs(pointer.x - light.x) + Math.abs(pointer.y - light.y) > 0.3) busy = true;

      let waveRadius = 0;
      let waveAlpha = 0;
      if (wave.t >= 0) {
        wave.t += dt;
        const progress = Math.min(1, wave.t / wave.duration);
        waveRadius = wave.reach * (1 - Math.pow(1 - progress, 2.2));
        waveAlpha = Math.pow(1 - progress, 1.3);
        if (progress >= 1) {
          wave.t = -1;
          waveAlpha = 0;
        } else busy = true;
      }

      cards.forEach((card, index) => {
        const rect = rects[index];
        if (!card || !rect) return;
        const state = stateFor(index);
        const lx = light.x - rect.left;
        const ly = light.y - rect.top;
        const px = pointer.x - rect.left;
        const py = pointer.y - rect.top;
        const inside = pointer.inside && entered && px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;

        if (inside !== state.active) {
          state.active = inside;
          if (inside) {
            card.dataset.active = '';
            if (now - (lastFlow[index] || -1e9) > 3200 && card.querySelector('.magic-bento__steps')) {
              lastFlow[index] = now;
              replay(card, FLOW);
            }
          } else delete card.dataset.active;
        }

        const hotTarget = inside && s.enableSpotlight ? 1 : 0;
        state.hot += (hotTarget - state.hot) * (1 - Math.exp(-dt / (hotTarget > state.hot ? 0.14 : 0.32)));
        if (Math.abs(hotTarget - state.hot) < 0.002) state.hot = hotTarget;
        else busy = true;

        const u = clamp(px / Math.max(1, rect.width), 0, 1) - 0.5;
        const v = clamp(py / Math.max(1, rect.height), 0, 1) - 0.5;
        const tilt = inside && s.enableTilt && motion;
        const magnet = inside && s.enableMagnetism && motion;
        const targets = [
          tilt ? -v * 2 * TILT : 0,
          tilt ? u * 2 * TILT : 0,
          magnet ? u * 2 * MAGNET : 0,
          magnet ? v * 2 * MAGNET : 0
        ];
        const keys: Spring[] = [
          ['rx', 'vrx'],
          ['ry', 'vry'],
          ['tx', 'vtx'],
          ['ty', 'vty']
        ];
        const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
        const h = dt / steps;
        keys.forEach(([key, velocity], k) => {
          for (let step = 0; step < steps; step++) {
            state[velocity] += (170 * (targets[k] - state[key]) - 20 * state[velocity]) * h;
            state[key] += state[velocity] * h;
          }
          if (Math.abs(targets[k] - state[key]) < 0.002 && Math.abs(state[velocity]) < 0.01) {
            state[key] = targets[k];
            state[velocity] = 0;
          } else busy = true;
        });
        const pressTarget = pointer.down === index && s.clickEffect && motion ? 0.985 : 1;
        for (let step = 0; step < steps; step++) {
          state.vpress += (420 * (pressTarget - state.press) - 28 * state.vpress) * h;
          state.press += state.vpress * h;
        }
        if (Math.abs(pressTarget - state.press) < 0.0002 && Math.abs(state.vpress) < 0.001) {
          state.press = pressTarget;
          state.vpress = 0;
        } else busy = true;

        write(card, state, '--mb-x', `${lx.toFixed(1)}px`);
        write(card, state, '--mb-y', `${ly.toFixed(1)}px`);
        write(card, state, '--mb-near', (s.enableBorderGlow ? light.near : 0).toFixed(3));
        write(card, state, '--mb-hot', state.hot.toFixed(3));
        write(card, state, '--mb-rx', `${state.rx.toFixed(3)}deg`);
        write(card, state, '--mb-ry', `${state.ry.toFixed(3)}deg`);
        write(card, state, '--mb-tx', `${state.tx.toFixed(2)}px`);
        write(card, state, '--mb-ty', `${state.ty.toFixed(2)}px`);
        write(card, state, '--mb-press', state.press.toFixed(4));
        write(card, state, '--mb-wx', `${(wave.x - rect.left).toFixed(1)}px`);
        write(card, state, '--mb-wy', `${(wave.y - rect.top).toFixed(1)}px`);
        write(card, state, '--mb-wr', `${waveRadius.toFixed(1)}px`);
        write(card, state, '--mb-wa', waveAlpha.toFixed(3));

        if (s.enableStars && starRefs[index]) {
          const starTarget = inside && motion ? 1 : 0;
          state.stars += (starTarget - state.stars) * (1 - Math.exp(-dt / (starTarget ? 0.3 : 0.5)));
          if (state.stars < 0.004 && !starTarget) state.stars = 0;
          if (state.stars > 0 || starTarget) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = true;
            busy = true;
          } else if (state.drawn) {
            drawStars(index, rect, state, lx, ly, dt, now);
            state.drawn = false;
          }
        }
      });

      if (busy && visible) raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const cardIndex = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return -1;
      const card = target.closest('.magic-bento__card');
      return card instanceof HTMLElement ? cardRefs.indexOf(card) : -1;
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      wake();
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget) return;
      pointer.inside = false;
      pointer.down = -1;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      pointer.down = cardIndex(event.target);
      wake();
    };

    const release = () => {
      if (pointer.down < 0) return;
      pointer.down = -1;
      wake();
    };

    const activate = (index: number, x: number, y: number) => {
      const s = current;
      const card = cardRefs[index];
      if (!card) return;
      if (s.clickEffect) {
        if (dirty) measure();
        startWave(x, y, 1.1);
        replay(card, REPLAY);
        lastFlow[index] = performance.now();
      }
      wake();
    };

    const onClick = (event: MouseEvent) => {
      const index = cardIndex(event.target);
      const card = cardRefs[index];
      if (!card) return;
      if (event.detail === 0) {
        const rect = card.getBoundingClientRect();
        activate(index, rect.left + rect.width / 2, rect.top + rect.height / 2);
      } else activate(index, event.clientX, event.clientY);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = cardRefs[cardIndex(event.target)];
      if (!card || event.target !== card || card.tagName === 'A') return;
      event.preventDefault();
      card.click();
    };

    const onScroll = () => {
      dirty = true;
      wake();
    };

    const resizeObserver = new ResizeObserver(() => {
      const s = current;
      const width = root.clientWidth;
      const cell = (count: number) => (width - s.gap * (count - 1)) / count;
      const next = cell(s.columns) >= MIN_CELL ? s.columns : s.columns >= 2 && cell(2) >= MIN_PAIR ? 2 : 1;
      setCols(next);
      dirty = true;
      wake();
    });
    resizeObserver.observe(root);

    const enter = () => {
      entered = true;
      let order = 0;
      cellRefs.forEach(cell => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', `${order++ * STAGGER}ms`);
        cell.dataset.state = 'in';
      });
      if (dirty) measure();
      introTimer = window.setTimeout(() => {
        if (bounds) startWave(bounds.left, bounds.top, 1.7);
        wake();
      }, 260);
      settleTimer = window.setTimeout(
        () => {
          cellRefs.forEach(cell => cell?.style.setProperty('--mb-delay', '0ms'));
        },
        order * STAGGER + 2600
      );
      wake();
    };

    let gate: IntersectionObserver | null = null;
    if (playIntro && typeof IntersectionObserver !== 'undefined') {
      gate = new IntersectionObserver(
        (entries, observer) => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          observer.disconnect();
          enter();
        },
        { threshold: 0.15 }
      );
      gate.observe(root);
    } else {
      cellRefs.forEach(cell => {
        if (!cell) return;
        cell.style.setProperty('--mb-delay', '0ms');
        cell.dataset.state = 'in';
      });
      if (motion) {
        for (const animation of root.getAnimations ? root.getAnimations({ subtree: true }) : []) {
          if (REPLAY.has(nameOf(animation)) && finite(animation)) animation.finish();
        }
      }
    }

    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        dirty = true;
        wake();
      }
    });
    visibility.observe(root);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('pointerout', onPointerOut);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);

    engine = {
      sync: () => {
        cellRefs.forEach(cell => {
          if (!cell || (!entered && playIntro)) return;
          if (cell.dataset.state !== 'in') {
            cell.style.setProperty('--mb-delay', '0ms');
            cell.dataset.state = 'in';
          }
        });
        dirty = true;
        wake();
      }
    };
    engine.sync();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.clearTimeout(introTimer);
      gate?.disconnect();
      visibility.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('pointerout', onPointerOut);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
      engine = null;
    };
  });

  const accent = createMemo(() => parseRgb(props.glowColor) ?? INK[palette()]);
  const span = createMemo(() => Math.max(1, cols()));

  const rootStyle = createMemo(() => {
    const corner = Math.max(0, props.radius ?? 20);
    const spot = Math.max(40, props.spotlightRadius ?? 300);
    const rowHeight = props.rowHeight ?? 200;
    return {
      ...THEMES[palette()],
      '--mb-glow-rgb': glow().join(', '),
      '--mb-accent-rgb': accent().join(', '),
      '--mb-accent-ink': inkFor(accent()),
      '--mb-radius': `${corner}px`,
      '--mb-inner-radius': `${Math.round(clamp(corner * 0.5, 6, 12))}px`,
      '--mb-pad': `${Math.round(clamp(corner * 0.85, 14, 20))}px`,
      '--mb-spot-size': `${spot}px`,
      '--mb-border-size': `${Math.round(spot * 0.75)}px`,
      'grid-template-columns': `repeat(${span()}, minmax(0, 1fr))`,
      'grid-auto-rows': span() === 1 ? `minmax(${rowHeight}px, auto)` : `${rowHeight}px`,
      gap: `${Math.max(0, props.gap ?? 12)}px`,
      ...props.style
    } as JSX.CSSProperties;
  });

  return (
    <div
      ref={el => (rootEl = el)}
      class={['magic-bento', props.className]}
      data-autohide={(props.textAutoHide ?? true) ? '' : undefined}
      data-motion={props.disableAnimations ? undefined : ''}
      data-intro={(props.intro ?? true) && !props.disableAnimations ? '' : undefined}
      style={rootStyle()}
    >
      <For each={items()} keyed={false}>
        {(item, index) => {
          const entry = createMemo<MagicBentoItem>(() => item() ?? {});
          const clickable = () => Boolean(entry().href || entry().onClick || props.onItemClick);
          const handleClick = (event: MouseEvent) => {
            if (!clickable()) return;
            const value = entry();
            value.onClick?.(event);
            props.onItemClick?.(value, index);
          };
          const visualName = createMemo(() => {
            const visual = entry().visual;
            return typeof visual === 'string' && VISUALS[visual] ? visual : null;
          });
          const customVisual = createMemo(() => {
            const visual = entry().visual;
            return typeof visual === 'string' ? null : visual;
          });
          const assignCard = (element: HTMLElement) => {
            cardRefs[index] = element;
          };

          const body = () => (
            <>
              <Show when={entry().image}>
                <img class="magic-bento__image" src={entry().image} alt="" draggable="false" />
              </Show>
              <Show when={entry().image}>
                <span class="magic-bento__scrim" />
              </Show>
              <Show when={props.enableSpotlight ?? true}>
                <span class="magic-bento__light" />
              </Show>
              <Show when={props.enableStars ?? false}>
                <canvas ref={el => (starRefs[index] = el)} class="magic-bento__stars" aria-hidden="true" />
              </Show>
              <div class="magic-bento__content">
                <Show
                  when={entry().content}
                  fallback={
                    <>
                      <Show when={entry().icon || entry().label}>
                        <div class="magic-bento__header">
                          <Show when={entry().icon}>
                            <span class="magic-bento__icon">{entry().icon}</span>
                          </Show>
                          <Show when={entry().label}>
                            <span class="magic-bento__label">{entry().label}</span>
                          </Show>
                        </div>
                      </Show>
                      <Show when={visualName() || customVisual()}>
                        <div class="magic-bento__visual" aria-hidden="true">
                          <Show when={visualName()} fallback={customVisual()}>
                            {name => <Dynamic component={VISUALS[name()]} />}
                          </Show>
                        </div>
                      </Show>
                      <Show when={entry().title || entry().description}>
                        <div class="magic-bento__text">
                          <Show when={entry().title}>
                            <h3 class="magic-bento__title">{entry().title}</h3>
                          </Show>
                          <Show when={entry().description}>
                            <p class="magic-bento__description">{entry().description}</p>
                          </Show>
                        </div>
                      </Show>
                    </>
                  }
                >
                  {entry().content}
                </Show>
              </div>
              <span class="magic-bento__rim" />
              <span class="magic-bento__border" />
            </>
          );

          return (
            <div
              ref={el => (cellRefs[index] = el)}
              class="magic-bento__cell"
              style={{
                'grid-column': `span ${Math.min(span(), Math.max(1, Math.round(entry().colSpan ?? 1)))}`,
                'grid-row': `span ${Math.max(1, Math.round(entry().rowSpan ?? 1))}`
              }}
            >
              <Show
                when={entry().href}
                fallback={
                  <div
                    ref={assignCard}
                    class="magic-bento__card"
                    data-clickable={clickable() ? '' : undefined}
                    data-image={entry().image ? '' : undefined}
                    role={clickable() ? 'button' : undefined}
                    tabindex={clickable() ? 0 : undefined}
                    aria-label={clickable() ? entry().title : undefined}
                    onClick={handleClick}
                  >
                    {body()}
                  </div>
                }
              >
                <a
                  ref={assignCard}
                  class="magic-bento__card"
                  data-clickable={clickable() ? '' : undefined}
                  data-image={entry().image ? '' : undefined}
                  href={entry().href}
                  target={entry().target}
                  rel={entry().rel}
                  onClick={handleClick}
                >
                  {body()}
                </a>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}
