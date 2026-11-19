export type RingMotion = 'pulse' | 'ripple' | 'breathe';

export const LOOK = {
  color: '#6ec9f7',
  colorTwo: '#0aa0ef',
  motion: 'pulse' as RingMotion,
  ringCount: 6,
  speed: 1,
  lineThickness: 2,
  glow: 1,
  baseRadius: 0.35,
  radiusStep: 0.1,
  expansion: 0.1,
  taper: 1.5,
  rotation: 0,
  spin: 0,
  tilt: 0,
  dispersion: 0,
  grain: 0
};

export type MagicRingsLook = typeof LOOK;

export const PRESETS: Record<string, Partial<MagicRingsLook>> = {
  portal: {},
  halo: {
    color: '#ffffff',
    colorTwo: '#a1a4a8',
    motion: 'breathe',
    ringCount: 5,
    lineThickness: 1.5,
    glow: 0.6,
    taper: 1.25
  },
  ripple: { color: '#22d3ee', colorTwo: '#3b82f6', motion: 'ripple', ringCount: 7, radiusStep: 0.09 },
  prism: {
    color: '#ffffff',
    colorTwo: '#e0edff',
    motion: 'breathe',
    lineThickness: 1.5,
    glow: 0.6,
    dispersion: 0.6
  },
  gyro: { color: '#fcd34d', colorTwo: '#f97316', ringCount: 4, taper: 1.1, spin: 0.8, tilt: 60 },
  eclipse: {
    color: '#ffffff',
    colorTwo: '#fb923c',
    motion: 'breathe',
    ringCount: 3,
    lineThickness: 1.5,
    glow: 1.3,
    baseRadius: 0.3,
    radiusStep: 0.05,
    taper: 1
  }
};

export const PRESET_OPTIONS = [
  { value: 'portal', label: 'Portal' },
  { value: 'halo', label: 'Halo' },
  { value: 'ripple', label: 'Ripple' },
  { value: 'prism', label: 'Prism' },
  { value: 'gyro', label: 'Gyro' },
  { value: 'eclipse', label: 'Eclipse' }
];

export const LIGHT_SWAP: Record<string, Partial<MagicRingsLook>> = {
  portal: { color: '#2f7fbf', colorTwo: '#0771a6' },
  halo: { color: '#3f4246', colorTwo: '#6f7378' },
  ripple: { color: '#0891b2', colorTwo: '#2563eb' },
  prism: { color: '#3f4246', colorTwo: '#505459' },
  gyro: { color: '#d97706', colorTwo: '#ea580c' },
  eclipse: { color: '#3f4246', colorTwo: '#c2410c' }
};

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {} as Partial<MagicRingsLook>
  }: { light?: boolean; defaults?: Partial<MagicRingsLook>; props?: Partial<MagicRingsLook> } = {}
): Partial<MagicRingsLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof MagicRingsLook]])
  ) as Partial<MagicRingsLook>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
