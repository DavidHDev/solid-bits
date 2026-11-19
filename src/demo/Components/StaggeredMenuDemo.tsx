import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Dependencies from '@/components/common/Dependencies';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { useColorModeValue } from '@/hooks/useTheme';
import { ghBlack, ghWhite } from '@/assets/logos';

import StaggeredMenu from '@/content/Components/StaggeredMenu/StaggeredMenu';
import { staggeredMenu } from '@/constants/code/Components/staggeredMenuCode';

type Position = 'left' | 'right';

const DEFAULT_PROPS = {
  displaySocials: true,
  accentColor: '#0aa0ef',
  menuButtonColor: '#ffffff',
  position: 'right'
};

const items = [
  { label: 'Home', ariaLabel: 'Go to Home section', link: '#home' },
  { label: 'About', ariaLabel: 'Go to About section', link: '#about' },
  { label: 'Projects', ariaLabel: 'Go to Projects section', link: '#projects' },
  { label: 'Contact', ariaLabel: 'Go to Contact section', link: '#contact' }
];

const socialItems = [
  { label: 'GitHub', link: 'https://github.com/your-handle' },
  { label: 'Twitter', link: 'https://twitter.com/your-handle' },
  { label: 'LinkedIn', link: 'https://linkedin.com/in/your-handle' }
];

const propData: PropRow[] = [
  {
    name: 'position',
    type: '"left" | "right"',
    default: '"right"',
    description: 'Anchor position for the menu panel (left or right side).'
  },
  {
    name: 'colors',
    type: 'string[]',
    default: '["#6ec9f7", "#0aa0ef"]',
    description: 'Colors used for staggered underlay layers.'
  },
  {
    name: 'items',
    type: 'StaggeredMenuItem[]',
    default: '[]',
    description: 'Menu items rendered inside the panel.'
  },
  {
    name: 'socialItems',
    type: 'StaggeredMenuSocialItem[]',
    default: '[]',
    description: 'Social links displayed in the menu panel.'
  },
  {
    name: 'displaySocials',
    type: 'boolean',
    default: 'true',
    description: 'Whether to display the social links section.'
  },
  {
    name: 'displayItemNumbering',
    type: 'boolean',
    default: 'true',
    description: 'Whether to show numbering for menu items.'
  },
  {
    name: 'className',
    type: 'string',
    default: 'undefined',
    description: 'Optional extra class names.'
  },
  {
    name: 'logoUrl',
    type: 'string',
    default: '/src/assets/logos/solidbits-gh-white.svg',
    description: 'Path to the logo image.'
  },
  {
    name: 'menuButtonColor',
    type: 'string',
    default: '"#fff"',
    description: 'Color of the menu toggle button when closed.'
  },
  {
    name: 'openMenuButtonColor',
    type: 'string',
    default: '"#fff"',
    description: 'Color of the menu toggle button when open.'
  },
  {
    name: 'accentColor',
    type: 'string',
    default: 'undefined',
    description: 'Hover accent color for menu items.'
  },
  {
    name: 'changeMenuColorOnOpen',
    type: 'boolean',
    default: 'true',
    description: 'Whether to animate the button color when opening/closing.'
  },
  {
    name: 'onMenuOpen',
    type: '() => void',
    default: 'undefined',
    description: 'Callback function called when menu opens.'
  },
  {
    name: 'onMenuClose',
    type: '() => void',
    default: 'undefined',
    description: 'Callback function called when menu closes.'
  },
  {
    name: 'closeOnClickAway',
    type: 'boolean',
    default: 'true',
    description: 'Whether to close the menu when clicking outside.'
  }
];

export default function StaggeredMenuDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const { rerenderKey, forceRerender } = useForceRerender();
  const logo = useColorModeValue(ghBlack, ghWhite);
  const renderedMenuButtonColor = useColorModeValue(
    () => (props().menuButtonColor === DEFAULT_PROPS.menuButtonColor ? '#18181b' : props().menuButtonColor),
    () => props().menuButtonColor
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
          <div
            class="demo-container demo-container-dots"
            style={{ position: 'relative', height: '800px', overflow: 'hidden', padding: 0 }}
          >
            <Keyed token={rerenderKey()}>
              {() => (
                <StaggeredMenu
                  logoUrl={logo()}
                  items={items}
                  socialItems={socialItems}
                  openMenuButtonColor="#18181b"
                  displaySocials={props().displaySocials}
                  accentColor={props().accentColor}
                  menuButtonColor={renderedMenuButtonColor()}
                  position={props().position as Position}
                />
              )}
            </Keyed>
          </div>

          <Customize>
            <PreviewSelect
              title="Position"
              value={props().position}
              onChange={(val: Position) => {
                updateProp('position', val);
                forceRerender();
              }}
              options={[
                { value: 'right', label: 'Right' },
                { value: 'left', label: 'Left' }
              ]}
              width={110}
            />
            <PreviewColorPickerCustom
              title="Accent Color"
              color={props().accentColor}
              onChange={val => updateProp('accentColor', val)}
            />
            <PreviewColorPickerCustom
              title="Menu Button Color"
              color={renderedMenuButtonColor()}
              onChange={val => updateProp('menuButtonColor', val)}
            />
            <PreviewSwitch
              title="Display Socials"
              isChecked={props().displaySocials}
              onChange={val => updateProp('displaySocials', val)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['gsap']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={staggeredMenu} componentName="StaggeredMenu" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
