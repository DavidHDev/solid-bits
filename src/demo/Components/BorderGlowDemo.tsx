import { For, createSignal } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useColorModeValue } from '@/hooks/useTheme';

import BorderGlow from '@/content/Components/BorderGlow/BorderGlow';
import { borderGlow } from '@/constants/code/Components/borderGlowCode';

const SPARKLE =
  'M 5.398 10.807 C 5.574 10.931 5.785 10.998 6 10.997 C 6.216 10.998 6.427 10.93 6.602 10.804 C 6.78 10.674 6.915 10.494 6.989 10.286 L 7.436 8.913 C 7.551 8.569 7.744 8.256 8 7.999 C 8.257 7.743 8.569 7.549 8.913 7.434 L 10.304 6.983 C 10.456 6.929 10.594 6.84 10.706 6.724 C 10.817 6.608 10.901 6.467 10.949 6.313 C 10.998 6.159 11.01 5.996 10.985 5.837 C 10.96 5.677 10.898 5.526 10.804 5.394 C 10.67 5.208 10.479 5.071 10.26 5.003 L 8.885 4.556 C 8.541 4.442 8.228 4.249 7.971 3.993 C 7.714 3.736 7.52 3.424 7.405 3.079 L 6.953 1.691 C 6.881 1.489 6.748 1.314 6.571 1.191 C 6.439 1.098 6.286 1.036 6.125 1.012 C 5.965 0.987 5.801 1.001 5.646 1.051 C 5.492 1.101 5.351 1.187 5.236 1.301 C 5.12 1.415 5.033 1.555 4.98 1.708 L 4.523 3.108 C 4.409 3.443 4.22 3.748 3.97 3.999 C 3.721 4.25 3.418 4.441 3.083 4.557 L 1.692 5.005 C 1.541 5.06 1.404 5.149 1.292 5.265 C 1.18 5.381 1.097 5.521 1.048 5.675 C 1 5.829 0.988 5.992 1.013 6.151 C 1.038 6.31 1.099 6.462 1.192 6.593 C 1.32 6.773 1.501 6.908 1.709 6.979 L 3.083 7.424 C 3.524 7.571 3.91 7.845 4.193 8.212 C 4.356 8.423 4.481 8.66 4.564 8.912 L 5.016 10.303 C 5.088 10.507 5.222 10.683 5.398 10.807 Z M 11.535 14.849 C 11.671 14.946 11.834 14.997 12 14.997 C 12.165 14.997 12.326 14.946 12.461 14.851 C 12.601 14.753 12.706 14.613 12.761 14.451 L 13.009 13.689 C 13.063 13.531 13.152 13.387 13.269 13.268 C 13.387 13.15 13.531 13.061 13.689 13.009 L 14.461 12.757 C 14.619 12.703 14.756 12.6 14.852 12.464 C 14.926 12.361 14.974 12.242 14.992 12.117 C 15.011 11.992 14.999 11.865 14.959 11.745 C 14.918 11.625 14.85 11.516 14.76 11.428 C 14.669 11.34 14.559 11.274 14.438 11.236 L 13.674 10.987 C 13.516 10.935 13.372 10.846 13.254 10.729 C 13.136 10.611 13.047 10.467 12.994 10.309 L 12.742 9.536 C 12.689 9.379 12.586 9.242 12.449 9.146 C 12.347 9.073 12.23 9.025 12.106 9.006 C 11.982 8.987 11.855 8.998 11.736 9.037 C 11.616 9.076 11.508 9.142 11.419 9.231 C 11.33 9.319 11.264 9.427 11.224 9.546 L 10.977 10.308 C 10.925 10.466 10.838 10.61 10.721 10.728 C 10.607 10.845 10.467 10.934 10.312 10.987 L 9.539 11.239 C 9.38 11.293 9.242 11.396 9.145 11.533 C 9.047 11.669 8.995 11.833 8.996 12.001 C 8.997 12.169 9.051 12.333 9.15 12.468 C 9.249 12.604 9.388 12.705 9.547 12.757 L 10.31 13.004 C 10.469 13.058 10.614 13.147 10.732 13.265 C 10.851 13.384 10.939 13.528 10.99 13.687 L 11.243 14.461 C 11.298 14.618 11.4 14.753 11.535 14.849 Z';

const DEFAULT_PROPS = {
  edgeSensitivity: 30,
  glowColor: '40 80 80',
  backgroundColor: '#0c0f13',
  borderRadius: 28,
  glowRadius: 40,
  glowIntensity: 1.0,
  coneSpread: 25,
  animated: false
};

const DEFAULT_COLORS = ['#6ec9f7', '#74cefd', '#38bdf8'];

const propData: PropRow[] = [
  { name: 'children', type: 'JSX.Element', default: '-', description: 'Content rendered inside the card.' },
  { name: 'className', type: 'string', default: '""', description: 'Additional CSS classes for the outer wrapper.' },
  {
    name: 'edgeSensitivity',
    type: 'number',
    default: '30',
    description: 'How close the pointer must be to the edge for the glow to appear (0-100).'
  },
  {
    name: 'glowColor',
    type: 'string',
    default: '"40 80 80"',
    description: 'HSL values for the glow color, as "H S L" (e.g. "40 80 80").'
  },
  { name: 'backgroundColor', type: 'string', default: '"#0c0f13"', description: 'Background color of the card.' },
  { name: 'borderRadius', type: 'number', default: '28', description: 'Corner radius of the card in pixels.' },
  {
    name: 'glowRadius',
    type: 'number',
    default: '40',
    description: 'How far the outer glow extends beyond the card in pixels.'
  },
  { name: 'glowIntensity', type: 'number', default: '1.0', description: 'Multiplier for glow opacity (0.1-3.0).' },
  {
    name: 'coneSpread',
    type: 'number',
    default: '25',
    description: 'Width of the directional cone mask as a percentage (5-45).'
  },
  { name: 'animated', type: 'boolean', default: 'false', description: 'Play an intro sweep animation on mount.' },
  {
    name: 'colors',
    type: 'string[]',
    default: '[...]',
    description: 'Array of 3 hex colors for the mesh gradient border, distributed across positions.'
  }
];

export default function BorderGlowDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [colors, setColors] = createSignal<string[]>([...DEFAULT_COLORS]);

  const renderedBackgroundColor = useColorModeValue(
    () => (props().backgroundColor === DEFAULT_PROPS.backgroundColor ? '#ffffff' : props().backgroundColor),
    () => props().backgroundColor
  );
  const renderedGlowColor = useColorModeValue(
    () => (props().glowColor === DEFAULT_PROPS.glowColor ? '213 55 39' : props().glowColor),
    () => props().glowColor
  );
  const renderedGlowIntensity = useColorModeValue(
    () => (props().glowIntensity === DEFAULT_PROPS.glowIntensity ? 1.25 : props().glowIntensity),
    () => props().glowIntensity
  );
  const renderedFillOpacity = useColorModeValue(0.22, 0.5);

  const updateColor = (index: number, value: string) => {
    const next = [...colors()];
    next[index] = value;
    setColors(next);
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
              'padding-top': '40px',
              'padding-bottom': '40px',
              overflow: 'hidden'
            }}
          >
            <BorderGlow
              edgeSensitivity={props().edgeSensitivity}
              borderRadius={props().borderRadius}
              glowRadius={props().glowRadius}
              coneSpread={props().coneSpread}
              animated={props().animated}
              backgroundColor={renderedBackgroundColor()}
              glowColor={renderedGlowColor()}
              glowIntensity={renderedGlowIntensity()}
              fillOpacity={renderedFillOpacity()}
              colors={colors()}
            >
              <div
                style={{
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'flex-start',
                  'justify-content': 'center',
                  padding: '2em',
                  'min-height': '200px'
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  width="40"
                  height="40"
                  aria-hidden="true"
                  style={{ 'margin-bottom': '12px' }}
                >
                  <path d={SPARKLE} />
                </svg>
                <p style={{ margin: 0, 'font-weight': 500, 'font-size': '1.4rem', 'letter-spacing': '-.5px' }}>
                  Hover Near the Edges
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    color: 'var(--text-muted)',
                    'font-size': '14px',
                    'max-width': '40ch'
                  }}
                >
                  Move your cursor close to the card border to see the colored glow effect follow your pointer
                  direction.
                </p>
              </div>
            </BorderGlow>
          </div>

          <Customize>
            <PreviewSlider
              min={0}
              max={80}
              step={1}
              title="Edge Sensitivity"
              value={props().edgeSensitivity}
              onChange={val => updateProp('edgeSensitivity', val)}
            />
            <PreviewSlider
              min={0}
              max={50}
              step={1}
              title="Border Radius"
              value={props().borderRadius}
              onChange={val => updateProp('borderRadius', val)}
            />
            <PreviewSlider
              min={10}
              max={80}
              step={1}
              title="Glow Radius"
              value={props().glowRadius}
              onChange={val => updateProp('glowRadius', val)}
            />
            <PreviewSlider
              min={0.1}
              max={3}
              step={0.1}
              title="Glow Intensity"
              value={props().glowIntensity}
              onChange={val => updateProp('glowIntensity', val)}
            />
            <PreviewSlider
              min={5}
              max={45}
              step={1}
              title="Cone Spread"
              value={props().coneSpread}
              onChange={val => updateProp('coneSpread', val)}
            />
            <PreviewSwitch
              title="Animated Intro"
              isChecked={props().animated}
              onChange={val => updateProp('animated', val)}
            />
            <PreviewColorPickerCustom
              title="Background"
              color={renderedBackgroundColor()}
              onChange={val => updateProp('backgroundColor', val)}
            />
            <For each={colors()} keyed={false}>
              {(c, i) => (
                <PreviewColorPickerCustom
                  title={`Gradient Color ${i + 1}`}
                  color={c()}
                  onChange={val => updateColor(i, val)}
                />
              )}
            </For>
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={borderGlow} componentName="BorderGlow" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
