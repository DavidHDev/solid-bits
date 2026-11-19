import { For, Show, createMemo, createSignal } from 'solid-js';
import { Dynamic } from '@solidjs/web';
import {
  ArrowDown01Icon,
  ArrowUp02Icon,
  Attachment02Icon,
  CloudUploadIcon,
  FlashIcon,
  Image01Icon,
  Mic02Icon,
  Pdf01Icon,
  Rocket01Icon,
  SparklesIcon,
  StopIcon,
  Tick02Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
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

import ElectricBorder, { type ElectricBorderProps } from '@/content/Animations/ElectricBorder/ElectricBorder';
import { electricBorder } from '@/constants/code/Animations/electricBorderCode';

type Ink = {
  text: string;
  muted: string;
  faint: string;
  panel: string;
  panelRim: string;
  tile: string;
  rim: string;
  well: string;
  wellRim: string;
  track: string;
  solid: string;
  solidText: string;
};

const INK: Record<'dark' | 'light', Ink> = {
  dark: {
    text: '#f2f4f7',
    muted: 'rgba(242, 244, 247, 0.6)',
    faint: 'rgba(242, 244, 247, 0.34)',
    panel: 'linear-gradient(180deg, #1c1e22 0%, #11151b 100%)',
    panelRim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
    tile: 'linear-gradient(180deg, #36393f 0%, #25272b 100%)',
    rim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.7)',
    well: 'rgba(255, 255, 255, 0.025)',
    wellRim: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
    track: 'rgba(255, 255, 255, 0.08)',
    solid: '#f2f4f7',
    solidText: '#090b0e'
  },
  light: {
    text: '#18181b',
    muted: 'rgba(24, 24, 27, 0.6)',
    faint: 'rgba(24, 24, 27, 0.36)',
    panel: 'linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%)',
    panelRim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), 0 8px 24px -12px rgba(24, 24, 27, 0.18)',
    tile: 'linear-gradient(180deg, #ffffff 0%, #f4f4f6 100%)',
    rim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 1), 0 4px 10px -5px rgba(24, 24, 27, 0.25)',
    well: 'rgba(24, 24, 27, 0.025)',
    wellRim: 'inset 0 0 0 1px rgba(24, 24, 27, 0.06)',
    track: 'rgba(24, 24, 27, 0.08)',
    solid: '#18181b',
    solidText: '#ffffff'
  }
};

const STYLES = `
.eb-demo-stage { position: relative; height: 520px; padding: 0 28px; overflow: hidden; display: flex; align-items: center; justify-content: center; container-type: inline-size; container-name: electric; }
@media (min-width: 48em) { .eb-demo-stage { height: 560px; } }
.eb-demo-stage p { margin: 0; }
.eb-demo-tile { border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; }
.eb-demo-tool { width: 34px; height: 34px; padding: 0; border: 0; border-radius: 999px; display: grid; place-items: center; flex-shrink: 0; cursor: pointer; transition: transform 160ms ease, filter 160ms ease; }
.eb-demo-tool:hover { filter: brightness(1.08); }
.eb-demo-tool:active { transform: scale(0.94); }
.eb-demo-panel { width: 100%; padding: 14px; }
.eb-demo-prompt { padding: 4px 6px 0; min-height: 80px; font-size: 15px; line-height: 1.6; }
.eb-demo-toolbar { margin-top: 10px; display: flex; align-items: center; gap: 8px; }
.eb-demo-model { display: flex; align-items: center; gap: 4px; height: 34px; padding: 0 12px; border-radius: 999px; font-size: 13px; font-weight: 500; }
.eb-demo-grow { flex: 1; }
.eb-demo-pricing { display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; width: 100%; max-width: 300px; }
.eb-demo-plan-slot { height: 370px; }
.eb-demo-plan-slot.is-side { display: none; }
.eb-demo-plan { display: flex; flex-direction: column; height: 100%; padding: 22px; text-align: left; }
.eb-demo-plan-head { display: flex; align-items: center; gap: 10px; }
.eb-demo-plan-name { font-size: 15px; font-weight: 500; }
.eb-demo-plan-badge { margin-left: auto !important; font-size: 12px; font-weight: 500; }
.eb-demo-plan-price { display: flex; align-items: baseline; gap: 4px; margin-top: 22px; }
.eb-demo-plan-amount { font-size: 34px; font-weight: 500; letter-spacing: -0.03em; line-height: 1; }
.eb-demo-plan-unit { font-size: 13px; }
.eb-demo-plan-note { font-size: 13px; margin-top: 8px !important; }
.eb-demo-plan-features { display: flex; flex-direction: column; gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; }
.eb-demo-plan-feature { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.eb-demo-plan-cta { margin-top: auto; width: 100%; height: 38px; padding: 0; border: 0; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; transition: filter 200ms ease; }
.eb-demo-plan-cta:hover { filter: brightness(1.08); }
.eb-demo-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 172px; }
.eb-demo-drop-title { margin-top: 4px !important; font-size: 14px; font-weight: 500; }
.eb-demo-drop-note { font-size: 12px; }
.eb-demo-files { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.eb-demo-file { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 12px; }
.eb-demo-file-body { flex: 1; min-width: 0; }
.eb-demo-file-head { display: flex; align-items: baseline; gap: 8px; }
.eb-demo-file-name { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.eb-demo-file-size { margin-left: auto !important; font-size: 12px; flex-shrink: 0; }
.eb-demo-track { margin-top: 8px; height: 4px; border-radius: 999px; overflow: hidden; }
.eb-demo-bar { height: 100%; border-radius: 999px; opacity: 0.8; }
.eb-demo-basic { display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 340px; padding: 24px; }
.eb-demo-basic-title { font-size: 17px; font-weight: 500; }
.eb-demo-basic-text { font-size: 13px; line-height: 1.5; margin-top: 6px !important; }
@container electric (min-width: 660px) {
  .eb-demo-pricing { grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 740px; }
  .eb-demo-plan-slot.is-side { display: block; }
}
`;

const LOOK = {
  color: '#7df9ff',
  speed: 1,
  chaos: 0.5,
  spread: 0.6,
  thickness: 1.5,
  strands: 3,
  glow: 0.6,
  intensity: 0.8,
  arcs: 1,
  flicker: 0.5
};

const DEFAULT_PROPS = {
  demo: 'composer',
  preset: 'voltage',
  ...LOOK,
  borderRadius: 24,
  offset: 0,
  cursorRadius: 90,
  active: true,
  interactive: true,
  intro: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  voltage: {},
  plasma: { color: '#6ec9f7' },
  ember: { color: '#fb923c', chaos: 0.7, flicker: 0.7 },
  emerald: { color: '#34d399', strands: 4, spread: 0.8 },
  storm: { color: '#93c5fd', strands: 5, chaos: 0.9, spread: 1.1, arcs: 2.5, flicker: 0.8, glow: 0.8 },
  silver: { color: '#e4e4e7', strands: 2, chaos: 0.25, spread: 0.3, arcs: 0, flicker: 0.15, glow: 0.4 }
};

const LIGHT_SWAP: Record<string, string> = {
  '#7df9ff': '#0891b2',
  '#6ec9f7': '#0977ae',
  '#fb923c': '#ea580c',
  '#34d399': '#059669',
  '#93c5fd': '#2563eb',
  '#e4e4e7': '#52525b'
};

const DARK_SWAP: Record<string, string> = Object.fromEntries(
  Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark])
);

const DEMO_OPTIONS = [
  { value: 'composer', label: 'Composer' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'upload', label: 'Upload' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'voltage', label: 'Voltage' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'ember', label: 'Ember' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'storm', label: 'Storm' },
  { value: 'silver', label: 'Silver' }
];

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

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'Content wrapped by the electric border.' },
  {
    name: 'color',
    type: 'string',
    default: "'#7df9ff'",
    description: 'Color of the current. The strands burn whiter at their core.'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: '-',
    description: 'Color of the glow around the strands. Defaults to color.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the current crackles and moves.' },
  { name: 'chaos', type: 'number', default: '0.5', description: 'How jagged the strands are, from 0 to 2.' },
  {
    name: 'spread',
    type: 'number',
    default: '0.6',
    description: 'How far the strands wander from the edge, from 0 to 2.'
  },
  { name: 'thickness', type: 'number', default: '1.5', description: 'Thickness of the strands, in px.' },
  {
    name: 'strands',
    type: 'number',
    default: '3',
    description: 'Number of strands running along the edge, from 1 to 6.'
  },
  { name: 'glow', type: 'number', default: '0.6', description: 'Strength of the glow around the border.' },
  { name: 'intensity', type: 'number', default: '0.8', description: 'Overall brightness of the current.' },
  {
    name: 'arcs',
    type: 'number',
    default: '1',
    description: 'How often sparks leap off the border. 0 turns them off.'
  },
  { name: 'flicker', type: 'number', default: '0.5', description: 'How much the current flickers, from 0 to 1.' },
  {
    name: 'borderRadius',
    type: 'number',
    default: '24',
    description: 'Corner radius of the border, in px. Match it to your content.'
  },
  {
    name: 'offset',
    type: 'number',
    default: '0',
    description: 'Moves the border outward from the edge of the content, in px. Negative values move it inward.'
  },
  {
    name: 'active',
    type: 'boolean',
    default: 'true',
    description: 'Powers the border on or off. Turning it on sends the current racing around the edge again.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The current races around the edge from the top when the border mounts.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'The current surges near the cursor and clicks send a jolt around the edge.'
  },
  {
    name: 'cursorRadius',
    type: 'number',
    default: '90',
    description: 'Size of the area around the cursor where the current surges, in px.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Glowing light for dark pages, or crisp ink with a white core for light ones.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the wrapper.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the wrapper.' }
];

const swapColor = (value: string, swap: Record<string, string>) => {
  const key = `#${String(value).replace(/^#/, '').toLowerCase()}`;
  return swap[key] ?? key;
};

type SceneProps = { border: ElectricBorderProps; ink: Ink; radius: number };

function IconTile(props: { ink: Ink; icon: IconSvgElement; size?: number }) {
  const size = () => props.size ?? 34;
  return (
    <div
      class="eb-demo-tile"
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

function ToolButton(props: { ink: Ink; icon: IconSvgElement; label: string; onClick?: () => void; solid?: boolean }) {
  return (
    <button
      type="button"
      class="eb-demo-tool"
      aria-label={props.label}
      onClick={() => props.onClick?.()}
      style={
        props.solid
          ? { background: props.ink.solid, color: props.ink.solidText }
          : { background: props.ink.tile, 'box-shadow': props.ink.rim }
      }
    >
      <HugeiconsIcon
        icon={props.icon}
        size={16}
        color={props.solid ? props.ink.solidText : props.ink.text}
        strokeWidth={1.8}
      />
    </button>
  );
}

function ComposerScene(props: SceneProps) {
  const [generating, setGenerating] = createSignal(true);

  return (
    <ElectricBorder
      {...props.border}
      active={(props.border.active ?? true) && generating()}
      borderRadius={props.radius}
      style={{ width: '100%', 'max-width': '520px' }}
    >
      <div
        class="eb-demo-panel"
        style={{ 'border-radius': `${props.radius}px`, background: props.ink.panel, 'box-shadow': props.ink.panelRim }}
      >
        <p class="eb-demo-prompt" style={{ color: props.ink.text }}>
          Write a launch post for our new electric borders. Keep it short and upbeat.
        </p>
        <div class="eb-demo-toolbar">
          <ToolButton ink={props.ink} icon={Attachment02Icon} label="Attach a file" />
          <div
            class="eb-demo-model"
            style={{ color: props.ink.text, background: props.ink.tile, 'box-shadow': props.ink.rim }}
          >
            Fast
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} color={props.ink.muted} strokeWidth={1.8} />
          </div>
          <div class="eb-demo-grow" />
          <ToolButton ink={props.ink} icon={Mic02Icon} label="Dictate" />
          <ToolButton
            ink={props.ink}
            solid
            icon={generating() ? StopIcon : ArrowUp02Icon}
            label={generating() ? 'Stop generating' : 'Send'}
            onClick={() => setGenerating(value => !value)}
          />
        </div>
      </div>
    </ElectricBorder>
  );
}

function PlanCard(props: { plan: Plan; ink: Ink; radius: number; accent?: string }) {
  return (
    <div
      class="eb-demo-plan"
      style={{ 'border-radius': `${props.radius}px`, background: props.ink.panel, 'box-shadow': props.ink.panelRim }}
    >
      <div class="eb-demo-plan-head">
        <IconTile ink={props.ink} icon={props.plan.icon} size={32} />
        <p class="eb-demo-plan-name" style={{ color: props.ink.text }}>
          {props.plan.name}
        </p>
        <Show when={props.plan.featured}>
          <p class="eb-demo-plan-badge" style={{ color: props.accent }}>
            Popular
          </p>
        </Show>
      </div>
      <div class="eb-demo-plan-price">
        <p class="eb-demo-plan-amount" style={{ color: props.ink.text }}>
          {props.plan.price}
        </p>
        <p class="eb-demo-plan-unit" style={{ color: props.ink.muted }}>
          /month
        </p>
      </div>
      <p class="eb-demo-plan-note" style={{ color: props.ink.muted }}>
        {props.plan.note}
      </p>
      <ul class="eb-demo-plan-features">
        <For each={props.plan.features}>
          {feature => (
            <li class="eb-demo-plan-feature" style={{ color: props.ink.text }}>
              <HugeiconsIcon icon={Tick02Icon} size={15} color={props.ink.faint} strokeWidth={2} />
              {feature}
            </li>
          )}
        </For>
      </ul>
      <button
        type="button"
        class="eb-demo-plan-cta"
        style={
          props.plan.featured
            ? { background: props.ink.solid, color: props.ink.solidText }
            : { background: props.ink.tile, color: props.ink.text, 'box-shadow': props.ink.rim }
        }
      >
        {props.plan.cta}
      </button>
    </div>
  );
}

function PricingScene(props: SceneProps) {
  return (
    <div class="eb-demo-pricing">
      <For each={PLANS}>
        {plan =>
          plan.featured ? (
            <div class="eb-demo-plan-slot">
              <ElectricBorder {...props.border} borderRadius={props.radius} style={{ height: '100%' }}>
                <PlanCard plan={plan} ink={props.ink} radius={props.radius} accent={props.border.color} />
              </ElectricBorder>
            </div>
          ) : (
            <div class="eb-demo-plan-slot is-side">
              <PlanCard plan={plan} ink={props.ink} radius={props.radius} />
            </div>
          )
        }
      </For>
    </div>
  );
}

function FileRow(props: { ink: Ink; icon: IconSvgElement; name: string; size: string; progress: number }) {
  return (
    <div class="eb-demo-file" style={{ background: props.ink.well, 'box-shadow': props.ink.wellRim }}>
      <IconTile ink={props.ink} icon={props.icon} size={32} />
      <div class="eb-demo-file-body">
        <div class="eb-demo-file-head">
          <p class="eb-demo-file-name" style={{ color: props.ink.text }}>
            {props.name}
          </p>
          <p class="eb-demo-file-size" style={{ color: props.ink.muted }}>
            {props.progress >= 1 ? props.size : `${Math.round(props.progress * 100)}%`}
          </p>
        </div>
        <div class="eb-demo-track" style={{ background: props.ink.track }}>
          <div class="eb-demo-bar" style={{ width: `${props.progress * 100}%`, background: props.ink.text }} />
        </div>
      </div>
    </div>
  );
}

function UploadScene(props: SceneProps) {
  const [hovered, setHovered] = createSignal(false);

  return (
    <ElectricBorder
      {...props.border}
      active={(props.border.active ?? true) && hovered()}
      borderRadius={props.radius}
      style={{ width: '100%', 'max-width': '440px' }}
    >
      <div
        class="eb-demo-panel"
        style={{ 'border-radius': `${props.radius}px`, background: props.ink.panel, 'box-shadow': props.ink.panelRim }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <div
          class="eb-demo-drop"
          style={{
            'border-radius': `${Math.max(4, props.radius - 10)}px`,
            background: props.ink.well,
            'box-shadow': props.ink.wellRim
          }}
        >
          <IconTile ink={props.ink} icon={CloudUploadIcon} size={40} />
          <p class="eb-demo-drop-title" style={{ color: props.ink.text }}>
            Drop files to upload
          </p>
          <p class="eb-demo-drop-note" style={{ color: props.ink.muted }}>
            PNG, JPG or PDF, up to 10 MB
          </p>
        </div>
        <div class="eb-demo-files">
          <FileRow ink={props.ink} icon={Pdf01Icon} name="Brand guidelines.pdf" size="4.2 MB" progress={1} />
          <FileRow ink={props.ink} icon={Image01Icon} name="Hero shot.png" size="2.8 MB" progress={0.64} />
        </div>
      </div>
    </ElectricBorder>
  );
}

function BasicScene(props: SceneProps) {
  return (
    <ElectricBorder {...props.border} borderRadius={props.radius} style={{ width: '100%', 'max-width': '280px' }}>
      <div
        class="eb-demo-basic"
        style={{ 'border-radius': `${props.radius}px`, background: props.ink.panel, 'box-shadow': props.ink.panelRim }}
      >
        <IconTile ink={props.ink} icon={FlashIcon} size={38} />
        <div>
          <p class="eb-demo-basic-title" style={{ color: props.ink.text }}>
            Electric Border
          </p>
          <p class="eb-demo-basic-text" style={{ color: props.ink.muted }}>
            Wrap anything in a living current.
          </p>
        </div>
      </div>
    </ElectricBorder>
  );
}

const SCENES: Record<string, (props: SceneProps) => ReturnType<typeof BasicScene>> = {
  composer: ComposerScene,
  pricing: PricingScene,
  upload: UploadScene,
  basic: BasicScene
};

export default function ElectricBorderDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = createMemo(() => INK[theme()]);
  const shown = createMemo(() => swapColor(props().color, theme() === 'light' ? LIGHT_SWAP : DARK_SWAP));
  const settings = createMemo(() => {
    const { demo: _demo, preset: _preset, color: _color, borderRadius: _radius, ...rest } = props();
    return rest;
  });
  const border = createMemo<ElectricBorderProps>(() => ({ ...settings(), color: shown(), theme: theme() }));
  const computedProps = createMemo(() => ({
    color: shown(),
    ...(theme() === 'light' ? { theme: 'light' } : {})
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
      demoOnlyProps={['demo', 'preset', 'color']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <style>{STYLES}</style>
          <div class="demo-container eb-demo-stage">
            <Keyed token={rerenderKey()}>
              {() => (
                <Dynamic
                  component={SCENES[props().demo] ?? ComposerScene}
                  border={border()}
                  ink={ink()}
                  radius={props().borderRadius}
                />
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
            <PreviewColorPickerCustom title="Color" color={shown()} onChange={value => updateProp('color', value)} />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Chaos"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().chaos}
              onChange={value => updateProp('chaos', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().spread}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={4}
              step={0.1}
              value={settings().thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Strands"
              min={1}
              max={6}
              step={1}
              value={settings().strands}
              onChange={value => updateProp('strands', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings().glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.3}
              max={2}
              step={0.05}
              value={settings().intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Arcs"
              min={0}
              max={3}
              step={0.1}
              value={settings().arcs}
              onChange={value => updateProp('arcs', value)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={settings().flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Border Radius"
              min={0}
              max={40}
              step={1}
              value={props().borderRadius}
              valueUnit="px"
              onChange={value => updateProp('borderRadius', value)}
            />
            <PreviewSlider
              title="Offset"
              min={-6}
              max={12}
              step={1}
              value={settings().offset}
              valueUnit="px"
              onChange={value => updateProp('offset', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={30}
              max={200}
              step={5}
              value={settings().cursorRadius}
              valueUnit="px"
              onChange={value => updateProp('cursorRadius', value)}
            />
            <PreviewSwitch
              title="Active"
              isChecked={settings().active}
              onChange={value => updateProp('active', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings().interactive}
              onChange={value => updateProp('interactive', value)}
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
          <CodeExample codeObject={electricBorder} componentName="ElectricBorder" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
