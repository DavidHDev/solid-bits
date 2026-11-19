import { createMemo } from 'solid-js';
import { BridgeIcon, CloudIcon, Moon02Icon, PlantIcon, StarsIcon, SunsetIcon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon, { type IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { colorMode } from '@/hooks/useTheme';

import CardSwap, { type CardSwapItem, type CardSwapProps } from '@/content/Components/CardSwap/CardSwap';
import { cardSwap } from '@/constants/code/Components/cardSwapCode';

const icon = (glyph: IconSvgElement) => <HugeiconsIcon icon={glyph} size={14} strokeWidth={1.8} />;
const CLOUDS = 'https://images.unsplash.com/photo-1778849097774-0ab2a873a858?w=900&q=80&auto=format&fit=crop';

const buildItems = (theme: 'dark' | 'light'): CardSwapItem[] =>
  theme === 'dark'
    ? [
        { title: 'Blue hour', image: '/assets/demo/night-sky.webp', icon: icon(StarsIcon) },
        { title: 'Moonrise', image: '/assets/demo/night-landscape.webp', icon: icon(Moon02Icon) },
        { title: 'Dusk', image: '/assets/demo/night-portrait.webp', icon: icon(BridgeIcon) },
        { title: 'Pink drift', image: CLOUDS, icon: icon(CloudIcon) }
      ]
    : [
        { title: 'Golden hour', image: '/assets/demo/day-sky.webp', icon: icon(SunsetIcon) },
        { title: 'Canola field', image: '/assets/demo/day-landscape.webp', icon: icon(PlantIcon) },
        { title: 'The pier', image: '/assets/demo/day-portrait.webp', icon: icon(BridgeIcon) },
        { title: 'Pink drift', image: CLOUDS, icon: icon(CloudIcon) }
      ];

const LOOK = {
  cardDistance: 60,
  verticalDistance: 70,
  depth: 90,
  skewAmount: 6,
  visibleCards: 4,
  cardRadius: 18
};

const DEFAULT_PROPS = {
  preset: 'stack',
  ...LOOK,
  delay: 4000,
  speed: 1,
  bounce: 0.35,
  parallax: 0.5,
  hoverSpread: 0.12,
  dim: 0.5,
  autoplay: true,
  pauseOnHover: true,
  draggable: true
};

type DemoProps = typeof DEFAULT_PROPS;

const PRESETS: Record<string, Partial<DemoProps>> = {
  stack: LOOK,
  flat: { ...LOOK, skewAmount: 0, cardDistance: 50, verticalDistance: 46, depth: 80 },
  tower: { ...LOOK, skewAmount: 0, cardDistance: 0, verticalDistance: 56, depth: 100 },
  fan: { ...LOOK, cardDistance: 96, verticalDistance: 26, depth: 70, skewAmount: 10 },
  calm: { ...LOOK, speed: 0.6, bounce: 0, delay: 6000, hoverSpread: 0 }
};

const PRESET_OPTIONS = [
  { value: 'stack', label: 'Stack' },
  { value: 'flat', label: 'Flat' },
  { value: 'tower', label: 'Tower' },
  { value: 'fan', label: 'Fan' },
  { value: 'calm', label: 'Calm' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'CardSwapItem[]',
    default: 'Sample cards',
    description: 'Cards to show when no children are passed. Each item takes title, image, icon and alt.'
  },
  {
    name: 'children',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Your own cards. Wrap each one in the exported Card to get the matching tile style.'
  },
  { name: 'width', type: 'number', default: '460', description: 'Width of each card, in px.' },
  { name: 'height', type: 'number', default: '340', description: 'Height of each card, in px.' },
  { name: 'cardDistance', type: 'number', default: '60', description: 'Horizontal step between stacked cards, in px.' },
  {
    name: 'verticalDistance',
    type: 'number',
    default: '70',
    description: 'Vertical step between stacked cards, in px.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '90',
    description: 'How far back each card sits, in px. More depth makes the cards behind smaller.'
  },
  { name: 'skewAmount', type: 'number', default: '6', description: 'Slant of the cards, in degrees.' },
  {
    name: 'visibleCards',
    type: 'number',
    default: '4',
    description: 'How many cards show in the stack. Extra cards wait hidden at the back.'
  },
  { name: 'delay', type: 'number', default: '4000', description: 'Time between swaps, in ms.' },
  { name: 'autoplay', type: 'boolean', default: 'true', description: 'Sends the front card to the back on a timer.' },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Pauses the timer while the cursor is over a card.'
  },
  {
    name: 'draggable',
    type: 'boolean',
    default: 'true',
    description: 'Lets people drag or fling the front card to send it to the back.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the swap animation.' },
  {
    name: 'bounce',
    type: 'number',
    default: '0.35',
    description: 'How much the cards overshoot as they settle, from 0 to 1.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '0.5',
    description: 'How much the stack shifts in depth as the cursor moves, from 0 to 1.'
  },
  { name: 'hoverSpread', type: 'number', default: '0.12', description: 'How much the stack fans out while hovered.' },
  { name: 'dim', type: 'number', default: '0.5', description: 'How much the cards behind fade back, from 0 to 1.' },
  { name: 'cardRadius', type: 'number', default: '18', description: 'Corner radius of the cards, in px.' },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Fans the cards out from the front one on mount.' },
  { name: 'theme', type: "'dark' | 'light'", default: "'dark'", description: 'Color theme of the cards.' },
  {
    name: 'onCardClick',
    type: '(index: number) => void',
    default: 'undefined',
    description: 'Called when a card is clicked. Clicking a card behind also brings it to the front.'
  },
  {
    name: 'onChange',
    type: '(index: number) => void',
    default: 'undefined',
    description: 'Called with the index of the new front card after each swap.'
  },
  {
    name: 'ref',
    type: '(handle: { next, prev }) => void',
    default: 'undefined',
    description: 'Receives next() and prev() to swap from your own controls.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' }
];

export default function CardSwapDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, ...rest } = props();
    return rest;
  });
  const theme = createMemo<'dark' | 'light'>(() => (colorMode() === 'light' ? 'light' : 'dark'));
  const items = createMemo(() => buildItems(theme()));

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(name => [name, defaultProps()[name as keyof DemoProps]])
    );
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={theme() === 'light' ? { theme: 'light' } : {}}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container h-[460px] md:h-[600px]"
            style={{ position: 'relative', padding: 0, overflow: 'hidden' }}
          >
            <Keyed token={rerenderKey()}>
              {() => <CardSwap items={items()} {...(settings() as CardSwapProps)} theme={theme()} />}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSlider
              title="Card Distance"
              min={0}
              max={120}
              step={2}
              value={settings().cardDistance}
              valueUnit="px"
              onChange={v => updateProp('cardDistance', v)}
            />
            <PreviewSlider
              title="Vertical Distance"
              min={0}
              max={120}
              step={2}
              value={settings().verticalDistance}
              valueUnit="px"
              onChange={v => updateProp('verticalDistance', v)}
            />
            <PreviewSlider
              title="Depth"
              min={0}
              max={200}
              step={5}
              value={settings().depth}
              valueUnit="px"
              onChange={v => updateProp('depth', v)}
            />
            <PreviewSlider
              title="Skew"
              min={-12}
              max={12}
              step={1}
              value={settings().skewAmount}
              valueUnit="°"
              onChange={v => updateProp('skewAmount', v)}
            />
            <PreviewSlider
              title="Visible Cards"
              min={1}
              max={4}
              step={1}
              value={settings().visibleCards}
              onChange={v => updateProp('visibleCards', v)}
            />
            <PreviewSlider
              title="Card Radius"
              min={0}
              max={32}
              step={1}
              value={settings().cardRadius}
              valueUnit="px"
              onChange={v => updateProp('cardRadius', v)}
            />
            <PreviewSlider
              title="Delay"
              min={1500}
              max={8000}
              step={250}
              value={settings().delay}
              valueUnit="ms"
              onChange={v => updateProp('delay', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.3}
              max={2}
              step={0.05}
              value={settings().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.05}
              value={settings().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={1}
              step={0.05}
              value={settings().parallax}
              onChange={v => updateProp('parallax', v)}
            />
            <PreviewSlider
              title="Hover Spread"
              min={0}
              max={0.4}
              step={0.01}
              value={settings().hoverSpread}
              onChange={v => updateProp('hoverSpread', v)}
            />
            <PreviewSlider
              title="Dim"
              min={0}
              max={1}
              step={0.05}
              value={settings().dim}
              onChange={v => updateProp('dim', v)}
            />
            <PreviewSwitch title="Autoplay" isChecked={settings().autoplay} onChange={v => updateProp('autoplay', v)} />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={settings().pauseOnHover}
              onChange={v => updateProp('pauseOnHover', v)}
            />
            <PreviewSwitch
              title="Draggable"
              isChecked={settings().draggable}
              onChange={v => updateProp('draggable', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cardSwap} componentName="CardSwap" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
