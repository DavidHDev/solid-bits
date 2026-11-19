import { Show, createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  Book02Icon,
  ChartHistogramIcon,
  CloudIcon,
  DribbbleIcon,
  FavouriteIcon,
  Folder01Icon,
  GithubIcon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  Note01Icon,
  YoutubeIcon
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
import type { IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import GlassIcons, { type GlassIconsItem, type GlassIconsProps } from '@/content/Components/GlassIcons/GlassIcons';
import { glassIcons } from '@/constants/code/Components/glassIconsCode';

const markup = (icon: IconSvgElement) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${name === 'stroke-width' ? 1.8 : value}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

const glyph = (icon: IconSvgElement): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    color="currentColor"
    innerHTML={markup(icon)}
  />
);

type Entry = { icon: IconSvgElement; color: string; label: string };

const APPS: Entry[] = [
  { icon: Folder01Icon, color: 'blue', label: 'Files' },
  { icon: Book02Icon, color: 'teal', label: 'Books' },
  { icon: FavouriteIcon, color: 'red', label: 'Health' },
  { icon: CloudIcon, color: 'linear-gradient(135deg, hsl(200, 92%, 74%), hsl(208, 76%, 56%))', label: 'Weather' },
  { icon: Note01Icon, color: 'orange', label: 'Notes' },
  { icon: ChartHistogramIcon, color: 'green', label: 'Stats' }
];

const MONO: Entry[] = APPS.map(item => ({ ...item, color: 'graphite' }));

const SOCIAL: Entry[] = [
  { icon: GithubIcon, color: 'linear-gradient(135deg, #46494e, #1b1c1f)', label: 'GitHub' },
  { icon: NewTwitterIcon, color: 'linear-gradient(135deg, #3b3d42, #111214)', label: 'X' },
  { icon: Linkedin01Icon, color: 'linear-gradient(135deg, #2f8ae0, #0a5bb8)', label: 'LinkedIn' },
  {
    icon: InstagramIcon,
    color: 'linear-gradient(135deg, #feda75, #fa7e1e 30%, #e5372c 60%, #b8241c 85%)',
    label: 'Instagram'
  },
  { icon: YoutubeIcon, color: 'linear-gradient(135deg, #ff4e45, #c4120a)', label: 'YouTube' },
  { icon: DribbbleIcon, color: 'linear-gradient(135deg, #ff9a6b, #e8553a)', label: 'Dribbble' }
];

const itemsFor = (preset: string): GlassIconsItem[] =>
  (preset === 'mono' ? MONO : preset === 'social' ? SOCIAL : APPS).map(entry => ({
    icon: glyph(entry.icon),
    color: entry.color,
    label: entry.label
  }));

const DEFAULT_PROPS = {
  preset: 'apps',
  size: 82,
  gap: 66,
  columns: 3,
  roundness: 0.6,
  refraction: 0.8,
  bevel: 0.6,
  dispersion: 0,
  frost: 0.2,
  shine: 0.85,
  tint: '#dfdfdf',
  tintOpacity: 0.2,
  iconColor: '',
  plate: 'tilt',
  tilt: 30,
  spread: 0.5,
  hover: 'press',
  parallax: 1,
  labels: 'hover',
  intro: true
};

type DemoProps = typeof DEFAULT_PROPS;

const PRESETS: Record<string, Partial<DemoProps>> = {
  apps: {},
  mono: {},
  social: { size: 56, gap: 22, columns: 6, roundness: 1, plate: 'circle', spread: 0.12 },
  dock: { size: 60, gap: 16, columns: 6, roundness: 0.42, plate: 'offset', spread: 0.35, hover: 'float' },
  clear: { plate: 'none', refraction: 0.9, dispersion: 0.6, frost: 0.15, tintOpacity: 0.06 }
};

const PRESET_OPTIONS = [
  { value: 'apps', label: 'Apps' },
  { value: 'mono', label: 'Mono' },
  { value: 'social', label: 'Social' },
  { value: 'dock', label: 'Dock' },
  { value: 'clear', label: 'Clear' }
];

const PLATE_OPTIONS = [
  { value: 'tilt', label: 'Tilt' },
  { value: 'offset', label: 'Offset' },
  { value: 'circle', label: 'Circle' },
  { value: 'none', label: 'None' }
];

const HOVER_OPTIONS = [
  { value: 'lift', label: 'Lift' },
  { value: 'float', label: 'Float' },
  { value: 'press', label: 'Press' },
  { value: 'none', label: 'None' }
];

const LABEL_OPTIONS = [
  { value: 'hover', label: 'On Hover' },
  { value: 'always', label: 'Always' },
  { value: 'none', label: 'Hidden' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'GlassIconsItem[]',
    default: '[]',
    description:
      'Icons to show. Each item takes an icon, a label and a color, plus an optional href, target, onClick, id and className. Color is a preset name (blue, purple, red, indigo, orange, green, teal, pink, graphite, silver) or any CSS color or gradient.'
  },
  { name: 'size', type: 'number', default: '82', description: 'Width and height of each icon in px.' },
  { name: 'gap', type: 'number', default: '66', description: 'Space between the icons in px.' },
  {
    name: 'columns',
    type: 'number',
    default: '3',
    description: 'Icons per row. They wrap to fewer columns when there is not enough room.'
  },
  {
    name: 'roundness',
    type: 'number',
    default: '0.6',
    description: 'Corner rounding, from 0 for square to 1 for a circle.'
  },
  {
    name: 'refraction',
    type: 'number',
    default: '0.8',
    description: 'How strongly the glass bends what is behind it around its edge. Works in Chromium browsers.'
  },
  { name: 'bevel', type: 'number', default: '0.6', description: 'Width of the curved glass edge, from 0 to 1.' },
  {
    name: 'dispersion',
    type: 'number',
    default: '0',
    description: 'Rainbow fringing where the edge bends the light, from 0 to 1.'
  },
  {
    name: 'frost',
    type: 'number',
    default: '0.2',
    description: 'How much the glass blurs what is behind it, from 0 to 1.'
  },
  {
    name: 'shine',
    type: 'number',
    default: '0.85',
    description: 'Strength of the light catching the glass edge, from 0 to 1.'
  },
  { name: 'tint', type: 'string', default: "'#dfdfdf'", description: 'Color of the glass.' },
  {
    name: 'tintOpacity',
    type: 'number',
    default: '0.2',
    description: 'How strongly the tint colors the glass, from 0 to 1.'
  },
  {
    name: 'iconColor',
    type: 'string',
    default: '-',
    description: 'Color of the icons on the glass. Defaults to white, or near black on clear glass in the light theme.'
  },
  {
    name: 'plate',
    type: "'tilt' | 'offset' | 'circle' | 'none'",
    default: "'tilt'",
    description: 'Colored shape behind the glass: a tilted card, a shifted card, a disc or nothing for clear glass.'
  },
  { name: 'tilt', type: 'number', default: '30', description: 'Angle of the tilted card in degrees.' },
  {
    name: 'spread',
    type: 'number',
    default: '0.5',
    description: 'How far the shifted card or disc peeks out from behind the glass, from 0 to 1.'
  },
  {
    name: 'hover',
    type: "'lift' | 'float' | 'press' | 'none'",
    default: "'press'",
    description:
      'Hover animation. Lift raises the glass and swings the card, float raises the glass and press pushes it in.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '1',
    description: 'How far the card behind the glass drifts with the pointer, from 0 to 1.'
  },
  {
    name: 'labels',
    type: "'hover' | 'always' | 'none'",
    default: "'hover'",
    description: 'When the labels under the icons are shown.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description:
      'Plays an entrance the first time the icons scroll into view: the glass settles and the cards swing out.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Color scheme of the labels and glass edges.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function GlassIconsDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const settings = createMemo(() => {
    const { preset: _preset, iconColor: _iconColor, ...rest } = props();
    return rest;
  });
  const ink = createMemo(
    () => props().iconColor || (theme() === 'light' && props().plate === 'none' ? '#27272a' : '#ffffff')
  );
  const backdrop = createMemo(() =>
    props().preset === 'clear'
      ? `url(/assets/demo/${theme() === 'light' ? 'day' : 'night'}-landscape.webp) center / cover`
      : undefined
  );
  const items = createMemo(() => {
    rerenderKey();
    return itemsFor(props().preset);
  });
  const computedProps = createMemo(() => ({
    iconColor: ink(),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  const applyPreset = (value: string) => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '500px',
              padding: 0,
              overflow: 'hidden',
              ...(backdrop() ? { background: backdrop() } : {})
            }}
          >
            <Keyed token={`${props().preset}-${rerenderKey()}`}>
              {() => (
                <GlassIcons {...(settings() as GlassIconsProps)} iconColor={ink()} items={items()} theme={theme()} />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Plate"
              options={PLATE_OPTIONS}
              value={props().plate}
              onChange={v => updateProp('plate', v)}
            />
            <PreviewSelect
              title="Hover"
              options={HOVER_OPTIONS}
              value={props().hover}
              onChange={v => updateProp('hover', v)}
            />
            <PreviewSelect
              title="Labels"
              options={LABEL_OPTIONS}
              value={props().labels}
              onChange={v => updateProp('labels', v)}
            />
            <PreviewColorPickerCustom title="Tint" color={props().tint} onChange={v => updateProp('tint', v)} />
            <PreviewColorPickerCustom title="Icon Color" color={ink()} onChange={v => updateProp('iconColor', v)} />
            <PreviewSlider
              title="Size"
              min={40}
              max={120}
              step={2}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Gap"
              min={8}
              max={96}
              step={2}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Columns"
              min={1}
              max={6}
              step={1}
              value={props().columns}
              onChange={v => updateProp('columns', v)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.02}
              value={props().roundness}
              onChange={v => updateProp('roundness', v)}
            />
            <PreviewSlider
              title="Refraction"
              min={0}
              max={1.5}
              step={0.05}
              value={props().refraction}
              onChange={v => updateProp('refraction', v)}
            />
            <PreviewSlider
              title="Bevel"
              min={0}
              max={1}
              step={0.05}
              value={props().bevel}
              onChange={v => updateProp('bevel', v)}
            />
            <PreviewSlider
              title="Dispersion"
              min={0}
              max={1}
              step={0.05}
              value={props().dispersion}
              onChange={v => updateProp('dispersion', v)}
            />
            <PreviewSlider
              title="Frost"
              min={0}
              max={1}
              step={0.05}
              value={props().frost}
              onChange={v => updateProp('frost', v)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={1}
              step={0.05}
              value={props().shine}
              onChange={v => updateProp('shine', v)}
            />
            <PreviewSlider
              title="Tint Opacity"
              min={0}
              max={0.6}
              step={0.02}
              value={props().tintOpacity}
              onChange={v => updateProp('tintOpacity', v)}
            />
            <Show when={props().plate === 'tilt'}>
              <PreviewSlider
                title="Tilt"
                min={-45}
                max={45}
                step={1}
                value={props().tilt}
                valueUnit="°"
                onChange={v => updateProp('tilt', v)}
              />
            </Show>
            <Show when={props().plate === 'offset' || props().plate === 'circle'}>
              <PreviewSlider
                title="Spread"
                min={0}
                max={1}
                step={0.05}
                value={props().spread}
                onChange={v => updateProp('spread', v)}
              />
            </Show>
            <PreviewSwitch title="Intro" isChecked={props().intro} onChange={v => updateProp('intro', v)} />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.05}
              value={props().parallax}
              onChange={v => updateProp('parallax', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glassIcons} componentName="GlassIcons" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
