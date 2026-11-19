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

import FlipCard, { type FlipCardAxis } from '@/content/Micro/FlipCard/FlipCard';
import { flipCard } from '@/constants/code/Micro/flipCardCode';

const IMAGE =
  'https://images.unsplash.com/photo-1632231484562-3d2bed7e808d?q=80&w=1318&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const DEFAULT_PROPS = {
  axis: 'y',
  flipOnClick: true,
  draggable: true,
  dragDistance: 0,
  tilt: true,
  tiltMax: 12,
  glare: true,
  glareOpacity: 0.22,
  hoverScale: 1.03,
  perspective: 1100,
  stiffness: 170,
  damping: 20,
  width: 300,
  height: 400,
  radius: 22,
  background: '#27272a',
  color: '#f5f5f5',
  shadow: true,
  shadowColor: '#000000',
  shadowOpacity: 0.45,
  disabled: false
};

const AXIS_OPTIONS = [
  { value: 'y', label: 'Horizontal' },
  { value: 'x', label: 'Vertical' }
];

const Front = () => (
  <img
    src={IMAGE}
    alt="Wooded Landscape, 17th century"
    draggable="false"
    style={{ display: 'block', width: '100%', height: '100%', 'object-fit': 'cover' }}
  />
);

const Back = () => (
  <div style={{ position: 'relative', height: '100%', 'text-align': 'left' }}>
    <img
      src={IMAGE}
      alt=""
      draggable="false"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        'object-fit': 'cover',
        transform: 'scaleX(-1)',
        filter: 'grayscale(1) contrast(1.1)',
        opacity: 0.34
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(to bottom, var(--fc-bg) 0%, color-mix(in srgb, var(--fc-bg) 55%, transparent) 26%, transparent 46%, transparent 58%, color-mix(in srgb, var(--fc-bg) 60%, transparent) 80%, var(--fc-bg) 100%)'
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        'flex-direction': 'column',
        'justify-content': 'space-between',
        height: '100%',
        padding: '26px 28px',
        'box-sizing': 'border-box'
      }}
    >
      <span
        style={{
          'font-size': '27px',
          'font-weight': 500,
          'line-height': 1.1,
          'letter-spacing': '-0.03em',
          'white-space': 'nowrap'
        }}
      >
        Wooded Landscape
      </span>
      <div
        style={{
          display: 'flex',
          'align-items': 'baseline',
          'justify-content': 'space-between',
          gap: '16px',
          'font-size': '14px',
          'line-height': 1.2,
          'letter-spacing': '0.01em',
          opacity: 0.7
        }}
      >
        <span>17th century</span>
        <span>Rijksmuseum</span>
      </div>
    </div>
  </div>
);

const propData: PropRow[] = [
  { name: 'front', type: 'JSX.Element', default: 'null', description: 'Content of the front face.' },
  { name: 'back', type: 'JSX.Element', default: 'null', description: 'Content of the back face.' },
  {
    name: 'flipped',
    type: 'boolean',
    default: '-',
    description: 'Controlled state: true shows the back. Omit it to let the card manage itself.'
  },
  { name: 'defaultFlipped', type: 'boolean', default: 'false', description: 'Start on the back face.' },
  {
    name: 'onFlipChange',
    type: '(flipped: boolean) => void',
    default: '-',
    description: 'Fires when a click, drag, flick or key lands on the other face.'
  },
  {
    name: 'axis',
    type: "'y' | 'x'",
    default: "'y'",
    description: 'y turns the card sideways and drags horizontally. x turns it over the top and drags vertically.'
  },
  {
    name: 'flipOnClick',
    type: 'boolean',
    default: 'true',
    description: 'A press without movement flips the card.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description:
      'Drag to turn the card by hand. On release it springs to the nearest face, carrying the flick velocity.'
  },
  {
    name: 'dragDistance',
    type: 'number',
    default: '0',
    description: 'Pixels of drag for a half turn. 0 uses the card width, or its height on the x axis.'
  },
  { name: 'tilt', type: 'boolean', default: 'true', description: 'The card leans toward the cursor on hover.' },
  { name: 'tiltMax', type: 'number', default: '12', description: 'Largest tilt angle in degrees.' },
  { name: 'glare', type: 'boolean', default: 'true', description: 'A soft sheen that follows the cursor.' },
  { name: 'glareOpacity', type: 'number', default: '0.22', description: 'Strength of the sheen at its centre.' },
  { name: 'hoverScale', type: 'number', default: '1.03', description: 'Lift while hovered or held.' },
  {
    name: 'perspective',
    type: 'number',
    default: '1100',
    description: 'Viewing distance in px. Smaller is more dramatic.'
  },
  { name: 'stiffness', type: 'number', default: '170', description: 'Stiffness of the flip spring.' },
  {
    name: 'damping',
    type: 'number',
    default: '20',
    description: 'Damping of the flip spring. Lower overshoots more.'
  },
  { name: 'width', type: 'number', default: '300', description: 'Card width in px, capped at the parent.' },
  { name: 'height', type: 'number', default: '400', description: 'Card height in px.' },
  { name: 'radius', type: 'number', default: '22', description: 'Corner radius in px.' },
  { name: 'background', type: 'string', default: '"#27272a"', description: 'Surface of both faces.' },
  { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Text colour of both faces.' },
  {
    name: 'shadow',
    type: 'boolean',
    default: 'true',
    description: 'A soft shadow beneath the card that narrows as it turns edge on.'
  },
  { name: 'shadowColor', type: 'string', default: '"#000000"', description: 'Shadow colour.' },
  { name: 'shadowOpacity', type: 'number', default: '0.45', description: 'Shadow strength.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed, flat and inert.' },
  {
    name: 'ariaLabel',
    type: 'string',
    default: '"Flip card"',
    description: 'Accessible name. The face is carried by aria-pressed.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function FlipCardDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedBackground = useColorModeValue(
    () => (props().background === DEFAULT_PROPS.background ? '#f6f6f6' : props().background),
    () => props().background
  );
  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const renderedShadowOpacity = useColorModeValue(
    () => (props().shadowOpacity === DEFAULT_PROPS.shadowOpacity ? 0.2 : props().shadowOpacity),
    () => props().shadowOpacity
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
          <div class="demo-container" style={{ position: 'relative', height: '560px', overflow: 'hidden' }}>
            <FlipCard
              front={<Front />}
              back={<Back />}
              axis={props().axis as FlipCardAxis}
              flipOnClick={props().flipOnClick}
              draggable={props().draggable}
              dragDistance={props().dragDistance}
              tilt={props().tilt}
              tiltMax={props().tiltMax}
              glare={props().glare}
              glareOpacity={props().glareOpacity}
              hoverScale={props().hoverScale}
              perspective={props().perspective}
              stiffness={props().stiffness}
              damping={props().damping}
              width={props().width}
              height={props().height}
              radius={props().radius}
              background={renderedBackground()}
              color={renderedColor()}
              shadow={props().shadow}
              shadowColor={props().shadowColor}
              shadowOpacity={renderedShadowOpacity()}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={props().axis}
              onChange={v => updateProp('axis', v)}
              width={140}
            />
            <PreviewSwitch
              title="Flip On Click"
              isChecked={props().flipOnClick}
              onChange={v => updateProp('flipOnClick', v)}
            />
            <PreviewSwitch title="Draggable" isChecked={props().draggable} onChange={v => updateProp('draggable', v)} />
            <PreviewSlider
              title="Drag Distance"
              min={0}
              max={600}
              step={10}
              value={props().dragDistance}
              valueUnit="px"
              isDisabled={!props().draggable}
              onChange={v => updateProp('dragDistance', v)}
            />
            <PreviewSwitch title="Tilt" isChecked={props().tilt} onChange={v => updateProp('tilt', v)} />
            <PreviewSlider
              title="Tilt Max"
              min={0}
              max={30}
              step={1}
              value={props().tiltMax}
              valueUnit="°"
              isDisabled={!props().tilt}
              onChange={v => updateProp('tiltMax', v)}
            />
            <PreviewSwitch title="Glare" isChecked={props().glare} onChange={v => updateProp('glare', v)} />
            <PreviewSlider
              title="Glare Opacity"
              min={0}
              max={0.6}
              step={0.02}
              value={props().glareOpacity}
              isDisabled={!props().glare}
              onChange={v => updateProp('glareOpacity', v)}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.1}
              step={0.01}
              value={props().hoverScale}
              onChange={v => updateProp('hoverScale', v)}
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
            <PreviewSlider
              title="Stiffness"
              min={60}
              max={500}
              step={10}
              value={props().stiffness}
              onChange={v => updateProp('stiffness', v)}
            />
            <PreviewSlider
              title="Damping"
              min={6}
              max={50}
              step={1}
              value={props().damping}
              onChange={v => updateProp('damping', v)}
            />
            <PreviewSlider
              title="Width"
              min={180}
              max={380}
              step={10}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={220}
              max={460}
              step={10}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={48}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewColorPickerCustom title="Color" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewSwitch title="Shadow" isChecked={props().shadow} onChange={v => updateProp('shadow', v)} />
            <PreviewColorPickerCustom
              title="Shadow Color"
              color={props().shadowColor}
              onChange={v => updateProp('shadowColor', v)}
            />
            <PreviewSlider
              title="Shadow Opacity"
              min={0}
              max={1}
              step={0.05}
              value={renderedShadowOpacity()}
              isDisabled={!props().shadow}
              onChange={v => updateProp('shadowOpacity', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={flipCard} componentName="FlipCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
