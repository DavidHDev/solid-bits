export type PrismaticBurstAnimation = 'rotate' | 'rotate3d' | 'hover';

export const LOOK = {
  spectrum: false,
  colors: ['#6ec9f7', '#0aa0ef', '#0771a6'],
  animationType: 'rotate3d' as PrismaticBurstAnimation,
  intensity: 2,
  speed: 0.5,
  zoom: 1,
  rayWidth: 1,
  rayCount: 0,
  distort: 0,
  twist: 0,
  flow: 0,
  centerFade: 1,
  glow: 0,
  grain: 0.8
};

export type PrismaticBurstLook = typeof LOOK;

type Preset = Partial<PrismaticBurstLook> & { intensityScale?: number };

export const PRESETS: Record<string, Preset> = {
  nebula: {},
  prism: { spectrum: true, intensityScale: 0.8 },
  pearl: { colors: ['#ffffff', '#a3a3a3', '#525252'], glow: 0.35, intensityScale: 0.8 },
  ember: { colors: ['#fff1c1', '#ff8a3d', '#e11d48'], animationType: 'rotate', distort: 1.5, speed: 0.4 },
  sunburst: {
    colors: ['#fde68a', '#f59e0b', '#ffffff'],
    rayCount: 18,
    rayWidth: 1.6,
    glow: 0.3,
    intensityScale: 1.15
  },
  vortex: { colors: ['#22d3ee', '#3b82f6', '#a5f3fc'], twist: 1.6, flow: 0.6, speed: 0.4 }
};

export const PRESET_OPTIONS = [
  { value: 'nebula', label: 'Nebula' },
  { value: 'prism', label: 'Prism' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'ember', label: 'Ember' },
  { value: 'sunburst', label: 'Sunburst' },
  { value: 'vortex', label: 'Vortex' }
];

export const presetProps = (
  value: string,
  {
    defaults = {} as Partial<PrismaticBurstLook>
  }: { light?: boolean; defaults?: Partial<PrismaticBurstLook>; props?: Record<string, unknown> } = {}
): Partial<PrismaticBurstLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof PrismaticBurstLook]])
  ) as Partial<PrismaticBurstLook>;
  const { intensityScale = 1, ...look } = PRESETS[value] ?? {};
  return {
    ...base,
    ...look,
    intensity: Math.round((base.intensity ?? LOOK.intensity) * intensityScale * 100) / 100
  };
};
