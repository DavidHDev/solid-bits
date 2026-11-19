import type { GrainientType } from '@/content/Backgrounds/Grainient/Grainient';

export const LOOK = {
  colors: ['#0c0f13', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa'],
  type: 'linear' as GrainientType,
  angle: 55,
  bands: 1,
  softness: 1,
  flow: 0.8,
  scale: 1,
  speed: 1,
  silk: 0.35,
  grainAmount: 0.08,
  grainSize: 1.2,
  grainAnimated: true,
  contrast: 1,
  saturation: 1,
  variation: 0
};

export const DEFAULT_PROPS = {
  preset: 'ember',
  ...LOOK,
  interactive: true,
  stir: 1,
  clickSwirl: true,
  intro: true,
  lightMode: false
};

export type GrainientDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<GrainientDemoProps>> = {
  ember: { ...LOOK },
  lagoon: { ...LOOK, colors: ['#071318', '#0e7490', '#2dd4bf', '#ccfbf1'], angle: 20, flow: 0.9 },
  dusk: { ...LOOK, colors: ['#0c0f13', '#450a0a', '#b91c1c', '#fb923c', '#fde68a'], angle: 150, silk: 0.4 },
  satin: { ...LOOK, colors: ['#0c0c0f', '#3f3f46', '#a1a1aa', '#fafafa'], angle: 40, bands: 2, silk: 1 },
  dunes: {
    ...LOOK,
    colors: ['#0c0f13', '#451a03', '#b45309', '#fbbf24', '#fef3c7'],
    angle: 70,
    bands: 2,
    softness: 0.08,
    scale: 1.2,
    silk: 0,
    grainAmount: 0.12,
    grainSize: 1.8
  },
  tide: {
    ...LOOK,
    colors: ['#06101f', '#0c4a6e', '#0284c7', '#7dd3fc', '#f0f9ff'],
    angle: 0,
    bands: 3,
    softness: 0.25,
    flow: 0.7,
    silk: 0.3
  },
  aurora: {
    ...LOOK,
    colors: ['#05110f', '#065f46', '#34d399', '#ecfccb'],
    angle: 100,
    bands: 3,
    flow: 1.1,
    silk: 0.6
  },
  rings: {
    ...LOOK,
    colors: ['#0c0f13', '#450a0a', '#dc2626', '#fecaca'],
    type: 'radial',
    bands: 3,
    softness: 0.2,
    flow: 0.7,
    silk: 0.3
  }
};

export const PRESET_OPTIONS = [
  { value: 'ember', label: 'Ember' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'satin', label: 'Satin' },
  { value: 'dunes', label: 'Dunes' },
  { value: 'tide', label: 'Tide' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'rings', label: 'Rings' }
];

export const presetProps = (
  value: string,
  { defaults = {} as Partial<GrainientDemoProps> }: { light?: boolean; defaults?: Partial<GrainientDemoProps> } = {}
): Partial<GrainientDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof GrainientDemoProps]])
  ) as Partial<GrainientDemoProps>;
  return { ...base, ...PRESETS[value] };
};
