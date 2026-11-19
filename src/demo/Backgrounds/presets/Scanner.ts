import type { ScannerDirection } from '@/content/Backgrounds/Scanner/Scanner';

export const LOOK = {
  color1: '#0aa0ef',
  color2: '#6ec9f7',
  color3: '#FFFFFF',
  speed: 0.5,
  sweepSpeed: 0.25,
  sweepWidth: 1.6,
  trail: 0.5,
  reverse: false,
  scale: 1.5,
  frequency: 2,
  ripple: 0.22,
  bandDensity: 11,
  lineWidth: 1.2,
  glow: 0.6,
  scanDirection: 'vertical' as ScannerDirection,
  colorSpread: 0.7,
  brightness: 1,
  vignette: 0.3
};

export type ScannerLook = typeof LOOK;

export const PRESETS: Record<string, Partial<ScannerLook>> = {
  scanner: {},
  phosphor: { color1: '#14532d', color2: '#4ade80', color3: '#ecfccb', trail: 0.9, ripple: 0.14, colorSpread: 0.2 },
  ember: { color1: '#7c2d12', color2: '#fb923c', color3: '#fff7ed', speed: 0.7, ripple: 0.32 },
  ice: { color1: '#0c4a6e', color2: '#7dd3fc', color3: '#ffffff', scanDirection: 'diagonal', sweepSpeed: 0.3 },
  mono: { color1: '#3f4246', color2: '#d4d6d8', color3: '#ffffff', colorSpread: 0 },
  dense: { bandDensity: 26, lineWidth: 0.8, glow: 0.4, ripple: 0.14, frequency: 1.6 },
  storm: { ripple: 0.6, frequency: 3, speed: 1.2, sweepSpeed: 0.6, sweepWidth: 1, colorSpread: 0.9 },
  calm: { speed: 0.22, sweepSpeed: 0.12, ripple: 0.12, trail: 0.95, glow: 0.8 }
};

export const LIGHT_SWAP: Record<string, Partial<ScannerLook>> = {
  scanner: { color1: '#0771a6', color2: '#3d8bd4', color3: '#181a1b' },
  phosphor: { color1: '#166534', color2: '#16a34a', color3: '#052e16' },
  ember: { color1: '#9a3412', color2: '#ea580c', color3: '#431407' },
  ice: { color1: '#0c4a6e', color2: '#0284c7', color3: '#082f49' },
  mono: { color1: '#a1a4a8', color2: '#52575b', color3: '#181a1b' },
  dense: { color1: '#0771a6', color2: '#3d8bd4', color3: '#181a1b' },
  storm: { color1: '#0771a6', color2: '#3d8bd4', color3: '#181a1b' },
  calm: { color1: '#0771a6', color2: '#3d8bd4', color3: '#181a1b' }
};

export const PRESET_OPTIONS = [
  { value: 'scanner', label: 'Scanner' },
  { value: 'phosphor', label: 'Phosphor' },
  { value: 'ember', label: 'Ember' },
  { value: 'ice', label: 'Ice' },
  { value: 'mono', label: 'Mono' },
  { value: 'dense', label: 'Dense' },
  { value: 'storm', label: 'Storm' },
  { value: 'calm', label: 'Calm' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {} as Partial<ScannerLook>
  }: { light?: boolean; defaults?: Partial<ScannerLook>; props?: Record<string, unknown> } = {}
): Partial<ScannerLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof ScannerLook]])
  ) as Partial<ScannerLook>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
