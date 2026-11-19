import { For, createEffect, createSignal } from 'solid-js';
import { useInView } from '../hooks/useInView';

const VARIANTS = [
  { label: 'Solid 2.0', accent: 'rgba(255,255,255,0.5)' },
  { label: 'TypeScript', accent: 'rgba(255,255,255,0.5)' },
  { label: 'Signals', accent: 'rgba(255,255,255,0.5)' },
  { label: 'Plain CSS', accent: 'rgba(255,255,255,0.5)' }
];

export default function VariantTabs() {
  const [ref, visible] = useInView();
  const [active, setActive] = createSignal(0);

  createEffect(visible, isVisible => {
    if (!isVisible) return;
    const timer = window.setInterval(() => {
      setActive(value => (value + 1) % VARIANTS.length);
    }, 2200);
    return () => window.clearInterval(timer);
  });

  return (
    <div ref={ref} class="ln-feat-vrows">
      <For each={VARIANTS} keyed={false}>
        {(v, i) => (
          <div class="ln-feat-vrow" style={{ opacity: i === active() ? 1 : 0.3, transition: 'opacity 0.4s ease' }}>
            <div class="ln-feat-vrow-dot" style={{ background: v().accent }} />
            <span class="ln-feat-vrow-label">{v().label}</span>
            <div class="ln-feat-vrow-bars">
              <div class="ln-feat-vrow-bar" style={{ width: `${35 + i * 8}%` }} />
              <div class="ln-feat-vrow-bar" style={{ width: `${20 + ((i + 2) % 4) * 7}%` }} />
              <div class="ln-feat-vrow-bar" style={{ width: `${45 + ((i + 1) % 3) * 10}%` }} />
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
