export const LOOK = {
  color: '#0aa0ef',
  sheenColor: '#ffffff',
  speed: 5,
  scale: 1,
  rotation: 0,
  sheen: 0.5,
  depth: 0.5,
  glow: 0.3,
  ripple: 1,
  wave: 1,
  variation: 0,
  noiseIntensity: 1.5
};

export const DEFAULT_PROPS = {
  preset: 'satin',
  ...LOOK,
  mouseInteraction: true,
  interactionStrength: 1,
  clickRipple: true,
  intro: true,
  fade: 0,
  lightMode: false
};

export type SilkLook = typeof LOOK;
export type SilkDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, SilkLook> = {
  satin: LOOK,
  classic: { ...LOOK, sheen: 0, depth: 0, glow: 0 },
  champagne: { ...LOOK, color: '#b08d57', sheenColor: '#fff3dc', sheen: 0.6, depth: 0.55, glow: 0.35 },
  midnight: { ...LOOK, color: '#1e5aa8', speed: 3.5, sheen: 0.55, glow: 0.4, variation: 3 },
  emerald: { ...LOOK, color: '#12805f', sheenColor: '#e3fff4', rotation: 0.35, variation: 7 },
  graphite: { ...LOOK, color: '#8d8f93', sheen: 0.7, depth: 0.7, glow: 0.2, noiseIntensity: 1 },
  velvet: {
    ...LOOK,
    color: '#8f2730',
    sheenColor: '#ffdcd6',
    scale: 1.25,
    ripple: 1.8,
    wave: 1.6,
    speed: 4,
    depth: 0.65
  }
};

export const PRESET_OPTIONS = [
  { value: 'satin', label: 'Satin' },
  { value: 'classic', label: 'Classic' },
  { value: 'champagne', label: 'Champagne' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'velvet', label: 'Velvet' }
];

export const presetProps = (
  value: string,
  {
    defaults = {} as Partial<SilkDemoProps>
  }: { light?: boolean; defaults?: Partial<SilkDemoProps>; props?: Partial<SilkDemoProps> } = {}
): Partial<SilkLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof SilkDemoProps]])
  ) as Partial<SilkLook>;
  return {
    ...base,
    ...PRESETS[value]
  };
};
