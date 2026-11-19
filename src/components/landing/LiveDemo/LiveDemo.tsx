import { For, Match, Show, Switch } from 'solid-js';
import { markWhite } from '@/assets/logos';
import { isLight } from '@/hooks/useTheme';
import Deferred, { contentLoader, type ContentLoader } from '../Deferred';
import { useNearOnce } from '../hooks/useNearOnce';
import { createReveal } from '../reveal';
import './LiveDemo.css';

const MODULES = import.meta.glob([
  '/src/content/Backgrounds/MicroSlats/MicroSlats.tsx',
  '/src/content/Animations/ElectricLogo/ElectricLogo.tsx',
  '/src/content/TextAnimations/TechText/TechText.tsx',
  '/src/content/Components/CircularCarousel/CircularCarousel.tsx',
  '/src/content/Micro/HoldButton/HoldButton.tsx'
]);

const WELL = { dark: '#090b0e', light: '#ffffff' };

type Card = {
  key: string;
  category: string;
  component: string;
  poster: string;
  href: string;
  span: number;
  tall?: boolean;
  load?: ContentLoader;
};

const CARDS: Card[] = [
  {
    key: 'slats',
    category: 'Backgrounds',
    component: 'Micro Slats',
    poster: 'microslats',
    href: '/backgrounds/micro-slats',
    span: 7,
    tall: true,
    load: contentLoader(MODULES, '/src/content/Backgrounds/MicroSlats/MicroSlats.tsx')
  },
  {
    key: 'electric',
    category: 'Animations',
    component: 'Electric Logo',
    poster: 'electriclogo',
    href: '/animations/electric-logo',
    span: 5,
    tall: true,
    load: contentLoader(MODULES, '/src/content/Animations/ElectricLogo/ElectricLogo.tsx')
  },
  {
    key: 'tech',
    category: 'Text Animations',
    component: 'Tech Text',
    poster: 'techtext',
    href: '/text-animations/tech-text',
    span: 4,
    load: contentLoader(MODULES, '/src/content/TextAnimations/TechText/TechText.tsx')
  },
  {
    key: 'carousel',
    category: 'Components',
    component: 'Circular Carousel',
    poster: 'circularcarousel',
    href: '/components/circular-carousel',
    span: 5,
    load: contentLoader(MODULES, '/src/content/Components/CircularCarousel/CircularCarousel.tsx')
  },
  {
    key: 'hold',
    category: 'Micro',
    component: 'Hold Button',
    poster: 'holdbutton',
    href: '/micro/hold-button',
    span: 3,
    load: contentLoader(MODULES, '/src/content/Micro/HoldButton/HoldButton.tsx')
  }
];

const ArrowUpRight = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

export default function LiveDemo() {
  const [sectionRef, near] = useNearOnce();
  const reveal = createReveal();
  const lite = () => near() && document.documentElement.hasAttribute('data-lite');

  const poster = (card: Card) => (
    <img
      class="ln-demo-poster"
      src={`/assets/videos/${card.poster}${isLight() ? '-light' : ''}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <section ref={sectionRef} class="ln-demo-section">
      <div class="ln-demo-inner">
        <h2 class="ln-demo-title">See them in action</h2>

        <div class="ln-demo-grid">
          <For each={CARDS} keyed={false}>
            {(card, i) => (
              <article
                ref={reveal(i * 0.07)}
                class={[
                  'ln-demo-card',
                  `ln-demo-card--span-${card().span}`,
                  { 'ln-demo-card--tall': Boolean(card().tall) }
                ]}
              >
                <div class="ln-demo-well">
                  <Show when={near()}>
                    <Show when={!lite() && card().load} fallback={poster(card())}>
                      <Deferred load={card().load} fallback={poster(card())}>
                        {Live => (
                          <Switch>
                            <Match when={card().key === 'slats'}>
                              <Live
                                preset="swell"
                                color={isLight() ? '#52565c' : '#a2a7b0'}
                                glintColor={isLight() ? '#11151b' : '#ffffff'}
                                backgroundColor={isLight() ? WELL.light : WELL.dark}
                              />
                            </Match>
                            <Match when={card().key === 'electric'}>
                              <Live
                                src={markWhite}
                                theme={isLight() ? 'light' : 'dark'}
                                color={isLight() ? '#1e242b' : '#f2f4f7'}
                                glowColor="#a2a7b0"
                                scale={0.5}
                              />
                            </Match>
                            <Match when={card().key === 'tech'}>
                              <Live
                                text="Bits"
                                fontSize={120}
                                color={isLight() ? '#11151b' : '#ffffff'}
                                accentColor={isLight() ? '#11151b' : '#ffffff'}
                              />
                            </Match>
                            <Match when={card().key === 'carousel'}>
                              <Live cardWidth={132} fadeColor={isLight() ? WELL.light : WELL.dark} />
                            </Match>
                            <Match when={card().key === 'hold'}>
                              <div class="ln-demo-center">
                                <Live
                                  doneLabel="Confirmed"
                                  backgroundColor={isLight() ? '#e4e6e9' : '#1e242b'}
                                  fillColor={isLight() ? '#11151b' : '#f2f4f7'}
                                  textColor={isLight() ? '#3a3e44' : '#f5f5f5'}
                                  fillTextColor={isLight() ? '#ffffff' : '#0c0f13'}
                                >
                                  Hold to confirm
                                </Live>
                              </div>
                            </Match>
                          </Switch>
                        )}
                      </Deferred>
                    </Show>
                  </Show>
                </div>
                <a href={card().href} class="ln-demo-caption">
                  <span class="ln-demo-caption-name">{card().component}</span>
                  <span class="ln-demo-caption-meta">
                    {card().category}
                    <ArrowUpRight />
                  </span>
                </a>
              </article>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
