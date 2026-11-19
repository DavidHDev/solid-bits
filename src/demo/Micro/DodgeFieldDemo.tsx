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

import DodgeField, { type DodgeAxis, type DodgeWall } from '@/content/Micro/DodgeField/DodgeField';
import { dodgeField } from '@/constants/code/Micro/dodgeFieldCode';

const DEFAULT_PROPS = {
  inkColor: '#f5f5f5',
  contrastColor: '#18181b',
  fieldHeight: 240,
  reach: 72,
  radius: 120,
  falloff: 2,
  fleeDuration: 130,
  returnDuration: 620,
  returnBounce: 0.1,
  patience: 4,
  axis: 'both',
  wall: 'clamp',
  disabled: false
};

const AXIS_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'x', label: 'Horizontal' },
  { value: 'y', label: 'Vertical' }
];

const WALL_OPTIONS = [
  { value: 'clamp', label: 'Clamp' },
  { value: 'bounce', label: 'Bounce' }
];

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element | (state) => JSX.Element',
    default: 'undefined',
    description:
      'What flees. Omit it for the built-in pill, pass any element, or pass a function of { dodges, gave, caught, fleeing }.'
  },
  {
    name: 'taunts',
    type: 'string[]',
    default: '["Catch me", "Nope", "Too slow", "Almost", "Okay, okay"]',
    description: 'Labels for the built-in pill: the first at rest, then one per dodge, the last once it relents.'
  },
  {
    name: 'notice',
    type: 'string',
    default: '""',
    description: 'One line shown under the child on touch devices, where nothing dodges.'
  },
  {
    name: 'inkColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The pill tint and text, the caught fill and the focus ring all derive from it.'
  },
  {
    name: 'contrastColor',
    type: 'string',
    default: '"#18181b"',
    description: 'Text colour while the pill is caught.'
  },
  {
    name: 'fieldHeight',
    type: 'number',
    default: '240',
    description: 'Height of the invisible field in pixels; its width is the container.'
  },
  {
    name: 'reach',
    type: 'number',
    default: '72',
    description: 'How far it bolts, in pixels, with the pointer on its home.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '120',
    description: 'Distance from home at which it starts to react, in pixels.'
  },
  {
    name: 'falloff',
    type: 'number',
    default: '2',
    description: 'Exponent of the reaction curve. 1 drifts away from far off; 4 only flinches at the last moment.'
  },
  {
    name: 'fleeDuration',
    type: 'number',
    default: '130',
    description: 'Settle time of the dart, in milliseconds.'
  },
  {
    name: 'returnDuration',
    type: 'number',
    default: '620',
    description: 'Settle time of the glide home, in milliseconds.'
  },
  {
    name: 'returnBounce',
    type: 'number',
    default: '0.1',
    description: 'Overshoot on the way home. 0.1 is a hair, 0.3 a visible wobble.'
  },
  {
    name: 'axis',
    type: '"both" | "x" | "y"',
    default: '"both"',
    description: 'Which way it may flee.'
  },
  {
    name: 'wall',
    type: '"clamp" | "bounce"',
    default: '"clamp"',
    description: 'At the edge of the field: stop dead, or fold the overflow back so it rebounds.'
  },
  {
    name: 'patience',
    type: 'number',
    default: '4',
    description:
      'Dodges before it gives in and sits still, at least 1. Never wrap a decline or close control in a field that dodges.'
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Sits still and stops counting; the child stays clickable.'
  },
  { name: 'onDodge', type: '(count: number) => void', default: '-', description: 'Called on each counted dodge.' },
  { name: 'onRelent', type: '() => void', default: '-', description: 'Called when it gives in.' },
  { name: 'onCatch', type: '() => void', default: '-', description: 'Called when the child is clicked.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the field.' },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: 'undefined',
    description: 'Inline styles merged onto the field.'
  }
];

export default function DodgeFieldDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedInk = useColorModeValue(
    () => (props().inkColor === DEFAULT_PROPS.inkColor ? '#18181b' : props().inkColor),
    () => props().inkColor
  );
  const renderedContrast = useColorModeValue(
    () => (props().contrastColor === DEFAULT_PROPS.contrastColor ? '#ffffff' : props().contrastColor),
    () => props().contrastColor
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
            <DodgeField
              inkColor={renderedInk()}
              contrastColor={renderedContrast()}
              fieldHeight={props().fieldHeight}
              reach={props().reach}
              radius={props().radius}
              falloff={props().falloff}
              fleeDuration={props().fleeDuration}
              returnDuration={props().returnDuration}
              returnBounce={props().returnBounce}
              patience={props().patience}
              axis={props().axis as DodgeAxis}
              wall={props().wall as DodgeWall}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedInk()} onChange={v => updateProp('inkColor', v)} />
            <PreviewColorPickerCustom
              title="Contrast"
              color={renderedContrast()}
              onChange={v => updateProp('contrastColor', v)}
            />
            <PreviewSlider
              title="Field Height"
              min={120}
              max={360}
              step={10}
              value={props().fieldHeight}
              valueUnit="px"
              onChange={v => updateProp('fieldHeight', v)}
            />
            <PreviewSlider
              title="Reach"
              min={14}
              max={120}
              step={2}
              value={props().reach}
              valueUnit="px"
              onChange={v => updateProp('reach', v)}
            />
            <PreviewSlider
              title="Radius"
              min={60}
              max={200}
              step={5}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Falloff"
              min={1}
              max={4}
              step={0.5}
              value={props().falloff}
              onChange={v => updateProp('falloff', v)}
            />
            <PreviewSlider
              title="Flee"
              min={60}
              max={300}
              step={10}
              value={props().fleeDuration}
              valueUnit="ms"
              onChange={v => updateProp('fleeDuration', v)}
            />
            <PreviewSlider
              title="Return"
              min={200}
              max={1000}
              step={20}
              value={props().returnDuration}
              valueUnit="ms"
              onChange={v => updateProp('returnDuration', v)}
            />
            <PreviewSlider
              title="Return Bounce"
              min={0}
              max={0.3}
              step={0.05}
              value={props().returnBounce}
              onChange={v => updateProp('returnBounce', v)}
            />
            <PreviewSlider
              title="Patience"
              min={1}
              max={8}
              step={1}
              value={props().patience}
              onChange={v => updateProp('patience', v)}
            />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={props().axis}
              onChange={v => updateProp('axis', v)}
              width={130}
            />
            <PreviewSelect
              title="Wall"
              options={WALL_OPTIONS}
              value={props().wall}
              onChange={v => updateProp('wall', v)}
              width={120}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={dodgeField} componentName="DodgeField" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
