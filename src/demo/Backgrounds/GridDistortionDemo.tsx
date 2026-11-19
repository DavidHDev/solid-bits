import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import BackgroundContent from '@/components/common/BackgroundContent';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import GridDistortion, { type GridDistortionMode } from '@/content/Backgrounds/GridDistortion/GridDistortion';
import { gridDistortion } from '@/constants/code/Backgrounds/gridDistortionCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/GridDistortion';

const MODE_OPTIONS = [
  { value: 'drag', label: 'Drag' },
  { value: 'push', label: 'Push' },
  { value: 'swirl', label: 'Swirl' }
];

const propData: PropRow[] = [
  { name: 'imageSrc', type: 'string', default: '-', description: 'Image to distort. It covers the container.' },
  {
    name: 'grid',
    type: 'number',
    default: '15',
    description: 'Number of cells across. Rows follow the container so cells stay square.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '0.18',
    description: 'Reach of the pointer as a fraction of the container width.'
  },
  {
    name: 'strength',
    type: 'number',
    default: '0.15',
    description: 'How far the pointer throws the cells. 0 turns the pointer off.'
  },
  {
    name: 'relaxation',
    type: 'number',
    default: '0.96',
    description: 'How much displacement each cell keeps per frame. Higher values settle more slowly.'
  },
  {
    name: 'mode',
    type: "'drag' | 'push' | 'swirl'",
    default: "'drag'",
    description: 'Drag pulls cells along with the pointer, push throws them outward and swirl spins them around it.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0',
    description: 'Blends the crisp blocks into a smooth liquid warp, from 0 to 1.'
  },
  {
    name: 'chroma',
    type: 'number',
    default: '0',
    description: 'Splits the color channels on displaced cells, from 0 to 1.'
  },
  {
    name: 'idle',
    type: 'number',
    default: '0.3',
    description: 'A slow wandering distortion that keeps the image alive while the pointer rests. 0 turns it off.'
  },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Sends a ring of displaced cells out from every click.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Scrambles the cells when the image loads and lets them settle into place.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function GridDistortionDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps(), props: props() }), preset: value });
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
            <GridDistortion {...settings()} />
            <BackgroundContent headline="Don't just sit there, move your cursor!" />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Grid"
              min={4}
              max={60}
              step={1}
              value={settings().grid}
              onChange={value => updateProp('grid', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0.05}
              max={0.5}
              step={0.01}
              value={settings().radius}
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSlider
              title="Strength"
              min={0}
              max={0.6}
              step={0.01}
              value={settings().strength}
              onChange={value => updateProp('strength', value)}
            />
            <PreviewSlider
              title="Relaxation"
              min={0.8}
              max={0.99}
              step={0.01}
              value={settings().relaxation}
              onChange={value => updateProp('relaxation', value)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings().mode}
              onChange={(value: GridDistortionMode) => updateProp('mode', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings().softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Chroma"
              min={0}
              max={1}
              step={0.05}
              value={settings().chroma}
              onChange={value => updateProp('chroma', value)}
            />
            <PreviewSlider
              title="Idle"
              min={0}
              max={1}
              step={0.05}
              value={settings().idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSwitch
              title="Click Ripple"
              isChecked={settings().clickRipple}
              onChange={value => updateProp('clickRipple', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings().intro} onChange={value => updateProp('intro', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gridDistortion} componentName="GridDistortion" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
