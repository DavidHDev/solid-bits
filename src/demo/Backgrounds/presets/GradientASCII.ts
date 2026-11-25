import type { GradientASCIIClickEffect, GradientASCIIShape } from '@/content/Backgrounds/GradientASCII/GradientASCII';

export const LOOK = {
  colors: ['#1462c8', '#f6f8ff', '#a5d8ff', '#38bdf8'],
  shape: 'horizon' as GradientASCIIShape,
  characters: ' =+xX0S8#@',
  cellSize: 18,
  density: 0.8,
  glyphOpacity: 0.85,
  glow: 0.2,
  depthOfField: 0,
  flicker: 0.2,
  softness: 0.5,
  scale: 1,
  flow: 0.5,
  speed: 1,
  gradientOpacity: 0.9,
  grain: 0.08
};

export const DEFAULT_PROPS = {
  preset: 'atmosphere',
  ...LOOK,
  variation: 0,
  mouseInteraction: true,
  scrambleRadius: 0.1,
  clickEffect: 'wave' as GradientASCIIClickEffect,
  intro: true,
  lightMode: false
};

export type GradientASCIIDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<GradientASCIIDemoProps>> = {
  atmosphere: {},
  lagoon: { shape: 'pinch', colors: ['#0d9488', '#5eead4', '#f0fdfa'], characters: ' .:-=+*#%@', cellSize: 16 },
  rose: { shape: 'rise', colors: ['#9b1c1c', '#ef4444', '#fca5a5', '#fef2f2'], cellSize: 22 },
  corona: { shape: 'eclipse', colors: ['#0f5478', '#0ba4f5', '#fffbeb'], characters: ' 01', cellSize: 15 }
};

export const LIGHT_SWAP: Record<string, Partial<GradientASCIIDemoProps>> = {
  atmosphere: { colors: ['#4f8ff7', '#e8f0ff', '#b4d0ff', '#7cb4fb'] },
  lagoon: { colors: ['#99d6f6', '#5eead4', '#2dd4bf'] },
  rose: { colors: ['#fecaca', '#fca5a5', '#f87171', '#ef4444'] },
  corona: { colors: ['#8ad5fd', '#4dc0fc', '#0ba4f5'] }
};

export const PRESET_OPTIONS = [
  { value: 'atmosphere', label: 'Atmosphere' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'rose', label: 'Rose' },
  { value: 'corona', label: 'Corona' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {} as Partial<GradientASCIIDemoProps>
  }: { light?: boolean; defaults?: Partial<GradientASCIIDemoProps>; props?: Partial<GradientASCIIDemoProps> } = {}
): Partial<GradientASCIIDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof GradientASCIIDemoProps]])
  ) as Partial<GradientASCIIDemoProps>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
