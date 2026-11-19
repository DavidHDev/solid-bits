import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import DecayCard, { type DecayCardProps } from '@/content/Components/DecayCard/DecayCard';
import { decayCard } from '@/constants/code/Components/decayCardCode';

const IMAGE = 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop';

const SCOPE_OPTIONS = [
  { value: 'window', label: 'Window' },
  { value: 'card', label: 'Card' }
];

const DEFAULT_PROPS = {
  preset: 'torn',
  width: 300,
  height: 400,
  intensity: 0.5,
  sensitivity: 0.5,
  hoverDecay: 0.05,
  recovery: 0.6,
  idle: 0.35,
  grain: 0.25,
  detail: 5,
  pattern: 4,
  flow: 0,
  chroma: 0,
  travel: 50,
  tilt: 10,
  scope: 'window',
  radius: 0,
  grayscale: false
};

const PRESETS: Record<string, Partial<typeof DEFAULT_PROPS>> = {
  torn: {},
  shatter: { intensity: 0.7, grain: 0.5, detail: 6, sensitivity: 0.65, recovery: 0.45 },
  melt: { intensity: 0.45, grain: 0.1, detail: 2, recovery: 1, flow: 0.4 },
  prism: { intensity: 0.4, chroma: 0.6, flow: 0.3, radius: 16 },
  subtle: { intensity: 0.25, sensitivity: 0.35, hoverDecay: 0.1, idle: 0.2, travel: 20, tilt: 4, radius: 16 },
  still: { intensity: 0.4, scope: 'card', travel: 0, tilt: 0, hoverDecay: 0.15, radius: 16 }
};

const PRESET_OPTIONS = [
  { value: 'torn', label: 'Torn' },
  { value: 'shatter', label: 'Shatter' },
  { value: 'melt', label: 'Melt' },
  { value: 'prism', label: 'Prism' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'still', label: 'Still' }
];

const COMPUTED_PROPS = { image: IMAGE };

const propData: PropRow[] = [
  { name: 'image', type: 'string', default: '-', description: 'Image URL. It fills the card like a cover.' },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'Content shown over the bottom of the image.'
  },
  { name: 'width', type: 'number', default: '300', description: 'Card width in pixels.' },
  { name: 'height', type: 'number', default: '400', description: 'Card height in pixels.' },
  {
    name: 'intensity',
    type: 'number',
    default: '0.5',
    description:
      'How far the image tears apart at full decay, from 0 to 2. The edges tear the most so the photo stays readable.'
  },
  {
    name: 'sensitivity',
    type: 'number',
    default: '0.5',
    description: 'How little pointer movement it takes to reach full decay, from 0 to 1.'
  },
  {
    name: 'hoverDecay',
    type: 'number',
    default: '0.05',
    description: 'Decay that stays while the pointer rests on the card, from 0 to 1.'
  },
  {
    name: 'recovery',
    type: 'number',
    default: '0.6',
    description: 'Seconds the image takes to pull itself back together once the pointer slows down.'
  },
  {
    name: 'idle',
    type: 'number',
    default: '0.35',
    description: 'Keeps the edges slowly fraying and soft patches drifting while nobody interacts, from 0 to 1.'
  },
  {
    name: 'grain',
    type: 'number',
    default: '0.25',
    description: 'Size of the tears, from broad melting shapes at 0 to fine shards at 1.'
  },
  {
    name: 'detail',
    type: 'number',
    default: '5',
    description: 'Layers of noise in the tears, from 1 to 8. More layers give rougher edges.'
  },
  { name: 'pattern', type: 'number', default: '4', description: 'Picks a different tear pattern.' },
  {
    name: 'flow',
    type: 'number',
    default: '0',
    description: 'Lets the tears churn while the card is decaying. 0 keeps them still.'
  },
  {
    name: 'chroma',
    type: 'number',
    default: '0',
    description: 'Splits the color channels apart inside the tears.'
  },
  {
    name: 'travel',
    type: 'number',
    default: '50',
    description: 'How far in pixels the card drifts toward the pointer before it slows down.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '10',
    description: 'How far in degrees the card rotates as the pointer moves sideways.'
  },
  {
    name: 'scope',
    type: "'window' | 'card'",
    default: "'window'",
    description: 'Window follows the pointer anywhere on the page. Card only reacts while it is hovered.'
  },
  { name: 'radius', type: 'number', default: '0', description: 'Corner radius of the image in pixels.' },
  { name: 'grayscale', type: 'boolean', default: 'false', description: 'Shows the image in grayscale.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

export default function DecayCardDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    const defaults = defaultProps();
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(key => [key, defaults[key as keyof typeof DEFAULT_PROPS]])
    );
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={COMPUTED_PROPS}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '560px', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                width: '100%',
                height: '100%'
              }}
            >
              <DecayCard {...(settings() as DecayCardProps)} image={IMAGE}>
                <p style={{ margin: '0 0 4px', 'font-size': '12px', color: 'rgba(255, 255, 255, 0.72)' }}>No. 01</p>
                <p
                  style={{
                    margin: 0,
                    'font-size': '22px',
                    'font-weight': 500,
                    'letter-spacing': '-0.4px',
                    'line-height': 1.15
                  }}
                >
                  Afterglow
                </p>
              </DecayCard>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={2}
              step={0.05}
              value={settings().intensity}
              onChange={v => updateProp('intensity', v)}
            />
            <PreviewSlider
              title="Sensitivity"
              min={0}
              max={1}
              step={0.05}
              value={settings().sensitivity}
              onChange={v => updateProp('sensitivity', v)}
            />
            <PreviewSlider
              title="Hover Decay"
              min={0}
              max={1}
              step={0.05}
              value={settings().hoverDecay}
              onChange={v => updateProp('hoverDecay', v)}
            />
            <PreviewSlider
              title="Recovery"
              min={0.1}
              max={3}
              step={0.1}
              value={settings().recovery}
              valueUnit="s"
              onChange={v => updateProp('recovery', v)}
            />
            <PreviewSlider
              title="Idle"
              min={0}
              max={1}
              step={0.05}
              value={settings().idle}
              onChange={v => updateProp('idle', v)}
            />
            <PreviewSlider
              title="Grain"
              min={0}
              max={1}
              step={0.01}
              value={settings().grain}
              onChange={v => updateProp('grain', v)}
            />
            <PreviewSlider
              title="Detail"
              min={1}
              max={8}
              step={1}
              value={settings().detail}
              onChange={v => updateProp('detail', v)}
            />
            <PreviewSlider
              title="Pattern"
              min={0}
              max={50}
              step={1}
              value={settings().pattern}
              onChange={v => updateProp('pattern', v)}
            />
            <PreviewSlider
              title="Flow"
              min={0}
              max={2}
              step={0.05}
              value={settings().flow}
              onChange={v => updateProp('flow', v)}
            />
            <PreviewSlider
              title="Chroma"
              min={0}
              max={2}
              step={0.05}
              value={settings().chroma}
              onChange={v => updateProp('chroma', v)}
            />
            <PreviewSlider
              title="Travel"
              min={0}
              max={150}
              step={5}
              value={settings().travel}
              valueUnit="px"
              onChange={v => updateProp('travel', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={settings().tilt}
              valueUnit="°"
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSelect
              title="Scope"
              options={SCOPE_OPTIONS}
              value={settings().scope}
              onChange={v => updateProp('scope', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Width"
              min={200}
              max={420}
              step={10}
              value={settings().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={260}
              max={480}
              step={10}
              value={settings().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSwitch
              title="Grayscale"
              isChecked={settings().grayscale}
              onChange={v => updateProp('grayscale', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={decayCard} componentName="DecayCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
