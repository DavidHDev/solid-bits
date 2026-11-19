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
import { colorMode } from '@/hooks/useTheme';

import HalftoneReveal, { type HalftoneRevealProps } from '@/content/Animations/HalftoneReveal/HalftoneReveal';
import { halftoneReveal } from '@/constants/code/Animations/halftoneRevealCode';

const DEMO_IMAGE =
  'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/00f39406-ea15-4816-a71f-48c412d96de6/dhdeuom-b2737a6a-9713-499e-b1b0-3bb0bbde6eea.png/v1/fill/w_1280,h_1409/makoto_yuki_minato_arisato_render_1__by_wtfbooomsh_dhdeuom-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTQwOSIsInBhdGgiOiIvZi8wMGYzOTQwNi1lYTE1LTQ4MTYtYTcxZi00OGM0MTJkOTZkZTYvZGhkZXVvbS1iMjczN2E2YS05NzEzLTQ5OWUtYjFiMC0zYmIwYmJkZTZlZWEucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.MA3SOm4LFqNyOoCRycmn8WY0yhmUtcrUSybJ06sV5nc';

const NEWSPRINT = {
  mode: 'mono',
  shape: 'dot',
  cellSize: 6,
  angle: 45,
  dotScale: 1,
  contrast: 1.1,
  brightness: 0,
  invert: false,
  roughness: 0,
  misregistration: 0
};

const DEFAULT_PROPS = {
  preset: 'newsprint',
  ...NEWSPRINT,
  fit: 'contain',
  inkColor: '#0c0f13',
  accentColor: '#ff4f2a',
  paperColor: '#ffffff',
  revealRadius: 160,
  softness: 0.6,
  linger: 1.2,
  reverse: false,
  wander: false,
  clickBurst: true,
  intro: true
};

const PRESETS: Record<string, Partial<typeof DEFAULT_PROPS>> = {
  newsprint: NEWSPRINT,
  riso: { ...NEWSPRINT, mode: 'duotone', cellSize: 7, angle: 22, roughness: 0.35, misregistration: 0.4 },
  process: { ...NEWSPRINT, mode: 'color', cellSize: 7 },
  engraving: { ...NEWSPRINT, shape: 'line', cellSize: 5, angle: 30 },
  pop: { ...NEWSPRINT, mode: 'color', cellSize: 14, dotScale: 1.05, contrast: 1.25 },
  grit: { ...NEWSPRINT, shape: 'ellipse', cellSize: 7, angle: 60, roughness: 0.7 }
};

const PRESET_INKS: Record<string, Record<'light' | 'dark', { inkColor: string; accentColor: string }>> = {
  riso: {
    light: { inkColor: '#1d5fae', accentColor: '#ff4f2a' },
    dark: { inkColor: '#6ec9f7', accentColor: '#ff6b4a' }
  }
};

const PRESET_OPTIONS = [
  { value: 'newsprint', label: 'Newsprint' },
  { value: 'riso', label: 'Riso' },
  { value: 'process', label: 'Process' },
  { value: 'engraving', label: 'Engraving' },
  { value: 'pop', label: 'Pop' },
  { value: 'grit', label: 'Grit' }
];

const MODE_OPTIONS = [
  { value: 'mono', label: 'Mono' },
  { value: 'duotone', label: 'Duotone' },
  { value: 'color', label: 'Color' }
];

const SHAPE_OPTIONS = [
  { value: 'dot', label: 'Dot' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'square', label: 'Square' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'line', label: 'Line' },
  { value: 'cross', label: 'Cross' }
];

const FIT_OPTIONS = [
  { value: 'contain', label: 'Contain' },
  { value: 'cover', label: 'Cover' }
];

const propData: PropRow[] = [
  {
    name: 'src',
    type: 'string',
    default: "'https://images.unsplash.com/...'",
    description:
      'Image to print. Transparent or plain backgrounds are left unprinted. Must be served with CORS headers.'
  },
  {
    name: 'fit',
    type: "'contain' | 'cover'",
    default: "'cover'",
    description: 'Show the whole image, or crop it to fill the container.'
  },
  {
    name: 'mode',
    type: "'mono' | 'duotone' | 'color'",
    default: "'mono'",
    description:
      'One ink, two inks at different screen angles, or full color: CMYK on light paper and RGB light on dark paper.'
  },
  {
    name: 'shape',
    type: "'dot' | 'ellipse' | 'square' | 'diamond' | 'line' | 'cross'",
    default: "'dot'",
    description: 'Shape of the halftone marks.'
  },
  { name: 'cellSize', type: 'number', default: '6', description: 'Spacing of the halftone screen, in px.' },
  { name: 'angle', type: 'number', default: '45', description: 'Rotation of the screen, in degrees.' },
  {
    name: 'dotScale',
    type: 'number',
    default: '1',
    description: 'Scales every mark. Below 1 keeps them apart, above 1 lets them merge sooner.'
  },
  { name: 'inkColor', type: 'string', default: "'#0c0f13'", description: 'Color of the printed marks.' },
  {
    name: 'accentColor',
    type: 'string',
    default: "'#ff4f2a'",
    description: 'Second ink used in duotone mode.'
  },
  {
    name: 'paperColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Background the image is printed on. Match it to your page.'
  },
  { name: 'contrast', type: 'number', default: '1.1', description: 'Tonal contrast applied before printing.' },
  {
    name: 'brightness',
    type: 'number',
    default: '0',
    description: 'Shifts the image lighter or darker before printing.'
  },
  { name: 'invert', type: 'boolean', default: 'false', description: 'Prints a negative of the image.' },
  {
    name: 'roughness',
    type: 'number',
    default: '0',
    description: 'Gives the marks ragged, ink-spread edges, from 0 to 1.'
  },
  {
    name: 'misregistration',
    type: 'number',
    default: '0',
    description: 'Offsets the ink layers like a slightly misaligned press, from 0 to 1.'
  },
  {
    name: 'revealRadius',
    type: 'number',
    default: '160',
    description: 'Radius of the area around the cursor where the dots swell into the real photo, in px.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.6',
    description: 'Width of the band where the dots grow into the photo. 0 is a hard edge.'
  },
  {
    name: 'linger',
    type: 'number',
    default: '1.2',
    description: 'Seconds the revealed trail takes to shrink back into print. 0 turns the trail off.'
  },
  {
    name: 'reverse',
    type: 'boolean',
    default: 'false',
    description: 'Start as the photo and print wherever the cursor goes.'
  },
  {
    name: 'wander',
    type: 'boolean',
    default: 'false',
    description: 'Lets the reveal drift around on its own while the pointer is away.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of color rippling out through the print.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Grows the dots in from the center on load.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function HalftoneRevealDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, inkColor: _ink, paperColor: _paper, accentColor: _accent, ...rest } = props();
    return rest;
  });

  const ink = () =>
    colorMode() === 'dark' && props().inkColor === DEFAULT_PROPS.inkColor ? '#f4f1ea' : props().inkColor;
  const paper = () =>
    colorMode() === 'dark' && props().paperColor === DEFAULT_PROPS.paperColor ? '#0c0f13' : props().paperColor;

  const computedProps = createMemo(() => ({ inkColor: ink(), paperColor: paper(), accentColor: props().accentColor }));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps()[name as keyof typeof DEFAULT_PROPS]])
    );
    const inks = PRESET_INKS[value]?.[colorMode()] ?? {};
    updateProps({ ...base, ...PRESETS[value], ...inks, preset: value });
  };

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
          <div class="demo-container" style={{ position: 'relative', height: '600px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>
              {() => (
                <HalftoneReveal
                  src={DEMO_IMAGE}
                  {...(settings() as HalftoneRevealProps)}
                  {...(computedProps() as HalftoneRevealProps)}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings().mode}
              onChange={v => updateProp('mode', v)}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings().shape}
              onChange={v => updateProp('shape', v)}
            />
            <PreviewSelect
              title="Fit"
              options={FIT_OPTIONS}
              value={settings().fit}
              onChange={v => updateProp('fit', v)}
            />
            <PreviewColorPickerCustom title="Ink" color={ink()} onChange={v => updateProp('inkColor', v)} />
            <PreviewColorPickerCustom
              title="Accent"
              color={props().accentColor}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom title="Paper" color={paper()} onChange={v => updateProp('paperColor', v)} />
            <PreviewSlider
              title="Cell Size"
              min={3}
              max={24}
              step={1}
              value={settings().cellSize}
              valueUnit="px"
              onChange={v => updateProp('cellSize', v)}
            />
            <PreviewSlider
              title="Angle"
              min={0}
              max={90}
              step={1}
              value={settings().angle}
              valueUnit="°"
              onChange={v => updateProp('angle', v)}
            />
            <PreviewSlider
              title="Dot Scale"
              min={0.4}
              max={1.5}
              step={0.05}
              value={settings().dotScale}
              onChange={v => updateProp('dotScale', v)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={2}
              step={0.05}
              value={settings().contrast}
              onChange={v => updateProp('contrast', v)}
            />
            <PreviewSlider
              title="Brightness"
              min={-0.4}
              max={0.4}
              step={0.02}
              value={settings().brightness}
              onChange={v => updateProp('brightness', v)}
            />
            <PreviewSlider
              title="Roughness"
              min={0}
              max={1}
              step={0.05}
              value={settings().roughness}
              onChange={v => updateProp('roughness', v)}
            />
            <PreviewSlider
              title="Misregistration"
              min={0}
              max={1}
              step={0.05}
              value={settings().misregistration}
              onChange={v => updateProp('misregistration', v)}
            />
            <PreviewSlider
              title="Reveal Radius"
              min={40}
              max={320}
              step={5}
              value={settings().revealRadius}
              valueUnit="px"
              onChange={v => updateProp('revealRadius', v)}
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
              title="Linger"
              min={0}
              max={4}
              step={0.1}
              value={settings().linger}
              valueUnit="s"
              onChange={v => updateProp('linger', v)}
            />
            <PreviewSwitch title="Invert" isChecked={settings().invert} onChange={v => updateProp('invert', v)} />
            <PreviewSwitch title="Reverse" isChecked={settings().reverse} onChange={v => updateProp('reverse', v)} />
            <PreviewSwitch title="Wander" isChecked={settings().wander} onChange={v => updateProp('wander', v)} />
            <PreviewSwitch
              title="Click Burst"
              isChecked={settings().clickBurst}
              onChange={v => updateProp('clickBurst', v)}
            />
            <PreviewSwitch title="Intro" isChecked={settings().intro} onChange={v => updateProp('intro', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={halftoneReveal} componentName="HalftoneReveal" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
