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

import LineSidebar, { type LineSidebarProps } from '@/content/Components/LineSidebar/LineSidebar';
import { lineSidebar } from '@/constants/code/Components/lineSidebarCode';

const DEFAULT_PROPS = {
  accentColor: '#6ec9f7',
  textColor: '#c4c4c4',
  markerColor: '#6c6c6c',
  showIndex: true,
  showMarker: true,
  proximityRadius: 100,
  maxShift: 30,
  falloff: 'smooth',
  markerLength: 60,
  markerGap: 0,
  tickScale: 0.5,
  scaleTick: true,
  itemGap: 20,
  fontSize: 1.1,
  smoothing: 100
};

const DEMO_ITEMS = [
  'Overview',
  'Components',
  'Animations',
  'Backgrounds',
  'Showcase',
  'Playground',
  'Templates',
  'Changelog'
];

const FALLOFF_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'sharp', label: 'Sharp' }
];

const propData: PropRow[] = [
  { name: 'items', type: 'string[]', default: '[...]', description: 'Labels rendered as the list of sidebar entries.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '"#6ec9f7"',
    description: 'Color items and markers shift toward as the cursor gets close.'
  },
  { name: 'textColor', type: 'string', default: '"#c4c4c4"', description: 'Resting color of the item labels.' },
  {
    name: 'markerColor',
    type: 'string',
    default: '"#6c6c6c"',
    description: 'Resting color of the leading marker lines.'
  },
  { name: 'showIndex', type: 'boolean', default: 'true', description: 'Show the zero-padded index before each label.' },
  {
    name: 'showMarker',
    type: 'boolean',
    default: 'true',
    description: 'Show the marker lines (and short ticks) beside each item.'
  },
  {
    name: 'proximityRadius',
    type: 'number',
    default: '100',
    description: 'Vertical distance in pixels within which the cursor influences an item.'
  },
  {
    name: 'maxShift',
    type: 'number',
    default: '30',
    description: 'Maximum horizontal shift in pixels the label slides at full proximity.'
  },
  {
    name: 'falloff',
    type: '"linear" | "smooth" | "sharp"',
    default: '"smooth"',
    description: 'Curve mapping cursor distance to the proximity effect.'
  },
  {
    name: 'markerLength',
    type: 'number',
    default: '60',
    description: 'Length in pixels of the marker line; the in-between ticks scale from this too.'
  },
  { name: 'markerGap', type: 'number', default: '0', description: 'Gap in pixels between the labels and the markers.' },
  {
    name: 'tickScale',
    type: 'number',
    default: '0.5',
    description: 'Length of the in-between ticks as a fraction of markerLength.'
  },
  {
    name: 'scaleTick',
    type: 'boolean',
    default: 'true',
    description: 'When true, the in-between ticks also grow with cursor proximity.'
  },
  { name: 'itemGap', type: 'number', default: '20', description: 'Vertical gap between items in pixels.' },
  { name: 'fontSize', type: 'number', default: '1.1', description: 'Font size of the labels in rem.' },
  {
    name: 'smoothing',
    type: 'number',
    default: '100',
    description: 'Transition duration in milliseconds for the proximity response.'
  },
  {
    name: 'defaultActive',
    type: 'number | null',
    default: 'null',
    description: 'Index of the item selected on mount.'
  },
  {
    name: 'onItemClick',
    type: '(index, label) => void',
    default: '-',
    description: 'Called when an item is clicked; the clicked item also becomes active.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Additional CSS classes for the outer wrapper.' }
];

export default function LineSidebarDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const lightAccent = useColorModeValue('#0977ae', DEFAULT_PROPS.accentColor);
  const lightText = useColorModeValue('#52525b', DEFAULT_PROPS.textColor);
  const lightMarker = useColorModeValue('#a1a1aa', DEFAULT_PROPS.markerColor);
  const renderedAccentColor = createMemo(() =>
    props().accentColor === DEFAULT_PROPS.accentColor ? lightAccent() : props().accentColor
  );
  const renderedTextColor = createMemo(() =>
    props().textColor === DEFAULT_PROPS.textColor ? lightText() : props().textColor
  );
  const renderedMarkerColor = createMemo(() =>
    props().markerColor === DEFAULT_PROPS.markerColor ? lightMarker() : props().markerColor
  );

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container pl-6! md:pl-12!"
            style={{
              position: 'relative',
              height: '500px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'flex-start',
              'padding-top': '48px',
              'padding-bottom': '48px'
            }}
          >
            <LineSidebar
              {...(props() as LineSidebarProps)}
              items={DEMO_ITEMS}
              accentColor={renderedAccentColor()}
              textColor={renderedTextColor()}
              markerColor={renderedMarkerColor()}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccentColor()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedTextColor()}
              onChange={v => updateProp('textColor', v)}
            />
            <PreviewColorPickerCustom
              title="Marker"
              color={renderedMarkerColor()}
              onChange={v => updateProp('markerColor', v)}
            />
            <PreviewSelect
              title="Falloff"
              options={FALLOFF_OPTIONS}
              value={props().falloff}
              onChange={v => updateProp('falloff', v)}
            />
            <PreviewSlider
              title="Proximity Radius"
              min={40}
              max={280}
              step={5}
              value={props().proximityRadius}
              valueUnit="px"
              onChange={v => updateProp('proximityRadius', v)}
            />
            <PreviewSlider
              title="Max Shift"
              min={0}
              max={60}
              step={1}
              value={props().maxShift}
              valueUnit="px"
              onChange={v => updateProp('maxShift', v)}
            />
            <PreviewSlider
              title="Marker Length"
              min={20}
              max={200}
              step={5}
              value={props().markerLength}
              valueUnit="px"
              onChange={v => updateProp('markerLength', v)}
            />
            <PreviewSlider
              title="Marker Gap"
              min={0}
              max={60}
              step={1}
              value={props().markerGap}
              valueUnit="px"
              onChange={v => updateProp('markerGap', v)}
            />
            <PreviewSlider
              title="Tick Scale"
              min={0}
              max={1}
              step={0.02}
              value={props().tickScale}
              onChange={v => updateProp('tickScale', v)}
            />
            <PreviewSlider
              title="Item Gap"
              min={4}
              max={48}
              step={1}
              value={props().itemGap}
              valueUnit="px"
              onChange={v => updateProp('itemGap', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={0.8}
              max={2}
              step={0.05}
              value={props().fontSize}
              valueUnit="rem"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={800}
              step={20}
              value={props().smoothing}
              valueUnit="ms"
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSwitch
              title="Show Index"
              isChecked={props().showIndex}
              onChange={v => updateProp('showIndex', v)}
            />
            <PreviewSwitch
              title="Show Marker"
              isChecked={props().showMarker}
              onChange={v => updateProp('showMarker', v)}
            />
            <PreviewSwitch
              title="Scale Ticks"
              isChecked={props().scaleTick}
              onChange={v => updateProp('scaleTick', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={lineSidebar} componentName="LineSidebar" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
