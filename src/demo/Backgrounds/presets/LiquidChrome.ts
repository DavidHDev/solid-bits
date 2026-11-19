export const LOOK = {
  color: '#ffffff',
  speed: 0.2,
  amplitude: 0.3,
  frequencyX: 3,
  frequencyY: 3,
  detail: 4,
  thickness: 1,
  depth: 1,
  roughness: 0.3,
  exposure: 1
};

export type LiquidChromeLook = typeof LOOK;

export const PRESETS: Record<string, Partial<LiquidChromeLook>> = {
  satin: {},
  polished: { roughness: 0.17 },
  velvet: { thickness: 1.1, roughness: 0.5 },
  mercury: {
    speed: 0.14,
    amplitude: 0.22,
    frequencyX: 2.5,
    frequencyY: 2.5,
    detail: 3,
    thickness: 1.15,
    roughness: 0.2
  },
  molten: { speed: 0.28, amplitude: 0.38, frequencyX: 3.2, frequencyY: 3.2, detail: 5, thickness: 0.85 },
  gold: { color: '#f2c46d' }
};

export const PRESET_OPTIONS = [
  { value: 'satin', label: 'Satin' },
  { value: 'polished', label: 'Polished' },
  { value: 'velvet', label: 'Velvet' },
  { value: 'mercury', label: 'Mercury' },
  { value: 'molten', label: 'Molten' },
  { value: 'gold', label: 'Gold' }
];

export const presetProps = (
  value: string,
  {
    defaults = {} as Partial<LiquidChromeLook>
  }: { light?: boolean; defaults?: Partial<LiquidChromeLook>; props?: Record<string, unknown> } = {}
): Partial<LiquidChromeLook> => {
  const base = Object.fromEntries(
    Object.keys(LOOK).map(name => [name, defaults[name as keyof LiquidChromeLook]])
  ) as Partial<LiquidChromeLook>;
  return {
    ...base,
    ...PRESETS[value]
  };
};
