import { createSignal, onSettled } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import PromptBar from '@/content/Micro/PromptBar/PromptBar';
import { promptBar } from '@/constants/code/Micro/promptBarCode';

const DEFAULT_PROPS = {
  placeholder: 'Ask anything',
  background: '#27292b',
  color: '#f5f5f5',
  menuBackground: '#313437',
  sparkColor: '#6ec9f7',
  sparkBoost: 1,
  width: 400,
  radius: 16,
  maxRows: 5,
  morphDuration: 240,
  squash: 0.12,
  tilt: 8,
  pressScale: 0.96,
  busy: false,
  models: true,
  efforts: true,
  dictation: true
};

const FILES = ['brief.pdf', 'screenshot.png', 'metrics.csv'];
const TRANSCRIPT = 'Compare the last two quarters of sales';
const RESPONSE_MS = 2400;
const DICTATION_MS = 2200;

const propData: PropRow[] = [
  {
    name: 'placeholder',
    type: 'string',
    default: '"Ask anything"',
    description: 'Shown while the field is empty.'
  },
  {
    name: 'sources',
    type: 'PromptBarSource[]',
    default: 'DEFAULT_SOURCES',
    description:
      'Rows of the @ menu and the plus button: key, name, description, icon (a Hugeicons icon or any node), and attach: true for the row that adds files.'
  },
  {
    name: 'commands',
    type: 'PromptBarCommand[]',
    default: 'DEFAULT_COMMANDS',
    description: 'Rows of the / menu: key, name (with the slash), description.'
  },
  {
    name: 'models',
    type: 'PromptBarModel[]',
    default: 'DEFAULT_MODELS',
    description: 'Rows of the model picker: key, name, tag. An empty list hides the picker.'
  },
  {
    name: 'efforts',
    type: 'string[]',
    default: 'DEFAULT_EFFORTS',
    description:
      'Steps of the effort slider, low to high. The last step turns the field to the spark colour with drifting sparks. An empty list hides the control.'
  },
  {
    name: 'defaultEffort',
    type: 'string',
    default: '""',
    description: 'The step selected at first. Empty picks the middle.'
  },
  { name: 'onEffortChange', type: '(effort) => void', default: '-', description: 'The slider moved.' },
  {
    name: 'defaultModel',
    type: 'string',
    default: '""',
    description: 'Key of the model selected at first. Empty picks the first.'
  },
  {
    name: 'busy',
    type: 'boolean',
    default: 'false',
    description: 'A response is in flight. The send tile stays ink and its arrow morphs into a stop square.'
  },
  {
    name: 'onSend',
    type: '(text, { attachments, model, effort }) => void',
    default: '-',
    description: 'Enter or the tile, with a non-empty draft or an attachment. The draft and attachments clear.'
  },
  { name: 'onStop', type: '() => void', default: '-', description: 'The tile while busy.' },
  {
    name: 'onAttach',
    type: '() => string | string[] | Promise<string | string[]>',
    default: '-',
    description: 'Picked the attach row. Return file names, or a promise of them, and they appear as chips.'
  },
  {
    name: 'onDictate',
    type: '() => string | Promise<string>',
    default: '-',
    description: 'The mic. Return the transcript, or a promise of it, and it lands in the draft. Omit to hide the mic.'
  },
  {
    name: 'background',
    type: 'string',
    default: '"#27292b"',
    description: 'The field surface, and the glyph on an armed tile.'
  },
  { name: 'color', type: 'string', default: '"#f5f5f5"', description: 'The ink: text, icons, and the armed tile.' },
  {
    name: 'menuBackground',
    type: 'string',
    default: '"#313437"',
    description: 'The surface of the menus and the effort popover.'
  },
  {
    name: 'sparkColor',
    type: 'string',
    default: '"#6ec9f7"',
    description: 'The wash, the sparks and the slider at the top effort.'
  },
  {
    name: 'sparkBoost',
    type: 'number',
    default: '1',
    description:
      'How strongly typing drives the sparks at the top effort: they rise faster, grow and glow brighter with typing speed, and flash on each keystroke. No sparks are added. 0 keeps them calm.'
  },
  { name: 'width', type: 'number', default: '400', description: 'Field width in px, capped at the parent.' },
  { name: 'radius', type: 'number', default: '16', description: 'Field corner radius in px.' },
  { name: 'maxRows', type: 'number', default: '5', description: 'Rows the field grows to before it scrolls.' },
  { name: 'morphDuration', type: 'number', default: '240', description: 'Arrow to square and back, in ms.' },
  {
    name: 'squash',
    type: 'number',
    default: '0.12',
    description: 'Mid-morph pinch. The glyph narrows by this and grows taller to keep its area.'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '8',
    description: 'Mid-morph lean in degrees, mirrored on the way back.'
  },
  {
    name: 'pressScale',
    type: 'number',
    default: '0.96',
    description: 'Scale of the send tile while a pointer is down.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function PromptBarDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedBackground = useColorModeValue(
    () => (props().background === DEFAULT_PROPS.background ? '#f6f6f6' : props().background),
    () => props().background
  );
  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#17191b' : props().color),
    () => props().color
  );
  const renderedMenu = useColorModeValue(
    () => (props().menuBackground === DEFAULT_PROPS.menuBackground ? '#ffffff' : props().menuBackground),
    () => props().menuBackground
  );

  const [flowBusy, setFlowBusy] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let fileIndex = 0;
  const send = () => {
    setFlowBusy(true);
    clearTimeout(timer);
    timer = setTimeout(() => {
      setFlowBusy(false);
    }, RESPONSE_MS);
  };
  const stop = () => {
    clearTimeout(timer);
    setFlowBusy(false);
    if (props().busy) updateProp('busy', false);
  };
  const attach = () => FILES[fileIndex++ % FILES.length];
  const dictate = () => new Promise<string>(resolve => setTimeout(() => resolve(TRANSCRIPT), DICTATION_MS));
  onSettled(() => () => clearTimeout(timer));

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
              'align-items': 'flex-end',
              'padding-bottom': '32px',
              'padding-left': '16px',
              'padding-right': '16px'
            }}
          >
            <PromptBar
              placeholder={props().placeholder}
              models={props().models ? undefined : []}
              efforts={props().efforts ? undefined : []}
              busy={props().busy || flowBusy()}
              onSend={send}
              onStop={stop}
              onAttach={attach}
              onDictate={props().dictation ? dictate : undefined}
              background={renderedBackground()}
              color={renderedColor()}
              menuBackground={renderedMenu()}
              sparkColor={props().sparkColor}
              sparkBoost={props().sparkBoost}
              width={props().width}
              radius={props().radius}
              maxRows={props().maxRows}
              morphDuration={props().morphDuration}
              squash={props().squash}
              tilt={props().tilt}
              pressScale={props().pressScale}
            />
          </div>

          <Customize>
            <PreviewInput
              title="Placeholder"
              value={props().placeholder}
              maxLength={32}
              onChange={v => updateProp('placeholder', v)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackground()}
              onChange={v => updateProp('background', v)}
            />
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Menu"
              color={renderedMenu()}
              onChange={v => updateProp('menuBackground', v)}
            />
            <PreviewColorPickerCustom
              title="Spark"
              color={props().sparkColor}
              onChange={v => updateProp('sparkColor', v)}
            />
            <PreviewSlider
              title="Spark Boost"
              min={0}
              max={2}
              step={0.1}
              value={props().sparkBoost}
              onChange={v => updateProp('sparkBoost', v)}
            />
            <PreviewSlider
              title="Width"
              min={300}
              max={520}
              step={4}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={28}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Max Rows"
              min={1}
              max={10}
              step={1}
              value={props().maxRows}
              onChange={v => updateProp('maxRows', v)}
            />
            <PreviewSlider
              title="Morph"
              min={120}
              max={400}
              step={20}
              value={props().morphDuration}
              valueUnit="ms"
              onChange={v => updateProp('morphDuration', v)}
            />
            <PreviewSlider
              title="Squash"
              min={0}
              max={0.3}
              step={0.01}
              value={props().squash}
              onChange={v => updateProp('squash', v)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={20}
              step={1}
              value={props().tilt}
              valueUnit="°"
              onChange={v => updateProp('tilt', v)}
            />
            <PreviewSlider
              title="Press Scale"
              min={0.85}
              max={1}
              step={0.01}
              value={props().pressScale}
              onChange={v => updateProp('pressScale', v)}
            />
            <PreviewSwitch title="Busy" isChecked={props().busy} onChange={v => updateProp('busy', v)} />
            <PreviewSwitch title="Model Picker" isChecked={props().models} onChange={v => updateProp('models', v)} />
            <PreviewSwitch title="Effort Picker" isChecked={props().efforts} onChange={v => updateProp('efforts', v)} />
            <PreviewSwitch title="Dictation" isChecked={props().dictation} onChange={v => updateProp('dictation', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion', '@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={promptBar} componentName="PromptBar" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
