import { For } from 'solid-js';
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
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import SpringCheck, { type StrikeSide } from '@/content/Micro/SpringCheck/SpringCheck';
import { springCheck } from '@/constants/code/Micro/springCheckCode';

const DEFAULT_PROPS = {
  color: '#ffffff',
  fillColor: '#ffffff',
  checkColor: '#0b0b0f',
  boxSize: 28,
  boxRadius: 9,
  fontSize: 18,
  bounce: 0.2,
  strikeLag: 0.12,
  doneOpacity: 0.42,
  strike: 'left' as StrikeSide,
  disabled: false
};

const STRIKE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'none', label: 'None' }
];

const ROWS = [
  { label: 'Ship the build', defaultChecked: false },
  { label: 'Update the changelog', defaultChecked: false },
  { label: 'Book the launch call', defaultChecked: true }
];

const propData: PropRow[] = [
  {
    name: 'label',
    type: 'JSX.Element',
    default: '"Ship the build"',
    description: 'The words beside the box; the strike-through is exactly their width.'
  },
  {
    name: 'checked',
    type: 'boolean',
    default: 'undefined',
    description: 'Controlled state. A change from outside animates on the spring.'
  },
  { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
  { name: 'onChange', type: '(checked: boolean) => void', default: '-', description: 'Called on every toggle.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the row and ignores input.' },
  {
    name: 'color',
    type: 'string',
    default: '"#ffffff"',
    description: 'Ink: the label, the ring, the rule and the focus outline.'
  },
  {
    name: 'fillColor',
    type: 'string',
    default: '"#ffffff"',
    description: 'The fill that swells out of the box centre.'
  },
  {
    name: 'checkColor',
    type: 'string',
    default: '"#0b0b0f"',
    description: 'Stroke of the tick drawn over the fill.'
  },
  {
    name: 'boxSize',
    type: 'number',
    default: '28',
    description: 'Box side in pixels; ring, gap and row height derive from it.'
  },
  {
    name: 'boxRadius',
    type: 'number',
    default: '9',
    description: 'Box corner radius in pixels; half the size makes a circle.'
  },
  {
    name: 'fontSize',
    type: 'number',
    default: '18',
    description: 'Label size in pixels; the rule thickness derives from it.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.2',
    description: 'How far the fill swells past full. 0 arrives dead, 0.5 rebounds twice.'
  },
  {
    name: 'strikeLag',
    type: 'number',
    default: '0.12',
    description: 'Where on the spring the rule starts: 0 wipes with the fill, 0.4 waits for the tick.'
  },
  {
    name: 'doneOpacity',
    type: 'number',
    default: '0.42',
    description: 'How much ink the words keep once checked.'
  },
  {
    name: 'strike',
    type: '"left" | "center" | "right" | "none"',
    default: '"left"',
    description: 'Where the strike-through wipes from, or no rule at all.'
  },
  { name: 'ariaLabel', type: 'string', default: '-', description: 'Accessible name when the label is not text.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the row.' }
];

export default function SpringCheckDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#18181b' : props().color),
    () => props().color
  );
  const renderedFill = useColorModeValue(
    () => (props().fillColor === DEFAULT_PROPS.fillColor ? '#18181b' : props().fillColor),
    () => props().fillColor
  );
  const renderedCheck = useColorModeValue(
    () => (props().checkColor === DEFAULT_PROPS.checkColor ? '#ffffff' : props().checkColor),
    () => props().checkColor
  );

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
            <Keyed token={rerenderKey()}>
              {() => (
                <div
                  style={{
                    display: 'flex',
                    'flex-direction': 'column',
                    'align-items': 'flex-start',
                    gap: '4px',
                    'min-width': '260px'
                  }}
                >
                  <For each={ROWS}>
                    {row => (
                      <SpringCheck
                        label={row.label}
                        defaultChecked={row.defaultChecked}
                        disabled={props().disabled}
                        color={renderedColor()}
                        fillColor={renderedFill()}
                        checkColor={renderedCheck()}
                        boxSize={props().boxSize}
                        boxRadius={props().boxRadius}
                        fontSize={props().fontSize}
                        bounce={props().bounce}
                        strikeLag={props().strikeLag}
                        doneOpacity={props().doneOpacity}
                        strike={props().strike}
                      />
                    )}
                  </For>
                </div>
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom title="Fill" color={renderedFill()} onChange={v => updateProp('fillColor', v)} />
            <PreviewColorPickerCustom
              title="Check"
              color={renderedCheck()}
              onChange={v => updateProp('checkColor', v)}
            />
            <PreviewSlider
              title="Box Size"
              min={16}
              max={40}
              step={1}
              value={props().boxSize}
              valueUnit="px"
              onChange={v => updateProp('boxSize', v)}
            />
            <PreviewSlider
              title="Box Radius"
              min={0}
              max={20}
              step={1}
              value={props().boxRadius}
              valueUnit="px"
              onChange={v => updateProp('boxRadius', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={28}
              step={1}
              value={props().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.5}
              step={0.05}
              value={props().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSlider
              title="Strike Lag"
              min={0}
              max={0.5}
              step={0.02}
              value={props().strikeLag}
              onChange={v => updateProp('strikeLag', v)}
            />
            <PreviewSlider
              title="Done Opacity"
              min={0.2}
              max={0.8}
              step={0.02}
              value={props().doneOpacity}
              onChange={v => updateProp('doneOpacity', v)}
            />
            <PreviewSelect
              title="Strike"
              options={STRIKE_OPTIONS}
              value={props().strike}
              onChange={(v: StrikeSide) => updateProp('strike', v)}
              width={120}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={springCheck} componentName="SpringCheck" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
