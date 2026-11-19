import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
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

import FallingText, { type FallingTextProps } from '@/content/TextAnimations/FallingText/FallingText';
import { fallingText } from '@/constants/code/TextAnimations/fallingTextCode';

const SENTENCE = 'Some sentences are built to last. This one falls apart on contact.';
const HIGHLIGHTS = ['falls', 'apart'];
const NO_HIGHLIGHTS: string[] = [];

const FEEL = {
  trigger: 'hover',
  variant: 'text',
  split: 'words',
  order: 'random',
  gravity: 1,
  bounciness: 0.2,
  scatter: 0.5,
  stagger: 0.03,
  cursorPush: 0.5,
  mouseConstraintStiffness: 0.2,
  restoreDelay: 2,
  size: 2
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...FEEL,
  accentColor: '#5a9bd5',
  draggable: true,
  wireframes: false
};

const PRESETS: Record<string, Partial<typeof FEEL>> = {
  classic: {},
  tiles: { variant: 'tiles', size: 1.5, bounciness: 0.15 },
  letters: { split: 'letters', size: 3.25, order: 'sequence', stagger: 0.035, scatter: 0.8 },
  domino: { order: 'sequence', stagger: 0.12, scatter: 0.2, bounciness: 0.1 },
  bouncy: { bounciness: 0.7, scatter: 1, gravity: 1.3, cursorPush: 1 }
};

const PRESET_TEXT: Record<string, string> = { letters: 'Gravity always wins' };

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'letters', label: 'Letters' },
  { value: 'domino', label: 'Domino' },
  { value: 'bouncy', label: 'Bouncy' }
];

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' },
  { value: 'auto', label: 'Auto' },
  { value: 'scroll', label: 'Scroll' }
];

const VARIANT_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'tiles', label: 'Tiles' }
];

const SPLIT_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'letters', label: 'Letters' }
];

const ORDER_OPTIONS = [
  { value: 'random', label: 'Random' },
  { value: 'sequence', label: 'Sequence' },
  { value: 'center', label: 'Center' },
  { value: 'together', label: 'Together' }
];

const propData: PropRow[] = [
  { name: 'text', type: 'string', default: "''", description: 'The text that falls apart.' },
  {
    name: 'highlightWords',
    type: 'string[]',
    default: '[]',
    description:
      'Words that start with any of these strings get the accent color, or the accent tile in the tiles variant.'
  },
  {
    name: 'highlightClass',
    type: 'string',
    default: "'highlighted'",
    description: 'Extra class added to highlighted words.'
  },
  {
    name: 'trigger',
    type: "'auto' | 'hover' | 'click' | 'scroll'",
    default: "'auto'",
    description: 'What starts the fall. Scroll starts it when the text scrolls into view.'
  },
  {
    name: 'variant',
    type: "'text' | 'tiles'",
    default: "'text'",
    description: 'Plain falling text, or words on tiles that stack like blocks.'
  },
  {
    name: 'split',
    type: "'words' | 'letters'",
    default: "'words'",
    description: 'Whether whole words or single letters fall.'
  },
  {
    name: 'order',
    type: "'random' | 'sequence' | 'center' | 'together'",
    default: "'random'",
    description: 'Which pieces drop first. Falling pieces knock loose the ones they land on.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.03',
    description: 'Delay between pieces dropping, in seconds.'
  },
  { name: 'gravity', type: 'number', default: '1', description: 'Strength of gravity. Negative values fall upward.' },
  {
    name: 'bounciness',
    type: 'number',
    default: '0.2',
    description: 'How much pieces bounce when they land, from 0 to 1.'
  },
  {
    name: 'scatter',
    type: 'number',
    default: '0.5',
    description: 'How much spin and sideways push each piece gets as it drops, from 0 to 1.'
  },
  { name: 'draggable', type: 'boolean', default: 'true', description: 'Lets people pick up, drag and throw pieces.' },
  {
    name: 'mouseConstraintStiffness',
    type: 'number',
    default: '0.2',
    description: 'How tightly a dragged piece follows the pointer, from 0 to 1.'
  },
  {
    name: 'cursorPush',
    type: 'number',
    default: '0.5',
    description: 'How hard a quick swipe knocks the fallen pieces around. 0 turns it off.'
  },
  {
    name: 'restoreDelay',
    type: 'number',
    default: '0',
    description:
      'Seconds after the pile settles, with the pointer away, before the text flies back into place and can fall again. 0 keeps it fallen.'
  },
  { name: 'fontSize', type: 'string', default: "'1rem'", description: 'Font size of the text.' },
  {
    name: 'accentColor',
    type: 'string',
    default: "'#5a9bd5'",
    description: 'Color of highlighted words, or of their tiles in the tiles variant.'
  },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the tiles.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Background of the area the text falls into.'
  },
  {
    name: 'wireframes',
    type: 'boolean',
    default: 'false',
    description: 'Outlines each piece to show its physics shape.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function FallingTextDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, size: _size, ...rest } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ink = useColorModeValue('#18181b', '#f2f4f7');
  const text = () => PRESET_TEXT[props().preset] ?? SENTENCE;

  const computedProps = createMemo<Record<string, unknown>>(() => ({
    fontSize: `${props().size}rem`,
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  const applyPreset = (value: string) => {
    updateProps({ ...DEFAULT_PROPS, ...PRESETS[value], accentColor: settings().accentColor, preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'size']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '460px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={`${props().preset}-${rerenderKey()}`}>
              {() => (
                <FallingText
                  {...(settings() as FallingTextProps)}
                  text={text()}
                  highlightWords={props().preset === 'letters' ? NO_HIGHLIGHTS : HIGHLIGHTS}
                  fontSize={`${props().size}rem`}
                  theme={theme()}
                  style={{ color: ink() }}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings().trigger}
              onChange={v => updateProp('trigger', v)}
            />
            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={settings().variant}
              onChange={v => updateProp('variant', v)}
            />
            <PreviewSelect
              title="Split"
              options={SPLIT_OPTIONS}
              value={settings().split}
              onChange={v => updateProp('split', v)}
            />
            <PreviewSelect
              title="Order"
              options={ORDER_OPTIONS}
              value={settings().order}
              onChange={v => updateProp('order', v)}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={settings().accentColor}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={1}
              max={4}
              step={0.25}
              value={props().size}
              valueUnit="rem"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Gravity"
              min={0.2}
              max={2.5}
              step={0.05}
              value={settings().gravity}
              onChange={v => updateProp('gravity', v)}
            />
            <PreviewSlider
              title="Bounciness"
              min={0}
              max={1}
              step={0.05}
              value={settings().bounciness}
              onChange={v => updateProp('bounciness', v)}
            />
            <PreviewSlider
              title="Scatter"
              min={0}
              max={1}
              step={0.05}
              value={settings().scatter}
              onChange={v => updateProp('scatter', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.2}
              step={0.01}
              value={settings().stagger}
              valueUnit="s"
              isDisabled={settings().order === 'together'}
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Cursor Push"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().cursorPush}
              onChange={v => updateProp('cursorPush', v)}
            />
            <PreviewSlider
              title="Drag Stiffness"
              min={0.05}
              max={1}
              step={0.05}
              value={settings().mouseConstraintStiffness}
              isDisabled={!settings().draggable}
              onChange={v => updateProp('mouseConstraintStiffness', v)}
            />
            <PreviewSlider
              title="Restore Delay"
              min={0}
              max={6}
              step={0.5}
              value={settings().restoreDelay}
              valueUnit="s"
              onChange={v => updateProp('restoreDelay', v)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings().draggable}
              onChange={v => updateProp('draggable', v)}
            />
            <PreviewSwitch
              title="Wireframes"
              isChecked={settings().wireframes}
              onChange={v => updateProp('wireframes', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['matter-js']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fallingText} componentName="FallingText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
