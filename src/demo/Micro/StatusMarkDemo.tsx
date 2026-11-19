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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { isLight } from '@/hooks/useTheme';

import StatusMark, { type StatusMarkStatus } from '@/content/Micro/StatusMark/StatusMark';
import { statusMark } from '@/constants/code/Micro/statusMarkCode';

const DEFAULT_PROPS = {
  status: 'running',
  indeterminate: true,
  progress: 0.62,
  label: 'Draft supplier emails',
  color: '#f5f5f5',
  doneColor: '#22c55e',
  errorColor: '#ef4444',
  size: 28,
  strokeWidth: 2,
  dashes: 8,
  fontSize: 16,
  spinDuration: 1100,
  arcLength: 0.68,
  drawDuration: 240,
  fillOpacity: 0.06,
  strike: true,
  strikeDelay: 60
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'done', label: 'Done' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const LIFECYCLE: [StatusMarkStatus, number | undefined, number][] = [
  ['pending', undefined, 900],
  ['running', undefined, 1600],
  ['running', 0.35, 700],
  ['running', 0.72, 700],
  ['running', 1, 400],
  ['done', undefined, 1800],
  ['pending', undefined, 700],
  ['running', undefined, 1200],
  ['cancelled', undefined, 1400],
  ['pending', undefined, 700],
  ['running', 0.4, 900],
  ['failed', undefined, 1600]
];

const propData: PropRow[] = [
  {
    name: 'status',
    type: '"pending" | "running" | "done" | "failed" | "cancelled"',
    default: '"pending"',
    description: 'The lifecycle state. Every change morphs the glyph in place.'
  },
  {
    name: 'progress',
    type: 'number',
    default: 'undefined',
    description: '0 to 1 while running. Leave it out for an indeterminate spinning arc.'
  },
  {
    name: 'label',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Text beside the glyph. It dims and gets struck.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"currentColor"',
    description: 'Ring, arc, cancelled cross and label.'
  },
  { name: 'doneColor', type: 'string', default: '"#22c55e"', description: 'Ring, wash and check when done.' },
  { name: 'errorColor', type: 'string', default: '"#ef4444"', description: 'Ring, wash and cross when failed.' },
  {
    name: 'size',
    type: 'number',
    default: '20',
    description: 'Glyph size in pixels. The label gap is half of it.'
  },
  {
    name: 'strokeWidth',
    type: 'number',
    default: '2',
    description: 'Stroke width in the 24-unit box. The ring shrinks to keep its margin.'
  },
  {
    name: 'dashes',
    type: 'number',
    default: '8',
    description: 'Dashes in the idle ring, the ones that fuse into the arc.'
  },
  {
    name: 'fontSize',
    type: 'number',
    default: '14',
    description: 'Label size in pixels. The strike scales with it.'
  },
  {
    name: 'spinDuration',
    type: 'number',
    default: '1100',
    description: 'Milliseconds per turn of the indeterminate arc.'
  },
  {
    name: 'arcLength',
    type: 'number',
    default: '0.68',
    description: 'Share of the ring the indeterminate arc covers.'
  },
  {
    name: 'drawDuration',
    type: 'number',
    default: '240',
    description: 'Milliseconds the check or cross takes to draw.'
  },
  { name: 'fillOpacity', type: 'number', default: '0.06', description: 'The wash inside a finished ring.' },
  { name: 'strike', type: 'boolean', default: 'true', description: 'Strikes the label through when done.' },
  {
    name: 'strikeDelay',
    type: 'number',
    default: '60',
    description: 'Milliseconds after the check starts before the strike wipes in.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles merged onto the root.'
  }
];

export default function StatusMarkDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedColor = createMemo(() => {
    const color = props().color;
    return isLight() && color === DEFAULT_PROPS.color ? '#18181b' : color;
  });
  const renderedDone = createMemo(() => {
    const color = props().doneColor;
    return isLight() && color === DEFAULT_PROPS.doneColor ? '#16a34a' : color;
  });
  const renderedError = createMemo(() => {
    const color = props().errorColor;
    return isLight() && color === DEFAULT_PROPS.errorColor ? '#dc2626' : color;
  });

  const [play, setPlay] = createSignal(true);
  const [auto, setAuto] = createSignal<{ status: StatusMarkStatus; progress: number | undefined }>({
    status: 'pending',
    progress: undefined
  });

  createEffect(play, on => {
    if (!on) return undefined;
    let step = 1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const next = () => {
      const [s, p, hold] = LIFECYCLE[step];
      setAuto({ status: s, progress: p });
      step = (step + 1) % LIFECYCLE.length;
      timer = setTimeout(next, hold);
    };
    timer = setTimeout(next, LIFECYCLE[0][2]);
    return () => clearTimeout(timer);
  });

  const togglePlay = (on: boolean) => {
    if (on) setAuto({ status: LIFECYCLE[0][0], progress: LIFECYCLE[0][1] });
    setPlay(on);
  };

  const manual = (key: keyof typeof DEFAULT_PROPS, val: string | number | boolean) => {
    setPlay(false);
    updateProp(key, val);
  };

  const shownStatus = () => (play() ? auto().status : (props().status as StatusMarkStatus));
  const shownProgress = () => (play() ? auto().progress : props().indeterminate ? undefined : props().progress);

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
            <StatusMark
              status={shownStatus()}
              progress={shownProgress()}
              label={props().label || undefined}
              color={renderedColor()}
              doneColor={renderedDone()}
              errorColor={renderedError()}
              size={props().size}
              strokeWidth={props().strokeWidth}
              dashes={props().dashes}
              fontSize={props().fontSize}
              spinDuration={props().spinDuration}
              arcLength={props().arcLength}
              drawDuration={props().drawDuration}
              fillOpacity={props().fillOpacity}
              strike={props().strike}
              strikeDelay={props().strikeDelay}
            />
          </div>

          <Customize>
            <PreviewSwitch title="Play Lifecycle" isChecked={play()} onChange={togglePlay} />
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={shownStatus()}
              onChange={v => manual('status', v)}
              width={130}
            />
            <PreviewSwitch
              title="Indeterminate"
              isChecked={props().indeterminate}
              onChange={v => manual('indeterminate', v)}
            />
            <PreviewSlider
              title="Progress"
              min={0}
              max={1}
              step={0.01}
              value={props().progress}
              isDisabled={props().indeterminate}
              onChange={v => manual('progress', v)}
            />
            <PreviewInput title="Label" value={props().label} maxLength={32} onChange={v => updateProp('label', v)} />
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom title="Done" color={renderedDone()} onChange={v => updateProp('doneColor', v)} />
            <PreviewColorPickerCustom
              title="Error"
              color={renderedError()}
              onChange={v => updateProp('errorColor', v)}
            />
            <PreviewSlider
              title="Size"
              min={16}
              max={40}
              step={1}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Stroke"
              min={1.5}
              max={3}
              step={0.25}
              value={props().strokeWidth}
              onChange={v => updateProp('strokeWidth', v)}
            />
            <PreviewSlider
              title="Dashes"
              min={4}
              max={16}
              step={1}
              value={props().dashes}
              onChange={v => updateProp('dashes', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={22}
              step={1}
              value={props().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Spin"
              min={600}
              max={2000}
              step={50}
              value={props().spinDuration}
              valueUnit="ms"
              onChange={v => updateProp('spinDuration', v)}
            />
            <PreviewSlider
              title="Arc Length"
              min={0.2}
              max={0.9}
              step={0.01}
              value={props().arcLength}
              onChange={v => updateProp('arcLength', v)}
            />
            <PreviewSlider
              title="Draw"
              min={120}
              max={600}
              step={10}
              value={props().drawDuration}
              valueUnit="ms"
              onChange={v => updateProp('drawDuration', v)}
            />
            <PreviewSlider
              title="Fill"
              min={0}
              max={0.25}
              step={0.01}
              value={props().fillOpacity}
              onChange={v => updateProp('fillOpacity', v)}
            />
            <PreviewSwitch title="Strike Label" isChecked={props().strike} onChange={v => updateProp('strike', v)} />
            <PreviewSlider
              title="Strike Delay"
              min={0}
              max={300}
              step={10}
              value={props().strikeDelay}
              valueUnit="ms"
              onChange={v => updateProp('strikeDelay', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={statusMark} componentName="StatusMark" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
