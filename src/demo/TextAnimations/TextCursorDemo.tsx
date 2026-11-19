import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import TextCursor, { type TextCursorProps } from '@/content/TextAnimations/TextCursor/TextCursor';
import { textCursor } from '@/constants/code/TextAnimations/textCursorCode';

const LOOK = {
  text: 'Hello',
  mode: 'stamp',
  fontSize: 28,
  spacing: 88,
  maxPoints: 7,
  shrink: 0.5,
  fade: 0.6,
  smoothing: 0.3,
  exitDuration: 0.5,
  removalInterval: 30,
  followMouseDirection: true,
  keepUpright: true,
  randomFloat: true,
  popIn: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  words: { ...LOOK },
  emoji: { ...LOOK, text: '✨', fontSize: 30, spacing: 46, maxPoints: 10, shrink: 0.6, fade: 0.5 },
  chain: {
    ...LOOK,
    text: '→',
    mode: 'chain',
    fontSize: 24,
    spacing: 22,
    maxPoints: 18,
    shrink: 0.55,
    fade: 0.75,
    randomFloat: false
  },
  ribbon: {
    ...LOOK,
    text: 'Solid Bits follows your cursor ✦ ',
    mode: 'ribbon',
    fontSize: 26,
    spacing: 1,
    shrink: 0.35,
    fade: 0.7,
    smoothing: 0.4
  }
};

const DEFAULT_PROPS = {
  preset: 'words',
  ...LOOK,
  textColor: '',
  hideCursor: false
};

const PRESET_OPTIONS = [
  { value: 'words', label: 'Words' },
  { value: 'emoji', label: 'Emoji' },
  { value: 'chain', label: 'Chain' },
  { value: 'ribbon', label: 'Ribbon' }
];

const MODE_OPTIONS = [
  { value: 'stamp', label: 'Stamp' },
  { value: 'chain', label: 'Chain' },
  { value: 'ribbon', label: 'Ribbon' }
];

const propData: PropRow[] = [
  { name: 'text', type: 'string', default: "'Hello'", description: 'The text or emoji the trail is made of.' },
  {
    name: 'mode',
    type: "'stamp' | 'chain' | 'ribbon'",
    default: "'stamp'",
    description:
      'Stamp leaves copies along the path, chain makes copies follow each other like a snake, and ribbon lays the letters along the path.'
  },
  {
    name: 'spacing',
    type: 'number',
    default: '88',
    description: 'Distance between copies, in px. In ribbon mode, extra space between letters.'
  },
  {
    name: 'maxPoints',
    type: 'number',
    default: '7',
    description: 'Most copies shown at once in stamp and chain modes.'
  },
  { name: 'color', type: 'string', default: "'currentColor'", description: 'Color of the text.' },
  { name: 'fontSize', type: 'number', default: '28', description: 'Font size of the text, in px.' },
  { name: 'fontWeight', type: 'number | string', default: '500', description: 'Font weight of the text.' },
  { name: 'fontFamily', type: 'string', default: "'inherit'", description: 'Font family of the text.' },
  {
    name: 'shrink',
    type: 'number',
    default: '0.5',
    description: 'How much smaller the trail gets toward its end, from 0 to 1.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0.6',
    description: 'How much the trail fades toward its end, from 0 to 1.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.3',
    description: 'Softens the path the trail follows, from 0 to 1. Higher values lag a little behind the cursor.'
  },
  {
    name: 'followMouseDirection',
    type: 'boolean',
    default: 'true',
    description: 'Turns the text to face the direction the cursor moves.'
  },
  {
    name: 'randomFloat',
    type: 'boolean',
    default: 'true',
    description: 'Lets stamped copies sway gently, and makes chains and ribbons ripple.'
  },
  { name: 'popIn', type: 'boolean', default: 'true', description: 'Makes new copies pop in with a little overshoot.' },
  {
    name: 'keepUpright',
    type: 'boolean',
    default: 'true',
    description: 'In stamp mode, keeps copies from turning upside down when the cursor moves left.'
  },
  {
    name: 'exitDuration',
    type: 'number',
    default: '0.5',
    description: 'How long a stamped copy takes to shrink away, in seconds.'
  },
  {
    name: 'removalInterval',
    type: 'number',
    default: '30',
    description: 'How quickly the trail pulls back into the cursor once it stops, in ms per copy.'
  },
  { name: 'hideCursor', type: 'boolean', default: 'false', description: 'Hides the system cursor over the element.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the container.' }
];

export default function TextCursorDemo() {
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const { preset: _preset, textColor: _textColor, ...rest } = props();
    return rest;
  });
  const ink = useColorModeValue('#18181b', '#ffffff');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => (props().textColor ? { color: props().textColor } : {}));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'textColor']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '460px', padding: 0, overflow: 'hidden' }}>
            <p
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                margin: 0,
                'font-size': '14px',
                color: 'var(--text-dimmed)',
                'user-select': 'none',
                'pointer-events': 'none'
              }}
            >
              Move around
            </p>
            <TextCursor {...(settings() as TextCursorProps)} color={props().textColor || 'currentColor'} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewInput
              title="Text"
              value={settings().text}
              placeholder="Enter text..."
              maxLength={40}
              onChange={v => updateProp('text', v)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={props().textColor || ink()}
              onChange={v => updateProp('textColor', v)}
            />
            <PreviewSelect
              title="Mode"
              options={MODE_OPTIONS}
              value={settings().mode}
              onChange={v => updateProp('mode', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={72}
              step={1}
              value={settings().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Spacing"
              min={0}
              max={200}
              step={1}
              value={settings().spacing}
              valueUnit="px"
              onChange={v => updateProp('spacing', v)}
            />
            <PreviewSlider
              title="Max Points"
              min={1}
              max={30}
              step={1}
              value={settings().maxPoints}
              onChange={v => updateProp('maxPoints', v)}
            />
            <PreviewSlider
              title="Shrink"
              min={0}
              max={1}
              step={0.05}
              value={settings().shrink}
              onChange={v => updateProp('shrink', v)}
            />
            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={settings().fade}
              onChange={v => updateProp('fade', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={settings().smoothing}
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSlider
              title="Exit Duration"
              min={0.1}
              max={2}
              step={0.05}
              value={settings().exitDuration}
              valueUnit="s"
              onChange={v => updateProp('exitDuration', v)}
            />
            <PreviewSlider
              title="Removal Interval"
              min={5}
              max={200}
              step={5}
              value={settings().removalInterval}
              valueUnit="ms"
              onChange={v => updateProp('removalInterval', v)}
            />
            <PreviewSwitch
              title="Follow Mouse Direction"
              isChecked={settings().followMouseDirection}
              onChange={v => updateProp('followMouseDirection', v)}
            />
            <PreviewSwitch
              title="Keep Upright"
              isChecked={settings().keepUpright}
              onChange={v => updateProp('keepUpright', v)}
            />
            <PreviewSwitch
              title="Random Float"
              isChecked={settings().randomFloat}
              onChange={v => updateProp('randomFloat', v)}
            />
            <PreviewSwitch title="Pop In" isChecked={settings().popIn} onChange={v => updateProp('popIn', v)} />
            <PreviewSwitch
              title="Hide Cursor"
              isChecked={settings().hideCursor}
              onChange={v => updateProp('hideCursor', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={textCursor} componentName="TextCursor" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
