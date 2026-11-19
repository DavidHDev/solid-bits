import { Show, createEffect, createSignal, onSettled } from 'solid-js';
import { Portal, type JSX } from '@solidjs/web';
import { animate } from 'motion';
import { DocsMenuContext, prefersReducedMotion } from './docsMenuContext';

type Box = { x: number; y: number; width: number; height: number; visible: boolean };

export default function DocsMenu(props: {
  trigger: JSX.Element;
  children: JSX.Element;
  placement?: 'bottom-end' | 'bottom-start';
  gutter?: number;
  offset?: number;
  minWidth?: string;
  zIndex?: number;
  contentClass?: string;
  fluid?: boolean;
  transformOrigin?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = createSignal(false);
  const [rect, setRect] = createSignal<DOMRect | null>(null);
  let anchorEl: HTMLSpanElement | undefined;
  let contentEl: HTMLDivElement | undefined;
  let highlightEl: HTMLDivElement | undefined;
  let highlighted: HTMLElement | null = null;
  let box: Box | null = null;
  let observer: ResizeObserver | null = null;

  const placement = () => props.placement ?? 'bottom-end';
  const fluid = () => props.fluid ?? true;
  const trigger = () => (anchorEl?.firstElementChild as HTMLElement | null) ?? anchorEl ?? null;

  const applyBox = (next: Box, instant: boolean) => {
    const el = highlightEl;
    if (!el) return;
    const reduce = prefersReducedMotion();
    if (instant || reduce || !box) {
      el.style.transform = `translate(${next.x}px, ${next.y}px)`;
      el.style.width = `${next.width}px`;
      el.style.height = `${next.height}px`;
      el.style.opacity = next.visible ? '1' : '0';
      box = next;
      return;
    }
    const from = box;
    box = next;
    animate(
      el,
      { x: [from.x, next.x], y: [from.y, next.y], width: [from.width, next.width], height: [from.height, next.height] },
      { type: 'spring', stiffness: 550, damping: 42, mass: 0.7 }
    );
    animate(el, { opacity: next.visible ? 1 : 0 }, { duration: 0.12 });
  };

  const measureBox = (activate: boolean) => {
    const item = highlighted;
    if (!item || !fluid()) return;
    const next = {
      x: item.offsetLeft,
      y: item.offsetTop,
      width: item.offsetWidth,
      height: item.offsetHeight,
      visible: activate || box?.visible || false
    };
    const prev = box;
    if (
      prev &&
      prev.x === next.x &&
      prev.y === next.y &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.visible === next.visible
    )
      return;
    applyBox(next, !prev);
  };

  const highlight = (el: HTMLElement | null) => {
    if (highlighted === el) return;
    highlighted?.removeAttribute('data-highlighted');
    highlighted = el;
    if (el) {
      el.setAttribute('data-highlighted', '');
      measureBox(true);
    }
  };

  const items = () =>
    Array.from(contentEl?.querySelectorAll<HTMLElement>('[data-part="item"]:not([data-disabled])') ?? []);

  const updateRect = () => {
    const el = trigger();
    if (el) setRect(el.getBoundingClientRect());
  };

  const close = (focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) trigger()?.focus({ preventScroll: true });
  };

  const onDocPointer = (event: PointerEvent) => {
    const target = event.target as Node;
    if (anchorEl?.contains(target) || contentEl?.contains(target)) return;
    close();
  };

  const onDocKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close(true);
  };

  const detach = () => {
    document.removeEventListener('pointerdown', onDocPointer, true);
    document.removeEventListener('keydown', onDocKey);
    window.removeEventListener('scroll', updateRect, true);
    window.removeEventListener('resize', updateRect);
    observer?.disconnect();
    observer = null;
  };

  createEffect(open, value => {
    props.onOpenChange?.(value);
    trigger()?.setAttribute('data-state', value ? 'open' : 'closed');
    if (!value) {
      detach();
      highlighted = null;
      box = null;
      return;
    }
    updateRect();
    document.addEventListener('pointerdown', onDocPointer, true);
    document.addEventListener('keydown', onDocKey);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    requestAnimationFrame(() => {
      contentEl?.focus({ preventScroll: true });
      if (contentEl) {
        observer = new ResizeObserver(() => measureBox(false));
        observer.observe(contentEl);
      }
    });
  });

  onSettled(() => detach);

  const onTriggerKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' && !open()) {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => highlight(items()[0] ?? null));
    }
  };

  const onContentKey = (event: KeyboardEvent) => {
    const list = items();
    if (!list.length) return;
    const index = highlighted ? list.indexOf(highlighted) : -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      highlight(list[(index + delta + list.length) % list.length]);
      if (box && !box.visible) applyBox({ ...box, visible: true }, false);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      highlight(event.key === 'Home' ? list[0] : list[list.length - 1]);
    } else if ((event.key === 'Enter' || event.key === ' ') && highlighted) {
      event.preventDefault();
      highlighted.click();
    } else if (event.key === 'Tab') {
      close();
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-part="item"]:not([data-disabled])');
    if (item) {
      highlight(item);
      if (box && !box.visible) applyBox({ ...box, visible: true }, false);
    }
  };

  const onPointerLeave = () => {
    if (box) applyBox({ ...box, visible: false }, false);
    highlighted?.removeAttribute('data-highlighted');
    highlighted = null;
  };

  const contentStyle = (): JSX.CSSProperties => {
    const r = rect();
    const style: JSX.CSSProperties = {
      position: 'fixed',
      'z-index': props.zIndex ?? 1500,
      isolation: 'isolate',
      'transform-origin': props.transformOrigin ?? (placement() === 'bottom-end' ? 'top right' : 'top left')
    };
    if (props.minWidth) style['min-width'] = props.minWidth;
    if (!r) return style;
    style.top = `${r.bottom + (props.gutter ?? 8) + (props.offset ?? 0)}px`;
    if (placement() === 'bottom-end') style.right = `${Math.max(0, window.innerWidth - r.right)}px`;
    else style.left = `${r.left}px`;
    return style;
  };

  return (
    <DocsMenuContext value={{ close }}>
      <span
        ref={el => (anchorEl = el)}
        class="docs-menu-anchor"
        onClick={() => setOpen(value => !value)}
        onKeyDown={onTriggerKey}
      >
        {props.trigger}
      </span>
      <Show when={open()}>
        <Portal>
          <div
            ref={el => (contentEl = el)}
            role="menu"
            tabindex="-1"
            class={[props.contentClass, { 'docs-menu docs-menu--fluid': fluid() }]}
            style={contentStyle()}
            onKeyDown={onContentKey}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
          >
            {props.children}
            <Show when={fluid()}>
              <div
                ref={el => (highlightEl = el)}
                aria-hidden="true"
                data-menu-highlight=""
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  'z-index': 0,
                  'border-radius': '9px',
                  background: 'var(--menu-highlight)',
                  'pointer-events': 'none',
                  opacity: 0
                }}
              />
            </Show>
          </div>
        </Portal>
      </Show>
    </DocsMenuContext>
  );
}
