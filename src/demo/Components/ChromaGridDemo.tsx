import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import ChromaGrid, { type ChromaGridProps, type ChromaItem } from '@/content/Components/ChromaGrid/ChromaGrid';
import { chromaGrid } from '@/constants/code/Components/chromaGridCode';

const ITEMS: ChromaItem[] = [
  {
    image: '/assets/demo/day-landscape.webp',
    title: 'Canola Field',
    subtitle: 'Midday',
    accent: '#ffd23f'
  },
  { image: '/assets/demo/day-portrait.webp', title: 'The Pier', subtitle: 'Clear sky', accent: '#3fb8ff' },
  { image: '/assets/demo/day-sky.webp', title: 'Open Sky', subtitle: 'Golden hour', accent: '#ff9a4c' },
  {
    image: '/assets/demo/night-landscape.webp',
    title: 'Canola Field',
    subtitle: 'Moonrise',
    accent: '#6ec9f7'
  },
  { image: '/assets/demo/night-portrait.webp', title: 'The Pier', subtitle: 'Dusk', accent: '#ff7a5c' },
  { image: '/assets/demo/night-sky.webp', title: 'Open Sky', subtitle: 'Blue hour', accent: '#5b9bd5' }
];

const LOOK = {
  reveal: 'spotlight',
  columns: 3,
  minCardWidth: 180,
  gap: 12,
  radius: 260,
  aspectRatio: '3 / 2',
  cardRadius: 22,
  showInfo: true,
  frame: false
};

const DEFAULT_PROPS = {
  preset: 'gallery',
  ...LOOK,
  softness: 0.6,
  damping: 0.45,
  fadeOut: 0.6,
  grayscale: 1,
  dim: 0.12,
  glow: 0.5,
  borderGlow: 1
};

const PRESETS: Record<string, typeof LOOK> = {
  gallery: LOOK,
  framed: { ...LOOK, frame: true },
  mosaic: { ...LOOK, showInfo: false, aspectRatio: '1 / 1', gap: 8, cardRadius: 18, radius: 220 },
  hover: { ...LOOK, reveal: 'card' },
  wide: { ...LOOK, columns: 2, aspectRatio: '16 / 10', radius: 340, minCardWidth: 220 }
};

const PRESET_OPTIONS = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'framed', label: 'Framed' },
  { value: 'mosaic', label: 'Mosaic' },
  { value: 'hover', label: 'Hover' },
  { value: 'wide', label: 'Wide' }
];

const REVEAL_OPTIONS = [
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'card', label: 'Card' }
];

const RATIO_OPTIONS = [
  { value: '3 / 2', label: '3 / 2' },
  { value: '4 / 3', label: '4 / 3' },
  { value: '16 / 10', label: '16 / 10' },
  { value: '1 / 1', label: '1 / 1' },
  { value: '4 / 5', label: '4 / 5' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'ChromaItem[]',
    default: 'Sample photos',
    description:
      'The cards to show. Each item takes image, title, subtitle, accent and url. With a url the whole card becomes a link.'
  },
  {
    name: 'reveal',
    type: "'spotlight' | 'card'",
    default: "'spotlight'",
    description: 'Reveal color in a soft spotlight that follows the cursor, or one whole card at a time on hover.'
  },
  { name: 'columns', type: 'number', default: '3', description: 'The most columns the grid shows.' },
  {
    name: 'minCardWidth',
    type: 'number',
    default: '180',
    description: 'Narrowest a card can get, in px. The grid drops columns to keep cards at least this wide.'
  },
  { name: 'gap', type: 'number', default: '12', description: 'Space between cards, in px.' },
  { name: 'radius', type: 'number', default: '260', description: 'Size of the color spotlight, in px.' },
  {
    name: 'softness',
    type: 'number',
    default: '0.6',
    description: 'How gradually the spotlight fades at its edge, from 0 for a crisp circle to 1 for a soft glow.'
  },
  {
    name: 'damping',
    type: 'number',
    default: '0.45',
    description: 'How smoothly the spotlight trails the cursor. 0 follows it exactly.'
  },
  {
    name: 'fadeOut',
    type: 'number',
    default: '0.6',
    description: 'How long the colors take to fade back to gray after the cursor leaves, in seconds.'
  },
  {
    name: 'grayscale',
    type: 'number',
    default: '1',
    description: 'How much color is drained outside the spotlight, from 0 to 1.'
  },
  { name: 'dim', type: 'number', default: '0.12', description: 'How much images darken outside the spotlight.' },
  {
    name: 'glow',
    type: 'number',
    default: '0.5',
    description: "Strength of each card's accent color glowing up from the bottom as it is revealed."
  },
  {
    name: 'borderGlow',
    type: 'number',
    default: '1',
    description: "Strength of each card's border lighting up in its accent color near the cursor."
  },
  {
    name: 'aspectRatio',
    type: 'string',
    default: "'3 / 2'",
    description: 'Aspect ratio of the images, as a CSS aspect-ratio value.'
  },
  { name: 'cardRadius', type: 'number', default: '22', description: 'Corner radius of the cards, in px.' },
  {
    name: 'showInfo',
    type: 'boolean',
    default: 'true',
    description: 'Shows the title and subtitle under each image.'
  },
  { name: 'frame', type: 'boolean', default: 'false', description: 'Wraps the grid in a frosted glass panel.' },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the cards.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the grid.' }
];

export default function ChromaGridDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const computedProps = createMemo(() => (theme() === 'light' ? { theme: 'light' } : {}));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps()[name as keyof typeof DEFAULT_PROPS]])
    );
    updateProps({ ...base, ...PRESETS[value], preset: value });
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
            class="demo-container px-3! py-6! md:px-6! md:py-8!"
            style={{ position: 'relative', height: 'auto', 'min-height': '500px', overflow: 'hidden' }}
          >
            <div style={{ width: '100%', 'max-width': '960px', margin: '0 auto' }}>
              <ChromaGrid items={ITEMS} {...(settings() as ChromaGridProps)} theme={theme()} />
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Reveal"
              options={REVEAL_OPTIONS}
              value={settings().reveal}
              onChange={v => updateProp('reveal', v)}
            />
            <PreviewSelect
              title="Aspect Ratio"
              options={RATIO_OPTIONS}
              value={settings().aspectRatio}
              onChange={v => updateProp('aspectRatio', v)}
            />
            <PreviewSlider
              title="Columns"
              min={1}
              max={6}
              step={1}
              value={settings().columns}
              onChange={v => updateProp('columns', v)}
            />
            <PreviewSlider
              title="Min Card Width"
              min={120}
              max={360}
              step={10}
              value={settings().minCardWidth}
              valueUnit="px"
              onChange={v => updateProp('minCardWidth', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={32}
              step={1}
              value={settings().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Card Radius"
              min={0}
              max={40}
              step={1}
              value={settings().cardRadius}
              valueUnit="px"
              onChange={v => updateProp('cardRadius', v)}
            />
            <PreviewSlider
              title="Radius"
              min={80}
              max={600}
              step={10}
              value={settings().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings().softness}
              onChange={v => updateProp('softness', v)}
            />
            <PreviewSlider
              title="Damping"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().damping}
              onChange={v => updateProp('damping', v)}
            />
            <PreviewSlider
              title="Fade Out"
              min={0}
              max={2}
              step={0.05}
              value={settings().fadeOut}
              valueUnit="s"
              onChange={v => updateProp('fadeOut', v)}
            />
            <PreviewSlider
              title="Grayscale"
              min={0}
              max={1}
              step={0.05}
              value={settings().grayscale}
              onChange={v => updateProp('grayscale', v)}
            />
            <PreviewSlider
              title="Dim"
              min={0}
              max={0.6}
              step={0.01}
              value={settings().dim}
              onChange={v => updateProp('dim', v)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings().glow}
              onChange={v => updateProp('glow', v)}
            />
            <PreviewSlider
              title="Border Glow"
              min={0}
              max={1}
              step={0.05}
              value={settings().borderGlow}
              onChange={v => updateProp('borderGlow', v)}
            />
            <PreviewSwitch
              title="Show Info"
              isChecked={settings().showInfo}
              onChange={v => updateProp('showInfo', v)}
            />
            <PreviewSwitch title="Frame" isChecked={settings().frame} onChange={v => updateProp('frame', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={chromaGrid} componentName="ChromaGrid" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
