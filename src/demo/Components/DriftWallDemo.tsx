import { createMemo } from 'solid-js';
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

import DriftWall, { type DriftWallProps } from '@/content/Components/DriftWall/DriftWall';
import { driftWall } from '@/constants/code/Components/driftWallCode';

const IMAGE_IDS = [1015, 1025, 1039, 1043, 1044, 1050, 1062, 1069, 1074, 1080, 1084, 106, 110, 133, 164, 177];

const items = IMAGE_IDS.map((id, i) => ({
  image: `https://picsum.photos/id/${id}/600/400`,
  title: `Tile ${i + 1}`,
  href: 'https://solid-bits.dev'
}));

const DEFAULT_PROPS = {
  columns: 5,
  tileWidth: 200,
  tileHeight: 132,
  gap: 18,
  radius: 14,
  tilt: 16,
  turn: -14,
  roll: 0,
  perspective: 1200,
  depth: 120,
  speed: 42,
  direction: 'up',
  variance: 0.45,
  parallax: 0.6,
  pauseOnHover: false,
  lift: 64,
  fade: 0.6,
  dim: 0.55,
  grayscale: false,
  overlayColor: '#000710'
};

const DIRECTION_OPTIONS = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' }
];

const propData: PropRow[] = [
  {
    name: 'items',
    type: 'array',
    default: '15 demo tiles',
    description: 'Tiles to display. Each item has { image, title?, href? }.'
  },
  { name: 'columns', type: 'number', default: '5', description: 'Number of drifting columns.' },
  { name: 'tileWidth', type: 'number', default: '200', description: 'Width of each tile in pixels.' },
  { name: 'tileHeight', type: 'number', default: '132', description: 'Height of each tile in pixels.' },
  { name: 'gap', type: 'number', default: '18', description: 'Spacing between tiles and columns in pixels.' },
  { name: 'radius', type: 'number', default: '14', description: 'Corner radius of each tile in pixels.' },
  { name: 'tilt', type: 'number', default: '16', description: 'Perspective pitch of the wall (rotateX, degrees).' },
  { name: 'turn', type: 'number', default: '-14', description: 'Perspective yaw of the wall (rotateY, degrees).' },
  { name: 'roll', type: 'number', default: '0', description: 'In-plane rotation of the wall (rotateZ, degrees).' },
  {
    name: 'perspective',
    type: 'number',
    default: '1200',
    description: 'Perspective distance in pixels — smaller is more dramatic.'
  },
  {
    name: 'depth',
    type: 'number',
    default: '120',
    description: 'How far the wall sits back from the viewer in pixels.'
  },
  { name: 'speed', type: 'number', default: '42', description: 'Base drift speed in pixels per second.' },
  {
    name: 'direction',
    type: '"up" | "down"',
    default: '"up"',
    description: 'Primary drift direction; columns alternate around it.'
  },
  {
    name: 'variance',
    type: 'number',
    default: '0.45',
    description: 'How much column speeds differ from each other (0–1).'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '0.6',
    description: 'Pointer-follow tilt strength (0 disables it).'
  },
  {
    name: 'pauseOnHover',
    type: 'boolean',
    default: 'false',
    description: 'Pause the whole wall while the pointer is over it.'
  },
  {
    name: 'lift',
    type: 'number',
    default: '64',
    description: 'How far a hovered tile lifts toward the viewer in pixels.'
  },
  { name: 'fade', type: 'number', default: '0.6', description: 'Strength of the edge and depth dissolve (0–1).' },
  { name: 'dim', type: 'number', default: '0.55', description: 'Resting opacity of unhovered tiles (0–1).' },
  {
    name: 'grayscale',
    type: 'boolean',
    default: 'false',
    description: 'Desaturate resting tiles; hover restores colour.'
  },
  {
    name: 'overlayColor',
    type: 'string',
    default: '"#000710"',
    description: 'Tint laid over resting tiles, cleared on hover.'
  }
];

export default function DriftWallDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => props() as DriftWallProps & typeof DEFAULT_PROPS);

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '600px', padding: 0, overflow: 'hidden' }}>
            <DriftWall items={items} {...settings()} />
          </div>

          <Customize>
            <PreviewColorPickerCustom
              title="Overlay"
              color={settings().overlayColor}
              onChange={v => updateProp('overlayColor', v)}
            />

            <PreviewSlider
              title="Columns"
              min={2}
              max={8}
              step={1}
              value={settings().columns}
              onChange={v => updateProp('columns', v)}
            />

            <PreviewSlider
              title="Tile Width"
              min={120}
              max={280}
              step={4}
              value={settings().tileWidth}
              valueUnit="px"
              onChange={v => updateProp('tileWidth', v)}
            />

            <PreviewSlider
              title="Tile Height"
              min={90}
              max={220}
              step={2}
              value={settings().tileHeight}
              valueUnit="px"
              onChange={v => updateProp('tileHeight', v)}
            />

            <PreviewSlider
              title="Gap"
              min={0}
              max={48}
              step={2}
              value={settings().gap}
              valueUnit="px"
              onChange={v => updateProp('gap', v)}
            />

            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={settings().radius}
              valueUnit="px"
              onChange={v => updateProp('radius', v)}
            />

            <PreviewSelect
              title="Direction"
              options={DIRECTION_OPTIONS}
              value={settings().direction}
              onChange={(v: 'up' | 'down') => updateProp('direction', v)}
            />

            <PreviewSlider
              title="Speed"
              min={0}
              max={120}
              step={2}
              value={settings().speed}
              onChange={v => updateProp('speed', v)}
            />

            <PreviewSlider
              title="Variance"
              min={0}
              max={1}
              step={0.05}
              value={settings().variance}
              onChange={v => updateProp('variance', v)}
            />

            <PreviewSlider
              title="Tilt"
              min={-30}
              max={40}
              step={1}
              value={settings().tilt}
              valueUnit="°"
              onChange={v => updateProp('tilt', v)}
            />

            <PreviewSlider
              title="Turn"
              min={-30}
              max={30}
              step={1}
              value={settings().turn}
              valueUnit="°"
              onChange={v => updateProp('turn', v)}
            />

            <PreviewSlider
              title="Roll"
              min={-20}
              max={20}
              step={1}
              value={settings().roll}
              valueUnit="°"
              onChange={v => updateProp('roll', v)}
            />

            <PreviewSlider
              title="Perspective"
              min={600}
              max={2400}
              step={50}
              value={settings().perspective}
              valueUnit="px"
              onChange={v => updateProp('perspective', v)}
            />

            <PreviewSlider
              title="Depth"
              min={0}
              max={400}
              step={10}
              value={settings().depth}
              valueUnit="px"
              onChange={v => updateProp('depth', v)}
            />

            <PreviewSlider
              title="Parallax"
              min={0}
              max={2}
              step={0.1}
              value={settings().parallax}
              onChange={v => updateProp('parallax', v)}
            />

            <PreviewSlider
              title="Lift"
              min={0}
              max={140}
              step={4}
              value={settings().lift}
              valueUnit="px"
              onChange={v => updateProp('lift', v)}
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
              title="Dim"
              min={0.15}
              max={1}
              step={0.05}
              value={settings().dim}
              onChange={v => updateProp('dim', v)}
            />

            <PreviewSwitch
              title="Pause on Hover"
              isChecked={settings().pauseOnHover}
              onChange={v => updateProp('pauseOnHover', v)}
            />

            <PreviewSwitch
              title="Grayscale"
              isChecked={settings().grayscale}
              onChange={v => updateProp('grayscale', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={driftWall} componentName="DriftWall" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
