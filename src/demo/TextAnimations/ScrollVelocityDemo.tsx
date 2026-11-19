import { createMemo } from 'solid-js';
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

import ScrollVelocity from '@/content/TextAnimations/ScrollVelocity/ScrollVelocity';
import { scrollVelocity } from '@/constants/code/TextAnimations/scrollVelocityCode';

const ACCENT = '#ff5a1f';

const LOOK = {
  velocity: 100,
  numCopies: 6,
  damping: 50,
  stiffness: 400,
  separator: '',
  fadeEdges: false,
  skewWithVelocity: 0,
  scaleWithVelocity: 0,
  outlineAlternate: false,
  gap: 0,
  fontSize: 80,
  fontWeight: 500,
  color: ''
};

const PRESETS: Record<string, typeof LOOK> = {
  classic: { ...LOOK },
  skew: {
    ...LOOK,
    velocity: 70,
    skewWithVelocity: 16,
    scaleWithVelocity: 0.18,
    fontSize: 104,
    fontWeight: 500,
    fadeEdges: true
  },
  outline: {
    ...LOOK,
    velocity: 50,
    outlineAlternate: true,
    skewWithVelocity: 6,
    separator: '/',
    gap: 24,
    fontSize: 120,
    fontWeight: 500,
    fadeEdges: true
  },
  ticker: {
    ...LOOK,
    velocity: 40,
    numCopies: 12,
    damping: 90,
    stiffness: 150,
    separator: '•',
    gap: 28,
    fontSize: 44,
    fontWeight: 500,
    color: ACCENT,
    fadeEdges: true
  }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'skew', label: 'Skew' },
  { value: 'outline', label: 'Outline' },
  { value: 'ticker', label: 'Ticker' }
];

const SEPARATOR_OPTIONS = [
  { value: '', label: 'None' },
  { value: '•', label: 'Dot' },
  { value: '/', label: 'Slash' },
  { value: '—', label: 'Dash' }
];

const WEIGHT_OPTIONS = [
  { value: 400, label: '400' },
  { value: 500, label: '500' },
  { value: 700, label: '700' },
  { value: 800, label: '800' },
  { value: 900, label: '900' }
];

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  draggable: true,
  pauseOnHover: false
};

const propData: PropRow[] = [
  {
    name: 'scrollContainerRef',
    type: 'HTMLElement | null',
    default: 'undefined',
    description: 'Optional element for a custom scroll container to track scroll position.'
  },
  {
    name: 'texts',
    type: 'JSX.Element[]',
    default: '[]',
    description:
      'Array of items to display as scrolling content. Accepts strings or any JSX. Pass elements as functions, like () => <Icon />, so every copy gets its own node.'
  },
  {
    name: 'velocity',
    type: 'number',
    default: '100',
    description: 'Base velocity for scrolling; sign is flipped for odd indexed texts.'
  },
  {
    name: 'color',
    type: 'string',
    default: 'undefined',
    description: 'Text color of the rows. Follows the surrounding text color when left out.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: 'undefined',
    description: 'Size of the row text. Numbers are pixels. Leave it out to use the stylesheet size.'
  },
  {
    name: 'fontWeight',
    type: 'number | string',
    default: 'undefined',
    description: 'Weight of the row text. Leave it out to use the stylesheet weight.'
  },
  {
    name: 'skewWithVelocity',
    type: 'number',
    default: '0',
    description:
      'How far the rows lean into their motion while you scroll or fling them, in degrees at full speed. Eases back to upright when they slow down.'
  },
  {
    name: 'scaleWithVelocity',
    type: 'number',
    default: '0',
    description:
      'How much the rows stretch taller at full speed, as a fraction of their height. Negative values squash them instead.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'false',
    description: 'Lets you grab a row to scrub it, then throw it to glide on with inertia.'
  },
  {
    name: 'outlineAlternate',
    type: 'boolean',
    default: 'false',
    description: 'Draws every other row as outlined text.'
  },
  {
    name: 'gap',
    type: 'number',
    default: '0',
    description: 'Extra space between the repeated copies in pixels, split evenly around the separator.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'CSS class applied to each text copy (span).'
  },
  {
    name: 'damping',
    type: 'number',
    default: '50',
    description: 'Damping value for the spring animation.'
  },
  {
    name: 'stiffness',
    type: 'number',
    default: '400',
    description: 'Stiffness value for the spring animation.'
  },
  {
    name: 'numCopies',
    type: 'number',
    default: '6',
    description: 'Number of copies of the text rendered for a continuous scrolling effect.'
  },
  {
    name: 'separator',
    type: 'JSX.Element',
    default: "''",
    description: 'Shown between the repeated copies, like a dot or a slash. Empty leaves just a space.'
  },
  {
    name: 'fadeEdges',
    type: 'boolean',
    default: 'false',
    description: 'Softly fades the rows out at the left and right edges.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Glides the rows to a stop while the pointer is over them.'
  },
  {
    name: 'velocityMapping',
    type: '{ input: number[]; output: number[] }',
    default: '{ input: [0, 1000], output: [0, 5] }',
    description: 'Mapping from scroll velocity to a movement multiplier for dynamic scrolling.'
  },
  {
    name: 'parallaxClassName',
    type: 'string',
    default: '"parallax"',
    description: 'CSS class for the parallax container.'
  },
  {
    name: 'scrollerClassName',
    type: 'string',
    default: '"scroller"',
    description: 'CSS class for the scroller container.'
  },
  {
    name: 'parallaxStyle',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles for the parallax container.'
  },
  {
    name: 'scrollerStyle',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles for the scroller container.'
  }
];

export default function ScrollVelocityDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, color: _color, ...rest } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => (props().color ? { color: props().color } : {}));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'color']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                'justify-content': 'center',
                'align-items': 'center'
              }}
            >
              <ScrollVelocity
                texts={['Solid Bits', 'Scroll Down']}
                {...settings()}
                color={props().color || undefined}
                className="custom-scroll-text"
              />
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={props().color || ink()}
              onChange={val => updateProp('color', val)}
            />
            <PreviewSlider
              title="Velocity"
              min={10}
              max={500}
              step={5}
              value={settings().velocity}
              onChange={val => updateProp('velocity', val)}
            />
            <PreviewSlider
              title="Skew"
              min={0}
              max={30}
              step={1}
              value={settings().skewWithVelocity}
              valueUnit="°"
              onChange={val => updateProp('skewWithVelocity', val)}
            />
            <PreviewSlider
              title="Stretch"
              min={-0.3}
              max={0.3}
              step={0.02}
              value={settings().scaleWithVelocity}
              onChange={val => updateProp('scaleWithVelocity', val)}
            />
            <PreviewSlider
              title="Damping"
              min={10}
              max={100}
              step={5}
              value={settings().damping}
              onChange={val => updateProp('damping', val)}
            />
            <PreviewSlider
              title="Stiffness"
              min={100}
              max={800}
              step={50}
              value={settings().stiffness}
              onChange={val => updateProp('stiffness', val)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings().draggable}
              onChange={val => updateProp('draggable', val)}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={settings().pauseOnHover}
              onChange={val => updateProp('pauseOnHover', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={24}
              max={160}
              step={2}
              value={settings().fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSelect
              title="Font Weight"
              options={WEIGHT_OPTIONS}
              value={settings().fontWeight}
              onChange={val => updateProp('fontWeight', Number(val))}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={120}
              step={4}
              value={settings().gap}
              valueUnit="px"
              onChange={val => updateProp('gap', val)}
            />
            <PreviewSlider
              title="Num Copies"
              min={2}
              max={12}
              step={1}
              value={settings().numCopies}
              onChange={val => updateProp('numCopies', val)}
            />
            <PreviewSelect
              title="Separator"
              options={SEPARATOR_OPTIONS}
              value={settings().separator}
              onChange={val => updateProp('separator', val)}
            />
            <PreviewSwitch
              title="Outline Alternate"
              isChecked={settings().outlineAlternate}
              onChange={val => updateProp('outlineAlternate', val)}
            />
            <PreviewSwitch
              title="Fade Edges"
              isChecked={settings().fadeEdges}
              onChange={val => updateProp('fadeEdges', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
          <div style={{ 'margin-bottom': '50vh' }} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollVelocity} componentName="ScrollVelocity" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
