import { createEffect, createMemo, onSettled } from 'solid-js';
import { animate, type AnimationPlaybackControls } from 'motion';
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

import RotatingText, { type RotatingTextProps } from '@/content/TextAnimations/RotatingText/RotatingText';
import { rotatingText } from '@/constants/code/TextAnimations/rotatingTextCode';

import './RotatingTextDemo.css';

const WORDS = ['thinking', 'coding', 'components!'];

const LOOK = {
  highlightColor: '',
  effect: 'slide',
  direction: 'up',
  rotationInterval: 2000,
  staggerDuration: 0.025,
  staggerFrom: 'last',
  splitBy: 'characters',
  blur: 0,
  highlight: true
};

const PRESETS: Record<string, typeof LOOK> = {
  slide: { ...LOOK },
  flip: {
    ...LOOK,
    effect: 'flip',
    rotationInterval: 2200,
    staggerDuration: 0.035,
    staggerFrom: 'first',
    highlight: false
  },
  blur: {
    ...LOOK,
    effect: 'blur',
    direction: 'down',
    rotationInterval: 2400,
    staggerDuration: 0.03,
    staggerFrom: 'center',
    blur: 12,
    highlight: false
  },
  drop: {
    ...LOOK,
    highlightColor: '#15abfa',
    effect: 'drop',
    staggerDuration: 0.04,
    staggerFrom: 'first'
  }
};

const DEFAULT_PROPS = {
  preset: 'slide',
  ...LOOK,
  auto: true,
  loop: true,
  pauseOnHover: false
};

const PRESET_OPTIONS = [
  { value: 'slide', label: 'Slide' },
  { value: 'flip', label: 'Flip' },
  { value: 'blur', label: 'Blur' },
  { value: 'drop', label: 'Drop' }
];

const EFFECT_OPTIONS = [
  { value: 'slide', label: 'Slide' },
  { value: 'flip', label: 'Flip' },
  { value: 'blur', label: 'Blur' },
  { value: 'scale', label: 'Scale' },
  { value: 'drop', label: 'Drop' }
];

const DIRECTION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const STAGGER_FROM_OPTIONS = [
  { value: 'first', label: 'First' },
  { value: 'last', label: 'Last' },
  { value: 'center', label: 'Center' },
  { value: 'random', label: 'Random' }
];

const SPLIT_BY_OPTIONS = [
  { value: 'characters', label: 'Characters' },
  { value: 'words', label: 'Words' },
  { value: 'lines', label: 'Lines' }
];

const propData: PropRow[] = [
  {
    name: 'texts',
    type: 'string[]',
    default: '[]',
    description: 'The texts to rotate through.'
  },
  {
    name: 'effect',
    type: "'slide' | 'flip' | 'blur' | 'scale' | 'drop'",
    default: '"slide"',
    description:
      'How letters swap. Flip rolls them over like a drum, blur dissolves them, scale zooms through and drop lets them fall in with a small bounce.'
  },
  {
    name: 'direction',
    type: "'up' | 'down'",
    default: '"up"',
    description: 'Which way letters travel. Drop always falls from above.'
  },
  {
    name: 'highlight',
    type: 'boolean',
    default: 'false',
    description:
      'Puts the rotating text on a colored block that smoothly resizes to fit each new text, with a text color picked for contrast.'
  },
  {
    name: 'highlightColor',
    type: 'string',
    default: '"#6ec9f7"',
    description: 'Color of the highlight block. Hex or rgb colors also set a readable text color automatically.'
  },
  {
    name: 'rotationInterval',
    type: 'number',
    default: '2000',
    description: 'Time each text stays on screen, in milliseconds.'
  },
  {
    name: 'blur',
    type: 'number',
    default: '0',
    description: 'Blurs letters as they come and go, in px. The blur effect uses 10 when this is 0.'
  },
  {
    name: 'staggerDuration',
    type: 'number',
    default: '0',
    description: 'Delay between letters, in seconds.'
  },
  {
    name: 'staggerFrom',
    type: "'first' | 'last' | 'center' | 'random' | number",
    default: '"first"',
    description: 'Which letter moves first. A number starts from that letter, random shuffles the order.'
  },
  {
    name: 'splitBy',
    type: "'characters' | 'words' | 'lines' | string",
    default: '"characters"',
    description: 'How each text is split into moving pieces. Any other string is used as the separator.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'true',
    description: 'Goes back to the first text after the last one.'
  },
  {
    name: 'auto',
    type: 'boolean',
    default: 'true',
    description: 'Rotates on its own. Turn off to drive it with the ref methods.'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Holds the current text while the pointer is over it.'
  },
  {
    name: 'initial',
    type: 'object',
    default: '-',
    description: 'Overrides the state each letter enters from. Leave unset to use the effect.'
  },
  {
    name: 'animate',
    type: 'object',
    default: '-',
    description: 'Overrides the state each letter settles into.'
  },
  {
    name: 'exit',
    type: 'object',
    default: '-',
    description: 'Overrides the state each letter leaves to.'
  },
  {
    name: 'transition',
    type: 'object',
    default: '-',
    description: 'Overrides the Motion transition used for every letter. Each effect brings its own by default.'
  },
  {
    name: 'animatePresenceMode',
    type: "'wait' | 'sync'",
    default: '"wait"',
    description: "'wait' lets the old text leave before the new one enters, 'sync' runs both at once."
  },
  {
    name: 'animatePresenceInitial',
    type: 'boolean',
    default: 'false',
    description: 'Animates the first text in on mount.'
  },
  {
    name: 'onNext',
    type: '(index: number) => void',
    default: 'undefined',
    description: 'Called with the new index whenever the text changes.'
  },
  {
    name: 'mainClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for the outer element.'
  },
  {
    name: 'splitLevelClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for each group of letters. Add overflow hidden here for a masked slide.'
  },
  {
    name: 'elementLevelClassName',
    type: 'string',
    default: "''",
    description: 'Extra class names for each moving letter.'
  }
];

const LEAD_SPRING = { type: 'spring', damping: 30, stiffness: 400 } as const;

export default function RotatingTextDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, highlightColor: _highlightColor, ...rest } = props();
    return rest;
  });
  const primary = useColorModeValue('#0977ae', '#6ec9f7');
  const blockColor = createMemo(() => props().highlightColor || primary());
  const masked = createMemo(() => settings().effect === 'slide' || settings().effect === 'drop');
  const computedProps = createMemo(() => ({ highlightColor: blockColor() }));

  let lineEl: HTMLParagraphElement | undefined;
  let leadEl: HTMLSpanElement | undefined;
  let followLayout = false;

  createEffect(
    () => !settings().highlight,
    value => {
      followLayout = value;
    }
  );

  onSettled(() => {
    const line = lineEl;
    const lead = leadEl;
    if (!line || !lead) return;
    let baseX = lead.offsetLeft;
    let baseY = lead.offsetTop;
    let x = 0;
    let y = 0;
    let controls: AnimationPlaybackControls | null = null;
    const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const rebase = () => {
      baseX = lead.offsetLeft;
      baseY = lead.offsetTop;
    };
    const check = () => {
      const nx = lead.offsetLeft;
      const ny = lead.offsetTop;
      const dx = baseX - nx;
      const dy = baseY - ny;
      baseX = nx;
      baseY = ny;
      if (!followLayout || reduce || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) return;
      const sx = x + dx;
      const sy = y + dy;
      controls?.stop();
      x = sx;
      y = sy;
      lead.style.transform = `translate(${x}px, ${y}px)`;
      controls = animate(1, 0, {
        ...LEAD_SPRING,
        onUpdate: (f: number) => {
          x = sx * f;
          y = sy * f;
          lead.style.transform = `translate(${x}px, ${y}px)`;
        },
        onComplete: () => {
          x = 0;
          y = 0;
          lead.style.transform = '';
        }
      });
    };
    const observer = new ResizeObserver(check);
    observer.observe(line);
    window.addEventListener('resize', rebase);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', rebase);
      controls?.stop();
    };
  });

  const updateAndReplay = (name: keyof typeof DEFAULT_PROPS, value: unknown) => {
    updateProp(name, value as never);
    forceRerender();
  };

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{ position: 'relative', 'min-height': '400px', 'max-height': '400px', overflow: 'hidden' }}
          >
            <div class="rotating-text-demo">
              <p ref={el => (lineEl = el)} class="rotating-text-ptag">
                <span ref={el => (leadEl = el)} class="pt-0.5 sm:pt-1 md:pt-2">
                  Creative{' '}
                </span>
                <Keyed token={rerenderKey()}>
                  {() => (
                    <RotatingText
                      texts={WORDS}
                      splitLevelClassName={masked() ? 'rotating-text-split' : undefined}
                      animatePresenceInitial
                      {...(settings() as Partial<RotatingTextProps>)}
                      highlightColor={blockColor()}
                    />
                  )}
                </Keyed>
              </p>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Highlight Color"
              color={blockColor()}
              onChange={value => updateProp('highlightColor', value)}
            />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings().effect}
              onChange={value => updateAndReplay('effect', value)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().direction}
              isDisabled={settings().effect === 'drop'}
              onChange={value => updateAndReplay('direction', value)}
            />
            <PreviewSlider
              title="Rotation Interval"
              min={500}
              max={5000}
              step={100}
              value={settings().rotationInterval}
              valueUnit="ms"
              onChange={value => updateProp('rotationInterval', value)}
            />
            <PreviewSlider
              title="Stagger Duration"
              min={0}
              max={0.1}
              step={0.005}
              value={settings().staggerDuration}
              valueUnit="s"
              onChange={value => updateProp('staggerDuration', value)}
            />
            <PreviewSelect
              title="Stagger From"
              options={STAGGER_FROM_OPTIONS}
              value={settings().staggerFrom}
              onChange={value => updateProp('staggerFrom', value)}
            />
            <PreviewSelect
              title="Split By"
              options={SPLIT_BY_OPTIONS}
              value={settings().splitBy}
              onChange={value => updateAndReplay('splitBy', value)}
            />
            <PreviewSlider
              title="Blur"
              min={0}
              max={16}
              step={1}
              value={settings().blur}
              valueUnit="px"
              onChange={value => updateProp('blur', value)}
            />
            <PreviewSwitch title="Auto" isChecked={settings().auto} onChange={value => updateProp('auto', value)} />
            <PreviewSwitch title="Loop" isChecked={settings().loop} onChange={value => updateProp('loop', value)} />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={settings().pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />
            <PreviewSwitch
              title="Highlight"
              isChecked={settings().highlight}
              onChange={value => updateAndReplay('highlight', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={rotatingText} componentName="RotatingText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
