import { createMemo } from 'solid-js';
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
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';
import { addToast } from '@/hooks/useToast';

import SplitText, { type SplitTextProps } from '@/content/TextAnimations/SplitText/SplitText';
import { splitText } from '@/constants/code/TextAnimations/splitTextCode';

const LOOK = {
  effect: 'rise',
  splitType: 'chars',
  ease: '',
  delay: 50,
  duration: 1.25,
  staggerFrom: 'start',
  trigger: 'view',
  hoverEffect: 'lift',
  loop: false,
  loopDelay: 1.5,
  mask: false,
  color: '',
  accentColor: ''
};

const PRESETS: Record<string, typeof LOOK> = {
  rise: { ...LOOK },
  flip: {
    ...LOOK,
    effect: 'flip',
    delay: 45,
    duration: 1.1,
    trigger: 'hover',
    hoverEffect: 'none',
    accentColor: '#ff5a36'
  },
  blur: {
    ...LOOK,
    effect: 'blur',
    splitType: 'words',
    delay: 160,
    duration: 1.6,
    staggerFrom: 'center',
    hoverEffect: 'none',
    loop: true,
    loopDelay: 1.4
  },
  wave: { ...LOOK, effect: 'wave', delay: 45, duration: 1.4, trigger: 'click', hoverEffect: 'wave' }
};

const DEFAULT_PROPS = {
  preset: 'rise',
  text: 'Hello, you!',
  ...LOOK,
  showCallback: true
};

const PRESET_OPTIONS = [
  { value: 'rise', label: 'Rise' },
  { value: 'flip', label: 'Flip' },
  { value: 'blur', label: 'Blur' },
  { value: 'wave', label: 'Wave' }
];

const EFFECT_OPTIONS = [
  { value: 'rise', label: 'Rise' },
  { value: 'fade', label: 'Fade' },
  { value: 'blur', label: 'Blur' },
  { value: 'flip', label: 'Flip' },
  { value: 'pop', label: 'Pop' },
  { value: 'skew', label: 'Skew' },
  { value: 'wave', label: 'Wave' }
];

const SPLIT_OPTIONS = [
  { value: 'chars', label: 'Chars' },
  { value: 'words', label: 'Words' },
  { value: 'lines', label: 'Lines' }
];

const TRIGGER_OPTIONS = [
  { value: 'view', label: 'In view' },
  { value: 'load', label: 'Load' },
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const HOVER_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'lift', label: 'Lift' },
  { value: 'wave', label: 'Wave' }
];

const EASE_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'power3.out', label: 'Power out' },
  { value: 'expo.out', label: 'Expo out' },
  { value: 'back.out(2)', label: 'Back out' },
  { value: 'bounce.out', label: 'Bounce' },
  { value: 'elastic.out(1, 0.3)', label: 'Elastic' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
  { value: 'edges', label: 'Edges' },
  { value: 'random', label: 'Random' }
];

const propData: PropRow[] = [
  {
    name: 'tag',
    type: 'string',
    default: '"p"',
    description: 'HTML tag to render: "h1", "h2", "h3", "h4", "h5", "h6", "p" or "span".'
  },
  { name: 'text', type: 'string', default: '""', description: 'The text content to animate.' },
  {
    name: 'className',
    type: 'string',
    default: '""',
    description: 'Additional class names to style the component.'
  },
  {
    name: 'effect',
    type: '"rise" | "fade" | "blur" | "flip" | "pop" | "skew" | "wave"',
    default: '"rise"',
    description:
      'Reveal style. Rise slides pieces up, fade dissolves them in, blur pulls them into focus, flip swings them up in 3D, pop scales them in with a soft overshoot, skew slides them in leaning and wave lets a crest travel across. Ignored when from or to is set.'
  },
  {
    name: 'trigger',
    type: '"view" | "load" | "hover" | "click"',
    default: '"view"',
    description:
      'When the reveal plays. View waits until the text scrolls into view, load plays right away, hover and click play it in view and replay it on every hover or click.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'Animates the pieces out and back in again, over and over.'
  },
  {
    name: 'loopDelay',
    type: 'number',
    default: '1.5',
    description: 'Pause in seconds between the end of a reveal and the next loop.'
  },
  {
    name: 'hoverEffect',
    type: '"none" | "lift" | "wave"',
    default: '"none"',
    description:
      'Interaction after the reveal. Lift raises the pieces near the cursor with a soft falloff, wave sends a ripple through the text from where the cursor enters.'
  },
  {
    name: 'color',
    type: 'string',
    default: 'undefined',
    description: 'Text color. Follows the surrounding text color when not set.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: 'undefined',
    description: 'Color each piece passes through while it reveals before settling on the text color.'
  },
  {
    name: 'delay',
    type: 'number',
    default: '50',
    description: 'Delay between animations for each letter (in ms).'
  },
  {
    name: 'duration',
    type: 'number',
    default: '1.25',
    description: 'Duration of each letter animation (in seconds).'
  },
  {
    name: 'ease',
    type: 'string | function',
    default: 'undefined',
    description: 'GSAP easing for the reveal. Each effect brings its own ease when not set.'
  },
  {
    name: 'splitType',
    type: 'string',
    default: '"chars"',
    description: 'Split type: "chars", "words", "lines", or "words, chars".'
  },
  {
    name: 'staggerFrom',
    type: '"start" | "center" | "end" | "edges" | "random"',
    default: '"start"',
    description: 'Where the stagger starts, so pieces can ripple out from the middle, the ends or in random order.'
  },
  {
    name: 'mask',
    type: 'boolean',
    default: 'false',
    description: 'Clips each piece to its own box so it slides out from behind an edge instead of floating in.'
  },
  {
    name: 'from',
    type: 'object',
    default: 'undefined',
    description:
      'Custom starting GSAP properties for each piece, replacing the effect. Defaults to { opacity: 0, y: 40 }.'
  },
  {
    name: 'to',
    type: 'object',
    default: 'undefined',
    description: 'Custom target GSAP properties for each piece, replacing the effect. Defaults to { opacity: 1, y: 0 }.'
  },
  {
    name: 'threshold',
    type: 'number',
    default: '0.1',
    description: 'Intersection threshold to trigger the animation (0-1).'
  },
  { name: 'rootMargin', type: 'string', default: '"-100px"', description: 'Root margin for the ScrollTrigger.' },
  {
    name: 'textAlign',
    type: 'string',
    default: '"center"',
    description: "Text alignment: 'left', 'center', 'right', etc."
  },
  {
    name: 'onLetterAnimationComplete',
    type: 'function',
    default: 'undefined',
    description: 'Callback function when the first reveal completes.'
  }
];

export default function SplitTextDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const {
      preset: _preset,
      showCallback: _showCallback,
      ease: _ease,
      color: _color,
      accentColor: _accentColor,
      ...rest
    } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');

  const updateAndReplay = <K extends keyof typeof DEFAULT_PROPS>(name: K, value: (typeof DEFAULT_PROPS)[K]) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = createMemo(() => {
    const { ease, color, accentColor } = props();
    return {
      ...(ease ? { ease } : {}),
      ...(color ? { color } : {}),
      ...(accentColor ? { accentColor } : {})
    };
  });

  const finished = () => addToast({ severity: 'secondary', summary: '✅ Animation Finished!', life: 3000 });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'showCallback', 'ease', 'color', 'accentColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', 'min-height': '400px', overflow: 'hidden' }}>
            <RefreshButton onClick={forceRerender} />
            <Keyed token={rerenderKey()}>
              {() => (
                <SplitText
                  {...(settings() as SplitTextProps)}
                  ease={props().ease || undefined}
                  color={props().color || undefined}
                  accentColor={props().accentColor || undefined}
                  className="split-text-demo"
                  onLetterAnimationComplete={props().showCallback ? finished : undefined}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />

            <PreviewColorPickerCustom
              title="Color"
              color={props().color || ink()}
              onChange={v => updateAndReplay('color', v)}
            />

            <PreviewColorPickerCustom
              title="Accent"
              color={props().accentColor || ink()}
              onChange={v => updateAndReplay('accentColor', v)}
            />

            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings().effect}
              onChange={v => updateAndReplay('effect', v)}
            />

            <PreviewSelect
              title="Split Type"
              options={SPLIT_OPTIONS}
              value={settings().splitType}
              onChange={v => updateAndReplay('splitType', v)}
            />

            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={settings().trigger}
              onChange={v => updateAndReplay('trigger', v)}
            />

            <PreviewSelect
              title="Hover Effect"
              options={HOVER_OPTIONS}
              value={settings().hoverEffect}
              onChange={v => updateAndReplay('hoverEffect', v)}
            />

            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={props().ease}
              onChange={v => updateAndReplay('ease', v)}
            />

            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings().staggerFrom}
              onChange={v => updateAndReplay('staggerFrom', v)}
            />

            <PreviewSlider
              title="Stagger Delay"
              min={10}
              max={500}
              step={5}
              value={settings().delay}
              valueUnit="ms"
              onChange={v => updateAndReplay('delay', v)}
            />

            <PreviewSlider
              title="Duration"
              min={0.1}
              max={3}
              step={0.05}
              value={settings().duration}
              valueUnit="s"
              onChange={v => updateAndReplay('duration', v)}
            />

            <PreviewSlider
              title="Loop Delay"
              min={0}
              max={5}
              step={0.1}
              value={settings().loopDelay}
              valueUnit="s"
              isDisabled={!settings().loop}
              onChange={v => updateAndReplay('loopDelay', v)}
            />

            <PreviewSwitch title="Loop" isChecked={settings().loop} onChange={v => updateAndReplay('loop', v)} />

            <PreviewSwitch title="Mask" isChecked={settings().mask} onChange={v => updateAndReplay('mask', v)} />

            <PreviewSwitch
              title="Show Completion Toast"
              isChecked={props().showCallback}
              onChange={v => updateAndReplay('showCallback', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={splitText} componentName="SplitText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
