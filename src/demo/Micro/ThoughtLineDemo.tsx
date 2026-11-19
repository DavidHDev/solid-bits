import { createEffect, createMemo, createSignal } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import ThoughtLine from '@/content/Micro/ThoughtLine/ThoughtLine';
import { thoughtLine } from '@/constants/code/Micro/thoughtLineCode';

const DEFAULT_PROPS = {
  label: 'Thinking…',
  doneLabel: '',
  glyph: 'sparkle',
  color: '#f5f5f5',
  glyphColor: '',
  fontSize: 18,
  breathPeriod: 1.6,
  breathDepth: 0.45,
  shimmer: true,
  shimmerDuration: 1.8,
  settleDuration: 350,
  settleBlur: 2,
  showTimer: true,
  trace: true,
  collapsible: true,
  loop: true,
  working: true
};

const GLYPH_OPTIONS = [
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'dot', label: 'Dot' },
  { value: 'none', label: 'None' }
];

const STEPS = ['Reading the question', 'Searching your notes', 'Comparing two approaches', 'Drafting an answer'];
const NO_STEPS: string[] = [];
const STEP_MS = 900;
const FIRST_MS = 500;
const REST_MS = 2600;

const propData: PropRow[] = [
  {
    name: 'label',
    type: 'string',
    default: '"Thinking…"',
    description: 'The working line. It breathes, and it is the spoken text.'
  },
  {
    name: 'doneLabel',
    type: 'string',
    default: '""',
    description: 'The settled line. Empty gives "Thought for", or "Done thinking" without the timer.'
  },
  {
    name: 'renderLabel',
    type: '(text, working) => JSX.Element',
    default: '-',
    description: 'Wraps either string, for a sheen or a link. Inline content only.'
  },
  {
    name: 'glyph',
    type: "'sparkle' | 'dot' | 'none' | JSX.Element",
    default: "'sparkle'",
    description: 'The mark that breathes and dims.'
  },
  {
    name: 'steps',
    type: 'string[]',
    default: '[]',
    description:
      'The trace beneath the line. Append as the agent progresses; the last step is current, earlier ones tick.'
  },
  {
    name: 'collapsible',
    type: 'boolean',
    default: 'true',
    description: 'The line becomes a toggle for the trace, with a chevron.'
  },
  {
    name: 'collapseOnSettle',
    type: 'boolean',
    default: 'true',
    description: 'Fold the trace into the line when it settles.'
  },
  { name: 'color', type: 'string', default: '"currentColor"', description: 'The ink of the line and the trace.' },
  { name: 'glyphColor', type: 'string', default: '""', description: 'The glyph alone. Empty follows the ink.' },
  { name: 'fontSize', type: 'number', default: '16', description: 'Type size in px. Everything scales in em.' },
  { name: 'breathPeriod', type: 'number', default: '1.6', description: 'One breath, up and down, in seconds.' },
  {
    name: 'breathDepth',
    type: 'number',
    default: '0.45',
    description: 'How far the glyph and label dim at the trough. 0 is no breath.'
  },
  {
    name: 'shimmer',
    type: 'boolean',
    default: 'true',
    description: 'A band of ink sweeps the working label. The label then leaves the breath to the glyph.'
  },
  { name: 'shimmerDuration', type: 'number', default: '1.8', description: 'One sweep, in seconds.' },
  {
    name: 'settleDuration',
    type: 'number',
    default: '350',
    description: 'The settle chord, in ms: crossfade, dim, glide, fold.'
  },
  { name: 'settleBlur', type: 'number', default: '2', description: 'Blur through the crossfade seam, in px.' },
  {
    name: 'working',
    type: 'boolean',
    default: 'true',
    description: 'Working or settled. True again starts a new clock.'
  },
  {
    name: 'settleAfter',
    type: 'number',
    default: '0',
    description: 'Seconds after which the line settles by itself. 0 waits for working.'
  },
  {
    name: 'elapsed',
    type: 'number',
    default: 'undefined',
    description: 'Controlled seconds. The internal clock never runs.'
  },
  {
    name: 'showTimer',
    type: 'boolean',
    default: 'true',
    description: 'The live clock that freezes into the sentence.'
  },
  {
    name: 'onSettle',
    type: '(seconds) => void',
    default: '-',
    description: 'Once per settle, with the frozen time.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

export default function ThoughtLineDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const renderedGlyph = createMemo(() => props().glyphColor || renderedColor());

  const [run, setRun] = createSignal(0);
  const loop = createMemo(() => props().loop);
  const [loopWorking, setLoopWorking] = createSignal<boolean>(() => {
    loop();
    run();
    return true;
  });
  const [steps, setSteps] = createSignal<string[]>(() => {
    const on = loop();
    run();
    return on ? NO_STEPS : STEPS;
  });

  createEffect(
    () => ({ on: loop(), run: run() }),
    v => {
      if (!v.on) return undefined;
      const timers: ReturnType<typeof setTimeout>[] = [];
      const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
      STEPS.forEach((step, i) => at(FIRST_MS + i * STEP_MS, () => setSteps(s => [...s, step])));
      at(FIRST_MS + STEPS.length * STEP_MS, () => setLoopWorking(false));
      at(FIRST_MS + STEPS.length * STEP_MS + REST_MS, () => setRun(r => r + 1));
      return () => timers.forEach(clearTimeout);
    }
  );

  const working = () => (props().loop ? loopWorking() : props().working);

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '400px',
              overflow: 'hidden',
              'align-items': 'flex-start',
              'padding-top': '188px'
            }}
          >
            <RefreshButton onClick={() => setRun(r => r + 1)} />
            <ThoughtLine
              label={props().label}
              doneLabel={props().doneLabel}
              glyph={props().glyph}
              steps={props().trace ? steps() : NO_STEPS}
              collapsible={props().collapsible}
              color={renderedColor()}
              glyphColor={renderedGlyph()}
              fontSize={props().fontSize}
              breathPeriod={props().breathPeriod}
              breathDepth={props().breathDepth}
              shimmer={props().shimmer}
              shimmerDuration={props().shimmerDuration}
              settleDuration={props().settleDuration}
              settleBlur={props().settleBlur}
              working={working()}
              showTimer={props().showTimer}
            />
          </div>

          <Customize>
            <PreviewSwitch title="Loop" isChecked={props().loop} onChange={val => updateProp('loop', val)} />
            <PreviewSwitch
              title="Working"
              isChecked={working()}
              isDisabled={props().loop}
              onChange={val => updateProp('working', val)}
            />
            <PreviewInput
              title="Label"
              value={props().label}
              maxLength={24}
              onChange={val => updateProp('label', val)}
            />
            <PreviewInput
              title="Done Label"
              value={props().doneLabel}
              maxLength={24}
              onChange={val => updateProp('doneLabel', val)}
            />
            <PreviewSelect
              title="Glyph"
              options={GLYPH_OPTIONS}
              value={props().glyph}
              onChange={(val: string) => updateProp('glyph', val)}
              width={120}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={val => updateProp('color', val)} />
            <PreviewColorPickerCustom
              title="Glyph Color"
              color={renderedGlyph()}
              onChange={val => updateProp('glyphColor', val)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={28}
              step={1}
              value={props().fontSize}
              valueUnit="px"
              onChange={val => updateProp('fontSize', val)}
            />
            <PreviewSlider
              title="Breath Period"
              min={0.8}
              max={3}
              step={0.1}
              value={props().breathPeriod}
              valueUnit="s"
              onChange={val => updateProp('breathPeriod', val)}
            />
            <PreviewSlider
              title="Breath Depth"
              min={0}
              max={0.6}
              step={0.05}
              value={props().breathDepth}
              onChange={val => updateProp('breathDepth', val)}
            />
            <PreviewSwitch title="Shimmer" isChecked={props().shimmer} onChange={val => updateProp('shimmer', val)} />
            <PreviewSlider
              title="Shimmer Speed"
              min={0.8}
              max={4}
              step={0.1}
              value={props().shimmerDuration}
              valueUnit="s"
              isDisabled={!props().shimmer}
              onChange={val => updateProp('shimmerDuration', val)}
            />
            <PreviewSlider
              title="Settle"
              min={150}
              max={600}
              step={10}
              value={props().settleDuration}
              valueUnit="ms"
              onChange={val => updateProp('settleDuration', val)}
            />
            <PreviewSlider
              title="Settle Blur"
              min={0}
              max={6}
              step={0.5}
              value={props().settleBlur}
              valueUnit="px"
              onChange={val => updateProp('settleBlur', val)}
            />
            <PreviewSwitch
              title="Show Timer"
              isChecked={props().showTimer}
              onChange={val => updateProp('showTimer', val)}
            />
            <PreviewSwitch title="Trace" isChecked={props().trace} onChange={val => updateProp('trace', val)} />
            <PreviewSwitch
              title="Collapsible"
              isChecked={props().collapsible}
              onChange={val => updateProp('collapsible', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={thoughtLine} componentName="ThoughtLine" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
