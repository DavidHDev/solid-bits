export type ClickEffectOption = 'tear' | 'burst' | 'none';

export const LOOK = {
  glitchColors: ['#ffffff', '#61b2dc'],
  baseColor: '#ffffff',
  font: 'system',
  charset: 'classic',
  fontSize: 14,
  spacing: 0.6,
  density: 0.9,
  baseOpacity: 0.16,
  glitchAmount: 0.5,
  speed: 1,
  flow: 0.5,
  smooth: true,
  edgeFade: 0,
  centerFade: 0
};

export const DEFAULT_PROPS = {
  preset: 'signature',
  ...LOOK,
  interactive: true,
  cursorRadius: 140,
  clickEffect: 'tear' as ClickEffectOption,
  intro: true,
  lightMode: false
};

export type LetterGlitchDemoProps = typeof DEFAULT_PROPS;

export const PRESETS: Record<string, Partial<LetterGlitchDemoProps>> = {
  signature: { ...LOOK },
  classic: {
    ...LOOK,
    glitchColors: ['#61b2dc', '#61b3dc'],
    baseColor: '#2b4539',
    baseOpacity: 1,
    spacing: 0.1,
    density: 1,
    glitchAmount: 0.85,
    flow: 0
  },
  terminal: { ...LOOK, glitchColors: ['#ffffff'], font: 'geist', smooth: false, glitchAmount: 0.7, flow: 0.3 },
  binary: { ...LOOK, charset: 'binary', glitchColors: ['#ffffff', '#60a5fa'], fontSize: 13, spacing: 0.8 },
  hex: { ...LOOK, charset: 'hex', font: 'code', glitchColors: ['#ffffff', '#24b1fb'] },
  sparse: { ...LOOK, density: 0.35, fontSize: 18, spacing: 1.1, speed: 0.6, flow: 0.8, edgeFade: 0.2 },
  storm: { ...LOOK, glitchAmount: 1, speed: 1.8, flow: 0.8, baseOpacity: 0.22 },
  pixel: { ...LOOK, font: 'pixel', charset: 'letters', fontSize: 10, spacing: 1, glitchColors: ['#ffffff', '#ff6b6b'] }
};

export const LIGHT_SWAP: Record<string, Partial<LetterGlitchDemoProps>> = {
  signature: { glitchColors: ['#181a1b', '#0f6d9f'], baseColor: '#181a1b' },
  classic: { glitchColors: ['#045078', '#0369a1'], baseColor: '#a3c2b2' },
  terminal: { glitchColors: ['#181a1b'], baseColor: '#181a1b' },
  binary: { glitchColors: ['#181a1b', '#2563eb'], baseColor: '#181a1b' },
  hex: { glitchColors: ['#181a1b', '#0690d9'], baseColor: '#181a1b' },
  sparse: { glitchColors: ['#181a1b', '#0f6d9f'], baseColor: '#181a1b' },
  storm: { glitchColors: ['#181a1b', '#0f6d9f'], baseColor: '#181a1b' },
  pixel: { glitchColors: ['#181a1b', '#e11d48'], baseColor: '#181a1b' }
};

export const PRESET_OPTIONS = [
  { value: 'signature', label: 'Signature' },
  { value: 'classic', label: 'Classic' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'binary', label: 'Binary' },
  { value: 'hex', label: 'Hex' },
  { value: 'sparse', label: 'Sparse' },
  { value: 'storm', label: 'Storm' },
  { value: 'pixel', label: 'Pixel' }
];

export const presetProps = (
  value: string,
  {
    light = false,
    defaults = {} as Partial<LetterGlitchDemoProps>
  }: { light?: boolean; defaults?: Partial<LetterGlitchDemoProps>; props?: Partial<LetterGlitchDemoProps> } = {}
): Partial<LetterGlitchDemoProps> => {
  const base = Object.fromEntries(
    Object.keys(DEFAULT_PROPS).map(name => [name, defaults[name as keyof LetterGlitchDemoProps]])
  ) as Partial<LetterGlitchDemoProps>;
  return {
    ...base,
    ...PRESETS[value],
    ...(light ? LIGHT_SWAP[value] : null)
  };
};
