import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import TextPressure, { type TextPressureProps } from '@/content/TextAnimations/TextPressure/TextPressure';
import { textPressure } from '@/constants/code/TextAnimations/textPressureCode';

const ACCENT = '#ff5a1f';

const LOOK = {
  flex: true,
  width: true,
  weight: true,
  italic: true,
  alpha: false,
  stroke: false,
  scale: false,
  radius: 0.5,
  smoothing: 0.5,
  idle: 'wave',
  idleSpeed: 1,
  clickRipple: true,
  strokeWidth: 3,
  pressureColor: '',
  strokeColor: ACCENT
};

const PRESETS: Record<string, typeof LOOK> = {
  classic: { ...LOOK },
  heat: { ...LOOK, flex: false, italic: false, idle: 'pulse', pressureColor: ACCENT, radius: 0.4, smoothing: 0.3 },
  tall: { ...LOOK, scale: true, italic: false, idleSpeed: 1.4, radius: 0.3, smoothing: 0.65 },
  ghost: { ...LOOK, alpha: true, width: false, radius: 0.4, smoothing: 0.85, idleSpeed: 0.7 }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  text: 'Hello!',
  ...LOOK,
  textColor: ''
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'heat', label: 'Heat' },
  { value: 'tall', label: 'Tall' },
  { value: 'ghost', label: 'Ghost' }
];

const IDLE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'wave', label: 'Wave' },
  { value: 'pulse', label: 'Pulse' }
];

const propData: PropRow[] = [
  {
    name: 'text',
    type: 'string',
    default: '"Compressa"',
    description: 'Text content that will be displayed and animated.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: 'Roboto Flex',
    description: 'Name of the variable font family.'
  },
  {
    name: 'fontUrl',
    type: 'string',
    default: 'URL to Roboto Flex on Google Fonts',
    description: 'Stylesheet URL that loads the variable font. The font needs width, weight and italic axes.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: "'currentColor'",
    description: 'Fill color of the text. Follows the surrounding text color by default.'
  },
  {
    name: 'pressureColor',
    type: 'string',
    default: "''",
    description: 'Letters blend toward this color as they swell under pressure. Leave empty to keep one color.'
  },
  {
    name: 'strokeColor',
    type: 'string',
    default: '#FF0000',
    description: 'Color of the outline when stroke is on.'
  },
  {
    name: 'idle',
    type: "'none' | 'wave' | 'pulse'",
    default: "'none'",
    description:
      'What the letters do while the pointer is away. A wave rolls a swell across the word, a pulse makes it breathe in and out.'
  },
  {
    name: 'idleSpeed',
    type: 'number',
    default: '1',
    description: 'Speed of the idle wave or pulse. 2 plays it twice as fast.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '0.5',
    description:
      "How far the cursor's pull reaches, as a fraction of the text width. Also sets the length of the idle wave."
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.5',
    description: 'How softly the letters follow the cursor, from 0 for instant to 1 for a slow, floaty glide.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a wave of pressure rippling outward through the letters.'
  },
  {
    name: 'flex',
    type: 'boolean',
    default: 'true',
    description: 'Spreads the letters across the full width.'
  },
  {
    name: 'scale',
    type: 'boolean',
    default: 'false',
    description: 'Stretches the text vertically to fill the height of its container.'
  },
  {
    name: 'alpha',
    type: 'boolean',
    default: 'false',
    description: 'Fades letters out the further they are from the cursor.'
  },
  {
    name: 'stroke',
    type: 'boolean',
    default: 'false',
    description: 'Draws an outline behind each letter.'
  },
  {
    name: 'width',
    type: 'boolean',
    default: 'true',
    description: 'Varies the width axis of the font with pressure.'
  },
  {
    name: 'weight',
    type: 'boolean',
    default: 'true',
    description: 'Varies the weight axis of the font with pressure.'
  },
  {
    name: 'italic',
    type: 'boolean',
    default: 'true',
    description: 'Varies the italic axis of the font with pressure.'
  },
  {
    name: 'strokeWidth',
    type: 'number',
    default: '3',
    description: 'Width of the outline when stroke is on, in px. About half of it shows around the letters.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Additional class for styling the <h1> wrapper.'
  },
  {
    name: 'minFontSize',
    type: 'number',
    default: '24',
    description: 'Sets a minimum font-size to avoid overly tiny text on smaller screens.'
  }
];

export default function TextPressureDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, textColor: _textColor, pressureColor: _pressureColor, ...rest } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => {
    const { textColor, pressureColor } = props();
    return { ...(textColor ? { textColor } : {}), ...(pressureColor ? { pressureColor } : {}) };
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'textColor', 'pressureColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{ position: 'relative', height: '430px', overflow: 'hidden', 'margin-bottom': '24px' }}
          >
            <RefreshButton onClick={forceRerender} />
            <div style={{ width: '100%', height: '100%', 'min-height': 0 }}>
              <Keyed token={rerenderKey()}>
                {() => (
                  <TextPressure
                    {...(settings() as TextPressureProps)}
                    textColor={props().textColor || 'currentColor'}
                    pressureColor={props().pressureColor}
                    minFontSize={36}
                  />
                )}
              </Keyed>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />

            <PreviewInput
              title="Text"
              value={settings().text}
              placeholder="Your text here..."
              maxLength={10}
              onChange={v => updateProp('text', v)}
            />

            <PreviewColorPickerCustom
              title="Text Color"
              color={props().textColor || ink()}
              onChange={v => updateProp('textColor', v)}
            />

            <PreviewColorPickerCustom
              title="Pressure Color"
              color={props().pressureColor || ink()}
              onChange={v => updateProp('pressureColor', v)}
            />

            <PreviewColorPickerCustom
              title="Stroke Color"
              color={settings().strokeColor}
              onChange={v => updateProp('strokeColor', v)}
            />

            <PreviewSelect
              title="Idle"
              options={IDLE_OPTIONS}
              value={settings().idle}
              onChange={v => updateProp('idle', v)}
            />

            <PreviewSlider
              title="Idle Speed"
              min={0.2}
              max={3}
              step={0.1}
              value={settings().idleSpeed}
              valueUnit="x"
              isDisabled={settings().idle === 'none'}
              onChange={v => updateProp('idleSpeed', v)}
            />

            <PreviewSlider
              title="Radius"
              min={0.1}
              max={1.5}
              step={0.05}
              value={settings().radius}
              onChange={v => updateProp('radius', v)}
            />

            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={settings().smoothing}
              onChange={v => updateProp('smoothing', v)}
            />

            <PreviewSwitch
              title="Click Ripple"
              isChecked={settings().clickRipple}
              onChange={v => updateProp('clickRipple', v)}
            />

            <PreviewSlider
              title="Stroke Width"
              min={1}
              max={10}
              step={1}
              value={settings().strokeWidth}
              valueUnit="px"
              isDisabled={!settings().stroke}
              onChange={v => updateProp('strokeWidth', v)}
            />

            <PreviewSwitch title="Flex" isChecked={settings().flex} onChange={v => updateProp('flex', v)} />
            <PreviewSwitch title="Width" isChecked={settings().width} onChange={v => updateProp('width', v)} />
            <PreviewSwitch title="Weight" isChecked={settings().weight} onChange={v => updateProp('weight', v)} />
            <PreviewSwitch title="Italic" isChecked={settings().italic} onChange={v => updateProp('italic', v)} />
            <PreviewSwitch title="Alpha" isChecked={settings().alpha} onChange={v => updateProp('alpha', v)} />
            <PreviewSwitch title="Stroke" isChecked={settings().stroke} onChange={v => updateProp('stroke', v)} />
            <PreviewSwitch title="Scale" isChecked={settings().scale} onChange={v => updateProp('scale', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textPressure} componentName="TextPressure" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
