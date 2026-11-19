import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { For, Show, createEffect, createSignal, onSettled } from 'solid-js';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { CATEGORIES } from '@/constants/Categories';
import { categoryIndexPath, getComponentCatalog } from '@/utils/catalog';

const MICRO_COUNT = CATEGORIES.find(category => category.name === 'Micro')?.subcategories.length ?? 0;
const FEATURED = ['Holo Mosaic', 'Gradient Waves', 'Molten Metal', 'Web Threads'];

const catalog = getComponentCatalog();
const ITEMS = [
  ...FEATURED.flatMap(name => {
    const found = catalog.find(item => item.name === name);
    return found ? [{ label: found.name, to: found.path }] : [];
  }).slice(0, 3),
  ...(MICRO_COUNT ? [{ label: `${MICRO_COUNT} Micro components`, to: categoryIndexPath('Micro') }] : [])
];

const INTERVAL = 3200;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function HeroChip() {
  const [index, setIndex] = createSignal(0);
  const [previous, setPrevious] = createSignal(-1);
  const [held, setHeld] = createSignal(false);
  const [widths, setWidths] = createSignal<number[]>([]);
  const labelEls: HTMLElement[] = [];
  let current = 0;

  const item = () => ITEMS[index()] ?? ITEMS[0];

  const measure = () => {
    setWidths(ITEMS.map((_, i) => (labelEls[i] ? Math.ceil(labelEls[i].scrollWidth) : 0)));
  };

  createEffect(held, isHeld => {
    if (isHeld || prefersReducedMotion() || ITEMS.length < 2) return;
    const timer = window.setInterval(() => {
      setPrevious(current);
      current = (current + 1) % ITEMS.length;
      setIndex(current);
    }, INTERVAL);
    return () => window.clearInterval(timer);
  });

  onSettled(() => {
    let active = true;
    measure();
    document.fonts?.ready.then(() => {
      if (active) measure();
    });
    return () => {
      active = false;
    };
  });

  return (
    <Show when={item()}>
      {entry => (
        <a
          href={entry().to}
          class="lh-chip"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={() => setHeld(false)}
        >
          <span class="lh-chip-tag">New</span>
          <span class="lh-chip-roll" style={widths()[index()] ? { width: `${widths()[index()]}px` } : undefined}>
            <For each={ITEMS} keyed={false}>
              {(label, i) => (
                <span
                  ref={el => (labelEls[i] = el)}
                  aria-hidden={i !== index() ? 'true' : 'false'}
                  class={['lh-chip-label', i === index() ? 'is-in' : i === previous() ? 'is-out' : '']}
                >
                  {label().label}
                </span>
              )}
            </For>
          </span>
          <HugeiconsIcon icon={ArrowRight02Icon} size={14} strokeWidth={1.8} />
        </a>
      )}
    </Show>
  );
}
