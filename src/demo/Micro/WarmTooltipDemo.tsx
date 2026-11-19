import { For } from 'solid-js';
import {
  Image01Icon,
  Link01Icon,
  MoreHorizontalIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon
} from '@hugeicons/core-free-icons';
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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import WarmTooltip, {
  WarmTooltipGroup,
  type WarmTooltipSide,
  type WarmTooltipSize
} from '@/content/Micro/WarmTooltip/WarmTooltip';
import { warmTooltip } from '@/constants/code/Micro/warmTooltipCode';

type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];

const DEFAULT_PROPS = {
  side: 'top' as WarmTooltipSide,
  surfaceColor: '#f5f5f5',
  inkColor: '#18181b',
  size: 'md' as WarmTooltipSize,
  radius: 8,
  gap: 8,
  arrow: true,
  delay: 400,
  warmWindow: 300,
  travel: 320,
  popDuration: 160,
  popScale: 0.94,
  popBlur: 4,
  lean: false,
  showFuse: false
};

const TOOLS: { name: string; label: string; shortcut?: string; icon: IconData }[] = [
  { name: 'Bold', label: 'Bold', shortcut: '⌘B', icon: TextBoldIcon },
  { name: 'Italic', label: 'Italic', shortcut: '⌘I', icon: TextItalicIcon },
  { name: 'Underline', label: 'Underline', shortcut: '⌘U', icon: TextUnderlineIcon },
  { name: 'Link', label: 'Add link', shortcut: '⌘K', icon: Link01Icon },
  { name: 'Insert image', label: 'Insert image', icon: Image01Icon },
  { name: 'More', label: 'More options', icon: MoreHorizontalIcon }
];

const SIDE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const escapeAttr = (value: string | number) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const iconMarkup = (icon: IconData, strokeWidth: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          return `${name}="${escapeAttr(name === 'stroke-width' ? strokeWidth : value)}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

function ToolIcon(props: { icon: IconData }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      color="currentColor"
      aria-hidden="true"
      innerHTML={iconMarkup(props.icon, 1.8)}
    />
  );
}

const propData: PropRow[] = [
  { name: 'content', type: 'JSX.Element', default: '-', description: 'The label. Keep it to a few words.' },
  {
    name: 'shortcut',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Optional keyboard shortcut, drawn as a keycap beside the label.'
  },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'The trigger. It only receives aria-describedby; its own handlers and focus ring stay untouched.'
  },
  {
    name: 'side',
    type: '"top" | "bottom" | "left" | "right"',
    default: '"top"',
    description: 'The edge the label hangs from; also where the fuse runs and the pop originates.'
  },
  {
    name: 'delay',
    type: 'number',
    default: '400',
    description: 'How long a cold open waits, in milliseconds. Inherits the group value when omitted.'
  },
  {
    name: 'warmWindow',
    type: 'number',
    default: '300',
    description: 'How long after this label closes the group stays warm. Inherits the group value when omitted.'
  },
  { name: 'surfaceColor', type: 'string', default: '"#f5f5f5"', description: 'Label background, arrow and fuse.' },
  {
    name: 'inkColor',
    type: 'string',
    default: '"#18181b"',
    description: 'Label text; the keycap is tinted from it.'
  },
  { name: 'size', type: '"sm" | "md" | "lg"', default: '"md"', description: 'Font size and padding of the label.' },
  { name: 'radius', type: 'number', default: '8', description: 'Corner radius of the label in pixels.' },
  { name: 'gap', type: 'number', default: '8', description: 'Distance between the trigger edge and the label.' },
  { name: 'arrow', type: 'boolean', default: 'true', description: 'Shows the pointer on the anchored edge.' },
  {
    name: 'popDuration',
    type: 'number',
    default: '160',
    description: 'Cold pop-in time in milliseconds; the exit takes 0.8 of it.'
  },
  {
    name: 'popScale',
    type: 'number',
    default: '0.94',
    description: 'Scale the label pops from. 1 makes it a fade.'
  },
  { name: 'popBlur', type: 'number', default: '4', description: 'Blur in pixels the label arrives through.' },
  {
    name: 'showFuse',
    type: 'boolean',
    default: 'false',
    description: 'Draws a thin line along the trigger edge that fills over the delay, or over the long press on touch.'
  },
  {
    name: 'longPress',
    type: 'number',
    default: '500',
    description: 'Hold time in milliseconds that opens the label on touch; the click that follows is swallowed.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'No open path; an open label closes.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the trigger wrapper.' },
  {
    name: 'WarmTooltipGroup',
    type: 'component',
    default: '-',
    description:
      'Wraps a toolbar so its tooltips share one label. Props: delay (400), warmWindow (300), travel (320, how long the label takes to glide to the next trigger; 0 hops), lean (0, degrees of tilt while gliding), onWarmChange. Its ref receives a handle with reset().'
  }
];

export default function WarmTooltipDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedSurface = useColorModeValue(
    () => (props().surfaceColor === DEFAULT_PROPS.surfaceColor ? '#18181b' : props().surfaceColor),
    () => props().surfaceColor
  );
  const renderedInk = useColorModeValue(
    () => (props().inkColor === DEFAULT_PROPS.inkColor ? '#ffffff' : props().inkColor),
    () => props().inkColor
  );
  const toolbarBg = useColorModeValue('#f6f6f6', '#232326');
  const vertical = () => props().side === 'left' || props().side === 'right';
  const groupKey = () => `${props().delay}-${props().warmWindow}-${props().travel}-${props().lean}`;

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
            <Keyed token={groupKey()}>
              {() => (
                <WarmTooltipGroup
                  delay={props().delay}
                  warmWindow={props().warmWindow}
                  travel={props().travel}
                  lean={props().lean ? 10 : 0}
                >
                  <div
                    style={{
                      display: 'flex',
                      'flex-direction': vertical() ? 'column' : 'row',
                      gap: '2px',
                      padding: '6px',
                      'border-radius': '14px',
                      background: toolbarBg()
                    }}
                  >
                    <For each={TOOLS}>
                      {tool => (
                        <WarmTooltip
                          content={tool.label}
                          shortcut={tool.shortcut}
                          side={props().side}
                          surfaceColor={renderedSurface()}
                          inkColor={renderedInk()}
                          size={props().size}
                          radius={props().radius}
                          gap={props().gap}
                          arrow={props().arrow}
                          popDuration={props().popDuration}
                          popScale={props().popScale}
                          popBlur={props().popBlur}
                          showFuse={props().showFuse}
                        >
                          <button
                            type="button"
                            aria-label={tool.name}
                            class="grid h-[44px] w-[44px] cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-[var(--text-primary)] transition-colors duration-[120ms] ease-in-out hover:bg-[var(--surface-ghost)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
                          >
                            <ToolIcon icon={tool.icon} />
                          </button>
                        </WarmTooltip>
                      )}
                    </For>
                  </div>
                </WarmTooltipGroup>
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Surface"
              color={renderedSurface()}
              onChange={v => updateProp('surfaceColor', v)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedInk()} onChange={v => updateProp('inkColor', v)} />
            <PreviewSelect
              title="Side"
              options={SIDE_OPTIONS}
              value={props().side}
              onChange={(v: WarmTooltipSide) => updateProp('side', v)}
              width={120}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={(v: WarmTooltipSize) => updateProp('size', v)}
              width={120}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={16}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Gap"
              min={2}
              max={20}
              step={1}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSwitch title="Arrow" isChecked={props().arrow} onChange={v => updateProp('arrow', v)} />
            <PreviewSlider
              title="Delay"
              min={0}
              max={1000}
              step={50}
              value={props().delay}
              valueUnit="ms"
              onChange={v => updateProp('delay', v)}
            />
            <PreviewSlider
              title="Warm Window"
              min={0}
              max={2000}
              step={50}
              value={props().warmWindow}
              valueUnit="ms"
              onChange={v => updateProp('warmWindow', v)}
            />
            <PreviewSlider
              title="Travel"
              min={0}
              max={800}
              step={20}
              value={props().travel}
              valueUnit="ms"
              onChange={v => updateProp('travel', v)}
            />
            <PreviewSlider
              title="Pop Duration"
              min={0}
              max={300}
              step={5}
              value={props().popDuration}
              valueUnit="ms"
              onChange={v => updateProp('popDuration', v)}
            />
            <PreviewSlider
              title="Pop Scale"
              min={0.8}
              max={1}
              step={0.01}
              value={props().popScale}
              onChange={v => updateProp('popScale', v)}
            />
            <PreviewSlider
              title="Pop Blur"
              min={0}
              max={12}
              step={1}
              value={props().popBlur}
              valueUnit="px"
              onChange={v => updateProp('popBlur', v)}
            />
            <PreviewSwitch title="Lean" isChecked={props().lean} onChange={v => updateProp('lean', v)} />
            <PreviewSwitch title="Show Fuse" isChecked={props().showFuse} onChange={v => updateProp('showFuse', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={warmTooltip} componentName="WarmTooltip" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
