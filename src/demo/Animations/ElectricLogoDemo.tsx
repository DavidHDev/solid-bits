import { createEffect, createMemo, createSignal, untrack } from 'solid-js';
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
import { colorMode, isLight } from '@/hooks/useTheme';

import { markWhite } from '@/assets/logos';
import apple from '@/assets/brands/apple.svg';
import tesla from '@/assets/brands/tesla.svg';
import openai from '@/assets/brands/openai.svg';
import { electricLogo } from '@/constants/code/Animations/electricLogoCode';
import ElectricLogo from '@/content/Animations/ElectricLogo/ElectricLogo';

const LOGOS: Record<string, string> = { logo: markWhite, apple, tesla, openai };

type Palette = { color: string; glowColor: string };

const PALETTES: Record<string, { dark: Palette; light: Palette }> = {
  logo: {
    dark: { color: '#c7e7ff', glowColor: '#6ec9f7' },
    light: { color: '#3d8bd4', glowColor: '#a9d1f0' }
  },
  apple: {
    dark: { color: '#cadcff', glowColor: '#528aff' },
    light: { color: '#3377ff', glowColor: '#99b8ff' }
  },
  tesla: {
    dark: { color: '#ffcdd2', glowColor: '#ff5260' },
    light: { color: '#ef3848', glowColor: '#ffa3ab' }
  },
  openai: {
    dark: { color: '#c2fff1', glowColor: '#1fd8b6' },
    light: { color: '#0ea88f', glowColor: '#7fe6d5' }
  }
};

const LIGHT_BEND = 0.5;

const lightFor = (name: keyof Palette, value: string) =>
  Object.values(PALETTES).find(palette => palette.dark[name] === value)?.light[name] ?? value;

const DEFAULT_PROPS = {
  color: PALETTES.logo.dark.color,
  glowColor: PALETTES.logo.dark.glowColor,
  scale: 0.7,
  intensity: 1,
  glow: 1,
  thickness: 1.5,
  strands: 4,
  bend: 0.6,
  crackle: 1.5,
  arcs: 1,
  flicker: 0.6,
  fill: 0,
  speed: 2.5,
  interactive: true,
  cursorIntensity: 0.75,
  cursorRadius: 100
};

const propData: PropRow[] = [
  {
    name: 'src',
    type: 'string',
    default: 'lightning bolt',
    description:
      'Any image URL. SVGs and transparent PNGs are traced by their alpha, opaque images by keying out their backdrop colour.'
  },
  { name: 'color', type: 'string', default: "'#c7e7ff'", description: 'Colour of the hot core of every strand.' },
  {
    name: 'glowColor',
    type: 'string',
    default: "'#6ec9f7'",
    description: 'Colour of the glow around the strands, the bloom and the interior fill.'
  },
  {
    name: 'scale',
    type: 'number',
    default: '0.7',
    description: 'Size of the logo as a fraction of the container. The glow and arcs extend beyond it.'
  },
  { name: 'intensity', type: 'number', default: '1', description: 'Overall brightness of the effect.' },
  {
    name: 'glow',
    type: 'number',
    default: '1',
    description: 'Strength of the halo around strands and the soft bloom around the shape.'
  },
  {
    name: 'thickness',
    type: 'number',
    default: '1.5',
    description:
      'Width of the main strand, in px. Satellite strands are thinner, and every strand swells and thins as it flows.'
  },
  {
    name: 'strands',
    type: 'number',
    default: '4',
    description: 'Number of filaments tracing the outline, from 1 to 6. Extra strands come and go along the edge.'
  },
  {
    name: 'bend',
    type: 'number',
    default: '0.6',
    description: 'How far the strands sway and ripple away from the outline. The main strand stays closest.'
  },
  {
    name: 'crackle',
    type: 'number',
    default: '1.5',
    description: 'Size of the fine crinkle along every strand and arc.'
  },
  {
    name: 'arcs',
    type: 'number',
    default: '1',
    description: 'How often short arcs leap off the edge and land further along it. 0 turns them off.'
  },
  {
    name: 'flicker',
    type: 'number',
    default: '0.6',
    description: 'How much the whole effect pulses and each strand shimmers in brightness.'
  },
  {
    name: 'fill',
    type: 'number',
    default: '0',
    description: 'Translucent glow inside the shape, brightest near its edges.'
  },
  { name: 'speed', type: 'number', default: '2.5', description: 'Animation speed. 0 freezes the current frame.' },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description:
      'Turn on pointer interactions. Hovering charges the lightning around the cursor, and a click sends a ripple through it with a burst of arcs.'
  },
  {
    name: 'cursorIntensity',
    type: 'number',
    default: '0.75',
    description: 'How strongly the lightning charges up around the cursor. 0 turns the hover charge off.'
  },
  {
    name: 'cursorRadius',
    type: 'number',
    default: '100',
    description: 'Radius of the charged area around the cursor, in px.'
  },
  {
    name: 'theme',
    type: "'dark' | 'light'",
    default: "'dark'",
    description:
      'The background the logo sits on. Dark renders the lightning as emitted light. Light renders crisp electric ink with a white-hot core and a lighter fill.'
  },
  {
    name: 'onRender',
    type: '(canvas: HTMLCanvasElement) => void',
    default: 'undefined',
    description:
      'Called immediately after each rendered frame. Copy the canvas synchronously to capture the current frame for effects such as live reflections.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra classes on the container.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles on the container.' }
];

type Upload = { url: string; name: string };

export default function ElectricLogoDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, updateProps, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [image, setImage] = createSignal(
    untrack(() => Object.keys(PALETTES).find(name => PALETTES[name].dark.color === props().color) || 'logo')
  );
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
    setImage('upload');
  };

  const imageOptions = createMemo(() => [
    { label: 'Solid Bits', value: 'logo' },
    { label: 'Apple', value: 'apple' },
    { label: 'Tesla', value: 'tesla' },
    { label: 'OpenAI', value: 'openai' },
    ...(upload() ? [{ label: 'Your upload', value: 'upload' }] : [])
  ]);

  const src = createMemo(() => {
    const current = upload();
    return image() === 'upload' && current ? current.url : LOGOS[image()] || markWhite;
  });

  const renderedColor = createMemo(() => (isLight() ? lightFor('color', props().color) : props().color));
  const renderedGlow = createMemo(() => (isLight() ? lightFor('glowColor', props().glowColor) : props().glowColor));
  const renderedBend = createMemo(() => (isLight() && props().bend === DEFAULT_PROPS.bend ? LIGHT_BEND : props().bend));

  const selectImage = (value: string) => {
    setImage(value);
    const palette = PALETTES[value];
    if (palette) updateProps({ color: palette.dark.color, glowColor: palette.dark.glowColor });
  };

  const resetAll = () => {
    resetProps();
    setImage('logo');
  };

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetAll}
      hasChanges={hasChanges()}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <Keyed token={rerenderKey()}>
              {() => (
                <ElectricLogo
                  src={src()}
                  color={renderedColor()}
                  glowColor={renderedGlow()}
                  scale={props().scale}
                  intensity={props().intensity}
                  glow={props().glow}
                  thickness={props().thickness}
                  strands={props().strands}
                  bend={renderedBend()}
                  crackle={props().crackle}
                  arcs={props().arcs}
                  flicker={props().flicker}
                  fill={props().fill}
                  speed={props().speed}
                  interactive={props().interactive}
                  cursorIntensity={props().cursorIntensity}
                  cursorRadius={props().cursorRadius}
                  theme={colorMode()}
                />
              )}
            </Keyed>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <PreviewSelect title="Image" options={imageOptions()} value={image()} onChange={selectImage} />
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
                accept="image/svg+xml,image/png,image/webp,image/jpeg"
                hidden
                onChange={onFile}
              />
            </div>

            <PreviewColorPickerCustom
              title="Color"
              color={renderedColor()}
              onChange={value => updateProp('color', value)}
            />
            <PreviewColorPickerCustom
              title="Glow Color"
              color={renderedGlow()}
              onChange={value => updateProp('glowColor', value)}
            />

            <PreviewSlider
              title="Scale"
              min={0.2}
              max={1}
              step={0.05}
              value={props().scale}
              onChange={value => updateProp('scale', value)}
            />
            <PreviewSlider
              title="Intensity"
              min={0.2}
              max={2}
              step={0.05}
              value={props().intensity}
              onChange={value => updateProp('intensity', value)}
            />
            <PreviewSlider
              title="Glow"
              min={0}
              max={2}
              step={0.05}
              value={props().glow}
              onChange={value => updateProp('glow', value)}
            />
            <PreviewSlider
              title="Fill"
              min={0}
              max={1}
              step={0.05}
              value={props().fill}
              onChange={value => updateProp('fill', value)}
            />
            <PreviewSlider
              title="Thickness"
              min={0.5}
              max={3}
              step={0.1}
              value={props().thickness}
              valueUnit="px"
              onChange={value => updateProp('thickness', value)}
            />
            <PreviewSlider
              title="Strands"
              min={1}
              max={6}
              step={1}
              value={props().strands}
              onChange={value => updateProp('strands', value)}
            />
            <PreviewSlider
              title="Bend"
              min={0}
              max={2}
              step={0.05}
              value={renderedBend()}
              onChange={value => updateProp('bend', value)}
            />
            <PreviewSlider
              title="Crackle"
              min={0}
              max={2}
              step={0.05}
              value={props().crackle}
              onChange={value => updateProp('crackle', value)}
            />
            <PreviewSlider
              title="Arcs"
              min={0}
              max={2}
              step={0.05}
              value={props().arcs}
              onChange={value => updateProp('arcs', value)}
            />
            <PreviewSlider
              title="Flicker"
              min={0}
              max={1}
              step={0.05}
              value={props().flicker}
              onChange={value => updateProp('flicker', value)}
            />
            <PreviewSlider
              title="Speed"
              min={0}
              max={3}
              step={0.05}
              value={props().speed}
              onChange={value => updateProp('speed', value)}
            />
            <PreviewSwitch
              title="Interactive"
              isChecked={props().interactive}
              onChange={value => updateProp('interactive', value)}
            />
            <PreviewSlider
              title="Cursor Intensity"
              min={0}
              max={2}
              step={0.05}
              isDisabled={!props().interactive}
              value={props().cursorIntensity}
              onChange={value => updateProp('cursorIntensity', value)}
            />
            <PreviewSlider
              title="Cursor Radius"
              min={40}
              max={300}
              step={5}
              isDisabled={!props().interactive}
              value={props().cursorRadius}
              valueUnit="px"
              onChange={value => updateProp('cursorRadius', value)}
            />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['ogl']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={electricLogo} componentName="ElectricLogo" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
