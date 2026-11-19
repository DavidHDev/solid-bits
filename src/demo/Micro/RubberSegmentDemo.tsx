import { createMemo } from 'solid-js';
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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import RubberSegment, { type RubberSegmentSize } from '@/content/Micro/RubberSegment/RubberSegment';
import { rubberSegment } from '@/constants/code/Micro/rubberSegmentCode';

const DEFAULT_PROPS = {
  preset: 'periods',
  trackColor: '#27272a',
  thumbColor: '#fafafa',
  textColor: '#fafafa',
  activeTextColor: '#18181b',
  size: 'md',
  radius: 10,
  inset: 3,
  equalSlots: true,
  stretch: 100,
  squash: 3,
  speed: 1,
  glide: 75,
  draggable: true,
  disabled: false
};

type ColorKey = 'trackColor' | 'thumbColor' | 'textColor' | 'activeTextColor';

const LIGHT: Record<ColorKey, string> = {
  trackColor: '#f6f6f6',
  thumbColor: '#18181b',
  textColor: '#18181b',
  activeTextColor: '#fafafa'
};

const PRESETS: Record<string, string[]> = {
  periods: ['Day', 'Week', 'Month', 'Year'],
  views: ['List', 'Board', 'Calendar'],
  sizes: ['S', 'M', 'L', 'XL', 'XXL']
};

const PRESET_OPTIONS = [
  { value: 'periods', label: 'Day / Week / Month / Year' },
  { value: 'views', label: 'List / Board / Calendar' },
  { value: 'sizes', label: 'S / M / L / XL / XXL' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: '(string | { value: string; label: JSX.Element; icon?: JSX.Element })[]',
    default: '-',
    description:
      'The slots, in order. A string is both value and label. Pass element labels and icons as functions so the thumb can draw its own copy.'
  },
  {
    name: 'value',
    type: 'string',
    default: 'undefined',
    description: 'Controlled value. A change from outside jumps the thumb without animation.'
  },
  {
    name: 'defaultValue',
    type: 'string',
    default: 'undefined',
    description: 'Initial value when uncontrolled; the first item if omitted.'
  },
  {
    name: 'onChange',
    type: '(value: string, index: number) => void',
    default: '-',
    description: 'Called on a tap, on a drag release and on every arrow key.'
  },
  { name: 'trackColor', type: 'string', default: '"#27272a"', description: 'The well behind the slots.' },
  {
    name: 'thumbColor',
    type: 'string',
    default: '"#fafafa"',
    description: 'The rubber thumb, and the focus ring.'
  },
  { name: 'textColor', type: 'string', default: '"#fafafa"', description: 'Idle labels, drawn at 70%.' },
  {
    name: 'activeTextColor',
    type: 'string',
    default: '"#18181b"',
    description: 'The label revealed inside the thumb.'
  },
  {
    name: 'size',
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: 'Track height 28, 36 or 44 pixels; font and padding follow.'
  },
  { name: 'radius', type: 'number', default: '10', description: 'Track corner radius in pixels.' },
  {
    name: 'inset',
    type: 'number',
    default: '3',
    description: 'Gap between the thumb and the track edge; the thumb corner is radius minus inset.'
  },
  {
    name: 'equalSlots',
    type: 'boolean',
    default: 'true',
    description: 'Every slot the same width. Off, slots hug their labels and the thumb changes width per slot.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '100',
    description: 'How far a tap dilates the thumb across old and new slot before it contracts. 0 is a plain slide.'
  },
  {
    name: 'squash',
    type: 'number',
    default: '3',
    description: 'Pixels the trailing edge lands past the slot edge before relaxing. 0 removes the squash.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Scales every phase together; 0.25 is slow motion.'
  },
  {
    name: 'glide',
    type: 'number',
    default: '75',
    description: 'How far a flick carries the thumb before it snaps. 0 always lands on the nearest slot.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets the thumb be grabbed, dragged and flicked.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the control and ignores input.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the track.' },
  {
    name: 'aria-label',
    type: 'string',
    default: '"Segmented control"',
    description: 'Accessible name of the radio group.'
  }
];

export default function RubberSegmentDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const light = (key: ColorKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedTrack = useColorModeValue(
    () => light('trackColor'),
    () => props().trackColor
  );
  const renderedThumb = useColorModeValue(
    () => light('thumbColor'),
    () => props().thumbColor
  );
  const renderedText = useColorModeValue(
    () => light('textColor'),
    () => props().textColor
  );
  const renderedActiveText = useColorModeValue(
    () => light('activeTextColor'),
    () => props().activeTextColor
  );

  const items = createMemo(() => PRESETS[props().preset] ?? PRESETS.periods);

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
            class="demo-container"
            style={{
              position: 'relative',
              height: '400px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <Keyed token={props().preset}>
              {() => (
                <RubberSegment
                  items={items()}
                  defaultValue={items()[1]}
                  trackColor={renderedTrack()}
                  thumbColor={renderedThumb()}
                  textColor={renderedText()}
                  activeTextColor={renderedActiveText()}
                  size={props().size as RubberSegmentSize}
                  radius={props().radius}
                  inset={props().inset}
                  equalSlots={props().equalSlots}
                  stretch={props().stretch}
                  squash={props().squash}
                  speed={props().speed}
                  glide={props().glide}
                  draggable={props().draggable}
                  disabled={props().disabled}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Items"
              options={PRESET_OPTIONS}
              value={props().preset}
              onChange={v => updateProp('preset', v)}
              width={220}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={v => updateProp('size', v)}
              width={120}
            />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack()}
              onChange={v => updateProp('trackColor', v)}
            />
            <PreviewColorPickerCustom
              title="Thumb"
              color={renderedThumb()}
              onChange={v => updateProp('thumbColor', v)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedText()} onChange={v => updateProp('textColor', v)} />
            <PreviewColorPickerCustom
              title="Active Text"
              color={renderedActiveText()}
              onChange={v => updateProp('activeTextColor', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={24}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Inset"
              min={1}
              max={8}
              step={1}
              value={props().inset}
              valueUnit="px"
              onChange={v => updateProp('inset', v)}
            />
            <PreviewSwitch
              title="Equal Slots"
              isChecked={props().equalSlots}
              onChange={v => updateProp('equalSlots', v)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={100}
              step={5}
              value={props().stretch}
              onChange={v => updateProp('stretch', v)}
            />
            <PreviewSlider
              title="Squash"
              min={0}
              max={6}
              step={0.5}
              value={props().squash}
              valueUnit="px"
              onChange={v => updateProp('squash', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.25}
              max={2}
              step={0.05}
              value={props().speed}
              valueUnit="x"
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Glide"
              min={0}
              max={100}
              step={5}
              value={props().glide}
              onChange={v => updateProp('glide', v)}
            />
            <PreviewSwitch title="Draggable" isChecked={props().draggable} onChange={v => updateProp('draggable', v)} />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={rubberSegment} componentName="RubberSegment" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
