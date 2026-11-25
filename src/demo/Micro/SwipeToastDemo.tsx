import { For, createMemo, createSignal, onSettled } from 'solid-js';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
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
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { isLight } from '@/hooks/useTheme';

import SwipeToast, { type SwipeToastFuse } from '@/content/Micro/SwipeToast/SwipeToast';
import { swipeToast } from '@/constants/code/Micro/swipeToastCode';

const DEFAULT_PROPS = {
  title: 'File archived',
  description: 'Moved to Archive',
  actionLabel: 'Undo',
  background: '#27272a',
  color: '#f5f5f5',
  fuseColor: '#24adf5',
  width: 356,
  radius: 12,
  slideMs: 400,
  settleBounce: 0.2,
  swipeDistance: 40,
  duration: 4000,
  fuse: 'bottom',
  pauseOnHover: true,
  closeButton: false,
  inline: true
};

const FUSE_OPTIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'none', label: 'None' }
];
const MAX_TOASTS = 3;

type Toast = { id: number; open: boolean };

const propData: PropRow[] = [
  { name: 'title', type: 'JSX.Element', default: '"File archived"', description: 'The first line.' },
  {
    name: 'description',
    type: 'JSX.Element',
    default: '""',
    description: 'The dimmer second line. Empty hides it.'
  },
  { name: 'icon', type: 'JSX.Element', default: 'undefined', description: 'An 18px icon before the text.' },
  { name: 'actionLabel', type: 'JSX.Element', default: '""', description: 'The inverted button. Empty hides it.' },
  {
    name: 'onAction',
    type: '() => void',
    default: '-',
    description: 'Called when the action is pressed, before the close.'
  },
  {
    name: 'open',
    type: 'boolean',
    default: 'true',
    description: 'Flip to false to close from outside. True again re-enters.'
  },
  {
    name: 'onClose',
    type: '(reason) => void',
    default: '-',
    description:
      'Called after the exit, and after the inline slot has collapsed. Reason is timeout, swipe, action, close, escape or programmatic.'
  },
  {
    name: 'background',
    type: 'string',
    default: '"#27272a"',
    description: 'The card surface, and the action text.'
  },
  {
    name: 'color',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Ink: title, description at 62% and the action fill.'
  },
  { name: 'fuseColor', type: 'string', default: '"#24adf5"', description: 'The burning line.' },
  {
    name: 'width',
    type: 'number',
    default: '356',
    description: 'Card width in pixels, capped at the parent when inline.'
  },
  { name: 'radius', type: 'number', default: '12', description: 'Corner radius in pixels.' },
  { name: 'slideMs', type: 'number', default: '400', description: 'How long the rise and the drop take.' },
  {
    name: 'settleBounce',
    type: 'number',
    default: '0.2',
    description: 'Overshoot of the return after an abandoned swipe. 0 stops dead.'
  },
  {
    name: 'swipeDistance',
    type: 'number',
    default: '40',
    description: 'How far a slow drag must go before release dismisses. A flick always does.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '4000',
    description: 'Milliseconds until it closes itself. Changing it re-arms the fuse. 0 keeps it until dismissed.'
  },
  {
    name: 'fuse',
    type: '"bottom" | "top" | "none"',
    default: '"bottom"',
    description: 'Which edge the line burns along. None keeps the timer but shows nothing.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Hovering freezes the line and the timer.'
  },
  { name: 'closeButton', type: 'boolean', default: 'false', description: 'Adds a cross at the end of the row.' },
  {
    name: 'inline',
    type: 'boolean',
    default: 'false',
    description: 'In flow inside the parent instead of fixed to the bottom-right of the viewport.'
  },
  { name: 'dismissible', type: 'boolean', default: 'true', description: 'Off removes the swipe and Escape.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function SwipeToastDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedBackground = createMemo(() => {
    const background = props().background;
    return isLight() && background === DEFAULT_PROPS.background ? '#ffffff' : background;
  });
  const renderedColor = createMemo(() => {
    const color = props().color;
    return isLight() && color === DEFAULT_PROPS.color ? '#18181b' : color;
  });

  const [toasts, setToasts] = createSignal<Toast[]>([]);
  let nextId = 0;
  const show = () => {
    setToasts(current => {
      const next = [...current, { id: nextId++, open: true }];
      const live = next.filter(t => t.open);
      if (live.length > MAX_TOASTS) {
        const oldest = live[0].id;
        return next.map(t => (t.id === oldest ? { ...t, open: false } : t));
      }
      return next;
    });
  };
  const remove = (id: number) => {
    setToasts(current => current.filter(t => t.id !== id));
  };
  const reset = () => {
    setToasts([]);
    show();
  };

  onSettled(() => {
    show();
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
            <RefreshButton onClick={reset} />
            <button
              type="button"
              class="absolute top-6 left-1/2 inline-flex h-8 min-w-8 -translate-x-1/2 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-0 bg-transparent px-3 text-[13px] font-medium text-[var(--text-muted)] outline-none transition-colors hover:bg-[var(--surface-ghost-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              onClick={show}
            >
              Show toast
            </button>
            <div
              style={{
                position: 'absolute',
                left: '24px',
                right: '24px',
                bottom: '32px',
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'flex-end'
              }}
            >
              <For each={toasts()} keyed={(t: Toast) => t.id}>
                {toast => (
                  <SwipeToast
                    open={toast().open}
                    onClose={() => remove(toast().id)}
                    icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2} />}
                    title={props().title}
                    description={props().description}
                    actionLabel={props().actionLabel}
                    background={renderedBackground()}
                    color={renderedColor()}
                    fuseColor={props().fuseColor}
                    width={props().width}
                    radius={props().radius}
                    slideMs={props().slideMs}
                    settleBounce={props().settleBounce}
                    swipeDistance={props().swipeDistance}
                    duration={props().duration}
                    fuse={props().fuse as SwipeToastFuse}
                    pauseOnHover={props().pauseOnHover}
                    closeButton={props().closeButton}
                    inline={props().inline}
                  />
                )}
              </For>
            </div>
          </div>

          <Customize>
            <PreviewInput title="Title" value={props().title} maxLength={32} onChange={v => updateProp('title', v)} />
            <PreviewInput
              title="Description"
              value={props().description}
              maxLength={48}
              onChange={v => updateProp('description', v)}
            />
            <PreviewInput
              title="Action Label"
              value={props().actionLabel}
              maxLength={12}
              onChange={v => updateProp('actionLabel', v)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Fuse"
              color={props().fuseColor}
              onChange={v => updateProp('fuseColor', v)}
            />
            <PreviewSlider
              title="Width"
              min={280}
              max={420}
              step={4}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
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
              title="Slide"
              min={200}
              max={700}
              step={20}
              value={props().slideMs}
              valueUnit="ms"
              onChange={v => updateProp('slideMs', v)}
            />
            <PreviewSlider
              title="Settle Bounce"
              min={0}
              max={0.4}
              step={0.02}
              value={props().settleBounce}
              onChange={v => updateProp('settleBounce', v)}
            />
            <PreviewSlider
              title="Swipe Distance"
              min={12}
              max={96}
              step={2}
              value={props().swipeDistance}
              valueUnit="px"
              onChange={v => updateProp('swipeDistance', v)}
            />
            <PreviewSlider
              title="Duration"
              min={0}
              max={10000}
              step={250}
              value={props().duration}
              valueUnit="ms"
              onChange={v => updateProp('duration', v)}
            />
            <PreviewSelect
              title="Fuse"
              options={FUSE_OPTIONS}
              value={props().fuse}
              onChange={v => updateProp('fuse', v)}
              width={120}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={props().pauseOnHover}
              onChange={v => updateProp('pauseOnHover', v)}
            />
            <PreviewSwitch
              title="Close Button"
              isChecked={props().closeButton}
              onChange={v => updateProp('closeButton', v)}
            />
            <PreviewSwitch title="Inline" isChecked={props().inline} onChange={v => updateProp('inline', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={swipeToast} componentName="SwipeToast" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
