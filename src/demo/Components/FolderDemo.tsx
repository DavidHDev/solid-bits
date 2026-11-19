import { createMemo, createSignal, onSettled } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import Folder, { type FolderProps } from '@/content/Components/Folder/Folder';
import { folder } from '@/constants/code/Components/folderCode';

const DOCUMENTS = [{ title: 'Brand guidelines' }, { title: 'Launch plan' }, { title: 'Moodboard' }];

const PHOTOS = {
  dark: [
    { title: 'Blue hour', image: '/assets/demo/night-sky.webp' },
    { title: 'Moonrise', image: '/assets/demo/night-landscape.webp' },
    { title: 'Dusk', image: '/assets/demo/night-portrait.webp' }
  ],
  light: [
    { title: 'Golden hour', image: '/assets/demo/day-sky.webp' },
    { title: 'Canola field', image: '/assets/demo/day-landscape.webp' },
    { title: 'The pier', image: '/assets/demo/day-portrait.webp' }
  ]
};

const LOOK = {
  mode: 'flap',
  variant: 'solid',
  layout: 'spread',
  content: 'documents',
  color: '#3d8bff',
  paperColor: '#ffffff',
  label: 'Projects',
  tabPosition: 'right'
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  openOn: 'click',
  size: 1.3,
  frost: 0.25,
  tilt: 0.5,
  speed: 1,
  bounce: 0.4,
  peek: true,
  intro: true,
  draggable: true,
  zoomOnClick: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  classic: LOOK,
  glass: { ...LOOK, variant: 'glass', content: 'photos', color: '#6ec9f7', label: 'Photos' },
  book: { ...LOOK, mode: 'book', label: 'Projects' },
  portfolio: { ...LOOK, mode: 'book', variant: 'matte', content: 'photos', color: '#2b2c2e', label: 'Portfolio' },
  manila: { ...LOOK, mode: 'book', color: '#e6c78f', label: 'Archive', layout: 'stack' }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'glass', label: 'Glass' },
  { value: 'book', label: 'Book' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'manila', label: 'Manila' }
];

const MODE_OPTIONS = [
  { value: 'flap', label: 'Flap' },
  { value: 'book', label: 'Book' }
];

const VARIANT_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'glass', label: 'Glass' },
  { value: 'matte', label: 'Matte' }
];

const LAYOUT_OPTIONS = [
  { value: 'spread', label: 'Spread' },
  { value: 'stack', label: 'Stack' },
  { value: 'row', label: 'Row' }
];

const CONTENT_OPTIONS = [
  { value: 'documents', label: 'Documents' },
  { value: 'photos', label: 'Photos' }
];

const TAB_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const OPEN_OPTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'hover', label: 'Hover' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'FolderItem[]',
    default: 'Three sample documents',
    description:
      'What the folder holds, up to 6. Each item can be a string, { title, description }, { image, title, alt }, { content } or an element.'
  },
  {
    name: 'children',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Your own items as children. Each child becomes one page in the folder.'
  },
  {
    name: 'mode',
    type: "'flap' | 'book'",
    default: "'flap'",
    description:
      'flap stands the folder up and drops the front flap open. book lays it flat and swings the cover over like a book.'
  },
  {
    name: 'variant',
    type: "'solid' | 'glass' | 'matte'",
    default: "'solid'",
    description: 'Material of the folder. glass turns the front into refracting glass that shows the pages inside.'
  },
  {
    name: 'layout',
    type: "'spread' | 'stack' | 'row'",
    default: "'spread'",
    description: 'How the items are laid out once the folder is open.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#3d8bff'",
    description: 'Color of the folder. Shades are derived from it.'
  },
  { name: 'paperColor', type: 'string', default: "'#ffffff'", description: 'Color of the pages.' },
  { name: 'label', type: 'string', default: 'undefined', description: 'Text on the tab. The tab grows to fit it.' },
  {
    name: 'tabPosition',
    type: "'left' | 'center' | 'right'",
    default: "'right'",
    description: 'Where the tab sits along the top edge.'
  },
  {
    name: 'openOn',
    type: "'click' | 'hover'",
    default: "'click'",
    description: 'Opens the folder on click, or while the cursor is over it.'
  },
  {
    name: 'open',
    type: 'boolean',
    default: 'undefined',
    description: 'Controls the folder from outside. Leave it out to let the folder manage itself.'
  },
  { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Starts the folder open.' },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: 'undefined',
    description: 'Called when the folder opens or closes.'
  },
  {
    name: 'onItemClick',
    type: '(item, index: number) => void',
    default: 'undefined',
    description: 'Called when an item is clicked while the folder is open or after it was dragged out.'
  },
  {
    name: 'onItemDrop',
    type: '(item, index: number, inside: boolean) => void',
    default: 'undefined',
    description: 'Called when a dragged item is let go, with whether it landed back in the folder.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets people drag items out of the folder, leave them anywhere and drop them back in.'
  },
  {
    name: 'zoomOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Clicking an item brings it up close. Click it again, press Escape or click away to put it back.'
  },
  {
    name: 'peek',
    type: 'boolean',
    default: 'true',
    description: 'Teases the items out on hover. In flap mode the page under the cursor rises highest.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description:
      'Plays an entrance when the folder scrolls into view: the pages drop in and the folder closes over them.'
  },
  { name: 'size', type: 'number', default: '1', description: 'Scale of the whole folder.' },
  {
    name: 'frost',
    type: 'number',
    default: '0.25',
    description:
      'How much the glass front blurs what is behind it, from 0 for clear glass to 1. Used by the glass variant.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0.5',
    description: 'How much the folder tilts toward the cursor, from 0 to 1.5.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of every animation.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.4',
    description: 'How much the flap, cover and pages overshoot as they settle, from 0 to 1.'
  },
  {
    name: 'closeOnOutsideClick',
    type: 'boolean',
    default: 'true',
    description: 'Closes the folder on a click outside it or on Escape.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Tunes the shadows for dark or light pages.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: 'undefined', description: 'Inline styles for the container.' }
];

export default function FolderDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, content: _content, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const query = '(min-width: 768px)';
  const [wide, setWide] = createSignal(typeof window !== 'undefined' && window.matchMedia(query).matches);
  onSettled(() => {
    const media = window.matchMedia(query);
    const sync = () => {
      setWide(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  });
  const fit = () => (wide() ? 1 : 0.68);
  const items = createMemo(() => (props().content === 'photos' ? PHOTOS[theme()] : DOCUMENTS));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps()[name as keyof typeof DEFAULT_PROPS]])
    );
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = createMemo(() => ({
    theme: theme(),
    ...(props().content === 'photos' ? { items: items() } : {})
  }));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'content']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: wide() ? '600px' : '460px',
              padding: 0,
              'padding-top': settings().mode === 'flap' ? (wide() ? '96px' : '64px') : 0,
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <Keyed token={`${rerenderKey()}-${settings().mode}`}>
              {() => (
                <Folder
                  {...(settings() as FolderProps)}
                  size={settings().size * fit()}
                  items={items()}
                  theme={theme()}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings().mode}
              onChange={v => updateProp('mode', v)}
            />
            <PreviewSelect
              title="Material"
              options={VARIANT_OPTIONS}
              value={settings().variant}
              onChange={v => updateProp('variant', v)}
            />
            <PreviewSelect
              title="Layout"
              options={LAYOUT_OPTIONS}
              value={settings().layout}
              onChange={v => updateProp('layout', v)}
            />
            <PreviewSelect
              title="Content"
              options={CONTENT_OPTIONS}
              value={props().content}
              onChange={v => updateProp('content', v)}
            />
            <PreviewColorPickerCustom title="Color" color={settings().color} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Paper"
              color={settings().paperColor}
              onChange={v => updateProp('paperColor', v)}
            />
            <PreviewInput
              title="Label"
              value={settings().label}
              maxLength={18}
              onChange={v => updateProp('label', v)}
            />
            <PreviewSelect
              title="Tab"
              options={TAB_OPTIONS}
              value={settings().tabPosition}
              onChange={v => updateProp('tabPosition', v)}
            />
            <PreviewSelect
              title="Open On"
              options={OPEN_OPTIONS}
              value={settings().openOn}
              onChange={v => updateProp('openOn', v)}
            />
            <PreviewSlider
              title="Size"
              min={0.6}
              max={1.8}
              step={0.05}
              value={settings().size}
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Frost"
              min={0}
              max={1}
              step={0.05}
              value={settings().frost}
              isDisabled={settings().variant !== 'glass'}
              onChange={v => updateProp('frost', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().tilt}
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.3}
              max={2}
              step={0.05}
              value={settings().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSwitch title="Peek" isChecked={settings().peek} onChange={v => updateProp('peek', v)} />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={v => {
                updateProp('intro', v);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings().draggable}
              onChange={v => updateProp('draggable', v)}
            />
            <PreviewSwitch
              title="Zoom On Click"
              isChecked={settings().zoomOnClick}
              onChange={v => updateProp('zoomOnClick', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={folder} componentName="Folder" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
