import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import DomeGallery from '@/content/Components/DomeGallery/DomeGallery';
import { domeGallery } from '@/constants/code/Components/domeGalleryCode';

const DEFAULT_PROPS = {
  fit: 0.8,
  minRadius: 600,
  maxVerticalRotationDeg: 0,
  segments: 34,
  dragDampening: 2,
  grayscale: true
};

const propData: PropRow[] = [
  {
    name: 'images',
    type: '(string | { src: string; alt?: string })[]',
    default: 'DEFAULT_IMAGES',
    description: 'Array of image URLs (strings) or image objects with src and optional alt text'
  },
  {
    name: 'fit',
    type: 'number',
    default: '0.5',
    description: 'Size factor for the dome radius based on container dimensions'
  },
  {
    name: 'fitBasis',
    type: "'auto' | 'min' | 'max' | 'width' | 'height'",
    default: "'auto'",
    description: 'Basis for calculating the dome size'
  },
  {
    name: 'minRadius',
    type: 'number',
    default: '600',
    description: 'Minimum radius for the dome in pixels'
  },
  {
    name: 'maxRadius',
    type: 'number',
    default: 'Infinity',
    description: 'Maximum radius for the dome in pixels'
  },
  {
    name: 'padFactor',
    type: 'number',
    default: '0.25',
    description: 'Padding factor for the viewer area'
  },
  {
    name: 'overlayBlurColor',
    type: 'string',
    default: "'#0c0f13'",
    description: 'Color for the outer portion of the radial overlay blur'
  },
  {
    name: 'maxVerticalRotationDeg',
    type: 'number',
    default: '5',
    description: 'Maximum vertical rotation angle in degrees'
  },
  {
    name: 'dragSensitivity',
    type: 'number',
    default: '20',
    description: 'Sensitivity of drag interactions'
  },
  {
    name: 'enlargeTransitionMs',
    type: 'number',
    default: '300',
    description: 'Duration of image enlargement transition in milliseconds'
  },
  {
    name: 'segments',
    type: 'number',
    default: '35',
    description: 'Number of segments for both X and Y to keep the dome proportional'
  },
  {
    name: 'dragDampening',
    type: 'number',
    default: '2',
    description: 'Damping factor for drag inertia (0-1, higher = more damping)'
  },
  {
    name: 'openedImageWidth',
    type: 'string',
    default: "'400px'",
    description: 'Width of the enlarged image'
  },
  {
    name: 'openedImageHeight',
    type: 'string',
    default: "'400px'",
    description: 'Height of the enlarged image'
  },
  {
    name: 'imageBorderRadius',
    type: 'string',
    default: "'30px'",
    description: 'Border radius for closed tile images'
  },
  {
    name: 'openedImageBorderRadius',
    type: 'string',
    default: "'30px'",
    description: 'Border radius for opened/enlarged images'
  },
  {
    name: 'grayscale',
    type: 'boolean',
    default: 'true',
    description: 'Whether to render all images in grayscale'
  }
];

export default function DomeGalleryDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const overlayBlurColor = useColorModeValue('#ffffff', '#0c0f13');

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <DomeGallery
              fit={props().fit}
              minRadius={props().minRadius}
              maxVerticalRotationDeg={props().maxVerticalRotationDeg}
              segments={props().segments}
              dragDampening={props().dragDampening}
              grayscale={props().grayscale}
              overlayBlurColor={overlayBlurColor()}
            />
          </div>

          <p
            style={{
              display: 'flex',
              gap: '0.4em',
              'margin-top': '1em',
              color: 'var(--text-muted)',
              'align-items': 'center'
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Click images to expand
          </p>

          <Customize>
            <PreviewSlider
              title="Fit"
              min={0.5}
              max={1}
              step={0.05}
              value={props().fit}
              onChange={value => {
                updateProp('fit', value);
              }}
            />

            <PreviewSlider
              title="Min Radius"
              min={300}
              max={1000}
              step={50}
              value={props().minRadius}
              valueUnit="px"
              onChange={value => {
                updateProp('minRadius', value);
              }}
            />

            <PreviewSlider
              title="Max Vertical Rotation"
              min={0}
              max={20}
              step={1}
              value={props().maxVerticalRotationDeg}
              valueUnit="°"
              onChange={value => {
                updateProp('maxVerticalRotationDeg', value);
              }}
            />

            <PreviewSlider
              title="Segments"
              min={20}
              max={34}
              step={2}
              value={props().segments}
              onChange={value => {
                updateProp('segments', value);
              }}
            />

            <PreviewSlider
              title="Drag Dampening"
              min={0}
              max={5}
              step={0.2}
              value={props().dragDampening}
              onChange={value => {
                updateProp('dragDampening', value);
              }}
            />

            <PreviewSwitch
              title="Grayscale"
              isChecked={props().grayscale}
              onChange={checked => {
                updateProp('grayscale', checked);
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@use-gesture/vanilla']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={domeGallery} componentName="DomeGallery" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
