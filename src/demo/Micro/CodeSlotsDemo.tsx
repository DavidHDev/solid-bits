import { createSignal, onCleanup } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import CodeSlots, { type CodeSlotsStatus } from '@/content/Micro/CodeSlots/CodeSlots';
import { codeSlots } from '@/constants/code/Micro/codeSlotsCode';

const DEFAULT_PROPS = {
  accentColor: '#f5f5f5',
  inkColor: '#f5f5f5',
  slotColor: '#27272a',
  digitColor: '#18181b',
  dangerColor: '#ff3b30',
  length: 6,
  mask: false,
  caret: true,
  outcome: 'accept',
  slotSize: 44,
  gap: 8,
  radius: 12,
  bounce: 0.2,
  settle: 0.3,
  rise: 8,
  cascade: 20,
  disabled: false
};

type ColorKey = 'accentColor' | 'inkColor' | 'slotColor' | 'digitColor';

const LIGHT: Record<ColorKey, string> = {
  accentColor: '#18181b',
  inkColor: '#18181b',
  slotColor: '#f6f6f6',
  digitColor: '#ffffff'
};

const OUTCOME_OPTIONS = [
  { value: 'accept', label: 'Accept' },
  { value: 'reject', label: 'Reject' }
];

const propData: PropRow[] = [
  { name: 'length', type: 'number', default: '6', description: 'Number of slots.' },
  {
    name: 'value',
    type: 'string',
    default: 'undefined',
    description: 'Controlled code. Digits that arrive from outside land with the cascade; digits removed drain.'
  },
  {
    name: 'defaultValue',
    type: 'string',
    default: '""',
    description: 'Uncontrolled initial code, rendered already landed.'
  },
  {
    name: 'onChange',
    type: '(code: string) => void',
    default: '-',
    description: 'Called on every edit, including the clear at the end of a reject.'
  },
  {
    name: 'onComplete',
    type: '(code: string) => void',
    default: '-',
    description: 'Called once when the last hole is filled.'
  },
  {
    name: 'status',
    type: '"idle" | "error" | "success"',
    default: '"idle"',
    description:
      'error drains the slots last to first under the danger tint and clears the code; success merges the fills into one wash and locks the input.'
  },
  { name: 'mask', type: 'boolean', default: 'false', description: 'Shows a dot instead of each digit.' },
  { name: 'caret', type: 'boolean', default: 'true', description: 'Shows the blinking caret in the active slot.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the row and ignores input.' },
  { name: 'autoFocus', type: 'boolean', default: 'false', description: 'Focuses the input on mount.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Fill of a landed digit, the active ring and the success wash.'
  },
  {
    name: 'inkColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Caret, and the tint of the active slot.'
  },
  { name: 'slotColor', type: 'string', default: '"#27272a"', description: 'Surface of an empty slot.' },
  { name: 'digitColor', type: 'string', default: '"#18181b"', description: 'Digit colour on the fill.' },
  {
    name: 'dangerColor',
    type: 'string',
    default: '"#ff3b30"',
    description: 'Ring and fill colour while status is error.'
  },
  {
    name: 'slotSize',
    type: 'number',
    default: '44',
    description: 'Slot width in pixels. Height and digit size follow it.'
  },
  { name: 'gap', type: 'number', default: '8', description: 'Space between slots in pixels.' },
  {
    name: 'radius',
    type: 'number',
    default: '12',
    description: 'Corner radius in pixels, capped at half the slot size.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.2',
    description: 'Spring overshoot of the landing fill. 0 is critically damped.'
  },
  { name: 'settle', type: 'number', default: '0.3', description: 'Seconds a digit takes to land or drain.' },
  { name: 'rise', type: 'number', default: '8', description: 'Pixels a digit rises into place. 0 fades only.' },
  {
    name: 'cascade',
    type: 'number',
    default: '20',
    description: 'Milliseconds between slots when several land at once or drain on reject.'
  },
  {
    name: 'ariaLabel',
    type: 'string',
    default: '"One-time code"',
    description: 'Accessible name of the input.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function CodeSlotsDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const light = (key: ColorKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedAccent = useColorModeValue(
    () => light('accentColor'),
    () => props().accentColor
  );
  const renderedInk = useColorModeValue(
    () => light('inkColor'),
    () => props().inkColor
  );
  const renderedSlot = useColorModeValue(
    () => light('slotColor'),
    () => props().slotColor
  );
  const renderedDigit = useColorModeValue(
    () => light('digitColor'),
    () => props().digitColor
  );

  const [value, setValue] = createSignal('');
  const [status, setStatus] = createSignal<CodeSlotsStatus>('idle');
  const timers: ReturnType<typeof setTimeout>[] = [];
  const later = (fn: () => void, ms: number) => {
    timers.push(setTimeout(fn, ms));
  };
  onCleanup(() => timers.forEach(clearTimeout));

  const handleChange = (code: string) => {
    setValue(code);
    setStatus('idle');
  };
  const handleComplete = () => {
    later(() => {
      if (props().outcome === 'reject') {
        setStatus('error');
        return;
      }
      setStatus('success');
      later(() => {
        setValue('');
        setStatus('idle');
      }, 1800);
    }, 350);
  };

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
            <CodeSlots
              length={props().length}
              value={value()}
              status={status()}
              mask={props().mask}
              caret={props().caret}
              disabled={props().disabled}
              accentColor={renderedAccent()}
              inkColor={renderedInk()}
              slotColor={renderedSlot()}
              digitColor={renderedDigit()}
              dangerColor={props().dangerColor}
              slotSize={props().slotSize}
              gap={props().gap}
              radius={props().radius}
              bounce={props().bounce}
              settle={props().settle}
              rise={props().rise}
              cascade={props().cascade}
              onChange={handleChange}
              onComplete={handleComplete}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedInk()} onChange={v => updateProp('inkColor', v)} />
            <PreviewColorPickerCustom title="Slot" color={renderedSlot()} onChange={v => updateProp('slotColor', v)} />
            <PreviewColorPickerCustom
              title="Digit"
              color={renderedDigit()}
              onChange={v => updateProp('digitColor', v)}
            />
            <PreviewColorPickerCustom
              title="Danger"
              color={props().dangerColor}
              onChange={v => updateProp('dangerColor', v)}
            />
            <PreviewSlider
              title="Length"
              min={4}
              max={8}
              step={1}
              value={props().length}
              onChange={v => updateProp('length', v)}
            />
            <PreviewSwitch title="Mask" isChecked={props().mask} onChange={v => updateProp('mask', v)} />
            <PreviewSwitch title="Caret" isChecked={props().caret} onChange={v => updateProp('caret', v)} />
            <PreviewSelect
              title="Outcome"
              options={OUTCOME_OPTIONS}
              value={props().outcome}
              onChange={v => updateProp('outcome', v)}
              width={120}
            />
            <PreviewSlider
              title="Slot Size"
              min={36}
              max={64}
              step={2}
              value={props().slotSize}
              valueUnit="px"
              onChange={v => updateProp('slotSize', v)}
            />
            <PreviewSlider
              title="Gap"
              min={4}
              max={16}
              step={1}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.3}
              step={0.05}
              value={props().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSlider
              title="Settle"
              min={0.2}
              max={0.5}
              step={0.05}
              value={props().settle}
              valueUnit="s"
              onChange={v => updateProp('settle', v)}
            />
            <PreviewSlider
              title="Rise"
              min={0}
              max={16}
              step={1}
              value={props().rise}
              valueUnit="px"
              onChange={v => updateProp('rise', v)}
            />
            <PreviewSlider
              title="Cascade"
              min={0}
              max={60}
              step={5}
              value={props().cascade}
              valueUnit="ms"
              onChange={v => updateProp('cascade', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={codeSlots} componentName="CodeSlots" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
