import { createMemo, createSignal } from 'solid-js';
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

import GlideSelect, { type GlideSelectOption, type GlideSelectProps } from '@/content/Micro/GlideSelect/GlideSelect';
import { glideSelect } from '@/constants/code/Micro/glideSelectCode';

type OptionSet = (string | GlideSelectOption)[];

const OPTION_SETS: Record<string, OptionSet> = {
  formats: [
    { value: 'png', label: 'PNG', tag: 'Lossless' },
    { value: 'jpg', label: 'JPG', tag: 'Smallest' },
    { value: 'webp', label: 'WebP', tag: 'Modern' },
    { value: 'svg', label: 'SVG', tag: 'Vector' },
    { value: 'pdf', label: 'PDF', tag: 'Print' }
  ],
  regions: [
    { value: 'us-east', label: 'US East', tag: 'Virginia' },
    { value: 'us-west', label: 'US West', tag: 'Oregon' },
    { value: 'eu', label: 'EU', tag: 'Frankfurt' },
    { value: 'asia', label: 'Asia', tag: 'Singapore' }
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
};
const firstOf = (set: OptionSet) => (typeof set[0] === 'string' ? set[0] : set[0].value);

const DEFAULT_PROPS = {
  options: 'formats',
  size: 'md' as NonNullable<GlideSelectProps['size']>,
  accentColor: '#f5f5f5',
  surfaceColor: '#27272a',
  highlightColor: '#3f3f46',
  textColor: '#f5f5f5',
  radius: 10,
  menuWidth: 176,
  placement: 'bottom' as NonNullable<GlideSelectProps['placement']>,
  align: 'left' as NonNullable<GlideSelectProps['align']>,
  popDuration: 180,
  glideDuration: 220,
  rememberPosition: true,
  showTags: true,
  disabled: false
};

const OPTION_OPTIONS = [
  { value: 'formats', label: 'Formats' },
  { value: 'regions', label: 'Regions' },
  { value: 'sizes', label: 'Sizes' }
];
const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];
const PLACEMENT_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' }
];
const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const propData: PropRow[] = [
  {
    name: 'options',
    type: '(string | { value: string; label: JSX.Element; tag?: string })[]',
    default: '["One", "Two", "Three"]',
    description: 'The rows. A string is both value and label; a tag shows muted at the right.'
  },
  {
    name: 'value',
    type: 'string',
    default: 'undefined',
    description: 'Controlled value. Outside changes never animate.'
  },
  { name: 'defaultValue', type: 'string', default: 'undefined', description: 'Initial value when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: string, option) => void',
    default: '-',
    description: 'Called on a pick that changes the value.'
  },
  {
    name: 'placeholder',
    type: 'string',
    default: '"Select…"',
    description: 'Chip text while nothing is selected.'
  },
  { name: 'showTags', type: 'boolean', default: 'true', description: "Shows each row's tag." },
  { name: 'accentColor', type: 'string', default: '"#f5f5f5"', description: 'The check on the selected row.' },
  { name: 'surfaceColor', type: 'string', default: '"#27272a"', description: 'Chip and menu background.' },
  {
    name: 'highlightColor',
    type: 'string',
    default: '"#3f3f46"',
    description: 'The gliding pill. The selected row rests on it at 60%, and the chip tint derives from it.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Labels. Tags and the chevron derive from it.'
  },
  {
    name: 'size',
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: 'Chip 28, 32 or 44 pixels with matching rows. Large is the touch-first size.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '10',
    description: 'Menu corner in pixels. Chip, rows and pill use 4 less so they stay concentric.'
  },
  {
    name: 'menuWidth',
    type: 'number',
    default: '176',
    description: 'Menu width in pixels, never narrower than the chip.'
  },
  {
    name: 'placement',
    type: '"top" | "bottom"',
    default: '"bottom"',
    description: 'Which side the menu grows on. It flips when the chosen side would leave the viewport.'
  },
  { name: 'align', type: '"left" | "right"', default: '"left"', description: 'Which chip edge the menu shares.' },
  {
    name: 'popDuration',
    type: 'number',
    default: '180',
    description: 'Milliseconds the menu takes to grow out of its corner. It leaves in two thirds of that.'
  },
  {
    name: 'glideDuration',
    type: 'number',
    default: '220',
    description: 'Milliseconds the pill takes to travel between rows. 0 is a conventional hover.'
  },
  {
    name: 'rememberPosition',
    type: 'boolean',
    default: 'true',
    description:
      'The highlight stays on the row the pointer left, so re-entry glides from there. Off, it clears on leave and the selected row shows again.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the chip and ignores input.' },
  { name: 'ariaLabel', type: 'string', default: '"Select"', description: 'Accessible name of the chip and list.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function GlideSelectDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const set = createMemo(() => OPTION_SETS[props().options] ?? OPTION_SETS.formats);
  const [value, setValue] = createSignal(() => firstOf(set()));
  const current = createMemo(() => {
    const list = set();
    const v = value();
    const known = list.some(o => (typeof o === 'string' ? o : o.value) === v);
    return known ? v : firstOf(list);
  });

  const renderedAccent = useColorModeValue(
    () => (props().accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : props().accentColor),
    () => props().accentColor
  );
  const renderedSurface = useColorModeValue(
    () => (props().surfaceColor === DEFAULT_PROPS.surfaceColor ? '#f6f6f6' : props().surfaceColor),
    () => props().surfaceColor
  );
  const renderedHighlight = useColorModeValue(
    () => (props().highlightColor === DEFAULT_PROPS.highlightColor ? '#e4e4e7' : props().highlightColor),
    () => props().highlightColor
  );
  const renderedText = useColorModeValue(
    () => (props().textColor === DEFAULT_PROPS.textColor ? '#18181b' : props().textColor),
    () => props().textColor
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
            class="demo-container"
            style={{
              position: 'relative',
              height: '480px',
              overflow: 'visible',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <Keyed token={props().options}>
              {() => (
                <GlideSelect
                  options={set()}
                  value={current()}
                  onChange={v => {
                    setValue(v);
                  }}
                  ariaLabel="Export format"
                  showTags={props().showTags}
                  accentColor={renderedAccent()}
                  surfaceColor={renderedSurface()}
                  highlightColor={renderedHighlight()}
                  textColor={renderedText()}
                  size={props().size}
                  radius={props().radius}
                  menuWidth={props().menuWidth}
                  placement={props().placement}
                  align={props().align}
                  popDuration={props().popDuration}
                  glideDuration={props().glideDuration}
                  rememberPosition={props().rememberPosition}
                  disabled={props().disabled}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Options"
              options={OPTION_OPTIONS}
              value={props().options}
              onChange={(v: string) => {
                updateProp('options', v);
                setValue(firstOf(OPTION_SETS[v] ?? OPTION_SETS.formats));
              }}
              width={120}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={(v: typeof DEFAULT_PROPS.size) => updateProp('size', v)}
              width={120}
            />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom
              title="Surface"
              color={renderedSurface()}
              onChange={v => updateProp('surfaceColor', v)}
            />
            <PreviewColorPickerCustom
              title="Highlight"
              color={renderedHighlight()}
              onChange={v => updateProp('highlightColor', v)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedText()} onChange={v => updateProp('textColor', v)} />
            <PreviewSlider
              title="Radius"
              min={6}
              max={20}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Menu Width"
              min={140}
              max={280}
              step={4}
              value={props().menuWidth}
              valueUnit="px"
              onChange={v => updateProp('menuWidth', v)}
            />
            <PreviewSelect
              title="Placement"
              options={PLACEMENT_OPTIONS}
              value={props().placement}
              onChange={(v: typeof DEFAULT_PROPS.placement) => updateProp('placement', v)}
              width={120}
            />
            <PreviewSelect
              title="Align"
              options={ALIGN_OPTIONS}
              value={props().align}
              onChange={(v: typeof DEFAULT_PROPS.align) => updateProp('align', v)}
              width={110}
            />
            <PreviewSlider
              title="Pop"
              min={0}
              max={400}
              step={10}
              value={props().popDuration}
              valueUnit="ms"
              onChange={v => updateProp('popDuration', v)}
            />
            <PreviewSlider
              title="Glide"
              min={0}
              max={400}
              step={10}
              value={props().glideDuration}
              valueUnit="ms"
              onChange={v => updateProp('glideDuration', v)}
            />
            <PreviewSwitch
              title="Remember Position"
              isChecked={props().rememberPosition}
              onChange={v => updateProp('rememberPosition', v)}
            />
            <PreviewSwitch title="Show Tags" isChecked={props().showTags} onChange={v => updateProp('showTags', v)} />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glideSelect} componentName="GlideSelect" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
