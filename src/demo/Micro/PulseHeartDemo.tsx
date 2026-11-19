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

import PulseHeart, { type PulseHeartIcon } from '@/content/Micro/PulseHeart/PulseHeart';
import { pulseHeart } from '@/constants/code/Micro/pulseHeartCode';

const DEFAULT_PROPS = {
  count: 1204,
  showCount: true,
  icon: 'heart' as PulseHeartIcon,
  idleOutline: true,
  likedColor: '#ff4d6d',
  idleColor: '#8d8f94',
  pillColor: '#222428',
  textColor: '#f5f5f5',
  size: 40,
  corner: 32,
  duration: 560,
  dotSize: 0.3,
  overshoot: 1.7,
  beat: 3,
  rollDuration: 350,
  disabled: false
};

const ICON_OPTIONS = [
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'thumb', label: 'Thumb' }
];

const propData: PropRow[] = [
  {
    name: 'liked',
    type: 'boolean',
    default: 'undefined',
    description: 'Controlled state. Changes from outside land without a run.'
  },
  { name: 'defaultLiked', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
  {
    name: 'count',
    type: 'number',
    default: '0',
    description:
      'The number shown; a press adds or removes one. Rolls one glyph per press. For a multi-digit odometer with places and decimals, use Counter.'
  },
  {
    name: 'onChange',
    type: '(liked: boolean, count: number) => void',
    default: '-',
    description: 'Called on every press with the new state and count.'
  },
  {
    name: 'showCount',
    type: 'boolean',
    default: 'true',
    description: 'Shows the count; off collapses the pill to a circle.'
  },
  {
    name: 'icon',
    type: '"heart" | "star" | "thumb" | JSX.Element',
    default: '"heart"',
    description: 'Built-in glyph, or a custom element.'
  },
  {
    name: 'idleOutline',
    type: 'boolean',
    default: 'true',
    description: 'Draws the idle glyph as an outline. Off draws it as a muted solid.'
  },
  {
    name: 'size',
    type: 'number',
    default: '40',
    description: 'Glyph size in pixels; padding, gap and count size derive from it.'
  },
  { name: 'corner', type: 'number', default: '32', description: 'Pill corner radius in pixels.' },
  {
    name: 'likedColor',
    type: 'string',
    default: '"#ff4d6d"',
    description: 'Colour after the flip, and of the hover tint and focus ring.'
  },
  { name: 'idleColor', type: 'string', default: '"#8d8f94"', description: 'Colour before the flip.' },
  {
    name: 'pillColor',
    type: 'string',
    default: '"#222428"',
    description: 'Background of the pill that beats under the glyph.'
  },
  { name: 'textColor', type: 'string', default: '"#f5f5f5"', description: 'Colour of the count.' },
  {
    name: 'duration',
    type: 'number',
    default: '560',
    description: 'Length of the whole run in milliseconds; the flip is always at 40% of it.'
  },
  {
    name: 'dotSize',
    type: 'number',
    default: '0.3',
    description: 'How small the glyph gets at the flip, as a fraction of its size.'
  },
  {
    name: 'overshoot',
    type: 'number',
    default: '1.7',
    description: 'How far the glyph rebounds past rest on the way back. 0 lands without a rebound.'
  },
  { name: 'beat', type: 'number', default: '3', description: 'Percent the pill dips at the flip.' },
  {
    name: 'rollDuration',
    type: 'number',
    default: '350',
    description: 'How long the changed glyph of the count takes to roll, in milliseconds.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the button and ignores input.' },
  {
    name: 'label',
    type: 'string',
    default: '"Like"',
    description: 'Accessible name; the count is appended to it.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the button.' }
];

export default function PulseHeartDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedIdle = useColorModeValue(
    () => (props().idleColor === DEFAULT_PROPS.idleColor ? '#707379' : props().idleColor),
    () => props().idleColor
  );
  const renderedPill = useColorModeValue(
    () => (props().pillColor === DEFAULT_PROPS.pillColor ? '#f0f1f3' : props().pillColor),
    () => props().pillColor
  );
  const renderedText = useColorModeValue(
    () => (props().textColor === DEFAULT_PROPS.textColor ? '#11151b' : props().textColor),
    () => props().textColor
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
            <PulseHeart
              count={props().count}
              showCount={props().showCount}
              icon={props().icon}
              idleOutline={props().idleOutline}
              likedColor={props().likedColor}
              idleColor={renderedIdle()}
              pillColor={renderedPill()}
              textColor={renderedText()}
              size={props().size}
              corner={props().corner}
              duration={props().duration}
              dotSize={props().dotSize}
              overshoot={props().overshoot}
              beat={props().beat}
              rollDuration={props().rollDuration}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewSlider
              title="Count"
              min={0}
              max={2000}
              step={1}
              value={props().count}
              onChange={v => updateProp('count', v)}
            />
            <PreviewSwitch
              title="Show Count"
              isChecked={props().showCount}
              onChange={v => updateProp('showCount', v)}
            />
            <PreviewSelect
              title="Icon"
              options={ICON_OPTIONS}
              value={props().icon}
              onChange={(v: PulseHeartIcon) => updateProp('icon', v)}
              width={120}
            />
            <PreviewSwitch
              title="Idle Outline"
              isChecked={props().idleOutline}
              onChange={v => updateProp('idleOutline', v)}
            />
            <PreviewColorPickerCustom
              title="Liked"
              color={props().likedColor}
              onChange={v => updateProp('likedColor', v)}
            />
            <PreviewColorPickerCustom title="Idle" color={renderedIdle()} onChange={v => updateProp('idleColor', v)} />
            <PreviewColorPickerCustom title="Pill" color={renderedPill()} onChange={v => updateProp('pillColor', v)} />
            <PreviewColorPickerCustom title="Text" color={renderedText()} onChange={v => updateProp('textColor', v)} />
            <PreviewSlider
              title="Size"
              min={24}
              max={64}
              step={2}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Corner"
              min={6}
              max={40}
              step={1}
              value={props().corner}
              valueUnit="px"
              onChange={v => updateProp('corner', v)}
            />
            <PreviewSlider
              title="Duration"
              min={300}
              max={900}
              step={20}
              value={props().duration}
              valueUnit="ms"
              onChange={v => updateProp('duration', v)}
            />
            <PreviewSlider
              title="Dot Size"
              min={0.15}
              max={0.6}
              step={0.05}
              value={props().dotSize}
              onChange={v => updateProp('dotSize', v)}
            />
            <PreviewSlider
              title="Overshoot"
              min={0}
              max={3}
              step={0.1}
              value={props().overshoot}
              onChange={v => updateProp('overshoot', v)}
            />
            <PreviewSlider
              title="Beat"
              min={2}
              max={4}
              step={0.25}
              value={props().beat}
              valueUnit="%"
              onChange={v => updateProp('beat', v)}
            />
            <PreviewSlider
              title="Roll"
              min={150}
              max={600}
              step={10}
              value={props().rollDuration}
              valueUnit="ms"
              onChange={v => updateProp('rollDuration', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={pulseHeart} componentName="PulseHeart" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
