import { createEffect, createMemo, createSignal, Show } from 'solid-js';
import { CodeTab, PreviewTab, TabsLayout } from '@/components/common/TabsLayout';
import CodeExample from '@/components/common/CodeExample';
import Customize from '@/components/common/Customize';
import Keyed from '@/components/common/Keyed';
import PreviewColorPickerCustom from '@/components/common/PreviewColorPickerCustom';
import PreviewInput from '@/components/common/PreviewInput';
import PreviewSelect from '@/components/common/PreviewSelect';
import PreviewSlider from '@/components/common/PreviewSlider';
import PreviewSwitch from '@/components/common/PreviewSwitch';
import PropTable, { type PropRow } from '@/components/common/PropTable';
import RefreshButton from '@/components/common/RefreshButton';
import { ComponentPropsProvider } from '@/components/context/ComponentPropsContext';
import { useComponentProps } from '@/hooks/useComponentProps';
import { useForceRerender } from '@/hooks/useForceRerender';
import { isLight } from '@/hooks/useTheme';

import { markBlack } from '@/assets/logos';
import { metallicPaint } from '@/constants/code/Animations/metallicPaintCode';
import MetallicPaint, { type MetallicPaintProps } from '@/content/Animations/MetallicPaint/MetallicPaint';

const LOOK = {
  content: 'logo',
  text: 'Solid Bits',
  color: '#ffffff',
  density: 2,
  softness: 0.1,
  dispersion: 0.3,
  distortion: 0.07,
  edgeBend: 0.6,
  angle: 70,
  scale: 0.6
};

const DEFAULT_PROPS = {
  preset: 'chrome',
  ...LOOK,
  speed: 1,
  rotation: 0,
  mouseTilt: 0.5,
  intro: true
};

const PRESETS: Record<string, typeof LOOK> = {
  chrome: LOOK,
  liquid: { ...LOOK, edgeBend: 0.92, distortion: 0.22, density: 2.6, dispersion: 0.45 },
  noir: {
    ...LOOK,
    color: '#b4b6b9',
    softness: 0.6,
    density: 1.6,
    dispersion: 0,
    distortion: 0.05,
    edgeBend: 0.5,
    angle: 90
  },
  gold: { ...LOOK, content: 'text', text: 'Gold', color: '#f2c46b', dispersion: 0.15, scale: 0.7 },
  prism: {
    ...LOOK,
    color: '#9cc8ff',
    softness: 0.8,
    density: 6,
    dispersion: 1,
    distortion: 0.4,
    edgeBend: 0.4,
    angle: 0
  },
  brushed: { ...LOOK, softness: 1, density: 2.5, dispersion: 0, distortion: 0, edgeBend: 0.5, angle: 100 }
};

const PRESET_OPTIONS = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'noir', label: 'Noir' },
  { value: 'gold', label: 'Gold' },
  { value: 'prism', label: 'Prism' },
  { value: 'brushed', label: 'Brushed' }
];

const CONTENT_OPTIONS = [
  { value: 'logo', label: 'Logo' },
  { value: 'text', label: 'Text' }
];

const propData: PropRow[] = [
  {
    name: 'imageSrc',
    type: 'string',
    default: 'undefined',
    description: 'URL of the logo or image to paint. SVGs work best. Transparent pixels are left empty.'
  },
  {
    name: 'text',
    type: 'string',
    default: 'undefined',
    description: 'Text to paint instead of an image. Takes priority over imageSrc.'
  },
  { name: 'fontFamily', type: 'string', default: "'system-ui, sans-serif'", description: 'Font used for text.' },
  { name: 'fontWeight', type: 'number', default: '500', description: 'Font weight used for text.' },
  {
    name: 'color',
    type: 'string',
    default: "'#ffffff'",
    description: 'Tint of the metal. White keeps it chrome, warm tones turn it gold or copper.'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'transparent'",
    description: 'Color behind the shape. By default the canvas is transparent.'
  },
  { name: 'density', type: 'number', default: '2', description: 'How many reflection bands run across the shape.' },
  {
    name: 'softness',
    type: 'number',
    default: '0.1',
    description: 'Softness of the reflection edges, from 0 for crisp chrome to 1 for brushed metal.'
  },
  {
    name: 'dispersion',
    type: 'number',
    default: '0.3',
    description: 'Rainbow fringes where the reflections bend, from 0 to 1.'
  },
  {
    name: 'distortion',
    type: 'number',
    default: '0.07',
    description: 'How much the reflections ripple as they flow, from 0 to 1.'
  },
  {
    name: 'edgeBend',
    type: 'number',
    default: '0.6',
    description: 'How strongly the reflections bend around the edges of the shape, from 0 to 1.'
  },
  { name: 'angle', type: 'number', default: '70', description: 'Direction the reflections flow in, in degrees.' },
  { name: 'speed', type: 'number', default: '1', description: 'Speed of the flow. 0 freezes it.' },
  { name: 'scale', type: 'number', default: '0.6', description: 'Size of the shape inside the canvas.' },
  { name: 'rotation', type: 'number', default: '0', description: 'Rotation of the shape, in degrees.' },
  {
    name: 'mouseTilt',
    type: 'number',
    default: '0.5',
    description: 'How much the reflections shift as the cursor moves, as if tilting the metal.'
  },
  {
    name: 'lightMode',
    type: 'boolean',
    default: 'false',
    description: 'Adds a soft dark rim and dims the brightest highlights so the shape reads on light pages.'
  },
  { name: 'intro', type: 'boolean', default: 'true', description: 'Pours the metal in from the outline on mount.' },
  { name: 'paused', type: 'boolean', default: 'false', description: 'Freezes the animation.' },
  {
    name: 'dpr',
    type: 'number',
    default: 'auto',
    description: 'Device pixel ratio cap. Renders at 2× or more for clean edges.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: 'undefined', description: 'Inline styles for the container.' }
];

type Upload = { url: string; name: string };

export default function MetallicPaintDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, defaultProps, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [upload, setUpload] = createSignal<Upload | null>(null);
  let inputEl: HTMLInputElement | undefined;

  createEffect(upload, value => {
    if (!value) return undefined;
    return () => URL.revokeObjectURL(value.url);
  });

  const onFile = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setUpload({ url: URL.createObjectURL(file), name: file.name });
  };

  const resetAll = () => {
    resetProps();
    setUpload(null);
  };

  const sourceProps = createMemo<Pick<MetallicPaintProps, 'text' | 'fontFamily' | 'imageSrc'>>(() =>
    props().content === 'text'
      ? { text: props().text || 'Solid Bits', fontFamily: 'Geist, system-ui, sans-serif' }
      : { imageSrc: upload()?.url || markBlack }
  );

  const settings = createMemo(() => {
    const { preset: _preset, content: _content, text: _text, ...rest } = props();
    return rest;
  });

  const computedProps = createMemo(() => ({ ...sourceProps(), ...(isLight() ? { lightMode: true } : {}) }));

  const applyPreset = (value: string) => {
    const defaults = defaultProps();
    const base = Object.fromEntries(
      Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof typeof DEFAULT_PROPS]])
    );
    updateProps({ ...base, ...PRESETS[value], preset: value });
    forceRerender();
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetAll}
      hasChanges={hasChanges() || Boolean(upload())}
      demoOnlyProps={['preset', 'content', 'text']}
      computedProps={computedProps()}
    >
      <TabsLayout>
        <PreviewTab>
          <div
            class="demo-container h-[380px] md:h-[500px]"
            style={{ position: 'relative', padding: 0, overflow: 'hidden' }}
          >
            <Keyed token={rerenderKey()}>
              {() => <MetallicPaint {...(settings() as MetallicPaintProps)} {...sourceProps()} lightMode={isLight()} />}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Preset" options={PRESET_OPTIONS} value={props().preset} onChange={applyPreset} />
            <PreviewSelect
              title="Content"
              options={CONTENT_OPTIONS}
              value={props().content}
              onChange={value => updateProp('content', value)}
            />
            <Show when={props().content === 'logo'}>
              <div class="scrubber">
                <button type="button" class="scrubber-track scrubber-track--select" onClick={() => inputEl?.click()}>
                  <span class="scrubber-label">Upload</span>
                  <span class="scrubber-select-right">
                    <span
                      class="scrubber-value"
                      style={{
                        'max-width': '160px',
                        overflow: 'hidden',
                        'text-overflow': 'ellipsis',
                        'white-space': 'nowrap'
                      }}
                    >
                      {upload()?.name ?? 'SVG or PNG'}
                    </span>
                  </span>
                </button>
                <input
                  ref={el => (inputEl = el)}
                  type="file"
                  accept="image/svg+xml,image/png,image/webp"
                  hidden
                  onChange={onFile}
                />
              </div>
            </Show>
            <PreviewInput
              title="Text"
              value={props().text}
              maxLength={24}
              isDisabled={props().content !== 'text'}
              onChange={value => updateProp('text', value)}
            />
            <PreviewColorPickerCustom
              title="Color"
              color={settings().color}
              onChange={value => updateProp('color', value)}
            />
            <PreviewSlider
              title="Density"
              min={0.5}
              max={8}
              step={0.1}
              value={settings().density}
              onChange={value => updateProp('density', value)}
            />
            <PreviewSlider
              title="Softness"
              min={0}
              max={1}
              step={0.01}
              value={settings().softness}
              onChange={value => updateProp('softness', value)}
            />
            <PreviewSlider
              title="Dispersion"
              min={0}
              max={1}
              step={0.01}
              value={settings().dispersion}
              onChange={value => updateProp('dispersion', value)}
            />
            <PreviewSlider
              title="Distortion"
              min={0}
              max={1}
              step={0.01}
              value={settings().distortion}
              onChange={value => updateProp('distortion', value)}
            />
            <PreviewSlider
              title="Edge Bend"
              min={0}
              max={1}
              step={0.01}
              value={settings().edgeBend}
              onChange={value => updateProp('edgeBend', value)}
            />
            <PreviewSlider
              title="Angle"
              min={0}
              max={360}
              step={1}
              value={settings().angle}
              valueUnit="°"
              onChange={value => updateProp('angle', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={settings().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSlider
              title="Scale"
              min={0.2}
              max={1.2}
              step={0.01}
              value={settings().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Rotation"
              min={-180}
              max={180}
              step={1}
              value={settings().rotation}
              valueUnit="°"
              onChange={value => updateProp('rotation', value)}
            />
            <PreviewSlider
              title="Mouse Tilt"
              min={0}
              max={1.5}
              step={0.05}
              value={settings().mouseTilt}
              onChange={value => updateProp('mouseTilt', value)}
            />
            <PreviewSwitch
              title="Intro"
              isChecked={settings().intro}
              onChange={value => {
                updateProp('intro', value);
                forceRerender();
              }}
            />
          </Customize>

          <PropTable data={propData} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={metallicPaint} componentName="MetallicPaint" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
