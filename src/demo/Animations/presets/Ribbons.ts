export type RibbonsShape = 'lens' | 'comet' | 'even';

export type RibbonsLook = {
  colors: string[];
  shape: RibbonsShape;
  thickness: number;
  length: number;
  spread: number;
  stiffness: number;
  bounce: number;
  wave: number;
  softness: number;
  opacity: number;
  fade: boolean;
};

export const LOOK: RibbonsLook = {
  colors: ['#0aa0ef', '#6ec9f7', '#c4def2'],
  shape: 'lens',
  thickness: 30,
  length: 1.4,
  spread: 18,
  stiffness: 0.5,
  bounce: 0.5,
  wave: 0,
  softness: 0,
  opacity: 1,
  fade: false
};

export const PRESETS: Record<string, RibbonsLook> = {
  layers: LOOK,
  solo: { ...LOOK, colors: ['#0aa0ef'], length: 1 },
  comet: {
    ...LOOK,
    colors: ['#0aa0ef', '#5a87b8', '#7aa6d3', '#a6c8ea'],
    shape: 'comet',
    thickness: 26,
    length: 2.2,
    spread: 14,
    fade: true
  },
  glow: { ...LOOK, thickness: 36, length: 2.4, softness: 0.8, fade: true },
  streamers: {
    ...LOOK,
    colors: ['#0771a6', '#0aa0ef', '#5e8fc0', '#6ec9f7', '#c4def2'],
    shape: 'even',
    thickness: 10,
    length: 2.4,
    spread: 14,
    bounce: 0.7,
    wave: 0.5
  }
};

export const PRESET_OPTIONS = [
  { value: 'layers', label: 'Layers' },
  { value: 'solo', label: 'Solo' },
  { value: 'comet', label: 'Comet' },
  { value: 'glow', label: 'Glow' },
  { value: 'streamers', label: 'Streamers' }
];

export const presetProps = (
  value: string,
  { defaults = {} }: { light?: boolean; defaults?: Record<string, unknown>; props?: Record<string, unknown> } = {}
): Partial<RibbonsLook> => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]]));
  return {
    ...base,
    ...PRESETS[value]
  };
};
