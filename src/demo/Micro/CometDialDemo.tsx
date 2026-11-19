import { createSignal } from 'solid-js';
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

import CometDial from '@/content/Micro/CometDial/CometDial';
import { cometDial } from '@/constants/code/Micro/cometDialCode';

const DEFAULT_PROPS = {
  accent: '#f5f5f5',
  ink: '#fdfdfd',
  unit: 'percent',
  size: 250,
  sweep: 320,
  thickness: 5,
  speed: 25,
  tapBounce: 0.2,
  flickBounce: 0.1,
  momentum: 1,
  cometReach: 180,
  cometWidth: 12,
  disabled: false
};

const UNIT_OPTIONS = [
  { value: 'percent', label: '%' },
  { value: 'degrees', label: '°' },
  { value: 'decibels', label: 'dB' },
  { value: 'none', label: 'None' }
];
const UNITS: Record<string, string> = { percent: '%', degrees: '°', decibels: 'dB', none: '' };

const propData: PropRow[] = [
  {
    name: 'value',
    type: 'number',
    default: 'undefined',
    description: 'Controlled value. A change from outside launches the reading on the tap spring.'
  },
  { name: 'defaultValue', type: 'number', default: '62', description: 'Initial value when uncontrolled.' },
  { name: 'min', type: 'number', default: '0', description: 'Lowest value.' },
  { name: 'max', type: 'number', default: '100', description: 'Highest value.' },
  { name: 'step', type: 'number', default: '1', description: 'Snapping grid, and the keyboard nudge.' },
  { name: 'unit', type: 'string', default: '"%"', description: 'Suffix after the figure. Empty hides it.' },
  { name: 'label', type: 'string', default: '"Level"', description: 'Accessible name of the slider.' },
  { name: 'accent', type: 'string', default: '"#f5f5f5"', description: 'The lit arc, the bead and the comet.' },
  { name: 'ink', type: 'string', default: '"#fdfdfd"', description: 'The track and the readout.' },
  {
    name: 'size',
    type: 'number',
    default: '250',
    description: 'Diameter in pixels. Everything inside scales with it.'
  },
  {
    name: 'sweep',
    type: 'number',
    default: '320',
    description: 'Degrees the arc covers, with the gap centred at the bottom.'
  },
  {
    name: 'thickness',
    type: 'number',
    default: '5',
    description: 'Stroke width of the track and the arc. The bead follows it.'
  },
  { name: 'speed', type: 'number', default: '25', description: 'How quickly the reading arrives, 0 to 100.' },
  { name: 'tapBounce', type: 'number', default: '0.2', description: 'Ring-down after a tap. 0 stops dead.' },
  {
    name: 'flickBounce',
    type: 'number',
    default: '0.1',
    description: 'Ring-down after a full-speed flick. A slower release lands between the two.'
  },
  {
    name: 'momentum',
    type: 'number',
    default: '1',
    description: 'How far a flick carries the reading past where you let go. 0 drops it where released.'
  },
  {
    name: 'cometReach',
    type: 'number',
    default: '180',
    description: 'Degrees of trail behind the bead at full speed.'
  },
  {
    name: 'cometWidth',
    type: 'number',
    default: '12',
    description: 'Extra stroke width at the head of the trail at full speed.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the dial and ignores input.' },
  {
    name: 'onChange',
    type: '(value: number) => void',
    default: '-',
    description: 'Called on every snapped change, including during a drag.'
  },
  {
    name: 'onChangeEnd',
    type: '(value: number, detail: { velocity: number; bounce: number }) => void',
    default: '-',
    description: 'Called on release and on a key, with the release velocity and the bounce it earned.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function CometDialDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [value, setValue] = createSignal(62);

  const renderedAccent = useColorModeValue(
    () => (props().accent === DEFAULT_PROPS.accent ? '#18181b' : props().accent),
    () => props().accent
  );
  const renderedInk = useColorModeValue(
    () => (props().ink === DEFAULT_PROPS.ink ? '#18181b' : props().ink),
    () => props().ink
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
            <CometDial
              value={value()}
              onChange={v => {
                setValue(v);
              }}
              unit={UNITS[props().unit] ?? '%'}
              accent={renderedAccent()}
              ink={renderedInk()}
              size={props().size}
              sweep={props().sweep}
              thickness={props().thickness}
              speed={props().speed}
              tapBounce={props().tapBounce}
              flickBounce={props().flickBounce}
              momentum={props().momentum}
              cometReach={props().cometReach}
              cometWidth={props().cometWidth}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Accent" color={renderedAccent()} onChange={v => updateProp('accent', v)} />
            <PreviewColorPickerCustom title="Ink" color={renderedInk()} onChange={v => updateProp('ink', v)} />
            <PreviewSlider
              title="Value"
              min={0}
              max={100}
              step={1}
              value={value()}
              onChange={v => {
                setValue(v);
              }}
            />
            <PreviewSelect
              title="Unit"
              options={UNIT_OPTIONS}
              value={props().unit}
              onChange={v => updateProp('unit', v)}
              width={110}
            />
            <PreviewSlider
              title="Size"
              min={160}
              max={360}
              step={10}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Sweep"
              min={180}
              max={340}
              step={5}
              value={props().sweep}
              valueUnit="°"
              onChange={v => updateProp('sweep', v)}
            />
            <PreviewSlider
              title="Thickness"
              min={2}
              max={8}
              step={0.5}
              value={props().thickness}
              onChange={v => updateProp('thickness', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={100}
              step={1}
              value={props().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Tap Bounce"
              min={0}
              max={0.3}
              step={0.02}
              value={props().tapBounce}
              onChange={v => updateProp('tapBounce', v)}
            />
            <PreviewSlider
              title="Flick Bounce"
              min={0}
              max={0.5}
              step={0.02}
              value={props().flickBounce}
              onChange={v => updateProp('flickBounce', v)}
            />
            <PreviewSlider
              title="Momentum"
              min={0}
              max={2}
              step={0.1}
              value={props().momentum}
              onChange={v => updateProp('momentum', v)}
            />
            <PreviewSlider
              title="Comet Reach"
              min={10}
              max={180}
              step={5}
              value={props().cometReach}
              valueUnit="°"
              onChange={v => updateProp('cometReach', v)}
            />
            <PreviewSlider
              title="Comet Width"
              min={0}
              max={12}
              step={0.5}
              value={props().cometWidth}
              onChange={v => updateProp('cometWidth', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cometDial} componentName="CometDial" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
