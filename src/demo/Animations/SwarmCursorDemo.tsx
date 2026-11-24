import { For, Match, Switch, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { CursorPointer01Icon, FlowConnectionIcon, Orbit01Icon, Route01Icon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import SwarmCursor, {
  type SwarmClickEffect,
  type SwarmCursorProps,
  type SwarmIdle,
  type SwarmShape
} from '@/content/Animations/SwarmCursor/SwarmCursor';
import { swarmCursor } from '@/constants/code/Animations/swarmCursorCode';

type Ink = {
  text: string;
  muted: string;
  tile: string;
  rim: string;
  card: string;
  solid: string;
  solidText: string;
  hover: string;
  halo: string;
};

const INK: Record<'dark' | 'light', Ink> = {
  dark: {
    text: '#f2f4f7',
    muted: 'rgba(242, 244, 247, 0.62)',
    tile: 'linear-gradient(180deg, #34373c 0%, #232529 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    card: 'linear-gradient(180deg, rgba(38, 41, 46, 0.92) 0%, rgba(26, 28, 32, 0.92) 100%)',
    solid: '#f2f4f7',
    solidText: '#090b0e',
    hover: 'brightness(1.12)',
    halo: '0 1px 2px rgba(16, 17, 19, 0.9), 0 0 12px rgba(16, 17, 19, 0.85)'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.62)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f5f6f7 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    card: 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(245, 246, 247, 0.94) 100%)',
    solid: '#18181b',
    solidText: '#ffffff',
    hover: 'brightness(0.97)',
    halo: '0 0 2px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.9)'
  }
};

const STYLES = `
.swarm-demo-stage { position: relative; height: 520px; padding: 0; overflow: hidden; container-type: inline-size; container-name: swarm; }
@media (min-width: 48em) { .swarm-demo-stage { height: 560px; } }
.swarm-demo-stage p { margin: 0; }
.swarm-demo-hero { display: flex; flex-direction: column; width: 100%; height: 100%; }
.swarm-demo-nav { display: flex; align-items: center; gap: 12px; padding: 13px 60px 0 16px; }
.swarm-demo-brand { display: flex; align-items: center; gap: 10px; }
.swarm-demo-brand-name { font-size: 15px; font-weight: 500; }
.swarm-demo-links { margin-left: auto; align-items: center; gap: 2px; display: none; }
.swarm-demo-link { height: 32px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--swarm-muted); transition: color 200ms ease; }
.swarm-demo-link:hover { color: var(--swarm-text); }
.swarm-demo-signin { margin-left: auto; }
.swarm-demo-tile { border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; }
.swarm-demo-button { height: 44px; padding: 0 20px; border: 0; border-radius: 12px; font-size: 15px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: filter 200ms ease; }
.swarm-demo-button.is-small { height: 34px; padding: 0 14px; border-radius: 10px; font-size: 13px; }
.swarm-demo-button:hover, .swarm-demo-card:hover { filter: var(--swarm-hover); }
.swarm-demo-hero-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 20px 32px; }
.swarm-demo-title { font-size: 30px; font-weight: 500; line-height: 1.08; letter-spacing: -0.035em; max-width: 520px; text-wrap: balance; }
.swarm-demo-subtitle { margin-top: 14px !important; font-size: 14px; line-height: 1.6; max-width: 400px; text-wrap: balance; }
.swarm-demo-actions { margin-top: 28px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.swarm-demo-features { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; padding: 0 16px; gap: 20px; }
.swarm-demo-features-head { text-align: center; }
.swarm-demo-features-title { font-size: 22px; font-weight: 500; letter-spacing: -0.03em; }
.swarm-demo-features-text { margin-top: 8px !important; font-size: 14px; }
.swarm-demo-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; width: 100%; max-width: 720px; }
.swarm-demo-card { display: flex; flex-direction: row; align-items: center; gap: 14px; padding: 14px; border-radius: 16px; text-align: left; cursor: default; transition: filter 200ms ease; }
.swarm-demo-card-title { font-size: 15px; font-weight: 500; }
.swarm-demo-card-text { margin-top: 4px !important; font-size: 13px; line-height: 1.5; }
@container swarm (min-width: 640px) {
  .swarm-demo-nav { padding-left: 22px; }
  .swarm-demo-links { display: flex; }
  .swarm-demo-signin { margin-left: 8px; }
  .swarm-demo-title { font-size: 44px; }
  .swarm-demo-subtitle { font-size: 16px; }
  .swarm-demo-features-title { font-size: 28px; }
  .swarm-demo-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .swarm-demo-card { flex-direction: column; align-items: flex-start; gap: 16px; padding: 18px; }
}
`;

const NAV = ['Product', 'Customers', 'Pricing', 'Docs'];

const FEATURES: { icon: IconSvgElement; title: string; text: string }[] = [
  { icon: CursorPointer01Icon, title: 'Live presence', text: 'See who is working where, as it happens.' },
  { icon: Route01Icon, title: 'Shared roadmaps', text: 'Plans, releases and reviews on one line.' },
  { icon: FlowConnectionIcon, title: 'Quiet handoffs', text: 'Pass work along without losing context.' }
];

const LOOK = {
  shape: 'dot' as SwarmShape,
  color: '#ffffff',
  accentColor: '#ffffff',
  count: 800,
  size: 2.6,
  spread: 90,
  speed: 1,
  swirl: 0.6,
  tail: 0.5,
  trail: 0.6,
  wander: 0.5,
  depth: 0.7,
  clickEffect: 'burst' as SwarmClickEffect
};

const DEFAULT_PROPS = {
  demo: 'hero',
  preset: 'liquid',
  ...LOOK,
  idle: 'roam' as SwarmIdle,
  hideCursor: false,
  intro: true,
  enabled: true
};

type DemoProps = typeof DEFAULT_PROPS;

const PRESETS: Record<string, Partial<DemoProps>> = {
  liquid: {},
  ink: { count: 1400, size: 1.8, swirl: 0.85, wander: 0.7, depth: 0.5 },
  vortex: { count: 1000, size: 2.2, speed: 1.6, swirl: 1, wander: 1.1, accentColor: '#7dd3fc' },
  comet: { shape: 'streak', accentColor: '#7dd3fc', count: 600, size: 2.2, tail: 0.9, trail: 1.4, swirl: 0.4 },
  fireflies: {
    color: '#8ad5fd',
    accentColor: '#8ad5fd',
    count: 160,
    size: 4,
    spread: 120,
    speed: 0.5,
    swirl: 0.3,
    wander: 1.2,
    depth: 0.5,
    clickEffect: 'pulse'
  },
  pixels: { shape: 'square', count: 500, size: 3.4, swirl: 0.5, depth: 0.3 }
};

const LIGHT_SWAP: Record<string, string> = {
  '#ffffff': '#18181b',
  '#8ad5fd': '#0690d9',
  '#7dd3fc': '#0284c7'
};

const DARK_SWAP: Record<string, string> = Object.fromEntries(
  Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark])
);

const DEMO_OPTIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'features', label: 'Features' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'liquid', label: 'Liquid' },
  { value: 'ink', label: 'Ink' },
  { value: 'vortex', label: 'Vortex' },
  { value: 'comet', label: 'Comet' },
  { value: 'fireflies', label: 'Fireflies' },
  { value: 'pixels', label: 'Pixels' }
];

const SHAPE_OPTIONS = [
  { value: 'dot', label: 'Dot' },
  { value: 'streak', label: 'Streak' },
  { value: 'square', label: 'Square' }
];

const IDLE_OPTIONS = [
  { value: 'roam', label: 'Roam' },
  { value: 'gather', label: 'Gather' },
  { value: 'hide', label: 'Hide' }
];

const CLICK_OPTIONS = [
  { value: 'burst', label: 'Burst' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'none', label: 'None' }
];

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'Content the swarm flows behind, such as a hero with buttons.'
  },
  {
    name: 'count',
    type: 'number',
    default: '800',
    description: 'Number of particles in the swarm, up to 2000.'
  },
  { name: 'size', type: 'number', default: '2.6', description: 'Size of each particle, in px.' },
  {
    name: 'shape',
    type: "'dot' | 'streak' | 'square'",
    default: "'dot'",
    description: 'Shape of each particle.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the particles. Defaults to near black in light mode.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: 'color',
    description: 'Color particles take on when they rush and when you click.'
  },
  {
    name: 'spread',
    type: 'number',
    default: '90',
    description: 'Radius of the swarm around the cursor, in px.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'How lively the swarm churns and turns while the cursor rests.'
  },
  {
    name: 'swirl',
    type: 'number',
    default: '0.6',
    description: 'How much the swarm curls into eddies and how long they keep turning, from 0 (calm) to 1 (stormy).'
  },
  {
    name: 'tail',
    type: 'number',
    default: '0.5',
    description: 'How far the swarm streams behind a fast cursor, from 0 (tight) to 1 (a long trailing tail).'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.6',
    description: 'Motion blur on fast particles.'
  },
  {
    name: 'wander',
    type: 'number',
    default: '0.5',
    description: 'How restlessly the swarm folds and drifts on its own.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '0.7',
    description: 'How much near particles grow and blur and far ones shrink and fade, from 0 (flat) to 1 (deep).'
  },
  {
    name: 'targets',
    type: 'string',
    default: "'a, button, [data-swarm-target]'",
    description: 'Elements inside the swarm that it pours around while hovered. Pass an empty string to turn this off.'
  },
  {
    name: 'idle',
    type: "'roam' | 'gather' | 'hide'",
    default: "'roam'",
    description: 'What the swarm does while the cursor is away: drift around the area, wait in the middle, or fade out.'
  },
  {
    name: 'clickEffect',
    type: "'burst' | 'pulse' | 'none'",
    default: "'burst'",
    description:
      'What a click does. Burst splashes the swarm outward in a curl, pulse sends a wave of light through it.'
  },
  {
    name: 'hideCursor',
    type: 'boolean',
    default: 'false',
    description:
      'Hides the system cursor over the component and marks the pointer with a dot, so the swarm becomes the cursor.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Swirls the swarm in from across the area on mount.'
  },
  { name: 'enabled', type: 'boolean', default: 'true', description: 'Shows and animates the swarm.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Uses near black particles by default and keeps them crisp, for light backgrounds.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

function IconTile(props: { ink: Ink; icon: IconSvgElement; size?: number }) {
  const size = () => props.size ?? 32;
  return (
    <div
      class="swarm-demo-tile"
      style={{
        width: `${size()}px`,
        height: `${size()}px`,
        background: props.ink.tile,
        'box-shadow': props.ink.rim
      }}
    >
      <HugeiconsIcon icon={props.icon} size={Math.round(size() * 0.5)} color={props.ink.text} strokeWidth={1.6} />
    </div>
  );
}

function SceneButton(props: { ink: Ink; solid?: boolean; small?: boolean; children: JSX.Element }) {
  return (
    <button
      type="button"
      class={['swarm-demo-button', { 'is-small': !!props.small }]}
      style={
        props.solid
          ? { background: props.ink.solid, color: props.ink.solidText }
          : { background: props.ink.tile, color: props.ink.text, 'box-shadow': props.ink.rim }
      }
    >
      {props.children}
    </button>
  );
}

function HeroScene(props: { ink: Ink }) {
  return (
    <div class="swarm-demo-hero">
      <div class="swarm-demo-nav">
        <div class="swarm-demo-brand">
          <IconTile ink={props.ink} icon={Orbit01Icon} size={30} />
          <p class="swarm-demo-brand-name" style={{ color: props.ink.text }}>
            Flock
          </p>
        </div>
        <div class="swarm-demo-links">
          <For each={NAV}>
            {item => (
              <button type="button" class="swarm-demo-link">
                {item}
              </button>
            )}
          </For>
        </div>
        <div class="swarm-demo-signin">
          <SceneButton ink={props.ink} small>
            Sign in
          </SceneButton>
        </div>
      </div>
      <div class="swarm-demo-hero-body">
        <p class="swarm-demo-title" style={{ color: props.ink.text, 'text-shadow': props.ink.halo }}>
          Teams move faster in formation
        </p>
        <p class="swarm-demo-subtitle" style={{ color: props.ink.muted, 'text-shadow': props.ink.halo }}>
          Plan, build and ship on one shared rhythm, with every update in plain sight.
        </p>
        <div class="swarm-demo-actions">
          <SceneButton ink={props.ink} solid>
            Start for free
          </SceneButton>
          <SceneButton ink={props.ink}>Book a demo</SceneButton>
        </div>
      </div>
    </div>
  );
}

function FeaturesScene(props: { ink: Ink }) {
  return (
    <div class="swarm-demo-features">
      <div class="swarm-demo-features-head" style={{ 'text-shadow': props.ink.halo }}>
        <p class="swarm-demo-features-title" style={{ color: props.ink.text }}>
          Everything moves together
        </p>
        <p class="swarm-demo-features-text" style={{ color: props.ink.muted }}>
          One workspace for the whole flight path.
        </p>
      </div>
      <div class="swarm-demo-grid">
        <For each={FEATURES}>
          {item => (
            <div
              data-swarm-target=""
              tabindex={0}
              class="swarm-demo-card"
              style={{ background: props.ink.card, 'box-shadow': props.ink.rim }}
            >
              <IconTile ink={props.ink} icon={item.icon} />
              <div>
                <p class="swarm-demo-card-title" style={{ color: props.ink.text }}>
                  {item.title}
                </p>
                <p class="swarm-demo-card-text" style={{ color: props.ink.muted }}>
                  {item.text}
                </p>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

export default function SwarmCursorDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = createMemo(() => INK[theme()]);
  const tone = createMemo(() => {
    const swap = theme() === 'light' ? LIGHT_SWAP : DARK_SWAP;
    return swap[props().color.toLowerCase()] ?? props().color;
  });
  const accent = createMemo(() => {
    const swap = theme() === 'light' ? LIGHT_SWAP : DARK_SWAP;
    return swap[props().accentColor.toLowerCase()] ?? props().accentColor;
  });
  const settings = createMemo(() => {
    const { demo: _demo, preset: _preset, color: _color, accentColor: _accent, ...rest } = props();
    return rest;
  });
  const computedProps = createMemo(() => ({
    color: tone(),
    accentColor: accent(),
    ...(theme() === 'light' ? { lightMode: true } : {})
  }));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <style>{STYLES}</style>
          <div
            class="demo-container swarm-demo-stage"
            style={{
              '--swarm-text': ink().text,
              '--swarm-muted': ink().muted,
              '--swarm-hover': ink().hover
            }}
          >
            <Keyed token={rerenderKey()}>
              {() => (
                <SwarmCursor
                  {...(settings() as SwarmCursorProps)}
                  color={tone()}
                  accentColor={accent()}
                  lightMode={theme() === 'light'}
                >
                  <Switch>
                    <Match when={props().demo === 'hero'}>
                      <HeroScene ink={ink()} />
                    </Match>
                    <Match when={props().demo === 'features'}>
                      <FeaturesScene ink={ink()} />
                    </Match>
                  </Switch>
                </SwarmCursor>
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings().shape}
              onChange={value => updateProp('shape', value)}
            />
            <PreviewColorPickerCustom title="Color" color={tone()} onChange={value => updateProp('color', value)} />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={accent()}
              onChange={value => updateProp('accentColor', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings().clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSlider
              title="Count"
              min={40}
              max={2000}
              step={10}
              value={settings().count}
              onChange={value => updateProp('count', value)}
            />
            <PreviewSlider
              title="Size"
              min={1}
              max={8}
              step={0.1}
              value={settings().size}
              valueUnit="px"
              onChange={value => updateProp('size', value)}
            />
            <PreviewSlider
              title="Spread"
              min={40}
              max={200}
              step={5}
              value={settings().spread}
              valueUnit="px"
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Swirl"
              min={0}
              max={1}
              step={0.01}
              value={settings().swirl}
              onChange={value => updateProp('swirl', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Tail"
              min={0}
              max={1}
              step={0.01}
              value={settings().tail}
              onChange={value => updateProp('tail', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={3}
              step={0.05}
              value={settings().trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Wander"
              min={0}
              max={2}
              step={0.01}
              value={settings().wander}
              onChange={value => updateProp('wander', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.01}
              value={settings().depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSelect
              title="Idle"
              options={IDLE_OPTIONS}
              value={settings().idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSwitch
              title="Hide Cursor"
              isChecked={settings().hideCursor}
              onChange={value => updateProp('hideCursor', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Enabled"
              isChecked={settings().enabled}
              onChange={value => updateProp('enabled', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={swarmCursor} componentName="SwarmCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
