import { For, Show, createMemo, createSignal } from 'solid-js';
import { Bookmark02Icon, Share03Icon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import SpotlightCard, { type SpotlightShape } from '@/content/Components/SpotlightCard/SpotlightCard';
import { spotlightCard } from '@/constants/code/Components/spotlightCardCode';
import './SpotlightCardDemo.css';

const DEFAULT_PROPS = {
  spotlightColor: '#ffffff',
  intensity: 0.15,
  spotlightSize: 240,
  softness: 0.7,
  shape: 'circle',
  borderGlow: 0.6,
  proximity: 80,
  smoothing: 0.3,
  grain: 0,
  ambient: false,
  flare: true
};

const SHAPE_OPTIONS = [
  { value: 'circle', label: 'Circle' },
  { value: 'beam', label: 'Beam' }
];

const AVATAR =
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=240&h=240&fit=crop&crop=focalpoint&fp-x=0.64&fp-y=0.355&fp-z=1.45&sat=-100&q=80';

const SKILLS = ['Figma', 'UX Design'];

const STATS = [
  { value: '4.5', label: 'Rating', star: true },
  { value: '$15K+', label: 'Earned' },
  { value: '$80/hr', label: 'Rate' }
];

const GLASS = {
  dark: {
    bg: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(255, 255, 255, 0.13)',
    shadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 24px -12px rgba(0, 0, 0, 0.7)'
  },
  light: {
    bg: 'rgba(24, 24, 27, 0.05)',
    hover: 'rgba(24, 24, 27, 0.08)',
    shadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 10px 24px -14px rgba(24, 24, 27, 0.3)'
  }
};

const Star = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <path d="M12 2.8l2.83 5.73 6.33.92-4.58 4.46 1.08 6.3L12 17.24l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92z" />
  </svg>
);

const ProfileContent = (props: { saved: boolean; onSave: () => void; theme: 'dark' | 'light' }) => {
  const glass = () => GLASS[props.theme] ?? GLASS.dark;

  return (
    <div
      class="spotlight-demo-profile"
      style={{ '--glass-bg': glass().bg, '--glass-hover': glass().hover, '--glass-shadow': glass().shadow }}
    >
      <div class="spotlight-demo-row">
        <div
          class="spotlight-demo-avatar"
          style={{ 'background-image': `url(${AVATAR})` }}
          role="img"
          aria-label="Ethan Harrison"
        />
        <button type="button" class="spotlight-demo-share" aria-label="Share profile">
          <HugeiconsIcon icon={Share03Icon} size={20} strokeWidth={1.6} />
        </button>
      </div>

      <p class="spotlight-demo-name">Ethan Harrison</p>
      <p class="spotlight-demo-role">Product designer</p>

      <div class="spotlight-demo-skills">
        <For each={SKILLS}>{skill => <div class="spotlight-demo-skill">{skill}</div>}</For>
      </div>

      <div class="spotlight-demo-stats">
        <For each={STATS}>
          {stat => (
            <div class="spotlight-demo-stat">
              <div class="spotlight-demo-stat-value">
                <Show when={stat.star}>
                  <Star />
                </Show>
                {stat.value}
              </div>
              <p class="spotlight-demo-stat-label">{stat.label}</p>
            </div>
          )}
        </For>
      </div>

      <div class="spotlight-demo-actions">
        <button type="button" class="spotlight-demo-glass spotlight-demo-touch">
          Get in touch
        </button>
        <button
          type="button"
          class={['spotlight-demo-glass', 'spotlight-demo-save', { 'is-saved': props.saved }]}
          aria-label={props.saved ? 'Remove bookmark' : 'Bookmark profile'}
          aria-pressed={props.saved ? 'true' : 'false'}
          onClick={() => props.onSave()}
        >
          <HugeiconsIcon icon={Bookmark02Icon} size={20} strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
};

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'Content of the card.' },
  {
    name: 'spotlightColor',
    type: 'string',
    default: 'undefined',
    description:
      'Color of the light. Any CSS color works and its alpha is respected. Defaults to white on dark cards and near black on light ones.'
  },
  {
    name: 'intensity',
    type: 'number',
    default: '0.15',
    description: 'Brightness of the light on the card surface, from 0 to 1.'
  },
  {
    name: 'spotlightSize',
    type: 'number',
    default: '240',
    description: 'Radius of the light in px.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.7',
    description: 'How gradually the light fades out. 0 gives a crisp disc, 1 a soft glow that fades from the center.'
  },
  {
    name: 'shape',
    type: "'circle' | 'beam'",
    default: "'circle'",
    description:
      'Circle is a round spotlight around the pointer. Beam pours light down from the top edge toward it, like a stage light.'
  },
  {
    name: 'borderGlow',
    type: 'number',
    default: '0.6',
    description: 'How much the card edge catches the light near the pointer, from 0 to 1.'
  },
  {
    name: 'proximity',
    type: 'number',
    default: '80',
    description:
      'Distance in px outside the card at which the light starts to reach it. Cards placed together share one light this way. 0 lights a card only while hovered.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.3',
    description: 'How far the light floats behind the pointer. 0 sticks to it.'
  },
  {
    name: 'ambient',
    type: 'boolean',
    default: 'false',
    description:
      'Lets the light drift slowly across the card while nothing points at it, which keeps cards alive on touch screens.'
  },
  {
    name: 'flare',
    type: 'boolean',
    default: 'true',
    description: 'The light swells and brightens while the card is pressed.'
  },
  {
    name: 'grain',
    type: 'number',
    default: '0',
    description: 'Film grain inside the light, from 0 to 1. A little removes banding from large soft gradients.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description:
      'Surface, border and light treatment for dark or light pages. Override the colors with the --spotlight-card-surface and --spotlight-card-border CSS variables.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the card.' },
  {
    name: '...rest',
    type: 'JSX.HTMLAttributes<HTMLDivElement>',
    default: '-',
    description: 'Any other div props, such as onClick, id or aria attributes, are passed to the card.'
  }
];

export default function SpotlightCardDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'dark' | 'light'>('light', 'dark');
  const [saved, setSaved] = createSignal(false);
  const inkDefault = createMemo(() => theme() === 'light' && props().spotlightColor === DEFAULT_PROPS.spotlightColor);

  const computedProps = createMemo(() => ({
    ...(inkDefault() ? { spotlightColor: '#18181b' } : {}),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{ position: 'relative', 'min-height': '480px', 'padding-top': '40px', 'padding-bottom': '40px' }}
          >
            <SpotlightCard
              spotlightColor={inkDefault() ? undefined : props().spotlightColor}
              intensity={props().intensity}
              spotlightSize={props().spotlightSize}
              softness={props().softness}
              shape={props().shape as SpotlightShape}
              borderGlow={props().borderGlow}
              proximity={props().proximity}
              smoothing={props().smoothing}
              grain={props().grain}
              ambient={props().ambient}
              flare={props().flare}
              theme={theme()}
              style={{ width: '100%', 'max-width': '330px', padding: '24px', 'border-radius': '28px' }}
            >
              <ProfileContent saved={saved()} onSave={() => setSaved(value => !value)} theme={theme()} />
            </SpotlightCard>
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Spotlight Color"
              color={inkDefault() ? '#18181b' : props().spotlightColor}
              onChange={value => updateProp('spotlightColor', value)}
            />

            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={props().shape}
              onChange={value => updateProp('shape', value)}
            />

            <PreviewSlider
              title="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={props().intensity}
              onChange={value => updateProp('intensity', value)}
            />

            <PreviewSlider
              title="Size"
              min={80}
              max={600}
              step={10}
              value={props().spotlightSize}
              onChange={value => updateProp('spotlightSize', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={props().softness}
              onChange={value => updateProp('softness', value)}
            />

            <PreviewSlider
              title="Border Glow"
              min={0}
              max={1}
              step={0.05}
              value={props().borderGlow}
              onChange={value => updateProp('borderGlow', value)}
            />

            <PreviewSlider
              title="Proximity"
              min={0}
              max={240}
              step={10}
              value={props().proximity}
              onChange={value => updateProp('proximity', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={props().smoothing}
              onChange={value => updateProp('smoothing', value)}
            />

            <PreviewSlider
              title="Grain"
              min={0}
              max={1}
              step={0.05}
              value={props().grain}
              onChange={value => updateProp('grain', value)}
            />

            <PreviewSwitch
              title="Ambient"
              isChecked={props().ambient}
              onChange={value => updateProp('ambient', value)}
            />

            <PreviewSwitch title="Flare" isChecked={props().flare} onChange={value => updateProp('flare', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={spotlightCard} componentName="SpotlightCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
