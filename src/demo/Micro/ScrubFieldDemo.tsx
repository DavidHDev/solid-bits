import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import ScrubField, { type ScrubFieldSize } from '@/content/Micro/ScrubField/ScrubField';
import { scrubField } from '@/constants/code/Micro/scrubFieldCode';

const DEFAULT_PROPS = {
  accent: '#f5f5f5',
  chipColor: '#27272a',
  label: 'Radius',
  suffix: 'px',
  defaultValue: 24,
  min: 0,
  max: 100,
  step: 1,
  size: 'lg' as ScrubFieldSize,
  sensitivity: 2,
  rubberReach: 8,
  returnDuration: 300,
  coarseMultiplier: 10,
  fineMultiplier: 0.1,
  showDelta: true,
  showDirty: false,
  showFill: true,
  disabled: false
};

const STEP_OPTIONS = [
  { value: 0.1, label: '0.1' },
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const propData: PropRow[] = [
  {
    name: 'label',
    type: 'string',
    default: '"Radius"',
    description: 'The field name. Drag anywhere on the chip to scrub; click without moving to type.'
  },
  {
    name: 'suffix',
    type: 'string',
    default: '"px"',
    description: 'Unit after the number, also read by screen readers.'
  },
  {
    name: 'value',
    type: 'number',
    default: 'undefined',
    description: 'Controlled value; changes from outside land without motion.'
  },
  {
    name: 'defaultValue',
    type: 'number',
    default: '24',
    description: 'Initial value and the dirty baseline: the ring turns off exactly here.'
  },
  { name: 'min', type: 'number', default: '0', description: 'Lower bound; the rubber band starts here.' },
  { name: 'max', type: 'number', default: '100', description: 'Upper bound; the rubber band starts here.' },
  {
    name: 'step',
    type: 'number',
    default: '1',
    description: 'Granularity of drag and arrows; sets the decimals shown.'
  },
  { name: 'size', type: '"sm" | "md" | "lg"', default: '"md"', description: 'Chip height 28, 34 or 44 pixels.' },
  {
    name: 'sensitivity',
    type: 'number',
    default: '2',
    description: 'Pixels of travel per step. 1 is twitchy, 6 is precise.'
  },
  {
    name: 'rubberReach',
    type: 'number',
    default: '8',
    description: 'How far past a bound the number can be pushed, as a percent of the range. 0 is a hard stop.'
  },
  {
    name: 'returnDuration',
    type: 'number',
    default: '300',
    description: 'Duration in milliseconds of the critically damped snap back to the bound.'
  },
  {
    name: 'coarseMultiplier',
    type: 'number',
    default: '10',
    description: 'Step multiplier while Shift is held, and for Page Up and Page Down.'
  },
  {
    name: 'fineMultiplier',
    type: 'number',
    default: '0.1',
    description: 'Step multiplier while Alt or Option is held; adds a decimal.'
  },
  {
    name: 'showDelta',
    type: 'boolean',
    default: 'true',
    description: 'Shows the signed change in a pill riding the pointer.'
  },
  {
    name: 'showDirty',
    type: 'boolean',
    default: 'false',
    description: 'Rings the chip while the value differs from the default.'
  },
  {
    name: 'showFill',
    type: 'boolean',
    default: 'true',
    description: 'Fills the chip from the left in proportion to where the value sits in the range.'
  },
  {
    name: 'accent',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Fill band, dirty ring and delta pill.'
  },
  {
    name: 'chipColor',
    type: 'string',
    default: '"#27272a"',
    description: 'Chip surface. Text inherits from the page.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the chip and ignores input.' },
  {
    name: 'onChange',
    type: '(value: number) => void',
    default: '-',
    description: 'Called on every step, key and typed commit.'
  },
  {
    name: 'onCommit',
    type: '(value: number) => void',
    default: '-',
    description: 'Called on release, on a key step and on blur or Enter.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the chip.' }
];

export default function ScrubFieldDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const mountKey = createMemo(() => `${props().min}-${props().max}-${props().step}`);

  const renderedAccent = useColorModeValue(
    () => (props().accent === DEFAULT_PROPS.accent ? '#18181b' : props().accent),
    () => props().accent
  );
  const renderedChip = useColorModeValue(
    () => (props().chipColor === DEFAULT_PROPS.chipColor ? '#f6f6f6' : props().chipColor),
    () => props().chipColor
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
              height: '400px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <Keyed token={mountKey()}>
              {() => (
                <ScrubField
                  label={props().label}
                  suffix={props().suffix}
                  defaultValue={props().defaultValue}
                  min={props().min}
                  max={props().max}
                  step={props().step}
                  size={props().size}
                  sensitivity={props().sensitivity}
                  rubberReach={props().rubberReach}
                  returnDuration={props().returnDuration}
                  coarseMultiplier={props().coarseMultiplier}
                  fineMultiplier={props().fineMultiplier}
                  showDelta={props().showDelta}
                  showDirty={props().showDirty}
                  showFill={props().showFill}
                  accent={renderedAccent()}
                  chipColor={renderedChip()}
                  disabled={props().disabled}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Accent" color={renderedAccent()} onChange={v => updateProp('accent', v)} />
            <PreviewColorPickerCustom title="Chip" color={renderedChip()} onChange={v => updateProp('chipColor', v)} />
            <PreviewInput title="Label" value={props().label} maxLength={14} onChange={v => updateProp('label', v)} />
            <PreviewInput title="Suffix" value={props().suffix} maxLength={4} onChange={v => updateProp('suffix', v)} />
            <PreviewSlider
              title="Default"
              min={0}
              max={100}
              step={1}
              value={props().defaultValue}
              onChange={v => updateProp('defaultValue', v)}
            />
            <PreviewSlider
              title="Min"
              min={-100}
              max={0}
              step={10}
              value={props().min}
              onChange={v => updateProp('min', v)}
            />
            <PreviewSlider
              title="Max"
              min={10}
              max={500}
              step={10}
              value={props().max}
              onChange={v => updateProp('max', v)}
            />
            <PreviewSelect
              title="Step"
              options={STEP_OPTIONS}
              value={props().step}
              onChange={v => updateProp('step', Number(v))}
              width={100}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={(v: ScrubFieldSize) => updateProp('size', v)}
              width={120}
            />
            <PreviewSlider
              title="Sensitivity"
              min={1}
              max={8}
              step={1}
              value={props().sensitivity}
              valueUnit="px"
              onChange={v => updateProp('sensitivity', v)}
            />
            <PreviewSlider
              title="Rubber Reach"
              min={0}
              max={25}
              step={1}
              value={props().rubberReach}
              valueUnit="%"
              onChange={v => updateProp('rubberReach', v)}
            />
            <PreviewSlider
              title="Return"
              min={150}
              max={600}
              step={10}
              value={props().returnDuration}
              valueUnit="ms"
              onChange={v => updateProp('returnDuration', v)}
            />
            <PreviewSlider
              title="Coarse"
              min={2}
              max={20}
              step={1}
              value={props().coarseMultiplier}
              valueUnit="x"
              onChange={v => updateProp('coarseMultiplier', v)}
            />
            <PreviewSlider
              title="Fine"
              min={0.05}
              max={0.5}
              step={0.05}
              value={props().fineMultiplier}
              valueUnit="x"
              onChange={v => updateProp('fineMultiplier', v)}
            />
            <PreviewSwitch
              title="Ghost Delta"
              isChecked={props().showDelta}
              onChange={v => updateProp('showDelta', v)}
            />
            <PreviewSwitch
              title="Dirty Ring"
              isChecked={props().showDirty}
              onChange={v => updateProp('showDirty', v)}
            />
            <PreviewSwitch title="Fill" isChecked={props().showFill} onChange={v => updateProp('showFill', v)} />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrubField} componentName="ScrubField" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
