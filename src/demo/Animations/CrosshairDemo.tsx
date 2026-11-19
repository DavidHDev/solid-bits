import { createMemo, createSignal } from 'solid-js';
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
import { isLight } from '@/hooks/useTheme';

import Crosshair, { type CrosshairProps } from '@/content/Animations/Crosshair/Crosshair';
import { crosshair } from '@/constants/code/Animations/crosshairCode';

const LIGHT_INK = '#18181b';

const DEFAULT_PROPS = {
  color: '#ffffff',
  scope: 'container',
  targetEffect: 'lock',
  lineStyle: 'solid',
  blendMode: 'normal',
  thickness: 1,
  opacity: 0.85,
  gap: 0,
  fade: 0,
  smoothing: 0.35,
  showCoordinates: true,
  clickPulse: true,
  hideCursor: false
};

const SCOPE_OPTIONS = [
  { value: 'container', label: 'Container' },
  { value: 'viewport', label: 'Viewport' }
];

const EFFECT_OPTIONS = [
  { value: 'lock', label: 'Lock' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'none', label: 'None' }
];

const LINE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' }
];

const BLEND_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'difference', label: 'Difference' }
];

const propData: PropRow[] = [
  { name: 'color', type: 'string', default: "'#ffffff'", description: 'Color of the lines, labels and brackets.' },
  {
    name: 'containerRef',
    type: 'HTMLElement | null',
    default: 'null',
    description:
      'Keeps the crosshair inside this element, which needs a position other than static. Without it the crosshair covers the whole viewport.'
  },
  { name: 'thickness', type: 'number', default: '1', description: 'Line thickness in px.' },
  { name: 'opacity', type: 'number', default: '0.85', description: 'Opacity of everything the crosshair draws.' },
  {
    name: 'lineStyle',
    type: "'solid' | 'dashed' | 'dotted'",
    default: "'solid'",
    description: 'Stroke style of the two lines.'
  },
  {
    name: 'gap',
    type: 'number',
    default: '0',
    description: 'Empty space in px left around the pointer where the lines would cross.'
  },
  {
    name: 'fade',
    type: 'number',
    default: '0',
    description: 'How much the lines fade out toward the edges, from 0 to 1.'
  },
  {
    name: 'smoothing',
    type: 'number',
    default: '0.35',
    description: 'How far the lines trail behind the pointer. 0 sticks to it.'
  },
  {
    name: 'showCoordinates',
    type: 'boolean',
    default: 'true',
    description: 'Shows the pointer position where the lines meet the edges, and the size of a locked target.'
  },
  {
    name: 'targetEffect',
    type: "'lock' | 'glitch' | 'none'",
    default: "'lock'",
    description:
      'What happens over a target. Lock frames it with corner brackets and measures it, glitch shakes the lines like a bad signal.'
  },
  {
    name: 'targetSelector',
    type: 'string',
    default: "'a, button, [data-crosshair-target]'",
    description: 'CSS selector for the elements the crosshair reacts to.'
  },
  {
    name: 'clickPulse',
    type: 'boolean',
    default: 'true',
    description: 'Sends a ring out from the pointer on every click or tap.'
  },
  {
    name: 'hideCursor',
    type: 'boolean',
    default: 'false',
    description: 'Hides the system cursor inside the crosshair area and marks the pointer with a dot instead.'
  },
  {
    name: 'blendMode',
    type: "'normal' | 'difference'",
    default: "'normal'",
    description: 'Difference inverts whatever is under the lines, so they stay visible on any background.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the canvas.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the canvas.' }
];

export default function CrosshairDemo() {
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [host, setHost] = createSignal<HTMLDivElement | null>(null);
  const inkDefault = createMemo(() => isLight() && props().color === DEFAULT_PROPS.color);
  const color = createMemo(() => (inkDefault() ? LIGHT_INK : props().color));
  const computedProps = createMemo(() => (inkDefault() ? { color: LIGHT_INK } : {}));
  const crosshairProps = createMemo(() => {
    const { scope, ...rest } = props();
    return {
      ...rest,
      color: color(),
      containerRef: scope === 'viewport' ? null : host()
    } as CrosshairProps;
  });

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetProps}
      hasChanges={hasChanges()}
      demoOnlyProps={['scope']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            ref={setHost}
            class="demo-container"
            style={{ position: 'relative', 'min-height': '440px', overflow: 'hidden' }}
          >
            <Crosshair {...crosshairProps()} />

            <div
              style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'text-align': 'center',
                padding: '0 24px',
                'user-select': 'none'
              }}
            >
              <div
                data-crosshair-target
                class="text-[2.1rem] md:text-[3.4rem]"
                style={{ 'font-weight': 500, 'letter-spacing': '-1.5px', 'line-height': 1.05 }}
              >
                Built to the pixel
              </div>
              <p
                style={{
                  'margin-top': '16px',
                  color: 'var(--text-muted)',
                  'font-size': '15px',
                  'max-width': '380px'
                }}
              >
                Move around, then hover the buttons and the heading.
              </p>
              <div
                style={{
                  display: 'flex',
                  'margin-top': '32px',
                  gap: '12px',
                  'flex-wrap': 'wrap',
                  'justify-content': 'center'
                }}
              >
                <button
                  type="button"
                  style={{
                    height: '44px',
                    padding: '0 20px',
                    'border-radius': '10px',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-body)',
                    'font-size': '15px',
                    'font-weight': 500,
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Get started
                </button>
                <a
                  href="https://github.com/DavidHDev/solid-bits"
                  target="_blank"
                  rel="noreferrer"
                  class="bg-[var(--surface-ghost)] hover:bg-[var(--surface-ghost-hover)]"
                  style={{
                    display: 'inline-flex',
                    'align-items': 'center',
                    height: '44px',
                    padding: '0 20px',
                    'border-radius': '10px',
                    'font-size': '15px',
                    'font-weight': 500
                  }}
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>

          <Customize>
            <PreviewColorPickerCustom title="Color" color={color()} onChange={value => updateProp('color', value)} />

            <PreviewSelect
              title="Scope"
              options={SCOPE_OPTIONS}
              value={props().scope}
              onChange={value => updateProp('scope', value)}
            />

            <PreviewSelect
              title="Target Effect"
              options={EFFECT_OPTIONS}
              value={props().targetEffect}
              onChange={value => updateProp('targetEffect', value)}
            />

            <PreviewSelect
              title="Line Style"
              options={LINE_OPTIONS}
              value={props().lineStyle}
              onChange={value => updateProp('lineStyle', value)}
            />

            <PreviewSelect
              title="Blend Mode"
              options={BLEND_OPTIONS}
              value={props().blendMode}
              onChange={value => updateProp('blendMode', value)}
            />

            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={4}
              step={0.5}
              value={props().thickness}
              onChange={value => updateProp('thickness', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={props().opacity}
              onChange={value => updateProp('opacity', value)}
            />

            <PreviewSlider
              title="Gap"
              min={0}
              max={40}
              step={1}
              value={props().gap}
              onChange={value => updateProp('gap', value)}
              valueUnit="px"
            />

            <PreviewSlider
              title="Fade"
              min={0}
              max={1}
              step={0.05}
              value={props().fade}
              onChange={value => updateProp('fade', value)}
            />

            <PreviewSlider
              title="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={props().smoothing}
              onChange={value => updateProp('smoothing', value)}
            />

            <PreviewSwitch
              title="Coordinates"
              isChecked={props().showCoordinates}
              onChange={value => updateProp('showCoordinates', value)}
            />

            <PreviewSwitch
              title="Click Pulse"
              isChecked={props().clickPulse}
              onChange={value => updateProp('clickPulse', value)}
            />

            <PreviewSwitch
              title="Hide Cursor"
              isChecked={props().hideCursor}
              onChange={value => updateProp('hideCursor', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={[]} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={crosshair} componentName="Crosshair" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
