import { For, Match, Show, Switch, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  DropletIcon,
  Fire03Icon,
  FlowerIcon,
  Globe02Icon,
  GridIcon,
  Moon02Icon,
  Rocket01Icon,
  SecurityCheckIcon,
  SparklesIcon,
  Sun02Icon,
  Tick02Icon,
  UserGroupIcon,
  WorkflowSquare03Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorList from '@/components/common/PreviewColorList';
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

import PixelCard, { type PixelCardProps } from '@/content/Components/PixelCard/PixelCard';
import { pixelCard } from '@/constants/code/Components/pixelCardCode';
import './PixelCardDemo.css';

type Palette = { dark: string[]; light: string[]; glow: string[] };

const PALETTES: Record<string, Palette> = {
  classic: {
    dark: ['#f8fafc', '#f1f5f9', '#cbd5e1'],
    light: ['#18191b', '#52555b', '#a1a5ab'],
    glow: ['#cbd5e1', '#71757a']
  },
  ocean: {
    dark: ['#e0f2fe', '#7dd3fc', '#0ea5e9'],
    light: ['#0c4a6e', '#0369a1', '#0284c7'],
    glow: ['#0ea5e9', '#0284c7']
  },
  sunbeam: {
    dark: ['#fef08a', '#fde047', '#eab308'],
    light: ['#713f12', '#a16207', '#ca8a04'],
    glow: ['#eab308', '#ca8a04']
  },
  bloom: {
    dark: ['#fecdd3', '#fda4af', '#e11d48'],
    light: ['#8b1a2b', '#be123c', '#e11d48'],
    glow: ['#e11d48', '#be123c']
  },
  halo: {
    dark: ['#ccfbf1', '#5eead4', '#14b8a6'],
    light: ['#134e4a', '#0f766e', '#0d9488'],
    glow: ['#14b8a6', '#0d9488']
  },
  ember: {
    dark: ['#ffedd5', '#fdba74', '#f97316'],
    light: ['#7c2d12', '#c2410c', '#ea580c'],
    glow: ['#f97316', '#ea580c']
  }
};

const ICONS: Record<string, IconSvgElement> = {
  classic: SparklesIcon,
  ocean: DropletIcon,
  sunbeam: Sun02Icon,
  bloom: FlowerIcon,
  mosaic: GridIcon,
  halo: Moon02Icon,
  ember: Fire03Icon
};

type Ink = {
  text: string;
  muted: string;
  faint: string;
  tile: string;
  rim: string;
  solid: string;
  solidText: string;
  hover: string;
  halo: string;
};

const INK: Record<'dark' | 'light', Ink> = {
  dark: {
    text: '#f4f5f6',
    muted: 'rgba(244, 245, 246, 0.62)',
    faint: 'rgba(244, 245, 246, 0.36)',
    tile: 'linear-gradient(180deg, #36393e 0%, #25272b 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    solid: '#f4f5f6',
    solidText: '#090b0e',
    hover: 'brightness(1.12)',
    halo: '0 1px 2px rgba(14, 15, 17, 0.95), 0 0 10px rgba(14, 15, 17, 0.9), 0 0 22px rgba(14, 15, 17, 0.75)'
  },
  light: {
    text: '#18191b',
    muted: 'rgba(24, 25, 27, 0.62)',
    faint: 'rgba(24, 25, 27, 0.38)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f5f6f7 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 25, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 25, 27, 0.25)',
    solid: '#18191b',
    solidText: '#ffffff',
    hover: 'brightness(0.97)',
    halo: '0 0 2px rgba(255, 255, 255, 0.95), 0 0 10px rgba(255, 255, 255, 0.92), 0 0 22px rgba(255, 255, 255, 0.8)'
  }
};

type Plan = {
  name: string;
  price: string;
  note: string;
  features: string[];
  cta: string;
  icon: IconSvgElement;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '$0',
    note: 'For side projects',
    features: ['3 projects', 'Community support', 'Basic analytics'],
    cta: 'Get started',
    icon: SparklesIcon
  },
  {
    name: 'Pro',
    price: '$24',
    note: 'For growing teams',
    features: ['Unlimited projects', 'Priority support', 'Advanced analytics'],
    cta: 'Upgrade to Pro',
    icon: Rocket01Icon,
    featured: true
  },
  {
    name: 'Team',
    price: '$59',
    note: 'For organizations',
    features: ['Shared workspaces', 'SSO and audit logs', 'Dedicated manager'],
    cta: 'Contact sales',
    icon: UserGroupIcon
  }
];

const PEOPLE = ['AK', 'JM', 'SR', 'LT'];
const STEPS = [
  { label: 'Build', time: '12s' },
  { label: 'Test', time: '48s' },
  { label: 'Deploy', time: '9s' }
];

const LOOK = {
  palette: 'classic',
  colors: PALETTES.classic.dark,
  glowColor: PALETTES.classic.glow[0],
  shape: 'square',
  origin: 'center',
  gap: 5,
  pixelSize: 2,
  speed: 35,
  revealDuration: 600,
  spotlight: 0.5,
  glow: 0.5,
  opacity: 0.35,
  fade: 0.7,
  trigger: 'hover',
  radius: 24,
  clickPulse: true,
  intro: true
};

type Look = typeof LOOK;

const DEFAULT_PROPS = { preset: 'classic', demo: 'pricing', ...LOOK };

const withPalette = (name: string, rest: Partial<Look>): Look => ({
  ...LOOK,
  palette: name,
  colors: PALETTES[name].dark,
  glowColor: PALETTES[name].glow[0],
  ...rest
});

const PRESETS: Record<string, Look> = {
  classic: LOOK,
  ocean: withPalette('ocean', { gap: 10, pixelSize: 3, speed: 25, origin: 'pointer', spotlight: 0.7 }),
  sunbeam: withPalette('sunbeam', { gap: 4, pixelSize: 1.8, speed: 20, glow: 0.6 }),
  bloom: withPalette('bloom', { gap: 7, pixelSize: 3, speed: 80, shape: 'circle' }),
  mosaic: { ...LOOK, gap: 12, pixelSize: 7, speed: 14, spotlight: 0.8, radius: 18 },
  halo: withPalette('halo', {
    gap: 9,
    pixelSize: 4,
    shape: 'circle',
    origin: 'pointer',
    spotlight: 1,
    glow: 0.7,
    radius: 32
  }),
  ember: withPalette('ember', { gap: 8, pixelSize: 3.4, speed: 50, shape: 'diamond', revealDuration: 800 })
};

const modeOpacity = (demo: string) => (demo === 'basic' ? 0.7 : 0.35);

const DEMO_OPTIONS = [
  { value: 'pricing', label: 'Pricing' },
  { value: 'bento', label: 'Bento' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunbeam', label: 'Sunbeam' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'halo', label: 'Halo' },
  { value: 'ember', label: 'Ember' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' },
  { value: 'always', label: 'Always' }
];

const ORIGIN_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'pointer', label: 'Pointer' }
];

const same = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value.toLowerCase() === b[index].toLowerCase());

const propData: PropRow[] = [
  {
    name: 'variant',
    type: "'default' | 'blue' | 'yellow' | 'pink'",
    default: "'default'",
    description: 'A ready-made palette with its own gap and speed. Any prop you pass overrides it.'
  },
  {
    name: 'colors',
    type: 'string | string[]',
    default: 'From variant',
    description: 'Pixel colors, as an array or a comma-separated string. Each pixel picks one at random.'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: 'From variant',
    description: 'Color of the soft light that follows the cursor across the card.'
  },
  { name: 'gap', type: 'number', default: 'From variant', description: 'Distance between pixels, in px.' },
  { name: 'pixelSize', type: 'number', default: '2', description: 'Largest size a pixel grows to, in px.' },
  {
    name: 'speed',
    type: 'number',
    default: 'From variant',
    description: 'How fast the pixels twinkle, from 0 to 100. 0 holds them still.'
  },
  {
    name: 'shape',
    type: "'square' | 'circle' | 'diamond'",
    default: "'square'",
    description: 'Shape of each pixel.'
  },
  {
    name: 'origin',
    type: "'center' | 'pointer'",
    default: "'center'",
    description: 'Where the reveal wave starts: the middle of the card, or wherever the pointer enters.'
  },
  {
    name: 'revealDuration',
    type: 'number',
    default: '600',
    description: 'How long the wave takes to sweep across the card, in ms.'
  },
  {
    name: 'spotlight',
    type: 'number',
    default: '0.5',
    description: 'How much pixels near the cursor swell and brighten, from 0 to 1.'
  },
  { name: 'glow', type: 'number', default: '0.5', description: 'Strength of the soft light under the pixels.' },
  {
    name: 'opacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the pixels and glow. Lower it to keep text on the card easy to read.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'Fades the pixels out toward the middle so they frame your content, from 0 to 1.'
  },
  {
    name: 'trigger',
    type: "'hover' | 'click' | 'always'",
    default: "'hover'",
    description: 'What turns the effect on: hovering or focusing the card, clicking it on and off, or always on.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ripple of brighter pixels out from the click.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Plays the reveal once when the card first scrolls into view.'
  },
  {
    name: 'introDelay',
    type: 'number',
    default: '0',
    description: 'Wait before the intro, in ms. Stagger it across a row of cards.'
  },
  {
    name: 'noFocus',
    type: 'boolean',
    default: 'From variant',
    description: 'Stops keyboard focus from triggering the effect.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the card.' },
  { name: 'radius', type: 'number', default: '24', description: 'Corner radius of the card, in px.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the card.' },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'Card content. It is centered and sits above the pixels.'
  }
];

const IconTile = (props: { ink: Ink; icon: IconSvgElement; size?: number }) => {
  const size = () => props.size ?? 34;
  return (
    <div
      class="pcd-tile"
      style={{ width: `${size()}px`, height: `${size()}px`, background: props.ink.tile, 'box-shadow': props.ink.rim }}
    >
      <HugeiconsIcon icon={props.icon} size={Math.round(size() * 0.5)} color={props.ink.text} strokeWidth={1.6} />
    </div>
  );
};

const ActionButton = (props: { ink: Ink; solid?: boolean; children: JSX.Element }) => (
  <button
    type="button"
    class="pcd-button"
    style={{
      '--pcd-hover': props.ink.hover,
      ...(props.solid
        ? { background: props.ink.solid, color: props.ink.solidText }
        : { background: props.ink.tile, color: props.ink.text, 'box-shadow': props.ink.rim })
    }}
  >
    {props.children}
  </button>
);

const Feature = (props: { ink: Ink; icon: IconSvgElement; title: string; text: string }) => (
  <div class="pcd-col pcd-col--feature" style={{ 'text-shadow': props.ink.halo }}>
    <IconTile ink={props.ink} icon={props.icon} />
    <div>
      <p class="pcd-title" style={{ color: props.ink.text }}>
        {props.title}
      </p>
      <p class="pcd-text" style={{ color: props.ink.muted }}>
        {props.text}
      </p>
    </div>
  </div>
);

const PricingScene = (props: { card: PixelCardProps; ink: Ink; accent: string }) => (
  <div class="pcd-grid">
    <For each={PLANS}>
      {(plan, index) => (
        <div class="pcd-plan">
          <PixelCard
            {...props.card}
            trigger={plan.featured ? 'always' : props.card.trigger}
            introDelay={index() * 140}
            style={{ width: '100%', height: '100%' }}
          >
            <div class="pcd-col pcd-col--plan" style={{ 'text-shadow': props.ink.halo }}>
              <div class="pcd-row" style={{ gap: '10px' }}>
                <IconTile ink={props.ink} icon={plan.icon} size={32} />
                <p class="pcd-title" style={{ color: props.ink.text }}>
                  {plan.name}
                </p>
                <Show when={plan.featured}>
                  <p
                    class="pcd-small"
                    style={{ 'margin-left': 'auto', 'font-size': '12px', 'font-weight': 500, color: props.accent }}
                  >
                    Popular
                  </p>
                </Show>
              </div>
              <div class="pcd-row" style={{ 'align-items': 'baseline', gap: '4px', 'margin-top': '22px' }}>
                <p class="pcd-price" style={{ color: props.ink.text }}>
                  {plan.price}
                </p>
                <p class="pcd-small" style={{ color: props.ink.muted }}>
                  /month
                </p>
              </div>
              <p class="pcd-small" style={{ 'margin-top': '8px', color: props.ink.muted }}>
                {plan.note}
              </p>
              <ul class="pcd-list">
                <For each={plan.features}>
                  {feature => (
                    <li style={{ color: props.ink.text }}>
                      <HugeiconsIcon icon={Tick02Icon} size={15} color={props.ink.faint} strokeWidth={2} />
                      {feature}
                    </li>
                  )}
                </For>
              </ul>
              <div style={{ 'margin-top': 'auto', 'padding-top': '20px' }}>
                <ActionButton ink={props.ink} solid={plan.featured}>
                  {plan.cta}
                </ActionButton>
              </div>
            </div>
          </PixelCard>
        </div>
      )}
    </For>
  </div>
);

const BentoScene = (props: { card: PixelCardProps; ink: Ink }) => (
  <div class="pcd-grid pcd-bento">
    <div class="pcd-span-col">
      <PixelCard {...props.card} introDelay={0} style={{ width: '100%', height: '100%' }}>
        <div class="pcd-col pcd-col--feature" style={{ 'text-shadow': props.ink.halo, gap: '0' }}>
          <div class="pcd-row">
            <For each={PEOPLE}>
              {(initials, index) => (
                <div
                  class="pcd-avatar"
                  style={{
                    'margin-left': index() ? '-8px' : '0',
                    color: props.ink.text,
                    background: props.ink.tile,
                    'box-shadow': props.ink.rim
                  }}
                >
                  {initials}
                </div>
              )}
            </For>
            <p class="pcd-small" style={{ 'margin-left': '10px', 'font-size': '12px', color: props.ink.muted }}>
              4 editing now
            </p>
          </div>
          <div>
            <p class="pcd-title" style={{ color: props.ink.text }}>
              Realtime collaboration
            </p>
            <p class="pcd-text" style={{ color: props.ink.muted }}>
              Edit together and see every cursor as it moves.
            </p>
          </div>
        </div>
      </PixelCard>
    </div>
    <div class="pcd-span-row">
      <PixelCard {...props.card} introDelay={160} style={{ width: '100%', height: '100%' }}>
        <div class="pcd-col pcd-col--feature" style={{ 'text-shadow': props.ink.halo, gap: '0' }}>
          <IconTile ink={props.ink} icon={WorkflowSquare03Icon} />
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '8px', margin: '16px 0' }}>
            <For each={STEPS}>
              {step => (
                <div
                  class="pcd-step"
                  style={{
                    color: props.ink.text,
                    background: props.ink.tile,
                    'box-shadow': props.ink.rim,
                    'text-shadow': 'none'
                  }}
                >
                  <HugeiconsIcon icon={Tick02Icon} size={15} color={props.ink.faint} strokeWidth={2} />
                  {step.label}
                  <span style={{ 'margin-left': 'auto', 'font-size': '12px', color: props.ink.muted }}>
                    {step.time}
                  </span>
                </div>
              )}
            </For>
          </div>
          <div>
            <p class="pcd-title" style={{ color: props.ink.text }}>
              Automated workflows
            </p>
            <p class="pcd-text" style={{ color: props.ink.muted }}>
              Every push is built, tested and shipped.
            </p>
          </div>
        </div>
      </PixelCard>
    </div>
    <div>
      <PixelCard {...props.card} introDelay={320} style={{ width: '100%', height: '100%' }}>
        <Feature ink={props.ink} icon={SecurityCheckIcon} title="SSO and audit logs" text="Every sign-in on record." />
      </PixelCard>
    </div>
    <div>
      <PixelCard {...props.card} introDelay={480} style={{ width: '100%', height: '100%' }}>
        <Feature ink={props.ink} icon={Globe02Icon} title="Global edge" text="Served close to every visitor." />
      </PixelCard>
    </div>
  </div>
);

export default function PixelCardDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, demo: _demo, palette: _palette, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = createMemo(() => INK[theme()]);

  const tones = createMemo(() => PALETTES[props().palette] ?? PALETTES.classic);
  const colors = createMemo(() => {
    const s = settings();
    const themed = theme() === 'light' && same(s.colors, tones().dark);
    return themed ? tones().light : s.colors;
  });
  const glowColor = createMemo(() => {
    const s = settings();
    return theme() === 'light' && s.glowColor.toLowerCase() === tones().glow[0].toLowerCase()
      ? tones().glow[1]
      : s.glowColor;
  });
  const accent = createMemo(() =>
    props().palette === 'classic' && settings().glowColor === PALETTES.classic.glow[0] ? ink().text : glowColor()
  );

  const card = createMemo(
    () => ({ ...settings(), colors: colors(), glowColor: glowColor(), theme: theme() }) as PixelCardProps
  );
  const computedProps = createMemo(() => ({ colors: colors(), glowColor: glowColor(), theme: theme() }));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof Look]]));
    updateProps({ ...base, ...PRESETS[value], opacity: modeOpacity(props().demo), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'demo', 'palette']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container pcd-stage">
            <RefreshButton onClick={forceRerender} />
            <Keyed token={rerenderKey()}>
              {() => (
                <div class="pcd-scene-wrap">
                  <Switch>
                    <Match when={props().demo === 'pricing'}>
                      <PricingScene card={card()} ink={ink()} accent={accent()} />
                    </Match>
                    <Match when={props().demo === 'bento'}>
                      <BentoScene card={card()} ink={ink()} />
                    </Match>
                    <Match when={props().demo === 'basic'}>
                      <PixelCard {...card()}>
                        <div class="pcd-basic-icon" style={{ '--pcd-ink': ink().text, '--pcd-accent': glowColor() }}>
                          <HugeiconsIcon icon={ICONS[props().preset] ?? SparklesIcon} size={48} strokeWidth={1.5} />
                        </div>
                      </PixelCard>
                    </Match>
                  </Switch>
                </div>
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={colors()}
              min={1}
              max={6}
              onChange={value => updateProps({ colors: value, palette: 'custom' })}
            />
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={(value: string) => {
                updateProps({ demo: value, opacity: modeOpacity(value) });
                forceRerender();
              }}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={glowColor()}
              onChange={value => updateProps({ glowColor: value, palette: 'custom' })}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings().trigger}
              onChange={(value: string) => updateProp('trigger', value)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings().shape}
              onChange={(value: string) => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Origin"
              options={ORIGIN_OPTIONS}
              value={settings().origin}
              onChange={(value: string) => updateProp('origin', value)}
            />
            <PreviewSlider
              title="Gap"
              min={3}
              max={20}
              step={1}
              value={settings().gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={10}
              step={0.1}
              value={settings().pixelSize}
              valueUnit="px"
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={100}
              step={1}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Reveal Duration"
              min={200}
              max={1600}
              step={50}
              value={settings().revealDuration}
              valueUnit="ms"
              onChange={value => updateProp('revealDuration', value)}
            />
            <PreviewSlider
              title="Spotlight"
              min={0}
              max={1}
              step={0.05}
              value={settings().spotlight}
              onChange={value => updateProp('spotlight', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings().glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={settings().opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings().fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={48}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Click Pulse"
              isChecked={settings().clickPulse}
              onChange={value => updateProp('clickPulse', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelCard} componentName="PixelCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
