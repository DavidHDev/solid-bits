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

import VariableProximity, {
  type VariableProximityProps
} from '@/content/TextAnimations/VariableProximity/VariableProximity';
import { variableProximity } from '@/constants/code/TextAnimations/variableProximityCode';

type Falloff = NonNullable<VariableProximityProps['falloff']>;

const LOOK = {
  restWeight: 400,
  peakWeight: 1000,
  radius: 100,
  falloff: 'linear',
  smoothing: 0.2,
  fromColor: '',
  toColor: '',
  scale: 1,
  lift: 0,
  idleWave: false,
  fontSize: 64
};

const PRESETS: Record<string, typeof LOOK> = {
  classic: { ...LOOK },
  inverse: {
    ...LOOK,
    restWeight: 1000,
    peakWeight: 100,
    radius: 120,
    falloff: 'exponential',
    smoothing: 0.1,
    idleWave: true
  },
  hairline: {
    ...LOOK,
    restWeight: 100,
    peakWeight: 900,
    radius: 180,
    falloff: 'gaussian',
    smoothing: 0.5,
    scale: 1.12,
    fontSize: 72
  },
  lift: {
    ...LOOK,
    restWeight: 300,
    peakWeight: 800,
    radius: 150,
    falloff: 'gaussian',
    smoothing: 0.3,
    toColor: '#ff5a36',
    scale: 1.22,
    lift: 0.16
  }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'inverse', label: 'Inverse' },
  { value: 'hairline', label: 'Hairline' },
  { value: 'lift', label: 'Lift' }
];

const FALLOFF_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'exponential', label: 'Exponential' },
  { value: 'gaussian', label: 'Gaussian' }
];

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK
};

const propData: PropRow[] = [
  {
    name: 'label',
    type: 'string',
    default: '""',
    description: 'The text content to display.'
  },
  {
    name: 'fromFontVariationSettings',
    type: 'string',
    default: "'wght' 400, 'opsz' 9",
    description: 'The variation settings letters rest at, away from the cursor.'
  },
  {
    name: 'toFontVariationSettings',
    type: 'string',
    default: "'wght' 1000, 'opsz' 40",
    description: 'The variation settings to reach at cursor proximity.'
  },
  {
    name: 'containerRef',
    type: 'HTMLElement | { current?: HTMLElement | null }',
    default: 'undefined',
    description:
      'Optional element around the text. Letters skip their distance checks while the cursor is farther than the radius from it.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '50',
    description: 'Proximity radius to influence the effect.'
  },
  {
    name: 'falloff',
    type: "'linear' | 'exponential' | 'gaussian'",
    default: '"linear"',
    description: 'Type of falloff for the effect.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.2',
    description: 'How gently letters ease toward their new settings, from 0 (instant) to 1 (a slow, trailing wake).'
  },
  {
    name: 'fromColor',
    type: 'string',
    default: 'undefined',
    description: 'Color letters rest at. Leave unset to keep the text color.'
  },
  {
    name: 'toColor',
    type: 'string',
    default: 'undefined',
    description: 'Color letters shift toward as the cursor gets close. Leave unset to keep the text color.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size a letter grows to right under the cursor. 1 keeps letters at their normal size.'
  },
  {
    name: 'lift',
    type: 'number',
    default: '0',
    description: 'How far, in em, a letter right under the cursor rises.'
  },
  {
    name: 'idleWave',
    type: 'boolean',
    default: 'false',
    description:
      'While the cursor is away, a gentle wave of weight travels across the text. It fades out as the cursor comes near.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: 'undefined',
    description: 'Font size of the text. Numbers are pixels. Inherits the surrounding size when unset.'
  }
];

export default function VariableProximityDemo() {
  const containerRef: { current: HTMLDivElement | null } = { current: null };
  const ink = useColorModeValue('#18181b', '#ffffff');

  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => {
    const p = props();
    return {
      fromFontVariationSettings: `'wght' ${p.restWeight}, 'opsz' 9`,
      toFontVariationSettings: `'wght' ${p.peakWeight}, 'opsz' 40`,
      ...(p.fromColor ? { fromColor: p.fromColor } : {}),
      ...(p.toColor ? { toColor: p.toColor } : {})
    };
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'restWeight', 'peakWeight', 'fromColor', 'toColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            ref={el => (containerRef.current = el)}
            class="demo-container"
            style={{
              position: 'relative',
              'min-height': '400px',
              overflow: 'hidden',
              padding: '16px',
              'container-type': 'inline-size'
            }}
          >
            <VariableProximity
              label={'Hover me! And then star Solid Bits on GitHub, or else...'}
              fromFontVariationSettings={computedProps().fromFontVariationSettings}
              toFontVariationSettings={computedProps().toFontVariationSettings}
              containerRef={containerRef}
              radius={props().radius}
              falloff={props().falloff as Falloff}
              smoothing={props().smoothing}
              fromColor={props().fromColor || undefined}
              toColor={props().toColor || undefined}
              scale={props().scale}
              lift={props().lift}
              idleWave={props().idleWave}
              fontSize={`min(${props().fontSize}px, 8.5cqi)`}
              style={{
                display: 'block',
                'max-width': '20ch',
                'line-height': 1.05,
                'text-align': 'center',
                cursor: 'pointer'
              }}
            />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="From Color"
              color={props().fromColor || ink()}
              onChange={v => updateProp('fromColor', v)}
            />
            <PreviewColorPickerCustom
              title="To Color"
              color={props().toColor || props().fromColor || ink()}
              onChange={v => updateProp('toColor', v)}
            />
            <PreviewSelect
              title="Falloff"
              options={FALLOFF_OPTIONS}
              value={props().falloff}
              onChange={(v: string) => updateProp('falloff', v)}
            />
            <PreviewSlider
              title="Radius"
              min={50}
              max={300}
              step={10}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={props().smoothing}
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSlider
              title="Scale"
              min={0.8}
              max={1.6}
              step={0.02}
              value={props().scale}
              onChange={v => updateProp('scale', v)}
            />
            <PreviewSlider
              title="Lift"
              min={0}
              max={0.4}
              step={0.01}
              value={props().lift}
              valueUnit="em"
              onChange={v => updateProp('lift', v)}
            />
            <PreviewSwitch title="Idle Wave" isChecked={props().idleWave} onChange={v => updateProp('idleWave', v)} />
            <PreviewSlider
              title="Rest Weight"
              min={100}
              max={1000}
              step={50}
              value={props().restWeight}
              onChange={v => updateProp('restWeight', v)}
            />
            <PreviewSlider
              title="Peak Weight"
              min={100}
              max={1000}
              step={50}
              value={props().peakWeight}
              onChange={v => updateProp('peakWeight', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={32}
              max={96}
              step={2}
              value={props().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={variableProximity} componentName="VariableProximity" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
