export const LOOK = {
  colorStops: ['#0aa0ef', '#67cbff', '#0aa0ef'],
  amplitude: 1,
  blend: 0.5,
  height: 0.45,
  speed: 1,
  scale: 1,
  glow: 0.6,
  brightness: 1,
  layers: 1,
  direction: 'top' as 'top' | 'bottom'
};

export const DEFAULT_PROPS = {
  preset: 'classic',
  ...LOOK,
  opacity: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

export type AuroraDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<AuroraDemoProps>> = {
  classic: { ...LOOK },
  borealis: { ...LOOK, colorStops: ['#1effa0', '#14c8b4', '#3a7bff'] },
  dusk: { ...LOOK, colorStops: ['#ff8a5c', '#ff5c5c', '#5c9dff'] },
  arctic: { ...LOOK, colorStops: ['#8fe3ff', '#e8f6ff', '#6f9bff'], amplitude: 0.7, speed: 0.7 },
  mono: { ...LOOK, colorStops: ['#ffffff', '#9aa0ad', '#ffffff'], brightness: 0.8 },
  horizon: { ...LOOK, colorStops: ['#5c9dff', '#ff7a6b', '#5cc7ff'], direction: 'bottom', height: 0.5 },
  veil: {
    ...LOOK,
    colorStops: ['#67cbff', '#22d3c5', '#5c9dff'],
    layers: 3,
    glow: 1.2,
    speed: 0.6,
    amplitude: 1.4
  }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'borealis', label: 'Borealis' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'arctic', label: 'Arctic' },
  { value: 'mono', label: 'Mono' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'veil', label: 'Veil' }
];

export const presetProps = (
  value: string,
  { defaults = {} as Partial<AuroraDemoProps> }: { light?: boolean; defaults?: Partial<AuroraDemoProps> } = {}
): Partial<AuroraDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof AuroraDemoProps]])
  ) as Partial<AuroraDemoProps>;
  return { ...base, ...PRESETS[value] };
};
