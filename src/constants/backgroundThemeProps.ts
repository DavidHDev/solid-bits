export const BACKGROUND_LIGHT_PROPS: Record<string, Record<string, unknown>> = {
  'aero-shards': {
    lightMode: true,
    shardColor: '#0aa0ef',
    accentColor: '#3d8bd4'
  },
  'acid-squares': {
    lightMode: true,
    color: '#ffffff',
    accentColor: '#3d8bd4',
    secondaryColor: '#0977ae'
  },
  antigravity: {
    lightMode: true
  },
  aurora: {
    lightMode: true
  },
  balatro: {
    lightMode: true
  },
  ballpit: {
    colors: ['#181a1b']
  },
  beams: {
    lightMode: true
  },
  'crt-warp': {
    lightMode: true,
    color: '#0977ae',
    backgroundColor: '#ffffff',
    bloom: 0.6,
    noise: 0.05
  },
  'color-bends': {
    lightMode: true,
    color: '#3288cf',
    intensity: 1.2,
    noise: 0.08
  },
  'dark-veil': {
    lightMode: true
  },
  dither: {
    waveColor: '#9e9e9e',
    backgroundColor: '#ffffff'
  },
  'dot-field': {
    lightMode: true
  },
  'dot-grid': {
    baseColor: '#d4d6d8',
    activeColor: '#181a1b',
    glow: 0.25
  },
  'faulty-terminal': {
    lightMode: true,
    tint: '#166534',
    brightness: 0.6
  },
  ferrofluid: {
    lightMode: true
  },
  'flux-lines': {
    lightMode: true
  },
  'floating-lines': {
    lightMode: true
  },
  galaxy: {
    lightMode: true
  },
  'gradient-blinds': {
    lightMode: true,
    gradientColors: ['#3a86c8', '#0771a6'],
    noise: 0.28
  },
  'gradient-waves': {
    lightMode: true,
    horizonColor: '#3d7fc1',
    waveColor: '#6ec9f7',
    crestColor: '#d6e8f7'
  },
  'ghost-fibers': {
    lightMode: true,
    glowColor: '#3a77bf',
    lineColor: '#1c3d66',
    secondaryColor: '#8db6e2'
  },
  'gradient-ascii': {
    lightMode: true,
    colors: ['#4f8ff7', '#e8f0ff', '#b4d0ff', '#7cb4fb']
  },
  grainient: {
    lightMode: true
  },
  'grid-distortion': {
    imageSrc: '/assets/demo/day-landscape.webp'
  },
  'grid-motion': {
    theme: 'light'
  },
  'grid-scan': {
    lightMode: true,
    linesColor: '#d4d6d8',
    scanColor: '#0284c7'
  },
  'holo-mosaic': {
    lightMode: true,
    color: '#ffffff',
    metalColor: '#6b7280',
    intensity: 1.4
  },
  hyperspeed: {
    theme: 'light',
    roadColor: '#eff1f2',
    lineColor: '#d0d4d7'
  },
  iridescence: {
    color: '#ffffff'
  },
  'letter-glitch': {
    lightMode: true,
    glitchColors: ['#181a1b', '#0f6d9f'],
    baseColor: '#181a1b'
  },
  'light-pillar': {
    lightMode: true,
    topColor: '#3288cf',
    bottomColor: '#5ba0d9',
    intensity: 1.15,
    mixBlendMode: 'normal'
  },
  'light-rays': {
    lightMode: true,
    raysColor: '#4aa8d8',
    saturation: 0.75,
    lightSpread: 0.38
  },
  'light-tunnel': {
    lightMode: true
  },
  lightfall: {
    lightMode: true,
    colors: ['#52575b'],
    backgroundColor: '#ffffff',
    backgroundGlow: 0
  },
  lightning: {
    lightMode: true
  },
  'line-waves': {
    lightMode: true
  },
  'liquid-chrome': {
    lightMode: true
  },
  'liquid-ether': {
    lightMode: true
  },
  'magic-rings': {
    theme: 'light',
    color: '#2F7FBF',
    colorTwo: '#0771a6'
  },
  'magnet-lines': {
    lineColor: '#27292a'
  },
  'molten-metal': {
    lightMode: true,
    colors: ['#6ec9f7', '#0977ae'],
    coreColor: '#0771a6'
  },
  orb: {
    backgroundColor: '#ffffff',
    hue: 0
  },
  particles: {
    lightMode: true
  },
  'pixel-blast': {
    lightMode: true,
    color: '#3288cf',
    accentColor: '#3288cf'
  },
  'pixel-snow': {
    lightMode: true,
    color: '#7f9cc4'
  },
  plasma: {
    lightMode: true
  },
  'plasma-wave': {
    lightMode: true,
    colors: ['#549cd7', '#00CFF5']
  },
  prism: {
    lightMode: true
  },
  'prismatic-burst': {
    lightMode: true,
    intensity: 1.15,
    colors: ['#519ad6', '#3888ca', '#0e7490']
  },
  radar: {
    lightMode: true,
    color: '#0a6c9f'
  },
  'ripple-grid': {
    lightMode: true
  },
  scanner: {
    lightMode: true,
    color1: '#0771a6',
    color2: '#3d8bd4',
    color3: '#181a1b'
  },
  'shape-grid': {
    lineColor: '#e4e6e7',
    hoverColor: '#181a1b',
    hoverFillColor: '#181a1b'
  },
  'shape-waves': {
    color: '#8a8a8a',
    hoverColor: '#181a1b',
    backgroundColor: '#ffffff'
  },
  'side-rays': {
    lightMode: true,
    rayColor1: '#0ba4f5',
    rayColor2: '#60a5fa'
  },
  silk: {
    lightMode: true,
    color: '#509ad6',
    noiseIntensity: 1.35
  },
  'sliced-waves': {
    lightMode: true,
    color1: '#30aef0',
    color2: '#1aa3d9',
    color3: '#0977ae'
  },
  'soft-aurora': {
    lightMode: true
  },
  threads: {
    color: '#52575b'
  },
  topography: {
    lightMode: true,
    color: '#0977ae'
  },
  waves: {
    lightMode: true,
    accentColor: '#181a1b'
  },
  'web-threads': {
    lightMode: true,
    colors: ['#3288cf', '#5ba0d9'],
    glow: 0.018,
    brightness: 0.82,
    grain: 0.015
  }
};

export const getBackgroundLightProps = (pathname?: string): Record<string, unknown> | null => {
  if (pathname === undefined && typeof window === 'undefined') return null;
  const [, category, slug] = (pathname ?? window.location.pathname).split('/');
  return category?.toLowerCase() === 'backgrounds' ? BACKGROUND_LIGHT_PROPS[slug?.toLowerCase()] || null : null;
};
