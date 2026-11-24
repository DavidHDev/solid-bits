import type {
  FaultyTerminalClickEffect,
  FaultyTerminalGlyphs
} from '@/content/Backgrounds/FaultyTerminal/FaultyTerminal';

export const LOOK = {
  tint: '#A7EF9E',
  glyphs: 'blocks' as FaultyTerminalGlyphs,
  scale: 1.5,
  digitSize: 1.2,
  timeScale: 0.5,
  brightness: 0.75,
  glow: 0.5,
  persistence: 0.5,
  mouseStrength: 0.5,
  mouseGlow: 0.6,
  scramble: 0.5,
  scanlineIntensity: 0.5,
  glitchAmount: 1,
  flickerAmount: 1,
  noiseAmp: 1,
  chromaticAberration: 0,
  curvature: 0.1,
  vignette: 0.25,
  clickEffect: 'glitch' as FaultyTerminalClickEffect
};

export const DEFAULT_PROPS = {
  preset: 'phosphor',
  ...LOOK,
  mouseReact: true,
  pageLoadAnimation: true,
  pause: false,
  lightMode: false
};

export type FaultyTerminalDemoProps = typeof DEFAULT_PROPS;
type Look = Partial<typeof LOOK>;

export const PRESETS: Record<string, Look> = {
  phosphor: {},
  classic: {
    brightness: 0.6,
    glow: 0,
    persistence: 0,
    mouseGlow: 0,
    vignette: 0,
    clickEffect: 'none'
  },
  terminal: {
    glyphs: 'characters',
    tint: '#B8F5A8',
    scale: 1.2,
    digitSize: 1.15,
    brightness: 0.85,
    scramble: 0.6
  },
  amber: {
    glyphs: 'dots',
    tint: '#47C0FF',
    scale: 1.6,
    digitSize: 1.25,
    brightness: 0.8,
    glow: 0.6,
    clickEffect: 'degauss'
  },
  ice: {
    tint: '#7DD3FC',
    scale: 2.2,
    digitSize: 1.3,
    timeScale: 0.35,
    brightness: 0.85,
    glow: 0.7,
    persistence: 0.85,
    mouseGlow: 0.8
  },
  meltdown: {
    tint: '#F3F4F5',
    scale: 1.3,
    timeScale: 0.8,
    brightness: 0.7,
    glitchAmount: 3,
    flickerAmount: 2,
    noiseAmp: 1.3,
    chromaticAberration: 1.5,
    curvature: 0.25,
    vignette: 0.45
  },
  data: {
    glyphs: 'characters',
    tint: '#E4E6E7',
    scale: 2.4,
    digitSize: 1.1,
    brightness: 0.7,
    glow: 0.35,
    scramble: 0.9,
    curvature: 0
  }
};

export const LIGHT_SWAP: Record<string, Look> = {
  phosphor: { tint: '#166534', brightness: 0.6 },
  classic: { tint: '#164a65', brightness: 0.55 },
  terminal: { tint: '#166534', brightness: 0.75 },
  amber: { tint: '#B45309', brightness: 0.7 },
  ice: { tint: '#0369A1', brightness: 0.7 },
  meltdown: { tint: '#181A1B', brightness: 0.6 },
  data: { tint: '#181A1B', brightness: 0.6 }
};

export const PRESET_OPTIONS = [
  { value: 'phosphor', label: 'Phosphor' },
  { value: 'classic', label: 'Classic' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'amber', label: 'Amber' },
  { value: 'ice', label: 'Ice' },
  { value: 'meltdown', label: 'Meltdown' },
  { value: 'data', label: 'Data' }
];

export const presetProps = (
  value: string,
  {
    light = false
  }: { light?: boolean; defaults?: Partial<FaultyTerminalDemoProps>; props?: Partial<FaultyTerminalDemoProps> } = {}
): Look => {
  return {
    ...LOOK,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
