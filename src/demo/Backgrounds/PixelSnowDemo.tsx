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

import PixelSnow, { type PixelSnowVariant } from '@/content/Backgrounds/PixelSnow/PixelSnow';
import { pixelSnow } from '@/constants/code/Backgrounds/pixelSnowCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/PixelSnow';

const VARIANT_OPTIONS = [
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' }
];

const propData: PropRow[] = [
  { name: 'color', type: 'string', default: "'#ffffff'", description: 'Color of the snow.' },
  {
    name: 'variant',
    type: "'snowflake' | 'square' | 'round'",
    default: "'snowflake'",
    description: 'Shape of the flakes: pixel crystals, square pixels or round pixels.'
  },
  { name: 'density', type: 'number', default: '0.5', description: 'How much snow is falling, from 0 to 1.' },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'How fast the snow falls. Negative values make it rise.'
  },
  {
    name: 'wind',
    type: 'number',
    default: '0.25',
    description: 'Sideways drift. Negative values blow to the left.'
  },
  { name: 'sway', type: 'number', default: '0.5', description: 'How much each flake swings as it falls.' },
  {
    name: 'flakeSize',
    type: 'number',
    default: '1',
    description: 'Size of the flakes, from 0 for mostly tiny specks to 2 for mostly large crystals.'
  },
  { name: 'pixelSize', type: 'number', default: '3', description: 'Size of one snow pixel in px.' },
  {
    name: 'depth',
    type: 'number',
    default: '0.6',
    description: 'How strongly far flakes fall slower and dimmer than near ones, from 0 to 1.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the snow.' },
  { name: 'glow', type: 'number', default: '0.8', description: 'Strength of the soft light around each flake.' },
  {
    name: 'twinkle',
    type: 'number',
    default: '0.35',
    description: 'How often flakes catch the light and sparkle, from 0 to 1.'
  },
  {
    name: 'accumulate',
    type: 'boolean',
    default: 'false',
    description: 'Lets the snow pile up in soft drifts along the bottom edge.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor brush the snow aside and stir it as it moves.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Lets the snow drift in from the top on mount.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the snow as colored pixels for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the snow in place.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function PixelSnowDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps() }), preset: value });
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
            <Keyed token={rerenderKey()}>{() => <PixelSnow {...settings()} />}</Keyed>
            <BackgroundContent headline="Oh, the weather outside is frightful!" />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings().variant}
              onChange={(value: PixelSnowVariant) => updateProp('variant', value)}
            />
            <PreviewSlider
              title="Density"
              min={0}
              max={1}
              step={0.05}
              value={settings().density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Speed"
              min={-1}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Wind"
              min={-2}
              max={2}
              step={0.05}
              value={settings().wind}
              onChange={value => updateProp('wind', value)}
            />
            <PreviewSlider
              title="Sway"
              min={0}
              max={2}
              step={0.05}
              value={settings().sway}
              onChange={value => updateProp('sway', value)}
            />
            <PreviewSlider
              title="Flake Size"
              min={0}
              max={2}
              step={0.05}
              value={settings().flakeSize}
              onChange={value => updateProp('flakeSize', value)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={8}
              step={1}
              value={settings().pixelSize}
              valueUnit="px"
              onChange={value => updateProp('pixelSize', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={1}
              step={0.05}
              value={settings().depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings().brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings().glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Twinkle"
              min={0}
              max={1}
              step={0.05}
              value={settings().twinkle}
              onChange={value => updateProp('twinkle', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings().fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings().opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch
              title="Accumulate"
              isChecked={settings().accumulate}
              onChange={value => updateProp('accumulate', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings().mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings().intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Light Mode"
              isChecked={settings().lightMode}
              onChange={value => updateProp('lightMode', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelSnow} componentName="PixelSnow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
