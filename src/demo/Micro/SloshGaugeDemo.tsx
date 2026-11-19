import { For } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import SloshGauge from '@/content/Micro/SloshGauge/SloshGauge';
import { sloshGauge } from '@/constants/code/Micro/sloshGaugeCode';

const DEFAULT_PROPS = {
  value: 60,
  interactive: true,
  showValue: true,
  disabled: false,
  liquidColor: '#f5f5f5',
  glassColor: '#27272a',
  width: 88,
  height: 180,
  radius: 20,
  ticks: 4,
  viscosity: 0.15,
  tilt: 0.45,
  splash: 0.42
};

const PRESETS = [
  { label: 'Empty', value: 0 },
  { label: '25%', value: 25 },
  { label: '60%', value: 60 },
  { label: 'Full', value: 100 }
];

const propData: PropRow[] = [
  {
    name: 'value',
    type: 'number',
    default: 'undefined',
    description: 'The level, 0 to 100, controlled. Every change launches the liquid toward it.'
  },
  { name: 'defaultValue', type: 'number', default: '60', description: 'The starting level when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: number) => void',
    default: '-',
    description: 'The integer level on press, on each change while dragging, and on keys. Interactive only.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'false',
    description: 'Press or drag the tank to set the level, arrows to step. A marker appears at the level.'
  },
  {
    name: 'showValue',
    type: 'boolean',
    default: 'true',
    description: 'A readout whose colour flips at the surface.'
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Dimmed and inert. Value changes still animate.'
  },
  {
    name: 'liquidColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The liquid. The readout over it picks dark or light by itself.'
  },
  { name: 'glassColor', type: 'string', default: '"#27272a"', description: 'The tank.' },
  { name: 'width', type: 'number', default: '88', description: 'Tank width in px. The readout scales with it.' },
  { name: 'height', type: 'number', default: '180', description: 'Tank height in px.' },
  {
    name: 'radius',
    type: 'number',
    default: '20',
    description: 'Corner radius in px, capped at half the smaller side.'
  },
  {
    name: 'ticks',
    type: 'number',
    default: '4',
    description: 'Lines etched on the right of the glass. 0 hides them.'
  },
  {
    name: 'viscosity',
    type: 'number',
    default: '0.15',
    description: '0 is a rigid gauge. Higher is slower to answer, longer to settle, and overshoots more.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0.45',
    description: 'How far the surface leans per unit of speed. 0 keeps it flat.'
  },
  {
    name: 'splash',
    type: 'number',
    default: '0.42',
    description: 'How much of a slam the top and bottom give back. 0 swallows it, 0.8 nearly bounces.'
  },
  { name: 'unit', type: 'string', default: '"%"', description: 'Readout suffix.' },
  { name: 'ariaLabel', type: 'string', default: '"Level"', description: 'Accessible name of the meter or slider.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the tank.' }
];

export default function SloshGaugeDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedLiquid = useColorModeValue(
    () => (props().liquidColor === DEFAULT_PROPS.liquidColor ? '#18181b' : props().liquidColor),
    () => props().liquidColor
  );
  const renderedGlass = useColorModeValue(
    () => (props().glassColor === DEFAULT_PROPS.glassColor ? '#f6f6f6' : props().glassColor),
    () => props().glassColor
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
          <div class="demo-container" style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
            <div style={{ 'margin-bottom': '36px' }}>
              <SloshGauge
                value={props().value}
                onChange={v => updateProp('value', v)}
                interactive={props().interactive}
                showValue={props().showValue}
                disabled={props().disabled}
                liquidColor={renderedLiquid()}
                glassColor={renderedGlass()}
                width={props().width}
                height={props().height}
                radius={props().radius}
                ticks={props().ticks}
                viscosity={props().viscosity}
                tilt={props().tilt}
                splash={props().splash}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '6px'
              }}
            >
              <For each={PRESETS}>
                {preset => (
                  <button
                    type="button"
                    class="cursor-pointer rounded-full bg-transparent px-3 text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-ghost)]"
                    style={{ height: '32px', 'font-size': '13px', 'font-weight': 500 }}
                    onClick={() => updateProp('value', preset.value)}
                  >
                    {preset.label}
                  </button>
                )}
              </For>
            </div>
          </div>

          <Customize>
            <PreviewSlider
              title="Value"
              min={0}
              max={100}
              step={1}
              value={props().value}
              onChange={v => updateProp('value', v)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={props().interactive}
              onChange={v => updateProp('interactive', v)}
            />
            <PreviewSwitch
              title="Show Value"
              isChecked={props().showValue}
              onChange={v => updateProp('showValue', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
            <PreviewColorPickerCustom
              title="Liquid"
              color={renderedLiquid()}
              onChange={v => updateProp('liquidColor', v)}
            />
            <PreviewColorPickerCustom
              title="Glass"
              color={renderedGlass()}
              onChange={v => updateProp('glassColor', v)}
            />
            <PreviewSlider
              title="Width"
              min={56}
              max={160}
              step={4}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={120}
              max={300}
              step={4}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={44}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Ticks"
              min={0}
              max={10}
              step={1}
              value={props().ticks}
              onChange={v => updateProp('ticks', v)}
            />
            <PreviewSlider
              title="Viscosity"
              min={0}
              max={1}
              step={0.05}
              value={props().viscosity}
              onChange={v => updateProp('viscosity', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={1}
              step={0.05}
              value={props().tilt}
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Splash"
              min={0}
              max={0.8}
              step={0.02}
              value={props().splash}
              onChange={v => updateProp('splash', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={sloshGauge} componentName="SloshGauge" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
