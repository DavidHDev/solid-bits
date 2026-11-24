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

import DecryptedText, { type DecryptedTextProps } from '@/content/TextAnimations/DecryptedText/DecryptedText';
import { decryptedText } from '@/constants/code/TextAnimations/decryptedTextCode';

const CHARACTER_SETS = {
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  hex: '0123456789ABCDEF',
  binary: '01',
  blocks: '█▓▒░',
  symbols: '!<>-_/[]{}=+*^?#'
};

const LOOK = {
  scrambleColor: '',
  effect: 'scramble',
  animateOn: 'inViewHover',
  speed: 60,
  maxIterations: 10,
  sequential: true,
  revealDirection: 'start',
  hoverRadius: 100,
  loop: false,
  loopDelay: 2000,
  characters: CHARACTER_SETS.letters,
  useOriginalCharsOnly: false
};

const PRESETS: Record<string, typeof LOOK> = {
  classic: { ...LOOK },
  terminal: {
    ...LOOK,
    scrambleColor: '#2b86b6',
    revealDirection: 'random',
    speed: 40,
    hoverRadius: 70,
    characters: CHARACTER_SETS.hex
  },
  flip: {
    ...LOOK,
    effect: 'flip',
    revealDirection: 'center',
    speed: 70,
    hoverRadius: 0
  },
  loop: {
    ...LOOK,
    effect: 'fade',
    animateOn: 'view',
    speed: 45,
    hoverRadius: 0,
    loop: true,
    loopDelay: 1800,
    characters: CHARACTER_SETS.symbols
  }
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  clickMode: 'once'
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'flip', label: 'Flip' },
  { value: 'loop', label: 'Loop' }
];

const EFFECT_OPTIONS = [
  { label: 'Scramble', value: 'scramble' },
  { label: 'Flip', value: 'flip' },
  { label: 'Fade', value: 'fade' }
];

const ANIMATE_OPTIONS = [
  { label: 'View', value: 'view' },
  { label: 'Hover', value: 'hover' },
  { label: 'View & Hover', value: 'inViewHover' },
  { label: 'Click', value: 'click' }
];

const CLICK_OPTIONS = [
  { label: 'Once', value: 'once' },
  { label: 'Toggle', value: 'toggle' }
];

const DIRECTION_OPTIONS = [
  { label: 'Start', value: 'start' },
  { label: 'End', value: 'end' },
  { label: 'Center', value: 'center' },
  { label: 'Random', value: 'random' }
];

const CHARACTER_OPTIONS = [
  { label: 'Letters', value: CHARACTER_SETS.letters },
  { label: 'Hex', value: CHARACTER_SETS.hex },
  { label: 'Binary', value: CHARACTER_SETS.binary },
  { label: 'Blocks', value: CHARACTER_SETS.blocks },
  { label: 'Symbols', value: CHARACTER_SETS.symbols }
];

const propData: PropRow[] = [
  {
    name: 'text',
    type: 'string',
    default: '-',
    description: 'The text to decrypt.'
  },
  {
    name: 'effect',
    type: "'scramble' | 'flip' | 'fade'",
    default: "'scramble'",
    description:
      'How letters decode. Scramble swaps glyphs in place, flip rolls each glyph in vertically and lands the real letter with a soft bounce, fade keeps scrambled glyphs faint and brightens them as they resolve.'
  },
  {
    name: 'scrambleColor',
    type: 'string',
    default: "''",
    description:
      'Color of letters while they are scrambled. Each letter eases back to the text color as it decodes. Leave empty to keep the text color.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '50',
    description: 'Time between steps, in ms.'
  },
  {
    name: 'maxIterations',
    type: 'number',
    default: '10',
    description:
      'How many steps the letters scramble before settling when not sequential. Also sets how long letters keep scrambling after the cursor passes with hoverRadius.'
  },
  {
    name: 'sequential',
    type: 'boolean',
    default: 'false',
    description: 'Reveals one letter per step instead of all at once.'
  },
  {
    name: 'revealDirection',
    type: "'start' | 'end' | 'center' | 'random'",
    default: "'start'",
    description: 'Where the sequential reveal starts. Random uncovers the letters in a shuffled order.'
  },
  {
    name: 'useOriginalCharsOnly',
    type: 'boolean',
    default: 'false',
    description: 'Scrambles using only the letters already in the text.'
  },
  {
    name: 'characters',
    type: 'string',
    default: "'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+'",
    description: 'The pool of characters used while scrambling.'
  },
  {
    name: 'animateOn',
    type: "'view' | 'hover' | 'inViewHover' | 'click'",
    default: "'hover'",
    description: 'What starts the decryption. View and click start scrambled, so the real text never flashes first.'
  },
  {
    name: 'clickMode',
    type: "'once' | 'toggle'",
    default: "'once'",
    description: "With click, decrypt once or toggle back and forth. Only applies when animateOn is 'click'."
  },
  {
    name: 'hoverRadius',
    type: 'number',
    default: '0',
    description:
      'With hover, only letters within this many px of the cursor scramble, fading out toward the edge, and they settle once it passes. 0 decrypts the whole text on hover.'
  },
  {
    name: 'loop',
    type: 'boolean',
    default: 'false',
    description: 'After decrypting, holds, scrambles the text again and repeats. Pauses while off screen.'
  },
  {
    name: 'loopDelay',
    type: 'number',
    default: '2000',
    description: 'How long the decrypted text holds before scrambling again when looping, in ms.'
  },
  {
    name: 'className',
    type: 'string',
    default: "''",
    description: 'Class names for revealed letters.'
  },
  {
    name: 'parentClassName',
    type: 'string',
    default: "''",
    description: 'Class names for the wrapper around all letters.'
  },
  {
    name: 'encryptedClassName',
    type: 'string',
    default: "''",
    description: 'Class names for letters that are still scrambled.'
  }
];

export default function DecryptedTextDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, scrambleColor: _scrambleColor, ...rest } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');
  const hoverable = () => settings().animateOn === 'hover' || settings().animateOn === 'inViewHover';

  const change = <K extends keyof typeof DEFAULT_PROPS>(name: K, value: (typeof DEFAULT_PROPS)[K]) => {
    updateProp(name, value);
    forceRerender();
  };

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  const computedProps = createMemo(() => {
    const scrambleColor = props().scrambleColor;
    return scrambleColor ? { scrambleColor } : {};
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'scrambleColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container sm:py-4 md:py-6"
            style={{ position: 'relative', height: '400px', overflow: 'hidden' }}
          >
            <RefreshButton onClick={forceRerender} />

            <div style={{ display: 'flex', width: '80%', padding: '0 .5em' }}>
              <Keyed token={rerenderKey()}>
                {() => (
                  <DecryptedText
                    text="Hacking into the mainframe..."
                    parentClassName="decrypted-text"
                    {...(settings() as Partial<DecryptedTextProps>)}
                    scrambleColor={props().scrambleColor}
                  />
                )}
              </Keyed>
            </div>
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom
              title="Scramble Color"
              color={props().scrambleColor || ink()}
              onChange={v => updateProp('scrambleColor', v)}
            />
            <PreviewSelect
              title="Effect"
              options={EFFECT_OPTIONS}
              value={settings().effect}
              onChange={v => change('effect', v)}
            />
            <PreviewSelect
              title="Animate On"
              options={ANIMATE_OPTIONS}
              value={settings().animateOn}
              onChange={v => change('animateOn', v)}
            />
            <PreviewSelect
              title="Click Mode"
              options={CLICK_OPTIONS}
              value={settings().clickMode}
              isDisabled={settings().animateOn !== 'click'}
              onChange={v => change('clickMode', v)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().revealDirection}
              isDisabled={!settings().sequential}
              onChange={v => change('revealDirection', v)}
            />
            <PreviewSlider
              title="Speed"
              min={20}
              max={200}
              step={5}
              value={settings().speed}
              valueUnit="ms"
              onChange={v => change('speed', v)}
            />
            <PreviewSlider
              title="Iterations"
              min={1}
              max={40}
              step={1}
              value={settings().maxIterations}
              isDisabled={settings().sequential && !(hoverable() && settings().hoverRadius > 0)}
              onChange={v => change('maxIterations', v)}
            />
            <PreviewSlider
              title="Hover Radius"
              min={0}
              max={240}
              step={10}
              value={settings().hoverRadius}
              valueUnit="px"
              isDisabled={!hoverable()}
              onChange={v => change('hoverRadius', v)}
            />
            <PreviewSwitch title="Loop" isChecked={settings().loop} onChange={v => change('loop', v)} />
            <PreviewSlider
              title="Loop Delay"
              min={400}
              max={5000}
              step={100}
              value={settings().loopDelay}
              valueUnit="ms"
              isDisabled={!settings().loop}
              onChange={v => change('loopDelay', v)}
            />
            <PreviewSwitch
              title="Sequential"
              isChecked={settings().sequential}
              onChange={v => change('sequential', v)}
            />
            <PreviewSelect
              title="Characters"
              options={CHARACTER_OPTIONS}
              value={settings().characters}
              isDisabled={settings().useOriginalCharsOnly}
              onChange={v => change('characters', v)}
            />
            <PreviewSwitch
              title="Original Chars"
              isChecked={settings().useOriginalCharsOnly}
              onChange={v => change('useOriginalCharsOnly', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={decryptedText} componentName="DecryptedText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
