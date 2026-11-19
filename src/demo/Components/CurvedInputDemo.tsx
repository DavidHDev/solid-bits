import { createMemo } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import CurvedInput, { type CurvedInputProps } from '@/content/Components/CurvedInput/CurvedInput';
import { curvedInput } from '@/constants/code/Components/curvedInputCode';

type ThemeName = 'dark' | 'light';

const DEFAULT_PROPS = {
  theme: 'dark',
  width: 450,
  bend: 28,
  height: 64,
  cornerRadius: 18,
  borderWidth: 1.5,
  fontSize: 16,
  backgroundColor: '#12161c',
  textColor: '#f5f5f5',
  borderColor: '#33383f',
  buttonColor: '#6ec9f7',
  buttonTextColor: '#090b0e',
  buttonText: 'Get Started',
  shadowSize: 'md',
  showButton: true,
  showIcon: true
};

const THEME_COLORS: Record<
  ThemeName,
  { backgroundColor: string; textColor: string; borderColor: string; buttonColor: string; buttonTextColor: string }
> = {
  dark: {
    backgroundColor: '#12161c',
    textColor: '#f5f5f5',
    borderColor: '#33383f',
    buttonColor: '#6ec9f7',
    buttonTextColor: '#090b0e'
  },
  light: {
    backgroundColor: '#ffffff',
    textColor: '#16202c',
    borderColor: '#1f3350',
    buttonColor: '#0977ae',
    buttonTextColor: '#ffffff'
  }
};

const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Soft' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Heavy' }
];

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' }
];

const propData: PropRow[] = [
  {
    name: 'value',
    type: 'string',
    default: 'undefined',
    description: 'Controlled value; leave undefined for uncontrolled usage.'
  },
  { name: 'defaultValue', type: 'string', default: '""', description: 'Initial value when the input is uncontrolled.' },
  {
    name: 'onChange',
    type: '(value) => void',
    default: '-',
    description: 'Called with the new value on every keystroke.'
  },
  {
    name: 'onSubmit',
    type: '(value) => void',
    default: '-',
    description: 'Called when the button is pressed or Enter is hit.'
  },
  {
    name: 'placeholder',
    type: 'string',
    default: '"Enter your email"',
    description: 'Placeholder text rendered along the curve when empty.'
  },
  { name: 'buttonText', type: 'string', default: '"Get Started"', description: 'Label of the curved submit button.' },
  {
    name: 'type',
    type: 'string',
    default: '"email"',
    description: 'Semantic input type; email/number map to the matching mobile keyboard.'
  },
  {
    name: 'name',
    type: 'string',
    default: 'undefined',
    description: 'Name attribute forwarded to the underlying input.'
  },
  {
    name: 'ariaLabel',
    type: 'string',
    default: 'undefined',
    description: 'Accessible label; falls back to the placeholder.'
  },
  {
    name: 'theme',
    type: '"dark" | "light"',
    default: '"dark"',
    description: 'Color preset; any explicit color prop overrides its theme value.'
  },
  {
    name: 'width',
    type: 'number | string',
    default: '450',
    description: 'Width of the input bar (pixels or any CSS width value, e.g. "100%").'
  },
  {
    name: 'bend',
    type: 'number',
    default: '28',
    description: 'How many pixels the center of the bar arches above its ends; negative bends downward, 0 is flat.'
  },
  { name: 'height', type: 'number', default: '64', description: 'Thickness of the input bar in pixels.' },
  {
    name: 'cornerRadius',
    type: 'number',
    default: '18',
    description: 'Corner rounding of the bar; the button rounds proportionally.'
  },
  { name: 'borderWidth', type: 'number', default: '1.5', description: 'Outline stroke width in pixels.' },
  { name: 'fontSize', type: 'number', default: '16', description: 'Font size of the curved text and button label.' },
  {
    name: 'backgroundColor',
    type: 'string',
    default: 'undefined',
    description: 'Fill color of the input bar; overrides the theme.'
  },
  {
    name: 'textColor',
    type: 'string',
    default: 'undefined',
    description: 'Color of the typed text and caret; overrides the theme.'
  },
  {
    name: 'placeholderColor',
    type: 'string',
    default: 'undefined',
    description: 'Color of the placeholder text; overrides the theme.'
  },
  {
    name: 'borderColor',
    type: 'string',
    default: 'undefined',
    description: 'Color of the outline stroke; overrides the theme.'
  },
  {
    name: 'buttonColor',
    type: 'string',
    default: 'undefined',
    description: 'Fill of the submit button, the focus ring and the default icon chip; overrides the theme.'
  },
  {
    name: 'buttonTextColor',
    type: 'string',
    default: 'undefined',
    description: 'Color of the button label and the default envelope icon; overrides the theme.'
  },
  {
    name: 'iconColor',
    type: 'string',
    default: 'undefined',
    description: 'Fill of the icon chip; defaults to the button color.'
  },
  {
    name: 'shadowSize',
    type: '"none" | "sm" | "md" | "lg"',
    default: '"md"',
    description: 'Size of the soft drop shadow under the bar.'
  },
  {
    name: 'shadowColor',
    type: 'string',
    default: 'undefined',
    description: 'Tint of the drop shadow; overrides the theme.'
  },
  { name: 'showButton', type: 'boolean', default: 'true', description: 'Render the curved submit button.' },
  { name: 'showIcon', type: 'boolean', default: 'true', description: 'Render the leading icon chip.' },
  {
    name: 'icon',
    type: 'JSX.Element',
    default: 'undefined',
    description: 'Custom SVG content for the icon, centered at the origin; replaces the default envelope chip.'
  },
  { name: 'className', type: 'string', default: '""', description: 'Additional CSS classes for the wrapper form.' },
  { name: 'style', type: 'JSX.CSSProperties', default: 'undefined', description: 'Inline styles for the wrapper form.' }
];

export default function CurvedInputDemo() {
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const siteTheme = useColorModeValue<ThemeName>('light', 'dark');

  const usesDefaultPalette = createMemo(() => {
    const p = props();
    return (
      p.theme === DEFAULT_PROPS.theme &&
      p.backgroundColor === DEFAULT_PROPS.backgroundColor &&
      p.textColor === DEFAULT_PROPS.textColor &&
      p.borderColor === DEFAULT_PROPS.borderColor &&
      p.buttonColor === DEFAULT_PROPS.buttonColor &&
      p.buttonTextColor === DEFAULT_PROPS.buttonTextColor
    );
  });
  const renderedTheme = createMemo<ThemeName>(() =>
    usesDefaultPalette() ? siteTheme() : (props().theme as ThemeName)
  );
  const renderedColors = createMemo(() => {
    const p = props();
    return usesDefaultPalette()
      ? THEME_COLORS[renderedTheme()]
      : {
          backgroundColor: p.backgroundColor,
          textColor: p.textColor,
          borderColor: p.borderColor,
          buttonColor: p.buttonColor,
          buttonTextColor: p.buttonTextColor
        };
  });

  const handleThemeChange = (nextTheme: ThemeName) => {
    updateProps({ theme: nextTheme, ...THEME_COLORS[nextTheme] });
  };

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
            class="demo-container"
            style={{
              position: 'relative',
              height: '500px',
              'padding-block': '0',
              'padding-inline': 'clamp(16px, 4vw, 48px)',
              overflow: 'hidden',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            <div style={{ width: '100%', 'max-width': '720px', display: 'flex', 'justify-content': 'center' }}>
              <CurvedInput
                {...(props() as CurvedInputProps)}
                theme={renderedTheme()}
                {...renderedColors()}
                placeholder="david@solid-bits.dev"
                onSubmit={value => console.log('Submitted:', value)}
              />
            </div>
          </div>

          <Customize>
            <PreviewSelect
              title="Theme"
              options={THEME_OPTIONS}
              value={props().theme}
              onChange={(v: ThemeName) => handleThemeChange(v)}
              width={120}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedColors().backgroundColor}
              onChange={v => updateProp('backgroundColor', v)}
            />
            <PreviewColorPickerCustom
              title="Text"
              color={renderedColors().textColor}
              onChange={v => updateProp('textColor', v)}
            />
            <PreviewColorPickerCustom
              title="Border"
              color={renderedColors().borderColor}
              onChange={v => updateProp('borderColor', v)}
            />
            <PreviewColorPickerCustom
              title="Button"
              color={renderedColors().buttonColor}
              onChange={v => updateProp('buttonColor', v)}
            />
            <PreviewColorPickerCustom
              title="Button Text"
              color={renderedColors().buttonTextColor}
              onChange={v => updateProp('buttonTextColor', v)}
            />
            <PreviewInput
              title="Button Label"
              value={props().buttonText}
              maxLength={24}
              onChange={v => updateProp('buttonText', v)}
            />
            <PreviewSelect
              title="Shadow"
              options={SHADOW_OPTIONS}
              value={props().shadowSize}
              onChange={v => updateProp('shadowSize', v)}
              width={140}
            />
            <PreviewSlider
              title="Width"
              min={340}
              max={720}
              step={10}
              value={props().width}
              valueUnit="px"
              onChange={v => updateProp('width', v)}
            />
            <PreviewSlider
              title="Bend"
              min={-60}
              max={60}
              step={1}
              value={props().bend}
              valueUnit="px"
              onChange={v => updateProp('bend', v)}
            />
            <PreviewSlider
              title="Height"
              min={48}
              max={96}
              step={1}
              value={props().height}
              valueUnit="px"
              onChange={v => updateProp('height', v)}
            />
            <PreviewSlider
              title="Corner Radius"
              min={0}
              max={36}
              step={1}
              value={props().cornerRadius}
              valueUnit="px"
              onChange={v => updateProp('cornerRadius', v)}
            />
            <PreviewSlider
              title="Border Width"
              min={0}
              max={4}
              step={0.5}
              value={props().borderWidth}
              valueUnit="px"
              onChange={v => updateProp('borderWidth', v)}
            />
            <PreviewSlider
              title="Font Size"
              min={13}
              max={22}
              step={1}
              value={props().fontSize}
              valueUnit="px"
              onChange={v => updateProp('fontSize', v)}
            />
            <PreviewSwitch
              title="Show Button"
              isChecked={props().showButton}
              onChange={v => updateProp('showButton', v)}
            />
            <PreviewSwitch title="Show Icon" isChecked={props().showIcon} onChange={v => updateProp('showIcon', v)} />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={curvedInput} componentName="CurvedInput" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
