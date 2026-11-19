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
import { useColorModeValue } from '@/hooks/useTheme';
import { ghBlack, ghWhite } from '@/assets/logos';

import CardNav, { type CardNavItem, type CardNavProps } from '@/content/Components/CardNav/CardNav';
import { cardNav } from '@/constants/code/Components/cardNavCode';

const BASE_ITEMS: CardNavItem[] = [
  {
    label: 'About',
    description: 'The people and the story behind the studio.',
    links: [
      { label: 'Company', href: '#company' },
      { label: 'Careers', href: '#careers' }
    ]
  },
  {
    label: 'Projects',
    description: 'Selected work from the last few years.',
    links: [
      { label: 'Featured', href: '#featured' },
      { label: 'Case studies', href: '#case-studies' }
    ]
  },
  {
    label: 'Contact',
    description: 'Say hello, we read everything.',
    links: [
      { label: 'Email', href: '#email' },
      { label: 'X', href: '#x' },
      { label: 'LinkedIn', href: '#linkedin' }
    ]
  }
];

const LOOK = {
  cardEffect: 'rise',
  openOn: 'click',
  surface: 'glass',
  stagger: 0.12,
  bounce: 0.2,
  accentColor: '',
  accentCard: false,
  menuLabel: true
};

const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  speed: 1,
  cardHeight: 176,
  maxWidth: 800,
  descriptions: true,
  showCta: true,
  intro: true
};

const PRESETS: Record<string, Partial<typeof LOOK>> = {
  classic: {},
  accent: { accentColor: '#6ec9f7', accentCard: true },
  unfold: { cardEffect: 'unfold', stagger: 0.16, bounce: 0.1 },
  hover: { openOn: 'hover' },
  solid: { surface: 'solid', cardEffect: 'fade', menuLabel: false, bounce: 0 }
};

const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'accent', label: 'Accent' },
  { value: 'unfold', label: 'Unfold' },
  { value: 'hover', label: 'Hover' },
  { value: 'solid', label: 'Solid' }
];

const EFFECT_OPTIONS = [
  { value: 'rise', label: 'Rise' },
  { value: 'unfold', label: 'Unfold' },
  { value: 'fade', label: 'Fade' }
];

const OPEN_OPTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'hover', label: 'Hover' }
];

const SURFACE_OPTIONS = [
  { value: 'glass', label: 'Glass' },
  { value: 'solid', label: 'Solid' }
];

const contrastInk = (color: string) => {
  const hex = String(color || '').replace('#', '');
  if (!/^([0-9a-f]{6})$/i.test(hex)) return '#ffffff';
  const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6 ? '#090b0e' : '#ffffff';
};

const propData: PropRow[] = [
  {
    name: 'items',
    type: '{ label: string; description?: string; bgColor?: string; textColor?: string; links: { label: string; href?: string; ariaLabel?: string }[] }[]',
    default: '-',
    description: 'The cards in the menu. Give a card a bgColor to tint it, and links without an href render as buttons.'
  },
  {
    name: 'logo',
    type: 'string | JSX.Element',
    default: '-',
    description: 'Image URL or element shown in the middle of the bar.'
  },
  { name: 'logoAlt', type: 'string', default: "'Logo'", description: 'Accessible label for the logo link.' },
  { name: 'logoHref', type: 'string', default: "'#'", description: 'Where the logo links to.' },
  {
    name: 'cta',
    type: '{ label: string; href?: string; onClick?: (event) => void }',
    default: '-',
    description: 'Button on the right of the bar. On narrow screens it moves to the bottom of the menu.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description: 'Color scheme of the bar, cards and button.'
  },
  {
    name: 'surface',
    type: "'glass' | 'solid'",
    default: "'glass'",
    description: 'Frosted glass that blurs what is behind the bar, or an opaque fill.'
  },
  {
    name: 'openOn',
    type: "'click' | 'hover'",
    default: "'click'",
    description: 'Opens the menu from the button, or as soon as the pointer moves over the bar.'
  },
  {
    name: 'cardEffect',
    type: "'rise' | 'unfold' | 'fade'",
    default: "'rise'",
    description: 'How the cards arrive: rising into place, folding down from the bar, or fading in from a soft blur.'
  },
  {
    name: 'stagger',
    type: 'number',
    default: '0.12',
    description: 'How far each card trails the one before it, from 0 to 0.3.'
  },
  {
    name: 'bounce',
    type: 'number',
    default: '0.2',
    description: 'How much the menu overshoots as it opens, from 0 to 1.'
  },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the open and close animation.' },
  { name: 'cardHeight', type: 'number', default: '176', description: 'Minimum height of the cards in px.' },
  { name: 'maxWidth', type: 'number', default: '800', description: 'Maximum width of the bar in px.' },
  {
    name: 'accentColor',
    type: 'string',
    default: '-',
    description: 'Color of the button. Its label picks black or white for contrast.'
  },
  {
    name: 'menuLabel',
    type: 'boolean',
    default: 'true',
    description: 'Shows Menu and Close next to the menu icon, rolling between them.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Unrolls the bar from its center on mount.' },
  { name: 'defaultOpen', type: 'boolean', default: 'false', description: 'Starts with the menu open.' },
  {
    name: 'open',
    type: 'boolean',
    default: '-',
    description: 'Controls the menu from outside. Pair it with onOpenChange.'
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    default: '-',
    description: 'Called when the menu opens or closes.'
  },
  {
    name: 'linkComponent',
    type: 'ValidComponent',
    default: "'a'",
    description: "Renders the links, so you can pass your router's link. It receives href, class and children."
  },
  {
    name: 'onLinkClick',
    type: '(link, item, event) => void',
    default: '-',
    description: 'Called when a link is clicked. The menu closes afterwards.'
  },
  { name: 'ariaLabel', type: 'string', default: "'Main'", description: 'Accessible name of the nav landmark.' },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root.' }
];

export default function CardNavDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const settings = createMemo(() => {
    const {
      preset: _preset,
      accentColor: _accentColor,
      accentCard: _accentCard,
      descriptions: _descriptions,
      showCta: _showCta,
      ...rest
    } = props();
    return rest;
  });
  const theme = useColorModeValue<'light' | 'dark'>('light', 'dark');
  const ctaDefault = useColorModeValue('#11151b', '#f2f4f7');
  const accent = createMemo(() => props().accentColor || ctaDefault());

  const items = createMemo(() =>
    BASE_ITEMS.map((item, index) => ({
      ...item,
      ...(props().descriptions ? {} : { description: undefined }),
      ...(props().accentCard && index === 0 ? { bgColor: accent(), textColor: contrastInk(accent()) } : {})
    }))
  );

  const applyPreset = (value: string) => {
    const defaults = defaultProps();
    const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name as keyof typeof LOOK]]));
    updateProps({ ...base, ...PRESETS[value], preset: value });
  };

  const computedProps = createMemo(() => ({
    ...(props().accentColor ? { accentColor: props().accentColor } : {}),
    ...(theme() === 'light' ? { theme: 'light' } : {})
  }));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['preset', 'accentColor', 'accentCard', 'descriptions', 'showCta']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '480px', padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '64px', left: '20px', right: '20px' }}>
              <Keyed token={rerenderKey()}>
                {() => (
                  <CardNav
                    logo={theme() === 'light' ? ghBlack : ghWhite}
                    logoAlt="Solid Bits"
                    items={items()}
                    cta={props().showCta ? { label: 'Get started' } : undefined}
                    theme={theme()}
                    accentColor={props().accentColor || undefined}
                    onLinkClick={(_link, _item, event) => event.preventDefault()}
                    {...(settings() as Partial<CardNavProps>)}
                  />
                )}
              </Keyed>
            </div>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewColorPickerCustom title="Accent" color={accent()} onChange={v => updateProp('accentColor', v)} />
            <PreviewSelect
              title="Card Effect"
              options={EFFECT_OPTIONS}
              value={settings().cardEffect}
              onChange={v => updateProp('cardEffect', v)}
            />
            <PreviewSelect
              title="Open On"
              options={OPEN_OPTIONS}
              value={settings().openOn}
              onChange={v => updateProp('openOn', v)}
            />
            <PreviewSelect
              title="Surface"
              options={SURFACE_OPTIONS}
              value={settings().surface}
              onChange={v => updateProp('surface', v)}
            />
            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.3}
              step={0.01}
              value={settings().stagger}
              onChange={v => updateProp('stagger', v)}
            />
            <PreviewSlider
              title="Bounce"
              min={0}
              max={1}
              step={0.01}
              value={settings().bounce}
              onChange={v => updateProp('bounce', v)}
            />
            <PreviewSlider
              title="Speed"
              min={0.4}
              max={2}
              step={0.05}
              value={settings().speed}
              onChange={v => updateProp('speed', v)}
            />
            <PreviewSlider
              title="Card Height"
              min={120}
              max={260}
              step={2}
              value={settings().cardHeight}
              valueUnit="px"
              onChange={v => updateProp('cardHeight', v)}
            />
            <PreviewSlider
              title="Max Width"
              min={480}
              max={1000}
              step={10}
              value={settings().maxWidth}
              valueUnit="px"
              onChange={v => updateProp('maxWidth', v)}
            />
            <PreviewSwitch
              title="Menu Label"
              isChecked={settings().menuLabel}
              onChange={v => updateProp('menuLabel', v)}
            />
            <PreviewSwitch title="Button" isChecked={props().showCta} onChange={v => updateProp('showCta', v)} />
            <PreviewSwitch
              title="Descriptions"
              isChecked={props().descriptions}
              onChange={v => updateProp('descriptions', v)}
            />
            <PreviewSwitch
              title="Accent Card"
              isChecked={props().accentCard}
              onChange={v => updateProp('accentCard', v)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={v => {
                updateProp('intro', v);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['@hugeicons/core-free-icons']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={cardNav} componentName="CardNav" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
