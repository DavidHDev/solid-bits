import type { BallpitMaterial } from '@/content/Backgrounds/Ballpit/Ballpit';

export const LOOK = {
  colors: ['#ffffff'] as string[],
  material: 'satin' as BallpitMaterial,
  count: 200,
  minSize: 0.5,
  maxSize: 1,
  gravity: 0,
  friction: 0.9975,
  wallBounce: 0.95,
  bounce: 0.85,
  depth: 2,
  drift: 0.4,
  cursorSize: 1,
  lightColor: '#ffffff',
  lightIntensity: 1,
  exposure: 1,
  shadows: 0.6
};

export type BallpitLook = typeof LOOK;

export const PRESETS: Record<string, Partial<BallpitLook>> = {
  float: {},
  pit: { colors: ['#0aa0ef'], gravity: 0.6, drift: 0, count: 260 },
  clay: { material: 'matte', colors: ['#e8b4a0'], gravity: 0.6, drift: 0, shadows: 0.75 },
  gloss: { material: 'gloss', colors: ['#181a1b', '#ff5b2e'] },
  frosted: { material: 'frosted', colors: ['#c4dcf0'], gravity: 0, drift: 0.5, count: 150 },
  metal: { material: 'metal', colors: ['#d4d6d8'], gravity: 0.6, drift: 0 },
  sprinkles: { colors: ['#ffffff', '#0aa0ef'], count: 900, minSize: 0.26, maxSize: 0.46, gravity: 0.6, drift: 0 },
  zero: { colors: ['#ff5b2e'], gravity: 0, drift: 0, friction: 1, bounce: 1, wallBounce: 1 }
};

export const LIGHT_SWAP: Record<string, Partial<BallpitLook>> = {
  float: { colors: ['#181a1b'] },
  frosted: { colors: ['#9cc4e6'] },
  sprinkles: { colors: ['#181a1b', '#0aa0ef'] }
};

export const PRESET_OPTIONS = [
  { value: 'float', label: 'Float' },
  { value: 'pit', label: 'Pit' },
  { value: 'clay', label: 'Clay' },
  { value: 'gloss', label: 'Gloss' },
  { value: 'frosted', label: 'Frosted' },
  { value: 'metal', label: 'Metal' },
  { value: 'sprinkles', label: 'Sprinkles' },
  { value: 'zero', label: 'Zero G' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {}
  }: { light?: boolean; defaults?: Partial<BallpitLook>; props?: Record<string, unknown> } = {}
): Partial<BallpitLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof BallpitLook]])
  ) as Partial<BallpitLook>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
