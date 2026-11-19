import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import InfiniteMenu, {
  type InfiniteMenuItem,
  type InfiniteMenuProps
} from '@/content/Components/InfiniteMenu/InfiniteMenu';
import { infiniteMenu } from '@/constants/code/Components/infiniteMenuCode';

const ITEMS: InfiniteMenuItem[] = [
  {
    image: '/assets/demo/day-portrait.webp',
    link: 'https://solid-bits.dev',
    title: 'The Pier',
    description: 'Concrete and open water under a bright morning sky.'
  },
  {
    image: '/assets/demo/night-landscape.webp',
    link: 'https://solid-bits.dev',
    title: 'Moonlit Field',
    description: 'A single pole in a field of rapeseed under the full moon.'
  },
  {
    image: 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=600&q=80&auto=format&fit=crop',
    link: 'https://solid-bits.dev',
    title: 'Afterglow',
    description: 'Clouds catching the last light of the day.'
  },
  {
    image: '/assets/demo/day-landscape.webp',
    link: 'https://solid-bits.dev',
    title: 'Rapeseed',
    description: 'The same field at noon, yellow all the way to the horizon.'
  },
  {
    image: '/assets/demo/night-portrait.webp',
    link: 'https://solid-bits.dev',
    title: 'Blue Hour',
    description: 'The pier lit from below as the sky turns pink.'
  }
];

const DEFAULT_PROPS = {
  preset: 'gallery',
  count: 160,
  tileSize: 0.63,
  roundness: 0.2,
  zoom: 1.65,
  pullBack: 1,
  stretch: 0.6,
  inertia: 0.6,
  autoplay: 3,
  grayscale: true,
  dim: 0.5,
  accentColor: '',
  intro: true,
  showInfo: true
};

const PRESETS: Record<string, Partial<typeof DEFAULT_PROPS>> = {
  gallery: {},
  orbit: { count: 42, tileSize: 0.85, roundness: 1, zoom: 1, stretch: 1, autoplay: 0, grayscale: false }
};

const PRESET_OPTIONS = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'orbit', label: 'Orbit' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'Array<{ image: string; title?: string; description?: string; link?: string }>',
    default: '[]',
    description: 'Items to show. They repeat around the sphere when there are fewer items than tiles.'
  },
  { name: 'count', type: 'number', default: '160', description: 'Number of tiles on the sphere.' },
  {
    name: 'tileSize',
    type: 'number',
    default: '0.63',
    description: 'Tile size relative to the space around it. Lower values leave wider gaps.'
  },
  {
    name: 'roundness',
    type: 'number',
    default: '0.2',
    description: 'Tile shape, from 0 for squares to 1 for circles.'
  },
  {
    name: 'zoom',
    type: 'number',
    default: '1.65',
    description: 'How close the camera sits to the active tile when the sphere is at rest.'
  },
  {
    name: 'pullBack',
    type: 'number',
    default: '1',
    description: 'How far the camera pulls back while you drag. 0 keeps it still.'
  },
  { name: 'stretch', type: 'number', default: '0.6', description: 'How much the tiles stretch with fast motion.' },
  {
    name: 'inertia',
    type: 'number',
    default: '0.6',
    description: 'How long the sphere keeps spinning after you let go, from 0 to 1.'
  },
  {
    name: 'autoplay',
    type: 'number',
    default: '3',
    description: 'Seconds between automatic steps to the next tile. 0 turns it off. Pauses on hover and focus.'
  },
  {
    name: 'grayscale',
    type: 'boolean',
    default: 'true',
    description: 'Shows every tile except the active one in grayscale.'
  },
  {
    name: 'dim',
    type: 'number',
    default: '0.5',
    description:
      'Fades the tiles around the active one toward the background once the sphere settles, which keeps the text readable. From 0 to 1.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Spins the sphere into place when it loads.' },
  {
    name: 'showInfo',
    type: 'boolean',
    default: 'true',
    description: 'Shows the title, description and link button of the active item.'
  },
  {
    name: 'renderInfo',
    type: '(item, index, moving) => JSX.Element',
    default: '-',
    description: 'Replaces the default title, description and button with your own overlay.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Colors of the text, the button and the placeholder tiles.'
  },
  { name: 'accentColor', type: 'string', default: '-', description: 'Background of the link button.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: '-',
    description: 'Background behind the sphere. Transparent by default.'
  },
  {
    name: 'onActiveChange',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when a new item settles in front.'
  },
  {
    name: 'onItemClick',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when the active tile or its button is clicked, or Enter is pressed.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function InfiniteMenuDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, accentColor: _accent, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = useColorModeValue('#0c0f13', '#ffffff');
  const accentColor = createMemo(() => props().accentColor || ink());
  const computedProps = createMemo(() => ({ accentColor: accentColor(), theme: theme() }));

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
          <div class="demo-container" style={{ position: 'relative', height: '560px', padding: 0, overflow: 'hidden' }}>
            <InfiniteMenu
              {...(settings() as InfiniteMenuProps)}
              items={ITEMS}
              theme={theme()}
              accentColor={accentColor()}
            />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Tiles"
              min={12}
              max={160}
              step={1}
              value={props().count}
              onChange={v => updateProp('count', v)}
            />
            <PreviewSlider
              title="Tile Size"
              min={0.4}
              max={1.1}
              step={0.01}
              value={props().tileSize}
              onChange={v => updateProp('tileSize', v)}
            />
            <PreviewSlider
              title="Roundness"
              min={0}
              max={1}
              step={0.01}
              value={props().roundness}
              onChange={v => updateProp('roundness', v)}
            />
            <PreviewSlider
              title="Zoom"
              min={0.4}
              max={2.5}
              step={0.05}
              value={props().zoom}
              onChange={v => updateProp('zoom', v)}
            />
            <PreviewSlider
              title="Pull Back"
              min={0}
              max={2}
              step={0.05}
              value={props().pullBack}
              onChange={v => updateProp('pullBack', v)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={2.5}
              step={0.05}
              value={props().stretch}
              onChange={v => updateProp('stretch', v)}
            />
            <PreviewSlider
              title="Inertia"
              min={0}
              max={1}
              step={0.05}
              value={props().inertia}
              onChange={v => updateProp('inertia', v)}
            />
            <PreviewSlider
              title="Autoplay"
              min={0}
              max={8}
              step={0.5}
              value={props().autoplay}
              valueUnit="s"
              onChange={v => updateProp('autoplay', v)}
            />
            <PreviewSlider
              title="Dim"
              min={0}
              max={1}
              step={0.05}
              value={props().dim}
              onChange={v => updateProp('dim', v)}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={accentColor()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewSwitch title="Grayscale" isChecked={props().grayscale} onChange={v => updateProp('grayscale', v)} />
            <PreviewSwitch title="Info" isChecked={props().showInfo} onChange={v => updateProp('showInfo', v)} />
            <PreviewSwitch title="Intro" isChecked={props().intro} onChange={v => updateProp('intro', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={infiniteMenu} componentName="InfiniteMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
