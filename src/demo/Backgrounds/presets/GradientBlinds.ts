export type GradientBlindsShineDirection = 'left' | 'right';
export type GradientBlindsClickEffect = 'ripple' | 'none';
export type GradientBlindsIdle = 'drift' | 'center' | 'stay';

export const LOOK = {
  gradientColors: ['#6ec9f7', '#0aa0ef'],
  angle: 20,
  noise: 0.3,
  blindCount: 16,
  blindMinWidth: 60,
  spotlightRadius: 0.5,
  spotlightSoftness: 1,
  spotlightOpacity: 1,
  shineDirection: 'left' as GradientBlindsShineDirection,
  lightColor: '#ffffff',
  shine: 0.4,
  relief: 0.5,
  glow: 0.4,
  sway: 0.35,
  speed: 1,
  hoverTilt: 0.6,
  perspective: 0,
  gradientSpeed: 0,
  distortAmount: 0,
  mirrorGradient: false,
  mouseDampening: 0.15,
  clickEffect: 'ripple' as GradientBlindsClickEffect,
  idle: 'drift' as GradientBlindsIdle
};

export const DEFAULT_PROPS = {
  preset: 'satin',
  ...LOOK,
  intro: true,
  lightMode: false
};

export type GradientBlindsLook = typeof LOOK;
export type GradientBlindsDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<GradientBlindsLook>> = {
  satin: {},
  classic: { shine: 0, relief: 0, glow: 0, sway: 0, hoverTilt: 0, clickEffect: 'none', idle: 'stay' },
  noir: {
    gradientColors: ['#f5f5f5', '#737373'],
    angle: -14,
    blindCount: 14,
    spotlightRadius: 0.62,
    spotlightSoftness: 1.3,
    lightColor: '#ffe4c4',
    shine: 0.8,
    relief: 0.75,
    noise: 0.4
  },
  sunset: { gradientColors: ['#ffb347', '#ff6b3d', '#b91c1c'], angle: 32, spotlightRadius: 0.6, lightColor: '#ffd8b0' },
  lagoon: { gradientColors: ['#5eead4', '#0ea5e9', '#1e4a8a'], angle: -24, lightColor: '#e0f2fe' },
  venetian: { angle: 0, blindCount: 40, blindMinWidth: 18, spotlightRadius: 0.55, shine: 0.7, relief: 0.6 },
  perspective: { angle: 0, blindCount: 22, blindMinWidth: 20, perspective: 0.7, shine: 0.6 },
  drift: { gradientColors: ['#6ec9f7', '#0aa0ef', '#22d3ee'], gradientSpeed: 1.5, distortAmount: 12 }
};

export const LIGHT_SWAP: Record<string, Partial<GradientBlindsLook>> = {
  satin: { gradientColors: ['#3a86c8', '#0771a6'] },
  classic: { gradientColors: ['#3a86c8', '#0771a6'] },
  noir: { gradientColors: ['#404040', '#a3a3a3'], lightColor: '#ffffff' },
  sunset: { gradientColors: ['#ea580c', '#dc2626', '#991b1b'] },
  lagoon: { gradientColors: ['#0d9488', '#0284c7', '#1e4a8a'] },
  venetian: { gradientColors: ['#3a86c8', '#0771a6'] },
  perspective: { gradientColors: ['#3a86c8', '#0771a6'] },
  drift: { gradientColors: ['#3a86c8', '#0771a6', '#0891b2'] }
};

export const PRESET_OPTIONS = [
  { value: 'satin', label: 'Satin' },
  { value: 'classic', label: 'Classic' },
  { value: 'noir', label: 'Noir' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'lagoon', label: 'Lagoon' },
  { value: 'venetian', label: 'Venetian' },
  { value: 'perspective', label: 'Perspective' },
  { value: 'drift', label: 'Drift' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {}
  }: { light?: boolean; defaults?: Partial<GradientBlindsDemoProps>; props?: Partial<GradientBlindsDemoProps> } = {}
): Partial<GradientBlindsLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof GradientBlindsDemoProps]])
  ) as Partial<GradientBlindsLook>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
