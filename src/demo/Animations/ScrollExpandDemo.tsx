import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';

import ScrollExpand from '@/content/Animations/ScrollExpand/ScrollExpand';
import { scrollExpand } from '@/constants/code/Animations/scrollExpandCode';

const DEMO_SRC = 'https://picsum.photos/seed/scroll-expand/1600/1000';

const DEFAULT_PROPS = {
  title: 'Built to scale',
  scrollHint: 'Scroll inside the frame',
  startWidth: 42,
  startHeight: 58,
  startRadius: 24,
  endRadius: 0,
  mediaZoom: 1.35,
  scrollDistance: 1.2,
  holdDistance: 0.35,
  smoothing: 0.1,
  overlayScrim: 0.45,
  enabled: true
};

const TITLE_OPTIONS = [
  { label: 'Built to scale', value: 'Built to scale' },
  { label: 'See it bigger', value: 'See it bigger' },
  { label: 'None', value: '' }
];

const propData: PropRow[] = [
  { name: 'src', type: 'string', default: "''", description: 'Image or video URL shown inside the frame.' },
  {
    name: 'mediaType',
    type: '"image" | "video"',
    default: '"image"',
    description: 'Whether the source is an image or a looping muted video.'
  },
  { name: 'poster', type: 'string', default: "''", description: 'Poster frame used while a video loads.' },
  { name: 'alt', type: 'string', default: "''", description: 'Alt text for the image.' },
  {
    name: 'title',
    type: 'string',
    default: "''",
    description: 'Headline held over the frame that lifts away as the media takes over.'
  },
  {
    name: 'scrollHint',
    type: 'string',
    default: "''",
    description: 'Small cue shown under the resting frame that fades away as soon as the scroll begins.'
  },
  {
    name: 'startWidth',
    type: 'number',
    default: '42',
    description: 'Frame width before expanding, as a percentage of the stage.'
  },
  {
    name: 'startHeight',
    type: 'number',
    default: '58',
    description: 'Frame height before expanding, as a percentage of the stage.'
  },
  { name: 'startRadius', type: 'number', default: '24', description: 'Corner radius of the resting frame, in px.' },
  { name: 'endRadius', type: 'number', default: '0', description: 'Corner radius once fully expanded, in px.' },
  {
    name: 'mediaZoom',
    type: 'number',
    default: '1.35',
    description: 'How far the media is zoomed in at rest. It eases back to 1 as the frame opens up.'
  },
  {
    name: 'scrollDistance',
    type: 'number',
    default: '1.2',
    description: 'Scroll length of the expansion, in multiples of the stage height.'
  },
  {
    name: 'holdDistance',
    type: 'number',
    default: '0.35',
    description: 'Extra scroll the frame stays pinned at full bleed before releasing.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.1',
    description: 'Follow time in seconds. 0 locks the frame exactly to the scrollbar.'
  },
  {
    name: 'overlayScrim',
    type: 'number',
    default: '0.45',
    description: 'Strength of the gradient scrim that fades in to keep overlay content readable.'
  },
  {
    name: 'useWindowScroll',
    type: 'boolean',
    default: 'false',
    description: 'Drive the expansion from the page scroll instead of the component’s own scroller.'
  },
  { name: 'enabled', type: 'boolean', default: 'true', description: 'Enable or disable the expansion.' },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '—',
    description: 'Content that fades in over the media once it reaches full bleed.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Additional class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '—', description: 'Inline styles for the container.' }
];

export default function ScrollExpandDemo() {
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
          <div class="demo-container" style={{ position: 'relative', height: '520px', padding: 0, overflow: 'hidden' }}>
            <ScrollExpand
              src={DEMO_SRC}
              alt="Mountain range at sunrise"
              title={props().title}
              scrollHint={props().scrollHint}
              startWidth={props().startWidth}
              startHeight={props().startHeight}
              startRadius={props().startRadius}
              endRadius={props().endRadius}
              mediaZoom={props().mediaZoom}
              scrollDistance={props().scrollDistance}
              holdDistance={props().holdDistance}
              smoothing={props().smoothing}
              overlayScrim={props().overlayScrim}
              enabled={props().enabled}
            >
              <p
                style={{
                  margin: 0,
                  'font-size': '2rem',
                  'font-weight': 500,
                  color: '#fff',
                  'letter-spacing': '-0.02em',
                  'line-height': '1.1'
                }}
              >
                Every pixel, everywhere
              </p>
              <p
                style={{
                  margin: '0.75rem 0 0',
                  'font-size': '1rem',
                  color: 'rgba(255,255,255,0.72)',
                  'max-width': '30rem'
                }}
              >
                The frame opens up as you scroll and hands the whole stage to your media.
              </p>
            </ScrollExpand>
          </div>

          <Customize>
            <PreviewSelect
              title="Title"
              options={TITLE_OPTIONS}
              value={props().title}
              onChange={v => updateProp('title', v)}
              width={170}
            />
            <PreviewSlider
              title="Start Width"
              min={15}
              max={90}
              step={1}
              value={props().startWidth}
              valueUnit="%"
              onChange={v => updateProp('startWidth', v)}
            />
            <PreviewSlider
              title="Start Height"
              min={15}
              max={90}
              step={1}
              value={props().startHeight}
              valueUnit="%"
              onChange={v => updateProp('startHeight', v)}
            />
            <PreviewSlider
              title="Start Radius"
              min={0}
              max={80}
              step={1}
              value={props().startRadius}
              valueUnit="px"
              onChange={v => updateProp('startRadius', v)}
            />
            <PreviewSlider
              title="End Radius"
              min={0}
              max={80}
              step={1}
              value={props().endRadius}
              valueUnit="px"
              onChange={v => updateProp('endRadius', v)}
            />
            <PreviewSlider
              title="Media Zoom"
              min={1}
              max={2}
              step={0.01}
              value={props().mediaZoom}
              onChange={v => updateProp('mediaZoom', v)}
            />
            <PreviewSlider
              title="Scroll Distance"
              min={0.5}
              max={3}
              step={0.1}
              value={props().scrollDistance}
              onChange={v => updateProp('scrollDistance', v)}
            />
            <PreviewSlider
              title="Hold Distance"
              min={0}
              max={1.5}
              step={0.05}
              value={props().holdDistance}
              onChange={v => updateProp('holdDistance', v)}
            />
            <PreviewSlider
              title="Smoothing"
              min={0}
              max={0.4}
              step={0.01}
              value={props().smoothing}
              valueUnit="s"
              onChange={v => updateProp('smoothing', v)}
            />
            <PreviewSlider
              title="Overlay Scrim"
              min={0}
              max={1}
              step={0.01}
              value={props().overlayScrim}
              onChange={v => updateProp('overlayScrim', v)}
            />
            <PreviewSwitch title="Enabled" isChecked={props().enabled} onChange={v => updateProp('enabled', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={scrollExpand} componentName="ScrollExpand" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
