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
import { isLight } from '@/hooks/useTheme';

import PlasmaWave from '@/content/Backgrounds/PlasmaWave/PlasmaWave';
import { plasmaWave } from '@/constants/code/Backgrounds/plasmaWaveCode';
import { DEFAULT_PROPS, PRESET_OPTIONS, presetProps } from './presets/PlasmaWave';

const propData: PropRow[] = [
  {
    name: 'colors',
    type: '[string, string]',
    default: "['#0aa0ef', '#06B6D4']",
    description: 'Colors of the two waves of plasma.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Overall speed of the animation.' },
  { name: 'speed1', type: 'number', default: '0.05', description: 'How fast the first wave travels.' },
  { name: 'speed2', type: 'number', default: '0.05', description: 'How fast the second wave travels.' },
  {
    name: 'dir2',
    type: 'number',
    default: '1',
    description: 'Direction of the second wave. Use -1 to make it travel against the first.'
  },
  { name: 'bend1', type: 'number', default: '1', description: 'How far the first wave curls around its path.' },
  { name: 'bend2', type: 'number', default: '0.5', description: 'How far the second wave curls around its path.' },
  { name: 'thickness', type: 'number', default: '0.3', description: 'Thickness of the plasma ribbons.' },
  {
    name: 'focalLength',
    type: 'number',
    default: '1.25',
    description: 'Camera lens. Lower values give a wider, deeper view.'
  },
  { name: 'rotationDeg', type: 'number', default: '0', description: 'Rotation of the whole effect, in degrees.' },
  { name: 'xOffset', type: 'number', default: '0', description: 'Horizontal shift of the view, in px.' },
  { name: 'yOffset', type: 'number', default: '0', description: 'Vertical shift of the view, in px.' },
  { name: 'brightness', type: 'number', default: '1', description: 'Brightness of the plasma.' },
  { name: 'glow', type: 'number', default: '1', description: 'Strength of the soft light spilling around the plasma.' },
  {
    name: 'core',
    type: 'number',
    default: '0.6',
    description: 'How white-hot the brightest parts of the plasma get, from 0 to 1.'
  },
  { name: 'grain', type: 'number', default: '0.03', description: 'Strength of the film grain.' },
  {
    name: 'quality',
    type: 'number',
    default: '1',
    description: 'Detail of the plasma, from 0.25 to 1. Lower values render faster on slow devices.'
  },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'Swells and brightens the plasma near the cursor.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Unfolds the plasma and fades it in on mount.' },
  { name: 'fade', type: 'number', default: '0', description: 'Fades the edges into the page, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the whole effect.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the plasma as glowing glass with white cores for light backgrounds.'
  },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

export default function PlasmaWaveDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { light: isLight(), defaults: defaultProps() }), preset: value });
  };

  const setColor = (index: number, value: string) => {
    const next = [...settings().colors];
    next[index] = value;
    updateProp('colors', next);
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
            <Keyed token={rerenderKey()}>{() => <PlasmaWave {...settings()} />}</Keyed>
            <BackgroundContent headline="Plasma that glows and flows behind your hero." />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Color 1"
              color={settings().colors[0]}
              onChange={value => setColor(0, value)}
            />
            <PreviewColorPickerCustom
              title="Color 2"
              color={settings().colors[1] ?? settings().colors[0]}
              onChange={value => setColor(1, value)}
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
              title="Speed 1"
              min={0}
              max={0.2}
              step={0.005}
              value={settings().speed1}
              onChange={value => updateProp('speed1', value)}
            />
            <PreviewSlider
              title="Speed 2"
              min={0}
              max={0.2}
              step={0.005}
              value={settings().speed2}
              onChange={value => updateProp('speed2', value)}
            />
            <PreviewSlider
              title="Direction 2"
              min={-1}
              max={1}
              step={0.1}
              value={settings().dir2}
              onChange={value => updateProp('dir2', value)}
            />
            <PreviewSlider
              title="Bend 1"
              min={0}
              max={3}
              step={0.05}
              value={settings().bend1}
              onChange={value => updateProp('bend1', value)}
            />
            <PreviewSlider
              title="Bend 2"
              min={0}
              max={3}
              step={0.05}
              value={settings().bend2}
              onChange={value => updateProp('bend2', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.1}
              max={0.6}
              step={0.01}
              value={settings().thickness}
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Focal Length"
              min={0.3}
              max={2}
              step={0.05}
              value={settings().focalLength}
              onChange={value => updateProp('focalLength', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={360}
              step={1}
              value={settings().rotationDeg}
              valueUnit="°"
              onChange={value => updateProp('rotationDeg', value)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.3}
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
              title="Core"
              min={0}
              max={1}
              step={0.05}
              value={settings().core}
              onChange={value => updateProp('core', value)}
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
            <PreviewSlider
              title="Quality"
              min={0.25}
              max={1}
              step={0.05}
              value={settings().quality}
              onChange={value => updateProp('quality', value)}
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
          <CodeExample codeObject={plasmaWave} componentName="PlasmaWave" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
