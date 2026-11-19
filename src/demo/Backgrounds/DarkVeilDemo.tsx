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

import DarkVeil, { type DarkVeilProps } from '@/content/Backgrounds/DarkVeil/DarkVeil';
import { darkVeil } from '@/constants/code/Backgrounds/darkVeilCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/DarkVeil';

const propData: PropRow[] = [
  {
    name: 'color',
    type: 'string',
    default: "'#0aa0ef'",
    description: 'Color of the veil. Highlights are derived from it.'
  },
  { name: 'speed', type: 'number', default: '0.5', description: 'Animation speed.' },
  { name: 'scale', type: 'number', default: '1', description: 'Zoom of the veil. Higher values zoom in.' },
  { name: 'rotation', type: 'number', default: '0', description: 'Turns the veil around the center, in degrees.' },
  {
    name: 'flow',
    type: 'number',
    default: '1',
    description: 'How much the veil drifts and changes shape over time.'
  },
  { name: 'warp', type: 'number', default: '0', description: 'Adds a gentle ripple to the veil.' },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different veil shape. Any number works.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness.' },
  {
    name: 'sheen',
    type: 'number',
    default: '0',
    description: 'Strength of the silky highlights along the folds. They follow the cursor like a light.'
  },
  { name: 'glow', type: 'number', default: '0.4', description: 'Soft glow around the brightest parts.' },
  { name: 'grain', type: 'number', default: '0.03', description: 'Strength of the film grain.' },
  {
    name: 'quality',
    type: 'number',
    default: '0.5',
    description:
      'Render resolution, from 0.25 to 1. The veil is soft, so lower values look almost the same and run faster.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The veil swirls, morphs and lights up around the cursor.'
  },
  { name: 'mouseStrength', type: 'number', default: '1', description: 'How strongly the cursor bends the veil.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fades the veil in as it unfolds.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the veil as soft tinted ink for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

export default function DarkVeilDemo() {
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
            <Keyed token={rerenderKey()}>{() => <DarkVeil {...(settings() as DarkVeilProps)} />}</Keyed>
            <BackgroundContent pillText="New Background" headline="Become emboldened by the flame of ambition" />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color"
              color={settings().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={2.5}
              step={0.05}
              value={settings().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={360}
              step={1}
              value={settings().rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={3}
              step={0.05}
              value={settings().flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Warp"
              min={0}
              max={2}
              step={0.05}
              value={settings().warp}
              onChange={value => updateProp('warp', value)}
            />
            <PreviewSlider
              title="Variation"
              min={0}
              max={20}
              step={1}
              value={settings().variation}
              onChange={value => updateProp('variation', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings().brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Sheen"
              min={0}
              max={2}
              step={0.05}
              value={settings().sheen}
              onChange={value => updateProp('sheen', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.15}
              step={0.01}
              value={settings().grain}
              onChange={value => updateProp('grain', value)}
            />
            <PreviewSlider
              title="Quality"
              min={0.25}
              max={1}
              step={0.05}
              value={settings().quality}
              onChange={value => updateProp('quality', value)}
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
              title="Mouse Interaction"
              isChecked={settings().mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={2}
              step={0.05}
              value={settings().mouseStrength}
              onChange={value => updateProp('mouseStrength', value)}
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
          <CodeExample codeObject={darkVeil} componentName="DarkVeil" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
