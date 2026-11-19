import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorList from '@/components/common/PreviewColorList';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import GradientText, { type GradientTextProps } from '@/content/TextAnimations/GradientText/GradientText';
import { gradientText } from '@/constants/code/TextAnimations/gradientTextCode';

const DEFAULT_PROPS = {
  colors: ['#0aa0ef', '#6ec9f7', '#b4d4ec'],
  animationSpeed: 8,
  variant: 'linear',
  angle: 90,
  scale: 3,
  yoyo: true,
  glow: 0,
  showBorder: false,
  borderWidth: 1.5,
  pauseOnHover: false,
  followPointer: false
};

const VARIANT_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'flow', label: 'Flow' },
  { value: 'conic', label: 'Conic' }
];

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'The text to fill with the gradient.' },
  {
    name: 'colors',
    type: 'string[]',
    default: `["#0aa0ef", "#6ec9f7", "#b4d4ec"]`,
    description: 'Colors of the gradient, in order. The first color is repeated at the end so loops stay seamless.'
  },
  {
    name: 'animationSpeed',
    type: 'number',
    default: '8',
    description: 'Seconds for one full cycle of the animation.'
  },
  {
    name: 'variant',
    type: "'linear' | 'flow' | 'conic'",
    default: "'linear'",
    description:
      'How the colors move. Linear slides a gradient through the text, flow drifts soft blobs of color around like a living mesh gradient and conic swings colors around the center.'
  },
  {
    name: 'angle',
    type: 'number',
    default: '90',
    description: 'Direction of the gradient in degrees. 90 runs left to right, 180 top to bottom.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '3',
    description: 'How broad the colors are. Higher values show fewer colors at once in longer, calmer bands.'
  },
  {
    name: 'yoyo',
    type: 'boolean',
    default: 'true',
    description: 'Eases back and forth instead of scrolling the gradient in one direction forever.'
  },
  {
    name: 'glow',
    type: 'number',
    default: '0',
    description: 'A soft bloom of the gradient colors around the letters, from 0 to 1.'
  },
  {
    name: 'showBorder',
    type: 'boolean',
    default: 'false',
    description: 'Wraps the text in a pill with an animated gradient outline that works on any background.'
  },
  { name: 'borderWidth', type: 'number', default: '1.5', description: 'Thickness of the outline in px.' },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Holds the colors still while the pointer is over the text.'
  },
  {
    name: 'followPointer',
    type: 'boolean',
    default: 'false',
    description: 'While hovered, the colors are drawn toward the pointer.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root element.' }
];

export default function GradientTextDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', 'min-height': '400px' }}>
            <div style={{ 'font-size': '3rem', 'font-weight': 500, 'text-align': 'center', padding: '0 16px' }}>
              <GradientText {...(props() as GradientTextProps)}>Gradient Magic</GradientText>
            </div>
          </div>

          <Customize>
            <PreviewColorList title="Colors" colors={props().colors} onChange={value => updateProp('colors', value)} />

            <PreviewSelect
              title="Variant"
              options={VARIANT_OPTIONS}
              value={props().variant}
              onChange={value => updateProp('variant', value)}
            />

            <PreviewSlider
              title="Animation Speed"
              min={1}
              max={20}
              step={0.5}
              value={props().animationSpeed}
              onChange={value => updateProp('animationSpeed', value)}
              valueUnit="s"
            />

            <PreviewSlider
              title="Angle"
              min={0}
              max={360}
              step={5}
              value={props().angle}
              onChange={value => updateProp('angle', value)}
              valueUnit="°"
            />

            <PreviewSlider
              title="Scale"
              min={1}
              max={6}
              step={0.25}
              value={props().scale}
              onChange={value => updateProp('scale', value)}
            />

            <PreviewSlider
              title="Glow"
              min={0}
              max={1}
              step={0.05}
              value={props().glow}
              onChange={value => updateProp('glow', value)}
            />

            <PreviewSlider
              title="Border Width"
              min={0.5}
              max={4}
              step={0.5}
              value={props().borderWidth}
              onChange={value => updateProp('borderWidth', value)}
              valueUnit="px"
            />

            <PreviewSwitch title="Yoyo" isChecked={props().yoyo} onChange={value => updateProp('yoyo', value)} />

            <PreviewSwitch
              title="Show Border"
              isChecked={props().showBorder}
              onChange={value => updateProp('showBorder', value)}
            />

            <PreviewSwitch
              title="Pause on Hover"
              isChecked={props().pauseOnHover}
              onChange={value => updateProp('pauseOnHover', value)}
            />

            <PreviewSwitch
              title="Follow Pointer"
              isChecked={props().followPointer}
              onChange={value => updateProp('followPointer', value)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={gradientText} componentName="GradientText" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
