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

import HoloCard, { type HoloCardProps } from '@/content/Components/HoloCard/HoloCard';
import { holoCard } from '@/constants/code/Components/holoCardCode';

type HoloPreset = NonNullable<HoloCardProps['preset']>;
type CardId = 'pikachu' | 'mew' | 'maushold';

const CARDS: Record<CardId, { image: string; alt: string; preset: HoloPreset }> = {
  pikachu: { image: '/assets/demo/pikachu.webp', alt: 'Pikachu trading card', preset: 'bursts' },
  mew: { image: '/assets/demo/mew.webp', alt: 'Mew trading card', preset: 'glitter' },
  maushold: { image: '/assets/demo/maushold.webp', alt: 'Maushold trading card', preset: 'rainbow' }
};

const CARD_OPTIONS = [
  { label: 'Pikachu', value: 'pikachu' },
  { label: 'Mew', value: 'mew' },
  { label: 'Maushold', value: 'maushold' }
];

const PRESET_OPTIONS = [
  { label: 'Bursts', value: 'bursts' },
  { label: 'Stars', value: 'stars' },
  { label: 'Shards', value: 'shards' },
  { label: 'Cosmos', value: 'cosmos' },
  { label: 'Rainbow', value: 'rainbow' },
  { label: 'Swirl', value: 'swirl' },
  { label: 'Glitter', value: 'glitter' },
  { label: 'Gold', value: 'gold' }
];

const DEFAULT_PROPS = {
  card: 'pikachu',
  preset: 'bursts',
  foilColor: '#e2e6ec',
  intensity: 0.85,
  scale: 1,
  edgeSparkle: 0.8,
  frame: 4,
  glare: 0.5,
  tiltMax: 14,
  hoverScale: 1.04,
  radius: 14,
  width: 320,
  idle: true,
  shadow: true
};

const propData: PropRow[] = [
  {
    name: 'image',
    type: 'string',
    default: '-',
    description: 'Front of the card. Same-origin or CORS-enabled URL.'
  },
  {
    name: 'backImage',
    type: 'string',
    default: '-',
    description: 'Back of the card. When set, a click or Enter flips the card over.'
  },
  { name: 'alt', type: 'string', default: "''", description: 'Accessible description of the card.' },
  {
    name: 'preset',
    type: "'bursts' | 'stars' | 'shards' | 'cosmos' | 'rainbow' | 'swirl' | 'glitter' | 'gold'",
    default: "'bursts'",
    description:
      'The holo pattern on the card face. Bursts are rings of foil dashes, shards are cracked ice, swirl is one big round rainbow and gold is a warm etched foil.'
  },
  {
    name: 'foilColor',
    type: 'string',
    default: "'#e2e6ec'",
    description: 'Colour of the metal under the print, silver by default.'
  },
  {
    name: 'intensity',
    type: 'number',
    default: '0.85',
    description: 'How strongly the foil shows through the print, from 0 for plain card to 1.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '1',
    description: 'Size of the holo pattern. Higher values pack in more, smaller elements.'
  },
  {
    name: 'edgeSparkle',
    type: 'number',
    default: '0.8',
    description: 'Brightness of the glitter on the silver border as it catches the light.'
  },
  {
    name: 'frame',
    type: 'number',
    default: '4',
    description: 'Width of the sparkling border as a percentage of the card width. Match it to your card art.'
  },
  {
    name: 'glare',
    type: 'number',
    default: '0.5',
    description: 'Strength of the glossy highlight under the light.'
  },
  { name: 'tiltMax', type: 'number', default: '14', description: 'Largest tilt in degrees as the pointer moves.' },
  { name: 'hoverScale', type: 'number', default: '1.04', description: 'How much the card lifts while hovered.' },
  { name: 'radius', type: 'number', default: '14', description: 'Corner radius in px.' },
  { name: 'width', type: 'number', default: '320', description: 'Card width in px. The height follows the image.' },
  {
    name: 'idle',
    type: 'boolean',
    default: 'true',
    description: 'Drifts the light and tilt slowly when nobody is hovering, so the foil keeps shimmering.'
  },
  {
    name: 'shadow',
    type: 'boolean',
    default: 'true',
    description: 'Soft shadow under the card that follows the tilt.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root element.' }
];

export default function HoloCardDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const cardProps = createMemo(() => {
    const { card: _card, ...rest } = props();
    return rest as typeof rest & { preset: HoloPreset };
  });
  const chosen = createMemo(() => CARDS[props().card as CardId] ?? CARDS.pikachu);

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['card']}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container"
            style={{
              position: 'relative',
              height: '620px',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <HoloCard image={chosen().image} alt={chosen().alt} {...cardProps()} />
          </div>

          <Customize>
            <PreviewSelect
              title="Card"
              options={CARD_OPTIONS}
              value={props().card}
              onChange={(value: CardId) => updateProps({ card: value, preset: CARDS[value]?.preset ?? 'bursts' })}
            />
            <PreviewSelect
              title="Preset"
              options={PRESET_OPTIONS}
              value={cardProps().preset}
              onChange={(value: HoloPreset) => updateProp('preset', value)}
            />
            <PreviewColorPickerCustom
              title="Foil Color"
              color={cardProps().foilColor}
              onChange={value => updateProp('foilColor', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0}
              max={1}
              step={0.05}
              value={cardProps().intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.5}
              max={2}
              step={0.05}
              value={cardProps().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Edge Sparkle"
              min={0}
              max={1}
              step={0.05}
              value={cardProps().edgeSparkle}
              onChange={value => updateProp('edgeSparkle', value)}
            />
            <PreviewSlider
              title="Frame"
              min={0}
              max={10}
              step={0.5}
              value={cardProps().frame}
              onChange={value => updateProp('frame', value)}
              displayValue={value => `${value}%`}
            />
            <PreviewSlider
              title="Glare"
              min={0}
              max={1}
              step={0.05}
              value={cardProps().glare}
              onChange={value => updateProp('glare', value)}
            />
            <PreviewSlider
              title="Tilt"
              min={0}
              max={30}
              step={1}
              value={cardProps().tiltMax}
              onChange={value => updateProp('tiltMax', value)}
              displayValue={value => `${value}°`}
            />
            <PreviewSlider
              title="Hover Scale"
              min={1}
              max={1.1}
              step={0.01}
              value={cardProps().hoverScale}
              onChange={value => updateProp('hoverScale', value)}
            />
            <PreviewSlider
              title="Radius"
              min={0}
              max={30}
              step={1}
              value={cardProps().radius}
              onChange={value => updateProp('radius', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSlider
              title="Width"
              min={220}
              max={420}
              step={10}
              value={cardProps().width}
              onChange={value => updateProp('width', value)}
              displayValue={value => `${value}px`}
            />
            <PreviewSwitch
              title="Idle Shimmer"
              isChecked={cardProps().idle}
              onChange={value => updateProp('idle', value)}
            />
            <PreviewSwitch
              title="Shadow"
              isChecked={cardProps().shadow}
              onChange={value => updateProp('shadow', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={holoCard} componentName="HoloCard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
