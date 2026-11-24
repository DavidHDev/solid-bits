import code from '@content/Backgrounds/ColorBends/ColorBends.tsx?raw';
import css from '@content/Backgrounds/ColorBends/ColorBends.css?raw';
import { createCodeObject } from '@/types/code';

export const colorBends = createCodeObject(code, 'Backgrounds/ColorBends', {
  dependencies: 'three',
  usage: `import ColorBends from './ColorBends';

<ColorBends
  colors={['#ff6b5c', '#5c9dff', '#00a7ff']}
  rotation={90}
  speed={0.2}
  scale={1}
  frequency={1}
  warpStrength={1}
  mouseInfluence={1}
  noise={0.15}
  parallax={0.5}
  iterations={1}
  intensity={1.5}
  bandWidth={6}
  transparent
/>`,
  css
});
