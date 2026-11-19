import { createMemo, createSignal } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import JellyRadio, { type JellyRadioProps } from '@/content/Micro/JellyRadio/JellyRadio';
import { jellyRadio } from '@/constants/code/Micro/jellyRadioCode';

const ITEM_SETS: Record<string, string[]> = {
  levels: ['Off', 'Low', 'Medium', 'High', 'Max'],
  heat: ['Mild', 'Medium', 'Hot'],
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};
const middleOf = (set: string[]) => set[Math.floor(set.length / 2)];

const DEFAULT_PROPS = {
  items: 'levels',
  size: 'md',
  chipColor: '#27272a',
  activeColor: '#f5f5f5',
  textColor: '#f5f5f5',
  activeTextColor: '#18181b',
  gap: 8,
  radius: 18,
  swell: 0.2,
  barge: 6,
  shrink: 0.05,
  jelly: 1,
  bounce: 0.25,
  stagger: 22,
  stiffness: 580,
  disabled: false
};

type ColorKey = 'chipColor' | 'activeColor' | 'textColor' | 'activeTextColor';

const LIGHT: Record<ColorKey, string> = {
  chipColor: '#f6f6f6',
  activeColor: '#18181b',
  textColor: '#18181b',
  activeTextColor: '#ffffff'
};

const ITEM_OPTIONS = [
  { value: 'levels', label: 'Levels' },
  { value: 'heat', label: 'Heat' },
  { value: 'days', label: 'Days' }
];
const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: '(string | { value: string; label: JSX.Element; icon?: JSX.Element; disabled?: boolean })[]',
    default: '["Off", "Low", "Medium", "High", "Max"]',
    description: 'The chips. A string is both value and label.'
  },
  { name: 'value', type: 'string', default: 'undefined', description: 'Controlled value. Outside changes jump.' },
  {
    name: 'defaultValue',
    type: 'string',
    default: 'undefined',
    description: 'Initial value when uncontrolled. Falls back to the first item.'
  },
  {
    name: 'onChange',
    type: '(value: string, index: number) => void',
    default: '-',
    description: 'Called on the commit, before the motion ends.'
  },
  { name: 'chipColor', type: 'string', default: '"#27272a"', description: 'Surface of an unchosen chip.' },
  { name: 'activeColor', type: 'string', default: '"#f5f5f5"', description: 'Surface of the chosen chip.' },
  {
    name: 'textColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'Label of an unchosen chip, and the hover tone.'
  },
  { name: 'activeTextColor', type: 'string', default: '"#18181b"', description: 'Label of the chosen chip.' },
  {
    name: 'size',
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: 'Chip height 28, 36 or 44 pixels. Large is the touch-first size.'
  },
  { name: 'gap', type: 'number', default: '8', description: 'Rest spacing between chips in pixels.' },
  {
    name: 'radius',
    type: 'number',
    default: '18',
    description: 'Corner radius in pixels. 18 is a pill at medium.'
  },
  {
    name: 'swell',
    type: 'number',
    default: '0.2',
    description: 'How much the chosen chip grows. It also sets the room the neighbours make.'
  },
  {
    name: 'barge',
    type: 'number',
    default: '6',
    description: 'Extra pixels every neighbour is shoved beyond that room. 0 only makes room.'
  },
  { name: 'shrink', type: 'number', default: '0.05', description: 'How much every unchosen chip gives up.' },
  {
    name: 'jelly',
    type: 'number',
    default: '1',
    description: 'The wide-before-tall split. 0 swells uniformly, 1.5 exaggerates it.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.25',
    description: 'One minus the damping ratio. 0 arrives and stops, 0.4 rings.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '22',
    description: 'Milliseconds per row step before a neighbour moves. 0 moves the row as a slab.'
  },
  {
    name: 'stiffness',
    type: 'number',
    default: '580',
    description: 'Spring stiffness of the chosen chip. Neighbours soften from it with distance.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Fades the group and ignores input.' },
  { name: 'ariaLabel', type: 'string', default: '"Options"', description: 'Accessible name of the group.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the group.' }
];

export default function JellyRadioDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const set = createMemo(() => ITEM_SETS[props().items] ?? ITEM_SETS.levels);
  const [value, setValue] = createSignal(middleOf(ITEM_SETS.levels));
  const current = createMemo(() => (set().includes(value()) ? value() : middleOf(set())));

  const light = (key: ColorKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedChip = useColorModeValue(
    () => light('chipColor'),
    () => props().chipColor
  );
  const renderedActive = useColorModeValue(
    () => light('activeColor'),
    () => props().activeColor
  );
  const renderedText = useColorModeValue(
    () => light('textColor'),
    () => props().textColor
  );
  const renderedActiveText = useColorModeValue(
    () => light('activeTextColor'),
    () => props().activeTextColor
  );

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
            <JellyRadio
              items={set()}
              value={current()}
              onChange={v => {
                setValue(v);
              }}
              chipColor={renderedChip()}
              activeColor={renderedActive()}
              textColor={renderedText()}
              activeTextColor={renderedActiveText()}
              size={props().size as JellyRadioProps['size']}
              gap={props().gap}
              radius={props().radius}
              swell={props().swell}
              barge={props().barge}
              shrink={props().shrink}
              jelly={props().jelly}
              bounce={props().bounce}
              stagger={props().stagger}
              stiffness={props().stiffness}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Items"
              options={ITEM_OPTIONS}
              value={props().items}
              onChange={(v: string) => {
                updateProp('items', v);
                setValue(middleOf(ITEM_SETS[v] ?? ITEM_SETS.levels));
              }}
              width={120}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={v => updateProp('size', v)}
              width={120}
            />
            <PreviewColorPickerCustom title="Chip" color={renderedChip()} onChange={v => updateProp('chipColor', v)} />
            <PreviewColorPickerCustom
              title="Active"
              color={renderedActive()}
              onChange={v => updateProp('activeColor', v)}
            />
            <PreviewColorPickerCustom title="Text" color={renderedText()} onChange={v => updateProp('textColor', v)} />
            <PreviewColorPickerCustom
              title="Active Text"
              color={renderedActiveText()}
              onChange={v => updateProp('activeTextColor', v)}
            />
            <PreviewSlider
              title="Gap"
              min={4}
              max={20}
              step={1}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={22}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Swell"
              min={0.05}
              max={0.4}
              step={0.01}
              value={props().swell}
              onChange={v => updateProp('swell', v)}
            />
            <PreviewSlider
              title="Barge"
              min={0}
              max={20}
              step={1}
              value={props().barge}
              valueUnit="px"
              onChange={v => updateProp('barge', v)}
            />
            <PreviewSlider
              title="Shrink"
              min={0}
              max={0.15}
              step={0.01}
              value={props().shrink}
              onChange={v => updateProp('shrink', v)}
            />
            <PreviewSlider
              title="Jelly"
              min={0}
              max={1.5}
              step={0.1}
              value={props().jelly}
              onChange={v => updateProp('jelly', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.4}
              step={0.05}
              value={props().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={60}
              step={2}
              value={props().stagger}
              valueUnit="ms"
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Stiffness"
              min={300}
              max={900}
              step={20}
              value={props().stiffness}
              onChange={v => updateProp('stiffness', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={jellyRadio} componentName="JellyRadio" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
