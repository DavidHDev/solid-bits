import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import BackgroundContent from '@/components/common/BackgroundContent';
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
import { isLight } from '@/hooks/useTheme';

import DotField, { type DotFieldProps, type Pattern } from '@/content/Backgrounds/DotField/DotField';
import { dotField } from '@/constants/code/Backgrounds/dotFieldCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/DotField';

const PATTERN_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'hex', label: 'Hex' },
  { value: 'spiral', label: 'Spiral' },
  { value: 'scatter', label: 'Scatter' }
];

const propData: PropRow[] = [
  { name: 'dotRadius', type: 'number', default: '1.5', description: 'Radius of each dot in pixels.' },
  { name: 'dotSpacing', type: 'number', default: '14', description: 'Gap between neighbouring dots in pixels.' },
  {
    name: 'pattern',
    type: "'grid' | 'hex' | 'spiral' | 'scatter'",
    default: "'grid'",
    description: 'How the dots are laid out: square rows, offset honeycomb rows, a sunflower spiral or a loose scatter.'
  },
  { name: 'gradientFrom', type: 'string', default: "'#0aa0ef'", description: 'Color the gradient starts from.' },
  { name: 'gradientTo', type: 'string', default: "'#6ec9f7'", description: 'Color the gradient ends on.' },
  {
    name: 'gradientAngle',
    type: 'number',
    default: '135',
    description: 'Direction of the gradient in degrees, the same as CSS linear-gradient.'
  },
  {
    name: 'cursorRadius',
    type: 'number',
    default: '240',
    description: 'Radius of the lens that follows the cursor, in pixels.'
  },
  {
    name: 'bulgeStrength',
    type: 'number',
    default: '0.6',
    description: 'How much the lens magnifies the dots under it, from -1 to 1. Negative values pinch them inward.'
  },
  {
    name: 'twist',
    type: 'number',
    default: '0',
    description: 'Swirls the dots around the cursor by this many degrees. Negative values swirl the other way.'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color the dots inside the glow light up to.'
  },
  {
    name: 'glowRadius',
    type: 'number',
    default: '160',
    description: 'Radius of the glow around the cursor, in pixels. 0 turns it off.'
  },
  {
    name: 'glowIntensity',
    type: 'number',
    default: '0.8',
    description: 'How strongly the dots inside the glow light up and bloom.'
  },
  {
    name: 'baseOpacity',
    type: 'number',
    default: '0.55',
    description: 'Opacity of the dots outside the glow, from 0 to 1.'
  },
  {
    name: 'waveAmplitude',
    type: 'number',
    default: '0',
    description: 'How far the dots drift in a slow rolling wave, in pixels. 0 keeps the field still.'
  },
  {
    name: 'sparkle',
    type: 'boolean',
    default: 'false',
    description: 'A few dots at a time softly grow and brighten, like stars twinkling.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'How fast the wave and the sparkles animate.' },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'The lens follows the cursor or finger. Turn off for a purely ambient background.'
  },
  {
    name: 'holdToZoom',
    type: 'boolean',
    default: 'true',
    description: 'Pressing and holding deepens the lens to look closer.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The field pulls into focus on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Prints the dots as ink so they stay crisp on light backgrounds.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity, from 0 to 1.' },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function DotFieldDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { light: isLight(), defaults: defaultProps() }), preset: value });
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
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>{() => <DotField {...(settings() as DotFieldProps)} />}</Keyed>
            <BackgroundContent headline="Hover to magnify, hold to zoom in." />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Pattern"
              options={PATTERN_OPTIONS}
              value={settings().pattern}
              onChange={(value: Pattern) => updateProp('pattern', value)}
            />
            <PreviewColorPickerCustom
              title="Gradient From"
              color={settings().gradientFrom}
              onChange={value => updateProp('gradientFrom', value)}
            />
            <PreviewColorPickerCustom
              title="Gradient To"
              color={settings().gradientTo}
              onChange={value => updateProp('gradientTo', value)}
            />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={settings().glowColor}
              onChange={value => updateProp('glowColor', value)}
            />
            <PreviewSlider
              title="Gradient Angle"
              min={0}
              max={360}
              step={1}
              value={settings().gradientAngle}
              onChange={value => updateProp('gradientAngle', value)}
            />
            <PreviewSlider
              title="Dot Radius"
              min={0.5}
              max={5}
              step={0.1}
              value={settings().dotRadius}
              onChange={value => updateProp('dotRadius', value)}
            />
            <PreviewSlider
              title="Dot Spacing"
              min={4}
              max={40}
              step={1}
              value={settings().dotSpacing}
              onChange={value => updateProp('dotSpacing', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={60}
              max={600}
              step={10}
              value={settings().cursorRadius}
              onChange={value => updateProp('cursorRadius', value)}
            />
            <PreviewSlider
              title="Bulge Strength"
              min={-1}
              max={1}
              step={0.05}
              value={settings().bulgeStrength}
              onChange={value => updateProp('bulgeStrength', value)}
            />
            <PreviewSlider
              title="Twist"
              min={-360}
              max={360}
              step={5}
              value={settings().twist}
              onChange={value => updateProp('twist', value)}
            />
            <PreviewSlider
              title="Glow Radius"
              min={0}
              max={500}
              step={10}
              value={settings().glowRadius}
              onChange={value => updateProp('glowRadius', value)}
            />
            <PreviewSlider
              title="Glow Intensity"
              min={0}
              max={2}
              step={0.05}
              value={settings().glowIntensity}
              onChange={value => updateProp('glowIntensity', value)}
            />
            <PreviewSlider
              title="Base Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings().baseOpacity}
              onChange={value => updateProp('baseOpacity', value)}
            />
            <PreviewSlider
              title="Wave Amplitude"
              min={0}
              max={20}
              step={0.5}
              value={settings().waveAmplitude}
              onChange={value => updateProp('waveAmplitude', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSwitch
              title="Sparkle"
              isChecked={settings().sparkle}
              onChange={value => updateProp('sparkle', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={settings().interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSwitch
              title="Hold To Zoom"
              isChecked={settings().holdToZoom}
              onChange={value => updateProp('holdToZoom', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings().lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={dotField} componentName="DotField" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
