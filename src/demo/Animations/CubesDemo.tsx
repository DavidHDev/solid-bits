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

import Cubes, { type CubesProps } from '@/content/Animations/Cubes/Cubes';
import { cubes } from '@/constants/code/Animations/cubesCode';

const LOOK = {
  gridSize: 10,
  gap: 0.18,
  edgeStyle: 'solid',
  edgeWidth: 1,
  faceOpacity: 1,
  shading: 0.6,
  maxAngle: 45,
  radius: 3,
  perspective: 0
};

const DEFAULT_PROPS = {
  preset: 'grid',
  faceColor: '#0c0f13',
  edgeColor: '#ffffff',
  rippleColor: '#ffffff',
  ...LOOK,
  speed: 1,
  bounce: 0.4,
  brush: 1,
  rippleSpeed: 1,
  autoAnimate: true,
  rippleOnClick: true,
  intro: true
};

type DemoProps = typeof DEFAULT_PROPS;

const LIGHT = {
  faceColor: '#ffffff',
  edgeColor: '#17181a',
  rippleColor: '#17181a'
};

const PRESETS: Record<string, Partial<DemoProps>> = {
  grid: LOOK,
  dashed: { ...LOOK, edgeStyle: 'dashed', gap: 0.3 },
  wire: { ...LOOK, faceOpacity: 0, gap: 0.24, maxAngle: 60 },
  dense: { ...LOOK, gridSize: 16, gap: 0.12, radius: 4.5 },
  depth: { ...LOOK, perspective: 0.7, maxAngle: 55, shading: 1, gap: 0.24 }
};

const PRESET_OPTIONS = [
  { value: 'grid', label: 'Grid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'wire', label: 'Wire' },
  { value: 'dense', label: 'Dense' },
  { value: 'depth', label: 'Depth' }
];

const EDGE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'none', label: 'None' }
];

const propData: PropRow[] = [
  { name: 'gridSize', type: 'number', default: '10', description: 'Number of cubes on each side of the grid.' },
  { name: 'gap', type: 'number', default: '0.18', description: 'Space between cubes, as a fraction of a cell.' },
  {
    name: 'faceColor',
    type: 'string',
    default: "'#0c0f13'",
    description: 'Color of the cube faces. Match it to your page background for a clean cut-out look.'
  },
  { name: 'edgeColor', type: 'string', default: "'#ffffff'", description: 'Color of the cube outlines.' },
  { name: 'edgeWidth', type: 'number', default: '1', description: 'Width of the outlines in px.' },
  {
    name: 'edgeStyle',
    type: "'solid' | 'dashed' | 'dotted' | 'none'",
    default: "'solid'",
    description: 'How the cube outlines are drawn.'
  },
  {
    name: 'faceOpacity',
    type: 'number',
    default: '1',
    description: 'Opacity of the faces, from 0 for see-through wireframes to 1 for solid cubes.'
  },
  {
    name: 'shading',
    type: 'number',
    default: '0.6',
    description: 'How much the sides of turned cubes pick up light, so they read as solid 3D shapes.'
  },
  {
    name: 'maxAngle',
    type: 'number',
    default: '45',
    description: 'How far cubes turn to face the cursor, in degrees.'
  },
  { name: 'radius', type: 'number', default: '3', description: 'How far the cursor reaches, in cubes.' },
  { name: 'speed', type: 'number', default: '1', description: 'How quickly cubes respond.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.4',
    description: 'How much cubes overshoot and wobble as they settle, from 0 to 1.'
  },
  {
    name: 'brush',
    type: 'number',
    default: '1',
    description: 'How strongly fast cursor sweeps spin the cubes they pass over.'
  },
  {
    name: 'perspective',
    type: 'number',
    default: '0',
    description: 'Camera perspective, from 0 for a flat front view to 1 for strong depth.'
  },
  {
    name: 'autoAnimate',
    type: 'boolean',
    default: 'true',
    description: 'Drifts a gentle wave across the grid while the cursor is away.'
  },
  {
    name: 'rippleOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ripple through the cubes that lights up their edges.'
  },
  { name: 'rippleColor', type: 'string', default: "'#ffffff'", description: 'Color the ripple lights the cubes with.' },
  { name: 'rippleSpeed', type: 'number', default: '1', description: 'Speed of the ripple.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Cubes tumble into place from the center on mount.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

export default function CubesDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const light = useColorModeValue(true, false);
  const shown = createMemo(() => {
    const next = { ...settings() };
    if (light()) {
      (Object.keys(LIGHT) as (keyof typeof LIGHT)[]).forEach(name => {
        if (next[name] === DEFAULT_PROPS[name]) next[name] = LIGHT[name];
      });
    }
    return next;
  });

  const applyPreset = (value: string) => {
    const defaults = defaultProps();
    const current = settings();
    updateProps({
      ...defaults,
      ...PRESETS[value],
      faceColor: current.faceColor,
      edgeColor: current.edgeColor,
      rippleColor: current.rippleColor,
      preset: value
    });
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
          <div class="demo-container" style={{ position: 'relative', height: '600px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>{() => <Cubes {...(shown() as CubesProps)} />}</Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Face Color"
              color={shown().faceColor}
              onChange={v => updateProp('faceColor', v)}
            />
            <PreviewColorPickerCustom
              title="Edge Color"
              color={shown().edgeColor}
              onChange={v => updateProp('edgeColor', v)}
            />
            <PreviewColorPickerCustom
              title="Ripple Color"
              color={shown().rippleColor}
              onChange={v => updateProp('rippleColor', v)}
            />
            <PreviewSelect
              title="Edge Style"
              options={EDGE_OPTIONS}
              value={settings().edgeStyle}
              onChange={v => updateProp('edgeStyle', v)}
            />
            <PreviewSlider
              title="Grid Size"
              min={3}
              max={24}
              step={1}
              value={settings().gridSize}
              onChange={v => updateProp('gridSize', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={0.6}
              step={0.01}
              value={settings().gap}
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Edge Width"
              min={0}
              max={4}
              step={0.25}
              value={settings().edgeWidth}
              valueUnit="px"
              onChange={v => updateProp('edgeWidth', v)}
            />
            <PreviewSlider
              title="Face Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings().faceOpacity}
              onChange={v => updateProp('faceOpacity', v)}
            />
            <PreviewSlider
              title="Shading"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().shading}
              onChange={v => updateProp('shading', v)}
            />
            <PreviewSlider
              title="Max Angle"
              min={0}
              max={90}
              step={1}
              value={settings().maxAngle}
              valueUnit="°"
              onChange={v => updateProp('maxAngle', v)}
            />
            <PreviewSlider
              title="Radius"
              min={1}
              max={8}
              step={0.5}
              value={settings().radius}
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.3}
              max={2.5}
              step={0.05}
              value={settings().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSlider
              title="Brush"
              min={0}
              max={3}
              step={0.1}
              value={settings().brush}
              onChange={v => updateProp('brush', v)}
            />
            <PreviewSlider
              title="Perspective"
              min={0}
              max={1}
              step={0.05}
              value={settings().perspective}
              onChange={v => updateProp('perspective', v)}
            />
            <PreviewSlider
              title="Ripple Speed"
              min={0.3}
              max={3}
              step={0.1}
              value={settings().rippleSpeed}
              onChange={v => updateProp('rippleSpeed', v)}
            />
            <PreviewSwitch
              title="Auto Animate"
              isChecked={settings().autoAnimate}
              onChange={v => updateProp('autoAnimate', v)}
            />
            <PreviewSwitch
              title="Ripple On Click"
              isChecked={settings().rippleOnClick}
              onChange={v => updateProp('rippleOnClick', v)}
            />
            <PreviewSwitch title="Intro" isChecked={settings().intro} onChange={v => updateProp('intro', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cubes} componentName="Cubes" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
