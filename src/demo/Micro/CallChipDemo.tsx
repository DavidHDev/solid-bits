import { onSettled } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import CallChip, { type CallChipIcon, type CallChipStatus } from '@/content/Micro/CallChip/CallChip';
import { callChip } from '@/constants/code/Micro/callChipCode';

const DEFAULT_PROPS = {
  status: 'running' as CallChipStatus,
  icon: 'terminal' as CallChipIcon,
  color: '#f5f5f5',
  surfaceColor: '#27272a',
  progressColor: '#f5f5f5',
  progressOpacity: 0.08,
  doneColor: '#22c55e',
  errorColor: '#ef4444',
  size: 34,
  radius: 10,
  expectedMs: 2500,
  washOpacity: 0.14,
  shake: 6,
  showTimer: true
};

const STATUS_OPTIONS = [
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
  { value: 'error', label: 'Error' }
];
const ICON_OPTIONS = [
  { value: 'terminal', label: 'Terminal' },
  { value: 'file', label: 'File' },
  { value: 'search', label: 'Search' },
  { value: 'edit', label: 'Edit' }
];

const propData: PropRow[] = [
  {
    name: 'icon',
    type: '"terminal" | "file" | "search" | "edit" | JSX.Element',
    default: '"terminal"',
    description: 'The tool glyph. It rolls out when the call resolves.'
  },
  { name: 'name', type: 'string', default: '"bash"', description: 'The tool name.' },
  { name: 'argument', type: 'string', default: '"npm test"', description: 'The argument.' },
  {
    name: 'status',
    type: '"idle" | "running" | "done" | "error"',
    default: '"running"',
    description:
      'Running wipes the fill across and ticks the counter. Done completes it with a wash. Error stops it, tints and shakes.'
  },
  {
    name: 'expectedMs',
    type: 'number',
    default: '2500',
    description: 'Milliseconds the fill takes to reach its 90% park, the time you expect the call to take.'
  },
  {
    name: 'size',
    type: 'number',
    default: '34',
    description: 'Chip height in pixels. Font, padding and glyph follow.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '10',
    description: 'Corner radius in pixels. Half the height is a pill.'
  },
  { name: 'color', type: 'string', default: '"currentColor"', description: 'Ink for the text and the tool glyph.' },
  { name: 'surfaceColor', type: 'string', default: '"#27272a"', description: 'The chip surface.' },
  {
    name: 'progressColor',
    type: 'string',
    default: '"currentColor"',
    description: 'The fill that wipes across while running.'
  },
  { name: 'progressOpacity', type: 'number', default: '0.08', description: 'How strong that fill is.' },
  { name: 'doneColor', type: 'string', default: '"#22c55e"', description: 'The success wash and the check.' },
  {
    name: 'errorColor',
    type: 'string',
    default: '"#ef4444"',
    description: 'The stopped fill and the retry glyph on error.'
  },
  {
    name: 'washOpacity',
    type: 'number',
    default: '0.14',
    description: 'Strength of the success wash and of the error tint.'
  },
  { name: 'shake', type: 'number', default: '6', description: 'Error shake amplitude in pixels. 0 tints only.' },
  { name: 'showTimer', type: 'boolean', default: 'true', description: 'Shows the millisecond counter.' },
  {
    name: 'onRetry',
    type: '() => void',
    default: '-',
    description: 'When set, the failed chip becomes a retry button.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles merged onto the root.'
  }
];

export default function CallChipDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const renderedSurface = useColorModeValue(
    () => (props().surfaceColor === DEFAULT_PROPS.surfaceColor ? '#f6f6f6' : props().surfaceColor),
    () => props().surfaceColor
  );
  const renderedProgress = useColorModeValue(
    () => (props().progressColor === DEFAULT_PROPS.progressColor ? '#18181b' : props().progressColor),
    () => props().progressColor
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const replay = (expectedMs: number, fail: boolean) => {
    clearTimeout(timer);
    updateProp('status', 'running');
    timer = setTimeout(
      () => updateProp('status', fail ? 'error' : 'done'),
      fail ? Math.round(expectedMs * 0.62) : expectedMs + 300
    );
  };
  const replayNow = () => replay(props().expectedMs, props().status === 'error');
  const reset = () => {
    const changed = props().expectedMs !== DEFAULT_PROPS.expectedMs;
    resetProps();
    if (changed) replay(DEFAULT_PROPS.expectedMs, false);
  };

  onSettled(() => {
    replayNow();
    return () => clearTimeout(timer);
  });

  return (
    <ComponentPropsProvider props={props()} defaultProps={DEFAULT_PROPS} resetProps={reset} hasChanges={hasChanges()}>
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
            <RefreshButton onClick={replayNow} />
            <CallChip
              icon={props().icon}
              status={props().status}
              expectedMs={props().expectedMs}
              size={props().size}
              radius={props().radius}
              color={renderedColor()}
              surfaceColor={renderedSurface()}
              progressColor={renderedProgress()}
              progressOpacity={props().progressOpacity}
              doneColor={props().doneColor}
              errorColor={props().errorColor}
              washOpacity={props().washOpacity}
              shake={props().shake}
              showTimer={props().showTimer}
              onRetry={replayNow}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={props().status}
              onChange={(v: CallChipStatus) => {
                clearTimeout(timer);
                updateProp('status', v);
              }}
              width={120}
            />
            <PreviewSelect
              title="Icon"
              options={ICON_OPTIONS}
              value={props().icon}
              onChange={(v: CallChipIcon) => updateProp('icon', v)}
              width={120}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Surface"
              color={renderedSurface()}
              onChange={v => updateProp('surfaceColor', v)}
            />
            <PreviewColorPickerCustom
              title="Progress"
              color={renderedProgress()}
              onChange={v => updateProp('progressColor', v)}
            />
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
              title="Size"
              min={24}
              max={48}
              step={1}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={24}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Progress Opacity"
              min={0.04}
              max={0.3}
              step={0.01}
              value={props().progressOpacity}
              onChange={v => updateProp('progressOpacity', v)}
            />
            <PreviewSlider
              title="Expected Time"
              min={500}
              max={8000}
              step={100}
              value={props().expectedMs}
              valueUnit="ms"
              onChange={v => {
                const changed = v !== props().expectedMs;
                updateProp('expectedMs', v);
                if (changed) replay(v, props().status === 'error');
              }}
            />
            <PreviewSlider
              title="Wash"
              min={0}
              max={0.4}
              step={0.02}
              value={props().washOpacity}
              onChange={v => updateProp('washOpacity', v)}
            />
            <PreviewSlider
              title="Shake"
              min={0}
              max={12}
              step={1}
              value={props().shake}
              valueUnit="px"
              onChange={v => updateProp('shake', v)}
            />
            <PreviewSwitch
              title="Show Timer"
              isChecked={props().showTimer}
              onChange={v => updateProp('showTimer', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={callChip} componentName="CallChip" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
