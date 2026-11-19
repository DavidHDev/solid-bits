export const PRISM = {
  color1: '#ffd9a8',
  color2: '#6ec9f7',
  color3: '#2aa0e8',
  ribbons: 3,
  spacing: 28,
  barWidth: 0.5,
  ribbonHeight: 0.26,
  spread: 0.1,
  amplitude: 0.1,
  frequency: 1,
  perspective: 0.45,
  curve: 0.5,
  blur: 0.6,
  glow: 1,
  position: 0.78,
  slices: 0
};

export const DEFAULT_PROPS = {
  preset: 'prism',
  ...PRISM,
  speed: 1,
  brightness: 1.25,
  rotation: 0,
  grain: 0.08,
  fade: 0,
  opacity: 1,
  mouseInteraction: true,
  intro: true,
  lightMode: false
};

type SlicedWavesLook = typeof PRISM;
export type SlicedWavesDemoProps = typeof DEFAULT_PROPS;
type SlicedWavesColors = Pick<SlicedWavesLook, 'color1' | 'color2' | 'color3'>;

export const PRESETS: Record<string, SlicedWavesLook> = {
  prism: PRISM,
  neon: { ...PRISM, color1: '#8fe9ff', color2: '#d4ff4d', color3: '#2a8af0' },
  ember: { ...PRISM, color1: '#ffc46b', color2: '#ff6a3d', color3: '#ff2d55' },
  aurora: { ...PRISM, color1: '#6dffc7', color2: '#4dc3ff', color3: '#3d8bff', ribbons: 4, spread: 0.08 },
  ion: { ...PRISM, color1: '#ffffff', color2: '#8cc4ff', color3: '#2a8af0', blur: 0.9 },
  signal: { ...PRISM, slices: 6, spacing: 30, barWidth: 0.6, blur: 0.3 }
};

export const LIGHT_COLORS: Record<string, SlicedWavesColors> = {
  prism: { color1: '#f0a830', color2: '#1aa3d9', color3: '#0977ae' },
  neon: { color1: '#00a7c4', color2: '#9ccc1f', color3: '#1f6fe0' },
  ember: { color1: '#ff9a1f', color2: '#ff4a1c', color3: '#e0123c' },
  aurora: { color1: '#00b886', color2: '#0098e0', color3: '#0977ae' },
  ion: { color1: '#475569', color2: '#2a8ad8', color3: '#1f5fa8' },
  signal: { color1: '#f0a830', color2: '#1aa3d9', color3: '#0977ae' }
};

export const PRESET_OPTIONS = [
  { value: 'prism', label: 'Prism' },
  { value: 'neon', label: 'Neon' },
  { value: 'ember', label: 'Ember' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'ion', label: 'Ion' },
  { value: 'signal', label: 'Signal' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {}
  }: { light?: boolean; defaults?: Partial<SlicedWavesDemoProps>; props?: Partial<SlicedWavesDemoProps> } = {}
): Partial<SlicedWavesDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof SlicedWavesDemoProps]])
  ) as Partial<SlicedWavesDemoProps>;
  const tone = light ? LIGHT_COLORS[value] : {};
  return {
    ...base,
    ...PRESETS[value],
    ...tone
  };
};
