import { createMemo, createSignal, onSettled } from 'solid-js';
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
import { logoBlack, markBlack, markWhite } from '@/assets/logos';

import Lanyard, { type LanyardProps } from '@/content/Components/Lanyard/Lanyard';
import { lanyard } from '@/constants/code/Components/lanyardCode';

type Slot = 'front' | 'back' | 'strap';
type Upload = { url: string; name: string };
type Uploads = Record<Slot, Upload | null>;
type Art = { front: string; back: string; strap: string };

const ORIENTATION_OPTIONS = [
  { label: 'Portrait', value: 'portrait' },
  { label: 'Landscape', value: 'landscape' }
];

const FIT_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' }
];

const FINISH_OPTIONS = [
  { label: 'Glossy', value: 'glossy' },
  { label: 'Matte', value: 'matte' },
  { label: 'Holographic', value: 'holographic' },
  { label: 'Metallic', value: 'metallic' }
];

const METAL_OPTIONS = [
  { label: 'Graphite', value: 'graphite' },
  { label: 'Silver', value: 'silver' },
  { label: 'Gold', value: 'gold' }
];

const ANCHOR_OPTIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' }
];

const DEFAULT_PROPS = {
  imageFit: 'cover',
  cardColor: '#ffffff',
  orientation: 'portrait',
  finish: 'glossy',
  cornerRadius: 0.3,
  size: 0.6,
  anchor: 'center',
  strapLength: 0.5,
  strapColor: '#111111',
  strapWidth: 0.65,
  plainStrap: false,
  metal: 'silver',
  gravity: 1,
  damping: 0.5,
  elasticity: 0.5,
  breeze: 0.5,
  interactive: true,
  intro: true
};

const EMPTY_UPLOADS: Uploads = { front: null, back: null, strap: null };

const loadArt = (src: string) =>
  new Promise<HTMLImageElement | null>(resolve => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

const paintArt = (width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) =>
  new Promise<string>(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx);
    canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : canvas.toDataURL()), 'image/png');
  });

const drawCentered = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  width: number
) => {
  if (!image || !image.width) return;
  const height = (image.height / image.width) * width;
  ctx.drawImage(image, x - width / 2, y - height / 2, width, height);
};

let artPromise: Promise<Art> | null = null;

const composeArt = () => {
  if (artPromise) return artPromise;
  artPromise = (async () => {
    await document.fonts?.load('500 40px Geist').catch(() => undefined);
    const [wordmark, mark, markLight] = await Promise.all([loadArt(logoBlack), loadArt(markBlack), loadArt(markWhite)]);
    const font = (size: number) => `500 ${size}px Geist, system-ui, sans-serif`;
    const [front, back, strap] = await Promise.all([
      paintArt(1024, 1440, ctx => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1024, 1440);
        drawCentered(ctx, mark, 128, 128, 104);
        drawCentered(ctx, wordmark, 512, 720, 640);
        ctx.fillStyle = '#6d6f72';
        ctx.font = font(52);
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Animated components', 76, 1352);
      }),
      paintArt(1024, 1440, ctx => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1024, 1440);
        ctx.globalAlpha = 0.1;
        drawCentered(ctx, mark, 512, 680, 440);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#15171a';
        ctx.font = font(48);
        ctx.textAlign = 'center';
        ctx.fillText('solid-bits.dev', 512, 1336);
      }),
      paintArt(1025, 250, ctx => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1025, 250);
        drawCentered(ctx, markLight, 512.5, 125, 96);
      })
    ]);
    return { front, back, strap };
  })();
  return artPromise;
};

const UploadField = (props: { title: string; file: Upload | null; onPick: (file: File) => void }) => {
  let inputEl: HTMLInputElement | undefined;

  const handleChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';
    if (picked) props.onPick(picked);
  };

  return (
    <div class="scrubber">
      <button type="button" class="scrubber-track scrubber-track--select" onClick={() => inputEl?.click()}>
        <span class="scrubber-label">{props.title}</span>
        <span class="scrubber-select-right">
          <span
            class="scrubber-value"
            style={{ 'max-width': '160px', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' }}
          >
            {props.file ? props.file.name : 'Upload'}
          </span>
        </span>
      </button>
      <input
        ref={el => (inputEl = el)}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
        hidden
        onChange={handleChange}
      />
    </div>
  );
};

const propData: PropRow[] = [
  {
    name: 'frontImage',
    type: 'string',
    default: 'undefined',
    description: 'Image URL printed on the front of the card. Any size or aspect works.'
  },
  {
    name: 'backImage',
    type: 'string',
    default: 'undefined',
    description: 'Image URL printed on the back. Falls back to frontImage, then to a blank card.'
  },
  {
    name: 'imageFit',
    type: "'cover' | 'contain'",
    default: "'cover'",
    description: 'How the images fit the card. Cover fills and crops, contain fits inside on the card color.'
  },
  {
    name: 'cardColor',
    type: 'string',
    default: "'#ffffff'",
    description: 'Color of the card itself, shown when there is no image and around contained images.'
  },
  {
    name: 'orientation',
    type: "'portrait' | 'landscape'",
    default: "'portrait'",
    description: 'Whether the card hangs tall or wide.'
  },
  {
    name: 'finish',
    type: "'glossy' | 'matte' | 'holographic' | 'metallic'",
    default: "'glossy'",
    description:
      'Surface of the card. Holographic adds a sparkling foil whose colors shift as the card turns, metallic a brushed sheen.'
  },
  {
    name: 'cornerRadius',
    type: 'number',
    default: '0.3',
    description: 'Roundness of the card corners, from 0 for square to 1 for very round.'
  },
  {
    name: 'size',
    type: 'number',
    default: '0.6',
    description: 'Height of the card as a fraction of the container height.'
  },
  {
    name: 'anchor',
    type: "'left' | 'center' | 'right'",
    default: "'center'",
    description: 'Where the band hangs from along the top edge of the container.'
  },
  {
    name: 'strapLength',
    type: 'number',
    default: '0.5',
    description: 'How far below the top edge the card hangs, from 0 for a short band to 1 for a long one.'
  },
  {
    name: 'strapImage',
    type: 'string',
    default: 'undefined',
    description:
      'Image URL printed along the band. A wide image repeats along its length, with its height spanning the band width.'
  },
  {
    name: 'strapColor',
    type: 'string',
    default: "'#111111'",
    description: 'Color of the band when there is no strap image.'
  },
  {
    name: 'strapWidth',
    type: 'number',
    default: '0.65',
    description: 'Width of the band relative to its default, from 0.4 to 2.'
  },
  {
    name: 'metal',
    type: "'graphite' | 'silver' | 'gold'",
    default: "'silver'",
    description: 'Finish of the clamp and the ring that holds the card.'
  },
  {
    name: 'gravity',
    type: 'number',
    default: '1',
    description: 'How strongly the card falls. Lower values float and swing slowly, 0 turns gravity off.'
  },
  {
    name: 'damping',
    type: 'number',
    default: '0.5',
    description: 'How quickly the swinging dies down, from 0 for a long sway to 1 for a quick settle.'
  },
  {
    name: 'elasticity',
    type: 'number',
    default: '0.5',
    description: 'How hard the band snaps the card back after it is stretched and released.'
  },
  {
    name: 'breeze',
    type: 'number',
    default: '0.5',
    description: 'A gentle, ever-changing wind that keeps the card moving when nobody touches it.'
  },
  {
    name: 'interactive',
    type: 'boolean',
    default: 'true',
    description: 'Lets visitors drag, stretch and throw the card, and click it to flip it over.'
  },
  {
    name: 'intro',
    type: 'boolean',
    default: 'true',
    description: 'On mount the card drops in from the side and swings into place.'
  },
  { name: 'className', type: 'string', default: "''", description: 'Extra class names for the root element.' },
  { name: 'style', type: 'JSX.CSSProperties', default: '-', description: 'Inline styles for the root element.' }
];

export default function LanyardDemo() {
  const { rerenderKey, forceRerender } = useForceRerender();
  const { props, updateProp, resetProps, hasChanges } = useComponentProps(DEFAULT_PROPS);
  const [uploads, setUploads] = createSignal<Uploads>(EMPTY_UPLOADS);
  const [art, setArt] = createSignal<Art | null>(null);
  let current: Uploads = EMPTY_UPLOADS;
  let alive = true;

  onSettled(() => {
    alive = true;
    composeArt().then(value => {
      if (alive) setArt(value);
    });
    return () => {
      alive = false;
      Object.values(current).forEach(upload => upload && URL.revokeObjectURL(upload.url));
      current = EMPTY_UPLOADS;
    };
  });

  const writeUploads = (next: Uploads) => {
    current = next;
    setUploads(next);
  };

  const pick = (slot: Slot, file: File) => {
    const previous = current[slot];
    if (previous) URL.revokeObjectURL(previous.url);
    writeUploads({ ...current, [slot]: { url: URL.createObjectURL(file), name: file.name } });
  };

  const resetAll = () => {
    resetProps();
    Object.values(current).forEach(upload => upload && URL.revokeObjectURL(upload.url));
    writeUploads(EMPTY_UPLOADS);
  };

  const settings = createMemo(() => {
    const { plainStrap, ...rest } = props();
    const files = uploads();
    const defaults = art();
    return {
      ...rest,
      frontImage: files.front?.url ?? defaults?.front,
      backImage: files.back?.url ?? (files.front ? files.front.url : defaults?.back),
      strapImage: plainStrap ? undefined : (files.strap?.url ?? defaults?.strap)
    } as LanyardProps;
  });

  const changed = createMemo(() => hasChanges() || Object.values(uploads()).some(Boolean));

  return (
    <ComponentPropsProvider
      props={props()}
      defaultProps={DEFAULT_PROPS}
      resetProps={resetAll}
      hasChanges={changed()}
      demoOnlyProps={['plainStrap']}
    >
      <TabsLayout>
        <PreviewTab>
          <div class="demo-container" style={{ position: 'relative', height: '500px', padding: 0, overflow: 'hidden' }}>
            <p
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                margin: 0,
                'font-size': '14px',
                color: 'var(--text-dimmed)',
                'pointer-events': 'none',
                'user-select': 'none'
              }}
            >
              Try dragging
            </p>
            <div style={{ position: 'absolute', inset: 0 }}>
              <Keyed token={rerenderKey()}>{() => <Lanyard {...settings()} />}</Keyed>
            </div>
            <RefreshButton onClick={forceRerender} />
          </div>

          <Customize>
            <UploadField title="Front Image" file={uploads().front} onPick={file => pick('front', file)} />
            <UploadField title="Back Image" file={uploads().back} onPick={file => pick('back', file)} />
            <UploadField title="Band Image" file={uploads().strap} onPick={file => pick('strap', file)} />
            <PreviewSelect
              title="Image Fit"
              options={FIT_OPTIONS}
              value={props().imageFit}
              onChange={v => updateProp('imageFit', v)}
            />
            <PreviewSelect
              title="Orientation"
              options={ORIENTATION_OPTIONS}
              value={props().orientation}
              onChange={v => updateProp('orientation', v)}
            />

            <PreviewSelect
              title="Finish"
              options={FINISH_OPTIONS}
              value={props().finish}
              onChange={v => updateProp('finish', v)}
            />
            <PreviewSelect
              title="Metal"
              options={METAL_OPTIONS}
              value={props().metal}
              onChange={v => updateProp('metal', v)}
            />
            <PreviewColorPickerCustom
              title="Card Color"
              color={props().cardColor}
              onChange={v => updateProp('cardColor', v)}
            />
            <PreviewSwitch
              title="Plain Band"
              isChecked={props().plainStrap}
              onChange={v => updateProp('plainStrap', v)}
            />
            <PreviewColorPickerCustom
              title="Band Color"
              color={props().strapColor}
              onChange={v => updateProp('strapColor', v)}
            />
            <PreviewSlider
              title="Corner Radius"
              min={0}
              max={1}
              step={0.05}
              value={props().cornerRadius}
              onChange={v => updateProp('cornerRadius', v)}
            />

            <PreviewSelect
              title="Anchor"
              options={ANCHOR_OPTIONS}
              value={props().anchor}
              onChange={v => updateProp('anchor', v)}
            />
            <PreviewSlider
              title="Size"
              min={0.2}
              max={0.8}
              step={0.01}
              value={props().size}
              onChange={v => updateProp('size', v)}
            />
            <PreviewSlider
              title="Band Length"
              min={0}
              max={1}
              step={0.05}
              value={props().strapLength}
              onChange={v => updateProp('strapLength', v)}
            />
            <PreviewSlider
              title="Band Width"
              min={0.4}
              max={2}
              step={0.05}
              value={props().strapWidth}
              onChange={v => updateProp('strapWidth', v)}
            />

            <PreviewSlider
              title="Gravity"
              min={0}
              max={2}
              step={0.05}
              value={props().gravity}
              onChange={v => updateProp('gravity', v)}
            />
            <PreviewSlider
              title="Damping"
              min={0}
              max={1}
              step={0.05}
              value={props().damping}
              onChange={v => updateProp('damping', v)}
            />
            <PreviewSlider
              title="Elasticity"
              min={0}
              max={1}
              step={0.05}
              value={props().elasticity}
              onChange={v => updateProp('elasticity', v)}
            />
            <PreviewSlider
              title="Breeze"
              min={0}
              max={1}
              step={0.05}
              value={props().breeze}
              onChange={v => updateProp('breeze', v)}
            />

            <PreviewSwitch
              title="Interactive"
              isChecked={props().interactive}
              onChange={v => updateProp('interactive', v)}
            />
            <PreviewSwitch title="Intro" isChecked={props().intro} onChange={v => updateProp('intro', v)} />
          </Customize>

          <PropTable data={propData} />
          <Dependencies dependencyList={['three']} />
        </PreviewTab>

        <CodeTab>
          <CodeExample codeObject={lanyard} componentName="Lanyard" />
        </CodeTab>
      </TabsLayout>
    </ComponentPropsProvider>
  );
}
