import type { DitherMode, DitherMouseEffect } from '@/content/Backgrounds/Dither/Dither';

export const PALETTES: Record<string, string[]> = {
  none: [],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  amber: ['#0b0603', '#5c2e05', '#d97706', '#ffd08a'],
  sepia: ['#1a120b', '#324c5a', '#a8916f', '#efe3c8'],
  ice: ['#06121f', '#173d5c', '#5f9ec7', '#e4f3ff'],
  blueprint: ['#0d2a57', '#24508f', '#8fb5ea', '#e8f1ff']
};

export const LOOK = {
  ditherMode: 'bayer' as DitherMode,
  palette: PALETTES.none,
  colorNum: 4,
  pixelSize: 2,
  scale: 1,
  waveSpeed: 0.05,
  waveFrequency: 3,
  waveAmplitude: 0.3,
  contrast: 1,
  brightness: 0,
  mouseEffect: 'erase' as DitherMouseEffect,
  mouseRadius: 0.3,
  mouseStrength: 1,
  trail: 0.5
};

export const DEFAULT_PROPS = {
  preset: 'classic',
  waveColor: '#bcbcbc',
  backgroundColor: '#0c0f13',
  ...LOOK,
  enableMouseInteraction: true,
  clickRipple: true,
  intro: true,
  disableAnimation: false
};

export type DitherDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<DitherDemoProps>> = {
  classic: { ...LOOK },
  gameboy: { ...LOOK, palette: PALETTES.gameboy, pixelSize: 3 },
  newsprint: {
    ...LOOK,
    ditherMode: 'halftone',
    waveColor: '#141414',
    backgroundColor: '#efeae0',
    contrast: 1.3,
    mouseEffect: 'reveal'
  },
  amber: { ...LOOK, ditherMode: 'lines', palette: PALETTES.amber, scale: 1.2 },
  blueprint: {
    ...LOOK,
    ditherMode: 'crosshatch',
    palette: PALETTES.blueprint,
    mouseEffect: 'ripple',
    mouseRadius: 0.45
  },
  static: { ...LOOK, ditherMode: 'noise', colorNum: 2, pixelSize: 1, waveSpeed: 0.12, contrast: 1.3 }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'gameboy', label: 'Game Boy' },
  { value: 'newsprint', label: 'Newsprint' },
  { value: 'amber', label: 'Amber' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'static', label: 'Static' }
];

export const LIGHT_SWAP: Record<string, Partial<DitherDemoProps>> = {
  gameboy: { palette: [...PALETTES.gameboy].reverse() },
  amber: { palette: [...PALETTES.amber].reverse() },
  blueprint: { palette: [...PALETTES.blueprint].reverse() }
};

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {} as Partial<DitherDemoProps>
  }: { light?: boolean; defaults?: Partial<DitherDemoProps>; props?: Partial<DitherDemoProps> } = {}
): Partial<DitherDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof DitherDemoProps]])
  ) as Partial<DitherDemoProps>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
