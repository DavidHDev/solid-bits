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

import VoicePill, {
  type VoicePillMode,
  type VoicePillShape,
  type VoicePillSource
} from '@/content/Micro/VoicePill/VoicePill';
import { voicePill } from '@/constants/code/Micro/voicePillCode';

const DEFAULT_PROPS = {
  accentColor: '#f5f5f5',
  iconColor: '#a1a1aa',
  background: '#27272a',
  size: 40,
  shape: 'pill',
  reach: 12,
  showTime: true,
  waveform: true,
  slideToCancel: true,
  cancelDistance: 64,
  attack: 40,
  release: 240,
  sensitivity: 1,
  floor: 0.1,
  openDuration: 200,
  pressScale: 0.95,
  mode: 'auto',
  holdAfter: 300,
  reactive: 'simulated',
  disabled: false
};

const SHAPE_OPTIONS = [
  { value: 'pill', label: 'Pill' },
  { value: 'rounded', label: 'Rounded' }
];
const MODE_OPTIONS = [
  { value: 'auto', label: 'Tap or hold' },
  { value: 'hold', label: 'Hold only' },
  { value: 'toggle', label: 'Toggle' }
];
const SIGNAL_OPTIONS = [
  { value: 'simulated', label: 'Simulated' },
  { value: 'mic', label: 'Microphone' }
];

const propData: PropRow[] = [
  {
    name: 'accentColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The waveform, the clock and the stop mark.'
  },
  { name: 'iconColor', type: 'string', default: '"#a1a1aa"', description: 'The mic at rest, and the hover wash.' },
  {
    name: 'background',
    type: 'string',
    default: '"#27272a"',
    description: 'The capsule surface.'
  },
  {
    name: 'size',
    type: 'number',
    default: '28',
    description: 'Footprint in px. The icon, the stop mark and the clock scale with it.'
  },
  {
    name: 'shape',
    type: "'pill' | 'rounded'",
    default: "'pill'",
    description: 'A circle that opens into a capsule, or a rounded square.'
  },
  {
    name: 'reach',
    type: 'number',
    default: '8',
    description: 'The room the capsule leaves before the waveform, in px.'
  },
  {
    name: 'showTime',
    type: 'boolean',
    default: 'true',
    description: 'An elapsed clock in the capsule, which grows to the left to hold it.'
  },
  {
    name: 'waveform',
    type: 'boolean',
    default: 'true',
    description: 'A history of the level scrolling through the capsule, past the clock.'
  },
  {
    name: 'slideToCancel',
    type: 'boolean',
    default: 'true',
    description:
      'While held, sliding left drags the capsule contents along and reveals Cancel. Crossing the distance scatters the bars and stops without a result.'
  },
  {
    name: 'cancelDistance',
    type: 'number',
    default: '64',
    description: 'How far left a held pointer slides before it cancels, in px.'
  },
  {
    name: 'attack',
    type: 'number',
    default: '40',
    description: 'How fast the level rises to a louder signal, in ms.'
  },
  {
    name: 'release',
    type: 'number',
    default: '240',
    description: 'How long the level hangs after the sound drops, in ms.'
  },
  { name: 'sensitivity', type: 'number', default: '1', description: 'Gain on the signal before the envelope.' },
  {
    name: 'floor',
    type: 'number',
    default: '0.1',
    description: 'Waveform bar height when silent, as a fraction of its box.'
  },
  { name: 'openDuration', type: 'number', default: '200', description: 'The capsule open and close, in ms.' },
  {
    name: 'pressScale',
    type: 'number',
    default: '0.95',
    description: 'Scale of the button while a pointer is down.'
  },
  {
    name: 'mode',
    type: "'auto' | 'hold' | 'toggle'",
    default: "'auto'",
    description:
      'Auto: a tap latches, a hold stops on release. Hold: release always stops. Toggle: release never stops.'
  },
  {
    name: 'holdAfter',
    type: 'number',
    default: '300',
    description: 'In auto, the press length after which a release stops instead of latching, in ms.'
  },
  {
    name: 'reactive',
    type: "'simulated' | 'mic'",
    default: "'simulated'",
    description:
      'What drives the level. Mic asks for microphone permission on the first press and stops if it is refused.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed and inert. A listening pill stops.' },
  {
    name: 'ariaLabel',
    type: 'string',
    default: '"Dictate"',
    description: 'Accessible name. The state is carried by aria-pressed.'
  },
  {
    name: 'onStart',
    type: '({ source }) => void',
    default: '-',
    description: 'Listening began, with the requested source.'
  },
  {
    name: 'onStop',
    type: '({ reason, duration }) => void',
    default: '-',
    description:
      'Listening ended. Reason is release, tap, key, escape, blur, cancel, disabled, mic-denied or unmount; duration in ms.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the button.' }
];

export default function VoicePillDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedAccent = useColorModeValue(
    () => (props().accentColor === DEFAULT_PROPS.accentColor ? '#18181b' : props().accentColor),
    () => props().accentColor
  );
  const renderedIcon = useColorModeValue(
    () => (props().iconColor === DEFAULT_PROPS.iconColor ? '#71717a' : props().iconColor),
    () => props().iconColor
  );
  const renderedBackground = useColorModeValue(
    () => (props().background === DEFAULT_PROPS.background ? '#f6f6f6' : props().background),
    () => props().background
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
            <VoicePill
              accentColor={renderedAccent()}
              iconColor={renderedIcon()}
              background={renderedBackground()}
              size={props().size}
              shape={props().shape as VoicePillShape}
              reach={props().reach}
              showTime={props().showTime}
              waveform={props().waveform}
              slideToCancel={props().slideToCancel}
              cancelDistance={props().cancelDistance}
              attack={props().attack}
              release={props().release}
              sensitivity={props().sensitivity}
              floor={props().floor}
              openDuration={props().openDuration}
              pressScale={props().pressScale}
              mode={props().mode as VoicePillMode}
              holdAfter={props().holdAfter}
              reactive={props().reactive as VoicePillSource}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom title="Icon" color={renderedIcon()} onChange={v => updateProp('iconColor', v)} />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewSlider
              title="Size"
              min={24}
              max={64}
              step={2}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={props().shape}
              onChange={(v: string) => updateProp('shape', v)}
              width={130}
            />
            <PreviewSlider
              title="Reach"
              min={0}
              max={20}
              step={1}
              value={props().reach}
              valueUnit="px"
              onChange={v => updateProp('reach', v)}
            />
            <PreviewSwitch title="Show Time" isChecked={props().showTime} onChange={v => updateProp('showTime', v)} />
            <PreviewSwitch title="Waveform" isChecked={props().waveform} onChange={v => updateProp('waveform', v)} />
            <PreviewSwitch
              title="Slide To Cancel"
              isChecked={props().slideToCancel}
              onChange={v => updateProp('slideToCancel', v)}
            />
            <PreviewSlider
              title="Cancel Distance"
              min={32}
              max={160}
              step={4}
              value={props().cancelDistance}
              valueUnit="px"
              isDisabled={!props().slideToCancel}
              onChange={v => updateProp('cancelDistance', v)}
            />
            <PreviewSlider
              title="Attack"
              min={5}
              max={200}
              step={5}
              value={props().attack}
              valueUnit="ms"
              onChange={v => updateProp('attack', v)}
            />
            <PreviewSlider
              title="Release"
              min={60}
              max={900}
              step={10}
              value={props().release}
              valueUnit="ms"
              onChange={v => updateProp('release', v)}
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
              title="Quiet Height"
              min={0}
              max={0.5}
              step={0.05}
              value={props().floor}
              onChange={v => updateProp('floor', v)}
            />
            <PreviewSlider
              title="Open"
              min={120}
              max={320}
              step={10}
              value={props().openDuration}
              valueUnit="ms"
              onChange={v => updateProp('openDuration', v)}
            />
            <PreviewSlider
              title="Press Scale"
              min={0.88}
              max={1}
              step={0.01}
              value={props().pressScale}
              onChange={v => updateProp('pressScale', v)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={props().mode}
              onChange={(v: string) => updateProp('mode', v)}
              width={150}
            />
            <PreviewSlider
              title="Hold After"
              min={100}
              max={800}
              step={50}
              value={props().holdAfter}
              valueUnit="ms"
              isDisabled={props().mode !== 'auto'}
              onChange={v => updateProp('holdAfter', v)}
            />
            <PreviewSelect
              title="Signal"
              options={SIGNAL_OPTIONS}
              value={props().reactive}
              onChange={(v: string) => updateProp('reactive', v)}
              width={150}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={voicePill} componentName="VoicePill" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
