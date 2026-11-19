import { For, createEffect, createMemo, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  CursorPointer01Icon,
  Download04Icon,
  Layers01Icon,
  Notification03Icon,
  PaintBoardIcon,
  Rocket01Icon,
  Settings02Icon,
  TextFontIcon
} from '@hugeicons/core-free-icons';
import './BranchedMenu.css';

export type IconSvgElement =
  | [string, { [key: string]: string | number }][]
  | readonly (readonly [string, { readonly [key: string]: string | number }])[];

export interface BranchedMenuChild {
  value: string;
  label: string;
  icon?: JSX.Element | IconSvgElement;
}

export interface BranchedMenuItem {
  label: string;
  value?: string;
  children?: BranchedMenuChild[];
}

export interface BranchedMenuProps {
  items?: BranchedMenuItem[];
  defaultOpen?: number | number[];
  defaultActive?: string;
  onSelect?: (value: string, item: BranchedMenuChild | BranchedMenuItem) => void;
  onToggle?: (index: number, open: boolean) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
}

const DEFAULT_ITEMS: BranchedMenuItem[] = [
  {
    label: 'Getting started',
    children: [
      { value: 'install', label: 'Installation', icon: Download04Icon },
      { value: 'quick', label: 'Quick start', icon: Rocket01Icon },
      { value: 'config', label: 'Configuration', icon: Settings02Icon },
      { value: 'theming', label: 'Theming', icon: PaintBoardIcon }
    ]
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons', icon: CursorPointer01Icon },
      { value: 'typography', label: 'Typography', icon: TextFontIcon },
      { value: 'overlays', label: 'Overlays', icon: Layers01Icon },
      { value: 'toasts', label: 'Toasts', icon: Notification03Icon }
    ]
  }
];
const PAD = 6;
const MARK = 16;

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

const renderIcon = (icon: JSX.Element | IconSvgElement) =>
  isIconData(icon) ? <Icon icon={icon} size={16} strokeWidth={1.8} /> : (icon as JSX.Element);
const toSet = (open: number | number[]) => new Set(Array.isArray(open) ? open : open >= 0 ? [open] : []);

export default function BranchedMenu(props: BranchedMenuProps) {
  let navEl: HTMLElement | undefined;
  let markerEl: HTMLSpanElement | undefined;

  const items = createMemo(() => props.items ?? DEFAULT_ITEMS);
  const rowHeight = () => props.rowHeight ?? 36;
  const indent = () => props.indent ?? 40;
  const trunk = () => props.trunk ?? 14;
  const fontSize = () => props.fontSize ?? 14;

  const [open, setOpen] = createSignal<Set<number>>(() => toSet(props.defaultOpen ?? 0));
  const [active, setActive] = createSignal<string>(() => {
    const defaultActive = props.defaultActive ?? '';
    if (defaultActive) return defaultActive;
    const opened = toSet(props.defaultOpen ?? 0);
    const first = items().find((it, i) => it.children && opened.has(i));
    return first?.children?.[0]?.value ?? '';
  });

  const activeSection = createMemo(() => {
    const value = active();
    return items().findIndex(it => it.children?.some(kid => kid.value === value));
  });
  const markerShown = createMemo(() => activeSection() >= 0 && open().has(activeSection()));

  createEffect(
    () => ({
      section: activeSection(),
      shown: markerShown(),
      items: items(),
      fontSize: fontSize(),
      rowHeight: rowHeight()
    }),
    ({ section, shown }) => {
      const nav = navEl;
      const head = (i: number) =>
        nav?.querySelectorAll<HTMLButtonElement>(':scope > .branched-menu__section > .branched-menu__head')[i];
      const place = (glide: boolean) => {
        const m = markerEl;
        const el = head(section);
        if (!m) return;
        const on = shown && el;
        if (!glide) m.style.transition = 'none';
        if (on) m.style.top = `${el.offsetTop + (el.offsetHeight - MARK) / 2}px`;
        m.toggleAttribute('data-on', Boolean(on));
        if (!glide) {
          void m.offsetHeight;
          m.style.transition = '';
        }
      };
      place(true);
      let first = true;
      const ro = new ResizeObserver(() => {
        if (first) {
          first = false;
          return;
        }
        place(false);
      });
      if (nav) ro.observe(nav);
      return () => ro.disconnect();
    }
  );

  const select = (value: string, item: BranchedMenuChild | BranchedMenuItem) => {
    setActive(value);
    props.onSelect?.(value, item);
  };
  const toggle = (i: number) => {
    const next = new Set(open());
    const isOpen = !next.has(i);
    if (isOpen) next.add(i);
    else next.delete(i);
    setOpen(next);
    props.onToggle?.(i, isOpen);
  };

  const r = () => Math.min(props.radius ?? 10, rowHeight() / 2 - 2);
  const endX = () => indent() - 8;
  const rowY = (k: number) => PAD + k * rowHeight() + rowHeight() / 2;
  const branch = (k: number) =>
    `M ${trunk()} ${rowY(k) - r()} A ${r()} ${r()} 0 0 0 ${trunk() + r()} ${rowY(k)} H ${endX()}`;
  const reach = (k: number) =>
    `M ${trunk()} 0 V ${rowY(k) - r()} A ${r()} ${r()} 0 0 0 ${trunk() + r()} ${rowY(k)} H ${endX()}`;
  const length = (k: number) => rowY(k) - r() + (Math.PI * r()) / 2 + (endX() - trunk() - r());

  return (
    <nav
      ref={el => (navEl = el)}
      class={['branched-menu', props.className]}
      style={{
        '--bm-w': `${props.width ?? 240}px`,
        '--bm-ink': props.color ?? '#f5f5f5',
        '--bm-accent': props.accentColor ?? '#f5f5f5',
        '--bm-line': props.lineColor ?? '#3c4046',
        '--bm-font': `${fontSize()}px`,
        '--bm-row': `${rowHeight()}px`,
        '--bm-indent': `${indent()}px`,
        '--bm-line-w': String(props.lineWidth ?? 1.5),
        '--bm-draw': `${props.drawDuration ?? 400}ms`,
        '--bm-fold': `${props.foldDuration ?? 300}ms`
      }}
    >
      <span ref={el => (markerEl = el)} class="branched-menu__marker" aria-hidden="true" />
      <For each={items()}>
        {(item, i) => {
          const kids = item.children;
          const isOpen = () => (kids ? open().has(i()) : false);
          const leafValue = item.value ?? item.label;
          const leafActive = () => !kids && leafValue === active();
          const bodyH = () => (kids ? PAD * 2 + kids.length * rowHeight() : 0);
          return (
            <div class="branched-menu__section" data-open={isOpen() ? '' : undefined}>
              <button
                type="button"
                class="branched-menu__head"
                aria-expanded={kids ? (isOpen() ? 'true' : 'false') : undefined}
                aria-current={leafActive() ? 'true' : undefined}
                data-active={leafActive() ? '' : undefined}
                onClick={() => (kids ? toggle(i()) : select(leafValue, item))}
              >
                {item.label}
              </button>
              {kids ? (
                <div class="branched-menu__body">
                  <div class="branched-menu__fold">
                    <div class="branched-menu__tree" style={{ height: `${bodyH()}px` }}>
                      <svg class="branched-menu__lines" width={indent()} height={bodyH()} aria-hidden="true">
                        <path class="branched-menu__base" d={`M ${trunk()} 0 V ${rowY(kids.length - 1) - r()}`} />
                        <For each={kids}>{(_kid, k) => <path class="branched-menu__base" d={branch(k())} />}</For>
                        <For each={kids}>
                          {(kid, k) => (
                            <path
                              class="branched-menu__reach"
                              d={reach(k())}
                              style={{
                                'stroke-dasharray': `${length(k())}`,
                                'stroke-dashoffset': `${kid.value === active() ? 0 : length(k())}`
                              }}
                            />
                          )}
                        </For>
                      </svg>
                      <For each={kids}>
                        {kid => (
                          <button
                            type="button"
                            class="branched-menu__item"
                            aria-current={kid.value === active() ? 'true' : undefined}
                            data-active={kid.value === active() ? '' : undefined}
                            tabindex={isOpen() ? 0 : -1}
                            onClick={() => select(kid.value, kid)}
                          >
                            {kid.icon ? (
                              <span class="branched-menu__icon" aria-hidden="true">
                                {renderIcon(kid.icon)}
                              </span>
                            ) : null}
                            <span class="branched-menu__label">{kid.label}</span>
                          </button>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        }}
      </For>
    </nav>
  );
}
