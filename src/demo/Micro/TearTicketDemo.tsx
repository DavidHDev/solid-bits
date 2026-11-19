import { Show, createSignal } from 'solid-js';
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
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import TearTicket, { type TearTicketOrientation } from '@/content/Micro/TearTicket/TearTicket';
import { tearTicket } from '@/constants/code/Micro/tearTicketCode';

const IMAGE =
  'https://images.unsplash.com/photo-1604852961945-155837ffebe2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const DEFAULT_PROPS = {
  orientation: 'horizontal',
  scrim: false,
  width: 460,
  height: 250,
  stubSize: 150,
  radius: 16,
  holes: 12,
  holeSize: 6,
  notch: 3,
  roughness: 0,
  tearAngle: 30,
  stretch: 30,
  resistance: 0.45,
  rotate: 4,
  tilt: true,
  tiltMax: 9,
  tiltReach: 260,
  parallax: 6,
  perspective: 1000,
  background: '#27272a',
  color: '#f5f5f5',
  border: true,
  borderColor: '',
  borderWidth: 1,
  recenter: true,
  disabled: false
};

const ORIENTATION_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];
const SIZES: Record<TearTicketOrientation, { width: number; height: number; stubSize: number }> = {
  horizontal: { width: 460, height: 250, stubSize: 150 },
  vertical: { width: 300, height: 440, stubSize: 130 }
};

const PAD = '24px';

function Face() {
  return (
    <div
      style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        gap: '14px',
        height: '100%',
        'padding-top': 'calc(var(--tt-body-h) * var(--tt-span) - var(--tt-inset))',
        'padding-right': PAD,
        'padding-left': PAD,
        'box-sizing': 'border-box'
      }}
    >
      <span style={{ 'font-size': '15px', 'font-weight': 500, 'line-height': 1, 'letter-spacing': '-0.01em' }}>
        Spectrum
      </span>
      <span style={{ 'font-size': '13px', 'line-height': 1, opacity: 0.45 }}>14 Nov</span>
    </div>
  );
}

function Details() {
  return (
    <div style={{ display: 'flex', 'flex-direction': 'column' }}>
      <span style={{ 'font-size': '17px', 'font-weight': 500, 'line-height': 1.2, 'letter-spacing': '-0.01em' }}>
        Admit one
      </span>
      <span style={{ 'margin-top': '8px', 'font-size': '12px', 'line-height': 1.55, opacity: 0.5 }}>
        Rooftop gallery
        <br />
        Until 30 Nov
      </span>
    </div>
  );
}

function Stub(props: { vertical: boolean }) {
  return (
    <Show when={props.vertical} fallback={<HorizontalStub />}>
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          'justify-content': 'space-between',
          height: '100%',
          'padding-top': '32px',
          'padding-right': PAD,
          'padding-bottom': '30px',
          'padding-left': PAD,
          'box-sizing': 'border-box',
          'text-align': 'left'
        }}
      >
        <span style={{ 'font-size': '17px', 'font-weight': 500, 'line-height': 1, 'letter-spacing': '-0.01em' }}>
          Admit one
        </span>
        <div style={{ display: 'flex', 'align-items': 'flex-end', 'justify-content': 'space-between', gap: '14px' }}>
          <span style={{ 'font-size': '12px', 'line-height': 1, opacity: 0.5 }}>Rooftop gallery · Until 30 Nov</span>
          <span
            style={{ 'font-size': '13px', 'line-height': 1, opacity: 0.45, 'font-variant-numeric': 'tabular-nums' }}
          >
            No. 284619
          </span>
        </div>
      </div>
    </Show>
  );
}

function HorizontalStub() {
  return (
    <div style={{ position: 'relative', height: '100%', 'text-align': 'left' }}>
      <div style={{ padding: '30px 20px 0 26px' }}>
        <Details />
      </div>
      <span
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '26px',
          'line-height': 1,
          'font-size': '13px',
          opacity: 0.45,
          'font-variant-numeric': 'tabular-nums'
        }}
      >
        No. 284619
      </span>
    </div>
  );
}

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: 'null', description: 'Content of the ticket body.' },
  { name: 'stub', type: 'JSX.Element', default: 'null', description: 'Content of the tear-off stub.' },
  {
    name: 'image',
    type: 'string',
    default: '""',
    description: 'Artwork behind the body. It shifts against the tilt for parallax and turns grey once used.'
  },
  { name: 'imageAlt', type: 'string', default: '""', description: 'Alt text for the artwork.' },
  {
    name: 'scrim',
    type: 'boolean',
    default: 'true',
    description: 'A fade from the paper colour up over the artwork, so text stays readable on busy images.'
  },
  {
    name: 'imageRadius',
    type: 'number',
    default: '8',
    description: 'Corner radius of the artwork panel, in px. Set it to the ticket radius minus 8 to stay concentric.'
  },
  {
    name: 'orientation',
    type: "'horizontal' | 'vertical'",
    default: "'horizontal'",
    description: 'Horizontal puts the stub on the right. Vertical puts the artwork on top and the stub at the bottom.'
  },
  {
    name: 'torn',
    type: 'boolean',
    default: '-',
    description: 'Controlled state. Set it back to false to restore the stub.'
  },
  { name: 'defaultTorn', type: 'boolean', default: 'false', description: 'Start already used.' },
  { name: 'onTear', type: '() => void', default: '-', description: 'Fires once the stub has come free and gone.' },
  {
    name: 'width',
    type: 'number',
    default: '460',
    description: 'Ticket width in px. It scales down to fit a narrower parent.'
  },
  { name: 'height', type: 'number', default: '250', description: 'Ticket height in px.' },
  {
    name: 'stubSize',
    type: 'number',
    default: '150',
    description: 'Size of the stub along the ticket, in px: its width when horizontal, its height when vertical.'
  },
  { name: 'radius', type: 'number', default: '16', description: 'Outer corner radius in px.' },
  {
    name: 'holes',
    type: 'number',
    default: '12',
    description: 'Perforation holes along the tear line.'
  },
  { name: 'holeSize', type: 'number', default: '6', description: 'Hole diameter in px.' },
  {
    name: 'notch',
    type: 'number',
    default: '3',
    description: 'Radius of the notches at both ends of the tear line.'
  },
  {
    name: 'roughness',
    type: 'number',
    default: '0',
    description:
      'Optional jitter of the torn line between holes, in px. 0 keeps the edge perfectly straight and symmetrical.'
  },
  {
    name: 'tearAngle',
    type: 'number',
    default: '30',
    description: 'Degrees of pull at which the last bridge gives way and the stub comes free.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '30',
    description: 'How far a paper bridge stretches before it snaps, in px. Bridges far from the hinge reach it first.'
  },
  {
    name: 'resistance',
    type: 'number',
    default: '0.45',
    description:
      'How much the intact fibres hold the stub back, 0 to 1. The pull eases as bridges give way, so the paper fights hardest at the start.'
  },
  {
    name: 'rotate',
    type: 'number',
    default: '4',
    description: 'A resting tilt of the whole ticket in the page plane, in degrees.'
  },
  { name: 'tilt', type: 'boolean', default: 'true', description: 'The ticket leans toward the cursor in 3D.' },
  { name: 'tiltMax', type: 'number', default: '9', description: 'Largest tilt angle in degrees.' },
  {
    name: 'tiltReach',
    type: 'number',
    default: '260',
    description: 'How far beyond the ticket the pointer still steers the tilt, in px. The tilt tracks the whole page.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '6',
    description: 'How far the artwork travels against the tilt, in px.'
  },
  { name: 'perspective', type: 'number', default: '1000', description: 'Viewing distance in px.' },
  {
    name: 'background',
    type: 'string',
    default: '"#27272a"',
    description: 'Paper colour, also used by the fibres.'
  },
  { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Text colour.' },
  {
    name: 'border',
    type: 'boolean',
    default: 'true',
    description: 'A hairline drawn along the cut edge of each piece, following every hole and notch.'
  },
  {
    name: 'borderColor',
    type: 'string',
    default: '""',
    description: 'Colour of that hairline. Empty derives a faint tint of the text colour.'
  },
  { name: 'borderWidth', type: 'number', default: '1', description: 'Thickness of the hairline in px.' },
  {
    name: 'stubBackground',
    type: 'string',
    default: '""',
    description: 'Stub paper colour. Empty follows background.'
  },
  {
    name: 'recenter',
    type: 'boolean',
    default: 'true',
    description: 'Once the stub is gone, the remaining ticket glides over to sit centred in its original box.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed and inert.' },
  {
    name: 'ariaLabel',
    type: 'string',
    default: '"Tear off the stub"',
    description: 'Accessible name of the stub. Enter or Space tears it.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function TearTicketDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [run, setRun] = createSignal(0);

  const renderedBackground = useColorModeValue(
    () => (props().background === DEFAULT_PROPS.background ? '#f6f6f6' : props().background),
    () => props().background
  );
  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const orientation = () => props().orientation as TearTicketOrientation;
  const innerRadius = () => Math.max(0, props().radius - 8);
  const remount = () => {
    setRun(r => r + 1);
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
          <div class="demo-container" style={{ position: 'relative', height: '560px', overflow: 'hidden' }}>
            <RefreshButton onClick={remount} />
            <Keyed token={run()}>
              {() => (
                <TearTicket
                  image={IMAGE}
                  imageAlt="Visitors in a walkway of coloured glass"
                  stub={<Stub vertical={orientation() === 'vertical'} />}
                  orientation={orientation()}
                  scrim={props().scrim}
                  imageRadius={innerRadius()}
                  width={props().width}
                  height={props().height}
                  stubSize={props().stubSize}
                  radius={props().radius}
                  holes={props().holes}
                  holeSize={props().holeSize}
                  notch={props().notch}
                  roughness={props().roughness}
                  tearAngle={props().tearAngle}
                  stretch={props().stretch}
                  resistance={props().resistance}
                  rotate={props().rotate}
                  tilt={props().tilt}
                  tiltMax={props().tiltMax}
                  tiltReach={props().tiltReach}
                  parallax={props().parallax}
                  perspective={props().perspective}
                  background={renderedBackground()}
                  color={renderedColor()}
                  border={props().border}
                  borderColor={props().borderColor}
                  borderWidth={props().borderWidth}
                  recenter={props().recenter}
                  disabled={props().disabled}
                >
                  <Face />
                </TearTicket>
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={props().orientation}
              onChange={(v: TearTicketOrientation) => {
                updateProps({ orientation: v, ...(SIZES[v] ?? SIZES.horizontal) });
                remount();
              }}
              width={150}
            />
            <PreviewSwitch title="Scrim" isChecked={props().scrim} onChange={v => updateProp('scrim', v)} />
            <PreviewSlider
              title="Width"
              min={220}
              max={560}
              step={10}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={140}
              max={460}
              step={10}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Stub Size"
              min={70}
              max={180}
              step={2}
              value={props().stubSize}
              valueUnit="px"
              onChange={v => updateProp('stubSize', v)}
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
              title="Holes"
              min={6}
              max={44}
              step={1}
              value={props().holes}
              onChange={v => updateProp('holes', v)}
            />
            <PreviewSlider
              title="Hole Size"
              min={1}
              max={8}
              step={0.2}
              value={props().holeSize}
              valueUnit="px"
              onChange={v => updateProp('holeSize', v)}
            />
            <PreviewSlider
              title="Notch"
              min={0}
              max={16}
              step={1}
              value={props().notch}
              valueUnit="px"
              onChange={v => updateProp('notch', v)}
            />
            <PreviewSlider
              title="Roughness"
              min={0}
              max={3}
              step={0.1}
              value={props().roughness}
              valueUnit="px"
              onChange={v => updateProp('roughness', v)}
            />
            <PreviewSlider
              title="Tear Angle"
              min={12}
              max={60}
              step={1}
              value={props().tearAngle}
              valueUnit="°"
              onChange={v => updateProp('tearAngle', v)}
            />
            <PreviewSlider
              title="Stretch"
              min={2}
              max={60}
              step={1}
              value={props().stretch}
              valueUnit="px"
              onChange={v => updateProp('stretch', v)}
            />
            <PreviewSlider
              title="Resistance"
              min={0}
              max={0.9}
              step={0.05}
              value={props().resistance}
              onChange={v => updateProp('resistance', v)}
            />
            <PreviewSlider
              title="Rotate"
              min={-20}
              max={20}
              step={1}
              value={props().rotate}
              valueUnit="°"
              onChange={v => updateProp('rotate', v)}
            />
            <PreviewSwitch title="Tilt" isChecked={props().tilt} onChange={v => updateProp('tilt', v)} />
            <PreviewSlider
              title="Tilt Max"
              min={0}
              max={24}
              step={1}
              value={props().tiltMax}
              valueUnit="°"
              isDisabled={!props().tilt}
              onChange={v => updateProp('tiltMax', v)}
            />
            <PreviewSlider
              title="Tilt Reach"
              min={0}
              max={700}
              step={20}
              value={props().tiltReach}
              valueUnit="px"
              isDisabled={!props().tilt}
              onChange={v => updateProp('tiltReach', v)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={32}
              step={1}
              value={props().parallax}
              valueUnit="px"
              isDisabled={!props().tilt}
              onChange={v => updateProp('parallax', v)}
            />
            <PreviewSlider
              title="Perspective"
              min={400}
              max={2400}
              step={50}
              value={props().perspective}
              valueUnit="px"
              onChange={v => updateProp('perspective', v)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewColorPickerCustom title="Color" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewSwitch title="Border" isChecked={props().border} onChange={v => updateProp('border', v)} />
            <PreviewSlider
              title="Border Width"
              min={0.5}
              max={4}
              step={0.5}
              value={props().borderWidth}
              valueUnit="px"
              isDisabled={!props().border}
              onChange={v => updateProp('borderWidth', v)}
            />
            <PreviewSwitch title="Recenter" isChecked={props().recenter} onChange={v => updateProp('recenter', v)} />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={tearTicket} componentName="TearTicket" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
