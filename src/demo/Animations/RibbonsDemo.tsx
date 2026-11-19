import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorList from '@/components/common/PreviewColorList';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import Ribbons, { type RibbonsProps } from '@/content/Animations/Ribbons/Ribbons';
import { ribbons } from '@/constants/code/Animations/ribbonsCode';
import { LOOK, PRESET_OPTIONS, presetProps, type RibbonsShape } from './presets/Ribbons';

const DEFAULT_PROPS = { preset: 'layers', ...LOOK };

const SHAPE_OPTIONS = [
  { value: 'lens', label: 'Lens' },
  { value: 'comet', label: 'Comet' },
  { value: 'even', label: 'Even' }
];

const propData: PropRow[] = [
  {
    name: 'colors',
    type: 'string[]',
    default: "['#0aa0ef', '#6ec9f7', '#c4def2']",
    description: 'One ribbon is drawn for each color, in order from back to front.'
  },
  {
    name: 'shape',
    type: "'lens' | 'comet' | 'even'",
    default: "'lens'",
    description: 'Width along each ribbon. Lens swells in the middle, comet is widest at the cursor, even stays level.'
  },
  { name: 'thickness', type: 'number', default: '30', description: 'Width of each ribbon at its widest, in pixels.' },
  {
    name: 'length',
    type: 'number',
    default: '1.4',
    description: 'How far the ribbons trail behind the cursor. Higher values leave longer, lazier trails.'
  },
  { name: 'spread', type: 'number', default: '18', description: 'Space between the ribbons, in pixels.' },
  {
    name: 'stiffness',
    type: 'number',
    default: '0.5',
    description: 'How tightly the ribbons chase the cursor, from 0 to 1.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.5',
    description: 'How far the ribbons overshoot and swing back when the cursor stops or turns, from 0 to 1.'
  },
  { name: 'wave', type: 'number', default: '0', description: 'A wave that rolls along each ribbon, from 0 to 1.' },
  {
    name: 'softness',
    type: 'number',
    default: '0',
    description: 'Blurs the ribbon edges into soft light trails, from 0 to 1.'
  },
  { name: 'opacity', type: 'number', default: '1', description: 'Opacity of the ribbons.' },
  { name: 'fade', type: 'boolean', default: 'false', description: 'Fades each ribbon out toward its tail.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Color behind the ribbons. By default the canvas is transparent.'
  },
  { name: 'dpr', type: 'number', default: 'auto', description: 'Maximum device pixel ratio, capped at 2.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function RibbonsDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    updateProps({ ...presetProps(value, { defaults: defaultProps() }), preset: value });
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
          <div
            class="demo-container h-[380px] md:h-[500px]"
            style={{ position: 'relative', padding: 0, overflow: 'hidden' }}
          >
            <p
              class="demo-instruction"
              style={{ position: 'absolute', 'font-size': 'clamp(2rem, 6vw, 6rem)', 'font-weight': 500, margin: 0 }}
            >
              Hover Me.
            </p>
            <Ribbons {...(settings() as RibbonsProps)} />
          </div>

          <Customize>
            <PreviewColorList
              title="Colors"
              colors={settings().colors}
              min={1}
              max={8}
              onChange={value => updateProp('colors', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={settings().shape}
              onChange={(value: RibbonsShape) => updateProp('shape', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={4}
              max={80}
              step={1}
              value={settings().thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Length"
              min={0.3}
              max={3}
              step={0.05}
              value={settings().length}
              onChange={value => updateProp('length', value)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={60}
              step={1}
              value={settings().spread}
              valueUnit="px"
              isDisabled={settings().colors.length < 2}
              onChange={value => updateProp('spread', value)}
            />
            <PreviewSlider
              title="Stiffness"
              min={0}
              max={1}
              step={0.05}
              value={settings().stiffness}
              onChange={value => updateProp('stiffness', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings().bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Wave"
              min={0}
              max={1}
              step={0.05}
              value={settings().wave}
              onChange={value => updateProp('wave', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={settings().softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={settings().opacity}
              onChange={value => updateProp('opacity', value)}
            />
            <PreviewSwitch title="Fade" isChecked={settings().fade} onChange={value => updateProp('fade', value)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ribbons} componentName="Ribbons" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
