import { createEffect, createSignal } from 'solid-js';
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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import BellToggle, { type BellToggleSize } from '@/content/Micro/BellToggle/BellToggle';
import { bellToggle } from '@/constants/code/Micro/bellToggleCode';

const DEFAULT_PROPS = {
  offLabel: 'Notify me',
  onLabel: "You'll be notified",
  color: '#f5f5f5',
  background: '#27272a',
  onColor: '#18181b',
  onBackground: '#f5f5f5',
  size: 'md',
  radius: 22,
  ringAmplitude: 17,
  ringPasses: 5,
  ringDecay: 1,
  ringDuration: 820,
  ringPivot: 16,
  crossfadeMs: 200,
  revealBounce: 0,
  badge: true,
  badgeColor: '#ef4444',
  waves: true,
  clapper: false,
  disabled: false
};

type ColorKey = 'color' | 'background' | 'onColor' | 'onBackground';

const LIGHT: Record<ColorKey, string> = {
  color: '#18181b',
  background: '#f6f6f6',
  onColor: '#ffffff',
  onBackground: '#18181b'
};

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const propData: PropRow[] = [
  {
    name: 'offLabel',
    type: 'string',
    default: '"Notify me"',
    description: 'The face at rest. Its width sets how far the pill is clipped.'
  },
  {
    name: 'onLabel',
    type: 'string',
    default: '"You\'ll be notified"',
    description:
      'The face after the yes press. The pill reserves the width of the longer label; only the visible part changes, so neighbours never shift.'
  },
  {
    name: 'icon',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Replaces the bell. Adjust ringPivot for a glyph that hangs elsewhere.'
  },
  {
    name: 'label',
    type: 'string',
    default: 'undefined',
    description: 'Constant accessible name. Falls back to offLabel.'
  },
  { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'Ink at rest: label, bell and hover tint.' },
  { name: 'background', type: 'string', default: '"#27272a"', description: 'Pill fill at rest.' },
  { name: 'onColor', type: 'string', default: '"#18181b"', description: 'Ink when pressed.' },
  { name: 'onBackground', type: 'string', default: '"#f5f5f5"', description: 'Fill when pressed.' },
  {
    name: 'size',
    type: '"sm" | "md" | "lg"',
    default: '"md"',
    description: '36, 44 or 52 pixels tall with matching type, icon and padding.'
  },
  { name: 'radius', type: 'number', default: '22', description: 'Corner radius of the pill and of the clip cap.' },
  {
    name: 'ringAmplitude',
    type: 'number',
    default: '17',
    description: 'Degrees of the first swing. Every later swing scales from it.'
  },
  {
    name: 'ringPasses',
    type: 'number',
    default: '5',
    description: 'Half-swings before rest. 2 is a nod, 9 a peal.'
  },
  {
    name: 'ringDecay',
    type: 'number',
    default: '1',
    description: 'How fast the swings die. 1 evenly, 2 the second is already small, 0.5 keeps shaking.'
  },
  { name: 'ringDuration', type: 'number', default: '820', description: 'Milliseconds for the whole ring.' },
  {
    name: 'ringPivot',
    type: 'number',
    default: '16',
    description: 'Where the icon hangs from, as a percentage of its height. 16 is the crown, 50 the centre.'
  },
  {
    name: 'crossfadeMs',
    type: 'number',
    default: '200',
    description: 'The label and fill crossfade. Also all a keyboard toggle gets.'
  },
  {
    name: 'revealBounce',
    type: 'number',
    default: '0',
    description: 'Overshoot of the unfurl. 0 is critically damped; 0.2 lets the cap pass its mark and return.'
  },
  {
    name: 'count',
    type: 'number',
    default: '0',
    description: 'Notifications waiting. A rise while on rolls the badge and wobbles the bell.'
  },
  { name: 'badge', type: 'boolean', default: 'true', description: 'Show the count on the bell while on.' },
  { name: 'badgeColor', type: 'string', default: '"#ef4444"', description: 'The badge.' },
  { name: 'badgeTextColor', type: 'string', default: '"#ffffff"', description: 'The count on the badge.' },
  { name: 'waves', type: 'boolean', default: 'true', description: 'Sound waves leave the rim on every swing.' },
  {
    name: 'clapper',
    type: 'boolean',
    default: 'false',
    description: 'Draw a bell with a clapper that swings a beat behind the body.'
  },
  {
    name: 'pressed',
    type: 'boolean',
    default: 'undefined',
    description: 'Controlled state. Outside changes only crossfade.'
  },
  { name: 'defaultPressed', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
  { name: 'onChange', type: '(pressed: boolean) => void', default: '-', description: 'Called on every toggle.' },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Dims the pill and ignores input. The state is kept.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function BellToggleDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [on, setOn] = createSignal(false);
  const [count, setCount] = createSignal(0);

  createEffect(on, value => {
    if (!value) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const next = () => {
      timer = setTimeout(
        () => {
          setCount(c => Math.min(9, c + 1));
          next();
        },
        1100 + Math.random() * 1400
      );
    };
    next();
    return () => clearTimeout(timer);
  });

  const toggle = (value: boolean) => {
    setOn(value);
    if (!value) setCount(0);
  };

  const light = (key: ColorKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedColor = useColorModeValue(
    () => light('color'),
    () => props().color
  );
  const renderedBackground = useColorModeValue(
    () => light('background'),
    () => props().background
  );
  const renderedOnColor = useColorModeValue(
    () => light('onColor'),
    () => props().onColor
  );
  const renderedOnBackground = useColorModeValue(
    () => light('onBackground'),
    () => props().onBackground
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
            <BellToggle
              offLabel={props().offLabel}
              onLabel={props().onLabel}
              color={renderedColor()}
              background={renderedBackground()}
              onColor={renderedOnColor()}
              onBackground={renderedOnBackground()}
              size={props().size as BellToggleSize}
              radius={props().radius}
              ringAmplitude={props().ringAmplitude}
              ringPasses={props().ringPasses}
              ringDecay={props().ringDecay}
              ringDuration={props().ringDuration}
              ringPivot={props().ringPivot}
              crossfadeMs={props().crossfadeMs}
              revealBounce={props().revealBounce}
              count={count()}
              badge={props().badge}
              badgeColor={props().badgeColor}
              waves={props().waves}
              clapper={props().clapper}
              pressed={on()}
              onChange={toggle}
              disabled={props().disabled}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Text" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewColorPickerCustom
              title="Pressed Text"
              color={renderedOnColor()}
              onChange={v => updateProp('onColor', v)}
            />
            <PreviewColorPickerCustom
              title="Pressed Background"
              color={renderedOnBackground()}
              onChange={v => updateProp('onBackground', v)}
            />
            <PreviewSelect
              title="Size"
              options={SIZE_OPTIONS}
              value={props().size}
              onChange={v => updateProp('size', v)}
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
              title="Ring Amplitude"
              min={6}
              max={40}
              step={1}
              value={props().ringAmplitude}
              valueUnit="°"
              onChange={v => updateProp('ringAmplitude', v)}
            />
            <PreviewSlider
              title="Ring Passes"
              min={2}
              max={9}
              step={1}
              value={props().ringPasses}
              onChange={v => updateProp('ringPasses', v)}
            />
            <PreviewSlider
              title="Ring Decay"
              min={0.5}
              max={2}
              step={0.1}
              value={props().ringDecay}
              onChange={v => updateProp('ringDecay', v)}
            />
            <PreviewSlider
              title="Ring Duration"
              min={400}
              max={1400}
              step={20}
              value={props().ringDuration}
              valueUnit="ms"
              onChange={v => updateProp('ringDuration', v)}
            />
            <PreviewSlider
              title="Ring Pivot"
              min={0}
              max={100}
              step={2}
              value={props().ringPivot}
              valueUnit="%"
              onChange={v => updateProp('ringPivot', v)}
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
            <PreviewSlider
              title="Reveal Bounce"
              min={0}
              max={0.3}
              step={0.05}
              value={props().revealBounce}
              onChange={v => updateProp('revealBounce', v)}
            />
            <PreviewSwitch title="Badge" isChecked={props().badge} onChange={v => updateProp('badge', v)} />
            <PreviewColorPickerCustom
              title="Badge Color"
              color={props().badgeColor}
              onChange={v => updateProp('badgeColor', v)}
            />
            <PreviewSwitch title="Waves" isChecked={props().waves} onChange={v => updateProp('waves', v)} />
            <PreviewSwitch title="Clapper" isChecked={props().clapper} onChange={v => updateProp('clapper', v)} />
            <PreviewInput
              title="Off Label"
              value={props().offLabel}
              maxLength={24}
              onChange={v => updateProp('offLabel', v)}
            />
            <PreviewInput
              title="On Label"
              value={props().onLabel}
              maxLength={24}
              onChange={v => updateProp('onLabel', v)}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={bellToggle} componentName="BellToggle" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
