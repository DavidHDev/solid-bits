import type { ShapeGridProps } from '@/content/Backgrounds/ShapeGrid/ShapeGrid';

export type ShapeGridShape = NonNullable<ShapeGridProps['shape']>;
export type ShapeGridDirection = NonNullable<ShapeGridProps['direction']>;

export const LOOK = {
  shape: 'square' as ShapeGridShape,
  direction: 'diagonal' as ShapeGridDirection,
  lineColor: '#27292d',
  hoverColor: '#ffffff',
  hoverFillColor: '#ffffff',
  fillOpacity: 0.15,
  rainbow: false,
  cellSize: 40,
  lineWidth: 1,
  speed: 0.5,
  tiltX: 0,
  tiltY: 0,
  radius: 1.5,
  trail: 0.6,
  glow: 0.35,
  twinkle: 0,
  fade: 1,
  clickCascade: true,
  intro: true
};

export type ShapeGridLook = typeof LOOK;

type ShapeGridColors = Pick<ShapeGridLook, 'lineColor' | 'hoverColor' | 'hoverFillColor'>;

export const PRESETS: Record<string, { look: ShapeGridLook; light: ShapeGridColors }> = {
  classic: { look: LOOK, light: { lineColor: '#e4e6e7', hoverColor: '#181a1b', hoverFillColor: '#181a1b' } },
  tiles: {
    look: {
      ...LOOK,
      shape: 'tile',
      direction: 'up',
      speed: 0.3,
      hoverColor: '#6ec9f7',
      hoverFillColor: '#6ec9f7',
      twinkle: 0.6,
      trail: 0.9
    },
    light: { lineColor: '#e4e6e7', hoverColor: '#0977ae', hoverFillColor: '#0977ae' }
  },
  hive: {
    look: {
      ...LOOK,
      shape: 'hexagon',
      direction: 'up',
      speed: 0.35,
      hoverColor: '#2dd4bf',
      hoverFillColor: '#2dd4bf',
      radius: 2,
      trail: 0.9
    },
    light: { lineColor: '#e4e6e7', hoverColor: '#0d9488', hoverFillColor: '#0d9488' }
  },
  shards: {
    look: { ...LOOK, shape: 'triangle', direction: 'left', speed: 0.4, cellSize: 46, radius: 1.8 },
    light: { lineColor: '#e4e6e7', hoverColor: '#181a1b', hoverFillColor: '#181a1b' }
  },
  lattice: {
    look: {
      ...LOOK,
      shape: 'diamond',
      direction: 'right',
      speed: 0.4,
      hoverColor: '#24adf5',
      hoverFillColor: '#24adf5',
      glow: 0.5
    },
    light: { lineColor: '#e4e6e7', hoverColor: '#c2410c', hoverFillColor: '#c2410c' }
  },
  rings: {
    look: {
      ...LOOK,
      shape: 'circle',
      direction: 'down',
      speed: 0.3,
      cellSize: 36,
      hoverColor: '#ff7a6b',
      hoverFillColor: '#ff7a6b',
      radius: 1.8
    },
    light: { lineColor: '#e4e6e7', hoverColor: '#dc2626', hoverFillColor: '#dc2626' }
  },
  markers: {
    look: {
      ...LOOK,
      shape: 'cross',
      direction: 'none',
      lineColor: '#373a3f',
      cellSize: 34,
      radius: 3,
      trail: 1.2,
      glow: 0.2
    },
    light: { lineColor: '#d4d6d8', hoverColor: '#181a1b', hoverFillColor: '#181a1b' }
  },
  dots: {
    look: {
      ...LOOK,
      shape: 'dot',
      speed: 0.25,
      lineColor: '#373a3f',
      cellSize: 26,
      radius: 3.2,
      trail: 1,
      glow: 0.5,
      twinkle: 0.3
    },
    light: { lineColor: '#c8cacf', hoverColor: '#181a1b', hoverFillColor: '#181a1b' }
  },
  horizon: {
    look: {
      ...LOOK,
      direction: 'down',
      speed: 0.6,
      tiltX: 58,
      cellSize: 44,
      radius: 2,
      trail: 0.9,
      glow: 0.45
    },
    light: { lineColor: '#e4e6e7', hoverColor: '#181a1b', hoverFillColor: '#181a1b' }
  },
  prism: {
    look: {
      ...LOOK,
      shape: 'tile',
      direction: 'up',
      speed: 0.3,
      rainbow: true,
      tiltX: 28,
      tiltY: -22,
      radius: 2.2,
      trail: 1.2,
      glow: 0.5
    },
    light: { lineColor: '#e4e6e7', hoverColor: '#181a1b', hoverFillColor: '#181a1b' }
  }
};

export const PRESET_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'hive', label: 'Hive' },
  { value: 'shards', label: 'Shards' },
  { value: 'lattice', label: 'Lattice' },
  { value: 'rings', label: 'Rings' },
  { value: 'markers', label: 'Markers' },
  { value: 'dots', label: 'Dots' },
  { value: 'horizon', label: 'Horizon' },
  { value: 'prism', label: 'Prism' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {} as Partial<ShapeGridLook>
  }: { light?: boolean; defaults?: Partial<ShapeGridLook>; props?: Partial<ShapeGridLook> } = {}
): Partial<ShapeGridLook> => {
  const preset = PRESETS[value] ?? PRESETS.classic;
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof ShapeGridLook]])
  ) as Partial<ShapeGridLook>;
  return { ...base, ...preset.look, ...(light ? preset.light : null) };
};
