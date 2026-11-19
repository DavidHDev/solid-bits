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

import RefineFrame, { type RefineFrameStatus } from '@/content/Micro/RefineFrame/RefineFrame';
import { refineFrame } from '@/constants/code/Micro/refineFrameCode';

const DEFAULT_PROPS = {
  status: 'queued',
  aspectRatio: '4 / 3',
  width: 320,
  radius: 16,
  background: '#27272a',
  color: '#f5f5f5',
  stageDuration: 400,
  sweep: true,
  showStatus: true,
  hideAfter: 1200
};

const IMAGE =
  'https://images.unsplash.com/photo-1721407964262-f9864b562453?q=80&w=1180&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const STATUS_OPTIONS = [
  { value: 'queued', label: 'Queued' },
  { value: 'generating', label: 'Generating' },
  { value: 'refining', label: 'Refining' },
  { value: 'complete', label: 'Complete' },
  { value: 'error', label: 'Error' }
];
const ASPECT_OPTIONS = [
  { value: '4 / 3', label: '4 : 3' },
  { value: '1 / 1', label: '1 : 1' },
  { value: '16 / 9', label: '16 : 9' },
  { value: '3 / 4', label: '3 : 4' }
];
const WALK: [RefineFrameStatus, number][] = [
  ['queued', 0],
  ['generating', 700],
  ['refining', 2300],
  ['complete', 3500]
];

const propData: PropRow[] = [
  {
    name: 'status',
    type: "'queued' | 'generating' | 'refining' | 'complete' | 'error'",
    default: "'generating'",
    description: 'The stage. Each change tweens the media to that stage.'
  },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'The media: an img, video or canvas. It fills the frame.'
  },
  {
    name: 'aspectRatio',
    type: 'string',
    default: '"4 / 3"',
    description: 'The box reserved before and during generation, so nothing shifts.'
  },
  { name: 'width', type: 'number', default: '320', description: 'Frame width in px, capped at the parent.' },
  { name: 'radius', type: 'number', default: '16', description: 'Corner radius in px.' },
  {
    name: 'background',
    type: 'string',
    default: '"#27272a"',
    description: 'The paper behind the media, and the chip surface.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The ink: chip text, the sweep and the retry pill.'
  },
  { name: 'stageDuration', type: 'number', default: '400', description: 'Each stage tween, in ms.' },
  { name: 'sweep', type: 'boolean', default: 'true', description: 'A soft band crosses the frame while it works.' },
  {
    name: 'showStatus',
    type: 'boolean',
    default: 'true',
    description: 'The chip with the mark and the stage label.'
  },
  {
    name: 'hideAfter',
    type: 'number',
    default: '1200',
    description: 'Ms after completion before the chip fades. 0 keeps it.'
  },
  {
    name: 'labels',
    type: 'Partial<Record<status, string>>',
    default: 'DEFAULT_LABELS',
    description: 'Chip text per stage: Queued, Generating, Refining, Ready, Failed.'
  },
  { name: 'retryLabel', type: 'string', default: '"Retry"', description: 'The pill on an error.' },
  {
    name: 'onRetry',
    type: '() => void',
    default: '-',
    description: 'The retry pill was pressed. Without it, no pill.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the frame.' }
];

export default function RefineFrameDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedBackground = useColorModeValue(
    () => (props().background === DEFAULT_PROPS.background ? '#f6f6f6' : props().background),
    () => props().background
  );
  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );

  let timers: ReturnType<typeof setTimeout>[] = [];
  const stop = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const walk = () => {
    stop();
    WALK.forEach(([next, at]) => timers.push(setTimeout(() => updateProp('status', next), at)));
  };

  onSettled(() => {
    walk();
    return stop;
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
            <RefreshButton onClick={walk} />
            <RefineFrame
              status={props().status as RefineFrameStatus}
              aspectRatio={props().aspectRatio}
              width={props().width}
              radius={props().radius}
              background={renderedBackground()}
              color={renderedColor()}
              stageDuration={props().stageDuration}
              sweep={props().sweep}
              showStatus={props().showStatus}
              hideAfter={props().hideAfter}
              onRetry={walk}
            >
              <img src={IMAGE} alt="" crossorigin="anonymous" draggable="false" />
            </RefineFrame>
          </div>

          <Customize>
            <PreviewSelect
              title="Status"
              options={STATUS_OPTIONS}
              value={props().status}
              onChange={(val: string) => {
                stop();
                updateProp('status', val);
              }}
              width={140}
            />
            <PreviewSelect
              title="Aspect"
              options={ASPECT_OPTIONS}
              value={props().aspectRatio}
              onChange={(val: string) => updateProp('aspectRatio', val)}
              width={110}
            />
            <PreviewSlider
              title="Width"
              min={200}
              max={480}
              step={8}
              value={props().width}
              valueUnit="px"
              onChange={val => updateProp('width', val)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={val => updateProp('radius', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={val => updateProp('background', val)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={val => updateProp('color', val)} />
            <PreviewSlider
              title="Stage"
              min={150}
              max={900}
              step={10}
              value={props().stageDuration}
              valueUnit="ms"
              onChange={val => updateProp('stageDuration', val)}
            />
            <PreviewSwitch title="Sweep" isChecked={props().sweep} onChange={val => updateProp('sweep', val)} />
            <PreviewSwitch
              title="Show Status"
              isChecked={props().showStatus}
              onChange={val => updateProp('showStatus', val)}
            />
            <PreviewSlider
              title="Hide After"
              min={0}
              max={4000}
              step={100}
              value={props().hideAfter}
              valueUnit="ms"
              isDisabled={!props().showStatus}
              onChange={val => updateProp('hideAfter', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={refineFrame} componentName="RefineFrame" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
