import code from '@content/TextAnimations/DepthText/DepthText.tsx?raw';
import css from '@content/TextAnimations/DepthText/DepthText.css?raw';
import { createCodeObject } from '@/types/code';

export const depthText = createCodeObject(code, 'TextAnimations/DepthText', {
  dependencies: '',
  usage: `import DepthText from './DepthText';

<DepthText
  text="Elevate"
  layers={34}
  depth={2.4}
  depthColor="#0aa0ef"
  gradientDepth={false}
  hoverPush={0.5}
  float={false}
  tilt={7.5}
  pointerTracking
  smoothing={0.14}
  perspective={900}
  autoOrbit
  orbitSpeed={0.35}
  fontSize="clamp(3rem, 12vw, 7rem)"
  fontWeight={500}
  shadow
  outline={false}
  intro
/>`,
  css
});
