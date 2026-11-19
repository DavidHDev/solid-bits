import { Show, createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import DepthText, { type DepthTextProps } from '@/content/TextAnimations/DepthText/DepthText';
import { depthText } from '@/constants/code/TextAnimations/depthTextCode';

const SIZE_COMPACT = 'clamp(2.5rem, 9cqi, 5.5rem)';
const SIZE_HERO = 'clamp(3rem, 12cqi, 7rem)';
const SIZE_BILLBOARD = 'clamp(3.5rem, 15cqi, 8.5rem)';

const LOOK = {
  depthColor: '#0aa0ef',
  gradientDepth: false,
  hoverPush: 0.5,
  float: false,
  tilt: 7.5,
  smoothing: 0.14,
  orbitSpeed: 0.35,
  fontSize: SIZE_HERO,
  fontWeight: 500,
  layers: 34,
  depth: 2.4,
  perspective: 900,
  shadow: true,
  outline: false
};

const PRESETS: Record<string, typeof LOOK> = {
  extrude: { ...LOOK },
  fade: {
    ...LOOK,
    depthColor: '#ff5a1f',
    gradientDepth: true,
    hoverPush: 0.65,
    tilt: 10,
    layers: 56,
    depth: 2.6
  },
  float: {
    ...LOOK,
    depthColor: '#a1a1aa',
    hoverPush: 0.4,
    float: true,
    tilt: 8,
    fontSize: SIZE_BILLBOARD,
    layers: 48,
    depth: 2.2
  },
  contour: {
    ...LOOK,
    depthColor: '#38bdf8',
    gradientDepth: true,
    hoverPush: 0.8,
    float: true,
    tilt: 10,
    fontWeight: 400,
    layers: 18,
    depth: 4.4,
    shadow: false,
    outline: true
  }
};

const DEFAULT_PROPS = {
  preset: 'extrude',
  text: 'Elevate',
  faceColor: '',
  ...LOOK,
  pointerTracking: true,
  autoOrbit: true,
  intro: true
};

const PRESET_OPTIONS = [
  { value: 'extrude', label: 'Extrude' },
  { value: 'fade', label: 'Fade' },
  { value: 'float', label: 'Float' },
  { value: 'contour', label: 'Contour' }
];

const FONT_WEIGHT_OPTIONS = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' }
];

const FONT_SIZE_OPTIONS = [
  { value: SIZE_COMPACT, label: 'Compact' },
  { value: SIZE_HERO, label: 'Hero' },
  { value: SIZE_BILLBOARD, label: 'Billboard' }
];

const propData: PropRow[] = [
  {
    name: 'text',
    type: 'string',
    default: '"Elevate"',
    description: 'The word or short phrase rendered as extruded type.'
  },
  {
    name: 'layers',
    type: 'number',
    default: '34',
    description: 'Number of stacked copies that form the extrusion. Clamped to protect the DOM.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '2.4',
    description: 'Spacing in pixels between each layer of the extrusion.'
  },
  {
    name: 'faceColor',
    type: 'string',
    default: '"currentColor"',
    description: 'Color of the crisp front face. Follows the surrounding text color by default.'
  },
  {
    name: 'depthColor',
    type: 'string',
    default: '"#0aa0ef"',
    description: 'Tint the extrusion fades into toward the back.'
  },
  {
    name: 'gradientDepth',
    type: 'boolean',
    default: 'false',
    description:
      'Paints the extrusion in the depth color right behind the face and fades it out to the background toward the back.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '7.5',
    description: 'Resting angle and maximum pointer-driven rotation, in degrees.'
  },
  {
    name: 'pointerTracking',
    type: 'boolean',
    default: 'true',
    description: 'Enables smoothed pointer parallax on fine pointer devices.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.14',
    description: 'Damping amount used to ease rotation toward the pointer target.'
  },
  {
    name: 'perspective',
    type: 'number',
    default: '900',
    description: 'Perspective distance in pixels for the 3D stack.'
  },
  {
    name: 'autoOrbit',
    type: 'boolean',
    default: 'true',
    description: 'Adds a subtle orbit when pointer tracking is unavailable or idle.'
  },
  {
    name: 'orbitSpeed',
    type: 'number',
    default: '0.35',
    description: 'Speed of the fallback orbit in cycles per second.'
  },
  {
    name: 'hoverPush',
    type: 'number',
    default: '0',
    description:
      'How far hovering presses the text into the page, from 0 to 1. The extrusion compresses on a spring, pressing pushes a little deeper and releasing bounces back. 0 turns it off.'
  },
  {
    name: 'float',
    type: 'boolean',
    default: 'false',
    description: 'Lets the text bob and sway gently while it is not hovered.'
  },
  {
    name: 'fontSize',
    type: 'string',
    default: '"clamp(3rem, 12vw, 7rem)"',
    description: 'CSS font-size value for the display word.'
  },
  {
    name: 'fontWeight',
    type: 'number | string',
    default: '500',
    description: 'Font weight used for every layer.'
  },
  {
    name: 'shadow',
    type: 'boolean',
    default: 'true',
    description: 'Casts a soft drop shadow behind the extrusion.'
  },
  {
    name: 'outline',
    type: 'boolean',
    default: 'false',
    description: 'Draws the extrusion as stacked outlines instead of solid layers.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Grows the extrusion out from the flat face on mount.'
  },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Optional class name for the outer wrapper.'
  },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: '{}',
    description: 'Optional inline styles for the outer wrapper.'
  }
];

export default function DepthTextDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, faceColor: _faceColor, ...rest } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => {
    const { faceColor } = props();
    return faceColor ? { faceColor } : {};
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              'min-height': '420px',
              'max-height': '460px',
              overflow: 'hidden',
              'margin-bottom': '24px',
              'container-type': 'inline-size'
            }}
          >
            <Show when={settings().intro}>
              <RefreshButton onClick={forceRerender} />
            </Show>
            <div
              style={{ position: 'relative', 'text-align': 'center', 'padding-left': '32px', 'padding-right': '32px' }}
            >
              <Keyed token={`${props().preset}-${rerenderKey()}`}>
                {() => (
                  <DepthText {...(settings() as DepthTextProps)} faceColor={props().faceColor || 'currentColor'} />
                )}
              </Keyed>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewInput
              title="Text"
              value={settings().text}
              placeholder="Your word"
              maxLength={12}
              onChange={value => updateProp('text', value)}
            />
            <PreviewColorPickerCustom
              title="Face Color"
              color={props().faceColor || ink()}
              onChange={value => updateProp('faceColor', value)}
            />
            <PreviewColorPickerCustom
              title="Depth Color"
              color={settings().depthColor}
              onChange={value => updateProp('depthColor', value)}
            />
            <PreviewSwitch
              title="Gradient Depth"
              isChecked={settings().gradientDepth}
              onChange={checked => updateProp('gradientDepth', checked)}
            />
            <PreviewSlider
              title="Hover Push"
              min={0}
              max={1}
              step={0.05}
              value={settings().hoverPush}
              onChange={value => updateProp('hoverPush', value)}
            />
            <PreviewSwitch
              title="Float"
              isChecked={settings().float}
              onChange={checked => updateProp('float', checked)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={12}
              step={0.5}
              value={settings().tilt}
              valueUnit="°"
              onChange={value => updateProp('tilt', value)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0.04}
              max={0.3}
              step={0.01}
              value={settings().smoothing}
              onChange={value => updateProp('smoothing', value)}
            />
            <PreviewSlider
              title="Orbit Speed"
              min={0.05}
              max={1}
              step={0.05}
              value={settings().orbitSpeed}
              isDisabled={!settings().autoOrbit}
              onChange={value => updateProp('orbitSpeed', value)}
            />
            <PreviewSwitch
              title="Pointer Tracking"
              isChecked={settings().pointerTracking}
              onChange={checked => updateProp('pointerTracking', checked)}
            />
            <PreviewSwitch
              title="Auto Orbit"
              isChecked={settings().autoOrbit}
              onChange={checked => updateProp('autoOrbit', checked)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={checked => {
                updateProp('intro', checked);
                forceRerender();
              }}
            />
            <PreviewSelect
              title="Font Size"
              options={FONT_SIZE_OPTIONS}
              value={settings().fontSize}
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSelect
              title="Weight"
              options={FONT_WEIGHT_OPTIONS}
              value={settings().fontWeight}
              onChange={value => updateProp('fontWeight', Number(value))}
            />
            <PreviewSlider
              title="Layers"
              min={4}
              max={56}
              step={1}
              value={settings().layers}
              onChange={value => updateProp('layers', value)}
            />
            <PreviewSlider
              title="Depth"
              min={0.8}
              max={8}
              step={0.1}
              value={settings().depth}
              valueUnit="px"
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={450}
              max={1500}
              step={25}
              value={settings().perspective}
              valueUnit="px"
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSwitch
              title="Shadow"
              isChecked={settings().shadow}
              onChange={checked => updateProp('shadow', checked)}
            />
            <PreviewSwitch
              title="Outline"
              isChecked={settings().outline}
              onChange={checked => updateProp('outline', checked)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={depthText} componentName="DepthText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
