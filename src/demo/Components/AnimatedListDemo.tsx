import { createMemo } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  Copy01Icon,
  Delete02Icon,
  Download04Icon,
  Edit02Icon,
  FileAddIcon,
  FolderOpenIcon,
  HelpCircleIcon,
  KeyboardIcon,
  Link01Icon,
  Search01Icon,
  Settings02Icon,
  Share08Icon,
  Sun03Icon
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

import AnimatedList, {
  type AnimatedListEntry,
  type AnimatedListItem,
  type AnimatedListProps
} from '@/content/Components/AnimatedList/AnimatedList';
import { animatedList } from '@/constants/code/Components/animatedListCode';

const glyph = (icon: IconSvgElement): JSX.Element => <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />;

const command = (icon: IconSvgElement, title: string, meta: string): AnimatedListEntry => ({
  get icon() {
    return glyph(icon);
  },
  title,
  meta
});

const PHOTOS = {
  fields: '/assets/demo/day-landscape.webp',
  moon: '/assets/demo/night-landscape.webp',
  pier: '/assets/demo/day-portrait.webp',
  dusk: '/assets/demo/night-portrait.webp',
  clouds: '/assets/demo/day-sky.webp',
  night: '/assets/demo/night-sky.webp'
};

const PLAYLIST: AnimatedListEntry[] = [
  { image: PHOTOS.fields, title: 'Rapeseed', description: 'Open Fields', meta: '3:42' },
  { image: PHOTOS.moon, title: 'Moonrise', description: 'After Dark', meta: '4:05' },
  { image: PHOTOS.pier, title: 'Long Walk Out', description: 'The Pier', meta: '3:18' },
  { image: PHOTOS.dusk, title: 'Lamps On', description: 'Last Light', meta: '5:01' },
  { image: PHOTOS.clouds, title: 'Window Seat', description: 'Cruising', meta: '2:57' },
  { image: PHOTOS.night, title: 'Starfield', description: 'Night Sky', meta: '4:20' },
  { image: PHOTOS.fields, title: 'Pylons', description: 'Open Fields', meta: '3:36' },
  { image: PHOTOS.moon, title: 'Full Moon', description: 'After Dark', meta: '3:12' },
  { image: PHOTOS.pier, title: 'Low Tide', description: 'The Pier', meta: '4:44' },
  { image: PHOTOS.dusk, title: 'Pink Skies', description: 'Last Light', meta: '3:58' },
  { image: PHOTOS.clouds, title: 'Above the Clouds', description: 'Cruising', meta: '4:12' },
  { image: PHOTOS.night, title: 'Ridge Line', description: 'Night Sky', meta: '5:24' }
];

const COMMANDS: AnimatedListEntry[] = [
  command(Search01Icon, 'Search', '⌘K'),
  command(FileAddIcon, 'New file', '⌘N'),
  command(FolderOpenIcon, 'Open folder', '⌘O'),
  command(Copy01Icon, 'Duplicate', '⌘D'),
  command(Edit02Icon, 'Rename', 'F2'),
  command(Share08Icon, 'Share', '⇧⌘S'),
  command(Link01Icon, 'Copy link', '⌘L'),
  command(Download04Icon, 'Download', '⌘S'),
  command(Delete02Icon, 'Move to trash', '⌘⌫'),
  command(Sun03Icon, 'Toggle theme', '⌘T'),
  command(KeyboardIcon, 'Keyboard shortcuts', '⌘/'),
  command(Settings02Icon, 'Settings', '⌘,'),
  command(HelpCircleIcon, 'Help', '?')
];

const CITIES = [
  'Amsterdam',
  'Barcelona',
  'Copenhagen',
  'Dublin',
  'Edinburgh',
  'Florence',
  'Geneva',
  'Helsinki',
  'Istanbul',
  'Kyoto',
  'Lisbon',
  'Marrakesh',
  'Oslo',
  'Prague',
  'Reykjavik',
  'Seoul',
  'Tallinn',
  'Vienna'
];

const ITEMS: Record<string, AnimatedListItem[] | undefined> = {
  playlist: PLAYLIST,
  commands: COMMANDS,
  simple: CITIES
};

const DEFAULT_PROPS = {
  preset: 'files',
  animation: 'pop',
  accentColor: '',
  width: 420,
  maxHeight: 440,
  radius: 14,
  gap: 8,
  stagger: 0.05,
  fadeSize: 56,
  frame: true,
  showGradients: true,
  displayScrollbar: true,
  selectOnHover: true,
  enableArrowNavigation: true,
  loop: false,
  animateOnce: false,
  initialSelectedIndex: -1
};

type DemoProps = typeof DEFAULT_PROPS;

const PRESETS: Record<string, Partial<DemoProps>> = {
  files: {},
  playlist: { animation: 'slide', radius: 18, gap: 6, stagger: 0.04 },
  commands: { width: 380, maxHeight: 400, radius: 12, gap: 4, stagger: 0.03, loop: true, initialSelectedIndex: 0 },
  simple: { animation: 'fade', width: 300, radius: 10, gap: 6, frame: false, displayScrollbar: false }
};

const PRESET_OPTIONS = [
  { value: 'files', label: 'Files' },
  { value: 'playlist', label: 'Playlist' },
  { value: 'commands', label: 'Commands' },
  { value: 'simple', label: 'Simple' }
];

const ANIMATION_OPTIONS = [
  { value: 'pop', label: 'Pop' },
  { value: 'slide', label: 'Slide' },
  { value: 'fade', label: 'Fade' },
  { value: 'none', label: 'None' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: '(string | { id?, icon?, image?, title, description?, meta? })[]',
    default: 'sample files',
    description:
      'The rows to show. Strings become plain rows. Objects can add an icon or image, a description and a label on the right.'
  },
  {
    name: 'onItemSelect',
    type: '(item, index) => void',
    default: '-',
    description: 'Called when a row is clicked, or when Enter is pressed on the selected row.'
  },
  {
    name: 'renderItem',
    type: '(item, index, selected) => JSX.Element',
    default: '-',
    description: 'Renders your own content inside each row instead of the built-in layout.'
  },
  {
    name: 'initialSelectedIndex',
    type: 'number',
    default: '-1',
    description: 'Which row starts selected. Use -1 for none.'
  },
  {
    name: 'selectOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Moves the selection to the row under the cursor.'
  },
  {
    name: 'enableArrowNavigation',
    type: 'boolean',
    default: 'true',
    description: 'Arrow keys, Home and End move the selection while the list is hovered or focused.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'Wraps keyboard navigation from the last row back to the first.'
  },
  {
    name: 'animation',
    type: "'pop' | 'slide' | 'fade' | 'none'",
    default: "'pop'",
    description: 'How rows animate in as they scroll into view.'
  },
  {
    name: 'animateOnce',
    type: 'boolean',
    default: 'false',
    description: 'Animates each row only the first time it appears.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.05',
    description: 'Delay between rows when the list first appears, in seconds.'
  },
  {
    name: 'showGradients',
    type: 'boolean',
    default: 'true',
    description: 'Fades rows out at the top and bottom edges while there is more to scroll.'
  },
  { name: 'fadeSize', type: 'number', default: '56', description: 'Height of the edge fades, in px.' },
  {
    name: 'displayScrollbar',
    type: 'boolean',
    default: 'true',
    description: 'Shows a thin scrollbar when the list overflows.'
  },
  { name: 'frame', type: 'boolean', default: 'true', description: 'Shows the frosted panel around the list.' },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the panel and rows.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '-',
    description: 'Color of the selection outline. Uses a soft tint of the text color when not set.'
  },
  { name: 'radius', type: 'number', default: '14', description: 'Corner radius of the rows, in px.' },
  { name: 'gap', type: 'number', default: '8', description: 'Space between rows, in px.' },
  { name: 'width', type: 'number | string', default: '420', description: 'Maximum width of the list.' },
  {
    name: 'maxHeight',
    type: 'number | string',
    default: '440',
    description: 'Height at which the list starts to scroll.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the list.' },
  { name: 'itemClassName', type: 'string', default: "''", description: 'Extra class names for each row.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the list.' }
];

export default function AnimatedListDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, accentColor: _accent, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = useColorModeValue('#26282b', '#f4f5f6');
  const token = createMemo(() => `${props().preset}-${props().animation}-${rerenderKey()}`);

  const computedProps = createMemo(() => ({
    ...(props().accentColor ? { accentColor: props().accentColor } : {}),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  const applyPreset = (value: string) => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], accentColor: props().accentColor, preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'accentColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{ position: 'relative', height: '540px', padding: '16px', overflow: 'hidden' }}
          >
            <Keyed token={token()}>
              {() => (
                <AnimatedList
                  {...(settings() as AnimatedListProps)}
                  items={ITEMS[props().preset]}
                  accentColor={props().accentColor || undefined}
                  theme={theme()}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Animation"
              options={ANIMATION_OPTIONS}
              value={settings().animation}
              onChange={v => updateProp('animation', v)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={props().accentColor || ink()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewSlider
              title="Width"
              min={260}
              max={560}
              step={10}
              value={settings().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Max Height"
              min={200}
              max={480}
              step={10}
              value={settings().maxHeight}
              valueUnit="px"
              onChange={v => updateProp('maxHeight', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={24}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={20}
              step={1}
              value={settings().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.15}
              step={0.01}
              value={settings().stagger}
              valueUnit="s"
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Fade Size"
              min={16}
              max={120}
              step={4}
              value={settings().fadeSize}
              valueUnit="px"
              isDisabled={!settings().showGradients}
              onChange={v => updateProp('fadeSize', v)}
            />
            <PreviewSwitch title="Frame" isChecked={settings().frame} onChange={v => updateProp('frame', v)} />
            <PreviewSwitch
              title="Edge Fades"
              isChecked={settings().showGradients}
              onChange={v => updateProp('showGradients', v)}
            />
            <PreviewSwitch
              title="Scrollbar"
              isChecked={settings().displayScrollbar}
              onChange={v => updateProp('displayScrollbar', v)}
            />
            <PreviewSwitch
              title="Select On Hover"
              isChecked={settings().selectOnHover}
              onChange={v => updateProp('selectOnHover', v)}
            />
            <PreviewSwitch
              title="Arrow Keys"
              isChecked={settings().enableArrowNavigation}
              onChange={v => updateProp('enableArrowNavigation', v)}
            />
            <PreviewSwitch title="Loop" isChecked={settings().loop} onChange={v => updateProp('loop', v)} />
            <PreviewSwitch
              title="Animate Once"
              isChecked={settings().animateOnce}
              onChange={v => updateProp('animateOnce', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={animatedList} componentName="AnimatedList" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
