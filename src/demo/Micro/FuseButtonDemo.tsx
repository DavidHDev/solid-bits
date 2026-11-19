import { createMemo } from 'solid-js';
import { Archive02Icon, Delete02Icon, SentIcon } from '@hugeicons/core-free-icons';
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
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import FuseButton, {
  type FuseCommitOn,
  type FusePosition,
  type FuseSettle,
  type FuseSize
} from '@/content/Micro/FuseButton/FuseButton';
import { fuseButton } from '@/constants/code/Micro/fuseButtonCode';

type PresetKey = 'archive' | 'send' | 'delete';

const DEFAULT_PROPS = {
  preset: 'archive' as PresetKey,
  color: '#f5f5f5',
  background: '#27272a',
  fuseColor: '#f5a524',
  size: 'md' as FuseSize,
  radius: 22,
  undoWindow: 4000,
  fuse: 'outline' as FusePosition,
  fuseThickness: 1.5,
  crossfadeMs: 200,
  commitOn: 'press' as FuseCommitOn,
  pauseOnHover: true,
  settle: 'reset' as FuseSettle,
  disabled: false
};

const PRESETS: Record<
  PresetKey,
  { label: string; undoLabel: string; doneLabel: string; icon: IconSvgElement; fuse: string }
> = {
  archive: { label: 'Archive', undoLabel: 'Undo', doneLabel: 'Archived', icon: Archive02Icon, fuse: '#f5a524' },
  send: { label: 'Send', undoLabel: 'Undo', doneLabel: 'Sent', icon: SentIcon, fuse: '#6ec9f7' },
  delete: { label: 'Delete', undoLabel: 'Undo', doneLabel: 'Deleted', icon: Delete02Icon, fuse: '#e5484d' }
};

const PRESET_OPTIONS = [
  { value: 'archive', label: 'Archive' },
  { value: 'send', label: 'Send' },
  { value: 'delete', label: 'Delete' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const FUSE_OPTIONS = [
  { value: 'outline', label: 'Outline' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' }
];

const COMMIT_OPTIONS = [
  { value: 'press', label: 'On press' },
  { value: 'fuseEnd', label: 'When fuse ends' }
];

const SETTLE_OPTIONS = [
  { value: 'reset', label: 'Reset' },
  { value: 'stay', label: 'Stay done' }
];

const propData: PropRow[] = [
  { name: 'label', type: 'string', default: '"Archive"', description: 'The idle action.' },
  {
    name: 'undoLabel',
    type: 'string',
    default: '"Undo"',
    description: 'The label while the fuse burns; the whole pill is the Undo button.'
  },
  {
    name: 'doneLabel',
    type: 'string',
    default: '"Archived"',
    description: 'Shown with a check once the fuse burns out and settle is stay; announced to screen readers on arm.'
  },
  {
    name: 'icon',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'The idle glyph; an archive icon when omitted.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Ink for labels and icons; the seam and tints derive from it.'
  },
  { name: 'background', type: 'string', default: '"#27272a"', description: 'The pill surface.' },
  { name: 'fuseColor', type: 'string', default: '"#f5a524"', description: 'The lit line or ring.' },
  {
    name: 'size',
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: 'Height 36, 44 or 52 pixels with matching type and icons.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '22',
    description: 'Corner radius in pixels; 22 is a full pill at the medium size.'
  },
  {
    name: 'undoWindow',
    type: 'number',
    default: '4000',
    description: 'How long the fuse burns and Undo stays on offer, in milliseconds.'
  },
  {
    name: 'fuse',
    type: '"outline" | "bottom" | "top"',
    default: '"outline"',
    description: 'The pill rim burning down clockwise, or a line along the bottom or top edge.'
  },
  { name: 'fuseThickness', type: 'number', default: '1.5', description: 'Line height or rim stroke in pixels.' },
  {
    name: 'crossfadeMs',
    type: 'number',
    default: '200',
    description: 'Blur crossfade between faces after a pointer press. Keyboard commits swap instantly.'
  },
  {
    name: 'commitOn',
    type: '"press" | "fuseEnd"',
    default: '"press"',
    description: 'When onCommit fires: at the press, with Undo as the revert, or only once the fuse burns out.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Leaving and coming back with a mouse freezes the fuse until the pointer leaves again.'
  },
  {
    name: 'settle',
    type: '"reset" | "stay"',
    default: '"reset"',
    description: 'After the fuse ends: return to the idle face, or stay on a terminal done face until remounted.'
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Dims the idle face and ignores presses. Undo stays available while armed.'
  },
  { name: 'onCommit', type: '(reason: "press" | "fuseEnd") => void', default: '-', description: 'The action.' },
  {
    name: 'onUndo',
    type: '() => void',
    default: '-',
    description: 'Called when Undo or Escape runs the action back.'
  },
  {
    name: 'onFuseEnd',
    type: '() => void',
    default: '-',
    description: 'Called when the window closes without an undo.'
  },
  {
    name: 'onPhaseChange',
    type: '(phase: "idle" | "armed" | "settled") => void',
    default: '-',
    description: 'Called on every phase change.'
  },
  {
    name: 'type',
    type: '"button" | "submit" | "reset"',
    default: '"button"',
    description: 'Type of the idle button.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the pill.' }
];

export default function FuseButtonDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { rerenderKey, forceRerender } = useForceRerender();

  const content = createMemo(() => PRESETS[props().preset] || PRESETS.archive);
  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const renderedBackground = useColorModeValue(
    () => (props().background === DEFAULT_PROPS.background ? '#f6f6f6' : props().background),
    () => props().background
  );
  const renderedFuse = createMemo(() =>
    props().fuseColor === DEFAULT_PROPS.fuseColor ? content().fuse : props().fuseColor
  );
  const remountToken = createMemo(() => `${props().preset}-${rerenderKey()}`);
  const iconSize = createMemo(() => (props().size === 'sm' ? 14 : props().size === 'lg' ? 17 : 15));

  const reset = () => {
    resetProps();
    forceRerender();
  };

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
            <RefreshButton onClick={forceRerender} />
            <Keyed token={remountToken()}>
              {() => (
                <FuseButton
                  label={content().label}
                  undoLabel={content().undoLabel}
                  doneLabel={content().doneLabel}
                  icon={<HugeiconsIcon icon={content().icon} size={iconSize()} strokeWidth={1.8} />}
                  color={renderedColor()}
                  background={renderedBackground()}
                  fuseColor={renderedFuse()}
                  size={props().size}
                  radius={props().radius}
                  undoWindow={props().undoWindow}
                  fuse={props().fuse}
                  fuseThickness={props().fuseThickness}
                  crossfadeMs={props().crossfadeMs}
                  commitOn={props().commitOn}
                  pauseOnHover={props().pauseOnHover}
                  settle={props().settle}
                  disabled={props().disabled}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Preset"
              options={PRESET_OPTIONS}
              value={props().preset}
              onChange={(v: PresetKey) => updateProp('preset', v)}
              width={120}
            />
            <PreviewColorPickerCustom title="Text" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewColorPickerCustom title="Fuse" color={renderedFuse()} onChange={v => updateProp('fuseColor', v)} />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={(v: FuseSize) => updateProp('size', v)}
              width={120}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={26}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Undo Window"
              min={1000}
              max={10000}
              step={500}
              value={props().undoWindow}
              valueUnit="ms"
              onChange={v => updateProp('undoWindow', v)}
            />
            <PreviewSelect
              title="Fuse"
              options={FUSE_OPTIONS}
              value={props().fuse}
              onChange={(v: FusePosition) => updateProp('fuse', v)}
              width={120}
            />
            <PreviewSlider
              title="Fuse Thickness"
              min={1}
              max={4}
              step={0.5}
              value={props().fuseThickness}
              valueUnit="px"
              onChange={v => updateProp('fuseThickness', v)}
            />
            <PreviewSlider
              title="Crossfade"
              min={100}
              max={300}
              step={10}
              value={props().crossfadeMs}
              valueUnit="ms"
              onChange={v => updateProp('crossfadeMs', v)}
            />
            <PreviewSelect
              title="Commit On"
              options={COMMIT_OPTIONS}
              value={props().commitOn}
              onChange={(v: FuseCommitOn) => updateProp('commitOn', v)}
              width={160}
            />
            <PreviewSelect
              title="After Fuse"
              options={SETTLE_OPTIONS}
              value={props().settle}
              onChange={(v: FuseSettle) => updateProp('settle', v)}
              width={130}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={props().pauseOnHover}
              onChange={v => updateProp('pauseOnHover', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={fuseButton} componentName="FuseButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
