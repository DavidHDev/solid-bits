import { For, Match, Switch, createMemo } from 'solid-js';
import { PlayIcon, Ticket01Icon } from '@hugeicons/core-free-icons';
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
import HugeiconsIcon from '@/components/icons/HugeiconsIcon';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';

import TiltedCard, { TiltedCardLayer, type TiltedCardProps } from '@/content/Components/TiltedCard/TiltedCard';
import { tiltedCard } from '@/constants/code/Components/tiltedCardCode';
import './TiltedCardDemo.css';

type Theme = 'dark' | 'light';
type PhotoKey = 'sky' | 'field' | 'pier';

const PHOTOS: Record<Theme, Record<PhotoKey, string>> = {
  dark: {
    sky: '/assets/demo/night-sky.webp',
    field: '/assets/demo/night-landscape.webp',
    pier: '/assets/demo/night-portrait.webp'
  },
  light: {
    sky: '/assets/demo/day-sky.webp',
    field: '/assets/demo/day-landscape.webp',
    pier: '/assets/demo/day-portrait.webp'
  }
};

const TRACKS: [string, string][] = [
  ['Open Sky', '3:41'],
  ['Pier Lights', '4:05'],
  ['Canola', '2:58'],
  ['Low Tide', '3:22'],
  ['Last Light', '4:47']
];

const random = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const QR_SIZE = 21;
const QR = (() => {
  const next = random(42);
  const cells: [number, number][] = [];
  const finder = (x: number, y: number) => {
    const corners = [
      [0, 0],
      [QR_SIZE - 7, 0],
      [0, QR_SIZE - 7]
    ];
    for (const [cx, cy] of corners) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return 0;
        const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
        return ring === 3 || ring <= 1 ? 1 : 0;
      }
    }
    return -1;
  };
  for (let y = 0; y < QR_SIZE; y++) {
    for (let x = 0; x < QR_SIZE; x++) {
      const fixed = finder(x, y);
      const on = fixed >= 0 ? fixed : y === 6 || x === 6 ? (x + y) % 2 === 0 : next() > 0.52;
      if (on) cells.push([x, y]);
    }
  }
  return cells;
})();

const BARS = (() => {
  const next = random(7);
  const bars: [number, number][] = [];
  let y = 0;
  while (y < 96) {
    const height = next() > 0.6 ? 2.4 : 1.2;
    if (next() > 0.25) bars.push([y, height]);
    y += height + (next() > 0.5 ? 1.6 : 1.1);
  }
  return bars;
})();

type CardSettings = Partial<TiltedCardProps>;

function Tracklist(props: { cover: string }) {
  return (
    <div class="tcd-tracks">
      <div class="tcd-tracks__head">
        <img class="tcd-tracks__cover" src={props.cover} alt="" draggable="false" />
        <div class="tcd-tracks__title">
          <strong>Open Sky</strong>
          <span>Blue Hour · 5 tracks</span>
        </div>
      </div>
      <ol class="tcd-tracks__list">
        <For each={TRACKS}>
          {([name, length], index) => (
            <li data-current={index() === 0 ? '' : undefined}>
              <span class="tcd-tracks__number">{index() + 1}</span>
              <span class="tcd-tracks__name">{name}</span>
              <span class="tcd-tracks__length">{length}</span>
            </li>
          )}
        </For>
      </ol>
    </div>
  );
}

function AlbumScene(props: { card: CardSettings; theme: Theme }) {
  const cover = () => PHOTOS[props.theme].sky;
  return (
    <div class="tcd-album">
      <TiltedCard
        imageSrc={cover()}
        altText="Open Sky album cover"
        captionText="Open Sky — Blue Hour"
        containerWidth="100%"
        containerHeight="100%"
        imageWidth="100%"
        imageHeight="100%"
        backContent={<Tracklist cover={cover()} />}
        {...props.card}
      >
        <span class="tcd-scrim" />
        <TiltedCardLayer depth={28}>
          <div class="tcd-album__meta">
            <strong>Open Sky</strong>
            <span>Blue Hour</span>
          </div>
        </TiltedCardLayer>
        <TiltedCardLayer depth={52}>
          <span class="tcd-album__play">
            <HugeiconsIcon icon={PlayIcon} size={18} strokeWidth={2} />
          </span>
        </TiltedCardLayer>
      </TiltedCard>
    </div>
  );
}

const GALLERY: { key: PhotoKey; title: string; note: Record<Theme, string> }[] = [
  { key: 'pier', title: 'The Pier', note: { dark: 'Dusk', light: 'Clear sky' } },
  { key: 'field', title: 'Canola Field', note: { dark: 'Moonrise', light: 'Midday' } },
  { key: 'sky', title: 'Open Sky', note: { dark: 'Blue hour', light: 'Golden hour' } }
];

function GalleryScene(props: { card: CardSettings; theme: Theme }) {
  return (
    <div class="tcd-gallery">
      <For each={GALLERY}>
        {(item, index) => (
          <div class="tcd-gallery__cell">
            <TiltedCard
              imageSrc={PHOTOS[props.theme][item.key]}
              altText={item.title}
              captionText={item.title}
              containerWidth="100%"
              containerHeight="100%"
              imageWidth="100%"
              imageHeight="100%"
              introDelay={index() * 110}
              {...props.card}
            >
              <span class="tcd-scrim" />
              <TiltedCardLayer depth={30}>
                <div class="tcd-gallery__meta">
                  <strong>{item.title}</strong>
                  <span>{item.note[props.theme]}</span>
                </div>
              </TiltedCardLayer>
            </TiltedCard>
          </div>
        )}
      </For>
    </div>
  );
}

function QrCode() {
  return (
    <svg class="tcd-qr" viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} shape-rendering="crispEdges" aria-hidden="true">
      <For each={QR}>{([x, y]) => <rect x={x} y={y} width="1" height="1" />}</For>
    </svg>
  );
}

function TicketBack() {
  return (
    <div class="tcd-ticket tcd-ticket--back">
      <QrCode />
      <div class="tcd-ticket__scan">
        <strong>Scan at the gate</strong>
        <span>Ticket 0042 · Seat B 12</span>
      </div>
    </div>
  );
}

function TicketScene(props: { card: CardSettings }) {
  return (
    <div class="tcd-ticket-stage">
      <TiltedCard
        altText="Night Sky Live ticket"
        captionText="Admit one"
        containerWidth="100%"
        containerHeight="100%"
        imageWidth="100%"
        imageHeight="100%"
        backContent={<TicketBack />}
        className="tcd-ticket-card"
        {...props.card}
      >
        <div class="tcd-ticket">
          <TiltedCardLayer depth={22} className="tcd-ticket__main">
            <span class="tcd-ticket__label">
              <span class="tcd-ticket__icon">
                <HugeiconsIcon icon={Ticket01Icon} size={14} strokeWidth={1.8} />
              </span>
              Admit one
            </span>
            <div class="tcd-ticket__title">
              <strong>Night Sky Live</strong>
              <span>Pier Amphitheater</span>
            </div>
            <dl class="tcd-ticket__info">
              <div>
                <dt>Date</dt>
                <dd>Oct 24</dd>
              </div>
              <div>
                <dt>Doors</dt>
                <dd>20:30</dd>
              </div>
              <div>
                <dt>Seat</dt>
                <dd>B 12</dd>
              </div>
            </dl>
          </TiltedCardLayer>
          <TiltedCardLayer depth={12} className="tcd-ticket__stub">
            <svg class="tcd-barcode" viewBox="0 0 24 96" preserveAspectRatio="none" aria-hidden="true">
              <For each={BARS}>{([y, height]) => <rect x="0" y={y} width="24" height={height} />}</For>
            </svg>
            <span class="tcd-ticket__gate">Gate 4</span>
          </TiltedCardLayer>
        </div>
      </TiltedCard>
    </div>
  );
}

function BasicScene(props: { card: CardSettings; theme: Theme; overlay: boolean }) {
  return (
    <TiltedCard
      imageSrc={PHOTOS[props.theme].sky}
      altText="Open Sky"
      captionText="Open Sky"
      containerWidth="300px"
      containerHeight="300px"
      imageWidth="300px"
      imageHeight="300px"
      displayOverlayContent={props.overlay}
      overlayContent={<p class="tcd-overlay">Open Sky</p>}
      {...props.card}
    />
  );
}

const LOOK = {
  rotateAmplitude: 12,
  scaleOnHover: 1.05,
  perspective: 800,
  smoothness: 0.6,
  glare: 0.5,
  glareColor: '#ffffff',
  shadow: 0.5,
  parallax: 1,
  radius: 15,
  axis: 'both',
  reverse: false,
  trackWindow: false,
  floating: false
};

const DEFAULT_PROPS = {
  demo: 'album',
  preset: 'classic',
  ...LOOK,
  showTooltip: true,
  displayOverlayContent: true,
  flipOnClick: true,
  intro: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  classic: {},
  gentle: { rotateAmplitude: 6, scaleOnHover: 1.02, smoothness: 0.85, glare: 0.3, parallax: 0.6 },
  bold: { rotateAmplitude: 22, scaleOnHover: 1.08, smoothness: 0.4, glare: 0.85, shadow: 0.85, parallax: 1.6 },
  floating: { floating: true, smoothness: 0.75 },
  follow: { trackWindow: true, rotateAmplitude: 16 },
  reverse: { reverse: true },
  swing: { axis: 'horizontal', rotateAmplitude: 22, smoothness: 0.8 }
};

const DEMO_OPTIONS = [
  { value: 'album', label: 'Album' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'basic', label: 'Basic' }
];

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'gentle', label: 'Gentle' },
  { value: 'bold', label: 'Bold' },
  { value: 'floating', label: 'Floating' },
  { value: 'follow', label: 'Follow' },
  { value: 'reverse', label: 'Reverse' },
  { value: 'swing', label: 'Swing' }
];

const AXIS_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' }
];

const propData: PropRow[] = [
  { name: 'imageSrc', type: 'string', default: '-', description: 'Photo that fills the card.' },
  { name: 'altText', type: 'string', default: "'Tilted card image'", description: 'Alternative text for the photo.' },
  {
    name: 'children',
    type: 'JSX.Element',
    default: '-',
    description: 'Content on the face of the card, over the photo or instead of it.'
  },
  {
    name: 'captionText',
    type: 'string',
    default: "''",
    description: 'Text in the small tag that follows the cursor and swings as it moves.'
  },
  { name: 'showTooltip', type: 'boolean', default: 'true', description: 'Shows the caption tag on hover.' },
  {
    name: 'overlayContent',
    type: 'JSX.Element',
    default: 'null',
    description: 'Content that floats in front of the card, lifted off its surface.'
  },
  {
    name: 'displayOverlayContent',
    type: 'boolean',
    default: 'false',
    description: 'Shows the overlay content.'
  },
  { name: 'overlayDepth', type: 'number', default: '30', description: 'How far the overlay floats in front, in px.' },
  {
    name: 'backContent',
    type: 'JSX.Element',
    default: 'null',
    description: 'Content for the back of the card. Clicking, tapping or pressing Enter flips the card over.'
  },
  {
    name: 'flipOnClick',
    type: 'boolean',
    default: 'true',
    description: 'Flips the card when it is clicked. Needs backContent.'
  },
  {
    name: 'flipped',
    type: 'boolean',
    default: '-',
    description: 'Controls which side shows. Leave it unset to let clicks flip the card.'
  },
  {
    name: 'onFlip',
    type: '(flipped: boolean) => void',
    default: '-',
    description: 'Called with the new side whenever the card is flipped.'
  },
  {
    name: 'onClick',
    type: '(event) => void',
    default: '-',
    description: 'Called when the card is clicked or activated with the keyboard.'
  },
  {
    name: 'containerWidth',
    type: 'number | string',
    default: "'100%'",
    description: 'Width of the area that reacts to the cursor.'
  },
  {
    name: 'containerHeight',
    type: 'number | string',
    default: "'300px'",
    description: 'Height of the area that reacts to the cursor.'
  },
  { name: 'imageWidth', type: 'number | string', default: "'300px'", description: 'Width of the card.' },
  { name: 'imageHeight', type: 'number | string', default: "'300px'", description: 'Height of the card.' },
  {
    name: 'rotateAmplitude',
    type: 'number',
    default: '12',
    description: 'How far the card tilts toward the cursor, in degrees.'
  },
  { name: 'scaleOnHover', type: 'number', default: '1.05', description: 'How much the card grows when hovered.' },
  {
    name: 'perspective',
    type: 'number | string',
    default: '800',
    description: 'Viewing distance in px. Lower values give a stronger 3D effect.'
  },
  { name: 'radius', type: 'number | string', default: '15', description: 'Corner radius of the card.' },
  {
    name: 'smoothness',
    type: 'number',
    default: '0.6',
    description: 'From 0 to 1. Low values snap to the cursor, high values glide and settle with a soft bounce.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0.5',
    description: 'Strength of the light that catches the surface and edges as the card tilts, from 0 to 1.'
  },
  { name: 'glareColor', type: 'string', default: "'#ffffff'", description: 'Color of the glare.' },
  {
    name: 'shadow',
    type: 'number',
    default: '0.5',
    description: 'Strength of the soft shadow under the card, which shifts and grows as the card lifts, from 0 to 1.'
  },
  {
    name: 'parallax',
    type: 'number',
    default: '1',
    description: 'How far layers and the photo shift with the tilt. 0 keeps everything flat.'
  },
  {
    name: 'axis',
    type: "'both' | 'horizontal' | 'vertical'",
    default: "'both'",
    description: 'Limits the tilt to following the cursor left and right, or up and down.'
  },
  {
    name: 'reverse',
    type: 'boolean',
    default: 'false',
    description: 'Tilts away from the cursor instead of toward it.'
  },
  {
    name: 'trackWindow',
    type: 'boolean',
    default: 'false',
    description: 'The card follows the cursor anywhere on the page, not only while hovered.'
  },
  { name: 'floating', type: 'boolean', default: 'false', description: 'The card drifts and sways gently while idle.' },
  {
    name: 'gyroscope',
    type: 'boolean',
    default: 'true',
    description: 'Tilts the card as a phone or tablet is moved. Asks for permission on iOS on the first tap.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'The card rises and settles into place when it first scrolls into view.'
  },
  {
    name: 'introDelay',
    type: 'number',
    default: '0',
    description: 'Wait before the intro, in ms. Stagger it across a row of cards.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the card.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the card.' },
  {
    name: 'TiltedCardLayer',
    type: 'component',
    default: '-',
    description:
      'Wrap content in <TiltedCardLayer depth={30}> to float it above the card face. Higher depth floats further, negative depth sinks behind.'
  }
];

export default function TiltedCardDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const card = createMemo(() => {
    const { demo: _demo, preset: _preset, displayOverlayContent: _overlay, ...rest } = props();
    return rest as CardSettings;
  });
  const theme = useColorModeValue<Theme>('light', 'dark');

  const applyPreset = (value: string) => {
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaultProps()[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const sceneKey = createMemo(() => `${rerenderKey()}-${props().demo}`);

  const flips = () => props().demo === 'album' || props().demo === 'ticket';

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['demo', 'preset']}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <RefreshButton onClick={forceRerender} />
            <Keyed token={sceneKey()}>
              {() => (
                <div class="tcd-scene" data-theme={theme()}>
                  <Switch>
                    <Match when={props().demo === 'album'}>
                      <AlbumScene card={card()} theme={theme()} />
                    </Match>
                    <Match when={props().demo === 'gallery'}>
                      <GalleryScene card={card()} theme={theme()} />
                    </Match>
                    <Match when={props().demo === 'ticket'}>
                      <TicketScene card={card()} />
                    </Match>
                    <Match when={props().demo === 'basic'}>
                      <BasicScene card={card()} theme={theme()} overlay={props().displayOverlayContent} />
                    </Match>
                  </Switch>
                </div>
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Demo"
              options={DEMO_OPTIONS}
              value={props().demo}
              onChange={value => updateProp('demo', value)}
            />
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Axis"
              options={AXIS_OPTIONS}
              value={props().axis}
              onChange={value => updateProp('axis', value)}
            />
            <PreviewColorPickerCustom
              title="Glare Color"
              color={props().glareColor}
              onChange={value => updateProp('glareColor', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={props().rotateAmplitude}
              valueUnit="°"
              onChange={value => updateProp('rotateAmplitude', value)}
            />
            <PreviewSlider
              title="Scale on Hover"
              min={1}
              max={1.3}
              step={0.01}
              value={props().scaleOnHover}
              onChange={value => updateProp('scaleOnHover', value)}
            />
            <PreviewSlider
              title="Perspective"
              min={300}
              max={2000}
              step={50}
              value={props().perspective}
              valueUnit="px"
              onChange={value => updateProp('perspective', value)}
            />
            <PreviewSlider
              title="Smoothness"
              min={0}
              max={1}
              step={0.05}
              value={props().smoothness}
              onChange={value => updateProp('smoothness', value)}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={props().glare}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Shadow"
              min={0}
              max={1}
              step={0.05}
              value={props().shadow}
              onChange={value => updateProp('shadow', value)}
            />
            <PreviewSlider
              title="Parallax"
              min={0}
              max={2.5}
              step={0.1}
              value={props().parallax}
              onChange={value => updateProp('parallax', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={40}
              step={1}
              value={props().radius}
              valueUnit="px"
              onChange={value => updateProp('radius', value)}
            />
            <PreviewSwitch
              title="Tooltip"
              isChecked={props().showTooltip}
              onChange={value => updateProp('showTooltip', value)}
            />
            <PreviewSwitch
              title="Overlay"
              isChecked={props().displayOverlayContent}
              isDisabled={props().demo !== 'basic'}
              onChange={value => updateProp('displayOverlayContent', value)}
            />
            <PreviewSwitch
              title="Flip on Click"
              isChecked={props().flipOnClick}
              isDisabled={!flips()}
              onChange={value => updateProp('flipOnClick', value)}
            />
            <PreviewSwitch
              title="Reverse"
              isChecked={props().reverse}
              onChange={value => updateProp('reverse', value)}
            />
            <PreviewSwitch
              title="Track Window"
              isChecked={props().trackWindow}
              onChange={value => updateProp('trackWindow', value)}
            />
            <PreviewSwitch
              title="Floating"
              isChecked={props().floating}
              onChange={value => updateProp('floating', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={props().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={tiltedCard} componentName="TiltedCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
