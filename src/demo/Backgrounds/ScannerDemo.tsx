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

import Scanner, { type ScannerDirection, type ScannerProps } from '@/content/Backgrounds/Scanner/Scanner';
import { scanner } from '@/constants/code/Backgrounds/scannerCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/Scanner';

type MouseMode = 'repel' | 'attract';
type ClickEffect = 'ping' | 'none';

const DEFAULT_PROPS = {
  preset: 'scanner',
  ...LOOK,
  scanline: true,
  scanlineIntensity: 0.5,
  grain: true,
  grainIntensity: 0.04,
  opacity: 1,
  mouseInteraction: true,
  mouseMode: 'repel' as MouseMode,
  mouseRadius: 0.5,
  mouseStrength: 0.7,
  clickEffect: 'ping' as ClickEffect,
  intro: true,
  lightMode: false
};

const DIRECTION_OPTIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'diagonal', label: 'Diagonal' }
];

const MOUSE_OPTIONS = [
  { value: 'repel', label: 'Repel' },
  { value: 'attract', label: 'Attract' }
];

const CLICK_OPTIONS = [
  { value: 'ping', label: 'Ping' },
  { value: 'none', label: 'None' }
];

const propData: PropRow[] = [
  { name: 'color1', type: 'string', default: "'#0aa0ef'", description: 'Color of the resting lines.' },
  {
    name: 'color2',
    type: 'string',
    default: "'#6ec9f7'",
    description: 'Color the lines take as the scan lights them.'
  },
  { name: 'color3', type: 'string', default: "'#FFFFFF'", description: 'Color of the hot scan head itself.' },
  { name: 'speed', type: 'number', default: '0.5', description: 'How fast the wave moves through the lines.' },
  { name: 'sweepSpeed', type: 'number', default: '0.25', description: 'How fast the scan travels across.' },
  {
    name: 'sweepWidth',
    type: 'number',
    default: '1.6',
    description: 'Distance between one scan and the next. Larger values leave longer dark gaps.'
  },
  {
    name: 'trail',
    type: 'number',
    default: '0.5',
    description: 'Length of the afterglow the scan leaves behind, from 0 to 1.'
  },
  { name: 'reverse', type: 'boolean', default: 'false', description: 'Runs the scan in the opposite direction.' },
  { name: 'scale', type: 'number', default: '1.5', description: 'Zooms the whole pattern in or out.' },
  { name: 'frequency', type: 'number', default: '2', description: 'How many waves fit across the field.' },
  {
    name: 'ripple',
    type: 'number',
    default: '0.22',
    description: 'How tall the waves are. 0 keeps the lines straight.'
  },
  { name: 'bandDensity', type: 'number', default: '11', description: 'How many lines fill the field.' },
  {
    name: 'lineWidth',
    type: 'number',
    default: '1.2',
    description: 'Width of the resting lines, in px. Lit lines get thicker.'
  },
  { name: 'glow', type: 'number', default: '0.6', description: 'Soft glow around the lit lines.' },
  {
    name: 'scanDirection',
    type: "'vertical' | 'horizontal' | 'diagonal'",
    default: "'vertical'",
    description: 'Direction the scan travels in. The lines run across it.'
  },
  {
    name: 'colorSpread',
    type: 'number',
    default: '0.7',
    description: 'Fine color fringes on the edges of lit lines, from 0 to 1.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Overall brightness of the lines.' },
  {
    name: 'vignette',
    type: 'number',
    default: '0.3',
    description: 'Fades the lines out toward the edges, from 0 to 1.'
  },
  {
    name: 'scanline',
    type: 'boolean',
    default: 'true',
    description: 'Turns on the CRT look: fine horizontal scanlines across the field.'
  },
  {
    name: 'scanlineIntensity',
    type: 'number',
    default: '0.5',
    description: 'How dark the scanlines are, from 0 to 1.'
  },
  { name: 'grain', type: 'boolean', default: 'true', description: 'Adds a little film grain.' },
  { name: 'grainIntensity', type: 'number', default: '0.04', description: 'Strength of the grain.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity of the effect.' },
  {
    name: 'mouseInteraction',
    type: 'boolean',
    default: 'true',
    description: 'The lines bend around the cursor and light up near it.'
  },
  {
    name: 'mouseMode',
    type: "'repel' | 'attract'",
    default: "'repel'",
    description: 'Lines part around the cursor, or pinch in toward it.'
  },
  { name: 'mouseRadius', type: 'number', default: '0.5', description: 'Size of the area around the cursor.' },
  { name: 'mouseStrength', type: 'number', default: '0.7', description: 'How strongly the cursor bends the lines.' },
  {
    name: 'clickEffect',
    type: "'ping' | 'none'",
    default: "'ping'",
    description: 'Clicking sends a ring of light rippling out through the lines.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'The lines power on with a first scan on mount.' },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Draws the lines as crisp ink for light backgrounds instead of glowing light.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function ScannerDemo() {
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
            <Keyed token={rerenderKey()}>{() => <Scanner {...(settings() as ScannerProps)} />}</Keyed>
            <BackgroundContent headline="Signals, sweeping quietly across the screen." />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Lines"
              color={settings().color1}
              onChange={value => updateProp('color1', value)}
            />
            <PreviewColorPickerCustom
              title="Lit Lines"
              color={settings().color2}
              onChange={value => updateProp('color2', value)}
            />
            <PreviewColorPickerCustom
              title="Scan Head"
              color={settings().color3}
              onChange={value => updateProp('color3', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().scanDirection}
              onChange={(value: ScannerDirection) => updateProp('scanDirection', value)}
            />
            <PreviewSelect
              title="Mouse Mode"
              options={MOUSE_OPTIONS}
              value={settings().mouseMode}
              onChange={(value: MouseMode) => updateProp('mouseMode', value)}
            />
            <PreviewSelect
              title="Click Effect"
              options={CLICK_OPTIONS}
              value={settings().clickEffect}
              onChange={(value: ClickEffect) => updateProp('clickEffect', value)}
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
              title="Sweep Speed"
              min={0}
              max={1.5}
              step={0.01}
              value={settings().sweepSpeed}
              onChange={value => updateProp('sweepSpeed', value)}
            />
            <PreviewSlider
              title="Sweep Width"
              min={0.4}
              max={4}
              step={0.05}
              value={settings().sweepWidth}
              onChange={value => updateProp('sweepWidth', value)}
            />
            <PreviewSlider
              title="Trail"
              min={0}
              max={1}
              step={0.01}
              value={settings().trail}
              onChange={value => updateProp('trail', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={3}
              step={0.05}
              value={settings().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Frequency"
              min={0.2}
              max={4}
              step={0.05}
              value={settings().frequency}
              onChange={value => updateProp('frequency', value)}
            />
            <PreviewSlider
              title="Ripple"
              min={0}
              max={1}
              step={0.01}
              value={settings().ripple}
              onChange={value => updateProp('ripple', value)}
            />
            <PreviewSlider
              title="Band Density"
              min={3}
              max={40}
              step={0.5}
              value={settings().bandDensity}
              onChange={value => updateProp('bandDensity', value)}
            />
            <PreviewSlider
              title="Line Width"
              min={0.4}
              max={4}
              step={0.1}
              value={settings().lineWidth}
              valueUnit="px"
              onChange={value => updateProp('lineWidth', value)}
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
              title="Color Spread"
              min={0}
              max={1}
              step={0.05}
              value={settings().colorSpread}
              onChange={value => updateProp('colorSpread', value)}
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
              title="Vignette"
              min={0}
              max={1}
              step={0.05}
              value={settings().vignette}
              onChange={value => updateProp('vignette', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.2}
              step={0.01}
              value={settings().grainIntensity}
              isDisabled={!settings().grain}
              onChange={value => updateProp('grainIntensity', value)}
            />
            <PreviewSlider
              title="Scanlines"
              min={0}
              max={1}
              step={0.05}
              value={settings().scanlineIntensity}
              isDisabled={!settings().scanline}
              onChange={value => updateProp('scanlineIntensity', value)}
            />
            <PreviewSlider
              title="Mouse Radius"
              min={0.1}
              max={1.5}
              step={0.05}
              value={settings().mouseRadius}
              isDisabled={!settings().mouseInteraction}
              onChange={value => updateProp('mouseRadius', value)}
            />
            <PreviewSlider
              title="Mouse Strength"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().mouseStrength}
              isDisabled={!settings().mouseInteraction}
              onChange={value => updateProp('mouseStrength', value)}
            />
            <PreviewSwitch
              title="Reverse"
              isChecked={settings().reverse}
              onChange={value => updateProp('reverse', value)}
            />
            <PreviewSwitch
              title="Mouse Interaction"
              isChecked={settings().mouseInteraction}
              onChange={value => updateProp('mouseInteraction', value)}
            />
            <PreviewSwitch title="Grain" isChecked={settings().grain} onChange={value => updateProp('grain', value)} />
            <PreviewSwitch
              title="Scanline"
              isChecked={settings().scanline}
              onChange={value => updateProp('scanline', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scanner} componentName="Scanner" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
