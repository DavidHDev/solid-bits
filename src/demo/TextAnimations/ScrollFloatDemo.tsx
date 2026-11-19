import { createMemo, createSignal, onSettled } from 'solid-js';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import ScrollFloat, { type ScrollFloatProps } from '@/content/TextAnimations/ScrollFloat/ScrollFloat';
import { scrollFloat } from '@/constants/code/TextAnimations/scrollFloatCode';

const LOOK = {
  colorShift: false,
  shiftColor: '#ff6b3d',
  effect: 'float',
  splitBy: 'chars',
  direction: 'up',
  order: 'start',
  ease: 'back.inOut(2)',
  animationDuration: 1,
  stagger: 0.03,
  smoothing: 0,
  distance: 120,
  stretch: 2.3
};

const PRESETS: Record<string, typeof LOOK> = {
  float: { ...LOOK },
  flip: {
    ...LOOK,
    effect: 'flip',
    direction: 'down',
    order: 'center',
    stagger: 0.12,
    smoothing: 0.4,
    distance: 140
  },
  scatter: {
    ...LOOK,
    colorShift: true,
    effect: 'scatter',
    order: 'random',
    ease: 'sine.inOut',
    stagger: 0.09,
    smoothing: 0.5,
    distance: 170
  },
  wave: {
    ...LOOK,
    colorShift: true,
    shiftColor: '#3d95ff',
    effect: 'wave',
    ease: 'none',
    animationDuration: 1.6,
    stagger: 0.11,
    smoothing: 0.3,
    distance: 130,
    stretch: 1.4
  }
};

const DEFAULT_PROPS = {
  preset: 'float',
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'float', label: 'Float' },
  { value: 'flip', label: 'Flip' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'wave', label: 'Wave' }
];

const EFFECT_OPTIONS = [
  { value: 'float', label: 'Float' },
  { value: 'flip', label: 'Flip' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'blur', label: 'Blur' },
  { value: 'wave', label: 'Wave' }
];

const SPLIT_OPTIONS = [
  { value: 'chars', label: 'Letters' },
  { value: 'words', label: 'Words' }
];

const DIRECTION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const ORDER_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
  { value: 'center', label: 'Center' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const EASE_OPTIONS = [
  { value: 'back.inOut(2)', label: 'Overshoot' },
  { value: 'elastic.out(1, 0.45)', label: 'Elastic' },
  { value: 'power3.out', label: 'Glide' },
  { value: 'sine.inOut', label: 'Smooth' },
  { value: 'expo.out', label: 'Expo' },
  { value: 'none', label: 'Linear' }
];

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'The text to animate. Plain text is split into letters or words, anything else moves in as one piece.'
  },
  {
    name: 'scrollContainerRef',
    type: 'HTMLElement | null',
    default: 'window',
    description: 'The element that scrolls. Leave it out to use the page. Pass null to wait until the element exists.'
  },
  {
    name: 'effect',
    type: "'float' | 'flip' | 'scatter' | 'blur' | 'wave'",
    default: "'float'",
    description:
      'How the pieces arrive. Float stretches them up out of a slot, flip rolls them in on a drum, scatter assembles them from random spots, blur pulls them into focus and wave makes them swell in on a rolling wave.'
  },
  {
    name: 'splitBy',
    type: "'chars' | 'words'",
    default: "'chars'",
    description: 'Animate each letter on its own or each word as one piece.'
  },
  {
    name: 'direction',
    type: "'up' | 'down'",
    default: "'up'",
    description: 'Whether the pieces come in from below or from above.'
  },
  {
    name: 'order',
    type: "'start' | 'end' | 'center' | 'edges' | 'random'",
    default: "'start'",
    description: 'Which pieces go first. The order is fixed, so random looks the same on every visit.'
  },
  {
    name: 'fromColor',
    type: 'string',
    default: "'currentColor'",
    description:
      'Color the pieces start in before they settle into the text color. Keep currentColor for no color change.'
  },
  {
    name: 'animationDuration',
    type: 'number',
    default: '1',
    description: "Length of each piece's move compared to the stagger. Higher values move the pieces more together."
  },
  {
    name: 'ease',
    type: 'string',
    default: "'back.inOut(2)'",
    description: "Any GSAP ease, such as 'power3.out', 'elastic.out(1, 0.45)' or 'none'."
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.03',
    description: 'Delay between pieces. Higher values make the text form one piece at a time.'
  },
  {
    name: 'distance',
    type: 'number',
    default: '120',
    description:
      'How far the pieces travel, as a percentage of their height. For flip it sets the size of the drum they roll around, for scatter how widely they start apart.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '2.3',
    description: 'How tall the pieces are stretched while they rise in the float and wave effects. 1 keeps their shape.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0',
    description: 'Seconds the pieces take to catch up with the scroll. 0 ties them to it directly.'
  },
  {
    name: 'scrollStart',
    type: 'string',
    default: "'center bottom+=50%'",
    description: 'Scroll position where the animation starts, in ScrollTrigger syntax.'
  },
  {
    name: 'scrollEnd',
    type: 'string',
    default: "'bottom bottom-=40%'",
    description: 'Scroll position where the pieces settle. Text near the end of the page still settles fully.'
  },
  { name: 'containerClassName', type: 'string', default: "''", description: 'Extra class names for the heading.' },
  { name: 'textClassName', type: 'string', default: "''", description: 'Extra class names for the text.' }
];

const TAU = 0.055;

const smoothScroll = (scroller: HTMLElement) => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  let target = scroller.scrollTop;
  let middle = target;
  let current = target;
  let written = target;
  let raf = 0;
  let last = 0;

  const sync = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    target = middle = current = written = scroller.scrollTop;
  };

  const step = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    const blend = 1 - Math.exp(-dt / TAU);
    middle += (target - middle) * blend;
    current += (middle - current) * blend;
    if (Math.abs(target - current) < 0.3 && Math.abs(target - middle) < 0.3) {
      current = middle = target;
      raf = 0;
      last = 0;
    } else {
      raf = requestAnimationFrame(step);
    }
    written = current;
    scroller.scrollTop = current;
  };

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    if (!raf && Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    if (!event.cancelable) {
      sync();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
    const delta = event.deltaY * unit;
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight - 1);
    if (!raf) target = middle = current = written = scroller.scrollTop;
    if (!raf && ((delta < 0 && target <= 1) || (delta > 0 && target >= max - 1))) return;
    event.preventDefault();
    target = Math.min(max, Math.max(0, target + delta));
    if (!raf && Math.abs(target - current) >= 0.3) raf = requestAnimationFrame(step);
  };

  const onScroll = () => {
    if (raf && Math.abs(scroller.scrollTop - written) < 2) return;
    sync();
  };

  scroller.addEventListener('wheel', onWheel, { passive: false });
  scroller.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    scroller.removeEventListener('wheel', onWheel);
    scroller.removeEventListener('scroll', onScroll);
  };
};

export default function ScrollFloatDemo() {
  let containerEl: HTMLDivElement | undefined;
  let hintEl: HTMLDivElement | undefined;
  const [scroller, setScroller] = createSignal<HTMLElement | null>(null);
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, colorShift: _colorShift, shiftColor: _shiftColor, ...rest } = props();
    return rest;
  });
  const fromColor = createMemo(() => (props().colorShift ? props().shiftColor : 'currentColor'));
  const computedProps = createMemo(() => ({ fromColor: fromColor() }));

  onSettled(() => {
    const el = containerEl;
    if (!el) return;
    setScroller(el);
    return smoothScroll(el);
  });

  const fadeHint = (event: Event & { currentTarget: HTMLDivElement }) => {
    const hint = hintEl;
    if (!hint) return;
    const t = Math.min(1, event.currentTarget.scrollTop / 160);
    hint.style.opacity = String(1 - t * t * (3 - 2 * t));
  };

  const replay = () => containerEl?.scrollTo({ top: 0, behavior: 'smooth' });

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    replay();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'colorShift', 'shiftColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            ref={el => (containerEl = el)}
            class="demo-container"
            style={{
              height: '400px',
              'max-height': '400px',
              'overflow-y': 'scroll',
              'overflow-x': 'hidden',
              position: 'relative',
              display: 'block'
            }}
            onScroll={fadeHint}
          >
            <div
              ref={el => (hintEl = el)}
              class="demo-scroll-hint"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '400px',
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'justify-content': 'center',
                gap: '6px',
                'pointer-events': 'none'
              }}
            >
              <p style={{ 'font-size': '13px', 'font-weight': 500, margin: 0 }}>Scroll down in this box</p>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={1.8} />
            </div>
            <div style={{ position: 'relative', padding: '760px 3rem 520px' }}>
              <ScrollFloat
                {...(settings() as Omit<ScrollFloatProps, 'children'>)}
                fromColor={fromColor()}
                scrollContainerRef={scroller()}
              >
                Solid Bits
              </ScrollFloat>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Start Color"
              color={props().shiftColor}
              onChange={v => updateProps({ shiftColor: v, colorShift: true })}
            />
            <PreviewSwitch
              title="Color Shift"
              isChecked={props().colorShift}
              onChange={v => updateProp('colorShift', v)}
            />

            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings().effect}
              onChange={v => updateProp('effect', v)}
            />
            <PreviewSelect
              title="Split"
              options={SPLIT_OPTIONS}
              value={settings().splitBy}
              onChange={v => updateProp('splitBy', v)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().direction}
              onChange={v => updateProp('direction', v)}
            />
            <PreviewSelect
              title="Order"
              options={ORDER_OPTIONS}
              value={settings().order}
              onChange={v => updateProp('order', v)}
            />
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={settings().ease}
              onChange={v => updateProp('ease', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0.01}
              max={0.2}
              step={0.01}
              value={settings().stagger}
              valueUnit="s"
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={3}
              step={0.1}
              value={settings().animationDuration}
              valueUnit="s"
              onChange={v => updateProp('animationDuration', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={2}
              step={0.1}
              value={settings().smoothing}
              valueUnit="s"
              onChange={v => updateProp('smoothing', v)}
            />

            <PreviewSlider
              title="Distance"
              min={0}
              max={300}
              step={10}
              value={settings().distance}
              valueUnit="%"
              onChange={v => updateProp('distance', v)}
            />
            <PreviewSlider
              title="Stretch"
              min={1}
              max={4}
              step={0.1}
              value={settings().stretch}
              isDisabled={settings().effect !== 'float' && settings().effect !== 'wave'}
              onChange={v => updateProp('stretch', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollFloat} componentName="ScrollFloat" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
