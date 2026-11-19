import type { AeroShardsProps } from '@/content/Backgrounds/AeroShards/AeroShards';

type Placement = NonNullable<AeroShardsProps['placement']>;
type Material = NonNullable<AeroShardsProps['material']>;
type Markers = NonNullable<AeroShardsProps['markers']>;

export const LOOK = {
  shardColor: '#6496CF',
  accentColor: '#6ec9f7',
  lightMode: false,
  placement: 'full' as Placement,
  material: 'glass' as Material,
  markers: 'plus' as Markers,
  count: 1300,
  shardSize: 1,
  spread: 1,
  twist: 1,
  billow: 1,
  speed: 1,
  scale: 1,
  depthOfField: 0.75,
  glow: 0.35,
  grain: 0.06,
  vignette: 0.3
};

export type AeroShardsLook = typeof LOOK;

export const PRESETS: Record<string, Partial<AeroShardsLook>> = {
  sapphire: {},
  glacier: {
    shardColor: '#9cc9ff',
    accentColor: '#38bdf8',
    material: 'glass',
    placement: 'right',
    spread: 1.2,
    speed: 0.8
  },
  copper: {
    shardColor: '#e3a17a',
    accentColor: '#f97316',
    material: 'chrome',
    markers: 'dots',
    twist: 1.3,
    speed: 0.9
  },
  graphite: {
    shardColor: '#a3a3a3',
    accentColor: '#e5e5e5',
    material: 'chrome',
    glow: 0.25,
    billow: 0.7
  },
  halo: {
    shardColor: '#a9c8e8',
    accentColor: '#5a8fd0',
    placement: 'center',
    twist: 1.4,
    count: 1500
  }
};

export const LIGHT_SWAP: Record<string, Partial<AeroShardsLook>> = {
  sapphire: { lightMode: true, shardColor: '#0aa0ef', accentColor: '#3d8bd4' },
  glacier: { lightMode: true, shardColor: '#3b86e0', accentColor: '#0ea5e9' },
  copper: { lightMode: true, shardColor: '#c2410c', accentColor: '#f97316' },
  graphite: { lightMode: true, shardColor: '#404040', accentColor: '#737373' },
  halo: { lightMode: true, shardColor: '#3f6fb0', accentColor: '#0977ae' }
};

export const PRESET_OPTIONS = [
  { value: 'sapphire', label: 'Sapphire' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'copper', label: 'Copper' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'halo', label: 'Halo' }
];

export const presetProps = (
  value: string,
  { light = false }: { light?: boolean; defaults?: Record<string, unknown>; props?: Record<string, unknown> } = {}
): AeroShardsLook => ({
  ...LOOK,
  ...PRESETS[value],
  ...(light ? LIGHT_SWAP[value] : null)
});
