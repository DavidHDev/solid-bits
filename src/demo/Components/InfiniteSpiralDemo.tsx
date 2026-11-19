import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import InfiniteSpiral, { type InfiniteSpiralProps } from '@/content/Components/InfiniteSpiral/InfiniteSpiral';
import { infiniteSpiral } from '@/constants/code/Components/infiniteSpiralCode';

const DEMO_ITEMS = [
  {
    src: 'https://images.unsplash.com/photo-1781764177519-9c9c88733c3e?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 1 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1774009485852-13a515d32e36?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 2 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1705032033999-efa3082e1a4e?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 3 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1709699714159-29bc3ac99486?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 4 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1763440519433-5467759054fc?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 5 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1724152312974-d4d48b8b36fd?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 6 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1656651356997-71fcb0f04d3b?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 7 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1636269603887-702d9a201bb4?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 8 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1772440337285-8b5674e1ee8a?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 9 by Eugene Golovesov'
  },
  {
    src: 'https://images.unsplash.com/photo-1762846818262-33c197852fa8?auto=format&fit=crop&w=900&q=80',
    alt: 'Photograph 10 by Eugene Golovesov'
  }
];

const DEFAULT_PROPS = {
  speed: 0.55,
  direction: 'up',
  animationMode: 'auto',
  radius: 170,
  cardWidth: 100,
  cardHeight: 100,
  verticalSpacing: 60,
  perspective: 1000,
  cardsPerTurn: 7,
  rotation: 0,
  cardTilt: 0,
  cardRadius: 10,
  centerScale: 1.2,
  edgeFade: 0.3,
  edgeBlur: 6,
  pauseOnHover: true,
  imageFit: 'cover',
  grayscale: 1
};

const DIRECTION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const ANIMATION_MODE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'drag', label: 'Drag' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'all', label: 'All' }
];

const IMAGE_FIT_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: '(string | SpiralItem)[]',
    default: '[]',
    description: 'Images shown in the spiral. Objects may also include alt, href, target, label and id.'
  },
  {
    name: 'speed',
    type: 'number',
    default: '0.55',
    description: 'Automatic travel speed in cards per second and the sensitivity of scroll-controlled motion.'
  },
  { name: 'direction', type: '"up" | "down"', default: '"up"', description: 'Vertical travel direction.' },
  {
    name: 'animationMode',
    type: '"auto" | "drag" | "scroll" | "all"',
    default: '"auto"',
    description: 'Selects automatic motion, pointer dragging, page-scroll control or all interactions.'
  },
  { name: 'radius', type: 'number', default: '170', description: 'Depth radius of the helix in pixels.' },
  { name: 'cardWidth', type: 'number', default: '100', description: 'Card width in pixels.' },
  { name: 'cardHeight', type: 'number', default: '100', description: 'Card height in pixels.' },
  {
    name: 'verticalSpacing',
    type: 'number',
    default: '60',
    description: 'Vertical distance between neighboring cards.'
  },
  { name: 'perspective', type: 'number', default: '1000', description: 'CSS perspective applied to the 3D stage.' },
  {
    name: 'cardsPerTurn',
    type: 'number',
    default: '7',
    description: 'Number of cards used for one complete revolution.'
  },
  { name: 'rotation', type: 'number', default: '0', description: 'Global angular offset in degrees.' },
  { name: 'cardTilt', type: 'number', default: '0', description: 'Additional clockwise card tilt in degrees.' },
  { name: 'cardRadius', type: 'number', default: '10', description: 'Card corner radius in pixels.' },
  {
    name: 'centerScale',
    type: 'number',
    default: '1.2',
    description: 'Scale multiplier for cards nearest the center.'
  },
  {
    name: 'edgeFade',
    type: 'number',
    default: '0.3',
    description: 'Fraction of the outer travel range used for fading.'
  },
  { name: 'edgeBlur', type: 'number', default: '6', description: 'Maximum blur applied near the edges.' },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'true',
    description: 'Smoothly eases automatic motion to a stop while the gallery is hovered.'
  },
  {
    name: 'imageFit',
    type: '"cover" | "contain"',
    default: '"cover"',
    description: 'Object fit used by every image.'
  },
  {
    name: 'grayscale',
    type: 'number',
    default: '0',
    description: 'Grayscale amount applied to every image, from 0 to 1.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Additional class names for the root element.' }
];

export default function InfiniteSpiralDemo() {
  const { props, resetProps, updateProp, hasChanges } = useComponentProps(DEFAULT_PROPS);

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '620px', padding: 0, overflow: 'hidden' }}>
            <InfiniteSpiral items={DEMO_ITEMS} {...(props() as InfiniteSpiralProps)} />
          </div>

          <Customize>
            <PreviewSelect
              title="Animation Mode"
              options={ANIMATION_MODE_OPTIONS}
              value={props().animationMode}
              onChange={v => updateProp('animationMode', v)}
            />
            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={props().direction}
              onChange={v => updateProp('direction', v)}
            />
            <PreviewSelect
              title="Image Fit"
              options={IMAGE_FIT_OPTIONS}
              value={props().imageFit}
              onChange={v => updateProp('imageFit', v)}
            />
            <PreviewSlider
              title="Grayscale"
              min={0}
              max={1}
              step={0.05}
              value={props().grayscale}
              onChange={v => updateProp('grayscale', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={2}
              step={0.05}
              value={props().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Radius"
              min={100}
              max={420}
              step={5}
              value={props().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />
            <PreviewSlider
              title="Card Width"
              min={80}
              max={260}
              step={4}
              value={props().cardWidth}
              valueUnit="px"
              onChange={v => updateProp('cardWidth', v)}
            />
            <PreviewSlider
              title="Card Height"
              min={60}
              max={200}
              step={4}
              value={props().cardHeight}
              valueUnit="px"
              onChange={v => updateProp('cardHeight', v)}
            />
            <PreviewSlider
              title="Spacing"
              min={24}
              max={120}
              step={2}
              value={props().verticalSpacing}
              valueUnit="px"
              onChange={v => updateProp('verticalSpacing', v)}
            />
            <PreviewSlider
              title="Perspective"
              min={500}
              max={1800}
              step={25}
              value={props().perspective}
              valueUnit="px"
              onChange={v => updateProp('perspective', v)}
            />
            <PreviewSlider
              title="Cards Per Turn"
              min={3}
              max={14}
              step={1}
              value={props().cardsPerTurn}
              onChange={v => updateProp('cardsPerTurn', v)}
            />
            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={2}
              value={props().rotation}
              valueUnit="deg"
              onChange={v => updateProp('rotation', v)}
            />
            <PreviewSlider
              title="Card Tilt"
              min={-30}
              max={30}
              step={1}
              value={props().cardTilt}
              valueUnit="deg"
              onChange={v => updateProp('cardTilt', v)}
            />
            <PreviewSlider
              title="Corner Radius"
              min={0}
              max={40}
              step={1}
              value={props().cardRadius}
              valueUnit="px"
              onChange={v => updateProp('cardRadius', v)}
            />
            <PreviewSlider
              title="Center Scale"
              min={0.8}
              max={1.6}
              step={0.02}
              value={props().centerScale}
              onChange={v => updateProp('centerScale', v)}
            />
            <PreviewSlider
              title="Edge Fade"
              min={0}
              max={0.8}
              step={0.02}
              value={props().edgeFade}
              onChange={v => updateProp('edgeFade', v)}
            />
            <PreviewSlider
              title="Edge Blur"
              min={0}
              max={10}
              step={0.25}
              value={props().edgeBlur}
              valueUnit="px"
              onChange={v => updateProp('edgeBlur', v)}
            />
            <PreviewSwitch
              title="Pause On Hover"
              isChecked={props().pauseOnHover}
              onChange={v => updateProp('pauseOnHover', v)}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={infiniteSpiral} componentName="InfiniteSpiral" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
