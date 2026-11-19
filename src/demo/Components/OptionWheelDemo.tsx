import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { isLight } from '@/hooks/useTheme';

import OptionWheel, { type OptionWheelProps } from '@/content/Components/OptionWheel/OptionWheel';
import { optionWheel } from '@/constants/code/Components/optionWheelCode';

const SOUND_URL = '/assets/sounds/click-soft.mp3';

const DEFAULT_PROPS = {
  textColor: '#a6a6a6',
  activeColor: '#ffffff',
  side: 'left',
  fontSize: 3,
  spacing: 1.4,
  curve: 1,
  tilt: 6,
  blur: 2,
  fade: 0.25,
  smoothing: 200,
  inset: 80,
  loop: false,
  draggable: true,
  soundUrl: SOUND_URL,
  soundVolume: 0.5
};

const DEMO_ITEMS = [
  'Ambient',
  'House',
  'Techno',
  'Jazz',
  'Lo-Fi',
  'Synthwave',
  'Trance',
  'Funk',
  'Disco',
  'Hip-Hop',
  'Chillwave',
  'Drum & Bass'
];

const SIDE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const propData: PropRow[] = [
  { name: 'items', type: 'string[]', default: '[...]', description: 'Labels rendered as the wheel options.' },
  { name: 'defaultSelected', type: 'number', default: '3', description: 'Index of the option selected on mount.' },
  {
    name: 'onChange',
    type: '(index, item) => void',
    default: '-',
    description: 'Called whenever the wheel settles on a new option.'
  },
  { name: 'textColor', type: 'string', default: '"#a6a6a6"', description: 'Resting color of the option labels.' },
  {
    name: 'activeColor',
    type: 'string',
    default: '"#ffffff"',
    description: 'Color an option blends toward as it reaches the middle of the wheel.'
  },
  {
    name: 'side',
    type: '"left" | "right"',
    default: '"left"',
    description: 'Edge of the container the wheel curves around.'
  },
  { name: 'fontSize', type: 'number', default: '3', description: 'Font size of the option labels in rem.' },
  {
    name: 'spacing',
    type: 'number',
    default: '1.4',
    description: 'Vertical distance between options as a multiple of the font size.'
  },
  {
    name: 'curve',
    type: 'number',
    default: '1',
    description: 'Depth of the circular curve; 0 flattens the wheel into a straight list.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '6',
    description: 'Angle in degrees between neighboring options; higher values curl the wheel tighter.'
  },
  { name: 'blur', type: 'number', default: '2', description: 'Blur in pixels added per step away from the middle.' },
  { name: 'fade', type: 'number', default: '0.25', description: 'Opacity lost per step away from the middle.' },
  { name: 'minOpacity', type: 'number', default: '0.05', description: 'Opacity floor for the furthest options.' },
  {
    name: 'smoothing',
    type: 'number',
    default: '200',
    description: 'Easing time constant in milliseconds; higher values feel heavier.'
  },
  {
    name: 'inset',
    type: 'number',
    default: '80',
    description: 'Padding in pixels between the anchored edge and the centered option.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'Wrap around infinitely instead of stopping at the first and last option.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Allow dragging the wheel with a pointer, in addition to scroll and arrow keys.'
  },
  {
    name: 'soundUrl',
    type: 'string',
    default: '""',
    description: 'URL of a short tick sound played when the selection changes; empty disables it.'
  },
  { name: 'soundVolume', type: 'number', default: '0.5', description: 'Playback volume of the tick sound.' },
  { name: 'className', type: 'string', default: '""', description: 'Additional CSS classes for the outer wrapper.' }
];

export default function OptionWheelDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const renderedTextColor = createMemo(() => {
    const value = props().textColor;
    return isLight() && value === DEFAULT_PROPS.textColor ? '#71717a' : value;
  });
  const renderedActiveColor = createMemo(() => {
    const value = props().activeColor;
    return isLight() && value === DEFAULT_PROPS.activeColor ? '#18181b' : value;
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <OptionWheel
              {...(props() as OptionWheelProps)}
              items={DEMO_ITEMS}
              textColor={renderedTextColor()}
              activeColor={renderedActiveColor()}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Text"
              color={renderedTextColor()}
              onChange={v => updateProp('textColor', v)}
            />
            <PreviewColorPickerCustom
              title="Active"
              color={renderedActiveColor()}
              onChange={v => updateProp('activeColor', v)}
            />
            <PreviewSelect
              title="Side"
              options={SIDE_OPTIONS}
              value={props().side}
              onChange={v => updateProp('side', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={1.5}
              max={5}
              step={0.1}
              value={props().fontSize}
              valueUnit="rem"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Spacing"
              min={1}
              max={2.5}
              step={0.05}
              value={props().spacing}
              onChange={v => updateProp('spacing', v)}
            />
            <PreviewSlider
              title="Curve"
              min={0}
              max={2}
              step={0.05}
              value={props().curve}
              onChange={v => updateProp('curve', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={15}
              step={0.5}
              value={props().tilt}
              valueUnit="deg"
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={6}
              step={0.25}
              value={props().blur}
              valueUnit="px"
              onChange={v => updateProp('blur', v)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={0.5}
              step={0.01}
              value={props().fade}
              onChange={v => updateProp('fade', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={50}
              max={800}
              step={10}
              value={props().smoothing}
              valueUnit="ms"
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSlider
              title="Inset"
              min={0}
              max={240}
              step={4}
              value={props().inset}
              valueUnit="px"
              onChange={v => updateProp('inset', v)}
            />
            <PreviewSlider
              title="Sound Volume"
              min={0}
              max={1}
              step={0.05}
              value={props().soundVolume}
              onChange={v => updateProp('soundVolume', v)}
            />
            <PreviewSwitch title="Loop" isChecked={props().loop} onChange={v => updateProp('loop', v)} />
            <PreviewSwitch title="Draggable" isChecked={props().draggable} onChange={v => updateProp('draggable', v)} />
            <PreviewSwitch
              title="Sound"
              isChecked={!!props().soundUrl}
              onChange={v => updateProp('soundUrl', v ? SOUND_URL : '')}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={optionWheel} componentName="OptionWheel" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
