import { createSignal } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import SquishSwitch from '@/content/Micro/SquishSwitch/SquishSwitch';
import { squishSwitch } from '@/constants/code/Micro/squishSwitchCode';

const DEFAULT_PROPS = {
  disabled: false,
  trackColor: '#27272a',
  trackOnColor: '#f5f5f5',
  thumbColor: '#4e4e51',
  thumbOnColor: '#27272a',
  width: 76,
  height: 38,
  radius: 19,
  speed: 50,
  stretch: 36,
  hoverScale: 1.035,
  colorDuration: 320
};

type ColorKey = 'trackColor' | 'trackOnColor' | 'thumbColor' | 'thumbOnColor';

const LIGHT: Record<ColorKey, string> = {
  trackColor: '#d4d4d8',
  trackOnColor: '#18181b',
  thumbColor: '#b0b0b3',
  thumbOnColor: '#d4d4d8'
};

const propData: PropRow[] = [
  {
    name: 'checked',
    type: 'boolean',
    default: 'undefined',
    description: 'Controlled state. Leave it out to let the switch keep its own.'
  },
  { name: 'defaultChecked', type: 'boolean', default: 'false', description: 'Initial state when uncontrolled.' },
  {
    name: 'onChange',
    type: '(checked: boolean) => void',
    default: '-',
    description: 'A tap, a drag past the middle, or a key.'
  },
  { name: 'label', type: 'string', default: '""', description: 'A label beside the switch, wired to it.' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Dimmed and inert.' },
  { name: 'trackColor', type: 'string', default: '"#27272a"', description: 'The track while off.' },
  { name: 'trackOnColor', type: 'string', default: '"#f5f5f5"', description: 'The track while on.' },
  {
    name: 'thumbColor',
    type: 'string',
    default: '""',
    description: 'The thumb while off. Empty mixes the on colour faintly into the track.'
  },
  {
    name: 'thumbOnColor',
    type: 'string',
    default: '""',
    description: 'The thumb while on. Empty uses the off track colour.'
  },
  { name: 'width', type: 'number', default: '76', description: 'Track width in px.' },
  {
    name: 'height',
    type: 'number',
    default: '38',
    description: 'Track height in px. The thumb and its inset follow.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '19',
    description: 'Track corner radius in px, capped at half the height.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '50',
    description: 'Stiffness of the settle spring, 0 to 100. Low is lazy, high is snappy.'
  },
  {
    name: 'stretch',
    type: 'number',
    default: '36',
    description: 'How much the thumb lengthens with speed, 0 to 100. It narrows to keep its area.'
  },
  { name: 'hoverScale', type: 'number', default: '1.035', description: 'The thumb swells to this on hover.' },
  { name: 'colorDuration', type: 'number', default: '320', description: 'The colour cross-fade, in ms.' },
  { name: 'ariaLabel', type: 'string', default: '-', description: 'Accessible name when there is no label.' },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the root element.' },
  { name: 'id', type: 'string', default: '-', description: 'Id for the switch button; the label uses it.' }
];

export default function SquishSwitchDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [checked, setChecked] = createSignal(false);

  const light = (key: ColorKey) => (props()[key] === DEFAULT_PROPS[key] ? LIGHT[key] : props()[key]);
  const renderedTrack = useColorModeValue(
    () => light('trackColor'),
    () => props().trackColor
  );
  const renderedTrackOn = useColorModeValue(
    () => light('trackOnColor'),
    () => props().trackOnColor
  );
  const renderedThumb = useColorModeValue(
    () => light('thumbColor'),
    () => props().thumbColor
  );
  const renderedThumbOn = useColorModeValue(
    () => light('thumbOnColor'),
    () => props().thumbOnColor
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
          <div class="demo-container" style={{ position: 'relative', height: '400px', overflow: 'hidden' }}>
            <SquishSwitch
              checked={checked()}
              onChange={v => {
                setChecked(v);
              }}
              label="Airplane mode"
              disabled={props().disabled}
              trackColor={renderedTrack()}
              trackOnColor={renderedTrackOn()}
              thumbColor={renderedThumb()}
              thumbOnColor={renderedThumbOn()}
              width={props().width}
              height={props().height}
              radius={props().radius}
              speed={props().speed}
              stretch={props().stretch}
              hoverScale={props().hoverScale}
              colorDuration={props().colorDuration}
            />
          </div>

          <Customize>
            <PreviewSwitch
              title="Checked"
              isChecked={checked()}
              onChange={v => {
                setChecked(v);
              }}
            />
            <PreviewSwitch title="Disabled" isChecked={props().disabled} onChange={v => updateProp('disabled', v)} />
            <PreviewColorPickerCustom
              title="Track"
              color={renderedTrack()}
              onChange={v => updateProp('trackColor', v)}
            />
            <PreviewColorPickerCustom
              title="Track On"
              color={renderedTrackOn()}
              onChange={v => updateProp('trackOnColor', v)}
            />
            <PreviewColorPickerCustom
              title="Thumb"
              color={renderedThumb()}
              onChange={v => updateProp('thumbColor', v)}
            />
            <PreviewColorPickerCustom
              title="Thumb On"
              color={renderedThumbOn()}
              onChange={v => updateProp('thumbOnColor', v)}
            />
            <PreviewSlider
              title="Width"
              min={44}
              max={120}
              step={2}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Height"
              min={24}
              max={64}
              step={2}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={32}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={100}
              step={5}
              value={props().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Stretch"
              min={0}
              max={100}
              step={2}
              value={props().stretch}
              onChange={v => updateProp('stretch', v)}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.1}
              step={0.005}
              value={props().hoverScale}
              onChange={v => updateProp('hoverScale', v)}
            />
            <PreviewSlider
              title="Color Fade"
              min={0}
              max={800}
              step={20}
              value={props().colorDuration}
              valueUnit="ms"
              onChange={v => updateProp('colorDuration', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['motion']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={squishSwitch} componentName="SquishSwitch" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
