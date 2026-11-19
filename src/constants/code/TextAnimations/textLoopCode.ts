import code from '@content/TextAnimations/TextLoop/TextLoop.tsx?raw';
import css from '@content/TextAnimations/TextLoop/TextLoop.css?raw';
import { createCodeObject } from '@/types/code';

export const textLoop = createCodeObject(code, 'TextAnimations/TextLoop', {
  dependencies: 'gsap',
  usage: `import TextLoop from './TextLoop';

<TextLoop
  text="Solid ✦ Bits"
  shape="wave"
  speed={90}
  direction="forward"
  separator="✦"
  curviness={90}
  tilt={0}
  fontSize={46}
  fontWeight={500}
  letterSpacing={0}
  uppercase
  ribbon
  ribbonColor="#0aa0ef"
  ribbonWidth={86}
  edgeFade={0}
  cross={false}
  crossAngle={16}
  draggable={false}
  scrollBoost={0}
  outline={false}
  pauseOnHover
/>`,
  css
});
