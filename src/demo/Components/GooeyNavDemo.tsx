import { createMemo } from 'solid-js';
import { Briefcase01Icon, Home01Icon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import GooeyNav, { type GooeyNavItem, type GooeyNavProps } from '@/content/Components/GooeyNav/GooeyNav';
import { gooeyNav } from '@/constants/code/Components/gooeyNavCode';

const LABELS = ['Home', 'Work', 'About', 'Contact'];
const ICONS = [Home01Icon, Briefcase01Icon, UserIcon, Mail01Icon];

const PALETTES: Record<string, string[]> = {
  none: [],
  ember: ['#ff5a1f', '#ff8a3a', '#ffb020']
};

const FEEL = {
  icons: false,
  palette: 'none',
  particleCount: 15,
  spread: 56,
  timeVariance: 300,
  animationTime: 600,
  gooeyness: 0.5,
  wobble: 0.5
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...FEEL,
  color: '',
  size: 'md',
  frame: true,
  hoverEffect: true
};

const PRESETS: Record<string, Partial<typeof DEFAULT_PROPS>> = {
  classic: { ...FEEL },
  accent: { ...FEEL, color: '#ff5a1f', palette: 'ember' },
  splash: { ...FEEL, particleCount: 24, spread: 84, gooeyness: 0.65, timeVariance: 450 },
  calm: { ...FEEL, particleCount: 8, spread: 28, wobble: 0.2, animationTime: 520 },
  icons: { ...FEEL, icons: true }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'accent', label: 'Accent' },
  { value: 'splash', label: 'Splash' },
  { value: 'calm', label: 'Calm' },
  { value: 'icons', label: 'Icons' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: '{ label: string; href?: string; icon?: JSX.Element | (() => JSX.Element) }[]',
    default: '-',
    description: 'The navigation items. Items without an href render as buttons.'
  },
  { name: 'initialActiveIndex', type: 'number', default: '0', description: 'Which item starts selected.' },
  {
    name: 'activeIndex',
    type: 'number',
    default: '-',
    description: 'Controls the selected item yourself. Use it together with onChange.'
  },
  {
    name: 'onChange',
    type: '(index: number, item) => void',
    default: '-',
    description: 'Called when an item is selected.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the frame and text.' },
  {
    name: 'color',
    type: 'string',
    default: '-',
    description: 'Color of the active pill. Uses a high-contrast color for the theme when not set.'
  },
  {
    name: 'activeTextColor',
    type: 'string',
    default: '-',
    description: 'Text color inside the pill. Picked automatically from the pill color when not set.'
  },
  {
    name: 'colors',
    type: 'string[]',
    default: '[]',
    description: 'Colors for the droplets. They blend as they merge. Uses the pill color when empty.'
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size of the items.' },
  { name: 'frame', type: 'boolean', default: 'true', description: 'Shows the frosted panel around the items.' },
  {
    name: 'animationTime',
    type: 'number',
    default: '600',
    description: 'Roughly how long the droplets take to travel to the new item, in ms.'
  },
  {
    name: 'particleCount',
    type: 'number',
    default: '15',
    description: 'How many droplets the pill breaks into when an item is selected.'
  },
  {
    name: 'spread',
    type: 'number',
    default: '56',
    description: 'How far the droplets scatter on their way to the new item, in px.'
  },
  {
    name: 'timeVariance',
    type: 'number',
    default: '300',
    description: 'Random variation in each droplet’s timing, in ms.'
  },
  {
    name: 'gooeyness',
    type: 'number',
    default: '0.5',
    description: 'How readily the droplets and pills melt together, from 0 to 1.'
  },
  {
    name: 'wobble',
    type: 'number',
    default: '0.5',
    description: 'How much the new pill wobbles as it forms, from 0 to 1.'
  },
  {
    name: 'hoverEffect',
    type: 'boolean',
    default: 'true',
    description: 'Shows a soft highlight behind the hovered item.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the nav.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the nav.' }
];

export default function GooeyNavDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, icons: _icons, palette: _palette, color: _color, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const pill = useColorModeValue('#27272a', '#f4f4f5');

  const showIcons = createMemo(() => props().icons);
  const items = createMemo<GooeyNavItem[]>(() => {
    const icons = showIcons();
    return LABELS.map((label, index) => ({
      label,
      href: '#',
      ...(icons ? { icon: () => <HugeiconsIcon icon={ICONS[index]} size={16} strokeWidth={1.8} /> } : {})
    }));
  });

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(FEEL).map(name => [name, defaultProps()[name as keyof typeof FEEL]]));
    updateProps({ ...base, color: '', ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => {
    const { color, palette } = props();
    return {
      ...(color ? { color } : {}),
      ...(PALETTES[palette]?.length ? { colors: PALETTES[palette] } : {}),
      ...(theme() === 'light' ? { theme: 'light' } : {})
    };
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'icons', 'palette', 'color']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '400px',
              padding: '16px',
              overflow: 'hidden',
              display: 'grid',
              'place-items': 'center'
            }}
          >
            <GooeyNav
              items={items()}
              theme={theme()}
              color={props().color || undefined}
              colors={PALETTES[props().palette] ?? []}
              {...(settings() as GooeyNavProps)}
            />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Pill Color"
              color={props().color || pill()}
              onChange={v => updateProp('color', v)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={settings().size}
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Particle Count"
              min={1}
              max={32}
              step={1}
              value={settings().particleCount}
              onChange={v => updateProp('particleCount', v)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={120}
              step={2}
              value={settings().spread}
              valueUnit="px"
              onChange={v => updateProp('spread', v)}
            />
            <PreviewSlider
              title="Animation Time"
              min={200}
              max={1500}
              step={50}
              value={settings().animationTime}
              valueUnit="ms"
              onChange={v => updateProp('animationTime', v)}
            />
            <PreviewSlider
              title="Time Variance"
              min={0}
              max={1000}
              step={50}
              value={settings().timeVariance}
              valueUnit="ms"
              onChange={v => updateProp('timeVariance', v)}
            />
            <PreviewSlider
              title="Gooeyness"
              min={0}
              max={1}
              step={0.05}
              value={settings().gooeyness}
              onChange={v => updateProp('gooeyness', v)}
            />
            <PreviewSlider
              title="Wobble"
              min={0}
              max={1}
              step={0.05}
              value={settings().wobble}
              onChange={v => updateProp('wobble', v)}
            />
            <PreviewSwitch title="Frame" isChecked={settings().frame} onChange={v => updateProp('frame', v)} />
            <PreviewSwitch title="Icons" isChecked={props().icons} onChange={v => updateProp('icons', v)} />
            <PreviewSwitch
              title="Hover Effect"
              isChecked={settings().hoverEffect}
              onChange={v => updateProp('hoverEffect', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gooeyNav} componentName="GooeyNav" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
