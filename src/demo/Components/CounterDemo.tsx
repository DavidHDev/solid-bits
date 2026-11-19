import { For, Match, Show, Switch, createMemo, createSignal, onSettled } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { MinusSignIcon, PlusSignIcon, ShuffleIcon } from '@hugeicons/core-free-icons';

import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import Counter, { type CounterProps } from '@/content/Components/Counter/Counter';
import { counter } from '@/constants/code/Components/counterCode';
import './CounterDemo.css';

type Direction = NonNullable<CounterProps['direction']>;

type Motion = {
  direction: Direction;
  duration: number;
  bounce: number;
  stagger: number;
  fade: number;
  motionBlur: boolean;
  intro: boolean;
};

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
const PERCENT: Intl.NumberFormatOptions = { style: 'percent' };
const LAUNCH = ((2 * 24 + 14) * 60 + 37) * 60 + 9;

const FORMATS: Record<string, Intl.NumberFormatOptions | undefined> = {
  number: undefined,
  currency: USD,
  compact: { notation: 'compact' },
  unit: { style: 'unit', unit: 'kilometer-per-hour' }
};

const TILE: JSX.CSSProperties = {
  padding: '0.18em 0.14em',
  'border-radius': '0.18em',
  background: 'var(--cd-tile)',
  'box-shadow': 'var(--cd-tile-edge)'
};

const BASIC_NUMBER: CounterProps = { className: 'cd-basic__number' };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_PROPS = {
  demo: 'countdown',
  textColor: '',
  formatName: 'number',
  direction: 'auto',
  duration: 0.7,
  bounce: 0.2,
  stagger: 0.04,
  fade: 0.3,
  value: 1284,
  fontSize: 120,
  fontWeight: 500,
  gap: 0,
  decimals: 0,
  minDigits: 1,
  motionBlur: true,
  intro: true,
  tabular: true
};

const DEMO_OPTIONS = [
  { value: 'countdown', label: 'Countdown' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'basic', label: 'Basic' }
];

const FORMAT_OPTIONS = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'compact', label: 'Compact' },
  { value: 'unit', label: 'Unit' }
];

const DIRECTION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'shortest', label: 'Shortest' }
];

const propData: PropRow[] = [
  { name: 'value', type: 'number', default: '0', description: 'The number to show. Digits roll to every new value.' },
  {
    name: 'locale',
    type: 'string',
    default: "'en-US'",
    description: 'Locale used for separators, symbols and numerals.'
  },
  {
    name: 'format',
    type: 'Intl.NumberFormatOptions',
    default: '-',
    description: 'Formatting options such as currency, percent, units or compact notation.'
  },
  {
    name: 'decimals',
    type: 'number',
    default: '-',
    description: 'Fixed number of decimal places. Leave it out to use the format defaults.'
  },
  { name: 'minDigits', type: 'number', default: '1', description: 'Pads the whole part with leading zeros.' },
  { name: 'prefix', type: 'JSX.Element', default: '-', description: 'Content shown before the number.' },
  { name: 'suffix', type: 'JSX.Element', default: '-', description: 'Content shown after the number.' },
  {
    name: 'direction',
    type: "'auto' | 'up' | 'down' | 'shortest'",
    default: "'auto'",
    description: 'Which way digits roll. Auto rolls up as the number grows and down as it shrinks.'
  },
  { name: 'duration', type: 'number', default: '0.7', description: 'Roughly how long a roll takes, in seconds.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.2',
    description: 'How much digits overshoot before settling, from 0 to 0.9.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.04',
    description: 'Delay in seconds between neighbouring digits, so changes ripple from the right.'
  },
  {
    name: 'motionBlur',
    type: 'boolean',
    default: 'true',
    description: 'Blurs digits along their path while they spin fast.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'Spins every digit once and lands it when the counter first scrolls into view.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.3',
    description: 'How far in em digits roll beyond the text before fading out. 0 clips them at the edge.'
  },
  {
    name: 'fontSize',
    type: 'number | string',
    default: '100',
    description: 'Font size in px, or any CSS size such as inherit.'
  },
  { name: 'fontWeight', type: 'number | string', default: "'inherit'", description: 'Font weight of the number.' },
  { name: 'textColor', type: 'string', default: "'inherit'", description: 'Color of the number.' },
  { name: 'gap', type: 'number', default: '0', description: 'Space between digits and symbols in px.' },
  {
    name: 'padding',
    type: 'number',
    default: '0',
    description: 'Extra height in px added to each digit, which also spaces out rolling digits.'
  },
  {
    name: 'tabular',
    type: 'boolean',
    default: 'true',
    description: 'Keeps every digit the same width. When off, widths ease between digits as they roll.'
  },
  {
    name: 'digitStyle',
    type: 'JSX.CSSProperties',
    default: '-',
    description: 'Styles for each digit box, for example a tile background with padding and radius.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

const split = (seconds: number) => ({
  days: Math.floor(seconds / 86400),
  hours: Math.floor(seconds / 3600) % 24,
  minutes: Math.floor(seconds / 60) % 60,
  seconds: seconds % 60
});

const UNITS = [
  ['days', 'Days'],
  ['hours', 'Hours'],
  ['minutes', 'Minutes'],
  ['seconds', 'Seconds']
] as const;

function CountdownScene(props: { motion: Motion; color: string }) {
  const [left, setLeft] = createSignal(LAUNCH);

  onSettled(() => {
    const end = Date.now() + LAUNCH * 1000;
    const timer = setInterval(() => {
      setLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  });

  const time = createMemo(() => split(left()));

  return (
    <div class="cd-card cd-countdown">
      <span class="cd-countdown__title">Public beta opens in</span>
      <div class="cd-countdown__units">
        <For each={UNITS}>
          {([key, name], index) => (
            <div style={{ display: 'contents' }}>
              <Show when={index() > 0}>
                <span class="cd-countdown__colon" aria-hidden="true">
                  :
                </span>
              </Show>
              <div class="cd-countdown__unit">
                <Counter
                  {...props.motion}
                  direction={props.motion.direction === 'auto' ? 'down' : props.motion.direction}
                  value={time()[key]}
                  minDigits={2}
                  fontSize="var(--cd-count-size)"
                  fontWeight={500}
                  gap={6}
                  fade={0}
                  textColor={props.color || undefined}
                  digitStyle={TILE}
                />
                <span class="cd-countdown__label">{name}</span>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function PricingScene(props: { motion: Motion; color: string }) {
  const [yearly, setYearly] = createSignal(false);
  const [seats, setSeats] = createSignal(5);
  const perSeat = () => (yearly() ? 19 : 24);
  const total = () => seats() * perSeat() * (yearly() ? 12 : 1);

  return (
    <div class="cd-card cd-pricing">
      <div class="cd-pricing__head">
        <span class="cd-pricing__plan">Team</span>
        <div class="cd-segment" role="group" aria-label="Billing period">
          <button type="button" aria-pressed={yearly() ? 'false' : 'true'} onClick={() => setYearly(false)}>
            Monthly
          </button>
          <button type="button" aria-pressed={yearly() ? 'true' : 'false'} onClick={() => setYearly(true)}>
            Yearly
          </button>
        </div>
      </div>
      <div class="cd-pricing__price">
        <Counter
          {...props.motion}
          value={total()}
          format={USD}
          decimals={0}
          fontSize={52}
          fontWeight={500}
          textColor={props.color || undefined}
        />
        <span class="cd-pricing__period">{yearly() ? '/ year' : '/ month'}</span>
      </div>
      <div class="cd-pricing__note">
        <Counter {...props.motion} value={perSeat()} format={USD} decimals={0} fontSize={14} intro={false} />
        <span>&nbsp;per seat, billed {yearly() ? 'yearly' : 'monthly'}</span>
      </div>
      <div class="cd-pricing__seats">
        <span>Seats</span>
        <div class="cd-stepper">
          <button
            type="button"
            class="cd-button"
            aria-label="Remove a seat"
            disabled={seats() <= 1}
            onClick={() => setSeats(value => Math.max(1, value - 1))}
          >
            <HugeiconsIcon icon={MinusSignIcon} size={16} strokeWidth={2} />
          </button>
          <span class="cd-stepper__value">
            <Counter {...props.motion} value={seats()} fontSize={17} fontWeight={500} intro={false} />
          </span>
          <button
            type="button"
            class="cd-button"
            aria-label="Add a seat"
            disabled={seats() >= 99}
            onClick={() => setSeats(value => Math.min(99, value + 1))}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardScene(props: { motion: Motion; color: string }) {
  const [stats, setStats] = createSignal({ revenue: 48203.17, active: 1284, orders: 932, conversion: 0.0342 });

  onSettled(() => {
    const timer = setInterval(() => {
      setStats(current => ({
        revenue: Math.round((current.revenue + 4 + Math.random() * 260) * 100) / 100,
        active: clamp(current.active + Math.round((Math.random() - 0.45) * 46), 960, 1980),
        orders: current.orders + (Math.random() < 0.65 ? 1 + Math.floor(Math.random() * 3) : 0),
        conversion: clamp(current.conversion + (Math.random() - 0.48) * 0.0016, 0.028, 0.046)
      }));
    }, 1800);
    return () => clearInterval(timer);
  });

  return (
    <div class="cd-card cd-dashboard">
      <div class="cd-dashboard__head">
        <span>Revenue this month</span>
        <span class="cd-dashboard__live">Live</span>
      </div>
      <div class="cd-dashboard__total">
        <Counter
          {...props.motion}
          value={stats().revenue}
          format={USD}
          decimals={2}
          fontSize="var(--cd-total-size)"
          fontWeight={500}
          textColor={props.color || undefined}
        />
      </div>
      <span class="cd-dashboard__trend">12.4% more than last month</span>
      <div class="cd-dashboard__stats">
        <div class="cd-dashboard__stat">
          <span>Active now</span>
          <Counter {...props.motion} value={stats().active} fontSize={24} fontWeight={500} />
        </div>
        <div class="cd-dashboard__stat">
          <span>Orders</span>
          <Counter {...props.motion} value={stats().orders} fontSize={24} fontWeight={500} />
        </div>
        <div class="cd-dashboard__stat">
          <span>Conversion</span>
          <Counter
            {...props.motion}
            value={stats().conversion}
            format={PERCENT}
            decimals={2}
            fontSize={24}
            fontWeight={500}
          />
        </div>
      </div>
    </div>
  );
}

function BasicScene(props: {
  settings: CounterProps & { value: number; decimals: number; fontSize: number };
  formatName: string;
  color: string;
  onValue: (value: number) => void;
}) {
  return (
    <div class="cd-basic">
      <Counter
        {...props.settings}
        {...BASIC_NUMBER}
        format={FORMATS[props.formatName]}
        fontSize={`min(${props.settings.fontSize}px, 15cqw)`}
        textColor={props.color || undefined}
      />
      <div class="cd-basic__actions">
        <button
          type="button"
          class="cd-button"
          aria-label="Decrease"
          onClick={() => props.onValue(Math.max(0, props.settings.value - 1))}
        >
          <HugeiconsIcon icon={MinusSignIcon} size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          class="cd-button"
          aria-label="Increase"
          onClick={() => props.onValue(props.settings.value + 1)}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          class="cd-button"
          aria-label="Random value"
          onClick={() => {
            const scale = 10 ** props.settings.decimals;
            props.onValue(Math.round(Math.random() * 99999 * scale) / scale);
          }}
        >
          <HugeiconsIcon icon={ShuffleIcon} size={18} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

export default function CounterDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { demo: _demo, textColor: _textColor, formatName: _formatName, ...rest } = props();
    return { ...rest, direction: rest.direction as Direction };
  });
  const theme = useColorModeValue('light', 'dark');
  const ink = useColorModeValue('#15171a', '#f2f4f7');
  const basic = () => props().demo === 'basic';
  const sceneKey = createMemo(() => `${rerenderKey()}-${props().demo}`);
  const motion = createMemo<Motion>(() => {
    const s = settings();
    return {
      direction: s.direction,
      duration: s.duration,
      bounce: s.bounce,
      stagger: s.stagger,
      fade: s.fade,
      motionBlur: s.motionBlur,
      intro: s.intro
    };
  });

  const computedProps = createMemo(() => {
    const format = FORMATS[props().formatName];
    const textColor = props().textColor;
    return {
      ...(format ? { format } : {}),
      ...(textColor ? { textColor } : {})
    };
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'textColor', 'formatName']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={sceneKey()}>
              {() => (
                <div class="cd-scene" data-theme={theme()}>
                  <Switch>
                    <Match when={props().demo === 'countdown'}>
                      <CountdownScene motion={motion()} color={props().textColor} />
                    </Match>
                    <Match when={props().demo === 'pricing'}>
                      <PricingScene motion={motion()} color={props().textColor} />
                    </Match>
                    <Match when={props().demo === 'dashboard'}>
                      <DashboardScene motion={motion()} color={props().textColor} />
                    </Match>
                    <Match when={basic()}>
                      <BasicScene
                        settings={settings()}
                        formatName={props().formatName}
                        color={props().textColor}
                        onValue={value => updateProp('value', value)}
                      />
                    </Match>
                  </Switch>
                </div>
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewColorPickerCustom
              title="Text Color"
              color={props().textColor || ink()}
              onChange={value => updateProp('textColor', value)}
            />
            <PreviewSelect
              title="Format"
              options={FORMAT_OPTIONS}
              value={props().formatName}
              isDisabled={!basic()}
              onChange={value => updateProp('formatName', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().direction}
              onChange={value => updateProp('direction', value)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={2}
              step={0.05}
              value={settings().duration}
              valueUnit="s"
              onChange={value => updateProp('duration', value)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.6}
              step={0.05}
              value={settings().bounce}
              onChange={value => updateProp('bounce', value)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.15}
              step={0.01}
              value={settings().stagger}
              valueUnit="s"
              onChange={value => updateProp('stagger', value)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={0.6}
              step={0.05}
              value={settings().fade}
              valueUnit="em"
              isDisabled={props().demo === 'countdown'}
              onChange={value => updateProp('fade', value)}
            />
            <PreviewSlider
              title="Value"
              min={0}
              max={99999}
              step={1}
              value={settings().value}
              isDisabled={!basic()}
              onChange={value => updateProp('value', value)}
            />
            <PreviewSlider
              title="Font Size"
              min={24}
              max={160}
              step={1}
              value={settings().fontSize}
              valueUnit="px"
              isDisabled={!basic()}
              onChange={value => updateProp('fontSize', value)}
            />
            <PreviewSlider
              title="Font Weight"
              min={300}
              max={900}
              step={100}
              value={settings().fontWeight}
              isDisabled={!basic()}
              onChange={value => updateProp('fontWeight', value)}
            />
            <PreviewSlider
              title="Gap"
              min={0}
              max={24}
              step={1}
              value={settings().gap}
              valueUnit="px"
              isDisabled={!basic()}
              onChange={value => updateProp('gap', value)}
            />
            <PreviewSlider
              title="Decimals"
              min={0}
              max={3}
              step={1}
              value={settings().decimals}
              isDisabled={!basic()}
              onChange={value => updateProp('decimals', value)}
            />
            <PreviewSlider
              title="Min Digits"
              min={1}
              max={8}
              step={1}
              value={settings().minDigits}
              isDisabled={!basic()}
              onChange={value => updateProp('minDigits', value)}
            />
            <PreviewSwitch
              title="Motion Blur"
              isChecked={settings().motionBlur}
              onChange={value => updateProp('motionBlur', value)}
            />
            <PreviewSwitch title="Intro" isChecked={settings().intro} onChange={value => updateProp('intro', value)} />
            <PreviewSwitch
              title="Tabular"
              isChecked={settings().tabular}
              isDisabled={!basic()}
              onChange={value => updateProp('tabular', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={counter} componentName="Counter" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
