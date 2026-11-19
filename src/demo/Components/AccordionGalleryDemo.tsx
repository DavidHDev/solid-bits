import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import AccordionGallery, { type AccordionGalleryProps } from '@/content/Components/AccordionGallery/AccordionGallery';
import { accordionGallery } from '@/constants/code/Components/accordionGalleryCode';

const ITEMS = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon', link: '#' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline', link: '#' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls', link: '#' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour', link: '#' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline', link: '#' }
];

const DEFAULT_PROPS = {
  defaultIndex: 2,
  accentColor: '#ffffff',
  overlayColor: '#060708',
  textColor: '#ffffff',
  grayscale: true,
  showLabels: true,
  duration: 0.6,
  ease: 'power3.out',
  parallax: 0.5,
  tilt: 8,
  stagger: 0.06,
  trigger: 'hover',
  height: 460,
  gap: 10,
  radius: 16,
  expandRatio: 0.52,
  orientation: 'horizontal'
};

const easeOptions = [
  { value: 'power2.inOut', label: 'power2.inOut' },
  { value: 'power3.out', label: 'power3.out' },
  { value: 'power4.out', label: 'power4.out' },
  { value: 'expo.out', label: 'expo.out' },
  { value: 'back.out', label: 'back.out' },
  { value: 'sine.inOut', label: 'sine.inOut' }
];

const triggerOptions = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' }
];

const orientationOptions = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'Array<{ image: string; label?: string; link?: string; alt?: string }>',
    default: '5 sample panels',
    description: 'The panels to render. Each needs an image, and optionally a label, link and alt text.'
  },
  {
    name: 'defaultIndex',
    type: 'number',
    default: '2',
    description: 'Index of the panel that is expanded on load, so the gallery never looks dead.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: '"#ffffff"',
    description: 'Colour of the caption accent bar and the focus ring.'
  },
  {
    name: 'overlayColor',
    type: 'string',
    default: '"#060708"',
    description: 'Colour used for the bottom legibility gradient and the dimming of collapsed panels.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: '"#ffffff"',
    description: 'Colour of the caption text.'
  },
  {
    name: 'grayscale',
    type: 'boolean',
    default: 'true',
    description: 'Desaturate collapsed panels and restore full colour on the expanded one.'
  },
  {
    name: 'showLabels',
    type: 'boolean',
    default: 'true',
    description: 'Whether captions reveal on the expanded panel.'
  },
  {
    name: 'duration',
    type: 'number',
    default: '0.6',
    description: 'Duration of the expand / collapse transition in seconds.'
  },
  {
    name: 'ease',
    type: 'string',
    default: '"power3.out"',
    description: 'GSAP easing used for every transition.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '0.5',
    description: 'Strength of the internal image drift as panels resize (0 disables it).'
  },
  {
    name: 'tilt',
    type: 'number',
    default: '8',
    description: 'Degrees of 3D rotation applied to collapsed panels, easing to flat on the open one.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.06',
    description: 'Delay between the caption bar and text reveal, in seconds.'
  },
  {
    name: 'trigger',
    type: '"hover" | "click"',
    default: '"hover"',
    description: 'How a panel expands on pointer devices. Focus and tap always expand too.'
  },
  {
    name: 'height',
    type: 'number',
    default: '460',
    description: 'Height of the row in pixels (width of the column when vertical).'
  },
  {
    name: 'gap',
    type: 'number',
    default: '10',
    description: 'Gap between panels in pixels.'
  },
  {
    name: 'radius',
    type: 'number',
    default: '16',
    description: 'Corner radius of each panel in pixels.'
  },
  {
    name: 'expandRatio',
    type: 'number',
    default: '0.52',
    description: 'Fraction of the row the expanded panel occupies (0.2 – 0.9).'
  },
  {
    name: 'orientation',
    type: '"horizontal" | "vertical"',
    default: '"horizontal"',
    description: 'Lay the accordion out as a row or a column.'
  }
];

export default function AccordionGalleryDemo() {
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
          <div
            class="demo-container"
            style={{ position: 'relative', height: '560px', padding: '24px', overflow: 'hidden' }}
          >
            <AccordionGallery items={ITEMS} {...(props() as AccordionGalleryProps)} />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Accent Color"
              color={props().accentColor}
              onChange={v => updateProp('accentColor', v)}
            />
            <PreviewColorPickerCustom
              title="Overlay Color"
              color={props().overlayColor}
              onChange={v => updateProp('overlayColor', v)}
            />
            <PreviewColorPickerCustom
              title="Text Color"
              color={props().textColor}
              onChange={v => updateProp('textColor', v)}
            />

            <PreviewSlider
              title="Default Index"
              min={0}
              max={ITEMS.length - 1}
              step={1}
              value={props().defaultIndex}
              onChange={v => updateProp('defaultIndex', v)}
            />

            <PreviewSwitch title="Grayscale" isChecked={props().grayscale} onChange={v => updateProp('grayscale', v)} />
            <PreviewSwitch
              title="Show Labels"
              isChecked={props().showLabels}
              onChange={v => updateProp('showLabels', v)}
            />

            <PreviewSelect
              title="Trigger"
              options={triggerOptions}
              value={props().trigger}
              onChange={v => updateProp('trigger', v)}
            />

            <PreviewSelect
              title="Ease"
              options={easeOptions}
              value={props().ease}
              onChange={v => updateProp('ease', v)}
            />

            <PreviewSlider
              title="Duration"
              min={0.2}
              max={1.2}
              step={0.05}
              value={props().duration}
              valueUnit="s"
              onChange={v => updateProp('duration', v)}
            />

            <PreviewSlider
              title="Parallax"
              min={0}
              max={1.5}
              step={0.05}
              value={props().parallax}
              onChange={v => updateProp('parallax', v)}
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
              title="Stagger"
              min={0}
              max={0.15}
              step={0.01}
              value={props().stagger}
              valueUnit="s"
              onChange={v => updateProp('stagger', v)}
            />

            <PreviewSelect
              title="Orientation"
              options={orientationOptions}
              value={props().orientation}
              onChange={v => updateProp('orientation', v)}
            />

            <PreviewSlider
              title="Height"
              min={320}
              max={560}
              step={10}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />

            <PreviewSlider
              title="Expand Ratio"
              min={0.3}
              max={0.8}
              step={0.02}
              value={props().expandRatio}
              onChange={v => updateProp('expandRatio', v)}
            />

            <PreviewSlider
              title="Gap"
              min={0}
              max={30}
              step={1}
              value={props().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />

            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={accordionGallery} componentName="AccordionGallery" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
