import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';

import PixelSwap, { type PixelSwapProps } from '@/content/Animations/PixelSwap/PixelSwap';
import { pixelSwap } from '@/constants/code/Animations/pixelSwapCode';

const LOOK = {
  pattern: 'pointer',
  pixelSize: 48,
  gap: 0,
  pixelRadius: 0,
  pixelScale: 0,
  pixelSpin: 0,
  duration: 400,
  pixelDuration: 350,
  randomness: 0.2,
  bounce: 0.3
};

const DEFAULT_PROPS = {
  preset: 'pixels',
  ...LOOK,
  trigger: 'hover',
  intro: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  pixels: {},
  dots: { pixelSize: 32, gap: 4, pixelRadius: 50, randomness: 0.3 },
  spin: { pixelSize: 64, pixelSpin: 90 },
  scatter: { pattern: 'random', pixelSize: 40, pixelScale: 0.35, duration: 600, randomness: 0 },
  blocks: { pixelSize: 96, gap: 8, pixelRadius: 20, bounce: 0.5 }
};

const PRESET_OPTIONS = [
  { value: 'pixels', label: 'Pixels' },
  { value: 'dots', label: 'Dots' },
  { value: 'spin', label: 'Spin' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'blocks', label: 'Blocks' }
];

const PATTERN_OPTIONS = [
  { value: 'pointer', label: 'Pointer' },
  { value: 'random', label: 'Random' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'left-to-right', label: 'Left to Right' },
  { value: 'right-to-left', label: 'Right to Left' },
  { value: 'top-to-bottom', label: 'Top to Bottom' },
  { value: 'bottom-to-top', label: 'Bottom to Top' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: 'spiral', label: 'Spiral' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const propData: PropRow[] = [
  { name: 'firstContent', type: 'JSX.Element', default: '-', description: 'Content shown at rest.' },
  { name: 'secondContent', type: 'JSX.Element', default: '-', description: 'Content that builds in pixel by pixel.' },
  {
    name: 'pattern',
    type: "'pointer' | 'random' | 'center' | 'edges' | 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top' | 'diagonal' | 'spiral'",
    default: "'pointer'",
    description: 'Order the pixels arrive in. Pointer starts the wave where the cursor enters, leaves or clicks.'
  },
  {
    name: 'pixelSize',
    type: 'number',
    default: '48',
    description: 'Edge length of each pixel in px. Grows automatically when the grid would pass 600 pixels.'
  },
  { name: 'gap', type: 'number', default: '0', description: 'Space between pixels in px while they grow.' },
  {
    name: 'pixelRadius',
    type: 'number',
    default: '0',
    description: 'Corner rounding of the pixels while they grow, as a percentage. 50 starts them as dots.'
  },
  {
    name: 'pixelScale',
    type: 'number',
    default: '0',
    description: 'Size each pixel pops in at, from 0 to grow out of nothing to 0.9 for a hard pop.'
  },
  { name: 'pixelSpin', type: 'number', default: '0', description: 'Degrees each pixel turns as it grows in.' },
  { name: 'duration', type: 'number', default: '400', description: 'Time in ms the wave takes to cross the content.' },
  { name: 'pixelDuration', type: 'number', default: '350', description: 'Time in ms a single pixel takes to grow.' },
  {
    name: 'randomness',
    type: 'number',
    default: '0.2',
    description: 'Noise mixed into the pattern, from 0 for a clean wave to 1 for a scatter.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.3',
    description: 'How far each pixel overshoots before it settles, from 0 to 1.'
  },
  {
    name: 'trigger',
    type: "'hover' | 'click' | 'none'",
    default: "'hover'",
    description: 'What starts the swap. With none, drive it with active.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Builds the first content in from pixels on mount.' },
  { name: 'initialActive', type: 'boolean', default: 'false', description: 'Starts on the second content.' },
  {
    name: 'active',
    type: 'boolean',
    default: '-',
    description: 'Controls which content shows. Pair it with onActiveChange.'
  },
  {
    name: 'onActiveChange',
    type: '(active: boolean) => void',
    default: '-',
    description: 'Called when the trigger asks to swap.'
  },
  { name: 'onComplete', type: '(active: boolean) => void', default: '-', description: 'Called when a swap finishes.' },
  { name: 'aspectRatio', type: 'string', default: "'16 / 10'", description: 'Aspect ratio of the root.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

const Photo = (props: { src: string }) => (
  <img
    src={props.src}
    alt=""
    draggable="false"
    style={{ display: 'block', width: '100%', height: '100%', 'object-fit': 'cover' }}
  />
);

export default function PixelSwapDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
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
            class="demo-container"
            style={{
              position: 'relative',
              height: '460px',
              padding: '24px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <div style={{ width: '100%', 'max-width': '560px' }}>
              <Keyed token={rerenderKey()}>
                {() => (
                  <PixelSwap
                    firstContent={<Photo src="/assets/demo/day-sky.webp" />}
                    secondContent={<Photo src="/assets/demo/night-sky.webp" />}
                    style={{ 'border-radius': '18px', cursor: settings().trigger === 'click' ? 'pointer' : 'default' }}
                    {...(settings() as PixelSwapProps)}
                  />
                )}
              </Keyed>
            </div>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Pattern"
              options={PATTERN_OPTIONS}
              value={settings().pattern}
              onChange={v => updateProp('pattern', v)}
            />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings().trigger}
              onChange={v => updateProp('trigger', v)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={16}
              max={128}
              step={2}
              value={settings().pixelSize}
              valueUnit="px"
              onChange={v => updateProp('pixelSize', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={16}
              step={1}
              value={settings().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Pixel Radius"
              min={0}
              max={50}
              step={1}
              value={settings().pixelRadius}
              valueUnit="%"
              onChange={v => updateProp('pixelRadius', v)}
            />
            <PreviewSlider
              title="Pixel Scale"
              min={0}
              max={0.9}
              step={0.01}
              value={settings().pixelScale}
              onChange={v => updateProp('pixelScale', v)}
            />
            <PreviewSlider
              title="Pixel Spin"
              min={-180}
              max={180}
              step={5}
              value={settings().pixelSpin}
              valueUnit="°"
              onChange={v => updateProp('pixelSpin', v)}
            />
            <PreviewSlider
              title="Duration"
              min={0}
              max={1500}
              step={10}
              value={settings().duration}
              valueUnit="ms"
              onChange={v => updateProp('duration', v)}
            />
            <PreviewSlider
              title="Pixel Duration"
              min={120}
              max={1200}
              step={10}
              value={settings().pixelDuration}
              valueUnit="ms"
              onChange={v => updateProp('pixelDuration', v)}
            />
            <PreviewSlider
              title="Randomness"
              min={0}
              max={1}
              step={0.01}
              value={settings().randomness}
              onChange={v => updateProp('randomness', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.8}
              step={0.01}
              value={settings().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={v => {
                updateProp('intro', v);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pixelSwap} componentName="PixelSwap" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
