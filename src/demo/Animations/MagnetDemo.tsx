import { For, createMemo } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import {
  ArrowRight01Icon,
  GithubIcon,
  Home01Icon,
  Message01Icon,
  Notification03Icon,
  PlayIcon,
  Search01Icon,
  Settings02Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import Magnet, { type MagnetProps } from '@/content/Animations/Magnet/Magnet';
import { magnet } from '@/constants/code/Animations/magnetCode';
import './MagnetDemo.css';

type Ink = {
  text: string;
  muted: string;
  hover: string;
  primary: string;
  primaryInk: string;
  primaryShadow: string;
  ghost: string;
  ghostShadow: string;
  panel: string;
  panelShadow: string;
  panelRim: string;
  tile: string;
  tileShadow: string;
  cardShadow: string;
  track: string;
  cover: string;
};

const INK: { dark: Ink; light: Ink } = {
  dark: {
    text: '#f4f4f5',
    muted: 'rgba(244, 244, 245, 0.56)',
    hover: 'brightness(1.12)',
    primary: 'linear-gradient(to bottom, #ffffff, #ececee)',
    primaryInk: '#0c0f13',
    primaryShadow:
      'inset 0 1px 0 #ffffff, inset 0 -1px 0 rgba(16, 17, 19, 0.1), 0 1px 2px rgba(0, 0, 0, 0.3), 0 10px 24px -10px rgba(0, 0, 0, 0.6)',
    ghost: 'rgba(255, 255, 255, 0.08)',
    ghostShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
    panel: 'rgba(36, 38, 42, 0.66)',
    panelShadow: '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
    panelRim: 'inset 0 1px 0 rgba(255, 255, 255, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
    tile: 'linear-gradient(180deg, #37393e 0%, #25272b 100%)',
    tileShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.07), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    cardShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.06), 0 30px 60px -30px rgba(0, 0, 0, 0.85), 0 10px 24px -14px rgba(0, 0, 0, 0.55)',
    track: 'rgba(255, 255, 255, 0.12)',
    cover: '/assets/demo/night-sky.webp'
  },
  light: {
    text: '#18181a',
    muted: 'rgba(24, 24, 26, 0.56)',
    hover: 'brightness(0.97)',
    primary: 'linear-gradient(to bottom, #28292c, #161719)',
    primaryInk: '#ffffff',
    primaryShadow:
      'inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(24, 24, 26, 0.25), 0 10px 24px -12px rgba(24, 24, 26, 0.5)',
    ghost: 'rgba(255, 255, 255, 0.72)',
    ghostShadow: 'inset 0 0 0 1px rgba(24, 24, 26, 0.08), 0 1px 2px rgba(24, 24, 26, 0.05)',
    panel: 'rgba(240, 241, 242, 0.8)',
    panelShadow: '0 22px 44px -22px rgba(24, 24, 26, 0.3), 0 6px 16px -10px rgba(24, 24, 26, 0.16)',
    panelRim: 'inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(24, 24, 26, 0.07)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f6f6f7 100%)',
    tileShadow: 'inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(24, 24, 26, 0.08), 0 4px 10px -5px rgba(24, 24, 26, 0.25)',
    cardShadow:
      'inset 0 1px 0 #ffffff, inset 0 0 0 1px rgba(24, 24, 26, 0.07), 0 30px 60px -32px rgba(24, 24, 26, 0.35), 0 10px 24px -16px rgba(24, 24, 26, 0.2)',
    track: 'rgba(24, 24, 26, 0.1)',
    cover: '/assets/demo/day-sky.webp'
  }
};

const DOCK_ICONS = [Home01Icon, Search01Icon, Notification03Icon, Message01Icon, Settings02Icon];

const FEEL = {
  padding: 100,
  magnetStrength: 2,
  stiffness: 170,
  damping: 16,
  tilt: 6,
  scale: 1,
  axis: 'both'
};

const DEFAULT_PROPS = {
  demo: 'buttons',
  preset: 'default',
  ...FEEL,
  disabled: false
};

const PRESETS: Record<string, typeof FEEL> = {
  default: { ...FEEL },
  subtle: { ...FEEL, padding: 60, magnetStrength: 5, stiffness: 150, damping: 20, tilt: 3 },
  snappy: { ...FEEL, padding: 90, stiffness: 420, damping: 28 },
  elastic: { ...FEEL, padding: 110, magnetStrength: 1.6, stiffness: 240, damping: 8 },
  floaty: { ...FEEL, padding: 140, magnetStrength: 2.4, stiffness: 50, damping: 9 },
  sticky: { ...FEEL, padding: 180, magnetStrength: 1.2, stiffness: 200, damping: 18 },
  lift: { ...FEEL, magnetStrength: 3, tilt: 14, scale: 1.06 }
};

const PRESET_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'snappy', label: 'Snappy' },
  { value: 'elastic', label: 'Elastic' },
  { value: 'floaty', label: 'Floaty' },
  { value: 'sticky', label: 'Sticky' },
  { value: 'lift', label: 'Lift' }
];

const DEMO_OPTIONS = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'dock', label: 'Dock' },
  { value: 'card', label: 'Card' },
  { value: 'basic', label: 'Basic' }
];

const AXIS_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'x', label: 'Horizontal' },
  { value: 'y', label: 'Vertical' }
];

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'The content that moves toward the cursor.'
  },
  {
    name: 'padding',
    type: 'number',
    default: '100',
    description: 'Distance in pixels around the element where the cursor starts to pull it.'
  },
  {
    name: 'magnetStrength',
    type: 'number',
    default: '2',
    description:
      'How far the element follows the cursor. The offset is divided by this value, so 1 follows the cursor and higher values move less.'
  },
  {
    name: 'exclusive',
    type: 'boolean',
    default: 'true',
    description:
      'When several magnets are in range, only the nearest exclusive one is pulled. Turn it off to let a group, like dock icons, lean toward the cursor together.'
  },
  {
    name: 'axis',
    type: "'both' | 'x' | 'y'",
    default: "'both'",
    description: 'Limits the movement to one axis.'
  },
  {
    name: 'maxOffset',
    type: 'number',
    default: '-',
    description: 'Caps how far the element can move from its resting place, in pixels.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Maximum 3D tilt toward the cursor, in degrees.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Scale of the element while the cursor pulls it.'
  },
  {
    name: 'spring',
    type: '{ stiffness?: number; damping?: number; mass?: number }',
    default: '{ stiffness: 170, damping: 16, mass: 1 }',
    description:
      'Spring that drives the movement. Higher stiffness reacts faster, lower damping lets it overshoot and wobble back.'
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Turns the effect off and lets the element spring back to rest.'
  },
  {
    name: 'onActiveChange',
    type: '(active: boolean) => void',
    default: '-',
    description:
      'Called when the cursor enters or leaves the magnetic area. The wrapper also gets a data-magnet-active attribute.'
  },
  {
    name: 'wrapperClassName',
    type: 'string',
    default: "''",
    description: 'Class name for the outer wrapper, which stays in place.'
  },
  {
    name: 'innerClassName',
    type: 'string',
    default: "''",
    description: 'Class name for the inner element that moves.'
  },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the outer wrapper.' }
];

type MagnetSettings = Omit<MagnetProps, 'children'>;

type SceneProps = { magnet: MagnetSettings; ink: Ink };

const ButtonsScene = (props: SceneProps) => (
  <div class="magnet-demo-buttons">
    <Magnet {...props.magnet} maxOffset={10}>
      <button
        type="button"
        class="magnet-demo-button"
        style={{
          '--magnet-demo-hover': props.ink.hover,
          background: props.ink.primary,
          color: props.ink.primaryInk,
          'box-shadow': props.ink.primaryShadow
        }}
      >
        Get started
        <span style={{ display: 'inline-flex', 'margin-right': '-4px' }}>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
        </span>
      </button>
    </Magnet>
    <Magnet {...props.magnet} maxOffset={10}>
      <button
        type="button"
        class="magnet-demo-button"
        style={{
          '--magnet-demo-hover': props.ink.hover,
          background: props.ink.ghost,
          color: props.ink.text,
          'box-shadow': props.ink.ghostShadow
        }}
      >
        <HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={1.8} />
        Star on GitHub
      </button>
    </Magnet>
  </div>
);

const DockScene = (props: SceneProps) => (
  <div class="magnet-demo-dock" style={{ background: props.ink.panel, 'box-shadow': props.ink.panelShadow }}>
    <For each={DOCK_ICONS}>
      {icon => (
        <Magnet {...props.magnet} exclusive={false} maxOffset={14}>
          <button
            type="button"
            aria-label="Dock item"
            class="magnet-demo-tile"
            style={{
              '--magnet-demo-hover': props.ink.hover,
              background: props.ink.tile,
              'box-shadow': props.ink.tileShadow,
              color: props.ink.text
            }}
          >
            <HugeiconsIcon icon={icon} size={21} strokeWidth={1.6} />
          </button>
        </Magnet>
      )}
    </For>
    <div class="magnet-demo-rim" style={{ 'box-shadow': props.ink.panelRim }} />
  </div>
);

const CardScene = (props: SceneProps) => (
  <Magnet {...props.magnet} maxOffset={36}>
    <div class="magnet-demo-card" style={{ background: props.ink.tile, 'box-shadow': props.ink.cardShadow }}>
      <div class="magnet-demo-cover" style={{ 'background-image': `url(${props.ink.cover})` }} />
      <div class="magnet-demo-meta">
        <div>
          <p class="magnet-demo-title" style={{ color: props.ink.text }}>
            Afterglow
          </p>
          <p class="magnet-demo-subtitle" style={{ color: props.ink.muted }}>
            Golden hour sessions
          </p>
        </div>
        <button
          type="button"
          aria-label="Play"
          class="magnet-demo-play"
          style={{ background: props.ink.primary, color: props.ink.primaryInk, 'box-shadow': props.ink.primaryShadow }}
        >
          <HugeiconsIcon icon={PlayIcon} size={17} strokeWidth={2} />
        </button>
      </div>
      <div class="magnet-demo-track" style={{ background: props.ink.track }}>
        <div class="magnet-demo-progress" style={{ background: props.ink.text }} />
      </div>
    </div>
  </Magnet>
);

const BasicScene = (props: SceneProps) => (
  <Magnet {...props.magnet}>
    <button
      type="button"
      class="magnet-demo-button"
      style={{
        '--magnet-demo-hover': props.ink.hover,
        background: props.ink.ghost,
        color: props.ink.text,
        'box-shadow': props.ink.ghostShadow
      }}
    >
      Hover me
    </button>
  </Magnet>
);

const SCENES: Record<string, (props: SceneProps) => ReturnType<typeof ButtonsScene>> = {
  buttons: ButtonsScene,
  dock: DockScene,
  card: CardScene,
  basic: BasicScene
};

export default function MagnetDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const ink = useColorModeValue(INK.light, INK.dark);
  const spring = createMemo(() => ({ stiffness: props().stiffness, damping: props().damping }));
  const computedProps = createMemo(() => ({ spring: spring() }));
  const magnetSettings = createMemo<MagnetSettings>(() => {
    const { demo: _demo, preset: _preset, stiffness: _stiffness, damping: _damping, ...rest } = props();
    return { ...rest, axis: rest.axis as MagnetProps['axis'], spring: spring() };
  });
  const scene = createMemo(() => SCENES[props().demo] || ButtonsScene);

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(FEEL).map(name => [name, defaultProps()[name as keyof typeof FEEL]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset', 'stiffness', 'damping']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container magnet-demo-stage">
            <Dynamic component={scene()} magnet={magnetSettings()} ink={ink()} />
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={v => updateProp('demo', v)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={props().axis}
              onChange={v => updateProp('axis', v)}
            />
            <PreviewSlider
              title="Padding"
              min={0}
              max={300}
              step={10}
              value={props().padding}
              valueUnit="px"
              onChange={v => updateProp('padding', v)}
            />
            <PreviewSlider
              title="Strength"
              min={1}
              max={10}
              step={0.1}
              value={props().magnetStrength}
              onChange={v => updateProp('magnetStrength', v)}
            />
            <PreviewSlider
              title="Stiffness"
              min={20}
              max={600}
              step={10}
              value={props().stiffness}
              onChange={v => updateProp('stiffness', v)}
            />
            <PreviewSlider
              title="Damping"
              min={2}
              max={40}
              step={1}
              value={props().damping}
              onChange={v => updateProp('damping', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={props().tilt}
              valueUnit="°"
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Scale"
              min={1}
              max={1.2}
              step={0.01}
              value={props().scale}
              onChange={v => updateProp('scale', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={magnet} componentName="Magnet" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
