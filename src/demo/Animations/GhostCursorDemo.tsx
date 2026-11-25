import { createMemo } from 'solid-js';
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

import GhostCursor, { type GhostCursorProps } from '@/content/Animations/GhostCursor/GhostCursor';
import { ghostCursor } from '@/constants/code/Animations/ghostCursorCode';
import { LOOK, PRESET_OPTIONS, presetProps } from './presets/GhostCursor';

const DEFAULT_PROPS = {
  preset: 'phantom',
  ...LOOK,
  edgeIntensity: 0,
  fadeDelayMs: 1000,
  fadeDurationMs: 1500,
  clickPuff: true,
  intro: true
};

const LIGHT_SWAP: Record<string, string> = {
  '#6ec9f7': '#0977ae',
  '#5aa9ff': '#1f5fbf',
  '#3dbcff': '#0c9dea',
  '#e4e4e7': '#52525b',
  '#6ebde7': '#056496'
};

const DARK_SWAP: Record<string, string> = Object.fromEntries(
  Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark])
);

const propData: PropRow[] = [
  { name: 'color', type: 'string', default: "'#6ec9f7'", description: 'Color of the smoke. Dense parts glow lighter.' },
  { name: 'size', type: 'number', default: '80', description: 'Size of the ghost, in px.' },
  {
    name: 'trailLength',
    type: 'number',
    default: '50',
    description: 'How long the smoke lingers behind the cursor, from 1 to 200.'
  },
  {
    name: 'inertia',
    type: 'number',
    default: '0.5',
    description: 'How far the ghost floats behind the cursor and glides on when the cursor leaves, from 0 to 0.99.'
  },
  {
    name: 'turbulence',
    type: 'number',
    default: '0.5',
    description: 'How much the smoke swirls and curls as it drifts, from 0 to 2.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '0.3',
    description: 'How fast the smoke rises. Negative values let it sink.'
  },
  {
    name: 'detail',
    type: 'number',
    default: '1',
    description: 'How wispy the smoke is, from 0 for a soft glow to 1 for billowing wisps.'
  },
  { name: 'brightness', type: 'number', default: '1', description: 'Brightness of the smoke.' },
  { name: 'bloomStrength', type: 'number', default: '0.6', description: 'Strength of the soft glow around the smoke.' },
  { name: 'bloomRadius', type: 'number', default: '1', description: 'How far the glow spreads, from 0 to 3.' },
  {
    name: 'bloomThreshold',
    type: 'number',
    default: '0.025',
    description: 'How bright smoke has to be before it glows. Higher values keep the glow on the core.'
  },
  { name: 'grainIntensity', type: 'number', default: '0.05', description: 'Film grain over the smoke, from 0 to 1.' },
  {
    name: 'edgeIntensity',
    type: 'number',
    default: '0',
    description: 'Fades the smoke out toward the edges of the area, from 0 to 1.'
  },
  { name: 'clickPuff', type: 'boolean', default: 'true', description: 'Clicking releases a puff of smoke.' },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The ghost floats across once when it first appears, before the cursor arrives.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Glowing smoke for dark pages, or soft ink smoke for light ones.'
  },
  {
    name: 'mixBlendMode',
    type: 'string',
    default: "'screen' (dark), 'normal' (light)",
    description: 'CSS blend mode for the canvas.'
  },
  {
    name: 'fadeDelayMs',
    type: 'number',
    default: '1000 (500 on touch)',
    description: 'Time after the cursor stops before the ghost starts to fade, in ms.'
  },
  {
    name: 'fadeDurationMs',
    type: 'number',
    default: '1500 (1000 on touch)',
    description: 'How long the fade takes, in ms.'
  },
  {
    name: 'maxDevicePixelRatio',
    type: 'number',
    default: '2',
    description: 'Highest pixel ratio the canvas renders at.'
  },
  {
    name: 'targetPixels',
    type: 'number',
    default: '600000 (300000 on touch)',
    description: 'Pixel budget for the smoke. Large areas render it at a lower resolution to stay fast.'
  },
  { name: 'zIndex', type: 'number', default: '10', description: 'Stacking order of the effect over your content.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function GhostCursorDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, color: _color, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const shown = createMemo(() => {
    const picked = `#${String(props().color || LOOK.color)
      .replace(/^#/, '')
      .toLowerCase()}`;
    const swap = theme() === 'light' ? LIGHT_SWAP : DARK_SWAP;
    return swap[picked] ?? picked;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps() }), preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'color']}
      computedProps={{ color: shown(), ...(theme() === 'light' ? { theme: 'light' } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden', cursor: 'crosshair' }}
          >
            <Keyed token={rerenderKey()}>
              {() => <GhostCursor theme={theme()} color={shown()} {...(settings() as GhostCursorProps)} />}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom title="Color" color={shown()} onChange={v => updateProp('color', v)} />
            <PreviewSlider
              title="Size"
              min={30}
              max={180}
              step={1}
              value={settings().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Trail Length"
              min={5}
              max={150}
              step={1}
              value={settings().trailLength}
              onChange={v => updateProp('trailLength', v)}
            />
            <PreviewSlider
              title="Inertia"
              min={0}
              max={0.95}
              step={0.01}
              value={settings().inertia}
              onChange={v => updateProp('inertia', v)}
            />
            <PreviewSlider
              title="Turbulence"
              min={0}
              max={2}
              step={0.05}
              value={settings().turbulence}
              onChange={v => updateProp('turbulence', v)}
            />
            <PreviewSlider
              title="Drift"
              min={-1}
              max={1.5}
              step={0.05}
              value={settings().drift}
              onChange={v => updateProp('drift', v)}
            />
            <PreviewSlider
              title="Detail"
              min={0}
              max={1}
              step={0.05}
              value={settings().detail}
              onChange={v => updateProp('detail', v)}
            />
            <PreviewSlider
              title="Brightness"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings().brightness}
              onChange={v => updateProp('brightness', v)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={settings().bloomStrength}
              onChange={v => updateProp('bloomStrength', v)}
            />
            <PreviewSlider
              title="Glow Size"
              min={0}
              max={3}
              step={0.05}
              value={settings().bloomRadius}
              onChange={v => updateProp('bloomRadius', v)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={0.4}
              step={0.01}
              value={settings().grainIntensity}
              onChange={v => updateProp('grainIntensity', v)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings().edgeIntensity}
              onChange={v => updateProp('edgeIntensity', v)}
            />
            <PreviewSlider
              title="Fade Delay"
              min={0}
              max={3000}
              step={100}
              value={settings().fadeDelayMs}
              valueUnit="ms"
              onChange={v => updateProp('fadeDelayMs', v)}
            />
            <PreviewSlider
              title="Fade Duration"
              min={100}
              max={4000}
              step={100}
              value={settings().fadeDurationMs}
              valueUnit="ms"
              onChange={v => updateProp('fadeDurationMs', v)}
            />
            <PreviewSwitch
              title="Click Puff"
              isChecked={settings().clickPuff}
              onChange={v => updateProp('clickPuff', v)}
            />
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
          <CodeExample codeObject={ghostCursor} componentName="GhostCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
