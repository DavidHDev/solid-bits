import { createMemo } from 'solid-js';
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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import WarpText, { type WarpTextProps } from '@/content/TextAnimations/WarpText/WarpText';
import { warpText } from '@/constants/code/TextAnimations/warpTextCode';

const SERIF = 'Georgia, serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const LOOK = {
  lens: 'bulge',
  fontFamily: 'inherit',
  fontWeight: 500,
  fontSize: 116,
  letterSpacing: -0.06,
  lineHeight: 0.9,
  warpStrength: 0.08,
  warpScale: 1.7,
  speed: 0.55,
  pointerInfluence: 0.42,
  pointerStrength: 0.38,
  refraction: 0.018,
  chromatic: 0.35,
  idleDrift: 0.2,
  ripple: true,
  clickRipple: true
};

const PRESETS: Record<string, typeof LOOK> = {
  glass: { ...LOOK },
  liquid: {
    ...LOOK,
    fontFamily: SERIF,
    fontWeight: 400,
    letterSpacing: -0.03,
    lineHeight: 1,
    warpStrength: 0.17,
    warpScale: 1.1,
    speed: 0.9,
    pointerInfluence: 0.52,
    pointerStrength: 0.5,
    refraction: 0.026,
    chromatic: 0,
    idleDrift: 0.65
  },
  vortex: {
    ...LOOK,
    lens: 'swirl',
    fontWeight: 500,
    letterSpacing: -0.08,
    warpStrength: 0.04,
    warpScale: 2.2,
    speed: 0.4,
    pointerInfluence: 0.38,
    pointerStrength: 0.62,
    refraction: 0.012,
    chromatic: 0.2,
    idleDrift: 0.85,
    ripple: false
  },
  prism: {
    ...LOOK,
    lens: 'pinch',
    fontFamily: MONO,
    fontWeight: 500,
    fontSize: 104,
    letterSpacing: -0.02,
    warpStrength: 0.1,
    warpScale: 2.8,
    speed: 0.7,
    pointerStrength: 0.56,
    refraction: 0.03,
    chromatic: 0.8,
    idleDrift: 0.45
  }
};

const DEFAULT_PROPS = {
  preset: 'glass',
  text: 'Bend the moment',
  color: '',
  ...LOOK,
  intro: true
};

const PRESET_OPTIONS = [
  { value: 'glass', label: 'Glass' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'vortex', label: 'Vortex' },
  { value: 'prism', label: 'Prism' }
];

const LENS_OPTIONS = [
  { value: 'bulge', label: 'Bulge' },
  { value: 'pinch', label: 'Pinch' },
  { value: 'swirl', label: 'Swirl' }
];

const FONT_OPTIONS = [
  { value: 'inherit', label: 'System' },
  { value: SERIF, label: 'Serif' },
  { value: MONO, label: 'Mono' }
];

const WEIGHT_OPTIONS = [
  { value: 300, label: '300' },
  { value: 400, label: '400' },
  { value: 500, label: '500' }
];

const propData: PropRow[] = [
  {
    name: 'text',
    type: 'string',
    default: '"Bend the moment"',
    description: 'The headline text rendered into the WebGL texture. Use \\n for line breaks.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Text fill color before the glass refraction pass. Follows the surrounding text color by default.'
  },
  {
    name: 'warpStrength',
    type: 'number',
    default: '0.08',
    description: 'Amount of ambient glass distortion at rest.'
  },
  { name: 'warpScale', type: 'number', default: '1.7', description: 'Size of the moving distortion cells.' },
  { name: 'speed', type: 'number', default: '0.55', description: 'Speed of the ambient undulation.' },
  {
    name: 'lens',
    type: '"bulge" | "pinch" | "swirl"',
    default: '"bulge"',
    description: 'How the cursor bends the text: magnify it, pull it inward or twist it around the pointer.'
  },
  { name: 'pointerInfluence', type: 'number', default: '0.42', description: 'Radius of the cursor lensing area.' },
  {
    name: 'pointerStrength',
    type: 'number',
    default: '0.38',
    description: 'Strength of cursor-driven bending and magnification.'
  },
  {
    name: 'idleDrift',
    type: 'number',
    default: '0.2',
    description:
      'How strongly the lens keeps wandering over the text while the cursor is away, from 0 (it fades out) to 1 (a full-strength lens roaming across the words).'
  },
  {
    name: 'chromatic',
    type: 'number',
    default: '0',
    description:
      'Color fringing inside the lens and click ripples, like light splitting through real glass. 0 is off, 1 is strong.'
  },
  {
    name: 'refraction',
    type: 'number',
    default: '0.018',
    description: 'Subtle RGB channel split for the glass edge.'
  },
  { name: 'ripple', type: 'boolean', default: 'true', description: 'Adds a soft ripple to the pointer lens.' },
  {
    name: 'clickRipple',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a shockwave ring through the text that bends the letters as it passes and fades out.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Fades the text in from a strong warp that settles once it first comes into view.'
  },
  {
    name: 'fontSize',
    type: 'string | number',
    default: '"clamp(3rem, 10vw, 9rem)"',
    description: 'Canvas raster font size. Numbers are pixels. The text shrinks to fit the container.'
  },
  {
    name: 'fontWeight',
    type: 'string | number',
    default: '500',
    description: 'Font weight used when rasterising the text texture.'
  },
  {
    name: 'fontFamily',
    type: 'string',
    default: '"inherit"',
    description: 'Font family used when rasterising the text texture.'
  },
  {
    name: 'letterSpacing',
    type: 'string | number',
    default: '"-0.06em"',
    description: 'Tracking applied while drawing the text into the texture.'
  },
  { name: 'lineHeight', type: 'string | number', default: '0.9', description: 'Line height for multi-line text.' },
  { name: 'className', type: 'string', default: '""', description: 'Optional class name for the root element.' },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Optional inline styles for sizing or layout.'
  }
];

export default function WarpTextDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, text: _text, color: _color, letterSpacing: _letterSpacing, ...rest } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => ({
    color: props().color || undefined,
    letterSpacing: `${props().letterSpacing}em`
  }));

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
              'min-height': '430px',
              'max-height': '460px',
              padding: 0,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Keyed token={`${props().preset}-${rerenderKey()}`}>
              {() => (
                <WarpText
                  {...(settings() as WarpTextProps)}
                  text={props().text}
                  color={props().color || 'currentColor'}
                  letterSpacing={`${props().letterSpacing}em`}
                  style={{ height: '100%', 'min-height': '430px', 'border-radius': '28px' }}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewInput
              title="Text"
              value={props().text}
              placeholder="Your headline"
              maxLength={36}
              onChange={v => updateProp('text', v)}
            />
            <PreviewColorPickerCustom
              title="Text Color"
              color={props().color || ink()}
              onChange={v => updateProp('color', v)}
            />
            <PreviewSelect
              title="Lens"
              options={LENS_OPTIONS}
              value={settings().lens}
              onChange={v => updateProp('lens', v)}
            />
            <PreviewSlider
              title="Lens Strength"
              min={0}
              max={0.8}
              step={0.01}
              value={settings().pointerStrength}
              onChange={v => updateProp('pointerStrength', v)}
            />
            <PreviewSlider
              title="Lens Radius"
              min={0.18}
              max={0.75}
              step={0.01}
              value={settings().pointerInfluence}
              onChange={v => updateProp('pointerInfluence', v)}
            />
            <PreviewSlider
              title="Idle Drift"
              min={0}
              max={1}
              step={0.05}
              value={settings().idleDrift}
              onChange={v => updateProp('idleDrift', v)}
            />
            <PreviewSlider
              title="Chromatic"
              min={0}
              max={1}
              step={0.05}
              value={settings().chromatic}
              onChange={v => updateProp('chromatic', v)}
            />
            <PreviewSlider
              title="Refraction"
              min={0}
              max={0.05}
              step={0.001}
              value={settings().refraction}
              onChange={v => updateProp('refraction', v)}
            />
            <PreviewSlider
              title="Warp Strength"
              min={0}
              max={0.2}
              step={0.01}
              value={settings().warpStrength}
              onChange={v => updateProp('warpStrength', v)}
            />
            <PreviewSlider
              title="Warp Scale"
              min={0.8}
              max={3}
              step={0.1}
              value={settings().warpScale}
              onChange={v => updateProp('warpScale', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSwitch
              title="Click Ripple"
              isChecked={settings().clickRipple}
              onChange={v => updateProp('clickRipple', v)}
            />
            <PreviewSwitch title="Ripple" isChecked={settings().ripple} onChange={v => updateProp('ripple', v)} />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={v => {
                updateProp('intro', v);
                forceRerender();
              }}
            />
            <PreviewSelect
              title="Font"
              options={FONT_OPTIONS}
              value={settings().fontFamily}
              onChange={v => updateProp('fontFamily', v)}
            />
            <PreviewSelect
              title="Weight"
              options={WEIGHT_OPTIONS}
              value={settings().fontWeight}
              onChange={v => updateProp('fontWeight', Number(v))}
            />
            <PreviewSlider
              title="Font Size"
              min={56}
              max={160}
              step={1}
              value={settings().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Letter Spacing"
              min={-0.12}
              max={0.04}
              step={0.01}
              value={props().letterSpacing}
              valueUnit="em"
              onChange={v => updateProp('letterSpacing', v)}
            />
            <PreviewSlider
              title="Line Height"
              min={0.78}
              max={1.2}
              step={0.01}
              value={settings().lineHeight}
              onChange={v => updateProp('lineHeight', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={warpText} componentName="WarpText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
