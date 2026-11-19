import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import FolderFloat, { type FolderFloatTrigger } from '@/content/Micro/FolderFloat/FolderFloat';
import { folderFloat } from '@/constants/code/Micro/folderFloatCode';

const DEFAULT_PROPS = {
  label: 'Design feedback',
  sublabel: '',
  trigger: 'hover',
  closeOnSelect: true,
  physics: true,
  drift: 0.5,
  folderColor: '#3c4046',
  frontColor: '#50555c',
  paperColor: '#f5f5f5',
  itemColor: '#f5f5f5',
  itemTextColor: '#12161c',
  labelColor: '#f5f5f5',
  width: 200,
  height: 148,
  radius: 14,
  spread: 180,
  lift: 26,
  tilt: 8,
  flapAngle: 34,
  restAngle: 16,
  openDuration: 520,
  stagger: 45,
  bounce: 0.3
};

type LightKey = 'folderColor' | 'frontColor' | 'paperColor' | 'itemColor' | 'labelColor';

const LIGHT: Record<LightKey, string> = {
  folderColor: '#d3d6da',
  frontColor: '#e3e5e8',
  paperColor: '#ffffff',
  itemColor: '#ffffff',
  labelColor: '#12161c'
};

const TRIGGER_OPTIONS = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'Array<string | { label, value }>',
    default: 'DEFAULT_ITEMS',
    description: 'The pills that float out. A string is its own value.'
  },
  { name: 'label', type: 'string', default: '"Design feedback"', description: 'The line on the flap.' },
  {
    name: 'sublabel',
    type: 'string',
    default: '""',
    description: 'The dimmer line under it. Empty counts the notes.'
  },
  {
    name: 'trigger',
    type: "'hover' | 'click'",
    default: "'hover'",
    description: 'Open on hover, or toggle on press.'
  },
  { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Start open.' },
  { name: 'closeOnSelect', type: 'boolean', default: 'true', description: 'Picking a pill closes the folder.' },
  {
    name: 'physics',
    type: 'boolean',
    default: 'true',
    description:
      'Once the pills land, a zero-gravity world takes over: they float, collide, and can be dragged and thrown inside the cloud.'
  },
  {
    name: 'drift',
    type: 'number',
    default: '0.5',
    description: 'Strength of the floating currents in the world. 0 holds still.'
  },
  { name: 'onSelect', type: '(value, index) => void', default: '-', description: 'A pill was picked.' },
  { name: 'onOpenChange', type: '(open) => void', default: '-', description: 'The folder opened or closed.' },
  { name: 'folderColor', type: 'string', default: '"#3c4046"', description: 'The back panel and its tab.' },
  { name: 'frontColor', type: 'string', default: '"#50555c"', description: 'The flap.' },
  {
    name: 'paperColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The paper edge that rises as it opens.'
  },
  { name: 'itemColor', type: 'string', default: '"#f5f5f5"', description: 'The pills.' },
  { name: 'itemTextColor', type: 'string', default: '"#12161c"', description: 'The pill text.' },
  { name: 'labelColor', type: 'string', default: '"#f5f5f5"', description: 'The flap text.' },
  { name: 'width', type: 'number', default: '200', description: 'Folder width in px.' },
  { name: 'height', type: 'number', default: '148', description: 'Folder height in px, below the tab.' },
  { name: 'radius', type: 'number', default: '14', description: 'Corner radius in px.' },
  {
    name: 'spread',
    type: 'number',
    default: '180',
    description: 'Half the widest the cloud may be, in px. Pills pack into rows within it.'
  },
  { name: 'lift', type: 'number', default: '26', description: 'Gap between the folder and the lowest row, in px.' },
  { name: 'tilt', type: 'number', default: '8', description: 'Most a pill leans, in degrees.' },
  {
    name: 'flapAngle',
    type: 'number',
    default: '34',
    description: 'How far the flap tilts toward you when open, in degrees.'
  },
  { name: 'restAngle', type: 'number', default: '16', description: 'The flap tilt when closed, in degrees.' },
  {
    name: 'openDuration',
    type: 'number',
    default: '520',
    description: "A pill's rise, in ms. The close is 60% of it."
  },
  {
    name: 'stagger',
    type: 'number',
    default: '45',
    description: 'Delay between pills, in ms. The close reverses the order.'
  },
  { name: 'bounce', type: 'number', default: '0.3', description: 'Overshoot of the rise. 0 lands dead.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root.' }
];

export default function FolderFloatDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const light = (key: LightKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedFolder = useColorModeValue(
    () => light('folderColor'),
    () => props().folderColor
  );
  const renderedFront = useColorModeValue(
    () => light('frontColor'),
    () => props().frontColor
  );
  const renderedPaper = useColorModeValue(
    () => light('paperColor'),
    () => props().paperColor
  );
  const renderedItem = useColorModeValue(
    () => light('itemColor'),
    () => props().itemColor
  );
  const renderedLabel = useColorModeValue(
    () => light('labelColor'),
    () => props().labelColor
  );

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
              'padding-bottom': '44px'
            }}
          >
            <FolderFloat
              label={props().label}
              sublabel={props().sublabel}
              trigger={props().trigger as FolderFloatTrigger}
              closeOnSelect={props().closeOnSelect}
              physics={props().physics}
              drift={props().drift}
              folderColor={renderedFolder()}
              frontColor={renderedFront()}
              paperColor={renderedPaper()}
              itemColor={renderedItem()}
              itemTextColor={props().itemTextColor}
              labelColor={renderedLabel()}
              width={props().width}
              height={props().height}
              radius={props().radius}
              spread={props().spread}
              lift={props().lift}
              tilt={props().tilt}
              flapAngle={props().flapAngle}
              restAngle={props().restAngle}
              openDuration={props().openDuration}
              stagger={props().stagger}
              bounce={props().bounce}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Trigger"
              options={TRIGGER_OPTIONS}
              value={props().trigger}
              onChange={(v: FolderFloatTrigger) => updateProp('trigger', v)}
              width={110}
            />
            <PreviewInput title="Label" value={props().label} maxLength={24} onChange={v => updateProp('label', v)} />
            <PreviewInput
              title="Sublabel"
              value={props().sublabel}
              maxLength={24}
              onChange={v => updateProp('sublabel', v)}
            />
            <PreviewColorPickerCustom
              title="Folder"
              color={renderedFolder()}
              onChange={v => updateProp('folderColor', v)}
            />
            <PreviewColorPickerCustom
              title="Front"
              color={renderedFront()}
              onChange={v => updateProp('frontColor', v)}
            />
            <PreviewColorPickerCustom
              title="Paper"
              color={renderedPaper()}
              onChange={v => updateProp('paperColor', v)}
            />
            <PreviewColorPickerCustom title="Item" color={renderedItem()} onChange={v => updateProp('itemColor', v)} />
            <PreviewColorPickerCustom
              title="Item Text"
              color={props().itemTextColor}
              onChange={v => updateProp('itemTextColor', v)}
            />
            <PreviewColorPickerCustom
              title="Label"
              color={renderedLabel()}
              onChange={v => updateProp('labelColor', v)}
            />
            <PreviewSlider
              title="Width"
              min={140}
              max={320}
              step={4}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={100}
              max={240}
              step={4}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
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
              title="Spread"
              min={100}
              max={280}
              step={5}
              value={props().spread}
              valueUnit="px"
              onChange={v => updateProp('spread', v)}
            />
            <PreviewSlider
              title="Lift"
              min={0}
              max={80}
              step={2}
              value={props().lift}
              valueUnit="px"
              onChange={v => updateProp('lift', v)}
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
              title="Flap Angle"
              min={0}
              max={50}
              step={1}
              value={props().flapAngle}
              valueUnit="°"
              onChange={v => updateProp('flapAngle', v)}
            />
            <PreviewSlider
              title="Rest Angle"
              min={0}
              max={30}
              step={1}
              value={props().restAngle}
              valueUnit="°"
              onChange={v => updateProp('restAngle', v)}
            />
            <PreviewSlider
              title="Open"
              min={200}
              max={1000}
              step={20}
              value={props().openDuration}
              valueUnit="ms"
              onChange={v => updateProp('openDuration', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={120}
              step={5}
              value={props().stagger}
              valueUnit="ms"
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={0.6}
              step={0.05}
              value={props().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSwitch
              title="Close On Select"
              isChecked={props().closeOnSelect}
              onChange={v => updateProp('closeOnSelect', v)}
            />
            <PreviewSwitch title="Physics" isChecked={props().physics} onChange={v => updateProp('physics', v)} />
            <PreviewSlider
              title="Drift"
              min={0}
              max={1}
              step={0.05}
              value={props().drift}
              isDisabled={!props().physics}
              onChange={v => updateProp('drift', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['matter-js']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={folderFloat} componentName="FolderFloat" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
