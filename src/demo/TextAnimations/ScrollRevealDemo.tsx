import { Show, createMemo, createSignal, onSettled } from 'solid-js';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
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
import RefreshButton from '@/components/common/RefreshButton';
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

import ScrollReveal, { type ScrollRevealProps } from '@/content/TextAnimations/ScrollReveal/ScrollReveal';
import { scrollReveal } from '@/constants/code/TextAnimations/scrollRevealCode';

const LOOK = {
  highlight: false,
  highlightColor: '#ff5a1f',
  mode: 'scrub',
  splitBy: 'words',
  effect: 'fade',
  stagger: 0.05,
  duration: 0.8,
  smoothing: 0,
  baseOpacity: 0.1,
  baseRotation: 3,
  baseOffset: 0,
  enableBlur: true,
  blurStrength: 4
};

const PRESETS: Record<string, typeof LOOK> = {
  reveal: { ...LOOK },
  highlight: { ...LOOK, highlight: true, stagger: 0.2, baseOpacity: 0.15, baseRotation: 0, enableBlur: false },
  rise: {
    ...LOOK,
    mode: 'enter',
    splitBy: 'lines',
    effect: 'rise',
    stagger: 0.12,
    duration: 0.9,
    baseOpacity: 0,
    baseRotation: 0,
    enableBlur: false
  },
  flip: {
    ...LOOK,
    splitBy: 'chars',
    effect: 'flip',
    stagger: 0.012,
    smoothing: 0.3,
    baseOpacity: 0,
    baseRotation: 0,
    enableBlur: false
  }
};

const DEFAULT_PROPS = {
  preset: 'reveal',
  ...LOOK
};

const PRESET_OPTIONS = [
  { value: 'reveal', label: 'Reveal' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'rise', label: 'Rise' },
  { value: 'flip', label: 'Flip' }
];

const MODE_OPTIONS = [
  { value: 'scrub', label: 'Scrub' },
  { value: 'enter', label: 'Enter' }
];

const SPLIT_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'chars', label: 'Chars' },
  { value: 'lines', label: 'Lines' }
];

const EFFECT_OPTIONS = [
  { value: 'fade', label: 'Fade' },
  { value: 'rise', label: 'Rise' },
  { value: 'flip', label: 'Flip' },
  { value: 'scale', label: 'Scale' }
];

const propData: PropRow[] = [
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description:
      'The text to reveal. Plain text is split into words, characters or lines, anything else is revealed as one piece.'
  },
  {
    name: 'scrollContainerRef',
    type: 'HTMLElement | null',
    default: 'window',
    description:
      'The element that scrolls. Leave it out to use the page. Pass null while the element is not mounted yet to wait for it.'
  },
  {
    name: 'highlightColor',
    type: 'string',
    default: "''",
    description:
      'Accent each word lights up to while it is being revealed, before it settles to the text color. Leave empty for no highlight.'
  },
  {
    name: 'mode',
    type: "'scrub' | 'enter'",
    default: "'scrub'",
    description:
      "'scrub' ties the reveal to the scroll position, 'enter' plays it once when the text scrolls into view."
  },
  {
    name: 'splitBy',
    type: "'words' | 'chars' | 'lines'",
    default: "'words'",
    description:
      "What each step of the reveal is. 'lines' groups the words of each rendered line and regroups on resize."
  },
  {
    name: 'effect',
    type: "'fade' | 'rise' | 'flip' | 'scale'",
    default: "'fade'",
    description:
      "How each piece appears. 'fade' brightens in place, 'rise' slides up from behind its own baseline, 'flip' stands up from flat and 'scale' pops up from small."
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.05',
    description:
      'Spacing between pieces. Higher values reveal them one at a time instead of in a soft wave. In enter mode it is in seconds.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '0.8',
    description: "Seconds each piece takes to appear when mode is 'enter'."
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0',
    description: 'Seconds the reveal takes to catch up with the scroll. 0 ties it to the scroll directly.'
  },
  {
    name: 'enableBlur',
    type: 'boolean',
    default: 'true',
    description: 'Starts each piece out of focus and sharpens it as it appears.'
  },
  {
    name: 'blurStrength',
    type: 'number',
    default: '4',
    description: 'How blurred the pieces start, in px.'
  },
  {
    name: 'baseOpacity',
    type: 'number',
    default: '0.1',
    description: 'Opacity of the pieces before they are revealed, from 0 to 1.'
  },
  {
    name: 'baseRotation',
    type: 'number',
    default: '3',
    description: 'Tilt of the whole block before it levels out, in degrees. 0 keeps it level.'
  },
  {
    name: 'baseOffset',
    type: 'number',
    default: '0',
    description: 'How far below its place each piece starts, in px. Pieces rise into place as they appear.'
  },
  {
    name: 'rotationEnd',
    type: 'string',
    default: "'bottom bottom'",
    description: 'Scroll position where the block finishes leveling out in scrub mode, in ScrollTrigger syntax.'
  },
  {
    name: 'wordAnimationEnd',
    type: 'string',
    default: "'bottom bottom'",
    description:
      'Scroll position where every piece is fully revealed in scrub mode. Text near the end of the page still finishes.'
  },
  {
    name: 'containerClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the heading.'
  },
  {
    name: 'textClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the text.'
  }
];

export default function ScrollRevealDemo() {
  let containerEl: HTMLDivElement | undefined;
  let hintEl: HTMLDivElement | undefined;
  const [scroller, setScroller] = createSignal<HTMLElement | null>(null);
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, highlight: _highlight, highlightColor: _highlightColor, ...rest } = props();
    return rest;
  });

  useSmoothScroll(scroller, () => true);

  onSettled(() => {
    setScroller(containerEl ?? null);
  });

  const fadeHint = (event: Event & { currentTarget: HTMLDivElement }) => {
    const hint = hintEl;
    if (!hint) return;
    const t = Math.min(1, event.currentTarget.scrollTop / 160);
    hint.style.opacity = String(1 - t * t * (3 - 2 * t));
  };

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = createMemo(() => ({
    highlightColor: props().highlight ? props().highlightColor : undefined
  }));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'highlight']}
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
            <Show when={settings().mode === 'enter'}>
              <RefreshButton onClick={forceRerender} />
            </Show>
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
            <div style={{ position: 'relative', padding: '640px 3rem 480px' }}>
              <Keyed token={rerenderKey()}>
                {() => (
                  <ScrollReveal
                    {...(settings() as Omit<ScrollRevealProps, 'children'>)}
                    highlightColor={props().highlight ? props().highlightColor : ''}
                    scrollContainerRef={scroller()}
                  >
                    When does a man die? When he is hit by a bullet? No! When he suffers a disease? No! When he ate a
                    soup made out of a poisonous mushroom? No! A man dies when he is forgotten!
                  </ScrollReveal>
                )}
              </Keyed>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSwitch title="Highlight" isChecked={props().highlight} onChange={v => updateProp('highlight', v)} />
            <PreviewColorPickerCustom
              title="Highlight Color"
              color={props().highlightColor}
              onChange={v => updateProps({ highlightColor: v, highlight: true })}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings().mode}
              onChange={v => updateProp('mode', v)}
            />
            <PreviewSelect
              title="Split By"
              options={SPLIT_OPTIONS}
              value={settings().splitBy}
              onChange={v => updateProp('splitBy', v)}
            />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings().effect}
              onChange={v => updateProp('effect', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.5}
              step={0.005}
              value={settings().stagger}
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Duration"
              min={0.2}
              max={2}
              step={0.05}
              value={settings().duration}
              valueUnit="s"
              isDisabled={settings().mode !== 'enter'}
              onChange={v => updateProp('duration', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={2}
              step={0.1}
              value={settings().smoothing}
              valueUnit="s"
              isDisabled={settings().mode !== 'scrub'}
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSlider
              title="Starting Opacity"
              min={0}
              max={1}
              step={0.05}
              value={settings().baseOpacity}
              onChange={v => updateProp('baseOpacity', v)}
            />
            <PreviewSlider
              title="Starting Rotation"
              min={0}
              max={10}
              step={1}
              value={settings().baseRotation}
              valueUnit="°"
              onChange={v => updateProp('baseRotation', v)}
            />
            <PreviewSlider
              title="Starting Offset"
              min={0}
              max={60}
              step={1}
              value={settings().baseOffset}
              valueUnit="px"
              onChange={v => updateProp('baseOffset', v)}
            />
            <PreviewSlider
              title="Blur Strength"
              min={0}
              max={20}
              step={1}
              value={settings().blurStrength}
              valueUnit="px"
              isDisabled={!settings().enableBlur}
              onChange={v => updateProp('blurStrength', v)}
            />
            <PreviewSwitch
              title="Enable Blur"
              isChecked={settings().enableBlur}
              onChange={v => updateProp('enableBlur', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollReveal} componentName="ScrollReveal" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
