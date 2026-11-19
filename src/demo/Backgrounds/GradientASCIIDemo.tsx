import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import BackgroundContent from '@/components/common/BackgroundContent';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorList from '@/components/common/PreviewColorList';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { isLight } from '@/hooks/useTheme';

import GradientASCII, {
  type GradientASCIIClickEffect,
  type GradientASCIIShape
} from '@/content/Backgrounds/GradientASCII/GradientASCII';
import { gradientASCII } from '@/constants/code/Backgrounds/gradientASCIICode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/GradientASCII';

const SHAPE_OPTIONS = [
  { value: 'horizon', label: 'Horizon' },
  { value: 'pinch', label: 'Pinch' },
  { value: 'rise', label: 'Rise' },
  { value: 'eclipse', label: 'Eclipse' }
];

const CHARACTER_OPTIONS = [
  { value: ' =+xX0S8#@', label: 'Letters' },
  { value: ' .:-=+*#%@', label: 'Classic' },
  { value: ' 01', label: 'Binary' },
  { value: ' ░▒▓█', label: 'Blocks' },
  { value: ' .·•●', label: 'Dots' }
];

const CLICK_OPTIONS = [
  { value: 'wave', label: 'Wave' },
  { value: 'burst', label: 'Burst' },
  { value: 'none', label: 'None' }
];

const propData: PropRow[] = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#1462c8', '#f6f8ff', '#a5d8ff', '#38bdf8']",
    description:
      'Two to eight colors for the light, from the edge of the shadow to the brightest or farthest point. Dark areas stay transparent.'
  },
  {
    name: 'shape',
    type: "'horizon' | 'pinch' | 'rise' | 'eclipse'",
    default: "'horizon'",
    description:
      'Horizon glows over a dark curve, pinch is a band of light squeezed in the middle, rise glows up from the bottom and eclipse rings a dark disc.'
  },
  {
    name: 'characters',
    type: 'string',
    default: "' =+xX0S8#@'",
    description: 'Characters from dimmest to brightest. Brighter parts of the gradient use characters further along.'
  },
  {
    name: 'cellSize',
    type: 'number',
    default: '18',
    description: 'Height of each character cell in px.'
  },
  {
    name: 'density',
    type: 'number',
    default: '0.8',
    description: 'Share of cells that show a character, from 0 to 1. Brighter areas fill in first.'
  },
  {
    name: 'glyphOpacity',
    type: 'number',
    default: '0.85',
    description: 'How strongly the characters stand out from the gradient.'
  },
  {
    name: 'gradientOpacity',
    type: 'number',
    default: '0.9',
    description: 'Opacity of the gradient behind the characters. At 0 only the characters are left.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.2',
    description: 'Soft glow around the characters, from 0 to 1.5.'
  },
  {
    name: 'depthOfField',
    type: 'number',
    default: '0',
    description: 'Share of characters drawn out of focus, from 0 to 1.'
  },
  {
    name: 'flicker',
    type: 'number',
    default: '0.2',
    description: 'How often characters swap with their neighbors in brightness, from 0 to 1.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.5',
    description: 'How soft the edges of the shape are, from 0 to 1.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the shape, from 0.4 to 2.5.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0.5',
    description: 'How much the light wavers as it drifts, from 0 to 2.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'Speed of the drift. 0 holds the shape still.'
  },
  {
    name: 'grain',
    type: 'number',
    default: '0.08',
    description: 'Strength of the film grain, from 0 to 0.4.'
  },
  {
    name: 'variation',
    type: 'number',
    default: '0',
    description: 'Picks a different drift and a different pattern of characters.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Scrambles the characters under the cursor as it moves. They settle back a moment later.'
  },
  {
    name: 'scrambleRadius',
    type: 'number',
    default: '0.1',
    description: 'Size of the scrambled area around the cursor, relative to the container height.'
  },
  {
    name: 'clickEffect',
    type: "'wave' | 'burst' | 'none'",
    default: "'wave'",
    description: 'Wave sends a ring of scrambled characters out from the click, burst scrambles a patch under it.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Fades the light in from its source while the characters decode.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the gradient as a wash on light backgrounds, with characters a shade darker.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '\'"Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace\'',
    description: 'Font used for the characters. Monospaced fonts keep the grid even.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function GradientASCIIDemo() {
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
            <Keyed token={rerenderKey()}>{() => <GradientASCII {...settings()} />}</Keyed>
            <BackgroundContent headline="Soft gradients, typed out in characters." />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings().colors}
              min={2}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings().shape}
              onChange={(value: GradientASCIIShape) => updateProp('shape', value)}
            />
            <PreviewSelect
              title="Characters"
              options={CHARACTER_OPTIONS}
              value={settings().characters}
              onChange={(value: string) => updateProp('characters', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings().clickEffect}
              onChange={(value: GradientASCIIClickEffect) => updateProp('clickEffect', value)}
            />
            <PreviewSlider
              title="Cell Size"
              min={8}
              max={40}
              step={1}
              value={settings().cellSize}
              valueUnit="px"
              onChange={value => updateProp('cellSize', value)}
            />
            <PreviewSlider
              title="Density"
              min={0}
              max={1}
              step={0.01}
              value={settings().density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Glyph Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings().glyphOpacity}
              onChange={value => updateProp('glyphOpacity', value)}
            />
            <PreviewSlider
              title="Gradient Opacity"
              min={0}
              max={1}
              step={0.01}
              value={settings().gradientOpacity}
              onChange={value => updateProp('gradientOpacity', value)}
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
              title="Depth of Field"
              min={0}
              max={1}
              step={0.01}
              value={settings().depthOfField}
              onChange={value => updateProp('depthOfField', value)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.01}
              value={settings().flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={settings().softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.4}
              max={2.5}
              step={0.05}
              value={settings().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={2}
              step={0.05}
              value={settings().flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.4}
              step={0.01}
              value={settings().grain}
              onChange={value => updateProp('grain', value)}
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
              title="Scramble Radius"
              min={0.02}
              max={0.4}
              step={0.01}
              value={settings().scrambleRadius}
              isDisabled={!settings().mouseInteraction}
              onChange={value => updateProp('scrambleRadius', value)}
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
          <CodeExample codeObject={gradientASCII} componentName="GradientASCII" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
