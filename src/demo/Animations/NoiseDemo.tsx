import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import Noise, { type NoiseBlendMode } from '@/content/Animations/Noise/Noise';
import { noise } from '@/constants/code/Animations/noiseCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps, type NoiseScene } from './presets/Noise';

const PHOTO = 'https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=1600&q=80&auto=format&fit=crop';

const SCENES: Record<NoiseScene, { background: string }> = {
  photo: { background: `center / cover no-repeat url("${PHOTO}")` },
  studio: {
    background: 'radial-gradient(70% 90% at 50% 34%, #a29b92 0%, #7a746d 30%, #4b4743 62%, #262422 88%, #1c1b1a 100%)'
  },
  dark: { background: '#0b0b0d' },
  paper: { background: '#f3efe6' }
};

const BLEND_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'difference', label: 'Difference' }
];

const propData: PropRow[] = [
  { name: 'opacity', type: 'number', default: '0.2', description: 'Strength of the grain, from 0 to 1.' },
  {
    name: 'size',
    type: 'number',
    default: '1',
    description: 'Size of each grain in CSS pixels. 0.5 is one device pixel on retina screens.'
  },
  {
    name: 'fps',
    type: 'number',
    default: '24',
    description: 'How many times per second the grain changes. 0 keeps it still, like a paper texture.'
  },
  {
    name: 'blendMode',
    type: "'normal' | 'overlay' | 'soft-light' | 'multiply' | 'screen' | 'difference'",
    default: "'overlay'",
    description:
      'How the grain mixes with what is underneath. Overlay and soft light add texture without graying the image.'
  },
  {
    name: 'contrast',
    type: 'number',
    default: '0.6',
    description: 'From soft, fine grain at 0 to harsh, punchy grain at 1.'
  },
  {
    name: 'dust',
    type: 'number',
    default: '0',
    description: 'Specks, hairs and fibers that flicker over the frame like dust on a film print, from 0 to 1.'
  },
  {
    name: 'scratches',
    type: 'number',
    default: '0',
    description: 'How often thin vertical scratches run down the frame for a few seconds, from 0 to 1.'
  },
  { name: 'colored', type: 'boolean', default: 'false', description: 'Uses colored grain instead of gray.' },
  {
    name: 'scanlines',
    type: 'number',
    default: '0',
    description: 'Adds rolling horizontal lines, like an old screen, from 0 to 1.'
  },
  {
    name: 'flicker',
    type: 'number',
    default: '0',
    description: 'Makes the grain strength jump a little every frame, like a film projector.'
  },
  {
    name: 'fixed',
    type: 'boolean',
    default: 'false',
    description: 'Covers the whole viewport instead of the nearest positioned parent.'
  },
  { name: 'zIndex', type: 'number', default: '-', description: 'Stacking order of the overlay.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the overlay.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the overlay.' }
];

export default function NoiseDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, scene: _scene, ...rest } = props();
    return rest;
  });
  const look = createMemo(() => SCENES[props().scene] ?? SCENES.photo);

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value), preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'scene']}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '500px',
              padding: 0,
              overflow: 'hidden',
              background: look().background
            }}
          >
            <Noise {...settings()} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.01}
              value={props().opacity}
              onChange={v => updateProp('opacity', v)}
            />
            <PreviewSlider
              title="Size"
              min={0.5}
              max={4}
              step={0.5}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="FPS"
              min={0}
              max={60}
              step={1}
              value={props().fps}
              onChange={v => updateProp('fps', v)}
            />
            <PreviewSelect
              title="Blend"
              options={BLEND_OPTIONS}
              value={props().blendMode}
              onChange={(v: NoiseBlendMode) => updateProp('blendMode', v)}
            />
            <PreviewSlider
              title="Contrast"
              min={0}
              max={1}
              step={0.05}
              value={props().contrast}
              onChange={v => updateProp('contrast', v)}
            />
            <PreviewSlider
              title="Dust"
              min={0}
              max={1}
              step={0.05}
              value={props().dust}
              onChange={v => updateProp('dust', v)}
            />
            <PreviewSlider
              title="Scratches"
              min={0}
              max={1}
              step={0.05}
              value={props().scratches}
              onChange={v => updateProp('scratches', v)}
            />
            <PreviewSlider
              title="Scanlines"
              min={0}
              max={1}
              step={0.05}
              value={props().scanlines}
              onChange={v => updateProp('scanlines', v)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={props().flicker}
              onChange={v => updateProp('flicker', v)}
            />
            <PreviewSwitch title="Colored" isChecked={props().colored} onChange={v => updateProp('colored', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={noise} componentName="Noise" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
