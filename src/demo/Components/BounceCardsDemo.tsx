import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';

import BounceCards from '@/content/Components/BounceCards/BounceCards';
import { bounceCards } from '@/constants/code/Components/bounceCardsCode';

const IMAGES = [
  '1724152312974-d4d48b8b36fd',
  '1762846818262-33c197852fa8',
  '1721407964262-f9864b562453',
  '1776394254711-4a0d7345269a',
  '1763440519433-5467759054fc'
].map(id => `https://images.unsplash.com/photo-${id}?w=480&h=480&q=80&auto=format&fit=crop`);

const DEFAULT_PROPS = {
  preset: 'fan',
  cardSize: 200,
  spread: 85,
  rotation: 10,
  arc: 0,
  pushDistance: 160,
  hoverScale: 1.06,
  bounciness: 0.6,
  animationDelay: 0.5,
  animationStagger: 0.06,
  borderWidth: 5,
  borderColor: '#ffffff',
  radius: 25,
  shadow: true,
  enableHover: true
};

type DemoProps = typeof DEFAULT_PROPS;

const PRESETS: Record<string, Partial<DemoProps>> = {
  fan: {},
  pile: { spread: 26, rotation: 14, pushDistance: 130 },
  row: { spread: 118, rotation: 0, pushDistance: 70, cardSize: 150, radius: 16, borderWidth: 0 },
  arc: { arc: 38, rotation: 12, spread: 92 },
  polaroid: { radius: 4, borderWidth: 10, rotation: 8, cardSize: 180 }
};

const PRESET_OPTIONS = [
  { value: 'fan', label: 'Fan' },
  { value: 'pile', label: 'Pile' },
  { value: 'row', label: 'Row' },
  { value: 'arc', label: 'Arc' },
  { value: 'polaroid', label: 'Polaroid' }
];

const propData: PropRow[] = [
  {
    name: 'images',
    type: 'Array<string | { src: string; alt?: string }>',
    default: '[]',
    description: 'Images for the cards, from left to right.'
  },
  { name: 'containerWidth', type: 'number', default: '400', description: 'Width of the container in pixels.' },
  { name: 'containerHeight', type: 'number', default: '400', description: 'Height of the container in pixels.' },
  { name: 'cardSize', type: 'number', default: '200', description: 'Width and height of each card in pixels.' },
  { name: 'spread', type: 'number', default: '85', description: 'Horizontal distance between cards in pixels.' },
  {
    name: 'rotation',
    type: 'number',
    default: '10',
    description: 'Largest tilt in degrees. Each card leans by a different share of it, like a loose pile.'
  },
  {
    name: 'arc',
    type: 'number',
    default: '0',
    description: 'Drops the outer cards by this many pixels so the fan curves. Negative values curve it up.'
  },
  {
    name: 'pushDistance',
    type: 'number',
    default: '160',
    description: 'How far the other cards slide away from the hovered one, in pixels.'
  },
  {
    name: 'hoverScale',
    type: 'number',
    default: '1.06',
    description: 'Scale of the hovered card as it straightens and comes to the front.'
  },
  {
    name: 'bounciness',
    type: 'number',
    default: '0.6',
    description: 'How much the cards overshoot as they pop in, from 0 to 1.'
  },
  {
    name: 'animationDelay',
    type: 'number',
    default: '0.5',
    description: 'Seconds before the first card pops in.'
  },
  { name: 'animationStagger', type: 'number', default: '0.06', description: 'Seconds between cards popping in.' },
  { name: 'enableHover', type: 'boolean', default: 'true', description: 'Spreads the cards apart on hover.' },
  { name: 'borderWidth', type: 'number', default: '5', description: 'Width of the card border in pixels.' },
  { name: 'borderColor', type: 'string', default: "'#ffffff'", description: 'Color of the card border.' },
  { name: 'radius', type: 'number', default: '25', description: 'Corner radius of the cards in pixels.' },
  { name: 'shadow', type: 'boolean', default: 'true', description: 'Soft drop shadow that deepens on hover.' },
  {
    name: 'onCardClick',
    type: '(index: number) => void',
    default: '-',
    description: 'Called with the card index on click or Enter. Cards become focusable buttons when it is set.'
  },
  {
    name: 'transformStyles',
    type: 'string[]',
    default: '-',
    description:
      'Optional custom positions such as "rotate(5deg) translate(-150px)". Overrides spread, rotation and arc.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function BounceCardsDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              display: 'flex',
              'justify-content': 'center',
              'align-items': 'center',
              'min-height': '500px',
              overflow: 'hidden'
            }}
          >
            <Keyed token={rerenderKey()}>
              {() => <BounceCards images={IMAGES} containerWidth={500} containerHeight={320} {...settings()} />}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Card Size"
              min={100}
              max={260}
              step={5}
              value={settings().cardSize}
              valueUnit="px"
              onChange={v => updateProp('cardSize', v)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={150}
              step={1}
              value={settings().spread}
              valueUnit="px"
              onChange={v => updateProp('spread', v)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={25}
              step={1}
              value={settings().rotation}
              valueUnit="°"
              onChange={v => updateProp('rotation', v)}
            />
            <PreviewSlider
              title="Arc"
              min={-60}
              max={60}
              step={1}
              value={settings().arc}
              valueUnit="px"
              onChange={v => updateProp('arc', v)}
            />
            <PreviewSlider
              title="Push Distance"
              min={0}
              max={240}
              step={5}
              value={settings().pushDistance}
              valueUnit="px"
              onChange={v => updateProp('pushDistance', v)}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.25}
              step={0.01}
              value={settings().hoverScale}
              onChange={v => updateProp('hoverScale', v)}
            />
            <PreviewSlider
              title="Bounciness"
              min={0}
              max={1}
              step={0.05}
              value={settings().bounciness}
              onChange={v => {
                updateProp('bounciness', v);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Delay"
              min={0}
              max={2}
              step={0.1}
              value={settings().animationDelay}
              valueUnit="s"
              onChange={v => {
                updateProp('animationDelay', v);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.3}
              step={0.01}
              value={settings().animationStagger}
              valueUnit="s"
              onChange={v => {
                updateProp('animationStagger', v);
                forceRerender();
              }}
            />
            <PreviewSlider
              title="Border Width"
              min={0}
              max={14}
              step={1}
              value={settings().borderWidth}
              valueUnit="px"
              onChange={v => updateProp('borderWidth', v)}
            />
            <PreviewColorPickerCustom
              title="Border Color"
              color={settings().borderColor}
              onChange={v => updateProp('borderColor', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={60}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSwitch title="Shadow" isChecked={settings().shadow} onChange={v => updateProp('shadow', v)} />
            <PreviewSwitch
              title="Hover"
              isChecked={settings().enableHover}
              onChange={v => updateProp('enableHover', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={bounceCards} componentName="BounceCards" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
