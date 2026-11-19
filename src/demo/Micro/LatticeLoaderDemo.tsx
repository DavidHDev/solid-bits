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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import LatticeLoader, {
  type LatticeGrid,
  type LatticePatternName,
  type LatticeStatus
} from '@/content/Micro/LatticeLoader/LatticeLoader';
import { latticeLoader } from '@/constants/code/Micro/latticeLoaderCode';

const DEFAULT_PROPS = {
  status: 'working' as LatticeStatus,
  pattern: 'orbit' as LatticePatternName,
  grid: 3 as LatticeGrid,
  shape: 'round' as 'square' | 'round',
  color: '#f5f5f5',
  doneColor: '#22c55e',
  errorColor: '#ef4444',
  cellSize: 6,
  gap: 2,
  fontSize: 14,
  step: 90,
  idleOpacity: 0.15,
  glow: false,
  glowColor: '',
  showTimer: true,
  label: 'Thinking',
  doneLabel: 'Done in',
  errorLabel: 'Failed after'
};

const STATUS_OPTIONS = [
  { value: 'working', label: 'Working' },
  { value: 'done', label: 'Done' },
  { value: 'error', label: 'Error' }
];

const PATTERN_OPTIONS: Record<LatticeGrid, { value: LatticePatternName; label: string }[]> = {
  3: [
    { value: 'arrow', label: 'Arrow' },
    { value: 'dots', label: 'Dots' },
    { value: 'orbit', label: 'Orbit' },
    { value: 'ripple', label: 'Ripple' },
    { value: 'snake', label: 'Snake' },
    { value: 'spiral', label: 'Spiral' }
  ],
  4: [
    { value: 'sweep', label: 'Sweep' },
    { value: 'spin', label: 'Spin' },
    { value: 'rain', label: 'Rain' },
    { value: 'pulse', label: 'Pulse' },
    { value: 'orbit', label: 'Orbit' },
    { value: 'snake', label: 'Snake' }
  ]
};

const GRID_OPTIONS = [
  { value: 3, label: '3 x 3' },
  { value: 4, label: '4 x 4' }
];

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'round', label: 'Round' }
];

const propData: PropRow[] = [
  { name: 'label', type: 'string', default: '"Thinking"', description: 'The verb while working.' },
  {
    name: 'doneLabel',
    type: 'string',
    default: '"Done in"',
    description: 'The verb after status turns to done; the frozen time follows it.'
  },
  {
    name: 'errorLabel',
    type: 'string',
    default: '"Failed after"',
    description: 'The verb after status turns to error.'
  },
  {
    name: 'status',
    type: '"working" | "done" | "error"',
    default: '"working"',
    description:
      'Drives everything: the wave runs, or freezes and dissolves into a check or a cross while the stopwatch stops.'
  },
  {
    name: 'pattern',
    type: 'string | { cells, loop?, scale? }',
    default: '"orbit"',
    description:
      'The wave geometry. At 3 x 3: arrow, dots, orbit, ripple, snake, spiral. At 4 x 4: sweep, spin, rain, pulse, orbit, snake. A custom object gives one delay per cell in step units (null for a hole), an optional loop and scale, and lit: the share of the cycle a cell stays bright, 0.25, 0.35, 0.45 or 0.62.'
  },
  {
    name: 'grid',
    type: '3 | 4',
    default: '3',
    description: 'Cells per side. Each size has its own set of patterns and its own check and cross.'
  },
  { name: 'shape', type: '"square" | "round"', default: '"round"', description: 'Rounded tiles or dots.' },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Ink for the cells, the verb and the stopwatch. Inherits the page colour by default.'
  },
  { name: 'doneColor', type: 'string', default: '"#22c55e"', description: 'Colour of the check.' },
  { name: 'errorColor', type: 'string', default: '"#ef4444"', description: 'Colour of the cross.' },
  {
    name: 'cellSize',
    type: 'number',
    default: '6',
    description: 'Cell side in pixels; the lattice is three cells and two gaps.'
  },
  { name: 'gap', type: 'number', default: '2', description: 'Seam between cells in pixels.' },
  {
    name: 'fontSize',
    type: 'number',
    default: '14',
    description: 'Verb size in pixels; the stopwatch and row gap scale with it.'
  },
  {
    name: 'step',
    type: 'number',
    default: '90',
    description: 'Milliseconds between neighbouring cells lighting; the whole loop scales with it.'
  },
  { name: 'idleOpacity', type: 'number', default: '0.15', description: 'How visible the dark silhouette is.' },
  { name: 'glow', type: 'boolean', default: 'false', description: 'A halo on the lit cells and the mark.' },
  {
    name: 'glowColor',
    type: 'string',
    default: '""',
    description: 'The halo colour. Empty follows the ink, and the mark colour for the mark.'
  },
  { name: 'showTimer', type: 'boolean', default: 'true', description: 'Shows the live stopwatch.' },
  {
    name: 'elapsed',
    type: 'number',
    default: 'undefined',
    description: 'Controlled elapsed seconds. When set, the internal clock never runs.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the row.' },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles merged onto the row.'
  }
];

export default function LatticeLoaderDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const patternOptions = () => PATTERN_OPTIONS[props().grid] || PATTERN_OPTIONS[3];

  const changeGrid = (next: LatticeGrid) => {
    if (!PATTERN_OPTIONS[next].some(opt => opt.value === props().pattern))
      updateProps({ grid: next, pattern: next === 4 ? 'sweep' : 'orbit' });
    else updateProp('grid', next);
  };

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
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <LatticeLoader
              status={props().status}
              pattern={props().pattern}
              grid={props().grid}
              shape={props().shape}
              color={renderedColor()}
              doneColor={props().doneColor}
              errorColor={props().errorColor}
              cellSize={props().cellSize}
              gap={props().gap}
              fontSize={props().fontSize}
              step={props().step}
              idleOpacity={props().idleOpacity}
              glow={props().glow}
              glowColor={props().glowColor}
              showTimer={props().showTimer}
              label={props().label}
              doneLabel={props().doneLabel}
              errorLabel={props().errorLabel}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={props().status}
              onChange={(v: LatticeStatus) => updateProp('status', v)}
              width={120}
            />
            <PreviewSelect
              title="Pattern"
              options={patternOptions()}
              value={props().pattern}
              onChange={(v: LatticePatternName) => updateProp('pattern', v)}
              width={120}
            />
            <PreviewSelect
              title="Grid"
              options={GRID_OPTIONS}
              value={props().grid}
              onChange={v => changeGrid(Number(v) === 4 ? 4 : 3)}
              width={120}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={props().shape}
              onChange={(v: 'square' | 'round') => updateProp('shape', v)}
              width={120}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Done"
              color={props().doneColor}
              onChange={v => updateProp('doneColor', v)}
            />
            <PreviewColorPickerCustom
              title="Error"
              color={props().errorColor}
              onChange={v => updateProp('errorColor', v)}
            />
            <PreviewSlider
              title="Cell Size"
              min={4}
              max={14}
              step={1}
              value={props().cellSize}
              valueUnit="px"
              onChange={v => updateProp('cellSize', v)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={8}
              step={1}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={24}
              step={1}
              value={props().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Step"
              min={40}
              max={160}
              step={5}
              value={props().step}
              valueUnit="ms"
              onChange={v => updateProp('step', v)}
            />
            <PreviewSlider
              title="Idle Opacity"
              min={0.05}
              max={0.4}
              step={0.01}
              value={props().idleOpacity}
              onChange={v => updateProp('idleOpacity', v)}
            />
            <PreviewSwitch title="Glow" isChecked={props().glow} onChange={v => updateProp('glow', v)} />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={props().glowColor || renderedColor()}
              onChange={v => updateProp('glowColor', v)}
            />
            <PreviewSwitch
              title="Show Timer"
              isChecked={props().showTimer}
              onChange={v => updateProp('showTimer', v)}
            />
            <PreviewInput title="Label" value={props().label} maxLength={16} onChange={v => updateProp('label', v)} />
            <PreviewInput
              title="Done Label"
              value={props().doneLabel}
              maxLength={16}
              onChange={v => updateProp('doneLabel', v)}
            />
            <PreviewInput
              title="Error Label"
              value={props().errorLabel}
              maxLength={16}
              onChange={v => updateProp('errorLabel', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={latticeLoader} componentName="LatticeLoader" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
