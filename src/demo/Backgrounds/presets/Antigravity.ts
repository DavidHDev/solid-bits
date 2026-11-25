import type { AntigravityProps } from '@/content/Backgrounds/Antigravity/Antigravity';

type ColorMode = NonNullable<AntigravityProps['colorMode']>;
type Shape = NonNullable<AntigravityProps['particleShape']>;

export const LOOK = {
  colors: ['#0aa0ef', '#6ec9f7', '#a7c8e8'],
  colorMode: 'conic' as ColorMode,
  colorSpeed: 0.05,
  particleShape: 'capsule' as Shape,
  count: 1500,
  particleSize: 0.9,
  particleVariance: 1,
  magnetRadius: 9,
  ringRadius: 7,
  fieldStrength: 10,
  waveAmplitude: 1,
  waveCount: 3,
  waveSpeed: 0.4,
  rotationSpeed: 0,
  pulseSpeed: 3,
  depthFactor: 1,
  ambient: 0.25,
  lerpSpeed: 0.05
};

export type AntigravityLook = typeof LOOK;

export const PRESETS: Record<string, Partial<AntigravityLook>> = {
  magnet: {},
  spectrum: {
    colors: ['#4a90e2', '#22d3c5', '#D96570', '#00A3F9'],
    colorSpeed: 0.08,
    count: 2000,
    magnetRadius: 11
  },
  orbit: {
    colors: ['#7dd3fc', '#e0f2fe', '#38bdf8'],
    rotationSpeed: 1.2,
    fieldStrength: 25,
    waveAmplitude: 0.6
  },
  bloom: {
    colors: ['#6ec9f7', '#a5e0ff', '#fda4af'],
    colorMode: 'radial',
    waveAmplitude: 6,
    waveCount: 5
  },
  stardust: {
    colors: ['#ffffff', '#cfe3f5'],
    particleShape: 'sphere',
    count: 2600,
    particleSize: 0.7,
    depthFactor: 2.5,
    ambient: 0.45,
    rotationSpeed: 0.3
  },
  confetti: {
    colors: ['#6ec9f7', '#ff7a6b', '#66caff', '#068ed6'],
    colorMode: 'random',
    particleShape: 'box',
    count: 900,
    particleSize: 1.3
  }
};

export const PRESET_OPTIONS = [
  { value: 'magnet', label: 'Magnet' },
  { value: 'spectrum', label: 'Spectrum' },
  { value: 'orbit', label: 'Orbit' },
  { value: 'bloom', label: 'Bloom' },
  { value: 'stardust', label: 'Stardust' },
  { value: 'confetti', label: 'Confetti' }
];

export const presetProps = (
  value: string,
  { defaults = {} as Partial<AntigravityLook> }: { light?: boolean; defaults?: Partial<AntigravityLook> } = {}
): Partial<AntigravityLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof AntigravityLook]])
  ) as Partial<AntigravityLook>;
  return { ...base, ...PRESETS[value] };
};
