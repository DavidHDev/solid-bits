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
import { useColorModeValue } from '@/hooks/useTheme';

import MagicRings, { type MagicRingsProps } from '@/content/Backgrounds/MagicRings/MagicRings';
import { magicRings } from '@/constants/code/Backgrounds/magicRingsCode';
import { LOOK, PRESET_OPTIONS, presetProps, type RingMotion } from './presets/MagicRings';

const DEFAULT_PROPS = {
  preset: 'portal',
  ...LOOK,
  opacity: 1,
  followMouse: false,
  mouseInfluence: 0.2,
  hoverScale: 1.2,
  hoverIntensity: 1,
  parallax: 0.05,
  clickBurst: true,
  intro: true
};

const LIGHT_SWAP: Record<string, string> = {
  '#6ec9f7': '#2f7fbf',
  '#0aa0ef': '#0771a6',
  '#ffffff': '#3f4246',
  '#a1a4a8': '#6f7378',
  '#22d3ee': '#0891b2',
  '#3b82f6': '#2563eb',
  '#e0edff': '#505459',
  '#4dc0fc': '#0690d9',
  '#16abf9': '#0c9dea',
  '#3cb9fb': '#c2410c'
};

const DARK_SWAP: Record<string, string> = Object.fromEntries(
  Object.entries(LIGHT_SWAP).map(([dark, light]) => [light, dark])
);

const MOTION_OPTIONS = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'breathe', label: 'Breathe' }
];

const propData: PropRow[] = [
  { name: 'color', type: 'string', default: "'#6ec9f7'", description: 'Color of the innermost ring.' },
  {
    name: 'colorTwo',
    type: 'string',
    default: "'#0aa0ef'",
    description: 'Color of the outermost ring. The rings in between blend from one to the other.'
  },
  { name: 'ringCount', type: 'number', default: '6', description: 'Number of rings, from 1 to 12.' },
  {
    name: 'motion',
    type: "'pulse' | 'ripple' | 'breathe'",
    default: "'pulse'",
    description:
      'How the rings move: a wave that lights them one by one, rings flowing outward from the center, or all rings gently breathing.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Animation speed. 0 freezes the rings.' },
  {
    name: 'lineThickness',
    type: 'number',
    default: '2',
    description: 'Thickness of the rings in px. Rings are thickest at the sides and taper toward the top and bottom.'
  },
  { name: 'glow', type: 'number', default: '1', description: 'Size and strength of the glow around the rings.' },
  {
    name: 'baseRadius',
    type: 'number',
    default: '0.35',
    description: 'Radius of the innermost ring, as a share of the smaller side of the container.'
  },
  { name: 'radiusStep', type: 'number', default: '0.1', description: 'Space between neighboring rings.' },
  {
    name: 'expansion',
    type: 'number',
    default: '0.1',
    description: 'How far each ring drifts outward while it glows.'
  },
  {
    name: 'taper',
    type: 'number',
    default: '1.5',
    description: 'How quickly outer rings shorten into side arcs. 1 keeps every ring the same length.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotates the whole pattern, in degrees.' },
  {
    name: 'spin',
    type: 'number',
    default: '0',
    description:
      'Spins the arcs around the center, neighbors turning in opposite directions. Negative values reverse it.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '0',
    description: 'Leans the rings back in 3D, in degrees, like a portal seen at an angle.'
  },
  {
    name: 'dispersion',
    type: 'number',
    default: '0',
    description: 'Splits each ring into rainbow fringes like light through a prism, from 0 to 1.'
  },
  { name: 'grain', type: 'number', default: '0', description: 'Film grain over the glow, from 0 to 1.' },
  { name: 'opacity', type: 'number', default: '1', description: 'Overall opacity, from 0 to 1.' },
  {
    name: 'followMouse',
    type: 'boolean',
    default: 'false',
    description: 'The rings drift toward the cursor.'
  },
  {
    name: 'mouseInfluence',
    type: 'number',
    default: '0.2',
    description: 'How far the rings drift when followMouse is on.'
  },
  { name: 'hoverScale', type: 'number', default: '1.2', description: 'How much the rings swell on hover.' },
  {
    name: 'hoverIntensity',
    type: 'number',
    default: '1',
    description: 'How much the rings brighten and thicken near the cursor.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '0.05',
    description: 'How much the rings shift and lean with the cursor, outer rings the most, for a sense of depth.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a bright ring racing outward that lights up the rings as it passes.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The rings open from the sides one by one when they mount.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Glowing light for dark pages, or crisp ink with a soft halo for light ones.'
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

const swapColor = (value: string, swap: Record<string, string>) => {
  const key = `#${String(value).replace(/^#/, '').toLowerCase()}`;
  return swap[key] ?? key;
};

export default function MagicRingsDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, color: _color, colorTwo: _colorTwo, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const colors = createMemo(() => {
    const swap = theme() === 'light' ? LIGHT_SWAP : DARK_SWAP;
    return { color: swapColor(props().color, swap), colorTwo: swapColor(props().colorTwo, swap) };
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
      demoOnlyProps={['preset', 'color', 'colorTwo']}
      computedProps={{ ...colors(), ...(theme() === 'light' ? { theme: 'light' } : {}) }}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>
              {() => <MagicRings {...(settings() as MagicRingsProps)} {...colors()} theme={theme()} />}
            </Keyed>
            <BackgroundContent headline="Step through the portal" />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Motion"
              options={MOTION_OPTIONS}
              value={settings().motion}
              onChange={(value: RingMotion) => updateProp('motion', value)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={colors().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Color Two"
              color={colors().colorTwo}
              onChange={value => updateProp('colorTwo', value)}
            />
            <PreviewSlider
              title="Ring Count"
              min={1}
              max={12}
              step={1}
              value={settings().ringCount}
              onChange={value => updateProp('ringCount', value)}
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
              title="Line Thickness"
              min={0.5}
              max={8}
              step={0.5}
              value={settings().lineThickness}
              valueUnit="px"
              onChange={value => updateProp('lineThickness', value)}
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
              title="Base Radius"
              min={0.05}
              max={0.6}
              step={0.01}
              value={settings().baseRadius}
              onChange={value => updateProp('baseRadius', value)}
            />
            <PreviewSlider
              title="Radius Step"
              min={0.02}
              max={0.25}
              step={0.01}
              value={settings().radiusStep}
              onChange={value => updateProp('radiusStep', value)}
            />
            <PreviewSlider
              title="Expansion"
              min={0}
              max={0.4}
              step={0.01}
              value={settings().expansion}
              onChange={value => updateProp('expansion', value)}
            />
            <PreviewSlider
              title="Taper"
              min={1}
              max={3}
              step={0.05}
              value={settings().taper}
              onChange={value => updateProp('taper', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={0}
              max={180}
              step={1}
              value={settings().rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Spin"
              min={-2}
              max={2}
              step={0.05}
              value={settings().spin}
              onChange={value => updateProp('spin', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={-75}
              max={75}
              step={1}
              value={settings().tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Dispersion"
              min={0}
              max={1}
              step={0.05}
              value={settings().dispersion}
              onChange={value => updateProp('dispersion', value)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={1}
              step={0.05}
              value={settings().grain}
              onChange={value => updateProp('grain', value)}
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
              title="Hover Scale"
              min={1}
              max={1.6}
              step={0.05}
              value={settings().hoverScale}
              onChange={value => updateProp('hoverScale', value)}
            />
            <PreviewSlider
              title="Hover Intensity"
              min={0}
              max={2}
              step={0.05}
              value={settings().hoverIntensity}
              onChange={value => updateProp('hoverIntensity', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={0.15}
              step={0.005}
              value={settings().parallax}
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSlider
              title="Mouse Influence"
              min={0}
              max={1}
              step={0.05}
              value={settings().mouseInfluence}
              onChange={value => updateProp('mouseInfluence', value)}
            />
            <PreviewSwitch
              title="Follow Mouse"
              isChecked={settings().followMouse}
              onChange={value => updateProp('followMouse', value)}
            />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings().clickBurst}
              onChange={value => updateProp('clickBurst', value)}
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
          <CodeExample codeObject={magicRings} componentName="MagicRings" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
