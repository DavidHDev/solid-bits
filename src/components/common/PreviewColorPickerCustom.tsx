import { ariaBool } from '@/utils/aria';
import { For, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { Portal, type JSX } from '@solidjs/web';
import { ColorPickerIcon, Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import ColorChannelInput from './ColorChannelInput';
import {
  formatColor,
  hsvaToRgba,
  parseColor,
  rgbaToHsva,
  toHex,
  type ColorFormat,
  type Hsva,
  type Rgba
} from './colorMath';

const SWATCHES = [
  '#0aa0ef',
  '#0aa0ef',
  '#0771a6',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#f43f5e',
  '#94a3b8',
  '#ffffff',
  '#6b7280',
  '#000000'
];

const FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl'];
const FORMAT_LABELS: Record<ColorFormat, string> = { hex: 'Hex', rgb: 'RGB', hsl: 'HSL' };
const RGB_KEYS = ['r', 'g', 'b'] as const;
const RECENT_KEY = 'sb-color-recent';
const RECENT_MAX = 10;
const FALLBACK: Hsva = { h: 206, s: 0.48, v: 0.88, a: 1 };
const GAP = 6;
const MARGIN = 8;

const [sharedFormat, setSharedFormat] = createSignal<ColorFormat>('hex');

const readRecent = (): string[] => {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(list) ? list.filter(item => typeof item === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
};

const writeRecent = (value: string) => {
  try {
    const next = [value, ...readRecent().filter(item => item !== value)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    return;
  }
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const round = (value: number) => Math.round(value * 1000) / 1000;

const toState = (color: unknown, previous: Hsva | null) => {
  const rgba = parseColor(color);
  return rgba ? rgbaToHsva(rgba, previous) : previous || FALLBACK;
};

const outputOf = (state: Hsva, withAlpha: boolean) => toHex(hsvaToRgba(state), withAlpha);

const useDrag = (onValue: (point: { x: number; y: number }) => void) => {
  let active = false;
  const read = (event: PointerEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / Math.max(rect.width, 1)),
      y: clamp((event.clientY - rect.top) / Math.max(rect.height, 1))
    };
  };
  return {
    onPointerDown: (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      active = true;
      const el = event.currentTarget as HTMLElement;
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        active = true;
      }
      el.focus({ preventScroll: true });
      onValue(read(event));
    },
    onPointerMove: (event: PointerEvent) => {
      if (active) onValue(read(event));
    },
    onPointerUp: () => {
      active = false;
    },
    onPointerCancel: () => {
      active = false;
    },
    onLostPointerCapture: () => {
      active = false;
    }
  };
};

export default function PreviewColorPickerCustom(props: {
  title?: string;
  color?: string;
  variant?: 'row' | 'swatch';
  alpha?: boolean;
  onChange?: (value: string) => void;
}) {
  const alpha = () => Boolean(props.alpha);
  const chip = () => props.variant === 'swatch';

  const [hsva, setHsva] = createSignal<Hsva>(FALLBACK);
  let hsvaState: Hsva = FALLBACK;
  let initialized = false;
  const [open, setOpen] = createSignal(false);
  const [format, setFormat] = createSignal<ColorFormat>(() => sharedFormat());
  const [anchor, setAnchor] = createSignal<DOMRect | null>(null);
  const [placement, setPlacement] = createSignal<'below' | 'above'>('below');
  const [rowText, setRowText] = createSignal<string | null>(null);
  const [hexText, setHexText] = createSignal<string | null>(null);
  const [copied, setCopied] = createSignal(false);
  const [recent, setRecent] = createSignal<string[]>(readRecent());
  let emitted: string | null = null;
  let openedWith: string | null = null;
  let listening = false;

  let wrapEl: HTMLDivElement | undefined;
  let triggerEl: HTMLButtonElement | undefined;
  let popoverEl: HTMLDivElement | undefined;

  const hasDropper = typeof window !== 'undefined' && 'EyeDropper' in window;

  createEffect(
    () => [props.color, alpha()] as const,
    ([color, withAlpha]) => {
      if (!initialized) {
        initialized = true;
        hsvaState = toState(color, null);
        setHsva(hsvaState);
        return;
      }
      if (color === undefined || color === null) return;
      const incoming = parseColor(color);
      if (!incoming) return;
      if (emitted && toHex(incoming, withAlpha) === emitted) return;
      emitted = null;
      hsvaState = rgbaToHsva(incoming, hsvaState);
      setHsva(hsvaState);
    }
  );

  const output = createMemo(() => outputOf(hsva(), alpha()));
  const rgba = createMemo(() => hsvaToRgba(hsva()));
  const opaque = createMemo(() => toHex({ ...rgba(), a: 1 }));
  const hueColor = createMemo(() => toHex(hsvaToRgba({ h: hsva().h, s: 1, v: 1, a: 1 })));
  const checker = () => alpha() && hsva().a < 1;
  const swatchStyle = (): JSX.CSSProperties => ({ '--cp-color': output() });

  const hsl = createMemo(() => {
    const { r, g, b } = rgba();
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h: Math.round(hsva().h), s: Math.round(clamp(s) * 100), l: Math.round(l * 100) };
  });

  const popWidth = () => (chip() ? 260 : clamp(anchor()?.width ?? 260, 260, 320));
  const popLeft = () => {
    const a = anchor();
    if (!a) return 0;
    const width = popWidth();
    return clamp(chip() ? a.left + a.width / 2 - width / 2 : a.left, MARGIN, window.innerWidth - width - MARGIN);
  };
  const popTop = () => {
    const a = anchor();
    if (!a) return 0;
    return placement() === 'below' ? a.bottom + GAP : a.top - GAP;
  };

  const commit = (next: Hsva) => {
    const value: Hsva = {
      h: clamp(next.h, 0, 360),
      s: clamp(next.s),
      v: clamp(next.v),
      a: alpha() ? clamp(next.a) : 1
    };
    hsvaState = value;
    setHsva(value);
    const hex = outputOf(value, alpha());
    if (hex === emitted) return;
    emitted = hex;
    props.onChange?.(hex);
  };

  const commitColor = (color: Rgba) => commit(rgbaToHsva({ ...color, a: alpha() ? color.a : 1 }, hsvaState));

  const commitSaturation = (next: number) =>
    commitColor({ ...(parseColor(`hsl(${hsl().h}, ${next}%, ${hsl().l}%)`) || rgba()), a: hsvaState.a });

  const commitLightness = (next: number) =>
    commitColor({ ...(parseColor(`hsl(${hsl().h}, ${hsl().s}%, ${next}%)`) || rgba()), a: hsvaState.a });

  const cycleFormat = () => {
    const next = FORMATS[(FORMATS.indexOf(format()) + 1) % FORMATS.length];
    setSharedFormat(next);
    setFormat(next);
  };

  const toggleOpen = () => {
    if (!open()) {
      updateAnchor();
      setRecent(readRecent());
    }
    setOpen(value => !value);
  };

  const close = (focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerEl?.focus({ preventScroll: true });
  };

  const onDocPointer = (event: PointerEvent) => {
    const target = event.target as Node;
    if (wrapEl?.contains(target) || popoverEl?.contains(target)) return;
    close();
  };

  const onDocKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close(true);
    }
  };

  const updateAnchor = () => {
    if (wrapEl) setAnchor(wrapEl.getBoundingClientRect());
  };

  const detach = () => {
    document.removeEventListener('pointerdown', onDocPointer, true);
    document.removeEventListener('keydown', onDocKey, true);
    window.removeEventListener('scroll', updateAnchor, true);
    window.removeEventListener('resize', updateAnchor);
  };

  createEffect(
    () => ({ value: open(), withAlpha: alpha() }),
    ({ value, withAlpha }) => {
      if (value === listening) return;
      listening = value;
      if (value) {
        openedWith = outputOf(hsvaState, withAlpha);
        document.addEventListener('pointerdown', onDocPointer, true);
        document.addEventListener('keydown', onDocKey, true);
        window.addEventListener('scroll', updateAnchor, true);
        window.addEventListener('resize', updateAnchor);
        return;
      }
      detach();
      if (openedWith && openedWith !== outputOf(hsvaState, withAlpha)) writeRecent(outputOf(hsvaState, withAlpha));
      openedWith = null;
    },
    { defer: true }
  );

  createEffect(
    () => [open(), anchor(), format(), alpha(), recent().length] as const,
    ([isOpen, a]) => {
      if (!isOpen || !a) return;
      const frame = requestAnimationFrame(() => {
        if (!popoverEl) return;
        const height = popoverEl.offsetHeight;
        const below = window.innerHeight - a.bottom - GAP - MARGIN;
        const above = a.top - GAP - MARGIN;
        setPlacement(height > below && above > below ? 'above' : 'below');
      });
      return () => cancelAnimationFrame(frame);
    }
  );

  onSettled(() => detach);

  const areaDrag = useDrag(({ x, y }) => commit({ ...hsvaState, s: x, v: 1 - y }));
  const hueDrag = useDrag(({ x }) => commit({ ...hsvaState, h: x * 360 }));
  const alphaDrag = useDrag(({ x }) => commit({ ...hsvaState, a: x }));

  const stepFor = (event: KeyboardEvent) => (event.shiftKey ? 10 : 1);

  const onAreaKey = (event: KeyboardEvent) => {
    const step = stepFor(event) / 100;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step]
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    commit({ ...hsvaState, s: hsvaState.s + move[0], v: hsvaState.v + move[1] });
  };

  const onSliderKey = (event: KeyboardEvent, key: 'h' | 'a', scale: number) => {
    const delta = ({ ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 } as Record<string, number>)[event.key];
    if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const current = hsvaState[key];
    const next =
      event.key === 'Home' ? 0 : event.key === 'End' ? scale : current + (delta * stepFor(event) * scale) / 100;
    commit({ ...hsvaState, [key]: key === 'h' ? clamp(next, 0, 360) : clamp(next) });
  };

  const pick = async () => {
    try {
      const EyeDropperCtor = (
        window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }
      ).EyeDropper;
      const result = await new EyeDropperCtor().open();
      const picked = parseColor(result.sRGBHex);
      if (picked) commitColor({ ...picked, a: hsvaState.a });
    } catch {
      return;
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatColor(hsvaState, format(), alpha()));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const applyText = (text: string, revert: () => void) => {
    const parsed = parseColor(text);
    if (parsed) commitColor(parsed);
    revert();
  };

  const onRowKey = (event: KeyboardEvent) => {
    const input = event.currentTarget as HTMLInputElement;
    if (event.key === 'Enter') {
      applyText(rowText() ?? output(), () => setRowText(outputOf(hsvaState, alpha())));
      input.value = outputOf(hsvaState, alpha());
      input.select();
    } else if (event.key === 'Escape') {
      setRowText(null);
      input.blur();
    }
  };

  const onHexKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return;
    applyText(hexText() ?? '', () => setHexText(toHex(hsvaToRgba(hsvaState), false)));
    (event.currentTarget as HTMLInputElement).select();
  };

  const pickRecent = (item: string) => {
    const parsed = parseColor(item);
    if (parsed) commitColor(parsed);
  };

  return (
    <div ref={el => (wrapEl = el)} class={chip() ? 'scrubber-chip-wrap' : 'scrubber'}>
      <Show
        when={chip()}
        fallback={
          <div class="scrubber-track scrubber-track--color cp-row">
            <button
              ref={el => (triggerEl = el)}
              type="button"
              class="cp-row-trigger"
              aria-haspopup="dialog"
              aria-expanded={ariaBool(open())}
              aria-label={`${props.title ?? ''}: ${output()}`}
              onClick={toggleOpen}
            >
              <span class="scrubber-label">{props.title}</span>
            </button>
            <div class="scrubber-color-controls">
              <button
                type="button"
                class="scrubber-color-swatch-preview cp-preview"
                data-checker={checker() || undefined}
                style={swatchStyle()}
                tabindex="-1"
                aria-hidden="true"
                onClick={toggleOpen}
              />
              <input
                class="scrubber-color-text cp-row-input"
                type="text"
                value={rowText() ?? output()}
                spellcheck="false"
                autocomplete="off"
                aria-label={`${props.title ?? ''} value`}
                onFocus={event => {
                  setRowText(output());
                  event.currentTarget.select();
                }}
                onInput={event => setRowText(event.currentTarget.value)}
                onBlur={() => applyText(rowText() ?? output(), () => setRowText(null))}
                onKeyDown={onRowKey}
              />
            </div>
          </div>
        }
      >
        <button
          ref={el => (triggerEl = el)}
          type="button"
          class="scrubber-color-chip cp-chip"
          data-checker={checker() || undefined}
          style={swatchStyle()}
          aria-label={`${props.title ?? ''}: ${output()}`}
          aria-haspopup="dialog"
          aria-expanded={ariaBool(open())}
          onClick={toggleOpen}
        />
      </Show>

      <Show when={open() && anchor()}>
        <Portal>
          <div
            ref={el => (popoverEl = el)}
            class="cp-popover"
            role="dialog"
            aria-label={`${props.title ?? ''} color`}
            data-placement={placement()}
            style={{
              left: `${popLeft()}px`,
              width: `${popWidth()}px`,
              top: `${popTop()}px`,
              '--cp-hue': hueColor(),
              '--cp-opaque': opaque()
            }}
          >
            <div
              class="cp-area"
              role="slider"
              tabindex="0"
              aria-label="Saturation and brightness"
              aria-valuetext={`Saturation ${Math.round(hsva().s * 100)}%, brightness ${Math.round(hsva().v * 100)}%`}
              onKeyDown={onAreaKey}
              {...areaDrag}
            >
              <span
                class="cp-area-thumb"
                style={{ left: `${hsva().s * 100}%`, top: `${(1 - hsva().v) * 100}%`, background: opaque() }}
              />
            </div>

            <div class="cp-sliders">
              <Show when={hasDropper}>
                <button type="button" class="cp-icon-button" aria-label="Pick a color from the screen" onClick={pick}>
                  <HugeiconsIcon icon={ColorPickerIcon} size={16} strokeWidth={1.6} />
                </button>
              </Show>
              <div class="cp-slider-stack">
                <div
                  class="cp-slider cp-slider--hue"
                  role="slider"
                  tabindex="0"
                  aria-label="Hue"
                  aria-valuemin={0}
                  aria-valuemax={360}
                  aria-valuenow={Math.round(hsva().h)}
                  onKeyDown={event => onSliderKey(event, 'h', 360)}
                  {...hueDrag}
                >
                  <span
                    class="cp-slider-thumb"
                    style={{ left: `${(hsva().h / 360) * 100}%`, background: hueColor() }}
                  />
                </div>
                <Show when={alpha()}>
                  <div
                    class="cp-slider cp-slider--alpha"
                    role="slider"
                    tabindex="0"
                    aria-label="Opacity"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(hsva().a * 100)}
                    onKeyDown={event => onSliderKey(event, 'a', 1)}
                    {...alphaDrag}
                  >
                    <span class="cp-slider-fill" />
                    <span class="cp-slider-thumb" style={{ left: `${hsva().a * 100}%`, '--cp-thumb': output() }} />
                  </div>
                </Show>
              </div>
            </div>

            <div class="cp-fields">
              <button
                type="button"
                class="cp-format"
                aria-label={`Color format: ${FORMAT_LABELS[format()]}. Change format`}
                onClick={cycleFormat}
              >
                {FORMAT_LABELS[format()]}
              </button>
              <Show when={format() === 'hex'}>
                <label class="cp-channel cp-channel--wide">
                  <input
                    class="cp-input"
                    value={hexText() ?? toHex(rgba(), false)}
                    spellcheck="false"
                    autocomplete="off"
                    aria-label="Hex"
                    onFocus={event => {
                      setHexText(toHex(rgba(), false));
                      event.currentTarget.select();
                    }}
                    onInput={event => setHexText(event.currentTarget.value)}
                    onBlur={() => applyText(hexText() ?? '', () => setHexText(null))}
                    onKeyDown={onHexKey}
                  />
                  <span class="cp-channel-label">Hex</span>
                </label>
              </Show>
              <Show when={format() === 'rgb'}>
                <For each={RGB_KEYS}>
                  {key => (
                    <ColorChannelInput
                      label={key.toUpperCase()}
                      value={Math.round(rgba()[key] * 255)}
                      min={0}
                      max={255}
                      onCommit={next => commitColor({ ...rgba(), [key]: next / 255 })}
                    />
                  )}
                </For>
              </Show>
              <Show when={format() === 'hsl'}>
                <ColorChannelInput
                  label="H"
                  value={hsl().h}
                  min={0}
                  max={360}
                  onCommit={next => commit({ ...hsvaState, h: next })}
                />
                <ColorChannelInput label="S" value={hsl().s} min={0} max={100} onCommit={commitSaturation} />
                <ColorChannelInput label="L" value={hsl().l} min={0} max={100} onCommit={commitLightness} />
              </Show>
              <Show when={alpha()}>
                <ColorChannelInput
                  label="A"
                  suffix=" %"
                  value={Math.round(hsva().a * 100)}
                  min={0}
                  max={100}
                  onCommit={next => commit({ ...hsvaState, a: round(next / 100) })}
                />
              </Show>
              <button
                type="button"
                class="cp-icon-button"
                aria-label={copied() ? 'Copied' : 'Copy color'}
                onClick={copy}
              >
                <HugeiconsIcon icon={copied() ? Tick02Icon : Copy01Icon} size={15} strokeWidth={1.6} />
              </button>
            </div>

            <div class="cp-swatches" role="group" aria-label="Swatches">
              <For each={SWATCHES}>
                {swatch => (
                  <button
                    type="button"
                    class="cp-swatch"
                    style={{ '--cp-color': swatch }}
                    aria-label={swatch}
                    aria-pressed={ariaBool(toHex(rgba(), false) === swatch)}
                    onClick={() => commitColor({ ...(parseColor(swatch) as Rgba), a: hsvaState.a })}
                  />
                )}
              </For>
            </div>

            <Show when={recent().length > 0}>
              <div class="cp-recent">
                <span class="cp-recent-label">Recent</span>
                <div class="cp-swatches" role="group" aria-label="Recent colors">
                  <For each={recent()}>
                    {item => (
                      <button
                        type="button"
                        class="cp-swatch"
                        data-checker={item.length > 7 || undefined}
                        style={{ '--cp-color': item }}
                        aria-label={item}
                        aria-pressed={ariaBool(output() === item)}
                        onClick={() => pickRecent(item)}
                      />
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </Portal>
      </Show>
    </div>
  );
}
