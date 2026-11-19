import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { For, Match, Show, Switch } from 'solid-js';
import { markBlack } from '@/assets/logos';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { isLight } from '@/hooks/useTheme';
import { REACT_BITS_ORIGIN, toolsLinkProps } from '@/utils/pro';
import Deferred, { contentLoader } from '../Deferred';
import { useNearOnce } from '../hooks/useNearOnce';
import './Tools.css';

const MODULES = import.meta.glob([
  '/src/content/Backgrounds/Topography/Topography.tsx',
  '/src/content/Animations/MetallicPaint/MetallicPaint.tsx'
]);
const TOPOGRAPHY = contentLoader(MODULES, '/src/content/Backgrounds/Topography/Topography.tsx');
const METALLIC_PAINT = contentLoader(MODULES, '/src/content/Animations/MetallicPaint/MetallicPaint.tsx');

const PLACEMENT = 'landing-tools';

const TOOLS = [
  {
    id: 'background-studio',
    label: 'Background Studio',
    blurb:
      'Pick an animated background, start from a preset, tune it live, then export a 4K image, a looping video or React code.'
  },
  {
    id: 'center-stage',
    label: 'Center Stage',
    blurb: 'Turn screenshots and recordings into polished product shots. Perfect for launch videos or demos.'
  },
  {
    id: 'shape-magic',
    label: 'Shape Magic',
    blurb: 'Design a logo mark or style your own logo with 3D materials. Export SVG, PNG, favicons, video or React.'
  },
  {
    id: 'texture-lab',
    label: 'Texture Lab',
    blurb:
      'Stack animated effects on a photo, video or your camera, then export an image, a video, a GIF or a shareable style.'
  },
  {
    id: 'sound-lab',
    label: 'Sound Lab',
    blurb:
      'Interface and video sounds, tune them live, then install one with a single command or download WAV, MP3 or OGG.'
  }
].map(tool => ({ ...tool, link: toolsLinkProps(`/tools/${tool.id}`, PLACEMENT) }));

const POSTERS: Record<string, string> = { 'background-studio': 'topography', 'shape-magic': 'metallicpaint' };

export default function Tools() {
  const [gridRef, near] = useNearOnce('400px 0px');
  const lite = () => near() && document.documentElement.hasAttribute('data-lite');
  const suffix = () => (isLight() ? '-light' : '');
  const remote = (name: string) => `${REACT_BITS_ORIGIN}/assets/images/${name}${suffix()}.webp`;

  const poster = (id: string) => (
    <img
      class="ln-tools-poster"
      src={`/assets/videos/${POSTERS[id]}${suffix()}.webp`}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <section class="ln-tools-section" aria-labelledby="ln-tools-title">
      <div class="ln-tools-inner">
        <header class="ln-tools-head">
          <h2 id="ln-tools-title" class="ln-tools-title">
            Five free tools, in your browser.
          </h2>
          <p class="ln-tools-sub">
            Made by React Bits and hosted on reactbits.dev. The images, videos and sounds they export work in any
            project.
          </p>
        </header>
        <div ref={gridRef} class="ln-tools-grid">
          <For each={TOOLS}>
            {tool => (
              <a class="browse-card ln-tools-card" {...tool.link}>
                <div class="browse-card-well ln-tools-well" aria-hidden="true">
                  <Show when={near()}>
                    <Switch>
                      <Match when={tool.id === 'center-stage'}>
                        <img
                          class="ln-tools-shot ln-tools-shot--fit"
                          src={remote('center-stage-shot')}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </Match>
                      <Match when={tool.id === 'sound-lab'}>
                        <img
                          class="ln-tools-shot"
                          src={remote('sound-lab-orb')}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </Match>
                      <Match when={tool.id === 'texture-lab'}>
                        <img
                          src={`${REACT_BITS_ORIGIN}/assets/images/soft-type-daisy.webp`}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </Match>
                      <Match when={lite() && POSTERS[tool.id]}>{poster(tool.id)}</Match>
                      <Match when={tool.id === 'background-studio'}>
                        <Deferred load={TOPOGRAPHY} fallback={poster(tool.id)}>
                          {Topography => (
                            <Topography
                              color={isLight() ? '#3c4046' : '#d6d9de'}
                              lightMode={isLight()}
                              tilt={30}
                              lineCount={22}
                              majorLines={false}
                              glow={0.15}
                              depthOfField={0}
                              speed={0.18}
                              intro={false}
                            />
                          )}
                        </Deferred>
                      </Match>
                      <Match when={tool.id === 'shape-magic'}>
                        <Deferred load={METALLIC_PAINT} fallback={poster(tool.id)}>
                          {MetallicPaint => (
                            <MetallicPaint
                              imageSrc={markBlack}
                              scale={0.74}
                              dispersion={0.06}
                              lightMode={isLight()}
                              backgroundColor="transparent"
                              intro={false}
                            />
                          )}
                        </Deferred>
                      </Match>
                    </Switch>
                  </Show>
                </div>
                <div class="ln-tools-caption">
                  <div class="ln-tools-name">
                    <h3 class="browse-card-title">{tool.label}</h3>
                    <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} strokeWidth={1.8} />
                  </div>
                  <p class="ln-tools-desc">{tool.blurb}</p>
                </div>
              </a>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
