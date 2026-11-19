import { For, Show, createEffect, createMemo, createSignal, createUniqueId, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import './CurvedInput.css';

const DEG = 180 / Math.PI;

const round2 = (n: number): number => Math.round(n * 100) / 100;

const hexToRgba = (hex: string, alpha: number): string => {
  let h = String(hex).replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

type ShadowSize = 'none' | 'sm' | 'md' | 'lg';
type Theme = 'dark' | 'light';

const SHADOWS: Partial<Record<ShadowSize, [number, number, number]>> = {
  sm: [5, 12, 0.3],
  md: [10, 24, 0.4],
  lg: [16, 40, 0.52]
};

interface ThemePalette {
  backgroundColor: string;
  textColor: string;
  placeholderColor: string;
  borderColor: string;
  buttonColor: string;
  buttonTextColor: string;
  shadowColor: string;
}

const THEMES: Record<Theme, ThemePalette> = {
  dark: {
    backgroundColor: '#12161c',
    textColor: '#f5f5f5',
    placeholderColor: '#9ea3aa',
    borderColor: '#33383f',
    buttonColor: '#6ec9f7',
    buttonTextColor: '#090b0e',
    shadowColor: '#000000'
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#16202c',
    placeholderColor: '#9aa1aa',
    borderColor: '#1f3350',
    buttonColor: '#0977ae',
    buttonTextColor: '#ffffff',
    shadowColor: '#0a121c'
  }
};

interface Geometry {
  straight: boolean;
  W: number;
  T: number;
  svgH: number;
  R?: number;
  dir?: number;
  uPerLen: number;
  point: (u: number, v: number) => [number, number];
  angleAt: (u: number) => number;
  uFromPoint: (x: number, y?: number) => number;
}

const buildGeometry = (width: number, bend: number, thickness: number, pad: number): Geometry => {
  const W = width;
  const T = thickness;
  const s = Math.max(-W * 0.35, Math.min(bend, W * 0.35));
  const a = Math.abs(s);
  const dir = s >= 0 ? 1 : -1;
  const svgH = T + a + pad * 2;

  if (a < 0.75) {
    const midY = pad + T / 2;
    return {
      straight: true,
      W,
      T,
      svgH,
      uPerLen: 1,
      point: (u, v) => [u, midY + v],
      angleAt: () => 0,
      uFromPoint: x => x
    };
  }

  const R = (W * W * 0.25 + a * a) / (2 * a);
  const cx = W / 2;
  const apexY = pad + T / 2 + (dir > 0 ? 0 : a);
  const cy = apexY + dir * R;
  const phi = Math.asin(Math.min(1, W / (2 * R)));

  return {
    straight: false,
    W,
    T,
    svgH,
    R,
    dir,
    uPerLen: W / (2 * R * phi),
    point: (u, v) => {
      const th = ((u - cx) / cx) * phi;
      const rho = R - dir * v;
      return [cx + rho * Math.sin(th), cy - dir * rho * Math.cos(th)];
    },
    angleAt: u => dir * ((u - cx) / cx) * phi * DEG,
    uFromPoint: (x, y = 0) => {
      const th = Math.atan2(x - cx, dir * (cy - y));
      return cx + (th / phi) * cx;
    }
  };
};

const fmt = (g: Geometry, u: number, v: number): string => {
  const [x, y] = g.point(u, v);
  return `${round2(x)} ${round2(y)}`;
};

const edgeSeg = (g: Geometry, uTo: number, v: number, ltr: boolean): string => {
  if (g.straight) return `L ${fmt(g, uTo, v)}`;
  const rho = round2(g.R! - g.dir! * v);
  const sweep = ltr === g.dir! > 0 ? 1 : 0;
  return `A ${rho} ${rho} 0 0 ${sweep} ${fmt(g, uTo, v)}`;
};

const bentRectPath = (g: Geometry, u0: number, u1: number, vTop: number, vBot: number, radius: number): string => {
  const rc = Math.max(0, Math.min(radius, (vBot - vTop) / 2, (u1 - u0) / 2));
  return [
    `M ${fmt(g, u0 + rc, vTop)}`,
    edgeSeg(g, u1 - rc, vTop, true),
    `Q ${fmt(g, u1, vTop)} ${fmt(g, u1, vTop + rc)}`,
    `L ${fmt(g, u1, vBot - rc)}`,
    `Q ${fmt(g, u1, vBot)} ${fmt(g, u1 - rc, vBot)}`,
    edgeSeg(g, u0 + rc, vBot, false),
    `Q ${fmt(g, u0, vBot)} ${fmt(g, u0, vBot - rc)}`,
    `L ${fmt(g, u0, vTop + rc)}`,
    `Q ${fmt(g, u0, vTop)} ${fmt(g, u0 + rc, vTop)}`,
    'Z'
  ].join(' ');
};

const bentLinePath = (g: Geometry, u0: number, u1: number, v: number): string =>
  `M ${fmt(g, u0, v)} ${edgeSeg(g, u1, v, true)}`;

const SELECTABLE_TYPES = ['text', 'search', 'tel', 'url', 'password'];

const preserveSpace = (el: SVGTextElement) => {
  el.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
};

export interface CurvedInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  buttonText?: string;
  type?: string;
  name?: string;
  ariaLabel?: string;
  theme?: Theme;
  width?: number | string;
  bend?: number;
  height?: number;
  cornerRadius?: number;
  borderWidth?: number;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  borderColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  iconColor?: string;
  shadowSize?: ShadowSize;
  shadowColor?: string;
  showButton?: boolean;
  showIcon?: boolean;
  icon?: JSX.Element;
  className?: string;
  style?: JSX.CSSProperties;
}

type Layout = {
  btnInset: number;
  chipH: number;
  chipW: number;
  iconU: number;
  textStartU: number;
  textEndU: number;
  btnU0: number;
  btnU1: number;
  winLen: number;
};

type MeasureInput = {
  geom: Geometry | null;
  layout: Layout | null;
  display: string;
  caretIndex: number;
};

export default function CurvedInput(props: CurvedInputProps) {
  const uid = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, '');
  const layoutPathId = `ci-text-${uid}`;
  const buttonPathId = `ci-btn-${uid}`;
  const clipId = `ci-clip-${uid}`;

  let rootEl: HTMLFormElement | undefined;
  let svgEl: SVGSVGElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let textEl: SVGTextElement | undefined;
  let btnMeasureEl: SVGTextElement | undefined;
  let scrollRef = 0;
  let measureInput: MeasureInput = { geom: null, layout: null, display: '', caretIndex: 0 };

  const [w, setW] = createSignal(0);
  const [innerValue, setInnerValue] = createSignal(() => props.defaultValue ?? '');
  const [caretIndex, setCaretIndex] = createSignal(() => (props.defaultValue ?? '').length);
  const [focused, setFocused] = createSignal(false);
  const [caretU, setCaretU] = createSignal(0);
  const [scrollLen, setScrollLen] = createSignal(0);
  const [btnTextW, setBtnTextW] = createSignal(0);
  const [fontTick, setFontTick] = createSignal(0);

  const type = () => props.type ?? 'email';
  const height = () => props.height ?? 64;
  const borderWidth = () => props.borderWidth ?? 1.5;
  const fontSize = () => props.fontSize ?? 16;
  const cornerRadius = () => props.cornerRadius ?? 18;
  const showButton = () => props.showButton ?? true;
  const showIcon = () => props.showIcon ?? true;
  const buttonText = () => props.buttonText ?? 'Get Started';
  const placeholder = () => props.placeholder ?? 'Enter your email';

  const val = createMemo(() => (props.value !== undefined ? props.value : innerValue()));
  const display = createMemo(() => (type() === 'password' ? '•'.repeat(val().length) : val()));

  const colors = createMemo(() => {
    const palette = THEMES[props.theme ?? 'dark'] || THEMES.dark;
    return {
      bg: props.backgroundColor ?? palette.backgroundColor,
      fg: props.textColor ?? palette.textColor,
      ph: props.placeholderColor ?? palette.placeholderColor,
      stroke: props.borderColor ?? palette.borderColor,
      accent: props.buttonColor ?? palette.buttonColor,
      btnFg: props.buttonTextColor ?? palette.buttonTextColor,
      shadow: props.shadowColor ?? palette.shadowColor
    };
  });

  const pad = () => Math.ceil(borderWidth() / 2) + 6;
  const geom = createMemo<Geometry | null>(() =>
    w() > 2 ? buildGeometry(w(), props.bend ?? 28, height(), pad()) : null
  );

  const layout = createMemo<Layout | null>(() => {
    const g = geom();
    if (!g) return null;
    const T = height();
    const fs = fontSize();
    const btnInset = Math.max(5, borderWidth() + 4);
    const chipH = Math.min(34, Math.max(16, T * 0.34));
    const chipW = chipH * 1.25;
    const iconU = 22 + chipW / 2;
    const textStartU = showIcon() ? 22 + chipW + 13 : 24;
    const btnW = showButton() ? Math.max(btnTextW() + fs * 2.7, T * 1.35) : 0;
    const btnU1 = g.W - btnInset;
    const btnU0 = btnU1 - btnW;
    const textEndU = Math.max(textStartU + 20, showButton() ? btnU0 - 14 : g.W - 24);
    const winLen = (textEndU - textStartU) / g.uPerLen;
    return { btnInset, chipH, chipW, iconU, textStartU, textEndU, btnU0, btnU1, winLen };
  });

  const measureButton = () => {
    if (!btnMeasureEl) return;
    const bw = btnMeasureEl.getComputedTextLength();
    setBtnTextW(prev => (Math.abs(prev - bw) > 0.5 ? bw : prev));
  };

  const measure = () => {
    const { geom: g, layout: l, display: text, caretIndex: index } = measureInput;
    if (!g || !l) return;
    const caret = Math.min(index, text.length);
    let caretLen = 0;
    let totalLen = 0;
    if (textEl && text.length) {
      try {
        totalLen = textEl.getSubStringLength(0, text.length);
        caretLen = caret > 0 ? textEl.getSubStringLength(0, caret) : 0;
      } catch {
        totalLen = 0;
        caretLen = 0;
      }
    }
    let next = scrollRef;
    if (caretLen - next > l.winLen - 2) next = caretLen - l.winLen + 2;
    if (caretLen - next < 0) next = caretLen;
    if (totalLen - next < l.winLen) next = Math.max(0, totalLen - l.winLen);
    next = Math.max(0, next);
    if (Math.abs(next - scrollRef) > 0.5) {
      scrollRef = next;
      setScrollLen(next);
    }
    setCaretU(l.textStartU + (caretLen - next) * g.uPerLen);
  };

  createEffect(
    () => {
      buttonText();
      fontSize();
      fontTick();
      return geom() !== null;
    },
    () => {
      measureButton();
    }
  );

  createEffect(
    () => {
      fontSize();
      fontTick();
      measureInput = { geom: geom(), layout: layout(), display: display(), caretIndex: caretIndex() };
    },
    () => {
      measure();
    }
  );

  const view = createMemo(() => {
    const g = geom();
    const l = layout();
    if (!g || !l) return null;
    const T = height();
    const fs = fontSize();
    const cr = cornerRadius();
    const vBase = fs * 0.34;
    const scrollU = scrollLen() * g.uPerLen;
    const { chipW, chipH } = l;
    const ew = chipW * 0.5;
    const eh = chipH * 0.5;
    const sw = Math.max(1.1, chipH * 0.075);
    const [ix, iy] = g.point(l.iconU, 0);
    const btnH = T - l.btnInset * 2;
    return {
      g,
      l,
      T,
      fs,
      svgH: round2(g.svgH),
      bandPath: bentRectPath(g, 0, g.W, -T / 2, T / 2, cr),
      layoutPath: bentLinePath(g, l.textStartU - scrollU, g.W, vBase),
      clipPath: bentRectPath(g, l.textStartU - 6, l.textEndU + 8, -T / 2, T / 2, 0),
      ew,
      eh,
      sw,
      iconTransform: `translate(${round2(ix)} ${round2(iy)}) rotate(${round2(g.angleAt(l.iconU))})`,
      caretH: Math.min(T * 0.58, fs * 1.45),
      buttonPath: showButton()
        ? bentRectPath(g, l.btnU0, l.btnU1, -T / 2 + l.btnInset, T / 2 - l.btnInset, Math.min(cr * 0.72, btnH / 2))
        : '',
      buttonTextPath: showButton() ? bentLinePath(g, l.btnU0, l.btnU1, vBase) : ''
    };
  });

  const caretTransform = createMemo(() => {
    const g = geom();
    if (!g) return '';
    const [x, y] = g.point(caretU(), 0);
    return `translate(${round2(x)} ${round2(y)}) rotate(${round2(g.angleAt(caretU()))})`;
  });

  const caretKeys = createMemo(() => (focused() ? [`${display()}-${Math.min(caretIndex(), display().length)}`] : []));

  const svgStyle = createMemo<JSX.CSSProperties | undefined>(() => {
    const shadow = SHADOWS[props.shadowSize ?? 'md'];
    return shadow
      ? { filter: `drop-shadow(0 ${shadow[0]}px ${shadow[1]}px ${hexToRgba(colors().shadow, shadow[2])})` }
      : undefined;
  });

  const textStyle = () => ({ 'font-size': `${fontSize()}px`, 'font-weight': 500 });

  const commitValue = (v: string) => {
    if (props.value === undefined) setInnerValue(v);
    props.onChange?.(v);
  };

  const syncCaret = (target: HTMLInputElement) => {
    setCaretIndex(target.selectionStart ?? target.value.length);
  };

  const handleSubmit = (e?: Event) => {
    e?.preventDefault();
    props.onSubmit?.(val());
  };

  const handleSurfaceClick = (e: MouseEvent) => {
    const input = inputEl;
    if (!input) return;
    const text = display();
    let idx = text.length;
    const svg = svgEl;
    const g = geom();
    const l = layout();
    if (svg && g && l && textEl && text.length) {
      try {
        const ctm = svg.getScreenCTM();
        if (!ctm) throw new Error('missing screen CTM');
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
        const target = scrollRef + (g.uFromPoint(pt.x, pt.y) - l.textStartU) / g.uPerLen;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i <= text.length; i++) {
          const li = i === 0 ? 0 : textEl.getSubStringLength(0, i);
          const d = Math.abs(li - target);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        idx = best;
      } catch {
        idx = text.length;
      }
    }
    input.focus();
    try {
      input.setSelectionRange(idx, idx);
    } catch {
      idx = Math.min(idx, text.length);
    }
    setCaretIndex(idx);
  };

  const safeType = () => (SELECTABLE_TYPES.includes(type()) ? type() : 'text');
  const inputMode = () => (type() === 'email' ? 'email' : type() === 'number' ? 'decimal' : undefined);

  onSettled(() => {
    const el = rootEl;
    const input = inputEl;
    if (!el || !input) return;
    let alive = true;
    const ro = new ResizeObserver(entries => {
      const cw = entries[0]?.contentRect?.width ?? el.clientWidth;
      setW(Math.round(cw));
    });
    ro.observe(el);
    setW(Math.round(el.clientWidth));
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) setFontTick(t => t + 1);
      });
    }
    const onSelectionChange = () => syncCaret(input);
    input.addEventListener('selectionchange', onSelectionChange);
    return () => {
      alive = false;
      ro.disconnect();
      input.removeEventListener('selectionchange', onSelectionChange);
    };
  });

  return (
    <form
      ref={el => (rootEl = el)}
      class={['curved-input', { 'curved-input--focused': focused() }, props.className]}
      style={{ width: typeof props.width === 'string' ? props.width : `${props.width ?? 450}px`, ...props.style }}
      onSubmit={e => handleSubmit(e)}
      novalidate
    >
      <Show when={view()}>
        {v => (
          <svg
            ref={el => (svgEl = el)}
            class="curved-input__svg"
            width={v().g.W}
            height={v().svgH}
            viewBox={`0 0 ${v().g.W} ${v().svgH}`}
            style={svgStyle()}
            onPointerDown={e => e.preventDefault()}
            onClick={e => handleSurfaceClick(e)}
          >
            <defs>
              <clipPath id={clipId}>
                <path d={v().clipPath} />
              </clipPath>
            </defs>

            <path
              class="curved-input__ring"
              d={v().bandPath}
              fill="none"
              stroke={colors().accent}
              stroke-width={borderWidth() + 6}
            />
            <path d={v().bandPath} fill={colors().bg} stroke={colors().stroke} stroke-width={borderWidth()} />

            <path id={layoutPathId} d={v().layoutPath} fill="none" />

            <Show when={showIcon()}>
              <g transform={v().iconTransform} aria-hidden="true">
                <Show
                  when={props.icon}
                  fallback={
                    <>
                      <rect
                        x={-v().l.chipW / 2}
                        y={-v().l.chipH / 2}
                        width={v().l.chipW}
                        height={v().l.chipH}
                        rx={v().l.chipH * 0.27}
                        fill={props.iconColor || colors().accent}
                      />
                      <rect
                        x={-v().ew / 2}
                        y={-v().eh / 2}
                        width={v().ew}
                        height={v().eh}
                        rx={1.4}
                        fill="none"
                        stroke={colors().btnFg}
                        stroke-width={v().sw}
                        stroke-linejoin="round"
                      />
                      <path
                        d={`M ${round2(-v().ew / 2)} ${round2(-v().eh / 2 + v().sw * 0.4)} L 0 ${round2(v().eh * 0.14)} L ${round2(v().ew / 2)} ${round2(-v().eh / 2 + v().sw * 0.4)}`}
                        fill="none"
                        stroke={colors().btnFg}
                        stroke-width={v().sw}
                        stroke-linejoin="round"
                        stroke-linecap="round"
                      />
                    </>
                  }
                >
                  {props.icon}
                </Show>
              </g>
            </Show>

            <g clip-path={`url(#${clipId})`}>
              <text
                ref={el => {
                  textEl = el;
                  preserveSpace(el);
                }}
                style={textStyle()}
                fill={colors().fg}
                aria-hidden="true"
              >
                <textPath href={`#${layoutPathId}`}>{display()}</textPath>
              </text>
              <Show when={!display() && placeholder()}>
                <text ref={preserveSpace} style={textStyle()} fill={colors().ph} aria-hidden="true">
                  <textPath href={`#${layoutPathId}`}>{placeholder()}</textPath>
                </text>
              </Show>
              <For each={caretKeys()}>
                {() => (
                  <g transform={caretTransform()}>
                    <line
                      y1={-v().caretH / 2}
                      y2={v().caretH / 2}
                      stroke={colors().fg}
                      stroke-width="1.5"
                      stroke-linecap="round"
                    >
                      <animate
                        attributeName="opacity"
                        values="1;0"
                        dur="1.06s"
                        calcMode="discrete"
                        repeatCount="indefinite"
                      />
                    </line>
                  </g>
                )}
              </For>
            </g>

            <Show when={showButton()}>
              <g
                class="curved-input__button"
                role="button"
                tabindex={0}
                aria-label={buttonText()}
                onClick={e => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                onPointerDown={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              >
                <path class="curved-input__button-bg" d={v().buttonPath} fill={colors().accent} />
                <path id={buttonPathId} d={v().buttonTextPath} fill="none" />
                <text
                  fill={colors().btnFg}
                  text-anchor="middle"
                  style={{ 'font-size': `${fontSize()}px`, 'font-weight': 500, 'pointer-events': 'none' }}
                >
                  <textPath href={`#${buttonPathId}`} startOffset="50%">
                    {buttonText()}
                  </textPath>
                </text>
              </g>
            </Show>

            <text
              ref={el => (btnMeasureEl = el)}
              style={textStyle()}
              x="-9999"
              y="-9999"
              visibility="hidden"
              aria-hidden="true"
            >
              {buttonText()}
            </text>
          </svg>
        )}
      </Show>
      <input
        ref={el => (inputEl = el)}
        class="curved-input__field"
        type={safeType()}
        inputmode={inputMode()}
        name={props.name}
        value={val()}
        onInput={e => {
          commitValue(e.currentTarget.value);
          syncCaret(e.currentTarget);
        }}
        onSelect={e => syncCaret(e.currentTarget)}
        onKeyUp={e => syncCaret(e.currentTarget)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={props.ariaLabel || placeholder() || 'Curved input'}
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
      />
    </form>
  );
}
