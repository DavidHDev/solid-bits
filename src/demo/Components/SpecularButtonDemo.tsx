import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import SpecularButton, { type SpecularButtonProps } from '@/content/Components/SpecularButton/SpecularButton';
import { specularButton } from '@/constants/code/Components/specularButtonCode';

const GLASS = {
  radius: 18,
  thickness: 1.2,
  glow: 1,
  shineSize: 10,
  shineFade: 34,
  idleIntensity: 0.35,
  autoAnimate: false,
  speed: 0.35
};

const DEFAULT_PROPS = {
  preset: 'glass',
  size: 'lg',
  ...GLASS,
  tint: '#ffffff',
  tintOpacity: 0.04,
  blur: 0,
  textColor: '#f5f5f5',
  lineColor: '#ffffff',
  baseColor: '#525252',
  intensity: 1,
  followMouse: true,
  proximity: 250,
  disabled: false
};

const PRESETS: Record<string, typeof GLASS> = {
  glass: GLASS,
  pill: { ...GLASS, radius: 40, thickness: 1.5, glow: 1.4, shineSize: 14, shineFade: 40 },
  crisp: { ...GLASS, radius: 12, thickness: 1, glow: 0, shineSize: 6, shineFade: 22, idleIntensity: 0.5 },
  orbit: { ...GLASS, autoAnimate: true, speed: 0.8 }
};

const PRESET_OPTIONS = [
  { value: 'glass', label: 'Glass' },
  { value: 'pill', label: 'Pill' },
  { value: 'crisp', label: 'Crisp' },
  { value: 'orbit', label: 'Orbit' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const PAGE = { dark: '#0c0f13', light: '#ffffff' };

const clampOpacity = (value: unknown) => Math.min(1, Math.max(0, Number(value) || 0));

const luminance = (hex: string) => {
  const value = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return (0.2126 * ((value >> 16) & 255) + 0.7152 * ((value >> 8) & 255) + 0.0722 * (value & 255)) / 255;
};

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: "'Get Started'", description: 'Button label or any content.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'lg'", description: 'Padding and font size of the button.' },
  {
    name: 'radius',
    type: 'number',
    default: '18',
    description: 'Corner radius in px. Values past half the height make a pill.'
  },
  { name: 'tint', type: 'string', default: "'#ffffff'", description: 'Color of the glass body.' },
  {
    name: 'tintOpacity',
    type: 'number',
    default: '0.04',
    description: 'How strongly the tint fills the body, from 0 for clear glass to 1 for a solid button.'
  },
  { name: 'blur', type: 'number', default: '0', description: 'Blur of whatever sits behind the button, in px.' },
  { name: 'textColor', type: 'string', default: "'#f5f5f5'", description: 'Color of the label.' },
  { name: 'lineColor', type: 'string', default: "'#ffffff'", description: 'Color of the light on the edge.' },
  {
    name: 'baseColor',
    type: 'string',
    default: "'#525252'",
    description: 'Color of the thin edge line that stays visible under the light.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'Brightness of the light on the edge.' },
  {
    name: 'idleIntensity',
    type: 'number',
    default: '0.35',
    description: 'How much of the light stays on when the cursor is away, from 0 to 1.'
  },
  {
    name: 'shineSize',
    type: 'number',
    default: '10',
    description: 'How much of the edge the light covers at full strength, in degrees around the button.'
  },
  {
    name: 'shineFade',
    type: 'number',
    default: '34',
    description: 'How far the light fades out past that, in degrees around the button.'
  },
  { name: 'thickness', type: 'number', default: '1.2', description: 'Width of the lit edge in px.' },
  {
    name: 'glow',
    type: 'number',
    default: '1',
    description: 'Soft light around the lit edge and inside the glass. 0 keeps only the crisp line.'
  },
  {
    name: 'followMouse',
    type: 'boolean',
    default: 'true',
    description: 'Moves the light to the part of the edge nearest the cursor.'
  },
  {
    name: 'proximity',
    type: 'number',
    default: '250',
    description: 'Distance in px at which the light starts to follow the cursor and brighten.'
  },
  {
    name: 'autoAnimate',
    type: 'boolean',
    default: 'false',
    description: 'Keeps the light on and circling the edge whenever the cursor is away.'
  },
  { name: 'speed', type: 'number', default: '0.35', description: 'How fast the light circles when autoAnimate is on.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the button.' },
  { name: 'onClick', type: 'JSX.EventHandler', default: '-', description: 'Click handler.' },
  { name: 'type', type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'Native button type.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the button.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the button.' }
];

export default function SpecularButtonDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');

  const themed = createMemo(() => {
    const { tint, tintOpacity, textColor, baseColor } = settings();
    const mode = theme();
    const result: { tint?: string; tintOpacity?: number; textColor?: string; baseColor?: string } = {};
    if (mode === 'light' && tint === DEFAULT_PROPS.tint) result.tint = '#12161c';
    if (mode === 'light' && tintOpacity === DEFAULT_PROPS.tintOpacity) result.tintOpacity = 1;
    const body = luminance(result.tint ?? tint);
    const opacity = clampOpacity(result.tintOpacity ?? tintOpacity);
    const bright = luminance(PAGE[mode]) * (1 - opacity) + body * opacity > 0.5;
    if (textColor === DEFAULT_PROPS.textColor && (bright || mode === 'light')) {
      result.textColor = bright ? '#12161c' : '#fafafa';
    }
    if (baseColor === DEFAULT_PROPS.baseColor && (bright || mode === 'light')) {
      result.baseColor = bright ? '#a1a5ab' : '#3f434a';
    }
    return result;
  });

  const shown = createMemo(() => ({ ...settings(), ...themed() }));

  const applyPreset = (value: string) => {
    updateProps({ ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={themed()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '400px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <SpecularButton {...(shown() as SpecularButtonProps)}>Get Started</SpecularButton>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Light"
              color={shown().lineColor}
              onChange={v => updateProp('lineColor', v)}
            />
            <PreviewColorPickerCustom
              title="Edge"
              color={shown().baseColor}
              onChange={v => updateProp('baseColor', v)}
            />
            <PreviewColorPickerCustom title="Tint" color={shown().tint} onChange={v => updateProp('tint', v)} />
            <PreviewColorPickerCustom
              title="Text"
              color={shown().textColor}
              onChange={v => updateProp('textColor', v)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={shown().size}
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={shown().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Tint Opacity"
              min={0}
              max={1}
              step={0.01}
              value={shown().tintOpacity}
              onChange={v => updateProp('tintOpacity', v)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={30}
              step={1}
              value={shown().blur}
              valueUnit="px"
              onChange={v => updateProp('blur', v)}
            />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={2}
              step={0.05}
              value={shown().intensity}
              onChange={v => updateProp('intensity', v)}
            />
            <PreviewSlider
              title="Idle Intensity"
              min={0}
              max={1}
              step={0.05}
              value={shown().idleIntensity}
              onChange={v => updateProp('idleIntensity', v)}
            />
            <PreviewSlider
              title="Shine Size"
              min={0}
              max={45}
              step={1}
              value={shown().shineSize}
              valueUnit="°"
              onChange={v => updateProp('shineSize', v)}
            />
            <PreviewSlider
              title="Shine Fade"
              min={0}
              max={90}
              step={1}
              value={shown().shineFade}
              valueUnit="°"
              onChange={v => updateProp('shineFade', v)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={4}
              step={0.1}
              value={shown().thickness}
              valueUnit="px"
              onChange={v => updateProp('thickness', v)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={shown().glow}
              onChange={v => updateProp('glow', v)}
            />
            <PreviewSlider
              title="Proximity"
              min={50}
              max={500}
              step={10}
              value={shown().proximity}
              valueUnit="px"
              onChange={v => updateProp('proximity', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={shown().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSwitch
              title="Follow Mouse"
              isChecked={shown().followMouse}
              onChange={v => updateProp('followMouse', v)}
            />
            <PreviewSwitch
              title="Auto Animate"
              isChecked={shown().autoAnimate}
              onChange={v => updateProp('autoAnimate', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={shown().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={specularButton} componentName="SpecularButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
