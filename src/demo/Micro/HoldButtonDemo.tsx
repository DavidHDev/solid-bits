import { createMemo } from 'solid-js';
import { CreditCardIcon, Delete02Icon, Logout01Icon, SentIcon, Tick02Icon } from '@hugeicons/core-free-icons';
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
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import HoldButton, { type HoldButtonDirection, type HoldButtonSize } from '@/content/Micro/HoldButton/HoldButton';
import { holdButton } from '@/constants/code/Micro/holdButtonCode';

type Action = 'delete' | 'send' | 'pay' | 'signout';

const DEFAULT_PROPS = {
  action: 'delete' as Action,
  fillColor: '#0aa0ef',
  backgroundColor: '#26282b',
  textColor: '#f5f5f5',
  fillTextColor: '#ffffff',
  size: 'md' as HoldButtonSize,
  radius: 14,
  fillDirection: 'right' as HoldButtonDirection,
  holdTime: 2000,
  releaseTime: 200,
  pressScale: 0.97,
  wave: true,
  waveAmplitude: 6,
  glow: true,
  resetAfter: 1200,
  disabled: false
};

const ACTIONS: Record<Action, { label: string; done: string; icon: IconSvgElement }> = {
  delete: { label: 'Hold to delete', done: 'Deleted', icon: Delete02Icon as IconSvgElement },
  send: { label: 'Hold to send', done: 'Sent', icon: SentIcon as IconSvgElement },
  pay: { label: 'Hold to pay', done: 'Paid', icon: CreditCardIcon as IconSvgElement },
  signout: { label: 'Hold to sign out', done: 'Signed out', icon: Logout01Icon as IconSvgElement }
};

const ACTION_OPTIONS = [
  { value: 'delete', label: 'Delete' },
  { value: 'send', label: 'Send' },
  { value: 'pay', label: 'Pay' },
  { value: 'signout', label: 'Sign out' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const DIRECTION_OPTIONS = [
  { value: 'right', label: 'Right' },
  { value: 'up', label: 'Up' }
];

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element',
    default: '"Hold to delete"',
    description: 'Label shown while idle and holding.'
  },
  {
    name: 'doneLabel',
    type: 'JSX.Element',
    default: '"Deleted"',
    description: 'Label that blurs in when the hold completes.'
  },
  {
    name: 'icon',
    type: 'JSX.Element',
    default: 'null',
    description: 'Optional icon rendered before the idle label.'
  },
  {
    name: 'doneIcon',
    type: 'JSX.Element',
    default: 'null',
    description: 'Optional icon rendered before the done label.'
  },
  { name: 'backgroundColor', type: 'string', default: '"#26282b"', description: 'Button body colour.' },
  {
    name: 'fillColor',
    type: 'string',
    default: '"#0aa0ef"',
    description: 'Colour of the liquid fill, its wave, the glow and the focus ring.'
  },
  { name: 'textColor', type: 'string', default: '"#f5f5f5"', description: 'Label colour outside the fill.' },
  {
    name: 'fillTextColor',
    type: 'string',
    default: '"#ffffff"',
    description: 'Label colour inside the fill; the ink inverts as the edge crosses it.'
  },
  {
    name: 'size',
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: 'Height, padding and font size preset.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '14',
    description: 'Corner radius in pixels of the body, the fill and the focus ring.'
  },
  {
    name: 'fillDirection',
    type: '"right" | "up"',
    default: '"right"',
    description: 'Whether the liquid sweeps left to right or rises from the bottom.'
  },
  {
    name: 'holdTime',
    type: 'number',
    default: '2000',
    description: 'How long the press must last, in milliseconds. The fill moves at constant speed.'
  },
  {
    name: 'releaseTime',
    type: 'number',
    default: '200',
    description: 'How fast the fill snaps back on an early release or a reset, in milliseconds.'
  },
  {
    name: 'pressScale',
    type: 'number',
    default: '0.97',
    description: 'Squash of the button while a pointer holds it. 1 disables it.'
  },
  {
    name: 'wave',
    type: 'boolean',
    default: 'true',
    description: 'Scrolling meniscus on the leading edge of the fill.'
  },
  { name: 'waveAmplitude', type: 'number', default: '6', description: 'Height of the wave crests in pixels.' },
  {
    name: 'glow',
    type: 'boolean',
    default: 'true',
    description: 'Glow that charges with the hold and pulses once on completion.'
  },
  {
    name: 'resetAfter',
    type: 'number',
    default: '1200',
    description: 'Milliseconds the done state stays before the button resets. 0 keeps it done.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the button and ignores input.' },
  {
    name: 'onHold',
    type: '() => void',
    default: '-',
    description: 'Called once, on the frame the fill completes.'
  },
  {
    name: 'onTap',
    type: '() => void',
    default: '-',
    description: 'Called on a release shorter than 250ms that did not drift away.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the button.' }
];

export default function HoldButtonDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const current = createMemo(() => ACTIONS[props().action] || ACTIONS.delete);
  const remountKey = createMemo(() => `${props().action}-${props().fillDirection}`);

  const renderedBackground = useColorModeValue(
    () => (props().backgroundColor === DEFAULT_PROPS.backgroundColor ? '#f6f6f6' : props().backgroundColor),
    () => props().backgroundColor
  );
  const renderedText = useColorModeValue(
    () => (props().textColor === DEFAULT_PROPS.textColor ? '#333333' : props().textColor),
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
              height: '400px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <Keyed token={remountKey()}>
              {() => (
                <HoldButton
                  doneLabel={current().done}
                  icon={<HugeiconsIcon icon={current().icon} size={18} strokeWidth={2} />}
                  doneIcon={<HugeiconsIcon icon={Tick02Icon as IconSvgElement} size={18} strokeWidth={2.5} />}
                  backgroundColor={renderedBackground()}
                  fillColor={props().fillColor}
                  textColor={renderedText()}
                  fillTextColor={props().fillTextColor}
                  size={props().size}
                  radius={props().radius}
                  fillDirection={props().fillDirection}
                  holdTime={props().holdTime}
                  releaseTime={props().releaseTime}
                  pressScale={props().pressScale}
                  wave={props().wave}
                  waveAmplitude={props().waveAmplitude}
                  glow={props().glow}
                  resetAfter={props().resetAfter}
                  disabled={props().disabled}
                >
                  {current().label}
                </HoldButton>
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Action"
              options={ACTION_OPTIONS}
              value={props().action}
              onChange={(v: Action) => updateProp('action', v)}
              width={150}
            />
            <PreviewColorPickerCustom
              title="Fill"
              color={props().fillColor}
              onChange={v => updateProp('fillColor', v)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('backgroundColor', v)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedText()} onChange={v => updateProp('textColor', v)} />
            <PreviewColorPickerCustom
              title="Text On Fill"
              color={props().fillTextColor}
              onChange={v => updateProp('fillTextColor', v)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={(v: HoldButtonSize) => updateProp('size', v)}
              width={140}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={30}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSelect
              title="Fill Direction"
              options={DIRECTION_OPTIONS}
              value={props().fillDirection}
              onChange={(v: HoldButtonDirection) => updateProp('fillDirection', v)}
              width={120}
            />
            <PreviewSlider
              title="Hold Time"
              min={600}
              max={4000}
              step={100}
              value={props().holdTime}
              valueUnit="ms"
              onChange={v => updateProp('holdTime', v)}
            />
            <PreviewSlider
              title="Release"
              min={100}
              max={400}
              step={10}
              value={props().releaseTime}
              valueUnit="ms"
              onChange={v => updateProp('releaseTime', v)}
            />
            <PreviewSlider
              title="Press Scale"
              min={0.9}
              max={1}
              step={0.005}
              value={props().pressScale}
              onChange={v => updateProp('pressScale', v)}
            />
            <PreviewSwitch title="Wave" isChecked={props().wave} onChange={v => updateProp('wave', v)} />
            <PreviewSlider
              title="Wave Size"
              min={2}
              max={14}
              step={1}
              value={props().waveAmplitude}
              valueUnit="px"
              isDisabled={!props().wave}
              onChange={v => updateProp('waveAmplitude', v)}
            />
            <PreviewSwitch title="Glow" isChecked={props().glow} onChange={v => updateProp('glow', v)} />
            <PreviewSlider
              title="Reset After"
              min={0}
              max={3000}
              step={100}
              value={props().resetAfter}
              valueUnit="ms"
              onChange={v => updateProp('resetAfter', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={holdButton} componentName="HoldButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
