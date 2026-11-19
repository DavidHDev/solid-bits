import { createMemo, createSignal, onSettled } from 'solid-js';
import {
  AnalyticsUpIcon,
  DashboardSquare01Icon,
  PlugSocketIcon,
  SecurityCheckIcon,
  UserGroupIcon,
  WorkflowSquare03Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
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

import MagicBento, { type MagicBentoItem } from '@/content/Components/MagicBento/MagicBento';
import { magicBento } from '@/constants/code/Components/magicBentoCode';

const glyph = (icon: IconSvgElement) => <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />;

const buildBasic = (): MagicBentoItem[] => [
  { label: 'Insights', title: 'Analytics', description: 'Track user behavior', icon: glyph(AnalyticsUpIcon) },
  { label: 'Overview', title: 'Dashboard', description: 'Centralized data view', icon: glyph(DashboardSquare01Icon) },
  {
    label: 'Teamwork',
    title: 'Collaboration',
    description: 'Work together seamlessly',
    icon: glyph(UserGroupIcon),
    colSpan: 2,
    rowSpan: 2
  },
  {
    label: 'Efficiency',
    title: 'Automation',
    description: 'Streamline workflows',
    icon: glyph(WorkflowSquare03Icon),
    colSpan: 2,
    rowSpan: 2
  },
  { label: 'Connectivity', title: 'Integration', description: 'Connect favorite tools', icon: glyph(PlugSocketIcon) },
  { label: 'Protection', title: 'Security', description: 'Enterprise-grade protection', icon: glyph(SecurityCheckIcon) }
];

const GALLERY: Record<'light' | 'dark', MagicBentoItem[]> = {
  light: [
    {
      image: '/assets/demo/day-portrait.webp',
      title: 'The Pier',
      description: 'Clear sky',
      colSpan: 2,
      rowSpan: 2
    },
    { image: '/assets/demo/day-sky.webp', title: 'Open Sky', description: 'Golden hour', colSpan: 2 },
    { image: '/assets/demo/day-landscape.webp', title: 'Canola Field', description: 'Midday' },
    { image: '/assets/demo/night-sky.webp', title: 'Open Sky', description: 'Blue hour' },
    { image: '/assets/demo/night-landscape.webp', title: 'Canola Field', description: 'Moonrise', colSpan: 2 },
    { image: '/assets/demo/night-portrait.webp', title: 'The Pier', description: 'Dusk', colSpan: 2 }
  ],
  dark: [
    {
      image: '/assets/demo/night-portrait.webp',
      title: 'The Pier',
      description: 'Dusk',
      colSpan: 2,
      rowSpan: 2
    },
    { image: '/assets/demo/night-sky.webp', title: 'Open Sky', description: 'Blue hour', colSpan: 2 },
    { image: '/assets/demo/night-landscape.webp', title: 'Canola Field', description: 'Moonrise' },
    { image: '/assets/demo/day-sky.webp', title: 'Open Sky', description: 'Golden hour' },
    { image: '/assets/demo/day-landscape.webp', title: 'Canola Field', description: 'Midday', colSpan: 2 },
    { image: '/assets/demo/day-portrait.webp', title: 'The Pier', description: 'Clear sky', colSpan: 2 }
  ]
};

const LOOK = {
  glowColor: '',
  spotlightRadius: 300,
  enableBorderGlow: true,
  enableSpotlight: true,
  enableStars: false,
  particleCount: 24,
  enableTilt: false,
  enableMagnetism: false
};

const DEFAULT_PROPS = {
  demo: 'features',
  preset: 'classic',
  ...LOOK,
  rowHeight: 200,
  gap: 12,
  radius: 20,
  clickEffect: true,
  textAutoHide: true,
  intro: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  classic: {},
  ember: { glowColor: '#f97316', enableStars: true, particleCount: 28 },
  ocean: { glowColor: '#38bdf8', spotlightRadius: 420 },
  mint: { glowColor: '#34d399', enableStars: true, particleCount: 18, spotlightRadius: 260 },
  tilt: { enableTilt: true, enableMagnetism: true },
  quiet: { enableSpotlight: false, spotlightRadius: 220 }
};

const LIGHT_SWAP: Record<string, string> = {
  '#f97316': '#ea580c',
  '#38bdf8': '#0284c7',
  '#34d399': '#059669'
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'ember', label: 'Ember' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'mint', label: 'Mint' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'quiet', label: 'Quiet' }
];

const DEMO_OPTIONS = [
  { value: 'features', label: 'Features' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'basic', label: 'Basic' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'MagicBentoItem[]',
    default: 'Six feature cards',
    description:
      'Cards to show. Each takes label, title, description, icon, image, visual, content, href, onClick, colSpan and rowSpan.'
  },
  {
    name: 'items[].visual',
    type: 'JSX.Element | string',
    default: '-',
    description:
      'Artwork between the header and the text. Use your own node, or a built-in one: analytics, dashboard, collaboration, automation, integration or security.'
  },
  {
    name: 'items[].content',
    type: 'JSX.Element',
    default: '-',
    description: 'Replaces the whole inside of the card. The lights, border and click wave still apply.'
  },
  {
    name: 'items[].image',
    type: 'string',
    default: '-',
    description: 'Photo that fills the card, with a soft shade under the text.'
  },
  {
    name: 'columns',
    type: 'number',
    default: '4',
    description: 'Columns on wide screens. Drops to 2, then 1, as the grid gets narrower.'
  },
  { name: 'rowHeight', type: 'number', default: '200', description: 'Height of one row, in px.' },
  { name: 'gap', type: 'number', default: '12', description: 'Space between cards, in px.' },
  { name: 'radius', type: 'number', default: '20', description: 'Corner radius of the cards, in px.' },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the cards.' },
  {
    name: 'glowColor',
    type: 'string',
    default: 'Text color',
    description: 'Color of the lights and the accents in the artwork. Takes hex or "r, g, b".'
  },
  {
    name: 'enableBorderGlow',
    type: 'boolean',
    default: 'true',
    description: 'Lights up the card edges near the cursor, across neighboring cards too.'
  },
  {
    name: 'enableSpotlight',
    type: 'boolean',
    default: 'true',
    description: 'A soft light follows the cursor inside the hovered card.'
  },
  { name: 'spotlightRadius', type: 'number', default: '300', description: 'Size of the cursor light, in px.' },
  {
    name: 'enableStars',
    type: 'boolean',
    default: 'false',
    description: 'Fine specks of light drift up around the cursor in the hovered card.'
  },
  { name: 'particleCount', type: 'number', default: '24', description: 'Number of specks in each card.' },
  { name: 'enableTilt', type: 'boolean', default: 'false', description: 'Tilts the hovered card toward the cursor.' },
  {
    name: 'enableMagnetism',
    type: 'boolean',
    default: 'false',
    description: 'The hovered card leans a few pixels toward the cursor.'
  },
  {
    name: 'clickEffect',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of light across the grid and replays the card artwork.'
  },
  {
    name: 'textAutoHide',
    type: 'boolean',
    default: 'true',
    description: 'Keeps titles to one line and descriptions to two.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Cards rise in one by one and their artwork plays when the grid scrolls into view.'
  },
  {
    name: 'disableAnimations',
    type: 'boolean',
    default: 'false',
    description: 'Turns off all motion. Reduced motion settings do the same.'
  },
  {
    name: 'onItemClick',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when a card is clicked. Cards become focusable buttons.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the grid.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the grid.' }
];

const WIDE_QUERY = '(min-width: 768px)';

export default function MagicBentoDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const [wide, setWide] = createSignal(window.matchMedia(WIDE_QUERY).matches);
  let basic: MagicBentoItem[] | null = null;

  onSettled(() => {
    const query = window.matchMedia(WIDE_QUERY);
    const update = () => setWide(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  const settings = createMemo(() => {
    const { demo: _demo, preset: _preset, glowColor: _glowColor, ...rest } = props();
    return rest;
  });

  const picked = createMemo(() => {
    const value = props().glowColor;
    return value ? `#${String(value).replace(/^#/, '').toLowerCase()}` : '';
  });

  const color = createMemo(() => {
    const value = picked();
    return value && theme() === 'light' ? (LIGHT_SWAP[value] ?? value) : value;
  });

  const items = createMemo<MagicBentoItem[] | undefined>(() => {
    const demo = props().demo;
    if (demo === 'gallery') return GALLERY[theme()];
    if (demo === 'basic') return (basic ??= buildBasic());
    return undefined;
  });

  const applyPreset = (value: string) => {
    const name = value in PRESETS ? value : 'classic';
    const defaults = defaultProps();
    const base = Object.fromEntries(Object.keys(LOOK).map(key => [key, defaults[key as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[name], preset: name });
  };

  const computedProps = createMemo(() => ({
    ...(color() ? { glowColor: color() } : {}),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset', 'glowColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: 'auto',
              'min-height': wide() ? '600px' : '480px',
              padding: wide() ? '48px 32px' : '56px 16px',
              overflow: 'hidden',
              display: 'grid',
              'grid-template-columns': 'minmax(0, 1fr)',
              'place-items': 'center'
            }}
          >
            <RefreshButton onClick={forceRerender} />
            <div style={{ width: '100%', 'max-width': '760px' }}>
              <Keyed token={`${rerenderKey()}-${props().demo}`}>
                {() => <MagicBento theme={theme()} items={items()} glowColor={color() || undefined} {...settings()} />}
              </Keyed>
            </div>
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={(value: string) => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={color() || (theme() === 'light' ? '#11151b' : '#f2f4f7')}
              onChange={value => updateProp('glowColor', value)}
            />
            <PreviewSlider
              title="Spotlight Radius"
              min={120}
              max={600}
              step={10}
              value={settings().spotlightRadius}
              valueUnit="px"
              onChange={value => updateProp('spotlightRadius', value)}
            />
            <PreviewSlider
              title="Star Count"
              min={6}
              max={60}
              step={1}
              value={settings().particleCount}
              isDisabled={!settings().enableStars}
              onChange={value => updateProp('particleCount', value)}
            />
            <PreviewSlider
              title="Row Height"
              min={170}
              max={280}
              step={5}
              value={settings().rowHeight}
              valueUnit="px"
              onChange={value => updateProp('rowHeight', value)}
            />
            <PreviewSlider
              title="Gap"
              min={4}
              max={24}
              step={1}
              value={settings().gap}
              valueUnit="px"
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Border Glow"
              isChecked={settings().enableBorderGlow}
              onChange={value => updateProp('enableBorderGlow', value)}
            />
            <PreviewSwitch
              title="Spotlight"
              isChecked={settings().enableSpotlight}
              onChange={value => updateProp('enableSpotlight', value)}
            />
            <PreviewSwitch
              title="Stars"
              isChecked={settings().enableStars}
              onChange={value => updateProp('enableStars', value)}
            />
            <PreviewSwitch
              title="Tilt"
              isChecked={settings().enableTilt}
              onChange={value => updateProp('enableTilt', value)}
            />
            <PreviewSwitch
              title="Magnetism"
              isChecked={settings().enableMagnetism}
              onChange={value => updateProp('enableMagnetism', value)}
            />
            <PreviewSwitch
              title="Click Effect"
              isChecked={settings().clickEffect}
              onChange={value => updateProp('clickEffect', value)}
            />
            <PreviewSwitch
              title="Text Auto Hide"
              isChecked={settings().textAutoHide}
              onChange={value => updateProp('textAutoHide', value)}
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
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={magicBento} componentName="MagicBento" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
