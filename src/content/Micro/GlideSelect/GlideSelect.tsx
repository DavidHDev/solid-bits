import { For, Show, createEffect, createMemo, createSignal, createUniqueId, onSettled, untrack } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { ArrowDown01Icon, Tick02Icon } from '@hugeicons/core-free-icons';

import './GlideSelect.css';

export interface GlideSelectOption {
  value: string;
  label: JSX.Element;
  tag?: string;
}

export interface GlideSelectProps {
  options?: (string | GlideSelectOption)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: GlideSelectOption) => void;
  placeholder?: string;
  showTags?: boolean;
  accentColor?: string;
  surfaceColor?: string;
  highlightColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: number;
  menuWidth?: number;
  placement?: 'top' | 'bottom';
  align?: 'left' | 'right';
  popDuration?: number;
  glideDuration?: number;
  rememberPosition?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

type Phase = 'closed' | 'open' | 'closing';
type IconSvgElement = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const SIZES: Record<string, { chip: number; row: number; font: number }> = {
  sm: { chip: 28, row: 26, font: 12 },
  md: { chip: 32, row: 30, font: 13 },
  lg: { chip: 44, row: 40, font: 14 }
};
const PAD = 4;
const GAP = 1;
const MENU_GAP = 6;
const DEFAULT_OPTIONS: (string | GlideSelectOption)[] = ['One', 'Two', 'Three'];

const norm = (o: string | GlideSelectOption): GlideSelectOption => (typeof o === 'string' ? { value: o, label: o } : o);
const textOf = (it: GlideSelectOption) => (typeof it.label === 'string' ? it.label : it.value);
const typeaheadIndex = (items: GlideSelectOption[], from: number, ch: string) => {
  const c = ch.toLowerCase();
  const n = items.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (textOf(items[i]).toLowerCase().startsWith(c)) return i;
  }
  return from;
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

export default function GlideSelect(props: GlideSelectProps) {
  const items = createMemo(() => (props.options ?? DEFAULT_OPTIONS).map(norm));
  const [inner, setInner] = createSignal(() => props.defaultValue ?? '');
  const current = createMemo(() => props.value ?? inner());
  const selected = createMemo(() => items().findIndex(it => it.value === current()));
  const [phase, setPhaseSignal] = createSignal<Phase>('closed');
  const [active, setActive] = createSignal<number | null>(null);
  const [side, setSide] = createSignal<'top' | 'bottom'>(untrack(() => props.placement ?? 'bottom'));
  let rootEl: HTMLDivElement | undefined;
  let triggerEl: HTMLButtonElement | undefined;
  let menuEl: HTMLDivElement | undefined;
  let pillEl: HTMLSpanElement | undefined;
  let phaseNow: Phase = 'closed';
  let instant = false;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let scrub: { id: number; top: number } | null = null;
  let lastPhase: Phase = 'closed';
  const id = createUniqueId();

  const size = () => props.size ?? 'md';
  const S = () => SIZES[size()] ?? SIZES.md;
  const step = () => S().row + GAP;
  const popDuration = () => props.popDuration ?? 180;
  const popOut = () => Math.round((popDuration() * 2) / 3);
  const radius = () => props.radius ?? 10;
  const align = () => props.align ?? 'left';

  const setPhase = (p: Phase) => {
    phaseNow = p;
    setPhaseSignal(p);
  };

  const openMenu = (sel: number, st: number, placement: 'top' | 'bottom') => {
    const el = menuEl;
    const root = rootEl;
    if (!el || !root) return;
    const r = root.getBoundingClientRect();
    const need = el.offsetHeight + MENU_GAP;
    setSide(
      placement === 'bottom' && r.bottom + need > window.innerHeight
        ? 'top'
        : placement === 'top' && r.top - need < 0
          ? 'bottom'
          : placement
    );
    el.style.transitionDuration = instant ? '0ms' : '';
    el.dataset.state = 'closed';
    void el.offsetHeight;
    el.dataset.state = 'open';
    const pill = pillEl;
    if (pill) {
      pill.style.transition = 'none';
      pill.style.transform = `translateY(${Math.max(0, sel) * st}px)`;
      pill.style.opacity = '0';
      void pill.offsetHeight;
      pill.style.transition = '';
    }
  };

  const movePill = (a: number | null, st: number) => {
    const pill = pillEl;
    if (!pill) return;
    if (a === null) {
      pill.style.opacity = '0';
      return;
    }
    const jump = instant || pill.style.opacity !== '1';
    pill.style.transitionDuration = jump ? '0ms, 150ms' : '';
    pill.style.transform = `translateY(${a * st}px)`;
    pill.style.opacity = '1';
    instant = false;
  };

  createEffect(
    () => ({
      a: active(),
      p: phase(),
      st: step(),
      sel: untrack(selected),
      placement: untrack(() => props.placement ?? 'bottom')
    }),
    ({ a, p, st, sel, placement }) => {
      const changed = p !== lastPhase;
      lastPhase = p;
      if (p !== 'open') return;
      if (changed) openMenu(sel, st, placement);
      movePill(a, st);
    }
  );

  const open = (viaKey: boolean) => {
    if (props.disabled) return;
    clearTimeout(closeTimer);
    instant = true;
    const sel = selected();
    setActive(sel >= 0 ? sel : viaKey ? 0 : null);
    setPhase('open');
  };
  const close = (mode: 'instant' | 'pop') => {
    setActive(null);
    clearTimeout(closeTimer);
    const el = phaseNow !== 'closed' ? menuEl : undefined;
    if (mode === 'instant' || !el) {
      setPhase('closed');
      return;
    }
    el.style.transitionDuration = '';
    el.dataset.state = 'closed';
    setPhase('closing');
    closeTimer = setTimeout(() => setPhase('closed'), popOut() + 20);
  };
  const pick = (i: number, viaKey: boolean) => {
    const it = items()[i];
    if (!it) {
      close('instant');
      return;
    }
    if (it.value !== current()) {
      if (props.value === undefined) setInner(it.value);
      props.onChange?.(it.value, it);
      if (!viaKey && rootEl) rootEl.dataset.swap = '';
    }
    close('instant');
    triggerEl?.focus({ preventScroll: true });
  };

  const onTriggerKey = (e: KeyboardEvent) => {
    const k = e.key;
    const list = items();
    const n = list.length;
    const act = active();
    const cur = act ?? Math.max(0, selected());
    if (phase() !== 'open') {
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        open(true);
      }
      return;
    }
    const go = (i: number) => {
      e.preventDefault();
      instant = true;
      setActive(Math.min(n - 1, Math.max(0, i)));
    };
    if (k === 'ArrowDown' || k === 'ArrowUp') go(act === null ? cur : cur + (k === 'ArrowDown' ? 1 : -1));
    else if (k === 'Home' || k === 'End') go(k === 'Home' ? 0 : n - 1);
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pick(cur, true);
    } else if (k === 'Escape' || k === 'Tab') {
      if (k === 'Escape') e.preventDefault();
      close('instant');
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) go(typeaheadIndex(list, cur, k));
  };

  createEffect(
    () => phase() !== 'closed',
    isOpen => {
      if (!isOpen) return;
      const onDown = (e: PointerEvent) => {
        if (rootEl && !rootEl.contains(e.target as Node)) close('pop');
      };
      document.addEventListener('pointerdown', onDown, true);
      return () => document.removeEventListener('pointerdown', onDown, true);
    }
  );

  createEffect(
    () => !!props.disabled,
    disabled => {
      if (disabled && phaseNow !== 'closed') close('instant');
    }
  );

  onSettled(() => () => clearTimeout(closeTimer));

  const rowAt = (y: number) => {
    const s = scrub;
    if (!s) return null;
    const i = Math.floor((y - s.top - PAD) / step());
    return i >= 0 && i < items().length ? i : null;
  };
  const onListDown = (e: PointerEvent & { currentTarget: HTMLDivElement }) => {
    if (scrub) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      void 0;
    }
    scrub = { id: e.pointerId, top: e.currentTarget.getBoundingClientRect().top };
    instant = true;
    setActive(rowAt(e.clientY));
  };
  const onListMove = (e: PointerEvent) => {
    if (!scrub || scrub.id !== e.pointerId) return;
    const i = rowAt(e.clientY);
    if (i !== active()) setActive(i);
  };
  const onListUp = (e: PointerEvent) => {
    if (!scrub || scrub.id !== e.pointerId) return;
    const i = e.type === 'pointerup' ? rowAt(e.clientY) : null;
    scrub = null;
    if (i !== null) pick(i, false);
    else if (!(props.rememberPosition ?? true)) setActive(null);
  };
  const onListOver = (e: PointerEvent) => {
    if (e.pointerType === 'touch' || scrub) return;
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
    if (!row) return;
    const i = Number(row.dataset.index);
    if (i !== active()) setActive(i);
  };

  const origin = () => `${side() === 'bottom' ? 'top' : 'bottom'} ${align()}`;

  return (
    <div
      ref={el => (rootEl = el)}
      class={['glide-select', props.className]}
      data-size={size()}
      data-disabled={props.disabled ? '' : undefined}
      style={{
        '--gs-accent': props.accentColor ?? '#f5f5f5',
        '--gs-surface': props.surfaceColor ?? '#27272a',
        '--gs-highlight': props.highlightColor ?? '#3f3f46',
        '--gs-text': props.textColor ?? '#f5f5f5',
        '--gs-radius': `${radius()}px`,
        '--gs-inner-radius': `${Math.max(3, radius() - 4)}px`,
        '--gs-chip': `${S().chip}px`,
        '--gs-row': `${S().row}px`,
        '--gs-font': `${S().font}px`,
        '--gs-menu-w': `${props.menuWidth ?? 176}px`,
        '--gs-pop': `${popDuration()}ms`,
        '--gs-pop-out': `${popOut()}ms`,
        '--gs-glide': `${props.glideDuration ?? 220}ms`,
        '--gs-origin': origin()
      }}
      onAnimationEnd={e => {
        if (e.animationName === 'gs-swap' && rootEl) delete rootEl.dataset.swap;
      }}
    >
      <button
        ref={el => (triggerEl = el)}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={phase() === 'open' ? 'true' : 'false'}
        aria-controls={`${id}-list`}
        aria-activedescendant={active() !== null ? `${id}-${active()}` : undefined}
        aria-label={props.ariaLabel ?? 'Select'}
        disabled={props.disabled ?? false}
        class="glide-select__trigger"
        onPointerDown={e => {
          if (e.button !== 0 || props.disabled) return;
          e.currentTarget.focus({ preventScroll: true });
          if (phase() === 'open') close('pop');
          else open(false);
        }}
        onKeyDown={onTriggerKey}
      >
        <For each={[current()]}>
          {() => (
            <span class="glide-select__label" data-empty={selected() < 0 ? '' : undefined}>
              {selected() >= 0 ? items()[selected()].label : (props.placeholder ?? 'Select…')}
            </span>
          )}
        </For>
        <span class="glide-select__chevron" aria-hidden="true">
          <Icon icon={ArrowDown01Icon} size={12} strokeWidth={2.5} />
        </span>
      </button>
      <Show when={phase() !== 'closed'}>
        <div
          ref={el => (menuEl = el)}
          class="glide-select__menu"
          data-state="open"
          data-side={side()}
          data-align={align()}
        >
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label={props.ariaLabel ?? 'Select'}
            class="glide-select__list"
            data-live={active() !== null ? '' : undefined}
            onPointerOver={onListOver}
            onPointerLeave={() => {
              if (!scrub && !(props.rememberPosition ?? true)) setActive(null);
            }}
            onPointerDown={onListDown}
            onPointerMove={onListMove}
            onPointerUp={onListUp}
            onPointerCancel={onListUp}
            onLostPointerCapture={onListUp}
          >
            <span ref={el => (pillEl = el)} class="glide-select__pill" aria-hidden="true" />
            <For each={items()}>
              {(it, i) => (
                <div
                  id={`${id}-${i()}`}
                  role="option"
                  aria-selected={i() === selected() ? 'true' : 'false'}
                  data-index={i()}
                  class="glide-select__option"
                >
                  <span class="glide-select__name">{it.label}</span>
                  <Show when={(props.showTags ?? true) && it.tag}>
                    <span class="glide-select__tag">{it.tag}</span>
                  </Show>
                  <span class="glide-select__check" data-on={i() === selected() ? '' : undefined} aria-hidden="true">
                    <Icon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
}
