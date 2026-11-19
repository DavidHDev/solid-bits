import { For, createSignal, onCleanup, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import {
  AirplaneTakeOff01Icon,
  Archive02Icon,
  Delete02Icon,
  Flag02Icon,
  Invoice01Icon,
  Note01Icon
} from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import SwipeRow, { type SwipeAction, type SwipeRowProps } from '@/content/Micro/SwipeRow/SwipeRow';
import { swipeRow } from '@/constants/code/Micro/swipeRowCode';

const DEFAULT_PROPS = {
  drawer: 'two',
  actionColor: '#e5484d',
  drawerColor: '#3f3f46',
  rowColor: '#27272a',
  textColor: '#f5f5f5',
  height: 64,
  radius: 16,
  actionWidth: 80,
  direction: 'left',
  snapBounce: 0.2,
  resistance: 0.55,
  collapseMs: 200,
  commitAt: 0.6,
  fullSwipe: true,
  disabled: false
};

const DRAWER_OPTIONS = [
  { value: 'one', label: 'Delete' },
  { value: 'two', label: 'Archive, Delete' },
  { value: 'three', label: 'Flag, Archive, Delete' }
];
const DIRECTION_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const ACTION_SETS: Record<string, SwipeAction[]> = {
  one: [{ id: 'delete', label: 'Delete', icon: Delete02Icon }],
  two: [
    { id: 'delete', label: 'Delete', icon: Delete02Icon },
    { id: 'archive', label: 'Archive', icon: Archive02Icon, dismiss: true }
  ],
  three: [
    { id: 'delete', label: 'Delete', icon: Delete02Icon },
    { id: 'archive', label: 'Archive', icon: Archive02Icon, dismiss: true },
    { id: 'flag', label: 'Flag', icon: Flag02Icon }
  ]
};

type RowData = { id: string; icon: IconSvgElement; title: string; subtitle: string; meta: string };
type Row = RowData & { returning: boolean };

const ROWS: RowData[] = [
  { id: 'notes', icon: Note01Icon, title: 'Design review notes', subtitle: 'Edited 2 min ago', meta: '9:41' },
  {
    id: 'flight',
    icon: AirplaneTakeOff01Icon,
    title: 'Flight to Lisbon',
    subtitle: 'Gate changes to B12',
    meta: 'Tue'
  },
  { id: 'invoice', icon: Invoice01Icon, title: 'Invoice #1042', subtitle: 'Due in 3 days', meta: '$1,280' }
];
const RETURN_MS = 1200;
const GAP = 8;

type Stage = 'enter' | 'grow' | 'done';

function Entrance(props: { animate: boolean; height: number; children: JSX.Element }) {
  const [stage, setStage] = createSignal<Stage>(() => (props.animate ? 'enter' : 'done'));
  onSettled(() => {
    if (!props.animate) return;
    const id = requestAnimationFrame(() => {
      setStage('grow');
    });
    return () => cancelAnimationFrame(id);
  });
  const growing = () => stage() !== 'done';
  return (
    <div
      style={{
        height: stage() === 'enter' ? '0px' : stage() === 'grow' ? `${props.height + GAP}px` : 'auto',
        opacity: stage() === 'enter' ? 0 : 1,
        overflow: growing() ? 'hidden' : 'visible',
        transition: growing() ? 'height 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease' : 'none'
      }}
      onTransitionEnd={e => {
        if (e.propertyName === 'height') setStage('done');
      }}
    >
      {props.children}
    </div>
  );
}

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'The row content you drag.' },
  {
    name: 'actions',
    type: 'SwipeAction[]',
    default: '[{ id: "delete", label: "Delete" }]',
    description:
      'The drawer, outermost first. Each has id, label, an optional icon, an optional color for secondary actions, dismiss to fold the row when pressed, and onSelect. The first is the full-swipe action and always folds the row.'
  },
  {
    name: 'actionColor',
    type: 'string',
    default: '"#e5484d"',
    description: 'The full-swipe block that leaps and fills the row.'
  },
  {
    name: 'drawerColor',
    type: 'string',
    default: '"#3f3f46"',
    description: 'The drawer base and the secondary actions.'
  },
  { name: 'rowColor', type: 'string', default: '"#27272a"', description: 'The surface.' },
  { name: 'textColor', type: 'string', default: '"#f5f5f5"', description: 'Row text and the keyboard toggle.' },
  { name: 'height', type: 'number', default: '64', description: 'Row height in pixels. The fold closes from it.' },
  {
    name: 'radius',
    type: 'number',
    default: '16',
    description: 'Corner radius of the row and the clipped drawer.'
  },
  {
    name: 'actionWidth',
    type: 'number',
    default: '80',
    description: 'Width of each action in pixels, so the drawer width too.'
  },
  {
    name: 'direction',
    type: '"left" | "right"',
    default: '"left"',
    description: 'Which way you swipe. Everything mirrors.'
  },
  {
    name: 'snapBounce',
    type: 'number',
    default: '0.2',
    description: 'Overshoot of the open or close settle after a flick. Slow releases never bounce.'
  },
  {
    name: 'resistance',
    type: 'number',
    default: '0.55',
    description: 'How much of the finger the row keeps past the drawer, and the rubber-band beyond the commit point.'
  },
  { name: 'collapseMs', type: 'number', default: '200', description: 'How long a deleted row takes to fold shut.' },
  {
    name: 'commitAt',
    type: 'number',
    default: '0.6',
    description: 'Fraction of the row width the surface must uncover for the block to leap and a release to delete.'
  },
  {
    name: 'fullSwipe',
    type: 'boolean',
    default: 'true',
    description: 'Off, the drawer is the end: no leap, no delete.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the row and ignores input.' },
  {
    name: 'open',
    type: 'boolean',
    default: 'undefined',
    description: 'Controlled open state. Outside changes settle the row.'
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: 'Called when a gesture or key opens or closes the drawer.'
  },
  {
    name: 'onAction',
    type: '(action: SwipeAction) => void',
    default: '-',
    description: 'Called when any action button is pressed.'
  },
  {
    name: 'onCommit',
    type: '(action: SwipeAction) => void',
    default: '-',
    description: 'Called after a full swipe or a press on a folding action, once the row has shut. Remove the row here.'
  },
  {
    name: 'closeOnAction',
    type: 'boolean',
    default: 'true',
    description: 'Closes the drawer after an action is pressed.'
  },
  {
    name: 'haptic',
    type: 'boolean',
    default: 'true',
    description: 'A short vibration on touch when the block leaps.'
  },
  { name: 'label', type: 'string', default: '"List item"', description: 'Accessible name of the row.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles merged onto the root.'
  }
];

export default function SwipeRowDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedRow = useColorModeValue(
    () => (props().rowColor === DEFAULT_PROPS.rowColor ? '#f6f6f6' : props().rowColor),
    () => props().rowColor
  );
  const renderedText = useColorModeValue(
    () => (props().textColor === DEFAULT_PROPS.textColor ? '#18181b' : props().textColor),
    () => props().textColor
  );
  const renderedDrawer = useColorModeValue(
    () => (props().drawerColor === DEFAULT_PROPS.drawerColor ? '#e4e4e7' : props().drawerColor),
    () => props().drawerColor
  );

  const [rows, setRows] = createSignal<Row[]>(ROWS.map(r => ({ ...r, returning: false })));
  const [openId, setOpenId] = createSignal<string | null>(null);
  const timers: ReturnType<typeof setTimeout>[] = [];
  onCleanup(() => timers.forEach(clearTimeout));

  const remove = (id: string) => {
    const index = rows().findIndex(r => r.id === id);
    setRows(current => current.filter(r => r.id !== id));
    setOpenId(current => (current === id ? null : current));
    timers.push(
      setTimeout(() => {
        setRows(current => {
          const next = current.filter(r => r.id !== id);
          const at = Math.min(Math.max(0, index), next.length);
          const data = ROWS.find(r => r.id === id);
          if (data) next.splice(at, 0, { ...data, returning: true });
          return next;
        });
      }, RETURN_MS)
    );
  };

  const actions = () => ACTION_SETS[props().drawer] ?? ACTION_SETS.two;

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
            <div style={{ width: 'min(360px, calc(100% - 48px))' }}>
              <For each={rows()}>
                {row => (
                  <Entrance animate={row.returning} height={props().height}>
                    <SwipeRow
                      label={row.title}
                      actions={actions()}
                      open={openId() === row.id}
                      onOpenChange={isOpen => {
                        setOpenId(current => (isOpen ? row.id : current === row.id ? null : current));
                      }}
                      onCommit={() => remove(row.id)}
                      actionColor={props().actionColor}
                      drawerColor={renderedDrawer()}
                      rowColor={renderedRow()}
                      textColor={renderedText()}
                      height={props().height}
                      radius={props().radius}
                      actionWidth={props().actionWidth}
                      direction={props().direction as SwipeRowProps['direction']}
                      snapBounce={props().snapBounce}
                      resistance={props().resistance}
                      collapseMs={props().collapseMs}
                      commitAt={props().commitAt}
                      fullSwipe={props().fullSwipe}
                      disabled={props().disabled}
                      style={{ 'margin-bottom': `${GAP}px` }}
                    >
                      <span style={{ display: 'inline-flex', opacity: 0.6, 'flex-shrink': 0 }}>
                        <HugeiconsIcon icon={row.icon} size={20} strokeWidth={1.8} />
                      </span>
                      <span style={{ display: 'grid', gap: '2px', flex: '1 1 auto', 'min-width': 0 }}>
                        <span
                          style={{
                            'font-size': '14px',
                            'font-weight': 500,
                            'line-height': 1.2,
                            'white-space': 'nowrap',
                            overflow: 'hidden',
                            'text-overflow': 'ellipsis'
                          }}
                        >
                          {row.title}
                        </span>
                        <span
                          style={{
                            'font-size': '12px',
                            opacity: 0.6,
                            'line-height': 1.2,
                            'white-space': 'nowrap',
                            overflow: 'hidden',
                            'text-overflow': 'ellipsis'
                          }}
                        >
                          {row.subtitle}
                        </span>
                      </span>
                      <span style={{ 'font-size': '12px', opacity: 0.5, 'flex-shrink': 0 }}>{row.meta}</span>
                    </SwipeRow>
                  </Entrance>
                )}
              </For>
            </div>
          </div>

          <Customize>
            <PreviewSelect
              title="Drawer"
              options={DRAWER_OPTIONS}
              value={props().drawer}
              onChange={v => updateProp('drawer', v)}
              width={190}
            />
            <PreviewColorPickerCustom
              title="Action"
              color={props().actionColor}
              onChange={v => updateProp('actionColor', v)}
            />
            <PreviewColorPickerCustom
              title="Drawer Color"
              color={renderedDrawer()}
              onChange={v => updateProp('drawerColor', v)}
            />
            <PreviewColorPickerCustom title="Row" color={renderedRow()} onChange={v => updateProp('rowColor', v)} />
            <PreviewColorPickerCustom title="Text" color={renderedText()} onChange={v => updateProp('textColor', v)} />
            <PreviewSlider
              title="Height"
              min={48}
              max={88}
              step={2}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Action Width"
              min={56}
              max={120}
              step={4}
              value={props().actionWidth}
              valueUnit="px"
              onChange={v => updateProp('actionWidth', v)}
            />
            <PreviewSelect
              title="Swipe"
              options={DIRECTION_OPTIONS}
              value={props().direction}
              onChange={v => updateProp('direction', v)}
              width={110}
            />
            <PreviewSlider
              title="Flick Bounce"
              min={0}
              max={0.3}
              step={0.02}
              value={props().snapBounce}
              onChange={v => updateProp('snapBounce', v)}
            />
            <PreviewSlider
              title="Resistance"
              min={0.4}
              max={1}
              step={0.05}
              value={props().resistance}
              onChange={v => updateProp('resistance', v)}
            />
            <PreviewSlider
              title="Collapse"
              min={100}
              max={400}
              step={20}
              value={props().collapseMs}
              valueUnit="ms"
              onChange={v => updateProp('collapseMs', v)}
            />
            <PreviewSlider
              title="Commit At"
              min={0.4}
              max={0.9}
              step={0.05}
              value={props().commitAt}
              onChange={v => updateProp('commitAt', v)}
            />
            <PreviewSwitch
              title="Full Swipe"
              isChecked={props().fullSwipe}
              onChange={v => updateProp('fullSwipe', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={swipeRow} componentName="SwipeRow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
