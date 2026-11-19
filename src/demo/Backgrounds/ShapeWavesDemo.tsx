import { createSignal } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import BackgroundContent from '@/components/common/BackgroundContent';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import ShapeWaves, { type ShapeWavesShapes } from '@/content/Backgrounds/ShapeWaves/ShapeWaves';
import { shapeWaves } from '@/constants/code/Backgrounds/shapeWavesCode';

const DEFAULT_PROPS = {
  text: '</>',
  textSize: 0.6,
  shapes: 'mixed' as ShapeWavesShapes,
  cellSize: 10,
  dotSize: 0.75,
  color: '#929292',
  hoverColor: '#ffffff',
  backgroundColor: '#0c0f13',
  speed: 1,
  scale: 1,
  contrast: 1,
  brightness: 0.4,
  flow: 0,
  direction: 0,
  fade: 0.25,
  interactive: true,
  splashRadius: 40,
  splashStrength: 0.4,
  glow: 0.35,
  intro: true,
  introDuration: 1.6,
  paused: false
};

const SHAPE_OPTIONS = [
  { value: 'mixed', label: 'Mixed' },
  { value: 'squares', label: 'Squares' },
  { value: 'circles', label: 'Circles' },
  { value: 'triangles', label: 'Triangles' }
];

const propData: PropRow[] = [
  {
    name: 'text',
    type: 'string',
    default: "''",
    description:
      'Optional text carved out of the field. Cells under the glyphs stay empty and the waves flow around them.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '\'Geist, "Geist Sans", system-ui, sans-serif\'',
    description: 'CSS font family used to draw the text cutout.'
  },
  { name: 'fontWeight', type: 'string | number', default: '500', description: 'Font weight of the text cutout.' },
  {
    name: 'textSize',
    type: 'number',
    default: '0.6',
    description: 'Text height as a fraction of the container height. Long text shrinks to fit the width.'
  },
  {
    name: 'shapes',
    type: 'string',
    default: "'mixed'",
    description:
      "'mixed' draws dark bands as triangles, mid bands as circles and bright bands as squares. 'squares', 'circles' or 'triangles' use one glyph and vary its size per band instead."
  },
  { name: 'cellSize', type: 'number', default: '10', description: 'Size of one grid cell in CSS pixels.' },
  { name: 'dotSize', type: 'number', default: '0.75', description: 'Glyph size as a fraction of the cell.' },
  {
    name: 'color',
    type: 'string',
    default: "'#929292'",
    description: 'Glyph color. One flat color for the whole field.'
  },
  {
    name: 'hoverColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color the glyphs step towards inside a splash.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#000000'",
    description: 'Background color behind the glyphs.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '1',
    description: 'How fast the wave bands morph over time. 0 freezes them.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the wave bands. Larger values give broader, calmer swells.'
  },
  {
    name: 'contrast',
    type: 'number',
    default: '1',
    description: 'How sharply the field is cut into its three bands.'
  },
  {
    name: 'brightness',
    type: 'number',
    default: '0.4',
    description: 'Shifts the balance between dark, mid and bright bands.'
  },
  {
    name: 'flow',
    type: 'number',
    default: '0',
    description: 'Drift speed of the field in cells per second. 0 evolves in place.'
  },
  {
    name: 'direction',
    type: 'number',
    default: '0',
    description: 'Drift direction in degrees, used when flow is above 0.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.25',
    description: 'Strength of the radial fade into the background towards the edges. 0 disables it.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Lets the cursor splash into the field, sending ripples that cycle the glyphs and light them up.'
  },
  { name: 'splashRadius', type: 'number', default: '40', description: 'Size of a cursor splash in CSS pixels.' },
  {
    name: 'splashStrength',
    type: 'number',
    default: '0.4',
    description: 'How much energy a splash drops in. Higher values throw wider, brighter ripples.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.35',
    description: 'Bloom on lit glyphs. 0 disables the glow pass entirely.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description:
      'Plays a spawn animation on mount: the shapes pop in along a wave that travels from the centre to the corners.'
  },
  { name: 'introDuration', type: 'number', default: '1.6', description: 'Length of the intro wave in seconds.' },
  {
    name: 'introKey',
    type: 'string | number',
    default: '0',
    description: 'Change this value to replay the intro wave without remounting.'
  },
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description: 'Freezes the wave motion. Splashes keep working.'
  },
  {
    name: 'onError',
    type: '(error: Error) => void',
    default: 'undefined',
    description: 'Called when WebGPU is unavailable or rendering fails. The background color still shows.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' }
];

export default function ShapeWavesDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [introKey, setIntroKey] = createSignal(0);

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
            <RefreshButton onClick={() => setIntroKey(key => key + 1)} />
            <ShapeWaves {...props()} introKey={introKey()} onError={error => console.error('[ShapeWaves]', error)} />
            <BackgroundContent headline="Shapes that ripple in waves around your words." />
          </div>

          <Customize>
            <PreviewInput
              title="Text"
              value={props().text}
              placeholder="Leave empty for no cutout"
              maxLength={24}
              onChange={value => updateProp('text', value)}
            />

            <PreviewColorPickerCustom
              title="Color"
              color={props().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Splash Color"
              color={props().hoverColor}
              onChange={value => updateProp('hoverColor', value)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={props().backgroundColor}
              onChange={value => updateProp('backgroundColor', value)}
            />

            <PreviewSelect
              title="Shapes"
              options={SHAPE_OPTIONS}
              value={props().shapes}
              onChange={(value: ShapeWavesShapes) => updateProp('shapes', value)}
            />

            <PreviewSlider
              title="Cell Size"
              min={6}
              max={24}
              step={1}
              value={props().cellSize}
              onChange={value => updateProp('cellSize', value)}
            />
            <PreviewSlider
              title="Dot Size"
              min={0.3}
              max={1}
              step={0.01}
              value={props().dotSize}
              onChange={value => updateProp('dotSize', value)}
            />
            <PreviewSlider
              title="Text Size"
              min={0.1}
              max={0.6}
              step={0.01}
              value={props().textSize}
              onChange={value => updateProp('textSize', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={4}
              step={0.1}
              value={props().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Wave Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={props().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.3}
              max={3}
              step={0.05}
              value={props().contrast}
              onChange={value => updateProp('contrast', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0}
              max={1}
              step={0.01}
              value={props().brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={4}
              step={0.1}
              value={props().flow}
              onChange={value => updateProp('flow', value)}
            />
            <PreviewSlider
              title="Direction"
              min={0}
              max={360}
              step={5}
              value={props().direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={0.45}
              step={0.01}
              value={props().fade}
              onChange={value => updateProp('fade', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props().interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSlider
              title="Splash Radius"
              min={10}
              max={120}
              step={2}
              value={props().splashRadius}
              onChange={value => updateProp('splashRadius', value)}
            />
            <PreviewSlider
              title="Splash Strength"
              min={0.2}
              max={2.5}
              step={0.05}
              value={props().splashStrength}
              onChange={value => updateProp('splashStrength', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={3}
              step={0.05}
              value={props().glow}
              onChange={value => updateProp('glow', value)}
            />

            <PreviewSwitch title="Intro" isChecked={props().intro} onChange={value => updateProp('intro', value)} />
            <PreviewSlider
              title="Intro Duration"
              min={0.5}
              max={4}
              step={0.1}
              value={props().introDuration}
              onChange={value => updateProp('introDuration', value)}
            />

            <PreviewSwitch title="Paused" isChecked={props().paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['vgpu']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={shapeWaves} componentName="ShapeWaves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
