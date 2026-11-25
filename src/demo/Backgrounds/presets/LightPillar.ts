export const LOOK = {
  topColor: '#0aa0ef',
  bottomColor: '#6ec9f7',
  intensity: 1,
  glowAmount: 0.002,
  bloom: 0.5,
  pillarWidth: 3,
  pillarHeight: 0.4,
  pillarRotation: 25,
  twist: 0.4,
  detail: 4,
  rotationSpeed: 0.3,
  flow: 1,
  noiseIntensity: 0.5
};

export type LightPillarLook = typeof LOOK;

export const PRESETS: Record<string, LightPillarLook> = {
  aurora: LOOK,
  ice: {
    ...LOOK,
    topColor: '#22d3ee',
    bottomColor: '#e0f2fe',
    pillarWidth: 2.5,
    pillarRotation: -15,
    twist: 0.6,
    bloom: 0.6
  },
  ember: {
    ...LOOK,
    topColor: '#ff4d1a',
    bottomColor: '#66caff',
    pillarRotation: 10,
    flow: 1.6,
    intensity: 1.1
  },
  spectre: {
    ...LOOK,
    topColor: '#c9cfd6',
    bottomColor: '#ffffff',
    pillarWidth: 2,
    pillarRotation: 0,
    glowAmount: 0.0018,
    bloom: 0.35
  },
  twister: {
    ...LOOK,
    topColor: '#107fb9',
    bottomColor: '#9dd9f9',
    pillarHeight: 0.8,
    twist: 1.05,
    rotationSpeed: 0.55,
    pillarRotation: -30
  },
  beam: {
    ...LOOK,
    topColor: '#2f8cff',
    bottomColor: '#e0efff',
    pillarWidth: 1.4,
    pillarRotation: 0,
    glowAmount: 0.0011,
    intensity: 1.15,
    detail: 3,
    bloom: 0.7
  }
};

export const PRESET_OPTIONS = [
  { value: 'aurora', label: 'Aurora' },
  { value: 'ice', label: 'Ice' },
  { value: 'ember', label: 'Ember' },
  { value: 'spectre', label: 'Spectre' },
  { value: 'twister', label: 'Twister' },
  { value: 'beam', label: 'Beam' }
];

export const presetProps = (
  value: string,
  {
    defaults = {} as Record<string, unknown>
  }: { light?: boolean; defaults?: Record<string, unknown>; props?: Record<string, unknown> } = {}
): Partial<LightPillarLook> => {
  const base = Object.fromEntries(Object.keys(LOOK).map(name => [name, defaults[name]])) as Partial<LightPillarLook>;
  return {
    ...base,
    ...PRESETS[value]
  };
};
