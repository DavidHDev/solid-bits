import { Show, createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
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
import { useColorModeValue } from '@/hooks/useTheme';

import GlareHover, { type GlareHoverProps } from '@/content/Animations/GlareHover/GlareHover';
import { glareHover } from '@/constants/code/Animations/glareHoverCode';

const LOOK = {
  mode: 'hover',
  variant: 'streak',
  glareOpacity: 0.5,
  glareSize: 30,
  softness: 0.6,
  glareAngle: -45,
  transitionDuration: 650,
  interval: 3
};

const PRESETS: Record<string, typeof LOOK> = {
  sweep: { ...LOOK },
  twin: {
    ...LOOK,
    variant: 'twin',
    glareOpacity: 0.6,
    glareSize: 40,
    softness: 0.4,
    glareAngle: -60,
    transitionDuration: 800
  },
  follow: {
    ...LOOK,
    mode: 'follow',
    variant: 'sheen',
    glareOpacity: 0.45,
    glareSize: 55,
    softness: 0.8,
    glareAngle: -30
  },
  shine: {
    ...LOOK,
    mode: 'loop',
    glareOpacity: 0.7,
    glareSize: 16,
    softness: 0.3,
    glareAngle: -60,
    transitionDuration: 900,
    interval: 2.5
  }
};

const DEFAULT_PROPS = {
  preset: 'sweep',
  ...LOOK,
  glareColor: '#ffffff',
  blendMode: 'screen',
  rimGlint: true,
  playOnce: false,
  intro: false
};

const PRESET_OPTIONS = [
  { value: 'sweep', label: 'Sweep' },
  { value: 'twin', label: 'Twin' },
  { value: 'follow', label: 'Follow' },
  { value: 'shine', label: 'Shine' }
];

const MODE_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'follow', label: 'Follow' },
  { value: 'loop', label: 'Loop' },
  { value: 'click', label: 'Click' }
];

const VARIANT_OPTIONS = [
  { value: 'streak', label: 'Streak' },
  { value: 'twin', label: 'Twin' },
  { value: 'sheen', label: 'Sheen' }
];

const BLEND_OPTIONS = [
  { value: 'screen', label: 'Screen' },
  { value: 'normal', label: 'Normal' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' }
];

const COMPUTED_PROPS = { width: '360px', height: '240px', borderRadius: '20px' };

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'The content the glare passes over.' },
  {
    name: 'mode',
    type: "'hover' | 'follow' | 'loop' | 'click'",
    default: "'hover'",
    description: 'Sweep on hover, follow the cursor, shine on a timer, or sweep on click.'
  },
  {
    name: 'variant',
    type: "'streak' | 'twin' | 'sheen'",
    default: "'streak'",
    description: 'Shape of the glare: one bright streak, a double streak like glass, or a soft wide sheen.'
  },
  { name: 'glareColor', type: 'string', default: "'#ffffff'", description: 'Color of the glare. Any CSS color.' },
  { name: 'glareOpacity', type: 'number', default: '0.5', description: 'Brightness of the glare, from 0 to 1.' },
  {
    name: 'glareSize',
    type: 'number',
    default: '30',
    description: "Width of the glare as a percentage of the element's diagonal."
  },
  { name: 'softness', type: 'number', default: '0.6', description: 'How soft the core of the glare is, from 0 to 1.' },
  { name: 'glareAngle', type: 'number', default: '-45', description: 'Direction the glare travels, in degrees.' },
  {
    name: 'blendMode',
    type: 'string',
    default: "'screen'",
    description: 'How the glare mixes with the content: screen, normal, overlay or soft-light.'
  },
  {
    name: 'rimGlint',
    type: 'boolean',
    default: 'true',
    description: 'Lets the edge catch the light where the glare crosses it.'
  },
  {
    name: 'transitionDuration',
    type: 'number',
    default: '650',
    description: 'How long one sweep takes, in milliseconds.'
  },
  { name: 'interval', type: 'number', default: '3', description: 'Seconds between shines in loop mode.' },
  {
    name: 'playOnce',
    type: 'boolean',
    default: 'false',
    description: 'In hover mode, sweeps only on the way in instead of again on the way out.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'false',
    description: 'Sweeps once when the element first scrolls into view.'
  },
  { name: 'width', type: 'string', default: "'auto'", description: 'Width of the element.' },
  { name: 'height', type: 'string', default: "'auto'", description: 'Height of the element.' },
  { name: 'background', type: 'string', default: "'transparent'", description: 'Background of the element.' },
  { name: 'borderRadius', type: 'string', default: "'10px'", description: 'Corner radius of the element.' },
  { name: 'borderColor', type: 'string', default: "'transparent'", description: 'Border color of the element.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the element.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '{}', description: 'Inline styles for the element.' }
];

export default function GlareHoverDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const photo = useColorModeValue('/assets/demo/day-sky.webp', '/assets/demo/night-sky.webp');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={COMPUTED_PROPS}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '460px', overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>
              {() => (
                <GlareHover width="min(360px, 82vw)" borderRadius="20px" {...(settings() as GlareHoverProps)}>
                  <img
                    src={photo()}
                    alt=""
                    draggable="false"
                    style={{ width: '100%', 'aspect-ratio': '3 / 2', 'object-fit': 'cover', display: 'block' }}
                  />
                </GlareHover>
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Glare Color"
              color={settings().glareColor}
              onChange={v => updateProp('glareColor', v)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings().mode}
              onChange={v => updateProp('mode', v)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings().variant}
              onChange={v => updateProp('variant', v)}
            />
            <PreviewSelect
              title="Blend"
              options={BLEND_OPTIONS}
              value={settings().blendMode}
              onChange={v => updateProp('blendMode', v)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings().glareOpacity}
              onChange={v => updateProp('glareOpacity', v)}
            />
            <PreviewSlider
              title="Size"
              min={5}
              max={80}
              step={1}
              value={settings().glareSize}
              valueUnit="%"
              onChange={v => updateProp('glareSize', v)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings().softness}
              onChange={v => updateProp('softness', v)}
            />
            <PreviewSlider
              title="Angle"
              min={-90}
              max={90}
              step={1}
              value={settings().glareAngle}
              valueUnit="°"
              onChange={v => updateProp('glareAngle', v)}
            />
            <PreviewSlider
              title="Duration"
              min={200}
              max={2000}
              step={50}
              value={settings().transitionDuration}
              valueUnit="ms"
              onChange={v => updateProp('transitionDuration', v)}
            />
            <Show when={settings().mode === 'loop'}>
              <PreviewSlider
                title="Interval"
                min={1}
                max={8}
                step={0.5}
                value={settings().interval}
                valueUnit="s"
                onChange={v => updateProp('interval', v)}
              />
            </Show>
            <PreviewSwitch
              title="Rim Glint"
              isChecked={settings().rimGlint}
              onChange={v => updateProp('rimGlint', v)}
            />
            <Show when={settings().mode === 'hover'}>
              <PreviewSwitch
                title="Play Once"
                isChecked={settings().playOnce}
                onChange={v => updateProp('playOnce', v)}
              />
            </Show>
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={v => {
                updateProp('intro', v);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={glareHover} componentName="GlareHover" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
