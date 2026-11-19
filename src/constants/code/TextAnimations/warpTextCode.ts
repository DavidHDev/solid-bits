import code from '@content/TextAnimations/WarpText/WarpText.tsx?raw';
import css from '@content/TextAnimations/WarpText/WarpText.css?raw';
import { createCodeObject } from '@/types/code';

export const warpText = createCodeObject(code, 'TextAnimations/WarpText', {
  dependencies: 'ogl',
  usage: `import WarpText from './WarpText';

<WarpText
  text="Bend the moment"
  warpStrength={0.08}
  warpScale={1.7}
  speed={0.55}
  lens="bulge"
  pointerInfluence={0.42}
  pointerStrength={0.38}
  refraction={0.018}
  chromatic={0.35}
  idleDrift={0.2}
  ripple
  clickRipple
  intro
  fontSize="clamp(3rem, 10vw, 9rem)"
  fontWeight={500}
  style={{ height: '320px' }}
/>`,
  css
});
