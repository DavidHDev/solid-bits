import { createMemo, createSignal } from 'solid-js';
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

import PeekRating, { type PeekRatingShape } from '@/content/Micro/PeekRating/PeekRating';
import { peekRating } from '@/constants/code/Micro/peekRatingCode';

const DEFAULT_PROPS = {
  count: 5,
  shape: 'star' as PeekRatingShape,
  showLabels: true,
  activeColor: '#f5b400',
  idleColor: '#52525b',
  tipColor: '#27272a',
  tipTextColor: '#f5f5f5',
  size: 40,
  lift: 8,
  magnify: 1.15,
  riseDuration: 320,
  popScale: 1.3,
  showTip: true,
  allowClear: true,
  readOnly: false
};

const LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Superb', 'Stellar', 'Epic', 'Legendary', 'Mythic', 'Perfect'];

const SHAPE_OPTIONS = [
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
  { value: 'bolt', label: 'Bolt' }
];

const propData: PropRow[] = [
  { name: 'value', type: 'number', default: 'undefined', description: 'Controlled rating, from 0 to count.' },
  { name: 'defaultValue', type: 'number', default: '0', description: 'Initial rating when uncontrolled.' },
  {
    name: 'onChange',
    type: '(value: number) => void',
    default: '-',
    description: 'Called when a rating is committed by click, release or keyboard.'
  },
  {
    name: 'onPreview',
    type: '(value: number | null) => void',
    default: '-',
    description: 'Called on every slot crossing while previewing, and with null when the preview clears.'
  },
  { name: 'count', type: 'number', default: '5', description: 'Number of glyphs.' },
  { name: 'shape', type: '"star" | "heart" | "bolt"', default: '"star"', description: 'Built-in glyph shape.' },
  {
    name: 'icon',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Custom glyph that replaces the built-in shape.'
  },
  {
    name: 'labels',
    type: 'string[]',
    default: '[]',
    description: 'One label per glyph, shown in the tip while previewing. Without labels the tip shows the number.'
  },
  {
    name: 'activeColor',
    type: 'string',
    default: '"#f5b400"',
    description: 'Colour of lit glyphs and of the focus ring.'
  },
  { name: 'idleColor', type: 'string', default: '"#52525b"', description: 'Colour of unlit glyphs.' },
  {
    name: 'tipColor',
    type: 'string',
    default: '"#27272a"',
    description: 'Background of the tip that follows the pointer.'
  },
  { name: 'tipTextColor', type: 'string', default: '"#f5f5f5"', description: 'Text colour of the tip.' },
  {
    name: 'size',
    type: 'number',
    default: '28',
    description: 'Glyph size in pixels; spacing and the tip scale with it.'
  },
  {
    name: 'lift',
    type: 'number',
    default: '6',
    description: 'How far previewed glyphs rise, in pixels. 0 makes the preview colour-only.'
  },
  { name: 'magnify', type: 'number', default: '1.15', description: 'Scale of the glyph under the pointer.' },
  {
    name: 'riseDuration',
    type: 'number',
    default: '320',
    description: 'Duration in milliseconds of each glyph’s rise and fall, and of the tip’s hop.'
  },
  {
    name: 'popScale',
    type: 'number',
    default: '1.3',
    description: 'Peak scale of the pop on the committed glyph. 1 disables it.'
  },
  {
    name: 'showTip',
    type: 'boolean',
    default: 'true',
    description: 'Shows the tip above the pointer glyph while previewing.'
  },
  {
    name: 'allowClear',
    type: 'boolean',
    default: 'true',
    description: 'Clicking the current rating again, or Backspace, clears it to 0.'
  },
  {
    name: 'readOnly',
    type: 'boolean',
    default: 'false',
    description: 'Display only: no preview, no pop, announced as an image.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the control and ignores input.' },
  { name: 'ariaLabel', type: 'string', default: '"Rating"', description: 'Accessible name of the radio group.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root element.' }
];

export default function PeekRatingDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [value, setValue] = createSignal(3);
  const mountKey = createMemo(() => `${props().count}-${props().readOnly}`);

  const renderedIdleColor = useColorModeValue(
    () => (props().idleColor === DEFAULT_PROPS.idleColor ? '#d4d4d8' : props().idleColor),
    () => props().idleColor
  );
  const renderedTipColor = useColorModeValue(
    () => (props().tipColor === DEFAULT_PROPS.tipColor ? '#18181b' : props().tipColor),
    () => props().tipColor
  );
  const renderedTipTextColor = useColorModeValue(
    () => (props().tipTextColor === DEFAULT_PROPS.tipTextColor ? '#ffffff' : props().tipTextColor),
    () => props().tipTextColor
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
            <Keyed token={mountKey()}>
              {() => (
                <PeekRating
                  value={value()}
                  onChange={v => {
                    setValue(v);
                  }}
                  count={props().count}
                  shape={props().shape}
                  labels={props().showLabels ? LABELS.slice(0, props().count) : []}
                  activeColor={props().activeColor}
                  idleColor={renderedIdleColor()}
                  tipColor={renderedTipColor()}
                  tipTextColor={renderedTipTextColor()}
                  size={props().size}
                  lift={props().lift}
                  magnify={props().magnify}
                  riseDuration={props().riseDuration}
                  popScale={props().popScale}
                  showTip={props().showTip}
                  allowClear={props().allowClear}
                  readOnly={props().readOnly}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSlider
              title="Value"
              min={0}
              max={props().count}
              step={1}
              value={Math.min(value(), props().count)}
              onChange={v => {
                setValue(v);
              }}
            />
            <PreviewSlider
              title="Count"
              min={3}
              max={10}
              step={1}
              value={props().count}
              onChange={v => {
                updateProp('count', v);
                setValue(prev => Math.min(prev, v));
              }}
            />
            <PreviewSelect
              title="Shape"
              options={SHAPE_OPTIONS}
              value={props().shape}
              onChange={(v: PeekRatingShape) => updateProp('shape', v)}
              width={120}
            />
            <PreviewSwitch title="Labels" isChecked={props().showLabels} onChange={v => updateProp('showLabels', v)} />
            <PreviewSwitch title="Tip" isChecked={props().showTip} onChange={v => updateProp('showTip', v)} />
            <PreviewColorPickerCustom
              title="Active"
              color={props().activeColor}
              onChange={v => updateProp('activeColor', v)}
            />
            <PreviewColorPickerCustom
              title="Idle"
              color={renderedIdleColor()}
              onChange={v => updateProp('idleColor', v)}
            />
            <PreviewColorPickerCustom
              title="Tip"
              color={renderedTipColor()}
              onChange={v => updateProp('tipColor', v)}
            />
            <PreviewColorPickerCustom
              title="Tip Text"
              color={renderedTipTextColor()}
              onChange={v => updateProp('tipTextColor', v)}
            />
            <PreviewSlider
              title="Size"
              min={16}
              max={48}
              step={1}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Lift"
              min={0}
              max={16}
              step={1}
              value={props().lift}
              valueUnit="px"
              onChange={v => updateProp('lift', v)}
            />
            <PreviewSlider
              title="Magnify"
              min={1}
              max={1.5}
              step={0.01}
              value={props().magnify}
              onChange={v => updateProp('magnify', v)}
            />
            <PreviewSlider
              title="Rise"
              min={120}
              max={600}
              step={10}
              value={props().riseDuration}
              valueUnit="ms"
              onChange={v => updateProp('riseDuration', v)}
            />
            <PreviewSlider
              title="Pop"
              min={1}
              max={1.6}
              step={0.05}
              value={props().popScale}
              onChange={v => updateProp('popScale', v)}
            />
            <PreviewSwitch
              title="Allow Clear"
              isChecked={props().allowClear}
              onChange={v => updateProp('allowClear', v)}
            />
            <PreviewSwitch title="Read Only" isChecked={props().readOnly} onChange={v => updateProp('readOnly', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={peekRating} componentName="PeekRating" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
