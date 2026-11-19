import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { ghBlack } from '@/assets/logos';

import BubbleMenu from '@/content/Components/BubbleMenu/BubbleMenu';
import { bubbleMenu } from '@/constants/code/Components/bubbleMenuCode';

const DEFAULT_PROPS = {
  animationEase: 'back.out(1.5)',
  menuBg: '#ffffff',
  menuContentColor: '#111111',
  animationDuration: 0.5,
  staggerDelay: 0.12
};

const EASE_OPTIONS = [
  { value: 'back.out(1.5)', label: 'back.out(1.5)' },
  { value: 'power3.out', label: 'power3.out' },
  { value: 'power2.out', label: 'power2.out' },
  { value: 'elastic.out(1,0.5)', label: 'elastic.out(1,0.5)' },
  { value: 'bounce.out', label: 'bounce.out' }
];

const propData: PropRow[] = [
  {
    name: 'logo',
    type: 'JSX.Element | string',
    default: '—',
    description: 'Logo content shown in the central bubble (string src or JSX).'
  },
  {
    name: 'onMenuClick',
    type: '(open: boolean) => void',
    default: '—',
    description: 'Callback fired whenever the menu toggle changes; receives open state.'
  },
  {
    name: 'className',
    type: 'string',
    default: '—',
    description: 'Additional class names for the root nav wrapper.'
  },
  {
    name: 'style',
    type: 'JSX.CSSProperties',
    default: '—',
    description: 'Inline styles applied to the root nav wrapper.'
  },
  {
    name: 'menuAriaLabel',
    type: 'string',
    default: '"Toggle menu"',
    description: 'Accessible aria-label for the toggle button.'
  },
  {
    name: 'menuBg',
    type: 'string',
    default: '"#fff"',
    description: 'Background color for the logo & toggle bubbles and base pill background.'
  },
  {
    name: 'menuContentColor',
    type: 'string',
    default: '"#111"',
    description: 'Color for the menu icon lines and default pill text.'
  },
  {
    name: 'useFixedPosition',
    type: 'boolean',
    default: 'false',
    description: 'If true positions the menu with fixed instead of absolute (follows viewport).'
  },
  {
    name: 'items',
    type: 'MenuItem[]',
    default: 'DEFAULT_ITEMS',
    description:
      'Custom menu items; each = { label, href, ariaLabel?, rotation?, hoverStyles?: { bgColor?, textColor? } }.'
  },
  {
    name: 'animationEase',
    type: 'string',
    default: '"back.out(1.5)"',
    description: 'GSAP ease string used for bubble scale-in animation.'
  },
  {
    name: 'animationDuration',
    type: 'number',
    default: '0.5',
    description: 'Duration (s) for each bubble & label animation.'
  },
  {
    name: 'staggerDelay',
    type: 'number',
    default: '0.12',
    description: 'Base stagger (s) between bubble animations (with slight random variance).'
  }
];

export default function BubbleMenuDemo() {
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
            class="demo-container demo-container-dots"
            style={{ position: 'relative', height: '800px', overflow: 'hidden' }}
          >
            <BubbleMenu
              logo={ghBlack}
              menuBg={props().menuBg}
              menuContentColor={props().menuContentColor}
              animationEase={props().animationEase}
              animationDuration={props().animationDuration}
              staggerDelay={props().staggerDelay}
            />
          </div>

          <Customize>
            <PreviewSelect
              title="Ease"
              options={EASE_OPTIONS}
              value={props().animationEase}
              width={190}
              onChange={value => updateProp('animationEase', value)}
            />

            <PreviewColorPickerCustom
              title="Menu BG"
              color={props().menuBg}
              onChange={value => updateProp('menuBg', value)}
            />
            <PreviewColorPickerCustom
              title="Content Color"
              color={props().menuContentColor}
              onChange={value => updateProp('menuContentColor', value)}
            />

            <PreviewSlider
              title="Anim Duration"
              min={0.1}
              max={2}
              step={0.05}
              value={props().animationDuration}
              onChange={value => updateProp('animationDuration', value)}
            />

            <PreviewSlider
              title="Stagger"
              min={0}
              max={0.5}
              step={0.01}
              value={props().staggerDelay}
              onChange={value => updateProp('staggerDelay', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={bubbleMenu} componentName="BubbleMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
