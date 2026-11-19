import { ArrowRight02Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { For, Match, Show, Switch, createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { GITHUB_URL, SITE_ORIGIN } from '@/constants/cli';
import { TOTAL_COMPONENTS } from '@/constants/Categories';
import { isLight } from '@/hooks/useTheme';
import Deferred, { contentLoader } from '../Deferred';
import { useAdaptiveQuality } from '../hooks/useAdaptiveQuality';
import DotFrame from './DotFrame';
import GhostReveal, { type PointerHolder } from './GhostReveal';
import HeroChip from './HeroChip';
import HeroCopyCommand from './HeroCopyCommand';
import HeroTerminal from './HeroTerminal';
import HeroWindow from './HeroWindow';
import ScrubColor from './ScrubColor';
import ScrubNumber, { type ScrubField } from './ScrubNumber';
import { LOOK, PRESET_OPTIONS, presetProps } from './gradientLook';
import { DOT, dotTint, tween, type Values } from './heroUtils';
import './HeroFrame.css';

const MODULES = import.meta.glob([
  '/src/content/Backgrounds/GradientWaves/GradientWaves.tsx',
  '/src/content/Backgrounds/DotGrid/DotGrid.tsx'
]);
const GRADIENT_WAVES = contentLoader(MODULES, '/src/content/Backgrounds/GradientWaves/GradientWaves.tsx');
const DOT_GRID = contentLoader(MODULES, '/src/content/Backgrounds/DotGrid/DotGrid.tsx');

type Option = { value: string; label: string };
type ColorField = { name: string; type: 'color'; label: string };
type Field = ColorField | (ScrubField & { type?: undefined });
type Segment =
  { t: 'text'; text: string; c?: string } | { t: 'color'; field: ColorField } | { t: 'number'; field: ScrubField };

const ORDER = ['ocean', 'dune', 'dusk', 'silk', 'aurora'];
const OPTIONS = ORDER.map(value => PRESET_OPTIONS.find(option => option.value === value)).filter(
  (option): option is Option => Boolean(option)
);
const FIRST = 'dusk';
const STAGE = { tilt: 40 };
const INSTALL = `npx jsrepo add ${SITE_ORIGIN}/r/GradientWaves`;
const OUTPUT = ['✔ Checking registry.', '✔ Created 1 file.'];
const FIELDS: Field[] = [
  { name: 'waveColor', type: 'color', label: 'Wave color' },
  { name: 'amplitude', min: 0, max: 5, step: 0.05, label: 'Amplitude' },
  { name: 'swell', min: 0, max: 40, step: 0.5, label: 'Swell' },
  { name: 'lightAngle', min: -180, max: 180, step: 1, label: 'Light angle' },
  { name: 'speed', min: 0, max: 1.5, step: 0.01, label: 'Speed' }
];
const HINTS = ['amplitude', 'swell'];
const SWATCHES = {
  dark: ['#fb923c', '#fca5a5', '#0aa0ef', '#38bdf8', '#34d399', '#fde68a', '#e5e5e5'],
  light: ['#fb923c', '#f87171', '#0977ae', '#38bdf8', '#34d399', '#facc15', '#a3a3a3']
};
const CYCLE_MS = 6000;
const IDLE_MS = 2600;
const DOCS_PATH = '/backgrounds/gradient-waves';

const CODE: Segment[][] = [
  [
    { t: 'text', text: 'import', c: 'lh-kw' },
    { t: 'text', text: ' GradientWaves ' },
    { t: 'text', text: 'from', c: 'lh-kw' },
    { t: 'text', text: ' ' },
    { t: 'text', text: "'./GradientWaves'", c: 'lh-str' },
    { t: 'text', text: ';' }
  ],
  [{ t: 'text', text: ' ' }],
  [
    { t: 'text', text: 'export default function', c: 'lh-kw' },
    { t: 'text', text: ' Hero() {' }
  ],
  [
    { t: 'text', text: '  ' },
    { t: 'text', text: 'return', c: 'lh-kw' },
    { t: 'text', text: ' (' }
  ],
  [{ t: 'text', text: '    <GradientWaves' }],
  ...FIELDS.map((field): Segment[] =>
    field.type === 'color'
      ? [
          { t: 'text', text: '      ' },
          { t: 'text', text: field.name, c: 'lh-attr' },
          { t: 'text', text: '=', c: 'lh-punc' },
          { t: 'color', field }
        ]
      : [
          { t: 'text', text: '      ' },
          { t: 'text', text: field.name, c: 'lh-attr' },
          { t: 'text', text: '=', c: 'lh-punc' },
          { t: 'text', text: '{', c: 'lh-punc' },
          { t: 'number', field },
          { t: 'text', text: '}', c: 'lh-punc' }
        ]
  ),
  [{ t: 'text', text: '    />' }],
  [{ t: 'text', text: '  );' }],
  [{ t: 'text', text: '}' }]
];

const lookFor = (preset: string, light: boolean): Values => ({
  ...(presetProps(preset, { light, defaults: LOOK }) as Values),
  ...STAGE
});

const buildDocsUrl = (current: Values, defaults: Values) => {
  const params = new URLSearchParams();
  Object.keys(current).forEach(key => {
    if (JSON.stringify(current[key]) === JSON.stringify(defaults[key])) return;
    const value = current[key];
    if (typeof value === 'string' && value.startsWith('#')) params.set(key, value.replace(/^#/, ''));
    else params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `${DOCS_PATH}?${query}` : DOCS_PATH;
};

const readLight = () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light';

export default function Hero() {
  const startLight = readLight();
  const [preset, setPreset] = createSignal<string | null>(FIRST);
  const [values, setValues] = createSignal<Values>(lookFor(FIRST, startLight));
  const [visible, setVisible] = createSignal(true);
  const [idle, setIdle] = createSignal(true);
  const [auto, setAuto] = createSignal(true);
  const [hold, setHold] = createSignal(false);
  const hover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const step = useAdaptiveQuality(visible);
  const pointer: PointerHolder = { current: null };
  let stageEl: HTMLDivElement | undefined;
  let stop: (() => void) | null = null;
  let lightNow = startLight;
  let presetNow: string | null = FIRST;
  let valuesNow = lookFor(FIRST, startLight);

  const apply = (next: Values) => {
    valuesNow = next;
    setValues(next);
  };

  createEffect(
    isLight,
    light => {
      lightNow = light;
      stop?.();
      apply(lookFor(presetNow || FIRST, light));
    },
    { defer: true }
  );

  const choose = (value: string) => {
    presetNow = value;
    setPreset(value);
    stop?.();
    stop = tween(valuesNow, lookFor(value, lightNow), apply, 900);
  };

  const pick = (value: string) => {
    setAuto(false);
    choose(value);
  };

  const set = (name: string, value: unknown) => {
    stop?.();
    setAuto(false);
    presetNow = null;
    setPreset(null);
    apply({ ...valuesNow, [name]: value });
  };

  createEffect(
    () => ({ auto: auto(), hold: hold(), visible: visible(), preset: preset() }),
    state => {
      if (!state.auto || state.hold || !state.visible || !state.preset) return;
      const current = state.preset;
      const timer = window.setTimeout(() => {
        const index = OPTIONS.findIndex(option => option.value === current);
        choose(OPTIONS[(index + 1) % OPTIONS.length].value);
      }, CYCLE_MS);
      return () => window.clearTimeout(timer);
    }
  );

  onSettled(() => {
    let idleTimer = 0;
    let idleFlag = true;
    const onIdleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (idleFlag) {
        idleFlag = false;
        setIdle(false);
      }
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        idleFlag = true;
        setIdle(true);
      }, IDLE_MS);
    };

    const parallax = { x: 0, y: 0, tx: 0, ty: 0, frame: 0 };
    const parallaxTick = () => {
      const stage = stageEl;
      if (!stage) {
        parallax.frame = 0;
        return;
      }
      parallax.x += (parallax.tx - parallax.x) * 0.07;
      parallax.y += (parallax.ty - parallax.y) * 0.07;
      stage.style.setProperty('--lh-px', parallax.x.toFixed(4));
      stage.style.setProperty('--lh-py', parallax.y.toFixed(4));
      const moving = Math.abs(parallax.tx - parallax.x) + Math.abs(parallax.ty - parallax.y) > 0.0004;
      parallax.frame = moving ? requestAnimationFrame(parallaxTick) : 0;
    };
    const onParallaxMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      parallax.tx = event.clientX / window.innerWidth - 0.5;
      parallax.ty = event.clientY / window.innerHeight - 0.5;
      if (!parallax.frame) parallax.frame = requestAnimationFrame(parallaxTick);
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.addEventListener('pointermove', onIdleMove, { passive: true });
    if (!reducedMotion) window.addEventListener('pointermove', onParallaxMove, { passive: true });

    let stageObserver: IntersectionObserver | null = null;
    if (stageEl && typeof IntersectionObserver !== 'undefined') {
      stageObserver = new IntersectionObserver(
        ([entry]) => {
          setVisible(entry.isIntersecting);
        },
        { rootMargin: '80px' }
      );
      stageObserver.observe(stageEl);
    }

    return () => {
      stop?.();
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onIdleMove);
      window.removeEventListener('pointermove', onParallaxMove);
      cancelAnimationFrame(parallax.frame);
      stageObserver?.disconnect();
    };
  });

  const presets = createMemo(() => {
    const light = isLight();
    return OPTIONS.map(option => {
      const look = lookFor(option.value, light);
      return {
        ...option,
        colors: [look.horizonColor, look.waveColor, look.crestColor] as string[],
        hint: HINTS.map(name => `${name} ${look[name]}`).join(' · ')
      };
    });
  });

  const activeIndex = () => OPTIONS.findIndex(option => option.value === preset());

  const docsUrl = createMemo(() => {
    const current = values();
    return buildDocsUrl(
      Object.fromEntries(FIELDS.map(field => [field.name, current[field.name]]).concat([['tilt', STAGE.tilt]])),
      LOOK as Values
    );
  });

  const tint = createMemo(() => dotTint(values().waveColor, isLight()));
  const dotDpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
  const swatches = () => SWATCHES[isLight() ? 'light' : 'dark'];

  return (
    <section class="ln-hero lh" style={{ '--lh-accent': String(values().waveColor) }}>
      <Show when={hover && !step().lite}>
        <div class="lh-dots" aria-hidden="true">
          <Deferred load={DOT_GRID}>
            {DotGrid => (
              <DotGrid
                dpr={dotDpr}
                dotSize={DOT.size}
                gap={DOT.gap}
                baseColor={isLight() ? '#f5f5f5' : '#0c0f13'}
                activeColor={tint()}
                proximity={DOT.radius}
                strength={1.15}
                bounce={0.7}
                tension={0.35}
                swell={1.4}
                stretch={0.5}
                glow={0.15}
                opacity={0.55}
                shockRadius={380}
                shockStrength={4}
                intro={false}
                mouseInteraction={!idle()}
              />
            )}
          </Deferred>
        </div>
      </Show>
      <DotFrame color={tint()} live={!idle()} />
      <Show when={!step().lite}>
        <GhostReveal active={idle() && visible()} start={pointer} color={tint()} />
      </Show>
      <div class="lh-inner">
        <header class="lh-top">
          <HeroChip />
          <h1 class="lh-title">
            Animated Solid components for <br />
            websites people remember.
          </h1>
          <p class="lh-lede">
            <span>{TOTAL_COMPONENTS} animated components and backgrounds for Solid.</span>
            <span>Tune them yourself, or hand them to your agent.</span>
          </p>
          <div class="lh-actions">
            <a href="/get-started/index" class="lh-btn lh-btn--primary">
              Browse components
              <HugeiconsIcon icon={ArrowRight02Icon} size={17} strokeWidth={1.8} />
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" class="lh-btn lh-btn--ghost">
              Star on GitHub
            </a>
          </div>
        </header>

        <div ref={el => (stageEl = el)} class="lh-stage">
          <div class="lh-art" aria-hidden="true">
            <div class="lh-art-layer">
              <Deferred
                load={GRADIENT_WAVES}
                fallback={
                  <img
                    class="lh-art-poster"
                    src={`/assets/videos/gradientwaves${isLight() ? '-light' : ''}.webp`}
                    alt=""
                    decoding="async"
                  />
                }
              >
                {GradientWaves => (
                  <GradientWaves
                    {...values()}
                    dpr={step().dpr}
                    quality={step().quality}
                    intro={true}
                    paused={!visible()}
                  />
                )}
              </Deferred>
            </div>
          </div>

          <HeroWindow
            title="Terminal"
            class="lh-terminal"
            action={<HeroCopyCommand command={INSTALL} buttonClass="lh-window-action" />}
          >
            <HeroTerminal command={INSTALL} output={OUTPUT} />
          </HeroWindow>

          <HeroWindow title="Hero.tsx" class="lh-code">
            <pre class="lh-pre">
              <code>
                <For each={CODE}>
                  {line => (
                    <span class="lh-line">
                      <For each={line}>
                        {seg => (
                          <Switch>
                            <Match when={seg.t === 'color' && seg}>
                              {color => (
                                <ScrubColor
                                  value={String(values()[color().field.name])}
                                  label={color().field.label}
                                  swatches={swatches()}
                                  onChange={value => set(color().field.name, value)}
                                />
                              )}
                            </Match>
                            <Match when={seg.t === 'number' && seg}>
                              {number => (
                                <ScrubNumber
                                  value={Number(values()[number().field.name])}
                                  field={number().field}
                                  onChange={value => set(number().field.name, value)}
                                />
                              )}
                            </Match>
                            <Match when={seg.t === 'text' && seg}>
                              {text => (
                                <Show when={text().c} fallback={text().text}>
                                  <span class={text().c}>{text().text}</span>
                                </Show>
                              )}
                            </Match>
                          </Switch>
                        )}
                      </For>
                    </span>
                  )}
                </For>
              </code>
            </pre>
          </HeroWindow>

          <HeroWindow
            title="Presets"
            class="lh-presets"
            onPointerEnter={() => setHold(true)}
            onPointerLeave={() => setHold(false)}
            status={
              <a href={docsUrl()} class="lh-studio">
                Open in the docs
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.8} />
              </a>
            }
          >
            <div class="lh-preset-list" role="radiogroup" aria-label="Presets">
              <span
                class="lh-preset-thumb"
                aria-hidden="true"
                data-hidden={activeIndex() < 0 ? '' : undefined}
                style={{ '--i': String(Math.max(0, activeIndex())) }}
              />
              <For each={presets()}>
                {option => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={preset() === option.value ? 'true' : 'false'}
                    class="lh-preset"
                    onClick={() => pick(option.value)}
                  >
                    <span class="lh-preset-swatches" aria-hidden="true">
                      <For each={option.colors}>{color => <i style={{ background: color }} />}</For>
                    </span>
                    <span class="lh-preset-name">{option.label}</span>
                    <span class="lh-preset-hint">{option.hint}</span>
                  </button>
                )}
              </For>
            </div>
          </HeroWindow>
        </div>
      </div>
    </section>
  );
}
