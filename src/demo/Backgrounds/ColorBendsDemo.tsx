import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import BackgroundContent from '@/components/common/BackgroundContent';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSlider from '@/components/common/PreviewSlider';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import ColorBends from '@/content/Backgrounds/ColorBends/ColorBends';
import { colorBends } from '@/constants/code/Backgrounds/colorBendsCode';

const DEFAULT_PROPS = {
  rotation: 90,
  autoRotate: 0,
  speed: 0.2,
  scale: 1,
  frequency: 1,
  warpStrength: 1,
  mouseInfluence: 1,
  parallax: 0.5,
  noise: 0.15,
  iterations: 1,
  intensity: 1.5,
  bandWidth: 6,
  color: '#6ec9f7'
};

const propData: PropRow[] = [
  { name: 'rotation', type: 'number', default: '90', description: 'Base rotation angle in degrees.' },
  { name: 'autoRotate', type: 'number', default: '0', description: 'Automatic rotation speed in degrees/sec.' },
  { name: 'speed', type: 'number', default: '0.2', description: 'Animation time scale of the shader.' },
  {
    name: 'colors',
    type: 'string[]',
    default: '[]',
    description: 'Palette of up to 8 hex colors used to blend the bends.'
  },
  {
    name: 'transparent',
    type: 'boolean',
    default: 'true',
    description: 'Whether the background is transparent (uses alpha).'
  },
  { name: 'scale', type: 'number', default: '1', description: 'Zoom factor of the pattern.' },
  { name: 'frequency', type: 'number', default: '1', description: 'Wave frequency used in the pattern.' },
  {
    name: 'warpStrength',
    type: 'number',
    default: '1',
    description: 'Amount of warping/distortion applied to waves.'
  },
  {
    name: 'mouseInfluence',
    type: 'number',
    default: '1',
    description: 'How strongly the waves react to pointer movement.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '0.5',
    description: 'Parallax factor shifting content with pointer.'
  },
  { name: 'noise', type: 'number', default: '0.15', description: 'Adds subtle grain. 0 disables noise.' },
  {
    name: 'iterations',
    type: 'number',
    default: '1',
    description: 'Number of extra warp passes (1-5). Higher values create more complex patterns.'
  },
  {
    name: 'intensity',
    type: 'number',
    default: '1.5',
    description: 'Brightness multiplier for the final color output.'
  },
  { name: 'bandWidth', type: 'number', default: '6', description: 'Controls the width/falloff of each color band.' },
  { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '{}', description: 'Inline styles for the container.' }
];

export default function ColorBendsDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['color']}
      computedProps={{ colors: [props().color] }}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <ColorBends
              rotation={props().rotation}
              autoRotate={props().autoRotate}
              speed={props().speed}
              scale={props().scale}
              frequency={props().frequency}
              warpStrength={props().warpStrength}
              mouseInfluence={props().mouseInfluence}
              parallax={props().parallax}
              noise={props().noise}
              iterations={props().iterations}
              intensity={props().intensity}
              bandWidth={props().bandWidth}
              colors={[props().color]}
            />
            <BackgroundContent headline="You have the power to reshape your own destiny" />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Color"
              color={props().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Rotation (deg)"
              min={-180}
              max={180}
              step={1}
              value={props().rotation}
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Auto Rotate (deg/s)"
              min={-5}
              max={5}
              step={1}
              value={props().autoRotate}
              onChange={value => updateProp('autoRotate', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1}
              step={0.01}
              value={props().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.2}
              max={5}
              step={0.1}
              value={props().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Frequency"
              min={0}
              max={5}
              step={0.1}
              value={props().frequency}
              onChange={value => updateProp('frequency', value)}
            />
            <PreviewSlider
              title="Warp Strength"
              min={0.9}
              max={1}
              step={0.005}
              value={props().warpStrength}
              onChange={value => updateProp('warpStrength', value)}
            />
            <PreviewSlider
              title="Mouse Influence"
              min={0}
              max={2}
              step={0.05}
              value={props().mouseInfluence}
              onChange={value => updateProp('mouseInfluence', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={2}
              step={0.05}
              value={props().parallax}
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSlider
              title="Noise"
              min={0}
              max={1}
              step={0.01}
              value={props().noise}
              onChange={value => updateProp('noise', value)}
            />
            <PreviewSlider
              title="Iterations"
              min={1}
              max={5}
              step={1}
              value={props().iterations}
              onChange={value => updateProp('iterations', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.1}
              max={2}
              step={0.1}
              value={props().intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Band Width"
              min={1}
              max={20}
              step={0.5}
              value={props().bandWidth}
              onChange={value => updateProp('bandWidth', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={colorBends} componentName="ColorBends" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
