import type { HyperspeedCurve } from '@/content/Backgrounds/Hyperspeed/Hyperspeed';

export const DEFAULT_PROPS = {
  preset: 'cyberpunk',
  tailColors: ['#6ec9f7', '#0aa0ef', '#5a8fc4'],
  headColors: ['#03b3c3', '#0e5ea5', '#324555'],
  poleColors: ['#03b3c3'],
  roadColor: '#08090a',
  lineColor: '#25282d',
  curve: 'winding' as HyperspeedCurve,
  curvature: 1,
  speed: 1,
  boost: 3,
  fov: 90,
  boostFov: 130,
  lanes: 3,
  roadWidth: 10,
  medianWidth: 2,
  density: 40,
  trailLength: 1,
  lightSize: 1,
  poles: 20,
  dust: 100,
  glow: 0.6,
  reflections: 0.5,
  roadOpacity: 0.1,
  steer: 0.35,
  interactive: true
};

export type HyperspeedDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<HyperspeedDemoProps>> = {
  cyberpunk: {},
  night: {
    tailColors: ['#ff2d55', '#ff5a36', '#e8174a'],
    headColors: ['#eef6ff', '#9cc8ff', '#ffffff'],
    poleColors: ['#47c0ff']
  },
  akira: {
    curve: 'hills',
    roadWidth: 9,
    density: 50,
    poles: 50,
    tailColors: ['#ff102a', '#eb383e', '#ff102a'],
    headColors: ['#dae8fa', '#bacde3', '#8fb4e4'],
    poleColors: ['#dae8fa']
  },
  golden: {
    curve: 'gentle',
    roadWidth: 9,
    density: 30,
    poles: 50,
    tailColors: ['#7d0d1b', '#a90519', '#ff102a'],
    headColors: ['#f1eece', '#e6e2b1', '#8ac2df'],
    poleColors: ['#f1eece']
  },
  split: {
    curve: 'racing',
    lanes: 2,
    medianWidth: 5,
    density: 70,
    poles: 50,
    tailColors: ['#ff5f73', '#e74d60', '#ff102a'],
    headColors: ['#a4e3e6', '#80d1d4', '#53c2c6'],
    poleColors: ['#a4e3e6']
  },
  highway: {
    roadWidth: 9,
    density: 50,
    poles: 50,
    tailColors: ['#dc5b20', '#209bdc', '#dc2020'],
    headColors: ['#3386f7', '#e5e9ed', '#bfd5f3'],
    poleColors: ['#c5e8eb']
  },
  deep: {
    curve: 'deep',
    roadWidth: 18,
    density: 50,
    poles: 50,
    tailColors: ['#ff322f', '#a33010', '#a81508'],
    headColors: ['#fdfdf0', '#f3dea0', '#88c3e2'],
    poleColors: ['#fdfdf0']
  }
};

export const PRESET_OPTIONS = [
  { value: 'cyberpunk', label: 'Cyberpunk' },
  { value: 'night', label: 'Night Drive' },
  { value: 'akira', label: 'Akira' },
  { value: 'golden', label: 'Golden' },
  { value: 'split', label: 'Split' },
  { value: 'highway', label: 'Highway' },
  { value: 'deep', label: 'Deep' }
];

export const presetProps = (
  value: string,
  { defaults = {} as Partial<HyperspeedDemoProps> }: { light?: boolean; defaults?: Partial<HyperspeedDemoProps> } = {}
): Partial<HyperspeedDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof HyperspeedDemoProps]])
  ) as Partial<HyperspeedDemoProps>;
  return { ...base, ...PRESETS[value] };
};
