import { Show, createSignal, onSettled } from 'solid-js';
import { Portal, type JSX } from '@solidjs/web';

export default function DocsTooltip(props: {
  label: string;
  placement?: 'top' | 'bottom' | 'right' | 'left';
  gutter?: number;
  openDelay?: number;
  closeDelay?: number;
  children: JSX.Element;
}) {
  let anchorEl: HTMLSpanElement | undefined;
  const [visible, setVisible] = createSignal(false);
  const [position, setPosition] = createSignal<{ x: number; y: number } | null>(null);
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const placement = () => props.placement ?? 'top';
  const target = () => (anchorEl?.firstElementChild as HTMLElement | null) ?? anchorEl ?? null;

  const measure = () => {
    const el = target();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const g = props.gutter ?? 8;
    const p = placement();
    if (p === 'top') setPosition({ x: rect.left + rect.width / 2, y: rect.top - g });
    else if (p === 'bottom') setPosition({ x: rect.left + rect.width / 2, y: rect.bottom + g });
    else if (p === 'right') setPosition({ x: rect.right + g, y: rect.top + rect.height / 2 });
    else setPosition({ x: rect.left - g, y: rect.top + rect.height / 2 });
  };

  const show = (delay = props.openDelay ?? 300) => {
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    openTimer = setTimeout(() => {
      measure();
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => setVisible(false), props.closeDelay ?? 80);
  };

  const onOver = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const from = event.relatedTarget as Node | null;
    if (from && anchorEl?.contains(from)) return;
    show();
  };

  const onOut = (event: PointerEvent) => {
    const to = event.relatedTarget as Node | null;
    if (to && anchorEl?.contains(to)) return;
    hide();
  };

  onSettled(() => () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  });

  return (
    <>
      <span
        ref={el => (anchorEl = el)}
        class="docs-tooltip-anchor"
        onPointerOver={onOver}
        onPointerOut={onOut}
        onFocusIn={() => show(0)}
        onFocusOut={hide}
        onPointerDown={hide}
      >
        {props.children}
      </span>
      <Show when={visible() && position()}>
        {pos => (
          <Portal>
            <div
              class="docs-tooltip docs-tooltip--floating"
              role="tooltip"
              data-placement={placement()}
              style={{ left: `${pos().x}px`, top: `${pos().y}px` }}
            >
              {props.label}
            </div>
          </Portal>
        )}
      </Show>
    </>
  );
}
