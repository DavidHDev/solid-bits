import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import BackgroundContent from '@/components/common/BackgroundContent';
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
import { colorMode } from '@/hooks/useTheme';

import PatternWaves, { type PatternWavesProps } from '@/content/Backgrounds/PatternWaves/PatternWaves';
import { patternWaves } from '@/constants/code/Backgrounds/patternWavesCode';
import { PRESETS, PRESET_OPTIONS, presetProps } from './presets/PatternWaves';

const PATTERN_OPTIONS = [
  { label: 'Dot', value: 'dot' },
  { label: 'Square', value: 'square' },
  { label: 'Plus', value: 'plus' },
  { label: 'Line', value: 'line' },
  { label: 'Glyph', value: 'glyph' }
];

const WAVE_OPTIONS = [
  { label: 'Silk', value: 'silk' },
  { label: 'Swell', value: 'swell' },
  { label: 'Ripple', value: 'ripple' }
];

const FADE_OPTIONS = [
  { label: 'Edges', value: 'edges' },
  { label: 'Center', value: 'center' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Top', value: 'top' },
  { label: 'None', value: 'none' }
];

const DEFAULT_PROPS = {
  preset: 'silk',
  ...PRESETS.silk,
  color: '#ffffff',
  backgroundColor: '#0c0f13',
  opacity: 1,
  fade: 'edges' as NonNullable<PatternWavesProps['fade']>,
  fadeSize: 0.5,
  characters: '.:-=+*#%@',
  interactive: true,
  cursorSize: 50,
  cursorStrength: 0.6,
  intro: true,
  paused: false
};

type DemoProps = typeof DEFAULT_PROPS;

const LIGHT_PROPS: Partial<DemoProps> = {
  color: '#181a1b',
  backgroundColor: '#ffffff'
};

const propData: PropRow[] = [
  {
    name: 'preset',
    type: "'silk' | 'ocean' | 'pond' | 'lines' | 'terminal' | 'mesh'",
    default: "'silk'",
    description:
      'A complete starting look. Every pattern, wave and light prop below overrides the preset value when you pass it.'
  },
  {
    name: 'pattern',
    type: "'dot' | 'square' | 'plus' | 'line' | 'glyph'",
    default: 'from preset',
    description:
      'The mark that draws the surface. Line traces it as flowing contour lines, glyph uses characters picked by brightness.'
  },
  {
    name: 'wave',
    type: "'silk' | 'swell' | 'ripple'",
    default: 'from preset',
    description:
      'The shape of the moving surface. Silk is draped fabric folds, swell is rolling parallel waves, ripple is rings travelling in from off screen.'
  },
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description:
      'The one color of the pattern. Shadows, midtones and highlights are all derived from it. A color darker than the background prints like ink.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#000000'",
    description: 'Color behind the pattern. Pass transparent to show the page through.'
  },
  {
    name: 'spacing',
    type: 'number',
    default: 'from preset',
    description: 'Distance between marks in CSS pixels. Smaller values give a finer print.'
  },
  {
    name: 'markSize',
    type: 'number',
    default: 'from preset',
    description: 'Largest mark as a fraction of the spacing.'
  },
  {
    name: 'depth',
    type: 'number',
    default: 'from preset',
    description: 'How tall the surface is. Deeper surfaces cast stronger shading and lift the marks along the crests.'
  },
  {
    name: 'light',
    type: 'number',
    default: 'from preset',
    description:
      'Angle of the light across the waves in degrees, from -90 to 90. 0 lights the folds head on, larger values graze them.'
  },
  {
    name: 'shine',
    type: 'number',
    default: 'from preset',
    description: 'Strength of the glints where the surface catches the light.'
  },
  {
    name: 'contrast',
    type: 'number',
    default: 'from preset',
    description: 'Spread between the quiet shadows and the lit areas.'
  },
  {
    name: 'speed',
    type: 'number',
    default: 'from preset',
    description: 'How fast the surface moves. 0 freezes it while the cursor keeps working.'
  },
  {
    name: 'scale',
    type: 'number',
    default: 'from preset',
    description: 'Size of the waves. Larger values give broader, calmer forms.'
  },
  {
    name: 'direction',
    type: 'number',
    default: 'from preset',
    description: 'Direction the waves travel in degrees. The light turns with it.'
  },
  {
    name: 'opacity',
    type: 'number',
    default: '1',
    description: 'Overall opacity of the pattern, from 0 to 1.'
  },
  {
    name: 'fade',
    type: "'edges' | 'center' | 'bottom' | 'top' | 'none'",
    default: "'edges'",
    description:
      'Where the pattern fades into the background. Center keeps the middle calm for a headline, bottom and top fade towards that edge.'
  },
  {
    name: 'fadeSize',
    type: 'number',
    default: '0.5',
    description: 'How far the fade reaches, from 0.05 to 1.'
  },
  {
    name: 'characters',
    type: 'string',
    default: "'.:-=+*#%@'",
    description: 'Characters for the glyph pattern, ordered from the lightest to the densest.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description:
      'Lets the cursor disturb the surface. Moving it leaves a wake of ripples that catch the light, a click drops a splash.'
  },
  {
    name: 'cursorSize',
    type: 'number',
    default: '50',
    description: 'Radius of the patch of surface the cursor pushes, in CSS pixels.'
  },
  {
    name: 'cursorStrength',
    type: 'number',
    default: '0.6',
    description: 'How hard the cursor pushes the surface, from 0 to 1.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'On mount the marks fade in from the center, then the surface rises and the light sweeps across it.'
  },
  {
    name: 'paused',
    type: 'boolean',
    default: 'false',
    description: 'Freezes the surface. The cursor ripples keep working.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root element.' }
];

export default function PatternWavesDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const themedProps = createMemo<DemoProps>(() => {
    const current = props();
    if (colorMode() !== 'light') return current;
    const next = { ...current } as Record<string, unknown>;
    for (const [name, value] of Object.entries(LIGHT_PROPS)) {
      if (current[name as keyof DemoProps] === DEFAULT_PROPS[name as keyof DemoProps]) next[name] = value;
    }
    return next as DemoProps;
  });

  const choosePreset = (value: string) => {
    updateProps({ preset: value, ...presetProps(value) });
  };

  return (
    <ComponentPropsProvider
      props={themedProps()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>{() => <PatternWaves {...(themedProps() as PatternWavesProps)} />}</Keyed>
            <BackgroundContent headline="Soft light on a moving surface." />
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={choosePreset} />
            <PreviewSelect
              title="Pattern"
              options={PATTERN_OPTIONS}
              value={props().pattern}
              onChange={value => updateProp('pattern', value)}
            />
            <PreviewSelect
              title="Wave"
              options={WAVE_OPTIONS}
              value={props().wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewInput
              title="Characters"
              value={props().characters}
              placeholder="Lightest to densest"
              maxLength={24}
              isDisabled={props().pattern !== 'glyph'}
              onChange={value => updateProp('characters', value)}
            />

            <PreviewColorPickerCustom
              title="Color"
              color={themedProps().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={themedProps().backgroundColor}
              onChange={value => updateProp('backgroundColor', value)}
            />

            <PreviewSlider
              title="Spacing"
              min={5}
              max={30}
              step={1}
              value={props().spacing}
              valueUnit="px"
              onChange={value => updateProp('spacing', value)}
            />
            <PreviewSlider
              title="Mark Size"
              min={0.3}
              max={1}
              step={0.05}
              value={props().markSize}
              onChange={value => updateProp('markSize', value)}
            />

            <PreviewSlider
              title="Depth"
              min={0}
              max={1.5}
              step={0.05}
              value={props().depth}
              onChange={value => updateProp('depth', value)}
            />
            <PreviewSlider
              title="Light"
              min={-90}
              max={90}
              step={1}
              value={props().light}
              valueUnit="°"
              onChange={value => updateProp('light', value)}
            />
            <PreviewSlider
              title="Shine"
              min={0}
              max={2}
              step={0.05}
              value={props().shine}
              onChange={value => updateProp('shine', value)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={2.5}
              step={0.05}
              value={props().contrast}
              onChange={value => updateProp('contrast', value)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={props().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.3}
              max={3}
              step={0.05}
              value={props().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Direction"
              min={0}
              max={360}
              step={1}
              value={props().direction}
              valueUnit="°"
              onChange={value => updateProp('direction', value)}
            />

            <PreviewSelect
              title="Fade"
              options={FADE_OPTIONS}
              value={props().fade}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Fade Size"
              min={0.1}
              max={1}
              step={0.05}
              value={props().fadeSize}
              isDisabled={props().fade === 'none'}
              onChange={value => updateProp('fadeSize', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0}
              max={1}
              step={0.05}
              value={props().opacity}
              onChange={value => updateProp('opacity', value)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props().interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSlider
              title="Cursor Size"
              min={10}
              max={200}
              step={5}
              value={props().cursorSize}
              valueUnit="px"
              isDisabled={!props().interactive}
              onChange={value => updateProp('cursorSize', value)}
            />
            <PreviewSlider
              title="Cursor Strength"
              min={0}
              max={1}
              step={0.05}
              value={props().cursorStrength}
              isDisabled={!props().interactive}
              onChange={value => updateProp('cursorStrength', value)}
            />

            <PreviewSwitch title="Intro" isChecked={props().intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch title="Paused" isChecked={props().paused} onChange={value => updateProp('paused', value)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={patternWaves} componentName="PatternWaves" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
