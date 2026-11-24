import { For, createMemo } from 'solid-js';
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

import Aurora from '@/content/Backgrounds/Aurora/Aurora';
import { aurora } from '@/constants/code/Backgrounds/auroraCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/Aurora';

const COLOR_TITLES = ['Color 1', 'Color 2', 'Color 3'];

const DIRECTION_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' }
];

const propData: PropRow[] = [
  {
    name: 'colorStops',
    type: 'string[]',
    default: "['#0aa0ef', '#67cbff', '#0aa0ef']",
    description: 'Two to five colors that blend across the aurora from left to right.'
  },
  { name: 'amplitude', type: 'number', default: '1', description: 'How tall the waves along the edge are.' },
  { name: 'blend', type: 'number', default: '0.5', description: 'How softly the edge fades out, from 0 to 1.' },
  {
    name: 'height',
    type: 'number',
    default: '0.45',
    description: 'How far the aurora reaches into the container, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the flowing motion.' },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the waves. Lower values make broader, calmer shapes.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0.6',
    description: 'How far the light spills softly past the edge.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the light.' },
  {
    name: 'layers',
    type: 'number',
    default: '1',
    description: 'Number of curtains, from 1 to 3. Extra ones glow fainter behind for depth.'
  },
  {
    name: 'direction',
    type: "'top' | 'bottom'",
    default: "'top'",
    description: 'Whether the aurora hangs from the top or rises from the bottom.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The light gently reaches toward the cursor.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fades the aurora in as it unfurls on mount.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the aurora as soft pastel light for white backgrounds.'
  },
  {
    name: 'time',
    type: 'number',
    default: '-',
    description: 'Drives the animation from your own clock, for example scroll progress, instead of real time.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function AuroraDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps() }), preset: value });
  };

  const setColor = (index: number, value: string) => {
    const next = [...settings().colorStops];
    next[index] = value;
    updateProp('colorStops', next);
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
            <Keyed token={rerenderKey()}>{() => <Aurora {...settings()} />}</Keyed>
            <BackgroundContent headline="Bring the Arctic to you, with one line of code" />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <For each={COLOR_TITLES}>
              {(title, index) => (
                <PreviewColorPickerCustom
                  title={title}
                  color={settings().colorStops[index()] ?? settings().colorStops[0]}
                  onChange={value => setColor(index(), value)}
                />
              )}
            </For>
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().direction}
              onChange={(value: 'top' | 'bottom') => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Height"
              min={0.1}
              max={0.9}
              step={0.01}
              value={settings().height}
              onChange={value => updateProp('height', value)}
            />
            <PreviewSlider
              title="Amplitude"
              min={0}
              max={2.5}
              step={0.05}
              value={settings().amplitude}
              onChange={value => updateProp('amplitude', value)}
            />
            <PreviewSlider
              title="Blend"
              min={0}
              max={1}
              step={0.01}
              value={settings().blend}
              onChange={value => updateProp('blend', value)}
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
              title="Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={settings().scale}
              onChange={value => updateProp('scale', value)}
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
              title="Brightness"
              min={0.2}
              max={2}
              step={0.05}
              value={settings().brightness}
              onChange={value => updateProp('brightness', value)}
            />
            <PreviewSlider
              title="Layers"
              min={1}
              max={3}
              step={1}
              value={settings().layers}
              onChange={value => updateProp('layers', value)}
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
          <CodeExample codeObject={aurora} componentName="Aurora" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
