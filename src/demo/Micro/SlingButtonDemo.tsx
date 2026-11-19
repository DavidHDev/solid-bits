import { createSignal, onCleanup } from 'solid-js';
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

import SlingButton, { type SlingAxis } from '@/content/Micro/SlingButton/SlingButton';
import { slingButton } from '@/constants/code/Micro/slingButtonCode';

const DEFAULT_PROPS = {
  padColor: '#f5f5f5',
  iconColor: '#18181b',
  accentColor: '#f5f5f5',
  wellColor: '#27272a',
  bandColor: '#52525b',
  size: 56,
  strokeWidth: 3,
  armAt: 48,
  maxPull: 160,
  launchSpeed: 2600,
  recoil: 0.2,
  flight: 120,
  particles: 14,
  spread: 60,
  axis: 'any',
  tapSends: true,
  disabled: false
};

type ColorKey = 'padColor' | 'iconColor' | 'accentColor' | 'wellColor' | 'bandColor';

const LIGHT: Record<ColorKey, string> = {
  padColor: '#18181b',
  iconColor: '#ffffff',
  accentColor: '#18181b',
  wellColor: '#f6f6f6',
  bandColor: '#a1a1aa'
};

const AXIS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: 'undefined', description: 'Pad content. Defaults to an arrow.' },
  {
    name: 'onSend',
    type: '() => void',
    default: '-',
    description: 'Called on a loaded release, on a tap when tapSends is on, and on Enter or Space.'
  },
  { name: 'padColor', type: 'string', default: '"#f5f5f5"', description: 'The pad fill.' },
  { name: 'iconColor', type: 'string', default: '"#18181b"', description: 'The pad content colour.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The power arc, the loaded band and the dot.'
  },
  { name: 'wellColor', type: 'string', default: '"#27272a"', description: 'The seat the pad rests in.' },
  { name: 'bandColor', type: 'string', default: '"#52525b"', description: 'The band before it loads.' },
  {
    name: 'size',
    type: 'number',
    default: '56',
    description: 'Pad diameter in pixels. Seat, hit area and dot follow.'
  },
  {
    name: 'strokeWidth',
    type: 'number',
    default: '3',
    description: 'Arc and band thickness in pixels. The band thins as it stretches.'
  },
  { name: 'armAt', type: 'number', default: '48', description: 'Pull distance in pixels that loads the send.' },
  {
    name: 'maxPull',
    type: 'number',
    default: '160',
    description: 'How far the band can stretch before it stops giving.'
  },
  {
    name: 'launchSpeed',
    type: 'number',
    default: '2600',
    description: 'Speed the band adds on release, in pixels per second. Sets how far the pad snaps through its seat.'
  },
  { name: 'recoil', type: 'number', default: '0.2', description: 'Bounce of the return spring. 0 stops dead.' },
  {
    name: 'flight',
    type: 'number',
    default: '120',
    description: 'How far the lead particle flies, in pixels. The rest scatter around that distance.'
  },
  {
    name: 'particles',
    type: 'number',
    default: '14',
    description:
      'How many particles a launch throws. Each gets a random angle, reach, size, drift, speed and delay. 1 is a single dot, 0 is none.'
  },
  {
    name: 'spread',
    type: 'number',
    default: '60',
    description: 'The cone the burst fans across, in degrees, centred on the launch direction.'
  },
  {
    name: 'axis',
    type: '"any" | "horizontal" | "vertical"',
    default: '"any"',
    description: 'Free pull, or one axis with a little give across it.'
  },
  {
    name: 'tapSends',
    type: 'boolean',
    default: 'true',
    description: 'Whether a plain tap sends. Enter always does.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dims the pad and ignores input.' },
  { name: 'ariaLabel', type: 'string', default: '"Send"', description: 'Accessible name of the button.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function SlingButtonDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const light = (key: ColorKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedPad = useColorModeValue(
    () => light('padColor'),
    () => props().padColor
  );
  const renderedIcon = useColorModeValue(
    () => light('iconColor'),
    () => props().iconColor
  );
  const renderedAccent = useColorModeValue(
    () => light('accentColor'),
    () => props().accentColor
  );
  const renderedWell = useColorModeValue(
    () => light('wellColor'),
    () => props().wellColor
  );
  const renderedBand = useColorModeValue(
    () => light('bandColor'),
    () => props().bandColor
  );

  const [sent, setSent] = createSignal(false);
  let sentTimer: ReturnType<typeof setTimeout> | undefined;
  const handleSend = () => {
    clearTimeout(sentTimer);
    setSent(true);
    sentTimer = setTimeout(() => {
      setSent(false);
    }, 1400);
  };
  onCleanup(() => clearTimeout(sentTimer));

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
            <SlingButton
              onSend={handleSend}
              padColor={renderedPad()}
              iconColor={renderedIcon()}
              accentColor={renderedAccent()}
              wellColor={renderedWell()}
              bandColor={renderedBand()}
              size={props().size}
              strokeWidth={props().strokeWidth}
              armAt={props().armAt}
              maxPull={props().maxPull}
              launchSpeed={props().launchSpeed}
              recoil={props().recoil}
              flight={props().flight}
              particles={props().particles}
              spread={props().spread}
              axis={props().axis as SlingAxis}
              tapSends={props().tapSends}
              disabled={props().disabled}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, 0)',
                'margin-top': `${Math.round(props().size / 2) + 22}px`,
                'font-size': '12px',
                'line-height': 1,
                'letter-spacing': '0.02em',
                color: renderedAccent(),
                opacity: sent() ? 0.6 : 0,
                transition: 'opacity 200ms ease',
                'pointer-events': 'none'
              }}
              aria-live="polite"
            >
              {sent() ? 'Sent' : ''}
            </div>
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Pad" color={renderedPad()} onChange={v => updateProp('padColor', v)} />
            <PreviewColorPickerCustom title="Icon" color={renderedIcon()} onChange={v => updateProp('iconColor', v)} />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom title="Well" color={renderedWell()} onChange={v => updateProp('wellColor', v)} />
            <PreviewColorPickerCustom title="Band" color={renderedBand()} onChange={v => updateProp('bandColor', v)} />
            <PreviewSlider
              title="Size"
              min={40}
              max={88}
              step={2}
              value={props().size}
              valueUnit="px"
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Stroke Width"
              min={1.5}
              max={6}
              step={0.5}
              value={props().strokeWidth}
              valueUnit="px"
              onChange={v => updateProp('strokeWidth', v)}
            />
            <PreviewSlider
              title="Arm At"
              min={24}
              max={96}
              step={4}
              value={props().armAt}
              valueUnit="px"
              onChange={v => updateProp('armAt', v)}
            />
            <PreviewSlider
              title="Max Pull"
              min={80}
              max={320}
              step={10}
              value={props().maxPull}
              valueUnit="px"
              onChange={v => updateProp('maxPull', v)}
            />
            <PreviewSlider
              title="Launch Speed"
              min={800}
              max={4000}
              step={100}
              value={props().launchSpeed}
              valueUnit="px/s"
              onChange={v => updateProp('launchSpeed', v)}
            />
            <PreviewSlider
              title="Recoil"
              min={0}
              max={0.3}
              step={0.05}
              value={props().recoil}
              onChange={v => updateProp('recoil', v)}
            />
            <PreviewSlider
              title="Flight"
              min={40}
              max={240}
              step={10}
              value={props().flight}
              valueUnit="px"
              onChange={v => updateProp('flight', v)}
            />
            <PreviewSlider
              title="Particles"
              min={0}
              max={80}
              step={1}
              value={props().particles}
              onChange={v => updateProp('particles', v)}
            />
            <PreviewSlider
              title="Spread"
              min={0}
              max={180}
              step={5}
              value={props().spread}
              valueUnit="°"
              onChange={v => updateProp('spread', v)}
            />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={props().axis}
              onChange={v => updateProp('axis', v)}
              width={130}
            />
            <PreviewSwitch title="Tap Sends" isChecked={props().tapSends} onChange={v => updateProp('tapSends', v)} />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={slingButton} componentName="SlingButton" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
