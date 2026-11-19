import { Show, createMemo } from 'solid-js';
import { TOTAL_COMPONENTS } from '@/constants/Categories';
import { GITHUB_URL } from '@/constants/cli';
import { isLight } from '@/hooks/useTheme';
import Deferred, { contentLoader } from '../Deferred';
import { LOOK, presetProps } from '../Hero/gradientLook';
import { useNearOnce } from '../hooks/useNearOnce';
import './CTA.css';

const MODULES = import.meta.glob('/src/content/Backgrounds/GradientWaves/GradientWaves.tsx');
const GRADIENT_WAVES = contentLoader(MODULES, '/src/content/Backgrounds/GradientWaves/GradientWaves.tsx');

const ArrowRight = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export default function CTA() {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [cardRef, near] = useNearOnce();
  const lite = () => near() && document.documentElement.hasAttribute('data-lite');
  const look = createMemo(() => presetProps('dusk', { light: isLight(), defaults: LOOK }) as Record<string, unknown>);

  return (
    <div ref={cardRef} class="ln-cta-card">
      <Show when={near() && !prefersReducedMotion && GRADIENT_WAVES}>
        <div class="ln-cta-bg" aria-hidden="true">
          <Deferred load={GRADIENT_WAVES}>
            {GradientWaves => (
              <GradientWaves
                {...look()}
                tilt={58}
                dpr={lite() ? 0.75 : 1.25}
                quality={lite() ? 'low' : 'medium'}
                intro={true}
              />
            )}
          </Deferred>
        </div>
      </Show>
      <h2 class="ln-cta-headline">Build something people remember.</h2>

      <p class="ln-cta-sub">
        Start with the free library: {TOTAL_COMPONENTS} animated components for Solid, ready to copy into your project
        and make your own.
      </p>

      <div class="ln-cta-buttons">
        <a href="/get-started/index" class="ln-cta-btn ln-cta-btn--primary">
          Browse components
          <ArrowRight />
        </a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" class="ln-cta-btn ln-cta-btn--secondary">
          Star on GitHub
        </a>
      </div>
    </div>
  );
}
