import { createSignal } from 'solid-js';
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

import WakeSlider from '@/content/Micro/WakeSlider/WakeSlider';
import { wakeSlider } from '@/constants/code/Micro/wakeSliderCode';

const DEFAULT_PROPS = {
  fillColor: '#f5f5f5',
  trackColor: '#27272a',
  step: 1,
  showValue: true,
  bars: 32,
  height: 56,
  restHeight: 12,
  gap: 4,
  sensitivity: 1,
  reach: 6,
  skew: 0.6,
  glide: 0.3,
  smoothing: 100,
  disabled: false
};

const propData: PropRow[] = [
  { name: 'value', type: 'number', default: 'undefined', description: 'Controlled value.' },
  { name: 'defaultValue', type: 'number', default: '50', description: 'Initial value when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: number) => void',
    default: '-',
    description: 'Called on every committed change, from the pointer or the keyboard.'
  },
  { name: 'min', type: 'number', default: '0', description: 'Lowest value.' },
  { name: 'max', type: 'number', default: '100', description: 'Highest value.' },
  {
    name: 'step',
    type: 'number',
    default: '1',
    description: 'Snapping grid. Large steps move the handle in notches, and the wake pulses per notch.'
  },
  { name: 'bars', type: 'number', default: '32', description: 'How many bars draw the track.' },
  {
    name: 'height',
    type: 'number',
    default: '56',
    description: 'Full bar height in pixels, the ceiling of the wake.'
  },
  { name: 'restHeight', type: 'number', default: '12', description: 'Bar height at rest in pixels.' },
  { name: 'gap', type: 'number', default: '4', description: 'Space between bars in pixels.' },
  { name: 'fillColor', type: 'string', default: '"#f5f5f5"', description: 'Lit bars, up to the value.' },
  { name: 'trackColor', type: 'string', default: '"#27272a"', description: 'Unlit bars.' },
  {
    name: 'crestColor',
    type: 'string',
    default: '""',
    description: 'Optional tint the raised bars take on by their lift. Empty renders no tint layer.'
  },
  {
    name: 'sensitivity',
    type: 'number',
    default: '1',
    description: 'How easily speed raises the wake. Low needs a flick; high lifts it on a stroll.'
  },
  { name: 'reach', type: 'number', default: '6', description: 'Half-width of the wake at full speed, in bars.' },
  {
    name: 'skew',
    type: 'number',
    default: '0.6',
    description: 'How much wider the wake is behind the handle than ahead. 0 is symmetric.'
  },
  {
    name: 'glide',
    type: 'number',
    default: '0.3',
    description: 'Seconds the handle takes to settle. Short hugs the finger; long floats behind it.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '100',
    description: 'Milliseconds of velocity lag. Low twitches with every change of speed; high lingers.'
  },
  { name: 'showValue', type: 'boolean', default: 'false', description: 'Shows the value beside the track.' },
  {
    name: 'formatValue',
    type: '(value: number) => string',
    default: '-',
    description: 'Formats the readout and the announced value.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the slider and ignores input.' },
  { name: 'ariaLabel', type: 'string', default: '"Value"', description: 'Accessible name of the slider.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function WakeSliderDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [value, setValue] = createSignal(50);

  const renderedFill = useColorModeValue(
    () => (props().fillColor === DEFAULT_PROPS.fillColor ? '#18181b' : props().fillColor),
    () => props().fillColor
  );
  const renderedTrack = useColorModeValue(
    () => (props().trackColor === DEFAULT_PROPS.trackColor ? '#f6f6f6' : props().trackColor),
    () => props().trackColor
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
            <div style={{ width: 'min(320px, calc(100% - 48px))' }}>
              <WakeSlider
                value={value()}
                onChange={v => {
                  setValue(v);
                }}
                step={props().step}
                bars={props().bars}
                height={props().height}
                restHeight={props().restHeight}
                gap={props().gap}
                fillColor={renderedFill()}
                trackColor={renderedTrack()}
                sensitivity={props().sensitivity}
                reach={props().reach}
                skew={props().skew}
                glide={props().glide}
                smoothing={props().smoothing}
                showValue={props().showValue}
                disabled={props().disabled}
              />
            </div>
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Fill" color={renderedFill()} onChange={v => updateProp('fillColor', v)} />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack()}
              onChange={v => updateProp('trackColor', v)}
            />
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
            <PreviewSlider
              title="Step"
              min={1}
              max={25}
              step={1}
              value={props().step}
              onChange={v => updateProp('step', v)}
            />
            <PreviewSwitch
              title="Show Value"
              isChecked={props().showValue}
              onChange={v => updateProp('showValue', v)}
            />
            <PreviewSlider
              title="Bars"
              min={12}
              max={64}
              step={1}
              value={props().bars}
              onChange={v => updateProp('bars', v)}
            />
            <PreviewSlider
              title="Height"
              min={24}
              max={96}
              step={2}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Rest Height"
              min={4}
              max={24}
              step={1}
              value={props().restHeight}
              valueUnit="px"
              onChange={v => updateProp('restHeight', v)}
            />
            <PreviewSlider
              title="Gap"
              min={1}
              max={8}
              step={1}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Sensitivity"
              min={0.25}
              max={3}
              step={0.05}
              value={props().sensitivity}
              onChange={v => updateProp('sensitivity', v)}
            />
            <PreviewSlider
              title="Reach"
              min={2}
              max={12}
              step={0.5}
              value={props().reach}
              onChange={v => updateProp('reach', v)}
            />
            <PreviewSlider
              title="Skew"
              min={0}
              max={1}
              step={0.05}
              value={props().skew}
              onChange={v => updateProp('skew', v)}
            />
            <PreviewSlider
              title="Glide"
              min={0.15}
              max={0.6}
              step={0.05}
              value={props().glide}
              valueUnit="s"
              onChange={v => updateProp('glide', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={40}
              max={250}
              step={10}
              value={props().smoothing}
              valueUnit="ms"
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={wakeSlider} componentName="WakeSlider" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
