import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSlider from '@/components/common/PreviewSlider';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import BranchedMenu from '@/content/Micro/BranchedMenu/BranchedMenu';
import { branchedMenu } from '@/constants/code/Micro/branchedMenuCode';

const DEFAULT_PROPS = {
  color: '#f5f5f5',
  accentColor: '#f5f5f5',
  lineColor: '#3c4046',
  width: 240,
  rowHeight: 32,
  indent: 40,
  trunk: 14,
  radius: 10,
  lineWidth: 1.5,
  fontSize: 14,
  drawDuration: 400,
  foldDuration: 300
};

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'BranchedMenuItem[]',
    default: 'DEFAULT_ITEMS',
    description:
      'Sections: label plus children (value, label, icon), or a leaf with a value. A section with children folds; a leaf selects.'
  },
  {
    name: 'defaultOpen',
    type: 'number | number[]',
    default: '0',
    description: 'The section, or sections, open at first. -1 for none.'
  },
  {
    name: 'defaultActive',
    type: 'string',
    default: '""',
    description: "Value selected at first. Empty picks the open section's first child."
  },
  { name: 'onSelect', type: '(value, item) => void', default: '-', description: 'A child or a leaf was picked.' },
  { name: 'onToggle', type: '(index, open) => void', default: '-', description: 'A section folded or unfolded.' },
  {
    name: 'color',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The ink. Lines and idle text are mixes of it.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: '"#f5f5f5"',
    description: 'The active line, the active label and the marker.'
  },
  {
    name: 'lineColor',
    type: 'string',
    default: '"#3c4046"',
    description: 'The rail, trunk and branches. A solid colour, so joints never darken.'
  },
  {
    name: 'width',
    type: 'number',
    default: '240',
    description: 'The widest the menu may be, in px. It shrinks to its content.'
  },
  { name: 'rowHeight', type: 'number', default: '36', description: 'Height of a child row in px.' },
  {
    name: 'indent',
    type: 'number',
    default: '40',
    description: 'Where child rows start, in px. Branches end just before it.'
  },
  { name: 'trunk', type: 'number', default: '14', description: "The trunk line's x position, in px." },
  { name: 'radius', type: 'number', default: '10', description: 'The curve of each branch, in px.' },
  { name: 'lineWidth', type: 'number', default: '1.5', description: 'Stroke width of the lines.' },
  {
    name: 'fontSize',
    type: 'number',
    default: '14',
    description: 'Child text size in px. Headers are 1px larger.'
  },
  { name: 'drawDuration', type: 'number', default: '400', description: "The accent line's travel, in ms." },
  { name: 'foldDuration', type: 'number', default: '300', description: "A section's fold and unfold, in ms." },
  { name: 'className', type: 'string', default: '""', description: 'Extra classes for the nav.' }
];

export default function BranchedMenuDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedColor = useColorModeValue(
    () => (props().color === DEFAULT_PROPS.color ? '#12161c' : props().color),
    () => props().color
  );
  const renderedAccent = useColorModeValue(
    () => (props().accentColor === DEFAULT_PROPS.accentColor ? '#12161c' : props().accentColor),
    () => props().accentColor
  );
  const renderedLine = useColorModeValue(
    () => (props().lineColor === DEFAULT_PROPS.lineColor ? '#d3d6da' : props().lineColor),
    () => props().lineColor
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
              'align-items': 'flex-start',
              'padding-top': '24px'
            }}
          >
            <BranchedMenu
              defaultOpen={[0, 1]}
              defaultActive="quick"
              color={renderedColor()}
              accentColor={renderedAccent()}
              lineColor={renderedLine()}
              width={props().width}
              rowHeight={props().rowHeight}
              indent={props().indent}
              trunk={props().trunk}
              radius={props().radius}
              lineWidth={props().lineWidth}
              fontSize={props().fontSize}
              drawDuration={props().drawDuration}
              foldDuration={props().foldDuration}
            />
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedColor()} onChange={v => updateProp('color', v)} />
            <PreviewColorPickerCustom
              title="Accent"
              color={renderedAccent()}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom title="Lines" color={renderedLine()} onChange={v => updateProp('lineColor', v)} />
            <PreviewSlider
              title="Width"
              min={180}
              max={360}
              step={4}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Row Height"
              min={28}
              max={52}
              step={1}
              value={props().rowHeight}
              valueUnit="px"
              onChange={v => updateProp('rowHeight', v)}
            />
            <PreviewSlider
              title="Indent"
              min={28}
              max={72}
              step={1}
              value={props().indent}
              valueUnit="px"
              onChange={v => updateProp('indent', v)}
            />
            <PreviewSlider
              title="Trunk"
              min={2}
              max={30}
              step={1}
              value={props().trunk}
              valueUnit="px"
              onChange={v => updateProp('trunk', v)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={18}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Line Width"
              min={1}
              max={3}
              step={0.25}
              value={props().lineWidth}
              onChange={v => updateProp('lineWidth', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={12}
              max={18}
              step={1}
              value={props().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSlider
              title="Draw"
              min={150}
              max={900}
              step={10}
              value={props().drawDuration}
              valueUnit="ms"
              onChange={v => updateProp('drawDuration', v)}
            />
            <PreviewSlider
              title="Fold"
              min={150}
              max={600}
              step={10}
              value={props().foldDuration}
              valueUnit="ms"
              onChange={v => updateProp('foldDuration', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={branchedMenu} componentName="BranchedMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
