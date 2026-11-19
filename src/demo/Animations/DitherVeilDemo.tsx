import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { isLight } from '@/hooks/useTheme';

import DitherVeil, { type DitherVeilProps } from '@/content/Animations/DitherVeil/DitherVeil';
import { ditherVeil } from '@/constants/code/Animations/ditherVeilCode';

const DEFAULT_PROPS = {
  fit: 'contain',
  inkColor: '#0c0f13',
  paperColor: '#f4f1ea',
  rimColor: '#6ec9f7',
  pattern: 'floyd',
  palette: 'duotone',
  pixelSize: 2,
  levels: 2,
  contrast: 1.15,
  brightness: 0,
  revealRadius: 200,
  softness: 0.6,
  linger: 1,
  rim: 0,
  reverse: false,
  wander: false,
  clickBurst: true
};

const PATTERN_OPTIONS = [
  { label: 'Bayer', value: 'bayer' },
  { label: 'Blue Noise', value: 'noise' },
  { label: 'Atkinson', value: 'atkinson' },
  { label: 'Floyd-Steinberg', value: 'floyd' },
  { label: 'Lines', value: 'lines' }
];

const FIT_OPTIONS = [
  { label: 'Contain', value: 'contain' },
  { label: 'Cover', value: 'cover' }
];

const PALETTE_OPTIONS = [
  { label: 'Duotone', value: 'duotone' },
  { label: 'RGB', value: 'rgb' }
];

const propData: PropRow[] = [
  {
    name: 'src',
    type: 'string',
    default: "'https://images.unsplash.com/...'",
    description: 'Image to veil. Must be served with CORS headers.'
  },
  {
    name: 'fit',
    type: "'contain' | 'cover'",
    default: "'contain'",
    description: 'Show the whole image on the ink, or crop it to fill the container.'
  },
  {
    name: 'pattern',
    type: "'bayer' | 'noise' | 'atkinson' | 'floyd' | 'lines'",
    default: "'floyd'",
    description:
      'How the image is broken into dots: an ordered Bayer grid, blue noise stipple, Atkinson or Floyd-Steinberg error diffusion, or diagonal engraving lines.'
  },
  {
    name: 'palette',
    type: "'duotone' | 'rgb'",
    default: "'duotone'",
    description:
      'Duotone maps brightness between the ink and paper colours. RGB dithers each channel for a retro colour look.'
  },
  { name: 'pixelSize', type: 'number', default: '2', description: 'Size of each dither cell, in px.' },
  {
    name: 'levels',
    type: 'number',
    default: '2',
    description: 'Tones per channel. 2 is pure 1-bit, higher values add in-between shades.'
  },
  { name: 'inkColor', type: 'string', default: "'#0c0f13'", description: 'Colour of the darkest tone.' },
  { name: 'paperColor', type: 'string', default: "'#f4f1ea'", description: 'Colour of the lightest tone.' },
  {
    name: 'contrast',
    type: 'number',
    default: '1.15',
    description: 'Tonal contrast applied before dithering.'
  },
  {
    name: 'brightness',
    type: 'number',
    default: '0',
    description: 'Shifts the image lighter or darker before dithering.'
  },
  {
    name: 'revealRadius',
    type: 'number',
    default: '200',
    description: 'Radius of the full-colour window around the cursor, in px.'
  },
  {
    name: 'softness',
    type: 'number',
    default: '0.6',
    description: 'How much of the reveal edge dissolves through the dither. 0 is a hard cut.'
  },
  {
    name: 'linger',
    type: 'number',
    default: '1',
    description: 'Seconds the revealed trail takes to knit back into dither. 0 turns the trail off.'
  },
  {
    name: 'rimColor',
    type: 'string',
    default: "'#6ec9f7'",
    description: 'Colour of the cells along the dissolving edge.'
  },
  {
    name: 'rim',
    type: 'number',
    default: '0',
    description: 'Thickness of the coloured rim on the dissolving edge. 0 hides it.'
  },
  {
    name: 'reverse',
    type: 'boolean',
    default: 'false',
    description: 'Start in full colour and dither wherever the cursor goes.'
  },
  {
    name: 'wander',
    type: 'boolean',
    default: 'false',
    description: 'Let the reveal drift around on its own while the pointer is away.'
  },
  {
    name: 'clickBurst',
    type: 'boolean',
    default: 'true',
    description: 'Clicking sends a ring of colour rippling out across the image.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra classes on the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles on the container.' }
];

export default function DitherVeilDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);

  const renderedInk = createMemo(() => {
    const value = props().inkColor;
    return isLight() && value === DEFAULT_PROPS.inkColor ? '#ffffff' : value;
  });
  const renderedPaper = createMemo(() => {
    const value = props().paperColor;
    return isLight() && value === DEFAULT_PROPS.paperColor ? '#12161c' : value;
  });
  const renderedRim = createMemo(() => {
    const value = props().rimColor;
    return isLight() && value === DEFAULT_PROPS.rimColor ? '#0977ae' : value;
  });

  const settings = createMemo(
    () =>
      ({
        ...props(),
        inkColor: renderedInk(),
        paperColor: renderedPaper(),
        rimColor: renderedRim()
      }) as DitherVeilProps
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
          <div class="demo-container" style={{ position: 'relative', height: '600px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>{() => <DitherVeil {...settings()} />}</Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Ink" color={renderedInk()} onChange={v => updateProp('inkColor', v)} />
            <PreviewColorPickerCustom
              title="Paper"
              color={renderedPaper()}
              onChange={v => updateProp('paperColor', v)}
            />
            <PreviewColorPickerCustom
              title="Rim Color"
              color={renderedRim()}
              onChange={v => updateProp('rimColor', v)}
            />

            <PreviewSelect title="Fit" options={FIT_OPTIONS} value={props().fit} onChange={v => updateProp('fit', v)} />
            <PreviewSelect
              title="Pattern"
              options={PATTERN_OPTIONS}
              value={props().pattern}
              onChange={v => updateProp('pattern', v)}
            />
            <PreviewSelect
              title="Palette"
              options={PALETTE_OPTIONS}
              value={props().palette}
              onChange={v => updateProp('palette', v)}
            />
            <PreviewSlider
              title="Pixel Size"
              min={1}
              max={10}
              step={1}
              value={props().pixelSize}
              valueUnit="px"
              onChange={v => updateProp('pixelSize', v)}
            />
            <PreviewSlider
              title="Levels"
              min={2}
              max={6}
              step={1}
              value={props().levels}
              onChange={v => updateProp('levels', v)}
            />
            <PreviewSlider
              title="Contrast"
              min={0.5}
              max={2}
              step={0.05}
              value={props().contrast}
              onChange={v => updateProp('contrast', v)}
            />
            <PreviewSlider
              title="Brightness"
              min={-0.4}
              max={0.4}
              step={0.02}
              value={props().brightness}
              onChange={v => updateProp('brightness', v)}
            />

            <PreviewSlider
              title="Reveal Radius"
              min={40}
              max={300}
              step={5}
              value={props().revealRadius}
              valueUnit="px"
              onChange={v => updateProp('revealRadius', v)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.05}
              value={props().softness}
              onChange={v => updateProp('softness', v)}
            />
            <PreviewSlider
              title="Linger"
              min={0}
              max={4}
              step={0.1}
              value={props().linger}
              valueUnit="s"
              onChange={v => updateProp('linger', v)}
            />
            <PreviewSlider
              title="Rim"
              min={0}
              max={0.6}
              step={0.02}
              value={props().rim}
              onChange={v => updateProp('rim', v)}
            />

            <PreviewSwitch title="Reverse" isChecked={props().reverse} onChange={v => updateProp('reverse', v)} />
            <PreviewSwitch title="Wander" isChecked={props().wander} onChange={v => updateProp('wander', v)} />
            <PreviewSwitch
              title="Click Burst"
              isChecked={props().clickBurst}
              onChange={v => updateProp('clickBurst', v)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={ditherVeil} componentName="DitherVeil" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
