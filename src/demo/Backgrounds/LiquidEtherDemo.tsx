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

import LiquidEther from '@/content/Backgrounds/LiquidEther/LiquidEther';
import { liquidEther } from '@/constants/code/Backgrounds/liquidEtherCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/LiquidEther';

const propData: PropRow[] = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#0aa0ef', '#6ec9f7', '#b4c8da']",
    description: 'Colors from slow to fast flow. Calm areas take the first color, the fastest currents the last.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'Brightness of the flow.' },
  {
    name: 'mouseForce',
    type: 'number',
    default: '20',
    description: 'How strongly the cursor pushes the liquid.'
  },
  { name: 'cursorSize', type: 'number', default: '100', description: 'Size of the area the cursor stirs, in px.' },
  {
    name: 'persistence',
    type: 'number',
    default: '0.75',
    description: 'How long the motion lingers before it settles, from 0 to 1.'
  },
  {
    name: 'viscosity',
    type: 'number',
    default: '0',
    description: 'How thick the liquid is, from 0 to 1. Thicker liquid moves in broad, slow swirls.'
  },
  {
    name: 'resolution',
    type: 'number',
    default: '0.5',
    description: 'Detail of the simulation, from 0.1 to 1. Lower values are faster and softer.'
  },
  {
    name: 'autoDemo',
    type: 'boolean',
    default: 'true',
    description: 'Stirs the liquid on its own while the cursor is away.'
  },
  { name: 'autoSpeed', type: 'number', default: '0.5', description: 'Speed of the automatic stirring.' },
  {
    name: 'autoIntensity',
    type: 'number',
    default: '2.2',
    description: 'Strength of the automatic stirring compared with the cursor.'
  },
  {
    name: 'autoResumeDelay',
    type: 'number',
    default: '1000',
    description: 'Milliseconds without input before the automatic stirring resumes.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking shoots a puff of liquid in the direction the cursor was moving.'
  },
  {
    name: 'bounceEdges',
    type: 'boolean',
    default: 'false',
    description: 'The liquid bounces off the edges instead of flowing out of view.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'A swirl sweeps out from the center on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Renders the flow as soft ink for light backgrounds.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Solid color behind the flow. Leave transparent to show the page through.'
  },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function LiquidEtherDemo() {
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
            <Keyed token={rerenderKey()}>{() => <LiquidEther {...settings()} />}</Keyed>
            <BackgroundContent headline="The web, made fluid at your fingertips." />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings().colors}
              min={1}
              max={6}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Intensity"
              min={0.3}
              max={2}
              step={0.05}
              value={settings().intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Mouse Force"
              min={0}
              max={60}
              step={1}
              value={settings().mouseForce}
              onChange={value => updateProp('mouseForce', value)}
            />
            <PreviewSlider
              title="Cursor Size"
              min={20}
              max={300}
              step={5}
              value={settings().cursorSize}
              valueUnit="px"
              onChange={value => updateProp('cursorSize', value)}
            />
            <PreviewSlider
              title="Persistence"
              min={0}
              max={1}
              step={0.01}
              value={settings().persistence}
              onChange={value => updateProp('persistence', value)}
            />
            <PreviewSlider
              title="Viscosity"
              min={0}
              max={1}
              step={0.01}
              value={settings().viscosity}
              onChange={value => updateProp('viscosity', value)}
            />
            <PreviewSlider
              title="Resolution"
              min={0.1}
              max={1}
              step={0.05}
              value={settings().resolution}
              onChange={value => updateProp('resolution', value)}
            />
            <PreviewSlider
              title="Auto Speed"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().autoSpeed}
              onChange={value => updateProp('autoSpeed', value)}
            />
            <PreviewSlider
              title="Auto Intensity"
              min={0}
              max={4}
              step={0.1}
              value={settings().autoIntensity}
              onChange={value => updateProp('autoIntensity', value)}
            />
            <PreviewSwitch
              title="Auto Demo"
              isChecked={settings().autoDemo}
              onChange={value => updateProp('autoDemo', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings().clickBurst}
              onChange={value => updateProp('clickBurst', value)}
            />
            <PreviewSwitch
              title="Bounce Edges"
              isChecked={settings().bounceEdges}
              onChange={value => updateProp('bounceEdges', value)}
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
          <CodeExample codeObject={liquidEther} componentName="LiquidEther" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
