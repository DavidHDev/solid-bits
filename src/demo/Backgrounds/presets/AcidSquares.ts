import type {
  AcidSquaresDetail,
  AcidSquaresHoverEffect,
  AcidSquaresLighting,
  AcidSquaresPulseOrigin,
  AcidSquaresShape
} from '@/content/Backgrounds/AcidSquares/AcidSquares';

export const LOOK = {
  accentColor: '#6ec9f7',
  secondaryColor: '#0aa0ef',
  tileSize: 1,
  gap: 0.12,
  roundness: 0.25,
  softness: 0.5,
  bulge: 0.3,
  rotation: 35,
  gloss: 0.6,
  waves: 1,
  waveScale: 1,
  speed: 0.6,
  shape: 'square' as AcidSquaresShape,
  pulse: 1,
  pulseSpeed: 0.45,
  pulseSpacing: 1,
  pulseWidth: 1,
  pulseOrigin: 'center' as AcidSquaresPulseOrigin,
  lighting: 'split' as AcidSquaresLighting,
  brightness: 1,
  tilt: 0.7,
  zoom: 1,
  grain: 0.12
};

export type AcidSquaresLook = typeof LOOK;

export const DEFAULT_PROPS = {
  preset: 'neon',
  color: '#0c0f13',
  ...LOOK,
  depth: 10,
  fade: 0,
  opacity: 1,
  intro: true,
  mouseInteraction: true,
  hoverEffect: 'press' as AcidSquaresHoverEffect,
  mouseStrength: 1,
  mouseRadius: 0.35,
  pulseOnClick: true,
  detail: 'medium' as AcidSquaresDetail,
  lightMode: false
};

export type AcidSquaresDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<AcidSquaresLook>> = {
  neon: {},
  acid: { accentColor: '#c6ff3d', secondaryColor: '#2a72d4', roundness: 0.12, softness: 0.35, gloss: 0.7 },
  graphite: {
    accentColor: '#ffffff',
    secondaryColor: '#93979c',
    lighting: 'backlit',
    gloss: 0.95,
    bulge: 0,
    softness: 0.25,
    roundness: 0.12,
    gap: 0.08,
    tilt: 0.85,
    waves: 0.8
  },
  pixel: {
    accentColor: '#7cf7ff',
    secondaryColor: '#3a7bd5',
    tilt: 0.05,
    tileSize: 0.45,
    gap: 0.16,
    roundness: 0.3,
    waves: 0.35,
    waveScale: 0.7,
    shape: 'round',
    pulse: 1.4,
    pulseWidth: 0.7,
    rotation: 0
  },
  cushion: {
    accentColor: '#ffb38a',
    secondaryColor: '#6ec9f7',
    lighting: 'overhead',
    tileSize: 1.8,
    gap: 0.1,
    roundness: 0.65,
    softness: 1,
    bulge: 1,
    gloss: 0.3,
    speed: 0.35,
    waves: 0.7,
    waveScale: 1.6
  },
  ember: {
    accentColor: '#ff7a1a',
    secondaryColor: '#d61f45',
    waves: 1.25,
    waveScale: 0.8,
    tilt: 0.8,
    grain: 0.2,
    gloss: 0.55,
    rotation: 15
  },
  glacier: {
    accentColor: '#8ff3ff',
    secondaryColor: '#2a72d4',
    lighting: 'overhead',
    rotation: 0,
    gap: 0.2,
    roundness: 0.2,
    pulseOrigin: 'random',
    shape: 'round',
    waves: 0.6
  }
};

export const LIGHT_SWAP: Record<string, Partial<AcidSquaresLook>> = {
  neon: { accentColor: '#3d8bd4', secondaryColor: '#0977ae' },
  acid: { accentColor: '#65a30d', secondaryColor: '#2a6fc9' },
  graphite: { accentColor: '#737373', secondaryColor: '#a3a3a3' },
  pixel: { accentColor: '#0891b2', secondaryColor: '#0977ae' },
  cushion: { accentColor: '#f97316', secondaryColor: '#3d8bd4' },
  ember: { accentColor: '#ea580c', secondaryColor: '#be123c' },
  glacier: { accentColor: '#0ea5e9', secondaryColor: '#0771a6' }
};

export const PRESET_OPTIONS = [
  { value: 'neon', label: 'Neon' },
  { value: 'acid', label: 'Acid' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'pixel', label: 'Pixel' },
  { value: 'cushion', label: 'Cushion' },
  { value: 'ember', label: 'Ember' },
  { value: 'glacier', label: 'Glacier' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {}
  }: { light?: boolean; defaults?: Partial<AcidSquaresDemoProps>; props?: Partial<AcidSquaresDemoProps> } = {}
): AcidSquaresLook => {
  const base = Object.fromEntries(
    (Object.keys(LOOK) as (keyof AcidSquaresLook)[]).map(key => [key, defaults[key] ?? LOOK[key]])
  ) as AcidSquaresLook;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
